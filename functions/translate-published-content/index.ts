import {createClient} from '@sanity/client'
import {documentEventHandler} from '@sanity/functions'

declare const process: {
  env: Record<string, string | undefined>
}

type LanguageId = keyof typeof LANGUAGES

type TranslationEvent = {
  _id: string
  _type: string
  _rev: string
  language?: string
  sourceId?: string
  status?: string
  targetLanguages?: string[]
}

type SourceDocument = Record<string, unknown> & {
  _id: string
  _type: string
  _rev: string
  language?: string
  pageKey?: string
  title?: string
}

type TranslationSettings = {
  enabled?: boolean
  autoTranslateOnPublish?: boolean
  targetLanguages?: string[]
  provider?: string
  model?: string
  styleGuide?: string
  protectedPhrases?: string[]
}

type TranslationItem = {
  id: string
  path: Array<string | number>
  text: string
}

type DeepSeekResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  error?: {
    message?: string
  }
}

const API_VERSION = '2026-07-27'
const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/chat/completions'
const DEFAULT_MODEL = 'deepseek-v4-flash'
const LANGUAGES = {
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
} as const
const LEGAL_PAGE_KEYS = new Set([
  'privacy',
  'terms',
  'warranty',
  'returns',
  'shipping',
])
const DEFAULT_STYLE_GUIDE =
  'Translate for a professional B2B Pilates equipment website. Keep the meaning precise, concise and commercially neutral. Do not invent certifications, prices, warranty promises or technical specifications. Preserve SKU codes, model names, dimensions, units, URLs and brand names.'
const DEFAULT_PROTECTED_PHRASES = [
  'Coral Pilates',
  'Reformer',
  'Cadillac',
  'Ladder Barrel',
  'Spine Corrector',
  'Pedi Pole',
  'Pilates Chair',
  'OEM',
  'RFQ',
  'SKU',
]
const SKIPPED_FIELDS = new Set([
  '_id',
  '_key',
  '_ref',
  '_rev',
  '_type',
  '_createdAt',
  '_updatedAt',
  'language',
  'translationStatus',
  'translationSourceRevision',
  'translatedAt',
  'slug',
  'sku',
  'status',
  'pageKey',
  'route',
  'order',
  'publishedAt',
  'priceDisplay',
  'currency',
  'productionStatus',
  'editorialStatus',
  'style',
  'listItem',
  'tier',
  'external',
  'href',
  'url',
  'email',
  'phone',
  'asset',
  'hotspot',
  'crop',
  '_system',
  'importMeta',
  'internalNote',
  'evidence',
  'confirmedAt',
  'confirmedBy',
  'sourceType',
  'sourceLabel',
  'sheetName',
  'importedAt',
])
const URL_OR_EMAIL_PATTERN =
  /^(?:https?:\/\/|mailto:|tel:|\/|#)|^[^\s@]+@[^\s@]+\.[^\s@]+$/i
const ONLY_NUMBERS_AND_UNITS_PATTERN =
  /^[\s\d.,:%+×x/–—-]+(?:mm|cm|m|m²|kg|lb|lbs|ft|sq ft)?$/i
const MAX_CHUNK_CHARACTERS = 11_000
// Large documents occasionally caused providers to omit the final key in a
// 70-item JSON response. Smaller batches trade a few requests for complete,
// retryable translations and keep long Portable Text articles reliable.
const MAX_CHUNK_ITEMS = 40

function publicTranslationId(sourceId: string, language: string) {
  const rootId = sourceId.replace(/^drafts\./, '').replaceAll('.', '-')
  return `${rootId}-${language}`
}

function isLegalDocument(source: SourceDocument) {
  return source._type === 'sitePage' && LEGAL_PAGE_KEYS.has(source.pageKey ?? '')
}

function shouldTranslateString(
  value: string,
  path: Array<string | number>,
) {
  const text = value.trim()
  if (!text || text.length === 1) return false
  if (URL_OR_EMAIL_PATTERN.test(text)) return false
  if (ONLY_NUMBERS_AND_UNITS_PATTERN.test(text)) return false
  return !path.some(
    (segment) =>
      typeof segment === 'string' && SKIPPED_FIELDS.has(segment),
  )
}

function collectTranslationItems(
  value: unknown,
  path: Array<string | number> = [],
  items: TranslationItem[] = [],
) {
  if (typeof value === 'string') {
    if (shouldTranslateString(value, path)) {
      items.push({
        id: `s${items.length + 1}`,
        path,
        text: value,
      })
    }
    return items
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectTranslationItems(item, [...path, index], items),
    )
    return items
  }

  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => {
      if (!SKIPPED_FIELDS.has(key)) {
        collectTranslationItems(item, [...path, key], items)
      }
    })
  }

  return items
}

function createChunks(items: TranslationItem[]) {
  const chunks: TranslationItem[][] = []
  let current: TranslationItem[] = []
  let currentCharacters = 0

  for (const item of items) {
    const itemCharacters = item.text.length
    if (
      current.length > 0 &&
      (current.length >= MAX_CHUNK_ITEMS ||
        currentCharacters + itemCharacters > MAX_CHUNK_CHARACTERS)
    ) {
      chunks.push(current)
      current = []
      currentCharacters = 0
    }
    current.push(item)
    currentCharacters += itemCharacters
  }

  if (current.length > 0) chunks.push(current)
  return chunks
}

function setAtPath(
  root: Record<string, unknown>,
  path: Array<string | number>,
  value: string,
) {
  let target: unknown = root
  for (let index = 0; index < path.length - 1; index += 1) {
    if (!target || typeof target !== 'object') {
      throw new Error(`Invalid translation path: ${path.join('.')}`)
    }
    target = (target as Record<string | number, unknown>)[path[index]]
  }
  if (!target || typeof target !== 'object') {
    throw new Error(`Invalid translation target: ${path.join('.')}`)
  }
  ;(target as Record<string | number, unknown>)[path.at(-1)!] = value
}

function cleanJsonResponse(content: string) {
  return content
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
}

async function translateChunk({
  apiKey,
  model,
  language,
  items,
  styleGuide,
  protectedPhrases,
}: {
  apiKey: string
  model: string
  language: LanguageId
  items: TranslationItem[]
  styleGuide: string
  protectedPhrases: string[]
}): Promise<Record<string, string>> {
  const expectedIds = new Set(items.map(({id}) => id))
  let lastError: unknown

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(DEEPSEEK_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          thinking: {type: 'disabled'},
          response_format: {type: 'json_object'},
          temperature: 0,
          max_tokens: 8192,
          messages: [
            {
              role: 'system',
              content: [
                `You translate English website copy into ${LANGUAGES[language]}.`,
                styleGuide,
                `Never translate or alter these protected phrases: ${protectedPhrases.join(', ')}.`,
                'Preserve HTML, placeholders, punctuation, line breaks, dimensions, measurement units, SKU/model codes and all factual values.',
                'Translate ordinary count and duration words such as unit(s), set(s), week(s), day(s) and year(s), while keeping their numbers unchanged.',
                'Do not add explanations or new claims.',
                'Return valid JSON only, in this exact shape: {"translations":{"s1":"translated text"}}.',
              ].join('\n'),
            },
            {
              role: 'user',
              content: [
                `Translate every item into ${LANGUAGES[language]}.`,
                'The response must be a JSON object and must contain every input id exactly once.',
                JSON.stringify({
                  items: items.map(({id, text}) => ({id, text})),
                }),
              ].join('\n'),
            },
          ],
        }),
      })

      const payload = (await response.json()) as DeepSeekResponse
      if (!response.ok) {
        throw new Error(
          `DeepSeek ${response.status}: ${payload.error?.message || response.statusText}`,
        )
      }

      const content = payload.choices?.[0]?.message?.content
      if (!content) throw new Error('DeepSeek returned an empty response.')

      const parsed = JSON.parse(cleanJsonResponse(content)) as {
        translations?: Record<string, unknown>
      }
      const translations = parsed.translations
      if (!translations || typeof translations !== 'object') {
        throw new Error('DeepSeek response is missing translations.')
      }

      const missingIds = [...expectedIds].filter(
        (id) => typeof translations[id] !== 'string' || !translations[id],
      )
      if (missingIds.length > 0) {
        // Keep every valid segment already returned and retry only omissions.
        // Providers occasionally skip one key in an otherwise valid large
        // JSON object; shrinking that retry to the missing subset is much more
        // reliable than asking for the full chunk again.
        if (missingIds.length === items.length) {
          throw new Error(`DeepSeek response is missing ${missingIds[0]}.`)
        }
        const recovered: Record<string, string> = await translateChunk({
          apiKey,
          model,
          language,
          items: items.filter(({id}) => missingIds.includes(id)),
          styleGuide,
          protectedPhrases,
        })
        return {
          ...(translations as Record<string, string>),
          ...recovered,
        }
      }

      return translations as Record<string, string>
    } catch (error) {
      lastError = error
      if (attempt < 3) {
        await new Promise((resolve) =>
          setTimeout(resolve, 800 * 2 ** (attempt - 1)),
        )
      }
    }
  }

  throw lastError
}

async function translateDocument({
  source,
  language,
  apiKey,
  model,
  styleGuide,
  protectedPhrases,
}: {
  source: SourceDocument
  language: LanguageId
  apiKey: string
  model: string
  styleGuide: string
  protectedPhrases: string[]
}) {
  const translated = structuredClone(source)
  const items = collectTranslationItems(source)
  const chunks = createChunks(items)

  for (const chunk of chunks) {
    const translatedStrings = await translateChunk({
      apiKey,
      model,
      language,
      items: chunk,
      styleGuide,
      protectedPhrases,
    })
    for (const item of chunk) {
      setAtPath(translated, item.path, translatedStrings[item.id])
    }
  }

  delete (translated as Partial<SourceDocument>)._rev
  delete translated._createdAt
  delete translated._updatedAt
  delete translated._system

  return {translated, stringCount: items.length, chunkCount: chunks.length}
}

async function upsertTranslationMetadata({
  client,
  source,
  targets,
}: {
  client: ReturnType<typeof createClient>
  source: SourceDocument
  targets: Array<{language: LanguageId; targetId: string}>
}) {
  const metadataId = `translation.metadata.${source._id
    .replace(/^drafts\./, '')
    .replaceAll('.', '-')}`
  const existing = await client.getDocument(metadataId)
  const replacedLanguages = new Set([
    'en',
    ...targets.map(({language}) => language),
  ])
  const previousTranslations = Array.isArray(existing?.translations)
    ? existing.translations.filter(
        (translation: {language?: string}) =>
          !replacedLanguages.has(translation.language ?? ''),
      )
    : []
  const translations = [
    ...previousTranslations,
    {
      _key: crypto.randomUUID().replaceAll('-', '').slice(0, 12),
      _type: 'internationalizedArrayReferenceValue',
      language: 'en',
      // Translation metadata is an operational index, not an ownership
      // relationship. A weak reference must never prevent an editor from
      // unpublishing or deleting the English source document.
      value: {_type: 'reference', _ref: source._id, _weak: true},
    },
    ...targets.map(({language, targetId}) => ({
      _key: crypto.randomUUID().replaceAll('-', '').slice(0, 12),
      _type: 'internationalizedArrayReferenceValue',
      language,
      value: {
        _type: 'reference',
        _ref: targetId,
        _weak: true,
        _strengthenOnPublish: {type: source._type},
      },
    })),
  ]

  await client.createOrReplace({
    ...(existing ?? {}),
    _id: metadataId,
    _type: 'translation.metadata',
    schemaTypes: [source._type],
    translations,
  })
}

async function patchProviderStatus(
  client: ReturnType<typeof createClient>,
  status: 'connected' | 'error',
  model: string,
  error?: unknown,
) {
  await client
    .patch('translationSettings')
    .set({
      provider: 'deepseek',
      providerStatus: status,
      lastProviderCheckAt: new Date().toISOString(),
      lastProviderModel: model,
      ...(status === 'connected'
        ? {lastProviderError: ''}
        : {
            lastProviderError: String(
              error instanceof Error ? error.message : error,
            ).slice(0, 1000),
          }),
    })
    .commit()
}

export const handler = documentEventHandler<TranslationEvent>(
  async ({context, event}) => {
    const data = event.data
    const isJob = data._type === 'translationJob'
    const client = createClient({
      ...context.clientOptions,
      apiVersion: API_VERSION,
      useCdn: false,
      perspective: 'raw',
    })
    let model = DEFAULT_MODEL

    try {
      if (isJob && data.status !== 'pending') return
      if (isJob) {
        await client
          .patch(data._id)
          .set({status: 'running', startedAt: new Date().toISOString()})
          .unset(['error'])
          .commit()
      }

      const settings = await client.fetch<TranslationSettings | null>(
        '*[_id == "translationSettings"][0]{enabled, autoTranslateOnPublish, targetLanguages, provider, model, styleGuide, protectedPhrases}',
      )
      model = settings?.model || DEFAULT_MODEL

      if (!settings?.enabled || (!isJob && !settings.autoTranslateOnPublish)) {
        console.log(`Translation automation is disabled; skipped ${data._id}.`)
        if (isJob) {
          await client
            .patch(data._id)
            .set({
              status: 'skipped',
              completedAt: new Date().toISOString(),
              error: 'Translation automation is disabled.',
            })
            .commit()
        }
        return
      }

      const apiKey = process.env.DEEPSEEK_API_KEY
      if (!apiKey) {
        throw new Error(
          'DEEPSEEK_API_KEY is not configured for translate-published-content.',
        )
      }

      const sourceId = isJob ? data.sourceId : data._id
      if (!sourceId) throw new Error('Translation job has no sourceId.')
      const source = await client.getDocument<SourceDocument>(sourceId)
      if (!source) throw new Error(`Source document not found: ${sourceId}.`)
      if ((source.language ?? 'en') !== 'en') {
        throw new Error(`Source document is not English: ${sourceId}.`)
      }

      const requestedTargets = isJob
        ? data.targetLanguages
        : settings.targetLanguages
      const targets = (requestedTargets ?? [])
        .filter((language): language is LanguageId =>
          Object.hasOwn(LANGUAGES, language),
        )
        .filter((language, index, values) => values.indexOf(language) === index)
      if (targets.length === 0) {
        throw new Error(`No valid target languages configured for ${sourceId}.`)
      }

      const protectedPhrases = [
        ...(settings.protectedPhrases?.length
          ? settings.protectedPhrases
          : DEFAULT_PROTECTED_PHRASES),
        ...(source._type === 'product' && source.title ? [source.title] : []),
      ].filter((phrase, index, values) => values.indexOf(phrase) === index)
      const legalDocument = isLegalDocument(source)

      const results = await Promise.allSettled(
        targets.map(async (language) => {
          const targetId = publicTranslationId(source._id, language)
          const writeId = legalDocument ? `drafts.${targetId}` : targetId
          const currentStatus = await client.fetch<string | null>(
            'coalesce(*[_id == $draftId][0].translationStatus, *[_id == $targetId][0].translationStatus)',
            {draftId: `drafts.${targetId}`, targetId},
          )
          if (currentStatus === 'reviewing') {
            return {
              language,
              targetId,
              writeId,
              skipped: true,
              stringCount: 0,
              chunkCount: 0,
            }
          }

          const {translated, stringCount, chunkCount} = await translateDocument({
            source,
            language,
            apiKey,
            model,
            styleGuide: settings.styleGuide || DEFAULT_STYLE_GUIDE,
            protectedPhrases,
          })
          const translatedAt = new Date().toISOString()
          await client.createOrReplace({
            ...translated,
            _id: writeId,
            language,
            translationStatus: legalDocument ? 'needsReview' : 'approved',
            translationSourceRevision: source._rev,
            translatedAt,
          })

          return {
            language,
            targetId,
            writeId,
            skipped: false,
            stringCount,
            chunkCount,
          }
        }),
      )

      const successful = results.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : [],
      )
      const generated = successful.filter(({skipped}) => !skipped)
      const failed = results.flatMap((result, index) =>
        result.status === 'rejected'
          ? [
              {
                language: targets[index],
                reason: String(
                  result.reason instanceof Error
                    ? result.reason.message
                    : result.reason,
                ),
              },
            ]
          : [],
      )

      if (generated.length > 0) {
        await upsertTranslationMetadata({
          client,
          source,
          targets: generated.map(({language, targetId}) => ({
            language,
            targetId,
          })),
        })
      }

      if (failed.length > 0) {
        throw new Error(
          `Translation failed for ${failed
            .map(({language}) => language.toUpperCase())
            .join(', ')}: ${failed.map(({reason}) => reason).join(' | ')}`,
        )
      }

      await patchProviderStatus(client, 'connected', model)
      if (isJob) {
        await client
          .patch(data._id)
          .set({
            status: 'completed',
            completedAt: new Date().toISOString(),
            translatedLanguages: generated.map(({language}) => language),
          })
          .unset(['error'])
          .commit()
      }

      console.log(
        JSON.stringify({
          sourceId: source._id,
          translated: generated.map(
            ({language, stringCount, chunkCount}) => ({
              language,
              stringCount,
              chunkCount,
              publication: legalDocument ? 'draft' : 'published',
            }),
          ),
          skippedReview: successful
            .filter(({skipped}) => skipped)
            .map(({language}) => language),
          model,
          jobId: isJob ? data._id : null,
        }),
      )
    } catch (error) {
      console.error(error)
      try {
        await patchProviderStatus(client, 'error', model, error)
        if (isJob) {
          await client
            .patch(data._id)
            .set({
              status: 'failed',
              completedAt: new Date().toISOString(),
              error: String(
                error instanceof Error ? error.message : error,
              ).slice(0, 2000),
            })
            .commit()
        }
      } catch (statusError) {
        console.error('Failed to persist translation error state.', statusError)
      }
      throw error
    }
  },
)
