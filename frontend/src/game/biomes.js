// Biome levels — accessible from City Hub Mission Gate.
// Additional to the 10 story levels. Each biome reuses existing enemy
// classes with retints and themed configs.
import { createEnemy } from './enemies';

// Stable tiny PRNG — mulberry32. Lets dream_world be deterministic per seed.
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// --------- Dream World — procedural, floaty physics ---------
export function generateDreamWorld(seed = Date.now()) {
  const rand = mulberry32(seed);
  const platformCount = 10 + Math.floor(rand() * 16); // 10-25
  const platforms = [
    { x: -300, y: 420, w: 1800, h: 80 }, // safety ground
  ];
  const pickups = [];
  const enemies = [];
  for (let i = 0; i < platformCount; i++) {
    const px = 120 + rand() * 1100;
    const py = 140 + rand() * 260;
    const pw = 70 + Math.floor(rand() * 90);
    platforms.push({ x: px, y: py, w: pw, h: 14, dream: true });
    // 50% chance spawn a "fruit_energy" (food-like) on platform
    if (rand() < 0.55) {
      pickups.push({ type: 'food', x: px + pw / 2, y: py - 20 });
    }
    // 30% chance a "dream creature" (flicker reskin)
    if (rand() < 0.3) {
      enemies.push({ type: 'flicker', x: px + pw / 2, y: py - 10, dream: true });
    }
  }
  // Guaranteed Hyper Mode orb near start — dream world is the discovery zone
  pickups.push({ type: 'power', x: 220, y: 300, powerId: 'hyper_mode' });

  return {
    name: 'Dream World',
    biome: 'dream',
    environment: 'dream_world',
    playerSpawn: { x: 60, y: 380 },
    worldBounds: { left: -400, top: -600, right: 1400, bottom: 700 },
    camera: { smooth: 8 },
    gravityMul: 0.6, // floaty
    platforms,
    enemies,
    pickups,
    breakables: [],
    exitX: 1300,
    message: 'Dream World — gravity feels off…',
    hintTriggers: [
      { x: 60, y: 260, w: 140, h: 120, text: 'Everything is lighter here. Stretch your jumps.', color: '#FFB3FF' },
    ],
    seed,
  };
}

// Placeholder export for future dream seed helpers
export const DREAM_TAG = 'dream';

// --------- Fantasy Biomes (lava/sky/forest) ---------
export function getFantasyBiome(type) {
  const common = {
    biome: type,
    playerSpawn: { x: 60, y: 280 },
    worldBounds: { left: -300, top: -600, right: 1800, bottom: 700 },
    camera: { smooth: 8 },
    platforms: [
      { x: -300, y: 340, w: 900, h: 80 },
      { x: 700, y: 280, w: 240, h: 20 },
      { x: 1000, y: 220, w: 200, h: 20 },
      { x: 1260, y: 300, w: 600, h: 80 },
    ],
    breakables: [],
    exitX: 1700,
  };

  if (type === 'lava') {
    return {
      ...common,
      name: 'Emberfall',
      environment: 'lava_world',
      enemies: [
        { type: 'gear_bug', x: 200, y: 320, lava: true },      // fire beast (machine reskin)
        { type: 'root_crawler', x: 460, y: 320, lava: true },  // fire beast
        { type: 'heavy', x: 900, y: 246, lava: true },         // heavy fire chassis
      ],
      pickups: [
        { type: 'scrap', x: 280, y: 310 },
        { type: 'power', x: 820, y: 240, powerId: 'burning_buffalo' },
        { type: 'coin', x: 1100, y: 180 },
      ],
      message: 'Emberfall — the ground runs hot.',
      hintTriggers: [
        { x: 60, y: 260, w: 120, h: 120, text: 'Fire beasts ahead — Burning Buffalo matches their element', color: '#FF5533' },
      ],
      bossAfterClear: true,
    };
  }
  if (type === 'sky') {
    return {
      ...common,
      name: 'Cloudspire',
      environment: 'floating_islands',
      platforms: [
        { x: -200, y: 400, w: 600, h: 40 },
        { x: 480, y: 320, w: 140, h: 18 },
        { x: 700, y: 250, w: 120, h: 18 },
        { x: 900, y: 180, w: 140, h: 18 },
        { x: 1120, y: 250, w: 140, h: 18 },
        { x: 1320, y: 340, w: 480, h: 40 },
      ],
      enemies: [
        { type: 'flicker', x: 530, y: 280, sky: true },       // sky serpent
        { type: 'flicker', x: 940, y: 140, sky: true },       // sky serpent
        { type: 'gear_bug', x: 1400, y: 320, sky: true },     // mech serpent
      ],
      pickups: [
        { type: 'coin', x: 560, y: 300 },
        { type: 'power', x: 960, y: 160, powerId: 'hyper_mode' },
        { type: 'scrap', x: 1180, y: 230 },
      ],
      message: 'Cloudspire — one wrong step is a long fall.',
      hintTriggers: [
        { x: 60, y: 320, w: 140, h: 120, text: 'Sky serpents phase between clouds — time your strikes', color: '#88DDFF' },
      ],
      bossAfterClear: true,
    };
  }
  // forest (default)
  return {
    ...common,
    name: 'Verdanthold',
    environment: 'mystic_forest',
    enemies: [
      { type: 'root_crawler', x: 200, y: 320, forest: true }, // spirit creature
      { type: 'root_crawler', x: 520, y: 260, forest: true }, // spirit creature
      { type: 'flicker', x: 900, y: 220, forest: true },      // spirit wisp
    ],
    pickups: [
      { type: 'food', x: 300, y: 310 },
      { type: 'power', x: 820, y: 240, powerId: 'shadow_tag' },
      { type: 'scrap', x: 1180, y: 270 },
    ],
    message: 'Verdanthold — the trees remember your name.',
    hintTriggers: [
      { x: 60, y: 260, w: 140, h: 120, text: 'Spirit creatures flicker in the mist — shadow tag helps', color: '#AADDFF' },
    ],
    bossAfterClear: true,
    waterfallEvent: { triggerX: 900, duration: 5 }, // sample water event mid-level
  };
}

// Helper to apply biome tint to enemies after createEnemy
export function applyBiomeTint(enemy, tags) {
  if (tags.lava) enemy.tintColor = '#FF5533';
  else if (tags.sky) enemy.tintColor = '#88DDFF';
  else if (tags.forest) enemy.tintColor = '#AADDFF';
  else if (tags.dream) enemy.tintColor = '#FFB3FF';
  return enemy;
}
