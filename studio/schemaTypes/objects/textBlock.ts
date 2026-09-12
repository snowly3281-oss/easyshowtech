import { defineType, defineField, defineArrayMember } from 'sanity'
import { TextIcon } from '@sanity/icons'
import { AUDIENCE_OPTIONS } from '../lib/audience'

/**
 * Page-builder block: rich text (Portable Text).
 *
 * Type name is `textBlock` — NOT `text`, which is a reserved core Sanity type
 * (defining a type named `text` would collide with the built-in primitive).
 */
export const textBlock = defineType({
  name: 'textBlock',
  title: '图文正文',
  type: 'object',
  icon: TextIcon,
  fields: [
    defineField({
      name: 'heading',
      title: '模块标题',
      type: 'string',
    }),
    defineField({
      name: 'body',
      title: '正文',
      type: 'array',
      of: [defineArrayMember({ type: 'block' })],
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
      title: title || '未命名图文正文',
      subtitle: '图文正文模块',
    }),
  },
})
