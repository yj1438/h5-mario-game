import type { Container } from 'pixi.js';
import { ENEMY_CONFIG } from '../app/config/gameConfig';
import { BaseEntity } from './BaseEntity';

export class Enemy extends BaseEntity {
  velocityX = 0;
  velocityY = 0;
  grounded = false;
  alive = true;
  /** -1 = left, 1 = right */
  direction: -1 | 1 = -1;

  constructor(view: Container, x: number, y: number) {
    super(view, x, y, ENEMY_CONFIG.width, ENEMY_CONFIG.height);
    this.velocityX = this.direction * ENEMY_CONFIG.moveSpeed;
  }

  /** Reverse patrol direction (called when hitting a wall or edge). */
  reverse(): void {
    this.direction = (this.direction * -1) as -1 | 1;
    this.velocityX = this.direction * ENEMY_CONFIG.moveSpeed;
  }

  /** Mark as killed (stomped by player). */
  kill(): void {
    this.alive = false;
    this.active = false;
    this.view.visible = false;
  }

  respawn(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.velocityX = this.direction * ENEMY_CONFIG.moveSpeed;
    this.velocityY = 0;
    this.grounded = false;
    this.alive = true;
    this.active = true;
    this.view.visible = true;
    this.syncView();
  }
}
