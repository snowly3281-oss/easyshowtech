import {
  createImageUrlBuilder,
  type ImageUrlBuilder,
  type SanityImageSource,
} from '@sanity/image-url'
import { sanityClient } from './client'

const builder = createImageUrlBuilder(sanityClient)

/**
 * Build a Sanity image URL. Callers chain sizing, e.g.
 *   urlFor(img).width(1200).auto('format').url()
 * Always pair the output with the stored `alt` text.
 */
export function urlFor(source: SanityImageSource): ImageUrlBuilder {
  return builder.image(source)
}
