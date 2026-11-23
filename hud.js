'use strict';
(function (WB) {
  const U = WB.ui, A = WB.ABIL, PI2 = Math.PI * 2, FONT = '"Trebuchet MS","Segoe UI",Arial,sans-serif';
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const I = WB.input;
  const sticks = U.sticks = { move: null, atk: null };
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
    if (v === U.paused) return; U.paused = v; I.reset(); sticks.move = null;
    if (G.started) WB.sdk.msg(v ? 'gameplay_stopped' : 'gameplay_started');
  };
  document.addEventListener('visibilitychange', function () { if (document.hidden) U.setPause(true); });

  // ---------- clavier ----------
  U.chainMode = false; U.chainSel = [];
  U.onKey = function (e) {
    const G = WB.G, k = (e.key || '').toLowerCase();
    if (U.screen !== 'game' || !G) { if (U.screen === 'title' && (k === 'enter' || k === ' ')) { WB.snd.unlock(); U.go('menu'); } else if (U.screen === 'play' && k === 'enter') { U.startGame(); } return; }
    if (k === 'p' || k === 'escape') { U.setPause(!U.paused); return; }
    if (U.paused || G.over) return;
    lastType = 'mouse';
    const m = /^(Digit|Numpad)([1-9])$/.exec(e.code);
    if (m) { const n = parseInt(m[2], 10); if (G.formPrompt && n >= 7) { G.formPrompt.ab.form = ['shark', 'golem', 'dragon'][n - 7]; G.formPrompt = null; return; } castSlot(n - 1); return; }
    if (k === ' ') throwBomb();
    else if (k === 'x' && G.swap) G.declineSwap();
  };

  function curAim(f, ab) {
    const G = WB.G;
    if (lastType === 'mouse' && I.aim.active && I.aim.m > 0.08) return { x: I.aim.x, y: I.aim.y, m: Math.max(0.3, I.aim.m) };
    return ab ? G.autoAim(f, ab) : { x: f.aimLast.x, y: f.aimLast.y, m: 0.6 };
  }
  function castSlot(i) {
    const G = WB.G, f = G.player; if (!G.started || G.over || f.thrall || f.swallowed) return;
    if (G.swap) { G.swapSlot(i); return; }
    if (!f.alive || i >= f.slots.length) return;
    const ab = f.slots[i]; if (!ab || (ab.id === 'summon' && !ab.form)) { WB.snd.play('hit'); return; }
    const aim = curAim(f, ab);
    WB.G.useSlot(f, i, aim);
  }
  function throwBomb(aim) {
    const G = WB.G, f = G.player; if (!G.started || G.over || f.thrall) return;
    let a = aim; if (!a && lastType !== 'mouse') { const t = G.nearest(f, 400); if (t) { const d = Math.hypot(t.x - f.x, t.y - f.y) || 1; a = { x: (t.x - f.x) / d, y: (t.y - f.y) / d, m: clamp(d / 400, 0.2, 1) }; } }
    if (!a) a = I.aim.active ? { x: I.aim.x, y: I.aim.y, m: Math.max(0.3, I.aim.m) } : { x: f.aimLast.x, y: f.aimLast.y, m: 0.65 };
    if (!G.throwBomb(f, a)) { if (f.bombs <= 0) U.showToast('Plus de bombes', '#ffb0b0'); }
  }


  // ---------- stick d'attaque : capacités chargées ----------
  function normLoadout(f) {
    const mx = WB.chainMax(f.level || 1); let lo = f.loadout; if (!Array.isArray(lo)) lo = f.loadout = [];
    lo.length = mx; for (let k = 0; k < mx; k++) { if (lo[k] == null || !f.slots[lo[k]] || lo.indexOf(lo[k]) !== k) lo[k] = null; }
  }
  // disposition par niveau : 1 à 6 un seul au centre ; 7 deux côte à côte ; 8 triangle ; 9 quatre en losange (comme une manette PSP) ; 10 losange + centre
  function atkLayout(f) {
    const mx = WB.chainMax(f.level || 1);
    if (mx <= 1) return [{ x: 0, y: 0, r: 32 }];
    if (mx === 2) return [{ x: -34, y: 0, r: 27 }, { x: 34, y: 0, r: 27 }];
    if (mx === 3) return [{ x: 0, y: -37, r: 25 }, { x: -37, y: 27, r: 25 }, { x: 37, y: 27, r: 25 }];
    if (mx === 4) return [{ x: 0, y: -42, r: 23 }, { x: 42, y: 0, r: 23 }, { x: 0, y: 42, r: 23 }, { x: -42, y: 0, r: 23 }];
    return [{ x: 0, y: -46, r: 20 }, { x: 46, y: 0, r: 20 }, { x: 0, y: 46, r: 20 }, { x: -46, y: 0, r: 20 }, { x: 0, y: 0, r: 20 }];
  }
  U.assignAtk = function (i, pos) {
    const f = WB.G.player, ab = f.slots[i]; if (!ab) return false; if (f.fusion) { U.showToast('Défusionne pour changer les capacités', '#ffd0a0'); return false; } normLoadout(f); const lo = f.loadout, mx = lo.length;
    const was = lo.indexOf(i);
    if (mx === 1) { lo[0] = i; WB.snd.play('click'); return true; }
    if (was >= 0 && pos == null) return false;
    if (was >= 0) lo[was] = null;
    let p = pos; if (p == null) { p = lo.indexOf(null); if (p < 0) p = 0; }
    lo[p] = i; WB.snd.play('click'); return true;
  };
  U.unassignAtk = function (i) { const f = WB.G.player; if (f.fusion) { U.showToast('Défusionne pour changer les capacités', '#ffd0a0'); return false; } normLoadout(f); const k = f.loadout.indexOf(i); if (k >= 0 && f.loadout.length > 1) { f.loadout[k] = null; return true; } return false; };
  function drawAbilityDisc(ctx, f, ab, cx, cy, r, o) {
    const def = A[ab.id], G = WB.G, n = ab.n == null ? 5 : ab.n, recharge = ab.cd > 0, blocked = f.st.silence > 0 || f.st.frozen > 0 || f.swallowed, mx = def.cd(ab.lvl) * WB.cdMul(ab.id);
    ctx.save(); ctx.globalAlpha = o.drag ? 0.9 : 1;
    const g = ctx.createRadialGradient(cx, cy - r * 0.15, 3, cx, cy, r); g.addColorStop(0, '#1c2447'); g.addColorStop(1, '#0c1230'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r - 1, 0, PI2); ctx.fill();
    if (o.prog) { const fr = WB.abilProgress(ab), RR = r - 3; if (fr > 0) { ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, RR, 0, PI2); ctx.clip(); const top = cy + RR - 2 * RR * fr; ctx.fillStyle = def.col; ctx.globalAlpha = 0.8; ctx.fillRect(cx - RR, top, 2 * RR, cy + RR - top + 1); ctx.restore(); } }
    ctx.lineWidth = o.only ? 5 : 3.5; ctx.strokeStyle = o.loaded ? '#ffffff' : ab.stolen ? '#ff8ad0' : (recharge ? '#5a6490' : def.col); if (o.glow) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 12 * o.glow; } ctx.stroke(); ctx.shadowBlur = 0;
    ctx.globalAlpha *= recharge ? 0.55 : 1; WB.drawIcon(ctx, (ab.id === 'summon' && ab.form) ? ab.form : ab.id, cx, cy - 1, r * 1.25); ctx.globalAlpha = o.drag ? 0.9 : 1;
    if (recharge) { ctx.fillStyle = 'rgba(5,8,24,.68)'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r - 2, -Math.PI / 2, -Math.PI / 2 + PI2 * clamp(ab.cd / mx, 0, 1)); ctx.closePath(); ctx.fill(); text(ab.cd >= 10 ? String(Math.ceil(ab.cd)) : ab.cd.toFixed(1), cx, cy, Math.max(12, r * 0.6), '#fff', 'center', 4); }
    if (blocked) { ctx.fillStyle = 'rgba(10,10,30,.45)'; ctx.beginPath(); ctx.arc(cx, cy, r - 2, 0, PI2); ctx.fill(); WB.drawIcon(ctx, 'lock', cx + r * 0.5, cy + r * 0.5, r * 0.5); }
    // charges restantes x/5
    const bw = Math.max(26, r * 0.9), bh = 15, bxx = cx + r * 0.55 - bw / 2 + 2, byy = cy + r - 8;
    ctx.fillStyle = recharge ? '#7a2a2a' : n <= 1 ? '#a8631a' : '#16213f'; ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5; U.rr(ctx, cx - bw / 2, byy - bh / 2 + 4, bw, bh, 7); ctx.fill(); ctx.stroke();
    text(n + '/5', cx, byy + 5, 11, '#fff', 'center', 3);
    if (o.dots) { for (let k = 0; k < 5; k++) { ctx.fillStyle = k < ab.lvl ? '#ffd24a' : 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.arc(cx - 16 + k * 8, cy - r - 5, 2.7, 0, PI2); ctx.fill(); } }
    ctx.restore();
  }

  // ---------- pointeurs en jeu ----------
  // Relâche toujours les joysticks : un doigt qui quitte l'écran, un appel, un changement d'application ou une pause ne doivent jamais laisser un stick coincé.
  U.resetSticks = function () { sticks.move = null; sticks.atk = null; U.dragSlot = null; I.stickMove = false; I.move.x = I.move.y = 0; I.aim.active = false; I.aim.m = 0; };
  U.releasePointer = function (id) {
    if (sticks.move && sticks.move.id === id) { sticks.move = null; I.stickMove = false; I.move.x = I.move.y = 0; }
    if (sticks.atk && sticks.atk.id === id) sticks.atk = null;
    if (U.dragSlot && U.dragSlot.id === id) U.dragSlot = null;
  };
  U.gamePointer = function (kind, e, px, py, x, y) {
    const G = WB.G; if (!G) return;
    if (e.pointerType) lastType = e.pointerType === 'mouse' ? 'mouse' : 'touch';
    if (U.screen === 'results' || U.paused || (G && G.over)) {
      if (kind === 'up') U.releasePointer(e.pointerId);
      if (kind === 'down') U.setPressed(U.findBtn(x, y));
      else if (kind === 'up') { const b = U.pressedBtn(); U.setPressed(null); const cur = U.findBtn(x, y); if (b && cur && U.sameBtn(b, cur) && cur.fn) { WB.snd.play('click'); cur.fn(); } }
      return;
    }
    const id = e.pointerId;
    if (kind === 'down') {
      const at = U.atk, pf = G.player;
      if (at && pf && pf.alive && !G.over) {
        for (let i = 0; i < at.pos.length; i++) { const p = at.pos[i]; if (Math.hypot(x - (p.x + at.sw / 2), y - (p.y + at.sw / 2)) <= at.sw / 2 + 6) { if (G.swap) { castSlot(i); return; } if (pf.slots[i] && !U.dragSlot) U.dragSlot = { id: id, i: i, x: x, y: y, sx: x, sy: y, moved: false }; return; } }
        if (Math.hypot(x - at.A.x, y - at.A.y) <= at.R + 10 && !sticks.atk) { let only = null; at.icons.forEach(function (ic, k) { if (pf.loadout[k] != null && Math.hypot(x - (at.A.x + ic.x), y - (at.A.y + ic.y)) <= ic.r + 4) only = pf.loadout[k]; }); sticks.atk = { id: id, x: x, y: y, only: only }; tapFire(only); return; }
      }
      const b = U.findBtn(x, y);
      if (b) { U.setPressed(b); if (b.instant && b.fn) { b.fn(); U.setPressed(null); } return; }
      if (e.pointerType === 'mouse') { if (e.button === 0) { const a = mouseAim(); if (a) throwBomb(a); } else if (e.button === 2) { /* clic droit : première case */ castSlot(0); } return; }
      if (!sticks.move) { sticks.move = { id: id, ox: x, oy: y, x: x, y: y }; I.stickMove = true; }
    } else if (kind === 'move') {
      const s = sticks.move && sticks.move.id === id ? sticks.move : null;
      if (s) { s.x = x; s.y = y; }
      if (sticks.atk && sticks.atk.id === id) { sticks.atk.x = x; sticks.atk.y = y; }
      if (U.dragSlot && U.dragSlot.id === id) { const dr = U.dragSlot; dr.x = x; dr.y = y; if (Math.hypot(x - dr.sx, y - dr.sy) > 10) dr.moved = true; }
    } else if (kind === 'up') {
      if (sticks.atk && sticks.atk.id === id) sticks.atk = null;
      if (U.dragSlot && U.dragSlot.id === id) {
        const dr = U.dragSlot, at = U.atk, pf = G.player; U.dragSlot = null;
        if (at && pf && pf.alive) {
          const lo = pf.loadout;
          if (dr.moved) { if (Math.hypot(x - at.A.x, y - at.A.y) <= at.R + 16) { let best = 0, bd = 1e9; at.icons.forEach(function (ic, k) { const d = Math.hypot(x - (at.A.x + ic.x), y - (at.A.y + ic.y)); if (d < bd) { bd = d; best = k; } }); let p = null; if (lo.length > 1) p = lo[best] == null ? best : (lo.indexOf(null) >= 0 ? lo.indexOf(null) : best); U.assignAtk(dr.i, p); } }
          else if (lo.indexOf(dr.i) >= 0) U.unassignAtk(dr.i); else U.assignAtk(dr.i, null);
        }
        return;
      }
      const b = U.pressedBtn(); if (b && !b.instant) { U.setPressed(null); const cur = U.findBtn(x, y); if (cur && U.sameBtn(b, cur) && cur.fn) { WB.snd.play('click'); cur.fn(); } }
      if (sticks.move && sticks.move.id === id) { sticks.move = null; I.stickMove = false; I.move.x = I.move.y = 0; }
    }
  };
  function mouseAim() {
    const G = WB.G, v = G.view; if (!v || !G.player.alive) return null;
    const mp = U.mouse(); if (mp.x < 0) return null;
    const sx = (G.player.x - v.x0) * v.z, sy = (G.player.y - v.y0) * v.z, dx = U.mousePx - sx, dy = U.mousePy - sy, d = Math.hypot(dx, dy) || 1;
    return { x: dx / d, y: dy / d, m: clamp(d / (360 * v.z), 0.2, 1) };
  }
  // appui direct sur la capacité (ou sur l'analogue) : tir automatique sur l'adversaire le plus proche, sans bouger l'analogue
  const NOTARGET_OK = { shield: 1, invis: 1 };
  function tapFire(only) {
    const G = WB.G, f = G.player; if (!f || !f.alive || !G.started || G.over || f.thrall || f.swallowed) return;
    if (f.fusion) { if (!WB.fusionReady(f)) { U.showToast((f.fusionCd || 0) > 0 ? 'Fusion en recharge : ' + Math.ceil(f.fusionCd) + ' s' : 'Fusion indisponible', '#ffd0a0'); return; } if (!WB.castFusion(f)) U.showToast('Aucun adversaire à portée', '#ffd0a0'); return; }
    const list = only != null ? [only] : f.loadout.filter(function (v) { return v != null; }); let fired = 0, noTarget = false;
    for (const i of list) {
      const ab = f.slots[i]; if (!ab || ab.cd > 0 || ab.gap > 0 || (ab.n != null && ab.n <= 0) || (ab.id === 'summon' && !ab.form)) continue;
      const au = G.autoAim(f, ab); if (!au.target && !NOTARGET_OK[ab.id]) { noTarget = true; continue; }
      if (G.useSlot(f, i, au)) fired++;
    }
    if (!fired && noTarget) U.showToast('Aucun adversaire à portée', '#ffd0a0');
  }
  function attackStick() {
    const st = sticks.atk, G = WB.G, f = G.player; if (!st || !f || !f.alive || !G.started || G.over || f.thrall || f.swallowed || !U.atk) return;
    if (f.fusion) { if (st.pushT == null) st.pushT = 0; const dx0 = st.x - U.atk.A.x, dy0 = st.y - U.atk.A.y; if (Math.hypot(dx0, dy0) >= U.atk.R * 0.28 && WB.fusionReady(f)) WB.castFusion(f); return; }
    const dx = st.x - U.atk.A.x, dy = st.y - U.atk.A.y, d = Math.hypot(dx, dy), R = U.atk.R; if (d < R * 0.28) return;
    const ux = dx / d, uy = dy / d, m = clamp(d / R, 0.25, 1), list = st.only != null ? [st.only] : f.loadout.filter(function (v) { return v != null; });
    for (const i of list) {
      const ab = f.slots[i]; if (!ab || ab.cd > 0 || ab.gap > 0 || (ab.n != null && ab.n <= 0) || (ab.id === 'summon' && !ab.form)) continue;
      const au = G.autoAim(f, ab); let aim = { x: ux, y: uy, m: m };
      if (au.target && au.x * ux + au.y * uy >= 0.93) aim = au;   // un adversaire dans la direction poussée : la capacité part sur lui
      G.useSlot(f, i, aim);
    }
  }
  function updateSticks() {
    attackStick();
    if (sticks.move) { const s = sticks.move, dx = s.x - s.ox, dy = s.y - s.oy, d = Math.hypot(dx, dy), R = 60; if (d > R) { s.ox += dx / d * (d - R); s.oy += dy / d * (d - R); } const m = clamp(d / R, 0, 1); I.move.x = d > 6 ? dx / d * m : 0; I.move.y = d > 6 ? dy / d * m : 0; I.stickMove = true; }

    if (lastType === 'mouse') { const a = mouseAim(); if (a) { I.aim.active = true; I.aim.x = a.x; I.aim.y = a.y; I.aim.m = a.m; } }
  }

  // ---------- surcouche dans le monde ----------
  U.drawWorldOverlay = function (ctx, G, time) {
    const f = G.player; if (!f || !f.alive || G.over) return;
    // zones de capacité prêtes
    const done = {};
    for (const ab of f.slots) {
      if (!ab) continue; const def = A[ab.id]; const eau5 = ab.id === 'water' && ab.lvl >= 5;
      // rayon d'action : visible seulement par le propriétaire (ce dessin n'existe que pour le joueur local), pour toute capacité prête placée dans l'analogue
      const inLoad = (f.loadout || []).indexOf(f.slots.indexOf(ab)) >= 0, ready = !(ab.cd > 0) && (ab.n == null || ab.n > 0);
      if (!eau5 && !(inLoad && ready) && !(def.type === 'zone' && ready && def.range(ab.lvl) <= 270)) continue;
      const r = def.range(ab.lvl); if (!(r > 0)) continue; if (done[def.col + ':' + Math.round(r)]) continue; done[def.col + ':' + Math.round(r)] = 1;
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
    // le niveau du profil monte avec les éliminations faites dans l'intervalle du niveau en cours (les kills des niveaux précédents ne comptent plus)
    s.lvKills = (s.lvKills || 0) + R.kills; let up = 0, unlock = [];
    while (s.level < WB.MAXLV && s.lvKills >= WB.xpNeed(s.level)) { s.lvKills -= WB.xpNeed(s.level); s.level++; up++; if (WB.slotCount(s.level) > WB.slotCount(s.level - 1)) unlock.push('case de capacité ' + WB.slotCount(s.level)); if (WB.chainMax(s.level) > WB.chainMax(s.level - 1)) unlock.push('enchaînement de ' + WB.chainMax(s.level)); if (WB.startLv({ kind: 'player', level: s.level }) > WB.startLv({ kind: 'player', level: s.level - 1 })) unlock.push('capacités ramassées niveau ' + WB.startLv({ kind: 'player', level: s.level })); }
    if (s.level >= WB.MAXLV) s.lvKills = 0;
    U.rew = { coins: coins, tro: tro, up: up, unlock: unlock }; if (up) { WB.snd.play('levelup'); U.showToast('Niveau ' + s.level + ' atteint !' + (unlock.length ? ' Débloqué : ' + unlock.join(', ') : ''), '#ffe27a'); } U.commit();
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
    // ---- capacités (extrême droite), stick d'attaque toujours visible, bombe ----
    const n = f.slots.length, sw = 54, gap = 8, rowH = sw + 18, M = 14, bs = 64, R = 76;
    normLoadout(f);
    const pos = []; for (let i = 0; i < n; i++) pos.push({ x: W - M - sw - (i % 2) * (sw + gap), y: H - M - sw - 12 - Math.floor(i / 2) * rowH });
    const rowsN = Math.max(1, Math.ceil(n / 2)), sy = H - M - sw - 12 - (rowsN - 1) * rowH;
    const A0 = { x: W - M - 2 * sw - gap - 18 - R, y: H - M - R - 4 };
    const icons = atkLayout(f); U.atk = { A: A0, R: R, sw: sw, pos: pos, icons: icons };
    if (G.swap) {
      const pk = G.swap.pk; panel(W - M - 396, sy - 78, 380, 66, { r: 14, stroke: A[pk.id].col });
      WB.drawIcon(ctx, pk.id, W - M - 366, sy - 45, 38); text('N' + pk.lvl, W - M - 346, sy - 25, 12, '#ffd24a', 'left', 3);
      text('Touche la case à remplacer', W - M - 226, sy - 56, 14, '#fff', 'center', 3);
      ctx.strokeStyle = A[pk.id].col; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(W - M - 366, sy - 45, 24, -Math.PI / 2, -Math.PI / 2 + PI2 * clamp(G.swap.t / 7, 0, 1)); ctx.stroke();
      btn(W - M - 120, sy - 66, 104, 42, { label: 'Garder', size: 15, style: 'gray', fn: function () { G.declineSwap(); } });
    }
    const pulse = 0.5 + 0.5 * Math.sin(time * 9), dr = U.dragSlot;
    // cases de capacités
    for (let i = 0; i < n; i++) {
      const x = pos[i].x, ys = pos[i].y, cx = x + sw / 2, cy = ys + sw / 2, ab = f.slots[i], inA = f.loadout.indexOf(i) >= 0;
      ctx.save();
      if (!ab) {
        ctx.setLineDash([7, 6]); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.fillStyle = 'rgba(10,14,34,.45)'; ctx.beginPath(); ctx.arc(cx, cy, sw / 2 - 2, 0, PI2); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
        text(String(i + 1), cx, cy, 15, 'rgba(255,255,255,.35)', 'center');
      } else {
        const def = A[ab.id];
        ctx.globalAlpha = dr && dr.i === i && dr.moved ? 0.35 : 1;
        drawAbilityDisc(ctx, f, ab, cx, cy, sw / 2, { prog: true, dots: true, loaded: inA, glow: G.swap ? pulse : 0, time: time });
      }
      ctx.restore();
    }
    // stick d'attaque
    {
      const st = sticks.atk, act = !!st; ctx.save();
      ctx.fillStyle = act ? 'rgba(255,190,90,.22)' : 'rgba(255,190,90,.12)'; ctx.strokeStyle = act ? 'rgba(255,205,120,.95)' : 'rgba(255,205,120,.6)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(A0.x, A0.y, R, 0, PI2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(A0.x, A0.y, R * 0.28, 0, PI2); ctx.stroke();
      const hov = dr && dr.moved && Math.hypot(dr.x - A0.x, dr.y - A0.y) <= R + 16;
      if (hov) { ctx.strokeStyle = 'rgba(255,255,255,' + (0.5 + 0.5 * pulse) + ')'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(A0.x, A0.y, R + 6, 0, PI2); ctx.stroke(); }
      const fused = !!f.fusion;
      for (let k = 0; !fused && k < icons.length; k++) {
        const ic = icons[k], ix = A0.x + ic.x, iy = A0.y + ic.y, i = f.loadout[k], ab = i != null ? f.slots[i] : null;
        if (!ab) { ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255,255,255,' + (dr && dr.moved ? 0.6 + 0.3 * pulse : 0.3) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ix, iy, ic.r, 0, PI2); ctx.stroke(); ctx.setLineDash([]); continue; }
        drawAbilityDisc(ctx, f, ab, ix, iy, ic.r, { badge: true, time: time, only: st && st.only === i });
      }
      if (fused) {
        const fr = 38, cdm = WB.fusionCooldown(f), cdv = f.fusionCd || 0, ready = WB.fusionReady(f), mem = f.fusion.abs, nm = mem.length;
        const gr = ctx.createRadialGradient(A0.x, A0.y - 6, 4, A0.x, A0.y, fr); gr.addColorStop(0, '#fff3b0'); gr.addColorStop(0.6, '#e8a21c'); gr.addColorStop(1, '#7a4a08'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(A0.x, A0.y, fr, 0, PI2); ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = ready ? '#ffffff' : '#8a7a5a'; if (ready) { ctx.shadowColor = '#ffe27a'; ctx.shadowBlur = 10 + 8 * pulse; } ctx.stroke(); ctx.shadowBlur = 0;
        for (let k = 0; k < nm; k++) { const an = -Math.PI / 2 + k * PI2 / nm + time * 0.8; WB.drawIcon(ctx, mem[k].id, A0.x + Math.cos(an) * 24, A0.y + Math.sin(an) * 24 - 2, 20); }
        if (cdv > 0) { ctx.fillStyle = 'rgba(5,8,24,.62)'; ctx.beginPath(); ctx.moveTo(A0.x, A0.y); ctx.arc(A0.x, A0.y, fr - 2, -Math.PI / 2, -Math.PI / 2 + PI2 * clamp(cdv / cdm, 0, 1)); ctx.closePath(); ctx.fill(); text(String(Math.ceil(cdv)), A0.x, A0.y + 6, 22, '#fff', 'center', 4); }
        else text('FUSION', A0.x, A0.y + 5, 13, '#3a2300', 'center');
        text('Niv.' + WB.fusionLevel(f), A0.x - fr + 8, A0.y - fr + 4, 11, '#ffe9a8', 'center', 3); text(WB.fusionCharges(f) + '/5', A0.x + fr - 8, A0.y + fr - 2, 11, '#fff', 'center', 3);
      }
      if (!f.loadout.some(function (v) { return v != null; })) { text(n ? 'Glisse une capacité' : 'Ramasse un fruit', A0.x, A0.y - R - 14, 13, '#ffe9a8', 'center', 3); if (n && sy) { ctx.strokeStyle = 'rgba(255,233,168,' + (0.4 + 0.5 * pulse) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(A0.x, A0.y, R + 8, 0, PI2); ctx.stroke(); } }
      if (st) { const dx = st.x - A0.x, dy = st.y - A0.y, d = Math.hypot(dx, dy), q = d > R ? R / d : 1; ctx.fillStyle = 'rgba(255,230,160,.9)'; ctx.strokeStyle = 'rgba(120,70,10,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(A0.x + dx * q, A0.y + dy * q, 16, 0, PI2); ctx.fill(); ctx.stroke(); }
      ctx.restore();
    }
    // boutons de fusion (niveau 7 et plus)
    if ((f.level || 1) >= 7 && f.alive && !G.over) {
      const bw = 118, bh = 34, fx0 = A0.x - bw / 2, fy0 = A0.y - R - 14 - bh;
      if (f.fusion) btn(fx0, fy0, bw, bh, { label: 'DÉFUSIONNER', size: 14, style: 'gray', fn: function () { WB.unfuse(f); } });
      else if (WB.canFuse(f)) btn(fx0, fy0, bw, bh, { label: 'FUSIONNER', size: 15, style: 'gold', fn: function () { if (!WB.fuse(f)) U.showToast('Place au moins 2 capacités dans l\'analogue', '#ffd0a0'); } });
      else if (f.loadout.filter(function (v) { return v != null; }).length < 2) { text('Fusion : 2 capacités minimum', A0.x, fy0 + 14, 12, 'rgba(255,233,168,.8)', 'center', 3); }
    }
    // capacité en cours de déplacement
    if (dr && dr.moved && f.slots[dr.i]) drawAbilityDisc(ctx, f, f.slots[dr.i], dr.x, dr.y, sw / 2 + 4, { time: time, drag: true });
    // bombe
    const bx = A0.x - R - 14 - bs, by = H - M - bs;
    btn(bx, by, bs, bs, { style: f.bombs > 0 ? 'red' : 'gray', instant: true, fn: function () { throwBomb(); }, draw: function (cx, cy) { WB.drawIcon(ctx, 'bomb', cx, cy - 4, 36); text('x' + f.bombs, cx + 18, cy + 20, 15, '#fff', 'center', 4); } });
    // joysticks
    if (WB.input.touch || lastType === 'touch') {
      const hint = !sticks.move && G.t < 14 ? 0.5 : 0;
      if (!sticks.move && hint) { ctx.globalAlpha = hint; ctx.strokeStyle = '#9ad8ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(120, H - 100, 52, 0, PI2); ctx.stroke(); ctx.globalAlpha = 1; }
      for (const k of ['move']) {
        const s = sticks[k]; if (!s) continue; const c = '154,216,255', R = 60;
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
