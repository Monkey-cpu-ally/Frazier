import { C, W, H } from './constants';

export class HUD {
  render(ctx, engine) {
    const gs = engine.gameState;
    const pm = engine.powerManager;
    ctx.save();

    // Top bar background
    ctx.fillStyle = C.hudBg;
    ctx.beginPath();
    ctx.roundRect(10, 10, W - 20, 54, 12);
    ctx.fill();

    // Sticker Health (left)
    this._drawStickers(ctx, 24, 18, gs.stickers, gs.maxStickers, gs.stickerChip);

    // Coins (center-left)
    this._drawCoins(ctx, 220, 22, gs.coins);

    // Scrap Meter (center)
    this._drawScrapMeter(ctx, 360, 20, gs.scrapMeter, gs.maxScrap);

    // Score (center-right)
    ctx.fillStyle = C.white;
    ctx.font = 'bold 16px "Nunito", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${gs.score}`, 600, 44);

    // Power icon + timer (right)
    if (pm.isActive) {
      this._drawPower(ctx, W - 90, 16, pm);
    }

    // Level name
    if (engine.currentLevel) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '12px "Nunito", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(engine.currentLevel.name || '', W - 20, 76);
    }

    // Pickup text
    if (gs.pickupTimer > 0) {
      const alpha = Math.min(1, gs.pickupTimer);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = C.yellow;
      ctx.font = 'bold 20px "Fredoka", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(gs.pickupText, W / 2, H / 2 - 80);
      ctx.globalAlpha = 1;
    }

    // Flight log (bottom-left)
    this._drawLog(ctx, engine.flightLog);

    // Hint message
    if (engine.currentLevel && engine.currentLevel.hint && engine.levelTimer < 5) {
      const alpha = Math.max(0, 1 - engine.levelTimer / 5);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 280, H - 70, 560, 36, 8);
      ctx.fill();
      ctx.fillStyle = C.yellow;
      ctx.font = '14px "Nunito", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(engine.currentLevel.hint, W / 2, H - 46);
      ctx.globalAlpha = 1;
    }

    // Level start message
    if (engine.currentLevel && engine.currentLevel.message && engine.levelTimer < 4) {
      const alpha = Math.max(0, 1 - engine.levelTimer / 4);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 240, H - 110, 480, 32, 8);
      ctx.fill();
      ctx.fillStyle = C.white;
      ctx.font = '13px "Nunito", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(engine.currentLevel.message, W / 2, H - 88);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  _drawStickers(ctx, x, y, stickers, max, chip) {
    for (let i = 0; i < max; i++) {
      const sx = x + i * 42;
      if (i < stickers) {
        // Full sticker
        ctx.fillStyle = C.red;
        this._drawHeart(ctx, sx, y, 16);
        // Chip damage on current sticker
        if (i === stickers - 1 && chip > 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(sx + 12 - chip * 4, y, chip * 4, 32);
        }
        // White border
        ctx.strokeStyle = C.hudBorder;
        ctx.lineWidth = 2.5;
        this._strokeHeart(ctx, sx, y, 16);
      } else {
        // Empty sticker
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        this._drawHeart(ctx, sx, y, 16);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1.5;
        this._strokeHeart(ctx, sx, y, 16);
      }
    }
  }

  _drawHeart(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x + s, y + s * 0.3);
    ctx.bezierCurveTo(x + s, y, x + s * 0.5, y, x + s * 0.5, y + s * 0.3);
    ctx.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
    ctx.bezierCurveTo(x, y + s * 0.6, x + s * 0.5, y + s, x + s, y + s * 1.2);
    ctx.bezierCurveTo(x + s * 1.5, y + s, x + s * 2, y + s * 0.6, x + s * 2, y + s * 0.3);
    ctx.bezierCurveTo(x + s * 2, y, x + s * 1.5, y, x + s, y + s * 0.3);
    ctx.fill();
  }

  _strokeHeart(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x + s, y + s * 0.3);
    ctx.bezierCurveTo(x + s, y, x + s * 0.5, y, x + s * 0.5, y + s * 0.3);
    ctx.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
    ctx.bezierCurveTo(x, y + s * 0.6, x + s * 0.5, y + s, x + s, y + s * 1.2);
    ctx.bezierCurveTo(x + s * 1.5, y + s, x + s * 2, y + s * 0.6, x + s * 2, y + s * 0.3);
    ctx.bezierCurveTo(x + s * 2, y, x + s * 1.5, y, x + s, y + s * 0.3);
    ctx.stroke();
  }

  _drawCoins(ctx, x, y, count) {
    // Coin icon
    ctx.fillStyle = C.coin;
    ctx.beginPath();
    ctx.arc(x + 10, y + 14, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.coinShine;
    ctx.beginPath();
    ctx.arc(x + 8, y + 12, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#C4A830';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 10, y + 14, 10, 0, Math.PI * 2);
    ctx.stroke();
    // Count
    ctx.fillStyle = C.yellow;
    ctx.font = 'bold 18px "Fredoka", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`x ${count}`, x + 26, y + 20);
  }

  _drawScrapMeter(ctx, x, y, meter, max) {
    const w = 180, h = 24;
    const ratio = meter / max;
    // Determine tier color
    const tierColor = ratio < 0.25 ? '#7FE08A'
                    : ratio < 0.50 ? '#FFD447'
                    : ratio < 0.75 ? '#FF9F43'
                    : '#FF5A5A';
    const tierName = ratio < 0.25 ? 'GREEN'
                   : ratio < 0.50 ? 'YELLOW'
                   : ratio < 0.75 ? 'ORANGE'
                   : 'RED';
    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h / 2);
    ctx.fill();
    // Border
    ctx.strokeStyle = C.hudBorder;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h / 2);
    ctx.stroke();
    // Tier threshold marks (at 25%, 50%, 75%)
    [0.25, 0.50, 0.75].forEach(p => {
      const tx = x + 3 + p * (w - 6);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx, y + 4);
      ctx.lineTo(tx, y + h - 4);
      ctx.stroke();
    });
    // Fill
    const fill = ratio * (w - 6);
    if (fill > 0) {
      ctx.fillStyle = tierColor;
      ctx.beginPath();
      ctx.roundRect(x + 3, y + 3, fill, h - 6, (h - 6) / 2);
      ctx.fill();
    }
    // Label
    ctx.fillStyle = meter > 20 ? '#0A0A0A' : C.white;
    ctx.font = 'bold 11px "Nunito", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`SCRAP • ${tierName}`, x + w / 2, y + 16);
    // Assist key hint if meter is usable
    if (meter >= 20) {
      ctx.fillStyle = tierColor;
      ctx.font = 'bold 9px "Nunito", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('[Q] ASSIST', x + w / 2, y + h + 12);
    }
  }

  _drawPower(ctx, x, y, pm) {
    const size = 42;
    // Circle background
    ctx.fillStyle = pm.active.color;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    // Timer arc
    const pct = pm.timer / pm.active.dur;
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2 + 2, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
    ctx.stroke();
    // Border
    ctx.strokeStyle = C.hudBorder;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.stroke();
    // Letter
    ctx.fillStyle = C.white;
    ctx.font = 'bold 18px "Anton", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pm.active.letter, x + size / 2, y + size / 2 + 1);
    ctx.textBaseline = 'alphabetic';
    // Timer text
    ctx.fillStyle = C.white;
    ctx.font = 'bold 12px "Nunito", sans-serif';
    ctx.fillText(`${Math.ceil(pm.timer)}s`, x + size / 2, y + size + 14);
  }

  _drawLog(ctx, log) {
    const entries = log.recent(3);
    const x = 16, y = H - 20;
    // Tab hint
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = C.scrapC;
    ctx.font = '10px "Nunito", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('[TAB] Flight Log', x, y - entries.length * 16 - 8);
    // Entries
    ctx.globalAlpha = 0.6;
    entries.forEach((e, i) => {
      ctx.fillStyle = C.scrapC;
      ctx.font = '11px "Nunito", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`> ${e.text}`, x, y - i * 16);
    });
    ctx.globalAlpha = 1;
  }
}
