# Design system

Apple-glass on dark violet. One theme, committed to deliberately.

## Why single-theme

The whole surface is one continuous dark ground with light bleeding through
translucent panels. That effect only holds together if the ground stays
constant — glass over white is just a grey box. A light mode would mean
designing the thing twice and getting a worse version of both, so `globals.css`
declares every colour explicitly and never borrows the host's theme.

## Tokens

All in `@theme` in `src/app/globals.css`.

| Group | Tokens | Notes |
|---|---|---|
| Ground | `--color-void` `#05030A`, `ink-950` … `ink-700` | Black with a violet undertone, so the greys read as chosen rather than default |
| Accent | `violet-200` … `violet-900`, primary `#A855F7` | The only decorative hue on the page |
| Text | `--color-text` `#F4F0FF`, `text-muted`, `text-faint` | Three levels, no more |
| Semantic | `--color-ok` `#34D8A0`, `warn` `#F5A524`, `bad` `#FB6D5C` | Kept distinct from the violet accent on purpose — status must not read as branding |

## The glass

Four utilities do all the work:

- **`.glass`** — the material. A 158° white gradient (7.5% → 2.2%), 22px blur at
  175% saturation, a 9%-white hairline border, and an inner top highlight. That
  inner highlight is what makes it read as a *pane* rather than a flat
  translucent box; without it the effect collapses.
- **`.glass-hover`** — lifts 2px, brightens the gradient, warms the border to
  violet, and deepens the shadow.
- **`.glass-bar`** — the sticky nav. Heavier blur (28px), thinner material.
- **`.glass-input`** — form fields, with a violet focus border.

Two things on `body` make the glass work at all:

1. **`body::before`** paints three fixed radial violet pools. Translucent panels
   need something to refract; over flat black they just look grey.
2. **`body::after`** lays a 3.5%-opacity SVG noise texture over everything, which
   stops the large gradients banding on cheap panels.

## Type

**Inter**, self-hosted through `@fontsource-variable/inter` — see `NAMING.md`
for why not `next/font/google`. Display sizes run tight (`tracking-[-0.03em]` to
`-0.04em`); that negative tracking at large sizes is most of what makes type
read as Apple-adjacent rather than generic. Numbers in tables and stats use the
`.tabular` utility.

## Components

`src/components/ui.tsx` — `Button` (primary / glass / ghost), `Card`, `Badge`,
`Eyebrow`, `SectionTitle`, `PageHeader`, `EmptyState`, `Field`, `inputClass`.
`prose.tsx` handles long-form legal copy. `logo.tsx` carries the identity.

Use these rather than hand-rolling classes. If a page needs something they can't
express, add it to `ui.tsx` — a one-off `className` on a page is how a design
system rots.

## Accessibility

Focus rings are a 2px violet outline with 3px offset, never removed.
`prefers-reduced-motion` disables transitions and smooth scrolling. Body text
sits at `--color-text-muted` on the dark ground, which clears WCAG AA for body
sizes; `text-faint` is for incidental labels only and should not carry meaning
on its own.

**Not yet audited.** Run a proper contrast pass over the glass panels before
launch — translucent surfaces vary with whatever sits behind them, which is
exactly the case automated checkers handle worst.
