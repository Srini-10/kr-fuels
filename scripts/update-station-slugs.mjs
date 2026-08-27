#!/usr/bin/env node
/**
 * Update station URL slugs in Firestore and preserve previous slugs in legacySlugs.
 *
 * Usage:
 *   node scripts/update-station-slugs.mjs          # dry run, prints the plan
 *   node scripts/update-station-slugs.mjs --apply  # commits the updates to Firestore
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const APPLY = process.argv.includes("--apply");

function loadEnv(path) {
  const out = {};
  let text;
  try { text = readFileSync(path, "utf8"); }
  catch { throw new Error(`Cannot read ${path} — run this from the repo root.`); }
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

const env = loadEnv(resolve(REPO, "apps/backend/.env.local"));

const require = createRequire(resolve(REPO, "apps/backend/package.json"));
const { cert, initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp({
  credential: cert({
    projectId: env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: (env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  }),
});
const db = env.FIREBASE_DB ? getFirestore(env.FIREBASE_DB) : getFirestore();

// Explicit mapping for the 10 stations to ensure exact match with requirements
const TARGET_CORRECTIONS = {
  // 1. KR Trans Fuels Pasumalai Madurai
  "0MFGG6vrtcLRW9Zh1CVJ": "kr-trans-fuels-private-limited-pasumalai-madurai",
  // 2. KR Trans Fuels Madurai Sivagangai Road
  "2bN3dfbqRwMfE49UNgkc": "kr-trans-fuels-private-limited-madurai-sivagangai-road",
  // 3. KR Trans Fuels Salem Bangalore Bypass Road
  "6fDhPdcSixlFxsuR6P6I": "kr-trans-fuels-private-limited-salem-bangalore-bypass-road",
  // 4. KR Trans Fuels Devakottai Sivagangai
  "FdBzRmQEAt1gHvzIxR4D": "kr-trans-fuels-private-limited-devakottai-sivagangai",
  // 5. KR Trans Fuels Kattupakkam Chennai
  "UhQFUc3D1Kr9Hy4pe5GK": "kr-trans-fuels-private-limited-kattupakkam-chennai",
  // 6. KR Trans Fuels TVS Tolgate Tiruchirappalli
  "k8UsptEIqBEsUW4KWNKe": "kr-trans-fuels-private-limited-tvs-tolgate-tiruchirappalli",
  // 7. KR Trans Fuels Kanchipuram Road Chengalpattu
  "qLrxEoIjz2DP9CTPqjWt": "kr-trans-fuels-private-limited-kanchipuram-road-chengalpattu",
  // 8. KR Trans Fuels New Bus Stand Thanjavur
  "tsMkrURQpNEXvb5ATy93": "kr-trans-fuels-private-limited-new-bus-stand-thanjavur",
  // 9. KR Trans Fuels Velachery Chennai
  "uQaKw6lUgtbpuJqzSzPa": "kr-trans-fuels-private-limited-velachery-chennai",
  // 10. T.V. Kovil Tiruchirappalli
  "v0L9sdg3avehtha5LyIq": "kr-fuels-tv-kovil-tiruchirappalli",
};

const snap = await db.collection("stations").get();
console.log(`Found ${snap.size} total stations in database.\n`);

const plan = [];

for (const doc of snap.docs) {
  const data = doc.data();
  const targetSlug = TARGET_CORRECTIONS[doc.id];
  if (!targetSlug) continue;

  if (data.slug === targetSlug) {
    console.log(`[ALREADY UP TO DATE] ${doc.id}: ${data.stationName} -> ${data.slug}`);
    continue;
  }

  plan.push({
    id: doc.id,
    stationName: data.stationName,
    currentSlug: data.slug,
    newSlug: targetSlug,
    existingLegacySlugs: data.legacySlugs || [],
  });
}

console.log(`Stations to update: ${plan.length}\n`);

for (const p of plan) {
  console.log(`Station: "${p.stationName}" (ID: ${p.id})`);
  console.log(`  OLD: /stations/${p.currentSlug}`);
  console.log(`  NEW: /stations/${p.newSlug}`);
  console.log(`  legacySlugs will include: "${p.currentSlug}"\n`);
}

if (!APPLY) {
  console.log("DRY RUN — nothing written. Run with --apply to commit changes.");
  process.exit(0);
}

const batch = db.batch();
for (const p of plan) {
  const docRef = db.collection("stations").doc(p.id);
  const updates = {
    slug: p.newSlug,
    legacySlugs: FieldValue.arrayUnion(p.currentSlug),
    updatedAt: FieldValue.serverTimestamp(),
  };
  batch.update(docRef, updates);
}

await batch.commit();
console.log(`Successfully committed updates for ${plan.length} stations.`);
