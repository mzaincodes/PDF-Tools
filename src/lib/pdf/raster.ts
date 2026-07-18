import { PDFDocument } from "pdf-lib";
import { loadPdfDocument, renderPageBlob } from "./pdfjs";

/**
 * Rasterize each page to a JPEG and rebuild the PDF. This is highly effective
 * for scan/image-heavy documents. Runs entirely in the browser.
 */
export async function rasterizeCompress(
  data: ArrayBuffer,
  scale: number,
  quality: number,
  onProgress?: (p: number) => void
): Promise<Uint8Array> {
  const doc = await loadPdfDocument(data.slice(0));
  const out = await PDFDocument.create();
  const total = doc.numPages;

  for (let i = 1; i <= total; i++) {
    const { blob, width, height } = await renderPageBlob(doc, i, scale, "image/jpeg", quality);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const img = await out.embedJpg(bytes);
    // Preserve the original point dimensions (scale back to 1x).
    const pw = width / scale;
    const ph = height / scale;
    const page = out.addPage([pw, ph]);
    page.drawImage(img, { x: 0, y: 0, width: pw, height: ph });
    onProgress?.(i / total);
  }
  await doc.destroy();
  return out.save();
}
