import { defineQuery } from 'groq'

/**
 * Published product slugs — drives getStaticPaths for /products/[slug].
 * Only `isActive == true` products are built.
 */
export const productPathsQuery = defineQuery(`
  *[
    _type == "product" &&
    coalesce(language, "en") == $language &&
    isActive == true &&
    defined(slug.current)
  ]{
    "slug": slug.current,
    productType,
    "categorySlug": select(productCategory->isActive == true && productType == productCategory->productType => productCategory->slug.current, null)
  }
`)

export const productRouteBySlugQuery = defineQuery(`
  *[
    _type == "product" &&
    coalesce(language, "en") == $language &&
    slug.current == $slug &&
    isActive == true
  ][0]{
    "slug": slug.current,
    productType,
    "categorySlug": select(productCategory->isActive == true && productType == productCategory->productType => productCategory->slug.current, null)
  }
`)

/**
 * All active products for the Products grid.
 *
 * New display-equipment schema uses:
 *   - series reference → series->title, series->slug.current
 *   - printingServices[] → service slugs for the printing-tab facet
 *   - isActive flag (not status == "published")
 *
 * catalogType is always "equipment" for display products.
 */
export const productListQuery = defineQuery(`
  *[
    _type == "product" &&
    coalesce(language, "en") == $language &&
    isActive == true
  ] | order(sortOrder asc, title asc){
    _id,
    title,
    "slug": slug.current,
    sku,
    summary,
    productType,
    catalogType,
    internalModel,
    "productFamilyTitle": productFamily->title,
    variants[]{ _key, variantName, sku, sizeLabel, width, length, height, measurementUnit, attributes },
    "productCategorySlug": select(productCategory->isActive == true && productType == productCategory->productType => productCategory->slug.current, null),
    "partsCategoryKey": partsCategory->key,
    "seriesTitle": series->title,
    "seriesSlug": series->slug.current,
    "serviceTitles": printingServices[]->title,
    "serviceSlugs": printingServices[]->slug.current,
    mainImage{ asset, alt },
    priceDisplay,
    price,
    priceMin,
    priceMax,
    currency,
    isFeatured,
    sortOrder,
  }
`)

/**
 * One active product by slug, fully projected for the PDP.
 *
 * printingServices is the primary many-to-many relationship with printing services.
 * Relationships are curated references. Series membership is not treated as a product relationship.
 */
export const productBySlugQuery = defineQuery(`
  *[
    _type == "product" &&
    coalesce(language, "en") == $language &&
    slug.current == $slug &&
    isActive == true
  ][0]{
    _id,
    title,
    "slug": slug.current,
    sku,
    summary,
    productType,
    catalogType,
    internalModel,
    "productFamily": productFamily->{
      _id, title, "slug": slug.current, description,
      sharedFeatures[]{_key, title, description},
      sharedSpecifications[]{_key, label, value, unit, note}
    },
    "productCategorySlug": select(productCategory->isActive == true && productType == productCategory->productType => productCategory->slug.current, null),
    "productCategoryRootSlugAvailable": !defined(*[_type == "product" && isActive == true && slug.current == ^.productCategory->slug.current][0]._id) && !(productCategory->slug.current in ["hardware", "parts-accessories", "parts", "custom-displays"]),
    "productCategory": select(productCategory->isActive == true && productType == productCategory->productType => productCategory->{
      title, "slug": slug.current, productType,
      "relatedCategories": relatedCategories[@->isActive == true && @->productType == "customDisplay" && coalesce(@->seo.noIndex, false) != true]->{
        title, "slug": slug.current, productType,
        "rootSlugAvailable": !defined(*[_type == "product" && isActive == true && slug.current == ^.slug.current][0]._id) && !(slug.current in ["hardware", "parts-accessories", "parts", "custom-displays"]),
        "hasProducts": count(*[_type == "product" && coalesce(language, "en") == $language && isActive == true && productType == ^.productType && productCategory._ref == ^._id]) > 0
      }
    }, null),
    "partsCategoryKey": partsCategory->key,
    "seriesTitle": series->title,
    "seriesSlug": series->slug.current,
    "seriesDescription": series->description,
    "serviceTitles": printingServices[]->title,
    "serviceSlugs": printingServices[]->slug.current,
    productionLeadTime,
    priceDisplay,
    price,
    priceMin,
    priceMax,
    currency,
    priceUnit,
    moq,
    warranty,
    mainImage{ asset, alt },
    "gallery": galleryImages[]{ _key, image, alt, label },
    keyFeatures[]{ _key, title, description },
    keySpecs[]{ _key, label, value, note },
    specifications[]{ _key, label, value, unit, note },
    oemTerms[]{ _key, label, value, note },
    variants[]{
      _key, variantName, sku, sizeLabel, attributes, isDefault,
      width, length, height, measurementUnit, frameMaterial, legProfile, tubeDimensions,
      netWeight, shippingWeight, weightUnit, packageDimensions, includedItems, availabilityStatus, sortOrder,
      image{ asset, alt },
      "images": images[]{_key, alt, image{asset, alt}},
      specSheetTitle,
      "specSheetUrl": specSheet.asset->url,
      "specSheetFileName": specSheet.asset->originalFilename
    },
    materials,
    customizationOptions,
    applications,
    includedItems,
    printAreas[]{_key, name, description, dimensions},
    artworkRequirements,
    "technicalDocuments": technicalDocuments[]{
      _key, title, documentType, description, variantSkus,
      "url": file.asset->url,
      "fileName": file.asset->originalFilename,
      "mimeType": file.asset->mimeType
    },
    "printingServices": printingServices[]->{
      _id,
      title,
      "slug": slug.current,
      shortDescription,
    },
    description,
    metaTitle,
    metaDescription,
    ogImage{ asset, alt },
    seo{ metaTitle, metaDescription, canonicalUrl, ogTitle, ogDescription, noIndex, ogImage{ asset, alt } },
    "relatedHardware": relatedHardware[@->isActive == true]->{ _id, title, "slug": slug.current, productType, "categorySlug": select(productCategory->isActive == true && productType == productCategory->productType => productCategory->slug.current, null), sku, mainImage{ asset, alt } },
    "relatedCustomDisplays": relatedCustomDisplays[@->isActive == true]->{ _id, title, "slug": slug.current, productType, "categorySlug": select(productCategory->isActive == true && productType == productCategory->productType => productCategory->slug.current, null), sku, mainImage{ asset, alt } },
    "relatedAccessories": relatedAccessories[@->isActive == true]->{ _id, title, "slug": slug.current, productType, "categorySlug": select(productCategory->isActive == true && productType == productCategory->productType => productCategory->slug.current, null), sku, mainImage{ asset, alt } },
    "accessories": accessories[@->isActive == true]->{ _id, title, "slug": slug.current, productType, "categorySlug": select(productCategory->isActive == true && productType == productCategory->productType => productCategory->slug.current, null), sku, mainImage{ asset, alt } },
    "relatedSolutions": relatedSolutions[@->isActive != false]->{ title, "slug": slug.current, summary },
    "relatedDisplays": *[
      _type == "product" &&
      isActive == true &&
      productType == "customDisplay" &&
      ^._id in relatedHardware[]._ref
    ] | order(sortOrder asc, title asc){ _id, title, "slug": slug.current, productType, "categorySlug": select(productCategory->isActive == true && productType == productCategory->productType => productCategory->slug.current, null), sku, mainImage{ asset, alt } },
    faq[]{ _key, question, answer },
    brand,
    mpn,
    gtin13,
    "related": relatedProducts[@->isActive == true]->{
      _id, title, "slug": slug.current, sku,
      productType,
      "categorySlug": select(productCategory->isActive == true && productType == productCategory->productType => productCategory->slug.current, null),
      "seriesTitle": series->title,
      "seriesSlug": series->slug.current,
      mainImage{ asset, alt },
      priceDisplay, price, priceMin, priceMax, currency
    }
  }
`)
