export const TILE = 40;
export const COLS = 20;
export const ROWS = 12;
export const FIELD_W = COLS * TILE;
export const FIELD_H = ROWS * TILE;

export interface Vec {
  x: number;
  y: number;
}

type GridPoint = readonly [number, number];

// El primer recorrido conserva exactamente el mapa original.
const MAPS: ReadonlyArray<ReadonlyArray<GridPoint>> = [
  [[0, 2], [5, 2], [5, 9], [14, 9], [14, 3], [19, 3]],
  [[0, 1], [17, 1], [17, 4], [3, 4], [3, 7], [16, 7], [16, 10], [19, 10]],
  [[0, 5], [4, 5], [4, 2], [15, 2], [15, 9], [19, 9]],
  [[0, 1], [18, 1], [18, 10], [2, 10], [2, 3], [15, 3], [15, 8], [5, 8], [5, 5], [12, 5], [12, 6], [19, 6]],
  [[0, 2], [3, 2], [3, 9], [7, 9], [7, 3], [11, 3], [11, 10], [15, 10], [15, 2], [19, 2]],
  [[0, 0], [18, 0], [18, 3], [1, 3], [1, 6], [18, 6], [18, 9], [1, 9], [1, 11], [19, 11]],
  [[0, 2], [16, 2], [16, 9], [4, 9], [4, 5], [13, 5], [13, 7], [19, 7]],
  [[0, 4], [4, 4], [4, 1], [10, 1], [10, 10], [6, 10], [6, 6], [15, 6], [15, 2], [19, 2]],
  [[0, 0], [2, 0], [2, 3], [7, 3], [7, 1], [12, 1], [12, 4], [17, 4], [17, 7], [9, 7], [9, 10], [19, 10]],
  [[0, 6], [3, 6], [3, 1], [8, 1], [8, 10], [13, 10], [13, 3], [18, 3], [18, 8], [5, 8], [5, 4], [19, 4]],
];

export function cellCenter(col: number, row: number): Vec {
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}

export const WAYPOINTS: Vec[] = [];
export const SPAWN: Vec = { x: 0, y: 0 };
export const BASE: Vec = { x: 0, y: 0 };
export const PATH_CELLS: Set<string> = new Set();

export interface Segment {
  a: Vec;
  b: Vec;
  length: number;
}

export const SEGMENTS: Segment[] = [];
export let TOTAL_PATH_LENGTH = 0;
let activeMapLevel = 0;

function computePathCells(): void {
  PATH_CELLS.clear();
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    const a = WAYPOINTS[i];
    const b = WAYPOINTS[i + 1];
    let c = Math.round((a.x - TILE / 2) / TILE);
    let r = Math.round((a.y - TILE / 2) / TILE);
    const endC = Math.round((b.x - TILE / 2) / TILE);
    const endR = Math.round((b.y - TILE / 2) / TILE);
    const dc = Math.sign(endC - c);
    const dr = Math.sign(endR - r);
    PATH_CELLS.add(`${c},${r}`);
    while (c !== endC || r !== endR) {
      c += dc;
      r += dr;
      PATH_CELLS.add(`${c},${r}`);
    }
  }
}

export function setMapLevel(level: number): void {
  const target = Math.min(MAPS.length, Math.max(1, Math.floor(level)));
  if (target === activeMapLevel) return;
  activeMapLevel = target;
  WAYPOINTS.splice(0, WAYPOINTS.length, ...MAPS[target - 1].map(([c, r]) => cellCenter(c, r)));
  SPAWN.x = WAYPOINTS[0].x;
  SPAWN.y = WAYPOINTS[0].y;
  BASE.x = WAYPOINTS[WAYPOINTS.length - 1].x;
  BASE.y = WAYPOINTS[WAYPOINTS.length - 1].y;
  SEGMENTS.splice(0, SEGMENTS.length);
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    const a = WAYPOINTS[i];
    const b = WAYPOINTS[i + 1];
    SEGMENTS.push({ a, b, length: Math.hypot(b.x - a.x, b.y - a.y) });
  }
  TOTAL_PATH_LENGTH = SEGMENTS.reduce((sum, segment) => sum + segment.length, 0);
  computePathCells();
}

export function inBounds(col: number, row: number): boolean {
  return col >= 0 && col < COLS && row >= 0 && row < ROWS;
}

export function isPathCell(col: number, row: number): boolean {
  return PATH_CELLS.has(`${col},${row}`);
}

export function isBuildable(col: number, row: number): boolean {
  return inBounds(col, row) && !isPathCell(col, row);
}

export function positionAtDistance(distance: number): Vec {
  let remaining = distance;
  for (const seg of SEGMENTS) {
    if (remaining <= seg.length) {
      const t = seg.length === 0 ? 0 : remaining / seg.length;
      return {
        x: seg.a.x + (seg.b.x - seg.a.x) * t,
        y: seg.a.y + (seg.b.y - seg.a.y) * t,
      };
    }
    remaining -= seg.length;
  }
  return { ...BASE };
}

setMapLevel(1);
