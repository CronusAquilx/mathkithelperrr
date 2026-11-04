# Birch OS finalization

## Current production architecture verification — 2026-11-04

The complete TanStack Start app is deployed on Lovable, not S3 static hosting. See [deployment architecture](deployment.md). Production browser verification reached the real account picker, confirmed the signed-in account, opened the Windows desktop and Storage, and received HTTP 200 from the newly deployed `/api/public/health` server route. This proves the new full-stack code is being served, not just an old HTML export.

**Remaining external blocker:** the deployed authenticated Storage list still fails reaching Flux. Both `FLUX_API_BASE` and `FLUX_INTEGRATION_TOKEN` names exist; no missing secret name was reported. Validate that the saved `FLUX_API_BASE` is Flux's final publicly reachable HTTPS origin and that Flux's integration endpoints accept server-to-server requests without redirects or a hosting access wall. Do not rotate/duplicate credentials, change CORS again, change AWS privacy/IAM, or create infrastructure. Safe connection diagnostics distinguish timeouts and redirects without logging raw exceptions. Public upload/confirm/download/share cannot be claimed verified until the deployed list succeeds; the earlier combined-preview transfer verification remains valid only within its documented boundary.

Latest tests: **42 files / 218 tests pass**; scoped health/Storage lint is clean; automatic builds report `build OK`. Whole-repository lint attempt timed out, then source/config lint completed with **5166 errors / 41 warnings**, mostly inherited formatting/explicit-any debt. These are not hidden or described as a clean entire-project lint result. The existing managed production build command remains `vite build`; no duplicate manual build/typecheck or incompatible Node start was added.

All existing apps, account creation/sign-in, Cloud data, layouts, personalization, wallpaper catalog and routes are retained. Storage remains integrated into the shared Windows app and console frame rather than a second shell.

## Storage: external CORS action

**Updated status, 2026-11-03:** the CORS action below has already been completed. AWS MCP read-only inspection confirms all three origins (including `https://beatbirch-melody-grove.lovable.app`); all three preflights now return 200. Real public-origin browser PUT, current-preview confirmation/list, share/copy and exact-byte download checks pass after the share-path repair. See the Storage README for the combined-origin test boundary. The deployed Birch server still fails reaching Flux, so deployed configuration/publication remains to verify; do not reapply CORS or change AWS settings. The following original diagnosis is retained as historical context, not an open action.

Verified with a real Birch session: Flux listing and upload URL requests succeed. Signed S3 OPTIONS requests for **both** the published and preview origins return **403**, with no allowing origin/method/header response. Browser PUT is blocked before confirmation. This is not a missing Birch secret: both Flux secret names are configured. No connected AWS role or connector is available in this workspace, and the Flux API contract does not expose bucket CORS administration.

In AWS Console:
1. Open **Amazon S3 → Buckets** and select the existing bucket bound to Flux's Birch integration (not Birch's Cloud wallpaper storage). Use the bucket already configured in Flux; do not create another bucket.
2. Open **Permissions → Cross-origin resource sharing (CORS) → Edit**.
3. Preserve any existing rules needed by Flux or other apps. Add the rule from [`storage-cors.json`](./storage-cors.json) to the existing JSON array, or paste the entire array if there are no rules.
4. Save only this CORS change. Leave **Block Public Access**, bucket policy, ACLs, IAM permissions/trust and credentials unchanged. Do not add OPTIONS to AllowedMethods; S3 answers preflight automatically.
5. Retry a tiny text-file upload in Birch, then verify confirmation, listing, download byte match and sharing. These flows are **not yet verified end-to-end**.

Exact allowed production origin: `https://mathkithelperrr.lovable.app`.
Exact allowed editor preview origin: `https://id-preview--65f9d704-e521-4207-b878-dc53b4f8ad7e.lovable.app`.
Local sandbox tests additionally need `http://localhost:8080` in AllowedOrigins if local browser upload verification is desired; do not add wildcard origins. If the editor actually uses another origin after an environment change, allow its exact origin only after inspecting it.

CORS grants browser access to already signed requests, not public bucket access. PUT sends only exact Content-Type and file bytes, never the Flux token. GET/HEAD support browser file inspection/download; ETag and Content-Disposition are safe exposed response headers. Signed URLs expire in 600 seconds.

## Environment and setup

Project Settings → Secrets must hold `FLUX_API_BASE` (Flux HTTPS origin) and `FLUX_INTEGRATION_TOKEN`, and existing `GOOGLE_API_KEY` for music. Never put their values in browser variables or committed environment files. Cloud-managed connection variables and bearer middleware remain untouched. Deploy after server secret changes to apply them to the public site.

## Verification boundaries

Full tests and lint are run locally. The platform performs typecheck/build automatically; this environment forbids launching duplicate manual typechecks or builds. `build OK` is the available build signal, not a separate claimed `tsc` run. Deployment status must be verified through the publishing tool and public-site fetch, not inferred from local tests.

Existing broad lint debt (formatting and explicit-any legacy code) remains visible; it is not suppressed or treated as a build failure. Movie test mocks and actual hook-order issues have been repaired. External media providers, subscriptions, controller/GPU performance and complete playback cannot be guaranteed by route rendering tests. Network proxy DNS screening rejects non-global addresses, but independent runtime DNS resolution means DNS rebinding protection is defense-in-depth rather than IP-pinned transport.

Final results: **41 test files / 210 tests pass**. Whole-project lint completed with **5197 errors and 41 warnings**, predominantly inherited formatting/explicit-any debt; new Storage/public-address/auth-recovery code has zero lint errors (three existing fast-refresh warnings in auth). Main Windows apps were actually opened after account confirmation, rather than counting the welcome desktop as app verification. PS5 home and phone Xbox render; phone Windows Storage/Music/Settings have no horizontal overflow. Platform builds report `build OK`.

The dependency advisory scan also reports existing vulnerabilities in Zod 3 and transitive source-map-js, js-yaml, sharp and Seroval. These are not represented as a clean security bill or silently ignored. Broad major-version framework/schema upgrades were not attempted as a shortcut to claiming production readiness; they need compatibility work. The fresh database security scan has only three informational findings for intentionally shared game/catalog/config tables; no critical database finding was reported. Publication schedules deployment; a successful publication response alone does not prove the new snapshot is already serving.