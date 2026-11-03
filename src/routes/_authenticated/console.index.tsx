import { createFileRoute } from "@tanstack/react-router";
import { consoleCatalogOptions } from "@/lib/console/catalog";
import { ConsoleScreen } from "@/components/console/ConsoleScreen";

export const Route = createFileRoute("/_authenticated/console/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(consoleCatalogOptions),
  head: () => ({ meta: [{ title: "Console Home — BirchBlock" }, { name: "description", content: "Your BirchBlock console home and installed games." }, { property: "og:title", content: "Console Home — BirchBlock" }, { property: "og:description", content: "Your BirchBlock console home and installed games." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <ConsoleScreen screen="home" />,
});