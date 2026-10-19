// The live stats strip (docs/clubhouse/world/speed-readout.md): a little box that stays on screen while you
// walk about, switched on from the pause menu (or the P key on a computer). Compact it is one line of
// words and a bar graph of the last frames; tap it for the full list. `makeLive` only does the sums (so a
// headless check can run it with fake frames); `liveBox` shows them.
//
// Claude's numbers (changeable): the graph is of each frame's length against the screen's own speed (the
// quickest quarter of recent frames, so a 144 Hz phone and a 60 Hz one both read right), a bar goes red
// at 1.5 times that; a frame over 50 ms is a "hitch" and is kept; the words refresh 2 or 3 times a second.
//
// The log (SAVE LOG in the pause menu): while the strip is on, every frame is also written down as one line
// (time, frame length, our work, drawing, the graphics chip's own time where the phone will say, calls,
// doorways, place, whether a room was built, page memory), up to the last LOG_MAX frames, for sending in
// to be read. Claude's number (changeable): 20000 frames is about 3 minutes at 120 a second.
export const BARS = 100, SHOW_EVERY = 400, HITCH_MS = 50, RED_AT = 1.5, LOG_MAX = 20000;

export function makeLive() {
  let gaps = [], win = fresh(), shown = null, hitch = null, built = -1, here = '', log = [], prevHeap = 0;
  const places = new Map();
  function fresh() { return { n: 0, gap: 0, work: 0, draw: 0, calls: 0, main: 0, tris: 0, doors: 0 }; }
  return {
    // one frame: its length, how long our work took, the drawing part of that, draw calls (all, and just the room's own
    // view), triangles, doorways drawn through, the place you're in and how many rooms are built
    add(s) {
      gaps.push(s.gap); if (gaps.length > BARS) gaps.shift();
      win.n++; win.gap += s.gap; win.work += s.work; win.draw += s.draw; win.calls += s.calls; win.main += s.main; win.tris += s.tris; win.doors += s.doors;
      here = s.place;
      if (s.gap > HITCH_MS && built >= 0) hitch = { place: s.place, gap: s.gap, update: s.work - s.draw, draw: s.draw, built: s.built !== built };
      // (the log line; the chip's time arrives a few frames late, in `s.gpu.ms`, so it's read when the log is written)
      const heap = s.heap || 0, row = [s.t === undefined ? 0 : s.t, s.gap, s.work, s.draw, s.gpu || null, s.calls, s.doors, s.place, built >= 0 && s.built !== built ? 1 : 0, heap, prevHeap && heap < prevHeap - 5e5 ? 1 : 0];
      log.push(row); if (log.length > LOG_MAX) log.splice(0, 2000);
      prevHeap = heap;
      built = s.built;
    },
    // the log as text: what the device is, then a line a frame
    logText(about = '') {
      const n = x => x.toFixed(1);
      const head = [`SADIE'S CLUBHOUSE FRAME LOG`, about, 'one line a frame: time(ms), frame(ms), our work(ms), drawing(ms), chip(ms, -1 if unknown), calls, doorways, place, room built(1), page memory(MB), memory fell(1)'];
      return head.filter(Boolean).concat(log.map(r => [n(r[0]), n(r[1]), n(r[2]), n(r[3]), r[4] && r[4].ms >= 0 ? n(r[4].ms) : -1, r[5], r[6], label(r[7]), r[8], (r[9] / 1e6).toFixed(1), r[10]].join(','))).join('\n');
    },
    logLength: () => log.length,
    // how long one place's own update took this frame
    place(name, ms) { places.set(name, (places.get(name) || 0) + ms); },
    gaps: () => gaps,
    // the screen's own frame length: the quickest quarter of recent frames (16.7 ms until there are enough)
    guide() {
      if (gaps.length < 20) return 1000 / 60;
      return [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 4)];
    },
    // the numbers since the last time, kept until the next (extra: what the page adds: memory, rooms)
    refresh(extra = {}) {
      const n = Math.max(1, win.n), per = x => x / n;
      shown = { fps: Math.round(1000 * win.n / Math.max(1, win.gap)), gap: per(win.gap), work: per(win.work), draw: per(win.draw), update: per(win.work - win.draw),
        calls: Math.round(per(win.calls)), main: Math.round(per(win.main)), tris: Math.round(per(win.tris)), doors: Math.round(per(win.doors) * 10) / 10,
        place: here, top: [...places].map(([k, v]) => [k, per(v)]).filter(([, v]) => v >= 0.05).sort((a, b) => b[1] - a[1]).slice(0, 3), ...extra };
      win = fresh(); places.clear();
      return shown;
    },
    // the compact line
    strip() {
      if (!shown) return 'MEASURING...';
      return `${shown.fps} FPS · ${shown.work.toFixed(1)} MS WORK · ${shown.calls} CALLS · ${shown.doors} DOORS · ${label(shown.place)}`;
    },
    // the full list, as [name, value]
    rows() {
      const s = shown; if (!s) return [];
      const mb = n => (n / 1e6).toFixed(1);
      return [
        ['FRAME', `${s.fps} A SECOND, ${s.gap.toFixed(1)} MS (THIS SCREEN'S OWN: ${this.guide().toFixed(1)} MS)`],
        ['OUR WORK', `${s.work.toFixed(1)} MS: ${s.update.toFixed(1)} UPDATING, ${s.draw.toFixed(1)} DRAWING`],
        ['THE CHIP', (c => c.length ? `${(c.reduce((a, b) => a + b, 0) / c.length).toFixed(1)} MS A FRAME ON ITS OWN, ${Math.max(...c).toFixed(1)} AT MOST (OF THE LAST ${c.length})` : "THIS DEVICE WON'T SAY HOW LONG THE CHIP TAKES")(log.slice(-120).map(r => r[4] ? r[4].ms : -1).filter(x => x >= 0))],
        ['DRAW CALLS', `${s.calls} (${s.main} ROOM, ${s.calls - s.main} DOORWAYS), ${s.tris} TRIANGLES`],
        ['DOORWAYS SEEN', String(s.doors)],
        ['IN', label(s.place)],
        ['ROOMS', s.rooms === undefined ? '' : `${s.rooms} BUILT OF ${s.slots}, ${s.ticking} PLACES RUNNING`],
        ['SLOWEST UPDATES', s.top.length ? s.top.map(([k, v]) => `${label(k)} ${v.toFixed(1)}`).join(', ') + ' MS' : 'NONE WORTH NOTING'],
        ['MEMORY', s.heap ? `${mb(s.heap)} MB NOW, ${mb(s.heapMax)} MB MOST` : "THIS BROWSER WON'T SAY"],
        ['ON THE CARD', s.shapes === undefined ? '' : `${s.shapes} SHAPES, ${s.pictures} PICTURES`],
        ['LAST HITCH', hitch ? `${Math.round(hitch.gap)} MS IN ${label(hitch.place)}: ${hitch.update.toFixed(0)} UPDATING, ${hitch.draw.toFixed(0)} DRAWING${hitch.built ? ', A ROOM WAS BUILT' : ''}` : 'NONE YET'],
      ].filter(r => r[1] !== '');
    },
    clear() { gaps = []; win = fresh(); shown = null; hitch = null; built = -1; places.clear(); log = []; prevHeap = 0; },
  };
}

const label = name => String(name).replace(/^(room|thing):/, '').replace(/-/g, ' ').toUpperCase();

// The box on screen. on(): its saved on/off; `extra()` gives the page's own numbers (memory, rooms).
export function liveBox({ root, on, store, key, touchy, mode, extra }) {
  const stats = makeLive(), el = document.createElement('div');
  el.id = 'live'; el.className = 'hud'; el.hidden = true;
  const strip = document.createElement('p'), graph = document.createElement('canvas'), panel = document.createElement('dl');
  graph.width = BARS; graph.height = 12; panel.hidden = true;
  el.append(strip, graph, panel); root.append(el);
  const g = graph.getContext('2d');
  let isOn = !!store.get(key, false), open = !touchy, lastShow = 0, heapMax = 0;
  const apply = () => { el.hidden = !isOn; panel.hidden = !open; };
  function set(v) {
    isOn = !!v; store.set(key, isOn); stats.clear(); lastShow = 0; apply();
    for (const f of listeners) f(isOn);
  }
  const listeners = [];
  // (a tap on it opens or shrinks the list, and isn't a tap on the room behind it)
  el.addEventListener('pointerdown', e => e.stopPropagation());
  el.addEventListener('click', () => { open = !open; apply(); });
  on(window, 'keydown', e => {
    if (e.code === 'KeyP' && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey && (mode() === 'play' || mode() === 'menu')) set(!isOn);
  });
  apply();
  return {
    on: () => isOn, set, toggle: () => set(!isOn), onChange: f => listeners.push(f),
    place: (name, ms) => stats.place(name, ms),
    logText: about => stats.logText(about), logLength: () => stats.logLength(),
    frame(now, sample) {
      if (!isOn) return;
      stats.add(sample);
      const guide = stats.guide(), top = guide * 3, gaps = stats.gaps();
      g.clearRect(0, 0, BARS, 12);
      g.fillStyle = '#ffffff40'; g.fillRect(0, 12 - Math.round(guide / top * 12), BARS, 1);   // (this screen's own frame length)
      for (let i = 0; i < gaps.length; i++) {
        const h = Math.max(1, Math.min(12, Math.round(gaps[i] / top * 12)));
        g.fillStyle = gaps[i] > guide * RED_AT ? '#ff4f86' : '#6fd08a';
        g.fillRect(BARS - gaps.length + i, 12 - h, 1, h);
      }
      if (now - lastShow > SHOW_EVERY) {
        lastShow = now;
        const x = extra(); if (x.heap) heapMax = Math.max(heapMax, x.heap);
        stats.refresh({ ...x, heapMax });
        strip.textContent = stats.strip();
        if (open) panel.replaceChildren(...stats.rows().flatMap(([k, v]) => {
          const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = k; dd.textContent = v; return [dt, dd];
        }));
      }
    },
  };
}
