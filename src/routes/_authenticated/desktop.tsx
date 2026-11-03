import { createFileRoute, Navigate } from "@tanstack/react-router";
import { usePrefs } from "@/lib/astra/prefs";
export const Route = createFileRoute("/_authenticated/desktop")({
  head: () => ({ meta: [
    { title: "Windows Desktop — BirchBlock" },
    { name: "description", content: "Your BirchBlock Windows desktop with app windows, games, music, movies and personal settings." },
    { property: "og:title", content: "Windows Desktop — BirchBlock" },
    { property: "og:description", content: "Games, music and movies in your personal BirchBlock desktop workspace." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: DesktopPage,
});
function DesktopPage() { const p = usePrefs(); return p.layout === "windows" && p.console === "off" ? null : <Navigate to="/home" replace/>; }