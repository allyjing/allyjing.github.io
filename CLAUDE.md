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

**Phases 0-6 are done.** The exterior, the resume page, the deploy, the first-person
interior, the panel system, and all five panels with real content.

Live at <https://allyjing.github.io/>, served from the repo root. Pushes go out through
the `gh` CLI credential helper — see "Deploying" below.

**Phase 7 (polish) is what remains**: a11y audit on a real screen reader, a performance
pass, and testing on an actual phone rather than an emulated viewport.

### Phase 6 — the panels hold real content now

No placeholder copy is left anywhere. `src/data/content.js` `panels`:

| panel | `kind` | source of the content |
|---|---|---|
| Experience | `entries`, GROUPED | the resume, split into Work and Clubs and volunteering |
| Projects | `showcase` | six projects, each with a page of its own |
| Photography | `gallery` | her photographs in SETS, with her own descriptions |
| Life | `journal` | ⚠️ **drafted by Claude.** The one panel whose words are not hers |
| Arts | `entries` | her Citrus College architectural drawing set. Text only, deliberately |

There are three renderers in `panel.js`, chosen by `kind` in the data rather than by
panel id:

- **`entries`** — headed articles. Optionally `groups`, each with a label: Experience
  keeps paid and unpaid work in one panel while still telling them apart, which was
  asked for directly. A group label is an `h3` and its entries drop to `h4` so the
  outline a screen reader walks stays in order.
- **`gallery`** — photographs in `sets`, **two to a row**. Also asked for directly: an
  auto-fill grid fitted four across on a wide card and made every photograph a
  thumbnail you could not read. Each set carries its own description.
- **`showcase`** — an index of cards, each opening its own page at
  `#/interior/projects/<slug>`.
- **`journal`** — the Life panel: a portrait at the head, **tabs down the side**, and
  one page of entries at a time. Asked for directly, replacing a single column where
  everything stacked below everything else.

### The Life journal

Tabs down the side, one page at a time. The tab is the **third URL segment** —
`#/interior/life/places` — so a tab is shareable and Back steps between tabs, the same
mechanism the Projects showcase uses.

⚠️ **`onOpenItem` takes the PANEL ID as well as the item.** It used to take only the
item with `'projects'` hardcoded in main.js, which was fine while the showcase was the
only thing with a third segment and silently wrong the moment the journal wanted one.

⚠️ **It is a real ARIA tablist**, not buttons that look like tabs: `role="tablist"`,
`role="tab"`, `aria-selected`, `aria-controls`, a `tabpanel` labelled by its tab,
roving tabindex, and arrow keys plus Home/End. Without it a screen reader announces
five plain buttons with no hint that they are alternatives or which one is showing.
`aria-orientation` is set from `matchMedia` to match the layout, because the tabs sit
beside the page on a wide screen and above it below 34rem — **keep that breakpoint in
step with the `.journal` grid in panel.css.**

⚠️ **Focus after a tab change goes to the TAB, not the page** — otherwise the next
arrow key scrolls the page instead of moving tabs. `journalTabWanted` carries that
intent into `openPanel`, and is cleared on any other path so a cold load of
`#/interior/life/places` still focuses the Close button, which is where opening a
dialog belongs.

**It looks like a spiral notebook, from a reference Jingwen supplied.** Coloured
dividers stick OUT past the page's right edge and TUCK behind it, starting near the
top; the page carries a drawn spiral binding down its left edge. The page is in
normal flow with `position: relative`, the dividers are absolutely positioned behind
it, and the page's own edge is what hides their tucked halves — so only the
protruding part is clickable, which is how a real divider behaves too.

⚠️ **Never give `.journal__tab` an explicit `width`.** In a column flex container the
tabs already stretch to the container, and pinning the width leaves `margin-right`
nothing to shrink — the selected-tab staircase measured identically on every tab and
silently did nothing.

⚠️ **The divider colours are `--room-tab-1..4`, not `--surface-trim`/`--surface-roof`.**
`--surface-roof` is NOT in the interior rebinding list, so it would have turned slate
at night while everything around it stayed lit. Any new colour used inside the panel
needs a `--room-*` token. All four measure AAA against `--ink`.

Selection is shown as a **staircase**, not a colour: each divider is already a
different colour, so there is no spare colour left to mean "selected". The open one
is pushed further out and sits in front of the page.

⚠️ **The ruled page is a BASELINE GRID and every element on it must stay on the grid.**
`--rule` is the spacing; every text element sets `line-height: var(--rule)` and every
margin is 0 or a whole multiple of it. The first version let each element keep its own
line-height and margins: body text happened to align, headings did not, and the error
accumulated down the page until the rules struck through the middle of words. A
heading is just a bigger font on the same grid. Add an element without this treatment
and you must turn the ruling off.

### ⚠️ School does not go in Life

Asked for directly: *"i should not be seeing academic school clubs on there they
should have their own tab section for clubs"*. Makers Club, Science Club for Girls,
the CADodile team and the Red Vest job were all in the Life panel and have been taken
out. None of it was lost — each already had a proper home:

| was in Life | belongs in |
|---|---|
| Makers Club, Science Club for Girls | **Experience** → "Clubs and volunteering" |
| Student Helper (Red Vest) | **Experience** → "Work" |
| CADodile | **Projects** |

Before adding anything to Life, ask whether it is coursework, a club or a job. If it
is, it goes in Experience or Projects. A browser check asserts that none of those
names appears anywhere in Life and that they are all still findable in Experience.

⚠️ **There is no Friends tab, and that is deliberate.** Every fact this repo holds
about the people in Jingwen's life is a club, a team or a job — all of which she has
now said do not belong here — so a Friends tab could only be invented. It goes in the
moment she writes four lines for it.

### Which words on this site are whose

This matters more than it sounds and `content.js` says it at the top too:

- **Jingwen's resume** — the Experience entries and the project bullets.
- **Jingwen's own writing, verbatim from `jingwen.lovable.app`** — both panel intros,
  the Photography set descriptions and technical notes, and the project
  About/Challenge/Result prose. Do not paraphrase these; her voice is the thing they
  are there for.
- **Written for this site** — per-photo captions, the one-line card summaries, and the
  section headings over her prose.
- **Drafted by Claude** — the whole Life panel. Marked in the data. Replace it.

⚠️ **The CNC Milling entry is deliberately thin.** The old site's write-up for it was
generated filler and its three photographs were stock images of an industrial 5-axis
mill, not her Forest router. Only the verifiable part was kept.

⚠️ **The Life panel is a draft and is marked as one in `content.js`.** It was written from
things verifiable elsewhere in the repo and on the resume, because nothing on the old site
covered it. Replace it rather than building on it.

⚠️ **Arts has no artwork on purpose, and this is not an oversight to fix.** The old site's
Arts and Architecture sections were illustrated with stock and AI-generated placeholders —
a head made of stones, a hand drawing over a render, two "paintings" that are neither hers
nor paintings — and the copy around them was written to match those images rather than her
work. Only the architectural drawing-set description survived, because it is specific and
credibly hers. The panel says plainly that the pieces are not shown yet. **Do not fill it
from that site; ask for photographs of the real work.**

### The photo gallery and the lightbox

Photography is the one panel with `kind: 'gallery'`. `engine/panel.js` branches on `kind`
and reads `photos` instead of `entries`; the two shapes never mix.

- `engine/photos.js` turns a slug into paths. Files are `assets/photos/<slug>-<width>.webp`
  at the three widths in `photoWidths`. **A missing width is a 404, not a fallback.**
- Thumbnails are lazy, with `srcset` + `sizes`, and `width`/`height` from the data so a
  six-photo grid does not reflow as each one lands.
- `engine/lightbox.js` owns the full-frame view. It is a **sibling** of `#panel`, not a
  child, and that is load-bearing: the panel's focus trap queries its own subtree, so a
  nested lightbox would be caught by that trap and by the panel's Escape handler at once.

⚠️ **Escape belongs to the topmost dialog.** `panel.js` asks `isLightboxOpen()` and stands
down — in both its Escape handler and its Tab trap. Without that, one Escape inside a
photograph closed the panel underneath it too and dumped the visitor back into the room.
Do not rely on listener registration order for this; it is an explicit check.

⚠️ **`closePanel()` calls `closeLightbox()` first.** A panel can close from under an open
lightbox — the browser Back button on `#/interior/photography` does exactly that — and
closing only the outer one leaves a photograph floating over an empty room.

### The desserts are sprites, with a drink on three tables

`assets/sprites/dessert-*.png` and `drink-*.png`, drawn by
`assets/source/draw-desserts.py`. They replaced a pair of CSS pseudo-elements per dessert:
a silhouette can manage a rounded shape and a line, but not lamination on a croissant or a
crackled crust on a bao, and those are the marks that say which dessert it is.

Three of the five tables carry a drink beside the dessert — coffee with the croissant, milk
tea with the bolo bao, matcha with the cake. **Three, not five, deliberately:** a drink on
every table makes five identical place settings and the eye stops reading them as separate
tables.

⚠️ **Every sprite's artwork sits on the bottom edge of its own file, and the CSS depends on
it.** `draw-desserts.py` measures each drawing's alpha box and shifts it onto a shared
baseline automatically, then crops all eight to one box. That is not tidiness — the first
version trusted the drawings to end at `BASE` and two did not: the croissant was 64px short
and hovered a visible gap above its plate, and the macarons overshot by 19px and sat buried
in it. Because the baseline is shared, `align-items: end` alone lines a croissant up with
the glass beside it and ONE plate offset works for all five.

⚠️ **`--sprite-aspect` in `scenes.css` must match the crop the script prints.** Re-render
and you must update it.

⚠️ **`.drink` needs `min-width: 0`.** It is an `<img>`, and a flex item defaults to
`min-width: auto`, which for a REPLACED element resolves to its own intrinsic size — so the
image ignored `flex-basis: 30%` and took the full width of the setting. It was not subtle:
the drink came out 201px wide beside a 124px dessert, and since its height follows its
width it made the whole button 232px tall and pushed three of the five tables into
overlapping each other. Any image put directly into a flex row here needs the same.

⚠️ **`.table { width: 10% }` is a MEASURED value, not a chosen one.** The stack grows
upward from the table surface, so a table's box reaches back over the table painted behind
it. Swept in a browser: 10% is the widest that gives zero overlap between all five pairs;
11% overlaps by 4% of the smaller button and 14% by 16%. At 11% — the value before the
sprites went in — clicking Experience's own plate opened Life. Re-measure if a table moves,
if the sprite aspect changes, or if the bubble's type size changes.

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

  ⚠️ **Nothing indoors changes with the time of day**, including the buttons, the desserts
  and the chrome. Done by REBINDING the flipping tokens on `.stage[data-scene='interior']`
  to the `--room-*` set, which has no `[data-time]` overrides by design. Everything inside
  inherits, so a new dessert or button is covered without anyone remembering. Patching
  controls one at a time missed the souffle's ramekin and the cake's filling.

  ⚠️ **`.panel` and `.lightbox` are in that same selector list, and they are NOT inside
  the stage** — they are siblings of it, because the stage gets `inert` while a panel is
  open and a panel nested inside it would inert itself. Being outside, they do not inherit
  the rebinding, so until they were named there an open panel re-themed with the clock: its
  card went navy at night while the room behind it stayed lit. Panels only ever open
  indoors, so there is no case where this wrongly freezes an outdoor overlay. **Keep it as
  ONE selector list with ONE copy of the bindings** — a second copy is how the ramekin got
  missed the first time.

  ⚠️ **The interior does not change with the time of day** — no tint, no scene filter. It
  is a lit room and looks the same at midnight as at noon; a bakery that dims at night reads
  as closed rather than as evening. The clock still shows and the exterior still changes.

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
budget. WebP would bring them under — **and that is now actionable**: see the tooling note
below. It has not been done because the exterior is a JPEG paired with a separate alpha
mask, and re-encoding it means re-checking that the mask still registers.

### Image tooling that actually exists on this machine

Earlier notes here said there was no PIL, no ImageMagick and no `cwebp`, which is why
`assets/source/png.py` is a from-scratch zlib+struct PNG codec. **Two of those three are
now available**, verified 2026-09-15:

- **`sips`** (`/usr/bin/sips`, ships with macOS) — resize and format conversion.
- **`cwebp`** (`/opt/homebrew/bin/cwebp`) — WebP encoding.
- Still no PIL and no ImageMagick, so `png.py` is still the way to read or write pixels
  from Python.

`sips` + `cwebp` is how `assets/photos/` was produced. Reach for them before writing
another pure-Python pixel loop.

⚠️ **`assets/source/png.py` lives in the repo now.** Every script in `assets/source/`
imported it from a scratch directory under `~/.claude/jobs/`, which meant all six of them
stopped working the moment that directory was cleaned up — committed scripts with an
uncommitted dependency. They now resolve it relative to their own file.

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

**For anything touching focus, layering, routing or responsive layout, that is not enough.**
There are browser checks in the repo:

```bash
python3 serve.py                 # one terminal
tools/browser-check/run.sh       # another
```

They drive headless Chrome over the DevTools Protocol. Node has a native `WebSocket`, so
this installs nothing and does not break the no-npm rule, and none of it ships —
`index.html` does not reference it. 75 assertions across five suites; see
`tools/browser-check/README.md` for what each one holds down.

Eight traps that produce confident, wrong results here. Every one cost a real
investigation, and three of them make an EMPTY run look like a clean one — `run.sh` now
fails a suite that printed no assertions, for exactly that reason:

1. **Chrome's own cache**, on top of the one `serve.py` solves. A CSS edit did not reach the
   page and produced a clean FAIL on a rule that was already fixed. Send
   `Network.setCacheDisabled` AND cache-bust the URL on every navigation.
2. **`input.js` listens for `pointerdown`.** `new MouseEvent('click')` never produces one,
   so a synthetic click reports "she did not move" while everything works. Use
   `Input.dispatchMouseEvent`.
3. **Position is written to `left`/`top`**, not to `transform` — the transform is a constant
   translate plus a walking lean. Comparing transforms reports no movement however far she
   walks. (And she has an idle bob, so never assert "did not move" from a raw transform.)
4. **1400x900 is 1.56, which is BELOW the 8:5 breakpoint.** Two checks and a screenshot
   were taken in the phone menu layout while I believed they were the wide one. Assert
   `matchMedia('(max-aspect-ratio: 8/5)').matches` is what you expect before trusting
   anything about table layout.
5. **`--scene-x/y/w/h` are published on `#stage`**, not on `documentElement`.
6. **`:focus-visible` does not fire for a programmatic `.focus()`** — dispatch a real Tab.
   And the panel focuses its close button on open, so the FIRST Tab lands on the second
   control, not the first.
7. **Double every backslash inside an `evaluate()` string** — they are template
   literals, so `\.` becomes `.` and a regex for four literal periods silently becomes
   "any four characters". And write one cause per assertion: a combined `a && !b`
   names the wrong reason when it fails.
8. **Silent no-run, three ways**: `timeout` does not exist on macOS, so wrapping a check in
   it runs nothing; two Chrome clients on one page target crash Chrome and every later
   suite reports nothing; and piping a check into `awk` from a script that also backgrounds
   Chrome swallows its output. All three print `0 pass, 0 fail`.

Assert geometry and state, not existence. "Five tables rendered and clicks work" passed
while three of them sat piled on top of each other in the wrong place. And when the
question is whether something LOOKS right, take the screenshot and look at it — the
croissant floating above its plate, the plate reading as a white puddle, and the outlines
coming out beaded were all invisible in every computed value and obvious in the picture.

## Architecture

Plain HTML + CSS + ES modules. Rendering is **DOM elements moved with CSS `transform`**,
not canvas. This is deliberate: DOM is inspectable in DevTools, and links, focus order, and
screen readers work without being rebuilt by hand.

```
src/data/      pure data — scenes, tables, content, landmarks, theme state
src/engine/    everything that touches the DOM
               main.js boots; layout.js maps image space; movement.js is pure geometry
               and timing, input.js owns the events, renderer.js owns the DOM writes
               panel.js owns #panel; lightbox.js owns #lightbox; photos.js builds
               photo paths and is shared by both so they cannot disagree
src/styles/    tokens.css is the single source of truth for color
assets/        scenes/ backdrops/ sprites/ photos/ refs/ source/ + PROMPTS.md
               photos/ is the only real photography; everything else is illustration
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

The lightbox inside the Photography panel meets the same bar on its own terms — button,
`Escape`, backdrop click, its own focus trap, focus back to the thumbnail — plus arrow keys
through the set. It is a second dialog, not an extension of the first; see "The photo
gallery and the lightbox" above for the two rules that keep them from fighting.

`/resume.html` is a plain semantic HTML page with no JavaScript and no sprite assets. It is
the fast path for recruiters and is not optional. Do not add game code to it.

**Deploy at Phase 4, not at the end** (PRD §12) — done, and the reasoning held: the three
deploy-only bugs below were checkable against thirty files instead of three hundred.

## Art assets

Most assets are AI-generated. Two that are not, and confusing them causes real mistakes:

- **`assets/sprites/dessert-*.png` and `drink-*.png` are DRAWN** by
  `assets/source/draw-desserts.py`. Re-run the script; do not prompt a generator.
- **`assets/photos/` are Jingwen's real photographs.** Not illustration, not generated, and
  the only images on the site that depict real places.

Two constraints that are easy to violate by accident:

- **There are no walk-cycle frames.** Never write code that expects a sprite sheet or a
  frame index. Still true — but how walking is done has moved on from PRD §8.3, twice, and
  both changes came from watching it rather than reading it:

  **Jingwen is cut into three images** — `jingwen-body.png` and two legs — so her legs
  hinge at the hip and swing in opposite phase in CSS. §8.3 specifies a bob plus a 1–2°
  rotation of the whole sprite, and that reads as gliding, not walking. This is still one
  generated pose with no frames; the cut is done in software from the single sprite. The
  cut lines are recorded in `scenes.js` as percentages and must match the images.

  **A leg stays PLANTED for most of the cycle.** That is what makes it read as one step at
  a time: it lifts for about a third of the stride and stands for the rest, so with the
  other leg half a cycle behind there are stretches where both feet are down. A version
  that raised each leg for 80% of the cycle had both feet off the ground nearly always —
  no weight anywhere, which is exactly what kept reading as a waddle.

  **The head-on step TRANSLATES the leg up; it does not scale it.** scaleY about the hip
  raises the foot on paper, but it squashes the SHOE with it, so it reads as a trouser leg
  compressing rather than a foot lifting — which is why a pass that measured correctly still
  looked like nothing was happening. translateY lifts the foot and the shoe together. It
  needs the leg's top to hide behind the body as it rises, so the body piece is cut to 72%
  against a hip at 61.8%: a 10% overlap. The original 1.4% overlap is why scaling was
  reached for first.

  **The head-on step uses NO ROTATION AT ALL.** Two passes kept a few degrees "just to
  suggest the leg passing under the body" and both still read as waddling — rotating a leg
  about the hip swings the foot sideways, and sideways is the waddle. Zero is what fixed it.

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

Pushing needs the `gh` CLI's credential helper — plain `git push` has no TTY to prompt on
in this environment and fails with `could not read Username`:

```bash
git -c credential.helper='!gh auth git-credential' push origin main
```

`gh auth setup-git` would make that permanent. Pages rebuilds on its own; watch it with
`gh api repos/allyjing/allyjing.github.io/pages/builds/latest`.

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
