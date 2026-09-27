// Sadie's mood comes from what she's doing (climbing = happy, pacing = mad, falling = scared...)
// plus blinking and the little notes/steam she gives off.
import { U } from '../../config.js';
import { sadie } from './brain.js';
import { emote, spark } from '../effects.js';

export function updateMood(dt) {
  const c = sadie;
  c.mood = c.scared > 0 ? 'scared' : c.cheer > 0 ? 'excited' : c.pace ? 'mad' : c.state === 'climb' ? 'happy' : c.state === 'wait' ? 'lookup'
    : c.state === 'walk' && c.run > 0.5 ? 'run' : 'neutral';
  c.dustT = (c.dustT || 0) - dt;
  if (c.mood === 'run' && c.dustT <= 0 && c.vy === 0) { // little dust puffs kicked up behind her
    spark(c.x - c.dir * 0.4 * U, c.y + 0.1 * U, -c.dir * (30 + Math.random() * 30), 30 + Math.random() * 30, 2.5 + Math.random() * 2.5, 0.6, 'rgba(210,190,170,0.8)');
    c.dustT = 0.09;
  }
  c.blinkT = (c.blinkT === undefined ? 3 : c.blinkT) - dt;
  if (c.blinkT < -0.12) c.blinkT = 2.5 + Math.random() * 3;
  c.noteT = (c.noteT || 0) - dt;
  if (c.noteT <= 0) {
    if (c.mood === 'happy') { emote(Math.random() < 0.5 ? '\u266A' : '\u266B', '#9a6bff', c.x - c.dir * 0.3 * U, c.y + 1.3 * U, -c.dir * 15, 45); c.noteT = 0.7; }
    else if (c.mood === 'mad') { emote('\u2601', 'rgba(150,140,165,0.9)', c.x + (Math.random() - 0.5) * 0.4 * U, c.y + 1.4 * U, 0, 35); c.noteT = 0.9; }
    else c.noteT = 0.3;
  }
}
