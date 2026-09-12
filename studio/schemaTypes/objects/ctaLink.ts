import { defineType, defineField } from 'sanity'

/**
 * A call-to-action link. Internal targets use a `reference` (principle 6 —
 * interlinks are references, never ID strings) so GROQ can resolve the slug
 * and Sanity validates the target. External links fall back to a URL.
 *
 * Front end resolves `internal` first; if absent, uses `external`.
 */
export const ctaLink = defineType({
  name: 'ctaLink',
  title: '行动按钮 CTA',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: '按钮文字',
      type: 'string',
      description: '客户看到的按钮文字，例如 "Get a quote"、"View product"。',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'internal',
      title: '站内目标',
      type: 'reference',
      description:
        '优先选择本站页面、产品、Solution 或文章。设置后会覆盖下方外部网址。',
      to: [
        { type: 'solution' },
        { type: 'product' },
        { type: 'oem' },
        { type: 'post' },
        { type: 'sitePage' },
      ],
    }),
    defineField({
      name: 'external',
      title: '外部网址',
      type: 'url',
      description: '仅在没有选择站内目标时使用；完整网址需包含 https://。',
      validation: (rule) =>
        rule.uri({ scheme: ['http', 'https', 'mailto', 'tel'] }),
    }),
  ],
  validation: (rule) =>
    rule.custom((value?: { internal?: unknown; external?: unknown }) => {
      if (!value) return true
      if (!value.internal && !value.external) {
        return '请选择站内目标，或填写外部网址。'
      }
      return true
    }),
  preview: {
    select: { title: 'label', external: 'external' },
    prepare: ({ title, external }: { title?: string; external?: string }) => ({
      title: title || '未命名按钮',
      subtitle: external || '站内链接',
    }),
  },
})
