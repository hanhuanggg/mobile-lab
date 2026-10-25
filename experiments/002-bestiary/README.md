# 异兽图鉴 · 七阶异录

mobile-lab 的第二个正式实验。一部手机优先的东方奇幻古籍图录：七个层级各两只，共十四只原创异兽；每只均有独立插图和完整设定。全文正文约 9,600 字，不含目录与标题。

## 为什么纯前端足够

现有仓库是独立实验组成的静态站点：根首页手工索引，每个 `experiments/XXX-name/` 自带入口与资源。本实验完全沿用这一结构，无运行依赖、构建器、服务器 API 或数据库。

| 能力 | 当前实现 | 是否需要后端 |
| --- | --- | --- |
| 图文、七阶目录、关键词检索 | 本地内容与静态图片 | 否 |
| 独立条目链接、分享、段落跳转 | URL hash；刷新和直达均可 | 否 |
| 续读 | 当前浏览器的 localStorage；拒绝存储时降级为普通阅读 | 否 |
| 多设备同步、账号收藏 | 尚未实现 | 通常需要托管数据服务 |
| 访客在线生成新异兽或插图 | 尚未实现；当前内容与图片在制作阶段生成 | 需要安全的服务端调用、限额和存储 |

后端不会妨碍手机展示。若未来需要它，可继续用 GitHub Pages 展示手机前端，另外部署 API，由网页调用；GitHub Pages 自身不能执行后端代码。API 密钥不能写进静态 JavaScript。当前版本不需要访客提供密钥或连接生成服务。

## 文件

- `index.html`：封面、目录和单条目阅读器。
- `style.css`：古纸、墨色与朱砂的响应式排版。
- `content.js`：权威内容源，七阶说明与十四个完整条目。
- `main.js`：检索、路由、翻阅、分享和续读。
- `assets/01.webp`～`14.webp`：十四幅独立生成、统一美术方向的完整插图；保留生成分辨率，WebP 编码。
- `assets/thumb-*.webp`：目录缩略图，避免为小图加载整张插图。
- `BOOK.md`：按“目录 + 各条目详细内容”整理的完整图文底稿；改内容时同步更新。
- `ART_DIRECTION.md`：统一插图方向与各图的表现重点。
- `tests/browser.cjs`：内容完整性与真实浏览器回归检查。

原图约 5.2 MiB，每张约 270～440 KiB，阅读页只请求当前条目插图。目录使用独立缩略图与原生延迟加载；封面与正文保留高清细节。文字、图片、样式均从本站加载，无 CDN、远端字体或生成 API 请求。

## 运行与链接

在仓库根目录运行：

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

- 图鉴：`/experiments/002-bestiary/`
- 单条目示例：`/experiments/002-bestiary/#shihuiming`
- 段落示例：`/experiments/002-bestiary/#shihuiming~weakness`
- GitHub Pages 对应地址：`https://hanhuanggg.github.io/mobile-lab/experiments/002-bestiary/`

无需 SPA 重写规则。条目位置放在 hash 中，适合 GitHub Pages 和子目录部署。Pages 是否启用及是否已完成线上部署需另行确认。

## 扩展

在 `content.js` 的 `beasts` 中增加条目，提供唯一英文 `id`、`tier`、一张完整插图及其缩略图，并填写现有各字段；按需更新目录总数、页码、底稿与测试数量。层级按存在方式区分，不能直接等同战力榜。所有古籍引文、宗门与地名均为原创虚构世界内资料。

## 验证

测试需要环境已提供 Playwright 与 Chromium，依赖可装在仓库外：

```sh
npm install --prefix /tmp/bestiary-test-tools playwright
NODE_PATH=/tmp/bestiary-test-tools/node_modules CHROMIUM_PATH=/usr/bin/chromium \
  node experiments/002-bestiary/tests/browser.cjs
```

检查七阶各两只、字段与图片完整、全部十四条目在 320 / 390 / 500 / 1280px 下的布局与高清图解码，以及检索、筛选、段落直达、前后页、历史返回、分享地址、续读和存储被拒绝时的阅读。截图和报告写到临时目录。
