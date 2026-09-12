import {useEffect, useState} from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Skeleton,
  Stack,
  Text,
} from "@sanity/ui";
import {useClient} from "sanity";
import {useIntentLink} from "sanity/router";
import {
  LOCALIZED_DOCUMENT_TYPES,
  SUPPORTED_LANGUAGES,
} from "../config/i18n";

interface TranslationDocument {
  _id: string;
  _type: string;
  title?: string;
  sku?: string;
  language?: string;
  translationStatus?: string;
  updatedAt: string;
}

interface TranslationDashboardData {
  byLanguage: Record<string, number>;
  needsReview: number;
  stale: number;
  failed: number;
  recent: TranslationDocument[];
}

const QUERY = `{
  "byLanguage": {
    "en": count(*[
      _type in $types &&
      !(_id in path("drafts.**")) &&
      coalesce(language, "en") == "en"
    ]),
    "es": count(*[_type in $types && !(_id in path("drafts.**")) && language == "es"]),
    "fr": count(*[_type in $types && !(_id in path("drafts.**")) && language == "fr"]),
    "de": count(*[_type in $types && !(_id in path("drafts.**")) && language == "de"]),
    "it": count(*[_type in $types && !(_id in path("drafts.**")) && language == "it"])
  },
  "needsReview": count(*[
    _type in $types &&
    language != "en" &&
    translationStatus == "needsReview"
  ]),
  "stale": count(*[
    _type in $types &&
    language != "en" &&
    translationStatus == "stale"
  ]),
  "failed": count(*[
    _type in $types &&
    language != "en" &&
    translationStatus == "failed"
  ]),
  "recent": *[
    _type in $types &&
    language != "en"
  ] | order(_updatedAt desc)[0...8] {
    _id,
    _type,
    title,
    sku,
    language,
    translationStatus,
    "updatedAt": _updatedAt
  }
}`;

const STATUS_LABELS: Record<string, string> = {
  needsReview: "待审核",
  reviewing: "审核中",
  approved: "已通过",
  stale: "需更新",
  failed: "失败",
};

function OpenDocumentButton({
  documentId,
  documentType,
}: {
  documentId: string;
  documentType: string;
}) {
  const link = useIntentLink({
    intent: "edit",
    params: {
      id: documentId.replace(/^drafts\./, ""),
      type: documentType,
    },
  });

  return <Button as="a" {...link} mode="ghost" text="打开" />;
}

export function TranslationDashboard() {
  const client = useClient({apiVersion: "2026-07-24"});
  const [data, setData] = useState<TranslationDashboardData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    client
      .fetch<TranslationDashboardData>(QUERY, {
        types: [...LOCALIZED_DOCUMENT_TYPES],
      })
      .then((result) => {
        if (active) setData(result);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [client]);

  if (error) {
    return (
      <Box padding={5}>
        <Card border padding={5} radius={2} tone="critical">
          <Text>翻译状态读取失败，请检查网络后刷新。</Text>
        </Card>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box padding={5}>
        <Stack space={5}>
          <Skeleton animated radius={1} style={{height: 32, width: 260}} />
          <Skeleton animated radius={2} style={{height: 120}} />
          <Skeleton animated radius={2} style={{height: 260}} />
        </Stack>
      </Box>
    );
  }

  return (
    <Box padding={5}>
      <Stack space={7}>
        <Box>
          <Heading as="h1" size={3}>
            多语言运营总览
          </Heading>
          <Text muted size={1} style={{marginTop: 10, maxWidth: 760}}>
            英文是唯一源内容。运营发布英文后，系统会自动生成并公开 ES / FR /
            DE / IT 四种语言；无需逐语言重复发布。此处用于发现失败或需要人工复核的译文。
          </Text>
        </Box>

        <Card border radius={2} padding={4}>
          <Grid columns={[2, 3, 5]} gap={4}>
            {SUPPORTED_LANGUAGES.map(({id, title}) => (
              <Box key={id}>
                <Text muted size={1}>
                  {title}
                </Text>
                <Text size={3} weight="semibold">
                  {data.byLanguage[id] ?? 0}
                </Text>
              </Box>
            ))}
          </Grid>
        </Card>

        <Stack space={3}>
          <Heading as="h2" size={1}>
            审核队列
          </Heading>
          <Grid columns={[1, 3, 3]} gap={3}>
            <Card border padding={4} radius={2}>
              <Flex align="center" justify="space-between">
                <Text>机器翻译待审核</Text>
                <Badge tone={data.needsReview ? "caution" : "positive"}>
                  {data.needsReview}
                </Badge>
              </Flex>
            </Card>
            <Card border padding={4} radius={2}>
              <Flex align="center" justify="space-between">
                <Text>英文更新，需重译</Text>
                <Badge tone={data.stale ? "caution" : "positive"}>
                  {data.stale}
                </Badge>
              </Flex>
            </Card>
            <Card border padding={4} radius={2}>
              <Flex align="center" justify="space-between">
                <Text>翻译失败</Text>
                <Badge tone={data.failed ? "critical" : "positive"}>
                  {data.failed}
                </Badge>
              </Flex>
            </Card>
          </Grid>
        </Stack>

        <Stack space={3}>
          <Heading as="h2" size={1}>
            最近更新的翻译
          </Heading>
          <Card border radius={2}>
            {data.recent.length === 0 ? (
              <Box padding={5}>
                <Text muted>
                  暂无翻译文档。打开任意英文内容，使用编辑器顶部的语言菜单创建第一个语言版本。
                </Text>
              </Box>
            ) : (
              <Stack as="ul" padding={0} space={0}>
                {data.recent.map((document, index) => (
                  <Flex
                    align="center"
                    as="li"
                    gap={4}
                    key={document._id}
                    padding={4}
                    style={{
                      borderTop:
                        index === 0
                          ? undefined
                          : "1px solid var(--card-border-color)",
                      listStyle: "none",
                    }}
                  >
                    <Box flex={1}>
                      <Text size={1} weight="medium">
                        {document.title || document.sku || "未命名内容"}
                      </Text>
                      <Flex gap={2} marginTop={2}>
                        <Badge mode="outline">
                          {(document.language || "?").toUpperCase()}
                        </Badge>
                        <Badge
                          mode="outline"
                          tone={
                            document.translationStatus === "approved"
                              ? "positive"
                              : document.translationStatus === "failed"
                                ? "critical"
                                : "caution"
                          }
                        >
                          {STATUS_LABELS[document.translationStatus || ""] ||
                            "未设置"}
                        </Badge>
                      </Flex>
                    </Box>
                    <OpenDocumentButton
                      documentId={document._id}
                      documentType={document._type}
                    />
                  </Flex>
                ))}
              </Stack>
            )}
          </Card>
        </Stack>
      </Stack>
    </Box>
  );
}
