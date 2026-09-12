import {VisualEditing} from '@sanity/visual-editing/react'

/**
 * The Presentation Tool owns the iframe connection. Outside Studio this
 * component stays inert, while inside the iframe it renders click-to-edit
 * overlays for stega-encoded Sanity values.
 */
export default function SanityVisualEditing() {
  return (
    <VisualEditing
      portal
      refresh={() => {
        window.location.reload()
        return Promise.resolve()
      }}
    />
  )
}
