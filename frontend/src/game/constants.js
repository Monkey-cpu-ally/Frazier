export const W = 1280;
export const H = 720;

export const PL = {
  w: 24, h: 56,
  // Movement (from Godot AxelController)
  speed: 220, accel: 1400, friction: 1800, airMul: 0.7,
  // Jump
  jumpV: -420, gravity: 1200,
  fallGravMul: 1.35, lowJumpGravMul: 1.8,
  maxFall: 900,
  jumpCut: 0.4,
  coyote: 0.12, jumpBuf: 0.12,
  // Wall
  wallSlideSpd: 120,
  wallJumpX: 280, wallJumpY: -360,
  // Dash
  dashSpeed: 520, dashTime: 0.14, dashCooldown: 0.20,
  // Combat
  comboReset: 0.45, maxCombo: 3,
  // atkDur per combo level: tap (1) is a quick jab, doubleTap (2) a sweep,
  // holdRelease (3) a committed heavy. Durations double as attack-active time.
  atkDur: [0.18, 0.22, 0.30],
  atkCooldown: 0.06,
  airAtkDur: 0.18,
  smashSpeed: 750,
  hitStop: 0.045,
  invTime: 1.2,
  knockback: 220, knockDur: 0.18,
  atkBox: { w: 42, h: 30, ox: 26, oy: -4 },
  smashBox: { w: 30, h: 22, ox: 0, oy: 32 },
};

export const EN = {
  root_crawler: { hp: 2, spd: 65, dmg: 1, patrol: 110, w: 34, h: 24, score: 50, scrap: 1, family: 'dinosaur', sizeClass: 'weak' },
  gear_bug:     { hp: 2, spd: 95, dmg: 1, patrol: 140, w: 30, h: 22, score: 75, scrap: 1, family: 'machine',  sizeClass: 'weak' },
  flicker:      { hp: 3, spd: 55, dmg: 2, patrol: 90,  w: 32, h: 24, score: 100, scrap: 2, family: 'element',  sizeClass: 'weak',  flicker: true },
  heavy:        { hp: 12, spd: 35, dmg: 2, patrol: 70,  w: 46, h: 34, score: 200, scrap: 3, family: 'machine',  sizeClass: 'large', armored: true },

  /* ── New minor enemies (varied sizes) ───────────────────────── */
  // 3ft tiny ghost — weak, fast, float-hops toward Axel.
  wispling:     { hp: 1, spd: 120, dmg: 1, patrol: 160, w: 22, h: 20, score: 60, scrap: 1, family: 'spirit',   sizeClass: 'weak' },
  // 5ft skull-with-candle — mid-tier, tosses flame sparks while patrolling.
  candle_skull: { hp: 4, spd: 55,  dmg: 2, patrol: 130, w: 32, h: 42, score: 140, scrap: 2, family: 'spirit',   sizeClass: 'medium' },
  // 6ft moss-golem — heavy-class tank (not armored, just high HP), slow ground pounds.
  moss_golem:   { hp: 10, spd: 30, dmg: 3, patrol: 100, w: 50, h: 52, score: 220, scrap: 3, family: 'nature',   sizeClass: 'large' },
};

export const ASSIST = {
  max: 100, useCost: 100, // full meter per call (drains all)
  thresholds: [0.25, 0.50, 0.75], // < = GREEN, YELLOW, ORANGE, else RED
  levels: {
    green:  { name: 'GREEN',  color: '#7FE08A', label: 'Supply Drop' },
    yellow: { name: 'YELLOW', color: '#FFD447', label: 'Shotgun Entry' },
    orange: { name: 'ORANGE', color: '#FF9F43', label: 'Burn Smoke' },
    red:    { name: 'RED',    color: '#FF5A5A', label: 'Air Strike' },
  },
};

export const POWERS = {
  burning_buffalo: { name: 'Burning Buffalo', color: '#FD8C59', dur: 15, letter: 'B' },
  shadow_tag:      { name: 'Shadow Tag',      color: '#8B5CF6', dur: 15, letter: 'S' },
  golden_gloves:   { name: 'Golden Gloves',   color: '#FFD700', dur: 15, letter: 'G' },
  super_mode:      { name: 'Super Mode',      color: '#FF4444', dur: 15, letter: 'M' },
  specter_mode:    { name: 'Specter Mode',    color: '#88DDFF', dur: 15, letter: 'P' },
  fighter_plane:   { name: 'Fighter Plane',   color: '#44BB44', dur: 15, letter: 'F' },
  hyper_mode:      { name: 'Hyper Mode',      color: '#FF2ED5', dur: 12, letter: 'H' },
};

export const C = {
  sky: '#44505A', skyTop: '#2B3642', hills: '#566270',
  ground: '#5F4F3B', groundTop: '#6B5A45', platform: '#856A4E', platformEdge: '#6B5438',
  skin: '#8B6344', skinDk: '#704E35',
  cap: '#E23B2A', capDk: '#B82D20',
  hair: '#2A1810',
  outfit: '#4A6B8A', outfitDk: '#3A5570',
  glove: '#D43A2A',
  belt: '#6B5B3A',
  wrench: '#A0A8B0', wrenchHandle: '#D43A2A',
  eyeW: '#FFFFFF', eye: '#1A1A1A',
  noseBand: '#E8D5B5',
  boot: '#3A2E22',
  rcBody: '#4FA157', rcBelly: '#D1EB9E', rcEye: '#FA6149',
  gbBody: '#4AA8B0', gbInner: '#3A8890',
  flBody: '#946BC7', flGlow: '#B088E0',
  hvBody: '#6682A1', hvAccent: '#A3C766', hvPlate: '#566E88',
  // New minor enemies
  wpBody: '#E4F2FF', wpShade: '#B8D5F0', wpEye: '#4FB8FF',
  csBone: '#F4ECD8', csShade: '#C9BFA0', csFlame: '#FF9E3B', csFlameHi: '#FFE46B',
  mgBody: '#4E7A3A', mgMoss: '#89C65C', mgShade: '#345A26', mgEye: '#F7D75F',
  coin: '#F7D75F', coinShine: '#FFFACD',
  scrapC: '#7DA5BD', scrapDk: '#5A8098',
  food: '#73C46A', foodStem: '#3D7A35',
  brkWall: '#6E593F', brkCrack: '#584830',
  brkFloor: '#806440',
  bossDoor: '#EB7354',
  white: '#FFF', black: '#000',
  red: '#FF3B30', yellow: '#FFD60A', teal: '#00C7BE',
  hudBg: 'rgba(0,0,0,0.45)',
  hudBorder: 'rgba(255,255,255,0.8)',
};
