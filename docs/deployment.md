# Birch OS deployment architecture

## One website, separate private file storage

Canonical website: https://mathkithelperrr.lovable.app

Lovable hosts **both** the built React assets and the TanStack Start server. The existing `@lovable.dev/vite-tanstack-config` composes TanStack Start and Nitro and selects the platform's fully bundled fetch/Cloudflare-compatible runtime. Preserve this package's deployment selection: hosting can select its supported fetch bundle automatically. There is no separate application-authored Nitro config.

`src/server.ts` is the server entry and preserves SSR error handling, authenticated live voice and WebSocket proxy upgrades. `src/start.ts` supplies bearer attachment and server-function CSRF checks. API routes, server functions and account checks must deploy together with the client. The WebSocket implementation uses `WebSocketPair`; replacing this with a generic Node start script would not preserve functionality.

Fluxlinkk is a **separate service for private user files**, not the website host. Birch authenticates the account server-side, then Flux scopes files under `birchos/<verified-user-id>/`. Only short-lived signed transfer URLs and safe file metadata reach the browser. S3 receives file bytes directly; no `index.html` deployment, public bucket, IAM change or second AWS integration is needed.

## Commands and deployment

- `bun install --frozen-lockfile`: install the existing lockfile.
- `bun run dev`: local development.
- `bun run build`: the actual production command, `vite build`; builds the complete server and client rather than a static HTML export.
- `bun run preview`: Vite build preview, **not** a replacement public production server.
- `bun run test`: Vitest suite.
- `bun run lint`: whole-project ESLint; legacy lint debt is documented separately and not suppressed.
- Production start: **managed by Lovable**, invoking the built server fetch entry. No Node `start` command, S3 static website command, custom Worker resource or paid hosting provisioning is required.

The Lovable editing environment automatically runs its typecheck/production-build checks; do not launch duplicate manual builds there. Check `lovable build status --json` and the newest automatic build result. Publish the finished snapshot through Lovable and verify the served website rather than equating a scheduling response with completion.

## Environment names only

Keep existing Cloud-managed `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and corresponding `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` connection settings. Managed server values may not appear in the custom-secret list. Never edit generated clients or manually duplicate those settings.

Existing private server configuration: `FLUX_API_BASE`, `FLUX_INTEGRATION_TOKEN`, `GOOGLE_API_KEY`, `ADMIN_ACCESS_CODE`, and platform-managed service variables. Both Flux names are confirmed configured. Read private values only inside server handlers; never emit them, HTTP authorization headers or raw credential-bearing exceptions. Updating private secrets requires publishing before expecting the public website to use them.

## Assets and health

Vite bundles imported `src/assets` resources; static browser/proxy/WASM resources in `public` deploy alongside the app. Existing wallpaper CDN pointers and media URLs remain unchanged. Do not copy only HTML or omit proxy service workers/WASM assets.

`GET /api/public/health` is an unauthenticated, noncached liveness response: HTTP 200 with `{ "status": "ok", "app": "Birch OS", "runtime": "full-stack" }`. It contains no secrets, user information or provider configuration and makes no external requests. A successful health response proves the server route runs, **not** that authentication or Flux works.

Deployment acceptance additionally requires opening the website, selecting a layout and confirming the real account in the same document, opening Storage, requesting its authenticated list and performing a tiny upload/confirmation/list/download/share check. Guest or liveness-only checks do not establish Storage readiness. Keep S3 CORS restricted to the already configured exact origins.