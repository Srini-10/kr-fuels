import { NextResponse, NextRequest } from "next/server";

// Routes reachable without a session. Note: matching must be exact / prefixed
// — a bare "/" with startsWith() would mark EVERY path public.
const PUBLIC_PREFIXES = ["/login", "/register", "/forgot-password", "/api", "/_next", "/assets"];

function isPublicPath(pathname: string): boolean {
    if (pathname === "/") return true; // root self-redirects in app/page.tsx
    return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Firebase session cookies are JWTs. Read the `exp` claim WITHOUT verifying the
// signature — the Edge runtime cannot run firebase-admin, and this is only a
// cheap fast-path so an obviously dead cookie never reaches a page that would
// then fail every server fetch with a 401. The real, signed verification still
// happens in the backend's verifySession() on every request.
function isExpired(sessionCookie: string): boolean {
    try {
        const payload = sessionCookie.split(".")[1];
        if (!payload) return true;
        const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
        const { exp } = JSON.parse(json) as { exp?: number };
        if (typeof exp !== "number") return true;
        return exp * 1000 <= Date.now();
    } catch {
        return true; // unparseable → treat as dead so we re-authenticate
    }
}

function toLogin(req: NextRequest, pathname: string, search: string) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", `${pathname}${search}`);
    const res = NextResponse.redirect(url);
    // Drop the dead cookie, otherwise this same check waves the next request
    // through again and /login cannot tell a stale session from a live one.
    res.cookies.set("session", "", { path: "/", maxAge: 0 });
    return res;
}

export async function proxy(req: NextRequest) {
    const { pathname, search } = req.nextUrl;
    const session = req.cookies.get("session")?.value;

    if (!isPublicPath(pathname)) {
        if (!session) {
            // Send unauthenticated users to login, remembering where they were headed.
            const url = new URL("/login", req.url);
            url.searchParams.set("next", `${pathname}${search}`);
            return NextResponse.redirect(url);
        }
        // A present-but-expired cookie used to pass straight through here, so the
        // page rendered and every serverFetch came back 401 — surfacing as a hard
        // "Failed to load …" error screen instead of a re-login.
        if (isExpired(session)) return toLogin(req, pathname, search);
    }

    // Expose the path to server components (serverFetch uses it to build the
    // ?next= parameter when the backend rejects the session mid-render).
    const headers = new Headers(req.headers);
    headers.set("x-pathname", `${pathname}${search}`);
    return NextResponse.next({ request: { headers } });
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
