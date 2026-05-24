import { clamp } from '../utils/math';

export interface MovementConfig {
  moveAcceleration: number;
  maxMoveSpeed: number;
  groundDrag: number;
  airDrag: number;
  gravity: number;
  maxFallSpeed: number;
  jumpVelocity: number;
}

export interface MovementState {
  velocityX: number;
  velocityY: number;
  grounded: boolean;
}

export interface MovementIntent {
  direction: -1 | 0 | 1;
  jumpPressed: boolean;
  jumpHeld: boolean;
}

export const updateHorizontalVelocity = (
  state: MovementState,
  intent: MovementIntent,
  config: MovementConfig,
  deltaTime: number,
): number => {
  if (intent.direction !== 0) {
    return clamp(
      state.velocityX + intent.direction * config.moveAcceleration * deltaTime,
      -config.maxMoveSpeed,
      config.maxMoveSpeed,
    );
  }

  const drag = state.grounded ? config.groundDrag : config.airDrag;
  const nextVelocity = Math.abs(state.velocityX) <= drag * deltaTime ? 0 : state.velocityX - Math.sign(state.velocityX) * drag * deltaTime;
  return clamp(nextVelocity, -config.maxMoveSpeed, config.maxMoveSpeed);
};

export const updateVerticalVelocity = (
  state: MovementState,
  intent: MovementIntent,
  config: MovementConfig,
  deltaTime: number,
): number => {
  if (intent.jumpPressed && state.grounded) {
    return -config.jumpVelocity;
  }

  let velocityY = state.velocityY + config.gravity * deltaTime;

  if (!intent.jumpHeld && velocityY < 0) {
    velocityY = Math.max(velocityY * 0.45, -config.jumpVelocity);
  }

  return clamp(velocityY, -Infinity, config.maxFallSpeed);
};
