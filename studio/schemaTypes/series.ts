import { defineType, defineField } from "sanity";
import { TagIcon } from "@sanity/icons";
import { mediaField } from "sanity-plugin-media";

/**
 * Series — display-equipment product category taxonomy.
 *
 * Each Series drives the `/products?series=<slug>` filtered view.
 * All display-series have `kind = "product"` — they live in the
 * "Products catalog" tab. Parts & printing-service series are managed
 * through separate document types.
 *
 * Slugs must stay stable: changing a slug breaks all product URLs that
 * reference it and any bookmarked or indexed search links.
 */
export const series = defineType({
  name: "series",
  title: "产品系列",
  type: "document",
  icon: TagIcon,
  groups: [
    { name: "content", title: "基础内容", default: true },
    { name: "media", title: "图片" },
    { name: "seo", title: "SEO" },
  ],
  orderings: [
    {
      title: "显示顺序",
      name: "sortOrder",
      by: [{ field: "sortOrder", direction: "asc" }],
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
      group: "content",
      description: '客户可见的产品系列名称，例如 "Aluminum Tents"。',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug（网址标识）",
      type: "slug",
      group: "content",
      description:
        "用于 URL 筛选，例如 `aluminum-tent`。发布后不要随意修改。",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "shortDescription",
      title: "简短介绍",
      type: "text",
      group: "content",
      rows: 2,
      description: "显示在分类卡片，建议 40–80 个字符。",
    }),
    defineField({
      name: "description",
      title: "详细介绍",
      type: "text",
      group: "content",
      rows: 4,
      description: "显示在系列详情页，建议 120–300 个字符。",
    }),
    defineField({
      name: "sortOrder",
      title: "显示顺序",
      type: "number",
      group: "content",
      description:
        "数字越小越靠前。建议按 10、20、30 递增。",
    }),
    defineField({
      name: "isActive",
      title: "在前台显示",
      type: "boolean",
      group: "content",
      description: "关闭后该系列不出现在筛选器和分类入口。",
      initialValue: true,
    }),
    mediaField({
      name: "cardImage",
      title: "分类卡片图片",
      type: "image",
      group: "media",
      mediaTags: ["scope-series", "role-card"],
      description:
        "显示在首页产品系列轮播和产品列表筛选器卡片。推荐 4:3 横图。",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "替代文字",
          type: "string",
          description: "简要描述图片内容。",
        }),
      ],
    }),
    mediaField({
      name: "heroImage",
      title: "系列详情页 Hero 图片",
      type: "image",
      group: "media",
      mediaTags: ["scope-series", "role-hero"],
      description: "显示在系列详情页顶部。推荐 16:9 横图。",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "替代文字",
          type: "string",
        }),
      ],
    }),
    // SEO group
    defineField({
      name: "metaTitle",
      title: "SEO 标题",
      type: "string",
      group: "seo",
      description:
        "留空则默认使用系列名称。控制在 50–60 个字符。",
    }),
    defineField({
      name: "metaDescription",
      title: "SEO 描述",
      type: "text",
      group: "seo",
      rows: 2,
      description:
        "显示在搜索引擎结果中。控制在 120–160 个字符。",
    }),
  ],
  preview: {
    select: {
      title: "title",
      slug: "slug.current",
      sortOrder: "sortOrder",
      media: "cardImage",
      isActive: "isActive",
    },
    prepare: ({ title, slug, sortOrder, media, isActive }) => ({
      title: title || "未命名系列",
      subtitle: [
        slug ? `/${slug}` : null,
        sortOrder != null ? `#${sortOrder}` : null,
        isActive === false ? "已隐藏" : null,
      ]
        .filter(Boolean)
        .join(" · "),
      media,
    }),
  },
});
