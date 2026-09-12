/**
 * Shared price policy for products and solution packages.
 *
 * `show` remains the stored value for an exact price so existing Sanity
 * documents stay backwards compatible. New documents may also use `range` or
 * `quote`. Every public price still passes through the global
 * `siteSettings.showPrices` master switch.
 */
export interface PriceGateSettings {
  showPrices?: boolean | null
}

export interface PriceSource {
  priceDisplay?: string | null
  price?: number | null
  priceMin?: number | null
  priceMax?: number | null
  currency?: string | null
}

export type PricePresentation =
  | {
      kind: 'exact'
      currency: string
      amount: number
      min: number
      max: number
    }
  | {
      kind: 'range'
      currency: string
      min: number
      max: number
    }
  | {
      kind: 'from'
      currency: string
      min: number
      max: number
    }
  | {
      kind: 'upTo'
      currency: string
      min: number
      max: number
    }

const CURRENCY_SYMBOL: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CNY: '¥',
}

function isAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

export function pricesEnabled(
  settings: PriceGateSettings | null | undefined,
): boolean {
  return settings?.showPrices ?? true
}

export function getPricePresentation(
  settings: PriceGateSettings | null | undefined,
  source: PriceSource | null | undefined,
): PricePresentation | null {
  if (!pricesEnabled(settings) || !source || source.priceDisplay === 'quote') {
    return null
  }

  const currency = source.currency || 'USD'
  if (source.priceDisplay === 'range') {
    const minValue = source.priceMin
    const maxValue = source.priceMax
    const hasMin = isAmount(minValue)
    const hasMax = isAmount(maxValue)
    if (hasMin && hasMax) {
      const min = Math.min(minValue, maxValue)
      const max = Math.max(minValue, maxValue)
      if (min === max) {
        return { kind: 'exact', currency, amount: min, min, max }
      }
      return { kind: 'range', currency, min, max }
    }
    if (hasMin) {
      return {
        kind: 'from',
        currency,
        min: minValue,
        max: minValue,
      }
    }
    if (hasMax) {
      return {
        kind: 'upTo',
        currency,
        min: maxValue,
        max: maxValue,
      }
    }
    return null
  }

  if (!isAmount(source.price)) return null
  return {
    kind: 'exact',
    currency,
    amount: source.price,
    min: source.price,
    max: source.price,
  }
}

export function formatPriceAmount(
  amount: number,
  currency = 'USD',
  locale = 'en-US',
): string {
  const symbol = CURRENCY_SYMBOL[currency] ?? `${currency} `
  return `${symbol}${amount.toLocaleString(locale, {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatPrice(
  price: PricePresentation | null | undefined,
  locale = 'en-US',
): string | null {
  if (!price) return null
  if (price.kind === 'exact') {
    return formatPriceAmount(price.amount, price.currency, locale)
  }
  if (price.kind === 'from') {
    return `From ${formatPriceAmount(price.min, price.currency, locale)}`
  }
  if (price.kind === 'upTo') {
    return `Up to ${formatPriceAmount(price.max, price.currency, locale)}`
  }
  return `${formatPriceAmount(price.min, price.currency, locale)}–${formatPriceAmount(
    price.max,
    price.currency,
    locale,
  )}`
}

/** Compatibility helper for call sites that only need a yes/no gate. */
export function showPrice(
  settings: PriceGateSettings | null | undefined,
  source: PriceSource | null | undefined,
): boolean {
  return getPricePresentation(settings, source) != null
}
