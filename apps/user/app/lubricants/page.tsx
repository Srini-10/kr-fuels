import type { Metadata } from "next";
import { notFound } from "next/navigation";
// import ProductScreen, { productMetadata } from "@/components/ProductScreen";

// ── RETIRED (client request): the Lubricants product page is no longer part of the
// website. The route is kept in the tree but always 404s, so the page is gone from
// the menus, the sitemap and any direct/bookmarked /lubricants link — even if a
// `lubricants` record still exists in the admin panel's Products collection.
//
// To bring it back: restore the code below, uncomment the ProductScreen import, and
// uncomment the matching entries in lib/products.ts (PRODUCT_CATALOG), app/sitemap.ts,
// lib/site.ts (OFFERINGS) and lib/fallbacks.ts (PRODUCTS_FALLBACK).

// export const revalidate = 300;
//
// export function generateMetadata(): Promise<Metadata> {
//   return productMetadata("lubricants");
// }
//
// export default function LubricantsPage() {
//   return <ProductScreen slug="lubricants" />;
// }

export const metadata: Metadata = {
  title: "Not Found",
  robots: { index: false, follow: false },
};

export default function LubricantsPage() {
  notFound();
}
