# Birch Storage / Fluxlinkk

Required server secrets (Project Settings → Secrets):
- `FLUX_API_BASE`: the existing Flux site’s HTTPS origin, without a path, query, or credentials.
- `FLUX_INTEGRATION_TOKEN`: the token issued by Flux for this integration.

Neither is a VITE variable. Values are never returned or logged. Missing configuration returns only missing variable names. Existing Birch authentication environment and bearer middleware remain unchanged. Publish Birch after changing secrets to apply them to the published site.

Birch re-verifies the authenticated user with Auth and passes that ID to Flux. All metadata operations run in server functions; strict input schemas reject identity, prefix and bucket overrides. Flux owns the bucket and `birchos/<user-id>/` isolation. No Birch database or AWS policy migration is required.

Uploads accept 1–524288000 bytes (500 MiB), a relative key with segments up to 255 characters, and a syntactically valid MIME type (unknown files use `application/octet-stream`). Traversal, encoded paths, absolute paths and control characters are rejected. Signed URLs are HTTPS and expire within 600 seconds. Bytes are PUT directly from the browser with the exact signed Content-Type, without Birch's token or auth headers. Flux's existing S3 CORS must permit PUT and Content-Type from the Birch origin; if it does not, report that configuration issue rather than changing AWS here.

After PUT succeeds, Birch confirms the upload and refreshes files. Failed transfers are never confirmed. A failed confirmation remains retryable in the current app view; no destructive cleanup endpoint is assumed. Existing visible names are not overwritten by the UI; unconfirmed uploads can be retried with the same name. No delete/rename/folder-create API is invented. Folders are virtual relative prefixes and can be selected via the path field before uploading.

List responses accept arrays or `objects`, `files`, `items` arrays, mapping key/size/lastModified/contentType (including S3 Key/Size/LastModified). Only projected metadata and signed/share URLs leave the server. Provider errors are mapped to safe messages, not echoed. Share requests use Flux’s default kind/expiration; download behavior follows Flux’s signed response Content-Disposition.

Verification: run the storage tests and ESLint. The platform automatically performs typecheck/build; manual builds are intentionally not run. Real verification needs a verified Birch session, successful configured list, a tiny PUT/confirmation, list readback, downloaded byte comparison and a working share URL. Do not count mocked tests as real uploads. No automatic retries of 401/403/429 are performed.