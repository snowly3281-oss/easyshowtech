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

const images = await c.fetch(
  `*[_type=="sanity.imageAsset"]{
    _id, originalFilename,
    "size": metadata.dimensions
  } | order(originalFilename asc)`
);
console.log(`${images.length} image assets total\n`);
for (const i of images) {
  if (!i.size) continue;
  const orient = i.size.width >= i.size.height ? "L" : "P";
  console.log(`  ${orient}  ${String(i.size.width).padStart(5)}x${String(i.size.height).padStart(5)}   ${i.originalFilename}`);
}