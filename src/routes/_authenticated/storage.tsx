import { createFileRoute } from "@tanstack/react-router";
import { StorageView } from "@/components/windows/views/StorageView";

export const Route = createFileRoute("/_authenticated/storage")({
  head: () => ({
    meta: [
      { title: "Storage — Birch OS" },
      {
        name: "description",
        content: "Manage your private Birch OS files, uploads, downloads and share links.",
      },
      { property: "og:title", content: "Storage — Birch OS" },
      {
        property: "og:description",
        content: "Your account’s files in Birch OS, connected to Fluxlinkk.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StorageView,
});
