# Pixi Mario H5

A high-performance, web-based Mario-inspired platformer built with **PixiJS 6**, **TypeScript**, **Vite**, and **Vitest**.

## 🚀 Features

- **Platformer Mechanics**: Movement, variable-height jump, wall jump, wall slide, dash
- **Enemies**: Patrol AI with wall/edge detection; stomp to kill
- **Collectibles**: Floating coins with bob animation + score tracking
- **Camera**: Deadzone-based smooth follow with look-ahead, no jitter
- **Physics**: Fixed timestep (60 fps) with coyote time & jump buffer
- **Modern Tooling**: Vite + TypeScript + Vitest

## 🛠️ Tech Stack

- **Engine**: [PixiJS](https://pixijs.com/) (v6)
- **Bundler**: [Vite](https://vitejs.dev/)
- **Language**: TypeScript
- **Testing**: Vitest
- **Runtime**: Browser (HTML5)

## 📦 Installation & Setup

```bash
git clone <repository-url>
cd h5-mario-game
npm install
npm run dev        # 开发服务器 http://localhost:5173
```

## 🎮 Controls

| 操作 | 按键 |
|---|---|
| 移动 | `A` / `D` 或 `←` / `→` |
| 跳跃 | `W` / `Space` / `↑` |
| 冲刺 | `Shift` / `J` |
| 蹬墙跳 | 空中靠墙 + 跳跃键 |
| 重新开始 | `R` |

## ⚙️ Configuration

All gameplay tuning lives in `src/app/config/gameConfig.ts`. Adjust these values to change the feel.

### Viewport & Timing

| 常量 | 默认值 | 说明 |
|---|---|---|
| `VIEWPORT_WIDTH` | 960 | 游戏视口宽度（px） |
| `VIEWPORT_HEIGHT` | 576 | 游戏视口高度（px） |
| `TILE_SIZE` | 48 | 瓦片边长（px） |
| `FIXED_TIME_STEP` | 1/60 | 固定物理步长（s） |
| `MAX_FRAME_TIME` | 1/20 | 单帧最大时长，防止掉帧物理爆炸 |

### Player (`PLAYER_CONFIG`)

| 字段 | 默认值 | 说明 |
|---|---|---|
| `width` / `height` | 34 / 42 | 碰撞箱尺寸（px） |
| `moveAcceleration` | 3600 | 水平加速度（px/s²）↑ = 起步更快 |
| `maxMoveSpeed` | 280 | 水平最大速度（px/s） |
| `groundDrag` | 3200 | 地面阻力（px/s²）↑ = 松手刹车更快 |
| `airDrag` | 800 | 空中阻力（px/s²） |
| `gravity` | 2000 | 重力（px/s²） |
| `maxFallSpeed` | 980 | 最大下落速度（px/s） |
| `jumpVelocity` | 760 | 起跳竖直速度（px/s） |
| `wallSlideGravityScale` | 0.25 | 贴墙滑行重力缩放，越小滑越慢 |
| `wallJumpVelocityX` | 400 | 蹬墙跳水平弹射速度 |
| `wallJumpVelocityY` | 680 | 蹬墙跳竖直弹射速度 |
| `wallJumpLockTime` | 0.15 | 蹬墙跳后方向输入锁定时间（s） |
| `dashSpeed` | 600 | 冲刺速度（px/s） |
| `dashDuration` | 0.12 | 冲刺持续时间（s） |
| `dashCooldown` | 0.35 | 冲刺冷却（s） |

### Jump Assist

| 常量 | 默认值 | 说明 |
|---|---|---|
| `JUMP_BUFFER_TIME` | 0.14 | 落地前提前按跳仍生效的窗口（s） |
| `COYOTE_TIME` | 0.08 | 离开平台后仍可跳跃的宽限时间（s） |

### Enemy (`ENEMY_CONFIG`)

| 字段 | 默认值 | 说明 |
|---|---|---|
| `width` / `height` | 36 / 36 | 碰撞箱尺寸（px） |
| `moveSpeed` | 80 | 巡逻速度（px/s） |
| `gravity` | 2000 | 重力（px/s²） |
| `maxFallSpeed` | 980 | 最大下落速度（px/s） |

### Coin (`COIN_CONFIG`)

| 字段 | 默认值 | 说明 |
|---|---|---|
| `size` | 24 | 金币尺寸（px） |
| `bobAmplitude` | 4 | 浮动振幅（px） |
| `bobSpeed` | 3 | 浮动角速度倍率 |
| `scoreValue` | 100 | 每枚分值 |

### Camera (`CAMERA_CONFIG`)

| 字段 | 默认值 | 说明 |
|---|---|---|
| `followLerp` | 0.08 | 跟随插值系数，越小越平滑 |
| `lookAhead` | 48 | 移动方向上的提前偏移（px） |
| `lookAheadSpeed` | 120 | 前视偏移渐变速率（px/s） |
| `deadzoneX` | 60 | 水平死区（px），区内镜头不动 |
| `deadzoneY` | 40 | 垂直死区（px） |

## 🏗️ Project Structure

```
src/
├── app/          # 入口、场景管理、全局配置
├── scenes/       # 场景层（BootScene、GameScene）
├── world/        # 核心世界逻辑、关卡、碰撞世界、相机
├── systems/      # 输入、物理、碰撞系统
├── entities/     # 玩家、敌人、金币、终点实体
├── rendering/    # 图层与占位渲染
├── data/levels/  # 关卡数据
├── ui/           # HUD
└── utils/        # 数学与矩形工具
tests/            # 测试文件
```

## 🧪 Testing

```bash
npm run test
```

## 🚀 Build

```bash
npm run build     # tsc + vite → dist/
npm run preview   # 本地预览构建产物
```

## 📜 License

MIT
