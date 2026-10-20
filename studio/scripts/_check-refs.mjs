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

const ref = "43e8bb30-08e7-4890-a4c4-338e8ce0fac8";
const r = await c.fetch(
  `*[_type=="product" && references($ref)]{_id, title, sku, "slug":slug.current, isActive}`,
  { ref },
);
console.log(`Products referencing drop-list series: ${r.length}`);
console.log(JSON.stringify(r, null, 2));
