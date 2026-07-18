"use client";

import * as React from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ZoomIn,
  ZoomOut,
  Download,
  Maximize2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadBlob, clamp } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
}

// Stable empty options object — avoids any external CDN fetches so the viewer
// stays fully self-contained and private.
const DOC_OPTIONS = {};

export function PdfViewer({ file, compact = false }: { file: File; compact?: boolean }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = React.useState(0);
  const [zoom, setZoom] = React.useState(1);
  const [baseWidth, setBaseWidth] = React.useState(600);
  const [current, setCurrent] = React.useState(1);
  const pageRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  const fileMemo = React.useMemo(() => file, [file]);

  React.useEffect(() => {
    const measure = () => {
      const w = containerRef.current?.clientWidth ?? 700;
      setBaseWidth(Math.min(w - (compact ? 16 : 48), compact ? 900 : 1100));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [compact]);

  const scrollToPage = (p: number) => {
    const target = clamp(p, 1, numPages);
    pageRefs.current[target - 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setCurrent(target);
  };

  const printFile = () => {
    const url = URL.createObjectURL(file);
    const w = window.open(url);
    if (w) w.onload = () => w.print();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-card/80 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => scrollToPage(current - 1)} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[5rem] text-center text-sm tabular-nums text-muted-foreground">
            {current} / {numPages || "–"}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={() => scrollToPage(current + 1)} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => setZoom((z) => clamp(z - 0.2, 0.5, 3))} aria-label="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-sm tabular-nums text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="icon-sm" onClick={() => setZoom((z) => clamp(z + 0.2, 0.5, 3))} aria-label="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setZoom(1)} aria-label="Reset zoom">
            <Maximize2 className="h-4 w-4" />
          </Button>
          {!compact && (
            <>
              <Button variant="ghost" size="icon-sm" onClick={printFile} aria-label="Print">
                <Printer className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => downloadBlob(file, file.name)} aria-label="Download">
                <Download className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Page stack */}
      <div
        ref={containerRef}
        className="max-h-[75vh] overflow-auto bg-muted/40 p-4 sm:p-6"
        style={{ scrollBehavior: "smooth" }}
      >
        <Document
          file={fileMemo}
          options={DOC_OPTIONS}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          loading={
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading document…
            </div>
          }
          error={<p className="py-20 text-center text-sm text-destructive">Could not load this PDF.</p>}
          className="flex flex-col items-center gap-4"
        >
          {Array.from({ length: numPages }, (_, i) => (
            <div
              key={i}
              ref={(el) => {
                pageRefs.current[i] = el;
              }}
              className="overflow-hidden rounded-lg shadow-soft ring-1 ring-black/5"
            >
              <Page
                pageNumber={i + 1}
                width={baseWidth * zoom}
                renderTextLayer={!compact}
                renderAnnotationLayer={!compact}
                loading={<Skeleton style={{ width: baseWidth * zoom, height: baseWidth * zoom * 1.3 }} />}
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}
