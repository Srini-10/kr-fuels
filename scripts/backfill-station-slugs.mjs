#!/usr/bin/env node
/**
 * One-off: give every existing station an SEO slug.
 *
 * Stations created before slugs existed are addressed by their raw Firestore id
 * (/stations/2b4w1BXnMFdatxip8bP4). This writes a `slug` field derived from
 * stationName + area + district so they move to readable URLs. Stations that
 * already have a slug are left ALONE — slugs are frozen once set, because
 * changing a live URL throws away whatever ranking it has accumulated.
 *
 * Run from the repo root ON THE SERVER (it needs apps/backend/.env.local):
 *
 *   node scripts/backfill-station-slugs.mjs           # dry run, prints the plan
 *   node scripts/backfill-station-slugs.mjs --apply   # actually writes
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const APPLY = process.argv.includes("--apply");

// --- minimal .env.local reader (no dotenv dependency required) --------------
function loadEnv(path) {
  const out = {};
  let text;
  try { text = readFileSync(path, "utf8"); }
  catch { throw new Error(`Cannot read ${path} — run this on the server, from the repo root.`); }
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

// --- slug helpers: kept identical to packages/shared/src/utils/slug.ts ------
const slugify = (input) =>
  (input ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

function stationSlug(s) {
  const parts = [];
  for (const raw of [s.stationName, s.area, s.district]) {
    const piece = slugify(raw ?? "");
    if (!piece) continue;
    const sofar = parts.join("-");
    if (sofar && (sofar === piece || sofar.startsWith(`${piece}-`) ||
      sofar.endsWith(`-${piece}`) || sofar.includes(`-${piece}-`))) continue;
    parts.push(piece);
  }
  return parts.join("-");
}

// --- go ---------------------------------------------------------------------
// This is a pnpm workspace: firebase-admin is a dependency of apps/backend, not
// of the repo root, and ESM resolves bare specifiers relative to THIS file.
// Resolve from the backend package instead so the script runs from anywhere.
const require = createRequire(resolve(REPO, "apps/backend/package.json"));
const { cert, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp({
  credential: cert({
    projectId: env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: (env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  }),
});
const db = env.FIREBASE_DB ? getFirestore(env.FIREBASE_DB) : getFirestore();

const snap = await db.collection("stations").get();
console.log(`stations: ${snap.size}`);

// Seed with slugs that already exist so the backfill never collides with them.
const used = new Set();
for (const d of snap.docs) { const s = d.data().slug; if (s) used.add(s); }

const plan = [];
let skipped = 0;
for (const doc of snap.docs) {
  const d = doc.data();
  if (d.slug) { skipped++; continue; }

  const base = stationSlug(d) || "station";
  let slug = base;
  for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
  used.add(slug);
  plan.push({ id: doc.id, name: d.stationName ?? "(unnamed)", slug });
}

for (const p of plan) console.log(`  ${p.id}  ${p.name}\n      -> /stations/${p.slug}`);
console.log(`\nto write: ${plan.length}   already had a slug: ${skipped}`);

if (!APPLY) {
  console.log("\nDRY RUN — nothing written. Re-run with --apply to commit these.");
  process.exit(0);
}

// Firestore caps a batch at 500 writes; chunk to stay well inside it.
for (let i = 0; i < plan.length; i += 400) {
  const batch = db.batch();
  for (const p of plan.slice(i, i + 400)) {
    batch.update(db.collection("stations").doc(p.id), { slug: p.slug });
  }
  await batch.commit();
  console.log(`committed ${Math.min(i + 400, plan.length)}/${plan.length}`);
}
console.log("done.");
