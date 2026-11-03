import { createFileRoute } from "@tanstack/react-router";
import { consoleCatalogOptions } from "@/lib/console/catalog";
import { ConsoleScreen } from "@/components/console/ConsoleScreen";

export const Route = createFileRoute("/_authenticated/console/library")({
  loader: ({ context }) => context.queryClient.ensureQueryData(consoleCatalogOptions),
  head: () => ({ meta: [{ title: "Console Library — BirchBlock" }, { name: "description", content: "View your installed games and apps and wishlist." }, { property: "og:title", content: "Console Library — BirchBlock" }, { property: "og:description", content: "View your installed games and apps and wishlist." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <ConsoleScreen screen="library" />,
});