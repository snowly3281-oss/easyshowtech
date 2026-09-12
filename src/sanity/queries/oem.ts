import {defineQuery} from "groq";

export const oemPageQuery = defineQuery(`
  *[
    _type == "oem" &&
    coalesce(language, "en") == $language
  ][0] {
    _id,
    title,
    pageBuilder[] {
      _key,
      _type,
      _type == "heroBlock" => {
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
      _type == "textBlock" => {
        heading,
        body
      },
      _type == "faqsBlock" => {
        heading,
        items[] { _key, question, answer }
      }
    },
    commercialFacts {
      standardMoq,
      toolingFrom,
      flexibleMoq,
      leadTime,
      activeClients,
      toolingQuote,
      ndaTerm,
      brandedSpringColour,
      certificationScope,
      dedicatedLines,
      operatorNdas,
      toolingEscrow,
      patentFilingHelp,
      nonSupplyCommitment,
      breachRemedy,
      toolingOwnership
    },
    seo {
      metaTitle,
      metaDescription,
      ogImage { asset, alt }
    }
  }
`);
