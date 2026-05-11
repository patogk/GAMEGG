// Wraps keyboard, exposes per-frame state + emits semantic events to EventBus.
// Per InputBus GDD: uses event.code (layout-independent), 6KRO-safe layout from tuning.

import { tuning } from '../tuning.js';

export class InputBus {
  constructor({ bus }) {
    this._bus = bus;
    this._pressed = new Set();      // action names
    this._justPressed = new Set();  // cleared per frame
    this._justReleased = new Set();
    this._codeToActions = new Map(); // code → Set<action>

    this._rebuildCodeMap();

    window.addEventListener('keydown', (e) => this._onKey(e, true));
    window.addEventListener('keyup',   (e) => this._onKey(e, false));
    window.addEventListener('blur', () => this._onBlur());
  }

  _rebuildCodeMap() {
    this._codeToActions.clear();
    for (const [action, codes] of Object.entries(tuning.input.bindings)) {
      for (const code of codes) {
        if (!this._codeToActions.has(code)) this._codeToActions.set(code, new Set());
        this._codeToActions.get(code).add(action);
      }
    }
  }

  _onKey(e, isDown) {
    const actions = this._codeToActions.get(e.code);
    if (!actions) return;
    if (tuning.input.preventDefaultActions) e.preventDefault();
    if (isDown && tuning.input.suppressRepeat && e.repeat) return;
    for (const action of actions) {
      if (isDown) {
        const wasPressed = this._pressed.has(action);
        if (!wasPressed) {
          this._pressed.add(action);
          this._justPressed.add(action);
          this._bus.emit(`${action}-pressed`);
        }
      } else {
        if (this._pressed.has(action)) {
          this._pressed.delete(action);
          this._justReleased.add(action);
          this._bus.emit(`${action}-released`);
        }
      }
    }
  }

  _onBlur() {
    for (const action of this._pressed) this._bus.emit(`${action}-released`);
    this._pressed.clear();
    this._justPressed.clear();
    this._justReleased.clear();
    this._bus.emit('all-inputs-released');
  }

  isPressed(action) { return this._pressed.has(action); }
  wasJustPressed(action) { return this._justPressed.has(action); }
  wasJustReleased(action) { return this._justReleased.has(action); }

  tick() {
    this._justPressed.clear();
    this._justReleased.clear();
  }
}
