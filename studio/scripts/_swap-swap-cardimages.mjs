/**
 * scripts/_swap-swap-cardimages.mjs
 *
 * Swaps cardImage asset references between two series in Sanity.
 * Used when catalog images accidentally land on the wrong card.
 *
 * Run with the apply argument to commit.
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

// ◀── EDIT THESE when the swapped pair changes.
const A_SLUG = "backdrops";
const B_SLUG = "popup-walls";

const rows = await c.fetch(
  `*[_type=="series" && coalesce(language,"en")=="en" && isActive==true && slug.current in [$a, $b]]{
    _id, title, "slug": slug.current,
    "cardImage": cardImage{ asset->{_id, url, originalFilename}, alt }
  }`,
  { a: A_SLUG, b: B_SLUG }
);

const a = rows.find((r) => r.slug === A_SLUG);
const b = rows.find((r) => r.slug === B_SLUG);
if (!a || !b) {
  console.log(`!! Missing one of: ${A_SLUG}, ${B_SLUG}`);
  process.exit(1);
}

console.log(`\n━━━ SWAPPING cardImage between ${a.slug} ↔ ${b.slug} ━━━\n`);
console.log(`  before:`);
console.log(`    ${a.slug.padEnd(14)} cardImage = ${a.cardImage?.asset?.originalFilename ?? "(none)"}`);
console.log(`    ${b.slug.padEnd(14)} cardImage = ${b.cardImage?.asset?.originalFilename ?? "(none)"}`);

if (!a.cardImage?.asset || !b.cardImage?.asset) {
  console.log(`!! One of them is empty — nothing meaningful to swap. Aborting.`);
  process.exit(1);
}

if (a.cardImage.asset._id === b.cardImage.asset._id) {
  console.log(`= Already point to the same asset. Nothing to do.`);
  process.exit(0);
}

if (!APPLY) {
  console.log(`\nDry-run only. Run with "apply" to swap.\n`);
  process.exit(0);
}

const transaction = c.transaction();
transaction
  .patch(a._id, (p) =>
    p.set({
      cardImage: {
        _type: "image",
        asset: { _type: "reference", _ref: b.cardImage.asset._id },
        alt: b.cardImage.alt ?? a.title,
      },
    })
  )
  .patch(b._id, (p) =>
    p.set({
      cardImage: {
        _type: "image",
        asset: { _type: "reference", _ref: a.cardImage.asset._id },
        alt: a.cardImage.alt ?? b.title,
      },
    })
  );

console.log(`\nCommitting swap…`);
const tx = await transaction.commit();
console.log(`✔ Committed. transactionId=${tx.transactionId}`);

const after = await c.fetch(
  `*[_type=="series" && coalesce(language,"en")=="en" && isActive==true && slug.current in [$a, $b]]{
    _id, "slug": slug.current,
    "cardImage": cardImage{ asset->{originalFilename} }
  }`,
  { a: A_SLUG, b: B_SLUG }
);

console.log(`\n  after:`);
for (const s of after) {
  console.log(`    ${s.slug.padEnd(14)} cardImage = ${s.cardImage?.asset?.originalFilename ?? "(none)"}`);
}
console.log(`\n✔ Done.\n`);