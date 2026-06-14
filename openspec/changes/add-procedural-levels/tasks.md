# Implementation Tasks

> 实现顺序遵循 design.md 的 Migration Plan：生成器内核（无游戏集成）→ 进度系统 → 集成 → 联调。
> 引擎接口 `LevelData` 不变；`World`/`CollisionWorld`/实体/现有 81 测试不应被改动。
> 每个任务以"可验证"为准（测试通过 / `validateLevel` 空 / 人工 `npm run dev` 观察）。

## 1. 生成器基础设施

- [ ] 1.1 新建 `src/data/levels/generator/rng.ts`：实现 `mulberry32(seed)` 返回 `() => number ∈ [0,1)`；导出 `hashSeed(levelIndex, seed)` 组合函数（`seed ⊕ levelIndex` 风格，避免相邻关线性相关）
- [ ] 1.2 新建 `src/data/levels/generator/types.ts`：定义 `GenParams { seed; levelIndex }`、`Theme { id; name; pitDensity; enemyDensity; floatDensity; verticality; width }`、内部建造用的 `TilePoint`/`Pit`/`FloatPlatform` 等
- [ ] 1.3 新建 `tests/data/generator/rng.test.ts`：断言同 seed 序列确定且可复现、不同 seed 序列不同、`hashSeed` 对相邻 levelIndex 产生显著不同的流

## 2. 地面层生成器（骨架，D2/D3/D7）

- [ ] 2.1 新建 `src/data/levels/generator/groundLayer.ts`：给定 `width` 与 `pitDensity`，产出连续底层地面（最大行实心）+ 坑列表；坑宽 ∈ [2,3]（常规）/ 4（罕见挑战坑，低概率注入）
- [ ] 2.2 实现坑可跨性硬约束（D7）：每个坑坑前 ≥2 格平整、坑后 ≥1 格落地；用拒绝采样保证坑间距不破坏约束；挑战坑 4 格仅当前后空间充裕时允许
- [ ] 2.3 实现节奏感知（反平地涂片 / 反单调）：维护近期坑/平整段历史，避免连续长平整或坑过密
- [ ] 2.4 在 `groundLayer` 产出上构造 `tiles: TileValue[][]` 骨架（仅地面层），并预留玩家出生点（首段平整地面）与终点平台（末段）

## 3. 浮空台层生成器（结构装饰，D2/D3/D6）

- [ ] 3.1 新建 `src/data/levels/generator/floatingLayer.ts`：给定 `floatDensity` 与 `verticality`，在已可达集合的纯跳跃包络内放置浮空台（离地 ≤ `verticality` 格，每块距可达锚点高差 ≤3 格、水平间隙 ≤ `horizontalReachAtHeight(Δh)`）
- [ ] 3.2 复用 `LevelValidation` 的 `computeMaxJumpHeight`/`horizontalReachAtHeight` 做包络计算（D1）；每次新放浮空台后将其加入"已可达集"，支持多跳堆叠（地面→台→台）但总高 ≤ 预算
- [ ] 3.3 theme 的 `floatDensity`/`verticality` 在此驱动结构差异（如"高塔"verticality 高、"平原"低），使结构可观测地不同

## 4. 实体放置（敌人 + 金币导航，D9）

- [ ] 4.1 新建 `src/data/levels/generator/entities.ts`：在 `enemyDensity` 下，于宽 ≥3 格的可达平台（地面段或大浮空台）上放敌人；保证敌人远离出生点 ≥5 格
- [ ] 4.2 实现金币导航放置三类：① 跨坑金币弧（沿坑两侧跳跃抛物线排列）② 主路径金币串（沿地面主路径面包屑）③ 浮空台分支金币（诱惑探索）；MUST NOT 独立随机撒点
- [ ] 4.3 实现金币可达性保证：每枚金币位于某可达平台正上方拾取范围，或两可达平台间跳跃弧上（构造保证，无需额外验证器）

## 5. theme 系统与组装（D6/D10/D11/D12）

- [ ] 5.1 新建 `src/data/levels/generator/themes.ts`：定义 4 个 theme（平原/洞穴/高塔/密集）的参数带初值 + 第 1 关"安全预设"（width=40、pitDensity≈0.1、enemyDensity≈0.1、坑宽≤2、敌人≥5 格）；导出 `pickTheme(rng, prevTheme)`（不连续重复）
- [ ] 5.2 实现 `estimateDifficulty(theme)` 粗略估算（坑×致死 + 敌×威胁 + 垂直×操作 + 宽×耐力）；初值校准使 4 theme 估算极差 ≤ 均值 15%
- [ ] 5.3 新建 `src/data/levels/generator/generateLevel.ts`：编排 `pickTheme → groundLayer → floatingLayer → entities → 组装 LevelData`；内部用瓦片坐标运算、产出转像素（D12）；调用 `validateLevel` 兜底
- [ ] 5.4 实现失败兜底链（D11）：`validateLevel` 失败时 → 子 seed 段重掷（≤5）→ 安全预设重生成 → 内置模板关 + `console.warn`；任何分支均返回合法 `LevelData` 不抛异常
- [ ] 5.5 第 1 关（`levelIndex===1`）强制走安全预设而非 theme 轮（D10）

## 6. 生成器测试（对应 `procedural-level-generation` spec）

- [ ] 6.1 `tests/data/generator/generateLevel.test.ts`：确定性（同输入同输出）、不同 seed 不同关
- [ ] 6.2 可解性：对 `seed ∈ [0..99]` × `levelIndex ∈ [1..8]` 全组合断言 `validateLevel(result) === []`
- [ ] 6.3 坑约束：提取所有坑断言宽 ≤4、坑前 ≥2、坑后 ≥1
- [ ] 6.4 两层模型：底层地面连续（除坑外实心）、浮空台均可达
- [ ] 6.5 theme 多样性：连续关 theme 不重复；高塔 vs 平原平均浮空台高度显著差异
- [ ] 6.6 第 1 关安全预设：坑 ≤1 且 ≤2 格、敌 ≤1 且 ≥5 格
- [ ] 6.7 金币可达：每枚金币在可达平台上方或跳跃弧上
- [ ] 6.8 失败兜底：对边界/构造触发兜底的 seed 断言不抛异常且返回合法 `LevelData`
- [ ] 6.9 引擎契约：生成产物可传入 `new World(...)` 构造成功（可在 World 测试的 MockInput 环境下冒烟）

## 7. 关卡进度系统（D5，对应 `level-progression` spec）

- [ ] 7.1 新建 `src/data/levels/LevelProvider.ts`：run 模型状态 `{ seed; currentLevel; lives }`；初始 `currentLevel=1`、`lives=3`；`current()` 返回 `{ level: generateLevel(seed,currentLevel); index; name; lives }`
- [ ] 7.2 实现 `advanceOnGoal()`：`currentLevel<8` → `currentLevel++`；`===8` → 标记 `cleared` 并触发新场（新 seed、`currentLevel=1`、`lives=3`）
- [ ] 7.3 实现 `onDeath()`：`lives>1` → `lives--`（重开当前关，layout 因 seed 不变而一致）；`lives===1` → 回第 1 关（`currentLevel=1`、`lives=3`，seed 不变）
- [ ] 7.4 暴露 HUD 所需身份：当前关序号、theme 名称、剩余命数；`reset()` 开新场

## 8. 进度系统测试

- [ ] 8.1 `tests/data/LevelProvider.test.ts`：初始 `currentLevel=1`/`lives=3`；`current()` 用同 seed 重算同 layout（重开一致）
- [ ] 8.2 `advanceOnGoal`：中途关 +1、第 8 关触发 cleared + 新 seed（新场第 1 关布局 ≠ 旧场）
- [ ] 8.3 `onDeath`：命数 >1 扣命且 `currentLevel` 不变；命数耗尽回第 1 关且 seed 不变、命数恢复
- [ ] 8.4 全程 seed 不变：在一场内 advance/death 任意次，`seed` 恒定

## 9. 游戏集成（D5，BREAKING 改 GameScene）

- [ ] 9.1 重构 `src/scenes/GameScene.ts`：移除字段初始化的 `new World(level1)`；改为持有 `LevelProvider`，`enter()`/换关时 `new World(provider.current().level)` 并销毁旧 `World.root`（`destroy({children:true})`）
- [ ] 9.2 接入死亡/过关流转：玩家死亡（`World.restart` 触发处）调 `provider.onDeath()` 并重载当前关；`world.won` 时调 `provider.advanceOnGoal()` 并加载下一关/显示"全部通关"
- [ ] 9.3 注意 `World` 现有死亡语义：掉出世界/撞敌 → `restart()`（同关重开）。集成时把"扣命"挂在死亡处、"过关"挂在 `won` 处，`R` 键改为重开当前关（不再"通关后重玩同关"）
- [ ] 9.4 `src/ui/Hud.ts` 增加显示：第 N 关 · 名称、剩余命数；`GameScene.update` 中刷新
- [ ] 9.5 `src/scenes/BootScene.ts`/入口：构造 `LevelProvider`（首场 seed 可用固定值或启动时随机一次）注入 `GameScene`
- [ ] 9.6 `npm run build` 通过（TS 编译）；`npm run test` 现有 81 测试全绿（引擎未改，不应回归）

## 10. 联调与调参（playtest）

- [ ] 10.1 `npm run dev` 人工验证整局流程：第 1 关安全引导 → 进 theme 轮 → 死亡扣命重开同关 → 命数耗尽回第 1 关 → 通关第 8 关"全部通关" → 新场 layout 全新
- [ ] 10.2 验证坑都可跨（纯跳）、敌人巡逻正常、金币可拾取且引导合理、相机/HUD 正常
- [ ] 10.3 playtest 调 theme 参数带（`themes.ts` 纯数据）到顺手；重跑 6.x 测试确保约束仍满足
- [ ] 10.4 观察长关 + 全重开挫败感（design 风险项）：若明显不佳，记录为后续 checkpoint change 的输入（本次不实现）
- [ ] 10.5 更新 `README.md` 与 `CLAUDE.md` 相关章节（关卡数、命系统、生成机制入口）；标注 `docs/level-system-design.md` 为早期稿、以本 change 为准
