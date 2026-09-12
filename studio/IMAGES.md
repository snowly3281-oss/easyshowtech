# Product image import (pipeline A — Sanity)

Bulk-upload product photos to Sanity. **Hybrid behaviour:**

- A SKU's **product exists** → attach (`featured/` → `mainImage`, `angles/` → `gallery`).
- A SKU's **product doesn't exist yet** → upload images to the Sanity **media
  library** (unattached, labelled with the SKU). Re-run after you build the
  product and they attach automatically.

> Why you run it (not the assistant): the assistant's sandbox can't reach
> `api.sanity.io` and the MCP connector can't upload binaries — only
> `@sanity/client` can.

## Matching

A folder is matched to a product by **SKU**: `product.sku == <folder>` OR
`slug.current == slugify(<folder>)`. So when you create a product later, put the
SKU code (e.g. `Eleven-O-RE001`) in its **`sku`** field and re-run to auto-attach.

## Expected layout (nested)

```
<IMAGES_DIR>/.../Eleven-O-RE001/
  featured/eleven-o-re001-featured.webp   -> mainImage   (1 image)
  angles/eleven-o-re001-01.webp           -> gallery[0]
  angles/eleven-o-re001-02.webp           -> gallery[1]  (sorted by filename)
```

- Any folder containing a `featured/` or `angles/` subfolder is a **SKU folder**.
  The importer recurses, so you can point `IMAGES_DIR` at the top — folders
  without `featured/`/`angles/` (e.g. `01 Real Factory`, `02 Series Hero`) are ignored.
- A `" (...)"` suffix (e.g. `(missing ...)`) is stripped from the SKU key; folders
  with no images are skipped.
- Accepted: `.jpg .jpeg .png .webp .avif .gif`

## Setup

Editor token in `studio/.env` (gitignored):

```
SANITY_WRITE_TOKEN=sk...
```

## Run (from the `studio/` folder)

```
# preview — uploads nothing, shows attach-vs-library plan
IMAGES_DIR="/absolute/path/to/webp-for-cms" \
  DRY=1 node --env-file=.env import-images.mjs

# do it
IMAGES_DIR="/absolute/path/to/webp-for-cms" \
  node --env-file=.env import-images.mjs
```

Env options: `GALLERY_MODE=replace|append` (default `replace` — folder wins).

## Notes

- Attaches to the product **draft**; review in the Studio, then **Publish**.
- Re-runs are safe: Sanity de-dupes identical image bytes; gallery is rebuilt
  from the folder each run.
- The current `webp-for-cms` set has **no matching products yet**, so a run now
  sends all SKU images to the media library (labelled by SKU). Build the products
  (sku = the SKU code) and re-run to attach.
- `02 Series Hero` has no home yet — `series` has no image field. Ask to add a
  `heroImage` field if you want those attached.
- `01 Real Factory` images were placed in the Astro repo at `public/factory/`
  (static, pipeline B) — not part of this script.
