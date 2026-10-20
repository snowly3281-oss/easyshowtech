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

const c = createClient({
  projectId: "w8rk6k6z",
  dataset: "production",
  apiVersion: "2024-10-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const products = await c.fetch(
  '*[_type=="product"]{_id, sku, title, "slug":slug.current, isActive} | order(_id asc)',
);
console.log(`Total products: ${products.length}`);
for (const p of products) {
  console.log(
    `  ${p._id.padEnd(40)} | sku=${p.sku ?? "—"} | slug=${p.slug ?? "—"} | active=${p.isActive}`,
  );
}
