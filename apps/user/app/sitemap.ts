import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // "/lubricants" retired (client request) — the route now 404s, so it must stay out
  // of the sitemap. Re-add it here if the page is ever restored.
  const routes = ["", "/about", "/products", "/conversionkit", "/tanks", "/stations", "/guide", "/contact", "/privacy"];
  return routes.map((r) => ({
    url: `${SITE_URL}${r}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: r === "" ? 1 : 0.7,
  }));
}
