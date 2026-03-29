export const VIEWPORT_WIDTH = 960;
export const VIEWPORT_HEIGHT = 576;
export const TILE_SIZE = 48;
export const FIXED_TIME_STEP = 1 / 60;
export const MAX_FRAME_TIME = 1 / 20;

export const PLAYER_CONFIG = {
  width: 34,
  height: 42,
  moveAcceleration: 2200,
  maxMoveSpeed: 320,
  groundDrag: 1800,
  airDrag: 700,
  gravity: 2000,
  maxFallSpeed: 980,
  jumpVelocity: 760,
};

export const CAMERA_CONFIG = {
  followLerp: 0.16,
  lookAhead: 72,
};

export const JUMP_BUFFER_TIME = 0.14;
export const COYOTE_TIME = 0.08;

export const HUD_STYLE = {
  fill: 0xffffff,
  fontSize: 24,
  fontFamily: 'Arial',
};
