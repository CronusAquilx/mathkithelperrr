import type { ReactNode } from "react";
import { useLocation, useHydrated } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useVisit } from "@/lib/console/visit";
import { ConsoleOnboarding } from "./ConsoleOnboarding";
import { AuthPage } from "@/components/astra/AuthPage";
export function VisitGate({children}:{children:ReactNode}) {
 const {loading}=useAuth();
 const hydrated=useHydrated();const {stage}=useVisit();const {pathname}=useLocation();
 // Standalone games and proxied pages never mount the app's welcome/login flow.
 if(pathname==="/play"||pathname==="/guest-play"||pathname.startsWith("/scramjet/"))return <>{children}</>;
 if(!hydrated||loading)return <div className="flex min-h-dvh items-center justify-center bg-background text-foreground">BirchBlock</div>;
 if(stage==="setup")return <ConsoleOnboarding/>;
 if(stage==="login")return <AuthPage/>;
 if(stage==="account-setup")return <ConsoleOnboarding accountSetup/>;
 return <>{children}</>;
}
