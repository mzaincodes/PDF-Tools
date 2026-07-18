"use client";

import * as React from "react";
import * as fabric from "fabric";
import { toast } from "sonner";
import {
  MousePointer2,
  Type,
  Pencil,
  Square,
  Circle,
  Minus,
  Highlighter,
  Eraser,
  ImagePlus,
  PenTool,
  StickyNote,
  SquareM,
  Trash2,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Layers,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { SignaturePad } from "./signature-pad";
import { downloadBlob, outputName, clamp } from "@/lib/utils";
import { cn } from "@/lib/utils";

type ToolId =
  | "select"
  | "text"
  | "draw"
  | "rect"
  | "ellipse"
  | "line"
  | "highlight"
  | "whiteout"
  | "redact"
  | "image"
  | "signature"
  | "note";

const TOOLS: { id: ToolId; icon: React.ElementType; label: string }[] = [
  { id: "select", icon: MousePointer2, label: "Select" },
  { id: "text", icon: Type, label: "Text" },
  { id: "draw", icon: Pencil, label: "Draw" },
  { id: "highlight", icon: Highlighter, label: "Highlight" },
  { id: "rect", icon: Square, label: "Rectangle" },
  { id: "ellipse", icon: Circle, label: "Ellipse" },
  { id: "line", icon: Minus, label: "Line" },
  { id: "note", icon: StickyNote, label: "Sticky note" },
  { id: "whiteout", icon: Eraser, label: "Whiteout" },
  { id: "redact", icon: SquareM, label: "Redact" },
  { id: "image", icon: ImagePlus, label: "Image" },
  { id: "signature", icon: PenTool, label: "Signature" },
];

export function PdfEditor({
  file,
  initialTool = "select",
  onReset,
}: {
  file: File;
  initialTool?: ToolId;
  onReset: () => void;
}) {
  const canvasElRef = React.useRef<HTMLCanvasElement>(null);
  const centerRef = React.useRef<HTMLDivElement>(null);
  const fabricRef = React.useRef<fabric.Canvas | null>(null);
  const docRef = React.useRef<Awaited<ReturnType<typeof import("@/lib/pdf/pdfjs")["loadPdfDocument"]>> | null>(null);
  const pagesDataRef = React.useRef<Record<number, object[]>>({});
  const dimsRef = React.useRef<Record<number, { w: number; h: number }>>({});
  const toolRef = React.useRef<ToolId>(initialTool);
  const colorRef = React.useRef("#7c3aed");
  const strokeRef = React.useRef(3);
  const fontRef = React.useRef(24);
  const isRestoring = React.useRef(false);
  const history = React.useRef<{ stack: string[]; index: number }>({ stack: [], index: -1 });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [tool, setTool] = React.useState<ToolId>(initialTool);
  const [color, setColor] = React.useState("#7c3aed");
  const [stroke, setStroke] = React.useState(3);
  const [font, setFont] = React.useState(24);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [numPages, setNumPages] = React.useState(0);
  const [zoom, setZoom] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [exporting, setExporting] = React.useState(false);
  const [thumbs, setThumbs] = React.useState<string[]>([]);
  const [objCount, setObjCount] = React.useState(0);
  const [hasSelection, setHasSelection] = React.useState(false);
  const [selOpacity, setSelOpacity] = React.useState(100);
  const [sigOpen, setSigOpen] = React.useState(false);

  React.useEffect(() => {
    toolRef.current = tool;
    const c = fabricRef.current;
    if (c) c.isDrawingMode = tool === "draw";
    if (tool === "image") fileInputRef.current?.click();
    if (tool === "signature") setSigOpen(true);
  }, [tool]);

  React.useEffect(() => {
    colorRef.current = color;
  }, [color]);
  React.useEffect(() => {
    strokeRef.current = stroke;
  }, [stroke]);
  React.useEffect(() => {
    fontRef.current = font;
  }, [font]);

  /* ---------------- snapshot / history ---------------- */
  const snapshot = React.useCallback(() => {
    const c = fabricRef.current;
    if (!c || isRestoring.current) return;
    const json = JSON.stringify(c.getObjects().map((o) => o.toObject()));
    const h = history.current;
    h.stack = h.stack.slice(0, h.index + 1);
    h.stack.push(json);
    h.index = h.stack.length - 1;
    setObjCount(c.getObjects().length);
  }, []);

  const restore = React.useCallback(async (json: string) => {
    const c = fabricRef.current;
    if (!c) return;
    isRestoring.current = true;
    c.remove(...c.getObjects());
    try {
      const data = JSON.parse(json) as object[];
      if (data.length) {
        const objs = await fabric.util.enlivenObjects(data);
        objs.forEach((o) => c.add(o as fabric.FabricObject));
      }
    } catch {
      /* ignore */
    }
    c.requestRenderAll();
    setObjCount(c.getObjects().length);
    isRestoring.current = false;
  }, []);

  const undo = React.useCallback(() => {
    const h = history.current;
    if (h.index <= 0) return;
    h.index--;
    restore(h.stack[h.index]);
  }, [restore]);

  const redo = React.useCallback(() => {
    const h = history.current;
    if (h.index >= h.stack.length - 1) return;
    h.index++;
    restore(h.stack[h.index]);
  }, [restore]);

  /* ---------------- object creation ---------------- */
  const addObject = React.useCallback((obj: fabric.FabricObject, editing = false) => {
    const c = fabricRef.current;
    if (!c) return;
    c.add(obj);
    c.setActiveObject(obj);
    if (editing && obj instanceof fabric.Textbox) {
      obj.enterEditing();
      obj.selectAll?.();
    }
    c.requestRenderAll();
    setTool("select");
  }, []);

  const placeAt = React.useCallback(
    (x: number, y: number) => {
      const t = toolRef.current;
      const col = colorRef.current;
      const sw = strokeRef.current;
      switch (t) {
        case "text":
          addObject(
            new fabric.Textbox("Type here", {
              left: x,
              top: y,
              width: 240,
              fontSize: fontRef.current,
              fill: col,
              fontFamily: "Inter, system-ui, sans-serif",
            }),
            true
          );
          break;
        case "note":
          addObject(
            new fabric.Textbox("Note…", {
              left: x,
              top: y,
              width: 180,
              fontSize: 16,
              fill: "#78350f",
              backgroundColor: "#fde68a",
              padding: 10,
              fontFamily: "Inter, system-ui, sans-serif",
            }),
            true
          );
          break;
        case "rect":
          addObject(new fabric.Rect({ left: x, top: y, width: 150, height: 90, fill: "transparent", stroke: col, strokeWidth: sw }));
          break;
        case "ellipse":
          addObject(new fabric.Ellipse({ left: x, top: y, rx: 75, ry: 48, fill: "transparent", stroke: col, strokeWidth: sw }));
          break;
        case "line":
          addObject(new fabric.Line([x, y, x + 170, y], { stroke: col, strokeWidth: sw }));
          break;
        case "highlight":
          addObject(new fabric.Rect({ left: x, top: y, width: 190, height: 22, fill: col, opacity: 0.35, stroke: "transparent" }));
          break;
        case "whiteout":
          addObject(new fabric.Rect({ left: x, top: y, width: 150, height: 40, fill: "#ffffff", stroke: "transparent" }));
          break;
        case "redact":
          addObject(new fabric.Rect({ left: x, top: y, width: 150, height: 30, fill: "#000000", stroke: "transparent" }));
          break;
        default:
          break;
      }
    },
    [addObject]
  );

  const addImageFromUrl = React.useCallback(async (url: string, maxSize = 320) => {
    const c = fabricRef.current;
    if (!c) return;
    const img = await fabric.FabricImage.fromURL(url);
    const scale = Math.min(maxSize / (img.width || maxSize), maxSize / (img.height || maxSize), 1);
    img.scale(scale);
    img.set({ left: c.getWidth() / (2 * c.getZoom()) - (img.getScaledWidth() / 2), top: 120 });
    c.add(img);
    c.setActiveObject(img);
    c.requestRenderAll();
    setTool("select");
  }, []);

  /* ---------------- page rendering ---------------- */
  const renderInto = React.useCallback(async (idx: number) => {
    const c = fabricRef.current;
    if (!c) return;
    setLoading(true);
    try {
      const { renderPage } = await import("@/lib/pdf/pdfjs");
      const doc = docRef.current!;
      // Fit the rendered page to the available canvas column width so the whole
      // page is visible without horizontal scrolling.
      const page = await doc.getPage(idx + 1);
      const pageWidth = page.getViewport({ scale: 1 }).width;
      const avail = (centerRef.current?.clientWidth ?? 900) - 40;
      const scale = clamp(avail / pageWidth, 0.5, 3);
      const { dataUrl, width, height } = await renderPage(doc, idx + 1, scale, "image/png");
      dimsRef.current[idx] = { w: width, h: height };
      c.remove(...c.getObjects());
      c.setDimensions({ width, height });
      c.setZoom(1);
      setZoom(1);
      const bg = await fabric.FabricImage.fromURL(dataUrl);
      bg.set({ selectable: false, evented: false });
      c.backgroundImage = bg;
      const data = pagesDataRef.current[idx];
      if (data?.length) {
        const objs = await fabric.util.enlivenObjects(data);
        objs.forEach((o) => c.add(o as fabric.FabricObject));
      }
      c.requestRenderAll();
      history.current = { stack: [JSON.stringify((data as object[]) ?? [])], index: 0 };
      setObjCount(c.getObjects().length);
    } finally {
      setLoading(false);
    }
  }, []);

  const goToPage = React.useCallback(
    async (next: number) => {
      const c = fabricRef.current;
      if (!c || next < 0 || next >= numPages || next === pageIndex) return;
      pagesDataRef.current[pageIndex] = c.getObjects().map((o) => o.toObject());
      setPageIndex(next);
      await renderInto(next);
    },
    [numPages, pageIndex, renderInto]
  );

  /* ---------------- init ---------------- */
  React.useEffect(() => {
    let disposed = false;
    const el = canvasElRef.current;
    if (!el) return;
    const canvas = new fabric.Canvas(el, { preserveObjectStacking: true, selection: true });
    fabricRef.current = canvas;
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);

    const syncSelection = () => {
      const active = canvas.getActiveObject();
      setHasSelection(!!active);
      if (active) setSelOpacity(Math.round((active.opacity ?? 1) * 100));
    };

    canvas.on("mouse:down", (opt) => {
      const t = toolRef.current;
      if (t === "select" || t === "draw" || t === "image" || t === "signature") return;
      if (opt.target) return; // clicked an existing object
      const p = canvas.getPointer(opt.e);
      placeAt(p.x, p.y);
    });
    canvas.on("path:created", () => snapshot());
    canvas.on("object:added", () => snapshot());
    canvas.on("object:modified", () => snapshot());
    canvas.on("object:removed", () => snapshot());
    canvas.on("selection:created", syncSelection);
    canvas.on("selection:updated", syncSelection);
    canvas.on("selection:cleared", syncSelection);

    (async () => {
      try {
        const { loadPdfDocument, renderThumbnails } = await import("@/lib/pdf/pdfjs");
        const buf = await file.arrayBuffer();
        const doc = await loadPdfDocument(buf.slice(0));
        if (disposed) return;
        docRef.current = doc;
        setNumPages(doc.numPages);
        await renderInto(0);
        const th = await renderThumbnails(buf.slice(0), 0.25);
        if (!disposed) setThumbs(th.map((t) => t.dataUrl));
      } catch {
        toast.error("Could not open this PDF in the editor.");
        setLoading(false);
      }
    })();

    const onKey = (e: KeyboardEvent) => {
      const active = document.activeElement?.tagName;
      if (active === "INPUT" || active === "TEXTAREA") return;
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
      if ((e.key === "Delete" || e.key === "Backspace") && canvas.getActiveObject()) {
        e.preventDefault();
        canvas.remove(...canvas.getActiveObjects());
        canvas.discardActiveObject();
        canvas.requestRenderAll();
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      disposed = true;
      window.removeEventListener("keydown", onKey);
      canvas.dispose();
      docRef.current?.destroy();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- actions ---------------- */
  const applyZoom = (z: number) => {
    const c = fabricRef.current;
    const dims = dimsRef.current[pageIndex];
    if (!c || !dims) return;
    const nz = clamp(z, 0.4, 2.5);
    c.setZoom(nz);
    c.setDimensions({ width: dims.w * nz, height: dims.h * nz });
    setZoom(nz);
  };

  const deleteSelected = () => {
    const c = fabricRef.current;
    if (!c) return;
    c.remove(...c.getActiveObjects());
    c.discardActiveObject();
    c.requestRenderAll();
  };

  const changeColor = (v: string) => {
    setColor(v);
    const c = fabricRef.current;
    const active = c?.getActiveObject();
    if (active) {
      if (active instanceof fabric.Textbox) active.set("fill", v);
      else if ("stroke" in active && active.stroke && active.stroke !== "transparent") active.set("stroke", v);
      else active.set("fill", v);
      c?.requestRenderAll();
    }
  };

  const changeOpacity = (v: number) => {
    setSelOpacity(v);
    const c = fabricRef.current;
    const active = c?.getActiveObject();
    if (active) {
      active.set("opacity", v / 100);
      c?.requestRenderAll();
    }
  };

  const layer = (dir: "up" | "down") => {
    const c = fabricRef.current;
    const active = c?.getActiveObject();
    if (!c || !active) return;
    if (dir === "up") c.bringObjectForward(active);
    else c.sendObjectBackwards(active);
    c.requestRenderAll();
    snapshot();
  };

  const download = async () => {
    const c = fabricRef.current;
    if (!c) return;
    setExporting(true);
    try {
      pagesDataRef.current[pageIndex] = c.getObjects().map((o) => o.toObject());
      const { PDFDocument } = await import("pdf-lib");
      const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const total = src.getPageCount();
      for (let i = 0; i < total; i++) {
        const data = pagesDataRef.current[i];
        if (!data?.length) continue;
        const dims = dimsRef.current[i];
        if (!dims) continue;
        const el = document.createElement("canvas");
        const sc = new fabric.StaticCanvas(el, { width: dims.w, height: dims.h, enableRetinaScaling: false });
        const objs = await fabric.util.enlivenObjects(data);
        objs.forEach((o) => sc.add(o as fabric.FabricObject));
        sc.renderAll();
        const url = sc.toDataURL({ format: "png", multiplier: 1 });
        sc.dispose();
        const bytes = Uint8Array.from(atob(url.split(",")[1]), (ch) => ch.charCodeAt(0));
        const png = await src.embedPng(bytes);
        const page = src.getPage(i);
        const { width, height } = page.getSize();
        page.drawImage(png, { x: 0, y: 0, width, height });
      }
      const out = await src.save();
      downloadBlob(out, outputName(file.name, "edited"));
      toast.success("Your edited PDF is ready.");
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-soft-lg">
      {/* Top toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b bg-card/80 p-2 backdrop-blur">
        <div className="flex flex-wrap items-center gap-0.5">
          {TOOLS.map((t) => (
            <Tooltip key={t.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={tool === t.id ? "gradient" : "ghost"}
                  size="icon-sm"
                  onClick={() => setTool(t.id)}
                  aria-label={t.label}
                  aria-pressed={tool === t.id}
                >
                  <t.icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <input
          type="color"
          value={color}
          onChange={(e) => changeColor(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded-md border bg-transparent p-0.5"
          aria-label="Color"
        />

        <Separator orientation="vertical" className="mx-1 h-6" />

        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon-sm" onClick={undo} aria-label="Undo">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={redo} aria-label="Redo">
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={deleteSelected} aria-label="Delete" disabled={!hasSelection}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon-sm" onClick={() => applyZoom(zoom - 0.15)} aria-label="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="w-11 text-center text-xs tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon-sm" onClick={() => applyZoom(zoom + 0.15)} aria-label="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onReset}>
            New file
          </Button>
          <Button variant="gradient" size="sm" onClick={download} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download
          </Button>
        </div>
      </div>

      <div className="flex min-h-[60vh]">
        {/* Left: thumbnails */}
        <aside className="hidden w-32 shrink-0 overflow-y-auto border-r bg-muted/30 p-2 md:block">
          <p className="px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Pages</p>
          <div className="space-y-2">
            {thumbs.map((src, i) => (
              <button
                key={i}
                onClick={() => goToPage(i)}
                className={cn(
                  "block w-full overflow-hidden rounded-lg border-2 transition-all",
                  i === pageIndex ? "border-primary shadow-sm" : "border-transparent hover:border-border"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Page ${i + 1}`} className="w-full" />
                <span className="block bg-card py-0.5 text-center text-[10px] text-muted-foreground">{i + 1}</span>
              </button>
            ))}
            {!thumbs.length &&
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] w-full animate-pulse rounded-lg bg-muted" />
              ))}
          </div>
        </aside>

        {/* Center: canvas */}
        <div ref={centerRef} className="relative flex-1 overflow-auto bg-muted/40 p-4">
          {loading && (
            <div className="absolute inset-0 z-10 grid place-items-center bg-background/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <span className="text-sm">Rendering page…</span>
              </div>
            </div>
          )}
          <div className="mx-auto w-fit shadow-soft-lg ring-1 ring-black/5">
            <canvas ref={canvasElRef} />
          </div>
        </div>

        {/* Right: properties */}
        <aside className="hidden w-60 shrink-0 space-y-5 overflow-y-auto border-l bg-card/50 p-4 lg:block">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Style</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Stroke width</Label>
                <Slider value={[stroke]} min={1} max={16} step={1} onValueChange={(v) => setStroke(v[0])} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Font size</Label>
                <Slider value={[font]} min={10} max={72} step={1} onValueChange={(v) => setFont(v[0])} />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Selection</p>
            {hasSelection ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Opacity</Label>
                  <Slider value={[selOpacity]} min={10} max={100} step={5} onValueChange={(v) => changeOpacity(v[0])} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Layer order</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => layer("up")}>
                      <ArrowUp className="h-4 w-4" /> Front
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => layer("down")}>
                      <ArrowDown className="h-4 w-4" /> Back
                    </Button>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full text-destructive" onClick={deleteSelected}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            ) : (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Layers className="h-4 w-4" /> Select an object to edit its properties.
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* Bottom status bar */}
      <div className="flex items-center justify-between border-t bg-card/80 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
        <div className="flex items-center gap-3">
          <button onClick={() => goToPage(pageIndex - 1)} disabled={pageIndex === 0} className="disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="tabular-nums">
            Page {pageIndex + 1} of {numPages || "–"}
          </span>
          <button onClick={() => goToPage(pageIndex + 1)} disabled={pageIndex >= numPages - 1} className="disabled:opacity-40">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span>{objCount} objects</span>
          <span className="hidden sm:inline">100% private · in-browser</span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            const url = URL.createObjectURL(f);
            addImageFromUrl(url).finally(() => setTimeout(() => URL.revokeObjectURL(url), 5000));
          }
          e.target.value = "";
          setTool("select");
        }}
      />

      <SignaturePad
        open={sigOpen}
        onOpenChange={(v) => {
          setSigOpen(v);
          if (!v) setTool("select");
        }}
        onComplete={(url) => addImageFromUrl(url, 260)}
      />
    </div>
  );
}
