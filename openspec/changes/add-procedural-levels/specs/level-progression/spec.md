## ADDED Requirements

### Requirement: Run 模型与固定本场 seed

一场游戏（run）SHALL 在开局掷定一个 `seed`，本场全部关卡 SHALL 为 `gen(seed, levelIndex)`，布局 SHALL 为 `(seed, levelIndex)` 的纯函数（不存储布局，按需重算）。死亡重开当前关 SHALL 得到与本次 run 中该关一致的 layout。

#### Scenario: 重开当前关 layout 不变

- **WHEN** 玩家在第 i 关死亡后重开该关
- **THEN** 新加载的关卡布局与本 run 此前第 i 关的布局完全一致（因 seed 与 levelIndex 未变）

#### Scenario: 同 run 全程 seed 不变

- **WHEN** 在一场 run 内推进或死亡任意次
- **THEN** `seed` 始终保持为本 run 开局掷定的值，直至"开新场"

### Requirement: 一场 8 关

一场 run SHALL 恰好包含 8 关（`levelIndex ∈ [1..8]`）。打完第 8 关 SHALL 触发"全部通关"。

#### Scenario: 关卡数量为 8

- **WHEN** 查询一场 run 的关卡总数
- **THEN** 总数为 8

#### Scenario: 通关第 8 关触发全部通关

- **WHEN** 玩家在第 8 关到达终点
- **THEN** 进入"全部通关"状态（而非推进到第 9 关）

### Requirement: 命数系统

一场 run SHALL 以 3 条命开始。玩家死亡（被敌人侧面撞到，或掉出世界）SHALL 使剩余命数减 1，并重开当前关（同 layout）。剩余命数 SHALL 可被 HUD 读取展示。

#### Scenario: 死亡扣命并重开当前关

- **WHEN** 玩家在剩余命数 >0 时死亡
- **THEN** 剩余命数减 1，且当前关以同 layout 重新开始

#### Scenario: 初始命数为 3

- **WHEN** 开启一场新 run
- **THEN** 剩余命数为 3

### Requirement: 命数归零回第 1 关

当剩余命数减至 0 时，run SHALL 将 `currentLevel` 重置为 1（回本场第 1 关），SHALL NOT 更换 seed（同 run 的 layout 集合不变）。SHALL 恢复初始命数。

#### Scenario: 命数耗尽回到首关

- **WHEN** 玩家在剩余命数为 1 时死亡（耗尽最后一条命）
- **THEN** `currentLevel` 变为 1，剩余命数恢复为初始值，且本场 seed 不变

### Requirement: 全部通关开新场

触发"全部通关"后，SHALL 开启一场新 run：掷新 seed（与上一场不同），`currentLevel` 重置为 1，命数恢复初始值。新场的 8 关 SHALL 为全新 layout。

#### Scenario: 通关后新场 layout 全新

- **WHEN** 玩家通关第 8 关后进入新场
- **THEN** 新场 seed ≠ 上一场 seed，且新场第 1 关布局 ≠ 上一场第 1 关布局

### Requirement: 到达终点推进下一关

玩家在 `currentLevel < 8` 时到达终点 SHALL 使 `currentLevel` 自增 1，并加载下一关。`currentLevel === 8` 时到达终点 SHALL 触发"全部通关"（见上）。

#### Scenario: 中途关到达终点进下一关

- **WHEN** 玩家在第 3 关（剩余命数任意）到达终点
- **THEN** `currentLevel` 变为 4，并加载第 4 关

### Requirement: 关卡身份暴露给 HUD

进度系统 SHALL 暴露当前关的身份信息（序号、theme 名称）与剩余命数，供 HUD 展示。HUD SHALL 在关卡切换时更新显示。

#### Scenario: HUD 显示当前关卡与命数

- **WHEN** 进入第 i 关且剩余命数为 L
- **THEN** HUD 显示第 i 关序号/名称与剩余命数 L

#### Scenario: 切关时 HUD 更新

- **WHEN** 玩家过关进入下一关
- **THEN** HUD 的关卡序号/名称更新为新关信息
