import {createClient} from "@sanity/client";

const projectId = process.env.SANITY_PROJECT_ID || "p3d22f8w";
const dataset = process.env.SANITY_DATASET || "production";
const token = process.env.SANITY_WRITE_TOKEN;
const languages = ["es", "fr", "de", "it"];
const documentTypes = [
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

if (!token) {
  throw new Error("SANITY_WRITE_TOKEN is required in studio/.env.");
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: "2026-07-27",
  useCdn: false,
  perspective: "published",
});

const ignoredKeys = new Set([
  "_createdAt",
  "_id",
  "_key",
  "_ref",
  "_rev",
  "_type",
  "_updatedAt",
  "_weak",
  "audience",
  "asset",
  "currency",
  "email",
  "evidence",
  "gtin13",
  "hex",
  "href",
  "icon",
  "kind",
  "language",
  "listItem",
  "marks",
  "mpn",
  "pageKey",
  "phone",
  "priceDisplay",
  "productionStatus",
  "provider",
  "sku",
  "slug",
  "sourceLanguage",
  "status",
  "style",
  "tier",
  "translationOf",
  "translationSourceRevision",
  "translationStatus",
  "url",
  "whatsappNumber",
]);

const intentionallyStable = [
  /^Coral(?: Pilates)?$/i,
  /^(?:OEM|RFQ|SKU|MOQ|B2B|FAQ)$/i,
  /^(?:Reformer|Cadillac|Ladder Barrel|Spine Corrector|Pedi Pole)$/i,
  /^(?:cm|mm|m|m²|kg|lb|lbs|sq ft|USD|EUR)$/i,
  /^[A-Z0-9][A-Z0-9_.:/+ -]{1,24}$/,
  /^#[0-9a-f]{3,8}$/i,
  /^(?:https?:\/\/|mailto:|tel:)/i,
];

function targetId(sourceId, language) {
  return `${sourceId.replaceAll(".", "-")}-${language}`;
}

function isCandidate(value, path, sourceType) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length < 2 || !/[A-Za-z]/.test(trimmed)) return false;
  if (sourceType === "product" && path === "title") return false;
  return !intentionallyStable.some((pattern) => pattern.test(trimmed));
}

function collectExactMatches(source, target, path, sourceType, matches) {
  if (typeof source === "string") {
    if (
      source === target &&
      isCandidate(source, path.join("."), sourceType)
    ) {
      matches.push({path: path.join("."), value: source});
    }
    return;
  }

  if (Array.isArray(source)) {
    if (!Array.isArray(target)) return;
    source.forEach((item, index) => {
      collectExactMatches(item, target[index], [...path, String(index)], sourceType, matches);
    });
    return;
  }

  if (!source || typeof source !== "object") return;
  for (const [key, value] of Object.entries(source)) {
    if (ignoredKeys.has(key) || key.startsWith("_system")) continue;
    collectExactMatches(value, target?.[key], [...path, key], sourceType, matches);
  }
}

const documents = await client.fetch(
  `*[
    _type in $types &&
    !(_id in path("drafts.**"))
  ]`,
  {types: documentTypes},
);
const byId = new Map(documents.map((document) => [document._id, document]));
const sources = documents.filter(
  (document) => (document.language || "en") === "en",
);

const missing = [];
const exactMatches = [];
for (const source of sources) {
  for (const language of languages) {
    const target = byId.get(targetId(source._id, language));
    if (!target) {
      missing.push({
        sourceId: source._id,
        type: source._type,
        language,
      });
      continue;
    }
    const matches = [];
    collectExactMatches(source, target, [], source._type, matches);
    exactMatches.push(
      ...matches.map((match) => ({
        sourceId: source._id,
        type: source._type,
        language,
        ...match,
      })),
    );
  }
}

const grouped = Object.fromEntries(
  documentTypes.map((type) => [
    type,
    {
      sources: sources.filter((document) => document._type === type).length,
      exactMatches: exactMatches.filter((match) => match.type === type).length,
    },
  ]),
);
const exactPathCounts = [...exactMatches.reduce((counts, match) => {
  const normalizedPath = match.path.replaceAll(/\.\d+(?=\.|$)/g, "[]");
  counts.set(normalizedPath, (counts.get(normalizedPath) || 0) + 1);
  return counts;
}, new Map())]
  .sort((left, right) => right[1] - left[1])
  .slice(0, 100)
  .map(([path, count]) => ({path, count}));

console.log(
  JSON.stringify(
    {
      sourceDocuments: sources.length,
      expectedTranslations: sources.length * languages.length,
      missingTranslations: missing.length,
      suspiciousExactMatches: exactMatches.length,
      grouped,
      exactPathCounts,
      missing,
      sampleExactMatches: exactMatches.slice(0, 100),
    },
    null,
    2,
  ),
);

if (missing.length > 0) process.exitCode = 1;
