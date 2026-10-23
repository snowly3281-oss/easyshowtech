import {legacyRedirects, legacyRedirect} from '../src/data/legacyRedirects.ts'
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {verifyDeployment, waitForWorkflow, solutionSlugs, verifyIndexability, verifyLegacyRedirects} from './deployment.mjs'
import {isReleasePath, createReleasePlan} from './release-plan.mjs'

const sha = 'a'.repeat(40)
const quiet = {sleep: async () => {}, log: () => {}}
const publicPage = url => {
  const path = new URL(url).pathname
  const destination = legacyRedirect(path)
  if (destination) return {status: 301, headers: new Headers({location: new URL(destination, url).href})}
  const body = path === '/robots.txt' ? 'User-agent: *\nAllow: /\nSitemap: https://easyshowtech.com/sitemap-index.xml' :
    path === '/' ? '<h1>Home</h1><link rel="canonical" href="https://easyshowtech.com/">' :
    path === '/sitemap-index.xml' ? '<loc>https://easyshowtech.com/sitemap-0.xml</loc>' :
    path === '/sitemap-0.xml' ? '<loc>https://easyshowtech.com/</loc>' : '<h1>Solution</h1>'
  return {ok: true, headers: new Headers(), text: async () => body}
}
const marker = (commit = sha, runId = '42') => ({ok: true, json: async () => ({commit, runId})})
test('new website files are included while credentials and unrelated changes are excluded', () => {
  const plan = createReleasePlan({changed: ['src/pages/index.astro', 'dev.log', 'agent-debug.html'], untracked: ['src/data/new.ts', '.env', 'MEMORY.md', 'public/key.pem', 'studio/.env.production']})
  assert.deepEqual(plan.selected, ['src/data/new.ts', 'src/pages/index.astro'])
  assert.equal(plan.excluded.length, 6)
  assert.equal(isReleasePath('studio/schemaTypes/solution.ts'), true)
  assert.equal(isReleasePath('.github/workflows/deploy.yml'), true)
})
test('pre-staged unrelated files block publishing instead of being bundled into it', () => {
  assert.deepEqual(createReleasePlan({staged: ['MEMORY.md', 'src/pages/index.astro']}).stagedOutside, ['MEMORY.md'])
})
test('accepts only the intended commit and run, then checks all solution pages', async () => {
  const requests = []
  await verifyDeployment({commit: sha, runId: '42', ...quiet, fetchFn: async url => {
    requests.push(String(url)); return String(url).includes('deployment.json') ? marker() : publicPage(url)
  }})
  assert.equal(requests.length, solutionSlugs.length + 5 + Object.keys(legacyRedirects).length * 2)
})
test('does not accept an older successful deployment', async () => {
  await assert.rejects(verifyDeployment({commit: sha, attempts: 1, ...quiet, fetchFn: async () => marker('b'.repeat(40))}), /different deployment/)
})
test('same commit from a different content rebuild does not pass', async () => {
  await assert.rejects(verifyDeployment({commit: sha, runId: '99', attempts: 1, ...quiet, fetchFn: async () => marker()}), /different deployment/)
})
test('a missing solution page fails release verification', async () => {
  await assert.rejects(verifyDeployment({commit: sha, attempts: 1, ...quiet, fetchFn: async url => String(url).includes('deployment.json') ? marker() : {ok: false}}), /Solution page failed/)
})
test('retries propagation and eventually verifies', async () => {
  let count = 0
  await verifyDeployment({commit: sha, attempts: 2, ...quiet, fetchFn: async url => String(url).includes('deployment.json') ? marker(++count === 1 ? 'b'.repeat(40) : sha) : publicPage(url)})
  assert.equal(count, 2)
})
test('rejects invalid commit before making any requests', async () => {
  await assert.rejects(verifyDeployment({commit: 'main', ...quiet}), /full Git commit/)
})
test('workflow failure is reported instead of being treated as success', async () => {
  await assert.rejects(waitForWorkflow({repository: 'owner/repo', commit: sha, ...quiet, fetchFn: async () => ({ok: true, json: async () => ({workflow_runs: [{head_sha: sha, status: 'completed', conclusion: 'failure', html_url: 'https://github.com/run'}]})})}), /Deployment failure/)
})
test('ignores unrelated runs and waits for the matching commit', async () => {
  let count = 0
  const run = await waitForWorkflow({repository: 'owner/repo', commit: sha, ...quiet, fetchFn: async () => ({ok: true, json: async () => ({workflow_runs: ++count === 1 ? [{head_sha: 'b'.repeat(40), status: 'completed', conclusion: 'success'}] : [{head_sha: sha, id: 42, status: 'completed', conclusion: 'success'}]})})})
  assert.equal(run.id, 42)
})
test('a manual rebuild for the same commit is not confused with its push deployment', async () => {
  const run = await waitForWorkflow({repository: 'owner/repo', commit: sha, ...quiet, fetchFn: async () => ({ok: true, json: async () => ({workflow_runs: [
    {head_sha: sha, event: 'workflow_dispatch', id: 99, status: 'completed', conclusion: 'success'},
    {head_sha: sha, event: 'push', id: 42, status: 'completed', conclusion: 'success'},
  ]})})})
  assert.equal(run.id, 42)
})

test('rejects global noindex headers even when robots allows crawling', async () => {
  await assert.rejects(verifyIndexability({origin: new URL('https://easyshowtech.com'), fetchFn: async url => ({...publicPage(url), headers: new Headers({'X-Robots-Tag': 'noindex, nofollow'})})}), /X-Robots-Tag/)
})
test('rejects sitemap indexes pointing to the old preview domain', async () => {
  await assert.rejects(verifyIndexability({origin: new URL('https://easyshowtech.com'), fetchFn: async url => new URL(url).pathname === '/sitemap-index.xml' ? {ok: true, text: async () => '<loc>https://easyshowtech.pages.dev/sitemap-0.xml</loc>'} : publicPage(url)}), /outside the production domain/)
})

test('legacy mappings accept trailing slashes and leave unknown URLs alone', () => {
  assert.equal(legacyRedirect('/about-us/'), '/about/')
  assert.equal(legacyRedirect('/about-us'), '/about/')
  assert.equal(legacyRedirect('/product/unknown/'), undefined)
  assert.equal(legacyRedirect('/product-category/fabric-stand/80x200cm/'), '/products?series=sign-display')
})
test('a 404 at a legacy URL fails deployment verification', async () => {
  await assert.rejects(verifyLegacyRedirects({origin: new URL('https://easyshowtech.com'), fetchFn: async () => ({status: 404, headers: new Headers()})}), /permanently redirect/)
})
test('a broken catalogue destination fails legacy migration verification', async () => {
  await assert.rejects(verifyLegacyRedirects({origin: new URL('https://easyshowtech.com'), fetchFn: async url => legacyRedirect(new URL(url).pathname) ? publicPage(url) : {ok: false}}), /destination is unavailable/)
})
