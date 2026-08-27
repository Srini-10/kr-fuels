import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { StationGallery } from "@/components/StationGallery";
import { MapPin, Clock, Navigation, Phone, User, Mail, ArrowLeft } from "lucide-react";
import { getStation } from "@/lib/api";
import { STATIONS_FALLBACK } from "@/lib/fallbacks";
import { SITE_URL } from "@/lib/site";

interface Props {
  params: Promise<{ id: string }>;
}

// ISR: station detail is cacheable; refreshes in the background.
export const revalidate = 60;

// Real backend station wins; otherwise use the fallback set (so demo "View" works).
// `handle` is either an SEO slug or a legacy Firestore document id — the backend
// resolves both.
async function resolveStation(handle: string) {
  return (
    (await getStation(handle)) ??
    STATIONS_FALLBACK.find((x) => x.id === handle || x.slug === handle) ??
    null
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const s = await resolveStation(id);
  if (!s) return { title: "Station" };

  const where = [s.area, s.district].filter(Boolean).join(", ");
  return {
    title: s.stationName ? `${s.stationName} — Auto LPG Station${where ? ` in ${where}` : ""}` : "Station",
    description: `Auto LPG station${where ? ` in ${where}` : ""}. Working hours, directions and amenities.`,
    // Point every variant of this page (legacy id URL, slug URL) at the one
    // canonical slug address so the ranking isn't split across both.
    alternates: { canonical: `${SITE_URL}/stations/${s.slug || s.id}` },
  };
}

export default async function StationDetailPage({ params }: Props) {
  const { id } = await params;
  const s = await resolveStation(id);
  if (!s) notFound();

  // Stations used to live at /stations/<firestore-id>. Those URLs may be indexed
  // or bookmarked, so they keep working — but send them on to the canonical slug
  // with a 301 so the ranking consolidates on one address instead of two.
  if (s.slug && s.slug !== id) permanentRedirect(`/stations/${s.slug}`);

  const line = [s.address?.doorNo, s.address?.street].filter(Boolean).join(", ");
  const pincode = s.address?.pincode ? ` - ${s.address.pincode}` : "";
  const lat = s.location?.latitude;
  const lng = s.location?.longitude;
  const directions = s.mapLink || (lat && lng
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.stationName} ${s.district}`)}`);
  const mapQuery = lat && lng ? `${lat},${lng}` : `${s.stationName ?? ""} ${s.district ?? ""}`;
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=17&output=embed`;
  const features = Array.from(new Set([...(s.amenities ?? []), ...(s.features ?? [])].map(String)));

  return (
    <section className="container-x py-12">
      <Link href="/stations" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
        <ArrowLeft size={15} /> All stations
      </Link>

      <div className="grid items-stretch gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          {(() => {
            const cover = (s as any).primaryImage || s.images?.[0];
            const rest = (s.images ?? []).filter((img: string) => img !== cover);
            const ordered = cover ? [cover, ...rest] : [];
            return <StationGallery images={ordered} stationName={s.stationName ?? "Station"} />;
          })()}
        </div>

        <div className="flex flex-col">
          <h1 className="text-3xl font-extrabold text-ink">{s.stationName}</h1>
          <div className="mt-1 font-medium text-brand">{s.district}{s.area ? ` — ${s.area}` : ""}</div>

          <div className="mt-6 space-y-3 text-sm text-ink/70">
            <p className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-brand" />{line}{pincode}</p>
            {!s.timingDisabled && s.workingHours && <p className="flex items-center gap-2"><Clock size={16} className="text-brand" />{s.workingHours}</p>}
            {s.contactPerson && <p className="flex items-center gap-2"><User size={16} className="text-brand" />{s.contactPerson}</p>}
            {s.mobileNumber && <p className="flex items-center gap-2"><Phone size={16} className="text-brand" />{s.mobileNumber}</p>}
            {s.emailID && <p className="flex items-center gap-2"><Mail size={16} className="text-brand" /><a href={`mailto:${s.emailID}`} className="hover:text-brand">{s.emailID}</a></p>}
          </div>

          {features.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {features.map((f) => (
                <span key={f} className="rounded-full bg-lime/30 px-2.5 py-1 text-xs font-semibold text-brand-dark">{f}</span>
              ))}
            </div>
          )}

          <Link href={directions} target="_blank" rel="noopener noreferrer" className="btn-primary mt-7 w-full">
            <Navigation size={16} /> Get Directions
          </Link>

          {/* Location map — `flex-1` grows to fill the right column so its bottom
              aligns exactly with the images grid on the left (no oversized min that
              would push it past the grid). A small min-height keeps the map usable
              on mobile (stacked) and as a floor when the grid is short. */}
          <div className="mt-4 flex-1 min-h-72 lg:min-h-40 overflow-hidden rounded-2xl border border-line">
            <iframe
              title={`${s.stationName ?? "Station"} location`}
              src={mapSrc}
              className="block h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
