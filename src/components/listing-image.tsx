import { CategoryIcon } from "./icons";
import type { IconName } from "@/config/categories";

/**
 * Product imagery for a listing.
 *
 * Real listings will carry seller photographs. Until they do, this renders a
 * generated tile rather than a grey box: a soft two-stop gradient with the
 * category glyph sitting in it, at the 4:3 ratio the store grid expects.
 *
 * The gradient is picked by hashing the listing's own id, so a given listing
 * always looks the same — on the server, on the client, and on every reload.
 * A random pick here would have reintroduced exactly the hydration mismatch we
 * just fixed in the logo.
 */

const PALETTES: [string, string][] = [
  ["#EDE7FB", "#D9CBF6"],
  ["#E8F0FB", "#CFE0F7"],
  ["#F3E9F7", "#E4CEF0"],
  ["#E9F4F0", "#CDE8DE"],
  ["#FAF0E6", "#F2DEC8"],
  ["#EFEDF9", "#DAD5F2"],
  ["#F7EDF1", "#EDD3DE"],
  ["#EAF2F6", "#D2E4EE"],
];

/** djb2 — small, deterministic, and stable across runtimes. */
function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

export function ListingImage({
  seed, icon, className = "",
}: { seed: string; icon: IconName; className?: string }) {
  const [from, to] = PALETTES[hash(seed) % PALETTES.length];
  return (
    <div
      className={`relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[14px] ${className}`}
      style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
      aria-hidden="true"
    >
      <span className="text-brand-700/45">
        <CategoryIcon name={icon} size={76} />
      </span>
    </div>
  );
}
