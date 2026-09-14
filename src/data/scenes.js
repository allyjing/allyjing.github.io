/* Repo path: src/data/scenes.js
 *
 * The two scenes. There is no third — each of the five tables opens an overlay panel
 * over `interior`, not a scene of its own (PRD R7/R11).
 *
 * Coordinates are IMAGE coordinates: percentages across the artwork, not the stage.
 * The scene art is cropped to fill, so stage coordinates would drift off the painted
 * ground as the window changes shape. See engine/layout.js.
 */

import { sceneAlt, actorAlt, signs, doors, tables } from './content.js';

/* Jingwen's three views. Each is cut into a body and two legs so the legs can move,
 * and all three are cut at the SAME percentages (see bodyHeight/legTop below) so the
 * hip geometry is identical and she cannot jump when she turns.
 *
 * `aspect` differs per pose because a profile is narrower than a front view; the
 * renderer updates the actor box when the pose changes. Heights are normalised, so
 * she stays the same height throughout. */
function pose(prefix, aspect) {
  return {
    aspect,
    body: `assets/sprites/${prefix}-body.png`,
    legLeft: `assets/sprites/${prefix}-leg-left.png`,
    legRight: `assets/sprites/${prefix}-leg-right.png`,
  };
}

const jingwenFront = pose('jingwen', 222 / 720);
const jingwenBack = pose('jingwen-back', 227 / 720);
const jingwenSide = pose('jingwen-side', 193 / 720);

const jingwen = {
  id: 'jingwen',
  alt: actorAlt.jingwen,
  walks: true,
  aspect: 222 / 720,
  parts: jingwenFront,
  poses: {
    front: jingwenFront,   // walking toward the viewer, or standing
    back: jingwenBack,     // walking away
    side: jingwenSide,     // left or right; drawn facing RIGHT, mirrored for the other
  },
  bodyHeight: 63.194,
  legTop: 61.806,
  legHeight: 38.194,
};

export const scenes = {
  exterior: {
    id: 'exterior',
    image: 'assets/scenes/exterior.jpg',

    /* The painting is opaque edge to edge, which would hide the landmark backdrop
     * behind it completely. This mask punches the sky out so the backdrop shows
     * through — the same result as a transparent cutout, but the artwork stays a
     * 375 KB JPEG and the mask is ~13 KB of almost-flat alpha. The equivalent RGBA
     * PNG was 996 KB, which would have blown the page budget on its own.
     *
     * Built by assets/source/make-sky-mask.py. The exterior regeneration replaces
     * both this and the mask. */
    mask: 'assets/scenes/exterior-mask.png',

    alt: sceneAlt.exterior,
    aspect: 1408 / 768,
    hasBackdrop: true,             // the landmark layer only appears outdoors

    /* How tall a band the backdrop is fitted into, as a percentage down the artwork.
     *
     * This single number controls two things at once, which is worth understanding
     * before changing it. The backdrop is fitted with `contain`, so the band's height
     * IS the image's height — a taller band means a bigger, closer-looking landmark.
     * And the band's bottom is where the backdrop's own foreground sits, which needs
     * to be below the painted treeline (~50%) so its edge is hidden.
     *
     * Push it too high and the landmark looms like a hill in the next field. Too low
     * and the subject shrinks to nothing. 66 is the compromise: the Hollywood Sign
     * sits at about 72% down its own image, so it lands at ~47% here, just above the
     * treeline and still in view.
     *
     * 55 rather than 66: at 66 the fitted image is wide enough that the landmark
     * cannot be shifted clear of the bakery — the geometry runs out before the
     * subject escapes the roofline. Smaller reads as further away anyway, which is
     * the point. */
    horizon: 55,

    /* Walkable ground (R4). Traced against the artwork rather than approximated,
     * because a rectangle puts her ankle-deep in the roses. It excludes the
     * bottom-left rose bed, the raised bed across the bakery front, the fountain,
     * the flowering bushes right of it, and the bottom-right lavender. */
    walkable: [
      [37, 83],   // the doorstep
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

    /* Walking onto the doorstep goes inside (R9). The radius is in image units, so
     * it is the same patch of doorstep at any window size. */
    door: { x: 41, y: 83, radius: 4.5, to: 'interior' },

    /* On a wide screen the contact signs sit just OUTSIDE the walkable polygon, on
     * the grass beyond its edges, so she never stands on one. On a tall screen those
     * positions are off-screen entirely — the scene is cropped to fill and only a
     * narrow band survives — so ui.css docks them into a corner instead. */
    signs: [
      { id: 'linkedin', ...signs.linkedin, x: 21, y: 90 },
      { id: 'email', ...signs.email, x: 88, y: 89 },
      { id: 'enter', ...doors.enter, x: 33, y: 86 },
    ],

    decor: [],

    actors: [
      { ...jingwen, x: 46, y: 92, height: 30, facing: 1 },
      { id: 'junnie', image: 'assets/sprites/junnie.png', alt: actorAlt.junnie,
        x: 57, y: 93, height: 15, facing: -1, walks: false, aspect: 237 / 420 },
    ],
  },

  /* The hub. One room, five tables, each of which will open an overlay PANEL rather
   * than lead to another scene — there is no third scene, ever (PRD R7/R11).
   *
   * There is no interior painting yet, so the room is drawn in CSS from the tokens.
   * `image: null` is the signal for that; see .stage[data-scene='interior'] in
   * scenes.css, and the prompt in assets/PROMPTS.md. */
  interior: {
    id: 'interior',
    image: null,
    alt: sceneAlt.interior,
    aspect: 1408 / 768,
    hasBackdrop: false,            // no landmark layer indoors

    walkable: [
      [10, 88], [90, 88], [95, 98], [5, 98],
    ],

    signs: [
      { id: 'outside', ...doors.exit, x: 87, y: 95 },
    ],

    // Five tables along the room. Phase 5 turns these into panel triggers.
    decor: tables.map((table, i) => ({
      ...table,
      id: `table-${table.id}`,
      kind: 'table',
      x: 14 + i * 18,
      y: 80 + (i % 2) * 7,         // staggered, so the row does not read as a wall
    })),

    actors: [
      { ...jingwen, x: 50, y: 95, height: 24, facing: 1 },
    ],
  },
};

export const DEFAULT_SCENE = 'exterior';

export function getScene(id) {
  return scenes[id] || null;
}
