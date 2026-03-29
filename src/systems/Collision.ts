import type { Rect } from '../utils/rect';
import { intersects } from '../utils/rect';

export interface CollisionResult {
  x: number;
  y: number;
  collidedX: boolean;
  collidedY: boolean;
  grounded: boolean;
  hitCeiling: boolean;
}

export interface SolidRect extends Rect {}

export const resolveAxisAlignedMovement = (
  bounds: Rect,
  deltaX: number,
  deltaY: number,
  solids: SolidRect[],
): CollisionResult => {
  let nextX = bounds.x + deltaX;
  let nextY = bounds.y;
  let collidedX = false;
  let collidedY = false;
  let grounded = false;
  let hitCeiling = false;

  for (const solid of solids) {
    const movedRect = { ...bounds, x: nextX };
    if (!intersects(movedRect, solid)) {
      continue;
    }

    collidedX = true;
    nextX = deltaX > 0 ? solid.x - bounds.width : solid.x + solid.width;
  }

  const horizontalRect = { ...bounds, x: nextX };

  nextY += deltaY;
  for (const solid of solids) {
    const movedRect = { ...horizontalRect, y: nextY };
    if (!intersects(movedRect, solid)) {
      continue;
    }

    collidedY = true;

    if (deltaY > 0) {
      nextY = solid.y - bounds.height;
      grounded = true;
    } else if (deltaY < 0) {
      nextY = solid.y + solid.height;
      hitCeiling = true;
    }
  }

  return {
    x: nextX,
    y: nextY,
    collidedX,
    collidedY,
    grounded,
    hitCeiling,
  };
};
