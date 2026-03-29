export type TileValue = 0 | 1;

export interface SpawnPoint {
  x: number;
  y: number;
}

export interface GoalData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LevelData {
  name: string;
  width: number;
  height: number;
  tiles: TileValue[][];
  playerSpawn: SpawnPoint;
  goal: GoalData;
}
