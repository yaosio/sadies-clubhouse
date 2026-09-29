// Brickbuster '96's game, with no screen: the yarn ball, the paddle, the bricks and the cracks in
// the glass. Plain numbers, in metres, so the tests can play it in Node. room.js draws it.
//
// It's Breakout, except missing isn't the end: the ball goes past the paddle, hits the bottom of the
// glass, cracks it and bounces back up. Hitting the top of the glass (once you've knocked a way
// through the bricks) cracks it too. Three cracks at the top or three at the bottom and the glass
// is ready to go (breaking it is next). Up at the top the ball rattles between the glass and the
// bricks, so only its first hit there cracks it: the next crack at the top waits until the ball's
// been back to the paddle.
//
// x runs 0 to W across the glass, y 0 to H up it.

export const W = 4.2, H = 6.6;                  // the glass
export const R = 0.16;                          // the yarn ball's radius
export const PADDLE = { w: 1.3, h: 0.46, y: 0.7, speed: 6 };   // y: its middle
export const COLS = 10, ROWS = 8, CRACKS = 3;
const BRICK = { w: 0.4, h: 0.24, gap: 0.04, top: H - 1.25 };    // top: the top row's top edge, with room above to break through into
export const SPEED = { start: 4.2, step: 0.04, most: 6.4 };      // metres a second; faster with every brick
const ANGLE = 1.05;                             // how far off straight up the paddle can send it (radians, at its very end)

export function makeGame(seed = 1) {
  const g = {
    ball: { x: W / 2, y: 0, vx: 0, vy: 0, spin: 0 },
    paddle: W / 2,
    bricks: [],
    cracks: { top: [], bottom: [] },   // each { x, seed }: where it hit, and how its lines run
    score: 0, speed: SPEED.start, serving: true, seed,
    topReady: true,                    // whether the top can crack again (not since the ball was last on the paddle)
  };
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    g.bricks.push({ row: r, col: c, alive: true,
      x: 0.1 + BRICK.gap / 2 + c * (BRICK.w), y: BRICK.top - (r + 1) * (BRICK.h + BRICK.gap) + BRICK.gap / 2,
      w: BRICK.w - BRICK.gap, h: BRICK.h });
  }
  serve(g);
  return g;
}
export const brickPoints = b => (ROWS - b.row) * 10;
export function random(g) { g.seed = (g.seed * 16807) % 2147483647; return g.seed / 2147483647; }

// the ball sits on the paddle until it's sent off
export function serve(g) {
  g.serving = true; g.speed = Math.max(SPEED.start, g.speed - 0.4);
  Object.assign(g.ball, { x: g.paddle, y: PADDLE.y + PADDLE.h / 2 + R, vx: 0, vy: 0 });
}
export function launch(g) {
  if (!g.serving) return;
  const a = (0.25 + random(g) * 0.35) * (random(g) < 0.5 ? -1 : 1);
  g.serving = false; g.ball.vx = Math.sin(a) * g.speed; g.ball.vy = Math.cos(a) * g.speed;
}

// the paddle: to a spot (dragging, the mouse), or pushed along (the keys: -1 to 1)
const half = PADDLE.w / 2;
export function movePaddle(g, x) {
  g.paddle = Math.max(half, Math.min(W - half, x));
  if (g.serving) g.ball.x = g.paddle;
}
export const pushPaddle = (g, v, dt) => movePaddle(g, g.paddle + v * PADDLE.speed * dt);

// Runs the game on by dt seconds. Returns what happened, for the sounds and faces:
// { type: 'paddle', off }, { type: 'brick', brick }, { type: 'wall' }, { type: 'crack', side, level, x },
// { type: 'glass', side } (a side that's already cracked all it can), { type: 'cleared' }.
export function step(g, dt) {
  const out = [];
  if (g.serving) return out;
  const n = Math.max(1, Math.ceil(dt * 240));
  for (let i = 0; i < n; i++) sub(g, dt / n, out);
  return out;
}

function sub(g, dt, out) {
  const b = g.ball;
  b.x += b.vx * dt; b.y += b.vy * dt;
  b.spin += Math.hypot(b.vx, b.vy) * dt / R;
  // the sides of the glass
  if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx); out.push({ type: 'wall' }); }
  if (b.x > W - R) { b.x = W - R; b.vx = -Math.abs(b.vx); out.push({ type: 'wall' }); }
  // the top and the bottom crack
  if (b.y > H - R) { b.y = H - R; b.vy = -Math.abs(b.vy); hitGlass(g, 'top', out); }
  if (b.y < R) { b.y = R; b.vy = Math.abs(b.vy); hitGlass(g, 'bottom', out); }
  // the paddle: only on the way down, so a ball coming back up from the bottom goes through it
  const top = PADDLE.y + PADDLE.h / 2;
  if (b.vy < 0 && b.y - R < top && b.y > PADDLE.y - PADDLE.h / 2 && Math.abs(b.x - g.paddle) < half + R * 0.7) {
    const off = Math.max(-1, Math.min(1, (b.x - g.paddle) / half)), a = off * ANGLE;
    b.vx = Math.sin(a) * g.speed; b.vy = Math.cos(a) * g.speed; b.y = top + R;
    g.topReady = true;
    out.push({ type: 'paddle', off });
  }
  // the bricks: one at a time, bouncing off whichever face it went in furthest from
  for (const k of g.bricks) {
    if (!k.alive) continue;
    const nx = Math.max(k.x, Math.min(k.x + k.w, b.x)), ny = Math.max(k.y, Math.min(k.y + k.h, b.y));
    if ((b.x - nx) ** 2 + (b.y - ny) ** 2 >= R * R) continue;
    k.alive = false; g.score += brickPoints(k);
    g.speed = Math.min(SPEED.most, g.speed + SPEED.step);
    const px = Math.min(b.x + R - k.x, k.x + k.w - (b.x - R)), py = Math.min(b.y + R - k.y, k.y + k.h - (b.y - R));
    if (px < py) b.vx = b.x < k.x + k.w / 2 ? -Math.abs(b.vx) : Math.abs(b.vx);
    else b.vy = b.y < k.y + k.h / 2 ? -Math.abs(b.vy) : Math.abs(b.vy);
    const s = Math.hypot(b.vx, b.vy); b.vx *= g.speed / s; b.vy *= g.speed / s;
    out.push({ type: 'brick', brick: k });
    if (g.bricks.every(k => !k.alive)) { for (const k of g.bricks) k.alive = true; out.push({ type: 'cleared' }); }
    break;
  }
}

function hitGlass(g, side, out) {
  const list = g.cracks[side];
  if (list.length >= CRACKS || (side === 'top' && !g.topReady)) { out.push({ type: 'glass', side }); return; }
  if (side === 'top') g.topReady = false;
  list.push({ x: g.ball.x, seed: 1 + Math.floor(random(g) * 99999) });
  out.push({ type: 'crack', side, level: list.length, x: g.ball.x });
}

// what's kept between visits: which bricks are gone, the cracks and the score (the ball starts on the paddle)
export function save(g) {
  return { bricks: g.bricks.map(k => k.alive ? 1 : 0).join(''), cracks: g.cracks, score: g.score };
}
export function load(g, s) {
  if (!s || typeof s !== 'object') return g;
  if (typeof s.bricks === 'string' && s.bricks.length === g.bricks.length) g.bricks.forEach((k, i) => { k.alive = s.bricks[i] === '1'; });
  if (g.bricks.every(k => !k.alive)) for (const k of g.bricks) k.alive = true;
  for (const side of ['top', 'bottom']) {
    const l = s.cracks?.[side];
    if (Array.isArray(l)) g.cracks[side] = l.filter(c => c && isFinite(c.x) && isFinite(c.seed)).slice(0, CRACKS).map(c => ({ x: +c.x, seed: +c.seed }));
  }
  if (isFinite(s.score)) g.score = Math.max(0, Math.floor(s.score));
  return g;
}
