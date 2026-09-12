import {defineArrayMember, defineField, defineType} from "sanity";
import {
  BlockContentIcon,
  BlockquoteIcon,
  CodeBlockIcon,
  DocumentPdfIcon,
  ImagesIcon,
  LinkIcon,
  MasterDetailIcon,
  PackageIcon,
  PlayIcon,
  ProjectsIcon,
  RemoveIcon,
  WarningOutlineIcon,
} from "@sanity/icons";
import {mediaField} from "sanity-plugin-media";
import {TableImportInput} from "../../components/TableImportInput";

export const richContent = defineType({
  name: "richContent",
  title: "文章内容模块",
  type: "array",
  options: {
    // Use Sanity's native insert menu rather than a custom overlay. It is
    // maintained with the Studio editor and keeps adding/removing blocks
    // reliable even after tables, images, or other object blocks are inserted.
    insertMenu: {
      filter: true,
      showIcons: true,
      groups: [
        {
          name: "writing",
          title: "文字与排版",
          of: ["block", "postCodeBlock", "postDividerBlock"],
        },
        {
          name: "media",
          title: "图片与视频",
          of: ["image", "postImageBlock", "postGalleryBlock", "postVideoBlock"],
        },
        {
          name: "conversion",
          title: "业务内容模块",
          of: [
            "postCalloutBlock",
            "postTableBlock",
            "table",
            "postProductBlock",
            "postSolutionBlock",
            "postDownloadBlock",
            "postCtaBlock",
            "faqsBlock",
          ],
        },
      ],
    },
  },
  components: {
    portableText: {
      plugins: (props) =>
        props.renderDefault({
          ...props,
          plugins: {
            ...props.plugins,
            table: {enabled: true},
          },
        }),
    },
  },
  of: [
    defineArrayMember({
      type: "block",
      title: "文字",
      styles: [
        {title: "正文", value: "normal"},
        {title: "二级标题 H2", value: "h2"},
        {title: "三级标题 H3", value: "h3"},
        {title: "四级标题 H4", value: "h4"},
        {title: "引用", value: "blockquote", icon: BlockquoteIcon},
      ],
      lists: [
        {title: "项目符号列表", value: "bullet"},
        {title: "编号列表", value: "number"},
      ],
      marks: {
        decorators: [
          {title: "加粗", value: "strong"},
          {title: "斜体", value: "em"},
          {title: "下划线", value: "underline"},
          {title: "删除线", value: "strike-through"},
          {title: "代码", value: "code"},
        ],
        annotations: [
          defineField({
            name: "link",
            title: "外部链接",
            type: "object",
            icon: LinkIcon,
            fields: [
              defineField({
                name: "href",
                title: "网址",
                type: "url",
                description: "完整网址，需包含 https://。",
                validation: (rule) =>
                  rule
                    .required()
                    .uri({scheme: ["http", "https", "mailto", "tel"]}),
              }),
              defineField({
                name: "blank",
                title: "在新窗口打开",
                type: "boolean",
                initialValue: true,
              }),
            ],
          }),
          defineField({
            name: "internalLink",
            title: "站内内容链接",
            type: "object",
            icon: LinkIcon,
            fields: [
              defineField({
                name: "reference",
                title: "选择页面/产品/文章",
                type: "reference",
                to: [
                  {type: "sitePage"},
                  {type: "product"},
                  {type: "solution"},
                  {type: "post"},
                ],
                validation: (rule) => rule.required(),
              }),
            ],
          }),
        ],
      },
    }),

    // Retain the legacy image member so existing Portable Text remains valid.
    defineArrayMember({
      type: "image",
      title: "普通图片（兼容旧文章）",
      options: {hotspot: true},
      fields: [
        defineField({
          name: "alt",
          title: "替代文字 Alt",
          type: "string",
          validation: (rule) =>
            rule.required().warning("建议填写 Alt，有助于无障碍访问和 SEO。"),
        }),
        defineField({
          name: "caption",
          title: "图片说明",
          type: "string",
        }),
      ],
    }),

    defineArrayMember({
      name: "postImageBlock",
      title: "带说明的图片",
      type: "object",
      icon: ImagesIcon,
      fields: [
        mediaField({
          name: "image",
          title: "图片",
          type: "image",
          mediaTags: ["scope-post", "role-content"],
          options: {hotspot: true},
          validation: (rule) => rule.required(),
          fields: [
            defineField({
              name: "alt",
              title: "替代文字 Alt",
              type: "string",
              validation: (rule) =>
                rule.required().warning("建议填写 Alt，有助于无障碍访问和 SEO。"),
            }),
          ],
        }),
        defineField({
          name: "caption",
          title: "图片说明",
          type: "string",
          description: "显示在图片下方，可填写场景、型号或版权信息。",
        }),
      ],
      preview: {
        select: {title: "caption", media: "image"},
        prepare: ({title, media}) => ({
          title: title || "文章图片",
          subtitle: "带说明的图片",
          media,
        }),
      },
    }),

    defineArrayMember({
      name: "postGalleryBlock",
      title: "图片画廊",
      type: "object",
      icon: ImagesIcon,
      fields: [
        defineField({
          name: "heading",
          title: "画廊标题",
          type: "string",
        }),
        defineField({
          name: "images",
          title: "图片",
          type: "array",
          validation: (rule) => rule.min(2).error("画廊至少需要两张图片。"),
          of: [
            defineArrayMember({
              type: "object",
              name: "postGalleryItem",
              fields: [
                mediaField({
                  name: "image",
                  title: "图片",
                  type: "image",
                  mediaTags: ["scope-post", "role-gallery"],
                  options: {hotspot: true},
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "alt",
                  title: "替代文字 Alt",
                  type: "string",
                }),
                defineField({
                  name: "caption",
                  title: "图片说明",
                  type: "string",
                }),
              ],
              preview: {
                select: {title: "caption", subtitle: "alt", media: "image"},
              },
            }),
          ],
        }),
      ],
      preview: {
        select: {title: "heading", count: "images.length"},
        prepare: ({title, count}) => ({
          title: title || "图片画廊",
          subtitle: count ? `${count} 张图片` : "尚未添加图片",
        }),
      },
    }),

    defineArrayMember({
      name: "postVideoBlock",
      title: "视频",
      type: "object",
      icon: PlayIcon,
      fields: [
        defineField({
          name: "source",
          title: "视频来源",
          type: "string",
          options: {
            list: [
              {title: "外部视频链接", value: "external"},
              {title: "上传视频文件", value: "upload"},
            ],
            layout: "radio",
          },
          initialValue: "external",
        }),
        defineField({
          name: "url",
          title: "视频网址",
          type: "url",
          description: "YouTube、Vimeo 或其他可公开访问的视频网址。",
          hidden: ({parent}) => parent?.source !== "external",
        }),
        mediaField({
          name: "file",
          title: "视频文件",
          type: "file",
          mediaTags: ["scope-post", "role-video"],
          options: {accept: "video/webm,video/mp4"},
          hidden: ({parent}) => parent?.source !== "upload",
        }),
        defineField({
          name: "caption",
          title: "视频说明",
          type: "string",
        }),
      ],
      preview: {
        select: {title: "caption", subtitle: "url"},
        prepare: ({title, subtitle}) => ({
          title: title || "视频",
          subtitle: subtitle || "已上传视频文件",
        }),
      },
    }),

    defineArrayMember({
      name: "postCalloutBlock",
      title: "重点提示",
      type: "object",
      icon: WarningOutlineIcon,
      fields: [
        defineField({
          name: "tone",
          title: "提示类型",
          type: "string",
          options: {
            list: [
              {title: "普通提示", value: "note"},
              {title: "重要提醒", value: "important"},
              {title: "成功案例", value: "success"},
              {title: "风险警告", value: "warning"},
            ],
            layout: "radio",
          },
          initialValue: "note",
        }),
        defineField({
          name: "heading",
          title: "提示标题",
          type: "string",
        }),
        defineField({
          name: "body",
          title: "提示内容",
          type: "text",
          rows: 4,
          validation: (rule) => rule.required(),
        }),
      ],
      preview: {
        select: {title: "heading", subtitle: "body"},
        prepare: ({title, subtitle}) => ({
          title: title || "重点提示",
          subtitle,
        }),
      },
    }),

    defineArrayMember({
      name: "postTableBlock",
      title: "快速粘贴表格（Excel / Sheets）",
      type: "object",
      icon: MasterDetailIcon,
      components: {
        input: TableImportInput,
      },
      fields: [
        defineField({
          name: "heading",
          title: "表格标题",
          type: "string",
        }),
        defineField({
          name: "columns",
          title: "列标题",
          type: "array",
          of: [defineArrayMember({type: "string"})],
          validation: (rule) =>
            rule.min(2).error("表格至少需要两列。").unique(),
        }),
        defineField({
          name: "rows",
          title: "表格内容",
          type: "array",
          of: [
            defineArrayMember({
              name: "postTableRow",
              title: "一行",
              type: "object",
              fields: [
                defineField({
                  name: "cells",
                  title: "单元格",
                  type: "array",
                  of: [defineArrayMember({type: "string"})],
                }),
              ],
              preview: {
                select: {cells: "cells"},
                prepare: ({cells}: {cells?: string[]}) => ({
                  title: cells?.filter(Boolean).join(" | ") || "空白行",
                }),
              },
            }),
          ],
        }),
        defineField({
          name: "caption",
          title: "表格说明",
          type: "string",
        }),
        defineField({
          name: "importMeta",
          title: "导入来源",
          type: "object",
          hidden: true,
          fields: [
            defineField({name: "sourceType", type: "string"}),
            defineField({name: "sourceLabel", type: "string"}),
            defineField({name: "sourceUrl", type: "url"}),
            defineField({name: "sheetName", type: "string"}),
            defineField({name: "importedAt", type: "datetime"}),
          ],
        }),
      ],
      preview: {
        select: {title: "heading", count: "rows.length"},
        prepare: ({title, count}) => ({
          title: title || "表格/参数对比",
          subtitle: count ? `${count} 行` : "尚未填写内容",
        }),
      },
    }),

    defineArrayMember({
      type: "table",
      title: "可视化表格（原生）",
      icon: MasterDetailIcon,
    }),

    defineArrayMember({
      name: "postCodeBlock",
      title: "代码片段",
      type: "object",
      icon: CodeBlockIcon,
      fields: [
        defineField({
          name: "language",
          title: "代码语言",
          type: "string",
          description: "用于前端显示，例如 text、json、html、bash。",
          initialValue: "text",
        }),
        defineField({
          name: "code",
          title: "代码内容",
          type: "text",
          rows: 10,
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "caption",
          title: "说明（可选）",
          type: "string",
        }),
      ],
      preview: {
        select: {title: "caption", subtitle: "language", code: "code"},
        prepare: ({title, subtitle, code}) => ({
          title: title || "代码片段",
          subtitle: subtitle || String(code || "").slice(0, 72),
        }),
      },
    }),

    defineArrayMember({
      name: "postDividerBlock",
      title: "分隔线",
      type: "object",
      icon: RemoveIcon,
      fields: [
        defineField({
          name: "label",
          title: "编辑备注（不显示在前台）",
          type: "string",
          description: "可留空；仅用于帮助运营人员识别章节分隔。",
        }),
      ],
      preview: {
        select: {title: "label"},
        prepare: ({title}) => ({title: title || "分隔线"}),
      },
    }),

    defineArrayMember({
      name: "postProductBlock",
      title: "关联产品",
      type: "object",
      icon: PackageIcon,
      fields: [
        defineField({
          name: "heading",
          title: "模块标题",
          type: "string",
          initialValue: "Related products",
        }),
        defineField({
          name: "products",
          title: "选择产品",
          type: "array",
          of: [
            defineArrayMember({type: "reference", to: [{type: "product"}]}),
          ],
          validation: (rule) =>
            rule.min(1).error("至少选择一个产品。").max(4).unique(),
        }),
        defineField({
          name: "body",
          title: "补充说明",
          type: "text",
          rows: 3,
        }),
      ],
      preview: {
        select: {title: "heading", count: "products.length"},
        prepare: ({title, count}) => ({
          title: title || "关联产品",
          subtitle: count ? `${count} 个产品` : "尚未选择产品",
        }),
      },
    }),

    defineArrayMember({
      name: "postSolutionBlock",
      title: "关联解决方案",
      type: "object",
      icon: ProjectsIcon,
      fields: [
        defineField({
          name: "heading",
          title: "模块标题",
          type: "string",
          initialValue: "Recommended solution",
        }),
        defineField({
          name: "solution",
          title: "选择解决方案",
          type: "reference",
          to: [{type: "solution"}],
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "body",
          title: "补充说明",
          type: "text",
          rows: 3,
        }),
      ],
      preview: {
        select: {title: "heading", subtitle: "solution.title"},
      },
    }),

    defineArrayMember({
      name: "postDownloadBlock",
      title: "文件下载",
      type: "object",
      icon: DocumentPdfIcon,
      fields: [
        defineField({
          name: "title",
          title: "文件标题",
          type: "string",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "description",
          title: "文件说明",
          type: "text",
          rows: 3,
        }),
        mediaField({
          name: "file",
          title: "上传文件",
          type: "file",
          mediaTags: ["scope-post", "role-document"],
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "buttonLabel",
          title: "按钮文字",
          type: "string",
          initialValue: "Download",
        }),
      ],
      preview: {
        select: {title: "title", subtitle: "description"},
      },
    }),

    defineArrayMember({
      name: "postCtaBlock",
      title: "行动按钮 CTA",
      type: "object",
      icon: BlockContentIcon,
      fields: [
        defineField({
          name: "heading",
          title: "标题",
          type: "string",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "body",
          title: "说明",
          type: "text",
          rows: 3,
        }),
        defineField({
          name: "primaryCta",
          title: "主要按钮",
          type: "ctaLink",
        }),
        defineField({
          name: "secondaryCta",
          title: "次要按钮",
          type: "ctaLink",
        }),
      ],
      preview: {
        select: {title: "heading", subtitle: "body"},
      },
    }),

    defineArrayMember({type: "faqsBlock", title: "常见问题 FAQ"}),
  ],
});
