// Editorial planning examples, not approved BOMs or manufacturing specifications.
export const solutionScenarios = [
  {
    "title": "Wedding & Party",
    "slug": "wedding-party",
    "legacy": "boutique-studio",
    "intro": "Personalized display planning for weddings, private parties and special celebrations.",
    "needs": [
      "Ceremony backdrop",
      "Photo area",
      "Welcome display",
      "Guest area"
    ],
    "planningProducts": [
      "Backdrops",
      "Sign and Display",
      "Chairs"
    ],
    "together": "Use a backdrop as the visual focus, a welcome display for information and optional seating around the guest area.",
    "aliases": [
      "boutique-studio",
      "event-activation"
    ],
    "documentId": "solution.boutique-studio"
  },
  {
    "title": "Events & Trade Shows",
    "slug": "events-trade-shows",
    "legacy": "franchise",
    "intro": "Plan a coordinated branded display for exhibitions, promotional events and outdoor activations.",
    "needs": [
      "Brand visibility",
      "Booth layout",
      "Visitor reception",
      "Product presentation",
      "Viewing distance",
      "Portable setup"
    ],
    "planningProducts": [
      "Pop Up Walls",
      "Sign and Display",
      "Flags System"
    ],
    "together": "An indoor setup starts with a main visual wall and information displays. For outdoor events, discuss a tent, flags and directional signs together with venue requirements.",
    "aliases": [
      "franchise",
      "trade-show-exhibitor"
    ],
    "documentId": "solution.franchise"
  },
  {
    "title": "Photography & Film",
    "slug": "photography-film",
    "legacy": "rehab-clinic",
    "intro": "Plan visual backgrounds for photo shoots, interviews, video production and creative sets.",
    "needs": [
      "Clean background",
      "Visual surface",
      "Scene changes",
      "Custom artwork"
    ],
    "planningProducts": [
      "Backdrops",
      "Pop Up Walls",
      "Chairs"
    ],
    "together": "Start with the background and camera framing, then discuss supporting displays and seating where needed.",
    "aliases": [
      "rehab-clinic",
      "photography-and-film"
    ],
    "documentId": "solution.rehab-clinic"
  },
  {
    "title": "Retail & Pop-Up Stores",
    "slug": "retail-pop-up-stores",
    "legacy": "hotel-spa",
    "intro": "Coordinate displays for temporary shops, product launches and retail promotions.",
    "needs": [
      "Brand identity",
      "Promotion",
      "Store navigation",
      "Temporary space"
    ],
    "planningProducts": [
      "Pop Up Walls",
      "Sign and Display",
      "Backdrops"
    ],
    "together": "Combine a brand wall with promotional information and directional displays to guide visitors through the space.",
    "aliases": [
      "hotel-spa",
      "retail-pop-up"
    ],
    "documentId": "solution.hotel-spa"
  },
  {
    "title": "Religious & Community",
    "slug": "religious-community",
    "legacy": "home-pt",
    "intro": "Plan welcoming displays for community gatherings, outreach programs and group activities.",
    "needs": [
      "Welcome",
      "Wayfinding",
      "Gathering space",
      "Event information"
    ],
    "planningProducts": [
      "Aluminum Tent",
      "Flags System",
      "Sign and Display"
    ],
    "together": "Coordinate entrance signs, event information and gathering areas. Discuss outdoor structures only where the venue permits them.",
    "aliases": [
      "home-pt",
      "wedding-and-celebration"
    ],
    "documentId": "solution.home-pt"
  },
  {
    "title": "Education & Training",
    "slug": "education-training",
    "legacy": "training-academy",
    "intro": "Plan displays for schools, seminars, workshops, training programs and open days.",
    "needs": [
      "Institution branding",
      "Presentation",
      "Registration",
      "Information display"
    ],
    "planningProducts": [
      "Backdrops",
      "Sign and Display",
      "Pop Up Walls"
    ],
    "together": "Connect a presentation background with registration and information displays; add outdoor wayfinding where appropriate.",
    "aliases": [
      "training-academy",
      "education-and-training"
    ],
    "documentId": "solution.training-academy"
  }
] as const
export const canonicalSolutionSlug = (slug: string) => solutionScenarios.find(s => (s.aliases as readonly string[]).includes(slug))?.slug ?? slug
export const findScenario = (slug: string) => solutionScenarios.find(s => s.slug === canonicalSolutionSlug(slug))
