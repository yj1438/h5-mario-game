import { Container, Graphics } from 'pixi.js';
import { TILE_SIZE } from '../app/config/gameConfig';

const createRect = (width: number, height: number, fill: number, radius = 0): Graphics => {
  const shape = new Graphics();
  shape.beginFill(fill);
  shape.drawRoundedRect(0, 0, width, height, radius);
  shape.endFill();
  return shape;
};

export const createBackground = (width: number, height: number): Container => {
  const container = new Container();

  const sky = createRect(width, height, 0x7dd3fc);
  const horizon = createRect(width, height * 0.3, 0xbfdbfe);
  horizon.y = height * 0.7;

  container.addChild(sky, horizon);
  return container;
};

export const createPlayerView = (width: number, height: number): Container => {
  const container = new Container();
  const body = createRect(width, height, 0xef4444, 6);
  const cap = createRect(width, 10, 0x1d4ed8, 4);
  container.addChild(body, cap);
  return container;
};

export const createGoalView = (width: number, height: number): Container => {
  const container = new Container();
  const pole = createRect(8, height, 0xe5e7eb);
  pole.x = width - 10;
  const flag = createRect(width * 0.55, height * 0.25, 0x22c55e, 2);
  flag.x = width - 10 - flag.width;
  flag.y = 10;
  const base = createRect(width, 14, 0x16a34a, 3);
  base.y = height - 14;
  container.addChild(pole, flag, base);
  return container;
};

export const createCoinView = (size: number): Container => {
  const container = new Container();
  const body = createRect(size, size, 0xfacc15, size / 2);
  const highlight = createRect(size * 0.4, size * 0.4, 0xfde68a, size * 0.2);
  highlight.x = size * 0.15;
  highlight.y = size * 0.15;
  container.addChild(body, highlight);
  return container;
};

export const createEnemyView = (width: number, height: number): Container => {
  const container = new Container();
  const body = createRect(width, height, 0x9333ea, 6);
  const eyes = createRect(width * 0.5, 8, 0xffffff, 2);
  eyes.x = width * 0.25;
  eyes.y = height * 0.2;
  const pupils = createRect(width * 0.3, 6, 0x000000, 2);
  pupils.x = width * 0.35;
  pupils.y = height * 0.22;
  container.addChild(body, eyes, pupils);
  return container;
};

export const createTerrainTile = (x: number, y: number): Graphics => {
  const tile = createRect(TILE_SIZE, TILE_SIZE, 0x8b5a2b, 6);
  tile.position.set(x, y);
  return tile;
};
