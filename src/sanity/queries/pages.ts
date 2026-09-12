import {defineQuery} from "groq";

export const sitePageByKeyQuery = defineQuery(`
  *[
    _type == "sitePage" &&
    pageKey == $pageKey &&
    coalesce(language, "en") == $language
  ][0] {
    _id,
    pageKey,
    route,
    title,
    navigationLabel,
    introduction,
    effectiveDate,
    hero {
      eyebrow,
      heading,
      subheading,
      backgroundImage { asset, alt },
      cta {
        label,
        external,
        internal-> {
          _type,
          route,
          "slug": slug.current
        }
      }
    },
    sections[] {
      _key,
      _type,
      _type == "textBlock" => {
        heading,
        body
      },
      _type == "ctaBlock" => {
        heading,
        body,
        cta {
          label,
          external,
          internal-> {
            _type,
            route,
            "slug": slug.current
          }
        }
      },
      _type == "faqsBlock" => {
        heading,
        items[] { _key, question, answer }
      }
    },
    aboutFacts {
      yearsManufacturing,
      unitsShipped,
      countriesServed,
      productPatents,
      founderExperience,
      founderFactoryRole,
      founderClientRole,
      factorySize,
      machines,
      productionLines,
      annualCapacity,
      milestones[] {
        _key,
        year,
        title,
        description,
        confirmed
      }
    },
    factoryFacts {
      floorArea,
      teamMembers,
      productionLines,
      manufacturingSteps,
      manufacturingStages[] {
        _key,
        number,
        title,
        description,
        tag,
        image { asset, alt }
      },
      cncTolerance,
      annualCapacity,
      productionTeam,
      totalTeam,
      certifications[],
      dedicatedLines,
      mutualNda,
      nonSupplyCommitment
    },
    legalBody[] {
      ...,
      markDefs[] {
        ...,
        _type == "internalLink" => {
          "reference": reference-> {
            _type,
            route,
            "slug": slug.current
          }
        }
      },
      _type == "postImageBlock" => {
        image { asset, alt },
        caption
      },
      _type == "postGalleryBlock" => {
        heading,
        images[] {
          _key,
          image { asset },
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
      _type == "postDownloadBlock" => {
        title,
        description,
        "fileUrl": file.asset->url,
        buttonLabel
      }
    },
    seo {
      metaTitle,
      metaDescription,
      ogImage { asset, alt }
    }
  }
`);
