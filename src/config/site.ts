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
  { label: "Aluminum Tents", href: "/products?series=aluminum-tent" },
  { label: "Steel Tents", href: "/products?series=steel-tent" },
  { label: "Pop Up Walls", href: "/products?series=popup-walls" },
  { label: "Backdrops", href: "/products?series=backdrops" },
  { label: "Flags system", href: "/products?series=flags-system" },
  { label: "Sign and Display", href: "/products?series=sign&display" },
  { label: "Chairs", href: "/products?series=chairs" },
  // { label: "Replacement Fabric & Parts", href: "/products?series=folding" },
  // { label: "Sublimation Printer", href: "/products?series=spiral-pulley" },
];

export const productsEquipment: NavLink[] = [
  { label: "Custom Canopy", href: "/products?equipment=custom-canopy" },
  { label: "Custom Backdrops", href: "/products?equipment=custom-backdrops" },
  { label: "Custom Flags", href: "/products?equipment=custom-flags" },
  { label: "Custom Table Cover", href: "/products?equipment=custom-table-cover" },
  { label: "Custom Chair", href: "/products?equipment=custom-chair" },
  { label: "Custom Umbrella", href: "/products?equipment=custom-umbrella" },
  { label: "Stock Color Canopy", href: "/products?equipment=stock-color-canopy" },
];

export const productsParts: NavLink[] = [
  { label: "Fabrics", href: "/products?parts=springs" },
  { label: "Carry Bags", href: "/products?parts=upholstery" },
  { label: "Connectors", href: "/products?parts=cables_ropes" },
  { label: "Weights", href: "/products?parts=footbars_hardware" },
  { label: "Tools", href: "/products?parts=training_accessories" },
]; 

/* ---- Solutions menu ------------------------------------------------------ */
export const solutionsByCustomer: NavLink[] = [
  { label: "Wedding & Party", href: "/solutions/boutique-studio" },
  { label: "Events & Trade Shows", href: "/solutions/franchise" },
  { label: "Photography & Film", href: "/solutions/rehab-clinic" },
  { label: "Retail & Pop-Up Stores", href: "/solutions/hotel-spa" },
  { label: "Religious & Community", href: "/solutions/home-pt" },
  { label: "Education & Training", href: "/solutions/training-academy" },
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

