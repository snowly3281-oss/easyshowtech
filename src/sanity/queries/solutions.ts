import { defineQuery } from 'groq'

/**
 * All solution slugs — drives getStaticPaths for /solutions/[slug].
 */
export const solutionPathsQuery = defineQuery(`
  *[
    _type == "solution" &&
    coalesce(language, "en") == $language &&
    defined(slug.current)
  ]{ "slug": slug.current }
`)

/**
 * One solution by slug, fully projected (explicit — content-model principle 5,
 * no bare splats into components).
 *
 * The pageBuilder array is expanded per block `_type`; internal CTA links
 * resolve the reference to `{ _type, slug }`; images keep their asset ref + alt
 * so the front end can size them via `urlFor`.
 */
export const solutionBySlugQuery = defineQuery(`
  *[
    _type == "solution" &&
    coalesce(language, "en") == $language &&
    slug.current == $slug
  ][0]{
    _id,
    title,
    "slug": slug.current,
    audience,
    summary,
    configurationIntro,
    assistedConfiguration{
      heading,
      body
    },
    seo{
      metaTitle,
      metaDescription,
      ogImage{ asset, alt }
    },
    pageBuilder[]{
      _key,
      _type,
      _type == "heroBlock" => {
        eyebrow,
        heading,
        subheading,
        backgroundImage{ asset, alt },
        cta{ label, external, internal->{ _type, "slug": slug.current } }
      },
      _type == "ctaBlock" => {
        heading,
        body,
        cta{ label, external, internal->{ _type, "slug": slug.current } }
      },
      _type == "textBlock" => {
        heading,
        body
      },
      _type == "faqsBlock" => {
        heading,
        items[]{ _key, question, answer }
      }
    },
    "products": products[]->{
      _id,
      title,
      "slug": slug.current,
      sku,
      mainImage{ asset, alt },
      priceDisplay,
      price,
      currency
    },
    packages[]{
      _key,
      title,
      tier,
      isRecommended,
      summary,
      areaMinSqm,
      areaMaxSqm,
      areaMinSqFt,
      areaMaxSqFt,
      equipmentTotalMin,
      equipmentTotalMax,
      leadTime,
      priceDisplay,
      price,
      priceMin,
      priceMax,
      currency,
      priceUnit,
      priceNote,
      showItemQuantities,
      layoutImage{ asset, alt },
      seriesVariants[]{
        _key,
        isRecommended,
        "series": series->{
          _id,
          title,
          "slug": slug.current
        },
        items[]{
          _key,
          quantity,
          unit,
          variantNote,
          customName,
          "product": product->{
            _id,
            title,
            "slug": slug.current,
            sku,
            status,
            mainImage{ asset, alt }
          }
        }
      },
      items[]{
        _key,
        quantity,
        unit,
        variantNote,
        customName,
        "product": product->{
          _id,
          title,
          "slug": slug.current,
          sku,
          status,
          mainImage{ asset, alt }
        }
      },
      "productLinks": items[defined(product)]{
        _key,
        "product": product->{
          _id,
          title,
          "slug": slug.current,
          sku,
          status,
          mainImage{ asset, alt }
        }
      }
    }
  }
`)

/**
 * Trusted package payload used by the server after a customer requests a
 * configuration. Exact quantities never need to be embedded in the public
 * solution page.
 */
export const solutionPackageForRequestQuery = defineQuery(`
  *[_type == "solution" && _id == $solutionId][0]{
    _id,
    title,
    "slug": slug.current,
    "package": packages[_key == $packageKey][0]{
      _key,
      title,
      tier,
      isRecommended,
      summary,
      areaMinSqm,
      areaMaxSqm,
      areaMinSqFt,
      areaMaxSqFt,
      equipmentTotalMin,
      equipmentTotalMax,
      leadTime,
      priceDisplay,
      price,
      priceMin,
      priceMax,
      currency,
      priceUnit,
      priceNote,
      showItemQuantities,
      "layoutImageUrl": layoutImage.asset->url,
      "configurationPdfUrl": configurationPdf.asset->url,
      seriesVariants[]{
        _key,
        "series": series->{
          title,
          "slug": slug.current
        },
        items[]{
          _key,
          quantity,
          unit,
          variantNote,
          customName,
          "product": product->{
            _id,
            title,
            "slug": slug.current,
            sku
          }
        }
      },
      items[]{
        _key,
        quantity,
        unit,
        variantNote,
        customName,
        "product": product->{
          _id,
          title,
          "slug": slug.current,
          sku
        }
      }
    }
  }
`)
