import type { ReactNode } from "react";

/** Long-form legal and policy copy, set at Apple's reading metrics. */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-[680px] space-y-5 t-body text-ink-2
      [&_a]:text-brand [&_a:hover]:underline
      [&_h2]:mt-12 [&_h2]:t-title [&_h2]:text-ink
      [&_h3]:mt-8 [&_h3]:text-[19px] [&_h3]:font-semibold [&_h3]:text-ink [&_h3]:tracking-[-0.01em]
      [&_li]:mt-2 [&_strong]:text-ink [&_strong]:font-semibold
      [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
      {children}
    </div>
  );
}
