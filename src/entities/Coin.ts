import type { Container } from 'pixi.js';
import { COIN_CONFIG } from '../app/config/gameConfig';
import { BaseEntity } from './BaseEntity';

export class Coin extends BaseEntity {
  collected = false;
  private time = 0;
  private baseY: number;

  constructor(view: Container, x: number, y: number) {
    super(view, x, y, COIN_CONFIG.size, COIN_CONFIG.size);
    this.baseY = y;
  }

  /** Animate the coin with a gentle vertical bob. */
  animate(deltaTime: number): void {
    if (this.collected) {
      return;
    }

    this.time += deltaTime;
    this.y = this.baseY + Math.sin(this.time * COIN_CONFIG.bobSpeed) * COIN_CONFIG.bobAmplitude;
    this.syncView();
  }

  /** Mark as collected by the player. */
  collect(): void {
    this.collected = true;
    this.active = false;
    this.view.visible = false;
  }

  respawn(): void {
    this.collected = false;
    this.active = true;
    this.view.visible = true;
    this.y = this.baseY;
    this.time = 0;
    this.syncView();
  }
}
