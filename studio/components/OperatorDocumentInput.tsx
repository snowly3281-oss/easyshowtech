import type {InputProps} from "sanity";
import {Badge, Box, Card, Flex, Heading, Stack, Text} from "@sanity/ui";

interface CheckDefinition {
  label: string;
  test: (document: Record<string, unknown>) => boolean;
}

interface DocumentGuide {
  title: string;
  description: string;
  steps: string[];
  checks: CheckDefinition[];
}

function hasValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number" || typeof value === "boolean") return true;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Boolean(record._ref || record.asset || record.current) ||
      Object.values(record).some(hasValue);
  }
  return false;
}

function check(label: string, field: string): CheckDefinition {
  return {
    label,
    test: (document) => hasValue(document[field]),
  };
}

const GUIDES: Record<string, DocumentGuide> = {
  siteSettings: {
    title: "网站全局设置",
    description:
      "这里控制全站公共信息。修改电话、邮箱、WhatsApp、价格总开关或下载文件后，请同时检查页脚、联系页和询盘流程。",
    steps: [
      "联系信息必须使用可以长期接收海外询盘的企业账号。",
      "关闭价格总开关会隐藏所有产品和配置单价格。",
      "修改 Solution 顺序后，检查首页与导航菜单是否符合预期。",
      "页脚社媒链接点击“添加项目/+”逐项添加；每填写一个公开链接，页脚就显示一个对应图标。",
    ],
    checks: [
      check("销售邮箱", "salesEmail"),
      check("联系电话", "phone"),
      check("WhatsApp", "whatsapp"),
      check("承诺回复时间", "responseTime"),
      check("Solution 导航顺序", "solutions"),
    ],
  },
  product: {
    title: "产品资料填写指南",
    description:
      "只维护英文主产品：系统会自动同步其他语言。先完成名称、SKU、系列、器械分类和首图，再填写摘要、价格与规格。不要在多个字段重复同一个参数。",
    steps: [
      "日常只编辑英文主产品；西班牙语、法语、德语、意大利语均由系统自动同步，无需逐条发布。",
      "SKU 必须与甲方文件名、报价单和产品图片一致。",
      "网站显示状态与右上角 Publish 是两层控制，资料未确认时保持网站隐藏。",
      "系列只能选一个，器械类型可以多选；混合设备请完整选择。",
      "附件或维修零件请把“目录类型”改为对应分类；替换零件还应关联可适配的整机产品。",
      "首图使用 Featured Image，其他角度放入产品图片画廊。",
    ],
    checks: [
      check("产品名称", "title"),
      check("网址标识", "slug"),
      check("SKU", "sku"),
      check("产品系列", "series"),
      {
        label: "器械类型",
        test: (document) =>
          hasValue(document.equipmentTypes) || hasValue(document.equipment),
      },
      check("产品首图", "mainImage"),
      check("产品摘要", "summary"),
      check("核心参数", "keySpecs"),
    ],
  },
  solution: {
    title: "解决方案填写指南",
    description:
      "Solution 是场景页，也是配置单、产品和询盘的连接中心。先确认甲方数据，再公开面积、数量和价格。",
    steps: [
      "当前确认的标准方案放在 Recommended 档位。",
      "每个配置产品尽量关联 Products，避免使用临时名称。",
      "数量与设备总数冲突时保留警告并让甲方确认，不要自行修改。",
      "配置 PDF 和完整数量仅在取得客户联系方式后发送。",
    ],
    checks: [
      check("解决方案名称", "title"),
      check("网址标识", "slug"),
      check("目标客户", "audience"),
      check("解决方案摘要", "summary"),
      check("页面内容模块", "pageBuilder"),
      check("面积档位配置单", "packages"),
    ],
  },
  post: {
    title: "文章编辑与发布指南",
    description:
      "文章可在 Canvas 中完成长文写作，并在 Studio 中补充表格、图片、产品、Solution、下载、FAQ 和 CTA 等结构内容。",
    steps: [
      "正文表格可选择“快速粘贴表格”从 Excel / Google Sheets 导入，或选择“可视化表格”直接逐格编辑。",
      "摘要用于资源列表和搜索结果，不要直接复制文章第一段。",
      "文章首图推荐 16:9；正文图片必须填写 Alt。",
      "使用关联产品和 Solution 模块建立可点击的业务路径。",
      "编辑流程状态不等于发布，正式上线仍需点击右上角 Publish。",
    ],
    checks: [
      check("文章标题", "title"),
      check("网址标识", "slug"),
      check("文章摘要", "excerpt"),
      check("文章首图", "coverImage"),
      check("文章正文", "body"),
      check("文章作者", "author"),
      check("文章分类", "categories"),
      check("前台发布日期", "publishedAt"),
    ],
  },
  home: {
    title: "首页编辑指南",
    description:
      "首页由多个固定业务区域组成。修改时按顶部标签逐区检查，避免一次改动过多区域而难以复核。",
    steps: [
      "首屏图片与视频必须同时准备，图片作为视频无法播放时的备用画面。",
      "产品系列、Solution 和文章卡片来自对应内容库，这里只管理标题和介绍。",
      "所有按钮必须设置站内目标或完整外部网址。",
    ],
    checks: [
      check("首页首屏", "hero"),
      check("合作流程", "howWeWork"),
      check("产品目录标题", "catalog"),
      check("Solution 标题", "useCases"),
      check("工厂区域", "factory"),
      check("最终询盘 CTA", "finalCta"),
    ],
  },
  oem: {
    title: "OEM 页面编辑指南",
    description:
      "通过内容模块管理 OEM 页面。拖动可改变前台顺序；已有客户确认内容不要直接删除。",
    steps: [
      "首屏说明 OEM 能力和主要客户价值。",
      "正文优先使用结构化模块，不要把整页内容塞进一个文本框。",
      "页面末尾必须保留明确的询盘 CTA。",
    ],
    checks: [
      check("页面名称", "title"),
      check("页面内容模块", "pageBuilder"),
      check("SEO", "seo"),
    ],
  },
  sitePage: {
    title: "固定页面编辑指南",
    description:
      "这是一个固定网址的页面。系统标识和前台网址不可修改；运营人员只需要维护首屏、正文模块和 SEO。",
    steps: [
      "普通营销页面使用内容模块，政策长文使用“政策/长文正文”。",
      "法律政策发布前必须由甲方或法律顾问确认。",
      "修改后通过“前台预览”标签检查桌面和手机端效果。",
    ],
    checks: [
      check("页面名称", "title"),
      check("前台网址", "route"),
      {
        label: "页面正文",
        test: (document) =>
          hasValue(document.sections) || hasValue(document.legalBody),
      },
      check("SEO", "seo"),
    ],
  },
  series: {
    title: "产品系列管理",
    description:
      "系列是 Products 的主分类。产品只能属于一个主系列，系列会出现在首页目录和产品筛选中。",
    steps: [
      "系列名称与 Slug 发布后不要随意修改。",
      "代表图应能体现整个系列，不要使用单个细节局部。",
      "显示顺序建议使用 10、20、30 的间隔。",
    ],
    checks: [
      check("系列名称", "title"),
      check("网址标识", "slug"),
      check("系列简介", "description"),
      check("系列代表图", "image"),
    ],
  },
  equipment: {
    title: "器械分类管理",
    description:
      "器械分类用于客户按设备类型筛选 Products。同一个产品可以属于多个器械类型。",
    steps: [
      "只建立稳定的器械类型，不要把材质或型号作为器械分类。",
      "Slug 发布后不要随意修改。",
      "显示顺序建议使用 10、20、30 的间隔。",
    ],
    checks: [
      check("器械分类名称", "title"),
      check("网址标识", "slug"),
    ],
  },
};

export function OperatorDocumentInput(props: InputProps) {
  const isDocumentRoot =
    props.id === "root" && props.schemaType.type?.name === "document";
  if (!isDocumentRoot) return props.renderDefault(props);

  const guide = GUIDES[props.schemaType.name];
  if (!guide) return props.renderDefault(props);

  const document = (props.value ?? {}) as Record<string, unknown>;
  const completed = guide.checks.filter((item) => item.test(document));
  const missing = guide.checks.filter((item) => !item.test(document));
  const percent = Math.round((completed.length / guide.checks.length) * 100);
  const tone = percent === 100 ? "positive" : percent >= 60 ? "primary" : "caution";

  return (
    <Stack space={5}>
      <Card border padding={4} radius={2} tone={tone}>
        <Stack space={4}>
          <Flex align="center" gap={3} wrap="wrap">
            <Heading as="h2" size={1}>
              {guide.title}
            </Heading>
            <Badge mode="outline" tone={tone}>
              资料完整度 {completed.length}/{guide.checks.length}
            </Badge>
          </Flex>

          <Text muted size={1}>
            {guide.description}
          </Text>

          <Box>
            <Stack space={2}>
              {guide.steps.map((step, index) => (
                <Text key={step} size={1}>
                  {index + 1}. {step}
                </Text>
              ))}
            </Stack>
          </Box>

          {missing.length > 0 && (
            <Text size={1} weight="medium">
              尚待完成：{missing.map((item) => item.label).join("、")}
            </Text>
          )}
        </Stack>
      </Card>

      {props.renderDefault(props)}
    </Stack>
  );
}
