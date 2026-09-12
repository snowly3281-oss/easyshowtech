import type {ComponentType} from "react";
import {
  CaseIcon,
  ComponentIcon,
  DocumentTextIcon,
  EarthGlobeIcon,
  HelpCircleIcon,
  HomeIcon,
  InfoOutlineIcon,
  PackageIcon,
  PinIcon,
  ProjectsIcon,
  SearchIcon,
} from "@sanity/icons";

export interface SitePageDefinition {
  key: string;
  documentId: string;
  title: string;
  route: string;
  description: string;
  icon: ComponentType;
  group: "core" | "company" | "resource" | "legal";
}

/**
 * Fixed website pages that should read like ordinary WordPress pages to an
 * operator. The stable ids let Structure Builder expose one clear edit entry
 * per route without allowing duplicate "About" or "Contact" documents.
 */
export const SITE_PAGES: SitePageDefinition[] = [
  {
    key: "products",
    documentId: "page-products",
    title: "产品中心首页",
    route: "/products",
    description: "管理产品列表页的标题、介绍、筛选说明与 SEO。",
    icon: PackageIcon,
    group: "core",
  },
  {
    key: "solutions",
    documentId: "page-solutions",
    title: "解决方案首页",
    route: "/solutions",
    description: "管理解决方案入口页及其询盘引导。",
    icon: ProjectsIcon,
    group: "core",
  },
  {
    key: "about",
    documentId: "page-about",
    title: "关于我们",
    route: "/about",
    description: "管理品牌、创始人、发展历程和团队介绍。",
    icon: InfoOutlineIcon,
    group: "company",
  },
  {
    key: "factory",
    documentId: "page-factory",
    title: "工厂介绍",
    route: "/factory",
    description: "管理工厂能力、生产流程、质检与参观信息。",
    icon: ComponentIcon,
    group: "company",
  },
  {
    key: "resources",
    documentId: "page-resources",
    title: "资源中心首页",
    route: "/resources",
    description: "管理文章资源列表页的标题、简介和引导内容。",
    icon: DocumentTextIcon,
    group: "resource",
  },
  {
    key: "contact",
    documentId: "page-contact",
    title: "联系我们",
    route: "/contact",
    description: "管理联系页文案、地址、营业时间和询盘说明。",
    icon: PinIcon,
    group: "company",
  },
  {
    key: "privacy",
    documentId: "page-privacy",
    title: "隐私政策",
    route: "/privacy",
    description: "隐私政策正文及生效日期。",
    icon: SearchIcon,
    group: "legal",
  },
  {
    key: "terms",
    documentId: "page-terms",
    title: "使用条款",
    route: "/terms",
    description: "网站与交易相关使用条款。",
    icon: EarthGlobeIcon,
    group: "legal",
  },
  {
    key: "warranty",
    documentId: "page-warranty",
    title: "质保政策",
    route: "/warranty",
    description: "产品质保范围、期限和申请流程。",
    icon: HelpCircleIcon,
    group: "legal",
  },
  {
    key: "returns",
    documentId: "page-returns",
    title: "退换货政策",
    route: "/returns",
    description: "退换货条件、流程和责任说明。",
    icon: CaseIcon,
    group: "legal",
  },
  {
    key: "shipping",
    documentId: "page-shipping",
    title: "运输政策",
    route: "/shipping",
    description: "运输范围、交付方式、费用和风险说明。",
    icon: HomeIcon,
    group: "legal",
  },
];

export const SITE_PAGE_IDS = new Set(SITE_PAGES.map((page) => page.documentId));
