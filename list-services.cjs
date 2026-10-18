// List all "service" docs in Sanity
const fs = require("fs");
const path = require("path");
const envFile = path.join(__dirname, "studio", ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}
const { createClient } = require("@sanity/client");
const token = process.env.SANITY_API_WRITE_TOKEN;
const client = createClient({
  projectId: "w8rk6k6z", dataset: "production", apiVersion: "2024-10-01",
  token, useCdn: false,
});

async function main() {
  const docs = await client.fetch(
    `*[_type == "service"]{ _id, title, "slug": slug.current, description, image, order, language }`
  );
  console.log("Total services:", docs.length);
  docs.forEach((d) => {
    console.log(`  ${d.order ?? "-"} | ${d.slug} | ${d.title} | lang=${d.language ?? "?"} | img=${d.image ? "yes" : "no"}`);
  });
}
main().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
