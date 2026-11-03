import { createFileRoute, Link } from "@tanstack/react-router";

// A proxied page opened outside BirchBlock (new tab, or after the proxy worker went
// idle) lands here instead of the 404 page; send the user back to Games.
export const Route = createFileRoute("/scramjet/p/$")({
  ssr: false,
  head: () => ({ meta: [{ title: "Reopening \u2014 BirchBlock" }, { name: "description", content: "Return to the BirchBlock game library when a proxy session needs to reopen." }, { property: "og:title", content: "Reopening \u2014 BirchBlock" }, { property: "og:description", content: "Return to the BirchBlock game library when a proxy session needs to reopen." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: ProxyFallback,
});

function ProxyFallback() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-lg font-medium">The sign-in connection could not reopen.</p>
      <p className="text-sm text-muted-foreground">Keep your game open. Close this window and try signing in again from the game.</p>
      <Link to="/games" className="rounded-md border px-3 py-1.5 text-sm">Back to Games</Link>
    </div>
  );
}
