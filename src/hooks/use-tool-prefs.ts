"use client";

import { useCallback } from "react";
import { useLocalStorage } from "./use-local-storage";

const RECENT_KEY = "pdfpro:recent-tools";
const FAV_KEY = "pdfpro:favorite-tools";
const MAX_RECENT = 8;

/** Track recently used tools (most recent first). */
export function useRecentTools() {
  const { value, setValue, hydrated } = useLocalStorage<string[]>(RECENT_KEY, []);

  const push = useCallback(
    (slug: string) => {
      setValue((prev) => [slug, ...prev.filter((s) => s !== slug)].slice(0, MAX_RECENT));
    },
    [setValue]
  );

  return { recent: value, push, hydrated };
}

/** Track favorite/pinned tools. */
export function useFavoriteTools() {
  const { value, setValue, hydrated } = useLocalStorage<string[]>(FAV_KEY, []);

  const toggle = useCallback(
    (slug: string) => {
      setValue((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
    },
    [setValue]
  );

  const isFavorite = useCallback((slug: string) => value.includes(slug), [value]);

  return { favorites: value, toggle, isFavorite, hydrated };
}
