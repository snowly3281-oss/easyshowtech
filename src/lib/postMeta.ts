/**
 * Derives the blog-card meta line — reading time + a single date label — from a
 * post's projected fields. Shared by the archive card (PostCard) and the home
 * insights strip so the two stay identical.
 *
 * `readingTime` is computed in GROQ from the body word count (see the post
 * queries); `_updatedAt` is Sanity's built-in last-mutation timestamp.
 */
export interface PostMetaInput {
  publishedAt?: string | null
  _updatedAt?: string | null
  readingTime?: number | null
}

export interface PostMeta {
  readMins: number
  dateLabel: string | null
}

const DATE_LOCALES: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
}

const UPDATED_LABELS: Record<string, string> = {
  en: 'Updated',
  es: 'Actualizado',
  fr: 'Mis à jour',
  de: 'Aktualisiert',
  it: 'Aggiornato',
}

const fmtDate = (iso: string, locale: string): string =>
  new Date(iso).toLocaleDateString(DATE_LOCALES[locale] ?? DATE_LOCALES.en, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

export function postMeta(post: PostMetaInput, locale = 'en'): PostMeta {
  const readMins = Math.max(1, post.readingTime ?? 1)
  const published = post.publishedAt ?? null
  const updated = post._updatedAt ?? null

  // Show "Updated …" only when the edit happened on a later calendar day than the
  // publish date — otherwise a freshly-published post reads as "Updated", which is
  // misleading. Fall back to the published date.
  const isUpdated =
    published != null &&
    updated != null &&
    new Date(updated).toDateString() !== new Date(published).toDateString() &&
    new Date(updated).getTime() > new Date(published).getTime()

  const dateLabel = isUpdated
    ? `${UPDATED_LABELS[locale] ?? UPDATED_LABELS.en} ${fmtDate(updated, locale)}`
    : published
      ? fmtDate(published, locale)
      : null

  return { readMins, dateLabel }
}
