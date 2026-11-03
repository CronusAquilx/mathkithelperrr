# BIRCH OS

BIRCH OS is a browser-based desktop environment and software-development/interface-design project. It renders a full desktop shell in the browser — draggable app windows, a launcher and app library, system settings, and multiple switchable layouts (Windows-style desktop, console skins, and a handheld-style shell) — all built with interactive web technologies.

Personalization is a first-class feature: live wallpapers, accent themes, liquid-glass surfaces, particle and weather effects, clock styles, and per-account presets that sync across every layout. Media apps (music, movies, web browsing) and optional game shortcuts live inside the shell as ordinary apps.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development and deployment

Canonical source: `https://github.com/chickneboinki/birchbeathelperer`, branch `main`. Do not replace it with an old import repository.

Use Node.js 22+ and Bun: `bun install`, `bun run dev`, `bun run test`, `bun run lint`. Production uses `bun run build`; the Lovable editor runs compilation checks automatically. This is a full-stack TanStack Start app, not a static export: frontend-only hosting breaks auth and API integrations. Publish from Lovable or use a compatible Worker deployment with server bindings, WebSocket support and the existing server entry.

### Environment variable names

Publishable client configuration: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`.

Server configuration: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`, `ADMIN_ACCESS_CODE`. Optional integrations: `GOOGLE_API_KEY`, `UDC_QAISIFY_YOUTUBE_API_KEY`, `PIPED_INSTANCES`, `SAAVN_API`, `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`. Model registry rows can name additional server-only variables.

Never commit private credentials or environment files. Store private values in Project Settings → Secrets; never prefix them with `VITE_`. The editor manages the local environment file. Its tracked version contained only publishable configuration, not a service-role key or third-party private credential. Ignore rules do not remove already tracked files or erase history; repository tracking must be checked separately.

### Backend and service limitations

The configured backend owns accounts, sessions, preferences, playlists, watchlists and saves. Historical SQL is in `drizzle/migrations`; do not replay destructive import/drop/restore migrations against an existing database. Apply reviewed incremental migrations with grants and owner policies. No destructive database changes were made during this reliability pass.

Catalog results do not prove playback. YouTube, Piped, JioSaavn and streaming providers may restrict or stop serving content. Movie metadata is independent from video availability. Cloud games are real provider links, not hosted native games; subscriptions and device requirements apply. Proxy availability depends on transport and upstream services. AI needs its configured endpoint or hosted integration; a built-in response is not proof of a remote model working.

### Verification

The reliability pass repaired account-scoped window restoration, console navigation, token-refresh handling, search error reporting and movie hook ordering, and updated stale tests. Legacy `any` types and effect-dependency warnings remain visible in lint; formatting is separate to avoid unrelated rewrites.

Existing security results include informational shared-catalog read findings. The database linter also flags callable functions and a locked table; these require review rather than automatic removal. No recent deep-scan result establishes overall app security: run a fresh scan from the Security tab before declaring security review complete.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Console Mode

Sony Console includes Games and Media home screens, real cloud and arcade games, install/uninstall and wishlist menus, an app library, profile editing, background selection, and device/layout setup. Installations are library shortcuts simulated locally per signed-in user; provider subscriptions and hardware requirements still apply.

### Adding a skin

A skin consists of scoped theme tokens in `src/styles.css`, a layout configuration in `src/lib/console/skins.ts`, and home/store/library/settings/profile components. Add its ID to preferences, register the components in `ConsoleScreen`, and expose it in layout selection only once those screens work. Reuse `useConsoleCtx`, `useConsoleInput`, catalog queries, and library actions; do not change classic/launcher or gameplay layouts. Focus sounds default off and all motion respects reduced-motion preferences. Xbox layouts reuse the shared catalog and account preferences.
