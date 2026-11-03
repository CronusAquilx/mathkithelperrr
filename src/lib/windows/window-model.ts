export type DesktopApp = "home" | "games" | "music" | "movies" | "web" | "chat" | "memory" | "voice" | "settings" | "social" | "store" | "route";
export type WindowTab = { id: string; app: DesktopApp; title: string; game?: import("./desktop-shortcuts").ArcadeShortcutGame };
export type DesktopWindow = { id: string; tabs: WindowTab[]; activeTab: string; x: number; y: number; width: number; height: number; minimized: boolean; mode: "normal" | "maximized" | "left" | "right" };
export type DesktopState = { windows: DesktopWindow[]; active: string | null };
export type WindowAction =
  | { type: "open"; window: DesktopWindow }
  | { type: "focus" | "close" | "minimize"; id: string }
  | { type: "patch"; id: string; patch: Partial<DesktopWindow> }
  | { type: "tab"; id: string; tab: WindowTab }
  | { type: "close-tab"; id: string; tabId: string }
  | { type: "detach"; id: string; tabId: string; newId: string }
  | { type: "show-desktop" };
export function makeWindow(id: string, tab: WindowTab, index = 0): DesktopWindow {
  return { id, tabs: [tab], activeTab: tab.id, x: 60 + index % 5 * 26, y: 38 + index % 5 * 26, width: 900, height: 620, minimized: false, mode: "normal" };
}
export function desktopReducer(state: DesktopState, action: WindowAction): DesktopState {
  if (action.type === "open") return { windows: [...state.windows, action.window], active: action.window.id };
  if (action.type === "show-desktop") return { windows: state.windows.map(w => ({ ...w, minimized: true })), active: null };
  const target = state.windows.find(w => w.id === action.id);
  if (!target) return state;
  if (action.type === "close" || action.type === "close-tab" && target.tabs.length === 1 && target.tabs[0]?.id === action.tabId) {
    const windows = state.windows.filter(w => w.id !== target.id);
    return { windows, active: state.active === target.id ? windows.filter(w => !w.minimized).at(-1)?.id ?? null : state.active };
  }
  if (action.type === "detach") {
    const tab = target.tabs.find(t => t.id === action.tabId);
    if (!tab || target.tabs.length < 2) return state;
    const remaining = target.tabs.filter(t => t.id !== tab.id);
    return { windows: [...state.windows.map(w => w.id === target.id ? { ...w, tabs: remaining, activeTab: remaining[0]?.id ?? "" } : w), makeWindow(action.newId, tab, state.windows.length)], active: action.newId };
  }
  const windows = state.windows.map(w => {
    if (w.id !== target.id) return w;
    if (action.type === "focus") return { ...w, minimized: false };
    if (action.type === "minimize") return { ...w, minimized: true };
    if (action.type === "patch") return { ...w, ...action.patch };
    if (action.type === "tab") return { ...w, tabs: [...w.tabs, action.tab], activeTab: action.tab.id, minimized: false };
    if (action.type === "close-tab") {
      const tabs = w.tabs.filter(t => t.id !== action.tabId);
      return { ...w, tabs, activeTab: w.activeTab === action.tabId ? tabs.at(-1)?.id ?? "" : w.activeTab };
    }
    return w;
  });
  if (action.type === "minimize") return { windows, active: state.active === target.id ? windows.filter(w => !w.minimized).at(-1)?.id ?? null : state.active };
  return { windows, active: target.id };
}