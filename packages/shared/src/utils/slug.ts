// URL slugs for station detail pages.
//
// Stations used to be addressed by their raw Firestore document id
// (/stations/2b4w1BXnMFdatxip8bP4), which carries no keywords and reads as
// noise to both search engines and people. A slug built from the station's own
// name and location gives a descriptive, stable URL instead:
//
//   Sivan Auto Gas / Neelambur / Coimbatore  ->  sivan-auto-gas-neelambur-coimbatore

/** Lowercase, strip accents, collapse everything non-alphanumeric to single hyphens. */
export function slugify(input: string): string {
    return (input ?? "")
        .normalize("NFKD")            // split accented chars into base + combining mark
        .replace(/[\u0300-\u036f]/g, "") // drop the combining marks
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-{2,}/g, "-");
}

/**
 * Build a station slug from its name, area and district.
 *
 * Area/district are appended only when they aren't already spelled out in the
 * preceding text, so a station literally named "Sivan Auto Gas Neelambur" does
 * not become "...-neelambur-neelambur-coimbatore". Comparison is done on
 * hyphenated token boundaries, so "coimbatore" won't match inside a longer word.
 */
export function stationSlug(station: {
    stationName?: string;
    area?: string;
    district?: string;
}): string {
    const parts: string[] = [];

    for (const raw of [station.stationName, station.area, station.district]) {
        const piece = slugify(raw ?? "");
        if (!piece) continue;
        const sofar = parts.join("-");
        // Skip a piece already contained in what we've built (token-aligned).
        if (sofar && (sofar === piece || sofar.startsWith(`${piece}-`) ||
            sofar.endsWith(`-${piece}`) || sofar.includes(`-${piece}-`))) continue;
        parts.push(piece);
    }

    return parts.join("-");
}

/** True for a slug we generated, false for a raw Firestore document id. */
export function looksLikeSlug(value: string): boolean {
    // Firestore auto-ids are 20 chars of mixed-case alphanumerics with no hyphen.
    // Anything containing a hyphen, or that isn't that exact shape, is a slug.
    return value.includes("-") || !/^[A-Za-z0-9]{20}$/.test(value);
}

/**
 * Append -2, -3, … until the slug is unique. `taken` reports whether a candidate
 * is already used by a DIFFERENT station.
 */
export async function uniqueStationSlug(
    base: string,
    taken: (candidate: string) => Promise<boolean>,
): Promise<string> {
    const root = base || "station";
    if (!(await taken(root))) return root;
    for (let n = 2; n < 100; n++) {
        const candidate = `${root}-${n}`;
        if (!(await taken(candidate))) return candidate;
    }
    // Pathological fallback — 99 identically-named stations in one area.
    return `${root}-${Date.now()}`;
}
