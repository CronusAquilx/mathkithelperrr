import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { ProxiedPlayer } from "@/components/movies/ProxiedPlayer";

export const Route = createFileRoute("/_authenticated/movies/free/$videoId")({
  validateSearch: z.object({ source: z.string().optional() }),
  head: () => ({ meta: [{ title: "Free movie \u2014 BirchBlock Movies" }, { name: "description", content: "Watch a free movie from the BirchBlock movie library." }, { property: "og:title", content: "Free movie \u2014 BirchBlock Movies" }, { property: "og:description", content: "Watch a free movie from the BirchBlock movie library." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Free,
});

function Free() {
  const { videoId } = Route.useParams();
  const { source } = Route.useSearch();
  const src = source === "archive" ? `https://archive.org/embed/${videoId}` : `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  return (
    <div className="h-full overflow-y-auto p-3">
      <Link to="/movies" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="size-4" /> Movies</Link>
      <div className="mx-auto mt-3 aspect-video max-w-5xl overflow-hidden rounded-lg bg-muted">
        <ProxiedPlayer src={src} title="Free movie player" />
      </div>
    </div>
  );
}
