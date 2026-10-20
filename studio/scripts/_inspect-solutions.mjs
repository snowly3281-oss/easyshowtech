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

const productId = "d6aa907c-4d9e-48c7-a68a-718fb9071de0";

// Find exactly what the path is
const refs = await c.fetch(
  `*[_id in $ids]{
    _id, _type, title, "slug": slug.current,
    "refsToProduct": *[_type=="product" && _id==$pid]{
      _id, title, sku
    },
    "products": products[]->{_id, title, sku},
    "featuredProductIds": products[].product._ref
  }`,
  { ids: ["home", "solution.boutique-studio", "solution.franchise",
          "solution.home-pt", "solution.hotel-spa", "solution.rehab-clinic",
          "solution.training-academy"],
    pid: productId },
);
console.log(JSON.stringify(refs, null, 2));
