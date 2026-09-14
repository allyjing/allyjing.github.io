# Phase 5 — interior panels and the step-back exit

**Date:** 2026-09-14
**Status:** approved design, not yet implemented
**Covers:** PRD Phase 5. Panel content (Phase 6) is explicitly out of scope.

## Why this exists

The interior is a room you can walk around in which none of Jingwen's work is
reachable. `src/engine/main.js:81` parses `route.panel` and deliberately ignores it,
and the five tables are scenery labels with no click behaviour. Experience, Projects,
Photography, Life and Arts exist only as names painted on furniture.

This phase makes the tables open. It also replaces the interior's click-to-leave sign
with walking back out of the room, which was requested directly.

## Decisions taken, and why

| Decision | Choice | Reason |
|---|---|---|
| Panel form | Centred card over a dimmed room | Keeps the room visible so it still reads as a bakery; a full sheet reads as leaving the game |
| Content shape | One schema for all five, with a `kind` field | Matches the shape the resume content already has; lets Photography become a gallery in Phase 6 without reworking the other four |
| Interior exit | Walk downward across the front edge | Requested. Removes the need for a painted door |
| Exit firmness | Must be moving downward, not merely present | A bare edge test turns any low click into an accidental ejection |
| "Back outside" sign | Stays | It is the only focusable, keyboard-operable exit. Removing it is an accessibility regression and would need PRD R9 revisited |

## 1. Data: `src/data/content.js`

A new `panels` export. Pure data — no `document`, no `window`, no import from
`src/engine/`, per the hard rule that keeps a React port a port.

```js
export const panels = {
  experience: {
    title: 'Experience',
    kind: 'entries',
    intro: 'Where I have worked and what I did there.',
    entries: [
      {
        heading: 'Student Helper — Red Vest',
        meta: 'Northeastern Makerspace · Boston, MA · Jun 2026 – Present',
        bullets: ['…'],
        links: [],            // optional; omitted or [] both mean none
      },
    ],
  },
  // projects, photography, life, arts — same shape
};
```

`kind` is `'entries'` for all five in this phase. `'gallery'` is reserved for
Photography in Phase 6 and **no gallery renderer is written now** — YAGNI. The field
exists so adding one later is a new branch rather than a schema migration.

Panel copy in this phase is placeholder text, per PRD §12: *"Build the panel mechanics
against one panel with placeholder text before writing content."* Projects is built
first because it has the most real material behind it.

### Table id is the contract

`tables[].id` in `content.js` already supplies `experience`, `projects`,
`photography`, `life`, `arts`. The same string is the `panels` key, the URL segment in
`#/interior/projects`, and the DOM id of the trigger button. One value, three uses — so
a typo fails loudly rather than silently opening nothing.

## 2. The tables leave the aria-hidden layer

**This is the part that is not cosmetic.**

`renderDecor()` writes to the `decor` layer, which is `aria-hidden="true"` in
`index.html:60`. Interactive controls inside an aria-hidden container are invisible to
assistive technology entirely. The five tables must therefore move.

They move to the **`props`** layer, which `renderSigns()` already uses for real `<a>`
and `<button>` elements. `decor` keeps its aria-hidden status and holds only genuine
scenery. `src/engine/renderer.js:144` already anticipates this move.

Each table renders as:

```html
<button class="table" id="table-projects"
        aria-haspopup="dialog" aria-expanded="false">
  <span class="table__dessert" …></span>
  <span class="table__board">Projects</span>
</button>
```

The dessert, plate and bubble markup is unchanged; it simply hangs off a `<button>`
instead of a `<div>`. `input.js:24` already excludes `.table` from ground clicks, so
clicking a table does not also walk her there — no change needed.

## 3. `src/engine/panel.js` — new module

One module owns the overlay. Nothing else writes panel DOM.

```
openPanel(id)    // build, show, move focus in
closePanel()     // hide, restore focus, no-op if already closed
isOpen()
```

Host element added to `index.html`, outside `.stage`, at `--z-panel` (200 — already
reserved in `tokens.css:80`, currently unused).

```html
<div class="panel" id="panel" hidden>
  <div class="panel__scrim" data-close></div>
  <div class="panel__card" role="dialog" aria-modal="true"
       aria-labelledby="panel-title">
    <header class="panel__bar">
      <h2 id="panel-title"></h2>
      <button class="panel__close" data-close></button>
    </header>
    <div class="panel__body"></div>
  </div>
</div>
```

### Card geometry

`min(680px, 90vw)` wide, `max-height: 85vh`, body scrolls internally with
`overflow-y: auto`. Internal scrolling is not optional: Projects is four entries and
will not fit any viewport.

Below 600px wide the card goes full-width with a small inset, since 90vw of a 390px
phone is not a comfortable measure.

Colours come from existing tokens: `--surface-wall` card, `--surface-trim` header bar,
`--ink` body text, `--accent-berry` close button. **No new colour is needed.** If one
turns out to be, it gets added to all four `[data-time]` blocks first.

### Mechanics — all mandatory

- Closes on the close button, on `Escape`, **and** on backdrop click.
- Focus moves into the card on open, to the close button.
- Focus is trapped while open: Tab from the last focusable wraps to the first,
  Shift+Tab from the first wraps to the last.
- On close, focus returns to the table button that opened it.
- While open, `.stage` gets `inert` and `aria-hidden="true"` so the room behind is
  unreachable by Tab, by click, and by screen reader.
- The opening table's `aria-expanded` flips to `true` while open.

`inert` needs no polyfill for current Safari, Chrome and Firefox; `aria-hidden` is set
alongside it so the intent survives if `inert` is ever unsupported.

### Motion

The card fades and rises a few pixels on open. Wrapped in
`@media (prefers-reduced-motion: no-preference)`, matching the existing pattern in
`ui.css:191` and `scenes.css:241`.

## 4. Router

`main.js` stops ignoring `route.panel`.

- `#/interior/projects` opens the Projects panel — including on a **cold load**, which
  is the case most easily missed. The scene must finish rendering before the panel
  opens, or the trigger button does not exist to receive focus on close.
- Closing navigates to `#/interior`, so the browser Back button leaves the panel
  rather than the site.
- An unknown panel id is ignored and the bare scene renders. A typo in a shared link
  must not produce a broken page.
- Panels only exist on `interior`. `#/exterior/projects` renders the exterior with no
  panel.

Scene changes continue to go through the hash router; nothing mutates `innerHTML` from
a click handler.

## 5. The step-back exit

`scenes.interior` gains:

```js
exit: { edge: 'bottom', at: 94, to: 'exterior' },
```

`at` is an image-space y coordinate, consistent with every other coordinate in the
file.

The door-proximity check currently sits inside `enterScene()` in `main.js:60` and is
written for the exterior only. It generalises to handle both:

- **Exterior** keeps its existing radius-around-a-point test against `scene.door`.
- **Interior** uses `scene.exit`: fires when `position.y >= exit.at` **and** she is
  actually moving downward.

Requiring downward movement is what separates a deliberate step out from a stray click
low on the screen.

⚠️ **Do not test the walker's `heading` for this.** `movement.js:92` collapses heading
to `'side'` whenever `|dx| * 1.2 > |dy|`, so a diagonal walk toward the bottom-left
reports `'side'` rather than `'front'` and the exit would silently not fire. `heading`
is a sprite-pose value, not a direction of travel.

Instead compare against the previous frame's position, which `onMove` already
provides:

```js
const movingDown = position.y > lastY;
lastY = position.y;
```

That keeps the test on the real movement vector and needs no change to
`movement.js`.

The existing `entered` latch generalises so the transition cannot re-fire on every
frame while she stands at the edge.

The "Back outside" sign in `scenes.interior.signs` is unchanged and keeps working.

### Dependency on the new artwork

The interior is being regenerated without a painted door and with a full-width band of
empty foreground floor. The walkable polygon in `scenes.js:147` is traced against the
**current** painting and will not match the new one.

So: the exit is wired in this phase, but `at` and the polygon are tuned once the art
lands. Implementing against the current art is fine and is expected to need one
re-trace afterward.

## 6. Verification

There is no test runner and no linter; verification is by looking at the page, served
with `python3 serve.py` (not `python3 -m http.server` — the no-store header is what
stops stale ES modules).

Checklist to run in a browser:

1. Each of the five tables opens its panel by click.
2. Each opens with `Enter` and with `Space` from the keyboard.
3. Every table shows a visible `:focus-visible` ring.
4. `Escape` closes; close button closes; backdrop click closes.
5. Focus returns to the correct table after each of those three.
6. With a panel open, Tab cycles only inside the card and never reaches the room.
7. `#/interior/projects` pasted into a cold tab opens with the panel already up.
8. Back from an open panel returns to `#/interior`, not to the exterior.
9. `#/interior/nonsense` renders the room with no panel and no console error.
10. Walking down to the front edge exits; standing at the edge without moving does
    not; a click low on the screen while browsing does not.
11. The "Back outside" sign still exits.
12. All of the above at 390×844 portrait, where the scene crop is tightest.
13. Contrast-check any new text/background pairing — pastel palettes fail AA easily.

## Out of scope

- **Real panel copy.** Phase 6. Placeholder text here.
- **The Photography gallery** — `srcset`, lazy loading, lightbox. Phase 6, and blocked
  on Jingwen supplying photos.
- **A third scene.** There are two, permanently.
- **Regenerating the interior art.** Tracked separately; this phase consumes it.
- **WebP conversion** of the oversized scenes. Phase 7.

## Known follow-ups, deliberately not bundled

- `assets/source/make-cutout-mask.py` imports its PNG helper from
  `/Users/jingwenhuang/.claude/jobs/41521682/tmp`, outside the repo. It works today but
  the script is unrunnable if that directory is cleaned up. Worth vendoring.
- `renderer.js:306` carries a stale comment claiming the interior has no art, inside a
  branch that can no longer run.
- `content.js:22` still carries the email-confirmation warning that was resolved on
  2026-09-13.
