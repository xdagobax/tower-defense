export const TILE = 40;
export const COLS = 20;
export const ROWS = 12;
export const FIELD_W = COLS * TILE;
export const FIELD_H = ROWS * TILE;

export interface Vec {
  x: number;
  y: number;
}

const WAYPOINTS_GRID: ReadonlyArray<readonly [number, number]> = [
  [0, 2],
  [5, 2],
  [5, 9],
  [14, 9],
  [14, 3],
  [19, 3],
];

export function cellCenter(col: number, row: number): Vec {
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}

export const WAYPOINTS: Vec[] = WAYPOINTS_GRID.map(([c, r]) => cellCenter(c, r));
export const SPAWN: Vec = WAYPOINTS[0];
export const BASE: Vec = WAYPOINTS[WAYPOINTS.length - 1];

function computePathCells(): Set<string> {
  const cells = new Set<string>();
  for (let i = 0; i < WAYPOINTS_GRID.length - 1; i++) {
    const [c0, r0] = WAYPOINTS_GRID[i];
    const [c1, r1] = WAYPOINTS_GRID[i + 1];
    const dc = Math.sign(c1 - c0);
    const dr = Math.sign(r1 - r0);
    let c = c0;
    let r = r0;
    cells.add(`${c},${r}`);
    while (c !== c1 || r !== r1) {
      c += dc;
      r += dr;
      cells.add(`${c},${r}`);
    }
  }
  return cells;
}

export const PATH_CELLS: Set<string> = computePathCells();

export function inBounds(col: number, row: number): boolean {
  return col >= 0 && col < COLS && row >= 0 && row < ROWS;
}

export function isPathCell(col: number, row: number): boolean {
  return PATH_CELLS.has(`${col},${row}`);
}

export function isBuildable(col: number, row: number): boolean {
  return inBounds(col, row) && !isPathCell(col, row);
}

export interface Segment {
  a: Vec;
  b: Vec;
  length: number;
}

function computeSegments(): Segment[] {
  const segs: Segment[] = [];
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    const a = WAYPOINTS[i];
    const b = WAYPOINTS[i + 1];
    segs.push({ a, b, length: Math.hypot(b.x - a.x, b.y - a.y) });
  }
  return segs;
}

export const SEGMENTS: Segment[] = computeSegments();
export const TOTAL_PATH_LENGTH: number = SEGMENTS.reduce((sum, s) => sum + s.length, 0);

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
  const last = WAYPOINTS[WAYPOINTS.length - 1];
  return { x: last.x, y: last.y };
}
