"use client";

import { Star } from "lucide-react";
import { useFavoriteTools } from "@/hooks/use-tool-prefs";
import { cn } from "@/lib/utils";

export function FavoriteStar({ slug }: { slug: string }) {
  const { isFavorite, toggle, hydrated } = useFavoriteTools();
  const active = hydrated && isFavorite(slug);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(slug);
      }}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={active}
      className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent"
    >
      <Star className={cn("h-4 w-4 transition-all", active && "fill-amber-400 text-amber-400 scale-110")} />
    </button>
  );
}
