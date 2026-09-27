// A tiny event bus so the simulation can announce things (a star was collected, the next piece
// changed...) without knowing anything about the screen. UI and rendering listen.
const handlers = new Map();
export function on(name, fn) {
  if (!handlers.has(name)) handlers.set(name, []);
  handlers.get(name).push(fn);
}
export function emit(name, data) {
  const list = handlers.get(name);
  if (list) for (const fn of list) fn(data);
}
