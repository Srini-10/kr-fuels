"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    sendPasswordResetEmail,
    updatePassword,
    verifyBeforeUpdateEmail,
} from "firebase/auth";
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, LogOut, Mail, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { logout, displayName, initials } from "@/lib/auth";
import { C } from "@/constants/colors";
import { avatarColor } from "@/lib/avatarColor";

function friendlyAuthError(code?: string): string {
    const map: Record<string, string> = {
        "auth/wrong-password": "Current password is incorrect.",
        "auth/invalid-credential": "Current password is incorrect.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
        "auth/requires-recent-login": "Please re-enter your current password and try again.",
        "auth/email-already-in-use": "That email is already in use by another account.",
        "auth/invalid-email": "Enter a valid email address.",
        "auth/weak-password": "Password must be at least 6 characters.",
        "auth/network-request-failed": "Network error. Check your connection and try again.",
    };
    return map[code ?? ""] ?? "Something went wrong. Please try again.";
}

export default function ProfilePage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [resetState, setResetState] = useState<"idle" | "sending" | "sent" | "error">("idle");
    const [signingOut, setSigningOut] = useState(false);

    const [newEmail, setNewEmail] = useState("");
    const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
    const [emailSubmitting, setEmailSubmitting] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [emailSuccess, setEmailSuccess] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordSubmitting, setPasswordSubmitting] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    const [visible, setVisible] = useState<Record<string, boolean>>({});
    const toggleVisible = (key: string) => setVisible((v) => ({ ...v, [key]: !v[key] }));

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 size={22} className="animate-spin text-brand" />
            </div>
        );
    }

    const name = displayName(user);
    const email = user?.email ?? "—";
    const photo = user?.photoURL ?? "";
    const verified = user?.emailVerified;
    const isPasswordAccount = user?.providerData?.some((p) => p.providerId === "password") ?? false;
    const provider = user?.providerData?.[0]?.providerId === "google.com" ? "Google" : "Email & password";

    async function handleReset() {
        if (!user?.email) return;
        setResetState("sending");
        try {
            await sendPasswordResetEmail(auth, user.email);
            setResetState("sent");
        } catch {
            setResetState("error");
        }
    }

    async function handleLogout() {
        setSigningOut(true);
        await logout();
        router.replace("/login");
    }

    async function handleChangeEmail(e: React.FormEvent) {
        e.preventDefault();
        setEmailError("");
        setEmailSuccess(false);
        if (!user?.email || !auth.currentUser) return;

        const trimmed = newEmail.trim();
        if (!trimmed || trimmed === user.email) {
            setEmailError("Enter a different email address.");
            return;
        }

        setEmailSubmitting(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, emailCurrentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await verifyBeforeUpdateEmail(auth.currentUser, trimmed);
            setEmailSuccess(true);
            setNewEmail("");
            setEmailCurrentPassword("");
        } catch (err: any) {
            setEmailError(friendlyAuthError(err?.code));
        } finally {
            setEmailSubmitting(false);
        }
    }

    async function handleChangePassword(e: React.FormEvent) {
        e.preventDefault();
        setPasswordError("");
        setPasswordSuccess(false);
        if (!user?.email || !auth.currentUser) return;

        if (newPassword.length < 6) {
            setPasswordError("New password must be at least 6 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("New password and confirmation do not match.");
            return;
        }

        setPasswordSubmitting(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, newPassword);
            setPasswordSuccess(true);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            setPasswordError(friendlyAuthError(err?.code));
        } finally {
            setPasswordSubmitting(false);
        }
    }

    return (
        <section className="mx-auto max-w-2xl p-6">
            <h1 className="text-[20px] font-bold leading-tight text-ink">Profile</h1>
            <p className="text-[13px] text-mutedfg">Your KR Trans Fuels admin account.</p>

            <div className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-[0_2px_18px_rgba(26,46,41,0.05)]">
                {/* Identity */}
                <div className="flex items-center gap-4">
                    {photo ? (
                        // Auth-provider photo URL (Google/Firebase) → unoptimized, still lazy-loaded.
                        <Image src={photo} alt="" width={64} height={64} unoptimized referrerPolicy="no-referrer" className="h-16 w-16 rounded-full object-cover" />
                    ) : (
                        <div
                            className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold"
                            style={{ background: avatarColor(name).bg, color: avatarColor(name).fg }}
                        >
                            {initials(user)}
                        </div>
                    )}
                    <div className="min-w-0">
                        <div className="truncate text-lg font-bold text-ink">{name}</div>
                        <div className="flex items-center gap-1.5 text-sm text-mutedfg">
                            <Mail size={14} /> <span className="truncate">{email}</span>
                        </div>
                    </div>
                </div>

                {/* Details */}
                <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                    <Detail label="Sign-in method" value={provider} />
                    <Detail
                        label="Email verified"
                        value={
                            <span className="inline-flex items-center gap-1.5">
                                {verified ? (
                                    <ShieldCheck size={15} className="text-brand" />
                                ) : null}
                                {verified ? "Verified" : "Not verified"}
                            </span>
                        }
                    />
                    <Detail label="User ID" value={<span className="break-all font-mono text-xs">{user?.uid ?? "—"}</span>} />
                </dl>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-5">
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={resetState === "sending" || resetState === "sent" || !user?.email}
                        className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[13px] font-medium text-ink transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {resetState === "sending" ? <Loader2 size={15} className="animate-spin" /> : resetState === "sent" ? <CheckCircle2 size={15} className="text-brand" /> : <KeyRound size={15} />}
                        {resetState === "sent" ? "Reset email sent" : "Send password reset email"}
                    </button>

                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={signingOut}
                        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                        style={{ background: C.red }}
                    >
                        <LogOut size={15} /> {signingOut ? "Signing out…" : "Logout"}
                    </button>
                </div>

                {resetState === "error" && (
                    <p className="mt-3 text-sm text-red-600">Could not send the reset email. Please try again.</p>
                )}
            </div>

            {isPasswordAccount && (
                <>
                    <div className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-[0_2px_18px_rgba(26,46,41,0.05)]">
                        <h2 className="flex items-center gap-1.5 text-[15px] font-bold text-ink">
                            <Mail size={16} /> Change email
                        </h2>
                        <p className="text-[13px] text-mutedfg">Confirm with your current password. We&apos;ll email a verification link to the new address.</p>

                        {emailError && (
                            <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-600">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <span>{emailError}</span>
                            </div>
                        )}
                        {emailSuccess && (
                            <div className="mt-4 flex items-start gap-2 rounded-lg border border-brand/20 bg-brand-pale px-3.5 py-3 text-sm text-ink">
                                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand" />
                                <span>Verification link sent. Your email updates once you confirm it.</span>
                            </div>
                        )}

                        <form onSubmit={handleChangeEmail} className="mt-4 space-y-3" noValidate>
                            <div>
                                <label htmlFor="newEmail" className="mb-1.5 block text-sm font-medium text-ink">New email</label>
                                <input
                                    id="newEmail"
                                    type="email"
                                    autoComplete="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder="you@krfuels.com"
                                    required
                                    disabled={emailSubmitting}
                                    className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-ink transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-60"
                                />
                            </div>
                            <div>
                                <label htmlFor="emailCurrentPassword" className="mb-1.5 block text-sm font-medium text-ink">Current password</label>
                                <div className="relative">
                                    <input
                                        id="emailCurrentPassword"
                                        type={visible.emailCurrentPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        value={emailCurrentPassword}
                                        onChange={(e) => setEmailCurrentPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        disabled={emailSubmitting}
                                        className="w-full rounded-lg border border-line py-2.5 pl-3.5 pr-10 text-sm text-ink transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-60"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => toggleVisible("emailCurrentPassword")}
                                        aria-label={visible.emailCurrentPassword ? "Hide password" : "Show password"}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-mutedfg transition hover:text-ink"
                                    >
                                        {visible.emailCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={emailSubmitting}
                                className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {emailSubmitting && <Loader2 size={15} className="animate-spin" />}
                                {emailSubmitting ? "Updating…" : "Update email"}
                            </button>
                        </form>
                    </div>

                    <div className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-[0_2px_18px_rgba(26,46,41,0.05)]">
                        <h2 className="flex items-center gap-1.5 text-[15px] font-bold text-ink">
                            <KeyRound size={16} /> Change password
                        </h2>
                        <p className="text-[13px] text-mutedfg">Confirm with your current password, then set a new one.</p>

                        {passwordError && (
                            <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-600">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <span>{passwordError}</span>
                            </div>
                        )}
                        {passwordSuccess && (
                            <div className="mt-4 flex items-start gap-2 rounded-lg border border-brand/20 bg-brand-pale px-3.5 py-3 text-sm text-ink">
                                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand" />
                                <span>Password updated.</span>
                            </div>
                        )}

                        <form onSubmit={handleChangePassword} className="mt-4 space-y-3" noValidate>
                            {([
                                { id: "currentPassword", label: "Current password", value: currentPassword, set: setCurrentPassword, autoComplete: "current-password" },
                                { id: "newPassword", label: "New password", value: newPassword, set: setNewPassword, autoComplete: "new-password" },
                                { id: "confirmPassword", label: "Confirm new password", value: confirmPassword, set: setConfirmPassword, autoComplete: "new-password" },
                            ] as const).map((f) => (
                                <div key={f.id}>
                                    <label htmlFor={f.id} className="mb-1.5 block text-sm font-medium text-ink">{f.label}</label>
                                    <div className="relative">
                                        <input
                                            id={f.id}
                                            type={visible[f.id] ? "text" : "password"}
                                            autoComplete={f.autoComplete}
                                            value={f.value}
                                            onChange={(e) => f.set(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            disabled={passwordSubmitting}
                                            className="w-full rounded-lg border border-line py-2.5 pl-3.5 pr-10 text-sm text-ink transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-60"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => toggleVisible(f.id)}
                                            aria-label={visible[f.id] ? "Hide password" : "Show password"}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-mutedfg transition hover:text-ink"
                                        >
                                            {visible[f.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button
                                type="submit"
                                disabled={passwordSubmitting}
                                className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {passwordSubmitting && <Loader2 size={15} className="animate-spin" />}
                                {passwordSubmitting ? "Updating…" : "Update password"}
                            </button>
                        </form>
                    </div>
                </>
            )}
        </section>
    );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-mutedfg">{label}</dt>
            <dd className="mt-0.5 text-sm text-ink">{value}</dd>
        </div>
    );
}
