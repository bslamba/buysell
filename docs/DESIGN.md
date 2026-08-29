# Design system

Deep purple on white, built on Apple's typographic system.

## The reference, and what was actually taken

The brief was apple.com. What transfers is **structure and metrics** — not
imagery, not copy, not branding:

- a slim translucent global bar, 44px tall
- full-bleed sections stacked vertically, alternating white / near-white grey,
  with the occasional tinted band for contrast
- enormous headlines whose letter-spacing tightens as the size grows
- paired actions: one filled pill, one chevron link
- horizontal scroll-snap shelves for browsing product tiles

Apple's palette is neutral. Ours substitutes purple everywhere they use blue,
and biases every grey a few degrees toward violet so the neutrals read as chosen
rather than inherited. The page stays light throughout: the feature band is a
lavender wash rather than a near-black slab, which keeps the particle field
visible across the whole page instead of dying against a dark section.

## Typography

**The metrics matter more than the face.** Apple sets SF Pro, which is licensed
for Apple platforms only and cannot legally be served from a third-party site.
Inter is the closest freely-licensable match — same humanist-grotesque skeleton,
same generous x-height — and it is self-hosted via `@fontsource-variable/inter`.

What actually makes type read as "Apple" is the relationship between size and
tracking, reproduced exactly:

| Utility | Size | Line height | Tracking | Weight |
|---|---|---|---|---|
| `.t-hero` | clamp(40px, 7.2vw, 80px) | 1.05 | −0.015em | 600 |
| `.t-headline` | clamp(32px, 5vw, 56px) | 1.0714 | −0.009em | 600 |
| `.t-title` | clamp(24px, 3.2vw, 40px) | 1.1 | −0.003em | 600 |
| `.t-subhead` | clamp(19px, 2vw, 28px) | 1.1905 | +0.011em | 400 |
| `.t-lead` | clamp(17px, 1.4vw, 21px) | 1.381 | +0.011em | 400 |
| `.t-body` | 17px | 1.47059 | −0.022em | 400 |
| `.t-small` | 14px | 1.4286 | −0.016em | 400 |
| `.t-caption` | 12px | 1.3334 | −0.01em | 400 |

Note the sign change: display sizes track **negative**, sub-headings track
**positive**. That is Apple's system and it is why their large type looks tight
and their intro paragraphs look airy. Headlines are 600, never 700.

## Colour

| Token | Value | Use |
|---|---|---|
| `--color-canvas` | `#FFFFFF` | default band |
| `--color-surface` | `#F4F1F7` | alternating band, cards on white |
| `--color-deep` | `#EFE9FB` | lavender feature bands (`.band-deep`) |
| `--color-ink` | `#1A1220` | body text |
| `--color-ink-2` | `#6B6076` | secondary text |
| `--color-ink-3` | `#928A9C` | captions, disabled |
| `--color-brand` | `#6D28D9` | links, fills, accents |
| `--color-hairline` | `#E3DDEA` | every border |
| `--color-ok / warn / bad` | — | status only, deliberately outside the brand hue |

## Components

- **`.a-btn` + `.a-btn-fill` / `.a-btn-ghost`** — 980px radius, 12px/22px
  padding, 17px label. `.a-btn-sm` for bars.
- **`.a-link`** — Apple's inline text link: brand-coloured, trailing `›`,
  underline on hover. The default for a secondary action.
- **`.tile`** — 18px radius, soft shadow, 4px lift on hover.
- **`.shelf`** — the Apple Store grid. Horizontal scroll with `scroll-snap-type:
  x mandatory` so tiles land squarely, a left gutter matched to the container,
  and a trailing spacer so the last tile never sits flush to the edge.
  `components/shelf.tsx` adds paging arrows that disable at each end rather than
  disappearing — a control that vanishes shifts the layout.
- **`.band` / `.band-grey` / `.band-deep`** — section grounds. Apple changes
  section colour with a hard edge and no border; so do we.
- **`.on-deep`** — put this on a lavender band and buttons and links deepen to
  `--color-brand-700` so they hold their weight against the tint.

## Layout

`.container-a` is 1240px with 24px gutters for content. The **global nav is
1024px** — narrower than the content on purpose, which is what makes a 44px bar
read as a thin rule of text rather than a piece of furniture.

## Accessibility

Focus is a 2px brand outline at 3px offset, never removed. `prefers-reduced-
motion` disables transitions, smooth scrolling and shelf animation. A skip link
precedes the nav. Body text is `--color-ink` on white (well past AA);
`--color-ink-2` clears AA at body size; `--color-ink-3` is for incidental labels
only and must never carry meaning alone.

**Not yet audited.** Run a full contrast pass before launch — particularly white
text on `--color-deep`, and the brand purple on `--color-surface`.
