import { sanityClient } from './client'

export interface BackdropDesignRecord { code: string; title: string; description: string; category: string; thumbnail: string; image: string; alt: string }
const base = '*[_type == "backdropDesign" && isActive == true && rightsConfirmed == true && defined(image.asset->url) && defined(code)'
const fields = '{code,title,description,category,"alt":coalesce(image.alt,title),"image":image.asset->url,"thumbnail":image.asset->url}'
const categoryOrder = ['Weddings & Ceremonies','Florals & Greenery','Birthdays & Parties','Christmas & Winter',"Valentine's Day & Romance",'Landscapes & Beaches','Kids & Fairytales','Drapes & Stage','Abstract, Geometric & Artistic Textures','Wood, Brick & Rustic','Halloween & Gothic','Easter & Spring','Graduation & School','Festivals & Cultural Themes','Glitter, Sequins & Lighting','Architecture & Interiors','Solid Colors & Minimalist','Luxury, Vintage & Decorative','Sports & Stadiums','Casino & Entertainment','Other Designs']
const categoryAlias = (value: string) => value === 'Floral' ? 'Florals & Greenery' : value === 'Texture' ? 'Abstract, Geometric & Artistic Textures' : value

export async function getBackdropDesignPage({ search = '', category = 'All', offset = 0, limit = 24 }: { search?: string; category?: string; offset?: number; limit?: number } = {}) {
  const safeLimit = Math.min(48, Math.max(1, Math.floor(limit)))
  const safeOffset = Math.max(0, Math.floor(offset))
  const searchPattern = search.trim() ? `*${search.trim().slice(0, 80)}*` : null
  const categoryFilter = category && category !== 'All' ? category : null
  const filter = `${categoryFilter ? ' && (category == $category || ($category == "Florals & Greenery" && category == "Floral") || ($category == "Abstract, Geometric & Artistic Textures" && category == "Texture"))' : ''}${searchPattern ? ' && (code match $search || title match $search || description match $search)' : ''}]`
  const params = { ...(categoryFilter ? { category: categoryFilter } : {}), ...(searchPattern ? { search: searchPattern } : {}) }
  const [items, total, categories] = await Promise.all([
    sanityClient.fetch<BackdropDesignRecord[]>(`${base}${filter} | order(sortOrder asc,code asc) [${safeOffset}...${safeOffset + safeLimit}] ${fields}`, params),
    sanityClient.fetch<number>(`count(${base}${filter})`, params),
    sanityClient.fetch<string[]>(`array::unique(${base}] .category)`),
  ])
  const orderedCategories = [...new Set(categories.filter(Boolean).map(categoryAlias))].sort((a,b) => (categoryOrder.indexOf(a) < 0 ? categoryOrder.length : categoryOrder.indexOf(a)) - (categoryOrder.indexOf(b) < 0 ? categoryOrder.length : categoryOrder.indexOf(b)) || a.localeCompare(b))
  return { items: items.map(d => ({ ...d, category: categoryAlias(d.category), thumbnail: `${d.thumbnail}?w=480&q=72&auto=format`, image: `${d.image}?w=1600&q=84&auto=format` })), total, categories: orderedCategories }
}
