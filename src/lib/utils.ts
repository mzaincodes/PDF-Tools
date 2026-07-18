import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge tailwind class names with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a byte count into a human friendly string. */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/** Compact number formatter, e.g. 10_000_000 -> "10M". */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Percentage delta between two byte sizes (positive = reduction). */
export function reductionPercent(before: number, after: number): number {
  if (before <= 0) return 0;
  return Math.max(0, Math.round(((before - after) / before) * 100));
}

/** Trigger a browser download for the given bytes without touching a server. */
export function downloadBlob(
  data: Blob | ArrayBuffer | Uint8Array,
  filename: string,
  mime = "application/pdf"
) {
  const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke on the next tick so the download has time to start.
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Strip the extension from a filename. */
export function baseName(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "");
}

/** Build a friendly output filename e.g. `report` + `-merged` -> `report-merged.pdf`. */
export function outputName(source: string | undefined, suffix: string, ext = "pdf"): string {
  const base = source ? baseName(source) : "document";
  const clean = base.replace(/[^\w\-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return `${clean || "document"}-${suffix}.${ext}`;
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Parse a page-range expression like "1-3, 5, 8-10" against a total page count. */
export function parsePageRanges(expr: string, totalPages: number): number[] {
  const pages = new Set<number>();
  const parts = expr.split(",").map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const range = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      let start = parseInt(range[1], 10);
      let end = parseInt(range[2], 10);
      if (start > end) [start, end] = [end, start];
      for (let i = start; i <= end; i++) {
        if (i >= 1 && i <= totalPages) pages.add(i);
      }
    } else {
      const single = parseInt(part, 10);
      if (!Number.isNaN(single) && single >= 1 && single <= totalPages) pages.add(single);
    }
  }
  return Array.from(pages).sort((a, b) => a - b);
}

/** A tiny promise delay helper. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Deterministic slug helper. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
