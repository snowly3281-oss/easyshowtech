import { actions } from 'astro:actions'
import { actionErrorMessage } from './actionError'
import { thankYouUrl } from './quoteForm'

const STORAGE_KEY = 'coral-rfq-v1'
const MAX_ITEMS = 50
let turnstileModule: Promise<typeof import('./turnstileClient')> | undefined
let rfqGlobalEventController: AbortController | undefined

function getTurnstileModule() {
  turnstileModule ??= import('./turnstileClient')
  return turnstileModule
}

function prepareRfqTurnstile(): void {
  void getTurnstileModule().then(({prepareTurnstile}) => {
    prepareTurnstile('#rfq-turnstile')
  })
}

interface RfqSource {
  solutionSlug?: string | null
  packageKey?: string | null
  packageTitle?: string | null
}

interface RfqItemInput {
  productId?: string | null
  slug?: string | null
  title?: string | null
  sku?: string | null
  quantity?: number | null
  options?: Record<string, string> | null
  source?: RfqSource | null
}

interface RfqPackageInput {
  source?: RfqSource | null
  items?: RfqItemInput[] | null
}

interface RfqItem {
  key: string
  productId: string | null
  slug: string | null
  title: string
  sku: string | null
  quantity: number
  options: Record<string, string>
  sourceSolutionSlug: string | null
  sourcePackageKey: string | null
  sourcePackageTitle: string | null
}

function cleanString(value: unknown, max = 240): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().slice(0, max)
  return trimmed || null
}

function cleanOptions(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const options: Record<string, string> = {}
  for (const [rawLabel, rawValue] of Object.entries(value)) {
    const label = cleanString(rawLabel, 80)
    const option = cleanString(rawValue, 240)
    if (label && option) options[label] = option
    if (Object.keys(options).length >= 12) break
  }
  return options
}

function itemKey(
  productId: string | null,
  slug: string | null,
  title: string,
  options: Record<string, string>,
): string {
  const sorted = Object.entries(options).sort(([a], [b]) =>
    a.localeCompare(b),
  )
  return JSON.stringify([productId ?? slug ?? title, sorted])
}

function normalizeItem(input: RfqItemInput): RfqItem | null {
  const title = cleanString(input.title)
  if (!title) return null
  const productId = cleanString(input.productId, 160)
  const slug = cleanString(input.slug, 160)
  const options = cleanOptions(input.options)
  const quantity = Math.max(
    1,
    Math.min(999, Math.trunc(Number(input.quantity) || 1)),
  )
  return {
    key: itemKey(productId, slug, title, options),
    productId,
    slug,
    title,
    sku: cleanString(input.sku, 160),
    quantity,
    options,
    sourceSolutionSlug: cleanString(input.source?.solutionSlug, 160),
    sourcePackageKey: cleanString(input.source?.packageKey, 160),
    sourcePackageTitle: cleanString(input.source?.packageTitle, 240),
  }
}

function normalizeStored(value: unknown): RfqItem[] {
  if (!Array.isArray(value)) return []
  const items: RfqItem[] = []
  for (const raw of value.slice(0, MAX_ITEMS)) {
    if (!raw || typeof raw !== 'object') continue
    const candidate = raw as RfqItemInput & { sourcePackageTitle?: unknown }
    const normalized = normalizeItem({
      ...candidate,
      source: {
        solutionSlug:
          'sourceSolutionSlug' in candidate
            ? cleanString(candidate.sourceSolutionSlug, 160)
            : null,
        packageKey:
          'sourcePackageKey' in candidate
            ? cleanString(candidate.sourcePackageKey, 160)
            : null,
        packageTitle:
          'sourcePackageTitle' in candidate
            ? cleanString(candidate.sourcePackageTitle, 240)
            : null,
      },
    })
    if (normalized) items.push(normalized)
  }
  return items
}

function loadItems(): RfqItem[] {
  try {
    return normalizeStored(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'))
  } catch {
    return []
  }
}

function saveItems(items: RfqItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function initRfqCart(): void {
  const root = document.querySelector<HTMLElement>('[data-rfq-widget]')
  if (!root || root.dataset.initialized === 'true') return
  root.dataset.initialized = 'true'

  const dialog = root.querySelector<HTMLDialogElement>('[data-rfq-dialog]')
  const launcher = root.querySelector<HTMLButtonElement>('[data-rfq-launch]')
  const countNodes = Array.from(
    root.querySelectorAll<HTMLElement>('[data-rfq-count]'),
  )
  const itemsNode = root.querySelector<HTMLOListElement>('[data-rfq-items]')
  const emptyNode = root.querySelector<HTMLElement>('[data-rfq-empty]')
  const contentNode = root.querySelector<HTMLElement>('[data-rfq-content]')
  const totalNode = root.querySelector<HTMLElement>('[data-rfq-total]')
  const clearButton =
    root.querySelector<HTMLButtonElement>('[data-rfq-clear]')
  const emailForm =
    root.querySelector<HTMLFormElement>('[data-rfq-email-form]')
  const emailButton =
    root.querySelector<HTMLButtonElement>('[data-rfq-email-submit]')
  const emailStatus =
    root.querySelector<HTMLElement>('[data-rfq-email-status]')
  const successNode =
    root.querySelector<HTMLElement>('[data-rfq-success]')
  const whatsappButton =
    root.querySelector<HTMLButtonElement>('[data-rfq-whatsapp]')
  const whatsappNote =
    root.querySelector<HTMLElement>('[data-rfq-whatsapp-note]')
  const whatsappNumber = root.dataset.whatsapp ?? ''
  const label = (name: string, fallback: string) =>
    root.dataset[name] || fallback
  const locale = root.dataset.locale || 'en'

  if (
    !dialog ||
    !launcher ||
    !itemsNode ||
    !emptyNode ||
    !contentNode ||
    !totalNode ||
    !emailForm ||
    !emailButton ||
    !emailStatus ||
    !successNode ||
    !whatsappButton
  ) {
    return
  }

  // Astro's client router replaces the widget markup on every page change.
  // Keep only one pair of document/window listeners alive so an old, detached
  // widget can never react to a click in the newly-rendered page.
  rfqGlobalEventController?.abort()
  const globalEventController = new AbortController()
  rfqGlobalEventController = globalEventController

  let items = loadItems()

  const totalQuantity = () =>
    items.reduce((sum, item) => sum + item.quantity, 0)

  const emitChange = () => {
    const count = totalQuantity()
    countNodes.forEach((node) => {
      node.textContent = String(count)
      node.hidden = count === 0
    })
    launcher.setAttribute(
      'aria-label',
      count
        ? label('labelOpenCount', 'Open RFQ cart, {count} {items}')
            .replace('{count}', String(count))
            .replace('{items}', label(count === 1 ? 'labelItem' : 'labelItems', count === 1 ? 'item' : 'items'))
        : label('labelOpenEmpty', 'Open empty RFQ cart'),
    )
    window.dispatchEvent(
      new CustomEvent('rfq:change', { detail: { count, items } }),
    )
  }

  const persist = () => {
    saveItems(items)
    emitChange()
  }

  const button = (
    label: string,
    className: string,
    onClick: () => void,
  ) => {
    const element = document.createElement('button')
    element.type = 'button'
    element.className = className
    element.textContent = label
    element.addEventListener('click', onClick)
    return element
  }

  const render = () => {
    itemsNode.replaceChildren()
    const empty = items.length === 0
    emptyNode.hidden = !empty
    contentNode.hidden = empty
    totalNode.textContent = `${totalQuantity()} ${label(totalQuantity() === 1 ? 'labelItem' : 'labelItems', totalQuantity() === 1 ? 'item' : 'items')}`

    items.forEach((item) => {
      const listItem = document.createElement('li')
      listItem.className = 'rfq__item'

      const copy = document.createElement('div')
      copy.className = 'rfq__itemcopy'
      const title = item.slug
        ? document.createElement('a')
        : document.createElement('span')
      title.className = 'rfq__itemtitle'
      title.textContent = item.title
      if (title instanceof HTMLAnchorElement) {
        title.href = `${locale === 'en' ? '' : `/${locale}`}/products/${encodeURIComponent(item.slug ?? '')}`
      }
      copy.appendChild(title)

      const metaBits = [item.sku]
      const optionText = Object.entries(item.options)
        .map(([label, value]) => `${label}: ${value}`)
        .join(' · ')
      if (optionText) metaBits.push(optionText)
      if (item.sourcePackageTitle) {
        metaBits.push(`${label('labelPackage', 'Package')}: ${item.sourcePackageTitle}`)
      }
      const meta = document.createElement('p')
      meta.className = 'rfq__itemmeta'
      meta.textContent = metaBits.filter(Boolean).join(' · ')
      if (meta.textContent) copy.appendChild(meta)

      const controls = document.createElement('div')
      controls.className = 'rfq__itemcontrols'
      const quantityLabel = document.createElement('label')
      quantityLabel.className = 'rfq__qty'
      const quantityText = document.createElement('span')
      quantityText.textContent = label('labelQty', 'Qty')
      const quantity = document.createElement('input')
      quantity.type = 'number'
      quantity.min = '1'
      quantity.max = '999'
      quantity.inputMode = 'numeric'
      quantity.value = String(item.quantity)
      quantity.setAttribute(
        'aria-label',
        label('labelQuantityFor', 'Quantity for {product}').replace('{product}', item.title),
      )
      quantity.addEventListener('change', () => {
        item.quantity = Math.max(
          1,
          Math.min(999, Math.trunc(Number(quantity.value) || 1)),
        )
        quantity.value = String(item.quantity)
        persist()
        render()
      })
      quantityLabel.appendChild(quantityText)
      quantityLabel.appendChild(quantity)
      const remove = button(label('labelRemove', 'Remove'), 'rfq__remove', () => {
        items = items.filter((candidate) => candidate.key !== item.key)
        persist()
        render()
      })
      controls.appendChild(quantityLabel)
      controls.appendChild(remove)
      listItem.appendChild(copy)
      listItem.appendChild(controls)
      itemsNode.appendChild(listItem)
    })
  }

  const add = (input: RfqItemInput, openAfter = false) => {
    const item = normalizeItem(input)
    if (!item) return
    const existing = items.find((candidate) => candidate.key === item.key)
    if (existing) existing.quantity = Math.min(999, existing.quantity + item.quantity)
    else if (items.length < MAX_ITEMS) items.push(item)
    persist()
    render()
    if (openAfter) {
      dialog.showModal()
      prepareRfqTurnstile()
    }
  }

  const addPackage = (input: RfqPackageInput) => {
    for (const item of input.items ?? []) {
      add({ ...item, source: input.source }, false)
    }
    dialog.showModal()
    prepareRfqTurnstile()
  }

  const open = () => {
    successNode.hidden = true
    emailForm.hidden = false
    render()
    if (!dialog.open) dialog.showModal()
    prepareRfqTurnstile()
  }

  launcher.addEventListener('click', open)
  root.querySelectorAll('[data-rfq-close]').forEach((element) => {
    element.addEventListener('click', () => dialog.close())
  })
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close()
  })
  clearButton?.addEventListener('click', () => {
    items = []
    persist()
    render()
  })

  document.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    const packageButton = target.closest<HTMLElement>('[data-rfq-package]')
    if (packageButton) {
      const raw = packageButton.dataset.rfqPackage
      if (!raw) return
      try {
        const parsed = JSON.parse(raw) as RfqPackageInput
        addPackage(parsed)
      } catch {
        // Invalid package data is ignored; it can only originate in rendered
        // server markup, and the normal single-product path remains available.
      }
      return
    }

    const addButton = target.closest<HTMLElement>('[data-rfq-add]')
    if (!addButton) return
    const options = cleanOptions(
      (() => {
        try {
          return JSON.parse(addButton.dataset.rfqOptions ?? '{}')
        } catch {
          return {}
        }
      })(),
    )
    if (addButton.hasAttribute('data-rfq-live-options')) {
      document
        .querySelectorAll<HTMLElement>('[data-config-value]')
        .forEach((node) => {
          const key = cleanString(node.dataset.configValue, 80)
          const value = cleanString(node.textContent, 240)
          if (key && value) options[key] = value
        })
    }
    add(
      {
        productId: addButton.dataset.rfqProductId,
        slug: addButton.dataset.rfqSlug,
        title: addButton.dataset.rfqTitle,
        sku: addButton.dataset.rfqSku,
        quantity: Number(addButton.dataset.rfqQuantity) || 1,
        options,
        source: {
          solutionSlug: addButton.dataset.rfqSolutionSlug,
          packageKey: addButton.dataset.rfqPackageKey,
          packageTitle: addButton.dataset.rfqPackageTitle,
        },
      },
      false,
    )
    const isCompactButton = addButton.hasAttribute('data-rfq-compact')
    const original = addButton.textContent
    const originalLabel = addButton.getAttribute('aria-label')
    if (!isCompactButton) addButton.textContent = label('labelAdded', 'Added to RFQ')
    else
      addButton.setAttribute(
        'aria-label',
        addButton.dataset.rfqAddedLabel ||
          `${addButton.dataset.rfqTitle || label('labelProduct', 'Product')} ${label('labelAdded', 'Added to RFQ')}`,
      )
    addButton.dataset.added = 'true'
    window.setTimeout(() => {
      if (!isCompactButton) addButton.textContent = original
      else if (originalLabel) addButton.setAttribute('aria-label', originalLabel)
      delete addButton.dataset.added
    }, 1400)
  }, { signal: globalEventController.signal })

  window.addEventListener('rfq:open', open, {
    signal: globalEventController.signal,
  })

  emailForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    if (!items.length || !emailForm.reportValidity()) return
    emailButton.disabled = true
    emailButton.textContent = label('labelSending', 'Sending…')
    emailStatus.textContent = ''
    emailStatus.dataset.state = ''

    const data = new FormData(emailForm)
    data.set(
      'items_json',
      JSON.stringify(
        items.map((item) => ({
          productId: item.productId,
          slug: item.slug,
          title: item.title,
          sku: item.sku,
          quantity: item.quantity,
          options: item.options,
          sourceSolutionSlug: item.sourceSolutionSlug,
          sourcePackageKey: item.sourcePackageKey,
        })),
      ),
    )
    data.set('source_url', location.href)
    const turnstile = await getTurnstileModule()
    turnstile.markTurnstileSpent('#rfq-turnstile')
    const { data: result, error } = await actions.submitRfq(data)

    emailButton.disabled = false
    emailButton.textContent = label('labelSendEmail', 'Send RFQ by email')
    if (result?.ok) {
      const destination = thankYouUrl(result.inquiryId)
      if (destination) {
        window.location.assign(destination)
        return
      }
      items = []
      persist()
      render()
      emailForm.hidden = true
      successNode.hidden = false
      const ref = successNode.querySelector<HTMLElement>('[data-rfq-reference]')
      if (ref && result.inquiryId) ref.textContent = result.inquiryId
      return
    }

    turnstile.resetTurnstile('#rfq-turnstile')
    emailStatus.dataset.state = 'error'
    emailStatus.textContent = actionErrorMessage(
      error,
      label('labelError', 'Something went wrong. Please try again.'),
      label('labelCheckForm', 'Please check the form and try again.'),
    )
  })

  whatsappButton.addEventListener('click', () => {
    if (!items.length || !whatsappNumber) return
    const form = new FormData(emailForm)
    const intro = [
      label('labelWaHeading', 'Hello Coral Pilates, I would like an RFQ for:'),
      '',
      ...items.flatMap((item, index) => {
        const row = `${index + 1}. ${item.title}${item.sku ? ` (${item.sku})` : ''} x ${item.quantity}`
        const options = Object.entries(item.options)
          .map(([label, value]) => `${label}: ${value}`)
          .join(', ')
        return options ? [row, `   ${options}`] : [row]
      }),
    ]
    const name = cleanString(form.get('name'))
    const company = cleanString(form.get('company'))
    const note = cleanString(form.get('message'), 2000)
    if (name || company) {
      intro.push('', `${label('labelContact', 'Contact')}: ${[name, company].filter(Boolean).join(' — ')}`)
    }
    if (note) intro.push('', `${label('labelNotes', 'Notes')}: ${note}`)
    intro.push('', `${label('labelSource', 'Source')}: ${location.href}`)
    const href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(intro.join('\n'))}`
    window.open(href, '_blank', 'noopener,noreferrer')
    if (whatsappNote) {
      whatsappNote.hidden = false
      whatsappNote.textContent =
        label('labelWaOpened', 'WhatsApp opened. Press Send there to complete your RFQ.')
    }
  })

  persist()
  render()
}
