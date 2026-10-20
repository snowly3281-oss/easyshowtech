/**
 * Find all references to a specific product.
 */
import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";

function loadEnv() {
  let dir = process.cwd();
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

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) { console.error("No token"); process.exit(1); }

const c = createClient({
  projectId: "w8rk6k6z",
  dataset: "production",
  apiVersion: "2024-10-01",
  token,
});

// 1. List all docs that reference the old product
const productId = "d6aa907c-4d9e-48c7-a68a-718fb9071de0";

const refs = await c.fetch(
  `*[references($id)]{ _id, _type, title, "slug": slug.current }`,
  { id: productId },
);
console.log(`Documents referencing ${productId}:`);
console.log(JSON.stringify(refs, null, 2));

// 2. List all docs that reference the old series
const seriesId = "43e8bb30-08e7-4890-a4c4-338e8ce0fac8";
const seriesRefs = await c.fetch(
  `*[references($id)]{ _id, _type, title }`,
  { id: seriesId },
);
console.log(`\nDocuments referencing ${seriesId}:`);
console.log(JSON.stringify(seriesRefs, null, 2));
