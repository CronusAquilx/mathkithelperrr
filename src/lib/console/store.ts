import { useEffect, useSyncExternalStore } from "react";
import { launchPath, type ConsoleGame } from "./catalog";

export type Lib = { installed: string[]; wishlist: string[]; lastPlayed: string | null; progress: Record<string, number> };

const EMPTY: Lib = { installed: [], wishlist: [], lastPlayed: null, progress: {} };
let state: Lib = EMPTY;
let loadedFor: string | null = null;
let userKey = "guest";
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const storageKey = (u: string) => `console-library:${u}`;

function persist() {
  try {
    const { installed, wishlist, lastPlayed } = state;
    localStorage.setItem(storageKey(userKey), JSON.stringify({ installed, wishlist, lastPlayed }));
  } catch { /* storage unavailable */ }
}

// Structured per user so it can later move to a database table.
export function loadLibrary(userId: string) {
  if (loadedFor === userId) return;
  loadedFor = userId;
  userKey = userId;
  let saved: Partial<Lib> = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey(userId)) || "{}"); } catch { /* ignore */ }
  state = { installed: saved.installed ?? [], wishlist: saved.wishlist ?? [], lastPlayed: saved.lastPlayed ?? null, progress: {} };
  emit();
}

export function installGame(id: string) {
  if (state.installed.includes(id) || id in state.progress) return;
  state = { ...state, progress: { ...state.progress, [id]: 0 } };
  emit();
  const owner = userKey;
  const timer = window.setInterval(() => {
    if (owner !== userKey) { window.clearInterval(timer); return; }
    const next = (state.progress[id] ?? 0) + 4 + Math.random() * 8;
    if (next >= 100) {
      window.clearInterval(timer);
      const rest = { ...state.progress };
      delete rest[id];
      state = { ...state, progress: rest, installed: [...state.installed, id] };
      persist();
    } else { state = { ...state, progress: { ...state.progress, [id]: next } }; }
    emit();
  }, 250);
}

export function uninstallGame(id: string) {
  state = { ...state, installed: state.installed.filter((x) => x !== id) };
  persist(); emit();
}

export function toggleWishlist(id: string) {
  const has = state.wishlist.includes(id);
  state = { ...state, wishlist: has ? state.wishlist.filter((x) => x !== id) : [...state.wishlist, id] };
  persist(); emit();
}

export function playGame(g: ConsoleGame, navigate: (path: string) => void) {
  state = { ...state, lastPlayed: g.id };
  persist(); emit();
  const path = launchPath(g);
  if (g.kind === "cloud") window.open(path, "_blank", "noopener");
  else navigate(path);
}

/** Install if missing, otherwise play. */
export function actOn(g: ConsoleGame, lib: Lib, navigate: (path: string) => void) {
  if ((g.kind === "app" && !g.installable) || lib.installed.includes(g.id)) playGame(g, navigate);
  else installGame(g.id);
}

const subscribe = (f: () => void) => { subs.add(f); return () => subs.delete(f); };

export function useLibrary(userId?: string): Lib {
  const id = userId ?? "guest";
  useEffect(() => { loadLibrary(id); }, [id]);
  return useSyncExternalStore(subscribe, () => state, () => EMPTY);
}