import { describe, expect, it } from "vitest";
import { desktopReducer, makeWindow, type DesktopState } from "./window-model";
const first = makeWindow("one", { id: "a", app: "music", title: "Music" });
const initial: DesktopState = { windows: [first], active: "one" };
describe("desktop windows", () => {
  it("opens separate app windows", () => {
    const state = desktopReducer(initial, { type: "open", window: makeWindow("two", { id: "b", app: "games", title: "Games" }) });
    expect(state.windows).toHaveLength(2); expect(state.active).toBe("two"); expect(state.windows[0]?.tabs[0]?.app).toBe("music");
  });
  it("restores minimized windows without removing their tabs", () => {
    const hidden = desktopReducer(initial, { type: "minimize", id: "one" });
    expect(hidden.windows[0]?.minimized).toBe(true);
    const restored = desktopReducer(hidden, { type: "focus", id: "one" });
    expect(restored.windows[0]?.minimized).toBe(false); expect(restored.windows[0]?.activeTab).toBe("a");
  });
  it("detaches a tab into its own window", () => {
    const tabs = desktopReducer(initial, { type: "tab", id: "one", tab: { id: "b", app: "web", title: "Web" } });
    const split = desktopReducer(tabs, { type: "detach", id: "one", tabId: "b", newId: "two" });
    expect(split.windows[0]?.tabs.map(t => t.id)).toEqual(["a"]); expect(split.windows[1]?.tabs[0]?.id).toBe("b"); expect(split.active).toBe("two");
  });
  it("closing the last tab closes its window", () => {
    expect(desktopReducer(initial, { type: "close-tab", id: "one", tabId: "a" })).toEqual({ windows: [], active: null });
  });
  it("snaps without losing normal window dimensions", () => {
    const state = desktopReducer(initial, { type: "patch", id: "one", patch: { mode: "left" } });
    expect(state.windows[0]?.mode).toBe("left"); expect(state.windows[0]?.width).toBe(900);
  });
});