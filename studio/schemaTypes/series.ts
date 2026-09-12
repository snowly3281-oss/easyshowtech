import { defineType, defineField } from "sanity";
import { TagIcon } from "@sanity/icons";
import { mediaField } from "sanity-plugin-media";

/**
 * Series — one axis of the double-axis product taxonomy.
 * (Wood, Aluminum, Professional, Modular, Classical, Folding, Spiral Pulley.)
 * The slug drives the `/products?series=…` filtered view on the front end.
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
    select: { title: "title", slug: "slug.current", media: "image" },
    prepare: ({ title, slug, media }) => ({
      title: title || "未命名系列",
      subtitle: slug ? `Slug：${slug}` : "尚未生成 Slug",
      media,
    }),
  },
});
