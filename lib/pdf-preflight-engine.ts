import { PDFDocument } from "pdf-lib";
import { bleedMargins, containsBox, displayedSize, IDENTITY, imageDensity, multiply, type Matrix, type PdfBox } from "./pdf-preflight-math";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

export type PdfImage = NonNullable<ReturnType<typeof imageDensity>>;
export type PdfPageResult = { number: number; rotation: number; userUnit: number; media: PdfBox; crop: PdfBox; trim: PdfBox; bleed: PdfBox; explicitTrim: boolean; explicitBleed: boolean; size: {width:number;height:number}; margins: number[]; boxesValid: boolean; images: PdfImage[]; unassessedImages: number };
export type PdfInspection = { document: PDFDocumentProxy; pages: PdfPageResult[] };
export const PDF_MAX_BYTES = 40 * 1024 * 1024;
export const PDF_MAX_PAGES = 100;

async function inspectImages(page: PDFPageProxy, ops: Record<string, number>) {
  const list = await page.getOperatorList();
  let matrix: Matrix = [...IDENTITY], unsupportedGroupDepth = 0;
  const stack: Matrix[] = [], images: PdfImage[] = [];
  let unassessedImages = 0;
  const objectCache = new Map<string, Promise<{width:number;height:number} | null>>();
  function getImage(id: string) {
    if (!objectCache.has(id)) objectCache.set(id, new Promise(resolve => {
      const timer = setTimeout(() => resolve(null), 5000);
      const objects = id.startsWith("g_") ? page.commonObjs : page.objs;
      objects.get(id, (image: {width:number;height:number}) => { clearTimeout(timer); resolve(image); });
    }));
    return objectCache.get(id)!;
  }
  function add(width: number, height: number, transform = matrix) {
    const density = unsupportedGroupDepth ? null : imageDensity(width, height, transform, page.userUnit);
    if (density && images.length < 2000) images.push(density); else unassessedImages++;
  }
  for (let i = 0; i < list.fnArray.length; i++) {
    const fn = list.fnArray[i], args = list.argsArray[i];
    if (fn === ops.save) stack.push([...matrix]);
    else if (fn === ops.restore) matrix = stack.pop() ?? [...IDENTITY];
    else if (fn === ops.transform) matrix = multiply(matrix, args as Matrix);
    else if (fn === ops.paintFormXObjectBegin) { stack.push([...matrix]); if (args[0]) matrix = multiply(matrix, args[0]); }
    else if (fn === ops.paintFormXObjectEnd) matrix = stack.pop() ?? [...IDENTITY];
    // Transparency group render transforms depend on offscreen canvas state.
    // Count these placements as unassessed instead of inventing a PPI result.
    else if (fn === ops.beginGroup) { stack.push([...matrix]); unsupportedGroupDepth++; }
    else if (fn === ops.endGroup) { matrix = stack.pop() ?? [...IDENTITY]; unsupportedGroupDepth = Math.max(0,unsupportedGroupDepth-1); }
    else if (fn === ops.paintImageXObject || fn === ops.paintImageXObjectRepeat) {
      const image = await getImage(args[0]);
      if (fn === ops.paintImageXObject) { if(image) add(image.width,image.height); else unassessedImages++; }
      else for(let p=0;p<args[3].length;p+=2) { if(image) add(image.width,image.height,multiply(matrix,[args[1],0,0,args[2],args[3][p],args[3][p+1]])); else unassessedImages++; }
    } else if (fn === ops.paintInlineImageXObject) add(args[0].width,args[0].height);
    else if (fn === ops.paintInlineImageXObjectGroup) for(const entry of args[1]) add(entry.w,entry.h,multiply(matrix,entry.transform));
    else if ([ops.paintImageMaskXObject,ops.paintImageMaskXObjectGroup,ops.paintImageMaskXObjectRepeat].includes(fn)) unassessedImages++;
  }
  return {images, unassessedImages};
}

export async function inspectPdf(bytes: Uint8Array, onProgress: (page:number,total:number)=>void, cancelled: ()=>boolean): Promise<PdfInspection> {
  if(bytes.byteLength > PDF_MAX_BYTES) throw new Error("size");
  const geometry = await PDFDocument.load(bytes, { updateMetadata: false });
  if(geometry.getPageCount() > PDF_MAX_PAGES) throw new Error("pages");
  const pdfjs = await import("pdfjs-dist");
  const {default: workerUrl} = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const document = await pdfjs.getDocument({data:bytes.slice(), cMapUrl:"/pdf-support/cmaps/", cMapPacked:true, standardFontDataUrl:"/pdf-support/standard_fonts/", wasmUrl:"/pdf-support/wasm/", iccUrl:"/pdf-support/iccs/", useSystemFonts:true}).promise;
  try {
    const pages: PdfPageResult[] = [];
    for(let i=0;i<document.numPages;i++) {
      if(cancelled()) throw new Error("cancelled");
      onProgress(i+1,document.numPages);
      const page = await document.getPage(i+1), source = geometry.getPage(i);
      const media=source.getMediaBox(), crop=source.getCropBox(), trim=source.getTrimBox(), bleed=source.getBleedBox();
      const explicitTrim=Boolean(source.node.TrimBox()), explicitBleed=Boolean(source.node.BleedBox());
      pages.push({number:i+1,rotation:page.rotate,userUnit:page.userUnit,media,crop,trim,bleed,explicitTrim,explicitBleed,size:displayedSize(trim,page.rotate,page.userUnit),margins:bleedMargins(trim,bleed,media,page.userUnit),boxesValid:containsBox(media,trim)&&containsBox(media,bleed)&&containsBox(bleed,trim),...await inspectImages(page,pdfjs.OPS)});
      page.cleanup();
    }
    return {document,pages};
  } catch(error) { await document.loadingTask.destroy(); throw error; }
}
