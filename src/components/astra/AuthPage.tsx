import { useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, UserRound, ArrowLeft, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { usePrefs, activatePreferenceAccount, getPrefsSnapshot } from "@/lib/astra/prefs";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usernameSignIn, usernameSignUp, accountSetupStatus } from "@/lib/astra/accounts.functions";
import { useVisit, visitDestination } from "@/lib/console/visit";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { useClock } from "@/lib/console/ctx";
import { DevPanel } from "@/components/astra/DevPanel";

export function AuthPage() {
  const { session, user, enterGuest } = useAuth(); const { send } = useVisit(); const p = usePrefs();
  const navigate = useNavigate(); const router = useRouter(); const queryClient = useQueryClient(); const clock = useClock();
  const [mode, setMode] = useState<"picker"|"in"|"up">("picker");
  const [username,setUsername]=useState(""); const [password,setPassword]=useState(""); const [email,setEmail]=useState("");
  const [busy,setBusy]=useState(false); const [message,setMessage]=useState(""); const [devOpen,setDevOpen]=useState(false);
  const login=useServerFn(usernameSignIn);const signup=useServerFn(usernameSignUp);const status=useServerFn(accountSetupStatus);
  const name=String(user?.user_metadata?.["name"]??user?.user_metadata?.["full_name"]??user?.email?.split("@")[0]??"Player");
  const skin=p.console==="sony"?"PlayStation / PS5":p.console==="series"?"Xbox Series X":p.console==="wii"?"Wii":p.console==="neutral"?"Neutral":p.layout==="switch"?"Switch":"Windows";
  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      const t=e.target as HTMLElement|null;
      if(t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.isContentEditable))return;
      if(e.key===")"){e.preventDefault();setDevOpen(true);}
    };
    window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);
  },[]);
  async function enter() {
    const verified = await supabase.auth.getUser();
    if (verified.data.user) await activatePreferenceAccount(verified.data.user.id);
    await router.invalidate();
    const complete=await status();
    if(!complete){send("setup-needed");return;}
    send("account-confirmed");await navigate({to:visitDestination(getPrefsSnapshot()),replace:true});
  }
  async function submit(e:React.FormEvent) {
    e.preventDefault();setBusy(true);setMessage("");
    try {
      await queryClient.cancelQueries();queryClient.clear();
      if(mode==="up")await signup({data:{username,password,email}});
      const tokens=await login({data:{username,password}});const result=await supabase.auth.setSession(tokens);if(result.error)throw result.error;
      await enter();
    }catch(err){setMessage(err instanceof Error?err.message:"Couldn't sign in.");}finally{setBusy(false);}
  }
  async function guest() {
    setBusy(true);
    try{
      await queryClient.cancelQueries();queryClient.clear();
      const result=await supabase.auth.signOut();if(result.error)throw result.error;
      enterGuest();send("account-confirmed");await navigate({to:visitDestination(p),replace:true});
    }
    catch(err){setMessage(err instanceof Error?err.message:"Couldn't continue as guest.");}finally{setBusy(false);}
  }
  async function social(provider:"google"|"lovable") {
    const result=await lovable.auth.signInWithOAuth(provider,{redirect_uri:window.location.origin});
    if(result.error)toast.error(result.error.message??"Sign-in failed");
    else{const verified=await supabase.auth.getUser();if(verified.data.user)await enter();}
  }
  const change=(next:"picker"|"in"|"up")=>{setMode(next);setMessage("");setPassword("");};
  return <ConsoleShell><header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-5"><Button variant="console" size="console" onClick={()=>mode==="picker"?send("restart"):change("picker")}><ArrowLeft/>{mode==="picker"?"Layout":"Back"}</Button><span>{clock}</span></header>
    <button type="button" aria-hidden="true" tabIndex={-1} className="absolute right-0 top-0 z-20 size-14 opacity-0" onClick={()=>setDevOpen(true)}/>
    <DevPanel open={devOpen} onOpenChange={setDevOpen} onSignedIn={async()=>{await queryClient.cancelQueries();queryClient.clear();await enter();}}/>
    <main className={`account-opening account-opening-${p.console!=="off"?p.console:p.layout} relative flex h-dvh flex-col items-center overflow-y-auto px-6 pb-10 pt-24 text-center`}>
      <span className="text-xs uppercase text-console-foreground/60">{skin}</span>
      <h1 className="mt-5 text-3xl font-light md:text-5xl">{mode==="picker"?"Welcome Back":mode==="up"?"Add User":"Sign In"}</h1>
      {mode==="picker"?<><p className="mt-4 text-console-foreground/70">Who&apos;s using {p.console!=="off"?"this controller":"this device"}?</p><div className="mt-10 flex flex-wrap items-start justify-center gap-8">
        <div className="flex flex-col items-center gap-4"><Button variant="console" size="console" className="flex size-24 items-center justify-center rounded-full bg-console-foreground/10 md:size-32" aria-label="Add user" onClick={()=>change("up")}><Plus className="size-9"/></Button><span>Add User</span></div>
        {session&&<div className="flex flex-col items-center gap-4"><Button variant="console" size="console" className="flex size-24 items-center justify-center rounded-full bg-console-panel/80 text-4xl ring-2 ring-console-accent md:size-32" aria-label={`Continue as ${name}`} disabled={busy} onClick={()=>{setBusy(true);void enter().catch(e=>setMessage(e.message)).finally(()=>setBusy(false));}}>{name.slice(0,1).toUpperCase()}</Button><span>{name}</span></div>}
        <div className="flex flex-col items-center gap-4"><Button variant="console" size="console" className="flex size-24 items-center justify-center rounded-full bg-console-foreground/10 md:size-32" aria-label="Sign in to another account" onClick={()=>change("in")}><LogIn className="size-9"/></Button><span>Sign In</span></div>
      </div><Button variant="console" size="console" className="mt-10 rounded-full bg-console-foreground/15 px-10 py-3" disabled={busy} onClick={guest}><UserRound/>Continue without an account</Button><p className="mt-3 max-w-md text-sm text-console-foreground/65">Guest play: same layout as an account, but game progress, movie history and music playlists won&apos;t be saved.</p></>:<div className="console-login-form mt-8 w-full max-w-md text-left"><div className="mx-auto mb-7 flex size-24 items-center justify-center rounded-full bg-console-foreground/15 text-4xl">{username?username.slice(0,1).toUpperCase():<UserRound className="size-10"/>}</div><form onSubmit={submit} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="username">{mode==="up"?"Name / Username":"Username"}</Label><Input id="username" required autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} placeholder={mode==="up"?"Your username":"Username or existing account email"} minLength={mode==="up"?3:1} maxLength={mode==="up"?24:254}/></div>
        <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete={mode==="up"?"new-password":"current-password"} required minLength={mode==="up"?6:1} value={password} onChange={e=>setPassword(e.target.value)}/></div>
        {mode==="up"&&<><div className="space-y-2"><Label htmlFor="contact-email">Email (optional)</Label><Input id="contact-email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></div><p className="text-xs text-console-foreground/65">Use your username to sign in. Optional email is contact information only; email password recovery isn&apos;t available for username accounts.</p></>}
        <div className="flex gap-3 pt-3"><Button type="button" variant="outline" className="flex-1" onClick={()=>change("picker")}>Cancel</Button><Button type="submit" className="flex-1" disabled={busy}>{busy?"Please wait…":mode==="up"?"Create account":"Sign in"}</Button></div>
      </form><div className="mt-5 flex flex-wrap justify-center gap-2"><Button variant="ghost" onClick={()=>void social("google")}>Google</Button><Button variant="ghost" onClick={()=>void social("lovable")}>Lovable</Button><Button variant="ghost" onClick={()=>change(mode==="up"?"in":"up")}>{mode==="up"?"Already have an account?":"Add User"}</Button><Button variant="ghost" disabled={busy} onClick={guest}>Continue as guest</Button></div></div>}
      {message&&<p role="alert" className="mt-5 max-w-md text-sm text-destructive">{message}</p>}
    </main></ConsoleShell>;
}
