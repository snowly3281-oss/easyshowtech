/**
 * Seed (or re-seed) the 5 canonical printing services.
 *
 * Idempotent: uses createOrReplace so re-running never creates duplicates.
 * Type name stays "service" (already registered in schema/index.ts).
 * Language variants are handled by the standard Sanity i18n workflow.
 *
 * Run:
 *   node studio/scripts/seed-services-display.mjs           # dry-run preview
 *   node studio/scripts/seed-services-display.mjs --write  # actually write
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

// ── 5 canonical printing services ───────────────────────────────────────────
const SERVICES = [
  {
    _id: "service.custom-fabric-printing",
    slug: "custom-fabric-printing",
    title: "Custom Fabric Printing",
    shortDescription:
      "Full-color custom printing on polyester, canvas and specialty fabrics. Dye-sublimation and UV printing available.",
    description:
      "Our custom fabric printing service delivers vibrant, durable prints on a wide range of fabric substrates. Ideal for event tents, backdrops, banners, flags and promotional textiles. We offer both dye-sublimation (for polyester) and UV printing (for mixed substrates) depending on your material requirements.",
    sortOrder: 10,
    isActive: true,
    benefits: [
      { _key: "b1", title: "Vibrant full-color reproduction", description: "CMYK + extended gamut delivers photographic quality prints." },
      { _key: "b2", title: "Washable and weather-resistant", description: "Ink bonds at high temperature for long-term durability." },
      { _key: "b3", title: "Custom sizes up to 5m wide", description: "Seamless panel printing available for large-format applications." },
    ],
    supportedMaterials: [
      "Polyester fabric",
      "Polyester canvas",
      "Spandex / stretch fabric",
      "Performance fabric",
      "Recycled polyester",
    ],
    suitableApplications: [
      "Event tents and canopies",
      "Trade show backdrops",
      "Promotional flags",
      "Retail fabric displays",
      "Sports banners",
    ],
    artworkRequirements:
      "AI/PDF vector preferred. 300 DPI minimum at print size. CMYK color mode. 3mm bleed on all sides. Include embedded fonts or convert to outlines.",
    processSteps: [
      { _key: "s1", stepNumber: 1, title: "Artwork submission", description: "Upload your print-ready artwork via our RFQ form or email." },
      { _key: "s2", stepNumber: 2, title: "Material selection", description: "Choose your fabric substrate and printing method." },
      { _key: "s3", stepNumber: 3, title: "Sample approval", description: "We produce a small sample for your sign-off before mass production." },
      { _key: "s4", stepNumber: 4, title: "Production", description: "Full production run with quality inspection at each stage." },
      { _key: "s5", stepNumber: 5, title: "Quality check & shipping", description: "Final QC and packaging for freight or express delivery." },
    ],
  },
  {
    _id: "service.dye-sublimation-printing",
    slug: "dye-sublimation-printing",
    title: "Dye Sublimation Printing",
    shortDescription:
      "High-definition dye-sublimation printing for polyester fabrics. Soft-handle finish with photographic color quality.",
    description:
      "Dye-sublimation printing uses heat to transfer dye directly into polyester fibers, producing vibrant, wash-resistant prints with a soft-handle feel. This method is ideal for tension fabric structures, stretch displays and high-end promotional textiles where print quality and fabric drape are equally important.",
    sortOrder: 20,
    isActive: true,
    benefits: [
      { _key: "b1", title: "Photographic print quality", description: "300–720 DPI resolution with continuous-tone color." },
      { _key: "b2", title: "Soft-handle fabric finish", description: "Ink becomes part of the fiber — no surface coating or cracking." },
      { _key: "b3", title: "Washable and UV-stable", description: "Suitable for outdoor use and repeated laundering." },
    ],
    supportedMaterials: [
      "Polyester 170g–300g",
      "Tension fabric (stretch polyester)",
      "Polyester mesh",
      "Performance athletic fabric",
      "Soft-shell fabric",
    ],
    suitableApplications: [
      "Tension fabric backdrops",
      "Stretch display systems",
      "Sports and team apparel displays",
      "Indoor-outdoor banners",
      "Promotional textile products",
    ],
    artworkRequirements:
      "High-resolution files (300 DPI at print size). CMYK color mode. Note: white ink is not available — design must account for base fabric color. Provide Pantone references for color-critical work.",
    processSteps: [
      { _key: "s1", stepNumber: 1, title: "Artwork review", description: "We check your files for color space and resolution." },
      { _key: "s2", stepNumber: 2, title: "Dye-sublimation transfer printing", description: "Print on transfer paper, then heat-press onto polyester." },
      { _key: "s3", stepNumber: 3, title: "Quality inspection", description: "Color density and sharpness checked against approved proof." },
      { _key: "s4", stepNumber: 4, title: "Finishing & shipping", description: "Hemming, grommets or frame sleeve added as specified." },
    ],
  },
  {
    _id: "service.custom-logo-printing",
    slug: "custom-logo-printing",
    title: "Custom Logo Printing",
    shortDescription:
      "Logo, brand and graphic printing on existing products — tents, chairs, flags, banners and more.",
    description:
      "Add your brand identity to display equipment with precision logo printing. Whether you need single-color screen printing or full-color digital printing, we match your brand guidelines and apply graphics to a wide range of display products including tent tops, chair cushions, flag banners and banner stands.",
    sortOrder: 30,
    isActive: true,
    benefits: [
      { _key: "b1", title: "Brand consistency", description: "Pantone-matched colors with ±1 dE tolerance." },
      { _key: "b2", title: "Multiple print methods", description: "Screen printing, digital printing and heat-transfer available." },
      { _key: "b3", title: "Small to large runs", description: "From single custom pieces to 500+ unit production." },
    ],
    supportedMaterials: [
      "Polyester tent fabric",
      "Vinyl banner material",
      "Aluminum panels",
      "Chair cushion covers",
      "Fabric banners",
    ],
    suitableApplications: [
      "Branded event tents",
      "Corporate chair covers",
      "Logo flags and banners",
      "Sponsor signage",
      "Co-branded promotional items",
    ],
    artworkRequirements:
      "Vector AI/PDF files with embedded or outlined fonts. Pantone Coated color references. Minimum 150 DPI for digital printing. Screen printing requires spot-color separations.",
    processSteps: [
      { _key: "s1", stepNumber: 1, title: "Logo artwork review", description: "We verify your logo files and recommend the best print method." },
      { _key: "s2", stepNumber: 2, title: "Print method selection", description: "Screen, digital or heat-transfer — based on material and quantity." },
      { _key: "s3", stepNumber: 3, title: "Proof approval", description: "Digital or physical proof for your sign-off." },
      { _key: "s4", stepNumber: 4, title: "Production", description: "Print and apply graphics to your product or substrate." },
    ],
  },
  {
    _id: "service.large-format-printing",
    slug: "large-format-printing",
    title: "Large-Format Printing",
    shortDescription:
      "Wide-format UV and solvent printing for vinyl, PVC, mesh and rigid substrates up to 5 meters wide.",
    description:
      "Large-format printing for oversized graphics on flexible and rigid substrates. Suitable for building wraps, stage backdrops, vehicle graphics, scaffolding banners and any application requiring prints wider than standard formats. UV-cured inks provide long-term outdoor durability without lamination.",
    sortOrder: 40,
    isActive: true,
    benefits: [
      { _key: "b1", title: "Up to 5m seamless width", description: "No拼接 seams on most wide-format applications." },
      { _key: "b2", title: "UV-cured outdoor durability", description: "No lamination required — resists fading and scratches." },
      { _key: "b3", title: "Rigid and flexible substrates", description: "Vinyl, mesh, canvas, PVC board, acrylic and aluminum composite." },
    ],
    supportedMaterials: [
      "PVC banner vinyl",
      "Mesh banner with wind vents",
      "Canvas",
      "PVC board (foam core)",
      "Aluminum composite panel",
      "Acrylic sheet",
      "Wall vinyl (wallpaper)",
    ],
    suitableApplications: [
      "Building wraps and scaffolding banners",
      "Stage and event backdrops",
      "Vehicle and fleet graphics",
      "Retail window graphics",
      "Exhibition hall signage",
      "Outdoor billboard substitutes",
    ],
    artworkRequirements:
      "1:1 scale preferred for large format. Minimum 100 DPI at final print size for UV printing. CMYK or Pantone references. Include 50mm bleed for hem and grommet edges. Mesh files need a minimum 30% transparency/open area.",
    processSteps: [
      { _key: "s1", stepNumber: 1, title: "Size confirmation", description: "Confirm exact dimensions and substrate specification." },
      { _key: "s2", stepNumber: 2, title: "Artwork production", description: "High-resolution file preparation and proofing." },
      { _key: "s3", stepNumber: 3, title: "Wide-format print", description: "UV or solvent printing on selected substrate." },
      { _key: "s4", stepNumber: 4, title: "Finishing", description: "Cutting, hemming, eyelets, pole pockets or adhesive application." },
      { _key: "s5", stepNumber: 5, title: "Packing & dispatch", description: "Rolled or flat-packed to prevent creasing." },
    ],
  },
  {
    _id: "service.artwork-design-setup",
    slug: "artwork-design-setup",
    title: "Artwork Design & Setup",
    shortDescription:
      "Professional print-ready file preparation, graphic design and pre-press services for custom display products.",
    description:
      "Not ready with artwork? Our in-house design team converts your ideas, brand assets or rough concepts into print-ready files. Services include brand guideline application, image retouching, vectorization of logos, layout composition for large-format prints, and full pre-press file preparation to ensure your graphics print perfectly the first time.",
    sortOrder: 50,
    isActive: true,
    benefits: [
      { _key: "b1", title: "Print-ready guarantee", description: "Files pass our pre-flight check before going to production." },
      { _key: "b2", title: "Brand-consistent design", description: "We apply your brand colors, fonts and logo correctly." },
      { _key: "b3", title: "One-stop solution", description: "Design, file prep and production in a single workflow." },
    ],
    supportedMaterials: [
      // N/A — this is a service, not a print substrate type
    ],
    suitableApplications: [
      "Custom display graphics from scratch",
      "Logo vectorization and brand file cleanup",
      "Large-format layout composition",
      "Template customization",
      "Multi-language graphic adaptation",
    ],
    artworkRequirements:
      "Provide any brand guidelines (Pantone books, font files, logo source files). Reference images, sketches or mood boards are helpful. Describe the intended display product and dimensions.",
    processSteps: [
      { _key: "s1", stepNumber: 1, title: "Brief intake", description: "Share your brand assets, concept description and target dimensions." },
      { _key: "s2", stepNumber: 2, title: "Design concept", description: "We prepare 1–2 layout concepts for your review." },
      { _key: "s3", stepNumber: 3, title: "Revision round", description: "Adjust layout, colors and copy based on your feedback." },
      { _key: "s4", stepNumber: 4, title: "Print-ready file delivery", description: "Final PDF/X-4 or AI file with embedded fonts and bleeds." },
    ],
  },
];

async function upsertService(item) {
  const doc = {
    _id: item._id,
    _type: "service",
    title: item.title,
    slug: { _type: "slug", current: item.slug },
    shortDescription: item.shortDescription,
    description: item.description,
    sortOrder: item.sortOrder,
    isActive: item.isActive,
    benefits: item.benefits,
    supportedMaterials: item.supportedMaterials,
    suitableApplications: item.suitableApplications,
    artworkRequirements: item.artworkRequirements,
    processSteps: item.processSteps,
  };
  if (WRITE) {
    await client.createOrReplace(doc);
  }
  return doc;
}

async function main() {
  console.log(
    `\n${WRITE ? "Writing" : "Preview"} ${SERVICES.length} printing service documents...\n`,
  );

  for (const s of SERVICES) {
    const action = WRITE ? "Upserted" : "Would upsert";
    console.log(
      `  ${action}: ${s._id.padEnd(40)} /${s.slug.padEnd(30)} "${s.title}"`,
    );
    await upsertService(s);
  }

  console.log(
    `\n${WRITE ? "Done" : "Dry-run complete"} — ${SERVICES.length} services.\n`,
  );
  if (!WRITE) {
    console.log("Run with --write to actually create/update documents.\n");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
