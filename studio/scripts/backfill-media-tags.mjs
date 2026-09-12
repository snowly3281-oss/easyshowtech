/**
 * Build and apply Coral's controlled Media tag vocabulary.
 *
 * Safety:
 * - Dry-run is the default; set APPLY=1 to write.
 * - Existing manual tags are preserved.
 * - No assets or content documents are deleted.
 * - Assets without a reliable document/SKU relationship receive only
 *   `scope-unassigned`.
 *
 * Run from the repository root:
 *   node --env-file=studio/.env studio/scripts/backfill-media-tags.mjs
 *   APPLY=1 node --env-file=studio/.env studio/scripts/backfill-media-tags.mjs
 */
import { createClient } from "@sanity/client";
import {
  CONTROLLED_MEDIA_TAGS,
  ensureMediaTagDocuments,
  filenameRoleTags,
  prefixedTag,
  productBaseTags,
  tagReferences,
} from "./lib/media-tags.mjs";

const PROJECT_ID = "p3d22f8w";
const DATASET = "production";
const API_VERSION = "2026-03-01";
const APPLY = process.env.APPLY === "1";
const token = process.env.SANITY_WRITE_TOKEN;

if (!token) throw new Error("SANITY_WRITE_TOKEN missing (studio/.env).");

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  token,
  useCdn: false,
  perspective: "raw",
});

const CONTENT_TYPES = [
  "product",
  "solution",
  "post",
  "home",
  "oem",
  "siteSettings",
  "series",
];

function addTags(plan, assetId, tags) {
  if (!assetId) return;
  const existing = plan.get(assetId) ?? new Set();
  for (const tag of tags.filter(Boolean)) existing.add(tag);
  plan.set(assetId, existing);
}

function walkAssets(value, path, callback) {
  if (!value || typeof value !== "object") return;

  if (
    typeof value.asset?._ref === "string" &&
    /^(image|file)-/.test(value.asset._ref)
  ) {
    callback(value.asset._ref, path);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      walkAssets(item, [...path, String(index)], callback),
    );
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    if (key.startsWith("_resolved")) continue;
    walkAssets(child, [...path, key], callback);
  }
}

function scopeTags(document) {
  switch (document._type) {
    case "product":
      return productBaseTags({
        sku: document.sku,
        seriesSlug: document._resolvedSeriesSlug,
        legacyEquipmentSlug: document._resolvedLegacyEquipmentSlug,
        equipmentSlugs: document._resolvedEquipmentSlugs,
      });
    case "solution":
      return [
        "scope-solution",
        prefixedTag("solution", document.slug?.current),
      ].filter(Boolean);
    case "post":
      return ["scope-post"];
    case "home":
      return ["scope-home"];
    case "oem":
      return ["scope-oem"];
    case "siteSettings":
      return ["scope-site"];
    case "series":
      return [
        "scope-series",
        prefixedTag("series", document.slug?.current),
      ].filter(Boolean);
    default:
      return [];
  }
}

function pathRoleTags(documentType, path, asset) {
  const joined = path.join(".").toLowerCase();
  const tags = filenameRoleTags(asset?.originalFilename);

  if (asset?._type === "sanity.fileAsset") {
    tags.push(joined.includes("video") ? "role-video" : "role-document");
  } else if (joined.includes("mainimage")) {
    tags.push("role-featured");
  } else if (joined.includes("gallery")) {
    tags.push("role-gallery");
  } else if (joined.includes("layoutimage")) {
    tags.push("role-layout");
  } else if (joined.includes("coverimage")) {
    tags.push("role-blog-cover");
  } else if (joined.includes("ogimage")) {
    tags.push("role-social");
  } else if (
    joined.includes("backgroundimage") ||
    joined === "hero.image" ||
    joined.startsWith("hero.image.")
  ) {
    tags.push("role-hero");
  } else if (joined.includes("factory") && joined.includes("image")) {
    tags.push("role-factory");
  } else if (documentType === "series" && joined.includes("image")) {
    tags.push("role-featured");
  } else {
    tags.push("role-content");
  }

  return [...new Set(tags)];
}

function findProductByFilename(filename, products) {
  const value = String(filename ?? "").toLowerCase();
  return products.find((product) => {
    const sku = String(product.sku ?? "").toLowerCase();
    return sku && value.includes(sku);
  });
}

async function loadData() {
  const [assets, documents] = await Promise.all([
    client.fetch(
      `*[_type in ["sanity.imageAsset", "sanity.fileAsset"]]{
        _id,
        _rev,
        _type,
        originalFilename,
        "tagIds": opt.media.tags[]._ref
      }`,
    ),
    client.fetch(
      `*[
        _type in $types &&
        !(_id in path("drafts.**"))
      ]{
        ...,
        "_resolvedSeriesSlug": series->slug.current,
        "_resolvedLegacyEquipmentSlug": equipment->slug.current,
        "_resolvedEquipmentSlugs": equipmentTypes[]->slug.current
      }`,
      { types: CONTENT_TYPES },
      { perspective: "drafts" },
    ),
  ]);
  return { assets, documents };
}

async function main() {
  const { assets, documents } = await loadData();
  const assetsById = new Map(assets.map((asset) => [asset._id, asset]));
  const products = documents
    .filter((document) => document._type === "product")
    .map((document) => ({
      sku: document.sku,
      seriesSlug: document._resolvedSeriesSlug,
      legacyEquipmentSlug: document._resolvedLegacyEquipmentSlug,
      equipmentSlugs: document._resolvedEquipmentSlugs,
    }));
  const plan = new Map();

  for (const document of documents) {
    const baseTags = scopeTags(document);
    walkAssets(document, [], (assetId, path) => {
      const asset = assetsById.get(assetId);
      addTags(plan, assetId, [
        ...baseTags,
        ...pathRoleTags(document._type, path, asset),
      ]);
    });
  }

  for (const asset of assets) {
    if (!plan.has(asset._id)) {
      const product = findProductByFilename(asset.originalFilename, products);
      if (product) {
        addTags(plan, asset._id, [
          ...productBaseTags(product),
          ...filenameRoleTags(asset.originalFilename),
          asset.originalFilename?.toLowerCase().includes("featured")
            ? "role-featured"
            : "role-gallery",
        ]);
      } else {
        addTags(plan, asset._id, ["scope-unassigned"]);
      }
    }
  }

  const taxonomyTags = documents.flatMap((document) => {
    if (document._type === "series") {
      return [prefixedTag("series", document.slug?.current)];
    }
    if (document._type === "product") {
      return productBaseTags({
        sku: document.sku,
        seriesSlug: document._resolvedSeriesSlug,
        legacyEquipmentSlug: document._resolvedLegacyEquipmentSlug,
        equipmentSlugs: document._resolvedEquipmentSlugs,
      });
    }
    if (document._type === "solution") {
      return [prefixedTag("solution", document.slug?.current)];
    }
    return [];
  });
  const allTagNames = [
    ...new Set([
      ...CONTROLLED_MEDIA_TAGS,
      ...taxonomyTags,
      ...[...plan.values()].flatMap((tags) => [...tags]),
    ].filter(Boolean)),
  ].sort();

  const existingTags = await client.fetch(
    `*[_type == "media.tag"]{
      _id,
      "name": name.current
    }`,
  );
  const existingIdsByName = new Map(
    existingTags
      .filter((tag) => tag.name)
      .map((tag) => [tag.name, tag._id]),
  );
  const missingTagNames = allTagNames.filter(
    (name) => !existingIdsByName.has(name),
  );

  let assetsNeedingUpdate = 0;
  let referencesToAppend = 0;
  const tagUsage = new Map();
  for (const [assetId, tagNames] of plan) {
    const asset = assetsById.get(assetId);
    if (!asset) continue;
    const existingIds = new Set(asset.tagIds ?? []);
    const missing = [...tagNames].filter((name) => {
      const tagId = existingIdsByName.get(name);
      return !tagId || !existingIds.has(tagId);
    });
    if (missing.length) assetsNeedingUpdate += 1;
    referencesToAppend += missing.length;
    for (const name of tagNames) {
      tagUsage.set(name, (tagUsage.get(name) ?? 0) + 1);
    }
  }

  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}`);
  console.log(`Assets found: ${assets.length}`);
  console.log(`Assets planned: ${plan.size}`);
  console.log(`Controlled/dynamic tags: ${allTagNames.length}`);
  console.log(`New tag documents: ${missingTagNames.length}`);
  console.log(`Assets needing updates: ${assetsNeedingUpdate}`);
  console.log(`Tag references to append: ${referencesToAppend}`);
  console.log(
    `Unassigned assets: ${tagUsage.get("scope-unassigned") ?? 0}`,
  );
  console.log("\nTop planned tags:");
  for (const [name, count] of [...tagUsage.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 30)) {
    console.log(`  ${String(count).padStart(4)}  ${name}`);
  }

  if (!APPLY) {
    console.log("\nDry run complete. No documents were changed.");
    return;
  }

  const idsByName = await ensureMediaTagDocuments(client, allTagNames);
  let patchedAssets = 0;

  for (let index = 0; index < assets.length; index += 20) {
    const batch = assets.slice(index, index + 20);
    let transaction = client.transaction();
    let mutations = 0;

    for (const asset of batch) {
      const tagNames = [...(plan.get(asset._id) ?? [])];
      const existingIds = new Set(asset.tagIds ?? []);
      const missingReferences = tagReferences(tagNames, idsByName).filter(
        (reference) => !existingIds.has(reference._ref),
      );
      if (!missingReferences.length) continue;

      transaction = transaction.patch(asset._id, (patch) =>
        patch
          .ifRevisionId(asset._rev)
          .setIfMissing({ opt: {} })
          .setIfMissing({ "opt.media": {} })
          .setIfMissing({ "opt.media.tags": [] })
          .append("opt.media.tags", missingReferences),
      );
      mutations += 1;
    }

    if (mutations) {
      await transaction.commit();
      patchedAssets += mutations;
      console.log(`Patched assets: ${patchedAssets}/${assetsNeedingUpdate}`);
    }
  }

  console.log(
    `\nComplete. tags=${allTagNames.length} patchedAssets=${patchedAssets}`,
  );
}

main().catch((error) => {
  console.error(error?.message ?? "Media tag backfill failed.");
  process.exit(1);
});
