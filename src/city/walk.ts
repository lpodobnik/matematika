// Walking in the town (story 5.0): where he may stand, and the path from where he is to
// where he tapped, around buildings and the fountain. Pure: the town screen asks for a path
// and moves his figure along it.
//
// The ground is a polygon in town units with holes (ellipses) cut out of it. Paths are found
// on a grid of `cell`-unit squares with A* (eight neighbours), then pulled straight wherever
// the line between two points stays on the ground, so he walks in straight lines, not steps.

export interface Point {
  x: number;
  y: number;
}

export interface Ellipse {
  x: number;
  y: number;
  rx: number;
  ry: number;
}

export interface Ground {
  /** The walkable outline, in order. */
  outline: readonly Point[];
  /** Things standing on it that he walks round. */
  holes: readonly Ellipse[];
  /** The grid's cell size, in town units. */
  cell: number;
  /** The town's size, in town units. */
  width: number;
  height: number;
}

function insidePolygon(p: Point, outline: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i, i += 1) {
    const a = outline[i] as Point;
    const b = outline[j] as Point;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

function insideEllipse(p: Point, e: Ellipse): boolean {
  const dx = (p.x - e.x) / e.rx;
  const dy = (p.y - e.y) / e.ry;
  return dx * dx + dy * dy <= 1;
}

/** Whether he may stand at `p`. */
export function onGround(ground: Ground, p: Point): boolean {
  return insidePolygon(p, ground.outline) && !ground.holes.some((hole) => insideEllipse(p, hole));
}

/** Whether the straight line from `a` to `b` stays on the ground, checked every few units. */
export function clearLine(ground: Ground, a: Point, b: Point): boolean {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const steps = Math.max(1, Math.ceil(length / (ground.cell / 3)));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    if (!onGround(ground, { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })) return false;
  }
  return true;
}

/** The point on the ground nearest `p`, from the grid's cell centres; `p` itself if on it. */
export function nearestOnGround(ground: Ground, p: Point): Point | null {
  if (onGround(ground, p)) return p;
  let best: Point | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  const { cell } = ground;
  for (let y = cell / 2; y < ground.height; y += cell) {
    for (let x = cell / 2; x < ground.width; x += cell) {
      const centre = { x, y };
      const d = Math.hypot(x - p.x, y - p.y);
      if (d < bestDistance && onGround(ground, centre)) {
        best = centre;
        bestDistance = d;
      }
    }
  }
  return best;
}

/**
 * The path from `from` to `to`, as the points to walk through after `from`, ending at `to`
 * (or the ground nearest it). Empty when he is there already; null when no path exists.
 */
export function findPath(ground: Ground, from: Point, to: Point): Point[] | null {
  const goal = nearestOnGround(ground, to);
  const start = nearestOnGround(ground, from);
  if (!goal || !start) return null;
  if (Math.hypot(goal.x - start.x, goal.y - start.y) < 1) return [];
  if (clearLine(ground, start, goal)) return [goal];

  const { cell } = ground;
  const cols = Math.ceil(ground.width / cell);
  const rows = Math.ceil(ground.height / cell);
  const index = (c: number, r: number) => r * cols + c;
  const centre = (i: number): Point => ({
    x: (i % cols) * cell + cell / 2,
    y: Math.floor(i / cols) * cell + cell / 2,
  });
  const cellOf = (p: Point) =>
    index(
      Math.min(cols - 1, Math.max(0, Math.floor(p.x / cell))),
      Math.min(rows - 1, Math.max(0, Math.floor(p.y / cell))),
    );
  const walkable = new Map<number, boolean>();
  const open = (i: number) => {
    let known = walkable.get(i);
    if (known === undefined) {
      known = onGround(ground, centre(i));
      walkable.set(i, known);
    }
    return known;
  };

  const startCell = cellOf(start);
  const goalCell = cellOf(goal);
  const g = new Map<number, number>([[startCell, 0]]);
  const came = new Map<number, number>();
  const frontier: { i: number; f: number }[] = [{ i: startCell, f: 0 }];
  const goalCentre = centre(goalCell);
  const h = (i: number) => {
    const p = centre(i);
    return Math.hypot(p.x - goalCentre.x, p.y - goalCentre.y);
  };
  const closed = new Set<number>();
  let found = false;
  while (frontier.length > 0) {
    let best = 0;
    for (let k = 1; k < frontier.length; k += 1) {
      if ((frontier[k] as { f: number }).f < (frontier[best] as { f: number }).f) best = k;
    }
    const { i } = frontier.splice(best, 1)[0] as { i: number };
    if (i === goalCell) {
      found = true;
      break;
    }
    if (closed.has(i)) continue;
    closed.add(i);
    const c = i % cols;
    const r = Math.floor(i / cols);
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (dr === 0 && dc === 0) continue;
        const nc = c + dc;
        const nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
        const n = index(nc, nr);
        // The start and goal cells count as open, so a point near an edge is reachable.
        if (n !== goalCell && !open(n)) continue;
        // No cutting a corner between two blocked cells.
        if (dr !== 0 && dc !== 0 && (!open(index(c + dc, r)) || !open(index(c, r + dr)))) continue;
        const step = dr !== 0 && dc !== 0 ? Math.SQRT2 * cell : cell;
        const cost = (g.get(i) ?? 0) + step;
        if (cost < (g.get(n) ?? Number.POSITIVE_INFINITY)) {
          g.set(n, cost);
          came.set(n, i);
          frontier.push({ i: n, f: cost + h(n) });
        }
      }
    }
  }
  if (!found) return null;

  const cells: Point[] = [];
  for (let i: number | undefined = goalCell; i !== undefined && i !== startCell; i = came.get(i)) {
    cells.unshift(centre(i));
  }
  const raw = [start, ...cells.slice(0, -1), goal];
  // Pull the path straight: from each point, jump to the farthest point in clear sight.
  const pulled: Point[] = [];
  let at = 0;
  while (at < raw.length - 1) {
    let next = raw.length - 1;
    while (next > at + 1 && !clearLine(ground, raw[at] as Point, raw[next] as Point)) next -= 1;
    pulled.push(raw[next] as Point);
    at = next;
  }
  return pulled;
}
