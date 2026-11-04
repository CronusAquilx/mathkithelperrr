# Switch Birch OS (same project, same URL) to external Supabase birch-os

Read-only so far. Nothing has been changed or published.

## Current state (verified)
- This project still runs on its Lovable-managed backend (ref fwgmgkczglnotreqjevo). The app's settings and the tools I use both point to it. birch-os (vxxnbyfbgobqdcyfmgoz) is not connected yet.
- **In-place switch:** Lovable's docs say the built-in backend can be disconnected from this project and an external Supabase project connected instead, under More → Supabase. That means the switch can happen inside this project. I was wrong earlier when I said it couldn't. Lovable does not copy any data. Disconnecting keeps the old data; only clicking "Remove Database" afterward deletes it permanently.
- **Sign-in:** Supabase Auth with email/password. Usernames are turned into internal emails (`<username>@username.beanblock.local`). Accounts are created on the server with `admin.createUser` and limited by `allow_account_attempt`. Google sign-in goes through Lovable's sign-in service. The developer PIN uses the `ADMIN_ACCESS_CODE` secret plus `user_roles`.
- **Data, by row count:** profiles 2, user_roles 3, user_preferences 2, watch_history 212, game_saves 4, threads 1, messages 2, usage_events 1, social_players 2, social_posts 1, social_blocks 1, models 3, reasoning_levels 5, tools 6, account_attempts 3. The other tables are empty.
- **Database code:** the `app_role` type, nine functions that run with elevated rights (has_role, handle_new_user, allow_account_attempt, social_*), and the `on_auth_user_created` trigger. Every table has owner or admin access rules. Table links: messages→threads, social_members/social_posts→social_parties, social_reports→social_posts.
- **File storage:** the private `astra-images` and `backgrounds` buckets, with owner-only access rules.
- **Flux:** files are stored under each Birch user ID. They stay linked to the right accounts as long as user IDs are kept, and nothing changes in Flux.

## Steps you must do or approve (I can't do these)
1. **Disconnect and connect:** a workspace admin disconnects the Lovable backend and connects birch-os under More → Supabase, in this project. I have no tool for this step.
2. **Copy accounts:** this needs owner-level database access on both sides. The read-only role I have can't read the `auth` schema or file storage. To keep user IDs and passwords, someone with owner access must copy `auth.users` and `auth.identities` as they are, including the password hashes. Supabase passwords are bcrypt hashes and keep working in another project. Sign-in sessions don't carry over, so everyone signs in again once.
3. **Re-enter secrets in birch-os:** `ADMIN_ACCESS_CODE`, `GOOGLE_API_KEY`, `FLUX_API_BASE`, `FLUX_INTEGRATION_TOKEN`, and `LOVABLE_API_KEY` (only if AI chat stays on the Lovable gateway). After the switch, I'll re-check which ones exist, by name only.
4. **birch-os sign-in settings:** turn on email sign-in, set the site and redirect URLs (published, preview, beatbirch-melody-grove), and set up Google with your own Google sign-in credentials. Lovable's managed Google sign-in may not work with an external project.
5. **Never click "Remove Database"** on the old backend until everything is verified.

## Staged plan
**Stage 0 – Backup (before anything changes)**
- Export the database (More → Database → Manage → Settings → Export data).
- Owner-level dump of the `auth` and `public` schemas, plus a copy of the files in both buckets.
- Record row counts per table as a reference.

**Stage 1 – Prepare birch-os (old backend stays live)**
- Confirm birch-os is empty, so nothing conflicts.
- Apply the Birch schema from `drizzle/migrations`: tables, permissions, access rules, functions, trigger, and the `app_role` type. Create the two private buckets and their access rules.
- Compare tables, functions, triggers, rules and buckets against the current backend.

**Stage 2 – Rehearse the copy**
- Owner-level import into birch-os: `auth.users` and `auth.identities` first, with IDs and password hashes kept. Then the public tables, parent tables before the ones that point to them. Turn off `on_auth_user_created` during the import so profiles and roles aren't created twice, then turn it back on.
- Copy the files in both buckets, keeping the same paths.
- Check that row counts match the Stage 0 numbers.

**Stage 3 – Switch connection (needs your action, step 1)**
- After the switch, Lovable regenerates the backend settings and client files. I check that the app's settings, server functions (`requireSupabaseAuth`, the admin client, `accounts.functions.ts`, `dev-access.functions.ts`, `api/chat.ts`, Storage functions) and generated types all point to birch-os.
- Code changes are expected to be small. I'll only fix what breaks, such as Google sign-in if Lovable's sign-in service is unavailable.

**Stage 4 – Test on preview before publishing**
- Username sign-in with an existing account: same user ID, same data.
- Create a new username account (checks the trigger and roles). Developer PIN. Google sign-in.
- Check one user can't see another user's data (watch history, saves, preferences, social).
- Flux Storage list still shows existing files.
- Focused tests, plus a check that the build passes.

**Stage 5 – Go live**
- Brief pause on writes, a final copy of anything that changed, then you approve publishing to https://mathkithelperrr.lovable.app.

**Rollback**
- Until "Remove Database" is clicked, the old backend stays intact. Reconnecting it and publishing the previous version restores everything. Keep it for a set period before removing it.

## Open questions
- Is birch-os empty right now?
- Who will run the owner-level account and file copy? This step decides whether user IDs and passwords can be kept.
- Should Google sign-in keep working, and do you have Google sign-in credentials ready?
