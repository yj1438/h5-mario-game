const MOVEMENT_KEYS = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  jump: ['Space', 'ArrowUp', 'KeyW'],
  dash: ['ShiftLeft', 'ShiftRight', 'KeyJ'],
  restart: ['KeyR'],
} as const;

const ALL_GAME_KEYS = new Set<string>([
  ...MOVEMENT_KEYS.left,
  ...MOVEMENT_KEYS.right,
  ...MOVEMENT_KEYS.jump,
  ...MOVEMENT_KEYS.dash,
  ...MOVEMENT_KEYS.restart,
]);

export class InputManager {
  private readonly pressedKeys = new Set<string>();
  private readonly justPressedKeys = new Set<string>();

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) return;

    if (!this.pressedKeys.has(event.code)) {
      this.justPressedKeys.add(event.code);
    }

    this.pressedKeys.add(event.code);

    if (ALL_GAME_KEYS.has(event.code)) {
      event.preventDefault();
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.pressedKeys.delete(event.code);
  };

  private readonly onBlur = (): void => {
    this.pressedKeys.clear();
    this.justPressedKeys.clear();
  };

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
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

  isDashHeld(): boolean {
    return MOVEMENT_KEYS.dash.some((code) => this.pressedKeys.has(code));
  }

  wasDashPressed(): boolean {
    return MOVEMENT_KEYS.dash.some((code) => this.justPressedKeys.has(code));
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
  }
}
