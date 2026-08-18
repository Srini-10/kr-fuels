"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, Clock, Navigation, Eye, Search, ChevronDown, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { ImageWithSkeleton } from "@/components/ImageWithSkeleton";
import type { StationPublic } from "@/lib/api";

const FEATURE_OPTIONS = ["Free water", "Nitrogen air", "Parking", "Restroom", "Air filling"];
const PER_PAGE = 9;

// Full network of station locations ("District - Area"), shown in the location
// filter. Some may not have a live station yet — they simply return no results
// until one is added.
const LOCATIONS = [
  "Ariyalur - Trichy Main Road",
  "Chengalpattu - Kanchipuram Road",
  "Chennai - Avadi",
  "Chennai - Kattupakkam",
  "Chennai - Kodungaiyur",
  "Chennai - Vadivelan Nagar",
  "Chennai - Velachery",
  "Coimbatore - Avinashi",
  "Coimbatore - Kinathukadavu",
  "Coimbatore - Mettupalayam",
  "Coimbatore - Neelambur",
  "Coimbatore - Saravanampatti",
  "Coimbatore - Sulur",
  "Cuddalore - Virudhachalam",
  "Dharmapuri - Palacode Road",
  "Dindigul - Batlagundu",
  "Dindigul - Palani Road",
  "Dindigul - Palayam",
  "Dindigul - Vedachandur",
  "Erode - Ammapettai",
  "Erode - Bhavani",
  "Erode - Kodumudi",
  "Erode - Moolapalayam",
  "Erode - Nasiyanur",
  "Erode - Perundurai",
  "Kallakurichi - Chinnasalem",
  "Karur - Aravakuruchi",
  "Karur - Madurai By Pass Road",
  "Karur - Puliyur",
  "Krishnagiri - Hosur",
  "Krishnagiri - Poochampalli",
  "Krishnagiri - Thiruvannamalai Road",
  "Madurai - Ellis Nagar",
  "Madurai - Melur",
  "Madurai - Pasumalai",
  "Madurai - Sivagangai Road",
  "Madurai - Villapuram",
  "Namakkal - Mettala",
  "Namakkal - Nallipalayam",
  "Namakkal - Paramathyvelur",
  "Namakkal - Rasipuram",
  "Namakkal - Thuraiyur Road",
  "Namakkal - Tiruchengode",
  "Namakkal - Trichy Road",
  "Namakkal - Vettambadi",
  "Perambalur - Siruvachur",
  "Pudukkottai - Nathampannai",
  "Ramanathapuram - Perungulam",
  "Salem - Attur",
  "Salem - Ayothiyapattinam",
  "Salem - Bangalore Bypass Road",
  "Salem - Omalur",
  "Salem - Sankari",
  "Salem - Tharamangalam",
  "Salem - Uthamasolapuram",
  "Sivagangai - Devakottai",
  "Sivagangai - Karaikudi",
  "Tenkasi - Madurai Courtallam Road",
  "Thanjavur - Kumbakonam",
  "Thanjavur - New Bus Stand",
  "Thanjavur - Thiruvaiyaru",
  "Theni - Bodinayakkanur",
  "Theni - Periyakulam Road",
  "Theni - Uthamapalayam",
  "Thoothukudi - Eral",
  "Tiruchirappalli - Ariyamangalam",
  "Tiruchirappalli - Cantonment",
  "Tiruchirappalli - Manapparai",
  "Tiruchirappalli - Musuri",
  "Tiruchirappalli - T.V.Kovil",
  "Tiruchirappalli - Thuraiyur",
  "Tiruchirappalli - TVS Tolgate",
  "Tirunelveli - Thachanallur Road",
  "Tiruppur - Dharapuram",
  "Tiruppur - Kangeyam",
  "Tiruppur - Mulanur",
  "Tiruppur - Palladam",
  "Tiruppur - Palladam - Trichy Road",
  "Tiruppur - Udumalpet",
  "Tiruppur - Vellakovil",
  "Viruthunagar - Sivakasi Road",
];

// Collapse a label to a comparison key (lowercase, strip punctuation/spacing) so
// "Madurai - Sivagangai Road" matches a station stored with quirky district/area
// formatting (redundant prefixes, en-dashes, missing spaces, etc.).
const locKey = (s: string) => s.toLowerCase().replace(/–/g, "-").replace(/[^a-z0-9]+/g, "");

function stationMatchesLocation(s: StationPublic, location: string): boolean {
  const target = locKey(location);
  const d = (s.district ?? "").trim();
  const a = (s.area ?? "").trim();
  const keys = [locKey(`${d} ${a}`), locKey(a), locKey(s.stationName ?? "")];
  return keys.includes(target);
}

function stationFeatures(s: StationPublic): string[] {
  const raw = [...(s.amenities ?? []), ...(s.features ?? [])].map((x) => String(x));
  return Array.from(new Set(raw));
}

function directionsUrl(s: StationPublic): string {
  if (s.mapLink) return s.mapLink;
  const lat = s.location?.latitude;
  const lng = s.location?.longitude;
  if (lat && lng) return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.stationName ?? ""} ${s.district ?? ""}`)}`;
}

// Compact page list: first, last and a small window around the current page,
// with "…" gaps for the rest. A station network this size can hit 9+ pages, and
// rendering one circle per page overflowed a 320px viewport — this keeps the
// control narrow. ≤7 pages just shows every page.
function paginationRange(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "ellipsis")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push("ellipsis");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("ellipsis");
  out.push(total);
  return out;
}

// Custom, on-theme location dropdown. A native <select> can't have its option
// list styled, so we render our own button + searchable popup (closes on outside
// click / Escape) with the brand palette and a properly-aligned chevron.
function LocationSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const close = () => { setOpen(false); setQuery(""); };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const options = useMemo(() => {
    const all = [{ value: "All", label: "All Locations" }, ...LOCATIONS.map((l) => ({ value: l, label: l }))];
    const term = query.trim().toLowerCase();
    return term ? all.filter((o) => o.label.toLowerCase().includes(term)) : all;
  }, [query]);

  const label = value === "All" ? "All Locations" : value;

  return (
    <div ref={ref} className="relative w-full sm:w-auto">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-3 rounded-full border bg-white px-4 py-2.5 text-sm font-medium text-ink outline-none transition sm:w-auto sm:min-w-[17rem] ${open ? "border-brand ring-2 ring-brand/15" : "border-line hover:border-brand"
          }`}
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-brand" : "text-ink/45"}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-white shadow-[0_12px_40px_rgba(13,26,16,0.16)]">
          {/* Search inside the menu — 81 locations is a lot to scroll. */}
          <div className="border-b border-line p-2">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search location…"
                className="w-full rounded-full border border-line bg-cream py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand focus:bg-white"
              />
            </div>
          </div>
          {/* Options */}
          <div className="max-h-72 overflow-auto p-1.5" role="listbox">
            {options.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-ink/50">No location found</div>
            ) : (
              options.map((o) => {
                const active = o.value === value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => { onChange(o.value); close(); }}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${active ? "bg-brand font-semibold text-white" : "text-ink/75 hover:bg-brand-pale hover:text-brand"
                      }`}
                  >
                    <span className="truncate">{o.label}</span>
                    {active && <Check size={15} className="shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function StationsExplorer({ stations }: { stations: StationPublic[] }) {
  const [location, setLocation] = useState("All");
  const [features, setFeatures] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const toggleFeature = (f: string) =>
    setFeatures((p) => (p.includes(f) ? p.filter((x) => x !== f) : [...p, f]));

  // Clear every filter back to its default. A full refresh already does this
  // (state starts at these values), but re-clicking "Stations" in the navbar
  // while already on this screen is a soft navigation that doesn't remount us —
  // the Header fires "stations:reset" so we can clear the lingering filters.
  useEffect(() => {
    const reset = () => { setLocation("All"); setFeatures([]); setQ(""); setPage(1); };
    window.addEventListener("stations:reset", reset);
    return () => window.removeEventListener("stations:reset", reset);
  }, []);

  const filtered = useMemo(() => {
    return stations.filter((s) => {
      if (location !== "All" && !stationMatchesLocation(s, location)) return false;
      if (q && !`${s.stationName} ${s.area} ${s.district}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (features.length) {
        const f = stationFeatures(s).map((x) => x.toLowerCase());
        if (!features.every((sel) => f.some((x) => x.includes(sel.toLowerCase().slice(0, 4))))) return false;
      }
      return true;
    });
  }, [stations, location, q, features]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  return (
    <div>
      {/* Filters */}
      <div className="mb-8 space-y-4">
        {/* Stack on phones, lay out side-by-side from sm up. The old `min-w-md`
            (= 28rem in Tailwind v4) on the search box forced the row wider than a
            phone viewport, causing the whole page to scroll horizontally. */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md sm:flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Search stations by name or area…"
              className="w-full rounded-full border border-black/10 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:items-end">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-sm font-medium text-ink/60">Location</span>
              <LocationSelect value={location} onChange={(v) => { setLocation(v); setPage(1); }} />
            </div>
            <span className="flex items-center gap-1 pr-1 text-xs font-medium text-brand">
              <MapPin size={12} className="shrink-0" />
              {filtered.length} {filtered.length === 1 ? "location" : "locations"} near you
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {FEATURE_OPTIONS.map((f) => (
            <div
              key={f}
              // onClick={() => { toggleFeature(f); setPage(1); }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${features.includes(f) ? "border-brand bg-brand text-white" : "border-black/10 bg-white text-ink/60 hover:border-brand"
                }`}
            >
              {f}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-5 text-sm text-ink/60">
        Showing <span className="font-semibold text-ink">{filtered.length}</span> of {stations.length} stations
      </div>

      {/* Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((s) => {
          const pincode = s.address?.pincode ? ` - ${s.address.pincode}` : "";
          const line = [s.address?.doorNo, s.address?.street].filter(Boolean).join(", ");
          return (
            <div key={s.id} className="card-soft flex flex-col">
              {/* Thumbnail — primary image or first image, with a graceful placeholder */}
              {(s.primaryImage || (s.images && s.images.length > 0)) ? (
                <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-xl">
                  <ImageWithSkeleton
                    src={s.primaryImage || s.images![0]}
                    alt={s.stationName ?? "Station"}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    quality={85}
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="mb-3 grid aspect-video w-full place-items-center rounded-xl bg-cream text-brand/30">
                  <MapPin size={36} />
                </div>
              )}
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="font-bold text-ink">{s.stationName}</h3>
                {s.stationCode && <span className="shrink-0 rounded-md bg-cream px-2 py-0.5 text-[11px] font-semibold text-ink/50">{s.stationCode}</span>}
              </div>
              <div className="text-xs font-medium text-brand">{s.district}{s.area ? ` — ${s.area}` : ""}</div>
              <p className="mt-2 flex items-start gap-1.5 text-sm text-ink/60">
                <MapPin size={14} className="mt-0.5 shrink-0" />{line}{pincode}
              </p>
              {!s.timingDisabled && s.workingHours && (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink/60">
                  <Clock size={14} />{s.workingHours}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {stationFeatures(s).slice(0, 4).map((f) => (
                  <span key={f} className="rounded-full bg-lime/30 px-2 py-0.5 text-[11px] font-semibold text-brand-dark">{f}</span>
                ))}
              </div>
              <div className="mt-4 flex gap-2 pt-3">
                <Link href={directionsUrl(s)} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand py-2 text-xs font-semibold text-white hover:bg-brand-dark">
                  <Navigation size={13} /> Directions
                </Link>
                <Link href={`/stations/${s.id}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-brand/30 py-2 text-xs font-semibold text-brand hover:bg-brand-pale">
                  <Eye size={13} /> View
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card-soft mt-4 text-center text-ink/60">No stations match your filters.</div>
      )}

      {/* Pagination — windowed + wrappable so it never overflows a narrow phone. */}
      {pages > 1 && (
        <nav className="mt-10 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2" aria-label="Pagination">
          <button
            type="button"
            onClick={() => setPage(Math.max(1, current - 1))}
            disabled={current === 1}
            aria-label="Previous page"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-black/10 text-ink/60 transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
          >
            <ChevronLeft size={16} />
          </button>

          {paginationRange(current, pages).map((it, idx) =>
            it === "ellipsis" ? (
              <span key={`gap-${idx}`} className="select-none px-0.5 text-sm text-ink/40">…</span>
            ) : (
              <button
                key={it}
                type="button"
                onClick={() => setPage(it)}
                aria-current={current === it ? "page" : undefined}
                className={`h-8 w-8 shrink-0 rounded-full text-sm font-semibold transition sm:h-9 sm:w-9 ${current === it ? "bg-brand text-white" : "border border-black/10 text-ink/60 hover:border-brand"
                  }`}
              >
                {it}
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => setPage(Math.min(pages, current + 1))}
            disabled={current === pages}
            aria-label="Next page"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-black/10 text-ink/60 transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
          >
            <ChevronRight size={16} />
          </button>
        </nav>
      )}
    </div>
  );
}
