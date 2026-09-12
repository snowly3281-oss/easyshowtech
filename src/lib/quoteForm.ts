/**
 * Shared client-side quote/inquiry submission.
 *
 * Submits to the type-safe Astro Action `submitQuote` (server-side: verifies
 * Cloudflare Turnstile, then forwards the lead via Resend). Both the PDP quote
 * modal and the /contact inquiry form use this single helper so they stay in
 * lockstep.
 *
 */
import { actions } from 'astro:actions'
import { actionErrorMessage } from './actionError'

export type QuoteResult =
  | { status: 'ok'; message: string; inquiryId: string | null }
  | { status: 'error'; message: string }

/**
 * Builds the localized success-page URL for an inquiry that was actually
 * persisted. Keep the URL itself stable so Cloudflare Analytics can count one
 * success-page path. The opaque random reference is kept only in this browser
 * tab for the confirmation page; it is never used to retrieve an inquiry.
 */
export function thankYouUrl(inquiryId: string | null | undefined): string | null {
  if (!inquiryId) return null
  try {
    window.sessionStorage.setItem('coral-last-inquiry-reference', inquiryId)
  } catch {
    // Storage can be unavailable in a privacy-restricted browser. The page
    // remains a valid conversion event without a displayed reference.
  }
  const localePrefix = window.location.pathname.match(
    /^\/(es|fr|de|it)(?=\/|$)/,
  )?.[0] ?? ''
  return `${localePrefix}/thank-you`
}

/** Never throws — Action + validation failures resolve to a typed result. */
export async function submitQuoteForm(form: HTMLFormElement): Promise<QuoteResult> {
  const data = new FormData(form)

  // Honeypot: real users never fill this. Pretend success, never send.
  if (data.get('botcheck')) return { status: 'ok', message: '', inquiryId: null }

  const { data: result, error } = await actions.submitQuote(data)

  if (result?.ok) {
    return { status: 'ok', message: '', inquiryId: result.inquiryId ?? null }
  }

  if (error) {
    return {
      status: 'error',
      message: actionErrorMessage(
        error,
        'Something went wrong. Please try again.',
        'Please check the form and try again.',
      ),
    }
  }

  return { status: 'error', message: 'Something went wrong. Please try again.' }
}
