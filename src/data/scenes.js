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

/* Jingwen's front view, cut into three pieces so her legs can swing.
 *
 * There is only a front view. Walking away from the camera or sideways should turn
 * her, and cannot until a back and a side view exist — the prompts are in
 * assets/PROMPTS.md. Add them to `poses` below and the engine picks them up with no
 * code change. */
const jingwenFront = {
  body: 'assets/sprites/jingwen-body.png',
  legLeft: 'assets/sprites/jingwen-leg-left.png',
  legRight: 'assets/sprites/jingwen-leg-right.png',
};

export const scenes = {
  exterior: {
    id: 'exterior',
    image: 'assets/scenes/exterior.jpg',
    alt: sceneAlt.exterior,
    aspect: 1408 / 768,            // the artwork's shape; see engine/layout.js
    hasBackdrop: true,             // the landmark layer only appears outdoors

    /* Walkable ground, as a ring of [x, y] image coordinates (R4).
     *
     * Traced against the artwork rather than approximated, because a rectangle puts
     * her ankle-deep in the roses. What it deliberately excludes:
     *   - the rose and lavender bed filling the bottom-left corner   (x below ~25)
     *   - the stone-edged raised bed across the bakery front         (y above ~88)
     *   - the fountain and its base                                  (y above ~83)
     *   - the pink flowering bushes right of the fountain            (y above ~86)
     *   - the lavender along the bottom-right                        (x beyond ~84)
     * leaving the garden path, the doorstep, and the open lawn.
     *
     * To retune: run the grid overlay described in CLAUDE.md, or just walk her to
     * each corner in the browser and check her feet stay on painted ground. */
    walkable: [
      [37, 83],   // the doorstep -- the Phase 5 way in
      [48, 83],
      [57, 86],   // clear of the potted plant and the bread basket
      [70, 84],   // under the fountain base
      [80, 86],
      [84, 91],   // stop short of the bottom-right lavender
      [70, 95],
      [40, 97],   // bottom of the garden path
      [28, 95],
      [26, 91],   // clear of the roses
      [31, 88],   // below the raised bed
      [34, 85],
    ],

    actors: [
      /* Jingwen is drawn in three pieces so her legs can actually swing. The numbers
       * are where the sprite was cut, as percentages of the whole sprite box — they
       * must match the cut or the hip seam shows. See assets/PROMPTS.md. */
      {
        id: 'jingwen', alt: actorAlt.jingwen,
        x: 46, y: 92, height: 30, facing: 1, walks: true,
        aspect: 222 / 720,
        parts: jingwenFront,
        poses: {
          front: jingwenFront,
          // back: { body: ..., legLeft: ..., legRight: ... },   <- generate these
          // side: { body: ..., legLeft: ..., legRight: ... },
        },
        bodyHeight: 63.194,
        legTop: 61.806,
        legHeight: 38.194,
      },
      { id: 'junnie', image: 'assets/sprites/junnie.png', alt: actorAlt.junnie,
        x: 57, y: 93, height: 15, facing: -1, walks: false, aspect: 237 / 420 },
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
