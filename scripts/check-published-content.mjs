import {createClient} from '@sanity/client'

try { process.loadEnvFile() } catch (error) { if (error.code !== 'ENOENT') throw error }

try {
  if (process.env.CI && !process.env.SANITY_READ_TOKEN) throw new Error('Configure the SANITY_READ_TOKEN GitHub Actions secret before publishing.')
  const client = createClient({
    projectId: process.env.PUBLIC_SANITY_PROJECT_ID || 'w8rk6k6z',
    dataset: process.env.PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-10-01', useCdn: false, perspective: 'published',
    token: process.env.SANITY_READ_TOKEN || undefined,
    timeout: 20_000, maxRetries: 1,
  })
  const counts = await client.fetch(`{
    "products": count(*[_type == "product" && isActive == true && coalesce(language, "en") == "en"]),
    "solutions": count(*[_type == "solution" && coalesce(language, "en") == "en"]),
    "services": count(*[_type == "service" && isActive == true && coalesce(language, "en") == "en"])
  }`)
  if (Object.values(counts).some(count => count < 1)) throw new Error('Published catalogue is empty or inaccessible. Configure the server-side SANITY_READ_TOKEN; do not deploy empty output.')
  console.log(`Published content accessible: ${counts.products} products, ${counts.solutions} solutions, ${counts.services} services.`)
} catch (error) {
  // Never dump request objects: they can contain authorization headers.
  console.error(`::error title=Published Sanity content::Content check failed: ${error.message}`)
  process.exitCode = 1
}
