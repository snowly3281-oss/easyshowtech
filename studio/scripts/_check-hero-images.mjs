import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";
import imageUrlBuilder from "@sanity/image-url";

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

const builder = imageUrlBuilder(c);

const result = await c.fetch(
  `*[_type == "service" && coalesce(language,"en")=="en" && slug.current == "custom-fabric-printing"][0]{
      _id,
      title,
      "slug": slug.current,
      isActive,
      heroImage{ asset, alt },
      cardImage{ asset, alt }
    }`,
);

console.log("Document:");
console.log(JSON.stringify(result, null, 2));

if (result?.heroImage?.asset) {
  console.log("\nHero URL:", builder.image(result.heroImage.asset).width(1920).height(1080).fit('crop').auto('format').url());
}
if (result?.cardImage?.asset) {
  console.log("Card URL:", builder.image(result.cardImage.asset).width(400).height(280).fit('crop').auto('format').url());
}
process.exit(0);