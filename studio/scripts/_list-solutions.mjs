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
  `*[_type=="solution" && coalesce(language, "en") == "en"]|order(_createdAt asc){
    _id, title, "slug": slug.current, language, audience, _createdAt
  }`,
);
console.log(`\nFound ${ss.length} EN solution docs:\n`);
for (const s of ss) {
  console.log(`  ${s._id}  ${s.slug ?? "(NO SLUG)"}  "${s.title}"`);
  if (s.audience) console.log(`     audience: ${s.audience}`);
}