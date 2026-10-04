// The save director: every save in the clubhouse goes through here, the one place that touches
// browser storage (so a different home for saves, like itch.io or a desktop app, only changes this
// file). Never throws (private mode, tests running in Node, a full browser...).
//
//   saveBox(id)      an activity's own saves, named `sadies-clubhouse.<id>.<name>` (a room in the
//                    clubhouse gets its box in its kit, `m.saves`): get(name, d), set(name, v),
//                    remove(name), putAside(name). A save that can't be read is put aside (kept
//                    as `<its key>.unreadable`), never wiped: a room that can't read an old save
//                    calls putAside(name) before starting fresh, so it can still be rescued.
//   saveRoom()       how much the saves take ({ used, of, nearlyFull, failed }): browsers keep
//                    about 5 MB of saves per page, and past that a save quietly fails.
//   backup(prefixes) everything saved under those prefixes, as one file's worth of text, and
//   inspectBackup(text, prefixes) looks a backup over first; loadBackup(text, prefixes) puts it back
//   (all or nothing).
//   store            the plain get, set and remove under a full key, for Dropper World's saves
//                    from before there was a clubhouse (never renamed: everyone's would be lost).
//   onLeave(fn)      fn() runs as the page is hidden or closed (switching apps on a phone counts,
//                    and is often the last chance to save); hands back how to stop it. A box has
//                    it too. Never after a start-over.
//   tabNote.put/take a note kept for this tab only (not a save: gone when the tab closes).
//   forget(prefixes) every save under those prefixes erased (or every save there is, with none).
//   reloading()      nothing more is saved on this page, by anyone: it's about to reload after a
//                    start-over or a backup's put back, and a room saving on its way out would
//                    write back what was just erased.
let failed = false;   // a save that didn't fit (the pause menu says so)
let over = false;     // started over: nothing more is saved on this page

export const store = {
  get(k, d) {
    let v;
    try { v = localStorage.getItem(k); } catch { return d; }
    if (v == null) return d;
    try { return JSON.parse(v); } catch { putAside(k); return d; }
  },
  set(k, v) { if (over) return false; try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { failed = true; return false; } },
  remove(k) { try { localStorage.removeItem(k); } catch {} },
};

// a note for this tab only (which door you just came out of): gone when the tab closes, never a save
export const tabNote = {
  take(k) { try { const v = sessionStorage.getItem(k); sessionStorage.removeItem(k); return v; } catch { return null; } },
  put(k, v) { try { sessionStorage.setItem(k, v); } catch {} },
};

// a save that can't be read, kept beside it instead of being wiped by the next save
export function putAside(k) {
  try { const v = localStorage.getItem(k); if (v != null) localStorage.setItem(k + '.unreadable', v); } catch {}
}

export function saveBox(id) {
  const key = name => `sadies-clubhouse.${id}.${name}`;
  return {
    get: (name, d) => store.get(key(name), d),
    set: (name, v) => store.set(key(name), v),
    remove: name => store.remove(key(name)),
    putAside: name => putAside(key(name)),
    onLeave,
    key,
  };
}

// ---------- leaving, and starting over ----------
const leaving = new Set();
let listening = false;
export function onLeave(fn) {
  if (!listening && globalThis.addEventListener) {
    listening = true;
    const go = () => { if (!over) for (const f of [...leaving]) { try { f(); } catch {} } };
    addEventListener('pagehide', go);
    globalThis.document?.addEventListener('visibilitychange', () => { if (document.hidden) go(); });
  }
  leaving.add(fn);
  return () => leaving.delete(fn);
}
export function forget(prefixes) {
  if (!prefixes) { try { localStorage.clear(); sessionStorage.clear(); } catch {} return; }
  try { for (const k of keys()) if (mine(k, prefixes)) localStorage.removeItem(k); } catch {}
}
export function reloading() { over = true; }

// About 5 million letters of saves (keys and all) per page in every browser; nearly full at 4.
const ROOM = 5e6, NEARLY = 4e6;
export function saveRoom() {
  let used = 0;
  try { for (const k of keys()) used += k.length + (localStorage.getItem(k) || '').length; } catch {}
  return { used, of: ROOM, nearlyFull: used > NEARLY, failed };
}

// ---------- backups ----------
const PREFIX = 'sadies-clubhouse-backup/', VERSION = 1, FORMAT = PREFIX + VERSION;   // (a new version must still read the older ones: only a newer one is turned away)
const mine = (k, prefixes) => prefixes.some(p => k.startsWith(p));
const keys = () => { const all = []; for (let i = 0; i < localStorage.length; i++) all.push(localStorage.key(i)); return all; };
export function backup(prefixes) {
  const saves = {};
  try { for (const k of keys()) if (mine(k, prefixes)) saves[k] = localStorage.getItem(k); } catch {}
  return JSON.stringify({ format: FORMAT, made: new Date().toISOString(), saves });
}
const NOT_ONE = "THAT'S NOT A CLUBHOUSE BACKUP";
const aside = k => k.endsWith('.unreadable');   // saves put aside are never wiped
const readable = v => { try { JSON.parse(v); return true; } catch { return false; } };
// Looks over a backup file's text before anything is touched: { error } (what to say), or
// { saves } (the [key, value] pairs it would put back) and `made` (its date). It refuses a file that
// isn't one, one from a newer version, one with nothing in it, and one with any save that isn't
// readable, so a bad file can never replace a good save.
export function inspectBackup(text, prefixes) {
  let b;
  try { b = JSON.parse(text); } catch { return { error: NOT_ONE }; }
  if (!b || typeof b.format !== 'string' || !/^sadies-clubhouse-backup\/\d+$/.test(b.format) || !b.saves || typeof b.saves !== 'object' || Array.isArray(b.saves)) return { error: NOT_ONE };
  if (+b.format.slice(PREFIX.length) > VERSION) return { error: 'THAT BACKUP IS FROM A NEWER VERSION OF THE GAME' };
  const saves = Object.entries(b.saves).filter(([k]) => mine(k, prefixes) && !aside(k));
  if (!saves.length) return { error: 'THAT BACKUP HAS NO SAVES IN IT' };
  if (saves.some(([, v]) => typeof v !== 'string' || !readable(v))) return { error: 'THAT BACKUP IS DAMAGED: NOTHING WAS CHANGED' };
  return { saves, made: typeof b.made === 'string' ? b.made.slice(0, 10) : '' };
}
// Puts a backup back: every save under the prefixes becomes the backup's (one it doesn't have is
// forgotten, except saves put aside as unreadable). All or nothing: if it won't all fit, everything
// is left as it was. Says why not, or ''.
export function loadBackup(text, prefixes) {
  const { error, saves } = inspectBackup(text, prefixes);
  if (error) return error;
  const before = {};
  try {
    for (const k of keys()) if (mine(k, prefixes) && !aside(k)) before[k] = localStorage.getItem(k);
    for (const k of Object.keys(before)) localStorage.removeItem(k);
    for (const [k, v] of saves) localStorage.setItem(k, v);
    return '';
  } catch {
    try {
      for (const k of keys()) if (mine(k, prefixes) && !aside(k)) localStorage.removeItem(k);
      for (const [k, v] of Object.entries(before)) localStorage.setItem(k, v);
    } catch {}
    return "IT WON'T FIT: NOTHING WAS CHANGED";
  }
}
