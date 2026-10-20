import { defineType, defineField, defineArrayMember } from "sanity";
import { ComponentIcon } from "@sanity/icons";
import { mediaField } from "sanity-plugin-media";

/**
 * PrintingService — manages printing-service detail pages and the many-to-many
 * link to products.
 *
 * The type name stays "service" (already registered in schema/index.ts) to
 * preserve existing data and avoid a migration. The title in Studio is
 * "印刷服务" to distinguish from any future "service" use.
 *
 * One service can apply to many products; one product can reference many
 * services. The product side (`product.printingServices`) is the primary
 * relationship. `relatedProducts` on this document is for curated ordering
 * on the service detail page only.
 */
export const service = defineType({
  name: "service",
  title: "印刷服务",
  type: "document",
  icon: ComponentIcon,
  groups: [
    { name: "content", title: "基础内容", default: true },
    { name: "media", title: "图片" },
    { name: "details", title: "服务详情" },
    { name: "products", title: "关联产品" },
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
      title: "服务名称",
      type: "string",
      group: "content",
      description:
        '客户可见的服务名称，例如 "Custom Fabric Printing"。',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug（网址标识）",
      type: "slug",
      group: "content",
      description:
        '用于 URL，例如 "custom-fabric-printing"。发布后不要随意修改。',
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "shortDescription",
      title: "简短介绍",
      type: "text",
      group: "content",
      rows: 2,
      description: "显示在服务列表卡片和建议操作处，建议 40–120 个字符。",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "详细介绍",
      type: "text",
      group: "content",
      rows: 5,
      description: "显示在服务详情页正文，建议 200–500 个字符。",
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
      description: "关闭后该服务不出现在列表和筛选中。",
      initialValue: true,
    }),

    // ── Media ──────────────────────────────────────────────────────────────
    mediaField({
      name: "heroImage",
      title: "Hero 主图",
      type: "image",
      group: "media",
      mediaTags: ["role-hero"],
      description:
        "显示在服务详情页顶部。推荐 16:9 横图（至少 1920×1080 px）。",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "替代文字",
          type: "string",
          description: "简要描述图中场景。",
        }),
      ],
    }),
    mediaField({
      name: "cardImage",
      title: "列表卡片图片",
      type: "image",
      group: "media",
      mediaTags: ["role-card"],
      description:
        "显示在印刷服务列表页卡片。推荐 4:3 横图。",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "替代文字",
          type: "string",
        }),
      ],
    }),

    // ── Service Details ────────────────────────────────────────────────────
    defineField({
      name: "benefits",
      title: "服务优势",
      type: "array",
      group: "details",
      description: "列出该印刷服务的核心优势，每项一个短句。",
      of: [
        defineArrayMember({
          type: "object",
          name: "benefit",
          fields: [
            defineField({
              name: "title",
              title: "优势标题",
              type: "string",
              description: '例如 "Vibrant color reproduction"',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "description",
              title: "详细说明",
              type: "text",
              rows: 2,
            }),
          ],
          preview: { select: { title: "title", subtitle: "description" } },
        }),
      ],
    }),
    defineField({
      name: "supportedMaterials",
      title: "支持材料",
      type: "array",
      group: "details",
      description: '列出该服务支持的承印材料，例如 "Polyester fabric", "Canvas", "Vinyl"。',
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
    }),
    defineField({
      name: "suitableApplications",
      title: "适用场景",
      type: "array",
      group: "details",
      description: '列出该服务最适合的应用，例如 "Event tents", "Trade show backdrops", "Promotional flags"。',
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
    }),
    defineField({
      name: "artworkRequirements",
      title: "印前文件要求",
      type: "text",
      group: "details",
      rows: 4,
      description:
        "填写文件格式、分辨率、颜色模式、出血设置等要求。例如：AI/PDF vector preferred, 300 DPI, CMYK, 3mm bleed.",
    }),
    defineField({
      name: "processSteps",
      title: "服务流程",
      type: "array",
      group: "details",
      description: "从下单到交付的主要步骤。",
      of: [
        defineArrayMember({
          type: "object",
          name: "processStep",
          fields: [
            defineField({
              name: "stepNumber",
              title: "步骤编号",
              type: "number",
              description: "1, 2, 3…",
              validation: (rule) => rule.required().positive().integer(),
            }),
            defineField({
              name: "title",
              title: "步骤标题",
              type: "string",
              description: '例如 "Artwork submission"',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "description",
              title: "步骤说明",
              type: "text",
              rows: 2,
            }),
          ],
          preview: {
            select: { title: "title", subtitle: "stepNumber" },
            prepare: ({ title, stepNumber }) => ({
              title: title || "未命名步骤",
              subtitle: stepNumber ? `Step ${stepNumber}` : undefined,
            }),
          },
        }),
      ],
      validation: (rule) =>
        rule.custom((steps?: { stepNumber?: number }[]) => {
          if (!steps) return true;
          const nums = steps.map((s) => s?.stepNumber).filter(Boolean);
          if (new Set(nums).size !== nums.length) {
            return "流程步骤编号不能重复。";
          }
          return true;
        }),
    }),

    // ── Related Products (curated ordering only) ──────────────────────────
    defineField({
      name: "relatedProducts",
      title: "精选推荐产品",
      type: "array",
      group: "products",
      description:
        "人工精选在服务详情页展示的产品。留空时前台自动按最新发布排序。",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "product" }],
          weak: true,
          options: { disableNew: true },
        }),
      ],
      validation: (rule) => rule.unique(),
    }),

    // ── SEO ────────────────────────────────────────────────────────────────
    defineField({
      name: "metaTitle",
      title: "SEO 标题",
      type: "string",
      group: "seo",
      description: "留空则默认使用服务名称。控制在 50–60 个字符。",
    }),
    defineField({
      name: "metaDescription",
      title: "SEO 描述",
      type: "text",
      group: "seo",
      rows: 2,
      description: "显示在搜索引擎结果中。控制在 120–160 个字符。",
    }),
    defineField({
      name: "ogImage",
      title: "社交分享图片",
      type: "image",
      group: "seo",
      mediaTags: ["role-share"],
      description: "分享到社交平台时显示的预览图。建议 1200×630 px。",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "替代文字",
          type: "string",
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      slug: "slug.current",
      sortOrder: "sortOrder",
      isActive: "isActive",
      media: "cardImage",
    },
    prepare: ({ title, slug, sortOrder, isActive, media }) => ({
      title: title || "未命名印刷服务",
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
