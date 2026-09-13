/* Repo path: src/data/scenes.js
 *
 * The two scenes. There is no third — each of the five tables opens an overlay panel
 * over `interior`, not a scene of its own (PRD R7/R11).
 *
 * Actor positions are percentages of the stage, so they hold at any viewport size.
 * `bottom` is measured from the stage floor, which is how a character standing on the
 * ground actually behaves when the stage changes height.
 */

import { sceneAlt, actorAlt } from './content.js';

export const scenes = {
  exterior: {
    id: 'exterior',
    image: 'assets/scenes/exterior.jpg',
    alt: sceneAlt.exterior,
    aspect: 1408 / 768,            // the artwork's shape; see engine/layout.js
    hasBackdrop: true,             // the landmark layer only appears outdoors

    /* Walkable ground, as a ring of [x, y] image coordinates (R4). This is the lawn
     * and the garden path: it stops short of the bakery front, keeps out of the deep
     * flower beds in the bottom-left, and does not reach the fountain.
     *
     * Tuning it is a visual job — walk to each corner in the browser and check she
     * stays on painted ground. */
    walkable: [
      [30, 79],
      [92, 79],
      [97, 96],
      [24, 96],
    ],

    actors: [
      { id: 'jingwen', image: 'assets/sprites/jingwen.png', alt: actorAlt.jingwen,
        x: 46, y: 92, height: 30, facing: 1, walks: true },
      { id: 'junnie',  image: 'assets/sprites/junnie.png',  alt: actorAlt.junnie,
        x: 57, y: 93, height: 15, facing: -1, walks: false },
    ],
  },

  // Phase 5. Declared so the router and renderer have something to fail against loudly
  // rather than silently rendering a blank stage.
  interior: {
    id: 'interior',
    image: null,
    alt: sceneAlt.interior,
    aspect: 1408 / 768,
    hasBackdrop: false,
    walkable: [],
    actors: [],
  },
};

export const DEFAULT_SCENE = 'exterior';

export function getScene(id) {
  return scenes[id] || null;
}
