import { defineType, defineField, defineArrayMember } from 'sanity'
import { HelpCircleIcon } from '@sanity/icons'

/**
 * Page-builder block: FAQs — INLINE.
 *
 * Question/answer pairs are authored directly in this block; there is no shared
 * `faq` library. Each item is a self-contained { question, answer }.
 *
 * FRONT-END RENDER RULE (Astro): if `items` has fewer than 3 entries, do NOT
 * render this block at all. Editors also see a non-blocking warning below 3.
 */
export const faqsBlock = defineType({
  name: 'faqsBlock',
  title: '常见问题 FAQ',
  type: 'object',
  icon: HelpCircleIcon,
  fields: [
    defineField({
      name: 'heading',
      title: '模块标题',
      type: 'string',
      description: '例如 "Frequently asked"、"Common questions"。',
    }),
    defineField({
      name: 'items',
      title: '问题与答案',
      type: 'array',
      description:
        '每组填写一个问题和答案。少于 3 组时前台会隐藏整个 FAQ 模块。',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          fields: [
            defineField({
              name: 'question',
              title: '问题',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'answer',
              title: '答案',
              type: 'text',
              rows: 3,
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: 'question', subtitle: 'answer' } },
        }),
      ],
      validation: (rule) =>
        rule
          .custom((items?: unknown[]) =>
            !items || items.length === 0 || items.length >= 3
              ? true
              : '当前少于 3 个问题，前台会隐藏该 FAQ 模块。'
          )
          .warning(),
    }),
  ],
  preview: {
    select: { title: 'heading', items: 'items' },
    prepare: ({ title, items }: { title?: string; items?: unknown[] }) => {
      const count = Array.isArray(items) ? items.length : 0
      return {
        title: title || '常见问题 FAQ',
        subtitle: `${count} 个问题`,
      }
    },
  },
})
