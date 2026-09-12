# Coral Pilates — Sanity Studio

Standalone Sanity Studio for the Coral Pilates content (Products + taxonomies +
site settings). This is **separate** from the Astro site in the repo root — it
deploys to its own `*.sanity.studio` URL and the Astro app stays a pure static
site.

- **Project ID:** `p3d22f8w` (public/safe)
- **Dataset:** `production`

## Commands (run from this `studio/` folder)

```bash
npm install        # install Studio deps (no Sanity account needed)
npm run login      # sanity login — authenticate the CLI (browser)
npm run dev        # sanity dev — run Studio locally at http://localhost:3333
npm run deploy     # sanity deploy — deploy to <hostname>.sanity.studio
npm run manage     # open project settings on sanity.io/manage
```

## Content model (v1)

- `series` — product series (Wood, Aluminum, …); slug → `?series=`
- `equipment` — equipment type (Reformer, Cadillac, …); slug → `?equipment=`
- `product` — core type; references one `series` + one `equipment`
  (double-axis taxonomy), quote-gated pricing, status, lean key specs/variants
- `siteSettings` — singleton (global contact details + `showPrices` master switch)

No tokens are stored in this repo. A future write/read token belongs in a
gitignored `.env`, never in code.
