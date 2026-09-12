import { Buffer } from 'node:buffer'
import { env } from 'cloudflare:workers'
import { sanityClient } from '../../sanity/client'
import { solutionPackageForRequestQuery } from '../../sanity/queries/solutions'
import type { SolutionPackageForRequestQueryResult } from '../../sanity/sanity.types'

export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024
export const MAX_RFQ_ITEMS = 50
export const CONFIGURATION_ACCESS_DAYS = 14

const allowedAttachmentExtensions = new Set([
  'pdf',
  'dwg',
  'dxf',
  'jpg',
  'jpeg',
  'png',
])

const allowedAttachmentTypes = new Set([
  'application/pdf',
  'application/acad',
  'application/autocad',
  'application/dwg',
  'application/dxf',
  'application/octet-stream',
  'application/x-acad',
  'application/x-autocad',
  'application/x-dwg',
  'application/x-dxf',
  'image/jpeg',
  'image/png',
  'image/vnd.dwg',
  'image/x-dwg',
])

export type InquiryKind = 'quote' | 'rfq' | 'configuration' | 'floorplan'
export type InquiryChannel = 'email' | 'whatsapp'
export type InquiryStatus =
  | 'received'
  | 'email_sent'
  | 'email_failed'
  | 'whatsapp_opened'

export interface RfqItem {
  productId: string | null
  slug: string | null
  title: string
  sku: string | null
  quantity: number
  options: Record<string, string>
  sourceSolutionSlug: string | null
  sourcePackageKey: string | null
}

export interface ConfigurationItem {
  productId: string | null
  slug: string | null
  title: string
  sku: string | null
  quantity: number
  unit: string
  variantNote: string | null
}

export interface ConfigurationSnapshot {
  solutionId: string
  solutionSlug: string
  solutionTitle: string
  packageKey: string
  packageTitle: string
  tier: string | null
  summary: string | null
  areaMinSqm: number | null
  areaMaxSqm: number | null
  areaMinSqFt: number | null
  areaMaxSqFt: number | null
  equipmentTotalMin: number | null
  equipmentTotalMax: number | null
  leadTime: string | null
  layoutImageUrl: string | null
  configurationPdfUrl: string | null
  items: ConfigurationItem[]
}

export interface StoredAttachment {
  key: string | null
  name: string
  type: string
  size: number
  content: Buffer
}

interface InquiryFilesBucket {
  put(
    key: string,
    value: ArrayBuffer,
    options?: {
      httpMetadata?: {
        contentType?: string
        contentDisposition?: string
      }
      customMetadata?: Record<string, string>
    },
  ): Promise<unknown>
  delete(key: string): Promise<unknown>
}

export interface VisitorContext {
  ip: string | null
  country: string | null
  city: string | null
}

export interface InquiryRecord {
  id: string
  kind: InquiryKind
  channel: InquiryChannel
  status: InquiryStatus
  name: string | null
  email: string | null
  phone: string | null
  company: string | null
  message: string | null
  sourceUrl: string | null
  visitorIp: string | null
  visitorCountry: string | null
  visitorCity: string | null
  solutionId: string | null
  solutionSlug: string | null
  solutionTitle: string | null
  packageKey: string | null
  packageTitle: string | null
  packageSnapshot: ConfigurationSnapshot | null
  cartItems: RfqItem[]
  accessTokenHash: string | null
  accessExpiresAt: string | null
  attachment: StoredAttachment | null
  createdAt: string
}

export function normalizeText(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function normalizeVisitorField(
  value: unknown,
  maxLength: number,
): string | null {
  if (typeof value !== 'string') return null
  const cleaned = value
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength)
  return cleaned || null
}

/**
 * Read visitor metadata from Cloudflare's trusted request context.
 *
 * `request.cf` is present in production Workers. Header fallbacks cover
 * Cloudflare's IP Geolocation Managed Transform and keep local tests simple.
 * Never accept these values from form fields.
 */
export function getVisitorContext(request: Request): VisitorContext {
  const cf = (
    request as Request & {
      cf?: {
        country?: unknown
        city?: unknown
      }
    }
  ).cf
  const country = normalizeVisitorField(
    cf?.country ?? request.headers.get('CF-IPCountry'),
    8,
  )

  return {
    ip: normalizeVisitorField(
      request.headers.get('CF-Connecting-IP'),
      64,
    ),
    country: country?.toUpperCase() ?? null,
    city: normalizeVisitorField(
      cf?.city ?? request.headers.get('CF-IPCity'),
      160,
    ),
  }
}

export function formatArea(snapshot: ConfigurationSnapshot): string | null {
  const metric =
    snapshot.areaMinSqm != null || snapshot.areaMaxSqm != null
      ? `${snapshot.areaMinSqm ?? '—'}–${snapshot.areaMaxSqm ?? '—'} ㎡`
      : null
  const imperial =
    snapshot.areaMinSqFt != null || snapshot.areaMaxSqFt != null
      ? `${snapshot.areaMinSqFt ?? '—'}–${snapshot.areaMaxSqFt ?? '—'} sq ft`
      : null
  return [metric, imperial].filter(Boolean).join(' / ') || null
}

export function formatEquipmentCount(
  snapshot: ConfigurationSnapshot,
): string | null {
  if (
    snapshot.equipmentTotalMin == null &&
    snapshot.equipmentTotalMax == null
  ) {
    return null
  }
  if (
    snapshot.equipmentTotalMin != null &&
    snapshot.equipmentTotalMin === snapshot.equipmentTotalMax
  ) {
    return `${snapshot.equipmentTotalMin}`
  }
  return `${snapshot.equipmentTotalMin ?? '—'}–${snapshot.equipmentTotalMax ?? '—'}`
}

export async function getConfigurationSnapshot(
  solutionId: string,
  packageKey: string,
  seriesKey?: string,
): Promise<ConfigurationSnapshot | null> {
  const result =
    await sanityClient.fetch<SolutionPackageForRequestQueryResult>(
      solutionPackageForRequestQuery,
      { solutionId, packageKey },
    )
  const pkg = result?.package
  if (!result || !pkg) return null

  // The browser can request only an existing embedded variant key. We resolve
  // that key against the trusted Sanity document here; it never supplies its
  // own BOM or quantities.
  const selectedVariant = seriesKey
    ? (pkg.seriesVariants ?? []).find((variant) => variant?._key === seriesKey)
    : null
  if (seriesKey && !selectedVariant) return null
  const selectedSeriesTitle = normalizeText(selectedVariant?.series?.title)
  const sourceItems = selectedVariant?.items ?? pkg.items

  const items = (sourceItems ?? [])
    .map((item): ConfigurationItem | null => {
      const title = normalizeText(item.product?.title ?? item.customName)
      if (!title) return null
      return {
        productId: normalizeText(item.product?._id),
        slug: normalizeText(item.product?.slug),
        title,
        sku: normalizeText(item.product?.sku),
        quantity: Math.max(1, Math.min(999, Math.trunc(item.quantity ?? 1))),
        unit: normalizeText(item.unit) ?? 'unit',
        variantNote: normalizeText(item.variantNote),
      }
    })
    .filter((item): item is ConfigurationItem => item !== null)

  if (!items.length) return null

  return {
    solutionId: result._id,
    solutionSlug: normalizeText(result.slug) ?? '',
    solutionTitle: normalizeText(result.title) ?? 'Solution',
    packageKey: pkg._key,
    packageTitle: [normalizeText(pkg.title) ?? 'Configuration package', selectedSeriesTitle]
      .filter(Boolean)
      .join(' — '),
    tier: normalizeText(pkg.tier),
    summary: normalizeText(pkg.summary),
    areaMinSqm: pkg.areaMinSqm,
    areaMaxSqm: pkg.areaMaxSqm,
    areaMinSqFt: pkg.areaMinSqFt,
    areaMaxSqFt: pkg.areaMaxSqFt,
    equipmentTotalMin: pkg.equipmentTotalMin,
    equipmentTotalMax: pkg.equipmentTotalMax,
    leadTime: normalizeText(pkg.leadTime),
    layoutImageUrl: normalizeText(pkg.layoutImageUrl),
    configurationPdfUrl: normalizeText(pkg.configurationPdfUrl),
    items,
  }
}

function safeAttachmentName(name: string): string {
  const basename = name.split(/[\\/]/).pop() || 'attachment'
  return (
    basename
      .normalize('NFKC')
      .replace(/[^\p{L}\p{N}._ -]+/gu, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 120) || 'attachment'
  )
}

export function validateAttachment(file: File): string | null {
  if (!file.name || file.size === 0) return null
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return 'The attachment must be 20 MB or smaller.'
  }
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!allowedAttachmentExtensions.has(extension)) {
    return 'Use a PDF, DWG, DXF, JPG, or PNG file.'
  }
  if (file.type && !allowedAttachmentTypes.has(file.type.toLowerCase())) {
    return 'This file type is not supported.'
  }
  return null
}

export async function storeAttachment(
  inquiryId: string,
  file: File | null | undefined,
  createdAt: string,
): Promise<StoredAttachment | null> {
  if (!file?.name || file.size === 0) return null
  const validationError = validateAttachment(file)
  if (validationError) throw new Error(validationError)

  const safeName = safeAttachmentName(file.name)
  const date = new Date(createdAt)
  const year = String(date.getUTCFullYear())
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const bytes = await file.arrayBuffer()
  const bucket = (
    env as typeof env & { INQUIRY_FILES?: InquiryFilesBucket }
  ).INQUIRY_FILES
  const key = bucket
    ? `inquiries/${year}/${month}/${inquiryId}/${crypto.randomUUID()}-${safeName}`
    : null

  if (bucket && key) {
    await bucket.put(key, bytes, {
      httpMetadata: {
        contentType: file.type || 'application/octet-stream',
        contentDisposition: `attachment; filename="${safeName.replace(/"/g, '')}"`,
      },
      customMetadata: {
        inquiryId,
        uploadedAt: createdAt,
      },
    })
  }

  return {
    key,
    name: safeName,
    type: file.type || 'application/octet-stream',
    size: file.size,
    content: Buffer.from(bytes),
  }
}

export async function deleteAttachment(
  attachment: StoredAttachment | null,
): Promise<void> {
  const bucket = (
    env as typeof env & { INQUIRY_FILES?: InquiryFilesBucket }
  ).INQUIRY_FILES
  if (bucket && attachment?.key) await bucket.delete(attachment.key)
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  )
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

export async function createConfigurationAccess(): Promise<{
  token: string
  hash: string
  expiresAt: string
}> {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const token = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
  const expiresAt = new Date(
    Date.now() + CONFIGURATION_ACCESS_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString()
  return { token, hash: await sha256Hex(token), expiresAt }
}

export async function saveInquiry(record: InquiryRecord): Promise<void> {
  const inquiryStatement = env.INQUIRIES_DB.prepare(`
    INSERT INTO inquiries (
      id, kind, channel, status, name, email, phone, company, message,
      source_url, visitor_ip, visitor_country, visitor_city, solution_id,
      solution_slug, solution_title, package_key, package_title,
      package_snapshot_json, cart_snapshot_json, access_token_hash,
      access_expires_at, attachment_key, attachment_name, attachment_type,
      attachment_size, created_at, updated_at
    ) VALUES (
      ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14,
      ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26,
      ?27, ?28
    )
  `).bind(
    record.id,
    record.kind,
    record.channel,
    record.status,
    record.name,
    record.email,
    record.phone,
    record.company,
    record.message,
    record.sourceUrl,
    record.visitorIp,
    record.visitorCountry,
    record.visitorCity,
    record.solutionId,
    record.solutionSlug,
    record.solutionTitle,
    record.packageKey,
    record.packageTitle,
    record.packageSnapshot ? JSON.stringify(record.packageSnapshot) : null,
    record.cartItems.length ? JSON.stringify(record.cartItems) : null,
    record.accessTokenHash,
    record.accessExpiresAt,
    record.attachment?.key ?? null,
    record.attachment?.name ?? null,
    record.attachment?.type ?? null,
    record.attachment?.size ?? null,
    record.createdAt,
    record.createdAt,
  )

  const itemStatement = env.INQUIRIES_DB.prepare(`
    INSERT INTO inquiry_items (
      inquiry_id, product_id, product_slug, product_title, sku, quantity,
      options_json, source_solution_slug, source_package_key
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
  `)

  const statements = [
    inquiryStatement,
    ...record.cartItems.map((item) =>
      itemStatement.bind(
        record.id,
        item.productId,
        item.slug,
        item.title,
        item.sku,
        item.quantity,
        Object.keys(item.options).length ? JSON.stringify(item.options) : null,
        item.sourceSolutionSlug,
        item.sourcePackageKey,
      ),
    ),
  ]

  await env.INQUIRIES_DB.batch(statements)
}

export async function updateInquiryStatus(
  inquiryId: string,
  status: InquiryStatus,
): Promise<void> {
  await env.INQUIRIES_DB.prepare(
    'UPDATE inquiries SET status = ?1, updated_at = ?2 WHERE id = ?3',
  )
    .bind(status, new Date().toISOString(), inquiryId)
    .run()
}

function line(label: string, value: string | number | null | undefined): string {
  return value == null || String(value).trim() === ''
    ? ''
    : `${label}: ${value}`
}

function formatOptions(options: Record<string, string>): string {
  return Object.entries(options)
    .map(([label, value]) => `${label}: ${value}`)
    .join(', ')
}

export function buildSalesEmail(record: InquiryRecord): string {
  const heading: Record<InquiryKind, string> = {
    quote: 'Website quote request',
    rfq: 'Website RFQ cart',
    configuration: 'Solution configuration request',
    floorplan: 'Floor-plan configuration request',
  }
  const rows = [
    heading[record.kind],
    '',
    line('Inquiry ID', record.id),
    line('Name', record.name),
    line('Email', record.email),
    line('WhatsApp / phone', record.phone),
    line('Company', record.company),
    line('Source', record.sourceUrl),
    line(
      'Visitor location',
      [record.visitorCity, record.visitorCountry].filter(Boolean).join(', '),
    ),
    line('Visitor IP', record.visitorIp),
    line('Solution', record.solutionTitle),
    line('Package', record.packageTitle),
    line('Attachment', record.attachment?.name),
  ].filter(Boolean)

  if (record.cartItems.length) {
    rows.push('', 'Requested products:')
    record.cartItems.forEach((item, index) => {
      rows.push(
        `${index + 1}. ${item.title}${item.sku ? ` (${item.sku})` : ''} × ${item.quantity}`,
      )
      const options = formatOptions(item.options)
      if (options) rows.push(`   ${options}`)
    })
  }

  if (record.packageSnapshot) {
    const snapshot = record.packageSnapshot
    rows.push(
      '',
      'Requested configuration:',
      line('Area', formatArea(snapshot)),
      line('Equipment count', formatEquipmentCount(snapshot)),
    )
    snapshot.items.forEach((item, index) => {
      rows.push(
        `${index + 1}. ${item.title}${item.sku ? ` (${item.sku})` : ''} × ${item.quantity} ${item.unit}${item.variantNote ? ` — ${item.variantNote}` : ''}`,
      )
    })
  }

  if (record.message) rows.push('', 'Message:', record.message)
  return rows.filter((value) => value !== '').join('\n')
}

export function buildCustomerEmail(
  record: InquiryRecord,
  configurationUrl: string | null,
): string {
  const firstName = record.name?.split(/\s+/)[0]
  const greeting = firstName ? `Hi ${firstName},` : 'Hello,'

  if (record.kind === 'configuration' && record.packageSnapshot && configurationUrl) {
    return [
      greeting,
      '',
      `Your ${record.packageSnapshot.packageTitle} configuration for ${record.packageSnapshot.solutionTitle} is ready.`,
      '',
      `Open the verified configuration: ${configurationUrl}`,
      '',
      `This private link expires in ${CONFIGURATION_ACCESS_DAYS} days. It includes the equipment quantities, product detail links, and a button to add the complete package to your RFQ cart.`,
      '',
      'Reply to this email if you want us to adjust the package to your room dimensions, budget, or class format.',
      '',
      'Coral Pilates',
    ].join('\n')
  }

  const subjectByKind: Record<Exclude<InquiryKind, 'configuration'>, string> = {
    quote: 'quote request',
    rfq: 'RFQ',
    floorplan: 'floor plan and configuration request',
  }
  const kind =
    record.kind === 'configuration' ? 'request' : subjectByKind[record.kind]
  return [
    greeting,
    '',
    `We received your ${kind}.`,
    `Reference: ${record.id}`,
    '',
    'A Coral Pilates specialist will review it and reply within one business day.',
    '',
    'Coral Pilates',
  ].join('\n')
}
