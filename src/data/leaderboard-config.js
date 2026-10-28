/* Repo path: src/data/leaderboard-config.js
 *
 * Where the Feed Junnie! leaderboard is stored: a free Supabase project. Fill in the
 * two values from the Supabase dashboard -> Project Settings -> API. Setup steps are
 * in supabase/README.md.
 *
 * Until both are filled in, the game still plays and the leaderboard says it is not
 * connected yet.
 *
 * ⚠️ The anon key is MEANT to be public — it ships to every visitor's browser on any
 * Supabase site. What it is allowed to do is decided by the row-level security rules
 * in supabase/leaderboard.sql: read scores, and add a score that passes the checks.
 * It cannot change or delete anything. NEVER put the `service_role` key here; that
 * one can do anything and the repo is public.
 */
export const leaderboardConfig = {
  url: 'https://njrhujxuydvsegirzkom.supabase.co',
  anonKey: 'sb_publishable_4GUb98Lt-SdlA3ydf3-rAA_CkoYSDrO',
};
