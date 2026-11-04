# Existing Birch OS — external Supabase connection

## Verified on 2026-11-04

- Lovable's supported environment refresh confirms the existing project's user-connected backend is `birch-os`, ref `vxxnbyfbgobqdcyfmgoz`; no managed backend was provisioned.
- Browser Vite URL/project ID and refreshed server URL target that external backend. The stale CLI project ID was repaired in `supabase/config.toml`; `.env` was refreshed by the binding tool, not edited manually.
- Existing 24 public tables have authenticated/service-role read grants. Existing owner-scoped RLS protects profiles, preferences, playlists, saves, history and other personal data. Both private upload buckets retain owner-folder policies. No schema, rows, bucket settings, AWS policies or secrets were modified.
- The Google button now calls external Supabase Auth directly and returns to public `/auth`; the unsupported managed Lovable sign-in button was removed. Browser interception confirmed the authorize request targets birch-os.
- Hosted Auth settings return 200: email enabled, Google disabled. No provider configuration was changed.
- The literal `installedApps` identifier is absent from current source. Installed/wishlist cache loading now tolerates null, invalid lists and non-string entries without crashing.
- Actual Music search, Movies trending and health requests return JSON HTTP 200 in preview and on the existing published site. The reported API 404s were not reproduced; no unnecessary endpoint rename was made. Other existing AI/voice API POST paths return expected 401 when signed out, not 404.
- 71 focused tests pass; automatic compilation reports build OK. Narrow app-library lint reports pre-existing formatting debt; no broad lint cleanup was attempted.

## Remaining external configuration and verification

Google requires enabling its provider in birch-os Authentication → Providers with a Google Web OAuth client. Its Google callback is `https://vxxnbyfbgobqdcyfmgoz.supabase.co/auth/v1/callback`. In Supabase Authentication → URL Configuration, allow these exact application return URLs:

- `https://mathkithelperrr.lovable.app/auth`
- `https://id-preview--65f9d704-e521-4207-b878-dc53b4f8ad7e.lovable.app/auth`

Do not paste the Google OAuth client secret into chat; configure it directly in Supabase. `GOOGLE_API_KEY` is for YouTube lookups, not Google sign-in.

All existing Flux, Google/AI and admin secret names are present. Flux's unauthenticated objects endpoint returns direct JSON 401, with no redirect. Existing transport already canonicalizes only its known HTTPS origin, refuses redirects, derives externalUserId from a verified account and supports all five contracted operations. File bytes go directly to signed S3 URLs; integration credentials stay on the server.

This external backend has no injected/mintable managed browser session (`external_unmanaged`). Authenticated listing, saved-preference readback, private uploads and actual upload/download/share completion were therefore not verified against the new backend. Do not substitute the old account UUID or a fabricated identity for that verification.

To generate a real Flux share URL: sign in to Birch, open Storage, upload a file or select an existing file, then choose Share and copy the returned link. Upload performs signed PUT, confirmation and list refresh; Share calls `/api/public/integrations/share-link` for that verified user's key. Relative share paths resolve under `https://fluxlinkk.lovable.app`; the actual slug cannot be known until Flux creates it. S3 download URLs expire and are not permanent public storage URLs.

Publish these code/config changes in the same existing Lovable project to update `https://mathkithelperrr.lovable.app`; no clone or new public URL is needed. Current published media/health checks do not prove this turn's OAuth/config edits are deployed.