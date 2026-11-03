import { createFileRoute } from "@tanstack/react-router";
import { MoviesView } from "@/components/windows/views/MoviesView";

export const Route = createFileRoute("/_authenticated/movies/")({
  head: () => ({ meta: [{ title: "Movies \u2014 BirchBlock" }, { name: "description", content: "Discover movies and shows and revisit your BirchBlock watchlist." }, { property: "og:title", content: "Movies \u2014 BirchBlock" }, { property: "og:description", content: "Discover movies and shows and revisit your BirchBlock watchlist." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: MoviesView,
});
