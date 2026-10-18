# scripts/

One-off / project-local Node scripts (not npm-run).

## Solution cleanup (2026-10-18, one-time, not checked in)

Recursively walked all six `solution` documents in the Sanity
`production` dataset and:

- stripped any leading `[MOCK] ` (or `[MOCK]`) prefix from string fields
- stripped invisible / zero-width / BOM / bidi-override codepoints
  (`U+200B U+200C U+200D U+FEFF U+202A-202E U+2066-2069` etc.) that
  had been planted by an upstream AI content tool

The script was used to clean ~6.1×10⁴ hidden characters per page
(observed on `/solutions/franchise`) and 10-17 `[MOCK]` strings per
document. After the run:

| metric | before | after |
| --- | ---: | ---: |
| `[MOCK]` per solution page | 10-17 | 0 |
| hidden chars on `/solutions/franchise` | 61,572 | 0 |
| dirty solution docs in Sanity | 6 | 0 |

The script itself was deleted from the repo after running (it
embedded a one-shot write token and is not safe to commit). The
README above is kept as the only record of what it did.

The dataset must be re-indexed after a write to clear Studio's
"Invalid preview config" badge — `client.createOrReplace({...})`
on each doc forces a CDN re-index. A plain `client.patch().set()`
may leave the CDN thinking the doc is still in its pre-cleanup
state, even though the live API returns the new values.

If a future dataset needs the same treatment, recreate the script
in this folder and re-run with a fresh `SANITY_API_WRITE_TOKEN`
from `studio/.env`.

The fix that prevents this recurring is editorial, not scripted:
the Studio content team should be told to never paste output
from copy-protection / AI-watermarking tools into long-form
text fields, because the inserted characters break SEO, screen
readers, and search-indexing.
