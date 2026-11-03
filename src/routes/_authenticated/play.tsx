import { createFileRoute } from "@tanstack/react-router";
import { GamePlayView } from "@/components/games/GamePlayView";
// Full-tab game player: opens a game through the Astra proxy in its own browser tab.
export const Route = createFileRoute("/_authenticated/play")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({ url: typeof s["url"] === "string" ? s["url"] : "", name: typeof s["name"] === "string" ? s["name"] : "" }),
  head: () => ({ meta: [{ title: "Playing — BirchBlock" }, { name: "description", content: "Play a browser game in its own tab through BirchBlock." }, { property: "og:title", content: "Playing — BirchBlock" }, { property: "og:description", content: "Play a browser game in its own tab through BirchBlock." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Play,
});

function Play() { return <GamePlayView {...Route.useSearch()}/>; }
