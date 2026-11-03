import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { BackButton } from "@/components/console/shared";
import { SocialHub } from "@/components/social/SocialHub";
import { socialOptions } from "@/lib/social/query";
export const Route = createFileRoute("/_authenticated/console/social")({
  loader: ({ context }) => context.queryClient.ensureQueryData(socialOptions),
  head: () => ({ meta: [{title:"Friends & Parties — BirchBlock"},{name:"description",content:"Your BirchBlock friends, private parties, global chat and activity feed."},{property:"og:title",content:"Friends & Parties — BirchBlock"},{property:"og:description",content:"Connect with friends over games, movies and music on BirchBlock."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"}] }),
  component: SocialPage,
});
function SocialPage(){ const navigate=useNavigate(); return <ConsoleShell><div className="mx-auto flex h-full max-w-6xl flex-col px-4 py-5 md:px-10 md:py-8"><header className="mb-5 flex items-center gap-4"><BackButton onClick={()=>void navigate({to:"/console"})}/><h1 className="text-2xl font-light">Friends & parties</h1></header><div className="min-h-0 flex-1"><SocialHub/></div></div></ConsoleShell>; }