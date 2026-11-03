import { createFileRoute } from "@tanstack/react-router";
import { MemoryView } from "@/components/windows/views/MemoryView";

export const Route = createFileRoute("/_authenticated/memory")({
  head: () => ({ meta: [{ title: "Memory \u2014 BirchBlock" }, { name: "description", content: "Manage the personal facts BirchBlock remembers for your conversations." }, { property: "og:title", content: "Memory \u2014 BirchBlock" }, { property: "og:description", content: "Manage the personal facts BirchBlock remembers for your conversations." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: MemoryView,
});
