/* Repo path: src/engine/main.js
 *
 * Boot. Wires the router, the renderer, movement and the chrome together.
 *
 * Phase 3 scope: the exterior is complete — signs, clock, location label, resume
 * link, all four time states. Still to come: panels and the interior (Phase 5).
 */

import { site } from '../data/content.js';
import { getScene } from '../data/scenes.js';
import { timeStateNow, nextTimeState } from '../data/theme.js';
import { startRouter } from './router.js';
import {
  applyTimeState, renderScene, renderBackdrop, watchResize,
  actorElement, placeActor, setActorPose,
} from './renderer.js';
import { createWalker } from './movement.js';
import { bindInput } from './input.js';
import { buildChrome } from './chrome.js';

// The title is copy, so it comes from content.js rather than being typed into <title>.
document.title = site.title;

/* Time of day is derived from the visitor's clock on first load (R27) and then only
 * ever changed by clicking the clock or the location label (R28). Holding it here
 * rather than in the scene is what makes it persist across scene changes (R29). */
let time = timeStateNow();
applyTimeState(time);

const updateChrome = buildChrome({
  onCycle() {
    time = nextTimeState(time);
    applyTimeState(time);          // tokens re-theme, and CSS cross-fades them
    renderBackdrop(time);          // the landmark changes with the time (R18)
    updateChrome(time);
  },
});
updateChrome(time);

let teardown = [];

function enterScene(sceneId) {
  for (const off of teardown) off();
  teardown = [];

  const scene = renderScene(sceneId, time);
  teardown.push(watchResize(scene));

  const player = scene.actors.find((actor) => actor.walks);
  if (!player) return;

  const sprite = actorElement(player.id);
  const walker = createWalker({
    start: { x: player.x, y: player.y },
    polygon: scene.walkable,
    onMove: (position, facing, moving, heading) => {
      setActorPose(sprite, player, heading);
      placeActor(sprite, position, facing, moving);
    },
  });

  walker.start();
  teardown.push(walker.stop);
  teardown.push(bindInput({ stage: document.getElementById('stage'), walker, aspect: scene.aspect }));
}

startRouter((route) => {
  enterScene(getScene(route.scene) ? route.scene : 'exterior');
  // route.panel is parsed and deliberately ignored until Phase 5.
});
