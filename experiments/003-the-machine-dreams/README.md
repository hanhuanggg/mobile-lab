# 003 · THE MACHINE DREAMS

一台机器第一次做梦。15 秒、1920 × 1080、30fps 的连续空间视觉短片，含程序化极简音效。

从仓库首页进入，或直接打开 `/experiments/003-the-machine-dreams/`。观影入口使用原生视频控件，支持手机内联播放、暂停、拖动、声音、全屏、从头播放与下载，无需安装依赖。

本地预览可在仓库根目录运行以下命令；这个无依赖服务器支持 MP4 分段请求，可以直接拖动进度：

```sh
python3 experiments/003-the-machine-dreams/serve.py --port 8000
```

然后打开 `http://127.0.0.1:8000/experiments/003-the-machine-dreams/`。普通 `python3 -m http.server` 可播放影片，但不支持 HTTP Range，部分浏览器在该服务器下无法拖动到中途。正式静态托管应支持字节范围请求。

- [最终 MP4](hyperframes/output/THE_MACHINE_DREAMS.mp4)
- [完整 HyperFrames 项目与运行说明](hyperframes/README.md)
- [设计笔记](hyperframes/DESIGN_NOTES.md)
- [成片审查记录](hyperframes/REVIEW.md)
- [输出参数和 SHA-256](hyperframes/output/manifest.json)

## 文件结构

```text
003-the-machine-dreams/
├── index.html          # 独立、适配手机的观影入口
├── style.css
├── main.js
├── assets/poster.jpg   # 从最终视频提取的海报
└── hyperframes/        # 完整、可重渲染的原始项目
    ├── src/
    ├── scripts/
    ├── assets/
    ├── preview/
    ├── output/THE_MACHINE_DREAMS.mp4
    ├── README.md
    └── DESIGN_NOTES.md
```

观影入口保留返回陈列馆链接；所有资源均使用相对路径，支持仓库子目录部署。视频经 HyperFrames 正式渲染，450 帧已完整解码检查；重新渲染需在 `hyperframes/` 内运行，具体依赖见其 README。

## 观影入口审查

- Builder：原生视频提供完整播放闭环；额外重播按钮从 0 秒重新播放，下载直接指向原始 MP4。
- Critic：手机竖屏中的 16:9 画面较小，因此保留横屏建议和原生全屏，避免裁掉片子的空间构图。
- Madman：规则反转位于影片的最后凝视，不在观影页叠加交互或解释，保留它原本的停顿。

浏览器验证结果见 `BROWSER_REVIEW.md`。
