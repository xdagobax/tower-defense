export interface LoopHandlers {
  update(deltaSeconds: number): void;
  render(alpha: number): void;
}

const FIXED_STEP = 1 / 60;
const MAX_FRAME = 0.25;

export function createLoop(handlers: LoopHandlers): { start(): void; stop(): void } {
  let running = false;
  let last = 0;
  let accumulator = 0;
  let rafId = 0;

  const frame = (now: number): void => {
    if (!running) return;
    if (last === 0) last = now;
    let frameTime = (now - last) / 1000;
    last = now;
    if (frameTime > MAX_FRAME) frameTime = MAX_FRAME;
    accumulator += frameTime;

    while (accumulator >= FIXED_STEP) {
      handlers.update(FIXED_STEP);
      accumulator -= FIXED_STEP;
    }

    handlers.render(accumulator / FIXED_STEP);
    rafId = requestAnimationFrame(frame);
  };

  return {
    start(): void {
      if (running) return;
      running = true;
      last = 0;
      accumulator = 0;
      rafId = requestAnimationFrame(frame);
    },
    stop(): void {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    },
  };
}
