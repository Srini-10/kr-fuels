// Canonical catalog for the product screens (/products = Auto LPG, plus the
// krfuels.com-matching routes /conversionkit, /tanks). The Lubricants entry is
// retired — kept commented out at the bottom of PRODUCT_CATALOG.
//
// DYNAMIC-FIRST: each entry mirrors a `products` Firestore record (matched by an
// explicit `slug` or by category/name keywords). The detail page renders the live
// backend record where it has data (name, description, images, external_url) and
// falls back to this faithful, live-site-matching content for the richer sections
// the admin schema doesn't (yet) capture — functions, benefits, specs. Content here
// mirrors krfuels.com / krgfi.com; only the CONTENT matches — visuals stay ours.

export type ProductIcon = "fuel" | "wrench" | "droplets" | "cylinder";

export interface ProductSection {
  heading: string;
  items: string[];
}

export interface ProductSpec {
  name: string;
  detail: string;
}

export interface ProductDetail {
  /** Stable id — also the key used to match a backend `products` record. */
  slug: string;
  /** Route the screen lives at (mirrors krfuels.com / krgfi.com page names). */
  href: string;
  /** Dropdown label, selector-pill label and H1. */
  label: string;
  /** Eyebrow / category tag. */
  category: string;
  icon: ProductIcon;
  /** One-line subhead under the H1. */
  tagline: string;
  /** Lead paragraph(s) — overridden by a backend record's description when present. */
  intro: string;
  /** Default hero image (real krfuels.com / vibuh imagery) — overridden by a backend record's product_image. */
  image: string;
  /** Bulleted sections (functions / benefits / how it works …). */
  sections: ProductSection[];
  /** Variants / grades / pack sizes. */
  specs: ProductSpec[];
  /** Optional reference link to the live manufacturer page. */
  externalUrl?: string;
  /** When true the menu/footer link opens this product's external site (no internal screen). */
  external?: boolean;
  /** Keywords used to match a backend product to this slug (lowercase). */
  match: string[];
}

export const PRODUCT_CATALOG: ProductDetail[] = [
  {
    slug: "auto-lpg",
    href: "/products",
    image: "/assets/products/auto-lpg.jpg",
    label: "Auto LPG",
    category: "Auto LPG Fuel",
    icon: "fuel",
    tagline: "Eco-friendly automotive fuel — cleaner and safer than petrol.",
    intro:
      "Auto LPG (liquefied petroleum gas) is a clean-burning, Eco-friendly automotive fuel dispensed at every kr trans fuels station. It costs roughly 40% less than petrol, Burns cleaner with significantly lower emissions, And refuels as quickly and easily as any other fuel — so you save money on every kilometre while driving greener.",
    sections: [
      {
        heading: "Why switch to Auto LPG",
        items: [
          "Up to 40% cheaper to run than petrol",
          "Far lower CO, Hydrocarbon and nox emissions",
          "Cleaner combustion means longer engine life",
          "Quick, Easy refuelling across our growing station network",
          "Dual-fuel freedom — switch between petrol and lpg on the move",
        ],
      },
      {
        heading: "How it works",
        items: [
          "A bis-certified conversion kit lets your petrol vehicle run on lpg",
          "A dedicated high-pressure tank stores the Auto LPG safely",
          "Flip a change-over switch to run on petrol or lpg at any time",
          "No loss of convenience — same range, Same performance",
        ],
      },
    ],
    specs: [
      { name: "Availability", detail: "Dispensed at all kr trans fuels Auto LPG stations across tamil nadu" },
      // { name: "Typical saving", detail: "~40% lower running cost versus petrol" },
    ],
    match: ["auto lpg", "auto-lpg", "fuel"],
  },
  {
    slug: "conversionkit",
    href: "https://www.vibuh.com/shop-grid.html",
    external: true,
    image: "/assets/products/conversionkit.jpg",
    label: "Conversion Kits",
    category: "Conversion Kits",
    icon: "wrench",
    tagline: "Bis-certified venturi & sequential lpg conversion kits for two-, Three- and four-wheelers.",
    intro:
      "An lpg conversion kit lets your vehicle run on lpg instead of petrol, Cutting fuel costs and emissions. Each kit bundles the components needed for safe, Efficient fuel delivery — a tank, Reducer, Injectors, Ecu and hoses — fitted by trained technicians and certified to automotive safety standards.",
    sections: [
      {
        heading: "Venturi (open-loop) kits",
        items: [
          "Mixer-based fuelling — simple, Robust and economical",
          "Ideal for carburettor and older-generation petrol vehicles",
          "Lower cost of conversion with reliable everyday performance",
        ],
      },
      {
        heading: "Sequential (closed-loop) kits",
        items: [
          "Electronically controlled multipoint lpg injection",
          "Ecu meters fuel precisely for each cylinder",
          "Best suited to modern bs-iv / bs-vi fuel-injected vehicles",
          "Smoother performance, Better mileage and cleaner emissions",
        ],
      },
      {
        heading: "What's in the kit",
        items: [
          "High-pressure lpg tank and filler valve",
          "Reducer / vaporiser (kr 67, Kr 56)",
          "Injector rail (3-way, 4-way, Kr 360)",
          "Ecu (pride, Ultra, Optima nano)",
          "Change-over switch, Hoses and fittings",
        ],
      },
    ],
    specs: [
      { name: "LPG Kit — BS IV (2-Wheeler)", detail: "Conversion kit for BS-IV two-wheelers" },
      { name: "LPG Kit — BS VI (2-Wheeler)", detail: "Conversion kit for BS-VI two-wheelers" },
      { name: "LPG Kit — BS IV (4-Wheeler)", detail: "Conversion kit for BS-IV four-wheelers" },
      { name: "LPG Kit — BS VI (4-Wheeler)", detail: "Conversion kit for BS-VI four-wheelers" },
    ],
    externalUrl: "http://krgfi.com/conversionkit.php",
    match: ["conversion", "kit"],
  },
  {
    slug: "tanks",
    href: "https://www.vibuh.com/shop-grid.html",
    external: true,
    image: "/assets/products/tanks.jpg",
    label: "Tanks & Multivalves",
    category: "Tanks & Multivalves",
    icon: "cylinder",
    tagline: "Safety-certified high-pressure tanks and multivalves built to automotive standards.",
    intro:
      "Kr trans fuels supplies bis / automotive-standard lpg tanks and multivalves for Auto LPG vehicles. Cylindrical and toroidal designs suit different vehicles and boot layouts, While the integrated multivalve manages safe filling, Level sensing and pressure relief.",
    sections: [
      {
        heading: "Cylindrical tanks",
        items: [
          "Mounted in the boot or under the chassis",
          "Available in a range of capacities to suit your vehicle",
          "Robust high-pressure construction to automotive standards",
        ],
      },
      {
        heading: "Toroidal (doughnut) tanks",
        items: [
          "Fit neatly into the spare-wheel well",
          "Free up boot space while keeping a full lpg range",
        ],
      },
      {
        heading: "Multivalves & safety",
        items: [
          "Integrated fill, Level-gauge, Excess-flow and safety-relief functions",
          "80% auto-stop fill prevents overfilling",
          "Pressure-relief valve for safe operation",
        ],
      },
    ],
    specs: [
      { name: "5 L Cylindrical Tank", detail: "Compact cylindrical Auto LPG tank" },
      { name: "32 L Cylindrical Tank", detail: "Mid-capacity cylindrical Auto LPG tank" },
      { name: "60 L Cylindrical Tank", detail: "High-capacity cylindrical Auto LPG tank" },
      { name: "33 L Toroidal Tank", detail: "Spare-wheel-well toroidal Auto LPG tank" },
      { name: "Multivalve KR23", detail: "Integrated fill, level and safety-relief multivalve" },
    ],
    externalUrl: "http://krgfi.com/tanks.php",
    match: ["tank", "multivalve", "valve"],
  },
  // ── Lubricants — RETIRED (client request, no longer offered on the website).
  // Commented out rather than deleted so it can be restored verbatim: uncommenting
  // this entry brings back the Products dropdown item, the footer link, and the
  // /lubricants screen (see apps/user/app/lubricants/page.tsx + app/sitemap.ts).
  // {
  //   slug: "lubricants",
  //   href: "/lubricants",
  //   image: "/assets/products/lubricants.jpg",
  //   label: "Lubricants",
  //   category: "Lubricants",
  //   icon: "droplets",
  //   tagline: "Specialised lubricants formulated for lpg / cng engines.",
  //   intro:
  //     "Lubricant is a thin film, Generally composed of 70% base oil and 30% additives, Which helps to keep your engine running at its best. Our veedol lubricants are formulated for lpg and cng vehicles to protect the engine, Reduce wear and extend its life.",
  //   sections: [
  //     {
  //       heading: "What a lubricant does",
  //       items: [
  //         "Lubricate — reduces friction, Engine wear and fuel consumption",
  //         "Clean — clears piston varnish and deposit sludge in the sump",
  //         "Protect — guards against acid corrosion and rust",
  //         "Cool & seal the engine",
  //       ],
  //     },
  //     {
  //       heading: "Benefits of quality lubricants",
  //       items: [
  //         "Better mileage",
  //         "High performance",
  //         "Less maintenance cost",
  //         "Longer engine life",
  //         "Engine runs smoothly",
  //       ],
  //     },
  //   ],
  //   specs: [
  //     { name: "Turbo Star 20W50 (LPG/CNG)", detail: "Available in 500 ml, 1 litre and 3 litre packs, plus loose dispensing" },
  //     { name: "Take Off 2T", detail: "Dispensed loose through oil dispensers as per customer requirement at retail outlets" },
  //   ],
  //   externalUrl: "https://krfuels.com/lubricants.php",
  //   match: ["lubric"],
  // },
];

// Product slugs retired from the website (client request). Every product route —
// /lubricants and /products/<slug> — 404s for these, even while a matching record
// still exists in the admin panel's Products collection. Drop a slug from this set
// to bring its page back.
export const RETIRED_PRODUCT_SLUGS = new Set(["lubricants"]);

export function isRetiredProduct(slug: string): boolean {
  return RETIRED_PRODUCT_SLUGS.has(slug.trim().toLowerCase());
}

export const PRODUCT_CATALOG_BY_SLUG: Record<string, ProductDetail> = Object.fromEntries(
  PRODUCT_CATALOG.map((p) => [p.slug, p]),
);

export function getProductDetail(slug: string): ProductDetail | null {
  return PRODUCT_CATALOG_BY_SLUG[slug] ?? null;
}

/**
 * Resolve any product-like record (backend or fallback) to one of our detail
 * slugs: explicit `slug` wins, otherwise we match on category/name keywords.
 */
export function productSlug(p: {
  slug?: string;
  product_category?: string;
  product_name?: string;
}): string | null {
  if (p.slug && PRODUCT_CATALOG_BY_SLUG[p.slug]) return p.slug;
  const hay = `${p.product_category ?? ""} ${p.product_name ?? ""}`.toLowerCase();
  for (const d of PRODUCT_CATALOG) {
    if (d.match.some((kw) => hay.includes(kw))) return d.slug;
  }
  return null;
}
