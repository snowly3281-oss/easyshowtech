export const SUPPORTED_LANGUAGES = [
  {id: "en", title: "英语 English"},
  {id: "es", title: "西班牙语 Español"},
  {id: "fr", title: "法语 Français"},
  {id: "de", title: "德语 Deutsch"},
  {id: "it", title: "意大利语 Italiano"},
] as const;

export type SupportedLanguageId = (typeof SUPPORTED_LANGUAGES)[number]["id"];

/**
 * Documents whose public-facing copy can have one independently reviewed
 * version per language. Taxonomy terms are included because they appear in
 * filters, cards and navigation; author records remain shared.
 */
export const LOCALIZED_DOCUMENT_TYPES = [
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
] as const;

export const LOCALIZED_DOCUMENT_TYPE_SET = new Set<string>(
  LOCALIZED_DOCUMENT_TYPES,
);

export const TARGET_LANGUAGES = SUPPORTED_LANGUAGES.filter(
  ({id}) => id !== "en",
);

export const DEFAULT_TRANSLATION_STYLE_GUIDE = [
  "Translate for a professional B2B Pilates equipment website.",
  "Keep the meaning precise, concise and commercially neutral.",
  "Do not invent certifications, prices, warranty promises or technical specifications.",
  "Preserve SKU codes, model names, dimensions, units, URLs and brand names.",
  "Keep Coral Pilates, Reformer, Cadillac, Ladder Barrel, Spine Corrector,",
  "Pedi Pole and Pilates Chair unchanged unless the target market has a",
  "well-established equivalent that does not alter product meaning.",
].join(" ");

export const DEFAULT_PROTECTED_PHRASES = [
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
