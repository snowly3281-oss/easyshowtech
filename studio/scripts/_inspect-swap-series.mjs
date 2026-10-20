import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";

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
});

const rows = await c.fetch(
  `*[_type=="series" && coalesce(language,"en")=="en" && isActive==true && slug.current in ["popup-walls","backdrops"]]{
    _id, title, "slug": slug.current,
    "cardImage": cardImage{ asset->{_id, url, originalFilename}, alt },
    "products": *[_type=="product" && coalesce(language,"en")=="en" && isActive==true && references(^._id)] | order(sortOrder asc){
      _id, title, "slug": slug.current, sortOrder,
      "mainImage": mainImage{ asset->{_id, originalFilename}, alt }
    }
  }`
);

for (const s of rows) {
  console.log(`\n━━━ ${s.title} (${s.slug}) ━━━`);
  console.log(`  current cardImage asset: ${s.cardImage?.asset?.originalFilename ?? "(none)"}`);
  for (const p of s.products) {
    const img = p.mainImage?.asset?.originalFilename ?? "(none)";
    console.log(`  • sort=${p.sortOrder}  ${p.title}  → mainImage=${img}`);
  }
}