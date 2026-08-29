/**
 * WorthIt identity.
 *
 * The mark is one continuous stroke that reads two ways: a "W" whose final
 * stroke overshoots into a tick. Verification is the product, so the checkmark
 * is the letterform rather than a badge stuck beside it. All paths — no
 * webfont, so it stays sharp at favicon size.
 *
 * ── On the gradient ids ──────────────────────────────────────────────────
 * These are FIXED, not generated. An earlier version derived them from a
 * module-level counter, which broke hydration: the server and the client
 * increment in different orders, so `url(#wi-tile-1)` on the server became
 * `url(#wi-tile-2)` on the client and React bailed out of patching the tree.
 *
 * A counter is non-deterministic across renders, and `useId()` is a hook — it
 * would force this into a Client Component, adding a boundary for a logo that
 * renders in the footer, the layout and the sign-in page as a Server Component.
 *
 * Fixed ids make the component a pure function of its props, which is exactly
 * what hydration requires. Several instances on a page do mean repeated ids;
 * that is harmless here because every instance is byte-identical, so `url(#…)`
 * resolving to the first match paints precisely the same gradient. Where a
 * genuinely distinct instance is needed, pass `idPrefix`.
 */

export function LogoMark({ size = 32, className = "", idPrefix = "wi", twinkle = true }: {
  size?: number; className?: string; idPrefix?: string; twinkle?: boolean;
}) {
  const tile = `${idPrefix}-tile`;
  const rim = `${idPrefix}-rim`;
  const stroke = `${idPrefix}-stroke`;
  const glow = `${idPrefix}-glow`;

  return (
    <svg
      width={size} height={size} viewBox="0 0 64 64" fill="none"
      className={className} aria-hidden="true" focusable="false"
    >
      <defs>
        <linearGradient id={tile} x1="4" y1="0" x2="58" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C77DFF" />
          <stop offset="0.42" stopColor="#8B3DF0" />
          <stop offset="1" stopColor="#3B1478" />
        </linearGradient>
        <linearGradient id={rim} x1="32" y1="0" x2="32" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.16" />
        </linearGradient>
        <linearGradient id={stroke} x1="14" y1="12" x2="46" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#EBDCFF" />
        </linearGradient>
        <radialGradient id={glow} cx="0" cy="0" r="1"
          gradientTransform="translate(50 16) rotate(90) scale(22)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="64" height="64" rx="17.5" fill={`url(#${tile})`} />
      <rect width="64" height="64" rx="17.5" fill={`url(#${glow})`} />
      <rect x="1" y="1" width="62" height="62" rx="16.5" stroke={`url(#${rim})`} strokeWidth="2" />

      {/* W that resolves into a tick */}
      <path
        d="M12.5 20.5 L22 44.5 L31.5 30 L41 44.5 L52.5 14.5"
        stroke={`url(#${stroke})`} strokeWidth="7"
        strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Spark at the apex — where the eye lands last. It keeps catching the
          light rather than sitting still; the animation is CSS so it costs
          nothing and never desynchronises between server and client. */}
      <path
        d="M52.5 8.5 L54 12.6 L58 14.2 L54 15.8 L52.5 20 L51 15.8 L47 14.2 L51 12.6 Z"
        fill="#fff" fillOpacity="0.92"
        className={twinkle ? "animate-twinkle" : undefined}
      />
    </svg>
  );
}

export function Wordmark({ className = "", tone = "ink" }: { className?: string; tone?: "ink" | "white" }) {
  return (
    <span className={`inline-flex select-none items-baseline gap-[0.14em] font-semibold tracking-[-0.035em] ${className}`}>
      <span className={tone === "white" ? "text-white" : "text-ink"}>Worth</span>
      <span className="relative inline-flex items-baseline rounded-[0.32em] bg-brand px-[0.3em] pb-[0.09em] pt-[0.03em] text-[0.92em] font-bold leading-none text-white">
        It
      </span>
    </span>
  );
}

export function Logo({ size = 22, className = "", textClass = "text-[16px]", tone = "ink" }: {
  size?: number; className?: string; textClass?: string; tone?: "ink" | "white";
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <Wordmark className={textClass} tone={tone} />
    </span>
  );
}
