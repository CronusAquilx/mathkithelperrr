import { createFileRoute } from "@tanstack/react-router";
import { consoleCatalogOptions } from "@/lib/console/catalog";
import { ConsoleScreen } from "@/components/console/ConsoleScreen";
export const Route = createFileRoute("/_authenticated/console/apps")({
  loader: ({ context }) => context.queryClient.ensureQueryData(consoleCatalogOptions),
  head: () => ({ meta: [{ title: "App Library — BirchBlock" }, { name: "description", content: "All your BirchBlock apps in one console library." }, { property: "og:title", content: "App Library — BirchBlock" }, { property: "og:description", content: "All your BirchBlock apps in one console library." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <ConsoleScreen screen="apps" />,
});
