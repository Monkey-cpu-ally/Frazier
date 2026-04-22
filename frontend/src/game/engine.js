import { W, H, C } from './constants';
import { Input } from './input';
import { Camera } from './camera';
import { Player } from './player';
import { GameState, PowerManager, FlightLog, AchievementTracker } from './systems';
import { createEnemy } from './enemies';
import { createPickup, Breakable } from './pickups';
import { getLevels, getCityHub } from './levels';
import { generateDreamWorld, getFantasyBiome } from './biomes';
import { HUD } from './hud';
import { Boss, FoxSpirit } from './boss';
import { sfx } from './sfx';

// Mario-stomp bounce velocities (negative = upward; engine uses screen-y)
const PL_STOMP_BOUNCE      = -360;
const PL_STOMP_BOUNCE_HIGH = -520;
import { DialogueManager } from './dialogue';
import { SecretEnding } from './secretEnding';
import { triggerScrapAssist } from './assists';

export class Engine {
  constructor(canvas, onStateChange) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = W;
    canvas.height = H;
    this.onStateChange = onStateChange || (() => {});
    this.paused = false;

    // roundRect polyfill for older Safari/Firefox
    if (typeof CanvasRenderingContext2D !== 'undefined' &&
        typeof CanvasRenderingContext2D.prototype.roundRect !== 'function') {
      CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (typeof r === 'number') r = [r, r, r, r];
        else if (!Array.isArray(r)) r = [0, 0, 0, 0];
        this.moveTo(x + r[0], y);
        this.lineTo(x + w - r[1], y);
        this.quadraticCurveTo(x + w, y, x + w, y + r[1]);
        this.lineTo(x + w, y + h - r[2]);
        this.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
        this.lineTo(x + r[3], y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r[3]);
        this.lineTo(x, y + r[0]);
        this.quadraticCurveTo(x, y, x + r[0], y);
        return this;
      };
    }

    this.input = new Input();
    this.camera = new Camera(W, H);
    this.gameState = new GameState();
    this.powerManager = new PowerManager();
    this.flightLog = new FlightLog();
    this.hud = new HUD();
    this.achievements = new AchievementTracker((id) => {
      if (this.onAchievementUnlock) this.onAchievementUnlock(id);
    });
    this.onAchievementUnlock = null;
    // Speedrun timer (ms since start)
    this.runTimerMs = 0;
    this.speedrunMode = false;
    this.runStartMs = null;
    this.runFinalMs = null;
    this.levelsCompleted = 0;
    this.equippedSkin = 'standard';
    // Daily challenge modifier (applied when speedrunMode + dailyMode are both on)
    this.dailyModifier = null;
    this.dailyMode = false;

    // Preload background image
    this.bgImage = new Image();
    this.bgImage.src = 'https://static.prod-images.emergentagent.com/jobs/373297d6-1933-47c6-98ac-bd4bef2c6b43/images/e352993c8b6ad491a1f19da7bb7f3a7aa5ade71deb48994a814b5024daf01114.png';
    this.bgImageLoaded = false;
    this.bgImage.onload = () => { this.bgImageLoaded = true; };

    // Preload pixel-art character sprites (generated via Gemini Nano Banana).
    // Access via engine.sprites.axel / .scrap / .root_crawler / etc.
    this.sprites = {};
    ['axel', 'scrap', 'root_crawler', 'gear_bug', 'flicker', 'heavy', 'boss'].forEach(id => {
      const img = new Image();
      img.src = `/sprites/${id}.png`;
      img.loaded = false;
      img.onload = () => { img.loaded = true; };
      this.sprites[id] = img;
    });

    this.player = null;
    this.enemies = [];
    this.pickups = [];
    this.breakables = [];
    this.platforms = [];
    this.particles = [];
    this.assists = [];
    this.assistUpgradeBonus = 0;
    this.assistMalfunctionReduction = 0;
    this.ambientParticles = this._initAmbient();
    this.boss = null;
    this.foxSpirit = null;
    this.sfx = sfx;
    this.dialogue = new DialogueManager();
    this.mirrorFragments = 0;
    this.totalFragments = 4;
    this.secretEndingTriggered = false;
    this.secretEnding = null;
    this.newGamePlus = false;
    this.ngPlusMultiplier = 1.5;
    this.showFlightLog = false;
    this.levels = getLevels();
    this.currentLevelIndex = 0;
    this.currentLevel = null;
    this.deathY = 800;
    this.levelTimer = 0;
    this.bossActivated = false;

    this.state = 'playing';
    this.transitionTimer = 0;
    this.transitionType = 'in';
    this.hitStopTimer = 0;
    this.gameOverTimer = 0;

    this.lastTime = 0;
    this.running = false;
  }

  start(startLevel = 0) {
    this.gameState.reset();
    this.powerManager.reset();
    this.flightLog.entries = [];
    this.dialogue.reset();
    this.mirrorFragments = 0;
    this.secretEndingTriggered = false;
    this.levels = getLevels(this.newGamePlus);
    this.totalFragments = this.newGamePlus ? 5 : 4;
    this.levelsCompleted = 0;
    this.runStartMs = performance.now();
    this.runFinalMs = null;
    this.runTimerMs = 0;
    this.loadLevel(Math.max(0, Math.min(startLevel, this.levels.length - 1)));
    this.achievements.onLevelStart(Math.max(0, Math.min(startLevel, this.levels.length - 1)));
    this.running = true;
    this.lastTime = performance.now();
    this.flightLog.add('System boot. Scanning sector...', 'system');
    this._loop();
  }

  startHub() {
    this.gameState.reset();
    this.powerManager.reset();
    this.flightLog.entries = [];
    this.dialogue.reset();
    this.mirrorFragments = 0;
    this.secretEndingTriggered = false;
    // Build a one-level "hub mode" so the existing loadLevel path works.
    this.levels = [getCityHub()];
    this.totalFragments = 4;
    this.levelsCompleted = 0;
    this.runStartMs = null;
    this.runFinalMs = null;
    this.runTimerMs = 0;
    this.loadLevel(0);
    this.running = true;
    this.lastTime = performance.now();
    this.flightLog.add('Welcome to the Overgrowth.', 'system');
    this._loop();
  }

  startBiome(biomeLevel) {
    this.gameState.reset();
    this.powerManager.reset();
    this.flightLog.entries = [];
    this.dialogue.reset();
    this.mirrorFragments = 0;
    this.secretEndingTriggered = false;
    this.levels = [biomeLevel];
    this.totalFragments = 4;
    this.levelsCompleted = 0;
    this.runStartMs = performance.now();
    this.runFinalMs = null;
    this.runTimerMs = 0;
    this.loadLevel(0);
    this.running = true;
    this.lastTime = performance.now();
    this.flightLog.add(`Deploying to ${biomeLevel.name}.`, 'system');
    this._loop();
  }

  restart(levelIndex = 0) {
    this.gameState.reset();
    this.powerManager.reset();
    this.flightLog.entries = [];
    this.dialogue.reset();
    this.particles = [];
    this.gameOverTimer = 0;
    this.mirrorFragments = 0;
    this.secretEndingTriggered = false;
    this.secretEnding = null;
    this.state = 'playing';
    this.levels = getLevels(this.newGamePlus);
    if (this.newGamePlus) {
      this.totalFragments = 5;
    } else {
      this.totalFragments = 4;
    }
    const safeIdx = Math.max(0, Math.min(levelIndex, this.levels.length - 1));
    this.loadLevel(safeIdx);
    this.flightLog.add(this.newGamePlus ? 'NG+ initialized. Reality unstable.' : 'Rebooting systems...', 'system');
    this.onStateChange('playing');
  }

  startNewGamePlus() {
    this.newGamePlus = true;
    this.restart();
    this.flightLog.add('NEW GAME+ activated. Enemies enhanced.', 'system');
  }

  stop() { this.running = false; this.input.destroy(); }

  _spawnBiomeBossWave() {
    // Spawn a stronger wave of 3 biome-tinted enemies as a "boss stand-in"
    const tint = this.biome === 'lava' ? '#FF5533'
               : this.biome === 'sky' ? '#88DDFF'
               : this.biome === 'forest' ? '#AADDFF'
               : '#FF2ED5';
    const baseX = this.player.x + 220;
    const baseY = this.player.y - 20;
    const mix = this.biome === 'sky' ? ['flicker', 'flicker', 'heavy']
              : this.biome === 'lava' ? ['gear_bug', 'heavy', 'heavy']
              : ['root_crawler', 'flicker', 'heavy'];
    mix.forEach((type, i) => {
      const e = createEnemy({ type, x: baseX + i * 90, y: baseY });
      e.tintColor = tint;
      e.hp *= 2; e.maxHp = e.hp;
      e.speed *= 1.25;
      this.enemies.push(e);
    });
    // Flag the arena barrier — render at camera right edge
    this.bossArenaActive = true;
  }

  loadLevel(index) {
    if (index >= this.levels.length) {
      // Freeze run timer
      if (this.runFinalMs === null && this.runStartMs !== null) {
        this.runFinalMs = performance.now() - this.runStartMs;
      }
      // Mark levels completed total
      this.levelsCompleted = this.levels.length;
      if (this.achievements) {
        this.achievements.syncTotals({
          levelsCompleted: this.levelsCompleted,
          score: this.gameState.score,
        });
      }
      // Check if secret ending should play
      if (this.mirrorFragments >= this.totalFragments && !this.secretEndingTriggered) {
        this.secretEndingTriggered = true;
        this.state = 'secret_ending';
        this.secretEnding = new SecretEnding(this.canvas, () => {
          this.state = 'victory';
          this.onStateChange('victory');
        });
        this.secretEnding.start();
        sfx.levelComplete();
        return;
      }
      this.state = 'victory';
      this.onStateChange('victory');
      sfx.levelComplete();
      return;
    }
    const lv = this.levels[index];
    this.currentLevelIndex = index;
    this.currentLevel = lv;
    this.deathY = lv.deathY || 800;
    this.levelTimer = 0;
    this.bossActivated = false;

    this.player = new Player(lv.playerSpawn.x, lv.playerSpawn.y);
    // Apply equipped wrench skin color
    const SKIN_COLORS = {
      standard: '#A0A8B0', rusty: '#8B6B4A', golden: '#FFD700', neon: '#00FFB3',
      ember: '#FF5533', frost: '#88DDFF', shadow: '#8B5CF6', scrap_special: '#7DA5BD',
    };
    this.player.skinColor = SKIN_COLORS[this.equippedSkin] || SKIN_COLORS.standard;
    this.enemies = (lv.enemies || []).map(e => {
      const enemy = createEnemy(e);
      // Biome tint — color-wash applied in enemy render path via tintColor
      if (e.lava) enemy.tintColor = '#FF5533';
      else if (e.sky) enemy.tintColor = '#88DDFF';
      else if (e.forest) enemy.tintColor = '#AADDFF';
      else if (e.dream) enemy.tintColor = '#FFB3FF';
      if (this.newGamePlus) {
        enemy.speed *= this.ngPlusMultiplier;
        enemy.hp = Math.ceil(enemy.hp * 1.3);
        enemy.maxHp = enemy.hp;
      }
      // Daily Challenge: enemy speed buff
      if (this.dailyMode && this.dailyModifier) {
        const mul = this.dailyModifier.enemy_speed_mul;
        if (mul) enemy.speed *= mul;
      }
      return enemy;
    });
    this.pickups = (lv.pickups || []).map(p => createPickup(p));
    this.breakables = (lv.breakables || []).map(b =>
      new Breakable(b.x, b.y, b.w, b.h, b.btype, b.smashOnly)
    );
    this.assists = [];
    // Biome / event modifiers
    this.gravityMul = lv.gravityMul || 1;
    this.waterfallActive = false;
    this.waterfallTimer = 0;
    this.waterfallEventFired = false;
    this.waterfallConfig = lv.waterfallEvent || null;
    this.fallingRocks = [];
    this.bossAfterClear = !!lv.bossAfterClear;
    this.biome = lv.biome || null;
    // Hint prompt triggers — fire once when Axel walks into the area
    this.hintTriggers = (lv.hintTriggers || []).map(h => ({
      x: h.x, y: h.y, w: h.w || 80, h: h.h || 120,
      text: h.text, color: h.color || '#FFD68F',
      triggered: false,
    }));

    // Boss setup
    if (lv.isBoss && lv.boss) {
      this.boss = new Boss(lv.boss.x, lv.boss.y);
      this.boss.arenaLeft = lv.boss.arenaLeft || -200;
      this.boss.arenaRight = lv.boss.arenaRight || 800;
    } else {
      this.boss = null;
    }

    // Fox Spirit setup
    if (lv.foxSpirit) {
      this.foxSpirit = new FoxSpirit(lv.foxSpirit.x, lv.foxSpirit.y);
    } else {
      this.foxSpirit = null;
    }

    this.platforms = [...(lv.platforms || [])];

    this.camera.setLimits(lv.camera.limitLeft, lv.camera.limitTop, lv.camera.limitRight, lv.camera.limitBottom);
    this.camera.x = lv.camera.startX - W / 2;
    this.camera.y = lv.camera.startY - H / 2;
    // Clamp bounds for player — prevents walking off into the void.
    // Leave ~80px of room so they can reach exit trigger at lv.exitX.
    this.playerMinX = (lv.playerMinX !== undefined)
      ? lv.playerMinX
      : (lv.camera.limitLeft - W / 2 + 40);
    this.playerMaxX = (lv.playerMaxX !== undefined)
      ? lv.playerMaxX
      : (lv.exitX !== undefined ? lv.exitX + 80 : lv.camera.limitRight + W / 2 - 40);

    this.state = 'transition';
    this.transitionTimer = 0.8;
    this.transitionType = 'in';
    this.flightLog.add(`Entering: ${lv.name}`, 'nav');

    // Trigger level dialogue
    if (lv.dialogueId) {
      setTimeout(() => this.dialogue.trigger(lv.dialogueId), 1200);
    }
  }

  _loop = () => {
    if (!this.running) return;
    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (dt > 0.05) dt = 0.05;

    // When paused, skip updates but keep rendering and schedule next frame
    if (this.paused) {
      this._render();
      // Reset lastTime so pause duration doesn't leak into dt on resume
      this.lastTime = performance.now();
      requestAnimationFrame(this._loop);
      return;
    }

    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      this.input.update();
      this._render();
      requestAnimationFrame(this._loop);
      return;
    }

    this.input.update();

    if (this.state === 'playing') {
      // Dialogue blocks gameplay input
      if (this.dialogue.active) {
        this.dialogue.update(dt);
        if (this.input.jump || this.input.attack) {
          this.dialogue.advance();
        }
        this._render();
        requestAnimationFrame(this._loop);
        return;
      }
      this._update(dt);
    } else if (this.state === 'transition') {
      this.transitionTimer -= dt;
      if (this.transitionTimer <= 0) {
        this.state = 'playing';
      }
    } else if (this.state === 'gameover') {
      this.gameOverTimer += dt;
      if (this.input.jump && this.gameOverTimer > 1) {
        this.restart();
      }
    } else if (this.state === 'victory') {
      if (this.input.just('KeyN') && !this.newGamePlus) {
        this.startNewGamePlus();
      } else if (this.input.jump) {
        this.restart();
      }
    } else if (this.state === 'secret_ending') {
      // Secret ending handles its own loop via SecretEnding class
      if (this.input.jump || this.input.attack) {
        if (this.secretEnding) this.secretEnding.skip();
      }
    }

    this._render();
    requestAnimationFrame(this._loop);
  }

  _update(dt) {
    this.levelTimer += dt;
    if (this.runStartMs !== null && this.runFinalMs === null) {
      this.runTimerMs = performance.now() - this.runStartMs;
    }
    this.gameState.update(dt);
    this.powerManager.update(dt);

    // Rebuild full platform list including non-broken breakables
    this._allPlatforms = [
      ...this.platforms,
      ...this.breakables.filter(b => !b.broken).map(b => b.platform).filter(Boolean),
    ];
    // Temporarily swap so player/enemy collision uses full list
    const basePlatforms = this.platforms;
    this.platforms = this._allPlatforms;

    this.player.update(dt, this);
    this.enemies.forEach(e => e.update(dt, this));

    // Restore base platforms
    this.platforms = basePlatforms;
    this.pickups.forEach(p => p.update(dt));
    this.breakables.forEach(b => b.update(dt));
    this.particles.forEach(p => p.update(dt));
    this.particles = this.particles.filter(p => p.life > 0);
    this.assists.forEach(a => a.update(dt));
    this.assists = this.assists.filter(a => !a.done);
    this._updateAmbient(dt);

    // Scrap Assist trigger (Q key)
    if (this.input.assist) {
      triggerScrapAssist(this);
    }

    // Boss update
    if (this.boss) {
      // Activate boss when player enters trigger zone
      if (!this.bossActivated && this.player.x > (this.currentLevel.boss?.triggerX || 0)) {
        this.bossActivated = true;
        this.boss.activate(this);
      }
      if (this.bossActivated) {
        this.boss.update(dt, this);
      }
      // After boss defeated, spawn fox spirit
      if (this.boss.defeated && this.foxSpirit && !this.foxSpirit.visible) {
        this.foxSpirit.appear(this);
        this.foxSpirit.showMessage('Follow the light...');
        this.foxSpirit.setPath([
          { x: this.foxSpirit.x + 200, y: this.foxSpirit.y },
          { x: this.foxSpirit.x + 400, y: this.foxSpirit.y - 20 },
          { x: this.currentLevel.exitX - 40, y: this.foxSpirit.y },
        ]);
      }
    }

    // Fox Spirit update
    if (this.foxSpirit) {
      this.foxSpirit.update(dt);
      // Interact with fox
      if (this.foxSpirit.interactable && this.input.interact) {
        const dist = Math.abs(this.player.x - this.foxSpirit.x) + Math.abs(this.player.y - this.foxSpirit.y);
        if (dist < 60) {
          this.foxSpirit.showMessage('The path forward is clear. Go.');
          this.flightLog.add('Fox Spirit: "The path forward is clear."', 'spirit');
        }
      }
    }

    // Toggle flight log
    if (this.input.just('Tab')) {
      this.showFlightLog = !this.showFlightLog;
    }

    // Mirror Fragment check
    if (this.currentLevel && this.currentLevel.mirrorFragment && !this.currentLevel._fragmentCollected) {
      const mf = this.currentLevel.mirrorFragment;
      const dist = Math.abs(this.player.x - mf.x) + Math.abs(this.player.cy - mf.y);
      if (dist < 40) {
        this.currentLevel._fragmentCollected = true;
        this.mirrorFragments++;
        sfx.powerPickup();
        this.gameState.addScore(500);
        this.gameState.showPickup(`Mirror Fragment ${this.mirrorFragments}/${this.totalFragments}`);
        this.flightLog.add(`Mirror fragment collected (${this.mirrorFragments}/${this.totalFragments})`, 'explore');
        this.dialogue.trigger('mirror_fragment');
        this.camera.shake(6, 0.3);
        this.addParticles(mf.x, mf.y, 15, '#AADDFF');
        if (this.achievements) this.achievements.onMirrorFragment(this.mirrorFragments, this.totalFragments);
        if (this.mirrorFragments >= this.totalFragments) {
          setTimeout(() => this.dialogue.trigger('all_fragments'), 3000);
        }
      }
    }

    this.camera.follow(this.player.x, this.player.y - 40, dt);
    this.camera.updateShake(dt);

    this._checkCollisions();

    // Player death
    if (!this.player.alive) {
      this.state = 'gameover';
      this.gameOverTimer = 0;
      this.onStateChange('gameover');
      sfx.playerDeath();
    }

    // Boss arena auto-clear: if active and all enemies dead, unlock and advance
    if (this.bossArenaActive && this.enemies.every(e => !e.alive)) {
      this.bossArenaActive = false;
      this.gameState.showPickup('Barrier down. Arena cleared!');
      this.flightLog.add('Boss arena cleared.', 'event');
      if (this.achievements) this.achievements.onBossDefeated();
      sfx.levelComplete();
    }

    // Level exit (skip in hub — hub is non-linear, player leaves via Mission Gate)
    if (this.currentLevel && !this.currentLevel.hub && this.player.x >= this.currentLevel.exitX) {
      const allDead = this.enemies.every(e => !e.alive);
      const bossCleared = !this.boss || this.boss.defeated;
      if ((!this.currentLevel.isBoss || (allDead && bossCleared))) {
        sfx.levelComplete();
        // Biome levels flagged bossAfterClear get a mini boss arena flash
        if (this.currentLevel.bossAfterClear && !this.bossArenaShown) {
          this.bossArenaShown = true;
          this.gameState.showPickup('⚔ BOSS ARENA — barrier raised');
          this.camera.shake(8, 0.5);
          this.flightLog.add('Boss arena sealed. Survive and ascend.', 'event');
          // Spawn a quick boss-minion wave using the biome's enemies palette
          this._spawnBiomeBossWave();
          return; // don't advance until the wave is cleared
        }
        // Achievement hooks: boss defeated, level completed (no-dmg, speed_run)
        if (this.currentLevel.isBoss && this.achievements) {
          this.achievements.onBossDefeated();
        }
        if (this.achievements) {
          this.achievements.onLevelCompleted(this.currentLevelIndex);
        }
        this.levelsCompleted = Math.max(this.levelsCompleted, this.currentLevelIndex + 1);
        const nextIdx = this.currentLevelIndex + 1;
        this.loadLevel(nextIdx);
        if (this.achievements && nextIdx < this.levels.length) {
          this.achievements.onLevelStart(nextIdx);
        }
      }
    }
  }

  _checkCollisions() {
    const pl = this.player;
    if (!pl.alive) return;

    // Player vs enemies (contact damage + Mario-stomp kill)
    this.enemies.forEach(e => {
      if (!e.alive) return;
      const hb = e.getHitbox();
      if (this._aabb(pl.left, pl.top, pl.w, pl.h, hb.x, hb.y, hb.w, hb.h)) {
        // Mario stomp — player falling onto enemy's head kills/damages it and bounces.
        // Armored enemies (Heavy) only stun, don't die.
        const stompingFromAbove = pl.vy > 60 && (pl.bottom - hb.y) < hb.h * 0.55 && !e.armored;
        if (stompingFromAbove && pl.invTimer <= 0) {
          const stompDmg = e.sizeClass === 'large' ? 2 : Math.max(1, e.maxHp);
          e.takeDamage(stompDmg, pl.x, this, { smash: true, bypassFlicker: true });
          // Bounce — reverse vy. Extra bounce if jump is held.
          pl.vy = this.input.jumpHeld ? PL_STOMP_BOUNCE_HIGH : PL_STOMP_BOUNCE;
          pl.canDash = true;       // reward: refresh dash
          this.camera.shake(3, 0.08);
          if (sfx && sfx.enemyHit) sfx.enemyHit();
          return;
        }
        // Armored enemies bounce the player off without damage instead of auto-hitting
        if (stompingFromAbove && e.armored && pl.invTimer <= 0) {
          pl.vy = PL_STOMP_BOUNCE * 0.6;
          this.camera.shake(2, 0.05);
          return;
        }
        pl.takeDamage(e.dmg, e.cx, this);
      }
    });

    // Boss Arena: clamp player inside barrier
    if (this.bossArenaActive) {
      const barrierX = this.camera.x + W - 40;
      if (pl.x > barrierX) {
        pl.x = barrierX;
        if (pl.vx > 0) pl.vx = 0;
      }
    }

    // Player attack vs enemies
    if (pl.atkTimer > 0) {
      const ab = pl.getAtkBox();
      // Base dmg multiplier from active power.
      let dmgMul = this.powerManager.isGoldenGloves ? 2
                : this.powerManager.isHyperMode ? 2
                : this.powerManager.isSuperMode ? 1.5
                : this.powerManager.isBurningBuffalo ? 1.75 : 1;
      // Combo tiering — weak / mid / heavy (combo 1 / 2 / 3).
      // Smash attack (down-air) is a dedicated heavy.
      const comboMul = pl.smashing ? 2.0
                     : pl.combo === 3 ? 1.75
                     : pl.combo === 2 ? 1.25
                     : 1.0;
      dmgMul *= comboMul;
      // Daily: dmg_mul
      if (this.dailyMode && this.dailyModifier && this.dailyModifier.dmg_mul) {
        dmgMul *= this.dailyModifier.dmg_mul;
      }
      this.enemies.forEach(e => {
        if (!e.alive || e.hurtTimer > 0) return;
        const hb = e.getHitbox();
        if (this._aabb(ab.x, ab.y, ab.w, ab.h, hb.x, hb.y, hb.w, hb.h)) {
          e.takeDamage(Math.ceil(dmgMul), pl.x, this, { smash: pl.smashing });
        }
      });

      // Player attack vs breakables
      this.breakables.forEach(b => {
        if (b.broken) return;
        if (this._aabb(ab.x, ab.y, ab.w, ab.h, b.x, b.y, b.w, b.h)) {
          b.hit(1, pl.smashing, this);
        }
      });

      // Burning buffalo vs breakables
      if (this.powerManager.isBurningBuffalo) {
        this.breakables.forEach(b => {
          if (b.broken) return;
          const px = pl.cx, py = pl.cy;
          if (px > b.x - 20 && px < b.x + b.w + 20 && py > b.y - 10 && py < b.y + b.h + 10) {
            b.hit(3, true, this);
          }
        });
      }
    }

    // ── Burning Buffalo: turn Axel's body into a flaming contact damage zone ──
    // While active, running into any enemy deals 1 damage/0.2s and knocks them back
    // (instead of damaging Axel). Also doubles attack-move damage.
    if (this.powerManager.isBurningBuffalo) {
      pl.invTimer = Math.max(pl.invTimer, 0.05);           // always mildly safe while charging
      this._buffaloTick = (this._buffaloTick || 0) - dt;
      if (this._buffaloTick <= 0) {
        this.enemies.forEach(e => {
          if (!e.alive) return;
          const hb = e.getHitbox();
          if (this._aabb(pl.left, pl.top, pl.w, pl.h, hb.x, hb.y, hb.w, hb.h)) {
            e.takeDamage(1, pl.x, this, { bypassArmor: false });
            e.vx = (e.cx - pl.x > 0 ? 1 : -1) * 180;
            this.addParticles(e.cx, e.cy, 4, '#FD8C59');
          }
        });
        this._buffaloTick = 0.18;
      }
      // Flame trail particles so you feel like you're burning
      if (Math.random() < 0.6) {
        this.addParticles(pl.x - pl.vx * 0.05, pl.y - 10, 1, '#FD8C59');
      }
    }

    // Player vs pickups
    this.pickups.forEach(p => {
      if (p.collected) return;
      const hb = p.hitbox;
      const inRange = this._aabb(pl.left, pl.top, pl.w, pl.h, hb.x, hb.y, hb.w, hb.h);
      if (inRange) {
        // Fox Statue + Interactables require E — latch so it only fires once per entry
        if (p.type === 'foxstatue' || p.type === 'interactable') {
          if (this.input.down('KeyE') && !p._interactLatch) {
            p._interactLatch = true;
            p.collect(this);
          }
          return;
        }
        p.collect(this);
        // Achievement sync after a collect — thresholds use this-run + persisted totals
        if (this.achievements) {
          this.achievements.syncTotals({
            totalCoins: (this.persistentTotalCoins || 0) + this.gameState.coins,
            totalScrap: (this.persistentTotalScrap || 0) + this.gameState.scrapParts,
          });
        }
      } else if (p.type === 'foxstatue' || p.type === 'interactable') {
        // Reset latch when player leaves the zone
        p._interactLatch = false;
      }
    });

    // Hint Prompt Triggers — fire once when player enters area
    if (this.hintTriggers) {
      this.hintTriggers.forEach(h => {
        if (h.triggered) return;
        if (this._aabb(pl.left, pl.top, pl.w, pl.h, h.x, h.y, h.w, h.h)) {
          h.triggered = true;
          this.gameState.showPickup(h.text);
          this.flightLog.add(h.text, 'hint');
        }
      });
    }

    // Waterfall event — trigger once at triggerX, lasts `duration` seconds
    if (this.waterfallConfig && !this.waterfallEventFired && pl.x >= this.waterfallConfig.triggerX) {
      this.waterfallEventFired = true;
      this.waterfallActive = true;
      this.waterfallTimer = this.waterfallConfig.duration || 5;
      this.gameState.showPickup('⬇ WATERFALL DESCENT');
      this.flightLog.add('Waterfall descent — gravity surge!', 'event');
      this.camera.shake(6, 0.5);
      // Ambient water rush — proper low-pass-filtered pink-noise roar.
      if (typeof window !== 'undefined' && window.__hyperAxelMusic) {
        try { window.__hyperAxelMusic.startWaterRush(); } catch (e) {}
      }
    }
    if (this.waterfallActive) {
      this.waterfallTimer -= dt;
      // Force downward velocity bias
      if (!pl.grounded && pl.vy < 50) pl.vy = 50;
      // Spawn a falling rock every ~0.3s
      this._waterfallSpawnT = (this._waterfallSpawnT || 0) - dt;
      if (this._waterfallSpawnT <= 0) {
        this._waterfallSpawnT = 0.25 + Math.random() * 0.3;
        this.fallingRocks.push({
          x: pl.x - 150 + Math.random() * 300,
          y: this.camera.y - 20,
          vy: 220 + Math.random() * 120,
          r: 6 + Math.random() * 6,
          hit: false,
        });
      }
      if (this.waterfallTimer <= 0) {
        this.waterfallActive = false;
        this.fallingRocks = [];
        this.gameState.showPickup('Descent cleared.');
        if (typeof window !== 'undefined' && window.__hyperAxelMusic) {
          try { window.__hyperAxelMusic.stopWaterRush(); } catch (e) {}
        }
      }
    }
    // Update + collide falling rocks
    this.fallingRocks.forEach(r => {
      r.y += r.vy * dt;
      if (!r.hit && this._aabb(pl.left, pl.top, pl.w, pl.h, r.x - r.r, r.y - r.r, r.r * 2, r.r * 2)) {
        r.hit = true;
        pl.takeDamage(1, r.x, this);
      }
    });
    this.fallingRocks = this.fallingRocks.filter(r => !r.hit && r.y < this.camera.y + H + 80);

    // Boss collision
    if (this.boss && this.boss.alive && this.bossActivated) {
      const bh = this.boss.getHitbox();
      // Boss contact damage (not during vulnerable)
      if (this.boss.phase !== 'vulnerable' && this.boss.phase !== 'intro') {
        if (this._aabb(pl.left, pl.top, pl.w, pl.h, bh.x, bh.y, bh.w, bh.h)) {
          pl.takeDamage(2, this.boss.cx, this);
        }
      }
      // Player attack vs boss
      if (pl.atkTimer > 0) {
        const ab = pl.getAtkBox();
        if (this._aabb(ab.x, ab.y, ab.w, ab.h, bh.x, bh.y, bh.w, bh.h)) {
          const dmgMul = this.powerManager.isGoldenGloves ? 2
                      : this.powerManager.isHyperMode ? 2
                      : this.powerManager.isSuperMode ? 1.5 : 1;
          this.boss.takeDamage(Math.ceil(dmgMul), pl.x, this);
        }
      }
    }
  }

  _aabb(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  addParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, W, H);

    // Background
    if (this.currentLevel) {
      this._renderBg(ctx);
    }

    ctx.save();
    this.camera.apply(ctx);

    // Ambient particles (behind gameplay)
    this._renderAmbient(ctx);

    // Platforms
    this._renderPlatforms(ctx);

    // Breakables
    this.breakables.forEach(b => b.render(ctx));

    // Secret area visual hints
    if (this.currentLevel && this.currentLevelIndex === 2) {
      ctx.fillStyle = 'rgba(51,79,97,0.35)';
      ctx.fillRect(-70, 336, 320, 220);
    }

    // Pickups
    this.pickups.forEach(p => p.render(ctx));

    // Mirror Fragment (floating crystal)
    if (this.currentLevel && this.currentLevel.mirrorFragment && !this.currentLevel._fragmentCollected) {
      const mf = this.currentLevel.mirrorFragment;
      const bob = Math.sin(this.levelTimer * 2.5) * 6;
      const hue = (this.levelTimer * 60) % 360;
      const mx = Math.round(mf.x), my = Math.round(mf.y + bob);
      // Glow
      ctx.globalAlpha = 0.25 + Math.sin(this.levelTimer * 3) * 0.1;
      ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
      ctx.beginPath();
      ctx.arc(mx, my, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      // Crystal diamond
      ctx.fillStyle = `hsl(${hue}, 80%, 70%)`;
      ctx.beginPath();
      ctx.moveTo(mx, my - 14);
      ctx.lineTo(mx + 10, my);
      ctx.lineTo(mx, my + 10);
      ctx.lineTo(mx - 10, my);
      ctx.closePath();
      ctx.fill();
      // Inner shine
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(mx, my - 6);
      ctx.lineTo(mx + 4, my);
      ctx.lineTo(mx, my + 4);
      ctx.lineTo(mx - 4, my);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      // Sparkle particles
      for (let i = 0; i < 3; i++) {
        const sa = this.levelTimer * 2 + i * 2.1;
        const sr = 16 + Math.sin(sa * 1.5) * 6;
        const sx = mx + Math.cos(sa) * sr;
        const sy = my + Math.sin(sa) * sr + bob;
        ctx.fillStyle = `hsla(${(hue + i * 40) % 360}, 90%, 80%, 0.5)`;
        ctx.fillRect(sx - 1, sy - 1, 3, 3);
      }
    }

    // Enemies
    this.enemies.forEach(e => e.render(ctx, this));

    // Boss
    if (this.boss && this.bossActivated) this.boss.render(ctx);

    // Fox Spirit
    if (this.foxSpirit) this.foxSpirit.render(ctx);

    // Player
    if (this.player) this.player.render(ctx, this);

    // Scrap Assists (above everything — planes, drops, actors)
    this.assists.forEach(a => a.render(ctx));

    // Boss Arena barrier — energy wall at camera right edge
    if (this.bossArenaActive) {
      const barrierX = this.camera.x + W - 20;
      const t = performance.now() * 0.005;
      ctx.save();
      ctx.globalAlpha = 0.7;
      const grad = ctx.createLinearGradient(barrierX - 14, 0, barrierX + 14, 0);
      grad.addColorStop(0, 'rgba(255,90,90,0)');
      grad.addColorStop(0.5, 'rgba(255,90,90,0.85)');
      grad.addColorStop(1, 'rgba(255,90,90,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(barrierX - 14, this.camera.y - 100, 28, H + 200);
      // Crackle lines
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const y1 = this.camera.y + (i * 240 + Math.sin(t + i) * 40);
        ctx.beginPath();
        ctx.moveTo(barrierX - 10, y1);
        ctx.lineTo(barrierX + 10, y1 + 60);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Waterfall event — blue sheet + falling rocks
    if (this.waterfallActive) {
      ctx.save();
      const alpha = 0.10 + Math.sin(performance.now() * 0.02) * 0.05;
      ctx.fillStyle = `rgba(88, 200, 255, ${alpha})`;
      ctx.fillRect(-500, -500, 2800, 2000);
      ctx.restore();
      this.fallingRocks.forEach(r => {
        ctx.fillStyle = '#4A4038';
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0A0A0A';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }

    // Particles
    this.particles.forEach(p => p.render(ctx));

    // Exit marker
    if (this.currentLevel) {
      const ex = this.currentLevel.exitX;
      const allDead = this.enemies.every(e => !e.alive);
      const bossCleared = !this.boss || this.boss.defeated;
      const canExit = !this.currentLevel.isBoss || (allDead && bossCleared);
      ctx.fillStyle = canExit ? 'rgba(255,215,10,0.7)' : 'rgba(235,115,84,0.6)';
      ctx.fillRect(ex, 120, 20, 168);
      if (canExit) {
        ctx.fillStyle = C.yellow;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('EXIT', ex + 10, 112);
      }
    }

    ctx.restore();

    // HUD
    this.hud.render(ctx, this);

    // Flight Log panel (full screen overlay)
    if (this.showFlightLog) {
      this._renderFlightLogPanel(ctx);
    }

    // Dialogue box
    if (this.dialogue.active && this.dialogue.current) {
      this._renderDialogue(ctx);
    }

    // Mirror fragment counter (top-right)
    if (this.mirrorFragments > 0) {
      const fx = W - 50, fy = 74;
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.roundRect(fx - 30, fy - 2, 60, 22, 6);
      ctx.fill();
      const hue = (this.levelTimer * 40) % 360;
      ctx.fillStyle = `hsl(${hue}, 70%, 65%)`;
      ctx.font = 'bold 11px "Fredoka", sans-serif';
      ctx.textAlign = 'center';
      // Diamond icon
      ctx.beginPath();
      ctx.moveTo(fx - 16, fy + 9);
      ctx.lineTo(fx - 10, fy + 3);
      ctx.lineTo(fx - 4, fy + 9);
      ctx.lineTo(fx - 10, fy + 15);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`${this.mirrorFragments}/${this.totalFragments}`, fx + 8, fy + 14);
    }

    // Transition overlay
    if (this.state === 'transition') {
      const prog = this.transitionTimer / 0.8;
      const barH = H * prog;
      ctx.fillStyle = C.black;
      ctx.fillRect(0, 0, W, barH / 2);
      ctx.fillRect(0, H - barH / 2, W, barH / 2);
      // Level name
      if (prog > 0.3) {
        ctx.globalAlpha = Math.min(1, (prog - 0.3) * 3);
        ctx.fillStyle = C.white;
        ctx.font = 'bold 36px "Anton", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.currentLevel?.name || '', W / 2, H / 2 + 5);
        ctx.globalAlpha = 1;
      }
    }

    // Game over overlay
    if (this.state === 'gameover') {
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.red;
      ctx.font = 'bold 72px "Anton", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 20);
      ctx.fillStyle = C.white;
      ctx.font = '20px "Nunito", sans-serif';
      ctx.fillText(`Score: ${this.gameState.score}`, W / 2, H / 2 + 30);
      if (this.gameOverTimer > 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '16px "Nunito", sans-serif';
        ctx.fillText('Press SPACE to restart', W / 2, H / 2 + 70);
      }
    }

    // Victory overlay
    if (this.state === 'victory') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);

      const isNG = this.newGamePlus;
      ctx.fillStyle = C.yellow;
      ctx.font = 'bold 56px "Anton", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isNG ? 'NG+ COMPLETE' : 'JOURNEY COMPLETE', W / 2, H / 2 - 50);

      ctx.fillStyle = C.white;
      ctx.font = '22px "Nunito", sans-serif';
      ctx.fillText(`Final Score: ${this.gameState.score}`, W / 2, H / 2);
      ctx.fillText(`Coins: ${this.gameState.coins}  |  Fragments: ${this.mirrorFragments}/${this.totalFragments}`, W / 2, H / 2 + 30);

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '16px "Nunito", sans-serif';
      ctx.fillText('Press SPACE to play again', W / 2, H / 2 + 75);

      if (!isNG) {
        ctx.fillStyle = C.teal;
        ctx.font = 'bold 16px "Fredoka", sans-serif';
        ctx.fillText('Press N for NEW GAME+ (harder enemies, relocated fragments, secret level)', W / 2, H / 2 + 105);
      }

      if (this.mirrorFragments >= this.totalFragments) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 18px "Fredoka", sans-serif';
        const pulse = 0.6 + Math.sin(Date.now() / 300) * 0.4;
        ctx.globalAlpha = pulse;
        ctx.fillText('ALL MIRROR FRAGMENTS COLLECTED', W / 2, H / 2 + 140);
        ctx.globalAlpha = 1;
      }
    }
  }

  _renderBg(ctx) {
    const env = this.currentLevel.environment;

    // DREAM WORLD — pink-purple gradient with soft orbs
    if (env === 'dream_world') {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#3A2450'); g.addColorStop(0.5, '#7A4A8A'); g.addColorStop(1, '#D8A0C8');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // Floaty orbs
      const t = performance.now() * 0.0005;
      for (let i = 0; i < 18; i++) {
        const x = ((i * 83 + t * 40) % (W + 60)) - 30;
        const y = 100 + (i % 5) * 80 + Math.sin(t * 2 + i) * 20;
        const r = 20 + (i % 4) * 8;
        ctx.fillStyle = `rgba(255,200,255,${0.04 + (i % 3) * 0.02})`;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      return;
    }

    // LAVA — deep red-orange with heat shimmer
    if (env === 'lava_world') {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#2A0A0A'); g.addColorStop(0.7, '#6A1A0A'); g.addColorStop(1, '#D85018');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // Ember dots
      const t = performance.now() * 0.001;
      for (let i = 0; i < 25; i++) {
        const x = (i * 61 + t * 20) % W;
        const y = (H - ((i * 37 + t * 60) % H));
        ctx.fillStyle = 'rgba(255,150,80,0.6)';
        ctx.fillRect(x, y, 2, 2);
      }
      // Far lava silhouette
      ctx.fillStyle = '#3A1008';
      ctx.fillRect(0, H * 0.6, W, H * 0.4);
      return;
    }

    // SKY — pastel blue with distant floating islands
    if (env === 'floating_islands') {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#88C8FF'); g.addColorStop(1, '#FFDCC8');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const px = -this.camera.x * 0.3;
      ctx.save(); ctx.translate(px, 0);
      for (let i = 0; i < 8; i++) {
        const x = i * 240 + 100;
        const y = 120 + Math.sin(i * 1.7) * 30;
        ctx.fillStyle = '#8B6344';
        ctx.fillRect(x, y, 90, 24);
        ctx.fillStyle = '#4A7A3A';
        ctx.fillRect(x, y - 6, 90, 10);
        ctx.strokeStyle = '#0A0A0A';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y - 6, 90, 30);
      }
      ctx.restore();
      return;
    }

    // MYSTIC FOREST — deep teal with light rays
    if (env === 'mystic_forest') {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0E2A2A'); g.addColorStop(1, '#1E4A3A');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.globalAlpha = 0.18;
      for (let i = 0; i < 6; i++) {
        const x = 120 + i * 220;
        ctx.fillStyle = '#C8E088';
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x + 80, 0); ctx.lineTo(x + 140, H); ctx.lineTo(x + 60, H);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      // Tree silhouettes
      const px = -this.camera.x * 0.3;
      ctx.save(); ctx.translate(px, 0);
      for (let i = 0; i < 10; i++) {
        const x = i * 180 + 50;
        ctx.fillStyle = '#1A2A1E';
        ctx.fillRect(x, 120, 12, H - 120);
        ctx.beginPath(); ctx.arc(x + 6, 120, 40, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      return;
    }

    // Urban Overgrowth hub — stylized concrete city block with mossy tint
    if (env === 'urban_overgrowth') {
      // Sky: muted grey-green gradient
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#2B3A3A');
      sky.addColorStop(0.6, '#374A48');
      sky.addColorStop(1, '#4A5F45');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Distant city silhouette (parallax 0.25)
      ctx.save();
      const px = -this.camera.x * 0.25;
      ctx.translate(px, 0);
      const buildings = [
        { x: 0,   h: 260, w: 90  }, { x: 110, h: 320, w: 70 },
        { x: 200, h: 230, w: 110 }, { x: 330, h: 380, w: 60 },
        { x: 410, h: 280, w: 90  }, { x: 520, h: 340, w: 100 },
        { x: 640, h: 220, w: 80  }, { x: 740, h: 360, w: 90 },
        { x: 850, h: 270, w: 70  }, { x: 940, h: 310, w: 100 },
      ];
      const groundY = 340;
      buildings.forEach((b, i) => {
        // Base color — overgrown tint = green-washed grey (Color(0.7, 1.0, 0.7))
        const base = i % 2 === 0 ? '#3E4F4A' : '#4A5A50';
        ctx.fillStyle = base;
        ctx.fillRect(b.x, groundY - b.h, b.w, b.h);
        // Window grid
        ctx.fillStyle = 'rgba(180,210,140,0.18)';
        for (let y = groundY - b.h + 20; y < groundY - 30; y += 24) {
          for (let x = b.x + 8; x < b.x + b.w - 10; x += 14) {
            ctx.fillRect(x, y, 6, 10);
          }
        }
        // Overgrowth tint strip along the top (vines)
        ctx.fillStyle = 'rgba(127,220,140,0.35)';
        ctx.fillRect(b.x, groundY - b.h, b.w, 8);
        // Dangling vines
        for (let v = 0; v < 3; v++) {
          const vx = b.x + 12 + v * (b.w / 3);
          const vlen = 20 + (i * 7 + v * 11) % 30;
          ctx.fillRect(vx, groundY - b.h + 6, 2, vlen);
        }
        // Outline
        ctx.strokeStyle = '#0A0A0A';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, groundY - b.h, b.w, b.h);
      });
      ctx.restore();

      // Mid-ground smaller buildings (parallax 0.5)
      ctx.save();
      ctx.translate(-this.camera.x * 0.5, 0);
      ctx.fillStyle = '#2F3F38';
      ctx.fillRect(200, 200, 140, 140);
      ctx.fillRect(520, 170, 180, 170);
      ctx.fillRect(900, 190, 160, 150);
      // Overgrowth on mid
      ctx.fillStyle = 'rgba(127,220,140,0.28)';
      ctx.fillRect(200, 200, 140, 12);
      ctx.fillRect(520, 170, 180, 12);
      ctx.fillRect(900, 190, 160, 12);
      ctx.strokeStyle = '#0A0A0A';
      ctx.lineWidth = 2;
      ctx.strokeRect(200, 200, 140, 140);
      ctx.strokeRect(520, 170, 180, 170);
      ctx.strokeRect(900, 190, 160, 150);
      ctx.restore();

      // Mossy ground overlay (hub only)
      ctx.save();
      this.camera.apply(ctx);
      ctx.fillStyle = 'rgba(100,160,80,0.25)';
      ctx.fillRect(-300, 340, 1800, 6);
      ctx.restore();
      return;
    }

    const bgs = this.currentLevel.backgrounds || [];
    bgs.forEach(bg => {
      if (bg.type === 'sky') {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, bg.color1);
        grad.addColorStop(1, bg.color2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Parallax background image (overgrown ruins)
        if (this.bgImageLoaded) {
          ctx.save();
          const parallax = 0.15;
          const imgW = W * 1.4;
          const imgH = H;
          const offsetX = -this.camera.x * parallax;
          const offsetY = -this.camera.y * parallax * 0.5 + 20;
          ctx.globalAlpha = 0.35;
          ctx.drawImage(this.bgImage, offsetX - 100, offsetY, imgW, imgH);
          ctx.globalAlpha = 1;
          ctx.restore();
        }
      }
      if (bg.type === 'hills' && bg.points) {
        ctx.save();
        this.camera.apply(ctx);
        ctx.save();
        ctx.translate(this.camera.x * 0.4, this.camera.y * 0.2);
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = bg.color;
        ctx.beginPath();
        bg.points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p[0], p[1]);
          else ctx.lineTo(p[0], p[1]);
        });
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
        ctx.restore();
      }
    });
  }

  _renderPlatforms(ctx) {
    // All platforms including breakable-provided ones
    const allPlatforms = [
      ...this.platforms,
    ];
    allPlatforms.forEach(p => {
      ctx.fillStyle = p.color || C.ground;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      // Extend ground downward to fill screen
      if (p.h >= 40) {
        ctx.fillStyle = p.color || C.ground;
        ctx.fillRect(p.x, p.y + p.h, p.w, 400);
      }
      // Top edge highlight
      if (p.topColor) {
        ctx.fillStyle = p.topColor;
        ctx.fillRect(p.x, p.y, p.w, 4);
      } else if (p.h <= 24) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(p.x, p.y, p.w, 2);
      }
      // Ground grass tufts for main ground
      if (p.h >= 40) {
        ctx.fillStyle = '#4A6B48';
        const seed = Math.abs(p.x) % 1000;
        for (let i = 0; i < p.w / 35; i++) {
          const gx = p.x + ((seed + i * 37) % p.w);
          const gh = 3 + (i % 3) * 1.5;
          ctx.fillRect(gx, p.y - gh, 3, gh);
          ctx.fillRect(gx + 6, p.y - gh + 1, 2, gh - 1);
        }
      }
    });
  }

  _renderFlightLogPanel(ctx) {
    // Full Flight Log overlay
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, W, H);

    // Panel
    const px = 180, py = 60, pw = W - 360, ph = H - 120;
    ctx.fillStyle = '#0E1A14';
    ctx.strokeStyle = C.teal;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 16);
    ctx.fill();
    ctx.stroke();

    // Title
    ctx.fillStyle = C.teal;
    ctx.font = 'bold 28px "Anton", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FLIGHT LOG', W / 2, py + 40);

    // Scrap branding
    ctx.fillStyle = 'rgba(125,165,189,0.4)';
    ctx.font = '11px "Nunito", sans-serif';
    ctx.fillText('[ Scrap Analysis Terminal v1.2 ]', W / 2, py + 58);

    // Separator
    ctx.strokeStyle = 'rgba(0,199,190,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 20, py + 68);
    ctx.lineTo(px + pw - 20, py + 68);
    ctx.stroke();

    // Entries
    const entries = this.flightLog.entries;
    const maxVisible = Math.min(entries.length, 18);
    const catColors = {
      system: '#88DDFF', combat: '#FF6644', nav: '#FFD60A',
      explore: '#44DD66', power: '#CC88FF', spirit: '#88CCFF', general: '#AABBCC',
    };

    for (let i = 0; i < maxVisible; i++) {
      const e = entries[i];
      const ey = py + 86 + i * 28;
      const catCol = catColors[e.category] || catColors.general;

      // Category tag
      ctx.fillStyle = catCol;
      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      ctx.roundRect(px + 24, ey - 4, 60, 20, 4);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = catCol;
      ctx.font = 'bold 10px "Nunito", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(e.category.toUpperCase(), px + 54, ey + 10);

      // Entry text
      ctx.fillStyle = '#D8E0E8';
      ctx.font = '13px "Nunito", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`> ${e.text}`, px + 94, ey + 10);
    }

    if (entries.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '14px "Nunito", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No entries recorded yet.', W / 2, H / 2);
    }

    // Close hint
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '12px "Nunito", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Press TAB to close', W / 2, py + ph - 16);
  }

  _renderDialogue(ctx) {
    const d = this.dialogue;
    const s = d.current;
    if (!s) return;

    const bx = W / 2, by = H - 90;
    const bw = 600, bh = 80;

    // Background
    ctx.fillStyle = s.bgColor || 'rgba(20,40,50,0.95)';
    ctx.strokeStyle = s.borderColor || '#5A8098';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx - bw / 2, by - bh / 2, bw, bh, 12);
    ctx.fill();
    ctx.stroke();

    // Speaker portrait (Scrap = gear icon, Fox = fox icon)
    const px = bx - bw / 2 + 36;
    const py = by;
    ctx.fillStyle = `${s.color}33`;
    ctx.strokeStyle = s.borderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(px - 22, py - 22, 44, 44, 8);
    ctx.fill();
    ctx.stroke();

    if (s.portrait === 'scrap') {
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(px, py - 5, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(px - 3, py + 5, 6, 12);
      ctx.fillStyle = '#FF3B30';
      ctx.beginPath();
      ctx.arc(px - 4, py - 6, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.moveTo(px, py - 14);
      ctx.lineTo(px - 10, py + 2);
      ctx.lineTo(px - 6, py - 4);
      ctx.lineTo(px - 14, py - 8);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(px, py - 14);
      ctx.lineTo(px + 10, py + 2);
      ctx.lineTo(px + 6, py - 4);
      ctx.lineTo(px + 14, py - 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(px - 5, py - 4, 3, 3);
      ctx.fillRect(px + 2, py - 4, 3, 3);
    }

    // Speaker name
    ctx.fillStyle = s.color;
    ctx.font = 'bold 12px "Anton", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(s.name, px + 32, by - bh / 2 + 20);

    // Text (typewriter)
    ctx.fillStyle = '#E8F0EC';
    ctx.font = '14px "Nunito", sans-serif';
    ctx.fillText(d.getDisplayText(), px + 32, by + 4);

    // Advance hint
    if (d.waitingForInput) {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '10px "Nunito", sans-serif';
      ctx.textAlign = 'right';
      const blink = Math.sin(this.levelTimer * 5) > 0;
      if (blink) ctx.fillText('SPACE / X to continue', bx + bw / 2 - 12, by + bh / 2 - 10);
    }
  }


  _initAmbient() {
    const arr = [];
    for (let i = 0; i < 30; i++) {
      arr.push({
        x: Math.random() * 3000 - 1000,
        y: Math.random() * 600 - 200,
        vx: (Math.random() - 0.5) * 15,
        vy: -5 + Math.random() * 12,
        size: 1 + Math.random() * 3,
        alpha: 0.1 + Math.random() * 0.25,
        type: Math.random() < 0.7 ? 'dust' : 'leaf',
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 1 + Math.random() * 2,
      });
    }
    return arr;
  }

  _updateAmbient(dt) {
    this.ambientParticles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.wobble += p.wobbleSpeed * dt;
      p.x += Math.sin(p.wobble) * 0.5;
      // Wrap around camera view
      if (p.y > this.camera.y + H + 20) {
        p.y = this.camera.y - 20;
        p.x = this.camera.x + Math.random() * W;
      }
      if (p.x < this.camera.x - 100) p.x = this.camera.x + W + 50;
      if (p.x > this.camera.x + W + 100) p.x = this.camera.x - 50;
    });
  }

  _renderAmbient(ctx) {
    this.ambientParticles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      if (p.type === 'dust') {
        ctx.fillStyle = '#D8C8A8';
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      } else {
        // Leaf
        ctx.fillStyle = '#5A8A50';
        ctx.save();
        ctx.translate(Math.round(p.x), Math.round(p.y));
        ctx.rotate(p.wobble);
        ctx.fillRect(-2, -1, 4, 2);
        ctx.fillRect(-1, -2, 2, 4);
        ctx.restore();
      }
    });
    ctx.globalAlpha = 1;
  }
}


class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 200;
    this.vy = (Math.random() - 0.8) * 200;
    this.life = 0.3 + Math.random() * 0.3;
    this.maxLife = this.life;
    this.size = 2 + Math.random() * 4;
    this.color = color;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 400 * dt;
    this.life -= dt;
  }

  render(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(
      Math.round(this.x - this.size / 2),
      Math.round(this.y - this.size / 2),
      this.size, this.size
    );
    ctx.globalAlpha = 1;
  }
}
