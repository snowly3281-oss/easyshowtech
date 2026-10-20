/**
 * Import the 7 Easyshowtech sample products (from the desktop sample pack)
 * into Sanity. Idempotent and image-aware.
 *
 * What it does (in order):
 *   1. Load products-sample.json from the desktop sample folder
 *   2. Verify all 7 series and 5 printing services exist in Sanity
 *   3. Upload 7 images to Sanity Assets (idempotent by SHA-1 hash)
 *   4. Ensure the required media-tag documents exist
 *   5. Validate fields, slug uniqueness, and SKU uniqueness
 *   6. Draft report (default) or --write to actually upsert
 *
 * Run:
 *   node studio/scripts/import-sample-products.mjs              # dry-run
 *   node studio/scripts/import-sample-products.mjs --write      # write
 *
 * Idempotency:
 *   - product _id = product.<sku-kebab>
 *   - assets re-used by content hash
 *   - safe to re-run after a partial failure
 */
import { createClient } from "@sanity/client";
import {
  createReadStream,
  readFileSync,
  statSync,
  existsSync,
} from "node:fs";
import { createHash } from "node:crypto";
import path, { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WRITE = process.argv.includes("--write");

function loadEnv() {
  let dir = __dirname;
  for (let i = 0; i < 6; i++) {
    const candidate = join(dir, ".env");
    if (existsSync(candidate)) {
      for (const line of readFileSync(candidate, "utf8").split("\n")) {
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
if (!token && WRITE) {
  console.error("Missing SANITY_API_WRITE_TOKEN. Set it in studio/.env");
  process.exit(1);
}
const client = token
  ? createClient({ projectId, dataset, apiVersion, token, useCdn: false })
  : null;

// Paths
const DESKTOP_ROOT = join(
  process.env.USERPROFILE ?? process.env.HOME ?? "",
  "Desktop",
  "easyshow_sample_catalog",
);
const JSON_PATH = join(DESKTOP_ROOT, "products-sample.json");
const IMAGE_DIR = join(DESKTOP_ROOT, "images");

// Fixed media tags required by the schema for product mainImage
const REQUIRED_TAGS = ["scope-product", "role-featured"];

// Helper: derive product _id from SKU
function productIdFromSku(sku) {
  return `product.${String(sku).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function referenceKey(value) {
  return `ref${createHash("sha1").update(value).digest("hex").slice(0, 12)}`;
}

function parseJsonArrayField(value) {
  // The sample JSON has "keyFeatures" / "keySpecs" as object arrays.
  // We just pass them through as-is; no CSV parsing needed.
  if (value == null) return undefined;
  if (Array.isArray(value)) return value.length ? value : undefined;
  return undefined;
}

// ── Read source JSON ─────────────────────────────────────────────────────────
if (!existsSync(JSON_PATH)) {
  console.error(`❌ Sample JSON not found: ${JSON_PATH}`);
  process.exit(1);
}
const products = JSON.parse(readFileSync(JSON_PATH, "utf8"));
console.log(`\n📦 SAMPLE PRODUCTS IMPORT\n   Mode: ${WRITE ? "⚠️  WRITE" : "DRY-RUN"}\n`);
console.log(`   Source: ${JSON_PATH}`);
console.log(`   Image dir: ${IMAGE_DIR}`);
console.log(`   Found ${products.length} products in JSON\n`);

// ── Verify images exist locally ──────────────────────────────────────────────
const imageMap = new Map();
const missingImages = [];
for (const p of products) {
  const fileName = String(p.mainImage ?? "").replace(/^images\//, "");
  if (!fileName) {
    missingImages.push({ sku: p.sku, reason: "no mainImage field" });
    continue;
  }
  const full = join(IMAGE_DIR, fileName);
  if (!existsSync(full)) {
    missingImages.push({ sku: p.sku, reason: `image not found: ${full}` });
    continue;
  }
  const stat = statSync(full);
  const sha1 = createHash("sha1").update(readFileSync(full)).digest("hex");
  imageMap.set(p.sku, { fileName, fullPath: full, size: stat.size, sha1 });
}

// ── Fetch existing references from Sanity (idempotent check) ────────────────
let seriesMap = {};
let serviceMap = {};
let existingProducts = [];
let existingAssets = [];

if (client) {
  const [series, services, products, assets] = await Promise.all([
    client.fetch(`*[_type == "series"]{ _id, "slug": slug.current }`),
    client.fetch(`*[_type == "service"]{ _id, "slug": slug.current }`),
    client.fetch(
      `*[_type == "product"]{ _id, sku, "slug": slug.current, isActive, "seriesSlug": series->slug.current }`,
    ),
    client.fetch(
      `*[_type == "sanity.imageAsset"]{ _id, originalFilename, sha1hash }`,
    ),
  ]);
  seriesMap = Object.fromEntries(series.map((s) => [s.slug, s._id]));
  serviceMap = Object.fromEntries(services.map((s) => [s.slug, s._id]));
  existingProducts = products;
  existingAssets = assets;
}

console.log(
  `   Sanity: ${Object.keys(seriesMap).length} series, ${Object.keys(serviceMap).length} services, ${existingProducts.length} products, ${existingAssets.length} assets\n`,
);

// ── Validation ──────────────────────────────────────────────────────────────
const errors = [];
const existingBySku = new Map(existingProducts.map((p) => [p.sku, p]));
const existingBySlug = new Map(existingProducts.map((p) => [p.slug, p]));
const existingById = new Map(existingProducts.map((p) => [p._id, p]));
const slugsSeen = new Set();
const skusSeen = new Set();

const prepared = [];

for (const p of products) {
  const sku = p.sku;
  const slug = p.slug;
  const id = productIdFromSku(sku);

  // SKU uniqueness within this import
  if (skusSeen.has(sku)) {
    errors.push({ sku, errors: [`Duplicate SKU in source: ${sku}`] });
    continue;
  }
  skusSeen.add(sku);

  // Slug uniqueness within this import
  if (slugsSeen.has(slug)) {
    errors.push({ sku, errors: [`Duplicate slug in source: ${slug}`] });
    continue;
  }
  slugsSeen.add(slug);

  // Slug uniqueness against existing (only if the new slug doesn't already
  // belong to the same _id we're about to upsert — that case is fine)
  const existingForSlug = existingBySlug.get(slug);
  if (existingForSlug && existingForSlug._id !== id) {
    errors.push({
      sku,
      errors: [
        `Slug "${slug}" already used by another product (${existingForSlug._id})`,
      ],
    });
    continue;
  }

  // SKU uniqueness against existing
  const existingForSku = existingBySku.get(sku);
  if (existingForSku && existingForSku._id !== id) {
    errors.push({
      sku,
      errors: [
        `SKU "${sku}" already used by another product (${existingForSku._id})`,
      ],
    });
    continue;
  }

  // Series reference
  if (!seriesMap[p.series_slug]) {
    errors.push({
      sku,
      errors: [`series_slug "${p.series_slug}" not found in Sanity`],
    });
    continue;
  }

  // Printing service references
  const psSlugs = p.printing_service_slugs ?? [];
  const missing = psSlugs.filter((s) => !serviceMap[s]);
  if (missing.length) {
    errors.push({
      sku,
      errors: [`Unknown printing_service_slugs: ${missing.join(", ")}`],
    });
    continue;
  }

  // Image
  if (!imageMap.has(sku)) {
    errors.push({ sku, errors: [`Image missing locally`], critical: true });
    continue;
  }

  prepared.push({ source: p, productId: id });
}

// ── Summary report (validation only) ────────────────────────────────────────
console.log("─── VALIDATION ───");
if (errors.length === 0) {
  console.log(`   ✓ All 7 products pass validation.\n`);
} else {
  console.log(`   ✗ ${errors.length} error(s):\n`);
  for (const e of errors) {
    console.log(`   - [${e.sku}] ${e.errors.join("; ")}`);
  }
  console.log();
}

// Image-tag preview
console.log("─── IMAGES (local) ───");
for (const [sku, info] of imageMap) {
  console.log(
    `   ${sku}  ${info.fileName}  (${(info.size / 1024).toFixed(0)} KB, sha1=${info.sha1.slice(0, 10)}…)`,
  );
}
if (missingImages.length) {
  console.log(`\n   ⚠️  ${missingImages.length} missing image(s):`);
  for (const m of missingImages) console.log(`     - [${m.sku}] ${m.reason}`);
}
console.log();

// Show series / service mapping
console.log("─── REFERENCE MAPPING ───");
for (const p of products) {
  const seriesId = seriesMap[p.series_slug];
  const ps = (p.printing_service_slugs ?? [])
    .map((s) => `${s}->${serviceMap[s]}`)
    .join(", ");
  console.log(`   ${p.sku}  series=${p.series_slug}->${seriesId}`);
  console.log(`           services: ${ps || "(none)"}`);
}
console.log();

// Idempotency check: would any of these replace an existing product?
const wouldReplace = prepared.filter(
  (x) => existingById.get(x.productId) != null,
);
const wouldCreate = prepared.filter((x) => !existingById.get(x.productId));
console.log("─── PLANNED CHANGES ───");
console.log(`   Create new: ${wouldCreate.length}`);
for (const x of wouldCreate) console.log(`     + ${x.productId}  [${x.source.sku}]`);
console.log(`   Update existing: ${wouldReplace.length}`);
for (const x of wouldReplace) console.log(`     ~ ${x.productId}  [${x.source.sku}]`);
console.log();

// Asset plan
const assetReuse = new Map(existingAssets.map((a) => [a.sha1hash, a]));
let newAssets = 0, reusedAssets = 0;
for (const [sku, info] of imageMap) {
  if (assetReuse.has(info.sha1)) reusedAssets++;
  else newAssets++;
}
console.log("─── IMAGE ASSETS ───");
console.log(`   Reuse by hash: ${reusedAssets}`);
console.log(`   Upload new:    ${newAssets}\n`);

// Tag plan
console.log("─── MEDIA TAGS ───");
console.log(`   Ensure: ${REQUIRED_TAGS.join(", ")}\n`);

if (errors.length > 0) {
  console.log("❌ Aborting — fix validation errors before writing.\n");
  process.exit(1);
}

if (!WRITE) {
  console.log("🟡 Dry-run complete. No documents uploaded or written.");
  console.log("   Run with --write to actually import.\n");
  process.exit(0);
}

// ── WRITE MODE ──────────────────────────────────────────────────────────────
console.log("⏳ WRITE MODE — starting real operations\n");

// 1. Ensure media tag documents
const tagIds = await ensureMediaTagDocuments(client, REQUIRED_TAGS);
console.log(`   ✓ Media tags ensured (${tagIds.size} found/created)`);

// 2. Upload images (reused by hash, otherwise uploaded)
const assetBySha = new Map();
for (const a of existingAssets) {
  if (a.sha1hash) assetBySha.set(a.sha1hash, a);
}
const assetByProduct = new Map(); // sku -> asset _id

let uploaded = 0, reused = 0;
for (const p of products) {
  const info = imageMap.get(p.sku);
  if (!info) continue;
  let asset = assetBySha.get(info.sha1);
  if (asset) {
    reused++;
    console.log(`   ↻ Reuse  ${info.fileName} → ${asset._id}`);
  } else {
    asset = await client.assets.upload("image", createReadStream(info.fullPath), {
      filename: info.fileName,
      contentType: "image/" + (extname(info.fileName).slice(1) || "png"),
      extract: ["palette", "blurhash"],
    });
    uploaded++;
    assetBySha.set(info.sha1, asset);
    console.log(`   ↑ Upload ${info.fileName} → ${asset._id}`);
  }
  assetByProduct.set(p.sku, asset._id);

  // 3. Append required media tags to the asset (idempotent)
  await appendMediaTags(client, asset._id, REQUIRED_TAGS, tagIds);
}
console.log(`\n   Image assets: ${uploaded} uploaded, ${reused} reused\n`);

// 4. Upsert products
const stats = { created: 0, updated: 0, failed: 0 };
for (const x of prepared) {
  const { source: p, productId } = x;
  const assetId = assetByProduct.get(p.sku);
  const seriesId = seriesMap[p.series_slug];

  const doc = {
    _id: productId,
    _type: "product",
    title: p.title,
    slug: { _type: "slug", current: p.slug },
    sku: p.sku,
    summary: p.summary,
    description: p.description
      ? [
          {
            _type: "block",
            _key: referenceKey("desc" + p.sku),
            children: [
              {
                _type: "span",
                _key: referenceKey("desc-span" + p.sku),
                text: p.description,
                marks: [],
              },
            ],
            markDefs: [],
            style: "normal",
          },
        ]
      : undefined,
    isActive: false, // per requirement: keep as draft / inactive
    isFeatured: Boolean(p.isFeatured),
    series: { _type: "reference", _ref: seriesId },
    materials: p.materials ?? [],
    customizationOptions: p.customizationOptions ?? [],
    mainImage: {
      _type: "image",
      asset: { _type: "reference", _ref: assetId },
      alt: p.alt ?? p.title,
    },
    keyFeatures: parseJsonArrayField(p.keyFeatures)?.map((f, i) => ({
      _type: "keyFeature",
      _key: referenceKey("kf" + p.sku + i),
      title: f.title,
      description: f.description,
    })),
    keySpecs: parseJsonArrayField(p.keySpecs)?.map((s, i) => ({
      _type: "keySpec",
      _key: referenceKey("ks" + p.sku + i),
      label: s.label,
      value: s.value,
    })),
    printingServices: (p.printing_service_slugs ?? []).map((s) => ({
      _type: "reference",
      _key: referenceKey("ps" + p.sku + s),
      _ref: serviceMap[s],
    })),
    priceDisplay: "quote",
    productionLeadTime: p.productionLeadTime,
    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
    sortOrder: 100, // put new products after the existing 8 in series
  };

  // Drop undefined values to keep the doc clean
  for (const k of Object.keys(doc)) {
    if (doc[k] === undefined) delete doc[k];
  }

  try {
    const existed = existingById.has(productId);
    await client.createOrReplace(doc);
    if (existed) stats.updated++;
    else stats.created++;
    console.log(`   ✓ ${existed ? "↻" : "+"} ${productId} — ${p.title}`);
  } catch (err) {
    stats.failed++;
    console.error(`   ✗ ${productId} — ${err.message}`);
  }
}

console.log(
  `\n✅ Done — created ${stats.created}, updated ${stats.updated}, failed ${stats.failed}\n`,
);

// 5. Verification pass
console.log("─── POST-IMPORT VERIFICATION ───");
const verify = await client.fetch(
  `*[_type == "product" && _id in $ids]{
    _id, sku, title, "slug": slug.current, isActive,
    "seriesSlug": series->slug.current,
    "mainAsset": mainImage.asset._ref,
    "services": printingServices[]->slug.current
  }`,
  { ids: prepared.map((x) => x.productId) },
);
for (const v of verify) {
  console.log(`   ${v._id}`);
  console.log(`     title:     ${v.title}`);
  console.log(`     sku:       ${v.sku}`);
  console.log(`     slug:      /${v.slug}`);
  console.log(`     series:    /${v.seriesSlug}`);
  console.log(`     isActive:  ${v.isActive}`);
  console.log(`     mainImage: ${v.mainAsset}`);
  console.log(`     services:  ${v.services.join(", ") || "(none)"}`);
}
console.log();

// ── Helpers ─────────────────────────────────────────────────────────────────
async function ensureMediaTagDocuments(client, tagNames) {
  const uniqueNames = [...new Set(tagNames.filter(Boolean))].sort();
  const existing = await client.fetch(
    `*[_type == "media.tag" && name.current in $names]{ _id, "name": name.current }`,
    { names: uniqueNames },
  );
  const idsByName = new Map(
    existing.map((t) => [t.name, t._id]),
  );
  for (const name of uniqueNames) {
    if (idsByName.has(name)) continue;
    const _id = `media-tag-${name}`;
    await client.createIfNotExists({
      _id,
      _type: "media.tag",
      name: { _type: "slug", current: name },
    });
    idsByName.set(name, _id);
  }
  return idsByName;
}

async function appendMediaTags(client, assetId, tagNames, idsByName) {
  const asset = await client.fetch(
    `*[_id == $assetId][0]{ _id, _rev, "tagIds": opt.media.tags[]._ref }`,
    { assetId },
  );
  if (!asset) return;
  const existingIds = new Set(asset.tagIds ?? []);
  const refs = [...new Set(tagNames)]
    .map((name) => {
      const _ref = idsByName.get(name);
      if (!_ref) return null;
      return {
        _key: referenceKey(name + assetId),
        _type: "reference",
        _ref,
        _weak: true,
      };
    })
    .filter(Boolean)
    .filter((r) => !existingIds.has(r._ref));
  if (refs.length === 0) return;
  await client
    .patch(asset._id)
    .ifRevisionId(asset._rev)
    .setIfMissing({ opt: {} })
    .setIfMissing({ "opt.media": {} })
    .setIfMissing({ "opt.media.tags": [] })
    .append("opt.media.tags", refs)
    .commit();
}
