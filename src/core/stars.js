// Stars: fixed spots in the world. They ride the pile up if covered, and back down (never below
// where they started) if the pile falls away.
import { U, W } from '../config.js';
import { world } from './world.js';
import { surfAt } from './surface.js';

export const STARS_DEF = (() => {
  let seed = 90210; const r = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  return [3,3,4,4,5,5,6,6,7,7,8,9,10,11,12,13,14,16,18,20].map(h => [h, 0.03 + r() * 0.94]);
})();

export function makeStars() {
  return STARS_DEF.map(([h, f]) => ({ x: U * 0.8 + f * (W - U * 1.6), y: h * U, y0: h * U, h, got: false, pop: 0, up: 0, down: 0 }));
}

export function updateStars(dt) {
  for (const st of world.stars) {
    st.pop = Math.max(0, st.pop - dt * 3);
    if (st.got) continue;
    // Stars ride the pile: if pieces cover one it floats up to sit on top, and if the pile
    // later drops away it sinks back down with it, but never below where it started.
    // The short delays stop it reacting to a piece just passing through or wobbling.
    const want = Math.max(st.y0, surfAt(st.x) + 0.7 * U);
    st.up = want > st.y + 1 ? st.up + dt : 0;
    st.down = want < st.y - 1 ? st.down + dt : 0;
    if (st.up > 0.5) st.y = Math.min(want, st.y + 4 * U * dt);
    else if (st.down > 0.5) st.y = Math.max(want, st.y - 3 * U * dt);
  }
}
