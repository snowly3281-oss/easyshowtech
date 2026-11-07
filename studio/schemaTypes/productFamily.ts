import {defineField, defineType, defineArrayMember} from 'sanity'
import {FolderIcon} from '@sanity/icons'

/**
 * Internal grouping for product models that share the same structural platform.
 * Families organize the Studio and catalog; they do not create public URLs.
 */
export const productFamily = defineType({
  name: 'productFamily',
  title: '产品家族 Product Family',
  type: 'document',
  icon: FolderIcon,
  groups: [
    {name: 'content', title: '基础内容', default: true},
    {name: 'classification', title: '分类关系'},
  ],
  orderings: [{title: '显示顺序', name: 'sortOrder', by: [{field: 'sortOrder', direction: 'asc'}, {field: 'title', direction: 'asc'}]}],
  fields: [
    defineField({name: 'title', title: '产品家族名称', type: 'string', group: 'content', validation: rule => rule.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', group: 'content', options: {source: 'title', maxLength: 96}, validation: rule => rule.required()}),
    defineField({name: 'productCategory', title: '产品分类', type: 'reference', group: 'classification', to: [{type: 'productCategory'}]}),
    defineField({name: 'description', title: '家族说明', type: 'text', rows: 3, group: 'content', description: '仅填写同一家族产品共用的结构或采购信息。'}),
    defineField({
      name: 'sharedFeatures', title: '共用特点', type: 'array', group: 'content',
      of: [defineArrayMember({type: 'object', name: 'familyFeature', fields: [
        defineField({name: 'title', title: '特点', type: 'string', validation: rule => rule.required()}),
        defineField({name: 'description', title: '说明', type: 'text', rows: 2}),
      ], preview: {select: {title: 'title', subtitle: 'description'}}})],
    }),
    defineField({
      name: 'sharedSpecifications', title: '共用规格', type: 'array', group: 'content',
      of: [defineArrayMember({type: 'object', name: 'familySpecification', fields: [
        defineField({name: 'label', title: '参数名称', type: 'string', validation: rule => rule.required()}),
        defineField({name: 'value', title: '参数值', type: 'string', validation: rule => rule.required()}),
        defineField({name: 'unit', title: '单位', type: 'string'}),
        defineField({name: 'note', title: '补充说明', type: 'string'}),
      ], preview: {select: {title: 'label', subtitle: 'value'}}})],
    }),
    defineField({name: 'image', title: '家族图片', type: 'image', group: 'content', options: {hotspot: true}, fields: [{name: 'alt', title: '替代文字', type: 'string'}]}),
    defineField({name: 'sortOrder', title: '显示顺序', type: 'number', group: 'content'}),
    defineField({name: 'isActive', title: '启用', type: 'boolean', group: 'content', initialValue: true}),
  ],
  preview: {select: {title: 'title', subtitle: 'productCategory.title', media: 'image'}},
})
