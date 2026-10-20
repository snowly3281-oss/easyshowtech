// Public build identity only; no environment variables or credentials are exposed.
export const prerender = true

export function GET() {
  return new Response(JSON.stringify({
    commit: import.meta.env.PUBLIC_DEPLOY_COMMIT || 'local',
    runId: import.meta.env.PUBLIC_DEPLOY_RUN_ID || null,
    builtAt: new Date().toISOString(),
  }), {headers: {'Content-Type': 'application/json', 'Cache-Control': 'no-store'}})
}
