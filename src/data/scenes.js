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

/* Where the two legs divide is baked into the leg images themselves, not expressed
 * here — see assets/source/cut-sprite.py. Head-on it is a straight line down the gap
 * between the legs; in profile the shoes overlap, so it slants to pass between the
 * back heel and the front shoe and leave each with a whole shoe. */
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
  bodyHeight: 72,
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
      /* ⚠️ ONE post carrying ONE LARGER BOARD with two links on it. Asked for
       * directly, twice: first *"i would like the resume button to be right under
       * linkedin and on the same sign as it"*, and then, when that shipped as two
       * pills stacked on one stake, *"just have one large sign instead of like
       * having 2 boxes together"*.
       *
       * This is the only sign with a `boards` list; the rest describe their single
       * link inline. renderer.js wraps a list in `.sign__panel`, which is the board;
       * the order here is the order down it, so LinkedIn is on top and Resume under.
       *
       * ⚠️ It is one post because there is not room for two. The patch is squeezed
       * from both ends: the terracotta pots sit above it, and BELOW it the location
       * label is viewport chrome at --z-ui that paints straight over anything in the
       * artwork. Two separate posts needed two stakes and an 8-unit gap, and even
       * then the lower stake disappeared behind the label on a short window. One
       * post spends a single stake on both boards and fits where two did not.
       *
       * y is where the ONE stake enters the ground. The walkable polygon's left edge
       * runs from [3,98] to [16,90], putting the ground at x=8 at about y=95, so 88
       * is clear of it and she never stands on the post.
       *
       * Re-measure BOTH ends if you move it: the boards are a fixed 70px while y is
       * a percentage, so the post's reach up into the pots grows as the window
       * shrinks, while its stake closes on the location label. Measured clearance
       * over the label at 88 runs 48px at 1600x900 down to 7px at 900x562, which is
       * the shortest window still above the 8:5 dock breakpoint. */
      { id: 'contact', x: 8, y: 88, boards: [signs.linkedin, signs.resume] },
      { id: 'email', ...signs.email, x: 88, y: 91 },
      /* ⚠️ ON THE GRASS under the bay window, pointing RIGHT at the door. Asked for
       * directly: *"i would like the please enter sign to be on the grass next to
       * the bakeries window pointing right"*.
       *
       * The two before it were both on the bare dirt — x 32 y 84 sat on the stepping
       * stones ("its in front of the walkway, i dont really like that"), and x 37
       * y 88 cleared them but read as a sign for the fountain.
       *
       * Measured off a 5% grid rendered over the live scene on 2026-09-29:
       *   bay window        x 21-30,  y 49-65
       *   planter box       x 21.5-30.3, y 66.3-73.5
       *   CLEAR GRASS       x 19-28,  y 73.8-77.8   <- the sign stands here
       *   first stone       x 21.8+,  y 78.4+
       *   door              x 36-41,  y 52-74       <- what the arrow points at
       *
       * ⚠️ That grass band is only about 4% of the artwork tall, which is why this
       * sign has a SHORTER stake than every other one — see `.sign--enter::after` in
       * ui.css. A --space-8 stake here lifts the board up into the planter box.
       *
       * ⚠️ The board is fixed PIXELS while x/y are percentages, so it covers more of
       * the painting as the window shrinks. Where the board actually lands:
       *   1600x900  x 18.4-27.6, y 71.4-76.4 — in the grass, on the planter's rim
       *   900x562   x 15.6-30.4, y 67.4-75.5 — over most of the planter box
       * The second is the smallest window still in the wide layout and is accepted.
       * Re-screenshot BOTH if you raise the stake or the type size. */
      { id: 'enter', ...doors.enter, x: 23, y: 78, variant: 'enter' },
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

  /* The hub. One room, five tables, each of which opens an overlay PANEL rather than
   * leading to another scene — there is no third scene, ever (PRD R7/R11).
   *
   * The tables are PAINTED now, so nothing draws them. What is placed here is the
   * dessert on each table and the bubble above it, and the whole stack is a real
   * <button> that opens the panel. Their coordinates are read off the artwork. */
  interior: {
    id: 'interior',
    image: 'assets/scenes/interior.webp',
    alt: sceneAlt.interior,
    aspect: 1376 / 768,
    hasBackdrop: false,            // no landmark layer indoors

    /* Indoors the view is FIRST PERSON: you are standing in the room, not watching
     * someone stand in it. There is no character and nothing walks, so there is no
     * walkable polygon, no walk-out exit and no sign on the door — the door is just
     * the door. Leaving is a control, in the bottom-right (see engine/chrome.js).
     *
     * A departure from PRD R1/R4, which assume a walkable character in every scene.
     * It suits this room: the five tables ARE the content, and a character walking
     * between them mostly stood in front of them. */
    walkable: [],

    /* ⚠️ The interior has a sign now, and for years of commits it did not — a
     * browser check still carries a comment saying there are none in here.
     *
     * It is the resume, and it is here because the top-right corner link was
     * removed: asked for directly, *"put the resume next to the checkout coutner"*.
     * Outdoors the same board hangs under LinkedIn. Both are `signs.resume`, so
     * there is one href and it cannot drift between the two scenes.
     *
     * x/y is the COUNTER TOP just right of the painted cash register, measured off
     * the artwork (1376x768) on 2026-09-29: the counter's top runs x 22.1-29.7 and
     * its surface is at y 55. The card stands on that surface, the same way the
     * boards outdoors stand on their stake.
     *
     * ⚠️ x is 27, not the counter's centre and not 28. The board is fixed PIXELS on
     * a counter measured in percentages, so it is about 5.6% wide at 1600x900 and
     * wider on a smaller window. At 28 its right edge overhung the counter's front
     * corner and the card floated over the wainscot behind; at the counter's true
     * centre it buries the till. 27 tucks it against the register with both edges
     * still on wood. Re-screenshot at a SMALL window if the type size changes.
     *
     * `variant: 'counter'` swaps the stake for a flat base. A tapered spike driven
     * into a wooden counter reads as a mistake; see ui.css. */
    signs: [
      { id: 'resume', ...signs.resume, x: 27, y: 55, variant: 'counter' },
    ],

    /* Pressing back walks you back out. There is no character to move, so this is a
     * key binding rather than a walk: see bindBackKeys in engine/input.js. */
    back: { to: 'exterior' },

    decor: [],

    /* One trigger per painted table. x/y is the TABLE SURFACE — the dessert sits
     * there and the bubble floats above it. Read off the artwork.
     *
     * These are BUTTONS in a layer of their own, not scenery in the decor layer. The
     * decor layer is aria-hidden, and a control a screen reader cannot see is not a
     * control. The id is bare (`projects`), because the same string is the panels
     * key and the URL segment; the DOM id gets the `table-` prefix at render.
     *
     * ⚠️ These x values span 37-73, and a portrait phone only shows about x 37-63 of
     * the artwork. Three of the five fall outside that crop, so below an 8:5 aspect
     * ratio ui.css docks the buttons into a menu down the left edge — the same
     * treatment the garden signs get outdoors, for the same reason. */
    tables: tables.map((table, i) => ({
      ...table,
      /* Read off the new artwork 2026-09-14, in the table order in content.js:
       * experience, projects, photography, life, arts.
       *
       * `width` is the PAINTED TABLE'S OWN WIDTH at that spot, as a percentage of
       * the artwork, measured off the render on 2026-09-16. It is what gives the
       * room its perspective: the two back tables are 117px across and the two front
       * ones are 273px at a 1680px stage, a ratio of 2.33. Before this every table
       * button was a flat 10%, so a croissant on a far table was WIDER than the table
       * under it while the same croissant on a near table looked like a crumb.
       *
       * ⚠️ These are measurements, not a formula. A linear perspective model in y was
       * tried and does not fit — the painted tables are not all the same physical
       * size, so 54, 60 and 70 map to 117, 142 and 273 rather than to anything a
       * single vanishing point produces. Re-measure if the artwork changes; do not
       * interpolate.
       *
       * ⚠️ Life is 15.5 rather than its measured 16.25. At the true width its button
       * overlapped Projects' by a 6px sliver, and Life is later in the DOM, so that
       * sliver of the Projects button would have opened Life instead. The clamp is
       * 0.75% — invisible, since the place setting only spans about half the table
       * anyway — and it keeps the buttons provably disjoint, which a browser check
       * asserts. Do not raise it back without re-checking the overlap. */
      ...[{ x: 37, y: 54, width: 6.96 }, { x: 52, y: 60, width: 8.45 },
          { x: 67, y: 54, width: 6.90 }, { x: 40, y: 70, width: 15.5 },
          { x: 73, y: 70, width: 16.25 }][i],
    })),

    actors: [],
  },
};

export const DEFAULT_SCENE = 'exterior';

export function getScene(id) {
  return scenes[id] || null;
}
