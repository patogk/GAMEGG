// All magic numbers live here. Per ADR-001 + tech-prefs Forbidden Patterns,
// ALWAYS read `tuning.X` at use site — NEVER destructure into module-level consts.

export const tuning = {
  loop: {
    fixedDtMs: 1000 / 120,
    maxSubSteps: 6,
    maxFrameDeltaMs: 250,
    slowmoTarget: 0.15,
    slowmoRampOutMs: 80,
    tier0HitstopMs: 150,
  },

  physics: {
    gravity: 1800,
    airFriction: 0.4,
    airFrictionVertical: 0.95,
    maxVelocity: 3000,
  },

  collision: {
    restitutionHeadBall: 0.85,
    restitutionBallFloor: 0.6,
    restitutionBallWall: 0.7,
    restitutionBallPost: 0.95,
    correctionPercent: 0.8,
    penetrationSlop: 0.5,
    goalLockMs: 1500,
  },

  player: {
    acceleration: 4000,
    maxRunSpeed: 600,
    jumpVelocity: 850,
    coyoteMs: 100,
    jumpBufferMs: 120,
    jumpCutFactor: 0.5,
    groundFriction: 0.05,
    headRadius: 32,
    mass: 1.0,
  },

  ball: {
    radius: 18,
    mass: 0.3,
    spinScale: 0.05,
    spawnHeightOffset: 100,
    gravityScale: 1.0,
  },

  field: {
    width: 1280,
    height: 720,
    floorY: 640,         // top of floor AABB
    centerX: 640,
    centerY: 360,
    wallThickness: 40,
    goalWidth: 60,
    goalHeight: 200,
    postRadius: 6,
  },

  match: {
    durationSec: 60,    // Tier 0
  },

  juice: {
    // goal
    goalHitstopMs: 400,
    goalSlowmoMs:  600,
    slowmoTarget:  0.15,
    goalShakePx:   14,
    goalShakeMs:   500,
    // hits
    hitShakeMinPx: 3,
    hitShakeMaxPx: 12,
    hitShakeMs:    120,
    // posts
    postShakePx:   18,
    postShakeMs:   200,
    // toggles
    shakeRespectsTimeScale: false,
  },

  render: {
    fieldAspect: 16 / 9,
    goalFlashDurationMs: 400,
    goalFlashMaxAlpha: 0.6,
    chromaticAberrationMaxOffsetPx: 4,
    bgBlack: '#000000',
    interpolationEnabled: true,
  },

  colors: {
    bgBlack: '#000000',
    p1Cyan: '#00E5FF',
    p2Magenta: '#FF1AA1',
    ballWhite: '#FFFFFF',
    fieldLine: '#1F2A38',
    uiText: '#E8F1FF',
    uiTextDim: '#5A6F88',
    impactYellow: '#FFE500',
    specialOrange: '#FF4D2E',
    goalLime: '#A6FF00',
    modifierViolet: '#9D2BFF',
  },

  input: {
    bindings: {
      // P1
      'p1-move-left':  ['KeyA'],
      'p1-move-right': ['KeyD'],
      'p1-jump':       ['KeyW'],
      'p1-special':    ['KeyG'],
      // P2
      'p2-move-left':  ['ArrowLeft'],
      'p2-move-right': ['ArrowRight'],
      'p2-jump':       ['ArrowUp'],
      'p2-special':    ['Comma'],
      // Global
      'pause':         ['Escape'],
      'restart':       ['KeyR'],
    },
    preventDefaultActions: true,
    suppressRepeat: true,
    knownRollover: false,
  },
};
