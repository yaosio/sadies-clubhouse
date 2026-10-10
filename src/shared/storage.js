// The save director: every save in the clubhouse goes through here, the one place that touches
// browser storage (so a different home for saves, like itch.io or a desktop app, only changes this
// file). Never throws (private mode, tests running in Node, a full browser...).
//
// Saves live in the browser's IndexedDB (squeezed small when they're big), but everything here
// answers at once, from a copy kept in memory: `ready()` reads the whole lot in before the clubhouse
// or an activity starts (src/main.js waits for it), and after that a save is changed in memory first
// and written to the disk a moment later (and the moment the page is hidden or closed).
//
//   ready()          opens the saves; resolves (never fails) once they're all in memory. If the
//                    browser won't keep saves at all (some private windows), the game still plays, the
//                    saves just last until the page closes, and the pause menu says so.
//   saveBox(id)      an activity's own saves, named `sadies-clubhouse.<id>.<name>` (a room in the
//                    clubhouse gets its box in its kit, `m.saves`): get(name, d), set(name, v),
//                    remove(name), putAside(name). A save that can't be read is put aside (kept
//                    as `<its key>.unreadable`), never wiped: a room that can't read an old save
//                    calls putAside(name) before starting fresh, so it can still be rescued.
//   saveRoom()       how the saves are doing ({ used, nearlyFull, failed, lost, kept, lastBackup }):
//                    `used` is letters of saves in memory, `nearlyFull` the browser says its room is
//                    nearly spent, `failed` a write didn't fit, `lost` the browser won't keep saves,
//                    `kept` the browser promised not to clear them (null: it doesn't say).
//   backup(prefixes) everything saved under those prefixes, as one file's worth of text, and
//   inspectBackup(text, prefixes) looks a backup over first; loadBackup(text, prefixes) puts it back
//   (all or nothing, in one write; async).
//   store            the plain get, set and remove under a full key, for Dropper World's saves
//                    from before there was a clubhouse (never renamed: everyone's would be lost).
//   onLeave(fn)      fn() runs as the page is hidden or closed (switching apps on a phone counts,
//                    and is often the last chance to save); hands back how to stop it. A box has
//                    it too. Never after a start-over.
//   tabNote.put/take a note kept for this tab only (not a save: gone when the tab closes).
//   forget(prefixes) every save under those prefixes erased (never anything else: the page may share
//                    its address with others).
//   reloading()      nothing more is saved on this page, by anyone: it's about to reload after a
//                    start-over or a backup's put back, and a room saving on its way out would
//                    write back what was just erased. `flush()` then waits for the erasing to reach
//                    the disk.
//   lastBackup.get/made   when a backup was last saved (kept apart from the saves: a start-over or
//                    a backup's put back doesn't touch it).
//
// The checks plant and read saves through two hooks on the page: `window.__plantSaves` (an object of
// key: text, set before the page starts) and `window.__saves` (all(), set(key, text), remove(key)).
const META = 'sadies-clubhouse-meta.', DB = 'sadies-clubhouse', STORE = 'saves', SQUEEZE_FROM = 1024, WRITE_AFTER = 1000, OPEN_WAIT = 6000;
let failed = false;   // a save that didn't fit (the pause menu says so)
let lost = false;     // the browser won't keep saves at all
let over = false;     // started over: nothing more is saved on this page
let kept = null, nearly = false;   // asked of the browser (persist, estimate)
const mem = new Map();       // every save, as its JSON text: what every get and set works on
const pending = new Map();   // saves changed but not yet on the disk (text, or null: erased)
let backend = null, opening = null, timer = 0, writing = Promise.resolve();

// ---------- the disk: IndexedDB, one record per save: its text, or { z: gzip bytes } when squeezed ----------
async function squeeze(text) {
  if (text.length < SQUEEZE_FROM || typeof CompressionStream === 'undefined') return text;
  try {
    const bytes = new Uint8Array(await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
    return bytes.length < text.length ? { z: bytes } : text;
  } catch { return text; }   // (no squeezing is fine: it's only smaller)
}
async function unsqueeze(rec) {
  if (typeof rec === 'string') return rec;
  if (!rec || !(rec.z instanceof Uint8Array || rec.z instanceof ArrayBuffer)) throw new Error('not a save');
  return new Response(new Blob([rec.z]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
}
export { squeeze, unsqueeze };

const wrap = r => new Promise((ok, no) => { r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
function idbBackend() {
  let db = null;
  return {
    async load() {
      db = await new Promise((ok, no) => {
        const r = indexedDB.open(DB, 1);
        r.onupgradeneeded = () => r.result.createObjectStore(STORE);
        r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); r.onblocked = () => no(new Error('blocked'));
      });
      const t = db.transaction(STORE, 'readonly'), os = t.objectStore(STORE);
      const [keys, recs] = await Promise.all([wrap(os.getAllKeys()), wrap(os.getAll())]);
      const saves = new Map(), odd = [];
      for (let i = 0; i < keys.length; i++) {
        try { saves.set(String(keys[i]), await unsqueeze(recs[i])); } catch { odd.push([String(keys[i]), recs[i]]); }
      }
      // a record that can't be unsqueezed is kept beside itself, never wiped
      if (odd.length) { const w = db.transaction(STORE, 'readwrite').objectStore(STORE); for (const [k, r] of odd) w.put(r, k + '.unreadable'); }
      return saves;
    },
    // [key, text|null] pairs in one transaction, all or nothing. `quick` (the page is going away)
    // starts it at once, with nothing squeezed: there's no time to wait.
    async write(batch, quick) {
      const recs = quick ? batch : await Promise.all(batch.map(async ([k, v]) => [k, v == null ? null : await squeeze(v), v]));
      return new Promise(ok => {
        try {
          const t = db.transaction(STORE, 'readwrite'), os = t.objectStore(STORE);
          for (const [k, r] of recs) { if (r == null) os.delete(k); else os.put(r, k); }
          t.oncomplete = () => ok(true); t.onerror = t.onabort = () => ok(false);
        } catch { ok(false); }
      });
    },
  };
}

export function ready(use) {
  return opening ||= (async () => {
    backend = use || (typeof indexedDB !== 'undefined' ? idbBackend() : null);
    try {
      if (!backend) throw new Error('no storage');
      const saves = await Promise.race([backend.load(), new Promise((_, no) => setTimeout(() => no(new Error('slow')), OPEN_WAIT))]);
      for (const [k, v] of saves) if (!mem.has(k)) mem.set(k, v);
    } catch { backend = null; lost = true; }
    finishJot();
    try { for (const [k, v] of Object.entries(globalThis.__plantSaves || {})) { mem.set(k, v); queue(k, v); } } catch {}   // (the checks' way in)
    try {
      const s = navigator.storage;
      if (s?.persisted) kept = await s.persisted();
      // asked for once per browser: the browser may show its own question, and then it's the answer
      if (s?.persist && kept === false && !mem.has(META + 'askedKeep')) {
        mem.set(META + 'askedKeep', '1'); queue(META + 'askedKeep', '1');
        s.persist().then(v => { kept = v; }, () => {});
      }
    } catch {}
  })();
}
export function room() {   // asks the browser how full its room is (the pause menu calls it as it opens)
  try { return navigator.storage.estimate().then(e => { nearly = !!e.quota && e.usage / e.quota > 0.8; }, () => {}); } catch { return Promise.resolve(); }
}

// A page being closed can't count on the browser finishing a write to its disk (IndexedDB may be cut
// off mid-write), so as it goes, whatever hasn't been confirmed written is also jotted down in a note
// in localStorage (which is written at once, a little, and gone again once the disk has it). The next
// page to start reads the note and finishes the job.
const JOURNAL = 'sadies-clubhouse-journal';
function jot() {
  try { if (pending.size) localStorage.setItem(JOURNAL, JSON.stringify([...pending])); else localStorage.removeItem(JOURNAL); } catch {}
}
function finishJot() {
  try {
    const todo = JSON.parse(localStorage.getItem(JOURNAL) || '[]');
    for (const [k, v] of todo) { if (v == null) mem.delete(k); else mem.set(k, v); queue(k, v); }
  } catch {}
}

function queue(k, v) {
  pending.set(k, v);
  if (backend && !timer) timer = setTimeout(() => flush(), WRITE_AFTER);
}
// Writes what's waiting to the disk, resolving true once it's there (or if nothing was waiting).
// `quick`: the page is going away, so no squeezing and no waiting.
export function flush(quick) {
  clearTimeout(timer); timer = 0;
  const go = async () => {
    if (!backend || !pending.size) return true;
    const sent = [...pending], ok = await backend.write(sent, quick);
    if (!ok) { failed = true; return false; }
    // (what was changed again while it was written stays waiting)
    for (const [k, v] of sent) if (pending.get(k) === v) pending.delete(k);
    if (!pending.size) { try { localStorage.removeItem(JOURNAL); } catch {} }
    return true;
  };
  if (quick) return go();   // (started now: a page being closed can't wait its turn)
  return writing = writing.then(go, go);
}

export const store = {
  get(k, d) {
    const v = mem.get(k);
    if (v == null) return d;
    try { return JSON.parse(v); } catch { putAside(k); return d; }
  },
  set(k, v) {
    if (over) return false;
    let text; try { text = JSON.stringify(v); } catch { return false; }
    if (text === undefined) return false;
    mem.set(k, text); queue(k, text); return true;
  },
  remove(k) { mem.delete(k); queue(k, null); },
};

// a note for this tab only (which door you just came out of): gone when the tab closes, never a save
export const tabNote = {
  take(k) { try { const v = sessionStorage.getItem(k); sessionStorage.removeItem(k); return v; } catch { return null; } },
  put(k, v) { try { sessionStorage.setItem(k, v); } catch {} },
};

// a save that can't be read, kept beside it instead of being wiped by the next save
export function putAside(k) {
  const v = mem.get(k);
  if (v != null) { mem.set(k + '.unreadable', v); queue(k + '.unreadable', v); }
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

// when a backup was last made, for the pause menu's reminder: apart from the saves, so starting over
// or putting a backup back doesn't change it
export const lastBackup = {
  made() { try { return Date.parse(JSON.parse(mem.get(META + 'lastBackup'))) || 0; } catch { return 0; } },
  now() { const t = JSON.stringify(new Date().toISOString()); mem.set(META + 'lastBackup', t); queue(META + 'lastBackup', t); },
};

// ---------- leaving, and starting over ----------
const leaving = new Set();
let listening = false;
export function onLeave(fn) {
  if (!listening && globalThis.addEventListener) {
    listening = true;
    const go = () => { if (!over) for (const f of [...leaving]) { try { f(); } catch {} } flush(true); jot(); };
    addEventListener('pagehide', go);
    globalThis.document?.addEventListener('visibilitychange', () => { if (document.hidden) go(); });
  }
  leaving.add(fn);
  return () => leaving.delete(fn);
}
export function forget(prefixes) {
  for (const k of [...mem.keys()]) if (mine(k, prefixes)) { mem.delete(k); queue(k, null); }
}
export function reloading() { over = true; }

// How the saves are doing. (Before, a browser's 5 MB was the limit and we showed it; IndexedDB has
// room for far more, so the only warnings left are the browser saying it's nearly out, a write that
// didn't fit, and a browser that won't keep saves.)
export function saveRoom() {
  let used = 0;
  for (const [k, v] of mem) used += k.length + v.length;
  return { used, nearlyFull: nearly, failed, lost, kept, lastBackup: lastBackup.made() };
}

// ---------- backups ----------
const PREFIX = 'sadies-clubhouse-backup/', VERSION = 1, FORMAT = PREFIX + VERSION;   // (a new version must still read the older ones: only a newer one is turned away)
const mine = (k, prefixes) => prefixes.some(p => k.startsWith(p));
export function backup(prefixes) {
  const saves = {};
  for (const [k, v] of mem) if (mine(k, prefixes)) saves[k] = v;
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
// forgotten, except saves put aside as unreadable). All or nothing: it goes to the disk in one write,
// and if that fails everything is left as it was. Says why not, or ''.
export async function loadBackup(text, prefixes) {
  const { error, saves } = inspectBackup(text, prefixes);
  if (error) return error;
  const before = new Map(), had = new Map();
  for (const [k, v] of mem) if (mine(k, prefixes) && !aside(k)) before.set(k, v);
  const touched = new Set([...before.keys(), ...saves.map(([k]) => k)]);
  for (const k of touched) had.set(k, { mem: mem.get(k), pend: pending.get(k), queued: pending.has(k) });
  for (const k of before.keys()) { mem.delete(k); queue(k, null); }
  for (const [k, v] of saves) { mem.set(k, v); queue(k, v); }
  if (backend && await flush()) return '';
  for (const [k, h] of had) {   // (put everything back, and what was waiting before still waits)
    if (h.mem == null) mem.delete(k); else mem.set(k, h.mem);
    if (h.queued) pending.set(k, h.pend); else pending.delete(k);
  }
  return backend ? "IT WON'T FIT: NOTHING WAS CHANGED" : "THIS BROWSER WON'T KEEP SAVES: NOTHING WAS CHANGED";
}

// the checks' hooks (see the top)
globalThis.__saves = {
  all: () => Object.fromEntries([...mem].filter(([k]) => !k.startsWith(META))),   // (the saves; not the notes kept about them)
  set: (k, v) => { mem.set(k, v); queue(k, v); },
  remove: k => { mem.delete(k); queue(k, null); },
  flush,
};
