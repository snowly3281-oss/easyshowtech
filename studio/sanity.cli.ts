import { defineCliConfig } from 'sanity/cli'

/**
 * Sanity CLI config — used by `sanity dev`, `sanity build`, `sanity deploy`.
 * projectId is public/safe (it appears in URLs). No tokens here.
 */
export default defineCliConfig({
  api: {
    projectId: 'p3d22f8w',
    dataset: 'production',
  },
  /**
   * Generate front-end query and schema types from the Astro source tree.
   * Keeping this in the CLI config follows the current Sanity workflow and
   * avoids the deprecated standalone typegen configuration.
   */
  typegen: {
    path: '../src/**/*.{ts,tsx}',
    schema: './schema.json',
    generates: '../src/sanity/sanity.types.ts',
  },
  /**
   * Keep the deployed editor on the version verified with these custom
   * components. Upgrade Sanity deliberately after a local build/check instead
   * of allowing an unreviewed weekly runtime change.
   */
  deployment: {
    appId: 'obzl4tu9ezahp0hq5mf22uap',
    autoUpdates: false,
  },
})
