import {defineArrayMember, defineField, defineType} from "sanity";
import {TranslateIcon} from "@sanity/icons";
import {
  DEFAULT_PROTECTED_PHRASES,
  DEFAULT_TRANSLATION_STYLE_GUIDE,
  TARGET_LANGUAGES,
} from "../config/i18n";

export const translationSettings = defineType({
  name: "translationSettings",
  title: "翻译设置",
  type: "document",
  icon: TranslateIcon,
  groups: [
    {name: "workflow", title: "翻译流程", default: true},
    {name: "terminology", title: "术语与语气"},
    {name: "safety", title: "审核与安全"},
  ],
  fields: [
    defineField({
      name: "enabled",
      title: "启用多语言内容",
      type: "boolean",
      group: "workflow",
      initialValue: true,
      description:
        "开启后，前台会优先读取对应语言的已发布文档；缺失时安全回退到英文。",
    }),
    defineField({
      name: "autoTranslateOnPublish",
      title: "英文发布后自动同步四种语言",
      type: "boolean",
      group: "workflow",
      initialValue: false,
      description:
        "普通内容会由 DeepSeek 自动翻译并发布；法律与政策页面只生成待审核草稿。",
    }),
    defineField({
      name: "targetLanguages",
      title: "目标语言",
      type: "array",
      group: "workflow",
      description: "首期固定为西班牙语、法语、德语和意大利语。",
      of: [defineArrayMember({type: "string"})],
      options: {
        list: TARGET_LANGUAGES.map(({id, title}) => ({value: id, title})),
        layout: "grid",
      },
      initialValue: TARGET_LANGUAGES.map(({id}) => id),
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: "provider",
      title: "翻译引擎",
      type: "string",
      group: "workflow",
      initialValue: "deepseek",
      readOnly: true,
      options: {
        list: [
          {
            title: "DeepSeek（服务端自动翻译）",
            value: "deepseek",
          },
        ],
      },
      description:
        "API Key 保存在 Sanity Function Secret 中，不会发送到浏览器，也不会存入内容库。",
    }),
    defineField({
      name: "model",
      title: "DeepSeek 模型",
      type: "string",
      group: "workflow",
      initialValue: "deepseek-v4-flash",
      options: {
        list: [
          {
            title: "DeepSeek V4 Flash（推荐，速度与成本平衡）",
            value: "deepseek-v4-flash",
          },
          {
            title: "DeepSeek V4 Pro（重要长文可选）",
            value: "deepseek-v4-pro",
          },
        ],
      },
      description:
        "更换模型后，下一次英文发布或批量翻译任务自动生效。",
    }),
    defineField({
      name: "providerStatus",
      title: "翻译服务状态",
      type: "string",
      group: "workflow",
      readOnly: true,
      options: {
        list: [
          {title: "连接正常", value: "connected"},
          {title: "连接或翻译失败", value: "error"},
        ],
      },
      description: "由后台翻译 Function 自动更新。",
    }),
    defineField({
      name: "lastProviderCheckAt",
      title: "最近一次服务检查",
      type: "datetime",
      group: "workflow",
      readOnly: true,
    }),
    defineField({
      name: "lastProviderModel",
      title: "最近使用的模型",
      type: "string",
      group: "workflow",
      readOnly: true,
    }),
    defineField({
      name: "lastProviderError",
      title: "最近一次错误",
      type: "text",
      rows: 3,
      group: "workflow",
      readOnly: true,
      hidden: ({document}) => document?.providerStatus !== "error",
      description:
        "用于管理员排查 Key、余额、网络或内容格式问题；成功后会自动清空。",
    }),
    defineField({
      name: "styleGuide",
      title: "翻译语气与规则",
      type: "text",
      rows: 8,
      group: "terminology",
      initialValue: DEFAULT_TRANSLATION_STYLE_GUIDE,
      description:
        "用于约束自动翻译的语气、事实边界和术语。建议由品牌负责人维护英文规则。",
      validation: (rule) =>
        rule.max(2000).warning("建议控制在 2,000 个字符以内。"),
    }),
    defineField({
      name: "protectedPhrases",
      title: "禁止翻译/必须保留的词",
      type: "array",
      group: "terminology",
      of: [defineArrayMember({type: "string"})],
      initialValue: DEFAULT_PROTECTED_PHRASES,
      description:
        "品牌名、SKU、型号、器械专有名称等。每个词单独添加一项。",
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: "legalReviewRequired",
      title: "法律与政策页面必须人工审核",
      type: "boolean",
      group: "safety",
      initialValue: true,
      readOnly: true,
      description:
        "固定开启。Privacy、Terms、Warranty、Returns、Shipping 的机器翻译只能成为草稿。",
    }),
    defineField({
      name: "publishPolicy",
      title: "翻译发布规则",
      type: "string",
      group: "safety",
      initialValue: "review",
      readOnly: true,
      options: {
        list: [
          {
            title: "普通内容自动发布；法律页面生成草稿并人工审核",
            value: "review",
          },
        ],
      },
      description:
        "产品、Solution、文章和营销页自动公开；法律条款保持人工审核边界。",
    }),
  ],
  preview: {
    prepare: () => ({
      title: "多语言翻译设置",
      subtitle: "English → ES / FR / DE / IT",
    }),
  },
});
