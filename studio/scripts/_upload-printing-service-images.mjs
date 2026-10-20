/**
 * Upload the five printing-service PNGs to Sanity Assets and write their
 * image references into each service document's heroImage + cardImage.
 *
 * Each service uses the same PNG for both fields (per the user).
 *
 * Safety:
 *   - Without `apply` the script prints the plan and exits.
 *   - With `apply` it uploads missing assets, then patches the 5 service
 *     documents in a single transaction.
 *   - Idempotent: re-runs upload only when the asset is missing; patches
 *     only set heroImage/cardImage (does not touch other fields).
 *   - Never deletes or creates new service documents.
 *
 *   node scripts/_upload-printing-service-images.mjs           # dry-run
 *   node scripts/_upload-printing-service-images.mjs apply     # apply
 */
import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";
import { createReadStream } from "node:fs";

const APPLY = process.argv.includes("apply");

const IMAGES_DIR =
  "C:/Users/ADMIN/Desktop/easyshow_printing_services_catalog/images";

// Mapping per the CSV header imageAlt field.
const PLAN = [
  {
    file: "custom-fabric-printing.png",
    serviceId: "service.custom-fabric-printing",
    alt: "Custom Fabric Printing service concept image",
  },
  {
    file: "dye-sublimation-printing.png",
    serviceId: "service.dye-sublimation-printing",
    alt: "Dye Sublimation Printing service concept image",
  },
  {
    file: "custom-logo-printing.png",
    serviceId: "service.custom-logo-printing",
    alt: "Custom Logo Printing service concept image",
  },
  {
    file: "large-format-printing.png",
    serviceId: "service.large-format-printing",
    alt: "Large-Format Printing service concept image",
  },
  {
    file: "artwork-design-setup.png",
    serviceId: "service.artwork-design-setup",
    alt: "Artwork Design & Setup service concept image",
  },
];

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

function checkLocalFiles() {
  console.log(`\n━━━ STEP 1 — Local files in ${IMAGES_DIR} ━━━\n`);
  const missing = [];
  for (const p of PLAN) {
    const fp = path.join(IMAGES_DIR, p.file);
    if (!fs.existsSync(fp)) {
      missing.push(p.file);
      console.log(`  !! MISSING: ${p.file}`);
    } else {
      const sz = fs.statSync(fp).size;
      console.log(`  ✔ ${p.file}  (${(sz / 1024).toFixed(1)} KB)`);
    }
  }
  return missing;
}

async function checkServiceDocs() {
  console.log(`\n━━━ STEP 2 — Service docs in Sanity ━━━\n`);
  const ids = PLAN.map((p) => p.serviceId);
  const docs = await c.fetch(
    `*[_type=="service" && _id in $ids]{
      _id, title, "slug": slug.current, isActive,
      "hasHero": heroImage.asset != null, "hasCard": cardImage.asset != null
    }`,
    { ids },
  );
  const byId = new Map(docs.map((d) => [d._id, d]));
  const issues = [];
  for (const p of PLAN) {
    const d = byId.get(p.serviceId);
    if (!d) {
      console.log(`  !! MISSING in Sanity: ${p.serviceId}`);
      issues.push(p.serviceId);
    } else {
      console.log(
        `  ✔ ${d._id}  slug=${d.slug}  isActive=${d.isActive}  hero=${d.hasHero}  card=${d.hasCard}  "${d.title}"`,
      );
    }
  }
  return { byId, issues };
}

async function findExistingAssetId(filename) {
  return c.fetch(
    `*[_type=="sanity.imageAsset" && originalFilename==$f][0]{_id}`,
    { f: filename },
  );
}

async function ensureAsset(filename) {
  const fp = path.join(IMAGES_DIR, filename);
  const existing = await findExistingAssetId(filename);
  if (existing?._id) {
    console.log(`    ↻ reuse existing asset ${filename} → ${existing._id}`);
    return existing._id;
  }
  if (!APPLY) {
    console.log(`    ↑ would upload: ${filename}`);
    return `__pending__`;
  }
  const asset = await c.assets.upload("image", createReadStream(fp), {
    filename,
    contentType: "image/png",
  });
  console.log(`    ↑ uploaded ${filename} → ${asset._id}`);
  return asset._id;
}

async function main() {
  console.log(
    `\n━━━ PRINTING SERVICE IMAGES — ${APPLY ? "APPLY" : "DRY RUN"} ━━━\n`,
  );
  const localMissing = checkLocalFiles();
  if (localMissing.length) {
    console.log(`\n!! Local files missing: ${localMissing.join(", ")}\n`);
    process.exit(1);
  }

  const { byId, issues } = await checkServiceDocs();
  if (issues.length) {
    console.log(`\n!! Service docs missing: ${issues.join(", ")}\n`);
    process.exit(1);
  }

  console.log(`\n━━━ STEP 3 — Asset upload plan ━━━\n`);
  const assetByFilename = {};
  for (const p of PLAN) {
    const id = await ensureAsset(p.file);
    assetByFilename[p.file] = id;
  }

  console.log(`\n━━━ STEP 4 — Patch plan (heroImage + cardImage on each service) ━━━\n`);
  const transaction = c.transaction();
  let queued = 0;
  for (const p of PLAN) {
    const assetId = assetByFilename[p.file];
    if (assetId === "__pending__" && !APPLY) {
      console.log(`  ${p.serviceId}  ← ${p.file}  (would patch with pending asset)`);
      continue;
    }
    if (!APPLY) continue;
    transaction.patch(p.serviceId, (patch) =>
      patch
        .set({
          heroImage: {
            _type: "image",
            asset: { _type: "reference", _ref: assetId },
            alt: p.alt,
          },
        })
        .set({
          cardImage: {
            _type: "image",
            asset: { _type: "reference", _ref: assetId },
            alt: p.alt,
          },
        }),
    );
    queued += 1;
    console.log(`  ${p.serviceId}  ← ${p.file}  → heroImage + cardImage (alt="${p.alt}")`);
  }

  if (!APPLY) {
    console.log(`\nTo apply: node scripts/_upload-printing-service-images.mjs apply\n`);
    process.exit(0);
  }

  if (queued === 0) {
    console.log(`\nNothing to patch.\n`);
    process.exit(0);
  }

  console.log(`\nCommitting ${queued} patch(es)…`);
  const r = await transaction.commit();
  console.log(`✔ Committed. transactionId=${r.transactionId}\n`);

  console.log(`\n━━━ VERIFY ━━━\n`);
  const after = await c.fetch(
    `*[_type=="service" && coalesce(language, "en") == "en"]|order(sortOrder asc){
      _id, title,
      "hero": heroImage.asset->originalFilename,
      "card": cardImage.asset->originalFilename,
      "heroAlt": heroImage.alt,
      "cardAlt": cardImage.alt,
    }`,
  );
  for (const s of after) {
    console.log(`  ${s._id}`);
    console.log(`    hero: ${s.hero ?? "(none)"}  alt="${s.heroAlt}"`);
    console.log(`    card: ${s.card ?? "(none)"}  alt="${s.cardAlt}"`);
  }
  console.log(``);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});