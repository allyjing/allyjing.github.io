# Browser checks

**Repo path:** `tools/browser-check/`

```bash
python3 serve.py                 # in one terminal
tools/browser-check/run.sh       # in another
```

Nothing to install. These drive headless Chrome over the DevTools Protocol, and Node has a
native `WebSocket`, so this adds no npm dependency and does not touch the no-build-step
rule in `CLAUDE.md`. Nothing here ships — it is not referenced by `index.html`.

## Why this exists

The project has no test runner, and verification is "look at the page". That is fine for
colour and spacing and useless for focus order, layering, routing and responsive layout.
Those are exactly where the bugs have been, and several survived rounds of review because
everything *rendered*.

Each script prints `PASS`/`FAIL` lines. `run.sh` counts them and exits non-zero if any
suite fails.

| script | what it holds down |
|---|---|
| `tables-layout.mjs` | the five place settings: sprites decode, dessert and drink share a baseline, no two table buttons overlap, and the phone menu drops the plate and the drink |
| `gallery-lightbox.mjs` | the photo grid is TWO columns with large thumbnails, sets carry her descriptions and technical notes, the lightbox opens on the thumbnail that was clicked, arrows wrap across sets, and Escape closes the lightbox WITHOUT closing the panel |
| `projects-showcase.mjs` | the card index, opening a project as a route change without tearing the dialog down, the dialog being titled by the project, browser Back stepping out of a project, cold deep links, an unknown slug falling back to the index, and cards going one-up on a phone |
| `time-freeze-and-panels.mjs` | cycling the clock changes nothing indoors — card, bar, close button, bubble, plate, tint, filter — and all five panels hold real content |
| `lightbox-a11y.mjs` | tab order and trap, backdrop click, measured contrast on the dark mat, and that the exterior still re-themes |
| `walking-and-doors.mjs` | Jingwen walks on a real pointer event, walking to the door goes inside, and nothing covers the way out |

## Assert geometry, not existence

"Five tables rendered and clicks work" passed while three of them sat piled on top of each
other in the wrong place. Prefer `getBoundingClientRect`, `elementFromPoint`, and computed
token values over `querySelector(...) !== null`.

And when the question is whether something *looks* right, take a screenshot and look at it.
A dessert floating above its plate, a plate reading as a white puddle, and beaded sprite
outlines were all invisible in every computed value and obvious in the picture.

## The traps

Every one of these produced a clean, confident, wrong result. `CLAUDE.md` carries the full
list under "Run it"; the short version:

1. **Chrome caches on top of `serve.py`.** `drive.mjs` sends `Network.setCacheDisabled` and
   cache-busts the URL on every navigation. Without it a CSS edit did not reach the page and
   a rule that was already fixed reported FAIL.
2. **`input.js` listens for `pointerdown`.** A synthetic `new MouseEvent('click')` never
   produces one. Use `Input.dispatchMouseEvent`.
3. **Position is written to `left`/`top`**, not `transform`. Comparing transforms reports no
   movement however far she walks.
4. **1400x900 is 1.56 — BELOW the 8:5 breakpoint.** Two checks and a screenshot were taken
   in the phone menu layout while I believed they were the wide one. Assert
   `matchMedia('(max-aspect-ratio: 8/5)').matches` before trusting table geometry.
5. **One Chrome per check, sequentially.** Two clients on one page target crashed Chrome,
   and the remaining suites then printed `0 pass, 0 fail` — indistinguishable from success.
6. **`timeout` does not exist on macOS.** Wrapping a check in it silently runs nothing and
   reports `0 pass, 0 fail`. Same signature as above, different cause.
7. **Do not pipe a check straight into `awk` from `run.sh`.** The backgrounded Chrome
   shares the pipeline, and `node … 2>&1 | awk` printed nothing while the identical command
   in a terminal printed thirteen passes. Output goes via a file.
8. **Never assert on something the visitor's clock decides.** `--scene-filter` is
   legitimately `none` at noon, so "the exterior re-themes" passed at night and failed at
   2pm on identical code. Cycle the clock to a known state first. A check whose result
   depends on when it runs is worse than no check.
9. **Only ever run one `run.sh` at a time.** Two instances fight over the debug port and
   kill each other's Chrome, which shows up as trap 5.
10. **Wait for the thing you are asserting, not a proxy for it.** `waitFor` on the
   lightbox being un-hidden passes the instant the dialog appears — while the 1600px
   photograph is still downloading — so the very next assertion read `naturalWidth: 0`.
   Wait on `naturalWidth > 0`. **Never sleep where you can wait**, either: `await new Promise(r=>setTimeout(r,1200))` followed
   by `querySelectorAll(...)[0].click()` throws on `undefined` whenever the panel is slower
   than the guess — intermittently, which is the worst way to fail. Use `waitFor(...)`,
   which polls for the condition and names it in the error if it never arrives.

11. **Double every backslash inside an `evaluate()` string.** Those are JS template
   literals, so `\.` collapses to a bare `.` before the page ever sees it — a check for
   `/\.{4,}/` became `/.{4,}/`, which matches *any* four characters, and reported
   "literal periods found" in perfectly clean copy.
12. **One cause per assertion.** That same check was written as `a && !b`, so when it
   failed it named the wrong reason and sent me reading CSS that was fine. If an
   assertion can fail two ways, make it two assertions.

`drive.mjs` puts a **20-second deadline on every CDP command**. A lost reply used to leave
the promise unsettled, and node then exited with no assertions at all — reported as
`0 pass, 0 fail`, which is trap 5's signature with a different cause. A timeout at least
names the method that stalled.

Numbers 5, 6 and 7 are the dangerous ones: each makes an empty run look like a clean one.
`run.sh` now treats a suite that printed no assertions as a FAILURE and shows the first
lines of its stderr, because silence used to read as success. **If a suite reports zero of
both, it did not run.**
