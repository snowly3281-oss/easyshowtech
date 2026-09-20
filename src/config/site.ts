/**
 * site.ts — central configuration for the Easy Show Tech scaffold.
 *
 * Two jobs:
 *  1. Editable values (email/phone/etc.) render real samples now and map to
 *     Sanity site-settings in a later pass — keeping them here means one place
 *     to swap when the CMS is wired.
 *  2. Nav + footer link structures, so Header.astro and Footer.astro share a
 *     single source of truth (the Products / Solutions lists are intended to
 *     become data-driven from Sanity later).
 *
 * Only working public destinations belong here. Future tools and downloads
 * stay out of navigation until their routes or assets are ready.
 */

export const siteSettings = {
  brand: "EASY SHOW",
  url: "https://easyshowtech.com",
  location: "Suzhou, China",
  salesEmail: "chris@easyshowtech.com", // {{sales_email}}
  phone: "+86 139 2197 4459", // {{phone}}
  whatsapp: "+86 139 2197 4459", // {{whatsapp}} — same number
  responseTime: "one business day", // {{response_time}}
} as const;

export interface NavLink {
  label: string;
  href: string;
}

/* ---- Products mega menu (4 columns) -------------------------------------
 * IMPORTANT: `series=` / `equipment=` slugs MUST match the Sanity taxonomy
 * slugs the catalog sidebar filters on — otherwise the link lands on an empty
 * result — e.g. there is no "wood" series (it's "wood-maple" + "wood-oak").
 * "Spiral Pulley" (slug spiral-pulley) is a real series; "Apparatus" exists in
 * the dataset but is intentionally kept OUT of the nav (approved nav wording).
 * Kept in sync with the production dataset. (Making this data-driven from
 * Sanity is the eventual fix.) */
export const productsSeries: NavLink[] = [
  { label: "Wood Maple", href: "/products?series=wood-maple" },
  { label: "Wood Oak", href: "/products?series=wood-oak" },
  { label: "Aluminum", href: "/products?series=aluminum" },
  { label: "Professional", href: "/products?series=professional" },
  { label: "Modular", href: "/products?series=modular" },
  { label: "Classical", href: "/products?series=classical" },
  { label: "Folding", href: "/products?series=folding" },
  { label: "Spiral Pulley", href: "/products?series=spiral-pulley" },
];

export const productsEquipment: NavLink[] = [
  { label: "Reformer", href: "/products?equipment=reformer" },
  { label: "Chair", href: "/products?equipment=chair" },
  { label: "Cadillac", href: "/products?equipment=cadillac" },
  { label: "Barrel", href: "/products?equipment=barrel" },
  { label: "Spine Corrector", href: "/products?equipment=spine-corrector" },
];

export const productsParts: NavLink[] = [
  { label: "Springs", href: "/products?parts=springs" },
  { label: "Upholstery", href: "/products?parts=upholstery" },
  { label: "Cables & ropes", href: "/products?parts=cables_ropes" },
  { label: "Footbars", href: "/products?parts=footbars_hardware" },
  { label: "Boxes & mats", href: "/products?parts=training_accessories" },
];

/* ---- Solutions menu ------------------------------------------------------ */
export const solutionsByCustomer: NavLink[] = [
  { label: "Boutique studio", href: "/solutions/boutique-studio" },
  { label: "Franchise", href: "/solutions/franchise" },
  { label: "Rehab clinic", href: "/solutions/rehab-clinic" },
  { label: "Hotel spa", href: "/solutions/hotel-spa" },
  { label: "Home / PT", href: "/solutions/home-pt" },
  { label: "Training academy", href: "/solutions/training-academy" },
];

/* ---- Company dropdown --------------------------------------------------- */
export const companyLinks: NavLink[] = [
  { label: "About", href: "/about" },
  { label: "Our factory", href: "/factory" },
  { label: "OEM services", href: "/oem-services" },
];

/* ---- Footer columns ----------------------------------------------------- */
export const footerProducts: NavLink[] = productsSeries;
export const footerSolutions: NavLink[] = solutionsByCustomer;
export const footerCompany: NavLink[] = [
  { label: "About", href: "/about" },
  { label: "Our factory", href: "/factory" },
  { label: "OEM services", href: "/oem-services" },
  { label: "Contact", href: "/contact" },
];

/* ---- Legal links (footer bottom bar) ------------------------------------ */
export const legalLinks: NavLink[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

