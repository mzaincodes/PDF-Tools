"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Loader2, GitCompareArrows, Plus, Minus, Undo2, Equal } from "lucide-react";
import { Button } from "@/components/ui/button";

const PdfViewer = dynamic(() => import("./pdf-viewer").then((m) => m.PdfViewer), { ssr: false });

interface DiffResult {
  added: string[];
  removed: string[];
  same: number;
}

function diffText(a: string, b: string): DiffResult {
  const linesA = a.split("\n").map((l) => l.trim()).filter(Boolean);
  const linesB = b.split("\n").map((l) => l.trim()).filter(Boolean);
  const countA = new Map<string, number>();
  const countB = new Map<string, number>();
  linesA.forEach((l) => countA.set(l, (countA.get(l) ?? 0) + 1));
  linesB.forEach((l) => countB.set(l, (countB.get(l) ?? 0) + 1));

  const removed: string[] = [];
  const added: string[] = [];
  let same = 0;
  for (const [line, n] of countA) {
    const inB = countB.get(line) ?? 0;
    same += Math.min(n, inB);
    if (n > inB) removed.push(...Array(n - inB).fill(line));
  }
  for (const [line, n] of countB) {
    const inA = countA.get(line) ?? 0;
    if (n > inA) added.push(...Array(n - inA).fill(line));
  }
  return { added: added.slice(0, 200), removed: removed.slice(0, 200), same };
}

export function CompareTool({ files, onReset }: { files: File[]; onReset: () => void }) {
  const [diff, setDiff] = React.useState<DiffResult | null>(null);
  const [busy, setBusy] = React.useState(false);

  const compare = async () => {
    setBusy(true);
    try {
      const { extractPdfText } = await import("@/lib/pdf/convert");
      const [a, b] = await Promise.all([
        extractPdfText(await files[0].arrayBuffer()),
        extractPdfText(await files[1].arrayBuffer()),
      ]);
      setDiff(diffText(a.join("\n"), b.join("\n")));
    } catch {
      toast.error("Could not compare these documents.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <GitCompareArrows className="h-5 w-5 text-primary" />
          <span className="font-medium">Comparing</span>
          <span className="max-w-[38%] truncate text-muted-foreground">{files[0].name}</span>
          <span className="text-muted-foreground">vs</span>
          <span className="max-w-[38%] truncate text-muted-foreground">{files[1].name}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onReset}>
            <Undo2 className="h-4 w-4" /> New files
          </Button>
          <Button variant="gradient" size="sm" onClick={compare} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompareArrows className="h-4 w-4" />}
            Compare text
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {files.slice(0, 2).map((f, i) => (
          <div key={i} className="space-y-2">
            <p className="truncate text-xs font-medium text-muted-foreground">Document {i + 1}: {f.name}</p>
            <PdfViewer file={f} compact />
          </div>
        ))}
      </div>

      {diff && (
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="mb-4 flex flex-wrap gap-4 text-sm">
            <span className="inline-flex items-center gap-1.5 font-medium text-success">
              <Equal className="h-4 w-4" /> {diff.same} matching lines
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
              <Plus className="h-4 w-4" /> {diff.added.length} added
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-destructive">
              <Minus className="h-4 w-4" /> {diff.removed.length} removed
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <DiffColumn title="Only in Document 1" lines={diff.removed} tone="removed" />
            <DiffColumn title="Only in Document 2" lines={diff.added} tone="added" />
          </div>
        </div>
      )}
    </div>
  );
}

function DiffColumn({ title, lines, tone }: { title: string; lines: string[]; tone: "added" | "removed" }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="max-h-64 space-y-1 overflow-auto rounded-lg border bg-muted/30 p-2 font-mono text-xs">
        {lines.length === 0 ? (
          <p className="p-2 text-muted-foreground">No unique lines.</p>
        ) : (
          lines.map((l, i) => (
            <p
              key={i}
              className={
                tone === "added"
                  ? "rounded bg-emerald-500/10 px-2 py-1 text-emerald-700 dark:text-emerald-300"
                  : "rounded bg-destructive/10 px-2 py-1 text-destructive"
              }
            >
              {l}
            </p>
          ))
        )}
      </div>
    </div>
  );
}
