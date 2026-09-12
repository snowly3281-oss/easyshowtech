import {sanityClient} from "../sanity/client";

export const SUPPORTED_LOCALES = ["en", "es", "fr", "de", "it"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

const LOCALE_SET = new Set<string>(SUPPORTED_LOCALES);

export function isLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && LOCALE_SET.has(value));
}

export function localeFromPath(pathname: string): Locale {
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return isLocale(firstSegment) ? firstSegment : DEFAULT_LOCALE;
}

export function resolveLocale(
  explicitLocale: unknown,
  pathname: string,
): Locale {
  return typeof explicitLocale === "string" && isLocale(explicitLocale)
    ? explicitLocale
    : localeFromPath(pathname);
}

export function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (isLocale(segments[0])) segments.shift();
  return segments.length > 0 ? `/${segments.join("/")}` : "/";
}

export function localizedPath(pathname: string, locale: Locale): string {
  const contentPath = stripLocalePrefix(pathname);
  if (locale === DEFAULT_LOCALE) return contentPath;
  return contentPath === "/" ? `/${locale}` : `/${locale}${contentPath}`;
}

function isMissingLocalizedResult(value: unknown): boolean {
  if (value == null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value !== "object") return false;

  // Composite queries such as the catalog taxonomy return an object whose
  // individual lists may all be empty for a locale. Treat that as a missing
  // translation too, otherwise `{series: [], equipment: []}` prevents the
  // English fallback and leaves visible filter headings with no options.
  const entries = Object.values(value);
  return (
    entries.length === 0 ||
    entries.every(
      (entry) =>
        entry == null || (Array.isArray(entry) && entry.length === 0),
    )
  );
}

/**
 * Fetch one localized result. Legacy documents without a language field count
 * as English in the GROQ queries. A missing translation falls back to English,
 * so partially translated launches never expose an empty page.
 */
export async function fetchLocalized<T>(
  query: string,
  params: Record<string, unknown>,
  locale: Locale,
): Promise<T> {
  const localized = await sanityClient.fetch<T>(query, {
    ...params,
    language: locale,
  });

  if (locale === DEFAULT_LOCALE || !isMissingLocalizedResult(localized)) {
    return localized;
  }

  return sanityClient.fetch<T>(query, {
    ...params,
    language: DEFAULT_LOCALE,
  });
}

/**
 * Merge a translated list over the English list by a stable public key. This
 * keeps untranslated products/posts visible while individual translations are
 * still being reviewed.
 */
export async function fetchLocalizedList<T>(
  query: string,
  params: Record<string, unknown>,
  locale: Locale,
  keyOf: (item: T) => string | null | undefined,
): Promise<T[]> {
  const englishPromise = sanityClient.fetch<T[]>(query, {
    ...params,
    language: DEFAULT_LOCALE,
  });

  if (locale === DEFAULT_LOCALE) return englishPromise;

  const [localized, english] = await Promise.all([
    sanityClient.fetch<T[]>(query, {...params, language: locale}),
    englishPromise,
  ]);

  const merged = new Map<string, T>();
  for (const item of english ?? []) {
    const key = keyOf(item);
    if (key) merged.set(key, item);
  }
  for (const item of localized ?? []) {
    const key = keyOf(item);
    if (key) merged.set(key, item);
  }

  return [...merged.values()];
}
