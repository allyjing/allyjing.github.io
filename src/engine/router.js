/* Repo path: src/engine/router.js
 *
 * Hash routing. State lives in the URL so links are shareable and the browser Back
 * button works (PRD R10). A site where Back exits entirely is broken.
 *
 * Hash routing is also the only routing style that needs no server configuration on
 * GitHub Pages, which cannot rewrite unknown paths to index.html (PRD §10.3).
 *
 * Routes:  #/exterior
 *          #/interior
 *          #/interior/projects            a panel
 *          #/interior/projects/arcadium   one item INSIDE that panel
 */

import { DEFAULT_SCENE } from '../data/scenes.js';

export function parseHash(hash) {
  // "#/interior/projects/arcadium" -> ["interior", "projects", "arcadium"]
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return {
    scene: parts[0] || DEFAULT_SCENE,
    panel: parts[1] || null,
    /* The third segment names something WITHIN the panel — a project's own page in
     * the Projects showcase. It is a separate segment rather than a fourth panel id
     * so that one project is a shareable URL, and so the panel itself does not have
     * to close and reopen to show it. An unrecognised item falls back to the panel's
     * index; see openPanel. */
    item: parts[2] || null,
  };
}

export function currentRoute() {
  return parseHash(window.location.hash);
}

export function navigate(scene, panel = null, item = null) {
  const parts = [scene, panel, item].filter(Boolean);
  window.location.hash = `#/${parts.join('/')}`;
}

/* Calls `onChange(route)` now and on every subsequent hash change. Returns a function
 * that stops listening — handy in tests and when a scene is torn down. */
export function startRouter(onChange) {
  const handle = () => onChange(currentRoute());

  // Normalise a bare URL to an explicit route so the address bar always shows where
  // you are, and so a reload lands in the same place.
  if (!window.location.hash) {
    window.location.replace(`#/${DEFAULT_SCENE}`);
  }

  window.addEventListener('hashchange', handle);
  handle();
  return () => window.removeEventListener('hashchange', handle);
}
