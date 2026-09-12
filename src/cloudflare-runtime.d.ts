/**
 * Astro checks browser, Studio, and Worker source in one TypeScript project.
 * Loading Wrangler's full runtime declaration here introduces DOM name
 * collisions, so Worker bindings are resolved at runtime and narrowed at each
 * server-side call site instead.
 */
declare module 'cloudflare:workers' {
  interface D1StatementLike {
    bind(...values: unknown[]): D1StatementLike
    first<T = Record<string, unknown>>(): Promise<T | null>
    run(): Promise<unknown>
  }

  interface D1DatabaseLike {
    prepare(query: string): D1StatementLike
    batch(statements: D1StatementLike[]): Promise<unknown[]>
  }

  // Runtime bindings are validated by wrangler.jsonc and narrowed by the
  // server modules that consume them.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const env: { INQUIRIES_DB: D1DatabaseLike } & Record<string, any>
}
