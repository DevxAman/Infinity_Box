"use client";

import { useSyncExternalStore } from "react";
import type { Title } from "./tmdb";

/**
 * "My List" persisted in localStorage, exposed as a tiny external store so
 * every component (cards, hero, my-list page) stays in sync — including
 * across browser tabs via the `storage` event.
 */

const KEY = "infinitybox:my-list";
const EMPTY: Title[] = [];
const listeners = new Set<() => void>();
let cache: Title[] | null = null;

function read(): Title[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Title[]) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: Title[]) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked (private mode) — keep the in-memory copy.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const sameTitle = (a: Title, b: Pick<Title, "id" | "mediaType">) =>
  a.id === b.id && a.mediaType === b.mediaType;

export function useMyList() {
  const list = useSyncExternalStore(subscribe, read, () => EMPTY);

  return {
    list,
    has: (t: Pick<Title, "id" | "mediaType">) => list.some((x) => sameTitle(x, t)),
    toggle: (t: Title) => {
      const current = read();
      write(
        current.some((x) => sameTitle(x, t))
          ? current.filter((x) => !sameTitle(x, t))
          : [t, ...current],
      );
    },
  };
}
