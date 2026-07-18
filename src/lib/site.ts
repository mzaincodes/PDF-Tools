export const siteConfig = {
  name: "PDFpro",
  title: "PDFpro — All Your PDF Tools in One Place",
  description:
    "Merge, split, compress, convert, edit, sign and secure PDFs — 50+ professional tools that run entirely in your browser. 100% private, no uploads, no sign-up.",
  url: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://pdfpro.vercel.app",
  ogImage: "/opengraph-image",
  twitter: "@pdfpro",
  keywords: [
    "PDF tools",
    "merge PDF",
    "split PDF",
    "compress PDF",
    "edit PDF",
    "PDF to Word",
    "PDF editor online",
    "sign PDF",
    "OCR PDF",
    "free PDF tools",
    "private PDF editor",
  ],
} as const;

export type SiteConfig = typeof siteConfig;
