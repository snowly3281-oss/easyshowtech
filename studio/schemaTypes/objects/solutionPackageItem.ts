import { defineField, defineType } from 'sanity'
import { PackageIcon } from '@sanity/icons'

/**
 * A single line in a solution package.
 *
 * Prefer a Product reference so the package and product pages stay linked in
 * both directions. `customName` is a deliberate escape hatch for accessories
 * that have not been entered in the product catalogue yet.
 */
export const solutionPackageItem = defineType({
  name: 'solutionPackageItem',
  title: '配置单产品',
  type: 'object',
  icon: PackageIcon,
  fields: [
    defineField({
      name: 'product',
      title: '关联 Products 产品',
      type: 'reference',
      to: [{ type: 'product' }],
      description:
        '优先选择已有产品。关联后客户可点击查看详情，产品后台也会自动显示它被哪些 Solution 使用。',
    }),
    defineField({
      name: 'customName',
      title: '临时产品名称（仅在产品库不存在时）',
      type: 'string',
      description:
        '仅用于尚未录入 Products 的配件。产品建立后应删除临时名称并改为关联产品。',
    }),
    defineField({
      name: 'quantity',
      title: '数量',
      type: 'number',
      initialValue: 1,
      validation: (rule) => rule.required().integer().min(1).max(999),
    }),
    defineField({
      name: 'unit',
      title: '单位',
      type: 'string',
      initialValue: 'unit',
      description: '例如 unit、set、pair。',
    }),
    defineField({
      name: 'variantNote',
      title: '型号/材质备注',
      type: 'string',
      description:
        'Optional package-specific note, e.g. “Maple frame” or “includes Arc + Small Barrel”.',
    }),
    defineField({
      name: 'operatorNote',
      title: '内部备注',
      type: 'text',
      rows: 2,
      description: '仅供销售团队查看，不会显示在前台或发送给客户。',
    }),
  ],
  validation: (rule) =>
    rule.custom((value) => {
      if (!value || typeof value !== 'object') return true
      const item = value as { product?: unknown; customName?: string }
      return item.product || item.customName?.trim()
        ? true
        : '请选择一个 Products 产品，或填写临时产品名称。'
    }),
  preview: {
    select: {
      productTitle: 'product.title',
      customName: 'customName',
      quantity: 'quantity',
      unit: 'unit',
      variantNote: 'variantNote',
    },
    prepare: ({
      productTitle,
      customName,
      quantity,
      unit,
      variantNote,
    }: {
      productTitle?: string
      customName?: string
      quantity?: number
      unit?: string
      variantNote?: string
    }) => ({
      title: productTitle || customName || '未命名配置产品',
      subtitle: [
        `${quantity ?? 1} ${unit || 'unit'}`,
        variantNote,
      ]
        .filter(Boolean)
        .join(' · '),
    }),
  },
})
