import { defineType, defineField, defineArrayMember } from 'sanity'
import { CaseIcon } from '@sanity/icons'

/**
 * OEM services — a singleton composable page (one instance, id "oem").
 * The singleton is enforced in ../structure/index.ts and hidden from the
 * "New document" menu in ../sanity.config.ts. Reuses the same page-builder
 * blocks as `solution`.
 */
export const oem = defineType({
  name: 'oem',
  title: 'OEM / 品牌定制页面',
  type: 'document',
  icon: CaseIcon,
  groups: [
    { name: 'content', title: '页面内容', default: true },
    { name: 'facts', title: '已核验商业信息' },
    { name: 'seo', title: '搜索引擎 SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: '页面名称',
      type: 'string',
      group: 'content',
      initialValue: 'OEM services',
      description: '用于后台识别和浏览器标题的基础名称。',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'pageBuilder',
      title: '页面内容模块',
      type: 'array',
      group: 'content',
      description: '依次添加首屏、正文、FAQ 和询盘 CTA；拖动模块可改变前台顺序。',
      of: [
        defineArrayMember({ type: 'heroBlock' }),
        defineArrayMember({ type: 'ctaBlock' }),
        defineArrayMember({ type: 'textBlock' }),
        defineArrayMember({ type: 'faqsBlock' }),
      ],
    }),
    defineField({
      name: 'commercialFacts',
      title: 'OEM 数字、认证与合同承诺',
      type: 'object',
      group: 'facts',
      description:
        '这些内容会影响报价与合同预期。每项只有在填写并勾选“甲方已书面确认”后才会显示；未确认值不会出现在前台。',
      options: {collapsible: true, collapsed: false},
      fields: [
        defineField({
          name: 'standardMoq',
          title: '标准 MOQ',
          type: 'verifiedValue',
          description: '示例：20 units。',
        }),
        defineField({
          name: 'toolingFrom',
          title: '模具费起始价/区间',
          type: 'verifiedValue',
          description: '请包含币种，并说明是起始价还是区间。',
        }),
        defineField({
          name: 'flexibleMoq',
          title: '低量/样品订单 MOQ',
          type: 'verifiedValue',
          description: '请把适用条件写进显示值，例如：1 unit when tooling is covered。',
        }),
        defineField({
          name: 'leadTime',
          title: 'OEM 交期',
          type: 'verifiedValue',
          description: '请说明起算点，例如：60–90 days after sample approval。',
        }),
        defineField({
          name: 'activeClients',
          title: '活跃 OEM 客户数',
          type: 'verifiedValue',
        }),
        defineField({
          name: 'toolingQuote',
          title: '模具报价说明',
          type: 'verifiedValue',
          description: '用于 OEM 八步流程中的 Tooling quote。',
        }),
        defineField({
          name: 'ndaTerm',
          title: 'NDA 类型与期限',
          type: 'verifiedValue',
          description: '示例：Mutual NDA before files move；期限必须与合同一致。',
        }),
        defineField({
          name: 'brandedSpringColour',
          title: '品牌弹簧颜色定制',
          type: 'verifiedValue',
          description: '如果仅部分型号/起订量适用，请写明条件。',
        }),
        defineField({
          name: 'certificationScope',
          title: 'CE / ISO 等认证适用范围',
          type: 'verifiedValue',
          description:
            '不要只写 Yes。请写明认证名称、适用产品/体系与限制。',
        }),
        defineField({
          name: 'dedicatedLines',
          title: '独立/隔离生产线',
          type: 'verifiedValue',
        }),
        defineField({
          name: 'operatorNdas',
          title: '员工/操作员保密安排',
          type: 'verifiedValue',
        }),
        defineField({
          name: 'toolingEscrow',
          title: '模具文件托管安排',
          type: 'verifiedValue',
        }),
        defineField({
          name: 'patentFilingHelp',
          title: '专利申请协助',
          type: 'verifiedValue',
        }),
        defineField({
          name: 'nonSupplyCommitment',
          title: '不供货承诺',
          type: 'verifiedValue',
          description: '期限与范围必须与合同一致。',
        }),
        defineField({
          name: 'breachRemedy',
          title: '违约责任/补救措施',
          type: 'verifiedValue',
          description: '必须由甲方或法务确认，不可由技术方填写。',
        }),
        defineField({
          name: 'toolingOwnership',
          title: '模具所有权',
          type: 'verifiedValue',
          description: '填写与实际合同一致的公开说明。',
        }),
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO 设置',
      type: 'seo',
      group: 'seo',
      description: '留空时前台使用页面名称与首屏简介。',
    }),
  ],
  preview: {
    prepare: () => ({ title: 'OEM / 品牌定制页面', subtitle: '前台路径：/oem-services' }),
  },
})
