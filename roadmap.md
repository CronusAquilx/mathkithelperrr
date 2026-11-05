# Birchbeat import roadmap

## Current request — account personalization
- [x] Expand shared appearance controls and preview: original dots/accents, liquid glass, brightness, snow/fireflies, effect speed and clocks.
- [x] Add game/movie Windows desktop shortcuts and removal with stable title IDs and existing launch paths.
- [x] Save preferences and desktop customization per account, with isolated guest state; developer account brightness survived reload and readback.
- [x] Add first-account draft personalization preview before confirmation, including wallpaper and widget choices; focused checks only, broad user playtesting unchanged.

## Current request — maximum wallpaper sharpness
- [x] Confirm no app wallpaper FPS cap; remove image-motion scaling from videos, buffer originals and repair absolute/cache-busted saved preview URLs.
- [x] Verify native 3840×2160 playback with advancing frames and no CSS scaling; nine focused tests pass. Source softness and browser/device dropped frames cannot be uncapped into extra detail.

## Current request — original-quality wallpapers
- [x] Replace all 294 preview loops with original downloads: 186 native 4K-or-higher, 107 other HD originals, one native 720p; upgrade saved preview URLs automatically.
- [x] Probe imported video dimensions, pass 12 focused tests, and verify equipped Dreamy Landscape plays at 1920px rather than 480px.

## Current request — hide music bar and repair live playback
- [x] Add a persistent music-bar hide option with a way to restore it, without stopping songs.
- [x] Repair catalog video playback with an independent animation switch; 20 focused tests pass and guest UI hide/restore, animation playback under OS reduced motion and pause/resume verified.

## Current request — DesktopHut live wallpapers
- [x] Import all 294 unique collection entries: hosted animated preview loops and covers, searchable settings catalog, original 4K download links (user confirmed import permission).
- [x] Apply video wallpapers through shared appearance profiles across all layouts without touching music; shared silent video renderer honors motion/performance and pauses hidden tabs.
- [x] 13 focused tests pass; guest Settings search/select verified a moving wallpaper (480px preview). Full-resolution files are not hosted; broad app/account testing remains user-owned.

## Current request — complete Qaisify and search repair
- [x] Harden the reported catalog 500: retry main lookup, isolate album/artist failures, add secondary song catalog and same-search Retry; OWA OWA returns 30 tracks and six focused tests pass.
- [x] Restore original Qaisify navigation, eight themes, playback speed, sleep timer, library, liked songs and queue actions in the shared music view.
- [x] Original Library/Stats routes were absent, crossfade only stored a number, and Jamendo was unused; Library/Stats now have working views, while no fake crossfade or unused provider controls were transplanted.
- [ ] Verify listening, playlist persistence and visual fidelity across layouts — user requested to perform broad app checks personally.

## Current request — old Qaisify music app
- [x] Replace broken workspace connector with the user's saved server-only GOOGLE_API_KEY for YouTube lookups.
- [x] Confirm saved GOOGLE_API_KEY reaches the running music service — refreshed service; OWA OWA lookup returns five playable video candidates without a connection error.
- [x] Adapt supplied Qaisify source into shared Music: iTunes catalog, mood shelves, glass appearance and controlled YouTube playback.
- [x] Preserve shared playlist/player interfaces and guest restrictions; four focused tests passed and preview compilation clean.
- [ ] Verify provider playback — user performs listening checks by preference.

## Current request — console video references
- [x] Match uploaded PS5 and Xbox screen organization and smooth button transitions.
- [x] Add Wii channel-grid and Neutral black-sidebar layouts with shared working library, search, media, social and settings.
- [x] Preserve saved appearances and installed game IDs; tested guest layout choices, media navigation, Store search, layout switching and fullscreen. Signed-in storage remains unverified without a matching account.

## Current request — unified Windows desktop
- [x] Consolidate Classic/Launcher into Windows with existing settings and preserve Classic wallpaper.
- [x] Add GIF/video upload, wallpaper URL and four wallpaper choices including bundled Alpine motion (MP3 is audio, not visual wallpaper).
- [x] Add eight widget types, title/glass/dimension customization, drag/resize, removal and position reset; eliminate rail scrollbar and center clock independently.
- [x] Maximized windows reach viewport bottom and hide the taskbar. Browser verified at 1020×546: calculator result, title/width editing, dragging, video playback, no page errors. Signed-in storage checks remain blocked by account access noted below.

## Current request — personalization and widgets
- [x] Add a Switch-inspired app layout to welcome and settings, preserving existing shells.
- [x] Expose private wallpaper uploads and a custom accent picker independently for each layout.
- [x] Add desktop weather, per-account local notes and shared-player music widgets; guests keep notes only in memory.
- [x] 21 focused tests pass; guest browser flow verified Switch navigation, uploaded image preview, custom color, live Chicago weather and unsaved notes; phone view has no horizontal overflow or page errors.
- [ ] Verify signed-in private wallpaper upload and note readback — no auth account matches the requesting user; requires preview sign-in. Provider playback remains user-tested.

## Current request — Nezha and Anikoto
- [x] Netflix's official Nezha page lists English audio; Anikoto has dub entries but no documented embed API, and its real Nezha search returns Not Found.
- [x] Include Chinese animation in dedicated dub matching (Nezha resolves to MAL 44061 / AniList 116982); add proxied Anikoto site search and Nezha's official Netflix link with subscription notice. Repair same-source Retry and preserve manually selected sources.
- [x] 17 focused tests pass. Actual Nezha English playback inside Birch remains unverified: current sources have not supplied verifiable English audio; Netflix requires its own subscription/player.

## Current request — English source search
- [x] Add documented VidSrc.cc/ICU movie sources and VidLink/ICU dedicated anime dub routes, using viewer-confirmed MAL/AniList titles. Movie sources do not guarantee English audio.
- [x] English is selectable before tracks appear; search checks actual native/Video.js/JW/HLS audio, selects and verifies English, waits 25 seconds per source and stops after each source is tried once. School mode retains its source restriction.
- [x] 13 focused tests pass, real One Piece title lookup and identifier mapping return correctly, preview compilation clean. Actual provider dub/audio playback remains user-tested; unexposed audio cannot be verified automatically.

## Current request — spoken languages
- [x] Add shared movie audio-language choices from native/Video.js/JW Player tracks and English (Dub)/Japanese (Original) anime labels, separately from captions. Sources without accessible voice tracks show availability rather than invented choices.
- [x] Four audio-selection/unavailable-track regression tests pass; preview compilation clean. Real provider dub availability/playback remains user-tested.

## Current request — desktop polish
- [x] Add dock magnification, window opening/closing motion and selectable Rainfall/Lake ripples; wire Classic/Launcher image motion without overriding saved choices or reduced-motion controls.
- [x] Add shared Spotify, Crunchyroll, Chrome and Steam-shaped app icons and Microsoft-style Birch Store for existing apps (no new provider services or downloads).
- [x] Add four independently saved clock fonts; 15 regression tests and preview compilation pass. Browser verified Store-to-Music window, digital clock settings readback, changing live canvas and phone layout without overflow or page errors. Playback remains user-tested.

## Current request — video-referenced layouts
- [x] Inspect five uploaded reference videos: wallpaper desktops, centered weekday/date, colorful app docks, compact system bars and floating app windows.
- [x] Apply the references' desktop presentation to Classic/Launcher home and Windows: wallpaper, centered weekday/date/search, colorful bottom docks, compact system bar and existing Windows app windows. Preserve console layouts, saved wallpaper choices and music interface; this is a reference-inspired recreation, not a copy of those sites' private code or additional services.
- [x] Pass 13 appearance/preferences/window regression tests and clean preview compilation; verify all three guest home screens, Games navigation/window and 390×580 layouts with no page errors or horizontal overflow. Provider playback remains user-tested.

## Current request — account picker and guests
- [ ] Show layout first on each document, then shared account picker and Add User form across every layout.
- [ ] Support username/password accounts, optional contact email, and retain existing account compatibility.
- [ ] Add genuine guest games/media access without creating accounts or exposing private data.
- [ ] Limit device/focus questions to first-time setup; verify returning-account and guest flows.

## Current request — developer game additions
- [x] Add XO Beta to Cloud Games; its proxied startup screen loads, full gameplay is not verified.
- [x] Add developer-only URL game management across settings and integrate arcade/cloud catalogs and proxy launches.
- [x] Verified developer-account add/read/remove flows for arcade and cloud entries; inline arcade and standalone cloud both rendered the saved game's menu through their proxies. Database policies and server role checks enforce developer-only changes; 17 focused tests pass and preview compilation is clean.

## Current request — Rift Arena
- [x] Add the requested Rift Arena URL to the shared Cloud Games catalog and existing launch/settings flow.
- [x] Passed 20 catalog/relay/performance tests; proxied Quick Practice rendered the arena and character with no page errors; preview compilation clean. Full multiplayer matches remain unverified.

## Current request — distinct applications and effects
- [x] Redesign Windows music, movies, settings and other apps with desktop-specific layouts.
- [x] Give Sony and Xbox their own app presentation without changing Classic/Launcher.
- [x] Add separately saved animated wallpaper, particles and appearance controls; 15 regression tests pass; developer-account checks verified saved effects, one particle canvas, desktop app launches, Sony/Xbox music library and movie list navigation, with no page errors or phone overflow. Existing provider playback validation remains separate below.

## Current request — Windows desktop
- [x] Add Windows setup/settings selection and separately saved appearance.
- [x] Build desktop, Start/search, taskbar, tabbed movable/resizable windows, minimize/maximize/snap and task view.
- [x] Reuse games, music, movies, browser, AI, voice, memory, settings and social views; preserve standalone cloud gameplay.
- [x] Verify developer-account desktop tabs/detachment, minimize/restore, snap, dragging, maximize, Start search, app opening and saved accent; no overflow at 764×546 or 390×844, 17 regression tests pass and preview compilation clean. Existing provider playback/account checks remain listed separately below.

## Current request — layout personalization
- [x] Add separately saved light/dark modes, 20 color themes, 10 accents, text/corner/spacing controls, backgrounds, tile sizing, sidebar/rail widths, motion and clocks for Sony, Xbox Series X, Classic and Launcher in settings.
- [x] Apply appearance through shared tokens across console screens and media frames without changing gameplay preferences.
- [x] Pass 10 regression tests and verify developer-account settings: Sony light/rose, Xbox dark/mint, Classic gold and Launcher sky restore independently; 1020×546 layout has no horizontal overflow; preview compilation clean.

## Current request — console social features
- [x] Add opt-in player handles, friend requests, blocking, private text parties, global chat and friends activity.
- [x] Add shared social access and game/movie/music sharing across console layouts, plus privacy settings.
- [x] Validate signed-in handles, global message persistence, two-account friend requests/acceptance, party invitations/joining/live private chat, compact layout and nine regression tests; preview compilation clean.

## Current request — Retrora black screen
- [x] Reproduced malformed terrain addresses and local-host account bypass from unrewritten frontend location defaults; repaired the module before Scramjet rewriting for all transports.
- [x] Passed 29 focused regression tests and clean preview compilation; proxied terrain download returned 200 with 1,248,504 bytes, and match address retains Retrora's hostname.
- [ ] Verify signed-in Launch and full rendering — requires user's Retrora session and a working graphics adapter; automated browser is redirected to login after the corrected account check. Full gameplay remains unverified.

## Current request — game launch repairs and Freebuild
- [x] Repair BuildNow GG with its current game-only entry and verified files.crazygames.com assets; browser reached the rendered lobby and ConnectedToMasterServer after first-load downloads.
- [x] Repair Cyberpunk's slice/Link failed error: CSS URL replacement corrupted inline new URL constructors and diverted engine data to the wrong origin. Preserve constructors and relay both verified Cyberpunk CDN hosts; browser reached Starting Engine at 57% with no page errors.
- [x] Add EMX Freebuild as a separate browser simulator through the shared launch flow; clicked Play Freebuild, moved, and verified the rendered building scene.
- [x] Run 19 related regression tests; latest preview build passed.
- [ ] Verify BuildNow match completion, full Cyberpunk world and signed-in store-to-player flow — requires real GPU playtesting and the requesting user's preview sign-in; automatic session mint found no matching account. Startup/lobby verified, not completed matches.

## Current request — Fortnite browser games
- [x] Add Retrora Season 1 community Fortnite entry with complete-site proxy routing to preserve its virtual hostname, account navigation and online sockets.
- [x] Add separately labelled official Fortnite Xbox Cloud and GeForce NOW options; launch-routing and catalog tests pass (16 related tests).
- [x] Verify Retrora's styled login page, player script and 1.8.1 game manifest through the existing Epoxy proxy; all returned successfully.
- [ ] Verify actual Retrora match and official Fortnite stream — requires provider accounts; no Retrora account supplied and requesting user has no matching preview account for the default authenticated relay. No completed gameplay claimed.

## Current request — BuildNow GG and original 1v1.LOL
- [x] Repair BuildNow GG's separate provider frames/CDN assets and absolute URL construction; browser reached its rendered menu with ConnectedToMasterServer. 13 related tests pass. Full match and Google sign-in remain unverified; preview account does not match requesting user.
- [x] Verify availability of the real 1v1.LOL online service; official status page confirms permanent shutdown November 3, 2025. Removed replacement wording from BuildNow GG.

## Current request — Xbox Series X and Google sign-in
- [x] Build Xbox Series X home, library, store, media, themed settings/profile and guide using the existing catalog.
- [x] Expose Xbox Series X in welcome setup and layout settings; verified developer sign-in, app installation/library readback, guide, settings, Music without classic sidebar, and phone layout.
- [x] Repair blank/instant-closing OAuth routing and add regression coverage; delayed Google sign-in loads in a native 520×720 window that remains open.
- [ ] Verify completed Google login in the actual 1v1.LOL game — game host fails TLS connection from test network; Google credentials are not available for completion.

## Console Mode
- [x] Fix console media/installed-game document reloads and add bundled original game thumbnails; launch and visit-state regression tests pass.
- [ ] Verify these updated launches with a real account — automatic sign-in could not match the requesting user; needs preview sign-in.
- [x] Fix the diagnosed proxy startup failure by stripping browser transports from server execution; compilation and regression tests pass.
- [ ] Verify the fix on the published runtime — waiting for Publish changes; the published site still runs the previous snapshot.
- [x] Ask layout, device and content every new visit; always show matching login/account confirmation. Signed-out and restored-session flows verified.
- [x] Finish Sony media, actual games/apps store and library, first-launch layout choice, profile/background settings and verification.
- [x] Shared navigation, per-user library, Sony home/store/library/settings/profile.
- [x] Xbox Series X screens and guide.
- [ ] Xbox Classic screens and guide — separate earlier follow-up, not part of Series X request.
- [x] Sony settings picker, Home entry, documentation and verification.
- [ ] Real controller hardware and individual provider gameplay validation — needs controller/GPU playtesting; the OvO provider stayed on its loading screen during the browser check.

- [x] Import source and dependencies into the existing TanStack project.
- [x] Enable Lovable Cloud, migrate schema and wire authentication.
- [x] Reconcile configuration and verify preview launches.
- [ ] Import previous user records — no source data export supplied.

## Game smoothness
- [x] Apply GTA's supported performance profile with a native-quality option.
- [x] Use the standalone player by default for every Cloud game and lighten inline playback.
- [x] Remove proxy connection-selection delays and test profile/connection behavior.
- [x] Verify public relay isolation and manifest loading; eight regression tests pass.
- [ ] Verify signed-in launches and real FPS gains — signed-in cloud launch verified; FPS measurement requires playtesting on real GPU hardware.

## PS5 media rework (Oct 31)
- [x] Request a separate named Google window, preserve nested-frame callbacks and fix delayed fallback navigation; ten tests pass and browser displays proxied Google sign-in in a 520×720 window without replacing the game.
- [ ] Verify completed Google login back into 1v1.LOL — Google screen verified independently; actual game connection failed and automatic preview sign-in cannot match the requesting user's account.
- [x] Repair Google/Firebase blank-window handoff and native popup lifetime; nine regression tests pass and browser reaches Google's proxied sign-in screen without closing. Completed 1v1 sign-in remains in the account/playtesting check below.
- [x] Fix game sign-in replacing gameplay: early interception and arcade bridge open a separate proxied window; routing tests and browser popup check pass.
- [x] Music, Movies and AI open inside a PS5-style frame (no sidebar) while Console Mode is on.
- [x] Game thumbnails come from each game's source (arcade covers, cloud site screenshots) with genre art fallback.
- [x] All movie sources (VidSrc, APIPlayer, etc.) and free movies play through the proxy with their full address kept.
- [x] Game/website sign-in popups (e.g. Google) open in a proxied overlay.
- [x] YouTube, Netflix, Hulu and Paramount+ downloadable from the console store; open through the proxy.
- [ ] Signed-in check of these screens and real Google sign-in inside 1v1.LOL — needs a real account and playtesting.
- [ ] Import previous user records — no data export supplied.

## FPS & performance overlay (Nov 1)
- [x] In-game overlay with FPS, 1% low frame time, ping and memory for cloud (/play) and arcade players; corner move, Shift+F toggle, persisted in prefs.
- [x] Samples the game frame's own frame rate for same-origin relayed games; host page rate otherwise.
- [x] 12 perf-monitor/prefs tests pass; full suite 96 passed; browser-verified on Krunker (59 FPS readout, toggle, corner move).
