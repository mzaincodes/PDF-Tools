import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Tool } from "@/types";

interface ToolCardProps {
  tool: Tool;
  favorite?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function ToolCard({ tool, favorite, className, compact }: ToolCardProps) {
  const Icon = tool.icon;
  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-soft-lg",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "relative grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",
            tool.gradient
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="relative z-10 flex items-center gap-1.5">
          {tool.isNew && <Badge variant="new">New</Badge>}
          {tool.popular && !tool.isNew && <Badge variant="gradient">Popular</Badge>}
          {favorite}
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="flex items-center gap-1 font-semibold tracking-tight">
          {tool.title}
          <ArrowUpRight className="h-4 w-4 -translate-y-0.5 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-1 group-hover:opacity-100" />
        </h3>
        {!compact && (
          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">{tool.short}</p>
        )}
      </div>

      <Link
        href={`/tools/${tool.slug}`}
        className="absolute inset-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Open ${tool.title}`}
      />
    </div>
  );
}
