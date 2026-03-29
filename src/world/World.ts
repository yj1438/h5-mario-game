import { Container } from 'pixi.js';
import { CAMERA_CONFIG, COYOTE_TIME, FIXED_TIME_STEP, JUMP_BUFFER_TIME, PLAYER_CONFIG, TILE_SIZE } from '../app/config/gameConfig';
import { Player } from '../entities/Player';
import { Goal } from '../entities/Goal';
import { createBackground, createGoalView, createPlayerView, createTerrainTile } from '../rendering/PlaceholderFactory';
import { createLayers } from '../rendering/Layers';
import { resolveAxisAlignedMovement } from '../systems/Collision';
import type { InputManager } from '../systems/InputManager';
import { updateHorizontalVelocity, updateVerticalVelocity } from '../systems/Physics';
import { approach } from '../utils/math';
import { intersects } from '../utils/rect';
import { CameraController } from './CameraController';
import { CollisionWorld } from './CollisionWorld';
import type { LevelData } from './Level';

export class World {
  readonly root: Container;
  readonly worldWidth: number;
  readonly worldHeight: number;
  readonly player: Player;
  readonly goal: Goal;

  private readonly layers = createLayers();
  private readonly collisionWorld: CollisionWorld;
  private readonly camera = new CameraController();
  private accumulator = 0;
  private jumpBufferTimer = 0;
  private coyoteTimer = 0;
  private lookAheadX = 0;

  won = false;

  constructor(private readonly level: LevelData) {
    this.root = this.layers.root;
    this.worldWidth = level.width * TILE_SIZE;
    this.worldHeight = level.height * TILE_SIZE;
    this.collisionWorld = new CollisionWorld(level);

    this.layers.background.addChild(createBackground(this.worldWidth, this.worldHeight));
    this.buildTerrain();

    this.player = new Player(createPlayerView(PLAYER_CONFIG.width, PLAYER_CONFIG.height), level.playerSpawn.x, level.playerSpawn.y);
    this.goal = new Goal(createGoalView(level.goal.width, level.goal.height), level.goal.x, level.goal.y, level.goal.width, level.goal.height);

    this.layers.actors.addChild(this.player.view, this.goal.view);
    this.updateCamera();
  }

  update(deltaTime: number, input: InputManager): void {
    this.accumulator += deltaTime;

    while (this.accumulator >= FIXED_TIME_STEP) {
      this.step(FIXED_TIME_STEP, input);
      this.accumulator -= FIXED_TIME_STEP;
    }

    this.player.syncView();
    this.goal.syncView();
    input.beginFrame();
  }

  restart(): void {
    this.player.respawn(this.level.playerSpawn.x, this.level.playerSpawn.y);
    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;
    this.lookAheadX = 0;
    this.won = false;
    this.updateCamera();
  }

  private step(deltaTime: number, input: InputManager): void {
    if (this.won) {
      return;
    }

    const direction = (input.isLeftHeld() ? -1 : 0) + (input.isRightHeld() ? 1 : 0);
    const jumpPressedThisFrame = input.wasJumpPressed();

    this.jumpBufferTimer = jumpPressedThisFrame ? JUMP_BUFFER_TIME : Math.max(0, this.jumpBufferTimer - deltaTime);
    this.coyoteTimer = this.player.grounded ? COYOTE_TIME : Math.max(0, this.coyoteTimer - deltaTime);

    const canJumpNow = this.jumpBufferTimer > 0 && this.coyoteTimer > 0;

    this.player.velocityX = updateHorizontalVelocity(
      {
        velocityX: this.player.velocityX,
        velocityY: this.player.velocityY,
        grounded: this.player.grounded,
      },
      {
        direction: direction as -1 | 0 | 1,
        jumpPressed: canJumpNow,
      },
      PLAYER_CONFIG,
      deltaTime,
    );

    this.player.velocityY = updateVerticalVelocity(
      {
        velocityX: this.player.velocityX,
        velocityY: this.player.velocityY,
        grounded: this.coyoteTimer > 0,
      },
      {
        direction: direction as -1 | 0 | 1,
        jumpPressed: canJumpNow,
      },
      PLAYER_CONFIG,
      deltaTime,
    );

    if (canJumpNow) {
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
    }

    const movement = resolveAxisAlignedMovement(
      this.player.getBounds(),
      this.player.velocityX * deltaTime,
      this.player.velocityY * deltaTime,
      this.collisionWorld.getNearbySolids(this.player.x, this.player.y, this.player.width, this.player.height),
    );

    this.player.x = movement.x;
    this.player.y = movement.y;
    this.player.grounded = movement.grounded;

    if (movement.collidedX) {
      this.player.velocityX = 0;
    }

    if (movement.grounded) {
      this.coyoteTimer = COYOTE_TIME;
    }

    if (movement.grounded || movement.hitCeiling) {
      this.player.velocityY = 0;
    }

    if (this.player.y + this.player.height > this.worldHeight) {
      this.player.y = this.worldHeight - this.player.height;
      this.player.velocityY = 0;
      this.player.grounded = true;
      this.coyoteTimer = COYOTE_TIME;
    }

    if (intersects(this.player.getBounds(), this.goal.getBounds())) {
      this.won = true;
      this.player.hasWon = true;
    }

    this.updateCamera();
  }

  private updateCamera(): void {
    const desiredLookAhead = this.player.velocityX > 0 ? CAMERA_CONFIG.lookAhead : this.player.velocityX < 0 ? -CAMERA_CONFIG.lookAhead : 0;
    this.lookAheadX = approach(this.lookAheadX, desiredLookAhead, 360 * FIXED_TIME_STEP);

    const playerCenterX = this.player.x + this.player.width / 2 + this.lookAheadX;
    const playerCenterY = this.player.y + this.player.height / 2;

    this.camera.update(playerCenterX, playerCenterY, this.worldWidth, this.worldHeight);
    this.layers.world.position.set(-Math.round(this.camera.x), -Math.round(this.camera.y));
  }

  private buildTerrain(): void {
    for (let row = 0; row < this.level.height; row += 1) {
      for (let column = 0; column < this.level.width; column += 1) {
        if (this.level.tiles[row]?.[column] !== 1) {
          continue;
        }

        this.layers.terrain.addChild(createTerrainTile(column * TILE_SIZE, row * TILE_SIZE));
      }
    }

    const frame = new Container();
    frame.position.set(0, 0);
    this.layers.foreground.addChild(frame);
  }
}
