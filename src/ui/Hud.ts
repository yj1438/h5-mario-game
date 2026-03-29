import { Container, Text, TextStyle } from 'pixi.js';
import { HUD_STYLE, VIEWPORT_WIDTH } from '../app/config/gameConfig';

export class Hud {
  readonly container = new Container();

  private readonly titleText = new Text('PIXEL PLAINS', new TextStyle(HUD_STYLE));
  private readonly hintText = new Text('A/D 或 ←/→ 移动，W/空格/↑ 跳跃，R 重开', new TextStyle({ ...HUD_STYLE, fontSize: 18 }));
  private readonly statusText = new Text('', new TextStyle({ ...HUD_STYLE, fontSize: 20 }));

  constructor() {
    this.titleText.position.set(20, 16);
    this.hintText.position.set(20, 52);
    this.statusText.position.set(VIEWPORT_WIDTH - 320, 20);

    this.container.addChild(this.titleText, this.hintText, this.statusText);
  }

  setStatus(message: string): void {
    this.statusText.text = message;
  }
}
