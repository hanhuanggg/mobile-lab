# 004 · 才没有高兴呢！

乔巴听到一句赞美，嘴上否认，小蹄子却开始偷偷跳舞。15 秒原创三维同人动画，1920×1080、30fps，含中文对白和极简音效。

- [最终 MP4](hyperframes/output/CHOPPER_NOT_HAPPY.mp4)
- [完整 HyperFrames 项目、源码与重渲染说明](hyperframes/README.md)
- [设计笔记](hyperframes/DESIGN_NOTES.md)
- [成片审查](hyperframes/REVIEW.md)
- [观影入口验证](BROWSER_REVIEW.md)

## 打开

仓库首页进入实验 004，或独立访问 `/experiments/004-chopper-not-happy/`。观影页不需要安装依赖，支持原生播放、暂停、声音、进度拖动、全屏、重播与下载。

本地可在仓库根目录运行：

```sh
python3 experiments/004-chopper-not-happy/serve.py --port 8000
```

它同时提供整个陈列馆，并支持 MP4 字节范围请求。普通 `python3 -m http.server` 可以播放，但部分浏览器无法在其上拖动进度。

## 目录

```text
004-chopper-not-happy/
├── index.html / style.css / main.js  # 手机优先的观影入口
├── serve.py                         # 支持视频分段请求的本地预览
├── assets/poster.jpg
└── hyperframes/                      # 可完整重新渲染的项目
    ├── src/film.js                   # 人物、场景、表情、骨架、相机
    ├── scripts/                      # 构建、音效、配音与逐帧审查
    ├── assets/                       # Three.js、GSAP、本地字体、声音
    ├── preview/                      # 检查与审查结果
    ├── output/CHOPPER_NOT_HAPPY.mp4
    ├── README.md
    └── DESIGN_NOTES.md
```

Builder：角色与相机都在一个持续存在的三维场景里，建立完整播放与重播闭环。

Critic：把小蹄子藏不住高兴的动作拉成近景，并给结尾偷看留一拍。最弱处是玩偶材质的毛绒感较少，选择清楚的表情与肢体表演优先。

Madman：对白一直否认，身体提供相反证据；脚先跳舞，快乐再传到头、帽子和背包，靠表演完成规则反转。

乔巴 / Tony Tony Chopper 是《ONE PIECE》角色，原作尾田荣一郎。本作是非官方同人动画，三维建模与表演为本项目制作。
