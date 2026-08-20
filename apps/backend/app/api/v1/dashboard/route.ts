import { verifySession } from "@/lib/auth/verify-session";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FEEDBACK_CATEGORIES } from "@kr/shared/validators/feedback.schema";

export const dynamic = "force-dynamic";

// Normalise Firestore Timestamp | Date | number | string → epoch ms (0 if unknown).
function toMs(value: any): number {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

// Start of the current calendar month in IST (the business timezone the admin
// UI renders dates in), returned as epoch ms.
function startOfMonthIST(nowMs: number): number {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const ist = new Date(nowMs + IST_OFFSET_MS);
  const monthStartIST = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), 1, 0, 0, 0, 0);
  return monthStartIST - IST_OFFSET_MS;
}

function normalizeStationId(stationId: any): string | null {
  if (stationId && typeof stationId === "object" && "id" in stationId) return stationId.id;
  if (typeof stationId === "string" && stationId.trim() !== "") return stationId;
  return null;
}

export async function GET(req: NextRequest) {
  const user = await verifySession(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized User" }, { status: 401 });
  }

  try {
    const categoriesList = FEEDBACK_CATEGORIES;

    const monthStartMs = startOfMonthIST(Date.now());

    // Fetch collections in parallel. product_categories is only needed as a
    // count, so use a server-side aggregation (reads 0 docs) instead of pulling
    // every category document just to call .length on it.
    const [stationsSnap, feedbacksSnap, productsSnap, productCategoriesCount, enquiriesSnap] =
      await Promise.all([
        adminDb.collection("stations").get().then((s) => s.docs),
        adminDb.collection("feedbacks").orderBy("createdAt", "desc").get().then((s) => s.docs),
        adminDb.collection("products").get().then((s) => s.docs),
        adminDb.collection("product_categories").count().get().then((s) => s.data().count),
        adminDb.collection("enquiryDetails").orderBy("createdAt", "desc").get().then((s) => s.docs),
      ]);

    // ── Feedback ───────────────────────────────────────────────
    const totalFeedback = feedbacksSnap.length;
    const avgRating = totalFeedback
      ? Number(
          feedbacksSnap.reduce((acc, doc) => acc + (doc.data().rating ?? 0), 0) / totalFeedback
        ).toFixed(2)
      : 0;

    const safetyAwarenessPercent = totalFeedback
      ? Number(
          (feedbacksSnap.filter((doc) => doc.data().safetyAwareness === true).length / totalFeedback) * 100
        ).toFixed(2)
      : 0;

    const resolutionRate = totalFeedback
      ? Number(
          (feedbacksSnap.filter((doc) => doc.data().status === "resolved").length / totalFeedback) * 100
        ).toFixed(2)
      : 0;

    const byCategory = categoriesList.map((category) => ({
      name: category,
      count: feedbacksSnap.filter((doc) => doc.data().category === category).length,
    }));

    const recentFeedback = feedbacksSnap
      .filter((doc) => doc.data().category !== "General Inquiry")
      .slice(0, 5)
      .map((doc) => {
        const data = doc.data();
        const sid = normalizeStationId(data.stationId);
        return {
          id: doc.id,
          name: data.name,
          email: data.email ? data.email : undefined,
          phone: data.phoneNo,
          category: data.category,
          rating: data.rating ? data.rating : undefined,
          status: data.status,
          stationName: sid
            ? stationsSnap.find((station) => station.id === sid)?.data().stationName ?? undefined
            : undefined,
        };
      });

    // ── Enquiries (enquiryDetails — separate from feedbacks) ───
    const enquiriesThisMonth = enquiriesSnap.filter(
      (doc) => toMs(doc.data().createdAt) >= monthStartMs
    ).length;

    const recentEnquiries = enquiriesSnap.slice(0, 5).map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        email: data.email ? data.email : undefined,
        phone: data.phone ?? data.phoneNo ?? undefined,
        category: "General Inquiry",
        message: data.message ? data.message : undefined,
        status: data.status ?? "new",
      };
    });

    // ── Products (now sourced from the live `products` collection) ─
    const productsByCategory: Record<string, number> = {};
    productsSnap.forEach((doc) => {
      const cat = doc.data().product_category ?? "Uncategorised";
      productsByCategory[cat] = (productsByCategory[cat] ?? 0) + 1;
    });

    const responseData = {
      stations: {
        total: stationsSnap.length,
        active: stationsSnap.filter((doc) => doc.data().status === "active").length,
        inactive: stationsSnap.filter((doc) => doc.data().status === "inactive").length,
      },
      feedback: {
        total: totalFeedback,
        pending: feedbacksSnap.filter((doc) => doc.data().status === "pending").length,
        inProgress: feedbacksSnap.filter((doc) => doc.data().status === "in-progress").length,
        resolved: feedbacksSnap.filter((doc) => doc.data().status === "resolved").length,
        avgRating,
        safetyAwarenessPercent,
        resolutionRate,
        byCategory,
      },
      enquiries: {
        total: enquiriesSnap.length,
        thisMonth: enquiriesThisMonth,
        new: enquiriesThisMonth,
      },
      products: {
        total: productsSnap.length,
        active: productsSnap.filter((doc) => doc.data().is_active !== false).length,
        categories: productCategoriesCount,
        byCategory: productsByCategory,
      },
      recentFeedback,
      recentEnquiries,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error: any) {
    console.error("DASHBOARD ENDPOINT ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
