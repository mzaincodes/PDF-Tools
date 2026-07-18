"use client";

import * as React from "react";
import { Search, Star, Clock, LayoutGrid, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ToolCard } from "@/components/shared/tool-card";
import { FavoriteStar } from "@/components/shared/favorite-star";
import { CATEGORIES } from "@/lib/categories";
import { TOOLS, getTool, POPULAR_TOOLS } from "@/lib/tools";
import { useFavoriteTools, useRecentTools } from "@/hooks/use-tool-prefs";
import { cn } from "@/lib/utils";
import type { CategoryId, Tool } from "@/types";

function matches(tool: Tool, q: string): boolean {
  const query = q.toLowerCase().trim();
  if (!query) return true;
  return (
    tool.title.toLowerCase().includes(query) ||
    tool.short.toLowerCase().includes(query) ||
    tool.description.toLowerCase().includes(query) ||
    (tool.keywords ?? []).some((k) => k.includes(query))
  );
}

export function ToolsExplorer({ initialCategory }: { initialCategory?: string }) {
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState<string>(
    initialCategory && CATEGORIES.some((c) => c.id === initialCategory) ? initialCategory : "all"
  );
  const { favorites, hydrated: favHydrated } = useFavoriteTools();
  const { recent, hydrated: recentHydrated } = useRecentTools();

  const filtered = React.useMemo(() => {
    return TOOLS.filter((t) => (active === "all" || t.category === active) && matches(t, query));
  }, [active, query]);

  const favoriteTools = favHydrated ? favorites.map(getTool).filter(Boolean).slice(0, 8) as Tool[] : [];
  const recentTools = recentHydrated ? recent.map(getTool).filter(Boolean).slice(0, 6) as Tool[] : [];

  const showCollections = !query && active === "all";

  return (
    <div className="space-y-8">
      {/* Search + filters */}
      <div className="space-y-4">
        <div className="relative mx-auto max-w-xl">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all tools…"
            className="h-12 rounded-xl pl-11 pr-10 text-base"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center">
          <Pill active={active === "all"} onClick={() => setActive("all")} icon={<LayoutGrid className="h-4 w-4" />}>
            All
          </Pill>
          {CATEGORIES.map((cat) => (
            <Pill
              key={cat.id}
              active={active === cat.id}
              onClick={() => setActive(cat.id as CategoryId)}
              icon={<cat.icon className="h-4 w-4" />}
            >
              {cat.name}
            </Pill>
          ))}
        </div>
      </div>

      {/* Favorites & recent */}
      {showCollections && favoriteTools.length > 0 && (
        <Collection title="Your favorites" icon={<Star className="h-4 w-4 text-amber-400" />}>
          {favoriteTools.map((t) => (
            <ToolCard key={t.slug} tool={t} favorite={<FavoriteStar slug={t.slug} />} />
          ))}
        </Collection>
      )}
      {showCollections && recentTools.length > 0 && (
        <Collection title="Recently used" icon={<Clock className="h-4 w-4 text-primary" />}>
          {recentTools.map((t) => (
            <ToolCard key={t.slug} tool={t} favorite={<FavoriteStar slug={t.slug} />} />
          ))}
        </Collection>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-card/50 py-20 text-center">
          <p className="text-lg font-medium">No tools found</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a different search or category.</p>
        </div>
      ) : (
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            {filtered.length} tool{filtered.length !== 1 ? "s" : ""}
            {active !== "all" && ` in ${CATEGORIES.find((c) => c.id === active)?.name}`}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((t) => (
              <ToolCard key={t.slug} tool={t} favorite={<FavoriteStar slug={t.slug} />} />
            ))}
          </div>
        </div>
      )}

      {/* Popular when searching empty state fallback already covered */}
      {showCollections && (
        <Collection title="Most popular" icon={<Star className="h-4 w-4 text-primary" />} className="pt-2">
          {POPULAR_TOOLS.map((t) => (
            <ToolCard key={t.slug} tool={t} favorite={<FavoriteStar slug={t.slug} />} />
          ))}
        </Collection>
      )}
    </div>
  );
}

function Pill({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex shrink-0 snap-start items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all",
        active
          ? "border-transparent bg-gradient-brand text-white shadow-glow"
          : "bg-card/60 hover:border-primary/40 hover:bg-accent"
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function Collection({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>
    </section>
  );
}
