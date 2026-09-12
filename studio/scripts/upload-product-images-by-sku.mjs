/**
 * Attach a structured local product-image package to existing Sanity products.
 *
 * Expected directory layout:
 *   <root>/<SKU>/featured/*.webp
 *   <root>/<SKU>/multi-angle/*.webp
 *
 * Safety:
 * - SKU matching must be exact and unique.
 * - Exactly one featured image is required for every matched SKU.
 * - Gallery images are de-duplicated by file content.
 * - Existing assets are reused by filename or SHA-1 hash.
 * - Products with existing media are skipped unless FORCE=1.
 * - Product visibility/status and all non-media fields are left unchanged.
 * - Dry-run is the default; set APPLY=1 to upload and patch documents.
 *
 * Run from the repository root:
 *   IMAGE_ROOT=/absolute/path node --env-file=studio/.env \
 *     studio/scripts/upload-product-images-by-sku.mjs
 *
 *   APPLY=1 IMAGE_ROOT=/absolute/path node --env-file=studio/.env \
 *     studio/scripts/upload-product-images-by-sku.mjs
 */
import { createClient } from "@sanity/client";
import {
  createReadStream,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import {
  appendMediaTags,
  ensureMediaTagDocuments,
  filenameRoleTags,
  productBaseTags,
} from "./lib/media-tags.mjs";

const PROJECT_ID = "p3d22f8w";
const DATASET = "production";
const API_VERSION = "2026-03-01";
const IMAGE_ROOT = process.env.IMAGE_ROOT;
const APPLY = process.env.APPLY === "1";
const FORCE = process.env.FORCE === "1";
const ONLY = process.env.ONLY?.trim() || null;
const token = process.env.SANITY_WRITE_TOKEN;

if (!IMAGE_ROOT) throw new Error("IMAGE_ROOT is required.");
if (!token) throw new Error("SANITY_WRITE_TOKEN missing (studio/.env).");

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  token,
  useCdn: false,
  perspective: "raw",
});

function isDirectory(path) {
  return statSync(path).isDirectory();
}

function listWebp(directory) {
  try {
    return readdirSync(directory)
      .filter((filename) => filename.toLowerCase().endsWith(".webp"))
      .map((filename) => ({
        filename,
        path: join(directory, filename),
      }));
  } catch {
    return [];
  }
}

function sha1(path) {
  return createHash("sha1").update(readFileSync(path)).digest("hex");
}

function humanize(value) {
  const text = value
    .replace(/\.webp$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text[0].toUpperCase() + text.slice(1) : "";
}

function filenameParts(filename, sku) {
  const withoutExtension = filename.replace(/\.webp$/i, "");
  const marker = `-${sku.toLowerCase()}-`;
  const markerIndex = withoutExtension.toLowerCase().indexOf(marker);

  if (markerIndex === -1) {
    return {
      description: humanize(withoutExtension),
      suffix: humanize(withoutExtension),
    };
  }

  const beforeSku = withoutExtension.slice(0, markerIndex);
  const afterSku = withoutExtension.slice(markerIndex + marker.length);
  return {
    description: humanize(
      afterSku.toLowerCase() === "featured"
        ? beforeSku
        : `${beforeSku}-${afterSku}`,
    ),
    suffix: humanize(afterSku),
  };
}

function galleryPriority(filename) {
  const value = filename.toLowerCase();
  if (value.includes("front-angle")) return 10;
  if (value.includes("front-view")) return 20;
  if (value.includes("side-angle")) return 30;
  if (value.includes("side-view") || value.includes("side-profile")) return 35;
  if (value.includes("rear-angle") || value.includes("rear-view")) return 40;
  if (value.includes("folded")) return 50;
  if (value.includes("variant") || value.includes("options")) return 60;
  if (value.includes("detail")) return 70;
  if (value.includes("factory")) return 90;
  return 80;
}

function canonicalDuplicatePreference(filename) {
  return /-\d+\.webp$/i.test(filename) ? 1 : 0;
}

function orderGallery(images) {
  return [...images].sort((left, right) => {
    const priority = galleryPriority(left.filename) - galleryPriority(right.filename);
    if (priority !== 0) return priority;
    const duplicatePreference =
      canonicalDuplicatePreference(left.filename) -
      canonicalDuplicatePreference(right.filename);
    if (duplicatePreference !== 0) return duplicatePreference;
    return left.filename.localeCompare(right.filename);
  });
}

function uniqueByContent(images) {
  const seen = new Map();
  const unique = [];
  const duplicates = [];

  for (const image of orderGallery(images)) {
    const hash = sha1(image.path);
    const existing = seen.get(hash);
    if (existing) {
      duplicates.push({ skipped: image.filename, kept: existing.filename, hash });
      continue;
    }
    const withHash = { ...image, hash };
    seen.set(hash, withHash);
    unique.push(withHash);
  }

  return { unique, duplicates };
}

function galleryKey(filename) {
  return `img${createHash("sha1").update(filename).digest("hex").slice(0, 12)}`;
}

function collectPackages() {
  return readdirSync(IMAGE_ROOT)
    .map((name) => ({ name, path: join(IMAGE_ROOT, name) }))
    .filter(({ name, path }) => /^Eleven-[A-Z]{1,3}-RE\d{3}$/i.test(name) && isDirectory(path))
    .filter(({ name }) => !ONLY || name.toLowerCase() === ONLY.toLowerCase())
    .sort((left, right) => left.name.localeCompare(right.name))
    .map(({ name: sku, path }) => {
      const featured = listWebp(join(path, "featured"));
      const galleryResult = uniqueByContent(listWebp(join(path, "multi-angle")));
      return {
        sku,
        featured,
        gallery: galleryResult.unique,
        duplicates: galleryResult.duplicates,
      };
    });
}

async function mapProducts(packages) {
  const skus = packages.map((item) => item.sku);
  const documents = await client.fetch(
    `*[
      _type == "product" &&
      sku in $skus &&
      !(_id in path("drafts.**"))
    ]{
      _id,
      _rev,
      title,
      sku,
      status,
      "seriesSlug": series->slug.current,
      "legacyEquipmentSlug": equipment->slug.current,
      "equipmentSlugs": equipmentTypes[]->slug.current,
      "mainAsset": mainImage.asset._ref,
      "galleryCount": count(gallery)
    }`,
    { skus },
  );

  const bySku = new Map();
  for (const document of documents) {
    const matches = bySku.get(document.sku) ?? [];
    matches.push(document);
    bySku.set(document.sku, matches);
  }

  return bySku;
}

async function loadExistingAssets() {
  const assets = await client.fetch(
    `*[_type == "sanity.imageAsset"]{
      _id,
      originalFilename,
      sha1hash
    }`,
  );

  return {
    byFilename: new Map(
      assets
        .filter((asset) => asset.originalFilename)
        .map((asset) => [asset.originalFilename, asset]),
    ),
    byHash: new Map(
      assets
        .filter((asset) => asset.sha1hash)
        .map((asset) => [asset.sha1hash, asset]),
    ),
  };
}

async function ensureAsset(image, existingAssets) {
  const byFilename = existingAssets.byFilename.get(image.filename);
  if (byFilename) {
    console.log(`    reuse filename ${image.filename} -> ${byFilename._id}`);
    return byFilename._id;
  }

  const hash = image.hash ?? sha1(image.path);
  const byHash = existingAssets.byHash.get(hash);
  if (byHash) {
    console.log(`    reuse content  ${image.filename} -> ${byHash._id}`);
    existingAssets.byFilename.set(image.filename, byHash);
    return byHash._id;
  }

  let asset;
  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      asset = await client.assets.upload(
        "image",
        createReadStream(image.path),
        {
          filename: image.filename,
          contentType: "image/webp",
          extract: ["palette", "blurhash"],
          timeout: 45_000,
        },
      );
      break;
    } catch (error) {
      const isTransient =
        [
          "ECONNRESET",
          "ETIMEDOUT",
          "ESOCKETTIMEDOUT",
          "ECONNABORTED",
          "EPIPE",
          "ENETUNREACH",
        ].includes(error?.code) ||
        /timed?\s*out/i.test(error?.message ?? "") ||
        (error?.statusCode >= 500 && error?.statusCode < 600);

      if (!isTransient || attempt === maxAttempts) {
        throw new Error(
          `Asset upload failed for ${image.filename}: ${error?.code ?? error?.statusCode ?? error?.message ?? "unknown error"}`,
        );
      }

      const delayMs = attempt * 1500;
      console.warn(
        `    retry ${attempt}/${maxAttempts - 1} ${image.filename} (${error?.code ?? error?.statusCode ?? "network error"})`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  console.log(`    uploaded       ${image.filename} -> ${asset._id}`);

  const record = {
    _id: asset._id,
    originalFilename: image.filename,
    sha1hash: asset.sha1hash ?? hash,
  };
  existingAssets.byFilename.set(image.filename, record);
  existingAssets.byHash.set(record.sha1hash, record);
  return asset._id;
}

async function main() {
  const packages = collectPackages();
  const productsBySku = await mapProducts(packages);
  const ready = [];
  const missing = [];
  const ambiguous = [];
  const invalid = [];
  const protectedExisting = [];

  for (const item of packages) {
    const products = productsBySku.get(item.sku) ?? [];
    if (products.length === 0) {
      missing.push(item);
      continue;
    }
    if (products.length > 1) {
      ambiguous.push({ item, products });
      continue;
    }
    if (item.featured.length !== 1) {
      invalid.push({
        item,
        reason: `expected 1 featured image, found ${item.featured.length}`,
      });
      continue;
    }

    const product = products[0];
    if (!FORCE && (product.mainAsset || (product.galleryCount ?? 0) > 0)) {
      protectedExisting.push({ item, product });
      continue;
    }
    ready.push({ item, product });
  }

  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}${FORCE ? " + FORCE" : ""}`);
  console.log(`Image root: ${IMAGE_ROOT}`);
  console.log(`Packages found: ${packages.length}`);
  console.log(`Ready product matches: ${ready.length}`);

  for (const { item, product } of ready) {
    console.log(
      `  ${item.sku} -> ${product._id} | ${product.title} | featured=1 gallery=${item.gallery.length}`,
    );
    for (const duplicate of item.duplicates) {
      console.log(
        `    duplicate skipped: ${duplicate.skipped} (same as ${duplicate.kept})`,
      );
    }
  }

  for (const item of missing) {
    console.log(`  MISSING PRODUCT: ${item.sku} (files not uploaded)`);
  }
  for (const { item, products } of ambiguous) {
    console.log(
      `  AMBIGUOUS SKU: ${item.sku} -> ${products.map((doc) => doc._id).join(", ")}`,
    );
  }
  for (const { item, reason } of invalid) {
    console.log(`  INVALID PACKAGE: ${item.sku} -> ${reason}`);
  }
  for (const { item, product } of protectedExisting) {
    console.log(
      `  EXISTING MEDIA PROTECTED: ${item.sku} -> ${product._id} (use FORCE=1 to replace)`,
    );
  }

  if (!APPLY) {
    console.log("Dry run complete. No assets or documents were changed.");
    return;
  }

  if (ambiguous.length || invalid.length) {
    throw new Error(
      "Upload stopped: resolve ambiguous SKU matches or invalid featured-image counts first.",
    );
  }

  const existingAssets = await loadExistingAssets();
  let patched = 0;

  for (const { item, product } of ready) {
    console.log(`\n  Uploading ${item.sku} — ${product.title}`);
    const featuredFile = {
      ...item.featured[0],
      hash: sha1(item.featured[0].path),
    };
    const mainAssetId = await ensureAsset(featuredFile, existingAssets);

    const gallery = [];
    for (const image of item.gallery) {
      const assetId = await ensureAsset(image, existingAssets);
      const parts = filenameParts(image.filename, item.sku);
      gallery.push({
        _key: galleryKey(image.filename),
        _type: "galleryImage",
        image: {
          _type: "image",
          asset: { _type: "reference", _ref: assetId },
        },
        alt: parts.description,
        label: parts.suffix,
      });
    }

    const mainParts = filenameParts(featuredFile.filename, item.sku);
    const result = await client
      .patch(product._id)
      .ifRevisionId(product._rev)
      .set({
        mainImage: {
          _type: "image",
          asset: { _type: "reference", _ref: mainAssetId },
          alt: mainParts.description,
        },
        gallery,
      })
      .commit();

    const baseTags = productBaseTags(product);
    const assetTags = new Map();
    assetTags.set(
      mainAssetId,
      new Set([
        ...baseTags,
        "role-featured",
        ...filenameRoleTags(featuredFile.filename),
      ]),
    );
    for (let index = 0; index < gallery.length; index += 1) {
      const assetId = gallery[index].image.asset._ref;
      const existing = assetTags.get(assetId) ?? new Set();
      for (const tag of [
        ...baseTags,
        "role-gallery",
        ...filenameRoleTags(item.gallery[index].filename),
      ]) {
        existing.add(tag);
      }
      assetTags.set(assetId, existing);
    }
    const tagNames = [...assetTags.values()].flatMap((tags) => [...tags]);
    const tagIds = await ensureMediaTagDocuments(client, tagNames);
    for (const [assetId, tags] of assetTags) {
      await appendMediaTags(client, assetId, [...tags], tagIds);
    }

    console.log(
      `    patched ${result._id} rev=${result._rev} gallery=${gallery.length}`,
    );
    patched += 1;
  }

  console.log(
    `\nComplete. patched=${patched} missingProducts=${missing.length} protectedExisting=${protectedExisting.length}`,
  );
}

main().catch((error) => {
  console.error(error?.message ?? "Upload failed.");
  process.exit(1);
});
