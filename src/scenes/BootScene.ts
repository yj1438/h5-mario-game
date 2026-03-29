import { Container } from 'pixi.js';
import type { Game } from '../app/Game';
import type { Scene } from '../app/SceneManager';
import { GameScene } from './GameScene';

export class BootScene implements Scene {
  readonly root = new Container();

  constructor(private readonly game: Game) {}

  enter(): void {
    this.game.sceneManager.setScene(new GameScene(this.game));
  }

  update(): void {}

  exit(): void {}
}
