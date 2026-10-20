/**
 * Unreference the old Pilates product from solutions and home before deleting it.
 *
 * Approach: read each doc, find any reference to d6aa907c-4d9e-48c7-a68a-718fb9071de0
 * in `products`, `pageBuilder[].products`, etc., strip it out, and patch the doc.
 *
 * Dry-run by default; --write to actually patch.
 */
import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  let dir = __dirname;
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

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID ?? "w8rk6k6z";
const dataset = process.env.PUBLIC_SANITY_DATASET ?? "production";
const apiVersion = process.env.SANITY_API_VERSION ?? "2024-10-01";
const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) { console.error("No token"); process.exit(1); }

const WRITE = process.argv.includes("--write");
const client = createClient({ projectId, dataset, apiVersion, token });

const OLD_PRODUCT_ID = "d6aa907c-4d9e-48c7-a68a-718fb9071de0";

/**
 * Recursively walk a value, returning a deep-clone with anything
 * referencing OLD_PRODUCT_ID stripped from reference fields.
 * Reference removal: drop the parent object (key lost its purpose).
 */
function stripRefs(value) {
  if (value == null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map(stripRefs).filter((v) => v !== undefined);
  }
  // Reference object: { _type: 'reference', _ref: '...' }
  if (value._type === "reference" && value._ref === OLD_PRODUCT_ID) {
    return undefined; // mark for removal
  }
  const out = {};
  for (const k of Object.keys(value)) {
    const v = stripRefs(value[k]);
    if (v !== undefined) out[k] = v;
  }
  return out;
}

// Find all docs with refs to the old product
const refHolders = await client.fetch(
  `*[references($id)]{ _id, _type, title }`,
  { id: OLD_PRODUCT_ID },
);

console.log(`\n🩹 UNREFERENCE OLD PRODUCT\n   Mode: ${WRITE ? "⚠️  WRITE" : "DRY-RUN"}\n`);
console.log(`   Old product ID: ${OLD_PRODUCT_ID}\n`);
console.log(`─── DOCS WITH REFERENCES (${refHolders.length}) ───`);

const patches = [];
for (const doc of refHolders) {
  const full = await client.getDocument(doc._id);
  const cleaned = stripRefs(full);
  patches.push({ _id: doc._id, _type: doc._type, before: full, after: cleaned });
  console.log(`   ${doc._id}  (${doc._type}) — "${doc.title}"`);
}

if (WRITE && patches.length) {
  console.log(`\n⏳ Patching ${patches.length} documents...\n`);
  let ok = 0, fail = 0;
  for (const p of patches) {
    try {
      await client.createOrReplace(p.after);
      console.log(`   ✓ Patched: ${p._id}`);
      ok++;
    } catch (err) {
      const msg = err?.response?.body?.error?.description || err.message;
      console.error(`   ✗ ${p._id}: ${msg}`);
      fail++;
    }
  }
  console.log(`\n✅ Done — ${ok} patched, ${fail} failed.\n`);
} else {
  console.log(`\n🟡 Dry-run complete. ${patches.length} docs would be patched.`);
  console.log("   Run with --write to apply.\n");
}
