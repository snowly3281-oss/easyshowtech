import { defineType, defineField } from "sanity";
import { ComponentIcon } from "@sanity/icons";
import { mediaField } from "sanity-plugin-media";

/**
 * Service — drives the front-end "Printing Service" facet and the home page
 * carousel.
 *
 * After the 2026-10-18 realignment, every service corresponds to a **product
 * category** the factory can custom-print (e.g. "Custom Canopy", "Custom
 * Backdrop", "Custom Flag"). The legacy "process" meaning
 * (fabric-printing / vinyl-wrap / …) was retired at the same time — only
 * one product (`tension-fabric-backdrop-stand`) referenced the old docs, so
 * the migration risk was bounded.
 *
 *  - The home carousel reads `displayInHomeCarousel == true` services,
 *    ordered by `homeOrder`.
 *  - The Header mega menu ("By Service") reads the same services, ordered by
 *    `order`.
 *  - The /products Printing Service tab uses these slugs as facet values
 *    (`/products?service=<slug>`).
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
      title: "首页轮播顺序",
      name: "homeOrder",
      by: [
        { field: "homeOrder", direction: "asc" },
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
        '客户用于筛选印刷服务的类型，例如 "Custom Canopy"。',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "网址标识 Slug",
      type: "slug",
      description:
        '用于筛选网址，例如 "custom-canopy"。发布后不要随意修改。',
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "卡片描述",
      type: "text",
      rows: 3,
      description:
        "显示在首页轮播卡片下方、Header 折叠面板和筛选侧栏。建议 40–120 个字符。",
    }),
    mediaField({
      name: "coverImage",
      title: "封面图（首页轮播卡片）",
      type: "image",
      mediaTags: ["role-card"],
      description:
        "首页 Printing Service 轮播卡片主图。比例建议 4:3 或 16:9；导出 WEBP/AVIF 优先。",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "替代文字 Alt",
          type: "string",
          description: "用一句话描述图中的服务，方便无障碍读屏和搜索引擎。",
        }),
      ],
    }),
    defineField({
      name: "order",
      title: "显示顺序（Header / 筛选）",
      type: "number",
      description:
        "数字越小越靠前。Header 的 By Service 列表、Products 页面 By Service 筛选都按此顺序排列。建议按 10、20、30 递增，方便以后插入新分类。",
    }),
    defineField({
      name: "displayInHomeCarousel",
      title: "在首页 Printing Service 轮播中显示",
      type: "boolean",
      description:
        "关闭后该服务仍出现在 Header / 筛选侧栏，只是不在首页 7 张卡片里出现。",
      initialValue: true,
    }),
    defineField({
      name: "homeOrder",
      title: "首页轮播顺序",
      type: "number",
      description:
        "仅当「在首页 Printing Service 轮播中显示」开启时生效。数字越小越靠前。建议按 10、20、30 递增。",
    }),
  ],
  preview: {
    select: {
      title: "title",
      slug: "slug.current",
      order: "order",
      media: "coverImage",
    },
    prepare: ({ slug, title, order, media }) => ({
      title: title || "未命名印刷服务",
      subtitle:
        [slug ? `Slug：${slug}` : "尚未生成 Slug", `顺序：${order ?? "-"}`]
          .filter(Boolean)
          .join(" · "),
      media,
    }),
  },
});