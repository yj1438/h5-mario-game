import type { Container } from 'pixi.js';
import { PLAYER_CONFIG } from '../app/config/gameConfig';
import { BaseEntity } from './BaseEntity';

export class Player extends BaseEntity {
  velocityX = 0;
  velocityY = 0;
  grounded = false;
  hasWon = false;

  constructor(view: Container, x: number, y: number) {
    super(view, x, y, PLAYER_CONFIG.width, PLAYER_CONFIG.height);
  }

  respawn(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.grounded = false;
    this.hasWon = false;
    this.syncView();
  }
}
