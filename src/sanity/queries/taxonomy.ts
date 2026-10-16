import { defineQuery } from 'groq'

/**
 * Triple-axis taxonomy for the catalog filter bar.
 *
 * After the three-tab refactor the front end exposes three independent
 * facet groups, one per tab:
 *
 *   - `series`         → "Products catalog" tab (kind == "product")
 *   - `services`       → "Printing Service"  tab (the new `service` doc)
 *   - `partsCategories`→ "Parts & accessories" tab (the new `partsCategory` doc)
 *
 * Each list is already sorted in the back end so the front end can render
 * facets in arrival order. Series `kind` is filtered here, so the home
 * carousel and the products page only see the relevant slice.
 *
 * The legacy `equipment` document is intentionally NOT returned. The front
 * end has no "by equipment" facet anymore; old `product.equipment` refs
 * resolve through the `equipmentSlugs`/`equipmentTitles` fallback in the
 * product list query (kept for backwards compatibility).
 */
export const taxonomyQuery = defineQuery(`{
  "series": *[
    _type == "series" &&
    coalesce(language, "en") == $language &&
    coalesce(kind, "product") == "product" &&
    slug.current != "apparatus"
  ] | order(order asc, title asc){
    _id, title, "slug": slug.current, kind
  },
  "services": *[
    _type == "service" &&
    coalesce(language, "en") == $language
  ] | order(order asc, title asc){
    _id, title, "slug": slug.current
  },
  "partsCategories": *[
    _type == "partsCategory" &&
    coalesce(language, "en") == $language
  ] | order(order asc, title asc){
    _id, title, "categoryKey": key, description
  }
}`)
