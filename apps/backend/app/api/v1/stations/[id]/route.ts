import { verifySession } from "@/lib/auth/verify-session";
import { adminDb, adminStorage } from "@/lib/firebase/admin";
import { StationPatchSchema, StationSchema } from "@kr/shared/validators/station.schema";
import { NextRequest, NextResponse } from "next/server";
import { pushImagesToStorage, slugTakenBy } from "../route";
import { FieldValue } from "firebase-admin/firestore";
import { flattenObject } from "../../admin-contact/essentials/route";
export const dynamic = "force-dynamic"

export interface Params {
  params: Promise<{ id: string }>;
}


export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params; // ✅ await first

  const user = await verifySession(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doc = await adminDb.collection("stations").doc(id).get();

  if (!doc.exists) {
    return NextResponse.json({ error: "Station not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: { id: doc.id, ...doc.data() } });
}


export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;

  const user = await verifySession(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ref = adminDb.collection("stations").doc(id);
  const doc = await ref.get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Station not found" }, { status: 404 });
  }


  const formData = await request.formData();

  const fields: Record<string, any> = {};
  const imageFormData = new FormData();
  let hasImages = false;

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      imageFormData.append(key, value);
      hasImages = true;
    } else {
      try {
        fields[key] = JSON.parse(value)
      } catch {
        fields[key] = value
      }
    }
  }

  const payload = fields.data ?? fields

  const result = StationPatchSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  try {
    const updatedData: Record<string, any> = flattenObject(result.data)

    // An admin-supplied slug must stay unique across stations, or two pages
    // would answer at the same URL and the lookup would pick one arbitrarily.
    // Checked against every OTHER station so re-saving the form unchanged is a
    // no-op rather than a false collision.
    if (result.data.slug && (await slugTakenBy(result.data.slug, id))) {
      return NextResponse.json(
        { error: `The URL "${result.data.slug}" is already used by another station` },
        { status: 409 }
      );
    }

    // Images-only change is a valid update: the arrayUnion is added before the
    // empty-payload guard so it never trips the "No fields to update" 400.
    if (hasImages) {
      const imageUrls = await pushImagesToStorage(imageFormData, user);
      updatedData.images = FieldValue.arrayUnion(...imageUrls);
    }

    if (Object.keys(updatedData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    await ref.update(updatedData)
    const snapshot = await ref.get()
    const updated = { id: snapshot.id, ...snapshot.data() }

    return NextResponse.json({ success: true, data: { ...updated } });
  } catch (error: any) {
    // Surface a specific message (e.g. storage/upload failure) instead of a
    // generic 500 that the UI shows as "Saving Failed".
    console.error("STATION PATCH ERROR:", error);
    const status = typeof error?.status === "number" ? error.status : 500;
    return NextResponse.json(
      { error: error?.message || "Failed to update station" },
      { status }
    );
  }
}


export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;

  const user = await verifySession(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ref = adminDb.collection("stations").doc(id);
  const doc = await ref.get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Station not found" }, { status: 404 });
  }

  // Reset stationId to null for all related stationImages
  const imagesSnap = await adminDb
    .collection("stationImages")
    .where("stationId", "==", id)
    .get()

  if (!imagesSnap.empty) {
    const batch = adminDb.batch()
    imagesSnap.docs.forEach(doc => batch.update(doc.ref, { stationId: null }))
    await batch.commit()
  }

  await ref.delete();

  return NextResponse.json({
    success: true,
    message: "Station deleted",
    updatedImages: imagesSnap.size,
  });
}
