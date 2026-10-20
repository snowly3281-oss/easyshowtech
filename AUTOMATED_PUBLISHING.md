# 一键发布 Easyshow

以后完成本地编辑并准备上线时，双击项目根目录的 **发布网站.bat**。也可以在 E:\easyshow 运行 `npm run publish:site`，旧的 deploy-easyshowtech 入口和 `npm run deploy` 也会进入相同流程。

自动完成：检查待发布文件 → 检查读取 Sanity 内容 → 本地构建 → 提交网站文件 → 推送 main → GitHub 构建网站和 Studio → 部署 Studio 和 Cloudflare → 核对 easyshowtech.com 实际版本及六个方案地址。任一步失败会停止并显示错误，不会继续报告“部署成功”。

不再从本地和 GitHub 各部署一次。只有准备上线时才启动发布入口，编辑中的保存操作不会自动上线。

## 发布前预览

`npm run publish:check` 只列出准备提交和跳过的文件，不提交、不推送、不部署。

自动提交限于网站源代码、公共资源、Studio schema/界面/内容建议和发布配置；密钥、个人笔记、debug/log 删除等无关内容留在本地。若 Git 暂存区已经含有无关文件，脚本会停止。若 GitHub main 已领先或分叉，脚本会停止，不会重置或强制推送。

## 部署版本核对

`https://easyshowtech.com/deployment.json` 显示线上 commit、GitHub runId 和构建时间，不含密钥。GitHub 发布必须核对该域名的 commit/runId 和六个方案页面，不能仅以“上传完成”为成功。

GitHub Actions：https://github.com/snowly3281-oss/easyshowtech/actions/workflows/deploy.yml

发布失败后先查看该次日志。若只是网络中断，可再次启动一键发布；已经生成的提交会保留，不会回滚或丢弃工作。没有新的文件修改时会复用同一提交核对已有部署。

## Sanity 读取权限

本项目数据集在无鉴权时查询到 0 个产品/方案，本地使用 SANITY_READ_TOKEN 才能读到内容。因此构建会先检查产品、方案和服务均可读，空内容会阻止发布。

现有 GitHub secrets：SANITY_AUTH_TOKEN、CLOUDFLARE_API_TOKEN、CLOUDFLARE_ACCOUNT_ID。优先添加专用 Viewer 权限的 SANITY_READ_TOKEN；在它未配置时，CI 复用已有 SANITY_AUTH_TOKEN 执行服务端读取，使当前部署链路可以直接运行。密钥不使用 PUBLIC_ 前缀，不写入 Git，也不在日志中打印。

`.nvmrc` 与部署流程统一使用 Node 22.23.2 / npm 10.9.2；依赖按 package-lock 安装。

## 只改后台内容时

部署 Studio 是更新编辑器，不是发布内容。后台修改仍需点击 Publish；英语静态页面随后需要重新构建。

这时可在 GitHub 的 Deploy EasyShowTech 页面点击 Run workflow，无须本地 deploy。流程也已支持 `repository_dispatch` 的 `sanity-content-published` 事件，方便以后连接经过鉴权的 Sanity webhook。当前没有创建 webhook，也没有给 GitHub 定时轮询增加费用。

若 Cloudflare 后台另有原生 Git 构建也部署同名 Worker，应统一只保留该 GitHub 发布链路；版本验证会识别被其他部署覆盖的结果，而不会悄悄显示成功。
