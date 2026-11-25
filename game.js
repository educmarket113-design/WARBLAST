'use strict';
(function (WB) {
  const TS = WB.TS, A = WB.ABIL, WW = WB.WW, WH = WB.WH, TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const MATCH_TIME = 240;
  const TIMED = ['frozen', 'stun', 'silence', 'root', 'slowT', 'shield', 'invis', 'invuln'];
  const MELEE = { ice: 1, scythe: 1, shield: 1, invis: 1, wind: 1, water: 1, dash: 1 };
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  WB.randomSpec = function () {
    const sp = { char: Math.floor(Math.random() * WB.CHARS.length), color: Math.floor(Math.random() * WB.COLORS.length) };
    for (const k of ['cape', 'armor', 'hat', 'scarf', 'shoes']) sp[k] = pick(WB.EQUIP[k]).id;
    return sp;
  };

  WB.startMatch = function (cfg) {
    const W = WB.makeWorld(cfg.arena, (Math.random() * 1e9) | 0);
    const G = WB.G = {
      cfg: cfg, world: W, F: [], pickups: [], projs: [], fxs: [], walls: [], turrets: [], clowns: [], holes: [], hands: [], timers: [], spiders: [], feed: [],
      t: 0, timeLeft: cfg.duration || MATCH_TIME, score: {}, over: false, shakeV: 0, cam: { x: 0, y: 0 }, player: null, swap: null, spawnT: 0, heartT: 0, coinsGot: 0,
      mode: WB.MODES.find(m => m.id === cfg.mode), results: null, paused: false, started: false, countdown: 3.2
    };
    let idc = 1;

    function mkFighter(o) {
      const lv = o.level || 1;
      return {
        id: idc++, kind: o.kind, name: o.name, spec: o.spec, team: o.team, level: lv, x: o.x || 0, y: o.y || 0, vx: 0, vy: 0, kx: 0, ky: 0,
        r: o.r || 22, scale: o.scale || 1, maxhp: o.maxhp, hp: o.maxhp, bombs: 10, bombCd: 0, slots: new Array(o.nslots != null ? o.nslots : WB.slotCount(lv)).fill(null),
        st: {}, dots: [], alive: true, respawnT: 0, kills: 0, deaths: 0, mk: 0, coins: 0, face: { x: 1, y: 0 }, aimLast: { x: 1, y: 0 }, walk: 0, t: Math.random() * 10,
        hurtT: 0, flash: 0, lastHit: null, beacon: null, speed: o.speed || 205, owner: o.owner || null, thralls: [], want: { x: 0, y: 0 }, moving: false, dash: null,
        fixed: o.fixed || null, life: o.life || 0, drown: 0, ventT: 0, jumpH: 0, necro: null, shieldHit: null, invisHit: null,
        ai: o.kind === 'player' ? null : { thinkT: Math.random() * 0.4, target: null, goal: null, wg: null, wanderT: 0, path: null, pathI: 0, pathT: 0, pgoal: null, strafe: 1, strafeT: 0, mode: 'wander', jit: o.jit == null ? 0.14 : o.jit }
      };
    }
    function hpFor(lv) { return 300 + 30 * (lv - 1); }

    // ---- création des combattants ----
    const mode = G.mode, names = shuffle(WB.NAMES.filter(n => n !== cfg.name)), total = mode.total, plv = cfg.playerLevel || 1;
    const teamOf = i => mode.teams ? Math.floor(i / mode.size) : i;
    for (let i = 0; i < total; i++) {
      const isP = i === 0, lv = isP ? plv : clamp(plv + Math.floor(rnd(-1, 2.01)), 1, WB.MAXLV);
      const f = mkFighter({ kind: isP ? 'player' : 'bot', name: isP ? (cfg.name || 'Joueur') : names[i % names.length], spec: isP ? cfg.spec : WB.randomSpec(), team: teamOf(i), level: lv, maxhp: hpFor(lv), jit: 0.12 + Math.random() * 0.08, speed: 198 + Math.random() * 12 });
      G.F.push(f); if (isP) G.player = f;
    }
    const teamBase = {};
    G.F.forEach((f, i) => {
      let sp;
      if (mode.teams) { if (!teamBase[f.team]) teamBase[f.team] = W.spawns[f.team % W.spawns.length]; sp = W.nearFloor(teamBase[f.team].x, teamBase[f.team].y, 3); } else sp = W.spawns[i % W.spawns.length];
      f.x = sp.x; f.y = sp.y; f.st.invuln = 3.2;
    });
    // sbires noirs
    const BOSS_SLOTS = [[['fire', 3], ['jump', 3], ['bolt', 3]], [['ice', 3], ['dash', 3], ['spider', 4]]];
    function addMinion(boss, k) {
      const lv = boss ? 5 : 1 + Math.floor(Math.random() * 3);
      const f = mkFighter({ kind: boss ? 'boss' : 'minion', name: boss ? 'BOSS' : 'Sbire', spec: null, team: 'S', level: lv, maxhp: boss ? 900 : 70 + 10 * lv, r: boss ? 36 : 22, scale: boss ? 1.7 : 1, speed: boss ? 150 : 165, jit: boss ? 0.08 : 0.25, nslots: boss ? 3 : lv, fixed: boss ? BOSS_SLOTS[k % 2] : null });
      if (boss) f.fixed.forEach((s, i) => { f.slots[i] = WB.newAbility(s[0], s[1]); });
      const p = W.randomFloor(1); f.x = p.x; f.y = p.y; f.home = { x: p.x, y: p.y }; G.F.push(f); return f;
    }
    for (let i = 0; i < 10; i++) addMinion(false);
    for (let i = 0; i < 2; i++) addMinion(true, i);
    for (const h of W.spiderHomes) G.spiders.push({ x: h.x, y: h.y, hx: h.x, hy: h.y, hp: 30, r: 16, alive: true, respawn: 0, biteCd: 0, tx: h.x, ty: h.y, wt: 0, t: Math.random() * 5, ang: 0 });
    for (const f of G.F) if (f.team !== 'S' && G.score[f.team] == null) G.score[f.team] = 0;

    // ---- utilitaires ----
    G.sfx = (n, v) => { if (!G.muteSfx) WB.snd.play(n, v); };
    G.shake = v => { G.shakeV = Math.max(G.shakeV, v); };
    G.later = (d, fn) => G.timers.push({ t: d, fn: fn });
    G.fx = function (type, x, y, o) {
      o = o || {}; const e = Object.assign({ type: type, x: x, y: y, t: 0, life: 0.5 }, o);
      if (type === 'burst') { e.ps = []; for (let i = 0; i < (o.n || 10); i++) { const a = Math.random() * TAU, s = rnd(40, 170); e.ps.push({ vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: rnd(2, 5) }); } }
      if (type === 'snow') { e.ps = []; for (let i = 0; i < 16; i++) { const a = Math.random() * TAU, d = Math.random() * (o.r || 100); e.ps.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, r: rnd(3, 8) }); } }
      if (type === 'bolt') { e.pts = []; let px = x + rnd(-30, 30), py = y - 420; e.pts.push([px, py]); while (py < y) { py += rnd(30, 60); px += rnd(-26, 26); e.pts.push([Math.abs(py - y) < 40 ? x : px, Math.min(py, y)]); } }
      if (G.fxs.length < 300) G.fxs.push(e); return e;
    };
    G.text = function (x, y, txt, col, size) { G.fx('text', x, y - 20, { txt: txt, col: col || '#fff', size: size || 15, life: 0.8 }); };
    G.enemiesIn = function (f, x, y, r) {
      const out = [];
      for (const t of G.F) { if (!t.alive || t.team === f.team || (t.st.jump || t.ghost)) continue; if (Math.hypot(t.x - x, t.y - y) <= r + t.r) out.push(t); }
      return out;
    };
    G.visibleTo = function (f, t) { if (t.st.invis > 0 && dist(f, t) > 80) return false; return W.los(f.x, f.y, t.x, t.y); };
    G.nearest = function (f, maxD) {
      let best = null, bd = maxD || 1e9;
      for (const t of G.F) { if (!t.alive || t.team === f.team || (t.st.jump || t.ghost)) continue; const d = dist(f, t); if (d < bd && G.visibleTo(f, t)) { bd = d; best = t; } }
      return best;
    };
    G.autoAim = function (f, ab) {
      const def = A[ab.id], R = def.range(ab.lvl), t = G.nearest(f, def.type === 'zone' ? R : R * 1.15);
      if (t) { const d = dist(f, t) || 1; return { x: (t.x - f.x) / d, y: (t.y - f.y) / d, m: clamp(d / R, 0.25, 1), target: t }; }
      const d0 = f.aimLast || f.face; return { x: d0.x, y: d0.y, m: 0.7 };
    };

    // ---- statuts, dégâts ----
    G.status = function (t, name, dur) {
      if (!t.alive || (t.st.jump || t.ghost)) return;
      if (t.kind === 'boss') dur *= 0.5;
      if (name === 'frozen') { t.vx = t.vy = 0; }
      t.st[name] = Math.max(t.st[name] || 0, dur);
    };
    G.knock = function (t, dx, dy, force) { if (!t.alive || (t.st.jump || t.ghost)) return; if (t.kind === 'boss') force *= 0.5; t.kx += dx * force; t.ky += dy * force; };
    G.burn = function (t, total, dur, src, ab) { if (WB.shieldCovers && WB.shieldCovers(t, src)) return; if (t.dots.length > 4) t.dots.shift(); t.dots.push({ type: 'taper', total: total, dur: dur, left: dur, src: src, ab: ab, acc: 0 }); };
    G.dotFlat = function (t, total, dur, src, ab) { if (t.dots.length > 4) t.dots.shift(); t.dots.push({ type: 'flat', total: total, dur: dur, left: dur, src: src, ab: ab, acc: 0 }); };
    G.damage = function (t, amt, src, ab, opt) {
      opt = opt || {};
      if (G.srcOverride && src === G.srcOverride.from) { src = G.srcOverride.to; amt *= G.srcOverride.mul || 1; }
      if (!t.alive || amt <= 0) return;
      if (t.st.shield > 0 || t.st.jump || t.st.invuln > 0) return;
      if (WB.shieldFilter && !opt.noShield) { amt = WB.shieldFilter(t, amt, src, ab, opt); if (amt <= 0) return; }
      if (t.thralls.length && !opt.noRedirect) { const th = t.thralls.find(x => x.alive && (x.thrall || x.kind === 'golem') && dist(x, t) < 560); if (th) { G.fx('burst', th.x, th.y, { col: '#8affc8', n: 4, life: 0.3 }); G.damage(th, amt, src, ab, Object.assign({}, opt, { noRedirect: true })); return; } }
      let s = src; if (s && (s.kind === 'thrall' || s.kind === 'golem') && s.owner) s = s.owner; else if (s && s.thrall && s.thrall.owner) s = s.thrall.owner;
      if (s && s.kind === 'minion' && (t.kind === 'player' || t.kind === 'bot')) amt *= 0.5; else if (s && s.kind === 'boss' && (t.kind === 'player' || t.kind === 'bot')) amt *= 0.7;
      t.hp -= amt; t.hurtT = 0.5; if (!opt.dot) t.flash = 0.12;
      if (s && s !== t) t.lastHit = { by: s, ab: ab, t: G.t };
      if (!opt.dot && amt >= 3) G.text(t.x, t.y - t.r * t.scale, Math.round(amt), t === G.player ? '#ff5a5a' : '#fff', amt >= 30 ? 20 : 15);
      if (t === G.player && !opt.dot) G.shake(Math.min(7, amt / 5));
      if (!opt.dot && amt >= 3) { const pl = G.player; if (t === pl) G.sfx('impact'); else if (s === pl) G.sfx('impact', 0.6); }
      if (t.hp <= 0) G.kill(t, s, ab);
    };
    G.heal = function (f, amt) { f.hp = Math.min(f.maxhp, f.hp + amt); G.text(f.x, f.y - 26, '+' + Math.round(amt), '#5aff8a', 15); G.fx('burst', f.x, f.y, { col: '#7dff9a', n: 8, life: 0.5 }); };
    function tickDots(f, dt) {
      for (let i = f.dots.length - 1; i >= 0; i--) {
        const d = f.dots[i]; d.left -= dt;
        const dps = d.type === 'taper' ? 2 * d.total / d.dur * Math.max(0, d.left) / d.dur : d.total / d.dur;
        d.acc += dps * dt; if (d.acc >= 2 && !(f.st.shield > 0)) { G.damage(f, d.acc, d.src, d.ab, { dot: true, noRedirect: true }); d.acc = 0; if (!f.alive) return; }
        if (d.left <= 0) f.dots.splice(i, 1);
      }
    }

    // ---- éliminations ----
    function levelAbility(f, abId) {
      if (!abId) return; const ab = f.slots.find(s => s && s.id === abId); if (!ab) return;
      ab.kills++; let up = false; while (ab.lvl < 5 && ab.kills >= WB.abilXp[ab.lvl]) { ab.lvl++; up = true; }
      if (up) { G.text(f.x, f.y - 40, A[ab.id].name + ' niv.' + ab.lvl, '#ffe27a', 16); if (f === G.player) G.sfx('levelup'); G.fx('ring', f.x, f.y, { r: 50, col: '#ffe27a', life: 0.5, w: 5 }); }
    }
    function mkAI(jit) { return { thinkT: Math.random() * 0.3, target: null, goal: null, wg: null, wanderT: 0, path: null, pathI: 0, pathT: 0, pgoal: null, strafe: 1, strafeT: 0, mode: 'wander', jit: jit == null ? 0.14 : jit }; }
    // Nécromancie : la victime devient esclave. Phase 1 : libérée si elle survit assez longtemps.
    // Si elle tombe, elle renaît esclave (phase 2) et ne peut plus être reprise par son joueur.
    G.enthrall = function (owner, v, L) {
      if (!v.alive || v.thrall || owner === v) return;
      owner.thralls = owner.thralls.filter(x => x.alive && x.thrall);
      while (owner.thralls.length >= L) G.release(owner.thralls.shift());
      v.thrall = { owner: owner, phase: 1, t: 6 + 1.5 * L, T: 6 + 1.5 * L, origTeam: v.team, L: L };
      v.team = owner.team; v.owner = owner; v.ai = v.ai || mkAI(0.12); v.ai.target = null; v.ai.mode = 'follow'; v.want.x = v.want.y = 0;
      owner.thralls.push(v); if (v === G.player) { G.swap = null; WB.input.reset && WB.input.reset(); }
      G.fx('ring', v.x, v.y, { r: 70, col: '#8affc8', life: 0.6, w: 7 }); G.fx('burst', v.x, v.y, { col: '#8affc8', n: 14, life: 0.6 }); G.sfx('spear');
    };
    G.release = function (v) {
      const th = v.thrall; if (!th) return; v.thrall = null; v.owner = null; v.team = th.origTeam;
      if (th.owner) th.owner.thralls = th.owner.thralls.filter(x => x !== v);
      if (v.ai) { v.ai.target = null; v.ai.mode = 'wander'; }
      if (v.alive) { G.fx('ring', v.x, v.y, { r: 60, col: '#ffffff', life: 0.5, w: 5 }); G.text(v.x, v.y - 50, 'Libéré', '#bfffe0', 16); }
    };
    // ---- Voleur : avale un joueur et utilise ses capacités un moment ----
    G.swallow = function (f, v, L) {
      const dur = 4 + L; v.swallowed = { by: f }; v.ghost = true; v.vx = v.vy = 0; f.swallow = { v: v, t: dur, T: dur };
      const stolen = v.slots.filter(Boolean).map(x => Object.assign(WB.newAbility(x.id, x.lvl), { stolen: true, form: x.id === 'summon' ? (x.form || 'shark') : undefined }));
      f.slots = f.slots.concat(stolen); if (v === G.player) { G.swap = null; G.formPrompt = null; WB.input.reset && WB.input.reset(); }
      if (v.ai) v.ai.target = null;
      G.fx('tongue', f.x, f.y, { x2: v.x, y2: v.y, life: 0.4 }); G.fx('ring', f.x, f.y, { r: 60, col: '#ff8ab0', life: 0.5, w: 6 }); G.sfx('eat');
    };
    G.spit = function (f) {
      const sw = f.swallow; if (!sw) return; const v = sw.v; f.swallow = null; f.slots = f.slots.filter(x => !(x && x.stolen));
      if (v && v.swallowed) { v.swallowed = null; if (!v.sharkHold) v.ghost = false; const a = Math.random() * PI2; v.x = f.x + Math.cos(a) * 44; v.y = f.y + Math.sin(a) * 44; W.collide(v, G.walls); v.st.invuln = 1.0; v.st.stun = 0.6; G.fx('burst', v.x, v.y, { col: '#ff8ab0', n: 16, life: 0.6 }); G.fx('ring', v.x, v.y, { r: 50, col: '#ffffff', life: 0.5, w: 5 }); G.text(v.x, v.y - 40, 'Recraché', '#ffd0e4', 15); G.sfx('heal'); }
    };
    // ---- Invocation ----
    G.shark = function (f, t, L) {
      const x = t.x, y = t.y; G.fx('shark', x, y, { life: 1.6 }); G.sfx('water');
      G.later(0.55, () => {
        const grp = G.enemiesIn(f, x, y, 72); for (const v of grp) { v.ghost = true; v.sharkHold = true; v.vx = v.vy = 0; } G.sfx('swing');
        G.later(0.6, () => { for (const v of grp) { v.sharkHold = false; if (!v.alive) continue; if (!v.swallowed) v.ghost = false; v.x = x + (Math.random() - 0.5) * 40; v.y = y + (Math.random() - 0.5) * 40; G.damage(v, (24 + 6 * L) * (v === t ? 1 : 0.6), f, 'summon'); G.status(v, 'stun', 1.5 + 0.2 * L); G.fx('burst', v.x, v.y, { col: '#7fc4ff', n: 12, life: 0.5 }); } G.sfx('water'); });
      });
    };
    G.addGolem = function (f, L) {
      const mine = f.thralls.filter(x => x.kind === 'golem' && x.alive); while (mine.length >= (L >= 5 ? 2 : 1)) { const o = mine.shift(); o.hp = 0; G.kill(o, null, null); }
      const g = mkFighter({ kind: 'golem', name: 'Golem', spec: null, team: f.team, level: f.level, maxhp: 110 + 45 * L, x: f.x + 36, y: f.y, r: 28, scale: 1.4, speed: 185, nslots: 0, owner: f, life: 14 + 3 * L });
      g.bombs = 0; g.golemL = L; g.stoneT = 0.8; g.ai.mode = 'follow'; G.F.push(g); f.thralls.push(g);
      G.fx('ring', g.x, g.y, { r: 70, col: '#b8a48a', life: 0.5, w: 7 }); G.fx('burst', g.x, g.y, { col: '#9a9fac', n: 18, life: 0.6 }); G.shake(4); G.sfx('wall');
    };
    G.addDragon = function (f, x, y, L) {
      const mine = G.turrets.filter(t => t.dragon && t.owner === f), cap = Math.ceil(L / 2); while (mine.length >= cap) { const o = mine.shift(); o.life = 0; }
      G.turrets.push({ x: x, y: y, hp: 90 + 20 * L, maxhp: 90 + 20 * L, owner: f, L: L, life: 12 + 2 * L, cd: 0.5, ang: 0, dragon: true });
      G.fx('ring', x, y, { r: 60, col: '#ff7a1c', life: 0.5, w: 7 }); G.fx('burst', x, y, { col: '#ff9a3c', n: 16, life: 0.6 }); G.sfx('fire');
    };
    function addPickup(p) { p.t = 0; p.noPick = p.noPick || 0; G.pickups.push(p); return p; }
    G.addPickup = addPickup;
    G.kill = function (t, src, ab) {
      if (!t.alive) return;
      if (t.swallow) G.spit(t); let killer = src; if (killer && (killer.kind === 'thrall' || killer.kind === 'golem') && killer.owner) killer = killer.owner; else if (killer && killer.thrall && killer.thrall.owner) killer = killer.thrall.owner;
      if (t.thrall) { const th = t.thrall; if (th.owner && th.owner.alive && th.phase === 1) { th.phase = 2; th.t = 45; t.hp = Math.round(t.maxhp * 0.6); t.st = { invuln: 1 }; t.dots = []; G.fx('ring', t.x, t.y, { r: 70, col: '#8affc8', life: 0.7, w: 7 }); G.fx('burst', t.x, t.y, { col: '#8affc8', n: 16, life: 0.7 }); G.text(t.x, t.y - 50, 'Renaît esclave', '#8affc8', 16); G.sfx('spear'); return; } G.release(t); }
      if (!killer && t.lastHit && G.t - t.lastHit.t < 8) { killer = t.lastHit.by; ab = ab || t.lastHit.ab; }
      const slots = t.slots.slice(), necro = t.necro;
      { const pl = G.player; if (pl) { if (killer === pl && t !== pl) G.sfx('kill'); else if (t === pl) G.sfx('ko'); else if (Math.hypot(pl.x - t.x, pl.y - t.y) < 500) G.sfx('ko', 0.5); } }
      t.alive = false; t.hp = 0; t.st = {}; t.dots = []; t.dash = null; t.deaths++; t.vx = t.vy = t.kx = t.ky = 0;
      G.fx('burst', t.x, t.y, { col: '#fff', n: 14, life: 0.6 }); G.fx('ring', t.x, t.y, { r: 50, col: '#fff', life: 0.4, w: 4 });
      if (t.kind === 'thrall' || t.kind === 'golem') { G.fx('burst', t.x, t.y, { col: '#aaa', n: 14, life: 0.6 }); const i = G.F.indexOf(t); if (i >= 0) G.F.splice(i, 1); if (t.owner) t.owner.thralls = t.owner.thralls.filter(x => x !== t); return; }
      if (t.kind === 'player' || t.kind === 'bot') {
        for (const th of t.thralls.slice()) { if (th.kind === 'golem') { th.hp = 0; G.kill(th, null, null); } else G.release(th); } t.thralls = [];
      }
      const isFighter = t.kind === 'player' || t.kind === 'bot' || t.kind === 'boss';
      if (killer && killer !== t) {
        if (isFighter) { killer.kills++; const pts = t.kind === 'boss' ? 3 : 1; if (killer.kind === 'player' || killer.kind === 'bot') G.score[killer.team] = (G.score[killer.team] || 0) + pts; }
        else killer.mk++;
        levelAbility(killer, ab);
        if (killer === G.player) { G.text(killer.x, killer.y - 60, t.kind === 'minion' ? 'Sbire éliminé' : 'ÉLIMINÉ !', '#ffd24a', 18); }
      }
      if (t.kind !== 'minion' || killer) {
        const nm = killer ? killer.name : 'Un piège';
        G.feed.unshift({ a: nm, b: t.name, ca: killer ? (killer.team === 'S' ? '#bbb' : WB.TEAM_COLORS[killer.team] || '#fff') : '#bbb', t: G.t, cb: t.team === 'S' ? '#ff8a8a' : '#fff' });
        if (G.feed.length > 5) G.feed.pop();
      }
      // butin
      const coins = t.kind === 'boss' ? 8 : isFighter ? 3 : 1;
      for (let i = 0; i < coins; i++) addPickup({ kind: 'coin', x: t.x + rnd(-26, 26), y: t.y + rnd(-26, 26), noPick: G.t + 0.4 });
      if (t.kind === 'boss') { for (let i = 0; i < 2; i++) addPickup({ kind: 'bloc', id: WB.randomAbility(), lvl: 2 + Math.floor(Math.random() * 2), x: t.x + rnd(-40, 40), y: t.y + rnd(-40, 40), noPick: G.t + 0.6 }); addPickup({ kind: 'heart', x: t.x, y: t.y + 30, noPick: G.t + 0.5 }); }
      else {
        const eq = slots.filter(s => s);
        if (eq.length && Math.random() < 0.9) { const s = pick(eq); addPickup({ kind: 'bloc', id: s.id, lvl: s.lvl, x: t.x, y: t.y, noPick: G.t + 0.6 }); }
        else if (Math.random() < 0.3) addPickup({ kind: 'bloc', id: WB.randomAbility(), lvl: 1, x: t.x, y: t.y, noPick: G.t + 0.6 });
        if (Math.random() < 0.3) addPickup({ kind: 'heart', x: t.x + 20, y: t.y + 10, noPick: G.t + 0.5 });
      }
      t.respawnT = t.kind === 'minion' ? 9 : t.kind === 'boss' ? 40 : 3.2;
      if (t === G.player && G.swap) G.swap = null;
    };

    function respawn(f) {
      let best = null, bd = -1;
      for (let k = 0; k < 10; k++) {
        const s = pick(W.spawns); let md = 1e9; for (const e of G.F) if (e.alive && e.team !== f.team) md = Math.min(md, dist(e, s));
        if (md > bd) { bd = md; best = s; }
      }
      const p = W.nearFloor(best.x, best.y, 2); f.x = p.x; f.y = p.y;
      f.alive = true; f.hp = f.maxhp; f.st = { invuln: 2.2 }; f.dots = []; f.vx = f.vy = 0; f.beacon = null; f.dash = null; f.drown = 0;
      if (f.fixed) f.fixed.forEach((s, i) => { f.slots[i] = WB.newAbility(s[0], s[1]); }); else f.slots = new Array(f.slots.length).fill(null);
      if (f.ai) { f.ai.target = null; f.ai.path = null; }
      G.fx('ring', f.x, f.y, { r: 50, col: '#fff', life: 0.5, w: 5 });
    }

    // ---- armes : bombes, projectiles ----
    G.proj = function (o) {
      const p = Object.assign({ life: 1, r: 10, speed: 400, kind: 'x' }, o); p.x0 = p.x; p.y0 = p.y; G.projs.push(p); return p;
    };
    G.throwBomb = function (f, aim) {
      if (!f.alive || f.bombs <= 0 || f.bombCd > 0 || f.st.frozen > 0 || f.st.jump || f.dash) return false;
      f.bombs--; f.bombCd = 0.9;
      const d = clamp((aim.m == null ? 0.6 : aim.m) * 400, 90, 400), a = Math.atan2(aim.y, aim.x);
      let tx = f.x + Math.cos(a) * d, ty = f.y + Math.sin(a) * d;
      // arrêt devant un obstacle
      const n = Math.ceil(d / 20); let lx = f.x, ly = f.y;
      for (let i = 1; i <= n; i++) { const x = f.x + Math.cos(a) * d * i / n, y = f.y + Math.sin(a) * d * i / n; if (W.solidAt(x, y)) { tx = lx; ty = ly; break; } lx = x; ly = y; }
      const dd = Math.max(30, Math.hypot(tx - f.x, ty - f.y));
      G.proj({ kind: 'bomb', x: f.x, y: f.y, tx: tx, ty: ty, u: 0, T: Math.max(0.28, dd / 420), owner: f, ab: 'bomb' });
      G.sfx('throw'); f.armT = 0.3; f.aimLast = { x: aim.x, y: aim.y }; return true;
    };
    G.splash = function (f, x, y, r, dmg, ab, o) {
      o = o || {}; const hit = [];
      for (const t of G.F) {
        if (!t.alive || t.team === f.team || (t.st.jump || t.ghost)) continue;
        if (Math.hypot(t.x - x, t.y - y) > r + t.r) continue;
        hit.push(t); G.damage(t, dmg, f, ab);
        const a = Math.atan2(t.y - y, t.x - x); if (o.knock) G.knock(t, Math.cos(a), Math.sin(a), o.knock); if (o.stun) G.status(t, 'stun', o.stun);
      }
      for (const s of G.spiders) if (s.alive && Math.hypot(s.x - x, s.y - y) < r + s.r) G.hitSpider(s, dmg, f);
      for (const w of G.walls) if (rectDist(w, x, y) < r) hitWall(w, dmg);
      for (const tu of G.turrets) if (tu.owner.team !== f.team && Math.hypot(tu.x - x, tu.y - y) < r + 18) hitTurret(tu, dmg);
      return hit;
    };
    G.arcHit = function (f, x, y, r, ang, half, dmg, ab) {
      for (const t of G.F) {
        if (!t.alive || t.team === f.team || (t.st.jump || t.ghost)) continue;
        const d = Math.hypot(t.x - x, t.y - y); if (d > r + t.r) continue;
        let da = Math.atan2(t.y - y, t.x - x) - ang; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
        if (Math.abs(da) <= half || d < 40) { G.damage(t, dmg, f, ab); G.knock(t, Math.cos(ang), Math.sin(ang), 200); }
      }
      for (const s of G.spiders) if (s.alive && Math.hypot(s.x - x, s.y - y) < r) G.hitSpider(s, dmg, f);
      for (const w of G.walls) if (rectDist(w, x, y) < r) hitWall(w, dmg);
    };
    function rectDist(w, x, y) { const dx = Math.max(Math.abs(x - w.x) - w.w / 2, 0), dy = Math.max(Math.abs(y - w.y) - w.h / 2, 0); return Math.hypot(dx, dy); }
    function hitWall(w, dmg) { if (w.grp && WB.hitWallBlock) return WB.hitWallBlock(w, dmg); w.hp -= dmg; w.flash = 0.1; if (w.hp <= 0) { w.life = 0; G.fx('burst', w.x, w.y, { col: '#b8a48a', n: 14, life: 0.6 }); G.sfx('wall'); } }
    function hitTurret(tu, dmg) { tu.hp -= dmg; tu.flash = 0.1; if (tu.hp <= 0) { tu.life = 0; G.fx('burst', tu.x, tu.y, { col: '#aaa', n: 12, life: 0.5 }); } }
    G.hitSpider = function (s, dmg, src) {
      s.hp -= dmg; G.fx('burst', s.x, s.y, { col: '#8a5ac8', n: 5, life: 0.3 });
      if (s.hp <= 0 && s.alive) { s.alive = false; s.respawn = 18; for (let i = 0; i < 3; i++) addPickup({ kind: 'coin', x: s.x + rnd(-20, 20), y: s.y + rnd(-20, 20), noPick: G.t + 0.3 }); if (src && src.kind === 'player') G.text(s.x, s.y, 'Araignée !', '#d8b8ff', 14); }
    };
    G.addWall = w => { w.flash = 0; G.walls.push(w); };
    G.addTurret = t => { const mine = G.turrets.filter(x => x.owner === t.owner); while (mine.length >= t.L) { const o = mine.shift(); o.life = 0; } G.turrets.push(t); };
    G.addClown = c => G.clowns.push(c);
    G.clownCount = f => G.clowns.filter(c => c.owner === f).length;
    G.addHole = h => { G.holes.push(h); };
    G.teleportRandom = function (t) {
      let best = null, bd = -1;
      for (let k = 0; k < 14; k++) { const p = W.randomFloor(1); const d = dist(p, t); if (d > bd && d > 500) { bd = d; best = p; } }
      if (!best) best = W.randomFloor(1);
      G.fx('burst', t.x, t.y, { col: '#e0b0ff', n: 14, life: 0.5 }); t.x = best.x; t.y = best.y; t.vx = t.vy = t.kx = t.ky = 0;
      G.fx('burst', t.x, t.y, { col: '#e0b0ff', n: 14, life: 0.5 }); if (t.ai) t.ai.path = null;
    };

    // ---- utilisation des capacités ----
    G.canCast = f => f.alive && !(f.st.frozen > 0) && !(f.st.silence > 0) && !(f.st.jump || f.ghost) && G.started;
    G.useSlot = function (f, i, aim) {
      const ab = f.slots[i]; if (ab && ab.id === 'tp' && f.tp && WB.tpNext) return WB.tpNext(f, ab, aim);
      if (!ab || !G.canCast(f) || ab.cd > 0 || ab.gap > 0) return false;
      const def = A[ab.id]; if (def.type === 'aim' && aim.m == null) aim.m = 0.7;
      G.muteSfx = true; let r; try { r = def.cast(f, ab, aim); } finally { G.muteSfx = false; } if (r === false) return false;
      f.castT = 0.4; if (WB.evoFx) WB.evoFx(f, ab); { const pl = G.player, dd = pl ? Math.hypot(pl.x - f.x, pl.y - f.y) : 0, vv = f === pl ? 1 : Math.max(0, 1 - dd / 700) * 0.8; if (vv > 0.05) WB.snd.play('ab_' + ab.id, vv); }
      // 5 utilisations par série, puis recharge de toute la série ; chaque capacité a ses propres charges
      ab.n = (ab.n == null ? WB.maxCharges(ab) : ab.n) - 1; ab.gap = 0.4; if (ab.n <= 0) { ab.n = 0; ab.cd = def.cd(ab.lvl) * WB.cdMul(ab.id) * (f.kind === 'boss' ? 1.7 : f.kind === 'minion' ? 1.4 : 1); }
      f.aimLast = { x: aim.x, y: aim.y }; return true;
    };
    G.chain = function (f, list, aim) {
      let n = 0;
      list.forEach((idx, k) => G.later(k * 0.25, () => { if (!f.alive) return; let a = aim; if (aim.target && aim.target.alive) { const d = dist(f, aim.target) || 1; a = { x: (aim.target.x - f.x) / d, y: (aim.target.y - f.y) / d, m: aim.m, target: aim.target }; } G.useSlot(f, idx, Object.assign({}, a)); }));
      return n;
    };
    G.eat = function (f, id) {
      f.eat = { t: 0, dur: 0.85, id: id }; const col = A[id].col;
      if (f === G.player) { G.sfx('eat'); G.fx('icon', f.x, f.y - 46, { id: id, life: 1.1 }); }
      G.later(0.3, () => G.fx('burst', f.x, f.y - 6, { col: '#ffe9b0', n: 6, life: 0.4 }));
      G.later(0.6, () => G.fx('burst', f.x, f.y - 6, { col: '#ffe9b0', n: 6, life: 0.4 }));
      G.later(0.85, () => { G.fx('ring', f.x, f.y, { r: 46, col: col, life: 0.5, w: 6 }); G.fx('burst', f.x, f.y, { col: col, n: 14, life: 0.6 }); });
    };
    G.swapSlot = function (i) {
      const sw = G.swap, f = G.player; if (!sw || !f.alive) return;
      const old = f.slots[i]; f.slots[i] = WB.newAbility(sw.pk.id, Math.max(sw.pk.lvl, WB.startLv(f)));
      const idx = G.pickups.indexOf(sw.pk); if (idx >= 0) G.pickups.splice(idx, 1);
      if (old) addPickup({ kind: 'bloc', id: old.id, lvl: old.lvl, x: f.x, y: f.y, noPick: G.t + 1.5, declined: G.t + 1.5 });
      G.eat(f, sw.pk.id); G.swap = null;
    };
    G.declineSwap = function () { if (G.swap) { G.swap.pk.declined = G.t + 6; G.swap = null; } };

    // ---- bloc / pièces / coeurs ----
    function nearestPickup(f, kind, maxD) {
      let best = null, bd = maxD;
      for (const p of G.pickups) { if (p.kind !== kind || p.noPick > G.t) continue; const d = dist(f, p); if (d < bd) { bd = d; best = p; } }
      return best;
    }
    function collect(f) {
      for (let i = G.pickups.length - 1; i >= 0; i--) {
        const p = G.pickups[i]; if (p.noPick > G.t) continue;
        if (Math.abs(p.x - f.x) > 60 || Math.abs(p.y - f.y) > 60) continue;
        if (Math.hypot(p.x - f.x, p.y - f.y) > f.r + 18) continue;
        const pl = f === G.player;
        if (p.kind === 'coin') { if (f.kind === 'player' || f.kind === 'bot') { f.coins++; if (pl) { G.coinsGot++; G.sfx('coin'); } G.pickups.splice(i, 1); } }
        else if (p.kind === 'heart') { if (f.hp < f.maxhp && f.kind !== 'thrall' && f.kind !== 'golem') { G.heal(f, 100); if (pl) G.sfx('heal'); G.pickups.splice(i, 1); } }
        else if (p.kind === 'chest') {
          if (f.kind !== 'player' && f.kind !== 'bot') continue; if (f.thrall) continue;
          G.pickups.splice(i, 1); G.sfx('chest'); G.fx('burst', p.x, p.y, { col: '#ffd24a', n: 22, life: 0.7 }); G.fx('ring', p.x, p.y, { r: 70, col: '#ffd24a', life: 0.5, w: 6 });
          const n = 2 + (Math.random() < 0.4 ? 1 : 0);
          for (let k = 0; k < n; k++) { const a = k / n * PI2 + Math.random(); addPickup({ kind: 'bloc', id: WB.randomAbility(), lvl: 2 + (Math.random() < 0.3 ? 1 : 0), mystery: k === 2, x: p.x + Math.cos(a) * 38, y: p.y + Math.sin(a) * 30, noPick: G.t + 0.45, pop: 1 }); }
          if (Math.random() < 0.5) addPickup({ kind: 'heart', x: p.x, y: p.y + 30, noPick: G.t + 0.45 });
        }
        else if (p.kind === 'bloc') {
          if (f.kind === 'boss' || f.kind === 'thrall' || f.thrall || f.swallow) continue;
          if (p.mystery) { p.id = WB.randomAbility(); p.lvl = Math.random() < 0.7 ? 1 : (Math.random() < 0.7 ? 2 : 3); p.mystery = false; p.revealed = true; }
          const idx = f.slots.indexOf(null);
          if (idx >= 0) { f.slots[idx] = WB.newAbility(p.id, Math.max(p.lvl, WB.startLv(f))); G.pickups.splice(i, 1); G.eat(f, p.id); }
          else if (pl) { if (!(p.declined > G.t) && (!G.swap || G.swap.pk !== p)) G.swap = { pk: p, t: 7 }; }
          else if (f.slots.length) {
            let wi = 0; for (let k = 1; k < f.slots.length; k++) if (f.slots[k].lvl < f.slots[wi].lvl) wi = k;
            if (p.lvl > f.slots[wi].lvl || Math.random() < 0.15) { const old = f.slots[wi]; f.slots[wi] = WB.newAbility(p.id, Math.max(p.lvl, WB.startLv(f))); G.eat(f, p.id); G.pickups.splice(i, 1); addPickup({ kind: 'bloc', id: old.id, lvl: old.lvl, x: f.x, y: f.y, noPick: G.t + 2 }); }
          }
        }
      }
    }
    function spawnPickups(dt) {
      G.spawnT -= dt; if (G.spawnT > 0) return; G.spawnT = 0.8;
      let b = 0, h = 0, c = 0, ch = 0; for (const p of G.pickups) { if (p.kind === 'bloc') b++; else if (p.kind === 'heart') h++; else if (p.kind === 'chest') ch++; else c++; }
      const place = () => W.randomFloor(0);
      if (ch < 9 && Math.random() < 0.2) { const p = place(); addPickup({ kind: 'chest', x: p.x, y: p.y }); }
      if (b < 26) { const p = place(); addPickup({ kind: 'bloc', mystery: Math.random() < 0.14, id: WB.randomAbility(), lvl: Math.random() < 0.8 ? 1 : (Math.random() < 0.7 ? 2 : 3), x: p.x, y: p.y }); }
      if (h < 10 && Math.random() < 0.5) { const p = place(); addPickup({ kind: 'heart', x: p.x, y: p.y }); }
      if (c < 70) { const p = place(); addPickup({ kind: 'coin', x: p.x, y: p.y }); }
    }
    for (let i = 0; i < 28; i++) { const p = W.randomFloor(0); addPickup({ kind: 'bloc', mystery: i % 7 === 3, id: WB.randomAbility(), lvl: 1, x: p.x, y: p.y }); }
    for (let i = 0; i < 9; i++) { const p = W.randomFloor(0); addPickup({ kind: 'chest', x: p.x, y: p.y }); }
    for (let i = 0; i < 10; i++) { const p = W.randomFloor(0); addPickup({ kind: 'heart', x: p.x, y: p.y }); }
    for (let i = 0; i < 45; i++) { const p = W.randomFloor(0); addPickup({ kind: 'coin', x: p.x, y: p.y }); }

    // ---- entrée du joueur ----
    function playerInput(f, dt) {
      const inp = WB.input; let mx = inp.move.x, my = inp.move.y; const m = Math.hypot(mx, my);
      if (m > 1) { mx /= m; my /= m; }
      f.want.x = mx; f.want.y = my;
      if (inp.aim.active && inp.aim.m > 0.1) { f.face.x = inp.aim.x; f.face.y = inp.aim.y; f.aimLast = { x: inp.aim.x, y: inp.aim.y }; }
      else if (m > 0.2) { f.face.x = mx / (m || 1); f.face.y = my / (m || 1); f.aimLast = { x: f.face.x, y: f.face.y }; }
    }

    // ---- IA ----
    function unsafeAt(x, y, f) {
      const c = W.codeAt(x, y); if (c === 2) return true; if (W.solidAt(x, y)) return true;
      for (const v of W.vents) { if (Math.abs(v.x - x) < 52 && Math.abs(v.y - y) < 52 && W.ventState(v, G.t) > 0) return true; }
      for (const s of G.spiders) if (s.alive && Math.abs(s.x - x) < 52 && Math.abs(s.y - y) < 52) return true;
      return false;
    }
    function safeDir(f, dx, dy) {
      const m = Math.hypot(dx, dy); if (m < 0.01) return null; const base = Math.atan2(dy, dx);
      for (const off of [0, 0.5, -0.5, 1, -1, 1.6, -1.6]) {
        const a = base + off, cx = Math.cos(a), cy = Math.sin(a);
        if (!unsafeAt(f.x + cx * 34, f.y + cy * 34, f) && !unsafeAt(f.x + cx * 66, f.y + cy * 66, f)) return { x: cx, y: cy };
      }
      return null;
    }
    function prefDist(f) {
      let ranged = false, any = false; for (const s of f.slots) if (s) { any = true; if (!MELEE[s.id]) ranged = true; }
      if (ranged) return 230; if (any) return 95; return 210;
    }
    function followPath(f, gx, gy, dt) {
      const ai = f.ai; ai.pathT -= dt;
      if (!ai.path || ai.pathT <= 0 || !ai.pgoal || Math.hypot(ai.pgoal.x - gx, ai.pgoal.y - gy) > TS * 2) { ai.path = W.path(f.x, f.y, gx, gy); ai.pathI = 0; ai.pathT = 0.8; ai.pgoal = { x: gx, y: gy }; }
      const P = ai.path;
      while (ai.pathI < P.length - 1 && (dist(f, P[ai.pathI]) < 34 || (W.los(f.x, f.y, P[ai.pathI + 1].x, P[ai.pathI + 1].y) && dist(f, P[ai.pathI + 1]) < 200))) ai.pathI++;
      const n = P[Math.min(ai.pathI, P.length - 1)]; return { x: n.x - f.x, y: n.y - f.y };
    }
    function decide(f) {
      const ai = f.ai, sight = f.kind === 'boss' ? 520 : f.kind === 'minion' ? 380 : 540;
      let best = null, bd = 1e9;
      for (const t of G.F) { if (!t.alive || t.team === f.team || (t.st.jump || t.ghost)) continue; const d0 = dist(f, t), d = (f.team !== 'S' && t.team === 'S') ? d0 * 1.5 : d0; if (d0 < sight && d < bd && G.visibleTo(f, t)) { bd = d; best = t; } }
      if (best) bd = dist(f, best);
      if (f.home) { const lim = f.kind === 'boss' ? 560 : 460; if (best && Math.hypot(best.x - f.home.x, best.y - f.home.y) > lim) best = null; if (!best && dist(f, f.home) > lim * 0.7) { ai.target = null; ai.mode = 'goto'; ai.goal = { x: f.home.x, y: f.home.y }; return; } }
      if (WB.tpBait) { const bt = WB.tpBait(f, best, sight); if (bt) best = bt; }
      ai.target = best; ai.mode = 'wander';
      if (f.kind === 'thrall' || f.kind === 'golem' || f.thrall) { ai.mode = best ? 'fight' : 'follow'; return; }
      if (f.hp < f.maxhp * 0.35) {
        const h = nearestPickup(f, 'heart', 900);
        if (h) { ai.mode = 'goto'; ai.goal = { x: h.x, y: h.y }; if (best && bd < 130) ai.mode = 'fight'; return; }
        if (best) { ai.mode = 'flee'; return; }
      }
      if (!f.fixed && f.slots.length && !(best && bd < 280) && f.slots.some(s => !s)) {
        const p = nearestPickup(f, 'bloc', 1000) || nearestPickup(f, 'chest', 800); if (p) { ai.mode = 'goto'; ai.goal = { x: p.x, y: p.y }; return; }
      }
      if (best) { ai.mode = 'fight'; return; }
      if (!ai.wg || dist(f, ai.wg) < 80 || ai.wanderT <= 0) {
        const pk = Math.random() < 0.6 ? (nearestPickup(f, 'coin', 900) || nearestPickup(f, 'heart', 900)) : null;
        ai.wg = pk ? { x: pk.x, y: pk.y } : (f.home ? W.nearFloor(f.home.x + rnd(-260, 260), f.home.y + rnd(-260, 260), 3) : W.randomFloor(0)); ai.wanderT = 6 + Math.random() * 5;
      }
    }
    function aimAt(f, t, ab, def) {
      const d = dist(f, t) || 1, spd = 560, lead = d / spd * 0.7;
      const px = t.x + (t.vx || 0) * lead, py = t.y + (t.vy || 0) * lead;
      let a = Math.atan2(py - f.y, px - f.x) + (Math.random() - 0.5) * 2 * f.ai.jit;
      const R = def && def.range ? def.range(ab ? ab.lvl : 1) : 400;
      let m = clamp(d / R, 0.2, 1);
      if (def && def.ai && def.ai.aimMode === 'tp') m = d < 110 ? 0.8 : 0;
      return { x: Math.cos(a), y: Math.sin(a), m: m, target: t };
    }
    function aiAttack(f) {
      const t = f.ai.target; if (!t || !t.alive || f.st.frozen > 0 || f.st.jump || f.dash || !G.started) return;
      const d = dist(f, t); let casts = 0; const maxC = WB.chainMax(f.level);
      if (!(f.st.silence > 0)) {
        for (let i = 0; i < f.slots.length && casts < maxC; i++) {
          const ab = f.slots[i]; if (!ab || ab.cd > 0 || ab.gap > 0) continue; const def = A[ab.id], ai = def.ai || {};
          const max = ai.max ? ai.max(ab.lvl) : def.range(ab.lvl), min = ai.min || 0;
          if (d > max || d < min) continue; if (ai.cond && !ai.cond(f, ab, t, d)) continue;
          if (Math.random() > (f.kind === 'minion' ? 0.3 : f.kind === 'boss' ? 0.5 : 0.65)) continue;
          if (G.useSlot(f, i, aimAt(f, t, ab, def))) casts++;
        }
      }
      if (casts === 0 && (f.bombs > 0 || f.dome) && f.bombCd <= 0 && d > 110 && d < 390 && Math.random() < 0.5) G.throwBomb(f, aimAt(f, t, null, { range: () => 400 }));
    }
    function aiThink(f, dt) {
      const ai = f.ai; ai.thinkT -= dt; ai.wanderT -= dt;
      if (!G.started) { f.want.x = f.want.y = 0; return; }
      if (ai.thinkT <= 0) { ai.thinkT = f.kind === 'minion' ? 0.4 + Math.random() * 0.2 : 0.22 + Math.random() * 0.12; decide(f); if (ai.target) aiAttack(f); }
      let dx = 0, dy = 0; const t = ai.target;
      if (ai.mode === 'fight' && t && t.alive) {
        const vx = t.x - f.x, vy = t.y - f.y, d = Math.hypot(vx, vy) || 1, pref = prefDist(f);
        ai.strafeT -= dt; if (ai.strafeT <= 0) { ai.strafe = Math.random() < 0.5 ? -1 : 1; ai.strafeT = 1 + Math.random() * 1.5; }
        if (d > pref + 50) { if (W.los(f.x, f.y, t.x, t.y)) { dx = vx; dy = vy; } else { const v = followPath(f, t.x, t.y, dt); dx = v.x; dy = v.y; } }
        else if (d < pref - 50) { dx = -vx; dy = -vy; }
        else { dx = -vy * ai.strafe; dy = vx * ai.strafe; }
        f.face.x = vx / d; f.face.y = vy / d;
      } else if (ai.mode === 'flee' && t && t.alive) { dx = f.x - t.x; dy = f.y - t.y; }
      else if (ai.mode === 'follow' && f.owner) { if (dist(f, f.owner) > 130) { const v = followPath(f, f.owner.x, f.owner.y, dt); dx = v.x; dy = v.y; } }
      else if (ai.mode === 'goto' && ai.goal) { const v = followPath(f, ai.goal.x, ai.goal.y, dt); dx = v.x; dy = v.y; }
      else if (ai.wg) { const v = followPath(f, ai.wg.x, ai.wg.y, dt); dx = v.x; dy = v.y; }
      const sd = safeDir(f, dx, dy);
      if (sd) { f.want.x = sd.x; f.want.y = sd.y; if (ai.mode !== 'fight') { f.face.x = sd.x; f.face.y = sd.y; } } else { f.want.x = f.want.y = 0; }
    }

    // ---- mise à jour d'un combattant ----
    function land(f, j) {
      const L = j.L; G.splash(f, f.x, f.y, 105 + 14 * L, 26 + 8 * L, 'jump', { stun: 1.2 + 0.2 * L, knock: 500 });
      G.fx('ring', f.x, f.y, { r: 105 + 14 * L, col: '#9affc0', life: 0.45, w: 10 }); G.fx('burst', f.x, f.y, { col: '#cfe', n: 16, life: 0.5 }); G.shake(8); G.sfx('boom');
      // niv.3 : deuxième onde. niv.5 : impact de météore qui enflamme
      { const lx = f.x, ly = f.y; if (L >= 3) G.later(0.35, function () { G.splash(f, lx, ly, 160 + 14 * L, 14 + 5 * L, 'jump', { knock: 380 }); G.fx('ring', lx, ly, { r: 160 + 14 * L, col: '#d8ffe4', life: 0.5, w: 8 }); }); if (L >= 5) { for (const t of G.enemiesIn(f, lx, ly, 200)) G.burn(t, 40, 3, f, 'jump'); G.fx('burst', lx, ly, { col: '#ff9a3c', n: 30, life: 0.8 }); G.shake(12); } }
    }
    function updateFighter(f, dt) {
      if (!f.alive) { if (f.kind === 'thrall' || f.kind === 'golem') return; f.respawnT -= dt; if (f.respawnT <= 0 && !G.over) respawn(f); return; }
      const st = f.st;
      for (const k of TIMED) if (st[k] > 0) st[k] = Math.max(0, st[k] - dt);
      if (st.afterRoot && !(st.root > 0)) { st.slowT = st.afterRoot; st.slowMax = st.afterRoot; st.slowAmt = 0.5; st.afterRoot = 0; }
      f.armT = Math.max(0, (f.armT || 0) - dt); f.castT = Math.max(0, (f.castT || 0) - dt);
      if (f.eat) { f.eat.t += dt; if (f.eat.t >= f.eat.dur) f.eat = null; }
      f.hurtT = Math.max(0, f.hurtT - dt); f.flash = Math.max(0, f.flash - dt); f.bombCd = Math.max(0, f.bombCd - dt); f.t += dt;
      for (const ab of f.slots) if (ab) { if (ab.gap > 0) ab.gap -= dt; if (ab.cd > 0) { ab.cd -= dt; if (ab.cd <= 0) { ab.cd = 0; ab.n = WB.maxCharges(ab); } } else if (ab.n != null && ab.n <= 0) ab.n = WB.maxCharges(ab); }
      if (f.kind === 'thrall' || f.kind === 'golem') { f.life -= dt; if (f.life <= 0 || !f.owner.alive) { G.kill(f, null, null); return; } }
      if (f.swallowed) { const sw = f.swallowed; if (!sw.by.alive) G.spit(sw.by); else { f.x = sw.by.x; f.y = sw.by.y; f.vx = f.vy = 0; f.want.x = f.want.y = 0; return; } }
      if (f.sharkHold) { f.vx = f.vy = 0; f.want.x = f.want.y = 0; return; }
      if (f.swallow) { f.swallow.t -= dt; if (f.swallow.t <= 0 || !f.swallow.v.alive) G.spit(f); }
      f.glutBig = f.slots.some(x => x && x.id === 'glut' && !x.stolen);
      // les 10 bombes normales ne se régénèrent jamais (spécification Invisibilité)
      for (const x of f.slots) if (x && x.id === 'summon' && !x.form) { if (f === G.player) { if (!G.formPrompt) G.formPrompt = { ab: x, t: 10 }; } else x.form = ['shark', 'golem', 'dragon'][(Math.random() * 3) | 0]; }
      if (f.kind === 'golem') { f.stoneT -= dt; const tg = f.ai.target; if (tg && tg.alive && !tg.ghost && G.started && f.stoneT <= 0 && dist(f, tg) < 430) { const d = dist(f, tg) || 1, L = f.golemL; f.stoneT = 1.6 - 0.1 * L; f.face.x = (tg.x - f.x) / d; f.face.y = (tg.y - f.y) / d; G.proj({ x: f.x, y: f.y - 10, dx: f.face.x, dy: f.face.y, speed: 520, life: 0.85, r: 12, owner: f.owner, ab: 'summon', lvl: L, kind: 'stone', onHit(p, t) { G.damage(t, 12 + 4 * L, f.owner, 'summon'); G.knock(t, p.dx || 0, p.dy || 0, 160); G.fx('burst', p.x, p.y, { col: '#9a9fac', n: 8, life: 0.4 }); return true; } }); G.sfx('wall'); f.throwT = 0.25; } f.throwT = Math.max(0, (f.throwT || 0) - dt); }
      tickDots(f, dt); if (!f.alive) return;
      if (f.necro) { f.necro.t -= dt; if (f.necro.t <= 0) f.necro = null; }
      if (f.kind === 'player' && !f.thrall) playerInput(f, dt); else aiThink(f, dt);
      if (f.thrall) { const th = f.thrall; th.t -= dt; if (!th.owner || !th.owner.alive || (th.phase === 1 ? th.t <= 0 : th.t <= 0)) { G.release(f); } }
      const canMove = !(st.frozen > 0 || st.stun > 0 || st.root > 0 || st.jump || f.dash || f.seqLock) && G.started;
      let sp = f.speed; if (st.slowT > 0) sp *= 1 - (st.slowAmt || 0.4) * (st.slowT / (st.slowMax || 1));
      const inWater = W.isWaterAt(f.x, f.y) && !st.jump; if (inWater) sp *= 0.4;
      const mvx = canMove ? f.want.x * sp : 0, mvy = canMove ? f.want.y * sp : 0;
      const a = Math.min(1, dt * 14); f.vx += (mvx - f.vx) * a; f.vy += (mvy - f.vy) * a;
      f.moving = Math.hypot(f.vx, f.vy) > 25; if (f.moving) f.walk += dt * 11;
      if (st.jump) {
        const j = st.jump; j.t += dt; const u = Math.min(1, j.t / j.dur);
        f.x = j.x0 + (j.x1 - j.x0) * u; f.y = j.y0 + (j.y1 - j.y0) * u; f.jumpH = Math.sin(u * Math.PI) * 70;
        if (u >= 1) { st.jump = null; f.jumpH = 0; W.collide(f, G.walls); land(f, j); }
      } else if (f.dash) {
        const d = f.dash; d.t -= dt; const step = 1700 * dt;
        f.x += d.dx * step; f.y += d.dy * step; W.collide(f, G.walls);
        for (const t of G.F) if (t.alive && t.team !== f.team && !d.hit.has(t.id) && !(t.st.jump || t.ghost) && dist(f, t) < f.r + t.r + 6) { d.hit.add(t.id); G.damage(t, d.dmg, f, 'dash'); G.knock(t, d.dx, d.dy, 350); G.fx('burst', t.x, t.y, { col: '#ffe27a', n: 8, life: 0.4 }); }
        for (const s of G.spiders) if (s.alive && dist(f, s) < f.r + s.r + 6) G.hitSpider(s, d.dmg, f);
        if (d.t <= 0) { f.dash = null; f.vx = d.dx * 160; f.vy = d.dy * 160; }
      } else {
        f.x += (f.vx + f.kx) * dt; f.y += (f.vy + f.ky) * dt;
        if (W.collide(f, G.walls)) { f.kx *= 0.3; f.ky *= 0.3; }
      }
      const fr = Math.exp(-3.5 * dt); f.kx *= fr; f.ky *= fr;
      f.x = clamp(f.x, TS + f.r, WW - TS - f.r); f.y = clamp(f.y, TS + f.r, WH - TS - f.r);
      // dangers
      if (!st.jump) {
        if (inWater) {
          f.drown += dt; f.hp -= 24 * dt; if (Math.random() < dt * 8) G.fx('ring', f.x, f.y, { r: 22, col: '#bfe4ff', life: 0.4, w: 2 });
          if (f.hp <= 0 || f.drown > 1.6) { G.sfx('drown'); G.fx('burst', f.x, f.y, { col: '#7fc4ff', n: 16, life: 0.7 }); G.kill(f, null, 'eau'); return; }
        } else f.drown = Math.max(0, f.drown - dt * 2);
        f.ventT -= dt;
        if (f.ventT <= 0) for (const v of W.vents) if (Math.abs(v.x - f.x) < 40 && Math.abs(v.y - f.y) < 40 && W.ventState(v, G.t) === 2) { f.ventT = 0.4; G.damage(f, 6, null, 'flamme'); G.burn(f, 12, 2, null, 'flamme'); G.fx('burst', f.x, f.y, { col: '#ff9a3c', n: 4, life: 0.3 }); break; }
      }
      // bouclier / invisibilité : contact
      if (st.shield > 0 && !f.shieldNoHit) for (const t of G.F) if (t.alive && t.team !== f.team && !(t.st.jump || t.ghost) && dist(f, t) < f.r + t.r + 10) {
        if (!f.shieldHit) f.shieldHit = new Map(); if ((f.shieldHit.get(t.id) || 0) > G.t) continue; f.shieldHit.set(t.id, G.t + 0.6);
        G.damage(t, 22 + 6 * (f.shieldL || 1), f, 'shield'); G.knock(t, (t.x - f.x) / (dist(f, t) || 1), (t.y - f.y) / (dist(f, t) || 1), 320);
      }
      if (st.invis > 0 && f.invisHit) for (const t of G.F) if (t.alive && t.team !== f.team && !(t.st.jump || t.ghost) && !f.invisHit.has(t.id) && dist(f, t) < f.r + t.r + 6) { f.invisHit.add(t.id); G.damage(t, f.invisDmg || 30, f, 'invis'); G.fx('burst', t.x, t.y, { col: '#cfd8ff', n: 8, life: 0.4 }); }
      if (f.kind === 'player' || f.kind === 'bot' || f.kind === 'minion' || f.kind === 'thrall') collect(f);
      if (f.kind === 'boss') collect(f);
    }

    // ---- boucle de mise à jour ----
    G.update = function (dt) {
      if (G.over) { for (const e of G.fxs) e.t += dt; return; }
      if (!G.started) { const c0 = Math.ceil(G.countdown); G.countdown -= dt; if (Math.ceil(G.countdown) < c0 && G.countdown > 0) G.sfx('count'); if (G.countdown <= 0) { G.sfx('go'); G.started = true; WB.sdk.msg('gameplay_started'); } }
      else { G.t += dt; G.timeLeft -= dt; }
      W.time = G.t;
      for (const f of G.F.slice()) updateFighter(f, dt);
      // séparation douce
      for (let i = 0; i < G.F.length; i++) { const a = G.F[i]; if (!a.alive || (a.st.jump || a.ghost)) continue; for (let j = i + 1; j < G.F.length; j++) { const b = G.F[j]; if (!b.alive || (b.st.jump || b.ghost)) continue; const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = a.r + b.r - 4; if (d < m && d > 0.01) { const p = (m - d) / d * 0.35; a.x -= dx * p; a.y -= dy * p; b.x += dx * p; b.y += dy * p; } } }
      if (G.swap) { G.swap.t -= dt; const p = G.swap.pk; if (G.swap.t <= 0 || !G.pickups.includes(p) || dist(G.player, p) > 120 || !G.player.alive) G.swap = null; }
      // projectiles
      for (let i = G.projs.length - 1; i >= 0; i--) {
        const p = G.projs[i];
        if (p.kind === 'bomb') {
          p.u += dt / p.T; p.x = p.x0 + (p.tx - p.x0) * Math.min(1, p.u); p.y = p.y0 + (p.ty - p.y0) * Math.min(1, p.u);
          if (p.u >= 1) { G.splash(p.owner, p.x, p.y, 74, 32, 'bomb', { knock: 380 }); G.fx('boom', p.x, p.y, { life: 0.5 }); G.fx('ring', p.x, p.y, { r: 74, col: '#ffb84a', life: 0.35, w: 6 }); G.sfx('boom'); G.shake(5); G.projs.splice(i, 1); }
          continue;
        }
        const total = p.speed * dt, steps = Math.max(1, Math.ceil(total / 12)), sl = total / steps; let dead = false;
        for (let s = 0; s < steps && !dead; s++) {
          p.x += p.dx * sl; p.y += p.dy * sl; p.life -= dt / steps;
          if (p.pierce && W.solidAt(p.x, p.y)) { p.life -= (dt / steps) * 3; if (Math.random() < 0.3) G.fx('burst', p.x, p.y, { col: '#8affc8', n: 2, life: 0.25 }); }
          else if (W.solidAt(p.x, p.y)) { dead = true; G.fx('burst', p.x, p.y, { col: p.kind === 'fire' ? '#ff9a3c' : '#ddd', n: 6, life: 0.3 }); break; }
          for (const w of G.walls) if (Math.abs(p.x - w.x) < w.w / 2 + p.r && Math.abs(p.y - w.y) < w.h / 2 + p.r) { if (p.pierce) { p.life -= (dt / steps) * 3; continue; } hitWall(w, p.kind === 'bullet' ? 8 : 14 + 4 * (p.lvl || 1)); dead = true; G.fx('burst', p.x, p.y, { col: '#b8a48a', n: 6, life: 0.3 }); break; }
          if (dead) break;
          for (const tu of G.turrets) if (tu.owner.team !== p.owner.team && Math.hypot(tu.x - p.x, tu.y - p.y) < 20 + p.r) { hitTurret(tu, 14); dead = true; break; }
          if (dead) break;
          for (const sp of G.spiders) if (sp.alive && Math.hypot(sp.x - p.x, sp.y - p.y) < sp.r + p.r) { G.hitSpider(sp, 14, p.owner); dead = true; break; }
          if (dead) break;
          if (WB.shieldProj) { const sr = WB.shieldProj(p); if (sr === 1) { dead = true; break; } }
          for (const t of G.F) {
            if (!t.alive || t.team === p.owner.team || (t.st.jump || t.ghost)) continue;
            if (WB.domeMiss && WB.domeMiss(p.owner, t)) continue;
            if (Math.hypot(t.x - p.x, t.y - p.y) < t.r * t.scale * 0.9 + p.r) {
              if (t.st.shield > 0 || t.st.invuln > 0) { G.fx('burst', p.x, p.y, { col: '#9ad8ff', n: 6, life: 0.3 }); dead = true; break; }
              WB.__pa = Math.atan2(p.y - t.y, p.x - t.x); if (p.refl) G.srcOverride = p.refl;
              let rm; try { rm = p.onHit ? p.onHit(p, t) : true; } finally { WB.__pa = null; G.srcOverride = null; } if (rm !== false) dead = true; break;
            }
          }
        }
        if (p.life <= 0) dead = true;
        if (dead) G.projs.splice(i, 1);
      }
      // trous noirs
      for (let i = G.holes.length - 1; i >= 0; i--) {
        const h = G.holes[i]; h.life -= dt;
        for (const t of G.F) {
          if (!t.alive || t.team === h.owner.team || (t.st.jump || t.ghost)) continue;
          const dx = h.x - t.x, dy = h.y - t.y, d = Math.hypot(dx, dy); if (d > h.r + t.r) continue;
          const pull = (t.kind === 'boss' ? 160 : 420) * dt; t.x += dx / (d || 1) * Math.min(pull, d); t.y += dy / (d || 1) * Math.min(pull, d); W.collide(t, G.walls);
          if (d < 38 && !h.hit.has(t.id)) { h.hit.add(t.id); if (t.kind === 'boss') G.damage(t, t.maxhp * 0.35, h.owner, 'hole'); else { if (!(t.st.shield > 0 || t.st.invuln > 0)) { G.fx('burst', t.x, t.y, { col: '#b080ff', n: 14, life: 0.6 }); } G.damage(t, 9999, h.owner, 'hole'); } }
        }
        if (h.life <= 0) G.holes.splice(i, 1);
      }
      // murs
      for (let i = G.walls.length - 1; i >= 0; i--) { const w = G.walls[i]; w.life -= dt; w.flash = Math.max(0, (w.flash || 0) - dt); if (w.life <= 0) G.walls.splice(i, 1); }
      // tourelles
      for (let i = G.turrets.length - 1; i >= 0; i--) {
        const tu = G.turrets[i]; tu.life -= dt; tu.cd -= dt; tu.flash = Math.max(0, (tu.flash || 0) - dt);
        if (tu.life <= 0) { G.turrets.splice(i, 1); continue; }
        if (tu.dragon) {
          let best = null, bd = 340; for (const t of G.F) { if (!t.alive || t.team === tu.owner.team || t.st.jump || t.ghost || t.st.invis > 0) continue; const d = Math.hypot(t.x - tu.x, t.y - tu.y); if (d < bd && W.los(tu.x, tu.y, t.x, t.y)) { bd = d; best = t; } }
          if (best) { tu.ang = Math.atan2(best.y - tu.y, best.x - tu.x); if (tu.cd <= 0) { tu.cd = 1.0; const L = tu.L; G.proj({ x: tu.x + Math.cos(tu.ang) * 26, y: tu.y + Math.sin(tu.ang) * 26, dx: Math.cos(tu.ang), dy: Math.sin(tu.ang), speed: 520, life: 0.7, r: 14, owner: tu.owner, ab: 'summon', lvl: L, kind: 'fire', onHit(p, t) { G.damage(t, 9 + 3 * L, tu.owner, 'summon'); G.burn(t, 14 + 6 * L, 3.5, tu.owner, 'summon'); G.fx('burst', p.x, p.y, { col: '#ff9a3c', n: 8, life: 0.4 }); return true; } }); G.sfx('fire'); tu.fireT = 0.3; } }
          tu.fireT = Math.max(0, (tu.fireT || 0) - dt); continue;
        }
        let best = null, bd = 280; for (const t of G.F) { if (!t.alive || t.team === tu.owner.team || t.st.jump || t.st.invis > 0) continue; const d = Math.hypot(t.x - tu.x, t.y - tu.y); if (d < bd && W.los(tu.x, tu.y, t.x, t.y)) { bd = d; best = t; } }
        if (best) { tu.ang = Math.atan2(best.y - tu.y, best.x - tu.x); if (tu.cd <= 0) { tu.cd = Math.max(0.25, 0.85 - 0.12 * tu.L); const L = tu.L; G.proj({ x: tu.x + Math.cos(tu.ang) * 22, y: tu.y + Math.sin(tu.ang) * 22, dx: Math.cos(tu.ang), dy: Math.sin(tu.ang), speed: 620, life: 0.55, r: 6, owner: tu.owner, ab: 'turret', lvl: L, kind: 'bullet', onHit(p, t) { G.damage(t, 7 + 2.5 * L, tu.owner, 'turret'); return true; } }); G.sfx('hit'); } }
      }
      // clowns
      for (let i = G.clowns.length - 1; i >= 0; i--) {
        const c = G.clowns[i]; c.life -= dt; c.t += dt;
        if (!c.owner.alive && c.life > 0.3) c.life = 0.3;
        if (!c.target || !c.target.alive) { let bd = 1e9; c.target = null; for (const t of G.F) if (t.alive && t.team !== c.owner.team && !(t.st.jump || t.ghost)) { const d = Math.hypot(t.x - c.x, t.y - c.y); if (d < bd && d < 600) { bd = d; c.target = t; } } }
        let boom = c.life <= 0;
        if (c.target) { const dx = c.target.x - c.x, dy = c.target.y - c.y, d = Math.hypot(dx, dy) || 1; c.x += dx / d * (230 + 20 * c.L) * dt; c.y += dy / d * (230 + 20 * c.L) * dt; const o = { x: c.x, y: c.y, r: 16 }; W.collide(o, G.walls); c.x = o.x; c.y = o.y; c.dir = dx > 0 ? 1 : -1; if (d < 34) boom = true; }
        if (boom) { G.splash(c.owner, c.x, c.y, 70 + 12 * c.L, 32 + 8 * c.L, 'clown', { knock: 400, stun: c.L >= 3 ? 0.4 + 0.15 * c.L : 0 }); G.fx('boom', c.x, c.y, { life: 0.5 }); if (c.L >= 5) { G.fx('burst', c.x, c.y, { col: '#ffe94a', n: 24, life: 0.8 }); G.fx('burst', c.x, c.y, { col: '#5ad0ff', n: 24, life: 0.8 }); } G.fx('ring', c.x, c.y, { r: 70 + 12 * c.L, col: '#ff8ab8', life: 0.35, w: 6 }); G.sfx('boom'); G.shake(4); G.clowns.splice(i, 1); }
      }
      // araignées
      for (const s of G.spiders) {
        if (!s.alive) { s.respawn -= dt; if (s.respawn <= 0) { s.alive = true; s.hp = 30; s.x = s.hx; s.y = s.hy; } continue; }
        s.t += dt; s.biteCd -= dt; let tg = null, bd = 160;
        for (const f of G.F) if (f.alive && !(f.st.jump || f.ghost) && f.st.invis <= 0 && f.kind !== 'thrall') { const d = dist(f, s); if (d < bd) { bd = d; tg = f; } }
        let sp = 55, tx = s.tx, ty = s.ty;
        if (tg) { tx = tg.x; ty = tg.y; sp = 120; if (bd < tg.r + s.r + 6 && s.biteCd <= 0) { s.biteCd = 0.9; G.damage(tg, 9, null, 'araignée'); tg.st.slowT = 1.4; tg.st.slowMax = 1.4; tg.st.slowAmt = 0.4; G.fx('burst', tg.x, tg.y, { col: '#7a4aa8', n: 5, life: 0.3 }); } }
        else { s.wt -= dt; if (s.wt <= 0) { s.wt = 2 + Math.random() * 2; const a = Math.random() * TAU, d = Math.random() * 160; s.tx = s.hx + Math.cos(a) * d; s.ty = s.hy + Math.sin(a) * d; } }
        const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy);
        if (d > 6) { s.x += dx / d * sp * dt; s.y += dy / d * sp * dt; s.ang = Math.atan2(dy, dx); W.collide(s, G.walls); }
      }
      // minuteurs différés
      for (let i = G.timers.length - 1; i >= 0; i--) { G.timers[i].t -= dt; if (G.timers[i].t <= 0) { const fn = G.timers[i].fn; G.timers.splice(i, 1); try { fn(); } catch (e) { console.error(e); } } }
      for (const p of G.pickups) p.t += dt;
      WB.updateTrails(G, dt);
      if (G.formPrompt) { const fp = G.formPrompt; fp.t -= dt; if (!G.player.slots.includes(fp.ab) || fp.ab.form) G.formPrompt = null; else if (fp.t <= 0) { fp.ab.form = 'shark'; G.formPrompt = null; } }
      spawnPickups(dt);
      // effets
      if (WB.updateHands) WB.updateHands(dt);
      for (let i = G.fxs.length - 1; i >= 0; i--) { const e = G.fxs[i]; e.t += dt; if (e.t >= e.life) G.fxs.splice(i, 1); }
      G.shakeV *= Math.exp(-9 * dt);
      for (let i = G.feed.length - 1; i >= 0; i--) if (G.t - G.feed[i].t > 6) G.feed.splice(i, 1);
      // caméra
      const tgt = G.player.alive ? G.player : (G.F.find(f => f.alive && f.kind === 'bot') || G.player);
      const k = Math.min(1, dt * 8); G.cam.x += (tgt.x - G.cam.x) * k; G.cam.y += (tgt.y - G.cam.y) * k;
      if (G.timeLeft <= 0 && !G.over) G.finish();
    };

    G.finish = function () {
      G.over = true; G.timeLeft = 0; WB.sdk.msg('gameplay_stopped');
      const real = G.F.filter(f => (f.kind === 'player' || f.kind === 'bot'));
      let rows, rank, win;
      if (G.mode.teams) {
        const teams = []; for (let t = 0; t < G.mode.teams; t++) teams.push({ team: t, name: 'Équipe ' + WB.TEAM_NAMES[t], score: G.score[t] || 0, col: WB.TEAM_COLORS[t] });
        teams.sort((a, b) => b.score - a.score); rows = teams;
        rank = teams.findIndex(t => t.team === G.player.team) + 1; win = rank === 1 && (teams.length < 2 || teams[0].score > teams[1].score);
        G.players = real.slice().sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);
      } else {
        const ps = real.slice().sort((a, b) => b.kills - a.kills || a.deaths - b.deaths); rows = ps; G.players = ps;
        rank = ps.indexOf(G.player) + 1; win = rank === 1;
      }
      G.results = { rows: rows, rank: rank, win: win, kills: G.player.kills, deaths: G.player.deaths, mk: G.player.mk, coins: G.coinsGot, teams: !!G.mode.teams };
      G.sfx(win ? 'win' : 'lose');
    };
    G.countdown = 3.2;
    G.cam.x = G.player.x; G.cam.y = G.player.y;
    return G;
  };

  // ====================== RENDU ======================
  const PI2 = Math.PI * 2;
  function floorVar(arena, tx, ty) {
    const h = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
    if (arena === 'donjon') return h % 4;
    if (arena === 'urban') { const m = h % 10; return m < 6 ? m % 3 : 3 + (m % 2); }
    const m = h % 19; return m === 0 ? 4 : (m % 4);
  }
  WB.renderWorld = function (ctx, cw, ch, G, time) {
    const W = G.world, S = W.sprites, z = ch / 560;
    const vw = cw / z, vh = ch / z;
    let cx = clamp(G.cam.x, vw / 2 - 40, WW - vw / 2 + 40), cy = clamp(G.cam.y, vh / 2 - 40, WH - vh / 2 + 40);
    if (vw > WW) cx = WW / 2; if (vh > WH) cy = WH / 2;
    const sx = (Math.random() - 0.5) * G.shakeV, sy = (Math.random() - 0.5) * G.shakeV;
    const vx0 = cx - vw / 2, vy0 = cy - vh / 2;
    G.view = { x0: vx0, y0: vy0, w: vw, h: vh, z: z, cx: cx, cy: cy };
    ctx.save(); ctx.scale(z, z); ctx.translate(-vx0 + sx, -vy0 + sy);
    const tx0 = Math.max(0, Math.floor(vx0 / TS) - 1), ty0 = Math.max(0, Math.floor(vy0 / TS) - 1), tx1 = Math.min(WB.GW - 1, Math.ceil((vx0 + vw) / TS) + 1), ty1 = Math.min(WB.GH - 1, Math.ceil((vy0 + vh) / TS) + 1);
    const list = [];
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const c = W.code(tx, ty), X = tx * TS, Y = ty * TS;
      if (c === 2) { ctx.drawImage(S.water, X, Y); const ph = time * 1.4 + tx * 1.3 + ty * 0.7; ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X + 32 + Math.sin(ph) * 8, Y + 32, 10 + Math.sin(ph * 1.3) * 3, 3.4, 5.9); ctx.stroke(); continue; }
      if (c === 1) { ctx.drawImage(S.wall, X, Y); continue; }
      ctx.drawImage(S.floors[floorVar(S.arena, tx, ty)], X, Y);
      if (c === 6) ctx.drawImage(S.wall2, X, Y);
      else if (c === 5) ctx.drawImage(S.rock, X, Y);
      else if (c === 3) list.push({ y: Y + TS + 6, tree: (tx * 7 + ty * 3) % S.trees.length, x: X, yy: Y });
    }
    for (const h of W.houses) if (h.tx + 3 >= tx0 && h.tx <= tx1 && h.ty + 2 >= ty0 && h.ty <= ty1) list.push({ y: (h.ty + 2) * TS, house: h });
    // fontaines de flammes
    for (const v of W.vents) {
      if (v.x < vx0 - 60 || v.x > vx0 + vw + 60 || v.y < vy0 - 60 || v.y > vy0 + vh + 60) continue;
      const s = W.ventState(v, G.t); ctx.fillStyle = '#1a1a22'; ctx.fillRect(v.x - 20, v.y - 20, 40, 40); ctx.fillStyle = '#34343f'; for (let i = 0; i < 4; i++) ctx.fillRect(v.x - 16, v.y - 14 + i * 9, 32, 4);
      if (s === 1) { const a = 0.35 + 0.35 * Math.sin(time * 18); ctx.fillStyle = 'rgba(255,140,40,' + a + ')'; ctx.beginPath(); ctx.arc(v.x, v.y, 24, 0, PI2); ctx.fill(); }
    }
    // objets à trier
    for (const f of G.F) if (f.alive) list.push({ y: f.y + 1, f: f });
    for (const c of G.clowns) list.push({ y: c.y, clown: c });
    for (const t of G.turrets) list.push({ y: t.y, turret: t });
    for (const s of G.spiders) if (s.alive) list.push({ y: s.y, spider: s });
    for (const w of G.walls) list.push({ y: w.y + w.h / 2, wall: w });
    // pickups au sol
    for (const p of G.pickups) {
      if (p.x < vx0 - 40 || p.x > vx0 + vw + 40 || p.y < vy0 - 40 || p.y > vy0 + vh + 40) continue;
      const bob = Math.sin(p.t * 3 + p.x) * 3;
      if (p.kind === 'coin') { const sc = Math.abs(Math.cos(p.t * 3 + p.x)); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 12, 8, 3, 0, 0, PI2); ctx.fill(); ctx.save(); ctx.translate(p.x, p.y + bob); ctx.scale(0.25 + sc * 0.75, 1); WB.drawIcon(ctx, 'coin', 0, 0, 16); ctx.restore(); }
      else if (p.kind === 'heart') { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 16, 10, 3.5, 0, 0, PI2); ctx.fill(); const s = 1 + Math.sin(p.t * 5) * 0.08; ctx.save(); ctx.translate(p.x, p.y + bob); ctx.scale(s, s); ctx.shadowColor = '#ff4f6a'; ctx.shadowBlur = 12; WB.drawIcon(ctx, 'heart', 0, 0, 26); ctx.restore(); }
      else if (p.kind === 'chest') WB.drawChest(ctx, p, time);
      else WB.drawFruitPickup(ctx, p, time);
    }
    // balises de téléportation (visibles par l'équipe seulement)
    for (const f of G.F) if (f.beacon && f.alive && (f.team === G.player.team)) { const b = f.beacon, a = 0.6 + Math.sin(time * 5) * 0.3; ctx.fillStyle = 'rgba(220,160,255,' + a + ')'; ctx.beginPath(); ctx.arc(b.x, b.y, 7, 0, PI2); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(b.x, b.y, 12 + Math.sin(time * 4) * 2, 0, PI2); ctx.stroke(); }
    // trous noirs
    for (const h of G.holes) { const u = Math.min(1, (1.7 - h.life) / 0.4), r = h.r * u; ctx.save(); ctx.translate(h.x, h.y); const g = ctx.createRadialGradient(0, 0, 4, 0, 0, r); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.35, 'rgba(24,6,50,.9)'); g.addColorStop(1, 'rgba(140,80,240,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, PI2); ctx.fill(); ctx.strokeStyle = 'rgba(210,170,255,.7)'; ctx.lineWidth = 2.5; ctx.rotate(time * 5); for (let k = 0; k < 3; k++) { ctx.rotate(PI2 / 3); ctx.beginPath(); for (let a = 0; a < 4.2; a += 0.15) { const rr = 6 + a * r * 0.2; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.stroke(); } ctx.restore(); }
    WB.drawTrails(ctx, G, time);
    list.sort((a, b) => a.y - b.y);
    for (const o of list) {
      if (o.tree != null) ctx.drawImage(S.trees[o.tree], o.x + TS / 2 - 64, o.yy + TS / 2 - 66);
      else if (o.house) ctx.drawImage(S.houses[o.house.style], o.house.tx * TS - 10, o.house.ty * TS - 6);
      else if (o.f) drawFighter(ctx, o.f, G, time);
      else if (o.clown) drawClown(ctx, o.clown, time);
      else if (o.turret) drawTurret(ctx, o.turret, time);
      else if (o.spider) drawSpider(ctx, o.spider, time);
      else if (o.wall) drawWall(ctx, o.wall);
    }
    // projectiles
    for (const p of G.projs) drawProj(ctx, p, time);
    // effets
    for (const e of G.fxs) drawFx(ctx, e, G, time);
    if (WB.drawHands) WB.drawHands(ctx, G, time);
    // torches et obscurité du donjon
    if (S.arena === 'donjon') {
      ctx.fillStyle = 'rgba(4,4,18,.34)'; ctx.fillRect(vx0 - 10, vy0 - 10, vw + 20, vh + 20);
      ctx.globalCompositeOperation = 'lighter';
      for (const t of W.torches) { if (t.x < vx0 - 160 || t.x > vx0 + vw + 160 || t.y < vy0 - 160 || t.y > vy0 + vh + 160) continue; const fl = 0.8 + Math.sin(time * 9 + t.ph) * 0.2; const g = ctx.createRadialGradient(t.x, t.y, 4, t.x, t.y, 150 * fl); g.addColorStop(0, 'rgba(255,170,60,.38)'); g.addColorStop(1, 'rgba(255,120,20,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(t.x, t.y, 150, 0, PI2); ctx.fill(); }
      ctx.globalCompositeOperation = 'source-over';
      for (const t of W.torches) { if (t.x < vx0 - 40 || t.x > vx0 + vw + 40 || t.y < vy0 - 40 || t.y > vy0 + vh + 40) continue; const fl = Math.sin(time * 9 + t.ph); ctx.fillStyle = '#5a3a20'; ctx.fillRect(t.x - 3, t.y - 4, 6, 10); ctx.fillStyle = '#ff9a2a'; ctx.beginPath(); ctx.ellipse(t.x, t.y - 9, 6, 9 + fl * 2, 0, 0, PI2); ctx.fill(); ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.ellipse(t.x, t.y - 7, 3, 5 + fl, 0, 0, PI2); ctx.fill(); }
    }
    if (WB.ui && WB.ui.drawWorldOverlay) WB.ui.drawWorldOverlay(ctx, G, time);
    ctx.restore();
  };

  function drawFighter(ctx, f, G, time) {
    const me = G.player, st = f.st; let alpha = 1; if (f.ghost) return;
    if (st.invis > 0) alpha = (f.team === me.team) ? 0.35 : 0.05;
    if (st.invuln > 0 && Math.floor(time * 12) % 2) alpha *= 0.5;
    const R = f.r * f.scale, jh = f.jumpH || 0;
    // anneau d'équipe
    if (f.kind === 'player' || f.kind === 'bot' || f.kind === 'thrall') {
      const tc = G.mode.teams ? WB.TEAM_COLORS[f.team] : (f === me ? '#ffd24a' : null);
      if (tc && alpha > 0.1) { ctx.strokeStyle = tc; ctx.globalAlpha = 0.85; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(f.x, f.y + 12, 26, 12, 0, 0, PI2); ctx.stroke(); ctx.globalAlpha = 1; }
    }
    if (jh > 0) { ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(f.x, f.y + 18, 20 - jh * 0.1, 7, 0, 0, PI2); ctx.fill(); }
    const px = f.x, py = f.y - jh - (f.kind === 'boss' ? 6 : 0);
    const o = { t: f.t, walk: f.walk, moving: f.moving, fx: f.face.x, fy: f.face.y, alpha: alpha, flash: f.flash > 0, hurt: f.hurtT > 0, arm: (f.armT || 0) > 0, cast: Math.min(1, (f.castT || 0) / 0.3), jump: f.st.jump ? Math.sin(Math.min(1, f.st.jump.t / (f.st.jump.dur || 1)) * Math.PI) : 0 };
    if (f.kind === 'minion') WB.drawMinion(ctx, px, py, 1, o);
    else if (f.kind === 'boss') WB.drawMinion(ctx, px, py, f.scale, Object.assign(o, { boss: true }));
    else if (f.kind === 'golem') WB.drawGolem(ctx, f, px, py, time, o);
    else if (f.kind === 'thrall') WB.drawBlob(ctx, f.spec, px, py, 1, Object.assign(o, { color: '#8e95a3', dead: true, alpha: 0.85 * alpha }));
    else {
      if (alpha > 0.1) WB.drawAura(ctx, f, time);
      let sc = 1; if (f.eat) sc = WB.drawEat(ctx, f, time, o.fx >= 0 ? 1 : -1); if (f.glutBig) sc *= 1.3;
      if (f.thrall) o.color = '#8e95a3', o.dead = true, o.alpha = 0.85 * alpha;
      const held = WB.heldOf(f), dir = o.fx >= 0 ? 1 : -1;
      if (held && alpha > 0.1 && dir < 0 === false) { /* main droite, derrière le corps si on regarde à gauche */ }
      WB.drawBlob(ctx, f.spec, px, py, sc, o);
      if (held && alpha > 0.1 && !f.eat) WB.drawHeld(ctx, held, px + dir * 21, py + 5, dir, time, f.moving ? Math.sin(time * 8) * 0.12 : 0);
      if (f.glutBig || f.swallow) WB.drawGlut(ctx, f, G, time, px, py, sc);
      if (alpha > 0.1) WB.drawAuraFront(ctx, f, time);
      if (f.thrall) {
        const th = f.thrall, ow = th.owner; if (ow && ow.alive) { ctx.strokeStyle = 'rgba(138,255,200,.55)'; ctx.lineWidth = 2; ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(ow.x, ow.y); ctx.stroke(); ctx.setLineDash([]); }
        ctx.strokeStyle = '#8affc8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(f.x, f.y - R - 34, 9, 0, PI2); ctx.stroke();
        if (th.phase === 1) { ctx.beginPath(); ctx.arc(f.x, f.y - R - 34, 9, -Math.PI / 2, -Math.PI / 2 + PI2 * Math.max(0, th.t / th.T)); ctx.strokeStyle = '#fff'; ctx.stroke(); }
        else { ctx.fillStyle = '#8affc8'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('II', f.x, f.y - R - 30); }
      }
    }
    // états
    if (st.frozen > 0) {
      ctx.save(); ctx.translate(f.x, f.y); ctx.globalAlpha = 0.75; ctx.fillStyle = 'rgba(160,225,255,.55)'; ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-26, -24); ctx.lineTo(26, -28); ctx.lineTo(30, 20); ctx.lineTo(-22, 28); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, -14); ctx.lineTo(-4, -6); ctx.moveTo(10, 6); ctx.lineTo(18, 16); ctx.stroke(); ctx.restore();
    }
    if (st.root > 0) { ctx.save(); ctx.translate(f.x, f.y); ctx.strokeStyle = 'rgba(245,245,255,.9)'; ctx.lineWidth = 1.6; for (let a = 0; a < 6; a++) { const an = a * Math.PI / 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(an) * 30, Math.sin(an) * 26); ctx.stroke(); } for (const r of [12, 22]) { ctx.beginPath(); for (let a = 0; a <= 6; a++) { const an = a * Math.PI / 3; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r * 0.9); } ctx.stroke(); } ctx.restore(); }
    if (st.shield > 0) { ctx.save(); ctx.translate(f.x, f.y); const g = ctx.createRadialGradient(0, 0, 10, 0, 0, 38); g.addColorStop(0, 'rgba(120,200,255,.05)'); g.addColorStop(1, 'rgba(150,220,255,.6)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 38, 0, PI2); ctx.fill(); ctx.strokeStyle = '#bfe8ff'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.restore(); }
    if (f.dots.some(function (d) { return d.ab !== 'scythe'; })) { for (let i = 0; i < 2; i++) { const a = time * 9 + i * 3; ctx.fillStyle = i ? '#ffd24a' : '#ff7a1c'; ctx.beginPath(); ctx.ellipse(f.x + Math.sin(a) * 10, f.y - 18 - ((time * 40 + i * 14) % 22), 4, 6, 0, 0, PI2); ctx.fill(); } }
    if (st.stun > 0) { for (let i = 0; i < 3; i++) { const a = time * 5 + i * 2.1; ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * 16, f.y - R - 6 + Math.sin(a) * 4, 3.5, 0, PI2); ctx.fill(); } }
    if (st.silence > 0) { ctx.save(); ctx.translate(f.x, f.y - R - 14); ctx.strokeStyle = '#ffe94a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(0, 0); ctx.lineTo(-3, 0); ctx.lineTo(4, 6); ctx.stroke(); ctx.restore(); }
    if (f.necro) { ctx.strokeStyle = 'rgba(110,230,170,.8)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(f.x, f.y, 30, 0, PI2); ctx.stroke(); ctx.setLineDash([]); }
    // nom et vie
    if (alpha > 0.2 && f.kind !== 'minion') {
      const top = f.y - R - 26 - jh, w = f.kind === 'boss' ? 80 : 46;
      if (f.kind !== 'boss' && f.kind !== 'thrall' && f.kind !== 'golem') { ctx.font = 'bold 12px "Trebuchet MS",sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.strokeText(f.name, f.x, top - 6); ctx.fillStyle = f === me ? '#ffd24a' : (G.mode.teams ? WB.TEAM_COLORS[f.team] : '#fff'); ctx.fillText(f.name, f.x, top - 6); }
      else if (f.kind === 'boss') { ctx.font = 'bold 13px "Trebuchet MS",sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3.5; ctx.strokeStyle = '#000'; ctx.strokeText('BOSS', f.x, top - 6); ctx.fillStyle = '#ff6a6a'; ctx.fillText('BOSS', f.x, top - 6); }
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(f.x - w / 2 - 1, top - 1, w + 2, 8); const p = Math.max(0, f.hp / f.maxhp); ctx.fillStyle = p > 0.6 ? '#46d160' : p > 0.3 ? '#f5c542' : '#ff4a4a'; ctx.fillRect(f.x - w / 2, top, w * p, 6);
    } else if (alpha > 0.2) { const top = f.y - R - 14, w = 36, p = Math.max(0, f.hp / f.maxhp); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(f.x - w / 2 - 1, top - 1, w + 2, 6); ctx.fillStyle = '#ff6a6a'; ctx.fillRect(f.x - w / 2, top, w * p, 4); }
  }
  function drawClown(ctx, c, time) {
    const sp = Object.assign({}, c.spec || (c.owner && c.owner.spec) || WB.randomSpec(), { hat: 'h_party' }); WB.drawBlob(ctx, sp, c.x, c.y, 0.8, { t: time + c.t, walk: c.t * 14, moving: true, fx: c.dir || 1, alpha: 0.95 });
    ctx.fillStyle = '#ff2a3a'; ctx.beginPath(); ctx.arc(c.x, c.y + 2, 4, 0, PI2); ctx.fill();
    const a = 0.3 + 0.3 * Math.sin(time * 14); ctx.strokeStyle = 'rgba(255,60,90,' + a + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(c.x, c.y, 22 + (6 - c.life) * 1.5, 0, PI2); ctx.stroke();
  }
  function drawTurret(ctx, t, time) {
    if (t.dragon) return WB.drawDragon(ctx, t, time);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(t.x + 4, t.y + 10, 20, 8, 0, 0, PI2); ctx.fill();
    ctx.fillStyle = t.flash > 0 ? '#fff' : '#59606e'; ctx.strokeStyle = '#23262e'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(t.x, t.y, 17, 0, PI2); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.ang); ctx.fillStyle = '#8a92a2'; ctx.fillRect(0, -5, 24, 10); ctx.strokeRect(0, -5, 24, 10); ctx.restore();
    ctx.fillStyle = '#ff9a3c'; ctx.beginPath(); ctx.arc(t.x, t.y, 6, 0, PI2); ctx.fill();
    const p = t.hp / t.maxhp; ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(t.x - 16, t.y - 28, 32, 5); ctx.fillStyle = '#9ad8ff'; ctx.fillRect(t.x - 15, t.y - 27, 30 * p, 3);
  }
  function drawSpider(ctx, s, time) {
    ctx.save(); ctx.translate(s.x, s.y); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(2, 9, 14, 6, 0, 0, PI2); ctx.fill();
    ctx.rotate(s.ang); ctx.strokeStyle = '#1d1228'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (const d of [-1, 1]) for (let i = 0; i < 4; i++) { const w = Math.sin(time * 12 + i * 1.6 + d) * 3, a = -0.9 + i * 0.6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a + 0.9) * 8 + 6, d * (11 + w)); ctx.lineTo(Math.cos(a + 0.9) * 14 + 10, d * (20 + w)); ctx.stroke(); }
    ctx.fillStyle = '#4a2a6a'; ctx.beginPath(); ctx.ellipse(-4, 0, 11, 9, 0, 0, PI2); ctx.fill(); ctx.fillStyle = '#5c3a80'; ctx.beginPath(); ctx.arc(8, 0, 7, 0, PI2); ctx.fill();
    ctx.fillStyle = '#ff4a5a'; ctx.beginPath(); ctx.arc(11, -3, 2, 0, PI2); ctx.arc(11, 3, 2, 0, PI2); ctx.fill(); ctx.restore();
  }
  function drawWall(ctx, w) {
    if (w.grp && WB.drawWallBlock) return WB.drawWallBlock(ctx, w);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(w.x - w.w / 2 + 6, w.y - w.h / 2 + 8, w.w, w.h);
    ctx.fillStyle = w.flash > 0 ? '#fff' : '#a89478'; ctx.strokeStyle = '#4a3a28'; ctx.lineWidth = 3; ctx.fillRect(w.x - w.w / 2, w.y - w.h / 2, w.w, w.h); ctx.strokeRect(w.x - w.w / 2, w.y - w.h / 2, w.w, w.h);
    ctx.strokeStyle = 'rgba(74,58,40,.7)'; ctx.lineWidth = 2; ctx.beginPath();
    if (w.w > w.h) for (let x = w.x - w.w / 2 + 30; x < w.x + w.w / 2; x += 30) { ctx.moveTo(x, w.y - w.h / 2); ctx.lineTo(x, w.y + w.h / 2); } else for (let y = w.y - w.h / 2 + 30; y < w.y + w.h / 2; y += 30) { ctx.moveTo(w.x - w.w / 2, y); ctx.lineTo(w.x + w.w / 2, y); }
    ctx.stroke();
    const p = Math.max(0, w.hp / w.maxhp); if (p < 1) { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(w.x - 20, w.y - 5, 40, 6); ctx.fillStyle = '#ffd24a'; ctx.fillRect(w.x - 19, w.y - 4, 38 * p, 4); }
  }
  function drawProj(ctx, p, time) {
    if (p.kind === 'bomb') {
      const u = Math.min(1, p.u), h = Math.sin(u * Math.PI) * 46; ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 6, 9, 4, 0, 0, PI2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,170,60,.35)'; ctx.lineWidth = 2; ctx.setLineDash([3, 6]); ctx.beginPath(); ctx.arc(p.tx, p.ty, 74, 0, PI2); ctx.stroke(); ctx.setLineDash([]);
      WB.drawIcon(ctx, 'bomb', p.x, p.y - h, 22); return;
    }
    if (p.kind === 'fire') { const g = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 20); g.addColorStop(0, '#fff6c0'); g.addColorStop(0.4, '#ffb02e'); g.addColorStop(1, 'rgba(255,80,20,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 20, 0, PI2); ctx.fill(); for (let i = 1; i < 5; i++) { ctx.fillStyle = 'rgba(255,' + (150 - i * 20) + ',30,' + (0.5 - i * 0.1) + ')'; ctx.beginPath(); ctx.arc(p.x - p.dx * i * 9, p.y - p.dy * i * 9, 11 - i * 1.5, 0, PI2); ctx.fill(); } }
    else if (p.kind === 'web') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(time * 8); ctx.strokeStyle = '#f4f0ff'; ctx.lineWidth = 2; for (let a = 0; a < 6; a++) { const an = a * Math.PI / 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(an) * 15, Math.sin(an) * 15); ctx.stroke(); } ctx.beginPath(); for (let a = 0; a <= 6; a++) ctx.lineTo(Math.cos(a * Math.PI / 3) * 9, Math.sin(a * Math.PI / 3) * 9); ctx.stroke(); ctx.restore(); }
    else if (p.kind === 'spear') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.dy, p.dx)); ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(14, 0); ctx.stroke(); ctx.fillStyle = '#b8f0d0'; ctx.shadowColor = '#6affb0'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(10, -7); ctx.lineTo(10, 7); ctx.closePath(); ctx.fill(); ctx.restore(); }
    else if (p.kind === 'stone') { ctx.fillStyle = '#8a8f9c'; ctx.strokeStyle = '#3a3e4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, PI2); ctx.fill(); ctx.stroke(); }
    else { ctx.fillStyle = '#ffe27a'; ctx.shadowColor = '#ffb84a'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, PI2); ctx.fill(); ctx.shadowBlur = 0; }
  }
  function drawFx(ctx, e, G, time) {
    const u = Math.min(1, e.t / e.life), a = Math.max(0, 1 - u);
    switch (e.type) {
      case 'beam': { // rayon d'énergie : cœur clair, bordure colorée, scintillement
        const w = (e.w || 18) * (0.7 + 0.3 * Math.sin(u * 40)) * Math.min(1, (1 - u) * 2.5 + 0.3); ctx.globalAlpha = Math.min(1, a * 1.6); ctx.lineCap = 'round';
        ctx.shadowColor = e.col; ctx.shadowBlur = 18; ctx.strokeStyle = e.col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x2, e.y2); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ffe9a0'; ctx.lineWidth = w * 0.45; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x2, e.y2); ctx.stroke();
        ctx.fillStyle = '#fff'; for (let k = 0; k < 6; k++) { const q = (k / 6 + u * 2) % 1; ctx.beginPath(); ctx.arc(e.x + (e.x2 - e.x) * q + Math.sin(k * 7 + u * 30) * 5, e.y + (e.y2 - e.y) * q + Math.cos(k * 5 + u * 30) * 5, 2.5, 0, PI2); ctx.fill(); }
        ctx.lineCap = 'butt'; ctx.globalAlpha = 1; break; }
      case 'whirl': { // tourbillon de flammes autour du personnage
        const cx = e.f ? e.f.x : e.x, cy = e.f ? e.f.y : e.y, R = e.r * Math.min(1, u * 6), fade = u > 0.8 ? (1 - u) / 0.2 : 1, ang = e.t * 7;
        ctx.save(); ctx.globalAlpha = 0.9 * fade; ctx.shadowColor = '#ff5a00'; ctx.shadowBlur = 16;
        for (let arm = 0; arm < 4; arm++) for (let k = 0; k < 26; k++) {
          const q = k / 26, aa = ang + arm * Math.PI / 2 + q * 2.4, rr = R * (0.25 + 0.75 * q), x = cx + Math.cos(aa) * rr, y = cy + Math.sin(aa) * rr * 0.9;
          ctx.fillStyle = q < 0.4 ? '#ffe27a' : q < 0.75 ? '#ff9a2a' : '#ff4a1a'; ctx.beginPath(); ctx.arc(x, y, 5 + 9 * q, 0, PI2); ctx.fill();
        }
        ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,140,40,.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.9, 0, 0, PI2); ctx.stroke(); ctx.restore(); break; }
      case 'ring': ctx.strokeStyle = e.col; ctx.globalAlpha = a; ctx.lineWidth = Math.max(0.5, (e.w || 4) * a + 1); ctx.beginPath(); ctx.arc(e.x, e.y, Math.max(0.1, Math.abs(e.r) * (0.2 + 0.8 * Math.min(1, u * 2.2))), 0, PI2); ctx.stroke(); ctx.globalAlpha = 1; break;
      case 'snow': ctx.fillStyle = 'rgba(190,240,255,' + a + ')'; ctx.strokeStyle = 'rgba(230,252,255,' + a + ')'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(e.x, e.y, e.r * Math.min(1, u * 3), 0, PI2); ctx.globalAlpha = a * 0.25; ctx.fill(); ctx.globalAlpha = 1; for (const p of e.ps) { ctx.save(); ctx.translate(e.x + p.x, e.y + p.y); ctx.rotate(u * 2); ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(0, -p.r); ctx.lineTo(p.r * 0.6, 0); ctx.lineTo(0, p.r); ctx.lineTo(-p.r * 0.6, 0); ctx.closePath(); ctx.fillStyle = '#d8f6ff'; ctx.fill(); ctx.restore(); } ctx.globalAlpha = 1; break;
      case 'burst': ctx.fillStyle = e.col; ctx.globalAlpha = a; for (const p of e.ps) { ctx.beginPath(); ctx.arc(e.x + p.vx * e.t, e.y + p.vy * e.t, p.r * a + 0.5, 0, PI2); ctx.fill(); } ctx.globalAlpha = 1; break;
      case 'boom': { const g = ctx.createRadialGradient(e.x, e.y, 2, e.x, e.y, 80 * Math.min(1, u * 3 + 0.2)); g.addColorStop(0, 'rgba(255,250,210,' + a + ')'); g.addColorStop(0.45, 'rgba(255,150,40,' + a * 0.8 + ')'); g.addColorStop(1, 'rgba(255,60,10,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x, e.y, 82, 0, PI2); ctx.fill(); break; }
      case 'text': ctx.font = 'bold ' + e.size + 'px "Trebuchet MS",sans-serif'; ctx.textAlign = 'center'; ctx.globalAlpha = Math.min(1, a * 2); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.strokeText(e.txt, e.x, e.y - u * 34); ctx.fillStyle = e.col; ctx.fillText(e.txt, e.x, e.y - u * 34); ctx.globalAlpha = 1; break;
      case 'tide': WB.drawTide(ctx, e, time); break;
      case 'wave': ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.ang); ctx.globalAlpha = a * 0.7; const rr = e.r * Math.min(1, u * 2.4 + 0.2); ctx.fillStyle = e.col; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, rr, -e.half, e.half); ctx.closePath(); ctx.globalAlpha = a * 0.35; ctx.fill(); ctx.globalAlpha = a; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, rr, -e.half, e.half); ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1; break;
      case 'arc': ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.ang); ctx.globalAlpha = a; ctx.strokeStyle = e.col; ctx.lineWidth = 12 * a + 2; ctx.lineCap = 'round'; const s0 = e.side > 0 ? -e.half : e.half, s1 = e.side > 0 ? e.half : -e.half; ctx.beginPath(); ctx.arc(0, 0, e.r * 0.85, s0, s0 + (s1 - s0) * Math.min(1, u * 2.5), e.side < 0); ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1; break;
      case 'warn': ctx.strokeStyle = e.col; ctx.lineWidth = 3; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 30); ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, PI2); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; break;
      case 'bolt': ctx.strokeStyle = 'rgba(255,255,200,' + a + ')'; ctx.shadowColor = '#ffe94a'; ctx.shadowBlur = 20; ctx.lineWidth = 7 * a + 2; ctx.lineJoin = 'round'; ctx.beginPath(); e.pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,250,170,' + a * 0.6 + ')'; ctx.beginPath(); ctx.arc(e.x, e.y, 56 * (1 - a * 0.4), 0, PI2); ctx.fill(); break;
      case 'chain': ctx.strokeStyle = 'rgba(255,240,120,' + a + ')'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(e.x, e.y); const mx = (e.x + e.x2) / 2 + rnd(-16, 16), my = (e.y + e.y2) / 2 + rnd(-16, 16); ctx.lineTo(mx, my); ctx.lineTo(e.x2, e.y2); ctx.stroke(); break;
      case 'shark': WB.drawShark(ctx, e.x, e.y, e.t); break;
      case 'tongue': { const pr = u < 0.5 ? u * 2 : (1 - u) * 2, ex = e.x + (e.x2 - e.x) * pr, ey = e.y + (e.y2 - e.y) * pr; ctx.strokeStyle = '#ff6a9a'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(ex, ey); ctx.stroke(); ctx.fillStyle = '#ff8ab0'; ctx.beginPath(); ctx.arc(ex, ey, 10, 0, PI2); ctx.fill(); break; }
      case 'cancel': ctx.globalAlpha = a; ctx.strokeStyle = '#cfd6e8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(e.x, e.y, 22 + 14 * u, 0, PI2); ctx.stroke(); ctx.strokeStyle = '#ff5a6a'; ctx.beginPath(); ctx.moveTo(e.x - 16, e.y - 16); ctx.lineTo(e.x + 16, e.y + 16); ctx.stroke(); ctx.globalAlpha = 1; break;
      case 'icon': ctx.globalAlpha = Math.min(1, a * 2); WB.drawIcon(ctx, e.id, e.x, e.y - u * 34, 34); ctx.globalAlpha = 1; break;
      case 'web': break;
    }
  }
})(window.WB);
