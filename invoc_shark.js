// INVOCATION : variante REQUIN (niveaux 1 à 5). Le requin nage sous le terrain dans une flaque d'eau magique, il ne marche jamais.
(function (WB) {
  'use strict';
  const PI2 = Math.PI * 2, IA = WB.IA, INV = WB.INV;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const ease = u => u * u * (3 - 2 * u);
  const rnd = (a, b) => a + Math.random() * (b - a);

  // une attaque de requin : la flaque se forme, le requin surgit, mord, replonge. tout dure moins de 1,3 s
  // o : { R flaque, s taille, tel délai, kind 'bite'|'ram'|'spin', dmg, hitR, force, stun, slow, pop, tg }
  function jaw(g, f, x, y, o) {
    const p = g.world.nearFloor(x, y, 2);
    const e = INV.add(g, {
      sk: true, f: f, x: p.x, y: p.y, o: o, face: 1, bit: false, spin: 0,
      update(g2, e, dt) {
        const o = e.o; e.t += dt;
        if (e.t < o.tel && o.tg && o.tg.alive) { const d = dist(e, o.tg), sp = 260 * dt; if (d > 2) { const nx = e.x + (o.tg.x - e.x) / d * Math.min(sp, d), ny = e.y + (o.tg.y - e.y) / d * Math.min(sp, d); if (!g.world.solidAt(nx, ny)) { e.x = nx; e.y = ny; } } }
        if (o.tg && o.tg.alive) e.face = o.tg.x >= e.x ? 1 : -1;
        const tb = o.tel + 0.22;
        if (!e.bit && e.t >= tb) {
          e.bit = true; g.sfx('impact', 0.8); g.shake(o.kind === 'spin' ? 5 : 3);
          g.fx('ring', e.x, e.y, { r: o.hitR, col: '#bfe9ff', life: 0.35, w: 5 }); g.fx('burst', e.x, e.y, { col: '#9fdcff', n: 12, life: 0.5 });
          for (const t of INV.foes(g, f, e.x, e.y, o.hitR)) {
            const a = Math.atan2(t.y - e.y, t.x - e.x);
            INV.strike(g, f, e, t, o.dmg, { key: 'j', dx: Math.cos(a), dy: Math.sin(a), force: o.force || 0, stun: o.stun, slow: o.slow, pop: o.pop, col: '#bfe9ff' });
          }
        }
        if (e.t >= tb) e.spin = (e.t - tb) * 11;
        return e.t < o.tel + 1.25;
      },
      ground(c, g2, e, time) {
        const o = e.o, a = e.t < 0.2 ? e.t / 0.2 : e.t > o.tel + 0.95 ? clamp(1 - (e.t - o.tel - 0.95) / 0.3, 0, 1) : 1;
        IA.puddle(c, e.x, e.y, o.R * (0.55 + 0.45 * Math.min(1, e.t / 0.3)), a, time);
      },
      top(c, g2, e, time) {
        const o = e.o, u = e.t - o.tel; if (u < 0) return;
        const rise = u < 0.22 ? ease(u / 0.22) : u > 0.85 ? 1 - ease(clamp((u - 0.85) / 0.35, 0, 1)) : 1;
        const open = u < 0.22 ? 0 : u < 0.5 ? 1 : clamp(1 - (u - 0.5) / 0.12, 0, 1);
        const tilt = o.kind === 'spin' ? Math.sin(e.spin) * 0.5 : o.kind === 'ram' ? -0.25 * Math.min(1, Math.max(0, u - 0.2) * 5) : 0;
        IA.shark(c, e.x, e.y, o.s, e.face, rise, open, time, tilt);
      }
    });
    return e;
  }

  function zoneCenter(g, f, aim) {
    const fo = INV.nearest(g, f, 330);
    if (fo.length) { let x = 0, y = 0; const n = Math.min(3, fo.length); for (let i = 0; i < n; i++) { x += fo[i].x; y += fo[i].y; } return { x: x / n, y: y / n, foes: fo }; }
    return { x: f.x + aim.x * 200, y: f.y + aim.y * 200, foes: [] };
  }

  // zone aquatique durable : la nageoire poursuit, le requin surgit sous les pieds
  function zone(g, f, L, aim) {
    for (const e of g.inv || []) if (e.sk && e.zone && e.f === f) e.dead = true;
    const c0 = zoneCenter(g, f, aim), p = g.world.nearFloor(c0.x, c0.y, 2);
    const P = L === 2 ? { R: 120, life: 4.2, fs: 1.0, sp: 230, tel: 0.35, dmg: 36, bites: 4 } : L === 4 ? { R: 190, life: 6.0 } : { R: 270, life: 9.0 };
    const Z = INV.add(g, { sk: true, zone: true, f: f, x: p.x, y: p.y, L: L, P: P, fin: { x: p.x, y: p.y }, face: 1, mode: 'seek', mt: 0, bites: 0, tg: null, pulled: 0, ph: 0, big: null, jaws: 0 });
    g.sfx('wall'); g.fx('ring', p.x, p.y, { r: P.R, col: '#6cc8ff', life: 0.6, w: 6 });
    if (L === 2) Z.update = (g2, e, dt) => upd2(g, e, dt);
    else if (L === 4) Z.update = (g2, e, dt) => upd4(g, e, dt);
    else Z.update = (g2, e, dt) => upd5(g, e, dt);
    Z.ground = (c, g2, e, time) => ground(c, e, time);
    Z.top = (c, g2, e, time) => top(c, e, time);
    return true;
  }

  function chase(g, e, f, dt, sp, R) { // la nageoire suit l'adversaire le plus proche dans la zone
    const foes = INV.foes(g, f, e.x, e.y, R).filter(t => dist(t, e) <= R);
    foes.sort((a, b) => dist(a, e.fin) - dist(b, e.fin)); const t = foes[0] || null; e.tg = t;
    if (t) { const d = dist(e.fin, t); if (d > 1) { const m = Math.min(sp * dt, d); const nx = e.fin.x + (t.x - e.fin.x) / d * m, ny = e.fin.y + (t.y - e.fin.y) / d * m; if (!g.world.solidAt(nx, ny)) { e.fin.x = nx; e.fin.y = ny; } e.face = t.x >= e.fin.x ? 1 : -1; } }
    return t;
  }

  // N2 : chasseur des profondeurs
  function upd2(g, e, dt) {
    const f = e.f, P = e.P; e.t += dt; e.mt += dt;
    if (e.t >= P.life || !f.alive) return false;
    if (e.mode === 'seek') {
      const t = chase(g, e, f, dt, P.sp, P.R);
      if (t && dist(e.fin, t) < 26 && e.mt > 0.5) { e.mode = 'tel'; e.mt = 0; e.lock = t; }
    } else if (e.mode === 'tel') { // la nageoire s'arrête sous les pieds, l'eau frémit
      const t = e.lock; if (t && t.alive) { e.fin.x += (t.x - e.fin.x) * Math.min(1, dt * 8); e.fin.y += (t.y - e.fin.y) * Math.min(1, dt * 8); }
      if (e.mt >= P.tel) { e.mode = 'bite'; e.mt = 0; e.bit = false; }
    } else if (e.mode === 'bite') {
      if (!e.bit && e.mt >= 0.18) {
        e.bit = true; g.sfx('impact', 0.8); g.shake(4); g.fx('ring', e.fin.x, e.fin.y, { r: 60, col: '#bfe9ff', life: 0.35, w: 5 }); g.fx('burst', e.fin.x, e.fin.y, { col: '#9fdcff', n: 12, life: 0.5 });
        const k = 'b' + e.bites++;
        for (const t of INV.foes(g, f, e.fin.x, e.fin.y, 52)) { const a = Math.atan2(t.y - e.fin.y, t.x - e.fin.x); INV.strike(g, f, e, t, P.dmg, { key: k, dx: Math.cos(a), dy: Math.sin(a), force: 160, stun: 0.5, pop: true, col: '#bfe9ff' }); }
      }
      if (e.mt >= 0.9) { e.mode = e.bites >= P.bites ? 'end' : 'seek'; e.mt = 0; }
    } else e.mt = 0;
    return true;
  }
  // N4 : gueule des abysses
  function upd4(g, e, dt) {
    const f = e.f, R = e.P.R; e.t += dt; if (e.t >= e.P.life || !f.alive) return false;
    // 0-0.9 la flaque grandit ; 0.9-1.5 le requin géant sort ; 1.5-3.9 vortex ; 3.9 la mâchoire se referme ; 4.6-5.5 il replonge
    if (e.t > 1.5 && e.t < 3.9) {
      const sp = 70 + 70 * ((e.t - 1.5) / 2.4); g.fx && Math.random() < 0.4 && g.fx('burst', e.x + rnd(-R, R) * 0.6, e.y + rnd(-R, R) * 0.4, { col: '#9fdcff', n: 1, life: 0.4 });
      for (const t of INV.foes(g, f, e.x, e.y, R)) { const d = dist(t, e); if (d > 24 && d <= R) { const m = Math.min(sp * dt, d - 22), nx = t.x + (e.x - t.x) / d * m, ny = t.y + (e.y - t.y) / d * m; if (!g.world.solidAt(nx, ny)) { t.x = nx; t.y = ny; } } if (t.st && !t.st.slowT) { t.st.slowT = 0.3; t.st.slowMax = 0.3; t.st.slowAmt = 0.3; } }
    }
    if (!e.bit && e.t >= 3.9) {
      e.bit = true; g.sfx('impact', 1); g.shake(10); g.fx('ring', e.x, e.y, { r: R, col: '#bfe9ff', life: 0.5, w: 8 }); g.fx('ring', e.x, e.y, { r: 110, col: '#ffffff', life: 0.35, w: 7 }); g.fx('burst', e.x, e.y, { col: '#9fdcff', n: 26, life: 0.8 });
      for (const t of INV.foes(g, f, e.x, e.y, R)) { const d = dist(t, e), a = Math.atan2(t.y - e.y, t.x - e.x), close = d <= 110 + t.r; INV.strike(g, f, e, t, close ? 90 : 35, { key: 'c', dx: Math.cos(a), dy: Math.sin(a), force: close ? 120 : 60, stun: close ? 0.4 : 0, col: '#bfe9ff' }); }
    }
    return true;
  }
  // N5 : roi des profondeurs (chasse, rupture, grand engloutissement)
  function upd5(g, e, dt) {
    const f = e.f, R = e.P.R; e.t += dt; if (e.t >= e.P.life || !f.alive) return false;
    if (e.t < 3.2) { e.ph = 1; chase(g, e, f, dt, 280, R); if (Math.random() < 0.5) g.fx('burst', e.fin.x, e.fin.y, { col: '#cfeeff', n: 1, life: 0.3 }); }
    else if (e.t < 5.3) {
      e.ph = 2;
      if (!e.rupt) { e.rupt = true; g.sfx('wall'); const foes = INV.foes(g, f, e.x, e.y, R).sort(() => Math.random() - 0.5);
        for (let i = 0; i < 5; i++) { const t = foes[i % Math.max(1, foes.length)]; const a = Math.random() * PI2, d = Math.random() * R * 0.8; const x = t && i < Math.max(2, foes.length) ? t.x + rnd(-25, 25) : e.x + Math.cos(a) * d, y = t && i < Math.max(2, foes.length) ? t.y + rnd(-25, 25) : e.y + Math.sin(a) * d; jaw(g, f, x, y, { R: 38, s: 1.05, tel: 0.7 + i * 0.12, kind: 'bite', dmg: 42, hitR: 58, force: 220, stun: 0.3, pop: true }); } }
    } else {
      e.ph = 3;
      if (!e.big) { e.big = { t: 0, bit: false }; g.sfx('wall'); g.fx('ring', e.x, e.y, { r: 140, col: '#6cc8ff', life: 0.6, w: 8 }); }
      const b = e.big; b.t += dt;
      if (!b.bit && b.t >= 1.3) { b.bit = true; g.sfx('impact', 1); g.shake(14);
        g.fx('ring', e.x, e.y, { r: 130, col: '#ffffff', life: 0.45, w: 9 }); g.fx('ring', e.x, e.y, { r: 250, col: '#bfe9ff', life: 0.7, w: 8 }); g.fx('burst', e.x, e.y, { col: '#9fdcff', n: 30, life: 0.9 });
        for (const t of INV.foes(g, f, e.x, e.y, 250)) { const d = dist(t, e), a = Math.atan2(t.y - e.y, t.x - e.x); INV.strike(g, f, e, t, d <= 140 + t.r ? 80 : 55, { key: 'g', dx: Math.cos(a), dy: Math.sin(a), force: 520, stun: 0.8, pop: true, col: '#bfe9ff' }); } }
    }
    return true;
  }

  function ground(c, e, time) {
    const R = e.P.R, L = e.L, a = clamp(e.t / 0.3, 0, 1) * (e.t > e.P.life - 0.5 ? clamp((e.P.life - e.t) / 0.5, 0, 1) : 1);
    const gr = L === 2 ? 1 : clamp(e.t / 0.9, 0.05, 1);
    IA.puddle(c, e.x, e.y, R * (L === 2 ? clamp(0.5 + e.t * 2, 0.5, 1) : gr), a, time, L >= 4);
    if (L === 4 && e.t > 1.2 && e.t < 4.1) { // tourbillon
      c.save(); c.translate(e.x, e.y); c.globalAlpha = a * 0.75; c.strokeStyle = '#e6f8ff'; c.lineWidth = 2.5; c.lineCap = 'round';
      for (let k = 0; k < 4; k++) { c.beginPath(); for (let i = 0; i <= 26; i++) { const u = i / 26, an = k * 1.571 + u * 5 - time * 4.5, rr = R * (0.12 + 0.82 * (1 - u)); const px = Math.cos(an) * rr, py = Math.sin(an) * rr * 0.72; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); }
      c.restore();
    }
    if (L === 5 && e.t >= 3.2) { // fissures aquatiques de la rupture
      c.save(); c.translate(e.x, e.y); c.globalAlpha = a * 0.5; c.strokeStyle = '#06284e'; c.lineWidth = 3; for (let k = 0; k < 6; k++) { const an = k * 1.047 + 0.3; c.beginPath(); c.moveTo(Math.cos(an) * 40, Math.sin(an) * 30); c.lineTo(Math.cos(an) * R * 0.95, Math.sin(an) * R * 0.68); c.stroke(); } c.restore();
    }
    if (L === 2 && e.mode !== 'bite') { if (e.mode === 'tel') { c.save(); c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 2; const u = (e.mt / e.P.tel); c.beginPath(); c.ellipse(e.fin.x, e.fin.y, 52 * (1 - u * 0.5), 32 * (1 - u * 0.5), 0, 0, PI2); c.stroke(); c.restore(); } }
    // la nageoire (N2 et N5 chasse) : visible, avec sillage
    const finOn = (L === 2 && (e.mode === 'seek' || e.mode === 'tel')) || (L === 5 && e.t < 3.2);
    if (finOn) { IA.fin(c, e.fin.x, e.fin.y, L === 5 ? 1.6 : 1.0, e.face, time); }
  }
  function top(c, e, time) {
    const L = e.L;
    if (L === 2 && e.mode === 'bite') { const u = e.mt, rise = u < 0.2 ? ease(u / 0.2) : u > 0.6 ? 1 - ease(clamp((u - 0.6) / 0.3, 0, 1)) : 1, open = u < 0.18 ? 0 : u < 0.45 ? 1 : clamp(1 - (u - 0.45) / 0.12, 0, 1); IA.shark(c, e.fin.x, e.fin.y, 1.1, e.face, rise, open, time, 0); }
    if (L === 4) { const u = e.t; let rise = 0, open = 0; if (u > 0.9 && u < 5.6) { rise = u < 1.5 ? ease((u - 0.9) / 0.6) : u > 4.6 ? 1 - ease(clamp((u - 4.6) / 0.9, 0, 1)) : 1; open = u < 3.9 ? clamp(0.55 + Math.sin(time * 3) * 0.15 + (u - 1.5) * 0.15, 0, 1) : u < 4.2 ? 1 - ease((u - 3.9) / 0.15) * 1 : 0; } IA.shark(c, e.x, e.y, 2.5, 1, rise, open, time, Math.sin(time * 1.2) * 0.04); }
    if (L === 5 && e.big) { const u = e.big.t, rise = u < 0.7 ? ease(u / 0.7) : u > 2.0 ? 1 - ease(clamp((u - 2.0) / 0.7, 0, 1)) : 1, open = u < 1.2 ? 0.8 : u < 1.45 ? 1 : clamp(1 - (u - 1.45) / 0.2, 0, 1); const sw = u > 1.3 ? Math.sin((u - 1.3) * 14) * 0.35 : 0; IA.shark(c, e.x, e.y, 3.1, 1, rise, open, time, sw); }
  }

  // N3 : cercle des requins
  function circle(g, f, aim) {
    const fo = INV.nearest(g, f, 330), c0 = zoneCenter(g, f, aim), tg = [];
    for (const t of fo) if (tg.length < 3 && tg.every(q => dist(q, t) > 40)) tg.push(t);
    const spots = [];
    for (let i = 0; i < 3; i++) {
      const t = tg[i]; if (t) { spots.push({ x: t.x, y: t.y, t: t }); continue; }
      const a = i * (PI2 / 3) + Math.random(), d = 70; spots.push({ x: c0.x + Math.cos(a) * d, y: c0.y + Math.sin(a) * d, t: tg[0] || null });
    }
    const K = [{ kind: 'bite', dmg: 28, hitR: 58, force: 120 }, { kind: 'ram', dmg: 24, hitR: 62, force: 380 }, { kind: 'spin', dmg: 22, hitR: 110, force: 480 }];
    spots.forEach(function (s, i) { jaw(g, f, s.x, s.y, Object.assign({ R: 62, s: 1.35, tel: 0.55 + i * 0.6, tg: i === 0 ? s.t : null }, K[i])); });
    g.sfx('wall'); return true;
  }

  WB.INVC.shark = function (g, f, L, aim) {
    f.armT = 0.35;
    if (L === 1) {
      const t = INV.nearest(g, f, 360)[0], p = t || { x: f.x + aim.x * 110, y: f.y + aim.y * 110 };
      g.sfx('wall'); jaw(g, f, p.x, p.y, { R: 34, s: 0.8, tel: 0.65, kind: 'bite', dmg: 30, hitR: 62, force: 0, slow: { dur: 2.5, amt: 0.3 }, tg: t });
      return true;
    }
    if (L === 3) return circle(g, f, aim);
    return zone(g, f, L, aim);
  };
})(window.WB);
