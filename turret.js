'use strict';
// Tourelle évolutive (5 niveaux) et missile à tête chercheuse du niveau 5.
// Les tourelles restent dans G.turrets (donc touchées par les projectiles et les zones comme avant) avec le drapeau adv.
(function (WB) {
  const PI2 = Math.PI * 2, G = () => WB.G, TS = WB.TS;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= PI2; while (d < -Math.PI) d += PI2; return d; };

  const LV = {
    1: { hp: 120, life: 18, R: 300, n: 1, dmg: 10, rate: 0.85 },
    2: { hp: 170, life: 20, R: 330, n: 2, dmg: 11, rate: 0.8 },
    3: { hp: 240, life: 22, R: 350, n: 2, dmg: 12, rate: 0.75, slow: 0.45, slowT: 2.0 },
    4: { hp: 320, life: 24, R: 380, n: 3, dmg: 9, burst: 6, gap: 0.09, pause: 1.2, heatShot: 8, heatDecay: 14, coolT: 3.0 },
    5: { hp: 560, life: 26, R: 420, mR: 640, n: 4, dmg: 10, burst: 4, gap: 0.16, pause: 1.0, field: 150, fieldOver: 215, overAt: 14, overT: 4.0,
         mDmg: 75, mR2: 95, mCd: 3.0, mLife: 5.0, mMax: 3, boomR: 210, boomD: 110 }
  };
  WB.TURRET_LV = LV;

  // ---------- visibilité / cibles ----------
  function foeOk(g, tu, t, needLos, range) {
    if (!t.alive || t.team === tu.owner.team || t.ghost || (t.st && t.st.jump)) return false;
    const p = tu.__p || (tu.__p = { x: 0, y: 0, team: 0, r: 10, st: {} }); p.x = tu.x; p.y = tu.y; p.team = tu.owner.team;
    const d = Math.hypot(t.x - tu.x, t.y - tu.y); if (d > range + t.r) return false;
    if (g.roomBlock(p, t) || g.grassHides(p, t)) return false;
    if (t.st.invis > 0 && d > 80) return false;
    if (needLos && !g.world.los(tu.x, tu.y, t.x, t.y)) return false;
    return true;
  }
  function candidates(g, tu, range) {
    const out = []; for (const t of g.F) if (foeOk(g, tu, t, true, range)) out.push(t);
    out.sort((a, b) => dist(tu, a) - dist(tu, b)); return out;
  }

  // ---------- lancement ----------
  WB.castTurret = function (f, ab, aim) {
    const g = G(), L = ab.lvl, p = LV[L]; let d = 50 + 130 * clamp(aim.m, 0, 1), x, y, ok = false;
    for (let k = 0; k < 4 && !ok; k++, d -= 28) { x = f.x + aim.x * d; y = f.y + aim.y * d; ok = !g.world.solidAt(x, y) && g.world.pass(Math.floor(x / TS), Math.floor(y / TS)); }
    if (!ok) { x = f.x; y = f.y; }
    const mine = g.turrets.filter(t => t.adv && t.owner === f && t.life > 0), cap = L >= 5 ? 1 : 2;
    while (mine.length >= cap) { const o = mine.shift(); o.silent = true; o.life = 0; }
    const tu = { adv: true, x: x, y: y, hp: p.hp, maxhp: p.hp, owner: f, L: L, life: p.life, cd: 0, ang: aim.y !== undefined ? Math.atan2(aim.y, aim.x) : 0, flash: 0, t: 0,
      cn: [], heat: 0, over: 0, state: 'idle', shots: 0, stT: 0, rot: 0, en: 0, overT: 0, mCd: 1.0, mState: 'idle', lau: 0, mTg: null, appear: 0 };
    for (let i = 0; i < p.n; i++) tu.cn.push({ ang: tu.ang, tg: null, lock: 0, cd: 0.25 * i, flash: 0 });
    g.turrets.push(tu); g.fx('ring', x, y, { r: 40 + 8 * L, col: '#9ad8ff', life: 0.4, w: 5 }); g.fx('burst', x, y, { col: '#c0c8d8', n: 10 + 3 * L, life: 0.5 }); g.sfx('wall');
    return true;
  };

  // position de la bouche de chaque canon
  function muzzle(tu, i) {
    const c = tu.cn[i], L = tu.L; let ox = 0, oy = 0, len = 20 + 3 * L;
    if (L === 2 || L === 3) { const s = i ? 1 : -1, off = 10 + 2 * L; ox = Math.cos(tu.ang + Math.PI / 2) * off * s; oy = Math.sin(tu.ang + Math.PI / 2) * off * s; }
    else if (L === 4) { const a = tu.rot + i * PI2 / 3; ox = Math.cos(a) * 9; oy = Math.sin(a) * 9; len = 34; }
    else if (L === 5) { const a = Math.PI / 4 + i * Math.PI / 2; ox = Math.cos(a) * 34; oy = Math.sin(a) * 34; len = 30; }
    return { x: tu.x + ox + Math.cos(c.ang) * len, y: tu.y + oy + Math.sin(c.ang) * len, ox: tu.x + ox, oy: tu.y + oy };
  }

  function shoot(g, tu, i, tg, mul) {
    const p = LV[tu.L], c = tu.cn[i], m = muzzle(tu, i);
    c.lock = c.lock || 0;
    const spread = Math.max(0.012, 0.2 - 0.07 * c.lock) * (tu.L >= 4 ? 0.7 : 1), a = Math.atan2(tg.y - m.oy, tg.x - m.ox) + (Math.random() - 0.5) * spread * 2;
    c.ang = a; c.flash = 0.09; tu.flash2 = 0.05;
    const L = tu.L, dmg = (p.dmg + (L <= 2 ? 0 : 0)) * (mul || 1), energy = L === 3;
    g.proj({ x: m.x, y: m.y, dx: Math.cos(a), dy: Math.sin(a), speed: energy ? 540 : 640, life: (p.R + 40) / (energy ? 540 : 640), r: energy ? 8 : 6, owner: tu.owner, ab: 'turret', lvl: L, kind: 'tbullet', big: L >= 4, energy: energy, oL: L,
      draw: drawBullet,
      onHit(pr, t) {
        g.damage(t, dmg, tu.owner, 'turret');
        if (energy) { t.st.slowT = p.slowT; t.st.slowMax = p.slowT; t.st.slowAmt = p.slow; g.fx('ring', t.x, t.y, { r: 36, col: '#b48aff', life: 0.35, w: 4 }); }
        g.fx('burst', pr.x, pr.y, { col: energy ? '#b48aff' : '#ffe27a', n: 5, life: 0.25 }); return true;
      } });
    if (L === 1 || Math.random() < 0.5) g.sfx('hit');
  }

  // ---------- IA des tourelles ----------
  function aimCannon(c, tg, tu, i, dt, turn) {
    if (!tg) { c.lock = 0; c.tg = null; c.ang += dt * 0.6 * (i % 2 ? -1 : 1); return false; }
    if (c.tg !== tg) { c.tg = tg; c.lock = 0; } else c.lock += dt;
    const m = muzzle(tu, i), want = Math.atan2(tg.y - m.oy, tg.x - m.ox), d = angDiff(c.ang, want);
    c.ang += clamp(d, -turn * dt, turn * dt); return Math.abs(angDiff(c.ang, want)) < 0.16;
  }
  function updateTurret(g, tu, dt) {
    const p = LV[tu.L], L = tu.L; tu.t += dt; tu.appear = Math.min(1, tu.appear + dt * 3); tu.flash2 = Math.max(0, (tu.flash2 || 0) - dt);
    for (const c of tu.cn) c.flash = Math.max(0, c.flash - dt);
    const cand = candidates(g, tu, p.R);
    let overMul = 1, rateMul = 1;
    if (L >= 5) {
      if (tu.overT > 0) { tu.overT -= dt; overMul = 1.5; rateMul = 0.5; if (tu.overT <= 0) { tu.en = 0; g.fx('ring', tu.x, tu.y, { r: 120, col: '#9ad8ff', life: 0.4, w: 5 }); } }
    }
    if (L <= 3) {
      // canons indépendants
      for (let i = 0; i < tu.cn.length; i++) {
        const c = tu.cn[i]; let tg = cand[0] || null;
        if (L >= 2 && cand.length >= 2 && i === 1 && !(cand[0].hp < cand[0].maxhp * 0.4)) tg = cand[1]; // deux cibles ; sinon tous sur la même
        c.cd -= dt;
        const aimed = aimCannon(c, tg, tu, i, dt, 7);
        if (i === 0) tu.ang = c.ang;
        if (L >= 2 && i === 1 && !tg) c.ang = tu.cn[0].ang;
        if (tg && aimed && c.cd <= 0) { c.cd = p.rate; shoot(g, tu, i, tg); }
      }
    } else if (L === 4) {
      // 3 canons rotatifs : rafales de 6, pause, surchauffe
      tu.rot += dt * (tu.state === 'burst' ? 9 : 1.2);
      if (tu.over > 0) { tu.over -= dt; tu.heat = Math.max(0, tu.heat - dt * (100 / p.coolT)); if (tu.over <= 0) { tu.heat = 0; g.fx('ring', tu.x, tu.y, { r: 60, col: '#9ad8ff', life: 0.4, w: 4 }); } }
      else tu.heat = Math.max(0, tu.heat - dt * (tu.state === 'burst' ? 2 : p.heatDecay));
      for (let i = 0; i < 3; i++) { const c = tu.cn[i], tg = cand.length ? cand[i % cand.length] : null; aimCannon(c, tg, tu, i, dt, 9); }
      if (tu.over > 0) { tu.state = 'idle'; }
      else if (tu.state === 'idle') { if (cand.length) { tu.state = 'burst'; tu.shots = 0; tu.stT = 0; } }
      else if (tu.state === 'burst') {
        tu.stT -= dt;
        if (!cand.length) { tu.state = 'pause'; tu.stT = p.pause; }
        else if (tu.stT <= 0) {
          const i = tu.shots % 3, tg = cand[tu.shots % cand.length]; tu.cn[i].tg = tg; shoot(g, tu, i, tg); tu.shots++; tu.stT = p.gap; tu.heat += p.heatShot;
          if (tu.heat >= 100) { tu.over = p.coolT; tu.state = 'idle'; tu.heat = 100; g.fx('burst', tu.x, tu.y, { col: '#ddd', n: 14, life: 0.8 }); g.text(tu.x, tu.y - 46, 'Surchauffe', '#ff8a5a', 14); }
          else if (tu.shots >= p.burst) { tu.state = 'pause'; tu.stT = p.pause; }
        }
      } else if (tu.state === 'pause') { tu.stT -= dt; if (tu.stT <= 0) tu.state = 'idle'; }
    } else {
      // niveau 5 : 4 canons, jusqu'à 4 cibles, rafales quadruples, surcharge, confinement, missile
      tu.rot += dt;
      for (let i = 0; i < 4; i++) { const c = tu.cn[i], tg = cand.length ? cand[i % cand.length] : null; aimCannon(c, tg, tu, i, dt, 9); }
      if (tu.state === 'idle') { if (cand.length) { tu.state = 'burst'; tu.shots = 0; tu.stT = 0; } }
      else if (tu.state === 'burst') {
        tu.stT -= dt;
        if (!cand.length) { tu.state = 'pause'; tu.stT = p.pause * rateMul; }
        else if (tu.stT <= 0) {
          for (let i = 0; i < 4; i++) shoot(g, tu, i, cand[i % cand.length], overMul);
          tu.shots++; tu.stT = p.gap * rateMul; tu.en++;
          if (tu.en >= p.overAt && tu.overT <= 0) { tu.overT = p.overT; g.fx('ring', tu.x, tu.y, { r: 160, col: '#ffe27a', life: 0.5, w: 8 }); g.fx('burst', tu.x, tu.y, { col: '#ffe27a', n: 24, life: 0.7 }); g.text(tu.x, tu.y - 60, 'SURCHARGE', '#ffe27a', 16); g.sfx('boom'); }
          if (tu.shots >= p.burst) { tu.state = 'pause'; tu.stT = p.pause * rateMul; }
        }
      } else if (tu.state === 'pause') { tu.stT -= dt; if (tu.stT <= 0) tu.state = 'idle'; }
      confine(g, tu, dt, p);
      updateLauncher(g, tu, dt, p);
    }
  }

  // rayon de confinement : ralentit et attire doucement vers la tourelle
  function confine(g, tu, dt, p) {
    const R = tu.overT > 0 ? p.fieldOver : p.field, W = g.world; tu.fR = R;
    for (const t of g.F) {
      if (!foeOk(g, tu, t, false, R)) continue; const d = dist(tu, t); if (d > R) continue;
      t.st.slowT = Math.max(t.st.slowT || 0, 0.25); t.st.slowMax = 0.25; t.st.slowAmt = tu.overT > 0 ? 0.6 : 0.4;
      if (d > 40) { const k = (tu.overT > 0 ? 95 : 55) * dt / d, nx = t.x + (tu.x - t.x) * k, ny = t.y + (tu.y - t.y) * k; if (!W.solidAt(nx, ny)) { t.x = nx; t.y = ny; } }
    }
  }

  // ---------- lance-missile ----------
  function pickMissileTarget(g, tu, p) {
    let best = null;
    for (const t of g.F) {
      if (!foeOk(g, tu, t, true, p.mR)) continue;
      if (!best || t.hp > best.hp || (t.hp === best.hp && g.F.indexOf(t) < g.F.indexOf(best))) best = t;
    }
    return best;
  }
  function updateLauncher(g, tu, dt, p) {
    const gm = g.missiles || (g.missiles = []);
    tu.mCd -= dt;
    const mine = gm.filter(m => m.tu === tu && !m.dead).length;
    if (tu.mState === 'idle') {
      tu.lau = Math.max(0, tu.lau - dt / 0.3);
      if (tu.mCd <= 0.45 && mine < p.mMax) { const t = pickMissileTarget(g, tu, p); if (t) { tu.mTg = t; tu.mState = 'raise'; } }
    } else if (tu.mState === 'raise') {
      tu.lau = Math.min(1, tu.lau + dt / 0.45);
      const t = tu.mTg; if (!t || !t.alive) { tu.mState = 'idle'; tu.mTg = null; return; }
      tu.lAng = Math.atan2(t.y - tu.y, t.x - tu.x);
      if (tu.lau >= 1 && tu.mCd <= 0) {
        const t2 = foeOk(g, tu, t, true, p.mR) ? t : pickMissileTarget(g, tu, p);
        if (t2) launch(g, tu, t2, p); tu.mTg = null; tu.mState = 'idle'; tu.mCd = p.mCd;
      }
    }
  }
  function launch(g, tu, tg, p) {
    const a = tu.lAng = Math.atan2(tg.y - tu.y, tg.x - tu.x);
    g.missiles.push({ x: tu.x + Math.cos(a) * 26, y: tu.y + Math.sin(a) * 26 - 0, ang: a, v: 190, t: 0, life: p.mLife, tg: tg, lost: false, lx: tg.x, ly: tg.y, tu: tu, owner: tu.owner, trail: [], dead: false, id: (g.__mid = (g.__mid || 0) + 1) });
    g.fx('burst', tu.x + Math.cos(a) * 26, tu.y + Math.sin(a) * 26, { col: '#ffb04a', n: 10, life: 0.4 }); g.sfx('missile');
  }
  function missileBoom(g, m, direct) {
    if (m.dead) return; m.dead = true; const p = LV[5], pt = { x: m.x, y: m.y, team: m.owner.team, r: 10, st: {} };
    for (const t of g.F) {
      if (!t.alive || t.team === m.owner.team || t.ghost || (t.st && t.st.jump)) continue;
      const d = dist(m, t); if (d > p.mR2 + t.r) continue;
      if (g.roomBlock(pt, t)) continue; // une explosion ne traverse pas les murs des maisons
      const k = 1 - 0.5 * clamp(d / (p.mR2 + t.r), 0, 1); g.damage(t, p.mDmg * k, m.owner, 'turret');
      const a = Math.atan2(t.y - m.y, t.x - m.x); g.knock(t, Math.cos(a), Math.sin(a), 300);
    }
    for (const tu of g.turrets) if (tu.owner.team !== m.owner.team && dist(tu, m) < p.mR2 + 18) { tu.hp -= p.mDmg * 0.6; tu.flash = 0.1; if (tu.hp <= 0) tu.life = 0; }
    g.fx('boom', m.x, m.y, { life: 0.55 }); g.fx('ring', m.x, m.y, { r: p.mR2, col: '#ffb04a', life: 0.45, w: 7 }); g.fx('burst', m.x, m.y, { col: '#ff7a2a', n: 18, life: 0.6 }); g.shake(5); g.sfx('boom');
  }
  function updateMissiles(g, dt) {
    const gm = g.missiles; if (!gm || !gm.length) return; const p = LV[5], W = g.world;
    for (let i = gm.length - 1; i >= 0; i--) {
      const m = gm[i];
      if (m.dead) { gm.splice(i, 1); continue; }
      m.t += dt; m.life -= dt; const tu = m.tu, t = m.tg;
      if (!m.lost) {
        const pt = { x: m.x, y: m.y, team: m.owner.team, r: 10, st: {} };
        const valid = t && t.alive && !t.ghost && !(t.st && t.st.jump) && !g.roomBlock(pt, t) && !g.grassHides(pt, t) && !(t.st.invis > 0 && dist(m, t) > 80);
        if (valid) { m.lx = t.x; m.ly = t.y; } else if (t && !t.alive) { missileBoom(g, m, false); continue; } else { m.lost = true; }
      }
      const want = Math.atan2(m.ly - m.y, m.lx - m.x); m.ang += clamp(angDiff(m.ang, want), -3.4 * dt, 3.4 * dt);
      m.v = Math.min(540, m.v + 330 * dt);
      let boom = false; const steps = 2, sl = m.v * dt / steps;
      for (let s = 0; s < steps && !boom; s++) {
        m.x += Math.cos(m.ang) * sl; m.y += Math.sin(m.ang) * sl;
        if (W.solidAt(m.x, m.y)) boom = true;
        for (const w of g.walls) if (Math.abs(m.x - w.x) < w.w / 2 + 6 && Math.abs(m.y - w.y) < w.h / 2 + 6) { boom = true; break; }
      }
      m.trail.push({ x: m.x, y: m.y, a: 1 }); if (m.trail.length > 22) m.trail.shift();
      for (const q of m.trail) q.a -= dt * 1.6;
      if (!boom && !m.lost && t && dist(m, t) < t.r * (t.scale || 1) * 0.9 + 10) boom = true;
      if (!boom && m.lost && dist(m, { x: m.lx, y: m.ly }) < 22) boom = true;
      if (!boom && m.life <= 0) boom = true;
      if (boom) { missileBoom(g, m, !m.lost); }
    }
  }

  // ---------- fin de vie : explosion finale (niveau 5) ----------
  WB.turretEnd = function (tu) {
    const g = G(); if (!tu.adv) return;
    g.fx('burst', tu.x, tu.y, { col: '#aaa', n: 10 + 4 * tu.L, life: 0.6 });
    if (tu.L >= 5 && !tu.silent) {
      const p = LV[5], pt = { x: tu.x, y: tu.y, team: tu.owner.team, r: 10, st: {} };
      for (const t of g.F) {
        if (!t.alive || t.team === tu.owner.team || t.ghost || (t.st && t.st.jump)) continue;
        const d = dist(tu, t); if (d > p.boomR + t.r || g.roomBlock(pt, t)) continue;
        g.damage(t, p.boomD * (1 - 0.4 * d / (p.boomR + t.r)), tu.owner, 'turret'); const a = Math.atan2(t.y - tu.y, t.x - tu.x); g.knock(t, Math.cos(a), Math.sin(a), 520); g.status(t, 'stun', 0.5);
      }
      g.fx('boom', tu.x, tu.y, { life: 0.7 }); g.fx('ring', tu.x, tu.y, { r: p.boomR, col: '#ffb04a', life: 0.6, w: 10 }); g.fx('ring', tu.x, tu.y, { r: p.boomR * 0.6, col: '#fff2a0', life: 0.45, w: 6 }); g.fx('burst', tu.x, tu.y, { col: '#ff7a2a', n: 30, life: 0.8 }); g.shake(9); g.sfx('boom');
    }
  };

  WB.updateTurrets = function (dt) {
    const g = G(); if (!g || !g.turrets) return;
    for (const tu of g.turrets) if (tu.adv && tu.life > 0 && g.started) updateTurret(g, tu, dt);
    updateMissiles(g, dt);
  };

  // ---------- dessin ----------
  function drawBullet(ctx, p, time) {
    const a = Math.atan2(p.dy, p.dx);
    if (p.energy) {
      const g = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, 15); g.addColorStop(0, '#fff'); g.addColorStop(0.4, '#c8a0ff'); g.addColorStop(1, 'rgba(120,60,220,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 15, 0, PI2); ctx.fill();
      ctx.strokeStyle = 'rgba(190,150,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, 10 + Math.sin(time * 20) * 2, 0, PI2); ctx.stroke(); return;
    }
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a); ctx.fillStyle = p.big ? '#ffd24a' : '#ffe27a'; ctx.shadowColor = '#ffb84a'; ctx.shadowBlur = 8; ctx.fillRect(-(p.big ? 9 : 6), -2, p.big ? 16 : 11, p.big ? 4 : 3); ctx.shadowBlur = 0; ctx.restore();
  }
  function barrel(ctx, x, y, a, len, w, flash, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = col || '#8a92a2'; ctx.strokeStyle = '#23262e'; ctx.lineWidth = 2; ctx.fillRect(0, -w / 2, len, w); ctx.strokeRect(0, -w / 2, len, w);
    ctx.fillStyle = '#4a505c'; ctx.fillRect(len - 5, -w / 2 - 1.5, 5, w + 3); ctx.strokeRect(len - 5, -w / 2 - 1.5, 5, w + 3);
    if (flash > 0) { ctx.fillStyle = 'rgba(255,230,130,.9)'; ctx.beginPath(); ctx.moveTo(len, -w / 2 - 2); ctx.lineTo(len + 14 + Math.random() * 6, 0); ctx.lineTo(len, w / 2 + 2); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  function plate(ctx, x, y, r, n, col, edge, rot) { ctx.fillStyle = col; ctx.strokeStyle = edge; ctx.lineWidth = 2.5; ctx.beginPath(); for (let i = 0; i < n; i++) { const a = rot + i * PI2 / n; ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke(); }
  function core(ctx, x, y, r, time, col1, col2) {
    const pu = 0.5 + 0.5 * Math.sin(time * 5), g = ctx.createRadialGradient(x, y, 1, x, y, r * 2.2); g.addColorStop(0, '#fff'); g.addColorStop(0.35, col1); g.addColorStop(1, col2); ctx.fillStyle = g; ctx.globalAlpha = 0.55 + 0.3 * pu; ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, PI2); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = col1; ctx.strokeStyle = '#1b2230'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r * (0.9 + 0.1 * pu), 0, PI2); ctx.fill(); ctx.stroke();
  }
  WB.drawAdvTurret = function (ctx, tu, time) {
    const L = tu.L, x = tu.x, y = tu.y, k = tu.appear == null ? 1 : tu.appear, sc = 0.6 + 0.4 * k, fl = tu.flash > 0;
    ctx.save(); ctx.globalAlpha = 0.4 + 0.6 * k;
    const sr = [0, 20, 26, 31, 38, 52][L];
    ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.beginPath(); ctx.ellipse(x + 4, y + sr * 0.55, sr, sr * 0.42, 0, 0, PI2); ctx.fill();
    const base = fl ? '#fff' : '#59606e', edge = '#23262e';
    if (L === 1) {
      plate(ctx, x, y, 15, 12, base, edge, 0); ctx.fillStyle = '#6c7482'; ctx.beginPath(); ctx.arc(x, y, 9, 0, PI2); ctx.fill();
      barrel(ctx, x, y, tu.cn[0].ang, 22, 8, tu.cn[0].flash); ctx.fillStyle = '#ff9a3c'; ctx.beginPath(); ctx.arc(x, y, 4, 0, PI2); ctx.fill();
    } else if (L === 2) {
      plate(ctx, x, y, 21, 6, base, edge, Math.PI / 6); plate(ctx, x, y, 14, 6, '#6c7482', edge, 0);
      for (let i = 0; i < 2; i++) { const m = muzzle(tu, i), s = i ? 1 : -1; ctx.fillStyle = '#4a505c'; ctx.beginPath(); ctx.arc(m.ox, m.oy, 8, 0, PI2); ctx.fill(); ctx.stroke(); barrel(ctx, m.ox, m.oy, tu.cn[i].ang, 26, 8, tu.cn[i].flash); }
      ctx.fillStyle = '#ff9a3c'; ctx.beginPath(); ctx.arc(x, y, 5, 0, PI2); ctx.fill();
    } else if (L === 3) {
      for (let i = 0; i < 3; i++) { const r = 24 + ((time * 14 + i * 11) % 34); ctx.strokeStyle = 'rgba(160,110,255,' + (0.5 - r / 140) + ')'; ctx.lineWidth = 2.5; ctx.beginPath(); for (let a = 0; a <= PI2 + 0.1; a += 0.2) { const rr = r + Math.sin(a * 5 + time * 6) * 2.5; ctx[a ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.stroke(); }
      plate(ctx, x, y, 27, 8, base, edge, Math.PI / 8); plate(ctx, x, y, 19, 8, '#4c4f78', edge, 0);
      for (let i = 0; i < 2; i++) { const m = muzzle(tu, i); ctx.fillStyle = '#5a4a8a'; ctx.beginPath(); ctx.arc(m.ox, m.oy, 9, 0, PI2); ctx.fill(); ctx.stroke(); barrel(ctx, m.ox, m.oy, tu.cn[i].ang, 30, 9, tu.cn[i].flash, '#8a82b8'); ctx.strokeStyle = '#c8a0ff'; ctx.lineWidth = 2; for (let q = 0; q < 3; q++) { ctx.beginPath(); ctx.arc(m.ox + Math.cos(tu.cn[i].ang) * (8 + q * 7), m.oy + Math.sin(tu.cn[i].ang) * (8 + q * 7), 6 + q * 0.5, tu.cn[i].ang - 1.2, tu.cn[i].ang + 1.2); ctx.stroke(); } }
      core(ctx, x, y, 8, time, '#b48aff', 'rgba(120,60,220,0)');
    } else if (L === 4) {
      plate(ctx, x, y, 33, 10, base, edge, 0); plate(ctx, x, y, 25, 10, '#6c7482', edge, Math.PI / 10);
      for (let i = 0; i < 6; i++) { const a = i * PI2 / 6 + 0.3; ctx.fillStyle = '#3a3f4a'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 29, y + Math.sin(a) * 29, 3, 0, PI2); ctx.fill(); }
      const hot = clamp(tu.heat / 100, 0, 1);
      ctx.fillStyle = '#2d313b'; ctx.beginPath(); ctx.arc(x, y, 14, 0, PI2); ctx.fill(); ctx.stroke();
      for (let i = 0; i < 3; i++) { const m = muzzle(tu, i); barrel(ctx, m.ox, m.oy, tu.cn[i].ang, 34, 9, tu.cn[i].flash, hot > 0.5 ? 'rgb(' + Math.round(138 + 110 * hot) + ',' + Math.round(146 - 80 * hot) + ',' + Math.round(162 - 100 * hot) + ')' : '#8a92a2'); }
      ctx.fillStyle = 'rgb(' + Math.round(120 + 135 * hot) + ',' + Math.round(150 - 90 * hot) + ',60)'; ctx.beginPath(); ctx.arc(x, y, 6, 0, PI2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, 37, 0, PI2); ctx.stroke(); ctx.strokeStyle = tu.over > 0 ? '#9ad8ff' : 'rgb(255,' + Math.round(210 - 170 * hot) + ',60)'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(x, y, 37, -Math.PI / 2, -Math.PI / 2 + PI2 * (tu.over > 0 ? tu.over / LV[4].coolT : hot)); ctx.stroke();
      if (tu.over > 0 && Math.random() < 0.5) WB.G.fx('burst', x + (Math.random() - 0.5) * 30, y - 16, { col: '#e8e8e8', n: 2, life: 0.6 });
    } else {
      const ov = tu.overT > 0, R = tu.fR || LV[5].field, pu = 0.5 + 0.5 * Math.sin(time * 4);
      // rayon de confinement
      ctx.strokeStyle = ov ? 'rgba(255,226,122,.75)' : 'rgba(120,200,255,.45)'; ctx.lineWidth = ov ? 4 : 3; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -time * 30; ctx.beginPath(); ctx.arc(x, y, R, 0, PI2); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = ov ? 'rgba(255,226,122,.07)' : 'rgba(120,200,255,.05)'; ctx.beginPath(); ctx.arc(x, y, R, 0, PI2); ctx.fill();
      plate(ctx, x, y, 50, 12, base, edge, 0); plate(ctx, x, y, 41, 12, '#454b57', edge, Math.PI / 12); plate(ctx, x, y, 30, 8, '#6c7482', edge, Math.PI / 8);
      for (let i = 0; i < 12; i++) { const a = i * PI2 / 12; ctx.fillStyle = '#272b33'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 45, y + Math.sin(a) * 45, 2.6, 0, PI2); ctx.fill(); }
      // quatre bras mécaniques articulés portant un canon chacun
      for (let i = 0; i < 4; i++) {
        const m = muzzle(tu, i), a0 = Math.PI / 4 + i * Math.PI / 2, jx = x + Math.cos(a0) * 24, jy = y + Math.sin(a0) * 24;
        ctx.strokeStyle = '#2b2f38'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(jx, jy); ctx.lineTo(m.ox, m.oy); ctx.stroke();
        ctx.strokeStyle = '#7a8394'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(jx, jy); ctx.lineTo(m.ox, m.oy); ctx.stroke(); ctx.lineCap = 'butt';
        ctx.fillStyle = '#3a3f4a'; ctx.strokeStyle = edge; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(jx, jy, 6, 0, PI2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(m.ox, m.oy, 8, 0, PI2); ctx.fill(); ctx.stroke();
        barrel(ctx, m.ox, m.oy, tu.cn[i].ang, 30, 10, tu.cn[i].flash, ov ? '#d8c07a' : '#8a92a2');
      }
      // lance-missile intégré : le tube se soulève avant le tir
      const la = tu.lAng == null ? -Math.PI / 2 : tu.lAng, up = tu.lau || 0;
      ctx.save(); ctx.translate(x, y - 2 - up * 6); ctx.rotate(la); ctx.fillStyle = '#3d424d'; ctx.strokeStyle = edge; ctx.lineWidth = 2; ctx.fillRect(-4, -9, 24 + up * 6, 18); ctx.strokeRect(-4, -9, 24 + up * 6, 18);
      ctx.fillStyle = '#c84a3a'; ctx.fillRect(14 + up * 6, -9, 5, 18); if (up > 0.5 || tu.mState !== 'idle') { ctx.fillStyle = '#ff9a3c'; ctx.beginPath(); ctx.arc(22 + up * 6, 0, 4, 0, PI2); ctx.fill(); } ctx.restore();
      core(ctx, x, y, 11, time, ov ? '#ffe27a' : '#7ad8ff', ov ? 'rgba(255,170,40,0)' : 'rgba(40,120,255,0)');
      ctx.strokeStyle = ov ? '#ffe27a' : '#7ad8ff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, 18 + pu * 3, 0, PI2); ctx.stroke();
      if (!ov) { ctx.strokeStyle = 'rgba(255,226,122,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 56, -Math.PI / 2, -Math.PI / 2 + PI2 * clamp(tu.en / LV[5].overAt, 0, 1)); ctx.stroke(); }
    }
    // barre de vie
    const w = [0, 32, 40, 48, 60, 80][L], p = clamp(tu.hp / tu.maxhp, 0, 1), by = y - sr - 12;
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x - w / 2 - 1, by, w + 2, 6); ctx.fillStyle = '#9ad8ff'; ctx.fillRect(x - w / 2, by + 1, w * p, 4);
    ctx.restore();
  };

  WB.drawMissiles = function (ctx, g, time) {
    const me = g.player;
    if (g.missiles) for (const m of g.missiles) {
      if (m.dead) continue;
      for (const q of m.trail) { if (q.a <= 0) continue; ctx.globalAlpha = Math.max(0, q.a) * 0.55; ctx.fillStyle = '#cfcfcf'; ctx.beginPath(); ctx.arc(q.x, q.y, 4 + (1 - q.a) * 6, 0, PI2); ctx.fill(); }
      ctx.globalAlpha = 1; ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.ang);
      const fl = 10 + Math.random() * 8; ctx.fillStyle = '#ff7a2a'; ctx.beginPath(); ctx.moveTo(-8, -4); ctx.lineTo(-8 - fl, 0); ctx.lineTo(-8, 4); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.moveTo(-8, -2); ctx.lineTo(-8 - fl * 0.55, 0); ctx.lineTo(-8, 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d8dce6'; ctx.strokeStyle = '#2a2e38'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(6, -5); ctx.lineTo(-8, -5); ctx.lineTo(-8, 5); ctx.lineTo(6, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c84a3a'; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(7, -4); ctx.lineTo(7, 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#8a92a2'; ctx.beginPath(); ctx.moveTo(-8, -5); ctx.lineTo(-13, -10); ctx.lineTo(-3, -5); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(-8, 5); ctx.lineTo(-13, 10); ctx.lineTo(-3, 5); ctx.closePath(); ctx.fill();
      ctx.restore();
      if (me && m.owner.team !== me.team && !m.lost && m.tg === me) { ctx.strokeStyle = 'rgba(255,60,60,.8)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(me.x, me.y, 30 + Math.sin(time * 14) * 3, 0, PI2); ctx.stroke(); }
    }
    // portée visible seulement par le propriétaire
    for (const tu of g.turrets) if (tu.adv && me && tu.owner === me && tu.life > 0) {
      const p = LV[tu.L]; ctx.strokeStyle = 'rgba(154,216,255,.2)'; ctx.lineWidth = 2; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.arc(tu.x, tu.y, p.R, 0, PI2); ctx.stroke(); if (tu.L >= 5) { ctx.strokeStyle = 'rgba(255,120,80,.15)'; ctx.beginPath(); ctx.arc(tu.x, tu.y, p.mR, 0, PI2); ctx.stroke(); } ctx.setLineDash([]);
    }
  };

  const upd = WB.updateHands, drw = WB.drawHands;
  WB.updateHands = function (dt) { upd(dt); WB.updateTurrets(dt); };
  WB.drawHands = function (ctx, g, time) { drw(ctx, g, time); WB.drawMissiles(ctx, g, time); };

  WB.GUIDE = WB.GUIDE || {};
  WB.GUIDE.turret = ['Cerises', 'Une tourelle automatique qui évolue : plus de canons, plus de taille, plus de mécanismes.', [
    'Petite tourelle à un canon : vise toute seule, suit sa cible, sa précision augmente tant qu\'elle la garde en ligne de mire.',
    'Deux canons indépendants : deux cibles à la fois, ou les deux sur la même.',
    'Noyau énergétique : projectiles de distorsion qui ralentissent les ennemis touchés.',
    'Trois canons rotatifs : rafales de six tirs répartis entre plusieurs ennemis, pause de rechargement, surchauffe puis refroidissement.',
    'Tourelle massive à quatre bras : 4 cibles, rafales quadruples, surcharge énergétique, rayon de confinement, explosion finale et missile à tête chercheuse qui vise l\'ennemi le plus en forme.']];
  if (WB.ABIL && WB.ABIL.turret) WB.ABIL.turret.desc = 'Pose une tourelle qui évolue avec le niveau : 1 canon, 2 canons, projectiles ralentissants, 3 canons rotatifs, puis 4 bras, missile chercheur et explosion finale.';
})(window.WB);
