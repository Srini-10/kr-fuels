// @kr/shared — single source of truth for cross-app types, validators and tokens.
// NOTE: firebase client/firestore are intentionally NOT re-exported here (they are
// browser-SDK, side-effectful at import). Import them via the explicit subpaths
// "@kr/shared/firebase/client" / "@kr/shared/firebase/firestore" instead.

export * from "./types/index";
export * from "./types/dust";
export * from "./constants/colors";
export * from "./lib/utils";

export * from "./validators/station.schema";
export * from "./validators/clients.schema";
export * from "./validators/testimonial.schema";
export * from "./validators/faq.schema";
export * from "./validators/enquiry.schema";
export * from "./validators/feedback.schema";
export * from "./validators/admin-contact.schema";
export * from "./utils/slug";
