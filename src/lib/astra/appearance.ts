import type { Prefs } from "./prefs";
import type { DesktopWidget } from "./widget-layout";

export const LAYOUT_NAMES = { sony: "PlayStation / PS5", series: "Xbox Series X", wii: "Wii", neutral: "Neutral", classic: "Classic", launcher: "Launcher", windows: "Windows", switch: "Switch" } as const;
export type AppearanceLayout = keyof typeof LAYOUT_NAMES;
export const VISIBLE_LAYOUTS: AppearanceLayout[] = ["windows", "switch", "sony", "series", "wii", "neutral"];
export type AppearanceProfile = Pick<Prefs, "palette" | "accent" | "fontScale" | "radius" | "density" | "background" | "reduceMotion" | "showClock" | "consoleBg" | "consoleCustomBg" | "customBg" | "customBgDim"> & {
  mode: "dark" | "light";
  tileSize: "small" | "standard" | "large";
  artwork: boolean;
  sidebarWidth: "narrow" | "standard" | "wide";
  wallpaperMotion: "off" | "drift" | "zoom";
  particles: "off" | "stars" | "rain" | "snow" | "fireflies";
  particleDensity: "subtle" | "rich";
  appTransparency: "solid" | "glass" | "liquid";
  glassOpacity?: number;
  glassBlur?: number;
  brightness?: number;
  effectSpeed?: number;
  clockStyle?: "weekday" | "minimal" | "large";
  clock24Hour?: boolean;
  clockSeconds?: boolean;
  clockDate?: boolean;
  iconLabels?: boolean;
  dockMotion?: boolean;
  clockFont: "clean" | "rounded" | "serif" | "digital";
  liveWallpaper: "off" | "rain" | "water";
  customAccent: string;
  widgets: { weather: boolean; notes: boolean; music: boolean };
  desktopWidgets?: DesktopWidget[];
  wallpaperType?: "image" | "video";
  wallpaperPoster?: string;
  wallpaperPlayback?: boolean;
};
export type AppearanceProfiles = Partial<Record<AppearanceLayout, AppearanceProfile>>;
export function activeLayout(p: Pick<Prefs, "console" | "layout">): AppearanceLayout {
  return p.console !== "off" && p.console !== "classic" ? p.console : p.layout;
}
export function initialAppearance(p: Prefs, mode: "dark" | "light" = "dark"): AppearanceProfile {
  return { palette: p.palette, accent: p.accent, fontScale: p.fontScale, radius: p.radius, density: p.density, background: p.background, reduceMotion: p.reduceMotion, showClock: p.showClock, consoleBg: p.consoleBg, consoleCustomBg: p.consoleCustomBg, customBg: p.customBg, customBgDim: p.customBgDim, mode, tileSize: "standard", artwork: true, sidebarWidth: "standard", wallpaperMotion: "off", particles: "off", particleDensity: "subtle", appTransparency: "solid", clockFont: "clean", liveWallpaper: "off", customAccent: "", widgets: { weather: true, notes: true, music: true } };
}
export function updateAppearance(profiles: AppearanceProfiles, layout: AppearanceLayout, current: AppearanceProfile, patch: Partial<AppearanceProfile>): AppearanceProfiles {
  return { ...profiles, [layout]: { ...current, ...patch } };
}