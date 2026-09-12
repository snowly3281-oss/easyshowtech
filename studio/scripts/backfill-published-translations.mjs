/**
 * Backfill published ES / FR / DE / IT documents for existing English content.
 *
 * The Studio "发布并同步四种语言" action handles future English updates. This
 * migration closes the historical gap for documents that existed before that
 * action was introduced.
 *
 * Audit only:
 *   npm run i18n:backfill:check
 *
 * Translate and publish every missing/stale target:
 *   npm run i18n:backfill
 *
 * Optional controls:
 *   TYPES=sitePage,solution LANGUAGES=es,fr LIMIT=10 CONCURRENCY=2 FORCE=1
 */
import {createClient} from "@sanity/client";
import {randomUUID} from "node:crypto";

const PROJECT_ID = "p3d22f8w";
const DATASET = "production";
const AGENT_API_VERSION = "vX";
const CONTENT_API_VERSION = "2026-07-24";
const SCHEMA_ID =
  process.env.SANITY_TRANSLATION_SCHEMA_ID || "_.schemas.default";
const APPLY = process.env.APPLY === "1";
const FORCE = process.env.FORCE === "1";
const LIMIT = Math.max(0, Number.parseInt(process.env.LIMIT || "0", 10) || 0);
const CONCURRENCY = Math.max(
  1,
  Math.min(4, Number.parseInt(process.env.CONCURRENCY || "2", 10) || 2),
);
const token = process.env.SANITY_WRITE_TOKEN;

const LANGUAGE_TITLES = {
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
};
const DEFAULT_TYPES = [
  "equipment",
  "series",
  "postCategory",
  "postTag",
  "sitePage",
  "oem",
  "post",
  "product",
  "solution",
  "home",
];
const requestedTypes = (process.env.TYPES || DEFAULT_TYPES.join(","))
  .split(",")
  .map((value) => value.trim())
  .filter((value) => DEFAULT_TYPES.includes(value));
const requestedLanguages = (
  process.env.LANGUAGES || Object.keys(LANGUAGE_TITLES).join(",")
)
  .split(",")
  .map((value) => value.trim())
  .filter((value) => value in LANGUAGE_TITLES);

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
if (requestedTypes.length === 0) throw new Error("No valid TYPES selected.");
if (requestedLanguages.length === 0) {
  throw new Error("LANGUAGES must contain one of: es, fr, de, it.");
}

const agentClient = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: AGENT_API_VERSION,
  token,
  useCdn: false,
  perspective: "raw",
});
const contentClient = agentClient.withConfig({
  apiVersion: CONTENT_API_VERSION,
});

function publicTranslationId(sourceId, language) {
  return `${sourceId.replace(/^drafts\./, "").replaceAll(".", "-")}-${language}`;
}

function randomKey() {
  return randomUUID().replaceAll("-", "").slice(0, 12);
}

function preserveSourceFields(source) {
  const preserved = {};
  for (const field of [
    "slug",
    "sku",
    "status",
    "pageKey",
    "route",
    "order",
    "publishedAt",
  ]) {
    if (source[field] !== undefined) preserved[field] = source[field];
  }
  return preserved;
}

async function upsertTranslationMetadata({
  sourceId,
  sourceType,
  targetId,
  targetLanguage,
}) {
  const existingMetadata = await contentClient.fetch(
    `*[_type == "translation.metadata" && references($sourceId)][0]`,
    {sourceId},
  );
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
          _key: randomKey(),
          _type: "internationalizedArrayReferenceValue",
          language: "en",
          // Metadata is a non-owning index; keep source references weak so
          // the normal Studio unpublish/delete lifecycle remains available.
          value: {_type: "reference", _ref: sourceId, _weak: true},
        },
      ];

  await contentClient.createOrReplace({
    ...(existingMetadata ?? {}),
    _id:
      existingMetadata?._id ||
      `translation.metadata.${randomUUID()}`,
    _type: "translation.metadata",
    schemaTypes: [sourceType],
    translations: [
      ...withoutTarget,
      ...sourceReference,
      {
        _key: randomKey(),
        _type: "internationalizedArrayReferenceValue",
        language: targetLanguage,
        value: {_type: "reference", _ref: targetId},
      },
    ],
  });
}

async function translateOne(source, targetLanguage) {
  const targetId = publicTranslationId(source._id, targetLanguage);
  const existingTarget = await contentClient.getDocument(targetId);

  if (
    !FORCE &&
    existingTarget?.translationSourceRevision === source._rev
  ) {
    return {status: "current", sourceId: source._id, targetLanguage, targetId};
  }

  if (!APPLY) {
    return {
      status: existingTarget ? "stale" : "missing",
      sourceId: source._id,
      targetLanguage,
      targetId,
    };
  }

  await agentClient.agent.action.translate({
    schemaId: SCHEMA_ID,
    documentId: source._id,
    targetDocument: {operation: "createOrReplace", _id: targetId},
    fromLanguage: {id: "en", title: "English"},
    toLanguage: {
      id: targetLanguage,
      title: LANGUAGE_TITLES[targetLanguage],
    },
    languageFieldPath: "language",
    styleGuide: STYLE_GUIDE,
    protectedPhrases: PROTECTED_PHRASES,
    temperature: 0,
    forcePublishedWrite: true,
  });

  await contentClient
    .patch(targetId)
    .set({
      ...preserveSourceFields(source),
      language: targetLanguage,
      translationStatus: "approved",
      translationSourceRevision: source._rev,
      translatedAt: new Date().toISOString(),
    })
    .commit();

  await upsertTranslationMetadata({
    sourceId: source._id,
    sourceType: source._type,
    targetId,
    targetLanguage,
  });

  return {status: "translated", sourceId: source._id, targetLanguage, targetId};
}

async function translateSource(source) {
  const results = [];
  for (const targetLanguage of requestedLanguages) {
    let attempt = 0;
    while (attempt < 3) {
      attempt += 1;
      try {
        const result = await translateOne(source, targetLanguage);
        results.push(result);
        console.log(
          `[${result.status}] ${source._type}:${source._id} -> ${targetLanguage}`,
        );
        break;
      } catch (error) {
        if (attempt >= 3) {
          const message =
            error instanceof Error ? error.message : String(error);
          results.push({
            status: "failed",
            sourceId: source._id,
            targetLanguage,
            message,
          });
          console.error(
            `[failed] ${source._type}:${source._id} -> ${targetLanguage}: ${message}`,
          );
          break;
        }
        await new Promise((resolve) =>
          setTimeout(resolve, 750 * 2 ** (attempt - 1)),
        );
      }
    }
  }
  return results;
}

async function mapWithConcurrency(items, worker, concurrency) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(
    Array.from({length: Math.min(concurrency, items.length)}, () => run()),
  );
  return results.flat();
}

const allSources = await contentClient.fetch(
  `*[
    _type in $types &&
    !(_id in path("drafts.**")) &&
    (language == "en" || !defined(language)) &&
    (_type != "product" || status == "published")
  ] | order(_type asc, _id asc)`,
  {types: requestedTypes},
);
const sources = LIMIT > 0 ? allSources.slice(0, LIMIT) : allSources;

console.log(
  JSON.stringify(
    {
      mode: APPLY ? "apply" : "audit",
      force: FORCE,
      documents: sources.length,
      languages: requestedLanguages,
      types: requestedTypes,
      concurrency: CONCURRENCY,
      translationOperations: sources.length * requestedLanguages.length,
    },
    null,
    2,
  ),
);

const results = await mapWithConcurrency(
  sources,
  translateSource,
  APPLY ? CONCURRENCY : 4,
);
const summary = results.reduce((counts, result) => {
  counts[result.status] = (counts[result.status] || 0) + 1;
  return counts;
}, {});

console.log(JSON.stringify({summary}, null, 2));

if (results.some((result) => result.status === "failed")) {
  process.exitCode = 1;
}
