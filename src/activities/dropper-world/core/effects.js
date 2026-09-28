// Little visual effects the simulation spawns (they live in the world so they pause with it).
import { world } from './world.js';

export function emote(glyph, color, x, y, vx, vy) { world.emotes.push({ glyph, color, x, y, vx, vy, life: 1 }); }
export function spark(x, y, vx, vy, r, life, c) { world.particles.push({ x, y, vx, vy, r, life, c }); }
export function updateEffects(dt) {
  for (const q of world.particles) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy -= 200 * dt; q.life -= dt * 1.2; }
  world.particles = world.particles.filter(q => q.life > 0);
  for (const e of world.emotes) { e.x += e.vx * dt; e.y += e.vy * dt; e.life -= dt * 0.8; }
  world.emotes = world.emotes.filter(e => e.life > 0);
}
