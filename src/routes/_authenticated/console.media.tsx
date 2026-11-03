import { createFileRoute } from "@tanstack/react-router";
import { consoleCatalogOptions } from "@/lib/console/catalog";
import { ConsoleScreen } from "@/components/console/ConsoleScreen";
export const Route = createFileRoute("/_authenticated/console/media")({
  loader: ({ context }) => context.queryClient.ensureQueryData(consoleCatalogOptions),
  head: () => ({ meta: [{ title: "Console Media — BirchBlock" }, { name: "description", content: "Music, movies and AI from your console home." }, { property: "og:title", content: "Console Media — BirchBlock" }, { property: "og:description", content: "Music, movies and AI from your console home." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <ConsoleScreen screen="media" />,
});
