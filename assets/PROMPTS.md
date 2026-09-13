# Asset generation log

**Repo path:** `assets/PROMPTS.md`

Every generated asset gets a row in the table at the bottom. Without it you cannot
regenerate a matching asset in three weeks when you need one more prop. This is the only
version control art has.

---

## Before you start

**Pick one tool and do not switch.** Switching generators mid-project is the most common
cause of assets that don't look like they belong together — more common than bad prompting.

**Generate large, downscale later.** Ask for 1024px or bigger every time, even for a sprite
that ends up 180px on screen. Downscaling hides flaws. Generating small produces mush.

**Do them in this order.** Each step feeds the next:

```
1. jingwen.png            →  CHARACTER reference for anything with a person in it
2. exterior.webp          →  STYLE reference for all four backdrops
3. junnie.png             →  uses exterior.webp as style reference
4. hollywood-sign-morning.webp  →  uses exterior.webp as style reference
5. griffith-night.webp          →  uses exterior.webp as style reference
```

Number 1 and number 2 are the anchors. Get those right before generating anything else,
however tempting it is to jump ahead.

---

## The shared style line

Paste this into **every** prompt, unchanged. Consistency comes from repeating the same
style words verbatim, not from describing the style well once.

> soft pastel storybook illustration, clean rounded shapes, flat cel shading, gentle dark
> outlines, muted palette of cream white, dusty rose pink and powder blue, cozy and warm,
> children's picture-book feel, high detail, NOT pixel art, NOT 3D render, NOT photograph

The "NOT pixel art" matters. The brief asks for graphics that are clearer and less
pixelated than the reference, and generators drift toward pixel art when you describe a
cozy 2D game.

---

## 1. `assets/sprites/jingwen.png` — the anchor

Generate this first. Iterate until it is genuinely right. Nothing else gets generated until
it is locked, because every later image references it.

> Full-body character illustration of a young woman standing facing the viewer, neutral
> relaxed pose, arms at her sides. Shoulder-length brown hair worn down with curled curtain
> bangs. Navy blue top, blue jeans, white sneakers. Simple friendly face with minimal
> features, small dot eyes, soft smile. Centered, full body visible head to feet, flat solid
> magenta background. [SHARED STYLE LINE]

**Flat magenta background, not transparent.** Generated alpha channels come out ragged. A
solid magenta (#FF00FF) keys out cleanly in any image editor because no part of the
character is that color. Remove it afterward and export as PNG with transparency.

**One pose only. Do not generate walk-cycle frames.** Walking is a 2–3px vertical bob plus a
small rotation, done in CSS. Direction is `transform: scaleX(-1)`. Frame-by-frame animation
is exactly what AI generation is worst at, and you are sidestepping it entirely.

Checks before you lock it: is the navy actually navy, are there five fingers per hand, are
both shoes the same shape, is the hair symmetrical enough to mirror without looking wrong.

---

## 2. `assets/scenes/exterior.webp` — the style anchor

> A small two-story bakery with pastel cream-white stucco walls, a powder blue tile roof,
> and a dusty rose awning over the front door. Flower beds and a garden path in front. A
> stone fountain to one side. Empty grassy foreground with room for characters to stand.
> Neutral midday light, soft shadows, no dramatic sunset. Wide landscape composition, the
> bakery positioned left of center, open sky above. [SHARED STYLE LINE]

**Neutral midday light is not optional.** Time of day is applied as a CSS tint over this one
painting. If you bake a sunset into the image, the night theme will fight it and look wrong.

Leave real empty space in the lower third. That is where your character walks, where Junnie
sits, and where the two signs go.

---

## 3. `assets/sprites/junnie.png`

> An orange tabby cat sitting upright, facing the viewer, tail curled around its front paws,
> content expression. Warm ginger orange fur with darker tabby stripes. Flat solid magenta
> background. [SHARED STYLE LINE]

Junnie should be the warmest, most saturated thing in the whole scene. Everything around him
is cool pastel, which is what makes the eye find him first without any extra effort.

---

## 4–7. The four backdrops — each locked to one time of day

Each landmark **bakes its own time of day into the image**. This replaces the earlier plan
of painting backdrops neutral and tinting them in CSS.

| State | Landmark | File |
|---|---|---|
| `morning` | Hollywood Sign | `backdrops/hollywood-sign-morning.webp` |
| `noon` | Santa Monica Pier | `backdrops/smpier-noon.webp` |
| `sunset` | Laguna Beach | `backdrops/laguna-sunset.webp` |
| `night` | Griffith Observatory | `backdrops/griffith-night.webp` |

**The bakery itself is still painted once under neutral light** and still gets the CSS tint.
Only these distant backdrops are time-specific. The expensive asset stays cheap.

⚠️ **The CSS tint must not touch the backdrop layer.** A night tint applied on top of an
already-night Griffith image renders it black. The overlay sits between the backdrop and the
foreground — see PRD §9.

⚠️ **Each backdrop includes its own sky.** The CSS sky gradient becomes a loading fallback
only, since these images now carry the sky themselves.

---

### 4. `backdrops/hollywood-sign-morning.webp` — low east light, cool shadows

> Distant view of large white capital letters spelling HOLLYWOOD standing on a dry
> golden-brown ridge, small in the frame, seen from far below. Early morning, low sun from
> the side lighting the ridge warmly, the sun itself not visible in frame. Deep cool blue
> shadows filling the canyon folds. Crisp clear air with very little haze, clean pale blue
> sky. Horizon high in the frame, upper two-thirds open sky. Simple background layer, no
> foreground detail. [SHARED STYLE LINE]

The detail that makes this read as morning rather than sunset: **warm light, cool shadows,
and no sun in frame.** Morning sun is behind the viewer looking at the sign, and morning air
is the clearest of the day. Sunset is the opposite on all three counts.

---

### 5. `backdrops/smpier-noon.webp` — harsh, flat, overhead

> Distant view of a long wooden pier extending over the ocean with a Ferris wheel and
> rollercoaster on it, wide flat sandy beach in front. Harsh overhead midday sun, almost no
> shadows, bleached washed-out bright blue sky, glittering white highlights on the water.
> Shimmering heat haze over the sand. Horizon line across the middle of the frame. Simple
> background layer, no foreground detail. [SHARED STYLE LINE]

Noon is the flattest, least flattering light there is — lean into it. Shadowless and
slightly overexposed is *correct* here, and it is what makes this unmistakable next to the
other three.

---

### 6. `backdrops/laguna-sunset.webp` — sun on the horizon

> Distant view of rocky coastal cliffs and small sandy coves, no pier and no buildings. Sun
> sitting directly on the ocean horizon, full sunset sky of deep orange, coral pink and
> purple, sun reflection as a bright path across the water. Cliffs in near-silhouette against
> the bright sky. Warm haze softening the distance. Horizon line low in the frame. Simple
> background layer, no foreground detail. [SHARED STYLE LINE]

---

### 7. `backdrops/griffith-night.webp` — city lights below

> Distant view of a white Art Deco observatory building with three domes on a dark hillside
> at night, the building lit warmly from below and glowing against the dark. The vast grid of
> Los Angeles city lights spread out far below and behind it. Deep indigo and purple night
> sky with scattered stars. Horizon line low in the frame. Simple background layer, no
> foreground detail. [SHARED STYLE LINE]

---

## The Phase 0 test — it changed again, and for the better

**There is no at-risk pair in this set.** Every landmark differs from every other on both
subject and light:

| | Subject | Sun | Shadows | Air |
|---|---|---|---|---|
| Hollywood Sign | inland ridge | low, off-frame | cool blue | crisp, clear |
| Santa Monica Pier | pier, flat sand | directly overhead | almost none | hazy, bleached |
| Laguna Beach | cliffs, coves | on the horizon, in frame | near-silhouette | warm haze |
| Griffith Observatory | domed building | none — city lights | dark | deep, dark |

So Phase 0 is no longer a "are these too similar" test. It becomes a harder and more useful
one: **does the shared style survive the widest lighting swing in the set?**

Generate **`hollywood-sign-morning.webp` and `griffith-night.webp`**. They sit at opposite
ends of the range. If your illustrated world holds across bright morning and full night, the
two in between are interpolations and will not surprise you. If the night one comes back
looking like a different artist drew it, you have found the real limit of your tool before
you built anything on top of it.

Phase 0 is therefore: `jingwen.png`, `junnie.png`, `exterior.webp`,
`hollywood-sign-morning.webp`, `griffith-night.webp`. Santa Monica and Laguna are Phase 3.

## 8-9. Jingwen turning — back and side views (GENERATED, in use)

Both were generated on 2026-09-13 and are wired up: she now turns to face away when walking
up, and into profile when walking sideways.

⚠️ **These two came back on a DUSTY ROSE background (191, 97, 140), not the bright magenta
of the front sheet.** That matters: her hair brown sits only ~83 away from that colour in
RGB, so the default keying tolerance of 100 would have eaten into her hair. They were keyed
at tolerance 60 instead. **If you regenerate anything, check the margin before keying** —
the script takes tolerance as its fourth argument. Bright magenta is still the better
background precisely because nothing on her comes close to it.

⚠️ **Her hair also came back a different colour**, which is §8.5's colour-drift failure
mode arriving exactly as predicted:

| view | hair, as generated |
|---|---|
| front (anchor) | `(91, 63, 57)` — dark, cool brown |
| back | `(132, 82, 66)` — lighter, warmer |
| side | `(128, 78, 67)` — lighter, warmer |

The back and side were corrected to the front, because the front sheet is the anchor every
other asset in the project was generated against. `source/recolour-hair.py` did it: a
per-channel statistical transfer that shifts the mean and rescales the spread, so the base
tone, shadow, highlight and outline stay distinct instead of flattening to one colour. All
three now sit within ~6 units of each other.

**This will happen again on any regeneration.** Naming a hex value in the prompt does not
reliably hold it. Generate, then measure and correct — it is faster and it actually works.

**Both must use `refs/jingwen-ref.png` as an img2img reference**, not the text alone, or
the hair, the navy and the proportions will drift. Match her height in frame as closely as
you can: the three views get cut at the same percentages, so a figure that sits higher or
lower in frame will make her jump when she turns.

### 8. `refs/jingwen-back-ref.png`

> Full-body character illustration of a young woman seen from BEHIND, facing directly away
> from the viewer, neutral relaxed pose, arms at her sides. Shoulder-length brown hair worn
> down, seen from the back. Navy blue top, blue jeans, white sneakers. No face visible.
> Centered, full body visible head to feet, flat solid magenta background.
> [SHARED STYLE LINE]

The one thing to check: no face. Generators often turn the head back toward the viewer.

### 9. `refs/jingwen-side-ref.png`

> Full-body character illustration of a young woman standing in PROFILE, facing the
> viewer's RIGHT, neutral relaxed pose, arms at her sides. Shoulder-length brown hair worn
> down with curled curtain bangs, seen from the side. Navy blue top, blue jeans, white
> sneakers. Simple friendly face in profile, minimal features. Centered, full body visible
> head to feet, flat solid magenta background. [SHARED STYLE LINE]

**Facing right matters.** The engine mirrors with `scaleX(-1)` to get the left-facing
version, so only one side needs generating — but it has to be the right-facing one.

### After generating

Key and cut them the same way as the front view (see item 4 under Outstanding asset work),
then fill in `poses.back` and `poses.side` in `src/data/scenes.js`.

## Naming rules

GitHub Pages serves from Linux and is case-sensitive; your Mac is not. A file saved as
`Junnie.png` and referenced as `junnie.png` works perfectly on your laptop and 404s the
moment it deploys.

**All asset filenames lowercase with hyphens.** No capitals, no spaces, no underscores.

---

## Folder roles

| folder | what lives here |
|---|---|
| `source/` | Untouched generation output. Masters — never edit in place, never reference from code. |
| `backdrops/` | Distant landmark layer, one per time state. Time of day is **baked in**. |
| `scenes/` | Scene backgrounds, painted under **neutral** light and tinted in CSS. |
| `refs/` | Character sheets still on flat magenta. The img2img input for every later asset. |
| `sprites/` | Final keyed transparent PNGs. **Empty — keying not done yet.** |

`refs/` is an addition to the layout in PRD §7.3. It exists because the magenta sheet and
the keyed sprite are two different artifacts with two different jobs, and collapsing them
into one folder loses the reference you need for every future prop.

## Log

| file | prompt | tool | model | seed | reference image | date |
|---|---|---|---|---|---|---|
| `refs/jingwen-ref.png` | §1 above | *unrecorded* | *unrecorded* | *unrecorded* | — (anchor) | 2026-09-13 |
| `scenes/exterior.jpg` | §2 above | *unrecorded* | *unrecorded* | *unrecorded* | — (anchor) | 2026-09-13 |
| `refs/junnie-ref.png` | §3 above | *unrecorded* | *unrecorded* | *unrecorded* | *unrecorded* | 2026-09-13 |
| `backdrops/hollywood-sign-morning.jpg` | §4 above | *unrecorded* | *unrecorded* | *unrecorded* | *unrecorded* | 2026-09-13 |
| `backdrops/smpier-noon.jpg` | §5 above | *unrecorded* | *unrecorded* | *unrecorded* | *unrecorded* | 2026-09-13 |
| `backdrops/laguna-sunset.jpg` | §6 above | *unrecorded* | *unrecorded* | *unrecorded* | *unrecorded* | 2026-09-13 |
| `backdrops/griffith-night.jpg` | §7 above | *unrecorded* | *unrecorded* | *unrecorded* | *unrecorded* | 2026-09-13 |

All seven were generated before this log was filled in, so **tool, model, and seed are
unknown**. The prompts themselves survive above and visibly match the output, so the style
is reproducible; an exact re-roll is not. Record tool/model/seed on the next generation.

Extensions are `.jpg`/`.png`, not the `.webp` this document specifies — see item 2 below.

## Outstanding asset work

1. ~~`sprites/` is empty.~~ **Done.** `sprites/jingwen.png` (222x720, 81 KB) and
   `sprites/junnie.png` (237x420, 76 KB), keyed from the refs.

   ⚠️ **Both exceed the 60 KB per-sprite budget in PRD §10.** Deliberate: the first pass hit
   51 KB at 360px tall, but an actor is sized at 34% of stage height, which is ~290 CSS px
   on a 390x844 phone and ~580 device px at 2x — so a 360px sprite was being upscaled, and
   it looked soft. Doubling the height fixed that. Total page weight is still ~1.1 MB
   against the 1.5 MB budget, so the aggregate limit holds; only the per-sprite line does
   not. Converting to WebP would bring both back under it.

   Keying notes, if this ever needs redoing:
   - The two sheets use different magentas — (230,74,214) and (254,65,246) — so the key
     colour is read from each image's own corner rather than assumed to be #FF00FF.
   - **Do not key by colour distance alone.** The first attempt did, and a tolerance wide
     enough to catch the blended edge also swallowed the pink neck shadow and the lips,
     leaving holes that read as a speckled choker. The fix is a flood fill inward from the
     border, so only background actually connected to the edge is ever removed.
   - Magenta trapped in interior gaps (between locks of hair) is unreachable by that fill
     and needs a separate pass. It is identified as "red and blue both well above green,"
     which no legitimate colour in this palette satisfies — the blush, lips and ginger fur
     all have blue at or below green. **Re-check that assumption for any new character.**
2. **Nothing is WebP yet, and `scenes/exterior.jpg` is 375 KB — over the 250 KB budget.**
   The four backdrops are 123–178 KB and already pass. `sips` on this machine reads WebP but
   cannot write it, and there is no ImageMagick or Pillow:
   ```bash
   brew install webp
   cwebp -q 82 assets/source/exterior-bakery.jpeg -o assets/scenes/exterior.webp
   ```
   Convert from `source/`, not from the `.jpg` — recompressing a JPEG compounds the loss.
3. **No interior scene exists.** Phase 5 needs one, and there is no prompt for it above.

4. **Jingwen is now also cut into three pieces** — `sprites/jingwen-body.png` (59 KB) and
   `sprites/jingwen-leg-left/right.png` (11 KB each) — so her legs can swing while walking.
   The whole `sprites/jingwen.png` is kept as the source of the cut. The cut lines live in
   `src/data/scenes.js` as percentages of the sprite box and must be re-derived if the
   sprite is ever regenerated: the hip is where the legs first separate cleanly below the
   hair, and the parting is the horizontal centre.

   If you regenerate her in a 3/4 or side-facing pose, revisit this: a front-facing sprite
   is ~92% symmetric, so `scaleX(-1)` is nearly invisible and the code leans her into the
   direction of travel to compensate.

## Exterior v2 — regenerate before Phase 3

The exterior shipped in Phase 0 has two faults, both traceable to the §2 prompt, and both
resolved by decision on 2026-09-13. **Regenerate it once, fixing both at the same time.**

**Fault 1 — it leaves no room for the backdrop layer.** §2 asked for "open sky above" and a
"wide landscape composition," and that is exactly what came back: a complete opaque
landscape with its own sky, hills, and treeline. PRD §9 layers the landmark backdrop
*behind* the bakery, so as generated the backdrop can never be seen. The exterior has to be
a **foreground cutout** — ground, bakery, garden, and flat magenta everywhere above the
rooftops.

**Fault 2 — it reads as an English village.** Half-timbered gables, slate roof, dense
hedgerows. §2 never named a locale, so the generator defaulted to a European storybook
cottage, which then has to sit in front of the Hollywood Sign. Decision: **make it Southern
California.**

### The replacement prompt

> A small two-story Southern California bakery with pastel cream-white stucco walls, a
> powder blue tile roof, and a dusty rose awning over the front door. Terracotta planters
> with bougainvillea and succulents, a young citrus tree, and a garden path in front. A
> stone fountain to one side. Empty ground in the foreground with room for characters to
> stand. Neutral midday light, soft shadows, no dramatic sunset. Wide landscape composition,
> the bakery left of center. **No sky, no clouds, no distant hills, no horizon line — the
> entire area above the rooftops and beyond the ground is flat solid magenta.**
> [SHARED STYLE LINE]

Then key the magenta out and export as PNG with transparency, exactly as for the sprites.

Two things to check before locking it:

- **Stucco, not timber.** If half-timbering survives the prompt, say "no half-timbering, no
  exposed wooden beams" explicitly. Generators are stubborn about storybook cottages.
- **The ground must end.** You need a clean lower edge to the grass or paving, with magenta
  beyond it, or the cutout will not sit correctly over the backdrop.

Keep `source/exterior-bakery.jpeg` regardless. It is the style anchor every other asset was
generated against, so it stays the img2img reference even once it is no longer the scene.
