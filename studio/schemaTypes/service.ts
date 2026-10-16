import { defineType, defineField } from "sanity";
import { ComponentIcon } from "@sanity/icons";

/**
 * Service — the second axis of the double-axis product taxonomy.
 *
 * Originally called `equipment` (legacy single-value field) and reused for
 * multiple "kinds" of products. After the three-tab refactor it is reserved
 * for the **Printing Service** tab only. Each service represents a printable
 * output type the factory can produce (e.g. "Fabric printing",
 * "Vinyl wrap", "SEG frame print", "Backdrop banner").
 *
 * The slug drives the `/products?service=…` filtered view on the front end.
 *
 * The legacy `equipment` document type is kept as a deprecated alias so any
 * historical references continue to resolve; new content is authored against
 * `service` only.
 */
export const service = defineType({
  name: "service",
  title: "印刷服务分类",
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
      title: "服务名称",
      type: "string",
      description:
        '客户用于筛选印刷服务的类型，例如 "Fabric Printing"。',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "网址标识 Slug",
      type: "slug",
      description:
        '用于筛选网址，例如 "fabric-printing"。发布后不要随意修改。',
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "服务简介",
      type: "text",
      rows: 3,
      description:
        "显示在印刷服务筛选页和首页卡片中，建议 40–120 个字符。",
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
      title: title || "未命名印刷服务",
      subtitle: slug ? `Slug：${slug}` : "尚未生成 Slug",
    }),
  },
});
