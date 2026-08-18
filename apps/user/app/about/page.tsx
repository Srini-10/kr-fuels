import type { Metadata } from "next";
import { MapPin, Leaf, CalendarClock, Users, Fuel, Target, Compass, Sparkles, type LucideIcon } from "lucide-react";
import { getAbout, getJourney, getStations } from "@/lib/api";
import { Reveal } from "@/components/Reveal";
import { ImageWithSkeleton } from "@/components/ImageWithSkeleton";
import { BRAND, STATION_COUNT_FALLBACK, DISTRICT_COUNT_FALLBACK, fmtCount } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Us",
  description: "K.R Trans Fuels — pioneering Auto LPG in Tamil Nadu since 2007. Our story, mission and journey.",
};

// ISR: editorial content — long cache window, refreshed in the background.
export const revalidate = 300;

// Cyclic accent icons for the mission / values cards.
const BLOCK_ICONS: LucideIcon[] = [Target, Compass, Sparkles, Leaf];

export default async function AboutPage() {
  const [about, journey, stations] = await Promise.all([
    getAbout(),
    getJourney(),
    getStations(),
  ]);
  const count = stations.total > 0 ? stations.total : STATION_COUNT_FALLBACK;
  const districts = stations.districts.length || DISTRICT_COUNT_FALLBACK;
  const blocks = (about.contentBlocks ?? []).slice(1);

  const stats: { icon: LucideIcon; v: string; l: string }[] = [
    { icon: MapPin, v: fmtCount(count), l: "Active Stations" },
    { icon: Leaf, v: fmtCount(districts), l: "Districts Covered" },
    { icon: CalendarClock, v: `${BRAND.yearsOfService}+`, l: "Years of Operation" },
    { icon: Users, v: "50,000+", l: "Happy Customers" },
    { icon: Fuel, v: "2M+", l: "LPG Refills Delivered" },
  ];

  return (
    <>
      {/* <section className="bg-gradient-to-b from-brand-pale/60 to-white">
        <div className="container-x py-16 text-center lg:py-20">
          <span className="eyebrow mb-4">About {BRAND.shortName}</span>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold text-ink sm:text-5xl">
            {about.contentBlocks?.[0]?.heading || "Powering Green Mobility Since 2007"}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-mutedfg">
            {about.contentBlocks?.[0]?.body ||
              "A pioneer in Auto LPG distribution across Tamil Nadu, helping motorists switch to a cleaner, cheaper and greener fuel."}
          </p>
        </div>
      </section> */}

      {/* {about.videoUrl && (
        <section className="container-x -mt-6">
          <div className="mx-auto aspect-video max-w-3xl overflow-hidden rounded-2xl border border-line bg-ink shadow-lg">
            <iframe className="h-full w-full" src={about.videoUrl} title="About KR Trans Fuels" allowFullScreen />
          </div>
        </section>
      )} */}

      {/* Live counts + headline stats */}
      {/* {about.showStationCount !== false && (
        <section className="container-x py-14">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map((s) => (
              <div key={s.l} className="card-soft text-center">
                <s.icon className="mx-auto mb-2 text-brand" size={26} />
                <div className="text-3xl font-extrabold text-ink">{s.v}</div>
                <div className="text-sm text-mutedfg">{s.l}</div>
              </div>
            ))}
          </div>
        </section>
      )} */}

      {/* Mission & values — icon-led split cards */}
      {/* {blocks.length > 0 && (
        <section className="container-x pb-20">
          <div className="mx-auto max-w-4xl space-y-5">
            {blocks.map((b, i) => {
              const Icon = BLOCK_ICONS[i % BLOCK_ICONS.length];
              return (
                <div key={i} className="card-soft grid gap-5 sm:grid-cols-[auto_1fr] sm:items-start">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-pale text-brand">
                    <Icon size={26} />
                  </span>
                  <div>
                    <h2 className="text-xl font-extrabold text-ink">{b.heading}</h2>
                    <p className="mt-2 leading-relaxed text-mutedfg">{b.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )} */}

      {/* Journey timeline — items reveal on scroll */}
      {journey.length > 0 && (
        // `overflow-x-clip`: the right-sliding Reveal cards start at translate-x-12
        // (48px) which, on full-width mobile cards, pushed past the viewport and
        // added a blank strip / horizontal scroll. Clip the off-screen offset here
        // (x only — vertical page scroll is untouched).
        <section className="overflow-x-clip bg-cream py-20">
          <div className="container-x">
            <div className="mb-12 text-center">
              <span className="eyebrow mb-4">Our Journey</span>
              <h2 className="section-title">Milestones along the way</h2>
            </div>
            <div className="relative mx-auto max-w-3xl">
              {/* center line — centered on the same x as every node via -translate-x-1/2 */}
              <div className="absolute left-4 top-0 h-full w-0.5 -translate-x-1/2 bg-brand/20 sm:left-1/2" />
              <div className="space-y-8">
                {journey.map((m, i) => (
                  <div key={m.id} className="relative">
                    {/* node — dead-center on the line at every breakpoint */}
                    <span className="absolute left-4 top-2 z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-brand ring-4 ring-cream sm:left-1/2" />
                    {/* card — offset full width on mobile, alternating halves on desktop */}
                    <div className={`pl-12 sm:w-1/2 sm:pl-0 ${i % 2 ? "sm:ml-auto sm:pl-10" : "sm:pr-10 sm:text-right"}`}>
                      <Reveal direction={i % 2 ? "right" : "left"} delay={(i % 2) * 90}>
                        <div className="card-soft">
                          {m.image && (
                            <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-lg">
                              <ImageWithSkeleton src={m.image} alt={m.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                            </div>
                          )}
                          {m.year && <div className="text-sm font-bold text-brand">{m.year}</div>}
                          <div className="mt-1 font-bold text-ink">{m.title}</div>
                          <div className="mt-1 text-sm text-mutedfg">{m.description}</div>
                        </div>
                      </Reveal>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
