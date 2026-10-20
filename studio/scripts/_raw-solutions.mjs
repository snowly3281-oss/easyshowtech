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
  perspective: "raw",
});

const sols = await c.fetch(
  `*[_type == "solution"]{ _id, "slug": slug.current, "packages": packages[]{
    _key, title, tier, isRecommended, priceDisplay, areaMinSqm, areaMaxSqm,
    "items": items[]{ _key, quantity, unit, customName, variantNote, "productRef": product->_id }
  }}`,
);

for (const s of sols) {
  console.log(`\n${s._id} (/${s.slug})`);
  for (const p of s.packages ?? []) {
    console.log(`  PKG _key=${p._key} tier=${p.tier} title="${p.title}" rec=${p.isRecommended}`);
    for (const it of p.items ?? []) {
      console.log(
        `    ITEM _key=${it._key} qty=${it.quantity} unit="${it.unit}" customName="${it.customName ?? ""}" variantNote="${it.variantNote ?? ""}" product=${it.productRef ?? "(none)"}`,
      );
    }
  }
}
