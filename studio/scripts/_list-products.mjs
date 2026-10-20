/**
 * List all products and their status.
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
const client = createClient({ projectId, dataset, apiVersion, token });

const products = await client.fetch(`
  *[_type == "product"]{ _id, title, sku, "slug": slug.current, isActive, status,
    "seriesSlug": series->slug.current } | order(sku asc)
`);

const KEEP_SERIES = new Set([
  "aluminum-tent", "steel-tent", "popup-walls", "backdrops",
  "flags-system", "sign-display", "chairs",
]);

console.log(`\n─── PRODUCTS: ${products.length} total ───\n`);

let activeNew = 0, inactiveOld = 0, broken = 0;
for (const p of products) {
  const seriesOk = !p.seriesSlug || KEEP_SERIES.has(p.seriesSlug);
  const isNewProduct = seriesOk && p.sku?.startsWith("ES-");
  const status =
    isNewProduct && p.isActive === true ? "✅ new + active" :
    isNewProduct && p.isActive === false ? "🟡 new + inactive" :
    !seriesOk ? "❌ old (drop-list series)" :
    p.isActive === true ? "⚠️  active but old-style" :
    "🟡 old + inactive";
  console.log(`  [${status}]`);
  console.log(`    _id:     ${p._id}`);
  console.log(`    sku:     ${p.sku}`);
  console.log(`    title:   ${p.title}`);
  console.log(`    slug:    /${p.slug}`);
  console.log(`    isActive: ${p.isActive}`);
  console.log(`    series:  /${p.seriesSlug ?? "(none)"}\n`);
  if (isNewProduct && p.isActive === true) activeNew++;
  else if (!seriesOk || !p.sku?.startsWith("ES-")) inactiveOld++;
  if (!seriesOk) broken++;
}

console.log(`Summary:`);
console.log(`  Active new products: ${activeNew}`);
console.log(`  Old / broken products: ${inactiveOld}`);
console.log(`  Of which reference drop-list series: ${broken}\n`);
