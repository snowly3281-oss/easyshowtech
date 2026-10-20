import {test} from 'node:test'
import assert from 'node:assert/strict'
import {verifyDeployment, waitForWorkflow, solutionSlugs} from './deployment.mjs'
import {isReleasePath, createReleasePlan} from './release-plan.mjs'

const sha = 'a'.repeat(40)
const quiet = {sleep: async () => {}, log: () => {}}
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
    requests.push(String(url)); return String(url).includes('deployment.json') ? marker() : {ok: true, text: async () => '<h1>Solution</h1>'}
  }})
  assert.equal(requests.length, solutionSlugs.length + 1)
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
  await verifyDeployment({commit: sha, attempts: 2, ...quiet, fetchFn: async url => String(url).includes('deployment.json') ? marker(++count === 1 ? 'b'.repeat(40) : sha) : {ok: true, text: async () => '<h1>'}})
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
