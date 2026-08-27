import { z } from "zod"

const StationAddressSchema = z.object({
  doorNo: z.string().optional().default(""),
  street: z.string().optional().default(""),
  pincode: z.coerce.number().int().min(100000).max(999999).optional().or(z.literal("")),
})

const StationLocationSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

// Mobile numbers reach us in many shapes — "+91 98421 00000", "098421 00000",
// "(0451) 98421-00000" — and the admin form's own placeholder coaches the
// "+91 …" style. Strip non-digits, then drop a leading 91/0 country/trunk prefix
// when a bare 10-digit subscriber number remains, and validate that. This stores
// a single canonical 10-digit value instead of 400-ing on cosmetic formatting.
const MobileNumberSchema = z.preprocess(
  (v) =>
    typeof v === "string"
      ? v.replace(/\D/g, "").replace(/^(?:91|0)(?=\d{10}$)/, "")
      : v,
  z.string().regex(/^\d{10}$/, "Invalid mobile number")
);

export const StationSchema = z.object({
  district: z.string().min(1, "District is required"),
  area: z.string().min(1, "Area is required"),
  stationName: z.string().min(2, "Station name is required"),
  contactPerson: z.string().min(2, "Contact person is required"),
  mobileNumber: MobileNumberSchema,
  telephone: z.string().optional().default(""),
  workingHours: z.string().optional(),
  // Station has no operating timings — hides working hours everywhere it's shown.
  timingDisabled: z.coerce.boolean().optional().default(false),
  emailID: z.string().email("Invalid email").optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).default("active"),
  // Google-Maps directions link entered in the admin form. The user site reads it
  // (StationsExplorer + detail "Get Directions") and normalizeStation maps d.mapLink,
  // so it must be persisted on write rather than stripped by the schema.
  mapLink: z.string().optional().default(""),
  address: StationAddressSchema.optional().default({doorNo:"",street:"",pincode:""}),
  location: StationLocationSchema,
});

export const StationPatchSchema = z.object({
  district: z.string().min(1).optional(),
  area: z.string().min(1).optional(),
  stationName: z.string().min(2).optional(),
  contactPerson: z.string().min(2).optional(),
  // Optional like every other patch field — a partial update that doesn't touch
  // the phone number must not be forced to re-send (and re-pass) it.
  mobileNumber: MobileNumberSchema.optional(),
  telephone: z.string().optional(),
  emailID: z.string().email().optional().or(z.literal("")),
  workingHours: z.string().optional(),
  timingDisabled: z.coerce.boolean().optional(),
  mapLink: z.string().optional(),
  address: StationAddressSchema.optional(),
  status: z.string().optional(),
  location: StationLocationSchema.partial().optional(),
  primaryImage: z.string().optional(),
  // Deliberate URL override. Slugs are generated once at creation and then
  // frozen (renaming a station must not silently move an indexed URL), so this
  // only changes when an admin edits it on purpose. Constrained to the same
  // shape the generator produces; the server still de-duplicates it.
  slug: z
    .string()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens")
    .optional(),
});

export const StationRowSchema = z.object({
  district: z.string().min(1, "district is required"),
  area: z.string().min(1, "area is required"),
  stationName: z.string().min(1, "stationName is required"),
  contactPerson: z.string().min(1, "contactPerson is required"),
  mobileNumber: MobileNumberSchema,
  telephone: z.string().optional().default(""),
  emailID: z.string().email("invalid emailID").optional().or(z.literal("")).default(""),
  doorNo: z.string().optional().default(""),
  workingHours: z.string(),
  street: z.string().optional().default(""),
  status: z.enum(["active", "inactive"]).default("active"),
  pincode: z.coerce.number({ error: "pincode must be a number" }),
  latitude: z.coerce.number({ error: "latitude must be a number" }),
  longitude: z.coerce.number({ error: "longitude must be a number" }),
});

export const ExcelUploadStationSchema = z.array(StationRowSchema).min(1, "Excel file has no data rows")
