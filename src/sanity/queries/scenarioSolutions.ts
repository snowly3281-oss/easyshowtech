import {defineQuery} from 'groq'

// Explicit public projection. Do not expose internal notes, PDFs or old BOMs.
export const scenarioSolutionQuery = defineQuery(`
  *[_type == "solution" && coalesce(language, "en") == $language && (slug.current == $slug || slug.current in $aliases || _id == $documentId)]
  | order((slug.current == $slug) desc)[0]{
    _id, title, scenarioIntro, needs, howProductsWorkTogether, customizationOptions,
    "heroImage": select(
      defined(heroImage.asset._ref) => heroImage{asset, alt, caption},
      defined(coverImage.asset._ref) => coverImage{asset, alt, "caption": null},
      pageBuilder[_type == "heroBlock"][0].backgroundImage{asset, alt, "caption": null}
    ),
    combinationImage{asset, alt, caption},
    gallery[]{_key, asset, alt, caption},
    seo{metaTitle, metaDescription, canonicalUrl, ogTitle, ogDescription, noIndex, ogImage{asset, alt}},
    "recommendedProducts": recommendedProducts[@->isActive == true]->{
      _id, title, "slug": slug.current, productType,
      "categorySlug": select(productCategory->isActive == true && productType == productCategory->productType => productCategory->slug.current, null)
    },
    "recommendedProductCategories": recommendedProductCategories[@->isActive == true]->{
      title, "slug": slug.current, productType,
      "rootSlugAvailable": !defined(*[_type == "product" && isActive == true && slug.current == ^.slug.current][0]._id) && !(slug.current in ["hardware", "parts-accessories", "parts", "custom-displays"]),
      "hasProducts": count(*[_type == "product" && coalesce(language, "en") == $language && isActive == true && productType == ^.productType && productCategory._ref == ^._id]) > 0
    },
    "recommendedPrintingServices": recommendedPrintingServices[@->isActive == true]->{title, "slug": slug.current},
    supportServices[]->{_id, title, "slug": slug.current, shortDescription, isActive},
    relatedSolutions[]->{title, "slug": slug.current},
    packages[scenarioConfiguration == true]{
      _key, title, tier, summary, environment,
      items[]{_key, role, quantityLabel, quantityNote, requirement, reason,
        alternative->{title, "slug": slug.current, productType, "categorySlug": select(productCategory->isActive == true && productType == productCategory->productType => productCategory->slug.current, null), isActive},
        product->{_id, title, "slug": slug.current, productType, "categorySlug": select(productCategory->isActive == true && productType == productCategory->productType => productCategory->slug.current, null), isActive, mainImage{asset, alt},
          printingServices[]->{_id, title, "slug": slug.current, shortDescription, isActive}
        }
      }
    }
  }
`)

// Resolve only existing published references. Never create product/service documents.
export const scenarioCatalogQuery = defineQuery(`{
  "products": *[_type == "product" && _id in $ids && isActive == true]{
    _id, title, "slug": slug.current, productType, "categorySlug": select(productCategory->isActive == true && productType == productCategory->productType => productCategory->slug.current, null), isActive, mainImage{asset, alt},
    printingServices[]->{_id, title, "slug": slug.current, shortDescription, isActive}
  },
  "support": *[_type == "service" && _id == "service.artwork-design-setup" && isActive == true]{
    _id, title, "slug": slug.current, shortDescription, isActive
  }
}`)
