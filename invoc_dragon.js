// INVOCATION : variante DRAGON (niveaux 1 à 5). Seulement la tête, qui sort du sol, temporaire, puis replonge.
(function (WB) {
  'use strict';
  const PI2 = Math.PI * 2, IA = WB.IA, INV = WB.INV;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const ease = u => u * u * (3 - 2 * u);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const TIME = [9, 10, 11, 12, 16];            // durée de présence de la tête (s)
  const CD = [3.0, 3.4, 3.8, 4.2, 2.6];       // pause entre deux attaques
  WB.INVC.DTIME = TIME;

  function floor(g, x, y) { return g.world.nearFloor(x, y, 2); }
  function ptr(f, t) { const d = dist(f, t) || 1; return { x: (t.x - f.x) / d, y: (t.y - f.y) / d }; }

  // ---------- éléments d'attaque (entités indépendantes de la tête) ----------
  // griffe : se dresse (annonce), se referme, replonge. pursuit : suit un peu l'adversaire (niveau 5)
  function claw(g, f, x, y, ang, L, o) {
    const p = floor(g, x, y); o = o || {};
    return INV.add(g, {
      f: f, x: p.x, y: p.y, ang: ang, L: L, tg: o.tg, grp: o.grp, close: o.close || 0.62, dmg: o.dmg || 30, s: o.s || 1,
      update(g2, e, dt) {
        e.t += dt;
        if (e.tg && e.tg.alive && e.t < e.close - 0.1 && e.pur) { const d = dist(e, e.tg); if (d > 3) { const nx = e.x + (e.tg.x - e.x) / d * Math.min(e.pur * dt, d), ny = e.y + (e.tg.y - e.y) / d * Math.min(e.pur * dt, d); if (!g.world.solidAt(nx, ny)) { e.x = nx; e.y = ny; } } }
        if (!e.hitd && e.t >= e.close) {
          e.hitd = true; g.sfx('impact', 0.5); g.shake(2); g.fx('burst', e.x, e.y, { col: '#8b6a4a', n: 8, life: 0.4 });
          for (const t of INV.foes(g, f, e.x, e.y, 40 * e.s)) {
            const id = t.id != null ? t.id : g.F.indexOf(t), c = e.grp ? (e.grp.get(id) || 0) : 0; if (e.grp && c >= 2) continue; if (e.grp) e.grp.set(id, c + 1);
            INV.strike(g, f, e, t, e.dmg, { key: 'c', col: '#e8c080' });
          }
        }
        return e.t < e.close + 0.85;
      },
      top(c, g2, e, time) {
        const u = e.t, grow = u < 0.35 ? ease(u / 0.35) : u > e.close + 0.5 ? 1 - ease(clamp((u - e.close - 0.5) / 0.35, 0, 1)) : 1;
        const c01 = u < e.close - 0.12 ? 0 : clamp((u - e.close + 0.12) / 0.2, 0, 1);
        IA.claw(c, e.x, e.y, e.ang, e.s, c01, e.L, grow);
      }
    });
  }

  // ---------- la tête ----------
  function summon(g, f, L, aim) {
    for (const e of g.inv || []) if (e.dr && e.f === f) { e.sink = true; if (e.sinkT == null) e.sinkT = e.t; }
    const foes = INV.nearest(g, f, 420), t0 = foes[0];
    const dir = t0 ? ptr(f, t0) : { x: aim.x, y: aim.y };
    const p = floor(g, f.x + dir.x * (80 + 26 * L), f.y + dir.y * (80 + 26 * L));
    f.armT = 0.4; g.sfx('wall'); g.shake(3 + L);
    const K = IA.DRAGON_SCALE[L - 1];
    g.fx('ring', p.x, p.y, { r: 60 * K, col: '#a08060', life: 0.5, w: 6 }); g.fx('burst', p.x, p.y, { col: '#7a5a3a', n: 16, life: 0.7 });
    const D = INV.add(g, {
      dr: true, f: f, L: L, x: p.x, y: p.y, face: dir.x >= 0 ? 1 : -1, T: TIME[L - 1], cd: 1.2, busy: 0, open: 0, roar: 0, lunge: 0, lungeV: 0, sink: false, sinkT: null, pick: 0,
      update(g2, e, dt) {
        e.t += dt; e.busy = Math.max(0, e.busy - dt); e.roar = Math.max(0, e.roar - dt * 1.5);
        e.open += ((e.busy > 0 ? 1 : 0.15) - e.open) * Math.min(1, dt * 9); e.lunge += (e.lungeV - e.lunge) * Math.min(1, dt * 12);
        if (!f.alive && !e.sink) { e.sink = true; e.sinkT = e.t; }
        if (!e.sink && e.t >= e.T && e.busy <= 0) { e.sink = true; e.sinkT = e.t; }
        if (e.sink) { if (e.t - e.sinkT >= 0.9) { g.fx('burst', e.x, e.y, { col: '#7a5a3a', n: 12, life: 0.6 }); return false; } return true; }
        if (e.t > 0.9) { e.cd -= dt; const foes = INV.foes(g, f, e.x, e.y, 460); if (e.cd <= 0 && foes.length && e.t < e.T - 1.4) { e.cd = CD[L - 1]; attack(g, e, foes); } }
        if (e.t > 0.9) { const t = INV.foes(g, f, e.x, e.y, 520)[0]; if (t) e.face = t.x >= e.x ? 1 : -1; }
        return true;
      },
      ground(c, g2, e, time) { const s = IA.DRAGON_SCALE[L - 1]; c.fillStyle = 'rgba(30,18,10,0.55)'; const a = clamp(e.t / 0.4, 0, 1) * (e.sink ? clamp(1 - (e.t - e.sinkT) / 0.9, 0, 1) : 1); if (a > 0) { c.save(); c.globalAlpha = a; c.beginPath(); c.ellipse(e.x, e.y + 2, 46 * s * 0.72, 15 * s * 0.72, 0, 0, PI2); c.fill(); c.restore(); } },
      top(c, g2, e, time) {
        let rise = e.t < 0.9 ? ease(e.t / 0.9) : 1; if (e.sink) rise = 1 - ease(clamp((e.t - e.sinkT) / 0.9, 0, 1));
        IA.dragon(c, e.x, e.y, L, e.face, rise, e.open, e.roar, time, e.lunge * 0.7);
      }
    });
    return D;
  }

  function attack(g, e, foes) {
    const f = e.f, L = e.L; e.busy = 1.0;
    const near = foes.slice().sort((a, b) => dist(a, e) - dist(b, e));
    if (L === 1) {
      e.busy = 1.5; e.roar = 1; g.sfx('boom', 0.5);
      for (const t of near.slice(0, 2)) for (const sd of [-1, 1]) claw(g, f, t.x + sd * 24, t.y + 4, -sd * 0.4, 1, { tg: t, dmg: 30, close: 0.65 });
    } else if (L === 2) fangs(g, e, near[0]);
    else if (L === 3) tailBite(g, e, near[0]);
    else if (L === 4) cage(g, e, near);
    else { const m = ['claws', 'flames', 'jaw', 'roar']; const k = m[e.pick++ % 4]; if (k === 'claws') thousand(g, e, near); else if (k === 'jaw') abyss(g, e, near); else if (k === 'roar') extinction(g, e); else flames(g, e, near[0]); }
  }

  // N2 : rangée de crocs en ligne droite
  function fangs(g, e, t) {
    const f = e.f, d = ptr(e, t), x0 = e.x, y0 = e.y; e.busy = 1.6; e.roar = 0.6; g.sfx('boom', 0.5); e.face = d.x >= 0 ? 1 : -1;
    const E = INV.add(g, { f: f, L: 2, n: 12, made: false, sp: 36, list: [], update(g2, e2, dt) {
      e2.t += dt;
      if (!e2.made) for (let i = 0; i < e2.n; i++) { const x = x0 + d.x * (60 + i * e2.sp), y = y0 + d.y * (60 + i * e2.sp); if (g.world.solidAt(x, y)) break; e2.list.push({ x: x, y: y, t0: 0.4 + i * 0.05, lean: (Math.random() - 0.5) * 0.3 }); }
      e2.made = true;
      for (const fg of e2.list) { const u = e2.t - fg.t0; if (u >= 0.1 && !fg.hit) { fg.hit = true; for (const v of INV.foes(g, f, fg.x, fg.y, 30)) INV.strike(g, f, e2, v, 30, { key: 'f', dx: d.x, dy: d.y, force: 400, col: '#f0d070' }); if (Math.random() < 0.3) g.fx('burst', fg.x, fg.y, { col: '#c8a040', n: 3, life: 0.3 }); } }
      return e2.t < e2.n * 0.05 + 1.5;
    }, top(c, g2, e2, time) { if (e2.t < 0) return; for (const fg of e2.list) { const u = e2.t - fg.t0; if (u < 0) continue; const h = u < 0.25 ? ease(u / 0.25) : u > 0.6 ? 1 - ease(clamp((u - 0.6) / 0.35, 0, 1)) : 1; IA.fang(c, fg.x, fg.y, 1.2, h, 2, fg.lean); } },
      ground(c, g2, e2) { if (e2.t < 0.4 && e2.list.length) { c.save(); c.globalAlpha = 0.35 + 0.25 * Math.sin(e2.t * 30); c.strokeStyle = '#e3b02e'; c.lineWidth = 3; c.setLineDash([10, 8]); c.beginPath(); c.moveTo(e2.list[0].x, e2.list[0].y); const l = e2.list[e2.list.length - 1]; c.lineTo(l.x, l.y); c.stroke(); c.restore(); } } });
  }

  // N3 : tête et queue fantôme attaquent de côtés opposés
  function tailBite(g, e, t) {
    const f = e.f, d = ptr(e, t), tx = t.x, ty = t.y; e.busy = 1.9; e.roar = 1; g.sfx('boom', 0.6); e.face = d.x >= 0 ? 1 : -1;
    const px = tx + d.x * 90, py = ty + d.y * 90, base = Math.atan2(-d.y, -d.x), r = 120, a0 = base - 1.5, a1 = base + 1.5;
    INV.add(g, { f: f, L: 3, update(g2, e2, dt) {
      e2.t += dt;
      if (e2.t >= 0.75 && !e2.bit) { e2.bit = true; e.lungeV = 1; g.sfx('impact', 0.8); g.shake(5); const hx = e.x + d.x * Math.min(110, dist(e, { x: tx, y: ty })), hy = e.y + d.y * Math.min(110, dist(e, { x: tx, y: ty })); g.fx('ring', hx, hy, { r: 80, col: '#e55', life: 0.35, w: 5 }); for (const v of INV.foes(g, f, hx, hy, 80)) INV.strike(g, f, e2, v, 36, { key: 'h', dx: d.x, dy: d.y, force: 200, col: '#f66' }); }
      if (e2.t >= 1.2) e.lungeV = 0;
      const u = clamp((e2.t - 0.75) / 0.5, 0, 1);
      if (u > 0 && u < 1.0001 && e2.t < 1.3) { const cur = a0 + (a1 - a0) * u; for (const v of INV.foes(g, f, px, py, r + 44)) { const dd = Math.hypot(v.x - px, v.y - py); if (dd < r - 46 - v.r * 0 || dd > r + 46) continue; let a = Math.atan2(v.y - py, v.x - px) - a0; while (a < -Math.PI) a += PI2; while (a > Math.PI) a -= PI2; a += a0; if (a >= a0 - 0.1 && a <= cur) { const ang = Math.atan2(v.y - py, v.x - px); INV.strike(g, f, e2, v, 40, { key: 't', dx: Math.cos(ang), dy: Math.sin(ang), force: 450, col: '#f66' }); } } if (!e2.sfx) { e2.sfx = 1; g.sfx('boom', 0.7); } }
      return e2.t < 1.7;
    },
    ground(c, g2, e2, time) { if (e2.t < 0.75) { c.save(); c.globalAlpha = 0.18 + 0.12 * Math.sin(e2.t * 18); c.strokeStyle = '#cf2d2d'; c.lineWidth = 92; c.beginPath(); c.arc(px, py, r, a0, a1); c.stroke(); c.restore(); } },
    top(c, g2, e2, time) { const t0 = e2.t - 0.45; if (t0 < 0) return; const u = clamp((e2.t - 0.75) / 0.5, 0, 1), end = a0 + (a1 - a0) * Math.max(0.06, u), al = e2.t > 1.3 ? clamp(1 - (e2.t - 1.3) / 0.4, 0, 1) : clamp(t0 / 0.3, 0, 1); IA.tail(c, px, py, r, a0, end, 3, al); } });
  }

  // N4 : tombeau du dragon, cage de côtes puis morsure
  function cage(g, e, near) {
    const f = e.f; const c0 = near.slice(0, 3).reduce((a, t) => ({ x: a.x + t.x / Math.min(3, near.length), y: a.y + t.y / Math.min(3, near.length) }), { x: 0, y: 0 });
    const R = 140, N = 16; e.busy = 4.0; e.roar = 1; g.sfx('boom', 0.7); e.face = c0.x >= e.x ? 1 : -1;
    const ribs = [];
    const C = INV.add(g, { f: f, L: 4, update(g2, e2, dt) {
      e2.t += dt;
      if (!e2.made && e2.t >= 0.6) { e2.made = true; g.sfx('wall'); g.shake(6); for (let i = 0; i < N; i++) { const a = i / N * PI2, x = c0.x + Math.cos(a) * R, y = c0.y + Math.sin(a) * R; if (g.world.solidAt(x, y)) continue; const w = { x: x, y: y, w: 40, h: 40, hp: 100, maxhp: 100, life: 2.1, owner: f, a: a, rise: 0, draw: drawRib, born: g.t }; g.addWall(w); ribs.push(w); g.fx('burst', x, y, { col: '#b8a888', n: 4, life: 0.4 }); } }
      if (e2.t >= 0.6) for (const w of ribs) w.rise = Math.min(1, (g.t - w.born) / 0.5);
      if (e2.t >= 1.7) e.lungeV = 1.3;
      if (!e2.bit && e2.t >= 2.7) { e2.bit = true; g.sfx('impact', 1); g.shake(12); g.fx('ring', c0.x, c0.y, { r: R, col: '#ffffff', life: 0.45, w: 8 }); g.fx('burst', c0.x, c0.y, { col: '#e8e8f0', n: 24, life: 0.8 }); for (const v of INV.foes(g, f, c0.x, c0.y, R + 8)) { const a = Math.atan2(v.y - c0.y, v.x - c0.x); INV.strike(g, f, e2, v, 80, { key: 'c', dx: Math.cos(a), dy: Math.sin(a), force: 150, stun: 0.3, col: '#ffffff' }); } }
      if (e2.t >= 3.1) e.lungeV = 0;
      if (e2.t >= 3.4) { for (const w of ribs) w.life = Math.min(w.life, 0.35); }
      return e2.t < 3.6;
    },
    ground(c, g2, e2, time) { if (e2.t < 0.6) { c.save(); c.globalAlpha = 0.25 + 0.2 * Math.sin(e2.t * 16); c.strokeStyle = '#eeeef2'; c.lineWidth = 5; c.setLineDash([14, 10]); c.beginPath(); c.ellipse(c0.x, c0.y, R, R * 0.74, 0, 0, PI2); c.stroke(); c.restore(); } } });
  }
  function drawRib(c, w) { const r = w.rise == null ? 1 : w.rise; if (r <= 0.02) return; const out = w.life < 0.35 ? w.life / 0.35 : 1; c.save(); c.translate(w.x, w.y + 14); c.scale(Math.cos(w.a) > 0 ? -1 : 1, 1); IA.rib(c, 0, 0, 0, 0.9, r * out, 4); c.restore(); const p = Math.max(0, w.hp / w.maxhp); if (p < 1) { c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(w.x - 18, w.y + 18, 36, 5); c.fillStyle = '#ffd24a'; c.fillRect(w.x - 17, w.y + 19, 34 * p, 3); } }

  // ---------- N5 ----------
  // les mille griffes
  function thousand(g, e, near) {
    const f = e.f, grp = new Map(); e.busy = 2.0; e.roar = 1; g.sfx('boom', 0.8);
    let n = 0;
    for (const t of near.slice(0, 4)) for (let k = 0; k < 3; k++) { const a = k * 2.1 + Math.random(); const c = claw(g, f, t.x + Math.cos(a) * 46, t.y + Math.sin(a) * 46, Math.cos(a) * 0.5, 5, { tg: t, grp: grp, dmg: 22, close: 0.9 + k * 0.08, s: 1.15 }); c.pur = 150; n++; }
    for (let k = n; k < 14; k++) { const a = Math.random() * PI2, d = rnd(60, 260), p = near[k % near.length]; const c = claw(g, f, p.x + Math.cos(a) * d * 0.6, p.y + Math.sin(a) * d * 0.6, Math.cos(a) * 0.5, 5, { tg: Math.random() < 0.4 ? p : null, grp: grp, dmg: 22, close: 0.9 + Math.random() * 0.4, s: 1.1 }); c.pur = 110; }
  }
  // la mâchoire abyssale : grande gueule noire qui se referme sur une zone ciblée
  function abyss(g, e, near) {
    const f = e.f, t = near[0], R = 130; e.busy = 2.1; e.roar = 0.8; e.lungeV = 1; g.sfx('boom', 0.8); e.face = t.x >= e.x ? 1 : -1;
    const p = floor(g, t.x, t.y);
    INV.add(g, { f: f, L: 5, x: p.x, y: p.y, update(g2, e2, dt) {
      e2.t += dt;
      if (e2.t > 0.3 && e2.t < 1.2) { const k = 0.5 * dt * 3; const tg = t.alive ? t : null; if (tg && e2.t < 0.8) { e2.x += (tg.x - e2.x) * Math.min(1, dt * 2.5); e2.y += (tg.y - e2.y) * Math.min(1, dt * 2.5); } }
      if (!e2.bit && e2.t >= 1.2) { e2.bit = true; e.lungeV = 0; g.sfx('impact', 1); g.shake(12); g.fx('ring', e2.x, e2.y, { r: R, col: '#a040ff', life: 0.5, w: 8 }); g.fx('burst', e2.x, e2.y, { col: '#4a2a6a', n: 24, life: 0.8 }); for (const v of INV.foes(g, f, e2.x, e2.y, R)) { const a = Math.atan2(v.y - e2.y, v.x - e2.x); INV.strike(g, f, e2, v, 90, { key: 'j', dx: Math.cos(a), dy: Math.sin(a), force: 130, stun: 0.35, col: '#a040ff' }); } }
      return e2.t < 1.9;
    },
    ground(c, g2, e2, time) { const a = clamp(e2.t / 0.3, 0, 1) * (e2.t > 1.5 ? clamp(1 - (e2.t - 1.5) / 0.4, 0, 1) : 1); c.save(); c.globalAlpha = a * 0.6; const gr = c.createRadialGradient(e2.x, e2.y, 10, e2.x, e2.y, R); gr.addColorStop(0, 'rgba(10,6,16,0.95)'); gr.addColorStop(1, 'rgba(60,20,90,0.2)'); c.fillStyle = gr; c.beginPath(); c.ellipse(e2.x, e2.y, R, R * 0.74, 0, 0, PI2); c.fill(); c.restore(); },
    top(c, g2, e2, time) { // deux rangées de crocs noirs qui convergent
      const o = clamp(e2.t / 0.45, 0, 1), cl = e2.t < 0.9 ? 0 : clamp((e2.t - 0.9) / 0.3, 0, 1), al = e2.t > 1.5 ? clamp(1 - (e2.t - 1.5) / 0.4, 0, 1) : 1; if (o <= 0) return;
      c.save(); c.translate(e2.x, e2.y); c.globalAlpha = al; const K = IA.DRAGON_COL[4];
      for (let side = 0; side < 2; side++) { const sg = side ? 1 : -1, N = 11; for (let i = 0; i < N; i++) { const a = (side ? 0 : Math.PI) + (i + 0.5) / N * Math.PI * (side ? 1 : -1) * -1; const rr = R * (1 - cl * 0.78) * (0.6 + 0.4 * o), bx = Math.cos(a) * rr, by = Math.sin(a) * rr * 0.74 + (side ? 0 : 0); const len = (34 + (i % 2) * 14) * o, ang = Math.atan2(-by, -bx * 1.0);
        c.save(); c.translate(bx, by); c.rotate(ang); c.fillStyle = '#e8e4f0'; c.strokeStyle = K.b; c.lineWidth = 2; c.beginPath(); c.moveTo(-8, 0); c.lineTo(0, -len); c.lineTo(8, 0); c.closePath(); c.fill(); c.stroke(); c.restore(); } }
      c.strokeStyle = K.b; c.lineWidth = 12; c.globalAlpha = al * 0.9; const rr2 = R * (1 - cl * 0.78) * (0.6 + 0.4 * o) + 6; c.beginPath(); c.ellipse(0, 0, rr2, rr2 * 0.74, 0, 0, PI2); c.stroke(); c.strokeStyle = 'rgba(170,80,255,0.85)'; c.lineWidth = 3; c.stroke();
      c.restore(); } });
  }
  // le rugissement de l'extinction : fissures noires lumineuses, pics qui surgissent à la suite
  function extinction(g, e) {
    const f = e.f; e.busy = 2.2; e.roar = 1.4; g.sfx('boom', 1); g.shake(8);
    const arms = []; const base = Math.random() * PI2;
    for (let k = 0; k < 6; k++) { const a = base + k * PI2 / 6, spikes = []; for (let i = 0; i < 9; i++) { const d = 60 + i * 40; const x = e.x + Math.cos(a) * d, y = e.y + Math.sin(a) * d; if (g.world.solidAt(x, y)) break; spikes.push({ x: x, y: y, t0: 0.3 + i * 0.11 + k * 0.03, lean: (Math.random() - 0.5) * 0.4 }); } arms.push({ a: a, len: spikes.length ? 60 + spikes.length * 40 : 40, spikes: spikes }); }
    INV.add(g, { f: f, L: 5, update(g2, e2, dt) {
      e2.t += dt;
      for (const A of arms) for (const s of A.spikes) if (e2.t >= s.t0 + 0.12 && !s.hit) { s.hit = true; for (const v of INV.foes(g, f, s.x, s.y, 30)) INV.strike(g, f, e2, v, 26, { key: 's' + (s.x | 0) + '_' + (s.y | 0), dx: Math.cos(A.a), dy: Math.sin(A.a), force: 160, col: '#b060ff' }); }
      return e2.t < 2.4;
    },
    ground(c, g2, e2, time) { const al = e2.t > 1.6 ? clamp(1 - (e2.t - 1.6) / 0.8, 0, 1) : 1; for (const A of arms) { const u = clamp(e2.t / 0.9, 0, 1), L2 = A.len * u; c.save(); c.globalAlpha = al; c.lineCap = 'round'; c.strokeStyle = 'rgba(120,40,200,0.7)'; c.lineWidth = 9; c.beginPath(); c.moveTo(e.x, e.y); c.lineTo(e.x + Math.cos(A.a) * L2, e.y + Math.sin(A.a) * L2); c.stroke(); c.strokeStyle = '#0a0612'; c.lineWidth = 4; c.stroke(); c.restore(); } },
    top(c, g2, e2, time) { const al = e2.t > 1.6 ? clamp(1 - (e2.t - 1.6) / 0.8, 0, 1) : 1; c.save(); c.globalAlpha = al; for (const A of arms) for (const s of A.spikes) { const u = e2.t - s.t0; if (u < 0) continue; const h = u < 0.22 ? ease(u / 0.22) : u > 1.1 ? 1 - ease(clamp((u - 1.1) / 0.5, 0, 1)) : 1; IA.fang(c, s.x, s.y, 1.5, h, 5, s.lean); } c.restore(); } });
  }
  // les flammes noires : souffle, puis zone de feu indépendante de la tête
  function flames(g, e, t) {
    const f = e.f, base = Math.atan2(t.y - e.y, t.x - e.x); e.busy = 2.0; e.roar = 0.5; e.face = Math.cos(base) >= 0 ? 1 : -1; g.sfx('boom', 0.9); g.shake(5);
    const ox = e.x + Math.cos(base) * 40, oy = e.y - 20 + Math.sin(base) * 40, LEN = 380, HALF = 0.3, BR = 1.3;
    const F = { f: f, patches: [], tick: 0.25, L: 5 };
    INV.add(g, Object.assign(F, { update(g2, e2, dt) {
      e2.t += dt;
      if (e2.t >= 0.6 && e2.t < 0.6 + BR) { // le souffle sème des braises noires
        e.lungeV = 0.4; e.busy = Math.max(e.busy, 0.5);
        for (let i = 0; i < 2; i++) { const u = Math.random(), d = 40 + u * LEN, a = base + (Math.random() - 0.5) * 2 * HALF * (0.3 + u), x = ox + Math.cos(a) * d, y = oy + Math.sin(a) * d * 0.9; if (g.world.solidAt(x, y) || e2.patches.length > 70) continue; e2.patches.push({ x: x, y: y, r: rnd(24, 40), born: e2.t, life: 6, ph: Math.random() * 6 }); }
      } else if (e2.t >= 0.6 + BR) e.lungeV = 0;
      for (let i = e2.patches.length - 1; i >= 0; i--) if (e2.t - e2.patches[i].born >= e2.patches[i].life) e2.patches.splice(i, 1);
      e2.tick -= dt;
      if (e2.tick <= 0) { e2.tick = 0.5; for (const t2 of g.F) { if (!t2.alive || t2.team === f.team || t2.ghost || t2.swallowed || (t2.st && t2.st.jump)) continue; for (const p of e2.patches) { const k = clamp((p.life - (e2.t - p.born)) / 2.2, 0.35, 1); if (Math.hypot(t2.x - p.x, t2.y - p.y) > p.r * k + t2.r * 0.6) continue; if (g.roomBlock({ x: p.x, y: p.y, team: f.team, r: 10, st: {} }, t2)) continue; g.damage(t2, 9, f, 'summon'); g.fx('burst', t2.x, t2.y, { col: '#7a2aa0', n: 4, life: 0.3 }); break; } } }
      return e2.t < 0.6 + BR + 0.1 || e2.patches.length > 0;
    },
    ground(c, g2, e2, time) { // zone de feu au sol : cœur noir, contour violet, braises
      for (const p of e2.patches) { const age = e2.t - p.born, k = clamp((p.life - age) / 2.2, 0, 1), gr = clamp(age / 0.3, 0, 1), r = p.r * (0.4 + 0.6 * gr) * (0.55 + 0.45 * k); c.save(); c.translate(p.x, p.y); c.globalAlpha = 0.25 + 0.7 * k;
        const w = Math.sin(time * 9 + p.ph) * 0.12; c.fillStyle = 'rgba(150,40,60,0.55)'; c.beginPath(); c.ellipse(0, 0, r * (1.25 + w), r * (0.95 + w), 0, 0, PI2); c.fill();
        c.strokeStyle = 'rgba(170,70,255,0.9)'; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 0, r * (1.0 + w), r * (0.76 + w), 0, 0, PI2); c.stroke();
        c.fillStyle = '#07040c'; c.beginPath(); c.ellipse(0, 0, r * 0.8, r * 0.58, 0, 0, PI2); c.fill();
        c.fillStyle = 'rgba(255,120,60,0.9)'; for (let i = 0; i < 3; i++) { const a = p.ph + i * 2.1 + time * 2, rr = r * 0.6 * ((time * 0.9 + i * 0.33) % 1); c.fillRect(Math.cos(a) * rr - 1.5, Math.sin(a) * rr * 0.7 - 3 - rr * 0.4, 3, 3); }
        c.restore(); } },
    top(c, g2, e2, time) {
      const t0 = e2.t - 0.6; if (t0 >= 0 && t0 < BR + 0.4) { const u = clamp(t0 / 0.25, 0, 1) * (t0 > BR ? clamp(1 - (t0 - BR) / 0.4, 0, 1) : 1); c.save(); c.globalAlpha = u; c.translate(ox, oy); c.rotate(base);
        for (let k = 0; k < 3; k++) { const wid = HALF * (1.0 - k * 0.25), len = LEN * (1 - k * 0.07), col = ['rgba(150,30,90,0.55)', 'rgba(110,30,170,0.7)', 'rgba(5,3,10,0.95)'][k]; c.fillStyle = col; c.beginPath(); c.moveTo(0, 0); for (let i = 0; i <= 12; i++) { const a = -wid + wid * 2 * i / 12, d = len * (0.8 + 0.2 * Math.sin(time * 14 + i * 1.7 + k)); c.lineTo(Math.cos(a) * d, Math.sin(a) * d); } c.closePath(); c.fill(); }
        c.fillStyle = 'rgba(255,140,60,0.9)'; for (let i = 0; i < 22; i++) { const d = ((time * 2.4 + i * 0.137) % 1) * LEN, a = Math.sin(i * 12.9 + time * 3) * HALF; c.fillRect(Math.cos(a) * d - 1.5, Math.sin(a) * d - 1.5, 3, 3); }
        c.fillStyle = 'rgba(40,30,50,0.5)'; for (let i = 0; i < 7; i++) { const d = ((time * 1.2 + i * 0.15) % 1) * LEN, a = Math.sin(i * 7.3 + time) * HALF * 1.2; c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d - ((time + i) % 1) * 20, 8 + d * 0.03, 0, PI2); c.fill(); }
        c.restore(); } } }));
  }

  WB.INVC.dragon = function (g, f, L, aim) { summon(g, f, L, aim); return true; };
})(window.WB);
