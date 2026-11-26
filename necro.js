'use strict';
// Nécromancie (5 niveaux). Squelettes, chevalier et squelettes de joueurs = combattants de type 'golem' (cl = données),
// captures = mécanisme 'thrall' existant, avec marque de propriété et bonus. Temple, flèches, vagues = entités propres.
(function (WB) {
  const PI2 = Math.PI * 2, G = () => WB.G, CU = WB.CU, dist = CU.dist, A = WB.ABIL;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const P = {
    skHp: L => 40 + 8 * L, skDmg: L => 10 + 2 * L, skLife: 18,
    kHp: 600, kDmg: 38, kLife: 16, kZone: 340, kLeash: 190, kSwing: 135,
    capT: { 3: 8, 4: 16 }, hpMul: 1.5, dmgMul: 1.6, drain: 0.025, markT: 20,
    tempT: 12, tempR: 340, tempSk: 5, tempCap: 36, tempLife: 10, formT: 15, formScale: 1.7, swingR: 170, swingDmg: 40, waveDmg: 28, possessT: 7, possessMax: 4
  };
  WB.NECRO_P = P;
  const NS = f => f.necS || (f.necS = { skels: [], tsk: [], knight: null, temple: null, form: null });
  function kb(g, t, f, force) { const d = dist(t, f) || 1; g.knock(t, (t.x - f.x) / d, (t.y - f.y) / d, force); }
  const isFighter = t => t.kind === 'player' || t.kind === 'bot';

  // ---------- invocations ----------
  function skelStats(L) { return { hp: P.skHp(L), dmg: P.skDmg(L) }; }
  function mkSkel(g, f, L, x, y, life, roam, o) {
    const st = skelStats(L), q = g.world.nearFloor(x, y, 3);
    const s = g.mkClone(f, { name: 'Squelette', x: q.x, y: q.y, hp: st.hp, r: 15, speed: 240, life: life, cl: { type: 'skel', skel: true, own: true, roam: !!roam, age: 0, atk: 0, sw: 0, dmg: o && o.dmg || st.dmg } });
    g.fx('burst', q.x, q.y, { col: '#9affc8', n: 8, life: 0.45 }); return s;
  }
  function summonSkels(g, f, L) {
    const s = NS(f); s.skels = s.skels.filter(x => x.alive);
    for (let i = 0; i < 5; i++) {
      while (s.skels.length >= 15) CU.silentRemove(s.skels.shift());
      const a = i / 5 * PI2 + Math.random() * 0.5, q = CU.ringPos(f, a, 70);
      s.skels.push(mkSkel(g, f, L, q.x, q.y, P.skLife, false));
    }
    g.fx('ring', f.x, f.y, { r: 90, col: '#9affc8', life: 0.6, w: 7 });
  }
  function summonKnight(g, f, L, life) {
    const s = NS(f); if (s.knight && s.knight.alive) CU.silentRemove(s.knight);
    const q = CU.ringPos(f, Math.random() * PI2, 90);
    const k = g.mkClone(f, { name: 'Roi des morts', x: q.x, y: q.y, hp: P.kHp + 60 * L, r: 34, speed: 250, life: life || P.kLife, cl: { type: 'knight', skel: true, knight: true, own: true, age: 0, atk: 0, sw: 0, tcd: 2, far: 0, tp: 0 } });
    s.knight = k; g.fx('ring', q.x, q.y, { r: 120, col: '#8affc8', life: 0.7, w: 9 }); g.fx('burst', q.x, q.y, { col: '#8affc8', n: 20, life: 0.8 }); g.shake(4); return k;
  }

  // ---------- capture (niveaux 3 et 4) et possession (niveau 5) ----------
  function capturable(g, f, t) { return t.alive && isFighter(t) && !t.thrall && t.team !== f.team && !t.ghost && !(t.st && t.st.jump) && !t.swallowed && CU.foeOk(g, f, t); }
  function capture(g, o, v, L) {
    if (!o.alive || !capturable(g, o, v)) return false;
    g.enthrall(o, v, 5); const th = v.thrall; if (!th) return false;
    th.t = th.T = P.capT[L] || 8; th.phase = 2; th.necro = true; th.L = L; th.orig = { maxhp: v.maxhp, hp: v.hp }; th.boost = P.hpMul; th.drained = 0; th.drainT = 0.5; th.dmgMul = P.dmgMul;
    v.maxhp = Math.round(v.maxhp * P.hpMul); v.hp = Math.min(v.maxhp, Math.round(v.hp * P.hpMul));
    g.text(v.x, v.y - 56, 'Âme capturée', '#9affc8', 16); return true;
  }
  function possess(g, o, v) {
    if (!capturable(g, o, v)) return false;
    const mine = o.thralls.filter(x => x.alive && x.thrall && x.thrall.necro && x.thrall.L === 5);
    if (mine.length >= P.possessMax) return false;
    g.enthrall(o, v, 9); const th = v.thrall; if (!th) return false;
    th.t = th.T = P.possessT; th.phase = 2; th.necro = true; th.L = 5; th.roam = true; th.orig = { maxhp: v.maxhp, hp: v.hp }; th.boost = 1; th.drained = 0; th.dmgMul = 1.25;
    g.text(v.x, v.y - 56, 'Possédé', '#c08aff', 16); g.fx('burst', v.x, v.y, { col: '#c08aff', n: 14, life: 0.6 }); return true;
  }
  function spawnSkelPlayer(g, o, v) {
    const th = v.thrall, hp = Math.max(40, Math.round(th.orig.maxhp * 0.6));
    const sk = g.mkClone(o, { name: v.name, x: v.x, y: v.y, hp: hp, r: v.r, speed: v.speed, life: 22, cl: { type: 'skelp', skel: true, roam: true, age: 0, big: 1.2 } });
    sk.maxhp = hp; sk.hp = hp; sk.bombs = 0; sk.slots = v.slots.filter(s => s && s.id !== 'necro' && s.id !== 'clone').map(s => WB.newAbility(s.id, s.lvl)); sk.ai.jit = 0.14; sk.ai.mode = 'fight';
    g.fx('burst', v.x, v.y, { col: '#9affc8', n: 22, life: 0.8 }); g.fx('ring', v.x, v.y, { r: 90, col: '#9affc8', life: 0.7, w: 8 }); g.text(v.x, v.y - 60, 'Guerrier squelette', '#9affc8', 16); g.shake(4);
  }
  WB.roamTarget = function (f) { const g = G(); return CU.nearestFoe(g, f, 1e6); };

  // ---------- temple et roi de la mort ----------
  function removeTemple(g, f) {
    const s = NS(f); if (s.temple) { g.necTemples = (g.necTemples || []).filter(x => x !== s.temple); s.temple = null; }
    if (s.form) endForm(g, f);
  }
  function endForm(g, f) { const s = NS(f); if (!s.form) return; f.scale = f.necScale0 || 1; f.necForm = null; s.form = null; g.fx('ring', f.x, f.y, { r: 90, col: '#c08aff', life: 0.6, w: 7 }); }
  function castTemple(g, f, L) {
    removeTemple(g, f); const s = NS(f), c = g.world.nearFloor(f.x, f.y - 150, 3);
    const q = { x: c.x, y: c.y, R: P.tempR, t: 0, T: P.tempT, owner: f, used: false, spawnT: 0, knight: false };
    g.necTemples = g.necTemples || []; g.necTemples.push(q); s.temple = q;
    f.necScale0 = f.scale || 1; f.scale = P.formScale; s.form = f.necForm = { t: 0, T: P.formT, sw: 0, wv: 0, swing: 0, ang: 0 };
    g.fx('ring', q.x, q.y, { r: P.tempR, col: '#a060ff', life: 1.0, w: 12 }); g.fx('burst', f.x, f.y, { col: '#7a3aff', n: 30, life: 0.9 }); g.shake(8); g.sfx('boom'); g.text(f.x, f.y - 90, 'ROI DE LA MORT', '#c08aff', 22);
  }
  const inTemple = (q, t) => q && dist(q, t) <= q.R;
  function kingSwing(g, f) {
    const fm = f.necForm; if (!fm) return; const R = P.swingR * (f.scale / 1.2); let hit = 0;
    fm.swing = 0.4; fm.sw = 1.1;
    g.fx('ring', f.x, f.y, { r: R, col: '#c02020', life: 0.4, w: 12 }); g.fx('ring', f.x, f.y, { r: R * 0.7, col: '#2a0a3a', life: 0.35, w: 8 }); g.fx('burst', f.x, f.y, { col: '#ff4a4a', n: 18, life: 0.5 }); g.shake(5); g.sfx('boom');
    for (const t of g.F.slice()) {
      if (!t.alive || t.team === f.team || t.ghost || (t.st && t.st.jump) || g.roomBlock(f, t) || dist(f, t) > R + t.r) continue;
      g.damage(t, P.swingDmg, f, 'necro'); kb(g, t, f, 380); hit++;
      if (t.alive && t.hp > 0 && isFighter(t) && !t.thrall) possess(g, f, t);
    }
    return hit;
  }
  function kingWave(g, f, tg) {
    const fm = f.necForm; if (!fm) return; const d = dist(f, tg) || 1; fm.wv = 2.2; fm.swing = 0.35;
    g.necE.waves.push({ x: f.x, y: f.y, dx: (tg.x - f.x) / d, dy: (tg.y - f.y) / d, life: 1.05, owner: f, hit: [], ph: 0 }); g.sfx('ab_necro');
  }

  // ---------- lancement ----------
  function nearestCapturable(g, f, maxD, aimT) {
    if (aimT && capturable(g, f, aimT) && dist(f, aimT) < maxD * 1.3) return aimT;
    let best = null, bd = maxD; for (const t of g.F) { if (!capturable(g, f, t)) continue; const d = dist(f, t); if (d < bd) { bd = d; best = t; } } return best;
  }
  function cast(f, ab, aim) {
    const g = G(), L = ab.lvl; ensure(g);
    if (L >= 5 && f.necForm) {   // pendant la transformation, l'appui déclenche une attaque de la faux sans consommer de charge
      const fm = f.necForm; if (fm.swing > 0.15) return false;
      const near = CU.nearestFoe(g, f, P.swingR * 1.3);
      if (near) kingSwing(g, f); else { const tg = CU.nearestFoe(g, f, 620); if (tg) kingWave(g, f, tg); }
      return false;
    }
    g.sfx('ab_necro');
    if (L >= 5) { castTemple(g, f, L); return true; }
    summonSkels(g, f, L);
    if (L >= 2) summonKnight(g, f, L);
    if (L >= 3) {
      const t = nearestCapturable(g, f, 560, aim && aim.target);
      if (t) { g.necE.arrows.push({ x: f.x, y: f.y, tg: t, owner: f, L: L, life: 1.6, ph: 0, a: Math.atan2(t.y - f.y, t.x - f.x) }); g.fx('burst', f.x, f.y, { col: '#9affc8', n: 10, life: 0.4 }); }
    }
    return true;
  }
  function ensure(g) { if (!g.necE) g.necE = { arrows: [], waves: [] }; }

  // ---------- mise à jour des unités ----------
  function validFoe(g, f, t) { return CU.foeOk(g, f, t); }
  function updateSkel(g, f, dt) {
    const c = f.cl, ow = f.owner;
    if (!ow || !ow.alive) { CU.silentRemove(f); return; }
    c.age += dt; c.atk -= dt; c.sw -= dt; c.scan = (c.scan || 0) - dt;
    if (!g.started || f.st.stun > 0 || f.st.frozen > 0) { f.want.x = f.want.y = 0; return; }
    if (c.scan <= 0 || !c.tg || !validFoe(g, f, c.tg)) { c.scan = 0.3; c.tg = CU.nearestFoe(g, f, c.roam ? 1e6 : 1000); }
    const t = c.tg;
    if (t) {
      const d = dist(f, t);
      if (d < f.r + t.r + 14) {
        f.want.x = f.want.y = 0; f.face.x = (t.x - f.x) / (d || 1); f.face.y = (t.y - f.y) / (d || 1);
        if (c.atk <= 0) { c.atk = 0.7; c.sw = 0.3; g.damage(t, c.dmg, ow, 'necro'); g.fx('burst', t.x, t.y, { col: '#e8e4d0', n: 4, life: 0.25 }); }
      } else CU.steer(g, f, t.x, t.y, dt);
    } else if (dist(f, ow) > 150) CU.steer(g, f, ow.x, ow.y, dt); else f.want.x = f.want.y = 0;
  }
  function knightTp(g, f, x, y) {
    const c = f.cl; g.fx('burst', f.x, f.y, { col: '#8affc8', n: 18, life: 0.6 }); g.fx('ring', f.x, f.y, { r: 70, col: '#8affc8', life: 0.4, w: 6 });
    const q = g.world.nearFloor(x, y, 3); f.x = q.x; f.y = q.y; f.vx = f.vy = 0; c.tp = 0.35;
    g.fx('burst', f.x, f.y, { col: '#8affc8', n: 18, life: 0.6 }); g.fx('ring', f.x, f.y, { r: 90, col: '#8affc8', life: 0.4, w: 7 }); g.shake(3);
  }
  function updateKnight(g, f, dt) {
    const c = f.cl, ow = f.owner;
    if (!ow || !ow.alive) { CU.silentRemove(f); return; }
    c.age += dt; c.atk -= dt; c.sw -= dt; c.tcd -= dt; c.tp -= dt;
    if (!g.started || f.st.stun > 0 || f.st.frozen > 0) { f.want.x = f.want.y = 0; return; }
    const foes = g.F.filter(t => validFoe(g, f, t) && dist(ow, t) < P.kZone);
    if (dist(f, ow) > P.kZone + 60) { knightTp(g, f, ow.x - 60, ow.y); return; }
    if (foes.length) {
      c.far = 0;
      if (!c.tg || !foes.includes(c.tg)) c.tg = foes.reduce((a, b) => dist(f, a) < dist(f, b) ? a : b);
      // téléportation d'un ennemi à l'autre autour du maître
      if (c.tcd <= 0 && (foes.length > 1 || dist(f, c.tg) > 170)) {
        const others = foes.filter(t => t !== c.tg || dist(f, t) > 170).sort((a, b) => a.hp - b.hp);
        const nx = foes.length > 1 ? (others.find(t => t !== c.tg) || others[0]) : others[0];
        if (nx) { c.tg = nx; const a = Math.atan2(ow.y - nx.y, ow.x - nx.x); knightTp(g, f, nx.x + Math.cos(a) * (nx.r + 50), nx.y + Math.sin(a) * (nx.r + 50)); c.tcd = 3.2; c.atk = 0.15; }
      }
      const d = dist(f, c.tg);
      if (d > P.kSwing * 0.7) CU.steer(g, f, c.tg.x, c.tg.y, dt); else f.want.x = f.want.y = 0;
      f.face.x = (c.tg.x - f.x) / (d || 1); f.face.y = (c.tg.y - f.y) / (d || 1);
      if (c.atk <= 0 && foes.some(t => dist(f, t) < P.kSwing + t.r)) {
        c.atk = 0.9; c.sw = 0.35; g.fx('ring', f.x, f.y, { r: P.kSwing, col: '#8affc8', life: 0.3, w: 8 }); g.shake(3);
        for (const t of foes) if (dist(f, t) < P.kSwing + t.r) { g.damage(t, P.kDmg, ow, 'necro'); kb(g, t, f, 300); }
      }
    } else {
      c.tg = null; const d = dist(f, ow);
      if (d > P.kLeash) { c.far += dt; if (c.far > 1.6) { knightTp(g, f, ow.x - 70, ow.y); c.far = 0; } else CU.steer(g, f, ow.x, ow.y, dt); }
      else { c.far = 0; f.want.x = f.want.y = 0; }
    }
  }
  function drainTick(g, f, dt) {
    const th = f.thrall; if (!th || !th.necro || th.L === 5) return;
    th.drainT -= dt; if (th.drainT > 0) return; th.drainT = 0.5;
    const o = th.owner, amt = Math.max(1, Math.round(th.orig.maxhp * P.drain)); if (!o || !o.alive || f.hp <= amt + 1) return;
    f.hp -= amt; th.drained += amt; o.hp = Math.min(o.maxhp, o.hp + amt); th.flow = 0.5;
  }

  function updateNecro(dt) {
    const g = G(); if (!g || !g.F) return; install(g); ensure(g);
    for (const f of g.F.slice()) {
      if (f.cl && f.alive && f.cl.skel && f.cl.own) { if (f.cl.knight) updateKnight(g, f, dt); else updateSkel(g, f, dt); }
      else if (f.cl && f.alive && f.cl.skel) { f.cl.age += dt; if (!f.owner || !f.owner.alive) CU.silentRemove(f); }
      if (f.thrall && f.thrall.necro && f.alive) { drainTick(g, f, dt); if (f.thrall.flow > 0) f.thrall.flow -= dt; }
    }
    const E = g.necE;
    for (const a of E.arrows) {
      a.life -= dt; a.ph += dt; if (a.life <= 0 || !a.owner.alive) { a.dead = true; continue; }
      let t = a.tg; if (!t || !capturable(g, a.owner, t)) { t = a.tg = nearestCapturable(g, a.owner, 500, null); if (!t) { a.dead = true; continue; } }
      const d = dist(a, t) || 1, sp = 880 * dt; a.a = Math.atan2(t.y - a.y, t.x - a.x); a.x += (t.x - a.x) / d * Math.min(sp, d); a.y += (t.y - a.y) / d * Math.min(sp, d);
      if (dist(a, t) < t.r + 8) { a.dead = true; g.fx('burst', t.x, t.y, { col: '#9affc8', n: 16, life: 0.6 }); g.fx('ring', t.x, t.y, { r: 60, col: '#9affc8', life: 0.5, w: 6 }); capture(g, a.owner, t, a.L); }
    }
    E.arrows = E.arrows.filter(a => !a.dead);
    for (const w of E.waves) {
      w.life -= dt; w.ph += dt; if (w.life <= 0 || !w.owner.alive) { w.dead = true; continue; }
      w.x += w.dx * 560 * dt; w.y += w.dy * 560 * dt; if (g.world.solidAt(w.x, w.y)) { w.dead = true; continue; }
      for (const t of g.F) { if (!t.alive || t.team === w.owner.team || t.ghost || (t.st && t.st.jump) || w.hit.includes(t) || g.roomBlock(w.owner, t)) continue; if (dist(w, t) < t.r + 34) { w.hit.push(t); g.damage(t, P.waveDmg, w.owner, 'necro'); g.fx('burst', t.x, t.y, { col: '#7a3aff', n: 8, life: 0.4 }); } }
    }
    E.waves = E.waves.filter(w => !w.dead);
    // temples et transformation
    for (const q of (g.necTemples || []).slice()) {
      const o = q.owner; q.t += dt;
      if (!o.alive || q.t >= q.T) { g.necTemples = g.necTemples.filter(x => x !== q); if (o.necS && o.necS.temple === q) o.necS.temple = null; g.fx('burst', q.x, q.y, { col: '#5a2a8a', n: 30, life: 1 }); continue; }
      q.spawnT -= dt; const s = NS(o);
      if (q.spawnT <= 0) {
        q.spawnT = 1; s.tsk = s.tsk.filter(x => x.alive);
        for (let i = 0; i < P.tempSk && s.tsk.length < P.tempCap; i++) { const a = Math.random() * PI2; s.tsk.push(mkSkel(g, o, 5, q.x + Math.cos(a) * 110, q.y + 60 + Math.sin(a) * 60, P.tempLife, true, { dmg: 20 })); }
        g.fx('ring', q.x, q.y + 40, { r: 150, col: '#a060ff', life: 0.5, w: 6 });
      }
      if (!q.knight && q.t >= q.T - 1.2) { q.knight = true; summonKnight(g, o, 5, P.kLife); }
      if (inTemple(q, o) && o.hp < o.maxhp && o.alive) { o.hp = Math.min(o.maxhp, o.hp + o.maxhp * 0.05 * dt); q.fxT = (q.fxT || 0) - dt; if (q.fxT <= 0) { q.fxT = 0.5; g.fx('burst', o.x, o.y, { col: '#9affc8', n: 3, life: 0.5 }); } }
    }
    for (const f of g.F) {
      const fm = f.necForm; if (!fm || !f.alive) continue;
      fm.t += dt; fm.sw -= dt; fm.wv -= dt; fm.swing -= dt;
      if (fm.t >= fm.T) { endForm(g, f); continue; }
      if (!g.started || f.st.stun > 0 || f.st.frozen > 0) continue;
      if (fm.sw <= 0 && fm.swing <= 0) { const n = CU.nearestFoe(g, f, P.swingR * 1.25); if (n) { fm.ang = Math.atan2(n.y - f.y, n.x - f.x); kingSwing(g, f); } }
      if (fm.wv <= 0 && fm.swing <= 0) { const n = CU.nearestFoe(g, f, 560); if (n && dist(f, n) > P.swingR * 1.25) kingWave(g, f, n); }
    }
    for (const f of g.F) if (f.necS && !f.alive) { removeTemple(g, f); }
  }

  // ---------- accroches moteur ----------
  function install(g) {
    if (g.__necInstalled) return; g.__necInstalled = true;
    const dmg0 = g.damage, kill0 = g.kill, rel0 = g.release;
    g.damage = function (t, amt, src, ab, opt) {
      if (src && src.thrall && src.thrall.necro && src.thrall.dmgMul && amt > 0) amt *= src.thrall.dmgMul;
      return dmg0.call(g, t, amt, src, ab, opt);
    };
    g.release = function (v) {
      const th = v.thrall, r = rel0.apply(g, arguments);
      if (th && th.necro) {
        v.maxhp = th.orig.maxhp;
        if (v.alive) v.hp = clamp(Math.round(Math.min(v.hp / (th.boost || 1), th.orig.hp - th.drained)), 1, v.maxhp);
        if (v.alive && th.L < 5 && th.owner && th.owner.alive) { v.necMark = { owner: th.owner, until: th.L >= 4 ? Infinity : g.t + P.markT }; g.text(v.x, v.y - 70, 'Marqué', '#9affc8', 14); }
      }
      return r;
    };
    g.kill = function (t, src, ab) {
      const th = t.thrall;
      if (th && th.necro && th.L === 4 && t.alive && th.owner && th.owner.alive) spawnSkelPlayer(g, th.owner, t);
      if (t.alive && !t.thrall && t.necMark && g.t < t.necMark.until && t.necMark.owner && t.necMark.owner.alive && t.necMark.owner !== t) src = t.necMark.owner;
      // temple : résurrection du nécromancien dans la zone
      if (t.alive && t.necS && t.necS.temple && !t.necS.temple.used && inTemple(t.necS.temple, t)) {
        t.necS.temple.used = true; t.hp = Math.round(t.maxhp * 0.6); t.st = { invuln: 1.8 }; t.dots = [];
        g.fx('ring', t.x, t.y, { r: 130, col: '#9affc8', life: 0.8, w: 10 }); g.fx('burst', t.x, t.y, { col: '#9affc8', n: 30, life: 0.9 }); g.text(t.x, t.y - 80, 'Résurrection', '#9affc8', 20); g.sfx('heal'); return;
      }
      const r = kill0.call(g, t, src, ab);
      if (!t.alive) { t.necMark = null; if (t.necS) removeTemple(g, t); if (t.thrall && t.thrall.necro) { t.maxhp = t.thrall.orig.maxhp; } }
      return r;
    };
  }

  // ---------- affichage ----------
  const OUT = '#16121c', BONE = '#ece6cf';
  function bone(c, ax, ay, bx, by, w) { c.lineCap = 'round'; c.strokeStyle = OUT; c.lineWidth = w + 2.4; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke(); c.strokeStyle = BONE; c.lineWidth = w; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke(); }
  function hpBar(c, f, y, w) { if (f.hp >= f.maxhp) return; c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(f.x - w / 2 - 1, y - 1, w + 2, 6); c.fillStyle = '#9affc8'; c.fillRect(f.x - w / 2, y, w * clamp(f.hp / f.maxhp, 0, 1), 4); }
  function drawSkeleton(c, f, time, G) {
    const cl = f.cl, sc = (cl.big || 1) * 1.2, face = f.face && f.face.x < 0 ? -1 : 1, mv = (f.want && (f.want.x || f.want.y)) ? 1 : 0, ph = time * 11 + (f.id || 0) * 1.7, sw = Math.sin(ph) * 6 * mv;
    c.save(); c.translate(f.x, f.y);
    c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0, 15 * sc, 15 * sc, 5 * sc, 0, 0, PI2); c.fill();
    const tc = G.mode.teams ? WB.TEAM_COLORS[f.team] : (G.player && f.team === G.player.team ? '#ffd24a' : '#ff6a6a'); c.strokeStyle = tc; c.globalAlpha = 0.8; c.lineWidth = 2.5; c.beginPath(); c.ellipse(0, 14 * sc, 17 * sc, 7 * sc, 0, 0, PI2); c.stroke(); c.globalAlpha = 1;
    c.scale(face * sc, sc);
    bone(c, -3, 2, -4 + sw * 0.6, 14, 3); bone(c, 3, 2, 4 - sw * 0.6, 14, 3);                       // jambes
    c.fillStyle = BONE; c.strokeStyle = OUT; c.lineWidth = 1.5; c.beginPath(); c.ellipse(-4 + sw * 0.6, 14.5, 3.6, 1.8, 0, 0, PI2); c.ellipse(4 - sw * 0.6, 14.5, 3.6, 1.8, 0, 0, PI2); c.fill(); c.stroke();
    c.fillStyle = BONE; c.beginPath(); c.ellipse(0, 1, 6, 3, 0, 0, PI2); c.fill(); c.stroke();      // bassin
    bone(c, 0, 0, 0, -17, 2.6);                                                                       // colonne
    for (let i = 0; i < 4; i++) { const y = -6 - i * 3.4, w = 8 - i * 0.9; c.strokeStyle = OUT; c.lineWidth = 3.6; c.beginPath(); c.moveTo(-w, y + 1.5); c.quadraticCurveTo(0, y - 1, w, y + 1.5); c.stroke(); c.strokeStyle = BONE; c.lineWidth = 2; c.beginPath(); c.moveTo(-w, y + 1.5); c.quadraticCurveTo(0, y - 1, w, y + 1.5); c.stroke(); }
    bone(c, -6, -17, 6, -17, 2.4);                                                                    // clavicules
    const swp = clamp(cl.sw / 0.3, 0, 1) > 0 ? 1 - clamp(cl.sw / 0.3, 0, 1) : -1, ang = swp >= 0 ? -1.4 + swp * 2.6 : -0.55 + Math.sin(ph) * 0.12 * mv;
    const hx = 7 + Math.cos(ang) * 8, hy = -15 + Math.sin(ang) * 8;                                   // bras droit + épée
    bone(c, 6, -17, 8 + Math.cos(ang) * 4, -13 + Math.sin(ang) * 5, 2.2); bone(c, 8 + Math.cos(ang) * 4, -13 + Math.sin(ang) * 5, hx, hy, 2.2);
    const bx = hx + Math.cos(ang - 0.35) * 20, by = hy + Math.sin(ang - 0.35) * 20; c.strokeStyle = OUT; c.lineWidth = 4.4; c.beginPath(); c.moveTo(hx, hy); c.lineTo(bx, by); c.stroke(); c.strokeStyle = '#b8c0c8'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(hx, hy); c.lineTo(bx, by); c.stroke();
    c.strokeStyle = '#6a4a2a'; c.lineWidth = 3; c.beginPath(); c.moveTo(hx - Math.sin(ang - 0.35) * 3, hy + Math.cos(ang - 0.35) * 3); c.lineTo(hx + Math.sin(ang - 0.35) * 3, hy - Math.cos(ang - 0.35) * 3); c.stroke();
    bone(c, -6, -17, -9, -12 - sw * 0.2, 2.2); bone(c, -9, -12 - sw * 0.2, -8, -7, 2.2);              // bras gauche
    c.fillStyle = '#4a3a2a'; c.strokeStyle = OUT; c.lineWidth = 1.4; c.beginPath(); c.arc(-10, -10, 5, 0, PI2); c.fill(); c.stroke(); c.fillStyle = BONE; c.beginPath(); c.arc(-10, -10, 1.8, 0, PI2); c.fill();   // petit bouclier
    c.fillStyle = BONE; c.strokeStyle = OUT; c.lineWidth = 1.8; c.beginPath(); c.arc(0, -25, 7.6, 0, PI2); c.fill(); c.stroke();   // crâne
    c.beginPath(); c.rect(-4, -19.6, 8, 4.4); c.fill(); c.stroke();                                                                  // mâchoire
    c.strokeStyle = OUT; c.lineWidth = 1; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 1.6, -19.4); c.lineTo(i * 1.6, -15.4); c.stroke(); }
    c.fillStyle = '#0a0810'; c.beginPath(); c.ellipse(-3, -26, 2.5, 3, 0, 0, PI2); c.ellipse(3, -26, 2.5, 3, 0, 0, PI2); c.fill();    // orbites
    c.fillStyle = '#6aff9a'; c.beginPath(); c.arc(-3, -26, 1.1, 0, PI2); c.arc(3, -26, 1.1, 0, PI2); c.fill();
    c.fillStyle = '#0a0810'; c.beginPath(); c.moveTo(0, -23.2); c.lineTo(-1.4, -21); c.lineTo(1.4, -21); c.closePath(); c.fill();
    c.restore(); hpBar(c, f, f.y - 38 * sc, 24 * sc);
  }
  function drawKnightUnit(c, f, time, G) {
    const cl = f.cl, face = f.face && f.face.x < 0 ? -1 : 1, mv = (f.want && (f.want.x || f.want.y)) ? 1 : 0, ph = time * 9, sw = Math.sin(ph) * 7 * mv;
    c.save(); c.translate(f.x, f.y); if (cl.tp > 0) c.globalAlpha = 0.4 + 0.6 * (1 - cl.tp / 0.35);
    const gl = c.createRadialGradient(0, -12, 10, 0, -12, 90); gl.addColorStop(0, 'rgba(120,255,190,.28)'); gl.addColorStop(1, 'rgba(120,255,190,0)'); c.fillStyle = gl; c.beginPath(); c.arc(0, -12, 90, 0, PI2); c.fill();
    c.fillStyle = 'rgba(0,0,0,.32)'; c.beginPath(); c.ellipse(0, 24, 52, 12, 0, 0, PI2); c.fill();
    const tc = G.mode.teams ? WB.TEAM_COLORS[f.team] : (G.player && f.team === G.player.team ? '#ffd24a' : '#ff6a6a'); c.strokeStyle = tc; c.globalAlpha *= 0.85; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 22, 56, 14, 0, 0, PI2); c.stroke(); c.globalAlpha = cl.tp > 0 ? 0.4 + 0.6 * (1 - cl.tp / 0.35) : 1;
    c.scale(face, 1);
    c.lineCap = 'round'; c.strokeStyle = '#120e18'; c.lineWidth = 7; for (const lx of [-30, -16, 16, 30]) { const s2 = Math.sin(ph + lx) * 7 * mv; c.beginPath(); c.moveTo(lx, 10); c.lineTo(lx + s2, 26); c.stroke(); }
    c.strokeStyle = '#4a4458'; c.lineWidth = 3.4; for (const lx of [-30, -16, 16, 30]) { const s2 = Math.sin(ph + lx) * 7 * mv; c.beginPath(); c.moveTo(lx, 10); c.lineTo(lx + s2, 26); c.stroke(); }
    c.fillStyle = '#241c30'; c.strokeStyle = '#0c0812'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(0, 2, 46, 21, 0, 0, PI2); c.fill(); c.stroke();                       // corps du cheval
    c.strokeStyle = '#ece6cf'; c.lineWidth = 1.8; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 9, -8); c.quadraticCurveTo(i * 9 + 3, 2, i * 9, 12); c.stroke(); }  // côtes apparentes
    c.fillStyle = '#241c30'; c.strokeStyle = '#0c0812'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(34, -10); c.lineTo(54, -30 + sw * 0.2); c.lineTo(68, -22); c.lineTo(66, -8); c.lineTo(52, 2); c.lineTo(40, 14); c.closePath(); c.fill(); c.stroke();   // encolure et tête
    c.fillStyle = '#6aff9a'; c.beginPath(); c.arc(60, -20, 2.6, 0, PI2); c.fill();
    c.fillStyle = 'rgba(110,255,170,.75)'; for (let i = 0; i < 5; i++) { const w = Math.sin(time * 8 + i) * 4; c.beginPath(); c.moveTo(36 + i * 4, -12 - i * 4); c.quadraticCurveTo(30 + i * 4 + w, -26 - i * 4, 40 + i * 4, -30 - i * 4 - w); c.quadraticCurveTo(38 + i * 4, -20 - i * 4, 36 + i * 4, -12 - i * 4); c.fill(); }   // crinière spectrale
    c.strokeStyle = 'rgba(110,255,170,.6)'; c.lineWidth = 4; c.beginPath(); c.moveTo(-44, 0); c.quadraticCurveTo(-62, -10 + Math.sin(time * 7) * 5, -66, 14); c.stroke();
    // cavalier
    c.fillStyle = '#18131f'; c.strokeStyle = '#0c0812'; c.lineWidth = 2.5; c.beginPath(); c.roundRect ? c.roundRect(-12, -50, 26, 40, 6) : c.rect(-12, -50, 26, 40); c.fill(); c.stroke();
    c.strokeStyle = '#6a3aa0'; c.lineWidth = 2; c.beginPath(); c.moveTo(-12, -36); c.lineTo(14, -36); c.stroke();
    c.fillStyle = '#241c30'; c.beginPath(); c.arc(-12, -46, 8, 0, PI2); c.arc(14, -46, 8, 0, PI2); c.fill(); c.stroke();
    c.fillStyle = '#2a2236'; c.beginPath(); c.arc(1, -58, 10, 0, PI2); c.fill(); c.stroke();                                                                     // heaume
    c.strokeStyle = '#ece6cf'; c.lineWidth = 3; c.beginPath(); c.moveTo(-8, -62); c.quadraticCurveTo(-18, -72, -12, -80); c.moveTo(10, -62); c.quadraticCurveTo(20, -72, 14, -80); c.stroke();   // cornes
    c.fillStyle = '#6aff9a'; c.fillRect(-6, -60, 5, 3); c.fillRect(3, -60, 5, 3);
    c.fillStyle = '#2a2236'; c.strokeStyle = '#0c0812'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-24, -52); c.lineTo(-8, -52); c.lineTo(-8, -20); c.lineTo(-16, -8); c.lineTo(-24, -20); c.closePath(); c.fill(); c.stroke();   // grand bouclier
    c.fillStyle = '#ece6cf'; c.beginPath(); c.arc(-16, -36, 5, 0, PI2); c.fill(); c.fillStyle = '#0a0810'; c.beginPath(); c.arc(-17.8, -36.5, 1.4, 0, PI2); c.arc(-14.2, -36.5, 1.4, 0, PI2); c.fill();
    const sp = cl.sw > 0 ? clamp(1 - cl.sw / 0.35, 0, 1) : -1, a = sp >= 0 ? -2.2 + sp * 3.4 : -1.1 + Math.sin(time * 3) * 0.08;                                       // très longue épée
    c.save(); c.translate(14, -34); c.rotate(a); c.strokeStyle = '#0c0812'; c.lineWidth = 8; c.beginPath(); c.moveTo(0, 0); c.lineTo(84, 0); c.stroke(); c.strokeStyle = '#cfd6e0'; c.lineWidth = 4.6; c.beginPath(); c.moveTo(6, 0); c.lineTo(84, 0); c.stroke(); c.strokeStyle = 'rgba(120,255,190,.7)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(10, 0); c.lineTo(80, 0); c.stroke(); c.strokeStyle = '#6a3aa0'; c.lineWidth = 6; c.beginPath(); c.moveTo(6, -8); c.lineTo(6, 8); c.stroke(); c.restore();
    c.restore(); hpBar(c, f, f.y - 92, 60);
  }
  WB.drawSkelUnit = function (ctx, f, G, time) { if (f.cl.knight) drawKnightUnit(ctx, f, time, G); else drawSkeleton(ctx, f, time, G); };

  WB.drawDeathKing = function (c, f, G, time) {
    const fm = f.necForm, s = f.scale || 1.7, face = f.face && f.face.x < 0 ? -1 : 1, mv = (f.want && (f.want.x || f.want.y)) ? 1 : 0, bob = Math.sin(time * 6) * 1.5 * mv;
    c.save(); c.translate(f.x, f.y);
    const gl = c.createRadialGradient(0, -20, 10, 0, -20, 120); gl.addColorStop(0, 'rgba(150,70,255,.35)'); gl.addColorStop(1, 'rgba(150,70,255,0)'); c.fillStyle = gl; c.beginPath(); c.arc(0, -20, 120, 0, PI2); c.fill();
    c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(0, 20, 26 * s / 1.7 * 1.2, 9, 0, 0, PI2); c.fill();
    const tc = G.mode.teams ? WB.TEAM_COLORS[f.team] : (f === G.player ? '#ffd24a' : '#ff6a6a'); c.strokeStyle = tc; c.globalAlpha = 0.85; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 19, 34, 12, 0, 0, PI2); c.stroke(); c.globalAlpha = 1;
    c.scale(face * s / 1.7 * 1.15, s / 1.7 * 1.15);
    // cape déchirée qui flotte derrière
    c.fillStyle = '#0e0a14'; c.strokeStyle = '#3a1a5a'; c.lineWidth = 2; c.beginPath(); c.moveTo(-8, -40);
    for (let i = 0; i <= 6; i++) { const t = i / 6, w = Math.sin(time * 6 + i * 1.3) * 7 + (mv ? 10 : 3); c.lineTo(-14 - 26 * t - w * t, -36 + 64 * t + (i % 2 ? 9 : 0)); }
    c.lineTo(8, 20); c.lineTo(8, -40); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#18101f'; c.strokeStyle = '#4a2a6a'; c.lineWidth = 2; c.beginPath(); c.moveTo(-17, 22); c.quadraticCurveTo(-24, -20, -10, -40 + bob); c.lineTo(10, -40 + bob); c.quadraticCurveTo(24, -20, 17, 22); c.closePath(); c.fill(); c.stroke();    // robe
    c.strokeStyle = '#c02020'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -36 + bob); c.lineTo(0, 20); c.stroke();
    c.fillStyle = '#18101f'; c.beginPath(); c.arc(-15, -36 + bob, 9, 0, PI2); c.arc(15, -36 + bob, 9, 0, PI2); c.fill(); c.stroke();                                                   // épaulières
    c.fillStyle = '#18101f'; c.beginPath(); c.arc(0, -50 + bob, 13, Math.PI, 0); c.lineTo(13, -44 + bob); c.lineTo(-13, -44 + bob); c.closePath(); c.fill(); c.stroke();               // capuche
    c.fillStyle = '#efe9d6'; c.strokeStyle = '#0a0810'; c.lineWidth = 2; c.beginPath(); c.ellipse(0, -47 + bob, 9.5, 11, 0, 0, PI2); c.fill(); c.stroke();                           // masque de la mort
    c.fillStyle = '#0a0810'; c.beginPath(); c.ellipse(-4, -49 + bob, 3, 4, 0.2, 0, PI2); c.ellipse(4, -49 + bob, 3, 4, -0.2, 0, PI2); c.fill();
    c.fillStyle = '#ff2a2a'; c.beginPath(); c.arc(-4, -49 + bob, 1.4, 0, PI2); c.arc(4, -49 + bob, 1.4, 0, PI2); c.fill();
    c.strokeStyle = '#0a0810'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-5, -41 + bob); c.lineTo(5, -41 + bob); for (let i = -4; i <= 4; i += 2) { c.moveTo(i, -42 + bob); c.lineTo(i, -39 + bob); } c.stroke();
    // faux de la mort : long manche noir, grande lame courbée noire et rouge, petite tête de mort
    const swp = fm && fm.swing > 0 ? 1 - clamp(fm.swing / 0.4, 0, 1) : -1, ang = swp >= 0 ? -2.3 + swp * 3.6 : -1.0 + Math.sin(time * 2.4) * 0.07;
    c.save(); c.translate(14, -26); c.rotate(ang);
    c.strokeStyle = '#0a0810'; c.lineWidth = 7; c.beginPath(); c.moveTo(-22, 0); c.lineTo(86, 0); c.stroke(); c.strokeStyle = '#3a2a2a'; c.lineWidth = 3.6; c.beginPath(); c.moveTo(-22, 0); c.lineTo(86, 0); c.stroke();
    c.fillStyle = '#0a0810'; c.strokeStyle = '#c01818'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(80, 0); c.bezierCurveTo(92, -34, 56, -62, 18, -54); c.bezierCurveTo(52, -48, 78, -28, 80, 0); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(190,100,255,.8)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(78, -4); c.bezierCurveTo(86, -30, 58, -52, 28, -52); c.stroke();
    c.fillStyle = '#efe9d6'; c.strokeStyle = '#0a0810'; c.lineWidth = 1.4; c.beginPath(); c.arc(80, 6, 6, 0, PI2); c.fill(); c.stroke(); c.fillStyle = '#0a0810'; c.beginPath(); c.arc(78, 5, 1.5, 0, PI2); c.arc(82, 5, 1.5, 0, PI2); c.fill();
    c.fillStyle = 'rgba(150,70,255,.55)'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(30 + i * 12 + Math.sin(time * 9 + i) * 2, -52 + Math.cos(time * 7 + i) * 3, 3.2, 0, PI2); c.fill(); }
    c.restore();
    c.restore();
    if (f.hp < f.maxhp) { c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(f.x - 31, f.y - 118 * s / 1.7, 62, 7); c.fillStyle = '#c08aff'; c.fillRect(f.x - 30, f.y - 117 * s / 1.7, 60 * clamp(f.hp / f.maxhp, 0, 1), 5); }
  };

  WB.drawTempleZone = function (c, q, time) {
    const a = clamp(Math.min(q.t / 0.8, (q.T - q.t) / 0.8 + 0.2), 0, 1);
    c.save(); c.globalAlpha = a; const gl = c.createRadialGradient(q.x, q.y, 20, q.x, q.y, q.R); gl.addColorStop(0, 'rgba(70,20,110,.38)'); gl.addColorStop(0.8, 'rgba(50,10,90,.28)'); gl.addColorStop(1, 'rgba(120,50,200,.35)'); c.fillStyle = gl; c.beginPath(); c.arc(q.x, q.y, q.R, 0, PI2); c.fill();
    c.strokeStyle = 'rgba(190,120,255,.8)'; c.lineWidth = 4; c.setLineDash([14, 10]); c.lineDashOffset = -time * 24; c.beginPath(); c.arc(q.x, q.y, q.R - 3, 0, PI2); c.stroke(); c.setLineDash([]);
    c.strokeStyle = 'rgba(150,70,255,.5)'; c.lineWidth = 2; for (let i = 0; i < 16; i++) { const t = i / 16 * PI2 + time * 0.3; c.beginPath(); c.moveTo(q.x + Math.cos(t) * (q.R - 24), q.y + Math.sin(t) * (q.R - 24)); c.lineTo(q.x + Math.cos(t) * (q.R - 10), q.y + Math.sin(t) * (q.R - 10)); c.stroke(); }
    c.restore();
  };
  WB.drawTemple = function (c, q, time) {
    const a = clamp(Math.min(q.t / 0.8, (q.T - q.t) / 0.8 + 0.2), 0, 1), rise = (1 - clamp(q.t / 0.8, 0, 1)) * 40;
    c.save(); c.translate(q.x, q.y + 60 + rise); c.globalAlpha = a;
    c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(0, 12, 130, 24, 0, 0, PI2); c.fill();
    const O = '#07050b', EDGE = '#5a2a8a', FILL = '#15101c';
    c.fillStyle = '#1a1422'; c.strokeStyle = O; c.lineWidth = 3; c.beginPath(); c.moveTo(-120, 10); c.lineTo(120, 10); c.lineTo(104, -8); c.lineTo(-104, -8); c.closePath(); c.fill(); c.stroke();   // socle
    c.fillStyle = FILL; c.beginPath(); c.rect(-84, -62, 168, 56); c.fill(); c.stroke();                                                                                                // salle principale
    c.fillStyle = '#2a1a3a'; for (const px of [-84, -42, 0, 42, 84]) { c.fillRect(px - 4, -64, 8, 58); c.strokeRect(px - 4, -64, 8, 58); }                                               // piliers
    const fl = 0.7 + 0.3 * Math.sin(time * 5); c.fillStyle = 'rgba(255,40,40,' + fl + ')'; c.fillRect(-16, -46, 32, 40); c.strokeStyle = O; c.strokeRect(-16, -46, 32, 40);
    c.fillStyle = 'rgba(120,255,170,' + (0.5 + 0.3 * Math.sin(time * 4)) + ')'; for (const wx of [-66, -24, 24, 66]) { c.fillRect(wx - 6, -48, 12, 16); }
    const tier = (w, y, h, up) => { c.fillStyle = FILL; c.strokeStyle = EDGE; c.lineWidth = 3; c.beginPath(); c.moveTo(-w, y); c.quadraticCurveTo(-w + 10, y - 6, -w * 0.6, y - h * 0.4); c.lineTo(-w * 0.45, y - h); c.lineTo(w * 0.45, y - h); c.lineTo(w * 0.6, y - h * 0.4); c.quadraticCurveTo(w - 10, y - 6, w, y); c.quadraticCurveTo(w * 0.5, y + 10, 0, y + 6); c.quadraticCurveTo(-w * 0.5, y + 10, -w, y); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(-w, y); c.quadraticCurveTo(-w - 14, y - 12, -w - 22, y - 26); c.moveTo(w, y); c.quadraticCurveTo(w + 14, y - 12, w + 22, y - 26); c.stroke(); };   // toits aux avant-toits relevés
    tier(130, -60, 34); tier(98, -94, 32); tier(66, -126, 30);
    c.strokeStyle = EDGE; c.lineWidth = 4; c.beginPath(); c.moveTo(0, -156); c.lineTo(0, -184); c.stroke(); c.fillStyle = '#c02020'; c.beginPath(); c.arc(0, -188, 6, 0, PI2); c.fill();
    c.fillStyle = 'rgba(120,255,170,.9)'; for (const lx of [-118, 118]) { c.beginPath(); c.arc(lx, -36 + Math.sin(time * 3 + lx) * 2, 5, 0, PI2); c.fill(); c.strokeStyle = '#3a2a2a'; c.lineWidth = 2; c.beginPath(); c.moveTo(lx, -64); c.lineTo(lx, -41); c.stroke(); }
    // fumée noire et énergie négative
    for (let i = 0; i < 14; i++) { const t = ((time * 0.45 + i / 14) % 1), sx = Math.sin(i * 7.3) * 90 + Math.sin(time + i) * 14, sy = -40 - t * 190; c.globalAlpha = a * (1 - t) * 0.55; c.fillStyle = i % 3 ? '#0c0812' : '#5a2a8a'; c.beginPath(); c.arc(sx, sy, 8 + t * 22, 0, PI2); c.fill(); }
    c.globalAlpha = a; c.strokeStyle = 'rgba(190,120,255,.7)'; c.lineWidth = 2; for (let i = 0; i < 5; i++) { const t0 = time * 1.2 + i * 1.3; c.beginPath(); for (let k = 0; k < 8; k++) { const kk = k / 7, x = Math.sin(t0 + kk * 5) * 20 + (i - 2) * 50, y = -20 - kk * 150; if (k) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke(); }
    c.restore();
  };

  WB.drawNecro = function (c, g, time) {
    ensure(g); const me = g.player;
    for (const a of g.necE.arrows) {
      c.save(); c.translate(a.x, a.y); c.rotate(a.a); const gl = c.createRadialGradient(0, 0, 2, 0, 0, 30); gl.addColorStop(0, 'rgba(154,255,200,.8)'); gl.addColorStop(1, 'rgba(154,255,200,0)'); c.fillStyle = gl; c.beginPath(); c.arc(0, 0, 30, 0, PI2); c.fill();
      c.strokeStyle = '#d8fff0'; c.lineWidth = 3; c.beginPath(); c.moveTo(-26, 0); c.lineTo(14, 0); c.stroke(); c.fillStyle = '#9affc8'; c.beginPath(); c.moveTo(22, 0); c.lineTo(10, -7); c.lineTo(10, 7); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(154,255,200,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-26, 0); c.lineTo(-40, -6); c.moveTo(-26, 0); c.lineTo(-40, 6); c.stroke(); c.restore();
    }
    for (const w of g.necE.waves) {
      c.save(); c.translate(w.x, w.y); c.rotate(Math.atan2(w.dy, w.dx)); c.fillStyle = 'rgba(40,10,70,.8)'; c.strokeStyle = '#c02020'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -42); c.quadraticCurveTo(34, 0, 0, 42); c.quadraticCurveTo(14, 0, 0, -42); c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(190,120,255,.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-6, -34); c.quadraticCurveTo(22, 0, -6, 34); c.stroke(); c.restore();
    }
    for (const f of g.F) {
      if (!f.alive) continue; const th = f.thrall;
      if (th && th.necro && th.L < 5 && th.owner && th.flow > 0) { c.strokeStyle = 'rgba(154,255,200,.6)'; c.lineWidth = 3; c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(th.owner.x, th.owner.y); c.stroke(); }
      if (th && th.necro && th.L === 5) { c.strokeStyle = 'rgba(190,120,255,.8)'; c.lineWidth = 2.5; c.setLineDash([4, 4]); c.beginPath(); c.arc(f.x, f.y, 32, 0, PI2); c.stroke(); c.setLineDash([]); }
      if (f.necMark && g.t < f.necMark.until && !(me && g.hiddenFor && g.hiddenFor(me, f))) {
        const x = f.x, y = f.y - f.r * (f.scale || 1) - 22 + Math.sin(time * 4) * 2; c.fillStyle = '#ece6cf'; c.strokeStyle = '#0a0810'; c.lineWidth = 1.6; c.beginPath(); c.arc(x, y, 7, 0, PI2); c.fill(); c.stroke(); c.fillRect(x - 4, y + 4, 8, 4); c.fillStyle = '#0a0810'; c.beginPath(); c.arc(x - 2.6, y - 1, 1.8, 0, PI2); c.arc(x + 2.6, y - 1, 1.8, 0, PI2); c.fill();
        c.strokeStyle = 'rgba(154,255,200,.8)'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 11, 0, PI2); c.stroke();
      }
    }
  };

  const upd = WB.updateHands, drw = WB.drawHands;
  WB.updateHands = function (dt) { upd(dt); updateNecro(dt); };
  WB.drawHands = function (ctx, g, time) { drw(ctx, g, time); WB.drawNecro(ctx, g, time); };

  // ---------- définition de la capacité ----------
  const N = A.necro;
  N.name = 'Nécromancien'; N.type = 'zone'; N.cd = L => [0, 10, 14, 12, 14, 18][L] || 12; N.range = L => 560; N.cast = cast; N.ai = { max: L => 520, min: 0 };
  N.desc = 'Niv.1 : 5 squelettes guerriers. Niv.2 : chevalier mort-vivant monté qui te protège et se téléporte entre ennemis. Niv.3 : flèche qui capture un adversaire (jusqu\'à 5), qui te défend puis est libéré et marqué. Niv.4 : capture longue, marque définitive, un guerrier squelette naît de celui qui meurt capturé. Niv.5 : temple maudit et transformation en roi de la mort.';
  WB.GUIDE = WB.GUIDE || {};
  WB.GUIDE.necro = ['Durian piquant', 'Des morts-vivants se battent pour toi. Chaque niveau garde les pouvoirs du précédent.', [
    '5 guerriers squelettes qui poursuivent et combattent seuls.',
    'Un chevalier mort-vivant monté, qui reste près de toi et se téléporte d\'un ennemi à l\'autre.',
    'Une flèche magique capture un adversaire : il te défend, te donne de la vie, puis est libéré et marqué (ses morts te reviennent).',
    'Capture plus longue et marque définitive. Si le capturé meurt, un guerrier squelette avec ses pouvoirs naît sur place.',
    'Temple maudit (5 squelettes par seconde, régénération et résurrection dans sa zone) et transformation en roi de la mort : faux, vagues sombres, possession des ennemis touchés.']];
})(window.WB);
