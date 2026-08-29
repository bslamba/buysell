import { LogoMark } from "./logo";

/**
 * The wordmark, entering letter by letter.
 *
 * Deliberately CSS-only — no state, no effects, no client boundary. The stagger
 * is an inline `animationDelay` computed from the character index, which is a
 * pure function of the input, so the server and client render identical markup.
 * Doing this with JS state would have meant a flash of unstyled name on every
 * navigation and another hydration risk.
 *
 * `fill-mode: both` holds each letter at its 0% frame until its delay elapses,
 * so nothing flickers into place early. The reduced-motion rule in globals.css
 * neutralises that, otherwise a user with motion disabled would see nothing.
 */

const WORD = "Worth";

export function AnimatedWordmark({
  size = "hero",
  withMark = false,
  layout = "inline",
  intensity = "normal",
  className = "",
}: {
  size?: "hero" | "nav";
  withMark?: boolean;
  /** "stacked" puts the mark above the name — used on the home hero. */
  layout?: "inline" | "stacked";
  /** "big" scales letters in from 4x with a lit sphere behind each. */
  intensity?: "normal" | "big";
  className?: string;
}) {
  const isHero = size === "hero";
  const big = intensity === "big";

  // Letters land quickly; the pill waits for the last one and a beat more.
  const step = isHero ? 0.075 : 0.06;
  const base = withMark ? (layout === "stacked" ? 0.22 : isHero ? 0.18 : 0.14) : 0;
  const pillDelay = base + WORD.length * step + (isHero ? 0.1 : 0.07);

  const letterClass = big ? "animate-letter-big letter-orb" : "animate-letter";

  const mark = withMark ? (
    <LogoMark
      size={isHero ? (layout === "stacked" ? 112 : 96) : 16}
      className="animate-mark"
    />
  ) : null;

  const name = (
    <span className={`inline-flex items-baseline ${isHero ? "gap-[0.06em]" : "gap-[0.08em]"}`}>
      <span aria-hidden="true" className="inline-flex">
        {WORD.split("").map((ch, i) => (
          <span
            key={`${ch}-${i}`}
            className={letterClass}
            style={{ animationDelay: `${(base + i * step).toFixed(3)}s` }}
          >
            {ch}
          </span>
        ))}
      </span>

      <span
        aria-hidden="true"
        className={`animate-pill ml-[0.12em] inline-flex items-baseline rounded-[0.3em] bg-brand font-bold leading-none text-white ${
          isHero ? "px-[0.22em] pb-[0.1em] pt-[0.05em] text-[0.86em]" : "px-[0.28em] pb-[0.08em] pt-[0.03em] text-[0.92em]"
        }`}
        style={{ animationDelay: `${pillDelay.toFixed(3)}s` }}
      >
        It
      </span>

      {/* The animation splits the name into fragments; screen readers get it whole. */}
      <span className="sr-only">WorthIt</span>
    </span>
  );

  if (layout === "stacked") {
    return (
      <span className={`inline-flex flex-col items-center gap-6 ${className}`}>
        {mark}
        {name}
      </span>
    );
  }

  return (
    <span className={`inline-flex select-none items-center ${isHero ? "gap-4" : "gap-1.5"} ${className}`}>
      {mark}
      {name}
    </span>
  );
}
