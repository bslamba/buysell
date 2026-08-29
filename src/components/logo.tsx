/**
 * WorthIt identity.
 *
 * The mark is one continuous stroke that reads two ways: a "W" whose final
 * stroke overshoots into a tick. Verification is the product, so the checkmark
 * is the letterform rather than a badge stuck beside it.
 *
 * Three things give it more presence than a flat glyph: the stroke carries its
 * own top-lit gradient, a spark sits at the tick's apex where the eye lands
 * last, and the tile has an inner rim highlight so it reads as an object rather
 * than a coloured square. All paths — no webfont, so it survives at 16px.
 *
 * The wordmark sets "It" inside a gradient pill. That pill is the memorable
 * half: it reads as a stamp, which is exactly what the company does.
 */

let uid = 0;
function useIds(prefix: string) {
  // Deterministic per render tree; SVG defs need unique ids when the mark
  // appears more than once on a page.
  uid += 1;
  return {
    tile: `${prefix}-tile-${uid}`,
    rim: `${prefix}-rim-${uid}`,
    stroke: `${prefix}-stroke-${uid}`,
    glow: `${prefix}-glow-${uid}`,
  };
}

export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  const id = useIds("wi");
  return (
    <svg
      width={size} height={size} viewBox="0 0 64 64" fill="none"
      className={className} aria-hidden="true" focusable="false"
    >
      <defs>
        <linearGradient id={id.tile} x1="4" y1="0" x2="58" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C77DFF" />
          <stop offset="0.42" stopColor="#8B3DF0" />
          <stop offset="1" stopColor="#3B1478" />
        </linearGradient>
        <linearGradient id={id.rim} x1="32" y1="0" x2="32" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.16" />
        </linearGradient>
        <linearGradient id={id.stroke} x1="14" y1="12" x2="46" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#EBDCFF" />
        </linearGradient>
        <radialGradient id={id.glow} cx="0" cy="0" r="1"
          gradientTransform="translate(50 16) rotate(90) scale(22)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="64" height="64" rx="17.5" fill={`url(#${id.tile})`} />
      <rect width="64" height="64" rx="17.5" fill={`url(#${id.glow})`} />
      <rect x="1" y="1" width="62" height="62" rx="16.5"
        stroke={`url(#${id.rim})`} strokeWidth="2" />

      {/* W that resolves into a tick */}
      <path
        d="M12.5 20.5 L22 44.5 L31.5 30 L41 44.5 L52.5 14.5"
        stroke={`url(#${id.stroke})`} strokeWidth="7"
        strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Spark at the apex — where the eye lands last */}
      <path
        d="M52.5 8.5 L54 12.6 L58 14.2 L54 15.8 L52.5 20 L51 15.8 L47 14.2 L51 12.6 Z"
        fill="#fff" fillOpacity="0.92"
      />
    </svg>
  );
}

export function Wordmark({ className = "", tone = "ink" }: { className?: string; tone?: "ink" | "white" }) {
  return (
    <span className={`inline-flex select-none items-baseline gap-[0.14em] font-semibold tracking-[-0.035em] ${className}`}>
      <span className={tone === "white" ? "text-white" : "text-ink"}>Worth</span>
      <span
        className="relative inline-flex items-baseline rounded-[0.32em] bg-brand px-[0.3em] pb-[0.09em] pt-[0.03em] text-[0.92em] font-bold leading-none text-white"
      >
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
