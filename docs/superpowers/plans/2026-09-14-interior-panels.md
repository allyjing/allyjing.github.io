# Interior Panels and Step-Back Exit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the five interior tables open accessible overlay panels, and let Jingwen leave the room by walking down across the front edge instead of clicking a sign.

**Architecture:** A new `src/engine/panel.js` owns every piece of panel DOM. The five table markers move out of the aria-hidden `decor` layer and become real `<button>` elements in the `props` layer. `main.js` stops ignoring `route.panel`, so panels are deep-linkable and the Back button works. The exit generalises the existing door-proximity check so the exterior keeps its point test and the interior gets a line test.

**Tech Stack:** Plain HTML, CSS and ES modules. No build step, no bundler, no npm dependencies. Served by `python3 serve.py`.

**Spec:** `docs/superpowers/specs/2026-09-14-interior-panels-design.md`

## Global Constraints

Copied from CLAUDE.md and the spec. Every task's requirements implicitly include these.

- **`src/data/` must never import from `src/engine/`.** No `document`, no `window`, no DOM in data files.
- **No hardcoded colours outside `src/styles/tokens.css`.** A new colour must be added to `:root` **and all four `[data-time]` blocks** before use.
- **No text content in HTML or engine files.** All copy lives in `src/data/content.js`.
- **Use `transform` for movement, never `top`/`left`.**
- **Every interactive element needs a visible `:focus-visible` style** and must activate on `Enter` **and** `Space`.
- **Respect `prefers-reduced-motion: reduce`** on every animation.
- **No leading slash in any path.** Write `src/styles/panel.css`, never `/src/styles/panel.css`.
- **All asset filenames lowercase-with-hyphens.**
- Scene changes go through the hash router. Never swap scenes by mutating `innerHTML` from a click handler.
- Two scenes only: `exterior` and `interior`. Never add a third.
- Run the server with `python3 serve.py`, **not** `python3 -m http.server` — the `no-store` header is what stops the browser serving a stale ES module after an edit. If the page ignores an edit, suspect this first; Cmd+Shift+R clears it.

### On testing

**This project has no test runner and no linter, and CLAUDE.md forbids adding npm dependencies in v1.** So there is no automated red-green cycle available, and adding one is out of scope.

The discipline is kept in the only form the project supports: **every task ends with a specific, falsifiable browser observation** — an exact URL to open, an exact action, and an exact expected result. Do not mark a step done without performing the check and seeing the stated result. "It should work" is not an observation.

---

## Task 0: Install the new interior artwork — ✅ DONE 2026-09-14

Completed before the other tasks, because every coordinate below depends on it.

- `assets/source/interior.jpeg` — the new master. The previous one is kept as
  `assets/source/interior-original.jpeg`, the way the old exterior is kept.
- `assets/scenes/interior.webp` — **176 KB**, against a 250 KB budget. The source
  JPEG was 887 KB and even quality 60 only reached 275 KB, so WebP was the only way
  under; CLAUDE.md already anticipated the extension change. Encoded with
  `cwebp -q 82`, the quality `PROMPTS.md:341` specifies.
- `assets/scenes/interior.jpg` is **deleted**. `scenes.interior.image` now points at
  the `.webp`.
- Dimensions are unchanged at 1376 × 768, so `aspect: 1376 / 768` still holds.
- `walkable`, the five table coordinates and the "Back outside" sign position were
  all re-traced against the new painting by overlaying a percentage grid and drawing
  candidates onto the art until they sat on clear floor and on real tabletops.

**Do not re-derive these numbers.** They are measured, not guessed.

⚠️ The new artwork paints a ginger cat asleep at the bottom right. Junnie is an actor
in the *exterior* only, so there is no conflict today — but do not also place Junnie
as an actor indoors, or there will be two cats.

⚠️ `bakery interior reference.png` at the repo root is watermarked stock and is
gitignored. Never commit it and never use it as an img2img source.

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `src/data/content.js` | modify | Add `panels` export — all panel copy |
| `src/data/scenes.js` | modify | Interior `tables` array and `exit` descriptor |
| `src/engine/panel.js` | **create** | All panel DOM: build, open, close, focus |
| `src/engine/renderer.js` | modify | `renderTables()` into `props`; stop rendering tables into `decor` |
| `src/engine/main.js` | modify | Honour `route.panel`; generalise the exit check |
| `src/styles/panel.css` | **create** | Panel card, scrim, motion, mobile |
| `src/styles/tokens.css` | modify | Add `--panel-scrim` to `:root` and all four time blocks |
| `index.html` | modify | Panel host element; link `panel.css` |

---

## Task 1: Panel content data

**Files:**
- Modify: `src/data/content.js` (append at end)

**Interfaces:**
- Consumes: nothing.
- Produces: `export const panels` — an object keyed by table id (`experience`, `projects`, `photography`, `life`, `arts`). Each value is `{ title: string, kind: 'entries', intro: string, entries: Entry[] }` where `Entry` is `{ heading: string, meta: string, bullets: string[], links: Array<{label: string, href: string}> }`. Task 3 reads this.

Copy here is **placeholder**, per PRD §12 ("build the panel mechanics against one panel with placeholder text before writing content"). It is deliberately written at realistic length so the card's internal scrolling is genuinely exercised — short stub text would hide a scroll bug. Phase 6 replaces it.

- [ ] **Step 1: Append the `panels` export to `src/data/content.js`**

```js
/* Every panel's copy (PRD R31). Keyed by the table id in `tables` above — the same
 * string is the URL segment in #/interior/projects and the DOM id of the button
 * that opens it, so one typo fails loudly instead of opening nothing.
 *
 * ⚠️ This copy is PLACEHOLDER. Phase 6 replaces it with real content. It is written
 * at realistic length on purpose: stub text one line long would hide the fact that
 * the card has to scroll.
 *
 * `kind` is 'entries' for all five. 'gallery' is reserved for Photography in Phase 6
 * and no gallery renderer exists yet — adding one later is a new branch here, not a
 * change to the shape of the data. */
export const panels = {
  experience: {
    title: 'Experience',
    kind: 'entries',
    intro: 'Where I have worked, and what I actually did there.',
    entries: [
      {
        heading: 'Placeholder role, one',
        meta: 'Organisation · City · Month Year – Present',
        bullets: [
          'Placeholder bullet describing a responsibility in about the length a real one runs to, so the panel is laid out against realistic text rather than a stub.',
          'A second placeholder bullet, because most entries have more than one and the spacing between them needs to be seen.',
        ],
        links: [],
      },
      {
        heading: 'Placeholder role, two',
        meta: 'Organisation · City · Month Year – Month Year',
        bullets: [
          'Placeholder bullet describing a second position, again at realistic length.',
        ],
        links: [],
      },
    ],
  },

  projects: {
    title: 'Projects',
    kind: 'entries',
    intro: 'Things I have designed, built, and occasionally had to rebuild.',
    entries: [
      {
        heading: 'Placeholder project, one',
        meta: 'Tools, materials, techniques · Month Year – Present',
        bullets: [
          'Placeholder bullet describing what was engineered and the constraint that made it interesting, at the length a real project bullet runs to.',
          'A second bullet covering fabrication, because these entries tend to have three.',
          'A third bullet covering control or validation, so the tallest entry in the set is represented here.',
        ],
        links: [],
      },
      {
        heading: 'Placeholder project, two',
        meta: 'Tools, materials, techniques · Month Year – Present',
        bullets: [
          'Placeholder bullet at realistic length describing design and fabrication.',
          'A second placeholder bullet describing the software side.',
        ],
        links: [],
      },
      {
        heading: 'Placeholder project, three',
        meta: 'Tools, materials, techniques · Month Year – Month Year',
        bullets: [
          'Placeholder bullet describing a team project and the role played in it.',
        ],
        links: [],
      },
      {
        heading: 'Placeholder project, four',
        meta: 'Tools · Year',
        bullets: [
          'Placeholder bullet. Four entries is what makes this the panel that proves scrolling works.',
        ],
        links: [],
      },
    ],
  },

  photography: {
    title: 'Photography',
    kind: 'entries',
    intro: 'Placeholder introduction. Phase 6 turns this panel into a real gallery.',
    entries: [
      {
        heading: 'Placeholder set',
        meta: 'Place · Year',
        bullets: [
          'Placeholder bullet. This panel stays kind: "entries" until Jingwen supplies photographs; the gallery renderer with srcset, lazy loading and a lightbox is Phase 6 work.',
        ],
        links: [],
      },
    ],
  },

  life: {
    title: 'Life',
    kind: 'entries',
    intro: 'Placeholder introduction for the things that are not work.',
    entries: [
      {
        heading: 'Placeholder heading',
        meta: 'Placeholder meta line',
        bullets: [
          'Placeholder bullet at realistic length, waiting on real content in Phase 6.',
        ],
        links: [],
      },
    ],
  },

  arts: {
    title: 'Arts',
    kind: 'entries',
    intro: 'Placeholder introduction for drawing, making, and the rest of it.',
    entries: [
      {
        heading: 'Placeholder heading',
        meta: 'Placeholder meta line',
        bullets: [
          'Placeholder bullet at realistic length, waiting on real content in Phase 6.',
        ],
        links: [],
      },
    ],
  },
};
```

- [ ] **Step 2: Verify the file still parses and the site still boots**

Run: `python3 serve.py`, open `http://localhost:8000/#/interior`

Expected: the room renders exactly as before, and the DevTools console shows **no errors**. A syntax error in `content.js` breaks every module that imports it, so a clean boot is the check.

- [ ] **Step 3: Verify the export is reachable and correctly shaped**

In the DevTools console:

```js
const m = await import('./src/data/content.js');
Object.keys(m.panels);                    // ["experience","projects","photography","life","arts"]
m.panels.projects.entries.length;         // 4
```

Expected: exactly those five keys, in that order, and `4`.

- [ ] **Step 4: Commit**

```bash
git add src/data/content.js
git commit -m "Add panel copy as data, with placeholder text"
```

---

## Task 2: Tables become real buttons in the props layer

**Files:**
- Modify: `src/data/scenes.js:138-190` (the `interior` scene object)
- Modify: `src/engine/renderer.js:146-179` (`renderDecor`), and the `renderScene` body around line 314

**Interfaces:**
- Consumes: `tables` and `dessertShape` from `content.js` (already imported by both files).
- Produces: `scenes.interior.tables` — an array of `{ id, label, dessert, x, y }` where `id` is the bare table id (`projects`, not `table-projects`). A DOM button with `id="table-<id>"` exists for each. Task 3 focuses these; Task 5 routes to them.

**Why this task exists:** the tables currently render into the `decor` layer, which is `aria-hidden="true"` in `index.html:60`. An interactive control inside an aria-hidden container is invisible to assistive technology — so as panel triggers they would be unreachable by exactly the people who most need them. `renderer.js:144` already anticipates this move.

- [ ] **Step 1: In `src/data/scenes.js`, rename the interior's `decor` to `tables` and drop the id prefix**

Replace the `decor:` block in the `interior` object (find it with `grep -n "decor: tables.map" src/data/scenes.js`):

```js
    /* One marker per painted table. x/y is the TABLE SURFACE — the dessert sits
     * there and the bubble floats above it. Read off the artwork. */
    decor: tables.map((table, i) => ({
      ...table,
      id: `table-${table.id}`,
      kind: 'table',
      /* Read off the new artwork 2026-09-14, in the table order in content.js:
       * experience, projects, photography, life, arts. */
      ...[{ x: 37, y: 54 }, { x: 52, y: 60 }, { x: 67, y: 54 },
          { x: 40, y: 70 }, { x: 73, y: 70 }][i],
    })),
```

with:

```js
    decor: [],

    /* One trigger per painted table. x/y is the TABLE SURFACE — the dessert sits
     * there and the bubble floats above it. Read off the artwork.
     *
     * These are BUTTONS in the props layer, not scenery in the decor layer. The
     * decor layer is aria-hidden, and a control a screen reader cannot see is not a
     * control. The id is bare (`projects`), because the same string is the panels
     * key and the URL segment; the DOM id gets the `table-` prefix at render. */
    tables: tables.map((table, i) => ({
      ...table,
      /* Read off the new artwork 2026-09-14, in the table order in content.js:
       * experience, projects, photography, life, arts. */
      ...[{ x: 37, y: 54 }, { x: 52, y: 60 }, { x: 67, y: 54 },
          { x: 40, y: 70 }, { x: 73, y: 70 }][i],
    })),
```

- [ ] **Step 2: In `src/engine/renderer.js`, delete the table branch from `renderDecor`**

`renderDecor` becomes scenery-only. Replace the whole function (currently `src/engine/renderer.js:146-179`) with:

```js
/* Scenery only. No link, no button, not focusable, and the layer is aria-hidden —
 * this is painted detail, and a screen reader announcing it as a control that does
 * nothing would be worse than silence. The interior tables used to live here; they
 * are real buttons in the props layer now (see renderTables). */
function renderDecor(items) {
  const layer = el('decor');
  layer.replaceChildren();
  if (!items) return;

  for (const item of items) {
    const node = document.createElement('div');
    node.className = 'sign sign--decor';
    node.style.left = `${item.x}%`;
    node.style.top = `${item.y}%`;

    const board = document.createElement('div');
    board.className = 'sign__board';
    board.textContent = item.label;
    node.append(board);
    layer.append(node);
  }
}
```

- [ ] **Step 3: Add `renderTables` directly below `renderDecor`**

```js
/* The five interior tables, as real buttons (PRD D2).
 *
 * APPENDS to the props layer rather than replacing it, because renderSigns has
 * already filled it and owns the clearing. Call order in renderScene matters:
 * signs first, then tables.
 *
 * The table itself is painted into the artwork. What gets added is the dessert
 * sitting on it and the bubble floating above, so the stack grows upward from the
 * table surface at x/y. */
function renderTables(items, onOpen) {
  const layer = el('props');
  if (!items) return;

  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'table';
    button.id = `table-${item.id}`;
    button.style.left = `${item.x}%`;
    button.style.top = `${item.y}%`;

    /* aria-haspopup tells a screen reader this opens a dialog rather than
     * navigating; aria-expanded tracks whether it currently is open. */
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', 'false');

    const bubble = document.createElement('span');
    bubble.className = 'bubble';
    bubble.textContent = item.label;

    const dessert = document.createElement('span');
    dessert.className = `dessert dessert--${dessertShape[item.id] || 'cake'}`;
    /* The dessert name is decoration, not information — the bubble already carries
     * the label that matters, so this is a title rather than an aria-label. */
    dessert.title = item.dessert;

    button.append(bubble, dessert);
    /* A <button> fires click on Enter AND Space for free. That is the whole reason
     * this is a button rather than a div with a handler. */
    button.addEventListener('click', () => onOpen(item.id));
    layer.append(button);
  }
}
```

- [ ] **Step 4: Call `renderTables` from `renderScene`**

In `src/engine/renderer.js`, find:

```js
  renderSigns(scene.signs);
  renderDecor(scene.decor);
  renderActors(scene.actors);
```

and change it to:

```js
  renderSigns(scene.signs);
  renderTables(scene.tables, onOpenTable);
  renderDecor(scene.decor);
  renderActors(scene.actors);
```

Then widen `renderScene`'s signature at `src/engine/renderer.js:286` from `renderScene(sceneId, time)` to `renderScene(sceneId, time, onOpenTable = () => {})`. The default keeps the exterior — which has no tables — working unchanged.

- [ ] **Step 5: In `src/engine/main.js`, pass a handler that navigates**

At `src/engine/main.js:46`, change `const scene = renderScene(sceneId, time);` to:

```js
  /* Opening a table is a ROUTE change, not a direct call. That is what makes
   * #/interior/projects shareable and the Back button work (R10). */
  const scene = renderScene(sceneId, time, (id) => navigate('interior', id));
```

- [ ] **Step 6: Add the `.table` button style to `src/styles/scenes.css`**

Find the existing `.table-marker` rule and rename the selector to `.table`, then add the button reset — a `<button>` arrives with browser chrome that has to be removed:

```css
/* The table trigger. A real <button>, so Enter and Space work without any key
   handling of our own — but a button arrives with borders, background and centred
   text that have to be cleared before it looks like part of the room. */
.table {
  /* button reset */
  appearance: none;
  border: 0;
  background: none;
  padding: 0;
  font: inherit;
  color: inherit;
  text-align: inherit;

  cursor: pointer;
  /* Comfortably tappable on a phone even though the painted table is small. */
  min-width: var(--tap-min);
  min-height: var(--tap-min);
}
```

Keep every existing `.table-marker` declaration — rename the selector, do not delete the rules. There are **three** occurrences in `src/styles/scenes.css`, and two are compound selectors that are easy to miss:

- `src/styles/scenes.css:384` — `.table-marker {`
- `src/styles/scenes.css:412` — `.table-marker::after {`
- `src/styles/scenes.css:512` — `.table-marker:nth-child(even) .bubble {`

Rename all three. Then confirm none survive:

```bash
grep -c "table-marker" src/styles/scenes.css    # expected: 0
```

⚠️ `:nth-child(even)` at line 512 staggers the bubble animation. The buttons are appended to `props` **after** the signs, so their sibling positions shift — the stagger may alternate differently than before. That is cosmetic, not broken; note it and move on.

- [ ] **Step 7: Verify the tables are focusable, labelled buttons**

Run: `python3 serve.py`, open `http://localhost:8000/#/interior`

Do this, and confirm each result:

1. Press Tab repeatedly. Expected: focus lands on each of the five tables, each showing a visible berry-coloured focus ring (from `base.css:36`).
2. With a table focused, press **Enter**. Expected: the URL becomes `#/interior/<id>` — e.g. `#/interior/projects`. Nothing else visibly happens yet; the router still ignores the panel segment. That is correct at this stage.
3. With a table focused, press **Space**. Expected: same URL change. If Space scrolls the page instead, the element is not a real `<button>` — fix that rather than adding a key handler.
4. Click a table with the mouse. Expected: URL changes, and **Jingwen does not walk to it** (`input.js:24` already excludes `.table` from ground clicks).
5. In the console, run `document.querySelector('#table-projects').closest('[aria-hidden="true"]')`. Expected: **`null`**. Anything else means the button is still inside an aria-hidden container and the task is not done.

- [ ] **Step 8: Commit**

```bash
git add src/data/scenes.js src/engine/renderer.js src/engine/main.js src/styles/scenes.css
git commit -m "Make the interior tables real buttons, out of the aria-hidden layer"
```

---

## Task 3: The panel module — build, open, close

**Files:**
- Create: `src/engine/panel.js`
- Create: `src/styles/panel.css`
- Modify: `src/styles/tokens.css` (add `--panel-scrim` to `:root` and all four time blocks)
- Modify: `index.html` (host element, stylesheet link)

**Interfaces:**
- Consumes: `panels` from `src/data/content.js` (Task 1); buttons with id `table-<id>` (Task 2).
- Produces: `openPanel(id)`, `closePanel()`, `isOpen()` from `src/engine/panel.js`. `openPanel` returns `true` if a panel with that id exists and was opened, `false` otherwise. Task 4 extends this module; Task 5 calls it.

⚠️ **Correction to the spec.** The spec claims no new colour is needed. That is wrong: the scrim behind the card is a colour, and the hard rule requires it in `:root` **and all four** `[data-time]` blocks. The card's shadow reuses the existing `--shadow-cast`, which is already defined in all four.

- [ ] **Step 1: Add the scrim token to `src/styles/tokens.css`**

In `:root`, directly below `--shadow-cast`:

```css
  --panel-scrim:    rgba(62, 48, 56, 0.55);  /* dim behind an open panel */
```

Then add one line to **each** of the four time blocks, beside that block's existing `--shadow-cast`. The hue follows the same logic the shadows already use — cool in the morning, warm at sunset, near-black at night:

```css
/* in [data-time="morning"] */
  --panel-scrim:  rgba(58, 70, 110, 0.55);

/* in [data-time="noon"] */
  --panel-scrim:  rgba(62, 48, 56, 0.55);

/* in [data-time="sunset"] */
  --panel-scrim:  rgba(110, 48, 32, 0.55);

/* in [data-time="night"] */
  --panel-scrim:  rgba(14, 18, 40, 0.68);
```

- [ ] **Step 2: Verify the token exists in all five places**

Run:

```bash
grep -c "panel-scrim" src/styles/tokens.css
```

Expected: **`5`** (`:root` plus four time blocks). Any other number means a block was missed, and the panel will be wrong three-quarters of the time.

- [ ] **Step 3: Add the panel host to `index.html`**

Immediately **after** the closing `</div>` of `.stage` and **before** the `<script type="module">` line, add:

```html
<!-- The overlay panel a table opens. Outside .stage deliberately: the stage gets
     `inert` while a panel is open, and a panel nested inside it would inert itself.
     Empty here — src/engine/panel.js fills it, because copy lives in content.js. -->
<div class="panel" id="panel" hidden>
  <div class="panel__scrim" data-close></div>
  <div class="panel__card" role="dialog" aria-modal="true" aria-labelledby="panel-title">
    <header class="panel__bar">
      <h2 class="panel__title" id="panel-title"></h2>
      <button class="panel__close" type="button" data-close></button>
    </header>
    <div class="panel__body" id="panel-body"></div>
  </div>
</div>
```

Then add the stylesheet, after the `ui.css` link in `<head>`:

```html
<link rel="stylesheet" href="src/styles/panel.css">
```

- [ ] **Step 4: Add the close button's label to `src/data/content.js`**

The close button's text is copy, so it cannot be typed into HTML or into `panel.js`. Append to `content.js`:

```js
/* The panel's own chrome. Copy, so it lives here and not in panel.js (R31). */
export const panelChrome = {
  close: 'Close',
  closeAria: 'Close this panel',
};
```

- [ ] **Step 5: Create `src/engine/panel.js`**

```js
/* Repo path: src/engine/panel.js
 *
 * The overlay panel a table opens. This module owns every piece of panel DOM —
 * nothing else writes into #panel.
 *
 * There is no third scene: each of the five tables opens a panel OVER the interior
 * (PRD R7/R11). The panel is not a route of its own either; main.js drives it from
 * the hash, so #/interior/projects is shareable and Back closes it.
 *
 * Focus handling lives in this file too, added in the next task.
 */

import { panels, panelChrome } from '../data/content.js';

function el(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`panel: #${id} is missing from index.html`);
  return node;
}

/* Which table opened it, so focus can be handed back on close. */
let opener = null;

export function isOpen() {
  return !el('panel').hidden;
}

/* Fills the card from data. Rebuilt on every open rather than cached: five small
 * panels are cheap to build, and a cache would be one more thing to invalidate. */
function fill(panel) {
  el('panel-title').textContent = panel.title;

  const body = el('panel-body');
  body.replaceChildren();

  if (panel.intro) {
    const intro = document.createElement('p');
    intro.className = 'panel__intro';
    intro.textContent = panel.intro;
    body.append(intro);
  }

  for (const entry of panel.entries) {
    const article = document.createElement('article');
    article.className = 'entry';

    const heading = document.createElement('h3');
    heading.textContent = entry.heading;
    article.append(heading);

    if (entry.meta) {
      const meta = document.createElement('p');
      meta.className = 'entry__meta';
      meta.textContent = entry.meta;
      article.append(meta);
    }

    if (entry.bullets && entry.bullets.length) {
      const list = document.createElement('ul');
      for (const text of entry.bullets) {
        const item = document.createElement('li');
        item.textContent = text;
        list.append(item);
      }
      article.append(list);
    }

    /* links is optional: omitted and [] both mean none. */
    if (entry.links && entry.links.length) {
      const links = document.createElement('p');
      links.className = 'entry__links';
      for (const link of entry.links) {
        const anchor = document.createElement('a');
        anchor.href = link.href;
        anchor.textContent = link.label;
        if (link.href.startsWith('http')) {
          anchor.target = '_blank';
          anchor.rel = 'noopener noreferrer';   // required with target=_blank
        }
        links.append(anchor);
      }
      article.append(links);
    }

    body.append(article);
  }
}

/* Opens the panel for a table id. Returns false for an unknown id and does nothing
 * else — a typo in a shared link must not produce a broken page. */
export function openPanel(id) {
  const panel = panels[id];
  if (!panel) return false;
  if (isOpen()) closePanel();

  fill(panel);

  opener = document.getElementById(`table-${id}`);
  if (opener) opener.setAttribute('aria-expanded', 'true');

  el('panel').hidden = false;

  /* The room behind must be unreachable — by Tab, by click and by screen reader.
   * `inert` covers all three; aria-hidden is set alongside so the intent survives
   * anywhere inert is not supported. */
  const stage = el('stage');
  stage.setAttribute('inert', '');
  stage.setAttribute('aria-hidden', 'true');

  return true;
}

export function closePanel() {
  if (!isOpen()) return;              // safe to call twice

  el('panel').hidden = true;

  const stage = el('stage');
  stage.removeAttribute('inert');
  stage.removeAttribute('aria-hidden');

  if (opener) {
    opener.setAttribute('aria-expanded', 'false');
    opener = null;
  }
}

/* Wires the three ways to close (PRD: button, Escape, AND backdrop click) and the
 * close button's label. Called once at boot. `onClose` lets main.js turn a close
 * into a route change instead of a bare DOM update. */
export function bindPanel(onClose) {
  const node = el('panel');

  const closeButton = node.querySelector('.panel__close');
  closeButton.textContent = panelChrome.close;
  closeButton.setAttribute('aria-label', panelChrome.closeAria);

  /* Both the scrim and the close button carry data-close, so one handler covers
   * the backdrop click and the button. Clicks inside the card do not match. */
  node.addEventListener('click', (event) => {
    if (event.target.hasAttribute('data-close')) onClose();
  });

  /* Escape is listened for on the window, not the panel: focus could legitimately
   * be on the card itself, and a listener on the panel would miss key presses that
   * land elsewhere. */
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) onClose();
  });
}
```

- [ ] **Step 6: Create `src/styles/panel.css`**

```css
/* Repo path: src/styles/panel.css
 *
 * The overlay panel a table opens. Every colour comes from tokens.css.
 */

.panel {
  position: fixed;
  inset: 0;
  z-index: var(--z-panel);        /* 200 — never a bare z-index */
  display: grid;
  place-items: center;
  padding: var(--space-4);
}

/* `hidden` is overridden by `display: grid` above, so it has to be restated.
   This is the one place the attribute needs help. */
.panel[hidden] { display: none; }

.panel__scrim {
  position: absolute;
  inset: 0;
  background: var(--panel-scrim);
}

.panel__card {
  position: relative;             /* above the scrim, without a new z-index */
  width: min(680px, 90vw);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;               /* so the header's corners stay rounded */
  background: var(--surface-wall);
  border-radius: var(--radius-lg);
  box-shadow: 0 10px 30px var(--shadow-cast);
}

.panel__bar {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--surface-trim);
}

.panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-xl);
  line-height: var(--leading-tight);
  color: var(--ink);
}

.panel__close {
  appearance: none;
  border: 0;
  cursor: pointer;
  font: inherit;
  font-family: var(--font-ui);
  padding: var(--space-2) var(--space-3);
  min-height: var(--tap-min);
  border-radius: var(--radius-full);
  background: var(--accent-berry);
  color: var(--on-accent);
}

/* The only scrolling region. Projects is four entries and will not fit any
   viewport, so this is load-bearing rather than defensive. */
.panel__body {
  overflow-y: auto;
  padding: var(--space-4);
  font-family: var(--font-ui);
  font-size: var(--text-base);
  line-height: var(--leading-body);
  color: var(--ink);
}

.panel__intro {
  margin: 0 0 var(--space-6);
  color: var(--ink-soft);
}

.entry { margin-bottom: var(--space-6); }
.entry:last-child { margin-bottom: 0; }

.entry h3 {
  margin: 0 0 var(--space-1);
  font-family: var(--font-display);
  font-size: var(--text-lg);
  line-height: var(--leading-tight);
}

.entry__meta {
  margin: 0 0 var(--space-2);
  font-size: var(--text-sm);
  color: var(--ink-soft);
}

.entry ul { margin: 0; padding-left: var(--space-6); }
.entry li { margin-bottom: var(--space-2); }

.entry__links { margin: var(--space-3) 0 0; }
.entry__links a { color: var(--accent-berry); }
```

- [ ] **Step 7: Verify open and close from the console**

Run: `python3 serve.py`, open `http://localhost:8000/#/interior`

In the DevTools console:

```js
const p = await import('./src/engine/panel.js');
p.bindPanel(() => p.closePanel());
p.openPanel('projects');
```

Confirm each:

1. A centred card appears titled **Projects**, over a dimmed room.
2. It lists **four** entries, and the body **scrolls** while the header stays put.
3. `p.openPanel('nonsense')` returns **`false`** and nothing appears.
4. Press **Escape**. Expected: the card closes.
5. `p.openPanel('life')`, then click the dimmed area outside the card. Expected: closes.
6. `p.openPanel('life')`, then click the **Close** button. Expected: closes.
7. `p.openPanel('arts')`, then in the console: `document.getElementById('stage').hasAttribute('inert')` → **`true`**. After closing → **`false`**.

- [ ] **Step 8: Commit**

```bash
git add index.html src/data/content.js src/engine/panel.js src/styles/panel.css src/styles/tokens.css
git commit -m "Add the panel overlay, with its three ways to close"
```

---

## Task 4: Focus trap and focus return

**Files:**
- Modify: `src/engine/panel.js`

**Interfaces:**
- Consumes: `openPanel`/`closePanel`/`opener` from Task 3.
- Produces: no new exports. `openPanel` now moves focus into the card; `closePanel` returns it to the opening table.

A dialog that does not trap focus lets a keyboard user Tab into a room they cannot see. `inert` on the stage already blocks most of that, but the browser chrome and the address bar are still reachable, and wrapping is what makes the card feel like a contained thing.

- [ ] **Step 1: Add the focusable-elements helper and the trap, above `openPanel`**

```js
/* Everything inside the card that can take focus, in DOM order. Queried fresh on
 * each Tab rather than cached at open: the body is rebuilt per panel, and a stale
 * list would trap focus against elements that no longer exist. */
function focusables() {
  return Array.from(
    el('panel').querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
}

/* Tab from the last focusable wraps to the first, Shift+Tab from the first wraps to
 * the last. Without this, Tab walks out of the dialog into the page behind it. */
function trapFocus(event) {
  if (event.key !== 'Tab' || !isOpen()) return;

  const items = focusables();
  if (!items.length) return;

  const first = items[0];
  const last = items[items.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
```

- [ ] **Step 2: Move focus in, at the end of `openPanel`**

In `openPanel`, immediately before `return true;`:

```js
  /* Focus the close button rather than the card: it is the one control every panel
   * has, and it tells a screen-reader user immediately how to get out. */
  el('panel').querySelector('.panel__close').focus();
```

- [ ] **Step 3: Return focus on close**

In `closePanel`, replace the existing `if (opener) { ... }` block with:

```js
  if (opener) {
    opener.setAttribute('aria-expanded', 'false');
    /* Focus goes back to the table that opened the panel, so a keyboard user
     * resumes where they were instead of at the top of the document. Order
     * matters: the stage must have lost `inert` first, or this focus call is
     * silently ignored. */
    opener.focus();
    opener = null;
  }
```

Confirm in the file that `stage.removeAttribute('inert')` appears **above** this block. If it does not, move it.

- [ ] **Step 4: Register the trap in `bindPanel`**

At the end of `bindPanel`:

```js
  window.addEventListener('keydown', trapFocus);
```

- [ ] **Step 5: Verify the trap and the return**

Run: `python3 serve.py`, open `http://localhost:8000/#/interior`

In the console: `const p = await import('./src/engine/panel.js'); p.bindPanel(() => p.closePanel());`

Then, **using only the keyboard**:

1. Tab to the **Projects** table, press Enter to focus it, then run `p.openPanel('projects')`.
2. Expected: focus is on the **Close** button (check `document.activeElement`).
3. Press Tab repeatedly, at least ten times. Expected: focus cycles **only** among controls inside the card and **never** reaches a table or the clock. Watch the focus ring — if it vanishes, it has left the card.
4. Press Shift+Tab from the Close button. Expected: focus wraps to the **last** focusable in the card, not out of it.
5. Press Escape. Expected: the panel closes **and** focus is back on the Projects table — confirm with `document.activeElement.id` → **`table-projects`**.
6. Repeat 5 using the Close button, then again using a backdrop click. Expected: focus returns to `table-projects` every time.

- [ ] **Step 6: Commit**

```bash
git add src/engine/panel.js
git commit -m "Trap focus in the panel and hand it back on close"
```

---

## Task 5: Route the panel

**Files:**
- Modify: `src/engine/main.js:78-82` (the `startRouter` callback) and the boot section

**Interfaces:**
- Consumes: `openPanel`, `closePanel`, `isOpen`, `bindPanel` from `src/engine/panel.js`; `navigate` from `src/engine/router.js` (already imported).
- Produces: nothing new. `#/interior/<id>` is now a working deep link.

- [ ] **Step 1: Import the panel module in `src/engine/main.js`**

Add beside the other engine imports:

```js
import { openPanel, closePanel, isOpen, bindPanel } from './panel.js';
```

- [ ] **Step 2: Bind the panel once, at boot**

After `updateChrome(time);` and before `let teardown = [];`:

```js
/* Closing is a route change, not a direct DOM call: that is what makes the Back
 * button leave the panel rather than the site (R10). */
bindPanel(() => navigate('interior'));
```

- [ ] **Step 3: Replace the router callback**

Replace this (currently at `src/engine/main.js:78-82`):

```js
startRouter((route) => {
  enterScene(getScene(route.scene) ? route.scene : 'exterior');
  // route.panel is parsed and deliberately ignored until Phase 5.
});
```

with:

```js
startRouter((route) => {
  const sceneId = getScene(route.scene) ? route.scene : 'exterior';
  enterScene(sceneId);

  /* The scene is rendered FIRST, every time. The panel's opener is the table button
   * that enterScene just created, and on a cold load of #/interior/projects that
   * button does not exist until this point — open before it and focus has nowhere
   * to return to when the panel closes.
   *
   * Panels exist only indoors: #/exterior/projects renders the exterior, no panel.
   * An unknown id opens nothing, so a typo in a shared link is a plain room. */
  if (sceneId === 'interior' && route.panel) {
    openPanel(route.panel);
  } else if (isOpen()) {
    closePanel();
  }
});
```

- [ ] **Step 4: Verify deep links, cold loads and Back**

Run: `python3 serve.py`. Check each:

1. Open `http://localhost:8000/#/interior`, click the Projects table. Expected: URL becomes `#/interior/projects` and the panel opens.
2. Press Escape. Expected: panel closes, URL returns to `#/interior`.
3. **Cold load:** paste `http://localhost:8000/#/interior/projects` into a **new tab**. Expected: the room renders **and** the panel is already open. Then press Escape — expected: it closes and focus lands on the Projects table (`document.activeElement.id` → `table-projects`). This is the case most likely to be broken.
4. With the panel open, press the browser **Back** button. Expected: the panel closes and you are at `#/interior` — **not** back at the exterior and **not** off the site.
5. Open `http://localhost:8000/#/interior/nonsense` in a new tab. Expected: the room renders, no panel, **no console error**.
6. Open `http://localhost:8000/#/exterior/projects`. Expected: the exterior renders with no panel and no error.
7. Open each of the five tables in turn and confirm each shows its own title.

- [ ] **Step 5: Commit**

```bash
git add src/engine/main.js
git commit -m "Make panels deep-linkable through the hash router"
```

---

## Task 6: The step-back exit

**Files:**
- Modify: `src/data/scenes.js` (interior: add `exit`)
- Modify: `src/engine/main.js:56-72` (the `entered` latch and the `createWalker` call inside `enterScene`)

**Interfaces:**
- Consumes: `scene.door` (exterior, existing) and `scene.exit` (interior, new).
- Produces: `scenes.interior.exit` — `{ edge: 'bottom', at: number, to: string }`.

✅ **The new artwork has landed and the coordinates are already re-traced** (Task 0, done 2026-09-14). `walkable`, the five table positions and the "Back outside" sign position in `src/data/scenes.js` are all measured against `assets/scenes/interior.webp`. Do not re-derive them; this task only adds `exit`.

- [ ] **Step 1: Add `exit` to the interior scene in `src/data/scenes.js`**

Directly below the comment block that begins "No walk-in trigger here, unlike the exterior" and above `signs:`, add:

```js
    /* Walking down across the front of the room leaves it. There is no painted door
     * to walk to, so the front EDGE is the way out — stepping toward the viewer is
     * stepping back outside.
     *
     * `at` is an image-space y, like every other coordinate in this file. It sits
     * just inside the polygon's bottom edge (y 97), not on it, so she reaches the
     * trigger while still on painted floor.
     *
     * 95 sits between the polygon's foreground edge (y 98) and the y-90 spans, so
     * she reaches it while still on painted floor. */
    exit: { edge: 'bottom', at: 95, to: 'exterior' },
```

The "Back outside" sign in `signs` stays exactly as it is. It is the only focusable, keyboard-operable way out, and removing it would be an accessibility regression.

- [ ] **Step 2: Generalise the transition check in `src/engine/main.js`**

Replace `src/engine/main.js:56-72` in full — the `entered` declaration through the closing `});` of `createWalker` — with:

```js
  /* `left` latches so arriving at the way out does not re-fire the transition on
   * every frame while she stands there. */
  let left = false;
  /* The previous frame's y, so the exit can tell walking DOWN from merely being
   * near the bottom. Seeded with her start so the first frame compares sanely. */
  let lastY = player.y;

  const walker = createWalker({
    start: { x: player.x, y: player.y },
    polygon: scene.walkable,
    onMove: (position, facing, moving, heading) => {
      setActorPose(sprite, player, heading);
      placeActor(sprite, position, facing, moving);

      const movingDown = position.y > lastY;
      lastY = position.y;
      if (left) return;

      /* Two shapes of way-out, one per scene.
       *
       * Outdoors it is a POINT: the bakery door, entered by getting close to it.
       *
       * Indoors it is the front EDGE of the room, and crossing it must also mean
       * moving DOWNWARD. Without that, any click low on the screen ejects a
       * visitor who was only trying to walk to a table.
       *
       * ⚠️ Do NOT use `heading` for this. movement.js collapses it to 'side'
       * whenever horizontal movement dominates, so a diagonal walk toward the
       * bottom-left reports 'side', not 'front', and the exit would silently never
       * fire. `heading` picks a sprite pose; it is not a direction of travel. */
      const door = scene.door;
      if (door && Math.hypot(position.x - door.x, position.y - door.y) <= door.radius) {
        left = true;
        navigate(door.to);
        return;
      }

      const exit = scene.exit;
      if (exit && movingDown && position.y >= exit.at) {
        left = true;
        navigate(exit.to);
      }
    },
  });
```

- [ ] **Step 3: Verify the exit fires only on a deliberate step**

Run: `python3 serve.py`, open `http://localhost:8000/#/interior`

Check each:

1. Click low on the floor, near the **bottom** of the room, so she walks downward to it. Expected: she reaches the front edge and the scene changes to the exterior.
2. Go back inside. Click a table near the **top** of the room so she walks **upward**. Expected: she walks there and **stays inside**.
3. Go back inside. Walk her to the bottom-left **diagonally** (click the bottom-left corner of the floor). Expected: she still exits — this is the case that a `heading`-based test would have broken.
4. Go back inside and walk her along the bottom edge **sideways** without descending — click a point at the same height to her left or right. Expected: she does **not** exit.
5. Press the Down arrow key and hold it. Expected: she walks down and exits, same as clicking.
6. Go back inside and click the **"Back outside"** sign. Expected: it still works.
7. Open a panel, then close it. Expected: she has not moved and has not exited.

- [ ] **Step 4: Commit**

```bash
git add src/data/scenes.js src/engine/main.js
git commit -m "Leave the bakery by walking back out of the room"
```

---

## Task 7: Motion, mobile and contrast

**Files:**
- Modify: `src/styles/panel.css`

**Interfaces:**
- Consumes: the panel markup and classes from Task 3.
- Produces: nothing new.

- [ ] **Step 1: Add the open animation, gated on reduced motion**

Append to `src/styles/panel.css`:

```css
/* Gated on no-preference, matching ui.css:191 and scenes.css:241. Anyone who has
   asked for reduced motion gets the panel with no movement at all — it simply is
   there. The rule is opt-IN, so that is the default if the query does not match. */
@media (prefers-reduced-motion: no-preference) {
  .panel:not([hidden]) .panel__card {
    animation: panel-rise var(--dur-scene) var(--ease-soft);
  }

  .panel:not([hidden]) .panel__scrim {
    animation: panel-fade var(--dur-scene) var(--ease-soft);
  }
}

@keyframes panel-rise {
  from { opacity: 0; transform: translateY(8px); }   /* transform, never top */
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes panel-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

- [ ] **Step 2: Add the small-screen layout**

Append:

```css
/* 90vw of a 390px phone is not a comfortable measure, and 85vh wastes the screen
   when the panel is the only thing on it. Below 600px the card takes the room. */
@media (max-width: 600px) {
  .panel { padding: var(--space-2); }

  .panel__card {
    width: 100%;
    max-height: 92vh;
    border-radius: var(--radius-md);
  }

  .panel__title { font-size: var(--text-lg); }
  .panel__body  { padding: var(--space-3); }
}
```

- [ ] **Step 3: Verify motion, reduced motion, and the phone layout**

Run: `python3 serve.py`

1. Open a panel on a desktop-sized window. Expected: the card fades and rises very slightly.
2. Turn on reduced motion — macOS: System Settings → Accessibility → Display → Reduce motion. Reload, open a panel. Expected: the card appears with **no** movement and **no** fade, and is fully usable.
3. Turn reduced motion back off.
4. In DevTools, switch to a device emulating **390 × 844**. Open each of the five panels. Expected: the card fills nearly the full width, the title still fits on one line, and the body scrolls.
5. At 390 × 844, confirm the Close button is comfortably tappable — at least 44px tall.
6. At 390 × 844, confirm the room behind still cannot be scrolled or tapped while a panel is open.

- [ ] **Step 4: Check contrast with a real checker**

Pastel palettes fail WCAG AA constantly — CLAUDE.md calls this out specifically, and assuming a pairing passes is how it gets missed.

Check these three pairings at https://webaim.org/resources/contrastchecker/ and record the ratios:

| Foreground | Background | Needs |
|---|---|---|
| `--ink` `#3E3038` | `--surface-wall` `#FBF7F4` | 4.5:1 (body text) |
| `--ink` `#3E3038` | `--surface-trim` `#F2C8D3` | 4.5:1 (panel title) |
| `--on-accent` `#FFFFFF` | `--accent-berry` `#B84A6E` | 4.5:1 (close button) |

Expected: all three at or above 4.5:1. `--accent-berry` on `--on-accent` is documented at 4.95:1 in `tokens.css:17`, so that one should pass. **If the title on `--surface-trim` fails, stop and report it** rather than shipping it — the fix is a token change and needs its own decision.

- [ ] **Step 5: Run the full spec checklist**

Work through all 13 items in the spec's Verification section (`docs/superpowers/specs/2026-09-14-interior-panels-design.md`), at desktop size and again at 390 × 844. Note any that fail.

- [ ] **Step 6: Commit**

```bash
git add src/styles/panel.css
git commit -m "Give the panel its motion, its phone layout and a contrast pass"
```

---

## Self-review notes

**Spec coverage.** Every spec section maps to a task: §1 data → Task 1; §2 aria-hidden layer → Task 2; §3 panel module → Tasks 3 and 4; §4 router → Task 5; §5 step-back exit → Task 6; §6 verification → distributed per task, with the full checklist in Task 7 Step 5.

**One correction to the spec, made in Task 3.** The spec says "No new colour is needed." That is wrong — the scrim is a colour, so `--panel-scrim` is added to `:root` and all four `[data-time]` blocks, with a `grep -c` check that returns 5. The card's shadow does reuse the existing `--shadow-cast`.

**One addition not in the spec.** The close button's label is copy, so it cannot be typed into `panel.js` or `index.html` (R31). Task 3 Step 4 adds `panelChrome` to `content.js`.

**Names used consistently throughout:** `openPanel(id) -> boolean`, `closePanel()`, `isOpen()`, `bindPanel(onClose)`, `renderTables(items, onOpen)`, `scenes.interior.tables`, `scenes.interior.exit`, DOM ids `panel` / `panel-title` / `panel-body`, button ids `table-<id>`, class `.table`.

**Known follow-ups, deliberately not bundled into this plan:** the stale comment at `renderer.js:306`; the resolved email warning at `content.js:22`; vendoring the PNG helper that `assets/source/make-cutout-mask.py` imports from outside the repo.
