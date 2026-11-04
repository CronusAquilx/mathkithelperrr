import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Film, Gamepad2, Heart, Home, LayoutGrid, Library, Mail, Music, Paintbrush, Play, Search, Settings, ShoppingBag, Users, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { AppIcon } from "@/components/astra/AppIcon";
import { APPS, gameById, type ConsoleGame } from "@/lib/console/catalog";
import { consoleArtwork } from "@/lib/console/artwork";
import { useConsoleCtx } from "@/lib/console/ctx";
import { moveGrid, useCols, useConsoleInput } from "@/lib/console/nav";
import { playGame } from "@/lib/console/store";
import { usePlayer } from "@/lib/music/player";
import { useVisit } from "@/lib/console/visit";
import { cn } from "@/lib/utils";
import { ConsoleShell } from "./ConsoleShell";
import { Avatar, GameArt, GameDetails, statusOf } from "./shared";
import { XboxGuide } from "./xbox/XboxGuide";
import type { ConsoleScreenName } from "./ConsoleScreen";

export function ReferenceScreen({ screen, skin }: { screen: ConsoleScreenName; skin: "sony" | "series" | "neutral" | "wii" }) {
  const { go: navigate, lib, catalog, name, initial, clock, p, user } = useConsoleCtx();
  const go = (path: string) => {
    if (!user && path === "/console/social") { toast("Sign in with an account to use this feature"); return; }
    void navigate(path);
  };
  const player = usePlayer(); const { send } = useVisit();
  const [selected, setSelected] = useState(0); const [details, setDetails] = useState<ConsoleGame | null>(null);
  const [query, setQuery] = useState(""); const [filter, setFilter] = useState("all"); const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(0); const [guide, setGuide] = useState(false); const [online, setOnline] = useState(true);
  const refs = useRef<(HTMLButtonElement | null)[]>([]); const search = useRef<HTMLInputElement>(null);
  const home = screen === "home"; const media = screen === "media"; const store = screen === "store";
  const wii = skin === "wii"; const xbox = skin === "series"; const neutral = skin === "neutral";
  const cols = useCols(wii ? 4 : 6, 3, 2);
  const owned = useMemo(() => lib.installed.map(id => gameById(id, catalog.games)).filter((g): g is ConsoleGame => Boolean(g)), [lib.installed, catalog.games]);
  const readyApps = APPS.filter(g => !g.installable || lib.installed.includes(g.id));
  const recent = [...owned.filter(g => g.id === lib.lastPlayed), ...owned.filter(g => g.id !== lib.lastPlayed)];
  const source = home || media ? (media ? readyApps : [...recent, ...readyApps.filter(g => !recent.some(r => r.id === g.id))]) : store ? catalog.games : screen === "apps" ? readyApps : owned;
  const visible = source.filter(g => g.title.toLowerCase().includes(query.toLowerCase()) && (filter === "all" || filter === "favorites" && lib.wishlist.includes(g.id) || filter === g.kind || filter === "queue" && g.id in lib.progress));
  const items = sort === "az" ? [...visible].sort((a,b) => a.title.localeCompare(b.title)) : visible;
  const paged = wii ? items.slice(page * 12, page * 12 + 12) : items;
  const welcome = home && skin === "sony" && !query;
  const offset = welcome ? 1 : 0; const current = paged[selected - offset];
  const currentArtwork = current ? consoleArtwork(current) : undefined;
  const title = home ? current?.title ?? `Welcome back, ${name}` : media ? "Entertainment" : store ? "Game Store" : screen === "apps" ? "Channels" : "Full library";
  const launch = (game: ConsoleGame) => {
    if (wii || !(game.kind === "app" && !game.installable || lib.installed.includes(game.id))) setDetails(game);
    else playGame(game, go);
  };
  useEffect(() => { setSelected(0); setPage(0); setQuery(""); setFilter("all"); }, [screen, skin]);
  useEffect(() => { const update = () => setOnline(navigator.onLine); update(); window.addEventListener("online", update); window.addEventListener("offline", update); return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); }; }, []);
  const focus = (n: number) => { setSelected(n); refs.current[n]?.focus({ preventScroll: true }); refs.current[n]?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: p.reduceMotion ? "auto" : "smooth" }); };
  useConsoleInput(action => {
    if (details) { if (action === "back") setDetails(null); return; }
    if (action === "menu") { xbox ? setGuide(true) : go("/console/apps"); return; }
    if (action === "back") { go("/console"); return; }
    if (action === "options") { current ? setDetails(current) : go("/console/settings"); return; }
    if (action === "select") { refs.current[selected]?.click(); return; }
    if (action === "prev" || action === "next") { if (wii) { setPage(v => Math.max(0, Math.min(Math.ceil(items.length / 12) - 1, v + (action === "next" ? 1 : -1)))); setSelected(0); } else go(home ? "/console/media" : "/console"); return; }
    focus(moveGrid(selected, paged.length + offset, home && !wii ? paged.length + offset : cols, action));
  }, !guide);
  const routes = [
    { title: wii ? "Wii Menu" : "Home", icon: Home, path: "/console", active: home },
    { title: wii ? "Channels" : "My games & apps", icon: Library, path: "/console/library", active: screen === "library" },
    { title: "Store", icon: ShoppingBag, path: "/console/store", active: store },
    { title: "Friends", icon: Users, path: "/console/social", active: false },
    { title: "Entertainment", icon: Film, path: "/console/media", active: media },
    { title: "Settings", icon: Settings, path: "/console/settings", active: false },
  ];
  const appArt = (game: ConsoleGame) => game.kind === "app" && !game.installable ? <div className="reference-app-art" data-app={game.id.slice(4)}><AppIcon app={game.id === "app-ai" ? "chat" : game.id.slice(4)}/></div> : <GameArt game={game} title={false}/>;
  const tile = (game: ConsoleGame, n: number) => <Button key={game.id} ref={el => { refs.current[n + offset] = el; }} variant="console" size="console" aria-label={game.title} aria-pressed={selected === n + offset} onFocus={() => setSelected(n + offset)} onMouseEnter={() => setSelected(n + offset)} onClick={() => launch(game)} className={cn("reference-game", selected === n + offset && "is-focused")}>
    {appArt(game)}{lib.wishlist.includes(game.id) && <Heart className="reference-favorite"/>}
    {(neutral || wii || !home && !media) && <span className="reference-game-label"><strong>{game.title}</strong>{!wii && <small>{statusOf(game,lib)}</small>}</span>}
  </Button>;
  const track = player.queue[player.cur];
  return <ConsoleShell><div className={cn("reference-console", `reference-${skin}`)}>
    {home && currentArtwork && !neutral && !wii && p.consoleBg !== "custom" && <div className="reference-focus-art" key={current?.id}><img src={currentArtwork} alt="" referrerPolicy="no-referrer"/><div/></div>}
    <header className="reference-brandbar"><span><Gamepad2/>BirchBlock <small>{wii ? "Wii" : neutral ? "Neutral" : xbox ? "Xbox" : "PS5"}</small></span><div><Button variant="console" size="console" aria-label="Settings" title="Settings" onClick={() => go("/console/settings")}><Settings/></Button><Button variant="console" size="console" aria-label="Switch user or layout" title="Switch user or layout" onClick={() => send("restart")}><Users/></Button></div></header>
    <div className="reference-workspace">
      {(xbox || neutral || wii) && <aside className="reference-sidebar">
        {wii && <h2>Wii <small>BirchBlock</small></h2>}
        <Button variant="console" size="console" className="reference-account" onClick={() => go("/console/profile")}><Avatar initial={initial} className="size-8"/><span><strong>{user ? name : "Guest"}</strong><small>{user ? "Online" : "Guest session"}</small></span></Button>
        {routes.map(r => <Button variant="console" size="console" key={r.path} onClick={() => go(r.path)} aria-pressed={r.active} className="reference-nav"><r.icon/><span>{r.title}</span></Button>)}
        {xbox && <Button variant="console" size="console" onClick={() => setGuide(true)} className="reference-nav"><Gamepad2/><span>Xbox guide</span></Button>}
        <div className="reference-pinned">{readyApps.slice(0,4).map(g => <Button variant="console" size="console" key={g.id} onClick={() => launch(g)}>{appArt(g)}<span>{g.title}</span></Button>)}</div>
        <Button variant="console" size="console" className="reference-sidebar-bottom" onClick={() => go("/console/settings")}><Paintbrush/><span>Appearance</span></Button>
      </aside>}
      <main className="reference-main">
        <header className="reference-toolbar">
          {skin === "sony" ? <nav>{[{ title:"Home",path:"/console",active:home },{title:"Library",path:"/console/library",active:screen==="library"},{title:"Social",path:"/console/social",active:false},{title:"Media",path:"/console/media",active:media}].map(r => <Button variant="console" size="console" key={r.path} aria-pressed={r.active} onClick={() => go(r.path)}>{r.title}</Button>)}</nav> : <span className="reference-greeting">{home ? (wii ? "Wii Menu" : `Welcome back, ${name}`) : title}</span>}
          <div><Button variant="console" size="console" aria-label="Search games and apps" title="Search games and apps" onClick={() => search.current?.focus()}><Search/></Button><Button variant="console" size="console" aria-label="Friends and messages" title="Friends and messages" onClick={() => go("/console/social")}><Mail/></Button>{p.showClock && !wii && <time>{clock}</time>}</div>
        </header>
        {(neutral || !home && !media || query) && <form className="reference-search" onSubmit={e => e.preventDefault()}><Search/><Input ref={search} type="search" aria-label="Search library" placeholder="Quick launch — search games & apps" value={query} onChange={e => {setQuery(e.target.value);setPage(0);setSelected(0);}}/></form>}
        {!neutral && (home || media) && !query && <div className="reference-search-compact"><Input ref={search} type="search" aria-label="Search library" placeholder="Search games & apps" value={query} onChange={e=>setQuery(e.target.value)}/></div>}
        {!home && !media && <><h1 className="reference-page-title">{title}</h1><div className="reference-filters"><nav>{[{id:"all",label:"All"},{id:"arcade",label:"Arcade"},{id:"cloud",label:"Cloud"},{id:"app",label:"Apps"},{id:"favorites",label:"Favorites"}].map(f => <Button variant="console" size="console" key={f.id} aria-pressed={filter===f.id} onClick={()=>{setFilter(f.id);setPage(0);setSelected(0);}}>{f.label}</Button>)}</nav><select aria-label="Sort library" value={sort} onChange={e=>setSort(e.target.value)}><option value="recent">Recent</option><option value="az">Name A–Z</option></select></div></>}
        {neutral && home && <div className="reference-recent-heading"><h1>Recent</h1><span>Your games & apps</span></div>}
        <div className={cn("reference-games", home || media ? "is-shelf" : "is-grid")} aria-label={wii ? "Wii channels" : home ? "Recent games and apps" : "Game library"}>
          {welcome && <Button ref={el=>{refs.current[0]=el;}} variant="console" size="console" aria-label="Welcome" aria-pressed={selected===0} onMouseEnter={()=>setSelected(0)} onFocus={()=>setSelected(0)} onClick={()=>go("/console/library")} className={cn("reference-game reference-welcome",selected===0&&"is-focused")}><LayoutGrid/></Button>}
          {paged.map(tile)}
          {(home || media) && !wii && <Button variant="console" size="console" className="reference-game reference-welcome" onClick={()=>go("/console/store")} aria-label="Browse Store"><ShoppingBag/><span>Store</span></Button>}
          {wii && Array.from({length:Math.max(0,12-paged.length)},(_,n)=><Button key={`empty-${n}`} variant="console" size="console" aria-label="Add a channel" className="reference-game empty-channel" onClick={()=>go("/console/store")}><span>Wii</span></Button>)}
        </div>
        {!items.length && !wii && <div className="reference-empty"><Library/><h2>{query ? "No matching games or apps" : "Your library is empty"}</h2><Button variant="console" size="console" onClick={()=>go("/console/store")}><ShoppingBag/>Browse Store</Button></div>}
        {(home || media) && !wii && !neutral && <section className="reference-feature" key={current?.id ?? "welcome"}><h1>{title}</h1><p>{current?.tagline ?? "Your games, entertainment and friends."}</p><div><Button variant="console" size="console" className="reference-primary" onClick={()=>current?launch(current):go("/console/social")}>{current?<Play/>:<Users/>}{current?"Open":"Open Social"}</Button><Button variant="console" size="console" onClick={()=>go("/console/library")}><Library/>Game Library</Button></div></section>}
        {home && !wii && <section className="reference-status-grid">
          {[
            {icon:Library,title:"Your collection",value:`${owned.length} installed`,detail:`${lib.wishlist.length} favorites`,path:"/console/library"},
            {icon:Users,title:"Friends & messages",value:user?"Open Social":"Sign in to connect",detail:"Friends, parties and messages",path:"/console/social"},
            {icon:Music,title:"Now playing",value:track?.title??"Nothing playing",detail:track?.artist??"Find your next favorite",path:"/music"},
            {icon:Paintbrush,title:"Customize your Home",value:"Wallpaper & appearance",detail:"Make it yours",path:"/console/settings"},
            {icon:Wifi,title:"Network",value:online?"Connected":"Offline",detail:"Browser connection",path:"/console/settings"},
            {icon:ShoppingBag,title:"Discover",value:`${catalog.games.length} games & apps`,detail:"Explore the Store",path:"/console/store"},
          ].map(s=><Button variant="console" size="console" key={s.title} className="reference-status" onClick={()=>go(s.path)}><span><s.icon/>{s.title}</span><strong>{s.value}</strong><small>{s.detail}</small></Button>)}
        </section>}
        {wii && <div className="wii-pagination"><Button variant="console" size="console" aria-label="Previous channel page" disabled={page===0} onClick={()=>{setPage(v=>v-1);setSelected(0);}}><ChevronLeft/></Button><span>{page+1} / {Math.max(1,Math.ceil(items.length/12))}</span><Button variant="console" size="console" aria-label="Next channel page" disabled={(page+1)*12>=items.length} onClick={()=>{setPage(v=>v+1);setSelected(0);}}><ChevronRight/></Button></div>}
      </main>
    </div>
    {wii && <footer className="wii-footer"><Button variant="console" size="console" onClick={()=>go("/console/settings")} aria-label="Wii settings">Wii</Button><Button variant="console" size="console" onClick={()=>go("/console/store")} aria-label="Channel Store"><ShoppingBag/></Button><div><time>{p.showClock?clock:"Wii Menu"}</time><span>{new Date().toLocaleDateString([], {weekday:"short",month:"numeric",day:"numeric"})}</span></div><Button variant="console" size="console" onClick={()=>go("/console/social")} aria-label="Wii message board"><Mail/></Button></footer>}
  </div>{details && <GameDetails game={details} lib={lib} close={()=>setDetails(null)}/>} {guide && <XboxGuide close={()=>setGuide(false)}/>}</ConsoleShell>;
}