import type { IconName } from "@/config/categories";

/**
 * Category icons. Single-weight 1.6px line icons on a 24px grid, drawn to sit
 * on one optical baseline so the rail reads as a set rather than a collection.
 */
const PATHS: Record<IconName, React.ReactNode> = {
  grid: <><rect x="3" y="3" width="7.5" height="7.5" rx="2" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="2" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="2" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" /></>,
  phone: <><rect x="6.5" y="2.5" width="11" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></>,
  laptop: <><rect x="4" y="5" width="16" height="10.5" rx="1.8" /><path d="M2 19h20" /></>,
  desk: <><path d="M3 9h18M4.5 9V20M19.5 9V20M4.5 6.5h15v2.5h-15z" /><path d="M8 13h8" /></>,
  chip: <><rect x="7" y="7" width="10" height="10" rx="2" /><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4" /></>,
  sofa: <><path d="M4 11V8.5A2.5 2.5 0 0 1 6.5 6h11A2.5 2.5 0 0 1 20 8.5V11" /><path d="M3 12.5a2 2 0 0 1 4 0V16h10v-3.5a2 2 0 0 1 4 0V18H3z" /><path d="M5.5 18v2M18.5 18v2" /></>,
  washer: <><rect x="4.5" y="2.5" width="15" height="19" rx="2.5" /><circle cx="12" cy="14" r="4.5" /><path d="M8 6h2M15.5 6h.01" /></>,
  stroller: <><path d="M5 13a7 7 0 0 1 14 0z" /><path d="M12 13V3.5a6 6 0 0 1 6 6" /><path d="M6.5 13l-1.5 5M17.5 13l1.5 5" /><circle cx="7" cy="19.5" r="1.8" /><circle cx="17" cy="19.5" r="1.8" /></>,
  shirt: <><path d="M8.5 3 4 5.5l1.5 4L8 8.8V21h8V8.8l2.5.7L20 5.5 15.5 3a3.5 3.5 0 0 1-7 0z" /></>,
  gem: <><path d="M6 3h12l3 5.5-9 12.5L3 8.5z" /><path d="M3 8.5h18M9 3l-1.5 5.5L12 21M15 3l1.5 5.5L12 21" /></>,
  palette: <><path d="M12 21a9 9 0 1 1 9-9c0 2-1.5 3-3 3h-1.5a2 2 0 0 0-1.4 3.4A2 2 0 0 1 12 21z" /><circle cx="7.5" cy="12" r="1.1" fill="currentColor" stroke="none" /><circle cx="9.8" cy="7.8" r="1.1" fill="currentColor" stroke="none" /><circle cx="14.5" cy="7.5" r="1.1" fill="currentColor" stroke="none" /></>,
  dice: <><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" /><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /></>,
  dumbbell: <><path d="M2.5 12h3M18.5 12h3" /><rect x="5.5" y="8" width="3.5" height="8" rx="1.4" /><rect x="15" y="8" width="3.5" height="8" rx="1.4" /><path d="M9 12h6" /></>,
  car: <><path d="M4 16.5V13l1.8-4.6A2 2 0 0 1 7.7 7h8.6a2 2 0 0 1 1.9 1.4L20 13v3.5" /><path d="M3 13h18" /><circle cx="7.5" cy="16.5" r="1.8" /><circle cx="16.5" cy="16.5" r="1.8" /></>,
  book: <><path d="M4 4.5A2 2 0 0 1 6 2.5h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 18.5V21h15" /><path d="M8 7h7" /></>,
  briefcase: <><rect x="2.5" y="7" width="19" height="13" rx="2.5" /><path d="M8.5 7V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" /><path d="M2.5 12.5h19" /></>,
  paw: <><circle cx="7" cy="8.5" r="1.9" /><circle cx="12" cy="6.5" r="1.9" /><circle cx="17" cy="8.5" r="1.9" /><path d="M12 11c2.6 0 5 2.2 5 4.6 0 2-1.6 3.4-3.4 3.4h-3.2C8.6 19 7 17.6 7 15.6 7 13.2 9.4 11 12 11z" /></>,
  music: <><circle cx="6.5" cy="17.5" r="2.8" /><circle cx="17.5" cy="15" r="2.8" /><path d="M9.3 17.5V6.5l11-2v10.5" /><path d="M9.3 9.5l11-2" /></>,
  sparkle: <><path d="M12 2.5l2.2 6.1 6.1 2.2-6.1 2.2L12 19.1l-2.2-6.1L3.7 10.8l6.1-2.2z" /><path d="M18.5 16.5l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z" /></>,
  box: <><path d="M12 2.8 20.5 7v10L12 21.2 3.5 17V7z" /><path d="M3.5 7 12 11.4 20.5 7M12 11.4V21.2" /></>,
};

export function CategoryIcon({ name, size = 22, className = "" }: {
  name: IconName; size?: number; className?: string;
}) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true" focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}

export function SearchIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.9" strokeLinecap="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" />
    </svg>
  );
}
