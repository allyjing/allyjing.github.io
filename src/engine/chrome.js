/* Repo path: src/engine/chrome.js
 *
 * The persistent interface: the clock (top-left), the location label (bottom-left),
 * and the way out of the interior (bottom-right).
 *
 * ⚠️ THE RESUME LINK USED TO LIVE HERE, top-right, and it does not any more. It is
 * a SIGN in each scene now — a board on the LinkedIn post outdoors, a card on the
 * checkout counter indoors — which is a deliberate override of PRD R23. Do not put
 * it back without reading "The recruiter escape hatch is a sign now" in CLAUDE.md;
 * a third copy is how a link ends up pointing somewhere the other two do not.
 *
 * These live above the time-of-day tint and are never dimmed by it. The night wash
 * darkening the clock would be a bug, not a mood — so they use --chrome-bg and
 * --chrome-ink, which flip per theme instead.
 */

import { timeNames, chrome as chromeCopy, doors } from '../data/content.js';
import { landmarkForTime, locationLabel } from '../data/landmarks.js';

function button(className, onClick) {
  const node = document.createElement('button');
  node.type = 'button';
  node.className = className;
  /* A real <button> is used deliberately: it is focusable, it fires on Enter AND
   * Space for free, and screen readers announce it correctly. Rebuilding that on a
   * <div> is how these things end up keyboard-inaccessible (R6). */
  node.addEventListener('click', onClick);
  return node;
}

/* Top-left: when. Clicking advances the state, which also changes the landmark,
 * because time and place are one value (R18/R28). */
function buildClock(onCycle) {
  const node = button('chrome chrome--clock', onCycle);
  node.title = chromeCopy.cycleHint;
  node.innerHTML = '<span class="clock__time"></span><span class="clock__name"></span>';
  return node;
}

// Bottom-left: where. The other readout of the same value, so it cycles too.
function buildLocation(onCycle) {
  const node = button('chrome chrome--location', onCycle);
  node.title = chromeCopy.cycleHint;
  return node;
}

/* The way out of the interior, bottom-right.
 *
 * It lives in the chrome rather than in the scene because the interior is first
 * person: there is no character to walk to a sign, so the exit has to be a control.
 * A real <a> to the hash route, so it works with the keyboard and with Back, and
 * CSS hides it outside the interior. */
function buildBack() {
  const link = document.createElement('a');
  link.className = 'chrome chrome--back';
  link.href = doors.exit.href;
  link.textContent = doors.exit.label;
  link.setAttribute('aria-label', doors.exit.ariaLabel);
  return link;
}

export function buildChrome({ onCycle }) {
  const layer = document.getElementById('ui');
  layer.replaceChildren();

  const clock = buildClock(onCycle);
  const location = buildLocation(onCycle);
  layer.append(clock, location, buildBack());

  // The visitor's real time, which keeps ticking regardless of the scene they pick.
  function wallClock() {
    return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  let current = null;

  function update(time) {
    if (time) current = time;
    const name = timeNames[current];
    const now = wallClock();

    clock.querySelector('.clock__time').textContent = now;
    clock.querySelector('.clock__name').textContent = name;

    const landmark = landmarkForTime(current);
    location.textContent = locationLabel(landmark);

    location.setAttribute('aria-label', `${locationLabel(landmark)}. ${chromeCopy.cycleHint}`);
    clock.setAttribute('aria-label', `${now}, showing ${name}. ${chromeCopy.cycleHint}`);
  }

  /* Tick so the displayed time stays true. Every 15s rather than every minute, so
   * the visible minute never lags reality by more than a few seconds. */
  setInterval(() => { if (current) update(); }, 15000);

  return update;
}
