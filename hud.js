'use strict';
(function (WB) {
  const U = WB.ui, A = WB.ABIL, PI2 = Math.PI * 2, FONT = '"Trebuchet MS","Segoe UI",Arial,sans-serif';
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const I = WB.input;
  const sticks = U.sticks = { move: null, aim: null };
  let lastType = 'mouse', resultsT = 0;

  // ---------- icônes d'interface supplémentaires ----------
  const baseIcon = WB.drawIcon;
  const EXTRA = {
    back: function (c) { c.beginPath(); c.moveTo(0.55, -0.7); c.lineTo(-0.5, 0); c.lineTo(0.55, 0.7); c.lineWidth = 0.28; c.strokeStyle = '#fff'; c.stroke(); },
    pause: function (c) { c.fillStyle = '#fff'; c.fillRect(-0.55, -0.65, 0.4, 1.3); c.fillRect(0.15, -0.65, 0.4, 1.3); },
    chain: function (c) { c.lineWidth = 0.22; c.strokeStyle = '#ffb0ff'; for (const x of [-0.45, 0.45]) { c.beginPath(); c.ellipse(x, 0, 0.5, 0.32, 0, 0, PI2); c.stroke(); } c.beginPath(); c.moveTo(-0.2, 0); c.lineTo(0.2, 0); c.stroke(); },
    glut: function (c) { c.fillStyle = '#ff6a9a'; c.beginPath(); c.arc(0, 0, 0.85, 0, PI2); c.fill(); c.fillStyle = '#3a0a22'; c.beginPath(); c.ellipse(0, 0.12, 0.5, 0.36, 0, 0, PI2); c.fill(); c.fillStyle = '#ffb0cc'; c.beginPath(); c.ellipse(0.05, 0.4, 0.28, 0.5, 0, 0, PI2); c.fill(); },
    summon: function (c) { c.strokeStyle = '#4adcc8'; c.lineWidth = 0.16; c.beginPath(); c.arc(0, 0, 0.8, 0, PI2); c.stroke(); c.fillStyle = '#4adcc8'; for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * PI2 / 3; c.beginPath(); c.arc(Math.cos(a) * 0.8, Math.sin(a) * 0.8, 0.17, 0, PI2); c.fill(); } c.beginPath(); c.moveTo(0, -0.4); c.lineTo(0.12, -0.1); c.lineTo(0.42, 0); c.lineTo(0.12, 0.1); c.lineTo(0, 0.4); c.lineTo(-0.12, 0.1); c.lineTo(-0.42, 0); c.lineTo(-0.12, -0.1); c.closePath(); c.fill(); },
    cancel: function (c) { c.strokeStyle = '#cfd6e8'; c.lineWidth = 0.2; c.beginPath(); c.arc(0, 0, 0.75, 0, PI2); c.stroke(); c.strokeStyle = '#ff5a6a'; c.beginPath(); c.moveTo(-0.53, 0.53); c.lineTo(0.53, -0.53); c.stroke(); c.fillStyle = '#cfd6e8'; c.beginPath(); c.moveTo(0.1, -0.4); c.lineTo(-0.2, 0.05); c.lineTo(0, 0.05); c.lineTo(-0.1, 0.4); c.lineTo(0.2, -0.05); c.lineTo(0, -0.05); c.closePath(); c.fill(); },
    shark: function (c) { c.fillStyle = '#6a8aa8'; c.beginPath(); c.moveTo(-0.9, 0.6); c.quadraticCurveTo(-0.2, -1.1, 0.1, -0.9); c.quadraticCurveTo(0.2, -0.2, 0.9, 0.6); c.closePath(); c.fill(); c.strokeStyle = '#9ad8ff'; c.lineWidth = 0.14; c.beginPath(); c.moveTo(-1, 0.8); c.quadraticCurveTo(0, 0.5, 1, 0.8); c.stroke(); },
    golem: function (c) { c.fillStyle = '#9096a6'; c.beginPath(); c.moveTo(-0.7, 0.8); c.lineTo(-0.8, -0.2); c.lineTo(-0.4, -0.8); c.lineTo(0.4, -0.8); c.lineTo(0.8, -0.2); c.lineTo(0.7, 0.8); c.closePath(); c.fill(); c.fillStyle = '#ffb84a'; c.beginPath(); c.arc(-0.22, -0.35, 0.12, 0, PI2); c.arc(0.22, -0.35, 0.12, 0, PI2); c.fill(); },
    dragon: function (c) { c.fillStyle = '#d83a2a'; c.beginPath(); c.arc(-0.1, 0.1, 0.6, 0, PI2); c.fill(); c.beginPath(); c.ellipse(0.5, 0.05, 0.4, 0.28, 0, 0, PI2); c.fill(); c.fillStyle = '#ffb84a'; c.beginPath(); c.moveTo(0.9, 0); c.quadraticCurveTo(1.2, -0.4, 1.4, 0); c.quadraticCurveTo(1.2, 0.3, 0.9, 0); c.fill(); c.fillStyle = '#ffe27a'; c.beginPath(); c.arc(0.1, -0.1, 0.1, 0, PI2); c.fill(); },
    play: function (c) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-0.4, -0.65); c.lineTo(0.6, 0); c.lineTo(-0.4, 0.65); c.closePath(); c.fill(); }
  };
  WB.drawIcon = function (c, id, cx, cy, sz) {
    const f = EXTRA[id]; if (!f) return baseIcon(c, id, cx, cy, sz);
    c.save(); c.translate(cx, cy); c.scale(sz / 2, sz / 2); c.lineCap = 'round'; c.lineJoin = 'round'; f(c); c.restore();
  };

  // ---------- minicarte ----------
  U.buildMini = function () {
    const G = WB.G, W = G.world, w = 150, h = Math.round(150 * WB.GH / WB.GW), c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    const sx = w / WB.GW, sy = h / WB.GH, base = { donjon: '#3b4058', urban: '#8d887c', nature: '#4f8a38' }[G.cfg.arena];
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let y = 0; y < WB.GH; y++) for (let x = 0; x < WB.GW; x++) {
      const k = W.code(x, y); let col = null;
      if (k === 1 || k === 6) col = '#14161f'; else if (k === 2) col = '#3a7ad8'; else if (k === 3) col = '#2c5a22'; else if (k === 5) col = '#6a6a70';
      if (col) { g.fillStyle = col; g.fillRect(Math.floor(x * sx), Math.floor(y * sy), Math.ceil(sx), Math.ceil(sy)); }
    }
    for (const hs of W.houses) { g.fillStyle = '#a0522d'; g.fillRect(hs.tx * sx, hs.ty * sy, 3 * sx, 2 * sy); }
    U.mini = { cv: c, w: w, h: h };
  };

  // ---------- pause ----------
  U.setPause = function (v) {
    const G = WB.G; if (!G || G.over || U.screen !== 'game') return;
    if (v === U.paused) return; U.paused = v; I.reset(); sticks.move = sticks.aim = null;
    if (G.started) WB.sdk.msg(v ? 'gameplay_stopped' : 'gameplay_started');
  };
  document.addEventListener('visibilitychange', function () { if (document.hidden) U.setPause(true); });

  // ---------- clavier ----------
  U.chainMode = false; U.chainSel = [];
  U.onKey = function (e) {
    const G = WB.G, k = (e.key || '').toLowerCase();
    if (U.screen !== 'game' || !G) { if (U.screen === 'title' && (k === 'enter' || k === ' ')) { WB.snd.unlock(); U.go('menu'); } return; }
    if (k === 'p' || k === 'escape') { U.setPause(!U.paused); return; }
    if (U.paused || G.over) return;
    lastType = 'mouse';
    const m = /^(Digit|Numpad)([1-9])$/.exec(e.code);
    if (m) { const n = parseInt(m[2], 10); if (G.formPrompt && n >= 7) { G.formPrompt.ab.form = ['shark', 'golem', 'dragon'][n - 7]; G.formPrompt = null; return; } castSlot(n - 1); return; }
    if (k === ' ') throwBomb();
    else if (k === 'e' || k === 'shift') { U.chainMode = !U.chainMode; U.chainSel = []; }
    else if (k === 'f' || k === 'enter') fireChain();
    else if (k === 'x' && G.swap) G.declineSwap();
  };

  function curAim(f, ab) {
    const G = WB.G;
    if (I.aim.active && I.aim.m > 0.08) return { x: I.aim.x, y: I.aim.y, m: Math.max(0.3, I.aim.m) };
    return ab ? G.autoAim(f, ab) : { x: f.aimLast.x, y: f.aimLast.y, m: 0.6 };
  }
  function castSlot(i) {
    const G = WB.G, f = G.player; if (!G.started || G.over || f.thrall || f.swallowed) return;
    if (G.swap) { G.swapSlot(i); return; }
    if (!f.alive || i >= f.slots.length) return;
    const ab = f.slots[i]; if (!ab || (ab.id === 'summon' && !ab.form)) { WB.snd.play('hit'); return; }
    if (U.chainMode) { const p = U.chainSel.indexOf(i); if (p >= 0) U.chainSel.splice(p, 1); else if (U.chainSel.length < WB.chainMax(f.level)) U.chainSel.push(i); WB.snd.play('click'); return; }
    const aim = curAim(f, ab);
    if (WB.G.useSlot(f, i, aim) && sticks.aim) sticks.aim.cast = true;
  }
  function fireChain() {
    const G = WB.G, f = G.player; if (!U.chainSel.length || !f.alive) return;
    const first = f.slots[U.chainSel[0]]; const aim = curAim(f, first);
    G.chain(f, U.chainSel.slice(), aim); if (sticks.aim) sticks.aim.cast = true; U.chainSel = []; U.chainMode = false;
  }
  function throwBomb(aim) {
    const G = WB.G, f = G.player; if (!G.started || G.over || f.thrall) return;
    const a = aim || (I.aim.active ? { x: I.aim.x, y: I.aim.y, m: Math.max(0.3, I.aim.m) } : { x: f.aimLast.x, y: f.aimLast.y, m: 0.65 });
    if (!G.throwBomb(f, a)) { if (f.bombs <= 0) U.showToast('Plus de bombes', '#ffb0b0'); }
  }

  // ---------- pointeurs en jeu ----------
  U.gamePointer = function (kind, e, px, py, x, y) {
    const G = WB.G; if (!G) return;
    if (e.pointerType) lastType = e.pointerType === 'mouse' ? 'mouse' : 'touch';
    if (U.screen === 'results' || U.paused || (G && G.over)) {
      if (kind === 'down') U.setPressed(U.findBtn(x, y));
      else if (kind === 'up') { const b = U.pressedBtn(); U.setPressed(null); const cur = U.findBtn(x, y); if (b && cur && U.sameBtn(b, cur) && cur.fn) { WB.snd.play('click'); cur.fn(); } }
      return;
    }
    const id = e.pointerId;
    if (kind === 'down') {
      const b = U.findBtn(x, y);
      if (b) { U.setPressed(b); if (b.instant && b.fn) { b.fn(); U.setPressed(null); } return; }
      if (e.pointerType === 'mouse') { if (e.button === 0) { const a = mouseAim(); if (a) throwBomb(a); } else if (e.button === 2) { /* clic droit : première case */ castSlot(0); } return; }
      if (x < U.VW * 0.5) { if (!sticks.move) { sticks.move = { id: id, ox: x, oy: y, x: x, y: y }; I.stickMove = true; } }
      else if (!sticks.aim) { sticks.aim = { id: id, ox: x, oy: y, x: x, y: y, cast: false }; }
    } else if (kind === 'move') {
      const s = sticks.move && sticks.move.id === id ? sticks.move : sticks.aim && sticks.aim.id === id ? sticks.aim : null;
      if (s) { s.x = x; s.y = y; }
    } else if (kind === 'up') {
      const b = U.pressedBtn(); if (b && !b.instant) { U.setPressed(null); const cur = U.findBtn(x, y); if (cur && U.sameBtn(b, cur) && cur.fn) { WB.snd.play('click'); cur.fn(); } }
      if (sticks.move && sticks.move.id === id) { sticks.move = null; I.stickMove = false; I.move.x = I.move.y = 0; }
      if (sticks.aim && sticks.aim.id === id) {
        const s = sticks.aim, dx = s.x - s.ox, dy = s.y - s.oy, d = Math.hypot(dx, dy), m = clamp(d / 70, 0, 1);
        if (!s.cast && m > 0.4 && G.started && !G.swap) throwBomb({ x: dx / d, y: dy / d, m: m });
        sticks.aim = null; I.aim.active = false; I.aim.m = 0;
      }
    }
  };
  function mouseAim() {
    const G = WB.G, v = G.view; if (!v || !G.player.alive) return null;
    const mp = U.mouse(); if (mp.x < 0) return null;
    const sx = (G.player.x - v.x0) * v.z, sy = (G.player.y - v.y0) * v.z, dx = U.mousePx - sx, dy = U.mousePy - sy, d = Math.hypot(dx, dy) || 1;
    return { x: dx / d, y: dy / d, m: clamp(d / (360 * v.z), 0.2, 1) };
  }
  function updateSticks() {
    if (sticks.move) { const s = sticks.move, dx = s.x - s.ox, dy = s.y - s.oy, d = Math.hypot(dx, dy), R = 60; if (d > R) { s.ox += dx / d * (d - R); s.oy += dy / d * (d - R); } const m = clamp(d / R, 0, 1); I.move.x = d > 6 ? dx / d * m : 0; I.move.y = d > 6 ? dy / d * m : 0; I.stickMove = true; }
    if (sticks.aim) { const s = sticks.aim, dx = s.x - s.ox, dy = s.y - s.oy, d = Math.hypot(dx, dy), R = 70; if (d > R) { s.ox += dx / d * (d - R); s.oy += dy / d * (d - R); } if (d > 10) { I.aim.active = true; I.aim.x = dx / d; I.aim.y = dy / d; I.aim.m = clamp(d / R, 0, 1); } else { I.aim.active = false; I.aim.m = 0; } }
    else if (lastType === 'mouse') { const a = mouseAim(); if (a) { I.aim.active = true; I.aim.x = a.x; I.aim.y = a.y; I.aim.m = a.m; } }
  }

  // ---------- surcouche dans le monde ----------
  U.drawWorldOverlay = function (ctx, G, time) {
    const f = G.player; if (!f || !f.alive || G.over) return;
    // zones de capacité prêtes
    for (const ab of f.slots) {
      if (!ab) continue; const def = A[ab.id]; if (def.type !== 'zone' || ab.cd > 0) continue;
      const r = def.range(ab.lvl); if (r > 270) continue;
      const near = G.enemiesIn(f, f.x, f.y, r).length > 0, p = 0.5 + 0.5 * Math.sin(time * 8);
      ctx.save(); ctx.strokeStyle = def.col; ctx.globalAlpha = near ? 0.55 + 0.4 * p : 0.12; ctx.lineWidth = near ? 4 : 2; ctx.setLineDash(near ? [] : [8, 8]);
      ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, PI2); ctx.stroke();
      if (near) { ctx.globalAlpha = 0.1 + 0.1 * p; ctx.fillStyle = def.col; ctx.fill(); }
      ctx.restore();
    }
    // visée
    if (I.aim.active && I.aim.m > 0.08) {
      const L = 40 + I.aim.m * 360, ax = f.x + I.aim.x * L, ay = f.y + I.aim.y * L;
      ctx.save(); ctx.strokeStyle = 'rgba(255,230,120,.85)'; ctx.lineWidth = 4; ctx.setLineDash([2, 12]); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(f.x + I.aim.x * 30, f.y + I.aim.y * 30); ctx.lineTo(ax, ay); ctx.stroke(); ctx.setLineDash([]);
      if (f.bombs > 0) { ctx.globalAlpha = 0.5; ctx.strokeStyle = '#ffb84a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(f.x + I.aim.x * clamp(I.aim.m * 400, 90, 400), f.y + I.aim.y * clamp(I.aim.m * 400, 90, 400), 74, 0, PI2); ctx.stroke(); }
      ctx.restore();
    }
  };

  // ---------- récompenses ----------
  function applyRewards() {
    const G = WB.G, R = G.results, s = U.save; if (U.rewardDone) return; U.rewardDone = true;
    const coins = R.coins + (R.win ? 20 : 5), tro = G.cfg.ranked ? (R.win ? 3 : 0) + (R.rank <= 3 ? 1 : 0) + Math.floor(R.coins / 6) : 0;
    s.coins += coins; s.trophies += tro; s.stats.matches++; s.stats.kills += R.kills; if (R.win) s.stats.wins++;
    U.rew = { coins: coins, tro: tro }; U.commit();
  }
  function leaveTo(next) {
    if (U.adWait) return; U.adWait = true;
    WB.sdk.showInterstitial('match_end', function () { U.adWait = false; next(); });
  }

  // ---------- image de jeu ----------
  U.gameFrame = function (dt, time) {
    const G = WB.G, ctx = U.ctx; if (!G) { U.go('menu'); return; }
    const running = !U.paused && !U.platformPaused && U.screen === 'game';
    if (running) { updateSticks(); I.update(); G.update(dt); }
    else if (G.over) G.update(dt);
    if (G.over && U.screen === 'game') { resultsT += dt; if (resultsT > 1.6) { resultsT = 0; U.go('results'); applyRewards(); } }
    if (!G.over) resultsT = 0;
    ctx.setTransform(U.dpr, 0, 0, U.dpr, 0, 0);
    WB.renderWorld(ctx, U.W, U.H, G, time);
    ctx.setTransform(U.dpr, 0, 0, U.dpr, 0, 0);
    U.ctxTransform();
    if (U.screen === 'game') hud(ctx, G, time);
    if (U.paused && U.screen === 'game') pauseMenu(ctx);
    if (U.screen === 'results') results(ctx, G, time);
    U.drawToast();
    U.endTransform();
  };

  const btn = U.button, text = U.text, panel = U.panel;

  function hud(ctx, G, time) {
    const W = U.VW, H = U.VH, f = G.player, mm = G.mode;
    // pause
    btn(10, 10, 44, 44, { icon: 'pause', style: 'dark', fn: function () { U.setPause(true); }, iconScale: 0.55 });
    // vie, bombes
    panel(60, 10, 214, 54, { r: 12 });
    WB.drawIcon(ctx, 'heart', 78, 27, 22); const p = clamp(f.hp / f.maxhp, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,.55)'; U.rr(ctx, 92, 19, 150, 15, 7); ctx.fill(); ctx.fillStyle = p > 0.6 ? '#46d160' : p > 0.3 ? '#f5c542' : '#ff4a4a'; if (p > 0) { U.rr(ctx, 92, 19, Math.max(10, 150 * p), 15, 7); ctx.fill(); }
    text(Math.ceil(f.hp) + '', 167, 27, 12, '#fff', 'center', 3); text('Niv' + f.level, 258, 27, 12, '#ffd24a', 'center', 3);
    for (let i = 0; i < 5; i++) { ctx.globalAlpha = i < f.bombs ? 1 : 0.22; WB.drawIcon(ctx, 'bomb', 78 + i * 20, 49, 18); } ctx.globalAlpha = 1;
    WB.drawIcon(ctx, 'coin', 190, 49, 15); text(String(G.coinsGot), 202, 50, 14, '#ffe27a', 'left', 3);
    // temps et scores
    const tl = Math.max(0, Math.ceil(G.timeLeft)), mmn = Math.floor(tl / 60), ss = tl % 60;
    panel(W / 2 - 42, 8, 84, 32, { r: 16 }); text(mmn + ':' + (ss < 10 ? '0' : '') + ss, W / 2, 25, 20, tl <= 20 ? '#ff7a7a' : '#fff', 'center', 3);
    if (mm.teams) {
      const n = mm.teams, w = 56, x0 = W / 2 - n * w / 2;
      for (let t = 0; t < n; t++) { panel(x0 + t * w + 2, 44, w - 4, 26, { r: 13, stroke: WB.TEAM_COLORS[t] }); text(String(G.score[t] || 0), x0 + t * w + w / 2, 58, 16, WB.TEAM_COLORS[t], 'center', 3); }
    } else {
      let best = 0; for (const o of G.F) if ((o.kind === 'player' || o.kind === 'bot') && o.kills > best) best = o.kills;
      panel(W / 2 - 70, 44, 140, 26, { r: 13 }); text('Toi ' + f.kills + '   Meilleur ' + best, W / 2, 58, 13, '#fff', 'center', 3);
    }
    // minicarte
    const mp = U.mini;
    if (mp) {
      const mx = W - mp.w - 10, my = 10; panel(mx - 4, my - 4, mp.w + 8, mp.h + 8, { r: 8, fill: 'rgba(0,0,0,.6)' }); ctx.drawImage(mp.cv, mx, my);
      const kx = mp.w / WB.WW, ky = mp.h / WB.WH;
      for (const o of G.F) {
        if (!o.alive) continue; let col = null, r = 2.6;
        if (o === f) { col = '#ffd24a'; r = 3.6; }
        else if (o.kind === 'boss') { col = '#ff3030'; r = 3.6; }
        else if (o.kind === 'player' || o.kind === 'bot') { if (mm.teams && o.team === f.team) col = WB.TEAM_COLORS[o.team]; else if (Math.hypot(o.x - f.x, o.y - f.y) < 650) col = mm.teams ? WB.TEAM_COLORS[o.team] : '#ffffff'; }
        else if (o.kind === 'thrall' && o.team === f.team) col = '#8e95a3';
        if (col) { ctx.fillStyle = col; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(mx + o.x * kx, my + o.y * ky, r, 0, PI2); ctx.fill(); ctx.stroke(); }
      }
      const v = G.view; if (v) { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1; ctx.strokeRect(mx + v.x0 * kx, my + v.y0 * ky, v.w * kx, v.h * ky); }
      // fil d'actualité
      let fy = my + mp.h + 22;
      for (const k of G.feed) { const a = clamp(6 - (G.t - k.t), 0, 1); ctx.globalAlpha = a; ctx.font = 'bold 12px ' + FONT; const wA = ctx.measureText(k.a).width, wB = ctx.measureText(k.b).width; const tw = wA + wB + 22; panel(W - tw - 10, fy - 11, tw, 20, { r: 10, fill: 'rgba(0,0,0,.55)', stroke: 'rgba(255,255,255,.1)' }); text(k.a, W - tw - 4, fy, 12, k.ca, 'left', 3); WB.drawIcon(ctx, 'scythe', W - tw - 4 + wA + 9, fy, 12); text(k.b, W - 14, fy, 12, k.cb, 'right', 3); fy += 24; ctx.globalAlpha = 1; }
    }
    // choix de la forme d'invocation
    if (G.formPrompt) {
      const fp = G.formPrompt, forms = [['shark', 'Requin'], ['golem', 'Golem'], ['dragon', 'Dragon']], pw = 96, px0 = W / 2 - (pw * 3 + 20) / 2, py0 = H * 0.1;
      panel(px0 - 14, py0 - 14, pw * 3 + 48, 128, { r: 16, stroke: '#4adcc8' });
      for (let i = 0; i < 3; i++) btn(px0 + i * (pw + 10), py0, pw, 100, { style: 'dark', instant: true, fn: (function (k) { return function () { fp.ab.form = k; G.formPrompt = null; WB.snd.play('pickup'); }; })(forms[i][0]), draw: function (cx, cy) { WB.drawIcon(ctx, forms[i][0], cx, cy - 8, 52); text(String(7 + i), cx, cy + 36, 13, '#4adcc8', 'center', 3); } });
      ctx.strokeStyle = '#4adcc8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(W / 2, py0 - 28, 10, -Math.PI / 2, -Math.PI / 2 + PI2 * clamp(fp.t / 10, 0, 1)); ctx.stroke();
    }
    if (f.swallowed) { panel(W / 2 - 130, H * 0.1, 260, 36, { r: 14, stroke: '#ff8ad0' }); text("Tu es avalé", W / 2, H * 0.1 + 19, 16, '#ffd0e4', 'center', 3); }
    // case de capacités
    const n = f.slots.length, sw = n > 7 ? 48 : 60, gap = n > 7 ? 6 : 10, tot = n * sw + (n - 1) * gap, sx0 = W / 2 - tot / 2, sy = H - 14 - sw;
    if (G.swap) {
      const pk = G.swap.pk; panel(W / 2 - 190, sy - 78, 380, 66, { r: 14, stroke: A[pk.id].col });
      WB.drawIcon(ctx, pk.id, W / 2 - 160, sy - 45, 38); text('N' + pk.lvl, W / 2 - 140, sy - 25, 12, '#ffd24a', 'left', 3);
      text('Touche la case à remplacer', W / 2 - 20, sy - 56, 14, '#fff', 'center', 3);
      ctx.strokeStyle = A[pk.id].col; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(W / 2 - 160, sy - 45, 24, -Math.PI / 2, -Math.PI / 2 + PI2 * clamp(G.swap.t / 7, 0, 1)); ctx.stroke();
      btn(W / 2 + 70, sy - 66, 104, 42, { label: 'Garder', size: 15, style: 'gray', fn: function () { G.declineSwap(); } });
    }
    for (let i = 0; i < n; i++) {
      const x = sx0 + i * (sw + gap), cx = x + sw / 2, cy = sy + sw / 2, ab = f.slots[i];
      btn(x, sy, sw, sw, { hidden: true, instant: true, fn: (function (k) { return function () { castSlot(k); }; })(i) });
      ctx.save();
      const swap = !!G.swap;
      if (!ab) {
        ctx.setLineDash([7, 6]); ctx.lineWidth = 3; ctx.strokeStyle = swap ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.65)'; ctx.fillStyle = 'rgba(10,14,34,.45)'; ctx.beginPath(); ctx.arc(cx, cy, sw / 2 - 2, 0, PI2); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
        text(String(i + 1), cx, cy, 15, 'rgba(255,255,255,.35)', 'center');
      } else {
        const def = A[ab.id], ready = ab.cd <= 0, mx = def.cd(ab.lvl) * WB.cdMul(ab.id), blocked = f.st.silence > 0 || f.st.frozen > 0 || f.swallowed;
        let near = false; if (ready && def.type === 'zone') near = G.enemiesIn(f, f.x, f.y, def.range(ab.lvl)).length > 0;
        const pulse = 0.5 + 0.5 * Math.sin(time * 9);
        if (near) { ctx.shadowColor = def.col; ctx.shadowBlur = 18 + 10 * pulse; }
        const g = ctx.createRadialGradient(cx, cy - 8, 4, cx, cy, sw / 2); g.addColorStop(0, near ? def.col : '#2a3560'); g.addColorStop(1, near ? '#10183a' : '#141a38');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, sw / 2 - 1, 0, PI2); ctx.fill(); ctx.shadowBlur = 0;
        ctx.lineWidth = near ? 5 : 3.5; ctx.strokeStyle = ab.stolen ? '#ff8ad0' : (ready ? def.col : '#5a6490'); ctx.stroke();
        ctx.globalAlpha = ready ? 1 : 0.55; WB.drawIcon(ctx, (ab.id === 'summon' && ab.form) ? ab.form : ab.id, cx, cy - 2, sw * 0.62); ctx.globalAlpha = 1;
        if (!ready) { ctx.fillStyle = 'rgba(5,8,24,.65)'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, sw / 2 - 2, -Math.PI / 2, -Math.PI / 2 + PI2 * clamp(ab.cd / mx, 0, 1)); ctx.closePath(); ctx.fill(); text(ab.cd >= 10 ? String(Math.ceil(ab.cd)) : ab.cd.toFixed(1), cx, cy, 16, '#fff', 'center', 4); }
        for (let k = 0; k < 5; k++) { ctx.fillStyle = k < ab.lvl ? '#ffd24a' : 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.arc(cx - 16 + k * 8, cy + sw / 2 + 7, 2.7, 0, PI2); ctx.fill(); }
        if (blocked) { ctx.fillStyle = 'rgba(10,10,30,.45)'; ctx.beginPath(); ctx.arc(cx, cy, sw / 2 - 2, 0, PI2); ctx.fill(); WB.drawIcon(ctx, 'lock', cx + 16, cy + 16, 16); }
        const ci = U.chainSel.indexOf(i); if (ci >= 0) { ctx.fillStyle = '#ff8aff'; ctx.beginPath(); ctx.arc(x + sw - 6, y0(sy) + 6, 11, 0, PI2); ctx.fill(); text(String(ci + 1), x + sw - 6, y0(sy) + 7, 13, '#fff', 'center'); }
        if (swap) { ctx.strokeStyle = 'rgba(255,255,255,' + (0.4 + 0.5 * pulse) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, sw / 2 + 4, 0, PI2); ctx.stroke(); }
      }
      ctx.restore();
    }
    function y0(v) { return v; }
    // enchaînement (niveaux 7 et plus)
    if (WB.chainMax(f.level) > 1) {
      const cx = sx0 - 70;
      btn(cx, sy + 2, 56, 56, { icon: 'chain', style: U.chainMode ? 'gold' : 'dark', instant: true, sel: U.chainMode, fn: function () { if (U.chainMode && U.chainSel.length) fireChain(); else { U.chainMode = !U.chainMode; U.chainSel = []; } } });
    }
    // bombe
    const bx = W - 92, by = H - 150;
    btn(bx, by, 72, 72, { style: f.bombs > 0 ? 'red' : 'gray', instant: true, fn: function () { throwBomb(); }, draw: function (cx, cy) { WB.drawIcon(ctx, 'bomb', cx, cy - 4, 40); text('x' + f.bombs, cx + 20, cy + 22, 16, '#fff', 'center', 4); } });
    // joysticks
    if (WB.input.touch || lastType === 'touch') {
      const hint = !sticks.move && !sticks.aim && G.t < 14 ? 0.5 : 0;
      if (!sticks.move && hint) { ctx.globalAlpha = hint; ctx.strokeStyle = '#9ad8ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(120, H - 100, 52, 0, PI2); ctx.stroke(); ctx.globalAlpha = 1; }
      if (!sticks.aim && hint) { ctx.globalAlpha = hint; ctx.strokeStyle = '#ffb84a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W - 150, H - 70, 52, 0, PI2); ctx.stroke(); ctx.globalAlpha = 1; }
      for (const k of ['move', 'aim']) {
        const s = sticks[k]; if (!s) continue; const c = k === 'move' ? '154,216,255' : '255,184,74', R = k === 'move' ? 60 : 70;
        ctx.fillStyle = 'rgba(' + c + ',.14)'; ctx.strokeStyle = 'rgba(' + c + ',.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s.ox, s.oy, R, 0, PI2); ctx.fill(); ctx.stroke();
        const dx = s.x - s.ox, dy = s.y - s.oy, d = Math.hypot(dx, dy), q = d > R ? R / d : 1; ctx.fillStyle = 'rgba(' + c + ',.85)'; ctx.beginPath(); ctx.arc(s.ox + dx * q, s.oy + dy * q, 24, 0, PI2); ctx.fill();
      }
    }
    // compte à rebours et réapparition
    if (!G.started) { const n = Math.ceil(G.countdown); text(n > 0 ? String(n) : 'GO', W / 2, H * 0.36, 90, '#fff', 'center', 10); }
    else if (G.t < 0.8) { ctx.globalAlpha = 1 - G.t / 0.8; text('GO !', W / 2, H * 0.36, 90, '#ffd24a', 'center', 10); ctx.globalAlpha = 1; }
    if (f.thrall && f.alive && !G.over) { const th = f.thrall; panel(W / 2 - 150, H * 0.2, 300, 58, { fill: 'rgba(8,40,28,.82)', stroke: '#8affc8' }); WB.drawIcon(ctx, 'necro', W / 2 - 120, H * 0.2 + 29, 30); text(th.phase === 1 ? 'Tu es possédé' : 'Esclave pour de bon', W / 2 + 10, H * 0.2 + 18, 18, '#8affc8', 'center', 4); text(th.phase === 1 ? 'Survis ' + Math.ceil(th.t) + ' s pour te libérer' : 'Tu ne peux plus te libérer', W / 2 + 10, H * 0.2 + 40, 13, '#fff', 'center', 3); }
    if (!f.alive && !G.over) { panel(W / 2 - 150, H * 0.3, 300, 70, { fill: 'rgba(40,6,10,.8)', stroke: '#ff6a6a' }); text('Éliminé', W / 2, H * 0.3 + 22, 26, '#ff8a8a', 'center', 5); text('Retour dans ' + Math.max(1, Math.ceil(f.respawnT)) + ' s', W / 2, H * 0.3 + 50, 17, '#fff', 'center', 4); }
    if (G.over) { text('Fin du combat', W / 2, H * 0.36, 52, '#ffd24a', 'center', 8); }
    if (U.chainMode) text('Choisis jusqu\'à ' + WB.chainMax(f.level) + ' capacités, puis le bouton de chaîne', W / 2, sy - 100, 14, '#ffb0ff', 'center', 4);
    if (lastType === 'mouse' && G.t < 12) text('ZQSD bouger   Souris viser   Clic bombe   1 à 6 capacités   P pause', W / 2, H - 100, 14, 'rgba(255,255,255,.75)', 'center', 4);
  }

  function pauseMenu(ctx) {
    const W = U.VW, H = U.VH; ctx.fillStyle = 'rgba(4,6,20,.7)'; ctx.fillRect(0, 0, W, H);
    panel(W / 2 - 170, H / 2 - 150, 340, 300, { r: 18 }); text('Pause', W / 2, H / 2 - 118, 32, '#fff', 'center', 6);
    btn(W / 2 - 120, H / 2 - 84, 240, 54, { label: 'Reprendre', style: 'green', size: 22, fn: function () { U.setPause(false); } });
    btn(W / 2 - 120, H / 2 - 22, 240, 54, { label: U.save.sound ? 'Son activé' : 'Son coupé', style: 'blue', size: 20, fn: function () { U.save.sound = !U.save.sound; WB.snd.setEnabled(U.save.sound); U.commit(); } });
    btn(W / 2 - 120, H / 2 + 40, 240, 54, { label: 'Quitter la partie', style: 'red', size: 20, fn: function () { const G = WB.G; G.over = true; U.paused = false; WB.sdk.msg('gameplay_stopped'); U.go('menu'); WB.sdk.showBanner(); } });
  }

  function results(ctx, G, time) {
    const W = U.VW, H = U.VH, R = G.results; if (!R) return;
    ctx.fillStyle = 'rgba(4,6,20,.78)'; ctx.fillRect(0, 0, W, H);
    const pw = Math.min(820, W - 24), x0 = W / 2 - pw / 2;
    text(R.win ? 'VICTOIRE' : 'DÉFAITE', W / 2, 46, 52, R.win ? '#ffd24a' : '#ff8a8a', 'center', 9);
    text(R.teams ? 'Ton équipe termine ' + R.rank + 'e' : 'Tu termines ' + R.rank + 'e sur ' + G.players.length, W / 2, 90, 20, '#fff', 'center', 4);
    // tableau
    panel(x0, 110, pw * 0.62, 330, { r: 14 });
    text('Combattant', x0 + 24, 130, 14, '#9fb4ff', 'left', 3); text('Éliminations', x0 + pw * 0.62 - 100, 130, 14, '#9fb4ff', 'center', 3); text('Chutes', x0 + pw * 0.62 - 30, 130, 14, '#9fb4ff', 'center', 3);
    const list = G.players.slice(0, 10);
    list.forEach(function (o, i) {
      const y = 154 + i * 28, me = o === G.player;
      if (me) { ctx.fillStyle = 'rgba(255,210,74,.18)'; U.rr(ctx, x0 + 8, y - 12, pw * 0.62 - 16, 26, 8); ctx.fill(); }
      text(String(i + 1), x0 + 22, y, 14, '#9fb4ff', 'center', 3);
      WB.drawBlob(ctx, o.spec, x0 + 52, y + 2, 0.5, { t: time, moving: false, fx: 1, fy: 0 });
      text(o.name, x0 + 74, y, 15, R.teams ? WB.TEAM_COLORS[o.team] : (me ? '#ffd24a' : '#fff'), 'left', 3);
      text(String(o.kills), x0 + pw * 0.62 - 100, y, 15, '#fff', 'center', 3); text(String(o.deaths), x0 + pw * 0.62 - 30, y, 15, '#fff', 'center', 3);
    });
    // colonne de droite
    const rx = x0 + pw * 0.62 + 14, rw = pw * 0.38 - 14;
    panel(rx, 110, rw, 190, { r: 14 }); /* récompenses */
    if (R.teams) { R.rows.forEach(function (t, i) { text('Équipe ' + WB.TEAM_NAMES[t.team] + '  ' + t.score, rx + rw / 2, 134 + i * 26, 16, t.col, 'center', 3); }); }
    else text('Tes éliminations : ' + R.kills, rx + rw / 2, 134, 16, '#fff', 'center', 3);
    const rw2 = U.rew || { coins: 0, tro: 0 };
    WB.drawIcon(ctx, 'coin', rx + rw / 2 - 50, 226, 30); text('+' + rw2.coins, rx + rw / 2 - 30, 227, 24, '#ffe27a', 'left', 4);
    if (G.cfg.ranked) { WB.drawIcon(ctx, 'trophy', rx + rw / 2 - 50, 264, 30); text('+' + rw2.tro, rx + rw / 2 - 30, 265, 24, '#fff', 'left', 4); }
    else text('Partie amicale : pas de trophées', rx + rw / 2, 268, 13, '#9fb4ff', 'center', 3);
    if (WB.sdk.rewardedSupported() && !U.doubled) btn(rx, 310, rw, 56, { label: 'Doubler', sub: 'regarder une vidéo', icon: 'coin', style: 'gold', size: 18, fn: function () { WB.sdk.showRewarded('double_reward', function (ok) { if (ok && !U.doubled) { U.doubled = true; U.save.coins += U.rew.coins; U.save.trophies += U.rew.tro; U.rew = { coins: U.rew.coins * 2, tro: U.rew.tro * 2 }; U.commit(); WB.snd.play('coin'); } }); } });
    btn(rx, 376, rw / 2 - 4, 64, { label: 'Rejouer', style: 'green', size: 18, fn: function () { leaveTo(function () { U.startGame(); }); } });
    btn(rx + rw / 2 + 4, 376, rw / 2 - 4, 64, { label: 'Menu', style: 'blue', size: 18, fn: function () { leaveTo(function () { U.go('menu'); WB.sdk.showBanner(); }); } });
  }
})(window.WB);
