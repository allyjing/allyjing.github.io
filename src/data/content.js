/* Repo path: src/data/content.js
 *
 * ALL copy, alt text, projects and links live here. No text is hardcoded in HTML or in
 * anything under engine/ (PRD R31). Adding a project is a one-object edit.
 *
 * Alt text counts as copy and belongs here too — every image needs a meaningful one.
 */

export const site = {
  title: 'Jingwen Bakery',
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
  junnie: 'Junnie, an orange tabby cat, sitting beside her',
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
  email: {
    label: 'Email',
    href: `mailto:${contact.email}`,
    ariaLabel: `Email Jingwen at ${contact.email}`,
    copy: 'Copy',
    copyAriaLabel: 'Copy email address to clipboard',
    copied: 'Copied',
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
