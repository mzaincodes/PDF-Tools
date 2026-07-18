import { rgb, type RGB } from "pdf-lib";

/** Read a File/Blob into an ArrayBuffer. */
export async function readBytes(file: File | Blob): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

/** Standard page sizes in PostScript points. */
export const PAGE_SIZES: Record<string, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
  legal: [612, 1008],
  a3: [841.89, 1190.55],
};

/** Convert a #rrggbb hex string to a pdf-lib RGB color (0..1). */
export function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean.padEnd(6, "0").slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  return rgb(
    Number.isFinite(r) ? r : 0,
    Number.isFinite(g) ? g : 0,
    Number.isFinite(b) ? b : 0
  );
}

/** Wrap raw PDF bytes into a Blob. */
export function pdfBlob(bytes: Uint8Array): Blob {
  // Copy into a fresh ArrayBuffer to satisfy strict BlobPart typing.
  return new Blob([bytes.slice()], { type: "application/pdf" });
}

/** Detect a named page format from width/height in points (within tolerance). */
export function detectFormat(width: number, height: number): string {
  const w = Math.min(width, height);
  const h = Math.max(width, height);
  const near = (a: number, b: number) => Math.abs(a - b) < 6;
  for (const [name, [pw, ph]] of Object.entries(PAGE_SIZES)) {
    if (near(w, Math.min(pw, ph)) && near(h, Math.max(pw, ph))) return name.toUpperCase();
  }
  return "Custom";
}

/** Points -> millimetres. */
export function ptToMm(pt: number): number {
  return Math.round((pt / 72) * 25.4 * 10) / 10;
}
