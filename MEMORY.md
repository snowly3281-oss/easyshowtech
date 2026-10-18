---
summary: "Agent 长期记忆 — 工具设置与经验教训"
read_when:
  - 手动引导工作区
---

## 项目关键事实

### Sanity 内容模型的三轴重构（2026-10-18）

- product 文档有 **三个独立分类轴**：
  - `series` (reference[])：产品系列，决定 Products Catalog tab
  - `serviceTypes` (reference[] to `service`)：印刷服务分类，决定 Printing Service tab
  - `partsCategory` (reference to `partsCategory`)：配件分类，决定 Parts tab
- `catalogType` ("equipment" | "accessory" | "spare_part") 决定产品出现在哪个前台 tab
- `printingService` boolean 字段已 deprecated，新工作流是用 `serviceTypes`
- `equipment` 文档类型已 deprecated（hidden + readOnly），但产品 schema 仍保留兼容字段 `equipmentTypes` 和 `equipment` reference

### Printing Service 数据驱动上线（2026-10-18 完成）
- 删除了原 5 类工艺维度 service（fabric-printing / vinyl-wrap / seg-frame-print / backdrop-banner / table-cover），改为 7 类**产品类目**维度（custom-canopy / custom-backdrops / custom-flags / custom-table-cover / custom-chair / custom-umbrella / stock-color-canopy）
- 写入 35 条新 service 文档（7 类 × 5 语言 en/es/fr/de/it），通过 `studio/scripts/seed-services.mjs` 跑
- 1 个产品 serviceTypes 引用从 `fabric-printing` → `custom-backdrops`，迁移脚本：`scripts/migrate-printing-services.cjs`
- `service.ts` schema 加了 `coverImage` + `displayInHomeCarousel` + `homeOrder` 字段，operator 在 Sanity 上传图片/写描述后前台自动同步
- 首页 `PrintingService.astro` 从 Sanity 读：filter `displayInHomeCarousel`，按 `homeOrder` 排序
- Header mega menu "By Service" 列也读 Sanity（BaseLayout fetch 后传给 Header）
- 卡片 href 统一改为 `/products?tab=printing&service=<slug>`
- `fetchLocalizedList` 自动做 i18n fallback（用 slug 做 key），翻译缺失时回退到英文

### Products 页面侧栏的 service filter
- `/products?tab=printing&service=custom-canopy` URL 进入时
- 侧栏**只会显示有产品引用的 service**（`products/index.astro` 用 `usedServices` Set 过滤掉空分类）
- 当 custom-canopy 还没有产品时侧栏不会出现这项；用户体验是页面没结果
- **如果要让所有 7 项都在侧栏显示**，需要去掉 `usedServices` 过滤或允许 "空分类" 提示

### Sanity scripts 经验
- `studio/.env` 在 scripts 目录里读不到：要在脚本里**向上递归找**最近的 `studio/.env`，否则 `token=undefined`，`createClient` 用 useCdn 默认 true 静默返回空
- 幂等模式：用 `client.createOrReplace({_id, _type, ...})` 强制 re-index，CDN ~10s 内更新
- Astro dev 模式下 `getStaticPaths` 的 props 在 vite 缓存里不自动重 fetch
- 全清：`node_modules/.vite` + `.astro/settings.json` + `npx astro dev stop` + `npm run dev` 才能拿到最新 Sanity 数据
- AI copy-protection 工具（防复制）会在每个字符后塞零宽字符，严重污染 SEO/可访问性
- **Sanity write token 在 `studio/.env` 里的 `SANITY_API_WRITE_TOKEN`** — 以后用这个，不要每次都问
- **Sanity `client.patch().set()` 写完数据后，CDN 缓存不会立即重索引** —— Studio 的 "Invalid preview config" 标志可能仍来自旧版
- **解决**：用 `client.createOrReplace({_id, _type, ...cleanedDoc})` 强制 re-index，CDN 在 ~10s 内更新
- 调试时**用 Studio console + chrome DevTools 配合**，sanity schema validation 错误通常显示具体字段
- 写 patch script 时要 `await new Promise(r => setTimeout(r, 10000))` 等 CDN 同步后再 verify

### Scripts 目录工具
- `check-printing-service-refs.cjs`：列出所有 service 引用情况
- `migrate-printing-services.cjs`：批量迁移产品引用 + 删除旧 service
- `seed-services.mjs` (studio/scripts/)：批量写入/更新 service 文档

### Service 文档当前状态（迁移后）
- 35 条记录（7 类 × 5 语言 en/es/fr/de/it）
- `description` 字段全部空白（operator 可填）
- `coverImage` 字段已就绪 schema，等待 operator 上传图片
- `displayInHomeCarousel` 默认 true（都在首页显示）
- `homeOrder` 10/20/30/40/50/60/70

---

## 工具设置

Skills 定义工具怎么用。这文件记你的具体情况 — 你独有的设置。

### 这里记什么

加上任何能帮你干活的东西。这是你的小抄。

比如：

- SSH 主机和别名
- 其他执行skills的时候，和用户相关的设置

### 示例

```markdown
### SSH

- home-server → 192.168.1.100，用户：admin
```
