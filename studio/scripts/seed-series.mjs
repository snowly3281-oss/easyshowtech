/**
 * Seed (or re-seed) the 7 canonical display-equipment series.
 *
 * Idempotent: uses createOrReplace so re-running never creates duplicates.
 * Languages are not created here — the standard Sanity i18n workflow (translation
 * references) handles non-English variants.
 *
 * Run:
 *   node studio/scripts/seed-series.mjs           # dry-run preview
 *   node studio/scripts/seed-series.mjs --write  # actually write
 *
 * Requires SANITY_API_WRITE_TOKEN in studio/.env
 */
import { createClient } from "@sanity/client";
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

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID ?? "w8rk6k6z";
const dataset = process.env.PUBLIC_SANITY_DATASET ?? "production";
const apiVersion = process.env.SANITY_API_VERSION ?? "2024-10-01";
const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("Missing SANITY_API_WRITE_TOKEN. Set it in studio/.env");
  process.exit(1);
}

const WRITE = process.argv.includes("--write");
const client = createClient({ projectId, dataset, apiVersion, token });

// ── 7 canonical display-equipment series ────────────────────────────────────
const SERIES = [
  {
    _id: "series.aluminum-tent",
    slug: "aluminum-tent",
    title: "Aluminum Tents",
    shortDescription: "Lightweight, corrosion-resistant event tents in various sizes for outdoor promotions.",
    description:
      "Our aluminum tent series combines lightweight frames with durable fabric for reliable outdoor performance. Suitable for trade shows, weddings, sports events and commercial promotions. Frames use aviation-grade aluminum alloy with modular connectors for quick setup.",
    sortOrder: 10,
    isActive: true,
    cardImage: null,
    heroImage: null,
    metaTitle: "Aluminum Tents — EasyShow",
    metaDescription:
      "Lightweight aluminum frame event tents. Custom sizes, full-color printing, fast production.",
  },
  {
    _id: "series.steel-tent",
    slug: "steel-tent",
    title: "Steel Tents",
    shortDescription: "Heavy-duty steel frame tents for large-scale outdoor events and long-term installations.",
    description:
      "Steel frame tents offer superior wind resistance and load capacity for large-scale events, warehouses and semi-permanent installations. Hot-dip galvanized steel ensures long-term corrosion protection.",
    sortOrder: 20,
    isActive: true,
    cardImage: null,
    heroImage: null,
    metaTitle: "Steel Tents — EasyShow",
    metaDescription:
      "Heavy-duty steel frame tents for large events, warehouses and semi-permanent use.",
  },
  {
    _id: "series.popup-walls",
    slug: "popup-walls",
    title: "Pop Up Walls",
    shortDescription: "Portable pop-up display walls for trade shows, retail and events.",
    description:
      "Pop-up walls fold flat for easy transport and set up in minutes without tools. Available in straight, curved and island configurations. Compatible with graphic panels for full-color branding.",
    sortOrder: 30,
    isActive: true,
    cardImage: null,
    heroImage: null,
    metaTitle: "Pop Up Display Walls — EasyShow",
    metaDescription:
      "Portable pop-up walls for trade shows, retail displays and event backdrops.",
  },
  {
    _id: "series.backdrops",
    slug: "backdrops",
    title: "Backdrops",
    shortDescription: "Custom printed backdrops for photography, events, retail and brand activations.",
    description:
      "Fabric and vinyl backdrops in custom sizes with vibrant dye-sublimation printing. Options include tension fabric stands, retractable banners and free-standing frames for photography studios, event stages and retail environments.",
    sortOrder: 40,
    isActive: true,
    cardImage: null,
    heroImage: null,
    metaTitle: "Custom Display Backdrops — EasyShow",
    metaDescription:
      "Custom printed backdrops for events, photography, retail and brand activations.",
  },
  {
    _id: "series.flags-system",
    slug: "flags-system",
    title: "Flags System",
    shortDescription: "Outdoor promotional flag banners and flagpole systems for brand visibility.",
    description:
      "Teardrop, feather, rectangle and drop-arm flags in various heights. Compatible with cross-base, spike-base and water-base footings for different ground conditions. Durable polyester fabric with long-term UV-resistant printing.",
    sortOrder: 50,
    isActive: true,
    cardImage: null,
    heroImage: null,
    metaTitle: "Promotional Flag Systems — EasyShow",
    metaDescription:
      "Outdoor flag banners and flagpole systems. Teardrop, feather, rectangle and drop-arm flags.",
  },
  {
    _id: "series.sign-display",
    slug: "sign-display",
    title: "Sign and Display",
    shortDescription: "Custom signs, banners and point-of-purchase displays for retail and events.",
    description:
      "From hanging banner signs to illuminated POS displays and modular signage systems. Materials include aluminum, acrylic, PVC and fabric. Suitable for retail environments, exhibitions, wayfinding and promotional installations.",
    sortOrder: 60,
    isActive: true,
    cardImage: null,
    heroImage: null,
    metaTitle: "Custom Signs & Display — EasyShow",
    metaDescription:
      "Custom signs, banners and point-of-purchase displays for retail, exhibitions and events.",
  },
  {
    _id: "series.chairs",
    slug: "chairs",
    title: "Chairs",
    shortDescription: "Branded event chairs and seating solutions with custom printing and logo placement.",
    description:
      "Lightweight aluminum and steel event chairs with optional custom printing on seats or backs. Stackable designs for easy storage. Suitable for weddings, conferences, outdoor events and hospitality venues.",
    sortOrder: 70,
    isActive: true,
    cardImage: null,
    heroImage: null,
    metaTitle: "Branded Event Chairs — EasyShow",
    metaDescription:
      "Custom printed event chairs and branded seating solutions for weddings, events and hospitality.",
  },
];

async function upsertSeries(item) {
  const doc = {
    _id: item._id,
    _type: "series",
    title: item.title,
    slug: { _type: "slug", current: item.slug },
    shortDescription: item.shortDescription,
    description: item.description,
    sortOrder: item.sortOrder,
    isActive: item.isActive,
    metaTitle: item.metaTitle,
    metaDescription: item.metaDescription,
  };
  if (WRITE) {
    await client.createOrReplace(doc);
  }
  return doc;
}

async function main() {
  console.log(
    `\n${WRITE ? "Writing" : "Preview"} ${SERIES.length} series documents...\n`,
  );

  for (const s of SERIES) {
    const action = WRITE ? "Upserted" : "Would upsert";
    console.log(
      `  ${action}: ${s._id.padEnd(30)} /${s.slug.padEnd(20)} "${s.title}"`,
    );
    await upsertSeries(s);
  }

  console.log(
    `\n${WRITE ? "Done" : "Dry-run complete"} — ${SERIES.length} series.\n`,
  );
  if (!WRITE) {
    console.log("Run with --write to actually create/update documents.\n");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
