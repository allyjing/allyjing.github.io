# Jingwen Bakery — Product Requirements

**Repo path:** `/PRD.md`
**Status:** Draft v1 · 2026-09-12
**Owner:** Jingwen Huang

---

## 1. What this is

An interactive personal portfolio shaped like a small browser game. The visitor arrives
outside a pastel bakery, can walk around, click two signs (LinkedIn, email), pet a cat,
and enter the bakery. Inside, each table holds a dessert and a floating bubble leading to
one themed room: Experience, Projects, Photography, Life, Arts.

Secondary goal, equally real: this is Jingwen's first web development project and her first
serious use of Claude Code. The codebase should be **legible and teachable**, not clever.

### Reference material — read this before designing anything

The visual reference is Gentle Monster × Jennie's *Jentle Garden*. Two facts that constrain
how we use it:

- It was a **native iOS/Android app**, not a website. It shut down 30 May 2022. It cannot
  be played or inspected. The `gentlemonster.com/.../game.html` URL is a marketing landing
  page with videos and store buttons — there is no web game behind it.
- It was produced by a professional studio (Photoshop / Figma / After Effects, credited art
  director) on a brand budget.

**Therefore: the reference is a mood board, not a spec.** Do not try to match its asset
density or animation fidelity. Match its *feeling* — soft, unhurried, cozy, low-stakes.

### Deliberate departure from the reference

The brief asks for graphics that are **less pixelated and more clear**. This is a real
divergence, not a small one. Low-resolution pixel art hides inconsistency; higher fidelity
exposes it. Every art decision in §8 exists to manage that tradeoff.

---

## 2. Goals

| # | Goal | How we know it worked |
|---|------|----------------------|
| G1 | A recruiter can find Jingwen's resume and contact info in under 15 seconds | Escape hatch is visible in the first viewport, always |
| G2 | A curious visitor stays and explores | ≥2 rooms opened in a median session |
| G3 | Jingwen learns real web fundamentals | She can explain every file in `src/` without help |
| G4 | It works on a phone | Fully playable one-handed at 390×844 portrait |

## 3. Non-goals

- Not a real game. No score, inventory, save state, or progression.
- No backend, database, accounts, or analytics beyond a privacy-respecting page counter.
- No multiplayer, no WebGL, no physics engine.
- Not a CMS. Content is edited by editing a JS data file.

---

## 4. Users

**The recruiter (60s, on a phone, between meetings).** Does not want to play anything.
Needs: is she real, what has she built, how do I contact her. If she has to learn controls
to find a resume, she is gone.

**The curious visitor (a friend, a peer, someone who followed a link).** Here for the
charm. Will explore if exploring is rewarded within ~5 seconds of arriving.

**Design consequence:** the site must serve both without compromise. The game is what makes
her memorable. The text page is what gets her the interview. Build both.

---

## 5. Scope

**Architectural note — panels, not rooms.** Each table's bubble opens an **overlay panel**
over the interior scene, not a separate walkable scene. This is a deliberate simplification
and it is worth understanding why it is strictly better here:

- A panel is roughly a tenth the work of a walkable room. **This is why all five sections
  ship in v1 rather than two.**
- A scrollable panel holds project writeups, image grids, and links far better than a
  walkable room does. The room metaphor was fighting the content.
- One interior background instead of six. The art budget drops accordingly.

The game is the *frame*. The panels are the *portfolio*. Keep that division clean.

### v1 — ships first
- Exterior scene: bakery, garden, LA backdrop, Jingwen, Junnie
- Time-of-day system: 4 states, clock top-left, click to cycle
- Landmark backdrop layer + location label bottom-left with coordinates
- Two signs: LinkedIn and email
- Interior scene: one room, five tables, each with a dessert and a bubble
- **All five panels: Experience, Projects, Photography, Life, Arts**
- `/resume.html` — plain, fast, semantic HTML. No game.

Total scenes in v1: **two**. Not seven.

### v2 — after v1 is live
- Additional landmark backdrops (the layer supports N from day one; only the art is missing)
- Ambient sound, default off
- Framework migration (see §7.4)

### Explicitly out
Weather, seasons, NPC dialogue, minigames, guestbook, blog, walkable rooms.

## 6. Functional requirements

Numbered so they can be checked off. Each should be verifiable by looking at the screen.

### Navigation & movement
- **R1** Clicking or tapping anywhere on walkable ground moves the character there at a
  constant speed, in a straight line.
- **R2** Arrow keys and WASD also move the character. Required for keyboard accessibility,
  not optional.
- **R3** The character faces the direction of travel (horizontal flip only; no separate
  back/front sprites in v1).
- **R4** Walkable area is defined by a polygon per scene, stored as data. The character
  cannot walk into the bakery wall, the fountain, or off-screen.
- **R5** Interactive objects show a hover/focus affordance (a gentle scale-up and a soft
  glow) before being clicked.
- **R6** Every interactive object is reachable by `Tab` and activates on `Enter`/`Space`.

### Scenes and panels
- **R7** Two scenes in v1: `exterior` and `interior`. There are no room scenes.
- **R8** Scene transitions use a short fade (250 ms). No slide, no zoom.
- **R9** The bakery door leads to `interior`. A visible "back outside" affordance returns
  to `exterior`.
- **R10** State lives in the URL hash so links are shareable and Back works:
  `#/exterior`, `#/interior`, `#/interior/projects`. A site where Back exits entirely is
  broken. Hash routing also happens to be the only routing style that needs no server
  configuration on GitHub Pages — see §10.3.
- **R11** Clicking a table's bubble opens an overlay panel above the interior scene. The
  scene stays visible and dimmed behind it; it is not unmounted.
- **R12** Panels are deep-linkable. Opening `#/interior/projects` directly loads the
  interior with that panel already open.
- **R13** Panels close on the close button, on `Escape`, and on clicking the dimmed
  backdrop. All three. Focus returns to the table that opened it.
- **R14** While a panel is open, focus is trapped inside it and the scene behind is
  `aria-hidden`. This is what makes an overlay usable with a keyboard or screen reader
  rather than a trap.
- **R15** Panel content scrolls independently. The scene behind does not scroll.

### Landmark backdrop and location
- **R16** The far backdrop is a **separate image layer** behind the bakery, swapped when the
  time state changes. Each backdrop image **bakes in its own time of day and its own sky**.
  The bakery foreground is still painted once under neutral light and tinted in CSS — only
  the cheap distant layer is time-specific.
- **R17** A location label sits in the **bottom-left**, showing the landmark name and its
  coordinates, e.g. `Griffith Observatory · 34.1183° N, 118.3003° W`.
- **R18** **Time and place are a single state.** Each landmark is locked to one time of day,
  so the clock and the location label are two readouts of the same value. Clicking *either*
  advances to the next state, changing time and landmark together. Top-left says *when*,
  bottom-left says *where*, and they are never out of sync.
- **R19** Landmarks live in `src/data/landmarks.js` as
  `{ id, name, lat, lon, time, image }`. Adding one means adding a time state too.

### Signs & contact
- **R20** Left sign links to `https://www.linkedin.com/in/allyjing/`, opens in a new tab,
  with `rel="noopener noreferrer"`.
- **R21** Right sign reveals the email with both a `mailto:` link and a **Copy** button.
  *Known tradeoff:* a plain `mailto:` is scrapeable by spam bots. Accepted, because making
  a recruiter retype an address is worse. Do not "protect" it with JS obfuscation — that
  breaks it for screen readers.
- **R22** ⚠️ **The email address must be confirmed before launch.** The brief supplied
  `huang.jingwen@northeatern.edu`, which is misspelled (`northeatern` → `northeastern`).
  The value used in code is `huang.jingwen@northeastern.edu`. Verify it by sending yourself
  a test message before this ships.

### The recruiter escape hatch
- **R23** A persistent link labelled **Resume** sits in the top-right of every scene, above
  all game layers, visible in the first viewport without scrolling or interaction.
- **R24** `/resume.html` is a standalone semantic HTML page: name, contact, education,
  experience, projects, skills. It loads with no JavaScript and no sprite assets.
- **R25** The game page links to the resume; the resume links back to the game.

### Time of day
- **R26** A clock sits in the top-left showing the current scene time.
- **R27** On first load, the state is derived from the visitor's own clock:
  | State | Hours (local, 24h) | Landmark |
  |---|---|---|
  | `morning` | 05:00 – 10:59 | Hollywood Sign |
  | `noon` | 11:00 – 16:59 | Santa Monica Pier |
  | `sunset` | 17:00 – 20:59 | Laguna Beach |
  | `night` | 21:00 – 04:59 | Griffith Observatory |

  The four states are `morning`, `noon`, `sunset`, `night`. There is no `afternoon` — `noon`
  covers the middle of the day through late afternoon. Every hour maps to a state; there are
  no gaps.
- **R28** Clicking the clock advances to the next state, cycling. This is the *only* way to
  change it — no dropdown, no settings panel.
- **R29** The chosen state persists across scene changes within the session.
- **R30** Changing state cross-fades over 600 ms. It must never hard-cut.

### Content
- **R31** All copy, project entries, and links live in `src/data/content.js`. No text is
  hardcoded in HTML or engine files. Adding a project must be a one-object edit.

---

## 7. Technical architecture

### 7.1 Stack — v1
Plain HTML, CSS, and ES modules. No build step, no bundler, no npm dependencies.

Run it with `python3 -m http.server 8000` and open `localhost:8000`. That is the whole
toolchain. (`file://` will *not* work — ES modules are blocked by CORS on the file
protocol. This trips up everyone once.)

### 7.2 Rendering: DOM, not canvas
Everything is positioned `<div>` and `<img>` elements moved with CSS `transform`.

Rationale, since this is the biggest architectural call in the project:
- DOM elements can be inspected in DevTools. Canvas is an opaque rectangle. For someone
  learning, debuggability beats performance.
- Links, focus, `Tab` order, and screen readers work for free. On canvas, every one of
  those must be rebuilt by hand, and usually isn't.
- The scene has perhaps 40 moving elements. DOM handles that comfortably. Canvas is the
  right answer at 500+, which this will never reach.

### 7.3 File layout

```
/
├── index.html
├── resume.html
├── CLAUDE.md
├── PRD.md
├── .claude/
│   └── rules/
│       └── design.md
├── src/
│   ├── data/          # pure data — MUST NOT import from engine/
│   │   ├── scenes.js      # the two scenes, walkable polygons, hotspots
│   │   ├── tables.js      # the five tables: dessert, bubble label, panel id
│   │   ├── content.js     # all panel copy, projects, links
│   │   ├── landmarks.js   # { id, name, lat, lon, image } per backdrop
│   │   └── theme.js       # time-of-day state machine
│   ├── engine/        # everything that touches the DOM
│   │   ├── renderer.js
│   │   ├── input.js
│   │   ├── movement.js
│   │   ├── panel.js       # overlay, focus trap, Escape handling
│   │   └── router.js      # hash routing
│   └── styles/
│       ├── tokens.css     # single source of truth for all color/spacing
│       ├── base.css
│       └── scenes.css
└── assets/
    ├── scenes/        # 2 backgrounds (exterior, interior), neutral light
    ├── backdrops/     # far landmark layer, swappable independently
    ├── sprites/       # characters and props, transparent PNG
    └── PROMPTS.md     # generation log — see §8.4
```

### 7.4 Designing now for the framework migration later

"We'll port it to React later" usually means "we'll rewrite it later." One rule prevents
that:

> **Files in `src/data/` must never import from `src/engine/`.**

If scene definitions, content, and theme logic are pure data with no DOM references, then
porting to React + Vite means rewriting only `src/engine/` — roughly a third of the code —
while `src/data/` moves across untouched. If DOM queries leak into the data files, the port
becomes a rewrite. Enforce this from the first commit.

---

## 8. Art pipeline — this is the critical path

The project fails here or nowhere. Code problems have search results; art inconsistency has
no fix except regenerating everything.

### 8.1 Character specification

**Jingwen:** brown hair, curled curtain bangs, worn down. Navy blue top, blue jeans, white
shoes. Face styling follows the reference: simple, friendly, minimal features.

**Junnie:** orange tabby cat, positioned beside Jingwen. Deliberately the warmest, most
saturated object on screen — against a cool pastel palette he becomes the natural focal
point, which is why he reads as the site's mascot without any extra effort.

### 8.2 Generation method

1. Generate **one reference sheet** of Jingwen first — single front-facing pose, flat
   magenta background, at 1024px or larger. Iterate until it is right. Nothing else gets
   generated until this is locked.
2. Every subsequent asset uses that sheet as an **image reference / img2img input**, never
   a text prompt alone. Text-only prompting will not hold a character across assets.
3. **Downscale to final size; never generate at final size.** Generating at 1024 and
   scaling to 180px hides a large number of flaws. Generating at 180px produces mush.
4. Key out the flat background rather than asking for transparency — generated alpha
   channels are usually ragged.

### 8.3 One pose per character — no walk cycles

Do not generate animation frames. Generate one pose and animate it in CSS:

- walking → a 2–3px vertical bob on a ~400 ms loop, plus a 1–2° rotation
- idle → a slower breathing bob, ~2 s
- direction → `transform: scaleX(-1)`, nothing more
- Junnie → a tail-flick achieved by animating a separately generated tail layer, or simply
  a periodic blink overlay

This is the single highest-leverage decision in the art plan. It eliminates the exact
failure mode AI sprite generation is worst at, and reads as convincingly alive.

### 8.4 Asset discipline

Every generated asset gets a line in `assets/PROMPTS.md`:

```
| file | prompt | model | seed | reference image | date |
```

Without this you cannot regenerate a matching asset in three weeks when you need one more
prop. This is not bureaucracy; it is the only version control art has.

### 8.5 Expected failure modes

Budget time for these. They will happen.

- Hands, and anything held
- Clothing color drifting between assets (navy → slate → indigo)
- Line weight and rendering style drifting between props
- Fringing on keyed edges — fix with a 1px erode, not by regenerating
- Perspective mismatch between a sprite and the background it stands on

### 8.6 Rights

Check the terms of whichever generator is used before this goes on a public portfolio, and
note the tool used in the site footer. On a portfolio, quietly passing off generated art as
hand-drawn is a real reputational risk if someone asks. A one-line footer credit removes it
entirely and costs nothing.

---

## 9. Time-of-day system

### The constraint that shapes the design
The original plan implied seven scenes × four times of day = 28 background paintings. Not
achievable. Two decisions collapse it to **three paintings total** for v1:

1. Panels instead of rooms → two scenes, not seven
2. The two *expensive* paintings — exterior and interior — are made once under neutral light
   and tinted in CSS

That is: one exterior, one interior, plus four low-detail distant backdrops, each of which
bakes in its own time of day. Six images total, and only two of them are costly.

### The approach
Paint each scene **once**, under neutral midday light. Time of day is a CSS treatment
applied on top:

1. A full-scene overlay `div` with a tinted translucent color and a blend mode
2. A `filter: brightness() saturate() hue-rotate()` on the scene container
3. A CSS gradient sky, which is genuinely free and can be fully animated
4. At `night` only: warm glow behind the bakery windows, plus dimmed non-glowing sprites

Four moods from one painting. The tokens for all four live in `tokens.css` under
`[data-time="..."]` selectors.

### Layer order in the exterior
```
sky gradient (CSS, fallback only)  →  landmark backdrop (img, time baked in)
   →  tint overlay  →  bakery + garden (img)  →  props  →  characters
   →  UI (clock, location, resume)
```

Two placements that are easy to get wrong and both produce visible bugs:

- **The tint sits ABOVE the backdrop, not below it.** The backdrop already carries its own
  time of day. Applying the night tint on top of an already-night Griffith renders it
  black. The tint exists to bring the *neutral* bakery into agreement with the backdrop.
- **The tint sits BELOW the UI.** Dimming the clock, the location label, and the resume link
  at night would be a bug, not a mood.

The CSS sky gradient is now a loading fallback only, since each backdrop image includes its
own sky.

### Scope
The visible clock and full treatment apply to `exterior`. Interior scenes receive a
subtler version of the same tint, because a room with no windows showing a dramatic sunset
looks wrong. Panels ignore time entirely — they are content surfaces, and content needs to
stay readable.

---

## 10. Quality bar

### Performance budget
| Metric | Budget |
|---|---|
| Initial page weight | < 1.5 MB |
| Largest Contentful Paint, 4G | < 2.5 s |
| Background image, each | < 250 KB, WebP |
| Sprite, each | < 60 KB, PNG with alpha |
| Room assets | Loaded on entering the room, never upfront |

### Accessibility — non-negotiable
- Every interactive element keyboard-reachable with a visible `:focus-visible` outline
- `prefers-reduced-motion: reduce` disables the bob, the fade, and the cross-fade
- All text meets WCAG AA contrast — pastel palettes fail this constantly, so check every
  pairing rather than assuming
- Every image has meaningful `alt` text
- `/resume.html` is the full text equivalent of the whole experience

### Browser support
Current Safari, Chrome, Firefox, Edge. Mobile Safari and Chrome Android are primary, not an
afterthought — most people will open this on a phone.

### 10.3 Deployment: GitHub Pages

Free, static-only (which the architecture already assumes), and the git workflow is itself
worth learning. Four constraints, three of which cause bugs that appear **only after
deploying** — they are invisible locally, which is what makes them expensive.

**Name the repo `allyjing.github.io`.** A repo with that exact name is a *user site*, served
at `https://allyjing.github.io/` — the domain root. Any other name is a *project site*,
served from `https://allyjing.github.io/repo-name/`, which introduces the base-path problem
below and gives a worse URL. Pick the user site.

**Never use a leading slash in any path.** On a project site, `/src/styles/tokens.css`
resolves to the domain root, skipping the `/repo-name/` subdirectory, and every stylesheet,
script, and image 404s — the page renders unstyled. Use `src/styles/tokens.css` and
`./assets/...`. This costs nothing on a user site and saves the whole deploy on a project
site, so just do it everywhere.

**Filename case must match exactly.** GitHub Pages serves from Linux and is strictly
case-sensitive. macOS is not. `assets/sprites/Junnie.png` referenced as `junnie.png` works
on your laptop and 404s in production. Convention for this repo: **all asset filenames
lowercase with hyphens.** No exceptions, no capitals, no underscores.

**Add an empty `.nojekyll` file at the repo root.** GitHub Pages runs Jekyll by default,
which silently ignores files and folders beginning with an underscore. `.nojekyll` turns
that off and serves the files as-is.

Hash routing (R10) needs no server configuration here. Path-based routing would require the
`404.html` redirect workaround, because Pages cannot rewrite unknown paths to `index.html`.

⚠️ On a free GitHub account, Pages requires the repository to be **public**. Do not commit
anything you would not want read — no draft resume with a home address, no unpublished
photos.

---

## 11. Decisions

| # | Decision | Resolution |
|---|---|---|
| D1 | LA landmark | **All of them, as a swappable backdrop layer.** Ship Griffith Observatory in v1; each additional one is a single data object plus one distant image. Bottom-left label cycles them. |
| D2 | Dessert-to-table mapping | Below |
| D3 | Content | Mostly written already. A light content phase remains for gaps and for rewriting existing material to fit panel length. |
| D4 | Hosting | GitHub Pages, repo named `allyjing.github.io`. See §10.3. |
| D5 | Custom domain | Optional, ~$12/yr, addable later with a `CNAME` file and no code changes. |

### D1 — landmark data

All four verified against Wikipedia infobox values, rounded to 4 decimal places (~11 m
precision, far finer than a hand-drawn backdrop deserves).

| id | Landmark | Coordinates | Time | County |
|---|---|---|---|---|
| `hollywood-sign` | Hollywood Sign | 34.1341° N, 118.3216° W | `morning` | Los Angeles |
| `smpier` | Santa Monica Pier | 34.0086° N, 118.4986° W | `noon` | Los Angeles |
| `laguna` | Laguna Beach | 33.5314° N, 117.7692° W | `sunset` | **Orange** |
| `griffith` | Griffith Observatory | 34.1183° N, 118.3003° W | `night` | Los Angeles |

Label format: `Name · 34.1183° N, 118.3003° W`

Two accuracy notes:
- Santa Monica Pier sources vary between ~34.0052 and ~34.0101 because the pier is 500 m
  long and each source picks a different point. Wikipedia's value is used.
- **Laguna Beach is in Orange County, 45 miles (72 km) from downtown LA.** Wikipedia places
  it in the Los Angeles Metropolitan Area, so it belongs in a Greater LA set, but it is not
  Los Angeles. The label shows name and coordinates only, which is accurate as written.
  Do not caption this feature "Los Angeles" anywhere in the UI or on the resume page —
  "Southern California," or no caption at all, is correct.

#### Distinctness — resolved

Locking each landmark to a time of day removed the redundancy entirely. Every landmark now
differs from every other on **both** subject and light:

| Landmark | Subject | Sun | Shadows | Air |
|---|---|---|---|---|
| Hollywood Sign | inland ridge | low, off-frame | cool blue | crisp, clear |
| Santa Monica Pier | pier, flat sand | directly overhead | almost none | hazy, bleached |
| Laguna Beach | cliffs, coves | on the horizon, in frame | near-silhouette | warm haze |
| Griffith Observatory | domed building | none — city lights | dark | deep, dark |

Worth recording *why* this worked, since the earlier versions of this set did not. Griffith
Observatory and the Hollywood Sign are 2.6 km apart — the same hillside — and as neutral
daylight plates they were always going to read as one place shown twice. Geography made them
redundant and no amount of framing was going to fully fix it. Time of day dissolved the
problem because it varies something geography cannot.

The one pair that remains adjacent in *light* is Hollywood Sign (morning) and Laguna Beach
(sunset), both low warm sun. Three differences keep them apart, and all three are in the
prompts:

- Morning light comes from behind the viewer; the sunset sun is **in frame, on the horizon**
- Morning shadows are **cool blue**; sunset shadows are warm and tending to silhouette
- Morning air is the clearest of the day; sunset air is **hazy and glowing**

Subject does the rest: a dry inland ridge and a rocky ocean cove share nothing.

#### Trademark note

The Hollywood Sign is a registered mark of the Hollywood Chamber of Commerce, which licenses
commercial use, and is also a Los Angeles Historic-Cultural Monument. A stylized backdrop on
a personal portfolio is not merchandise — low risk, and extremely common. The other three
are public places with no comparable exposure.

For any landmark added later: depicting a place is fine, reproducing a corporate logo,
wordmark, or licensed character is not. That distinction is why Universal Studios Hollywood
was dropped from this set — its recognizable features are the globe logo and Hogwarts Castle,
both of which are marks rather than landscape.

### D2 — table mapping

| Panel | Dessert | Why |
|---|---|---|
| Experience | Croissant | Laminated — built up in layers over time |
| Projects | Soufflé | Technical, exacting, collapses if rushed |
| Photography | Macarons | Color-matched, arranged in rows like a contact sheet |
| Life | Bolo bao | Home and comfort |
| Arts | Sliced layer cake | The cross-section is the point — it shows what's inside |

Cupcakes and cookies stay as counter decoration. Egg tarts go in the window display.

## 12. Build order

Sequenced so something is on screen early, and so the riskiest work happens while there is
still time to change course.

**Phase 0 — Art spike. Do this first.** Generate and lock exactly five things: the Jingwen
reference sheet, one Junnie sprite, one exterior background, and **two backdrops —
Hollywood Sign at morning and Griffith Observatory at night**.

Those two because they sit at opposite ends of the lighting range. With the redundancy
problem resolved, the open art question is no longer "do these look too alike" but
**"does the shared illustration style survive a full day-to-night swing?"** If it holds
across bright morning and full night, the two in between are interpolations. If the night
image comes back looking like a different artist drew it, that is the real limit of the tool
— found in week one, before anything was built on top of it.

Santa Monica Pier and Laguna Beach are Phase 3 work.

**Phase 1 — Skeleton.** `index.html`, `tokens.css`, hash router, one scene rendering a static
background and a static character. No movement yet.

**Phase 2 — Movement.** Click-to-move, keyboard movement, walkable polygon, the CSS bob.

**Phase 3 — Exterior complete.** Signs, Junnie, garden props, clock, all four time states,
landmark backdrop layer, location label.

**Phase 4 — Resume page. Ship it.** Deploy to GitHub Pages here, not at the end. Two
reasons: R23/R24 are satisfied, so the site is already useful to a recruiter even if
everything after this stalls; and the three deploy-only bugs in §10.3 surface now, while
there are thirty files to check rather than three hundred.

**Phase 5 — Interior.** Hub scene, five tables, panel system with focus trap and `Escape`.
Build the panel mechanics against one panel with placeholder text before writing content.

**Phase 6 — Content.** Fill all five panels. Photography last, since it carries the image
performance work — `srcset`, lazy loading, a lightbox.

**Phase 7 — Polish.** Accessibility audit, performance pass, real-device testing on an
actual phone, final deploy.

Phase 4 is placed deliberately early. It is the phase that makes the project valuable before
it is finished.
