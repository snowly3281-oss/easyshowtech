/**
 * Upload the dedicated series hero files supplied by the client and connect
 * them to the matching Series documents. Professional currently has no
 * dedicated hero file, so it deliberately reuses the verified AR-1 product
 * featured image already in Sanity.
 *
 * Safe defaults:
 * - dry-run unless APPLY=1
 * - does not overwrite an operator-selected image unless FORCE=1
 * - updates both published and draft Series documents when both exist
 *
 * Run from the repository root:
 *   node --env-file=studio/.env studio/scripts/sync-series-images.mjs
 *   APPLY=1 node --env-file=studio/.env studio/scripts/sync-series-images.mjs
 */
import { createClient } from "@sanity/client";
import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import {
  appendMediaTags,
  ensureMediaTagDocuments,
} from "./lib/media-tags.mjs";

const token = process.env.SANITY_WRITE_TOKEN;
if (!token) {
  throw new Error("SANITY_WRITE_TOKEN missing (studio/.env).");
}

const client = createClient({
  projectId: "p3d22f8w",
  dataset: "production",
  apiVersion: "2025-08-15",
  token,
  useCdn: false,
});

const apply = process.env.APPLY === "1";
const force = process.env.FORCE === "1";
const heroDirectory =
  process.env.SERIES_HERO_DIR ??
  join(
    homedir(),
    "Downloads",
    "coral 2",
    "webp-for-cms",
    "02 · Series Hero",
  );

const seriesImages = [
  {
    slug: "wood-maple",
    file: "series-wood-maple-hero-01.webp",
    alt: "Wood maple Pilates reformer in a studio",
  },
  {
    slug: "wood-oak",
    file: "series-wood-oak-hero-01.webp",
    alt: "Wood oak Pilates reformers prepared for a studio",
  },
  {
    slug: "aluminum",
    file: "series-aluminum-hero-01.webp",
    alt: "Aluminum Pilates reformer in a training space",
  },
  {
    slug: "classical",
    file: "series-classical-hero-01.webp",
    alt: "Classical Pilates Cadillac apparatus",
  },
  {
    slug: "professional",
    assetId:
      "image-322192c517a8b1257cc143f25773001e1d3da79e-1000x1000-webp",
    alt: "Professional black aluminum Pilates reformer",
  },
];

async function ensureAsset(item) {
  if (item.assetId) {
    const existing = await client.fetch(
      `*[_type == "sanity.imageAsset" && _id == $assetId][0]{_id}`,
      { assetId: item.assetId },
    );
    if (!existing?._id) {
      throw new Error(
        `Verified Professional source asset is missing: ${item.assetId}`,
      );
    }
    return existing._id;
  }

  const filePath = join(heroDirectory, item.file);
  await access(filePath);

  const existing = await client.fetch(
    `*[_type == "sanity.imageAsset" && originalFilename == $filename][0]{_id}`,
    { filename: item.file },
  );
  if (existing?._id) return existing._id;

  if (!apply) return `(upload ${item.file})`;

  const asset = await client.assets.upload(
    "image",
    createReadStream(filePath),
    {
      filename: item.file,
      contentType: "image/webp",
    },
  );
  return asset._id;
}

async function appendSeriesTags(assetId, tagNames, tagIds) {
  let lastError;

  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      return await appendMediaTags(
        client,
        assetId,
        tagNames,
        tagIds,
      );
    } catch (error) {
      lastError = error;
      if (!String(error?.message).startsWith("Asset not found:")) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }

  throw lastError;
}

async function main() {
  console.log(
    `${apply ? "APPLY" : "DRY RUN"} series image sync; overwrite=${
      force ? "yes" : "no"
    }`,
  );

  const tagNames = [
    "scope-series",
    "role-featured",
    "role-hero",
    ...seriesImages.map((item) => `series-${item.slug}`),
  ];
  const tagIds = apply
    ? await ensureMediaTagDocuments(client, tagNames)
    : new Map();

  const operations = [];

  for (const item of seriesImages) {
    const documents = await client.fetch(
      `*[_type == "series" && slug.current == $slug]{
        _id,
        _rev,
        title,
        "hasImage": defined(image.asset._ref)
      }`,
      { slug: item.slug },
    );

    if (documents.length === 0) {
      throw new Error(`Series document not found: ${item.slug}`);
    }

    const assetId = await ensureAsset(item);
    const targets = documents.filter(
      (document) => force || !document.hasImage,
    );

    console.log(
      `${item.slug}: asset=${assetId}; documents=${documents.length}; patch=${targets.length}`,
    );

    if (!apply) continue;

    await appendSeriesTags(
      assetId,
      [
        "scope-series",
        "role-featured",
        "role-hero",
        `series-${item.slug}`,
      ],
      tagIds,
    );

    for (const document of targets) {
      operations.push({
        document,
        image: {
          _type: "image",
          asset: {
            _type: "reference",
            _ref: assetId,
          },
          alt: item.alt,
        },
      });
    }
  }

  if (!apply) {
    console.log("No data changed. Re-run with APPLY=1 to upload and patch.");
    return;
  }

  let transaction = client.transaction();
  for (const operation of operations) {
    transaction = transaction.patch(operation.document._id, (patch) =>
      patch
        .ifRevisionId(operation.document._rev)
        .set({ image: operation.image }),
    );
  }

  if (operations.length > 0) {
    await transaction.commit({ visibility: "sync" });
  }

  console.log(`Patched ${operations.length} Series document(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
