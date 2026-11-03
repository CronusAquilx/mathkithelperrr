import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { usePrefs } from "@/lib/astra/prefs";
import { DesktopClock, DESKTOP_APPS } from "@/components/astra/DesktopSurface";
import { Button } from "@/components/ui/button";
import { DesktopWidgets } from "@/components/astra/DesktopWidgets";
import { SwitchHome } from "@/components/astra/SwitchSurface";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home — BirchBlock" },
      { name: "description", content: "Your BirchBlock launcher: AI, web, movies and games in one place." },
      { property: "og:title", content: "Home — BirchBlock" },
      { property: "og:description", content: "Your BirchBlock launcher: AI, web, movies and games in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

function Home() {
  const p = usePrefs();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  if (p.layout === "switch") return <SwitchHome/>;
  return (
    <div className="reference-home">
      <div className="reference-home-center">
        <h1 className="reference-home-brand">{p.homeName === "astra" || !p.homeName ? "BirchBlock" : p.homeName}</h1>
        <DesktopClock/>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) navigate({ to: "/web", search: { q: q.trim() } });
          }}
          className="desktop-search"
        >
          <Search className="size-4 text-muted-foreground" />
          <input aria-label="Search the web" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the web" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          <Button type="submit" variant="ghost" size="icon" aria-label="Search"><ArrowRight/></Button>
        </form>
        <div className="desktop-quick-apps">{DESKTOP_APPS.filter(a => ["/games", "/web", "/movies", "/music"].includes(a.to)).map(a => <Button asChild key={a.to} variant="ghost"><Link to={a.to}><a.icon/>{a.label}</Link></Button>)}</div>
      </div>
      <DesktopWidgets onMusic={() => void navigate({ to: "/music" })}/>
    </div>
  );
}
