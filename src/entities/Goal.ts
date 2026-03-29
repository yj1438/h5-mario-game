import type { Container } from 'pixi.js';
import { BaseEntity } from './BaseEntity';

export class Goal extends BaseEntity {
  constructor(view: Container, x: number, y: number, width: number, height: number) {
    super(view, x, y, width, height);
  }
}
