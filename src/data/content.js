/* Repo path: src/data/content.js
 *
 * ALL copy, alt text, projects and links live here. No text is hardcoded in HTML or in
 * anything under engine/ (PRD R31). Adding a project is a one-object edit.
 *
 * Alt text counts as copy and belongs here too — every image needs a meaningful one.
 */

/* The name comes from the painted sign above the door. The PRD and this repo still
 * call the project "Jingwen Bakery"; the shop in the artwork is Peachy Sweets, and
 * the shop wins — a visitor reads the sign, not the spec. */
export const site = {
  name: 'Jingwen Huang',
  title: 'Peachy Sweets Bakery',
  tagline: 'A small bakery, and everything I have been working on.',
};

export const contact = {
  // Verbatim, do not paraphrase. The brief supplied `northeatern.edu`, a typo.
  // ⚠️ Jingwen must confirm this address works before launch (PRD R22).
  email: 'huang.jingwen@northeastern.edu',
  linkedin: 'https://www.linkedin.com/in/allyjing/',
};

export const actorAlt = {
  jingwen: 'Jingwen, standing outside the bakery',
  junnie: 'Junnie, an orange tabby cat, sitting at the fountain trying to catch a fish',
};

export const sceneAlt = {
  exterior: 'A small pastel bakery with a garden and a stone fountain',
  interior: 'Inside the bakery, five tables each holding a dessert',
};

/* Backdrops are decorative: the location label already states the place in text, so
 * announcing it twice is noise for a screen reader. Empty alt is deliberate, not missing. */
export const backdropAlt = '';

/* The two garden signs (R20, R21). The email one is a plain mailto plus a copy
 * button — deliberately NOT obfuscated with JavaScript, which breaks it for screen
 * readers. Spam scraping is an accepted tradeoff; making a recruiter retype an
 * address is worse. */
export const signs = {
  linkedin: {
    label: 'LinkedIn',
    href: contact.linkedin,
    ariaLabel: 'Jingwen on LinkedIn, opens in a new tab',
  },
  /* One button that copies, rather than a mailto link with a Copy button beside it.
   *
   * ⚠️ This is a deliberate departure from PRD R21, which specifies both. Asked for
   * directly. The cost is that a recruiter can no longer click to open their mail
   * client — they get the address on the clipboard and have to paste it. The address
   * is still in the accessible name, so it is readable rather than hidden, which is
   * the part R21 actually cares about. */
  email: {
    label: 'Email',
    copyText: contact.email,
    ariaLabel: `Copy Jingwen's email address, ${contact.email}`,
    copied: 'Copied!',
  },
};

/* The recruiter escape hatch (R23). Visible in the first viewport of every scene,
 * above every game layer, always. */
export const resume = {
  label: 'Resume',
  href: 'resume.html',
  ariaLabel: "Jingwen's resume, a plain text page",
};

/* The clock (R26) shows TWO things: the visitor's real wall-clock time, which keeps
 * ticking, and the name of the scene they are currently looking at. On arrival those
 * agree, because the scene is derived from their clock (R27). After they click to
 * cycle, the time stays true and the name tells them which view they have chosen. */
export const timeNames = {
  morning: 'Morning',
  noon: 'Noon',
  sunset: 'Sunset',
  night: 'Night',
};

export const chrome = {
  // Both readouts advance the same single value, so they say the same thing (R18).
  cycleHint: 'Change the time of day and the view',
};

/* The bakery door, and the way back out (R9). */
export const doors = {
  enter: { label: 'Please enter', href: '#/interior', ariaLabel: 'Go inside the bakery' },
  exit: { label: 'Back outside', href: '#/exterior', ariaLabel: 'Go back outside' },
};

/* The five tables (PRD D2). Each is a button that opens the overlay panel of the
 * same id in `panels` below — `projects` here pairs with `panels.projects`, and
 * with the route #/interior/projects. */
export const tables = [
  { id: 'experience', label: 'Experience', dessert: 'Croissant' },
  { id: 'projects', label: 'Projects', dessert: 'Souffle' },
  { id: 'photography', label: 'Photography', dessert: 'Macarons' },
  { id: 'life', label: 'Life', dessert: 'Bolo bao' },
  { id: 'arts', label: 'Arts', dessert: 'Layer cake' },
];

/* Which sprite sits on each table. The mapping is PRD D2 and it is not arbitrary —
 * a croissant is laminated, built in layers over time, for Experience; a souffle is
 * exacting and collapses if rushed, for Projects; macarons are colour matched in
 * rows like a contact sheet, for Photography.
 *
 * These are IMAGES now, not CSS shapes. The previous version drew each dessert from
 * two pseudo-elements, which could manage a silhouette but not lamination on a
 * croissant or a crackled crust on a bao — and those are the marks that say which
 * dessert it is. Drawn by assets/source/draw-desserts.py; see the note there about
 * the palette having to be kept in step with tokens.css by hand. */
export const dessertSprite = {
  experience:  'dessert-croissant',
  projects:    'dessert-souffle',
  photography: 'dessert-macarons',
  life:        'dessert-bao',
  arts:        'dessert-cake',
};

/* A drink beside the dessert on SOME tables, not all. Three of five, deliberately:
 * a drink on every table makes five identical place settings and the eye stops
 * reading them as separate tables, which is the one thing the room has to do.
 *
 * The pairings are the ones a bakery would actually serve — coffee with the
 * croissant, milk tea with the bolo bao (the Hong Kong cafe pairing the bun comes
 * from), matcha with the cake. Projects and Photography get none; a souffle and a
 * plate of macarons are each busy enough on their own.
 *
 * An id missing from here means no drink. Do not add an entry with a falsy value. */
export const tableDrink = {
  experience: 'drink-coffee',
  life:       'drink-milk-tea',
  arts:       'drink-matcha',
};

/* The widths every photograph is exported at, smallest first. engine/panel.js turns
 * a photo's `slug` plus this list into a `srcset`, so the browser picks the file that
 * fits the box it is actually drawn into rather than always taking the largest.
 *
 * 480 is the grid thumbnail, 960 covers a thumbnail on a 2x screen, 1600 is what the
 * lightbox opens. Changing this list means re-exporting every photo — the files are
 * `assets/photos/<slug>-<width>.webp` and a missing one is a 404, not a fallback. */
export const photoWidths = [480, 960, 1600];

/* What the lightbox is drawn into, as a CSS length. Used for the `sizes` attribute
 * on the grid images: they are laid out at roughly a third of the panel card, and
 * telling the browser that is what stops it downloading the 1600 for a 150px box. */
export const photoSizes = '(min-width: 40rem) 14rem, 45vw';

/* Every panel's copy (PRD R31). Keyed by the table id in `tables` above — the same
 * string is the URL segment in #/interior/projects and the DOM id of the button
 * that opens it, so one typo fails loudly instead of opening nothing.
 *
 * Phase 6: this is REAL content now, not placeholder. Experience and Projects are
 * Jingwen's resume; Photography is her own photographs and her own words about
 * them, both carried over from jingwen.lovable.app.
 *
 * `kind` selects the renderer in engine/panel.js:
 *   'entries' — headed articles with a meta line and bullets. Four of the five.
 *   'gallery' — a grid of photographs with a lightbox. Photography only.
 * A panel declares one or the other; the renderer reads `entries` or `photos`
 * accordingly and never both.
 */
export const panels = {
  experience: {
    title: 'Experience',
    kind: 'entries',
    intro: 'Where I have worked, and what I actually did there.',
    entries: [
      {
        heading: 'Student Helper — Red Vest',
        meta: 'Northeastern College of Engineering, Makerspace · Boston, MA · Jun. 2026 – Present',
        bullets: [
          'Mentored first-year engineering students on course projects and guided Makerspace users on fabrication equipment, including 3D printers, hand tools, and prototyping materials.',
        ],
      },
      {
        heading: 'Ambassador — Northeastern Oakland',
        meta: 'Northeastern College of Science · Oakland, CA · Jan. 2026 – Apr. 2026',
        bullets: [
          'Proctored missed assessments and evaluated student benefit programs, including tutoring services, to strengthen academic support across the College of Science.',
        ],
      },
      {
        heading: 'STEM Mentor — Science Club for Girls',
        meta: 'Amigos School · Cambridge, MA · Sep. 2026 – Present',
        bullets: [
          'Leads weekly hands-on STEM explorations for K–8 girls in a free after-school club, guiding activities spanning engineering, physics, chemistry, and environmental science across an 8-week semester.',
          'Serves as a near-peer role model alongside Junior Mentors and staff, building STEM confidence and literacy for students from communities underrepresented in science.',
        ],
      },
      {
        heading: 'President — Makers Club',
        meta: 'Northeastern University · Sep. 2025 – Apr. 2026',
        bullets: [
          'Managed a club of 40+ members, facilitating project ideation sessions and guiding teams from concept development through final fabrication.',
          'Mentored members on safe operation of 3D printers, laser cutters, and CNC machines, providing access to materials and workshop space.',
        ],
      },
    ],
  },

  projects: {
    title: 'Projects',
    kind: 'entries',
    intro: 'Things I have designed, built, and occasionally had to rebuild.',
    entries: [
      {
        heading: 'Thermoelectric Mini Fridge',
        meta: 'Arduino, Fusion, Peltier TEC module, 3D printing · Aug. 2026 – Present',
        bullets: [
          'Engineered a thermoelectric cooling system around a TEC1-12706 Peltier module (127 couples, 12 V / 5.8 A, ΔTₘₐₓ > 60 °C), pairing an oversized CPU-tower hot-side heat sink with a compact cold-side sink to manage the module’s primary thermal bottleneck.',
          'CAD-designed and fabricated an insulated plywood/acrylic enclosure with XPS foam insulation, sealing the TEC mounting plate with a foam gasket to eliminate thermal bridging and air leaks between the hot and cold sides.',
          'Built a closed-loop temperature controller using an Arduino, IRLZ44N MOSFET, and dual DS18B20 sensors, and integrated an INA219 current/voltage sensor to log real-time power draw and validate cooling performance to steady state.',
        ],
      },
      {
        heading: 'Tennis Ball Flywheel Shooter',
        meta: 'Onshape, Autodesk Fusion, CNC router, 3D printing · Feb. 2026 – Present',
        bullets: [
          'Designed and fabricated a motorized flywheel launcher in Onshape/Fusion, iterating on flywheel geometry and housing tolerances, then manufactured components with a CNC router and 3D printer.',
          'Programmed a Raspberry Pi 5 and ESP32 in Python to control motor speed, firing mechanisms, and wireless communication between components.',
        ],
      },
      {
        heading: 'CADodile',
        meta: 'Autodesk Fusion, laser cutting, 3D printing · Jan. 2026 – May 2026',
        bullets: [
          'Led CAD modeling for a laser-cut, hand-painted plywood dispenser enclosure and four color-coded game boards using SolidWorks, producing assembly and exploded-view documentation for a 5-person engineering team.',
          'Co-developed a multiplayer STEM trivia game for 5th-grade students at Melrose Leadership Academy, integrating a Raspberry Pi Zero 2 WH, servo-driven dispenser, 16×2 LCD, and WS2812B LED strip with a custom Kivy-based Python GUI.',
        ],
      },
      {
        heading: 'Arcadium — Portable Arcade Game',
        meta: 'Northeastern University · Raspberry Pi Pico, Python, laser cutting, AutoCAD · 2025',
        bullets: [
          'Built a portable arcade light game on a Raspberry Pi Pico: players hit the lit LED as it moves, and a servo-driven dispenser pays out candy for a win.',
          'The Pico does not have enough pins for 16 LEDs, an LCD and a servo at once, so the wiring had to be reworked around that limit rather than around the schematic.',
          'The dispenser was the hard part — candy fell out all at once, jammed, and pulled the servo loose, which took several passes on the chute geometry to fix.',
        ],
      },
      {
        heading: 'CNC Milling',
        meta: 'Fusion 360 CAD/CAM, Forest CNC router · 2024',
        bullets: [
          'Programmed and machined parts in Fusion 360, working on tool paths to hold dimensional accuracy and surface finish without letting cycle time run away.',
        ],
      },
      {
        heading: 'Peachy Sweets Bakery',
        meta: 'HTML, CSS, JavaScript · 2026',
        bullets: [
          'Built this site as a small browser game: a walkable exterior, a time-of-day system tied to four Los Angeles landmarks, and an interior hub. No framework and no build step.',
          'Rendered with DOM elements and CSS transforms rather than canvas, so links, focus order and screen readers keep working.',
        ],
        links: [
          { label: 'Source on GitHub', href: 'https://github.com/allyjing/allyjing.github.io' },
        ],
      },
    ],
  },

  /* The gallery. `photos` replaces `entries` here — see `kind` above.
   *
   * `slug` is a FILENAME STEM, not a path: engine/panel.js builds
   * `assets/photos/<slug>-<width>.webp` from it and the three widths below. Every
   * photo exists at all three, so adding one means exporting all three.
   *
   * `width`/`height` are the intrinsic pixels of the 1600 version, and they are not
   * optional: without them the browser cannot reserve the right box before the image
   * arrives, and a six-photo grid reflows as each one lands. */
  photography: {
    title: 'Photography',
    kind: 'gallery',
    intro: 'My interest in photography began with the desire to preserve moments that often slip by unnoticed. In a fast-paced world, photography helps me slow down and capture the details, emotions, and environments that shape meaningful experiences. Photography became my way of slowing time down.',
    outro: 'Each image holds a sense of presence — a reminder of the headspace, energy, and quiet meaning that existed in that instant. A landscape washed in light, or an ordinary moment made extraordinary: photography lets me relive the world as I experienced it.',
    gear: 'Shot on a Fujifilm X-S20 and on iPhone, in natural light, with minimal processing so the colour stays the colour that was there.',
    photos: [
      {
        slug: 'sunrise-over-the-clouds',
        width: 1066, height: 1600,
        alt: 'The sun breaking the horizon above a flat sea of cloud, with a dark treeline in silhouette below',
        caption: 'Above the fog line at sunrise. Standing over the clouds rather than under them.',
      },
      {
        slug: 'red-sky-cloud-sea',
        width: 1600, height: 1200,
        alt: 'A band of red and orange cloud over a valley filled level with fog, dark hills on both sides',
        caption: 'The same morning, a few minutes earlier — the fog sitting level in the valley like water.',
      },
      {
        slug: 'above-the-fog-line',
        width: 1600, height: 1200,
        alt: 'Pine trees on a ridge above a bank of cloud rolling in, pale early light',
        caption: 'Cloud coming over the ridge. You can watch the fog line move from up here.',
      },
      {
        slug: 'golden-hour-ridge',
        width: 1066, height: 1600,
        alt: 'A grass hillside in low golden light, one lone tree on the crest, long shadows across the slope',
        caption: 'First light on the hills. Low sun is what makes the shape of the ground readable.',
      },
      {
        slug: 'rocks-and-surf',
        width: 1600, height: 1600,
        alt: 'Surf breaking over a low rock shelf on a sand beach, pale sky meeting the sea at the horizon',
        caption: 'Surf over the rock shelf, late in the day and almost no colour left in the sky.',
      },
      {
        slug: 'sandstone-bluffs',
        width: 1200, height: 1600,
        alt: 'Eroded sandstone bluffs above a rocky Southern California shoreline under a bright blue sky with white cloud',
        caption: 'Sandstone bluffs on the Southern California coast, in the middle of a very bright day.',
      },
    ],
  },

  /* ⚠️ DRAFT. Written by Claude from things that are verifiable elsewhere in this
   * repo and on the resume — not from anything Jingwen has said about herself. It is
   * here so the panel is not a placeholder, and it is the one panel on the site whose
   * words are not hers. Replace it. */
  life: {
    title: 'Life',
    kind: 'entries',
    intro: 'The parts that are not coursework.',
    entries: [
      {
        heading: 'Mechanical engineering, by way of everything else',
        meta: 'Northeastern University · Los Angeles and Boston',
        bullets: [
          'I study mechanical engineering, and the things I am drawn to sit where automation, structural design and visual work overlap — how something works and how it looks are the same question asked twice.',
        ],
      },
      {
        heading: 'Teaching it to someone smaller',
        meta: 'Science Club for Girls · Makers Club',
        bullets: [
          'A lot of my week is spent handing tools to people who have not used them before — K–8 students in an after-school club, and club members meeting a laser cutter for the first time. Explaining a machine is the fastest way to find out whether you actually understand it.',
        ],
      },
      {
        heading: 'Junnie',
        meta: 'Orange tabby · full-time supervisor',
        bullets: [
          'He is in the artwork, outside by the fountain and again inside the shop. He is usually watching the fish.',
        ],
      },
      {
        heading: 'This bakery',
        meta: 'First web project · 2026',
        bullets: [
          'I had not written a website before this one. It is built without a framework on purpose — I wanted to understand what was actually happening rather than what a library was doing for me.',
        ],
      },
    ],
  },

  /* ⚠️ The architectural design entry is real — Jingwen's Citrus College coursework,
   * and the description is her own account of how she laid the sheet out.
   *
   * There is deliberately NO artwork in this panel yet. The old site's Arts and
   * Architecture sections were illustrated with stock and AI-generated placeholder
   * images (a head made of stones, a hand drawing over a render, two "paintings"
   * that are neither hers nor paintings), and the surrounding copy was written to
   * match those images rather than her work. None of it is carried over. This panel
   * stays text-only until Jingwen supplies photographs of the real pieces. */
  arts: {
    title: 'Arts',
    kind: 'entries',
    intro: 'Drawing, modelling, and design work that is not an engineering deliverable.',
    entries: [
      {
        heading: 'Architectural Design',
        meta: 'Citrus College · 3D modelling, AutoCAD · 2024',
        bullets: [
          'A full drawing set, laid out so it reads in the order you need it: the site plan on top to establish the context, the floor plans below it for the internal layout and how the spaces are used, sections above those to show the vertical relationships and the interiors, and the elevations near the bottom for the external views that tie the whole thing together.',
          'Deciding the order of the sheet turned out to be most of the work — the drawings are only as good as the sequence someone reads them in.',
        ],
      },
      {
        heading: 'Paintings and model photography',
        meta: 'Acrylic, oil, mixed media',
        bullets: [
          'Not shown here yet. The pieces exist but there are no photographs of them in this repo, and the images on my old site were placeholders rather than the real work.',
        ],
      },
    ],
  },
};

/* The panel's own chrome. Copy, so it lives here and not in panel.js (R31). */
export const panelChrome = {
  close: 'Close',
  closeAria: 'Close this panel',
};

/* The lightbox's own chrome. Copy, so it lives here and not in lightbox.js (R31).
 *
 * `count` is a template rather than a built string because the numbers are only known
 * at runtime; engine/lightbox.js substitutes them. Keeping the word "of" here means a
 * translation would not have to be made in the engine. */
export const galleryChrome = {
  close: 'Close',
  closeAria: 'Close this photograph',
  prev: '←',
  prevAria: 'Previous photograph',
  next: '→',
  nextAria: 'Next photograph',
  count: (index, total) => `${index} of ${total}`,
  openAria: (caption) => `Open larger: ${caption}`,
  hint: 'Select a photograph to see it larger.',
};
