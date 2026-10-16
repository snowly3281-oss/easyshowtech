import { defineType, defineField } from "sanity";
import { TagIcon } from "@sanity/icons";
import { mediaField } from "sanity-plugin-media";

/**
 * Series — first axis of the triple-axis product taxonomy.
 *
 * Each Series belongs to exactly ONE of the three front-end tabs:
 *
 *   - `product`              → "Products catalog" tab (default — most common)
 *   - `service`              → "Printing Service" tab
 *   - `part`                 → "Parts & accessories" tab (e.g. "Reformer Springs"
 *                              used as a parent series for related parts)
 *
 * The kind is a hard gate: the front-end GROQ for `homeSeriesQuery` filters
 * by `kind == "product"`, and the products list scopes by tab. A single
 * series never appears in two tabs.
 *
 * The slug drives the `/products?series=…` filtered view.
 */
export const series = defineType({
  name: "series",
  title: "产品系列",
  type: "document",
  icon: TagIcon,
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
      title: "系列名称",
      type: "string",
      description: '客户可见的产品系列名称，例如 "Wood Maple"。',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "网址标识 Slug",
      type: "slug",
      description:
        '用于产品筛选网址，例如 "wood-maple"。发布后不要随意修改。',
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "kind",
      title: "所属 Tab",
      type: "string",
      description:
        "决定这个系列显示在前端的哪个 Tab。整机选「产品」；印刷服务选「印刷」；配件系列选「零件」。",
      options: {
        list: [
          { title: "产品（Products catalog）", value: "product" },
          { title: "印刷服务（Printing Service）", value: "service" },
          { title: "零件（Parts & accessories）", value: "part" },
        ],
        layout: "radio",
      },
      initialValue: "product",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "系列简介",
      type: "text",
      rows: 3,
      description: "显示在系列筛选页和首页产品系列卡片中，建议 40–120 个字符。",
    }),
    mediaField({
      name: "image",
      title: "系列代表图",
      type: "image",
      mediaTags: ["scope-series", "role-featured"],
      description:
        "显示在首页产品系列轮播和系列入口中。推荐 4:3 横图（至少 1200×900 px）；使用竖图时请调整图片焦点，避免主体被裁切。",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "替代文字 Alt",
          type: "string",
          description: "简要描述图片内容，便于无障碍访问和 SEO。",
        }),
      ],
    }),
    defineField({
      name: "order",
      title: "显示顺序",
      type: "number",
      description:
        "数字越小越靠前。建议按 10、20、30 递增，方便以后插入新系列。",
    }),
    defineField({
      name: "skuLabel",
      title: "产品数量标签",
      type: "string",
      description:
        '可选。首页系列卡片的小标签，例如 "16 SKUs"。留空时自动统计该系列产品数量。',
    }),
  ],
  preview: {
    select: {
      title: "title",
      slug: "slug.current",
      kind: "kind",
      media: "image",
    },
    prepare: ({ title, slug, kind, media }) => {
      const kindLabel =
        kind === "service"
          ? "印刷服务"
          : kind === "part"
            ? "零件"
            : "产品";
      return {
        title: title || "未命名系列",
        subtitle: `${kindLabel}${slug ? ` · ${slug}` : ""}`,
        media,
      };
    },
  },
});
