# Birch OS → birchwind migration assessment (read-only)

Nothing was changed. The counts below are row estimates for the current managed backend. No secrets or password hashes were read.

## 1. How sign-in works now
- **Username accounts:** this is the main way people sign in. The server turns each username into a made-up internal email (`<username>@username.beanblock.local`). New accounts are created on the server with `auth.admin.createUser` (email already confirmed). Sign-in uses `signInWithPassword`, with a limit on failed attempts (`allow_account_attempt`). These are normal Supabase Auth email/password accounts, not a custom login system.
- **Google sign-in:** handled by the Lovable sign-in service (`lovable.auth.signInWithOAuth`) in `AuthPage.tsx`.
- **Developer PIN:** checked only on the server using the `ADMIN_ACCESS_CODE` secret. Admin rights come from `user_roles`.
- **Guest mode:** a flag in the browser tab only. Guests have no account, so there is nothing to move.

## 2. Can passwords be kept?
- Supabase stores passwords as bcrypt hashes in `auth.users.encrypted_password`. Bcrypt doesn't depend on the project, so a hash copied as-is into birchwind will still work. User IDs can be kept too, because the `id` value can be copied over directly.
- **No migration tooling exists in this repo.** There is no export script, and the read-only database role here can't read the `auth` schema at all. Copying users needs a privileged dump of `auth.users` and `auth.identities` that keeps the exact `id` and `encrypted_password` (and `raw_user_meta_data`). Only someone with owner access to both databases can do that. Existing sign-in sessions and refresh tokens will **not** carry over, so everyone signs in again once.
- **Google accounts:** their identity rows can be copied, but birchwind must have Google sign-in enabled. Lovable's sign-in service may not work with an external project, so Google sign-in needs its own check after the move.

## 3. What has to move
Total accounts is about 2 (2 profiles, 3 role rows).

- **Core tables (rows):** profiles (2), user_roles (3), user_preferences (2), watch_history (212), watchlist (0), playlists (0), game_saves (4), threads (1), messages (2) (each message belongs to a thread), memories (0), usage_events (1).
- **Settings and catalog tables:** models (3), reasoning_levels (5), tools (6), provider_keys (0, holds secret API keys), developer_games (0).
- **Social tables:** social_players (2), social_friends (0), social_parties (0), social_members (0) (belongs to a party), social_posts (1) (may belong to a party), social_reports (0) (belongs to a post), social_blocks (1).
- **Internal table:** account_attempts (3). Only the server uses it, so it doesn't need copying.
- **Links between tables:** messages→threads, social_members→social_parties, social_posts→social_parties, social_reports→social_posts. profiles and user_roles link to `auth.users` with cascade delete. Every other table stores user IDs as plain values with no link.
- **Custom types and functions:** the `app_role` type (admin, user) and these functions: has_role, handle_new_user, allow_account_attempt, social_action, social_blocked, social_directory, social_member, social_party_owner, social_party_visible (all run with elevated rights).
- **Trigger:** `on_auth_user_created` on `auth.users` runs `handle_new_user`, which creates the profile and role rows for each new account.
- **Access rules (RLS):** every table limits rows to their owner (`auth.uid()`), or to admins via `has_role`. The social tables can only be read from the app; all social changes go through `social_action`. Table permissions must be granted explicitly to `authenticated` and `service_role`.
- **File storage:** the `astra-images` and `backgrounds` buckets, both private, with owner-only access rules on `storage.objects`. The files themselves must be copied separately. I couldn't count them because the read-only role has no access.
- **Schema source:** the database setup files live in `drizzle/migrations`. They can be replayed against birchwind, but first check that birchwind doesn't already have conflicting tables.

## 4. Settings and secrets that would change
- **Browser:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (and `_ANON_KEY`), `VITE_SUPABASE_PROJECT_ID`.
- **Server:** `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PROJECT_ID`, `SUPABASE_DB_URL`.
- **These carry over unchanged but must be copied:** `ADMIN_ACCESS_CODE`, `GOOGLE_API_KEY`, `LOVABLE_API_KEY`, `FLUX_API_BASE`, `FLUX_INTEGRATION_TOKEN`, `LOVABLE_CRON_SECRET`.
- **birchwind settings:** turn on email sign-in, set site and redirect URLs to the Birch origins (published, preview, beatbirch-melody-grove), set up Google sign-in, and match the email-confirmation settings.
- **Blocker:** this project is permanently tied to Lovable Cloud. Lovable keeps the generated client files and `.env` in sync with the managed backend, so pointing them at birchwind means changing the whole project's connection, not just the code. That needs a Lovable support or workspace-level change, or a new Birch project connected to birchwind from the start.
- **Flux storage:** files are stored under each user's ID. If user IDs stay the same, existing Flux files remain linked to the right accounts.

## 5. Step-by-step plan
1. **Freeze the plan:** decide the target, either a new Birch project connected to birchwind, or a Lovable-supported change of this project's connection. The current backend stays live throughout.
2. **Set up the schema:** apply the `drizzle/migrations` setup to birchwind, then compare tables, functions, triggers, access rules, permissions and buckets against the current backend.
3. **Dry-run copy:** with owner access, export `auth.users` and `auth.identities` (keeping IDs and password hashes), then the public tables in link order: parent tables first (threads, social_parties, social_posts), then the tables that point to them. Copy profiles and roles directly rather than relying on the new-account trigger, or turn it off during the import (`ON CONFLICT DO NOTHING` already protects it). Copy the files in both buckets.
4. **Check the copy:** row counts match for each table, and spot-check IDs. Test sign-in with a username account and a Google account on a preview build pointed at birchwind. Confirm one user can't see another user's rows, the admin PIN works, and a Flux Storage list still shows existing files.
5. **Switch over:** briefly pause new sign-ups and writes, do a final copy of anything that changed, swap the settings in section 4, then publish. Everyone signs in again once.
6. **Keep a way back:** leave the old backend untouched and read-only for a set period. Rolling back means restoring the old settings and publishing again.

## Open questions
- Is birchwind empty, or does it already have Birch tables or users?
- Who has owner access to export from both databases?
- Should Google sign-in keep working after the move?
