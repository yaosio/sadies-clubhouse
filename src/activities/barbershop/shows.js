// The little segments the outfits have, each a function of how long it's been running (`t`, seconds):
// it puts Sadie, Marbles and the props where they are at that moment (so nothing is left to clean up
// but the props going back out of sight: the room does that when it ends), and starts each sound once.
// The room (room.js) hands every show the same `c`:
//   c.S: the middle of the stage; c.P: the props (props.js); c.sadie, c.marbles: the two sprites;
//   c.at(dx, dy, dz): puts Sadie that far from the middle of the stage; c.marblesAt(x, y, z);
//   c.say(text, who): a speech bubble over 'sadie' or 'marbles'; c.once(key, fn): runs fn the first time;
//   c.play(name): a sound; c.mood('plain' | 'grin' | 'wink'): Marbles' face; c.nap(shut): Sadie's eyes.
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = k => k * k * (3 - 2 * k);

export const SHOWS = {
  // the pop star: eight meows to a tune, notes rising out of the spotlight
  sing: { len: 6.5, run(c, t) {
    const { P, S } = c;
    P.mic.visible = P.beam.visible = true;
    P.mic.position.set(S.x + 0.7, S.y, S.z + 0.15); P.beam.position.set(S.x, 1.95, S.z);
    c.once('song', () => { c.play('song'); c.say('MEOW MEOW MEOOOW', 'sadie'); });
    const beat = Math.floor(t / 0.52);
    c.at(0, beat < 8 && (t % 0.52) < 0.2 ? 0.05 : 0, 0);
    P.notes.forEach((n, i) => {
      const age = t - i * 0.52 - 0.1;
      n.visible = age > 0 && age < 2.4;
      if (n.visible) n.position.set(S.x - 0.35 + (i % 3) * 0.3 + Math.sin(age * 2 + i) * 0.08, S.y + 0.9 + age * 0.45, S.z + 0.1);
    });
  } },

  // the construction worker: a cat tower, one block at a time, until it falls over
  build: { len: 7.8, run(c, t) {
    const { P, S } = c;
    c.at(0.55 + (t > 5.2 ? 0.5 * clamp((t - 5.2) * 2) : 0), 0, 0.1);
    c.say(t < 5.2 ? 'ONE MORE FLOOR...' : t < 6.2 ? '' : 'FWUMP.', 'sadie');
    c.once('tumble', t > 5.2, () => c.play('tumble'));
    const fall = Math.max(0, t - 5.2);
    P.blocks.forEach((b, i) => {
      const born = i * 0.9, k = clamp((t - born) / 0.25);
      b.visible = t >= born;
      b.scale.setScalar(0.3 + 0.7 * ease(k));
      let x = S.x - 0.8, y = S.y + 0.13 + i * 0.26, rz = 0;
      if (t > 3.8 && !fall) rz = Math.sin(t * 11) * 0.015 * (i + 1);
      if (fall) {
        x += (i - 1) * fall * 0.45 + i * fall * fall * 0.25; rz = fall * (i + 1) * 0.45;
        y = Math.max(S.y + 0.13 + (i % 2) * 0.02, y - fall * fall * (1.6 + i * 0.5));
      }
      b.position.set(x, y, S.z + (i % 2 ? 0.06 : -0.06) * Math.min(1, fall * 3));
      b.rotation.set(0, i * 0.3 * Math.min(1, fall), rz);
    });
  } },

  // the ball gown: a waltz, with sparkles
  dance: { len: 8, run(c, t) {
    const { P, S } = c;
    const beat = t / 0.666;
    c.once('waltz', () => { c.play('waltz'); c.say('LA LA LA', 'sadie'); });
    c.at(Math.sin(beat * Math.PI / 1.5) * 0.7, Math.abs(Math.sin(beat * Math.PI)) * 0.07, 0);
    c.tilt(Math.sin(beat * Math.PI / 1.5) * 0.1);
    P.sparks.forEach((s, i) => {
      const a = t / 0.9 + i * 1.05;
      s.visible = true; s.position.set(S.x + Math.cos(a) * 1.2, S.y + 0.6 + Math.sin(a * 1.3) * 0.5 + 0.3, S.z + Math.sin(a) * 0.4);
    });
  } },

  // the magician: a cape over Sadie, poof, she's gone, and Marbles pops out of the hat
  magic: { len: 8, run(c, t) {
    const { P, S } = c;
    P.hat.visible = true; P.hat.position.set(S.x - 1.1, S.y, S.z);
    c.once('say', () => c.say('AND NOW... I VANISH', 'sadie'));
    c.at(0, 0, 0);
    // the cape rises over her, then a poof (2.0 to 3.0)
    P.cape.visible = t > 2 && t < 3.5;
    if (P.cape.visible) { P.cape.position.set(S.x, S.y - 0.02, S.z + 0.02); P.cape.scale.set(1, t < 3 ? ease(clamp(t - 2)) * 1.1 : Math.max(0.1, 1.1 - (t - 3) * 3), 1); }
    c.once('poof1', t > 3, () => { c.play('poof'); puff(c, S.x, S.y + 0.3, S.z, 3); });
    c.sadieShown(!(t > 3 && t < 7));
    // Marbles pops out of the hat (5.2 on)
    c.once('pop', t > 5.2, () => { c.play('poof'); puff(c, S.x - 1.1, S.y + 0.9, S.z, 5.2); c.say('TA-DA!', 'marbles'); });
    if (t > 5.2) { c.marblesAt(S.x - 1.1, S.y + 0.55 + 0.25 * ease(clamp((t - 5.2) / 0.6)), S.z + 0.05); c.marblesScale(0.25 + 0.75 * ease(clamp((t - 5.2) / 0.5))); }
    c.once('back', t > 7, () => { c.play('poof'); puff(c, S.x, S.y + 0.3, S.z, 7); });
    puffs(c, t);
  } },

  // the superhero: a leap, a flight across the stage, a landing in a box
  fly: { len: 7, run(c, t) {
    const { P, S } = c;
    P.box.visible = true; P.box.position.set(S.x + 1.0, S.y, S.z + 0.1);
    c.once('say', () => c.say('TO THE SKIES!', 'sadie'));
    const bx = 1.0, top = 2.35;
    let dx = 0, dy = 0;
    if (t < 1) dy = -0.04 * t;
    else if (t < 2.2) { const k = (t - 1) / 1.2; dy = top * k * k; dx = bx * 0.25 * k; c.once('whoosh', () => c.play('whoosh')); }
    else if (t < 3.6) { dy = top; dx = bx * (0.25 + 0.75 * ease((t - 2.2) / 1.4)) - 0.3 * Math.sin(ease((t - 2.2) / 1.4) * Math.PI); }
    else { const k = clamp((t - 3.6) / 0.8); dy = top + (0.12 - top) * k * k; dx = bx; }
    c.at(dx, dy, 0.1);
    c.once('thud', t > 4.4, () => { c.play('thud'); c.say('IF I FITS...', 'sadie'); });
  } },

  // the detective: she sniffs along the stage, finds a clue, and Marbles with her tuna
  sleuth: { len: 8, run(c, t) {
    const { P, S } = c;
    const x = Math.min(0.9, t * 0.25 + Math.sin(t * 3) * 0.04 * (t < 4.4 ? 1 : 0)), found = t > 4.4;
    c.at(x - 0.5, 0, 0.15);
    c.once('say', () => c.say('HMM.', 'sadie'));
    P.glass.visible = true; P.glass.position.set(S.x + x - 0.5 + 0.5, S.y + 0.22 + Math.sin(t * 2) * 0.03, S.z + 0.2);
    c.once('found', found, () => { c.play('aha'); c.say('A CLUE!', 'sadie'); });
    P.bang.visible = found && t < 6.5; if (P.bang.visible) P.bang.position.set(S.x + x - 0.5, S.y + 1.25, S.z + 0.15);
    c.once('marbles', t > 5.2, () => { c.say('WHAT TUNA?', 'marbles'); puff(c, S.x + 1.6, S.y + 0.4, S.z - 0.7, 5.2); c.play('poof'); });
    if (t > 5.2) { c.marblesAt(S.x + 1.6, S.y, S.z - 0.7); c.mood('grin'); P.tuna.visible = true; P.tuna.position.set(S.x + 1.35, S.y + 0.45, S.z - 0.55); }
    puffs(c, t);
  } },

  // pajamas: she curls up and falls asleep, Zs floating up
  sleep: { len: 6, run(c, t) {
    const { P, S } = c;
    c.at(0, 0, 0);
    c.once('say', () => c.say('ZZZ', 'sadie'));
    c.nap(t > 0.8);
    P.zs.forEach((z, i) => {
      const age = (t + i * 0.7) % 2.1;
      z.visible = t > 1; z.position.set(S.x + 0.3 + age * 0.15, S.y + 0.85 + age * 0.35, S.z + 0.1);
      z.scale.setScalar(0.6 + age * 0.3);
    });
  } },
};

// puffs of smoke: one starts at a place and grows and thins away (about 0.6 s), as part of a show's run
function puff(c, x, y, z, at) { (c.puffsList ||= []).push({ x, y, z, at }); }
function puffs(c, t) {
  const p = c.P.puff, list = c.puffsList || [];
  let on = false;
  for (const q of list) {
    const age = t - q.at;
    if (age >= 0 && age < 0.6) { on = true; p.position.set(q.x, q.y - 0.3, q.z); p.scale.setScalar(0.4 + age * 2); p.material.uniforms.uFade.value = clamp((age - 0.25) / 0.35); }
  }
  p.visible = on;
}
