import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACCENTS, getAppearance, usePrefs } from "@/lib/astra/prefs";
import { activeLayout, type AppearanceProfile } from "@/lib/astra/appearance";
import { AppearancePreview } from "@/components/astra/AppearancePreview";
import { PersonalizationControls } from "@/components/astra/PersonalizationControls";
import { WallpaperCatalog } from "@/components/astra/WallpaperCatalog";

export function PersonalizationSetup({ onConfirm, onBack, busy }: { onConfirm: (look: AppearanceProfile) => void; onBack: () => void; busy: boolean }) {
  const p = usePrefs(); const layout = activeLayout(p);
  const [look, setLook] = useState(() => getAppearance(p, layout));
  const set = (patch: Partial<AppearanceProfile>) => setLook(current => ({ ...current, ...patch }));
  const select = (label: string, value: string, options: string[], onValueChange: (v: string) => void) => <label className="personalization-control"><span>{label}</span><Select value={value} onValueChange={onValueChange}><SelectTrigger aria-label={label} className="w-40"><SelectValue/></SelectTrigger><SelectContent>{options.map(v => <SelectItem key={v} value={v}>{v === "liquid" ? "Liquid glass" : v}</SelectItem>)}</SelectContent></Select></label>;
  return <main className="h-dvh overflow-y-auto bg-background text-foreground"><div className="mx-auto max-w-5xl px-5 py-8"><header className="mb-6 flex items-center justify-between"><Button variant="ghost" onClick={onBack} disabled={busy}><ArrowLeft/>Back</Button><span className="text-xs text-muted-foreground">BIRCHBLOCK / YOUR LOOK</span></header><h1 className="mb-6 text-3xl font-medium">Make it yours</h1><div className="grid items-start gap-7 lg:grid-cols-2"><div className="lg:sticky lg:top-5"><AppearancePreview layout={layout} look={look}/><Button className="mt-5 w-full" disabled={busy} onClick={() => onConfirm(look)}><Check/>{busy ? "Saving…" : "Confirm my look"}</Button></div><div>
    <div className="flex flex-wrap gap-2 border-b py-3">{(["dark", "light"] as const).map(mode => <Button key={mode} variant={look.mode === mode ? "secondary" : "ghost"} aria-pressed={look.mode === mode} onClick={() => set({ mode, palette: "default" })}>{mode === "dark" ? "Dark" : "Light"}</Button>)}</div>
    <div className="flex flex-wrap gap-2 border-b py-4">{Object.keys(ACCENTS).map(id => <Button key={id} size="icon" variant="ghost" className="appearance-swatch size-8 rounded-full border" data-swatch={id} aria-label={`${id} accent`} aria-pressed={look.accent === id} onClick={() => set({ accent: id as AppearanceProfile["accent"] })}>{look.accent === id && <Check className="size-3"/>}</Button>)}</div>
    {select("Background pattern", look.background, ["plain", "dots", "grid", "glow"], v => set({ background: v as AppearanceProfile["background"] }))}
    {select("App surfaces", look.appTransparency, ["solid", "glass", "liquid"], v => set({ appTransparency: v as AppearanceProfile["appTransparency"] }))}
    {select("Particles", look.particles, ["off", "stars", "rain", "snow", "fireflies"], v => set({ particles: v as AppearanceProfile["particles"] }))}
    <label className="personalization-control"><span>Show clock</span><Switch aria-label="Show clock" checked={look.showClock} onCheckedChange={showClock => set({ showClock })}/></label>
    {select("Clock font", look.clockFont, ["clean", "rounded", "serif", "digital"], v => set({ clockFont: v as AppearanceProfile["clockFont"] }))}
    <PersonalizationControls look={look} onChange={set}/>
    {layout === "windows" && <section className="border-b py-3"><h2 className="text-sm font-medium">Desktop widgets</h2>{(["weather", "notes", "music"] as const).map(kind => <label key={kind} className="personalization-control"><span>{kind}</span><Switch aria-label={`${kind} widget`} checked={look.widgets[kind]} onCheckedChange={on => set({ widgets: { ...look.widgets, [kind]: on } })}/></label>)}</section>}
    <WallpaperCatalog layout={layout} appearance={look} onChange={set}/>
  </div></div></div></main>;
}