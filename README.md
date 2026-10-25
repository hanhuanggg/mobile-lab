# mobile-lab

**Pocket Creative Lab · 口袋创意实验室**

用手机提出一个创意，由 Codex 直接制作成可运行的 Web 作品。这里收藏惊喜、情绪和有点冒险的玩法。

创作优先级：惊喜感 > 独特性 > 情绪冲击 > 可玩性 > 技术炫技。

## 打开

无需安装依赖。在此目录运行：

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

首页为 `/`，模板为 `/experiments/000-template/`。使用任意静态服务器均可，也可部署到 GitHub Pages 等静态托管服务。仓库尚未配置或发布线上站点。

观影实验 003 需要拖动视频进度时，本地可改用 `python3 experiments/003-the-machine-dreams/serve.py --port 8000`；它同时提供整个陈列馆，并支持 MP4 分段请求。

## 创建实验

复制 `experiments/000-template/` 为 `experiments/001-your-name/`（之后递增编号），修改其 HTML、CSS 和 JavaScript，再将条目加入根 `index.html` 并更新数量。每个文件夹都是独立入口，不需要打包器。模板自带一个约 20 秒的规则反转小实验，可自由替换。

手机竖屏优先，默认使用原生 Web 技术。验证 320px、390px 竖屏、完整交互、重置、键盘操作、控制台和资源加载。

## 地图

- `index.html`：实验陈列馆。
- `experiments/`：独立作品，`000-template` 为最小起点。
- [`experiments/003-the-machine-dreams/`](experiments/003-the-machine-dreams/)：15 秒连续空间视觉短片，包含可直接播放的 MP4 和完整 HyperFrames 项目。
- `ideas/inbox.md`：随手记录的念头。
- `graveyard/`：失败作品的封存处；失败不是污点，无聊才是。
- `AGENTS.md`：Codex 工作方式。
- `CREATIVE_RULES.md`：创作底线和判断标准。
- `agents/`：Builder、Critic、Madman 的角色说明。

不默认采用紫色渐变、圆角卡片堆叠、发光按钮或 Dashboard 布局。每个作品都应该长出自己的样子。
