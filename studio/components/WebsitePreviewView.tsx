import {useMemo} from "react";
import {Box, Card, Flex, Stack, Text} from "@sanity/ui";
import type {UserViewComponent} from "sanity/structure";

type DisplayedDocument = Record<string, unknown> & {
  _type?: string;
  language?: string;
  route?: string;
  slug?: {current?: string};
};

const PUBLIC_LOCALES = new Set(["es", "fr", "de", "it"]);

function routeFor(document: DisplayedDocument | null | undefined) {
  if (!document?._type) return null;
  let route: string | null = null;

  if (document._type === "home") route = "/";
  if (document._type === "oem") route = "/oem-services";
  if (document._type === "sitePage") route = document.route || null;

  if (!route) {
    const slug = document.slug?.current;
    if (!slug) return null;
    if (document._type === "product") route = `/products/${slug}`;
    if (document._type === "solution") route = `/solutions/${slug}`;
    if (document._type === "post") route = `/resources/${slug}`;
  }

  if (!route) return null;
  const language = document.language || "en";
  if (!PUBLIC_LOCALES.has(language)) return route;
  return route === "/" ? `/${language}` : `/${language}${route}`;
}

export const WebsitePreviewView: UserViewComponent = (props) => {
  const displayed = props.document.displayed as DisplayedDocument | null;
  const route = routeFor(displayed);
  const origin = useMemo(() => {
    const configured = import.meta.env.SANITY_STUDIO_PREVIEW_ORIGIN as
      | string
      | undefined;
    if (configured) return configured.replace(/\/$/, "");
    if (
      typeof window !== "undefined" &&
      ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ) {
      return "http://localhost:4321";
    }
    return "https://coralpilates.com";
  }, []);

  if (!route) {
    return (
      <Box padding={5}>
        <Card border padding={5} radius={2} tone="caution">
          <Stack space={3}>
            <Text size={2} weight="semibold">
              暂时无法预览
            </Text>
            <Text muted size={1}>
              请先填写并保存网址标识 Slug；固定页面还需要系统预设的前台网址。
            </Text>
          </Stack>
        </Card>
      </Box>
    );
  }

  const url = `${origin}${route}`;

  return (
    <Flex direction="column" style={{height: "100%"}}>
      <Card borderBottom padding={3}>
        <Flex align="center" justify="space-between" gap={3}>
          <Text muted size={1} textOverflow="ellipsis">
            {url}
          </Text>
          <Text
            as="a"
            href={url}
            rel="noreferrer"
            size={1}
            target="_blank"
            weight="medium"
          >
            在新窗口打开
          </Text>
        </Flex>
      </Card>
      <Box flex={1}>
        <iframe
          key={url}
          src={url}
          style={{border: 0, display: "block", height: "100%", width: "100%"}}
          title="Coral Pilates 前台预览"
        />
      </Box>
    </Flex>
  );
};
