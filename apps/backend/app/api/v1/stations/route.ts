import { adminDb, adminStorage } from "@/lib/firebase/admin";
import { verifySession } from "@/lib/auth/verify-session";
import { NextRequest, NextResponse } from "next/server";
import { type DocumentData, FieldValue } from "firebase-admin/firestore";
import { StationSchema } from "@kr/shared/validators/station.schema";
import { stationSlug, uniqueStationSlug } from "@kr/shared/utils/slug";
import { DecodedIdToken } from "firebase-admin/auth";
import AppError from "@/utils/appError";
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const user = await verifySession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const page = Math.max(Number.parseInt(searchParams.get("page") ?? "1"), 1);
    const limit = Math.min(Number.parseInt(searchParams.get("limit") ?? "10"), 100);
    const district = (searchParams.get("district") ?? "").trim();
    const area = (searchParams.get("area") ?? "").trim();
    const search = (searchParams.get("search") ?? "").trim().toLowerCase();

    const baseCollection = adminDb.collection("stations");

    // Read the whole collection once, then filter / sort / paginate in memory.
    // Stations are a small set (a few hundred across the network \u2014 the public site
    // and /stations/all already read them all), and doing it this way lets the
    // district + area + search filters combine freely WITHOUT needing Firestore
    // composite indexes (a `.where()` + `.orderBy("stationName")` combo requires
    // one per field combination, which is what made the old filter fail). The
    // active/inactive counts stay as cheap single-field aggregations.
    const [allSnap, activeSnap, inactiveSnap] = await Promise.all([
      baseCollection.get(),
      baseCollection.where("status", "==", "active").count().get(),
      baseCollection.where("status", "==", "inactive").count().get(),
    ]);

    const all = allSnap.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as DocumentData),
    })) as Array<DocumentData & { id: string }>;

    // Filter options mirror the mobile app's station-locator dropdowns EXACTLY: only
    // ACTIVE stations contribute, grouped district(=City) -> area, so the admin's
    // City and Area dropdowns show the same values the app does. (Matches the Flutter
    // groupStationsByDistrictArea: a station counts as active when status is
    // missing/empty or "active"; rows with an empty district or area are skipped.)
    const isActiveStation = (s: DocumentData) => {
      const st = (s.status ?? "").toString().trim().toLowerCase();
      return st === "" || st === "active";
    };

    const groupedActive: Record<string, Set<string>> = {};
    for (const s of all) {
      if (!isActiveStation(s)) continue;
      const d = (s.district ?? "").trim();
      const a = (s.area ?? "").trim();
      if (!d || !a) continue;
      (groupedActive[d] ??= new Set()).add(a);
    }

    // City list + cascading area map, both active-only to match the app. Area can
    // still be filtered on its own (when no city is chosen) via the flat list.
    const uniqueDistricts = Object.keys(groupedActive).sort();
    const areasByDistrict: Record<string, string[]> = Object.fromEntries(
      Object.entries(groupedActive).map(([d, set]) => [d, [...set].sort()]),
    );
    const uniqueAreas = [
      ...new Set(Object.values(groupedActive).flatMap(set => [...set])),
    ].sort();

    // Every distinct district across ALL stations (active + inactive) — powers the
    // "Districts Covered" stat and the add/edit form's district picker, which must
    // still offer a district that currently has only inactive stations.
    const allDistricts = [
      ...new Set(all.map(s => (s.district ?? "").trim()).filter(Boolean)),
    ].sort();

    // Apply the active filters. Equality on district/area; case-insensitive
    // substring match on the station name for search.
    let filtered = all;
    if (district) filtered = filtered.filter(s => (s.district ?? "").trim() === district);
    if (area) filtered = filtered.filter(s => (s.area ?? "").trim() === area);
    if (search) filtered = filtered.filter(s => (s.stationName ?? "").toLowerCase().includes(search));

    // Stable alphabetical order by station name (matches the previous orderBy).
    filtered.sort((a, b) =>
      (a.stationName ?? "").localeCompare(b.stationName ?? "", undefined, { sensitivity: "base" }),
    );

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const stations = filtered.slice(skip, skip + limit);

    return NextResponse.json({
      data: stations,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      stats: {
        active: activeSnap.data().count,
        inactive: inactiveSnap.data().count,
        totalDistricts: allDistricts.length,
        districts: uniqueDistricts,
        areas: uniqueAreas,
        areasByDistrict,
        allDistricts,
      },
    });
  }
  catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifySession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    const raw = formData.get("data");
    if (!raw || typeof raw !== "string") {
      return NextResponse.json({ error: "Missing station data" }, { status: 400 });
    }

    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Invalid JSON in data field" }, { status: 400 });
    }



    const result = StationSchema.safeParse({ ...body, status: "active" });
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Reject an exact duplicate (same name + mobile) so an accidental re-submit
    // can't create a second copy. Query a single field (auto-indexed) and match
    // the mobile in memory to avoid needing a composite index.
    const dupSnap = await adminDb
      .collection("stations")
      .where("stationName", "==", result.data.stationName)
      .get();
    if (dupSnap.docs.some(d => d.data().mobileNumber === result.data.mobileNumber)) {
      return NextResponse.json(
        { error: `A station named "${result.data.stationName}" with this mobile number already exists` },
        { status: 409 }
      );
    }

    const imageUrls = await pushImagesToStorage(formData, user);

    // SEO slug for the public URL (/stations/sivan-auto-gas-neelambur-coimbatore
    // rather than the opaque document id). Generated once, here, and then frozen:
    // the admin can rewrite it deliberately, but renaming a station must not
    // silently change a URL that search engines have already indexed.
    const slug = await uniqueStationSlug(stationSlug(result.data), slugTaken);

    const docData = {
      ...result.data,
      slug,
      images: imageUrls,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: user.uid,
    };

    const id = (await adminDb.collection("stations").add(docData)).id;

    if (imageUrls.length > 0) {
      const batch = adminDb.batch()

      imageUrls.forEach((url: string) => {
        const imageRef = adminDb.collection("stationImages").doc()
        batch.set(imageRef, {
          url,
          stationId: id,
          createdAt: FieldValue.serverTimestamp(),
          createdBy: user.uid,
        })
      })

      await batch.commit()
    }

    return NextResponse.json(
      { success: true, data: { id, ...docData } },
      { status: 201 }
    );

  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}


// True when another station already owns this slug. `exceptId` lets an update
// keep its own slug without colliding with itself.
export const slugTakenBy = async (candidate: string, exceptId?: string): Promise<boolean> => {
  const snap = await adminDb.collection("stations").where("slug", "==", candidate).get();
  return snap.docs.some((d) => d.id !== exceptId);
};

const slugTaken = (candidate: string) => slugTakenBy(candidate);

export const pushImagesToStorage = async (
  formData: FormData,
  user: DecodedIdToken | null
): Promise<string[]> => {
  const imageFiles = formData.getAll("images") as File[]
  const bucket = adminStorage.bucket(process.env.FIREBASE_STORAGE_BUCKET)

  // Validate up front so a bad file fails fast before any upload starts.
  for (const file of imageFiles) {
    if (!file.type.startsWith("image/")) {
      throw new AppError("Invalid file format", 400)
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new AppError(`File too large: ${file.name} (max 5MB)`, 400);
    }
  }

  // Upload concurrently — sequential awaits made multi-image uploads N× slower.
  // Promise.all preserves input order, so imageUrls matches the file order.
  const imageUrls = await Promise.all(
    imageFiles.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split(".").pop()
      const fileName = `stations/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const fileRef = bucket.file(fileName)

      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
          metadata: { uploadedBy: user?.uid }
        }
      })

      // Buckets with Uniform Bucket-Level Access (UBLA) reject per-object ACLs, so
      // makePublic() throws "Cannot update access control … when uniform bucket-level
      // access is enabled". Treat it as non-fatal — the object is served publicly via
      // bucket IAM instead (see HANDOFF.md: make the bucket/prefix public once).
      try {
        await fileRef.makePublic()
      } catch (e: any) {
        if (!/uniform bucket-level access/i.test(e?.message ?? "")) {
          console.error("makePublic failed (non-fatal):", e?.message)
        }
      }

      return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    })
  );

  return imageUrls;
}


