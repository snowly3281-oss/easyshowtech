import { defineType, defineField, defineArrayMember } from "sanity";
import { PackageIcon } from "@sanity/icons";
import { mediaField } from "sanity-plugin-media";

/**
 * Product (display equipment) — each document represents one display product
 * that belongs to exactly ONE series and can reference multiple printing services.
 *
 * Relationships:
 *   - product.series        → series (1:N, one series per product)
 *   - product.printingServices → service (N:N via reference[])
 *
 * Pricing is optional: B2B display equipment often has no fixed list price.
 * Never fabricate prices — use `priceDisplay = "quote"` instead.
 */
export const product = defineType({
  name: "product",
  title: "产品",
  type: "document",
  icon: PackageIcon,
  groups: [
    { name: "content", title: "基础内容", default: true },
    { name: "classification", title: "分类与关联" },
    { name: "media", title: "图片" },
    { name: "specs", title: "规格与变体" },
    { name: "printing", title: "印刷服务" },
    { name: "pricing", title: "价格与交期" },
    { name: "seo", title: "SEO" },
  ],

  orderings: [
    {
      title: "最近更新",
      name: "updatedAtDesc",
      by: [{ field: "_updatedAt", direction: "desc" }],
    },
    {
      title: "系列内排序",
      name: "sortOrder",
      by: [
        { field: "sortOrder", direction: "asc" },
        { field: "title", direction: "asc" },
      ],
    },
    {
      title: "产品名称 A–Z",
      name: "titleAsc",
      by: [{ field: "title", direction: "asc" }],
    },
  ],

  fields: [
    // ── GROUP: Content ─────────────────────────────────────────────────────
    defineField({
      name: "title",
      title: "产品名称",
      type: "string",
      group: "content",
      description: '客户可见的产品名称，例如 "10x20ft Aluminum Event Tent"。',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug（网址标识）",
      type: "slug",
      group: "content",
      description:
        "决定产品 URL /products/[slug]。发布后不要随意修改。",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "sku",
      title: "SKU",
      type: "string",
      group: "content",
      description:
        '产品唯一型号，例如 "ES-ALT-10X20"。用于内部管理和 CSV 导入校验。',
    }),
    defineField({
      name: "summary",
      title: "简短介绍",
      type: "text",
      group: "content",
      rows: 2,
      description: "显示在产品列表卡片和搜索结果，建议 60–120 个字符。",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "详细介绍",
      type: "array",
      group: "content",
      description:
        "产品详情页正文。使用富文本编辑器，可包含多段落和列表。",
      of: [defineArrayMember({ type: "block" })],
    }),
    defineField({
      name: "isActive",
      title: "在前台显示",
      type: "boolean",
      group: "content",
      description: "关闭后该产品不出现在列表和搜索中，但仍保留详情页链接（可直接访问）。",
      initialValue: true,
    }),
    defineField({
      name: "isFeatured",
      title: "推荐产品",
      type: "boolean",
      group: "content",
      description: "开启后在系列页面优先展示。",
      initialValue: false,
    }),
    defineField({
      name: "sortOrder",
      title: "系列内排序",
      type: "number",
      group: "content",
      description: "数字越小越靠前。留空时按名称排序。",
    }),

    // ── GROUP: Classification ──────────────────────────────────────────────
    defineField({
      name: "series",
      title: "所属产品系列",
      type: "reference",
      group: "classification",
      description:
        "该产品属于哪个系列。系列决定产品出现在哪个筛选分类中。",
      to: [{ type: "series" }],
      validation: (rule) => rule.required().error("必须选择所属系列。"),
    }),
    defineField({
      name: "materials",
      title: "主要材料",
      type: "array",
      group: "classification",
      description: '例如 "Aluminum alloy", "Polyester 600D", "Steel"。',
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
    }),
    defineField({
      name: "customizationOptions",
      title: "可定制项目",
      type: "array",
      group: "classification",
      description:
        '客户可以自定义的内容，例如 "Logo printing", "Custom size", "Color matching"。',
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
    }),

    // ── GROUP: Media ─────────────────────────────────────────────────────
    mediaField({
      name: "mainImage",
      title: "产品主图",
      type: "image",
      group: "media",
      mediaTags: ["scope-product", "role-featured"],
      description:
        "产品详情页主图和产品列表卡片共用。优先使用干净背景的正面照。",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "替代文字",
          type: "string",
          description: "一句话描述产品，便于无障碍访问和 SEO。",
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "galleryImages",
      title: "图片集",
      type: "array",
      group: "media",
      description: "产品详情页的其他角度、细节和场景图。第一张不要重复主图。",
      of: [
        defineArrayMember({
          type: "object",
          name: "galleryImage",
          fields: [
            mediaField({
              name: "image",
              title: "图片",
              type: "image",
              mediaTags: ["scope-product", "role-gallery"],
              options: { hotspot: true },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "alt",
              title: "替代文字",
              type: "string",
              description: "描述产品视角或细节。",
            }),
            defineField({
              name: "label",
              title: "图片标签",
              type: "string",
              description: '显示在缩略图附近，例如 "Side view"、"Detail"。',
            }),
          ],
          preview: {
            select: { title: "label", subtitle: "alt", media: "image" },
          },
        }),
      ],
    }),

    // ── GROUP: Specs & Variants ───────────────────────────────────────────
    defineField({
      name: "keyFeatures",
      title: "核心特点",
      type: "array",
      group: "specs",
      description: "产品核心卖点，建议 3–5 项。",
      of: [
        defineArrayMember({
          type: "object",
          name: "keyFeature",
          fields: [
            defineField({
              name: "title",
              title: "特点标题",
              type: "string",
              description: '例如 "Lightweight aluminum frame"',
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
      name: "keySpecs",
      title: "核心参数",
      type: "array",
      group: "specs",
      description:
        "产品详情页顶部的关键数字参数，例如尺寸、承重。",
      of: [
        defineArrayMember({
          type: "object",
          name: "keySpec",
          fields: [
            defineField({
              name: "label",
              title: "参数名称",
              type: "string",
              description: '例如 "Size", "Max wind speed", "Weight"',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "value",
              title: "数值",
              type: "string",
              description: '带单位的值，例如 "10 × 20 ft", "150 kg"',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "note",
              title: "补充说明",
              type: "string",
              description: '可选，例如 "EN 13782 certified"',
            }),
          ],
          preview: {
            select: { label: "label", value: "value", note: "note" },
            prepare: ({ label, value, note }) => ({
              title: label || "未命名参数",
              subtitle: [value, note].filter(Boolean).join(" · "),
            }),
          },
        }),
      ],
    }),
    defineField({
      name: "variants",
      title: "产品规格变体",
      type: "array",
      group: "specs",
      description:
        "如有不同尺寸、颜色、材质规格选项，在此录入。每个变体可单独关联 SKU。",
      of: [
        defineArrayMember({
          type: "object",
          name: "productVariant",
          fields: [
            defineField({
              name: "variantName",
              title: "变体名称",
              type: "string",
              description: '例如 "10x15ft", "White", "Premium Grade"',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "sku",
              title: "SKU",
              type: "string",
              description: "该变体专属的 SKU（可选）。",
            }),
            defineField({
              name: "attributes",
              title: "属性",
              type: "object",
              description: "可自由填写颜色、尺寸、材料等属性。",
              fields: [
                defineField({
                  name: "size",
                  title: "尺寸",
                  type: "string",
                  description: '例如 "10 × 20 ft"',
                }),
                defineField({
                  name: "color",
                  title: "颜色",
                  type: "string",
                }),
                defineField({
                  name: "material",
                  title: "材料",
                  type: "string",
                }),
                defineField({
                  name: "weight",
                  title: "重量",
                  type: "string",
                  description: '例如 "85 kg"',
                }),
              ],
            }),
            mediaField({
              name: "image",
              title: "变体图片",
              type: "image",
              mediaTags: ["scope-product", "role-gallery"],
              options: { hotspot: true },
              fields: [
                defineField({
                  name: "alt",
                  title: "替代文字",
                  type: "string",
                }),
              ],
            }),
            defineField({
              name: "isDefault",
              title: "默认选项",
              type: "boolean",
              description: "开启后作为前台默认选中的变体。每个变体列表只能有一个默认。",
              initialValue: false,
            }),
          ],
          preview: { select: { title: "variantName", subtitle: "sku" } },
        }),
      ],
    }),

    // ── GROUP: Printing Services ───────────────────────────────────────────
    defineField({
      name: "printingServices",
      title: "支持的印刷服务",
      type: "array",
      group: "printing",
      description:
        "该产品支持哪些印刷服务。用于产品详情页展示和服务筛选。",
      of: [
        {
          type: "reference",
          to: [{ type: "service" }],
        },
      ],
      validation: (rule) => rule.unique(),
    }),

    // ── GROUP: Pricing ─────────────────────────────────────────────────────
    defineField({
      name: "priceDisplay",
      title: "价格展示模式",
      type: "string",
      group: "pricing",
      description:
        "B2B 产品通常无固定价格。选择「仅询价」后，前台显示 Get a quote 而不显示价格。",
      options: {
        list: [
          { title: "显示精确价格", value: "show" },
          { title: "显示价格区间", value: "range" },
          { title: "仅显示询价按钮", value: "quote" },
        ],
        layout: "radio",
      },
      initialValue: "quote",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "price",
      title: "精确价格",
      type: "number",
      group: "pricing",
      description: "单台参考出厂价，不要写货币符号。",
      hidden: ({ parent }) => parent?.priceDisplay !== "show",
      validation: (rule) =>
        rule.min(0).custom((value, context) => {
          const parent = context.parent as { priceDisplay?: string } | undefined;
          return parent?.priceDisplay !== "show" || value != null
            ? true
            : "请输入精确价格，或切换为其他模式。";
        }),
    }),
    defineField({
      name: "priceMin",
      title: "最低参考价",
      type: "number",
      group: "pricing",
      description: "价格区间的下限（不带货币符号）。",
      hidden: ({ parent }) => parent?.priceDisplay !== "range",
      validation: (rule) =>
        rule.min(0).custom((value, context) => {
          const parent = context.parent as { priceDisplay?: string } | undefined;
          return parent?.priceDisplay !== "range" || value != null
            ? true
            : "请输入最低参考价。";
        }),
    }),
    defineField({
      name: "priceMax",
      title: "最高参考价",
      type: "number",
      group: "pricing",
      description: "不能低于最低参考价。",
      hidden: ({ parent }) => parent?.priceDisplay !== "range",
      validation: (rule) =>
        rule.min(0).custom((value, context) => {
          const parent = context.parent as
            | { priceDisplay?: string; priceMin?: number }
            | undefined;
          if (parent?.priceDisplay !== "range") return true;
          if (value == null) return "请输入最高参考价。";
          return parent.priceMin == null || value >= parent.priceMin
            ? true
            : "最高参考价不能低于最低参考价。";
        }),
    }),
    defineField({
      name: "currency",
      title: "价格币种",
      type: "string",
      group: "pricing",
      options: {
        list: [
          { title: "USD", value: "USD" },
          { title: "EUR", value: "EUR" },
          { title: "GBP", value: "GBP" },
          { title: "CNY", value: "CNY" },
        ],
      },
      initialValue: "USD",
      hidden: ({ parent }) =>
        !["show", "range"].includes(parent?.priceDisplay),
    }),
    defineField({
      name: "priceUnit",
      title: "价格单位说明",
      type: "string",
      group: "pricing",
      description: '显示在价格下方，例如 "per unit", "EXW Suzhou"。',
      initialValue: "ex-works / unit",
      hidden: ({ parent }) => parent?.priceDisplay === "quote",
    }),
    defineField({
      name: "moq",
      title: "最小起订量",
      type: "number",
      group: "pricing",
      description: '例如 10。可混批时在下方补充说明。',
      validation: (rule) => rule.min(1).integer(),
    }),
    defineField({
      name: "productionLeadTime",
      title: "生产周期",
      type: "string",
      group: "pricing",
      description: '例如 "7-15 days"。这是生产时间，不含运输时间。',
    }),
    defineField({
      name: "warranty",
      title: "质保说明",
      type: "string",
      group: "pricing",
      description: '例如 "1 year structural warranty"。',
    }),

    // ── GROUP: SEO ────────────────────────────────────────────────────────
    defineField({
      name: "metaTitle",
      title: "SEO 标题",
      type: "string",
      group: "seo",
      description: "留空则默认使用产品名称。控制在 50–60 个字符。",
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
      description: "分享到 LinkedIn 等平台时显示的预览图。建议 1200×630 px。",
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
      sku: "sku",
      seriesTitle: "series.title",
      isActive: "isActive",
      media: "mainImage",
    },
    prepare: ({ title, sku, seriesTitle, isActive, media }) => ({
      title: title || "未命名产品",
      subtitle: [
        sku,
        seriesTitle,
        isActive === false ? "已隐藏" : null,
      ]
        .filter(Boolean)
        .join(" · "),
      media,
    }),
  },
});
