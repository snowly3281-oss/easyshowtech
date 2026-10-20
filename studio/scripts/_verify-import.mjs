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

const NEW_IDS = [
  "product.es-at-001",
  "product.es-st-001",
  "product.es-pw-001",
  "product.es-bd-001",
  "product.es-fs-001",
  "product.es-sd-001",
  "product.es-ch-001",
];

const rows = await c.fetch(
  `*[_type == "product" && _id in $ids]{
    _id, sku, title, "slug": slug.current, isActive, sortOrder,
    "seriesSlug": series->slug.current,
    "mainAssetId": mainImage.asset._ref,
    "mainAlt": mainImage.alt,
    "keyFeatures": keyFeatures[]{ title, description },
    "keySpecs": keySpecs[]{ label, value },
    "services": printingServices[]->slug.current,
    "materials": materials,
    "customizationOptions": customizationOptions,
    priceDisplay, productionLeadTime,
    metaTitle, metaDescription
  } | order(sortOrder asc)`,
  { ids: NEW_IDS },
);

console.log(`\n─── 7 IMPORTED PRODUCTS (POST-IMPORT VERIFICATION) ───\n`);
for (const r of rows) {
  console.log(`  ${r._id}`);
  console.log(`    title:     ${r.title}`);
  console.log(`    sku:       ${r.sku}`);
  console.log(`    slug:      /${r.slug}`);
  console.log(`    series:    /${r.seriesSlug}`);
  console.log(`    isActive:  ${r.isActive}`);
  console.log(`    sortOrder: ${r.sortOrder}`);
  console.log(`    mainImage: ${r.mainAssetId}  alt="${r.mainAlt}"`);
  console.log(`    services:  ${(r.services ?? []).join(", ") || "(none)"}`);
  console.log(`    features:  ${(r.keyFeatures ?? []).map((f) => f.title).join(" | ") || "(none)"}`);
  console.log(`    specs:     ${(r.keySpecs ?? []).map((s) => `${s.label}=${s.value}`).join(" | ") || "(none)"}`);
  console.log(`    priceMode: ${r.priceDisplay}`);
  console.log(`    leadTime:  ${r.productionLeadTime}`);
  console.log(`    metaTitle: ${r.metaTitle}`);
  console.log();
}

// Also count totals
const totals = await c.fetch(
  `{
    "products": count(*[_type == "product"]),
    "activeProducts": count(*[_type == "product" && isActive == true]),
    "inactiveProducts": count(*[_type == "product" && isActive != true]),
    "series": count(*[_type == "series"]),
    "services": count(*[_type == "service"]),
    "imageAssets": count(*[_type == "sanity.imageAsset"]),
    "mediaTags": count(*[_type == "media.tag"])
  }`,
);
console.log(`─── TOTALS ───`);
console.log(`  Series:      ${totals.series}`);
console.log(`  Services:    ${totals.services}`);
console.log(`  Products:    ${totals.products} (active=${totals.activeProducts}, inactive=${totals.inactiveProducts})`);
console.log(`  Image assets:${totals.imageAssets} (delta from before: +${totals.imageAssets - 44})`);
console.log(`  Media tags:  ${totals.mediaTags} (delta from before: +${totals.mediaTags - 2})\n`);
