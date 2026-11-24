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
    scythe: ['Ananas', 'Fourche du diable noire et violette.', ['Une fourche balaie 120° devant toi.', 'Deux fourches qui se croisent.', 'Grande fourche : dégâts reçus divisés par 2, poison dégressif.', 'Deux grandes fourches toxiques.', 'Fourche à tête de mort : devant puis derrière, poison constant jusqu\'au soin.']],
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
  function ignite(g, c, t) { const now = c.t, last = c.burnAt.get(t); if ((last == null || now - last > 0.7) && !t.dots.some(function (d) { return d.ab === 'fire' && d.left > 0.8; })) { c.burnAt.set(t, now); g.burn(t, 10 + 6 * c.L, 3, c.f, 'fire'); g.fx('burst', t.x, t.y, { col: '#ff9a3c', n: 4, life: 0.3 }); } }

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
    if (g.smokeT <= 0) { g.smokeT = 0.07; for (const t of g.F) if (t.alive && t.dots && t.dots.some(function (d) { return d.ab !== 'scythe'; }) && g.smoke.length < 140) g.smoke.push({ x: t.x + (Math.random() - 0.5) * 14, y: t.y - 14, vx: (Math.random() - 0.5) * 20, vy: -(40 + Math.random() * 25), t: 0, life: 0.9 + Math.random() * 0.4, r: 6 + Math.random() * 4 }); }
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

// ===================== FOURCHE DU DIABLE (ancienne Faux) : spécification officielle =====================
(function (WB) {
  'use strict';
  const A = WB.ABIL, G = () => WB.G, PI2 = Math.PI * 2, S = A.scythe, D60 = Math.PI / 3, D90 = Math.PI / 2;
  const POISON = { 3: [60, 5], 4: [100, 5.5] }, PERM_DPS = 4;   // total/durée (dégressif) pour N3-N4 ; points de vie par seconde (constant) pour N5
  const norm = function (a) { while (a > Math.PI) a -= PI2; while (a < -Math.PI) a += PI2; return a; };

  // ---------- dessin de l'arme : manche noir, tête à trois dents, lueur violette, tête de mort au niveau 5 ----------
  WB.drawFork = function (c, x, y, ang, len, sc, time, skull) {
    c.save(); c.translate(x, y); c.rotate(ang); c.lineCap = 'round'; c.lineJoin = 'round';
    const hl = 30 * sc, sp = 13 * sc, bx = Math.max(8, len - hl), glow = 0.6 + 0.4 * Math.sin(time * 7);
    c.shadowColor = '#9b5cff'; c.shadowBlur = 9 + 5 * glow;
    c.strokeStyle = '#8a4ae0'; c.lineWidth = 5.5 * Math.sqrt(sc) + 2; c.beginPath(); c.moveTo(-8, 0); c.lineTo(bx, 0); c.stroke();
    c.strokeStyle = '#160a20'; c.lineWidth = 4 * Math.sqrt(sc); c.beginPath(); c.moveTo(-8, 0); c.lineTo(bx, 0); c.stroke();
    // anneaux violets sur le manche
    c.strokeStyle = '#b98cff'; c.lineWidth = 1.6; for (let k = 1; k <= 3; k++) { const px = bx * k / 4; c.beginPath(); c.moveTo(px, -3 * sc); c.lineTo(px, 3 * sc); c.stroke(); }
    // tête : traverse courbe + trois dents
    const head = function () { c.beginPath(); c.moveTo(bx, -sp); c.quadraticCurveTo(bx + hl * 0.12, -sp * 0.1, bx, 0); c.quadraticCurveTo(bx + hl * 0.12, sp * 0.1, bx, sp); c.moveTo(bx, -sp); c.lineTo(bx + hl, -sp * 0.8); c.moveTo(bx, sp); c.lineTo(bx + hl, sp * 0.8); c.moveTo(bx, 0); c.lineTo(bx + hl * 1.12, 0); };
    c.strokeStyle = '#8a4ae0'; c.lineWidth = 5 * Math.sqrt(sc) + 2; head(); c.stroke();
    c.strokeStyle = '#120818'; c.lineWidth = 3.6 * Math.sqrt(sc); head(); c.stroke();
    c.fillStyle = '#c9a0ff'; for (const o of [[bx + hl, -sp * 0.8], [bx + hl, sp * 0.8], [bx + hl * 1.12, 0]]) { c.beginPath(); c.arc(o[0], o[1], 1.8 * Math.sqrt(sc), 0, PI2); c.fill(); }
    c.shadowBlur = 0;
    if (skull) { // petite tête de mort sur la tête de la fourche
      const sx = bx - 2, r = 8.5 * Math.min(1.5, sc * 0.8); c.rotate(Math.PI / 2); c.fillStyle = '#efe4ff'; c.strokeStyle = '#2a0a40'; c.lineWidth = 1.6;
      c.beginPath(); c.arc(0 - 0, -sx, r, 0, PI2); c.fill(); c.stroke(); c.fillRect(-r * 0.55, -sx + r * 0.6, r * 1.1, r * 0.9); c.strokeRect(-r * 0.55, -sx + r * 0.6, r * 1.1, r * 0.9);
      c.fillStyle = '#1a0830'; c.beginPath(); c.ellipse(-r * 0.38, -sx - r * 0.1, r * 0.26, r * 0.32, 0, 0, PI2); c.ellipse(r * 0.38, -sx - r * 0.1, r * 0.26, r * 0.32, 0, 0, PI2); c.fill();
      c.beginPath(); c.moveTo(0, -sx + r * 0.25); c.lineTo(-r * 0.12, -sx + r * 0.5); c.lineTo(r * 0.12, -sx + r * 0.5); c.closePath(); c.fill();
      c.strokeStyle = '#2a0a40'; c.lineWidth = 1; for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(k * r * 0.3, -sx + r * 0.75); c.lineTo(k * r * 0.3, -sx + r * 1.4); c.stroke(); }
    }
    c.restore();
  };

  // ---------- déroulement : liste de segments par fourche ----------
  function plan(L, base) {
    const T = 0.2, R = 0.2, forks = [];
    if (L >= 5) {
      forks.push({ sc: 1.9, skull: true, segs: [
        { t0: 0, t1: 0.3, a0: base - D90, a1: base + D90, e0: 0.4, e1: 1, hit: true, kdir: base },
        { t0: 0.36, t1: 0.66, a0: base + D90, a1: base + 3 * D90, e0: 1, e1: 1, hit: true, kdir: base + Math.PI },
        { t0: 0.66, t1: 0.86, a0: base + 3 * D90, a1: base + 3 * D90, e0: 1, e1: 0.2, hit: false }] });
    } else {
      const big = L >= 3, two = L === 2 || L === 4, sc = big ? 1.55 : 1;
      const mk = function (dir) { const a0 = base - dir * D60, a1 = base + dir * D60; return { sc: sc, skull: false, segs: [{ t0: 0, t1: T, a0: a0, a1: a1, e0: 0.35, e1: 1, hit: true, kdir: base }, { t0: T, t1: T + R, a0: a1, a1: base, e0: 1, e1: 0.2, hit: false }] }; };
      forks.push(mk(1)); if (two) forks.push(mk(-1));
    }
    return forks;
  }
  function pose(fk, t) {
    const segs = fk.segs, first = segs[0], last = segs[segs.length - 1]; if (t < first.t0 || t > last.t1) return null;
    for (const s of segs) if (t >= s.t0 && t <= s.t1) { const u = s.t1 > s.t0 ? (t - s.t0) / (s.t1 - s.t0) : 1; return { ang: s.a0 + (s.a1 - s.a0) * u, ext: s.e0 + (s.e1 - s.e0) * Math.min(1, s === first && s.e0 < 1 && segs.length === 2 ? u * 3.5 : u), seg: s }; }
    for (let i = 1; i < segs.length; i++) if (t > segs[i - 1].t1 && t < segs[i].t0) return { ang: segs[i - 1].a1, ext: segs[i - 1].e1, seg: null };
    return null;
  }

  S.cast = function (f, ab, aim) {
    const g = G(), L = ab.lvl, base = Math.atan2(aim.y, aim.x); g.forks = g.forks || []; g.forkP = g.forkP || [];
    if (g.forks.some(function (a) { return a.f === f; })) return false;       // une seule attaque à la fois : pas de charge perdue
    const R = S.range(L); f.aimLast = { x: aim.x, y: aim.y };
    g.forks.push({ f: f, L: L, base: base, R: R, t: 0, forks: plan(L, base), dmg: 24 + 5 * L, poisoned: new Set(), done: false });
    g.sfx('swing'); if (f === g.player) g.shake(L >= 5 ? 4 : 2);
  };

  function applyPoison(g, a, t) {
    const f = a.f; if (a.poisoned.has(t)) return; a.poisoned.add(t);
    if (a.L === 3 || a.L === 4) g.burn(t, POISON[a.L][0], POISON[a.L][1], f, 'scythe');
    else if (a.L >= 5 && !t.dots.some(function (d) { return d.perm; })) {
      const dur = 100000; g.dotFlat(t, PERM_DPS * dur, dur, f, 'scythe'); t.dots[t.dots.length - 1].perm = true; t.dots[t.dots.length - 1].poisonSrc = f;
    }
    if (a.L >= 3) g.fx('burst', t.x, t.y, { col: '#9b5cff', n: 12, life: 0.6 });
  }

  WB.updateForks = function (dt) {
    const g = G(); if (!g) return; g.forks = g.forks || []; g.forkP = g.forkP || [];
    // protection du niveau 3 : la grande fourche divise par deux les dégâts reçus ; soin = fin du poison permanent
    if (!g.__forkHooks) {
      g.__forkHooks = 1; const od = g.damage, oh = g.heal;
      g.damage = function (t, amt) { if (t && t.slots && t.slots.some(function (s) { return s && s.id === 'scythe' && s.lvl === 3; })) { const a = Array.prototype.slice.call(arguments); a[1] = amt * 0.5; return od.apply(g, a); } return od.apply(g, arguments); };
      g.heal = function (f, amt) { oh.apply(g, arguments); if (amt > 0 && f.dots) f.dots = f.dots.filter(function (d) { return !d.perm; }); };
    }
    for (const f of g.F) {   // gain de vie par une autre source : le poison permanent s'arrête aussi
      if (f.dots && f.dots.length) { if (f._hp0 != null && f.hp > f._hp0 + 0.5 && f.dots.some(function (d) { return d.perm; })) f.dots = f.dots.filter(function (d) { return !d.perm; }); }
      f._hp0 = f.hp;
      if (f.alive && f.dots && f.dots.some(function (d) { return d.ab === 'scythe'; }) && Math.random() < dt * 14 && g.forkP.length < 200) g.forkP.push({ x: f.x + (Math.random() - 0.5) * 22, y: f.y + 8, vx: (Math.random() - 0.5) * 24, vy: -(25 + Math.random() * 35), t: 0, life: 0.8 + Math.random() * 0.5, r: 2 + Math.random() * 3, soul: 1 });
    }
    for (let i = g.forks.length - 1; i >= 0; i--) {
      const a = g.forks[i], f = a.f; a.t += dt;
      if (!f.alive || f.st.frozen > 0 || f.swallowed) { g.forks.splice(i, 1); continue; }
      let anyLive = false;
      for (const fk of a.forks) {
        const ps = pose(fk, a.t); fk.cur = ps; if (!ps) { if (a.t < fk.segs[fk.segs.length - 1].t1) anyLive = true; continue; } anyLive = true;
        const reach = a.R * ps.ext;
        if (g.forkP.length < 200) for (let k = 0; k < 2; k++) { const d = reach * (0.5 + Math.random() * 0.5); g.forkP.push({ x: f.x + Math.cos(ps.ang) * d, y: f.y + Math.sin(ps.ang) * d, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30 - 10, t: 0, life: 0.35 + Math.random() * 0.3, r: 2.5 + Math.random() * 3 }); }
        if (!ps.seg || !ps.seg.hit) continue;
        fk.hit = fk.hit || new Map(); const hs = fk.hit.get(ps.seg) || new Set(); fk.hit.set(ps.seg, hs);
        for (const t of g.F) {
          if (!t.alive || t.team === f.team || t.st.jump || t.ghost || hs.has(t)) continue;
          const d = Math.hypot(t.x - f.x, t.y - f.y); if (d > reach + t.r) continue;
          const rel = norm(Math.atan2(t.y - f.y, t.x - f.x) - ps.seg.a0), cov = ps.ang - ps.seg.a0, up = ps.seg.a1 >= ps.seg.a0;
          const inside = up ? (rel >= -0.14 && rel <= cov + 0.14) : (rel <= 0.14 && rel >= cov - 0.14); if (!inside && d > 36) continue;
          hs.add(t); g.damage(t, a.dmg, f, 'scythe'); g.knock(t, Math.cos(ps.seg.kdir), Math.sin(ps.seg.kdir), 200); applyPoison(g, a, t);
        }
        for (const s of (g.spiders || [])) if (s.alive && Math.hypot(s.x - f.x, s.y - f.y) < reach && !(fk.sp && fk.sp.has(s))) { fk.sp = fk.sp || new Set(); fk.sp.add(s); g.hitSpider(s, a.dmg, f); }
      }
      if (!anyLive) g.forks.splice(i, 1);
    }
    for (let i = g.forkP.length - 1; i >= 0; i--) { const p = g.forkP[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.t >= p.life) g.forkP.splice(i, 1); }
  };

  const upd = WB.updateHands, drw = WB.drawHands;
  WB.updateHands = function (dt) { upd(dt); WB.updateForks(dt); };
  WB.drawHands = function (ctx, g, time) {
    drw(ctx, g, time);
    if (g.forkP) for (const p of g.forkP) { const u = p.t / p.life; ctx.globalAlpha = Math.max(0, 0.8 * (1 - u)); ctx.fillStyle = p.soul ? (u < 0.5 ? '#c9a0ff' : '#5a2a90') : (u < 0.5 ? '#9b5cff' : '#2a0a40'); ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + u * 0.6), 0, PI2); ctx.fill(); }
    ctx.globalAlpha = 1;
    if (g.forks) for (const a of g.forks) for (const fk of a.forks) if (fk.cur) { const ps = fk.cur, len = a.R * ps.ext; WB.drawFork(ctx, a.f.x, a.f.y - 4, ps.ang, len, fk.sc, time, fk.skull); }
  };
})(window.WB);

// ===================== GLACE : spécification officielle (voir SPECS_CAPACITES.md) =====================
(function (WB) {
  'use strict';
  const A = WB.ABIL, G = () => WB.G, PI2 = Math.PI * 2, I = A.ice;
  // valeurs d'équilibrage : [dégâts, durée de gel]
  const V = { 1: [20, 1.4], 2: [24, 1.7], 3: [34, 1.7], 4: [14, 0], 5: [60, 1.8] };
  const TRAP = { r: 120, life: 10, fill: 1.6, place: 300 };       // piège niveau 5 : rayon, attente max, secondes dans la zone avant le gel complet
  I.type = 'zone';
  I.cd = function (L) { return [7, 7, 7, 8, 10][L - 1]; };
  I.range = function (L) { return [170, 190, 210, 260, TRAP.place][L - 1]; };
  I.ai = { max: function (L) { return L >= 5 ? 230 : I.range(L) - 20; }, min: 0 };
  I.desc = 'Niv.1 : gèle le plus proche. Niv.2 : gèle tous les ennemis de la zone. Niv.3 : piques qui poursuivent. Niv.4 : cercles de piques (ralentit). Niv.5 : piège de glace avec explosion de piques.';

  function foes(g, f, x, y, r) { const out = []; for (const t of g.F) { if (!t.alive || t.team === f.team || t.st.jump || t.ghost || t.swallowed) continue; if (Math.hypot(t.x - x, t.y - y) <= r + t.r * 0.5) out.push(t); } return out; }
  function freeze(g, f, t, dmg, dur) { g.damage(t, dmg, f, 'ice'); if (dur > 0) g.status(t, 'frozen', dur); g.fx('burst', t.x, t.y, { col: '#d8f6ff', n: 12, life: 0.5 }); g.fx('ring', t.x, t.y, { r: 46, col: '#bff0ff', life: 0.4, w: 5 }); }

  I.cast = function (f, ab, aim) {
    const g = G(), L = ab.lvl; g.iceZ = g.iceZ || [];
    const z = { f: f, L: L, t: 0, done: new Set(), seed: Math.random() * 6 };
    if (L <= 3) Object.assign(z, { kind: L === 3 ? 'seek' : 'aura', r: I.range(L), life: 3.2 });
    else if (L === 4) Object.assign(z, { kind: 'rings', x: f.x, y: f.y, radii: [70, 130, 190, 250], life: 2.4, hits: [new Set(), new Set(), new Set(), new Set()] });
    else {
      let d = 60 + (aim.m == null ? 0.5 : Math.min(1, aim.m)) * 200, ax = aim.x, ay = aim.y;
      if (aim.target) { const dx = aim.target.x - f.x, dy = aim.target.y - f.y, dd = Math.hypot(dx, dy) || 1; d = Math.min(dd, TRAP.place); ax = dx / dd; ay = dy / dd; }
      let px = f.x + ax * d, py = f.y + ay * d; for (let k = 0; k < 8 && g.world.solidAt(px, py); k++) { d *= 0.85; px = f.x + ax * d; py = f.y + ay * d; }
      Object.assign(z, { kind: 'trap', x: px, y: py, r: TRAP.r, life: TRAP.life, prog: new Map(), exploded: false });
      g.fx('ring', px, py, { r: TRAP.r, col: '#bff0ff', life: 0.5, w: 6 });
    }
    g.iceZ.push(z); g.fx('snow', f.x, f.y, { r: 90, life: 0.5 }); g.sfx('ice');
  };

  WB.updateIce = function (dt) {
    const g = G(); if (!g || !g.iceZ) return;
    for (let i = g.iceZ.length - 1; i >= 0; i--) {
      const z = g.iceZ[i], f = z.f, L = z.L; z.t += dt;
      if (z.kind === 'aura' || z.kind === 'seek') {
        if (!f.alive) { g.iceZ.splice(i, 1); continue; }
        const [dmg, dur] = V[L], inside = foes(g, f, f.x, f.y, z.r).filter(function (t) { return !z.done.has(t); });
        if (z.kind === 'aura' && L === 1) {                    // un seul ennemi à la fois : le plus proche
          if (!(z.cur && z.cur.alive && z.cur.st.frozen > 0) && z.t < z.life - 0.4 && inside.length) { inside.sort(function (a, b) { return Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y); }); z.cur = inside[0]; z.done.add(z.cur); freeze(g, f, z.cur, dmg, dur); }
        } else if (z.kind === 'aura') { for (const t of inside) { z.done.add(t); freeze(g, f, t, dmg, dur); } }
        else if (!z.train && !z.fired && inside.length) {      // niveau 3 : piques qui poursuivent la cible
          inside.sort(function (a, b) { return Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y); }); z.fired = true; z.train = { x: f.x, y: f.y, tg: inside[0], path: [{ x: f.x, y: f.y, t: z.t }], t0: z.t, hit: false };
        }
        const tr = z.train;
        if (tr && !tr.hit) {
          const t = tr.tg; if (!t.alive || z.t - tr.t0 > 2.2) tr.hit = true; else {
            const dx = t.x - tr.x, dy = t.y - tr.y, d = Math.hypot(dx, dy) || 1, st = Math.min(d, 520 * dt);
            tr.x += dx / d * st; tr.y += dy / d * st; const lp = tr.path[tr.path.length - 1]; if (Math.hypot(tr.x - lp.x, tr.y - lp.y) > 15) tr.path.push({ x: tr.x, y: tr.y, t: z.t });
            if (d < 22 + t.r) { tr.hit = true; tr.hitT = z.t; freeze(g, f, t, dmg, dur); g.fx('ring', t.x, t.y, { r: 60, col: '#ffffff', life: 0.35, w: 6 }); }
          }
        }
        if (z.t >= z.life && (!tr || tr.hit)) g.iceZ.splice(i, 1);
      } else if (z.kind === 'rings') {
        z.radii.forEach(function (r, k) {
          const t0 = 0.15 + 0.4 * k, u = z.t - t0; if (u < 0 || u > 0.9) return; if (u > 0.2 && u < 0.65 || u <= 0.2) {   // active pendant la sortie et le maintien
            for (const t of g.F) { if (!t.alive || t.team === f.team || t.st.jump || t.ghost || z.hits[k].has(t)) continue; const d = Math.hypot(t.x - z.x, t.y - z.y); if (Math.abs(d - r) > 32 + t.r * 0.4) continue;
              z.hits[k].add(t); g.damage(t, V[4][0], f, 'ice'); t.st.slowT = 2.2; t.st.slowMax = 2.2; t.st.slowAmt = 0.55; g.fx('burst', t.x, t.y, { col: '#d8f6ff', n: 8, life: 0.4 }); }
          }
        });
        if (z.t >= z.life) g.iceZ.splice(i, 1);
      } else {   // piège
        if (z.exploded) { if (z.t >= z.exT + 0.6) g.iceZ.splice(i, 1); continue; }
        const inside = foes(g, f, z.x, z.y, z.r), now = new Set(inside);
        for (const t of inside) {
          let p = (z.prog.get(t) || 0) + dt; z.prog.set(t, p);
          if (!(t.st.frozen > 0)) { if (p >= TRAP.fill && !z.done.has(t)) { z.done.add(t); g.status(t, 'frozen', V[5][1]); g.fx('burst', t.x, t.y, { col: '#d8f6ff', n: 14, life: 0.6 }); if (!z.exAt) z.exAt = z.t + V[5][1] - 0.12; } else if (!z.done.has(t)) { t.st.slowT = 0.25; t.st.slowMax = 0.25; t.st.slowAmt = Math.min(0.95, p / TRAP.fill); } }
        }
        z.prog.forEach(function (p, t) { if (!now.has(t)) z.prog.set(t, Math.max(0, p - dt * 1.5)); });
        if (z.exAt && z.t >= z.exAt) {
          z.exploded = true; z.exT = z.t; const hit = []; for (const t of inside) if (t.st.frozen > 0) { hit.push(t); g.damage(t, V[5][0], f, 'ice'); t.st.frozen = 0; g.fx('burst', t.x, t.y, { col: '#ffffff', n: 16, life: 0.6 }); }
          g.fx('ring', z.x, z.y, { r: z.r, col: '#ffffff', life: 0.4, w: 8 }); g.sfx('boom'); g.shake(4);
        } else if (z.t >= z.life) g.iceZ.splice(i, 1);
      }
    }
  };

  // ---------- dessin ----------
  function spike(c, x, y, h, w, a) { if (h < 1) return; c.globalAlpha = a; const gr = c.createLinearGradient(x, y, x, y - h); gr.addColorStop(0, '#6fc8ee'); gr.addColorStop(1, '#f2fcff'); c.fillStyle = gr; c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x + w * 0.08, y - h); c.lineTo(x + w / 2, y); c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1; c.stroke(); c.fillStyle = 'rgba(40,110,160,.25)'; c.beginPath(); c.ellipse(x, y + 1, w * 0.5, 3, 0, 0, PI2); c.fill(); }
  function flake(c, x, y, r, rot) { c.strokeStyle = 'rgba(235,250,255,.95)'; c.lineWidth = 1.3; for (let k = 0; k < 3; k++) { const a = rot + k * Math.PI / 3; c.beginPath(); c.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r); c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); c.stroke(); } }
  WB.drawIce = function (c, g, time) {
    if (!g.iceZ) return;
    for (const z of g.iceZ) {
      c.save(); const f = z.f;
      if (z.kind === 'aura' || z.kind === 'seek') {
        const a = Math.min(1, z.t / 0.2, (z.life - z.t) / 0.5 + 0.0), r = z.r * (0.9 + 0.1 * Math.min(1, z.t / 0.25)); c.globalAlpha = Math.max(0, 0.2 * a); c.fillStyle = '#bfefff'; c.beginPath(); c.arc(f.x, f.y, r, 0, PI2); c.fill();
        c.globalAlpha = Math.max(0, 0.8 * a); c.strokeStyle = '#d8f6ff'; c.lineWidth = 3; c.setLineDash([12, 8]); c.lineDashOffset = -time * 30; c.beginPath(); c.arc(f.x, f.y, r, 0, PI2); c.stroke(); c.setLineDash([]);
        for (let k = 0; k < 14; k++) { const an = z.seed + k * 0.9 + time * (0.4 + (k % 3) * 0.15), rr = r * (0.25 + ((k * 0.37 + time * 0.1) % 0.7)); c.globalAlpha = Math.max(0, a * 0.9); flake(c, f.x + Math.cos(an) * rr, f.y + Math.sin(an) * rr, 4 + (k % 3), time + k); }
        const tr = z.train; if (tr) {   // trajectoire de piques, du personnage à la cible
          const age = tr.hit ? Math.max(0, 1 - (z.t - (tr.hitT || z.t)) / 0.5) : 1; if (age > 0) { c.globalAlpha = 0.5 * age; c.strokeStyle = '#d8f6ff'; c.lineWidth = 2; c.beginPath(); c.moveTo(f.x, f.y); const p0 = tr.path[0]; c.lineTo(p0.x, p0.y); c.stroke(); c.beginPath(); c.moveTo(p0.x, p0.y); for (const p of tr.path) c.lineTo(p.x, p.y); c.stroke();
            tr.path.forEach(function (p, k) { const grow = Math.min(1, (z.t - p.t) / 0.15); spike(c, p.x + (k % 2 ? 4 : -4), p.y + 4, (14 + (k % 3) * 5) * grow, 11, age); }); if (!tr.hit) spike(c, tr.x, tr.y + 4, 30, 16, 1); }
        }
      } else if (z.kind === 'rings') {
        z.radii.forEach(function (r, k) {
          const t0 = 0.15 + 0.4 * k, u = z.t - t0; if (u < 0 || u > 0.9) return; const h = u < 0.2 ? u / 0.2 : u < 0.65 ? 1 : Math.max(0, 1 - (u - 0.65) / 0.25), n = Math.round(PI2 * r / 30);
          for (let j = 0; j < n; j++) { const an = j * PI2 / n + k * 0.3; spike(c, z.x + Math.cos(an) * r, z.y + Math.sin(an) * r, (26 + (j % 3) * 6) * h, 14, 0.95); }
        });
      } else {
        const exp = z.exploded, a = exp ? Math.max(0, 1 - (z.t - z.exT) / 0.6) : Math.min(1, z.t / 0.4) * Math.min(1, (z.life - z.t) / 0.8 + 0.2);
        const gr = c.createRadialGradient(z.x, z.y, z.r * 0.2, z.x, z.y, z.r); gr.addColorStop(0, 'rgba(200,240,255,.12)'); gr.addColorStop(0.85, 'rgba(170,225,255,.3)'); gr.addColorStop(1, 'rgba(235,252,255,.65)');
        c.globalAlpha = a; c.fillStyle = gr; c.beginPath(); c.ellipse(z.x, z.y, z.r, z.r * 0.92, 0, 0, PI2); c.fill();
        c.strokeStyle = '#eaffff'; c.lineWidth = 3; c.globalAlpha = a * 0.9; c.beginPath(); c.ellipse(z.x, z.y, z.r, z.r * 0.92, 0, 0, PI2); c.stroke();
        c.globalAlpha = a * 0.35; c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.arc(z.x - z.r * 0.35, z.y - z.r * 0.4, z.r * 0.5, 3.6, 4.6); c.stroke();
        for (let k = 0; k < 22; k++) { const an = z.seed + k * 2.4 + time * 0.35, rr = z.r * (0.12 + ((k * 0.171 + time * 0.07) % 0.82)); c.globalAlpha = a; flake(c, z.x + Math.cos(an) * rr, z.y + Math.sin(an) * rr * 0.9, 4 + (k % 3), time * 0.8 + k); }
        if (exp) { const u = Math.min(1, (z.t - z.exT) / 0.2); for (let k = 0; k < 40; k++) { const an = k * 2.399, rr = z.r * Math.sqrt((k + 0.5) / 40); spike(c, z.x + Math.cos(an) * rr, z.y + Math.sin(an) * rr * 0.9, 34 * u * (0.7 + (k % 3) * 0.2), 14, a); } }
      }
      c.restore();
    }
  };
  const upd = WB.updateHands, drw = WB.drawHands;
  WB.updateHands = function (dt) { upd(dt); WB.updateIce(dt); };
  WB.drawHands = function (ctx, g, time) { drw(ctx, g, time); WB.drawIce(ctx, g, time); };
})(window.WB);
WB.GUIDE.ice = ['Myrtilles givrées', 'Gel, piques de glace et piège.', ['Une zone autour de toi gèle le plus proche ennemi qui y entre.', 'La zone gèle tous les ennemis qui y entrent, un peu plus fort.', 'Des piques jaillissent du sol, poursuivent la cible, la transpercent et la gèlent.', 'Cercles de piques en expansion à 360° : dégâts répétés et ralentissement, sans gel.', 'Piège de glace posé où tu veux : ralentit puis gèle, et finit par une explosion de piques.']];

// ===================== TROU NOIR : spécification officielle (voir SPECS_CAPACITES.md) =====================
(function (WB) {
  'use strict';
  const A = WB.ABIL, G = () => WB.G, PI2 = Math.PI * 2, H = A.hole;
  // niveaux 1 à 4 : [rayon d'aspiration, rayon du centre, nombre d'ennemis à absorber] ; niveau 5 : suit le joueur
  const T = { 1: [100, 38, 1], 2: [130, 44, 2], 3: [145, 48, 3], 4: [160, 52, 4], 5: [150, 62, 99] };
  const LIFE = { 1: 8, 2: 20, 3: 20, 4: 20, 5: 4 };      // secondes d'attente (niveaux 1 à 4) ; durée d'activation (niveau 5)
  H.cd = function (L) { return L >= 5 ? 26 : 18; };        // recharge après 2 utilisations
  H.range = function (L) { return L >= 5 ? T[5][0] : 280; };
  H.desc = 'Niv.1 : absorbe 1 ennemi puis se referme. Niv.2 à 4 : reste ouvert jusqu\'à 2, 3 ou 4 ennemis absorbés. Niv.5 : suit le joueur 4 s et absorbe tout ce qui entre. 2 utilisations avant recharge.';
  H.ai = { max: function (L) { return L >= 5 ? 160 : 300; }, min: 0 };

  H.cast = function (f, ab, aim) {
    const g = G(), L = ab.lvl; g.bh = g.bh || [];
    if (L >= 5 && g.bh.some(function (h) { return h.f === f && h.follow && !h.closing; })) return false;
    let x = f.x, y = f.y;
    if (L < 5) { const d = Math.max(60, H.range(L) * Math.max(0.25, Math.min(1, aim.m == null ? 0.6 : aim.m))); x = f.x + aim.x * d; y = f.y + aim.y * d; if (g.world.solidAt(x, y)) { x = f.x + aim.x * 70; y = f.y + aim.y * 70; } }
    g.bh.push({ f: f, L: L, x: x, y: y, pull: T[L][0], core: T[L][1], cap: T[L][2], got: 0, age: 0, life: LIFE[L], follow: L >= 5, closing: 0 });
    g.fx('ring', x, y, { r: T[L][0], col: '#b080ff', life: 0.5, w: 6 }); g.sfx('hole');
  };

  function absorb(g, h, t) {
    g.fx('burst', t.x, t.y, { col: '#b080ff', n: 16, life: 0.6 }); g.fx('ring', t.x, t.y, { r: 36, col: '#e8d8ff', life: 0.35, w: 4 });
    if (h.L === 1 && t.kind === 'boss') g.damage(t, t.maxhp * 0.35, h.f, 'hole');          // niveau 1 : comportement d'origine contre les boss
    else { t.st.shield = 0; t.st.invuln = 0; g.damage(t, 99999, h.f, 'hole'); }
    h.got++;
  }

  WB.updateBlackHoles = function (dt) {
    const g = G(); if (!g || !g.bh) return;
    for (let i = g.bh.length - 1; i >= 0; i--) {
      const h = g.bh[i], f = h.f; h.age += dt;
      if (h.closing > 0) { h.closing -= dt; if (h.closing <= 0) g.bh.splice(i, 1); continue; }
      if (h.follow) { if (!f.alive) { h.closing = 0.2; continue; } h.x = f.x; h.y = f.y + 4; }
      const inCore = [];
      for (const t of g.F) {
        if (!t.alive || t.team === f.team || t.st.jump || t.ghost || t.swallowed) continue;
        const dx = h.x - t.x, dy = h.y - t.y, d = Math.hypot(dx, dy); if (d > h.pull + t.r) continue;
        if (h.L >= 5) { inCore.push([d, t]); continue; }                                        // niveau 5 : tout ennemi qui entre est absorbé
        const pull = (t.kind === 'boss' ? 160 : 420) * dt; t.x += dx / (d || 1) * Math.min(pull, d); t.y += dy / (d || 1) * Math.min(pull, d); g.world.collide(t, g.walls);
        if (d < h.core && !(t.st.invuln > 0 && !t.st.shield)) inCore.push([d, t]);
      }
      inCore.sort(function (a, b) { return a[0] - b[0]; });
      for (const [d, t] of inCore) { if (h.got >= h.cap) break; absorb(g, h, t); }
      if (h.got >= h.cap) h.closing = 0.35;
      else if (h.age >= h.life) h.closing = 0.4;
    }
  };

  WB.drawBlackHoles = function (c, g, time) {
    if (!g.bh) return;
    for (const h of g.bh) {
      const open = Math.min(1, h.age / 0.4), shut = h.closing > 0 ? Math.max(0, h.closing / (h.got >= h.cap ? 0.35 : 0.4)) : 1, u = open * shut, r = (h.L >= 5 ? h.pull : h.pull * 0.92) * u;
      if (r < 2) continue; c.save(); c.translate(h.x, h.y);
      const gr = c.createRadialGradient(0, 0, 4, 0, 0, r); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.4, 'rgba(24,6,50,.92)'); gr.addColorStop(1, 'rgba(140,80,240,0)'); c.fillStyle = gr; c.beginPath(); c.arc(0, 0, r, 0, PI2); c.fill();
      c.strokeStyle = 'rgba(210,170,255,.75)'; c.lineWidth = 2.5; c.rotate(time * 5); for (let k = 0; k < 3; k++) { c.rotate(PI2 / 3); c.beginPath(); for (let a = 0; a < 4.2; a += 0.15) { const rr = 6 + a * r * 0.2; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.stroke(); }
      c.rotate(-time * 5); c.strokeStyle = 'rgba(190,140,255,.55)'; c.lineWidth = 2; c.setLineDash([8, 8]); c.beginPath(); c.arc(0, 0, h.core * u, 0, PI2); c.stroke(); c.setLineDash([]);
      if (h.L >= 5) { const left = Math.max(0, h.life - h.age) / h.life; c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, r + 6, -Math.PI / 2, -Math.PI / 2 + PI2 * left); c.stroke(); }
      else if (h.cap > 1) { for (let k = 0; k < h.cap; k++) { c.fillStyle = k < h.got ? '#ffffff' : 'rgba(20,0,40,.8)'; c.strokeStyle = '#c8a8ff'; c.lineWidth = 1.5; c.beginPath(); c.arc((k - (h.cap - 1) / 2) * 14, -r - 8, 4.5, 0, PI2); c.fill(); c.stroke(); } }
      c.restore();
    }
  };
  const upd = WB.updateHands, drw = WB.drawHands;
  WB.updateHands = function (dt) { upd(dt); WB.updateBlackHoles(dt); };
  WB.drawHands = function (ctx, g, time) { drw(ctx, g, time); WB.drawBlackHoles(ctx, g, time); };
})(window.WB);
WB.GUIDE.hole = ['Prune noire', 'Aspire et élimine les ennemis. 2 utilisations seulement avant recharge.', ['Un petit trou noir absorbe 1 ennemi puis se referme.', 'Plus grand : reste ouvert jusqu\'à avoir absorbé 2 ennemis.', 'Même principe, 3 ennemis à absorber.', 'Même principe, 4 ennemis à absorber.', 'Le trou noir se colle sous toi 4 s et absorbe tout ennemi qui entre dans sa zone.']];

// ===================== MUR (TERRE) : spécification officielle (voir SPECS_CAPACITES.md) =====================
(function (WB) {
  'use strict';
  const A = WB.ABIL, G = () => WB.G, PI2 = Math.PI * 2, M = A.wall;
  WB.fr = 0;
  // niveaux 1 à 3 : murs faits de blocs de terre (le moteur gère les murs comme des rectangles)
  //   [nombre de blocs, taille d'un bloc, rayon de l'arc, vie du mur, vie d'une épine, durée, dégâts de choc, étourdissement]
  const P = {
    1: { n: 8, s: 30, R: 0, hp: 90, spike: 0, life: 14, ram: 16, stun: 0 },
    2: { n: 9, s: 44, R: 115, hp: 280, spike: 0, life: 16, ram: 20, stun: 0.9 },
    3: { n: 11, s: 48, R: 135, hp: 420, spike: 50, life: 18, ram: 20, stun: 0.9 }
  };
  const SPIKE_HIT = 24, GNAW = 8;
  const MET = { main: { r: 105, dmg: 75, knock: 420, stun: 0.9, T: 1.05 }, small: { r: 62, dmg: 28, knock: 240, stun: 0.3 } };
  const E5 = { det: 190, R: 235, dmg: 95, knock: 700, stun: 0.6, close: 0.7, seal: 1.15, end: 1.9 };
  M.cd = function (L) { return L >= 5 ? 16 : L >= 4 ? 10 : 8; };
  M.range = function (L) { return L >= 5 ? E5.R : L >= 4 ? 340 : 180; };
  M.type = 'aim';
  M.desc = 'Niv.1 : un mur droit entre toi et l\'ennemi. Niv.2 : mur en demi-cercle qui étourdit. Niv.3 : demi-cercle à épines (épines d\'abord, mur ensuite). Niv.4 : pluie de météorites. Niv.5 : boule de terre qui se déclenche seule puis hérisse des épines.';
  M.ai = { max: function (L) { return L >= 4 ? 340 : 260; }, min: 0, cond: function (f, ab) { return ab.lvl < 5; } };

  function enemies(g, f) { return g.F.filter(function (t) { return t.alive && t.team !== f.team && !(t.st.jump || t.ghost) && t.respawnT <= 0 && !t.swallowed; }); }
  function dirTo(g, f, aim) {
    const t = g.nearest(f, 520);
    if (t) { const d = Math.hypot(t.x - f.x, t.y - f.y) || 1; return { x: (t.x - f.x) / d, y: (t.y - f.y) / d, d: d, t: t }; }
    const a = aim && (aim.x || aim.y) ? aim : (f.aimLast || f.face || { x: 1, y: 0 }); const d = Math.hypot(a.x, a.y) || 1; return { x: a.x / d, y: a.y / d, d: 9999, t: null };
  }
  function freeBlock(g, x, y, s) { const w = g.world, h = s / 2 - 2; return !(w.solidAt(x - h, y - h) || w.solidAt(x + h, y - h) || w.solidAt(x - h, y + h) || w.solidAt(x + h, y + h) || w.solidAt(x, y)); }

  function makeWall(g, f, L, aim) {
    const p = P[L], D = dirTo(g, f, aim), grp = { f: f, L: L, hp: p.hp, maxhp: p.hp, spikes: 0, blocks: [], dead: false, fr: -1, frd: 0, ram: p.ram, stun: p.stun, born: 0 };
    const pts = [];
    if (L === 1) {
      const dd = Math.max(f.r + 26, Math.min(72, D.d / 2)), cx = f.x + D.x * dd, cy = f.y + D.y * dd, px = -D.y, py = D.x;       // ligne perpendiculaire à la direction de l'ennemi
      for (let k = 0; k < p.n; k++) { const o = (k - (p.n - 1) / 2) * (p.s - 4); pts.push({ x: cx + px * o, y: cy + py * o, ang: Math.atan2(D.y, D.x) }); }
    } else {
      const a0 = Math.atan2(D.y, D.x);
      for (let k = 0; k < p.n; k++) { const a = a0 + (k / (p.n - 1) - 0.5) * Math.PI; pts.push({ x: f.x + Math.cos(a) * p.R, y: f.y + Math.sin(a) * p.R, ang: a }); }      // vrai demi-cercle côté ennemi
    }
    for (const q of pts) {
      if (!freeBlock(g, q.x, q.y, p.s)) continue;
      const b = { x: q.x, y: q.y, w: p.s, h: p.s, hp: 1e9, maxhp: 1e9, life: p.life, owner: f, grp: grp, ang: q.ang, spike: p.spike, spikeMax: p.spike, idx: grp.blocks.length };
      if (p.spike) grp.spikes++; grp.blocks.push(b); g.addWall(b);
    }
    if (!grp.blocks.length) return false;
    grp.mid = grp.blocks[Math.floor(grp.blocks.length / 2)];
    g.mwalls = g.mwalls || []; g.mwalls.push(grp);
    for (const b of grp.blocks) { g.fx('burst', b.x, b.y, { col: '#8a6a44', n: 4, life: 0.5 }); }
    g.fx('ring', grp.mid.x, grp.mid.y, { r: 50, col: '#b89868', life: 0.4, w: 5 }); g.sfx('wall'); if (f === g.player) g.shake(2);
    return true;
  }

  WB.hitWallBlock = function (w, dmg) {
    const g = G(), grp = w.grp; if (!grp || grp.dead) return;
    w.flash = 0.1;
    if (w.spike > 0) {                                       // étape 1 : les épines ont leur propre résistance
      w.spike -= dmg; g.fx('burst', w.x, w.y, { col: '#d8c090', n: 3, life: 0.3 });
      if (w.spike <= 0) { w.spike = 0; grp.spikes--; g.fx('burst', w.x, w.y, { col: '#c8a870', n: 8, life: 0.5 }); g.sfx('wall'); }
      return;
    }
    if (grp.spikes > 0) { g.fx('burst', w.x, w.y, { col: '#999', n: 2, life: 0.2 }); return; }   // le mur est protégé tant qu'il reste une épine
    if (grp.fr === WB.fr && grp.frd === dmg) return;        // une même explosion qui touche plusieurs blocs ne compte qu'une fois
    grp.fr = WB.fr; grp.frd = dmg; grp.hp -= dmg;
    for (const b of grp.blocks) b.flash = 0.1;
    if (grp.hp <= 0) { grp.dead = true; for (const b of grp.blocks) { b.life = 0; g.fx('burst', b.x, b.y, { col: '#a88a5c', n: 8, life: 0.6 }); } g.sfx('wall'); }
  };

  // niveau 4 : pluie de météorites sur l'ennemi le plus proche
  function meteors(g, f, ab) {
    const t = g.nearest(f, 400); if (!t) return false;
    g.met = g.met || [];
    const lx = t.x + (t.vx || 0) * 0.35, ly = t.y + (t.vy || 0) * 0.35;
    g.met.push({ f: f, x: lx, y: ly, T: MET.main.T, t: 0, big: true, r: MET.main.r });
    const offs = [[-95, -40, 0.55], [100, -25, 0.7], [-40, 90, 0.85], [70, 85, 1.2]];
    for (const o of offs) g.met.push({ f: f, x: lx + o[0], y: ly + o[1], T: o[2], t: 0, big: false, r: MET.small.r });
    g.sfx('wall'); return true;
  }
  function impact(g, m) {
    const c = m.big ? MET.main : MET.small;
    g.splash(m.f, m.x, m.y, c.r, c.dmg, 'wall', { knock: c.knock, stun: c.stun });
    g.fx('ring', m.x, m.y, { r: c.r, col: '#ff9a3a', life: 0.5, w: m.big ? 9 : 5 }); g.fx('burst', m.x, m.y, { col: '#7a5a38', n: m.big ? 26 : 12, life: 0.8 }); g.fx('burst', m.x, m.y, { col: '#ffb040', n: m.big ? 14 : 6, life: 0.5 });
    g.craters = g.craters || []; g.craters.push({ x: m.x, y: m.y, r: c.r * 0.55, t: 0, life: 3.2 });
    g.earthP = g.earthP || []; for (let k = 0; k < (m.big ? 14 : 6); k++) { const a = Math.random() * PI2, v = 120 + Math.random() * 260; g.earthP.push({ x: m.x, y: m.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, z: 0, t: 0, life: 0.7 + Math.random() * 0.4, s: 3 + Math.random() * 5 }); }
    g.shake(m.big ? 7 : 3); g.sfx('boom');
  }

  // niveau 5 : bouclier de terre épineux
  function earthShield(g, f) {
    if (f.earth) return false;
    f.earth = { t: 0, burst: false, ang: Math.random() * PI2 }; f.st.invuln = Math.max(f.st.invuln || 0, E5.end); f.st.root = Math.max(f.st.root || 0, E5.seal);
    g.fx('ring', f.x, f.y, { r: 80, col: '#b89868', life: 0.5, w: 6 }); g.sfx('wall'); return true;
  }

  M.cast = function (f, ab, aim) {
    const g = G(), L = ab.lvl;
    if (L <= 3) return makeWall(g, f, L, aim);
    if (L === 4) return meteors(g, f, ab);
    return earthShield(g, f);
  };

  WB.updateEarth = function (dt) {
    const g = G(); if (!g) return; WB.fr++;
    for (const t of g.F) if (t.__wh > 0) t.__wh -= dt;
    // murs : collision violente, épines, grignotage
    if (g.mwalls && g.mwalls.length) {
      g.mwalls = g.mwalls.filter(function (grp) { return !grp.dead && grp.blocks.some(function (b) { return b.life > 0; }); });
      for (const grp of g.mwalls) {
        const foes = enemies(g, grp.f);
        for (const b of grp.blocks) {
          if (b.life <= 0) continue;
          for (const t of foes) {
            const dx = Math.max(Math.abs(t.x - b.x) - b.w / 2, 0), dy = Math.max(Math.abs(t.y - b.y) - b.h / 2, 0), d = Math.hypot(dx, dy); if (d > t.r + 5) continue;
            const vx = (t.vx || 0) + (t.kx || 0), vy = (t.vy || 0) + (t.ky || 0), nx = b.x - t.x, ny = b.y - t.y, nl = Math.hypot(nx, ny) || 1, vin = (vx * nx + vy * ny) / nl;
            if (vin > 70 && !(t.__wh > 0)) {
              t.__wh = 0.9; g.damage(t, grp.ram + (b.spike > 0 ? SPIKE_HIT : 0), grp.f, 'wall'); if (grp.stun) g.status(t, 'stun', grp.stun);
              g.knock(t, -nx / nl, -ny / nl, b.spike > 0 ? 260 : 120); g.fx('burst', t.x, t.y, { col: b.spike > 0 ? '#e0d0a0' : '#b89868', n: 8, life: 0.4 }); g.text(t.x, t.y - 34, b.spike > 0 ? 'Épines !' : 'Choc !', '#ffd8a0', 14); g.sfx('wall');
            } else if (b.spike > 0 && !(t.__wh > 0)) { t.__wh = 0.5; g.damage(t, SPIKE_HIT * 0.6, grp.f, 'wall'); g.knock(t, -nx / nl, -ny / nl, 160); }
            if (vin > 20) WB.hitWallBlock(b, GNAW * dt);                 // l'ennemi qui pousse use le mur
          }
        }
      }
    }
    // météorites
    if (g.met) { for (const m of g.met) { m.t += dt; if (m.t >= m.T && !m.done) { m.done = true; impact(g, m); } } g.met = g.met.filter(function (m) { return !m.done; }); }
    if (g.craters) { for (const c of g.craters) c.t += dt; g.craters = g.craters.filter(function (c) { return c.t < c.life; }); }
    // boule de terre : déclenchement automatique quand un ennemi entre dans le rayon de détection
    for (const f of g.F) {
      if (!f.alive || !f.slots) continue;
      if (f.earth) {
        const e = f.earth; e.t += dt;
        if (!e.burst && e.t >= E5.seal) {
          e.burst = true; const hit = g.enemiesIn(f, f.x, f.y, E5.R);
          e.spikes = []; const N = 26; for (let k = 0; k < N; k++) e.spikes.push({ a: e.ang + k / N * PI2 + (Math.random() - 0.5) * 0.12, len: E5.R * (0.72 + Math.random() * 0.28), w: 13 + Math.random() * 8 });
          for (const t of hit) { g.damage(t, E5.dmg, f, 'wall'); g.knock(t, (t.x - f.x) / (Math.hypot(t.x - f.x, t.y - f.y) || 1), (t.y - f.y) / (Math.hypot(t.x - f.x, t.y - f.y) || 1), E5.knock); g.status(t, 'stun', E5.stun); g.fx('burst', t.x, t.y, { col: '#e8d8a8', n: 10, life: 0.5 }); }
          g.fx('ring', f.x, f.y, { r: E5.R, col: '#d8b878', life: 0.6, w: 10 }); g.fx('burst', f.x, f.y, { col: '#7a5a38', n: 30, life: 0.9 }); g.shake(9); g.sfx('boom'); g.text(f.x, f.y - 70, 'ÉPINES !', '#ffe0a0', 20);
          g.earthP = g.earthP || []; for (let k = 0; k < 22; k++) { const a = Math.random() * PI2, v = 160 + Math.random() * 300; g.earthP.push({ x: f.x, y: f.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 100, t: 0, life: 0.6 + Math.random() * 0.5, s: 3 + Math.random() * 6 }); }
        }
        if (e.t >= E5.end || !f.alive) { f.earth = null; f.earthLock = 6; }
        continue;
      }
      if (f.earthLock > 0) f.earthLock -= dt;
      if (f.thrall || f.swallowed || !g.started || g.over || f.earthLock > 0) continue;
      for (let i = 0; i < f.slots.length; i++) {
        const ab = f.slots[i]; if (!ab || ab.id !== 'wall' || ab.lvl < 5 || ab.cd > 0 || ab.gap > 0 || (ab.n != null && ab.n <= 0)) continue;
        if (!g.canCast(f)) break;
        if (enemies(g, f).some(function (t) { return Math.hypot(t.x - f.x, t.y - f.y) < E5.det + t.r; })) g.useSlot(f, i, { x: f.face ? f.face.x : 1, y: f.face ? f.face.y : 0, m: 1 });
        break;
      }
    }
    if (g.earthP) { for (const p of g.earthP) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt; } g.earthP = g.earthP.filter(function (p) { return p.t < p.life; }); }
  };

  // ---------- dessin ----------
  WB.drawWallBlock = function (c, w) {
    const grp = w.grp, L = grp.L, x = w.x, y = w.y, h = w.w / 2, flash = w.flash > 0;
    c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(x - h + 5, y - h + 7, w.w, w.h);
    const base = L === 1 ? ['#a89478', '#7c6a52'] : L === 2 ? ['#9a7448', '#6a4a28'] : ['#7a5a3a', '#4a3220'];
    const gr = c.createLinearGradient(x - h, y - h, x + h, y + h); gr.addColorStop(0, flash ? '#fff' : base[0]); gr.addColorStop(1, flash ? '#ddd' : base[1]);
    c.fillStyle = gr; c.strokeStyle = '#33261a'; c.lineWidth = 2.5; c.beginPath(); c.roundRect(x - h, y - h, w.w, w.h, 6); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(40,28,16,.45)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - h + 5, y - 2); c.lineTo(x + 2, y - h + 6); c.moveTo(x + h - 6, y + 3); c.lineTo(x - 3, y + h - 5); c.stroke();
    if (w.spike > 0) {                                      // épines tournées vers l'extérieur de l'arc
      const k = 0.35 + 0.65 * w.spike / w.spikeMax, ca = Math.cos(w.ang), sa = Math.sin(w.ang);
      c.fillStyle = flash ? '#fff' : '#d8c8a0'; c.strokeStyle = '#33261a'; c.lineWidth = 1.5;
      for (const o of [-0.55, 0, 0.55]) { const bx = x + ca * h * 0.7 - sa * o * h, by = y + sa * h * 0.7 + ca * o * h, len = 22 * k; c.beginPath(); c.moveTo(bx - sa * 7, by + ca * 7); c.lineTo(bx + ca * len, by + sa * len); c.lineTo(bx + sa * 7, by - ca * 7); c.closePath(); c.fill(); c.stroke(); }
    }
    if (w === grp.mid) {
      const p = Math.max(0, grp.hp / grp.maxhp), bw = 46, by = y - h - 16 - (grp.L >= 3 ? 20 : 0);
      c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(x - bw / 2, by, bw, 6); c.fillStyle = '#ffd24a'; c.fillRect(x - bw / 2 + 1, by + 1, (bw - 2) * p, 4);
      if (grp.L >= 3) { let sp = 0, sm = 0; for (const b of grp.blocks) { sp += b.spike; sm += b.spikeMax; } c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(x - bw / 2, by + 8, bw, 6); c.fillStyle = '#e8e0c0'; c.fillRect(x - bw / 2 + 1, by + 9, (bw - 2) * (sm ? sp / sm : 0), 4); }
    }
  };

  WB.drawEarth = function (c, g, time) {
    if (g.craters) for (const k of g.craters) { const a = Math.min(1, (k.life - k.t) / 1.2); c.fillStyle = 'rgba(30,18,10,' + (0.5 * a) + ')'; c.beginPath(); c.ellipse(k.x, k.y, k.r * 1.1, k.r * 0.75, 0, 0, PI2); c.fill(); c.strokeStyle = 'rgba(255,120,30,' + (0.5 * a) + ')'; c.lineWidth = 3; c.stroke(); }
    if (g.met) for (const m of g.met) {
      const u = Math.min(1, m.t / m.T), pulse = 0.5 + 0.5 * Math.sin(time * 20);
      c.save(); c.fillStyle = 'rgba(255,60,20,' + (0.12 + 0.22 * u) + ')'; c.beginPath(); c.arc(m.x, m.y, m.r, 0, PI2); c.fill(); c.strokeStyle = 'rgba(255,140,40,' + (0.5 + 0.4 * pulse) + ')'; c.lineWidth = 3; c.setLineDash([9, 7]); c.beginPath(); c.arc(m.x, m.y, m.r * (1 - 0.25 * u), 0, PI2); c.stroke(); c.setLineDash([]);
      const hh = (1 - u) * 430, mx = m.x + (1 - u) * 170, my = m.y - hh, rr = m.big ? 34 : 18;
      c.fillStyle = 'rgba(0,0,0,' + (0.15 + 0.25 * u) + ')'; c.beginPath(); c.ellipse(m.x, m.y, rr * (0.4 + 0.8 * u), rr * 0.3 * (0.4 + 0.8 * u), 0, 0, PI2); c.fill();
      for (let k = 6; k >= 1; k--) { const tu = k / 6; c.fillStyle = 'rgba(255,' + Math.round(150 - 90 * tu) + ',30,' + (0.5 * (1 - tu)) + ')'; c.beginPath(); c.arc(mx + 170 * 0.0 + tu * 36, my - tu * 86, rr * (1 - 0.5 * tu), 0, PI2); c.fill(); }
      const gr = c.createRadialGradient(mx - rr * 0.3, my - rr * 0.3, 2, mx, my, rr); gr.addColorStop(0, '#d8a060'); gr.addColorStop(0.55, '#7a4a28'); gr.addColorStop(1, '#2a1608'); c.fillStyle = gr; c.strokeStyle = '#ff8a2a'; c.lineWidth = 2.5; c.beginPath(); c.arc(mx, my, rr, 0, PI2); c.fill(); c.stroke();
      c.restore();
    }
    for (const f of g.F) {
      const e = f.earth; if (!e || !f.alive) continue;
      const open = Math.min(1, e.t / E5.close), R = 54, fade = e.t > E5.end - 0.3 ? Math.max(0, (E5.end - e.t) / 0.3) : 1;
      c.save(); c.translate(f.x, f.y - 4); c.globalAlpha = fade;
      if (e.burst && e.spikes) {                                    // épines de terre dans toutes les directions
        const gu = Math.min(1, (e.t - E5.seal) / 0.14);
        for (const s of e.spikes) { const L = s.len * gu, ca = Math.cos(s.a), sa = Math.sin(s.a), b0 = R * 0.8; c.fillStyle = '#a07a4a'; c.strokeStyle = '#2e2014'; c.lineWidth = 2; c.beginPath(); c.moveTo(ca * b0 - sa * s.w / 2, sa * b0 + ca * s.w / 2); c.lineTo(ca * L, sa * L); c.lineTo(ca * b0 + sa * s.w / 2, sa * b0 - ca * s.w / 2); c.closePath(); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,230,170,.35)'; c.beginPath(); c.moveTo(ca * b0, sa * b0); c.lineTo(ca * L, sa * L); c.lineTo(ca * b0 + sa * s.w / 2, sa * b0 - ca * s.w / 2); c.closePath(); c.fill(); }
      }
      if (open < 1) {                                               // des blocs de terre sortent du sol et se referment sur le personnage
        for (let k = 0; k < 10; k++) { const a = e.ang + k / 10 * PI2, rr = (1 - open) * 96 + R * 0.55, bs = 22 + 8 * open; c.fillStyle = k % 2 ? '#8a6238' : '#6a4a2a'; c.strokeStyle = '#2e2014'; c.lineWidth = 2; c.beginPath(); c.arc(Math.cos(a) * rr, Math.sin(a) * rr * 0.9, bs, 0, PI2); c.fill(); c.stroke(); }
      } else {
        const sh = e.burst ? 1 : 1 + 0.03 * Math.sin(time * 40), gr = c.createRadialGradient(-16, -18, 6, 0, 0, R * sh); gr.addColorStop(0, '#b88a56'); gr.addColorStop(0.6, '#7a5230'); gr.addColorStop(1, '#3a2514');
        c.fillStyle = gr; c.strokeStyle = '#25180e'; c.lineWidth = 3.5; c.beginPath(); c.arc(0, 0, R * sh, 0, PI2); c.fill(); c.stroke();
        c.strokeStyle = 'rgba(30,18,10,.55)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, R * 0.62, 0.4, 2.4); c.moveTo(-R * 0.7, R * 0.2); c.lineTo(-R * 0.1, R * 0.5); c.moveTo(R * 0.5, -R * 0.4); c.lineTo(R * 0.15, -R * 0.1); c.stroke();
        if (!e.burst) { c.strokeStyle = 'rgba(255,230,160,' + (0.3 + 0.4 * Math.sin(time * 30)) + ')'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, R + 6, 0, PI2); c.stroke(); }
      }
      c.restore();
    }
    if (g.earthP) for (const p of g.earthP) { c.globalAlpha = Math.max(0, 1 - p.t / p.life); c.fillStyle = '#8a6238'; c.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); c.globalAlpha = 1; }
    // rayon de détection du niveau 5, visible seulement par son propriétaire (règle générale des portées)
  };
  const upd0 = WB.updateHands, drw0 = WB.drawHands;
  WB.updateHands = function (dt) { upd0(dt); WB.updateEarth(dt); };
  WB.drawHands = function (ctx, g, time) { drw0(ctx, g, time); WB.drawEarth(ctx, g, time); };
})(window.WB);
WB.GUIDE.wall = ['Fruit de terre', 'Mur ou terre qui protège et blesse.', ['Un mur droit entre toi et l\'ennemi le plus proche ; l\'ennemi qui fonce dessus est blessé.', 'Mur en demi-cercle plus épais : choc violent et étourdissement.', 'Demi-cercle à épines : détruis les épines, puis le mur.', 'Pluie de météorites sur l\'ennemi le plus proche.', 'Boule de terre automatique puis épines dans toutes les directions.']];

// ===================== BOUCLIER : spécification officielle (voir SPECS_CAPACITES.md) =====================
(function (WB) {
  'use strict';
  const A = WB.ABIL, G = () => WB.G, PI2 = Math.PI * 2, S = A.shield;
  const DUR = 10, RECH = 5, ZONE = 150, PARRY = 0.4;
  //  arc : demi-angle du bouclier frontal ; panneaux : nombre, vie d'un panneau, demi-largeur, rayon d'orbite, vitesse
  const P = {
    1: { hp: 130, arc: 1.3, R: 46 },
    2: { panels: 4, php: 60, half: 0.55, R: 46, spin: 2.3 },
    3: { hp: 180, arc: 1.4, R: 48, mirror: true },
    4: { hp: 220, arc: 1.4, R: 48, emax: 100, boom: { R: 150, base: 25, k: 0.9, knock: 520, stun: 0 } },
    5: { panels: 6, php: 90, half: 0.55, R: 56, spin: 1.8, mirror: true, emax: 180, boom: { R: 240, base: 40, k: 1.0, knock: 820, stun: 0.6 } }
  };
  const NOBLOCK = { hole: 1, flamme: 1, drown: 1, summon_env: 1 };
  const REFLECT = { fire: 1, bullet: 1, stone: 1, web: 1 };       // seuls les projectiles de ce type sont renvoyables
  S.cd = function (L) { return (DUR + RECH) / WB.cdMul('shield'); };
  S.range = function (L) { const g = G(); return L >= 5 && g && g.mode && g.mode.teams ? ZONE : 60; };
  S.type = 'zone';
  S.desc = 'Bouclier de 10 s (recharge 5 s après sa disparition). Niv.1 : frontal. Niv.2 : panneaux rotatifs. Niv.3 : renvoie les projectiles. Niv.4 : absorbe l\'énergie puis explosion. Niv.5 : panneaux tout autour, renvoi, absorption et explosion géante.';
  S.ai = { max: function () { return 260; }, min: 0, cond: function (f, ab, t, d) { return (f.hp < f.maxhp * 0.75 || f.hurtT > 0) && !f.sh; } };

  const adiff = function (a, b) { let d = a - b; while (d > Math.PI) d -= PI2; while (d < -Math.PI) d += PI2; return d; };
  const faceAng = function (f) { return Math.atan2(f.face.y, f.face.x); };
  const panelAng = function (sh, i) { return sh.rot + i * PI2 / sh.panels.length; };

  S.cast = function (f, ab) {
    const g = G(), L = ab.lvl, p = P[L]; if (f.sh) return false;
    const sh = { L: L, ab: ab, age: 0, hp: p.hp || 0, maxhp: p.hp || 0, rot: 0, energy: 0, emax: p.emax || 0, panels: null, flash: 0, parry: 0 };
    if (p.panels) { sh.panels = []; for (let i = 0; i < p.panels; i++) sh.panels.push({ hp: p.php, maxhp: p.php, alive: true, flash: 0 }); }
    f.sh = sh; ab.cd = DUR + RECH;
    g.fx('ring', f.x, f.y, { r: 64, col: '#7fd0ff', life: 0.45, w: 6 }); g.fx('burst', f.x, f.y, { col: '#bfe8ff', n: 12, life: 0.5 }); g.sfx('shield');
  };

  function end(f, why) {
    const sh = f.sh; if (!sh) return; const g = G(); f.sh = null; if (sh.ab) { sh.ab.cd = RECH; sh.ab.n = 0; }
    if (why === 'break') { g.fx('burst', f.x, f.y, { col: '#9ad8ff', n: 22, life: 0.7 }); g.fx('ring', f.x, f.y, { r: 60, col: '#ffffff', life: 0.35, w: 4 }); g.text(f.x, f.y - 46, 'Bouclier brisé', '#bfe8ff', 15); g.sfx('impact'); }
    else if (why === 'time') g.fx('ring', f.x, f.y, { r: 50, col: '#9ad8ff', life: 0.3, w: 3 });
  }
  WB.shieldBreak = function (f) { if (f && f.sh) end(f, 'break'); };

  WB.shieldRelease = function (f) {
    const sh = f.sh; if (!sh || sh.L < 4 || sh.energy < 10) return false; const g = G(), b = P[sh.L].boom, e = sh.energy;
    const dmg = b.base + e * b.k;
    g.fx('ring', f.x, f.y, { r: b.R, col: '#ffe27a', life: 0.6, w: 10 }); g.fx('ring', f.x, f.y, { r: b.R * 0.6, col: '#ffffff', life: 0.4, w: 6 }); g.fx('burst', f.x, f.y, { col: '#ffd24a', n: 26, life: 0.8 });
    g.shw = g.shw || []; g.shw.push({ x: f.x, y: f.y, R: b.R, t: 0 });
    g.splash(f, f.x, f.y, b.R, dmg, 'shield', { knock: b.knock, stun: b.stun }); g.shake(sh.L >= 5 ? 10 : 6); g.sfx('boom'); g.text(f.x, f.y - 60, 'EXPLOSION !', '#ffe27a', 20);
    sh.energy = 0; end(f, 'release'); return true;
  };

  // qui est protégé par quel porteur : le porteur lui-même, et au niveau 5 en équipe ses coéquipiers dans la zone
  function guardOf(t) {
    if (t.sh) return t; const g = G(); if (!g || !g.mode || !g.mode.teams) return null;
    for (const s of g.F) if (s.sh && s.sh.L >= 5 && s.alive && s !== t && s.team === t.team && Math.hypot(s.x - t.x, s.y - t.y) < ZONE) return s;
    return null;
  }
  // un porteur couvre-t-il la direction th (angle depuis le porteur) ?
  function coverage(s, th) {
    const sh = s.sh, p = P[sh.L];
    if (sh.panels) { let best = null, bd = 9; sh.panels.forEach(function (pn, i) { if (!pn.alive) return; const d = Math.abs(adiff(th, panelAng(sh, i))); if (d < p.half && d < bd) { bd = d; best = pn; } }); return best; }
    return Math.abs(adiff(th, faceAng(s))) <= p.arc ? sh : null;
  }
  // encaisse un impact de amt dégâts : renvoie ce qui passe à travers le bouclier
  function absorb(s, part, amt, th) {
    const g = G(), sh = s.sh, p = P[sh.L]; let pass = 0, taken = amt;
    if (sh.panels) {
      if (sh.L === 2) { pass = Math.max(0, amt - part.hp); taken = Math.min(amt, part.hp); part.hp = 0; }       // niveau 2 : un panneau = un impact
      else { part.hp -= amt; if (part.hp < 0) { pass = -part.hp; taken = amt - pass; } }
      part.flash = 0.15; if (part.hp <= 0) { part.alive = false; part.hp = 0; g.fx('burst', s.x + Math.cos(th) * p.R, s.y + Math.sin(th) * p.R, { col: '#9ad8ff', n: 10, life: 0.5 }); }
    } else { sh.hp -= amt; if (sh.hp < 0) { pass = -sh.hp; taken = amt - pass; sh.hp = 0; } sh.flash = 0.15; }
    if (sh.emax) sh.energy = Math.min(sh.emax, sh.energy + taken);                                               // absorption limitée par la jauge maximale
    g.fx('burst', s.x + Math.cos(th) * (p.R + 4), s.y + Math.sin(th) * (p.R + 4), { col: sh.emax ? '#ffe27a' : '#bfe8ff', n: 6, life: 0.3 }); g.sfx('shield');
    if (sh.panels ? !sh.panels.some(function (q) { return q.alive; }) : sh.hp <= 0) end(s, 'break');
    return pass;
  }

  WB.shieldFilter = function (t, amt, src, ab, opt) {
    const s = guardOf(t); if (!s || !s.alive) return amt;
    if (opt && opt.dot) return amt;
    if (!src || src === t || src.team === t.team || NOBLOCK[ab]) return amt;
    const th = WB.__pa != null ? (WB.__pa) : Math.atan2(src.y - s.y, src.x - s.x);
    const part = coverage(s, th + (WB.__pa != null && s !== t ? 0 : 0)); if (!part) return amt;
    return absorb(s, part, amt, th);
  };
  WB.shieldCovers = function (t, src) {
    const s = guardOf(t); if (!s || !src || src === t || src.team === t.team) return false;
    return !!coverage(s, Math.atan2(src.y - s.y, src.x - s.x));
  };

  // projectiles : interceptés à l'approche du bouclier, renvoyés si le niveau le permet
  WB.shieldProj = function (p) {
    const g = G(); if (!p.owner) return 0;
    for (const s of g.F) {
      if (!s.alive || !s.sh) continue; const sh = s.sh, pr = P[sh.L];
      const prot = [s]; if (sh.L >= 5 && g.mode.teams) for (const a of g.F) if (a !== s && a.alive && a.team === s.team && Math.hypot(a.x - s.x, a.y - s.y) < ZONE) prot.push(a);
      for (const t of prot) {
        if (t.team === p.owner.team) continue;
        const near = t === s ? pr.R + 6 + p.r : t.r + 6 + p.r, d = Math.hypot(p.x - t.x, p.y - t.y); if (d > near) continue;
        if ((p.dx * (t.x - p.x) + p.dy * (t.y - p.y)) <= 0) continue;
        const th = Math.atan2(p.y - s.y, p.x - s.x), part = coverage(s, th); if (!part) continue;
        if (p.pierce) continue;                                                       // lances et attaques spéciales : non interceptées par ce test
        const old = p.owner;
        if (pr.mirror && REFLECT[p.kind] && !p.refl) {
          const par = sh.age < PARRY, mul = par ? 2 : 1;
          const tgt = old.alive ? old : null, dx = tgt ? tgt.x - p.x : -p.dx, dy = tgt ? tgt.y - p.y : -p.dy, dl = Math.hypot(dx, dy) || 1;
          p.dx = dx / dl; p.dy = dy / dl; p.owner = s; p.refl = { from: old, to: s, mul: mul }; p.life = Math.max(p.life, 1.0); p.speed *= 1.15;
          part.hp -= 22; part.flash = 0.15; sh.flash = 0.15; if (part.hp <= 0) { if (sh.panels) { part.alive = false; part.hp = 0; if (!sh.panels.some(function (q) { return q.alive; })) end(s, 'break'); } else end(s, 'break'); }
          g.fx('ring', p.x, p.y, { r: par ? 46 : 30, col: par ? '#ffe27a' : '#ffffff', life: 0.35, w: 5 }); g.fx('burst', p.x, p.y, { col: par ? '#ffe27a' : '#ffffff', n: par ? 14 : 8, life: 0.4 }); g.text(p.x, p.y - 20, par ? 'PARADE ×2' : 'Renvoyé', par ? '#ffe27a' : '#ffffff', par ? 17 : 14); g.sfx('shield');
          return 2;
        }
        const est = 14 + 6 * (p.lvl || 1), pass = absorb(s, part, est, th);
        if (pass > 0) g.damage(t, pass, old, p.ab, { noShield: true });
        return 1;
      }
    }
    return 0;
  };

  WB.updateShields = function (dt) {
    const g = G(); if (!g) return;
    for (const f of g.F) {
      const sh = f.sh; if (!sh) continue;
      if (!f.alive || f.respawnT > 0) { f.sh = null; continue; }
      sh.age += dt; sh.rot += (P[sh.L].spin || 0) * dt; sh.flash = Math.max(0, sh.flash - dt); if (sh.panels) for (const q of sh.panels) q.flash = Math.max(0, q.flash - dt);
      const rem = DUR - sh.age; if (sh.ab) sh.ab.cd = Math.max(0.01, rem + RECH);
      if (rem <= 0) { end(f, 'time'); continue; }
      if (f.kind !== 'player' && sh.L >= 4 && sh.energy >= sh.emax * 0.6 && g.enemiesIn(f, f.x, f.y, P[sh.L].boom.R * 0.8).length) WB.shieldRelease(f);      // les bots déclenchent l'explosion seuls
    }
    if (g.shw) { for (const w of g.shw) w.t += dt; g.shw = g.shw.filter(function (w) { return w.t < 0.6; }); }
  };

  WB.drawShields = function (c, g, time) {
    for (const f of g.F) {
      const sh = f.sh; if (!sh || !f.alive) continue; const p = P[sh.L], rem = Math.max(0, DUR - sh.age), low = rem < 2 ? (0.55 + 0.45 * Math.sin(time * 18)) : 1;
      c.save(); c.translate(f.x, f.y); c.globalAlpha = low;
      const mir = !!p.mirror, col = sh.emax ? ['#ffe27a', '#fff3b8'] : mir ? ['#e8f4ff', '#ffffff'] : ['#5ab4ff', '#bfe8ff'];
      if (sh.panels) {
        if (sh.L >= 5 && g.mode.teams) { c.strokeStyle = 'rgba(180,230,255,.5)'; c.lineWidth = 2; c.setLineDash([10, 8]); c.beginPath(); c.arc(0, 0, ZONE, 0, PI2); c.stroke(); c.setLineDash([]); c.fillStyle = 'rgba(120,200,255,.07)'; c.beginPath(); c.arc(0, 0, ZONE, 0, PI2); c.fill(); }
        if (sh.L >= 5) { c.strokeStyle = 'rgba(190,235,255,.35)'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, p.R, 0, PI2); c.stroke(); }
        sh.panels.forEach(function (q, i) {
          if (!q.alive) return; const a = panelAng(sh, i), hw = sh.L >= 5 ? 0.5 : 0.4;
          c.strokeStyle = q.flash > 0 ? '#ffffff' : col[1]; c.lineWidth = sh.L >= 5 ? 9 : 7; c.lineCap = 'round'; c.beginPath(); c.arc(0, 0, p.R, a - hw, a + hw); c.stroke();
          c.strokeStyle = q.flash > 0 ? '#ffffff' : col[0]; c.lineWidth = sh.L >= 5 ? 5 : 3.5; c.beginPath(); c.arc(0, 0, p.R, a - hw, a + hw); c.stroke();
          const k = q.hp / q.maxhp; c.strokeStyle = 'rgba(255,255,255,' + (0.3 + 0.5 * k) + ')'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, p.R - 7, a - hw * k, a + hw * k); c.stroke();
        });
      } else {
        const a = faceAng(f), hw = p.arc, gr = c.createRadialGradient(0, 0, 10, 0, 0, p.R + 6); gr.addColorStop(0, 'rgba(160,220,255,0)'); gr.addColorStop(1, mir ? 'rgba(235,245,255,.45)' : sh.emax ? 'rgba(255,226,122,.4)' : 'rgba(110,190,255,.4)');
        c.fillStyle = gr; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, p.R + 6, a - hw, a + hw); c.closePath(); c.fill();
        c.lineCap = 'round'; c.strokeStyle = sh.flash > 0 ? '#ffffff' : col[1]; c.lineWidth = 10; c.beginPath(); c.arc(0, 0, p.R, a - hw, a + hw); c.stroke();
        c.strokeStyle = sh.flash > 0 ? '#ffffff' : col[0]; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, p.R, a - hw, a + hw); c.stroke();
        if (mir) { c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2; for (let k = 0; k < 3; k++) { const aa = a - hw + ((time * 1.2 + k / 3) % 1) * 2 * hw; c.beginPath(); c.moveTo(Math.cos(aa) * (p.R - 5), Math.sin(aa) * (p.R - 5)); c.lineTo(Math.cos(aa + 0.18) * (p.R + 4), Math.sin(aa + 0.18) * (p.R + 4)); c.stroke(); } }
        const k = sh.hp / sh.maxhp; c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, p.R - 9, a - hw * k, a + hw * k); c.stroke();
      }
      // jauge d'énergie (niveaux 4 et 5) et temps restant
      if (sh.emax) { const k = sh.energy / sh.emax; c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 30, 0, PI2); c.stroke(); c.strokeStyle = k >= 1 ? '#ffffff' : '#ffd24a'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 30, -Math.PI / 2, -Math.PI / 2 + PI2 * k); c.stroke(); }
      c.globalAlpha = 1; c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(-16, 34, 32, 5); c.fillStyle = rem < 2 ? '#ff8a6a' : '#9ad8ff'; c.fillRect(-15, 35, 30 * (rem / DUR), 3);
      c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.7)'; c.fillStyle = '#ffffff'; c.strokeText(rem.toFixed(1) + ' s', 0, 52); c.fillText(rem.toFixed(1) + ' s', 0, 52);
      c.restore();
    }
    if (g.shw) for (const w of g.shw) { const u = w.t / 0.6; c.strokeStyle = 'rgba(255,230,140,' + (1 - u) + ')'; c.lineWidth = 12 * (1 - u) + 2; c.beginPath(); c.arc(w.x, w.y, w.R * u, 0, PI2); c.stroke(); }
  };
  const u1 = WB.updateHands, d1 = WB.drawHands;
  WB.updateHands = function (dt) { u1(dt); WB.updateShields(dt); };
  WB.drawHands = function (ctx, g, time) { d1(ctx, g, time); WB.drawShields(ctx, g, time); };
})(window.WB);
WB.GUIDE.shield = ['Pomme verte', 'Bouclier de 10 s, jamais invincible. Recharge de 5 s après sa disparition.', ['Bouclier frontal : bloque ce qui vient de face, pas le dos ni les côtés.', 'Panneaux rotatifs : chacun bloque un impact.', 'Bouclier miroir : renvoie les projectiles à leur lanceur (parade ×2 dans les 0,4 premières secondes).', 'Absorbe les attaques dans une jauge, puis libère une explosion qui repousse et blesse.', 'Panneaux tout autour : blocage, renvoi, absorption et grande explosion. En équipe : couvre aussi les coéquipiers dans la zone.']];
