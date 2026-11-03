import { createFileRoute } from "@tanstack/react-router";
import { SettingsView } from "@/components/windows/views/SettingsView";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings \u2014 BirchBlock" }, { name: "description", content: "Manage your BirchBlock appearance, privacy, proxy and AI preferences." }, { property: "og:title", content: "Settings \u2014 BirchBlock" }, { property: "og:description", content: "Manage your BirchBlock appearance, privacy, proxy and AI preferences." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: SettingsView,
});
