// Pub/sub backbone. Per architecture.md §4.3, used for any
// upward/sideways inter-system communication.

export class EventBus {
  constructor() {
    this._handlers = new Map(); // event → Set<handler>
  }

  on(event, handler) {
    if (!this._handlers.has(event)) this._handlers.set(event, new Set());
    this._handlers.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    const set = this._handlers.get(event);
    if (set) set.delete(handler);
  }

  emit(event, payload) {
    const set = this._handlers.get(event);
    if (!set) return;
    for (const handler of set) {
      try { handler(payload); }
      catch (err) { console.error(`EventBus handler error for "${event}":`, err); }
    }
  }
}
