import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";

function loadEnv() {
  let d = process.cwd();
  for (let i = 0; i < 6; i++) {
    const c = path.join(d, ".env");
    if (fs.existsSync(c)) {
      for (const l of fs.readFileSync(c, "utf8").split(/\r?\n/)) {
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

for (const slug of ['flags-system', 'sign-display']) {
  const series = await c.fetch(
    `*[_type=="series" && coalesce(language,"en")=="en" && slug.current==$s][0]{
      _id, title, "slug": slug.current,
      "products": *[_type=="product" && coalesce(language,"en")=="en" && references(^._id)] | order(sortOrder asc){
        _id, title, sortOrder,
        "mainImage": mainImage{ asset->{_id, originalFilename, metadata{dimensions}}, alt },
        "gallery": gallery[]{ asset->{_id, originalFilename, metadata{dimensions}}, alt }
      }
    }`, {s: slug}
  );
  console.log(`\n━━━ ${series.title} (${series.slug})  _id=${series._id} ━━━`);
  for (const p of series.products) {
    console.log(`  • ${p.title}`);
    const main = p.mainImage?.asset;
    if (main) console.log(`      mainImage = ${main.originalFilename} ${main.metadata?.dimensions?.width}x${main.metadata?.dimensions?.height}`);
    (p.gallery ?? []).forEach((g, i) => {
      if (g?.asset) console.log(`      gallery[${i}] = ${g.asset.originalFilename} ${g.asset.metadata?.dimensions?.width}x${g.asset.metadata?.dimensions?.height}`);
    });
  }
}