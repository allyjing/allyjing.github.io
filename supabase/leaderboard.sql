-- Repo path: supabase/leaderboard.sql
--
-- The Feed Junnie! leaderboard. Paste the whole file into the Supabase dashboard ->
-- SQL Editor -> New query, and Run. Safe to run again: it drops and recreates the
-- checks, never the scores.
--
-- What a visitor's browser (the public "anon" key) is allowed to do:
--   * READ every score.
--   * ADD a score, and only one that passes every check below.
-- It cannot change or delete anything. Deleting a bad row is done by hand in the
-- dashboard -> Table Editor -> scores.

create table if not exists public.scores (
  id          bigint generated always as identity primary key,
  difficulty  text        not null,
  name        text        not null,
  time_ms     integer     not null,
  created_at  timestamptz not null default now()
);

-- ---- Is this name allowed on a board every recruiter can see? -------------------
--
-- ⚠️ The same two word lists are in src/data/game.js, which checks first so the
-- player is told straight away. This copy is what stops a name sent straight to the
-- database. Keep the two lists the same.
create or replace function public.name_is_clean(raw text)
returns boolean
language plpgsql
immutable
as $$
declare
  plain     text;
  squashed  text;
  collapsed text;
  word      text;
  anywhere  text[] := array[
    'fuck','fuk','fck','shit','cunt','bitch','biatch','nigg','nigga','faggot',
    'whore','slut','porn','rapist','pussy','penis','vagina','boob','titty',
    'titties','jizz','wank','twat','bastard','asshole','dildo','horny','nazi',
    'hitler','retard','tranny','kike','wetback','butthole','milf','hentai','xxx',
    'killyourself','suicide','molest','pedophile','piss','bollock','blowjob',
    'handjob','orgasm','semen','testicle','erection','chink','beaner'];
  whole     text[] := array[
    'ass','arse','rape','cock','dick','dicks','fag','fags','tit','tits','cum',
    'sex','sexy','anal','nude','naked','hoe','hoes','thot','prick','pedo',
    'kkk','kys','coon','gook','spic','dyke','homo','nsfw','damn','boobs'];
  bad       text;
begin
  -- Undo the usual disguises: 4 for a, 3 for e, $ for s, and so on.
  plain := translate(lower(raw), '0134578@$', 'oieastbas');
  squashed := regexp_replace(plain, '[^a-z]', '', 'g');
  collapsed := regexp_replace(squashed, '(.)\1+', '\1', 'g');

  foreach bad in array anywhere loop
    if position(bad in squashed) > 0 or position(bad in collapsed) > 0 then
      return false;
    end if;
  end loop;

  foreach word in array regexp_split_to_array(plain, '[^a-z]+') loop
    if word = any(whole) or regexp_replace(word, '(.)\1+', '\1', 'g') = any(whole) then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

-- ---- The checks every row must pass -------------------------------------------
alter table public.scores drop constraint if exists scores_difficulty_ok;
alter table public.scores drop constraint if exists scores_name_ok;
alter table public.scores drop constraint if exists scores_time_ok;

alter table public.scores add constraint scores_difficulty_ok
  check (difficulty in ('easy', 'intermediate', 'expert'));

alter table public.scores add constraint scores_name_ok
  check (char_length(name) between 1 and 16
         and name ~ '^[A-Za-z0-9 _.-]+$'
         and public.name_is_clean(name));

-- Faster than these is a time that was typed in, not played. Under an hour, too.
-- ⚠️ Same three numbers as `minMs` in src/data/game.js.
alter table public.scores add constraint scores_time_ok
  check (time_ms < 3600000 and (
        (difficulty = 'easy'         and time_ms >= 1000)
     or (difficulty = 'intermediate' and time_ms >= 5000)
     or (difficulty = 'expert'       and time_ms >= 20000)));

create index if not exists scores_board on public.scores (difficulty, time_ms, created_at);

-- ---- Who may do what ------------------------------------------------------------
alter table public.scores enable row level security;

drop policy if exists "anyone can read scores" on public.scores;
drop policy if exists "anyone can add a score" on public.scores;

create policy "anyone can read scores" on public.scores
  for select to anon, authenticated using (true);

create policy "anyone can add a score" on public.scores
  for insert to anon, authenticated with check (true);

-- No update or delete policy, on purpose: with row-level security on, that means
-- nobody can change or remove a score except from the dashboard.
grant select, insert on public.scores to anon, authenticated;
