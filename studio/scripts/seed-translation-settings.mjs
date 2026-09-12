import {createClient} from "@sanity/client";

const token = process.env.SANITY_WRITE_TOKEN;
if (!token) throw new Error("SANITY_WRITE_TOKEN missing (studio/.env).");

const client = createClient({
  projectId: "p3d22f8w",
  dataset: "production",
  apiVersion: "2026-07-27",
  token,
  useCdn: false,
});

const existing = await client.getDocument("translationSettings");
const document = {
  ...(existing ?? {}),
  _id: "translationSettings",
  _type: "translationSettings",
  enabled: existing?.enabled ?? true,
  autoTranslateOnPublish: existing?.autoTranslateOnPublish ?? true,
  targetLanguages: existing?.targetLanguages ?? ["es", "fr", "de", "it"],
  provider: existing?.provider ?? "sanity-ai",
  styleGuide:
    existing?.styleGuide ??
    "Translate for a professional B2B Pilates equipment website. Keep the meaning precise, concise and commercially neutral. Do not invent certifications, prices, warranty promises or technical specifications. Preserve SKU codes, model names, dimensions, units, URLs and brand names.",
  protectedPhrases: existing?.protectedPhrases ?? [
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
  ],
  legalReviewRequired: true,
  publishPolicy: "review",
};

await client.createOrReplace(document);
console.log(
  `Translation settings ${existing ? "updated" : "created"}; automatic draft generation is ${document.autoTranslateOnPublish ? "enabled" : "disabled"}.`,
);
