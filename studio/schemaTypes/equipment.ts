import { defineType, defineField } from "sanity";
import { ComponentIcon } from "@sanity/icons";

/**
 * Equipment — LEGACY document type. Superseded by `service`.
 *
 * Historical context: this document once drove a "byEquipment" facet on the
 * Products page. After the three-tab refactor (Products / Printing /
 * Parts) the printing-service axis is owned by the new `service` document,
 * and the "by equipment" facet was removed from the front end.
 *
 * This schema is intentionally read-only and hidden from the Studio's
 * "Create new" menu so no operator can author new `equipment` records. It
 * still exists so legacy `product.equipment` references resolve and the
 * product list query can fall back to it for the deprecated
 * `equipment` field.
 *
 * If you find you need to read these documents, use the `service` document
 * instead — content was migrated there by `seed-services.mjs`.
 */
export const equipment = defineType({
  name: "equipment",
  title: "器械分类（已停用）",
  type: "document",
  icon: ComponentIcon,
  hidden: true,
  readOnly: true,
  fields: [
    defineField({
      name: "title",
      title: "器械分类名称",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "slug",
      title: "网址标识 Slug",
      type: "slug",
      readOnly: true,
      options: { source: "title", maxLength: 96 },
    }),
    defineField({
      name: "order",
      title: "显示顺序",
      type: "number",
      readOnly: true,
    }),
  ],
  preview: {
    select: { title: "title", slug: "slug.current" },
    prepare: ({ title, slug }: { title?: string; slug?: string }) => ({
      title: title || "未命名器械分类（已停用）",
      subtitle: slug ? `Slug：${slug} · legacy` : "legacy · no slug",
    }),
  },
});
