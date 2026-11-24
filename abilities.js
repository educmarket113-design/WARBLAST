'use strict';
(function (WB) {
  const A = WB.ABIL = {};
  const G = () => WB.G;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  function def(id, o) { o.id = id; A[id] = o; }
  const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return Math.abs(d); };

  // type : 'zone' = rayon autour du joueur (pas de visée), 'aim' = visée avec le stick droit
  def('ice', {
    name: 'Glace', col: '#7fdcff', type: 'zone', cd: L => 7.5 - 0.4 * L, range: L => 150 + 20 * L,
    desc: 'Gèle tous les ennemis dans le rayon : dégâts + immobilisation.',
    cast(f, ab) {
      const g = G(), L = ab.lvl, r = A.ice.range(L);
      g.fx('ring', f.x, f.y, { r: r, col: '#bff0ff', life: 0.55, w: 8 });
      g.fx('snow', f.x, f.y, { r: r, life: 0.7 });
      for (const t of g.enemiesIn(f, f.x, f.y, r)) { g.damage(t, 14 + 6 * L, f, 'ice'); g.status(t, 'frozen', 1.2 + 0.35 * L); }
      g.sfx('ice');
    },
    ai: { max: L => 150 + 20 * L - 20, min: 0 }
  });

  def('fire', {
    name: 'Feu', col: '#ff7a1c', type: 'aim', cd: L => 3.2 - 0.15 * L, range: L => 420,
    desc: 'Niveau 1 : une boule de feu. Niveau 2 : deux boules. Niveau 3 : un rayon de feu. Niveau 4 : deux rayons. Niveau 5 : tourbillon de flammes à 360° autour de toi.',
    cast(f, ab, aim) {
      const g = G(), L = ab.lvl, base = Math.atan2(aim.y, aim.x);
      if (L <= 2) {
        for (let i = 0; i < L; i++) {
          const a = base + (i - (L - 1) / 2) * 0.22;
          g.proj({ x: f.x, y: f.y, dx: Math.cos(a), dy: Math.sin(a), speed: 560, life: 0.78, r: 13, owner: f, ab: 'fire', lvl: L, kind: 'fire',
            onHit(p, t) { g.damage(t, 10 + 3 * L, f, 'fire'); g.burn(t, 16 + 7 * L, 4, f, 'fire'); g.fx('burst', p.x, p.y, { col: '#ff9a3c', n: 10, life: 0.4 }); return true; } });
        }
      } else if (L <= 4) {
        // rayons de feu : le rayon s'arrête sur les murs et brûle tout ce qu'il traverse pendant 0.6 s
        const nb = L - 2, LEN = 330;
        for (let i = 0; i < nb; i++) {
          const a = base + (i - (nb - 1) / 2) * 0.38, dx = Math.cos(a), dy = Math.sin(a);
          for (let k = 0; k < 4; k++) g.later(k * 0.18, () => {
            if (!f.alive) return;
            let len = LEN; for (let d = 20; d <= LEN; d += 12) { if (g.world.solidAt(f.x + dx * d, f.y + dy * d)) { len = d; break; } }
            const ex = f.x + dx * len, ey = f.y + dy * len; g.fx('beam', f.x, f.y, { x2: ex, y2: ey, life: 0.26, col: '#ff7a1c', w: 20 });
            for (const t of g.enemiesIn(f, f.x + dx * len / 2, f.y + dy * len / 2, len / 2 + 30)) {
              const px = t.x - f.x, py = t.y - f.y, along = px * dx + py * dy, side = Math.abs(px * dy - py * dx);
              if (along > 0 && along < len + t.r && side < 30 + t.r * 0.6) { g.damage(t, 7 + 2 * L, f, 'fire'); if (k === 0) g.burn(t, 14 + 6 * L, 3.5, f, 'fire'); }
            }
          });
        }
        g.shake(2);
      } else {
        // tourbillon de flammes à 360° qui suit le lanceur
        const R = 150, T = 2.4; g.fx('whirl', f.x, f.y, { f: f, r: R, life: T, col: '#ff7a1c' });
        for (let k = 0; k < 12; k++) g.later(k * 0.2, () => {
          if (!f.alive) return;
          for (const t of g.enemiesIn(f, f.x, f.y, R)) { g.damage(t, 9 + 2 * L, f, 'fire'); if (k % 3 === 0) g.burn(t, 20, 3, f, 'fire'); const d = Math.hypot(t.x - f.x, t.y - f.y) || 1; g.knock && g.knock(t, (t.x - f.x) / d, (t.y - f.y) / d, 60); }
        });
        g.shake(3);
      }
      g.sfx('fire');
    },
    ai: { max: L => 400, min: 40 }
  });

  def('hole', {
    name: 'Trou noir', col: '#8a4fe0', type: 'aim', cd: L => 21 - L, range: L => 280,
    desc: 'Aspire les ennemis et tue ceux qui touchent le centre. Très longue recharge.',
    cast(f, ab, aim) {
      const g = G(), L = ab.lvl, d = Math.max(60, A.hole.range(L) * clamp(aim.m, 0.25, 1));
      let x = f.x + aim.x * d, y = f.y + aim.y * d;
      if (g.world.solidAt(x, y)) { x = f.x + aim.x * 70; y = f.y + aim.y * 70; }
      g.addHole({ x: x, y: y, r: 120 + 24 * L, life: 1.7, owner: f, L: L, hit: new Set() });
      g.sfx('hole');
    },
    ai: { max: L => 300, min: 50 }
  });

  def('wall', {
    name: 'Mur', col: '#b8a48a', type: 'aim', cd: L => 8, range: L => 180,
    desc: 'Crée un mur qui bloque tout. Plus le niveau est haut, plus il résiste.',
    cast(f, ab, aim) {
      const g = G(), L = ab.lvl; let d = 70 + 110 * clamp(aim.m, 0, 1), x, y, ok = false;
      for (let k = 0; k < 4 && !ok; k++, d -= 22) { x = f.x + aim.x * d; y = f.y + aim.y * d; ok = !g.world.solidAt(x, y) && g.world.pass(Math.floor(x / WB.TS), Math.floor(y / WB.TS)); }
      if (!ok) return false;
      const vert = Math.abs(aim.x) > Math.abs(aim.y), len = 150 + 14 * L;
      g.addWall({ x: x, y: y, w: vert ? 28 : len, h: vert ? len : 28, hp: 70 + 45 * L, maxhp: 70 + 45 * L, life: 14, owner: f });
      g.sfx('wall');
    },
    ai: { max: L => 280, min: 60, cond: (f, ab, t, d) => f.hp < f.maxhp * 0.6 }
  });

  def('shield', {
    name: 'Bouclier', col: '#5ab4ff', type: 'zone', cd: L => 2.6 + 0.5 * L + 8, range: L => 60,
    desc: 'Aucun dégât subi pendant la durée. Ceux que tu touches sont blessés.',
    cast(f, ab) {
      const g = G(), L = ab.lvl; f.st.shield = 2.6 + 0.5 * L; f.shieldL = L; f.shieldHit = new Map(); f.shieldNoHit = false;
      // en équipe : le bouclier protège aussi les alliés proches (autant que le niveau)
      if (g.mode.teams) { const al = g.F.filter(x => x !== f && x.alive && x.team === f.team && (x.kind === 'player' || x.kind === 'bot' || x.kind === 'thrall') && Math.hypot(x.x - f.x, x.y - f.y) < 190 + 25 * L).sort((p, q) => Math.hypot(p.x - f.x, p.y - f.y) - Math.hypot(q.x - f.x, q.y - f.y)).slice(0, L); for (const x of al) { x.st.shield = 2.6 + 0.5 * L; x.shieldNoHit = true; g.fx('ring', x.x, x.y, { r: 50, col: '#9ad8ff', life: 0.4, w: 5 }); } }
 g.fx('ring', f.x, f.y, { r: 60, col: '#9ad8ff', life: 0.4, w: 6 }); g.sfx('shield');
    },
    ai: { max: L => 260, min: 0, cond: (f, ab, t, d) => f.hp < f.maxhp * 0.65 || f.hurtT > 0 }
  });

  def('tp', {
    name: 'Téléportation', col: '#c874ff', type: 'aim', cd: L => 4, range: L => 380,
    desc: 'Pose une balise secrète, puis reviens-y. Peut aussi téléporter un ennemi, qui perd un de ses fruits.',
    cast(f, ab, aim) {
      const g = G();
      if (aim.m > 0.3) {
        const px = f.x + aim.x * A.tp.range(ab.lvl) * aim.m, py = f.y + aim.y * A.tp.range(ab.lvl) * aim.m;
        let best = null, bd = 110;
        for (const t of g.enemiesIn(f, px, py, 110)) { const d = Math.hypot(t.x - px, t.y - py); if (d < bd) { bd = d; best = t; } }
        if (best) {
          // la victime perd un de ses fruits : il tombe là où elle se trouvait
          const ox = best.x, oy = best.y, filled = []; best.slots.forEach((s, i) => { if (s && !s.stolen) filled.push(i); });
          if (filled.length) { const k = filled[(Math.random() * filled.length) | 0], lost = best.slots[k]; best.slots[k] = null; g.addPickup({ kind: 'bloc', id: lost.id, lvl: lost.lvl, x: ox, y: oy, noPick: g.t + 1.2 }); g.text(ox, oy - 40, 'Fruit perdu', '#ffb0ff', 16); g.fx('burst', ox, oy, { col: '#e0b0ff', n: 16, life: 0.6 }); if (best === g.player) g.swap = null; }
          if (ab.lvl >= 5) { const left = []; best.slots.forEach((s2, i) => { if (s2 && !s2.stolen) left.push(i); }); if (left.length) { const k2 = left[(Math.random() * left.length) | 0], lost2 = best.slots[k2]; best.slots[k2] = null; g.addPickup({ kind: 'bloc', id: lost2.id, lvl: lost2.lvl, x: ox + 30, y: oy, noPick: g.t + 1.2 }); } }
          if (ab.lvl >= 3) g.status(best, 'stun', 0.5 + 0.2 * ab.lvl);
          g.teleportRandom(best); g.sfx('tp'); return;
        }
      }
      if (!f.beacon) { f.beacon = { x: f.x, y: f.y }; g.fx('ring', f.x, f.y, { r: 36, col: '#e0b0ff', life: 0.5, w: 4 }); g.sfx('click'); return 1; }
      g.fx('burst', f.x, f.y, { col: '#e0b0ff', n: 14, life: 0.5 });
      f.x = f.beacon.x; f.y = f.beacon.y; f.vx = f.vy = 0;
      g.fx('burst', f.x, f.y, { col: '#e0b0ff', n: 14, life: 0.5 }); f.beacon = null; g.sfx('tp');
    },
    ai: { max: L => 120, min: 0, cond: (f, ab, t, d) => (!f.beacon && Math.random() < 0.3) || (f.beacon && f.hp < f.maxhp * 0.4) || d < 110, aimMode: 'tp' }
  });

  def('dash', {
    name: 'Vitesse', col: '#ffd24a', type: 'aim', cd: L => 7.5 - 0.3 * L, range: L => 290,
    desc: 'Fonce en ligne droite et blesse ce que tu heurtes.',
    cast(f, ab, aim) {
      const g = G(), L = ab.lvl;
      let dx = aim.x, dy = aim.y; if (aim.m < 0.12) { dx = f.face.x; dy = f.face.y; }
      f.dash = { t: 0.17, dx: dx, dy: dy, hit: new Set(), dmg: 20 + 5 * L, L: L };
      g.fx('ring', f.x, f.y, { r: 30, col: '#ffe27a', life: 0.3, w: 5 }); g.sfx('dash');
    },
    ai: { max: L => 290, min: 110, cond: (f, ab, t, d) => true }
  });

  function cone(id, nm, col, desc, silence, dmgf, force, stunf) {
    def(id, {
      name: nm, col: col, type: 'aim', cd: L => 6.5 - 0.2 * L - (silence ? 0 : 1), range: L => 270 + (L >= 4 ? 70 : 0), desc: desc,
      cast(f, ab, aim) {
        const g = G(), L = ab.lvl, base = Math.atan2(aim.y, aim.x);
        // niv.1-2 : un cône. niv.3 : deuxième vague plus large. niv.4 : cône très large, trois vagues. niv.5 : tempête sur 360°
        const R = A[id].range(L), half = L >= 5 ? Math.PI : L >= 4 ? 1.0 : 0.55, waves = L >= 4 ? 3 : L >= 3 ? 2 : 1;
        const wave = function (k) {
          if (!f.alive) return; const RR = R + 40 * k, hh = Math.min(Math.PI, half + 0.15 * k);
          g.fx('wave', f.x, f.y, { ang: base, r: RR, half: hh, col: col, life: 0.45 });
          for (const t of g.enemiesIn(f, f.x, f.y, RR)) {
            const a = Math.atan2(t.y - f.y, t.x - f.x);
            if (hh < Math.PI && angDiff(a, base) > hh && Math.hypot(t.x - f.x, t.y - f.y) > 60) continue;
            g.damage(t, dmgf(L) * (k ? 0.6 : 1), f, id);
            g.knock(t, Math.cos(a), Math.sin(a), force * (k ? 0.6 : 1));
            if (silence) g.status(t, 'silence', 2 + 0.4 * L);
            if (stunf) g.status(t, 'stun', stunf(L));
          }
          g.sfx(id === 'water' ? 'water' : 'wind');
        };
        wave(0); for (let k = 1; k < waves; k++) g.later(0.3 * k, function () { wave(k); });
      },
      ai: { max: L => 250, min: 0 }
    });
  }
  cone('water', 'Eau', '#3fa4ff', 'Repousse les ennemis et les empêche d\'utiliser leurs capacités. Dans l\'eau, ils meurent.', true, L => 8 + 3 * L, 620, null);
  cone('wind', 'Vent', '#d6f4ee', 'Repousse et étourdit les ennemis. Ils gardent leurs capacités.', false, L => 14 + 4 * L, 700, L => 1 + 0.15 * L);

  def('scythe', {
    name: 'Fourche', col: '#9b5cff', type: 'aim', cd: L => (L >= 5 ? 9 : 5), range: L => (L >= 5 ? 180 : 200),
    desc: 'Fourche du diable : une fourche, deux fourches croisées, grande fourche protectrice et toxique, deux grandes fourches, fourche à tête de mort.',
    cast(f, ab, aim) {
      const g = G(), L = ab.lvl, base = Math.atan2(aim.y, aim.x), R = L >= 5 ? 160 : 100 + 10 * L, half = L >= 5 ? Math.PI : L >= 4 ? 1.6 : 1.0, swings = [1, 2, 2, 3, 4][L - 1];
      const swing = (side) => { if (!f.alive) return; g.arcHit(f, f.x, f.y, R, base, half, 24 + 5 * L, 'scythe'); g.fx('arc', f.x, f.y, { ang: base, r: R, half: half, side: side, life: 0.28, col: '#e8f0ff' }); g.sfx('swing'); };
      for (let k = 0; k < swings; k++) { if (k === 0) swing(1); else g.later(0.38 * k, () => swing(k % 2 ? -1 : 1)); }
    },
    ai: { max: L => 190, min: 0 }
  });

  def('invis', {
    name: 'Invisibilité', col: '#aab4e8', type: 'zone', cd: L => 4 + 0.6 * L + 9, range: L => 80,
    desc: 'Deviens invisible. Les ennemis que tu touches subissent des dégâts.',
    cast(f, ab) { const L = ab.lvl; if (G().mode.teams) { const al = G().F.filter(x => x !== f && x.alive && x.team === f.team && (x.kind === 'player' || x.kind === 'bot') && Math.hypot(x.x - f.x, x.y - f.y) < 150 + 20 * L).slice(0, L); for (const x of al) { x.st.invis = 4 + 0.6 * L; x.invisHit = null; G().fx('burst', x.x, x.y, { col: '#dfe6ff', n: 10, life: 0.5 }); } } f.st.invis = 4 + 0.6 * L; f.invisHit = new Set(); f.invisDmg = 28 + 6 * L; G().fx('burst', f.x, f.y, { col: '#dfe6ff', n: 14, life: 0.5 }); G().sfx('invis'); },
    ai: { max: L => 360, min: 0 }
  });

  def('spider', {
    name: 'Araignée', col: '#7a4aa8', type: 'aim', cd: L => 6.5 - 0.25 * L, range: L => 380,
    desc: 'Lance une toile : immobilise, blesse dans la durée, puis ralentit.',
    cast(f, ab, aim) {
      const g = G(), L = ab.lvl, n = L >= 5 ? 3 : L >= 3 ? 2 : 1, base = Math.atan2(aim.y, aim.x);
      for (let i = 0; i < n; i++) {
        const a = base + (i - (n - 1) / 2) * 0.22;
        g.proj({ x: f.x, y: f.y, dx: Math.cos(a), dy: Math.sin(a), speed: 480, life: 0.8, r: 14, owner: f, ab: 'spider', lvl: L, kind: 'web',
          onHit(p, t) { const dur = 1.4 + 0.25 * L; g.damage(t, 4, f, 'spider'); g.status(t, 'root', dur); g.dotFlat(t, 18 + 7 * L, dur, f, 'spider'); t.st.afterRoot = 3; g.fx('web', t.x, t.y, { life: dur, t: t }); if (L >= 4) { const o2 = g.enemiesIn(f, t.x, t.y, 210).filter(q => q !== t)[0]; if (o2) { g.fx('chain', t.x, t.y, { x2: o2.x, y2: o2.y, life: 0.3, col: '#c8a0ff' }); g.status(o2, 'root', dur * 0.7); g.dotFlat(o2, 12 + 5 * L, dur * 0.7, f, 'spider'); o2.st.afterRoot = 2; g.fx('web', o2.x, o2.y, { life: dur * 0.7, t: o2 }); } } return true; } });
      }
      g.sfx('web');
    },
    ai: { max: L => 360, min: 40 }
  });

  def('clown', {
    name: 'Clown', col: '#ff4a8a', type: 'zone', cd: L => 10, range: L => 400,
    desc: 'Crée des clowns explosifs (autant que ton niveau) qui poursuivent les ennemis.',
    cast(f, ab) {
      const g = G(), L = ab.lvl; if (g.clownCount(f) >= L) return false;
      const es = g.enemiesIn(f, f.x, f.y, 700).sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y));
      for (let i = 0; i < L; i++) {
        const a = (i / L) * Math.PI * 2, tg = es.length ? es[i % es.length] : null;
        g.addClown({ x: f.x + Math.cos(a) * 34, y: f.y + Math.sin(a) * 34, owner: f, L: L, target: tg, life: 6, spec: f.spec, hit: false, t: 0 });
      }
      g.fx('burst', f.x, f.y, { col: '#ff8ab8', n: 12, life: 0.5 }); g.sfx('clown');
    },
    ai: { max: L => 420, min: 0 }
  });

  def('necro', {
    name: 'Nécromancien', col: '#6ae0a0', type: 'aim', cd: L => 12, range: L => 400 + 30 * L,
    desc: 'Lance de mort : elle traverse les murs en perdant de la portée. L\'ennemi touché devient ton esclave et prend les coups à ta place.',
    cast(f, ab, aim) {
      const g = G(), L = ab.lvl, R = 400 + 30 * L;
      const nsp = L >= 5 ? 3 : L >= 3 ? 2 : 1, b0 = Math.atan2(aim.y, aim.x);
      for (let i = 0; i < nsp; i++) { const a2 = b0 + (i - (nsp - 1) / 2) * 0.3;
      g.proj({ x: f.x, y: f.y, dx: Math.cos(a2), dy: Math.sin(a2), speed: 640, life: R / 640, r: 12, owner: f, ab: 'necro', lvl: L, kind: 'spear', pierce: true,
        onHit(p, t) {
          g.damage(t, 10 + 3 * L, f, 'necro');
          if ((t.kind === 'player' || t.kind === 'bot') && t.alive && !t.thrall) g.enthrall(f, t, L); else g.fx('burst', t.x, t.y, { col: '#8affc8', n: 10, life: 0.45 });
          return true;
        } }); }
      g.sfx('spear');
    },
    ai: { max: L => 400 + 30 * L, min: 60 }
  });

  def('turret', {
    name: 'Tourelle', col: '#8a92a2', type: 'aim', cd: L => 11, range: L => 180,
    desc: 'Pose des tourelles (autant que ton niveau) qui tirent sur les ennemis proches.',
    cast(f, ab, aim) {
      const g = G(), L = ab.lvl; let d = 50 + 130 * clamp(aim.m, 0, 1), x, y, ok = false;
      for (let k = 0; k < 4 && !ok; k++, d -= 28) { x = f.x + aim.x * d; y = f.y + aim.y * d; ok = !g.world.solidAt(x, y) && g.world.pass(Math.floor(x / WB.TS), Math.floor(y / WB.TS)); }
      if (!ok) { x = f.x; y = f.y; }
      g.addTurret({ x: x, y: y, hp: 60 + 10 * L, maxhp: 60 + 10 * L, owner: f, L: L, life: 16, cd: 0.4, ang: 0 });
      g.sfx('wall');
    },
    ai: { max: L => 340, min: 0 }
  });

  def('jump', {
    name: 'Rebond', col: '#7aeea0', type: 'aim', cd: L => 7.5, range: L => 300,
    desc: 'Bondis dans une zone : dégâts et étourdissement à l\'atterrissage.',
    cast(f, ab, aim) {
      const g = G(), L = ab.lvl; let d = 80 + 220 * clamp(aim.m, 0, 1), x, y, ok = false;
      for (let k = 0; k < 10 && !ok; k++, d -= 24) { x = f.x + aim.x * d; y = f.y + aim.y * d; ok = d < 30 || (g.world.pass(Math.floor(x / WB.TS), Math.floor(y / WB.TS)) && g.world.los(f.x, f.y, x, y)); }
      if (!ok) { x = f.x; y = f.y; }
      f.st.jump = { t: 0, dur: 0.45, x0: f.x, y0: f.y, x1: x, y1: y, L: L }; f.vx = f.vy = 0; g.sfx('jump');
    },
    ai: { max: L => 300, min: 90 }
  });

  def('bolt', {
    name: 'Électricité', col: '#ffe94a', type: 'aim', cd: L => 6.5 - 0.2 * L, range: L => 450,
    desc: 'Foudre : dégâts et silence. Niv.3 : l\'éclair saute à un ennemi proche. Niv.4 : deuxième coup. Niv.5 : tempête de 3 éclairs et 2 rebonds.',
    cast(f, ab, aim) {
      const g = G(), L = ab.lvl, R = A.bolt.range(L), px = f.x + aim.x * R * Math.max(aim.m, 0.3), py = f.y + aim.y * R * Math.max(aim.m, 0.3);
      let tg = null, bd = 170;
      for (const t of g.enemiesIn(f, f.x, f.y, R + 60)) { const d = Math.hypot(t.x - px, t.y - py); if (d < bd) { bd = d; tg = t; } }
      let sx = tg ? tg.x : px, sy = tg ? tg.y : py;
      g.fx('warn', sx, sy, { r: 56, life: 0.4, col: '#ffe94a' }); g.sfx('zap0');
      g.later(0.4, () => {
        if (tg && tg.alive) { sx = tg.x; sy = tg.y; }
        g.fx('bolt', sx, sy, { life: 0.35 }); g.shake(6); g.sfx('zap');
        const hits = [];
        for (const t of g.enemiesIn(f, sx, sy, 56)) { hits.push(t); g.damage(t, 30 + 8 * L, f, 'bolt'); g.status(t, 'silence', 1.5 + 0.3 * L); }
        if (L >= 3 && hits.length) {
          const nmax = L >= 5 ? 2 : 1; let c = 0;
          for (const t of g.enemiesIn(f, sx, sy, 190)) { if (hits.includes(t) || c >= nmax) continue; c++; g.fx('chain', sx, sy, { x2: t.x, y2: t.y, life: 0.3 }); g.damage(t, 15 + 4 * L, f, 'bolt'); g.status(t, 'silence', 1); }
        }
        const strike = function (x, y, dmg) { if (!f.alive) return; g.fx('bolt', x, y, { life: 0.3 }); g.shake(3); g.sfx('zap'); for (const t of g.enemiesIn(f, x, y, 56)) { g.damage(t, dmg, f, 'bolt'); g.status(t, 'silence', 1); } };
        if (L >= 4) g.later(0.45, function () { strike(sx, sy, 20 + 6 * L); });
        if (L >= 5) for (let k = 0; k < 3; k++) g.later(0.25 + 0.22 * k, function () { const a = Math.random() * 6.283, d = 70 + Math.random() * 90; strike(sx + Math.cos(a) * d, sy + Math.sin(a) * d, 18); });
      });
    },
    ai: { max: L => 450, min: 0 }
  });

  def('glut', {
    name: 'Voleur', col: '#ff6a9a', type: 'zone', cd: L => 15 - 0.6 * L, range: L => 170 + 20 * L,
    desc: 'Tu grossis. Un ennemi proche est avalé par la langue : il ne perd rien, mais tu utilises ses capacités un moment, puis tu le recraches.',
    cast(f, ab) {
      const g = G(), L = ab.lvl; if (f.swallow) return false;
      let best = null, bd = A.glut.range(L); for (const t of g.F) { if (!t.alive || t.team === f.team || t.ghost || t.st.jump || t.thrall || (t.kind !== 'player' && t.kind !== 'bot')) continue; const d = Math.hypot(t.x - f.x, t.y - f.y); if (d < bd) { bd = d; best = t; } }
      if (!best) return false; g.swallow(f, best, L);
    },
    ai: { max: L => 150 + 20 * L, min: 0, cond: (f) => !f.swallow }
  });

  def('summon', {
    name: 'Invocation', col: '#4adcc8', type: 'zone', cd: L => 13 - 0.5 * L, range: L => 330,
    desc: 'Choisis un requin, un golem ou un dragon. Requin : avale et recrache les ennemis. Golem : te suit, te protège et lance des pierres. Dragon : crache du feu sur ceux qui passent.',
    cast(f, ab, aim) {
      const g = G(), L = ab.lvl; if (!ab.form) return false;
      if (ab.form === 'shark') {
        const es = g.enemiesIn(f, f.x, f.y, 330).sort((p, q) => Math.hypot(p.x - f.x, p.y - f.y) - Math.hypot(q.x - f.x, q.y - f.y)), picks = [];
        for (const t of es) { if (picks.length >= L) break; if (picks.every(p => Math.hypot(p.x - t.x, p.y - t.y) > 90)) picks.push(t); }
        if (!picks.length) return false; for (const t of picks) g.shark(f, t, L);
      } else if (ab.form === 'golem') { g.addGolem(f, L);
      } else {
        const n = Math.ceil(L / 2), base = Math.atan2(aim.y, aim.x);
        for (let i = 0; i < n; i++) { const a = base + (i - (n - 1) / 2) * 0.9; let d = 110, x, y; for (let k = 0; k < 4; k++, d -= 25) { x = f.x + Math.cos(a) * d; y = f.y + Math.sin(a) * d; if (!g.world.solidAt(x, y)) break; } if (g.world.solidAt(x, y)) { x = f.x; y = f.y; } g.addDragon(f, x, y, L); }
      }
    },
    ai: { max: L => 320, min: 0, cond: (f, ab) => !!ab.form }
  });

  def('cancel', {
    name: 'Annulation', col: '#aab4d8', type: 'aim', cd: L => 8 - 0.5 * L, range: L => 340,
    desc: 'Coupe les capacités des ennemis (autant que le niveau, tous dans la zone au niveau 5). Tes bombes reviennent 1 seconde après la dernière.',
    cast(f, ab, aim) {
      const g = G(), L = ab.lvl, R = 340; let tg;
      if (L >= 5) tg = g.enemiesIn(f, f.x, f.y, 300);
      else { const px = f.x + aim.x * R * Math.max(aim.m, 0.4), py = f.y + aim.y * R * Math.max(aim.m, 0.4); tg = g.enemiesIn(f, f.x, f.y, R).sort((p, q) => Math.hypot(p.x - px, p.y - py) - Math.hypot(q.x - px, q.y - py)).slice(0, L); }
      if (!tg.length) return false;
      if (L >= 5) g.fx('ring', f.x, f.y, { r: 300, col: '#cfd6e8', life: 0.6, w: 8 });
      for (const t of tg) { g.status(t, 'silence', 3 + 0.7 * L); t.st.shield = 0; if (WB.shieldBreak) WB.shieldBreak(t); t.st.invis = 0; g.fx('cancel', t.x, t.y, { life: 0.7 }); g.fx('chain', f.x, f.y, { x2: t.x, y2: t.y, life: 0.25 }); }
      g.sfx('zap0');
    },
    ai: { max: L => 330, min: 0, cond: (f, ab, t) => !!t && t.slots.some(Boolean) && !(t.st.silence > 0) }
  });

  WB.ABIL_IDS = Object.keys(A);
  // Rareté : les très puissantes apparaissent moins souvent
  WB.cdMul = id => (id === 'hole' || id === 'dash') ? 1 : 0.65; // recharges plus vives pour un jeu rapide
  WB.ABIL_WEIGHT = { ice: 10, fire: 12, hole: 3, wall: 8, shield: 9, tp: 6, dash: 9, water: 8, wind: 8, scythe: 8, invis: 6, spider: 8, clown: 7, necro: 4, turret: 7, jump: 8, bolt: 8, glut: 5, summon: 5, cancel: 6 };
  WB.randomAbility = function () {
    let tot = 0; for (const k of WB.ABIL_IDS) tot += WB.ABIL_WEIGHT[k] || 5;
    let r = Math.random() * tot; for (const k of WB.ABIL_IDS) { r -= WB.ABIL_WEIGHT[k] || 5; if (r <= 0) return k; }
    return 'fire';
  };
  // nombre d'utilisations avant recharge : 5 pour toutes les capacités, 2 pour le trou noir
  WB.maxCharges = ab => (ab && ab.id === 'hole') ? 2 : (ab && (ab.id === 'shield' || ab.id === 'tp')) ? 1 : 5;
  WB.newAbility = function (id, lvl) { return { id: id, lvl: lvl || 1, kills: WB.abilXp[(lvl || 1) - 1] || 0, cd: 0, n: WB.maxCharges({ id: id }), gap: 0 }; };
})(window.WB);
