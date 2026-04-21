import { W, H, C } from './constants';
import { Input } from './input';
import { Camera } from './camera';
import { Player } from './player';
import { GameState, PowerManager, FlightLog, AchievementTracker } from './systems';
import { createEnemy } from './enemies';
import { createPickup, Breakable } from './pickups';
import { getLevels, getCityHub } from './levels';
import { HUD } from './hud';
import { Boss, FoxSpirit } from './boss';
import { sfx } from './sfx';
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

    // Level exit (skip in hub — hub is non-linear, player leaves via Mission Gate)
    if (this.currentLevel && !this.currentLevel.hub && this.player.x >= this.currentLevel.exitX) {
      const allDead = this.enemies.every(e => !e.alive);
      const bossCleared = !this.boss || this.boss.defeated;
      if ((!this.currentLevel.isBoss || (allDead && bossCleared))) {
        sfx.levelComplete();
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

    // Player vs enemies (contact damage)
    this.enemies.forEach(e => {
      if (!e.alive) return;
      const hb = e.getHitbox();
      if (this._aabb(pl.left, pl.top, pl.w, pl.h, hb.x, hb.y, hb.w, hb.h)) {
        pl.takeDamage(e.dmg, e.cx, this);
      }
    });

    // Player attack vs enemies
    if (pl.atkTimer > 0) {
      const ab = pl.getAtkBox();
      let dmgMul = this.powerManager.isGoldenGloves ? 2 : (this.powerManager.isSuperMode ? 1.5 : 1);
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

    // Player vs pickups
    this.pickups.forEach(p => {
      if (p.collected) return;
      const hb = p.hitbox;
      if (this._aabb(pl.left, pl.top, pl.w, pl.h, hb.x, hb.y, hb.w, hb.h)) {
        // Fox Statue + Interactables require E-key interact
        if (p.type === 'foxstatue' || p.type === 'interactable') {
          if (this.input.interact) {
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
          const dmgMul = this.powerManager.isGoldenGloves ? 2 : (this.powerManager.isSuperMode ? 1.5 : 1);
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
    this.enemies.forEach(e => e.render(ctx));

    // Boss
    if (this.boss && this.bossActivated) this.boss.render(ctx);

    // Fox Spirit
    if (this.foxSpirit) this.foxSpirit.render(ctx);

    // Player
    if (this.player) this.player.render(ctx);

    // Scrap Assists (above everything — planes, drops, actors)
    this.assists.forEach(a => a.render(ctx));

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
    // Urban Overgrowth hub — stylized concrete city block with mossy tint
    if (this.currentLevel.environment === 'urban_overgrowth') {
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
