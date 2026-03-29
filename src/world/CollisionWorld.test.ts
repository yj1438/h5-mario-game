import { describe, expect, it } from 'vitest';
import { CollisionWorld } from './CollisionWorld';
import type { LevelData } from './Level';

const level: LevelData = {
  name: 'test',
  width: 4,
  height: 3,
  tiles: [
    [0, 0, 0, 0],
    [0, 1, 0, 0],
    [1, 1, 1, 1],
  ],
  playerSpawn: { x: 0, y: 0 },
  goal: { x: 100, y: 0, width: 20, height: 40 },
};

describe('collision world', () => {
  it('returns nearby solid tiles', () => {
    const world = new CollisionWorld(level);
    const solids = world.getNearbySolids(48, 48, 20, 20);

    expect(solids.length).toBeGreaterThan(0);
    expect(solids.some((solid) => solid.x === 48 && solid.y === 48)).toBe(true);
  });

  it('checks solid tile coordinates', () => {
    const world = new CollisionWorld(level);

    expect(world.isSolidAt(1, 1)).toBe(true);
    expect(world.isSolidAt(0, 0)).toBe(false);
  });
});
