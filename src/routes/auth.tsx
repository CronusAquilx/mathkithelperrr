import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/astra/AuthPage";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — BirchBlock" },
      { name: "description", content: "Sign in to BirchBlock, your private AI agent." },
      { property: "og:title", content: "Sign in — BirchBlock" },
      { property: "og:description", content: "Sign in to BirchBlock, your private AI agent." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

