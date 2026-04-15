import type { MovementConfig } from '../systems/Physics';
import { FIXED_TIME_STEP, PLAYER_CONFIG, TILE_SIZE } from '../app/config/gameConfig';
import type { LevelData, TileValue } from './Level';

export interface PlatformSurface {
  row: number;
  colStart: number;
  colEnd: number;
  y: number;
  x: number;
  width: number;
}

export interface ValidationError {
  platform?: PlatformSurface;
  message: string;
}

export function computeMaxJumpHeight(config: MovementConfig, fixedTimeStep: number): number {
  let vY = -config.jumpVelocity;
  let displacement = 0;
  let maxUp = 0;

  while (vY < 0) {
    vY += config.gravity * fixedTimeStep;
    if (vY < 0) {
      const dy = vY * fixedTimeStep;
      displacement += dy;
      maxUp = Math.max(maxUp, -displacement);
    }
  }

  return maxUp;
}

export function extractPlatforms(tiles: TileValue[][]): PlatformSurface[] {
  const platforms: PlatformSurface[] = [];

  for (let row = 0; row < tiles.length; row++) {
    let colStart = -1;
    for (let col = 0; col <= tiles[row].length; col++) {
      const isSolid = col < tiles[row].length && tiles[row][col] === 1;
      const hasSolidAbove = row > 0 && col < tiles[row].length && tiles[row - 1]?.[col] === 1;

      if (isSolid && !hasSolidAbove && colStart === -1) {
        colStart = col;
      } else if ((!isSolid || hasSolidAbove) && colStart !== -1) {
        platforms.push({
          row,
          colStart,
          colEnd: col - 1,
          y: row * TILE_SIZE,
          x: colStart * TILE_SIZE,
          width: (col - colStart) * TILE_SIZE,
        });
        colStart = -1;
      }
    }
  }

  return platforms;
}

export function horizontalReachAtHeight(
  heightDiff: number,
  config: MovementConfig,
): number {
  const discriminant = config.jumpVelocity ** 2 - 2 * config.gravity * heightDiff;
  if (discriminant < 0) return 0;

  const t = (config.jumpVelocity + Math.sqrt(discriminant)) / config.gravity;
  return config.maxMoveSpeed * t;
}

function canReachByJump(
  target: PlatformSurface,
  source: PlatformSurface,
  maxJumpHeight: number,
  config: MovementConfig,
): boolean {
  const heightDiff = source.y - target.y;
  if (heightDiff <= 0 || heightDiff > maxJumpHeight) return false;

  const maxHorizontalGap = horizontalReachAtHeight(heightDiff, config);

  const sourceRight = source.x + source.width;
  const targetRight = target.x + target.width;
  const overlapLeft = Math.max(source.x, target.x);
  const overlapRight = Math.min(sourceRight, targetRight);

  if (overlapRight > overlapLeft) return true;

  const gap = overlapLeft - overlapRight;
  return gap <= maxHorizontalGap;
}

export function validateLevel(
  level: LevelData,
  config: MovementConfig = PLAYER_CONFIG,
  fixedTimeStep: number = FIXED_TIME_STEP,
  tileSize: number = TILE_SIZE,
  playerWidth: number = PLAYER_CONFIG.width,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const maxJumpHeight = computeMaxJumpHeight(config, fixedTimeStep);
  const platforms = extractPlatforms(level.tiles);

  if (platforms.length === 0) {
    return [{ message: 'Level has no platforms' }];
  }

  const maxRow = Math.max(...platforms.map((p) => p.row));

  // BFS reachability: ground-level platforms are always reachable
  const reachable = new Set<PlatformSurface>();
  const queue: PlatformSurface[] = [];

  for (const p of platforms) {
    if (p.row === maxRow) {
      reachable.add(p);
      queue.push(p);
    }
  }

  // Propagate reachability upward via jumps
  let head = 0;
  while (head < queue.length) {
    const source = queue[head++];
    for (const target of platforms) {
      if (reachable.has(target)) continue;
      if (canReachByJump(target, source, maxJumpHeight, config)) {
        reachable.add(target);
        queue.push(target);
      }
    }
  }

  for (const platform of platforms) {
    if (!reachable.has(platform)) {
      errors.push({
        platform,
        message: `Platform at row ${platform.row} cols ${platform.colStart}-${platform.colEnd} is unreachable (max jump height: ${maxJumpHeight.toFixed(1)}px)`,
      });
    }
  }

  // Check goal adjacency
  const goalReachable = platforms.some(
    (p) =>
      p.y <= level.goal.y + level.goal.height &&
      p.y + tileSize >= level.goal.y &&
      p.x < level.goal.x + level.goal.width &&
      p.x + p.width > level.goal.x,
  );

  if (!goalReachable) {
    errors.push({
      message: `Goal at (${level.goal.x}, ${level.goal.y}) is not adjacent to any platform`,
    });
  }

  return errors;
}
