import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, "..", ".."),
  },
  transpilePackages: ["@kr/shared"],
  // The Lubricants page is retired (client request). Both of its URLs permanently
  // redirect to Products so old links, bookmarks and search results never land on a
  // dead page. Handled here rather than by the page's notFound(), because those
  // routes are ISR-prerendered — Next serves a prerendered not-found body with a
  // 200 ("soft 404"), which search engines keep indexing. Delete this block (and
  // restore the commented code in lib/products.ts) to bring the page back.
  async redirects() {
    return [
      { source: "/lubricants", destination: "/products", permanent: true },
      { source: "/products/lubricants", destination: "/products", permanent: true },
    ];
  },
  images: {
    // Allowed `quality` values for next/image. The full-screen station gallery
    // requests 90 for crisp, full-resolution viewing (75 is Next's default for
    // the smaller thumbnails). Listing them explicitly keeps Next 16 from
    // rejecting the non-default quality props.
    qualities: [75, 85, 90, 100],
    // Hosts whose images go through Next's optimizer. Firebase Storage serves
    // from both storage.googleapis.com and firebasestorage.googleapis.com.
    // Arbitrary admin-entered URLs (logos/avatars) render via <Image unoptimized>,
    // which bypasses this list.
    remotePatterns: [
      { protocol: "https", hostname: "storage.googleapis.com", pathname: "/**" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com", pathname: "/**" },
      { protocol: "https", hostname: "**.lovable.app", pathname: "/**" },
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
