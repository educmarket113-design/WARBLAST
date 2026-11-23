'use strict';
// Évolutions des pouvoirs : ce qui s'ajoute à chaque niveau (2 à 5) en plus du pouvoir de base.
(function (WB) {
  const A = WB.ABIL, G = () => WB.G;
  function wrap(id, fn) { const d = A[id], base = d.cast; d.cast = function (f, ab, aim) { const pre = fn.pre ? fn.pre(f, ab, aim) : null; const r = base.call(this, f, ab, aim); if (r !== false) fn.post(f, ab, aim, r, pre); return r; }; }
  function wrapPost(id, post, pre) { wrap(id, { pre: pre, post: post }); }

  // habillage visuel commun : plus le niveau est haut, plus le lancer est spectaculaire
  WB.evoFx = function (f, ab) {
    const g = G(), L = ab.lvl, d = A[ab.id]; if (!g || !d || L < 2) return;
    g.fx('ring', f.x, f.y, { r: 30 + 9 * L, col: d.col, life: 0.4, w: 2 + L });
    if (L >= 3) g.fx('burst', f.x, f.y, { col: d.col, n: 5 * L, life: 0.5 });
    if (L >= 4) g.later(0.12, function () { g.fx('ring', f.x, f.y, { r: 60 + 12 * L, col: '#ffffff', life: 0.35, w: 5 }); });
    if (L >= 5) { g.fx('ring', f.x, f.y, { r: 150, col: '#ffe27a', life: 0.6, w: 9 }); g.text(f.x, f.y - 56, 'MAX', '#ffe27a', 17); if (f === g.player) g.shake(3); }
  };

  // glace : niv.2 ralentit après le gel, niv.3 et 4 ajoutent des ondes, niv.5 blizzard de 6 pulsations
  function icePulse(f, r, dmg, frz) { const g = G(); if (!f.alive) return; g.fx('ring', f.x, f.y, { r: r, col: '#bff0ff', life: 0.5, w: 6 }); g.fx('snow', f.x, f.y, { r: r, life: 0.6 }); for (const t of g.enemiesIn(f, f.x, f.y, r)) { g.damage(t, dmg, f, 'ice'); g.status(t, 'frozen', frz); } }
  wrapPost('ice', function (f, ab) {
    const g = G(), L = ab.lvl, r = A.ice.range(L);
    if (L >= 2) for (const t of g.enemiesIn(f, f.x, f.y, r)) { t.st.slowT = 1.2 + 0.35 * L + 2; t.st.slowMax = t.st.slowT; t.st.slowAmt = 0.5; }
    if (L >= 3) g.later(0.6, function () { icePulse(f, r + 40, 8 + 3 * L, 0.8); });
    if (L >= 4) g.later(1.2, function () { icePulse(f, r + 80, 10 + 3 * L, 0.8); });
    if (L >= 5) for (let k = 0; k < 4; k++) g.later(1.8 + 0.4 * k, function () { icePulse(f, r + 60, 9, 0.6); });
  });
  A.ice.desc = 'Gèle les ennemis proches. Niv.2 : ils restent ralentis. Niv.3 et 4 : une, puis deux ondes de glace de plus. Niv.5 : blizzard de 6 ondes.';

  // trou noir : niv.3 dure plus, niv.4 deux trous, niv.5 trois trous
  wrapPost('hole', function (f, ab) {
    const g = G(), L = ab.lvl, h = g.holes[g.holes.length - 1]; if (!h) return;
    if (L >= 3) { h.life += 0.6; h.r += 20; }
    const extra = L >= 5 ? 2 : L >= 4 ? 1 : 0;
    for (let i = 0; i < extra; i++) { const a = (i === 0 ? 1 : -1) * Math.PI / 2, nx = Math.cos(Math.atan2(h.y - f.y, h.x - f.x) + a), ny = Math.sin(Math.atan2(h.y - f.y, h.x - f.x) + a), x = h.x + nx * 150, y = h.y + ny * 150; if (!g.world.solidAt(x, y)) g.addHole({ x: x, y: y, r: h.r * 0.85, life: h.life, owner: f, L: L, hit: new Set() }); }
  });
  A.hole.desc = 'Aspire les ennemis et tue ceux qui touchent le centre. Niv.3 : plus grand et plus long. Niv.4 : deux trous. Niv.5 : trois trous.';

  // mur : niv.3 mur double, niv.4 en U, niv.5 forteresse autour de toi
  wrapPost('wall', function (f, ab) {
    const g = G(), L = ab.lvl, w = g.walls[g.walls.length - 1]; if (!w || w.owner !== f) return;
    const okAt = function (x, y) { return !g.world.solidAt(x, y); }, vert = w.h > w.w, hp = w.maxhp;
    const add = function (x, y, ww, hh) { if (okAt(x, y)) g.addWall({ x: x, y: y, w: ww, h: hh, hp: hp, maxhp: hp, life: 14, owner: f }); };
    if (L >= 3 && L < 4) { vert ? add(w.x + 40, w.y, w.w, w.h) : add(w.x, w.y + 40, w.w, w.h); }
    if (L >= 4) { const sd = Math.max(w.w, w.h) / 2; if (vert) { add(w.x - 90, w.y - sd, 180, 28); add(w.x - 90, w.y + sd, 180, 28); } else { add(w.x - sd, w.y - 90, 28, 180); add(w.x + sd, w.y - 90, 28, 180); } }
    if (L >= 5) { const R = 80; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; add(f.x + Math.cos(a) * R, f.y + Math.sin(a) * R, k % 2 ? 28 : 70, k % 2 ? 70 : 28); } g.fx('ring', f.x, f.y, { r: R + 20, col: '#d8c8a8', life: 0.6, w: 8 }); }
  });
  A.wall.desc = 'Crée un mur qui bloque tout. Niv.3 : mur double. Niv.4 : mur en U. Niv.5 : en plus, une forteresse autour de toi.';

  // bouclier : niv.3 onde de choc à la fin, niv.4 elle étourdit, niv.5 elle soigne aussi
  wrapPost('shield', function (f, ab) {
    const g = G(), L = ab.lvl; if (L < 3) return; const T = 2.6 + 0.5 * L;
    g.later(T, function () { if (!f.alive) return; const R = 130 + 15 * L; g.fx('ring', f.x, f.y, { r: R, col: '#9ad8ff', life: 0.5, w: 10 }); g.splash(f, f.x, f.y, R, 12 + 6 * L, 'shield', { knock: 520, stun: L >= 4 ? 0.9 : 0 }); if (L >= 5) g.heal(f, f.maxhp * 0.15); g.shake(4); });
  });
  A.shield.desc = 'Aucun dégât pendant la durée. Niv.3 : onde de choc à la fin. Niv.4 : elle étourdit. Niv.5 : elle te soigne de 15 %.';

  // téléportation : niv.2 explosion à l\'arrivée, niv.3 aussi au départ, niv.4 invulnérable 1 s
  wrap('tp', { pre: function (f) { return { x: f.x, y: f.y, had: !!f.beacon }; }, post: function (f, ab, aim, r, pre) {
    const g = G(), L = ab.lvl; if (!pre.had || f.beacon) return;
    if (L >= 2) g.splash(f, f.x, f.y, 90 + 8 * L, 10 + 8 * L, 'tp', { knock: 300 });
    if (L >= 3) g.splash(f, pre.x, pre.y, 90 + 8 * L, 10 + 6 * L, 'tp', { knock: 300 });
    if (L >= 4) f.st.invuln = 1.0;
  } });
  A.tp.desc = 'Pose une balise, puis reviens-y. Niv.2 : explosion à l\'arrivée. Niv.3 : aussi au départ. Niv.4 : 1 s d\'invulnérabilité. Téléporter un ennemi lui fait perdre un fruit (2 au niv.5) et l\'étourdit dès le niv.3.';

  // vitesse : niv.3 traînée qui blesse, niv.4 elle ralentit, niv.5 onde de choc à la fin
  wrapPost('dash', function (f, ab) {
    const g = G(), L = ab.lvl; if (L < 3) return;
    for (let k = 1; k <= 5; k++) g.later(k * 0.04, function () { if (!f.alive) return; g.fx('burst', f.x, f.y, { col: '#ffd24a', n: 4, life: 0.4 }); for (const t of g.splash(f, f.x, f.y, 52, 6 + 3 * L, 'dash', {})) { if (L >= 4) { t.st.slowT = 2; t.st.slowMax = 2; t.st.slowAmt = 0.5; } } });
    if (L >= 5) g.later(0.24, function () { if (!f.alive) return; g.fx('ring', f.x, f.y, { r: 140, col: '#ffe27a', life: 0.45, w: 9 }); g.splash(f, f.x, f.y, 140, 30, 'dash', { knock: 620 }); g.shake(5); });
  });
  A.dash.desc = 'Fonce en ligne droite. Niv.3 : traînée qui blesse. Niv.4 : elle ralentit. Niv.5 : onde de choc à l\'arrivée.';

  // invisibilité : niv.3 fumée qui réduit au silence, niv.4 esquive, niv.5 nova d\'ombre
  wrapPost('invis', function (f, ab) {
    const g = G(), L = ab.lvl;
    if (L >= 3) { g.fx('ring', f.x, f.y, { r: 150, col: '#6a6f9a', life: 0.6, w: 10 }); for (const t of g.enemiesIn(f, f.x, f.y, 150)) g.status(t, 'silence', 1.2); }
    if (L >= 4) f.st.invuln = Math.max(f.st.invuln || 0, 0.8);
    if (L >= 5) { g.fx('ring', f.x, f.y, { r: 230, col: '#2a2e50', life: 0.6, w: 14 }); g.splash(f, f.x, f.y, 230, 35, 'invis', { knock: 350 }); for (const t of g.enemiesIn(f, f.x, f.y, 230)) g.status(t, 'silence', 2); }
  });
  A.invis.desc = 'Deviens invisible, les ennemis touchés sont blessés. Niv.3 : fumée qui réduit au silence. Niv.4 : esquive de 0,8 s. Niv.5 : nova d\'ombre.';


  // Guide des pouvoirs affiché dans les réglages : fruit, et ce que fait chaque niveau (écrit d'après le code des capacités)
  WB.GUIDE = {
    ice: ['Myrtilles givrées', 'Gèle tous les ennemis dans un rayon autour de toi.', ['Onde de glace : dégâts et gel d\'environ 1,5 s.', 'Rayon et durée du gel plus grands, les ennemis restent ralentis ensuite.', 'Une deuxième onde de glace, 0,6 s plus tard.', 'Une troisième onde, encore plus large.', 'Blizzard : 6 ondes de plus pendant 3 secondes.']],
    fire: ['Piment', 'Brûle ce qu\'il touche. Vise automatiquement l\'ennemi le plus proche.', ['Une boule de feu qui enflamme la cible.', 'Deux boules de feu en éventail.', 'Un rayon de feu qui brûle 0,7 s et s\'arrête sur les murs.', 'Deux rayons de feu en éventail.', 'Tourbillon de flammes à 360° qui te suit pendant 2,4 s.']],
    hole: ['Prune noire', 'Aspire les ennemis. Ceux qui touchent le centre sont tués (35 % de vie pour un boss).', ['Un trou noir de taille moyenne.', 'Trou plus grand, recharge plus courte.', 'Plus grand et 0,6 s plus long.', 'Deux trous côte à côte.', 'Trois trous : zone d\'aspiration immense.']],
    wall: ['Noix de coco', 'Un mur qui bloque tout, ennemis, projectiles et bombes. Il se casse sous les coups.', ['Un mur de 14 s.', 'Mur plus long et plus résistant.', 'Mur double.', 'Mur en U qui piège devant toi.', 'Mur en U et forteresse de 4 murs autour de toi.']],
    shield: ['Pomme verte', 'Aucun dégât subi. Les ennemis que tu touches sont blessés. En équipe, il protège aussi les alliés proches.', ['Protection de 3,1 s.', 'Protection de 3,6 s.', 'Onde de choc à la fin : elle blesse et repousse.', 'L\'onde de choc étourdit aussi 0,9 s.', 'L\'onde de choc te soigne de 15 % de ta vie.']],
    tp: ['Fruit du dragon', 'Pose une balise puis reviens-y. Sur un ennemi, il est téléporté ailleurs et perd un fruit.', ['Balise puis retour à la balise.', 'Explosion à l\'arrivée.', 'Explosion aussi au départ. L\'ennemi téléporté est étourdi.', '1 s d\'invulnérabilité après le retour.', 'L\'ennemi téléporté perd 2 fruits.']],
    dash: ['Banane', 'Fonce en ligne droite et blesse ce que tu heurtes.', ['Un élan qui blesse ce qu\'il heurte.', 'Dégâts de l\'élan augmentés.', 'Laisse une traînée qui blesse.', 'La traînée ralentit les ennemis.', 'Onde de choc à l\'arrivée qui repousse.']],
    water: ['Pastèque', 'Repousse et réduit au silence : les ennemis ne peuvent plus utiliser de capacités. Dans l\'eau, ils meurent.', ['Un cône d\'eau.', 'Dégâts et silence plus longs.', 'Deux vagues.', 'Cône très large, trois vagues.', 'Tempête à 360° autour de toi.']],
    wind: ['Poire', 'Repousse et étourdit, mais les ennemis gardent leurs capacités.', ['Un cône de vent.', 'Dégâts et étourdissement plus longs.', 'Deux vagues.', 'Cône très large, trois vagues.', 'Tornade à 360° autour de toi.']],
    scythe: ['Ananas', 'Frappe en arc devant toi.', ['Un coup de faux.', 'Deux coups de suite.', 'Deux coups, portée augmentée.', 'Trois coups en arc très large.', 'Tourbillon de 4 coups à 360°.']],
    invis: ['Raisin fantôme', 'Tu deviens invisible. Les ennemis que tu touches sont blessés. En équipe, des alliés proches le deviennent aussi.', ['Invisible environ 4,6 s.', 'Invisible plus longtemps, dégâts plus forts.', 'Nuage de fumée : les ennemis proches sont réduits au silence.', 'Esquive de 0,8 s au lancement.', 'Nova d\'ombre : 35 dégâts, silence et recul autour de toi.']],
    spider: ['Aubergine', 'Lance une toile : l\'ennemi est immobilisé, blessé dans la durée, puis ralenti.', ['Une toile.', 'Immobilisation et poison plus longs.', 'Deux toiles.', 'La toile saute sur un deuxième ennemi proche.', 'Trois toiles qui sautent.']],
    clown: ['Orange', 'Des clowns explosifs poursuivent les ennemis.', ['Un clown.', 'Deux clowns, explosion plus grande.', 'Trois clowns, l\'explosion étourdit.', 'Quatre clowns, plus rapides.', 'Cinq clowns, confettis géants.']],
    necro: ['Durian piquant', 'Une lance qui traverse les murs. L\'ennemi touché devient ton esclave et prend les coups à ta place.', ['Une lance, un esclave.', 'Jusqu\'à 2 esclaves, portée plus grande.', 'Deux lances.', 'Jusqu\'à 4 esclaves.', 'Trois lances en éventail, jusqu\'à 5 esclaves.']],
    turret: ['Cerises', 'Pose des tourelles qui tirent sur les ennemis proches.', ['Une tourelle.', 'Deux tourelles, tir plus rapide.', 'Trois tourelles.', 'Quatre tourelles, très rapides.', 'Cinq tourelles à tir quasi continu.']],
    jump: ['Pêche', 'Bondis : dégâts et étourdissement à l\'atterrissage.', ['Un bond et une onde d\'étourdissement.', 'Zone et étourdissement plus grands.', 'Une deuxième onde 0,35 s plus tard.', 'Zone encore plus grande.', 'Impact de météore : les ennemis proches brûlent.']],
    bolt: ['Carambole étoilée', 'Foudre : dégâts et silence.', ['Un éclair.', 'Dégâts augmentés.', 'L\'éclair saute à un ennemi proche.', 'Un deuxième coup au même endroit.', 'Tempête : 3 éclairs autour, l\'éclair saute à 2 ennemis.']],
    glut: ['Figue rose', 'Tu grossis et avales un ennemi proche : tu utilises ses capacités un moment, puis tu le recraches sans qu\'il perde rien.', ['Avale un ennemi à 190 px : tu utilises ses capacités 5 s.', 'Portée 210 px, durée 6 s.', 'Portée 230 px, durée 7 s.', 'Portée 250 px, durée 8 s.', 'Portée 270 px, durée 9 s.']],
    summon: ['Grenade', 'Choisis une forme : requin (avale et recrache), golem (te protège, lance des pierres) ou dragon (crache du feu).', ['Une créature.', 'Requin : 2 cibles. Golem et dragon plus solides.', 'Dragon : 2 dragons.', 'Requin : 4 cibles.', 'Requin : 5 cibles. Dragon : 3 dragons.']],
    cancel: ['Kiwi', 'Coupe les capacités des ennemis. Tes bombes reviennent 1 s après la dernière.', ['1 ennemi réduit au silence.', '2 ennemis.', '3 ennemis.', '4 ennemis.', 'Tous les ennemis dans 300 px.']]
  };

  // tourbillon, clown, araignée, nécromancien, tourelle, rebond : l\'évolution est dans leur code
  A.spider.desc = 'Lance une toile. Niv.3 : 2 toiles. Niv.4 : la toile saute à un 2e ennemi. Niv.5 : 3 toiles.';
  A.clown.desc = 'Clowns explosifs (autant que le niveau) qui poursuivent les ennemis. Niv.3 : l\'explosion étourdit. Niv.5 : confettis géants.';
  A.necro.desc = 'Lance de mort qui rend esclave. Niv.3 : 2 lances. Niv.5 : 3 lances en éventail.';
  A.turret.desc = 'Tourelles (autant que le niveau) qui tirent sur les ennemis. Plus le niveau est haut, plus elles tirent vite.';
  A.jump.desc = 'Bondis : dégâts et étourdissement. Niv.3 : deuxième onde. Niv.5 : impact de météore qui enflamme.';
  A.water.desc = 'Repousse et réduit au silence. Niv.3 : 2 vagues. Niv.4 : cône large, 3 vagues. Niv.5 : tempête à 360°.';
  A.wind.desc = 'Repousse et étourdit. Niv.3 : 2 vagues. Niv.4 : cône large, 3 vagues. Niv.5 : tornade à 360°.';
})(window.WB);

// ===================== EAU : spécification officielle (voir SPECS_CAPACITES.md) =====================
(function (WB) {
  'use strict';
  const A = WB.ABIL, G = () => WB.G, PI2 = Math.PI * 2;
  const W = A.water;
  const R4 = 340, R5 = 260;
  W.type = 'aim'; W.col = '#3fa4ff';
  W.range = function (L) { return L >= 5 ? R5 : L >= 4 ? R4 : 300; };
  W.desc = 'Niv.1 : une vague. Niv.2 : deux vagues successives. Niv.3 : trois vagues. Niv.4 : une main d\'eau sort du sol, attrape un adversaire et le projette. Niv.5 : plusieurs mains d\'eau dans un rayon autour de toi.';
  W.ai = { max: function (L) { return L >= 5 ? R5 : L >= 4 ? R4 : 300; }, min: 0 };

  // ---- niveaux 1 à 3 : vagues successives (la suivante part quand la précédente a fini) ----
  const WAVE_T = 0.45, GAP = 0.06;
  function sendWave(f, dir, k, L, total) {
    const g = G(); if (!f.alive) return;
    const D = 290 + 45 * k, w = 42 + 9 * k, dmg = 14 + 3 * L, force = (520 + 130 * k) * (k === total - 1 && total > 1 ? 1.25 : 1);
    const x0 = f.x, y0 = f.y, hit = new Set(), ang = Math.atan2(dir.y, dir.x); let blocked = false;
    g.fx('tide', x0, y0, { ang: ang, D: D, T: WAVE_T, w: w, k: k, life: WAVE_T + 0.3, col: '#3fa4ff' }); g.sfx('water');
    const STEPS = 12;
    for (let s = 1; s <= STEPS; s++) g.later(WAVE_T * s / STEPS, function () {
      if (blocked) return; const e = 1 - (1 - s / STEPS) * (1 - s / STEPS), d = D * e, px = x0 + dir.x * d, py = y0 + dir.y * d;
      if (g.world.solidAt(px, py)) { blocked = true; g.fx('burst', px - dir.x * 10, py - dir.y * 10, { col: '#bfe9ff', n: 10, life: 0.4 }); return; }
      for (const t of g.enemiesIn(f, px, py, w)) { if (hit.has(t)) continue; hit.add(t); g.damage(t, dmg, f, 'water'); g.knock(t, dir.x, dir.y, force); g.fx('burst', t.x, t.y, { col: '#bfe9ff', n: 8, life: 0.4 }); }
    });
  }

  // ---- niveaux 4 et 5 : mains d'eau ----
  const HAND = { grab: 0.32, lift: 0.78, release: 0.95, life: 1.5 };
  function summonHand(f, v, L) {
    const g = G(), h = { owner: f, v: v, x: v.x, y: v.y, t: 0, L: L, grabbed: false, thrown: false, dmg: L >= 5 ? 55 : 80, lift: 0 };
    g.hands.push(h); g.sfx('water'); g.fx('ring', v.x, v.y + 14, { r: 46, col: '#9ad8ff', life: 0.35, w: 4 }); return h;
  }
  WB.updateHands = function (dt) {
    const g = G(); if (!g) return;
    for (let i = g.hands.length - 1; i >= 0; i--) {
      const h = g.hands[i], v = h.v, f = h.owner; h.t += dt;
      if (!h.grabbed && h.t < HAND.grab) { if (v.alive) { h.x = v.x; h.y = v.y; } }
      if (!h.grabbed && h.t >= HAND.grab) { h.grabbed = true; if (v.alive && !(v.st.jump || v.ghost)) { h.got = true; g.status(v, 'stun', 1.1); v.vx = v.vy = 0; v.kx = v.ky = 0; g.fx('burst', h.x, h.y, { col: '#bfe9ff', n: 14, life: 0.5 }); g.shake(3); } }
      if (h.got && v.alive && !h.thrown) {
        v.x = h.x; v.y = h.y; v.vx = v.vy = 0;
        const u = Math.min(1, Math.max(0, (h.t - HAND.grab) / (HAND.lift - HAND.grab))); h.lift = 58 * (1 - (1 - u) * (1 - u)); v.jumpH = h.lift;
        if (h.t >= HAND.lift) {
          h.thrown = true; v.jumpH = 0; h.lift = 0;
          let dx = v.x - f.x, dy = v.y - f.y, d = Math.hypot(dx, dy); if (d < 8) { const a = Math.random() * PI2; dx = Math.cos(a); dy = Math.sin(a); d = 1; }
          g.damage(v, h.dmg, f, 'water'); g.knock(v, dx / d, dy / d, 2600); g.fx('ring', h.x, h.y, { r: 90, col: '#bfe9ff', life: 0.45, w: 8 }); g.fx('burst', h.x, h.y, { col: '#9ad8ff', n: 22, life: 0.6 }); g.shake(5); g.sfx('boom');
        }
      }
      if ((!v.alive || h.thrown) && v.jumpH && !v.st.jump) v.jumpH = 0;
      if (h.t >= HAND.life) { if (v.jumpH && !v.st.jump) v.jumpH = 0; g.hands.splice(i, 1); }
    }
  };

  W.cast = function (f, ab, aim) {
    const g = G(), L = ab.lvl;
    if (L <= 3) { const n = L; const d = Math.hypot(aim.x, aim.y) || 1, dir = { x: aim.x / d, y: aim.y / d }; for (let k = 0; k < n; k++) g.later(k * (WAVE_T + GAP), function () { sendWave(f, k === 0 ? dir : dir, k, L, n); }); return; }
    if (L === 4) {
      const cand = g.enemiesIn(f, f.x, f.y, R4).filter(function (t) { return g.visibleTo ? g.visibleTo(f, t) : true; }); if (!cand.length) return false;
      const d0 = Math.hypot(aim.x, aim.y) || 1, ux = aim.x / d0, uy = aim.y / d0; let best = null, bs = 1e9;
      for (const t of cand) { const dx = t.x - f.x, dy = t.y - f.y, d = Math.hypot(dx, dy) || 1, cos = (dx * ux + dy * uy) / d, score = d + (cos < 0.5 ? 600 : (1 - cos) * 300); if (score < bs) { bs = score; best = t; } }
      summonHand(f, best, L); return;
    }
    const cand = g.enemiesIn(f, f.x, f.y, R5).sort(function (a, b) { return Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y); }).slice(0, 10);
    if (!cand.length) return false; cand.forEach(function (t) { summonHand(f, t, L); }); g.shake(3);
  };

  // ---- dessin de la vague ----
  WB.drawTide = function (ctx, e, time) {
    const s = Math.min(1, e.t / e.T), ease = 1 - (1 - s) * (1 - s), d = e.D * ease, a = e.t < e.T ? 1 : Math.max(0, 1 - (e.t - e.T) / 0.3), w = e.w;
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.ang); ctx.globalAlpha = a;
    const back = Math.max(0, d - 130), grd = ctx.createLinearGradient(back, 0, d + 30, 0); grd.addColorStop(0, 'rgba(63,164,255,0)'); grd.addColorStop(0.55, 'rgba(63,164,255,.55)'); grd.addColorStop(1, 'rgba(150,215,255,.95)');
    ctx.fillStyle = grd; ctx.beginPath(); ctx.moveTo(back, -w * 0.55); ctx.quadraticCurveTo(d - 20, -w * 1.05, d + 22, 0); ctx.quadraticCurveTo(d - 20, w * 1.05, back, w * 0.55); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(240,252,255,.95)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(d - 26, -w * 0.95); ctx.quadraticCurveTo(d + 16, -w * 0.45, d + 22, 0); ctx.quadraticCurveTo(d + 16, w * 0.45, d - 26, w * 0.95); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3; for (let i = 1; i <= 3; i++) { const o = i * 26; ctx.globalAlpha = a * (0.55 - i * 0.12); ctx.beginPath(); ctx.moveTo(d - o - 6, -w * (0.75 - i * 0.1)); ctx.quadraticCurveTo(d - o + 10, 0, d - o - 6, w * (0.75 - i * 0.1)); ctx.stroke(); }
    ctx.globalAlpha = a; ctx.fillStyle = '#eaf9ff'; for (let i = 0; i < 9; i++) { const q = (i * 0.618 + e.k * 0.3) % 1, bx = d - 8 - q * 90, by = Math.sin(i * 2.3 + time * 9) * w * 0.8 * (0.4 + 0.6 * q); ctx.beginPath(); ctx.arc(bx, by, 2 + (i % 3), 0, PI2); ctx.fill(); }
    ctx.restore();
  };

  // ---- dessin de la main d'eau ----
  function finger(ctx, bx, by, ang, len, wd) { const ex = bx + Math.sin(ang) * len, ey = by - Math.cos(ang) * len; ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke(); }
  WB.drawHands = function (ctx, G, time) {
    for (const h of G.hands) {
      const t = h.t, rise = t < HAND.grab ? Math.min(1, t / (HAND.grab * 0.8)) : 1, grip = t < HAND.grab ? 0 : t < HAND.grab + 0.14 ? (t - HAND.grab) / 0.14 : t < HAND.lift ? 1 : Math.max(0, 1 - (t - HAND.lift) / 0.16);
      const fade = t < HAND.release ? 1 : Math.max(0, 1 - (t - HAND.release) / (HAND.life - HAND.release)), sink = t < HAND.release ? 0 : (t - HAND.release) / (HAND.life - HAND.release);
      const bx = h.x, by = h.y + 22;                 // sol sous l'adversaire
      const H = 74 * (h.got && h.grabbed ? 1 : rise) + h.lift * 0.9 - sink * 60, px = bx, py = by - Math.max(6, H);
      ctx.save(); ctx.globalAlpha = 0.9 * fade;
      // flaque et ondes au sol
      ctx.strokeStyle = 'rgba(190,235,255,.85)'; ctx.lineWidth = 3; for (let k = 0; k < 2; k++) { const r = 22 + ((time * 40 + k * 22) % 44) * (rise > 0.1 ? 1 : 0.3); ctx.globalAlpha = (0.9 - r / 80) * fade; ctx.beginPath(); ctx.ellipse(bx, by, r, r * 0.42, 0, 0, PI2); ctx.stroke(); }
      ctx.globalAlpha = 0.85 * fade; ctx.fillStyle = 'rgba(63,164,255,.55)'; ctx.beginPath(); ctx.ellipse(bx, by, 26, 10, 0, 0, PI2); ctx.fill();
      // bras d'eau
      const gr = ctx.createLinearGradient(bx - 14, 0, bx + 14, 0); gr.addColorStop(0, '#2c7fe0'); gr.addColorStop(0.5, '#8fd3ff'); gr.addColorStop(1, '#2c7fe0');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(bx - 17, by); ctx.quadraticCurveTo(bx - 12 + Math.sin(time * 6) * 2, (by + py) / 2, px - 12, py + 4); ctx.lineTo(px + 12, py + 4); ctx.quadraticCurveTo(bx + 12 + Math.sin(time * 6 + 1) * 2, (by + py) / 2, bx + 17, by); ctx.closePath(); ctx.fill();
      // paume
      const pg = ctx.createRadialGradient(px - 6, py - 8, 3, px, py, 30); pg.addColorStop(0, '#d8f2ff'); pg.addColorStop(0.6, '#6cbcff'); pg.addColorStop(1, '#2c7fe0');
      ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(px, py, 27, 23, 0, 0, PI2); ctx.fill();
      // doigts : écartés au début, qui se referment sur l'adversaire
      const open = 1 - grip, base = [-0.62, -0.22, 0.2, 0.6], lens = [30, 38, 38, 30];
      ctx.lineCap = 'round'; ctx.strokeStyle = '#7ec8ff';
      for (let i = 0; i < 4; i++) { const ang = base[i] * (0.25 + 0.75 * open) , len = lens[i] * (1 - 0.38 * grip), fx0 = px + (i - 1.5) * 12, fy0 = py - 12; finger(ctx, fx0, fy0, ang, len, 13); }
      // pouce
      finger(ctx, px - 22, py + 2, -1.05 + 0.7 * grip, 24 * (1 - 0.25 * grip), 12); 
      // reflets
      ctx.strokeStyle = 'rgba(255,255,255,.65)'; for (let i = 0; i < 4; i++) { const ang = base[i] * (0.25 + 0.75 * open), len = lens[i] * (1 - 0.38 * grip), fx0 = px + (i - 1.5) * 12 - 3, fy0 = py - 14; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx0, fy0); ctx.lineTo(fx0 + Math.sin(ang) * len * 0.8, fy0 - Math.cos(ang) * len * 0.8); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(230,248,255,.9)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(px, py, 27, 23, 0, 0.3, 2.6); ctx.stroke();
      // gouttes
      ctx.fillStyle = '#eaf9ff'; for (let i = 0; i < 6; i++) { const q = (time * 1.3 + i * 0.37) % 1; ctx.globalAlpha = (1 - q) * 0.8 * fade; ctx.beginPath(); ctx.arc(px + Math.sin(i * 2.1) * 30, py - 20 - q * 30, 3 - q * 2 + 1, 0, PI2); ctx.fill(); }
      ctx.restore();
    }
  };

  WB.GUIDE.water = ['Pastèque', 'Une vague d\'eau, puis, au niveau 4, une main d\'eau qui sort du sol.', ['Une seule vague qui part dans la direction du stick, blesse et repousse.', 'Deux vagues successives : la seconde repousse l\'adversaire encore plus loin.', 'Trois vagues successives, la troisième projette le plus fort. Dégâts totaux plus élevés.', 'Une grande main d\'eau sort du sol sous un seul adversaire, l\'attrape et le projette violemment.', 'Rayon d\'action visible autour de toi : une main d\'eau attrape chaque adversaire dans la zone, en même temps.']];
})(window.WB);

// ===================== FEU : spécification officielle (voir SPECS_CAPACITES.md) =====================
(function (WB) {
  'use strict';
  const A = WB.ABIL, G = () => WB.G, PI2 = Math.PI * 2, F = A.fire;
  F.type = 'aim'; F.col = '#ff7a1c';
  F.range = function (L) { return L >= 5 ? 400 : L >= 3 ? 340 : 420; };
  F.ai = { max: function (L) { return L >= 5 ? 380 : L >= 3 ? 330 : 400; }, min: 30 };
  F.desc = 'Niv.1 : boule de feu. Niv.2 : deux boules. Niv.3 : rayon de feu continu. Niv.4 : deux rayons. Niv.5 : lance-flammes avec traces de feu au sol.';
  const FL = { range: 390, half: 0.46, dur: 2.4, tick: 0.12, dmg: 6, patchLife: 3.6 };

  function state(g) { if (!g.fireCh) { g.fireCh = []; g.flameP = []; g.flames = []; g.smoke = []; g.smokeT = 0; } return g; }

  F.cast = function (f, ab, aim) {
    const g = state(G()), L = ab.lvl, base = Math.atan2(aim.y, aim.x);
    if (g.fireCh.some(function (c) { return c.f === f; })) return false;     // un seul jet à la fois par lanceur
    if (L <= 2) {
      for (let i = 0; i < L; i++) {
        const a = base + (i - (L - 1) / 2) * 0.22;
        g.proj({ x: f.x, y: f.y, dx: Math.cos(a), dy: Math.sin(a), speed: 560, life: 0.78, r: 13, owner: f, ab: 'fire', lvl: L, kind: 'fire',
          onHit: function (p, t) { g.damage(t, 10 + 3 * L, f, 'fire'); g.burn(t, 16 + 7 * L, 4, f, 'fire'); g.fx('burst', p.x, p.y, { col: '#ff9a3c', n: 10, life: 0.4 }); return true; } });
      }
    } else if (L <= 4) {
      const nb = L - 2, dirs = []; for (let i = 0; i < nb; i++) dirs.push(base + (i - (nb - 1) / 2) * 0.3);
      g.fireCh.push({ f: f, ab: ab, L: L, kind: 'ray', dirs: dirs, t: 0, dur: L === 3 ? 1.1 : 1.3, acc: 0, burnAt: new Map() }); g.shake(2);
    } else {
      g.fireCh.push({ f: f, ab: ab, L: 5, kind: 'flame', ang: base, t: 0, dur: FL.dur, acc: 0, pAcc: 0, dropAcc: 0, burnAt: new Map() }); g.shake(3);
    }
    g.sfx('fire');
  };

  function inCone(f, t, ang, half, range) {
    const dx = t.x - f.x, dy = t.y - f.y, d = Math.hypot(dx, dy); if (d > range + t.r) return false;
    let da = Math.atan2(dy, dx) - ang; while (da > Math.PI) da -= PI2; while (da < -Math.PI) da += PI2;
    return Math.abs(da) <= half + Math.atan2(t.r, Math.max(d, 1)) && G().world.los(f.x, f.y, t.x, t.y);
  }
  function ignite(g, c, t) { const now = c.t, last = c.burnAt.get(t); if (last == null || now - last > 0.7) { c.burnAt.set(t, now); g.burn(t, 10 + 6 * c.L, 3, c.f, 'fire'); g.fx('burst', t.x, t.y, { col: '#ff9a3c', n: 4, life: 0.3 }); } }

  WB.updateFire = function (dt) {
    const g = G(); if (!g) return; state(g);
    for (let i = g.fireCh.length - 1; i >= 0; i--) {
      const c = g.fireCh[i], f = c.f; c.t += dt;
      if (!f.alive || c.t >= c.dur || f.st.frozen > 0 || f.st.stun > 0 || f.swallowed) { g.fireCh.splice(i, 1); continue; }
      if (c.kind === 'ray') {
        c.acc += dt; while (c.acc >= 0.1) {
          c.acc -= 0.1;
          for (const a of c.dirs) {
            const dx = Math.cos(a), dy = Math.sin(a), LEN = 330; let len = LEN; for (let d = 20; d <= LEN; d += 12) { if (g.world.solidAt(f.x + dx * d, f.y + dy * d)) { len = d; break; } }
            g.fx('beam', f.x, f.y, { x2: f.x + dx * len, y2: f.y + dy * len, life: 0.16, col: '#ff7a1c', w: 20 });
            for (const t of g.enemiesIn(f, f.x + dx * len / 2, f.y + dy * len / 2, len / 2 + 30)) {
              const px = t.x - f.x, py = t.y - f.y, along = px * dx + py * dy, side = Math.abs(px * dy - py * dx);
              if (along > 0 && along < len + t.r && side < 26 + t.r * 0.6) { g.damage(t, 5, f, 'fire', { dot: true }); ignite(g, c, t); }
            }
          }
        }
      } else {
        // lance-flammes : suit doucement l'ennemi le plus proche
        const au = g.autoAim(f, c.ab);
        if (au && au.target) { let da = Math.atan2(au.y, au.x) - c.ang; while (da > Math.PI) da -= PI2; while (da < -Math.PI) da += PI2; if (Math.abs(da) < 1.1) c.ang += Math.max(-2.2 * dt, Math.min(2.2 * dt, da)); }
        const dx = Math.cos(c.ang), dy = Math.sin(c.ang);
        c.pAcc += dt * 140; while (c.pAcc >= 1) { c.pAcc -= 1; const sp = 330 + Math.random() * 260, ja = c.ang + (Math.random() - 0.5) * FL.half * 1.7; g.flameP.push({ x: f.x + dx * 24, y: f.y + dy * 24, vx: Math.cos(ja) * sp, vy: Math.sin(ja) * sp, t: 0, life: 0.45 + Math.random() * 0.2, r: 7 + Math.random() * 8 }); }
        c.acc += dt; while (c.acc >= FL.tick) {
          c.acc -= FL.tick;
          for (const t of g.enemiesIn(f, f.x, f.y, FL.range)) if (inCone(f, t, c.ang, FL.half, FL.range)) { g.damage(t, FL.dmg, f, 'fire', { dot: true }); ignite(g, c, t); }
        }
        c.dropAcc += dt; while (c.dropAcc >= 0.1) {
          c.dropAcc -= 0.1; const d = 70 + Math.random() * (FL.range - 90), a = c.ang + (Math.random() - 0.5) * FL.half * 1.3, px = f.x + Math.cos(a) * d, py = f.y + Math.sin(a) * d;
          if (!g.world.solidAt(px, py) && g.world.codeAt(px, py) !== 2 && g.world.los(f.x, f.y, px, py) && g.flames.length < 90) g.flames.push({ x: px, y: py, t: 0, life: FL.patchLife, owner: f, acc: Math.random() * 0.3, r: 13 + Math.random() * 7, ph: Math.random() * 6 });
        }
      }
    }
    for (let i = g.flameP.length - 1; i >= 0; i--) { const p = g.flameP[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.exp(-1.6 * dt); p.vy *= Math.exp(-1.6 * dt); if (p.t >= p.life || g.world.solidAt(p.x, p.y)) g.flameP.splice(i, 1); }
    // traces de feu au sol : petits dégâts de brûlure pour qui les traverse
    for (let i = g.flames.length - 1; i >= 0; i--) {
      const p = g.flames[i]; p.t += dt; if (p.t >= p.life) { g.flames.splice(i, 1); continue; }
      p.acc += dt; if (p.acc >= 0.3) { p.acc -= 0.3; for (const t of g.enemiesIn(p.owner, p.x, p.y, p.r + 6)) { g.damage(t, 2, p.owner, 'fire', { dot: true }); g.burn(t, 5, 1.5, p.owner, 'fire'); } }
    }
    // fumée noire sur tout personnage en train de brûler
    g.smokeT -= dt;
    if (g.smokeT <= 0) { g.smokeT = 0.07; for (const t of g.F) if (t.alive && t.dots && t.dots.length && g.smoke.length < 140) g.smoke.push({ x: t.x + (Math.random() - 0.5) * 14, y: t.y - 14, vx: (Math.random() - 0.5) * 20, vy: -(40 + Math.random() * 25), t: 0, life: 0.9 + Math.random() * 0.4, r: 6 + Math.random() * 4 }); }
    for (let i = g.smoke.length - 1; i >= 0; i--) { const s = g.smoke[i]; s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; if (s.t >= s.life) g.smoke.splice(i, 1); }
  };

  WB.drawFire = function (ctx, g, time) {
    if (!g.flames) return;
    for (const p of g.flames) {
      const a = Math.min(1, (p.life - p.t) / 0.8), fl = 0.75 + 0.25 * Math.sin(time * 14 + p.ph);
      ctx.save(); ctx.globalAlpha = 0.9 * a; const gr = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.r * fl + 4); gr.addColorStop(0, '#fff2a0'); gr.addColorStop(0.45, '#ff9a2c'); gr.addColorStop(1, 'rgba(210,50,10,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p.x, p.y - 3, p.r * fl + 4, 0, PI2); ctx.fill();
      ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.moveTo(p.x - 5, p.y + 2); ctx.quadraticCurveTo(p.x - 3, p.y - p.r * fl, p.x, p.y - p.r * fl - 6); ctx.quadraticCurveTo(p.x + 3, p.y - p.r * fl, p.x + 5, p.y + 2); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const p of g.flameP) { const u = p.t / p.life, r = p.r * (0.6 + u * 1.1); ctx.globalAlpha = Math.max(0, 0.85 * (1 - u)); ctx.fillStyle = u < 0.25 ? '#fff0a0' : u < 0.55 ? '#ffa030' : '#e04810'; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, PI2); ctx.fill(); }
    ctx.restore();
    for (const s of g.smoke) { const u = s.t / s.life; ctx.globalAlpha = 0.55 * (1 - u); ctx.fillStyle = '#1c1c20'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * (1 + u * 1.2), 0, PI2); ctx.fill(); }
    ctx.globalAlpha = 1;
  };

  // branchement sur les rappels existants (mise à jour et dessin)
  const upd = WB.updateHands, drw = WB.drawHands;
  WB.updateHands = function (dt) { upd(dt); WB.updateFire(dt); };
  WB.drawHands = function (ctx, g, time) { drw(ctx, g, time); WB.drawFire(ctx, g, time); };
})(window.WB);
WB.GUIDE.fire = ['Piment', 'Boules de feu, rayons, puis lance-flammes. La brûlure fait de la fumée noire et des dégâts jusqu\'à l\'extinction.', ['Une boule de feu qui enflamme la cible.', 'Deux boules de feu lancées ensemble.', 'Un rayon de feu continu qui brûle tout sur sa trajectoire.', 'Deux rayons de feu simultanés.', 'Lance-flammes de 2,4 s : large, longue portée, touche plusieurs ennemis et laisse des flammes au sol qui brûlent légèrement.']];

// ===================== FUSION DES CAPACITÉS (niveau 7 et plus) =====================
(function (WB) {
  'use strict';
  const A = WB.ABIL, G = () => WB.G, PI2 = Math.PI * 2;
  const STEP = 0.6;                                  // délai entre deux attaques enchaînées
  function members(f) { const lo = f.loadout || [], out = []; for (const i of lo) { const ab = i != null ? f.slots[i] : null; if (ab && !(ab.id === 'summon' && !ab.form)) out.push(ab); } return out; }
  WB.fusionMembers = members;
  WB.canFuse = function (f) { return (f.level || 1) >= 7 && !f.fusion && members(f).length >= 2; };
  WB.fusionLevel = function (f) { const fu = f.fusion; if (!fu) return 1; let s = 0; fu.abs.forEach(function (a) { s += a.lvl; }); return Math.max(1, Math.min(5, Math.ceil(s / fu.abs.length))); };
  WB.fuse = function (f) {
    if (!WB.canFuse(f)) return false; const abs = members(f);
    f.fusion = { abs: abs, ids: abs.map(function (a) { return a.id; }) }; if (f.fusionCd == null) f.fusionCd = 0;
    const g = G(); g.fx('ring', f.x, f.y, { r: 70, col: '#ffe27a', life: 0.5, w: 8 }); g.fx('burst', f.x, f.y, { col: '#fff3b0', n: 22, life: 0.6 }); g.sfx('pickup'); return true;
  };
  WB.unfuse = function (f) { if (!f.fusion) return false; f.fusion = null; G().fx('ring', f.x, f.y, { r: 50, col: '#bfc8e8', life: 0.4, w: 5 }); return true; };
  WB.fusionCooldown = function (f) { return 7 + 2.5 * (f.fusion ? f.fusion.abs.length : 2); };   // nettement plus long que les recharges normales
  WB.fusionCharges = function (f) { let m = 5; if (f.fusion) f.fusion.abs.forEach(function (a) { m = Math.min(m, a.n == null ? 5 : a.n); }); return m; };
  WB.fusionReady = function (f) {
    const g = G(); if (!f.fusion || !g.canCast(f) || (f.fusionCd || 0) > 0 || f.fusion.busy) return false;
    return f.fusion.abs.every(function (a) { return f.slots.indexOf(a) >= 0 && a.cd <= 0 && (a.n == null || a.n > 0); });
  };

  // attaque fusionnée : chaque capacité part à son tour sur l'adversaire le plus proche encore disponible, puis une attaque combinée termine la série
  WB.castFusion = function (f) {
    const g = G(), fu = f.fusion; if (!WB.fusionReady(f)) return false;
    const fl = WB.fusionLevel(f), abs = fu.abs.slice(), n = abs.length;
    const first = g.nearest(f, 520); if (!first) return false;
    fu.busy = true; f.fusionCd = WB.fusionCooldown(f);
    abs.forEach(function (ab) { const def = A[ab.id]; ab.n = (ab.n == null ? 5 : ab.n) - 1; if (ab.n <= 0) { ab.n = 0; ab.cd = def.cd(ab.lvl) * WB.cdMul(ab.id); } });
    let used = [], lastT = first;
    abs.forEach(function (ab, k) {
      g.later(k * STEP, function () {
        if (!f.alive || !f.fusion || f.st.frozen > 0 || f.swallowed) { if (f.fusion) f.fusion.busy = false; return; }
        const def = A[ab.id], R = def.range(fl); let best = null, bd = 1e9;
        for (const t of g.F) { if (!t.alive || t.team === f.team || t.st.jump || t.ghost) continue; const d = Math.hypot(t.x - f.x, t.y - f.y); if (d > R * 1.2) continue; const pen = used.indexOf(t) >= 0 ? 400 : 0; if (d + pen < bd) { bd = d + pen; best = t; } }
        if (!best) best = lastT && lastT.alive ? lastT : null;
        if (best) { used.push(best); lastT = best; const d = Math.hypot(best.x - f.x, best.y - f.y) || 1, aim = { x: (best.x - f.x) / d, y: (best.y - f.y) / d, m: Math.max(0.25, Math.min(1, d / R)), target: best }, tmp = Object.assign({}, ab, { lvl: fl });
          g.muteSfx = true; try { def.cast(f, tmp, aim); } finally { g.muteSfx = false; } f.castT = 0.4; f.aimLast = { x: aim.x, y: aim.y }; g.fx('ring', f.x, f.y, { r: 34, col: def.col, life: 0.3, w: 5 }); try { WB.snd.play('ab_' + ab.id, 0.8); } catch (e) {} }
        if (k === n - 1) g.later(0.45, function () {
          if (f.fusion) f.fusion.busy = false; if (!f.alive) return; const T = lastT && lastT.alive ? lastT : null; if (!T) return;
          const R = 120 + 12 * n, dmg = 14 + 9 * n; g.fx('ring', T.x, T.y, { r: R, col: '#ffe27a', life: 0.55, w: 10 }); g.fx('ring', T.x, T.y, { r: R * 0.65, col: '#ff7a7a', life: 0.45, w: 7 });
          abs.forEach(function (a, i) { g.fx('burst', T.x, T.y, { col: A[a.id].col, n: 14, life: 0.7 }); }); g.splash(f, T.x, T.y, R, dmg, 'fusion', { knock: 420 }); g.shake(7); g.sfx('boom');
        });
      });
    });
    g.shake(3); return true;
  };

  const upd = WB.updateHands;
  WB.updateHands = function (dt) {
    upd(dt); const g = G(); if (!g) return;
    for (const f of g.F) {
      if (f.fusionCd > 0) f.fusionCd = Math.max(0, f.fusionCd - dt);
      if (f.fusion && (!f.alive || f.fusion.abs.some(function (a) { return f.slots.indexOf(a) < 0; }))) f.fusion = null;
    }
  };
})(window.WB);

// ===================== VENT : spécification officielle (voir SPECS_CAPACITES.md) =====================
(function (WB) {
  'use strict';
  const A = WB.ABIL, G = () => WB.G, PI2 = Math.PI * 2, W = A.wind;
  const R1 = 270, CARRY = 0.9, THROW = 2000;
  W.range = function (L) { return L === 1 ? R1 : L === 2 ? 2 * R1 : L === 3 ? 340 : L === 4 ? 260 : 2 * R1; };
  W.desc = 'Niv.1 : repousse un ennemi. Niv.2 : onde à 360° (portée x2). Niv.3 : un tourbillon. Niv.4 : deux tourbillons. Niv.5 : onde 360° puis quatre tourbillons.';
  W.ai = { max: function (L) { return L <= 2 ? 250 : 220; }, min: 0 };
  const dmgOf = function (L) { return 14 + 4 * L; }, stunOf = function (L) { return 1 + 0.15 * L; };   // valeurs d'origine conservées

  function hitOne(f, t, L, a, force) { const g = G(); g.damage(t, dmgOf(L), f, 'wind'); g.knock(t, Math.cos(a), Math.sin(a), force); g.status(t, 'stun', stunOf(L)); }

  function target1(f, aim, R) {
    const g = G(); let t = aim.target && aim.target.alive ? aim.target : null; if (t && Math.hypot(t.x - f.x, t.y - f.y) > R * 1.15) t = null;
    if (!t) { const base = Math.atan2(aim.y, aim.x); let bs = 1e9; for (const e of g.enemiesIn(f, f.x, f.y, R)) { const a = Math.atan2(e.y - f.y, e.x - f.x); let da = Math.abs(a - base); if (da > Math.PI) da = PI2 - da; if (da > 0.6) continue; const s = da * 400 + Math.hypot(e.x - f.x, e.y - f.y); if (s < bs) { bs = s; t = e; } } }
    return t;
  }
  function wave360(f, L, R) {
    const g = G(); g.fx('wave', f.x, f.y, { ang: 0, r: R, half: Math.PI, col: '#d6f4ee', life: 0.5 }); g.fx('ring', f.x, f.y, { r: R, col: '#ffffff', life: 0.5, w: 6 });
    for (const t of g.enemiesIn(f, f.x, f.y, R)) hitOne(f, t, L, Math.atan2(t.y - f.y, t.x - f.x), 700);
    g.sfx('wind'); if (f === g.player) g.shake(3);
  }
  function spawn(f, L, o) { const g = G(); g.whirls = g.whirls || []; const w = Object.assign({ f: f, L: L, x: f.x, y: f.y, t: 0, ang: 0, caps: [], taken: 0, max: 2, dead: false, vx: 0, vy: 0 }, o); g.whirls.push(w); g.fx('burst', f.x, f.y, { col: '#d6f4ee', n: 10, life: 0.4 }); return w; }

  W.cast = function (f, ab, aim) {
    const g = G(), L = ab.lvl;
    if (L === 1) {
      const t = target1(f, aim, R1), a = t ? Math.atan2(t.y - f.y, t.x - f.x) : Math.atan2(aim.y, aim.x), d = t ? Math.hypot(t.x - f.x, t.y - f.y) : 160;
      g.fx('wave', f.x, f.y, { ang: a, r: Math.min(R1, d + 40), half: 0.22, col: '#d6f4ee', life: 0.4 }); g.sfx('wind');
      if (t) hitOne(f, t, L, a, 700);
    } else if (L === 2) { wave360(f, L, 2 * R1); }
    else if (L === 3) { spawn(f, L, { mode: 'spiral', life: 3.6, ang: Math.atan2(aim.y, aim.x) }); g.sfx('wind'); }
    else if (L === 4) { for (let i = 0; i < 2; i++) spawn(f, L, { mode: 'orbit', rad: 85, spd: 4.5, life: 6, ang: i * Math.PI }); g.sfx('wind'); }
    else {
      wave360(f, L, 2 * R1);
      g.later(0.35, function () { if (!f.alive) return; for (let i = 0; i < 2; i++) spawn(f, L, { mode: 'orbit', rad: 75, spd: 4.2, life: 8, ang: i * Math.PI, role: 'def' }); for (let i = 0; i < 2; i++) spawn(f, L, { mode: 'hunt', life: 7, ang: i * Math.PI + 1, role: 'off' }); g.sfx('wind'); });
    }
  };

  function release(w, t, throwIt) {
    const g = G(), f = w.f; t.whirl = null; t.jumpH = 0; t.windImm = 1.4;
    if (!throwIt || !t.alive) return;
    let dx = t.x - f.x, dy = t.y - f.y, d = Math.hypot(dx, dy); if (d < 20) { dx = w.vx || 1; dy = w.vy || 0; d = Math.hypot(dx, dy) || 1; } dx /= d; dy /= d;
    g.damage(t, dmgOf(w.L), f, 'wind'); g.knock(t, dx, dy, THROW); g.fx('burst', t.x, t.y, { col: '#e8fffb', n: 12, life: 0.5 }); g.fx('ring', t.x, t.y, { r: 50, col: '#ffffff', life: 0.35, w: 4 });
  }

  WB.updateWhirls = function (dt) {
    const g = G(); if (!g || !g.whirls) return;
    for (let i = g.whirls.length - 1; i >= 0; i--) {
      const w = g.whirls[i], f = w.f; w.t += dt; w.rot = (w.rot || 0) + dt * 11;
      if (!f.alive) { w.caps.forEach(function (c) { release(w, c.t, false); }); w.caps = []; g.whirls.splice(i, 1); continue; }
      // déplacement
      if (w.mode === 'spiral') { w.ang += 6 * dt; const u = Math.min(1, w.t / 3.4), rad = 45 + 295 * Math.pow(u, 1.2); w.x = f.x + Math.cos(w.ang) * rad; w.y = f.y + Math.sin(w.ang) * rad; }
      else if (w.mode === 'orbit') { w.ang += w.spd * dt; const nx = f.x + Math.cos(w.ang) * w.rad, ny = f.y + Math.sin(w.ang) * w.rad; w.vx = nx - w.x; w.vy = ny - w.y; w.x = nx; w.y = ny; }
      else if (w.mode === 'away') { w.x += w.dx * 190 * dt; w.y += w.dy * 190 * dt; if (g.world.solidAt(w.x, w.y)) { w.x -= w.dx * 190 * dt; w.y -= w.dy * 190 * dt; const ox = w.dx; w.dx = -w.dy; w.dy = ox; } if (Math.hypot(w.x - f.x, w.y - f.y) > 260 && !w.caps.length) w.life = Math.min(w.life, w.t + 0.3); }
      else if (w.mode === 'hunt') {
        let best = null, bd = 1e9; for (const t of g.F) { if (!t.alive || t.team === f.team || t.whirl || t.ghost || t.st.jump || (t.windImm || 0) > 0) continue; const d = Math.hypot(t.x - w.x, t.y - w.y); if (d < bd) { bd = d; best = t; } }
        let tx, ty; if (best) { tx = best.x - w.x; ty = best.y - w.y; } else { tx = Math.cos(w.t * 1.3 + w.ang) * 40; ty = Math.sin(w.t * 1.7 + w.ang) * 40; }
        const d = Math.hypot(tx, ty) || 1, sp = w.caps.length ? 150 : 235; w.vx += ((tx / d) * sp - w.vx) * Math.min(1, 4 * dt); w.vy += ((ty / d) * sp - w.vy) * Math.min(1, 4 * dt);
        if (w.caps.length) { const ax = w.x - f.x, ay = w.y - f.y, ad = Math.hypot(ax, ay) || 1; w.vx = ax / ad * sp; w.vy = ay / ad * sp; }   // il emporte sa prise loin du lanceur
        const nx = w.x + w.vx * dt, ny = w.y + w.vy * dt; if (!g.world.solidAt(nx, ny)) { w.x = nx; w.y = ny; } else { w.vx = -w.vx; w.vy = -w.vy; }
      }
      // captures
      if (w.taken < w.max) for (const t of g.F) {
        if (w.taken >= w.max) break; if (!t.alive || t.team === f.team || t.whirl || t.ghost || t.st.jump || (t.windImm || 0) > 0 || t.swallowed) continue;
        if (Math.hypot(t.x - w.x, t.y - w.y) < 34 + t.r) {
          w.taken++; w.caps.push({ t: t, age: 0 }); t.whirl = w; t.kx = t.ky = 0; g.status(t, 'stun', CARRY + stunOf(w.L)); g.fx('ring', t.x, t.y, { r: 44, col: '#ffffff', life: 0.35, w: 4 }); g.sfx('wind');
          if (w.mode === 'orbit') { let dx = w.x - f.x, dy = w.y - f.y; const d = Math.hypot(dx, dy) || 1; w.mode = 'away'; w.dx = dx / d; w.dy = dy / d; w.life = Math.max(w.life, w.t + 2.5); }
        }
      }
      // captifs emportés puis lancés
      for (let k = w.caps.length - 1; k >= 0; k--) {
        const c = w.caps[k], t = c.t; c.age += dt;
        if (!t.alive) { release(w, t, false); w.caps.splice(k, 1); continue; }
        const a = c.age * 9 + k * Math.PI, nx = w.x + Math.cos(a) * 22, ny = w.y + Math.sin(a) * 22; if (!g.world.solidAt(nx, ny)) { t.x = nx; t.y = ny; } t.vx = t.vy = 0; t.jumpH = 22 + 8 * Math.sin(c.age * 12);
        if (c.age >= CARRY) { release(w, t, true); w.caps.splice(k, 1); }
      }
      if (w.t >= w.life || (w.taken >= w.max && !w.caps.length && w.t > 0.2)) { w.caps.forEach(function (c) { release(w, c.t, false); }); g.fx('burst', w.x, w.y, { col: '#d6f4ee', n: 8, life: 0.4 }); g.whirls.splice(i, 1); }
    }
    for (const t of g.F) if ((t.windImm || 0) > 0) t.windImm -= dt;
  };

  function drawTornado(ctx, w, time) {
    const fade = Math.min(1, (w.life - w.t) / 0.4, w.t / 0.2 + 0.2), H = 70;
    ctx.save(); ctx.globalAlpha = 0.22 * fade; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(w.x, w.y + 6, 22, 8, 0, 0, PI2); ctx.fill();
    for (let i = 0; i < 9; i++) {
      const u = i / 8, y = w.y + 4 - u * H, rx = 9 + u * 26, ry = rx * 0.32, ph = w.rot * (1.2 - u * 0.5) + i * 0.9, sx = Math.sin(time * 3 + i) * 3 * u;
      ctx.globalAlpha = (0.9 - u * 0.25) * fade; ctx.strokeStyle = i % 2 ? '#ffffff' : '#8fd8cc'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(w.x + sx, y, rx, ry, 0, ph, ph + 4.2); ctx.stroke();
      ctx.globalAlpha = 0.18 * fade; ctx.fillStyle = '#d6f4ee'; ctx.beginPath(); ctx.ellipse(w.x + sx, y, rx, ry, 0, 0, PI2); ctx.fill();
    }
    ctx.globalAlpha = 0.7 * fade; ctx.fillStyle = '#ffffff'; for (let k = 0; k < 6; k++) { const a = w.rot * 1.6 + k * 1.05, u = (k * 0.17 + time * 0.8) % 1; ctx.beginPath(); ctx.arc(w.x + Math.cos(a) * (12 + 22 * u), w.y - u * H + 4, 2, 0, PI2); ctx.fill(); }
    ctx.restore();
  }
  const upd = WB.updateHands, drw = WB.drawHands;
  WB.updateHands = function (dt) { upd(dt); WB.updateWhirls(dt); };
  WB.drawHands = function (ctx, g, time) { drw(ctx, g, time); if (g.whirls) for (const w of g.whirls) drawTornado(ctx, w, time); };
})(window.WB);
WB.GUIDE.wind = ['Poire', 'Repousse et étourdit, mais les ennemis gardent leurs capacités.', ['Un souffle qui repousse un seul ennemi.', 'Onde à 360° : tous les ennemis dans un rayon deux fois plus grand.', 'Un tourbillon visible qui tourne autour de toi puis s\'éloigne ; il capture 2 ennemis au plus et les projette.', 'Deux tourbillons qui t\'accompagnent ; celui qui capture s\'éloigne avec sa prise.', 'Onde 360°, puis 4 tourbillons : 2 gardes autour de toi, 2 chasseurs qui poursuivent les ennemis.']];
