# Backdrop catalog operations

Website: /solutions/photography-film/#backdrop-catalog

No design documents were seeded. The public page shows an honest preparation state until approved designs are published.

1. In Sanity Studio, open 背景图案库 / Backdrop Designs.
2. Create one document per design. Assign a permanent unique code such as ES-BD-001. Never recycle a code already shared with customers; unlist a retired design instead.
3. Enter a short customer-facing name and consistent category, upload an owned or licensed design preview and describe its contents for accessibility.
4. Confirm image rights and switch Visible in catalog on, then publish. Draft, unlisted or unconfirmed-rights designs never appear publicly.
5. Publish the website using the existing publish flow so the static catalog is rebuilt. If a Sanity webhook is used, include backdropDesign changes in its repository-dispatch filter; no webhook credentials were changed by this implementation.
6. Check the catalog and a preview on desktop/mobile before sharing the anchored URL.

Cards show stable codes; preview supports previous/next, code copying, downloading a selection PNG with code and title, and inquiry prefill via the existing solution/configuration contact parameters. The browser fetches only public preview images, never Sanity tokens. Artwork files intended for production should not be uploaded as public previews.

Size, fabric, printing sides, compatibility, quantity, price and production timing remain quotation decisions; the design catalog does not assert product specifications.

A direct selection URL uses ?design=ES-BD-001#backdrop-catalog. A retired code does not open a replacement automatically.
