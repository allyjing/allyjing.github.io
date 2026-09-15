/* Repo path: src/engine/panel.js
 *
 * The overlay panel a table opens. This module owns every piece of panel DOM —
 * nothing else writes into #panel.
 *
 * There is no third scene: each of the five tables opens a panel OVER the interior
 * (PRD R7/R11). The panel is not a route of its own either; main.js drives it from
 * the hash, so #/interior/projects is shareable and Back closes it.
 *
 * Focus handling lives in this file too, added in the next task.
 */

import { panels, panelChrome } from '../data/content.js';

function el(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`panel: #${id} is missing from index.html`);
  return node;
}

/* Which table opened it, so focus can be handed back on close. */
let opener = null;

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
  if (event.key !== 'Tab' || !isOpen()) return;

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

/* Fills the card from data. Rebuilt on every open rather than cached: five small
 * panels are cheap to build, and a cache would be one more thing to invalidate. */
function fill(panel) {
  el('panel-title').textContent = panel.title;

  const body = el('panel-body');
  body.replaceChildren();

  if (panel.intro) {
    const intro = document.createElement('p');
    intro.className = 'panel__intro';
    intro.textContent = panel.intro;
    body.append(intro);
  }

  for (const entry of panel.entries) {
    const article = document.createElement('article');
    article.className = 'entry';

    const heading = document.createElement('h3');
    heading.textContent = entry.heading;
    article.append(heading);

    if (entry.meta) {
      const meta = document.createElement('p');
      meta.className = 'entry__meta';
      meta.textContent = entry.meta;
      article.append(meta);
    }

    if (entry.bullets && entry.bullets.length) {
      const list = document.createElement('ul');
      for (const text of entry.bullets) {
        const item = document.createElement('li');
        item.textContent = text;
        list.append(item);
      }
      article.append(list);
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
          anchor.rel = 'noopener noreferrer';   // required with target=_blank
        }
        links.append(anchor);
      }
      article.append(links);
    }

    body.append(article);
  }
}

/* Opens the panel for a table id. Returns false for an unknown id and does nothing
 * else — a typo in a shared link must not produce a broken page. */
export function openPanel(id) {
  const panel = panels[id];
  if (!panel) return false;
  if (isOpen()) closePanel();

  fill(panel);

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

  el('panel').hidden = true;

  const stage = el('stage');
  stage.removeAttribute('inert');
  stage.removeAttribute('aria-hidden');

  if (opener) {
    opener.setAttribute('aria-expanded', 'false');
    /* Focus goes back to the table that opened the panel, so a keyboard user
     * resumes where they were instead of at the top of the document. Order
     * matters: the stage must have lost `inert` first, or this focus call is
     * silently ignored. */
    opener.focus();
    opener = null;
  }
}

/* Wires the three ways to close (PRD: button, Escape, AND backdrop click) and the
 * close button's label. Called once at boot. `onClose` lets main.js turn a close
 * into a route change instead of a bare DOM update. */
export function bindPanel(onClose) {
  const node = el('panel');

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
    if (event.key === 'Escape' && isOpen()) onClose();
  });

  window.addEventListener('keydown', trapFocus);
}
