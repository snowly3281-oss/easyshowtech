/**
 * Patch solution packages items: set quantity=1 and unit="unit" wherever those
 * fields are null. Idempotent — reads current state and only writes if needed.
 */
import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";

function loadEnv() {
  let dir = process.cwd();
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

const WRITE = process.argv.includes("--write");
const projectId = process.env.PUBLIC_SANITY_PROJECT_ID ?? "w8rk6k6z";
const dataset = process.env.PUBLIC_SANITY_DATASET ?? "production";
const apiVersion = process.env.SANITY_API_VERSION ?? "2024-10-01";
const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token && WRITE) { console.error("No token"); process.exit(1); }

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });

const SOLUTION_IDS = [
  "solution.boutique-studio",
  "solution.franchise",
  "solution.home-pt",
  "solution.hotel-spa",
  "solution.rehab-clinic",
  "solution.training-academy",
];

// Read current packages/items state
const solutions = await client.fetch(
  `*[_type == "solution" && _id in $ids]{
    _id, _rev, title,
    "packages": packages[]{
      _key,
      "items": items[]{
        _key, quantity, unit
      }
    }
  }`,
  { ids: SOLUTION_IDS },
);

let needsFix = 0;
const fixCount = { qty: 0, unit: 0 };
for (const sol of solutions) {
  for (const pkg of sol.packages ?? []) {
    for (const item of pkg.items ?? []) {
      if (item.quantity == null || item.unit == null) {
        needsFix++;
        if (item.quantity == null) fixCount.qty++;
        if (item.unit == null) fixCount.unit++;
      }
    }
  }
}

console.log(`\n🔧 FIX NULL QUANTITIES\n   Mode: ${WRITE ? "⚠️  WRITE" : "DRY-RUN"}\n`);
console.log(`   Found ${needsFix} items with null quantity or unit:`);
console.log(`     quantity=null: ${fixCount.qty}`);
console.log(`     unit=null:      ${fixCount.unit}\n`);

if (needsFix === 0) {
  console.log("   ✅ All items have quantity and unit. Nothing to do.\n");
  process.exit(0);
}

if (!WRITE) {
  console.log("   Run with --write to apply.\n");
  process.exit(0);
}

// Build the fixed packages array
const fixedSolutions = solutions.map((sol) => {
  const fixedPackages = sol.packages.map((pkg) => ({
    ...pkg,
    items: (pkg.items ?? []).map((item) => ({
      ...item,
      quantity: item.quantity ?? 1,
      unit: item.unit ?? "unit",
    })),
  }));
  return { _id: sol._id, _rev: sol._rev, packages: fixedPackages };
});

console.log(`   Patching ${fixedSolutions.length} solutions...\n`);
for (const s of fixedSolutions) {
  try {
    await client
      .patch(s._id)
      .ifRevisionId(s._rev)
      .set({ packages: s.packages })
      .commit();
    console.log(`   ✓ ${s._id}`);
  } catch (err) {
    console.error(`   ✗ ${s._id}: ${err.message}`);
  }
}

console.log(`\n✅ Done.\n`);

// Verify
console.log("─── VERIFICATION ───\n");
const verify = await client.fetch(
  `*[_type == "solution" && _id in $ids]{
    _id, "packages": packages[]{
      "items": items[]{ _key, quantity, unit, "productSku": product->sku }
    }
  }`,
  { ids: SOLUTION_IDS },
);
let ok = 0, bad = 0;
for (const sol of verify) {
  for (const pkg of sol.packages ?? []) {
    for (const it of pkg.items ?? []) {
      if (it.quantity != null && it.unit != null) ok++;
      else {
        bad++;
        console.log(`   ✗ ${sol._id} item ${it._key}: qty=${it.quantity} unit=${it.unit}`);
      }
    }
  }
}
console.log(`   items OK: ${ok}, still null: ${bad}\n`);
