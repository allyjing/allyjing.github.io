/* Repo path: src/engine/photos.js
 *
 * Turns a photograph's slug into the paths the browser needs. Shared by the grid in
 * panel.js and the full view in lightbox.js, so the two cannot disagree about where
 * a file lives.
 *
 * Nothing here touches the DOM, but it belongs in engine/ rather than data/ because
 * it is about how files are addressed, not about what the content is.
 */

import { photoWidths } from '../data/content.js';

/* ⚠️ NO LEADING SLASH. `assets/photos/...` resolves against the page; `/assets/...`
 * resolves against the domain root, which is correct for a user site and silently
 * wrong for anything served from a subpath. See CLAUDE.md, deploy rules. */
const DIR = 'assets/photos';

export function photoSrc(slug, width) {
  return `${DIR}/${slug}-${width}.webp`;
}

/* A srcset over every exported width, so the browser picks by the box it is drawing
 * into and the device's pixel ratio rather than always taking the biggest file.
 *
 * The widths are DESCRIPTORS, not promises about layout: `480w` says "this file is
 * 480 pixels across", and the `sizes` attribute is what tells the browser how wide
 * the element will be. Both are required — a srcset without sizes makes the browser
 * assume the image fills the viewport and download far more than it needs. */
export function photoSrcset(slug) {
  return photoWidths.map((w) => `${photoSrc(slug, w)} ${w}w`).join(', ');
}
