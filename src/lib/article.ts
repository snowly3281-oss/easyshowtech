type PortableTextSpan = {
  text?: string | null
}

type PortableTextBlock = {
  _type?: string | null
  _key?: string | null
  style?: string | null
  children?: PortableTextSpan[] | null
}

export interface ArticleHeading {
  id: string
  key: string
  title: string
  number: string
}

function blockText(block: PortableTextBlock): string {
  return (block.children ?? [])
    .map((child) => child.text ?? '')
    .join('')
    .trim()
}

function headingSlug(input: string): string {
  return input
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Generates the same stable section IDs for both the page TOC and the
 * Portable Text renderer. Sanity's block key is used as a fallback so headings
 * written in any language remain linkable.
 */
export function buildArticleHeadings(value?: unknown[] | null): ArticleHeading[] {
  if (!Array.isArray(value)) return []

  const used = new Map<string, number>()

  return value
    .filter(
      (item): item is PortableTextBlock =>
        typeof item === 'object' &&
        item !== null &&
        (item as PortableTextBlock)._type === 'block' &&
        (item as PortableTextBlock).style === 'h2',
    )
    .map((block, index) => {
      const title = blockText(block) || `Section ${index + 1}`
      const base = headingSlug(title) || `section-${block._key || index + 1}`
      const occurrence = (used.get(base) ?? 0) + 1
      used.set(base, occurrence)

      return {
        id: occurrence === 1 ? base : `${base}-${occurrence}`,
        key: block._key || `section-${index + 1}`,
        title,
        number: String(index + 1).padStart(2, '0'),
      }
    })
}

/**
 * A conservative editorial reading-time estimate. It handles space-separated
 * languages and CJK copy so the metadata is still useful after translation.
 */
export function estimateReadingMinutes(value?: unknown[] | null): number {
  if (!Array.isArray(value)) return 1

  const text = value
    .filter(
      (item): item is PortableTextBlock =>
        typeof item === 'object' &&
        item !== null &&
        (item as PortableTextBlock)._type === 'block',
    )
    .map(blockText)
    .join(' ')
    .trim()

  if (!text) return 1

  const latinWords = text
    .replace(/[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
  const cjkCharacters =
    text.match(/[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/g)?.length ?? 0

  return Math.max(1, Math.ceil(latinWords / 220 + cjkCharacters / 500))
}
