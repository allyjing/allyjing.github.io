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

/* The portrait in the Life menu is drawn at about 7rem and never opens in the
 * lightbox, so it gets its own, much smaller pair. Exporting it at 1600 like a
 * gallery photograph would ship 180 KB nobody ever sees. */
export const portraitWidths = [240, 480];

/* The portrait is a fixed 7rem square on a wide card and 5.5rem on a phone; it never
 * grows with the viewport, so `sizes` is a plain length rather than a vw fraction. */
export const portraitSizes = '(min-width: 30rem) 7rem, 5.5rem';

/* How wide a grid thumbnail actually ends up, as a CSS length. This is the `sizes`
 * attribute, and it is not decoration: a srcset without sizes makes the browser
 * assume the image fills the viewport and download far more than it needs.
 *
 * TWO to a row now rather than three or four, so these are wider than they were and
 * this value had to grow with them. The card is min(680px, 90vw) with --space-4 of
 * padding, so a two-up thumbnail lands at about 20rem on a wide screen and a bit
 * under half the viewport on a phone. Keep it in step with the grid in panel.css. */
export const photoSizes = '(min-width: 46rem) 20rem, 44vw';

/* The same idea for a showcase card's cover image. Same width as a photo thumbnail
 * on a wide screen — both grids are two-up — but nearly the full viewport on a
 * phone, where the cards drop to one column and the photographs do not. */
export const cardSizes = '(min-width: 46rem) 20rem, 88vw';

/* Every panel's copy (PRD R31). Keyed by the table id in `tables` above — the same
 * string is the URL segment in #/interior/projects and the DOM id of the button
 * that opens it, so one typo fails loudly instead of opening nothing.
 *
 * `kind` selects the renderer in engine/panel.js. There are three:
 *
 *   'entries'   headed articles with a meta line and bullets. Optionally grouped —
 *               see Experience, which separates work from clubs.
 *   'gallery'   photographs in SETS, each set with its own description, and a
 *               lightbox over the lot. Photography only.
 *   'showcase'  an index of cards that each open an in-depth page of their own at
 *               #/interior/projects/<slug>. Projects only.
 *
 * A panel declares one kind and carries only that kind's keys.
 *
 * ⚠️ WHOSE WORDS ARE THESE. Experience and the project bullets are Jingwen's resume.
 * The Photography set descriptions, the project About/Challenge/Result prose, and
 * both intros are her own writing, carried over verbatim from jingwen.lovable.app.
 * Per-photo captions and the short card summaries are descriptive lines written for
 * this site. The Life panel is a DRAFT and is marked as one below. Keep track of the
 * difference: replacing her prose with a paraphrase loses the thing that makes the
 * site hers.
 */

/* Work first, then the unpaid things. One panel, two groups, because they answer
 * different questions and a single flat list of six buries that — asked for
 * directly: "add experience and clubs/volunteering together". */
export const panels = {
  experience: {
    title: 'Experience',
    kind: 'entries',
    intro: 'Where I have worked, what I run, and where I volunteer.',
    groups: [
      {
        label: 'Work',
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
        ],
      },
      {
        label: 'Clubs and volunteering',
        entries: [
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
    ],
  },

  /* The showcase. `items` replaces `entries` — see `kind` above.
   *
   * `slug` is the third URL segment: #/interior/projects/arcadium. It is also the
   * DOM id of the card, so a typo fails loudly rather than opening a blank page.
   *
   * `cover` and `photos` are photo slugs, resolved the same way the gallery's are —
   * assets/photos/<slug>-<width>.webp at every width in `photoWidths`. An item with
   * no `cover` gets a drawn placeholder tile rather than a broken image, so a project
   * with nothing photographed still sits properly in the grid. */
  projects: {
    title: 'Projects',
    kind: 'showcase',
    intro: 'Six things I have designed and built. Open one to read how it went.',
    items: [
      {
        slug: 'arcadium',
        title: 'Arcadium',
        subtitle: 'Portable arcade game',
        year: '2025',
        client: 'Northeastern University',
        tools: 'Raspberry Pi Pico · Python · laser cutting · AutoCAD',
        summary: 'A laser-cut arcade light game that dispenses candy when you win.',
        cover: 'arcadium-built',
        sections: [
          {
            title: 'The problem',
            body: [
              'Problem Statement: The problem/need is that entertainment systems became way too complicated. There are currently no simple and portable systems. This is important because modern users, especially students and hobbyists, seek fun, hands-on ways to explore electronics. Currently available designs are 3Ds and phones however many are way too big or expensive. The users need a design that is simple and affordable. Our solution will integrate the Raspberry Pi Pico to sense, react, display, and engage users through light, sound, and motion and will be interactive, portable, and user-friendly, within constraints of size, cost, and available components.',
            ],
          },
          {
            title: 'What was hard',
            body: [
              'We encountered many challenges when creating this project. Some of our challenges included not having enough pico pins — as we only had one microcontroller it is physically not possible to include all three components: 16 LED lights, LCD screen, and a servo. Additionally, the candy dispenser had malfunctions with candy falling out all at once, getting stuck, and the servo disconnecting.',
            ],
          },
          {
            title: 'How it turned out',
            body: [
              'The game designed to resemble an arcade light game machine. The concept is for players to hit the displayed LED light number when the light shines on the said LED. As the rounds increase, the speed of the traveling LED lights will also increase. When players win the game (passing 5 rounds), candy will be dispensed on the side as a winning prize for the player.',
            ],
          },
        ],
        photos: [
          { slug: 'arcadium-built', width: 1200, height: 1600,
            alt: 'The finished Arcadium cabinet in laser-cut plywood, with a ring of red LEDs around a round window and two buttons on a side panel',
            caption: 'The finished cabinet. Plywood, laser cut and slotted together.' },
          { slug: 'arcadium-front', width: 1200, height: 1600,
            alt: 'The cabinet seen head on, the LED ring and breadboard visible behind its round window, with a red and a green button below',
            caption: 'Head on: the LED ring you play against, and the two buttons.' },
          { slug: 'arcadium-inside', width: 1600, height: 1200,
            alt: 'The cabinet opened up from above, showing the Raspberry Pi Pico, a breadboard and ribbon wiring behind the LED ring',
            caption: 'Opened up. One Pico, and not enough pins for everything on it.' },
          { slug: 'arcadium-wiring', width: 1600, height: 1485,
            alt: 'Hands wiring the LED ring inside the open plywood cabinet, the Pico and breadboard sitting in the base',
            caption: 'Wiring the ring by hand.' },
        ],
      },
      {
        slug: 'cadodile',
        title: 'CADodile',
        subtitle: 'STEM trivia game for a 5th-grade classroom',
        year: '2026',
        client: 'Northeastern University · Melrose Leadership Academy',
        tools: 'Raspberry Pi Zero 2 WH · Python (Kivy) · SolidWorks · laser cutting · 3D printing',
        summary: 'A multiplayer trivia machine built for a real classroom, for about $87.',
        cover: 'cadodile-dispenser',
        sections: [
          {
            title: 'What it is',
            body: [
              'Led CAD modeling for a laser-cut, hand-painted plywood dispenser enclosure and four color-coded game boards using SolidWorks, producing assembly and exploded-view documentation for a 5-person engineering team.',
              'Co-developed a multiplayer STEM trivia game for 5th-grade students at Melrose Leadership Academy, integrating a Raspberry Pi Zero 2 WH, servo-driven dispenser, 16×2 LCD, and WS2812B LED strip with a custom Kivy-based Python GUI.',
            ],
          },
          {
            title: 'What was hard',
            body: [
              'Designing a system that balanced curriculum alignment, classroom usability, and reliable mechanical operation was the primary challenge. The original dispenser cut did not account for HDMI cable clearance below the LCD, requiring iteration of the enclosure dimensions. The 180° servo constraint was discovered late in the process, forcing a back-and-forth dispensing motion rather than continuous rotation. Internal ramp guides had to be added to direct game pieces toward the exit chute and prevent jamming. Coordinating laser cutting, SolidWorks revisions, electronics assembly, and painting in parallel — without team members interfering with one another — was an additional logistical challenge.',
            ],
          },
          {
            title: 'How it turned out',
            body: [
              'The prototype was successfully demonstrated at the Milestone 6 showcase and met all core functional requirements. The Kivy application launched correctly, multiplayer gameplay was executed across six 5th-grade student groups, and the servo dispensing mechanism operated consistently without jamming. Setup time from power-on to gameplay was approximately 2–3 minutes. Students demonstrated increased engagement, collaboration, and persistence, frequently using strategies like mental math, scratch paper, and peer discussion. Total prototype cost was approximately $86.57, well within the low-cost classroom constraint. The system supported diverse learning styles and was rated safe for supervised classroom use.',
            ],
          },
        ],
        photos: [
          { slug: 'cadodile-dispenser', width: 1124, height: 1600,
            alt: 'The finished CADodile dispenser: a tall blue and green hand-painted plywood cabinet with a screen window, labelled sliding lid, LCD and dispenser chute',
            caption: 'The finished dispenser, painted by hand. Labels mark the sliding lid, the LCD and the chute.' },
          { slug: 'cadodile-boards', width: 1600, height: 1198,
            alt: 'Two of the colour-coded game boards, one blue and one purple, sitting on a workbench',
            caption: 'Two of the four colour-coded boards.' },
          { slug: 'cadodile-circuit', width: 1600, height: 968,
            alt: 'A wiring diagram of the Raspberry Pi Zero 2 W with a servo, an LED strip and a buzzer, each connection labelled with its GPIO pin',
            caption: 'The wiring, drawn out: servo, LED strip and buzzer off a Pi Zero 2 W.' },
        ],
      },
      {
        slug: 'mini-fridge',
        title: 'Thermoelectric Mini Fridge',
        subtitle: 'Peltier cooling with closed-loop control',
        year: 'Aug. 2026 – Present',
        client: 'Personal project',
        tools: 'Arduino · Fusion · Peltier TEC module · 3D printing',
        summary: 'A Peltier fridge built around its real bottleneck: getting heat off the hot side.',
        sections: [
          {
            title: 'What it is',
            body: [
              'Engineered a thermoelectric cooling system around a TEC1-12706 Peltier module (127 couples, 12 V / 5.8 A, ΔTₘₐₓ > 60 °C), pairing an oversized CPU-tower hot-side heat sink with a compact cold-side sink to manage the module’s primary thermal bottleneck.',
              'CAD-designed and fabricated an insulated plywood/acrylic enclosure with XPS foam insulation, sealing the TEC mounting plate with a foam gasket to eliminate thermal bridging and air leaks between the hot and cold sides.',
              'Built a closed-loop temperature controller using an Arduino, IRLZ44N MOSFET, and dual DS18B20 sensors, and integrated an INA219 current/voltage sensor to log real-time power draw and validate cooling performance to steady state.',
            ],
          },
        ],
        photos: [],
      },
      {
        slug: 'flywheel-shooter',
        title: 'Tennis Ball Flywheel Shooter',
        subtitle: 'Motorised launcher, speed and angle adjustable',
        year: 'Feb. 2026 – Present',
        client: 'Northeastern University',
        tools: 'Onshape · Autodesk Fusion · CNC router · 3D printing',
        summary: 'A flywheel launcher for tennis practice. Still being built.',
        sections: [
          {
            title: 'What it is',
            body: [
              'A flywheel-based tennis ball launcher designed to shoot tennis balls at adjustable speeds and angles. This project explores the mechanics of flywheel propulsion systems and applies engineering principles to create a functional, portable sports training tool.',
              'Designed and fabricated a motorized flywheel launcher in Onshape/Fusion, iterating on flywheel geometry and housing tolerances, then manufactured components with a CNC router and 3D printer. Programmed a Raspberry Pi 5 and ESP32 in Python to control motor speed, firing mechanisms, and wireless communication between components.',
            ],
          },
          {
            title: 'What is hard',
            body: [
              'Key challenges include achieving consistent ball velocity, designing a reliable feeding mechanism, and ensuring the flywheel assembly is balanced to minimize vibration and maximize energy transfer to the ball.',
            ],
          },
          {
            title: 'Where it is now',
            body: [
              'Work in progress — this project is currently under development. Updates will be shared as the build progresses.',
            ],
          },
        ],
        photos: [],
      },
      {
        slug: 'cnc-milling',
        title: 'CNC Milling',
        subtitle: 'CAM programming and machining',
        year: '2024',
        client: 'Personal project',
        tools: 'Fusion 360 CAD/CAM · Forest CNC router',
        summary: 'Programming tool paths in Fusion and cutting them on a CNC router.',
        /* ⚠️ Deliberately short. The old site's write-up for this one was
         * generated filler — "exceeded expectations in terms of surface quality" —
         * and its three photographs were stock images of an industrial 5-axis mill,
         * not her Forest router. Only what is verifiable is kept: the tools, the
         * year, and what the work was. Ask her for the real account. */
        sections: [
          {
            title: 'What it is',
            body: [
              'Programmed and machined parts in Fusion 360, working on tool paths to hold dimensional accuracy and surface finish without letting cycle time run away.',
            ],
          },
        ],
        photos: [],
      },
      {
        slug: 'peachy-sweets',
        title: 'Peachy Sweets Bakery',
        subtitle: 'This site',
        year: '2026',
        client: 'Personal project',
        tools: 'HTML · CSS · JavaScript · no framework',
        summary: 'The site you are reading, built as a small browser game.',
        sections: [
          {
            title: 'What it is',
            body: [
              'Built this site as a small browser game: a walkable exterior, a time-of-day system tied to four Los Angeles landmarks, and an interior hub. No framework and no build step.',
              'Rendered with DOM elements and CSS transforms rather than canvas, so links, focus order and screen readers keep working.',
            ],
          },
        ],
        photos: [],
        links: [
          { label: 'Source on GitHub', href: 'https://github.com/allyjing/allyjing.github.io' },
        ],
      },
    ],
  },

  /* The gallery, in SETS rather than one flat grid.
   *
   * Two photographs per row and a description above each set — asked for directly:
   * a six-up grid of thumbnails made every picture tiny and left her own writing
   * about them sitting unused on the old site.
   *
   * The set titles, the two paragraphs under "Early Morning Sunrise", and the three
   * technical notes are HER words, verbatim. The per-photo captions are descriptive
   * lines written for this site — the lightbox needs one per photograph and she has
   * not written any.
   *
   * ⚠️ The lightbox arrows walk EVERY photograph in the panel, flattened across
   * sets in reading order, not just the set that was clicked. Two separate sets of
   * arrows would be a worse thing to explain than one continuous set. */
  photography: {
    title: 'Photography',
    kind: 'gallery',
    intro: 'My interest in photography began with the desire to preserve moments that often slip by unnoticed. In a fast-paced world, photography helps me slow down and capture the details, emotions, and environments that shape meaningful experiences. Photography became my way of slowing time down.',
    sets: [
      {
        title: 'Early Morning Sunrise',
        body: [
          'These photographs were taken during the golden hour just before and during sunrise, capturing the serene beauty of the early morning landscape. The warm, amber light casts long shadows across rolling hills, revealing the natural contours of the terrain while bathing everything in a soft, ethereal glow.',
          'The sunrise over the clouds captures a rare and breathtaking moment — standing above the fog line, watching the sun break through the horizon as a sea of clouds stretches endlessly below. The contrast between the deep silhouettes of the treeline and the radiant warmth of the sky creates a powerful sense of scale and stillness.',
        ],
        notes: {
          title: 'Technical Details',
          bullets: [
            'Shot on Fujifilm XS-20 with natural lighting',
            'Golden hour timing to capture warm, directional light',
            'Minimal post-processing to preserve authentic color and atmosphere',
          ],
        },
        photos: [
          { slug: 'sunrise-over-the-clouds', width: 1066, height: 1600,
            alt: 'The sun breaking the horizon above a flat sea of cloud, with a dark treeline in silhouette below',
            caption: 'The sun breaking through, above the fog line.' },
          { slug: 'red-sky-cloud-sea', width: 1600, height: 1200,
            alt: 'A band of red and orange cloud over a valley filled level with fog, dark hills on both sides',
            caption: 'A few minutes earlier — the fog sitting level in the valley.' },
          { slug: 'above-the-fog-line', width: 1600, height: 1200,
            alt: 'Pine trees on a ridge above a bank of cloud rolling in, pale early light',
            caption: 'Cloud coming over the ridge.' },
          { slug: 'golden-hour-ridge', width: 1066, height: 1600,
            alt: 'A grass hillside in low golden light, one lone tree on the crest, long shadows across the slope',
            caption: 'Long shadows across the hills, and one tree on the crest.' },
        ],
      },
      {
        /* No description: she has not written about these two, and inventing a
         * paragraph in her voice to fill the space would be worse than the gap. */
        title: 'The Coast',
        body: [],
        photos: [
          { slug: 'rocks-and-surf', width: 1600, height: 1600,
            alt: 'Surf breaking over a low rock shelf on a sand beach, pale sky meeting the sea at the horizon',
            caption: 'Surf over the rock shelf, almost no colour left in the sky.' },
          { slug: 'sandstone-bluffs', width: 1200, height: 1600,
            alt: 'Eroded sandstone bluffs above a rocky Southern California shoreline under a bright blue sky with white cloud',
            caption: 'Sandstone bluffs on the Southern California coast.' },
        ],
      },
    ],
    outro: 'Each image holds a sense of presence — a reminder of the headspace, energy, and quiet meaning that existed in that instant. A landscape washed in light, or an ordinary moment made extraordinary: photography lets me relive the world as I experienced it.',
  },

  /* The Life panel is a MENU, laid out like the board behind the counter — asked
   * for directly: sections, items, and a note in the price column.
   *
   * ⚠️ THIS IS A DRAFT and it is the one panel on the site whose words are not
   * Jingwen's. Everything in it is sourced from somewhere verifiable — the resume,
   * her own photographs, the artwork in this repo — because the alternative is
   * inventing a personality for her, which is worse than an empty panel. She asked
   * for a draft to edit, so: EDIT IT. The items that are most worth replacing are
   * the ones under "Friends and people", which describes groups she is part of
   * rather than the people she would actually name.
   *
   * Item shape: `name` is the dish, `note` is the price column, `body` is the
   * one-line description under it. `note` is optional.
   *
   * ⚠️ Nothing here is a joke at her expense or a claim she has not made. No
   * invented favourite foods, no invented friends, no guessed hobbies. The tennis
   * ball launcher is a school project and does NOT mean she plays tennis; that is
   * exactly the kind of inference left out. */
  life: {
    title: 'Life',
    kind: 'menu',
    intro: 'Everything that is not coursework, served daily.',
    portrait: {
      slug: 'jingwen-portrait',
      width: 480,
      height: 480,
      alt: 'Jingwen Huang, smiling, in front of a wall of ferns',
      name: 'Jingwen Huang',
      role: 'Proprietor',
    },
    sections: [
      {
        title: 'Friends and people',
        items: [
          {
            name: 'Makers Club',
            note: '40+ members',
            body: 'I ran it. Most of the job was talking people into starting the thing they had been describing for three weeks.',
          },
          {
            name: 'Science Club for Girls',
            note: 'weekly, K–8',
            body: 'An after-school club where I hand tools to people who have not used them before. They ask much better questions than adults do.',
          },
          {
            name: 'The CADodile five',
            note: 'one semester',
            body: 'A five-person team, a laser cutter, and a servo that kept flinging candy everywhere. We got it working the week of the showcase.',
          },
          {
            name: 'First-years at the Makerspace',
            note: 'red vest',
            body: 'Usually the same conversation: it will not break if you use it, here is how, go on.',
          },
        ],
      },
      {
        title: 'Hobbies',
        items: [
          {
            name: 'Photography',
            note: 'Fujifilm X-S20',
            body: 'Mostly landscapes, mostly early. The good ones need you to be standing somewhere cold before the sun is up.',
          },
          {
            name: 'Getting above the fog line',
            note: 'before sunrise',
            body: 'Worth the alarm about one time in three. The other two you drive home in cloud.',
          },
          {
            name: 'Making things that are not assignments',
            note: 'ongoing',
            body: 'Laser cutter, 3D printer, CNC router, a lot of plywood. Hand-painting the enclosure is the part I like most.',
          },
          {
            name: 'Drawing and painting',
            note: 'acrylic, oil',
            body: 'Older than the engineering. It is where the architectural drawing sets came from.',
          },
          {
            name: 'This website',
            note: 'first one',
            body: 'I had not written a site before. No framework, on purpose — I wanted to know what was actually happening.',
          },
        ],
      },
      {
        title: 'Small things',
        items: [
          {
            name: 'Junnie',
            note: 'orange tabby',
            body: 'He is in the artwork twice: outside by the fountain, and again inside. Usually watching the fish.',
          },
          {
            name: 'A budget that holds',
            note: '$86.57',
            body: 'The whole CADodile prototype. I am unreasonably pleased about this.',
          },
          {
            name: 'Los Angeles and Boston',
            note: 'both',
            body: 'The clock in the corner is set to Los Angeles. That is where the landmarks in the window come from.',
          },
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

/* The showcase's chrome: the labels around a project, not the project's own words. */
export const showcaseChrome = {
  openAria: (title) => `Read about ${title}`,
  back: '\u2190  All projects',
  year: 'Year',
  client: 'For',
  tools: 'Made with',
  photos: 'Photos',
  noPhotos: 'No photos yet',
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
