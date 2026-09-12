import {defineField, defineType} from "sanity";
import {FolderIcon} from "@sanity/icons";

export const postCategory = defineType({
  name: "postCategory",
  title: "文章分类",
  type: "document",
  icon: FolderIcon,
  fields: [
    defineField({
      name: "title",
      title: "分类名称",
      type: "string",
      description: "稳定、长期使用的内容栏目，例如 Studio Planning。",
      validation: (rule) => rule.required().error("请填写分类名称。"),
    }),
    defineField({
      name: "slug",
      title: "网址标识 Slug",
      type: "slug",
      description: "用于网址和筛选，只使用小写英文、数字与连字符。",
      options: {source: "title", maxLength: 96},
      validation: (rule) => rule.required().error("请生成网址标识。"),
    }),
    defineField({
      name: "description",
      title: "分类说明",
      type: "text",
      rows: 3,
      description: "说明该分类收录什么内容，便于运营人员判断。",
    }),
  ],
  preview: {
    select: {title: "title", slug: "slug.current"},
    prepare: ({title, slug}: {title?: string; slug?: string}) => ({
      title: title || "未命名分类",
      subtitle: slug ? `/${slug}` : "尚未生成 Slug",
    }),
  },
});
