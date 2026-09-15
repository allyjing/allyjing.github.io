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
import { startRouter, navigate } from './router.js';
import {
  applyTimeState, renderScene, renderBackdrop, watchResize,
  actorElement, placeActor, setActorPose,
} from './renderer.js';
import { createWalker } from './movement.js';
import { bindInput } from './input.js';
import { buildChrome } from './chrome.js';
import { openPanel, closePanel, isOpen, bindPanel } from './panel.js';

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

/* Closing is a route change, not a direct DOM call: that is what makes the Back
 * button leave the panel rather than the site (R10). */
bindPanel(() => navigate('interior'));

let teardown = [];

/* Which scene is currently rendered, so the router callback below can tell a real
 * scene change from a panel-only hash change (R10). Without this, opening or
 * closing a panel on the SAME scene — which is also a hash change — would tear
 * the whole scene down and rebuild it, replacing every table button with a new
 * element. panel.js hangs onto the button that opened it so it can hand focus
 * back on close; a rebuilt button is a different element, so that focus call
 * would silently land on nothing. This guard only covers that same-scene case:
 * skipping the rebuild there keeps the opener button alive across a panel
 * open/close. It does nothing for an actual scene change with a panel open
 * (e.g. #/interior/projects -> #/exterior), where the old table button is
 * legitimately gone — panel.js's own `isConnected` check handles that case. */
let currentScene = null;

function enterScene(sceneId) {
  for (const off of teardown) off();
  teardown = [];

  /* Opening a table is a ROUTE change, not a direct call. That is what makes
   * #/interior/projects shareable and the Back button work (R10). */
  const scene = renderScene(sceneId, time, (id) => navigate('interior', id));
  teardown.push(watchResize(scene));

  const player = scene.actors.find((actor) => actor.walks);
  if (!player) return;

  const sprite = actorElement(player.id);

  /* Walking onto the doorstep goes inside (R9). `entered` latches so arriving does
   * not fire the transition on every frame while she stands there. */
  let entered = false;

  const walker = createWalker({
    start: { x: player.x, y: player.y },
    polygon: scene.walkable,
    onMove: (position, facing, moving, heading) => {
      setActorPose(sprite, player, heading);
      placeActor(sprite, position, facing, moving);

      const door = scene.door;
      if (!door || entered) return;
      if (Math.hypot(position.x - door.x, position.y - door.y) <= door.radius) {
        entered = true;
        navigate(door.to);
      }
    },
  });

  walker.start();
  teardown.push(walker.stop);
  teardown.push(bindInput({ stage: document.getElementById('stage'), walker, aspect: scene.aspect }));
}

startRouter((route) => {
  const sceneId = getScene(route.scene) ? route.scene : 'exterior';

  /* Only rebuild the scene when it actually changed. See the comment on
   * `currentScene` above: a panel open/close is also a hash change, and calling
   * enterScene unconditionally would rebuild the table buttons under the panel's
   * own opener reference on every open and close. */
  if (sceneId !== currentScene) {
    currentScene = sceneId;
    enterScene(sceneId);
  }

  /* The scene is rendered FIRST, every time it changes. The panel's opener is the
   * table button that enterScene just created, and on a cold load of
   * #/interior/projects that button does not exist until this point — open before
   * it and focus has nowhere to return to when the panel closes.
   *
   * Panels exist only indoors: #/exterior/projects renders the exterior, no panel.
   * An unknown id opens nothing, so a typo in a shared link is a plain room. */
  if (sceneId === 'interior' && route.panel) {
    openPanel(route.panel);
  } else if (isOpen()) {
    closePanel();
  }
});
