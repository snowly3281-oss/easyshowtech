import { defineType, defineField, defineArrayMember } from 'sanity'
import { StarIcon } from '@sanity/icons'
import { mediaField } from 'sanity-plugin-media'
import { AUDIENCE_OPTIONS } from '../lib/audience'

/**
 * Page-builder block: Hero. Heading / subheading / background image / CTA.
 *
 * `audience` (optional) scopes the block to one or more buyer tiers; the front
 * end shows/hides it for the active audience (principle 4 — parameterise, do
 * not replicate whole pages). Empty = show for everyone.
 *
 * Type name is `heroBlock` (not `hero`) so block types stay namespaced and
 * read clearly in the page-builder array.
 */
export const heroBlock = defineType({
  name: 'heroBlock',
  title: '页面首屏 Hero',
  type: 'object',
  icon: StarIcon,
  fields: [
    defineField({
      name: 'eyebrow',
      title: '顶部小标签 Eyebrow',
      type: 'string',
      description: '主标题上方的小标签，前台通常显示为大写字母。',
    }),
    defineField({
      name: 'heading',
      title: '主标题',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subheading',
      title: '副标题/简介',
      type: 'text',
      rows: 2,
    }),
    mediaField({
      name: 'backgroundImage',
      title: '首屏主图',
      type: 'image',
      mediaTags: ['role-hero'],
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: '替代文字 Alt', type: 'string' })],
    }),
    defineField({
      name: 'cta',
      title: '行动按钮 CTA',
      type: 'ctaLink',
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
    select: { title: 'heading', subtitle: 'eyebrow', media: 'backgroundImage' },
    prepare: ({ title, subtitle, media }) => ({
      title: title || '未命名首屏',
      subtitle: subtitle ? `页面首屏 · ${subtitle}` : '页面首屏',
      media,
    }),
  },
})
