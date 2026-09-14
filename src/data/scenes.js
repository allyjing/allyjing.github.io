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
    horizon: 78,

    /* Walkable ground (R4). Traced against the artwork rather than approximated,
     * because a rectangle puts her ankle-deep in the roses. It excludes the
     * bottom-left rose bed, the raised bed across the bakery front, the fountain,
     * the flowering bushes right of it, and the bottom-right lavender. */
    /* The open sandy ground in front of the bakery. The terracotta pots run right
     * along the frontage and the fountain sits in the middle-right, so the polygon
     * starts below all of their bases rather than at the building line. */
    walkable: [
      [16, 90],   // clear of the pots stacked on the left
      [28, 87],
      [45, 85],
      [62, 84],
      [78, 84],   // in front of the fountain
      [92, 84],
      [98, 87],
      [98, 98],
      [3, 98],
    ],

    /* Walking onto the doorstep goes inside (R9). The radius is in image units, so
     * it is the same patch of doorstep at any window size. */
    /* The door sits at about y=78, above the walkable ground, so the trigger is on
     * the nearest patch of ground below it rather than on the threshold itself. */
    door: { x: 31, y: 88, radius: 5, to: 'interior' },

    /* On a wide screen the contact signs sit just OUTSIDE the walkable polygon, on
     * the grass beyond its edges, so she never stands on one. On a tall screen those
     * positions are off-screen entirely — the scene is cropped to fill and only a
     * narrow band survives — so ui.css docks them into a corner instead. */
    signs: [
      { id: 'linkedin', ...signs.linkedin, x: 8, y: 87 },   // left of the potted plants
      { id: 'email', ...signs.email, x: 88, y: 91 },
      { id: 'enter', ...doors.enter, x: 32, y: 84 },        // right at the door
    ],

    decor: [],

    actors: [
      { ...jingwen, x: 52, y: 94, height: 26, facing: 1 },
      { id: 'junnie', image: 'assets/sprites/junnie.png', alt: actorAlt.junnie,
        x: 64, y: 96, height: 12, facing: -1, walks: false, aspect: 237 / 420 },
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

    /* The clear wooden floor, traced against the painting so she cannot walk over
     * the furniture. It threads between the tables rather than across them: down the
     * middle from the doorway, around the right-hand row, and out along the open
     * foreground. It keeps off the counter on the left and every chair on the right.
     *
     * Perspective matters here — a table's chairs reach well below its top, so each
     * boundary sits below the chair feet, not the table edge. */
    walkable: [
      [55, 66],   // right of the front-left table's chairs
      [64, 71],
      [73, 79],   // below the right-hand row
      [83, 86],
      [92, 92],
      [95, 97],
      [5, 97],
      [9, 86],
      [26, 81],   // clear of the counter front
      [42, 77],
    ],

    /* No walk-in trigger here, unlike the exterior. The doorway sits behind the
     * front-left table and its chairs, so there is no route to it across the floor —
     * anything that let her reach it would also let her stand on the furniture. The
     * "Back outside" sign is the affordance instead (R9), and it sits on the doorway
     * itself so it reads as the way out rather than as a button. */

    signs: [
      { id: 'outside', ...doors.exit, x: 38, y: 50 },
    ],

    /* One marker per painted table. x/y is the TABLE SURFACE — the dessert sits
     * there and the bubble floats above it. Read off the artwork. */
    decor: tables.map((table, i) => ({
      ...table,
      id: `table-${table.id}`,
      kind: 'table',
      ...[{ x: 44, y: 57 }, { x: 55, y: 47 }, { x: 67, y: 44 },
          { x: 78, y: 50 }, { x: 90, y: 61 }][i],
    })),

    actors: [
      { ...jingwen, x: 55, y: 90, height: 27, facing: 1 },
    ],
  },
};

export const DEFAULT_SCENE = 'exterior';

export function getScene(id) {
  return scenes[id] || null;
}
