import {useMemo} from "react";
import {Badge, Card, Flex, Heading, Stack, Text} from "@sanity/ui";
import {useFormValue, type ObjectInputProps} from "sanity";

interface SeoValue {
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  ogImage?: {asset?: unknown};
}

interface PortableTextBlock {
  _type?: string;
  style?: string;
  children?: Array<{text?: string}>;
}

interface SeoCheck {
  label: string;
  points: number;
  passed: boolean;
  guidance: string;
}

function portableText(body: unknown): string {
  if (!Array.isArray(body)) return "";
  return body
    .filter((block): block is PortableTextBlock => Boolean(block && typeof block === "object"))
    .flatMap((block) => block.children ?? [])
    .map((child) => child.text ?? "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasH2(body: unknown): boolean {
  return Array.isArray(body) && body.some(
    (block) =>
      block &&
      typeof block === "object" &&
      (block as PortableTextBlock).style === "h2",
  );
}

function containsPhrase(text: string, phrase: string): boolean {
  return Boolean(phrase.trim()) && text.toLocaleLowerCase().includes(phrase.trim().toLocaleLowerCase());
}

function scoreTone(score: number): "positive" | "caution" | "critical" {
  if (score >= 80) return "positive";
  if (score >= 55) return "caution";
  return "critical";
}

/**
 * Studio v6-compatible SEO scorecard for article editors.
 *
 * The marketplace SEO plugins evaluated for this project currently declare
 * Studio v3–v5 peer support only. This field-level component keeps the proven
 * WordPress-style feedback in the existing SEO document shape, without an
 * unsafe dependency override or a front-end metadata migration.
 */
export function SeoChecklistInput(props: ObjectInputProps<SeoValue>) {
  const documentTitle = String(useFormValue(["title"]) ?? "");
  const excerpt = String(useFormValue(["excerpt"]) ?? "");
  const coverImage = useFormValue(["coverImage"]);
  const body = useFormValue(["body"]);
  const seo = props.value ?? {};

  const checks = useMemo<SeoCheck[]>(() => {
    const bodyText = portableText(body);
    const title = seo.metaTitle?.trim() || documentTitle.trim();
    const description = seo.metaDescription?.trim() || excerpt.trim();
    const keyword = seo.focusKeyword?.trim() || "";
    const titleAndDescription = `${title} ${description}`;
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

    return [
      {
        label: "搜索结果标题",
        points: 15,
        passed: title.length >= 30 && title.length <= 60,
        guidance: title
          ? "建议将标题控制在 30–60 个字符，并让核心关键词靠前。"
          : "请填写文章标题或单独的 Meta title。",
      },
      {
        label: "搜索结果摘要",
        points: 15,
        passed: description.length >= 120 && description.length <= 160,
        guidance: description
          ? "建议将 Meta description 控制在 120–160 个字符，并说明读者能获得什么。"
          : "请填写文章摘要或单独的 Meta description。",
      },
      {
        label: "焦点关键词",
        points: 15,
        passed: keyword.length > 0,
        guidance: "填写一个真实的买家搜索词，例如 “pilates reformer for studio”。",
      },
      {
        label: "关键词出现在标题与摘要",
        points: 15,
        passed: Boolean(keyword) && containsPhrase(titleAndDescription, keyword),
        guidance: "自然地将焦点关键词写进标题或摘要，避免机械堆砌。",
      },
      {
        label: "关键词出现在正文",
        points: 15,
        passed: Boolean(keyword) && containsPhrase(bodyText, keyword),
        guidance: "在正文开头或一个自然段落中解释该关键词对应的问题。",
      },
      {
        label: "社交分享图片",
        points: 10,
        passed: Boolean(seo.ogImage?.asset || coverImage),
        guidance: "上传文章首图，或在 SEO 中上传 1200×630 px 的社交分享图片。",
      },
      {
        label: "文章章节结构",
        points: 8,
        passed: hasH2(body),
        guidance: "至少插入一个二级标题 H2，帮助读者和搜索引擎理解文章结构。",
      },
      {
        label: "正文深度",
        points: 7,
        passed: wordCount >= 600,
        guidance: `当前约 ${wordCount} 个英文单词；B2B 指南建议至少 600 个单词，并补充案例、规格或决策依据。`,
      },
    ];
  }, [body, coverImage, documentTitle, excerpt, seo.focusKeyword, seo.metaDescription, seo.metaTitle, seo.ogImage]);

  const score = checks.reduce((total, check) => total + (check.passed ? check.points : 0), 0);
  const tone = scoreTone(score);
  const pending = checks.filter((check) => !check.passed);

  return (
    <Stack space={4}>
      <Card border padding={4} radius={2} tone={tone}>
        <Stack space={4}>
          <Flex align="center" gap={3} justify="space-between" wrap="wrap">
            <Stack space={2}>
              <Heading as="h3" size={1}>
                实时 SEO 检查
              </Heading>
              <Text muted size={1}>
                基于当前标题、摘要、正文和图片即时计算；这是编辑指引，不替代搜索引擎排名保证。
              </Text>
            </Stack>
            <Badge mode="outline" tone={tone}>
              SEO 评分 {score}/100
            </Badge>
          </Flex>

          <Flex gap={2} wrap="wrap">
            {checks.map((check) => (
              <Badge
                key={check.label}
                mode="outline"
                tone={check.passed ? "positive" : "default"}
              >
                {check.passed ? "✓" : "○"} {check.label} · {check.points}
              </Badge>
            ))}
          </Flex>

          {pending.length > 0 ? (
            <Stack space={2}>
              <Text size={1} weight="medium">
                下一步建议
              </Text>
              {pending.slice(0, 3).map((check) => (
                <Text key={check.label} muted size={1}>
                  · {check.guidance}
                </Text>
              ))}
            </Stack>
          ) : (
            <Text size={1} weight="medium">
              SEO 基础检查已完成。发布前仍请确认产品事实、链接与用户阅读体验。
            </Text>
          )}
        </Stack>
      </Card>

      {props.renderDefault(props)}
    </Stack>
  );
}
