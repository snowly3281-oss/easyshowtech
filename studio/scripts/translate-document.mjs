/**
 * Generate or refresh one language draft with Sanity Agent Actions Translate.
 *
 * This script intentionally never publishes translations. Legal and commercial
 * copy must be reviewed by a person in Studio before it becomes public.
 *
 * Dry-run (AI result returned, no document written):
 *   SOURCE_ID=home TARGET_LANGUAGE=es npm run i18n:translate:check
 *
 * Create/update a draft and translation metadata:
 *   SOURCE_ID=home TARGET_LANGUAGE=es APPLY=1 npm run i18n:translate
 */
import {createClient} from "@sanity/client";
import {randomUUID} from "node:crypto";

const PROJECT_ID = "p3d22f8w";
const DATASET = "production";
// Agent Actions Translate is experimental and currently exposed only on vX.
// Keep this isolated to the translation utility; regular content reads/writes
// elsewhere in the project continue to use dated stable API versions.
const API_VERSION = "vX";
const SCHEMA_ID = process.env.SANITY_TRANSLATION_SCHEMA_ID || "_.schemas.default";
const APPLY = process.env.APPLY === "1";
const sourceId = process.env.SOURCE_ID;
const targetLanguage = process.env.TARGET_LANGUAGE;
const token = process.env.SANITY_WRITE_TOKEN;

const LANGUAGES = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
};
const LOCALIZED_TYPES = new Set([
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
]);
const STYLE_GUIDE =
  "Translate for a professional B2B Pilates equipment website. Keep the meaning precise, concise and commercially neutral. Do not invent certifications, prices, warranty promises or technical specifications. Preserve SKU codes, model names, dimensions, units, URLs and brand names.";
const PROTECTED_PHRASES = [
  "Coral Pilates",
  "Reformer",
  "Cadillac",
  "Ladder Barrel",
  "Spine Corrector",
  "Pedi Pole",
  "Pilates Chair",
  "OEM",
  "RFQ",
  "SKU",
];

if (!token) throw new Error("SANITY_WRITE_TOKEN missing (studio/.env).");
if (!sourceId) throw new Error("SOURCE_ID is required.");
if (!targetLanguage || !LANGUAGES[targetLanguage] || targetLanguage === "en") {
  throw new Error("TARGET_LANGUAGE must be one of: es, fr, de, it.");
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  token,
  useCdn: false,
  perspective: "raw",
});

const source = await client.getDocument(sourceId);
if (!source) throw new Error(`Published source document not found: ${sourceId}`);
if (!LOCALIZED_TYPES.has(source._type)) {
  throw new Error(`Document type is not enabled for localization: ${source._type}`);
}
if ((source.language ?? "en") !== "en") {
  throw new Error("Only English source documents can trigger translations.");
}

// Dotted document IDs are private Sanity subpaths and cannot be read through
// the anonymous public dataset API. Keep translations at the root path.
const targetId = `${sourceId.replaceAll(".", "-")}-${targetLanguage}`;
const result = await client.agent.action.translate({
  schemaId: SCHEMA_ID,
  documentId: sourceId,
  targetDocument: {operation: "createOrReplace", _id: targetId},
  fromLanguage: {id: "en", title: LANGUAGES.en},
  toLanguage: {
    id: targetLanguage,
    title: LANGUAGES[targetLanguage],
  },
  languageFieldPath: "language",
  styleGuide: STYLE_GUIDE,
  protectedPhrases: PROTECTED_PHRASES,
  temperature: 0,
  noWrite: !APPLY,
});

console.log(
  JSON.stringify(
    {
      mode: APPLY ? "draft-written" : "dry-run",
      sourceId,
      targetId,
      targetLanguage,
      resultId: result?._id,
      title: result?.title ?? result?.hero?.heading ?? null,
    },
    null,
    2,
  ),
);

if (!APPLY) process.exit(0);

const translatedDocumentId = String(result._id || `drafts.${targetId}`);
await client
  .patch(translatedDocumentId)
  .set({
    language: targetLanguage,
    translationStatus: "needsReview",
    translationSourceRevision: source._rev,
    translatedAt: new Date().toISOString(),
  })
  .commit();

const existingMetadata = await client.fetch(
  `*[_type == "translation.metadata" && references($sourceId)][0]`,
  {sourceId},
);
const metadataId = existingMetadata?._id || `translation.metadata.${randomUUID()}`;
const previousTranslations = Array.isArray(existingMetadata?.translations)
  ? existingMetadata.translations
  : [];
const withoutTarget = previousTranslations.filter(
  (reference) => reference?.language !== targetLanguage,
);

const sourceReference = withoutTarget.some(
  (reference) => reference?.language === "en",
)
  ? []
  : [
      {
        _key: randomUUID().replaceAll("-", "").slice(0, 12),
        _type: "internationalizedArrayReferenceValue",
        language: "en",
        // Metadata must not lock the English source against unpublish/delete.
        value: {_type: "reference", _ref: sourceId, _weak: true},
      },
    ];
const targetReference = {
  _key: randomUUID().replaceAll("-", "").slice(0, 12),
  _type: "internationalizedArrayReferenceValue",
  language: targetLanguage,
  value: {
    _type: "reference",
    _ref: targetId,
    _weak: true,
    _strengthenOnPublish: {type: source._type},
  },
};

await client.createOrReplace({
  ...(existingMetadata ?? {}),
  _id: metadataId,
  _type: "translation.metadata",
  schemaTypes: [source._type],
  translations: [...withoutTarget, ...sourceReference, targetReference],
});

console.log(`Translation draft linked in metadata ${metadataId}.`);
