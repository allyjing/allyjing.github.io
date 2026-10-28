/* Repo path: src/engine/scores.js
 *
 * Reads and saves Feed Junnie! scores in Supabase, through its plain REST API with
 * fetch() — no Supabase library, because this site has no npm and no build step.
 *
 * The table, and the rules about what may be saved, are in supabase/leaderboard.sql.
 */

import { leaderboardConfig } from '../data/leaderboard-config.js';
import { leaderboardSize } from '../data/game.js';

/* False until both values in leaderboard-config.js are filled in. The game still
 * plays without it; the boards say they are not connected yet. */
export const scoresConnected = Boolean(leaderboardConfig.url && leaderboardConfig.anonKey);

function headers(extra = {}) {
  return {
    apikey: leaderboardConfig.anonKey,
    Authorization: `Bearer ${leaderboardConfig.anonKey}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

function endpoint(query = '') {
  return `${leaderboardConfig.url.replace(/\/$/, '')}/rest/v1/scores${query}`;
}

/* The fastest ten for one level, fastest first. A tie goes to whoever set it first. */
export async function topScores(difficulty) {
  if (!scoresConnected) throw new Error('not connected');
  const query = `?select=id,name,time_ms&difficulty=eq.${encodeURIComponent(difficulty)}`
    + `&order=time_ms.asc,created_at.asc&limit=${leaderboardSize}`;
  const response = await fetch(endpoint(query), { headers: headers() });
  if (!response.ok) throw new Error(`load failed: ${response.status}`);
  return response.json();
}

/* Saves one score and returns the saved row, so its id can be highlighted on the
 * board. Throws an Error whose `reason` is 'rejected' if the database refused it —
 * a name its filter caught, or an impossible time — and 'network' otherwise. */
export async function submitScore({ difficulty, name, timeMs }) {
  if (!scoresConnected) throw Object.assign(new Error('not connected'), { reason: 'network' });
  let response;
  try {
    response = await fetch(endpoint(), {
      method: 'POST',
      headers: headers({ Prefer: 'return=representation' }),
      body: JSON.stringify({ difficulty, name, time_ms: Math.round(timeMs) }),
    });
  } catch {
    throw Object.assign(new Error('network'), { reason: 'network' });
  }
  /* 400 with code 23514 is a CHECK constraint saying no. Anything else is the
   * service being unreachable or misconfigured. */
  if (!response.ok) {
    let code = null;
    try { code = (await response.json()).code; } catch { /* not JSON */ }
    const reason = code === '23514' ? 'rejected' : 'network';
    throw Object.assign(new Error(`save failed: ${response.status}`), { reason });
  }
  const rows = await response.json();
  return rows[0];
}
