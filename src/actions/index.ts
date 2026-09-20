import { defineAction, ActionError } from 'astro:actions'
import { z } from 'astro/zod'
import {
  RESEND_API_KEY,
  TURNSTILE_SECRET_KEY,
  QUOTE_FROM_EMAIL,
  QUOTE_TO_EMAIL,
} from 'astro:env/server'
import {
  MAX_RFQ_ITEMS,
  buildCustomerEmail,
  buildSalesEmail,
  createConfigurationAccess,
  deleteAttachment,
  getConfigurationSnapshot,
  getVisitorContext,
  normalizeText,
  saveInquiry,
  storeAttachment,
  updateInquiryStatus,
  validateAttachment,
  type ConfigurationSnapshot,
  type InquiryKind,
  type InquiryRecord,
  type RfqItem,
  type VisitorContext,
} from '../lib/server/inquiries'

// `resend` remains a lazy import. Keeping it out of the Workerd SSR warm-up
// graph avoids the Vite dependency-optimizer churn fixed in Astro 7.

const DEVELOPMENT_TURNSTILE_SECRET =
  '1x0000000000000000000000000000000AA'
const TURNSTILE_ACTION = 'turnstile-spin-v1'

const contactFields = {
  name: z.string().max(120).optional(),
  email: z.email({ message: 'Please enter a valid email.' }),
  phone: z.string().max(80).optional(),
  company: z.string().max(160).optional(),
  message: z
    .string()
    .trim()
    .min(1, { message: 'Please tell us what you need.' })
    .max(5000),
  source_url: z.string().max(1000).optional(),
  'cf-turnstile-response': z.string().optional(),
  botcheck: z.string().optional(),
}

const rfqItemSchema = z.object({
  productId: z.string().max(160).nullable(),
  slug: z.string().max(160).nullable(),
  title: z.string().trim().min(1).max(240),
  sku: z.string().max(160).nullable(),
  quantity: z.number().int().min(1).max(999),
  options: z.record(z.string().max(80), z.string().max(240)),
  sourceSolutionSlug: z.string().max(160).nullable(),
  sourcePackageKey: z.string().max(160).nullable(),
})

/** Server-side Cloudflare Turnstile verification. */
async function verifyTurnstile(
  token: string,
  secret: string,
  ip?: string,
): Promise<boolean> {
  const body = new FormData()
  body.append('secret', secret)
  body.append('response', token)
  if (ip) body.append('remoteip', ip)
  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      { method: 'POST', body },
    )
    const data = (await response.json()) as {
      success?: boolean
      action?: string
    }
    return data.success === true && data.action === TURNSTILE_ACTION
  } catch (error) {
    console.error(
      JSON.stringify({
        message: 'turnstile verification failed',
        error: error instanceof Error ? error.message : String(error),
      }),
    )
    return false
  }
}

async function requireHuman(
  input: {
    'cf-turnstile-response'?: string
    botcheck?: string
  },
  visitor: VisitorContext,
): Promise<'human' | 'bot'> {
  if (input.botcheck) return 'bot'
  const secret = import.meta.env.DEV
    ? DEVELOPMENT_TURNSTILE_SECRET
    : TURNSTILE_SECRET_KEY
  if (!secret) {
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Verification is temporarily unavailable. Please try again shortly.',
    })
  }

  const token = input['cf-turnstile-response']
  if (!token) {
    throw new ActionError({
      code: 'BAD_REQUEST',
      message: 'Please complete the verification.',
    })
  }
  if (!(await verifyTurnstile(token, secret, visitor.ip ?? undefined))) {
    throw new ActionError({
      code: 'FORBIDDEN',
      message: 'Verification failed. Please try again.',
    })
  }
  return 'human'
}

function requireEmailService(): {
  apiKey: string
  from: string
  to: string
} {
  if (!RESEND_API_KEY || !QUOTE_TO_EMAIL) {
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Online sending isn’t enabled yet — please email us directly.',
    })
  }
  return {
    apiKey: RESEND_API_KEY,
    from: QUOTE_FROM_EMAIL || 'Easy Show Tech <onboarding@resend.dev>',
    to: QUOTE_TO_EMAIL,
  }
}

function parseQuantity(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '1', 10)
  return Number.isFinite(parsed) ? Math.max(1, Math.min(999, parsed)) : 1
}

function parseRfqItems(raw: string): RfqItem[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new ActionError({
      code: 'BAD_REQUEST',
      message: 'The RFQ cart data is invalid. Please refresh and try again.',
    })
  }
  const result = z.array(rfqItemSchema).max(MAX_RFQ_ITEMS).safeParse(parsed)
  if (!result.success || !result.data.length) {
    throw new ActionError({
      code: 'BAD_REQUEST',
      message: 'Add at least one valid product to the RFQ cart.',
    })
  }
  return result.data
}

function makeProductItem(input: {
  product?: string
  sku?: string
  quantity?: string
  frame_finish?: string
  upholstery?: string
}): RfqItem[] {
  const title = normalizeText(input.product)
  if (!title) return []
  const options: Record<string, string> = {}
  const frame = normalizeText(input.frame_finish)
  const upholstery = normalizeText(input.upholstery)
  if (frame) options['Frame finish'] = frame
  if (upholstery) options.Upholstery = upholstery
  return [
    {
      productId: null,
      slug: null,
      title,
      sku: normalizeText(input.sku),
      quantity: parseQuantity(input.quantity),
      options,
      sourceSolutionSlug: null,
      sourcePackageKey: null,
    },
  ]
}

function inquiryMessage(
  inquiryType: string | undefined,
  message: string | undefined,
): string | undefined {
  const type = normalizeText(inquiryType)
  const body = normalizeText(message)
  const parts = [type ? `Inquiry type: ${type}` : null, body].filter(
    (part): part is string => Boolean(part),
  )
  return parts.length ? parts.join('\n\n') : undefined
}

function subjectFor(kind: InquiryKind, record: InquiryRecord): string {
  switch (kind) {
    case 'configuration':
      return `Configuration request — ${record.packageTitle ?? record.solutionTitle ?? 'Solution'}`
    case 'floorplan':
      return `Floor-plan configuration request${record.solutionTitle ? ` — ${record.solutionTitle}` : ''}`
    case 'rfq':
      return `RFQ cart — ${record.cartItems.length} product${record.cartItems.length === 1 ? '' : 's'}`
    default:
      return `Quote request${record.cartItems[0]?.title ? ` — ${record.cartItems[0].title}` : ''}`
  }
}

interface DeliverInquiryInput {
  kind: InquiryKind
  name?: string
  email: string
  phone?: string
  company?: string
  message?: string
  sourceUrl?: string
  cartItems?: RfqItem[]
  configuration?: ConfigurationSnapshot | null
  accessTokenHash?: string | null
  accessExpiresAt?: string | null
  accessToken?: string | null
  attachmentFile?: File | null
  visitor: VisitorContext
  siteOrigin: string
  requestedSubject?: string
}

async function deliverInquiry(
  input: DeliverInquiryInput,
): Promise<{ inquiryId: string }> {
  const emailService = requireEmailService()
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  let attachment = null

  try {
    attachment = await storeAttachment(
      id,
      input.attachmentFile,
      createdAt,
    )
  } catch (error) {
    throw new ActionError({
      code: 'BAD_REQUEST',
      message:
        error instanceof Error
          ? error.message
          : 'The attachment could not be uploaded.',
    })
  }

  const configuration = input.configuration ?? null
  const record: InquiryRecord = {
    id,
    kind: input.kind,
    channel: 'email',
    status: 'received',
    name: normalizeText(input.name),
    email: normalizeText(input.email),
    phone: normalizeText(input.phone),
    company: normalizeText(input.company),
    message: normalizeText(input.message),
    sourceUrl: normalizeText(input.sourceUrl),
    visitorIp: input.visitor.ip,
    visitorCountry: input.visitor.country,
    visitorCity: input.visitor.city,
    solutionId: configuration?.solutionId ?? null,
    solutionSlug: configuration?.solutionSlug ?? null,
    solutionTitle: configuration?.solutionTitle ?? null,
    packageKey: configuration?.packageKey ?? null,
    packageTitle: configuration?.packageTitle ?? null,
    packageSnapshot: configuration,
    cartItems: input.cartItems ?? [],
    accessTokenHash: input.accessTokenHash ?? null,
    accessExpiresAt: input.accessExpiresAt ?? null,
    attachment,
    createdAt,
  }

  try {
    await saveInquiry(record)
  } catch (error) {
    await deleteAttachment(attachment)
    console.error(
      JSON.stringify({
        message: 'inquiry persistence failed',
        inquiryId: id,
        error: error instanceof Error ? error.message : String(error),
      }),
    )
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Could not save your request right now. Please try again.',
    })
  }

  const configurationUrl =
    input.accessToken && configuration
      ? new URL(
          `/configurations/${id}?token=${encodeURIComponent(input.accessToken)}`,
          input.siteOrigin,
        ).toString()
      : null

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(emailService.apiKey)
    const requested = normalizeText(input.requestedSubject)
    const salesSubject =
      requested && requested.length <= 180
        ? requested.replace(/[\r\n]+/g, ' ')
        : subjectFor(input.kind, record)

    const salesResult = await resend.emails.send(
      {
        from: emailService.from,
        to: emailService.to,
        replyTo: input.email,
        subject: salesSubject,
        text: buildSalesEmail(record),
        attachments: attachment
          ? [
              {
                filename: attachment.name,
                content: attachment.content,
                contentType: attachment.type,
              },
            ]
          : undefined,
      },
      { idempotencyKey: `coral-${id}-sales` },
    )
    if (salesResult.error) throw new Error(salesResult.error.message)

    const customerResult = await resend.emails.send(
      {
        from: emailService.from,
        to: input.email,
        replyTo: emailService.to,
        subject:
          input.kind === 'configuration'
            ? `Your Easy Show Tech configuration — ${configuration?.packageTitle ?? 'requested package'}`
            : `We received your Easy Show Tech ${input.kind === 'rfq' ? 'RFQ' : 'request'}`,
        text: buildCustomerEmail(record, configurationUrl),
      },
      { idempotencyKey: `coral-${id}-customer` },
    )
    if (customerResult.error) throw new Error(customerResult.error.message)

    await updateInquiryStatus(id, 'email_sent')
  } catch (error) {
    await updateInquiryStatus(id, 'email_failed')
    console.error(
      JSON.stringify({
        message: 'inquiry email failed',
        inquiryId: id,
        error: error instanceof Error ? error.message : String(error),
      }),
    )
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message:
        'Your request was saved, but the email could not be sent. Please contact us directly so we can retrieve it.',
    })
  }

  return { inquiryId: id }
}

export const server = {
  /**
   * Single-product quote and the full /contact form. A floor-plan request uses
   * the same endpoint but is persisted as its own inquiry kind.
   */
  submitQuote: defineAction({
    accept: 'form',
    input: z.object({
      ...contactFields,
      quantity: z.string().max(10).optional(),
      product: z.string().max(240).optional(),
      sku: z.string().max(160).optional(),
      frame_finish: z.string().max(240).optional(),
      upholstery: z.string().max(240).optional(),
      subject: z.string().max(180).optional(),
      inquiry_type: z.string().max(120).optional(),
      inquiry_kind: z.enum(['quote', 'floorplan']).optional(),
      file: z.file().optional(),
    }),
    handler: async (input, context) => {
      const visitor = getVisitorContext(context.request)
      if ((await requireHuman(input, visitor)) === 'bot') {
        return { ok: true, inquiryId: null }
      }

      const kind: InquiryKind =
        input.inquiry_kind === 'floorplan' ? 'floorplan' : 'quote'
      const attachment =
        input.file?.name && input.file.size > 0 ? input.file : null
      const attachmentError = attachment
        ? validateAttachment(attachment)
        : null
      if (attachmentError) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: attachmentError,
        })
      }
      const delivered = await deliverInquiry({
        kind,
        name: input.name,
        email: input.email,
        phone: input.phone,
        company: input.company,
        message: inquiryMessage(input.inquiry_type, input.message),
        sourceUrl: input.source_url,
        cartItems: makeProductItem(input),
        attachmentFile: attachment,
        visitor,
        siteOrigin: (context.site ?? new URL(context.request.url).origin).toString(),
        requestedSubject: input.subject,
      })
      return { ok: true, ...delivered }
    },
  }),

  /** Multi-product RFQ cart submission by email. */
  submitRfq: defineAction({
    accept: 'form',
    input: z.object({
      ...contactFields,
      items_json: z.string().max(60_000),
    }),
    handler: async (input, context) => {
      const visitor = getVisitorContext(context.request)
      if ((await requireHuman(input, visitor)) === 'bot') {
        return { ok: true, inquiryId: null }
      }
      const delivered = await deliverInquiry({
        kind: 'rfq',
        name: input.name,
        email: input.email,
        phone: input.phone,
        company: input.company,
        message: input.message,
        sourceUrl: input.source_url,
        cartItems: parseRfqItems(input.items_json),
        visitor,
        siteOrigin: (context.site ?? new URL(context.request.url).origin).toString(),
      })
      return { ok: true, ...delivered }
    },
  }),

  /**
   * Verifies the contact by email before revealing the exact package BOM.
   * The browser submits only stable Sanity IDs; the trusted package snapshot is
   * fetched server-side and stored with a time-limited access token.
   */
  requestConfiguration: defineAction({
    accept: 'form',
    input: z.object({
      ...contactFields,
      solution_id: z.string().min(1).max(160),
      package_key: z.string().min(1).max(160),
      series_key: z.string().max(160).optional(),
    }),
    handler: async (input, context) => {
      const visitor = getVisitorContext(context.request)
      if ((await requireHuman(input, visitor)) === 'bot') {
        return { ok: true, inquiryId: null }
      }
      const configuration = await getConfigurationSnapshot(
        input.solution_id,
        input.package_key,
        input.series_key,
      )
      if (!configuration) {
        throw new ActionError({
          code: 'NOT_FOUND',
          message:
            'This configuration is no longer available. Please refresh the page or ask us for a custom plan.',
        })
      }
      const access = await createConfigurationAccess()
      const delivered = await deliverInquiry({
        kind: 'configuration',
        name: input.name,
        email: input.email,
        phone: input.phone,
        company: input.company,
        message: input.message,
        sourceUrl: input.source_url,
        configuration,
        accessTokenHash: access.hash,
        accessExpiresAt: access.expiresAt,
        accessToken: access.token,
        visitor,
        siteOrigin: (context.site ?? new URL(context.request.url).origin).toString(),
      })
      return { ok: true, ...delivered }
    },
  }),
}

