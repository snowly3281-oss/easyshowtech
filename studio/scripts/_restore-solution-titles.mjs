/**
 * scripts/_restore-solution-titles.mjs
 *
 * Restores solution document titles to their original names in Sanity.
 * slugs / routes are NOT touched — only the `title` field is patched.
 *
 * Run: node studio/scripts/_restore-solution-titles.mjs apply
 */
import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("apply");

function loadEnv() {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, ".env");
    if (fs.existsSync(candidate)) {
      for (const line of fs.readFileSync(candidate, "utf8").split("\n")) {
        const m = line.match(/^([^=]+)=(.*)$/);
        if (m) process.env[m[1].trim()] = m[2].trim();
      }
      return;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
}
loadEnv();

const c = createClient({
  projectId: "w8rk6k6z",
  dataset: "production",
  apiVersion: "2024-10-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

/**
 * Map of solution _id → original title to restore.
 * slugs stay exactly as they are.
 */
const restorePlan = [
  // slug=event-activation → original title Wedding & Party
  {_id: "solution.boutique-studio", newTitle: "Wedding & Party"},
  // slug=trade-show-exhibitor → original title Events & Trade Shows
  {_id: "solution.franchise",       newTitle: "Events & Trade Shows"},
  // slug=retail-pop-up → original title Retail & Pop-Up Stores
  {_id: "solution.hotel-spa",       newTitle: "Retail & Pop-Up Stores"},
  // slug=wedding-and-celebration → original title Religious & Community
  {_id: "solution.home-pt",        newTitle: "Religious & Community"},
  // Photography & Film and Education & Training are already correct — no patch needed
];

async function main() {
  console.log("\n━━━ SOLUTION TITLE RESTORE ━━━\n");

  // 1. Verify current state in Sanity
  const docs = await c.fetch(
    `*[_type=="solution" && coalesce(language, "en") == "en"]|order(_createdAt asc){
      _id, title, "slug": slug.current
    }`,
  );
  const byId = new Map(docs.map((d) => [d._id, d]));

  console.log("Current Sanity state:");
  for (const doc of docs) {
    const step = restorePlan.find((p) => p._id === doc._id);
    if (!step) continue;
    const match = doc.title === step.newTitle ? "✔" : `✘ (current: "${doc.title}")`;
    console.log(`  ${match}  ${doc._id.padEnd(28)} slug=${doc.slug.padEnd(22)} title="${doc.title}"`);
  }

  if (!APPLY) {
    console.log(`\nDry-run complete. Run with "apply" argument to patch Sanity:`);
    console.log(`  node studio/scripts/_restore-solution-titles.mjs apply\n`);
    return;
  }

  // 2. Apply patches — title only, slug untouched
  const transaction = c.transaction();

  for (const step of restorePlan) {
    const doc = byId.get(step._id);
    if (!doc) {
      console.log(`!! Skipping missing: ${step._id}`);
      continue;
    }
    if (doc.title === step.newTitle) {
      console.log(`= Skipping (already correct): ${step._id} "${doc.title}"`);
      continue;
    }
    transaction.patch(step._id, (p) => p.set({ title: step.newTitle }));
    console.log(`  queued → ${step._id}  "${doc.title}" → "${step.newTitle}"`);
  }

  console.log(`\nCommitting patches to Sanity…`);
  const result = await transaction.commit();
  console.log(`✔ Committed. transactionId=${result.transactionId}`);

  // 3. Verify
  console.log(`\nVerification:`);
  const after = await c.fetch(
    `*[_type=="solution" && coalesce(language, "en") == "en"]|order(_createdAt asc){
      _id, title, "slug": slug.current
    }`,
  );
  for (const s of after) {
    const plan = restorePlan.find((p) => p._id === s._id);
    const ok = plan ? s.title === plan.newTitle : true;
    console.log(`  ${ok ? "✔" : "✘"}  ${s.slug.padEnd(22)} "${s.title}"`);
  }

  console.log(`\n✔ Done.\n`);
}

main().catch(console.error);
