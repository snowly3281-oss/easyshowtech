import { defineType, defineField, defineArrayMember } from 'sanity'
import { RocketIcon } from '@sanity/icons'
import { AUDIENCE_OPTIONS } from '../lib/audience'

/**
 * Page-builder block: CTA conversion bar. Heading + body + one call to action.
 * `audience` (optional) scopes the block to specific buyer tiers.
 */
export const ctaBlock = defineType({
  name: 'ctaBlock',
  title: '询盘引导 CTA',
  type: 'object',
  icon: RocketIcon,
  fields: [
    defineField({
      name: 'heading',
      title: '标题',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      title: '说明',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'cta',
      title: '行动按钮',
      type: 'ctaLink',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'audience',
      title: '限定目标客户',
      type: 'array',
      description: '只向特定买家类型显示此模块；留空表示所有客户都可见。',
      of: [defineArrayMember({ type: 'string' })],
      options: { list: AUDIENCE_OPTIONS },
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }: { title?: string }) => ({
      title: title || '未命名询盘引导',
      subtitle: '询盘引导 CTA',
    }),
  },
})
