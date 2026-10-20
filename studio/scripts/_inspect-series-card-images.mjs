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

const series = await c.fetch(
  `*[_type=="series" && coalesce(language,"en")=="en" && isActive==true] | order(sortOrder asc, title asc){
    _id, title, "slug": slug.current, sortOrder, isActive,
    "cardImage": cardImage{ asset->{ _id, url, originalFilename }, alt },
    "hasProducts": count(*[_type=="product" && coalesce(language,"en")=="en" && isActive==true && references(^._id)])
  }`
);

console.log(`\nFound ${series.length} active EN series:\n`);
for (const s of series) {
  const img = s.cardImage?.asset
    ? `✔ ${s.cardImage.asset.originalFilename ?? s.cardImage.asset._id}`
    : `✘ MISSING`;
  console.log(`  ${String(s.sortOrder ?? "—").padStart(3)}  ${s.slug.padEnd(20)} "${s.title}"  cardImage=${img}  products=${s.hasProducts}`);
}