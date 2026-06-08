// ─── 视口与时间步 ───
export const VIEWPORT_WIDTH = 960; // 游戏视口宽度（像素）
export const VIEWPORT_HEIGHT = 576; // 游戏视口高度（像素）
export const TILE_SIZE = 48; // 每个瓦片的边长（像素）
export const FIXED_TIME_STEP = 1 / 60; // 固定物理步长（秒），逻辑帧率锁定 60fps
export const MAX_FRAME_TIME = 1 / 20; // 单帧最大 deltaTime，防止掉帧时物理爆炸

// ─── 玩家 ───
export const PLAYER_CONFIG = {
  width: 34, // 碰撞箱宽度（像素）
  height: 42, // 碰撞箱高度（像素）
  moveAcceleration: 3600, // 水平加速度（px/s²），值越大起步越快
  maxMoveSpeed: 280, // 水平最大速度（px/s），角色奔跑上限
  groundDrag: 3200, // 地面阻力（px/s²），松手后减速力度，值越大刹车越灵敏
  airDrag: 800, // 空中阻力（px/s²），空中松手后的减速力度
  gravity: 2000, // 重力加速度（px/s²）
  maxFallSpeed: 980, // 最大下落速度（px/s），限制终端速度
  jumpVelocity: 760, // 起跳瞬间赋予的竖直速度（px/s）
  // 蹬墙跳
  wallSlideGravityScale: 0.25, // 贴墙滑行时的重力缩放（0~1），越小滑行越慢
  wallJumpVelocityX: 400, // 蹬墙跳水平弹射速度（px/s）
  wallJumpVelocityY: 680, // 蹬墙跳竖直弹射速度（px/s）
  wallJumpLockTime: 0.15, // 蹬墙跳后锁定方向输入的时长（秒）
  // 冲刺
  dashSpeed: 600, // 冲刺瞬间速度（px/s）
  dashDuration: 0.12, // 冲刺持续时间（秒）
  dashCooldown: 0.35, // 冲刺冷却时间（秒）
};

// ─── 金币 ───
export const COIN_CONFIG = {
  size: 24, // 金币尺寸（像素，正方形）
  bobAmplitude: 4, // 上下浮动的振幅（像素）
  bobSpeed: 3, // 浮动动画的角速度倍率
  scoreValue: 100, // 每枚金币的分值
};

// ─── 敌人 ───
export const ENEMY_CONFIG = {
  width: 36, // 碰撞箱宽度（像素）
  height: 36, // 碰撞箱高度（像素）
  moveSpeed: 80, // 巡逻移动速度（px/s）
  gravity: 2000, // 重力加速度（px/s²）
  maxFallSpeed: 980, // 最大下落速度（px/s）
};

// ─── 相机 ───
export const CAMERA_CONFIG = {
  followLerp: 0.08, // 跟随插值系数（0~1），越小跟随越平滑、越慢
  lookAhead: 48, // 前视偏移（像素），玩家移动时镜头提前偏移的距离
  lookAheadSpeed: 120, // 前视偏移渐变速率（px/s），防止镜头方向突变
  deadzoneX: 60, // 水平死区（像素），玩家在死区内移动时镜头不动
  deadzoneY: 40, // 垂直死区（像素）
};

// ─── 跳跃辅助 ───
export const JUMP_BUFFER_TIME = 0.14; // 跳跃输入缓冲窗口（秒），落地前提前按跳仍可触发
export const COYOTE_TIME = 0.08; // 土狼时间（秒），离开平台边缘后仍可跳跃的宽限时间

// ─── HUD 样式 ───
export const HUD_STYLE = {
  fill: 0xffffff, // 文字颜色（0x 白色）
  fontSize: 24, // 字号
  fontFamily: 'Arial', // 字体
};
