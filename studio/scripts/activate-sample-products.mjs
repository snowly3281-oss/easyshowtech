/**
 * Activate the 7 sample products and wire them into the 6 Solutions'
 * packages[].items[].product references. Idempotent — running twice
 * does nothing the second time.
 *
 * Mapping (chosen for legacy-Pilates solutions reused for Easyshowtech; tweak
 * freely by editing SOLUTION_PRODUCT_MAP):
 *
 *   solution.boutique-studio  → backdrops + popup-walls
 *   solution.franchise        → backdrops + popup-walls + flags
 *   solution.home-pt          → popup-walls + flags
 *   solution.hotel-spa        → popup-walls + signs
 *   solution.rehab-clinic     → backdrops + popup-walls
 *   solution.training-academy → popup-walls + signs + chairs
 *
 * For each solution, each of its 3 packages (compact / recommended / expanded)
 * gets one of the chosen products attached to its existing item.product ref.
 *
 * Run:
 *   node studio/scripts/activate-sample-products.mjs            # dry-run
 *   node studio/scripts/activate-sample-products.mjs --write    # write
 */
import { createClient } from "@sanity/client";
import { createHash } from "node:crypto";
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
if (!token && WRITE) {
  console.error("Missing SANITY_API_WRITE_TOKEN. Set it in studio/.env");
  process.exit(1);
}
const client = token
  ? createClient({ projectId, dataset, apiVersion, token, useCdn: false })
  : null;

// ── The 7 products to activate ──────────────────────────────────────────────
const SAMPLE_PRODUCT_IDS = [
  "product.es-at-001",
  "product.es-st-001",
  "product.es-pw-001",
  "product.es-bd-001",
  "product.es-fs-001",
  "product.es-sd-001",
  "product.es-ch-001",
];

// ── Mapping: solutionId → [compactSku, recommendedSku, expandedSku] ──────────
const TIER_TO_SKU = { compact: 0, recommended: 1, expanded: 2 };

const SOLUTION_PRODUCT_MAP = {
  // [compact, recommended, expanded]
  "solution.boutique-studio": ["es-bd-001", "es-bd-001", "es-pw-001"],
  "solution.franchise":       ["es-bd-001", "es-pw-001", "es-fs-001"],
  "solution.home-pt":         ["es-pw-001", "es-fs-001", "es-fs-001"],
  "solution.hotel-spa":       ["es-pw-001", "es-sd-001", "es-sd-001"],
  "solution.rehab-clinic":    ["es-bd-001", "es-bd-001", "es-pw-001"],
  "solution.training-academy":["es-pw-001", "es-sd-001", "es-ch-001"],
};

function productIdFromSku(sku) {
  return `product.${sku.toLowerCase()}`;
}

// ── Plan ────────────────────────────────────────────────────────────────────
const plan = [];

if (client) {
  const solutions = await client.fetch(
    `*[_type == "solution" && _id in $ids]{
      _id, _rev, title, "slug": slug.current,
      "packages": packages[]{
        _key, title, tier, isRecommended,
        "items": items[]{
          _key, quantity, unit, customName, variantNote,
          "productRef": product._ref
        }
      }
    }`,
    { ids: Object.keys(SOLUTION_PRODUCT_MAP) },
  );

  for (const sol of solutions) {
    const mapping = SOLUTION_PRODUCT_MAP[sol._id];
    if (!mapping) continue;
    const newPackages = sol.packages.map((pkg) => {
      const tierIdx = TIER_TO_SKU[pkg.tier];
      if (tierIdx == null) return { ...pkg, _unchanged: true };
      const sku = mapping[tierIdx];
      if (!sku) return { ...pkg, _unchanged: true };
      const desiredProductRef = {
        _type: "reference",
        _ref: productIdFromSku(sku),
      };
      const items = (pkg.items ?? []).map((item) => {
        const current = item.productRef;
        if (current === desiredProductRef._ref) {
          return { ...item, _unchanged: true };
        }
        return {
          _key: item._key,
          quantity: item.quantity ?? 1,
          unit: item.unit ?? "unit",
          customName: item.customName ?? undefined,
          variantNote: item.variantNote ?? undefined,
          product: desiredProductRef,
        };
      });
      return { ...pkg, items, _unchanged: items.every((i) => i._unchanged) };
    });

    plan.push({
      id: sol._id,
      rev: sol._rev,
      title: sol.title,
      slug: sol.slug,
      unchanged: newPackages.every((p) => p._unchanged),
      newPackages,
      newProductsRef: mapping,
    });
  }
}

// ── Report ──────────────────────────────────────────────────────────────────
console.log("\n🔌 ACTIVATE + WIRE SAMPLE PRODUCTS\n");
console.log(`   Mode: ${WRITE ? "⚠️  WRITE" : "DRY-RUN"}\n`);

console.log("─── PRODUCT ACTIVATION ───");
console.log(`   Will set isActive=true on ${SAMPLE_PRODUCT_IDS.length} products:\n`);
for (const id of SAMPLE_PRODUCT_IDS) {
  console.log(`     • ${id}`);
}
console.log();

console.log("─── SOLUTION WIRING ───\n");
for (const p of plan) {
  const status = p.unchanged ? "✓ already wired" : "✏  needs update";
  console.log(`   [${status}] ${p.id} (/${p.slug}) — "${p.title}"`);
  console.log(`             compact     → ${p.newProductsRef[0]}`);
  console.log(`             recommended → ${p.newProductsRef[1]}`);
  console.log(`             expanded    → ${p.newProductsRef[2]}`);
}
console.log();

if (!WRITE) {
  console.log("🟡 Dry-run complete. No changes written.");
  console.log("   Run with --write to apply.\n");
  process.exit(0);
}

// ── WRITE ───────────────────────────────────────────────────────────────────
console.log("⏳ WRITE MODE — writing patches\n");

// 1. Activate products
let activated = 0;
for (const id of SAMPLE_PRODUCT_IDS) {
  try {
    await client.patch(id).set({ isActive: true }).commit();
    activated++;
    console.log(`   ✓ Activated ${id}`);
  } catch (err) {
    console.error(`   ✗ ${id}: ${err.message}`);
  }
}

// 2. Patch solutions
let solUpdated = 0, solSkipped = 0;
for (const p of plan) {
  if (p.unchanged) {
    solSkipped++;
    continue;
  }
  const cleanedPackages = p.newPackages.map((pkg) => {
    const { _unchanged, ...rest } = pkg;
    rest.items = (rest.items ?? []).map((item) => {
      const { _unchanged: _u, ...restItem } = item;
      return restItem;
    });
    return rest;
  });

  try {
    await client
      .patch(p.id)
      .ifRevisionId(p.rev)
      .set({ packages: cleanedPackages })
      .commit();
    solUpdated++;
    console.log(`   ✓ Updated ${p.id}`);
  } catch (err) {
    console.error(`   ✗ ${p.id}: ${err.message}`);
  }
}

console.log(
  `\n✅ Done — activated ${activated}/${SAMPLE_PRODUCT_IDS.length}, solutions updated ${solUpdated}/${plan.length} (${solSkipped} unchanged).\n`,
);

// 3. Post-write verification
console.log("─── POST-WIRING VERIFICATION ───\n");
const verify = await client.fetch(
  `{
    "products": *[_id in $pids]{ _id, sku, isActive } | order(_id asc),
    "solutions": *[_id in $sids]{
      _id, title, "slug": slug.current,
      "wires": packages[]{
        tier,
        "items": items[]{
          "productRef": product->_id,
          "productSku": product->sku,
          quantity
        }
      }
    } | order(_id asc)
  }`,
  { pids: SAMPLE_PRODUCT_IDS, sids: Object.keys(SOLUTION_PRODUCT_MAP) },
);

console.log("Products:");
for (const p of verify.products) {
  console.log(`   ${p.isActive ? "✓" : "✗"} ${p._id}  sku=${p.sku}  active=${p.isActive}`);
}
console.log();
console.log("Solutions:");
for (const s of verify.solutions) {
  console.log(`\n   ${s._id} (/${s.slug}) "${s.title}"`);
  for (const w of s.wires ?? []) {
    console.log(`     [${w.tier}]`);
    for (const it of w.items ?? []) {
      console.log(
        `        → ${it.productRef ?? "(no product)"}  ${it.productSku ? `sku=${it.productSku}` : ""} qty=${it.quantity}`,
      );
    }
  }
}
console.log();
