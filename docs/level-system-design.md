# 关卡系统扩展设计

> 状态：**分析设计稿（待评审）** ｜ 范围：补充多关卡 + 程序化生成可行性 + 关卡数据格式简化
> 日期：2026-06-14 ｜ 适用代码基线：`dev` 分支 `7231dc8`

---

## TL;DR（结论先行）

1. **三个需求都可行**，且当前代码基线**异常适合**做这件事——因为 `src/world/LevelValidation.ts` 已经把"跳跃可达性"用物理仿真精确算出来了。**程序化生成的可行性保证 = 已有验证器的反问题**，不需要重新发明轮子。
2. **推荐混合方案**：以"离线手作关卡"为骨干（保证品质与教学曲线），叠加"分块拼接式程序化生成器"作为无尽/随机模式。**两者产出同一种 `LevelData`，引擎层零改动**。
3. **关卡数据"繁杂"的根因不是瓦片网格**（ASCII 网格本身很紧凑），而是**敌人/金币/出生点/终点全部用绝对像素坐标**——手写时要做像素心算、挪一个平台要手动重算一堆坐标。简化方向：**实体改用瓦片坐标 / ASCII 图例绘制，编译期再转像素**。
4. **隐藏的第四块工作**：目前 `GameScene` 硬编码 `new World(level1)`，没有"过关→进入下一关"的进度系统。**无论离线多关还是程序化生成都需要先补这一层**。
5. 程序化生成采用**"构造时即保证合法"**而非"生成后拒绝重试"——每块（chunk）单独可解、缝合时按可达性约束对齐，生成出的关卡**理论上必然通过 `validateLevel`**。

---

## 目录

1. [现状分析](#1-现状分析)
2. [需求拆解](#2-需求拆解)
3. [关键发现：验证器即生成器的地基](#3-关键发现验证器即生成器的地基)
4. [跳跃可达性的硬数据（设计约束的数值基础）](#4-跳跃可达性的硬数据设计约束的数值基础)
5. [关卡数据格式简化方案](#5-关卡数据格式简化方案)
6. [方案一：离线补充静态关卡](#6-方案一离线补充静态关卡)
7. [方案二：运行时程序化生成](#7-方案二运行时程序化生成)
8. [推荐方案：混合架构](#8-推荐方案混合架构)
9. [架构设计](#9-架构设计)
10. [程序化生成的严格可行性约束](#10-程序化生成的严格可行性约束)
11. [程序化生成算法详解（分块拼接）](#11-程序化生成算法详解分块拼接)
12. [关卡进度系统（缺失的第四层）](#12-关卡进度系统缺失的第四层)
13. [实施计划（分阶段）](#13-实施计划分阶段)
14. [风险与权衡](#14-风险与权衡)
15. [测试策略](#15-测试策略)
16. [下一步](#16-下一步)

---

## 1. 现状分析

### 1.1 关卡数据现状

`src/data/levels/level1.ts` 当前长这样（节选）：

```ts
const rows = [
  '0000000000000000000000000000000000000000',
  // ... 11 行 ASCII
];
export const level1: LevelData = {
  name: 'Color Plains',
  width: rows[0].length, height: rows.length,
  tiles: rows.map((row) => row.split('').map((v) => Number(v) as 0|1)),
  playerSpawn: { x: 96, y: 360 },
  goal: { x: 1680, y: 144, width: 56, height: 96 },
  enemies: [
    { x: 400, y: 396 }, { x: 900, y: 396 }, { x: 1400, y: 396 }, { x: 600, y: 204 },
  ],
  coins: [
    { x: 200, y: 400 }, /* ...15 枚，全是手算像素 */
  ],
};
```

**繁杂点定位：**

| 维度 | 现状 | 问题 |
|---|---|---|
| 瓦片地形 | ASCII 字符串 | ✅ 已经很紧凑，不动 |
| `width`/`height` | 手填 | ❌ 多余，可从 `tiles` 推导 |
| 出生点/终点 | 绝对像素 | ❌ 手算、挪地形要重算 |
| 敌人/金币 | 绝对像素，**与平台无语义关联** | ❌ 最痛：注释要靠人脑维护"这枚金币在第 8 行平台上" |
| 终点尺寸 | `56×96` 每次重复 | ⚠️ 几乎恒定，可做默认值 |

### 1.2 引擎如何消费关卡

```
LevelData ──► World (constructor)
                ├─ CollisionWorld(level)        // 碰撞用 level.tiles
                ├─ buildTerrain()               // 渲染地形
                ├─ new Player(..., spawn.x, spawn.y)
                ├─ new Goal(..., goal.*)
                ├─ enemies = spawns.map(s => new Enemy(..., s.x, s.y))
                └─ coins   = spawns.map(s => new Coin(..., s.x, s.y))
```

**关键事实：`World` 只认 `LevelData` 这一个接口。** 只要生成器/手作关卡最终产出合法 `LevelData`，`World`、`CollisionWorld`、所有实体、所有测试**完全不用动**。这是整个设计的稳定基石。

### 1.3 关卡进度现状

```ts
// GameScene.ts —— 当前
private readonly world = new World(level1);   // ← 硬编码第 1 关
```

- 没有"关卡列表"，没有"下一关"。
- `won == true` 时 HUD 显示"通关成功！按 R 再来一次"，`R` 只是 `restart()` 同一关。
- **要做"多关"或"生成"，必须先补进度层（见第 12 节）。**

---

## 2. 需求拆解

| # | 需求 | 本质 | 难度 |
|---|---|---|---|
| A | "现在只有一关，太少了" | 需要关卡**供给源** + 关卡**进度系统** | 中（进度层缺失） |
| B-1 | 离线补 3 关，本地数据 | 静态数据文件 | 低（已有验证器兜底） |
| B-2 | 运行时程序化生成，需严格可行策略 | **构造合法 `LevelData` 的算法** | 高（但有现成地基） |
| C | 关卡数据太繁杂，简化 | 数据格式重构 | 中（需迁移 level1） |

A 是 B-1/B-2 的共同前置依赖。C 与 B-1/B-2 正交，但**建议先做 C**，因为新关卡（无论手作还是生成）都该用简化格式，避免"先写繁的再改"。

---

## 3. 关键发现：验证器即生成器的地基

`src/world/LevelValidation.ts` 已经实现了：

| 函数 | 作用 | 对生成的意义 |
|---|---|---|
| `computeMaxJumpHeight(config, dt)` | 用固定步长**物理仿真**起跳全过程，得精确最大上升高度（≈140px） | 生成器的"垂直可达上限" |
| `extractPlatforms(tiles)` | 扫描瓦片，提取所有**可站立平台表面** | 生成器的"节点集合" |
| `horizontalReachAtHeight(h, config)` | 抛体运动公式，给定高差算**水平可达距离** | 生成器的"水平缝合窗口" |
| `validateLevel(level)` | 从地面平台出发 **BFS 传播可达性**，未达即报错；再查终点邻接 | 生成器的**正确性保证 + 回退校验** |

**核心洞察：生成 = 验证的反问题。**

- 验证器问："这些平台之间，从地面能不能跳到任意一个？"
- 生成器只要保证："每放一块新平台，都落在'已可达集合'的跳跃半径内"——就**构造性地**保证了验证必然通过。

这意味着程序化生成不需要"赌一把 → 验证 → 失败重试"的脆弱循环，而是**按可达性约束直接长出来**。第 11 节给完整算法。

> ⚠️ 一个重要的边界：当前 `validateLevel` **只建模普通跳跃**，未建模**冲刺**与**蹬墙跳**（二者都能显著扩大可达范围）。因此验证器**偏保守**——它判为可达的，实际一定可达；它判为不可达的，可能其实可用冲刺/蹬墙跳到达。对生成器而言，**用保守的跳跃模型设计 = 永远安全**（关卡一定能纯跳通过），把冲刺/蹬墙跳当作"可选的高级捷径"。本设计采纳此原则。

---

## 4. 跳跃可达性的硬数据（设计约束的数值基础）

用 `PLAYER_CONFIG`（`jumpVelocity=760, gravity=2000, maxMoveSpeed=280`）代入验证器同款公式，得到关卡设计/生成的**数值约束表**：

| 高差 Δh（向上） | 水平可达距离 | 折合瓦片（48px） |
|---:|---:|---:|
| 0（平跳） | 213 px | ≈ 4.4 格 |
| 48 px（1 格） | 193 px | ≈ 4.0 格 |
| 96 px（2 格） | 168 px | ≈ 3.5 格 |
| 144 px（3 格，接近极限） | ~112 px | ≈ 2.3 格 |
| >144 px | **0（不可达）** | 不可达 |

**最大垂直跳跃高度 ≈ 144 px ≈ 3 格。**

### 设计/生成经验法则（保守、纯跳跃）

- **垂直阶跃 ≤ 3 格。** 平台之间高度差超过 3 格 = 玩家跳不上去。
- **水平间隙 ≤ 4 格（同高）。** 越往上跳，能横跨的越窄。
- **平台着陆地宽度 ≥ 2 格**（玩家碰撞箱宽 34px，1 格 48px 勉强，2 格舒适）。
- **敌人巡逻平台宽 ≥ 3 格**（否则来回太频繁、视觉差；引擎边沿检测会兜底转向，不会掉坑）。
- 以上是**上限**；实际设计应留 1 格余量（手感、容错）。

这些数字既是手作关卡的"心算速查表"，也是程序化生成 chunk 缝合的硬约束。

---

## 5. 关卡数据格式简化方案

### 5.1 目标

- 实体坐标**脱离绝对像素**，改用**瓦片坐标或可视化绘制**。
- `width`/`height`/终点尺寸等**可推导/常量字段自动填充**。
- 保持运行时引擎接口 `LevelData`（像素）**不变**——只在外面包一层更友好的**编写格式**。

### 5.2 推荐格式：图例绘制（最直观）

把地形、敌人、金币、出生点、终点**画在同一张 ASCII 图里**，一眼看清全关。

```ts
// 图例：
//   '.' = 空        '#' = 实体地形
//   'P' = 玩家出生  'G' = 终点
//   'E' = 敌人(落在该格)  'C' = 金币(浮在该格)
//   ' ' = 空（与 '.' 等价）

interface LevelAuthoring {
  name: string;
  art: string[];          // 可视化关卡图（行宽需对齐）
  goalSize?: { w: number; h: number };  // 默认 56×96
  // 进阶：可覆盖编译期默认行为，多数情况不用填
  coinOffset?: { dx: number; dy: number };
}
```

#### level1 用新格式重写（对比效果）

**现在（66 行，一堆手算像素）：**

```ts
export const level1: LevelData = {
  name: 'Color Plains',
  width: 40, height: 11,
  tiles: rows.map(...),
  playerSpawn: { x: 96, y: 360 },
  goal: { x: 1680, y: 144, width: 56, height: 96 },
  enemies: [{x:400,y:396},{x:900,y:396},{x:1400,y:396},{x:600,y:204}],
  coins: [/* 15 枚手算坐标 */],
};
```

**简化后（一张图，所见即所得）：**

```ts
export const level1: LevelAuthoring = {
  name: 'Color Plains',
  art: [
    '........................................',  // row 0
    '........................................',
    '............................####........',  // 第4平台(高处)
    '......................####..............',
    '............####..................CCC...',  // 第3平台+金币
    '.....####........................E.......',  // 第2平台+敌人
    '..E..............................CCC....',  // (示意)
    'CCCCC....E............E..........#.......',
    '########################################',  // 地面
  ],
};
```

> 注：上图仅示意结构，精确对齐以迁移时逐格校准为准。迁移后跑 `validateLevel` + 人工 `npm run dev` 校验。

**收益：**
- 关卡一眼可读，挪平台时连带绘制一起挪，**不再有坐标与地形脱节的隐患**。
- `width`/`height` 从 `art` 维度推导；终点尺寸用默认值；实体坐标编译期算。
- 新关卡创作成本大幅下降（这是离线补 3 关能"快"的前提）。

### 5.3 编译器：`compileLevel(authoring) => LevelData`

单一入口，所有编写格式（手作 + 生成器）都过它：

```ts
// src/data/levels/compileLevel.ts（伪代码）
export function compileLevel(a: LevelAuthoring): LevelData {
  const height = a.art.length;
  const width  = Math.max(...a.art.map(r => r.length));
  const tiles: TileValue[][] = [];
  const enemies: TilePoint[] = [];   // 暂存瓦片坐标
  const coins: TilePoint[] = [];
  let spawn: TilePoint | null = null;
  let goalTile: TilePoint | null = null;

  for (let row = 0; row < height; row++) {
    tiles[row] = [];
    for (let col = 0; col < width; col++) {
      const ch = a.art[row]?.[col] ?? '.';
      tiles[row][col] = (ch === '#') ? 1 : 0;
      if (ch === 'P') spawn = { col, row };
      else if (ch === 'G') goalTile = { col, row };
      else if (ch === 'E') enemies.push({ col, row });
      else if (ch === 'C') coins.push({ col, row });
    }
  }
  // 瓦片坐标 → 像素（实体落格规则见下）
  // 调 validateLevel(result)，error 非空则抛出/打 console.error
  return { name, width, height, tiles, playerSpawn, goal, enemies, coins };
}
```

**落格规则（瓦片→像素）：**
- 玩家：`x = col*TILE`, `y = row*TILE`（落在该格，引擎重力会让它落到下方平台）。建议把 `P` 放在地面上一格的空格。
- 终点：`x = col*TILE`, `y = row*TILE`，尺寸取 `goalSize ?? {56,96}`。
- 敌人：`x = col*TILE`, `y = row*TILE`（该格即敌人所占格；脚下需有平台，引擎重力+边沿检测兜底）。
- 金币：`x = col*TILE + (TILE-size)/2`, `y = row*TILE + (TILE-size)/2`（居中浮空，符合现有 bob 动画）。

### 5.4 兼容性

- **引擎层 `LevelData` 不变** → `World`/`CollisionWorld`/实体/全部测试零改动。
- 手作关卡 `import { level1 } from '.../level1'` 改为 `compileLevel(level1Art)`，调用点（`LevelProvider`/`GameScene`）只改一处。
- 迁移可逐关进行，不破坏现有 `level1` 测试（`validateLevel(level1)` 改为 `validateLevel(compileLevel(level1Art))`）。

---

## 6. 方案一：离线补充静态关卡

### 6.1 做法

1. 先做格式简化（第 5 节）。
2. 用新格式手作 `level2`、`level3`、`level4`，难度递增：
   - **L2**：引入更多坑、增加蹬墙跳垂直段、双敌人组合。
   - **L3**：冲刺跨大坑、悬空金币弧线、敌人密度提升。
   - **L4**：综合关，垂直爬升 + 限时冲刺序列（可选）。
3. 每关写完跑 `validateLevel`（必过）+ `npm run dev` 人工通关一次。
4. 补进度系统（第 12 节），把 4 关串起来。

### 6.2 优点

- **零算法风险**，验证器已保证可解。
- 品质、教学曲线、节奏完全可控——"手感"是手作关卡的核心价值。
- 可测试、可回归、确定性。

### 6.3 缺点

- 不 scale：每关仍是人工，做完 4 关就到顶。
- 复玩性 = 0。

### 6.4 工作量

低。主要是格式简化 + 3 关设计 + 进度层。估算 1～1.5 个工作单元。

---

## 7. 方案二：运行时程序化生成

用户原话："出一套关卡运行时生成的策略，要注意跳板、敌人、获得物的合理分配，和一套严格的可行的逻辑策略……这个有点难。"

**难，但可行，且有两条技术路线：**

### 7.1 路线 2a：分块拼接（Chunk Stitching）—— 强烈推荐

借鉴 Spelunky 的成熟做法：维护一个**手工设计的小关卡块库**（每块单独可解、有人/出锚点），运行时按难度曲线**左→右缝合**。

**为什么这是正解：**
- 每个 chunk 由设计师保证"手感"，所以生成的关卡**像人做的**，不会有纯算法生成的"机械感/反人类跳跃"。
- 可达性约束只在**缝合处**需要校验（相邻 chunk 的出/入锚点高差 ≤ 3 格、水平间隙 ≤ 可达距离）——约束极简、可构造性保证。
- 块库可小步增长（先 6 块就能组合出几十种关卡）。
- 内部还能再随机（同一块内的金币/敌人位置抖动）。

**与验证器的关系：** chunk 缝合按第 4 节约束做 → 输出 `LevelData` → 跑 `validateLevel` **作为最终保险**（理论必过；若不过说明 chunk 库有 bug，立即定位）。

详见第 11 节算法。

### 7.2 路线 2b：纯算法生成（平台随机游走）—— 不推荐作主力

逐个平台放置：从地面出发，每次在"已可达集合"的跳跃半径内随机放下一块平台，再在上面放敌人/金币。

- **优点**：块库 = 0，纯代码。
- **缺点**：节奏、美观、公平性全靠调参；容易出"一片平地"或"密不透风"；坑的深浅、敌人位置容易反人类；调到"好玩"的投入远大于 2a。
- **可达性可保证**（只往可达半径内放），但**"好玩"无法用约束保证**——这正是 2a 用手工 chunk 解决的痛点。

> 结论：**2a 为主力，2b 仅作为 chunk 内部"微随机"的手段**（如某块的金币数、敌人左右抖动）。

---

## 8. 推荐方案：混合架构

```
┌─────────────────────────────────────────────┐
│              LevelProvider (抽象)            │   ← 第12节
│   next(): LevelData | null   reset()        │
├──────────────────┬──────────────────────────┤
│  StaticProvider  │   EndlessProvider        │
│  (手作关卡数组)   │   (生成器 + 种子)         │
└────────┬─────────┴──────────┬───────────────┘
         │ compileLevel()     │ generateLevel()
         ▼                    ▼
   ┌──────────────────────────────────┐
   │        LevelData (像素)          │  ← 引擎唯一接口，不变
   └──────────────┬───────────────────┘
                  ▼
              World / CollisionWorld / Entities   （零改动）
```

- **两种供给源都产出 `LevelData`**，下游完全无感。
- 玩家可选拓模式：`Static`（通关 L1→L4）或 `Endless`（随机生成、难度递增）。
- 手作关卡是骨干与教学，生成器是复玩性来源，**互不冲突，可同时存在**。
- 即使先只做方案一（静态多关），架构也已为方案二留好接入点——**分阶段、不返工**。

---

## 9. 架构设计

### 9.1 新增/改动文件清单

```
src/
├── data/levels/
│   ├── compileLevel.ts        【新】编写格式 → LevelData；落格规则；内置 validateLevel
│   ├── authoring.ts           【新】LevelAuthoring 类型 + 图例常量
│   ├── level1.ts              【改】改为导出 LevelAuthoring（或保留兼容导出）
│   ├── level2.ts              【新】手作
│   ├── level3.ts              【新】手作
│   ├── level4.ts              【新】手作
│   ├── index.ts               【新】手作关卡有序数组 + 默认 StaticProvider
│   ├── generator/
│   │   ├── types.ts           【新】Chunk / GenParams / GenResult 类型
│   │   ├── chunks.ts          【新】chunk 库（手工设计的可解小块）
│   │   ├── rng.ts             【新】seeded PRNG（mulberry32），保证可复现/可测
│   │   ├── stitcher.ts        【新】按可达性缝合 chunk 序列 → LevelAuthoring
│   │   ├── difficulty.ts      【新】难度曲线（随关卡序号/距离调整选块与密度）
│   │   └── generateLevel.ts   【新】generateLevel(seed, params): LevelData（内含 compile+validate）
│   └── LevelProvider.ts       【新】抽象 + StaticProvider + EndlessProvider
├── scenes/
│   └── GameScene.ts           【改】改为从 provider 取关、支持"下一关"切换
└── ui/
    └── Hud.ts                 【改】显示"第 N 关 / 名称"、模式
（引擎层 World/CollisionWorld/entities/systems 全部不动）
tests/
├── data/compileLevel.test.ts         【新】图例解析、落格、默认值
├── data/generator.test.ts            【新】多 seed 生成 → 全部 validateLevel 通过；可复现性
└── data/LevelProvider.test.ts        【新】Static 顺序、Endless 递增、reset
```

### 9.2 核心类型（草稿）

```ts
// ── authoring.ts ──
export interface LevelAuthoring {
  name: string;
  art: string[];
  goalSize?: { w: number; h: number };
}

// ── generator/types.ts ──
export interface Chunk {
  name: string;
  difficulty: 1 | 2 | 3;     // 用于难度曲线选块
  width: number;              // 列数
  height: number;             // 行数（建议统一，便于缝合）
  tiles: TileValue[][];       // 局部坐标
  entry: TilePoint;           // 入口锚点（左边界附近、玩家落地行）
  exit:  TilePoint;           // 出口锚点（右边界附近）
  enemies: TilePoint[];       // 局部坐标
  coins:   TilePoint[];
  // 可选：标注是否含垂直段（蹬墙跳）、大坑（冲刺）等，用于难度匹配
}

export interface GenParams {
  seed: number;               // 种子（可复现）
  targetCols: number;         // 目标总宽（格）
  difficulty: number;         // 1..N，随无尽层数递增
}

// ── LevelProvider.ts ──
export interface LevelProvider {
  current(): { level: LevelData; index: number; name: string } | null;
  next(): boolean;            // 推进，false = 已到尽头（仅 Static）
  reset(): void;
  total?: number;             // Static 有；Endless 为 Infinity
}
```

---

## 10. 程序化生成的严格可行性约束

生成器必须保证的**硬约束**（全部可由现有 config 推导/校验）：

| # | 约束 | 来源/校验手段 |
|---|---|---|
| 1 | **全平台可达**：从地面 BFS 可达任一平台 | 构造保证（chunk 内可解 + 缝合可达）+ `validateLevel` 兜底 |
| 2 | **垂直阶跃 ≤ 3 格**（≈144px） | `computeMaxJumpHeight`，缝合时校验 `\|Δrow\| ≤ 3` |
| 3 | **缝合水平间隙 ≤ 可达距离** | `horizontalReachAtHeight(Δh)`，按高差查表/算 |
| 4 | **着陆地宽 ≥ 2 格** | chunk 设计约束（不放在生成期判） |
| 5 | **敌人立于平台**（脚下有实体）、巡逻平台宽 ≥ 3 格 | chunk 内设计；落格规则保证 |
| 6 | **敌人不与出生点重叠/过近**（如 ≥ 3 格） | 缝合后扫描；或保证首块 chunk 无敌人 |
| 7 | **金币可达**：金币在可达平台上方，或在可达跳跃弧线上 | 放置时只取"已可达平台"上方的空格；新增 `validateCoinsReachable`（可选） |
| 8 | **终点邻接可达平台** | `validateLevel` 已检查；末块 exit 锚点即终点所在 |
| 9 | **出生点合法**：不嵌实体、`x≥0`、`y` 在地面附近 | 落格规则 + 校验 |
| 10 | **世界边界**：终点在宽度内、无越界实体 |缝合时累加列偏移，末列 = Σchunk.width |

**软约束（影响"好玩"，非硬性，由难度曲线调控）：**
- 坑的频率随难度↑；前 1～2 块强制"安全引导"（无敌人、无致死坑）。
- 敌人密度随难度↑但设上限（避免密度爆炸）。
- 垂直度（上下起伏）随难度↑。
- 金币形成"诱惑路径"：放在略需技巧但安全的弧线上。

> **关于冲刺/蹬墙跳**：硬约束按"纯跳跃可达"设计，关卡一定可纯跳通关。冲刺用于跨大坑捷径、蹬墙跳用于垂直捷径——作为**奖励高级操作**，不作为可达性依赖。这样 `validateLevel` 的保守性与生成安全完全一致。

---

## 11. 程序化生成算法详解（分块拼接）

### 11.1 总体流程

```
generateLevel(seed, params):
  rng = mulberry32(seed)
  canvas = 空白大画布（params.targetCols 列 × H 行）
  curCol = 0
  chosen = []

  # 1) 按难度曲线选 N 个 chunk，左→右缝合
  for i in 0..N-1:
    diff = difficultyCurve(params.difficulty, i / N)   # 1..3，随进度↑
    chunk = pickChunk(rng, chunkLib, diff, i==0, i==N-1) # 首块=引导，末块=终点
    # 可达性校验：与上一块 exit 对齐
    placeChunk(canvas, chunk, curCol, prevExit)
    chosen.push(chunk); curCol += chunk.width

  # 2) 末块 exit 处放终点（goal）
  # 3) 首块 entry 处放玩家出生
  # 4) chunk 内部微随机：金币数/敌人抖动（受 rng 控制）
  # 5) 组装 LevelAuthoring → compileLevel → validateLevel（保险）
  return levelData
```

### 11.2 缝合的可达性校验（核心）

设上一块出口锚点 `prevExit = {row: r0}`（在全局行坐标），当前块入口 `entry = {row: r1}`。缝合时把当前块整体垂直平移 `Δ = (r0 - r1)` 行，使入口对齐前块出口；则相邻两平台之间：

- **高差** `Δh = |nextPlatformRow - prevPlatformRow| * TILE` ≤ `maxJumpHeight`（≤3 格）。
- **水平间隙** `gap`（前块最右平台右沿 到 后块最左平台左沿）≤ `horizontalReachAtHeight(Δh)`。

若不满足 → **重新抽一块**（同难度桶内换一块），最多重试 K 次；仍不行 → 放一块"连接桥 chunk"（纯水平短台，保证过渡）。**因为 chunk 库每块都自带满足约束的入/出锚点设计，绝大多数缝合一次成功。**

### 11.3 难度曲线

```ts
// 伪代码
function difficultyCurve(baseDifficulty: number, progress01: number): 1|2|3 {
  // progress01: 0=关卡开头, 1=结尾
  // 开头强制 1（安全引导），中段随 baseDifficulty 抬升，结尾略降收束到终点
  if (progress01 < 0.15) return 1;
  const d = baseDifficulty + (progress01 - 0.5) * 2;   # 中段最高
  return clamp(round(d), 1, 3);
}
```

无尽模式下 `baseDifficulty` 随层数 `+1`（封顶 3，靠提升坑频/敌人密度继续加压）。

### 11.4 种子与可复现性

- 用 **mulberry32**（几十行、无依赖）+ 一个种子。
- 种子来源：无尽模式 = `(层号 * 大质数)` 或用户输入的种子串（hash 成数字）。
- **可复现 = 可测试**：单测对固定种子断言生成结果稳定 + `validateLevel` 通过。
- ⚠️ 注意：本设计是**游戏运行时代码**，可以用 `Math.random`；但为了可测与"分享种子"，统一走 seeded PRNG。Workflow 脚本里才禁用 `Math.random`，与此无关。

### 11.5 chunk 库起步集（建议先做 6～8 块）

| chunk | 难度 | 特征 |
|---|---|---|
| `intro_flat` | 1 | 纯平地，无敌人，1～2 金币，教学 |
| `small_pit` | 1 | 一个 2 格小坑，对面低台 |
| `stair_up` | 1 | 阶梯上升 1→2 格 |
| `enemy_patrol` | 2 | 平台 + 1 巡逻敌人 + 金币 |
| `wide_gap` | 2 | 3～4 格坑（冲刺可跨，跳也能过） |
| `wall_shaft` | 3 | 双面对墙（蹬墙跳垂直段）+ 顶部金币 |
| `enemy_double` | 3 | 双敌人 + 中间悬空金币弧 |
| `goal_approach` | 1 | 末块：平地收束 + 终点台 |

每块都标注 `entry`/`exit` 锚点行，保证缝合可行性。块库可随版本扩充，**不动算法**。

---

## 12. 关卡进度系统（缺失的第四层）

当前 `GameScene` 硬编码单关，需重构为"按 provider 取关 + 过关推进"：

```ts
// GameScene.ts（改造后草案）
export class GameScene implements Scene {
  private provider: LevelProvider;     // 由外部注入（Static / Endless）
  private world!: World;               // 延迟构造
  private readonly hud = new Hud();

  constructor(game: Game, provider: LevelProvider) { ... }

  enter() {
    this.loadCurrent();                // new World(provider.current().level)
  }

  update(dt: number) {
    if (this.game.input.wasRestartPressed()) { this.world.restart(); ... }
    this.world.update(dt, this.game.input);
    this.hud.setScore(...);
    this.hud.setLevel(this.provider.current()!);   // 新增：显示第N关/名称

    if (this.world.won) {
      const advanced = this.provider.next();
      if (advanced) {
        this.loadCurrent();            // 换下一关
        this.hud.setStatus('过关！进入下一关');
      } else {
        this.hud.setStatus('全部通关！按 R 重玩');
        // 或切回菜单/切 Endless
      }
      return;
    }
  }

  private loadCurrent() {
    const cur = this.provider.current();
    this.world?.root.destroy({children:true});
    this.world = new World(cur.level);
    this.root.addChild(this.world.root);
  }
}
```

**要点：**
- `World` 当前在字段初始化时构造、不可换关 → 改为按需 `new World(level)` + 旧的 `destroy`。需注意 Pixi 资源释放（占位图形轻量，destroy 安全）。
- `BootScene` / 入口决定注入哪个 provider（可用一个简单菜单选"闯关 / 无尽"，或先用 Static，无尽作为后续）。
- HUD 新增"第 N 关 · 名称"，无尽模式显示层数 + 种子。

---

## 13. 实施计划（分阶段）

每阶段独立可交付、独立可测、独立可玩。

### 阶段 0：格式简化（前置，1 步）
- [ ] 新增 `authoring.ts` + `compileLevel.ts`（含落格规则 + 内置 `validateLevel`）。
- [ ] 把 `level1` 迁到 `LevelAuthoring`，`compileLevel(level1Art)` 等价于原 `level1`。
- [ ] 新增 `compileLevel.test.ts`；现有 `LevelValidation.test.ts` 改指向编译产物，全绿。
- **验证**：`npm run build` + `npm run test` + `npm run dev` 人工对比 level1 与改动前一致。

### 阶段 1：进度系统 + 静态多关（方案一）
- [ ] 新增 `LevelProvider`（`StaticProvider`）+ `data/levels/index.ts`。
- [ ] 重构 `GameScene` 支持 provider + 换关（第 12 节）。
- [ ] HUD 加"第 N 关 · 名称"。
- [ ] 手作 `level2/3/4`（难度递增，各跑 `validateLevel` + 人工通关）。
- **验证**：L1→L4 连续通关、`R` 重开当前关、`won` 后正确切下一关、末关显示"全部通关"。

### 阶段 2：程序化生成（方案二·chunk 拼接）
- [ ] `rng.ts`（mulberry32）+ `generator/types.ts`。
- [ ] `chunks.ts` 起步 6～8 块（每块 `validateLevel` 局部可解）。
- [ ] `stitcher.ts` + `difficulty.ts` + `generateLevel.ts`（内含 compile+validate）。
- [ ] `EndlessProvider`；菜单/入口可选模式。
- [ ] `generator.test.ts`：N 个种子全部生成成功且 `validateLevel` 通过 + 可复现。
- **验证**：无尽模式连续生成不崩、手感可玩、难度随层数提升。

### 阶段 3（可选）：打磨
- [ ] 种子分享（URL/输入框输入种子复现关卡）。
- [ ] chunk 库扩充（更多变化）。
- [ ] 金币可达性校验 `validateCoinsReachable`（防止悬空不可达金币）。
- [ ] 关卡选择菜单 / 死亡计次 / 最佳成绩。

---

## 14. 风险与权衡

| 风险 | 影响 | 缓解 |
|---|---|---|
| `GameScene` 换关时 Pixi 资源/事件残留 | 内存泄漏、双渲染 | 旧 `World.root.destroy({children:true})`；World 不持有全局监听（监听在 InputManager，scene 级安全） |
| 生成器在某些种子下 `validateLevel` 失败 | 无尽模式偶发卡死 | 构造保证 + 失败重抽 + 兜底"连接桥 chunk" + 终极兜底：失败时回退到一个手作安全关 |
| 验证器不建模冲刺/蹬墙跳 | 生成器偏保守，关卡"看似能更难" | 设计原则：纯跳可达 = 永远安全；高级技巧作奖励而非依赖。如需放开，扩展 `validateLevel` 增加冲刺/蹬墙跳可达传播（工作量另估） |
| 图例格式单格只能放一个标记 | 少数位置冲突（敌人和金币同格） | 实务中罕见；必要时支持 `overrides` 字段补充坐标 |
| 手作多关设计耗时 | 阶段 1 工期 | 格式简化后创作成本已大幅下降；可先出 2 关验证流程，再补 |
| 迁移 level1 破坏现有测试 | 回归 | 编译产物等价校验；测试改指向编译产物而非原图；人工 `npm run dev` 比对 |

---

## 15. 测试策略

延续项目"先验证后玩"的风格，每个阶段配套单测：

- **`compileLevel.test.ts`**：图例解析正确、落格像素正确、默认尺寸、非法图（无平台/出生点）报错。
- **`LevelProvider.test.ts`**：Static 顺序、`next()` 到尽头返回 false、`reset()`；Endless `next()` 恒 true、层数递增。
- **`generator.test.ts`**（关键）：
  - 对 `seed ∈ [0..99]`（或更多）逐个 `generateLevel`，断言 `validateLevel(result) === []`。
  - 同种子两次生成结果**完全相等**（可复现）。
  - 难度参数 → 期望的 chunk 难度分布（统计断言）。
- 现有 81 个测试不应被破坏（引擎层零改动）。
- 关键玩法仍需 `npm run dev` 人工验证（多关切换、无尽生成手感、`R` 重开、终点通关）。

---

## 16. 下一步

本文件是**分析设计稿**，尚未落地代码。建议的推进顺序：

1. **评审本设计**——尤其是：是否认可"混合架构"、是否接受"图例绘制"作为新格式、阶段顺序。
2. 选定后，可任选其一启动：
   - **轻量**：直接进**阶段 0 + 阶段 1**（格式简化 + 进度层 + 手作 3 关），低风险、立即多关可玩。
   - **完整**：继续到**阶段 2**（程序化生成），拿到无尽模式。
3. 若希望按项目既有 OpenSpec 流程正式立项，可把本设计转为 `openspec/changes/` 下的一个 change（proposal/design/tasks/specs），用 `/openspec-propose` 一键生成。本文件已具备转为 proposal/design 的全部素材。

---

### 附：核心设计决策一览

| 决策 | 选择 | 理由 |
|---|---|---|
| 生成策略 | 分块拼接（2a） | 手感可控、可达性可构造保证、块库可增量成长 |
| 引擎接口 | `LevelData` 不变 | 零回归，生成器/手作对下游透明 |
| 编写格式 | ASCII 图例 + `compileLevel` | 一眼可读、去绝对像素、自动推导尺寸 |
| 可达性模型 | 纯跳跃（保守） | 与现有 `validateLevel` 一致，永远安全 |
| 进度系统 | `LevelProvider` 抽象 + Static/Endless 双实现 | 同一 `GameScene` 支持两种模式，可扩展 |
| 随机性 | seeded PRNG（mulberry32） | 可复现、可测、可分享种子 |
