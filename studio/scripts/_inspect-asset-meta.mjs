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
  perspective: "raw",
});

const rows = await c.fetch(
  `*[_type=="series" && coalesce(language,"en")=="en" && isActive==true && slug.current in ["flags-system","sign-display"]]{
    "slug": slug.current, title,
    cardImage{ asset->{_id, originalFilename, metadata{dimensions, palette}}, hotspot, crop }
  }`
);

for (const r of rows) {
  console.log(`\n━━━ ${r.slug} ━━━`);
  console.log(JSON.stringify(r.cardImage, null, 2));
}