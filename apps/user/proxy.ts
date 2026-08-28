import { NextResponse, NextRequest } from "next/server";

// Legacy station URLs -> canonical slug URLs, as a real 301.
//
// The page component also calls permanentRedirect(), but /stations/[id] has a
// loading.tsx, which puts it behind a Suspense boundary: Next starts streaming
// the response before the component finishes, so by the time the redirect is
// thrown the status line is already sent. Next degrades that to
// `<meta http-equiv="refresh">` inside a 200 — which browsers follow, but which
// search engines treat as far weaker than a 301 and which does not reliably
// consolidate link equity. Since the whole point of the slugs is SEO, the
// redirect has to happen here, before rendering begins.
//
// The page-level redirect stays as a backstop for anything that bypasses this.

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1";

// Firestore auto-ids: exactly 20 mixed-case alphanumerics, never a hyphen.
// Slugs always contain a hyphen (or are plainly not this shape), so this only
// fires for the legacy form and costs slug traffic nothing.
const FIRESTORE_ID = /^[A-Za-z0-9]{20}$/;

export async function proxy(req: NextRequest) {
    const match = req.nextUrl.pathname.match(/^\/stations\/(?:(\d{1,3})\/)?([^/]+)\/?$/);
    if (!match) return NextResponse.next();

    const pagePrefix = match[1];
    const handle = decodeURIComponent(match[2]);

    // Skip pure pagination routes like /stations/07
    if (/^\d+$/.test(handle)) return NextResponse.next();
    if (!FIRESTORE_ID.test(handle)) return NextResponse.next();

    try {
        // Fail open on any trouble: a slow or broken API must never take the
        // station page down, it should just render at the old URL.
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`${BASE}/public/stations/${handle}`, { signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) return NextResponse.next();

        const slug = (await res.json())?.data?.slug;
        if (typeof slug === "string" && slug && slug !== handle) {
            const url = req.nextUrl.clone();
            url.pathname = pagePrefix ? `/stations/${pagePrefix}/${slug}` : `/stations/${slug}`;
            return NextResponse.redirect(url, 301);
        }
    } catch {
        /* fall through and render at the id URL */
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/stations/:path*"],
};
