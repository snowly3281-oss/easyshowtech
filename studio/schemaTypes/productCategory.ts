import { defineField, defineType } from 'sanity'
import { TagIcon } from '@sanity/icons'

/** SEO landing taxonomy. Optional on existing Products during staged migration. */
export const productCategory = defineType({
  name: 'productCategory',
  title: '产品分类落地页',
  type: 'document',
  icon: TagIcon,
  groups: [
    { name: 'content', title: '内容', default: true },
    { name: 'classification', title: '分类关系' },
    { name: 'seo', title: 'SEO' },
  ],
  orderings: [{ title: '显示顺序', name: 'sortOrder', by: [{ field: 'sortOrder', direction: 'asc' }] }],
  fields: [
    defineField({ name: 'title', title: '分类名称', type: 'string', group: 'content', description: '页面 H1 与客户可见分类名。铝制帐篷框架页面按规格填写 “Aluminum Canopy Tent Frames”。', validation: rule => rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', group: 'content', options: { source: 'title', maxLength: 96 }, validation: rule => rule.required() }),
    defineField({ name: 'productType', title: '产品类型', type: 'string', group: 'classification', options: { list: [
      { title: 'Custom Displays', value: 'customDisplay' },
      { title: 'Hardware & Frames', value: 'hardware' },
      { title: 'Parts & Accessories', value: 'partAccessory' },
    ] }, validation: rule => rule.required() }),
    defineField({ name: 'productSeries', title: '所属产品系列', type: 'array', group: 'classification', of: [{ type: 'reference', to: [{ type: 'series' }] }], validation: rule => rule.unique() }),
    defineField({ name: 'description', title: '分类描述', type: 'text', rows: 3, group: 'content' }),
    defineField({ name: 'intro', title: '介绍正文', type: 'array', group: 'content', of: [{ type: 'block' }] }),
    defineField({ name: 'contentBlocks', title: '页面内容模块', type: 'array', group: 'content', description: '仅添加已经有真实资料支持的内容模块；没有数据的模块不显示。', of: [{ type: 'block' }] }),
    defineField({ name: 'heroImage', title: '主视觉图片', type: 'image', group: 'content', options: { hotspot: true }, fields: [{ name: 'alt', title: '替代文字', type: 'string' }] }),
    defineField({ name: 'relatedPrintingServices', title: '相关印刷服务', type: 'array', group: 'classification', of: [{ type: 'reference', to: [{ type: 'service' }] }], validation: rule => rule.unique() }),
    defineField({ name: 'relatedSolutions', title: '相关解决方案', type: 'array', group: 'classification', of: [{ type: 'reference', to: [{ type: 'solution' }] }], validation: rule => rule.unique() }),
    defineField({ name: 'relatedCategories', title: '相关产品分类', type: 'array', group: 'classification', description: '铝制帐篷框架分类页需关联已启用的 Custom Canopy Tents 分类；只关联有在售产品的分类。', of: [{ type: 'reference', to: [{ type: 'productCategory' }], weak: true }], validation: rule => rule.unique() }),
    defineField({ name: 'sortOrder', title: '显示顺序', type: 'number', group: 'content' }),
    defineField({ name: 'isActive', title: '启用分类页', type: 'boolean', initialValue: false, group: 'content' }),
    defineField({ name: 'seo', title: 'SEO 设置', type: 'seo', group: 'seo' }),
  ],
  preview: { select: { title: 'title', subtitle: 'slug.current', media: 'heroImage' } },
})
