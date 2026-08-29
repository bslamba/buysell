import Link from "next/link";
import { ListingImage } from "./listing-image";
import { categoryBySlug, type IconName } from "@/config/categories";

export interface ListingCardData {
  id: string;
  publicId: string;
  title: string;
  pricePaise: number;
  wasPaise?: number;
  categorySlug: string;
  condition: string;
  city: string;
  note?: string;
  isSample?: boolean;
}

const CONDITION_LABEL: Record<string, string> = {
  new: "New",
  like_new: "Like new",
  good: "Good",
  fair: "Fair",
  for_parts: "For parts",
};

function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

/**
 * The store tile, matching the Apple Store grid: image first at a fixed 4:3,
 * then a condition chip, the title, and price last. Saving is shown as an
 * absolute rupee figure rather than a percentage — in resale the number people
 * actually respond to is "how much less than new".
 */
export function ListingCard({ item }: { item: ListingCardData }) {
  const category = categoryBySlug.get(item.categorySlug);
  const saved = item.wasPaise ? item.wasPaise - item.pricePaise : 0;

  return (
    <Link href={`/listing/${item.publicId}`} className="tile group flex flex-col p-4">
      <ListingImage seed={item.publicId} icon={(category?.icon ?? "box") as IconName} />

      <div className="flex flex-1 flex-col px-2 pb-1 pt-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-brand-100 px-2.5 py-0.5 t-caption font-semibold text-brand-700">
            {CONDITION_LABEL[item.condition] ?? item.condition.replace(/_/g, " ")}
          </span>
          {item.isSample && (
            <span className="rounded-full bg-surface px-2.5 py-0.5 t-caption font-semibold text-ink-3">
              Sample
            </span>
          )}
        </div>

        <h3 className="mt-3 text-[15px] font-semibold leading-snug tracking-[-0.01em]">
          {item.title}
        </h3>
        <p className="t-caption mt-1.5 text-ink-3">
          {category?.label ?? item.categorySlug} · {item.city}
        </p>
        {item.note && <p className="t-caption mt-1 text-ink-3">{item.note}</p>}

        <div className="mt-auto pt-5">
          <p className="text-[19px] font-semibold tracking-[-0.02em] tabular">{inr(item.pricePaise)}</p>
          {item.wasPaise && (
            <p className="t-caption mt-0.5 text-ink-3">
              <span className="line-through">{inr(item.wasPaise)}</span>
              <span className="ml-2 font-semibold text-ok">Save {inr(saved)}</span>
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
