import { defineQuery } from 'groq'

/**
 * Series and printing services taxonomy for the catalog filter bar.
 *
 * After the display-equipment refactor:
 *   - series: display categories (Aluminum Tents, Backdrops, etc.), filtered by isActive
 *   - services: printing service types (Custom Fabric Printing, etc.), filtered by isActive
 *   - partsCategories: retained for backward compat (unchanged)
 */
export const taxonomyQuery = defineQuery(`{
  "series": *[
    _type == "series" &&
    coalesce(language, "en") == $language &&
    isActive == true
  ] | order(sortOrder asc, title asc){
    _id,
    title,
    "slug": slug.current,
    shortDescription,
  },
  "services": *[
    _type == "service" &&
    coalesce(language, "en") == $language &&
    isActive == true
  ] | order(sortOrder asc, title asc){
    _id,
    title,
    "slug": slug.current,
    shortDescription,
  },
  "partsCategories": *[
    _type == "partsCategory" &&
    coalesce(language, "en") == $language
  ] | order(order asc, title asc){
    _id,
    title,
    "categoryKey": key,
    description
  }
}`)
