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

/* The clock (R26). Each state shows a representative time rather than the real
 * clock, because clicking cycles the state and a real time would contradict it. */
export const timeLabels = {
  morning: { time: '8:00', meridiem: 'AM', name: 'Morning' },
  noon:    { time: '1:00', meridiem: 'PM', name: 'Noon' },
  sunset:  { time: '6:30', meridiem: 'PM', name: 'Sunset' },
  night:   { time: '10:00', meridiem: 'PM', name: 'Night' },
};

export const chrome = {
  // Both readouts advance the same single value, so they say the same thing (R18).
  cycleHint: 'Change the time of day and the view',
};
