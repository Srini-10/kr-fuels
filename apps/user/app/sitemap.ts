import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getStations } from "@/lib/api";

// Re-generated hourly so newly added stations appear without a redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // "/lubricants" retired (client request) — the route now 404s, so it must stay out
  // of the sitemap. Re-add it here if the page is ever restored.
  const routes = ["", "/about", "/products", "/conversionkit", "/tanks", "/stations", "/guide", "/contact", "/privacy"];
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = routes.map((r) => ({
    url: `${SITE_URL}${r}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: r === "" ? 1 : 0.7,
  }));

  // Station detail pages. These are the pages the SEO slugs exist for, so leaving
  // them out of the sitemap would waste the change — every station is a distinct
  // local-search landing page ("auto lpg neelambur coimbatore"). Falls back to the
  // document id for any station the slug backfill hasn't reached.
  let stationEntries: MetadataRoute.Sitemap = [];
  try {
    const { data } = await getStations();
    const active = data.filter((s) => (s.status ?? "active") === "active");

    // Station detail pages
    stationEntries = active.map((s) => ({
      url: `${SITE_URL}/stations/${s.slug || s.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    // Pagination pages (/stations/01, /stations/02, ...)
    const totalPages = Math.max(1, Math.ceil(active.length / 9));
    for (let p = 1; p <= totalPages; p++) {
      const pageSlug = String(p).padStart(2, "0");
      stationEntries.push({
        url: `${SITE_URL}/stations/${pageSlug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.65,
      });
    }
  } catch {
    // Backend unreachable — still emit a valid sitemap of the static routes
    // rather than failing the whole document.
  }

  return [...staticEntries, ...stationEntries];
}
