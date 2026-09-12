import { defineType, defineField } from 'sanity'
import { SearchIcon } from '@sanity/icons'
import { mediaField } from 'sanity-plugin-media'

/**
 * Reusable SEO/meta object. Lives on every page-like document
 * (solution / oem / post). Product structured-data (JSON-LD) is modelled
 * separately on `product` itself.
 *
 * All fields optional — the front end falls back to the document title /
 * summary when these are empty.
 */
export const seo = defineType({
  name: 'seo',
  title: '搜索引擎 SEO',
  type: 'object',
  icon: SearchIcon,
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'focusKeyword',
      title: '焦点关键词 Focus keyword',
      type: 'string',
      description:
        '填写一个真实的目标搜索词，用于实时 SEO 检查；例如 “pilates reformer for studio”。不要用多个逗号分隔的词堆。',
      validation: (rule) => rule.max(80).warning('焦点关键词建议不超过 80 个字符。'),
    }),
    defineField({
      name: 'metaTitle',
      title: '搜索结果标题 Meta title',
      type: 'string',
      description: '可选。留空时使用页面/产品/文章标题；建议约 50–60 个字符。',
      validation: (rule) => rule.max(70).warning('建议控制在 70 个字符以内。'),
    }),
    defineField({
      name: 'metaDescription',
      title: '搜索结果摘要 Meta description',
      type: 'text',
      rows: 2,
      description: '可选。留空时使用正文摘要；建议约 120–160 个字符。',
      validation: (rule) => rule.max(180).warning('建议控制在 180 个字符以内。'),
    }),
    mediaField({
      name: 'ogImage',
      title: '社交分享图片',
      type: 'image',
      mediaTags: ['role-social'],
      description: '用于 WhatsApp、LinkedIn 等平台分享，推荐 1200×630 px。留空时使用首图。',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: '替代文字 Alt', type: 'string' })],
    }),
  ],
})
