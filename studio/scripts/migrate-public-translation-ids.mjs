/**
 * Move translated documents from dotted private IDs (for example `home.es`)
 * to root-level public IDs (`home-es`).
 *
 * Dotted IDs are Sanity subpaths and cannot be read through the anonymous
 * public dataset API even after they are published.
 *
 * Preview:
 *   npm run i18n:public-ids:check
 *
 * Apply:
 *   npm run i18n:public-ids
 */
import {createClient} from "@sanity/client";

const PROJECT_ID = "p3d22f8w";
const DATASET = "production";
const API_VERSION = "2026-07-24";
const APPLY = process.env.APPLY === "1";
const token = process.env.SANITY_WRITE_TOKEN;
const TARGET_LANGUAGES = ["es", "fr", "de", "it"];

if (!token) throw new Error("SANITY_WRITE_TOKEN missing (studio/.env).");

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  token,
  useCdn: false,
  perspective: "raw",
});

function publicTranslationId(sourceId, language) {
  return `${sourceId.replace(/^drafts\./, "").replaceAll(".", "-")}-${language}`;
}

function cleanDocument(document, nextId) {
  const {
    _createdAt: _discardCreatedAt,
    _rev: _discardRevision,
    _updatedAt: _discardUpdatedAt,
    ...content
  } = document;
  return {...content, _id: nextId};
}

const metadataDocuments = await client.fetch(
  `*[_type == "translation.metadata"]{
    _id,
    _type,
    schemaTypes,
    translations
  }`,
);

const migrations = [];

for (const metadata of metadataDocuments) {
  const sourceReference = metadata.translations?.find(
    (reference) => reference?.language === "en",
  );
  const sourceId = sourceReference?.value?._ref;
  if (!sourceId) continue;

  for (const language of TARGET_LANGUAGES) {
    const reference = metadata.translations?.find(
      (candidate) => candidate?.language === language,
    );
    const oldId = reference?.value?._ref;
    if (!oldId || !oldId.includes(".")) continue;

    const oldPublished = await client.getDocument(oldId);
    const oldDraft = await client.getDocument(`drafts.${oldId}`);
    const newId = publicTranslationId(sourceId, language);

    migrations.push({
      metadataId: metadata._id,
      sourceId,
      language,
      oldId,
      newId,
      hasPublished: Boolean(oldPublished),
      hasDraft: Boolean(oldDraft),
    });

    if (!APPLY) continue;

    const transaction = client.transaction();
    if (oldPublished) {
      transaction.createOrReplace(cleanDocument(oldPublished, newId));
    }
    if (oldDraft) {
      transaction.createOrReplace(
        cleanDocument(oldDraft, `drafts.${newId}`),
      );
    }
    transaction.patch(metadata._id, (patch) =>
      patch.set({
        translations: metadata.translations.map((candidate) => {
          if (candidate?.language !== language) return candidate;
          const {
            _strengthenOnPublish: _discardStrengthenOnPublish,
            _weak: _discardWeak,
            ...referenceValue
          } = candidate.value ?? {};
          return {
            ...candidate,
            value: {
              ...referenceValue,
              _type: "reference",
              _ref: newId,
            },
          };
        }),
      }),
    );
    await transaction.commit();

    const publicCopy = await client.getDocument(newId);
    if (!publicCopy) {
      throw new Error(`Public replacement was not created: ${newId}`);
    }

    const cleanup = client.transaction();
    if (oldPublished) cleanup.delete(oldId);
    if (oldDraft) cleanup.delete(`drafts.${oldId}`);
    await cleanup.commit();

    metadata.translations = metadata.translations.map((candidate) =>
      candidate?.language === language
        ? {
            ...candidate,
            value: {_type: "reference", _ref: newId},
          }
        : candidate,
    );
  }
}

console.log(
  JSON.stringify(
    {
      mode: APPLY ? "applied" : "preview",
      count: migrations.length,
      migrations,
    },
    null,
    2,
  ),
);
