import { createFileRoute } from "@tanstack/react-router";
import { MusicView } from "@/components/windows/views/MusicView";

export const Route = createFileRoute("/_authenticated/music")({
  head: () => ({ meta: [{ title: "Qaisify Music — BirchBlock" }, { name: "description", content: "Browse Qaisify music shelves, search songs and play your Birch playlists." }, { property: "og:title", content: "Qaisify Music — BirchBlock" }, { property: "og:description", content: "Browse Qaisify music shelves, search songs and play your Birch playlists." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: MusicView,
});
