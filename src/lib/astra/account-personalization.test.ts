import { describe, expect, it, vi } from "vitest";
const cloud = vi.hoisted(() => ({ rows: new Map<string, unknown>(), owner: "" }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({ select: () => ({ eq: (_column: string, owner: string) => ({ maybeSingle: async () => ({ data: cloud.rows.has(owner) ? { data: cloud.rows.get(owner) } : null, error: null }) }) }), upsert: async (row: { user_id: string; data: unknown }) => { cloud.rows.set(row.user_id, row.data); return { error: null }; } }) } }));
import { activatePreferenceAccount, flushPreferences, getPrefsSnapshot, setAppearance, setPrefs } from "./prefs";
import { addDesktopShortcut } from "@/lib/windows/desktop-shortcuts";

describe("account personalization", () => {
  it("restores each account's own wallpaper and desktop shortcuts", async () => {
    await activatePreferenceAccount("account-a");
    setAppearance("windows", { customBg: "https://example.org/a.jpg", brightness: 85, appTransparency: "liquid" });
    addDesktopShortcut({ id: "movie:movie:10", kind: "movie", title: "A movie", tmdbId: 10, mediaType: "movie" });
    await flushPreferences();
    await activatePreferenceAccount("account-b");
    expect(getPrefsSnapshot().desktopShortcuts).toEqual([]);
    setAppearance("windows", { customBg: "https://example.org/b.jpg", brightness: 110 });
    await flushPreferences();
    await activatePreferenceAccount("account-a");
    expect(getPrefsSnapshot().appearances.windows?.customBg).toBe("https://example.org/a.jpg");
    expect(getPrefsSnapshot().appearances.windows?.brightness).toBe(85);
    const shortcut = getPrefsSnapshot().desktopShortcuts[0];
    expect(shortcut?.kind === "movie" ? shortcut.tmdbId : null).toBe(10);
  });
  it("does not save guest personalization to an account or browser storage", async () => {
    await activatePreferenceAccount(null);
    const before = cloud.rows.size;
    setPrefs({ homeName: "Guest only" });
    await flushPreferences();
    expect(cloud.rows.size).toBe(before);
    expect(localStorage.getItem("astra-prefs")).toBeNull();
  });
  it("keeps liquid glass, brightness and clocks separate by layout", async () => {
    await activatePreferenceAccount("account-layouts");
    setAppearance("windows", { appTransparency: "liquid", brightness: 80, clock24Hour: true });
    setAppearance("sony", { appTransparency: "solid", brightness: 115, clock24Hour: false });
    await flushPreferences();
    expect(getPrefsSnapshot().appearances.windows?.brightness).toBe(80);
    expect(getPrefsSnapshot().appearances.sony?.brightness).toBe(115);
    expect(getPrefsSnapshot().appearances.windows?.clock24Hour).toBe(true);
  });
});