/**
 * Delete old Pilates-era documents from Sanity.
 *
 * Deletes:
 *   - series whose slug is NOT in the 7 display-equipment slugs
 *   - service whose slug is NOT in the 5 printing-service slugs
 *   - product whose SKU does NOT start with "ES-" (the new SKU prefix)
 *
 * Safety:
 *   - Refuses to delete if any product's `series` reference would break
 *   - Also deletes associated draft documents (drafts.*) for the same target
 *   - Dry-run by default; --write to actually delete
 *
 * Run:
 *   node studio/scripts/cleanup-delete.mjs               # dry-run
 *   node studio/scripts/cleanup-delete.mjs --write       # actually delete
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

const WRITE = process.argv.includes("--write");
const client = createClient({ projectId, dataset, apiVersion, token });

const KEEP_SERIES_SLUGS = new Set([
  "aluminum-tent", "steel-tent", "popup-walls", "backdrops",
  "flags-system", "sign-display", "chairs",
]);

const KEEP_SERVICE_SLUGS = new Set([
  "custom-fabric-printing", "dye-sublimation-printing",
  "custom-logo-printing", "large-format-printing", "artwork-design-setup",
]);

// ── List series to drop ──────────────────────────────────────────────────────
const allSeries = await client.fetch(`
  *[_type == "series"]{ _id, "slug": slug.current }
`);
// For each published series, check if a draft also exists
const draftIds = new Set(
  (await client.fetch(`*[_id in path("drafts.**") && _type == "series"]._id`)) ?? [],
);
const seriesToDrop = allSeries
  .filter((s) => !KEEP_SERIES_SLUGS.has(s.slug))
  .map((s) => ({
    ...s,
    draftId: draftIds.has(`drafts.${s._id}`) ? `drafts.${s._id}` : null,
  }));

// ── List services to drop ────────────────────────────────────────────────────
const allServices = await client.fetch(`
  *[_type == "service"]{ _id, "slug": slug.current }
`);
const serviceDraftIds = new Set(
  (await client.fetch(`*[_id in path("drafts.**") && _type == "service"]._id`)) ?? [],
);
const servicesToDrop = allServices
  .filter((s) => !KEEP_SERVICE_SLUGS.has(s.slug))
  .map((s) => ({
    ...s,
    draftId: serviceDraftIds.has(`drafts.${s._id}`) ? `drafts.${s._id}` : null,
  }));

// ── List products to drop (old SKUs) ─────────────────────────────────────────
const allProducts = await client.fetch(`
  *[_type == "product"]{ _id, sku }
`);
const productDraftIds = new Set(
  (await client.fetch(`*[_id in path("drafts.**") && _type == "product"]._id`)) ?? [],
);
const productsToDrop = allProducts
  .filter((p) => !p.sku || !p.sku.startsWith("ES-"))
  .map((p) => ({
    ...p,
    draftId: productDraftIds.has(`drafts.${p._id}`) ? `drafts.${p._id}` : null,
  }));

// ── Safety check: any active product references these? ──────────────────────
const dropSeriesIds = new Set(seriesToDrop.map((s) => s._id));
const dropServiceIds = new Set(servicesToDrop.map((s) => s._id));

const activeRefs = await client.fetch(`
  *[_type == "product" && isActive == true]{
    _id, sku, "seriesId": series._ref
  }
`);
const conflicts = [];
for (const p of activeRefs) {
  if (p.seriesId && dropSeriesIds.has(p.seriesId)) {
    conflicts.push(`Product ${p.sku || p._id} references a drop-list series`);
  }
}

console.log("\n🗑️  CLEANUP DELETE\n");
console.log(`   Mode: ${WRITE ? "⚠️  WRITE MODE — documents will be deleted" : "DRY-RUN (no deletes)"}\n`);

console.log("─── SERIES TO DELETE ───");
for (const s of seriesToDrop) {
  console.log(`   ${s._id}  /${s.slug}`);
  if (s.draftId) console.log(`     + draft ${s.draftId}`);
}
console.log(`   Total: ${seriesToDrop.length} published, ${seriesToDrop.filter(s => s.draftId).length} drafts\n`);

console.log("─── SERVICES TO DELETE ───");
for (const s of servicesToDrop) {
  console.log(`   ${s._id}  /${s.slug}`);
  if (s.draftId) console.log(`     + draft ${s.draftId}`);
}
console.log(`   Total: ${servicesToDrop.length} published, ${servicesToDrop.filter(s => s.draftId).length} drafts\n`);

console.log("─── PRODUCTS TO DELETE ───");
for (const p of productsToDrop) {
  console.log(`   ${p._id}  sku=${p.sku ?? "(none)"}`);
  if (p.draftId) console.log(`     + draft ${p.draftId}`);
}
console.log(`   Total: ${productsToDrop.length} (incl. drafts)\n`);

if (conflicts.length > 0) {
  console.log("⚠️  REFERENCE CONFLICTS (would break active products):\n");
  for (const c of conflicts) console.log(`   - ${c}`);
  console.log("\n   Resolve these BEFORE deleting.\n");
  if (WRITE) {
    console.log("Aborting — fix the reference conflicts first.\n");
    process.exit(1);
  }
}

// Build the deletion list — PRODUCTS FIRST (so their references vanish
// before we try to delete the referenced series/services).
const allDeletes = [
  // 1. Products (and their drafts) — drop the docs that hold references first.
  ...productsToDrop.flatMap((p) => [p._id, p.draftId]),
  // 2. Drafts of series/services (separate from published — safe to delete)
  ...seriesToDrop.map((s) => s.draftId),
  ...servicesToDrop.map((s) => s.draftId),
  // 3. Published series and services
  ...seriesToDrop.map((s) => s._id),
  ...servicesToDrop.map((s) => s._id),
].filter(Boolean);

// De-duplicate (a draft-only document would appear under both itself and the parent slot)
const uniqueDeletes = Array.from(new Set(allDeletes));

if (WRITE) {
  console.log(`⏳ Deleting ${uniqueDeletes.length} documents (products first, then refs)...\n`);
  let ok = 0, fail = 0;
  for (const id of uniqueDeletes) {
    try {
      await client.delete(id);
      console.log(`   ✓ Deleted: ${id}`);
      ok++;
    } catch (err) {
      const msg = err?.response?.body?.error?.description || err.message;
      console.error(`   ✗ ${id}: ${msg}`);
      fail++;
    }
  }
  console.log(`\n✅ Done — ${ok} deleted, ${fail} failed.\n`);
} else {
  console.log(`🟡 Dry-run complete. ${uniqueDeletes.length} documents would be deleted.`);
  console.log("   Run with --write to actually delete.\n");
}
