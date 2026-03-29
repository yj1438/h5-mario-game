import type { Container } from 'pixi.js';
import type { Rect } from '../utils/rect';

export abstract class BaseEntity {
  readonly view: Container;
  x: number;
  y: number;
  readonly width: number;
  readonly height: number;
  active = true;

  protected constructor(view: Container, x: number, y: number, width: number, height: number) {
    this.view = view;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.syncView();
  }

  getBounds(): Rect {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  syncView(): void {
    this.view.position.set(this.x, this.y);
  }
}
