/* Repo path: src/data/game.js
 *
 * Feed Junnie! — the minesweeper by the fountain. The levels and the rules for what
 * name may go on the public leaderboard. Pure data and pure functions: no DOM, and
 * nothing imported from engine/ (the hard rule in CLAUDE.md).
 *
 * The words a player reads are in content.js (`gameCopy`) like every other piece
 * of copy on the site.
 */

/* The three classic minesweeper levels, at the classic sizes. `minMs` is the fastest
 * time the leaderboard will accept — well under the human world records (about 0.5s,
 * 6s and 25s), so it only ever stops a time that was typed in rather than played.
 * ⚠️ The same three numbers are in supabase/leaderboard.sql. Change both. */
export const levels = [
  { id: 'easy',         rows: 9,  cols: 9,  fish: 10, minMs: 1000 },
  { id: 'intermediate', rows: 16, cols: 16, fish: 40, minMs: 5000 },
  { id: 'expert',       rows: 16, cols: 30, fish: 99, minMs: 20000 },
];

export function levelById(id) {
  return levels.find((level) => level.id === id) || null;
}

/* How many rows each board shows. Ten, asked for directly. */
export const leaderboardSize = 10;

/* --- names on the public leaderboard ----------------------------------------
 *
 * Asked for directly: fake names, anonymous players and game handles are all fine;
 * anything rude, explicit or otherwise inappropriate is not. Every visitor sees this
 * board, and so does every recruiter.
 *
 * ⚠️ This list is checked TWICE: here, so the player is told straight away, and again
 * in the database (supabase/leaderboard.sql, `name_is_clean`), so a name sent
 * straight to the database without this page cannot get past it either. The two
 * lists must match. If you add a word, add it in both places.
 *
 * No word filter is complete. Anything that slips through can be deleted by hand from
 * the Supabase dashboard — see supabase/README.md. */

export const nameMaxLength = 16;

/* Letters, numbers, spaces and _ . - only. That keeps out lookalike characters and
 * emoji, which are the usual way round a word filter. */
const allowedChars = /^[A-Za-z0-9 _.-]+$/;

/* Matched ANYWHERE inside the name, with the spaces and punctuation taken out — so
 * "f u c k" and "fuck_123" are both caught. Only words that are never innocently
 * part of a longer word belong here. */
export const blockedAnywhere = [
  'fuck', 'fuk', 'fck', 'shit', 'cunt', 'bitch', 'biatch', 'nigg', 'nigga', 'faggot',
  'whore', 'slut', 'porn', 'rapist', 'pussy', 'penis', 'vagina', 'boob', 'titty',
  'titties', 'jizz', 'wank', 'twat', 'bastard', 'asshole', 'dildo', 'horny', 'nazi',
  'hitler', 'retard', 'tranny', 'kike', 'wetback', 'butthole', 'milf', 'hentai', 'xxx',
  'killyourself', 'suicide', 'molest', 'pedophile', 'piss', 'bollock', 'blowjob',
  'handjob', 'orgasm', 'semen', 'testicle', 'erection', 'chink', 'beaner',
];

/* Matched only as a WHOLE WORD, because each is also part of innocent longer words:
 * "ass" in "class", "rape" in "grape", "cock" in "peacock", "dick" in "Dickens". */
export const blockedWords = [
  'ass', 'arse', 'rape', 'cock', 'dick', 'dicks', 'fag', 'fags', 'tit', 'tits', 'cum',
  'sex', 'sexy', 'anal', 'nude', 'naked', 'hoe', 'hoes', 'thot', 'prick', 'pedo',
  'kkk', 'kys', 'coon', 'gook', 'spic', 'dyke', 'homo', 'nsfw', 'damn', 'boobs',
];

/* Undoes the common disguises before matching: 4 for a, 3 for e, $ for s, and so on,
 * and collapses a run of one letter ("fuuuuck") to one. */
function normalise(text) {
  const swaps = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', '@': 'a', $: 's' };
  return text
    .toLowerCase()
    .split('')
    .map((ch) => swaps[ch] ?? ch)
    .join('');
}

function hasBlockedWord(name) {
  const plain = normalise(name);
  const squashed = plain.replace(/[^a-z]/g, '');
  const collapsed = squashed.replace(/(.)\1+/g, '$1');
  for (const word of blockedAnywhere) {
    if (squashed.includes(word) || collapsed.includes(word)) return true;
  }
  const words = plain.split(/[^a-z]+/).filter(Boolean);
  for (const word of words) {
    const single = word.replace(/(.)\1+/g, '$1');
    if (blockedWords.includes(word) || blockedWords.includes(single)) return true;
  }
  return false;
}

/* Checks a name typed after a win. Returns { ok: true, name } with the name tidied
 * up, or { ok: false, reason } where reason is a key into gameCopy.nameErrors.
 *
 * A blank name is fine and is saved as `anonymousName` — asked for directly,
 * anonymous players are welcome. */
export function checkName(raw, anonymousName) {
  const name = String(raw || '').trim().replace(/\s+/g, ' ');
  if (!name) return { ok: true, name: anonymousName };
  if (name.length > nameMaxLength) return { ok: false, reason: 'tooLong' };
  if (!allowedChars.test(name)) return { ok: false, reason: 'characters' };
  if (hasBlockedWord(name)) return { ok: false, reason: 'inappropriate' };
  return { ok: true, name };
}

/* 12345 ms -> "12.3". One decimal: whole seconds make a ten-way tie at the top of
 * Easy, and hundredths are noise from the browser's timer. */
export function formatTime(ms) {
  return (Math.floor(ms / 100) / 10).toFixed(1);
}
