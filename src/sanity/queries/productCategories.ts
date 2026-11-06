import { defineQuery } from 'groq'

/** Active categories with at least one active product are the only routable SEO pages. */
export const productCategoryPathsQuery = defineQuery(`
  *[
    _type == "productCategory" &&
    coalesce(language, "en") == $language &&
    isActive == true &&
    productType == $productType &&
    defined(slug.current) &&
    coalesce(seo.noIndex, false) != true &&
    count(*[_type == "product" && coalesce(language, "en") == $language && isActive == true && productType == ^.productType && productCategory._ref == ^._id]) > 0
  ] | order(sortOrder asc, title asc){
    "slug": slug.current,
    "rootSlugAvailable": !defined(*[_type == "product" && isActive == true && slug.current == ^.slug.current][0]._id) && !(^.slug.current in ["hardware", "parts-accessories", "parts", "custom-displays"])
  }
`)

export const headerNavigationQuery = defineQuery(`{
  "services": *[
    _type == "service" &&
    coalesce(language, "en") == $language &&
    isActive == true
  ] | order(sortOrder asc, title asc){ _id, title, "slug": slug.current, shortDescription },
  "productCategories": *[
    _type == "productCategory" &&
    coalesce(language, "en") == $language &&
    isActive == true &&
    defined(slug.current) &&
    coalesce(seo.noIndex, false) != true &&
    count(*[_type == "product" && coalesce(language, "en") == $language && isActive == true && productType == ^.productType && productCategory._ref == ^._id]) > 0
  ] | order(sortOrder asc, title asc){
    _id, title, "slug": slug.current, productType, sortOrder,
    "rootSlugAvailable": !defined(*[_type == "product" && isActive == true && slug.current == ^.slug.current][0]._id) && !(slug.current in ["hardware", "parts-accessories", "parts", "custom-displays"])
  }
}`)

export const productCategoryBySlugQuery = defineQuery(`
  *[
    _type == "productCategory" &&
    coalesce(language, "en") == $language &&
    slug.current == $slug &&
    isActive == true &&
    coalesce(seo.noIndex, false) != true
  ][0]{
    _id,
    title,
    "slug": slug.current,
      "rootSlugAvailable": !defined(*[_type == "product" && slug.current == ^.slug.current][0]._id) && !(slug.current in ["hardware", "parts-accessories", "parts", "custom-displays"]),
    productType,
    description,
    intro,
    contentBlocks,
    heroImage{ asset, alt },
    seo{ metaTitle, metaDescription, canonicalUrl, ogTitle, ogDescription, noIndex, ogImage{ asset, alt } },
    "products": *[
      _type == "product" &&
      coalesce(language, "en") == $language &&
      isActive == true &&
      productCategory._ref == ^._id && productType == ^.productType
    ] | order(sortOrder asc, title asc){
      _id,
      title,
      "slug": slug.current,
      sku,
      summary,
      productType,
      catalogType,
      "productCategorySlug": select(productCategory->isActive == true && productType == productCategory->productType => productCategory->slug.current, null),
      "partsCategoryKey": partsCategory->key,
      "seriesTitle": series->title,
      "seriesSlug": series->slug.current,
      "serviceSlugs": printingServices[]->slug.current,
      mainImage{ asset, alt },
      priceDisplay,
      price,
      priceMin,
      priceMax,
      currency,
      isFeatured,
      sortOrder
    },
    "relatedCategories": relatedCategories[@->isActive == true && coalesce(@->seo.noIndex, false) != true]->{
      title, "slug": slug.current, productType,
      "rootSlugAvailable": !defined(*[_type == "product" && isActive == true && slug.current == ^.slug.current][0]._id) && !(slug.current in ["hardware", "parts-accessories", "parts", "custom-displays"]),
      "hasProducts": count(*[_type == "product" && coalesce(language, "en") == $language && isActive == true && productType == ^.productType && productCategory._ref == ^._id]) > 0
    },
    "relatedPrintingServices": relatedPrintingServices[@->isActive == true]->{ title, "slug": slug.current, shortDescription },
    "relatedSolutions": relatedSolutions[@->isActive != false]->{ title, "slug": slug.current, summary }
  }
`)
