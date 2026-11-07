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
      name: "internalModel",
      title: "内部型号 / Product Model",
      type: "string",
      group: "content",
      description: "同一产品型号共用的内部型号代码；尺寸 SKU 单独填写在变体中。",
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
      name: "productType",
      title: "产品类型",
      type: "string",
      group: "classification",
      description: "旧产品可暂时留空。新产品请选择类型；产品分类落地页的类型必须与此处一致。",
      options: { list: [
        { title: "Custom Displays", value: "customDisplay" },
        { title: "Hardware & Frames", value: "hardware" },
        { title: "Parts & Accessories", value: "partAccessory" },
      ] },
    }),
    defineField({
      name: "productCategory",
      title: "产品分类落地页",
      type: "reference",
      group: "classification",
      description: "可选。完成分类映射后再关联；不影响现有系列筛选。",
      to: [{ type: "productCategory" }],
      validation: rule => rule.custom(async (value, context) => {
        if (!value) return true
        const document = context.document as {productType?: string} | undefined
        if (!document?.productType) return "选择产品分类前，请先选择产品类型。"
        const category = await context.getClient({apiVersion: "2024-10-01"}).fetch<{productType?: string} | null>(
          '*[_type == "productCategory" && _id == $id][0]{productType}',
          {id: value._ref},
        )
        if (!category) return "所选产品分类不存在。"
        return category.productType === document.productType || "产品类型必须与所选分类的类型一致。"
      }),
    }),
    defineField({
      name: "productFamily",
      title: "产品家族 Product Family",
      type: "reference",
      group: "classification",
      description: "可选。用于组织具有相同结构平台的型号，不会单独生成 SEO 页面。",
      to: [{ type: "productFamily" }],
      validation: rule => rule.custom(async (value, context) => {
        if (!value?._ref) return true
        const document = context.document as {productCategory?: {_ref?: string}} | undefined
        if (!document?.productCategory?._ref) return true
        const family = await context.getClient({apiVersion: "2024-10-01"}).fetch<{categoryId?: string} | null>(
          '*[_type == "productFamily" && _id == $id][0]{"categoryId": productCategory._ref}',
          {id: value._ref},
        )
        return !family?.categoryId || family.categoryId === document.productCategory._ref || "产品家族与产品必须属于同一产品分类。"
      }),
    }),
    defineField({
      name: "partsCategory",
      title: "零件子分类（兼容旧数据）",
      type: "reference",
      group: "classification",
      description: "零件与配件的细分筛选项；仅选择已确认的 partsCategory 文档。",
      to: [{ type: "partsCategory" }],
    }),
    defineField({
      name: "relatedHardware",
      title: "相关硬件 / 框架",
      type: "array",
      group: "classification",
      description: "可选结构化关联；仅选择确实配套的产品，不根据系列自动推断。",
      of: [{ type: "reference", to: [{ type: "product" }] }],
      validation: rule => rule.unique(),
    }),
    defineField({
      name: "relatedCustomDisplays",
      title: "配套完整定制展示产品",
      type: "array",
      group: "classification",
      description: "仅用于确实配套的 Hardware → Custom Display 关联；不要根据系列自动推断。",
      of: [{ type: "reference", to: [{ type: "product" }] }],
      validation: rule => rule.unique(),
    }),
    defineField({
      name: "relatedAccessories",
      title: "相关配件 / 零件（新）",
      type: "array",
      group: "classification",
      description: "新建关联请使用此字段；旧 accessories 字段继续读取以兼容现有产品。",
      of: [{ type: "reference", to: [{ type: "product" }] }],
      validation: rule => rule.unique(),
    }),
    defineField({
      name: "accessories",
      title: "相关配件 / 零件",
      type: "array",
      group: "classification",
      description: "可选结构化关联；只维护产品侧关系，前台可用反向引用查询。",
      of: [{ type: "reference", to: [{ type: "product" }] }],
      validation: rule => rule.unique(),
    }),
    defineField({
      name: "relatedProducts",
      title: "相关产品",
      type: "array",
      group: "classification",
      description: "可选关联其他相关产品；请仅维护确有业务关系的一侧。",
      of: [{ type: "reference", to: [{ type: "product" }] }],
      validation: rule => rule.unique(),
    }),
    defineField({
      name: "relatedSolutions",
      title: "适用解决方案",
      type: "array",
      group: "classification",
      description: "关联适用的场景页；前台可通过反向引用补充产品关系。",
      of: [{ type: "reference", to: [{ type: "solution" }] }],
      validation: rule => rule.unique(),
    }),
    defineField({
      name: "faq",
      title: "常见问题",
      type: "array",
      group: "content",
      description: "填写已确认的产品信息；不要推测尺寸、兼容性、质保或认证。",
      of: [defineArrayMember({
        type: "object",
        name: "productFaq",
        fields: [
          defineField({ name: "question", title: "问题", type: "string", validation: rule => rule.required() }),
          defineField({ name: "answer", title: "回答", type: "text", rows: 3, validation: rule => rule.required() }),
        ],
        preview: { select: { title: "question" } },
      })],
    }),
    defineField({
      name: "oemTerms",
      title: "批发与 OEM 信息",
      type: "array",
      group: "content",
      description: "可选，仅填写已确认且适用于此产品的业务信息；留空时前台不显示该模块。",
      of: [defineArrayMember({
        type: "object",
        name: "productOemTerm",
        fields: [
          defineField({ name: "label", title: "项目", type: "string", validation: rule => rule.required() }),
          defineField({ name: "value", title: "说明", type: "string", validation: rule => rule.required() }),
          defineField({ name: "note", title: "补充说明", type: "text", rows: 2 }),
        ],
        preview: { select: { title: "label", subtitle: "value" } },
      })],
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
    defineField({
      name: "applications",
      title: "适用场景",
      type: "array",
      group: "content",
      description: "填写已确认的应用场景，例如 trade shows、retail promotions。",
      of: [defineArrayMember({type: "string"})],
      options: {layout: "tags"},
    }),
    defineField({
      name: "includedItems",
      title: "包含物品",
      type: "array",
      group: "content",
      description: "说明此型号或默认配置实际包含的内容；尺寸差异的内容填写在对应 Variant。",
      of: [defineArrayMember({type: "string"})],
      options: {layout: "tags"},
    }),
    defineField({
      name: "printAreas",
      title: "印刷区域",
      type: "array",
      group: "printing",
      of: [defineArrayMember({type: "object", name: "printArea", fields: [
        defineField({name: "name", title: "区域名称", type: "string", validation: rule => rule.required()}),
        defineField({name: "description", title: "说明", type: "text", rows: 2}),
        defineField({name: "dimensions", title: "已确认的印刷尺寸", type: "string", description: "只填写工厂已确认的尺寸及单位。"}),
      ], preview: {select: {title: "name", subtitle: "dimensions"}}})],
    }),
    defineField({
      name: "artworkRequirements",
      title: "稿件要求",
      type: "text",
      rows: 3,
      group: "printing",
      description: "可选。填写已确认的文件格式、出血或色彩要求。",
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
      name: "specifications",
      title: "技术规格（结构化）",
      type: "array",
      group: "specs",
      description: "与尺寸变体无关的型号共用规格。净重与包装毛重请分开记录；只填已核实数据。",
      of: [defineArrayMember({type: "object", name: "productSpecification", fields: [
        defineField({name: "label", title: "参数名称", type: "string", validation: rule => rule.required()}),
        defineField({name: "value", title: "参数值", type: "string", validation: rule => rule.required()}),
        defineField({name: "unit", title: "单位", type: "string"}),
        defineField({name: "note", title: "补充说明", type: "string"}),
      ], preview: {select: {title: "label", subtitle: "value"}}})],
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
            defineField({name: "sizeLabel", title: "尺寸显示名", type: "string", description: '例如 "10 × 10 ft"。优先使用此字段在目录和询价中显示尺寸。'}),
            defineField({name: "width", title: "宽度（数值）", type: "number", validation: rule => rule.min(0)}),
            defineField({name: "length", title: "长度（数值）", type: "number", validation: rule => rule.min(0)}),
            defineField({name: "height", title: "高度（数值）", type: "number", validation: rule => rule.min(0)}),
            defineField({name: "measurementUnit", title: "尺寸单位", type: "string", options: {list: [
              {title: "in", value: "in"}, {title: "ft", value: "ft"}, {title: "mm", value: "mm"}, {title: "cm", value: "cm"},
            ]}}),
            defineField({name: "frameMaterial", title: "框架材料", type: "string"}),
            defineField({name: "legProfile", title: "腿管形状 / 型材", type: "string"}),
            defineField({name: "tubeDimensions", title: "管材尺寸 / 壁厚", type: "string", description: "按已核实的工厂资料填写，例如外径与壁厚。"}),
            defineField({name: "netWeight", title: "产品净重（数值）", type: "number", validation: rule => rule.min(0)}),
            defineField({name: "shippingWeight", title: "包装毛重（数值）", type: "number", validation: rule => rule.min(0)}),
            defineField({name: "weightUnit", title: "重量单位", type: "string", options: {list: [{title: "kg", value: "kg"}, {title: "lb", value: "lb"}]}}),
            defineField({name: "packageDimensions", title: "包装尺寸", type: "string", description: "使用一致的长度单位，例如 L × W × H。"}),
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
            defineField({
              name: "includedItems",
              title: "此变体包含物品",
              type: "array",
              of: [defineArrayMember({type: "string"})],
              options: {layout: "tags"},
            }),
            defineField({
              name: "images",
              title: "此变体图片",
              type: "array",
              of: [defineArrayMember({type: "object", name: "variantImage", fields: [
                defineField({name: "image", title: "图片", type: "image", options: {hotspot: true}, validation: rule => rule.required()}),
                defineField({name: "alt", title: "替代文字", type: "string"}),
              ]})],
            }),
            defineField({name: "specSheetTitle", title: "规格书名称", type: "string"}),
            defineField({name: "specSheet", title: "此变体规格书", type: "file", options: {accept: ".pdf,.png,.jpg,.jpeg"}}),
            defineField({name: "availabilityStatus", title: "供应状态", type: "string", options: {list: [
              {title: "可供货", value: "available"}, {title: "按单生产", value: "madeToOrder"}, {title: "仅询价确认", value: "inquiryOnly"}, {title: "已停产", value: "discontinued"},
            ]}}),
            defineField({name: "sortOrder", title: "显示顺序", type: "number"}),
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
      validation: rule => rule.custom((variants?: Array<{
        sku?: string
        isDefault?: boolean
        width?: number
        length?: number
        height?: number
        measurementUnit?: string
        netWeight?: number
        shippingWeight?: number
        weightUnit?: string
      }>) => {
        const entries = variants ?? []
        const skus = entries.map(variant => variant?.sku?.trim()).filter(Boolean) as string[]
        if (new Set(skus).size !== skus.length) return "同一产品中的 Variant SKU 必须唯一。"
        if (entries.filter((variant) => variant?.isDefault).length > 1) return "每个产品最多只能设置一个默认 Variant。"
        const dimensioned = entries.filter((variant) => [variant.width, variant.length, variant.height].some((value) => value != null))
        if (dimensioned.some((variant) => !variant.measurementUnit)) return "填写数值尺寸时必须选择尺寸单位。"
        if (new Set(dimensioned.map((variant) => variant.measurementUnit)).size > 1) return "同一产品的结构化尺寸请使用统一单位；显示单位可写在尺寸显示名中。"
        const weighted = entries.filter((variant) => variant.netWeight != null || variant.shippingWeight != null)
        if (weighted.some((variant) => !variant.weightUnit)) return "填写数值重量时必须选择重量单位。"
        if (new Set(weighted.map((variant) => variant.weightUnit)).size > 1) return "同一产品的结构化重量请使用统一单位。"
        return true
      }),
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
    defineField({
      name: "technicalDocuments",
      title: "技术文件与说明书",
      type: "array",
      group: "specs",
      description: "添加规格书、安装说明、产品目录、装配指南或技术图纸。Variant 专属规格书可填在对应变体中。",
      of: [defineArrayMember({type: "object", name: "productDocument", fields: [
        defineField({name: "title", title: "文件标题", type: "string", validation: rule => rule.required()}),
        defineField({name: "documentType", title: "文件类型", type: "string", options: {list: [
          {title: "Specification Sheet", value: "specificationSheet"},
          {title: "Setup Instructions", value: "setupInstructions"},
          {title: "Product Catalog", value: "productCatalog"},
          {title: "Assembly Guide", value: "assemblyGuide"},
          {title: "Technical Drawing", value: "technicalDrawing"},
          {title: "Other", value: "other"},
        ]}, validation: rule => rule.required()}),
        defineField({name: "file", title: "文件", type: "file", options: {accept: ".pdf,.png,.jpg,.jpeg,.dwg,.dxf"}, validation: rule => rule.required()}),
        defineField({name: "description", title: "说明", type: "text", rows: 2}),
        defineField({name: "variantSkus", title: "适用 Variant SKU（留空表示共用）", type: "array", of: [defineArrayMember({type: "string"})], options: {layout: "tags"}}),
      ], preview: {select: {title: "title", subtitle: "documentType"}}})],
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
    defineField({
      name: "seo",
      title: "SEO 设置（新）",
      type: "seo",
      group: "seo",
      description: "新页面优先填写此对象；旧 SEO 字段继续兼容，确认前台迁移后再停用。",
    }),
  ],

  validation: (rule) => rule.custom(async (value, context) => {
    const document = value as {
      _id?: string
      sku?: string
      variants?: Array<{sku?: string}>
    } | undefined
    const skus = [document?.sku, ...(document?.variants ?? []).map((variant) => variant?.sku)]
      .map((sku) => sku?.trim())
      .filter(Boolean) as string[]
    if (!skus.length) return true

    const duplicateInDocument = skus.find((sku, index) => skus.indexOf(sku) !== index)
    if (duplicateInDocument) return `SKU “${duplicateInDocument}” 在此产品中重复。`

    const publishedId = document?._id?.replace(/^drafts\./, '')
    const ignoreIds = publishedId ? [publishedId, `drafts.${publishedId}`] : []
    const conflict = await context.getClient({apiVersion: '2024-10-01'}).fetch<{
      _id: string
      title?: string
      sku?: string
      matchingVariantSkus?: string[]
    } | null>(
      '*[_type == "product" && !(_id in $ignoreIds) && (sku in $skus || count(variants[sku in $skus]) > 0)][0]{_id, title, sku, "matchingVariantSkus": variants[sku in $skus].sku}',
      {ignoreIds, skus},
    )
    if (!conflict) return true
    const conflictingSku = [conflict.sku, ...(conflict.matchingVariantSkus ?? [])]
      .find((sku) => sku && skus.includes(sku.trim()))
    return `SKU “${conflictingSku ?? skus[0]}” 已被另一产品（${conflict.title || conflict._id}）使用。`
  }),

  preview: {
    select: {
      title: "title",
      sku: "sku",
      internalModel: "internalModel",
      familyTitle: "productFamily.title",
      seriesTitle: "series.title",
      isActive: "isActive",
      media: "mainImage",
    },
    prepare: ({ title, sku, internalModel, familyTitle, seriesTitle, isActive, media }) => ({
      title: title || "未命名产品",
      subtitle: [
        sku,
        internalModel,
        familyTitle,
        seriesTitle,
        isActive === false ? "已隐藏" : null,
      ]
        .filter(Boolean)
        .join(" · "),
      media,
    }),
  },
});
