import Link from "next/link";
import { SellNav } from "./sell-nav";

/**
 * Apple's product sub-nav: a second slim bar under the global one, naming the
 * section on the left, its pages in the middle, and the buy action on the
 * right. It sticks below the global bar rather than replacing it.
 */
export default function SellLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="sticky top-11 z-40 border-b border-black/[0.06] bg-canvas/80 backdrop-blur-2xl backdrop-saturate-[1.8]">
        <div className="mx-auto flex h-12 max-w-[1024px] items-center justify-between gap-6 px-6">
          <Link href="/sell" className="shrink-0 text-[19px] font-semibold tracking-[-0.02em]">Selling</Link>
          <SellNav />
          <Link href="/sell/new" className="a-btn a-btn-fill a-btn-sm hidden shrink-0 sm:inline-flex">
            List an item
          </Link>
        </div>
      </div>
      {children}
    </>
  );
}
