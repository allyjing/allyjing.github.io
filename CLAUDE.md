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

**Phases 0-3 are done, and the interior now exists as a working placeholder. The two
things actually blocking progress are both art**: the regenerated SoCal exterior cutout,
and an interior painting (prompt in `assets/PROMPTS.md`). The room is currently drawn in
CSS from the tokens — it reads correctly and you can walk around it, but it plainly is not
painted. Dropping `scenes/interior.*` in and setting `image` on `scenes.interior` replaces
it with no other code change.

**Phase 4: `resume.html` is complete and the deploy is the remaining step.**

⚠️ **The source resume contains a phone number and this page deliberately omits it.** PRD
§10.3 says never to commit a phone number to this repo, which is public. Email and LinkedIn
are enough to reach her. `Resume.zip` is gitignored for the same reason — do not commit it,
and do not add the number back.

⚠️ `resume.html` holds its copy INLINE, not in `content.js`. R31 puts all copy in data, but
R24 says this page loads with no JavaScript, and it cannot do both. R24 wins: this is the
fast path for a recruiter and it has to work when every script fails. That page
does not exist yet, so the Resume link in the top-right currently 404s. Phase 4 is
deliberately early (PRD §12): it makes the site useful to a recruiter before the interior
exists, and it surfaces the three deploy-only bugs in §10.3 while there are thirty files to
check rather than three hundred.

Phase 1 built the layer stack, the hash router and a static scene. Phase 2 added
click-to-move and keyboard movement inside a walkable polygon. Phase 3 completed the
exterior: both garden signs, the clock, the location label, and all four time states
cycling. Verified in a browser at desktop and 390x844 portrait.

### Coordinates: everything is in image space

The one non-obvious thing in the engine. The scene art is landscape, the window is any
shape, and `object-fit: cover` crops the overflow — so a fixed point like "the middle of the
garden path" lands somewhere different on every viewport. Storing the walkable polygon in
stage coordinates would let it drift off the painted ground.

So **the polygon and the actors are stored in image coordinates (0-100 across the artwork)**,
and `engine/layout.js` computes the box the cropped image actually occupies, publishing it
as `--scene-x/y/w/h`. The props and actor layers are sized to that box, so a percentage in
`scenes.js` always lands on the same painted spot. `toImageCoords()` converts a click back.

`layout.js` mirrors the `object-fit`/`object-position` values in `scenes.css` by hand. If
you change either, change both.

**The crop is why the signs move on a phone.** At 390x844 only about x 37-63 of the artwork
is on screen — the signs' garden positions fall outside it entirely, and that band is
already occupied by Jingwen and Junnie. So below an 8:5 aspect ratio `ui.css` docks the
signs into the bottom-right corner as chrome instead. Anything else positioned near the
edges of the scene will hit the same problem; check it in portrait.

`src/engine/main.js` is the entry point. It is not in the PRD §7.3 file list — that layout
names the modules but no boot file, and `index.html` needs exactly one `<script type=module>`
to start things.

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

### The art is in

Both regenerated pieces landed on 2026-09-13 and are wired up:

- **`scenes/exterior.jpg`** — the Southern California bakery, generated as a proper
  cutout with everything above the ground painted flat magenta. `exterior-mask.png` is a
  straight key of that, built by `assets/source/make-cutout-mask.py`. It is still a mask
  paired with a JPEG rather than an RGBA PNG, for the same size reason as before.
- **`scenes/interior.jpg`** — the room, with the five tables painted in. Nothing draws
  furniture; the only things placed are a dessert on each table and the bubble above it.

  The interior has to hold its own against the exterior, which gets a changing sky and a
  landmark for free. Three things do that work: the bubbles use the **same board as the
  garden signs** so the two rooms read as one shop; each dessert sits on a **plate**, so it
  reads as served rather than as a shape pasted on; and **daylight from the window** spills
  the current `--sky-top` across the floor, so the room knows what time it is.

  ⚠️ Objects in a scene need their own colour tokens — `--dessert-bake`, `--dessert-glaze`,
  `--dessert-plate`. Every `--surface-*` flips to a dark UI colour after dark, and a plate
  that turns navy at night reads as broken rather than as dim.

Keying takes THREE passes, and all three are load-bearing:

1. **A border flood fill** at tolerance 38. Connectivity is what protects the
   bougainvillea, which is pink and sits within ~30 of the key colour. The background
   itself is remarkably flat — (192, 93, 142), variance about 2.
2. **A pocket pass** for background the fill cannot reach because the subject encloses it:
   between the fountain's tiers and its water streams, and the slot behind the downspout.
   Those showed as magenta patches.
3. **A ring pass** at tolerance 34, for leftovers too small for the size rule and too
   blended for the tight tolerance. Neither size nor colour finds them, so this pass uses
   *what surrounds them*: trapped background is ringed by stone, metal or dark outline,
   whereas a near-key patch inside a blossom is ringed by more pink. It groups the
   leftovers and cuts only groups whose ring is under 45% pink.

Colour cannot separate the second case — **the blossoms are shaded with literally the
background colour**, so any tolerance that catches a pocket punches holes through the
flowers. Size separates them: a pocket is a few hundred contiguous pixels, a blossom
speckle is a handful. So the pocket pass marks key colour at a tight tolerance, groups it,
and cuts only groups above ~120px.

⚠️ The pocket pass must stay **independent of the flood fill**. Seeding the fill from it let
the fill spread outward at the looser tolerance and eat the blossoms wholesale.

⚠️ **The ring pass's `pinkish()` test must accept DESATURATED rose, not just magenta.** This
is the subtlest trap in the file and it has already drawn blood once: the predicate was
`r > g + 25 and b > g + 10`, and the awning over the entrance door is painted
(216, 154, 157) — blue leads green by only 3. The awning therefore read as "not pink", its
whole ring voted non-pink, and the pass cut a 1393 px wedge out of the awning's shaded
right-hand facet, plus a smaller hole in the bougainvillea. Fixed 2026-09-14 by relaxing the
blue test to `b > g - 10`.

`r > g + 25` is the condition doing the real work — it is what rejects the near-neutrals
that ring genuine trapped background, and it rejects warm terracotta too. The blue test only
has to finish that job. Measured on this art, the pass cuts exactly three blobs and all
three were false positives, so err toward keeping paint.

A handful of specks survive even that — in the mouth of the downspout and between the
fountain's tiers — and `assets/source/despill-scene.py` RECOLOURS those rather than cutting
them, which cannot punch holes the way cutting can. It is scoped to a named region of the
frame, deliberately: three general rules were tried and all three failed, because the specks
and the blossom shading are the same colour, the same size, and sit in similarly
non-pink surroundings. Two known defects in one painting are better fixed by saying where
they are. Re-derive the box if the exterior is regenerated, or drop the script — a cleaner
generation would not need it.

### Placing the backdrop

The backdrop is drawn **smaller than the scene** — its height is `scene.horizon`, its bottom
below the painting's ground line so none of it is exposed. Small is what makes the landmark
read as miles away rather than as a hill in the next field.

Because it is small it does not span the width. Fading its edges was tried and read as a
cut-off, so instead the strip carries a **mirrored slice of the same image on each side**:
seamless at the join by construction, carried off both edges, one download for all three
copies. The mirrors are narrow slices (~42% of the image) deliberately — a full mirrored
copy brings the subject back into view, and a second backwards HOLLYWOOD sign appeared at
the left edge.

⚠️ **`align` belongs on the backdrop LAYER, not on the stage.** Each landmark needs its own
— the HOLLYWOOD letters sit at 44% across their image while Laguna's sun and cliffs sit far
right — so no single value frames them all. Held on the stage, both layers shared it, and
changing the time moved the layer still on screen: the backdrop visibly jumped sideways
before the cross-fade started. Per layer, the outgoing strip stays put and the incoming one
arrives already in place, so a time change is a pure dissolve with nothing moving.

⚠️ **`horizon` and `align` constrain each other.** The strip is 1.84 image widths across,
centred on `align`, and must reach past both edges of the frame:

    align − 0.92 × horizon ≤ 0

Smaller `horizon` looks further away but stops covering the frame. 78 with `align` ~70 is
about the smallest that still covers while keeping the landmark clear of the bakery roof.
Solve this rather than guessing if either value changes — guessing produces either a gap at
one edge or a landmark buried behind the building.

The old English-cottage painting is kept as `source/exterior-cottage-original.jpeg`: every
sprite was generated against it, so it stays the style reference even though it is no
longer the scene.

`scenes/exterior.jpg` is 276 KB and `interior.jpg` 299 KB, both a little over the 250 KB
budget. WebP would bring them under.

### The time-of-day tint, resolved

A full-frame wash sits at `--z-tint` (40), above the scene and the actors, which is what
made it reach the bakery — but it necessarily reached the backdrop too, and the backdrops
have their time of day painted in already. With an opaque exterior there was no way to have
one without the other, and PRD §9's ordering could not be satisfied.

The cutout settles it. **Outdoors there is no overlay at all.** The whole treatment is
carried by `--scene-filter`, which is applied to the scene image and so respects its alpha:
it tints the painted bakery and cannot touch the layer behind it. The overlay survives
indoors, where the room is opaque, there is no backdrop to protect, and a soft wash across
the frame is exactly what is wanted.

If you add a new outdoor layer, tint it with a filter, not an overlay.

## Run it

```bash
python3 serve.py              # then open http://localhost:8000
```

`serve.py` is `http.server` plus `Cache-Control: no-store`. **Use it rather than
`python3 -m http.server`.** Without the no-cache header the browser will happily keep
serving a stale copy of an ES module after you have edited it, and you end up debugging
code that is not running — the failure is silent and it cost real time here. If the page
ever seems to ignore an edit, that is the first thing to suspect; a hard reload
(Cmd+Shift+R) clears it.

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
src/engine/    everything that touches the DOM
               main.js boots; layout.js maps image space; movement.js is pure geometry
               and timing, input.js owns the events, renderer.js owns the DOM writes
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

The brief originally supplied `northeatern.edu`, which is a typo. The corrected spelling
above is used everywhere, and **Jingwen confirmed on 2026-09-13 that the address on the
live site is correct.** That question is closed — do not reopen it or change the address
back.

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

- **There are no walk-cycle frames.** Never write code that expects a sprite sheet or a
  frame index. Still true — but how walking is done has moved on from PRD §8.3, twice, and
  both changes came from watching it rather than reading it:

  **Jingwen is cut into three images** — `jingwen-body.png` and two legs — so her legs
  hinge at the hip and swing in opposite phase in CSS. §8.3 specifies a bob plus a 1–2°
  rotation of the whole sprite, and that reads as gliding, not walking. This is still one
  generated pose with no frames; the cut is done in software from the single sprite. The
  cut lines are recorded in `scenes.js` as percentages and must match the images.

  **Steps are a foot LIFTING, not a leg swinging.** Rotating the legs around the hip is
  what a waddle is — from a head-on view it swings the feet sideways. The lift is done with
  `scaleY` about the hip instead: shortening the leg raises the foot while the hip stays
  welded to the body, which is what a bending knee looks like from the front. Rotation is
  kept to ±2.5° and does not drive the motion.

  **She has three views — front, back and side — and turns between them.** The walker
  derives a heading from the movement vector and the renderer swaps `poses[heading]`. The
  side view is drawn facing RIGHT and mirrored with `scaleX(-1)` for the other direction,
  which is the one case where the flip genuinely reads, because a profile is not symmetric.

  All three are cut at the same percentages so the hip geometry never changes, and all are
  normalised to the same height so she does not jump when she turns. Only `aspect` differs
  per pose — a profile is narrower — and the renderer updates the actor box with it.

  ⚠️ **The back and side sheets drifted in both hair AND skin colour** from the front, and
  had dusty-rose background trapped in pockets inside the hair. All three were corrected
  with `assets/source/recolour.py` (`hair`, `skin` and `despill` modes; usage in
  `assets/PROMPTS.md`). Expect all of it on every regeneration — PRD §8.5 lists colour drift
  as an expected failure, and naming a hex in the prompt does not reliably hold it. Measure
  against the front anchor and correct afterwards rather than trying to prompt around it.

  **Head-on and profile need opposite motion, which is the whole trap here.** Front and back
  lift the foot with `scaleY` about the hip; rotating instead would swing the feet sideways,
  which is a waddle. In profile the legs genuinely scissor front-to-back, so `side` uses
  rotation (`step-profile`) — the exact motion that is wrong head-on.

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

Repo is `allyjing.github.io`, a user site served at the domain root.

⚠️ **A user-site repo name must match the GitHub USERNAME exactly**, or it is a project
site. The account was originally `JingleWhen`, which would have made `allyjing.github.io` a
project served at `jinglewhen.github.io/allyjing.github.io/` — the base-path problem below,
arriving through the repo name rather than through a path. The account was renamed to
`allyjing`, which also matches the LinkedIn handle the site already links to.

Three rules whose
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
