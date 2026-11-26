'use strict';
// Clonage explosif (5 niveaux). Les clones qui combattent sont des combattants de type 'golem' (cl = leurs données),
// donc les ennemis peuvent les viser et les toucher comme n'importe quelle unité, et leurs kills reviennent à leur invocateur.
(function (WB) {
  const PI2 = Math.PI * 2, G = () => WB.G, TS = WB.TS;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const P = {
    1: { chR: 110, chD: 60 },
    2: { max: 150, R: 235, D: 90, cap: 12 },
    3: { max: 170, R: 250, D: 100, cap: 12, sR: 92, sD: 50, det: 340 },
    4: { max: 190, R: 265, D: 110, cap: 12, pR: 90, pD: 65, det: 330, maxPara: 4 },
    5: { max: 280, R: 340, D: 150, absT: 1.3, hpMul: 0.7 }
  };
  WB.CLONE_P = P;

  const real = s => (s && (s.kind === 'golem' || s.kind === 'thrall') && s.owner) ? s.owner : s;
  function foeOk(g, f, t) {
    if (!t.alive || t.team === f.team || t.ghost || (t.st && t.st.jump)) return false;
    if (g.roomBlock(f, t) || g.grassHides(f, t)) return false;
    if (t.st.invis > 0 && dist(f, t) > 80) return false;
    return true;
  }
  function nearestFoe(g, f, maxD) {
    let best = null, bd = maxD;
    for (const t of g.F) { if (!foeOk(g, f, t)) continue; const d = dist(f, t); if (d < bd) { bd = d; best = t; } }
    return best;
  }
  function steer(g, f, gx, gy, dt) {
    const W = g.world, c = f.cl; let tx = gx, ty = gy;
    if (!W.los(f.x, f.y, gx, gy)) {
      c.pT = (c.pT || 0) - dt;
      if (!c.path || c.pT <= 0) { c.path = W.path(f.x, f.y, gx, gy); c.pI = 0; c.pT = 0.5; }
      while (c.pI < c.path.length - 1 && dist(f, c.path[c.pI]) < 30) c.pI++;
      const n = c.path[Math.min(c.pI, c.path.length - 1)]; tx = n.x; ty = n.y;
    }
    const d = Math.hypot(tx - f.x, ty - f.y) || 1; f.want.x = (tx - f.x) / d; f.want.y = (ty - f.y) / d; f.face.x = f.want.x; f.face.y = f.want.y;
  }
  function silentRemove(f) { f.alive = false; f.hp = 0; f.cl && (f.cl.done = true); }

  // ---------- explosions ----------
  function boom(g, owner, x, y, R, D, o) {
    o = o || {};
    g.splash(owner, x, y, R, D, 'clone', { knock: o.knock || 420, stun: o.stun || 0 });
    g.fx('boom', x, y, { life: 0.55 }); g.fx('ring', x, y, { r: R, col: '#ffb04a', life: 0.5, w: 9 }); g.fx('burst', x, y, { col: '#ff7a2a', n: 22, life: 0.6 });
    g.shake(Math.min(10, 3 + R / 60)); g.sfx('boom');
  }
  function explodeBody(g, f, R, D) {
    const c = f.cl; if (!c || c.done || !f.alive) return; c.done = true;
    const owner = f.owner; silentRemove(f);
    boom(g, owner || f, f.x, f.y, R, D);
  }

  // ---------- état du propriétaire ----------
  function clearAll(g, f, quiet) {
    for (const x of g.F) if (x.cl && x.owner === f && x.alive) silentRemove(x);
    if (f.clone && f.clone.abs) release(g, f, true);
    f.clone = null;
  }
  function release(g, f, quiet) {
    const c = f.clone; if (!c || !c.abs) return;
    c.abs = null; f.scale = c.sc0 || 1;
    if (!quiet) { f.st.invuln = Math.max(f.st.invuln || 0, 0.7); g.fx('ring', f.x, f.y, { r: 70, col: '#ffd98a', life: 0.5, w: 6 }); g.fx('burst', f.x, f.y, { col: '#ffd98a', n: 14, life: 0.5 }); }
  }
  function absorb(g, f, until) {
    const c = f.clone; if (c.abs) return;
    c.abs = { t: 0, until: until || Infinity }; c.sc0 = f.scale || 1; f.scale = 1.6;
    g.fx('ring', f.x, f.y, { r: 80, col: '#ff9a3c', life: 0.5, w: 8 }); g.fx('burst', f.x, f.y, { col: '#ff9a3c', n: 16, life: 0.5 }); g.sfx('ab_clone');
  }
  function hideSpot(g, f) {
    const W = g.world, foes = g.F.filter(t => t.alive && t.team !== f.team && !t.ghost), cand = [];
    for (const h of W.houses) cand.push({ x: (h.tx + 2) * TS + TS / 2, y: (h.ty + 2) * TS + TS / 2, b: 160 });
    let n = 0; for (let k = 0; k < 400 && n < 30; k++) { const tx = 2 + Math.floor(Math.random() * (WB.GW - 4)), ty = 2 + Math.floor(Math.random() * (WB.GH - 4)); if (W.grass[ty * WB.GW + tx] && W.code(tx, ty) === 0) { cand.push({ x: tx * TS + TS / 2, y: ty * TS + TS / 2, b: 110 }); n++; } }
    for (let k = 0; k < 6; k++) { const p = W.randomFloor(1); cand.push({ x: p.x, y: p.y, b: 0 }); }
    let best = null, bs = -1e9;
    for (const s of cand) { let md = 1e9; for (const t of foes) md = Math.min(md, dist(s, t)); const od = dist(s, f); if (od < 350) continue; const sc = Math.min(md, 1400) + s.b - 0.12 * od; if (sc > bs) { bs = sc; best = s; } }
    return best || { x: f.x + 400, y: f.y };
  }
  function ringPos(f, a, r) { const W = G().world; return W.nearFloor(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, 3); }

  // ---------- lancement ----------
  WB.castClone = function (f, ab) {
    const g = G(), L = ab.lvl, p = P[L]; clearAll(g, f);
    const c = f.clone = { L: L, t: 0, gauge: 0, max: p.max || 0, abs: null, spent: false, secours: null, smalls: [], perfect: [], paras: [], prot: null, protCd: 0, paraCd: 0, chaser: null };
    g.fx('burst', f.x, f.y, { col: '#ffb04a', n: 18, life: 0.6 }); g.fx('ring', f.x, f.y, { r: 90, col: '#ffb04a', life: 0.5, w: 7 }); g.sfx('ab_clone');
    if (L === 1) {
      const q = ringPos(f, Math.random() * PI2, 44);
      c.chaser = g.mkClone(f, { name: 'Clone explosif', x: q.x, y: q.y, hp: 70, r: 17, speed: 275, life: 40, cl: { type: 'chaser', own: true, sc: 0.85, age: 0 } });
      f.hp = f.hp; // l'invocateur n'est pas modifié
    }
    if (L <= 2) { const s = hideSpot(g, f); c.secours = g.mkClone(f, { name: 'Clone caché', x: s.x, y: s.y, hp: 100, r: 20, life: 90, ghost: true, cl: { type: 'hidden', own: true, sc: 1, age: 0 } }); }
    if (L >= 2 && L <= 4) absorb(g, f);
    if (L === 3) {
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * PI2 + 0.3, q = ringPos(f, a, 190), s = g.mkClone(f, { name: 'Petit clone', x: f.x, y: f.y, hp: 45, r: 14, speed: 250, life: 45, cl: { type: 'small', own: true, sc: 0.62, age: 0, post: q, mode: 'deploy', lost: 0, det: p.det } });
        c.smalls.push(s);
      }
    }
    if (L === 5) {
      c.prot = { x: f.x - 50, y: f.y, ph: 0 };
      for (let i = 0; i < 2; i++) {
        const q = ringPos(f, i * Math.PI + 1.2, 70), hp = Math.round(f.maxhp * p.hpMul);
        const pc = g.mkClone(f, { name: f.name, x: q.x, y: q.y, hp: hp, r: f.r, speed: f.speed, life: 60, cl: { type: 'perfect', age: 0 } });
        pc.maxhp = hp; pc.slots = f.slots.filter(s => s && s.id !== 'clone').map(s => WB.newAbility(s.id, s.lvl)); pc.bombs = 0; pc.ai.jit = 0.14; pc.ai.mode = 'follow';
        c.perfect.push(pc);
      }
    }
    return true;
  };

  // ---------- mise à jour des corps (clones combattants) ----------
  function updateBody(g, f, dt) {
    const c = f.cl, ow = f.owner; if (c.done) return;
    if (!ow || !ow.alive) { silentRemove(f); return; }
    c.age += dt;
    if (c.type === 'hidden') { f.want.x = f.want.y = 0; f.vx = f.vy = 0; return; }
    if (c.type === 'perfect') return;
    if (!g.started) { f.want.x = f.want.y = 0; return; }
    if (f.st.stun > 0 || f.st.frozen > 0) return;
    const p = P[ow.clone ? ow.clone.L : 1] || P[1];
    c.scan = (c.scan || 0) - dt;
    // contact avec n'importe quel ennemi visible : explosion (jamais dans le vide)
    const touch = t => foeOk(g, f, t) && dist(f, t) < f.r + t.r + 4;
    if (c.type === 'chaser') {
      if (c.age > 40) { silentRemove(f); return; }
      if (c.scan <= 0 || !c.tg || !foeOk(g, f, c.tg)) { c.scan = 0.35; c.tg = nearestFoe(g, f, 1600); }
      for (const t of g.F) if (touch(t)) { explodeBody(g, f, p.chR || P[1].chR, p.chD || P[1].chD); return; }
      if (c.tg) steer(g, f, c.tg.x, c.tg.y, dt);
      else if (dist(f, ow) > 130) steer(g, f, ow.x, ow.y, dt); else f.want.x = f.want.y = 0;
    } else if (c.type === 'small') {
      if (c.age > 45) { silentRemove(f); return; }
      if (c.scan <= 0) { c.scan = 0.3; c.tg = nearestFoe(g, f, c.det); }
      for (const t of g.F) if (touch(t)) { explodeBody(g, f, P[3].sR, P[3].sD); return; }
      if (c.tg) { c.mode = 'chase'; c.lost = 0; steer(g, f, c.tg.x, c.tg.y, dt); }
      else {
        c.lost += dt;
        if (c.mode === 'deploy' && c.age < 1.6 && dist(f, c.post) > 24) steer(g, f, c.post.x, c.post.y, dt);
        else { c.mode = 'wait'; f.want.x = f.want.y = 0; }
      }
    }
  }

  // ---------- mise à jour de l'invocateur ----------
  function bigBoom(g, f, ratio) {
    const c = f.clone, p = P[c.L], r = Math.max(0.35, ratio);
    const wasProt = c.L >= 5; const px = wasProt && c.prot ? (c.abs ? f.x : c.prot.x) : f.x, py = wasProt && c.prot ? (c.abs ? f.y : c.prot.y) : f.y;
    release(g, f, false); c.gauge = 0; if (wasProt) c.prot = null; c.gone = true;
    boom(g, f, px, py, p.R * (0.55 + 0.45 * r), p.D * r, { knock: 620, stun: c.L >= 5 ? 0.9 : 0.5 });
    g.text(f.x, f.y - 70, 'EXPLOSION !', '#ffb04a', 20);
  }
  function updateOwner(g, f, dt) {
    const c = f.clone; if (!c || !f.alive) return;
    if (c.spent && c.gone && !c.chaser) { }
    c.t += dt; const p = P[c.L];
    c.protCd -= dt; c.paraCd -= dt;
    if (c.abs) {
      c.abs.t += dt;
      if (c.gauge >= c.max) bigBoom(g, f, 1);
      else if (c.L < 5 && c.t > p.cap) { const r = c.gauge / c.max; if (r > 0.35) bigBoom(g, f, r); else { release(g, f, false); c.gone = true; } }
      else if (c.L >= 5 && g.t >= c.abs.until) { release(g, f, false); c.protCd = g.t + 1.0; c.protWait = true; }
    }
    if (c.L >= 5 && c.prot && !c.abs) {
      const tx = f.x - f.face.x * 62, ty = f.y - f.face.y * 62, k = Math.min(1, dt * 7); c.prot.x += (tx - c.prot.x) * k; c.prot.y += (ty - c.prot.y) * k; c.prot.ph += dt;
      if (g.world.solidAt(c.prot.x, c.prot.y)) { c.prot.x = f.x; c.prot.y = f.y; }
    }
    if (c.L === 4 && !c.gone) {
      c.paras = c.paras.filter(q => !q.dead);
      for (const t of g.F) {
        if (c.paras.length >= p.maxPara || c.paraCd > 0) break;
        if (!t.alive || t.team === f.team || t.ghost || t.kind === 'golem' || (t.st && t.st.jump) || g.roomBlock(f, t) || dist(f, t) > p.det + t.r) continue;
        if (c.paras.some(q => q.tg === t)) continue;
        c.paras.push({ x: f.x, y: f.y, tg: t, host: null, life: 14, ph: Math.random() * 6, dead: false }); c.paraCd = 0.8;
        g.fx('burst', f.x, f.y, { col: '#7aff7a', n: 8, life: 0.4 });
      }
      for (const q of c.paras) updatePara(g, f, q, dt);
    }
    c.perfect = c.perfect.filter(x => x.alive); c.smalls = c.smalls.filter(x => x.alive);
  }
  function updatePara(g, f, q, dt) {
    const c = f.clone, p = P[4]; q.life -= dt; q.ph += dt * 14;
    if (q.life <= 0) { q.dead = true; return; }
    if (!q.host) {
      const t = q.tg; if (!t || !t.alive || t.ghost || g.roomBlock(f, t)) { q.dead = true; return; }
      const d = dist(q, t) || 1, sp = 1100 * dt, nx = q.x + (t.x - q.x) / d * Math.min(sp, d), ny = q.y + (t.y - q.y) / d * Math.min(sp, d);
      if (g.world.solidAt(nx, ny)) { q.life -= dt * 4; } else { q.x = nx; q.y = ny; }
      if (dist(q, t) < t.r + 6) { q.host = t; g.fx('burst', t.x, t.y, { col: '#7aff7a', n: 10, life: 0.4 }); g.text(t.x, t.y - 40, 'Parasite', '#7aff7a', 13); }
    } else {
      const h = q.host; if (!h.alive || h.ghost) { q.dead = true; return; }
      const a = q.ph * 0.15; q.x = h.x + Math.cos(a) * h.r * 0.7; q.y = h.y - h.r * 0.2 + Math.sin(a) * 6;
      for (const e of g.F) {
        if (e === h || !e.alive || e.team === f.team || e.ghost || (e.st && e.st.jump)) continue;
        if (dist(h, e) < h.r + e.r + 4 && !g.roomBlock(h, e)) {
          q.dead = true; const mx = (h.x + e.x) / 2, my = (h.y + e.y) / 2;
          g.damage(h, p.pD, f, 'clone'); g.damage(e, p.pD, f, 'clone');
          g.fx('boom', mx, my, { life: 0.5 }); g.fx('ring', mx, my, { r: p.pR, col: '#7aff7a', life: 0.45, w: 7 }); g.fx('burst', mx, my, { col: '#7aff7a', n: 16, life: 0.5 }); g.sfx('boom');
          for (const o of g.F) if (o !== h && o !== e && o.alive && o.team !== f.team && !o.ghost && dist(o, { x: mx, y: my }) < p.pR) g.damage(o, p.pD * 0.6, f, 'clone');
          return;
        }
      }
    }
  }

  WB.updateClones = function (dt) {
    const g = G(); if (!g || !g.F) return; install(g);
    for (const f of g.F.slice()) if (f.cl && f.alive) updateBody(g, f, dt);
    for (const f of g.F) if (f.clone) { if (!f.alive) continue; updateOwner(g, f, dt); }
    for (let i = g.F.length - 1; i >= 0; i--) { const x = g.F[i]; if (x.cl && !x.alive) g.F.splice(i, 1); }
  };

  // ---------- branchements sur le moteur ----------
  function install(g) {
    if (g.__cloneInstalled) return; g.__cloneInstalled = true;
    const dmg0 = g.damage, kill0 = g.kill, sta0 = g.status, kno0 = g.knock;
    g.damage = function (t, amt, src, ab, opt) {
      opt = opt || {}; const c = t.clone;
      if (c && t.alive && amt > 0 && !(t.st.shield > 0 || t.st.jump || t.st.invuln > 0)) {
        const s = real(src);
        // niveau 5 : le protecteur avale l'invocateur dès qu'il est attaqué
        if (!c.abs && c.L >= 5 && c.prot && !opt.dot && s && s !== t && s.team !== t.team && g.t >= c.protCd) absorb(g, t, g.t + P[5].absT);
        if (c.abs) {
          c.gauge = Math.min(c.max, c.gauge + amt); t.flash = 0.1;
          if (!opt.dot && amt >= 3) g.text(t.x, t.y - 80, '+' + Math.round(amt), '#ffb04a', 14);
          g.fx('burst', t.x, t.y, { col: '#ffb04a', n: 3, life: 0.3 });
          return;
        }
      }
      return dmg0.call(g, t, amt, src, ab, opt);
    };
    g.status = function (t, name, dur) { if (t.clone && t.clone.abs) return; return sta0.apply(g, arguments); };
    g.knock = function (t) { if (t.clone && t.clone.abs) return; return kno0.apply(g, arguments); };
    g.kill = function (t, src, ab) {
      const c = t.clone;
      if (c && t.alive) {
        if (c.abs) { t.hp = Math.max(t.hp, 1); return; }
        if (!c.spent && c.L <= 3) {
          let dest = null;
          if (c.L <= 2 && c.secours && c.secours.alive) dest = c.secours;
          else if (c.L === 3) { let bd = 1e9; for (const s of c.smalls) if (s.alive) { const d = dist(s, t); if (d < bd) { bd = d; dest = s; } } }
          if (dest) { revive(g, t, dest, src); return; }
        }
      }
      const r = kill0.apply(g, arguments);
      if (c && !t.alive) { clearAll(g, t, true); }
      return r;
    };
  }
  function revive(g, t, dest, src) {
    const c = t.clone; c.spent = true;
    let k = real(src); if (!k && t.lastHit && g.t - t.lastHit.t < 8) k = t.lastHit.by;
    if (k && k !== t && k.alive !== false) { k.kills++; if (k.kind === 'player' || k.kind === 'bot') g.score[k.team] = (g.score[k.team] || 0) + 1; if (k === g.player) g.text(k.x, k.y - 60, 'ÉLIMINÉ !', '#ffd24a', 18); g.sfx('kill'); }
    g.feed.unshift({ a: k ? k.name : 'Un piège', b: t.name, ca: k ? (WB.TEAM_COLORS[k.team] || '#fff') : '#bbb', t: g.t, cb: '#fff' }); if (g.feed.length > 5) g.feed.pop();
    t.deaths++; g.fx('burst', t.x, t.y, { col: '#fff', n: 14, life: 0.6 }); g.fx('ring', t.x, t.y, { r: 50, col: '#fff', life: 0.4, w: 4 });
    const x = dest.x, y = dest.y; silentRemove(dest);
    t.x = x; t.y = y; t.vx = t.vy = t.kx = t.ky = 0; t.hp = Math.round(t.maxhp * 0.6); t.st = { invuln: 1.6 }; t.dots = []; t.dash = null; t.drown = 0; t.thrall = t.thrall || null;
    WB.restoreCharges(t); t.bombs = Math.max(t.bombs, 10);
    g.fx('burst', x, y, { col: '#ffb04a', n: 24, life: 0.7 }); g.fx('ring', x, y, { r: 90, col: '#ffb04a', life: 0.6, w: 8 }); g.text(x, y - 60, 'Seconde chance', '#ffb04a', 18); g.sfx('heal');
    if (t === g.player) { g.cam.x = x; g.cam.y = y; }
    c.secours = null;
  }

  // ---------- affichage ----------
  const FX = { chaser: '#ff4a3a', small: '#ffa23a', perfect: '#5ad8ff' };
  WB.drawCloneMark = function (ctx, f, px, py, time) {
    const c = f.cl, col = FX[c.type] || '#fff', R = f.r * 1.15;
    if (c.type === 'perfect') { ctx.strokeStyle = col; ctx.globalAlpha = 0.8; ctx.lineWidth = 2.5; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.ellipse(f.x, f.y + 12, 26, 12, 0, 0, PI2); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; ctx.fillStyle = col; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('CLONE', f.x, f.y - f.r - 30); return; }
    const pu = 0.5 + 0.5 * Math.sin(time * (c.type === 'chaser' ? 14 : 8));
    ctx.globalAlpha = 0.22 + 0.16 * pu; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(px, py, R, 0, PI2); ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(px, py, R + 2 + pu * 2, 0, PI2); ctx.stroke();
    ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.arc(px + 4, py - R - 6 - pu * 2, 3.2 + pu, 0, PI2); ctx.fill();
  };
  WB.drawAbsorber = function (ctx, f, G, time) {
    const c = f.clone, x = f.x, y = f.y - (f.jumpH || 0), r = f.r * 1.7, ratio = c.max ? clamp(c.gauge / c.max, 0, 1) : 0, pu = 0.5 + 0.5 * Math.sin(time * 8);
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x, y + r * 0.85, r * 0.95, r * 0.35, 0, 0, PI2); ctx.fill();
    const gl = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * (1.5 + ratio * 0.4)); gl.addColorStop(0, 'rgba(255,170,60,' + (0.25 + 0.35 * ratio) + ')'); gl.addColorStop(1, 'rgba(255,120,20,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, r * 1.9, 0, PI2); ctx.fill();
    const o = { t: f.t, walk: f.walk, moving: f.moving, fx: f.face.x, fy: f.face.y, alpha: 0.96, flash: f.flash > 0, hurt: f.hurtT > 0, arm: false, cast: 0, jump: 0 };
    WB.drawBlob(ctx, f.spec, x, y, 1.75, o);
    ctx.globalAlpha = 0.3 + 0.2 * pu; ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.arc(x, y, r, 0, PI2); ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, r + 4, -Math.PI / 2, -Math.PI / 2 + PI2 * ratio); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r + 4, 0, PI2); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineWidth = 3; ctx.strokeText(Math.round(ratio * 100) + '%', x, y - r - 12); ctx.fillText(Math.round(ratio * 100) + '%', x, y - r - 12);
  };
  WB.drawClones = function (ctx, g, time) {
    const me = g.player;
    for (const f of g.F) {
      const c = f.clone; if (!c || !f.alive) continue; const mine = me && f.team === me.team;
      if (mine && c.secours && c.secours.alive && !c.spent) { const s = c.secours, pu = 0.5 + 0.5 * Math.sin(time * 4); ctx.strokeStyle = 'rgba(255,176,74,' + (0.5 + 0.4 * pu) + ')'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(s.x, s.y, 24 + pu * 4, 0, PI2); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = 'rgba(255,176,74,.7)'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('?', s.x, s.y + 6); }
      if (c.prot && !c.abs && mine) {
        const q = c.prot, r = f.r * 1.5, bob = Math.sin(q.ph * 5) * 2;
        ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(q.x, q.y + r * 0.9, r * 0.9, r * 0.3, 0, 0, PI2); ctx.fill();
        WB.drawBlob(ctx, f.spec, q.x, q.y + bob, 1.5, { t: f.t, walk: q.ph * 8, moving: true, fx: f.face.x, fy: f.face.y, alpha: 0.92, flash: false, hurt: false, arm: false, cast: 0, jump: 0 });
        const ratio = clamp(c.gauge / c.max, 0, 1); ctx.globalAlpha = 0.3; ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.arc(q.x, q.y + bob, r, 0, PI2); ctx.fill(); ctx.globalAlpha = 1;
        ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(q.x, q.y + bob, r + 3, -Math.PI / 2, -Math.PI / 2 + PI2 * ratio); ctx.stroke();
      }
      if (c.L === 4 && c.paras) for (const q of c.paras) {
        if (q.dead) continue; const w = Math.sin(q.ph) * 3;
        ctx.save(); ctx.translate(q.x, q.y + w * 0.3); ctx.strokeStyle = '#1d4a22'; ctx.lineWidth = 2; for (let k = -1; k <= 1; k += 2) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(k * (7 + i * 2), -4 + i * 5 + w * (i % 2 ? 1 : -1) * 0.5); ctx.stroke(); }
        ctx.fillStyle = '#4ad85a'; ctx.strokeStyle = '#1d4a22'; ctx.beginPath(); ctx.ellipse(0, 0, 8, 6, 0, 0, PI2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-3, -2, 2, 0, PI2); ctx.arc(3, -2, 2, 0, PI2); ctx.fill(); ctx.fillStyle = '#c01818'; ctx.beginPath(); ctx.arc(-3, -2, 1, 0, PI2); ctx.arc(3, -2, 1, 0, PI2); ctx.fill(); ctx.restore();
      }
      if (mine && c.L === 4 && c.abs) { ctx.strokeStyle = 'rgba(122,255,122,.3)'; ctx.lineWidth = 2; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.arc(f.x, f.y, P[4].det, 0, PI2); ctx.stroke(); ctx.setLineDash([]); }
    }
    for (const x of g.F) if (x.cl && x.cl.type === 'small' && x.alive && me && x.team === me.team) { ctx.strokeStyle = 'rgba(255,162,58,.18)'; ctx.lineWidth = 2; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.arc(x.x, x.y, x.cl.det, 0, PI2); ctx.stroke(); ctx.setLineDash([]); }
  };

  const upd = WB.updateHands, drw = WB.drawHands;
  WB.updateHands = function (dt) { upd(dt); WB.updateClones(dt); };
  WB.drawHands = function (ctx, g, time) { drw(ctx, g, time); WB.drawClones(ctx, g, time); };

  WB.GUIDE = WB.GUIDE || {};
  WB.GUIDE.clone = ['Fruit jumeau', 'Des clones explosifs se battent pour toi et te protègent. Chaque niveau change leur rôle.', [
    'Un clone explosif poursuit l\'ennemi le plus proche et explose au contact. Un clone caché te sauve une fois si tu es éliminé.',
    'Un gros clone t\'avale et prend ta place : il encaisse les dégâts, explose à 100 % sans te blesser. Clone de secours caché.',
    'Gros clone absorbeur et 5 petits clones qui attendent dans leur zone de détection. Si tu es éliminé, tu renais sur l\'un d\'eux.',
    'Gros clone absorbeur et parasites ultra rapides qui s\'accrochent aux ennemis proches et explosent quand l\'hôte touche un autre ennemi.',
    'Un protecteur te suit et t\'avale quand on t\'attaque, plus 2 clones parfaits qui combattent seuls avec tes pouvoirs.']];
})(window.WB);
