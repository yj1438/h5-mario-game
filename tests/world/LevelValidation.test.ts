import { describe, it, expect } from 'vitest';
import { FIXED_TIME_STEP, PLAYER_CONFIG, TILE_SIZE } from '../../src/app/config/gameConfig';
import type { LevelData, TileValue } from '../../src/world/Level';
import { computeMaxJumpHeight, validateLevel, extractPlatforms, horizontalReachAtHeight } from '../../src/world/LevelValidation';
import { level1 } from '../../src/data/levels/level1';

describe('LevelValidation', () => {
  describe('computeMaxJumpHeight', () => {
    it('computes the exact max jump height from physics config', () => {
      const height = computeMaxJumpHeight(PLAYER_CONFIG, FIXED_TIME_STEP);
      expect(height).toBeGreaterThan(130);
      expect(height).toBeLessThan(145);
    });
  });

  describe('extractPlatforms', () => {
    it('extracts platform surfaces from a simple level', () => {
      const tiles: TileValue[][] = [
        [0, 0, 0],
        [0, 1, 0],
        [1, 1, 1],
      ];
      const platforms = extractPlatforms(tiles);
      // Row 2 ground is split: col 1 has a block above, so it's not a surface.
      // Surfaces: row 1 col 1, row 2 cols 0-0, row 2 col 2-2
      expect(platforms).toHaveLength(3);
      expect(platforms[0]).toMatchObject({ row: 1, colStart: 1, colEnd: 1 });
      expect(platforms[1]).toMatchObject({ row: 2, colStart: 0, colEnd: 0 });
      expect(platforms[2]).toMatchObject({ row: 2, colStart: 2, colEnd: 2 });
    });

    it('does not treat buried tiles as platforms', () => {
      const tiles: TileValue[][] = [
        [1, 1],
        [1, 1],
      ];
      const platforms = extractPlatforms(tiles);
      expect(platforms).toHaveLength(1);
      expect(platforms[0].row).toBe(0);
    });
  });

  describe('horizontalReachAtHeight', () => {
    it('returns 0 when height exceeds max jump', () => {
      const reach = horizontalReachAtHeight(9999, PLAYER_CONFIG);
      expect(reach).toBe(0);
    });

    it('returns positive reach for reachable heights', () => {
      const reach = horizontalReachAtHeight(TILE_SIZE, PLAYER_CONFIG);
      expect(reach).toBeGreaterThan(0);
    });
  });

  describe('validateLevel', () => {
    it('level1 passes validation', () => {
      const errors = validateLevel(level1);
      expect(errors).toEqual([]);
    });

    it('detects unreachable platform that is too high', () => {
      const brokenLevel: LevelData = {
        name: 'Broken',
        width: 10,
        height: 12,
        tiles: makeTiles([
          '0000000000',
          '0000000000',
          '0000000000',
          '0000000000',
          '0000000000',
          '0000000000',
          '0000010000',
          '0000000000',
          '0000000000',
          '0000000000',
          '0000000000',
          '1111111111',
        ]),
        playerSpawn: { x: 48, y: 400 },
        goal: { x: 48, y: 528 - 96, width: 48, height: 96 },
      };
      const errors = validateLevel(brokenLevel);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('unreachable');
    });

    it('detects goal not adjacent to any platform', () => {
      const brokenLevel: LevelData = {
        name: 'Floating Goal',
        width: 5,
        height: 5,
        tiles: makeTiles([
          '00000',
          '00000',
          '00000',
          '00000',
          '11111',
        ]),
        playerSpawn: { x: 48, y: 200 },
        goal: { x: 48, y: 0, width: 48, height: 48 },
      };
      const errors = validateLevel(brokenLevel);
      const goalError = errors.find((e) => e.message.includes('Goal'));
      expect(goalError).toBeDefined();
    });

    it('accepts a valid staircase level', () => {
      const validLevel: LevelData = {
        name: 'Staircase',
        width: 20,
        height: 6,
        tiles: makeTiles([
          '00000000000000000000',
          '00000000000000000000',
          '00000000000000111000',
          '00000000001111000000',
          '00000011110000000000',
          '11111111111111111111',
        ]),
        playerSpawn: { x: 48, y: 200 },
        goal: { x: 13 * 48, y: 48, width: 48, height: 96 },
      };
      const errors = validateLevel(validLevel);
      expect(errors).toEqual([]);
    });
  });
});

function makeTiles(rows: string[]): TileValue[][] {
  return rows.map((row) => row.split('').map((c) => Number(c) as TileValue));
}
