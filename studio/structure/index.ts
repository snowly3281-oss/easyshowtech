import type {
  DefaultDocumentNodeResolver,
  StructureBuilder,
  StructureResolver,
} from "sanity/structure";
import {
  ArchiveIcon,
  BulbOutlineIcon,
  CheckmarkCircleIcon,
  CogIcon,
  ComponentIcon,
  DashboardIcon,
  DocumentTextIcon,
  DocumentsIcon,
  FolderIcon,
  HomeIcon,
  ImagesIcon,
  PackageIcon,
  SearchIcon,
  TagIcon,
  TagsIcon,
  UserIcon,
  WarningOutlineIcon,
} from "@sanity/icons";
import {SITE_PAGES, type SitePageDefinition} from "../config/sitePages";
import {OperationsDashboard} from "../components/OperationsDashboard";
import {ProductRelationshipsView} from "../components/ProductRelationshipsView";
import {WebsitePreviewView} from "../components/WebsitePreviewView";
import {
  LOCALIZED_DOCUMENT_TYPES,
} from "../config/i18n";

interface TaxonomyEntry {
  _id: string;
  title?: string;
  slug?: string;
  count?: number;
}

interface TaxonomyResult {
  series: TaxonomyEntry[];
  equipment: TaxonomyEntry[];
}

const ENGLISH_SOURCE_FILTER =
  'coalesce(language, "en") == "en" && !(_id in path("drafts.**"))';
// Content lists in the daily operating workspace deliberately show only the
// English source records. New English drafts remain visible; the extra
// `drafts.` clause above is only for immutable taxonomy counts, where a
// published document and its working draft would otherwise be counted twice.
const ENGLISH_CONTENT_FILTER = 'coalesce(language, "en") == "en"';

const SINGLETONS = [
  "siteSettings",
  "oem",
  "home",
  "sitePage",
  "translationSettings",
];
const EXPLICIT_TYPES = [
  "product",
  "series",
  "equipment",
  "solution",
  "post",
  "postAuthor",
  "postCategory",
  "postTag",
];
const INTERNAL_TYPES = [
  "media.tag",
  "translation.metadata",
  "translationJob",
  "sanity.assist.task.status",
  "uiCopyCatalog",
];

function structureSafeId(prefix: string, documentId: string) {
  return `${prefix}-${documentId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function fixedSitePage(S: StructureBuilder, page: SitePageDefinition) {
  return S.listItem()
    .id(page.documentId)
    .title(page.title)
    .icon(page.icon)
    .child(
      S.document()
        .schemaType("sitePage")
        .documentId(page.documentId)
        .initialValueTemplate(`sitePage-${page.key}`)
        .title(page.title),
    );
}

function filteredProductList(
  S: StructureBuilder,
  {
    id,
    title,
    filter,
    params,
  }: {
    id: string;
    title: string;
    filter: string;
    params?: Record<string, unknown>;
  },
) {
  const list = S.documentList()
    .id(id)
    .title(title)
    .schemaType("product")
    .filter(filter);
  return params ? list.params(params) : list;
}

/**
 * `S.list().items()` accepts ListItems only. Keep every filtered content list
 * behind a ListItem so the operator-facing structure remains valid while the
 * child still receives a precise GROQ filter.
 */
function filteredDocumentListItem(
  S: StructureBuilder,
  {
    id,
    title,
    schemaType,
    filter,
  }: {
    id: string;
    title: string;
    schemaType: string;
    filter: string;
  },
) {
  return S.listItem()
    .id(id)
    .title(title)
    .child(
      S.documentList()
        .id(`${id}-list`)
        .title(title)
        .schemaType(schemaType)
        .filter(filter),
    );
}

function fixedPageGroup(
  S: StructureBuilder,
  title: string,
  group: SitePageDefinition["group"],
) {
  return S.listItem()
    .id(`pages-${group}`)
    .title(title)
    .icon(FolderIcon)
    .child(
      S.list()
        .id(`pages-${group}-list`)
        .title(title)
        .items(
          SITE_PAGES.filter((page) => page.group === group).map((page) =>
            fixedSitePage(S, page),
          ),
        ),
    );
}

export const structure: StructureResolver = async (S, context) => {
  const client = context.getClient({apiVersion: "2026-07-24"});
  let taxonomy: TaxonomyResult = {series: [], equipment: []};

  try {
    taxonomy = await client.fetch<TaxonomyResult>(`{
      "series": *[
        _type == "series" &&
        ${ENGLISH_SOURCE_FILTER}
      ] | order(order asc, title asc) {
        _id,
        title,
        "slug": slug.current,
        "count": count(*[
          _type == "product" &&
          coalesce(language, "en") == "en" &&
          !(_id in path("drafts.**")) &&
          coalesce(catalogType, "equipment") == "equipment" &&
          references(^._id)
        ])
      },
      "equipment": *[
        _type == "equipment" &&
        ${ENGLISH_SOURCE_FILTER}
      ] | order(order asc, title asc) {
        _id,
        title,
        "slug": slug.current,
        "count": count(*[
          _type == "product" &&
          coalesce(language, "en") == "en" &&
          !(_id in path("drafts.**")) &&
          coalesce(catalogType, "equipment") == "equipment" &&
          references(^._id)
        ])
      }
    }`);
  } catch {
    // The Studio remains usable offline; the two dynamic taxonomy folders will
    // simply be empty until the Content Lake is reachable again.
  }

  const isAdministrator = context.currentUser?.roles.some(
    (role) => role.name === "administrator",
  );

  const items = [
    // Site settings is deliberately the first operational entry.
    S.listItem()
      .id("site-settings")
      .title("网站全局设置")
      .icon(CogIcon)
      .child(
        S.document()
          .schemaType("siteSettings")
          .documentId("siteSettings")
          .title("网站全局设置"),
      ),

    S.listItem()
      .id("operations-overview")
      .title("运营总览")
      .icon(DashboardIcon)
      .child(
        S.component(OperationsDashboard)
          .id("operations-dashboard")
          .title("Coral 运营总览"),
      ),

    S.divider(),

    S.listItem()
      .id("pages")
      .title("页面管理")
      .icon(DocumentsIcon)
      .child(
        S.list()
          .id("pages-list")
          .title("页面管理")
          .items([
            S.listItem()
              .id("home-page")
              .title("首页")
              .icon(HomeIcon)
              .child(
                S.document()
                  .schemaType("home")
                  .documentId("home")
                  .title("首页"),
              ),
            fixedPageGroup(S, "核心入口页面", "core"),
            fixedPageGroup(S, "公司与联系页面", "company"),
            S.listItem()
              .id("oem-page")
              .title("OEM 服务")
              .icon(ComponentIcon)
              .child(
                S.document()
                  .schemaType("oem")
                  .documentId("oem")
                  .title("OEM 服务"),
              ),
            fixedPageGroup(S, "资源中心页面", "resource"),
            fixedPageGroup(S, "政策与法律页面", "legal"),
            S.divider(),
            filteredDocumentListItem(S, {
              id: "page-solution-details",
              title: "Solution 详情页面",
              schemaType: "solution",
              filter: `_type == "solution" && ${ENGLISH_CONTENT_FILTER}`,
            }),
          ]),
      ),

    S.listItem()
      .id("product-center")
      .title("产品中心")
      .icon(PackageIcon)
      .child(
        S.list()
          .id("product-center-list")
          .title("产品中心")
          .items([
            S.listItem()
              .id("products-all")
              .title("全部英文主产品")
              .icon(PackageIcon)
              .child(
                filteredProductList(S, {
                  id: "products-all-list",
                  title: "全部英文主产品",
                  filter: `_type == "product" && ${ENGLISH_CONTENT_FILTER} && coalesce(catalogType, "equipment") == "equipment"`,
                }),
              ),

            S.listItem()
              .id("products-parts-accessories")
              .title("Parts / Accessories")
              .icon(ComponentIcon)
              .child(
                S.list()
                  .id("products-parts-accessories-list")
                  .title("Parts / Accessories")
                  .items([
                    S.listItem()
                      .id("products-parts-by-category")
                      .title("按客户可见分类管理")
                      .icon(TagsIcon)
                      .child(
                        S.list()
                          .id("products-parts-by-category-list")
                          .title("按客户可见分类管理")
                          .items([
                            ["springs", "Springs（弹簧与阻力系统）"],
                            ["upholstery", "Upholstery（皮革、坐垫与软包）"],
                            ["cables_ropes", "Cables & ropes（绳索、滑轮与线缆）"],
                            ["footbars_hardware", "Footbars & hardware（脚杆与五金）"],
                            ["training_accessories", "Boxes, mats & training accessories（箱、垫与训练辅件）"],
                            ["other", "Other parts（其他）"],
                          ].map(([category, title]) =>
                            S.listItem()
                              .id(`products-parts-category-${category}`)
                              .title(title)
                              .child(
                                filteredProductList(S, {
                                  id: `products-parts-category-${category}-list`,
                                  title,
                                  filter: `_type == "product" && ${ENGLISH_CONTENT_FILTER} && catalogType in ["accessory", "spare_part"] && partsCategory == $partsCategory`,
                                  params: {partsCategory: category},
                                }),
                              ),
                          )),
                      ),
                    S.divider(),
                    S.listItem()
                      .id("products-accessories")
                      .title("训练附件 / Accessories")
                      .child(
                        filteredProductList(S, {
                          id: "products-accessories-list",
                          title: "训练附件 / Accessories",
                          filter: `_type == "product" && ${ENGLISH_CONTENT_FILTER} && catalogType == "accessory"`,
                        }),
                      ),
                    S.listItem()
                      .id("products-spare-parts")
                      .title("维修与替换零件 / Spare parts")
                      .child(
                        filteredProductList(S, {
                          id: "products-spare-parts-list",
                          title: "维修与替换零件 / Spare parts",
                          filter: `_type == "product" && ${ENGLISH_CONTENT_FILTER} && catalogType == "spare_part"`,
                        }),
                      ),
                  ]),
              ),

            S.listItem()
              .id("products-by-series")
              .title("按产品系列查看")
              .icon(TagIcon)
              .child(
                S.list()
                  .id("products-by-series-list")
                  .title("按产品系列查看")
                  .items(
                    taxonomy.series.map((series) =>
                      S.listItem()
                        .id(structureSafeId("series", series._id))
                        .title(
                          `${series.title || "未命名系列"}（${series.count ?? 0}）`,
                        )
                        .icon(TagIcon)
                        .child(
                          filteredProductList(S, {
                            id: structureSafeId(
                              "products-series",
                              series._id,
                            ),
                            title: series.title || "系列产品",
                            filter:
                              `_type == "product" && ${ENGLISH_CONTENT_FILTER} && coalesce(catalogType, "equipment") == "equipment" && series._ref == $seriesId`,
                            params: {seriesId: series._id},
                          }),
                        ),
                    ),
                  ),
              ),

            S.listItem()
              .id("products-by-equipment")
              .title("按器械类型查看")
              .icon(ComponentIcon)
              .child(
                S.list()
                  .id("products-by-equipment-list")
                  .title("按器械类型查看")
                  .items(
                    taxonomy.equipment.map((equipment) =>
                      S.listItem()
                        .id(structureSafeId("equipment", equipment._id))
                        .title(
                          `${equipment.title || "未命名器械"}（${equipment.count ?? 0}）`,
                        )
                        .icon(ComponentIcon)
                        .child(
                          filteredProductList(S, {
                            id: structureSafeId(
                              "products-equipment",
                              equipment._id,
                            ),
                            title: equipment.title || "器械产品",
                            filter:
                              `_type == "product" && ${ENGLISH_CONTENT_FILTER} && coalesce(catalogType, "equipment") == "equipment" && references($equipmentId)`,
                            params: {equipmentId: equipment._id},
                          }),
                        ),
                    ),
                  ),
              ),

            S.divider(),

            S.listItem()
              .id("products-visible")
              .title("网站可见产品")
              .icon(CheckmarkCircleIcon)
              .child(
                filteredProductList(S, {
                  id: "products-visible-list",
                  title: "网站可见产品",
                  filter: `_type == "product" && ${ENGLISH_CONTENT_FILTER} && coalesce(catalogType, "equipment") == "equipment" && status == "published"`,
                }),
              ),
            S.listItem()
              .id("products-hidden")
              .title("网站隐藏/资料未完成")
              .icon(WarningOutlineIcon)
              .child(
                filteredProductList(S, {
                  id: "products-hidden-list",
                  title: "网站隐藏/资料未完成",
                  filter: `_type == "product" && ${ENGLISH_CONTENT_FILTER} && coalesce(catalogType, "equipment") == "equipment" && status == "draft"`,
                }),
              ),
            S.listItem()
              .id("products-archived")
              .title("已归档产品")
              .icon(ArchiveIcon)
              .child(
                filteredProductList(S, {
                  id: "products-archived-list",
                  title: "已归档产品",
                  filter: `_type == "product" && ${ENGLISH_CONTENT_FILTER} && coalesce(catalogType, "equipment") == "equipment" && status == "archived"`,
                }),
              ),
          ]),
      ),

    S.listItem()
      .id("solution-center")
      .title("解决方案与配置单")
      .icon(BulbOutlineIcon)
      .child(
        S.list()
          .id("solution-center-list")
          .title("解决方案与配置单")
          .items([
            filteredDocumentListItem(S, {
              id: "solutions-all",
              title: "全部解决方案",
              schemaType: "solution",
              filter: `_type == "solution" && ${ENGLISH_CONTENT_FILTER}`,
            }),
            S.listItem()
              .id("solutions-incomplete")
              .title("缺少面积档位配置单")
              .icon(WarningOutlineIcon)
              .child(
                S.documentList()
                  .id("solutions-incomplete-list")
                  .title("缺少面积档位配置单")
                  .schemaType("solution")
                  .filter(
                    `_type == "solution" && ${ENGLISH_CONTENT_FILTER} && count(packages) == 0`,
                  ),
              ),
          ]),
      ),

    S.listItem()
      .id("editorial-center")
      .title("文章与资源")
      .icon(DocumentTextIcon)
      .child(
        S.list()
          .id("editorial-center-list")
          .title("文章与资源")
          .items([
            filteredDocumentListItem(S, {
              id: "posts-all",
              title: "全部文章",
              schemaType: "post",
              filter: `_type == "post" && ${ENGLISH_CONTENT_FILTER}`,
            }),
            S.listItem()
              .id("posts-writing")
              .title("撰写中")
              .icon(DocumentTextIcon)
              .child(
                S.documentList()
                  .id("posts-writing-list")
                  .title("撰写中")
                  .schemaType("post")
                  .filter(
                    `_type == "post" && ${ENGLISH_CONTENT_FILTER} && (!defined(editorialStatus) || editorialStatus == "writing")`,
                  ),
              ),
            S.listItem()
              .id("posts-review")
              .title("等待审核")
              .icon(WarningOutlineIcon)
              .child(
                S.documentList()
                  .id("posts-review-list")
                  .title("等待审核")
                  .schemaType("post")
                  .filter(
                    `_type == "post" && ${ENGLISH_CONTENT_FILTER} && editorialStatus == "review"`,
                  ),
              ),
            S.listItem()
              .id("posts-ready")
              .title("可以发布")
              .icon(CheckmarkCircleIcon)
              .child(
                S.documentList()
                  .id("posts-ready-list")
                  .title("可以发布")
                  .schemaType("post")
                  .filter(
                    `_type == "post" && ${ENGLISH_CONTENT_FILTER} && editorialStatus == "ready"`,
                  ),
              ),
            S.divider(),
            S.documentTypeListItem("postAuthor")
              .title("作者管理")
              .icon(UserIcon),
            filteredDocumentListItem(S, {
              id: "post-categories-all",
              title: "文章分类",
              schemaType: "postCategory",
              filter: `_type == "postCategory" && ${ENGLISH_CONTENT_FILTER}`,
            }),
            filteredDocumentListItem(S, {
              id: "post-tags-all",
              title: "文章标签",
              schemaType: "postTag",
              filter: `_type == "postTag" && ${ENGLISH_CONTENT_FILTER}`,
            }),
          ]),
      ),

    S.listItem()
      .id("content-quality")
      .title("内容检查")
      .icon(SearchIcon)
      .child(
        S.list()
          .id("content-quality-list")
          .title("内容检查")
          .items([
            S.listItem()
              .id("quality-product-image")
              .title("缺少产品首图")
              .icon(ImagesIcon)
              .child(
                filteredProductList(S, {
                  id: "quality-product-image-list",
                  title: "缺少产品首图",
                  filter:
                    `_type == "product" && ${ENGLISH_CONTENT_FILTER} && !defined(mainImage.asset)`,
                }),
              ),
            S.listItem()
              .id("quality-product-gallery")
              .title("缺少产品画廊")
              .icon(ImagesIcon)
              .child(
                filteredProductList(S, {
                  id: "quality-product-gallery-list",
                  title: "缺少产品画廊",
                  filter: `_type == "product" && ${ENGLISH_CONTENT_FILTER} && count(gallery) == 0`,
                }),
              ),
            S.listItem()
              .id("quality-product-summary")
              .title("缺少产品摘要")
              .icon(WarningOutlineIcon)
              .child(
                filteredProductList(S, {
                  id: "quality-product-summary-list",
                  title: "缺少产品摘要",
                  filter:
                    `_type == "product" && ${ENGLISH_CONTENT_FILTER} && (!defined(summary) || summary == "")`,
                }),
              ),
            S.listItem()
              .id("quality-product-taxonomy")
              .title("产品分类不完整")
              .icon(TagsIcon)
              .child(
                filteredProductList(S, {
                  id: "quality-product-taxonomy-list",
                  title: "产品分类不完整",
                  filter:
                    `_type == "product" && ${ENGLISH_CONTENT_FILTER} && (!defined(series) || (count(equipmentTypes) == 0 && !defined(equipment)))`,
                }),
              ),
            S.divider(),
            S.listItem()
              .id("quality-post")
              .title("文章首图或正文不完整")
              .icon(DocumentTextIcon)
              .child(
                S.documentList()
                  .id("quality-post-list")
                  .title("文章首图或正文不完整")
                  .schemaType("post")
                  .filter(
                    `_type == "post" && ${ENGLISH_CONTENT_FILTER} && (!defined(coverImage.asset) || count(body) == 0)`,
                  ),
              ),
            S.listItem()
              .id("quality-solution")
              .title("Solution 配置不完整")
              .icon(BulbOutlineIcon)
              .child(
                S.documentList()
                  .id("quality-solution-list")
                  .title("Solution 配置不完整")
                  .schemaType("solution")
                  .filter(
                    `_type == "solution" && ${ENGLISH_CONTENT_FILTER} && (count(packages) == 0 || !defined(summary))`,
                  ),
              ),
          ]),
      ),

    S.listItem()
      .id("taxonomy")
      .title("分类体系 Taxonomy")
      .icon(TagsIcon)
      .child(
        S.list()
          .id("taxonomy-list")
          .title("分类体系 Taxonomy")
          .items([
            filteredDocumentListItem(S, {
              id: "series-all",
              title: "产品系列",
              schemaType: "series",
              filter: `_type == "series" && ${ENGLISH_CONTENT_FILTER}`,
            }),
            filteredDocumentListItem(S, {
              id: "equipment-all",
              title: "器械分类",
              schemaType: "equipment",
              filter: `_type == "equipment" && ${ENGLISH_CONTENT_FILTER}`,
            }),
            filteredDocumentListItem(S, {
              id: "taxonomy-post-categories",
              title: "文章分类",
              schemaType: "postCategory",
              filter: `_type == "postCategory" && ${ENGLISH_CONTENT_FILTER}`,
            }),
            filteredDocumentListItem(S, {
              id: "taxonomy-post-tags",
              title: "文章标签",
              schemaType: "postTag",
              filter: `_type == "postTag" && ${ENGLISH_CONTENT_FILTER}`,
            }),
          ]),
      ),
  ];

  if (isAdministrator) {
    const usedTypes = [
      ...SINGLETONS,
      ...EXPLICIT_TYPES,
      ...INTERNAL_TYPES,
    ];
    const additionalTypes = S.documentTypeListItems().filter((item) => {
      const id = item.getId();
      return Boolean(id && !usedTypes.includes(id));
    });

    if (additionalTypes.length > 0 || isAdministrator) {
      items.push(
        S.divider(),
        S.listItem()
          .id("advanced-content")
          .title("高级内容与系统工具")
          .icon(CogIcon)
          .child(
            S.list()
              .id("advanced-content-list")
              .title("高级内容与系统工具")
              .items([
                S.documentTypeListItem("sitePage")
                  .title("全部固定页面文档")
                  .icon(DocumentsIcon),
                ...additionalTypes,
              ]),
          ),
      );
    }
  }

  return S.list()
    .id("coral-operations-root")
    .title("Coral 运营工作台")
    .items(items);
};

export const getDefaultDocumentNode: DefaultDocumentNodeResolver = (
  S,
  {schemaType},
) => {
  const previewableTypes = new Set([
    "product",
    "solution",
    "post",
    "sitePage",
    "home",
    "oem",
  ]);

  if (schemaType === "product") {
    return S.document().views([
      S.view.form().id("editor").title("编辑产品"),
      S.view
        .component(ProductRelationshipsView)
        .id("relationships")
        .title("内容关系"),
      S.view
        .component(WebsitePreviewView)
        .id("preview")
        .title("前台预览"),
    ]);
  }

  if (previewableTypes.has(schemaType)) {
    return S.document().views([
      S.view.form().id("editor").title("编辑内容"),
      S.view
        .component(WebsitePreviewView)
        .id("preview")
        .title("前台预览"),
    ]);
  }

  return S.document().views([S.view.form()]);
};
