# The Feed Junnie! leaderboard

Scores are kept in a free Supabase project so every visitor sees the same board.
GitHub Pages can only serve files, so something has to hold the scores, and this is it.

## Setting it up (once)

1. Make a free account at <https://supabase.com> and create a **New project**. Any name
   works. Pick a region near you, and save the database password somewhere safe. The
   site never uses it.
2. When the project is ready, open **SQL Editor → New query**, paste in all of
   `supabase/leaderboard.sql`, and press **Run**. It should say *Success. No rows returned*.
3. Open **Project Settings → API** (on newer dashboards, **Project Settings → API Keys**
   and **Data API**). Copy two values:
   - the **Project URL**, like `https://abcdefghijkl.supabase.co`
   - the **anon** / **publishable** key
4. Paste them into `src/data/leaderboard-config.js`.

**Never** paste the `service_role` / `secret` key. That key can delete everything, and
this repo is public.

## Taking a name down

Open **Table Editor → scores**, tick the row, and delete it. Only the dashboard can
remove scores. Visitors can add scores but can't change or delete them.

## Changing the word list

The blocked words are in two places that must match:

- `src/data/game.js` (`blockedAnywhere`, `blockedWords`), so the player is told right away
- `supabase/leaderboard.sql` (`name_is_clean`), so the database refuses the name too

Edit both, then re-run the SQL file. Re-running it is safe and keeps existing scores.
