import { Container } from 'pixi.js';

export interface LayerSet {
  root: Container;
  world: Container;
  background: Container;
  terrain: Container;
  actors: Container;
  foreground: Container;
  ui: Container;
}

export const createLayers = (): LayerSet => {
  const root = new Container();
  const world = new Container();
  const background = new Container();
  const terrain = new Container();
  const actors = new Container();
  const foreground = new Container();
  const ui = new Container();

  world.addChild(background, terrain, actors, foreground);
  root.addChild(world, ui);

  return {
    root,
    world,
    background,
    terrain,
    actors,
    foreground,
    ui,
  };
};
