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

export function renderBackdrop(time) {
  const img = el('backdrop');
  const landmark = landmarkForTime(time);
  if (!landmark) throw new Error(`renderer: no landmark for time "${time}"`);
  img.src = backdropImage(landmark);
  img.alt = backdropAlt;
  return landmark;
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

/* Swaps which set of images the actor is drawn from, so she can turn to face away
 * from the camera or to the side.
 *
 * ⚠️ This only does something once those images EXIST. `jingwen` currently ships a
 * front view only, so every heading falls back to it and she does not turn. The
 * prompts for the back and side views are in assets/PROMPTS.md; drop the files in,
 * add them to `poses` in scenes.js, and this starts working with no code change. */
export function setActorPose(node, actor, heading) {
  if (!actor.poses) return;
  const pose = actor.poses[heading] || actor.poses.front;
  if (!pose || node.dataset.pose === heading) return;
  node.dataset.pose = heading;

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
  } else {
    sceneImg.hidden = true;              // interior has no art yet (Phase 5)
  }

  stage.dataset.backdrop = String(scene.hasBackdrop);
  if (scene.hasBackdrop) renderBackdrop(time);

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
