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
