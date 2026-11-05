# 007 · 练什么

极简健身训练 PWA。打开今日计划，记录实际重量与次数，完成后自动保存。中文、默认深色、无需账号、没有后端，全部训练数据存放在当前浏览器的 IndexedDB 中。

## 已实现

- 今日日期、计划预览、手动切换，以及 A / B / C 训练日顺序轮换；完成一次训练后自动选中下一个计划。
- 首次初始化可编辑示例（胸、背、腿）。初始重量为 0 kg，使用时请填写实际重量。示例不是个人训练建议。
- 每组重量（支持小数）和次数、完成勾选、添加和删除组；实际完成进度、计时、训练容量。
- 使用同一动作稳定 ID 继承最近一次真实完成的重量和次数，跨计划也有效。未完成组不会用于容量、历史或历史重量继承。
- 每次修改立即排队写入 IndexedDB；页面刷新、关闭后重新打开会在首页提示恢复。始终只有一个进行中的训练。
- 组间休息倒计时（可跳过），60 / 90 / 120 秒或关闭。倒计时基于时间戳，切入后台后仍能正确恢复。
- 退出训练时明确提供「继续训练」「保存并结束」「放弃本次训练」；放弃需确认，零完成组不能保存为空历史。
- 创建、改名、删除计划，动作搜索与分类、自定义动作，修改组数 / 次数 / 重量、上移 / 下移顺序。
- 历史按年月、日期展示；详情显示实际完成的组，支持二次确认删除。历史保留当时的动作和计划名称快照。
- JSON 导出、结构和引用校验、导入前提示备份与覆盖确认，事务内原子替换。导出包含未完成训练，训练进行中禁止导入覆盖。
- 可安装 PWA、静态资源离线缓存。更新采用提示模式，训练进行中不触发新版本刷新。
- 手机安全区、底部导航、44 px 触摸目标、键盘焦点、状态提示、减少动态效果支持，以及桌面布局。

## 目录

```text
experiments/007-lian-shenme/
├── index.html, assets/, sw.js, workbox-*.js  # 可直接部署的生产产物
├── manifest.webmanifest, icon*.png, icon.svg
├── source/
│   ├── index.html                           # Vite 开发入口
│   ├── public/                              # PWA 图标
│   └── src/
│       ├── App.tsx, main.tsx, styles.css
│       ├── models/types.ts                  # 六类核心实体与备份类型
│       ├── storage/                         # Dexie、初始化、事务、备份校验
│       ├── logic/workout.ts                 # 统计、继承、训练快照
│       ├── components/                      # 通用控件、弹窗、数据设置
│       └── pages/                           # 今日、训练、计划、历史和总结
├── scripts/publish.mjs                      # 将 dist 拷贝到本实验入口
├── tests/workout.test.ts                    # 存储和业务测试
├── tests/e2e/app.spec.ts                     # 生产页面移动端浏览器测试
├── package.json, package-lock.json
└── vite.config.ts, vitest.config.ts, playwright.config.ts, tsconfig.json
```

## 本地开发

需要 Node.js 22.12+（本次使用 Node 24），npm，以及现代浏览器。

```sh
cd experiments/007-lian-shenme
npm ci
npm run dev
```

打开 `http://localhost:5173/`。同一局域网手机可访问终端显示的 Network 地址；通过 HTTP 局域网 IP 访问时浏览器不启用 Service Worker，安装和离线需要 HTTPS 或 localhost。

```sh
npm test                     # Vitest + fake-indexeddb
npm run build                # TypeScript 检查、Vite / PWA 构建、发布静态文件
npx playwright install chromium
npm run test:e2e             # 自动从仓库根启动端口 8000 的静态服务器
npm run preview              # 本实验生产预览，端口 4173
```

也可以沿用仓库原有方式，在**仓库根**执行：

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

打开 `http://localhost:8000/experiments/007-lian-shenme/`。这种方式无需安装依赖，使用已构建的文件，可同时访问陈列馆。

## GitHub Pages 部署

遵循本仓库现有的 `main` 分支根目录发布方式，不改动其他实验：

1. 在本实验目录运行 `npm ci && npm run build`。
2. 提交并推送源码、锁文件和本实验生成的静态文件，以及根陈列馆索引的修改。不要提交 `node_modules`、`dist`、测试输出或本地数据。
3. 仓库 **Settings → Pages → Build and deployment** 选择 **Deploy from a branch → main → / (root)**（原有设置已经如此时无需调整）。
4. 发布后访问 `https://hanhuanggg.github.io/mobile-lab/experiments/007-lian-shenme/`。

Vite 使用 `base: './'`；manifest 的 `start_url` 与 `scope` 均为 `./`，Service Worker 注册到本实验目录，不会控制陈列馆和其他实验。页面不使用依赖服务器回退的 History 路由，因此 GitHub Pages 刷新无需额外 404 配置。构建先输出到忽略的 `dist/`，再由脚本仅更新本实验的产物。修改源码后需要重新构建，再部署生成的文件。

## 数据与更新约定

- 数据库名 `lian-shenme-v1`；使用 Dexie schema version 1。初始化标记独立于计划数量，删除全部计划不会重新塞入示例。
- `ActiveWorkout` 固定主键 `current`，另有独立 session ID。开始和结束均使用事务，结束会等待所有待写入修改；迟到的保存不会重建已结束或放弃的训练。
- `WorkoutSession` 保存结束时的名称、实际完成组快照。修改未来计划或动作名称不改变既往历史。
- 容量是实际完成组的 `kg × 次数` 之和，未完成组不统计；哑铃单侧 / 总重量请保持个人记录习惯一致。自重组填 0 kg，容量为 0，完成组数正常计入。
- 导入上限 20 MB，检查版本、类型、范围、重复 ID、计划动作引用、时间戳和历史快照；验证失败不会修改数据库。格式参考本应用导出的 JSON。导入是覆盖操作，先备份；不提供合并导入。
- Service Worker 仅缓存应用壳，不缓存或上传训练数据。新版本等用户点击更新才激活，进行中隐藏更新按钮。数据存储与缓存更新相互独立。
- 浏览器数据按 origin 隔离；localhost、线上站点、不同浏览器不共享数据。换设备、清理浏览器前请导出备份。可在「数据与设置」申请持久存储，是否授予由浏览器决定。

## 验证与范围

实际执行结果见 [VERIFICATION.md](./VERIFICATION.md)。自动化使用真正的 IndexedDB、真实静态构建和 Chromium 移动端视口；没有用展示数据替代训练保存。单元测试用 fake-indexeddb，浏览器测试使用原生 IndexedDB。

范围内不包含账号 / 云同步、教学视频、复杂分析图表、排行榜、后台 API。尚未进行 iOS / Android 实体设备上的主屏幕安装和系统级存储回收测试。手机直接使用 [GitHub Pages 入口](https://hanhuanggg.github.io/mobile-lab/experiments/007-lian-shenme/)，无需电脑保持运行；首次联网加载后可离线训练。
