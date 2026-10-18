// Lily's Big Climb, as plain numbers (no browser): one level, played on the game room's whole back
// wall, laid out like the first stage of the old arcade climbing games. Lily starts at the bottom by
// the bathtub; Marbles sits up top by her pile of things, throwing the things Lily can't stand (bath
// bubbles, hair dryers, vacuum cleaners, nail clippers), which roll down the slanted girders (and now
// and then down a ladder), all the way to the bathtub. Things that land in the tub can stir up a sud, a
// little soap sud with eyes that wanders the girders and climbs the ladders. Two squeaky toy hammers
// hang in the air: jump up to one and for a while Lily can bop whatever comes at her (but can't jump
// or climb while she holds it). Broken ladders can't be climbed (things still come down them).
// Her rubber chicken waits on the perch at the very top: get to it and she's won.
//
// Everything is in the game screen's own dots (W x H, y down), so the drawing (climb-view.js) and the
// numbers agree. Three lives; a bonus counting down; 100 for each thing jumped over, 300 for each one
// bopped, 500 for a sud.

export const W = 160, H = 272;
// the girders, bottom up: from x0 to x1, the top surface at y0 (left end) to y1 (right end). Each
// slopes down towards its open end, where the things rolling along it drop to the one below. The
// bottom one slopes down to the left, to the bathtub.
export const GIRDERS = [
  { x0: 0, x1: 160, y0: 262, y1: 256 },
  { x0: 0, x1: 146, y0: 219, y1: 227 },
  { x0: 14, x1: 160, y0: 191, y1: 183 },
  { x0: 0, x1: 146, y0: 147, y1: 155 },
  { x0: 14, x1: 160, y0: 119, y1: 111 },
  { x0: 0, x1: 146, y0: 75, y1: 83 },      // Marbles' girder
  { x0: 52, x1: 108, y0: 46, y1: 46 },      // the chicken's perch
];
// the ladders: from girder `on` up to the one above, at x. A broken one can't be climbed.
export const LADDERS = [
  { on: 0, x: 126 }, { on: 0, x: 66, broken: true },
  { on: 1, x: 22 }, { on: 1, x: 76 }, { on: 1, x: 120, broken: true },
  { on: 2, x: 54, broken: true }, { on: 2, x: 96 }, { on: 2, x: 138 },
  { on: 3, x: 24 }, { on: 3, x: 76, broken: true }, { on: 3, x: 112 },
  { on: 4, x: 62, broken: true }, { on: 4, x: 134 },
  { on: 5, x: 100 },
];
// the squeaky toy hammers, hanging over girder `on` (jump up to touch one)
export const HAMMERS = [{ on: 1, x: 104 }, { on: 4, x: 30 }];   // (where there's room under the girder above)
export const HAMMER_UP = 15;   // how far over the girder it hangs (its bottom)
export const TUB = { x: 9, w: 18 };   // the bathtub, at the bottom left: things roll into it
export const MARBLES = { x: 26, on: 5 };
export const CHICKEN = { x: 64, on: 6 };
export const KINDS = [
  { name: 'bubbles', speed: 40 },   // a big froth of bath bubbles: slow, bobs along
  { name: 'dryer', speed: 54 },     // a hair dryer (from Marbles' barbershop)
  { name: 'vacuum', speed: 46 },    // a vacuum cleaner
  { name: 'clippers', speed: 64 },  // nail clippers: small and quick
];

export const gy = (g, x) => g.y0 + (g.y1 - g.y0) * (x - g.x0) / (g.x1 - g.x0);
const on = (g, x) => x >= g.x0 && x <= g.x1;
const GRAV = 620, WALK = 36, CLIMB = 26, JUMP = 150, LIVES = 3, BONUS = 5000;
const HAMMER_TIME = 9, FALL = 22, SUD = 15, SUDS = 3;

export function makeClimb(seed = 1) {
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const G = {
    state: 'idle', t: 0, score: 0, high: 0, lives: LIVES, bonus: BONUS, items: [], suds: [], hearts: [],
    lily: null, marbles: { throwing: 0, next: 1.6, mood: 'plain' }, hammers: [], won: false, events: [],
  };
  const fresh = () => {
    G.lily = { x: 36, y: gy(GIRDERS[0], 36), vx: 0, vy: 0, g: 0, face: 1, step: 0, air: false, climb: null, dying: 0, hammer: 0, jumpY: 0 };
    G.items = []; G.suds = []; G.bonus = BONUS; G.bonusT = 0; G.thrown = 0;
    G.hammers = HAMMERS.map(h => ({ ...h, y: gy(GIRDERS[h.on], h.x) - HAMMER_UP, taken: false }));
    G.marbles = { throwing: 0, next: 1.2, mood: 'plain', holding: null };
  };
  fresh();
  G.start = () => { G.state = 'ready'; G.t = 0; G.score = 0; G.lives = LIVES; G.won = false; fresh(); };
  const say = e => G.events.push(e);
  const pop = (x, y, n) => { G.score += n; G.hearts.push({ x, y, t: 0, text: String(n) }); };
  const hurt = () => { if (!G.lily.dying) { G.lily.dying = 1.8; G.lily.hammer = 0; say('ouch'); } };

  function lilyStep(dt, input) {
    const L = G.lily;
    if (L.hammer > 0) L.hammer = Math.max(0, L.hammer - dt);
    // on a ladder: up and down it, nothing else (no jumping off a ladder)
    if (L.climb) {
      const ld = L.climb, lo = gy(GIRDERS[ld.on], ld.x), hi = gy(GIRDERS[ld.on + 1], ld.x);
      const dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
      if (dy) { L.y = Math.max(hi, Math.min(lo, L.y + dy * CLIMB * dt)); L.step += Math.abs(dy) * CLIMB * dt; }
      if (L.y <= hi) { L.climb = null; L.g = ld.on + 1; L.y = hi; }
      else if (L.y >= lo) { L.climb = null; L.g = ld.on; L.y = lo; }
      return;
    }
    if (!L.air) {
      const g = GIRDERS[L.g];
      // onto a ladder (not with a hammer, not a broken one): up one that starts here, or down one that ends here
      if (!L.hammer) {
        const up = input.up && LADDERS.find(l => !l.broken && l.on === L.g && Math.abs(l.x - L.x) < 4);
        const down = !up && input.down && LADDERS.find(l => !l.broken && l.on === L.g - 1 && Math.abs(l.x - L.x) < 4);
        if (up || down) { L.climb = up || down; L.x = L.climb.x; L.y += up ? -1 : 1; return; }
      }
      L.vx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      if (L.vx) L.face = L.vx;
      // (she stops at the sides of the screen and the bathtub; an open end of a girder she walks
      // right off, and falls)
      let nx = Math.max(L.g === 0 ? TUB.x + TUB.w / 2 + 4 : 5, Math.min(W - 5, L.x + L.vx * WALK * dt));
      if (nx !== L.x) L.step += Math.abs(nx - L.x);
      L.x = nx;
      if (!on(g, nx)) { L.air = true; L.vy = 0; L.vx *= WALK; L.jumpY = L.y; return; }
      L.y = gy(g, L.x);
      if (input.jump && !L.hammer) { L.air = true; L.vy = -JUMP; L.vx *= WALK; L.jumpY = L.y; }
      return;
    }
    // in the air: the arc she started with. Off the end of a girder she can fall: too far hurts.
    const py = L.y;
    L.vy += GRAV * dt; L.x = Math.max(5, Math.min(W - 5, L.x + L.vx * dt)); L.y += L.vy * dt;
    // a hammer, hanging there: touched, it's hers
    for (const h of G.hammers) if (!h.taken && Math.abs(h.x - L.x) < 6 && L.y - 13 <= h.y && L.y > h.y - 4) { h.taken = true; L.hammer = HAMMER_TIME; say('hammer'); }
    if (L.vy > 0) for (let i = 0; i < GIRDERS.length; i++) {
      const g = GIRDERS[i]; if (!on(g, L.x)) continue;
      const top = gy(g, L.x);
      if (py <= top + 0.5 && L.y >= top) {
        L.air = false; L.g = i; L.y = top; L.vy = 0; L.vx = 0;
        if (top - L.jumpY > FALL) hurt();
        break;
      }
    }
  }

  // the hammer bops anything close in front of her (or right on top of her)
  const bopped = (x, y) => { const L = G.lily, dx = x - L.x; return L.hammer > 0 && !L.air && Math.abs(y - L.y) < 12 && (Math.abs(dx) < 5 || (Math.sign(dx) === L.face && Math.abs(dx) < 15)); };

  function itemsStep(dt) {
    const L = G.lily;
    for (const it of G.items) {
      it.spin += dt * Math.max(Math.abs(it.vx), 30) / 5;
      if (it.g !== null) {
        const g = GIRDERS[it.g];
        it.x += it.vx * dt;
        // over the top of a ladder: now and then it comes down it, and (like the arcade's barrels) much
        // more often when Lily is somewhere below
        if (it.g > 0) for (const p of LADDERS) if (p.on === it.g - 1 && Math.abs(p.x - it.x) < 1.5 && !it.tried?.includes(p)) { (it.tried ||= []).push(p); if (rnd() < (L.y > it.y + 8 ? 0.5 : 0.2)) { it.g = null; it.vy = 0; it.through = true; it.vx = 0; it.x = p.x; } }
        if (it.g !== null) { if (!on(g, it.x)) { it.g = null; it.vy = 0; } else it.y = gy(g, it.x); }
      } else {
        const py = it.y; it.vy += GRAV * dt; it.y += it.vy * dt; it.x += it.vx * dt;
        for (let i = 0; i < GIRDERS.length; i++) {
          const g = GIRDERS[i]; if (!on(g, it.x)) continue;
          if (it.straight && i > 0) continue;   // (Marbles' first one each time: straight down to the bottom)
          const top = gy(g, it.x);
          if (py <= top + 0.5 && it.y >= top && !(it.through && top <= py + 2)) {
            it.g = i; it.y = top; it.through = false; it.straight = false;
            const dir = g.y1 > g.y0 ? 1 : -1;   // roll towards the girder's low end
            it.vx = dir * it.speed; break;
          }
        }
      }
      // into the bathtub: gone, and it may stir up a sud
      if (it.g === 0 && it.x < TUB.x + TUB.w / 2) { it.gone = true; if (G.suds.length < SUDS && (G.suds.length === 0 || rnd() < 0.35)) { G.suds.push(sud()); say('splash'); } continue; }
      if (L.dying || G.state !== 'play') continue;
      if (bopped(it.x, it.y)) { it.gone = true; pop(it.x, it.y - 14, 300); say('bop'); continue; }
      // jumped over it: 100
      if (L.air && !it.cleared && Math.abs(it.x - L.x) < 6 && L.y < it.y - 9 && L.y > it.y - 40) { it.cleared = true; pop(it.x, it.y - 14, 100); say('hop'); }
      // touching it: ouch
      if (Math.abs(it.x - L.x) < 8 && Math.abs((L.y - 6) - (it.y - 5)) < 9) hurt();
    }
    G.items = G.items.filter(it => !it.gone && it.x > -10 && it.x < W + 10 && it.y < H + 10);
  }

  // a sud: out of the tub, wandering the girders, now and then up or down a ladder, a bit more
  // often towards Lily
  const sud = () => ({ x: TUB.x + TUB.w / 2 + 2, y: gy(GIRDERS[0], TUB.x + TUB.w / 2 + 2) - 12, g: null, vy: -60, dir: 1, climb: null, turn: 1 + rnd() * 2, last: null, t: 0 });
  function sudsStep(dt) {
    const L = G.lily;
    for (const u of G.suds) {
      u.t += dt;
      if (u.g === null) {   // hopping out of the tub
        u.vy += GRAV * 0.5 * dt; u.y += u.vy * dt; u.x += 10 * dt;
        const top = gy(GIRDERS[0], u.x); if (u.vy > 0 && u.y >= top) { u.g = 0; u.y = top; }
        continue;
      }
      if (u.climb) {
        const l = u.climb, lo = gy(GIRDERS[l.on], l.x), hi = gy(GIRDERS[l.on + 1], l.x);
        u.y += u.climbDir * SUD * 0.7 * dt;
        if (u.y <= hi) { u.climb = null; u.g = l.on + 1; u.y = hi; } else if (u.y >= lo) { u.climb = null; u.g = l.on; u.y = lo; }
      } else {
        const g = GIRDERS[u.g];
        if ((u.turn -= dt) <= 0) { u.turn = 1 + rnd() * 2.5; u.dir = rnd() < 0.6 && L.g === u.g ? Math.sign(L.x - u.x) || 1 : rnd() < 0.5 ? -1 : 1; }
        u.x += u.dir * SUD * dt;
        const lo = Math.max(g.x0 + 4, u.g === 0 ? TUB.x + TUB.w / 2 + 2 : 0), hi = g.x1 - 4;
        if (u.x < lo || u.x > hi) { u.x = Math.max(lo, Math.min(hi, u.x)); u.dir *= -1; }
        u.y = gy(g, u.x);
        // a ladder here: up it (more likely if Lily's higher), or down it
        const l = LADDERS.find(l => Math.abs(l.x - u.x) < 0.6 && (l.on === u.g || l.on === u.g - 1));
        if (l && l !== u.last) {
          u.last = l;
          const upward = l.on === u.g;
          if (rnd() < (upward ? (L.g > u.g ? 0.5 : 0.25) : (L.g < u.g ? 0.4 : 0.12))) { u.climb = l; u.climbDir = upward ? -1 : 1; u.x = l.x; }
        } else if (!l) u.last = null;
      }
      if (L.dying || G.state !== 'play') continue;
      if (bopped(u.x, u.y)) { u.gone = true; pop(u.x, u.y - 14, 500); say('bop'); continue; }
      if (L.air && !u.cleared && Math.abs(u.x - L.x) < 6 && L.y < u.y - 8 && L.y > u.y - 40) { u.cleared = true; pop(u.x, u.y - 14, 100); say('hop'); }
      else if (!L.air) u.cleared = false;
      if (Math.abs(u.x - L.x) < 7 && Math.abs((L.y - 6) - (u.y - 4)) < 8) hurt();
    }
    G.suds = G.suds.filter(u => !u.gone);
  }

  // one frame. input: { left, right, up, down, jump } (jump: pressed since the last frame)
  G.step = (dt, input) => {
    G.events.length = 0;
    G.t += dt;
    for (const h of G.hearts) h.t += dt;
    G.hearts = G.hearts.filter(h => h.t < 1);
    if (G.state === 'idle' || G.state === 'over' || G.state === 'done') return G;
    if (G.state === 'ready') { if (G.t > 1.6) { G.state = 'play'; G.t = 0; } return G; }
    const L = G.lily;
    if (G.state === 'won') {
      if (G.t > 4.2) { G.state = 'done'; G.t = 0; say('end'); }
      return G;
    }
    if (L.dying) {
      L.dying -= dt;
      if (L.dying <= 0) {
        L.dying = 0; G.lives--;
        if (G.lives > 0) { fresh(); G.state = 'ready'; G.t = 0; }
        else { G.high = Math.max(G.high, G.score); G.state = 'over'; G.t = 0; say('end'); }
      }
      return G;
    }
    lilyStep(dt, input);
    // Marbles: a wind-up, then she lets it go: rolling right along her girder, or (the first one each
    // time) dropped straight down to the bottom
    const M = G.marbles;
    if (M.throwing > 0) {
      M.throwing -= dt;
      if (M.throwing <= 0) {
        const k = M.holding, g = GIRDERS[MARBLES.on], first = G.thrown++ === 0;
        const x = MARBLES.x + (first ? 8 : 10);
        G.items.push({ kind: k.name, speed: k.speed * (0.9 + rnd() * 0.25), x, y: gy(g, x), vx: first ? 0 : k.speed, vy: 0, g: first ? null : MARBLES.on, straight: first, spin: 0 });
        M.holding = null; M.mood = 'grin';
      }
    } else if ((M.next -= dt) <= 0) {
      M.holding = KINDS[Math.floor(rnd() * KINDS.length)]; M.throwing = 0.45; M.next = 1.0 + rnd() * 1.0; M.mood = 'plain'; say('throw');
    }
    itemsStep(dt);
    sudsStep(dt);
    // the bonus counts down; at nothing, she's out of time
    G.bonusT += dt;
    if (G.bonusT >= 2) { G.bonusT -= 2; G.bonus = Math.max(0, G.bonus - 100); if (!G.bonus) hurt(); }
    // up on the perch, at the chicken!
    if (!L.air && !L.dying && L.g === CHICKEN.on && Math.abs(L.x - CHICKEN.x) < 10) {
      G.state = 'won'; G.t = 0; G.won = true; G.bonusWon = G.bonus; G.score += G.bonus; G.high = Math.max(G.high, G.score);
      G.items = []; G.suds = []; L.hammer = 0; M.mood = 'cross'; say('win');
    }
    return G;
  };
  return G;
}
