// The main theme's instruments, played live by the browser's own oscillators (nothing is stored, so
// a tune that never repeats costs nothing to keep): a 90s FM electric piano, a music box, a soft
// flute, a marimba, vibes, a harp and a round bass. Each note starts softly (never a click) and dies
// away by itself; the flute, the only one that holds, is kept short by the composer.
//
// SHAPES are the numbers (the tests read them): how fast each comes in (`attack`, s), how fast it
// dies away (`decay`: seconds to fall to a third), and how loud it is next to the others (`gain`).
import { hz } from '../../shared/retro.js';
export const SHAPES = {
  ep: { attack: 0.012, decay: 1.1, gain: 0.5 },
  box: { attack: 0.008, decay: 0.75, gain: 0.42 },
  flute: { attack: 0.08, decay: 6, gain: 0.34 },
  marimba: { attack: 0.008, decay: 0.38, gain: 0.6 },
  vibes: { attack: 0.01, decay: 1.4, gain: 0.34 },
  harp: { attack: 0.008, decay: 0.7, gain: 0.5 },
  bass: { attack: 0.02, decay: 1.2, gain: 0.62 },
};
export const RELEASE = 0.12;   // how fast a note fades out once it's let go (to a third, s)
// how much of each goes to the echo, and where it sits left to right
const WET = { ep: 0.35, box: 0.5, flute: 0.4, marimba: 0.35, vibes: 0.45, harp: 0.4, bass: 0.05 };
const PAN = { ep: 0, box: 0.25, flute: -0.2, marimba: 0.2, vibes: -0.25, harp: -0.3, bass: 0 };


// Play one note: { midi, len, voice, vel } starting at `when` (the browser's clock), into `dry` and
// `wet` (the echo). Everything it makes is let go when it stops.
export function playNote(ctx, dry, wet, n, when) {
  const s = SHAPES[n.voice] || SHAPES.ep, f = hz(n.midi), end = when + n.len, stop = end + RELEASE * 6;
  const amp = ctx.createGain(), peak = Math.max(0.0001, n.vel * s.gain);
  amp.gain.setValueAtTime(0, when);
  amp.gain.linearRampToValueAtTime(peak, when + s.attack);
  if (n.voice === 'ep') {   // (a quick drop from the hammer, then the long ring)
    amp.gain.setTargetAtTime(peak * 0.45, when + s.attack, 0.18);
    amp.gain.setTargetAtTime(0, when + 0.35, s.decay);
  } else if (n.voice === 'flute') amp.gain.setTargetAtTime(peak * 0.8, when + s.attack, 0.4);
  else amp.gain.setTargetAtTime(0, when + s.attack, s.decay);
  amp.gain.setTargetAtTime(0, end, RELEASE);
  let out = amp;
  if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = PAN[n.voice] || 0; amp.connect(p); out = p; }
  out.connect(dry);
  if (WET[n.voice]) { const w = ctx.createGain(); w.gain.value = WET[n.voice]; out.connect(w); w.connect(wet); }

  const oscs = [];
  const osc = (type, freq, into, gain = 1) => {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq;
    if (gain === 1) o.connect(into); else { const g = ctx.createGain(); g.gain.value = gain; o.connect(g); g.connect(into); }
    oscs.push(o); return o;
  };
  // FM: a modulator bending the pitch of the carrier, its depth falling away (bright, then mellow)
  const fm = (carrier, ratio, from, to, tau) => {
    const g = ctx.createGain(), depth = f * ratio;
    g.gain.setValueAtTime(depth * from, when); g.gain.setTargetAtTime(depth * to, when + 0.005, tau);
    osc('sine', f * ratio, g); g.connect(carrier.frequency);
  };
  switch (n.voice) {
    case 'ep': { const c = osc('sine', f, amp); fm(c, 1, 1.4, 0.25, 0.35); osc('sine', f * 2, amp, 0.08); break; }
    case 'box': { const c = osc('sine', f, amp); fm(c, 4, 0.7, 0, 0.12); break; }
    case 'vibes': { const c = osc('sine', f, amp); fm(c, 3, 0.35, 0, 0.3); osc('sine', f * 4, amp, 0.05); break; }
    case 'marimba': {
      osc('sine', f, amp);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.35, when); g.gain.setTargetAtTime(0, when, 0.04); osc('sine', f * 4, g); g.connect(amp);
      break;
    }
    case 'flute': {
      const c = osc('sine', f, amp); osc('triangle', f * 2, amp, 0.06);
      // a gentle vibrato that creeps in after a moment
      const lfo = ctx.createOscillator(), depth = ctx.createGain(); lfo.frequency.value = 4.8;
      depth.gain.setValueAtTime(0, when); depth.gain.linearRampToValueAtTime(f * 0.006, when + 0.6);
      lfo.connect(depth); depth.connect(c.frequency); oscs.push(lfo);
      break;
    }
    case 'harp': {
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(3200, when); lp.frequency.setTargetAtTime(900, when, 0.3); lp.connect(amp);
      osc('triangle', f, lp);
      break;
    }
    case 'bass': {
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.connect(amp);
      osc('triangle', f, lp, 0.6); osc('sine', f, amp);
      break;
    }
  }
  for (const o of oscs) { o.start(when); o.stop(stop); }
  oscs[0].onended = () => { try { amp.disconnect(); out.disconnect(); } catch {} };
}

// The room the notes play in: a soft echo (dulled more each time round), plus a short one for space
export function makeEcho(ctx, into, beat = 0.8) {
  const input = ctx.createGain(); input.gain.value = 0.5;
  const d = ctx.createDelay(2), fb = ctx.createGain(), lp = ctx.createBiquadFilter();
  d.delayTime.value = Math.min(1.5, beat * 0.75); fb.gain.value = 0.34; lp.type = 'lowpass'; lp.frequency.value = 1900;
  input.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(into);
  const d2 = ctx.createDelay(1), fb2 = ctx.createGain(), lp2 = ctx.createBiquadFilter();
  d2.delayTime.value = 0.13; fb2.gain.value = 0.25; lp2.type = 'lowpass'; lp2.frequency.value = 2600;
  input.connect(d2); d2.connect(lp2); lp2.connect(fb2); fb2.connect(d2);
  const g2 = ctx.createGain(); g2.gain.value = 0.5; lp2.connect(g2); g2.connect(into);
  return { input, setBeat: b => d.delayTime.setTargetAtTime(Math.min(1.5, b * 0.75), ctx.currentTime, 0.5) };
}
