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

/* The five tables (PRD D2). Each will open an overlay panel in Phase 5; for now they
 * are scenery with labels, so the room reads correctly before the panels exist. */
export const tables = [
  { id: 'experience', label: 'Experience', dessert: 'Croissant' },
  { id: 'projects', label: 'Projects', dessert: 'Souffle' },
  { id: 'photography', label: 'Photography', dessert: 'Macarons' },
  { id: 'life', label: 'Life', dessert: 'Bolo bao' },
  { id: 'arts', label: 'Arts', dessert: 'Layer cake' },
];

/* Which dessert shape to draw on each table. The mapping is PRD D2 and it is not
 * arbitrary — a croissant is laminated, built in layers over time, for Experience;
 * a souffle is exacting and collapses if rushed, for Projects; macarons are colour
 * matched in rows like a contact sheet, for Photography. */
export const dessertShape = {
  experience: 'croissant',
  projects: 'souffle',
  photography: 'macarons',
  life: 'bao',
  arts: 'cake',
};

/* Every panel's copy (PRD R31). Keyed by the table id in `tables` above — the same
 * string is the URL segment in #/interior/projects and the DOM id of the button
 * that opens it, so one typo fails loudly instead of opening nothing.
 *
 * ⚠️ This copy is PLACEHOLDER. Phase 6 replaces it with real content. It is written
 * at realistic length on purpose: stub text one line long would hide the fact that
 * the card has to scroll.
 *
 * `kind` is 'entries' for all five. 'gallery' is reserved for Photography in Phase 6
 * and no gallery renderer exists yet — adding one later is a new branch here, not a
 * change to the shape of the data. */
export const panels = {
  experience: {
    title: 'Experience',
    kind: 'entries',
    intro: 'Where I have worked, and what I actually did there.',
    entries: [
      {
        heading: 'Placeholder role, one',
        meta: 'Organisation · City · Month Year – Present',
        bullets: [
          'Placeholder bullet describing a responsibility in about the length a real one runs to, so the panel is laid out against realistic text rather than a stub.',
          'A second placeholder bullet, because most entries have more than one and the spacing between them needs to be seen.',
        ],
        links: [],
      },
      {
        heading: 'Placeholder role, two',
        meta: 'Organisation · City · Month Year – Month Year',
        bullets: [
          'Placeholder bullet describing a second position, again at realistic length.',
        ],
        links: [],
      },
    ],
  },

  projects: {
    title: 'Projects',
    kind: 'entries',
    intro: 'Things I have designed, built, and occasionally had to rebuild.',
    entries: [
      {
        heading: 'Placeholder project, one',
        meta: 'Tools, materials, techniques · Month Year – Present',
        bullets: [
          'Placeholder bullet describing what was engineered and the constraint that made it interesting, at the length a real project bullet runs to.',
          'A second bullet covering fabrication, because these entries tend to have three.',
          'A third bullet covering control or validation, so the tallest entry in the set is represented here.',
        ],
        links: [],
      },
      {
        heading: 'Placeholder project, two',
        meta: 'Tools, materials, techniques · Month Year – Present',
        bullets: [
          'Placeholder bullet at realistic length describing design and fabrication.',
          'A second placeholder bullet describing the software side.',
        ],
        links: [],
      },
      {
        heading: 'Placeholder project, three',
        meta: 'Tools, materials, techniques · Month Year – Month Year',
        bullets: [
          'Placeholder bullet describing a team project and the role played in it.',
        ],
        links: [],
      },
      {
        heading: 'Placeholder project, four',
        meta: 'Tools · Year',
        bullets: [
          'Placeholder bullet. Four entries is what makes this the panel that proves scrolling works.',
        ],
        links: [],
      },
    ],
  },

  photography: {
    title: 'Photography',
    kind: 'entries',
    intro: 'Placeholder introduction. Phase 6 turns this panel into a real gallery.',
    entries: [
      {
        heading: 'Placeholder set',
        meta: 'Place · Year',
        bullets: [
          'Placeholder bullet. This panel stays kind: "entries" until Jingwen supplies photographs; the gallery renderer with srcset, lazy loading and a lightbox is Phase 6 work.',
        ],
        links: [],
      },
    ],
  },

  life: {
    title: 'Life',
    kind: 'entries',
    intro: 'Placeholder introduction for the things that are not work.',
    entries: [
      {
        heading: 'Placeholder heading',
        meta: 'Placeholder meta line',
        bullets: [
          'Placeholder bullet at realistic length, waiting on real content in Phase 6.',
        ],
        links: [],
      },
    ],
  },

  arts: {
    title: 'Arts',
    kind: 'entries',
    intro: 'Placeholder introduction for drawing, making, and the rest of it.',
    entries: [
      {
        heading: 'Placeholder heading',
        meta: 'Placeholder meta line',
        bullets: [
          'Placeholder bullet at realistic length, waiting on real content in Phase 6.',
        ],
        links: [],
      },
    ],
  },
};

/* The panel's own chrome. Copy, so it lives here and not in panel.js (R31). */
export const panelChrome = {
  close: 'Close',
  closeAria: 'Close this panel',
};
