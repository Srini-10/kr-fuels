import Link from "next/link";
// import Image from "next/image"; // only used by the disabled Partners section
import {
  ArrowRight, MapPin, ShieldCheck,
  HelpCircle, MessageSquare, GitCompare, Leaf,
} from "lucide-react";
import { TestimonialsCarousel } from "@/components/TestimonialsCarousel";
import { HeroCarousel } from "@/components/HeroCarousel";
import { HomeVideo } from "@/components/HomeVideo";
import { getFuelPrices, getStations, getTestimonials, getAbout, getHeroImages, getSiteSettings } from "@/lib/api";
import { BRAND, TESTIMONIAL_FALLBACK, STATION_COUNT_FALLBACK, fmtCount } from "@/lib/site";
// import { PARTNERS_FALLBACK } from "@/lib/fallbacks"; // only used by the disabled Partners section
import { HOME_VIDEO_URL_DEFAULT } from "@kr/shared/types";

// ISR: home reflects live fuel prices — keep it fresh but served from cache.
export const revalidate = 30;

const HERO_IMAGES_FALLBACK = ["/assets/hero-2.jpg", "/assets/hero-1.jpg", "/assets/products/auto-lpg.jpg"];

export default async function HomePage() {
  const [prices, stations, testimonials, about, /* partners, */ heroImages, site] = await Promise.all([
    getFuelPrices(),
    getStations(),
    getTestimonials(),
    getAbout(),
    // getClients("collaborator"), // Partners section disabled
    getHeroImages(),
    getSiteSettings(),
  ]);

  const heroSlides = heroImages.length ? heroImages : HERO_IMAGES_FALLBACK;
  const homeVideoUrl = site.homeVideoUrl || HOME_VIDEO_URL_DEFAULT;

  const count = stations.total > 0 ? stations.total : STATION_COUNT_FALLBACK;
  // Savings is computed live from today's prices; falls back to the brand figure (40%)
  // only when prices are unavailable, and is used consistently across the page.
  const savingsPct = prices.petrol > 0 && prices.autoLPG > 0 ? Math.round((1 - prices.autoLPG / prices.petrol) * 100) : 40;
  const savingsRs = prices.petrol > 0 && prices.autoLPG > 0 ? (prices.petrol - prices.autoLPG).toFixed(1) : "39";
  const p = (v: number) => (v > 0 ? v : "—");
  const carousel = testimonials.length ? testimonials : TESTIMONIAL_FALLBACK;
  // Partners section disabled per request — data prep kept (commented) for easy re-enable.
  // const partnerList = partners.length ? partners : PARTNERS_FALLBACK;
  // Build a marquee reel of two IDENTICAL halves so the CSS `translateX(-50%)` loop is
  // perfectly seamless. Each half repeats the partner list enough times to overflow the
  // widest viewport, so there's never an empty gap before it loops.
  // const partnerHalf = Array.from({ length: Math.max(2, Math.ceil(12 / Math.max(1, partnerList.length))) }).flatMap(() => partnerList);
  // const partnerReel = [...partnerHalf, ...partnerHalf];

  const stats = [
    { value: fmtCount(count), label: "Stations across Tamil Nadu" },
    { value: `${savingsPct}%`, label: "Savings over petrol" },
    { value: "26M+", label: "Vehicles on Auto LPG worldwide" },
    { value: `${BRAND.yearsOfService}+`, label: "Years of trusted service" },
  ];

  const priceCells = [
    { l: "Auto-LPG", v: prices.autoLPG, live: true },
    { l: "Petrol", v: prices.petrol, live: false },
    { l: "Diesel", v: prices.diesel, live: false },
  ];

  const ctaCards = [
    { icon: MapPin, title: "Find a station", sub: `${fmtCount(count)} locations near you`, href: "/stations" },
    { icon: GitCompare, title: "LPG vs Domestic LPG", sub: "Know the real difference", href: "/guide" },
    { icon: MessageSquare, title: "Feedback", sub: "Share your experience", href: "/contact" },
    { icon: HelpCircle, title: "FAQ", sub: "Common questions answered", href: "/guide#faq" },
  ];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-brand-pale/60 to-white">
        <div className="container-x grid items-center gap-12 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <span className="eyebrow mb-6">🌿 Eco-friendly automotive fuel — since 2007</span>
            <h1 className="text-[44px] font-extrabold leading-[1.04] tracking-tight text-ink sm:text-6xl lg:text-[68px]">
              Switch to Auto LPG. Save {savingsPct}%. <span className="text-brand">Drive Cleaner.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-mutedfg">
              Tamil Nadu&apos;s largest Auto LPG network. {fmtCount(count)} stations. Cleaner fuel. Real savings every day.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="btn-primary">Contact Us <ArrowRight size={16} /></Link>
              <Link href="/guide" className="btn-dark">How It Works <ArrowRight size={16} /></Link>
            </div>
          </div>

          {/* Hero carousel + floating badges */}
          <div className="relative mx-auto w-full max-w-xl">
            <HeroCarousel images={heroSlides} alt="KR Trans Fuels Auto LPG station" />
            <div className="absolute -right-3 top-6 hidden rounded-2xl border border-line bg-white px-4 py-3 shadow-lg sm:block">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-mutedfg">Trusted</div>
              <div className="text-sm font-extrabold text-ink">Since 2007</div>
            </div>
            <div className="absolute -left-3 bottom-16 hidden rounded-2xl border border-line bg-white px-4 py-3 shadow-lg sm:block">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-mutedfg">Network</div>
              <div className="text-sm font-extrabold text-ink">{fmtCount(count)} Stations</div>
            </div>
            <div className="absolute -right-3 bottom-6 hidden rounded-2xl border border-line bg-white px-4 py-3 shadow-lg sm:block">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-mutedfg">Save</div>
              <div className="text-sm font-extrabold text-brand">{savingsPct}% Savings</div>
            </div>
          </div>

          {/* Mobile-only: badges as a single-row grid under the image */}
          <div className="grid grid-cols-3 gap-2 sm:hidden">
            <div className="rounded-2xl border border-line bg-white px-3 py-3 text-center shadow-lg">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-mutedfg">Trusted</div>
              <div className="text-sm font-extrabold text-ink">Since 2007</div>
            </div>
            <div className="rounded-2xl border border-line bg-white px-3 py-3 text-center shadow-lg">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-mutedfg">Network</div>
              <div className="text-sm font-extrabold text-ink">{fmtCount(count)} Stations</div>
            </div>
            <div className="rounded-2xl border border-line bg-white px-3 py-3 text-center shadow-lg">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-mutedfg">Save</div>
              <div className="text-sm font-extrabold text-brand">{savingsPct}% Savings</div>
            </div>
          </div>
        </div>

        {/* Dark bottom price card */}
        {/* <div className="container-x pb-14">
          <div className="grid grid-cols-2 gap-y-6 rounded-3xl bg-ink px-6 py-7 text-white sm:px-10 md:grid-cols-4 md:divide-x md:divide-white/10">
            {priceCells.map((c) => (
              <div key={c.l} className="md:px-6">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                  {c.l}{c.live && <span className="rounded-full bg-brand px-1.5 py-0.5 text-[9px] text-white">LIVE</span>}
                </div>
                <div className="mt-1 text-2xl font-extrabold">₹{p(c.v)}<span className="text-sm font-medium text-white/50">/lit</span></div>
              </div>
            ))}
            <div className="md:px-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-white/50">Your Savings</div>
              <div className="mt-1 text-2xl font-extrabold text-brand-light">{savingsPct}% cheaper</div>
              <div className="text-xs text-white/60">Save ₹{savingsRs}/lit</div>
            </div>
          </div>
        </div> */}
      </section>

      {/* ── Quick Links (moved up) ───────────────────────────── */}
      <section className="container-x py-14">
        <div className="mb-8 text-center">
          <span className="eyebrow mb-3">Quick Links</span>
          <h2 className="section-title">Everything you need, One tap away</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ctaCards.map((c) => (
            <Link key={c.title} href={c.href} className="group card-soft flex flex-col items-start gap-4 transition hover:-translate-y-1 hover:border-brand/30 hover:shadow-md">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-pale text-brand transition group-hover:bg-brand group-hover:text-white">
                <c.icon size={26} />
              </span>
              <div>
                <div className="text-lg font-bold text-ink">{c.title}</div>
                <div className="mt-1 text-sm text-mutedfg">{c.sub}</div>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-brand">
                Explore <ArrowRight size={15} className="transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Numbers That Speak ───────────────────────────────── */}
      {/* <section className="border-y border-line bg-white">
        <div className="container-x py-14">
          <h2 className="mb-10 text-center section-title">Numbers That Speak</h2>
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-4xl font-extrabold text-brand lg:text-5xl">{s.value}</div>
                <div className="mt-2 text-sm text-mutedfg">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ── About Us + Video ─────────────────────────────────── */}
      <section className="container-x py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="eyebrow mb-4">About Us</span>
            <h2 className="section-title">Powering green mobility since 2007</h2>
            <p className="mt-4 text-mutedfg">
              {about.contentBlocks?.[0]?.body ||
                `K.R Trans Fuels, a subsidiary of KRT Carriers, established its first Auto LPG dispensing station in 2007. Today, with ${fmtCount(count)} stations across Tamil Nadu and more in the pipeline, we lead the state in cleaner automotive fuel.`}
            </p>
            <Link href="/about" className="mt-6 inline-flex items-center gap-1.5 font-bold text-brand hover:gap-2.5 transition-all">
              Learn more about us <ArrowRight size={16} />
            </Link>
            <div className="mt-7 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-brand-pale p-5">
                <div className="text-3xl font-extrabold text-brand">{fmtCount(count)} Stations</div>
                <div className="text-sm text-mutedfg">across Tamil Nadu</div>
              </div>
              <div className="rounded-2xl bg-brand-pale p-5">
                <div className="text-3xl font-extrabold text-brand">{savingsPct}%</div>
                <div className="text-sm text-mutedfg">Savings over petrol</div>
              </div>
            </div>
          </div>

          <div>
            <HomeVideo src={homeVideoUrl} />
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-ink px-5 py-4 text-white">
              <Leaf className="shrink-0 text-brand-light" size={24} />
              <div>
                <div className="font-bold">Eco-Friendly</div>
                <div className="text-sm text-white/70">Lower carbon emissions vs petrol — helping Tamil Nadu breathe cleaner, one tank at a time.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials (auto-scroll) ───────────────────────── */}
      <section className="container-x py-20">
        <div className="mb-10 text-center">
          <span className="eyebrow mb-4">Testimonials</span>
          <h2 className="section-title">Trusted by thousands</h2>
          <p className="mt-2 text-mutedfg">Hear from our customers across Tamil Nadu</p>
        </div>
        <TestimonialsCarousel items={carousel} />
      </section>

      {/* ── Partners (horizontal auto-scroll) — DISABLED per request ──────────
      {partnerList.length > 0 && (
        <section className="overflow-hidden border-y border-line bg-white py-14">
          <div className="container-x">
            <p className="mb-8 text-center text-sm font-semibold uppercase tracking-wider text-mutedfg/70">Our technology partners</p>
          </div>
          <div className="relative flex overflow-hidden">
            // Per-item right margin (not flex gap) so the two identical halves line up
            // exactly at the -50% loop point — perfectly seamless, infinite scroll.
            <div className="flex w-max kr-marquee items-center">
              {partnerReel.map((pt, idx) =>
                pt.logo ? (
                  <Image key={`${pt.id}-${idx}`} src={pt.logo} alt={pt.name} width={200} height={56} unoptimized className="mr-20 h-14 w-auto max-w-[200px] shrink-0 object-contain opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0" />
                ) : (
                  <span key={`${pt.id}-${idx}`} className="mr-20 shrink-0 text-3xl font-bold text-mutedfg/60">{pt.name}</span>
                )
              )}
            </div>
          </div>
        </section>
      )}
      ────────────────────────────────────────────────────────────────────── */}

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="container-x py-20">
        <div className="overflow-hidden rounded-[32px] bg-ink px-8 py-16 text-center text-white">
          <ShieldCheck className="mx-auto mb-4 text-brand-light" size={36} />
          <h2 className="text-3xl font-extrabold sm:text-4xl">Ready to switch to smarter fuel?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Join thousands of drivers saving {savingsPct}% on fuel costs with cleaner, greener Auto LPG.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/stations" className="btn-primary">Find a station near you <ArrowRight size={16} /></Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">
              Talk to Our Team
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
