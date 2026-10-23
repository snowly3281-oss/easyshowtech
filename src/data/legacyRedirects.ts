/** Exact legacy WordPress URLs reported by Search Console.
 * Use relevant catalogue families where legacy dimensions/specifications are
 * not confirmed in the current catalogue. Unknown URLs remain genuine 404s.
 */
export const legacyRedirects: Record<string, string> = {
  '/about-us': '/about/',
  '/product/economy-steel-tent': '/products?series=steel-tent',
  '/product-category/fabric-stand/80x200cm': '/products?series=sign-display',
  '/product/40mm-aluminum-tube-frame-3x6m-hexagon-folding-tent-pop-up-canopy-marquee-for-trade-shows-events-parties-or-awning-use': '/products?series=aluminum-tent',
}

export function legacyRedirect(pathname: string): string | undefined {
  return legacyRedirects[pathname.replace(/\/+$/, '')]
}
