/* Repo path: src/engine/renderer.js
 *
 * Everything that writes to the DOM for a scene. The layer elements themselves are
 * fixed and live in index.html; this file only fills them in from data.
 */

import { getScene } from '../data/scenes.js';
import { landmarkForTime, backdropImage } from '../data/landmarks.js';
import { backdropAlt } from '../data/content.js';
import { applyCoverBox } from './layout.js';

function el(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`renderer: #${id} is missing from index.html`);
  return node;
}

/* The time-of-day state is a single attribute on <body>. Every colour token in
 * tokens.css re-themes off it, so nothing here needs to know about colour. */
export function applyTimeState(time) {
  document.body.dataset.time = time;
}

/* Two stacked backdrop images, swapped by fading rather than by changing src on a
 * single element. A src swap hard-cuts, and R30 says a time change must never do
 * that. The outgoing image stays in place underneath until the incoming one has
 * faded in over it, so there is never a frame showing neither. */
let frontBackdrop = 'a';

export async function renderBackdrop(time, { immediate = false } = {}) {
  const landmark = landmarkForTime(time);
  if (!landmark) throw new Error(`renderer: no landmark for time "${time}"`);

  const showing = el(`backdrop-${frontBackdrop}`);
  const incoming = el(`backdrop-${frontBackdrop === 'a' ? 'b' : 'a'}`);
  const src = backdropImage(landmark);

  if (immediate || !showing.getAttribute('src')) {
    showing.src = src;
    showing.alt = backdropAlt;
    showing.hidden = false;
    showing.style.opacity = '1';
    return landmark;
  }
  if (showing.getAttribute('src') === src) return landmark;

  incoming.src = src;
  incoming.alt = backdropAlt;
  incoming.hidden = false;
  incoming.style.opacity = '0';

  /* Wait for the image to actually decode before fading it in. Without this the
   * fade starts against a blank element and the first part of it shows nothing. */
  try { await incoming.decode(); } catch { /* a cached or failed image: carry on */ }

  /* Read a layout property to flush the opacity:0 above into the browser's style
   * state. Without the flush, setting 0 and 1 in the same task collapses into a
   * single change and there is nothing to transition from — which hard-cuts, and
   * R30 says a time change must never do that. */
  void incoming.offsetWidth;

  incoming.style.opacity = '1';
  showing.style.opacity = '0';

  frontBackdrop = frontBackdrop === 'a' ? 'b' : 'a';
  return landmark;
}

/* The two garden signs. Real <a> elements, so they are focusable, work with the
 * keyboard, and open in a new tab honestly (R20/R21). */
function renderSigns(signs) {
  const layer = el('props');
  layer.replaceChildren();
  if (!signs) return;

  for (const sign of signs) {
    const post = document.createElement('div');
    post.className = 'sign';
    post.style.left = `${sign.x}%`;
    post.style.top = `${sign.y}%`;

    const link = document.createElement('a');
    link.className = 'sign__board';
    link.href = sign.href;
    link.textContent = sign.label;
    link.setAttribute('aria-label', sign.ariaLabel);
    if (sign.href.startsWith('http')) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';   // required with target=_blank
    }
    post.append(link);

    /* The email sign also gets a copy button, because making a recruiter retype an
     * address is the thing we are actually trying to avoid (R21). */
    if (sign.copy) {
      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'sign__copy';
      copy.textContent = sign.copy;
      copy.setAttribute('aria-label', sign.copyAriaLabel);
      copy.addEventListener('click', async () => {
        const address = sign.href.replace(/^mailto:/, '');
        try {
          await navigator.clipboard.writeText(address);
          copy.textContent = sign.copied;
          setTimeout(() => { copy.textContent = sign.copy; }, 1600);
        } catch {
          // Clipboard can be blocked; the mailto link above still works.
        }
      });
      post.append(copy);
    }

    layer.append(post);
  }
}

/* Scenery signs. No link, no button, not focusable, and the layer is aria-hidden —
 * this is painted detail, and a screen reader announcing "Please enter" as a control
 * that does nothing would be worse than silence. It becomes the real door in
 * Phase 5, and gets a proper accessible name then. */
function renderDecor(items) {
  const layer = el('decor');
  layer.replaceChildren();
  if (!items) return;

  for (const item of items) {
    const post = document.createElement('div');
    post.className = 'sign sign--decor';
    post.style.left = `${item.x}%`;
    post.style.top = `${item.y}%`;

    const board = document.createElement('div');
    board.className = 'sign__board';
    board.textContent = item.label;
    post.append(board);
    layer.append(post);
  }
}

/* Builds one actor. Jingwen is assembled from three images so her legs can swing;
 * Junnie is a single image. Both end up as a .actor box positioned the same way, so
 * nothing downstream needs to know which is which.
 *
 * Pieces are stacked legs-first so the body paints over the hip seam. */
function buildActor(actor) {
  const node = document.createElement('div');
  node.className = 'actor';
  node.id = `actor-${actor.id}`;
  node.style.height = `${actor.height}%`;
  node.style.aspectRatio = String(actor.aspect);

  /* The flip lives on an inner element, not on .actor. .actor carries the walking
   * lean, and if both sat on one transform the mirror would flip the lean too and
   * she would lean backwards half the time. */
  const flip = document.createElement('div');
  flip.className = 'actor__flip';

  if (actor.parts) {
    node.style.setProperty('--leg-top', `${actor.legTop}%`);
    node.style.setProperty('--leg-height', `${actor.legHeight}%`);
    node.style.setProperty('--body-height', `${actor.bodyHeight}%`);

    for (const [side, src] of [['left', actor.parts.legLeft], ['right', actor.parts.legRight]]) {
      const leg = document.createElement('img');
      leg.className = `actor__leg actor__leg--${side}`;
      leg.src = src;
      leg.alt = '';                    // the body image carries the alt text
      flip.append(leg);
    }
    const body = document.createElement('img');
    body.className = 'actor__body';
    body.src = actor.parts.body;
    body.alt = actor.alt;
    flip.append(body);
  } else {
    const img = document.createElement('img');
    img.className = 'actor__body';
    img.src = actor.image;
    img.alt = actor.alt;
    flip.append(img);
  }

  node.append(flip);
  return node;
}

/* Positions one actor in image coordinates. x/y are percentages of the ARTWORK, not
 * the stage — the actors layer is sized to the artwork's box by layout.js, so these
 * stay pinned to the painted ground at any window shape.
 *
 * y is where the feet are, hence translate(-50%, -100%): centred on x, sitting on y.
 *
 * `walking` drives the leg animation and a small lean into the direction of travel.
 * The lean is doing real work: the sprite is a straight-on front view and about 92%
 * symmetric, so scaleX(-1) on its own is nearly invisible. */
const LEAN_DEGREES = 3;

export function placeActor(node, position, facing, walking) {
  node.style.left = `${position.x}%`;
  node.style.top = `${position.y}%`;
  const lean = walking ? facing * LEAN_DEGREES : 0;
  node.style.transform = `translate(-50%, -100%) rotate(${lean}deg)`;
  node.dataset.walking = String(Boolean(walking));

  // Direction is a horizontal flip and nothing more (PRD §8.3).
  const flip = node.firstElementChild;
  if (flip) flip.style.transform = `scaleX(${facing})`;
}

/* Swaps which set of images the actor is drawn from, so she turns to face away from
 * the camera or to the side as she walks.
 *
 * The pose also carries its own aspect ratio, because a profile is narrower than a
 * front view and the actor box has to follow. All three are cut at the same
 * percentages, so the leg geometry does not change. */
export function setActorPose(node, actor, heading) {
  if (!actor.poses) return;
  const pose = actor.poses[heading] || actor.poses.front;
  if (!pose || node.dataset.pose === heading) return;
  node.dataset.pose = heading;

  if (pose.aspect) node.style.aspectRatio = String(pose.aspect);

  const body = node.querySelector('.actor__body');
  if (body && pose.body) body.src = pose.body;
  const left = node.querySelector('.actor__leg--left');
  if (left && pose.legLeft) left.src = pose.legLeft;
  const right = node.querySelector('.actor__leg--right');
  if (right && pose.legRight) right.src = pose.legRight;
}

function renderActors(actors) {
  const layer = el('actors');
  layer.replaceChildren();               // clear without touching innerHTML

  for (const actor of actors) {
    const node = buildActor(actor);
    placeActor(node, actor, actor.facing, false);
    layer.append(node);
  }
}

export function renderScene(sceneId, time) {
  const scene = getScene(sceneId);
  if (!scene) throw new Error(`renderer: unknown scene "${sceneId}"`);

  const stage = el('stage');
  stage.dataset.scene = scene.id;

  const sceneImg = el('scene');
  if (scene.image) {
    sceneImg.src = scene.image;
    sceneImg.alt = scene.alt;
    sceneImg.hidden = false;

    /* The mask and the image are both sized with `cover` against the same element
     * box, from sources with the same aspect ratio, so they line up exactly. */
    const mask = scene.mask ? `url(${scene.mask})` : 'none';
    sceneImg.style.maskImage = mask;
    sceneImg.style.webkitMaskImage = mask;   // Safari still wants the prefix
  } else {
    sceneImg.hidden = true;              // interior has no art yet (Phase 5)
  }

  stage.dataset.backdrop = String(scene.hasBackdrop);
  if (scene.hasBackdrop) renderBackdrop(time, { immediate: true });

  renderSigns(scene.signs);
  renderDecor(scene.decor);
  renderActors(scene.actors);
  applyCoverBox(stage, scene.aspect);
  return scene;
}

// The artwork box depends on the window, so it has to be recomputed when that changes.
export function watchResize(scene) {
  const stage = el('stage');
  const update = () => applyCoverBox(stage, scene.aspect);
  window.addEventListener('resize', update);
  update();
  return () => window.removeEventListener('resize', update);
}

export function actorElement(id) {
  return document.getElementById(`actor-${id}`);
}
