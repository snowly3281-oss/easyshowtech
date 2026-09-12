import { defineType, defineField, defineArrayMember } from "sanity";
import { BulbOutlineIcon } from "@sanity/icons";
import { AUDIENCE_OPTIONS } from "./lib/audience";

/**
 * Solution — THE hub of the content model. A composable page (page builder)
 * that frames an end-to-end use case for one or more buyer tiers, then routes
 * the reader to the products that realise it.
 *
 * Interlinks (author ONE side only — principle 6):
 *  - solution → product       via `products` (reference[]), here
 *  - post → solution          authored on `post.solutions`        (reverse-query)
 *  - siteSettings → solution  authored on `siteSettings.solutions` (ordered)
 *
 * The product side stores NO back-link; "which solutions feature this product"
 * is a GROQ `references()` reverse query.
 */
export const solution = defineType({
  name: "solution",
  title: "解决方案",
  type: "document",
  icon: BulbOutlineIcon,
  groups: [
    { name: "content", title: "页面内容", default: true },
    { name: "packages", title: "面积档位与配置单" },
    { name: "links", title: "旧关联数据" },
    { name: "seo", title: "搜索引擎 SEO" },
  ],
  orderings: [
    {
      title: "最近更新",
      name: "updatedAtDesc",
      by: [{ field: "_updatedAt", direction: "desc" }],
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
      title: "解决方案名称",
      type: "string",
      group: "content",
      description: '客户使用场景名称，例如 "Boutique studio"、"Rehab clinic"。',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "网址标识 Slug",
      type: "slug",
      group: "content",
      description:
        "决定网址 /solutions/[slug]。发布后不要随意修改，否则旧链接会失效。",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "audience",
      title: "目标客户",
      type: "array",
      group: "content",
      description:
        "选择该方案适合的买家类型，可多选；用于推荐和筛选，不会自动生成额外页面。",
      of: [defineArrayMember({ type: "string" })],
      options: { list: AUDIENCE_OPTIONS },
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: "summary",
      title: "解决方案摘要",
      type: "text",
      group: "content",
      rows: 3,
      description: "显示在导航、卡片和搜索结果中，建议 60–180 个字符。",
    }),
    defineField({
      name: "pageBuilder",
      title: "页面内容模块",
      type: "array",
      group: "content",
      description:
        "添加首屏、正文、FAQ 和 CTA，可拖动调整顺序。不要删除已经确认的配置单内容。",
      of: [
        defineArrayMember({ type: "heroBlock" }),
        defineArrayMember({ type: "ctaBlock" }),
        defineArrayMember({ type: "textBlock" }),
        defineArrayMember({ type: "faqsBlock" }),
      ],
    }),
    defineField({
      name: "packages",
      title: "面积档位与配置单",
      type: "array",
      group: "packages",
      description:
        "可建立 Compact、Recommended、Expanded 三档。Boutique Studio 已提供完整示范；其他 Solution 先维护甲方确认的 Recommended，未确认档位不要自行编造数量。",
      of: [defineArrayMember({ type: "solutionPackage" })],
      validation: (rule) =>
        rule
          .unique()
          .custom((packages?: { tier?: string; isRecommended?: boolean }[]) => {
            if (!packages) return true;
            const tiers = packages.map((pkg) => pkg?.tier).filter(Boolean);
            if (new Set(tiers).size !== tiers.length) {
              return "每个面积档位只能出现一次。";
            }
            if (packages.filter((pkg) => pkg?.isRecommended).length > 1) {
              return "只能有一个配置单标记为推荐方案。";
            }
            return true;
          }),
    }),
    defineField({
      name: "configurationIntro",
      title: "配置单区域说明",
      type: "text",
      group: "packages",
      rows: 3,
      description:
        "可选，用于解释面积档位、配置差异和最终数量需由平面图确认等信息。",
    }),
    defineField({
      name: "assistedConfiguration",
      title: "一键配置/平面图服务",
      type: "object",
      group: "packages",
      description:
        "客户不想自行选设备时，可上传工作室平面图，由 Coral 提供最佳配置。这里填写该服务的引导文案。",
      fields: [
        defineField({
          name: "heading",
          title: "标题",
          type: "string",
          initialValue: "Let Coral configure your space",
        }),
        defineField({
          name: "body",
          title: "说明",
          type: "text",
          rows: 3,
        }),
      ],
    }),
    defineField({
      name: "products",
      title: "旧产品关联（已停用）",
      type: "array",
      group: "links",
      description:
        "旧版 Solution 的产品列表。新内容应在每个面积档位的配置单中关联产品和数量。",
      deprecated: {
        reason:
          "Replaced by package-level equipment lists, which preserve quantities and package context.",
      },
      of: [defineArrayMember({ type: "reference", to: [{ type: "product" }] })],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: "seo",
      title: "SEO 设置",
      type: "seo",
      group: "seo",
    }),
  ],
  preview: {
    select: { title: "title", audience: "audience" },
    prepare: ({
      title,
      audience,
    }: {
      title?: string;
      audience?: string[];
    }) => ({
      title: title || "未命名解决方案",
      subtitle:
        Array.isArray(audience) && audience.length
          ? audience.join(" · ")
          : "尚未设置目标客户",
    }),
  },
});
