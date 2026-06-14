import { CAMERA_CONFIG, VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from '../app/config/gameConfig';

export class CameraController {
  x = 0;
  y = 0;

  /** Current smoothed look-ahead offset. */
  private currentLookAheadX = 0;

  update(
    targetCenterX: number,
    targetCenterY: number,
    playerVelocityX: number,
    worldWidth: number,
    worldHeight: number,
  ): void {
    // --- Look-ahead: smoothly follow player's horizontal velocity ---
    const desiredLookAhead = playerVelocityX > 20
      ? CAMERA_CONFIG.lookAhead
      : playerVelocityX < -20
        ? -CAMERA_CONFIG.lookAhead
        : 0;

    const lookAheadDelta = CAMERA_CONFIG.lookAheadSpeed * CAMERA_CONFIG.followLerp;
    if (this.currentLookAheadX < desiredLookAhead) {
      this.currentLookAheadX = Math.min(this.currentLookAheadX + lookAheadDelta, desiredLookAhead);
    } else {
      this.currentLookAheadX = Math.max(this.currentLookAheadX - lookAheadDelta, desiredLookAhead);
    }

    const focusedX = targetCenterX + this.currentLookAheadX;
    const focusedY = targetCenterY;

    // --- Deadzone: camera only moves if target escapes the deadzone ---
    const halfW = VIEWPORT_WIDTH / 2;
    const halfH = VIEWPORT_HEIGHT / 2;
    const desiredX = clamp(focusedX - halfW, 0, Math.max(0, worldWidth - VIEWPORT_WIDTH));
    const desiredY = clamp(focusedY - halfH, 0, Math.max(0, worldHeight - VIEWPORT_HEIGHT));

    const camCenterX = this.x + halfW;
    const camCenterY = this.y + halfH;
    const dzh = CAMERA_CONFIG.deadzoneX;
    const dzv = CAMERA_CONFIG.deadzoneY;

    // Horizontal: only move if focus escapes deadzone
    if (focusedX < camCenterX - dzh) {
      this.x += (desiredX - this.x) * CAMERA_CONFIG.followLerp;
    } else if (focusedX > camCenterX + dzh) {
      this.x += (desiredX - this.x) * CAMERA_CONFIG.followLerp;
    }

    // Vertical: only move if focus escapes deadzone
    if (focusedY < camCenterY - dzv) {
      this.y += (desiredY - this.y) * CAMERA_CONFIG.followLerp;
    } else if (focusedY > camCenterY + dzv) {
      this.y += (desiredY - this.y) * CAMERA_CONFIG.followLerp;
    }

    // Clamp to world bounds
    this.x = clamp(this.x, 0, Math.max(0, worldWidth - VIEWPORT_WIDTH));
    this.y = clamp(this.y, 0, Math.max(0, worldHeight - VIEWPORT_HEIGHT));
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
