import { defineType, defineField } from "sanity";
import { WrenchIcon } from "@sanity/icons";

/**
 * PartsCategory — the third axis of the triple-axis product taxonomy.
 *
 * Previously this was a fixed string on `product.partsCategory` (springs,
 * upholstery, cables_ropes, footbars_hardware, training_accessories, other).
 * Promoting it to a real document lets ops maintain the visible title,
 * description and order in one place, translate it through the i18n plugin,
 * and add new categories without a schema migration.
 *
 * Five canonical categories seeded by `seed-parts-categories.mjs`:
 *   - springs            → 弹簧与阻力系统
 *   - upholstery         → 皮革、坐垫与软包
 *   - cables_ropes       → 绳索、滑轮与线缆
 *   - footbars_hardware  → 脚杆与五金
 *   - training_accessories → 训练辅件（箱、垫、跳板等）
 *
 * The `key` is the stable identifier used by URL params, GROQ filters and
 * the i18n fallback labels. It must not be renamed once content is live.
 */
export const partsCategory = defineType({
  name: "partsCategory",
  title: "配件 / 零件分类",
  type: "document",
  icon: WrenchIcon,
  orderings: [
    {
      title: "导航顺序",
      name: "navigationOrder",
      by: [
        { field: "order", direction: "asc" },
        { field: "title", direction: "asc" },
      ],
    },
    {
      title: "Key A–Z",
      name: "keyAsc",
      by: [{ field: "key", direction: "asc" }],
    },
  ],
  fields: [
    defineField({
      name: "key",
      title: "Key（系统标识）",
      type: "string",
      description:
        '稳定标识，用于 URL 与 GROQ 过滤，例如 "springs"、"upholstery"。发布后不要随意修改。',
      validation: (rule) =>
        rule
          .required()
          .regex(
            /^[a-z][a-z0-9_]{1,40}$/,
            { name: "kebab/snake_case", invert: false },
          )
          .error("请使用小写字母开头的 snake_case。"),
    }),
    defineField({
      name: "title",
      title: "分类名称",
      type: "string",
      description: "客户可见的分类名称，例如 \"Springs & resistance\"。",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "分类说明",
      type: "text",
      rows: 3,
      description: "在分类筛选页和首页中显示的简短说明。",
    }),
    defineField({
      name: "order",
      title: "显示顺序",
      type: "number",
      description:
        "数字越小越靠前。建议按 10、20、30 递增，方便以后插入新分类。",
    }),
  ],
  preview: {
    select: { title: "title", key: "key", subtitle: "description" },
    prepare: ({ title, key, subtitle }: { title?: string; key?: string; subtitle?: string }) => ({
      title: title || "未命名配件分类",
      subtitle: key ? `Key: ${key}` : "尚未设置 Key",
    }),
  },
});
