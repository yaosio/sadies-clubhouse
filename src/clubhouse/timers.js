// A room's timers on the game's own time: `after(secs, fn)` runs `fn` once `secs` of game have
// passed. They stand still while the pause menu is up, and a room put away takes them with it (the
// clubhouse steps them from the room's update, which stops with it), so nothing fires late into a
// room that's gone. (A browser `setTimeout` does neither.)
export function timers(paused) {
  const list = [];
  return {
    after(secs, fn) { const t = { left: secs, fn }; list.push(t); return () => { const i = list.indexOf(t); if (i >= 0) list.splice(i, 1); }; },
    step(dt) {
      if (paused()) return;
      for (const t of [...list]) if ((t.left -= dt) <= 0) { list.splice(list.indexOf(t), 1); t.fn(); }
    },
  };
}
