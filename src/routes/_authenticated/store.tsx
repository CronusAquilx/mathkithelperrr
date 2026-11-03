import { createFileRoute } from "@tanstack/react-router";
import { StoreView } from "@/components/windows/views/StoreView";
export const Route = createFileRoute("/_authenticated/store")({
  head: () => ({ meta: [{title:"Birch Store — apps for your desktop"},{name:"description",content:"Browse and open BirchBlock music, movies, games and productivity apps."},{property:"og:title",content:"Birch Store — apps for your desktop"},{property:"og:description",content:"Discover your BirchBlock desktop apps."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}] }),
  component: StoreView,
});