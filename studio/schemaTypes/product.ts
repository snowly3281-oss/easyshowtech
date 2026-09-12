import { defineType, defineField, defineArrayMember } from "sanity";
import { PackageIcon } from "@sanity/icons";
import { mediaField } from "sanity-plugin-media";

/**
 * Product (v2, full PDP) — EXTENDS v1, does not replace it.
 *
 * Every v1 field is preserved (title, slug, sku, status, series, equipment,
 * priceDisplay, price, currency, mainImage, gallery, summary, keySpecs,
 * variants, order). v2 evolves `gallery`, `keySpecs` and `variants` in place
 * (richer shapes) and adds new fields for the full datasheet, header
 * quick-stats, wholesale/OEM terms, related products and a rich description.
 *
 * The document is now large, so fields are organised into five operator-facing
 * Studio groups. The stored field names and shapes remain backwards compatible.
 *
 * Still NOT modelled (future): per-variant SKU/price/image, structured
 * mechanism objects beyond label/value rows.
 */

interface DatasheetGroupConfig {
  name: string;
  title: string;
  group: string;
  description?: string;
}

/**
 * Build one datasheet sub-table: an array of {label, value} rows. The inline
 * member type gets a unique name (`<name>Row`) so the four datasheet arrays
 * don't collide in the schema's type namespace.
 */
function datasheetGroup({
  name,
  title,
  group,
  description,
}: DatasheetGroupConfig) {
  return defineField({
    name,
    title,
    type: "array",
    group,
    description,
    of: [
      defineArrayMember({
        type: "object",
        name: `${name}Row`,
        fields: [
          defineField({
            name: "label",
            title: "参数名称",
            type: "string",
            validation: (rule) => rule.required(),
          }),
          defineField({
            name: "value",
            title: "参数值",
            type: "string",
            description: "请连同单位或范围填写，例如 245 × 65 × 35 cm。",
            validation: (rule) => rule.required(),
          }),
        ],
        preview: { select: { title: "label", subtitle: "value" } },
      }),
    ],
  });
}

export const product = defineType({
  name: "product",
  title: "产品",
  type: "document",
  icon: PackageIcon,

  // Keep the editor compact for day-to-day operators. These groups only affect
  // Studio presentation; they do not change the stored document shape.
  groups: [
    { name: "content", title: "基础内容", default: true },
    { name: "product", title: "分类、状态与价格" },
    { name: "media", title: "图片与媒体" },
    { name: "specifications", title: "规格、变体与 OEM" },
    { name: "partDetails", title: "配件适配与维护" },
    { name: "advanced", title: "SEO 与高级数据" },
  ],

  orderings: [
    {
      title: "最近更新",
      name: "updatedAtDesc",
      by: [{ field: "_updatedAt", direction: "desc" }],
    },
    {
      title: "目录顺序",
      name: "catalogOrder",
      by: [
        { field: "order", direction: "asc" },
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
    // ─────────────────────────────────────────────────────────────────────
    // GROUP: Identity (v1)
    // ─────────────────────────────────────────────────────────────────────
    defineField({
      name: "title",
      title: "产品名称",
      type: "string",
      group: "content",
      description: '客户可见的正式产品名称，例如 "Studio Reformer Pro"。',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "网址标识 Slug",
      type: "slug",
      group: "content",
      description:
        "决定产品网址 /products/[slug]。发布后不要随意修改，否则旧链接会失效。",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "sku",
      title: "SKU",
      type: "string",
      group: "product",
      description:
        '产品唯一型号，例如 "Eleven-M-RE010"。必须与图片文件名和报价资料一致。',
      validation: (rule) => rule.required().error("请填写 SKU。"),
    }),
    defineField({
      name: "status",
      title: "网站显示状态",
      type: "string",
      group: "product",
      description:
        "控制产品是否允许出现在前台。选择“网站可见”后仍需点击右上角 Publish 才会正式上线；这与停产/可订购状态是两个概念。",
      options: {
        list: [
          { title: "网站可见", value: "published" },
          { title: "网站隐藏/资料未完成", value: "draft" },
          { title: "归档", value: "archived" },
        ],
        layout: "radio",
      },
      initialValue: "published",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "series",
      title: "所属产品系列",
      type: "reference",
      group: "product",
      description:
        "整机产品所属的主系列。只有整机需要填写；配件请在“配件适配与维护”中关联可适配产品。",
      to: [{ type: "series" }],
      hidden: ({ parent }) =>
        parent?.catalogType === "accessory" || parent?.catalogType === "spare_part",
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { catalogType?: string } | undefined;
          const catalogType = parent?.catalogType ?? "equipment";
          return catalogType !== "equipment" || value
            ? true
            : "整机产品需要选择所属产品系列。";
        }),
    }),
    defineField({
      name: "equipment",
      title: "旧器械分类（已停用）",
      type: "reference",
      group: "product",
      description: "Legacy single-value field. Use Equipment types instead.",
      to: [{ type: "equipment" }],
      deprecated: {
        reason:
          "Replaced by Equipment types so hybrid products can belong to more than one type.",
      },
      hidden: true,
    }),
    defineField({
      name: "equipmentTypes",
      title: "器械类型",
      type: "array",
      group: "product",
      description:
        "前台“按器械”筛选使用的分类。混合型产品可以选择多个，例如 Reformer + Cadillac。",
      of: [
        {
          type: "reference",
          to: [{ type: "equipment" }],
        },
      ],
      hidden: ({ parent }) =>
        parent?.catalogType === "accessory" || parent?.catalogType === "spare_part",
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { catalogType?: string } | undefined;
          const catalogType = parent?.catalogType ?? "equipment";
          return catalogType !== "equipment" || (Array.isArray(value) && value.length > 0)
            ? true
            : "整机产品至少需要选择一个器械类型。";
        }).unique(),
    }),
    defineField({
      name: "catalogType",
      title: "目录类型",
      type: "string",
      group: "product",
      description:
        "决定产品出现在哪个前台目录。现有整机设备保持“整机设备”即可；只有附件或维修替换件才需要改动。",
      options: {
        list: [
          {title: "整机设备（Products 主目录）", value: "equipment"},
          {title: "训练附件 / Accessories", value: "accessory"},
          {title: "维修与替换零件 / Spare parts", value: "spare_part"},
        ],
        layout: "radio",
      },
      initialValue: "equipment",
      // Existing launch-catalog records predate this field. The front end
      // treats an omitted value as "equipment", so do not make an untouched
      // legacy document fail validation merely because this classification is
      // newly available.
    }),
    defineField({
      name: "partsCategory",
      title: "附件 / 零件分类",
      type: "string",
      group: "product",
      description: "便于内部管理和后续筛选。整机设备不需要填写。",
      hidden: ({parent}) => !parent?.catalogType || parent.catalogType === "equipment",
      options: {
        list: [
          {title: "弹簧与阻力系统", value: "springs"},
          {title: "皮革、坐垫与软包", value: "upholstery"},
          {title: "绳索、滑轮与线缆", value: "cables_ropes"},
          {title: "脚杆与五金", value: "footbars_hardware"},
          {title: "训练辅件（箱、垫、跳板等）", value: "training_accessories"},
          {title: "其他", value: "other"},
        ],
      },
    }),
    defineField({
      name: "compatibleProducts",
      title: "适配的整机产品",
      type: "array",
      group: "partDetails",
      description:
        "附件和替换件都建议关联可适配的整机产品。客户会在配件详情页看到这些链接，避免误购。",
      hidden: ({parent}) =>
        parent?.catalogType !== "accessory" && parent?.catalogType !== "spare_part",
      of: [defineArrayMember({type: "reference", to: [{type: "product"}]})],
      validation: (rule) => rule.unique(),
    }),

    // ─────────────────────────────────────────────────────────────────────
    // GROUP: Part fit, installation & care
    // These fields are deliberately concise. A parts PDP needs a clear fit
    // decision and reliable service notes, not the full apparatus datasheet.
    // ─────────────────────────────────────────────────────────────────────
    defineField({
      name: "compatibilityNotes",
      title: "适配说明",
      type: "text",
      rows: 3,
      group: "partDetails",
      description:
        "说明适配型号、年份/版本、左右件或不适配情况。例如：仅适配 2024 年后 Maple Reformer；下单前请核对 SKU。",
      hidden: ({parent}) =>
        parent?.catalogType !== "accessory" && parent?.catalogType !== "spare_part",
    }),
    defineField({
      name: "installationNotes",
      title: "安装与更换说明",
      type: "text",
      rows: 3,
      group: "partDetails",
      description:
        "填写客户下单前需要知道的安装条件、是否需专业人员或需要的工具。不要编造安全要求。",
      hidden: ({parent}) =>
        parent?.catalogType !== "accessory" && parent?.catalogType !== "spare_part",
    }),
    defineField({
      name: "careNotes",
      title: "保养说明",
      type: "text",
      rows: 3,
      group: "partDetails",
      description:
        "填写清洁、检查或储存建议。仅填写已确认的工厂建议。",
      hidden: ({parent}) =>
        parent?.catalogType !== "accessory" && parent?.catalogType !== "spare_part",
    }),
    defineField({
      name: "replacementGuidance",
      title: "更换周期 / 服务提示",
      type: "string",
      group: "partDetails",
      description:
        "可选。填写已确认的更换周期或检查触发条件，例如“每 12 个月检查一次”。没有正式建议时请留空。",
      hidden: ({parent}) =>
        parent?.catalogType !== "accessory" && parent?.catalogType !== "spare_part",
    }),

    // ─────────────────────────────────────────────────────────────────────
    // GROUP: Status & availability (v2 new)
    // ─────────────────────────────────────────────────────────────────────
    defineField({
      name: "productionStatus",
      title: "产品可订购状态",
      type: "string",
      group: "product",
      description:
        "客户可见的业务状态，不控制页面是否发布。用于区分常规生产、按单生产和已停产产品。",
      options: {
        list: [
          { title: "正常生产", value: "in_production" },
          { title: "按订单生产", value: "made_to_order" },
          { title: "已停产", value: "discontinued" },
        ],
        layout: "radio",
      },
      initialValue: "in_production",
    }),
    defineField({
      name: "shipsIn",
      title: "预计出货时间",
      type: "string",
      group: "product",
      description:
        '显示在产品头部，例如 "6–8 weeks"。如交期因数量而异，请填写范围。',
    }),
    defineField({
      name: "certifications",
      title: "认证标签",
      type: "array",
      group: "product",
      description:
        '例如 "CE"、"EN 20957"。这里只填写简短标签，证书链接在高级数据中维护。',
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
    }),

    // ─────────────────────────────────────────────────────────────────────
    // GROUP: Header & pricing
    // ─────────────────────────────────────────────────────────────────────
    defineField({
      name: "priceDisplay",
      title: "该产品的价格模式",
      type: "string",
      group: "product",
      description:
        "选择精确价格、参考区间或仅询价。即使这里填写了价格，“网站全局设置”的价格总开关仍可统一隐藏。",
      options: {
        list: [
          { title: "显示精确价格", value: "show" },
          { title: "显示价格区间", value: "range" },
          { title: "仅显示 Get a quote", value: "quote" },
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
      group: "product",
      description: "单台出厂参考价，不要填写货币符号；币种在下方选择。",
      hidden: ({ parent }) => parent?.priceDisplay !== "show",
      validation: (rule) =>
        rule.min(0).custom((value, context) => {
          const parent = context.parent as { priceDisplay?: string } | undefined;
          return parent?.priceDisplay !== "show" || value != null
            ? true
            : "请输入精确价格，或选择其他价格模式。";
        }),
    }),
    defineField({
      name: "priceMin",
      title: "最低参考价",
      type: "number",
      group: "product",
      description: "价格区间的下限，不要填写货币符号。",
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
      group: "product",
      description: "价格区间的上限，不能低于最低参考价。",
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
      group: "product",
      description: "上方精确价格或价格区间所使用的币种。",
      options: {
        list: [
          { title: "USD", value: "USD" },
          { title: "EUR", value: "EUR" },
          { title: "GBP", value: "GBP" },
          { title: "CNY", value: "CNY" },
        ],
      },
      initialValue: "USD",
      hidden: ({ parent }) => !["show", "range"].includes(parent?.priceDisplay),
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { priceDisplay?: string } | undefined;
          return !["show", "range"].includes(parent?.priceDisplay ?? "") || value
            ? true
            : "请选择价格币种。";
        }),
    }),
    defineField({
      name: "priceUnit",
      title: "价格单位说明",
      type: "string",
      group: "product",
      description: '显示在价格下方，例如 "per unit"、"EXW Suzhou"。',
      initialValue: "ex-works / unit",
      hidden: ({ parent }) => parent?.priceDisplay === "quote",
    }),
    defineField({
      name: "priceNote",
      title: "价格补充说明",
      type: "string",
      group: "product",
      description: "用于说明税费、运输或数量条件；不要在这里写大段销售文案。",
      initialValue: "Volume & OEM on request",
      hidden: ({ parent }) => parent?.priceDisplay === "quote",
    }),
    // Multi-currency price list — for quotes across markets and the Product
    // JSON-LD `offers`. The scalar `price`/`currency` above stays the simple
    // on-page display; `pricing[]` is the machine-readable / multi-market source.
    defineField({
      name: "pricing",
      title: "多币种结构化价格",
      type: "array",
      group: "product",
      description:
        "可选，仅在甲方能长期维护多个精确币种价格时使用。每个币种只能填写一条。",
      hidden: ({ parent }) => parent?.priceDisplay !== "show",
      of: [
        defineArrayMember({
          type: "object",
          name: "priceEntry",
          fields: [
            defineField({
              name: "currency",
              title: "币种",
              type: "string",
              options: {
                list: [
                  { title: "USD", value: "USD" },
                  { title: "EUR", value: "EUR" },
                  { title: "GBP", value: "GBP" },
                  { title: "CNY", value: "CNY" },
                ],
              },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "amount",
              title: "金额",
              type: "number",
              validation: (rule) => rule.required().min(0),
            }),
            defineField({
              name: "validUntil",
              title: "价格有效期",
              type: "date",
              description:
                "可选，用于搜索引擎结构化数据；到期后需要运营人员更新。",
            }),
          ],
          preview: {
            select: { currency: "currency", amount: "amount" },
            prepare: ({
              currency,
              amount,
            }: {
              currency?: string;
              amount?: number;
            }) => ({
              title:
                [currency, amount]
                  .filter((v) => v !== undefined && v !== "")
                  .join(" ") || "Price",
            }),
          },
        }),
      ],
      validation: (rule) =>
        rule.custom((entries?: { currency?: string }[]) => {
          if (!entries) return true;
          const currencies = entries
            .map((entry) => entry?.currency)
            .filter(Boolean);
          return (
            new Set(currencies).size === currencies.length ||
            "每个币种只能出现一次。"
          );
        }),
    }),
    // Header quick-stats (the three small boxes).
    defineField({
      name: "moq",
      title: "最小起订量 MOQ",
      type: "string",
      group: "product",
      description: '显示在产品头部的快捷信息，例如 "10 units"。可混批时请在 OEM 条款中补充说明。',
    }),
    defineField({
      name: "leadTime",
      title: "生产周期",
      type: "string",
      group: "product",
      description: '显示在产品头部，例如 "6–8 wks"。',
    }),
    defineField({
      name: "warranty",
      title: "质保期限",
      type: "string",
      group: "product",
      description: '显示在产品头部，例如 "10 years"。具体条款请链接到质保政策。',
    }),

    // ─────────────────────────────────────────────────────────────────────
    // GROUP: Media (v1 mainImage + upgraded gallery)
    // ─────────────────────────────────────────────────────────────────────
    mediaField({
      name: "mainImage",
      title: "产品首图 Featured Image",
      type: "image",
      mediaTags: ["scope-product", "role-featured"],
      group: "media",
      description:
        "产品详情页主图和 Products 列表卡片共用。优先使用甲方提供的 Featured Image，建议干净背景并完整展示设备。",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "替代文字 Alt",
          type: "string",
          description: "用一句话描述产品与视角，不要填写文件名；有助于无障碍访问和 SEO。",
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "mainImageDimensionNote",
      title: "主图尺寸标注",
      type: "string",
      group: "media",
      description:
        '叠加显示在主图上的简短尺寸，例如 "245 × 65 × 35 cm"。',
    }),
    // UPGRADE: gallery is now an array of objects (image + alt + label).
    defineField({
      name: "gallery",
      title: "产品图片画廊",
      type: "array",
      group: "media",
      description:
        "详情页其他角度、细节、使用场景和包装图。第一张不要重复首图，可拖动调整顺序。",
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
              title: "替代文字 Alt",
              type: "string",
              description: "描述产品型号、视角或细节，供无障碍访问和 SEO 使用。",
            }),
            defineField({
              name: "label",
              title: "图片标签",
              type: "string",
              description:
                '显示在缩略图附近，例如 "Front"、"Detail"、"Springs"、"Packed"。',
            }),
          ],
          preview: {
            select: { title: "label", subtitle: "alt", media: "image" },
          },
        }),
      ],
    }),

    // ─────────────────────────────────────────────────────────────────────
    // GROUP: At a glance (UPGRADE v1 keySpecs)
    // ─────────────────────────────────────────────────────────────────────
    defineField({
      name: "keySpecs",
      title: "核心参数 At a glance",
      type: "array",
      group: "specifications",
      description:
        '产品页顶部的大数字参数，建议 3–4 项。数值和单位分开填写；范围可以写成 "12–340"。',
      of: [
        defineArrayMember({
          type: "object",
          name: "keySpec",
          fields: [
            defineField({
              name: "value",
              title: "数值",
              type: "string",
              description: '主数字，例如 "150" 或 "12–340"。',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "unit",
              title: "单位",
              type: "string",
              description: '例如 "kg"、"cm"、"N"。',
            }),
            defineField({
              name: "label",
              title: "参数名称",
              type: "string",
              description: '例如 "Max user load"。',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "note",
              title: "补充说明",
              type: "string",
              description: '例如 "Tested to EN 20957"。',
            }),
          ],
          preview: {
            select: { value: "value", unit: "unit", label: "label" },
            prepare(sel: { value?: string; unit?: string; label?: string }) {
              const head = [sel.value, sel.unit].filter(Boolean).join(" ");
              return {
                title: head || sel.label || "Spec",
                subtitle: head ? sel.label : undefined,
              };
            },
          },
        }),
      ],
    }),

    // ─────────────────────────────────────────────────────────────────────
    // GROUP: Materials & variants (UPGRADE v1 variants)
    // ─────────────────────────────────────────────────────────────────────
    defineField({
      name: "variants",
      title: "材质与产品变体",
      type: "array",
      group: "specifications",
      description:
        "显示在产品页的材质、木种或表面处理选项。这里只填写真实可供应选项，不要把公共皮革颜色重复录入。",
      of: [
        defineArrayMember({
          type: "object",
          name: "variant",
          fields: [
            defineField({
              name: "name",
              title: "变体名称",
              type: "string",
              description: '例如 "Oak"、"Maple"、"Walnut"。',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "skuSuffix",
              title: "SKU 后缀",
              type: "string",
              description: '可选，追加到基础 SKU，例如 "-OAK"。',
            }),
            defineField({
              name: "isDefault",
              title: "默认选项",
              type: "boolean",
              description: "开启后前台显示 DEFAULT 标记；同一产品只应有一个默认选项。",
              initialValue: false,
            }),
            defineField({
              name: "description",
              title: "变体说明",
              type: "text",
              rows: 2,
              description:
                'e.g. "Warm, open grain with a pale gold tone. The studio default."',
            }),
            defineField({
              name: "janka",
              title: "Janka 木材硬度",
              type: "string",
              description: 'Hardness, e.g. "Janka 1090".',
            }),
            defineField({
              name: "finish",
              title: "表面处理",
              type: "string",
              description: 'e.g. "Natural matte".',
            }),
            defineField({
              name: "swatchColor",
              title: "色卡 Hex",
              type: "string",
              description: 'Hex for the material swatch, e.g. "#b88a4a".',
              validation: (rule) =>
                rule.custom((value) => {
                  if (typeof value !== "string" || value.length === 0)
                    return true;
                  return (
                    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value) ||
                    "请使用类似 #b88a4a 的 Hex 色值。"
                  );
                }),
            }),
          ],
          preview: { select: { title: "name", subtitle: "finish" } },
        }),
      ],
    }),

    // ─────────────────────────────────────────────────────────────────────
    // GROUP: Datasheet (v2 new — four label/value sub-tables)
    // ─────────────────────────────────────────────────────────────────────
    datasheetGroup({
      name: "specDimensions",
      title: "尺寸参数",
      group: "specifications",
      description:
        'e.g. Product size (L×W×H) = "245 × 65 × 35 cm", Carriage travel = "95 cm".',
    }),
    datasheetGroup({
      name: "specWeight",
      title: "重量与承重",
      group: "specifications",
      description:
        'e.g. Net weight = "62 kg", Gross weight = "78 kg", Max user weight = "150 kg".',
    }),
    datasheetGroup({
      name: "specMechanism",
      title: "机械与弹簧系统",
      group: "specifications",
      description:
        'e.g. Spring system = "5 springs · 3 heavy / 1 medium / 1 light", Resistance = "12 – 340 N".',
    }),
    datasheetGroup({
      name: "specMaterials",
      title: "材质与包装清单",
      group: "specifications",
      description:
        'e.g. Frame material = "Solid oak", Finish = "Low-VOC matte seal", In the box = "Foot bar, …".',
    }),
    mediaField({
      name: "specPdf",
      title: "产品规格书 PDF",
      type: "file",
      mediaTags: ["scope-product", "role-document"],
      group: "specifications",
      description: "该产品独立的规格书，前台 Download full spec 按钮会下载此文件。",
      options: { accept: "application/pdf" },
    }),
    defineField({
      name: "specRevision",
      title: "规格书版本号",
      type: "string",
      group: "specifications",
      description: '例如 "REV. 2024.1"。规格变更后应同步更新 PDF 与版本号。',
    }),

    // ─────────────────────────────────────────────────────────────────────
    // GROUP: Wholesale & OEM (v2 new — single array, see report note)
    // ─────────────────────────────────────────────────────────────────────
    defineField({
      name: "oemTerms",
      title: "批发与 OEM 条款",
      type: "array",
      group: "specifications",
      description:
        "显示在产品页的批发信息。建议维护 MOQ、Lead time、Private label、Packaging、Payment、Shipping。",
      of: [
        defineArrayMember({
          type: "object",
          name: "oemTerm",
          fields: [
            defineField({
              name: "label",
              title: "条款名称",
              type: "string",
              description:
                'e.g. "MOQ", "Lead time", "Private label", "Packaging", "Payment", "Shipping".',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "value",
              title: "条款值",
              type: "string",
              description:
                'e.g. "10 units", "6–8 weeks", "Available", "30 / 70", "FOB / CIF".',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "note",
              title: "补充说明",
              type: "string",
              description:
                'e.g. "Models can be mixed", "After deposit clears", "T/T or L/C at sight".',
            }),
          ],
          preview: {
            select: { label: "label", value: "value", note: "note" },
            prepare(sel: { label?: string; value?: string; note?: string }) {
              return {
                title:
                  [sel.label, sel.value].filter(Boolean).join(": ") || "Term",
                subtitle: sel.note,
              };
            },
          },
        }),
      ],
    }),

    // ─────────────────────────────────────────────────────────────────────
    // GROUP: Related (v2 new)
    // ─────────────────────────────────────────────────────────────────────
    defineField({
      name: "relatedProducts",
      title: "相关推荐产品",
      type: "array",
      group: "advanced",
      description:
        "用于人工指定相关推荐。留空时前台可以自动选择同系列产品；不要选择当前产品本身。",
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

    // ─────────────────────────────────────────────────────────────────────
    // GROUP: Structured data (SEO / JSON-LD) — additive, all optional.
    // The front end emits Product schema JSON-LD from these plus sku / gallery
    // / pricing / moq / leadTime. Naming notes: `warrantyUrl` (a link) is
    // distinct from the existing `warranty` header stat (e.g. "10 years");
    // `certs` (label + url) complements the existing `certifications` labels.
    // ─────────────────────────────────────────────────────────────────────
    defineField({
      name: "brand",
      title: "品牌（结构化数据）",
      type: "string",
      group: "advanced",
      description: "供搜索引擎使用，默认 Coral Pilates，普通运营无需修改。",
      initialValue: "Coral Pilates",
    }),
    defineField({
      name: "mpn",
      title: "MPN",
      type: "string",
      group: "advanced",
      description: "制造商产品编号，可选；没有独立 MPN 时可留空。",
    }),
    defineField({
      name: "gtin13",
      title: "GTIN-13",
      type: "string",
      group: "advanced",
      description: "13 位 EAN 条形码，可选；没有正式编码时不要编造。",
      validation: (rule) =>
        rule.custom(
          (value?: string) =>
            !value ||
            /^\d{13}$/.test(value) ||
            "GTIN-13 必须正好为 13 位数字。",
        ),
    }),
    defineField({
      name: "material",
      title: "主要材质（结构化数据）",
      type: "string",
      group: "advanced",
      description:
        'Short material for structured data, e.g. "Solid oak". The datasheet holds the full breakdown.',
    }),
    defineField({
      name: "dimensions",
      title: "总体尺寸（结构化数据）",
      type: "string",
      group: "advanced",
      description: 'Overall size for structured data, e.g. "245 × 65 × 35 cm".',
    }),
    defineField({
      name: "weight",
      title: "净重（结构化数据）",
      type: "string",
      group: "advanced",
      description:
        'Net weight for structured data, e.g. "62 kg". (String preserves the unit.)',
    }),
    defineField({
      name: "warrantyUrl",
      title: "质保政策网址",
      type: "url",
      group: "advanced",
      description:
        'Link to the warranty terms. (The header "Warranty" stat holds the duration text.)',
      validation: (rule) => rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "certs",
      title: "认证文件链接",
      type: "array",
      group: "advanced",
      description:
        "认证名称和公开链接。上方认证标签用于展示，这里用于链接证书文件或认证页面。",
      of: [
        defineArrayMember({
          type: "object",
          name: "certLink",
          fields: [
            defineField({
              name: "label",
              title: "认证名称",
              type: "string",
              description: 'e.g. "CE", "EN 20957".',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "url",
              title: "认证文件网址",
              type: "url",
              description: "可公开访问的证书文件或认证页面网址。",
              validation: (rule) => rule.uri({ scheme: ["http", "https"] }),
            }),
          ],
          preview: { select: { title: "label", subtitle: "url" } },
        }),
      ],
    }),

    // ─────────────────────────────────────────────────────────────────────
    // GROUP: Summary & description (v1 summary/order + v2 rich description)
    // ─────────────────────────────────────────────────────────────────────
    defineField({
      name: "summary",
      title: "产品摘要",
      type: "text",
      rows: 3,
      group: "content",
      description:
        "显示在 Products 卡片和产品页开头，建议 1–2 句话，说明产品定位与核心优势。",
    }),
    defineField({
      name: "description",
      title: "产品详细说明",
      type: "array",
      group: "content",
      description:
        "需要比摘要更完整的产品介绍时填写。规格数字仍应放在规格字段，不要混在文案中。",
      of: [defineArrayMember({ type: "block" })],
    }),
    defineField({
      name: "order",
      title: "目录排序（高级）",
      type: "number",
      group: "advanced",
      description:
        "数字越小越靠前。建议按 10、20、30 递增，留空时按名称排序。",
    }),
  ],

  preview: {
    select: {
      title: "title",
      sku: "sku",
      visibility: "status",
      seriesTitle: "series.title",
      media: "mainImage",
    },
    prepare: ({ title, sku, visibility, seriesTitle, media }) => {
      const visibilityLabels: Record<string, string> = {
        published: "网站可见",
        draft: "网站隐藏",
        archived: "已归档",
      };

      return {
        title: title || "未命名产品",
        subtitle: [
          sku,
          seriesTitle,
          visibility ? (visibilityLabels[visibility] ?? visibility) : undefined,
        ]
          .filter(Boolean)
          .join(" · "),
        media,
      };
    },
  },
});
