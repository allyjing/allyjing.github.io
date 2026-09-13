/* Repo path: src/engine/chrome.js
 *
 * The persistent interface: the clock (top-left), the location label (bottom-left),
 * and the resume link (top-right).
 *
 * These live above the time-of-day tint and are never dimmed by it. The night wash
 * darkening the resume link would be a bug, not a mood — so they use --chrome-bg and
 * --chrome-ink, which flip per theme instead.
 */

import { timeLabels, resume as resumeCopy, chrome as chromeCopy } from '../data/content.js';
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

function buildResume() {
  const link = document.createElement('a');
  link.className = 'chrome chrome--resume';
  link.href = resumeCopy.href;          // no leading slash — see PRD §10.3
  link.textContent = resumeCopy.label;
  link.setAttribute('aria-label', resumeCopy.ariaLabel);
  return link;
}

export function buildChrome({ onCycle }) {
  const layer = document.getElementById('ui');
  layer.replaceChildren();

  const clock = buildClock(onCycle);
  const location = buildLocation(onCycle);
  layer.append(clock, location, buildResume());

  return function update(time) {
    const label = timeLabels[time];
    clock.querySelector('.clock__time').textContent = `${label.time} ${label.meridiem}`;
    clock.querySelector('.clock__name').textContent = label.name;

    const landmark = landmarkForTime(time);
    location.textContent = locationLabel(landmark);

    /* Announced as a live region rather than a button label, so a screen reader
     * hears what changed after a click instead of re-reading the control. */
    location.setAttribute('aria-label', `${locationLabel(landmark)}. ${chromeCopy.cycleHint}`);
    clock.setAttribute('aria-label', `${label.time} ${label.meridiem}, ${label.name}. ${chromeCopy.cycleHint}`);
  };
}
