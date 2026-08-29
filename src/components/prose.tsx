import type { ReactNode } from "react";

/** Long-form legal and policy copy. One place to tune reading typography. */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-2xl space-y-6 text-[15px] leading-relaxed text-text-muted
      [&_a]:text-violet-300 [&_a:hover]:text-violet-200
      [&_h2]:mt-12 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_h2]:text-text
      [&_h3]:mt-8 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-text
      [&_li]:mt-2 [&_strong]:text-text [&_strong]:font-semibold
      [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
      {children}
    </div>
  );
}
