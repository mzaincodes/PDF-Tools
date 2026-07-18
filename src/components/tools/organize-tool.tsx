"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { RotateCw, Trash2, Loader2, Download, Undo2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadBlob, outputName } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PageItem {
  uid: string;
  src: number;
  rotation: number;
  thumb: string;
  w: number;
  h: number;
}

export function OrganizeTool({ file, onReset }: { file: File; onReset: () => void }) {
  const [pages, setPages] = React.useState<PageItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const dragIndex = React.useRef<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { renderThumbnails } = await import("@/lib/pdf/pdfjs");
        const buf = await file.arrayBuffer();
        const thumbs = await renderThumbnails(buf, 0.5);
        if (cancelled) return;
        setPages(
          thumbs.map((t, i) => ({
            uid: `p-${i}-${t.index}`,
            src: t.index,
            rotation: 0,
            thumb: t.dataUrl,
            w: t.width,
            h: t.height,
          }))
        );
      } catch {
        toast.error("Could not read this PDF.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);

  const rotate = (uid: string) =>
    setPages((ps) => ps.map((p) => (p.uid === uid ? { ...p, rotation: (p.rotation + 90) % 360 } : p)));
  const remove = (uid: string) => setPages((ps) => ps.filter((p) => p.uid !== uid));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= pages.length) return;
    setPages((ps) => {
      const next = [...ps];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const apply = async () => {
    if (!pages.length) {
      toast.error("You need at least one page.");
      return;
    }
    setBusy(true);
    try {
      const { applyOrganize } = await import("@/lib/pdf/operations");
      const bytes = await applyOrganize(
        file,
        pages.map((p) => ({ index: p.src, rotation: p.rotation }))
      );
      downloadBlob(bytes, outputName(file.name, "organized"));
      toast.success("Your organized PDF is ready.");
    } catch {
      toast.error("Something went wrong while rebuilding the PDF.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border bg-card/60 py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Rendering your pages…</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border bg-card/60 p-4 shadow-soft-lg backdrop-blur sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{pages.length} pages</span> · drag to reorder,
          rotate or delete
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onReset}>
            <Undo2 className="h-4 w-4" /> New file
          </Button>
          <Button variant="gradient" size="sm" onClick={apply} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Apply & download
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <AnimatePresence>
          {pages.map((page, i) => (
            <motion.div
              key={page.uid}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.2 }}
              draggable
              onDragStart={() => (dragIndex.current = i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex.current !== null && dragIndex.current !== i) move(dragIndex.current, i);
                dragIndex.current = null;
              }}
              className="group relative overflow-hidden rounded-xl border bg-background p-2 shadow-sm transition-shadow hover:shadow-soft"
            >
              <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-md bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={page.thumb}
                  alt={`Page ${page.src + 1}`}
                  className="max-h-full max-w-full object-contain transition-transform duration-300"
                  style={{ transform: `rotate(${page.rotation}deg)` }}
                  draggable={false}
                />
                <span className="absolute left-1.5 top-1.5 rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur">
                  {i + 1}
                </span>
                <GripVertical className="absolute right-1.5 top-1.5 h-4 w-4 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div className="mt-2 flex items-center justify-center gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => rotate(page.uid)} aria-label="Rotate page">
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(page.uid)}
                  aria-label="Delete page"
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {pages.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">All pages removed.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={onReset}>
            Start over
          </Button>
        </div>
      )}
    </div>
  );
}
