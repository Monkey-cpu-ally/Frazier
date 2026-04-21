// Scrap Assist system — porting atlas-core PR #7 Scrap Assist
import { C } from './constants';
import { sfx } from './sfx';

// ===== SupplyDrop: parachutes to ground, then heals or rewards scrap =====
export class SupplyDrop {
  constructor(x, groundY, onLand) {
    this.x = x;
    this.y = groundY - 180;
    this.groundY = groundY;
    this.onLand = onLand;
    this.vy = 60;
    this.landed = false;
    this.life = 6;
    this.done = false;
  }
  update(dt) {
    this.life -= dt;
    if (!this.landed) {
      this.y += this.vy * dt;
      if (this.y >= this.groundY - 8) {
        this.y = this.groundY - 8;
        this.landed = true;
        this.onLand && this.onLand();
        this.life = 1.2;
      }
    }
    if (this.life <= 0) this.done = true;
  }
  render(ctx) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    // Parachute (only while falling)
    if (!this.landed) {
      ctx.fillStyle = '#7FE08A';
      ctx.beginPath();
      ctx.arc(x, y - 22, 18, Math.PI, 0);
      ctx.fill();
      // Lines
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 14, y - 22); ctx.lineTo(x - 6, y - 4);
      ctx.moveTo(x + 14, y - 22); ctx.lineTo(x + 6, y - 4);
      ctx.stroke();
    }
    // Crate
    ctx.fillStyle = '#6B4F35';
    ctx.fillRect(x - 10, y - 10, 20, 12);
    ctx.strokeStyle = '#3A2A20';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 10, y - 10, 20, 12);
    // Green cross
    ctx.fillStyle = '#7FE08A';
    ctx.fillRect(x - 1, y - 8, 2, 8);
    ctx.fillRect(x - 4, y - 5, 8, 2);
  }
}

// ===== GroundAssistActor: ally charges in from left, attacks, exits =====
export class GroundAssistActor {
  constructor(startX, startY, stopX, color, label, onImpact) {
    this.x = startX;
    this.y = startY;
    this.stopX = stopX;
    this.color = color;
    this.label = label;
    this.onImpact = onImpact;
    this.phase = 'enter'; // enter -> strike -> exit
    this.vx = 280;
    this.phaseT = 0;
    this.done = false;
    this.impactFired = false;
  }
  update(dt) {
    this.phaseT += dt;
    if (this.phase === 'enter') {
      this.x += this.vx * dt;
      if (this.x >= this.stopX) {
        this.x = this.stopX;
        this.phase = 'strike';
        this.phaseT = 0;
      }
    } else if (this.phase === 'strike') {
      if (!this.impactFired && this.phaseT >= 0.15) {
        this.impactFired = true;
        this.onImpact && this.onImpact();
      }
      if (this.phaseT >= 0.8) {
        this.phase = 'exit';
        this.phaseT = 0;
      }
    } else if (this.phase === 'exit') {
      this.x -= this.vx * 1.4 * dt;
      if (this.phaseT > 1.6) this.done = true;
    }
  }
  render(ctx) {
    const x = Math.round(this.x), y = Math.round(this.y);
    // Running body silhouette
    const bob = Math.sin(this.phaseT * 14) * 2;
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Torso
    ctx.fillStyle = this.color;
    ctx.fillRect(x - 8, y - 28 + bob, 16, 22);
    // Head
    ctx.fillStyle = '#8B6344';
    ctx.fillRect(x - 6, y - 38 + bob, 12, 10);
    // Helmet accent
    ctx.fillStyle = this.color;
    ctx.fillRect(x - 7, y - 40 + bob, 14, 4);
    // Outline
    ctx.strokeStyle = '#0A0A0A';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 8, y - 28 + bob, 16, 22);
    ctx.strokeRect(x - 6, y - 38 + bob, 12, 10);
    // Legs
    ctx.fillStyle = '#2A2A2A';
    ctx.fillRect(x - 6, y - 6, 4, 6);
    ctx.fillRect(x + 2, y - 6, 4, 6);
    // Strike flash
    if (this.phase === 'strike' && this.phaseT < 0.35) {
      ctx.globalAlpha = 1 - this.phaseT / 0.35;
      ctx.fillStyle = '#FFF';
      ctx.fillRect(x + 6, y - 32, 80, 4);
      ctx.fillStyle = this.color;
      ctx.fillRect(x + 6, y - 30, 80, 2);
      ctx.globalAlpha = 1;
    }
  }
}

// ===== FighterPlaneAssist: flies across, drops ordnance =====
export class FighterPlaneAssist {
  constructor(targetX, targetY, attackMode, onStrike) {
    this.targetX = targetX;
    this.targetY = targetY;
    this.mode = attackMode; // 'mg' or 'bomb'
    this.onStrike = onStrike;
    this.x = targetX - 500;
    this.y = targetY - 180;
    this.vx = 600;
    this.phaseT = 0;
    this.struck = false;
    this.done = false;
    this.bullets = [];
  }
  update(dt) {
    this.phaseT += dt;
    this.x += this.vx * dt;
    if (!this.struck && this.x >= this.targetX - 50) {
      this.struck = true;
      this.onStrike && this.onStrike();
      // Visual bullets/bomb
      if (this.mode === 'mg') {
        for (let i = 0; i < 12; i++) {
          this.bullets.push({
            x: this.x + i * 18,
            y: this.y + 8,
            vx: 0, vy: 380,
            life: 1.2,
          });
        }
      } else {
        this.bullets.push({
          x: this.x - 20, y: this.y + 6, vx: 80, vy: 180, life: 1.5, bomb: true,
        });
      }
    }
    this.bullets.forEach(b => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.bomb) b.vy += 400 * dt;
      b.life -= dt;
    });
    this.bullets = this.bullets.filter(b => b.life > 0);
    if (this.x > this.targetX + 600 && this.bullets.length === 0) this.done = true;
  }
  render(ctx) {
    const x = Math.round(this.x), y = Math.round(this.y);
    // Plane body
    ctx.fillStyle = '#4A5868';
    ctx.beginPath();
    ctx.moveTo(x - 40, y);
    ctx.lineTo(x + 28, y - 6);
    ctx.lineTo(x + 40, y);
    ctx.lineTo(x + 28, y + 6);
    ctx.closePath();
    ctx.fill();
    // Wings
    ctx.fillStyle = '#3A4858';
    ctx.fillRect(x - 12, y - 18, 24, 8);
    ctx.fillRect(x - 12, y + 10, 24, 8);
    // Outline
    ctx.strokeStyle = '#0A0A0A';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Cockpit
    ctx.fillStyle = '#88CCFF';
    ctx.fillRect(x + 8, y - 4, 10, 6);
    // Red star
    ctx.fillStyle = '#FF5A5A';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    // Bullets/bomb
    this.bullets.forEach(b => {
      if (b.bomb) {
        ctx.fillStyle = '#2A2A2A';
        ctx.fillRect(Math.round(b.x) - 4, Math.round(b.y) - 2, 8, 4);
        ctx.fillStyle = '#FF9F43';
        ctx.fillRect(Math.round(b.x) - 2, Math.round(b.y) + 2, 4, 3);
      } else {
        ctx.fillStyle = '#FFD447';
        ctx.fillRect(Math.round(b.x), Math.round(b.y), 3, 6);
      }
    });
  }
}

// ===== Main trigger dispatcher =====
export function triggerScrapAssist(engine) {
  const pl = engine.player;
  const gs = engine.gameState;
  if (gs.scrapMeter < 20) {
    gs.showPickup('Scrap assist empty!');
    return false;
  }
  const ratio = gs.scrapMeter / gs.maxScrap;
  const level = ratio < 0.25 ? 'green'
              : ratio < 0.50 ? 'yellow'
              : ratio < 0.75 ? 'orange'
              : 'red';
  const bonus = engine.assistUpgradeBonus || 0;

  if (level === 'green') {
    _doGreenAssist(engine, pl);
  } else if (level === 'yellow') {
    _doYellowAssist(engine, pl, bonus);
  } else if (level === 'orange') {
    _doOrangeAssist(engine, pl, bonus);
  } else {
    _doRedAssist(engine, pl, bonus);
  }
  gs.scrapMeter = 0;
  engine.flightLog.add(`Scrap Assist: ${level.toUpperCase()} call-in`, 'power');
  sfx.powerPickup();
  return true;
}

function _doGreenAssist(engine, pl) {
  engine.gameState.showPickup('Supply Drop incoming!');
  // Snap groundY to nearest platform top directly under the player, else fall to player's y.
  let groundY = pl.y;
  let bestY = Infinity;
  for (const p of engine.platforms) {
    if (pl.x >= p.x && pl.x <= p.x + p.w && p.y >= pl.y - 40 && p.y < bestY) {
      bestY = p.y;
    }
  }
  if (bestY !== Infinity) groundY = bestY;
  const drop = new SupplyDrop(pl.x, groundY, () => {
    if (Math.random() < 0.5) {
      engine.gameState.healSticker();
      engine.gameState.showPickup('Medical Drop!');
    } else {
      engine.gameState.addScore(100);
      engine.gameState.scrapParts += 10;
      engine.gameState.showPickup('Stored Supply Delivered');
    }
  });
  engine.assists.push(drop);
}

function _doYellowAssist(engine, pl, bonus) {
  engine.gameState.showPickup('Shotgun Entry!');
  const actor = new GroundAssistActor(
    pl.x - 420, pl.y, pl.x - 40, C.yellow, 'YELLOW',
    () => {
      engine.enemies.forEach(e => {
        if (!e.alive) return;
        const dist = Math.abs(e.x - pl.x);
        if (dist > 180) return;
        if (e.isWeak && e.isWeak()) {
          e.takeDamage(999, pl.x, engine, { bypassArmor: true, bypassFlicker: true });
        } else if (e.isLarge && e.isLarge()) {
          e.takePercentDamage(0.10 + bonus, pl.x, engine);
        }
      });
      engine.camera.shake(5, 0.2);
    }
  );
  engine.assists.push(actor);
}

function _doOrangeAssist(engine, pl, bonus) {
  engine.gameState.showPickup('Burn Smoke!');
  const actor = new GroundAssistActor(
    pl.x - 420, pl.y, pl.x - 30, '#FF9F43', 'ORANGE',
    () => {
      engine.enemies.forEach(e => {
        if (!e.alive) return;
        const dist = Math.abs(e.x - pl.x);
        if (dist > 150) return;
        if (e.isWeak && e.isWeak()) {
          e.takePercentDamage(0.15 + bonus, pl.x, engine);
        } else if (e.isLarge && e.isLarge()) {
          e.takePercentDamage(0.10 + bonus, pl.x, engine);
        }
      });
      engine.camera.shake(6, 0.2);
      // Malfunction chance (reduced by upgrade)
      const malfunctionChance = Math.max(0.10, 0.30 - (engine.assistMalfunctionReduction || 0));
      if (Math.random() < malfunctionChance) {
        pl.takeDamage(1, pl.x - 8, engine);
        engine.gameState.showPickup('Scrap malfunction!');
      }
    }
  );
  engine.assists.push(actor);
}

function _doRedAssist(engine, pl, bonus) {
  engine.gameState.showPickup('Air Strike!');
  const mode = Math.random() < 0.5 ? 'mg' : 'bomb';
  const radius = mode === 'mg' ? 220 : 180;
  const pct = mode === 'mg' ? 0.20 + bonus : 0.30 + bonus;
  const plane = new FighterPlaneAssist(pl.x, pl.y - 120, mode, () => {
    engine.enemies.forEach(e => {
      if (!e.alive) return;
      if (Math.abs(e.x - pl.x) > radius) return;
      e.takePercentDamage(pct, pl.x, engine);
    });
    engine.camera.shake(10, 0.4);
  });
  engine.assists.push(plane);
}
