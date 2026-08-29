import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "glass" | "ghost";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-45 disabled:pointer-events-none";

const BUTTON_VARIANT: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-violet-400 to-violet-600 text-white shadow-[0_8px_28px_-8px_rgba(124,58,237,0.85)] hover:brightness-110 hover:shadow-[0_12px_36px_-8px_rgba(124,58,237,1)]",
  glass: "glass glass-hover text-text",
  ghost: "text-text-muted hover:text-text hover:bg-white/[0.06]",
};

export function Button({
  children, href, type = "button", variant = "primary", disabled, onClick, className = "",
}: {
  children: ReactNode; href?: string; type?: "button" | "submit"; variant?: Variant;
  disabled?: boolean; onClick?: () => void; className?: string;
}) {
  const cls = `${BUTTON_BASE} ${BUTTON_VARIANT[variant]} ${className}`;
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button type={type} disabled={disabled} onClick={onClick} className={cls}>{children}</button>;
}

export function Card({ children, className = "", hover = false }: {
  children: ReactNode; className?: string; hover?: boolean;
}) {
  return (
    <div className={`glass ${hover ? "glass-hover" : ""} rounded-[18px] p-6 ${className}`}>
      {children}
    </div>
  );
}

export function Badge({ tone = "violet", children }: {
  tone?: "violet" | "ok" | "warn" | "bad" | "plain"; children: ReactNode;
}) {
  const tones = {
    violet: "bg-violet-400/15 text-violet-300 ring-violet-400/25",
    ok: "bg-ok/12 text-ok ring-ok/25",
    warn: "bg-warn/12 text-warn ring-warn/25",
    bad: "bg-bad/12 text-bad ring-bad/25",
    plain: "bg-white/[0.06] text-text-muted ring-white/10",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-faint">{children}</p>
  );
}

export function SectionTitle({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{title}</h2>
      {sub ? <p className="mt-4 text-[15px] leading-relaxed text-text-muted">{sub}</p> : null}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="glass rounded-[18px] px-6 py-16 text-center">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-muted">{body}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-text">{label}</span>
      {children}
      {hint ? <span className="mt-2 block text-xs leading-relaxed text-text-faint">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "glass-input w-full rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-faint";

/** Page header used by every content page, so they all start the same way. */
export function PageHeader({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <header className="border-b border-white/[0.06] py-16">
      <div className="mx-auto max-w-6xl px-6">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="mt-3 text-balance text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{title}</h1>
        {sub ? <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-text-muted">{sub}</p> : null}
      </div>
    </header>
  );
}
