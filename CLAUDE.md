# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

基于 Vite、TypeScript、PixiJS 6 和 Vitest 的 H5 横版平台游戏。包含完整的移动/跳跃/蹬墙跳/冲刺手感、巡逻敌人、金币收集计分、死区平滑相机等系统。

## 常用命令

- `npm run dev`：启动 Vite 开发服务器（`0.0.0.0:5173`）
- `npm run build`：先执行 TypeScript build，再执行 Vite build
- `npm run preview`：本地预览构建结果
- `npm run test`：运行 Vitest 测试

没有 `lint` 脚本。若需运行单个测试文件，直接用 Vitest CLI（如 `npx vitest run tests/world/World.test.ts`）。

## 架构与运行流

- **入口** `src/main.ts` → `Game.ts` 创建 Pixi Application，初始化 `InputManager` + `SceneManager`。
- **场景** `BootScene` → `GameScene`（主玩法场景，持有 `World` + `Hud`）。
- **核心世界** `src/world/World.ts`：
  - `FIXED_TIME_STEP`（1/60s）固定步长物理更新
  - 单 step 内串联：输入消费 → 跳跃缓冲/土狼时间 → 蹬墙跳/冲刺 → 速度更新 → 碰撞解析 → 敌人更新 → 敌人碰撞 → 金币收集 → 胜利判定 → 相机更新
  - `restart()` 重置玩家、敌人、金币、分数和所有运行时状态
- **关卡数据** `src/data/levels/level1.ts`，结构由 `LevelData` 约束（含 `playerSpawn`、`goal`、`enemies[]`、`coins[]`）。

## 代码组织

```
src/
├── app/            # 入口、场景管理、全局配置 (gameConfig.ts)
├── scenes/         # BootScene → GameScene
├── world/          # World（核心调度）、Level、CollisionWorld、CameraController
├── systems/        # InputManager、Physics、Collision
├── entities/       # Player、Enemy、Coin、Goal（均继承 BaseEntity）
├── rendering/      # Layers、PlaceholderFactory（占位图形渲染）
├── data/levels/    # 关卡数据
├── ui/             # Hud（标题、提示、状态、计分）
└── utils/          # 数学工具 (clamp, approach)、矩形工具 (intersects)
tests/              # 测试文件（已从 src/ 迁移至 tests/）
```

## 常见改动入口

| 想改什么 | 去哪里 |
|---|---|
| 移动速度、跳跃力度、蹬墙跳、冲刺、相机参数 | `src/app/config/gameConfig.ts`（每个字段有中文注释） |
| 关卡布局、敌人/金币位置、出生点、终点 | `src/data/levels/level1.ts` + `src/world/Level.ts` |
| 玩家状态（新增能力、生命等） | `src/entities/Player.ts` |
| 敌人行为（巡逻 AI、碰撞） | `src/entities/Enemy.ts` + `World.ts` 中 `updateEnemies()` |
| 金币逻辑 | `src/entities/Coin.ts` + `World.ts` 中 `checkCoinCollection()` |
| 物理公式（加速/阻力/重力） | `src/systems/Physics.ts` |
| 碰撞检测算法 | `src/systems/Collision.ts` |
| 相机跟随行为（死区、平滑、前视） | `src/world/CameraController.ts` |
| 输入映射（按键绑定） | `src/systems/InputManager.ts` |
| HUD 布局与内容 | `src/ui/Hud.ts` + `src/scenes/GameScene.ts` |
| 场景流程 | `src/app/SceneManager.ts`、`src/scenes/` |

## 测试与验证

- 测试文件位于 `tests/`，覆盖 Physics、Collision、CollisionWorld、rect、LevelValidation、World
- `tests/world/World.test.ts` 中的 `MockInput` 需实现 `InputManager` 的全部方法（含 `wasDashPressed`、`isDashHeld`、`wasRestartPressed`），否则新增输入接口会破坏测试
- 修改核心逻辑后至少运行：
  - `npm run build`（TypeScript 编译检查）
  - `npm run test`（81 个测试）
- 影响玩法时再 `npm run dev` 人工验证：
  - 正常进入游戏，玩家可移动/跳跃/蹬墙跳/冲刺
  - 敌人巡逻、可被踩踏击杀、侧面碰撞死亡重开
  - 金币可收集，HUD 显示计数和分数
  - 按 `R` 重开，一切重置
  - 到达绿色终点显示通关

## 配置参数速查

所有数值参数集中定义在 `src/app/config/gameConfig.ts`，带中文注释。详细说明见 `README.md` 的 ⚙️ Configuration 章节。
