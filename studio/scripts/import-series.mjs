/**
 * Import series documents from CSV.
 *
 * Supports dry-run mode (--dry-run) that only validates without writing.
 * Supports --write to actually write to Sanity.
 * Supports --csv <path> to specify a different CSV file.
 *
 * Safety guarantees:
 *   - Uses createOrReplace (upsert) — existing documents are updated, not duplicated
 *   - Only writes when --write flag is present
 *   - Validates all fields before any write
 *
 * Run:
 *   node studio/scripts/import-series.mjs                              # dry-run
 *   node studio/scripts/import-series.mjs --write                       # write
 *   node studio/scripts/import-series.mjs --csv ../series-import.csv  # custom file
 */
import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── CLI args ────────────────────────────────────────────────────────────────
const DRY_RUN = !process.argv.includes("--write");
const CSV_PATH =
  process.argv
    .find((a) => a.startsWith("--csv="))
    ?.replace("--csv=", null) ?? path.join(__dirname, "..", "..", "series-import-template.csv");

// ── Sanity client ────────────────────────────────────────────────────────────
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
  ? createClient({ projectId, dataset, apiVersion, token })
  : null;

// ── CSV parser ───────────────────────────────────────────────────────────────
function parseCSV(text) {
  const rows = [];
  let row = [],
    field = "",
    inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQ = false;
        }
      } else field += c;
    } else if (c === '"') {
      inQ = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// ── Validation ───────────────────────────────────────────────────────────────
const REQUIRED = ["slug", "title"];
const OPTIONAL = [
  "shortDescription",
  "description",
  "cardImage",
  "heroImage",
  "sortOrder",
  "isActive",
  "metaTitle",
  "metaDescription",
];
const ALL = [...REQUIRED, ...OPTIONAL];

function validateRow(row, header) {
  const errors = [];
  for (const field of REQUIRED) {
    const idx = header.indexOf(field);
    if (idx < 0 || !String(row[idx] ?? "").trim()) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  // sortOrder must be a number
  const soIdx = header.indexOf("sortOrder");
  if (soIdx >= 0 && row[soIdx]?.trim()) {
    if (isNaN(Number(row[soIdx]))) {
      errors.push("sortOrder must be a number");
    }
  }
  // isActive must be true/false
  const iaIdx = header.indexOf("isActive");
  if (iaIdx >= 0 && row[iaIdx]?.trim()) {
    const v = String(row[iaIdx]).trim().toLowerCase();
    if (v !== "true" && v !== "false") {
      errors.push("isActive must be 'true' or 'false'");
    }
  }
  return errors;
}

function rowToDoc(row, header) {
  const get = (name) => {
    const idx = header.indexOf(name);
    return idx >= 0 ? String(row[idx] ?? "").trim() : "";
  };
  const slug = get("slug");
  const sortOrder = get("sortOrder");
  return {
    _id: `series.${slug}`,
    _type: "series",
    title: get("title"),
    slug: { _type: "slug", current: slug },
    shortDescription: get("shortDescription") || undefined,
    description: get("description") || undefined,
    sortOrder: sortOrder ? Number(sortOrder) : undefined,
    isActive:
      get("isActive").toLowerCase() === "true"
        ? true
        : get("isActive").toLowerCase() === "false"
          ? false
          : true,
    metaTitle: get("metaTitle") || undefined,
    metaDescription: get("metaDescription") || undefined,
  };
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(
    `\n📋 Series CSV Import\n   Mode: ${DRY_RUN ? "DRY-RUN (no writes)" : "WRITE MODE"}\n   CSV:  ${CSV_PATH}\n`,
  );

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ CSV file not found: ${CSV_PATH}`);
    process.exit(1);
  }

  const raw = parseCSV(fs.readFileSync(CSV_PATH, "utf8")).filter(
    (r) => r.length > 1,
  );
  if (raw.length < 2) {
    console.error("❌ CSV file is empty or has only a header row.");
    process.exit(1);
  }

  // Skip leading comment lines (cells starting with "#") until header row
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
  const cleanRecords = records.filter((row) =>
    row.some((cell) => String(cell ?? "").trim() !== ""),
  );

  // Warn about unknown columns
  const unknown = header.filter((h) => !ALL.includes(h) && h !== "#");
  if (unknown.length) {
    console.warn(`⚠️  Unknown columns: ${unknown.join(", ")} (will be ignored)`);
  }

  console.log(`   Header columns: ${header.join(", ")}`);
  console.log(`   Data rows: ${cleanRecords.length} (${records.length - cleanRecords.length} blank skipped)\n`);

  const docs = [];
  const errors = [];
  const skipped = [];

  for (let i = 0; i < cleanRecords.length; i++) {
    const row = cleanRecords[i];
    const rowNum = i + headerStart + 3;
    const rowErrors = validateRow(row, header);

    if (rowErrors.length) {
      errors.push({ row: rowNum, errors: rowErrors, data: row });
      continue;
    }

    const doc = rowToDoc(row, header);
    const hasBlankRequired = REQUIRED.some((f) => {
      const v = doc[f];
      return v === undefined || v === null || v === "";
    });
    if (hasBlankRequired) {
      errors.push({
        row: rowNum,
        errors: ["One or more required fields are blank"],
        data: row,
      });
      continue;
    }

    docs.push({ row: rowNum, doc });
  }

  // ── Report ────────────────────────────────────────────────────────────────
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
      console.log(
        `   Row ${row}: /${doc.slug.current.padEnd(22)} "${doc.title}"`,
      );
    }
    console.log();

    if (DRY_RUN) {
      console.log("🟡 Dry-run complete — no documents written.");
      console.log("   Run with --write to actually import.\n");
    } else if (client) {
      console.log("⏳ Writing documents...\n");
      for (const { doc } of docs) {
        await client.createOrReplace(doc);
        console.log(`   ✓ Upserted: ${doc._id}`);
      }
      console.log(`\n✅ Done — ${docs.length} series imported.\n`);
    }
  }

  if (errors.length > 0 && docs.length === 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
