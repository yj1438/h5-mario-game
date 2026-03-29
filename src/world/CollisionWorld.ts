import { TILE_SIZE } from '../app/config/gameConfig';
import type { SolidRect } from '../systems/Collision';
import type { LevelData } from './Level';

export class CollisionWorld {
  constructor(private readonly level: LevelData) {}

  isSolidAt(row: number, column: number): boolean {
    if (row < 0 || row >= this.level.height || column < 0 || column >= this.level.width) {
      return false;
    }

    return this.level.tiles[row]?.[column] === 1;
  }

  getNearbySolids(x: number, y: number, width: number, height: number): SolidRect[] {
    const startColumn = Math.max(0, Math.floor(x / TILE_SIZE) - 1);
    const endColumn = Math.min(this.level.width - 1, Math.floor((x + width) / TILE_SIZE) + 1);
    const startRow = Math.max(0, Math.floor(y / TILE_SIZE) - 1);
    const endRow = Math.min(this.level.height - 1, Math.floor((y + height) / TILE_SIZE) + 1);
    const solids: SolidRect[] = [];

    for (let row = startRow; row <= endRow; row += 1) {
      for (let column = startColumn; column <= endColumn; column += 1) {
        if (!this.isSolidAt(row, column)) {
          continue;
        }

        solids.push({
          x: column * TILE_SIZE,
          y: row * TILE_SIZE,
          width: TILE_SIZE,
          height: TILE_SIZE,
        });
      }
    }

    return solids;
  }
}
