/**
 * scripts/_restore-series-card-images.mjs
 *
 * For every active EN series whose `cardImage` is missing, point it at the
 * `mainImage` of the representative "Custom ..." product in that series.
 * Slugs / titles / sortOrder are not touched.
 *
 * Run with the apply argument to push changes.
 */
import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("apply");

function loadEnv() {
  let d = process.cwd();
  for (let i = 0; i < 6; i++) {
    const c = path.join(d, ".env");
    if (fs.existsSync(c)) {
      for (const l of fs.readFileSync(c, "utf8").split("\n")) {
        const m = l.match(/^([^=]+)=(.*)$/);
        if (m) process.env[m[1].trim()] = m[2].trim();
      }
      return;
    }
    const p = path.dirname(d);
    if (p === d) break;
    d = p;
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

const series = await c.fetch(
  `*[_type=="series" && coalesce(language,"en")=="en" && isActive==true] | order(sortOrder asc){
    _id, title, "slug": slug.current,
    "cardImageHasAsset": cardImage.asset != null,
    "cardImage": cardImage{ asset->{_id, url, originalFilename}, alt },
    "products": *[_type=="product" && coalesce(language,"en")=="en" && isActive==true && references(^._id)] | order(sortOrder asc){
      _id, title, "slug": slug.current, sortOrder,
      "mainImage": mainImage{ asset->{_id, url, originalFilename}, alt }
    }
  }`
);

console.log("\n━━━ PLAN: restore series cardImage from representative product ━━━\n");
const plan = [];
for (const s of series) {
  // Prefer a "Custom ..." product; otherwise the first active product.
  const rep =
    s.products.find((p) => /^custom/i.test(p.title)) ?? s.products[0];
  if (!rep) {
    console.log(`  !! ${s.slug}: no active products, skipping`);
    continue;
  }
  if (s.cardImageHasAsset) {
    console.log(`  = ${s.slug.padEnd(20)} already has cardImage (${s.cardImage.asset.originalFilename}), skipping`);
    continue;
  }
  if (!rep.mainImage?.asset) {
    console.log(`  !! ${s.slug}: representative product "${rep.title}" has no mainImage, skipping`);
    continue;
  }
  plan.push({
    seriesId: s._id,
    seriesTitle: s.title,
    seriesSlug: s.slug,
    productId: rep._id,
    productTitle: rep.title,
    assetId: rep.mainImage.asset._id,
    alt: rep.mainImage.alt ?? rep.title,
    filename: rep.mainImage.asset.originalFilename ?? rep.mainImage.asset._id,
  });
  console.log(`  → ${s.slug.padEnd(20)} "${s.title}"  ←  ${rep.title}  (${rep.mainImage.asset.originalFilename})`);
}

if (!APPLY) {
  console.log(`\nDry-run complete. ${plan.length} series need to be updated.`);
  console.log(`Run with "apply" to push to Sanity:\n  node studio/scripts/_restore-series-card-images.mjs apply\n`);
  process.exit(0);
}

if (plan.length === 0) {
  console.log("\nNothing to update.\n");
  process.exit(0);
}

console.log(`\nCommitting ${plan.length} patches to Sanity…`);
const transaction = c.transaction();
for (const step of plan) {
  transaction.patch(step.seriesId, (p) =>
    p.set({
      cardImage: {
        _type: "image",
        asset: { _type: "reference", _ref: step.assetId },
        alt: step.alt,
      },
    })
  );
}
const txResult = await transaction.commit();
console.log(`✔ Committed. transactionId=${txResult.transactionId}`);

console.log("\nVerification:");
const after = await c.fetch(
  `*[_type=="series" && coalesce(language,"en")=="en" && isActive==true] | order(sortOrder asc){
    _id, "slug": slug.current, title,
    "cardImage": cardImage{ asset->{originalFilename}, alt }
  }`
);
for (const s of after) {
  const img = s.cardImage?.asset?.originalFilename ?? "(MISSING)";
  console.log(`  ${img === "(MISSING)" ? "✘" : "✔"}  ${s.slug.padEnd(20)} cardImage=${img}`);
}

console.log("\n✔ Done. The home CatalogStrip will pick up the new images on the next page load.\n");