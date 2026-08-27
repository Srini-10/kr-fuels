import { StationRowSchema } from "../validators/station.schema";
import z from "zod";

export interface StationAddress {
    doorNo?: string;
    street?: string;
    pincode: string;
}

export interface StationLocation {
    latitude: number;
    longitude: number;
}

export interface Station {
    id?: string;
    // SEO URL segment for the public station page, e.g.
    // "sivan-auto-gas-neelambur-coimbatore". Written once when the station is
    // created and then left alone so indexed URLs stay put; optional because
    // stations created before slugs existed are backfilled separately.
    slug?: string;
    district: string;
    area: string;
    stationName: string;
    contactPerson: string;
    mobileNumber: string;
    telephone?: string;
    emailID?: string;
    address: StationAddress;
    status: "active" | "inactive";
    workingHours:string,
    // When true, the station has no operating timings: the admin form hides the
    // working-hours picker and the user site / mobile app render no timing for it
    // (matches the live site, where stations show no working hours). Optional so
    // legacy docs written before this field still parse.
    timingDisabled?: boolean,
    images?:string[],
    primaryImage?: string,
    location: StationLocation;
    // Optional Google-Maps directions link; persisted by the station write schema and
    // read by the user site. Loaded into the edit form so editing preserves it.
    mapLink?: string;
    imageCount?:number
}

export type StationRow = z.infer<typeof StationRowSchema>

// Canonical testimonial shape — matches packages/shared/src/types/index.ts, the backend
// write/read routes, the admin form, and the website carousel. (Previously this used a
// stale `review`/`imageUrl`/`date` shape that nothing wrote or read.)
export interface Testimonial {
    id?: string,
    name: string,
    designation?: string,
    company?: string,
    message: string,
    image?: string,
    rating?: number,
    isActive?: boolean,
    createdAt?: Date,
    updatedAt?: Date,
}

export interface Faq {
    id?: string,
    question: string,
    isLink:boolean
    answer: string,
    // Display order (ascending). Drives the sequence shown in the admin list and
    // on the public site. Optional so legacy docs written before this field still parse.
    order?: number,
    createdAt: Date,
    updatedAt: Date
}

export type FirestoreTimestamp = { _seconds: number; _nanoseconds: number };

export interface Feedback {
    id?: string
    name: string
    email: string
    phoneNo: string
    message: string
    category: string
    rating: number
    safetyAwareness: boolean
    stationId: string
    stationName:string,
    status: "pending" | "in-progress" | "resolved"
    createdAt?:  Date | string | FirestoreTimestamp | null
    updatedAt?:  Date | string | FirestoreTimestamp | null
}

export interface Enquiry {
    id?: string,
    name: string,
    email: string,
    // Contact-form phone number. The website form requires it and the backend has
    // always persisted it as `phone` (note: Feedback uses `phoneNo`) — it was just
    // missing from this type, so the admin drawer/list never showed it. Optional
    // so any legacy doc written without one still parses.
    phone?: string,
    message: string,
    createdAt?: Date
}

export interface AdminContactEssentials {
    companyName: string,
    emails: {
        info: string,
        support: string
    },
    phoneNos: {
        office: string,
        whatsapp: string
    },
    tagline: string,
    // HQ city/location label shown in the website header price ticker (default Tiruchirappalli).
    hqCity?: string,
    createdAt: Date,
    updatedAt: Date
}

export interface AdminContactPresents {
    address: {
        city: string,
        pincode: string,
        state: string,
        street: string
    },
    exactLocation: {
        latitude: string,
        longitude: string
    },
    socialLinks: {
        facebook: string,
        instagram: string,
        twitter: string,
        youtube: string
    },
    workingHours: Date
    createdAt: Date,
    updatedAt: Date

}

export interface Pagination {
    total: number,
    limit: number,
    page: number,
    totalPages: number,
    hasNextPage: boolean,
    hasPrevPage: boolean
}

export interface StationResponse {
    data: Station[],
    meta: Pagination,
    stats: {
        active: number,
        // City (district) options for the filter — ACTIVE stations only, matching the
        // mobile app's station-locator dropdowns exactly.
        districts: string[],
        // All distinct station areas (sorted) for the admin area filter, plus the
        // areas grouped by their district so the area dropdown can cascade from the
        // selected city. Both active-only, sourced from the same station data the
        // mobile app's locator consumes.
        areas: string[],
        areasByDistrict: Record<string, string[]>,
        // Every distinct district across ALL stations (active + inactive) — used by
        // the add/edit form's district picker and the "Districts Covered" stat.
        allDistricts: string[],
        inactive: number,
        totalDistricts: number
    }
}

export interface FaqResponse{
    data: Faq[],
    meta:Pagination
}

export interface EnquiryResponse{
    data:Enquiry[],
    meta:Pagination
}

export interface FeedbackResponse{
    data: Feedback[],
    meta:Pagination
}
export interface AdminContactResponse{
    essentials:AdminContactEssentials,
    presents:AdminContactPresents
}