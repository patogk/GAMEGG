// Lazy-init Web Audio AudioContext on first user gesture (autoplay policy).
// Exposes a single shared context + master gain.

export class AudioCtx {
  constructor() {
    this._ctx = null;
    this._master = null;
    this._readyHandlers = [];
    // Lazy-init on first user gesture
    const onFirstGesture = () => {
      if (this._ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { console.warn('Web Audio not supported'); return; }
      this._ctx = new AC();
      this._master = this._ctx.createGain();
      this._master.gain.value = 0.4; // master volume
      this._master.connect(this._ctx.destination);
      for (const h of this._readyHandlers) h();
      this._readyHandlers.length = 0;
    };
    ['keydown', 'mousedown', 'touchstart', 'pointerdown'].forEach((ev) => {
      window.addEventListener(ev, onFirstGesture, { once: true });
    });
  }

  get ctx() { return this._ctx; }
  get master() { return this._master; }
  get isReady() { return !!this._ctx; }

  onReady(handler) {
    if (this._ctx) handler();
    else this._readyHandlers.push(handler);
  }
}
