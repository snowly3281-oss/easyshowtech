import { defineType, defineField, defineArrayMember } from 'sanity'
import { HomeIcon } from '@sanity/icons'
import { mediaField } from 'sanity-plugin-media'

/**
 * Home page — a singleton (id "home", enforced in ../structure/index.ts and
 * hidden from the New-Document menu in ../sanity.config.ts). The home layout is
 * bespoke, so each section is a structured object/array rather than the generic
 * page builder. The catalog / use-cases / insights strips are NOT stored here —
 * they pull from live `series` / `solution` / `post` content via GROQ; only
 * their headings live on this document.
 */
export const home = defineType({
  name: 'home',
  title: 'Home page',
  type: 'document',
  icon: HomeIcon,
  groups: [
    { name: 'hero', title: 'Hero', default: true },
    { name: 'work', title: 'How we work' },
    { name: 'catalog', title: 'Catalog' },
    { name: 'useCases', title: 'Use cases' },
    { name: 'oem', title: 'OEM banner' },
    { name: 'factory', title: 'Factory' },
    { name: 'insights', title: 'Insights' },
    { name: 'cta', title: 'Final CTA' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      group: 'hero',
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
        defineField({ name: 'heading', title: 'Heading', type: 'string', validation: (rule) => rule.required() }),
        defineField({ name: 'subheading', title: 'Subheading', type: 'text', rows: 2 }),
        mediaField({
          name: 'image',
          title: 'Background image (poster / fallback)',
          type: 'image',
          mediaTags: ['scope-home', 'role-hero'],
          options: { hotspot: true },
          description:
            'Used as the video poster and as the fallback where the background video cannot autoplay (e.g. some iOS / Safari). Recommended even when a video is set.',
          fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
        }),
        mediaField({
          name: 'video',
          title: 'Background video (looping, muted)',
          type: 'file',
          mediaTags: ['scope-home', 'role-video'],
          options: { accept: 'video/webm,video/mp4' },
          description:
            'Autoplays muted and loops behind the hero. Keep it short and small (a few MB). WebM plays in Chrome / Firefox / Edge; the poster image above covers browsers that cannot autoplay it.',
        }),
        defineField({ name: 'ctaPrimary', title: 'Primary CTA', type: 'ctaLink' }),
        defineField({ name: 'ctaSecondary', title: 'Secondary CTA', type: 'ctaLink' }),
        defineField({
          name: 'stats',
          title: 'Stats',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'heroStat',
              fields: [
                defineField({ name: 'value', title: 'Value', type: 'string', validation: (rule) => rule.required() }),
                defineField({ name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required() }),
              ],
              preview: { select: { title: 'value', subtitle: 'label' } },
            }),
          ],
        }),
      ],
    }),

    defineField({
      name: 'howWeWork',
      title: 'How we work',
      type: 'object',
      group: 'work',
      fields: [
        defineField({ name: 'heading', title: 'Heading', type: 'string' }),
        defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 2 }),
        defineField({
          name: 'cards',
          title: 'Cards',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'workCard',
              fields: [
                defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
                defineField({ name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required() }),
                mediaField({
                  name: 'image',
                  title: 'Image',
                  type: 'image',
                  mediaTags: ['scope-home', 'role-content'],
                  options: { hotspot: true },
                  fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
                }),
                defineField({ name: 'body', title: 'Body', type: 'text', rows: 2 }),
                defineField({
                  name: 'terms',
                  title: 'Terms',
                  type: 'array',
                  of: [
                    defineArrayMember({
                      type: 'object',
                      name: 'workTerm',
                      fields: [
                        defineField({ name: 'label', title: 'Label', type: 'string' }),
                        defineField({ name: 'value', title: 'Value', type: 'string' }),
                      ],
                      preview: { select: { title: 'label', subtitle: 'value' } },
                    }),
                  ],
                }),
                defineField({ name: 'cta', title: 'CTA', type: 'ctaLink' }),
              ],
              preview: { select: { title: 'title', subtitle: 'eyebrow' } },
            }),
          ],
        }),
      ],
    }),

    defineField({
      name: 'catalog',
      title: 'Catalog section',
      type: 'object',
      group: 'catalog',
      description: 'Heading for the series carousel. The series themselves come from live content.',
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
        defineField({ name: 'heading', title: 'Heading', type: 'string' }),
        defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 2 }),
      ],
    }),

    defineField({
      name: 'useCases',
      title: 'Use cases section',
      type: 'object',
      group: 'useCases',
      description: 'Heading for the "Built for your setting" tabs. Tabs come from live solutions.',
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
        defineField({ name: 'heading', title: 'Heading', type: 'string' }),
      ],
    }),

    defineField({
      name: 'oemBanner',
      title: 'OEM banner',
      type: 'object',
      group: 'oem',
      fields: [
        defineField({ name: 'heading', title: 'Heading', type: 'string' }),
        defineField({ name: 'body', title: 'Body', type: 'text', rows: 2 }),
        defineField({ name: 'cta', title: 'CTA', type: 'ctaLink' }),
      ],
    }),

    defineField({
      name: 'factory',
      title: 'Factory section',
      type: 'object',
      group: 'factory',
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
        defineField({ name: 'heading', title: 'Heading', type: 'string' }),
        defineField({ name: 'body', title: 'Body', type: 'text', rows: 2 }),
        mediaField({
          name: 'image',
          title: 'Image',
          type: 'image',
          mediaTags: ['scope-home', 'role-factory'],
          options: { hotspot: true },
          fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
        }),
        defineField({
          name: 'steps',
          title: 'Process steps',
          description: 'Shown as a numbered strip (01, 02 …) under the heading.',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'factoryStep',
              fields: [defineField({ name: 'label', title: 'Label', type: 'string' })],
              preview: { select: { title: 'label' } },
            }),
          ],
        }),
        defineField({ name: 'cta', title: 'CTA', type: 'ctaLink' }),
      ],
    }),

    defineField({
      name: 'ipProtection',
      title: 'OEM / IP protection',
      type: 'object',
      group: 'oem',
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
        defineField({ name: 'heading', title: 'Heading', type: 'string' }),
        defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 2 }),
        defineField({
          name: 'items',
          title: 'Points',
          description: 'Shown as a numbered 3-up strip (01, 02 …). Mark one as featured to highlight it.',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'ipPoint',
              fields: [
                defineField({ name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required() }),
                defineField({ name: 'lead', title: 'Lead-in (bold)', type: 'string', description: 'Optional bold sentence before the body.' }),
                defineField({ name: 'body', title: 'Body', type: 'text', rows: 3 }),
                defineField({ name: 'featured', title: 'Featured (highlight)', type: 'boolean', initialValue: false }),
              ],
              preview: { select: { title: 'title', subtitle: 'body' } },
            }),
          ],
        }),
        defineField({ name: 'cta', title: 'CTA', type: 'ctaLink' }),
      ],
    }),

    defineField({
      name: 'insights',
      title: 'Insights section',
      type: 'object',
      group: 'insights',
      description: 'Heading for the "From our workshop" strip. Posts come from live content.',
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
        defineField({ name: 'heading', title: 'Heading', type: 'string' }),
      ],
    }),

    defineField({
      name: 'finalCta',
      title: 'Final CTA',
      type: 'object',
      group: 'cta',
      fields: [
        defineField({ name: 'heading', title: 'Heading', type: 'string' }),
        defineField({ name: 'body', title: 'Body', type: 'text', rows: 2 }),
        defineField({ name: 'cta', title: 'CTA', type: 'ctaLink' }),
      ],
    }),

    defineField({ name: 'seo', title: 'SEO', type: 'seo', group: 'seo' }),
  ],
  preview: { prepare: () => ({ title: 'Home page' }) },
})
