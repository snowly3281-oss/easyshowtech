// Existing catalogue IDs; editorial reference quantities, not fixed bundles or MOQ.
export const solutionConfigurations: Record<string, { _key: string; title: string; tier: "starter" | "standard" | "large"; environment: "indoor" | "outdoor" | "both"; summary: string; items: { _key: string; productId: string; role: string; quantityLabel: string; quantityNote: string; requirement: string; reason: string; alternativeId: string | null }[] }[]> = {
  "events-trade-shows": [
    {
      "_key": "indoor",
      "title": "Standard indoor",
      "tier": "standard",
      "environment": "indoor",
      "summary": "Illustrative reference configuration; final specification and quantities require a quote.",
      "items": [
        {
          "_key": "0",
          "productId": "product.es-pw-001",
          "role": "Main visual wall",
          "quantityLabel": "1",
          "quantityNote": "Reference quantity only; confirm against venue and budget.",
          "requirement": "required",
          "reason": "Establish the booth\u2019s main visual focus.",
          "alternativeId": null
        },
        {
          "_key": "1",
          "productId": "product.es-sd-001",
          "role": "Information display",
          "quantityLabel": "1\u20132",
          "quantityNote": "Reference quantity only; confirm against venue and budget.",
          "requirement": "recommended",
          "reason": "Present event and product information.",
          "alternativeId": null
        },
        {
          "_key": "2",
          "productId": "product.es-bd-001",
          "role": "Photo background",
          "quantityLabel": "As needed",
          "quantityNote": "Reference quantity only; confirm against venue and budget.",
          "requirement": "optional",
          "reason": "Add a separate photo area when space allows.",
          "alternativeId": null
        }
      ]
    },
    {
      "_key": "outdoor",
      "title": "Standard outdoor",
      "tier": "standard",
      "environment": "outdoor",
      "summary": "Illustrative reference configuration; final specification and quantities require a quote.",
      "items": [
        {
          "_key": "0",
          "productId": "product.es-at-001",
          "role": "Event space",
          "quantityLabel": "1",
          "quantityNote": "Reference quantity only; confirm against venue and budget.",
          "requirement": "recommended",
          "reason": "Discuss a branded gathering point and venue requirements.",
          "alternativeId": "product.es-st-001"
        },
        {
          "_key": "1",
          "productId": "product.es-fs-001",
          "role": "Visibility",
          "quantityLabel": "2+",
          "quantityNote": "Reference quantity only; confirm against venue and budget.",
          "requirement": "recommended",
          "reason": "Help visitors identify the event area.",
          "alternativeId": null
        },
        {
          "_key": "2",
          "productId": "product.es-sd-001",
          "role": "Information display",
          "quantityLabel": "1",
          "quantityNote": "Reference quantity only; confirm against venue and budget.",
          "requirement": "optional",
          "reason": "Add directions and event information.",
          "alternativeId": null
        }
      ]
    }
  ],
  "wedding-party": [
    {
      "_key": "both",
      "title": "Celebration planning example",
      "tier": "standard",
      "environment": "both",
      "summary": "Illustrative reference configuration; final specification and quantities require a quote.",
      "items": [
        {
          "_key": "0",
          "productId": "product.es-bd-001",
          "role": "Photo background",
          "quantityLabel": "1",
          "quantityNote": "Reference quantity only; confirm against venue and budget.",
          "requirement": "recommended",
          "reason": "Create a visual focus for photographs.",
          "alternativeId": null
        },
        {
          "_key": "1",
          "productId": "product.es-sd-001",
          "role": "Welcome display",
          "quantityLabel": "1\u20132",
          "quantityNote": "Reference quantity only; confirm against venue and budget.",
          "requirement": "recommended",
          "reason": "Welcome guests and share directions.",
          "alternativeId": null
        },
        {
          "_key": "2",
          "productId": "product.es-ch-001",
          "role": "Supporting seating",
          "quantityLabel": "As needed",
          "quantityNote": "Reference quantity only; confirm against venue and budget.",
          "requirement": "optional",
          "reason": "Discuss seating for the guest or photo area.",
          "alternativeId": null
        }
      ]
    }
  ],
  "photography-film": [
    {
      "_key": "indoor",
      "title": "Background planning example",
      "tier": "standard",
      "environment": "indoor",
      "summary": "Illustrative reference configuration; final specification and quantities require a quote.",
      "items": [
        {
          "_key": "0",
          "productId": "product.es-bd-001",
          "role": "Main background",
          "quantityLabel": "1+",
          "quantityNote": "Reference quantity only; confirm against venue and budget.",
          "requirement": "recommended",
          "reason": "Plan the background around camera framing.",
          "alternativeId": null
        },
        {
          "_key": "1",
          "productId": "product.es-pw-001",
          "role": "Alternative scene",
          "quantityLabel": "As needed",
          "quantityNote": "Reference quantity only; confirm against venue and budget.",
          "requirement": "optional",
          "reason": "Discuss an additional visual surface.",
          "alternativeId": null
        },
        {
          "_key": "2",
          "productId": "product.es-ch-001",
          "role": "Interview seating",
          "quantityLabel": "As needed",
          "quantityNote": "Reference quantity only; confirm against venue and budget.",
          "requirement": "optional",
          "reason": "Discuss the seating role in the shot.",
          "alternativeId": null
        }
      ]
    }
  ],
  "retail-pop-up-stores": [
    {
      "_key": "both",
      "title": "Retail planning example",
      "tier": "standard",
      "environment": "both",
      "summary": "Illustrative reference configuration; final specification and quantities require a quote.",
      "items": [
        {
          "_key": "0",
          "productId": "product.es-pw-001",
          "role": "Brand wall",
          "quantityLabel": "1",
          "quantityNote": "Reference quantity only; confirm against venue and budget.",
          "requirement": "recommended",
          "reason": "Define the visual identity of the temporary space.",
          "alternativeId": null
        },
        {
          "_key": "1",
          "productId": "product.es-sd-001",
          "role": "Promotional information",
          "quantityLabel": "1\u20132",
          "quantityNote": "Reference quantity only; confirm against venue and budget.",
          "requirement": "recommended",
          "reason": "Present product and campaign information.",
          "alternativeId": null
        },
        {
          "_key": "2",
          "productId": "product.es-fs-001",
          "role": "Entrance visibility",
          "quantityLabel": "As needed",
          "quantityNote": "Reference quantity only; confirm against venue and budget.",
          "requirement": "optional",
          "reason": "Discuss outdoor wayfinding where permitted.",
          "alternativeId": null
        }
      ]
    }
  ],
  "religious-community": [
    {
      "_key": "both",
      "title": "Community planning example",
      "tier": "standard",
      "environment": "both",
      "summary": "Illustrative reference configuration; final specification and quantities require a quote.",
      "items": [
        {
          "_key": "0",
          "productId": "product.es-at-001",
          "role": "Gathering area",
          "quantityLabel": "As needed",
          "quantityNote": "Reference quantity only; confirm against venue and budget.",
          "requirement": "optional",
          "reason": "Discuss the outdoor gathering space and venue rules.",
          "alternativeId": "product.es-st-001"
        },
        {
          "_key": "1",
          "productId": "product.es-fs-001",
          "role": "Wayfinding",
          "quantityLabel": "1\u20132",
          "quantityNote": "Reference quantity only; confirm against venue and budget.",
          "requirement": "recommended",
          "reason": "Help visitors identify entrances.",
          "alternativeId": null
        },
        {
          "_key": "2",
          "productId": "product.es-sd-001",
          "role": "Event information",
          "quantityLabel": "1+",
          "quantityNote": "Reference quantity only; confirm against venue and budget.",
          "requirement": "recommended",
          "reason": "Communicate the event schedule and directions.",
          "alternativeId": null
        }
      ]
    }
  ],
  "education-training": [
    {
      "_key": "both",
      "title": "Education planning example",
      "tier": "standard",
      "environment": "both",
      "summary": "Illustrative reference configuration; final specification and quantities require a quote.",
      "items": [
        {
          "_key": "0",
          "productId": "product.es-bd-001",
          "role": "Presentation background",
          "quantityLabel": "1",
          "quantityNote": "Reference quantity only; confirm against venue and budget.",
          "requirement": "recommended",
          "reason": "Frame the presentation area.",
          "alternativeId": null
        },
        {
          "_key": "1",
          "productId": "product.es-sd-001",
          "role": "Registration and information",
          "quantityLabel": "1\u20132",
          "quantityNote": "Reference quantity only; confirm against venue and budget.",
          "requirement": "recommended",
          "reason": "Guide visitors to registration and sessions.",
          "alternativeId": null
        },
        {
          "_key": "2",
          "productId": "product.es-fs-001",
          "role": "Outdoor wayfinding",
          "quantityLabel": "As needed",
          "quantityNote": "Reference quantity only; confirm against venue and budget.",
          "requirement": "optional",
          "reason": "Discuss signs for outdoor open days.",
          "alternativeId": null
        }
      ]
    }
  ]
}
