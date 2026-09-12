import {defineField, defineType} from "sanity";
import {TagIcon} from "@sanity/icons";

export const postTag = defineType({
  name: "postTag",
  title: "文章标签",
  type: "document",
  icon: TagIcon,
  fields: [
    defineField({
      name: "title",
      title: "标签名称",
      type: "string",
      description: "用于跨分类描述主题，例如 Rehab、ROI、Small Studio。",
      validation: (rule) => rule.required().error("请填写标签名称。"),
    }),
    defineField({
      name: "slug",
      title: "网址标识 Slug",
      type: "slug",
      options: {source: "title", maxLength: 96},
      validation: (rule) => rule.required().error("请生成网址标识。"),
    }),
  ],
  preview: {
    select: {title: "title", slug: "slug.current"},
    prepare: ({title, slug}: {title?: string; slug?: string}) => ({
      title: title || "未命名标签",
      subtitle: slug ? `/${slug}` : "尚未生成 Slug",
    }),
  },
});
