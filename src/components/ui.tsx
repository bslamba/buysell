import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Primitives in Apple's idiom: pill buttons, inline chevron links, soft-shadow
 * tiles, and section headers that lead with an eyebrow. Deliberately few — the
 * page carries its weight through typography and spacing rather than chrome.
 */

type Variant = "fill" | "ghost" | "link";

export function Button({
  children, href, type = "button", variant = "fill", size = "md", disabled, onClick, className = "",
}: {
  children: ReactNode; href?: string; type?: "button" | "submit";
  variant?: Variant; size?: "md" | "sm"; disabled?: boolean;
  onClick?: () => void; className?: string;
}) {
  if (variant === "link") {
    const cls = `a-link ${className}`;
    return href ? <Link href={href} className={cls}>{children}</Link>
      : <button type={type} onClick={onClick} disabled={disabled} className={cls}>{children}</button>;
  }
  const cls = `a-btn ${variant === "fill" ? "a-btn-fill" : "a-btn-ghost"} ${size === "sm" ? "a-btn-sm" : ""} ${disabled ? "pointer-events-none opacity-40" : ""} ${className}`;
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button type={type} disabled={disabled} onClick={onClick} className={cls}>{children}</button>;
}

/** Apple's paired actions: a filled primary next to a chevron link. */
export function Actions({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-wrap items-center gap-x-7 gap-y-4 ${className}`}>{children}</div>;
}

export function Card({ children, className = "", hover = false }: {
  children: ReactNode; className?: string; hover?: boolean;
}) {
  return <div className={`tile ${hover ? "" : "!transform-none hover:!shadow-[0_4px_14px_rgba(28,16,48,0.06)]"} p-7 ${className}`}>{children}</div>;
}

export function Badge({ tone = "brand", children }: {
  tone?: "brand" | "ok" | "warn" | "bad" | "plain"; children: ReactNode;
}) {
  const tones = {
    brand: "bg-brand-100 text-brand-700",
    ok: "bg-ok/10 text-ok",
    warn: "bg-warn/10 text-warn",
    bad: "bg-bad/10 text-bad",
    plain: "bg-surface text-ink-2",
  } as const;
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 t-caption font-semibold ${tones[tone]}`}>{children}</span>;
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`t-eyebrow text-brand ${className}`}>{children}</p>;
}

/** Centred section head — Apple's default for a full-bleed band. */
export function SectionHead({ eyebrow, title, sub, align = "center" }: {
  eyebrow?: string; title: string; sub?: string; align?: "center" | "left";
}) {
  const a = align === "center" ? "text-center mx-auto" : "";
  return (
    <div className={`${a} max-w-3xl`}>
      {eyebrow ? <Eyebrow className="mb-3">{eyebrow}</Eyebrow> : null}
      <h2 className="t-headline text-balance">{title}</h2>
      {sub ? <p className="t-subhead mt-4 text-ink-2">{sub}</p> : null}
    </div>
  );
}

/** Kept for pages that still call the old name. */
export const SectionTitle = SectionHead;

export function PageHeader({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <header className="band-grey">
      <div className="container-a py-20 text-center sm:py-24">
        {eyebrow ? <Eyebrow className="mb-3">{eyebrow}</Eyebrow> : null}
        <h1 className="t-hero text-balance">{title}</h1>
        {sub ? <p className="t-subhead mx-auto mt-5 max-w-2xl text-ink-2">{sub}</p> : null}
      </div>
    </header>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-[18px] border border-hairline px-6 py-20 text-center">
      <h3 className="t-title">{title}</h3>
      <p className="t-body mx-auto mt-3 max-w-md text-ink-2">{body}</p>
      {action ? <div className="mt-7 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="t-small mb-2 block font-medium">{label}</span>
      {children}
      {hint ? <span className="t-caption mt-2 block text-ink-3">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-hairline bg-canvas px-4 py-3 t-body text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-brand";
