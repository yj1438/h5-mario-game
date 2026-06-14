import type { LevelData } from '../../world/Level';

const rows = [
  '0000000000000000000000000000000000000000',
  '0000000000000000000000000000000000000000',
  '0000000000000000000000000000000000000000',
  '0000000000000000000000000000000000000000',
  '0000000000000000000000000000000011110000',
  '0000000000000000000000000011110000000000',
  '0000000000000000000011110000000000000000',
  '0000000000000001111000000000000000000000',
  '0000000000011100000000000000000000000000',
  '0000000000000000000000000000000000000000',
  '1111111111111111111111111111111111111111',
] as const;

export const level1: LevelData = {
  name: 'Color Plains',
  width: rows[0].length,
  height: rows.length,
  tiles: rows.map((row) => row.split('').map((value) => Number(value) as 0 | 1)),
  playerSpawn: {
    x: 96,
    y: 360,
  },
  goal: {
    x: 1680,
    y: 144,
    width: 56,
    height: 96,
  },
  enemies: [
    // Ground patrol near the start
    { x: 400, y: 396 },
    // Ground patrol in the middle
    { x: 900, y: 396 },
    // Ground patrol near the end
    { x: 1400, y: 396 },
    // Platform patrol on the 2nd platform from left
    { x: 600, y: 204 },
  ],
  coins: [
    // Ground coins — early path
    { x: 200, y: 400 },
    { x: 250, y: 400 },
    { x: 300, y: 400 },
    // Near first enemy
    { x: 480, y: 400 },
    // Middle ground coins
    { x: 700, y: 400 },
    { x: 750, y: 400 },
    { x: 800, y: 400 },
    // Platform coins — 2nd platform from left (row 8)
    { x: 600, y: 350 },
    { x: 650, y: 350 },
    { x: 700, y: 350 },
    // Platform coins — 3rd platform (row 6)
    { x: 1050, y: 250 },
    { x: 1100, y: 250 },
    { x: 1150, y: 250 },
    // High platform coins — 4th platform (row 4)
    { x: 1450, y: 150 },
    { x: 1500, y: 150 },
    { x: 1550, y: 150 },
  ],
};
