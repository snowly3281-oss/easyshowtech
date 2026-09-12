import { defineArrayMember, defineField, defineType } from 'sanity'
import { TagIcon } from '@sanity/icons'

/**
 * An alternative equipment-series schedule for one area tier.
 *
 * Operators keep the tier's area, lead time and pricing in the parent package,
 * then add only genuinely complete series schedules here. This prevents an
 * incomplete product series from being presented as a ready-to-buy studio.
 */
export const solutionPackageSeriesVariant = defineType({
  name: 'solutionPackageSeriesVariant',
  title: '按产品系列的替代配置',
  type: 'object',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'series',
      title: '产品系列',
      type: 'reference',
      to: [{ type: 'series' }],
      description:
        '选择一条可以完整满足该面积档位的产品系列。不要为了显示筛选项而添加设备不全的系列。',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'isRecommended',
      title: '设为首次展示系列',
      type: 'boolean',
      initialValue: false,
      description:
        '一个面积档位可以添加多个完整产品系列；这里只决定客户首次打开该档位时显示哪一条。每个档位只选择一条首次展示系列。',
    }),
    defineField({
      name: 'items',
      title: '该系列的产品与数量',
      type: 'array',
      description:
        '填写此系列在当前面积档位的真实示范数量。关联产品后，客户可查看产品详情并在询盘中收到同一份清单。',
      of: [defineArrayMember({ type: 'solutionPackageItem' })],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'internalNote',
      title: '内部备注',
      type: 'text',
      rows: 2,
      description: '仅供运营与销售团队查看，不会显示在前台。',
    }),
  ],
  validation: (rule) =>
    rule.custom((value) => {
      if (!value || typeof value !== 'object') return true
      const variant = value as { items?: { quantity?: number }[] }
      const total = (variant.items ?? []).reduce(
        (sum, item) => sum + Math.max(0, item?.quantity ?? 0),
        0,
      )
      return total > 0 ? true : '请至少填写一项产品与数量。'
    }),
  preview: {
    select: {
      title: 'series.title',
      recommended: 'isRecommended',
      items: 'items',
    },
    prepare: ({
      title,
      recommended,
      items,
    }: {
      title?: string
      recommended?: boolean
      items?: { quantity?: number }[]
    }) => ({
      title: title || '未选择产品系列',
      subtitle: [
        recommended ? '首次展示' : null,
        `${(items ?? []).reduce((sum, item) => sum + (item?.quantity ?? 0), 0)} 台/件`,
      ]
        .filter(Boolean)
        .join(' · '),
    }),
  },
})
