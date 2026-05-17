const listeners = new Set();

export function emitFeedEvent(event) {
  listeners.forEach((fn) => fn(event));
}

export function onFeedEvent(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
