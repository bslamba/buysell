/**
 * Category registry.
 *
 * One entry per listable category. This single file drives:
 *   • the home-page category rail and the /categories page
 *   • which structured attributes the sell form asks for
 *   • how hard the moderation engine checks a listing (tier + riskMultiplier)
 *   • the SEO title, description, keywords and subcategory copy for each
 *     /browse/<slug> landing page
 *
 * The taxonomy merges a Circle-style consumer rail with the top-level shape of a
 * general marketplace, adapted for India. Adding a category is an edit here and
 * nothing else.
 *
 * DELIBERATELY EXCLUDED, and why:
 *   • Real estate      — a different business with different regulation; the
 *                        incumbents (99acres, NoBroker) are not beatable with a
 *                        goods marketplace.
 *   • Gift cards       — among the highest-fraud categories on every marketplace
 *     & coupons          that has tried it; the buyer cannot verify value until
 *                        after payment, which breaks our whole model.
 *   • Tickets & travel — counterfeit tickets are unverifiable before the event,
 *                        so protection cannot be honoured.
 *   • Specialty        — services are not goods; no condition to certify.
 *     services
 * Each of these can be revisited, but only with a verification story. Listing
 * something we cannot check would undo the one thing that makes WorthIt worth
 * using.
 */

export type VerificationTier =
  | "certified" // software can interrogate the device -> full condition report
  | "assisted"  // serial/lookup checks + guided photos, no self-diagnostic
  | "basic";    // photo, price, prohibited-goods and seller checks only

export type CategoryGroup =
  | "tech"
  | "home"
  | "family"
  | "style"
  | "leisure"
  | "vehicles"
  | "business"
  | "other";

export interface CategorySeo {
  /** <title>. Aim for 50-60 characters including the brand suffix. */
  title: string;
  /** Meta description. 140-160 characters, written to be clicked, not stuffed. */
  description: string;
  /** Primary + long-tail terms. Used for keywords meta and to steer body copy. */
  keywords: string[];
  /** One paragraph of indexable copy on the category landing page. */
  intro: string;
}

export interface CategoryRule {
  slug: string;
  label: string;
  group: CategoryGroup;
  icon: IconName;
  blurb: string;
  tier: VerificationTier;

  /** Position in the home-page rail; omit to keep it off the rail. */
  rail?: number;

  /** Shown on the category page and used for long-tail SEO. */
  subcategories: string[];
  seo: CategorySeo;

  /** Listing constraints */
  minPricePaise: number;
  maxPricePaise: number;
  minImages: number;
  maxImages: number;

  /** Structured attributes the seller must provide (validated with zod). */
  requiredAttributes: string[];
  optionalAttributes?: string[];

  /** Identity / device checks */
  requiresSerial: boolean;
  requiresImei: boolean; // triggers the CEIR stolen-device lookup
  requiresInvoiceOrBox: boolean;

  /** Seller trust gates */
  requiresPhoneVerified: boolean;
  requiresKycAbovePaise?: number;

  /** Multiplies the moderation risk score. Fraud-heavy categories score harsher. */
  riskMultiplier: number;

  /** Words that make a listing an automatic reject in this category. */
  bannedTerms?: string[];

  /** Extra rules surfaced to the seller before they list. */
  notes?: string[];
}

export type IconName =
  | "grid" | "phone" | "laptop" | "desk" | "chip" | "sofa" | "washer"
  | "stroller" | "shirt" | "gem" | "palette" | "dice" | "dumbbell"
  | "car" | "book" | "briefcase" | "paw" | "music" | "sparkle" | "box";

const R = 100; // paise per rupee

export const CATEGORIES: CategoryRule[] = [
  /* ─── Tech ──────────────────────────────────────────────────────────── */
  {
    slug: "phones",
    label: "Phones",
    group: "tech",
    icon: "phone",
    rail: 1,
    blurb: "Smartphones, feature phones and tablets — every IMEI checked.",
    tier: "certified",
    subcategories: ["iPhone", "Samsung Galaxy", "OnePlus", "Xiaomi & Redmi", "Google Pixel", "Nothing", "Vivo & Oppo", "Realme", "Tablets & iPads", "Phone accessories"],
    seo: {
      title: "Used & Refurbished Mobile Phones in India",
      description: "Buy verified second-hand phones with the IMEI checked against India's stolen-device register, condition reported, and payment protected until you accept.",
      keywords: ["used mobile phones", "second hand phone", "refurbished mobile india", "used iphone india", "buy old phone online", "sell my phone", "second hand mobile bangalore", "refurbished samsung"],
      intro: "Every phone listed here has had its IMEI checked against the Government of India's CEIR register before the listing went live, so a device reported lost or stolen never reaches you. Battery health and condition are reported up front, and your payment is held until the phone arrives and you confirm it matches.",
    },
    minPricePaise: 1_000 * R, maxPricePaise: 3_00_000 * R,
    minImages: 5, maxImages: 12,
    requiredAttributes: ["brand", "model", "storage_gb", "condition", "imei_last4"],
    optionalAttributes: ["ram_gb", "colour", "battery_health_pct", "warranty_until", "box_included"],
    requiresSerial: false, requiresImei: true, requiresInvoiceOrBox: false,
    requiresPhoneVerified: true, requiresKycAbovePaise: 40_000 * R,
    riskMultiplier: 1.6,
    bannedTerms: ["unlock service", "icloud bypass", "imei repair", "clone", "first copy", "master copy"],
    notes: ["Dial *#06# to find the IMEI.", "Devices on the CEIR blocked list are rejected automatically."],
  },
  {
    slug: "laptops",
    label: "Laptops",
    group: "tech",
    icon: "laptop",
    rail: 2,
    blurb: "Laptops and notebooks with battery, drive and thermal health reported.",
    tier: "certified",
    subcategories: ["MacBook", "Dell", "HP", "Lenovo ThinkPad", "ASUS", "Acer", "Gaming laptops", "Chromebooks", "2-in-1 & convertibles", "Laptop accessories"],
    seo: {
      title: "Used & Refurbished Laptops in India",
      description: "Second-hand laptops with a real condition report — battery cycles, drive health and thermals read from the machine itself, not guessed from a photo.",
      keywords: ["used laptop", "second hand laptop india", "refurbished laptop", "buy used macbook india", "second hand laptop bangalore", "used gaming laptop", "refurbished thinkpad", "sell my laptop"],
      intro: "Nobody can tell a good used laptop from a bad one by looking at it. That is why every certified listing here carries a report read from the machine itself: battery cycle count and health, SSD wear and reallocated sectors, memory test results and thermal behaviour under load. If the report is wrong, you are refunded.",
    },
    minPricePaise: 2_000 * R, maxPricePaise: 5_00_000 * R,
    minImages: 5, maxImages: 15,
    requiredAttributes: ["brand", "model", "processor", "ram_gb", "storage_gb", "year", "condition"],
    optionalAttributes: ["gpu", "screen_size", "battery_health_pct", "warranty_until", "charger_included"],
    requiresSerial: true, requiresImei: false, requiresInvoiceOrBox: false,
    requiresPhoneVerified: true, requiresKycAbovePaise: 50_000 * R,
    riskMultiplier: 1.3,
    notes: ["The serial is on the underside, or run `system_profiler` / `wmic bios get serialnumber`."],
  },
  {
    slug: "home-office",
    label: "Home Office",
    group: "tech",
    icon: "desk",
    rail: 3,
    blurb: "Desks, chairs, monitors and everything around them.",
    tier: "assisted",
    subcategories: ["Monitors", "Office chairs", "Standing desks", "Keyboards & mice", "Webcams & mics", "Printers & scanners", "UPS & power", "Docking stations", "Desk lamps", "Cable management"],
    seo: {
      title: "Used Home Office Furniture & Monitors in India",
      description: "Second-hand desks, ergonomic chairs, monitors and peripherals — checked, photographed properly, and bought with payment protection.",
      keywords: ["used office chair", "second hand monitor", "used standing desk india", "refurbished monitor", "second hand office furniture bangalore", "used ergonomic chair", "buy used keyboard"],
      intro: "Setting up a desk from scratch is expensive and almost entirely unnecessary — offices refresh their furniture and hardware constantly. Everything in this category is photographed to a standard, checked for original imagery, and priced against what comparable items actually sold for.",
    },
    minPricePaise: 300 * R, maxPricePaise: 3_00_000 * R,
    minImages: 4, maxImages: 12,
    requiredAttributes: ["type", "brand", "condition"],
    optionalAttributes: ["model", "size", "colour", "age_years"],
    requiresSerial: false, requiresImei: false, requiresInvoiceOrBox: false,
    requiresPhoneVerified: true, riskMultiplier: 1.0,
  },
  {
    slug: "electronics",
    label: "Electronics",
    group: "tech",
    icon: "chip",
    rail: 4,
    blurb: "Cameras, audio, gaming, wearables and components.",
    tier: "assisted",
    subcategories: ["Cameras & lenses", "Headphones & earbuds", "Speakers & soundbars", "Gaming consoles", "Graphics cards", "Smart watches", "Drones", "TVs & projectors", "Storage & networking", "Smart home"],
    seo: {
      title: "Used Electronics, Cameras & Audio in India",
      description: "Second-hand cameras, headphones, consoles, GPUs and wearables with serial checks, original-photo verification and protected payment.",
      keywords: ["used electronics india", "second hand camera", "used dslr india", "second hand ps5", "used graphics card india", "refurbished headphones", "second hand smartwatch", "used gaming console"],
      intro: "Counterfeits are the problem in this category, not condition — the market is full of convincing fakes of premium audio and camera gear. Serial numbers are checked where the manufacturer supports it, photographs are fingerprinted against every image ever uploaded here, and known counterfeit phrasing is rejected outright.",
    },
    minPricePaise: 300 * R, maxPricePaise: 10_00_000 * R,
    minImages: 5, maxImages: 15,
    requiredAttributes: ["type", "brand", "model", "condition"],
    optionalAttributes: ["year", "shutter_count", "warranty_until", "accessories", "box_included"],
    requiresSerial: true, requiresImei: false, requiresInvoiceOrBox: false,
    requiresPhoneVerified: true, requiresKycAbovePaise: 60_000 * R,
    riskMultiplier: 1.4,
    bannedTerms: ["first copy", "master copy", "replica", "7a quality", "aaa quality", "1:1 copy"],
  },

  /* ─── Home ──────────────────────────────────────────────────────────── */
  {
    slug: "home-furniture",
    label: "Home Furniture",
    group: "home",
    icon: "sofa",
    rail: 5,
    blurb: "Sofas, beds, dining, storage and decor.",
    tier: "basic",
    subcategories: ["Sofas & seating", "Beds & mattresses", "Dining tables", "Wardrobes & storage", "Shoe racks", "Bookshelves", "Coffee tables", "Mirrors", "Rugs & curtains", "Lighting & decor"],
    seo: {
      title: "Used Furniture Online in India — Sofas, Beds, Storage",
      description: "Buy and sell second-hand furniture with photo verification, honest condition grading and payment held until delivery.",
      keywords: ["used furniture india", "second hand sofa", "second hand furniture bangalore", "used bed online", "buy old furniture", "second hand wardrobe", "used dining table", "sell furniture online india"],
      intro: "Furniture is where the most money is wasted and the most is thrown away — a good sofa outlives three owners. Listings here are checked for original photographs and honest condition grading, and large items can be handed over locally with the payment still protected.",
    },
    minPricePaise: 200 * R, maxPricePaise: 10_00_000 * R,
    minImages: 4, maxImages: 12,
    requiredAttributes: ["type", "material", "condition"],
    optionalAttributes: ["brand", "dimensions", "colour", "age_years", "assembly_required"],
    requiresSerial: false, requiresImei: false, requiresInvoiceOrBox: false,
    requiresPhoneVerified: true, riskMultiplier: 0.7,
    notes: ["Large items can be handed over locally — the payment protection still applies."],
  },
  {
    slug: "appliances",
    label: "Appliances",
    group: "home",
    icon: "washer",
    rail: 6,
    blurb: "Fridges, washing machines, ACs and kitchen appliances.",
    tier: "assisted",
    subcategories: ["Refrigerators", "Washing machines", "Air conditioners", "Microwaves & ovens", "Water purifiers", "Air purifiers", "Mixers & grinders", "Dishwashers", "Geysers", "Vacuum cleaners"],
    seo: {
      title: "Used Home Appliances in India — Fridges, ACs, Washing Machines",
      description: "Second-hand appliances with age, condition and working status declared up front, and payment held until the unit is delivered and checked.",
      keywords: ["used appliances india", "second hand refrigerator", "used washing machine", "second hand ac bangalore", "used microwave", "buy second hand fridge", "used air conditioner india"],
      intro: "An appliance either works or it does not, and that is the one thing a photograph cannot tell you. Sellers here must declare age, working status and any known faults, and the payment stays held until the unit is delivered, installed where relevant, and confirmed working.",
    },
    minPricePaise: 500 * R, maxPricePaise: 5_00_000 * R,
    minImages: 4, maxImages: 12,
    requiredAttributes: ["type", "brand", "model", "age_years", "condition", "working_status"],
    optionalAttributes: ["capacity", "energy_rating", "warranty_until", "installation_included"],
    requiresSerial: false, requiresImei: false, requiresInvoiceOrBox: false,
    requiresPhoneVerified: true, riskMultiplier: 0.9,
    notes: ["Declare any known fault. Hiding one is the fastest way to lose a dispute."],
  },
  {
    slug: "pet-supplies",
    label: "Pet Supplies",
    group: "home",
    icon: "paw",
    blurb: "Crates, carriers, beds, aquariums and accessories.",
    tier: "basic",
    subcategories: ["Crates & carriers", "Pet beds", "Aquariums", "Cages & enclosures", "Grooming tools", "Feeders & bowls", "Leashes & harnesses", "Pet strollers"],
    seo: {
      title: "Used Pet Supplies & Accessories in India",
      description: "Second-hand crates, carriers, aquariums and pet furniture, checked and bought with payment protection.",
      keywords: ["used pet supplies india", "second hand dog crate", "used aquarium", "second hand pet carrier", "used cat tree india"],
      intro: "Pet gear is outgrown almost as fast as children's. Crates, carriers and aquariums have long lives and hold their value; listings here are checked for original photos and honest condition.",
    },
    minPricePaise: 100 * R, maxPricePaise: 2_00_000 * R,
    minImages: 3, maxImages: 10,
    requiredAttributes: ["type", "condition"],
    optionalAttributes: ["brand", "size", "suitable_for"],
    requiresSerial: false, requiresImei: false, requiresInvoiceOrBox: false,
    requiresPhoneVerified: true, riskMultiplier: 0.7,
    notes: ["Live animals may not be listed under any circumstances."],
  },

  /* ─── Family ────────────────────────────────────────────────────────── */
  {
    slug: "kids-baby",
    label: "Kids & Baby",
    group: "family",
    icon: "stroller",
    rail: 7,
    blurb: "Prams, cots, car seats, toys and clothing.",
    tier: "basic",
    subcategories: ["Prams & strollers", "Cots & cribs", "Car seats", "High chairs", "Baby carriers", "Walkers & rockers", "Kids' furniture", "Toys & activity gyms", "Kids' cycles", "Baby clothing"],
    seo: {
      title: "Used Baby & Kids Products in India — Prams, Cots, Car Seats",
      description: "Second-hand prams, cots, car seats and kids' gear, condition-checked and bought with payment protection.",
      keywords: ["used baby products india", "second hand pram", "used cot india", "second hand car seat", "used stroller bangalore", "buy second hand baby items", "used kids cycle"],
      intro: "Children outgrow everything in months, which is exactly why this is the category where buying used makes the most obvious sense. Sellers must declare age and any recall status, and safety-critical items — car seats especially — carry extra checks.",
    },
    minPricePaise: 100 * R, maxPricePaise: 2_00_000 * R,
    minImages: 4, maxImages: 12,
    requiredAttributes: ["type", "age_group", "condition"],
    optionalAttributes: ["brand", "model", "age_years", "recall_checked"],
    requiresSerial: false, requiresImei: false, requiresInvoiceOrBox: false,
    requiresPhoneVerified: true, riskMultiplier: 0.9,
    notes: [
      "Car seats must state manufacture date — most expire 6-8 years from manufacture.",
      "Anything subject to a safety recall is rejected.",
      "Used feeding bottles, teats, breast pumps and mattresses are not permitted for hygiene reasons.",
    ],
  },

  /* ─── Style ─────────────────────────────────────────────────────────── */
  {
    slug: "fashion",
    label: "Fashion",
    group: "style",
    icon: "shirt",
    rail: 8,
    blurb: "Clothing, footwear, bags and accessories.",
    tier: "basic",
    subcategories: ["Men's clothing", "Women's clothing", "Sarees & ethnic wear", "Sneakers", "Formal shoes", "Handbags", "Backpacks & luggage", "Sunglasses", "Belts & wallets", "Winter wear"],
    seo: {
      title: "Pre-owned Fashion, Sneakers & Bags in India",
      description: "Second-hand clothing, sneakers, bags and accessories — counterfeit-screened, condition-graded and protected at checkout.",
      keywords: ["preloved fashion india", "second hand clothes online", "used sneakers india", "thrift store online india", "second hand bags", "preowned designer india", "used luggage"],
      intro: "The problem in resale fashion is authenticity, not wear. Listings using counterfeit vocabulary — first copy, replica, mirror quality — are rejected automatically, and higher-value branded items are held for a human look before they go live.",
    },
    minPricePaise: 100 * R, maxPricePaise: 5_00_000 * R,
    minImages: 4, maxImages: 12,
    requiredAttributes: ["type", "size", "condition"],
    optionalAttributes: ["brand", "colour", "material", "fit"],
    requiresSerial: false, requiresImei: false, requiresInvoiceOrBox: false,
    requiresPhoneVerified: true, riskMultiplier: 1.3,
    bannedTerms: ["first copy", "master copy", "1st copy", "replica", "mirror quality", "7a quality", "aaa quality", "duplicate brand"],
    notes: ["Used innerwear, swimwear and socks are not permitted for hygiene reasons."],
  },
  {
    slug: "jewellery-watches",
    label: "Jewellery & Watches",
    group: "style",
    icon: "gem",
    blurb: "Watches, fashion jewellery and eyewear.",
    tier: "assisted",
    subcategories: ["Wrist watches", "Smart watches", "Fashion jewellery", "Silver jewellery", "Watch straps", "Eyewear frames", "Cufflinks", "Watch winders"],
    seo: {
      title: "Pre-owned Watches & Jewellery in India",
      description: "Second-hand watches and jewellery with serial checks where the maker supports them, counterfeit screening and protected payment.",
      keywords: ["preowned watches india", "second hand watch", "used luxury watch india", "buy second hand watch online", "preloved jewellery india"],
      intro: "Watches carry serial numbers, and where the manufacturer supports a lookup we use it. Counterfeit vocabulary is rejected outright, and higher-value pieces always get a human review before publication.",
    },
    minPricePaise: 300 * R, maxPricePaise: 20_00_000 * R,
    minImages: 5, maxImages: 15,
    requiredAttributes: ["type", "brand", "condition"],
    optionalAttributes: ["model", "material", "year", "box_and_papers", "serial"],
    requiresSerial: false, requiresImei: false, requiresInvoiceOrBox: false,
    requiresPhoneVerified: true, requiresKycAbovePaise: 50_000 * R,
    riskMultiplier: 1.7,
    bannedTerms: ["first copy", "master copy", "replica", "mirror quality", "aaa quality", "1:1"],
    notes: [
      "Gold and precious stones require hallmarking documentation and are reviewed manually.",
      "Loose gemstones and bullion may not be listed.",
    ],
  },
  {
    slug: "health-beauty",
    label: "Health & Beauty",
    group: "style",
    icon: "sparkle",
    blurb: "Sealed cosmetics, grooming devices and fitness wearables.",
    tier: "basic",
    subcategories: ["Hair dryers & stylers", "Trimmers & shavers", "Massagers", "Sealed fragrances", "Sealed skincare", "Fitness trackers", "Weighing scales"],
    seo: {
      title: "Grooming Devices & Sealed Beauty Products in India",
      description: "Hair stylers, trimmers, massagers and unopened beauty products, checked before listing and bought with payment protection.",
      keywords: ["used hair dryer india", "second hand trimmer", "used grooming devices", "sealed perfume india", "second hand massager"],
      intro: "Only devices and unopened, sealed products are permitted here — anything used that touches skin directly is refused for hygiene reasons, without exception. Grooming devices are checked for working status the same way appliances are.",
    },
    minPricePaise: 100 * R, maxPricePaise: 2_00_000 * R,
    minImages: 4, maxImages: 10,
    requiredAttributes: ["type", "condition", "sealed_status"],
    optionalAttributes: ["brand", "model", "expiry", "warranty_until"],
    requiresSerial: false, requiresImei: false, requiresInvoiceOrBox: false,
    requiresPhoneVerified: true, riskMultiplier: 1.4,
    bannedTerms: ["first copy", "replica", "tester", "unbranded serum", "prescription"],
    notes: [
      "Opened or used cosmetics, skincare and fragrances are not permitted.",
      "Medicines, supplements and anything prescription-only are prohibited.",
      "Sealed products must show an expiry date at least six months away.",
    ],
  },

  /* ─── Leisure ───────────────────────────────────────────────────────── */
  {
    slug: "collectibles",
    label: "Collectibles & Art",
    group: "leisure",
    icon: "palette",
    rail: 9,
    blurb: "Coins, stamps, cards, art, memorabilia and antiques.",
    tier: "basic",
    subcategories: ["Coins & currency", "Stamps", "Trading cards", "Comics", "Vinyl records", "Original art", "Prints & posters", "Film memorabilia", "Vintage advertising", "Die-cast models"],
    seo: {
      title: "Collectibles, Coins, Cards & Art in India",
      description: "Buy and sell collectibles, coins, trading cards, vinyl and original art with photo verification and protected payment.",
      keywords: ["collectibles india", "old coins for sale india", "buy trading cards india", "vintage collectibles online", "second hand vinyl records", "buy original art india"],
      intro: "Collectibles live or die on provenance and grading, which is exactly where photographs get borrowed from auction listings. Every image here is fingerprinted against everything ever uploaded, so a lifted catalogue photo does not get through.",
    },
    minPricePaise: 100 * R, maxPricePaise: 20_00_000 * R,
    minImages: 5, maxImages: 15,
    requiredAttributes: ["type", "condition"],
    optionalAttributes: ["year", "origin", "grading", "certificate", "artist"],
    requiresSerial: false, requiresImei: false, requiresInvoiceOrBox: false,
    requiresPhoneVerified: true, requiresKycAbovePaise: 50_000 * R,
    riskMultiplier: 1.3,
    notes: [
      "Antiquities over 100 years old are regulated under the Antiquities and Art Treasures Act, 1972 and may not be listed.",
      "Ivory, tortoiseshell and any wildlife-derived item is prohibited.",
    ],
  },
  {
    slug: "hobbies",
    label: "Hobbies & Toys",
    group: "leisure",
    icon: "dice",
    rail: 10,
    blurb: "Board games, RC, models, craft supplies and instruments.",
    tier: "basic",
    subcategories: ["Board games", "Puzzles", "RC cars & drones", "Model kits", "LEGO & building sets", "Craft supplies", "Video games", "Telescopes", "Gardening tools", "Camping gear"],
    seo: {
      title: "Used Hobby Gear, Board Games & Toys in India",
      description: "Second-hand board games, RC models, LEGO, craft supplies and video games — checked, graded and protected at checkout.",
      keywords: ["used board games india", "second hand lego", "used rc car india", "buy used video games india", "second hand toys online", "used camping gear india"],
      intro: "Hobby gear cycles through owners constantly and holds condition well. Completeness matters more than wear here, so sellers must declare missing pieces — an incomplete set sold as complete is a dispute we will find against.",
    },
    minPricePaise: 100 * R, maxPricePaise: 3_00_000 * R,
    minImages: 3, maxImages: 12,
    requiredAttributes: ["type", "condition", "completeness"],
    optionalAttributes: ["brand", "age_group", "pieces", "year"],
    requiresSerial: false, requiresImei: false, requiresInvoiceOrBox: false,
    requiresPhoneVerified: true, riskMultiplier: 0.8,
  },
  {
    slug: "sports-fitness",
    label: "Sports & Fitness",
    group: "leisure",
    icon: "dumbbell",
    rail: 11,
    blurb: "Gym equipment, cycles, cricket gear and outdoor kit.",
    tier: "basic",
    subcategories: ["Treadmills", "Dumbbells & weights", "Exercise bikes", "Bicycles", "Cricket gear", "Badminton & tennis", "Football & sports kit", "Yoga & pilates", "Trekking gear", "Swimming gear"],
    seo: {
      title: "Used Gym Equipment, Cycles & Sports Gear in India",
      description: "Second-hand treadmills, weights, bicycles and sports kit with working status declared and payment held until delivery.",
      keywords: ["used gym equipment india", "second hand treadmill", "used bicycle india", "second hand cycle bangalore", "used dumbbells", "second hand cricket kit", "used exercise bike india"],
      intro: "Home gym equipment is the most predictably resold category there is — bought in January, listed by March. Machines must have working status declared, and bicycles need frame numbers where they exist so a stolen cycle is harder to move.",
    },
    minPricePaise: 100 * R, maxPricePaise: 5_00_000 * R,
    minImages: 4, maxImages: 12,
    requiredAttributes: ["type", "condition"],
    optionalAttributes: ["brand", "model", "frame_number", "size", "age_years", "working_status"],
    requiresSerial: false, requiresImei: false, requiresInvoiceOrBox: false,
    requiresPhoneVerified: true, riskMultiplier: 0.9,
    notes: ["Bicycles should include the frame number where one exists."],
  },
  {
    slug: "books-media",
    label: "Books & Media",
    group: "leisure",
    icon: "book",
    blurb: "Textbooks, fiction, exam prep, films and music.",
    tier: "basic",
    subcategories: ["Textbooks", "Competitive exam prep", "Fiction", "Non-fiction", "Children's books", "Regional language books", "Comics & manga", "DVDs & Blu-ray", "Vinyl & CDs", "Sheet music"],
    seo: {
      title: "Used Books, Textbooks & Exam Prep in India",
      description: "Second-hand textbooks, exam prep material, fiction and media at a fraction of cover price, with condition graded honestly.",
      keywords: ["used books online india", "second hand textbooks", "buy used books india", "second hand exam books", "upsc books second hand", "used engineering books", "sell old books online india"],
      intro: "Textbooks lose most of their price the moment a syllabus edition changes, and almost none of their usefulness. Sellers must state the edition and year, because an outdated edition sold as current is the most common complaint in this category.",
    },
    minPricePaise: 20 * R, maxPricePaise: 1_00_000 * R,
    minImages: 2, maxImages: 8,
    requiredAttributes: ["title", "condition"],
    optionalAttributes: ["author", "edition", "year", "language", "isbn"],
    requiresSerial: false, requiresImei: false, requiresInvoiceOrBox: false,
    requiresPhoneVerified: true, riskMultiplier: 0.5,
    notes: ["Photocopied or pirated books are prohibited."],
  },
  {
    slug: "music-gear",
    label: "Musical Instruments",
    group: "leisure",
    icon: "music",
    blurb: "Guitars, keyboards, tabla, studio and stage gear.",
    tier: "assisted",
    subcategories: ["Acoustic guitars", "Electric guitars", "Keyboards & synths", "Tabla & percussion", "Harmonium", "Violins", "Amplifiers", "Audio interfaces", "Studio microphones", "DJ gear"],
    seo: {
      title: "Used Musical Instruments & Studio Gear in India",
      description: "Second-hand guitars, keyboards, tabla, amps and studio equipment with serial checks and payment held until you have played it.",
      keywords: ["used guitar india", "second hand keyboard india", "used musical instruments", "second hand tabla", "used amplifier india", "buy used synth india", "second hand studio gear"],
      intro: "Instruments improve with age and are among the safest things to buy used — provided the seller is honest about setup, action and any repair history. Serial numbers are checked where the maker supports it, and photographs must show the actual instrument.",
    },
    minPricePaise: 300 * R, maxPricePaise: 10_00_000 * R,
    minImages: 5, maxImages: 15,
    requiredAttributes: ["type", "brand", "condition"],
    optionalAttributes: ["model", "year", "serial", "repairs", "case_included"],
    requiresSerial: false, requiresImei: false, requiresInvoiceOrBox: false,
    requiresPhoneVerified: true, riskMultiplier: 1.1,
  },

  /* ─── Vehicles ──────────────────────────────────────────────────────── */
  {
    slug: "vehicles",
    label: "Vehicle Parts",
    group: "vehicles",
    icon: "car",
    rail: 12,
    blurb: "Car and bike parts, accessories, helmets and tyres.",
    tier: "assisted",
    subcategories: ["Car accessories", "Bike accessories", "Helmets", "Tyres & alloys", "Car audio", "Dash cams", "Seat covers", "Roof carriers", "Bike luggage", "Tools & garage"],
    seo: {
      title: "Used Car & Bike Parts and Accessories in India",
      description: "Second-hand vehicle parts, helmets, tyres and accessories with fitment declared and payment held until delivery.",
      keywords: ["used car parts india", "second hand bike parts", "used helmet india", "second hand alloy wheels", "used car accessories", "second hand tyres india"],
      intro: "Parts and accessories only — whole vehicles need RTO transfer and insurance handling that a goods marketplace should not pretend to do. Sellers must state exact fitment, because a part that does not fit is the single biggest source of returns here.",
    },
    minPricePaise: 100 * R, maxPricePaise: 5_00_000 * R,
    minImages: 4, maxImages: 12,
    requiredAttributes: ["type", "condition", "fits_make_model"],
    optionalAttributes: ["brand", "part_number", "year", "km_used"],
    requiresSerial: false, requiresImei: false, requiresInvoiceOrBox: false,
    requiresPhoneVerified: true, riskMultiplier: 1.2,
    notes: [
      "Whole vehicles are not listed here — registration transfer is outside what we can protect.",
      "Helmets must be ISI-marked and free of impact damage.",
      "Airbags, and any safety component that has deployed, are prohibited.",
    ],
  },

  /* ─── Business ──────────────────────────────────────────────────────── */
  {
    slug: "business-industrial",
    label: "Business & Industrial",
    group: "business",
    icon: "briefcase",
    blurb: "Commercial kitchen, retail fixtures, tools and IT lots.",
    tier: "assisted",
    subcategories: ["Commercial kitchen", "Retail fixtures", "Office furniture in bulk", "Power tools", "Testing equipment", "Networking hardware", "Servers & racks", "Printing equipment", "Packaging machinery", "Salon equipment"],
    seo: {
      title: "Used Business & Industrial Equipment in India",
      description: "Second-hand commercial equipment, tools, IT hardware and retail fixtures — including bulk lots from companies retiring assets.",
      keywords: ["used commercial kitchen equipment india", "second hand office furniture bulk", "used power tools india", "refurbished server india", "used networking equipment", "business liquidation india"],
      intro: "This is where corporate hardware disposal meets small business budgets. Companies retiring IT assets, restaurants closing, offices downsizing — much of it is barely used and currently goes to scrap brokers for a fraction of value. Bulk quantities can be run as auctions.",
    },
    minPricePaise: 500 * R, maxPricePaise: 50_00_000 * R,
    minImages: 4, maxImages: 15,
    requiredAttributes: ["type", "condition", "quantity_available"],
    optionalAttributes: ["brand", "model", "year", "working_status", "manifest_url"],
    requiresSerial: false, requiresImei: false, requiresInvoiceOrBox: false,
    requiresPhoneVerified: true, requiresKycAbovePaise: 1_00_000 * R,
    riskMultiplier: 1.0,
    notes: ["Quantities above 10 units are better run as a lot auction — see /auctions."],
  },

  /* ─── Other ─────────────────────────────────────────────────────────── */
  {
    slug: "lifestyle",
    label: "Lifestyle",
    group: "other",
    icon: "sparkle",
    rail: 13,
    blurb: "Kitchenware, luggage, home essentials and everything in between.",
    tier: "basic",
    subcategories: ["Kitchenware", "Cookware", "Dinner sets", "Luggage & trolleys", "Home storage", "Festive decor", "Plants & planters", "Stationery", "Umbrellas & rainwear", "Water bottles"],
    seo: {
      title: "Used Kitchenware, Luggage & Home Essentials in India",
      description: "Second-hand kitchenware, cookware, luggage and household essentials, checked and bought with payment protection.",
      keywords: ["used kitchenware india", "second hand luggage", "used cookware india", "second hand suitcase", "used home essentials india"],
      intro: "The long tail of household things that get replaced long before they wear out. Standard photo, price and seller checks apply to everything here.",
    },
    minPricePaise: 50 * R, maxPricePaise: 2_00_000 * R,
    minImages: 3, maxImages: 10,
    requiredAttributes: ["type", "condition"],
    optionalAttributes: ["brand", "material", "quantity"],
    requiresSerial: false, requiresImei: false, requiresInvoiceOrBox: false,
    requiresPhoneVerified: true, riskMultiplier: 0.8,
  },
  {
    slug: "other",
    label: "Others",
    group: "other",
    icon: "box",
    rail: 14,
    blurb: "Anything that doesn't fit elsewhere.",
    tier: "basic",
    subcategories: ["Miscellaneous"],
    seo: {
      title: "Everything Else — Buy & Sell Used Items in India",
      description: "Anything that doesn't fit another category, still checked for original photos, honest pricing and prohibited goods.",
      keywords: ["sell anything online india", "buy used items india", "second hand marketplace india", "olx alternative india"],
      intro: "If it doesn't fit anywhere else it goes here — and it still passes every photo, price, prohibited-goods and seller check. If you're listing something here often, tell us and we'll give it a proper category.",
    },
    minPricePaise: 50 * R, maxPricePaise: 10_00_000 * R,
    minImages: 3, maxImages: 10,
    requiredAttributes: ["title", "condition"],
    optionalAttributes: ["brand", "type"],
    requiresSerial: false, requiresImei: false, requiresInvoiceOrBox: false,
    requiresPhoneVerified: true, riskMultiplier: 1.0,
  },
];

/**
 * Refused outright. Checked against title + description before anything else.
 * Each pattern is paired with the reason shown to the seller.
 */
export const PROHIBITED_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /\b(gun|pistol|rifle|ammunition|firearm|air\s*gun)\b/i, reason: "Weapons and ammunition are not permitted" },
  { pattern: /\b(drug|cocaine|ganja|charas|mdma|opium)\b/i, reason: "Controlled substances are not permitted" },
  { pattern: /\b(aadhaar|pan\s*card|passport|voter\s*id|driving\s*licen[cs]e)\s*(card|copy|for sale|sale)/i, reason: "Identity documents cannot be sold" },
  { pattern: /\b(medicine|tablet strip|injection|prescription drug|antibiotic|steroid)\b/i, reason: "Pharmaceuticals are not permitted" },
  { pattern: /\b(ivory|tortoise\s*shell|pangolin|tiger|leopard)\s*(skin|nail|claw|scale)?\b/i, reason: "Wildlife products are prohibited" },
  { pattern: /\b(first copy|master copy|1st copy|replica watch|duplicate brand|mirror quality)\b/i, reason: "Counterfeit goods are prohibited" },
  { pattern: /\b(sim\s*card|pre[- ]?activated sim)\b/i, reason: "SIM cards cannot be resold" },
  { pattern: /\b(lottery|matka|betting|satta)\b/i, reason: "Gambling-related items are prohibited" },
  { pattern: /\b(gift\s*card|voucher\s*code|coupon\s*code)\b/i, reason: "Gift cards and vouchers cannot be verified before payment, so they are not permitted" },
  { pattern: /\b(concert|match|event)\s*ticket[s]?\b/i, reason: "Event tickets cannot be verified before the event, so they are not permitted" },
  { pattern: /\b(live|pet)\s*(dog|cat|bird|fish|puppy|kitten)\b/i, reason: "Live animals may not be listed" },
  { pattern: /\b(human|organ|blood|plasma)\s*(hair|organ|donation)?\s*for sale\b/i, reason: "Human remains and body products are prohibited" },
];

export const categoryBySlug = new Map(CATEGORIES.map((c) => [c.slug, c]));

export function getCategory(slug: string): CategoryRule {
  const c = categoryBySlug.get(slug);
  if (!c) throw new Error(`Unknown category: ${slug}`);
  return c;
}

/** Categories shown in the home-page rail, in order. */
export const RAIL_CATEGORIES = CATEGORIES
  .filter((c) => typeof c.rail === "number")
  .sort((a, b) => (a.rail ?? 99) - (b.rail ?? 99));

export const GROUP_LABELS: Record<CategoryGroup, string> = {
  tech: "Tech & Electronics",
  home: "Home & Living",
  family: "Family",
  style: "Fashion & Style",
  leisure: "Leisure & Culture",
  vehicles: "Vehicles",
  business: "Business & Industrial",
  other: "Everything Else",
};

export const GROUP_ORDER: CategoryGroup[] = [
  "tech", "home", "family", "style", "leisure", "vehicles", "business", "other",
];

export function categoriesByGroup(group: CategoryGroup): CategoryRule[] {
  return CATEGORIES.filter((c) => c.group === group);
}
