import { describe, expect, it } from 'vitest';
import { resolveAxisAlignedMovement } from './Collision';

describe('collision resolution', () => {
  it('lands on top of a solid tile', () => {
    const result = resolveAxisAlignedMovement(
      { x: 20, y: 20, width: 20, height: 20 },
      0,
      40,
      [{ x: 0, y: 60, width: 80, height: 20 }],
    );

    expect(result.y).toBe(40);
    expect(result.grounded).toBe(true);
  });

  it('stops horizontal movement at a wall', () => {
    const result = resolveAxisAlignedMovement(
      { x: 20, y: 20, width: 20, height: 20 },
      30,
      0,
      [{ x: 60, y: 0, width: 20, height: 100 }],
    );

    expect(result.x).toBe(40);
    expect(result.collidedX).toBe(true);
  });
});
