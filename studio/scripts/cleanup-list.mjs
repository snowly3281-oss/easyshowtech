/**
 * List old Pilates-era series and services that are no longer used.
 *
 * Run:
 *   node studio/scripts/cleanup-list.mjs
 *
 * This is READ-ONLY. Use cleanup-delete.mjs after review.
 */
import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
if (!token) {
  console.error("Missing SANITY_API_WRITE_TOKEN. Set it in studio/.env");
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion, token });

// ── Canonical slugs to keep (new display-equipment) ──────────────────────────
const KEEP_SERIES_SLUGS = new Set([
  "aluminum-tent",
  "steel-tent",
  "popup-walls",
  "backdrops",
  "flags-system",
  "sign-display",
  "chairs",
]);

const KEEP_SERVICE_SLUGS = new Set([
  "custom-fabric-printing",
  "dye-sublimation-printing",
  "custom-logo-printing",
  "large-format-printing",
  "artwork-design-setup",
]);

// ── List series ──────────────────────────────────────────────────────────────
async function listSeries() {
  const all = await client.fetch(`
    *[_type == "series"]{ _id, "slug": slug.current, title, sortOrder, isActive }
    | order(_id asc)
  `);
  const keep = [];
  const drop = [];
  for (const s of all) {
    if (KEEP_SERIES_SLUGS.has(s.slug)) keep.push(s);
    else drop.push(s);
  }
  return { keep, drop, all };
}

// ── List services ────────────────────────────────────────────────────────────
async function listServices() {
  const all = await client.fetch(`
    *[_type == "service"]{ _id, "slug": slug.current, title, sortOrder, isActive }
    | order(_id asc)
  `);
  const keep = [];
  const drop = [];
  for (const s of all) {
    if (KEEP_SERVICE_SLUGS.has(s.slug)) keep.push(s);
    else drop.push(s);
  }
  return { keep, drop, all };
}

// ── Safety: any product references to a drop-list slug? ─────────────────────
async function findReferences() {
  const seriesRefs = await client.fetch(`
    *[_type == "product" && defined(series._ref) && status == "published"]{
      _id, title, "seriesSlug": series->slug.current
    }
  `);
  const productServiceRefs = await client.fetch(`
    *[_type == "product" && count(printingServices) > 0]{
      _id, title, "serviceSlugs": printingServices[]->slug.current
    }
  `);
  return { seriesRefs, productServiceRefs };
}

async function main() {
  console.log("\n🧹 CLEANUP LISTING (read-only)\n");

  const [series, services, refs] = await Promise.all([
    listSeries(),
    listServices(),
    findReferences(),
  ]);

  console.log(`─── SERIES: ${series.all.length} total ───`);
  console.log(`   KEEP:  ${series.keep.length}`);
  for (const s of series.keep) {
    const flag = s.isActive === false ? " ⚠️  isActive=false" : "";
    console.log(`   ✓ ${s._id}  /${s.slug}${flag}`);
  }
  console.log(`\n   DROP:  ${series.drop.length}`);
  for (const s of series.drop) {
    const flag = s.isActive === false ? " (already inactive)" : "";
    console.log(`   ✗ ${s._id}  /${s.slug}${flag}`);
  }

  console.log(`\n─── SERVICES: ${services.all.length} total ───`);
  console.log(`   KEEP:  ${services.keep.length}`);
  for (const s of services.keep) {
    const flag = s.isActive === false ? " ⚠️  isActive=false" : "";
    console.log(`   ✓ ${s._id}  /${s.slug}${flag}`);
  }
  console.log(`\n   DROP:  ${services.drop.length}`);
  for (const s of services.drop.slice(0, 40)) {
    const flag = s.isActive === false ? " (inactive)" : "";
    console.log(`   ✗ ${s._id}  /${s.slug}${flag}`);
  }
  if (services.drop.length > 40) {
    console.log(`   ... and ${services.drop.length - 40} more`);
  }

  // Reference safety check
  console.log(`\n─── REFERENCE CHECK ───`);
  const dropSeriesSlugs = new Set(series.drop.map((s) => s.slug));
  const dropServiceSlugs = new Set(services.drop.map((s) => s.slug));

  const usedSeriesDrops = new Set();
  for (const p of refs.seriesRefs) {
    if (dropSeriesSlugs.has(p.seriesSlug)) usedSeriesDrops.add(p.seriesSlug);
  }
  const usedServiceDrops = new Set();
  for (const p of refs.productServiceRefs) {
    for (const slug of p.serviceSlugs ?? []) {
      if (dropServiceSlugs.has(slug)) usedServiceDrops.add(slug);
    }
  }

  if (usedSeriesDrops.size === 0) {
    console.log("   ✓ No active products reference any drop-list series.");
  } else {
    console.log(`   ⚠️  Active products reference ${usedSeriesDrops.size} drop-list series:`);
    for (const slug of usedSeriesDrops) console.log(`     - ${slug}`);
  }
  if (usedServiceDrops.size === 0) {
    console.log("   ✓ No active products reference any drop-list service.");
  } else {
    console.log(`   ⚠️  Active products reference ${usedServiceDrops.size} drop-list services:`);
    for (const slug of usedServiceDrops) console.log(`     - ${slug}`);
  }

  console.log(`\n─── ACTIVE PRODUCTS ───`);
  console.log(`   ${refs.seriesRefs.length} products with a series reference.`);
  console.log(`   ${refs.productServiceRefs.length} products with printing services.\n`);

  if (usedSeriesDrops.size > 0 || usedServiceDrops.size > 0) {
    console.log("⚠️  CAUTION: Some drop-list docs are still referenced.");
    console.log("   Run cleanup-delete.mjs only after re-pointing those references.\n");
  } else {
    console.log("✅ Safe to delete. Run cleanup-delete.mjs to remove drop-list docs.\n");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
