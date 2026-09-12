import { createHash } from "node:crypto";

export const CONTROLLED_MEDIA_TAGS = [
  "scope-product",
  "scope-solution",
  "scope-post",
  "scope-home",
  "scope-oem",
  "scope-site",
  "scope-series",
  "scope-unassigned",
  "role-featured",
  "role-gallery",
  "role-angle-view",
  "role-detail",
  "role-variant",
  "role-lifestyle",
  "role-factory",
  "role-layout",
  "role-blog-cover",
  "role-hero",
  "role-content",
  "role-document",
  "role-video",
  "role-social",
];

export function tagSlug(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function prefixedTag(prefix, value) {
  const slug = tagSlug(value);
  return slug ? `${prefix}-${slug}` : null;
}

export function productBaseTags(product) {
  return [
    "scope-product",
    prefixedTag("sku", product?.sku),
    prefixedTag("series", product?.seriesSlug),
    prefixedTag("equipment", product?.legacyEquipmentSlug),
    ...(product?.equipmentSlugs ?? []).map((slug) =>
      prefixedTag("equipment", slug),
    ),
  ].filter(Boolean);
}

export function filenameRoleTags(filename) {
  const value = String(filename ?? "").toLowerCase();
  const tags = [];

  if (value.includes("featured")) tags.push("role-featured");
  if (value.includes("detail")) tags.push("role-detail");
  if (value.includes("angle")) tags.push("role-angle-view");
  if (
    /(variant|option|colour|color|cream|beige|green|orange|brown-upholstery)/.test(
      value,
    )
  ) {
    tags.push("role-variant");
  }
  if (/(lifestyle|room-scene|in-use)/.test(value)) {
    tags.push("role-lifestyle");
  }
  if (/(factory|production-view)/.test(value)) tags.push("role-factory");
  if (/(layout|floor-plan|floorplan)/.test(value)) tags.push("role-layout");

  return tags;
}

export function referenceKey(tagName) {
  return `tag${createHash("sha1").update(tagName).digest("hex").slice(0, 12)}`;
}

function documentId(tagName) {
  return `media-tag-${tagName}`;
}

export async function ensureMediaTagDocuments(client, tagNames) {
  const uniqueNames = [...new Set(tagNames.filter(Boolean))].sort();
  const existing = await client.fetch(
    `*[_type == "media.tag" && name.current in $names]{
      _id,
      "name": name.current
    }`,
    { names: uniqueNames },
  );
  const idsByName = new Map(
    existing
      .filter((tag) => tag.name)
      .map((tag) => [tag.name, tag._id]),
  );
  const missing = uniqueNames.filter((name) => !idsByName.has(name));

  for (let index = 0; index < missing.length; index += 50) {
    const batch = missing.slice(index, index + 50);
    let transaction = client.transaction();
    for (const name of batch) {
      const _id = documentId(name);
      transaction = transaction.createIfNotExists({
        _id,
        _type: "media.tag",
        name: {
          _type: "slug",
          current: name,
        },
      });
      idsByName.set(name, _id);
    }
    await transaction.commit();
  }

  return idsByName;
}

export function tagReferences(tagNames, idsByName) {
  return [...new Set(tagNames.filter(Boolean))]
    .sort()
    .map((name) => {
      const _ref = idsByName.get(name);
      if (!_ref) return null;
      return {
        _key: referenceKey(name),
        _type: "reference",
        _ref,
        _weak: true,
      };
    })
    .filter(Boolean);
}

export async function appendMediaTags(
  client,
  assetId,
  tagNames,
  idsByName,
) {
  const asset = await client.fetch(
    `*[_id == $assetId][0]{
      _id,
      _rev,
      "tagIds": opt.media.tags[]._ref
    }`,
    { assetId },
  );
  if (!asset) throw new Error(`Asset not found: ${assetId}`);

  const existingIds = new Set(asset.tagIds ?? []);
  const missingReferences = tagReferences(tagNames, idsByName).filter(
    (reference) => !existingIds.has(reference._ref),
  );
  if (missingReferences.length === 0) return false;

  await client
    .patch(asset._id)
    .ifRevisionId(asset._rev)
    .setIfMissing({ opt: {} })
    .setIfMissing({ "opt.media": {} })
    .setIfMissing({ "opt.media.tags": [] })
    .append("opt.media.tags", missingReferences)
    .commit();
  return true;
}
