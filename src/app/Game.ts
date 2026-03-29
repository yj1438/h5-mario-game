import { Application, settings } from 'pixi.js';
import { MAX_FRAME_TIME, VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from './config/gameConfig';
import { InputManager } from '../systems/InputManager';
import { SceneManager } from './SceneManager';
import { BootScene } from '../scenes/BootScene';

export class Game {
  readonly app: Application;
  readonly input = new InputManager();
  readonly sceneManager: SceneManager;

  constructor(private readonly container: HTMLElement) {
    this.app = new Application({
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT,
      antialias: true,
      backgroundColor: 0x0f172a,
    });

    settings.ROUND_PIXELS = true;
    this.sceneManager = new SceneManager(this.app.stage);
  }

  async start(): Promise<void> {
    this.container.appendChild(this.app.view as HTMLCanvasElement);
    this.app.view.style.width = '100%';
    this.app.view.style.height = '100%';
    this.app.view.style.objectFit = 'contain';

    this.sceneManager.setScene(new BootScene(this));

    this.app.ticker.add(() => {
      const deltaTime = Math.min(this.app.ticker.deltaMS / 1000, MAX_FRAME_TIME);
      this.sceneManager.update(deltaTime);
    });
  }

  destroy(): void {
    this.sceneManager.destroy();
    this.input.dispose();
    this.app.destroy(true, { children: true, texture: true, baseTexture: true });
  }
}
