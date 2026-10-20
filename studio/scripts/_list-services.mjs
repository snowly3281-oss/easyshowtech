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
  `*[_type=="service" && coalesce(language, "en") == "en"]|order(coalesce(sortOrder, 9999) asc, _createdAt asc){
    _id, title, "slug": slug.current, sortOrder, isActive,
    "hasHero": heroImage.asset != null, "hasCard": cardImage.asset != null
  }`,
);
console.log(`Found ${ss.length} EN service docs:\n`);
for (const s of ss) {
  console.log(`  ${s._id}  ${s.slug}  sortOrder=${s.sortOrder}  isActive=${s.isActive}  hero=${s.hasHero}  card=${s.hasCard}  "${s.title}"`);
}