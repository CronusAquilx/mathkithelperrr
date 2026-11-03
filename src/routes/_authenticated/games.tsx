import { createFileRoute } from "@tanstack/react-router";
import { GamesView } from "@/components/windows/views/GamesView";

export const Route = createFileRoute("/_authenticated/games")({
  head: () => ({ meta: [{ title: "Games — BirchBlock" }, { name: "description", content: "Play browser games and connect to cloud gaming services in BirchBlock." }, { property: "og:title", content: "Games — BirchBlock" }, { property: "og:description", content: "Browse and play BirchBlock's arcade and cloud game library." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: GamesView,
});
