"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    getAdditionalUserInfo,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
} from "firebase/auth";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/components/providers/AuthProvider";

// Only follow same-origin, absolute-path redirects (guards against open redirects).
function safeNext(next: string | null): string {
    if (next && next.startsWith("/") && !next.startsWith("//")) return next;
    return "/dashboard";
}

async function createSession(idToken: string) {
    const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
        // Surface the backend's reason (e.g. "not-authorized") so the user sees
        // a precise message; fall back to a generic session error otherwise.
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "session-failed");
    }
}

// Marks that this tab already tried to rebuild the session cookie from an
// existing Firebase sign-in. If we come straight back to /login after that, the
// cookie isn't sticking, so we stop instead of bouncing forever (see below).
const RECOVERY_KEY = "kr-admin-session-recovery";
const RECOVERY_WINDOW_MS = 30_000;

function recentlyRecovered(): boolean {
    try {
        const at = Number(sessionStorage.getItem(RECOVERY_KEY) ?? 0);
        return at > 0 && Date.now() - at < RECOVERY_WINDOW_MS;
    } catch {
        return false; // storage disabled — just let the attempt through
    }
}

function markRecovery(on: boolean) {
    try {
        if (on) sessionStorage.setItem(RECOVERY_KEY, String(Date.now()));
        else sessionStorage.removeItem(RECOVERY_KEY);
    } catch {
        /* storage disabled — best effort */
    }
}

function CenteredSpinner() {
    return (
        <div className="flex items-center justify-center py-10">
            <Loader2 size={22} className="animate-spin text-brand" />
        </div>
    );
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = safeNext(searchParams.get("next"));
    const { user, loading: authLoading } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(true);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    // Set when we give up on an existing Firebase sign-in. It forces the form to
    // render even if signOut() couldn't clear `user` (e.g. offline), so a failure
    // can never leave the screen stuck on the spinner.
    const [showFormAnyway, setShowFormAnyway] = useState(false);

    // Already authenticated → rebuild the session cookie, then go to the intended
    // destination.
    //
    // Firebase keeps the sign-in in IndexedDB indefinitely, but the session cookie
    // the proxy checks expires after 14 days (and browsers/users clear cookies
    // independently). A returning admin therefore lands here signed in with NO
    // cookie — and simply navigating would make proxy.ts bounce us back to /login,
    // where this effect fires again: an endless redirect loop showing nothing but
    // the spinner. (Incognito has no persisted sign-in, so the form appears
    // normally — exactly the reported behaviour.) Minting a fresh cookie from the
    // current Firebase user breaks the loop and signs the admin straight back in.
    //
    // Gate on !loading so an in-flight manual sign-in owns the navigation itself.
    const redirecting = useRef(false);
    useEffect(() => {
        if (authLoading || loading || !user || redirecting.current) return;
        redirecting.current = true;

        let cancelled = false;
        (async () => {
            // Came back here right after a recovery attempt → the cookie was
            // rejected (blocked third-party/`secure` cookie, clock skew, …).
            // Sign out so the form is usable instead of looping.
            if (recentlyRecovered()) {
                markRecovery(false);
                try { await signOut(auth); } catch { /* ignore */ }
                if (cancelled) return;
                redirecting.current = false;
                setShowFormAnyway(true);
                setError("Your session expired and could not be restored. Please sign in again.");
                return;
            }

            try {
                markRecovery(true);
                const idToken = await user.getIdToken();
                await createSession(idToken);
                if (!cancelled) router.replace(next);
            } catch (err: any) {
                // Token refresh or session creation failed (revoked account,
                // offline, backend down). Clear the half-state and show why.
                markRecovery(false);
                try { await signOut(auth); } catch { /* ignore */ }
                if (cancelled) return;
                redirecting.current = false;
                setShowFormAnyway(true);
                setError(getFriendlyError(err?.code ?? err?.message));
            }
        })();

        return () => { cancelled = true; };
    }, [authLoading, loading, user, next, router]);

    // Reaching a clean login screen (no Firebase user) resets the recovery guard,
    // so a later expired-cookie visit gets its own attempt.
    useEffect(() => {
        if (!authLoading && !user) markRecovery(false);
    }, [authLoading, user]);

    async function applyPersistence() {
        // "Remember me" → keep the session after the tab/browser closes.
        try {
            await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
        } catch {
            /* persistence is best-effort; never block sign-in on it */
        }
    }

    async function handleEmailLogin(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (!email.trim()) return setError("Please enter your email address.");
        if (!password) return setError("Please enter your password.");

        setLoading(true);
        try {
            await applyPersistence();
            const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
            const idToken = await user.getIdToken();
            await createSession(idToken);
            router.replace(next);
        } catch (err: any) {
            // Sign out of Firebase so the spinner clears and the error is visible.
            // (If Firebase auth succeeded but session creation failed, `user` being
            // set would otherwise hide the error behind an indefinite spinner.)
            try { await signOut(auth); } catch { /* ignore */ }
            setError(getFriendlyError(err?.code ?? err?.message));
            setLoading(false);
        }
    }

    async function handleGoogleLogin() {
        setError("");
        setLoading(true);
        try {
            await applyPersistence();
            // Popup (not redirect): redirect-based sign-in silently fails in
            // browsers that partition third-party storage whenever authDomain
            // (*.firebaseapp.com) differs from the app's origin. Popup keeps the
            // OAuth exchange in the same context and returns the result inline.
            const result = await signInWithPopup(auth, new GoogleAuthProvider());

            // We never auto-provision admins. Google sign-in CREATES an Auth
            // account on first use, so if this account didn't already exist we
            // delete the one Firebase just made and reject — only accounts
            // already present in the Auth user list may sign in.
            if (getAdditionalUserInfo(result)?.isNewUser) {
                try { await result.user.delete(); } catch { /* signOut below clears it */ }
                throw new Error("not-authorized");
            }

            const idToken = await result.user.getIdToken();
            await createSession(idToken);
            router.replace(next);
        } catch (err: any) {
            // Sign out so a half-finished login (Firebase auth OK but session
            // creation failed) doesn't leave the spinner up and hide the error.
            try { await signOut(auth); } catch { /* ignore */ }
            setError(getFriendlyError(err?.code ?? err?.message));
            setLoading(false);
        }
    }

    // Show spinner while: Firebase is initialising, a sign-in is in flight, or
    // we're about to redirect after success — unless session recovery already
    // failed, in which case the form (with the reason) must win over the spinner.
    if (!showFormAnyway && (authLoading || loading || user)) return <CenteredSpinner />;

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-ink">Admin Login</h1>
                <p className="mt-1 text-sm text-mutedfg">
                    Sign in to the KR Trans Fuels admin panel.
                </p>
            </div>

            {/* Google OAuth */}
            {/* <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-line bg-white px-4 py-3 text-sm font-bold text-ink transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50"
            >
                <GoogleIcon />
                Continue with Google
            </button>

            <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-line" />
                <span className="text-xs text-mutedfg">or sign in with email</span>
                <div className="h-px flex-1 bg-line" />
            </div> */}

            {error && (
                <div
                    role="alert"
                    className="mb-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-600"
                >
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-4" noValidate>
                <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
                        Email
                    </label>
                    <div className="relative">
                        <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mutedfg" />
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@krfuels.com"
                            required
                            disabled={loading}
                            className="w-full rounded-lg border border-line py-2.5 pl-9 pr-3.5 text-sm text-ink transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-60"
                        />
                    </div>
                </div>

                <div>
                    <div className="mb-1.5 flex items-center justify-between">
                        <label htmlFor="password" className="block text-sm font-medium text-ink">
                            Password
                        </label>
                        <Link href="/forgot-password" className="text-xs font-medium text-brand hover:underline">
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mutedfg" />
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={loading}
                            className="w-full rounded-lg border border-line py-2.5 pl-9 pr-10 text-sm text-ink transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-60"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-mutedfg transition hover:text-ink"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-mutedfg">
                    <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="h-4 w-4 rounded border-line accent-brand"
                    />
                    Keep me signed in
                </label>

                <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    {loading ? "Signing in…" : "Sign in"}
                </button>
            </form>

            <p className="mt-6 text-center text-xs text-mutedfg">
                Access is restricted to authorized KR Trans Fuels staff.
            </p>
        </>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<CenteredSpinner />}>
            <LoginForm />
        </Suspense>
    );
}

// Map Firebase error codes → human-readable messages.
function getFriendlyError(code: string): string {
    const map: Record<string, string> = {
        "auth/invalid-credential": "Invalid email or password.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
        "auth/user-disabled": "This account has been disabled.",
        "auth/popup-closed-by-user": "Google sign-in was cancelled.",
        "auth/popup-blocked": "Your browser blocked the sign-in popup. Please allow popups and retry.",
        "auth/unauthorized-domain": "This domain is not authorised for Google sign-in. Contact your administrator.",
        "auth/network-request-failed": "Network error. Check your connection and try again.",
        "auth/api-key-not-valid": "Auth is misconfigured (invalid Firebase API key).",
        "not-authorized": "This account isn't authorized for the admin panel. Contact your administrator.",
        "session-failed": "Signed in, but the session could not be saved. Please try again.",
    };
    return map[code] ?? "Something went wrong. Please try again.";
}

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
        </svg>
    );
}
