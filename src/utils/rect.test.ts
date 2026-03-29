import { describe, expect, it } from 'vitest';
import { containsPoint, intersects } from './rect';

describe('rect utils', () => {
  it('detects rectangle intersection', () => {
    expect(
      intersects(
        { x: 0, y: 0, width: 20, height: 20 },
        { x: 10, y: 10, width: 20, height: 20 },
      ),
    ).toBe(true);

    expect(
      intersects(
        { x: 0, y: 0, width: 20, height: 20 },
        { x: 21, y: 0, width: 20, height: 20 },
      ),
    ).toBe(false);
  });

  it('checks points inside rectangle', () => {
    const rect = { x: 10, y: 20, width: 30, height: 40 };

    expect(containsPoint(rect, 20, 30)).toBe(true);
    expect(containsPoint(rect, 100, 100)).toBe(false);
  });
});
