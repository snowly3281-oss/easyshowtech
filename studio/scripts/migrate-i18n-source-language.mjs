/**
 * Mark legacy public-content documents as English source documents.
 *
 * Safety:
 * - Dry-run by default.
 * - Only documents without `language` are patched.
 * - No content fields, references, publication states or IDs are changed.
 *
 * Run from the repository root:
 *   node --env-file=studio/.env studio/scripts/migrate-i18n-source-language.mjs
 *   APPLY=1 node --env-file=studio/.env studio/scripts/migrate-i18n-source-language.mjs
 */
import {createClient} from "@sanity/client";

const PROJECT_ID = "p3d22f8w";
const DATASET = "production";
const API_VERSION = "2026-07-24";
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

const LOCALIZED_TYPES = [
  "home",
  "sitePage",
  "oem",
  "series",
  "equipment",
  "product",
  "solution",
  "post",
  "postCategory",
  "postTag",
];

const documents = await client.fetch(
  `*[_type in $types && !defined(language)]{
    _id,
    _type,
    _rev
  } | order(_type asc, _id asc)`,
  {types: LOCALIZED_TYPES},
);

const counts = documents.reduce((result, document) => {
  result[document._type] = (result[document._type] ?? 0) + 1;
  return result;
}, {});

console.log(
  JSON.stringify(
    {
      mode: APPLY ? "apply" : "dry-run",
      documents: documents.length,
      byType: counts,
    },
    null,
    2,
  ),
);

if (!APPLY || documents.length === 0) process.exit(0);

for (let index = 0; index < documents.length; index += 50) {
  const batch = documents.slice(index, index + 50);
  let transaction = client.transaction();
  for (const document of batch) {
    transaction = transaction.patch(document._id, (patch) =>
      patch.setIfMissing({language: "en"}),
    );
  }
  await transaction.commit({visibility: "async"});
  console.log(`Patched ${Math.min(index + batch.length, documents.length)}/${documents.length}`);
}

console.log("English source-language migration complete.");
