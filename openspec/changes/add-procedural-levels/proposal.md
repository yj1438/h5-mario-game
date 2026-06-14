## Why

当前游戏只有一关（`level1`），`GameScene` 硬编码 `new World(level1)`，通关后按 `R` 只能重玩同一关——内容严重不足。而手作多关需要逐个用绝对像素坐标摆敌人/金币，成本高、易错、不可持续。我们需要一套**运行时关卡生成 + 进度系统**，以低成本提供丰富的、每次新游戏都不同的关卡内容，并给玩家明确的"过关推进 / 全部通关"目标感与命数压力。

确认的设计取向：**追求多样性而非难度递增**；**保证纯跳跃可达（可解）**，冲刺/蹬墙跳作为可选捷径而非通关依赖。

## What Changes

- 新增**程序化关卡生成器**：给定 `(seed, levelIndex)` 的纯函数产出合法 `LevelData`。采用"连续地面 + 挖坑 + 浮空台"两层模型（与现有 `level1` 同构）；"骨架 + 装饰"分离可解性与趣味性，构造性保证可解；4 个 theme（平原 / 洞穴 / 高塔 / 密集）**塑造结构**且跨 theme 压力等价；seeded PRNG 保证可复现；多层失败兜底。
- 新增**关卡进度系统（run 模型）**：一场游戏开局掷一个 seed 定死 8 关；3 条命；死亡 = 扣命 + 重开当前关（同 layout，因 seed 固定）；命数归零 = 回本场第 1 关；打完第 8 关 = "全部通关" → 开新场（新 seed）。第 1 关走"安全预设"作温柔引导。
- **BREAKING** 重构 `GameScene`：从硬编码 `new World(level1)` 改为按 `LevelProvider` 取关、支持过关切关；`won` 不再"重玩同关"，改为推进下一关（旧的用户可见行为变更）。
- 新增**命数系统** + HUD 显示当前关卡（序号 / 名称）与剩余命数。
- 复用现有 `src/world/LevelValidation.ts`（`computeMaxJumpHeight` / `extractPlatforms` / `horizontalReachAtHeight` / `validateLevel`）作为生成器的可行性原语——生成即验证的反问题。
- **引擎接口 `LevelData` 不变** → `World` / `CollisionWorld` / 实体 / 现有 81 个测试零改动。

## Capabilities

### New Capabilities

- `procedural-level-generation`: 给定 `(seed, levelIndex)` 纯函数产出合法、可解、风格多样的 `LevelData`。涵盖两层生成模型、theme 系统、坑可跨性约束、金币导航放置、seeded 可复现性、失败兜底。纯数据生产能力，不含游戏流程状态。
- `level-progression`: 关卡推进的游戏流程状态机。涵盖 run 模型（seed 掷定 8 关）、命数系统、死亡 / 重开 / 过关 / 通关 / 新场切换语义，以及 HUD 对当前关卡与命数的展示。

### Modified Capabilities

（无——`openspec/specs/` 当前为空，无既有 spec 的需求被改动。）

## Impact

- **新增**：`src/data/levels/generator/`（`rng.ts` / `types.ts` / `themes.ts` / 地面层 walker / 浮空台装饰 / `generateLevel.ts`）、`src/data/levels/LevelProvider.ts`（run 模型 provider）、命数状态。
- **改动**：`GameScene`（按 provider 取关 + 过关切关 + 命数流转）、`Hud`（关卡序号/名称/命数）、`BootScene`/入口（注入 provider）。
- **不动**：`LevelData` / `World` / `CollisionWorld` / `Player` / `Enemy` / `Coin` / `Goal` / `LevelValidation` / 全部现有测试。
- **风险**：长关（60–80 格）+ "死亡重开整关"的挫败感，列为 playtest 头号观察点；若实测不佳，缓解手段（checkpoint）属后续 change，不在本次范围。
- **既有文档**：`docs/level-system-design.md` 为早期设计稿，部分结论（混合架构 / 踩石过虚模型）已被本次探索更新推翻——**以本 proposal 及其 design 为准**。
