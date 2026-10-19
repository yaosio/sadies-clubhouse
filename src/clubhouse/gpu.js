// The graphics chip's own time for the picture (for the live stats log, docs/clubhouse/world/speed-readout.md).
// A page can ask the chip how long it spent on some drawing (Chrome and Android's usually say; iPhones and
// some chips don't, then `begin`/`end` do nothing). The answer comes a few frames late: `end()` hands back a
// holder, `{ ms: -1 }`, that fills in by itself (`poll()` each frame collects what's ready).
export function makeGpuTimer(gl) {
  const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  let open = null, pending = [];
  return {
    ok: !!ext,
    begin() {
      if (!ext || open || pending.length > 8) return;
      open = { q: gl.createQuery(), out: { ms: -1 } };
      gl.beginQuery(ext.TIME_ELAPSED_EXT, open.q);
    },
    end() {
      if (!open) return null;
      gl.endQuery(ext.TIME_ELAPSED_EXT);
      pending.push(open); const out = open.out; open = null;
      return out;
    },
    poll() {
      if (!ext || !pending.length) return;
      const bad = gl.getParameter(ext.GPU_DISJOINT_EXT);   // (the chip was interrupted: those answers can't be trusted)
      while (pending.length && gl.getQueryParameter(pending[0].q, gl.QUERY_RESULT_AVAILABLE)) {
        const p = pending.shift();
        if (!bad) p.out.ms = gl.getQueryParameter(p.q, gl.QUERY_RESULT) / 1e6;
        gl.deleteQuery(p.q);
      }
    },
  };
}
