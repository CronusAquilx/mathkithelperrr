import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Expand, Maximize2, Minimize2, RefreshCw, Settings2 } from "lucide-react";
import { DOWNLOAD_PROVIDERS, SERVER_CATEGORIES, STREAMING_SERVERS, type ServerCategory } from "@/lib/movies/tmdb";
import { useMovieDetail, useTVDetail } from "@/lib/movies/hooks";
import { useWatchHistory } from "@/lib/movies/watch-history";
import { cn } from "@/lib/utils";
import { RoomButton } from "@/components/RoomButton";
import { ProxiedPlayer } from "@/components/movies/ProxiedPlayer";
import { myRoomId, setRoomState, useRoom } from "@/lib/rooms";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { nextVoiceSource } from "@/lib/movies/voice-search";
import { anikotoSearchUrl, animeIcuVoiceUrl, animeVoiceUrl, supportsAnimationSources, type AnimeMatch } from "@/lib/movies/anime-sources";

const CAPTIONS = [
  ["off", "Off"], ["en", "English"], ["es", "Spanish"], ["fr", "French"],
  ["de", "German"], ["pt", "Portuguese"], ["ar", "Arabic"], ["hi", "Hindi"],
  ["ja", "Japanese"], ["ko", "Korean"], ["zh", "Chinese"],
] as const;

export const Route = createFileRoute("/_authenticated/movies/watch/$type/$id")({
  head: () => ({ meta: [{ title: "Watch \u2014 BirchBlock Movies" }, { name: "description", content: "Watch your selected movie or show with BirchBlock playback controls." }, { property: "og:title", content: "Watch \u2014 BirchBlock Movies" }, { property: "og:description", content: "Watch your selected movie or show with BirchBlock playback controls." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  validateSearch: (q: Record<string, unknown>): { s?: number; e?: number; t?: number } => {
    const num = (v: unknown) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.floor(Number(v)) : undefined);
    const out: { s?: number; e?: number; t?: number } = {};
    const s = num(q["s"]), e = num(q["e"]), t = num(q["t"]);
    if (s) out.s = s; if (e) out.e = e; if (t) out.t = t;
    return out;
  },
  component: WatchRoute,
});

// Remount the player when the title changes so season/episode state starts fresh.
function WatchRoute() {
  const { type, id } = Route.useParams();
  return <Watch key={`${type}-${id}`} />;
}

function Watch() {
  const { type, id } = Route.useParams();
  const n = Number(id);
  const isTV = type === "tv";
  const playerRef = useRef<HTMLDivElement>(null);
  const [school] = useState(() => localStorage.getItem("astra-watch-mode") === "school");
  const [server, setServerRaw] = useState(() => { if (localStorage.getItem("astra-watch-mode") === "school") return "apiplayer"; const saved = localStorage.getItem("astra-movie-server"); return saved && STREAMING_SERVERS.some((x) => x.id === saved) ? saved : STREAMING_SERVERS[0]?.id ?? ""; });
  const setServer = (v: string) => { if (!school) setServerRaw(v); };
  const [loaded, setLoaded] = useState(false);
  const triedRef = useRef<Set<string>>(new Set());
  const voiceTried = useRef(new Set<string>());
  const [voice, setVoice] = useState('auto');
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'searching' | 'found' | 'missing'>('idle');
  const [voiceAttempt, setVoiceAttempt] = useState(0);
  const [manualSource, setManualSource] = useState(false);
  const [animeMatches, setAnimeMatches] = useState<AnimeMatch[]>([]);
  const [animeId, setAnimeId] = useState<number | null>(null);
  const [anilistId, setAnilistId] = useState<number | null>(null);
  const [animeLookup, setAnimeLookup] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const resume = Route.useSearch();
  const [season, setSeason] = useState(resume.s ?? 1);
  const [episode, setEpisode] = useState(resume.e ?? 1);
  const [startAt, setStartAt] = useState(resume.t ?? 0);
  const [ready, setReady] = useState(Boolean(resume.s || resume.t));
  const rowRef = useRef<string | null>(null);
  const timeRef = useRef(0);
  const [theater, setTheater] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [fakeFullscreen, setFakeFullscreen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const [caption, setCaption] = useState(() => localStorage.getItem("astra-caption-language") || "off");
  const [category, setCategory] = useState<ServerCategory | "all">(() => (localStorage.getItem("astra-server-category") as ServerCategory | "all") || "new");
  const movie = useMovieDetail(isTV ? 0 : n);
  const tv = useTVDetail(isTV ? n : 0);
  const d = isTV ? tv.data : movie.data;
  const isAnime = supportsAnimationSources(d);
  const history = useWatchHistory();
  const room = useRoom("movies");
  const voiceSources = school ? STREAMING_SERVERS.filter(source => source.id === 'apiplayer') : [...(isAnime && animeId ? [{ id: 'anime-vidlink' }] : []), ...(isAnime && anilistId ? [{ id: 'anime-icu' }] : []), ...STREAMING_SERVERS];
  function chooseVoice(value: string) {
    setManualSource(false);
    setVoiceAttempt(attempt => attempt + 1);
    setVoice(value);
    voiceTried.current = new Set();
    setVoiceStatus(value === 'auto' ? 'idle' : 'searching');
    if (value !== 'auto' && !school && isAnime && animeId) setServerRaw('anime-vidlink');
    if (value === 'auto' && server.startsWith('anime-')) setServerRaw('vidlink');
  }
  function voiceResult(found: boolean) {
    if (voice === 'auto' || manualSource || voiceStatus !== 'searching') return;
    if (found) { setVoiceStatus('found'); return; }
    voiceTried.current.add(server);
    const next = nextVoiceSource(voiceSources, voiceTried.current);
    if (!next) { setVoiceStatus('missing'); return; }
    if (timeRef.current > 0) setStartAt(Math.floor(timeRef.current));
    setServerRaw(next);
  }
  useEffect(() => {
    if (voice === 'auto') return;
    voiceTried.current = new Set();
    setVoiceStatus('searching');
  }, [season, episode, voice]);
  useEffect(() => {
    if (!isAnime || !d || voice === 'auto' || animeLookup !== 'idle') return;
    setAnimeLookup('loading');
    let cancelled = false;
    fetch(`/api/movies?anime=${encodeURIComponent(d.name || d.title || '')}&token=guest`)
      .then(response => { if (!response.ok) throw new Error('lookup'); return response.json() as Promise<{ matches: AnimeMatch[] }>; })
      .then(result => { if (!cancelled) { setAnimeMatches(result.matches); setAnimeLookup('ready'); } })
      .catch(() => { if (!cancelled) setAnimeLookup('error'); });
    return () => { cancelled = true; };
  }, [isAnime, d?.id, voice]);
  useEffect(() => {
    setAnilistId(null);
    if (!animeId) return;
    const knownId = animeMatches.find(match => match.id === animeId)?.anilistId;
    if (knownId) { setAnilistId(knownId); return; }
    let cancelled = false;
    fetch(`/api/movies?animeMal=${animeId}&token=guest`).then(response => response.json() as Promise<{ anilistId: number | null }>).then(result => { if (!cancelled) setAnilistId(result.anilistId); }).catch(() => {});
    return () => { cancelled = true; };
  }, [animeId]);

  // Watch party: share what's playing, and follow changes others make.
  useEffect(() => {
    if (!room || room.status !== "live" || !ready) return;
    const m = room.state?.movie;
    if (m && m.type === type && m.id === n && (m.s ?? 0) === (isTV ? season : 0) && (m.e ?? 0) === (isTV ? episode : 0) && m.server === server) return;
    setRoomState("movies", { movie: { type, id: n, ...(isTV ? { s: season, e: episode } : {}), server } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.status, season, episode, server, ready]);
  useEffect(() => {
    const st = room?.state;
    if (!st?.movie || st.by === myRoomId()) return;
    const m = st.movie;
    if (m.type !== type || m.id !== n) return;
    if (isTV && m.s && m.s !== season) { setStartAt(0); setSeason(m.s); }
    if (isTV && m.e && m.e !== episode) { setStartAt(0); setEpisode(m.e); }
    if (m.server && m.server !== server && STREAMING_SERVERS.some((x) => x.id === m.server)) setServerRaw(m.server);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.state?.v]);

  // Pick up where the viewer left off when no exact spot was given.
  useEffect(() => {
    if (ready || history.isLoading) return;
    const last = history.data?.find((h) => h.tmdb_id === n && h.media_type === type);
    if (last) {
      if (last.season) setSeason(last.season);
      if (last.episode) setEpisode(last.episode);
      if (last.progress) setStartAt(Math.floor(last.progress));
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.isLoading, ready]);

  // Players report their playback time via postMessage; remember the latest.
  useEffect(() => {
    const find = (o: any, depth = 0): number | null => {
      if (!o || typeof o !== "object" || depth > 4) return null;
      for (const k of ["currentTime", "current_time", "time", "position", "progress"]) {
        const v = Number(o[k]);
        if (k in o && Number.isFinite(v) && v > 0 && (k !== "progress" || v > 1)) return typeof o[k] === "object" ? find(o[k], depth + 1) : v;
      }
      for (const v of Object.values(o)) { const r = find(v, depth + 1); if (r) return r; }
      return null;
    };
    const onMsg = (ev: MessageEvent) => {
      let data = ev.data;
      if (typeof data === "string") { try { data = JSON.parse(data); } catch { return; } }
      const t = find(data);
      if (t && t < 60 * 60 * 6) timeRef.current = t;
    };
    window.addEventListener("message", onMsg);
    const save = () => { if (rowRef.current && timeRef.current > 5) void history.saveProgress(rowRef.current, timeRef.current); };
    const timer = setInterval(save, 10000);
    window.addEventListener("pagehide", save);
    return () => { save(); clearInterval(timer); window.removeEventListener("message", onMsg); window.removeEventListener("pagehide", save); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!d || !ready) return;
    rowRef.current = null;
    timeRef.current = 0;
    history.record.mutateAsync({ tmdb_id: n, media_type: type, title: d.title || d.name || "", ...(d.poster_path ? { poster_path: d.poster_path } : {}), ...(isTV ? { season, episode } : {}), ...(startAt ? { progress: startAt } : {}) })
      .then((rowId) => { rowRef.current = rowId; }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d?.id, season, episode, ready]);

  useEffect(() => {
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  useEffect(() => {
    if (!school) localStorage.setItem("astra-movie-server", server);
    localStorage.setItem("astra-caption-language", caption);
    localStorage.setItem("astra-server-category", category);
  }, [server, caption, category]);

  useEffect(() => {
    if (!fakeFullscreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setFakeFullscreen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [fakeFullscreen]);

  useEffect(() => { triedRef.current = new Set(); }, [n, season, episode]);

  // Auto-pick a new source when the current one doesn't load in time.
  useEffect(() => { setLoaded(false); triedRef.current.add(server); }, [server, season, episode, n]);
  useEffect(() => {
    if (loaded || voice !== 'auto' || manualSource) return;
    const timer = setTimeout(() => {
      const next = STREAMING_SERVERS.find((x) => !triedRef.current.has(x.id));
      if (next) setServer(next.id);
    }, 12000);
    return () => clearTimeout(timer);
  }, [server, season, episode, n, loaded, voice, manualSource]);

  const s = STREAMING_SERVERS.find((x) => x.id === server) ?? STREAMING_SERVERS[0];
  if (!s) return null;
  const seasons = tv.data?.seasons?.filter((x) => x.season_number > 0) ?? [];
  const epCount = seasons.find((x) => x.season_number === season)?.episode_count ?? 1;
  const filteredServers = category === "all" ? STREAMING_SERVERS : STREAMING_SERVERS.filter((item) => item.category === category);
  const usingAnimeSource = server === 'anime-vidlink' && animeId !== null && voice !== 'auto';
  const usingIcuAnime = server === 'anime-icu' && anilistId !== null && voice !== 'auto';
  const usingAnikoto = server === 'anikoto';
  const sourceName = usingAnikoto ? 'Anikoto' : usingAnimeSource ? 'VidLink Anime' : usingIcuAnime ? 'VidSrc.icu Anime' : s.name;
  const baseUrl = usingAnikoto ? anikotoSearchUrl(d?.title || d?.name || '') : usingAnimeSource ? animeVoiceUrl(animeId, episode, voice === 'en' ? 'en' : 'ja') : usingIcuAnime ? animeIcuVoiceUrl(anilistId, episode, voice === 'en' ? 'en' : 'ja') : s.url(n, type, isTV ? season : undefined, isTV ? episode : undefined);
  const directUrl = `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}autoplay=1${caption !== "off" ? `&sub_lang=${caption}` : ""}${startAt ? `&startAt=${startAt}&progress=${startAt}&t=${startAt}&start=${startAt}` : ""}`;
  const embedUrl = usingAnikoto ? baseUrl : directUrl;

  const toggleFullscreen = useCallback(async () => {
    const player = playerRef.current;
    if (!player) return;
    if (fakeFullscreen) {
      setFakeFullscreen(false);
      return;
    }
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (player.requestFullscreen) await player.requestFullscreen();
      else setFakeFullscreen(true);
    } catch {
      setFakeFullscreen(true);
    }
  }, [fakeFullscreen]);

  function tryNextServer() {
    const index = STREAMING_SERVERS.findIndex((item) => item.id === server);
    setServer(STREAMING_SERVERS[(index + 1) % STREAMING_SERVERS.length]?.id ?? STREAMING_SERVERS[0]?.id ?? server);
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <header className="grid h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-border px-3 sm:px-5">
        <Button asChild variant="ghost" size="icon"><Link to="/movies/title/$type/$id" params={{ type, id }} aria-label="Back to details"><ArrowLeft /></Link></Button>
        <h1 className="min-w-0 truncate text-sm font-medium sm:text-base">{d?.title || d?.name || "Loading…"}{isTV ? ` · S${season} E${episode}` : ""}</h1>
        <div className="flex shrink-0 items-center gap-2"><span className="hidden text-xs text-muted-foreground sm:block">Playing on <strong className="text-foreground">{sourceName}</strong></span><RoomButton kind="movies" /></div>
      </header>
      <div className={cn("mx-auto px-3 py-3 sm:px-5", theater ? "max-w-none" : "max-w-7xl")}>
        <div ref={playerRef} className={cn("relative overflow-hidden border border-border bg-card shadow-2xl", theater ? "h-[76dvh]" : "aspect-video", fakeFullscreen && "fixed inset-0 z-50 h-dvh w-screen border-0", fullscreen ? "h-screen w-screen border-0" : "rounded-md")}>
          {!ready ? <div className="grid size-full place-items-center text-sm text-muted-foreground">Finding where you left off…</div> : <ProxiedPlayer key={`${server}-${season}-${episode}-${caption}`} src={embedUrl} anime={isAnime} voice={voice} searchAttempt={voiceAttempt} autoVoiceSearch={!manualSource} {...(usingAnikoto ? {} : { onVoiceChange: chooseVoice })} onVoiceResult={voiceResult} title={`${d?.title || d?.name || "Movie"} player`} onLoad={() => setLoaded(true)} onError={() => { if (!manualSource) { if (voice !== 'auto') voiceResult(false); else tryNextServer(); } }} />}
          {fakeFullscreen && <Button type="button" variant="secondary" size="icon" onClick={() => setFakeFullscreen(false)} aria-label="Exit fullscreen" className="absolute right-3 top-3 z-10 rounded-full"><Minimize2 /></Button>}
        </div>
        {!fullscreen && !fakeFullscreen && <>
          {voice !== 'auto' && <div className="mt-3 space-y-2">
            <p role="status" className="text-sm text-muted-foreground">{manualSource ? `Automatic language search paused · ${sourceName}` : voiceStatus === 'found' ? `${voice === 'en' ? 'English' : 'Japanese'} audio selected on ${sourceName}.` : voiceStatus === 'missing' ? `These sources did not expose a verifiable ${voice === 'en' ? 'English' : 'Japanese'} track. This does not mean a dub does not exist.` : `Looking for ${voice === 'en' ? 'English' : 'Japanese'} audio · ${sourceName} · ${voiceTried.current.size + 1}/${voiceSources.length}`}</p>
            {voiceStatus === 'missing' && <Button variant="outline" size="sm" onClick={() => { chooseVoice(voice); setServerRaw(voiceSources[0]?.id ?? server); }}>Retry language search</Button>}
            {isAnime && !school && <>
              {animeLookup === 'loading' && <p className="text-xs text-muted-foreground">Finding dedicated anime sources…</p>}
              {animeMatches.length > 0 && <Select value={animeId ? String(animeId) : ''} onValueChange={value => { setAnimeId(Number(value)); voiceTried.current = new Set(); setVoiceStatus('searching'); setServerRaw('anime-vidlink'); }}><SelectTrigger aria-label="Confirm anime series for dub"><SelectValue placeholder="Choose matching anime series / season" /></SelectTrigger><SelectContent>{animeMatches.map(match => <SelectItem key={match.id} value={String(match.id)}>{match.title}{match.episodes ? ` · ${match.episodes} episodes` : ''}</SelectItem>)}</SelectContent></Select>}
              {(animeLookup === 'error' || (animeLookup === 'ready' && !animeMatches.length)) && <p className="text-xs text-muted-foreground">Dedicated anime lookup unavailable; checking regular sources.</p>}
            </>}
          </div>}
          {isAnime && !school && <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => { setManualSource(true); setServerRaw('anikoto'); }}>Anikoto</Button>
            {n === 663558 && !isTV && <Button asChild variant="outline" size="sm"><a href="https://www.netflix.com/title/81418302" target="_blank" rel="noopener noreferrer">English on Netflix · subscription required</a></Button>}
          </div>}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant={theater ? "default" : "secondary"} size="sm" onClick={() => setTheater((value) => !value)}><Expand />{theater ? "Exit theater" : "Theater"}</Button>
            <Button type="button" variant="secondary" size="sm" onClick={toggleFullscreen}><Maximize2 />Fullscreen</Button>
            {isTV && <>
              <Button type="button" variant="secondary" size="sm" onClick={() => { setStartAt(0); setEpisode((value) => Math.max(1, value - 1)); }} disabled={episode === 1}><ChevronLeft />Previous</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => { setStartAt(0); setEpisode((value) => Math.min(epCount, value + 1)); }} disabled={episode === epCount}>Next<ChevronRight /></Button>
            </>}
            <div className="relative">
              <Button type="button" variant="secondary" size="sm" onClick={() => setDownloadsOpen((value) => !value)}><Download />Download</Button>
              {downloadsOpen && <div className="absolute left-0 top-full z-30 mt-1 min-w-48 rounded-md border border-border bg-popover p-1 shadow-xl">
                {DOWNLOAD_PROVIDERS.map((provider) => <a key={provider.id} href={provider.url(n, type, isTV ? season : undefined, isTV ? episode : undefined)} target="_blank" rel="noreferrer" className="block rounded px-3 py-2 text-sm hover:bg-accent">{provider.name}</a>)}
              </div>}
            </div>
            <Button type="button" variant={settingsOpen ? "default" : "secondary"} size="sm" onClick={() => setSettingsOpen((value) => !value)} className="sm:ml-auto"><Settings2 />Player settings</Button>
          </div>

          {settingsOpen && <section className="mt-3 border-y border-border py-4">
            <h2 className="label-mono">Player settings</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm"><span className="text-muted-foreground">Caption language</span>
                <Select value={caption} onValueChange={setCaption}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CAPTIONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
              </label>
              <div className="space-y-1.5"><span className="text-sm text-muted-foreground">Playback</span><p className="text-xs leading-relaxed text-muted-foreground">Speed, audio tracks, and quality remain available inside supported players.</p></div>
            </div>
          </section>}

          {isTV && seasons.length > 0 && <div className="mt-4 grid grid-cols-2 gap-2 sm:max-w-md">
            <Select value={String(season)} onValueChange={(value) => { setStartAt(0); setSeason(Number(value)); setEpisode(1); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{seasons.map((item) => <SelectItem key={item.season_number} value={String(item.season_number)}>{item.name}</SelectItem>)}</SelectContent></Select>
            <Select value={String(episode)} onValueChange={(value) => { setStartAt(0); setEpisode(Number(value)); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: epCount }, (_, index) => <SelectItem key={index + 1} value={String(index + 1)}>Episode {index + 1}</SelectItem>)}</SelectContent></Select>
          </div>}

          {school ? <p className="mt-5 border-t border-border pt-4 pb-10 text-sm text-muted-foreground">School mode: playing on APIPlayer, the source that works on school networks. Switch to home mode by reopening the Movies tab.</p> :
          <section className="mt-5 border-t border-border pt-4 pb-10">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0"><h2 className="font-display text-2xl">Streaming server</h2><p className="truncate text-xs text-muted-foreground">Try another source if playback does not start.</p></div>
              <Button type="button" variant="outline" size="sm" onClick={tryNextServer}><RefreshCw />Try next</Button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-[14rem_minmax(0,1fr)]">
              <Select value={category} onValueChange={(value) => setCategory(value as ServerCategory | "all")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{SERVER_CATEGORIES.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
              <Select value={server} onValueChange={value => { setManualSource(true); setServer(value); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{filteredServers.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}{isAnime && <SelectItem value="anikoto">Anikoto</SelectItem>}</SelectContent></Select>
            </div>
          </section>}
        </>}
      </div>
    </div>
  );
}
