// Performance overlay: frame-time graph and a breakdown of where time goes each frame.
// Toggle from the dev sheet's Info tab.
import { store } from '../platform/storage.js';
import { world } from '../core/world.js';
import { PSTATS } from '../core/physics/solver.js';
import { timing } from '../core/game.js';
import { mole } from '../core/mole.js';
import { bedrock } from '../core/bedrock.js';
import { rockInfo } from '../core/surface.js';
import { U } from '../config.js';
import { vp } from '../render/view.js';

const perfEl = document.getElementById('perf'), perfList = document.getElementById('perfList'), pcv = document.getElementById('perfCv'), pctx = pcv.getContext('2d');
const perfToggle = document.getElementById('perfToggle');
export const prof = { on: !!store.get('jellystack.perf', false), hist: new Float32Array(150), hi: 0, physMs: 0, logicMs: 0, drawMs: 0,
  frames: 0, sumFrame: 0, sumWork: 0, sumPhys: 0, sumLogic: 0, sumDraw: 0, worst: 0, steps: 0, pairs: 0, touching: 0, lastReport: 0, slow: 0 };
export function setPerf(v) { prof.on = v; perfEl.hidden = !v; perfToggle.checked = v; store.set('jellystack.perf', v); }
perfToggle.addEventListener('change', () => setPerf(perfToggle.checked));
setPerf(prof.on);
function reportPerf(now) {
  const n = Math.max(1, prof.frames), awake = world.pieces.filter(p => !p.asleep).length;
  const rows = [
    ['Frame rate', Math.round(1000 / (prof.sumFrame / n)) + ' fps'],
    ['Frame work', (prof.sumWork / n).toFixed(1) + ' ms'],
    ['Worst frame', prof.worst.toFixed(1) + ' ms'],
    ['Physics', (prof.sumPhys / n).toFixed(1) + ' ms'],
    ['Game logic', (prof.sumLogic / n).toFixed(1) + ' ms'],
    ['Drawing', (prof.sumDraw / n).toFixed(1) + ' ms'],
    ['Physics steps', (prof.steps / n).toFixed(1) + ' per frame'],
    ['Pieces', world.pieces.length + ' (' + awake + ' awake, ' + world.fossils + ' fossil)'],
    ['Bedrock', bedrock.melted ? `${bedrock.melted} pieces melted in, top ${(rockInfo.low / U).toFixed(1)}–${(rockInfo.high / U).toFixed(1)} blocks up` : 'none yet'],
    ['Pair checks', Math.round(prof.pairs / n) + ' per frame'],
    ['Touching pairs', Math.round(prof.touching / n) + ' per frame'],
    ['Slow frames', prof.slow + ' over 20 ms'],
    ['Mole', `sim takes ${Math.round(mole.strain * 100)}% of the time, tired ${Math.round(mole.feel.tired * 100)}%${mole.napping ? ', napping' : ''}`],
  ];
  perfList.innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  Object.assign(prof, { frames: 0, sumFrame: 0, sumWork: 0, sumPhys: 0, sumLogic: 0, sumDraw: 0, steps: 0, pairs: 0, touching: 0 });
  prof.lastReport = now;
}
function drawPerfGraph() {
  const r = pcv.getBoundingClientRect(), w = r.width, h = r.height;
  if (pcv.width !== Math.round(w * vp.dpr)) { pcv.width = Math.round(w * vp.dpr); pcv.height = Math.round(h * vp.dpr); }
  pctx.setTransform(vp.dpr, 0, 0, vp.dpr, 0, 0); pctx.clearRect(0, 0, w, h);
  const max = 33, N = prof.hist.length;
  pctx.strokeStyle = 'rgba(120,110,140,0.5)'; pctx.setLineDash([3, 3]); pctx.lineWidth = 1;
  const y16 = h - 16.7 / max * h; pctx.beginPath(); pctx.moveTo(0, y16); pctx.lineTo(w, y16); pctx.stroke(); pctx.setLineDash([]);
  for (let i = 0; i < N; i++) {
    const v = prof.hist[(prof.hi + i) % N], bh = Math.min(h, v / max * h);
    pctx.fillStyle = v > 16.7 ? '#ff4f86' : '#6fd08a';
    pctx.fillRect(i / N * w, h - bh, w / N + 0.5, bh);
  }
}

  export function recordFrame(t, frameGap, t0, t1, t2, steps) {
  if (prof.on) {
    const work = t2 - t0;
    prof.frames++; prof.sumFrame += frameGap; prof.sumWork += work; prof.sumPhys += timing.physMs; prof.sumLogic += (t1 - t0) - timing.physMs;
    prof.sumDraw += t2 - t1; prof.steps += steps; prof.pairs += PSTATS.pairs; prof.touching += PSTATS.touching;
    prof.worst = Math.max(prof.worst * 0.995, work);
    if (work > 20) prof.slow++;
    prof.hist[prof.hi] = work; prof.hi = (prof.hi + 1) % prof.hist.length;
    if (t - prof.lastReport > 400) reportPerf(t);
    drawPerfGraph();
  }
}
