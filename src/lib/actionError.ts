import { isInputError } from 'astro:actions'

type ActionError = Parameters<typeof isInputError>[0]

export function actionErrorMessage(
  error: ActionError | null | undefined,
  fallback: string,
  invalidForm = fallback,
): string {
  if (!error) return fallback
  if (isInputError(error)) {
    const first = Object.values(error.fields)[0]
    return (Array.isArray(first) ? first[0] : '') || invalidForm
  }
  if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message || fallback
  }
  return fallback
}
