import {
  ABOUT_CONTENT_DEFAULT,
  SITE_SETTINGS_DEFAULT,
  CALCULATOR_SETTINGS_DEFAULT,
  type AboutContent,
  type SiteSettings,
  type CalculatorSettings,
  type JourneyMilestone,
} from "@kr/shared/types";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

// All website reads go through the backend public endpoints. Each call degrades
// gracefully to a sensible fallback so the site renders even if the API is down.
async function getJson<T>(path: string, fallback: T, revalidate = 60): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  try {
    // Time-based cache; the admin also purges this on-demand (POST /api/revalidate
    // → revalidatePath) the instant content changes, so edits show immediately
    // instead of waiting out the `revalidate` window.
    const res = await fetch(`${BASE}${path}`, { next: { revalidate }, signal: controller.signal });
    clearTimeout(timer)
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    clearTimeout(timer)
    return fallback;
  }
}

export interface FuelPricesPublic {
  autoLPG: number;
  petrol: number;
  diesel: number;
  verified: string | null;
  priceUpdatedAt: string | null;
}

export async function getFuelPrices(): Promise<FuelPricesPublic> {
  const j = await getJson<{ data: FuelPricesPublic }>("/public/fuel-prices", {
    data: { autoLPG: 0, petrol: 0, diesel: 0, verified: null, priceUpdatedAt: null },
  }, 30);
  return j.data;
}

export interface StationPublic {
  id: string;
  /** SEO URL segment; empty for stations created before slugs. Use stationHref(). */
  slug?: string;
  stationName?: string;
  district?: string;
  area?: string;
  address?: { doorNo?: string; street?: string; pincode?: number | string };
  workingHours?: string;
  timingDisabled?: boolean;
  status?: string;
  images?: string[];
  mapLink?: string;
  location?: { latitude?: number; longitude?: number };
  amenities?: string[];
  features?: string[];
  stationCode?: string;
  contactPerson?: string;
  mobileNumber?: string;
  telephone?: string;
  emailID?: string;
  [key: string]: any;
}

export async function getStations(): Promise<{ data: StationPublic[]; total: number; districts: string[] }> {
  return getJson("/public/stations", { data: [], total: 0, districts: [] }, 300);
}

export async function getStation(id: string): Promise<StationPublic | null> {
  const j = await getJson<{ data: StationPublic | null }>(`/public/stations/${id}`, { data: null }, 300);
  return j.data;
}

export async function getStationCount(): Promise<number> {
  const j = await getStations();
  return j.total;
}

export interface TestimonialPublic {
  id: string;
  name: string;
  designation?: string;
  company?: string;
  message: string;
  image?: string;
  rating?: number;
}
export async function getTestimonials(): Promise<TestimonialPublic[]> {
  const j = await getJson<{ data: TestimonialPublic[] }>("/public/testimonials", { data: [] }, 600);
  return j.data;
}

export interface FaqPublic { id: string; question?: string; answer?: string; isLink?: boolean; order?: number; [k: string]: any }
export async function getFaq(): Promise<FaqPublic[]> {
  const j = await getJson<{ data: FaqPublic[] }>("/public/faq", { data: [] }, 600);
  return j.data;
}

export async function getPrivacy(): Promise<any> {
  const j = await getJson<{ data: any }>("/public/privacy-policy", { data: null }, 3600);
  return j.data;
}

export interface ContactDetails {
  essentials: any | null;
  presents: any | null;
}
export async function getContact(): Promise<ContactDetails> {
  const j = await getJson<{ data: ContactDetails }>("/public/contact", { data: { essentials: null, presents: null } }, 1800);
  return j.data;
}

export interface ProductSection { heading: string; items: string[] }
export interface ProductSpec    { name: string;    detail: string  }

export interface ProductPublic {
  id: string;
  product_name: string;
  product_category: string;
  tagline: string;
  description: string;
  product_image: string;
  gallery_images: string[];
  sections: ProductSection[];
  specs: ProductSpec[];
  slug?: string;
  cta_primary_text: string;
  cta_primary_href: string;
  cta_secondary_text: string;
  cta_secondary_href: string;
  is_external: boolean;
  external_url: string;
}
export async function getProducts(): Promise<{ data: ProductPublic[]; categories: any[] }> {
  return getJson("/public/products", { data: [], categories: [] }, 600);
}

export interface ClientPublic { id: string; name: string; type: string; website: string; logo: string }
export async function getClients(type?: string): Promise<ClientPublic[]> {
  const j = await getJson<{ data: ClientPublic[] }>(`/public/clients${type ? `?type=${type}` : ""}`, { data: [] }, 600);
  return j.data;
}

export async function getAbout(): Promise<AboutContent> {
  const j = await getJson<{ data: AboutContent }>("/public/about", { data: ABOUT_CONTENT_DEFAULT }, 1800);
  return j.data ?? ABOUT_CONTENT_DEFAULT;
}

export async function getJourney(): Promise<JourneyMilestone[]> {
  const j = await getJson<{ data: JourneyMilestone[] }>("/public/journey", { data: [] }, 1800);
  return j.data;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const j = await getJson<{ data: SiteSettings }>("/public/site-settings", { data: SITE_SETTINGS_DEFAULT }, 1800);
  return j.data ?? SITE_SETTINGS_DEFAULT;
}

export async function getCalculatorSettings(): Promise<CalculatorSettings> {
  const j = await getJson<{ data: CalculatorSettings }>("/public/calculator-settings", { data: CALCULATOR_SETTINGS_DEFAULT }, 1800);
  return j.data ?? CALCULATOR_SETTINGS_DEFAULT;
}

export async function getHeroImages(): Promise<string[]> {
  // Keep the hero data cache aligned with the home page's own `revalidate = 30`
  // so a background regeneration actually re-fetches the slides. A longer window
  // (e.g. 300) makes the hero lag the rest of the page by minutes whenever the
  // on-demand purge (POST /api/revalidate) doesn't fire — e.g. a REVALIDATE_SECRET
  // mismatch between the admin and user backends.
  const j = await getJson<{ data: { id: string; url: string; order: number }[] }>(
    "/public/hero-images",
    { data: [] },
    30,
  );
  return (j.data ?? [])
    .filter((img) => img.url)
    .sort((a, b) => a.order - b.order)
    .map((img) => img.url);
}
