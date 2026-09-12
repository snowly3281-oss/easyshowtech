type FacetName = 'series' | 'equipment' | 'parts'
type SortMode = 'featured' | 'price-asc' | 'price-desc'

interface CatalogState {
  series: string[]
  equipment: string[]
  parts: string[]
  min: number | null
  max: number | null
  sort: SortMode
  page: number
}

interface ResultLabels {
  single: string
  plural: string
  zero: string
}

function numberOrNull(value: string | null | undefined): number | null {
  return value === '' || value == null ? null : Number(value)
}

function debounce(callback: () => void, delay: number): () => void {
  let timeout: ReturnType<typeof setTimeout> | undefined
  return () => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(callback, delay)
  }
}

function facetName(value: string | null): FacetName | null {
  return value === 'series' || value === 'equipment' || value === 'parts'
    ? value
    : null
}

function sortMode(value: string | null): SortMode {
  return value === 'price-asc' || value === 'price-desc'
    ? value
    : 'featured'
}

export function initProductCatalog(): void {
  const root = document.querySelector<HTMLElement>('[data-product-catalog]')
  if (!root || root.dataset.initialized === 'true') return

  const grid = root.querySelector<HTMLElement>('[data-grid]')
  if (!grid) return
  root.dataset.initialized = 'true'

  const perPage = Math.max(1, Number(root.dataset.perPage) || 9)
  const resultLabels: ResultLabels = {
    single: root.dataset.resultSingle ?? '{shown} of {total} product',
    plural: root.dataset.resultPlural ?? '{shown} of {total} products',
    zero: root.dataset.resultZero ?? 'No products',
  }
  const cards = Array.from(grid.querySelectorAll<HTMLElement>('.card'))
  const results = root.querySelector<HTMLElement>('[data-results]')
  const empty = root.querySelector<HTMLElement>('[data-empty]')
  const pager = root.querySelector<HTMLElement>('[data-pager]')
  const sortSelect = root.querySelector<HTMLSelectElement>('[data-sort]')
  const priceMin = root.querySelector<HTMLInputElement>('[data-price-min]')
  const priceMax = root.querySelector<HTMLInputElement>('[data-price-max]')
  const resetButton = root.querySelector<HTMLButtonElement>('[data-reset]')
  const facets = Array.from(
    root.querySelectorAll<HTMLInputElement>('[data-facet]'),
  )

  const state: CatalogState = {
    series: [],
    equipment: [],
    parts: [],
    min: null,
    max: null,
    sort: 'featured',
    page: 1,
  }

  const readUrl = () => {
    const params = new URLSearchParams(location.search)
    state.series = (params.get('series') ?? '').split(',').filter(Boolean)
    state.equipment = (params.get('equipment') ?? '')
      .split(',')
      .filter(Boolean)
    state.parts = (params.get('parts') ?? '').split(',').filter(Boolean)
    state.min = numberOrNull(params.get('min'))
    state.max = numberOrNull(params.get('max'))
    state.sort = sortMode(params.get('sort'))
    state.page = Math.max(
      1,
      Number.parseInt(params.get('page') ?? '1', 10) || 1,
    )
  }

  const syncControls = () => {
    facets.forEach((checkbox) => {
      const group = facetName(checkbox.dataset.facet ?? null)
      checkbox.checked = Boolean(
        group && state[group].includes(checkbox.value),
      )
    })
    if (sortSelect) sortSelect.value = state.sort
    if (priceMin) priceMin.value = state.min == null ? '' : String(state.min)
    if (priceMax) priceMax.value = state.max == null ? '' : String(state.max)
  }

  const syncUrl = () => {
    const params = new URLSearchParams()
    if (state.series.length) params.set('series', state.series.join(','))
    if (state.equipment.length)
      params.set('equipment', state.equipment.join(','))
    if (state.parts.length) params.set('parts', state.parts.join(','))
    if (state.min != null) params.set('min', String(state.min))
    if (state.max != null) params.set('max', String(state.max))
    if (state.sort !== 'featured') params.set('sort', state.sort)
    if (state.page > 1) params.set('page', String(state.page))
    const query = params.toString()
    history.replaceState(null, '', query ? `?${query}` : location.pathname)
  }

  const hasActiveFilters = () =>
    state.series.length > 0 ||
    state.equipment.length > 0 ||
    state.parts.length > 0 ||
    state.min != null ||
    state.max != null ||
    state.sort !== 'featured' ||
    state.page > 1

  const matches = (card: HTMLElement) => {
    const series = card.dataset.series ?? ''
    const equipment = (card.dataset.equipment ?? '')
      .split(',')
      .filter(Boolean)
    const catalogType = card.dataset.catalogType ?? 'equipment'
    const partsCategory = card.dataset.partsCategory ?? ''
    if (state.series.length && !state.series.includes(series)) return false
    if (
      state.equipment.length &&
      !state.equipment.some((selected) => equipment.includes(selected))
    )
      return false
    if (state.parts.length) {
      const isPart = catalogType === 'accessory' || catalogType === 'spare_part'
      const matchesAllParts = state.parts.includes('all') && isPart
      const matchesPartCategory = state.parts.includes(partsCategory)
      if (!matchesAllParts && !matchesPartCategory) return false
    }

    const cardMin = numberOrNull(card.dataset.priceMin)
    const cardMax = numberOrNull(card.dataset.priceMax)
    if (state.min != null && (cardMax == null || cardMax < state.min))
      return false
    if (state.max != null && (cardMin == null || cardMin > state.max))
      return false
    return true
  }

  const sortCards = (items: HTMLElement[]) => {
    if (state.sort === 'featured') return items
    const direction = state.sort === 'price-asc' ? 1 : -1
    const key = state.sort === 'price-asc' ? 'priceMin' : 'priceMax'
    return items.sort((a, b) => {
      const aPrice = numberOrNull(a.dataset[key])
      const bPrice = numberOrNull(b.dataset[key])
      if (aPrice == null && bPrice == null) return 0
      if (aPrice == null) return 1
      if (bPrice == null) return -1
      return (aPrice - bPrice) * direction
    })
  }

  const pageList = (current: number, count: number): Array<number | 'gap'> => {
    if (count <= 5)
      return Array.from({ length: count }, (_, index) => index + 1)
    const pages = new Set([
      1,
      2,
      3,
      current - 1,
      current,
      current + 1,
      count,
    ])
    const numbers = Array.from(pages)
      .filter((page) => page >= 1 && page <= count)
      .sort((a, b) => a - b)
    const output: Array<number | 'gap'> = []
    let previous = 0
    numbers.forEach((page) => {
      if (page - previous > 1) output.push('gap')
      output.push(page)
      previous = page
    })
    return output
  }

  let render = () => {}

  const setPage = (page: number) => {
    state.page = page
    syncUrl()
    render()
    const top = grid.getBoundingClientRect().top + window.scrollY - 120
    window.scrollTo({ top, behavior: 'smooth' })
  }

  const pageButton = (
    label: string,
    page: number,
    disabled: boolean,
    active: boolean,
  ) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = `cat__page${active ? ' is-active' : ''}`
    button.textContent = label
    button.disabled = disabled
    if (!disabled) button.addEventListener('click', () => setPage(page))
    return button
  }

  const renderPager = (pageCount: number) => {
    if (!pager) return
    pager.replaceChildren()
    if (pageCount <= 1) {
      pager.hidden = true
      return
    }
    pager.hidden = false
    pager.append(pageButton('‹', state.page - 1, state.page === 1, false))
    pageList(state.page, pageCount).forEach((page) => {
      if (page === 'gap') {
        const gap = document.createElement('span')
        gap.className = 'cat__pagegap'
        gap.textContent = '…'
        pager.append(gap)
      } else {
        pager.append(pageButton(String(page), page, false, page === state.page))
      }
    })
    pager.append(
      pageButton('›', state.page + 1, state.page === pageCount, false),
    )
  }

  render = () => {
    const filtered = sortCards(cards.filter(matches))
    const total = filtered.length
    const pageCount = Math.max(1, Math.ceil(total / perPage))
    if (state.page > pageCount) state.page = pageCount
    const start = (state.page - 1) * perPage
    const pageItems = filtered.slice(start, start + perPage)

    cards.forEach((card) => {
      card.hidden = true
    })
    pageItems.forEach((card) => {
      card.hidden = false
      grid.append(card)
    })

    if (results) {
      const template =
        total === 0
          ? resultLabels.zero
          : total === 1
            ? resultLabels.single
            : resultLabels.plural
      results.textContent = template
        .replace('{shown}', String(pageItems.length))
        .replace('{total}', String(total))
    }
    if (empty) empty.hidden = total !== 0
    if (resetButton) resetButton.disabled = !hasActiveFilters()
    renderPager(pageCount)
  }

  const resetToFirstPage = () => {
    state.page = 1
    syncUrl()
    render()
  }

  facets.forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const group = facetName(checkbox.dataset.facet ?? null)
      if (!group) return
      const selected = state[group]
      const index = selected.indexOf(checkbox.value)
      if (checkbox.checked && index === -1) selected.push(checkbox.value)
      else if (!checkbox.checked && index !== -1) selected.splice(index, 1)
      resetToFirstPage()
    })
  })

  sortSelect?.addEventListener('change', () => {
    state.sort = sortMode(sortSelect.value)
    resetToFirstPage()
  })
  const updatePrice = debounce(() => {
    state.min = numberOrNull(priceMin?.value)
    state.max = numberOrNull(priceMax?.value)
    resetToFirstPage()
  }, 300)
  priceMin?.addEventListener('input', updatePrice)
  priceMax?.addEventListener('input', updatePrice)
  resetButton?.addEventListener('click', () => {
    Object.assign(state, {
      series: [],
      equipment: [],
      parts: [],
      min: null,
      max: null,
      sort: 'featured',
      page: 1,
    })
    syncControls()
    syncUrl()
    render()
  })

  readUrl()
  syncControls()
  render()
}
