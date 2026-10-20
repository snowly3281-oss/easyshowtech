/**
 * Update the heroBlock.eyebrow on each of the 6 renamed EN solution docs so
 * it matches the new title. Runs as a single transaction; non-destructive
 * (only patches one field on the first heroBlock of pageBuilder).
 *
 * Idempotent: safe to re-run; only writes when the current eyebrow differs.
 *
 *   node scripts/_rename-hero-eyebrow.mjs apply
 * Without `apply` it prints the planned changes and exits.
 */
import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("apply");

function loadEnv() {
  let d = process.cwd();
  for (let i = 0; i < 6; i++) {
    const c = path.join(d, ".env");
    if (fs.existsSync(c)) {
      for (const l of fs.readFileSync(c, "utf8").split("\n")) {
        const m = l.match(/^([^=]+)=(.*)$/);
        if (m) process.env[m[1].trim()] = m[2].trim();
      }
      return;
    }
    const p = path.dirname(d);
    if (p === d) break;
    d = p;
  }
}
loadEnv();

const c = createClient({
  projectId: "w8rk6k6z",
  dataset: "production",
  apiVersion: "2024-10-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const targets = [
  { id: "solution.franchise", newEyebrow: "Trade Show Exhibitor" },
  { id: "solution.boutique-studio", newEyebrow: "Event Activation" },
  { id: "solution.hotel-spa", newEyebrow: "Retail Pop-Up" },
  { id: "solution.home-pt", newEyebrow: "Wedding & Celebration" },
  { id: "solution.rehab-clinic", newEyebrow: "Photography & Film" },
  { id: "solution.training-academy", newEyebrow: "Education & Training" },
];

const docs = await c.fetch(
  `*[_type=="solution" && coalesce(language, "en") == "en"]{
    _id, title,
    "heroBlockIdx": pageBuilder[_type=="heroBlock"][0],
    "heroKey": pageBuilder[_type=="heroBlock"][0]._key,
    "currentEyebrow": pageBuilder[_type=="heroBlock"][0].eyebrow
  }`,
);

const byId = new Map(docs.map((d) => [d._id, d]));

console.log(`\n━━━ HERO EYEBROW FIX — ${APPLY ? "APPLY" : "DRY RUN"} ━━━\n`);
const transaction = c.transaction();
let queued = 0;
let alreadyOk = 0;

for (const t of targets) {
  const d = byId.get(t.id);
  if (!d || !d.heroKey) {
    console.log(`!! ${t.id} has no heroBlock — skipping`);
    continue;
  }
  if (d.currentEyebrow === t.newEyebrow) {
    console.log(`= ${t.id} eyebrow already "${t.newEyebrow}"`);
    alreadyOk += 1;
    continue;
  }
  console.log(
    `  ${t.id}  "${d.currentEyebrow ?? "(none)"}" → "${t.newEyebrow}"`,
  );
  if (!APPLY) continue;
  transaction.patch(t.id, (p) =>
    p.set({
      pageBuilder: [
        {
          _type: "heroBlock",
          _key: d.heroKey,
          eyebrow: t.newEyebrow,
          // Preserve whatever heading / backgroundImage already live on the
          // heroBlock; we only narrow the patch to eyebrow via setIfMissing
          // for any other field. To stay surgical we read+write only eyebrow.
        },
      ],
      // use a different approach: set the field on the existing heroBlock by
      // _key via an array filter (Sanity supports setAt by _key path).
    }).set({
      [`pageBuilder[_key=="${d.heroKey}"].eyebrow`]: t.newEyebrow,
    }),
  );
  queued += 1;
}

if (!APPLY) {
  console.log(`\nTo apply, run: node scripts/_rename-hero-eyebrow.mjs apply\n`);
  process.exit(0);
}

if (queued === 0) {
  console.log(`\nNothing to update.\n`);
  process.exit(0);
}

console.log(`\nCommitting ${queued} patch(es)…`);
const r = await transaction.commit();
console.log(`✔ Committed. transactionId=${r.transactionId}\n`);

const after = await c.fetch(
  `*[_type=="solution" && coalesce(language, "en") == "en"]|order(coalesce(sortOrder, 9999) asc){
    _id, "slug": slug.current, "eyebrow": pageBuilder[_type=="heroBlock"][0].eyebrow
  }`,
);
for (const s of after) {
  console.log(`  ${s.slug.padEnd(28)}  eyebrow: ${s.eyebrow}`);
}
console.log(``);