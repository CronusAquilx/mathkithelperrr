import { createFileRoute } from "@tanstack/react-router";
import { VoiceView } from "@/components/windows/views/VoiceView";

export const Route = createFileRoute("/_authenticated/voice")({
  head: () => ({ meta: [{ title: "Voice \u2014 BirchBlock" }, { name: "description", content: "Talk with BirchBlock out loud in a live voice call." }, { property: "og:title", content: "Voice \u2014 BirchBlock" }, { property: "og:description", content: "Talk with BirchBlock out loud in a live voice call." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: VoiceView,
});
