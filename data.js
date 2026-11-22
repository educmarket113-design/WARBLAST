'use strict';
window.WB = window.WB || {};
(function (WB) {
  WB.COLORS = ['#ff8fb8', '#ff5a5a', '#ff9a3c', '#ffd84a', '#a8e55a', '#3fd16b', '#2fd0c0', '#5ab8ff', '#4a74ff', '#8f66ff', '#c874ff', '#ff6bd6', '#b0825a', '#e9ecf4', '#555b78'];
  WB.COLOR_NAMES = ['Rose', 'Rouge', 'Orange', 'Jaune', 'Citron', 'Vert', 'Turquoise', 'Ciel', 'Bleu', 'Violet', 'Lilas', 'Fuchsia', 'Caramel', 'Neige', 'Ardoise'];

  WB.CHARS = [
    { name: 'Pouf', feat: 'none' }, { name: 'Miaou', feat: 'cat' }, { name: 'Lapi', feat: 'bunny' },
    { name: 'Cornu', feat: 'horn' }, { name: 'Antenno', feat: 'antenna' }, { name: 'Touffe', feat: 'tuft' },
    { name: 'Nageo', feat: 'fin' }, { name: 'Feuillu', feat: 'leaf' }, { name: 'Ourson', feat: 'bear' },
    { name: 'Zigzag', feat: 'zig' }
  ];

  WB.EQUIP = {
    cape: [
      { id: 'none', name: 'Aucune', price: 0 },
      { id: 'c_red', name: 'Cape rouge', c: '#e0405a', price: 0 },
      { id: 'c_blue', name: 'Cape bleue', c: '#3d74e0', price: 40 },
      { id: 'c_green', name: 'Cape verte', c: '#38b45c', price: 40 },
      { id: 'c_purple', name: 'Cape violette', c: '#8a4fd8', price: 80 },
      { id: 'c_gold', name: 'Cape dorée', c: '#e8b93a', price: 150 }
    ],
    armor: [
      { id: 'none', name: 'Aucune', price: 0 },
      { id: 'a_leather', name: 'Cuir', c: '#a8743c', price: 0 },
      { id: 'a_iron', name: 'Fer', c: '#9aa6bb', price: 50 },
      { id: 'a_gold', name: 'Or', c: '#e8b93a', price: 120 },
      { id: 'a_shadow', name: 'Ombre', c: '#3b3a52', price: 90 },
      { id: 'a_ice', name: 'Glace', c: '#8fdcff', price: 90 }
    ],
    hat: [
      { id: 'none', name: 'Aucun', price: 0 },
      { id: 'h_cap', name: 'Casquette', style: 'cap', c: '#e0405a', price: 0 },
      { id: 'h_party', name: 'Fête', style: 'party', c: '#ff6bd6', price: 20 },
      { id: 'h_pirate', name: 'Pirate', style: 'pirate', c: '#2a2a36', price: 50 },
      { id: 'h_helmet', name: 'Casque', style: 'helmet', c: '#9aa6bb', price: 60 },
      { id: 'h_wizard', name: 'Sorcier', style: 'wizard', c: '#6a43c8', price: 80 },
      { id: 'h_viking', name: 'Viking', style: 'viking', c: '#b0825a', price: 100 },
      { id: 'h_crown', name: 'Couronne', style: 'crown', c: '#ffd24a', price: 200 }
    ],
    scarf: [
      { id: 'none', name: 'Aucune', price: 0 },
      { id: 's_red', name: 'Écharpe rouge', c: '#e0405a', price: 0 },
      { id: 's_blue', name: 'Écharpe bleue', c: '#3d74e0', price: 30 },
      { id: 's_stripe', name: 'Rayée', c: '#ffffff', c2: '#e0405a', style: 'stripe', price: 50 },
      { id: 's_green', name: 'Écharpe verte', c: '#38b45c', price: 30 },
      { id: 's_gold', name: 'Écharpe dorée', c: '#e8b93a', price: 90 }
    ],
    shoes: [
      { id: 'none', name: 'Aucune', price: 0 },
      { id: 'b_red', name: 'Souliers rouges', c: '#e0405a', style: 'boot', price: 0 },
      { id: 'b_blue', name: 'Souliers bleus', c: '#3d74e0', style: 'boot', price: 30 },
      { id: 'b_white', name: 'Baskets', c: '#f2f4fa', style: 'sneaker', price: 40 },
      { id: 'b_boot', name: 'Bottes', c: '#7a5230', style: 'tall', price: 60 },
      { id: 'b_gold', name: 'Bottes dorées', c: '#e8b93a', style: 'tall', price: 130 }
    ]
  };
  WB.EQUIP_LABELS = { cape: 'Cape', armor: 'Armure', hat: 'Chapeau', scarf: 'Écharpe', shoes: 'Chaussures' };
  WB.equip = function (kind, id) {
    const l = WB.EQUIP[kind];
    for (const i of l) if (i.id === id) return i.id === 'none' ? null : i;
    return null;
  };

  WB.ARENAS = [
    { id: 'donjon', name: 'Donjon', desc: 'Labyrinthe de pierre, torches et pièges', col: '#4a4f66' },
    { id: 'urban', name: 'Ville', desc: 'Maisons, cabanes, arbres et ruelles', col: '#b9b3a3' },
    { id: 'nature', name: 'Nature', desc: 'Forêt, collines, barrières et lacs', col: '#63b043' }
  ];
  WB.MODES = [
    { id: 'solo', name: 'Chacun pour soi', desc: '10 combattants, aucune équipe', teams: 0, size: 1, total: 10 },
    { id: 't5', name: '2 équipes de 5', desc: '5 contre 5', teams: 2, size: 5, total: 10 },
    { id: 't3', name: '3 équipes de 3', desc: 'Trois équipes de 3', teams: 3, size: 3, total: 9 }
  ];
  WB.TEAM_COLORS = ['#4fb4ff', '#ff5a5a', '#5adf7a'];
  WB.TEAM_NAMES = ['Bleus', 'Rouges', 'Verts'];

  WB.MAXLV = 10;
  // niveau de départ des capacités ramassées : monte avec le niveau du profil (1 à 3 : niv 1, 4 à 6 : niv 2, 7 à 9 : niv 3, 10 : niv 4)
  WB.startLv = function (f) { return (f.kind === 'player' || f.kind === 'bot') ? 1 + Math.floor(((f.level || 1) - 1) / 3) : 1; };
  // progression d'une capacité de 0 à 1 (niveau + éliminations vers le niveau suivant)
  WB.abilProgress = function (ab) { if (ab.lvl >= 5) return 1; const a = WB.abilXp[ab.lvl - 1], b = WB.abilXp[ab.lvl]; return Math.min(1, (ab.lvl - 1 + Math.max(0, Math.min(1, (ab.kills - a) / (b - a)))) / 4); };
  WB.slotCount = function (lv) { return Math.min(lv, 6); };
  WB.chainMax = function (lv) { return lv >= 7 ? lv - 5 : 1; };
  WB.xpNeed = function (lv) { return 100 * lv; };
  WB.trophyCost = function (lv) { return 4 * lv; };
  WB.abilXp = [0, 3, 7, 12, 18]; // kills needed for ability level 1..5

  WB.defaultSpec = function () { return { char: 0, color: 0, cape: 'none', armor: 'none', hat: 'none', scarf: 'none', shoes: 'none' }; };

  WB.NAMES = ['Zéphyr', 'Nuage', 'Bombo', 'Pixel', 'Choco', 'Ninja', 'Gigi', 'Rocky', 'Fanfan', 'Tikou', 'Lolo', 'Mimosa', 'Bouboule', 'Kiwi', 'Pépito', 'Toto', 'Lune', 'Flash'];
})(window.WB);
