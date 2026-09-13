/* Repo path: src/engine/movement.js
 *
 * Walking. Geometry and timing only — it never touches the DOM. The caller supplies
 * an `onMove` callback and decides how a position becomes pixels.
 *
 * All coordinates are image coordinates (0-100), the space described in layout.js.
 */

/* Standard ray-casting test: count how many polygon edges a ray from the point
 * crosses. Odd means inside. */
export function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const crosses = (yi > point.y) !== (yj > point.y)
      && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function closestPointOnSegment(p, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return { x: ax, y: ay };
  // How far along the segment the perpendicular from p falls, clamped to its ends.
  let t = ((p.x - ax) * dx + (p.y - ay) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  return { x: ax + t * dx, y: ay + t * dy };
}

/* Walking into the bakery wall should slide along it, not stop dead — so an
 * out-of-bounds point is pulled to the nearest point on the boundary (R4). */
export function clampToPolygon(point, polygon) {
  if (pointInPolygon(point, polygon)) return point;

  let best = null;
  let bestDist = Infinity;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const candidate = closestPointOnSegment(point, polygon[j], polygon[i]);
    const d = (candidate.x - point.x) ** 2 + (candidate.y - point.y) ** 2;
    if (d < bestDist) { bestDist = d; best = candidate; }
  }
  return best;
}

const KEY_VECTORS = {
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
};

export function keyVector(heldKeys) {
  let x = 0;
  let y = 0;
  for (const key of heldKeys) {
    const vector = KEY_VECTORS[key];
    if (vector) { x += vector[0]; y += vector[1]; }
  }
  const length = Math.hypot(x, y);
  return length ? { x: x / length, y: y / length } : null;   // normalise diagonals
}

/* `speed` is image-units per second, so walking takes the same time regardless of
 * window size. The scene is 100 units wide, so 22 crosses it in about 4.5 seconds. */
export function createWalker({ start, polygon, speed = 22, onMove }) {
  let position = { ...start };
  let target = null;
  const held = new Set();
  let facing = 1;
  let last = null;
  let frame = null;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function commit(next) {
    const clamped = clampToPolygon(next, polygon);
    // Only flip on real horizontal movement; a tiny jitter should not spin her round.
    const dx = clamped.x - position.x;
    if (Math.abs(dx) > 0.01) facing = dx > 0 ? 1 : -1;
    position = clamped;
    onMove(position, facing);
  }

  function step(now) {
    frame = requestAnimationFrame(step);
    const dt = last === null ? 0 : Math.min((now - last) / 1000, 0.1); // cap after a tab switch
    last = now;
    if (!dt) return;

    const keyed = keyVector(held);
    if (keyed) {
      target = null;                       // a key press cancels a click destination
      commit({ x: position.x + keyed.x * speed * dt, y: position.y + keyed.y * speed * dt });
      return;
    }

    if (!target) return;
    const dx = target.x - position.x;
    const dy = target.y - position.y;
    const remaining = Math.hypot(dx, dy);
    const travel = speed * dt;

    if (remaining <= travel) { commit(target); target = null; return; }
    commit({ x: position.x + (dx / remaining) * travel, y: position.y + (dy / remaining) * travel });
  }

  return {
    get position() { return { ...position }; },
    get facing() { return facing; },

    moveTo(point) {
      const destination = clampToPolygon(point, polygon);
      // Reduced motion means no travel animation at all: arrive immediately.
      if (reducedMotion) { commit(destination); return; }
      target = destination;
    },

    holdKey(key) { held.add(key); },
    releaseKey(key) { held.delete(key); },
    releaseAllKeys() { held.clear(); },

    start() { if (frame === null) { last = null; frame = requestAnimationFrame(step); } },
    stop() { if (frame !== null) { cancelAnimationFrame(frame); frame = null; } },
  };
}
