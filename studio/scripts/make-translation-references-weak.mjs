/**
 * Converts existing translation.metadata references into weak references.
 *
 * Translation metadata is a lookup index, so it must never block operators
 * from unpublishing or deleting English content. The script is safe to rerun:
 * it only patches metadata documents that still contain a strong reference.
 *
 * Audit only:
 *   node --env-file=.env scripts/make-translation-references-weak.mjs
 *
 * Apply:
 *   APPLY=1 node --env-file=.env scripts/make-translation-references-weak.mjs
 */
import {createClient} from "@sanity/client";

const APPLY = process.env.APPLY === "1";
const token = process.env.SANITY_WRITE_TOKEN;

if (!token) throw new Error("SANITY_WRITE_TOKEN missing (studio/.env).");

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || "p3d22f8w",
  dataset: process.env.SANITY_DATASET || "production",
  apiVersion: "2026-07-24",
  token,
  useCdn: false,
  perspective: "raw",
});

const metadataDocuments = await client.fetch(
  `*[_type == "translation.metadata"]{_id, translations}`,
);

const changes = metadataDocuments
  .map((document) => {
    const translations = Array.isArray(document.translations)
      ? document.translations
      : [];
    const nextTranslations = translations.map((translation) => ({
      ...translation,
      value: translation?.value?._ref
        ? {...translation.value, _weak: true}
        : translation?.value,
    }));
    const changed = translations.some(
      (translation) => translation?.value?._ref && translation.value._weak !== true,
    );

    return changed ? {_id: document._id, translations: nextTranslations} : null;
  })
  .filter(Boolean);

console.log(
  `${APPLY ? "Applying" : "Would apply"} weak-reference migration to ${changes.length} translation metadata document(s).`,
);
for (const change of changes.slice(0, 12)) console.log(`- ${change._id}`);
if (changes.length > 12) console.log(`… and ${changes.length - 12} more`);

if (!APPLY || changes.length === 0) process.exit(0);

// A small number of batched mutations is much more reliable than hundreds of
// individual requests (and avoids rate-limit failures on a live dataset).
for (let index = 0; index < changes.length; index += 50) {
  const batch = changes.slice(index, index + 50);
  await client.mutate(
    batch.map((change) => ({
      patch: {id: change._id, set: {translations: change.translations}},
    })),
  );
  console.log(`Updated ${Math.min(index + batch.length, changes.length)}/${changes.length}.`);
}

console.log("Weak-reference migration completed.");
