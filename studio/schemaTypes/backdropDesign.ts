import {defineType,defineField} from 'sanity'
export const backdropDesign=defineType({name:'backdropDesign',title:'背景图案库 / Backdrop Designs',type:'document',fields:[
 defineField({name:'code',title:'永久款式编号 / Design code',type:'string',description:'Use a permanent code such as ES-BD-001. Do not reuse or change codes already sent to customers.',validation:Rule=>Rule.required().regex(/^ES-BD-[A-Z0-9-]+$/).custom(async(value,context)=>{if(!value)return true;const id=context.document?._id.replace(/^drafts\./,'');const duplicate=await context.getClient({apiVersion:'2024-10-01'}).fetch('count(*[_type=="backdropDesign" && code==$code && !(_id in [$id,$draft])])',{code:value,id,draft:`drafts.${id}`});return duplicate?'This code is already in use':true})}),
 defineField({name:'title',title:'图案名称 / Name',type:'string',validation:Rule=>Rule.required().max(100)}),
 defineField({name:'description',title:'图案介绍 / Design description',type:'text',rows:3,description:'Short customer-facing description shown on hover and in the mobile preview.',validation:Rule=>Rule.required().max(500)}),
 defineField({name:'category',title:'分类 / Category',type:'string',description:'For example Texture, Floral, Wedding or Seasonal. Use consistent names.',validation:Rule=>Rule.required()}),
 defineField({name:'image',title:'图案预览 / Design preview',type:'image',options:{hotspot:true},fields:[defineField({name:'alt',title:'Image description',type:'string',validation:Rule=>Rule.required()})],validation:Rule=>Rule.required()}),
 defineField({name:'rightsConfirmed',title:'已确认自有或获授权 / Rights confirmed',type:'boolean',initialValue:false,validation:Rule=>Rule.custom((v,ctx)=>ctx.document?.isActive&&!v?'Confirm image rights before listing':true)}),
 defineField({name:'isActive',title:'上架 / Visible in catalog',type:'boolean',initialValue:false}),
 defineField({name:'sortOrder',title:'排序 / Sort order',type:'number',initialValue:100}),
],preview:{select:{title:'code',subtitle:'title',media:'image'}},orderings:[{title:'Catalog order',name:'catalogOrder',by:[{field:'sortOrder',direction:'asc'},{field:'code',direction:'asc'}]}]})
