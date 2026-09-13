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

    // Percentages of the stage, so positions hold at any viewport size.
    img.style.left = `${actor.left}%`;
    img.style.bottom = `${actor.bottom}%`;
    img.style.height = `${actor.height}%`;

    /* Direction is a horizontal flip and nothing more — there is no back-facing or
     * front-facing sprite, and there are no walk-cycle frames (PRD §8.3).
     * translateX(-50%) centres the sprite on its own x position. */
    img.style.transform = `translateX(-50%) scaleX(${actor.facing})`;
    layer.append(img);
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
    sceneImg.hidden = true;                // interior has no art yet (Phase 5)
  }

  stage.dataset.backdrop = String(scene.hasBackdrop);
  if (scene.hasBackdrop) renderBackdrop(time);

  renderActors(scene.actors);
  return scene;
}
