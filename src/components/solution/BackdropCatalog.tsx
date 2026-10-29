/** @jsxImportSource react */
import {useEffect,useMemo,useRef,useState} from 'react'
import {stegaClean} from '@sanity/client/stega'
import './backdrop-catalog.css'
export interface BackdropDesign {code:string;title:string;description:string;category:string;thumbnail:string;image:string;alt:string}
const CATEGORY_ORDER=[
 'Weddings & Ceremonies',
 'Florals & Greenery',
 'Birthdays & Parties',
 'Christmas & Winter',
 "Valentine's Day & Romance",
 'Landscapes & Beaches',
 'Kids & Fairytales',
 'Drapes & Stage',
 'Abstract, Geometric & Artistic Textures',
 'Wood, Brick & Rustic',
 'Halloween & Gothic',
 'Easter & Spring',
 'Graduation & School',
 'Festivals & Cultural Themes',
 'Glitter, Sequins & Lighting',
 'Architecture & Interiors',
 'Solid Colors & Minimalist',
 'Luxury, Vintage & Decorative',
 'Sports & Stadiums',
 'Casino & Entertainment',
 'Other Designs',
]
const CATEGORY_ALIASES:Record<string,string>={Floral:'Florals & Greenery',Texture:'Abstract, Geometric & Artistic Textures'}
export default function BackdropCatalog({designs,contactPath}:{designs:BackdropDesign[];contactPath:string}) {
 const [search,setSearch]=useState(''),[category,setCategory]=useState('All'),[limit,setLimit]=useState(24),[active,setActive]=useState<BackdropDesign|null>(null),[status,setStatus]=useState('')
 const dialog=useRef<HTMLDialogElement>(null)
 const cleanDesigns=useMemo(()=>stegaClean(designs).map(d=>{const category=d.category?.trim()??'';return {...d,category:CATEGORY_ALIASES[category]??category}}).sort((a,b)=>Number(a.code.startsWith('ES-BD-DEMO-'))-Number(b.code.startsWith('ES-BD-DEMO-'))),[designs])
 const categories=useMemo(()=>['All',...new Set(cleanDesigns.map(d=>d.category).filter(Boolean))].sort((a,b)=>{if(a==='All')return -1;if(b==='All')return 1;if(a==='Other Designs')return 1;if(b==='Other Designs')return -1;const ai=CATEGORY_ORDER.indexOf(a),bi=CATEGORY_ORDER.indexOf(b);return (ai<0?CATEGORY_ORDER.length:ai)-(bi<0?CATEGORY_ORDER.length:bi)||a.localeCompare(b)}),[cleanDesigns])
 const filtered=useMemo(()=>cleanDesigns.filter(d=>(category==='All'||d.category===category)&&`${d.code} ${d.title} ${d.category} ${d.description}`.toLowerCase().includes(search.trim().toLowerCase())),[cleanDesigns,category,search])
 const quote=(d?:BackdropDesign)=>contactPath+'?'+new URLSearchParams({solution:'Photography & Film',...(d?{configuration:`Backdrop design: ${d.code} - ${d.title}`}:{})})
 useEffect(()=>{const code=new URLSearchParams(location.search).get('design');if(code)setActive(cleanDesigns.find(d=>d.code===code)||null)},[cleanDesigns])
 useEffect(()=>{setStatus('');if(active){dialog.current?.showModal();const u=new URL(location.href);u.searchParams.set('design',active.code);u.hash='backdrop-catalog';history.replaceState(null,'',u)}else{dialog.current?.close();const u=new URL(location.href);if(u.searchParams.has('design')){u.searchParams.delete('design');history.replaceState(null,'',u)}}},[active])
 const move=(delta:number)=>{if(!active)return;const list=filtered.length&&filtered.some(d=>d.code===active.code)?filtered:designs;setActive(list[(list.findIndex(d=>d.code===active.code)+delta+list.length)%list.length])}
 async function copy(){try{await navigator.clipboard.writeText(active!.code);setStatus('Design code copied.')}catch{setStatus(`Design code: ${active!.code}`)}}
 async function download(){if(!active)return;try{const d=active;const img=new Image();img.crossOrigin='anonymous';img.src=d.image;await img.decode();const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=1120;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#f7f4ee';ctx.fillRect(0,0,1400,1120);const scale=Math.min(1340/img.width,900/img.height);ctx.drawImage(img,(1400-img.width*scale)/2,30+(900-img.height*scale)/2,img.width*scale,img.height*scale);ctx.fillStyle='#151b25';ctx.font='bold 36px sans-serif';ctx.fillText(`EASY SHOW | ${d.code}`,40,990);ctx.font='26px sans-serif';ctx.fillText(d.title.slice(0,80),40,1035);ctx.font='20px sans-serif';ctx.fillText('Reference design - size, material and printing confirmed in your quote.',40,1080);const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${d.code}-EASY-SHOW.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setStatus('Selection image downloaded.')}catch{setStatus('Download unavailable. Please screenshot this preview with its design code.')}}
 return <section id="backdrop-catalog" className="section bd-catalog"><div className="container">
 <p className="eyebrow">Choose your backdrop</p><h2>Backdrop Design Catalog</h2><p>Choose a design you like. Send us its screenshot or design code, together with your preferred size and quantity.</p>
 <p className="bd-note">Designs are artwork options. Frame, fabric, finished size and single- or double-sided printing are confirmed separately in your quotation.</p>
 {!designs.length?<div className="bd-empty"><h3>Our design collection is being prepared</h3><p>Have a preferred look? Send us your own artwork or a reference image to discuss your backdrop project.</p><a className="btn btn-coral" href={quote()}>Discuss a custom backdrop</a></div>:<>
 <div className="bd-tools"><label>Search designs<input type="search" placeholder="Design code, name or style" value={search} onChange={e=>{setSearch(e.target.value);setLimit(24)}}/></label><label>Category<select value={category} onChange={e=>{setCategory(e.target.value);setLimit(24)}}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><p role="status">{filtered.length} designs</p></div>
 <div className="bd-grid">{filtered.slice(0,limit).map(d=><button key={d.code} className="bd-card" onClick={()=>setActive(d)} aria-label={`View ${d.code}: ${d.title}. ${d.description}`}><span className="bd-card__media"><img src={d.thumbnail} alt={d.alt} width="600" height="450" loading="lazy"/><span className="bd-card__description">{d.description}</span></span><strong>{d.code}</strong><span>{d.title}</span><small>{d.category}</small><small className="bd-card__hint">Tap for full design details</small></button>)}</div>
 {!filtered.length&&<p>No designs match. Try another search or category.</p>}{limit<filtered.length&&<button className="btn btn-outline" onClick={()=>setLimit(limit+24)}>Load more designs</button>}
 </>}
 <dialog ref={dialog} className="bd-dialog" onCancel={()=>setActive(null)} onClose={()=>setActive(null)} onClick={e=>{if(e.target===e.currentTarget)setActive(null)}}>{active&&<div className="bd-preview"><button className="bd-close" aria-label="Close preview" onClick={()=>setActive(null)}>Close ×</button><img src={active.image} alt={active.alt}/><h3>{active.code} · {active.title}</h3><p>{active.description}</p><p className="bd-note">Category: {active.category}</p><div className="bd-actions"><button onClick={()=>move(-1)}>← Previous</button><button onClick={()=>move(1)}>Next →</button><button onClick={copy}>Copy code</button><button onClick={download}>Download selection image</button><a className="btn btn-coral" href={quote(active)}>Ask about this design</a></div><p role="status" aria-live="polite">{status}</p><p className="bd-note">Screenshot this preview with its code, or download a selection image. Size, fabric and printing are confirmed in your quote.</p></div>}</dialog>
 </div></section>
}
