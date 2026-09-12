import { defineQuery } from 'groq'

/** Published post slugs — drives getStaticPaths for /resources/[slug]. */
export const postPathsQuery = defineQuery(`
  *[
    _type == "post" &&
    coalesce(language, "en") == $language &&
    defined(slug.current)
  ]{ "slug": slug.current }
`)

/** Localized labels for canonical category/tag references kept on translated posts. */
export const postTaxonomyQuery = defineQuery(`
  {
    "categories": *[
      _type == "postCategory" &&
      coalesce(language, "en") == $language &&
      defined(slug.current)
    ]{ _id, title, "slug": slug.current },
    "tags": *[
      _type == "postTag" &&
      coalesce(language, "en") == $language &&
      defined(slug.current)
    ]{ _id, title, "slug": slug.current }
  }
`)

/** All posts for the /resources listing, newest first. */
export const postListQuery = defineQuery(`
  *[
    _type == "post" &&
    coalesce(language, "en") == $language &&
    defined(slug.current)
  ] | order(publishedAt desc){
    _id, title, "slug": slug.current, excerpt, publishedAt, _updatedAt,
    "readingTime": round(length(pt::text(body)) / 1200),
    "cover": coverImage{ asset, alt },
    featured,
    editorialStatus,
    "author": author->{ _id, name, role },
    "categories": categories[]->{ _id, title, "slug": slug.current }
  }
`)

/** One post by slug for the article page (explicit projection). */
export const postBySlugQuery = defineQuery(`
  *[
    _type == "post" &&
    coalesce(language, "en") == $language &&
    slug.current == $slug
  ][0]{
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    _updatedAt,
    "readingTime": round(length(pt::text(body)) / 1200),
    "cover": coverImage{ asset, alt },
    body[]{
      ...,
      markDefs[]{
        ...,
        _type == "internalLink" => {
          "reference": reference->{
            _type,
            route,
            "slug": slug.current
          }
        }
      },
      _type == "postImageBlock" => {
        image{ asset, alt },
        caption
      },
      _type == "postGalleryBlock" => {
        heading,
        images[]{
          _key,
          image{ asset },
          alt,
          caption
        }
      },
      _type == "postVideoBlock" => {
        source,
        url,
        "fileUrl": file.asset->url,
        caption
      },
      _type == "postProductBlock" => {
        heading,
        body,
        "products": products[]->{
          _id,
          title,
          "slug": slug.current,
          sku,
          summary,
          mainImage{ asset, alt }
        }
      },
      _type == "postSolutionBlock" => {
        heading,
        body,
        "solution": solution->{
          _id,
          title,
          "slug": slug.current,
          summary
        }
      },
      _type == "postDownloadBlock" => {
        title,
        description,
        "fileUrl": file.asset->url,
        buttonLabel
      },
      _type == "postCtaBlock" => {
        heading,
        body,
        primaryCta{
          label,
          external,
          internal->{ _type, route, "slug": slug.current }
        },
        secondaryCta{
          label,
          external,
          internal->{ _type, route, "slug": slug.current }
        }
      }
    },
    audience,
    editorialStatus,
    featured,
    "author": author->{ _id, name, role, portrait{ asset, alt }, bio },
    "categories": categories[]->{ _id, title, "slug": slug.current },
    "tags": tags[]->{ _id, title, "slug": slug.current },
    "solutions": solutions[]->{ _id, title, "slug": slug.current },
    "relatedProducts": relatedProducts[]->{
      _id,
      title,
      "slug": slug.current,
      sku,
      summary,
      mainImage{ asset, alt }
    },
    "relatedPosts": relatedPosts[]->{
      _id,
      title,
      "slug": slug.current,
      excerpt,
      publishedAt,
      _updatedAt,
      "readingTime": round(length(pt::text(body)) / 1200),
      "cover": coverImage{ asset, alt },
      "categories": categories[]->{ _id, title, "slug": slug.current }
    },
    seo{ metaTitle, metaDescription, ogImage{ asset, alt } }
  }
`)
