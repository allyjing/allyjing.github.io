/* Repo path: src/engine/main.js
 *
 * Boot. Wires the router to the renderer and nothing else.
 *
 * Phase 1 scope: one static scene. No movement (Phase 2), no clock or location label
 * (Phase 3), no panels (Phase 5).
 */

import { site } from '../data/content.js';
import { timeStateNow } from '../data/theme.js';
import { startRouter } from './router.js';
import { applyTimeState, renderScene } from './renderer.js';

// The title is copy, so it comes from content.js rather than being typed into <title>.
document.title = site.title;

// First load derives time of day from the visitor's own clock (PRD R27).
let time = timeStateNow();
applyTimeState(time);

startRouter((route) => {
  renderScene(route.scene, time);
  // route.panel is parsed and deliberately ignored until Phase 5.
});
