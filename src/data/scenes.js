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

    /* Generated as a proper cutout: everything above the ground is flat magenta in
     * the source, so this mask is a straight key rather than the guesswork the
     * previous painting needed. Built by assets/source/make-cutout-mask.py.
     *
     * Still a mask paired with a JPEG rather than an RGBA PNG — same reason as
     * before, the PNG of the same picture is several times the size. */
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
     * With the cutout exterior the cut reaches much further down — the ground line
     * sits around 72% — so the vista can be bigger than it was against the old
     * painting and still tuck behind the ground. */
    horizon: 66,

    /* Walkable ground (R4). Traced against the artwork rather than approximated,
     * because a rectangle puts her ankle-deep in the roses. It excludes the
     * bottom-left rose bed, the raised bed across the bakery front, the fountain,
     * the flowering bushes right of it, and the bottom-right lavender. */
    /* The open sandy ground in front of the bakery. The planting, the pots and the
     * fountain all sit above it, so the polygon starts below their bases. */
    walkable: [
      [30, 79],   // beside the stone path, clear of the pots
      [60, 77],
      [80, 76],   // in front of the fountain
      [95, 78],
      [97, 97],
      [8, 97],
      [10, 90],
      [20, 84],
    ],

    /* Walking onto the doorstep goes inside (R9). The radius is in image units, so
     * it is the same patch of doorstep at any window size. */
    door: { x: 33, y: 80, radius: 5, to: 'interior' },

    /* On a wide screen the contact signs sit just OUTSIDE the walkable polygon, on
     * the grass beyond its edges, so she never stands on one. On a tall screen those
     * positions are off-screen entirely — the scene is cropped to fill and only a
     * narrow band survives — so ui.css docks them into a corner instead. */
    signs: [
      { id: 'linkedin', ...signs.linkedin, x: 14, y: 95 },
      { id: 'email', ...signs.email, x: 88, y: 92 },
      { id: 'enter', ...doors.enter, x: 30, y: 86 },
    ],

    decor: [],

    actors: [
      { ...jingwen, x: 48, y: 93, height: 27, facing: 1 },
      { id: 'junnie', image: 'assets/sprites/junnie.png', alt: actorAlt.junnie,
        x: 60, y: 95, height: 13, facing: -1, walks: false, aspect: 237 / 420 },
    ],
  },

  /* The hub. One room, five tables, each of which will open an overlay PANEL rather
   * than lead to another scene — there is no third scene, ever (PRD R7/R11).
   *
   * The tables are PAINTED now, so nothing draws them. The only things placed here
   * are the floating bubbles that sit above each one; Phase 5 turns those into the
   * panel triggers. Their coordinates are read off the artwork. */
  interior: {
    id: 'interior',
    image: 'assets/scenes/interior.jpg',
    alt: sceneAlt.interior,
    aspect: 1376 / 768,
    hasBackdrop: false,            // no landmark layer indoors

    /* The clear wooden floor: off the counter on the left, off the chairs on the
     * right, and reaching up the middle to the doorway so she can actually walk out
     * of it. Without that reach the exit is visible but unreachable. */
    walkable: [
      [34, 50],   // the doorway threshold
      [45, 49],
      [50, 60],
      [70, 63],
      [87, 71],
      [94, 95],
      [9, 95],
      [21, 79],
      [28, 60],
    ],

    // The doorway back out to the street, left of centre in the painting.
    door: { x: 39, y: 51, radius: 4.5, to: 'exterior' },

    signs: [
      { id: 'outside', ...doors.exit, x: 39, y: 47 },
    ],

    // One bubble above each painted table.
    decor: tables.map((table, i) => ({
      ...table,
      id: `table-${table.id}`,
      kind: 'bubble',
      ...[{ x: 44, y: 55 }, { x: 53, y: 43 }, { x: 68, y: 40 },
          { x: 78, y: 47 }, { x: 89, y: 57 }][i],
    })),

    actors: [
      { ...jingwen, x: 50, y: 88, height: 27, facing: 1 },
    ],
  },
};

export const DEFAULT_SCENE = 'exterior';

export function getScene(id) {
  return scenes[id] || null;
}
