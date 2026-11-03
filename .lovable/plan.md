# Fluxlinkk Storage

- Preserve Birch's existing AuthProvider, authenticated route gate, bearer middleware and database policies; no database migration or AWS changes.
- Add a shared Storage view to the Windows app registry, Birch Store, desktop dock and navigation, plus an authenticated `/storage` page that uses the existing console frame.
- Authenticate every operation with Birch's verified session. Server functions derive the Flux user identifier from the session, validate relative keys and upload metadata, and return only file metadata and short-lived URLs.
- Upload bytes directly to the signed storage URL, then confirm through Birch. Include file/folder browsing, open/download, share/copy, refresh and recoverable errors.
- Test session enforcement, identity overrides, traversal, upload limits, provider errors and request flows; document setup and verify a small real upload if account access permits.

## Technical details
Both `FLUX_API_BASE` and `FLUX_INTEGRATION_TOKEN` are configured. Use `src/lib/storage/` for validated schemas, server-only transport and authenticated server functions; reuse `src/components/windows/views/StorageView.tsx` across shells. The harness runs typechecks and builds automatically; run tests and lint explicitly, inspect those results, and report any unverified production check.