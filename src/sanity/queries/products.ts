import { defineQuery } from 'groq'

/**
 * Published product slugs — drives getStaticPaths for /products/[slug].
 * Only `status == "published"` products are ever built (editorial gate).
 */
export const productPathsQuery = defineQuery(`
  *[
    _type == "product" &&
    coalesce(language, "en") == $language &&
    status == "published" &&
    defined(slug.current)
  ]{ "slug": slug.current }
`)

/**
 * All published catalog records for the Products grid. Apparatus, accessories
 * and replacement parts deliberately share this query: buyers should use one
 * catalog with facets, rather than switch between two disconnected catalogs.
 *
 * After the three-tab refactor each card carries three independent facet
 * handles so the front end can route each product into exactly one tab:
 *
 *   - `seriesSlug` / `seriesKind`   — Products catalog tab (kind == "product")
 *                                       and Parts tab (kind == "part")
 *   - `serviceSlugs`                — Printing Service tab (any service ref)
 *   - `partsCategoryKey`            — Parts & accessories sub-facet
 *                                       (canonical key from the referenced doc)
 *
 * The deprecated `equipment` reference is still projected as a fallback
 * for any product authored before the `service` document existed.
 */
export const productListQuery = defineQuery(`
  *[
    _type == "product" &&
    coalesce(language, "en") == $language &&
    status == "published"
  ] | order(order asc, title asc){
    _id,
    title,
    "slug": slug.current,
    sku,
    "catalogType": coalesce(catalogType, "equipment"),
    "printingService": coalesce(printingService, false),
    "partsCategoryKey": coalesce(partsCategory->key, partsCategory),
    "partsCategoryTitle": partsCategory->title,
    summary,
    "seriesTitle": series->title,
    "seriesSlug": series->slug.current,
    "seriesKind": coalesce(series->kind, "product"),
    "serviceTitles": select(
      count(serviceTypes) > 0 => serviceTypes[]->title,
      count(equipmentTypes) > 0 => equipmentTypes[]->title,
      defined(equipment) => [equipment->title],
      []
    ),
    "serviceSlugs": select(
      count(serviceTypes) > 0 => serviceTypes[]->slug.current,
      count(equipmentTypes) > 0 => equipmentTypes[]->slug.current,
      defined(equipment) => [equipment->slug.current],
      []
    ),
    mainImage{ asset, alt },
    priceDisplay,
    price,
    priceMin,
    priceMax,
    currency
  }
`)

/**
 * One published product by slug, fully projected for the datasheet PDP
 * (explicit — content-model principle 5). Images keep their asset ref + alt for
 * the front end to size via `urlFor`.
 *
 * `related` = curated `relatedProducts` when present, else up to 3 same-series
 * published products — excluding the product itself (`_id != ^._id`).
 */
export const productBySlugQuery = defineQuery(`
  *[
    _type == "product" &&
    coalesce(language, "en") == $language &&
    slug.current == $slug &&
    status == "published"
  ][0]{
    _id,
    title,
    "slug": slug.current,
    sku,
    catalogType,
    "printingService": coalesce(printingService, false),
    "partsCategoryKey": coalesce(partsCategory->key, partsCategory),
    "partsCategoryTitle": partsCategory->title,
    "seriesTitle": series->title,
    "seriesSlug": series->slug.current,
    "seriesKind": coalesce(series->kind, "product"),
    "serviceTitles": select(
      count(serviceTypes) > 0 => serviceTypes[]->title,
      count(equipmentTypes) > 0 => equipmentTypes[]->title,
      defined(equipment) => [equipment->title],
      []
    ),
    "serviceSlugs": select(
      count(serviceTypes) > 0 => serviceTypes[]->slug.current,
      count(equipmentTypes) > 0 => equipmentTypes[]->slug.current,
      defined(equipment) => [equipment->slug.current],
      []
    ),
    summary,
    productionStatus,
    shipsIn,
    certifications,
    priceDisplay,
    price,
    priceMin,
    priceMax,
    currency,
    priceUnit,
    priceNote,
    moq,
    leadTime,
    warranty,
    mainImage{ asset, alt },
    mainImageDimensionNote,
    gallery[]{ _key, image, alt, label },
    keySpecs[]{ _key, value, unit, label, note },
    variants[]{ _key, name, skuSuffix, isDefault, description, janka, finish, swatchColor },
    specDimensions[]{ _key, label, value },
    specWeight[]{ _key, label, value },
    specMechanism[]{ _key, label, value },
    specMaterials[]{ _key, label, value },
    specRevision,
    compatibilityNotes,
    installationNotes,
    careNotes,
    replacementGuidance,
    "compatibleProducts": compatibleProducts[]->{
      _id,
      title,
      "slug": slug.current,
      sku,
      "seriesTitle": series->title,
      "seriesSlug": series->slug.current,
      mainImage{ asset, alt }
    },
    oemTerms[]{ _key, label, value, note },
    brand,
    mpn,
    gtin13,
    material,
    dimensions,
    weight,
    warrantyUrl,
    certs[]{ _key, label, url },
    pricing[]{ _key, currency, amount, validUntil },
    "solutionPlacements": *[
      _type == "solution" &&
      coalesce(language, "en") == $language &&
      defined(slug.current) &&
      references(^._id)
    ] | order(title asc){
      _id,
      title,
      "slug": slug.current,
      packages[]{
        _key,
        title,
        tier,
        isRecommended,
        "productIds": items[].product._ref
      }
    },
    "related": select(
      count(relatedProducts) > 0 => relatedProducts[]->{
        _id, title, "slug": slug.current, sku, "seriesTitle": series->title,
        "seriesSlug": series->slug.current,
        mainImage{ asset, alt }, priceDisplay, price, priceMin, priceMax, currency
      },
      catalogType in ["accessory", "spare_part"] => *[
        _type == "product" &&
        coalesce(language, "en") == $language &&
        status == "published" &&
        catalogType == ^.catalogType &&
        partsCategory == ^.partsCategory &&
        _id != ^._id
      ] | order(order asc, title asc)[0...3]{
        _id, title, "slug": slug.current, sku, "seriesTitle": series->title,
        "seriesSlug": series->slug.current,
        mainImage{ asset, alt }, priceDisplay, price, priceMin, priceMax, currency
      },
      *[
        _type == "product" &&
        coalesce(language, "en") == $language &&
        status == "published" &&
        coalesce(catalogType, "equipment") == "equipment" &&
        _id != ^._id &&
        series._ref == ^.series._ref
      ] | order(order asc)[0...3]{
        _id, title, "slug": slug.current, sku, "seriesTitle": series->title,
        "seriesSlug": series->slug.current,
        mainImage{ asset, alt }, priceDisplay, price, priceMin, priceMax, currency
      }
    )
  }
`)
