import { useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Bot, Film, Music, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useClock } from "@/lib/console/ctx";
import { useConsoleInput } from "@/lib/console/nav";
import { usePrefs } from "@/lib/astra/prefs";
import { RoomFollower } from "@/components/RoomFollower";
import { NowPlayingBar } from "@/components/music/NowPlayingBar";
import { cn } from "@/lib/utils";
import { Avatar, BackButton } from "./shared";
import { XboxGuide } from "./xbox/XboxGuide";
import { SocialAccess } from "@/components/social/SocialAccess";
import { WallpaperEffects } from "@/components/astra/WallpaperEffects";
import { WebsiteFullscreenButton } from "@/components/FullscreenButton";

const TABS = [
  { to: "/music", match: "/music", label: "Music", icon: Music },
  { to: "/movies", match: "/movies", label: "Movies", icon: Film },
  { to: "/chat", match: "/chat", label: "AI", icon: Bot },
] as const;

/** Console-mode paths that open inside the PS5 media frame instead of the classic sidebar layout. */
export function isConsoleMediaPath(pathname: string) {
  return ["/music", "/movies", "/chat", "/web", "/voice", "/memory"].some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** PS5-style frame around Music, Movies and AI while Console Mode is on: no sidebar. */
export function ConsoleAppFrame({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const clock = useClock();
  const p = usePrefs();
  const [guide, setGuide] = useState(false);
  const { user } = useAuth();
  const meta = user?.user_metadata as { full_name?: string; name?: string } | undefined;
  const initial = (meta?.full_name ?? meta?.name ?? user?.email ?? "P")[0]?.toUpperCase() ?? "P";
  const home = () => void navigate({ to: "/console/media" });
  // Controller "B" / Escape returns to the console media home, like a PS5 app.
  useConsoleInput((a) => { if (a === "menu") { if (p.console === "series") setGuide(true); else home(); } }, !guide);
  return (
    <div className={cn("console-shell fixed inset-0 flex flex-col bg-console-background text-console-foreground", `skin-${p.console}`, p.console === "series" && "xbox-series")}>
      <header className="console-topbar flex shrink-0 items-center gap-4 border-b border-console-foreground/10 px-4 py-3 md:px-10">
        <BackButton onClick={home} />
        {p.console === "series" && <Button variant="console" size="console" aria-label="Open Xbox guide" title="Open Xbox guide" onClick={() => setGuide(true)} className="xbox-control size-10 shrink-0"><Gamepad2/></Button>}
        <nav className="flex min-w-0 gap-5 overflow-x-auto md:gap-8">
          {TABS.map((t) => {
            const active = pathname === t.match || pathname.startsWith(`${t.match}/`);
            return (
              <Button key={t.to} variant="console" size="console" onClick={() => void navigate({ to: t.to })} className={cn("shrink-0 gap-2 text-lg md:text-xl", active ? "text-console-foreground" : "text-console-foreground/45")}>
                <t.icon className="size-5" />{t.label}
              </Button>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <SocialAccess />
          <Avatar initial={initial} className="size-9" />
          {p.showClock && <span className="hidden text-lg sm:block">{clock}</span>}
        </div>
      </header>
      <WallpaperEffects/>
      <main data-app={pathname.split("/")[1]} className="console-app-body native-app relative min-h-0 flex-1 overflow-hidden bg-background text-foreground">
        <RoomFollower />
        {children}
      </main>
      <NowPlayingBar />
      <WebsiteFullscreenButton/>
      {guide && <XboxGuide close={() => setGuide(false)}/>}
    </div>
  );
}
