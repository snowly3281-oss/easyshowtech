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
  `*[_type=="series" && coalesce(language,"en")=="en" && isActive==true] | order(sortOrder asc){
    "slug": slug.current, title,
    "filename": cardImage.asset->originalFilename,
    "size": cardImage.asset->metadata.dimensions
  }`
);

for (const r of rows) {
  if (!r.size) { console.log(`  ${r.slug.padEnd(20)} (no dims)`); continue; }
  const orient = r.size.width >= r.size.height ? "land" : "portrait";
  console.log(`  ${r.slug.padEnd(20)} ${r.size.width}x${r.size.height} ${orient}  -> 4/3 crop fits?: ${orient==="land" ? "ok" : "BAD"}`);
}