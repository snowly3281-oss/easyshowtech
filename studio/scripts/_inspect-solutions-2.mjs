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

const c = createClient({
  projectId: "w8rk6k6z",
  dataset: "production",
  apiVersion: "2024-10-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

// Read all 6 solutions with their packages + items
const solutions = await c.fetch(
  `*[_type == "solution" && defined(slug)]{
    _id, title, "slug": slug.current,
    "products": products[]->_id,
    "packagesCount": count(packages),
    "packages": packages[]{
      _key, title, tier, isRecommended,
      summary, priceDisplay,
      areaMinSqm, areaMaxSqm,
      areaMinSqFt, areaMaxSqFt,
      equipmentTotalMin, equipmentTotalMax,
      "items": items[]{
        _key, quantity, unit, customName, variantNote,
        "productId": product._ref,
        "productTitle": product->title
      }
    }
  } | order(_id asc)`,
);

console.log(`Found ${solutions.length} solutions\n`);
for (const s of solutions) {
  console.log(`\n══════ ${s._id} — ${s.title} (/${s.slug}) ══════`);
  console.log(`  products (legacy): ${s.products?.length ?? 0} ref(s)`);
  console.log(`  packages: ${s.packagesCount}`);
  if (s.packages?.length) {
    for (let i = 0; i < s.packages.length; i++) {
      const p = s.packages[i];
      console.log(
        `  Package ${i + 1}: "${p.title}" tier=${p.tier} rec=${p.isRecommended} items=${p.items?.length ?? 0}`,
      );
      console.log(
        `     area: ${p.areaMinSqm ?? "—"}–${p.areaMaxSqm ?? "—"} m² (${p.areaMinSqFt ?? "—"}–${p.areaMaxSqFt ?? "—"} sq ft)  equipment: ${p.equipmentTotalMin ?? "—"}–${p.equipmentTotalMax ?? "—"}  price: ${p.priceDisplay}`,
      );
      for (const it of p.items ?? []) {
        console.log(
          `       - ${it.productTitle ?? it.customName ?? "(none)"}  qty=${it.quantity} ${it.unit ?? "unit"}  ${it.variantNote ?? ""}`,
        );
      }
    }
  }
}
