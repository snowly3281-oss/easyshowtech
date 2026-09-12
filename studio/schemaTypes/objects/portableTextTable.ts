import {defineArrayMember, defineField, defineType} from "sanity";

/**
 * Canonical table schema for Sanity's native Portable Text table plugin.
 *
 * Keep these schema names (`table`, `row`, and `cell`) aligned with the
 * plugin defaults. The older `postTableBlock` remains registered separately
 * so published articles and the Excel/Google Sheets importer stay compatible.
 */
export const portableTextTable = defineType({
  name: "table",
  title: "可视化表格",
  type: "object",
  description:
    "在正文中直接编辑行列和单元格。适合从空白表格开始，并在 Studio 中持续调整。",
  fields: [
    defineField({
      name: "headerRows",
      title: "表头行数",
      type: "number",
      initialValue: 1,
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: "rows",
      title: "表格行",
      type: "array",
      of: [defineArrayMember({type: "row"})],
      validation: (rule) => rule.min(1),
    }),
  ],
  preview: {
    select: {rows: "rows"},
    prepare: ({rows}: {rows?: unknown[]}) => ({
      title: "可视化表格",
      subtitle: `${rows?.length ?? 0} 行`,
    }),
  },
});

export const portableTextTableRow = defineType({
  name: "row",
  title: "表格行",
  type: "object",
  fields: [
    defineField({
      name: "cells",
      title: "单元格",
      type: "array",
      of: [defineArrayMember({type: "cell"})],
    }),
  ],
});

export const portableTextTableCell = defineType({
  name: "cell",
  title: "表格单元格",
  type: "object",
  fields: [
    defineField({
      name: "value",
      title: "单元格内容",
      type: "array",
      of: [defineArrayMember({type: "block"})],
    }),
  ],
});
