import { Game } from './app/Game';

const container = document.getElementById('app');

if (!container) {
  throw new Error('App container not found.');
}

const game = new Game(container);
void game.start();
