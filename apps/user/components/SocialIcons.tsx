// Official brand glyphs for the five social platforms the admin panel exposes
// (Site Settings → Social links: facebook, instagram, twitter, linkedin, youtube).
//
// lucide-react dropped its brand icons in v1, so the logos are inlined here as
// single-path SVGs (24×24, currentColor) — no extra dependency, and they render
// identically in the footer and on the Contact page.

import type { ReactElement } from "react";
import type { SiteSettings } from "@kr/shared/types";
import { normalizeUrl } from "@kr/shared/lib/utils";

type IconProps = { size?: number; className?: string };

// The glyphs are always rendered inside a link that carries the platform name
// (aria-label in the footer, visible text on the Contact page), so the SVG itself
// is hidden from assistive tech to avoid announcing the name twice.
const svg = (path: string) =>
  function BrandIcon({ size = 18, className }: IconProps) {
    return (
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={className}
      >
        <path d={path} />
      </svg>
    );
  };

export const FacebookIcon = svg(
  "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
);

export const InstagramIcon = svg(
  "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
);

// X (formerly Twitter) — the admin field is still keyed `twitter`.
export const TwitterIcon = svg(
  "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
);

export const LinkedinIcon = svg(
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
);

export const YoutubeIcon = svg(
  "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
);

export interface SocialPlatform {
  key: string;
  label: string;
  Icon: (props: IconProps) => ReactElement;
  /** Brand colour used for the hover state. */
  color: string;
  /** Host fragments used to recognise a link when the admin key is non-standard. */
  hosts: string[];
}

// Canonical display order — matches the Site Settings form in the admin panel.
export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { key: "facebook", label: "Facebook", Icon: FacebookIcon, color: "#1877F2", hosts: ["facebook.com", "fb.com", "fb.me"] },
  { key: "instagram", label: "Instagram", Icon: InstagramIcon, color: "#E4405F", hosts: ["instagram.com", "instagr.am"] },
  { key: "twitter", label: "X (Twitter)", Icon: TwitterIcon, color: "#000000", hosts: ["twitter.com", "x.com"] },
  { key: "linkedin", label: "LinkedIn", Icon: LinkedinIcon, color: "#0A66C2", hosts: ["linkedin.com", "lnkd.in"] },
  { key: "youtube", label: "YouTube", Icon: YoutubeIcon, color: "#FF0000", hosts: ["youtube.com", "youtu.be"] },
];

export interface ResolvedSocial extends SocialPlatform {
  url: string;
}

// A social entry only renders when the admin actually saved a usable link:
// blanks, whitespace-only values (" "), and placeholders like "#" or "-" are
// dropped instead of rendering an icon that goes nowhere.
function usableUrl(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const url = normalizeUrl(raw.trim());
  if (!url) return "";
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "http:" && protocol !== "https:") return "";
    // Require a real domain — kills "#", "-", "n/a" and similar placeholders.
    if (!hostname.includes(".") || hostname.startsWith(".") || hostname.endsWith(".")) return "";
    return url;
  } catch {
    return "";
  }
}

// Match an admin key to a platform. The key wins ("twitter", "twitter (formally x)",
// "x" → X); if it's unrecognised we fall back to the link's own host, so a custom
// key still gets the right logo rather than a generic one.
function matchPlatform(key: string, url: string): SocialPlatform | null {
  const k = key.toLowerCase();
  const byKey = SOCIAL_PLATFORMS.find(
    (p) => k.includes(p.key) || (p.key === "twitter" && /(^|\W)x(\W|$)/.test(k)),
  );
  if (byKey) return byKey;
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return SOCIAL_PLATFORMS.find((p) => p.hosts.some((h) => host === h || host.endsWith(`.${h}`))) ?? null;
  } catch {
    return null;
  }
}

/**
 * Turn the admin's `siteSettings.social` map into a render-ready list: only links
 * that actually resolve, one entry per platform, always in the canonical order
 * above (so the icon row looks the same on every page).
 */
export function resolveSocials(social: SiteSettings["social"]): ResolvedSocial[] {
  const found = new Map<string, ResolvedSocial>();
  for (const [key, raw] of Object.entries(social ?? {})) {
    const url = usableUrl(raw);
    if (!url) continue;
    const platform = matchPlatform(key, url);
    if (!platform || found.has(platform.key)) continue;
    found.set(platform.key, { ...platform, url });
  }
  return SOCIAL_PLATFORMS.map((p) => found.get(p.key)).filter(Boolean) as ResolvedSocial[];
}
