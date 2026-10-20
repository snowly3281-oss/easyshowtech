/**
 * Fully restore the 6 solutions' packages to the original state (from the
 * first _inspect-solutions-2.mjs output) plus wire in the 7 sample products.
 * Uses the original values that were present before the corrupted patches.
 *
 * Rebuilds the complete packages[] array including tier, title, isRecommended,
 * priceDisplay, areaMinSqm, areaMaxSqm, areaMinSqFt, areaMaxSqFt,
 * equipmentTotalMin, equipmentTotalMax, items[].product/.quantity/.unit/.variantNote
 * based on the known-good initial data.
 *
 * Run:
 *   node studio/scripts/restore-solutions.mjs              # dry-run
 *   node studio/scripts/restore-solutions.mjs --write      # write
 */
import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WRITE = process.argv.includes("--write");

function loadEnv() {
  let dir = __dirname;
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, ".env");
    if (fs.existsSync(candidate)) {
      for (const line of fs.readFileSync(candidate, "utf8").split("\n")) {
        const m = line.match(/^([^=]+)=(.*)$/);
        if (m) process.env[m[1].trim()] = m[2].trim();
      }
      return;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
}
loadEnv();

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID ?? "w8rk6k6z";
const dataset = process.env.PUBLIC_SANITY_DATASET ?? "production";
const apiVersion = process.env.SANITY_API_VERSION ?? "2024-10-01";
const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token && WRITE) { console.error("No token"); process.exit(1); }
const client = token
  ? createClient({ projectId, dataset, apiVersion, token, useCdn: false })
  : null;

// ── Mapping: solution → tier → product SKU ───────────────────────────────────
const SOLUTION_PRODUCT_MAP = {
  "solution.boutique-studio": { compact: "es-bd-001", recommended: "es-bd-001", expanded: "es-pw-001" },
  "solution.franchise":       { compact: "es-bd-001", recommended: "es-pw-001", expanded: "es-fs-001" },
  "solution.home-pt":         { compact: "es-pw-001", recommended: "es-fs-001", expanded: "es-fs-001" },
  "solution.hotel-spa":       { compact: "es-pw-001", recommended: "es-sd-001", expanded: "es-sd-001" },
  "solution.rehab-clinic":    { compact: "es-bd-001", recommended: "es-bd-001", expanded: "es-pw-001" },
  "solution.training-academy": { compact: "es-pw-001", recommended: "es-sd-001", expanded: "es-ch-001" },
};

function pid(sku) { return `product.${sku}`; }

// ── Known-good original data from first _inspect-solutions-2.mjs run ─────────────
// Extracted from the initial read of packages before any patches were applied.
const ORIGINAL_PACKAGES = {
  "solution.boutique-studio": [
    {
      _key: "pkg-boutique-studio-compact",
      title: "Compact",
      tier: "compact",
      isRecommended: false,
      summary: null,
      priceDisplay: "quote",
      areaMinSqm: 40, areaMaxSqm: 80,
      areaMinSqFt: 430, areaMaxSqFt: 860,
      equipmentTotalMin: 2, equipmentTotalMax: 3,
      item_key: "wedding-c1",
      item_variantNote: "Primary backdrop for ceremony wall",
    },
    {
      _key: "pkg-boutique-studio-recommended",
      title: "Recommended",
      tier: "recommended",
      isRecommended: true,
      summary: null,
      priceDisplay: "range",
      areaMinSqm: 80, areaMaxSqm: 150,
      areaMinSqFt: 860, areaMaxSqFt: 1615,
      equipmentTotalMin: 3, equipmentTotalMax: 5,
      item_key: "wedding-r1",
      item_variantNote: "Main + secondary backdrop",
    },
    {
      _key: "pkg-boutique-studio-expanded",
      title: "Expanded",
      tier: "expanded",
      isRecommended: false,
      summary: null,
      priceDisplay: "quote",
      areaMinSqm: 150, areaMaxSqm: 400,
      areaMinSqFt: 1615, areaMaxSqFt: 4305,
      equipmentTotalMin: 5, equipmentTotalMax: 9,
      item_key: "wedding-e1",
      item_variantNote: "Multiple branded zones + accessories",
    },
  ],

  "solution.franchise": [
    {
      _key: "pkg-franchise-compact",
      title: "Compact",
      tier: "compact",
      isRecommended: false,
      summary: null,
      priceDisplay: "quote",
      areaMinSqm: 9, areaMaxSqm: 20,
      areaMinSqFt: 100, areaMaxSqFt: 215,
      equipmentTotalMin: 1, equipmentTotalMax: 2,
      item_key: "events-c1",
      item_variantNote: "Single 10ft backdrop kit + case",
    },
    {
      _key: "pkg-franchise-recommended",
      title: "Recommended",
      tier: "recommended",
      isRecommended: true,
      summary: null,
      priceDisplay: "range",
      areaMinSqm: 18, areaMaxSqm: 40,
      areaMinSqFt: 200, areaMaxSqFt: 430,
      equipmentTotalMin: 2, equipmentTotalMax: 4,
      item_key: "events-r1",
      item_variantNote: "Main backdrop + side feature wall",
    },
    {
      _key: "pkg-franchise-expanded",
      title: "Expanded",
      tier: "expanded",
      isRecommended: false,
      summary: null,
      priceDisplay: "quote",
      areaMinSqm: 40, areaMaxSqm: 120,
      areaMinSqFt: 430, areaMaxSqFt: 1290,
      equipmentTotalMin: 4, equipmentTotalMax: 8,
      item_key: "events-e1",
      item_variantNote: "Island kit with 4 backdrop zones + accessories",
    },
  ],

  "solution.home-pt": [
    {
      _key: "pkg-home-pt-compact",
      title: "Compact",
      tier: "compact",
      isRecommended: false,
      summary: null,
      priceDisplay: "quote",
      areaMinSqm: 25, areaMaxSqm: 60,
      areaMinSqFt: 270, areaMaxSqFt: 645,
      equipmentTotalMin: 1, equipmentTotalMax: 2,
      item_key: "community-c1",
      item_variantNote: "8×8 backdrop for small chapel",
    },
    {
      _key: "pkg-home-pt-recommended",
      title: "Recommended",
      tier: "recommended",
      isRecommended: true,
      summary: null,
      priceDisplay: "range",
      areaMinSqm: 60, areaMaxSqm: 180,
      areaMinSqFt: 645, areaMaxSqFt: 1940,
      equipmentTotalMin: 2, equipmentTotalMax: 4,
      item_key: "community-r1",
      item_variantNote: "Main + side backdrop with rotating graphics",
    },
    {
      _key: "pkg-home-pt-expanded",
      title: "Expanded",
      tier: "expanded",
      isRecommended: false,
      summary: null,
      priceDisplay: "quote",
      areaMinSqm: 180, areaMaxSqm: 500,
      areaMinSqFt: 1940, areaMaxSqFt: 5380,
      equipmentTotalMin: 4, equipmentTotalMax: 8,
      item_key: "community-e1",
      item_variantNote: "Multi-zone kit with rotating graphics set",
    },
  ],

  "solution.hotel-spa": [
    {
      _key: "pkg-hotel-spa-compact",
      title: "Compact",
      tier: "compact",
      isRecommended: false,
      summary: null,
      priceDisplay: "quote",
      areaMinSqm: 30, areaMaxSqm: 60,
      areaMinSqFt: 325, areaMaxSqFt: 645,
      equipmentTotalMin: 2, equipmentTotalMax: 3,
      item_key: "retail-c1",
      item_variantNote: "Feature wall for pop-up",
    },
    {
      _key: "pkg-hotel-spa-recommended",
      title: "Recommended",
      tier: "recommended",
      isRecommended: true,
      summary: null,
      priceDisplay: "range",
      areaMinSqm: 60, areaMaxSqm: 150,
      areaMinSqFt: 645, areaMaxSqFt: 1615,
      equipmentTotalMin: 3, equipmentTotalMax: 6,
      item_key: "retail-r1",
      item_variantNote: "Window + feature wall + secondary zone",
    },
    {
      _key: "pkg-hotel-spa-expanded",
      title: "Expanded",
      tier: "expanded",
      isRecommended: false,
      summary: null,
      priceDisplay: "quote",
      areaMinSqm: 150, areaMaxSqm: 400,
      areaMinSqFt: 1615, areaMaxSqFt: 4305,
      equipmentTotalMin: 6, equipmentTotalMax: 12,
      item_key: "retail-e1",
      item_variantNote: "Full flagship roll-out",
    },
  ],

  "solution.rehab-clinic": [
    {
      _key: "pkg-rehab-clinic-compact",
      title: "Compact",
      tier: "compact",
      isRecommended: false,
      summary: null,
      priceDisplay: "quote",
      areaMinSqm: 12, areaMaxSqm: 25,
      areaMinSqFt: 130, areaMaxSqFt: 270,
      equipmentTotalMin: 1, equipmentTotalMax: 2,
      item_key: "photo-c1",
      item_variantNote: "8×8 backdrop for headshot work",
    },
    {
      _key: "pkg-rehab-clinic-recommended",
      title: "Recommended",
      tier: "recommended",
      isRecommended: true,
      summary: null,
      priceDisplay: "range",
      areaMinSqm: 25, areaMaxSqm: 60,
      areaMinSqFt: 270, areaMaxSqFt: 645,
      equipmentTotalMin: 2, equipmentTotalMax: 4,
      item_key: "photo-r1",
      item_variantNote: "10×10 main + 8×8 secondary",
    },
    {
      _key: "pkg-rehab-clinic-expanded",
      title: "Expanded",
      tier: "expanded",
      isRecommended: false,
      summary: null,
      priceDisplay: "quote",
      areaMinSqm: 60, areaMaxSqm: 200,
      areaMinSqFt: 645, areaMaxSqFt: 2150,
      equipmentTotalMin: 4, equipmentTotalMax: 9,
      item_key: "photo-e1",
      item_variantNote: "Multiple backdrop zones + lighting support",
    },
  ],

  "solution.training-academy": [
    {
      _key: "pkg-training-academy-compact",
      title: "Compact",
      tier: "compact",
      isRecommended: false,
      summary: null,
      priceDisplay: "quote",
      areaMinSqm: 15, areaMaxSqm: 35,
      areaMinSqFt: 160, areaMaxSqFt: 375,
      equipmentTotalMin: 1, equipmentTotalMax: 2,
      item_key: "edu-c1",
      item_variantNote: "8×8 backdrop for small seminar",
    },
    {
      _key: "pkg-training-academy-recommended",
      title: "Recommended",
      tier: "recommended",
      isRecommended: true,
      summary: null,
      priceDisplay: "range",
      areaMinSqm: 35, areaMaxSqm: 90,
      areaMinSqFt: 375, areaMaxSqFt: 970,
      equipmentTotalMin: 2, equipmentTotalMax: 4,
      item_key: "edu-r1",
      item_variantNote: "Front backdrop + side zone",
    },
    {
      _key: "pkg-training-academy-expanded",
      title: "Expanded",
      tier: "expanded",
      isRecommended: false,
      summary: null,
      priceDisplay: "quote",
      areaMinSqm: 90, areaMaxSqm: 400,
      areaMinSqFt: 970, areaMaxSqFt: 4305,
      equipmentTotalMin: 4, equipmentTotalMax: 10,
      item_key: "edu-e1",
      item_variantNote: "Multi-room kit with shared brand set",
    },
  ],
};

// ── Build the complete packages array for each solution ────────────────────────
function buildPackages(solId) {
  const originals = ORIGINAL_PACKAGES[solId];
  const mapping = SOLUTION_PRODUCT_MAP[solId];
  if (!originals || !mapping) return null;

  return originals.map((pkg) => ({
    _key: pkg._key,
    title: pkg.title,
    tier: pkg.tier,
    isRecommended: pkg.isRecommended,
    summary: pkg.summary,
    priceDisplay: pkg.priceDisplay,
    areaMinSqm: pkg.areaMinSqm,
    areaMaxSqm: pkg.areaMaxSqm,
    areaMinSqFt: pkg.areaMinSqFt,
    areaMaxSqFt: pkg.areaMaxSqFt,
    equipmentTotalMin: pkg.equipmentTotalMin,
    equipmentTotalMax: pkg.equipmentTotalMax,
    items: [
      {
        _key: pkg.item_key,
        product: { _type: "reference", _ref: pid(mapping[pkg.tier]) },
        quantity: 1,
        unit: "unit",
        variantNote: pkg.item_variantNote,
      },
    ],
  }));
}

// ── Plan ────────────────────────────────────────────────────────────────────
const SOLUTION_IDS = Object.keys(ORIGINAL_PACKAGES);

console.log("\n🔧 RESTORE SOLUTIONS\n");
console.log(`   Mode: ${WRITE ? "⚠️  WRITE" : "DRY-RUN"}\n`);

if (client) {
  const sols = await client.fetch(
    `*[_type == "solution" && _id in $ids]{ _id, _rev, title, "slug": slug.current }`,
    { ids: SOLUTION_IDS },
  );

  const solById = new Map(sols.map((s) => [s._id, s]));
  let ok = 0;
  for (const solId of SOLUTION_IDS) {
    const sol = solById.get(solId);
    if (!sol) { console.error(`   ✗ ${solId}: not found`); continue; }
    const packages = buildPackages(solId);
    if (!packages) { console.error(`   ✗ ${solId}: no package plan`); continue; }
    console.log(`   ✓ ${solId} (/${sol.slug}) "${sol.title}" — ${packages.length} packages`);
    for (const pkg of packages) {
      const sku = pkg.items[0].product._ref.replace("product.", "");
      console.log(
        `       [${pkg.tier}] "${pkg.title}" rec=${pkg.isRecommended} → ${sku}`,
      );
    }
    if (WRITE) {
      await client
        .patch(sol._id)
        .ifRevisionId(sol._rev)
        .set({ packages })
        .commit();
      ok++;
      console.log(`       ✓ Patched`);
    }
  }
  if (WRITE) console.log(`\n✅ Restored ${ok} solutions.\n`);
  else console.log(`\n🟡 Dry-run complete.\n`);
}
