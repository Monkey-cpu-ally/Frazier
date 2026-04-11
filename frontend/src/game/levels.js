// Level data translated from Godot .tscn scenes
// Coordinate system: world space, y-down, ground typically at y~288-336

export function getLevels() {
  return [
    // Level 0: Intro (based on Level1.tscn)
    {
      name: 'Overgrown Outskirts',
      playerSpawn: { x: -560, y: 286 },
      camera: { startX: -560, startY: 100, limitLeft: -1700, limitTop: -260, limitRight: 1700, limitBottom: 600 },
      deathY: 800,
      exitX: 880,
      backgrounds: [
        { type: 'sky', color1: '#2B3642', color2: '#44505A' },
        { type: 'hills', color: '#566270', points: [
          [-1800,140],[-1450,70],[-1120,145],[-760,62],[-420,155],[-80,72],
          [250,158],[590,84],[920,164],[1280,92],[1610,170],[1950,122],[2200,180],[2200,520],[-1800,520]
        ]},
      ],
      platforms: [
        // Main ground
        { x: -1700, y: 288, w: 3400, h: 48, color: '#5F4F3B', topColor: '#6B5A45' },
        // Platforms
        { x: 200, y: 230, w: 120, h: 20, color: '#856A4E' },
        { x: 400, y: 190, w: 120, h: 20, color: '#856A4E' },
        { x: 600, y: 150, w: 120, h: 20, color: '#856A4E' },
      ],
      enemies: [
        { type: 'root_crawler', x: -120, y: 286 },
        { type: 'root_crawler', x: 300, y: 286 },
      ],
      pickups: [
        { type: 'coin', x: 40, y: 260 },
        { type: 'coin', x: 96, y: 260 },
        { type: 'coin', x: 152, y: 260 },
        { type: 'food', x: 850, y: 264 },
        { type: 'coin', x: 260, y: 206 },
        { type: 'coin', x: 460, y: 166 },
        { type: 'coin', x: 660, y: 126 },
      ],
      breakables: [],
      message: 'WASD move | SPACE jump | X/J attack',
    },

    // Level 1: Climbing (based on Room2.tscn)
    {
      name: 'Rust Climb',
      playerSpawn: { x: -760, y: 286 },
      camera: { startX: -420, startY: 100, limitLeft: -1200, limitTop: -280, limitRight: 1600, limitBottom: 600 },
      deathY: 800,
      exitX: 1340,
      backgrounds: [
        { type: 'sky', color1: '#243038', color2: '#3A4A52' },
        { type: 'hills', color: '#4A5660', points: [
          [-1200,180],[-900,100],[-600,170],[-300,90],[0,180],[300,110],
          [600,190],[900,120],[1200,200],[1600,140],[1600,520],[-1200,520]
        ]},
      ],
      platforms: [
        { x: -1200, y: 288, w: 3400, h: 48, color: '#786D4F', topColor: '#887D5F' },
        // Climb platforms
        { x: -580, y: 250, w: 120, h: 20, color: '#856A4E' },
        { x: -410, y: 200, w: 120, h: 20, color: '#856A4E' },
        { x: -240, y: 150, w: 140, h: 20, color: '#856A4E' },
        // Narrow platforms
        { x: 820, y: 220, w: 80, h: 20, color: '#856A4E' },
        { x: 970, y: 180, w: 80, h: 20, color: '#856A4E' },
        { x: 1120, y: 140, w: 80, h: 20, color: '#856A4E' },
      ],
      enemies: [
        { type: 'root_crawler', x: -170, y: 148 },
        { type: 'gear_bug', x: 220, y: 286 },
        { type: 'root_crawler', x: 420, y: 286 },
      ],
      pickups: [
        { type: 'coin', x: 560, y: 260 },
        { type: 'coin', x: 620, y: 260 },
        { type: 'scrap', x: 680, y: 260 },
        { type: 'coin', x: 860, y: 196 },
        { type: 'coin', x: 1010, y: 156 },
        { type: 'scrap', x: 1160, y: 116 },
      ],
      breakables: [],
    },

    // Level 2: Secret Room (based on Room3.tscn)
    {
      name: 'Hidden Depths',
      playerSpawn: { x: -760, y: 286 },
      camera: { startX: -420, startY: 100, limitLeft: -1200, limitTop: -300, limitRight: 1300, limitBottom: 750 },
      deathY: 900,
      exitX: 1060,
      backgrounds: [
        { type: 'sky', color1: '#1E2A30', color2: '#334450' },
        { type: 'hills', color: '#3A4A54', points: [
          [-1200,200],[-800,130],[-400,200],[0,120],[400,210],[800,140],[1300,200],[1300,520],[-1200,520]
        ]},
      ],
      platforms: [
        { x: -1700, y: 288, w: 3400, h: 48, color: '#695939', topColor: '#796949' },
        // Secret area floor below
        { x: -90, y: 544, w: 360, h: 32, color: '#5C4D38' },
        // Return ramps
        { x: 280, y: 460, w: 120, h: 20, color: '#7A6247' },
        { x: 440, y: 390, w: 120, h: 20, color: '#7A6247' },
        // Main path return
        { x: 550, y: 288, w: 360, h: 24, color: '#695939' },
      ],
      enemies: [
        { type: 'flicker', x: -300, y: 260 },
        { type: 'root_crawler', x: 400, y: 286 },
      ],
      pickups: [
        { type: 'coin', x: -60, y: 516 },
        { type: 'coin', x: 10, y: 516 },
        { type: 'coin', x: 80, y: 516 },
        { type: 'scrap', x: 150, y: 516 },
      ],
      breakables: [
        { x: 36, y: 280, w: 88, h: 18, btype: 'floor', smashOnly: true },
      ],
      hint: 'Hint: Use downward smash (DOWN+X in air) on cracked floors!',
    },

    // Level 3: Power Room (based on Room4.tscn)
    {
      name: 'Buffalo Gate',
      playerSpawn: { x: -780, y: 286 },
      camera: { startX: -420, startY: 100, limitLeft: -1200, limitTop: -280, limitRight: 1400, limitBottom: 620 },
      deathY: 800,
      exitX: 1020,
      backgrounds: [
        { type: 'sky', color1: '#2A3A2A', color2: '#3E5240' },
        { type: 'hills', color: '#4A6048', points: [
          [-1200,160],[-800,100],[-400,170],[0,90],[400,180],[800,110],[1400,160],[1400,520],[-1200,520]
        ]},
      ],
      platforms: [
        { x: -1800, y: 288, w: 3600, h: 48, color: '#6E8966', topColor: '#7E9976' },
      ],
      enemies: [
        { type: 'gear_bug', x: -200, y: 286 },
        { type: 'root_crawler', x: 500, y: 286 },
      ],
      pickups: [
        { type: 'power', x: -510, y: 260, powerId: 'burning_buffalo' },
        { type: 'coin', x: 300, y: 260 },
        { type: 'coin', x: 360, y: 260 },
        { type: 'coin', x: 420, y: 260 },
        { type: 'scrap', x: 500, y: 260 },
      ],
      breakables: [
        { x: 90, y: 190, w: 40, h: 120, btype: 'wall', smashOnly: false },
      ],
      hint: 'Grab the Burning Buffalo power to smash through walls!',
    },

    // Level 4: Boss Arena (based on Room5.tscn + BossRoom.tscn)
    {
      name: 'Siege Core',
      playerSpawn: { x: -840, y: 286 },
      camera: { startX: -460, startY: 100, limitLeft: -1200, limitTop: -280, limitRight: 1600, limitBottom: 620 },
      deathY: 800,
      exitX: 1020,
      backgrounds: [
        { type: 'sky', color1: '#1A1E28', color2: '#2A3038' },
        { type: 'hills', color: '#343E4A', points: [
          [-1200,190],[-800,120],[-400,190],[0,100],[400,200],[800,130],[1600,180],[1600,520],[-1200,520]
        ]},
      ],
      platforms: [
        { x: -1900, y: 288, w: 3800, h: 48, color: '#5E4F3B', topColor: '#6E5F4B' },
      ],
      enemies: [
        { type: 'heavy', x: 360, y: 286 },
        { type: 'gear_bug', x: -200, y: 286 },
        { type: 'flicker', x: 100, y: 260 },
        { type: 'root_crawler', x: 600, y: 286 },
      ],
      pickups: [
        { type: 'power', x: -600, y: 260, powerId: 'golden_gloves' },
        { type: 'scrap', x: -400, y: 260 },
        { type: 'coin', x: 800, y: 260 },
        { type: 'food', x: 900, y: 264 },
      ],
      breakables: [],
      isBoss: true,
      boss: {
        x: 340, y: 286,
        triggerX: -200,
        arenaLeft: -250,
        arenaRight: 850,
      },
      foxSpirit: {
        x: 560, y: 240,
      },
      message: 'Rootbound Siege Tank ahead! Grab Golden Gloves!',
    },
  ];
}
