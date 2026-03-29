import { CAMERA_CONFIG, VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from '../app/config/gameConfig';
import { clamp } from '../utils/math';

export class CameraController {
  x = 0;
  y = 0;

  update(targetCenterX: number, targetCenterY: number, worldWidth: number, worldHeight: number): void {
    const desiredX = clamp(targetCenterX - VIEWPORT_WIDTH / 2, 0, Math.max(0, worldWidth - VIEWPORT_WIDTH));
    const desiredY = clamp(targetCenterY - VIEWPORT_HEIGHT / 2, 0, Math.max(0, worldHeight - VIEWPORT_HEIGHT));

    this.x += (desiredX - this.x) * CAMERA_CONFIG.followLerp;
    this.y += (desiredY - this.y) * CAMERA_CONFIG.followLerp;
  }
}
