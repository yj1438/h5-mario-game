import { Container, Text, TextStyle } from 'pixi.js';
import { HUD_STYLE, VIEWPORT_WIDTH } from '../app/config/gameConfig';

export class Hud {
  readonly container = new Container();

  private readonly titleText = new Text('PIXEL PLAINS', new TextStyle(HUD_STYLE));
  private readonly hintText = new Text('移动:AD/←→ 跳跃:W/空格/↑ 冲刺:Shift/J 蹬墙跳:靠墙+跳跃 R重开', new TextStyle({ ...HUD_STYLE, fontSize: 14 }));
  private readonly statusText = new Text('', new TextStyle({ ...HUD_STYLE, fontSize: 20 }));
  private readonly scoreText = new Text('', new TextStyle({ ...HUD_STYLE, fontSize: 20, fill: 0xfacc15 }));

  constructor() {
    this.titleText.position.set(20, 16);
    this.hintText.position.set(20, 52);
    this.statusText.position.set(VIEWPORT_WIDTH - 320, 20);
    this.scoreText.position.set(VIEWPORT_WIDTH - 320, 48);

    this.container.addChild(this.titleText, this.hintText, this.statusText, this.scoreText);
  }

  setStatus(message: string): void {
    this.statusText.text = message;
  }

  setScore(coinCount: number, totalCoins: number, score: number): void {
    this.scoreText.text = `🪙 ${coinCount}/${totalCoins}  ★ ${score}`;
  }
}
