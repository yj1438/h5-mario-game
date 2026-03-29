import { describe, expect, it } from 'vitest';
import { updateHorizontalVelocity, updateVerticalVelocity } from './Physics';

const config = {
  moveAcceleration: 1000,
  maxMoveSpeed: 300,
  groundDrag: 900,
  airDrag: 300,
  gravity: 1200,
  maxFallSpeed: 800,
  jumpVelocity: 500,
};

describe('physics', () => {
  it('accelerates horizontally and clamps max speed', () => {
    const velocity = updateHorizontalVelocity(
      { velocityX: 0, velocityY: 0, grounded: true },
      { direction: 1, jumpPressed: false },
      config,
      0.5,
    );

    expect(velocity).toBe(300);
  });

  it('applies jump only when grounded', () => {
    const groundedJump = updateVerticalVelocity(
      { velocityX: 0, velocityY: 0, grounded: true },
      { direction: 0, jumpPressed: true },
      config,
      1 / 60,
    );

    const airJump = updateVerticalVelocity(
      { velocityX: 0, velocityY: 50, grounded: false },
      { direction: 0, jumpPressed: true },
      config,
      1 / 60,
    );

    expect(groundedJump).toBe(-500);
    expect(airJump).toBeGreaterThan(50);
  });
});
