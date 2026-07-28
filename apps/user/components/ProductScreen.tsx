import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Fuel, Wrench, Droplets, Cylinder, type LucideIcon } from "lucide-react";
import { getProducts } from "@/lib/api";
import { normalizeUrl } from "@kr/shared/lib/utils";
import { getProductDetail, isRetiredProduct, productSlug, type ProductIcon } from "@/lib/products";

const ICONS: Record<ProductIcon, LucideIcon> = {
  fuel: Fuel, wrench: Wrench, droplets: Droplets, cylinder: Cylinder,
};

// Merge Firestore record (admin-controlled) over hardcoded catalog (fallbacks).
// Firestore wins for every field it has; catalog fills any gap so pages never blank.
async function resolve(slug: string) {
  // Retired products (e.g. Lubricants) are off the website regardless of what the
  // admin panel still holds — returning null makes every route for them 404.
  if (isRetiredProduct(slug)) return null;

  const detail = getProductDetail(slug);         // catalog fallback
  const { data } = await getProducts();
  // Match by explicit slug first, then by category/name keywords.
  const record = data.find((p) => p.slug === slug) ?? data.find((p) => productSlug(p) === slug) ?? null;

  if (!record && !detail) return null;

  // For redirect products just expose what the caller needs.
  if (record?.is_external) {
    return {
      isExternal: true,
      redirectUrl: normalizeUrl(record.external_url) || detail?.externalUrl || "",
      detail, record,
    } as const;
  }

  return {
    isExternal: false,
    name: record?.product_name?.trim() || detail?.label || "",
    category: record?.product_category?.trim() || detail?.category || "",
    tagline: record?.tagline?.trim() || detail?.tagline || "",
    intro: record?.description?.trim() || detail?.intro || "",
    image: record?.product_image?.trim() || detail?.image || "",
    gallery: (record?.gallery_images ?? []).filter(Boolean),
    sections: record?.sections?.length ? record.sections : (detail?.sections ?? []),
    specs: record?.specs?.length ? record.specs : (detail?.specs ?? []),
    ctaPrimaryText: record?.cta_primary_text || "Find a station",
    ctaPrimaryHref: record?.cta_primary_href || "/stations",
    ctaSecondaryText: record?.cta_secondary_text || "Talk to our team",
    ctaSecondaryHref: record?.cta_secondary_href || "/contact",
    icon: detail?.icon ?? "fuel",
    detail, record,
  } as const;
}

export async function productMetadata(slug: string): Promise<Metadata> {
  const r = await resolve(slug);
  if (!r) return { title: "Products" };
  if (r.isExternal) return { title: "Products" };
  return {
    title: `${r.name} — K.R Trans Fuels`,
    description: r.intro.slice(0, 160),
  };
}

export default async function ProductScreen({ slug }: { slug: string }) {
  const r = await resolve(slug);
  if (!r) notFound();

  // Redirect products: just forward to the external URL.
  if (r.isExternal) {
    redirect(r.redirectUrl || "/");
  }

  const Icon = ICONS[r.icon];

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-brand-pale/60 to-white">
        <div className="container-x py-12 lg:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
            <div>
              {/* <span className="eyebrow mb-4">{r.category}</span> */}
              <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">{r.name}</h1>
              {r.tagline && <p className="mt-4 max-w-xl text-lg text-mutedfg">{r.tagline}</p>}
              {r.intro && <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink/70">{r.intro}</p>}
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href={r.ctaPrimaryHref} className="btn-primary">
                  {r.ctaPrimaryText} <ArrowRight size={16} />
                </Link>
                <Link href={r.ctaSecondaryHref} className="btn-outline">{r.ctaSecondaryText}</Link>
              </div>
            </div>

            <div>
              {r.image ? (
                <div className="group relative aspect-[4/2.5] w-full overflow-hidden rounded-[20px] border border-line/70 bg-white shadow-[0_2px_18px_rgba(13,26,16,0.05)]">
                  <Image src={r.image} alt={r.name} fill unoptimized sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent pointer-events-none" />
                </div>
              ) : (
                <div className="grid aspect-[4/3] w-full place-items-center rounded-2xl border border-line bg-white shadow-[0_2px_18px_rgba(13,26,16,0.05)]">
                  <Icon size={96} className="text-brand/30" strokeWidth={1.25} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Content sections ─────────────────────────────────── */}
      {(r.sections.length > 0 || r.specs.length > 0 || r.gallery.length > 0) && (
        <section className="container-x pb-14">

          {r.specs.length > 0 && (
            <div className="mb-10">
              <h2 className="section-title">Specifications</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {r.specs.map((spec, si) => (
                  <div key={si} className="card-soft flex items-start gap-3">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-pale text-brand">
                      <Check size={16} strokeWidth={3} />
                    </span>
                    <div>
                      <div className="font-bold text-ink">{spec.name}</div>
                      <div className="mt-1 text-sm leading-relaxed text-mutedfg">{spec.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {r.sections.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              {r.sections.map((s, si) => (
                <div key={si} className="card-soft">
                  <h2 className="text-lg font-bold text-ink">{s.heading}</h2>
                  <ul className="mt-4 space-y-2.5">
                    {s.items.map((item, ii) => (
                      <li key={ii} className="flex items-start gap-2.5 text-[15px] text-ink/75">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-pale text-brand">
                          <Check size={13} strokeWidth={3} />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {r.gallery.length > 0 && (
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {r.gallery.map((img, i) => (
                <div key={i} className="relative aspect-square w-full overflow-hidden rounded-xl border border-line">
                  <Image src={img} alt={`${r.name} ${i + 1}`} fill unoptimized sizes="(max-width: 640px) 50vw, 200px" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
