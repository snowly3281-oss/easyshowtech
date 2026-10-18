import { createClient } from '@sanity/client'

const c = createClient({
  projectId: process.env.PUBLIC_SANITY_PROJECT_ID || 'w8rk6k6z',
  dataset: process.env.PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-10-01',
  useCdn: true,
  perspective: 'published',
})

const [prods, sols, series, langs] = await Promise.all([
  c.fetch(`
    *[_type == "product" && coalesce(language,"en") == "en" && status == "published"]
      | order(series->order asc, title asc){
        _id, title, "slug": slug.current, sku,
        "seriesTitle": series->title, "seriesSlug": series->slug.current,
        catalogType, printingService,
        "serviceSlugs": serviceTypes[]->slug.current,
        priceDisplay, price, priceMin, priceMax, currency
      }
  `),
  c.fetch(`
    *[_type == "solution" && coalesce(language,"en") == "en"]
      | order(_createdAt asc){
        _id, title, "slug": slug.current, audience, summary, language,
        "hasHero": defined(pageBuilder[_type == "heroBlock"][0]),
        "hasEditorial": defined(pageBuilder[_type == "textBlock"][0]),
        "hasFaq": defined(pageBuilder[_type == "faqsBlock"][0]),
        "hasAssisted": defined(assistedConfiguration.heading),
        "seo": defined(seo.metaTitle),
        "packageCount": length(packages),
        "productRefCount": length(products),
        "packageTiers": packages.tier,
        "packageTitles": packages.title,
        "allVariantPackages": count(packages[defined(seriesVariants)]) == length(packages)
      }
  `),
  c.fetch(`
    *[_type == "series" && coalesce(language,"en") == "en"]
      | order(kind asc, order asc, title asc){
        _id, title, "slug": slug.current, kind, "order": order,
        "productCount": count(*[_type == "product" && coalesce(language,"en") == "en"
                                && status == "published" && references(^._id)])
      }
  `),
  c.fetch(`
    *[_type in ["solution","product","series"] && defined(language)].language
  `),
])

console.log('=== PRODUCTS (en, published) ===')
console.log('count:', prods.length)
for (const p of prods) {
  console.log(
    `- [${p.catalogType}${p.printingService ? ',svc' : ''}] ${p.title} | sku=${p.sku} | series=${p.seriesTitle ?? '—'} (${p.seriesSlug ?? '—'}) | services=${(p.serviceSlugs || []).join(',') || '—'} | price=${p.priceDisplay} ${p.currency ?? ''}`
  )
}

console.log('\n=== SOLUTIONS (en) ===')
console.log('count:', sols.length)
for (const s of sols) {
  const tiers = (s.packageTiers || []).filter(Boolean)
  const flags = [
    s.hasHero ? 'H' : '-',
    s.hasEditorial ? 'E' : '-',
    s.hasFaq ? 'F' : '-',
    s.hasAssisted ? 'A' : '-',
    s.seo ? 'S' : '-',
  ].join('')
  console.log(
    `- ${flags} ${s.title} | slug=${s.slug} | audience=${s.audience ?? '—'} | lang=${s.language} | pkgs=${s.packageCount} [${tiers.join(',')}] | productRefs=${s.productRefCount} | allSeriesVariants=${s.allVariantPackages}`
  )
  if (s.summary) console.log(`     summary: ${s.summary.slice(0, 100)}${s.summary.length > 100 ? '…' : ''}`)
}

console.log('\n=== SERIES (en) ===')
console.log('count:', series.length)
for (const s of series) {
  console.log(`- [${s.kind}] ${s.title} (${s.slug}) | products=${s.productCount}`)
}

console.log('\n=== LANGUAGES IN DATASET ===')
const uniqLangs = [...new Set(langs)]
console.log(uniqLangs)
