# Coral Pilates

B2B Pilates equipment website and content-management system for
[coralpilates.com](https://coralpilates.com).

## Architecture

- Astro frontend with Cloudflare Workers deployment
- Sanity Studio and Sanity Content Lake
- Cloudflare D1 for inquiry records
- Cloudflare KV for sessions
- Cloudflare Turnstile for form abuse protection
- Resend for transactional inquiry email

## Requirements

- Node.js 22.16.0 (run `nvm use` in the repository root; `.nvmrc` is the
  source of truth)
- npm 10.9.2. Cloudflare Workers Builds uses this same runtime.
- Wrangler authentication for Cloudflare deployment
- Sanity project access for Studio development and schema deployment

## Local setup

```sh
nvm use
npm install
npm --prefix studio install
cp .env.example .env
```

Fill the local `.env` values without committing secrets.

Start the website:

```sh
npm run dev
```

### Dependency-lock policy

`package-lock.json` is generated and validated with npm 10.9.2, matching
Cloudflare. Do not run a plain `npm install` from npm 11+ to update
dependencies: it can write peer-dependency metadata that Cloudflare's npm 10
rejects during `npm ci`.

Use these commands instead:

```sh
# Fast compatibility check; also runs automatically before dev/build.
npm run lock:check

# Intentional dependency or lockfile update.
npm run lock:sync
```

GitHub additionally runs a Node 22 / npm 10 clean-install check for every
push and pull request. A lockfile mismatch is therefore caught before a
Cloudflare deployment is trusted.

Start Sanity Studio in a second terminal:

```sh
npm --prefix studio run dev
```

The website uses `http://localhost:4321`; Studio uses
`http://localhost:3333`.

## Verification and deployment

```sh
npm run build
npm --prefix studio run build
npm run deploy:dry-run
npm run deploy
```

Search-engine indexing remains disabled while
`PUBLIC_SITE_INDEXING_ENABLED=false`.

## Repository layout

- `src/` — frontend pages, components, actions and Sanity queries
- `public/` — static assets shipped with the website
- `studio/` — Sanity Studio, schemas and controlled migration utilities
- `migrations/` — Cloudflare D1 migrations
- `workers/` — supporting Cloudflare Workers
- `docs/` — operational, launch and legal handoff documentation
- `scripts/` — repeatable local development utilities

Do not commit `.env`, `.dev.vars`, Sanity write tokens, Resend keys or other
credentials.
