import type {MouseEvent, ReactNode} from "react";
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
import {useIntentLink, useRouter} from "sanity/router";
import styled from "styled-components";

interface OperationsData {
  counts: {
    products: number;
    solutions: number;
    posts: number;
    pages: number;
  };
  quality: {
    hiddenProducts: number;
    missingImages: number;
    missingGalleries: number;
    incompleteSolutions: number;
    incompletePosts: number;
  };
  recent: {
    _id: string;
    _type: string;
    title?: string;
    sku?: string;
    updatedAt: string;
  }[];
}

// The dashboard is an operator workspace, not a translation audit. Every
// metric therefore uses one English source record per piece of content.
const ENGLISH_SOURCE =
  'coalesce(language, "en") == "en" && !(_id in path("drafts.**"))';

const QUERY = `{
  "counts": {
    "products": count(*[_type == "product" && ${ENGLISH_SOURCE}]),
    "solutions": count(*[_type == "solution" && ${ENGLISH_SOURCE}]),
    "posts": count(*[_type == "post" && ${ENGLISH_SOURCE}]),
    "pages": count(*[_type in ["sitePage", "home", "oem"] && ${ENGLISH_SOURCE}])
  },
  "quality": {
    "hiddenProducts": count(*[_type == "product" && ${ENGLISH_SOURCE} && status == "draft"]),
    "missingImages": count(*[_type == "product" && ${ENGLISH_SOURCE} && !defined(mainImage.asset)]),
    "missingGalleries": count(*[_type == "product" && ${ENGLISH_SOURCE} && count(gallery) == 0]),
    "incompleteSolutions": count(*[_type == "solution" && ${ENGLISH_SOURCE} && count(packages) == 0]),
    "incompletePosts": count(*[_type == "post" && ${ENGLISH_SOURCE} && (!defined(coverImage.asset) || count(body) == 0)])
  },
  "recent": *[
    _type in ["product", "solution", "post", "sitePage", "home", "oem"] &&
    ${ENGLISH_SOURCE}
  ] | order(_updatedAt desc)[0...8] {
    _id,
    _type,
    title,
    sku,
    "updatedAt": _updatedAt
  }
}`;

const TYPE_LABELS: Record<string, string> = {
  product: "产品",
  solution: "解决方案",
  post: "文章",
  sitePage: "页面",
  home: "首页",
  oem: "OEM 页面",
};

const DashboardFrame = styled(Box)`
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
`;

const ClickableCard = styled(Card)`
  display: block;
  height: 100%;
  color: inherit;
  text-decoration: none;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;

  &:hover {
    border-color: var(--card-focus-ring-color);
    box-shadow: 0 8px 24px rgb(0 0 0 / 8%);
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 2px solid var(--card-focus-ring-color);
    outline-offset: 2px;
  }
`;

function useStructureLink(path: string) {
  const router = useRouter();
  const href = `/structure/${path}`;

  return {
    href,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      event.preventDefault();
      router.navigateUrl({path: href});
    },
  };
}

function StructureCard({
  children,
  path,
}: {
  children: ReactNode;
  path: string;
}) {
  const link = useStructureLink(path);

  return (
    <ClickableCard
      as="a"
      border
      href={link.href}
      onClick={link.onClick}
      padding={[4, 5]}
      radius={3}
    >
      {children}
    </ClickableCard>
  );
}

function StructureButton({
  path,
  text,
}: {
  path: string;
  text: string;
}) {
  const link = useStructureLink(path);

  return (
    <Button
      as="a"
      href={link.href}
      mode="ghost"
      onClick={link.onClick}
      text={text}
      tone="primary"
    />
  );
}

function Metric({
  detail,
  label,
  path,
  value,
}: {
  detail: string;
  label: string;
  path: string;
  value: number;
}) {
  return (
    <StructureCard path={path}>
      <Stack space={4}>
        <Text muted size={1} weight="medium">
          {label}
        </Text>
        <Flex align="baseline" gap={2}>
          <Heading
            as="p"
            size={4}
            style={{fontVariantNumeric: "tabular-nums"}}
          >
            {value}
          </Heading>
          <Text muted size={1}>
            项
          </Text>
        </Flex>
        <Text muted size={1}>
          {detail}
        </Text>
        <Text size={1} weight="semibold">
          进入管理 →
        </Text>
      </Stack>
    </StructureCard>
  );
}

function OpenDocumentButton({
  documentId,
  documentType,
}: {
  documentId: string;
  documentType: string;
}) {
  const link = useIntentLink({
    intent: "edit",
    params: {id: documentId, type: documentType},
  });

  return <Button as="a" {...link} mode="ghost" text="打开" />;
}

export function OperationsDashboard() {
  const client = useClient({apiVersion: "2026-07-24"});
  const [data, setData] = useState<OperationsData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    client
      .fetch<OperationsData>(QUERY)
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
          <Text>运营数据读取失败，请检查网络后刷新。</Text>
        </Card>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box padding={5}>
        <Stack space={5}>
          <Skeleton animated radius={1} style={{height: 32, width: 260}} />
          <Skeleton animated radius={2} style={{height: 100}} />
          <Skeleton animated radius={2} style={{height: 220}} />
        </Stack>
      </Box>
    );
  }

  const issues = [
    {
      description: "打开网站隐藏/资料未完成的产品清单。",
      label: "网站隐藏的产品",
      path: "product-center;products-hidden",
      value: data.quality.hiddenProducts,
    },
    {
      description: "定位没有 Featured Image 的产品并直接补图。",
      label: "缺少产品首图",
      path: "content-quality;quality-product-image",
      value: data.quality.missingImages,
    },
    {
      description: "定位没有产品画廊的产品并补充详情图片。",
      label: "缺少产品画廊",
      path: "content-quality;quality-product-gallery",
      value: data.quality.missingGalleries,
    },
    {
      description: "打开尚未建立面积档位配置单的解决方案。",
      label: "没有配置单的 Solution",
      path: "solution-center;solutions-incomplete",
      value: data.quality.incompleteSolutions,
    },
    {
      description: "定位缺少首图或正文的文章并继续编辑。",
      label: "文章首图或正文不完整",
      path: "content-quality;quality-post",
      value: data.quality.incompletePosts,
    },
  ];

  return (
    <Box padding={[4, 5, 6]}>
      <DashboardFrame>
        <Stack space={7}>
          <Flex
            align={["flex-start", "center"]}
            direction={["column", "row"]}
            gap={4}
            justify="space-between"
          >
            <Stack space={3}>
              <Text muted size={1} weight="semibold">
                CORAL CONTENT OPERATIONS
              </Text>
              <Heading as="h1" size={3}>
                Coral 运营总览
              </Heading>
              <Text muted size={1}>
                默认只显示英文主内容；点击任意卡片即可进入对应清单，无需再逐项查找。
              </Text>
            </Stack>
            <StructureButton path="content-quality" text="打开内容检查" />
          </Flex>

          <Grid columns={[1, 2, 4]} gap={4}>
            <Metric
              detail="查看英文主产品与 SKU"
              label="英文主产品"
              path="product-center;products-all"
              value={data.counts.products}
            />
            <Metric
              detail="管理场景方案与配置单"
              label="解决方案"
              path="solution-center;solutions-all"
              value={data.counts.solutions}
            />
            <Metric
              detail="编辑文章、分类与作者"
              label="文章与资源"
              path="editorial-center;posts-all"
              value={data.counts.posts}
            />
            <Metric
              detail="管理首页与固定页面"
              label="可管理页面"
              path="pages"
              value={data.counts.pages}
            />
          </Grid>

          <Stack space={4}>
            <Stack space={2}>
              <Heading as="h2" size={2}>
                待处理内容
              </Heading>
              <Text muted size={1}>
                数字为实时结果；点击卡片后将直接打开对应的筛选列表。
              </Text>
            </Stack>
            <Grid columns={[1, 1, 2]} gap={4}>
              {issues.map((issue) => (
                <StructureCard key={issue.label} path={issue.path}>
                  <Stack space={5}>
                    <Flex align="flex-start" gap={4} justify="space-between">
                      <Stack space={3}>
                        <Text size={2} weight="semibold">
                          {issue.label}
                        </Text>
                        <Text muted size={1}>
                          {issue.description}
                        </Text>
                      </Stack>
                      <Badge
                        mode="outline"
                        tone={issue.value > 0 ? "caution" : "positive"}
                      >
                        {issue.value}
                      </Badge>
                    </Flex>
                    <Text
                      size={1}
                      weight="semibold"
                    >
                      {issue.value > 0 ? "查看并处理 →" : "当前已完成 · 查看规则 →"}
                    </Text>
                  </Stack>
                </StructureCard>
              ))}
            </Grid>
          </Stack>

          <Stack space={4}>
            <Stack space={2}>
              <Heading as="h2" size={2}>
                最近更新
              </Heading>
              <Text muted size={1}>
                直接回到最近编辑过的内容。
              </Text>
            </Stack>
            <Card border radius={3}>
              <Stack as="ul" padding={0} space={0}>
                {data.recent.map((document, index) => (
                  <Flex
                    align={["flex-start", "center"]}
                    as="li"
                    direction={["column", "row"]}
                    gap={4}
                    justify="space-between"
                    key={document._id}
                    padding={[4, 5]}
                    style={{
                      borderTop:
                        index === 0
                          ? undefined
                          : "1px solid var(--card-border-color)",
                      listStyle: "none",
                    }}
                  >
                    <Stack space={2}>
                      <Text size={1} weight="semibold">
                        {document.title || document.sku || "未命名内容"}
                      </Text>
                      <Text muted size={1}>
                        {TYPE_LABELS[document._type] || document._type} ·{" "}
                        {new Date(document.updatedAt).toLocaleString("zh-CN")}
                      </Text>
                    </Stack>
                    <OpenDocumentButton
                      documentId={document._id}
                      documentType={document._type}
                    />
                  </Flex>
                ))}
              </Stack>
            </Card>
          </Stack>
        </Stack>
      </DashboardFrame>
    </Box>
  );
}
