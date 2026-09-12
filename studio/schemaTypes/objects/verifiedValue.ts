import {defineField, defineType} from "sanity";
import {CheckmarkCircleIcon} from "@sanity/icons";

/**
 * A client-supplied public fact or commercial claim.
 *
 * The frontend must only publish `value` when `confirmed` is true. This keeps
 * draft numbers and unverified promises available to the operator without
 * leaking TBC copy onto the public website.
 */
export const verifiedValue = defineType({
  name: "verifiedValue",
  title: "甲方确认值",
  type: "object",
  icon: CheckmarkCircleIcon,
  fields: [
    defineField({
      name: "value",
      title: "前台显示值",
      type: "string",
      description:
        "填写最终要在网站公开的文字或数字，包含必要单位。示例：2,500 m²、20 units、±0.2 mm。",
      validation: (rule) => rule.max(240),
    }),
    defineField({
      name: "confirmed",
      title: "甲方已书面确认，可公开",
      type: "boolean",
      initialValue: false,
      description:
        "只有勾选后前台才会显示该值。没有书面依据时请保持关闭。",
      validation: (rule) =>
        rule.custom((confirmed, context) => {
          const parent = context.parent as {value?: string} | undefined;
          if (confirmed && !parent?.value?.trim()) {
            return "勾选公开前，请先填写前台显示值。";
          }
          return true;
        }),
    }),
    defineField({
      name: "evidence",
      title: "确认依据（仅后台）",
      type: "text",
      rows: 2,
      description:
        "建议记录甲方邮件、合同、证书编号或内部数据来源。该内容不会显示在前台。",
    }),
    defineField({
      name: "confirmedBy",
      title: "确认人（仅后台）",
      type: "string",
      description: "填写甲方确认人姓名或邮箱，便于交付后追溯。",
    }),
    defineField({
      name: "confirmedAt",
      title: "确认日期（仅后台）",
      type: "date",
    }),
  ],
  preview: {
    select: {
      value: "value",
      confirmed: "confirmed",
      confirmedBy: "confirmedBy",
    },
    prepare: ({
      value,
      confirmed,
      confirmedBy,
    }: {
      value?: string;
      confirmed?: boolean;
      confirmedBy?: string;
    }) => ({
      title: value || "尚未填写",
      subtitle: confirmed
        ? `已确认${confirmedBy ? ` · ${confirmedBy}` : ""}`
        : "未确认 · 前台不会显示",
    }),
  },
});
