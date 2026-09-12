import {useEffect, useState} from "react";
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Skeleton,
  Stack,
  Text,
} from "@sanity/ui";
import {useClient} from "sanity";
import {useIntentLink} from "sanity/router";
import type {UserViewComponent} from "sanity/structure";

interface RelatedDocument {
  _id: string;
  _type: "solution" | "post";
  title?: string;
  slug?: string;
  context?: string[];
}

interface RelationshipResult {
  solutions: RelatedDocument[];
  posts: RelatedDocument[];
}

const EMPTY_RESULT: RelationshipResult = {solutions: [], posts: []};

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

function RelationshipSection({
  title,
  description,
  documents,
}: {
  title: string;
  description: string;
  documents: RelatedDocument[];
}) {
  return (
    <Stack space={3}>
      <Box>
        <Heading as="h2" size={1}>
          {title}
        </Heading>
        <Text muted size={1} style={{marginTop: 8}}>
          {description}
        </Text>
      </Box>

      {documents.length === 0 ? (
        <Card border padding={4} radius={2} tone="transparent">
          <Text muted size={1}>
            当前没有关联内容。
          </Text>
        </Card>
      ) : (
        <Card border radius={2}>
          <Stack as="ul" padding={0} space={0}>
            {documents.map((document, index) => (
              <Flex
                align="center"
                as="li"
                gap={4}
                justify="space-between"
                key={document._id}
                padding={4}
                style={{
                  borderTop: index === 0 ? undefined : "1px solid var(--card-border-color)",
                  listStyle: "none",
                }}
              >
                <Stack space={2}>
                  <Text size={1} weight="semibold">
                    {document.title || "未命名内容"}
                  </Text>
                  <Text muted size={1}>
                    {document.context?.filter(Boolean).join(" · ") ||
                      document.slug ||
                      "未设置网址"}
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
      )}
    </Stack>
  );
}

export const ProductRelationshipsView: UserViewComponent = (props) => {
  const client = useClient({apiVersion: "2026-07-24"});
  const documentId = props.documentId.replace(/^drafts\./, "");
  const [data, setData] = useState<RelationshipResult>(EMPTY_RESULT);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;

    client
      .fetch<RelationshipResult>(
        `{
          "solutions": *[
            _type == "solution" &&
            references($documentId)
          ] | order(title asc) {
            _id,
            _type,
            title,
            "slug": slug.current,
            "context": packages[
              references($documentId)
            ].title
          },
          "posts": *[
            _type == "post" &&
            references($documentId)
          ] | order(publishedAt desc) {
            _id,
            _type,
            title,
            "slug": slug.current,
            "context": categories[]->title
          }
        }`,
        {documentId},
      )
      .then((result) => {
        if (!active) return;
        setData(result || EMPTY_RESULT);
        setStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [client, documentId]);

  if (status === "loading") {
    return (
      <Box padding={5}>
        <Stack space={4}>
          <Skeleton animated radius={1} style={{height: 28, width: 240}} />
          <Skeleton animated radius={2} style={{height: 88}} />
          <Skeleton animated radius={2} style={{height: 88}} />
        </Stack>
      </Box>
    );
  }

  if (status === "error") {
    return (
      <Box padding={5}>
        <Card border padding={5} radius={2} tone="critical">
          <Stack space={3}>
            <Text size={2} weight="semibold">
              关系数据读取失败
            </Text>
            <Text muted size={1}>
              请检查网络连接后重新打开此标签。该错误不会影响产品内容本身。
            </Text>
          </Stack>
        </Card>
      </Box>
    );
  }

  return (
    <Box padding={5}>
      <Stack space={6}>
        <Box>
          <Heading as="h1" size={2}>
            内容关系
          </Heading>
          <Text muted size={1} style={{marginTop: 8}}>
            以下内容通过 Sanity reference 自动反向查询，不需要在产品中重复维护。
          </Text>
        </Box>

        <RelationshipSection
          description="配置单中使用该产品的 Solution 与具体档位。"
          documents={data.solutions}
          title="用于哪些解决方案"
        />
        <RelationshipSection
          description="正文模块或关联产品字段中引用该产品的文章。"
          documents={data.posts}
          title="被哪些文章引用"
        />
      </Stack>
    </Box>
  );
};
