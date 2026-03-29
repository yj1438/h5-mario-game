const MOVEMENT_KEYS = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  jump: ['Space', 'ArrowUp', 'KeyW'],
  restart: ['KeyR'],
} as const;

export class InputManager {
  private readonly pressedKeys = new Set<string>();
  private readonly justPressedKeys = new Set<string>();

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.pressedKeys.has(event.code)) {
      this.justPressedKeys.add(event.code);
    }

    this.pressedKeys.add(event.code);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.pressedKeys.delete(event.code);
  };

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  beginFrame(): void {
    this.justPressedKeys.clear();
  }

  isLeftHeld(): boolean {
    return MOVEMENT_KEYS.left.some((code) => this.pressedKeys.has(code));
  }

  isRightHeld(): boolean {
    return MOVEMENT_KEYS.right.some((code) => this.pressedKeys.has(code));
  }

  isJumpHeld(): boolean {
    return MOVEMENT_KEYS.jump.some((code) => this.pressedKeys.has(code));
  }

  wasJumpPressed(): boolean {
    return MOVEMENT_KEYS.jump.some((code) => this.justPressedKeys.has(code));
  }

  wasRestartPressed(): boolean {
    return MOVEMENT_KEYS.restart.some((code) => this.justPressedKeys.has(code));
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
