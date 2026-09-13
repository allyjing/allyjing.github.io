---
paths:
  - "**/*.css"
  - "**/*.html"
  - "src/engine/**/*.js"
---

<!-- Repo path: .claude/rules/design.md
     The `paths` frontmatter above means this file only loads into context when Claude
     reads a matching file. It stays out of the way during logic work. -->

# Visual design rules

## Source of truth

Every color, radius, and spacing value lives in `src/styles/tokens.css` as a CSS custom
property. **Never write a raw hex, rgb, or hsl value in any other file.** If a needed color
does not exist, add the token first — in all four `[data-time]` blocks — then use it.

This rule exists because duplicated hex values drift within about a week, and the stale
copy is as likely to be followed as the current one.

## Palette

Six core tokens. Names describe the **role**, never the color, so the whole site can be
retinted by editing one file.

| Token | Neutral value | Role |
|---|---|---|
| `--surface-wall` | `#FBF7F4` | Bakery stucco, card backgrounds. Warm off-white, not cream |
| `--surface-trim` | `#F2C8D3` | Awning, window frames, signage. Dusty rose — desaturated on purpose |
| `--surface-roof` | `#A8C8DE` | Roof tile, shutters, cool accents. Powder blue |
| `--accent-berry` | `#B84A6E` | The one saturated color. Buttons, focus rings, active states |
| `--ink` | `#3E3038` | All text. A warm plum-brown, never a tinted near-black |
| `--cat-ginger` | `#E08A4B` | Junnie, and nothing else |
| `--on-accent` | `#FFFFFF` | Text and icons placed **on** `--accent-berry`. Flips to dark at night |

Two rules about how these are used:

- **`--accent-berry` is the only high-saturation color in the interface.** Everything else
  stays soft. A pastel palette with several loud colors reads as noise; one loud color
  against soft ones reads as a deliberate focal point. Do not add a second accent.
- **`--cat-ginger` is reserved.** Junnie is the warmest thing on screen against an entirely
  cool palette, which is why the eye finds him first. Using ginger anywhere else in the UI
  destroys that.

Never name a token `--pink` or `--blue`. A token named for its color cannot be changed.

## Time of day

The four time states override the **same token names** under
`[data-time="morning" | "noon" | "sunset" | "night"]`. Component CSS should be written once
against the semantic tokens and never reference a time state directly.

**Time and place are one state.** Each landmark is locked to a time — Hollywood
Sign/morning, Santa Monica/noon, Laguna/sunset, Griffith/night. There is no `afternoon`. The clock and the location label are
two readouts of one value; clicking either advances it.

**The tint never touches the backdrop layer.** Backdrop images have their time of day baked
in. `--light-tint` sits above `--z-backdrop` and below the scene, and exists only to bring
the neutral bakery into agreement with the backdrop behind it. Tinting an already-night
backdrop renders it black.

Each state additionally sets:
- `--light-tint` — the translucent wash laid over the scene
- `--sky-top` / `--sky-bottom` — the CSS gradient sky
- `--scene-filter` — the `brightness`/`saturate` adjustment on the scene container

If a component needs a time-specific color, that is a signal the token is missing, not a
reason to hardcode. Add it to all four blocks.

## Typography

Two families, clearly distinct:

- **Display — Fraunces.** Signage, the bakery name, room titles. Its soft optical axis
  gives the warmth a hand-painted bakery sign has, without being a script font that fails
  at small sizes.
- **UI — Nunito.** Everything else. Rounded geometric sans that stays readable at 14px and
  matches the softness of the palette.

No third family. In particular: **do not use a pixel font.** The brief explicitly asks for
graphics that are *less* pixelated and clearer. A pixel typeface would pull directly against
that, and pixel fonts are close to illegible on high-DPI phone screens.

Numbers in the clock use `font-variant-numeric: tabular-nums` so the display does not jitter
as digits change.

## Motion

- Movement and transforms only. Never animate `top`, `left`, `width`, or `height`.
- Character bob: 2–3px vertical, ~400ms, `ease-in-out`.
- Scene fade: 250ms. Time-of-day cross-fade: 600ms.
- No entrance animations on content. No hover transitions on every element. One deliberate
  moment beats scattered effects.
- Everything above is wrapped in `@media (prefers-reduced-motion: no-preference)`.

## Hard rules

- `image-rendering: auto` on all sprites. Never `pixelated`.
- Minimum tap target 44×44px. This is designed portrait-mobile-first at 390×844.
- Every interactive element has a visible `:focus-visible` outline in `--accent-berry`,
  2px, with a 2px offset. Never `outline: none` without a replacement.
- **Never place white directly on `--accent-berry`.** Use `--on-accent`, which flips to a
  dark value under `[data-time="night"]`. White on the night accent measures 2.42:1 — a
  clear failure — while `--on-accent` holds 6.19:1 in both themes.
- **Every surface token that can carry `--ink` must be overridden in the night block.**
  `--ink` flips to near-white after dark; a pastel surface that does not flip with it
  inverts into light-on-light. `--surface-trim` originally had no night value, and the
  garden signs using it measured **1.29:1** at night — a severe failure that looks perfect
  in daylight and is only visible if you actually load the night scene. Check new tokens in
  both themes, not one.
- Check every text-on-background pairing against WCAG AA. Pastels fail routinely. Measured
  values for the pairings most likely to be reached for:

  | Pairing | Ratio | Verdict |
  |---|---|---|
  | `--ink` on `--surface-wall` | 11.70 | AAA |
  | `--ink-soft` on `--surface-wall` | 6.04 | AA |
  | `--ink` on `--surface-trim` | 8.30 | AAA |
  | `--ink` on `--surface-roof` | 7.11 | AAA |
  | `--ink` on `--surface-trim`, **night** | 9.35 | AAA |
  | `--ink` on `--surface-roof`, **night** | 8.98 | AAA |
  | `--on-accent` on `--accent-berry` | 4.95 | AA |
  | `--accent-berry` on `--surface-wall` | 4.65 | AA |
  | `--surface-wall` on `--surface-trim` | 1.41 | **fails — never do this** |

  Anything light on `--surface-roof` fails. Anything light on `--surface-trim` fails.
  Pastel on pastel is almost always a failure; put `--ink` on it instead.
- Layer order is fixed. Use the `--z-*` tokens; never write a bare `z-index`:
  `sky → backdrop → tint → scene → props → actors → ui → panel → modal`
- **The time-of-day tint sits below the UI layer.** The clock, location label, and resume
  link must never be dimmed by the night wash — that is a bug, not a mood. They use
  `--chrome-bg` / `--chrome-ink`, which flip per theme.
- The location label is bottom-left, the clock top-left. Both are `--tap-min` tall and both
  look clickable, because both are. Format: `Name · 34.1183° N, 118.3003° W` — a middle dot
  separator is the one place it earns its place here, joining a name to its coordinates.

## CSS structure

Keep selector specificity flat. Prefer a single class per rule. Specificity conflicts
between type selectors like `.scene` and element selectors like `.sign` are the most common
source of styles silently canceling each other out, usually around padding and margin
between sections.
