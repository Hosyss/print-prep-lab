export type TrustEvidenceLink = {
  label: string;
  href: string;
  description: string;
};

export type TrustEvidence = {
  heading: string;
  intro: string;
  links: TrustEvidenceLink[];
};

export const TRUST_EVIDENCE: Record<string, TrustEvidence> = {
  about: {
    heading: "Verify the project, publisher and calculation code",
    intro: "The claims on this page are backed by public project records rather than by invented credentials. These links show who maintains the project, where the calculation code lives and how arithmetic defects are tested.",
    links: [
      {
        label: "Maintainer profile — Hossam Eldeen",
        href: "https://github.com/Hosyss",
        description: "Public GitHub profile for the account that owns and maintains the Print Prep Lab repository.",
      },
      {
        label: "Public source and change history",
        href: "https://github.com/Hosyss/print-prep-lab",
        description: "Public source repository, commit history, issue tracker and release work for Print Prep Lab.",
      },
      {
        label: "Calculation implementation",
        href: "https://github.com/Hosyss/print-prep-lab/blob/main/lib/print-math.ts",
        description: "Shared functions for unit conversion, pixel requirements, effective PPI, crop retention and bleed calculations.",
      },
      {
        label: "Calculation tests",
        href: "https://github.com/Hosyss/print-prep-lab/blob/main/tests/print-math.test.mjs",
        description: "Deterministic tests for the same print-math functions used by the public tools.",
      },
    ],
  },
  methodology: {
    heading: "Methodology you can inspect and reproduce",
    intro: "The formulas described above are implemented in one shared module and checked by deterministic tests. External references are used for fixed definitions; provider-specific production requirements are deliberately left editable.",
    links: [
      {
        label: "Shared print-math module",
        href: "https://github.com/Hosyss/print-prep-lab/blob/main/lib/print-math.ts",
        description: "Inspect the actual conversion, PPI, crop and bleed functions behind the calculators.",
      },
      {
        label: "Math regression tests",
        href: "https://github.com/Hosyss/print-prep-lab/blob/main/tests/print-math.test.mjs",
        description: "Known conversions, boundaries and invalid-input cases that must keep passing after code changes.",
      },
      {
        label: "Rendered-page checks",
        href: "https://github.com/Hosyss/print-prep-lab/blob/main/tests/rendered-html.test.mjs",
        description: "Checks for public metadata, canonical URLs, content structure and rendered route behavior.",
      },
      {
        label: "NIST SI length conversion reference",
        href: "https://www.nist.gov/pml/owm/si-units-length",
        description: "Primary measurement reference used for the exact 25.4 millimetres per inch conversion.",
      },
    ],
  },
  sources: {
    heading: "Primary references and what each one supports",
    intro: "A source is useful only when its role is clear. The links below separate fixed standards and definitions from software terminology and provider-specific production instructions.",
    links: [
      {
        label: "ISO 216:2007",
        href: "https://www.iso.org/standard/36631.html",
        description: "Physical A-series paper-size standard. Print Prep Lab treats these as trim dimensions, not as fixed pixel dimensions.",
      },
      {
        label: "NIST — SI units of length",
        href: "https://www.nist.gov/pml/owm/si-units-length",
        description: "Reference for the exact relationship between inch and millimetre used in unit conversion.",
      },
      {
        label: "Adobe — image resolution for printing",
        href: "https://helpx.adobe.com/photoshop/desktop/crop-resize-transform/resize-adjust-resolution/resolution-specs-for-printing-images.html",
        description: "Reference for pixel dimensions, physical document size, resolution and resampling terminology.",
      },
      {
        label: "Print Prep Lab methodology",
        href: "/methodology",
        description: "Shows how the external definitions are converted into the site's own formulas, rounding and limitation rules.",
      },
    ],
  },
};
