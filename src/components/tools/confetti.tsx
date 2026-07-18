"use client";

import * as React from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
  shape: number;
}

const COLORS = ["#6366f1", "#a855f7", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

/** Fires a one-shot confetti burst when `fire` flips to true. No dependencies. */
export function Confetti({ fire }: { fire: boolean }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (!fire) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const count = Math.min(160, Math.floor(w / 6));
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: w / 2 + (Math.random() - 0.5) * 120,
      y: h * 0.35,
      vx: (Math.random() - 0.5) * 9,
      vy: Math.random() * -11 - 4,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 6 + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: Math.floor(Math.random() * 2),
    }));

    let raf = 0;
    let frame = 0;
    const gravity = 0.28;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, w, h);
      let alive = false;
      for (const p of particles) {
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.vx *= 0.99;
        if (p.y < h + 20) alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - frame / 130);
        if (p.shape === 0) {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (alive && frame < 140) {
        raf = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, w, h);
      }
    };
    render();
    return () => cancelAnimationFrame(raf);
  }, [fire]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
      aria-hidden
    />
  );
}
