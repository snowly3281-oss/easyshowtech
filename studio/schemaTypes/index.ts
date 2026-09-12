import {
  defineField,
  type SchemaTypeDefinition,
  type SlugIsUniqueValidator,
} from "sanity";
import {LOCALIZED_DOCUMENT_TYPE_SET} from "../config/i18n";

// Documents
import { series } from './series'
import { equipment } from './equipment'
import { product } from './product'
import { solution } from './solution'
import { oem } from './oem'
import { post } from './post'
import { home } from './home'
import { siteSettings } from './siteSettings'
import { sitePage } from './sitePage'
import { postAuthor } from './postAuthor'
import { postCategory } from './postCategory'
import { postTag } from './postTag'
import {translationSettings} from "./translationSettings";
import {translationMetadata} from "./translationMetadata";

// Objects — shared
import { seo } from './objects/seo'
import { ctaLink } from './objects/ctaLink'
import { solutionPackage } from './objects/solutionPackage'
import { solutionPackageItem } from './objects/solutionPackageItem'
import { solutionPackageSeriesVariant } from './objects/solutionPackageSeriesVariant'
import { verifiedValue } from './objects/verifiedValue'

// Objects — page-builder blocks
import { heroBlock } from './objects/heroBlock'
import { ctaBlock } from './objects/ctaBlock'
import { textBlock } from './objects/textBlock'
import { faqsBlock } from './objects/faqsBlock'
import { richContent } from './objects/richContent'
import {
  portableTextTable,
  portableTextTableCell,
  portableTextTableRow,
} from "./objects/portableTextTable";

/**
 * Registry of all schema types. Imported by `sanity.config.ts`.
 *
 * Relationships:
 *  - `product` references one `series` and one `equipment` (double-axis taxonomy)
 *  - `solution` is the hub: `pageBuilder` blocks + `products` (reference[])
 *  - `post.solutions` and `siteSettings.solutions` carry the other interlinks;
 *    the product/solution sides store no back-links (reverse-queried)
 *  - `siteSettings` and `oem` are singletons (see ../structure/index.ts)
 */
const registeredTypes: SchemaTypeDefinition[] = [
  // Documents
  series,
  equipment,
  product,
  solution,
  oem,
  post,
  home,
  siteSettings,
  sitePage,
  postAuthor,
  postCategory,
  postTag,
  translationSettings,
  translationMetadata,
  // Objects — shared
  seo,
  ctaLink,
  solutionPackage,
  solutionPackageItem,
  solutionPackageSeriesVariant,
  verifiedValue,
  // Objects — page-builder blocks
  heroBlock,
  ctaBlock,
  textBlock,
  faqsBlock,
  richContent,
  portableTextTable,
  portableTextTableRow,
  portableTextTableCell,
]

/**
 * Public routes include the locale (`/es/products/...`, `/fr/resources/...`),
 * so a translated document must be allowed to reuse its English source slug.
 * Sanity's default slug validator is global per document type, which wrongly
 * reports those valid translations as duplicates. This validator preserves
 * uniqueness within each language while excluding the current document's
 * published/draft/version variants from the lookup.
 */
const localizedSlugIsUnique: SlugIsUniqueValidator = async (slug, context) => {
  const document = context.document;
  if (!document) return context.defaultIsUnique(slug, context);

  const language =
    typeof document.language === "string" ? document.language : "en";
  const publishedId = document._id.replace(/^drafts\./, "");

  return context
    .getClient({apiVersion: "2026-07-24"})
    .withConfig({perspective: "raw"})
    .fetch<boolean>(
      `!defined(*[
        _type == $documentType &&
        coalesce(language, "en") == $language &&
        !sanity::versionOf($publishedId) &&
        slug.current == $slug
      ][0]._id)`,
      {
        documentType: document._type,
        language,
        publishedId,
        slug,
      },
      {tag: "validation.localized-slug-is-unique"},
    );
};

/**
 * Add one hidden language field and a compact review audit to every localized
 * document type. Existing documents are migrated to `en`; the field default
 * keeps future operator-created documents English until the translation
 * plugin creates a language-specific copy.
 */
export const schemaTypes: SchemaTypeDefinition[] = registeredTypes.map(
  (schemaType) => {
    if (
      schemaType.type !== "document" ||
      !LOCALIZED_DOCUMENT_TYPE_SET.has(schemaType.name)
    ) {
      return schemaType;
    }

    const fields = "fields" in schemaType ? schemaType.fields ?? [] : [];
    const localizedFields = fields.map((field) => {
      if (field.name !== "slug" || field.type !== "slug") return field;

      return {
        ...field,
        options: {
          ...(field.options ?? {}),
          isUnique: localizedSlugIsUnique,
        },
      };
    });
    const groups = "groups" in schemaType ? schemaType.groups ?? [] : [];
    const hasSystemGroup = groups.some((group) => group.name === "system");
    const workflowGroup = hasSystemGroup ? "system" : undefined;

    return {
      ...schemaType,
      fields: [
        defineField({
          name: "language",
          title: "内容语言",
          type: "string",
          ...(workflowGroup ? {group: workflowGroup} : {}),
          readOnly: true,
          hidden: true,
          initialValue: "en",
          options: {canvasApp: {exclude: true}},
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "translationStatus",
          title: "翻译审核状态",
          type: "string",
          ...(workflowGroup ? {group: workflowGroup} : {}),
          hidden: ({document}) =>
            !document?.language || document.language === "en",
          initialValue: "needsReview",
          options: {
            canvasApp: {exclude: true},
            list: [
              {title: "机器翻译完成，等待审核", value: "needsReview"},
              {title: "人工审核中", value: "reviewing"},
              {title: "审核通过，可以发布", value: "approved"},
              {title: "英文已更新，需要重新翻译", value: "stale"},
              {title: "翻译失败，需要重试", value: "failed"},
            ],
            layout: "radio",
          },
          description:
            "非英文版本的运营状态。只有人工确认内容无误后，才选择“审核通过”。",
        }),
        defineField({
          name: "translationSourceRevision",
          title: "对应的英文版本（系统）",
          type: "string",
          ...(workflowGroup ? {group: workflowGroup} : {}),
          hidden: true,
          readOnly: true,
          options: {canvasApp: {exclude: true}},
        }),
        defineField({
          name: "translatedAt",
          title: "最近自动翻译时间（系统）",
          type: "datetime",
          ...(workflowGroup ? {group: workflowGroup} : {}),
          hidden: true,
          readOnly: true,
          options: {canvasApp: {exclude: true}},
        }),
        ...localizedFields,
      ],
    } as SchemaTypeDefinition;
  },
);
