# Easyshow Solutions 改造说明

本地项目：`E:\easyshow`。本次未部署网站、未推送 GitHub，也未修改 Sanity production 文档。原有未提交的 debug/log 删除保持原状。

## 已实现

- 六个正式场景：Wedding & Party、Events & Trade Shows、Photography & Film、Retail & Pop-Up Stores、Religious & Community、Education & Training，使用需求中指定的 slug。
- 共享 ScenarioDetail：Hero、场景介绍、需求、产品组合、组合逻辑、产品适用印刷服务、项目支持服务、参考配置、定制讨论、相关产品/场景及 RFQ。
- Events & Trade Shows 提供室内/室外两套 Standard 参考配置。其他五个场景复用模板和已有产品引用。
- 引用真实 product/service 文档，不创建重复目录项。参考数量、推荐原因、角色、required/recommended/optional、替代产品可独立维护。
- 扩展现有 solutionPackage / solutionPackageItem；旧 packages 保留。仅人工开启 `scenarioConfiguration` 的 CMS 配置参与新页面，未录入时使用代码中的明确参考配置。
- Hero / gallery / combination 图片字段新增，OG 继续复用 `seo.ogImage`。缺图显示明确标注的场景示意占位 SVG；没有把工厂图或产品图冒充完整项目实拍。
- 产品印刷能力由 `product.printingServices → service` 获取，项目支持由 `solution.supportServices → service` 获取。前台仅显示 active 文档。
- RFQ 复用现有 contact 表单，携带 solution 和 configuration，并预填场地、数量、图稿、目的地与活动日期。未自动发送任何询盘。

## 旧 URL 兼容

依据当前配置的数据集只读查询，历史文档 ID 没变，但公开 slug 已发生变化，不能依据 slug 字面推断场景。

- `solution.boutique-studio`：`boutique-studio`、`event-activation` → `wedding-party`。
- `solution.franchise`：`franchise`、`trade-show-exhibitor` → `events-trade-shows`。
- `solution.rehab-clinic`：`rehab-clinic`、`photography-and-film` → `photography-film`。
- `solution.hotel-spa`：`hotel-spa`、`retail-pop-up` → `retail-pop-up-stores`。
- `solution.home-pt`：`home-pt`、`wedding-and-celebration` → `religious-community`。
- `solution.training-academy`：`training-academy`、`education-and-training` → `education-training`。

12 组 alias 配置 301；静态输出包含有/无尾斜线的规则，多语言运行时也处理 alias。保留当前站点 origin 和 BaseLayout 的 canonical/hreflang 机制，sitemap 收录正式新 URL，排除旧 alias。没有更改当前 noindex 开关。

## 数据录入与迁移

1. 先部署/启动更新后的 Studio schema。不要运行仓库里已有的旧 seed、restore 或 rename 脚本。
2. 在现有 solution 文档上录入新增字段，不创建重复 solution/product/service。新页面可通过稳定文档 ID 或已知 alias 读取原文档，不要求先改 production slug。
3. 参考 `studio/content/solution-scenarios.plan.json`。它是审阅计划，**不是可直接 Sanity import 的文档文件**。其中列出现有文档 ID、新内容建议、真实产品引用、参考数量。
4. 核对后将 `appendPackagesAfterReview` 的配置逐个追加到现有 packages；同 `_key` 已存在则编辑原项。禁止覆盖整个 packages 数组。可以先录 Events 室内/室外样板；每个组合设置 `scenarioConfiguration: true`。
5. 产品项使用已有 `product` 引用。填写 role、quantityLabel、quantityNote、requirement、reason、alternative；quantity 数字可空，不把参考数量当 MOQ。Starter / Standard / Large 可选；同一环境允许一个同档位配置。
6. 材料与印刷适用性继续维护在产品的 `printingServices`。项目级图稿支持维护在 `supportServices`，引用实际类型名 `service`。
7. 上传有权使用的场景图片，补充 alt 和 caption；AI/参考图在 caption 中说明。`seo.ogImage` 使用现有字段，不新增同义 OG 字段。
8. 原 slug 可以保留。若日后修改，先核对翻译文档和 Presentation 设置；本次前台兼容映射已经覆盖查询到的公开 slug 与历史 slug。
9. 内容发布后重建 Astro 的英语静态页面；其他语言继续通过已有运行时路由和英语回退读取。新增静态文案暂按现有 `staticUi` 机制回退英语，可后续补入翻译目录。

## 修改文件清单

- `astro.config.mjs`：静态重定向、sitemap 排除 alias；合并原配置重复的 optimizeDeps.include，保留完整开发预加载列表。
- `src/config/site.ts`：六个导航链接使用正式 URL。
- `src/middleware.ts`：多语言 alias 301，保留查询参数。
- `src/pages/[locale]/[...path].astro`：补齐多语言印刷服务路由。
- `src/pages/printing-services/[slug].astro`：接收 locale 路由传入的 slug，修正 Locale 类型导入路径。
- `src/pages/solutions/[slug].astro`：六个正式页面、稳定 ID 查询、统一模板。
- `src/pages/solutions/index.astro`：六个场景入口和展示场景文案。
- `src/pages/contact.astro`：询盘场景/配置上下文与内容预填。
- `src/components/solution/ScenarioDetail.astro`：可复用详情页。
- `src/data/solutionScenarios.ts`：六场景、文档 ID、alias 映射与说明。
- `src/data/solutionConfigurations.ts`：真实目录引用的参考组合。
- `src/sanity/queries/scenarioSolutions.ts`：显式公开字段与目录引用查询。
- `src/sanity/queries/home.ts`：首页/列表 slug 正规化。
- `src/sanity/sanity.types.ts`：由项目 typegen 生成。
- `studio/schemaTypes/solution.ts`：场景文案、图片、支持服务和相关场景字段。
- `studio/schemaTypes/objects/solutionPackage.ts`：场景启用、环境、新档位。
- `studio/schemaTypes/objects/solutionPackageItem.ts`：关系语义和参考数量。
- `studio/schema.json`：由项目 schema extract 生成。
- `studio/content/solution-scenarios.plan.json`：不执行写入的数据录入计划。
- `public/solutions/scene-placeholder.svg`：明确标注的场景示意占位图。

## 待工厂确认

- 实际尺寸、材料、连接结构、室内/室外使用限制及安装要求。
- 各产品与面料对应的印刷工艺、颜色表现、图稿要求；既有引用不等于对每种变体都适用。
- MOQ、最终配置数量、报价、样品政策、交期、包装运输、售后条款。
- 场景实拍/获授权参考图片、图稿支持的具体范围。

代码中的组合数量仅为需求讨论示例，没有新增 MOQ、规格、固定交期或工艺承诺。

## 验证结果

- `npm run typegen`：通过，生成 26 个查询、74 个 schema 类型。
- `npm run build`：通过，包含现有 prebuild / lock:check。
- `npm run astro -- check`：已执行，143 个错误；完整检查未通过。原始 HEAD 副本在相同依赖下有 154 个错误；按文件、错误代码和消息逐项对比，新增诊断为 0。现有错误主要是旧产品组件与现行 schema 字段不一致、印刷服务页缺少显式结果类型及 Studio 类型兼容问题，未扩大本次范围统一重写。
- 六个构建页面均核对 canonical、六条 hreflang（含 x-default）、sitemap、产品/服务详情链接、RFQ 的场景与配置参数，以及明确的图片占位说明。
- 12 组历史/当前 alias 均生成 301（含尾斜线版本）；旧 alias 未进入 sitemap。
- 本地运行时核对：英语 Events 200、西语 Events 200、西语印刷服务详情 200；法语旧 trade-show-exhibitor 返回 301，保留语言前缀与查询参数。
- 最终验证使用系统已有 Node 24.20.0 / npm 11.19.0。尝试取得项目要求的 Node 22 / npm 10 时下载未完成，已结束该下载；建议在现有项目 CI 的指定版本环境再验一次。package.json 和 package-lock.json 均未改变。
- 既有依赖文件缺失导致首次检查无法启动；恢复依赖后完成上述验证。本地 Astro 预览已恢复，Studio 开发进程保持运行。

目前交付的是本地代码与可审阅的内容方案；Sanity production 新字段尚未录入/发布，网站也尚未部署。
