import {defineQuery} from 'groq'

// Explicit public projection. Do not expose internal notes, PDFs or old BOMs.
export const scenarioSolutionQuery = defineQuery(`
  *[_type == "solution" && coalesce(language, "en") == $language && (slug.current == $slug || slug.current in $aliases || _id == $documentId)]
  | order((slug.current == $slug) desc)[0]{
    _id, title, scenarioIntro, needs, howProductsWorkTogether, customizationOptions,
    heroImage{asset, alt, caption}, combinationImage{asset, alt, caption},
    gallery[]{_key, asset, alt, caption},
    seo{metaTitle, metaDescription, ogImage{asset, alt}},
    supportServices[]->{_id, title, "slug": slug.current, shortDescription, isActive},
    relatedSolutions[]->{title, "slug": slug.current},
    packages[scenarioConfiguration == true]{
      _key, title, tier, summary, environment,
      items[]{_key, role, quantityLabel, quantityNote, requirement, reason,
        alternative->{title, "slug": slug.current, isActive},
        product->{_id, title, "slug": slug.current, isActive, mainImage{asset, alt},
          printingServices[]->{_id, title, "slug": slug.current, shortDescription, isActive}
        }
      }
    }
  }
`)

// Resolve only existing published references. Never create product/service documents.
export const scenarioCatalogQuery = defineQuery(`{
  "products": *[_type == "product" && _id in $ids && isActive == true]{
    _id, title, "slug": slug.current, isActive, mainImage{asset, alt},
    printingServices[]->{_id, title, "slug": slug.current, shortDescription, isActive}
  },
  "support": *[_type == "service" && _id == "service.artwork-design-setup" && isActive == true]{
    _id, title, "slug": slug.current, shortDescription, isActive
  }
}`)
