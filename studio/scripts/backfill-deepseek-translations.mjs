import {createClient} from "@sanity/client";

const projectId = process.env.SANITY_PROJECT_ID || "p3d22f8w";
const dataset = process.env.SANITY_DATASET || "production";
const token = process.env.SANITY_WRITE_TOKEN;
const apply = process.env.APPLY === "1";
const refreshAll = process.env.REFRESH_ALL === "1";
const sourceFilter = process.env.SOURCE_ID?.trim();
const requestedLanguages = (process.env.LANGUAGES || "es,fr,de,it")
  .split(",")
  .map((language) => language.trim())
  .filter((language) => ["es", "fr", "de", "it"].includes(language));
const concurrency = Math.max(
  1,
  Math.min(3, Number(process.env.CONCURRENCY || "2")),
);
const maxWaitMs = Number(process.env.JOB_TIMEOUT_MS || 8 * 60 * 1000);

if (!token) {
  throw new Error(
    "SANITY_WRITE_TOKEN is required. Keep it in studio/.env and never pass it on the command line.",
  );
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: "2026-07-27",
  useCdn: false,
  perspective: "raw",
});

function targetId(sourceId, language) {
  return `${sourceId.replace(/^drafts\./, "").replaceAll(".", "-")}-${language}`;
}

function jobId(sourceId) {
  return `translationJob.${sourceId
    .replace(/^drafts\./, "")
    .replaceAll(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function buildQueue() {
  const {sources, targets} = await client.fetch(
    `{
      "sources": *[
        _type in ["home","sitePage","oem","series","equipment","product","solution","post","postCategory","postTag"] &&
        coalesce(language, "en") == "en" &&
        !(_id in path("drafts.**")) &&
        (!defined($sourceId) || _id == $sourceId)
      ]{
        _id,
        _type,
        _rev,
        title,
        pageKey
      } | order(_type asc, _id asc),
      "targets": *[
        _type in ["home","sitePage","oem","series","equipment","product","solution","post","postCategory","postTag"] &&
        language in $languages
      ]{
        _id,
        language,
        translationStatus,
        translationSourceRevision
      }
    }`,
    {
      sourceId: sourceFilter || null,
      languages: requestedLanguages,
    },
  );
  const targetsById = new Map(targets.map((target) => [target._id, target]));

  const candidates = [];
  for (const source of sources) {
    const languages = requestedLanguages.filter((language) => {
      const id = targetId(source._id, language);
      const target = targetsById.get(`drafts.${id}`) || targetsById.get(id);
      if (target?.translationStatus === "reviewing") return false;
      return (
        refreshAll ||
        !target ||
        target.translationSourceRevision !== source._rev ||
        target.translationStatus === "failed" ||
        target.translationStatus === "stale"
      );
    });

    if (languages.length > 0) {
      candidates.push({source, languages});
    }
  }

  return {sources, candidates};
}

async function waitForJob(id) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < maxWaitMs) {
    const job = await client.getDocument(id);
    if (["completed", "failed", "skipped"].includes(job?.status)) {
      return job;
    }
    await sleep(2000);
  }
  throw new Error(`Timed out waiting for ${id}.`);
}

async function runCandidate(candidate, index, total) {
  const id = jobId(candidate.source._id);
  await client.createOrReplace({
    _id: id,
    _type: "translationJob",
    sourceId: candidate.source._id,
    targetLanguages: candidate.languages,
    status: "pending",
    requestedAt: new Date().toISOString(),
    requestedBy: "backfill-deepseek-translations.mjs",
  });

  const result = await waitForJob(id);
  const label =
    candidate.source.title ||
    candidate.source.pageKey ||
    candidate.source._id;
  if (result.status !== "completed") {
    throw new Error(
      `[${index + 1}/${total}] ${label}: ${result.error || result.status}`,
    );
  }

  console.log(
    `[${index + 1}/${total}] ${label} → ${candidate.languages
      .map((language) => language.toUpperCase())
      .join(" / ")}`,
  );
  return result;
}

async function runPool(candidates) {
  let cursor = 0;
  const failures = [];

  async function worker() {
    while (cursor < candidates.length) {
      const index = cursor;
      cursor += 1;
      try {
        await runCandidate(candidates[index], index, candidates.length);
      } catch (error) {
        failures.push({
          sourceId: candidates[index].source._id,
          error: error instanceof Error ? error.message : String(error),
        });
        console.error(failures.at(-1).error);
      }
    }
  }

  await Promise.all(
    Array.from(
      {length: Math.min(concurrency, candidates.length)},
      () => worker(),
    ),
  );
  return failures;
}

const {sources, candidates} = await buildQueue();
const translations = candidates.reduce(
  (total, candidate) => total + candidate.languages.length,
  0,
);

console.log(
  JSON.stringify(
    {
      mode: apply ? "apply" : "dry-run",
      refreshAll,
      sourceFilter: sourceFilter || null,
      checkedEnglishDocuments: sources.length,
      queuedSourceDocuments: candidates.length,
      queuedTranslations: translations,
      languages: requestedLanguages,
      concurrency,
      sample: candidates.slice(0, 12).map(({source, languages}) => ({
        sourceId: source._id,
        type: source._type,
        title: source.title || source.pageKey || null,
        languages,
      })),
    },
    null,
    2,
  ),
);

if (!apply || candidates.length === 0) {
  if (!apply && candidates.length > 0) {
    console.log(
      "Dry run only. Re-run with APPLY=1 after the deployed DeepSeek Function passes a small-scope test.",
    );
  }
} else {
  const failures = await runPool(candidates);
  console.log(
    JSON.stringify(
      {
        completedSourceDocuments: candidates.length - failures.length,
        failedSourceDocuments: failures.length,
        failures,
      },
      null,
      2,
    ),
  );

  if (failures.length > 0) process.exitCode = 1;
}
