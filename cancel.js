// ANNULATION : aura automatique de neutralisation + bombes évolutives (niveaux 1 à 5)
(function (WB) {
  'use strict';
  const PI2 = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ---------- aura ----------
  // div : division des dégâts adverses, weak : affaiblissement supplémentaire des dégâts de capacités, cdSlow : recharge plus lente,
  // cancel : capacités impossibles à lancer, slow : ralentissement, R : rayon, pulse : petits dégâts périodiques
  const AURA = {
    1: { R: 135, div: 2, weak: 0.5, cdSlow: 0.5, cancel: false, slow: 0.10, pulse: 2 },
    2: { R: 155, div: 3, weak: 0.7, cdSlow: 0.65, cancel: false, slow: 0.20, pulse: 2 },
    3: { R: 175, div: 4, weak: 0.85, cdSlow: 0.8, cancel: false, slow: 0.30, pulse: 3 },
    4: { R: 195, div: 4, weak: 0.9, cdSlow: 1, cancel: true, slow: 0.40, pulse: 3 },
    5: { R: 245, div: 4, weak: 0.95, cdSlow: 1, cancel: true, slow: 0.50, pulse: 4 }
  };
  const FADE_IN = 4, FADE_OUT = 0.7, PULSE_T = 1.2;

  // ---------- bombes ----------
  // gen 0 = bombe principale, 1 = secondaires, 2 = finales (L5 : 0 giga, 1 secondaires, 2 finales)
  const BOMB = {
    1: { rate: 0.9, gens: [{ R: 72, D: 30 }] },
    2: { rate: 1.1, n: [3], gens: [{ R: 62, D: 16 }, { R: 56, D: 14 }] },
    3: { rate: 1.3, n: [4, 2], gens: [{ R: 60, D: 14 }, { R: 52, D: 11 }, { R: 46, D: 9 }] },
    4: { rate: 1.5, n: [5, 3], gens: [{ R: 60, D: 14 }, { R: 52, D: 11 }, { R: 44, D: 9 }] },
    5: { rate: 2.2, n: [5, 2], gens: [{ R: 125, D: 42 }, { R: 82, D: 22 }, { R: 66, D: 16 }], bounces: 3 }
  };
  const GRAV = 900, REST = 0.6, DAMP = 0.88;
  const bounceTime = (vz0, n) => { let t = 0, v = vz0; for (let k = 0; k <= n; k++) { t += 2 * v / GRAV; v *= REST; } return t; };

  function lvlOf(f) { let L = 0; for (const ab of f.slots) if (ab && ab.id === 'cancel' && ab.lvl > L) L = ab.lvl; return L; }

  // ---------- lancer ----------
  function newChain(g, f, L) { return { id: (g.__cch = (g.__cch || 0) + 1), owner: f, L: L, hit: new Map(), boom: [0, 0, 0], bounces: [] }; }
  function spawnBomb(g, o) {
    const b = Object.assign({ z: 14, vz: 0, vx: 0, vy: 0, bn: 0, fuse: -1, life: 8, spin: 0, lx: o.x, ly: o.y, dead: false }, o);
    (g.cbombs || (g.cbombs = [])).push(b); return b;
  }
  // lance une bombe vers (tx,ty) ; arc simple (niveaux sans rebond) ou rebonds (niveau 5)
  function toss(g, f, L, gen, chain, x, y, tx, ty, bounce) {
    const dx = tx - x, dy = ty - y, d = Math.hypot(dx, dy) || 1;
    let vz, T;
    if (bounce) { vz = gen === 0 ? 330 : gen === 1 ? 300 : 250; T = bounceTime(vz, BOMB[5].bounces); }
    else { vz = gen === 0 ? 300 : 260; T = 2 * vz / GRAV; }
    return spawnBomb(g, { x: x, y: y, z: 14, vz: vz, vx: dx / d * d / T, vy: dy / d * d / T, gen: gen, L: L, owner: f, chain: chain, maxB: bounce ? BOMB[5].bounces : 0 });
  }
  function castBomb(f, ab, aim) {
    const g = WB.G, L = ab.lvl; if (f.cnCd > 0) return false;
    let d = aim.target && aim.target.alive ? dist(f, aim.target) : 150 + 200 * clamp(aim.m == null ? 0.7 : aim.m, 0.3, 1);
    d = clamp(d, L >= 5 ? 170 : 110, 440);
    const a = Math.atan2(aim.y, aim.x), tx = f.x + Math.cos(a) * d, ty = f.y + Math.sin(a) * d;
    const chain = newChain(g, f, L);
    const sx = f.x + Math.cos(a) * 18, sy = f.y + Math.sin(a) * 18;
    toss(g, f, L, 0, chain, W_ok(g, sx, sy) ? sx : f.x, W_ok(g, sx, sy) ? sy : f.y, tx, ty, L >= 5);
    f.cnCd = BOMB[L].rate; g.sfx('swing');
  }
  function W_ok(g, x, y) { return !g.world.solidAt(x, y); }

  // ---------- explosion et fragmentation ----------
  function explode(g, b) {
    if (b.dead) return; b.dead = true;
    const L = b.L, P = BOMB[L], G0 = P.gens[b.gen], ch = b.chain, f = b.owner, pt = { x: b.x, y: b.y, team: f.team, r: 10, st: {} };
    ch.boom[b.gen]++; if (b.gen > 0 || L < 5 || true) ch.bounces.push({ gen: b.gen, bn: b.bn });
    const giga = L === 5 && b.gen === 0;
    for (const t of g.F) {
      if (!t.alive || t.team === f.team || t.ghost || (t.st && t.st.jump)) continue;
      const d = dist(b, t); if (d > G0.R + t.r) continue;
      if (g.roomBlock(pt, t)) continue;
      const last = ch.hit.get(t); if (last != null && g.t - last < 0.12) continue; // pas de double dégât au même instant dans une chaîne
      ch.hit.set(t, g.t);
      const k = 1 - 0.45 * clamp(d / (G0.R + t.r), 0, 1);
      g.damage(t, G0.D * k, f, 'cancelbomb');
      if (t.alive) { const a = Math.atan2(t.y - b.y, t.x - b.x); g.knock(t, Math.cos(a), Math.sin(a), giga ? 320 : b.gen === 0 ? 180 : 110); }
    }
    for (const tu of g.turrets) if (tu.owner && tu.owner.team !== f.team && dist(b, tu) < G0.R + 18) { tu.hp -= G0.D; if (tu.hp <= 0) tu.life = 0; }
    // effets
    const col = giga ? '#d6a8ff' : '#b06aff';
    g.fx('ring', b.x, b.y, { r: G0.R, col: col, life: giga ? 0.7 : 0.4, w: giga ? 12 : 5 });
    g.fx('burst', b.x, b.y, { col: '#7a3ad8', n: giga ? 40 : b.gen === 0 ? 16 : 8, life: giga ? 0.9 : 0.5 });
    if (giga || b.gen === 0) g.fx('boom', b.x, b.y, { life: giga ? 0.8 : 0.5 });
    if (giga) { g.fx('ring', b.x, b.y, { r: G0.R * 1.5, col: '#2a0a44', life: 0.9, w: 20 }); g.shake(9); }
    if (g.t - (g.__cnSfx || -9) > 0.07) { g.__cnSfx = g.t; g.sfx('boom', giga ? 1 : b.gen === 0 ? 0.7 : 0.35); }
    // fragmentation : s'arrête après la dernière génération
    if (b.gen < P.gens.length - 1) {
      const n = P.n[b.gen], base = rnd(0, PI2), bounce = L >= 5, sx = b.lx, sy = b.ly;
      for (let i = 0; i < n; i++) {
        const a = base + i * PI2 / n + rnd(-0.25, 0.25);
        const d = bounce ? (b.gen === 0 ? rnd(180, 270) : rnd(110, 170)) : (b.gen === 0 ? rnd(110, 170) : rnd(80, 130));
        let tx = sx + Math.cos(a) * d, ty = sy + Math.sin(a) * d;
        // ne pas viser à travers un mur : on raccourcit
        for (let s = 0; s < 6 && g.world.solidAt(tx, ty); s++) { tx = sx + (tx - sx) * 0.7; ty = sy + (ty - sy) * 0.7; }
        toss(g, f, L, b.gen + 1, ch, sx, sy, tx, ty, bounce);
      }
    }
  }

  // ---------- mise à jour des bombes ----------
  function updateBombs(g, dt) {
    const arr = g.cbombs; if (!arr || !arr.length) return;
    const W = g.world;
    for (let i = 0; i < arr.length; i++) {
      const b = arr[i]; if (b.dead) continue;
      b.life -= dt; b.spin += dt * 6;
      if (b.life <= 0) { explode(g, b); continue; }
      if (b.fuse >= 0) { b.fuse -= dt; if (b.fuse <= 0) explode(g, b); continue; }
      const ox = b.x, oy = b.y;
      b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.vz -= GRAV * dt;
      if (W.solidAt(b.x, b.y)) {
        if (b.maxB > 0) { // rebond contre un mur
          const sx = W.solidAt(b.x, oy), sy = W.solidAt(ox, b.y);
          if (sx && !sy) b.vx = -b.vx * 0.7; else if (sy && !sx) b.vy = -b.vy * 0.7; else { b.vx = -b.vx * 0.7; b.vy = -b.vy * 0.7; }
          b.x = ox; b.y = oy;
        } else { b.x = b.lx; b.y = b.ly; explode(g, b); continue; }
      } else { b.lx = b.x; b.ly = b.y; }
      // contact avec un adversaire en vol (bombes sans rebond)
      if (b.maxB === 0 && b.z < 45) {
        let hit = false;
        for (const t of g.F) { if (t.alive && t.team !== b.owner.team && !t.ghost && !(t.st && t.st.jump) && dist(b, t) < t.r + 9 && !g.roomBlock({ x: b.x, y: b.y, team: b.owner.team, r: 5, st: {} }, t)) { hit = true; break; } }
        if (hit) { explode(g, b); continue; }
      }
      if (b.z <= 0) {
        const vi = -b.vz; b.z = 0;
        if (b.maxB > 0) {
          if (b.bn < b.maxB) { b.bn++; b.vz = vi * REST; b.vx *= DAMP; b.vy *= DAMP; g.fx('burst', b.x, b.y, { col: '#caa0ff', n: 5, life: 0.3 }); g.fx('ring', b.x, b.y, { r: b.gen === 0 ? 40 : 22, col: '#a070ff', life: 0.25, w: 3 }); if (b.gen === 0) g.shake(3); }
          else explode(g, b);
        } else if (b.gen === 0) explode(g, b);
        else { b.vx = b.vy = b.vz = 0; b.fuse = 0.25; } // les fragments explosent après un court délai
      }
    }
    for (let i = arr.length - 1; i >= 0; i--) if (arr[i].dead) arr.splice(i, 1);
    if (arr.length > 160) arr.splice(0, arr.length - 160);
  }

  // ---------- aura : mise à jour ----------
  function updateAura(g, dt) {
    const W = g.world;
    for (const t of g.F) { t.__cnIn = false; if (t.cnCd > 0) t.cnCd -= dt; }
    for (const f of g.F) {
      if (!f.alive || f.ghost) { if (f.cnAura) f.cnAura = null; continue; }
      const L = lvlOf(f); if (!L) { f.cnAura = null; continue; }
      const P = AURA[L]; f.cnAura = { L: L, R: P.R, pulse: (f.cnAura ? f.cnAura.pulse : PULSE_T) - dt };
      const doPulse = f.cnAura.pulse <= 0; if (doPulse) { f.cnAura.pulse = PULSE_T; g.fx('ring', f.x, f.y, { r: P.R, col: '#8a4aff', life: 0.5, w: 4 }); }
      const pt = { x: f.x, y: f.y, team: f.team, r: 10, st: {} };
      for (const t of g.F) {
        if (!t.alive || t.team === f.team || t.ghost || (t.st && t.st.jump)) continue;
        if (dist(f, t) > P.R + t.r) continue;
        if (g.roomBlock(pt, t)) continue;
        t.__cnIn = true;
        if (!t.cn || L >= t.cn.L || t.cn.k <= 0.05) { const k = t.cn ? t.cn.k : 0; t.cn = { L: L, k: k, src: f }; }
        if (doPulse) g.damage(t, P.pulse, f, 'cancel', { dot: true, noRedirect: true, cnAura: true });
      }
    }
    for (const t of g.F) {
      if (!t.cn) continue;
      t.cn.k = clamp(t.cn.k + (t.__cnIn ? FADE_IN : -FADE_OUT) * dt, 0, 1);
      if (t.cn.k <= 0 && !t.__cnIn) t.cn = null;
    }
  }

  // ---------- accroches moteur ----------
  function install(g) {
    if (g.__cnInstalled) return; g.__cnInstalled = true;
    const dmg0 = g.damage, can0 = g.canCast;
    g.damage = function (t, amt, src, ab, opt) {
      if (src && src.cn && src.cn.k > 0 && amt > 0 && !(opt && opt.cnAura)) {
        const c = src.cn, P = AURA[c.L], k = c.k;
        amt /= 1 + (P.div - 1) * k;
        const isAbility = ab && ab !== 'bomb' && ab !== 'bombe';
        if (isAbility) amt *= 1 - P.weak * k;
        if (amt <= 0.05) return;
      }
      return dmg0.call(g, t, amt, src, ab, opt);
    };
    g.canCast = function (f) {
      if (f.cn && f.cn.k > 0.5 && AURA[f.cn.L].cancel) return false;
      return can0.call(g, f);
    };
  }
  WB.cnRate = f => (f && f.cn && f.cn.k > 0 && AURA[f.cn.L].cdSlow < 1) ? 1 - (1 - AURA[f.cn.L].cdSlow) * f.cn.k : 1;
  WB.cnSlow = f => (f && f.cn && f.cn.k > 0) ? AURA[f.cn.L].slow * f.cn.k : 0;

  // les bombes d'Annulation ne consomment jamais de charge
  const spend0 = WB.spendCharge;
  WB.spendCharge = function (f, ab) { if (ab && ab.id === 'cancel') { ab.n = WB.maxCharges(ab); return; } return spend0.apply(this, arguments); };

  // ---------- définition de la capacité ----------
  if (WB.ABIL && WB.ABIL.cancel) {
    const d = WB.ABIL.cancel;
    d.name = 'Annulation'; d.col = '#9a5aff'; d.type = 'aim'; d.cd = L => 1; d.range = L => 440;
    d.desc = 'Aura violette automatique qui ralentit et affaiblit les ennemis proches, puis annule leurs capacités. Le bouton lance des bombes qui se fragmentent, jusqu\'à la giga bombe.';
    d.cast = castBomb;
    d.ai = { max: L => 430, min: 90 };
  }
  WB.GUIDE = WB.GUIDE || {};
  WB.GUIDE.cancel = ['Kiwi', 'Une aura qui neutralise les ennemis proches, et des bombes illimitées qui se fragmentent.', [
    'Aura légère : dégâts adverses divisés par 2, capacités affaiblies de 50 %, ralentissement de 10 %. Bombe simple.',
    'Aura plus intense : dégâts divisés par 3, ralentissement de 20 %. Bombe qui libère 3 bombes secondaires.',
    'Aura ondulante : dégâts divisés par 4, ralentissement de 30 %. 4 secondaires, chacune libère 2 bombes finales.',
    'Zone de suppression : capacités adverses annulées, ralentissement de 40 %. 5 secondaires, chacune libère 3 finales.',
    'Zone de néant : capacités annulées, ralentissement de 50 %. Giga bombe à trois rebonds, 5 secondaires qui rebondissent, 10 finales.']];

  // ---------- dessin ----------
  function drawAura(ctx, g, time) {
    const pl = g.player;
    for (const f of g.F) {
      const A = f.cnAura; if (!f.alive || !A) continue;
      if (pl && f !== pl && g.roomBlock(pl, f)) continue;
      const L = A.L, R = A.R, x = f.x, y = f.y;
      ctx.save(); ctx.translate(x, y);
      const gr = ctx.createRadialGradient(0, 0, R * (L >= 5 ? 0.05 : 0.3), 0, 0, R);
      if (L >= 5) { gr.addColorStop(0, 'rgba(8,0,18,0.62)'); gr.addColorStop(0.7, 'rgba(40,10,80,0.35)'); gr.addColorStop(1, 'rgba(140,70,255,0.28)'); }
      else if (L === 4) { gr.addColorStop(0, 'rgba(20,4,40,0.28)'); gr.addColorStop(1, 'rgba(120,50,230,0.38)'); }
      else { const a = 0.06 + 0.05 * L; gr.addColorStop(0, 'rgba(60,20,110,' + (a * 0.4) + ')'); gr.addColorStop(1, 'rgba(130,70,230,' + (a * 2.2) + ')'); }
      ctx.fillStyle = gr; ctx.beginPath();
      if (L >= 3) { for (let i = 0; i <= 48; i++) { const a = i / 48 * PI2, r = R * (1 + 0.025 * Math.sin(a * 7 + time * 3) * (L - 2)); i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); }
      else ctx.arc(0, 0, R, 0, PI2);
      ctx.fill();
      ctx.lineWidth = 2 + L * 0.6; ctx.strokeStyle = 'rgba(190,140,255,' + (0.35 + 0.08 * L) + ')'; ctx.stroke();
      if (L >= 2) { ctx.setLineDash([14, 12]); ctx.lineDashOffset = -time * 30; ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(10,0,24,0.7)'; ctx.beginPath(); ctx.arc(0, 0, R * 0.8, 0, PI2); ctx.stroke(); ctx.setLineDash([]); }
      if (L >= 3) { // particules qui montent
        ctx.fillStyle = 'rgba(210,170,255,0.8)';
        for (let i = 0; i < 14; i++) { const a = i * 2.4 + time * 0.5, rr = R * (0.25 + 0.7 * ((i * 0.37 + time * 0.2) % 1)); ctx.beginPath(); ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, 2 + (i % 3), 0, PI2); ctx.fill(); }
      }
      if (L >= 4) { // zone de suppression : anneaux qui se resserrent + trame
        ctx.strokeStyle = 'rgba(200,150,255,0.35)'; ctx.lineWidth = 2;
        for (let k = 0; k < 3; k++) { const u = (time * 0.5 + k / 3) % 1; ctx.globalAlpha = 1 - u; ctx.beginPath(); ctx.arc(0, 0, R * (1 - u * 0.85), 0, PI2); ctx.stroke(); }
        ctx.globalAlpha = 0.25; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + time * 0.3; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R); } ctx.stroke(); ctx.globalAlpha = 1;
      }
      if (L >= 5) { // néant : spirales et distorsions
        ctx.strokeStyle = 'rgba(230,200,255,0.4)'; ctx.lineWidth = 3;
        for (let s = 0; s < 3; s++) { ctx.beginPath(); for (let i = 0; i <= 30; i++) { const u = i / 30, a = s * PI2 / 3 + u * 3.2 + time * 0.8, r = R * (0.1 + 0.88 * u); i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.stroke(); }
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(160,100,255,0.35)';
        for (let k = 1; k <= 3; k++) { ctx.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * PI2, r = R * k / 4 * (1 + 0.06 * Math.sin(a * 5 - time * 2 + k)); i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.stroke(); }
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 10; i++) { const a = i * 1.7 + time * 0.2, rr = R * (0.2 + 0.75 * ((i * 0.31) % 1)); ctx.fillRect(Math.cos(a) * rr, Math.sin(a) * rr, 2, 2); }
      }
      ctx.restore();
    }
    // marque sur les ennemis affectés
    for (const t of g.F) {
      if (!t.cn || !t.alive || t.cn.k <= 0.05) continue;
      if (pl && t !== pl && g.hiddenFor(pl, t)) continue;
      const k = t.cn.k, P = AURA[t.cn.L];
      ctx.save(); ctx.globalAlpha = 0.65 * k; ctx.strokeStyle = '#b080ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(t.x, t.y + t.r * 0.7, t.r + 6, (t.r + 6) * 0.4, 0, 0, PI2); ctx.stroke();
      if (P.cancel) { const hy = t.y - t.r * (t.scale || 1) - 24; ctx.globalAlpha = k; ctx.strokeStyle = '#d6a8ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(t.x, hy, 8, 0, PI2); ctx.moveTo(t.x - 6, hy + 6); ctx.lineTo(t.x + 6, hy - 6); ctx.stroke(); }
      ctx.restore();
    }
  }
  function drawBomb(ctx, b, time) {
    const L = b.L, giga = L === 5 && b.gen === 0, x = b.x, y = b.y - b.z;
    const sc = L === 5 ? (b.gen === 0 ? 2.3 : b.gen === 1 ? 1.2 : 0.85) : b.gen === 0 ? 1 : b.gen === 1 ? 0.85 : 0.7;
    const r = (L === 1 ? 9 : L === 2 ? 10 : 11) * sc;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,' + (0.28 - Math.min(0.15, b.z / 400)) + ')'; ctx.beginPath(); ctx.ellipse(b.x, b.y + 4, r * (1 - Math.min(0.4, b.z / 250)), r * 0.4, 0, 0, PI2); ctx.fill();
    ctx.translate(x, y);
    if (L === 5) {
      const pulse = 0.7 + 0.3 * Math.sin(time * 10 + b.spin);
      const gl = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 2.2); gl.addColorStop(0, 'rgba(190,120,255,' + (0.5 * pulse) + ')'); gl.addColorStop(1, 'rgba(120,60,255,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, r * 2.2, 0, PI2); ctx.fill();
      const body = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r); body.addColorStop(0, '#6a3aa8'); body.addColorStop(1, '#0c0418'); ctx.fillStyle = body; ctx.beginPath(); ctx.arc(0, 0, r, 0, PI2); ctx.fill();
      ctx.strokeStyle = '#d6a8ff'; ctx.lineWidth = Math.max(1.5, r * 0.12); ctx.beginPath(); ctx.arc(0, 0, r * 0.98, 0, PI2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,' + (0.7 * pulse) + ')'; ctx.beginPath(); ctx.arc(0, 0, r * 0.35, 0, PI2); ctx.fill();
      if (giga) { ctx.strokeStyle = 'rgba(220,180,255,0.8)'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate(b.spin * 0.4 + i * 1.05); ctx.beginPath(); ctx.ellipse(0, 0, r * 1.5, r * 0.45, 0, 0, PI2); ctx.stroke(); ctx.restore(); } ctx.fillStyle = '#d6a8ff'; for (let i = 0; i < 8; i++) { const a = i * PI2 / 8 + b.spin * 0.3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(Math.cos(a + 0.12) * r * 1.35, Math.sin(a + 0.12) * r * 1.35); ctx.lineTo(Math.cos(a - 0.12) * r * 1.35, Math.sin(a - 0.12) * r * 1.35); ctx.fill(); } }
    } else {
      const cols = { 1: ['#7a7f96', '#2a2e3e'], 2: ['#a070e8', '#3a1a68'], 3: ['#5a4a88', '#14102a'], 4: ['#d84a9a', '#4a0a30'] }[L];
      const body = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r); body.addColorStop(0, cols[0]); body.addColorStop(1, cols[1]); ctx.fillStyle = body; ctx.beginPath(); ctx.arc(0, 0, r, 0, PI2); ctx.fill();
      if (L === 2) { ctx.fillStyle = '#ffe27a'; for (let i = 0; i < 3; i++) { const a = i * PI2 / 3 + b.spin * 0.3; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.16, 0, PI2); ctx.fill(); } }
      if (L === 3) { ctx.strokeStyle = '#ff9a3c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.35, b.spin * 0.2, 0, PI2); ctx.stroke(); }
      if (L === 4) { ctx.fillStyle = '#ffb0d8'; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + b.spin * 0.3; ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.2) * r, Math.sin(a - 0.2) * r); ctx.lineTo(Math.cos(a) * r * 1.4, Math.sin(a) * r * 1.4); ctx.lineTo(Math.cos(a + 0.2) * r, Math.sin(a + 0.2) * r); ctx.fill(); } }
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.35, r * 0.25, 0, PI2); ctx.fill();
      if (b.fuse >= 0 && Math.floor(time * 18) % 2 === 0) { ctx.fillStyle = 'rgba(255,120,120,0.7)'; ctx.beginPath(); ctx.arc(0, 0, r, 0, PI2); ctx.fill(); }
      ctx.fillStyle = '#ffcf5a'; ctx.beginPath(); ctx.arc(r * 0.4, -r * 1.0, 2 + Math.sin(time * 30) * 0.8, 0, PI2); ctx.fill();
    }
    ctx.restore();
  }
  WB.drawCancelBombs = function (ctx, g, time) { const a = g.cbombs; if (!a) return; for (const b of a) if (!b.dead) drawBomb(ctx, b, time); };

  // ---------- chaînage ----------
  const upd = WB.updateHands, drw = WB.drawHands, trails = WB.drawTrails;
  WB.updateHands = function (dt) { upd(dt); const g = WB.G; install(g); updateAura(g, dt); updateBombs(g, dt); };
  WB.drawHands = function (ctx, g, time) { drw(ctx, g, time); WB.drawCancelBombs(ctx, g, time); };
  WB.drawTrails = function (c, g, time) { trails(c, g, time); drawAura(c, g, time); };
  WB.CANCEL = { AURA: AURA, BOMB: BOMB, explode: explode, spawn: spawnBomb, newChain: newChain };
})(window.WB);
