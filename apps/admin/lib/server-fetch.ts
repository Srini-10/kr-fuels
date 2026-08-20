// lib/server-fetch.ts
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

// Server components hit the backend directly with its ABSOLUTE base. The public
// NEXT_PUBLIC_API_BASE_URL is now a relative same-origin path (proxied to the
// backend for the browser), which a server-side fetch cannot resolve.
const BACKEND_API_BASE_URL =
  process.env.BACKEND_API_BASE_URL ?? 'http://localhost:4000/api/v1'

// Bounce to /login instead of throwing. The login screen re-mints a session
// cookie from the still-valid Firebase sign-in and returns the admin to `next`,
// so an expired session self-heals rather than showing an error page.
async function reauthenticate(): Promise<never> {
  const next = (await headers()).get('x-pathname')
  const qs = next ? `?next=${encodeURIComponent(next)}` : ''
  redirect(`/login${qs}`)
}

export async function serverFetch(path: string, options?: RequestInit) {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value  // ✅ matches your verifySession

  if (!session) {
    await reauthenticate()
  }

  const res = await fetch(`${BACKEND_API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Cookie: `session=${session}`,  // ✅ forwards exactly what verifySession reads
      ...options?.headers,
    },
  })

  // The cookie was present but the backend rejected it — expired, revoked (a
  // password change revokes Firebase refresh tokens), or signed for a different
  // project. Re-authenticate. Previously this threw, and because seven of the
  // eight protected pages call serverFetch with no try/catch, it surfaced as
  // "Failed to load <screen>" on each of them.
  if (res.status === 401 || res.status === 403) {
    await reauthenticate()
  }

  if (!res.ok) {
    throw new Error(`${res.status}: ${path}`)
  }

  return res.json()
}
