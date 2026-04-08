# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

这是一个基于 Vite、TypeScript、PixiJS 6 和 Vitest 的 H5 横版平台游戏原型。当前仓库未发现已有 `CLAUDE.md`、`README.md`、`.cursor/rules/`、`.cursorrules` 或 `.github/copilot-instructions.md`，因此这里的说明直接以代码现状为准。

## 常用命令

- `npm run dev`：启动 Vite 开发服务器（`0.0.0.0:5173`）
- `npm run build`：先执行 TypeScript build，再执行 Vite build
- `npm run preview`：本地预览构建结果
- `npm run test`：运行 Vitest 测试

当前没有 `lint` 脚本，也没有单独的单文件测试脚本。若需要运行某个测试文件，请直接使用 Vitest CLI，而不是假设仓库里已有对应 npm script。

## 架构与运行流

- 应用入口在 `src/main.ts`，负责获取 `#app` 容器并启动 `Game`。
- `src/app/Game.ts` 创建 Pixi `Application`，初始化 `InputManager` 和 `SceneManager`，并通过 Pixi ticker 驱动每帧更新。
- 场景切换由 `src/app/SceneManager.ts` 统一管理。当前流程是 `BootScene` 在 `enter()` 中立即切换到 `GameScene`。
- `src/scenes/GameScene.ts` 是主要玩法场景，持有 `World` 和 `Hud`，并处理重开与通关提示。
- `src/world/World.ts` 是核心逻辑中心：
  - 使用 `FIXED_TIME_STEP` 做固定步长更新，而不是把物理逻辑直接绑在渲染帧上
  - 在单步更新里串联输入消费、跳跃缓冲/土狼时间、速度更新、碰撞解析、胜利判定和相机更新
  - `restart()` 负责重置玩家位置和运行时状态
- 关卡数据定义在 `src/data/levels/level1.ts`，其结构由 `src/world/Level.ts` 的 `LevelData` 约束。当前 `GameScene` 直接加载 `level1`。

## 代码组织与去哪改

- `src/app/`：应用入口、场景管理、全局配置
- `src/scenes/`：场景层，负责组织 `World` 与 UI
- `src/world/`：核心世界逻辑、关卡结构、碰撞世界、相机
- `src/systems/`：输入、物理、碰撞等系统级逻辑
- `src/entities/`：玩家、终点等实体
- `src/rendering/`：图层与占位渲染逻辑
- `src/data/levels/`：关卡数据
- `src/ui/`：HUD
- `src/utils/`：数学和矩形工具

常见改动入口：

- 调整移动、跳跃、相机参数：先看 `src/app/config/gameConfig.ts`
- 调整场景流：看 `src/app/SceneManager.ts`、`src/scenes/BootScene.ts`、`src/scenes/GameScene.ts`
- 调整关卡布局、出生点、终点：看 `src/data/levels/level1.ts` 和 `src/world/Level.ts`
- 新增纯逻辑规则：优先放在 `src/systems/`、`src/world/` 或 `src/utils/`

## 测试与验证

- 测试使用 Vitest，测试文件与源码 colocated，命名为 `src/**/*.test.ts`
- 当前已有的测试主要覆盖：
  - `src/systems/Physics.test.ts`
  - `src/systems/Collision.test.ts`
  - `src/world/CollisionWorld.test.ts`
  - `src/utils/rect.test.ts`
- 修改核心逻辑后，至少运行：
  - `npm run build`
  - `npm run test`
- 如果改动影响玩法或场景流程，再运行 `npm run dev` 做人工验证：
  - 能正常进入游戏
  - 玩家可左右移动和跳跃
  - 按 `R` 能重开
  - 到达绿色终点后出现通关提示
