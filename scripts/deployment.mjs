import {pathToFileURL} from 'node:url'

export const solutionSlugs = [
  'wedding-party', 'events-trade-shows', 'photography-film',
  'retail-pop-up-stores', 'religious-community', 'education-training',
]

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const defaultFetch = (url, options = {}) => fetch(url, {...options, signal: AbortSignal.timeout(20_000)})

export async function verifyIndexability({origin, fetchFn = defaultFetch}) {
  const read = async path => {
    const response = await fetchFn(new URL(path, origin))
    if (!response.ok) throw new Error(`Indexing check failed: ${path} HTTP ${response.status}`)
    if (/noindex|none/i.test(response.headers?.get('x-robots-tag') ?? '')) throw new Error(`Indexing blocked by X-Robots-Tag: ${path}`)
    return response.text()
  }
  const robots = await read('/robots.txt')
  if (/^Disallow:\s*\/\s*$/im.test(robots)) throw new Error('robots.txt blocks the entire site')
  if (!robots.includes(`Sitemap: ${origin.origin}/sitemap-index.xml`)) throw new Error('robots.txt must advertise the production sitemap')
  const html = await read('/')
  if (/<meta\b[^>]*name=["'](?:robots|googlebot)["'][^>]*content=["'][^"']*(?:noindex|none)/i.test(html)) throw new Error('Homepage contains a noindex meta tag')
  if (!html.includes(`rel="canonical" href="${origin.origin}/"`)) throw new Error('Homepage canonical does not use the production domain')
  const index = await read('/sitemap-index.xml')
  const maps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]))
  if (!maps.length || maps.some(url => url.origin !== origin.origin)) throw new Error('Sitemap index points outside the production domain')
  for (const map of maps) {
    const xml = await read(map.pathname)
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]))
    if (!urls.length || urls.some(url => url.origin !== origin.origin)) throw new Error('Sitemap contains URLs outside the production domain')
  }
}

export async function verifyDeployment({commit, runId, baseUrl = 'https://easyshowtech.com', attempts = 24, fetchFn = defaultFetch, sleep = delay, log = console.log}) {
  if (!/^[a-f0-9]{40}$/.test(commit ?? '')) throw new Error('Expected a full Git commit SHA.')
  const origin = new URL(baseUrl)
  if (origin.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(origin.hostname)) throw new Error('Deployment checks require HTTPS.')
  let lastError
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const url = new URL('/deployment.json', origin)
      url.search = new URLSearchParams({verify: `${commit}-${runId ?? ''}-${Date.now()}`}).toString()
      const response = await fetchFn(url, {headers: {'Cache-Control': 'no-cache'}})
      if (!response.ok) throw new Error(`Deployment marker returned HTTP ${response.status}`)
      const marker = await response.json()
      if (marker.commit !== commit || (runId && marker.runId !== String(runId))) throw new Error('The domain is still serving a different deployment version.')
      // Check representative public output, not just a successful upload.
      for (const slug of solutionSlugs) {
        const page = await fetchFn(new URL(`/solutions/${slug}?verify=${commit}`, origin))
        if (!page.ok || !(await page.text()).includes('<h1')) throw new Error(`Solution page failed verification: ${slug}`)
      }
      await verifyIndexability({origin, fetchFn})
      log(`Verified ${origin.origin}: ${commit.slice(0, 12)} (${solutionSlugs.length} solution pages).`)
      return marker
    } catch (error) {
      lastError = error
      if (attempt + 1 < attempts) {
        log(`Waiting for the expected production version (${attempt + 1}/${attempts}).`)
        await sleep(10_000)
      }
    }
  }
  throw new Error(`Production verification failed: ${lastError?.message}`)
}

export async function waitForWorkflow({repository, commit, fetchFn = defaultFetch, sleep = delay, log = console.log, attempts = 100}) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository ?? '') || !/^[a-f0-9]{40}$/.test(commit ?? '')) throw new Error('Invalid repository or commit.')
  let lastState = ''
  for (let attempt = 0; attempt < attempts; attempt++) {
    // Recent-run listing avoids delayed indexing by head_sha immediately after a
    // push. A unique request key prevents an empty first result being cached.
    const response = await fetchFn(`https://api.github.com/repos/${repository}/actions/workflows/deploy.yml/runs?per_page=10&poll=${Date.now()}-${attempt}`, {
      headers: {Accept: 'application/vnd.github+json', 'Cache-Control': 'no-cache', 'User-Agent': 'Easyshow-Publisher', ...(process.env.GH_TOKEN ? {Authorization: `Bearer ${process.env.GH_TOKEN}`} : {})},
    })
    if (!response.ok) throw new Error(`Cannot read deployment status (HTTP ${response.status}). Check https://github.com/${repository}/actions`)
    const data = await response.json()
    const run = (data.workflow_runs ?? []).find(entry => entry.head_sha === commit && (!entry.event || entry.event === 'push'))
    const state = run ? `${run.status}:${run.conclusion ?? ''}` : 'waiting for GitHub'
    if (state !== lastState) { log(run ? `${state} — ${run.html_url}` : state); lastState = state }
    if (run?.status === 'completed') {
      if (run.conclusion !== 'success') throw new Error(`Deployment ${run.conclusion}: ${run.html_url}`)
      return run
    }
    await sleep(15_000)
  }
  throw new Error(`Deployment is still pending. Check https://github.com/${repository}/actions`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [command, commit, value] = process.argv.slice(2)
    if (command === 'verify') await verifyDeployment({commit, runId: value})
    else if (command === 'wait') {
      const run = await waitForWorkflow({repository: value, commit})
      await verifyDeployment({commit, runId: run.id})
    } else throw new Error('Usage: node scripts/deployment.mjs verify SHA [RUN_ID] | wait SHA OWNER/REPO')
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}
