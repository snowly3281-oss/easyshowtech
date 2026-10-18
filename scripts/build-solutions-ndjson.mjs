// scripts/build-solutions-ndjson.mjs
//
// Re-build scripts/solutions-seed.ndjson from a single source of truth, with
// the two changes the operator asked for:
//
//   1. _id starts with "drafts." — so `sanity datasets import` creates them
//      as draft documents (not published). Operator publishes by hand from
//      Studio after review.
//   2. backgroundImage and ogImage are empty (no image refs). The operator
//      will assign the 26 newly-uploaded assets from inside Studio.
//
// Run:   node scripts/build-solutions-ndjson.mjs
//   (overwrites scripts/solutions-seed.ndjson)

import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, 'solutions-seed.ndjson')

// Mock product _id (the only published product in the dataset right now).
const PRODUCT_ID = 'd6aa907c-4d9e-48c7-a68a-718fb9071de0'

// ── helpers ───────────────────────────────────────────────────────────────
const span = (text, key) => ({ _type: 'span', _key: key, text, marks: [] })
const block = (text, key) => ({
  _type: 'block',
  _key: key,
  style: 'normal',
  markDefs: [],
  children: [span(text, `${key}c`)],
})
const pkgItem = (key, quantity, variantNote) => ({
  _key: key,
  _type: 'solutionPackageItem',
  product: { _ref: PRODUCT_ID, _type: 'reference' },
  quantity,
  unit: 'set',
  variantNote,
  customName: null,
})
const emptyImage = null // operator assigns in Studio
// CTA: external mailto only. Internal `reference` would point to a published
// `solution.<slug>` that does not exist yet (we are importing it as a draft),
// and `sanity datasets import` enforces "reference must resolve" before the
// transaction commits, so a self-referential draft would fail to import.
// Operator can switch the CTA to an internal reference in Studio after
// publish.
const ctaExternal = (label) => ({
  _type: 'ctaLink',
  label,
  external: 'mailto:chris@easyshowtech.com',
})

// ── 6 solutions ───────────────────────────────────────────────────────────
//
// Each solution has:
//   - title  (operator-facing)
//   - slug   (must match src/config/site.ts → solutionsByCustomer)
//   - audience (mock tags)
//   - 3 packages: compact / recommended / expanded (the recommended one
//     matches `tier === 'recommended'` AND `isRecommended === true`,
//     per the front-end sort logic)
//   - pageBuilder: hero + text + faqs (the block types the front-end GROQ
//     actually projects: heroBlock / textBlock / faqsBlock)
//
// All copy and numbers are MOCK — operator overwrites in Studio.
const solutions = [
  {
    slug: 'boutique-studio',
    title: 'Wedding & Party Setup',
    audience: ['wedding', 'party', 'planner', 'venue'],
    summary: '[MOCK] Pre-configured display packages for wedding and party professionals — a faster route from a confirmed guest count to a finished photo-ready venue.',
    configurationIntro: '[MOCK] Review the published equipment list, area envelope and indicative budget. Final room-specific quantities, layout dimensions and freight are confirmed after plan review.',
    assistedHeading: 'Send the floor plan. We will plan the room.',
    assistedBody: '[MOCK] Upload the venue footprint and tell us how the room will operate on the day. We will review backdrop coverage, lighting zones, and the equipment mix, then return a tailored configuration.',
    hero: {
      eyebrow: 'Wedding & Party',
      heading: 'A photo-ready event floor, configured in advance.',
      subheading: '[MOCK] Three display packages built around the most common wedding and party footprints, so the venue walks in pre-staged, branded and ready to photograph.',
      alt: 'Reception venue with branded backdrop and lighting zone',
    },
    text: {
      heading: 'Why package a wedding display floor',
      paragraphs: [
        '[MOCK] A wedding or party floor must read well on camera from every angle. The approved packages balance backdrop coverage, decorative lighting and a layout that does not block the dance floor or the photographer\'s sightline.',
        '[MOCK] Every piece in the package is sourced and finished together, so colour, fabric and printing stay consistent across backdrop, signage and any custom accessory.',
      ],
    },
    faq: {
      heading: 'Questions buyers ask before committing',
      items: [
        ['[MOCK] How quickly can the equipment ship for a confirmed date?',
         '[MOCK] Standard production is typically 4–6 weeks after specification sign-off and deposit. Rush slots are subject to factory capacity and are quoted case by case.'],
        ['[MOCK] Can colours and logos be matched to the wedding palette?',
         '[MOCK] Yes. Sublimated fabric, vinyl prints and coordinated hardware can be matched to your palette. Final colour proofs are issued before production.'],
        ['[MOCK] What if the venue dimensions change after booking?',
         '[MOCK] The configuration is room-specific after plan review. If the venue changes, we re-spec the package at no extra design fee.'],
      ],
    },
    packages: [
      { tier: 'compact', recommended: false, title: 'Compact',
        summary: '[MOCK] For intimate ceremonies and small receptions (≈ up to 80 guests).',
        priceDisplay: 'quote', currency: 'USD', priceUnit: 'equipment package', priceNote: '[MOCK] Indicative. Final after plan review.',
        areaMinSqm: 40, areaMaxSqm: 80, areaMinSqFt: 430, areaMaxSqFt: 860,
        equipMin: 2, equipMax: 3, leadTime: '4–6 weeks',
        items: [['wedding-c1', 1, '[MOCK] Primary backdrop for ceremony wall']] },
      { tier: 'recommended', recommended: true, title: 'Recommended',
        summary: '[MOCK] For mid-size receptions (≈ 80–150 guests) with a stage or focal backdrop.',
        priceDisplay: 'range', priceMin: 2400, priceMax: 3600, currency: 'USD', priceUnit: 'equipment package', priceNote: '[MOCK] Range. Confirm after plan review.',
        areaMinSqm: 80, areaMaxSqm: 150, areaMinSqFt: 860, areaMaxSqFt: 1615,
        equipMin: 3, equipMax: 5, leadTime: '4–6 weeks',
        items: [['wedding-r1', 2, '[MOCK] Main + secondary backdrop']] },
      { tier: 'expanded', recommended: false, title: 'Expanded',
        summary: '[MOCK] For large weddings and ballroom-scale events (≈ 150+ guests) with multiple photo zones.',
        priceDisplay: 'quote', currency: 'USD', priceUnit: 'equipment package', priceNote: '[MOCK] Bespoke quote.',
        areaMinSqm: 150, areaMaxSqm: 400, areaMinSqFt: 1615, areaMaxSqFt: 4305,
        equipMin: 5, equipMax: 9, leadTime: '5–7 weeks',
        items: [['wedding-e1', 3, '[MOCK] Multiple branded zones + accessories']] },
    ],
    seo: {
      focusKeyword: 'wedding display package',
      metaTitle: '[MOCK] Wedding & Party Display Package — EasyShow',
      metaDescription: '[MOCK] Pre-configured display equipment packages for weddings and parties. Branded backdrops, lighting zones and a finished photo-ready floor in one configuration.',
      ogAlt: 'Wedding reception venue with branded backdrop',
    },
  },

  {
    slug: 'franchise',
    title: 'Events & Trade Shows',
    audience: ['exhibitor', 'event manager', 'trade show', 'booth'],
    summary: '[MOCK] Roll-out-ready display packages for trade show booths, road-show vehicles and franchise event teams. A standard equipment spec and a reproducible layout so every activation looks the same on every floor.',
    configurationIntro: '[MOCK] Review the published booth sizes, transport constraints and the standard kit. Final booth-specific quantities, freight options and on-site setup notes are confirmed after plan review.',
    assistedHeading: 'Tell us the show circuit. We will spec the kit.',
    assistedBody: '[MOCK] Share the show calendar, the booth footprint at each stop, and the brand guidelines. We will propose a single transport-friendly kit that fits every venue.',
    hero: {
      eyebrow: 'Events & Trade Shows',
      heading: 'A trade show booth that ships, sets up and looks the same on every floor.',
      subheading: '[MOCK] Three display packages built around common booth footprints, with a standard kit that fits road cases, fly cases and a one-day setup window.',
      alt: 'Trade show booth with branded tension fabric backdrop',
    },
    text: {
      heading: 'Why package a road-show display',
      paragraphs: [
        '[MOCK] A road-show booth has to survive shipping, drayage and a one-day setup window. The approved packages use lightweight frames, soft cases and a footprint that fits a 10×10 or 10×20 booth grid.',
        '[MOCK] Graphics are produced as a single set that swaps between stops, so the brand reads identically at every event in the calendar.',
      ],
    },
    faq: {
      heading: 'Questions buyers ask before committing',
      items: [
        ['[MOCK] Does the kit fit standard IUSA / drayage weight limits?',
         '[MOCK] Yes. The published packages are designed around 10×10 and 10×20 booth grids, with case weights and dimensions confirmed before shipment.'],
        ['[MOCK] Can graphics be swapped between events?',
         '[MOCK] Yes. Graphics are produced as a single set with a consistent finish. Replacement sets are quoted per event.'],
        ['[MOCK] Is on-site setup support available?',
         '[MOCK] On-site support is quoted case by case for the major shows. Standard packages ship with printed setup guides and a video walkthrough.'],
      ],
    },
    packages: [
      { tier: 'compact', recommended: false, title: 'Compact',
        summary: '[MOCK] For 10×10 booths and small pop-up activations.',
        priceDisplay: 'quote', currency: 'USD', priceUnit: 'booth kit', priceNote: '[MOCK] Indicative. Final after show list review.',
        areaMinSqm: 9, areaMaxSqm: 20, areaMinSqFt: 100, areaMaxSqFt: 215,
        equipMin: 1, equipMax: 2, leadTime: '3–5 weeks',
        items: [['events-c1', 1, '[MOCK] Single 10ft backdrop kit + case']] },
      { tier: 'recommended', recommended: true, title: 'Recommended',
        summary: '[MOCK] For 10×20 booths with a meeting area and a feature wall.',
        priceDisplay: 'range', priceMin: 2800, priceMax: 4500, currency: 'USD', priceUnit: 'booth kit', priceNote: '[MOCK] Range. Confirm after show list review.',
        areaMinSqm: 18, areaMaxSqm: 40, areaMinSqFt: 200, areaMaxSqFt: 430,
        equipMin: 2, equipMax: 4, leadTime: '4–6 weeks',
        items: [['events-r1', 2, '[MOCK] Main backdrop + side feature wall']] },
      { tier: 'expanded', recommended: false, title: 'Expanded',
        summary: '[MOCK] For island booths and large-format activations with multiple zones.',
        priceDisplay: 'quote', currency: 'USD', priceUnit: 'booth kit', priceNote: '[MOCK] Bespoke quote.',
        areaMinSqm: 40, areaMaxSqm: 120, areaMinSqFt: 430, areaMaxSqFt: 1290,
        equipMin: 4, equipMax: 8, leadTime: '5–7 weeks',
        items: [['events-e1', 4, '[MOCK] Island kit with 4 backdrop zones + accessories']] },
    ],
    seo: {
      focusKeyword: 'trade show display package',
      metaTitle: '[MOCK] Events & Trade Show Display Package — EasyShow',
      metaDescription: '[MOCK] Standardised display equipment packages for trade shows, road-shows and franchise events. One kit, one look, every floor.',
      ogAlt: 'Trade show booth with branded backdrop',
    },
  },

  {
    slug: 'rehab-clinic',
    title: 'Photography & Film',
    audience: ['photographer', 'filmmaker', 'studio', 'production house'],
    summary: '[MOCK] Studio-grade display packages for photographers, filmmakers and content studios. Approved backdrop sizes, lighting zones and equipment that survives shipping between locations.',
    configurationIntro: '[MOCK] Review the published studio sizes, lighting plans and the standard kit. Final room-specific quantities, freight options and storage recommendations are confirmed after plan review.',
    assistedHeading: 'Send the studio brief. We will spec the room.',
    assistedBody: '[MOCK] Upload the studio plan and tell us about the camera work, the lighting plan and any recurring sets. We will propose a kit that matches the actual workflow.',
    hero: {
      eyebrow: 'Photography & Film',
      heading: 'A studio-ready backdrop wall, configured for the camera work.',
      subheading: '[MOCK] Three display packages built around the most common studio footprints, with backdrops, lighting support and a layout that protects the sightline.',
      alt: 'Photo studio with tension fabric backdrop and lighting',
    },
    text: {
      heading: 'Why package a studio display wall',
      paragraphs: [
        '[MOCK] A working studio wall has to hold colour consistency, hold lighting and survive repeated setup. The approved packages use frames that stay square and fabrics that wash clean.',
        '[MOCK] Every backdrop size in the package is matched to the most common camera formats, so the look is reproducible from one set to the next.',
      ],
    },
    faq: {
      heading: 'Questions buyers ask before committing',
      items: [
        ['[MOCK] Do the fabrics hold colour under continuous lighting?',
         '[MOCK] Yes. The published fabrics are tested for hot and LED continuous lighting. A colour swatch is shipped with every package for on-set reference.'],
        ['[MOCK] Can the kit be split across multiple studios?',
         '[MOCK] Yes. The kit is modular. Standard quantities are quoted per studio footprint and can be redistributed.'],
        ['[MOCK] Is a printed setup guide included?',
         '[MOCK] Yes. Each package ships with a printed setup guide and a calibration checklist for the camera team.'],
      ],
    },
    packages: [
      { tier: 'compact', recommended: false, title: 'Compact',
        summary: '[MOCK] For headshot and small product studios.',
        priceDisplay: 'quote', currency: 'USD', priceUnit: 'studio kit', priceNote: '[MOCK] Indicative. Final after plan review.',
        areaMinSqm: 12, areaMaxSqm: 25, areaMinSqFt: 130, areaMaxSqFt: 270,
        equipMin: 1, equipMax: 2, leadTime: '3–5 weeks',
        items: [['photo-c1', 1, '[MOCK] 8×8 backdrop for headshot work']] },
      { tier: 'recommended', recommended: true, title: 'Recommended',
        summary: '[MOCK] For editorial and small commercial studios.',
        priceDisplay: 'range', priceMin: 2200, priceMax: 3400, currency: 'USD', priceUnit: 'studio kit', priceNote: '[MOCK] Range. Confirm after plan review.',
        areaMinSqm: 25, areaMaxSqm: 60, areaMinSqFt: 270, areaMaxSqFt: 645,
        equipMin: 2, equipMax: 4, leadTime: '4–6 weeks',
        items: [['photo-r1', 2, '[MOCK] 10×10 main + 8×8 secondary']] },
      { tier: 'expanded', recommended: false, title: 'Expanded',
        summary: '[MOCK] For full-scale commercial studios and film sets.',
        priceDisplay: 'quote', currency: 'USD', priceUnit: 'studio kit', priceNote: '[MOCK] Bespoke quote.',
        areaMinSqm: 60, areaMaxSqm: 200, areaMinSqFt: 645, areaMaxSqFt: 2150,
        equipMin: 4, equipMax: 9, leadTime: '5–7 weeks',
        items: [['photo-e1', 4, '[MOCK] Multiple backdrop zones + lighting support']] },
    ],
    seo: {
      focusKeyword: 'photography studio display',
      metaTitle: '[MOCK] Photography & Film Display Package — EasyShow',
      metaDescription: '[MOCK] Studio-grade display packages for photographers, filmmakers and content studios. Approved backdrops, lighting zones and reproducible looks.',
      ogAlt: 'Photo studio with branded backdrop',
    },
  },

  {
    slug: 'hotel-spa',
    title: 'Retail & Pop-Up Stores',
    audience: ['retailer', 'pop-up store', 'brand activation', 'mall'],
    summary: '[MOCK] Pre-configured display packages for retail stores, pop-up activations and brand experiences. A standard kit that fits a 30–200 ㎡ footprint and rolls out across multiple locations.',
    configurationIntro: '[MOCK] Review the published footprint, the merchandising zones and the standard kit. Final store-specific quantities, brand-matched finishes and freight are confirmed after plan review.',
    assistedHeading: 'Send the store plan. We will plan the floor.',
    assistedBody: '[MOCK] Upload the store footprint and tell us about the merchandising zones, the customer journey and the brand guidelines. We will propose a kit that matches the customer flow.',
    hero: {
      eyebrow: 'Retail & Pop-Up Stores',
      heading: 'A retail floor that reads the same in every location.',
      subheading: '[MOCK] Three display packages built around the most common retail footprints, with a standard kit that fits store-within-a-store, pop-up and full-store rollouts.',
      alt: 'Retail store with branded display wall',
    },
    text: {
      heading: 'Why package a retail display floor',
      paragraphs: [
        '[MOCK] A retail display floor has to read well from the doorway, hold the brand across multiple locations and survive constant customer contact. The approved packages use frames that hold square and fabrics that wipe clean.',
        '[MOCK] Every piece in the package is sized to the customer journey, so the merchandising zones stay legible at every location in the rollout.',
      ],
    },
    faq: {
      heading: 'Questions buyers ask before committing',
      items: [
        ['[MOCK] Can the kit be standardised across multiple stores?',
         '[MOCK] Yes. A master kit is built once and rolled out per location, with per-store quantities confirmed after plan review.'],
        ['[MOCK] How are brand finishes matched to the existing store?',
         '[MOCK] Brand-matched finishes, fabrics and printing are quoted from your brand guidelines. A sample set is produced before the rollout.'],
        ['[MOCK] Is installation support available?',
         '[MOCK] Installation guides and remote support are standard. On-site installation is quoted per location.'],
      ],
    },
    packages: [
      { tier: 'compact', recommended: false, title: 'Compact',
        summary: '[MOCK] For pop-up stores and small retail activations.',
        priceDisplay: 'quote', currency: 'USD', priceUnit: 'store kit', priceNote: '[MOCK] Indicative. Final after plan review.',
        areaMinSqm: 30, areaMaxSqm: 60, areaMinSqFt: 325, areaMaxSqFt: 645,
        equipMin: 2, equipMax: 3, leadTime: '4–6 weeks',
        items: [['retail-c1', 1, '[MOCK] Feature wall for pop-up']] },
      { tier: 'recommended', recommended: true, title: 'Recommended',
        summary: '[MOCK] For full retail stores with multiple merchandising zones.',
        priceDisplay: 'range', priceMin: 3200, priceMax: 5200, currency: 'USD', priceUnit: 'store kit', priceNote: '[MOCK] Range. Confirm after plan review.',
        areaMinSqm: 60, areaMaxSqm: 150, areaMinSqFt: 645, areaMaxSqFt: 1615,
        equipMin: 3, equipMax: 6, leadTime: '4–6 weeks',
        items: [['retail-r1', 3, '[MOCK] Window + feature wall + secondary zone']] },
      { tier: 'expanded', recommended: false, title: 'Expanded',
        summary: '[MOCK] For flagship stores and multi-zone retail rollouts.',
        priceDisplay: 'quote', currency: 'USD', priceUnit: 'store kit', priceNote: '[MOCK] Bespoke quote.',
        areaMinSqm: 150, areaMaxSqm: 400, areaMinSqFt: 1615, areaMaxSqFt: 4305,
        equipMin: 6, equipMax: 12, leadTime: '5–8 weeks',
        items: [['retail-e1', 5, '[MOCK] Full flagship roll-out']] },
    ],
    seo: {
      focusKeyword: 'retail display package',
      metaTitle: '[MOCK] Retail & Pop-Up Display Package — EasyShow',
      metaDescription: '[MOCK] Pre-configured display packages for retail stores and pop-up activations. Standardised kit, brand-matched finishes and a multi-location rollout.',
      ogAlt: 'Retail store with branded display wall',
    },
  },

  {
    slug: 'home-pt',
    title: 'Religious & Community',
    audience: ['church', 'community center', 'faith group', 'non-profit'],
    summary: '[MOCK] Reusable display packages for religious venues, community centres and non-profit groups. A standard kit that fits a multi-purpose hall and rolls across events.',
    configurationIntro: '[MOCK] Review the published hall sizes, the typical event types and the standard kit. Final event-specific quantities, finishes and freight are confirmed after plan review.',
    assistedHeading: 'Tell us about the space. We will spec the room.',
    assistedBody: '[MOCK] Share the hall footprint, the typical events and any recurring campaigns. We will propose a kit that fits the multi-purpose room and the volunteer setup time.',
    hero: {
      eyebrow: 'Religious & Community',
      heading: 'A multi-purpose display kit, ready for every event.',
      subheading: '[MOCK] Three display packages built around the most common community footprints, with a standard kit that fits a multi-purpose hall, a small chapel and a large gathering.',
      alt: 'Community hall with branded backdrop and multi-purpose layout',
    },
    text: {
      heading: 'Why package a multi-purpose display kit',
      paragraphs: [
        '[MOCK] A community or faith venue hosts many different events in the same space. The approved packages use frames that set up fast and fabrics that swap between campaigns.',
        '[MOCK] Graphics are produced as a single set that can be rotated, so the same kit supports every event in the calendar.',
      ],
    },
    faq: {
      heading: 'Questions buyers ask before committing',
      items: [
        ['[MOCK] Can the kit be set up by volunteers?',
         '[MOCK] Yes. The kit ships with a printed setup guide and a short walkthrough video, designed to be set up by a small volunteer team in under an hour.'],
        ['[MOCK] Can graphics be rotated between events?',
         '[MOCK] Yes. A reusable fabric system is standard, with replacement prints quoted per campaign.'],
        ['[MOCK] Is a storage case included?',
         '[MOCK] A wheeled storage case is included in the recommended and expanded packages.'],
      ],
    },
    packages: [
      { tier: 'compact', recommended: false, title: 'Compact',
        summary: '[MOCK] For small chapels and meeting rooms.',
        priceDisplay: 'quote', currency: 'USD', priceUnit: 'kit', priceNote: '[MOCK] Indicative. Final after plan review.',
        areaMinSqm: 25, areaMaxSqm: 60, areaMinSqFt: 270, areaMaxSqFt: 645,
        equipMin: 1, equipMax: 2, leadTime: '3–5 weeks',
        items: [['community-c1', 1, '[MOCK] 8×8 backdrop for small chapel']] },
      { tier: 'recommended', recommended: true, title: 'Recommended',
        summary: '[MOCK] For multi-purpose halls with regular events.',
        priceDisplay: 'range', priceMin: 2000, priceMax: 3200, currency: 'USD', priceUnit: 'kit', priceNote: '[MOCK] Range. Confirm after plan review.',
        areaMinSqm: 60, areaMaxSqm: 180, areaMinSqFt: 645, areaMaxSqFt: 1940,
        equipMin: 2, equipMax: 4, leadTime: '4–6 weeks',
        items: [['community-r1', 2, '[MOCK] Main + side backdrop with rotating graphics']] },
      { tier: 'expanded', recommended: false, title: 'Expanded',
        summary: '[MOCK] For large gathering halls and recurring event calendars.',
        priceDisplay: 'quote', currency: 'USD', priceUnit: 'kit', priceNote: '[MOCK] Bespoke quote.',
        areaMinSqm: 180, areaMaxSqm: 500, areaMinSqFt: 1940, areaMaxSqFt: 5380,
        equipMin: 4, equipMax: 8, leadTime: '5–7 weeks',
        items: [['community-e1', 4, '[MOCK] Multi-zone kit with rotating graphics set']] },
    ],
    seo: {
      focusKeyword: 'community display kit',
      metaTitle: '[MOCK] Religious & Community Display Kit — EasyShow',
      metaDescription: '[MOCK] Reusable display packages for religious venues, community centres and non-profits. A standard kit that supports every event in the calendar.',
      ogAlt: 'Community hall with branded backdrop',
    },
  },

  {
    slug: 'training-academy',
    title: 'Education & Training',
    audience: ['school', 'training center', 'educator', 'corporate L&D'],
    summary: '[MOCK] Display packages for schools, training centres and corporate learning environments. A standard kit that fits a classroom footprint and supports recurring cohorts.',
    configurationIntro: '[MOCK] Review the published classroom sizes, the typical cohort sizes and the standard kit. Final room-specific quantities, finishes and freight are confirmed after plan review.',
    assistedHeading: 'Send the classroom plan. We will spec the room.',
    assistedBody: '[MOCK] Upload the classroom footprint and tell us about the cohort sizes, the teaching style and the brand guidelines. We will propose a kit that supports the daily schedule.',
    hero: {
      eyebrow: 'Education & Training',
      heading: 'A classroom display kit, ready for every cohort.',
      subheading: '[MOCK] Three display packages built around the most common classroom and training footprints, with a standard kit that fits a small seminar, a full classroom and a multi-room training centre.',
      alt: 'Classroom with branded backdrop and training layout',
    },
    text: {
      heading: 'Why package a classroom display kit',
      paragraphs: [
        '[MOCK] A classroom display kit has to support daily cohorts, repeated setup and a wide range of teaching styles. The approved packages use frames that hold square and fabrics that wipe clean.',
        '[MOCK] Every piece in the package is sized to the cohort, so the room reads well from every seat and from the camera at the back of the room.',
      ],
    },
    faq: {
      heading: 'Questions buyers ask before committing',
      items: [
        ['[MOCK] Can the kit be shared across multiple classrooms?',
         '[MOCK] Yes. The kit is modular. A master kit can be distributed across multiple rooms with per-room quantities confirmed after plan review.'],
        ['[MOCK] Is a camera-ready setup included?',
         '[MOCK] Yes. The published packages are designed to read well on a standard classroom camera, with a recommended zone for the back-of-room shot.'],
        ['[MOCK] Can the brand be matched to the institution?',
         '[MOCK] Yes. Brand-matched finishes and printing are quoted from your brand guidelines. A sample set is produced before the rollout.'],
      ],
    },
    packages: [
      { tier: 'compact', recommended: false, title: 'Compact',
        summary: '[MOCK] For small seminar rooms and breakout spaces.',
        priceDisplay: 'quote', currency: 'USD', priceUnit: 'room kit', priceNote: '[MOCK] Indicative. Final after plan review.',
        areaMinSqm: 15, areaMaxSqm: 35, areaMinSqFt: 160, areaMaxSqFt: 375,
        equipMin: 1, equipMax: 2, leadTime: '3–5 weeks',
        items: [['edu-c1', 1, '[MOCK] 8×8 backdrop for small seminar']] },
      { tier: 'recommended', recommended: true, title: 'Recommended',
        summary: '[MOCK] For full classrooms with daily cohorts.',
        priceDisplay: 'range', priceMin: 1800, priceMax: 3000, currency: 'USD', priceUnit: 'room kit', priceNote: '[MOCK] Range. Confirm after plan review.',
        areaMinSqm: 35, areaMaxSqm: 90, areaMinSqFt: 375, areaMaxSqFt: 970,
        equipMin: 2, equipMax: 4, leadTime: '4–6 weeks',
        items: [['edu-r1', 2, '[MOCK] Front backdrop + side zone']] },
      { tier: 'expanded', recommended: false, title: 'Expanded',
        summary: '[MOCK] For multi-room training centres and corporate campuses.',
        priceDisplay: 'quote', currency: 'USD', priceUnit: 'campus kit', priceNote: '[MOCK] Bespoke quote.',
        areaMinSqm: 90, areaMaxSqm: 400, areaMinSqFt: 970, areaMaxSqFt: 4305,
        equipMin: 4, equipMax: 10, leadTime: '5–8 weeks',
        items: [['edu-e1', 5, '[MOCK] Multi-room kit with shared brand set']] },
    ],
    seo: {
      focusKeyword: 'education display kit',
      metaTitle: '[MOCK] Education & Training Display Kit — EasyShow',
      metaDescription: '[MOCK] Display packages for schools, training centres and corporate learning environments. A standard kit that supports every cohort.',
      ogAlt: 'Classroom with branded backdrop',
    },
  },
]

// ── assemble final docs ───────────────────────────────────────────────────
const docs = solutions.map((s) => ({
  _id: `drafts.solution.${s.slug}`,
  _type: 'solution',
  language: 'en',
  translationStatus: 'needsReview',
  title: s.title,
  slug: { _type: 'slug', current: s.slug },
  audience: s.audience,
  summary: s.summary,
  configurationIntro: s.configurationIntro,
  assistedConfiguration: { heading: s.assistedHeading, body: s.assistedBody },
  pageBuilder: [
    {
      _key: 'hero1',
      _type: 'heroBlock',
      eyebrow: s.hero.eyebrow,
      heading: s.hero.heading,
      subheading: s.hero.subheading,
      backgroundImage: emptyImage,
      cta: ctaExternal('Request a configuration'),
    },
    {
      _key: 'text1',
      _type: 'textBlock',
      heading: s.text.heading,
      body: s.text.paragraphs.map((p, i) => block(p, `p${i + 1}`)),
    },
    {
      _key: 'faq1',
      _type: 'faqsBlock',
      heading: s.faq.heading,
      items: s.faq.items.map(([q, a], i) => ({
        _type: 'faqItem',
        _key: `f${i + 1}`,
        question: q,
        answer: a,
      })),
    },
  ],
  packages: s.packages.map((p, pi) => ({
    _key: `pkg-${s.slug}-${p.tier}`,
    _type: 'solutionPackage',
    title: p.title,
    tier: p.tier,
    isRecommended: p.recommended,
    summary: p.summary,
    priceDisplay: p.priceDisplay,
    price: p.priceMin ?? null,
    priceMin: p.priceMin ?? null,
    priceMax: p.priceMax ?? null,
    currency: p.currency,
    priceUnit: p.priceUnit,
    priceNote: p.priceNote,
    areaMinSqm: p.areaMinSqm,
    areaMaxSqm: p.areaMaxSqm,
    areaMinSqFt: p.areaMinSqFt,
    areaMaxSqFt: p.areaMaxSqFt,
    equipmentTotalMin: p.equipMin,
    equipmentTotalMax: p.equipMax,
    leadTime: p.leadTime,
    showItemQuantities: true,
    layoutImage: null,
    seriesVariants: [],
    items: p.items.map(([k, qty, note]) => pkgItem(k, qty, note)),
  })),
  products: [{ _key: 'p1', _ref: PRODUCT_ID, _type: 'reference' }],
  seo: {
    _type: 'seo',
    focusKeyword: s.seo.focusKeyword,
    metaTitle: s.seo.metaTitle,
    metaDescription: s.seo.metaDescription,
    ogImage: null,
  },
}))

const ndjson = docs.map((d) => JSON.stringify(d)).join('\n') + '\n'
await writeFile(OUT, ndjson, 'utf8')
console.log(`Wrote ${docs.length} drafts to ${OUT}`)
for (const d of docs) {
  console.log(`  • ${d._id.padEnd(36)} | ${d.title}`)
}
