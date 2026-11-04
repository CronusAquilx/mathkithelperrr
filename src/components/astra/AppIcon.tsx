import { siSpotify, siCrunchyroll, siGooglechrome, siSteam } from "simple-icons";
import { Bot, Brain, Home, Mic, Settings, Users, ShoppingBag, type LucideIcon } from "lucide-react";

export function AppIcon({ app, className }: { app: string; className?: string }) {
  const brand = app === "music" ? siSpotify : app === "movies" ? siCrunchyroll : app === "web" ? siGooglechrome : app === "games" ? siSteam : null;
  if (brand) return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d={brand.path}/></svg>;
  if (app === "store") return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 7h14l1 14H4L5 7Z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/><path d="M9 11h2v2H9zM13 11h2v2h-2zM9 15h2v2H9zM13 15h2v2h-2z" fill="currentColor" stroke="none"/></svg>;
  const icons: Record<string, LucideIcon> = { home: Home, chat: Bot, memory: Brain, voice: Mic, settings: Settings, social: Users };
  const Icon = icons[app] ?? ShoppingBag;
  return <Icon className={className}/>;
}