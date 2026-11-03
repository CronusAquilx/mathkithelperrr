import { AccountOnly } from "@/components/astra/SignInRequired";
import { signOutAll } from "@/lib/auth";
import { lazy, Suspense, useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { Rnd } from "react-rnd";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Bot, Brain, Film, Gamepad2, Globe, Home, LayoutGrid, Maximize2, Mic, Minus, Monitor, Music, PanelLeft, Plus, Power, Search, Settings, Square, Users, Volume2, Wifi, X, ExternalLink, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { getAppearance, setPrefs, usePrefs } from "@/lib/astra/prefs";
import { desktopReducer, makeWindow, type DesktopApp, type DesktopWindow, type WindowTab } from "@/lib/windows/window-model";
import { NowPlayingBar } from "@/components/music/NowPlayingBar";
import { RoomFollower } from "@/components/RoomFollower";
import { cn } from "@/lib/utils";
import wallpaper from "@/assets/launcher-wallpaper.jpg";
import { WallpaperEffects } from "@/components/astra/WallpaperEffects";
import { WallpaperMedia } from "@/components/astra/WallpaperMedia";
import { DesktopClock, DesktopStatusBar } from "@/components/astra/DesktopSurface";
import { AppIcon } from "@/components/astra/AppIcon";
import { StoreView } from "./views/StoreView";
import { DesktopWidgets } from "@/components/astra/DesktopWidgets";
import { WebsiteFullscreenButton } from "@/components/FullscreenButton";
import { removeDesktopShortcut, type DesktopShortcut } from "@/lib/windows/desktop-shortcuts";

const MusicView = lazy(() => import("./views/MusicView").then(m => ({ default: m.MusicView })));
const MoviesView = lazy(() => import("./views/MoviesView").then(m => ({ default: m.MoviesView })));
const GamesView = lazy(() => import("./views/GamesView").then(m => ({ default: m.GamesView })));
const WebView = lazy(() => import("./views/WebView").then(m => ({ default: m.WebView })));
const ChatView = lazy(() => import("./views/ChatView").then(m => ({ default: m.ChatView })));
const MemoryView = lazy(() => import("./views/MemoryView").then(m => ({ default: m.MemoryView })));
const VoiceView = lazy(() => import("./views/VoiceView").then(m => ({ default: m.VoiceView })));
const SettingsView = lazy(() => import("./views/SettingsView").then(m => ({ default: m.SettingsView })));
const SocialHub = lazy(() => import("@/components/social/SocialHub").then(m => ({ default: m.SocialHub })));
const APPS = [
  { id: "home", title: "Home", icon: Home, tone: "cyan" },
  { id: "store", title: "Birch Store", icon: LayoutGrid, tone: "cyan" },
  { id: "games", title: "Games", icon: Gamepad2, tone: "green" },
  { id: "web", title: "Browser", icon: Globe, tone: "cyan" },
  { id: "movies", title: "Movies & TV", icon: Film, tone: "coral" },
  { id: "music", title: "Music", icon: Music, tone: "green" },
  { id: "chat", title: "BirchBlock AI", icon: Bot, tone: "gold" },
  { id: "social", title: "Friends & parties", icon: Users, tone: "green" },
  { id: "memory", title: "Memory", icon: Brain, tone: "gold" },
  { id: "voice", title: "Voice", icon: Mic, tone: "cyan" },
  { id: "settings", title: "Settings", icon: Settings, tone: "neutral" },
] as const;
const appInfo = (id: DesktopApp) => APPS.find(a => a.id === id) ?? APPS[0];
let serial = 0;
const uid = () => `desktop-${++serial}`;
const tabFor = (app: DesktopApp): WindowTab => ({ id: uid(), app, title: appInfo(app).title });

export function WindowsDesktop({ children, desktopOnly = false }: { children?: ReactNode; desktopOnly?: boolean }) {
  const prefs = usePrefs(); const look = getAppearance(prefs, "windows");
  const { user } = useAuth(); const navigate = useNavigate();
  const path = useRouterState({ select: s => s.location.pathname });
  const [state, dispatch] = useReducer(desktopReducer, { windows: [], active: null });
  const [start, setStart] = useState(false); const [tasks, setTasks] = useState(false); const [quick, setQuick] = useState(false);
  const [query, setQuery] = useState(""); const [addTab, setAddTab] = useState<string | null>(null);
  const [closing, setClosing] = useState<string[]>([]);
  const [now, setNow] = useState(new Date()); const [area, setArea] = useState({ width: 1280, height: 800 });
  const workspace = useRef<HTMLDivElement>(null);
  const routeId = useRef<string | null>(null);
  const name = user?.user_metadata?.["full_name"] ?? user?.email?.split("@")[0] ?? "Player";
  useEffect(() => {
    const node = workspace.current; if (!node) return;
    const observer = new ResizeObserver(entries => { const rect = entries[0]?.contentRect; if (rect) setArea({ width: rect.width, height: rect.height }); });
    observer.observe(node); const timer = setInterval(() => setNow(new Date()), 30000);
    return () => { observer.disconnect(); clearInterval(timer); };
  }, []);
  const open = (app: DesktopApp, windowId?: string) => {
    const tab = tabFor(app);
    if (windowId) dispatch({ type: "tab", id: windowId, tab });
    else dispatch({ type: "open", window: makeWindow(uid(), tab, state.windows.length) });
    setStart(false); setTasks(false); setAddTab(null); setQuery("");
  };
  const launchShortcut = (shortcut: DesktopShortcut) => {
    if (shortcut.kind === "cloud") { window.open(`/play?url=${encodeURIComponent(shortcut.url)}&name=${encodeURIComponent(shortcut.title)}`, "_blank", "noopener"); return; }
    if (shortcut.kind === "movie") { void navigate({ to: "/movies/title/$type/$id", params: { type: shortcut.mediaType, id: String(shortcut.tmdbId) } }); return; }
    const tab: WindowTab = { id: uid(), app: "games", title: shortcut.title, game: shortcut.game };
    dispatch({ type: "open", window: makeWindow(uid(), tab, state.windows.length) });
  };
  useEffect(() => {
    if (desktopOnly || path === "/desktop" || path === "/home") return;
    const title = path.startsWith("/movies") ? "Movies & TV" : path.startsWith("/chat") ? "BirchBlock AI" : path.split("/")[1] ?? "App";
    if (routeId.current) dispatch({ type: "patch", id: routeId.current, patch: { tabs: [{ id: "route-tab", app: "route", title }], activeTab: "route-tab", minimized: false } });
    else {
      const id = uid(); routeId.current = id;
      dispatch({ type: "open", window: makeWindow(id, { id: "route-tab", app: "route", title }) });
    }
  }, [path, desktopOnly]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setStart(false); setTasks(false); setQuick(false); setAddTab(null); }
      if (e.altKey && e.key === "Tab") { e.preventDefault(); const index = state.windows.findIndex(w => w.id === state.active); const next = state.windows[(index + 1) % state.windows.length]; if (next) dispatch({ type: "focus", id: next.id }); }
    };
    window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
  }, [state]);
  const close = (id: string) => {
    const finish = () => { dispatch({ type: "close", id }); setClosing(ids => ids.filter(value => value !== id)); if (id === routeId.current) { routeId.current = null; void navigate({ to: "/desktop" }); } };
    if (look.reduceMotion || prefs.perfMode || prefs.device === "phone" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(); return; }
    setClosing(ids => [...ids, id]); window.setTimeout(finish, 180);
  };
  const fullWindow = state.windows.some(w => !w.minimized && (w.mode === "maximized" || area.width < 640));
  const patch = (id: string, value: Partial<DesktopWindow>) => dispatch({ type: "patch", id, patch: value });
  const appButton = (app: typeof APPS[number], target?: string) => <Button key={app.id} variant="ghost" className="windows-app-button" onClick={() => open(app.id, target)}><span className="windows-app-icon" data-tone={app.tone}><AppIcon app={app.id}/></span><span>{app.title}</span></Button>;
  const home = <div className="windows-home"><header><span className="text-xs text-muted-foreground">BIRCHBLOCK</span><h1 className="mt-2 text-3xl font-semibold">Home</h1><p className="mt-2 text-sm text-muted-foreground">{String(name)}’s workspace</p></header><h2 className="mt-8 mb-4 text-sm font-semibold">Your apps</h2><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{APPS.filter(a => a.id !== "home").map(a => appButton(a))}</div><div className="mt-8 flex items-center justify-between border-t pt-5"><div><p className="text-sm font-medium">Personalization</p><p className="mt-1 text-xs text-muted-foreground">Windows appearance</p></div><Button variant="ghost" onClick={() => open("settings")}><Settings/><ChevronRight/></Button></div></div>;
  const renderApp = (tab: WindowTab) => {
    switch (tab.app) {
      case "home": return home;
      case "store": return <StoreView onOpen={app => open(app)}/>;
      case "music": return <MusicView/>;
      case "movies": return <MoviesView/>;
      case "games": return <GamesView initialGame={tab.game}/>;
      case "web": return <WebView/>;
      case "chat": return <AccountOnly><ChatView/></AccountOnly>;
      case "memory": return <AccountOnly><MemoryView/></AccountOnly>;
      case "voice": return <AccountOnly><VoiceView/></AccountOnly>;
      case "settings": return <SettingsView/>;
      case "social": return <div className="h-full overflow-auto p-4"><SocialHub/></div>;
      case "route": return children;
    }
  };
  return <div data-full-window={fullWindow} className="windows-desktop fixed inset-0 flex flex-col overflow-hidden bg-background text-foreground">
    {look.artwork && <WallpaperMedia src={look.customBg || wallpaper} type={look.wallpaperType} poster={look.wallpaperPoster} playback={look.wallpaperPlayback} reduceMotion={look.reduceMotion} className="windows-wallpaper absolute inset-0 size-full object-cover"/>}
    <WallpaperEffects/>
    <DesktopStatusBar onApps={() => { setStart(!start); setQuick(false); }} onSettings={() => { setQuick(!quick); setStart(false); }}/>
    <div ref={workspace} className="windows-workspace relative min-h-0 flex-1" onPointerDown={e => { if (e.target === e.currentTarget) { setStart(false); setQuick(false); setTasks(false); } }}>
      <div className="windows-desktop-center"><DesktopClock/><Button variant="ghost" className="desktop-search windows-desktop-search" aria-label="Find an app" onClick={() => { setStart(true); setQuery(""); }}><Search/><span>Search apps</span><LayoutGrid/></Button></div>
      <div className="windows-shortcuts absolute left-3 top-4 flex flex-col gap-2">{APPS.filter(a => ["store","games","web","music","movies","settings"].includes(a.id)).map(a => <Button key={a.id} variant="ghost" className="windows-shortcut" onClick={() => open(a.id)} aria-label={`Open ${a.title}`}><span className="windows-app-icon" data-tone={a.tone}><AppIcon app={a.id}/></span><span>{a.title}</span></Button>)}</div>
      <div className="windows-brand pointer-events-none absolute bottom-6 right-7 text-right"><p className="text-sm font-semibold">BirchBlock</p><p className="mt-1 text-xs opacity-70">Windows desktop</p></div>
      <div className="windows-custom-shortcuts" aria-label="Your desktop shortcuts">{(prefs.desktopShortcuts ?? []).map(shortcut => <div key={shortcut.id} className="group relative"><Button variant="ghost" className="windows-shortcut" onClick={() => launchShortcut(shortcut)} aria-label={`Open ${shortcut.title}`} title={shortcut.title}>{shortcut.image ? <img src={shortcut.image} alt="" className="size-10 rounded object-cover"/> : shortcut.kind === "movie" ? <Film/> : <Gamepad2/>}<span>{shortcut.title}</span></Button><Button variant="secondary" size="icon" className="absolute -right-1 -top-1 size-5 opacity-0 group-hover:opacity-100 focus:opacity-100" aria-label={`Remove ${shortcut.title} shortcut`} title="Remove shortcut" onClick={() => removeDesktopShortcut(shortcut.id)}><X className="size-3"/></Button></div>)}</div>
      <DesktopWidgets onMusic={() => open("music")}/>
      {state.windows.map((w, i) => {
        const compact = area.width < 640; const maximized = compact || w.mode === "maximized";
        const snapped = w.mode === "left" || w.mode === "right";
        const width = maximized ? area.width : snapped ? area.width / 2 : Math.min(w.width, area.width - 24);
        const height = maximized || snapped ? area.height : Math.min(w.height, area.height - 24);
        const position = { x: maximized || w.mode === "left" ? 0 : w.mode === "right" ? area.width / 2 : Math.min(w.x, Math.max(0, area.width - width)), y: maximized || snapped ? 0 : Math.min(w.y, Math.max(0, area.height - height)) };
        return <Rnd key={w.id} bounds="parent" minWidth={Math.min(360, area.width)} minHeight={240} size={{ width, height }} position={position} disableDragging={maximized || snapped} enableResizing={!maximized && !snapped} dragHandleClassName="windows-drag-handle" cancel="button,input" style={{ zIndex: state.active === w.id ? 100 : i + 1, display: w.minimized ? "none" : undefined }} onMouseDown={() => dispatch({ type: "focus", id: w.id })} onDragStop={(_e, d) => patch(w.id, { x: d.x, y: d.y })} onResizeStop={(_e, _dir, ref, _delta, pos) => patch(w.id, { width: ref.offsetWidth, height: ref.offsetHeight, x: pos.x, y: pos.y })}>
          <section aria-label={`${w.tabs.find(t => t.id === w.activeTab)?.title ?? "App"} window`} className={cn("windows-window flex size-full flex-col overflow-hidden", state.active === w.id && "is-active", closing.includes(w.id) && "is-closing")}>
            <header className="windows-drag-handle flex h-10 shrink-0 items-center border-b bg-secondary/80 pl-3" onDoubleClick={() => patch(w.id, { mode: w.mode === "maximized" ? "normal" : "maximized" })}>
              <Monitor className="mr-2 size-3.5 text-star"/><span className="min-w-0 flex-1 truncate text-xs">{w.tabs.find(t => t.id === w.activeTab)?.title}</span>
              <Button variant="ghost" size="icon" title="Snap left" aria-label="Snap left" className="windows-caption" onClick={() => patch(w.id, { mode: "left" })}><PanelLeft/></Button>
              <Button variant="ghost" size="icon" title="Snap right" aria-label="Snap right" className="windows-caption" onClick={() => patch(w.id, { mode: "right" })}><PanelLeft className="rotate-180"/></Button>
              <Button variant="ghost" size="icon" title="Minimize" aria-label="Minimize" className="windows-caption" onClick={() => dispatch({ type: "minimize", id: w.id })}><Minus/></Button>
              <Button variant="ghost" size="icon" title={w.mode === "normal" ? "Maximize" : "Restore"} aria-label={w.mode === "normal" ? "Maximize" : "Restore"} className="windows-caption" onClick={() => patch(w.id, { mode: w.mode === "normal" ? "maximized" : "normal" })}>{w.mode === "normal" ? <Square/> : <Maximize2/>}</Button>
              <Button variant="ghost" size="icon" title="Close window" aria-label="Close window" className="windows-caption hover:bg-destructive hover:text-destructive-foreground" onClick={() => close(w.id)}><X/></Button>
            </header>
            <div className="flex h-10 shrink-0 items-center gap-1 overflow-x-auto border-b bg-secondary/40 px-2">
              {w.tabs.map(t => <div key={t.id} className={cn("flex min-w-24 max-w-44 shrink-0 items-center rounded-t-md", w.activeTab === t.id && "bg-background")}><Button variant="ghost" size="sm" className="min-w-0 flex-1 justify-start truncate" onClick={() => patch(w.id, { activeTab: t.id })}>{t.title}</Button><Button variant="ghost" size="icon" className="size-6" aria-label={`Close ${t.title} tab`} onClick={() => w.tabs.length === 1 ? close(w.id) : dispatch({ type: "close-tab", id: w.id, tabId: t.id })}><X className="size-3"/></Button></div>)}
              <Button variant="ghost" size="icon" className="size-7 shrink-0" aria-label="Add app tab" title="Add app tab" onClick={() => setAddTab(addTab === w.id ? null : w.id)}><Plus/></Button>
              {w.tabs.length > 1 && <Button variant="ghost" size="icon" className="size-7 shrink-0" aria-label="Move tab to new window" title="Move tab to new window" onClick={() => dispatch({ type: "detach", id: w.id, tabId: w.activeTab, newId: uid() })}><ExternalLink/></Button>}
            </div>
            {addTab === w.id && <div className="grid max-h-56 shrink-0 grid-cols-3 gap-1 overflow-auto border-b p-3">{APPS.map(a => appButton(a, w.id))}</div>}
            {w.tabs.map(t => <div key={t.id} data-app={t.app === "route" ? path.split("/")[1] : t.app} className={cn("windows-app-content native-app min-h-0 flex-1 overflow-hidden bg-background", t.id !== w.activeTab && "hidden")}><Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Opening {t.title}…</div>}>{renderApp(t)}</Suspense></div>)}
          </section>
        </Rnd>;
      })}
      {start && <section aria-label="Start menu" className="windows-start windows-glass absolute bottom-3 left-1/2 z-[300] flex -translate-x-1/2 flex-col rounded-lg border">
        <div className="px-6 pt-6"><div className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground"/><Input autoFocus aria-label="Search apps" placeholder="Search apps" value={query} onChange={e => setQuery(e.target.value)} className="h-10 bg-background/70 pl-10"/></div><h2 className="mt-6 mb-3 text-sm font-semibold">{query ? "Search results" : "Pinned"}</h2></div>
        <div className="grid grid-cols-3 gap-2 overflow-auto px-5 pb-5 sm:grid-cols-4">{APPS.filter(a => a.title.toLowerCase().includes(query.toLowerCase())).map(a => appButton(a))}</div>
        {!query && <div className="border-t px-6 py-4"><h2 className="mb-3 text-sm font-semibold">Open windows</h2>{state.windows.length ? state.windows.slice(-3).map(w => <Button key={w.id} variant="ghost" className="w-full justify-start" onClick={() => { dispatch({ type: "focus", id: w.id }); setStart(false); }}><Monitor/>{w.tabs.find(t => t.id === w.activeTab)?.title}</Button>) : <p className="text-xs text-muted-foreground">No recent windows</p>}</div>}
        <footer className="mt-auto flex items-center justify-between border-t bg-secondary/60 px-6 py-3"><span className="truncate text-sm">{String(name)}</span><Button variant="ghost" size="icon" title="Sign out" aria-label="Sign out" onClick={() => void signOutAll()}><Power/></Button></footer>
      </section>}
      {tasks && <section aria-label="Task view" className="windows-glass absolute inset-4 z-[300] flex flex-col rounded-lg border p-5"><header className="flex items-center justify-between"><h2 className="text-lg font-semibold">Task view</h2><Button variant="ghost" size="icon" aria-label="Close task view" onClick={() => setTasks(false)}><X/></Button></header><div className="mt-5 grid gap-4 overflow-auto sm:grid-cols-3">{state.windows.map(w => <div key={w.id} className="rounded-lg border bg-background p-4"><div className="flex justify-between"><Monitor className="text-star"/><Button variant="ghost" size="icon" aria-label={`Close ${w.tabs[0]?.title}`} onClick={() => close(w.id)}><X/></Button></div><Button variant="ghost" className="mt-3 w-full justify-start" onClick={() => { dispatch({ type: "focus", id: w.id }); setTasks(false); }}>{w.tabs.find(t => t.id === w.activeTab)?.title}</Button><p className="mt-2 text-xs text-muted-foreground">{w.tabs.length} {w.tabs.length === 1 ? "tab" : "tabs"}{w.minimized ? " · Minimized" : ""}</p></div>)}</div>{!state.windows.length && <p className="mt-8 text-sm text-muted-foreground">No open windows</p>}</section>}
      {quick && <section aria-label="Quick settings" className="windows-glass absolute bottom-3 right-3 z-[300] w-72 rounded-lg border p-5"><h2 className="mb-4 text-sm font-semibold">Quick settings</h2><div className="flex gap-3"><span className="rounded-md bg-secondary p-3"><Wifi/></span><span className="rounded-md bg-secondary p-3"><Volume2/></span></div><Button variant="ghost" className="mt-4 w-full justify-start" onClick={() => { setQuick(false); open("settings"); }}><Settings/>All settings</Button><Button variant="ghost" className="w-full justify-start" onClick={() => void document.documentElement.requestFullscreen().catch(() => {})}><Maximize2/>Full screen</Button></section>}
    </div>
    <div className="relative z-[310]"><NowPlayingBar/></div>
    <footer className="windows-taskbar windows-glass relative z-[310] flex h-14 shrink-0 items-center border-t px-3">
      <div className="flex min-w-0 flex-1 justify-center gap-1 overflow-x-auto"><Button variant="ghost" size="icon" className={cn("windows-task-button",start && "bg-accent")} title="Start" aria-label="Start" onClick={() => { setStart(!start); setTasks(false); setQuick(false); }}><span className="windows-start-logo" aria-hidden="true"><i/><i/><i/><i/></span></Button><Button variant="ghost" size="icon" title="Search" aria-label="Search apps" className="windows-task-button" onClick={() => { setStart(true); setQuery(""); }}><Search/></Button><Button variant="ghost" size="icon" title="Task view" aria-label="Task view" className="windows-task-button" onClick={() => { setTasks(!tasks); setStart(false); }}><LayoutGrid/></Button>
        {APPS.filter(a => ["store", "games", "web", "movies", "music", "chat", "settings"].includes(a.id)).map(a => <Button key={a.id} variant="ghost" size="icon" className="windows-task-button desktop-dock-item" title={a.title} aria-label={`Launch ${a.title}`} onClick={() => open(a.id)}><span className="desktop-color-icon" data-tone={a.tone}><AppIcon app={a.id}/></span></Button>)}
        {state.windows.map(w => { const tab = w.tabs.find(t => t.id === w.activeTab); return <Button key={w.id} variant="ghost" size="icon" className={cn("windows-task-button relative",state.active === w.id && "bg-accent")} title={tab?.title} aria-label={`Restore ${tab?.title}`} onClick={() => state.active === w.id && !w.minimized ? dispatch({ type: "minimize", id: w.id }) : dispatch({ type: "focus", id: w.id })}><AppIcon app={tab?.app ?? "home"} className="text-star"/><span className={cn("absolute bottom-0.5 h-0.5 rounded bg-muted-foreground", state.active === w.id ? "w-4 bg-star" : "w-1")}/></Button>; })}
      </div>
      <Button variant="ghost" size="sm" aria-label="Quick settings" title="Quick settings" onClick={() => { setQuick(!quick); setStart(false); }} className="ml-2 px-2"><Wifi/><Volume2 className="hidden sm:block"/></Button>
      {look.showClock && <div className="shrink-0 px-2 text-right text-[11px] tabular-nums"><p>{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p><p>{now.toLocaleDateString()}</p></div>}
      <Button variant="ghost" aria-label="Show desktop" title="Show desktop" className="h-full w-2 shrink-0 rounded-none border-l p-0" onClick={() => { dispatch({ type: "show-desktop" }); setStart(false); }}/>
    </footer><WebsiteFullscreenButton/><RoomFollower/>
  </div>;
}