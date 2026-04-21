// Level data translated from Godot .tscn scenes
// Coordinate system: world space, y-down, ground typically at y~288-336

export function getLevels(newGamePlus = false) {
  const levels = [
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
      dialogueId: 'boss_enter',
    },

    // === NEW LEVELS 5-9 ===

    // Level 5: Underground Workshop (Scrap's old base)
    {
      name: "Scrap's Workshop",
      playerSpawn: { x: -700, y: 286 },
      camera: { startX: -400, startY: 100, limitLeft: -1400, limitTop: -300, limitRight: 1800, limitBottom: 650 },
      deathY: 850,
      exitX: 1500,
      dialogueId: 'workshop_enter',
      backgrounds: [
        { type: 'sky', color1: '#141A14', color2: '#1E2A1E' },
        { type: 'hills', color: '#2A3A2A', points: [
          [-1400,220],[-1000,160],[-600,230],[-200,140],[200,220],[600,150],[1000,240],[1400,170],[1800,220],[1800,520],[-1400,520]
        ]},
      ],
      platforms: [
        { x: -1400, y: 288, w: 3200, h: 48, color: '#3A4A3A', topColor: '#4A5A4A' },
        // Workbenches
        { x: -300, y: 230, w: 160, h: 20, color: '#5A4A3A' },
        { x: 100, y: 200, w: 140, h: 20, color: '#5A4A3A' },
        { x: 400, y: 170, w: 120, h: 20, color: '#5A4A3A' },
        // Pipe platforms
        { x: 700, y: 230, w: 100, h: 16, color: '#4A6A6A' },
        { x: 880, y: 190, w: 100, h: 16, color: '#4A6A6A' },
        { x: 1060, y: 150, w: 100, h: 16, color: '#4A6A6A' },
        // Upper shelf
        { x: 1200, y: 120, w: 200, h: 20, color: '#5A4A3A' },
      ],
      enemies: [
        { type: 'gear_bug', x: -100, y: 286 },
        { type: 'gear_bug', x: 300, y: 286 },
        { type: 'heavy', x: 800, y: 286 },
        { type: 'flicker', x: 1100, y: 240 },
      ],
      pickups: [
        { type: 'scrap', x: -200, y: 206 },
        { type: 'coin', x: 150, y: 176 },
        { type: 'coin', x: 450, y: 146 },
        { type: 'power', x: 600, y: 260, powerId: 'shadow_tag' },
        { type: 'food', x: 1300, y: 96 },
        { type: 'scrap', x: 1350, y: 96 },
      ],
      breakables: [
        { x: 1050, y: 280, w: 80, h: 18, btype: 'floor', smashOnly: true },
      ],
      mirrorFragment: { x: 1080, y: 500 },
    },

    // Level 6: Canopy Run (treetop platforming)
    {
      name: 'Canopy Run',
      playerSpawn: { x: -800, y: 186 },
      camera: { startX: -500, startY: 0, limitLeft: -1600, limitTop: -400, limitRight: 2200, limitBottom: 700 },
      deathY: 750,
      exitX: 1900,
      dialogueId: 'canopy_enter',
      backgrounds: [
        { type: 'sky', color1: '#1A2E20', color2: '#2A4A30' },
        { type: 'hills', color: '#3A5A3A', points: [
          [-1600,200],[-1200,120],[-800,210],[-400,100],[0,200],[400,110],[800,220],[1200,130],[1600,200],[2200,160],[2200,520],[-1600,520]
        ]},
      ],
      platforms: [
        // Tree branches (no main ground — platforming focused!)
        { x: -850, y: 200, w: 180, h: 22, color: '#5A4030', topColor: '#4A7A40' },
        { x: -550, y: 170, w: 120, h: 18, color: '#5A4030' },
        { x: -320, y: 140, w: 100, h: 16, color: '#5A4030' },
        { x: -100, y: 180, w: 160, h: 20, color: '#5A4030', topColor: '#4A7A40' },
        { x: 120, y: 140, w: 80, h: 14, color: '#5A4030' },
        { x: 280, y: 110, w: 100, h: 16, color: '#5A4030' },
        { x: 460, y: 150, w: 140, h: 18, color: '#5A4030', topColor: '#4A7A40' },
        { x: 680, y: 120, w: 80, h: 14, color: '#5A4030' },
        { x: 820, y: 160, w: 120, h: 18, color: '#5A4030' },
        { x: 1000, y: 130, w: 100, h: 16, color: '#5A4030' },
        { x: 1200, y: 170, w: 160, h: 20, color: '#5A4030', topColor: '#4A7A40' },
        { x: 1450, y: 140, w: 120, h: 18, color: '#5A4030' },
        { x: 1650, y: 180, w: 200, h: 22, color: '#5A4030', topColor: '#4A7A40' },
        // Safety net (very low)
        { x: -200, y: 500, w: 2000, h: 40, color: '#2A3020' },
      ],
      enemies: [
        { type: 'flicker', x: -50, y: 150 },
        { type: 'root_crawler', x: 500, y: 148 },
        { type: 'flicker', x: 850, y: 130 },
        { type: 'gear_bug', x: 1250, y: 168 },
      ],
      pickups: [
        { type: 'coin', x: -500, y: 146 },
        { type: 'coin', x: -280, y: 116 },
        { type: 'coin', x: 160, y: 116 },
        { type: 'scrap', x: 320, y: 86 },
        { type: 'coin', x: 720, y: 96 },
        { type: 'power', x: 1050, y: 106, powerId: 'specter_mode' },
        { type: 'food', x: 1500, y: 116 },
        { type: 'coin', x: 1700, y: 156 },
      ],
      breakables: [],
      hint: 'No ground below! Jump carefully between branches!',
    },

    // Level 7: Pipe Network (industrial pipes + water)
    {
      name: 'Pipe Network',
      playerSpawn: { x: -700, y: 286 },
      camera: { startX: -400, startY: 100, limitLeft: -1400, limitTop: -350, limitRight: 2000, limitBottom: 700 },
      deathY: 850,
      exitX: 1700,
      dialogueId: 'pipe_enter',
      backgrounds: [
        { type: 'sky', color1: '#0E1820', color2: '#1A2830' },
        { type: 'hills', color: '#243040', points: [
          [-1400,180],[-1000,120],[-600,190],[-200,100],[200,180],[600,110],[1000,200],[1400,130],[2000,180],[2000,520],[-1400,520]
        ]},
      ],
      platforms: [
        { x: -1400, y: 288, w: 3400, h: 48, color: '#3A4050', topColor: '#4A5060' },
        // Pipe sections
        { x: -400, y: 220, w: 200, h: 16, color: '#5A6A7A' },
        { x: -100, y: 180, w: 160, h: 16, color: '#5A6A7A' },
        { x: 200, y: 240, w: 180, h: 16, color: '#5A6A7A' },
        // Vertical wall for wall-jumping
        { x: 500, y: 120, w: 24, h: 168, color: '#4A5A6A' },
        { x: 600, y: 100, w: 140, h: 18, color: '#5A6A7A' },
        // More pipes
        { x: 850, y: 200, w: 120, h: 16, color: '#5A6A7A' },
        { x: 1050, y: 160, w: 100, h: 16, color: '#5A6A7A' },
        // Wall jump section
        { x: 1200, y: 80, w: 24, h: 210, color: '#4A5A6A' },
        { x: 1350, y: 80, w: 24, h: 210, color: '#4A5A6A' },
        { x: 1200, y: 80, w: 174, h: 18, color: '#5A6A7A' },
        { x: 1500, y: 200, w: 200, h: 20, color: '#5A6A7A' },
      ],
      enemies: [
        { type: 'gear_bug', x: -200, y: 286 },
        { type: 'heavy', x: 300, y: 286 },
        { type: 'flicker', x: 700, y: 260 },
        { type: 'gear_bug', x: 900, y: 286 },
        { type: 'root_crawler', x: 1400, y: 286 },
      ],
      pickups: [
        { type: 'coin', x: -350, y: 196 },
        { type: 'coin', x: -50, y: 156 },
        { type: 'scrap', x: 250, y: 216 },
        { type: 'power', x: 650, y: 76, powerId: 'super_mode' },
        { type: 'coin', x: 890, y: 176 },
        { type: 'food', x: 1100, y: 136 },
        { type: 'scrap', x: 1270, y: 60 },
      ],
      breakables: [
        { x: 1050, y: 280, w: 100, h: 18, btype: 'floor', smashOnly: true },
      ],
      mirrorFragment: { x: 1275, y: 500 },
      hint: 'Use wall jumps (jump while sliding on walls) to reach high areas!',
    },

    // Level 8: Mirror Vault (crystal-themed)
    {
      name: 'Mirror Vault',
      playerSpawn: { x: -600, y: 286 },
      camera: { startX: -300, startY: 100, limitLeft: -1200, limitTop: -350, limitRight: 1800, limitBottom: 650 },
      deathY: 850,
      exitX: 1500,
      dialogueId: 'vault_enter',
      backgrounds: [
        { type: 'sky', color1: '#100818', color2: '#1A1028' },
        { type: 'hills', color: '#2A1A3A', points: [
          [-1200,180],[-800,110],[-400,190],[0,100],[400,180],[800,120],[1200,200],[1800,150],[1800,520],[-1200,520]
        ]},
      ],
      platforms: [
        { x: -1200, y: 288, w: 3000, h: 48, color: '#2A2040', topColor: '#3A3050' },
        // Crystal platforms
        { x: -300, y: 220, w: 120, h: 18, color: '#4A3A6A' },
        { x: -50, y: 180, w: 100, h: 16, color: '#4A3A6A' },
        { x: 200, y: 140, w: 140, h: 18, color: '#4A3A6A' },
        { x: 450, y: 200, w: 120, h: 16, color: '#4A3A6A' },
        { x: 650, y: 160, w: 100, h: 16, color: '#4A3A6A' },
        { x: 850, y: 120, w: 160, h: 18, color: '#4A3A6A' },
        { x: 1100, y: 180, w: 140, h: 18, color: '#4A3A6A' },
        { x: 1300, y: 140, w: 120, h: 16, color: '#4A3A6A' },
      ],
      enemies: [
        { type: 'flicker', x: -200, y: 260 },
        { type: 'flicker', x: 300, y: 260 },
        { type: 'heavy', x: 600, y: 286 },
        { type: 'flicker', x: 900, y: 200 },
        { type: 'gear_bug', x: 1150, y: 286 },
      ],
      pickups: [
        { type: 'coin', x: -250, y: 196 },
        { type: 'power', x: 0, y: 156, powerId: 'specter_mode' },
        { type: 'coin', x: 250, y: 116 },
        { type: 'scrap', x: 500, y: 176 },
        { type: 'coin', x: 700, y: 136 },
        { type: 'food', x: 1000, y: 260 },
        { type: 'scrap', x: 1350, y: 116 },
        { type: 'foxstatue', x: 1100, y: 288 },
      ],
      breakables: [
        { x: 700, y: 280, w: 90, h: 18, btype: 'floor', smashOnly: true },
      ],
      mirrorFragment: { x: 740, y: 500 },
      hint: 'A strange energy resonates here... mirror fragments nearby.',
    },

    // Level 9: Shattered Core (final level — all enemy types, leads to ending)
    {
      name: 'Shattered Core',
      playerSpawn: { x: -800, y: 286 },
      camera: { startX: -500, startY: 100, limitLeft: -1600, limitTop: -350, limitRight: 2200, limitBottom: 650 },
      deathY: 850,
      exitX: 1900,
      dialogueId: 'core_enter',
      backgrounds: [
        { type: 'sky', color1: '#080410', color2: '#140C20' },
        { type: 'hills', color: '#1E1430', points: [
          [-1600,180],[-1100,100],[-600,190],[-100,80],[400,180],[900,100],[1400,200],[1900,120],[2200,180],[2200,520],[-1600,520]
        ]},
      ],
      platforms: [
        { x: -1600, y: 288, w: 3800, h: 48, color: '#1E1430', topColor: '#2E2440' },
        // Gauntlet platforms
        { x: -500, y: 230, w: 140, h: 20, color: '#3A2A4A' },
        { x: -250, y: 190, w: 120, h: 18, color: '#3A2A4A' },
        { x: 0, y: 150, w: 100, h: 16, color: '#3A2A4A' },
        { x: 250, y: 200, w: 160, h: 20, color: '#3A2A4A' },
        { x: 500, y: 160, w: 120, h: 18, color: '#3A2A4A' },
        { x: 750, y: 120, w: 140, h: 18, color: '#3A2A4A' },
        // Wall jump corridor
        { x: 1000, y: 50, w: 24, h: 240, color: '#2A1A3A' },
        { x: 1200, y: 50, w: 24, h: 240, color: '#2A1A3A' },
        { x: 1000, y: 50, w: 224, h: 18, color: '#3A2A4A' },
        // Final stretch
        { x: 1350, y: 200, w: 200, h: 20, color: '#3A2A4A' },
        { x: 1650, y: 230, w: 250, h: 22, color: '#3A2A4A', topColor: '#4A3A5A' },
      ],
      enemies: [
        { type: 'root_crawler', x: -400, y: 286 },
        { type: 'gear_bug', x: -100, y: 286 },
        { type: 'flicker', x: 200, y: 240 },
        { type: 'heavy', x: 500, y: 286 },
        { type: 'gear_bug', x: 800, y: 286 },
        { type: 'flicker', x: 1100, y: 200 },
        { type: 'root_crawler', x: 1400, y: 286 },
        { type: 'heavy', x: 1700, y: 286 },
      ],
      pickups: [
        { type: 'power', x: -600, y: 260, powerId: 'burning_buffalo' },
        { type: 'coin', x: -200, y: 166 },
        { type: 'scrap', x: 50, y: 126 },
        { type: 'power', x: 300, y: 176, powerId: 'golden_gloves' },
        { type: 'food', x: 600, y: 136 },
        { type: 'coin', x: 800, y: 96 },
        { type: 'scrap', x: 1100, y: 30 },
        { type: 'food', x: 1500, y: 176 },
        { type: 'power', x: 1750, y: 206, powerId: 'super_mode' },
      ],
      breakables: [
        { x: 400, y: 280, w: 80, h: 18, btype: 'floor', smashOnly: true },
      ],
      mirrorFragment: { x: 440, y: 500 },
      isBoss: false,
      message: 'The final stretch. Everything you have learned leads here.',
    },
  ];

  // NEW GAME+ modifications
  if (newGamePlus) {
    // Relocate mirror fragments to different levels/positions
    levels.forEach(l => { l.mirrorFragment = null; l._fragmentCollected = false; });

    // NG+ fragment locations (different from normal)
    if (levels[1]) levels[1].mirrorFragment = { x: 1100, y: 116 }; // Rust Climb high platform
    if (levels[3]) levels[3].mirrorFragment = { x: -400, y: 260 }; // Buffalo Gate start area
    if (levels[5]) levels[5].mirrorFragment = { x: 300, y: 166 }; // Workshop bench
    if (levels[8]) levels[8].mirrorFragment = { x: 1350, y: 116 }; // Mirror Vault end

    // Add hidden 11th level: The Other Side of the Mirror
    levels.push({
      name: 'The Other Side',
      playerSpawn: { x: -600, y: 286 },
      camera: { startX: -300, startY: 100, limitLeft: -1400, limitTop: -400, limitRight: 2400, limitBottom: 700 },
      deathY: 850,
      exitX: 2100,
      dialogueId: 'core_enter',
      backgrounds: [
        { type: 'sky', color1: '#180420', color2: '#0A0210' },
        { type: 'hills', color: '#1A0A2A', points: [
          [-1400,160],[-900,80],[-400,170],[100,60],[600,160],[1100,70],[1600,180],[2100,100],[2400,160],[2400,520],[-1400,520]
        ]},
      ],
      platforms: [
        { x: -1400, y: 288, w: 3800, h: 48, color: '#150A20', topColor: '#251A30' },
        // Mirror platforms (reflective aesthetic)
        { x: -300, y: 210, w: 100, h: 14, color: '#3A2A5A' },
        { x: -50, y: 170, w: 80, h: 12, color: '#3A2A5A' },
        { x: 200, y: 130, w: 120, h: 14, color: '#3A2A5A' },
        { x: 450, y: 180, w: 100, h: 14, color: '#3A2A5A' },
        { x: 650, y: 140, w: 80, h: 12, color: '#3A2A5A' },
        // Wall jump corridor
        { x: 850, y: 40, w: 24, h: 250, color: '#2A1A3A' },
        { x: 1050, y: 40, w: 24, h: 250, color: '#2A1A3A' },
        { x: 850, y: 40, w: 224, h: 16, color: '#3A2A5A' },
        // Final platforms
        { x: 1200, y: 200, w: 160, h: 18, color: '#3A2A5A' },
        { x: 1450, y: 160, w: 140, h: 16, color: '#3A2A5A' },
        { x: 1700, y: 120, w: 120, h: 14, color: '#3A2A5A' },
        { x: 1900, y: 200, w: 200, h: 20, color: '#3A2A5A', topColor: '#4A3A6A' },
      ],
      enemies: [
        { type: 'flicker', x: -200, y: 260 },
        { type: 'heavy', x: 100, y: 286 },
        { type: 'flicker', x: 400, y: 240 },
        { type: 'gear_bug', x: 600, y: 286 },
        { type: 'heavy', x: 950, y: 286 },
        { type: 'flicker', x: 1250, y: 200 },
        { type: 'root_crawler', x: 1500, y: 286 },
        { type: 'heavy', x: 1750, y: 286 },
        { type: 'flicker', x: 1950, y: 260 },
      ],
      pickups: [
        { type: 'power', x: -400, y: 260, powerId: 'super_mode' },
        { type: 'food', x: 0, y: 146 },
        { type: 'scrap', x: 250, y: 106 },
        { type: 'power', x: 500, y: 156, powerId: 'golden_gloves' },
        { type: 'food', x: 700, y: 260 },
        { type: 'power', x: 950, y: 20, powerId: 'specter_mode' },
        { type: 'food', x: 1300, y: 176 },
        { type: 'power', x: 1600, y: 136, powerId: 'burning_buffalo' },
        { type: 'food', x: 1850, y: 260 },
      ],
      breakables: [
        { x: 1100, y: 280, w: 100, h: 18, btype: 'floor', smashOnly: true },
      ],
      mirrorFragment: { x: 1130, y: 500 }, // 5th secret fragment!
      message: 'NG+ SECRET LEVEL: The Other Side of the Mirror',
      hint: 'Reality is inverted here. The 5th fragment awaits.',
    });
  }

  return levels;
}
