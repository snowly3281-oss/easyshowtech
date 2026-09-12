# Sanity product schema reference

## Scope

This document records the full Product data model used to represent the
product detail page. The implemented source of truth is
`studio/schemaTypes/product.ts`; use this document as field-level background
when maintaining that schema.

The model retains the core fields (title, slug,
sku, status, series, equipment, priceDisplay, price, currency, mainImage,
gallery, summary, keySpecs, variants, order). Add the new fields/objects
below. Where a v1 field is being upgraded (e.g. variants, gallery), evolve it
as noted rather than duplicating.

Use the current defineType/defineField style. Group fields with Sanity
fieldsets or clear ordering so the Studio form stays navigable (this is now a
large document — group it).

---

## Field groups to ADD / UPGRADE on `product`

### GROUP: Status & availability (new)
The mockup's top bar shows "IN PRODUCTION · SHIPS 6–8 WEEKS" and "CE certified".
- `productionStatus` (string, dropdown) — e.g. "in_production" / "made_to_order"
  / "discontinued". Label drives the top status pill.
- `shipsIn` (string, optional) — e.g. "6–8 weeks" (lead-time text shown in the
  status bar and header).
- `certifications` (array of strings, optional) — e.g. ["CE", "EN 20957"].
  Shown as "CE certified" etc.

> Note: `status` (v1: published/draft/archived) is the EDITORIAL state
> (whether it appears on the site). `productionStatus` is the BUSINESS state
> (whether it's in production). Keep both — they're different.

### GROUP: Header / pricing (extend v1)
The mockup header shows price + "EX-WORKS / UNIT" + "Volume & OEM on request".
- Keep v1 `price`, `priceDisplay`, `currency`.
- `priceUnit` (string, optional, default "ex-works / unit") — the small label
  under the price.
- `priceNote` (string, optional, default "Volume & OEM on request") — the
  secondary pricing line.

### GROUP: Header quick-stats (new — the 3 boxes: MOQ / Lead time / Warranty)
The header has three small stat boxes. Model as explicit fields (they're
fixed, not arbitrary):
- `moq` (string, optional) — e.g. "10 units"
- `leadTime` (string, optional) — e.g. "6–8 wks"
- `warranty` (string, optional) — e.g. "10 years"

### UPGRADE: Gallery with angle labels (evolve v1 `gallery`)
The mockup gallery has labelled thumbnails: Front / Detail / Springs / Folded
/ Packed, plus a dimension caption on the main image.
- Upgrade `gallery` from `array of image` to `array of objects`, each:
  - `image` (image, hotspot true)
  - `alt` (string)
  - `label` (string, optional) — e.g. "Front", "Detail", "Springs", "Folded",
    "Packed"
- `mainImageDimensionNote` (string, optional) — e.g. "245 × 65 × 35 cm"
  (the caption overlaid on the main image).

### UPGRADE: "At a glance" key specs (evolve v1 `keySpecs`)
v1 `keySpecs` was simple label/value. The mockup's "at a glance" strip shows a
big number + unit + label + sub-note (e.g. "150 kg / MAX USER LOAD / Tested to
EN 20957"). Upgrade each `keySpecs` item to:
- `value` (string) — e.g. "150"
- `unit` (string, optional) — e.g. "kg"
- `label` (string) — e.g. "Max user load"
- `note` (string, optional) — e.g. "Tested to EN 20957"
(Keep it an array; 3–4 items typically. Values stay strings so units/ranges
like "12–340 N" are preserved; the front end renders figures with tabular
nums.)

### UPGRADE: Variants with full material detail (evolve v1 `variants`)
The "Materials & construction" section shows, per material: name, SKU suffix,
a DEFAULT badge, a description, a Janka value, and a finish. Upgrade each
`variants` item from {name, skuSuffix, isDefault} to:
- `name` (string) — e.g. "Oak"
- `skuSuffix` (string, optional) — e.g. "-OAK"
- `isDefault` (boolean) — drives the DEFAULT badge
- `description` (text, optional) — e.g. "Warm, open grain with a pale gold
  tone. The studio default."
- `janka` (string, optional) — e.g. "Janka 1090"
- `finish` (string, optional) — e.g. "Natural matte"
- `swatchColor` (string, optional) — a hex for the material swatch, OR an
  optional `swatchImage` (image) if you prefer real texture swatches. Pick
  one; hex string is simpler for v2.

### GROUP: Full datasheet (new — the big spec table)
The "full datasheet" section has four labelled groups. Model as four arrays of
label/value objects so the client can add/remove rows freely, OR as explicit
nested objects. Use **four arrays of {label, value} objects**, one per group,
for flexibility:
- `specDimensions` (array of {label, value}) — e.g. Product size (L×W×H) =
  "245 × 65 × 35 cm", Carriage travel = "95 cm", Footprint in use = "245 × 65
  cm", Packaging size = "255 × 72 × 42 cm"
- `specWeight` (array of {label, value}) — Net weight = "62 kg", Gross weight =
  "78 kg", Max user weight = "150 kg"
- `specMechanism` (array of {label, value}) — Spring system = "5 springs · 3
  heavy / 1 medium / 1 light", Resistance range = "12 – 340 N", Rope & pulley =
  "Adjustable, sealed ball-bearing", Carriage wheels = "4 precision sealed
  bearings"
- `specMaterials` (array of {label, value}) — Frame material = "Solid oak
  (maple / walnut option)", Finish = "Low-VOC matte seal", Upholstery =
  "High-density foam · vegan leather", In the box = "Foot bar, gear bar, 2
  straps, box, jump board"

(Each item: `label` string + `value` string. Keep values as strings to
preserve units and ranges.)

- `specPdf` (file, optional) — "Download full spec (PDF)" per product.
- `specRevision` (string, optional) — e.g. "REV. 2024.1"

### GROUP: Wholesale & OEM (new — the dark "buy by the room" block)
Six labelled values. Model as explicit fields (fixed set):
- `oemMoq` (string, optional) — e.g. "10 units" (with note "Models can be
  mixed" → see oemMoqNote)
- `oemMoqNote` (string, optional) — e.g. "Models can be mixed"
- `oemLeadTime` (string, optional) — e.g. "6–8 weeks"
- `oemLeadTimeNote` (string, optional) — e.g. "After deposit clears"
- `oemPrivateLabel` (string, optional) — e.g. "Available"
- `oemPrivateLabelNote` (string, optional) — e.g. "Logo · colors · packaging"
- `oemPackaging` (string, optional) — e.g. "Export carton"
- `oemPackagingNote` (string, optional) — e.g. "ISPM-15 pallets"
- `oemPayment` (string, optional) — e.g. "30 / 70"
- `oemPaymentNote` (string, optional) — e.g. "T/T or L/C at sight"
- `oemShipping` (string, optional) — e.g. "FOB / CIF"
- `oemShippingNote` (string, optional) — e.g. "Global freight forwarding"

> These could alternatively be one array of {label, value, note} objects to
> reduce field count. Either is fine — if you prefer the array form, use a
> single `oemTerms` array of {label, value, note}. Choose whichever keeps the
> Studio form cleaner; note your choice.

### GROUP: Related products (new — "More from the series")
The mockup shows 3 related products from the same series.
- `relatedProducts` (array of references → `product`, optional) — manually
  curated related items. (Alternatively the front end can auto-derive "same
  series" via query; but include this field so editors can override/curate.)

### Long description (optional, new)
- `description` (Portable Text / array of blocks, optional) — a rich-text body
  if any product needs more than the `summary`. Optional; the mockup mostly
  uses structured fields, so this is a nice-to-have.

---

## Studio form organisation

This document is now large. Organise with **fieldsets or groups** so editors
aren't faced with a wall of fields. Suggested groups (tabs or collapsible
fieldsets):
1. **Identity** — title, slug, sku, status, series, equipment
2. **Status & availability** — productionStatus, shipsIn, certifications
3. **Header & pricing** — price, priceDisplay, currency, priceUnit, priceNote,
   moq, leadTime, warranty
4. **Media** — mainImage, mainImageDimensionNote, gallery
5. **At a glance** — keySpecs
6. **Materials / variants** — variants
7. **Datasheet** — specDimensions, specWeight, specMechanism, specMaterials,
   specPdf, specRevision
8. **Wholesale & OEM** — the oem* fields (or oemTerms array)
9. **Related** — relatedProducts
10. **Summary / description** — summary, description, order

Keep the document preview as v1 (title + sku + mainImage).

---

## Deliverable

1. The upgraded `product` schema with all groups above, extending v1 (not
   replacing). Evolve gallery / keySpecs / variants as specified.
2. Use fieldsets/groups so the Studio form stays navigable.
3. Confirm the schema compiles and the Studio loads the expanded Product type
   without errors. (You can run the Studio locally to verify it loads; do NOT
   enter product data.)
4. Report: the final field list per group, any field-count reductions you
   chose (e.g. oemTerms array vs individual fields), and confirm nothing from
   v1 was dropped.

Do NOT enter product data, build the PDP front end, or wire fetching. Schema
extension only. After this, the client (or a data-import pass) can enter the
full Studio Reformer Pro with every field populated.
