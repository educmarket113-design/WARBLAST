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
