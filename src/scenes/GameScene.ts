import { Container } from 'pixi.js';
import type { Game } from '../app/Game';
import type { Scene } from '../app/SceneManager';
import { level1 } from '../data/levels/level1';
import { Hud } from '../ui/Hud';
import { World } from '../world/World';

export class GameScene implements Scene {
  readonly root = new Container();

  private readonly world = new World(level1);
  private readonly hud = new Hud();

  constructor(private readonly game: Game) {
    this.root.addChild(this.world.root, this.hud.container);
  }

  enter(): void {
    this.hud.setStatus('向右前进，抵达绿色终点');
  }

  update(deltaTime: number): void {
    if (this.game.input.wasRestartPressed()) {
      this.world.restart();
      this.hud.setStatus('已重新开始');
    }

    this.world.update(deltaTime, this.game.input);

    if (this.world.won) {
      this.hud.setStatus('通关成功，按 R 再来一次');
      return;
    }

    this.hud.setStatus('向右前进，抵达绿色终点');
  }

  exit(): void {}
}
