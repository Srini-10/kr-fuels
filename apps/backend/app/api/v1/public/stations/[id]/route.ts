import { adminDb } from "@/lib/firebase/admin";
import { normalizeStation } from "@/lib/normalize/station";
import { looksLikeSlug } from "@kr/shared/utils/slug";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

// PUBLIC. Single station detail for the website. Returns the SAME normalized shape as
// the list route so a station reached from the list resolves to identical fields.
//
// The path segment is either an SEO slug ("sivan-auto-gas-neelambur-coimbatore")
// or a raw Firestore document id ("2b4w1BXnMFdatxip8bP4"). Slugs are the current
// form; ids must keep resolving so links shared or indexed before the change
// don't break — the website 301s those to the slug URL.
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;

    // Try slug first when the segment looks like one; otherwise go straight to
    // the document id. Either way we fall back to the other lookup, so a station
    // whose name genuinely resembles an id still resolves.
    const bySlug = async () => {
      const snap = await adminDb.collection("stations").where("slug", "==", id).limit(1).get();
      return snap.empty ? null : snap.docs[0];
    };
    const byId = async () => {
      const snap = await adminDb.collection("stations").doc(id).get();
      return snap.exists ? snap : null;
    };

    const doc = looksLikeSlug(id)
      ? (await bySlug()) ?? (await byId())
      : (await byId()) ?? (await bySlug());

    if (!doc) {
      return NextResponse.json({ success: false, error: "Station not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: normalizeStation(doc.id, doc.data() ?? {}) });
  } catch (e: any) {
    // Degrade gracefully (200 + null) like the other public endpoints; the website
    // then uses its fallback or shows 404 instead of a 500.
    console.error("PUBLIC STATION DETAIL ERROR:", e?.message ?? e);
    return NextResponse.json({ success: false, data: null });
  }
}
