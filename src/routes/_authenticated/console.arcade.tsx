import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { consoleCatalogOptions } from "@/lib/console/catalog";
import { Player } from "@/components/games/ArcadePlayer";
import { Button } from "@/components/ui/button";
import { SocialShare } from "@/components/social/SocialAccess";
export const Route = createFileRoute("/_authenticated/console/arcade")({
 validateSearch: (s: Record<string,unknown>) => ({game: typeof s["game"] === "string" ? s["game"] : ""}),
 loader: ({context}) => context.queryClient.ensureQueryData(consoleCatalogOptions),
 head: () => ({meta:[{title:"Arcade Player — BirchBlock"},{name:"description",content:"Play your arcade library with your existing game saves."},{property:"og:title",content:"Arcade Player — BirchBlock"},{property:"og:description",content:"Play your arcade library with your existing game saves."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"}]}),
 component: Arcade,
});
function Arcade(){const {game}=Route.useSearch();const {data}=useSuspenseQuery(consoleCatalogOptions);const navigate=useNavigate();const found=data.arcade.find(g=>g.file===game);return <div className="flex h-dvh flex-col bg-background text-foreground">{found?<><div className="flex shrink-0 justify-end border-b border-border px-4 py-1"><SocialShare title={found.name} link={`/console/store?game=${encodeURIComponent(`arcade:${found.file}`)}`} /></div><Player game={found} onBack={()=>void navigate({to:"/console/library"})}/></>:<div className="m-auto text-center"><p>Game not found.</p><Button onClick={()=>void navigate({to:"/console/store"})}>Back to store</Button></div>}</div>;}
