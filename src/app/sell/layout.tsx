import Link from "next/link";
import { SellNav } from "./sell-nav";

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="glass-bar sticky top-[68px] z-40 border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3">
          <span className="shrink-0 text-lg font-semibold tracking-[-0.02em]">Selling</span>
          <SellNav />
          <Link href="/sell/new"
            className="hidden shrink-0 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_28px_-8px_rgba(124,58,237,0.85)] transition-all hover:brightness-110 sm:inline-flex">
            List an item
          </Link>
        </div>
      </div>
      {children}
    </>
  );
}
