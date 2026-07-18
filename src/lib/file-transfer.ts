/**
 * In-memory hand-off for files between pages (e.g. drop on the homepage,
 * open in a tool). Nothing is persisted or uploaded — the reference lives
 * only in the browser tab's memory and is cleared as soon as it is read.
 */
let pending: File[] | null = null;

export function setPendingFiles(files: File[]) {
  pending = files;
}

export function takePendingFiles(): File[] | null {
  const p = pending;
  pending = null;
  return p;
}

export function hasPendingFiles(): boolean {
  return !!pending?.length;
}
