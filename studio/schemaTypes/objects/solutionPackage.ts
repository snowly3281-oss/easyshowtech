import { defineArrayMember, defineField, defineType } from 'sanity'
import { BlockContentIcon } from '@sanity/icons'
import { mediaField } from 'sanity-plugin-media'

const tierOptions = [
  { title: '紧凑型 Compact', value: 'compact' },
  { title: '标准推荐 Recommended', value: 'recommended' },
  { title: '扩展型 Expanded', value: 'expanded' },
]

/**
 * A reusable package tier embedded in a Solution document.
 *
 * The exact BOM is intentionally delivered only after contact verification;
 * the public page uses the summary/range fields as its package preview.
 */
export const solutionPackage = defineType({
  name: 'solutionPackage',
  title: '面积档位配置单',
  type: 'object',
  icon: BlockContentIcon,
  groups: [
    { name: 'overview', title: '档位概览', default: true },
    { name: 'scope', title: '面积与容量' },
    { name: 'equipment', title: '产品与数量' },
    { name: 'series', title: '按产品系列切换' },
    { name: 'pricing', title: '价格' },
    { name: 'delivery', title: '交付、平面图与文件' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: '配置单名称',
      type: 'string',
      group: 'overview',
      description: '客户可见的名称，例如 “Small studio” 或 “Recommended”。',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tier',
      title: '面积档位',
      type: 'string',
      group: 'overview',
      options: { list: tierOptions, layout: 'radio' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'isRecommended',
      title: '标记为推荐方案',
      type: 'boolean',
      group: 'overview',
      initialValue: false,
      description: '同一个 Solution 只能有一个推荐方案。',
    }),
    defineField({
      name: 'summary',
      title: '配置摘要',
      type: 'text',
      rows: 3,
      group: 'overview',
      description:
        '公开显示。说明适用面积、客户类型和配置逻辑；不要在这里重复完整产品清单。',
    }),
    defineField({
      name: 'priceDisplay',
      title: '配置单价格模式',
      type: 'string',
      group: 'pricing',
      description:
        '选择精确总价、参考区间或仅询价。配置单价格可以不同于单品价格之和，并受全站价格总开关控制。',
      options: {
        list: [
          { title: '显示精确价格', value: 'show' },
          { title: '显示价格区间', value: 'range' },
          { title: '仅显示 Get a quote', value: 'quote' },
        ],
        layout: 'radio',
      },
      initialValue: 'quote',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'price',
      title: '配置单精确价格',
      type: 'number',
      group: 'pricing',
      description:
        'Indicative equipment subtotal for the package. Do not include freight, tax or installation unless the note says so.',
      hidden: ({ parent }) => parent?.priceDisplay !== 'show',
      validation: (rule) =>
        rule.min(0).custom((value, context) => {
          const parent = context.parent as { priceDisplay?: string } | undefined
          return parent?.priceDisplay !== 'show' || value != null
            ? true
            : '请输入配置单精确价格，或选择其他价格模式。'
        }),
    }),
    defineField({
      name: 'priceMin',
      title: '配置单最低参考价',
      type: 'number',
      group: 'pricing',
      description: 'Lowest expected equipment subtotal.',
      hidden: ({ parent }) => parent?.priceDisplay !== 'range',
      validation: (rule) =>
        rule.min(0).custom((value, context) => {
          const parent = context.parent as { priceDisplay?: string } | undefined
          return parent?.priceDisplay !== 'range' || value != null
            ? true
            : '请输入配置单最低参考价。'
        }),
    }),
    defineField({
      name: 'priceMax',
      title: '配置单最高参考价',
      type: 'number',
      group: 'pricing',
      description: 'Highest expected equipment subtotal.',
      hidden: ({ parent }) => parent?.priceDisplay !== 'range',
      validation: (rule) =>
        rule.min(0).custom((value, context) => {
          const parent = context.parent as
            | { priceDisplay?: string; priceMin?: number }
            | undefined
          if (parent?.priceDisplay !== 'range') return true
          if (value == null) return '请输入配置单最高参考价。'
          return parent.priceMin == null || value >= parent.priceMin
            ? true
            : '配置单最高参考价不能低于最低参考价。'
        }),
    }),
    defineField({
      name: 'currency',
      title: '价格币种',
      type: 'string',
      group: 'pricing',
      options: {
        list: [
          { title: 'USD', value: 'USD' },
          { title: 'EUR', value: 'EUR' },
          { title: 'GBP', value: 'GBP' },
          { title: 'CNY', value: 'CNY' },
        ],
      },
      initialValue: 'USD',
      hidden: ({ parent }) => !['show', 'range'].includes(parent?.priceDisplay),
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { priceDisplay?: string } | undefined
          return !['show', 'range'].includes(parent?.priceDisplay ?? '') || value
            ? true
            : '请选择价格币种。'
        }),
    }),
    defineField({
      name: 'priceUnit',
      title: '价格单位说明',
      type: 'string',
      group: 'pricing',
      initialValue: 'estimated package / EXW',
      description: 'Example: “estimated package / EXW”.',
      hidden: ({ parent }) => parent?.priceDisplay === 'quote',
    }),
    defineField({
      name: 'priceNote',
      title: '价格补充说明',
      type: 'string',
      group: 'pricing',
      initialValue: 'Freight, tax, installation and customisation quoted separately.',
      description: 'Customer-facing scope or exclusion note.',
      hidden: ({ parent }) => parent?.priceDisplay === 'quote',
    }),
    defineField({
      name: 'areaMinSqm',
      title: '最小适用面积（㎡）',
      type: 'number',
      group: 'scope',
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: 'areaMaxSqm',
      title: '最大适用面积（㎡）',
      type: 'number',
      group: 'scope',
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: 'areaMinSqFt',
      title: '最小适用面积（sq ft）',
      type: 'number',
      group: 'scope',
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: 'areaMaxSqFt',
      title: '最大适用面积（sq ft）',
      type: 'number',
      group: 'scope',
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: 'equipmentTotalMin',
      title: '最少设备总数',
      type: 'number',
      group: 'scope',
      validation: (rule) => rule.integer().min(1),
    }),
    defineField({
      name: 'equipmentTotalMax',
      title: '最多设备总数',
      type: 'number',
      group: 'scope',
      validation: (rule) => rule.integer().min(1),
    }),
    defineField({
      name: 'items',
      title: '配置产品与数量',
      type: 'array',
      group: 'equipment',
      description:
        '填写真实配置数量，并尽量关联 Products 中已有产品。拖动调整显示顺序；客户提交联系方式后可获得完整配置。',
      of: [defineArrayMember({ type: 'solutionPackageItem' })],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'showItemQuantities',
      title: '前台公开显示产品数量',
      type: 'boolean',
      group: 'equipment',
      initialValue: false,
      description:
        '只有甲方确认产品数量与设备总数范围一致后才开启。关闭时后台仍保留数量，并在客户提交联系方式后的配置中发送。',
    }),
    defineField({
      name: 'seriesVariants',
      title: '按产品系列的替代配置',
      type: 'array',
      group: 'series',
      description:
        '可选。一个档位可以添加 Maple、Oak、Professional 等多个完整产品系列，客户可在前台切换查看对应 BOM 与示意图。仅当该系列拥有足够产品、能够完整组成这一档方案时才添加；留空时只展示「产品与数量」中的基础配置。',
      of: [defineArrayMember({ type: 'solutionPackageSeriesVariant' })],
      validation: (rule) =>
        rule.unique().custom((variants?: { series?: { _ref?: string }; isRecommended?: boolean }[]) => {
          if (!variants?.length) return true
          const seriesIds = variants
            .map((variant) => variant?.series?._ref)
            .filter(Boolean)
          if (new Set(seriesIds).size !== seriesIds.length) {
            return '同一档位不能重复添加同一个产品系列。'
          }
          if (variants.filter((variant) => variant?.isRecommended).length > 1) {
            return '同一档位只能选择一条“首次展示系列”；仍可添加多个产品系列。'
          }
          return true
        }),
    }),
    defineField({
      name: 'leadTime',
      title: '预计交付周期',
      type: 'string',
      group: 'delivery',
      description: 'Example: “4–6 weeks”. Leave blank until confirmed.',
    }),
    mediaField({
      name: 'layoutImage',
      title: '示意平面图',
      type: 'image',
      mediaTags: ['scope-solution', 'role-layout'],
      group: 'delivery',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: '替代文字 Alt',
          type: 'string',
        }),
      ],
    }),
    mediaField({
      name: 'configurationPdf',
      title: '配置单 PDF',
      type: 'file',
      mediaTags: ['scope-solution', 'role-document'],
      group: 'delivery',
      description:
        '可选。客户提交有效联系方式后才能获取，不应作为公开下载文件。',
      options: { accept: 'application/pdf' },
    }),
    defineField({
      name: 'internalNote',
      title: '内部销售备注',
      type: 'text',
      rows: 3,
      group: 'delivery',
      description: '仅供运营和销售团队查看，不会显示给客户。',
    }),
  ],
  validation: (rule) => [
    rule.custom((value) => {
      if (!value || typeof value !== 'object') return true
      const pkg = value as {
        areaMinSqm?: number
        areaMaxSqm?: number
        areaMinSqFt?: number
        areaMaxSqFt?: number
        equipmentTotalMin?: number
        equipmentTotalMax?: number
      }
      if (
        pkg.areaMinSqm != null &&
        pkg.areaMaxSqm != null &&
        pkg.areaMinSqm > pkg.areaMaxSqm
      ) {
        return '最小面积不能大于最大面积。'
      }
      if (
        pkg.areaMinSqFt != null &&
        pkg.areaMaxSqFt != null &&
        pkg.areaMinSqFt > pkg.areaMaxSqFt
      ) {
        return '最小面积（sq ft）不能大于最大面积。'
      }
      if (
        pkg.equipmentTotalMin != null &&
        pkg.equipmentTotalMax != null &&
        pkg.equipmentTotalMin > pkg.equipmentTotalMax
      ) {
        return '最少设备总数不能大于最多设备总数。'
      }
      return true
    }),
    rule
      .custom((value) => {
        if (!value || typeof value !== 'object') return true
        const pkg = value as {
          equipmentTotalMin?: number
          equipmentTotalMax?: number
          items?: { quantity?: number }[]
        }
        const total = (pkg.items ?? []).reduce(
          (sum, item) => sum + Math.max(0, item?.quantity ?? 0),
          0,
        )
        if (!total) return true
        if (
          (pkg.equipmentTotalMin != null &&
            total < pkg.equipmentTotalMin) ||
          (pkg.equipmentTotalMax != null && total > pkg.equipmentTotalMax)
        ) {
          return `产品数量合计为 ${total}，不在填写的 ${pkg.equipmentTotalMin ?? '—'}–${pkg.equipmentTotalMax ?? '—'} 范围内。请让甲方确认配件是否计入设备总数。`
        }
        return true
      })
      .warning(),
  ],
  preview: {
    select: {
      title: 'title',
      tier: 'tier',
      recommended: 'isRecommended',
      min: 'areaMinSqm',
      max: 'areaMaxSqm',
    },
    prepare: ({
      title,
      tier,
      recommended,
      min,
      max,
    }: {
      title?: string
      tier?: string
      recommended?: boolean
      min?: number
      max?: number
    }) => ({
      title: title || '未命名配置单',
      subtitle: [
        recommended ? '推荐方案' : tier,
        min != null || max != null
          ? `${min ?? '—'}–${max ?? '—'} ㎡`
          : null,
      ]
        .filter(Boolean)
        .join(' · '),
    }),
  },
})
