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
      /* Junnie sits at the fountain's edge, facing the water, trying to catch
       * something in it. `fishes` turns on the idle in scenes.css. He faces right
       * (facing: 1) because the fountain is to his right. */
      { id: 'junnie', image: 'assets/sprites/junnie.png', alt: actorAlt.junnie,
        x: 67, y: 86, height: 11, facing: 1, walks: false, fishes: true,
        aspect: 237 / 420 },
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
    image: 'assets/scenes/interior.webp',
    alt: sceneAlt.interior,
    aspect: 1376 / 768,
    hasBackdrop: false,            // no landmark layer indoors

    /* The clear wooden floor, traced against the painting so she cannot walk over
     * the furniture. Re-traced 2026-09-14 for the new artwork.
     *
     * This room is furnished much lower in the frame than the old one, so the clear
     * floor is a band across the FOREGROUND rather than a path threading between the
     * tables. That is enough: the tables are buttons, so she never needs to walk to
     * one. The polygon only has to let her move about and reach the way out.
     *
     * Perspective matters — each boundary sits below the FEET of the furniture in
     * front of it, not its top edge. The y-90 spans clear both front tables'
     * pedestal bases, which end around y 89; the alcove up to y 82 is the gap
     * between the two front table groups. The left edge clears the display case and
     * the right clears the cabinet and the sleeping cat. */
    walkable: [
      [49, 82],   // the alcove between the two front tables
      [58, 82],
      [62, 90],   // below the front-right table's pedestal
      [86, 90],
      [93, 98],
      [7, 98],
      [14, 90],   // clear of the display case
      [46, 90],   // below the front-left table's pedestal
    ],

    /* No walk-in trigger here, unlike the exterior. The way out is the front EDGE of
     * the room — see `exit` below. The "Back outside" sign stays as well (R9): it is
     * the only focusable, keyboard-operable exit, and walking is the nice way rather
     * than the only way. */

    /* Walking down across the front of the room leaves it. There is no painted door
     * to walk to, so the front EDGE is the way out — stepping toward the viewer is
     * stepping back outside.
     *
     * `at` is an image-space y, like every other coordinate in this file. It sits
     * just inside the polygon's bottom edge (y 97), not on it, so she reaches the
     * trigger while still on painted floor.
     *
     * 95 sits between the polygon's foreground edge (y 98) and the y-90 spans, so
     * she reaches it while still on painted floor. */
    exit: { edge: 'bottom', at: 95, to: 'exterior' },

    /* On the door itself, so it reads as the way out rather than as a button
     * floating in the room. Re-placed 2026-09-14: the old x38 sat on the window
     * pane left of the door in the new artwork. The double door spans x 44-58. */
    signs: [
      { id: 'outside', ...doors.exit, x: 51, y: 47 },
    ],

    decor: [],

    /* One trigger per painted table. x/y is the TABLE SURFACE — the dessert sits
     * there and the bubble floats above it. Read off the artwork.
     *
     * These are BUTTONS in the props layer, not scenery in the decor layer. The
     * decor layer is aria-hidden, and a control a screen reader cannot see is not a
     * control. The id is bare (`projects`), because the same string is the panels
     * key and the URL segment; the DOM id gets the `table-` prefix at render. */
    tables: tables.map((table, i) => ({
      ...table,
      /* Read off the new artwork 2026-09-14, in the table order in content.js:
       * experience, projects, photography, life, arts. */
      ...[{ x: 37, y: 54 }, { x: 52, y: 60 }, { x: 67, y: 54 },
          { x: 40, y: 70 }, { x: 73, y: 70 }][i],
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
