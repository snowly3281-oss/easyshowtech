import { defineType, defineField, defineArrayMember } from 'sanity'
import { CogIcon } from '@sanity/icons'
import { mediaField } from 'sanity-plugin-media'

/**
 * Site Settings — a singleton of global, client-editable values so nothing is
 * hardcoded. Only ONE instance should exist; that is enforced via the Studio
 * structure (../structure/index.ts), not a schema option — Sanity has no
 * `singleton: true`. The structure locks it to the fixed document id
 * "siteSettings".
 */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: '网站全局设置',
  type: 'document',
  icon: CogIcon,
  groups: [
    {name: 'contact', title: '公司与联系', default: true},
    {name: 'commerce', title: '价格与询盘'},
    {name: 'catalog', title: '产品公共选项'},
    {name: 'navigation', title: '导航与 Solution'},
    {name: 'footer', title: '页脚与社媒'},
    {name: 'downloads', title: '文件下载'},
  ],
  fields: [
    defineField({
      name: 'salesEmail',
      title: '销售询盘邮箱',
      type: 'string',
      group: 'contact',
      description: '前台联系页和邮件按钮使用的企业邮箱，也是运营人员接收询盘的主要邮箱。',
      initialValue: 'chris@coralpilates.com',
      validation: (rule) => rule.email().error('请填写有效的邮箱地址。'),
    }),
    defineField({
      name: 'phone',
      title: '联系电话',
      type: 'string',
      group: 'contact',
      description: '请包含国际区号，例如 +86 139 2197 4459。',
      initialValue: '+86 139 2197 4459',
    }),
    defineField({
      name: 'whatsapp',
      title: 'WhatsApp',
      type: 'string',
      group: 'contact',
      description: 'WhatsApp 悬浮按钮和询盘使用的号码，请包含国际区号，不要填写聊天链接。',
      initialValue: '+86 139 2197 4459',
    }),
    defineField({
      name: 'responseTime',
      title: '承诺回复时间',
      type: 'string',
      group: 'contact',
      description: '显示在询盘按钮附近，例如 one business day。',
      initialValue: 'one business day',
    }),
    defineField({
      name: 'showPrices',
      title: '全站显示价格',
      type: 'boolean',
      group: 'commerce',
      description:
        '价格总开关。关闭后，无论产品或配置单单独如何设置，前台均不显示价格；询盘功能不受影响。',
      initialValue: true,
    }),
    defineField({
      name: 'companyAddress',
      title: '公司地址',
      type: 'text',
      group: 'contact',
      rows: 3,
      description: '用于页脚和联系页面。建议填写可对外公开的完整英文地址。',
    }),
    mediaField({
      name: 'catalogPdf',
      title: '产品目录 PDF',
      type: 'file',
      group: 'downloads',
      mediaTags: ['scope-site', 'role-document'],
      description: '客户点击 Catalog 下载时获取的文件。更新文件后请检查前台下载链接。',
      options: { accept: 'application/pdf' },
    }),
    defineField({
      name: 'frameFinishes',
      title: '木制产品公共框架颜色',
      type: 'array',
      group: 'catalog',
      description:
        '显示在木制产品详情页的通用框架选项。这里只维护全站公共选项；单个产品的特殊材质请到产品的“材质与变体”中填写。',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'finish',
          fields: [
            defineField({ name: 'name', title: '颜色/材质名称', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'hex', title: '色卡 Hex', type: 'string', description: '例如 #C08F5A；必须以 # 开头。' }),
          ],
          preview: { select: { title: 'name', subtitle: 'hex' } },
        }),
      ],
    }),
    defineField({
      name: 'upholsteryColors',
      title: '公共皮革颜色',
      type: 'array',
      group: 'catalog',
      description:
        '显示在产品详情页的常用皮革颜色。定制颜色仍通过询盘确认，不建议在这里录入过多临时颜色。',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'upholsteryColor',
          fields: [
            defineField({ name: 'name', title: '颜色名称', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'hex', title: '色卡 Hex', type: 'string', description: '例如 #1F1F1F；必须以 # 开头。' }),
          ],
          preview: { select: { title: 'name', subtitle: 'hex' } },
        }),
      ],
    }),
    defineField({
      name: 'solutions',
      title: 'Solution 导航顺序',
      type: 'array',
      group: 'navigation',
      description:
        '拖动调整 Solution 在首页和导航中的显示顺序。同一个 Solution 不要重复添加。',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'solution' }] })],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'socialLinks',
      title: '页脚社媒链接',
      type: 'array',
      group: 'footer',
      description:
        '点击“添加项目/+”后，选择平台并粘贴完整链接。每添加并填写一项，页脚就显示一个对应图标；没有填写的网址不会显示。每个平台建议只添加一次。',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'socialLink',
          fields: [
            defineField({
              name: 'platform',
              title: '平台',
              type: 'string',
              options: {
                list: [
                  {title: 'LinkedIn', value: 'linkedin'},
                  {title: 'Instagram', value: 'instagram'},
                  {title: 'Facebook', value: 'facebook'},
                  {title: 'YouTube', value: 'youtube'},
                  {title: 'TikTok', value: 'tiktok'},
                  {title: 'X (Twitter)', value: 'x'},
                  {title: 'Pinterest', value: 'pinterest'},
                  {title: 'WhatsApp', value: 'whatsapp'},
                  {title: 'WeChat / 微信', value: 'wechat'},
                  {title: 'Alibaba.com', value: 'alibaba'},
                  {title: 'Made-in-China', value: 'made-in-china'},
                  {title: '其他平台', value: 'other'},
                ],
              },
              validation: (rule) => rule.required().error('请选择社媒平台。'),
            }),
            defineField({
              name: 'label',
              title: '自定义平台名称',
              type: 'string',
              description: '只有选择“其他平台”时才需要填写，例如 Vimeo。',
              hidden: ({parent}) => parent?.platform !== 'other',
              validation: (rule) =>
                rule.custom((value, context) =>
                  context.parent?.platform !== 'other' || value
                    ? true
                    : '请填写自定义平台名称。',
                ),
            }),
            defineField({
              name: 'url',
              title: '链接网址',
              type: 'url',
              description: '请粘贴完整公开链接，以 https:// 开头。',
              validation: (rule) =>
                rule
                  .required()
                  .uri({scheme: ['https']})
                  .error('请填写以 https:// 开头的有效链接。'),
            }),
          ],
          preview: {
            select: {platform: 'platform', label: 'label', subtitle: 'url'},
            prepare: ({platform, label, subtitle}) => ({
              title: platform === 'other' ? label || '其他平台' : platform || '未选择平台',
              subtitle,
            }),
          },
        }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: '网站全局设置' }),
  },
})
