import { Container } from 'pixi.js';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { FIXED_TIME_STEP, PLAYER_CONFIG, TILE_SIZE } from '../app/config/gameConfig';
import { World } from './World';
import type { LevelData } from './Level';

vi.mock('../rendering/PlaceholderFactory', () => ({
  createBackground: () => new Container(),
  createGoalView: () => new Container(),
  createPlayerView: () => new Container(),
  createTerrainTile: () => new Container(),
}));

beforeAll(() => {
  (globalThis as { document?: object }).document = {};
});

class MockInput {
  private jumpHeld = false;
  private jumpPressed = false;

  isLeftHeld(): boolean {
    return false;
  }

  isRightHeld(): boolean {
    return false;
  }

  isJumpHeld(): boolean {
    return this.jumpHeld;
  }

  wasJumpPressed(): boolean {
    return this.jumpPressed;
  }

  beginFrame(): void {
    this.jumpPressed = false;
  }

  setJump(held: boolean, pressed = false): void {
    this.jumpHeld = held;
    this.jumpPressed = pressed;
  }
}

const level: LevelData = {
  name: 'test',
  width: 6,
  height: 4,
  tiles: [
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1],
  ],
  playerSpawn: { x: 48, y: 48 },
  goal: { x: 240, y: 48, width: 32, height: 64 },
};

const groundY = (level.height - 1) * TILE_SIZE - PLAYER_CONFIG.height;

describe('world jump flow', () => {
  it('jumps immediately after landing within the same fixed step', () => {
    const world = new World(level);
    const input = new MockInput();

    world.player.y = groundY - 8;
    world.player.velocityY = 600;
    world.player.grounded = false;
    input.setJump(true, true);

    world.update(FIXED_TIME_STEP, input as never);

    expect(world.player.velocityY).toBe(-PLAYER_CONFIG.jumpVelocity);
    expect(world.player.grounded).toBe(false);
  });

  it('auto-jumps only once while jump is held until release', () => {
    const world = new World(level);
    const input = new MockInput();

    world.player.y = groundY;
    world.player.velocityY = 0;
    world.player.grounded = true;

    input.setJump(true, true);
    world.update(FIXED_TIME_STEP, input as never);
    expect(world.player.velocityY).toBe(-PLAYER_CONFIG.jumpVelocity);

    for (let index = 0; index < 120; index += 1) {
      input.setJump(true, false);
      world.update(FIXED_TIME_STEP, input as never);
    }

    expect(world.player.grounded).toBe(true);
    expect(world.player.velocityY).toBe(0);

    input.setJump(false, false);
    world.update(FIXED_TIME_STEP, input as never);
    input.setJump(true, true);
    world.update(FIXED_TIME_STEP, input as never);

    expect(world.player.velocityY).toBe(-PLAYER_CONFIG.jumpVelocity);
    expect(world.player.grounded).toBe(false);
  });

  it('consumes a jump press only once across multiple fixed steps in one update', () => {
    const world = new World(level);
    const input = new MockInput();

    world.player.y = groundY;
    world.player.velocityY = 0;
    world.player.grounded = true;

    input.setJump(true, true);
    world.update(FIXED_TIME_STEP * 2, input as never);

    expect(world.player.velocityY).toBeGreaterThan(-PLAYER_CONFIG.jumpVelocity);
    expect(world.player.velocityY).toBeLessThan(0);
    expect(world.player.grounded).toBe(false);
  });

  it('keeps buffered landing jump working inside a multi-step update', () => {
    const world = new World(level);
    const input = new MockInput();

    world.player.y = groundY - 8;
    world.player.velocityY = 600;
    world.player.grounded = false;
    input.setJump(true, true);

    world.update(FIXED_TIME_STEP * 2, input as never);

    expect(world.player.velocityY).toBeGreaterThan(-PLAYER_CONFIG.jumpVelocity);
    expect(world.player.velocityY).toBeLessThan(0);
    expect(world.player.grounded).toBe(false);
  });
});
