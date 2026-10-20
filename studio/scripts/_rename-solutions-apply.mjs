/**
 * Apply the solution renaming plan shown by
 *   scripts/_rename-solutions-dryrun.mjs
 *
 * What this script does:
 *   1. Patches studio/schemaTypes/solution.ts to add a sortOrder field.
 *   2. Patches src/sanity/queries/home.ts so homeSolutionsQuery orders by
 *      sortOrder then _createdAt.
 *   3. Updates the 6 EN solution documents in Sanity:
 *        - slug.current, title, sortOrder.
 *      Leaves summary, pageBuilder, products, packages untouched.
 *   4. Does NOT delete, create, or redirect anything.
 *
 * Pre-conditions:
 *   - Dry-run script (_rename-solutions-dryrun.mjs) returned ✔.
 *   - User has explicitly said "yes apply" before invoking this script.
 *
 * Run with the apply argument to actually push changes:
 *   node scripts/_rename-solutions-apply.mjs apply
 * Without the argument it prints the plan and exits.
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

if (!APPLY) {
  console.log(`\nThis script will (only when invoked with the 'apply' arg):`);
  console.log(`  - patch studio/schemaTypes/solution.ts to add sortOrder`);
  console.log(`  - patch src/sanity/queries/home.ts to order by sortOrder`);
  console.log(`  - update 6 EN solution docs (slug/title/sortOrder only)\n`);
  console.log(`To run:  node scripts/_rename-solutions-apply.mjs apply\n`);
  process.exit(0);
}

console.log(`\n━━━ APPLYING SOLUTION RENAMING ━━━\n`);

// ── 1. Patch solution schema ──────────────────────────────────────────────
const schemaPath = path.resolve(
  "../studio/schemaTypes/solution.ts",
);
let schemaSrc = fs.readFileSync(schemaPath, "utf8");

const sortOrderField = `
    defineField({
      name: "sortOrder",
      title: "显示顺序",
      type: "number",
      group: "content",
      description:
        "数字越小越靠前。建议按 10、20、30 递增。同值时按创建时间排序。",
      initialValue: 100,
    }),
`;

if (!schemaSrc.includes('name: "sortOrder"')) {
  // Insert just after the slug field for editorial consistency.
  const slugBlock = `      validation: (rule) => rule.required(),
    }),
    mediaField({`;
  const newSchema = schemaSrc.replace(
    slugBlock,
    `      validation: (rule) => rule.required(),
    }),${sortOrderField}
    mediaField({`,
  );
  fs.writeFileSync(schemaPath, newSchema, "utf8");
  console.log(`✔ Patched: ${schemaPath} (added sortOrder field)`);
} else {
  console.log(`= Skipped: ${schemaPath} (sortOrder already present)`);
}

// Add a new ordering option if not present.
let schemaSrc2 = fs.readFileSync(schemaPath, "utf8");
const orderingsBlock = `    {
      title: "名称 A–Z",
      name: "titleAsc",
      by: [{ field: "title", direction: "asc" }],
    },
  ],`;
const orderingsAddition = `    {
      title: "名称 A–Z",
      name: "titleAsc",
      by: [{ field: "title", direction: "asc" }],
    },
    {
      title: "显示顺序",
      name: "sortOrderAsc",
      by: [
        { field: "sortOrder", direction: "asc" },
        { field: "_createdAt", direction: "asc" },
      ],
    },
  ],`;
if (!schemaSrc2.includes('name: "sortOrderAsc"')) {
  schemaSrc2 = schemaSrc2.replace(orderingsBlock, orderingsAddition);
  fs.writeFileSync(schemaPath, schemaSrc2, "utf8");
  console.log(`✔ Patched: ${schemaPath} (added sortOrderAsc ordering)`);
} else {
  console.log(`= Skipped: ${schemaPath} (sortOrderAsc ordering already present)`);
}

// ── 2. Patch homeSolutionsQuery ───────────────────────────────────────────
const queryPath = path.resolve("../src/sanity/queries/home.ts");
let querySrc = fs.readFileSync(queryPath, "utf8");
const oldOrder = `  ] | order(_createdAt asc){`;
const newOrder = `  ] | order(coalesce(sortOrder, 9999) asc, _createdAt asc){`;
if (querySrc.includes(oldOrder)) {
  querySrc = querySrc.replace(oldOrder, newOrder);
  fs.writeFileSync(queryPath, querySrc, "utf8");
  console.log(`✔ Patched: ${queryPath} (homeSolutionsQuery now orders by sortOrder)`);
} else {
  console.log(`= Skipped: ${queryPath} (homeSolutionsQuery already uses sortOrder?)`);
}

// ── 3. Update Sanity docs ─────────────────────────────────────────────────
const docs = await c.fetch(
  `*[_type=="solution" && coalesce(language, "en") == "en"]{
    _id, title, "slug": slug.current
  }`,
);
const byId = new Map(docs.map((d) => [d._id, d]));

const transaction = c.transaction();
let updates = 0;

for (const step of plan) {
  const doc = byId.get(step.expectedCurrentId);
  if (!doc) {
    console.log(`!! Missing _id ${step.expectedCurrentId}, skipping`);
    continue;
  }
  if (doc.slug !== step.expectedCurrentSlug) {
    console.log(
      `!! Slug drift on ${step.expectedCurrentId}: doc=${doc.slug} expected=${step.expectedCurrentSlug}`,
    );
  }
  if (doc.title !== step.expectedCurrentTitle) {
    console.log(
      `!! Title drift on ${step.expectedCurrentId}: doc="${doc.title}" expected="${step.expectedCurrentTitle}"`,
    );
  }
  transaction.patch(step.expectedCurrentId, (p) =>
    p
      .set({ title: step.newTitle })
      .set({ slug: { _type: "slug", current: step.newSlug } })
      .set({ sortOrder: step.sortOrder }),
  );
  updates += 1;
  console.log(
    `  queued → ${step.expectedCurrentId}  →  slug=${step.newSlug}  title="${step.newTitle}"  sortOrder=${step.sortOrder}`,
  );
}

console.log(`\nCommitting ${updates} patch(es) to Sanity…`);
const result = await transaction.commit();
console.log(`✔ Committed. transactionId=${result.transactionId}`);

console.log(`\nVerification:`);
const after = await c.fetch(
  `*[_type=="solution" && coalesce(language, "en") == "en"]|order(coalesce(sortOrder, 9999) asc, _createdAt asc){
    _id, title, "slug": slug.current, sortOrder
  }`,
);
for (const s of after) {
  console.log(
    `  ${String(s.sortOrder ?? "—").padStart(3)}  ${s.slug.padEnd(28)}  ${s.title}  (${s._id})`,
  );
}

console.log(`\n✔ Done. Restart the dev server to refresh the home page cache.\n`);