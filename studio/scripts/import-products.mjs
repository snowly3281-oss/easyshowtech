/**
 * Import display product documents from CSV.
 *
 * Maps `series_slug` → Sanity series._id and
 * `printing_service_slugs` → Sanity service._id via reference lookup
 * before writing.
 *
 * Supports --dry-run (default) and --write modes.
 * Supports --csv <path> to specify a different CSV file.
 *
 * Safety guarantees:
 *   - createOrReplace (upsert) — never deletes existing products
 *   - Only writes when --write flag is present
 *   - Validates all fields and referenced documents before any write
 *
 * Run:
 *   node studio/scripts/import-products.mjs                    # dry-run
 *   node studio/scripts/import-products.mjs --write          # write
 *   node studio/scripts/import-products.mjs --csv ../my.csv  # custom file
 */
import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DRY_RUN = !process.argv.includes("--write");
const CSV_PATH =
  process.argv
    .find((a) => a.startsWith("--csv="))
    ?.replace("--csv=", null) ??
  path.join(__dirname, "..", "..", "products-import-template.csv");

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
if (!token && !DRY_RUN) {
  console.error("Missing SANITY_API_WRITE_TOKEN. Set it in studio/.env");
  process.exit(1);
}
const client = token
  ? createClient({ projectId, dataset, apiVersion, token, useCdn: false })
  : null;

// ── CSV parser ───────────────────────────────────────────────────────────────
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function parseArray(value) {
  if (!value || !value.trim()) return undefined;
  return value.split(";").map((s) => s.trim()).filter(Boolean);
}

function parseKeySpecs(value) {
  if (!value || !value.trim()) return undefined;
  return value.split(";").map((s, i) => {
    const parts = s.split(":");
    const label = parts[0]?.trim();
    const v = parts[1]?.trim() ?? "";
    return { _key: `spec${i}`, label, value: v };
  }).filter((s) => s.label);
}

// ── Fetch existing references ────────────────────────────────────────────────
async function fetchReferences() {
  if (!client) return { seriesMap: {}, serviceMap: {} };

  const [allSeries, allServices] = await Promise.all([
    client.fetch(`*[_type == "series"]{ _id, "slug": slug.current }`),
    client.fetch(`*[_type == "service"]{ _id, "slug": slug.current }`),
  ]);

  const seriesMap = Object.fromEntries(
    allSeries.map((s) => [s.slug, s._id]),
  );
  const serviceMap = Object.fromEntries(
    allServices.map((s) => [s.slug, s._id]),
  );

  console.log(
    `   Found ${allSeries.length} series, ${allServices.length} services in Sanity.\n`,
  );
  return { seriesMap, serviceMap };
}

// ── Validation ───────────────────────────────────────────────────────────────
const REQUIRED = ["title", "series_slug", "summary"];

function validateRow(row, header, seriesMap, serviceMap) {
  const errors = [];
  const get = (name) => {
    const idx = header.indexOf(name);
    return idx >= 0 ? String(row[idx] ?? "").trim() : "";
  };

  for (const field of REQUIRED) {
    if (!get(field)) errors.push(`Missing required: ${field}`);
  }

  const seriesSlug = get("series_slug");
  if (seriesSlug && !seriesMap[seriesSlug]) {
    errors.push(`series_slug="${seriesSlug}" not found in Sanity. Run seed-series.mjs first.`);
  }

  const psSlugs = parseArray(get("printing_service_slugs")) ?? [];
  for (const slug of psSlugs) {
    if (!serviceMap[slug]) {
      errors.push(`printing_service_slug="${slug}" not found in Sanity. Run seed-services-display.mjs first.`);
    }
  }

  const priceMode = get("price_display");
  if (priceMode === "show" && !get("price")) {
    errors.push("price_display=show requires a price value");
  }
  if (priceMode === "range" && (!get("price_min") || !get("price_max"))) {
    errors.push("price_display=range requires both price_min and price_max");
  }

  return errors;
}

// ── Build document ───────────────────────────────────────────────────────────
function rowToDoc(row, header, seriesMap, serviceMap) {
  const get = (name) => {
    const idx = header.indexOf(name);
    return idx >= 0 ? String(row[idx] ?? "").trim() : "";
  };

  const title = get("title");
  const slug = get("slug") || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const seriesSlug = get("series_slug");
  const psSlugs = parseArray(get("printing_service_slugs")) ?? [];

  const doc = {
    _type: "product",
    title,
    slug: { _type: "slug", current: slug },
    summary: get("summary"),
    isActive: get("is_active").toLowerCase() !== "false",
    isFeatured: get("is_featured").toLowerCase() === "true",
  };

  if (get("sku")) doc.sku = get("sku");
  if (get("description")) doc.description = get("description");
  if (get("sort_order")) doc.sortOrder = Number(get("sort_order"));
  if (get("meta_title")) doc.metaTitle = get("meta_title");
  if (get("meta_description")) doc.metaDescription = get("meta_description");

  // Series reference
  if (seriesSlug && seriesMap[seriesSlug]) {
    doc.series = { _type: "reference", _ref: seriesMap[seriesSlug] };
  }

  // Materials
  const materials = parseArray(get("materials"));
  if (materials?.length) doc.materials = materials;

  // Customization options
  const customOpts = parseArray(get("customization_options"));
  if (customOpts?.length) doc.customizationOptions = customOpts;

  // Printing services references
  const psRefs = psSlugs
    .filter((s) => serviceMap[s])
    .map((s) => ({ _type: "reference", _ref: serviceMap[s] }));
  if (psRefs.length) doc.printingServices = psRefs;

  // Key specs
  const keySpecs = parseKeySpecs(get("key_specs"));
  if (keySpecs?.length) doc.keySpecs = keySpecs;

  // Pricing
  const priceDisplay = get("price_display") || "quote";
  doc.priceDisplay = priceDisplay;
  if (priceDisplay === "show" && get("price")) {
    doc.price = Number(get("price"));
    doc.currency = get("currency") || "USD";
  } else if (priceDisplay === "range") {
    if (get("price_min")) doc.priceMin = Number(get("price_min"));
    if (get("price_max")) doc.priceMax = Number(get("price_max"));
    doc.currency = get("currency") || "USD";
  }
  if (priceDisplay === "show" || priceDisplay === "range") {
    if (get("currency")) doc.currency = get("currency");
  }

  // MOQ and lead time
  if (get("moq")) doc.moq = Number(get("moq"));
  if (get("production_lead_time")) doc.productionLeadTime = get("production_lead_time");
  if (get("warranty")) doc.warranty = get("warranty");

  // SKU-based _id for upsert (stable across re-runs)
  const sku = get("sku");
  if (sku) {
    doc._id = `product.${sku.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  } else {
    doc._id = `product.${slug}`;
  }

  return doc;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(
    `\n📋 Products CSV Import\n   Mode: ${DRY_RUN ? "DRY-RUN (no writes)" : "WRITE MODE"}\n   CSV:  ${CSV_PATH}\n`,
  );

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ CSV file not found: ${CSV_PATH}`);
    process.exit(1);
  }

  // Step 1: fetch existing references
  console.log("🔍 Fetching existing series and service references...");
  const { seriesMap, serviceMap } = await fetchReferences();

  // Step 2: parse CSV
  const raw = parseCSV(fs.readFileSync(CSV_PATH, "utf8")).filter(
    (r) => r.length > 1,
  );
  if (raw.length < 2) {
    console.error("❌ CSV file is empty or has only a header row.");
    process.exit(1);
  }

  // Skip leading lines starting with `#` (comments) until the actual header row
  // is found. The header is the first line whose first cell doesn't begin with `#`.
  let headerStart = 0;
  while (
    headerStart < raw.length &&
    String(raw[headerStart][0] ?? "").trim().startsWith("#")
  ) {
    headerStart++;
  }
  if (headerStart >= raw.length) {
    console.error("❌ CSV file has no header row (only comments).");
    process.exit(1);
  }
  const header = raw[headerStart].map((h) => h.trim());
  const records = raw.slice(headerStart + 1);

  // Drop fully-empty trailing rows
  const cleanRecords = records.filter(
    (row) => row.some((cell) => String(cell ?? "").trim() !== ""),
  );

  console.log(`   Columns: ${header.length}`);
  console.log(`   Rows: ${cleanRecords.length} (${records.length - cleanRecords.length} blank skipped)\n`);

  const docs = [];
  const errors = [];
  const skipped = [];

  for (let i = 0; i < cleanRecords.length; i++) {
    const row = cleanRecords[i];
    const rowNum = i + headerStart + 3; // account for 1-index + header + 1 for the comments line
    const rowErrors = validateRow(row, header, seriesMap, serviceMap);

    if (rowErrors.length) {
      errors.push({ row: rowNum, errors: rowErrors });
      continue;
    }

    const doc = rowToDoc(row, header, seriesMap, serviceMap);
    docs.push({ row: rowNum, doc });
  }

  // ── Report ───────────────────────────────────────────────────────────────
  if (errors.length) {
    console.log(`❌ ${errors.length} row(s) with errors:\n`);
    for (const e of errors) {
      console.log(`   Row ${e.row}:`);
      for (const err of e.errors) console.log(`     - ${err}`);
    }
    console.log();
  }

  if (docs.length) {
    console.log(`✅ ${docs.length} row(s) ready to import:\n`);
    for (const { row, doc } of docs) {
      const sku = doc.sku ? ` [${doc.sku}]` : "";
      const series = doc.series ? " (series set)" : " ⚠️ NO SERIES";
      console.log(`   Row ${String(row).padStart(3)}: ${doc.title}${sku}${series}`);
    }
    console.log();

    if (DRY_RUN) {
      console.log("🟡 Dry-run complete — no documents written.\n");
      console.log("   Run with --write to actually import.\n");
      if (errors.length > 0) process.exit(1);
    } else if (client) {
      console.log("⏳ Writing documents...\n");
      let ok = 0, fail = 0;
      for (const { doc } of docs) {
        try {
          await client.createOrReplace(doc);
          console.log(`   ✓ ${doc._id} — ${doc.title}`);
          ok++;
        } catch (err) {
          console.error(`   ✗ ${doc._id}: ${err.message}`);
          fail++;
        }
      }
      console.log(`\n✅ Done — ${ok} imported, ${fail} failed.\n`);
      if (fail > 0) process.exit(1);
    }
  } else if (errors.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
