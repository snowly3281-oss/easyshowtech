// Seed the canonical `service` taxonomy used by:
//   • /products Printing Service tab facet
//   • Home page "Printing Service" carousel
//   • Header "By Service" mega menu
//
// After the 2026-10-18 realignment the unit of meaning is "the product
// category the factory can custom-print" (Custom Canopy, Custom Backdrop,
// Custom Flag, Custom Table Cover, Custom Chair, Custom Umbrella, Stock
// Color Canopy). The legacy "process" services (Fabric printing, Vinyl
// wrap, …) were retired; only one product referenced them, so the
// migration is bounded.
//
// Run: `node studio/scripts/seed-services.mjs`
// Requires SANITY_API_WRITE_TOKEN (Studio Editor token) in studio/.env.

// Seed scripts are plain ESM and the Node runtime doesn't read .env
// automatically. Look up the tree for the nearest studio/.env file.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  let dir = __dirname;
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

import { createClient } from "@sanity/client";

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID ?? "w8rk6k6z";
const dataset = process.env.PUBLIC_SANITY_DATASET ?? "production";
const apiVersion = process.env.SANITY_API_VERSION ?? "2024-10-01";
const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("Missing SANITY_API_WRITE_TOKEN. Set a Studio editor token in studio/.env.");
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion, token });

// Seven printing-service categories. Match the home-page carousel 1:1 so the
// carousel pulls from Sanity without manual curation after the operator
// updates the description / cover image.
const SERVICES = [
  {
    slug: "custom-canopy",
    order: 10,
    homeOrder: 10,
    displayInHomeCarousel: true,
    translations: {
      en: "Branded Canopies",
      es: "Carpas personalizadas",
      fr: "Tentes personnalisées",
      de: "Markenzelte",
      it: "Tendoni personalizzati",
    },
  },
  {
    slug: "custom-backdrops",
    order: 20,
    homeOrder: 20,
    displayInHomeCarousel: true,
    translations: {
      en: "Display Backdrops",
      es: "Backdrops de exposición",
      fr: "Backdrops d'exposition",
      de: "Messewände",
      it: "Backdrop per esposizioni",
    },
  },
  {
    slug: "custom-flags",
    order: 30,
    homeOrder: 30,
    displayInHomeCarousel: true,
    translations: {
      en: "Promotional Flags",
      es: "Banderas promocionales",
      fr: "Drapeaux promotionnels",
      de: "Werbefahnen",
      it: "Bandiere promozionali",
    },
  },
  {
    slug: "custom-table-cover",
    order: 40,
    homeOrder: 40,
    displayInHomeCarousel: true,
    translations: {
      en: "Table Throws",
      es: "Manteles personalizados",
      fr: "Nappes de table",
      de: "Tischtücher",
      it: "Tovaglie personalizzate",
    },
  },
  {
    slug: "custom-chair",
    order: 50,
    homeOrder: 50,
    displayInHomeCarousel: true,
    translations: {
      en: "Branded Chairs",
      es: "Sillas personalizadas",
      fr: "Chaises personnalisées",
      de: "Markenstühle",
      it: "Sedie personalizzate",
    },
  },
  {
    slug: "custom-umbrella",
    order: 60,
    homeOrder: 60,
    displayInHomeCarousel: true,
    translations: {
      en: "Promotional Umbrellas",
      es: "Sombrillas promocionales",
      fr: "Parapluies promotionnels",
      de: "Werbeschirme",
      it: "Ombrelloni promozionali",
    },
  },
  {
    slug: "stock-color-canopy",
    order: 70,
    homeOrder: 70,
    displayInHomeCarousel: true,
    translations: {
      en: "Solid Color Canopies",
      es: "Carpas de color sólido",
      fr: "Tentes monochromes",
      de: "Einfarbige Zelte",
      it: "Tendoni tinta unita",
    },
  },
];

async function ensureService(service, language) {
  const id = `service.${service.slug}.${language}`;
  const doc = {
    _id: id,
    _type: "service",
    language,
    title: service.translations[language],
    order: service.order,
    homeOrder: service.homeOrder,
    displayInHomeCarousel: service.displayInHomeCarousel,
    slug: { _type: "slug", current: service.slug },
  };
  await client.createOrReplace(doc);
  return id;
}

async function main() {
  const languages = Object.keys(SERVICES[0].translations);
  let total = 0;
  for (const service of SERVICES) {
    for (const language of languages) {
      const id = await ensureService(service, language);
      console.log(`✓ ${id}  (${language})`);
      total++;
    }
  }
  console.log(
    `\nSeeded ${total} service documents (${SERVICES.length} × ${languages.length} locales).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});