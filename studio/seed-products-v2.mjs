/**
 * Seed 8 main products for Easyshow independent website
 * Run: node --env-file=studio/.env studio/seed-products-v2.mjs
 */
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'p3d22f8w',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_WRITE_TOKEN,
  apiVersion: '2024-10-01',
  useCdn: false,
})

if (!process.env.SANITY_WRITE_TOKEN) {
  console.error('Missing SANITY_WRITE_TOKEN (studio/.env).')
  process.exit(1)
}

const span = (t, k) => ({ _type: 'span', _key: k, text: t, marks: [] })
const para = (t, k) => ({ _type: 'block', _key: k, style: 'normal', markDefs: [], children: [span(t, `${k}s`)] })

// 8 main products data
const products = [
  {
    _type: 'product',
    _id: 'product-aluminum-backdrop-frame',
    title: '铝合金背景架套装',
    slug: { _type: 'slug', current: 'aluminum-backdrop-frame' },
    sku: 'ES-FRAME-001',
    status: 'published',
    language: 'en',
    summary: [
      para('Lightweight yet sturdy aluminum backdrop frame system for professional photography and events. Quick assembly, portable design.', 'summary')
    ],
    description: [
      para('Our premium aluminum backdrop frame is engineered for versatility and durability. Featuring quick-release clamps and modular design, it sets up in minutes without tools. The powder-coated finish ensures long-lasting performance for both indoor and outdoor events.', 'desc1')
    ],
    keySpecs: [
      { label: 'Material', value: 'High-grade aluminum alloy' },
      { label: 'Max Width', value: '10m / 33ft' },
      { label: 'Max Height', value: '3m / 10ft' },
      { label: 'Weight Capacity', value: '50kg / 110lbs' },
      { label: 'Assembly Time', value: '5-10 minutes' },
    ],
    priceDisplay: '$299 - $599',
    price: 299,
    priceMax: 599,
    currency: 'USD',
    wholesaleTerms: {
      moq: 10,
      priceRange: '$199 - $449',
      leadTime: '7-15 days',
    },
    oemTerms: {
      available: true,
      moq: 50,
      leadTime: '20-30 days',
    },
    order: 1,
  },
  {
    _type: 'product',
    _id: 'product-custom-printed-backdrop',
    title: '定制印刷背景布',
    slug: { _type: 'slug', current: 'custom-printed-backdrop' },
    sku: 'ES-FABRIC-001',
    status: 'published',
    language: 'en',
    summary: [
      para('High-resolution custom printed backdrop fabric. Vibrant colors, wrinkle-resistant, machine washable.', 'summary')
    ],
    description: [
      para('Our custom printed backdrops feature dye-sublimation printing for vivid, long-lasting colors. Made from premium polyester fabric, they are wrinkle-resistant and easy to care for. Perfect for branding, themed events, and professional photography.', 'desc1')
    ],
    keySpecs: [
      { label: 'Material', value: 'Premium polyester fabric' },
      { label: 'Print Method', value: 'Dye-sublimation' },
      { label: 'Resolution', value: '1440 DPI' },
      { label: 'Width', value: 'Up to 5m / 16ft seamless' },
      { label: 'Washable', value: 'Machine washable' },
    ],
    priceDisplay: '$49 - $199',
    price: 49,
    priceMax: 199,
    currency: 'USD',
    wholesaleTerms: {
      moq: 20,
      priceRange: '$29 - $149',
      leadTime: '5-10 days',
    },
    oemTerms: {
      available: true,
      moq: 100,
      leadTime: '15-25 days',
    },
    order: 2,
  },
  {
    _type: 'product',
    _id: 'product-pop-up-display',
    title: '弹出版展示架',
    slug: { _type: 'slug', current: 'pop-up-display' },
    sku: 'ES-POPUP-001',
    status: 'published',
    language: 'en',
    summary: [
      para('Instant pop-up display stand with magnetic rails. Perfect for trade shows, exhibitions, and retail displays.', 'summary')
    ],
    description: [
      para('Our pop-up display stands feature innovative magnetic connecting rails that make set-up effortless. The lightweight aluminum frame combined with high-quality graphic panels creates a stunning visual impact. Available in various sizes to suit any venue.', 'desc1')
    ],
    keySpecs: [
      { label: 'Frame Material', value: 'Aluminum alloy' },
      { label: 'Display Size', value: '3x3m / 10x10ft standard' },
      { label: 'Graphic', value: 'UV-printed tension fabric' },
      { label: 'Setup Time', value: '2-3 minutes' },
      { label: 'Carry Case', value: 'Included wheeled case' },
    ],
    priceDisplay: '$399 - $799',
    price: 399,
    priceMax: 799,
    currency: 'USD',
    wholesaleTerms: {
      moq: 5,
      priceRange: '$299 - $599',
      leadTime: '7-14 days',
    },
    oemTerms: {
      available: true,
      moq: 20,
      leadTime: '20-30 days',
    },
    order: 3,
  },
  {
    _type: 'product',
    _id: 'product-event-tent',
    title: '活动帐篷',
    slug: { _type: 'slug', current: 'event-tent' },
    sku: 'ES-TENT-001',
    status: 'published',
    language: 'en',
    summary: [
      para('Professional event tents for outdoor weddings, corporate events, and community gatherings. Weather-resistant and customizable.', 'summary')
    ],
    description: [
      para('Our commercial-grade event tents are designed to withstand various weather conditions while providing elegant shelter for your events. Features include reinforced seams, UV protection, and optional sidewalls. Perfect for weddings, corporate events, exhibitions, and community festivals.', 'desc1')
    ],
    keySpecs: [
      { label: 'Material', value: 'PVC-coated polyester' },
      { label: 'Waterproof', value: 'Yes, 1000mm water column' },
      { label: 'UV Protection', value: 'UPF 50+' },
      { label: 'Size Range', value: '3x3m to 10x20m' },
      { label: 'Wind Rating', value: 'Up to 50km/h' },
    ],
    priceDisplay: '$599 - $2,499',
    price: 599,
    priceMax: 2499,
    currency: 'USD',
    wholesaleTerms: {
      moq: 5,
      priceRange: '$449 - $1,999',
      leadTime: '10-20 days',
    },
    oemTerms: {
      available: true,
      moq: 20,
      leadTime: '25-35 days',
    },
    order: 4,
  },
  {
    _type: 'product',
    _id: 'product-photo-booth',
    title: '照片 Booth 成品',
    slug: { _type: 'slug', current: 'photo-booth' },
    sku: 'ES-BOOTH-001',
    status: 'published',
    language: 'en',
    summary: [
      para('Complete photo booth solutions for events. Professional lighting, customizable backdrops, instant printing.', 'summary')
    ],
    description: [
      para('Our all-in-one photo booth solutions combine professional lighting, high-quality cameras, and instant printing technology. Available in both enclosure and open-air formats to match any event style. Perfect for weddings, corporate events, and parties.', 'desc1')
    ],
    keySpecs: [
      { label: 'Type', value: 'Enclosure or Open Air' },
      { label: 'Camera', value: 'DSLR quality' },
      { label: 'Lighting', value: 'Professional ring light' },
      { label: 'Print Time', value: '8 seconds' },
      { label: 'Software', value: 'Touch screen control' },
    ],
    priceDisplay: '$1,299 - $2,999',
    price: 1299,
    priceMax: 2999,
    currency: 'USD',
    wholesaleTerms: {
      moq: 3,
      priceRange: '$999 - $2,499',
      leadTime: '14-21 days',
    },
    oemTerms: {
      available: true,
      moq: 10,
      leadTime: '25-35 days',
    },
    order: 5,
  },
  {
    _type: 'product',
    _id: 'product-flower-wall',
    title: '花墙架',
    slug: { _type: 'slug', current: 'flower-wall' },
    sku: 'ES-FLOWER-001',
    status: 'published',
    language: 'en',
    summary: [
      para('Artificial flower wall panels and frames for stunning event backdrops. Reusable, customizable designs.', 'summary')
    ],
    description: [
      para('Create breathtaking backdrops with our artificial flower wall systems. Modules snap together for easy setup, and panels can be customized with your choice of flowers and colors. Perfect for wedding ceremonies, photo zones, and VIP entrances.', 'desc1')
    ],
    keySpecs: [
      { label: 'Panel Size', value: '50x50cm / 20x20in' },
      { label: 'Material', value: 'Silk flowers + metal frame' },
      { label: 'Customization', value: 'Any color/style' },
      { label: 'Reusable', value: 'Yes, 50+ times' },
      { label: 'Installation', value: 'Modular snap-on' },
    ],
    priceDisplay: '$89 - $249',
    price: 89,
    priceMax: 249,
    currency: 'USD',
    wholesaleTerms: {
      moq: 10,
      priceRange: '$59 - $179',
      leadTime: '7-14 days',
    },
    oemTerms: {
      available: true,
      moq: 30,
      leadTime: '15-25 days',
    },
    order: 6,
  },
  {
    _type: 'product',
    _id: 'product-replacement-fabrics',
    title: '配件与替换布',
    slug: { _type: 'slug', current: 'replacement-fabrics' },
    sku: 'ES-ACCESSORY-001',
    status: 'published',
    language: 'en',
    summary: [
      para('Replacement fabrics and accessories for all Easyshow products. Quick delivery, bulk pricing available.', 'summary')
    ],
    description: [
      para('Keep your event equipment in top condition with our replacement fabrics and accessories. We offer matching replacement fabrics for all our backdrop and display products, plus spare parts including buckles, clips, and carrying cases.', 'desc1')
    ],
    keySpecs: [
      { label: 'Fabric Types', value: 'Polyester, Vinyl, Canvas' },
      { label: 'Sizes', value: 'Custom sizing available' },
      { label: 'Printing', value: 'Plain or custom printed' },
      { label: 'Accessories', value: 'Clips, poles, cases' },
      { label: 'Lead Time', value: '3-7 days' },
    ],
    priceDisplay: '$29 - $199',
    price: 29,
    priceMax: 199,
    currency: 'USD',
    wholesaleTerms: {
      moq: 20,
      priceRange: '$19 - $149',
      leadTime: '3-7 days',
    },
    oemTerms: {
      available: true,
      moq: 50,
      leadTime: '10-15 days',
    },
    order: 7,
  },
  {
    _type: 'product',
    _id: 'product-heat-press-printer',
    title: '热转印打印机',
    slug: { _type: 'slug', current: 'heat-press-printer' },
    sku: 'ES-PRINTER-001',
    status: 'published',
    language: 'en',
    summary: [
      para('Professional dye-sublimation printer for custom fabric printing. High resolution, fast output.', 'summary')
    ],
    description: [
      para('Our professional dye-sublimation printer delivers stunning, high-resolution prints on polyester fabrics. Perfect for creating custom backdrops, branded merchandise, and personalized event materials. Fast drying time and vibrant, wash-fast colors.', 'desc1')
    ],
    keySpecs: [
      { label: 'Print Method', value: 'Dye-sublimation' },
      { label: 'Resolution', value: '1440 x 720 DPI' },
      { label: 'Print Width', value: 'Up to 1.6m / 63in' },
      { label: 'Speed', value: '15 sqm/hr' },
      { label: 'Ink Type', value: 'Sublimation ink sets' },
    ],
    priceDisplay: '$2,499 - $4,999',
    price: 2499,
    priceMax: 4999,
    currency: 'USD',
    wholesaleTerms: {
      moq: 2,
      priceRange: '$1,999 - $3,999',
      leadTime: '14-21 days',
    },
    oemTerms: {
      available: true,
      moq: 5,
      leadTime: '20-30 days',
    },
    order: 8,
  },
]

async function seedProducts() {
  console.log('Seeding 8 main products...')
  
  for (const product of products) {
    try {
      const result = await client.createOrReplace(product)
      console.log(`✓ Created/updated: ${product.title}`)
    } catch (err) {
      console.error(`✗ Failed: ${product.title}`, err.message)
    }
  }
  
  console.log('\n✅ Products seeding complete!')
}

seedProducts().catch(console.error)
