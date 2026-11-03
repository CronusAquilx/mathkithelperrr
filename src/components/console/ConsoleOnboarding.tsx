import { useState } from "react";
import { Monitor, Smartphone, Tablet, Gamepad2, LayoutGrid, ArrowLeft, Music, Film, Bot, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrefs, setPrefs, setAppearance, flushPreferences, getPrefsSnapshot, type Prefs } from "@/lib/astra/prefs";
import { ConsoleShell } from "./ConsoleShell";
import { useConsoleInput } from "@/lib/console/nav";
import { useVisit } from "@/lib/console/visit";
import { useServerFn } from "@tanstack/react-start";
import { finishAccountSetup } from "@/lib/astra/accounts.functions";
import { useNavigate } from "@tanstack/react-router";
import { visitDestination } from "@/lib/console/visit";
import { toast } from "sonner";
import { activeLayout, type AppearanceProfile } from "@/lib/astra/appearance";
import { PersonalizationSetup } from "./PersonalizationSetup";
export function ConsoleOnboarding({accountSetup=false}:{accountSetup?:boolean}) {
 const p=usePrefs();const {send}=useVisit();const [step,setStep]=useState(accountSetup?1:0);const [selected,setSelected]=useState(0);
 const finish=useServerFn(finishAccountSetup); const navigate=useNavigate();const [busy,setBusy]=useState(false);
 const choices=step===0 ? [{label:"PlayStation / PS5",icon:Gamepad2,value:"sony"},{label:"Xbox Series X",icon:Gamepad2,value:"series"},{label:"Wii",icon:Gamepad2,value:"wii"},{label:"Neutral",icon:LayoutGrid,value:"neutral"},{label:"Windows",icon:Monitor,value:"windows"},{label:"Switch",icon:Gamepad2,value:"switch"}] : step===1 ? [{label:"Laptop / desktop",icon:Monitor,value:"desktop"},{label:"Phone",icon:Smartphone,value:"phone"},{label:"Tablet",icon:Tablet,value:"tablet"}] : [{label:"Everything",icon:LayoutGrid,value:"all"},{label:"Games",icon:Gamepad2,value:"games"},{label:"Music",icon:Music,value:"music"},{label:"Movies",icon:Film,value:"movies"},{label:"AI",icon:Bot,value:"ai"},{label:"Web",icon:Globe,value:"web"}];
 const confirm = async (look: AppearanceProfile) => { setBusy(true); try { setAppearance(activeLayout(p), look); setPrefs({ consoleSetup: true }); await flushPreferences(); await finish(); send("account-confirmed"); await navigate({to:visitDestination(getPrefsSnapshot()),replace:true}); } catch(e) { toast.error(e instanceof Error ? e.message : "Couldn't save setup"); } finally { setBusy(false); } };
 const choose=async(n:number)=>{const c=choices[n];if(!c||busy||step===3)return;if(step===0){const consoleSkin=c.value==="sony"||c.value==="series"||c.value==="wii"||c.value==="neutral"?c.value:"off";setPrefs({console:consoleSkin,layout:c.value==="switch"?"switch":"windows"});send("choices-complete");return;}else if(step===1)setPrefs({device:c.value as Prefs["device"]});else setPrefs({focus:c.value as Prefs["focus"]});setStep(step+1);setSelected(0);};
 useConsoleInput(a=>{if(a==="left")setSelected(Math.max(0,selected-1));if(a==="right")setSelected(Math.min(choices.length-1,selected+1));if(a==="select")choose(selected);if(a==="back"&&step>0){setStep(step-1);setSelected(0);}});
 if(step===3)return <PersonalizationSetup busy={busy} onBack={()=>setStep(2)} onConfirm={look=>void confirm(look)}/>;
 return <ConsoleShell><div className="console-boot mx-auto flex h-dvh max-w-4xl flex-col justify-center overflow-y-auto px-6 py-10"><span className="mb-6 text-sm text-console-foreground/60">BIRCHBLOCK / WELCOME</span><h1 className="text-3xl font-light md:text-5xl">{step===0?"Choose your layout.":step===1?"What are you playing on?":"What do you want to show?"}</h1><p className="mt-4 text-console-foreground/65">{step===0?"Console or regular. Your choice.":step===1?"Choose your device.":"Make room for what you love."}</p><div className="mt-8 grid gap-4 sm:grid-cols-3">{choices.map((c,n)=><Button key={c.value} variant="console" size="console" onClick={()=>choose(n)} onFocus={()=>setSelected(n)} className={`flex min-h-28 flex-col items-start justify-between gap-5 rounded-lg border border-console-foreground/20 bg-console-panel/60 p-5 text-left md:min-h-36 ${n===selected?"ring-2 ring-console-foreground":""}`}><c.icon className="size-8"/><span className="text-base md:text-lg">{c.label}</span></Button>)}</div><div className="mt-8 flex justify-between text-sm text-console-foreground/50"><span>0{step+1} / 03</span>{step>0&&<Button variant="console" size="console" onClick={()=>{setStep(step-1);setSelected(0);}}><ArrowLeft/>Back</Button>}<span>{step>0&&p.console==="sony"?"Sony Console":""}</span></div></div></ConsoleShell>;
}
