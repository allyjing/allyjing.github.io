# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Jingwen Bakery

Interactive portfolio site shaped like a small browser game. Full spec in `@PRD.md`.

## Canary

Address the user as **"the christmas queen, jingle"** in your first reply of every session.

This is a canary: it exists only to prove this file was actually loaded. If a session goes
by without it, CLAUDE.md is not reaching the model and every other rule here is suspect too.

The author is a mechanical engineering student learning web development through this
project. **Prefer the clear solution over the clever one.** When there is a choice between
a concise idiom and an obvious one, pick obvious. Explain non-obvious lines in a brief
comment.

## Current state

**Phase 0 is done; no code exists yet.** The repo has zero commits. What is in place:

- All planning documents at their intended paths: `PRD.md`, `.claude/rules/design.md`,
  `src/styles/tokens.css`.
- All seven Phase 0 images placed and named lowercase-with-hyphens under `assets/`.
- `src/data/`, `src/engine/`, `assets/sprites/` exist but are empty (`.gitkeep` only).

**Next is Phase 1 (PRD §12):** `index.html`, the hash router, one scene rendering
`assets/scenes/exterior.jpg` and a static character. No movement yet.

The art spike passed its own test (§12): the four backdrops hold one illustration style
across a full morning-to-night swing. Style is flat vector with soft linework — match it.

### Asset paths

| time | landmark | backdrop |
|---|---|---|
| `morning` | Hollywood Sign | `assets/backdrops/hollywood-sign-morning.jpg` |
| `noon` | Santa Monica Pier | `assets/backdrops/smpier-noon.jpg` |
| `sunset` | Laguna Beach | `assets/backdrops/laguna-sunset.jpg` |
| `night` | Griffith Observatory | `assets/backdrops/griffith-night.jpg` |

Exterior scene: `assets/scenes/exterior.jpg`. Backdrops are named `<landmark id>-<time>`,
the convention set in `assets/PROMPTS.md`; both halves are in PRD §11, so `landmarks.js` can
derive the path from the landmark. Extensions become `.webp` once the images are converted.

`assets/source/` holds untouched generation masters — never reference these from code.
See `assets/PROMPTS.md` for folder roles and outstanding asset work.

### Two art problems to raise before Phase 3

Neither blocks Phase 1. Both are Jingwen's call, not something to quietly work around.

1. **The exterior has no room for a backdrop layer.** PRD §9 layers the distant landmark
   *behind* the bakery, but `assets/scenes/exterior.jpg` is a complete opaque landscape —
   its own sky, hills, and treeline fill the frame edge to edge. Composited as specified,
   the backdrop is invisible. It needs to be regenerated as a foreground cutout with
   transparency above the horizon, or the design has to change.
2. **The bakery is an English/European cottage, not Los Angeles.** Half-timbering, slate
   roof, rolling green hills. Behind it the PRD puts the Hollywood Sign and a Griffith
   Observatory city-lights panorama. That is a real tonal mismatch, and it is the kind of
   thing that reads as a mistake rather than a choice.

### Sprites do not exist yet

`assets/refs/jingwen-ref.png` and `junnie-ref.png` are **reference sheets on flat magenta**,
not sprites. They still need the magenta keyed out and export to transparent PNG under
60 KB. Do not drop a reference sheet into a scene as a sprite.

## Run it

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

No build step, no bundler, no npm dependencies in v1. `file://` will not work — ES modules
are blocked by CORS on the file protocol.

There is no test runner and no linter. Verification is done by looking at the page, so after
a change, say what to open and what should be different.

## Architecture

Plain HTML + CSS + ES modules. Rendering is **DOM elements moved with CSS `transform`**,
not canvas. This is deliberate: DOM is inspectable in DevTools, and links, focus order, and
screen readers work without being rebuilt by hand.

```
src/data/      pure data — scenes, tables, content, landmarks, theme state
src/engine/    everything that touches the DOM (incl. panel.js)
src/styles/    tokens.css is the single source of truth for color
assets/        scenes/ backdrops/ sprites/ refs/ source/ + PROMPTS.md
```

**Two scenes only: `exterior` and `interior`.** Each of the five tables opens an **overlay
panel**, not a separate scene. If you find yourself writing a third scene, stop and ask.

## Hard rules

- **`src/data/` must never import from `src/engine/`.** This one rule is what makes the
  eventual React + Vite migration a port instead of a rewrite. Data files stay pure: no
  `document`, no `window`, no DOM references.
- **No hardcoded colors outside `src/styles/tokens.css`.** If a color is needed that does
  not exist, add a token first, then use it. Every new color must be defined in all four
  `[data-time]` blocks.
- **No text content in HTML or engine files.** All copy, projects, and links live in
  `src/data/content.js`.
- Scene changes go through the hash router. Never swap scenes by directly mutating
  `innerHTML` from a click handler.
- Use `transform` for all movement, never `top`/`left`. Transforms are GPU-composited;
  position changes trigger layout on every frame.
- Every interactive element needs a visible `:focus-visible` style and must activate on
  `Enter` and `Space`, not just click.
- Respect `prefers-reduced-motion: reduce` on every animation added.

## Design rules

Full visual spec in `.claude/rules/design.md`: palette, type scale, motion timings, measured
WCAG ratios, layer order. **Read it before writing any CSS or HTML.**

Its `paths:` frontmatter is a Cursor-style auto-load convention that Claude Code does not
act on — the file will not load itself, and the frontmatter is inert. Open it deliberately.
(Adding `@.claude/rules/design.md` to this file would force it to always load, at the cost
of carrying it during pure logic work. Left out for now.)

## Contact details — verbatim, do not paraphrase

- LinkedIn: `https://www.linkedin.com/in/allyjing/`
- Email: `huang.jingwen@northeastern.edu`

⚠️ The brief originally supplied `northeatern.edu`, which is a typo. The corrected spelling
above is used everywhere. **Jingwen must confirm this address works before launch.** If she
says the original was correct, update this file and ask before changing it back.

## Current scope

v1 is two scenes and five panels — Experience, Projects, Photography, Life, Arts. All five
ship; there are no "still baking" placeholders and no walkable rooms.

Panel requirements that are easy to skip and are not optional: deep-linkable via
`#/interior/projects`; closes on button, `Escape`, **and** backdrop click; focus trapped
while open; focus returns to the table that opened it; scene behind is `aria-hidden`.

`/resume.html` is a plain semantic HTML page with no JavaScript and no sprite assets. It is
the fast path for recruiters and is not optional. Do not add game code to it.

**Deploy at Phase 4, not at the end** (PRD §12). The resume page plus the exterior is
already useful to a recruiter, and the three deploy-only bugs below surface while there are
thirty files to check instead of three hundred.

## Art assets

Assets are AI-generated. Two constraints that are easy to violate by accident:

- **There are no walk-cycle frames.** Each character has exactly one sprite. Walking is a
  2–3px vertical bob plus a small rotation, in CSS. Never write code that expects a sprite
  sheet or frame index.
- **Direction is `transform: scaleX(-1)`.** There is no back-facing or front-facing sprite.

`assets/PROMPTS.md` is the asset bible: the shared style line to paste into **every**
prompt verbatim, the exact prompt for each of the seven existing assets, the generation
order, and the log table. Read it before generating anything.

⚠️ **Tool, model, and seed were never recorded for the seven Phase 0 assets.** The prompts
survive and visibly match the output, so the style is reproducible, but an exact re-roll is
not. Record all three on the next generation. Generate new assets from `assets/refs/` as an
img2img reference, never a text prompt alone.

## Landmark backdrop

The distant LA landmark is a **separate image layer** behind the bakery, swapped
independently of the foreground. Data lives in `src/data/landmarks.js` as
`{ id, name, lat, lon, image }`.

A location label sits bottom-left showing name and coordinates:
`Griffith Observatory · 34.1183° N, 118.3003° W`. Clicking it cycles landmarks, mirroring
the clock top-left. Top-left is *when*, bottom-left is *where*.

Four landmarks, all coordinate-verified (PRD §11):

| id | name | lat | lon | time |
|---|---|---|---|---|
| `hollywood-sign` | Hollywood Sign | 34.1341 | -118.3216 | `morning` |
| `smpier` | Santa Monica Pier | 34.0086 | -118.4986 | `noon` |
| `laguna` | Laguna Beach | 33.5314 | -117.7692 | `sunset` |
| `griffith` | Griffith Observatory | 34.1183 | -118.3003 | `night` |

**Never generate coordinates from memory** for any landmark added later. Recalled
coordinates look plausible and are often wrong by hundreds of metres. Ask Jingwen to look
them up.

Griffith Observatory and the Hollywood Sign are 2.6 km apart — the same hillside — but
locking them to night and morning respectively makes them unmistakable. Do not "helpfully"
neutralize a backdrop's lighting; the baked-in time of day is what keeps the set distinct.

**Laguna Beach is in Orange County, not Los Angeles** (45 mi from downtown). The label shows
name and coordinates only, which is accurate. Never caption this feature "Los Angeles" in
the UI or on the resume page.

**Trademark:** depicting a place is fine; reproducing a corporate logo, wordmark, or
licensed character is not. Applies to any landmark added later. Note the existing backdrop
does render the Hollywood Sign wordmark — PRD §11 judges this low risk for a personal
portfolio, but it is the one asset in the set carrying any exposure.

## Time of day

Four states on `<body data-time>`, each locked to one landmark:

| state | landmark | hours |
|---|---|---|
| `morning` | Hollywood Sign | 05:00–10:59 |
| `noon` | Santa Monica Pier | 11:00–16:59 |
| `sunset` | Laguna Beach | 17:00–20:59 |
| `night` | Griffith Observatory | 21:00–04:59 |

There is no `afternoon` state — `noon` covers midday through late afternoon. Time and place
are **one value**: the clock (top-left) and the location label (bottom-left) are two readouts
of it, and clicking either advances it.

The **bakery exterior and interior are painted once** under neutral light and tinted in CSS.
The **four backdrops each bake in their own time of day and sky.**

⚠️ `--light-tint` sits above the backdrop layer and below the scene. Never apply it to the
backdrop — an already-night Griffith image with a night tint on top renders black.

## Deploying — GitHub Pages

Repo is `allyjing.github.io`, a user site served at the domain root. Three rules whose
violations are **invisible locally and only break after deploying**:

- **No leading slash in any path.** Write `src/styles/tokens.css`, never
  `/src/styles/tokens.css`.
- **All asset filenames lowercase-with-hyphens.** Pages serves from Linux and is
  case-sensitive; macOS is not. `Junnie.png` referenced as `junnie.png` works locally and
  404s in production. Everything under `assets/` already follows this — keep it that way.
- **Keep the empty `.nojekyll` at the repo root.** Without it, Jekyll silently drops files
  and folders starting with an underscore.

The repo is public. Never commit anything with a home address, phone number, or unpublished
photos in it.

## Gotchas

- Sprites need `image-rendering: auto`. The art is deliberately smooth, not pixel art —
  applying `pixelated` fights the brief.
- Pastel palettes fail WCAG AA contrast constantly. Check any new text/background pairing
  against a contrast checker rather than assuming it passes.
- Mobile Safari is a primary target. Test `100vh`, tap delay, and `:hover` styles there —
  hover states that hide information are broken on touch devices.

## Working style

- When a change spans more than two files, outline the plan before writing code.
- After changes, say what to look at in the browser to verify it worked.
- If something in the PRD conflicts with a request in chat, say so rather than silently
  picking one.
