'use strict';
(function (WB) {
  // Apparence liée aux capacités : fruits au sol, coffres, objet en main, aura et traînée de particules.
  const PI2 = Math.PI * 2, A = () => WB.ABIL;
  const rnd = (a, b) => a + Math.random() * (b - a);

  function ball(c, x, y, r, c1, c2, line) {
    const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); g.addColorStop(0, c1); g.addColorStop(1, c2);
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, PI2); c.fill(); c.lineWidth = 1.6; c.strokeStyle = line || 'rgba(0,0,0,.45)'; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(x - r * 0.35, y - r * 0.4, r * 0.22, r * 0.14, -0.6, 0, PI2); c.fill();
  }
  function leaf(c, x, y, a, len, col) {
    c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = col || '#4cc24a'; c.strokeStyle = 'rgba(0,40,0,.5)'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.5, -len * 0.45, len, 0); c.quadraticCurveTo(len * 0.5, len * 0.45, 0, 0); c.fill(); c.stroke(); c.restore();
  }
  function stem(c, x1, y1, x2, y2, col) { c.strokeStyle = col || '#6b4a1e'; c.lineWidth = 2.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }

  // 17 fruits, chacun différent. Dessinés dans un carré d'environ 30 x 30.
  const FRUIT = {
    ice: function (c) { // myrtilles givrées
      for (const q of [[-7, 4, 7], [7, 4, 7], [0, -6, 7.5]]) { ball(c, q[0], q[1], q[2], '#8fb4ff', '#2c4fc8'); c.fillStyle = '#16296f'; c.beginPath(); c.arc(q[0], q[1] - q[2] * 0.15, 1.8, 0, PI2); c.fill(); }
      c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(9, -12); c.lineTo(9, -6); c.moveTo(6, -9); c.lineTo(12, -9); c.stroke();
    },
    fire: function (c) { // piment
      c.fillStyle = '#e02a1a'; c.strokeStyle = 'rgba(70,0,0,.6)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-9, -6); c.bezierCurveTo(-2, -12, 8, -6, 12, 8); c.bezierCurveTo(13, 13, 6, 12, 3, 8); c.bezierCurveTo(-2, 1, -9, 2, -9, -6); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(-2, -6, 4, 1.6, 0.4, 0, PI2); c.fill();
      c.fillStyle = '#3aa63a'; c.beginPath(); c.moveTo(-10, -7); c.lineTo(-14, -12); c.lineTo(-7, -10); c.lineTo(-4, -13); c.lineTo(-5, -7); c.closePath(); c.fill(); c.stroke();
    },
    hole: function (c) { // prune noire
      ball(c, 0, 1, 13, '#7a4ac0', '#1a0830'); c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, -12); c.quadraticCurveTo(-3, 0, 0, 13); c.stroke();
      stem(c, 0, -12, 2, -17); leaf(c, 2, -15, -0.5, 9);
    },
    wall: function (c) { // noix de coco
      ball(c, 0, 1, 13, '#a07040', '#4a2c14'); c.fillStyle = '#1e1008'; for (const q of [[-4, -3], [4, -3], [0, 3]]) { c.beginPath(); c.arc(q[0], q[1], 2.1, 0, PI2); c.fill(); }
      c.strokeStyle = 'rgba(40,20,5,.5)'; c.lineWidth = 1; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 4, -11); c.lineTo(i * 4.5, 12); c.stroke(); }
    },
    shield: function (c) { // pomme verte
      ball(c, 0, 2, 12.5, '#c6f56a', '#3f9a2a'); stem(c, 0, -9, 1, -15); leaf(c, 1, -13, -0.4, 10); c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.arc(0, -9, 3, 0, PI2); c.fill();
    },
    tp: function (c) { // fruit du dragon
      c.fillStyle = '#e83a9a'; c.strokeStyle = 'rgba(80,0,40,.6)'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(0, 1, 11, 13, 0, 0, PI2); c.fill(); c.stroke();
      c.fillStyle = '#4cd05a'; for (const q of [[-11, -4, -2.4], [11, -4, 2.4], [-10, 6, -2.8], [10, 6, 2.8], [0, -13, 0], [-6, 12, -3.3], [6, 12, 3.3]]) { c.save(); c.translate(q[0], q[1]); c.rotate(q[2]); c.beginPath(); c.moveTo(-3, 0); c.lineTo(0, -7); c.lineTo(3, 0); c.closePath(); c.fill(); c.restore(); }
      c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(-4, -4, 3, 5, -0.4, 0, PI2); c.fill();
    },
    dash: function (c) { // banane
      c.fillStyle = '#ffd93a'; c.strokeStyle = 'rgba(90,60,0,.65)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-12, -9); c.bezierCurveTo(-8, 10, 6, 14, 14, 2); c.bezierCurveTo(7, 7, -3, 4, -6, -10); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#6b4a1e'; c.fillRect(-12, -13, 6, 5); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(-3, 3, 5, 1.4, 0.5, 0, PI2); c.fill();
    },
    water: function (c) { // pastèque
      ball(c, 0, 1, 13, '#58c24a', '#1f6a28'); c.strokeStyle = '#1b5a22'; c.lineWidth = 2; for (const k of [-6, 0, 6]) { c.beginPath(); c.moveTo(k * 0.5, -12); c.quadraticCurveTo(k * 1.7, 0, k * 0.5, 13); c.stroke(); }
      c.fillStyle = '#ff5a6a'; c.beginPath(); c.arc(9, -9, 4.5, 0, PI2); c.fill(); c.fillStyle = '#220'; c.beginPath(); c.arc(8, -9, 0.9, 0, PI2); c.arc(10, -8, 0.9, 0, PI2); c.fill();
    },
    wind: function (c) { // poire
      c.fillStyle = '#d6ec5a'; c.strokeStyle = 'rgba(60,70,0,.6)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, -12); c.bezierCurveTo(6, -10, 5, -2, 11, 5); c.bezierCurveTo(14, 15, -14, 15, -11, 5); c.bezierCurveTo(-5, -2, -6, -10, 0, -12); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(-4, 5, 2.5, 5, 0.3, 0, PI2); c.fill(); stem(c, 0, -12, 2, -16); leaf(c, 2, -15, -0.3, 8);
    },
    scythe: function (c) { // ananas
      c.fillStyle = '#f0a020'; c.strokeStyle = 'rgba(80,40,0,.65)'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(0, 4, 10, 12, 0, 0, PI2); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(120,60,0,.7)'; c.lineWidth = 1; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 4 - 6, -6); c.lineTo(i * 4 + 6, 14); c.moveTo(i * 4 + 6, -6); c.lineTo(i * 4 - 6, 14); c.stroke(); }
      c.fillStyle = '#3fa63a'; for (const a of [-0.8, -0.3, 0.2, 0.7]) { c.save(); c.translate(0, -7); c.rotate(a); c.beginPath(); c.moveTo(-2.5, 0); c.lineTo(0, -12); c.lineTo(2.5, 0); c.closePath(); c.fill(); c.stroke(); c.restore(); }
    },
    invis: function (c) { // raisin blanc fantôme
      c.globalAlpha *= 0.85; for (const q of [[-6, -4], [6, -4], [0, -4], [-3, 3], [4, 3], [0, 10]]) ball(c, q[0], q[1], 5.2, '#fbfdff', '#9fb0e0', 'rgba(60,70,130,.5)');
      stem(c, 0, -9, 2, -15, '#7a8a5a'); leaf(c, 2, -14, -0.5, 8, '#9ad08a');
    },
    spider: function (c) { // aubergine
      c.fillStyle = '#6a2a98'; c.strokeStyle = 'rgba(30,0,50,.7)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-3, -8); c.bezierCurveTo(-14, -4, -14, 14, -2, 13); c.bezierCurveTo(10, 14, 12, 2, 4, -8); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(-5, 3, 2.3, 6, 0.2, 0, PI2); c.fill();
      c.fillStyle = '#3aa63a'; c.beginPath(); c.moveTo(-5, -8); c.lineTo(-8, -12); c.lineTo(-2, -10); c.lineTo(1, -14); c.lineTo(3, -9); c.lineTo(6, -11); c.lineTo(5, -7); c.closePath(); c.fill(); c.stroke();
    },
    clown: function (c) { // orange
      ball(c, 0, 2, 12.5, '#ffb040', '#e8660a'); c.fillStyle = 'rgba(255,255,255,.25)'; for (const q of [[-4, 0], [4, 5], [-2, 8], [5, -3]]) { c.beginPath(); c.arc(q[0], q[1], 1.1, 0, PI2); c.fill(); }
      leaf(c, 0, -10, -0.6, 10); leaf(c, 0, -10, -2.5, 8, '#3aa63a');
    },
    necro: function (c) { // durian piquant
      c.fillStyle = '#8c9a3a'; c.strokeStyle = 'rgba(30,40,0,.7)'; c.lineWidth = 1.4; c.beginPath(); c.ellipse(0, 2, 12, 12.5, 0, 0, PI2); c.fill(); c.stroke();
      c.fillStyle = '#5c6a22'; for (let i = 0; i < 10; i++) { const a = i / 10 * PI2; c.save(); c.translate(Math.cos(a) * 11, 2 + Math.sin(a) * 11.5); c.rotate(a + Math.PI / 2); c.beginPath(); c.moveTo(-3, 0); c.lineTo(0, -6); c.lineTo(3, 0); c.closePath(); c.fill(); c.restore(); }
      c.fillStyle = '#c4d060'; for (const q of [[-4, -2], [4, -3], [0, 4], [-5, 6], [5, 5]]) { c.beginPath(); c.moveTo(q[0] - 2.5, q[1] + 2); c.lineTo(q[0], q[1] - 3); c.lineTo(q[0] + 2.5, q[1] + 2); c.closePath(); c.fill(); }
      c.fillStyle = '#0a1c0a'; c.beginPath(); c.arc(-3.5, 1, 1.8, 0, PI2); c.arc(3.5, 1, 1.8, 0, PI2); c.fill();
    },
    turret: function (c) { // cerises
      stem(c, -6, 7, 0, -12, '#4a7a2a'); stem(c, 7, 7, 0, -12, '#4a7a2a'); leaf(c, 0, -12, -0.4, 10);
      ball(c, -7, 8, 6.5, '#ff5a6a', '#a8101e'); ball(c, 8, 8, 6.5, '#ff5a6a', '#a8101e');
    },
    jump: function (c) { // pêche
      ball(c, 0, 2, 12.5, '#ffc0a0', '#ec6a5a'); c.strokeStyle = 'rgba(160,50,40,.55)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -9); c.quadraticCurveTo(-4, 2, 0, 14); c.stroke();
      leaf(c, 0, -10, -0.5, 10); leaf(c, 0, -10, -2.6, 8, '#3aa63a');
    },
    bolt: function (c) { // carambole étoilée
      c.fillStyle = '#ffe94a'; c.strokeStyle = 'rgba(110,80,0,.7)'; c.lineWidth = 1.6; c.beginPath();
      for (let i = 0; i < 10; i++) { const r = i % 2 ? 6.5 : 14, a = -Math.PI / 2 + i * Math.PI / 5; c.lineTo(Math.cos(a) * r, 1 + Math.sin(a) * r); } c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = '#fff6a0'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(1, -5); c.lineTo(-2, 1); c.lineTo(2, 1); c.lineTo(-1, 7); c.stroke();
    },
    glut: function (c) { // figue rose avec bouche
      ball(c, 0, 3, 12.5, '#e89ad0', '#8a2a78'); c.fillStyle = '#3a0a2a'; c.beginPath(); c.ellipse(0, 6, 6, 4, 0, 0, PI2); c.fill(); c.fillStyle = '#ff6a9a'; c.beginPath(); c.ellipse(0, 8, 3.5, 2, 0, 0, PI2); c.fill();
      stem(c, 0, -9, 1, -14); leaf(c, 1, -13, -0.4, 8);
    },
    summon: function (c) { // grenade ouverte
      ball(c, 0, 3, 12.5, '#ff6a5a', '#a01830'); c.fillStyle = '#e0b020'; c.beginPath(); c.moveTo(-6, -8); c.lineTo(-3, -13); c.lineTo(0, -9); c.lineTo(3, -13); c.lineTo(6, -8); c.closePath(); c.fill();
      c.fillStyle = '#ffd0d8'; for (const p of [[-4, 2], [3, 0], [0, 7], [5, 7], [-5, 8]]) { c.beginPath(); c.arc(p[0], p[1], 2, 0, PI2); c.fill(); }
    },
    cancel: function (c) { // kiwi coupé
      ball(c, 0, 2, 13, '#8ad04a', '#4a8a1a'); c.fillStyle = '#e8ffc0'; c.beginPath(); c.arc(0, 2, 3.5, 0, PI2); c.fill();
      c.fillStyle = '#1a1a1a'; for (let i = 0; i < 10; i++) { const a = i * PI2 / 10; c.beginPath(); c.arc(Math.cos(a) * 7, 2 + Math.sin(a) * 7, 1.1, 0, PI2); c.fill(); }
    },
    mystery: function (c, t) { // fruit surprise : pomme arc-en-ciel
      const g = c.createLinearGradient(-12, -12, 12, 14); const h = (t * 90) % 360;
      g.addColorStop(0, 'hsl(' + h + ',90%,65%)'); g.addColorStop(0.5, 'hsl(' + (h + 120) + ',90%,60%)'); g.addColorStop(1, 'hsl(' + (h + 240) + ',90%,55%)');
      c.fillStyle = g; c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 1.6; c.beginPath(); c.arc(0, 3, 12.5, 0, PI2); c.fill(); c.stroke();
      stem(c, 0, -9, 1, -14); leaf(c, 1, -13, -0.4, 9);
    }
  };
  WB.FRUITS = Object.keys(FRUIT);

  // x,y : centre ; s : taille approximative en pixels
  WB.drawFruit = function (c, id, x, y, s, t) {
    const f = FRUIT[id] || FRUIT.mystery; c.save(); c.translate(x, y); c.scale(s / 30, s / 30); c.lineJoin = 'round'; f(c, t || 0); c.restore();
  };
  // fruit posé au sol, avec halo de la couleur de la capacité
  WB.drawFruitPickup = function (c, p, time) {
    const bob = Math.sin(p.t * 3 + p.x) * 3, pop = p.pop ? Math.min(1, p.t * 3) : 1, sc = 0.25 + 0.75 * (1 - Math.pow(1 - pop, 3));
    const mys = !!p.mystery, col = mys ? 'hsl(' + ((time * 90) % 360) + ',90%,65%)' : A()[p.id].col;
    c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(p.x, p.y + 20, 14 * sc, 4.5 * sc, 0, 0, PI2); c.fill();
    c.save(); c.translate(p.x, p.y - 4 + bob); c.scale(sc, sc);
    const gl = c.createRadialGradient(0, 0, 4, 0, 0, 30); gl.addColorStop(0, col); gl.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = 0.28 + 0.12 * Math.sin(time * 4 + p.x); c.fillStyle = gl; c.beginPath(); c.arc(0, 0, 30, 0, PI2); c.fill(); c.globalAlpha = 1;
    WB.drawFruit(c, mys ? 'mystery' : p.id, 0, 0, 34, time);
    if (mys) { c.font = 'bold 20px "Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 4; c.strokeStyle = '#2a1050'; c.strokeText('?', 0, -26 + Math.sin(time * 5) * 3); c.fillStyle = '#ffe94a'; c.fillText('?', 0, -26 + Math.sin(time * 5) * 3); }
    else if (p.lvl > 1) { for (let k = 0; k < p.lvl; k++) { c.fillStyle = '#ffd24a'; c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 1; c.beginPath(); c.arc((k - (p.lvl - 1) / 2) * 7, 19, 2.8, 0, PI2); c.fill(); c.stroke(); } }
    c.restore();
  };

  WB.drawChest = function (c, p, time) {
    const x = p.x, y = p.y, wob = Math.sin(time * 3 + p.x) * 0.04;
    c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x, y + 20, 26, 7, 0, 0, PI2); c.fill();
    c.save(); c.translate(x, y + 4); c.rotate(wob);
    const gl = c.createRadialGradient(0, -6, 4, 0, -6, 44); gl.addColorStop(0, 'rgba(255,220,90,.5)'); gl.addColorStop(1, 'rgba(255,220,90,0)'); c.fillStyle = gl; c.beginPath(); c.arc(0, -6, 44, 0, PI2); c.fill();
    c.lineJoin = 'round'; c.strokeStyle = '#2a1608'; c.lineWidth = 2.4;
    c.fillStyle = '#8a5424'; U(c, -22, -4, 44, 20, 3); c.fill(); c.stroke();
    c.fillStyle = '#a8692e'; c.beginPath(); c.moveTo(-22, -4); c.quadraticCurveTo(-22, -20, 0, -20); c.quadraticCurveTo(22, -20, 22, -4); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#e8b830'; c.fillRect(-4, -20, 8, 36); c.strokeRect(-4, -20, 8, 36); c.fillRect(-22, -6, 44, 4);
    c.fillStyle = '#fff3a0'; c.beginPath(); c.arc(0, 2, 3.2, 0, PI2); c.fill(); c.stroke();
    const tw = (Math.sin(time * 6 + p.x) + 1) / 2; c.fillStyle = 'rgba(255,255,220,' + (0.4 + 0.6 * tw) + ')'; c.beginPath(); c.moveTo(14, -24); c.lineTo(16, -20); c.lineTo(20, -18); c.lineTo(16, -16); c.lineTo(14, -12); c.lineTo(12, -16); c.lineTo(8, -18); c.lineTo(12, -20); c.closePath(); c.fill();
    c.restore();
  };
  function U(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

  // ---------- objet tenu en main ----------
  WB.heldOf = function (f) {
    let best = null; for (const s of f.slots) if (s && (!best || s.lvl > best.lvl)) best = s;
    for (const s of f.slots) if (s && (s.id === 'scythe' || s.id === 'necro')) return s;
    return best;
  };
  WB.drawHeld = function (c, ab, hx, hy, dir, time, swing) {
    const id = ab.id, col = A()[id].col; c.save(); c.translate(hx, hy); c.scale(dir, 1); c.lineCap = 'round'; c.lineJoin = 'round';
    if (id === 'scythe') { // fourche du diable
      const L = ab.lvl, sc = L >= 5 ? 1.5 : L >= 3 ? 1.25 : 0.95, two = L === 2 || L === 4;
      for (let k = 0; k < (two ? 2 : 1); k++) { c.save(); c.rotate(two ? (k ? 0.55 : -0.55) : -0.3); WB.drawFork(c, 0, 0, -Math.PI / 2, 40 * sc, sc, time, L >= 5); c.restore(); }
    } else if (id === 'necro') { // petite lance
      c.rotate(-0.9); c.strokeStyle = '#4a3a2a'; c.lineWidth = 3; c.beginPath(); c.moveTo(-6, 12); c.lineTo(0, -16); c.stroke();
      c.shadowColor = col; c.shadowBlur = 8; c.fillStyle = '#9af0c8'; c.strokeStyle = '#1a4a30'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, -16); c.lineTo(5, -10); c.lineTo(0, -28); c.lineTo(-5, -10); c.closePath(); c.fill(); c.stroke(); c.shadowBlur = 0;
    } else if (id === 'fire') { // flamme dans la paume
      const k = 0.8 + 0.2 * Math.sin(time * 14); c.fillStyle = '#ff7a1c'; c.beginPath(); c.moveTo(0, 4); c.quadraticCurveTo(-8, -4, 0, -16 * k); c.quadraticCurveTo(8, -4, 0, 4); c.fill(); c.fillStyle = '#ffe27a'; c.beginPath(); c.moveTo(0, 3); c.quadraticCurveTo(-4, -2, 0, -8 * k); c.quadraticCurveTo(4, -2, 0, 3); c.fill();
    } else if (id === 'ice') { c.fillStyle = '#bfeaff'; c.strokeStyle = '#4a9ad8'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, -16); c.lineTo(6, -2); c.lineTo(0, 6); c.lineTo(-6, -2); c.closePath(); c.fill(); c.stroke();
    } else if (id === 'bolt') { c.strokeStyle = '#ffe94a'; c.shadowColor = '#ffe94a'; c.shadowBlur = 8; c.lineWidth = 3; c.beginPath(); c.moveTo(3, -16); c.lineTo(-3, -5); c.lineTo(3, -5); c.lineTo(-2, 6); c.stroke(); c.shadowBlur = 0;
    } else { c.globalAlpha = 0.95; c.shadowColor = col; c.shadowBlur = 8; WB.drawIcon(c, id, 0, -6, 20); c.shadowBlur = 0; }
    c.restore();
  };

  // ---------- particules d'aura ----------
  const TR = {
    fire: { cols: ['#ffe27a', '#ff9a2a', '#ff4a1c'], rate: 24, mk(p) { p.vx = rnd(-18, 18); p.vy = rnd(-120, -60); p.r = rnd(3, 6.5); p.life = rnd(0.35, 0.7); p.g = -20; p.add = true; } },
    ice: { cols: ['#ffffff', '#bfeaff', '#8fd0ff'], rate: 14, mk(p) { p.vx = rnd(-22, 22); p.vy = rnd(-10, 26); p.r = rnd(2.5, 4.5); p.life = rnd(0.7, 1.1); p.shape = 'flake'; } },
    hole: { cols: ['#8a4ad8', '#2a0a50', '#c08aff'], rate: 20, mk(p, f) { const a = rnd(0, PI2), d = rnd(26, 40); p.x = f.x + Math.cos(a) * d; p.y = f.y + 4 + Math.sin(a) * d * 0.7; p.vx = -Math.cos(a) * 60 - Math.sin(a) * 40; p.vy = -Math.sin(a) * 45 + Math.cos(a) * 30; p.r = rnd(2.5, 4.5); p.life = rnd(0.4, 0.65); } },
    wall: { cols: ['#b8a48a', '#8a7a64', '#d8c8a8'], rate: 14, mk(p) { p.vx = rnd(-30, 30); p.vy = rnd(-50, -10); p.r = rnd(2.5, 5); p.life = rnd(0.45, 0.8); p.g = 260; p.shape = 'rock'; } },
    shield: { cols: ['#bfe8ff', '#ffffff', '#7ac8ff'], rate: 12, mk(p, f) { const a = rnd(0, PI2); p.x = f.x + Math.cos(a) * 30; p.y = f.y + Math.sin(a) * 26; p.vx = Math.cos(a) * 8; p.vy = Math.sin(a) * 8 - 8; p.r = rnd(2, 3.6); p.life = rnd(0.4, 0.7); p.shape = 'star'; } },
    tp: { cols: ['#e8b8ff', '#ffffff', '#b070ff'], rate: 18, mk(p) { p.vx = rnd(-14, 14); p.vy = rnd(-22, 6); p.r = rnd(3, 5.5); p.life = rnd(0.45, 0.8); p.shape = 'star'; p.spin = true; } },
    dash: { cols: ['#ffe27a', '#ffffff', '#ffc040'], rate: 26, mk(p, f) { const sp = Math.hypot(f.vx, f.vy) || 1; p.vx = -f.vx / sp * 90; p.vy = -f.vy / sp * 90; p.r = rnd(8, 15); p.life = rnd(0.2, 0.34); p.shape = 'streak'; p.ang = Math.atan2(f.vy, f.vx); } },
    water: { cols: ['#8fd0ff', '#4aa8f0', '#d8f0ff'], rate: 20, mk(p) { p.vx = rnd(-26, 26); p.vy = rnd(-60, -10); p.r = rnd(2.5, 4.5); p.life = rnd(0.5, 0.8); p.g = 360; p.shape = 'drop'; } },
    wind: { cols: ['#ffffff', '#e0f0ff'], rate: 16, mk(p, f) { p.vx = rnd(-40, 40); p.vy = rnd(-20, 20); p.r = rnd(8, 14); p.life = rnd(0.35, 0.6); p.shape = 'swirl'; p.ang = rnd(0, PI2); } },
    scythe: { cols: ['#9b5cff', '#3a1060', '#c9a0ff'], rate: 12, mk(p) { p.vx = rnd(-12, 12); p.vy = rnd(-34, -14); p.r = rnd(5, 9); p.life = rnd(0.7, 1.1); p.alpha = 0.35; } },
    invis: { cols: ['#e8f0ff', '#b8c8ff'], rate: 12, mk(p) { p.vx = rnd(-10, 10); p.vy = rnd(-30, -10); p.r = rnd(4, 8); p.life = rnd(0.6, 1); p.alpha = 0.3; } },
    spider: { cols: ['#1a1a24', '#444458'], rate: 8, mk(p, f) { p.x = f.x + rnd(-18, 18); p.y = f.y - 24; p.vx = 0; p.vy = rnd(20, 40); p.r = rnd(2.4, 3.4); p.life = rnd(0.5, 0.8); p.shape = 'thread'; } },
    clown: { cols: ['#ff5a6a', '#ffd24a', '#5ac8ff', '#7aff7a', '#d28aff'], rate: 22, mk(p) { p.vx = rnd(-50, 50); p.vy = rnd(-90, -30); p.r = rnd(2.5, 4); p.life = rnd(0.6, 0.95); p.g = 260; p.shape = 'conf'; p.spin = true; } },
    necro: { cols: ['#8affc8', '#2aa06a', '#d0ffe8'], rate: 16, mk(p) { p.vx = rnd(-14, 14); p.vy = rnd(-70, -30); p.r = rnd(3, 6); p.life = rnd(0.6, 1); p.alpha = 0.7; p.shape = 'wisp'; } },
    turret: { cols: ['#ffe27a', '#c0c4d0', '#ff9a2a'], rate: 14, mk(p) { p.vx = rnd(-60, 60); p.vy = rnd(-70, -20); p.r = rnd(1.8, 3.2); p.life = rnd(0.25, 0.45); p.g = 380; p.add = true; } },
    jump: { cols: ['#bfffd8', '#7aff9a', '#ffffff'], rate: 18, mk(p, f) { p.y = f.y + 16; p.vx = rnd(-30, 30); p.vy = rnd(-26, -6); p.r = rnd(3, 6); p.life = rnd(0.4, 0.65); p.alpha = 0.6; p.grow = 1; } },
    glut: { cols: ['#ff8ab0', '#ffd0e4', '#ffffff'], rate: 10, mk(p) { p.vx = rnd(-20, 20); p.vy = rnd(-40, -10); p.r = rnd(3, 5); p.life = rnd(0.5, 0.8); p.shape = 'star'; } },
    summon: { cols: ['#4adcc8', '#bffff4', '#ffffff'], rate: 14, mk(p) { p.vx = rnd(-30, 30); p.vy = rnd(-60, -20); p.r = rnd(2.5, 4.5); p.life = rnd(0.5, 0.8); p.shape = 'star'; p.spin = true; } },
    cancel: { cols: ['#cfd6e8', '#8a94b0', '#ffffff'], rate: 12, mk(p) { p.vx = rnd(-30, 30); p.vy = rnd(-30, 10); p.r = rnd(2.5, 4.5); p.life = rnd(0.4, 0.7); p.alpha = 0.6; } },
    bolt: { cols: ['#fff6a0', '#ffe94a', '#ffffff'], rate: 22, mk(p, f) { const a = rnd(0, PI2), d = rnd(14, 34); p.x = f.x + Math.cos(a) * d; p.y = f.y + Math.sin(a) * d * 0.8; p.vx = 0; p.vy = 0; p.r = rnd(6, 13); p.life = rnd(0.1, 0.2); p.shape = 'zap'; p.ang = rnd(0, PI2); p.add = true; } }
  };
  WB.auraColor = id => A()[id].col;

  WB.updateTrails = function (G, dt) {
    const T = G.trails || (G.trails = []), me = G.player;
    for (const f of G.F) {
      if (!f.alive || !f.slots.length || f.kind === 'minion' && !f.fixed) { if (!f.alive || !f.slots.length) continue; }
      if (me && Math.hypot(f.x - me.x, f.y - me.y) > 900) continue;
      const mv = Math.hypot(f.vx, f.vy) > 40, held = f.slots.filter(Boolean).sort((a, b) => b.lvl - a.lvl).slice(0, 3);
      for (const ab of held) {
        const d = TR[ab.id]; if (!d) continue;
        let n = d.rate * (mv ? 1 : 0.35) * (0.7 + 0.12 * ab.lvl) * dt / Math.sqrt(held.length); n = Math.floor(n) + (Math.random() < n - Math.floor(n) ? 1 : 0);
        if (ab.id === 'dash' && !mv) n = 0;
        for (let k = 0; k < n && T.length < 650; k++) {
          const p = { x: f.x + rnd(-12, 12) - f.vx * 0.05, y: f.y + rnd(-6, 16), vx: 0, vy: 0, t: 0, life: 0.5, r: 3, col: d.cols[(Math.random() * d.cols.length) | 0], g: 0, shape: 'dot', alpha: 1, id: ab.id };
          d.mk(p, f); T.push(p);
        }
      }
    }
    for (let i = T.length - 1; i >= 0; i--) { const p = T[i]; p.t += dt; if (p.t >= p.life) { T.splice(i, 1); continue; } p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  };

  WB.drawTrails = function (c, G, time) {
    const T = G.trails; if (!T || !T.length) return; const v = G.view;
    for (const p of T) {
      if (v && (p.x < v.x0 - 30 || p.x > v.x0 + v.w + 30 || p.y < v.y0 - 30 || p.y > v.y0 + v.h + 30)) continue;
      const u = p.t / p.life, a = (1 - u) * (p.alpha == null ? 1 : p.alpha), r = p.grow ? p.r * (1 + u) : p.r * (1 - 0.5 * u);
      c.globalAlpha = Math.max(0, a); c.fillStyle = c.strokeStyle = p.col;
      if (p.add) c.globalCompositeOperation = 'lighter';
      switch (p.shape) {
        case 'flake': c.lineWidth = 1.3; c.beginPath(); c.moveTo(p.x - r, p.y); c.lineTo(p.x + r, p.y); c.moveTo(p.x, p.y - r); c.lineTo(p.x, p.y + r); c.moveTo(p.x - r * 0.7, p.y - r * 0.7); c.lineTo(p.x + r * 0.7, p.y + r * 0.7); c.stroke(); break;
        case 'star': { const rr = r * (p.spin ? 0.6 + 0.4 * Math.abs(Math.sin(time * 10 + p.x)) : 1); c.beginPath(); for (let i = 0; i < 8; i++) { const q = i % 2 ? rr * 0.35 : rr * 1.4, an = i * Math.PI / 4; c.lineTo(p.x + Math.cos(an) * q, p.y + Math.sin(an) * q); } c.closePath(); c.fill(); break; }
        case 'rock': c.fillRect(p.x - r, p.y - r, r * 1.8, r * 1.5); break;
        case 'streak': c.lineWidth = 3.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - Math.cos(p.ang) * r * 2, p.y - Math.sin(p.ang) * r * 2); c.stroke(); break;
        case 'drop': c.beginPath(); c.moveTo(p.x, p.y - r * 1.6); c.quadraticCurveTo(p.x + r * 1.3, p.y + r * 0.2, p.x, p.y + r); c.quadraticCurveTo(p.x - r * 1.3, p.y + r * 0.2, p.x, p.y - r * 1.6); c.fill(); break;
        case 'swirl': c.lineWidth = 2; c.lineCap = 'round'; c.beginPath(); c.arc(p.x, p.y, r, p.ang + u * 3, p.ang + u * 3 + 3.2); c.stroke(); break;
        case 'thread': c.lineWidth = 1; c.strokeStyle = 'rgba(240,240,255,.8)'; c.beginPath(); c.moveTo(p.x, p.y - 22); c.lineTo(p.x, p.y); c.stroke(); c.fillStyle = '#15151e'; c.beginPath(); c.arc(p.x, p.y, r, 0, PI2); c.fill(); break;
        case 'conf': c.save(); c.translate(p.x, p.y); c.rotate(time * 9 + p.x); c.fillRect(-r, -r * 0.5, r * 2, r); c.restore(); break;
        case 'wisp': c.beginPath(); c.ellipse(p.x, p.y, r * 0.7, r * 1.5, 0, 0, PI2); c.fill(); break;
        case 'zap': c.lineWidth = 2; c.lineJoin = 'round'; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + Math.cos(p.ang) * r * 0.5 + 3, p.y + Math.sin(p.ang) * r * 0.5 - 3); c.lineTo(p.x + Math.cos(p.ang) * r - 2, p.y + Math.sin(p.ang) * r + 2); c.lineTo(p.x + Math.cos(p.ang) * r * 1.4, p.y + Math.sin(p.ang) * r * 1.4); c.stroke(); break;
        default: c.beginPath(); c.arc(p.x, p.y, Math.max(0.5, r), 0, PI2); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
    }
    c.globalAlpha = 1;
  };

  // halo coloré sous le personnage et étincelles qui tournent autour de lui
  WB.drawAura = function (c, f, time) {
    const held = f.slots.filter(Boolean).sort((a, b) => b.lvl - a.lvl).slice(0, 2); if (!held.length) return;
    held.forEach(function (ab, k) {
      const col = A()[ab.id].col, g = c.createRadialGradient(f.x, f.y + 4, 6, f.x, f.y + 4, 36 + ab.lvl * 3);
      g.addColorStop(0, col + '55'); g.addColorStop(1, col + '00'); c.fillStyle = g; c.beginPath(); c.arc(f.x, f.y + 4, 36 + ab.lvl * 3, 0, PI2); c.fill();
    });
  };
  WB.drawAuraFront = function (c, f, time) {
    const held = f.slots.filter(Boolean).sort((a, b) => b.lvl - a.lvl).slice(0, 2); if (!held.length) return;
    c.save();
    held.forEach(function (ab, k) {
      const col = A()[ab.id].col, n = 2 + Math.min(3, ab.lvl);
      for (let i = 0; i < n; i++) {
        const a = time * (1.6 + k * 0.5) + i * PI2 / n + k, x = f.x + Math.cos(a) * 28, y = f.y + 2 + Math.sin(a) * 18;
        c.fillStyle = col; c.globalAlpha = 0.85; c.shadowColor = col; c.shadowBlur = 8; c.beginPath(); c.arc(x, y, 2.4, 0, PI2); c.fill();
      }
    });
    c.restore();
  };
  // animation « manger le fruit »
  WB.drawEat = function (c, f, time, dirx) {
    const e = f.eat; if (!e) return 1; const u = e.t / e.dur, sz = 26 * (1 - 0.85 * u), by = f.y - 4 - 6 * Math.sin(u * Math.PI);
    if (u < 0.95) { c.save(); c.translate(0, 0); WB.drawFruit(c, e.id, f.x + dirx * 18, by, sz, time); c.restore(); }
    return 1 + 0.09 * Math.sin(u * 18) * (1 - u);
  };

  // ---------- invocation, voleur ----------
  WB.drawShark = function (c, x, y, t) {
    c.save(); c.translate(x, y);
    const pu = Math.min(1, t / 0.35), fade = t > 1.3 ? Math.max(0, 1 - (t - 1.3) / 0.3) : 1;
    c.globalAlpha = fade; c.fillStyle = 'rgba(30,110,190,.75)'; c.strokeStyle = 'rgba(190,235,255,.9)'; c.lineWidth = 3;
    c.beginPath(); c.ellipse(0, 6, 58 * pu, 30 * pu, 0, 0, PI2); c.fill(); c.stroke();
    const rise = t < 0.3 ? 0 : t < 0.55 ? (t - 0.3) / 0.25 : t < 1.15 ? 1 : Math.max(0, 1 - (t - 1.15) / 0.2), open = t < 0.55 ? 1 : t < 0.7 ? 1 - (t - 0.55) / 0.15 : 0.12;
    if (rise > 0) {
      const h = 64 * rise; c.translate(0, 6 - h * 0.35);
      c.fillStyle = '#6a8aa8'; c.strokeStyle = '#223a52'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(-34, 14); c.quadraticCurveTo(-36, -h * 0.9, 0, -h); c.quadraticCurveTo(36, -h * 0.9, 34, 14); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#d8ecf8'; c.beginPath(); c.ellipse(0, 4, 24, 8 + 14 * open, 0, 0, PI2); c.fill(); c.strokeStyle = '#223a52'; c.stroke();
      c.fillStyle = '#3a0a14'; c.beginPath(); c.ellipse(0, 5, 18, 3 + 11 * open, 0, 0, PI2); c.fill();
      c.fillStyle = '#fff'; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 6 - 2.5, 5 - 3 - 11 * open); c.lineTo(i * 6 + 2.5, 5 - 3 - 11 * open); c.lineTo(i * 6, 5 + 3 - 11 * open + 8 * open); c.fill(); }
      c.fillStyle = '#fff'; c.beginPath(); c.arc(-14, -h * 0.55, 5, 0, PI2); c.arc(14, -h * 0.55, 5, 0, PI2); c.fill(); c.fillStyle = '#000'; c.beginPath(); c.arc(-14, -h * 0.55, 2.4, 0, PI2); c.arc(14, -h * 0.55, 2.4, 0, PI2); c.fill();
    }
    c.restore();
  };
  WB.drawGolem = function (c, f, px, py, time, o) {
    const s = 1.4, w = Math.sin(time * 8 + f.id) * (f.moving ? 3 : 0), th = f.throwT > 0 ? -10 : 0;
    c.save(); c.translate(px, py); c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0, 24, 30, 9, 0, 0, PI2); c.fill();
    c.strokeStyle = '#3a3e4a'; c.lineWidth = 3; c.fillStyle = '#7e8494';
    for (const sx of [-1, 1]) { c.beginPath(); c.roundRect ? c.roundRect(sx * 14 - 9, 8 + w * sx, 18, 16, 5) : c.rect(sx * 14 - 9, 8, 18, 16); c.fill(); c.stroke(); }
    c.fillStyle = '#9096a6'; c.beginPath(); c.moveTo(-26, 14); c.lineTo(-30, -8); c.lineTo(-14, -26); c.lineTo(14, -26); c.lineTo(30, -8); c.lineTo(26, 14); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#6a7084'; for (const p of [[-14, -6, 8], [10, 2, 10], [-4, 8, 6]]) { c.beginPath(); c.arc(p[0], p[1], p[2], 0, PI2); c.fill(); }
    c.fillStyle = '#7e8494'; for (const sx of [-1, 1]) { c.beginPath(); c.arc(sx * 34, -4 + th * (sx > 0 ? 1 : 0), 10, 0, PI2); c.fill(); c.stroke(); }
    c.fillStyle = '#9096a6'; c.beginPath(); c.arc(0, -26, 13, 0, PI2); c.fill(); c.stroke();
    c.fillStyle = '#ffb84a'; c.shadowColor = '#ffb84a'; c.shadowBlur = 8; c.beginPath(); c.arc(-5, -27, 2.6, 0, PI2); c.arc(5, -27, 2.6, 0, PI2); c.fill(); c.shadowBlur = 0;
    if (f.owner) { const k = Math.max(0, Math.min(1, f.life / (14 + 3 * f.golemL))); c.strokeStyle = '#4adcc8'; c.lineWidth = 3; c.beginPath(); c.arc(0, -52, 7, -Math.PI / 2, -Math.PI / 2 + PI2 * k); c.stroke(); }
    const hp = Math.max(0, f.hp / f.maxhp); c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(-26, 32, 52, 6); c.fillStyle = '#7aff9a'; c.fillRect(-26, 32, 52 * hp, 6);
    c.restore();
  };
  WB.drawDragon = function (c, t, time) {
    const fire = t.fireT > 0; c.save(); c.translate(t.x, t.y); c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0, 18, 28, 9, 0, 0, PI2); c.fill();
    const fl = Math.cos(t.ang || 0) < 0 ? -1 : 1; c.scale(fl, 1); c.lineJoin = 'round'; c.strokeStyle = '#3a0a0a'; c.lineWidth = 3;
    c.fillStyle = '#d83a2a'; c.beginPath(); c.ellipse(-6, 6, 22, 15, 0, 0, PI2); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-24, 8); c.quadraticCurveTo(-40, 14, -38, -2); c.lineTo(-30, 6); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#f0a030'; c.beginPath(); c.ellipse(-4, 12, 12, 7, 0, 0, PI2); c.fill();
    c.fillStyle = '#b02a20'; c.beginPath(); c.moveTo(-10, -4); c.lineTo(-22, -22 + Math.sin(time * 6) * 2); c.lineTo(0, -8); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#d83a2a'; c.beginPath(); c.arc(14, -6, 12, 0, PI2); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(24, -4, 9, 6 + (fire ? 3 : 0), 0, 0, PI2); c.fill(); c.stroke();
    c.fillStyle = '#ffe27a'; c.beginPath(); c.arc(12, -10, 3.2, 0, PI2); c.fill(); c.fillStyle = '#000'; c.beginPath(); c.arc(13, -10, 1.5, 0, PI2); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(14, -16); c.lineTo(18, -24); c.lineTo(20, -15); c.fill(); 
    if (fire) { c.fillStyle = '#ff9a2a'; c.shadowColor = '#ff7a1c'; c.shadowBlur = 12; c.beginPath(); c.moveTo(32, -4); c.quadraticCurveTo(48, -14, 56, -4); c.quadraticCurveTo(48, 6, 32, -4); c.fill(); c.shadowBlur = 0; }
    c.restore();
    const k = Math.max(0, Math.min(1, t.life / (12 + 2 * t.L))); c.strokeStyle = '#ff9a2a'; c.lineWidth = 3; c.beginPath(); c.arc(t.x, t.y - 34, 6, -Math.PI / 2, -Math.PI / 2 + PI2 * k); c.stroke();
  };
  WB.drawGlut = function (c, f, G, time, px, py, sc) {
    const s = (f.scale || 1) * sc, dir = f.face && f.face.x < 0 ? -1 : 1;
    let open = !!f.swallow;
    if (!open && f.alive) { const r = 170 + 20 * ((f.slots.find(x => x && x.id === 'glut') || { lvl: 1 }).lvl); open = G.enemiesIn(f, f.x, f.y, r).length > 0; }
    if (open) { c.save(); c.translate(px + dir * 6 * s, py + 6 * s); c.fillStyle = '#3a0a22'; c.strokeStyle = '#1a0010'; c.lineWidth = 2; c.beginPath(); c.ellipse(0, 0, 9 * s, (7 + 2 * Math.sin(time * 12)) * s, 0, 0, PI2); c.fill(); c.stroke(); c.fillStyle = '#ff6a9a'; c.beginPath(); c.ellipse(0, 3 * s, 5 * s, 3 * s, 0, 0, PI2); c.fill(); c.restore(); }
    if (f.swallow) { const k = f.swallow.t / f.swallow.T; c.save(); c.translate(px, py + 10 * s); c.globalAlpha = 0.85; c.fillStyle = '#ffb0d0'; c.beginPath(); c.arc(0, 0, 13 * s * (0.8 + 0.1 * Math.sin(time * 10)), 0, PI2); c.fill(); c.globalAlpha = 1; c.strokeStyle = '#ff4a8a'; c.lineWidth = 3; c.beginPath(); c.arc(0, -30 * s, 7, -Math.PI / 2, -Math.PI / 2 + PI2 * k); c.stroke(); c.restore(); }
  };
})(window.WB);
