/* Repo path: src/engine/layout.js
 *
 * Works out where the scene image ACTUALLY lands on screen.
 *
 * The scene art is landscape and the stage is whatever shape the browser window is,
 * so `object-fit: cover` scales the image up and crops the overflow. That means a
 * point like "the middle of the garden path" sits at a different stage position on
 * every viewport — and the walkable polygon would drift away from the painted ground
 * if it were stored in stage coordinates.
 *
 * So the polygon and the actors are stored in IMAGE coordinates (0-100 across the
 * artwork), and this file computes the box the image occupies so they can be placed
 * inside it. Everything downstream then works in one stable coordinate space.
 */

/* Mirrors `object-fit: cover` with `object-position: center bottom` — the values set
 * on .layer--scene in scenes.css. If you change those, change this to match. */
export function coverBox(stageW, stageH, aspect) {
  let width = stageW;
  let height = stageW / aspect;

  if (height < stageH) {          // too short to fill: scale up on height instead
    height = stageH;
    width = stageH * aspect;
  }
  return {
    left: (stageW - width) / 2,   // centre horizontally
    top: stageH - height,         // bottom-aligned, so the ground is never cropped
    width,
    height,
  };
}

/* Publishes the box as CSS custom properties so stylesheets can size the props and
 * actor layers to the artwork instead of to the stage. */
export function applyCoverBox(stage, aspect) {
  const box = coverBox(stage.clientWidth, stage.clientHeight, aspect);
  stage.style.setProperty('--scene-x', `${box.left}px`);
  stage.style.setProperty('--scene-y', `${box.top}px`);
  stage.style.setProperty('--scene-w', `${box.width}px`);
  stage.style.setProperty('--scene-h', `${box.height}px`);
  return box;
}

// Screen point -> image coordinates (0-100). Used to turn a click into a destination.
export function toImageCoords(clientX, clientY, stage, aspect) {
  const rect = stage.getBoundingClientRect();
  const box = coverBox(stage.clientWidth, stage.clientHeight, aspect);
  return {
    x: ((clientX - rect.left - box.left) / box.width) * 100,
    y: ((clientY - rect.top - box.top) / box.height) * 100,
  };
}
