import { NextRequest, NextResponse } from "next/server";

// CORS for the standalone API. Origins are echoed from env so credentials
// (the `session` cookie) can flow from the admin & user front-ends.
// ADMIN_ORIGIN / USER_ORIGIN each accept a comma-separated list, because the
// public site is reachable on both the apex and the www host and the browser
// sends whichever one the visitor actually landed on.
const ALLOWED_ORIGINS = [
  process.env.ADMIN_ORIGIN,
  process.env.USER_ORIGIN,
  // dev defaults — user site :3000, admin panel :3001
  "http://localhost:3000",
  "http://localhost:3001",
]
  .flatMap((v) => (v ? v.split(",") : []))
  .map((v) => v.trim())
  .filter(Boolean);

function corsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin =
    origin && ALLOWED_ORIGINS.includes(origin)
      ? origin
      : ALLOWED_ORIGINS[0] ?? "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

export function proxy(req: NextRequest) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  // Preflight
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }

  const res = NextResponse.next();
  for (const [key, value] of Object.entries(headers)) {
    res.headers.set(key, value);
  }
  return res;
}

export const config = {
  matcher: "/api/:path*",
};
