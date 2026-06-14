import type { Container } from 'pixi.js';
import { PLAYER_CONFIG } from '../app/config/gameConfig';
import { BaseEntity } from './BaseEntity';

export class Player extends BaseEntity {
  velocityX = 0;
  velocityY = 0;
  grounded = false;
  hasWon = false;

  /** -1 = touching left wall, 1 = touching right wall, 0 = none */
  wallDirection: -1 | 0 | 1 = 0;

  /** Wall-jump lock: ignore horizontal input briefly after wall jump */
  wallJumpLockTimer = 0;

  /** Dash state */
  isDashing = false;
  dashTimer = 0;
  dashCooldownTimer = 0;
  /** Facing direction for dash when no input: -1 left, 1 right */
  facing: -1 | 1 = 1;

  constructor(view: Container, x: number, y: number) {
    super(view, x, y, PLAYER_CONFIG.width, PLAYER_CONFIG.height);
  }

  /** Start a dash in the given direction. */
  startDash(direction: -1 | 1): void {
    this.isDashing = true;
    this.dashTimer = PLAYER_CONFIG.dashDuration;
    this.dashCooldownTimer = PLAYER_CONFIG.dashCooldown;
    this.velocityX = direction * PLAYER_CONFIG.dashSpeed;
    this.velocityY = 0;
  }

  respawn(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.grounded = false;
    this.hasWon = false;
    this.wallDirection = 0;
    this.wallJumpLockTimer = 0;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.syncView();
  }
}
