/* Repo path: src/engine/router.js
 *
 * Hash routing. State lives in the URL so links are shareable and the browser Back
 * button works (PRD R10). A site where Back exits entirely is broken.
 *
 * Hash routing is also the only routing style that needs no server configuration on
 * GitHub Pages, which cannot rewrite unknown paths to index.html (PRD §10.3).
 *
 * Routes:  #/exterior   #/interior   #/interior/projects
 */

import { DEFAULT_SCENE } from '../data/scenes.js';

export function parseHash(hash) {
  // "#/interior/projects" -> ["interior", "projects"]
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return { scene: parts[0] || DEFAULT_SCENE, panel: parts[1] || null };
}

export function currentRoute() {
  return parseHash(window.location.hash);
}

export function navigate(scene, panel = null) {
  window.location.hash = panel ? `#/${scene}/${panel}` : `#/${scene}`;
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
