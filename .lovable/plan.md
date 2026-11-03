# Birch OS production finalization

Preserve all current apps, authentication, account-owned preferences, layouts and routes.

1. Audit route navigation, page metadata, browser/server boundaries and configuration using the existing TanStack structure.
2. Repair blocking runtime issues and movie test regressions; run the full tests and lint without suppressing failures.
3. Finish Storage against the existing Flux contract, verify identity isolation and diagnose S3 preflight for the exact production/preview origins. No available AWS connection means CORS-only console instructions may remain external.
4. Check signed-in Windows and console navigation plus mobile layout. Inspect platform-managed typecheck/production build evidence rather than launching duplicate builds.
5. Update setup documentation and roadmap, review security, and request publication of the latest working snapshot. Report deployment status honestly and leave Storage unverified if browser PUT still requires external CORS changes.