/* Repo path: src/engine/lightbox.js
 *
 * The full-frame view of one photograph, opened from the Photography grid. This
 * module owns every piece of #lightbox DOM — nothing else writes into it.
 *
 * It sits OVER an already-open panel, which is the whole reason it is a separate
 * module rather than a branch inside panel.js. Two nested dialogs need two
 * independent answers to "what does Escape do" and "where can Tab go", and the
 * panel's own answers are written against its own subtree.
 *
 * The rule between them: while this is open, the panel must behave as though the
 * visitor is not in it. `isLightboxOpen` is exported for panel.js to ask that
 * question, and panel.js checks it before acting on Escape.
 */

import { galleryChrome } from '../data/content.js';
import { photoSrc } from './photos.js';

function el(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`lightbox: #${id} is missing from index.html`);
  return node;
}

/* The set currently on show and where we are in it. `photos` is the same array the
 * grid was built from, so the order a visitor arrows through matches the order they
 * just looked at. */
let photos = [];
let index = 0;

/* The thumbnail button that opened it, so focus can be handed back on close — the
 * same contract panel.js has with the table that opened it. */
let opener = null;

export function isLightboxOpen() {
  return !el('lightbox').hidden;
}

/* Draws photo `index`. Called on open and on every arrow, so it must be safe to run
 * repeatedly — everything here is an assignment, nothing is appended. */
function show() {
  const photo = photos[index];

  const image = el('lightbox-image');

  /* Intrinsic size goes on BEFORE the src. The browser reserves the box from these
   * two attributes plus the CSS aspect ratio, so swapping between a portrait and a
   * landscape photo does not make the frame jump while the new file downloads. */
  image.width = photo.width;
  image.height = photo.height;
  image.src = photoSrc(photo.slug, 1600);
  image.alt = photo.alt;

  el('lightbox-caption').textContent = photo.caption;
  el('lightbox-count').textContent = galleryChrome.count(index + 1, photos.length);

  /* The set wraps, so neither arrow is ever disabled — a control that disables
   * itself at the end of a list moves the focus ring somewhere unexpected. */
}

function step(by) {
  if (photos.length < 2) return;
  index = (index + by + photos.length) % photos.length;
  show();
}

/* Everything focusable inside the frame, in DOM order. Queried fresh per Tab for the
 * same reason panel.js does it: cached lists go stale. */
function focusables() {
  return Array.from(
    el('lightbox').querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')
  );
}

function trapFocus(event) {
  if (event.key !== 'Tab' || !isLightboxOpen()) return;

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

export function openLightbox(set, at, from) {
  photos = set;
  index = at;
  opener = from || null;

  show();
  el('lightbox').hidden = false;

  /* The panel behind becomes unreachable, exactly as the stage does behind the panel.
   * Without this, Tab walks out of the photograph and down the list of thumbnails
   * still sitting underneath it. */
  const panel = document.getElementById('panel');
  if (panel && !panel.hidden) {
    panel.setAttribute('inert', '');
    panel.setAttribute('aria-hidden', 'true');
  }

  el('lightbox-close').focus();
}

export function closeLightbox() {
  if (!isLightboxOpen()) return;          // safe to call twice

  el('lightbox').hidden = true;

  const panel = document.getElementById('panel');
  if (panel) {
    panel.removeAttribute('inert');
    panel.removeAttribute('aria-hidden');
  }

  /* Drop the src so a large photo is not held in memory behind a hidden dialog, and
   * so reopening always shows a freshly set image rather than the previous one for a
   * frame. Setting it empty rather than removing the attribute avoids a spurious
   * request for the page URL, which an empty `src` attribute would trigger. */
  const image = el('lightbox-image');
  image.removeAttribute('src');
  image.alt = '';

  /* Order matters: the panel must have lost `inert` before this focus call, or it is
   * silently ignored. Same trap as closePanel. */
  if (opener && opener.isConnected) opener.focus();
  opener = null;
}

/* Wires the ways out and the ways through. Called once at boot, before any panel
 * exists — it only touches the lightbox's own static markup. */
export function bindLightbox() {
  const node = el('lightbox');

  const close = el('lightbox-close');
  close.textContent = galleryChrome.close;
  close.setAttribute('aria-label', galleryChrome.closeAria);

  const prev = el('lightbox-prev');
  prev.textContent = galleryChrome.prev;
  prev.setAttribute('aria-label', galleryChrome.prevAria);
  prev.addEventListener('click', () => step(-1));

  const next = el('lightbox-next');
  next.textContent = galleryChrome.next;
  next.setAttribute('aria-label', galleryChrome.nextAria);
  next.addEventListener('click', () => step(1));

  /* The scrim and the close button both carry data-lightbox-close, so one handler
   * covers the backdrop click and the button. Clicks on the photo itself do not
   * match, so a visitor can select the caption text without it closing. */
  node.addEventListener('click', (event) => {
    if (event.target.hasAttribute('data-lightbox-close')) closeLightbox();
  });

  /* On the window rather than on the lightbox, because focus can legitimately be on
   * the frame itself. This listener is registered BEFORE panel.js's Escape handler
   * would act, but that is not what keeps them apart — panel.js asks
   * isLightboxOpen() and stands down. Do not rely on listener order here. */
  window.addEventListener('keydown', (event) => {
    if (!isLightboxOpen()) return;

    if (event.key === 'Escape') {
      closeLightbox();
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      step(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      step(1);
    }
  });

  window.addEventListener('keydown', trapFocus);
}
