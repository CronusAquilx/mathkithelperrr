import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bot, Brain, Film, Gamepad2, Globe, Home, Music, Settings, Users, Wifi, Volume2, Search, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAppearance, usePrefs } from "@/lib/astra/prefs";
import { AppIcon } from "./AppIcon";

export const DESKTOP_APPS = [
  { to: "/home", label: "Home", icon: Home, tone: "aqua", focus: "all" },
  { to: "/store", label: "Store", icon: LayoutGrid, tone: "cyan", focus: "all" },
  { to: "/games", label: "Games", icon: Gamepad2, tone: "green", focus: "games" },
  { to: "/web", label: "Browser", icon: Globe, tone: "cyan", focus: "web" },
  { to: "/movies", label: "Movies", icon: Film, tone: "coral", focus: "movies" },
  { to: "/music", label: "Music", icon: Music, tone: "green", focus: "music" },
  { to: "/chat", label: "BirchBlock AI", icon: Bot, tone: "gold", focus: "ai" },
  { to: "/memory", label: "Memory", icon: Brain, tone: "violet", focus: "ai" },
  { to: "/console/social", label: "Friends", icon: Users, tone: "green", focus: "all" },
  { to: "/settings", label: "Settings", icon: Settings, tone: "neutral", focus: "all" },
] as const;

export function DesktopClock({ compact = false }: { compact?: boolean }) {
  const prefs = usePrefs();
  const look = getAppearance(prefs);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const timer = setInterval(() => setNow(new Date()), look.clockSeconds ? 1000 : 10000); return () => clearInterval(timer); }, [look.clockSeconds]);
  if (!getAppearance(prefs).showClock) return null;
  if (compact) return <time className="desktop-system-time">{now?.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}<span>{now?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></time>;
  return <div className="desktop-clock" data-clock-style={look.clockStyle ?? "weekday"} data-clock-font={look.clockFont} aria-label="Desktop date and time"><p className="desktop-clock-time">{now?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", ...(look.clockSeconds ? { second: "2-digit" } : {}), hour12: !look.clock24Hour }) ?? "\u00a0"}</p>{look.clockStyle !== "minimal" && <h2>{now?.toLocaleDateString([], { weekday: "long" }) ?? "\u00a0"}</h2>}{look.clockDate !== false && <p className="desktop-clock-date">{now?.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" }) ?? "\u00a0"}</p>}</div>;
}

export function DesktopStatusBar({ onApps, onSettings }: { onApps: () => void; onSettings: () => void }) {
  return <header className="desktop-system-bar"><Button variant="ghost" size="sm" onClick={onApps} className="desktop-system-brand"><LayoutGrid className="size-3.5"/>BirchBlock</Button><span className="desktop-system-label">Desktop</span><DesktopClock compact/><Button variant="ghost" size="icon" aria-label="Open settings" title="Settings" onClick={onSettings}><Wifi className="size-3.5"/><Volume2 className="size-3.5"/></Button></header>;
}

export function DesktopDock({ onSearch }: { onSearch: () => void }) {
  const prefs = usePrefs();
  return <nav className="desktop-dock" aria-label="App dock"><Button variant="ghost" size="icon" title="Search apps" aria-label="Search apps" onClick={onSearch} className="desktop-dock-item"><span className="desktop-color-icon" data-tone="neutral"><Search/></span></Button><span className="desktop-dock-divider"/>{DESKTOP_APPS.filter(a => a.focus === "all" || !prefs.focus || prefs.focus === "all" || prefs.focus === a.focus).map(a => <Button asChild variant="ghost" size="icon" key={a.to} className="desktop-dock-item"><Link to={a.to} aria-label={a.label} title={a.label} activeProps={{ className: "is-current" }}><span className="desktop-color-icon" data-tone={a.tone}><AppIcon app={a.to === "/console/social" ? "social" : a.to.slice(1)}/></span><span className="desktop-dock-tooltip">{a.label}</span></Link></Button>)}</nav>;
}