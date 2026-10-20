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

const docs = await c.fetch(
  `*[_type=="solution" && coalesce(language, "en") == "en"]|order(coalesce(sortOrder, 9999) asc, _createdAt asc){
    _id, title, "slug": slug.current, sortOrder,
    "hero": pageBuilder[_type=="heroBlock"][0]{heading, eyebrow, subheading}
  }`,
);
for (const d of docs) {
  console.log(`\n${d._id}  ${d.slug}  (sortOrder=${d.sortOrder})`);
  console.log(`  title:   ${d.title}`);
  console.log(`  hero.heading:    ${d.hero?.heading ?? "(none)"}`);
  console.log(`  hero.eyebrow:    ${d.hero?.eyebrow ?? "(none)"}`);
  console.log(`  hero.subheading: ${(d.hero?.subheading ?? "").slice(0, 100)}…`);
}