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

const ss = await c.fetch(
  `*[_type=="service"]|order(sortOrder asc){
    _id, title, "slug": slug.current, isActive, sortOrder,
    shortDescription,
    supportedMaterials,
    suitableApplications,
    "cardImageId": cardImage.asset->_id,
    "benefits": benefits[]{title,description}
  }`,
);

for (const s of ss) {
  console.log(`\n${s._id}  ${s.title}  (${s.slug})  sortOrder=${s.sortOrder}`);
  console.log(`  active=${s.isActive}  cardImage=${s.cardImageId ?? "(NONE)"}`);
  console.log(`  shortDesc: ${s.shortDescription ?? "(none)"}`);
  console.log(`  benefits: ${s.benefits?.length ?? 0}`);
  for (const b of s.benefits ?? []) {
    console.log(`    - ${b.title}${b.description ? " · " + b.description : ""}`);
  }
  console.log(`  materials: ${(s.supportedMaterials ?? []).join(", ") || "(none)"}`);
  console.log(`  applications: ${(s.suitableApplications ?? []).join(", ") || "(none)"}`);
}