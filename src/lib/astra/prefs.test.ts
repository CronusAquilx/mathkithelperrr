import { describe, expect, it } from "vitest";
import { setPrefs, setAppearance, resetPrefs } from "./prefs";

describe("persisted appearance switching", () => {
  it("retains music-bar visibility across layout changes", () => {
    resetPrefs(); setPrefs({ musicBarHidden: true }); setPrefs({ console: "sony" });
    expect(JSON.parse(localStorage.getItem("astra-prefs") || "{}").musicBarHidden).toBe(true);
    setPrefs({ musicBarHidden: false });
    expect(JSON.parse(localStorage.getItem("astra-prefs") || "{}").musicBarHidden).toBe(false);
  });
  it("restores Wii and Neutral appearances independently", () => {
    resetPrefs(); setPrefs({ console: "wii" });
    setAppearance("wii", { customAccent: "#12abcd", consoleCustomBg: "https://example.org/wii.jpg", consoleBg: "custom" });
    setPrefs({ console: "neutral" });
    setAppearance("neutral", { customAccent: "#ab1256" });
    setPrefs({ console: "wii" });
    expect(document.documentElement.dataset["appearanceLayout"]).toBe("wii");
    expect(document.documentElement.style.getPropertyValue("--star")).toBe("#12abcd");
    const saved = JSON.parse(localStorage.getItem("astra-prefs") || "{}");
    expect(saved.consoleCustomBg).toBe("https://example.org/wii.jpg");
    expect(saved.appearances.neutral.customAccent).toBe("#ab1256");
  });
  it("never persists temporary guest wallpaper URLs", () => {
    resetPrefs(); setPrefs({ console: "off", layout: "classic" });
    setAppearance("classic", { customBg: "blob:http://localhost/guest-wallpaper" });
    const saved = JSON.parse(localStorage.getItem("astra-prefs") || "{}");
    expect(saved.appearances.classic.customBg).toBe("");
    expect(document.documentElement.dataset["custombg"]).toBe("on");
  });
  it("restores custom accents independently for each layout", () => {
    resetPrefs(); setPrefs({ console: "off", layout: "switch" });
    setAppearance("switch", { customAccent: "#12abcd" });
    setPrefs({ layout: "windows" }); setAppearance("windows", { customAccent: "#ab1256" });
    setPrefs({ layout: "switch" });
    expect(document.documentElement.style.getPropertyValue("--star")).toBe("#12abcd");
    setPrefs({ layout: "windows" });
    expect(document.documentElement.style.getPropertyValue("--star")).toBe("#ab1256");
  });
  it("keeps wallpaper uploads and widget choices separate by layout", () => {
    resetPrefs(); setPrefs({ console: "off", layout: "classic" });
    setAppearance("classic", { customBg: "https://example.org/my-photo.jpg", widgets: { weather: false, notes: true, music: true } });
    setPrefs({ layout: "launcher" });
    expect(document.documentElement.dataset["custombg"]).toBeUndefined();
    setPrefs({ layout: "classic" });
    const saved = JSON.parse(localStorage.getItem("astra-prefs") || "{}");
    expect(saved.appearances.classic.customBg).toBe("https://example.org/my-photo.jpg");
    expect(saved.appearances.classic.widgets.weather).toBe(false);
  });
  it("restores separate console and desktop wallpaper effects", () => {
    resetPrefs(); setPrefs({ console: "off", layout: "windows" });
    setAppearance("windows", { particles: "stars", wallpaperMotion: "zoom", appTransparency: "glass" });
    setPrefs({ console: "sony" }); setAppearance("sony", { particles: "rain", wallpaperMotion: "drift" });
    setPrefs({ console: "series" });
    expect(document.documentElement.dataset["wallpaperMotion"]).toBe("off");
    setPrefs({ console: "off", layout: "windows" });
    expect(document.documentElement.dataset["wallpaperMotion"]).toBe("zoom");
    expect(document.documentElement.dataset["appTransparency"]).toBe("glass");
    expect(JSON.parse(localStorage.getItem("astra-prefs") || "{}").appearances.sony.particles).toBe("rain");
  });
  it("saves Windows appearance independently of console and classic", () => {
    resetPrefs();
    setPrefs({ console: "off", layout: "windows" });
    setAppearance("windows", { accent: "aqua", mode: "light" });
    setPrefs({ layout: "classic" });
    setAppearance("classic", { accent: "gold" });
    setPrefs({ layout: "windows" });
    const saved = JSON.parse(localStorage.getItem("astra-prefs") || "{}");
    expect(saved.accent).toBe("aqua");
    expect(saved.appearances.classic.accent).toBe("gold");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
  it("restores each console accent and theme when switching back", () => {
    resetPrefs();
    setPrefs({ console: "sony" });
    setAppearance("sony", { accent: "rose", mode: "light", fontScale: 110 });
    setPrefs({ console: "series" });
    setAppearance("series", { accent: "mint", mode: "dark", fontScale: 95 });
    setPrefs({ console: "sony" });
    const saved = JSON.parse(localStorage.getItem("astra-prefs") || "{}");
    expect(saved.accent).toBe("rose");
    expect(saved.fontScale).toBe(110);
    expect(saved.appearances.series.accent).toBe("mint");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    setPrefs({ console: "series" });
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.fontSize).toBe("95%");
  });
  it("editing an inactive layout does not change the current look", () => {
    resetPrefs();
    setPrefs({ console: "off", layout: "classic" });
    setAppearance("classic", { accent: "gold" });
    setAppearance("launcher", { accent: "sky", sidebarWidth: "wide" });
    expect(JSON.parse(localStorage.getItem("astra-prefs") || "{}").accent).toBe("gold");
    setPrefs({ layout: "launcher" });
    expect(JSON.parse(localStorage.getItem("astra-prefs") || "{}").accent).toBe("sky");
    expect(document.documentElement.dataset["sidebarWidth"]).toBe("wide");
  });
});