import { Container } from 'pixi.js';
import { COIN_CONFIG, COYOTE_TIME, ENEMY_CONFIG, FIXED_TIME_STEP, JUMP_BUFFER_TIME, PLAYER_CONFIG, TILE_SIZE } from '../app/config/gameConfig';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Coin } from '../entities/Coin';
import { Goal } from '../entities/Goal';
import { createBackground, createCoinView, createEnemyView, createGoalView, createPlayerView, createTerrainTile } from '../rendering/PlaceholderFactory';
import { createLayers } from '../rendering/Layers';
import { resolveAxisAlignedMovement } from '../systems/Collision';
import type { InputManager } from '../systems/InputManager';
import { updateHorizontalVelocity, updateVerticalVelocity } from '../systems/Physics';
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
  readonly enemies: Enemy[];
  readonly coins: Coin[];

  private readonly layers = createLayers();
  private readonly collisionWorld: CollisionWorld;
  private readonly camera = new CameraController();
  private readonly enemySpawns: { x: number; y: number }[];
  private accumulator = 0;
  private jumpBufferTimer = 0;
  private coyoteTimer = 0;
  private jumpConsumedUntilRelease = false;
  private jumpQueued = false;
  private wasGroundedLastStep = false;
  private wasCollidingWallLastStep = false;

  won = false;
  score = 0;
  coinCount = 0;
  totalCoins = 0;

  constructor(private readonly level: LevelData) {
    this.root = this.layers.root;
    this.worldWidth = level.width * TILE_SIZE;
    this.worldHeight = level.height * TILE_SIZE;
    this.collisionWorld = new CollisionWorld(level);

    this.layers.background.addChild(createBackground(this.worldWidth, this.worldHeight));
    this.buildTerrain();

    this.player = new Player(createPlayerView(PLAYER_CONFIG.width, PLAYER_CONFIG.height), level.playerSpawn.x, level.playerSpawn.y);
    this.goal = new Goal(createGoalView(level.goal.width, level.goal.height), level.goal.x, level.goal.y, level.goal.width, level.goal.height);

    this.enemySpawns = level.enemies ?? [];
    this.enemies = this.enemySpawns.map(
      (spawn) => new Enemy(createEnemyView(ENEMY_CONFIG.width, ENEMY_CONFIG.height), spawn.x, spawn.y),
    );

    const coinSpawns = level.coins ?? [];
    this.totalCoins = coinSpawns.length;
    this.coins = coinSpawns.map(
      (spawn) => new Coin(createCoinView(COIN_CONFIG.size), spawn.x, spawn.y),
    );

    this.layers.actors.addChild(this.player.view, this.goal.view, ...this.enemies.map((e) => e.view), ...this.coins.map((c) => c.view));
    this.updateCamera();
  }

  update(deltaTime: number, input: InputManager): void {
    this.accumulator += deltaTime;

    while (this.accumulator >= FIXED_TIME_STEP) {
      this.step(FIXED_TIME_STEP, input);
      this.accumulator -= FIXED_TIME_STEP;
      input.beginFrame();
    }

    this.player.syncView();
    this.goal.syncView();
    for (const enemy of this.enemies) {
      enemy.syncView();
    }
    for (const coin of this.coins) {
      coin.animate(deltaTime);
    }
  }

  restart(): void {
    this.player.respawn(this.level.playerSpawn.x, this.level.playerSpawn.y);
    this.enemySpawns.forEach((spawn, i) => {
      this.enemies[i].respawn(spawn.x, spawn.y);
    });
    for (const coin of this.coins) {
      coin.respawn();
    }
    this.score = 0;
    this.coinCount = 0;
    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;
    this.jumpQueued = false;
    this.jumpConsumedUntilRelease = false;
    this.wasGroundedLastStep = false;
    this.wasCollidingWallLastStep = false;
    this.won = false;
    this.updateCamera();
  }

  private step(deltaTime: number, input: InputManager): void {
    if (this.won) {
      return;
    }

    const player = this.player;

    const direction = (input.isLeftHeld() ? -1 : 0) + (input.isRightHeld() ? 1 : 0);
    const jumpPressedThisFrame = input.wasJumpPressed();
    const jumpHeld = input.isJumpHeld();
    const dashPressedThisFrame = input.wasDashPressed();

    // Track facing for dash when no direction held
    if (direction !== 0) {
      player.facing = direction as -1 | 1;
    }

    // --- Dash cooldown ---
    if (player.dashCooldownTimer > 0) {
      player.dashCooldownTimer = Math.max(0, player.dashCooldownTimer - deltaTime);
    }

    // --- Dash execution ---
    if (dashPressedThisFrame && !player.isDashing && player.dashCooldownTimer <= 0) {
      const dashDir = (direction !== 0 ? direction : player.facing) as -1 | 1;
      player.startDash(dashDir);
    }

    // --- Dash active: bypass normal physics ---
    if (player.isDashing) {
      player.dashTimer -= deltaTime;

      if (player.dashTimer <= 0) {
        player.isDashing = false;
        // Preserve some momentum after dash
        player.velocityX = player.facing * PLAYER_CONFIG.maxMoveSpeed * 0.6;
      }

      // Collision resolution during dash
      const dashMovement = resolveAxisAlignedMovement(
        player.getBounds(),
        player.velocityX * deltaTime,
        0,
        this.collisionWorld.getNearbySolids(player.x, player.y, player.width, player.height),
      );

      player.x = dashMovement.x;
      player.y = dashMovement.y;

      if (dashMovement.collidedX) {
        player.velocityX = 0;
        player.isDashing = false;
      }

      // Fall death
      if (player.y > this.worldHeight) {
        this.restart();
        return;
      }

      this.wasGroundedLastStep = false;
      this.wasCollidingWallLastStep = false;
      this.wasGroundedLastStep = false;
      this.updateEnemies(deltaTime);
      this.checkPlayerEnemyCollision();
      this.checkCoinCollection();
      if (intersects(player.getBounds(), this.goal.getBounds())) {
        this.won = true;
        player.hasWon = true;
      }
      this.updateCamera();
      return;
    }

    // --- Jump buffer ---
    if (jumpPressedThisFrame) {
      this.jumpQueued = true;
      this.jumpBufferTimer = JUMP_BUFFER_TIME;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - deltaTime);
    }

    if (!jumpHeld) {
      this.jumpQueued = false;
      this.jumpConsumedUntilRelease = false;
    }

    // --- Coyote time ---
    this.coyoteTimer = this.wasGroundedLastStep ? COYOTE_TIME : Math.max(0, this.coyoteTimer - deltaTime);

    // --- Wall-jump lock timer ---
    if (player.wallJumpLockTimer > 0) {
      player.wallJumpLockTimer = Math.max(0, player.wallJumpLockTimer - deltaTime);
    }

    // --- Horizontal velocity (suppressed during wall-jump lock) ---
    const effectiveDirection = player.wallJumpLockTimer > 0 ? 0 : (direction as -1 | 0 | 1);
    player.velocityX = updateHorizontalVelocity(
      {
        velocityX: player.velocityX,
        velocityY: player.velocityY,
        grounded: this.wasGroundedLastStep,
      },
      {
        direction: effectiveDirection,
        jumpPressed: false,
        jumpHeld: false,
      },
      PLAYER_CONFIG,
      deltaTime,
    );

    // --- Vertical velocity ---
    // Apply wall-slide: reduced gravity when wall-sliding
    const isWallSliding = player.wallDirection !== 0 && !player.grounded && player.velocityY > 0
      && ((player.wallDirection === -1 && input.isLeftHeld()) || (player.wallDirection === 1 && input.isRightHeld()));

    const effectiveGravity = isWallSliding
      ? PLAYER_CONFIG.gravity * PLAYER_CONFIG.wallSlideGravityScale
      : PLAYER_CONFIG.gravity;

    player.velocityY = updateVerticalVelocity(
      {
        velocityX: player.velocityX,
        velocityY: player.velocityY,
        grounded: this.wasGroundedLastStep,
      },
      {
        direction: effectiveDirection,
        jumpPressed: false,
        jumpHeld: jumpHeld,
      },
      { ...PLAYER_CONFIG, gravity: effectiveGravity },
      deltaTime,
    );

    // Cap wall-slide fall speed
    if (isWallSliding) {
      player.velocityY = Math.min(player.velocityY, PLAYER_CONFIG.maxFallSpeed * 0.3);
    }

    // --- Collision resolution ---
    const movement = resolveAxisAlignedMovement(
      player.getBounds(),
      player.velocityX * deltaTime,
      player.velocityY * deltaTime,
      this.collisionWorld.getNearbySolids(player.x, player.y, player.width, player.height),
    );

    player.x = movement.x;
    player.y = movement.y;
    player.grounded = movement.grounded;

    // Detect wall contact for wall-jump
    player.wallDirection = 0;
    if (movement.collidedX && !player.grounded) {
      player.wallDirection = player.velocityX > 0 ? 1 : -1;
    }

    if (movement.collidedX) {
      player.velocityX = 0;
    }

    if (movement.grounded) {
      this.coyoteTimer = COYOTE_TIME;
      player.wallJumpLockTimer = 0;
    }

    if (movement.grounded || movement.hitCeiling) {
      player.velocityY = 0;
    }

    // --- World boundaries ---
    if (player.y > this.worldHeight) {
      this.restart();
      return;
    }

    if (player.x < 0) {
      player.x = 0;
      if (player.velocityX < 0) {
        player.velocityX = 0;
      }
    }

    // --- Jump execution (ground jump) ---
    const canJumpNow = this.jumpQueued && this.jumpBufferTimer > 0 && this.coyoteTimer > 0 && !this.jumpConsumedUntilRelease;
    if (canJumpNow) {
      player.velocityY = -PLAYER_CONFIG.jumpVelocity;
      player.grounded = false;
      this.jumpQueued = false;
      this.jumpConsumedUntilRelease = true;
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
    }

    // --- Wall jump execution ---
    const canWallJump = jumpPressedThisFrame && player.wallDirection !== 0 && !player.grounded;
    if (canWallJump) {
      const wallDir = player.wallDirection;
      player.velocityX = -wallDir * PLAYER_CONFIG.wallJumpVelocityX;
      player.velocityY = -PLAYER_CONFIG.wallJumpVelocityY;
      player.wallJumpLockTimer = PLAYER_CONFIG.wallJumpLockTime;
      player.wallDirection = 0;
      this.jumpQueued = false;
      this.jumpConsumedUntilRelease = true;
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
    }

    this.wasGroundedLastStep = player.grounded;
    this.wasCollidingWallLastStep = player.wallDirection !== 0;

    // --- Enemy updates ---
    this.updateEnemies(deltaTime);

    // --- Player-enemy collision ---
    this.checkPlayerEnemyCollision();

    // --- Coin collection ---
    this.checkCoinCollection();

    if (intersects(player.getBounds(), this.goal.getBounds())) {
      this.won = true;
      player.hasWon = true;
    }

    this.updateCamera();
  }

  private updateCamera(): void {
    const playerCenterX = this.player.x + this.player.width / 2;
    const playerCenterY = this.player.y + this.player.height / 2;

    this.camera.update(playerCenterX, playerCenterY, this.player.velocityX, this.worldWidth, this.worldHeight);
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

  /** Update all alive enemies: gravity, movement, wall/edge reversal. */
  private updateEnemies(deltaTime: number): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive) {
        continue;
      }

      // Apply gravity
      enemy.velocityY = Math.min(enemy.velocityY + ENEMY_CONFIG.gravity * deltaTime, ENEMY_CONFIG.maxFallSpeed);

      // Horizontal movement with collision
      const hSolids = this.collisionWorld.getNearbySolids(enemy.x, enemy.y, enemy.width, enemy.height);
      let nextX = enemy.x + enemy.velocityX * deltaTime;
      let hitWall = false;

      for (const solid of hSolids) {
        if (intersects({ x: nextX, y: enemy.y, width: enemy.width, height: enemy.height }, solid)) {
          hitWall = true;
          nextX = enemy.velocityX > 0 ? solid.x - enemy.width : solid.x + solid.width;
          break;
        }
      }

      enemy.x = nextX;

      if (hitWall) {
        enemy.reverse();
      }

      // Vertical movement with collision
      const vSolids = this.collisionWorld.getNearbySolids(enemy.x, enemy.y, enemy.width, enemy.height);
      const nextY = enemy.y + enemy.velocityY * deltaTime;
      enemy.grounded = false;

      for (const solid of vSolids) {
        if (intersects({ x: enemy.x, y: nextY, width: enemy.width, height: enemy.height }, solid)) {
          if (enemy.velocityY > 0) {
            enemy.y = solid.y - enemy.height;
            enemy.grounded = true;
          } else {
            enemy.y = solid.y + solid.height;
          }
          enemy.velocityY = 0;
          break;
        } else {
          enemy.y = nextY;
        }
      }

      if (!enemy.grounded) {
        enemy.y = nextY;
      }

      // Edge detection: reverse if about to walk off a platform
      if (enemy.grounded) {
        const lookAheadX = enemy.direction === 1 ? enemy.x + enemy.width + 2 : enemy.x - 2;
        const probeY = enemy.y + enemy.height + 2;
        const probeCol = Math.floor(lookAheadX / TILE_SIZE);
        const probeRow = Math.floor(probeY / TILE_SIZE);

        if (!this.collisionWorld.isSolidAt(probeRow, probeCol)) {
          enemy.reverse();
        }
      }

      // Fall off world
      if (enemy.y > this.worldHeight) {
        enemy.kill();
      }
    }
  }

  /** Check player vs enemies: stomp from above = kill enemy, side hit = player dies. */
  private checkPlayerEnemyCollision(): void {
    const playerBounds = this.player.getBounds();

    for (const enemy of this.enemies) {
      if (!enemy.alive) {
        continue;
      }

      const enemyBounds = enemy.getBounds();

      if (!intersects(playerBounds, enemyBounds)) {
        continue;
      }

      // Stomp detection: player falling and player bottom is near enemy top
      const playerBottom = playerBounds.y + playerBounds.height;
      const enemyTop = enemyBounds.y;
      const overlap = playerBottom - enemyTop;

      if (this.player.velocityY > 0 && overlap < playerBounds.height * 0.5) {
        // Player stomps enemy
        enemy.kill();
        this.player.velocityY = -PLAYER_CONFIG.jumpVelocity * 0.6;
      } else {
        // Player dies
        this.restart();
        return;
      }
    }
  }

  /** Check player vs coins: collect on overlap. */
  private checkCoinCollection(): void {
    const playerBounds = this.player.getBounds();

    for (const coin of this.coins) {
      if (coin.collected) {
        continue;
      }

      if (intersects(playerBounds, coin.getBounds())) {
        coin.collect();
        this.score += COIN_CONFIG.scoreValue;
        this.coinCount += 1;
      }
    }
  }
}
