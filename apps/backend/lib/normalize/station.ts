// Normalizes a raw Firestore station doc into ONE clean, typed public contract that
// the website (apps/user) reads directly. Stations are written by the admin form with a
// nested `location.{latitude,longitude}` shape, but legacy / Excel-imported docs may use
// `location.{lat,lng}` or flat `latitude`/`longitude` fields. We map all of them to a
// single `location.{latitude,longitude}` shape so directions/maps never break.

export interface PublicStation {
  id: string;
  slug: string;
  stationName: string;
  district: string;
  area: string;
  address: { doorNo: string; street: string; pincode: string | number };
  workingHours: string;
  timingDisabled: boolean;
  status: string;
  images: string[];
  primaryImage: string;
  location: { latitude: number; longitude: number } | null;
  mapLink: string;
  contactPerson: string;
  mobileNumber: string;
  telephone: string;
  emailID: string;
  amenities: string[];
  features: string[];
  stationCode: string;
  createdAt: string | null;
}

function toNum(v: unknown): number | undefined {
  const n = typeof v === "string" ? Number.parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function toIso(v: any): string | null {
  if (!v) return null;
  if (typeof v?.toDate === "function") return v.toDate().toISOString();
  if (typeof v === "string") return v;
  return null;
}

export function normalizeStation(id: string, d: any): PublicStation {
  const loc = d?.location ?? {};
  const lat = toNum(loc.latitude ?? loc.lat ?? d?.latitude);
  const lng = toNum(loc.longitude ?? loc.lng ?? d?.longitude);
  const addr = d?.address ?? {};

  return {
    id,
    // Empty until the backfill runs; callers fall back to `id` so a slug-less
    // station still resolves at its old URL.
    slug: d?.slug ?? "",
    stationName: d?.stationName ?? "",
    district: d?.district ?? "",
    area: d?.area ?? "",
    address: {
      doorNo: addr.doorNo ?? d?.doorNo ?? "",
      street: addr.street ?? d?.street ?? "",
      pincode: addr.pincode ?? d?.pincode ?? "",
    },
    workingHours: d?.workingHours ?? "",
    timingDisabled: d?.timingDisabled === true,
    status: String(d?.status ?? "active"),
    images: Array.isArray(d?.images) ? d.images.filter(Boolean) : [],
    primaryImage: d?.primaryImage ?? "",
    location: lat !== undefined && lng !== undefined ? { latitude: lat, longitude: lng } : null,
    mapLink: d?.mapLink ?? "",
    contactPerson: d?.contactPerson ?? "",
    mobileNumber: d?.mobileNumber ?? "",
    telephone: d?.telephone ?? "",
    emailID: d?.emailID ?? "",
    amenities: Array.isArray(d?.amenities) ? d.amenities.map(String) : [],
    features: Array.isArray(d?.features) ? d.features.map(String) : [],
    stationCode: d?.stationCode ?? "",
    createdAt: toIso(d?.createdAt),
  };
}
