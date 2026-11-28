// INVOCATION : infrastructure commune + variante GOLEM (niveaux 1 à 5). Requin : invoc_shark.js, Dragon : invoc_dragon.js
(function (WB) {
  'use strict';
  const PI2 = Math.PI * 2, IA = WB.IA;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ease = u => u * u * (3 - 2 * u);
  const G = () => WB.G;
  // ---------- sessions d'invocation (27/11) : une série d'utilisations = une session ----------
  // Chaque élément porte : propriétaire (f), capacité d'origine (abil), numéro de session (ses), état (sink/dead) et durée (T).
  // Au début d'une nouvelle session, seuls les éléments de l'ancienne session de CE joueur et de CETTE capacité sont retirés.
  WB.SES = {
    begin(g, f, key, max, purge) {
      const m = f.sess || (f.sess = {}), s = m[key] || (m[key] = { id: 0, n: 0 });
      if (s.n >= max) { purge(s.id); s.id++; s.n = 0; }
      return { id: s.id, idx: s.n++ };
    }
  };
  WB.INVC = {}; // lanceurs par variante : shark, golem, dragon

  // ---------- infrastructure ----------
  const INV = WB.INV = {
    add(g, e) { e.t = 0; e.hit = new Set(); (g.inv || (g.inv = [])).push(e); return e; },
    // adversaires touchables autour d'un point (jamais à travers un mur de maison, jamais en l'air ou fantômes)
    foes(g, f, x, y, R) {
      const pt = { x: x, y: y, team: f.team, r: 10, st: {} }, out = [];
      for (const t of g.F) {
        if (!t.alive || t.team === f.team || t.ghost || t.swallowed || (t.st && t.st.jump)) continue;
        if (Math.hypot(t.x - x, t.y - y) > R + t.r) continue;
        if (g.roomBlock(pt, t)) continue; out.push(t);
      }
      return out;
    },
    nearest(g, f, R) { const l = INV.foes(g, f, f.x, f.y, R); l.sort((a, b) => dist(a, f) - dist(b, f)); return l; },
    // un coup par cible et par clé : pas de double dégât dû à la même animation
    strike(g, f, e, t, dmg, o) {
      o = o || {}; const id = (t.id != null ? t.id : g.F.indexOf(t)) + ':' + (o.key || '');
      if (e.hit.has(id)) return false; e.hit.add(id);
      g.damage(t, dmg, f, 'summon');
      if (!t.alive) return true;
      if (o.dx != null) g.knock(t, o.dx, o.dy, o.force || 200);
      if (o.stun) g.status(t, 'stun', o.stun);
      if (o.slow) { t.st.slowT = Math.max(t.st.slowT || 0, o.slow.dur); t.st.slowMax = Math.max(t.st.slowMax || 0, o.slow.dur); t.st.slowAmt = Math.max(t.st.slowAmt || 0, o.slow.amt); }
      if (o.pop) t.rbPop = { t: 0 };
      g.fx('burst', t.x, t.y, { col: o.col || '#cfe', n: 8, life: 0.4 });
      return true;
    },
    freeAt(g, x, y) { return !g.world.solidAt(x, y); }
  };

  function ownerAlive(f) { return f.alive && f.respawnT <= 0 || f.alive; }

  // ---------- GOLEM ----------
  const GS = {
    1: { hp: 90, r: 20, scale: 0.7, speed: 195, pref: 36, reach: 56, dmg: 10, shock: [52, 5, 160], cd: 1.0 },
    2: { hp: 320, r: 32, scale: 1.1, speed: 170, pref: 58, reach: 80, dmg: 18, shock: [75, 8, 230], cd: 1.3 },
    4: { hp: 620, r: 40, scale: 1.5, speed: 125, pref: 140, hamR: 105, hamD: 48, cd: 3.2 },
    5: { hp: 1000, r: 52, scale: 2.0, speed: 115, pref: 170, cd: 2.4 }
  };
  WB.INVC.GS = GS;

  function killOld(g, f) {
    for (const o of f.thralls.slice()) if (o.kind === 'golem' && !o.cl && o.alive) { if (o.iv) o.iv.done = true; o.hp = 0; g.kill(o, null, null); }
    for (let i = g.turrets.length - 1; i >= 0; i--) { const tu = g.turrets[i]; if (tu.inv && tu.owner === f) { tu.life = 0; } }
  }
  function mkGolem(g, f, L, spec, x, y, kind) {
    const saved = f.thralls; f.thralls = []; g.addGolem(f, 1); const o = f.thralls[0]; f.thralls = saved.concat(o);
    const p = g.world.nearFloor(x, y, 2); o.x = p.x; o.y = p.y; o.vx = o.vy = 0;
    o.maxhp = o.hp = spec.hp; o.r = spec.r; o.scale = spec.scale; o.speed = spec.speed; o.life = 1e9; o.golemL = L; o.stoneT = 1e9; o.name = 'Golem';
    o.iv = { L: L, kind: kind, spec: spec, cd: 0.8 + Math.random() * 0.5, punchT: 0, emerge: 0, emT: kind === 'tit' ? 1.8 : kind === 'col' ? 1.4 : 0.6, lastHp: spec.hp, hitT: 0, seed: (Math.random() * 1000) | 0, guard: false, col: kind === 'col', pref: spec.pref, att: null, stage: 0 };
    g.status(o, 'stun', o.iv.emT); o.st.invuln = Math.max(o.st.invuln || 0, o.iv.emT * 0.8);
    g.fx('ring', o.x, o.y, { r: 70 * spec.scale, col: '#b8a48a', life: 0.55, w: 7 }); g.fx('burst', o.x, o.y, { col: '#9a9fac', n: 18, life: 0.7 }); g.shake(3 + spec.scale);
    return o;
  }
  WB.INVC.golem = function (g, f, L, aim) {
    killOld(g, f); f.armT = 0.35; g.sfx('wall'); g.fx('ring', f.x, f.y, { r: 60, col: '#b8a48a', life: 0.4, w: 6 });
    const base = Math.atan2(aim.y, aim.x);
    if (L === 1) { for (let i = 0; i < 3; i++) { const a = base + (i - 1) * 0.9; mkGolem(g, f, 1, GS[1], f.x + Math.cos(a) * 76, f.y + Math.sin(a) * 76, 'small'); } }
    else if (L === 2) mkGolem(g, f, 2, GS[2], f.x + Math.cos(base) * 80, f.y + Math.sin(base) * 80, 'guard');
    else if (L === 3) WB.INVC.arms(g, f, aim);
    else if (L === 4) mkGolem(g, f, 4, GS[4], f.x + Math.cos(base) * 100, f.y + Math.sin(base) * 100, 'col');
    else mkGolem(g, f, 5, GS[5], f.x + Math.cos(base) * 120, f.y + Math.sin(base) * 120, 'tit');
    return true;
  };

  // ---------- comportement des golems ----------
  function threat(g, f) { // projectile ennemi qui se dirige vers le propriétaire
    const o = f.owner; let best = null, bt = 1;
    for (const p of g.projs) {
      if (!p.owner || p.owner.team === f.team || p.life <= 0 || p.dead) continue; const sp = p.speed || 400; const dx = p.dx || 0, dy = p.dy || 0; if (!dx && !dy) continue;
      const rx = o.x - p.x, ry = o.y - p.y, along = rx * dx + ry * dy, tt = along / sp; if (along < 20 || tt > 0.9) continue;
      const perp = Math.abs(rx * dy - ry * dx); if (perp > o.r + (p.r || 8) + 18) continue;
      if (tt < bt) { bt = tt; best = p; }
    }
    return best;
  }
  // appelé par game.js avant l'IA normale : renvoie true si le golem est piloté ici
  WB.invAI = function (f, dt) {
    const v = f.iv, g = WB.G; if (!v || !g.started) return false;
    if (v.emerge < 1) { f.want.x = f.want.y = 0; return true; }
    const o = f.owner;
    if (v.kind === 'guard') {
      const p = threat(g, f);
      if (p) {
        v.guard = true; v.guardT = 0.45; const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy) || 1, gx = o.x + dx / d * 44, gy = o.y + dy / d * 44, ex = gx - f.x, ey = gy - f.y, ed = Math.hypot(ex, ey);
        if (ed > 8) { f.want.x = ex / ed; f.want.y = ey / ed; } else f.want.x = f.want.y = 0; f.face.x = dx / d; f.face.y = dy / d; return true;
      }
      if (v.guardT > 0) { v.guardT -= dt; f.want.x = f.want.y = 0; return true; } v.guard = false;
    }
    if (dist(f, o) > 460) { const d = dist(f, o) || 1; f.want.x = (o.x - f.x) / d; f.want.y = (o.y - f.y) / d; return true; }
    if (v.att && v.att.freeze) { f.want.x = f.want.y = 0; return true; }
    return false;
  };

  // ---------- onde de choc ----------
  function shock(g, f, x, y, R, dmg, force, key, stun) {
    const e = { x: x, y: y, hit: new Set() }; g.fx('ring', x, y, { r: R, col: '#d8c8a8', life: 0.35, w: 6 }); g.fx('burst', x, y, { col: '#9a9fac', n: 10, life: 0.4 });
    for (const t of INV.foes(g, f, x, y, R)) { const a = Math.atan2(t.y - y, t.x - x); INV.strike(g, f, e, t, dmg, { key: key || 's', dx: Math.cos(a), dy: Math.sin(a), force: force, stun: stun, col: '#c8b898' }); }
  }
  WB.INV.shock = shock;

  function updateGolem(g, f, dt) {
    const v = f.iv, S = v.spec, o = f.owner;
    if (v.emerge < 1) { v.emerge = Math.min(1, v.emerge + dt / v.emT); if (v.emerge < 1 && Math.random() < 0.3) g.fx('burst', f.x + rnd(-20, 20), f.y + 20, { col: '#8a7a60', n: 2, life: 0.4 }); v.lastHp = f.hp; return; }
    if (f.hp < v.lastHp) v.hitT = 0.12; v.lastHp = f.hp; v.hitT = Math.max(0, v.hitT - dt); v.cd -= dt; v.punchT = Math.max(0, v.punchT - dt);
    f.moving = Math.hypot(f.vx || 0, f.vy || 0) > 20;
    let t = f.ai.target; if (!t || !t.alive || t.team === f.team || t.ghost || (t.st && t.st.jump)) t = INV.nearest(g, f, 300)[0] || null;
    if (v.kind === 'small' || v.kind === 'guard') {
      if (t && v.cd <= 0 && dist(f, t) <= S.reach + t.r && !f.st.stun && !(v.guard)) { v.cd = S.cd; v.punchT = 0.32; v.hitDone = false; f.face.x = (t.x - f.x) / (dist(f, t) || 1); f.face.y = (t.y - f.y) / (dist(f, t) || 1); v.tg = t; }
      if (v.punchT > 0 && !v.hitDone && v.punchT < 0.17) { v.hitDone = true; const tg = v.tg; if (tg && tg.alive) { const fx = f.x + f.face.x * (f.r + 8), fy = f.y + f.face.y * (f.r + 8); const e = { hit: new Set() }; const a = Math.atan2(tg.y - f.y, tg.x - f.x); if (dist(f, tg) <= S.reach + tg.r + 10) { INV.strike(g, o, e, tg, S.dmg, { key: 'p', dx: Math.cos(a), dy: Math.sin(a), force: 140, col: '#c8b898' }); } shock(g, o, fx, fy, S.shock[0], S.shock[1], S.shock[2], 'sw' + (g.t | 0), 0); if (g.t - (g.__gsfx || -9) > 0.15) { g.__gsfx = g.t; g.sfx('impact', 0.6); } g.shake(2); } }
    } else if (v.kind === 'col') {
      colossus(g, f, v, S, t, dt);
    } else if (v.kind === 'tit') {
      titan(g, f, v, S, t, dt);
    }
  }

  // colosse : marteau de pierre
  function colossus(g, f, v, S, t, dt) {
    const o = f.owner;
    if (v.att) {
      const a = v.att; a.t += dt;
      if (a.t < 0.75) { const tg = a.tg; if (tg && tg.alive && a.t < 0.6) { a.x = tg.x + (tg.vx || 0) * 0.15; a.y = tg.y + (tg.vy || 0) * 0.15; } }
      v.hammer = a.t < 0.75 ? ease(a.t / 0.75) * 0.7 : 0.7 + clamp((a.t - 0.75) / 0.22, 0, 1) * 0.3;
      if (a.t >= 0.97 && !a.done) { a.done = true; const e = { hit: new Set() }; g.fx('ring', a.x, a.y, { r: S.hamR, col: '#d8c8a8', life: 0.5, w: 12 }); g.fx('boom', a.x, a.y, { life: 0.5 }); g.fx('burst', a.x, a.y, { col: '#8a6a3a', n: 26, life: 0.8 }); g.shake(9); g.sfx('boom');
        for (const q of INV.foes(g, o, a.x, a.y, S.hamR)) { const ang = Math.atan2(q.y - a.y, q.x - a.x); INV.strike(g, o, e, q, S.hamD, { key: 'ham', dx: Math.cos(ang), dy: Math.sin(ang), force: 480, stun: 0.6, pop: true, col: '#c8b898' }); }
        (g.rcr || (g.rcr = [])).push({ x: a.x, y: a.y, t: 0, life: 4, R: S.hamR, rings: [S.hamR * 0.6, S.hamR * 0.95] }); }
      if (a.t >= 1.45) { v.att = null; v.hammer = 0; }
    } else if (v.cd <= 0 && t && dist(f, t) < 300 && !f.st.stun) { v.cd = S.cd; v.att = { t: 0, tg: t, x: t.x, y: t.y, freeze: true }; f.face.x = (t.x - f.x) / (dist(f, t) || 1); f.face.y = (t.y - f.y) / (dist(f, t) || 1); g.sfx('wall'); }
    if (!v.att) v.hammer = 0;
    if (!v.done && f.hp <= f.maxhp * 0.3) { v.done = true; collapse(g, f); f.hp = 0; g.kill(f, null, null); }
  }
  // effondrement : pluie de rochers
  function collapse(g, f) {
    const o = f.owner, cx = f.x, cy = f.y; g.fx('ring', cx, cy, { r: 120, col: '#c8b898', life: 0.6, w: 12 }); g.fx('burst', cx, cy, { col: '#8a7a60', n: 40, life: 0.9 }); g.shake(10); g.sfx('boom'); g.text(cx, cy - 70, 'EFFONDREMENT', '#e8d8b8', 16);
    const foes = INV.foes(g, o, cx, cy, 330), spots = []; for (const q of foes.slice(0, 6)) spots.push({ tg: q, x: q.x, y: q.y });
    while (spots.length < 9) { const a = rnd(0, PI2), d = rnd(70, 260); spots.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d }); }
    spots.forEach(function (s, i) { INV.add(g, { kind: 'boulder', f: o, x: s.x, y: s.y, tg: s.tg, delay: 0.15 + i * 0.12, fall: 0.7, seed: i + 1,
      update(gg, b, dt) { b.t += dt; if (b.t < b.delay + 0.45 && b.tg && b.tg.alive) { b.x = b.tg.x; b.y = b.tg.y; } if (b.t >= b.delay + b.fall && !b.landed) { b.landed = true; g.fx('ring', b.x, b.y, { r: 62, col: '#c8b898', life: 0.35, w: 6 }); g.fx('burst', b.x, b.y, { col: '#8a7a60', n: 12, life: 0.6 }); g.shake(4); g.sfx('impact', 0.7); const ee = { hit: new Set() }; for (const q of INV.foes(g, o, b.x, b.y, 62)) { const a = Math.atan2(q.y - b.y, q.x - b.x); INV.strike(g, o, ee, q, 34, { key: 'b', dx: Math.cos(a), dy: Math.sin(a), force: 260, stun: 0.3, col: '#c8b898' }); } } return b.t < b.delay + b.fall + 0.6; },
      ground(c, gg, b, time) { if (b.t < b.delay || b.t > b.delay + b.fall + 0.05) return; const u = clamp((b.t - b.delay) / b.fall, 0, 1); c.save(); c.globalAlpha = 0.25 + 0.4 * u; c.fillStyle = '#000'; c.beginPath(); c.ellipse(b.x, b.y + 4, 14 + 26 * u, 6 + 10 * u, 0, 0, PI2); c.fill(); c.strokeStyle = '#ffb347'; c.lineWidth = 2; c.globalAlpha = 0.7 * (1 - u * 0.4); c.beginPath(); c.ellipse(b.x, b.y, 62, 40, 0, 0, PI2); c.stroke(); c.restore(); },
      top(c, gg, b, time) { if (b.t < b.delay) return; const u = (b.t - b.delay) / b.fall; if (u < 1) IA.boulder(c, b.x, b.y - (1 - u) * (1 - u) * 320, 1.4, b.seed); else if (b.t < b.delay + b.fall + 0.5) { c.save(); c.globalAlpha = 1 - (b.t - b.delay - b.fall) / 0.5; IA.boulder(c, b.x, b.y, 1.4, b.seed); c.restore(); } } }); });
  }

  // titan : trois capacités qui s'enchaînent
  function titan(g, f, v, S, t, dt) {
    const o = f.owner;
    if (v.att) {
      const a = v.att; a.t += dt; v.slam = a.slam(g, f, a, dt) || 0;
      if (a.end) { v.att = null; v.slam = 0; }
    } else if (v.cd <= 0 && !f.st.stun) {
      const foes = INV.nearest(g, f, 420); if (!foes.length) return;
      const k = v.stage % 3; v.stage++; v.cd = S.cd;
      if (k === 0) v.att = pillars(g, f, foes);
      else if (k === 1) v.att = tectonic(g, f, foes);
      else v.att = prison(g, f, foes);
      g.sfx('wall');
    }
  }
  function pillars(g, f, foes) {
    const o = f.owner, spots = foes.slice(0, 4).map(q => ({ tg: q, x: q.x, y: q.y }));
    while (spots.length < 3) { const a = rnd(0, PI2), d = rnd(120, 280); spots.push({ x: f.x + Math.cos(a) * d, y: f.y + Math.sin(a) * d }); }
    spots.forEach(function (s, i) { INV.add(g, { kind: 'pillar', f: o, x: s.x, y: s.y, tg: s.tg, delay: i * 0.15, seed: i + 5,
      update(gg, p, dt) { p.t += dt; if (p.t < p.delay + 0.5 && p.tg && p.tg.alive) { p.x = p.tg.x; p.y = p.tg.y; } if (p.t >= p.delay + 0.6 && !p.hitd) { p.hitd = true; g.shake(5); g.sfx('impact', 0.7); g.fx('burst', p.x, p.y, { col: '#8a7a60', n: 14, life: 0.6 }); g.fx('ring', p.x, p.y, { r: 58, col: '#c8b898', life: 0.35, w: 7 }); const ee = { hit: new Set() }; for (const q of INV.foes(g, o, p.x, p.y, 58)) { const a = Math.atan2(q.y - p.y, q.x - p.x); INV.strike(g, o, ee, q, 30, { key: 'pil', dx: Math.cos(a), dy: Math.sin(a), force: 360, stun: 0.4, pop: true, col: '#c8b898' }); } } return p.t < p.delay + 1.5; },
      ground(c, gg, p, time) { if (p.t > p.delay + 0.7) return; const u = clamp((p.t - p.delay) / 0.6, 0, 1); c.save(); c.globalAlpha = 0.6; c.strokeStyle = '#ffb347'; c.lineWidth = 3; c.beginPath(); c.ellipse(p.x, p.y, 58 * (1 - u * 0.2), 38 * (1 - u * 0.2), 0, 0, PI2); c.stroke(); c.restore(); },
      top(c, gg, p, time) { const tt = p.t - p.delay - 0.5; if (tt < 0) return; const h = tt < 0.18 ? ease(tt / 0.18) : tt < 0.7 ? 1 : 1 - clamp((tt - 0.7) / 0.5, 0, 1); IA.arm(c, p.x, p.y, 1.15, h, tt > 0.1 ? 0.8 : 0, 0, p.seed); } }); });
    return { t: 0, freeze: false, end: false, slam(gg, ff, a) { a.end = a.t > 1.3; return a.t < 0.8 ? a.t / 0.8 : 0; } };
  }
  function tectonic(g, f, foes) {
    const o = f.owner;
    return { t: 0, freeze: true, end: false, fired: false, slam(gg, ff, a) {
      const w = a.t < 0.9 ? ease(a.t / 0.9) : 1 - clamp((a.t - 0.9) / 0.5, 0, 1);
      if (a.t >= 0.9 && !a.fired) { a.fired = true; g.shake(12); g.sfx('boom'); g.text(ff.x, ff.y - 100, 'ÉCRASEMENT TECTONIQUE', '#ffd9a0', 16); g.fx('ring', ff.x, ff.y, { r: 130, col: '#d8c8a8', life: 0.5, w: 12 });
        const ee = { hit: new Set() }; for (const q of INV.foes(g, o, ff.x, ff.y, 130)) { const an = Math.atan2(q.y - ff.y, q.x - ff.x); INV.strike(g, o, ee, q, 40, { key: 'tsl', dx: Math.cos(an), dy: Math.sin(an), force: 420, stun: 0.5, pop: true, col: '#c8b898' }); }
        const n = 7, base = rnd(0, PI2), cx = ff.x, cy = ff.y, cracks = [];
        for (let i = 0; i < n; i++) { const an = base + i * PI2 / n + rnd(-0.12, 0.12), pts = [[cx, cy]]; let px = cx, py = cy, aa = an; for (let k = 1; k <= 8; k++) { aa += rnd(-0.18, 0.18); px += Math.cos(aa) * 44; py += Math.sin(aa) * 44; pts.push([px, py]); } cracks.push(pts); }
        const eh = { hit: new Set() };
        INV.add(g, { kind: 'cracks', f: o, x: cx, y: cy, cracks: cracks,
          update(g2, e, dt) { e.t += dt; const prog = Math.min(1, e.t / 0.8); cracks.forEach(function (pts, i) { for (let k = 1; k < pts.length; k++) { const need = k / (pts.length - 1) * 0.8; if (e.t >= need && !pts[k].burst) { pts[k].burst = true; g.fx('burst', pts[k][0], pts[k][1], { col: '#8a7a60', n: 6, life: 0.5 }); for (const q of INV.foes(g, o, pts[k][0], pts[k][1], 42)) { const an2 = Math.atan2(q.y - pts[k][1], q.x - pts[k][0]); INV.strike(g, o, eh, q, 28, { key: 'tec', dx: Math.cos(an2), dy: Math.sin(an2), force: 300, stun: 0.3, pop: true, col: '#c8b898' }); } } } }); return e.t < 2.4; },
          ground(c, g2, e, time) { const prog = Math.min(1, e.t / 0.8), al = e.t < 1.7 ? 1 : 1 - (e.t - 1.7) / 0.7; cracks.forEach(function (pts) { const m = Math.max(2, Math.ceil(prog * pts.length)); IA.crack(c, pts.slice(0, m), 5, '#ffb347', 0.9 * al); IA.crack(c, pts.slice(0, m), 1.8, '#fff3b0', al); }); },
          top(c, g2, e, time) { cracks.forEach(function (pts) { for (let k = 1; k < pts.length; k++) { const tt = e.t - k / (pts.length - 1) * 0.8; if (tt < 0 || tt > 0.7) continue; const h = tt < 0.12 ? tt / 0.12 : 1 - clamp((tt - 0.2) / 0.5, 0, 1); IA.pillar(c, pts[k][0], pts[k][1], 0.55, h, k); } }); } });
      }
      a.end = a.t > 1.5; return w; } };
  }
  function prison(g, f, foes) {
    const o = f.owner, c0 = foes[0], grp = foes.filter(q => dist(q, c0) < 150), cx = grp.reduce((s, q) => s + q.x, 0) / grp.length, cy = grp.reduce((s, q) => s + q.y, 0) / grp.length, R = 165;
    return { t: 0, freeze: true, end: false, built: false, slam(gg, ff, a) {
      const w = a.t < 0.7 ? ease(a.t / 0.7) : a.t < 1.4 ? 1 : 1 - clamp((a.t - 1.4) / 0.4, 0, 1);
      if (a.t >= 0.7 && !a.built) { a.built = true; g.sfx('boom'); g.shake(8); g.text(ff.x, ff.y - 100, 'PRISON DU TITAN', '#ffd9a0', 16);
        const defs = [[0, -1, 160, 30], [0, 1, 160, 30], [-1, 0, 30, 160], [1, 0, 30, 160], [-0.72, -0.72, 70, 70], [0.72, -0.72, 70, 70], [-0.72, 0.72, 70, 70], [0.72, 0.72, 70, 70]]; a.walls = [];
        for (const d of defs) { const w2 = { x: cx + d[0] * R, y: cy + d[1] * R, w: d[2], h: d[3], hp: 110, maxhp: 110, life: 3.4, owner: o, dx: d[0], dy: d[1], rise: 0, draw: drawSlab }; g.addWall(w2); a.walls.push(w2); g.fx('burst', w2.x, w2.y, { col: '#8a7a60', n: 8, life: 0.6 }); }
        INV.add(g, { kind: 'prison', f: o, x: cx, y: cy, R: R, walls: a.walls, closed: false,
          update(g2, e, dt) { e.t += dt; for (const w3 of e.walls) w3.rise = Math.min(1, e.t / 0.35); const alive = e.walls.filter(w3 => g.walls.includes(w3) && w3.hp > 0);
            if (!e.closed && (alive.length < 3 && e.t > 0.5)) { e.closed = true; e.open = true; for (const w3 of alive) w3.life = 0.3; return true; }
            if (e.t > 2.6 && !e.closed) { const u = clamp((e.t - 2.6) / 0.5, 0, 1); for (const w3 of alive) { const rr = R * (1 - 0.78 * u); w3.x = cx + w3.dx * rr; w3.y = cy + w3.dy * rr; } if (u >= 1) { e.closed = true; g.sfx('boom'); g.shake(10); g.fx('ring', cx, cy, { r: 120, col: '#d8c8a8', life: 0.5, w: 12 }); const ee = { hit: new Set() }; for (const q of INV.foes(g, o, cx, cy, 120)) INV.strike(g, o, ee, q, 60, { key: 'pr', stun: 0.6, pop: true, col: '#c8b898' }); for (const w3 of alive) w3.life = 0.4; } }
            return e.t < 3.4; },
          ground(c, g2, e, time) { if (e.open) return; c.save(); c.globalAlpha = 0.25 + 0.15 * Math.sin(time * 6); c.strokeStyle = '#ffb347'; c.lineWidth = 3; c.beginPath(); c.ellipse(cx, cy, R * (e.t > 2.6 ? 1 - 0.78 * clamp((e.t - 2.6) / 0.5, 0, 1) : 1), R * 0.75 * (e.t > 2.6 ? 1 - 0.78 * clamp((e.t - 2.6) / 0.5, 0, 1) : 1), 0, 0, PI2); c.stroke(); c.restore(); } });
      }
      a.end = a.t > 1.8; return w; } };
  }
  function drawSlab(c, w) {
    const r = w.rise == null ? 1 : w.rise; if (r <= 0.02) return;
    c.save(); c.beginPath(); c.rect(w.x - w.w / 2 - 4, w.y - w.h / 2 - 80, w.w + 8, w.h + 80 + 6); c.clip(); c.translate(0, (1 - r) * 70);
    c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(w.x - w.w / 2 + 6, w.y - w.h / 2 + 8, w.w, w.h);
    const n = Math.max(1, Math.round(Math.max(w.w, w.h) / 38)); for (let i = 0; i < n; i++) { const fx = w.w >= w.h ? w.x - w.w / 2 + (i + 0.5) * w.w / n : w.x, fy = w.w >= w.h ? w.y : w.y - w.h / 2 + (i + 0.5) * w.h / n; IA.rock(c, fx, fy - 16, Math.max(20, w.w >= w.h ? w.w / n * 0.62 : w.w * 0.7), 24, i + ((w.x | 0) % 9), w.flash > 0 ? '#fff' : (i % 2 ? IA.ST.mid : IA.ST.hi)); }
    c.restore(); const p = Math.max(0, w.hp / w.maxhp); if (p < 1) { c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(w.x - 20, w.y - 5, 40, 6); c.fillStyle = '#ffd24a'; c.fillRect(w.x - 19, w.y - 4, 38 * p, 4); }
  }

  // ---------- bras de pierre (niveau 3) : structures qui reçoivent des dégâts ----------
  function mkStruct(g, f, x, y, hp, life, drawFn) {
    const tu = { inv: true, x: x, y: y, hp: hp, maxhp: hp, owner: f, L: 3, life: life, cd: 0, flash: 0, drawFn: drawFn }; g.turrets.push(tu); return tu;
  }
  WB.INVC.arms = function (g, f, aim) {
    const foes = INV.nearest(g, f, 360), a0 = Math.atan2(aim.y, aim.x);
    const t1 = foes[0] || null, t2 = foes[1] || foes[0] || null;
    const p1 = t1 ? { x: t1.x, y: t1.y } : { x: f.x + Math.cos(a0) * 160, y: f.y + Math.sin(a0) * 160 };
    const p2 = t2 ? { x: t2.x, y: t2.y } : { x: f.x + Math.cos(a0 + 0.8) * 150, y: f.y + Math.sin(a0 + 0.8) * 150 };
    for (const p of [p1, p2]) { const q = g.world.nearFloor(p.x, p.y, 2); p.x = q.x; p.y = q.y; }
    // bras 1 : frappe le terrain, onde de choc
    const A = mkStruct(g, f, p1.x, p1.y, 150, 4.2, function (c, tu, time) { const e = tu.ent; if (!e) return; const h = e.t < 0.4 ? ease(e.t / 0.4) : e.t > 3.6 ? 1 - clamp((e.t - 3.6) / 0.5, 0, 1) : 1; const lean = e.t < 1.0 ? -0.25 : e.t < 1.2 ? -0.25 + (e.t - 1.0) / 0.2 * 0.5 : 0.25 * (1 - clamp((e.t - 1.2) / 0.6, 0, 1)); const lf = e.t > 3.6 ? 0 : tu.flash > 0 ? 1 : 0; IA.arm(c, tu.x, tu.y, 1.25, h, e.t < 1.0 ? 0 : 0.9, lean, 2, lf); });
    A.ent = INV.add(g, { kind: 'arm1', f: f, x: p1.x, y: p1.y, tu: A, update(g2, e, dt) { e.t += dt; if (!g.turrets.includes(A) || A.hp <= 0) return false; if (e.t >= 1.2 && !e.hitd) { e.hitd = true; g.shake(9); g.sfx('boom'); g.fx('ring', A.x, A.y, { r: 135, col: '#d8c8a8', life: 0.5, w: 12 }); g.fx('burst', A.x, A.y, { col: '#8a7a60', n: 24, life: 0.8 }); for (const q of INV.foes(g, f, A.x, A.y, 135)) { const an = Math.atan2(q.y - A.y, q.x - A.x); INV.strike(g, f, e, q, 38, { key: 'a1', dx: Math.cos(an), dy: Math.sin(an), force: 450, stun: 0.4, col: '#c8b898' }); } } return e.t < 4.2; }, ground(c, g2, e) { if (e.t < 1.2) { c.save(); c.globalAlpha = 0.5; c.strokeStyle = '#ffb347'; c.lineWidth = 3; c.beginPath(); c.ellipse(A.x, A.y, 135, 90, 0, 0, PI2); c.stroke(); c.restore(); } } });
    // bras 2 : surgit sous un adversaire, le saisit et le projette au loin
    const B = mkStruct(g, f, p2.x, p2.y, 150, 4.4, function (c, tu, time) { const e = tu.ent; if (!e) return; const h = e.t < 0.4 ? ease(e.t / 0.4) : e.t > 3.8 ? 1 - clamp((e.t - 3.8) / 0.5, 0, 1) : 1; const cl = e.state === 'hold' ? 1 : e.state === 'throw' ? 0.1 : e.t < 1.2 ? 0 : 0.3; const lf = tu.flash > 0 ? 1 : 0; IA.arm(c, tu.x, tu.y, 1.25, h, cl, e.state === 'throw' ? 0.3 * e.dirx : 0, 4, lf); });
    B.ent = INV.add(g, { kind: 'arm2', f: f, x: p2.x, y: p2.y, tu: B, tg: t2, state: 'seek', dirx: 1, update(g2, e, dt) {
      e.t += dt; if (!g.turrets.includes(B) || B.hp <= 0) { if (e.vic && e.vic.alive) e.vic.st.stun = Math.min(e.vic.st.stun || 0, 0.2); return false; }
      if (e.state === 'seek') { if (e.tg && e.tg.alive && !e.tg.ghost && e.t < 1.0) { const d = dist(B, e.tg), sp = 320 * dt; if (d > 2) { B.x += (e.tg.x - B.x) / d * Math.min(sp, d); B.y += (e.tg.y - B.y) / d * Math.min(sp, d); } }
        if (e.t >= 1.3) { const c = INV.foes(g, f, B.x, B.y, 46)[0]; if (c) { e.vic = c; e.state = 'hold'; e.ht = 0; g.status(c, 'stun', 1.2); g.sfx('wall'); } else if (e.t > 1.8) e.state = 'idle'; } }
      else if (e.state === 'hold') { e.ht += dt; const v = e.vic; if (!v || !v.alive) { e.state = 'idle'; } else { v.x = B.x; v.y = B.y - 4; v.vx = v.vy = 0; v.kx = v.ky = 0; v.st.stun = Math.max(v.st.stun || 0, 0.3); if (e.ht >= 0.55) { const dx = v.x - f.x, dy = v.y - f.y, d = Math.hypot(dx, dy) || 1; e.dirx = dx >= 0 ? 1 : -1; e.state = 'throw'; e.tt = 0; g.damage(v, 34, f, 'summon'); if (v.alive) { g.knock(v, dx / d, dy / d, 900); g.status(v, 'stun', 0.5); v.rbPop = { t: 0 }; g.fx('burst', v.x, v.y, { col: '#c8b898', n: 14, life: 0.5 }); } g.sfx('swing'); g.shake(5); } } }
      else if (e.state === 'throw') { e.tt += dt; if (e.tt > 0.5) e.state = 'idle'; }
      return e.t < 4.4; } });
    f.armT = 0.35;
  };

  // ---------- accroches moteur ----------
  function install(g) {
    if (g.__ivInstalled) return; g.__ivInstalled = true;
    const k0 = g.kill; // un golem détruit disparaît définitivement ; le colosse s'effondre aussi quand il tombe d'un coup
    g.kill = function (t) { if (t && t.iv && t.iv.col && !t.iv.done) { t.iv.done = true; collapse(g, t); } return k0.apply(g, arguments); };
  }
  WB.drawInvStruct = function (c, tu, time) { if (tu.drawFn) tu.drawFn(c, tu, time); const p = Math.max(0, tu.hp / tu.maxhp); if (p < 1) { c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(tu.x - 22, tu.y - 8, 44, 6); c.fillStyle = '#ffd24a'; c.fillRect(tu.x - 21, tu.y - 7, 42 * p, 4); } };

  // dessin des golems
  const drawGolem0 = WB.drawGolem;
  WB.drawGolem = function (c, f, px, py, time, o) {
    const v = f.iv; if (!v) return drawGolem0(c, f, px, py, time, o);
    const s = f.scale || 1, e = ease(v.emerge);
    c.save();
    if (v.emerge < 1) { c.beginPath(); c.rect(px - 200 * s, py - 400 * s, 400 * s, 400 * s + 26 * s); c.clip(); }
    const sy = py + (1 - e) * 80 * s;
    if (v.guard) { c.fillStyle = 'rgba(120,190,255,0.25)'; c.beginPath(); c.ellipse(px, py, 60 * s, 52 * s, 0, 0, PI2); c.fill(); }
    IA.golem(c, px, sy, s, { L: v.L, punch: v.punchT > 0 ? Math.sin(clamp(v.punchT / 0.32, 0, 1) * Math.PI) : 0, hammer: v.hammer || 0, hit: v.hitT, moving: f.moving, hp01: v.emerge >= 1 ? f.hp / f.maxhp : null, shield: v.guard && false }, time, v.seed);
    c.restore();
    if (v.kind === 'col' && v.att) { const a = v.att, side = (a.x >= f.x ? 1 : -1), u = a.t < 0.75 ? ease(a.t / 0.75) : 1, sw = a.t < 0.75 ? -0.5 : -0.5 + ease(clamp((a.t - 0.75) / 0.22, 0, 1)) * 2.4; IA.hammer(c, px + side * 30 * s, py - 6 * s, 0.9 * s, side * sw, u); }
    if (v.kind === 'tit' && v.slam > 0) { const w = v.slam; c.save(); c.translate(px, py); c.scale(s, s); for (const sx of [-1, 1]) { const ax = sx * (34 - w * 18), ay = -10 - w * 58; IA.rock(c, ax, ay, 17, 20, 91 + sx, IA.ST.hi); IA.rock(c, ax + sx * 2, ay - 16, 20, 17, 93 + sx, IA.ST.mid); } c.restore(); }
  };

  // ---------- chaînage ----------
  function updateInv(g, dt) {
    for (const f of g.F) if (f.iv && f.alive) updateGolem(g, f, dt);
    const a = g.inv; if (!a || !a.length) return;
    for (const e of a) { if (e.dead) continue; if (e.update && e.update(g, e, dt) === false) e.dead = true; if (!e.update) e.t += dt; }
    g.inv = a.filter(e => !e.dead);
    if (g.inv.length > 420) g.inv.splice(0, g.inv.length - 420);
  }
  const upd = WB.updateHands, drw = WB.drawHands, trails = WB.drawTrails;
  WB.updateHands = function (dt) { upd(dt); const g = WB.G; install(g); updateInv(g, dt); };
  WB.drawTrails = function (c, g, time) { trails(c, g, time); const a = g.inv; if (a) for (const e of a) if (e.ground && !e.dead) e.ground(c, g, e, time); };
  WB.drawHands = function (c, g, time) { drw(c, g, time); const a = g.inv; if (a) for (const e of a) if (e.top && !e.dead) e.top(c, g, e, time); };

  // ---------- définition de la capacité ----------
  if (WB.ABIL && WB.ABIL.summon) {
    const d = WB.ABIL.summon;
    d.desc = 'Choisis une forme : requin (surgit d\'une flaque, instantané), golem (créature de pierre persistante) ou dragon (tête qui sort du sol, temporaire).';
    d.cast = function (f, ab, aim) { const g = WB.G, L = ab.lvl; if (!ab.form) return false; const fn = WB.INVC[ab.form]; return fn ? fn(g, f, L, aim) !== false : false; };
    d.ai = { max: L => 360, min: 0, cond: (f, ab) => !!ab.form };
  }
})(window.WB);
