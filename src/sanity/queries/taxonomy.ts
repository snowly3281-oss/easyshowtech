import { defineQuery } from 'groq'

/**
 * Ordered series + equipment lists for the catalog filter bar. Equipment
 * facets only appear when at least one published product references them, so
 * taxonomy prepared for future draft products does not create empty filters.
 */
export const taxonomyQuery = defineQuery(`{
  "series": *[
    _type == "series" &&
    coalesce(language, "en") == $language &&
    slug.current != "apparatus"
  ] | order(order asc, title asc){ _id, title, "slug": slug.current },
  "equipment": *[
    _type == "equipment" &&
    coalesce(language, "en") == $language
  ] | order(order asc, title asc){ _id, title, "slug": slug.current }
}`)
