/**
 * WorthIt identity.
 *
 * The mark is a single stroke that reads two ways: a "W" whose final stroke
 * overshoots into a tick. Verification is the product, so the checkmark is the
 * letterform rather than a badge stuck next to it. Drawn as a path with round
 * caps so it stays sharp at favicon size and never depends on a webfont.
 */

export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  const id = "wi-mark-grad";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A855F7" />
          <stop offset="0.55" stopColor="#7C3AED" />
          <stop offset="1" stopColor="#4C1D95" />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="17" fill={`url(#${id})`} />
      <rect width="64" height="64" rx="17" fill={`url(#${id}-sheen)`} />
      <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="16.25" stroke="#fff" strokeOpacity="0.22" strokeWidth="1.5" />
      <path
        d="M13 21 L22.5 45 L31.5 31 L40.5 45 L52 15"
        stroke="#fff" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`select-none font-semibold tracking-[-0.03em] ${className}`}>
      <span className="text-white">Worth</span>
      <span className="bg-gradient-to-br from-violet-300 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">It</span>
    </span>
  );
}

export function Logo({ size = 30, className = "", textClass = "text-[19px]" }: {
  size?: number; className?: string; textClass?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <Wordmark className={textClass} />
    </span>
  );
}
