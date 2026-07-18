"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Eraser, Check } from "lucide-react";

interface SignaturePadProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onComplete: (dataUrl: string) => void;
}

const SIG_COLORS = ["#111827", "#1d4ed8", "#dc2626"];

export function SignaturePad({ open, onOpenChange, onComplete }: SignaturePadProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const drawing = React.useRef(false);
  const hasInk = React.useRef(false);
  const [color, setColor] = React.useState(SIG_COLORS[0]);
  const [typed, setTyped] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    hasInk.current = false;
  }, [open]);

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent) => {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.strokeStyle = color;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const draw = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    hasInk.current = true;
  };
  const end = () => (drawing.current = false);

  const clear = () => {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    hasInk.current = false;
  };

  const useDrawn = () => {
    if (!hasInk.current) return;
    onComplete(canvasRef.current!.toDataURL("image/png"));
    onOpenChange(false);
  };

  const useTyped = () => {
    if (!typed.trim()) return;
    const c = document.createElement("canvas");
    c.width = 600;
    c.height = 200;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = color;
    ctx.font = "72px 'Segoe Script', 'Brush Script MT', cursive";
    ctx.textBaseline = "middle";
    ctx.fillText(typed, 20, 110);
    onComplete(c.toDataURL("image/png"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add your signature</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="draw">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="draw">Draw</TabsTrigger>
            <TabsTrigger value="type">Type</TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="space-y-3">
            <canvas
              ref={canvasRef}
              onPointerDown={start}
              onPointerMove={draw}
              onPointerUp={end}
              onPointerLeave={end}
              className="h-44 w-full touch-none rounded-xl border-2 border-dashed bg-white"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {SIG_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full border-2 ${color === c ? "border-primary" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                    aria-label={`Ink color ${c}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={clear}>
                  <Eraser className="h-4 w-4" /> Clear
                </Button>
                <Button variant="gradient" size="sm" onClick={useDrawn}>
                  <Check className="h-4 w-4" /> Add
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="type" className="space-y-4">
            <div className="space-y-2">
              <Label>Type your name</Label>
              <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div
              className="grid h-28 place-items-center rounded-xl border bg-white text-4xl"
              style={{ color, fontFamily: "'Segoe Script','Brush Script MT',cursive" }}
            >
              {typed || "Preview"}
            </div>
            <div className="flex justify-end">
              <Button variant="gradient" size="sm" onClick={useTyped}>
                <Check className="h-4 w-4" /> Add signature
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
