import {PDFDocument, PDFName, PDFNumber, degrees, rgb} from 'pdf-lib';
import {deflateSync} from 'node:zlib';
export function solidPng(width,height) {
  function crc(bytes){let n=0xffffffff;for(const b of bytes){n^=b;for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;}return(n^0xffffffff)>>>0;}
  function chunk(name,data){const tag=Buffer.from(name);const length=Buffer.alloc(4);length.writeUInt32BE(data.length);const checksum=Buffer.alloc(4);checksum.writeUInt32BE(crc(Buffer.concat([tag,data])));return Buffer.concat([length,tag,data,checksum]);}
  const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=2;
  const raw=Buffer.alloc((width*3+1)*height);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const o=y*(width*3+1)+1+x*3;raw[o]=27;raw[o+1]=96;raw[o+2]=172;}
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
export async function mixedPdf() {
  const doc=await PDFDocument.create(),mm=n=>n*72/25.4,image=await doc.embedPng(solidPng(600,300));
  const a4=doc.addPage([mm(216),mm(303)]);a4.setTrimBox(mm(3),mm(3),mm(210),mm(297));a4.setBleedBox(0,0,mm(216),mm(303));a4.drawRectangle({x:0,y:0,width:mm(216),height:mm(303),color:rgb(.96,.97,.99)});a4.drawImage(image,{x:mm(18),y:mm(205),width:144,height:72});a4.drawText('A4 PRINT CHECK',{x:mm(18),y:mm(190),size:24});a4.drawText('600 x 300 pixels / 2 x 1 inches / 300 PPI',{x:mm(18),y:mm(175),size:12});
  const second=doc.addPage([612,792]);second.setRotation(degrees(90));second.drawImage(image,{x:50,y:80,width:288,height:144});second.drawText('No explicit trim or bleed',{x:50,y:250,size:20});
  const embedded=await doc.embedPage(a4);const third=doc.addPage([mm(432),mm(606)]);third.drawPage(embedded,{x:0,y:0,width:mm(432),height:mm(606)});third.node.set(PDFName.of('UserUnit'),PDFNumber.of(2));
  return Buffer.from(await doc.save());
}
export async function tooManyPagesPdf(){const doc=await PDFDocument.create();for(let i=0;i<101;i++)doc.addPage([100,100]);return Buffer.from(await doc.save());}
