import { createFileRoute } from "@tanstack/react-router";
import { consoleCatalogOptions } from "@/lib/console/catalog";
import { ConsoleScreen } from "@/components/console/ConsoleScreen";

export const Route = createFileRoute("/_authenticated/console/settings")({
  loader: ({ context }) => context.queryClient.ensureQueryData(consoleCatalogOptions),
  head: () => ({ meta: [{ title: "Console Settings — BirchBlock" }, { name: "description", content: "Manage your BirchBlock console skin and preferences." }, { property: "og:title", content: "Console Settings — BirchBlock" }, { property: "og:description", content: "Manage your BirchBlock console skin and preferences." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <ConsoleScreen screen="settings" />,
});