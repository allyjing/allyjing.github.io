/* Repo path: src/engine/renderer.js
 *
 * Everything that writes to the DOM for a scene. The layer elements themselves are
 * fixed and live in index.html; this file only fills them in from data.
 *
 * Phase 1 renders a static scene. No movement — that is Phase 2.
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

function renderActors(actors) {
  const layer = el('actors');
  layer.replaceChildren();                 // clear without touching innerHTML

  for (const actor of actors) {
    const img = document.createElement('img');
    img.className = 'actor';
    img.id = `actor-${actor.id}`;
    img.src = actor.image;
    img.alt = actor.alt;

    img.style.height = `${actor.height}%`;
    placeActor(img, actor, actor.facing);
    layer.append(img);
  }
}

/* Positions one actor in image coordinates. x/y are percentages of the ARTWORK, not
 * the stage — the actors layer is sized to the artwork's box by layout.js, so these
 * stay pinned to the painted ground at any window shape.
 *
 * y is where the feet are, hence translate(-50%, -100%): centred on x, sitting on y.
 * Direction is a horizontal flip and nothing more — one sprite per character, no
 * walk-cycle frames (PRD §8.3). */
export function placeActor(img, position, facing) {
  img.style.left = `${position.x}%`;
  img.style.top = `${position.y}%`;
  img.style.transform = `translate(-50%, -100%) scaleX(${facing})`;
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
    sceneImg.hidden = true;                // interior has no art yet (Phase 5)
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
