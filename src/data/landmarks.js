/* Repo path: src/data/landmarks.js
 *
 * The distant LA landmark layer. One landmark per time state, so the clock and the
 * location label are two readouts of a single value (PRD R18/R19).
 *
 * Coordinates are verified against Wikipedia (PRD §11). NEVER edit these from memory —
 * recalled coordinates look plausible and are routinely wrong by hundreds of metres.
 * Negative longitude is west.
 */

export const landmarks = [
  { id: 'hollywood-sign', name: 'Hollywood Sign',       lat: 34.1341, lon: -118.3216, time: 'morning' },
  { id: 'smpier',         name: 'Santa Monica Pier',    lat: 34.0086, lon: -118.4986, time: 'noon'    },
  { id: 'laguna',         name: 'Laguna Beach',         lat: 33.5314, lon: -117.7692, time: 'sunset'  },
  { id: 'griffith',       name: 'Griffith Observatory', lat: 34.1183, lon: -118.3003, time: 'night'   },
];

/* Filenames follow `<id>-<time>` — the convention set in assets/PROMPTS.md. Because
 * time is locked to the landmark, the path is derivable and never stored by hand.
 * No leading slash: a leading slash breaks on GitHub Pages project sites (PRD §10.3). */
export function backdropImage(landmark) {
  return `assets/backdrops/${landmark.id}-${landmark.time}.jpg`;
}

export function landmarkForTime(time) {
  return landmarks.find((l) => l.time === time);
}

/* Label format, fixed by design.md: `Griffith Observatory · 34.1183° N, 118.3003° W`
 * Coordinates are stored signed and displayed with a hemisphere letter instead. */
export function formatCoordinates({ lat, lon }) {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lon).toFixed(4)}° ${ew}`;
}

export function locationLabel(landmark) {
  return `${landmark.name} · ${formatCoordinates(landmark)}`;
}
