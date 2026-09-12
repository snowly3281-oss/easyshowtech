import { defineType, defineField } from "sanity";
import { ComponentIcon } from "@sanity/icons";

/**
 * Equipment — the second axis of the double-axis product taxonomy.
 * (Reformer, Reformer Tower, Cadillac, Chair, Barrel, Spine Corrector,
 * Springboard, Pedi Pole, Wall Tower.)
 * The slug drives the `/products?equipment=…` filtered view on the front end.
 */
export const equipment = defineType({
  name: "equipment",
  title: "器械分类",
  type: "document",
  icon: ComponentIcon,
  orderings: [
    {
      title: "导航顺序",
      name: "navigationOrder",
      by: [
        { field: "order", direction: "asc" },
        { field: "title", direction: "asc" },
      ],
    },
    {
      title: "名称 A–Z",
      name: "titleAsc",
      by: [{ field: "title", direction: "asc" }],
    },
  ],
  fields: [
    defineField({
      name: "title",
      title: "器械分类名称",
      type: "string",
      description: '客户用于筛选产品的器械类型，例如 "Reformer"。',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "网址标识 Slug",
      type: "slug",
      description:
        '用于产品筛选网址，例如 "reformer"。发布后不要随意修改。',
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "order",
      title: "显示顺序",
      type: "number",
      description:
        "数字越小越靠前。建议按 10、20、30 递增，方便以后插入新分类。",
    }),
  ],
  preview: {
    select: { title: "title", slug: "slug.current" },
    prepare: ({ title, slug }: { title?: string; slug?: string }) => ({
      title: title || "未命名器械分类",
      subtitle: slug ? `Slug：${slug}` : "尚未生成 Slug",
    }),
  },
});
