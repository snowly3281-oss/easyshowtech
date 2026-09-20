import {VisualEditing} from '@sanity/visual-editing/react'

/**
 * The Presentation Tool owns the iframe connection. Outside Studio this
 * component stays inert, while inside the iframe it renders click-to-edit
 * overlays for stega-encoded Sanity values.
 */
export default function SanityVisualEditing() {
  // In development, the Studio runs on localhost:3333
  // In production, this would need to be the deployed Studio URL
  const studioUrl = import.meta.env.DEV
    ? 'http://localhost:3333'
    : undefined

  return (
    <VisualEditing
      studioUrl={studioUrl}
      portal
      refresh={() => {
        window.location.reload()
        return Promise.resolve()
      }}
    />
  )
}
