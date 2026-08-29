/**
 * Sample catalogue — ten listings per category.
 *
 * These exist so every page renders as a real storefront before a single seller
 * has arrived: an empty grid tells you nothing about whether the layout, the
 * type scale or the detail page actually work.
 *
 * They are shown ONLY when the database returns no rows, every one is badged
 * "Sample", and NEXT_PUBLIC_HIDE_DEMO_LISTINGS=true removes them entirely —
 * which is what production should set at launch.
 *
 * Prices are in rupees here and converted to paise by the builder, because
 * hand-writing paise in a data table is how you end up with a ₹740 laptop.
 */

import { CATEGORIES, categoryBySlug, type IconName } from "./categories";

type Row = [
  title: string,
  price: number,
  was: number,
  condition: "like_new" | "good" | "fair",
  note: string,
  specs: Record<string, string>,
];

const CITIES = ["Bengaluru", "Bengaluru", "Bengaluru", "Whitefield", "Koramangala", "HSR Layout", "Indiranagar", "Marathahalli", "Jayanagar", "Sarjapur Road"];

const CATALOGUE: Record<string, Row[]> = {
  phones: [
    ["iPhone 14 Pro 256GB, Deep Purple", 52000, 129900, "good", "IMEI checked · 89% battery", { Brand: "Apple", Storage: "256 GB", "Battery health": "89%", Colour: "Deep Purple", Age: "2 years" }],
    ["iPhone 13 128GB, Midnight", 34500, 79900, "good", "IMEI checked · 87% battery", { Brand: "Apple", Storage: "128 GB", "Battery health": "87%", Colour: "Midnight", Age: "3 years" }],
    ["iPhone 15 128GB, Blue", 48000, 79900, "like_new", "IMEI checked · 96% battery", { Brand: "Apple", Storage: "128 GB", "Battery health": "96%", Colour: "Blue", Age: "1 year" }],
    ["Samsung Galaxy S23 Ultra 256GB", 44000, 124999, "good", "IMEI checked · boxed", { Brand: "Samsung", Storage: "256 GB", RAM: "12 GB", Colour: "Phantom Black", Age: "2 years" }],
    ["Samsung Galaxy S22 128GB, Green", 24000, 72999, "good", "IMEI checked · 91% battery", { Brand: "Samsung", Storage: "128 GB", RAM: "8 GB", Colour: "Green", Age: "3 years" }],
    ["Google Pixel 8 128GB, Obsidian", 32000, 75999, "like_new", "IMEI checked · under warranty", { Brand: "Google", Storage: "128 GB", RAM: "8 GB", Colour: "Obsidian", Age: "1 year" }],
    ["OnePlus 12 256GB, Flowy Emerald", 38000, 64999, "like_new", "IMEI checked · boxed", { Brand: "OnePlus", Storage: "256 GB", RAM: "12 GB", Colour: "Flowy Emerald", Age: "1 year" }],
    ["Nothing Phone (2) 256GB", 22500, 44999, "good", "IMEI checked · Glyph intact", { Brand: "Nothing", Storage: "256 GB", RAM: "12 GB", Colour: "White", Age: "2 years" }],
    ["Xiaomi 13 Pro 256GB, Ceramic Black", 27000, 79999, "good", "IMEI checked · Leica optics", { Brand: "Xiaomi", Storage: "256 GB", RAM: "12 GB", Colour: "Ceramic Black", Age: "2 years" }],
    ["iPad Pro 11-inch M2 256GB + Pencil", 58000, 99900, "like_new", "Serial verified · screen flawless", { Brand: "Apple", Storage: "256 GB", Chip: "Apple M2", Connectivity: "Wi-Fi", Age: "1 year" }],
  ],
  laptops: [
    ["MacBook Air M2, 16GB / 512GB", 74500, 114900, "like_new", "42 cycles · 100% battery health", { Brand: "Apple", Chip: "Apple M2", RAM: "16 GB", Storage: "512 GB SSD", "Battery cycles": "42" }],
    ["MacBook Pro 14-inch M3 Pro, 18GB", 132000, 199900, "like_new", "88 cycles · AppleCare until 2027", { Brand: "Apple", Chip: "M3 Pro", RAM: "18 GB", Storage: "512 GB SSD", "Battery cycles": "88" }],
    ["ThinkPad X1 Carbon Gen 10, i7", 46000, 158000, "good", "Ex-corporate · data wiped", { Brand: "Lenovo", Processor: "Core i7-1265U", RAM: "16 GB", Storage: "512 GB SSD", Warranty: "Expired" }],
    ["Dell XPS 13 Plus, i7 / 16GB", 52000, 149990, "good", "SSD health 96%", { Brand: "Dell", Processor: "Core i7-1260P", RAM: "16 GB", Storage: "512 GB SSD", Display: "13.4in OLED" }],
    ["HP Spectre x360 14, i7 / 16GB", 48000, 139999, "good", "Convertible · stylus included", { Brand: "HP", Processor: "Core i7-1355U", RAM: "16 GB", Storage: "1 TB SSD", Display: "13.5in touch" }],
    ["ASUS ROG Zephyrus G14, RTX 4060", 78000, 149990, "good", "Thermals repasted · 0 throttle", { Brand: "ASUS", Processor: "Ryzen 9 7940HS", RAM: "16 GB", GPU: "RTX 4060", Storage: "1 TB SSD" }],
    ["MacBook Air M1, 8GB / 256GB", 38000, 92900, "good", "310 cycles · 91% health", { Brand: "Apple", Chip: "Apple M1", RAM: "8 GB", Storage: "256 GB SSD", "Battery cycles": "310" }],
    ["Lenovo IdeaPad Slim 5, Ryzen 5", 26000, 58990, "good", "Student machine · light use", { Brand: "Lenovo", Processor: "Ryzen 5 7530U", RAM: "16 GB", Storage: "512 GB SSD", Display: "14in FHD" }],
    ["Acer Swift Go 14, i5 / 16GB", 29500, 62999, "like_new", "Under warranty to 2026", { Brand: "Acer", Processor: "Core i5-13500H", RAM: "16 GB", Storage: "512 GB SSD", Display: "14in OLED" }],
    ["Dell Latitude 5430, i5 (bulk lot unit)", 21000, 89000, "good", "Ex-corporate · data wipe certified", { Brand: "Dell", Processor: "Core i5-1235U", RAM: "16 GB", Storage: "256 GB SSD", Source: "Corporate refresh" }],
  ],
  "home-office": [
    ["Herman Miller Aeron, Size B", 38000, 110000, "good", "Fully adjustable · no tears", { Brand: "Herman Miller", Size: "B (medium)", Material: "8Z Pellicle", Age: "5 years", Adjustments: "Full" }],
    ["Dell UltraSharp 27in 4K Monitor", 21500, 58000, "like_new", "Zero dead pixels · stand included", { Brand: "Dell", Size: "27 inch", Resolution: "3840 x 2160", Panel: "IPS", Ports: "USB-C, HDMI, DP" }],
    ["LG 34in UltraWide QHD Monitor", 26000, 62000, "good", "Colour calibrated", { Brand: "LG", Size: "34 inch", Resolution: "3440 x 1440", Panel: "IPS", "Refresh rate": "75 Hz" }],
    ["Autonomous SmartDesk Standing Desk", 16500, 42000, "good", "Motor tested · 120kg rated", { Brand: "Autonomous", Top: "140 x 70 cm", Mechanism: "Dual motor", "Height range": "72-120 cm", Age: "3 years" }],
    ["Steelcase Series 1 Task Chair", 19000, 48000, "good", "Lumbar support intact", { Brand: "Steelcase", Type: "Task chair", Adjustments: "4D arms", Age: "4 years", Colour: "Graphite" }],
    ["Apple Magic Keyboard + Magic Mouse", 8500, 19900, "like_new", "Both boxed", { Brand: "Apple", Layout: "US English", Connectivity: "Bluetooth", Charging: "Lightning", Age: "1 year" }],
    ["Logitech MX Master 3S + MX Keys", 9800, 22000, "like_new", "Barely used", { Brand: "Logitech", Type: "Mouse + keyboard", Connectivity: "Bolt / Bluetooth", Battery: "USB-C", Age: "1 year" }],
    ["BenQ ScreenBar Halo Monitor Light", 6500, 14500, "like_new", "Boxed with remote", { Brand: "BenQ", Type: "Monitor light bar", Power: "USB-C", Control: "Wireless remote", Age: "1 year" }],
    ["HP LaserJet Pro M404dn Printer", 11000, 28000, "good", "Fresh toner fitted", { Brand: "HP", Type: "Mono laser", Speed: "38 ppm", Duplex: "Yes", Network: "Ethernet" }],
    ["CyberPower 1500VA UPS", 7200, 16500, "good", "Batteries replaced 2025", { Brand: "CyberPower", Capacity: "1500 VA", Outlets: "8", Battery: "Replaced 2025", Runtime: "~25 min" }],
  ],
  electronics: [
    ["Sony A7 III with 28-70mm kit lens", 82000, 164990, "good", "18,400 shutter actuations", { Brand: "Sony", Type: "Mirrorless", Sensor: "24MP full-frame", "Shutter count": "18,400", Mount: "Sony E" }],
    ["Canon EOS R6 Body", 98000, 215995, "good", "24,100 actuations · 2 batteries", { Brand: "Canon", Type: "Mirrorless", Sensor: "20MP full-frame", "Shutter count": "24,100", Mount: "RF" }],
    ["Fujifilm X-T4 with 18-55mm", 78000, 154999, "good", "Film simulations · boxed", { Brand: "Fujifilm", Type: "Mirrorless", Sensor: "26MP APS-C", "Shutter count": "12,800", Mount: "Fujifilm X" }],
    ["PlayStation 5 Slim with 2 controllers", 34000, 54990, "like_new", "Boxed · under warranty", { Brand: "Sony", Model: "PS5 Slim Disc", Storage: "1 TB SSD", Controllers: "2", Warranty: "To Mar 2027" }],
    ["Xbox Series X 1TB", 29500, 52990, "good", "Boxed · 1 controller", { Brand: "Microsoft", Model: "Series X", Storage: "1 TB SSD", Controllers: "1", Age: "2 years" }],
    ["NVIDIA RTX 4070 Ti Founders Edition", 48000, 79000, "good", "Never mined · stress tested", { Brand: "NVIDIA", VRAM: "12 GB GDDR6X", Interface: "PCIe 4.0", "Power draw": "285 W", Age: "2 years" }],
    ["Sennheiser HD 660S Headphones", 18500, 39990, "good", "New earpads fitted", { Brand: "Sennheiser", Type: "Open-back", Impedance: "150 ohm", Cable: "6.3mm + 4.4mm", Age: "3 years" }],
    ["Sony WH-1000XM5 Wireless", 16500, 34990, "like_new", "Case and cables included", { Brand: "Sony", Type: "Over-ear ANC", Battery: "30 hours", Codec: "LDAC", Age: "1 year" }],
    ["Apple Watch Series 9, 45mm GPS", 22000, 44900, "like_new", "Serial verified · 2 straps", { Brand: "Apple", Size: "45 mm", Connectivity: "GPS", Case: "Aluminium", Age: "1 year" }],
    ["DJI Mini 3 Pro Fly More Combo", 52000, 99900, "good", "3 batteries · under 250g", { Brand: "DJI", Weight: "249 g", Camera: "48MP / 4K60", Batteries: "3", "Flight time": "34 min" }],
  ],
  "home-furniture": [
    ["Teak 6-Seater Dining Table", 24000, 72000, "good", "Solid wood · minor surface marks", { Material: "Solid teak", Seats: "6", Dimensions: "180 x 90 cm", Age: "6 years", Finish: "Natural" }],
    ["L-Shaped Fabric Sofa, 5-Seater", 32000, 89000, "good", "Professionally cleaned", { Material: "Fabric", Seats: "5", Dimensions: "270 x 180 cm", Age: "4 years", Colour: "Charcoal" }],
    ["King Size Bed with Hydraulic Storage", 28000, 76000, "good", "Mattress not included", { Material: "Engineered wood", Size: "King (78 x 72 in)", Storage: "Hydraulic lift", Age: "3 years", Finish: "Walnut" }],
    ["4-Door Sliding Wardrobe", 22000, 65000, "good", "Mirror intact · runners smooth", { Material: "Engineered wood", Doors: "4 sliding", Dimensions: "240 x 220 cm", Age: "5 years", Mirror: "Yes" }],
    ["Solid Sheesham Bookshelf, 5 Tier", 9500, 26000, "good", "Sturdy · no wobble", { Material: "Sheesham", Tiers: "5", Dimensions: "90 x 180 cm", Age: "4 years", Finish: "Honey" }],
    ["Marble-Top Coffee Table", 12500, 34000, "like_new", "No chips or stains", { Material: "Marble + steel", Dimensions: "110 x 60 cm", Age: "2 years", Colour: "White / gold", Shape: "Rectangular" }],
    ["Recliner Armchair, Leatherette", 14000, 38000, "good", "Mechanism smooth", { Material: "Leatherette", Type: "Manual recliner", Age: "3 years", Colour: "Tan", Seats: "1" }],
    ["Shoe Cabinet, 3 Flip Doors", 5500, 15000, "good", "Fits ~18 pairs", { Material: "Engineered wood", Capacity: "18 pairs", Dimensions: "100 x 100 cm", Age: "3 years", Finish: "White" }],
    ["Study Table with Drawers", 6800, 18000, "good", "Cable grommet fitted", { Material: "Engineered wood", Dimensions: "120 x 60 cm", Drawers: "3", Age: "3 years", Finish: "Oak" }],
    ["Hand-Knotted Wool Rug, 6x9ft", 18000, 52000, "good", "Professionally cleaned", { Material: "Wool", Size: "6 x 9 ft", Age: "5 years", Pattern: "Persian", Pile: "Hand-knotted" }],
  ],
  appliances: [
    ["LG 260L Double Door Refrigerator", 14500, 34990, "good", "3 years old · working perfectly", { Brand: "LG", Capacity: "260 L", Type: "Double door", Rating: "3 star", Age: "3 years" }],
    ["Samsung 8kg Front Load Washing Machine", 18500, 42990, "good", "Drum serviced 2025", { Brand: "Samsung", Capacity: "8 kg", Type: "Front load", Rating: "5 star", Age: "4 years" }],
    ["Daikin 1.5 Ton Inverter Split AC", 22000, 52000, "good", "Gas topped up · serviced", { Brand: "Daikin", Capacity: "1.5 ton", Type: "Inverter split", Rating: "5 star", Age: "3 years" }],
    ["IFB 30L Convection Microwave", 8500, 21990, "good", "All accessories included", { Brand: "IFB", Capacity: "30 L", Type: "Convection", Age: "4 years", Accessories: "Turntable, rack" }],
    ["Bosch 12 Place Dishwasher", 24000, 54990, "good", "Ex-display · lightly used", { Brand: "Bosch", Capacity: "12 place", Programmes: "6", Rating: "4 star", Age: "2 years" }],
    ["Kent Grand Plus RO Water Purifier", 6500, 18500, "good", "Filters replaced 2026", { Brand: "Kent", Type: "RO + UV + UF", Capacity: "8 L", Filters: "Replaced 2026", Age: "3 years" }],
    ["Dyson V11 Absolute Cordless Vacuum", 26000, 52900, "good", "Battery holds 45 min", { Brand: "Dyson", Model: "V11 Absolute", Runtime: "45 min", Attachments: "6", Age: "3 years" }],
    ["Preethi Zodiac Mixer Grinder 750W", 4200, 9500, "good", "All 5 jars included", { Brand: "Preethi", Power: "750 W", Jars: "5", Age: "3 years", Warranty: "Expired" }],
    ["Havells 25L Storage Water Geyser", 5500, 13500, "good", "Element replaced 2025", { Brand: "Havells", Capacity: "25 L", Type: "Storage", Rating: "5 star", Age: "4 years" }],
    ["Philips Air Purifier AC2887", 9500, 24995, "good", "New HEPA filter fitted", { Brand: "Philips", Coverage: "333 sq ft", Filter: "HEPA (new)", CADR: "333 m3/hr", Age: "3 years" }],
  ],
  "kids-baby": [
    ["Bugaboo Fox 3 Pram", 42000, 115000, "good", "Rain cover and bassinet included", { Brand: "Bugaboo", Type: "Full-size pram", Includes: "Bassinet, rain cover", Age: "2 years", "Weight limit": "22 kg" }],
    ["Chicco KeyFit 30 Infant Car Seat", 8500, 22000, "good", "Manufactured 2023 · not expired", { Brand: "Chicco", Type: "Infant carrier", Manufactured: "2023", Expires: "2029", "Weight range": "1.8-13 kg" }],
    ["Solid Wood Convertible Cot", 14000, 38000, "good", "Converts to toddler bed", { Material: "Solid pine", Type: "Convertible cot", Mattress: "Not included", Age: "2 years", Sides: "Drop-side" }],
    ["Stokke Tripp Trapp High Chair", 16000, 32000, "good", "Baby set included", { Brand: "Stokke", Material: "Beech", Includes: "Baby set, tray", Age: "3 years", Adjustable: "Yes" }],
    ["Ergobaby Omni 360 Carrier", 6500, 15900, "like_new", "All 4 positions", { Brand: "Ergobaby", Positions: "4", "Weight range": "3.2-20 kg", Age: "1 year", Colour: "Grey" }],
    ["Fisher-Price Deluxe Bouncer", 4200, 9500, "good", "Batteries tested", { Brand: "Fisher-Price", Type: "Bouncer", Modes: "Vibration, music", Age: "2 years", "Weight limit": "9 kg" }],
    ["Hot Wheels Kids Bicycle, 16 inch", 3800, 8500, "good", "Training wheels included", { Type: "Kids bicycle", Size: "16 inch", Age: "3-6 years", Extras: "Training wheels", Brakes: "Caliper" }],
    ["Kids Study Table & Chair Set", 5500, 13000, "good", "Height adjustable", { Material: "Engineered wood", Type: "Table + chair", Adjustable: "Yes", Age: "2 years", "Age range": "4-10 years" }],
    ["Wooden Activity Gym & Play Mat", 3200, 7500, "like_new", "Machine-washed mat", { Material: "Beech + cotton", Type: "Activity gym", Toys: "5 hanging", Age: "1 year", Washable: "Yes" }],
    ["LEGO Duplo Town Set, 120 pieces", 2400, 5500, "good", "All pieces counted", { Brand: "LEGO", Range: "Duplo", Pieces: "120 (complete)", "Age range": "2-5 years", Box: "Included" }],
  ],
};

/* Categories without a hand-written table get a generated set built from the
   category's own subcategory terms. It always produces exactly ten: when a
   category has fewer terms than that (Others has one), the list cycles and each
   repeat takes a distinct variant so no two titles collide. */
const GENERIC_CONDITIONS: Row[3][] = ["like_new", "good", "good", "good", "fair"];

/* Nine variants, no empty string: a wrapped entry always takes one, which is
   what keeps titles unique when a category has fewer terms than slots. */
const VARIANTS = [
  "Premium", "Compact", "Heavy-duty", "Starter", "Professional",
  "Everyday", "Deluxe", "Essential", "Classic",
];

const PER_CATEGORY = 10;

function generatedRows(slug: string): Row[] {
  const c = categoryBySlug.get(slug);
  if (!c || c.subcategories.length === 0) return [];

  const base = Math.max(c.minPricePaise / 100, 400);
  const span = Math.min(c.maxPricePaise / 100, 60000) - base;

  return Array.from({ length: PER_CATEGORY }, (_, i) => {
    const sub = c.subcategories[i % c.subcategories.length];
    // Only label a variant once the list has wrapped, so the first pass reads
    // as the plain subcategory names people actually search for.
    const lap = Math.floor(i / c.subcategories.length);
    // Indexing by `i` rather than by lap guarantees a distinct variant for each
    // slot, even where a category has a single term and every entry wraps.
    const variant = lap > 0 ? VARIANTS[i % VARIANTS.length] : "";
    const title = variant ? `${variant} ${sub}` : sub;

    // Deterministic spread across the category's price band.
    const t = ((i * 7 + 3) % 10) / 10;
    const was = Math.round((base + span * (0.25 + t * 0.7)) / 100) * 100;
    const price = Math.round((was * (0.32 + ((i * 3) % 7) / 20)) / 100) * 100;
    const condition = GENERIC_CONDITIONS[i % GENERIC_CONDITIONS.length];

    return [
      `${title} — ${c.label.replace(/s$/, "")}`,
      price,
      was,
      condition,
      "Photos verified · price checked",
      {
        Category: c.label,
        Type: sub,
        Condition: condition.replace(/_/g, " "),
        Location: "Bengaluru",
      },
    ] as Row;
  });
}

export interface SampleListing {
  id: string;
  publicId: string;
  slug: string;
  title: string;
  pricePaise: number;
  wasPaise: number;
  categorySlug: string;
  categoryLabel: string;
  icon: IconName;
  condition: string;
  city: string;
  note: string;
  specs: Record<string, string>;
  isSample: true;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export const SAMPLE_LISTINGS: SampleListing[] = CATEGORIES.flatMap((c) => {
  const rows = CATALOGUE[c.slug] ?? generatedRows(c.slug);
  if (rows.length !== PER_CATEGORY) {
    // Loud rather than silent: a short category means a half-empty page, which
    // is exactly the thing sample data exists to prevent.
    throw new Error(`Category "${c.slug}" has ${rows.length} sample listings, expected ${PER_CATEGORY}`);
  }
  return rows.map((r, i) => {
    const [title, price, was, condition, note, specs] = r;
    return {
      id: `${c.slug}-${i + 1}`,
      publicId: `${c.slug}-${i + 1}`,
      slug: slugify(title),
      title,
      pricePaise: price * 100,
      wasPaise: was * 100,
      categorySlug: c.slug,
      categoryLabel: c.label,
      icon: c.icon,
      condition,
      city: CITIES[i % CITIES.length],
      note,
      specs,
      isSample: true as const,
    };
  });
});

const uniqueTitles = new Set(SAMPLE_LISTINGS.map((l) => l.title));
if (uniqueTitles.size !== SAMPLE_LISTINGS.length) {
  // Two listings sharing a title means two pages competing for the same query,
  // which is worse than having one fewer listing.
  throw new Error(
    `Sample catalogue has ${SAMPLE_LISTINGS.length - uniqueTitles.size} duplicate titles`,
  );
}

export const sampleById = new Map(SAMPLE_LISTINGS.map((l) => [l.publicId, l]));

export function samplesForCategory(slug: string): SampleListing[] {
  return SAMPLE_LISTINGS.filter((l) => l.categorySlug === slug);
}

/** Sample data is a development aid, never a production feature. */
export function showSamples(): boolean {
  return process.env.NEXT_PUBLIC_HIDE_DEMO_LISTINGS !== "true";
}
