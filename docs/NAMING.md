# Naming and identity

The name is **WorthIt**. It lives in exactly one place — `src/config/brand.ts` —
so changing it anywhere means changing it there.

## Why WorthIt works

It carries the product thesis without explaining it. Two readings sit on top of
each other and both are true:

- **"Is it worth it?"** — the question every buyer of a used device is actually
  asking, and the one nobody currently answers for them.
- **"It's worth it."** — the answer the verification gives.

It also names the thing we sell, which is not goods but *appraisal*. "Worth" is
the noun a valuation produces. Practically: it is two syllables, unambiguous in
English across every Indian metro, needs no transliteration, and has no
pronunciation trap for a non-Hindi speaker in Bengaluru or Chennai.

- Tagline: **"Know what it's worth."**
- Verb form: "WorthIt checked it."
- Domain in config: `worthit.in`

## Still to confirm before launch

1. **Domains** — `worthit.in` and `worthit.com`, plus the app-store name.
2. **Trademark** — Class 35 (online marketplace services) and Class 42
   (SaaS / verification services) on the Indian TM registry. "Worth" is a common
   English word, so expect to register a **device mark** (logo lockup) rather
   than a bare wordmark.
3. **Handles** — Instagram, X, LinkedIn, YouTube. The placeholders in
   `brand.socials` need replacing with the real ones.

## The mark

A single stroke that reads two ways: a **W** whose final stroke overshoots into
a **tick**. Verification is the product, so the checkmark is the letterform
rather than a badge stuck beside it.

Drawn as an SVG path with round caps and joins, so it stays sharp at favicon
size and never depends on a webfont loading.

- `src/components/logo.tsx` — `LogoMark`, `Wordmark`, `Logo` (the lockup)
- `public/logo-mark.svg` — square app-icon mark
- `public/logo-lockup.svg` — horizontal mark + wordmark

**Colour.** The mark carries a violet gradient (`#A855F7 → #7C3AED → #4C1D95`)
on the app's near-black ground, with a top sheen and a 22%-white hairline border
so it reads as a piece of the same glass as the rest of the interface.

**Wordmark.** "Worth" in solid white, "It" in a violet-to-fuchsia gradient — the
split puts the emphasis on the half that does the work in both readings of the
name.

> The lockup SVG sets the wordmark as **live text** in Inter. Convert it to
> outlines before sending it to a printer or anyone without the font.

## Typography

**Inter**, self-hosted via `@fontsource-variable/inter`.

Inter is the closest freely-licensable match to Apple's SF Pro, which is what
the glass surface needs to feel coherent. It is loaded from the bundle rather
than `next/font/google` on purpose: the Google path fetches at build time, so a
deploy depends on a third party being reachable, and every page load leaks a
request. Both were avoidable.

The reference site given as a typography brief (`circlestore.in`) is fully
client-rendered, so its typeface could not be read from the markup. If you can
identify it and want to match it exactly, changing the `@fontsource` import in
`src/app/layout.tsx` and the `--font-sans` token in `globals.css` is the whole
job.
