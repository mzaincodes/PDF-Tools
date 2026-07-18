"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, Sparkles } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TOOLS, POPULAR_TOOLS } from "@/lib/tools";
import { CATEGORY_MAP } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { Tool } from "@/types";

function scoreTool(tool: Tool, q: string): number {
  const query = q.toLowerCase();
  const title = tool.title.toLowerCase();
  if (!query) return 0;
  if (title === query) return 100;
  if (title.startsWith(query)) return 80;
  if (title.includes(query)) return 60;
  if (tool.short.toLowerCase().includes(query)) return 40;
  if (tool.keywords?.some((k) => k.includes(query))) return 30;
  if (CATEGORY_MAP[tool.category].name.toLowerCase().includes(query)) return 20;
  if (tool.description.toLowerCase().includes(query)) return 10;
  return 0;
}

export function SearchCommand({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);

  const results = React.useMemo(() => {
    if (!query.trim()) return POPULAR_TOOLS;
    return TOOLS.map((t) => ({ t, s: scoreTool(t, query) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((x) => x.t);
  }, [query]);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  React.useEffect(() => setActive(0), [query]);

  const go = React.useCallback(
    (tool: Tool) => {
      onOpenChange(false);
      router.push(`/tools/${tool.slug}`);
    },
    [onOpenChange, router]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="max-w-xl gap-0 overflow-hidden p-0">
        <div className="flex items-center gap-3 border-b px-4">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search 50+ PDF tools…"
            className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
            ESC
          </kbd>
        </div>

        <div className="max-h-[22rem] overflow-y-auto p-2">
          {!query.trim() && (
            <p className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Popular tools
            </p>
          )}
          {results.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No tools found for “{query}”.
            </p>
          )}
          {results.map((tool, i) => {
            const cat = CATEGORY_MAP[tool.category];
            return (
              <button
                key={tool.slug}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(tool)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                  active === i ? "bg-accent" : "hover:bg-accent/60"
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                    tool.gradient
                  )}
                >
                  <tool.icon className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{tool.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{tool.short}</span>
                </span>
                <span className="hidden shrink-0 text-[11px] font-medium text-muted-foreground sm:block">
                  {cat.name}
                </span>
                {active === i && <CornerDownLeft className="h-4 w-4 shrink-0 text-muted-foreground" />}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** A pill-style trigger used in the navbar. */
export function SearchTrigger({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={cn("h-10 w-full justify-start gap-2 text-muted-foreground sm:w-64", className)}
    >
      <Search className="h-4 w-4" />
      <span className="flex-1 text-left text-sm">Search tools…</span>
      <kbd className="hidden items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:inline-flex">
        ⌘K
      </kbd>
    </Button>
  );
}
