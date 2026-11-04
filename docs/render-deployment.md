# Render deployment — separate branch, unchanged Lovable fallback

Repository: CronusAquilx/mathkithelperrr. Branch: **render-deploy**.
Base main commit: `d8ed8ad6c0d26f3225b27074877bb54cb3d48789`.
Do not merge into main or republish Lovable for this deployment. Existing Lovable
production remains at https://mathkithelperrr.lovable.app, using the unchanged
`vite.config.ts`, `src/server.ts`, `src/start.ts`, Supabase and Flux implementation.

## Real Node service

Create a Render **Web Service**, native Node runtime, using this branch or its
`render.yaml` blueprint. No Dockerfile, static export, Vite preview or Cloudflare
WebSocketPair polyfill is used. Disable automatic deployment until configured.

- Install/build: `bun install --frozen-lockfile && bun run build:render`.
- Start: `bun run start:render` (executes `node deployment/start.mjs`).
- Node: 22.16.0; Bun: 1.4.4 (the verification version).
- Listener: `0.0.0.0`, Render-supplied `PORT` (default 10000 locally).
- Health: `/api/public/health`, HTTP 200; credential-free liveness, not Flux readiness.
- Output: `.output/server`, `.output/public`, and `.render/runtime.mjs` must remain
  together with `deployment/start.mjs` and `deployment/adapter.mjs`.
- Keep build dependencies available during build. The existing `bun.lock` is the
  only lockfile; no npm lockfile or dependency changes are required.

`vite.render.config.ts` selects Nitro's real **node-middleware** target.
Nitro handles assets, SSR, API routes and server functions via the original
TanStack entry, including existing error handling, CSRF and bearer middleware.
The Node HTTP server intercepts actual upgrade events for `/api/live` and
`/api/proxy-ws`, before they can reach Worker-only code. Ordinary HTTP requests
to these two paths return 426 rather than attempting a fake status-101 Response.

Live voice uses the existing `bindLiveConnection`, `getLiveConfig` and
`validateLiveUpgrade`, with real `ws` sockets and an actual bounded task tracker.
Both upgrade paths verify the configured same-origin browser Origin and validate
the Supabase token through the existing `authenticateRequest`. The public HTTPS
origin comes from configuration, not client-supplied forwarded headers, so TLS
termination does not disable origin checks. Proxy text, binary data, selected
upstream protocol and close events are bridged. Upstreams cannot redirect;
private/literal/metadata addresses and nonstandard ports are rejected, and DNS
answers are verified again at actual connection time to prevent rebinding.
SIGTERM/SIGINT closes sockets and drains tracked tasks for up to 10 seconds.
The tracker catches rejections with fixed diagnostics; URLs/tokens are not logged.

## Environment names only

Configure values privately in Render; do not commit an environment file, export
credentials into the browser, copy platform tokens into logs, or rotate anything.
No values are included here.

Required service configuration:
- `BIRCH_PUBLIC_ORIGIN`: exact HTTPS Render public origin, no path/query/credentials.
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`: existing external birch-os connection.
- `SUPABASE_SERVICE_ROLE_KEY`: existing server-only privileged account operations.
- `FLUX_API_BASE`, `FLUX_INTEGRATION_TOKEN`: same existing Flux service credentials.
- `GOOGLE_API_KEY`: existing music search configuration.
- `ADMIN_ACCESS_CODE`: existing hidden developer sign-in configuration.
- `NODE_ENV`, `NODE_VERSION`, `BUN_VERSION`: blueprint sets these; `PORT` is Render-managed.

Feature-dependent existing variables:
- `LOVABLE_API_KEY`: hosted AI, voice and connector-backed features require authorized
  gateway access outside Lovable. Do not fabricate it or expose it; access from
  Render must be separately verified by the operator. Without it live configuration
  fails closed instead of exposing an unauthenticated or pretend voice endpoint.
- `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`: existing optional configured AI provider.
- `UDC_QAISIFY_YOUTUBE_API_KEY`: optional existing YouTube connector fallback.
- `SAAVN_API`, `PIPED_INSTANCES`: optional existing music fallback configuration.
- `LOVABLE_CRON_SECRET`, `LOVABLE_CRON_SECRET_PREVIOUS`: only if using existing cron APIs.
- `VITE_TMDB_API_KEY`: existing optional client-visible movie setting; never a private token.
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_ANON_KEY`,
  `VITE_SUPABASE_PROJECT_ID`: not used to override the current generated browser
  client, which already binds to birch-os. Keep server configuration pointed at that
  same project. No generated client or account identity has been changed.
- `LOVABLE_DB_MIGRATION_URL`: migration tooling only, **not required on Render**.

## Verification completed locally, not a deployed Render claim

Separate Node build passed. The built server returned 200 for `/`, `/auth` and
`/api/public/health`; both upgrade-only paths returned 426 for HTTP.
Six adapter tests passed: cross-origin rejection before auth, invalid session
rejection, live socket/shared relay invocation, real proxy protocol/text/binary
forwarding, private target rejection and background-task draining.
Existing suite: 42 files, 234 tests passed (including 51 Storage/auth tests).
Typecheck with `tsgo -p tsconfig.render.json` passed; new TypeScript ESLint passed.
Whole-source lint retains **5144 inherited errors / 41 warnings**, predominantly
formatting and explicit-any debt; unrelated app files were not reformatted.
Provider calls and actual external-project authenticated transfers were not tested;
fixture authentication in adapter tests is not a real Supabase session.

## Remaining operational limitations and cutover gates

No Render service was created or deployed. Do not treat this as a ready production
cutover until a real signed-in Render account and provider connections are checked.
The published Lovable fallback remains untouched.

The new Render browser origin is not in the existing S3 CORS allowlist. Consequently,
browser direct signed PUT/GET may be blocked on Render even though server-side Flux
calls and share generation retain their existing contract. **No bucket, CORS, IAM,
policy, token, Supabase auth settings or storage behavior was changed here.** If
uploads are required on Render, the owner must separately approve the exact new
origin under the existing bucket's CORS policy; no wildcard/public access is needed.
Likewise Google OAuth may require allowing Render's `/auth` return URL in Supabase;
no auth settings were modified. Lovable hosted AI gateway authorization from Render
is unverified and may require a supported external-hosting credential arrangement.

Query-token WebSocket authentication is retained for client compatibility; disable
URL/access logging that records query strings in any external observability layer.
Render restarts end active sockets; the bounded drain is not durable job storage.
Proxy targeting is intentionally limited to public HTTP-equivalent ports 80/443.

Before any user traffic: configure environment privately, deploy this branch only,
check health/SSR/assets, sign into a real existing birch-os account, check protected
API and CSRF behavior, exercise voice/proxy with approved providers, then check
Flux list/share and (only after required origin approval) one harmless transfer.
Rollback: route users back to the unchanged Lovable URL or roll Render back to a
previous known-good commit; no account/data migration or reverse migration needed.
