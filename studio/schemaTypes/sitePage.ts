import {defineArrayMember, defineField, defineType} from "sanity";
import {DocumentIcon} from "@sanity/icons";
import type {ReactNode} from "react";

/**
 * A fixed-route website page. Structure Builder pins these documents to the
 * definitions in config/sitePages.ts so operators see named pages rather than
 * a generic bucket of documents.
 */
export const sitePage = defineType({
  name: "sitePage",
  title: "网站页面",
  type: "document",
  icon: DocumentIcon,
  groups: [
    {name: "content", title: "页面内容", default: true},
    {name: "body", title: "正文与模块"},
    {name: "seo", title: "搜索引擎 SEO"},
    {name: "system", title: "系统信息"},
  ],
  fields: [
    defineField({
      name: "pageKey",
      title: "页面标识（系统）",
      type: "string",
      group: "system",
      readOnly: true,
      description: "系统用于识别页面的固定值，请勿修改。",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "route",
      title: "前台网址（系统）",
      type: "string",
      group: "system",
      readOnly: true,
      description: "该内容对应的前台路径。修改内容后可通过预览标签查看。",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "title",
      title: "页面名称",
      type: "string",
      group: "content",
      description: "用于后台识别和页面主标题。示例：About Coral Pilates。",
      validation: (rule) => rule.required().error("请填写页面名称。"),
    }),
    defineField({
      name: "navigationLabel",
      title: "导航显示名称",
      type: "string",
      group: "content",
      description: "可选。留空时使用页面名称；仅在该页面出现在导航中时生效。",
    }),
    defineField({
      name: "hero",
      title: "页面首屏",
      type: "heroBlock",
      group: "content",
      description: "页面顶部的标题、简介、主图与行动按钮。",
    }),
    defineField({
      name: "introduction",
      title: "页面简介",
      type: "text",
      rows: 4,
      group: "content",
      description: "用于列表、分享或首屏下方的简短介绍，建议 60–180 个字。",
      validation: (rule) =>
        rule.max(500).warning("页面简介建议控制在 500 个字符以内。"),
    }),
    defineField({
      name: "sections",
      title: "页面内容模块",
      type: "array",
      group: "body",
      description:
        "按顺序添加内容模块，可拖动调整。没有把握时只修改现有模块，不要随意删除。",
      of: [
        defineArrayMember({type: "textBlock"}),
        defineArrayMember({type: "ctaBlock"}),
        defineArrayMember({type: "faqsBlock"}),
      ],
    }),
    defineField({
      name: "aboutFacts",
      title: "关于我们｜待确认数据与履历",
      type: "object",
      group: "body",
      hidden: ({document}) => document?.pageKey !== "about",
      description:
        "这里管理 About 页的数字、创始人履历与里程碑。每项只有在填写并勾选“甲方已书面确认”后才会显示。",
      options: {collapsible: true, collapsed: false},
      fields: [
        defineField({
          name: "yearsManufacturing",
          title: "从业/制造年限",
          type: "verifiedValue",
          description: "前台标签：Years manufacturing。示例：15+ years。",
        }),
        defineField({
          name: "unitsShipped",
          title: "累计出货量",
          type: "verifiedValue",
          description: "前台标签：Units shipped。请包含计量单位。",
        }),
        defineField({
          name: "countriesServed",
          title: "服务国家/地区数量",
          type: "verifiedValue",
          description:
            "同时用于规模数据和 Trusted worldwide 标题。示例：60+ countries。",
        }),
        defineField({
          name: "productPatents",
          title: "产品专利数量",
          type: "verifiedValue",
        }),
        defineField({
          name: "founderExperience",
          title: "创始人行业经验",
          type: "verifiedValue",
          description:
            "示例：15+ years in Pilates equipment manufacturing。",
        }),
        defineField({
          name: "founderFactoryRole",
          title: "创始人工厂/生产职责",
          type: "verifiedValue",
          description: "请用一句可公开、可核验的英文履历描述。",
        }),
        defineField({
          name: "founderClientRole",
          title: "创始人客户/OEM职责",
          type: "verifiedValue",
          description: "请用一句可公开、可核验的英文履历描述。",
        }),
        defineField({
          name: "factorySize",
          title: "工厂面积",
          type: "verifiedValue",
          description: "请带单位，例如：2,500 m²。",
        }),
        defineField({
          name: "machines",
          title: "主要生产设备/机器数量",
          type: "verifiedValue",
        }),
        defineField({
          name: "productionLines",
          title: "生产线数量",
          type: "verifiedValue",
        }),
        defineField({
          name: "annualCapacity",
          title: "年产能",
          type: "verifiedValue",
          description: "请明确统计口径与单位。",
        }),
        defineField({
          name: "milestones",
          title: "发展里程碑",
          type: "array",
          description:
            "只有勾选已确认的里程碑会公开。按年份从早到晚排列。",
          of: [
            defineArrayMember({
              type: "object",
              name: "verifiedMilestone",
              fields: [
                defineField({
                  name: "year",
                  title: "年份",
                  type: "string",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "title",
                  title: "里程碑标题",
                  type: "string",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "description",
                  title: "说明",
                  type: "text",
                  rows: 2,
                }),
                defineField({
                  name: "confirmed",
                  title: "甲方已书面确认，可公开",
                  type: "boolean",
                  initialValue: false,
                }),
                defineField({
                  name: "evidence",
                  title: "确认依据（仅后台）",
                  type: "text",
                  rows: 2,
                }),
              ],
              preview: {
                select: {
                  title: "title",
                  year: "year",
                  confirmed: "confirmed",
                },
                prepare: ({
                  title,
                  year,
                  confirmed,
                }: {
                  title?: string;
                  year?: string;
                  confirmed?: boolean;
                }) => ({
                  title: `${year || "年份待填"} · ${title || "未命名"}`,
                  subtitle: confirmed ? "已确认" : "未确认 · 前台不会显示",
                }),
              },
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: "factoryFacts",
      title: "工厂页｜待确认数据与业务承诺",
      type: "object",
      group: "body",
      hidden: ({document}) => document?.pageKey !== "factory",
      description:
        "这里管理 Factory 页的产能、公差、认证与 OEM 承诺。每项只有在填写并勾选“甲方已书面确认”后才会显示。",
      options: {collapsible: true, collapsed: false},
      fields: [
        defineField({
          name: "floorArea",
          title: "工厂面积",
          type: "verifiedValue",
          description: "Hero 统计，包含单位。",
        }),
        defineField({
          name: "teamMembers",
          title: "团队总人数",
          type: "verifiedValue",
          description: "Hero 统计；也可与下方总团队人数保持一致。",
        }),
        defineField({
          name: "productionLines",
          title: "生产线数量",
          type: "verifiedValue",
        }),
        defineField({
          name: "manufacturingSteps",
          title: "标准制造步骤数量",
          type: "verifiedValue",
        }),
        defineField({
          name: "manufacturingStages",
          title: "11 步制造流程",
          type: "array",
          description:
            "按前台展示顺序维护制造流程。编号、标题和说明会公开；图片可后续逐步补齐。",
          of: [
            defineArrayMember({
              type: "object",
              name: "factoryStage",
              fields: [
                defineField({
                  name: "number",
                  title: "步骤编号",
                  type: "string",
                  description: "建议使用两位数字，例如 01、02。",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "title",
                  title: "步骤标题",
                  type: "string",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "description",
                  title: "步骤说明",
                  type: "text",
                  rows: 3,
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "tag",
                  title: "步骤标签",
                  type: "string",
                  description: "简短分类，例如 Materials、Precision、QC。",
                }),
                defineField({
                  name: "image",
                  title: "步骤图片",
                  type: "image",
                  options: {hotspot: true},
                  fields: [
                    defineField({
                      name: "alt",
                      title: "替代文字 Alt",
                      type: "string",
                    }),
                  ],
                }),
              ],
              preview: {
                select: {
                  number: "number",
                  title: "title",
                  media: "image",
                },
                prepare: ({
                  number,
                  title,
                  media,
                }: {
                  number?: string;
                  title?: string;
                  media?: ReactNode;
                }) => ({
                  title: `${number || "--"} · ${title || "未命名步骤"}`,
                  subtitle: "制造流程",
                  media,
                }),
              },
            }),
          ],
          validation: (rule) =>
            rule
              .unique()
              .max(20)
              .warning("当前确认流程为 11 步；增加或删除前请核对甲方工艺资料。"),
        }),
        defineField({
          name: "cncTolerance",
          title: "CNC / 激光加工公差",
          type: "verifiedValue",
          description: "示例：±0.2 mm。没有工艺文件依据时不要勾选公开。",
        }),
        defineField({
          name: "annualCapacity",
          title: "年产能",
          type: "verifiedValue",
          description: "请明确统计口径与单位。",
        }),
        defineField({
          name: "productionTeam",
          title: "生产团队人数",
          type: "verifiedValue",
        }),
        defineField({
          name: "totalTeam",
          title: "团队总人数（产能卡片）",
          type: "verifiedValue",
        }),
        defineField({
          name: "certifications",
          title: "认证/合规声明",
          type: "array",
          description:
            "每张证书单独添加；请在确认依据中记录证书编号、适用产品和有效期。",
          of: [defineArrayMember({type: "verifiedValue"})],
        }),
        defineField({
          name: "dedicatedLines",
          title: "OEM 专属/隔离生产线承诺",
          type: "verifiedValue",
          description:
            "填写实际可履行的公开说法；不要直接照抄设计稿。",
        }),
        defineField({
          name: "mutualNda",
          title: "设计交换前 NDA 承诺",
          type: "verifiedValue",
          description: "填写 NDA 类型、触发时点与实际可执行范围。",
        }),
        defineField({
          name: "nonSupplyCommitment",
          title: "不供货/知识产权承诺",
          type: "verifiedValue",
          description: "必须与实际 OEM 合同条款一致。",
        }),
      ],
    }),
    defineField({
      name: "legalBody",
      title: "政策/长文正文",
      type: "richContent",
      group: "body",
      description:
        "法律政策或需要连续阅读的长文请填写这里；普通营销页面优先使用上面的内容模块。",
    }),
    defineField({
      name: "effectiveDate",
      title: "生效日期",
      type: "date",
      group: "body",
      description: "仅用于隐私、条款、质保、退换货和运输政策等页面。",
      hidden: ({document}) =>
        !["privacy", "terms", "warranty", "returns", "shipping"].includes(
          String(document?.pageKey ?? ""),
        ),
    }),
    defineField({
      name: "seo",
      title: "SEO 设置",
      type: "seo",
      group: "seo",
      description:
        "留空时会自动使用页面名称和简介。只有需要单独优化搜索结果时才填写。",
    }),
  ],
  preview: {
    select: {title: "title", route: "route"},
    prepare: ({title, route}: {title?: string; route?: string}) => ({
      title: title || "未命名页面",
      subtitle: route ? `前台路径：${route}` : "尚未设置前台路径",
    }),
  },
});
