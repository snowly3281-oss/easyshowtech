type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      action?: string
      theme?: 'light' | 'dark' | 'auto'
      refreshExpired?: 'auto' | 'manual' | 'never'
    },
  ) => string
  reset: (widgetId?: string) => void
}

const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let apiPromise: Promise<TurnstileApi | undefined> | undefined

function getWidget(selector: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(selector)
}

function getApi(): TurnstileApi | undefined {
  return (
    window as typeof window & {
      turnstile?: TurnstileApi
    }
  ).turnstile
}

/**
 * Load Turnstile only when a form is actually visible or usable. Most forms
 * live in dialogs, so loading it from BaseLayout delayed every page even when
 * the visitor never opened a form.
 */
function loadApi(): Promise<TurnstileApi | undefined> {
  const ready = getApi()
  if (ready) return Promise.resolve(ready)
  if (apiPromise) return apiPromise

  apiPromise = new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]',
    )
    const finish = () => resolve(getApi())
    const fail = () => {
      apiPromise = undefined
      resolve(undefined)
    }

    if (existing) {
      existing.addEventListener('load', finish, {once: true})
      existing.addEventListener('error', fail, {once: true})
      return
    }

    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.addEventListener('load', finish, {once: true})
    script.addEventListener('error', fail, {once: true})
    document.body.append(script)
  })

  return apiPromise
}

/**
 * Mark a response as spent before sending it to the server. Turnstile tokens
 * are single-use; modal forms use this marker to refresh only after a submit,
 * without discarding a valid token every time the dialog opens.
 */
export function markTurnstileSpent(selector: string): void {
  const widget = getWidget(selector)
  if (widget) widget.dataset.turnstileSpent = 'true'
}

/**
 * Reset after the browser has laid out a newly-opened dialog. Hidden widgets
 * can otherwise remain at zero height or fail to issue a fresh response.
 */
export function resetTurnstile(selector: string): void {
  const widget = getWidget(selector)
  if (!widget) return
  delete widget.dataset.turnstileSpent
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      try {
        const widgetId = widget.dataset.turnstileWidgetId
        if (widgetId) getApi()?.reset(widgetId)
      } catch {
        // The API may still be loading. `data-refresh-expired="auto"` remains
        // the fallback, and the server still rejects missing/invalid tokens.
      }
    })
  })
}

/** Refresh a modal widget only when its previous token was submitted. */
export function prepareTurnstile(selector: string): void {
  const widget = getWidget(selector)
  if (!widget) return

  void loadApi().then((api) => {
    if (!api) return
    let widgetId = widget.dataset.turnstileWidgetId
    if (!widgetId) {
      const sitekey = widget.dataset.sitekey
      if (!sitekey) return
      widgetId = api.render(widget, {
        sitekey,
        action: widget.dataset.action,
        theme:
          widget.dataset.theme === 'dark' || widget.dataset.theme === 'auto'
            ? widget.dataset.theme
            : 'light',
        refreshExpired:
          widget.dataset.refreshExpired === 'manual' ||
          widget.dataset.refreshExpired === 'never'
            ? widget.dataset.refreshExpired
            : 'auto',
      })
      widget.dataset.turnstileWidgetId = widgetId
    }

    if (widget.dataset.turnstileSpent === 'true') {
      delete widget.dataset.turnstileSpent
      api.reset(widgetId)
    }
  })
}
