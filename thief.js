'use strict';
// Voleur (capacité 'glut') : rafale de dagues passive, ciblage multiple et verrouillage, tourbillon de dagues, vol de capacités.
// Remplace l'ancien « avale et recrache » (28/11). Tout est branché sur les systèmes existants : g.damage, g.kill, f.slots (slots volés = stolen:true).
(function (WB) {
  const PI2 = Math.PI * 2, clamp = (v, a, b) => v < a ? a : v > b ? b : v, dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const RANGE = 340;          // grande portée de détection
  const BASE_IV = 0.15;       // cadence maximale : une dague toutes les 0,15 s (6,7 par seconde)
  const MULTI_SLOW = 0.18;    // chaque cible en plus ralentit la cadence globale de 18 %, plafonné à 4 cibles (soit 0,23 s)
  const SPEED = 900, GAUGE_HIT = 6, WHIRL_T = 3.2, PASS_IV = 0.2, REACH = 56, MAX_STOLEN = 5;
  const dmgOf = (n, L) => 3 + 0.4 * L + 1.3 * Math.min(n, 9);   // n = nombre de dagues déjà reçues de suite par cette cible
  const T = WB.THIEF = { RANGE: RANGE, BASE_IV: BASE_IV, MULTI_SLOW: MULTI_SLOW, WHIRL_T: WHIRL_T, MAX_STOLEN: MAX_STOLEN, dmgOf: dmgOf };

  // ---------- état ----------
  function slotOf(f) { if (!f.slots) return null; for (const s of f.slots) if (s && s.id === 'glut' && !s.stolen) return s; return null; }
  T.slotOf = slotOf;
  function st(f) { return f.th || (f.th = { cd: 0, rr: 0, cnt: {}, gauge: 0, lock: null, whirl: null, scan: 0, near: null }); }
  function idOf(g, t) { return t.id != null ? t.id : g.F.indexOf(t); }
  function ok(g, f, t) { return t.alive && t.team !== f.team && !t.ghost && !t.swallowed && !(t.st && t.st.jump) && g.visibleTo(f, t); }
  function foesIn(g, f, R) { const o = []; for (const t of g.F) { if (!ok(g, f, t)) continue; if (dist(f, t) > R + t.r * 0.5) continue; o.push(t); } return o; }
  function busy(f) { return !f.alive || f.swallowed || f.thrall || !WB.G.started || WB.G.over || (f.st && (f.st.stun > 0 || f.st.frozen > 0 || f.st.silence > 0)); }
  function blocked(g, x, y) {
    if (g.world.solidAt(x, y)) return true;
    for (const w of g.walls) if (Math.abs(x - w.x) <= w.w / 2 && Math.abs(y - w.y) <= w.h / 2) return true;
    return false;
  }

  // ---------- choix des cibles ----------
  function targets(g, f, th, L) {
    if (L >= 2 && th.lock) { const t = th.lock; if (ok(g, f, t) && dist(f, t) <= RANGE * 1.2) return [t]; th.lock = null; }
    if (th.scan <= 0) { th.scan = 0.2; th.list = foesIn(g, f, RANGE).sort((a, b) => dist(f, a) - dist(f, b)); }
    if (th.cur && !ok(g, f, th.cur)) th.cur = null;
    const l = (th.list || []).filter(t => ok(g, f, t) && dist(f, t) <= RANGE + t.r);
    if (!l.length) return [];
    if (L >= 2 && L < 4) return l;
    // cible unique : on reste sur la même tant qu'elle est valide et à portée (dégâts cumulatifs), sinon la plus proche
    if (th.cur && l.indexOf(th.cur) >= 0) return [th.cur];
    th.cur = l[0]; return [l[0]];
  }

  // ---------- dagues ----------
  function throwDagger(g, f, t) {
    const a = Math.atan2(t.y - f.y, t.x - f.x), sx = f.x + Math.cos(a) * (f.r + 4), sy = f.y + Math.sin(a) * (f.r + 4);
    (g.dag || (g.dag = [])).push({ x: sx, y: sy, a: a, f: f, tg: t, t: 0, spin: Math.random() * 6 });
    f.armT = 0.12; f.face.x = Math.cos(a); f.face.y = Math.sin(a);
  }
  function updateDaggers(g, dt) {
    const a = g.dag; if (!a || !a.length) return;
    for (const d of a) {
      d.t += dt; const t = d.tg, f = d.f;
      if (d.t > 0.9 || !f.alive || !t.alive || t.ghost || t.swallowed || (t.st && t.st.jump)) { d.dead = true; continue; }
      const dx = t.x - d.x, dy = t.y - d.y, dd = Math.hypot(dx, dy), hitR = t.r * (t.scale || 1) * 0.75 + 6, step = SPEED * dt;
      d.a = Math.atan2(dy, dx);
      const nx = d.x + Math.cos(d.a) * Math.min(step, dd), ny = d.y + Math.sin(d.a) * Math.min(step, dd);
      if (blocked(g, nx, ny) || g.roomBlock(f, t)) { d.dead = true; g.fx('burst', d.x, d.y, { col: '#cfd6e6', n: 2, life: 0.2 }); continue; }   // raté : le compteur ne bouge pas
      d.x = nx; d.y = ny; d.spin += dt * 30;
      if (Math.hypot(t.x - d.x, t.y - d.y) <= hitR) { d.dead = true; impact(g, f, t); }
    }
    g.dag = a.filter(d => !d.dead);
  }
  function impact(g, f, t) {
    const th = st(f), sl = slotOf(f), L = sl ? sl.lvl : 1, id = idOf(g, t), c = th.cnt[id] || (th.cnt[id] = { n: 0, last: 0 });
    if (g.t - c.last > 2.0) c.n = 0;                      // la série retombe si la cible n'est plus touchée
    const hp0 = t.hp, dmg = dmgOf(c.n, L);
    g.damage(t, dmg, f, 'glut', { noRedirect: false });
    if (t.hp < hp0 || !t.alive) { c.n++; c.last = g.t; if (L >= 2 && !th.whirl) th.gauge = Math.min(100, th.gauge + GAUGE_HIT); }   // seulement si la dague a vraiment blessé
    g.fx('burst', t.x, t.y, { col: '#e8eef8', n: 2, life: 0.25 });
  }

  // ---------- tourbillon ----------
  function stunRes(t) { return clamp(0.04 * ((t.level || 1) - 1) + (t.maxhp || 100) / 2000, 0, 0.7); }
  function startWhirl(g, f, th, L, tg) {
    const a0 = Math.atan2(f.y - tg.y, f.x - tg.x), gap = (tg.r * (tg.scale || 1) + f.r * (f.scale || 1)) * 0.8;
    g.fx('burst', f.x, f.y, { col: '#b8c4ff', n: 10, life: 0.4 }); g.fx('ring', f.x, f.y, { r: 36, col: '#b8c4ff', life: 0.3, w: 4 });
    const p = g.world.nearFloor(tg.x + Math.cos(a0) * gap, tg.y + Math.sin(a0) * gap, 2); f.x = p.x; f.y = p.y; f.vx = f.vy = 0; f.kx = f.ky = 0;
    g.fx('burst', f.x, f.y, { col: '#ffffff', n: 12, life: 0.4 }); g.fx('ring', f.x, f.y, { r: 50, col: '#ffffff', life: 0.35, w: 5 }); g.sfx('tp'); g.shake(4);
    const res = stunRes(tg), stun = 2.6 * (1 - res);
    g.status(tg, 'stun', stun); tg.vx = tg.vy = 0;
    th.whirl = { t: 0, T: WHIRL_T, a: 0, x: f.x, y: f.y, pass: 0, pt: 0, tg: tg, res: res, stun: stun, hits: 0 };
    g.text(f.x, f.y - 56, 'TOURBILLON', '#d8e2ff', 16);
  }
  function updateWhirl(g, f, th, L, dt) {
    const w = th.whirl; w.t += dt; w.a += dt * 13; w.pt += dt;
    f.x = w.x; f.y = w.y; f.vx = f.vy = 0; f.kx = f.ky = 0; f.face.x = Math.cos(w.a); f.face.y = Math.sin(w.a); f.armT = 0.1;
    if (w.pt >= PASS_IV) {
      w.pt -= PASS_IV; w.pass++;
      for (const t of g.F) {
        if (!t.alive || t.team === f.team || t.ghost || t.swallowed || (t.st && t.st.jump)) continue;
        if (Math.hypot(t.x - f.x, t.y - f.y) > REACH + t.r * 0.6 || g.roomBlock(f, t)) continue;
        g.damage(t, 10 + 2 * L, f, 'glut'); w.hits++; g.fx('burst', t.x, t.y, { col: '#ffd24a', n: 4, life: 0.3 }); g.sfx('impact', 0.5);
        if (t === w.tg && t.st.stun > 0 && Math.random() < w.res * 0.3) t.st.stun = 0;      // les costauds peuvent se dégager avant la fin
      }
    }
    if (w.t >= w.T) { th.whirl = null; f.face.x = 1; f.face.y = 0; }   // fin programmée : le tourbillon va toujours jusqu'au bout, même cible partie ou morte
  }

  // ---------- vol de capacités ----------
  function addStolen(g, f, id, lvl, form) {
    if (id === 'glut') return false;
    const have = f.slots.find(s => s && s.stolen && s.id === id);
    if (have) { have.lvl = Math.max(have.lvl, lvl); have.n = WB.maxCharges(have); have.rech = []; have.cd = 0; if (form && !have.form) have.form = form; return true; }
    const stolen = f.slots.filter(s => s && s.stolen);
    if (stolen.length >= MAX_STOLEN) { const i = f.slots.indexOf(stolen[0]); f.slots.splice(i, 1); }
    const ab = Object.assign(WB.newAbility(id, lvl), { stolen: true }); if (id === 'summon') ab.form = form;
    f.slots.push(ab); if (f === g.player) { g.swap = null; WB.input.reset && WB.input.reset(); }
    return true;
  }
  T.addStolen = addStolen;
  function onKill(g, f, victim, vs) {
    const sl = slotOf(f); if (!sl || !f.alive) return; const L = sl.lvl; if (L < 3) return;
    const pool = vs.filter(s => s.id !== 'glut');
    g.fx('ring', f.x, f.y, { r: 60, col: '#ff8ad0', life: 0.5, w: 5 });
    if (L >= 4) { const heal = Math.round(victim.maxhp); f.hp = Math.min(f.maxhp, f.hp + heal); g.text(f.x, f.y - 50, '+' + heal + ' PV', '#7cff9a', 16); }
    if (!pool.length) return;
    if (L === 3) { const b = pool.slice().sort((x, y) => y.lvl - x.lvl)[0]; if (addStolen(g, f, b.id, b.lvl, b.form)) g.text(f.x, f.y - 70, 'VOL : ' + (WB.ABIL[b.id] ? WB.ABIL[b.id].name : b.id), '#ff8ad0', 15); }
    else if (L === 4) { for (const b of pool) addStolen(g, f, b.id, b.lvl, b.form); g.text(f.x, f.y - 70, 'VOL INTÉGRAL', '#ff8ad0', 15); }
    else {
      if (f === g.player) { g.stealPick = { f: f, opts: pool.map(b => ({ id: b.id, form: b.form })), t: 12 }; }
      else { const b = pool.slice().sort((x, y) => y.lvl - x.lvl)[0]; addStolen(g, f, b.id, 5, b.form); }
    }
  }
  T.pick = function (i) {
    const g = WB.G, sp = g.stealPick; if (!sp) return; const o = sp.opts[i]; if (!o) return;
    if (sp.f.alive && slotOf(sp.f)) { addStolen(g, sp.f, o.id, 5, o.form); g.text(sp.f.x, sp.f.y - 70, 'VOL : ' + (WB.ABIL[o.id] ? WB.ABIL[o.id].name : o.id) + ' (niv. 5)', '#ff8ad0', 15); g.sfx('pickup'); }
    g.stealPick = null;
  };

  // ---------- verrouillage manuel ----------
  T.lockAt = function (g, f, wx, wy) {
    const sl = slotOf(f); if (!sl || sl.lvl < 2 || !f.alive) return false; const th = st(f);
    let best = null, bd = 1e9;
    for (const t of g.F) { if (!ok(g, f, t) || dist(f, t) > RANGE * 1.2) continue; const d = Math.hypot(t.x - wx, t.y - wy); if (d < 46 + t.r * (t.scale || 1) && d < bd) { bd = d; best = t; } }
    if (!best) return false;
    if (th.lock === best) { th.lock = null; return true; }
    th.lock = best; th.cd = Math.min(th.cd, 0); th.cnt = {}; g.fx('ring', best.x, best.y, { r: 30, col: '#ff5a5a', life: 0.4, w: 4 });   // cadence initiale retrouvée
    return true;
  };

  // ---------- boucle ----------
  let installed = false;
  function install(g) {
    if (g.__thInstalled) return; g.__thInstalled = true;
    const k0 = g.kill;
    g.kill = function (t, src) {
      const was = t && t.alive, vs = was && t.slots ? t.slots.filter(Boolean).map(s => ({ id: s.id, lvl: s.lvl, form: s.form })) : [];
      const r = k0.apply(g, arguments);
      if (was && !t.alive && (t.kind === 'player' || t.kind === 'bot' || t.kind === 'boss')) {
        let k = src; if (k && (k.kind === 'thrall' || k.kind === 'golem') && k.owner) k = k.owner; else if (k && k.thrall && k.thrall.owner) k = k.thrall.owner;
        if (!k && t.lastHit && g.t - t.lastHit.t < 8) k = t.lastHit.by;
        if (k && k !== t && k.alive && (k.kind === 'player' || k.kind === 'bot')) { try { onKill(g, k, t, vs); } catch (e) { if (WB.dbgThief) console.error(e); } }
      }
      return r;
    };
    const cv = WB.ui && WB.ui.cv;
    if (cv && !installed) cv.addEventListener('pointerdown', function (e) {
      const G = WB.G, f = G && G.player; if (!f || !G.started || !G.view || !slotOf(f) || WB.ui.screen !== 'game') return;
      const r = cv.getBoundingClientRect(), v = G.view, z = v.z; T.lockAt(G, f, v.x0 + (e.clientX - r.left) / z, v.y0 + (e.clientY - r.top) / z);
    });
    installed = true;
  }
  function update(g, dt) {
    install(g);
    if (g.stealPick) { const sp = g.stealPick; sp.t -= dt; if (!sp.f.alive || !slotOf(sp.f)) g.stealPick = null; else if (sp.t <= 0) { const b = sp.opts[0]; g.stealPick = null; addStolen(g, sp.f, b.id, 5, b.form); } }
    for (const f of g.F) {
      if (f.kind !== 'player' && f.kind !== 'bot') continue;
      const sl = slotOf(f); if (!sl) { if (f.th) f.th = null; continue; }
      const th = st(f), L = sl.lvl;
      th.scan -= dt; th.cd -= dt;
      if (!f.alive) { th.whirl = null; th.gauge = 0; th.lock = null; th.cnt = {}; continue; }
      if (th.whirl) { updateWhirl(g, f, th, L, dt); continue; }
      if (busy(f)) continue;
      const tg = targets(g, f, th, L);
      if (L >= 2 && th.gauge >= 100) {
        let w = th.lock && ok(g, f, th.lock) ? th.lock : null;
        if (!w && tg.length) { let bn = -1; for (const t of tg) { const c = th.cnt[idOf(g, t)]; const n = c ? c.n : 0; if (n > bn) { bn = n; w = t; } } }
        if (w) { th.gauge = 0; startWhirl(g, f, th, L, w); continue; }
      }
      if (!tg.length) continue;
      if (th.cd <= 0) {
        const n = th.lock && L >= 2 ? 1 : Math.min(tg.length, 4), iv = BASE_IV * (1 + MULTI_SLOW * (n - 1));
        th.cd = iv; th.rr++; throwDagger(g, f, tg[th.rr % tg.length]);
        if (th.rr % 3 === 0) g.sfx('throw', 0.25);
      }
    }
    updateDaggers(g, dt);
  }

  // ---------- dessin ----------
  function blade(c, x, y, a, len, w, col) {
    c.save(); c.translate(x, y); c.rotate(a);
    c.fillStyle = col || '#e6ecf6'; c.strokeStyle = '#6a7488'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(len, 0); c.lineTo(0, -w); c.lineTo(-len * 0.25, 0); c.lineTo(0, w); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#5a3a28'; c.fillRect(-len * 0.55, -1.6, len * 0.35, 3.2);
    c.restore();
  }
  function drawTop(c, g, time) {
    const a = g.dag;
    if (a) for (const d of a) { c.save(); c.globalAlpha = 0.35; c.strokeStyle = '#cfd6e6'; c.lineWidth = 2; c.beginPath(); c.moveTo(d.x - Math.cos(d.a) * 22, d.y - Math.sin(d.a) * 22); c.lineTo(d.x, d.y); c.stroke(); c.restore(); blade(c, d.x, d.y, d.a, 9, 3.2); }
    for (const f of g.F) {
      const th = f.th; if (!th || !f.alive) continue;
      if (th.whirl) {
        const w = th.whirl, R = REACH - 4;
        c.save(); c.translate(f.x, f.y);
        c.globalAlpha = 0.35; c.strokeStyle = '#e6ecf6'; c.lineWidth = 5; for (const k of [0, 1]) { c.beginPath(); c.arc(0, 0, R - 8, w.a + k * Math.PI - 0.9, w.a + k * Math.PI); c.stroke(); } c.globalAlpha = 1;
        for (const k of [0, 1]) { const ang = w.a + k * Math.PI; c.strokeStyle = '#d8b48a'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(Math.cos(ang) * 12, Math.sin(ang) * 12); c.lineTo(Math.cos(ang) * 24, Math.sin(ang) * 24); c.stroke(); blade(c, Math.cos(ang) * 38, Math.sin(ang) * 38, ang, 20, 4.2, '#f4f7ff'); }
        c.restore();
      }
      if (f === g.player) {
        const sl = slotOf(f); if (sl && sl.lvl >= 2) { const x = f.x - 22, y = f.y + f.r * (f.scale || 1) + 12; c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(x, y, 44, 6); c.fillStyle = th.gauge >= 100 ? '#ffd24a' : '#b8c4ff'; c.fillRect(x + 1, y + 1, 42 * th.gauge / 100, 4); }
        if (th.lock && th.lock.alive) { const t = th.lock, r = (t.r * (t.scale || 1)) + 10 + Math.sin(time * 8) * 2; c.save(); c.strokeStyle = '#ff4a4a'; c.lineWidth = 3; c.beginPath(); c.arc(t.x, t.y, r, 0, PI2); c.stroke(); for (let k = 0; k < 4; k++) { const an = k * Math.PI / 2 + time * 2; c.beginPath(); c.moveTo(t.x + Math.cos(an) * (r - 5), t.y + Math.sin(an) * (r - 5)); c.lineTo(t.x + Math.cos(an) * (r + 7), t.y + Math.sin(an) * (r + 7)); c.stroke(); } c.restore(); }
      }
    }
  }
  const upd = WB.updateHands, drw = WB.drawHands;
  WB.updateHands = function (dt) { upd(dt); update(WB.G, dt); };
  WB.drawHands = function (c, g, time) { drw(c, g, time); drawTop(c, g, time); };

  // ---------- définition de la capacité ----------
  if (WB.ABIL && WB.ABIL.glut) {
    const d = WB.ABIL.glut;
    d.cd = function (L) { return 2; };
    d.range = function (L) { return RANGE; };
    d.desc = 'Passif : dagues en rafale sur les ennemis proches (dégâts croissants sur la même cible). Niv.2 : multicible, toucher un ennemi le verrouille, tourbillon. Niv.3-5 : vol de capacités.';
    d.cast = function (f, ab, aim) {   // le bouton verrouille (ou libère) l'ennemi le plus proche, à partir du niveau 2
      const g = WB.G; if (ab.lvl < 2) return false; const th = st(f); const t = aim && aim.target;
      if (th.lock) { th.lock = null; return true; }
      if (!t) return false; return T.lockAt(g, f, t.x, t.y);
    };
    d.ai = { max: function () { return 0; }, min: 0, cond: function () { return false; } };
  }
})(window.WB);
