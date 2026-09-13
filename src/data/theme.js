/* Repo path: src/data/theme.js
 *
 * The time-of-day state machine. Pure logic — no DOM, no imports from engine/.
 * Time and place are ONE value: each state is locked to one landmark (PRD R18).
 */

// Order matters: this is the cycle clicking the clock walks through.
export const TIME_STATES = ['morning', 'noon', 'sunset', 'night'];

/* Hour ranges from PRD R27. Every hour maps to a state; there are no gaps and
 * there is no `afternoon` — `noon` covers midday through late afternoon. */
export function timeStateForHour(hour) {
  if (hour >= 5  && hour <= 10) return 'morning';
  if (hour >= 11 && hour <= 16) return 'noon';
  if (hour >= 17 && hour <= 20) return 'sunset';
  return 'night';                    // 21:00–04:59 wraps past midnight
}

// Used on first load to derive the state from the visitor's own clock (R27).
export function timeStateNow(date = new Date()) {
  return timeStateForHour(date.getHours());
}

// Clicking the clock or the location label advances one step, wrapping (R28).
export function nextTimeState(state) {
  const i = TIME_STATES.indexOf(state);
  return TIME_STATES[(i + 1) % TIME_STATES.length];
}
