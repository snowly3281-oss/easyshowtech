import {createHash} from "node:crypto";
import {promises as fs} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createClient} from "@sanity/client";

const projectId = process.env.SANITY_PROJECT_ID || "p3d22f8w";
const dataset = process.env.SANITY_DATASET || "production";
const token = process.env.SANITY_WRITE_TOKEN;
const languages = ["es", "fr", "de", "it"];
const sourceId = "internal-static-ui-copy";
const jobId = "translationJob.internal-static-ui-copy";
const maxWaitMs = 8 * 60 * 1000;
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const outputPath = path.join(root, "src/i18n/static.generated.json");

if (!token) {
  throw new Error("SANITY_WRITE_TOKEN is required in studio/.env.");
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: "2026-07-27",
  useCdn: false,
  perspective: "raw",
});

async function walk(directory) {
  const entries = await fs.readdir(directory, {withFileTypes: true});
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(target)));
    else if (/\.(?:astro|ts|tsx)$/.test(entry.name)) files.push(target);
  }
  return files;
}

function decodeLiteral(quote, value) {
  if (quote === "`" && value.includes("${")) return null;
  try {
    return JSON.parse(`"${value.replaceAll('"', '\\"')}"`);
  } catch {
    return value
      .replaceAll("\\'", "'")
      .replaceAll('\\"', '"')
      .replaceAll("\\n", "\n");
  }
}

async function extractCopy() {
  const phrases = new Set();
  const files = await walk(path.join(root, "src"));
  const pattern = /\bt\(\s*(["'`])((?:\\.|(?!\1)[\s\S])*?)\1\s*\)/g;
  for (const file of files) {
    const source = await fs.readFile(file, "utf8");
    for (const match of source.matchAll(pattern)) {
      const phrase = decodeLiteral(match[1], match[2])?.trim();
      if (phrase && /[A-Za-z]/.test(phrase)) phrases.add(phrase);
    }
  }
  const legalFallbacks = JSON.parse(
    await fs.readFile(
      path.join(root, "src/i18n/legal-fallbacks.json"),
      "utf8",
    ),
  );
  const collectStrings = (value) => {
    if (typeof value === "string") {
      const phrase = value.trim();
      if (phrase && /[A-Za-z]/.test(phrase)) phrases.add(phrase);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(collectStrings);
      return;
    }
    if (value && typeof value === "object") {
      Object.values(value).forEach(collectStrings);
    }
  };
  collectStrings(legalFallbacks);
  return [...phrases].sort((left, right) => left.localeCompare(right));
}

function keyFor(text) {
  return `copy-${createHash("sha1").update(text).digest("hex").slice(0, 20)}`;
}

function targetId(language) {
  return `${sourceId}-${language}`;
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForJob() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < maxWaitMs) {
    const job = await client.getDocument(jobId);
    if (["completed", "failed", "skipped"].includes(job?.status)) return job;
    await sleep(2000);
  }
  throw new Error("Timed out waiting for static UI translation.");
}

const phrases = await extractCopy();
if (phrases.length === 0) {
  throw new Error("No t('…') interface strings were found.");
}

await client.createOrReplace({
  _id: sourceId,
  _type: "uiCopyCatalog",
  language: "en",
  title: "Internal static interface copy",
  entries: phrases.map((text) => ({
    _key: keyFor(text),
    _type: "uiCopyEntry",
    text,
  })),
});
await client.createOrReplace({
  _id: jobId,
  _type: "translationJob",
  sourceId,
  targetLanguages: languages,
  status: "pending",
  requestedAt: new Date().toISOString(),
  requestedBy: "sync-static-ui-translations.mjs",
});

const job = await waitForJob();
if (job?.status !== "completed") {
  throw new Error(job?.error || `Static UI translation ${job?.status}.`);
}

const targets = await Promise.all(
  languages.map((language) => client.getDocument(targetId(language))),
);
const sourceByKey = new Map(
  phrases.map((text) => [keyFor(text), text]),
);
const output = Object.fromEntries(
  languages.map((language, index) => [
    language,
    Object.fromEntries(
      (targets[index]?.entries || [])
        .map((entry) => [
          sourceByKey.get(entry._key),
          entry.text,
        ])
        .filter(([english, translated]) => english && translated),
    ),
  ]),
);

await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      sourcePhrases: phrases.length,
      languages,
      outputPath,
    },
    null,
    2,
  ),
);
