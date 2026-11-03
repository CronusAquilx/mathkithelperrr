import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { DesktopShortcut } from "@/lib/windows/desktop-shortcuts";
import { activeLayout, initialAppearance, updateAppearance, type AppearanceLayout, type AppearanceProfile, type AppearanceProfiles } from "./appearance";

export type Prefs = {
  desktopShortcuts: DesktopShortcut[];
  musicTheme: string;
  musicBarHidden: boolean;
  appearances: AppearanceProfiles;
  layout: "classic" | "launcher" | "windows" | "switch";
  console: "off" | "sony" | "series" | "classic" | "wii" | "neutral";
  consoleSetup: boolean;
  consoleBg: "landscape" | "focused" | "custom";
  consoleCustomBg: string;
  consoleSounds: boolean;
  accent: "star" | "rose" | "ember" | "mint" | "sky" | "violet" | "lime" | "gold" | "coral" | "aqua";
  palette: "default" | "midnight" | "forest" | "ocean" | "sunset" | "mono" | "candy" | "dracula" | "nord" | "cyberpunk" | "coffee" | "sakura" | "matrix" | "arctic" | "lava" | "royal" | "synthwave" | "paper" | "mint" | "galaxy";
  focus: "" | "all" | "music" | "movies" | "web" | "games" | "ai";
  device: "" | "desktop" | "tablet" | "phone";
  customBg: string;
  customBgDim: number;
  v?: number;
  density: "compact" | "comfortable";
  fontScale: number;
  radius: number;
  background: "plain" | "dots" | "grid" | "glow";
  reduceMotion: boolean;
  perfMode: boolean;
  perfOverlay: boolean;
  glowTitle: boolean;
  tagline: string;
  homeName: string;
  showClock: boolean;
  openLinksInNewTab: boolean;
  searchEngine: "astra" | "duckduckgo" | "google" | "bing";
  proxyEnabled: boolean;
  proxyGames: boolean;
  wisp: string;
  transport: "astra" | "epoxy" | "libcurl";
  identity: "mirror" | "disguise";
  userAgent: string;
  tabCloak: boolean;
  cloakTitle: string;
  panicKey: string;
  panicUrl: string;
};

export const DEFAULT_PREFS: Prefs = {
  desktopShortcuts: [],
  musicTheme: "midnight-void",
  musicBarHidden: false,
  appearances: {},
  layout: "windows",
  console: "off",
  consoleSetup: false,
  consoleBg: "landscape",
  consoleCustomBg: "",
  consoleSounds: false,
  focus: "",
  device: "",
  customBg: "",
  customBgDim: 55,
  accent: "star",
  palette: "default",
  density: "comfortable",
  fontScale: 100,
  radius: 0.3,
  background: "dots",
  reduceMotion: false,
  perfMode: false,
  perfOverlay: false,
  glowTitle: true,
  tagline: "everything in one place",
  homeName: "birchblock",
  showClock: true,
  openLinksInNewTab: false,
  searchEngine: "google",
  proxyEnabled: false,
  proxyGames: false,
  wisp: "",
  transport: "astra",
  identity: "mirror",
  userAgent: "default",
  tabCloak: false,
  cloakTitle: "Google Docs",
  panicKey: "`",
  panicUrl: "https://classroom.google.com",
};

export const ACCENTS: Record<Prefs["accent"], string> = {
  star: "",
  rose: "oklch(0.7 0.17 10)",
  ember: "oklch(0.74 0.16 55)",
  mint: "oklch(0.78 0.14 160)",
  sky: "oklch(0.74 0.13 235)",
  violet: "oklch(0.68 0.17 295)",
  lime: "oklch(0.85 0.19 130)",
  gold: "oklch(0.83 0.15 90)",
  coral: "oklch(0.72 0.15 30)",
  aqua: "oklch(0.82 0.12 195)",
};

export const PALETTES: Record<Prefs["palette"], { name: string; swatch: string[] }> = {
  default: { name: "Default", swatch: ["#14161c", "#e9d8a6"] },
  midnight: { name: "Midnight", swatch: ["#0b1026", "#7aa2ff"] },
  forest: { name: "Forest", swatch: ["#0f1a14", "#7bd88f"] },
  ocean: { name: "Ocean", swatch: ["#071a24", "#4fd1e8"] },
  sunset: { name: "Sunset", swatch: ["#1f1016", "#ff9a6b"] },
  mono: { name: "Mono", swatch: ["#111111", "#f2f2f2"] },
  candy: { name: "Candy", swatch: ["#fff0f6", "#e64e9b"] },
  dracula: { name: "Dracula", swatch: ["#1e1b2e", "#c49bff"] },
  nord: { name: "Nord", swatch: ["#2e3440", "#88c0d0"] },
  cyberpunk: { name: "Cyberpunk", swatch: ["#0d0221", "#f9f002"] },
  coffee: { name: "Coffee", swatch: ["#1e1612", "#d4a373"] },
  sakura: { name: "Sakura", swatch: ["#fdf2f4", "#e07a9a"] },
  matrix: { name: "Matrix", swatch: ["#030a05", "#39ff6a"] },
  arctic: { name: "Arctic", swatch: ["#f4f8fb", "#2b8fd6"] },
  lava: { name: "Lava", swatch: ["#140705", "#ff4d1f"] },
  royal: { name: "Royal", swatch: ["#0e0f2b", "#e8c25a"] },
  synthwave: { name: "Synthwave", swatch: ["#1a0b2e", "#ff4fd8"] },
  paper: { name: "Paper", swatch: ["#f5f1e8", "#3b3a36"] },
  mint: { name: "Mint", swatch: ["#0d1f1c", "#5fe3c0"] },
  galaxy: { name: "Galaxy", swatch: ["#070b1f", "#9d7bff"] },
};

const KEY = "astra-prefs";
let state: Prefs = DEFAULT_PREFS;
let loaded = false;
const subs = new Set<() => void>();
let account: string | null | undefined;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let revision = 0;
let accountReady = false;
let accountLoad: Promise<void> | undefined;
let saveStatus: "local" | "saving" | "saved" | "error" = "local";
const statusSubs = new Set<() => void>();
function status(value: typeof saveStatus) { saveStatus = value; statusSubs.forEach(f => f()); }
export function usePreferenceSaveStatus() { return useSyncExternalStore(f => { statusSubs.add(f); return () => { statusSubs.delete(f); }; }, () => saveStatus, () => "local" as const); }
const serialize = (value: Prefs) => JSON.stringify(value, (_key, item) => typeof item === "string" && item.startsWith("blob:") ? "" : item);
export function getPrefsSnapshot() { load(); return state; }
export function subscribePrefs(f: () => void) { subs.add(f); return () => { subs.delete(f); }; }

/** Identity switches never read another account's browser-wide settings. */
export function activatePreferenceAccount(userId: string | null): Promise<void> {
  if (account === userId) return accountLoad ?? Promise.resolve();
  accountLoad = loadPreferenceAccount(userId);
  return accountLoad;
}
async function loadPreferenceAccount(userId: string | null) {
  clearTimeout(saveTimer);
  const generation = ++revision;
  const selection = { layout: state.layout, console: state.console };
  account = userId; accountReady = false; loaded = true;
  let cached: Partial<Prefs> = {};
  if (userId) { try { cached = JSON.parse(localStorage.getItem(`${KEY}:${userId}`) || "{}"); } catch { /* invalid cache */ } }
  state = { ...DEFAULT_PREFS, ...cached, ...selection };
  state = { ...state, ...getAppearance(state) };
  apply(); subs.forEach(f => f()); status("local");
  if (!userId) { accountReady = true; localStorage.removeItem(KEY); return; }
  const { data, error } = await supabase.from("user_preferences").select("data").eq("user_id", userId).maybeSingle();
  if (generation !== revision) return;
  if (data?.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    state = { ...DEFAULT_PREFS, ...data.data as Partial<Prefs>, ...selection };
    state = { ...state, ...getAppearance(state) };
    localStorage.setItem(`${KEY}:${userId}`, serialize(state));
  }
  accountReady = true; apply(); subs.forEach(f => f()); status(error ? "error" : "saved");
}

export async function flushPreferences() {
  clearTimeout(saveTimer);
  if (!account || !accountReady) return;
  const owner = account; const generation = revision; const data = JSON.parse(serialize(state)) as Json;
  status("saving");
  const { error } = await supabase.from("user_preferences").upsert({ user_id: owner, data, updated_at: new Date().toISOString() });
  if (generation !== revision) return;
  status(error ? "error" : "saved");
  if (error) throw new Error("Your look is saved on this device, but account syncing failed. Try saving again.");
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    state = { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
    const mode = localStorage.getItem("astra-theme") === "light" ? "light" : "dark";
    const legacy = initialAppearance(state, mode);
    state.appearances = { classic: legacy, launcher: { ...legacy }, sony: { ...initialAppearance(DEFAULT_PREFS), consoleBg: state.consoleBg, consoleCustomBg: state.consoleCustomBg }, series: { ...initialAppearance(DEFAULT_PREFS), consoleBg: state.consoleBg, consoleCustomBg: state.consoleCustomBg }, ...state.appearances };
    if (state.layout === "classic" || state.layout === "launcher") {
      const old = state.appearances[state.layout] ?? legacy;
      state.appearances.windows = { ...old, ...state.appearances.windows, customBg: old.customBg || state.appearances.windows?.customBg || "" };
      state.layout = "windows";
    }
    state = { ...state, ...state.appearances[activeLayout(state)] };
    if (!state.v) { if (state.searchEngine === "astra") state.searchEngine = "google"; state.v = 1; }
  } catch { /* ignore */ }
  apply();
}

function apply() {
  if (typeof document === "undefined") return;
  const r = document.documentElement;
  const look = getAppearance(state);
  r.classList.toggle("dark", look.mode === "dark");
  r.dataset["appearanceLayout"] = activeLayout(state);
  r.dataset["tileSize"] = look.tileSize;
  r.dataset["artwork"] = look.artwork ? "on" : "off";
  r.dataset["sidebarWidth"] = look.sidebarWidth;
  r.dataset["wallpaperMotion"] = look.wallpaperMotion;
  r.dataset["appTransparency"] = look.appTransparency;
  r.dataset["dockMotion"] = look.dockMotion === false ? "off" : "on";
  r.dataset["iconLabels"] = look.iconLabels === false ? "off" : "on";
  r.style.setProperty("--appearance-brightness", `${(look.brightness ?? 100) / 100}`);
  r.style.setProperty("--glass-opacity", `${look.glassOpacity ?? 65}%`);
  r.style.setProperty("--glass-blur", `${look.glassBlur ?? 24}px`);
  r.dataset["consoleTone"] = state.palette !== "default" ? "palette" : look.mode;
  r.dataset["consoleAccent"] = state.accent === "star" && !look.customAccent ? "native" : "custom";
  r.style.setProperty("--custom-bg-dim", `${state.customBgDim}%`);
  r.style.fontSize = `${state.fontScale}%`;
  r.style.setProperty("--radius", `${state.radius}rem`);
  const a = /^#[\da-f]{6}$/i.test(look.customAccent) ? look.customAccent : ACCENTS[state.accent];
  if (a) {
    r.style.setProperty("--star", a);
    r.style.setProperty("--ring", a);
  } else {
    r.style.removeProperty("--star");
    r.style.removeProperty("--ring");
  }
  r.dataset["bg"] = state.background;
  if (state.palette === "default") delete r.dataset["theme"]; else r.dataset["theme"] = state.palette;
  r.dataset["density"] = state.density;
  if (state.customBg) { r.style.setProperty("--custom-bg", `url("${state.customBg.replace(/"/g, "%22")}")`); r.style.setProperty("--custom-bg-dim", `${state.customBgDim}%`); r.dataset["custombg"] = "on"; }
  else { r.style.removeProperty("--custom-bg"); delete r.dataset["custombg"]; }
  if (state.device) r.dataset["device"] = state.device; else delete r.dataset["device"];
  r.classList.toggle("perf-lite", !!state.perfMode);
  r.classList.toggle("reduce-motion", state.reduceMotion || state.device === "phone");
  document.title = state.tabCloak ? state.cloakTitle : document.title;
}

export function setPrefs(p: Partial<Prefs>) {
  load();
  const previous = activeLayout(state);
  const look = getAppearance(state);
  const appearancePatch: Partial<AppearanceProfile> = {};
  for (const key of Object.keys(look) as (keyof AppearanceProfile)[]) {
    if (key in p) Object.assign(appearancePatch, { [key]: p[key as keyof Prefs] });
  }
  const appearances = p.appearances ?? updateAppearance(state.appearances, previous, look, appearancePatch);
  state = { ...state, ...p, appearances };
  const next = activeLayout(state);
  const nextLook = appearances[next] ?? initialAppearance(DEFAULT_PREFS);
  state = { ...state, ...nextLook };
  if (account !== null) localStorage.setItem(KEY, serialize(state));
  if (account) {
    localStorage.setItem(`${KEY}:${account}`, serialize(state));
    if (accountReady) { status("saving"); clearTimeout(saveTimer); saveTimer = setTimeout(() => { void flushPreferences().catch(() => {}); }, 700); }
  }
  apply();
  subs.forEach((f) => f());
}

export function resetPrefs() {
  setPrefs(DEFAULT_PREFS);
}

export function getAppearance(p: Prefs, layout: AppearanceLayout = activeLayout(p)): AppearanceProfile {
  return { ...initialAppearance(p), ...p.appearances[layout] };
}

export function setAppearance(layout: AppearanceLayout, patch: Partial<AppearanceProfile>) {
  load();
  setPrefs({ appearances: updateAppearance(state.appearances, layout, getAppearance(state, layout), patch) });
}

export function resetAppearance(layout: AppearanceLayout) {
  setAppearance(layout, initialAppearance(DEFAULT_PREFS));
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(
    (f) => {
      load();
      subs.add(f);
      return () => subs.delete(f);
    },
    () => (load(), state),
    () => DEFAULT_PREFS,
  );
}

export function searchUrl(q: string, engine: Prefs["searchEngine"]) {
  const e = encodeURIComponent(q);
  if (engine === "google") return `https://www.google.com/search?q=${e}`;
  if (engine === "bing") return `https://www.bing.com/search?q=${e}`;
  if (engine === "duckduckgo") return `https://duckduckgo.com/?q=${e}`;
  return null;
}
