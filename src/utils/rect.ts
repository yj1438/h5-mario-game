export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const intersects = (a: Rect, b: Rect): boolean => {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
};

export const containsPoint = (rect: Rect, x: number, y: number): boolean => {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
};
