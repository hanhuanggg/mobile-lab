# Zombie Run

一个真的能玩的竖屏自动射击跑酷。没有假广告主题，没有剧情反转。八次补给选择，最终迎战重装母体，一局约 2～3 分钟。

## 玩

按住战场任意位置左右滑动；角色自动前进、自动瞄准前方并开火。滑入补给门选择强化。门出现时会预告下一波敌人。红色通道是 Boss 冲撞预警，及时移开。支持方向键 / A、D，P / Escape 暂停。切换后台自动暂停。声音可关闭，无声音也能完整游玩。

武器替换旧武器，攻击、射速、多弹头和护甲升级保留。每道门另含基础攻击成长和少量恢复，避免防御选择完全失去火力成长。

- Pistol：初始单发、远程点杀。
- SMG：低单发伤害、高频连射，克制散落脆皮。
- Shotgun：六弹扇射、短射程、每颗最多穿透两个目标，适合密集近战。
- Minigun：极高频连射、旋转多枪管弹幕。
- Flamethrower：连续扇形伤害，范围内所有目标同时灼烧；多弹头拓宽火焰锥。
- Rocket Launcher：慢速火箭、碰撞引爆、大范围伤害；多弹头发射多枚火箭。

普通、快速追踪、重装僵尸及 75 / 110 / 160 尸群均是实际实体，非背景动画。重装敌人有更高生命与减伤；Boss 有统一的 78% 装甲减伤、冲撞和增援。金币由击杀实时获得，Boss 额外奖励 500；本地只保存最高金币纪录，没有账号或远端数据。

## 运行

在仓库根目录：

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

访问路径 `/experiments/001-zombie-run/`。原生 Canvas / CSS / JavaScript，无运行依赖、外部图片、字体或构建流程。Canvas 像素密度上限 2；敌人、弹体、尸体和粒子数量设有上限，碰撞使用线段检测。所有移动、射击与波次均按真实时间推进。

GitHub Pages 对应路径：`https://hanhuanggg.github.io/mobile-lab/experiments/001-zombie-run/`。需要仓库已启用 Pages，发布源为 `main` 分支根目录；推送源码本身不等于 Pages 已发布。

## 浏览器实测

`tests/playtest.cjs` 使用真实 Chromium 触摸事件选择路线、躲冲撞，一局约 3 分钟，不修改时间、血量或伤害。两条路线覆盖六种武器及所有升级类型，并检查窄屏、暂停、胜利、奖励、重开和控制台。只读 `window.ZombieRun.snapshot()` 用于观察状态，不提供作弊入口。

测试依赖装在仓库外，不改变本作品的零依赖运行方式：

```sh
npm install --prefix /tmp/zombie-run-test-tools playwright
# 使用已安装的 Chromium；没有系统 Chromium 时可用 Playwright 安装浏览器。
NODE_PATH=/tmp/zombie-run-test-tools/node_modules CHROMIUM_PATH=/usr/bin/chromium \
  node experiments/001-zombie-run/tests/playtest.cjs
NODE_PATH=/tmp/zombie-run-test-tools/node_modules CHROMIUM_PATH=/usr/bin/chromium \
  node experiments/001-zombie-run/tests/playtest.cjs --flame
```

测试报告和截图保存到临时目录。帧间隔统计代表测试机器，不能视为所有手机的性能保证。
