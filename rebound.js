// REBOND : rebonds successifs (niveau 3+), dégâts croissants, cratères et éclats de terre, adversaire projeté et étourdi (niveau 4+)
(function (WB) {
  'use strict';
  const PI2 = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const BN = { 3: 2, 4: 3, 5: 3 };              // nombre d'atterrissages par utilisation
  const GROW = 0.25;                             // dégâts +25 % à chaque atterrissage supplémentaire
  const RINGS = { 3: [0.6], 4: [0.4, 0.8], 5: [0.3, 0.6, 0.9] }; // cratères : rayon / rayon d'impact
  const CLOD_DMG = { 3: 6, 4: 7, 5: 8 };         // dégâts d'un cratère (un coup par adversaire et par cratère)
  const POP_STUN = 0.5, POP_T = 0.42, HOP_DUR = 0.4, HOP_LEN = 120;
  const MAX_DEB = 320;

  function hopTarget(g, f, j) {
    const W = g.world; let dx = j.dir.x, dy = j.dir.y, d = HOP_LEN;
    let best = null, bd = 300;
    for (const t of g.F) { if (!t.alive || t.team === f.team || t.ghost || (t.st && t.st.jump)) continue; const q = dist(f, t); if (q < bd && !g.roomBlock(f, t)) { bd = q; best = t; } }
    if (best) { const q = dist(f, best) || 1; dx = (best.x - f.x) / q; dy = (best.y - f.y) / q; d = Math.min(HOP_LEN, Math.max(40, q)); j.dir = { x: dx, y: dy }; }
    let x = f.x, y = f.y, ok = false;
    for (let k = 0; k < 6 && !ok; k++, d -= 20) { x = f.x + dx * d; y = f.y + dy * d; ok = d < 20 || (W.pass(Math.floor(x / WB.TS), Math.floor(y / WB.TS)) && W.los(f.x, f.y, x, y) && g.roomOf({ x: x, y: y }) === g.roomOf(f)); }
    if (!ok) { x = f.x; y = f.y; }
    return { x: x, y: y };
  }

  function craters(g, f, L, x, y, R, ld) {
    const rings = RINGS[L]; if (!rings) return;
    (g.rcr || (g.rcr = [])).push({ x: x, y: y, t: 0, life: 4, R: R, rings: rings.map(r => r * R) });
    const deb = g.rdeb || (g.rdeb = []);
    rings.forEach((fr, k) => {
      const rr = fr * R, n = Math.round(rr / 7) + 6;
      for (let i = 0; i < n && deb.length < MAX_DEB; i++) {
        const a = i / n * PI2 + k * 0.4 + (Math.random() - 0.5) * 0.25;
        const sx = x + Math.cos(a) * rr, sy = y + Math.sin(a) * rr, d = 8 + Math.random() * 14;
        if (g.world.solidAt(sx, sy) || g.roomOf({ x: sx, y: sy }) !== g.roomOf({ x: x, y: y }) || !g.world.los(x, y, sx, sy)) continue; // les éclats ne passent pas les murs
        deb.push({ x: sx, y: sy, ex: sx + Math.cos(a) * d, ey: sy + Math.sin(a) * d, t: -k * 0.12 - Math.random() * 0.05, dur: 0.55, peak: 38 + Math.random() * 26, s: 3 + Math.random() * 3, k: k, ld: ld, f: f, L: L, rot: Math.random() * 6, done: false });
      }
    });
    g.fx('burst', x, y, { col: '#a07a4a', n: 18, life: 0.6 });
  }

  function landing(g, f, j, land0) {
    const L = j.L, i = j.i || 0, n = BN[L], last = i === n - 1, R = 105 + 14 * L;
    const dmg = (26 + 8 * L) * 0.55 * (1 + GROW * i), x = f.x, y = f.y, pt = { x: x, y: y, team: f.team, r: 10, st: {} };
    const ld = { hit: new Set() };
    for (const t of g.F) {
      if (!t.alive || t.team === f.team || t.ghost || (t.st && t.st.jump)) continue;
      if (dist(t, { x: x, y: y }) > R + t.r || g.roomBlock(pt, t)) continue;
      g.damage(t, dmg, f, 'jump');
      if (!t.alive) continue;
      const a = Math.atan2(t.y - y, t.x - x); g.knock(t, Math.cos(a), Math.sin(a), 150);
      if (L >= 4) { g.status(t, 'stun', POP_STUN); t.rbPop = { t: 0 }; } else g.status(t, 'stun', 1.2 + 0.2 * L);
    }
    for (const tu of g.turrets) if (tu.owner && tu.owner.team !== f.team && dist(tu, { x: x, y: y }) < R + 18) { tu.hp -= dmg; if (tu.hp <= 0) tu.life = 0; }
    g.fx('ring', x, y, { r: R, col: '#9affc0', life: 0.45, w: 10 }); g.fx('burst', x, y, { col: '#cfe', n: 16, life: 0.5 }); g.shake(7 + i * 2); g.sfx('boom', i ? 0.7 : 1);
    craters(g, f, L, x, y, R, ld);
    if (!last) { // rebond suivant
      const nx = hopTarget(g, f, j);
      f.st.jump = { t: 0, dur: HOP_DUR, x0: x, y0: y, x1: nx.x, y1: nx.y, L: L, i: i + 1, n: n, dir: j.dir }; f.vx = f.vy = 0;
    } else { // dernier atterrissage : deuxième onde (niv. 3+) et météore (niv. 5), comme avant
      g.later(0.35, function () {
        const R2 = 160 + 14 * L, pt2 = { x: x, y: y, team: f.team, r: 10, st: {} };
        for (const t of g.F) {
          if (!t.alive || t.team === f.team || t.ghost || (t.st && t.st.jump) || dist(t, { x: x, y: y }) > R2 + t.r || g.roomBlock(pt2, t)) continue;
          g.damage(t, 14 + 5 * L, f, 'jump'); if (t.alive) { const a = Math.atan2(t.y - y, t.x - x); g.knock(t, Math.cos(a), Math.sin(a), 380); }
        }
        g.fx('ring', x, y, { r: R2, col: '#d8ffe4', life: 0.5, w: 8 });
      });
      if (L >= 5) { for (const t of g.enemiesIn(f, x, y, 200)) if (!g.roomBlock(pt, t)) g.burn(t, 40, 3, f, 'jump'); g.fx('burst', x, y, { col: '#ff9a3c', n: 30, life: 0.8 }); g.shake(12); }
    }
  }
  function G() { return WB.G; }
  WB.rebLand = function (f, j, land0) {
    const g = WB.G;
    if (!BN[j.L]) return land0(f, j);
    if (!j.dir) { const dx = j.x1 - j.x0, dy = j.y1 - j.y0, d = Math.hypot(dx, dy); j.dir = d > 5 ? { x: dx / d, y: dy / d } : { x: f.face ? f.face.x : 1, y: f.face ? f.face.y : 0 }; }
    landing(g, f, j, land0);
  };

  function update(g, dt) {
    if (g.rcr) { for (const c of g.rcr) c.t += dt; g.rcr = g.rcr.filter(c => c.t < c.life); }
    const deb = g.rdeb;
    if (deb && deb.length) {
      for (const d of deb) {
        d.t += dt;
        if (d.t >= d.dur) { d.done = true; continue; }
        if (d.t < 0 || d.hitDone) continue; d.hitDone = true; // le morceau de terre jaillit du cratère : il blesse ceux qui se trouvent dessus
        const f = d.f, pt = { x: d.x, y: d.y, team: f.team, r: 5, st: {} };
        for (const t of g.F) {
          if (!t.alive || t.team === f.team || t.ghost || (t.st && t.st.jump) || dist(t, { x: d.x, y: d.y }) > 34 + t.r) continue;
          if (g.roomBlock(pt, t)) continue;
          const key = t.id + '_' + d.k; if (d.ld.hit.has(key)) continue; d.ld.hit.add(key);
          g.damage(t, CLOD_DMG[d.L], f, 'jump'); g.fx('burst', t.x, t.y, { col: '#8a6a3a', n: 5, life: 0.3 });
        }
      }
      g.rdeb = deb.filter(d => !d.done);
    }
    for (const t of g.F) {
      const p = t.rbPop; if (!p) continue;
      p.t += dt; const u = p.t / POP_T;
      if (u >= 1 || !t.alive) { t.rbPop = null; t.jumpH = 0; } else t.jumpH = Math.sin(u * Math.PI) * 34;
    }
  }

  function drawCraters(ctx, g, time) {
    if (!g.rcr) return;
    for (const c of g.rcr) {
      const a = Math.min(1, (c.life - c.t) / 1), sc = Math.min(1, c.t / 0.15 + 0.2);
      for (const r of c.rings) {
        const rr = r * sc;
        ctx.save(); ctx.globalAlpha = 0.55 * a; ctx.strokeStyle = '#2e1c0c'; ctx.lineWidth = 11; ctx.beginPath(); ctx.arc(c.x, c.y, rr, 0, PI2); ctx.stroke();
        ctx.globalAlpha = 0.5 * a; ctx.strokeStyle = '#a2794a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(c.x, c.y, rr + 7, 0, PI2); ctx.stroke(); ctx.restore();
      }
    }
  }
  function drawDebris(ctx, g, time) {
    if (!g.rdeb) return;
    for (const d of g.rdeb) {
      if (d.t < 0) continue; const u = Math.min(1, d.t / d.dur), x = d.x + (d.ex - d.x) * u, y = d.y + (d.ey - d.y) * u, h = Math.sin(u * Math.PI) * d.peak;
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(x, y + 2, d.s, d.s * 0.45, 0, 0, PI2); ctx.fill();
      ctx.save(); ctx.translate(x, y - h); ctx.rotate(d.rot + u * 6); ctx.fillStyle = '#6b4a28'; ctx.fillRect(-d.s, -d.s * 0.8, d.s * 2, d.s * 1.6); ctx.fillStyle = '#9a7040'; ctx.fillRect(-d.s, -d.s * 0.8, d.s * 2, d.s * 0.6); ctx.restore();
    }
  }

  if (WB.ABIL && WB.ABIL.jump) WB.ABIL.jump.desc = 'Bondis : dégâts et étourdissement. Niv.3 : plusieurs atterrissages aux dégâts croissants, avec cratères. Niv.4 : double cratère, adversaires projetés et étourdis. Niv.5 : triple cratère et météore.';
  WB.GUIDE = WB.GUIDE || {};
  WB.GUIDE.jump = ['Pêche', 'Bondis sur tes ennemis : à chaque atterrissage, une onde, puis des cratères qui projettent des éclats de terre.', [
    'Un bond et une onde d\'étourdissement.', 'Zone et étourdissement plus grands.',
    'Deux atterrissages aux dégâts croissants, un cratère circulaire qui lance des éclats de terre, deuxième onde.',
    'Trois atterrissages, double cratère (un proche, un plus large), les adversaires touchés rebondissent et sont étourdis un instant.',
    'Triple cratère à chaque atterrissage, impact de météore final qui enflamme les ennemis proches.']];
  WB.REBOUND = { BN: BN, RINGS: RINGS };

  const upd = WB.updateHands, drw = WB.drawHands, trails = WB.drawTrails;
  WB.updateHands = function (dt) { upd(dt); update(WB.G, dt); };
  WB.drawTrails = function (c, g, time) { trails(c, g, time); drawCraters(c, g, time); };
  WB.drawHands = function (ctx, g, time) { drw(ctx, g, time); drawDebris(ctx, g, time); };
})(window.WB);
