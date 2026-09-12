import {defineLocations, type PresentationPluginOptions} from "sanity/presentation";

const PUBLIC_LOCALES = new Set(["es", "fr", "de", "it"]);

function localizedHref(route: string, language?: string) {
  if (!language || !PUBLIC_LOCALES.has(language)) return route;
  return route === "/" ? `/${language}` : `/${language}${route}`;
}

function slugRoute(
  prefix: string,
  slug?: string,
  language?: string,
) {
  return slug ? localizedHref(`/${prefix}/${slug}`, language) : null;
}

/** Maps Sanity documents to the corresponding Astro routes in Presentation. */
export const presentationResolve: PresentationPluginOptions["resolve"] = {
  locations: {
    home: defineLocations({
      select: {language: "language"},
      resolve: (doc) => ({
        locations: [
          {title: "首页 / Home", href: localizedHref("/", doc?.language)},
        ],
      }),
    }),
    oem: defineLocations({
      select: {language: "language"},
      resolve: (doc) => ({
        locations: [
          {
            title: "OEM 服务 / OEM Services",
            href: localizedHref("/oem-services", doc?.language),
          },
        ],
      }),
    }),
    sitePage: defineLocations({
      select: {title: "title", route: "route", language: "language"},
      resolve: (doc) => ({
        locations: doc?.route
          ? [
              {
                title: doc.title || doc.route,
                href: localizedHref(doc.route, doc.language),
              },
            ]
          : [],
      }),
    }),
    product: defineLocations({
      select: {title: "title", slug: "slug.current", language: "language"},
      resolve: (doc) => {
        const href = slugRoute("products", doc?.slug, doc?.language);
        return {
          locations: href ? [{title: doc?.title || "Product", href}] : [],
        };
      },
    }),
    solution: defineLocations({
      select: {title: "title", slug: "slug.current", language: "language"},
      resolve: (doc) => {
        const href = slugRoute("solutions", doc?.slug, doc?.language);
        return {
          locations: href ? [{title: doc?.title || "Solution", href}] : [],
        };
      },
    }),
    post: defineLocations({
      select: {title: "title", slug: "slug.current", language: "language"},
      resolve: (doc) => {
        const href = slugRoute("resources", doc?.slug, doc?.language);
        return {
          locations: href ? [{title: doc?.title || "Resource", href}] : [],
        };
      },
    }),
  },
};
