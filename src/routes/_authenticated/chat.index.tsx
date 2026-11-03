import { createFileRoute } from "@tanstack/react-router";
import { ChatView } from "@/components/windows/views/ChatView";

export const Route = createFileRoute("/_authenticated/chat/")({
  head: () => ({ meta: [{ title: "New chat \u2014 BirchBlock" }, { name: "description", content: "Start a new private conversation with BirchBlock." }, { property: "og:title", content: "New chat \u2014 BirchBlock" }, { property: "og:description", content: "Start a new private conversation with BirchBlock." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ChatView,
});
