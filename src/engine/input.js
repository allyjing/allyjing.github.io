/* Repo path: src/engine/input.js
 *
 * Turns clicks and key presses into walker commands. The only file that knows about
 * events; movement.js does the geometry and knows nothing about the DOM.
 */

import { toImageCoords } from './layout.js';
import { isOpen as isPanelOpen } from './panel.js';

const MOVEMENT_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd',
]);

export function bindInput({ stage, walker, aspect }) {
  // R1: click or tap anywhere on walkable ground walks there in a straight line.
  // Out-of-bounds points are clamped by the walker rather than ignored, so a click
  // on the bakery roof walks to the nearest ground instead of doing nothing.
  function onPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;   // left click only

    /* Clicks that land on something interactive are for that control, not for the
     * ground. Without this she walks toward the clock every time you change the time
     * of day, because the event bubbles up to the stage. */
    if (event.target.closest('a, button, .chrome, .sign, .table')) return;

    walker.moveTo(toImageCoords(event.clientX, event.clientY, stage, aspect));
  }

  // R2: arrow keys and WASD. Required for keyboard accessibility, not a bonus.
  function onKeyDown(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;     // leave shortcuts alone

    /* An open panel is modal, and the walker has to stop for it. These listeners
     * are on `window`, and the `inert` panel.js puts on the stage blocks pointer
     * and focus but NOT a window-level key listener — so without this, holding
     * ArrowDown while reading a panel walked her across the interior's exit
     * threshold and ejected the reader to #/exterior.
     *
     * Bailing BEFORE preventDefault also hands the arrow keys back to the browser,
     * which is what lets a keyboard user scroll .panel__body (WCAG 2.1.1).
     *
     * Releasing on the way out covers a key that was already held when the panel
     * opened: auto-repeat keeps firing keydown, so this runs and she stops. */
    if (isPanelOpen()) {
      walker.releaseAllKeys();
      return;
    }

    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (!MOVEMENT_KEYS.has(key)) return;
    event.preventDefault();                                         // stop arrows scrolling
    walker.holdKey(key);
  }

  /* Deliberately NOT gated on the panel: a release is always safe, and swallowing
   * one would leave a key stuck down if the panel opened mid-press. */
  function onKeyUp(event) {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (MOVEMENT_KEYS.has(key)) walker.releaseKey(key);
  }

  /* Without this, switching tabs mid-walk leaves the key "held" — the keyup lands on
   * another window and she moonwalks off on her own when you come back. */
  function onBlur() { walker.releaseAllKeys(); }

  stage.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);

  return function unbind() {
    stage.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
  };
}
