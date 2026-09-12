import {defineField, defineType} from "sanity";
import {UserIcon} from "@sanity/icons";
import {mediaField} from "sanity-plugin-media";

export const postAuthor = defineType({
  name: "postAuthor",
  title: "文章作者",
  type: "document",
  icon: UserIcon,
  fields: [
    defineField({
      name: "name",
      title: "作者姓名",
      type: "string",
      description: "前台文章署名，例如 Coral Editorial Team 或具体员工姓名。",
      validation: (rule) => rule.required().error("请填写作者姓名。"),
    }),
    defineField({
      name: "role",
      title: "职位/身份",
      type: "string",
      description: "例如 Product Specialist、Founder、Editorial Team。",
    }),
    mediaField({
      name: "portrait",
      title: "作者头像",
      type: "image",
      mediaTags: ["scope-post", "role-content"],
      options: {hotspot: true},
      fields: [
        defineField({
          name: "alt",
          title: "替代文字 Alt",
          type: "string",
          description: "描述人物及用途，供无障碍访问使用。",
        }),
      ],
    }),
    defineField({
      name: "bio",
      title: "作者简介",
      type: "text",
      rows: 4,
      description: "可选，建议 50–160 个字。",
    }),
  ],
  preview: {
    select: {title: "name", subtitle: "role", media: "portrait"},
  },
});
