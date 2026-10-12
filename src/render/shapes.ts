export type ShapeName = "triangle" | "square" | "circle" | "diamond" | "hexagon";

export function polygonPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  rotation = -Math.PI / 2,
): void {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = rotation + (i * Math.PI * 2) / sides;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function traceShape(
  ctx: CanvasRenderingContext2D,
  shape: ShapeName,
  cx: number,
  cy: number,
  radius: number,
): void {
  switch (shape) {
    case "circle":
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      break;
    case "square":
      ctx.beginPath();
      ctx.rect(cx - radius, cy - radius, radius * 2, radius * 2);
      break;
    case "triangle":
      polygonPath(ctx, cx, cy, radius * 1.15, 3);
      break;
    case "diamond":
      polygonPath(ctx, cx, cy, radius * 1.25, 4);
      break;
    case "hexagon":
      polygonPath(ctx, cx, cy, radius * 1.1, 6);
      break;
  }
}
