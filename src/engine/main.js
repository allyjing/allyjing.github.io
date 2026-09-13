/* Repo path: src/engine/main.js
 *
 * Boot. Wires the router, the renderer and movement together, and nothing else.
 *
 * Phase 2 scope: click-to-move and keyboard movement inside a walkable polygon.
 * Still to come: the clock and location label (Phase 3), and panels (Phase 5).
 */

import { site } from '../data/content.js';
import { getScene } from '../data/scenes.js';
import { timeStateNow } from '../data/theme.js';
import { startRouter } from './router.js';
import { applyTimeState, renderScene, watchResize, actorElement, placeActor, setActorPose } from './renderer.js';
import { createWalker } from './movement.js';
import { bindInput } from './input.js';

// The title is copy, so it comes from content.js rather than being typed into <title>.
document.title = site.title;

// First load derives time of day from the visitor's own clock (PRD R27).
const time = timeStateNow();
applyTimeState(time);

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
