import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { usePrefs } from "@/lib/astra/prefs";
import { openProxied } from "@/lib/astra/proxy";
import { attachProxiedPopups } from "@/lib/astra/proxy-popups";
import { streamingApp } from "@/lib/console/streaming";
import { useConsoleInput } from "@/lib/console/nav";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { BackButton } from "@/components/console/shared";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/console/stream/$app")({
  head: ({ params }) => {
    const title = `${streamingApp(params.app)?.title ?? "Streaming"} — BirchBlock Console`;
    const description = "Open your streaming app from the console media home.";
    return { meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] };
  },
  component: StreamApp,
});

function StreamApp() {
  const { app } = Route.useParams();
  const info = streamingApp(app);
  const navigate = useNavigate();
  const prefs = usePrefs();
  const ref = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const back = () => void navigate({ to: "/console/media" });
  useConsoleInput((a) => { if (a === "menu") back(); });
  useEffect(() => {
    const iframe = ref.current;
    if (!iframe || !info) return;
    setError(null);
    const detach = attachProxiedPopups(iframe, info.url, prefs);
    openProxied(iframe, info.url, prefs).catch((e) => setError(e instanceof Error ? e.message : String(e)));
    return detach;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info?.url, prefs.transport, prefs.wisp]);
  if (!info) return <ConsoleShell><div className="flex h-full flex-col items-center justify-center gap-4"><p>App not found.</p><Button variant="console" size="console" className="rounded-full bg-console-foreground/10 px-6 py-3" onClick={back}>Back to Media</Button></div></ConsoleShell>;
  return (
    <ConsoleShell hue={info.hue}>
      <div className="flex h-full flex-col">
        <header className="flex shrink-0 items-center gap-4 px-4 py-3 md:px-10">
          <BackButton onClick={back} />
          <h1 className="text-xl font-light md:text-2xl">{info.title}</h1>
          {error && <span className="text-sm text-destructive">Couldn't load: {error}</span>}
        </header>
        <iframe ref={ref} title={info.title} className="min-h-0 w-full flex-1 border-0 bg-console-ink" allow="fullscreen; autoplay; encrypted-media; picture-in-picture; clipboard-read; clipboard-write" allowFullScreen />
      </div>
    </ConsoleShell>
  );
}
