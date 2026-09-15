/* Repo path: src/engine/panel.js
 *
 * The overlay panel a table opens. This module owns every piece of panel DOM —
 * nothing else writes into #panel.
 *
 * There is no third scene: each of the five tables opens a panel OVER the interior
 * (PRD R7/R11). The panel is not a route of its own either; main.js drives it from
 * the hash, so #/interior/projects is shareable and Back closes it.
 *
 * Focus handling lives here too: the close button takes focus on open, Tab is
 * trapped inside the card, and focus goes back to the table that opened it.
 */

import { panels, panelChrome, galleryChrome, showcaseChrome, photoSizes, cardSizes } from '../data/content.js';
import { photoSrc, photoSrcset } from './photos.js';
import { openLightbox, closeLightbox, isLightboxOpen } from './lightbox.js';

function el(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`panel: #${id} is missing from index.html`);
  return node;
}

/* Which table opened it, so focus can be handed back on close. */
let opener = null;

/* Which panel id is currently filled, so openPanel can tell "show a different
 * project inside the panel already on screen" from "open a different panel". */
let filledId = null;

/* Set by bindPanel. Opening a project is a ROUTE change, not a direct DOM call —
 * that is what makes #/interior/projects/arcadium shareable and Back step out of the
 * project rather than out of the site (R10). Held here as a callback so this module
 * still owns no knowledge of the router. */
let onOpenItem = () => {};

export function isOpen() {
  return !el('panel').hidden;
}

/* Everything inside the card that can take focus, in DOM order. Queried fresh on
 * each Tab rather than cached at open: the body is rebuilt per panel, and a stale
 * list would trap focus against elements that no longer exist. */
function focusables() {
  return Array.from(
    el('panel').querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
}

/* Tab from the last focusable wraps to the first, Shift+Tab from the first wraps to
 * the last. Without this, Tab walks out of the dialog into the page behind it. */
function trapFocus(event) {
  /* Stands down while the lightbox is over it — same rule as the Escape handler in
   * bindPanel below. The inner dialog runs its own trap, and two traps both calling
   * preventDefault on the same Tab fight each other. */
  if (event.key !== 'Tab' || !isOpen() || isLightboxOpen()) return;

  const items = focusables();
  if (!items.length) return;

  const first = items[0];
  const last = items[items.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/* Fills the card from data. Rebuilt on every open rather than cached: the panels are
 * small and a cache would be one more thing to invalidate.
 *
 * `item` is the third URL segment — the project whose own page to show. It is only
 * meaningful to the showcase; the other renderers ignore it. */
function fill(panel, item) {
  const body = el('panel-body');
  body.replaceChildren();
  body.scrollTop = 0;          // a new page starts at its top, not where the last one was

  const chosen = panel.kind === 'showcase' ? findItem(panel, item) : null;

  /* On a project's page the dialog's subject IS the project, so the panel heading
   * becomes its name. That matters beyond looks: #panel-title is the dialog's
   * aria-labelledby target, so leaving it as "Projects" told a screen-reader user
   * they were in a dialog called Projects while it displayed Arcadium. It also means
   * the project needs no heading of its own — two identical titles, one above the
   * other, was the first version. "All projects" carries the context instead. */
  el('panel-title').textContent = chosen ? chosen.title : panel.title;

  /* The panel-level intro is skipped on a project's page: printed above one project
   * it reads as a caption for it. */
  const onDetail = Boolean(chosen);
  if (panel.intro && !onDetail) {
    const intro = document.createElement('p');
    intro.className = 'panel__intro';
    intro.textContent = panel.intro;
    body.append(intro);
  }

  /* Three renderers, selected by the data rather than by the panel's id — see `kind`
   * in content.js. A panel declares one shape and carries only that shape's keys. */
  if (panel.kind === 'gallery') {
    fillGallery(body, panel);
  } else if (panel.kind === 'showcase') {
    fillShowcase(body, panel, item);
  } else {
    fillEntries(body, panel);
  }
}

/* --- shared bits ---------------------------------------------------------- */

function paragraphs(into, lines, className) {
  for (const line of lines || []) {
    const para = document.createElement('p');
    if (className) para.className = className;
    para.textContent = line;
    into.append(para);
  }
}

/* One photograph as a thumbnail button. `all` is the flat list the lightbox arrows
 * walk, and `at` is this photo's index in it — NOT its index within its own set.
 * Passing the set instead is what would make the arrows stop at a set boundary. */
function thumbnail(photo, all, at, sizes) {
  const item = document.createElement('li');
  item.className = 'gallery__item';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'gallery__open';
  button.setAttribute('aria-label', galleryChrome.openAria(photo.caption || photo.alt));

  const image = document.createElement('img');
  image.className = 'gallery__thumb';
  image.src = photoSrc(photo.slug, 480);
  image.srcset = photoSrcset(photo.slug);
  image.sizes = sizes;

  /* Intrinsic size, so the grid does not reflow as each photo lands. The CSS crops
   * these to a common shape; the attributes describe the FILE, and the browser needs
   * the file's ratio to reserve the right box. */
  image.width = photo.width;
  image.height = photo.height;

  /* The panel is closed on load, so none of these are ever in the first viewport —
   * lazy is a straight win here rather than a tradeoff. */
  image.loading = 'lazy';
  image.decoding = 'async';

  /* Empty alt, deliberately, and NOT missing: the button already carries a
   * description in its accessible name, and alt text on the image inside it would
   * make a screen reader read the same sentence twice. */
  image.alt = '';

  button.append(image);
  button.addEventListener('click', () => openLightbox(all, at, button));
  item.append(button);

  if (photo.caption) {
    const caption = document.createElement('p');
    caption.className = 'gallery__caption';
    caption.textContent = photo.caption;
    item.append(caption);
  }
  return item;
}

/* --- the gallery ---------------------------------------------------------- */

/* Photographs in SETS, two to a row, each set with its own description above it.
 *
 * The flat `all` list is built FIRST, across every set, so the lightbox arrows walk
 * the whole panel in reading order. */
function fillGallery(body, panel) {
  const all = panel.sets.flatMap((set) => set.photos);
  let at = 0;

  for (const set of panel.sets) {
    const section = document.createElement('section');
    section.className = 'photoset';

    const heading = document.createElement('h3');
    heading.className = 'photoset__title';
    heading.textContent = set.title;
    section.append(heading);

    paragraphs(section, set.body, 'photoset__body');

    const grid = document.createElement('ul');
    grid.className = 'gallery';
    for (const photo of set.photos) {
      grid.append(thumbnail(photo, all, at, photoSizes));
      at += 1;
    }
    section.append(grid);

    /* The technical notes sit BELOW the pictures they describe: they are a footnote
     * about how the set was shot, and above the grid they delayed getting to it. */
    if (set.notes) {
      const notes = document.createElement('div');
      notes.className = 'photoset__notes';

      const notesTitle = document.createElement('h4');
      notesTitle.textContent = set.notes.title;
      notes.append(notesTitle);

      const list = document.createElement('ul');
      for (const line of set.notes.bullets) {
        const bullet = document.createElement('li');
        bullet.textContent = line;
        list.append(bullet);
      }
      notes.append(list);
      section.append(notes);
    }

    body.append(section);
  }

  if (panel.outro) paragraphs(body, [panel.outro], 'gallery__note');
}

/* --- the showcase --------------------------------------------------------- */

function findItem(panel, slug) {
  if (!slug || !panel.items) return null;
  return panel.items.find((entry) => entry.slug === slug) || null;
}

/* An index of cards, or one project's page. Which one is decided by the URL, so a
 * project is shareable and Back steps out of it (R10). */
function fillShowcase(body, panel, slug) {
  const chosen = findItem(panel, slug);
  /* An unrecognised slug renders the INDEX rather than an error — a stale or
   * mistyped link should land you on the list, the same way an unknown panel id
   * lands you in a plain room. */
  if (chosen) {
    fillProject(body, chosen);
    return;
  }

  const grid = document.createElement('ul');
  grid.className = 'showcase';

  for (const entry of panel.items) {
    const cell = document.createElement('li');
    cell.className = 'showcase__cell';

    /* A real <button>, not a link: it is a route change handled in JS, and a
     * <button> gives Enter and Space for free. The href-shaped thing a visitor can
     * copy is the URL it navigates to. */
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'showcase__card';
    card.id = `project-${entry.slug}`;
    card.setAttribute('aria-label', showcaseChrome.openAria(entry.title));

    if (entry.cover) {
      const image = document.createElement('img');
      image.className = 'showcase__cover';
      image.src = photoSrc(entry.cover, 480);
      image.srcset = photoSrcset(entry.cover);
      image.sizes = cardSizes;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.alt = '';
      card.append(image);
    } else {
      /* Not every project has been photographed. A tinted tile keeps the grid even —
       * a missing image would collapse the card to the height of its text and leave
       * the row ragged.
       *
       * ⚠️ It says "No photos yet", NOT the project's initial. The first version used
       * the initial, and because two projects begin with T the grid showed two tiles
       * reading "T" — which looks like a rendering bug rather than an absence. This
       * states the actual situation. */
      const blank = document.createElement('span');
      blank.className = 'showcase__cover showcase__cover--none';
      blank.setAttribute('aria-hidden', 'true');
      blank.textContent = showcaseChrome.noPhotos;
      card.append(blank);
    }

    const text = document.createElement('span');
    text.className = 'showcase__text';

    const title = document.createElement('span');
    title.className = 'showcase__name';
    title.textContent = entry.title;
    text.append(title);

    const meta = document.createElement('span');
    meta.className = 'showcase__meta';
    meta.textContent = entry.year;
    text.append(meta);

    const summary = document.createElement('span');
    summary.className = 'showcase__summary';
    summary.textContent = entry.summary;
    text.append(summary);

    card.append(text);
    card.addEventListener('click', () => onOpenItem(entry.slug));
    cell.append(card);
    grid.append(cell);
  }

  body.append(grid);
}

/* One project, in depth. */
function fillProject(body, entry) {
  /* The way back comes FIRST, before the title: it is the control a visitor wants
   * the moment they realise they opened the wrong project, and it is what Tab
   * should reach first inside the page. */
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'showcase__back';
  back.textContent = showcaseChrome.back;
  back.addEventListener('click', () => onOpenItem(null));
  body.append(back);

  const header = document.createElement('header');
  header.className = 'project__head';

  /* No heading here — fill() has put the project's name in the panel title, which is
   * the dialog's accessible name. Repeating it would be two identical titles stacked. */
  if (entry.subtitle) {
    const sub = document.createElement('p');
    sub.className = 'project__subtitle';
    sub.textContent = entry.subtitle;
    header.append(sub);
  }

  /* A definition list, not a paragraph of slashes: these are labelled facts, and a
   * screen reader reads "Year, 2025" rather than running them together. */
  const facts = document.createElement('dl');
  facts.className = 'project__facts';
  for (const [label, value] of [[showcaseChrome.year, entry.year],
                                [showcaseChrome.client, entry.client],
                                [showcaseChrome.tools, entry.tools]]) {
    if (!value) continue;
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    facts.append(dt, dd);
  }
  header.append(facts);
  body.append(header);

  for (const section of entry.sections || []) {
    const block = document.createElement('section');
    block.className = 'project__section';

    /* h3, not h4: the panel title is the h2 and the project has no heading between
     * them, so these are the next level down. Skipping a level breaks the outline a
     * screen reader navigates by. */
    const heading = document.createElement('h3');
    heading.textContent = section.title;
    block.append(heading);

    paragraphs(block, section.body);
    body.append(block);
  }

  if (entry.photos && entry.photos.length) {
    const shots = document.createElement('section');
    shots.className = 'project__section';

    const heading = document.createElement('h3');
    heading.textContent = showcaseChrome.photos;
    shots.append(heading);

    const grid = document.createElement('ul');
    grid.className = 'gallery';
    entry.photos.forEach((photo, at) => {
      grid.append(thumbnail(photo, entry.photos, at, photoSizes));
    });
    shots.append(grid);
    body.append(shots);
  }

  if (entry.links && entry.links.length) {
    const links = document.createElement('p');
    links.className = 'entry__links';
    for (const link of entry.links) {
      const anchor = document.createElement('a');
      anchor.href = link.href;
      anchor.textContent = link.label;
      if (link.href.startsWith('http')) {
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';   // required with target=_blank
      }
      links.append(anchor);
    }
    body.append(links);
  }
}

/* --- headed entries ------------------------------------------------------- */

/* Either a flat list of entries, or GROUPS of them with a label each — Experience
 * uses groups to keep paid work and unpaid work in one panel while still telling
 * them apart. A group's label is an h3 and its entries drop to h4, so the heading
 * levels stay in order for a screen reader walking the document outline. */
function fillEntries(body, panel) {
  if (panel.groups) {
    for (const group of panel.groups) {
      const section = document.createElement('section');
      section.className = 'entrygroup';

      const label = document.createElement('h3');
      label.className = 'entrygroup__label';
      label.textContent = group.label;
      section.append(label);

      for (const entry of group.entries) section.append(article(entry, 'h4'));
      body.append(section);
    }
    return;
  }
  for (const entry of panel.entries) body.append(article(entry, 'h3'));
}

function article(entry, headingTag) {
  const node = document.createElement('article');
  node.className = 'entry';

  const heading = document.createElement(headingTag);
  heading.textContent = entry.heading;
  node.append(heading);

  if (entry.meta) {
    const meta = document.createElement('p');
    meta.className = 'entry__meta';
    meta.textContent = entry.meta;
    node.append(meta);
  }

  if (entry.bullets && entry.bullets.length) {
    const list = document.createElement('ul');
    for (const text of entry.bullets) {
      const item = document.createElement('li');
      item.textContent = text;
      list.append(item);
    }
    node.append(list);
  }

  /* links is optional: omitted and [] both mean none. */
  if (entry.links && entry.links.length) {
    const links = document.createElement('p');
    links.className = 'entry__links';
    for (const link of entry.links) {
      const anchor = document.createElement('a');
      anchor.href = link.href;
      anchor.textContent = link.label;
      if (link.href.startsWith('http')) {
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
      }
      links.append(anchor);
    }
    node.append(links);
  }
  return node;
}

/* Opens the panel for a table id, optionally showing one item inside it.
 *
 * Returns false for an unknown id. Any open panel is closed FIRST, before the id is
 * validated: if the unknown-id bail came first, hand-editing the hash from
 * #/interior/projects to #/interior/nonsense would leave the Projects panel sitting
 * over a URL that no longer names it. An unrecognised link should land you in a plain
 * room, not on someone else's panel.
 *
 * ⚠️ When the panel is ALREADY open on this same id, the body is refilled IN PLACE
 * rather than closed and reopened. Opening a project would otherwise tear the dialog
 * down and build it again, which makes a screen reader announce the whole dialog
 * afresh and bounces focus out to the table button and back on every navigation
 * between the index and a project. */
export function openPanel(id, item = null) {
  const panel = panels[id];

  const reuse = isOpen() && filledId === id;
  if (!reuse && isOpen()) closePanel();

  if (!panel) return false;

  fill(panel, item);
  filledId = id;

  if (reuse) {
    /* Focus goes to the scroll region holding the new content. #panel-body already
     * carries tabindex="0" for the keyboard scrolling requirement, so it can take
     * focus without adding another tab stop. Focusing the Back button instead would
     * be wrong on the way back OUT of a project, where no Back button exists. */
    el('panel-body').focus();
    return true;
  }

  opener = document.getElementById(`table-${id}`);
  if (opener) opener.setAttribute('aria-expanded', 'true');

  el('panel').hidden = false;

  /* The room behind must be unreachable — by Tab, by click and by screen reader.
   * `inert` covers all three; aria-hidden is set alongside so the intent survives
   * anywhere inert is not supported. */
  const stage = el('stage');
  stage.setAttribute('inert', '');
  stage.setAttribute('aria-hidden', 'true');

  /* Focus the close button rather than the card: it is the one control every panel
   * has, and it tells a screen-reader user immediately how to get out. */
  el('panel').querySelector('.panel__close').focus();

  return true;
}

export function closePanel() {
  if (!isOpen()) return;              // safe to call twice

  /* Take the inner dialog down first. A panel can close from under an open
   * lightbox — the browser's Back button on #/interior/projects does exactly that —
   * and closing only the outer one leaves a photograph floating over an empty room
   * with no visible way out. Order matters: closeLightbox() hands `inert` back to
   * the panel, which has to happen while the panel is still the thing on screen. */
  closeLightbox();

  el('panel').hidden = true;
  filledId = null;

  const stage = el('stage');
  stage.removeAttribute('inert');
  stage.removeAttribute('aria-hidden');

  if (opener) {
    opener.setAttribute('aria-expanded', 'false');
    /* Focus goes back to the table that opened the panel, so a keyboard user
     * resumes where they were instead of at the top of the document. Order
     * matters: the stage must have lost `inert` first, or this focus call is
     * silently ignored.
     *
     * `isConnected` guards against a scene change while the panel was open (e.g.
     * the hash going straight from #/interior/projects to #/exterior): the scene
     * rebuild replaces every table button with a new element, so `opener` can be
     * a detached node by the time this runs. Focusing a detached node is a silent
     * no-op, so check first rather than let that happen unnoticed. There is no
     * correct element to send focus to in that case — the table is gone — so we
     * simply do not move focus, and it rests on <body>. */
    if (opener.isConnected) opener.focus();
    opener = null;
  }
}

/* Wires the three ways to close (PRD: button, Escape, AND backdrop click) and the
 * close button's label. Called once at boot. `onClose` lets main.js turn a close
 * into a route change instead of a bare DOM update. */
export function bindPanel(onClose, onItem) {
  const node = el('panel');

  /* Navigating to a project, and back out of it, both go through the router. */
  if (onItem) onOpenItem = onItem;

  const closeButton = node.querySelector('.panel__close');
  closeButton.textContent = panelChrome.close;
  closeButton.setAttribute('aria-label', panelChrome.closeAria);

  /* Both the scrim and the close button carry data-close, so one handler covers
   * the backdrop click and the button. Clicks inside the card do not match. */
  node.addEventListener('click', (event) => {
    if (event.target.hasAttribute('data-close')) onClose();
  });

  /* Escape is listened for on the window, not the panel: focus could legitimately
   * be on the card itself, and a listener on the panel would miss key presses that
   * land elsewhere. */
  window.addEventListener('keydown', (event) => {
    /* ⚠️ The lightbox is a dialog OVER this one, and Escape belongs to the topmost
     * dialog. Without this check, one Escape inside a photograph closes both it and
     * the Photography panel underneath, dumping the visitor back into the room. The
     * lightbox closes itself on the same key; this side only has to stand down. */
    if (event.key === 'Escape' && isOpen() && !isLightboxOpen()) onClose();
  });

  window.addEventListener('keydown', trapFocus);
}
