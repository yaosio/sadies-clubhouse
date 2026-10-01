// The save director: every save in the clubhouse goes through here, the one place that touches
// browser storage (so a different home for saves, like itch.io or a desktop app, only changes this
// file). Never throws (private mode, tests running in Node, a full browser...).
//
//   saveBox(id)      an activity's own saves, named `sadies-clubhouse.<id>.<name>` (a room in the
//                    mansion gets its box in its kit, `m.saves`): get(name, d), set(name, v),
//                    remove(name), putAside(name). A save that can't be read is put aside (kept
//                    as `<its key>.unreadable`), never wiped: a room that can't read an old save
//                    calls putAside(name) before starting fresh, so it can still be rescued.
//   saveRoom()       how much the saves take ({ used, of, nearlyFull, failed }): browsers keep
//                    about 5 MB of saves per page, and past that a save quietly fails.
//   backup(prefixes) everything saved under those prefixes, as one file's worth of text, and
//   loadBackup(text, prefixes) to put it back (all or nothing).
//   store            the plain get, set and remove under a full key, for Dropper World's saves
//                    from before there was a clubhouse (never renamed: everyone's would be lost).
let failed = false;   // a save that didn't fit (the pause menu says so)

export const store = {
  get(k, d) {
    let v;
    try { v = localStorage.getItem(k); } catch { return d; }
    if (v == null) return d;
    try { return JSON.parse(v); } catch { putAside(k); return d; }
  },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { failed = true; return false; } },
  remove(k) { try { localStorage.removeItem(k); } catch {} },
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
    key,
  };
}

// About 5 million letters of saves (keys and all) per page in every browser; nearly full at 4.
const ROOM = 5e6, NEARLY = 4e6;
export function saveRoom() {
  let used = 0;
  try { for (const k of keys()) used += k.length + (localStorage.getItem(k) || '').length; } catch {}
  return { used, of: ROOM, nearlyFull: used > NEARLY, failed };
}

// ---------- backups ----------
const FORMAT = 'sadies-clubhouse-backup/1';
const mine = (k, prefixes) => prefixes.some(p => k.startsWith(p));
const keys = () => { const all = []; for (let i = 0; i < localStorage.length; i++) all.push(localStorage.key(i)); return all; };
export function backup(prefixes) {
  const saves = {};
  try { for (const k of keys()) if (mine(k, prefixes)) saves[k] = localStorage.getItem(k); } catch {}
  return JSON.stringify({ format: FORMAT, made: new Date().toISOString(), saves });
}
// Puts a backup back: every save under the prefixes becomes the backup's (one it doesn't have is
// forgotten). All or nothing: if it won't all fit, everything is left as it was. Says why not, or ''.
export function loadBackup(text, prefixes) {
  let b;
  try { b = JSON.parse(text); } catch { return "THAT'S NOT A CLUBHOUSE BACKUP"; }
  if (!b || b.format !== FORMAT || !b.saves || typeof b.saves !== 'object') return "THAT'S NOT A CLUBHOUSE BACKUP";
  const incoming = Object.entries(b.saves).filter(([k, v]) => mine(k, prefixes) && typeof v === 'string');
  const before = {};
  try {
    for (const k of keys()) if (mine(k, prefixes)) before[k] = localStorage.getItem(k);
    for (const k of Object.keys(before)) localStorage.removeItem(k);
    for (const [k, v] of incoming) localStorage.setItem(k, v);
    return '';
  } catch {
    try {
      for (const k of keys()) if (mine(k, prefixes)) localStorage.removeItem(k);
      for (const [k, v] of Object.entries(before)) localStorage.setItem(k, v);
    } catch {}
    return "IT WON'T FIT: NOTHING WAS CHANGED";
  }
}
