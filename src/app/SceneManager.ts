import { Container } from 'pixi.js';

export interface Scene {
  readonly root: Container;
  enter(): void;
  update(deltaTime: number): void;
  exit(): void;
}

export class SceneManager {
  private currentScene: Scene | null = null;

  constructor(private readonly stage: Container) {}

  setScene(scene: Scene): void {
    this.currentScene?.exit();

    if (this.currentScene) {
      this.stage.removeChild(this.currentScene.root);
    }

    this.currentScene = scene;
    this.stage.addChild(scene.root);
    scene.enter();
  }

  update(deltaTime: number): void {
    this.currentScene?.update(deltaTime);
  }

  destroy(): void {
    this.currentScene?.exit();
    if (this.currentScene) {
      this.stage.removeChild(this.currentScene.root);
    }
    this.currentScene = null;
  }
}
