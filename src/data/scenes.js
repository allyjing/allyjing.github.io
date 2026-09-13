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
    hasBackdrop: true,             // the landmark layer only appears outdoors
    actors: [
      { id: 'jingwen', image: 'assets/sprites/jingwen.png', alt: actorAlt.jingwen,
        left: 46, bottom: 8,  height: 34, facing: 1 },
      { id: 'junnie',  image: 'assets/sprites/junnie.png',  alt: actorAlt.junnie,
        left: 57, bottom: 7,  height: 17, facing: -1 },
    ],
  },

  // Phase 5. Declared so the router and renderer have something to fail against loudly
  // rather than silently rendering a blank stage.
  interior: {
    id: 'interior',
    image: null,
    alt: sceneAlt.interior,
    hasBackdrop: false,
    actors: [],
  },
};

export const DEFAULT_SCENE = 'exterior';

export function getScene(id) {
  return scenes[id] || null;
}
