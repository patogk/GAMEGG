// dat.gui overlay toggled with backtick. Loaded lazily from CDN.
// Sliders for tunable knobs; mutations apply at next use site (per ADR-001 rule).

import { tuning } from '../tuning.js';

const DAT_GUI_CDN = 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.9/build/dat.gui.min.js';

export class DebugOverlay {
  constructor() {
    this._gui = null;
    this._visible = false;
    this._loadPromise = null;
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Backquote') { e.preventDefault(); this.toggle(); }
    });
  }

  _loadDatGui() {
    if (this._loadPromise) return this._loadPromise;
    this._loadPromise = new Promise((resolve, reject) => {
      if (window.dat?.GUI) { resolve(window.dat); return; }
      const s = document.createElement('script');
      s.src = DAT_GUI_CDN;
      s.onload = () => resolve(window.dat);
      s.onerror = () => reject(new Error('dat.gui CDN load failed'));
      document.head.appendChild(s);
    });
    return this._loadPromise;
  }

  async toggle() {
    if (this._gui) {
      this._visible = !this._visible;
      this._gui.domElement.style.display = this._visible ? '' : 'none';
      return;
    }
    try {
      const dat = await this._loadDatGui();
      this._gui = new dat.GUI({ width: 320 });
      this._buildSliders();
      this._visible = true;
    } catch (err) {
      console.warn('DebugOverlay: dat.gui no se pudo cargar', err);
    }
  }

  _buildSliders() {
    const g = this._gui;

    const fPhys = g.addFolder('physics');
    fPhys.add(tuning.physics, 'gravity',          400, 4000, 50);
    fPhys.add(tuning.physics, 'airFriction',      0.1, 0.99, 0.01);
    fPhys.add(tuning.physics, 'airFrictionVertical', 0.5, 1.0, 0.01);
    fPhys.add(tuning.physics, 'maxVelocity',      1000, 5000, 100);
    fPhys.open();

    const fPl = g.addFolder('player');
    fPl.add(tuning.player, 'acceleration',  1000, 8000, 100);
    fPl.add(tuning.player, 'maxRunSpeed',   300, 1200, 25);
    fPl.add(tuning.player, 'jumpVelocity',  400, 1400, 25);
    fPl.add(tuning.player, 'coyoteMs',      0, 250, 5);
    fPl.add(tuning.player, 'jumpBufferMs',  0, 300, 5);
    fPl.add(tuning.player, 'jumpCutFactor', 0.1, 1.0, 0.05);
    fPl.add(tuning.player, 'groundFriction',0.001, 0.5, 0.001);

    const fBall = g.addFolder('ball');
    fBall.add(tuning.ball, 'mass',        0.05, 2.0, 0.05);
    fBall.add(tuning.ball, 'gravityScale',0, 3, 0.05);
    fBall.add(tuning.ball, 'radius',      8, 64, 1);

    const fCol = g.addFolder('collision');
    fCol.add(tuning.collision, 'restitutionHeadBall',  0.2, 1.5, 0.05);
    fCol.add(tuning.collision, 'restitutionBallFloor', 0.1, 1.0, 0.05);
    fCol.add(tuning.collision, 'restitutionBallWall',  0.1, 1.0, 0.05);
    fCol.add(tuning.collision, 'restitutionBallPost',  0.5, 1.5, 0.05);

    const fJ = g.addFolder('juice');
    fJ.add(tuning.juice, 'goalHitstopMs', 50, 800, 10);
    fJ.add(tuning.juice, 'goalSlowmoMs',  0, 1500, 25);
    fJ.add(tuning.juice, 'slowmoTarget',  0.05, 0.95, 0.05);
    fJ.add(tuning.juice, 'goalShakePx',   0, 24, 1);
    fJ.add(tuning.juice, 'goalShakeMs',   0, 1000, 25);
    fJ.add(tuning.juice, 'hitShakeMinPx', 0, 12, 1);
    fJ.add(tuning.juice, 'hitShakeMaxPx', 0, 24, 1);
    fJ.add(tuning.juice, 'hitShakeMs',    0, 400, 10);
    fJ.open();

    const fMatch = g.addFolder('match');
    fMatch.add(tuning.match, 'durationSec', 15, 300, 5);

    g.add({ reset: () => location.reload() }, 'reset').name('🔄 Reload page');
  }
}
