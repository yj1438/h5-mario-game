## ADDED Requirements

### Requirement: 确定性生成

`generateLevel(seed, levelIndex)` SHALL 为纯函数：相同输入 SHALL 产出按值相等的 `LevelData`。所有随机性 SHALL 来自 seeded PRNG（mulberry32），MUST NOT 使用 `Math.random`。

#### Scenario: 相同输入产出相同关卡

- **WHEN** 以相同 `(seed=42, levelIndex=3)` 调用 `generateLevel` 两次
- **THEN** 两次返回的 `LevelData` 在 `tiles` / `playerSpawn` / `goal` / `enemies` / `coins` 上按值完全相等

#### Scenario: 不同 seed 产出不同关卡

- **WHEN** 以 `(seed=1, levelIndex=1)` 与 `(seed=2, levelIndex=1)` 分别生成
- **THEN** 两个 `LevelData` 的 `tiles` 不完全相同

### Requirement: 构造性可解

每个生成的关卡 SHALL 通过 `validateLevel`：所有平台从地面经纯跳跃 BFS 可达，且终点邻接某个可达平台。生成器 SHALL 通过"按可达包络构造"保证这一点，`validateLevel` 作兜底校验。

#### Scenario: 生成关卡通过验证器

- **WHEN** 对 `seed ∈ [0..99]`、`levelIndex ∈ [1..8]` 的所有组合调用 `generateLevel`
- **THEN** 每个结果的 `validateLevel(result)` 返回空错误数组

### Requirement: 坑可跨性硬约束

每个坑（地面层中挖出的水平缺口）SHALL 同时满足：① 宽 ≤4 格（常规坑 ≤3 格，仅罕见"挑战坑"允许 4 格）；② 坑前 ≥2 格平整地面（起跑空间）；③ 坑后 ≥1 格落地平台。该约束保证坑在纯跳跃（无冲刺）下必可跨越。

#### Scenario: 坑宽不超上限

- **WHEN** 提取任一生成关卡的地面层所有坑
- **THEN** 每个坑宽度 ≤4 格

#### Scenario: 坑前有起跑空间

- **WHEN** 检查任一坑的紧邻左侧地面段
- **THEN** 该段连续平整长度 ≥2 格

#### Scenario: 坑后有落地平台

- **WHEN** 检查任一坑的紧邻右侧
- **THEN** 存在 ≥1 格的可站立平台

### Requirement: 两层地面模型

每个生成关卡 SHALL 具备连续底层地面（最大行索引处实心，除显式挖坑外）；浮空台 SHALL 仅放置在已可达集合（地面或另一块已可达浮空台）的纯跳跃包络内。掉入坑 SHALL 导致出界死亡（与现有 `player.y > worldHeight → restart` 一致）。

#### Scenario: 存在连续底层地面

- **WHEN** 检查生成关卡最大行索引行
- **THEN** 该行除坑位外全部为实心（`1`），不存在整行悬空

#### Scenario: 浮空台均可达

- **WHEN** 提取生成关卡所有浮空台
- **THEN** 每块都在某块已可达平台的纯跳跃包络内（由 `validateLevel` 可达传播覆盖）

### Requirement: theme 驱动的结构多样性

第 2..8 关 SHALL 各自在某个已定义 theme（平原 / 洞穴 / 高塔 / 密集）下生成，且 theme 直接驱动游走器与装饰器的分布参数（结构塑造，非仅装饰密度）。连续两关 SHALL NOT 使用相同 theme。

#### Scenario: 连续关 theme 不重复

- **WHEN** 生成一场的 8 关并读取每关 theme
- **THEN** 对任意 i∈[2..8]，第 i 关 theme ≠ 第 i-1 关 theme

#### Scenario: theme 影响结构

- **WHEN** 分别在"高塔"与"平原"theme 下用同种子生成
- **THEN** 高塔关的平均浮空台高度显著高于平原关（结构差异可观测）

### Requirement: 跨 theme 压力等价

各 theme 的参数带 SHALL 经压力等价：定义粗略难度估算（坑密度×致死权重 + 敌人密度×威胁权重 + 垂直度×操作权重 + 宽度×耐力权重），4 个 theme 的估算值 SHALL 落在同一带 ±15% 内，确保"不同但不递增"。

#### Scenario: 各 theme 难度估算持平

- **WHEN** 对每个 theme 用其参数带的代表值计算难度估算
- **THEN** 4 个 theme 估算值的极差 ≤ 均值的 15%

### Requirement: 第 1 关安全预设

第 1 关 SHALL 使用安全预设：宽度 40 格；最多 1 个 ≤2 格小坑；最多 1 个敌人且距出生点 ≥5 格；浮空台数量少、离地 ≤2 格。安全预设 SHALL 比任一 theme 更软。

#### Scenario: 首关无开门杀

- **WHEN** 生成第 1 关（任意 seed）
- **THEN** 坑数 ≤1 且坑宽 ≤2 格；敌人数 ≤1 且与出生点水平距离 ≥5 格

### Requirement: 金币作为导航（可达且有意放置）

所有金币 SHALL 可达（站在可达平台上可拾取，或沿两可达平台间的跳跃弧可拾取），SHALL 作为跨坑弧 / 主路径串 / 浮空台分支奖励三类之一放置，MUST NOT 独立随机撒点。

#### Scenario: 所有金币可达

- **WHEN** 检查生成关卡中每个金币位置
- **THEN** 每个金币位于某块可达平台的正上方拾取范围，或位于两块可达平台间的跳跃抛物线弧上

### Requirement: 失败兜底永不崩

生成器 SHALL 在任何情况下返回合法 `LevelData` 而不抛出异常。当 `validateLevel` 失败时（理论不应发生）SHALL 依次尝试：① 子 seed 段重掷（≤5 次）→ ② 安全预设参数重生成整关 → ③ 返回内置 known-good 模板关并 `console.warn`。

#### Scenario: 兜底链最终返回合法关卡

- **WHEN** 对任意 `(seed, levelIndex)`（包括被构造为触发兜底的边界 seed）调用 `generateLevel`
- **THEN** 不抛异常，且返回的 `LevelData` 通过 `validateLevel`

### Requirement: 引擎契约不变

生成的 `LevelData` SHALL 符合现有 `LevelData` 接口（`name` / `width` / `height` / `tiles` / `playerSpawn` / `goal` / `enemies` / `coins`），引擎层（`World` / `CollisionWorld` / 实体）MUST NOT 需要新字段。

#### Scenario: 生成产物可直接喂入 World

- **WHEN** 将 `generateLevel` 的返回值传入 `new World(...)`
- **THEN** 构造成功，无类型错误，关卡可正常更新与渲染
