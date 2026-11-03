import { createFileRoute } from "@tanstack/react-router";
import { consoleCatalogOptions } from "@/lib/console/catalog";
import { ConsoleScreen } from "@/components/console/ConsoleScreen";
import { GameDetails } from "@/components/console/shared";
import { useConsoleCtx } from "@/lib/console/ctx";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/console/store")({
  validateSearch: (s: Record<string, unknown>): { game?: string } => typeof s["game"] === "string" ? {game:s["game"]} : {},
  loader: ({ context }) => context.queryClient.ensureQueryData(consoleCatalogOptions),
  head: () => ({ meta: [{ title: "Console Store — BirchBlock" }, { name: "description", content: "Browse the BirchBlock cloud games, arcade games and apps." }, { property: "og:title", content: "Console Store — BirchBlock" }, { property: "og:description", content: "Browse the BirchBlock cloud games, arcade games and apps." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: SharedStore,
});
function SharedStore(){ const {game}=Route.useSearch(); const {catalog,lib}=useConsoleCtx();const [dismissed,setDismissed]=useState("");const found=catalog.games.find(g=>g.id===game);return <><ConsoleScreen screen="store"/>{found&&dismissed!==game&&<GameDetails game={found} lib={lib} close={()=>setDismissed(game ?? "")}/>}</>; }