import { describe, expect, it } from 'vitest';
import { updateHorizontalVelocity, updateVerticalVelocity } from '../../src/systems/Physics';

const config = {
  moveAcceleration: 1000,
  maxMoveSpeed: 300,
  groundDrag: 900,
  airDrag: 300,
  gravity: 1200,
  maxFallSpeed: 800,
  jumpVelocity: 500,
};

const held = { direction: 0 as -1 | 0 | 1, jumpPressed: false, jumpHeld: true };
const released = { direction: 0 as -1 | 0 | 1, jumpPressed: false, jumpHeld: false };

describe('physics - horizontal velocity', () => {
  it('accelerates right and clamps to max speed', () => {
    const velocity = updateHorizontalVelocity(
      { velocityX: 0, velocityY: 0, grounded: true },
      { direction: 1, jumpPressed: false, jumpHeld: false },
      config,
      0.5,
    );

    expect(velocity).toBe(300);
  });

  it('accelerates left and clamps to negative max speed', () => {
    const velocity = updateHorizontalVelocity(
      { velocityX: 0, velocityY: 0, grounded: true },
      { direction: -1, jumpPressed: false, jumpHeld: false },
      config,
      0.5,
    );

    expect(velocity).toBe(-300);
  });

  it('direction reversal: right-to-left flips velocity toward negative max', () => {
    const velocity = updateHorizontalVelocity(
      { velocityX: 300, velocityY: 0, grounded: true },
      { direction: -1, jumpPressed: false, jumpHeld: false },
      config,
      0.1,
    );

    expect(velocity).toBe(200);
  });

  it('direction reversal: left-to-right flips velocity toward positive max', () => {
    const velocity = updateHorizontalVelocity(
      { velocityX: -300, velocityY: 0, grounded: true },
      { direction: 1, jumpPressed: false, jumpHeld: false },
      config,
      0.1,
    );

    expect(velocity).toBe(-200);
  });

  it('direction reversal overshoots through zero to opposite direction', () => {
    const velocity = updateHorizontalVelocity(
      { velocityX: 50, velocityY: 0, grounded: true },
      { direction: -1, jumpPressed: false, jumpHeld: false },
      config,
      0.2,
    );

    expect(velocity).toBe(-150);
  });

  it('decelerates with ground drag when no direction input (grounded)', () => {
    const velocity = updateHorizontalVelocity(
      { velocityX: 300, velocityY: 0, grounded: true },
      { ...released, direction: 0 },
      config,
      1 / 60,
    );

    expect(velocity).toBe(285);
  });

  it('decelerates with air drag when no direction input (airborne)', () => {
    const velocity = updateHorizontalVelocity(
      { velocityX: 300, velocityY: -100, grounded: false },
      { ...released, direction: 0 },
      config,
      1 / 60,
    );

    expect(velocity).toBe(295);
  });

  it('ground drag decelerates faster than air drag', () => {
    const groundVelocity = updateHorizontalVelocity(
      { velocityX: 300, velocityY: 0, grounded: true },
      { ...released, direction: 0 },
      config,
      1 / 60,
    );

    const airVelocity = updateHorizontalVelocity(
      { velocityX: 300, velocityY: 0, grounded: false },
      { ...released, direction: 0 },
      config,
      1 / 60,
    );

    expect(groundVelocity).toBeLessThan(airVelocity);
  });

  it('ground drag brings velocity to exactly zero when drag exceeds speed', () => {
    const velocity = updateHorizontalVelocity(
      { velocityX: 5, velocityY: 0, grounded: true },
      { ...released, direction: 0 },
      config,
      0.1,
    );

    expect(velocity).toBe(0);
  });

  it('air drag brings velocity to exactly zero when drag exceeds speed', () => {
    const velocity = updateHorizontalVelocity(
      { velocityX: 5, velocityY: 0, grounded: false },
      { ...released, direction: 0 },
      config,
      0.1,
    );

    expect(velocity).toBe(0);
  });

  it('decelerates negative velocity with ground drag toward zero', () => {
    const velocity = updateHorizontalVelocity(
      { velocityX: -300, velocityY: 0, grounded: true },
      { ...released, direction: 0 },
      config,
      1 / 60,
    );

    expect(velocity).toBe(-285);
  });

  it('airborne horizontal movement applies acceleration but respects max speed', () => {
    const velocity = updateHorizontalVelocity(
      { velocityX: 0, velocityY: -200, grounded: false },
      { direction: 1, jumpPressed: false, jumpHeld: false },
      config,
      0.5,
    );

    expect(velocity).toBe(300);
  });

  it('airborne horizontal movement with small delta increases velocity', () => {
    const velocity = updateHorizontalVelocity(
      { velocityX: 0, velocityY: -200, grounded: false },
      { direction: 1, jumpPressed: false, jumpHeld: false },
      config,
      1 / 60,
    );

    expect(velocity).toBeCloseTo(1000 / 60, 10);
  });

  it('no-op when standing still with no input', () => {
    const velocity = updateHorizontalVelocity(
      { velocityX: 0, velocityY: 0, grounded: true },
      { ...released, direction: 0 },
      config,
      1 / 60,
    );

    expect(velocity).toBe(0);
  });

  it('no-op when airborne and still with no input', () => {
    const velocity = updateHorizontalVelocity(
      { velocityX: 0, velocityY: -100, grounded: false },
      { ...released, direction: 0 },
      config,
      1 / 60,
    );

    expect(velocity).toBe(0);
  });

  it('incremental acceleration does not immediately reach max speed', () => {
    const velocity = updateHorizontalVelocity(
      { velocityX: 0, velocityY: 0, grounded: true },
      { direction: 1, jumpPressed: false, jumpHeld: false },
      config,
      1 / 60,
    );

    expect(velocity).toBeLessThan(300);
    expect(velocity).toBeGreaterThan(0);
  });

  it('clamps negative velocity to negative max speed', () => {
    const velocity = updateHorizontalVelocity(
      { velocityX: -250, velocityY: 0, grounded: true },
      { direction: -1, jumpPressed: false, jumpHeld: false },
      config,
      0.5,
    );

    expect(velocity).toBe(-300);
  });
});

describe('physics - vertical velocity', () => {
  it('applies jump only when grounded', () => {
    const groundedJump = updateVerticalVelocity(
      { velocityX: 0, velocityY: 0, grounded: true },
      { direction: 0, jumpPressed: true, jumpHeld: true },
      config,
      1 / 60,
    );

    const airJump = updateVerticalVelocity(
      { velocityX: 0, velocityY: 50, grounded: false },
      { direction: 0, jumpPressed: true, jumpHeld: true },
      config,
      1 / 60,
    );

    expect(groundedJump).toBe(-500);
    expect(airJump).toBeGreaterThan(50);
  });

  it('jump velocity is exactly negative jumpVelocity', () => {
    const velocity = updateVerticalVelocity(
      { velocityX: 0, velocityY: 0, grounded: true },
      { direction: 0, jumpPressed: true, jumpHeld: true },
      config,
      1 / 60,
    );

    expect(velocity).toBe(-config.jumpVelocity);
  });

  it('jump ignores current downward velocity', () => {
    const velocity = updateVerticalVelocity(
      { velocityX: 0, velocityY: 500, grounded: true },
      { direction: 0, jumpPressed: true, jumpHeld: true },
      config,
      1 / 60,
    );

    expect(velocity).toBe(-500);
  });

  it('jump ignores current upward velocity', () => {
    const velocity = updateVerticalVelocity(
      { velocityX: 0, velocityY: -200, grounded: true },
      { direction: 0, jumpPressed: true, jumpHeld: true },
      config,
      1 / 60,
    );

    expect(velocity).toBe(-500);
  });

  it('jump does not trigger when not grounded even with jumpPressed', () => {
    const velocity = updateVerticalVelocity(
      { velocityX: 0, velocityY: -100, grounded: false },
      { direction: 0, jumpPressed: true, jumpHeld: true },
      config,
      1 / 60,
    );

    expect(velocity).toBeCloseTo(-80, 10);
  });

  it('gravity accumulates on falling object', () => {
    const dt = 1 / 60;

    const v0 = updateVerticalVelocity(
      { velocityX: 0, velocityY: 0, grounded: false },
      { ...held },
      config,
      dt,
    );
    expect(v0).toBeCloseTo(20, 10);

    const v1 = updateVerticalVelocity(
      { velocityX: 0, velocityY: v0, grounded: false },
      { ...held },
      config,
      dt,
    );
    expect(v1).toBeCloseTo(40, 10);

    const v2 = updateVerticalVelocity(
      { velocityX: 0, velocityY: v1, grounded: false },
      { ...held },
      config,
      dt,
    );
    expect(v2).toBeCloseTo(60, 10);
  });

  it('max fall speed is clamped', () => {
    const velocity = updateVerticalVelocity(
      { velocityX: 0, velocityY: 800, grounded: false },
      { ...held },
      config,
      1 / 60,
    );

    expect(velocity).toBe(800);
  });

  it('max fall speed clamps from well above', () => {
    const velocity = updateVerticalVelocity(
      { velocityX: 0, velocityY: 2000, grounded: false },
      { ...held },
      config,
      1 / 60,
    );

    expect(velocity).toBe(800);
  });

  it('gravity applies when airborne with no jump', () => {
    const velocity = updateVerticalVelocity(
      { velocityX: 0, velocityY: 0, grounded: false },
      { ...held },
      config,
      1 / 60,
    );

    expect(velocity).toBeCloseTo(1200 / 60, 10);
  });

  it('gravity applies correct magnitude per delta time', () => {
    const velocity = updateVerticalVelocity(
      { velocityX: 0, velocityY: 0, grounded: false },
      { ...held },
      config,
      0.1,
    );

    expect(velocity).toBeCloseTo(120, 10);
  });

  it('upward velocity is not artificially clamped to jumpVelocity', () => {
    const velocity = updateVerticalVelocity(
      { velocityX: 0, velocityY: -700, grounded: false },
      { ...held },
      config,
      1 / 60,
    );

    // -700 + 1200*(1/60) = -700 + 20 = -680, NOT clamped to -500
    expect(velocity).toBeCloseTo(-680, 10);
  });

  it('gravity applies when grounded and no jump', () => {
    const velocity = updateVerticalVelocity(
      { velocityX: 0, velocityY: 0, grounded: true },
      { ...released },
      config,
      1 / 60,
    );

    expect(velocity).toBeCloseTo(1200 / 60, 10);
  });

  it('variable jump: releasing jump while rising cuts velocity to 45%', () => {
    const velocity = updateVerticalVelocity(
      { velocityX: 0, velocityY: -300, grounded: false },
      { direction: 0, jumpPressed: false, jumpHeld: false },
      config,
      1 / 60,
    );

    // -300 + 20 = -280, then cut to -280 * 0.45 = -126, clamped to max(-126, -500) = -126
    const expected = Math.max((-300 + 20) * 0.45, -500);
    expect(velocity).toBeCloseTo(expected, 10);
  });

  it('variable jump: holding jump while rising preserves full velocity', () => {
    const velocity = updateVerticalVelocity(
      { velocityX: 0, velocityY: -300, grounded: false },
      { ...held },
      config,
      1 / 60,
    );

    // -300 + 20 = -280, no cut because jumpHeld is true
    expect(velocity).toBeCloseTo(-280, 10);
  });

  it('variable jump: releasing jump while falling does not affect velocity', () => {
    const velocity = updateVerticalVelocity(
      { velocityX: 0, velocityY: 200, grounded: false },
      { direction: 0, jumpPressed: false, jumpHeld: false },
      config,
      1 / 60,
    );

    // 200 + 20 = 220, no cut because velocityY > 0 (falling)
    expect(velocity).toBeCloseTo(220, 10);
  });
});
