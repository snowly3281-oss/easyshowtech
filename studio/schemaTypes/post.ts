import {defineArrayMember, defineField, defineType} from "sanity";
import {DocumentTextIcon} from "@sanity/icons";
import {mediaField} from "sanity-plugin-media";
import {AUDIENCE_OPTIONS} from "./lib/audience";
import {SeoChecklistInput} from "../components/SeoChecklistInput";

/**
 * Editorial resource/article.
 *
 * `body` keeps the same Portable Text array shape used by the original schema
 * and uses Sanity's native editor. Existing text/image blocks therefore remain
 * valid while new editorial modules remain available from the insert menu.
 */
export const post = defineType({
  name: "post",
  title: "文章与资源",
  type: "document",
  icon: DocumentTextIcon,
  options: {
    canvasApp: {
      purpose:
        "用于 Coral Pilates 英文资源文章。Canvas 负责标题、摘要和正文的长文撰写；发布设置、分类、关联内容、SEO 与翻译流程在 Studio 中完成。",
    },
  },
  groups: [
    {name: "content", title: "文章内容", default: true},
    {name: "publishing", title: "发布信息"},
    {name: "taxonomy", title: "分类与标签"},
    {name: "relationships", title: "关联内容"},
    {name: "seo", title: "搜索引擎 SEO"},
  ],
  orderings: [
    {
      title: "发布时间（最新）",
      name: "publishedAtDesc",
      by: [{field: "publishedAt", direction: "desc"}],
    },
    {
      title: "最近更新",
      name: "updatedAtDesc",
      by: [{field: "_updatedAt", direction: "desc"}],
    },
    {
      title: "标题 A–Z",
      name: "titleAsc",
      by: [{field: "title", direction: "asc"}],
    },
  ],
  fields: [
    defineField({
      name: "title",
      title: "文章标题",
      type: "string",
      group: "content",
      description: "前台文章主标题。建议清楚说明读者能获得什么信息。",
      options: {
        canvasApp: {
          purpose:
            "文章的唯一主标题，不是正文小标题，也不要包含编辑备注。",
        },
      },
      validation: (rule) =>
        rule
          .required()
          .error("请填写文章标题。")
          .max(120)
          .warning("标题建议控制在 120 个字符以内。"),
    }),
    defineField({
      name: "slug",
      title: "网址标识 Slug",
      type: "slug",
      group: "content",
      description:
        "决定文章网址 /resources/[slug]。只使用小写英文、数字和连字符；发布后不要随意修改。",
      options: {
        source: "title",
        maxLength: 96,
        canvasApp: {exclude: true},
      },
      validation: (rule) => rule.required().error("请生成网址标识。"),
    }),
    defineField({
      name: "excerpt",
      title: "文章摘要",
      type: "text",
      group: "content",
      rows: 4,
      description:
        "显示在资源列表卡片和搜索结果中。建议 80–180 个字符，直接概括文章价值。",
      options: {
        canvasApp: {
          purpose:
            "供文章列表卡片和搜索结果使用的简短摘要，不是正文导语。",
        },
      },
      validation: (rule) =>
        rule.max(240).warning("摘要建议控制在 240 个字符以内。"),
    }),
    mediaField({
      name: "coverImage",
      title: "文章首图 Featured Image",
      type: "image",
      mediaTags: ["scope-post", "role-blog-cover"],
      group: "content",
      description:
        "显示在文章列表和文章顶部。推荐横向 16:9，至少 1600×900 px。",
      options: {
        hotspot: true,
        canvasApp: {exclude: true},
      },
      fields: [
        defineField({
          name: "alt",
          title: "替代文字 Alt",
          type: "string",
          description: "描述图片内容，不要填写文件名；有助于无障碍访问和 SEO。",
          validation: (rule) =>
            rule.required().warning("建议填写图片 Alt 文字。"),
        }),
      ],
    }),
    defineField({
      name: "body",
      title: "文章正文",
      type: "richContent",
      group: "content",
      description:
        "文章的完整正文。可以在 Canvas 中专注撰写长文，再发送到 Studio 补充首图、表格、产品、Solution、下载、FAQ 和 CTA 等结构化模块。",
      options: {
        canvasApp: {
          purpose:
            "文章的完整长文正文，可包含段落、H2–H4 标题、列表、引用、链接和正文图片。",
        },
      },
      validation: (rule) =>
        rule.required().min(1).error("文章正文不能为空。"),
    }),

    defineField({
      name: "editorialStatus",
      title: "编辑流程状态",
      type: "string",
      group: "publishing",
      description:
        "用于团队内部协作，不等同于右上角的 Sanity Publish。只有点击 Publish 后内容才会进入正式数据。",
      options: {
        canvasApp: {exclude: true},
        list: [
          {title: "撰写中", value: "writing"},
          {title: "等待审核", value: "review"},
          {title: "可以发布", value: "ready"},
          {title: "已完成", value: "complete"},
        ],
        layout: "radio",
      },
      initialValue: "writing",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "前台发布日期",
      type: "datetime",
      group: "publishing",
      description:
        "用于文章排序和前台显示日期。它不会自动发布文章；正式上线仍需点击右上角 Publish。",
      options: {canvasApp: {exclude: true}},
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "featured",
      title: "设为精选文章",
      type: "boolean",
      group: "publishing",
      description: "开启后可在资源首页或首页重点推荐；是否显示取决于前台版位。",
      options: {canvasApp: {exclude: true}},
      initialValue: false,
    }),
    defineField({
      name: "author",
      title: "文章作者",
      type: "reference",
      group: "publishing",
      to: [{type: "postAuthor"}],
      description: "选择前台显示的署名作者。没有合适作者时先到“作者管理”中新建。",
      options: {canvasApp: {exclude: true}},
    }),

    defineField({
      name: "categories",
      title: "文章分类",
      type: "array",
      group: "taxonomy",
      description:
        "稳定的内容栏目，一篇文章建议选择 1–2 个。不要为了单篇文章随意新建分类。",
      of: [
        defineArrayMember({type: "reference", to: [{type: "postCategory"}]}),
      ],
      options: {canvasApp: {exclude: true}},
      validation: (rule) => rule.unique().max(3),
    }),
    defineField({
      name: "tags",
      title: "文章标签",
      type: "array",
      group: "taxonomy",
      description:
        "描述文章的具体主题，一篇文章建议 2–6 个。标签可以跨分类使用。",
      of: [defineArrayMember({type: "reference", to: [{type: "postTag"}]})],
      options: {canvasApp: {exclude: true}},
      validation: (rule) => rule.unique().max(8),
    }),
    defineField({
      name: "audience",
      title: "目标客户",
      type: "array",
      group: "taxonomy",
      description: "选择这篇内容主要面向的买家类型，用于推荐和内容筛选。",
      of: [defineArrayMember({type: "string"})],
      options: {
        list: AUDIENCE_OPTIONS,
        canvasApp: {exclude: true},
      },
      validation: (rule) => rule.unique(),
    }),

    defineField({
      name: "solutions",
      title: "关联解决方案",
      type: "array",
      group: "relationships",
      description:
        "文章结尾可引导读者进入相关 Solution；Solution 后台会自动显示引用它的文章。",
      of: [
        defineArrayMember({type: "reference", to: [{type: "solution"}]}),
      ],
      options: {canvasApp: {exclude: true}},
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: "relatedProducts",
      title: "关联产品",
      type: "array",
      group: "relationships",
      description:
        "文章整体关联的产品，用于推荐和反向关系视图。正文中需要展示具体产品卡片时，请插入“关联产品”内容模块。",
      of: [
        defineArrayMember({type: "reference", to: [{type: "product"}]}),
      ],
      options: {canvasApp: {exclude: true}},
      validation: (rule) => rule.unique().max(12),
    }),
    defineField({
      name: "relatedPosts",
      title: "延伸阅读",
      type: "array",
      group: "relationships",
      description: "选择文章结尾推荐的延伸阅读，建议不超过 4 篇。",
      of: [defineArrayMember({type: "reference", to: [{type: "post"}]})],
      options: {canvasApp: {exclude: true}},
      validation: (rule) => rule.unique().max(4),
    }),

    defineField({
      name: "seo",
      title: "SEO 设置",
      type: "seo",
      group: "seo",
      components: {
        input: SeoChecklistInput,
      },
      options: {canvasApp: {exclude: true}},
      description:
        "留空时自动使用文章标题、摘要和首图。仅在需要单独优化搜索结果时填写。",
    }),
  ],
  preview: {
    select: {
      title: "title",
      date: "publishedAt",
      media: "coverImage",
      author: "author.name",
      status: "editorialStatus",
    },
    prepare: ({
      title,
      date,
      media,
      author,
      status,
    }: {
      title?: string;
      date?: string;
      media?: any;
      author?: string;
      status?: string;
    }) => {
      const statusLabel: Record<string, string> = {
        writing: "撰写中",
        review: "等待审核",
        ready: "可以发布",
        complete: "已完成",
      };
      const parts = [
        status ? statusLabel[status] || status : "未设置流程状态",
        author || "未设置作者",
        date ? String(date).slice(0, 10) : "未设置日期",
      ];
      return {
        title: title || "未命名文章",
        subtitle: parts.join(" · "),
        media,
      };
    },
  },
});
