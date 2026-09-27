// Small wrapper around localStorage. Never throws (private mode, tests running in Node, etc.).
export const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  remove(k) { try { localStorage.removeItem(k); } catch (e) {} },
};
