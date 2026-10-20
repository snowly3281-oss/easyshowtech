/**
 * Dry-run: print the planned solution rename/sortOrder changes WITHOUT
 * touching Sanity. Run:
 *   node scripts/_rename-solutions-dryrun.mjs
 *
 * The companion apply script is:
 *   scripts/_rename-solutions-apply.mjs
 */
import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";

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

// Mapping derived from the user's design brief (01-06, no new docs).
const plan = [
  {
    order: 1,
    expectedCurrentId: "solution.franchise",
    expectedCurrentSlug: "franchise",
    expectedCurrentTitle: "Events & Trade Shows",
    newSlug: "trade-show-exhibitor",
    newTitle: "Trade Show Exhibitor",
    sortOrder: 10,
  },
  {
    order: 2,
    expectedCurrentId: "solution.boutique-studio",
    expectedCurrentSlug: "boutique-studio",
    expectedCurrentTitle: "Wedding & Party Setup",
    newSlug: "event-activation",
    newTitle: "Event Activation",
    sortOrder: 20,
  },
  {
    order: 3,
    expectedCurrentId: "solution.hotel-spa",
    expectedCurrentSlug: "hotel-spa",
    expectedCurrentTitle: "Retail & Pop-Up Stores",
    newSlug: "retail-pop-up",
    newTitle: "Retail Pop-Up",
    sortOrder: 30,
  },
  {
    order: 4,
    expectedCurrentId: "solution.home-pt",
    expectedCurrentSlug: "home-pt",
    expectedCurrentTitle: "Religious & Community",
    newSlug: "wedding-and-celebration",
    newTitle: "Wedding & Celebration",
    sortOrder: 40,
  },
  {
    order: 5,
    expectedCurrentId: "solution.rehab-clinic",
    expectedCurrentSlug: "rehab-clinic",
    expectedCurrentTitle: "Photography & Film",
    newSlug: "photography-and-film",
    newTitle: "Photography & Film",
    sortOrder: 50,
  },
  {
    order: 6,
    expectedCurrentId: "solution.training-academy",
    expectedCurrentSlug: "training-academy",
    expectedCurrentTitle: "Education & Training",
    newSlug: "education-and-training",
    newTitle: "Education & Training",
    sortOrder: 60,
  },
];

const docs = await c.fetch(
  `*[_type=="solution" && coalesce(language, "en") == "en"]{
    _id, title, "slug": slug.current, language
  }`,
);

console.log(`\n━━━ SOLUTION RENAMING — DRY RUN ━━━\n`);
console.log(`Sanity has ${docs.length} EN solution docs.\n`);

const byId = new Map(docs.map((d) => [d._id, d]));
const issues = [];

console.log(`┌─────┬──────────────────────────────────┬──────────────────────────────────┬──────────────────────────────────┐`);
console.log(`│ Pos │ Current doc                      │ New slug                         │ New title                        │`);
console.log(`├─────┼──────────────────────────────────┼──────────────────────────────────┼──────────────────────────────────┤`);

for (const step of plan) {
  const doc = byId.get(step.expectedCurrentId);
  if (!doc) {
    issues.push(`Missing _id: ${step.expectedCurrentId}`);
    console.log(`│  ${step.order}  │ !! MISSING ${step.expectedCurrentId.padEnd(26)} │ ${step.newSlug.padEnd(32)} │ ${step.newTitle.padEnd(32)} │`);
    continue;
  }
  if (doc.slug !== step.expectedCurrentSlug) {
    issues.push(
      `Slug drift on ${step.expectedCurrentId}: doc=${doc.slug} expected=${step.expectedCurrentSlug}`,
    );
  }
  if (doc.title !== step.expectedCurrentTitle) {
    issues.push(
      `Title drift on ${step.expectedCurrentId}: doc="${doc.title}" expected="${step.expectedCurrentTitle}"`,
    );
  }
  console.log(
    `│  ${step.order}  │ ${doc._id.padEnd(32)} │ ${step.newSlug.padEnd(32)} │ ${step.newTitle.padEnd(32)} │`,
  );
}

console.log(`└─────┴──────────────────────────────────┴──────────────────────────────────┴──────────────────────────────────┘`);

// Cross-check: do any new slugs collide with each other or with existing docs?
const allNewSlugs = new Set();
for (const step of plan) {
  if (allNewSlugs.has(step.newSlug)) {
    issues.push(`Plan collision: ${step.newSlug} appears twice`);
  }
  allNewSlugs.add(step.newSlug);
}
for (const d of docs) {
  if (allNewSlugs.has(d.slug) && !plan.some((p) => p.expectedCurrentId === d._id)) {
    issues.push(`Plan collision: ${d.slug} is also held by ${d._id}`);
  }
}

console.log(`\nPlanned sortOrder assignments:`);
for (const step of plan) console.log(`  ${step.expectedCurrentId.padEnd(28)}  → sortOrder=${step.sortOrder}`);

console.log(`\nSchema change required:`);
console.log(`  Add  sortOrder  (number)  to solution.content group`);
console.log(`  Add  ordering  by sortOrder asc, _createdAt asc`);

console.log(`\nQuery change required (src/sanity/queries/home.ts):`);
console.log(`  homeSolutionsQuery  →  | order(sortOrder asc, _createdAt asc)`);

console.log(`\nNo new documents will be created.`);
console.log(`No redirects will be created (old /solutions/<oldSlug> will 404).`);
console.log(`No summary / pageBuilder / products / packages changes.\n`);

if (issues.length) {
  console.log(`!! ISSUES FOUND:`);
  for (const i of issues) console.log(`  - ${i}`);
  console.log(``);
  process.exit(1);
} else {
  console.log(`✔ All checks passed. Ready to apply.\n`);
}