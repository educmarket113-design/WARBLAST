// INVOCATION : dessins 2D (requin, dragon, golem, bras de pierre, griffes, crocs, queue, côtes, rochers)
(function (WB) {
  'use strict';
  const PI2 = Math.PI * 2;
  const IA = WB.IA = {};
  function rng(seed) { let s = (seed * 9301 + 49297) % 233280; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  function path(c, pts, close) { c.beginPath(); pts.forEach(function (p, i) { i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); if (close !== false) c.closePath(); }

  // ---------- flaque d'eau magique ----------
  IA.puddle = function (c, x, y, R, a, time, dark) {
    if (a <= 0.01) return;
    c.save(); c.translate(x, y); c.globalAlpha = Math.min(1, a);
    c.fillStyle = 'rgba(30,40,30,0.35)'; c.beginPath(); c.ellipse(0, 2, R * 1.08, R * 0.8, 0, 0, PI2); c.fill();
    const g = c.createRadialGradient(0, 0, R * 0.1, 0, 0, R); g.addColorStop(0, dark ? '#06284e' : '#0f4f96'); g.addColorStop(0.7, '#2f86d6'); g.addColorStop(1, '#6cc8ff');
    c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, R, R * 0.72, 0, 0, PI2); c.fill();
    c.strokeStyle = 'rgba(210,240,255,0.8)'; c.lineWidth = 2.5; c.stroke();
    c.lineWidth = 1.6;
    for (let k = 0; k < 3; k++) { const u = (time * 0.7 + k / 3) % 1; c.globalAlpha = Math.min(1, a) * (1 - u) * 0.7; c.strokeStyle = '#d8f4ff'; c.beginPath(); c.ellipse(0, 0, R * (0.15 + 0.8 * u), R * 0.72 * (0.15 + 0.8 * u), 0, 0, PI2); c.stroke(); }
    c.globalAlpha = Math.min(1, a) * 0.8; c.fillStyle = '#ffffff';
    for (let i = 0; i < 5; i++) { const an = i * 1.9 + time * 0.8; c.fillRect(Math.cos(an) * R * 0.6 - 1.5, Math.sin(an) * R * 0.4 - 1.5, 3, 3); }
    c.restore();
  };

  // ---------- nageoire dorsale (le requin nage sous le terrain) ----------
  IA.fin = function (c, x, y, s, face, time, wake) {
    c.save(); c.translate(x, y);
    c.strokeStyle = 'rgba(220,245,255,0.75)'; c.lineWidth = 2;
    for (let k = 0; k < 3; k++) { c.globalAlpha = 0.7 - k * 0.2; c.beginPath(); c.ellipse(-face * (10 + k * 16) * s, 4 * s, (10 + k * 7) * s, (4 + k * 2) * s, 0, 0, PI2); c.stroke(); }
    c.globalAlpha = 1; c.fillStyle = 'rgba(0,30,70,0.35)'; c.beginPath(); c.ellipse(0, 4 * s, 22 * s, 6 * s, 0, 0, PI2); c.fill();
    c.scale(face * s, s); const sw = Math.sin(time * 7) * 1.5;
    const g = c.createLinearGradient(0, -34, 0, 4); g.addColorStop(0, '#9db6c9'); g.addColorStop(1, '#3f5c78');
    c.fillStyle = g; c.strokeStyle = '#15283a'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-16, 2); c.quadraticCurveTo(-10 + sw, -22, 10 + sw, -38); c.quadraticCurveTo(10, -14, 20, 2); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-8, -6); c.quadraticCurveTo(-2 + sw, -20, 8 + sw, -32); c.stroke();
    c.restore();
  };

  // ---------- tête de requin qui surgit (profil, tournée vers face = +1 ou -1) ----------
  // rise : 0 sous terre -> 1 sorti ; open : 0 fermé -> 1 mâchoire grande ouverte
  IA.shark = function (c, x, y, s, face, rise, open, time, tilt) {
    if (rise <= 0.02) return;
    c.save(); c.translate(x, y);
    c.beginPath(); c.rect(-400 * s, -500 * s, 800 * s, 500 * s + 4); c.clip();
    c.translate(0, (1 - rise) * 90 * s); c.scale(face * s, s); c.rotate((tilt || 0) + Math.sin(time * 5) * 0.03);
    const op = open * 0.62;
    // corps
    const body = c.createLinearGradient(0, -40, 0, 70); body.addColorStop(0, '#46708f'); body.addColorStop(0.55, '#8fb3cb'); body.addColorStop(1, '#eef3f8');
    c.fillStyle = body; c.strokeStyle = '#13263a'; c.lineWidth = 2.4; c.lineJoin = 'round';
    path(c, [[-30, 90], [-34, 30], [-28, -10], [-14, -32], [10, -38], [30, -30], [46, -18], [58, -8], [60, -2], [34, -4], [10, -2], [-6, 4], [-14, 60]]);
    c.fill(); c.stroke();
    // ventre blanc et ombre
    c.fillStyle = 'rgba(240,247,252,0.85)'; path(c, [[-14, 60], [-6, 4], [10, -2], [34, -4], [60, -2], [30, 8], [4, 22], [-12, 70]]); c.fill();
    c.fillStyle = 'rgba(12,30,50,0.25)'; path(c, [[-30, 90], [-34, 30], [-28, -10], [-22, 20], [-24, 90]]); c.fill();
    // nageoire dorsale caractéristique
    c.fillStyle = '#34566f'; c.strokeStyle = '#13263a'; c.beginPath(); c.moveTo(-30, -2); c.quadraticCurveTo(-44, -26, -58, -58); c.quadraticCurveTo(-40, -46, -26, -34); c.closePath(); c.fill(); c.stroke();
    // nageoire pectorale
    c.fillStyle = '#6f93ad'; c.beginPath(); c.moveTo(-6, 26); c.quadraticCurveTo(10, 44, 4, 70); c.quadraticCurveTo(-14, 52, -20, 36); c.closePath(); c.fill(); c.stroke();
    // fentes branchiales
    c.strokeStyle = 'rgba(12,30,50,0.7)'; c.lineWidth = 1.6; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-4 - i * 5, 2 + i * 1); c.lineTo(-8 - i * 5, 18 + i * 1); c.stroke(); }
    // mâchoire inférieure (pivot)
    c.save(); c.translate(8, 0); c.rotate(op);
    c.fillStyle = '#d9e4ee'; c.strokeStyle = '#13263a'; c.lineWidth = 2.4; path(c, [[0, 0], [24, 2], [50, 4], [46, 12], [30, 20], [8, 20], [-6, 12]]); c.fill(); c.stroke();
    c.fillStyle = '#7a1c2c'; path(c, [[2, 1], [44, 4], [40, 7], [4, 6]]); c.fill();
    c.fillStyle = '#ffffff'; c.strokeStyle = '#8a98a6'; c.lineWidth = 0.8;
    for (let i = 0; i < 6; i++) { const tx = 8 + i * 7; path(c, [[tx, 3 + i * 0.2], [tx + 3.5, -6 - (i % 2) * 2], [tx + 7, 4 + i * 0.2]]); c.fill(); c.stroke(); }
    c.restore();
    // intérieur de la gueule et dents du haut
    c.fillStyle = '#5a1020'; path(c, [[-4, 0], [10, -2], [56, -2], [40, 4 + op * 14], [4, 4 + op * 12]]); c.fill();
    c.fillStyle = '#ffffff'; c.strokeStyle = '#8a98a6'; c.lineWidth = 0.8;
    for (let i = 0; i < 7; i++) { const tx = 6 + i * 7.2; path(c, [[tx, -3], [tx + 3.6, 7 + (i % 2) * 2], [tx + 7.2, -3]]); c.fill(); c.stroke(); }
    // museau et œil de prédateur
    c.fillStyle = '#0f1a26'; c.beginPath(); c.arc(54, -10, 1.8, 0, PI2); c.fill();
    c.fillStyle = '#e9f4ff'; c.beginPath(); c.ellipse(26, -18, 6.5, 5, 0, 0, PI2); c.fill(); c.strokeStyle = '#13263a'; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = '#05080c'; c.beginPath(); c.arc(27.5, -18, 3.6, 0, PI2); c.fill(); c.fillStyle = '#fff'; c.fillRect(26, -20, 1.8, 1.8);
    c.strokeStyle = '#13263a'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(18, -27); c.lineTo(34, -20); c.stroke(); // arcade menaçante
    c.restore();
  };

  // ---------- tête de dragon (crâne reptilien, cornes, crocs, pupilles verticales) ----------
  const DCOL = [
    { b: '#8b5a2b', d: '#4a2e14', l: '#bf8a52', eye: '#ffc23a', horn: '#e8d8b0', name: 'marron' },
    { b: '#e3b02e', d: '#8f6410', l: '#ffe58a', eye: '#ff7a1a', horn: '#fff2c4', name: 'jaune doré' },
    { b: '#cf2d2d', d: '#6e1010', l: '#ff7e6c', eye: '#ffe14a', horn: '#f0dcc0', name: 'rouge' },
    { b: '#eeeef2', d: '#9a9eb0', l: '#ffffff', eye: '#39b8ff', horn: '#cfd4e2', name: 'blanc' },
    { b: '#1f1c28', d: '#08070c', l: '#4d4662', eye: '#ff2a50', horn: '#2c2838', name: 'noir' }
  ];
  IA.DRAGON_COL = DCOL; IA.DRAGON_SCALE = [1, 1.25, 1.52, 1.85, 2.45];
  // rise : sortie du sol ; open : gueule ; roar : rugissement (secousse) ; lunge : avance de la tête
  IA.dragon = function (c, x, y, L, face, rise, open, roar, time, lunge) {
    if (rise <= 0.02) return;
    const K = DCOL[L - 1], s = IA.DRAGON_SCALE[L - 1] * 0.72; lunge = lunge || 0;
    c.save(); c.translate(x, y);
    // lueur de niveau 5
    if (L >= 5) { const g = c.createRadialGradient(0, -40 * s, 10, 0, -40 * s, 150 * s); g.addColorStop(0, 'rgba(160,60,255,0.28)'); g.addColorStop(1, 'rgba(160,60,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, -40 * s, 150 * s, 0, PI2); c.fill(); }
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(0, 4, 54 * s, 14 * s, 0, 0, PI2); c.fill();
    // trou dans le sol et terre soulevée
    c.fillStyle = '#2a1a0c'; c.beginPath(); c.ellipse(0, 2, 40 * s, 12 * s, 0, 0, PI2); c.fill();
    c.save(); c.beginPath(); c.rect(-300 * s, -500 * s, 600 * s, 500 * s + 3); c.clip();
    c.translate(lunge * s * face, (1 - rise) * 230 * s - 40 * s); c.scale(face * s, s);
    if (roar > 0) c.translate((Math.random() - 0.5) * 3 * roar, (Math.random() - 0.5) * 3 * roar);
    c.lineJoin = 'round'; c.strokeStyle = K.d; c.lineWidth = 3;
    const op = open * 0.55;
    // cou écailleux, majoritairement dans le sol
    const ng = c.createLinearGradient(-40, 0, 40, 0); ng.addColorStop(0, K.d); ng.addColorStop(0.5, K.b); ng.addColorStop(1, K.d);
    c.fillStyle = ng; path(c, [[-44, 160], [-40, 60], [-30, 10], [-6, 0], [14, 10], [30, 70], [40, 160]]); c.fill(); c.stroke();
    c.strokeStyle = K.l; c.globalAlpha = 0.5; c.lineWidth = 1.5; for (let i = 0; i < 7; i++) for (let j = 0; j < 3; j++) { c.beginPath(); c.arc(-24 + j * 20 + (i % 2) * 8, 24 + i * 15, 7, 0.2, Math.PI - 0.2); c.stroke(); } c.globalAlpha = 1;
    // pointes osseuses derrière la tête et le long de la nuque
    c.fillStyle = K.horn; c.strokeStyle = K.d; c.lineWidth = 2;
    const nsp = L >= 4 ? 6 : 4; for (let i = 0; i < nsp; i++) { const px = -34 + i * 2, py = -6 + i * 26 + 4; path(c, [[px, py], [px - 20 - (L >= 5 ? 8 : 0), py + 8], [px + 2, py + 18]]); c.fill(); c.stroke(); }
    // cornes (courbes, plus grandes selon le niveau)
    const hl = 1 + 0.17 * (L - 1);
    for (const o of [0, 1]) { const ox = -14 + o * 14, oy = -44 + o * 4, sz = o ? 0.75 : 1;
      c.fillStyle = K.horn; c.beginPath(); c.moveTo(ox, oy); c.bezierCurveTo(ox - 14 * hl * sz, oy - 20 * hl * sz, ox - 40 * hl * sz, oy - 30 * hl * sz, ox - 64 * hl * sz, oy - 18 * hl * sz); c.bezierCurveTo(ox - 40 * hl * sz, oy - 14 * hl * sz, ox - 20 * hl * sz, oy - 4 * hl * sz, ox + 12, oy + 8); c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = K.d; c.lineWidth = 1; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(ox - 10 * k * hl * sz, oy - 5 * k * hl * sz); c.lineTo(ox - 10 * k * hl * sz + 3, oy - 5 * k * hl * sz + 8); c.stroke(); } c.lineWidth = 2; }
    // mâchoire inférieure articulée
    c.save(); c.translate(0, 8); c.rotate(op);
    const lg = c.createLinearGradient(0, 0, 0, 34); lg.addColorStop(0, K.b); lg.addColorStop(1, K.d);
    c.fillStyle = lg; c.strokeStyle = K.d; c.lineWidth = 3; path(c, [[-18, 4], [14, 4], [62, 4], [86, 8], [82, 18], [56, 26], [22, 36], [-8, 34], [-24, 20]]); c.fill(); c.stroke();
    c.fillStyle = '#4a0a14'; path(c, [[-4, 5], [84, 8], [72, 8], [6, 6]]); c.fill();
    c.fillStyle = '#fff6e0'; c.strokeStyle = '#6a5a40'; c.lineWidth = 1;
    for (let i = 0; i < 6; i++) { const tx = 12 + i * 11, h = i === 5 ? 15 : 8 + (i % 2) * 3; path(c, [[tx, 5], [tx + 4, 5 - h], [tx + 8, 5]]); c.fill(); c.stroke(); }
    c.restore();
    // intérieur de la gueule
    c.fillStyle = '#5a0e1a'; path(c, [[-10, 6], [80, 4], [88, 6], [84 - op * 8, 8 + op * 36], [10, 12 + op * 30]]); c.fill();
    c.fillStyle = L >= 5 ? '#b02aff' : '#ff8a3a'; if (open > 0.5) { c.globalAlpha = 0.5; c.beginPath(); c.ellipse(46, 12 + op * 10, 28, 6 + op * 8, 0, 0, PI2); c.fill(); c.globalAlpha = 1; }
    // crâne : mâchoire supérieure et museau allongé
    const sg = c.createLinearGradient(0, -60, 0, 14); sg.addColorStop(0, K.l); sg.addColorStop(0.45, K.b); sg.addColorStop(1, K.d);
    c.fillStyle = sg; c.strokeStyle = K.d; c.lineWidth = 3;
    path(c, [[-30, 14], [-34, -20], [-24, -48], [-4, -58], [20, -52], [42, -38], [66, -30], [90, -22], [96, -10], [92, 2], [84, 6], [60, 5], [30, 6], [4, 8]]); c.fill(); c.stroke();
    // crocs du haut (grands crocs devant)
    c.fillStyle = '#fff6e0'; c.strokeStyle = '#6a5a40'; c.lineWidth = 1;
    for (let i = 0; i < 6; i++) { const tx = 10 + i * 12, h = i === 5 ? 17 : 8 + (i % 2) * 3; path(c, [[tx, 6], [tx + 4, 6 + h], [tx + 8, 6]]); c.fill(); c.stroke(); }
    path(c, [[84, 4], [90, 24 + open * 4], [93, 3]]); c.fill(); c.stroke();
    // écailles du front et des joues
    c.strokeStyle = K.d; c.globalAlpha = 0.55; c.lineWidth = 1.4; const nsc = 9 + L * 3, r = rng(L * 7);
    for (let i = 0; i < nsc; i++) { const sx = -24 + r() * 80, sy = -46 + r() * 50; c.beginPath(); c.arc(sx, sy, 5 + r() * 2, 0.1, Math.PI - 0.1); c.stroke(); }
    c.globalAlpha = 1;
    // arcade, œil reptilien (pupille verticale), narine
    c.fillStyle = K.d; path(c, [[8, -42], [38, -40], [44, -28], [30, -32], [14, -30]]); c.fill();
    const eg = c.createRadialGradient(24, -26, 1, 24, -26, 10); eg.addColorStop(0, '#fff'); eg.addColorStop(0.35, K.eye); eg.addColorStop(1, K.eye);
    if (L >= 5) { c.shadowColor = K.eye; c.shadowBlur = 14; }
    c.fillStyle = eg; c.beginPath(); c.ellipse(24, -26, 9, 6.5, -0.15, 0, PI2); c.fill(); c.shadowBlur = 0; c.strokeStyle = K.d; c.lineWidth = 1.8; c.stroke();
    c.fillStyle = '#080408'; c.beginPath(); c.ellipse(24.5, -26, 1.8, 6, 0, 0, PI2); c.fill();
    c.fillStyle = '#12080a'; c.beginPath(); c.ellipse(86, -14, 3.4, 2.2, 0.4, 0, PI2); c.fill();
    if (open > 0.2 && L >= 3) { c.fillStyle = 'rgba(80,80,80,0.35)'; c.beginPath(); c.arc(92 + Math.sin(time * 6) * 2, -20 - ((time * 20) % 14), 4, 0, PI2); c.fill(); }
    c.restore(); c.restore();
  };

  // ---------- griffe de dragon (doigts pointus, articulations visibles) ----------
  // c01 : 0 ouverte, 1 refermée ; ang : direction vers laquelle elle se referme
  IA.claw = function (c, x, y, ang, s, c01, L, grow) {
    const K = DCOL[Math.max(0, Math.min(4, L - 1))]; grow = grow == null ? 1 : grow; if (grow <= 0.02) return;
    c.save(); c.translate(x, y); c.rotate(ang);
    c.fillStyle = 'rgba(0,0,0,0.28)'; c.beginPath(); c.ellipse(0, 6, 26 * s, 9 * s, 0, 0, PI2); c.fill();
    c.beginPath(); c.rect(-200, -300, 400, 300 + 6); c.save(); c.rotate(-ang); c.restore();
    c.lineCap = 'round'; c.lineJoin = 'round';
    // poignet / paume sortant du sol
    c.fillStyle = K.d; c.strokeStyle = '#000'; c.globalAlpha = 1; c.lineWidth = 2;
    c.beginPath(); c.ellipse(0, -2, 20 * s, 12 * s * grow, 0, 0, PI2); c.fill(); c.stroke();
    const n = 4;
    for (let i = 0; i < n; i++) {
      const sp = (i - (n - 1) / 2), base = -Math.PI / 2 + sp * 0.22 * (1 - c01 * 0.7), curl = c01 * 1.2 + 0.35;
      let px = sp * 9 * s, py = -4, a = base; const seg = [30 * s * grow, 26 * s * grow, 20 * s * grow], wd = [11 * s, 8.5 * s, 6 * s], pts = [[px, py]];
      for (let k = 0; k < 3; k++) { a += curl * (0.45 + k * 0.2) * (sp < 0 ? -0.6 : 0.6) * (i % 2 ? 1 : 1) + 0.0; px += Math.cos(a) * seg[k]; py += Math.sin(a) * seg[k]; pts.push([px, py]); }
      c.strokeStyle = K.d; for (let k = 0; k < 3; k++) { c.lineWidth = wd[k] + 3; c.beginPath(); c.moveTo(pts[k][0], pts[k][1]); c.lineTo(pts[k + 1][0], pts[k + 1][1]); c.stroke(); }
      c.strokeStyle = K.b; for (let k = 0; k < 3; k++) { c.lineWidth = wd[k]; c.beginPath(); c.moveTo(pts[k][0], pts[k][1]); c.lineTo(pts[k + 1][0], pts[k + 1][1]); c.stroke(); }
      c.fillStyle = K.l; for (let k = 1; k < 3; k++) { c.beginPath(); c.arc(pts[k][0], pts[k][1], wd[k] * 0.55, 0, PI2); c.fill(); }
      const e = pts[3], ang2 = Math.atan2(pts[3][1] - pts[2][1], pts[3][0] - pts[2][0]);
      c.fillStyle = K.horn; c.strokeStyle = K.d; c.lineWidth = 1.5; c.beginPath(); c.moveTo(e[0] + Math.cos(ang2 + 1.7) * 4 * s, e[1] + Math.sin(ang2 + 1.7) * 4 * s); c.lineTo(e[0] + Math.cos(ang2) * 18 * s, e[1] + Math.sin(ang2) * 18 * s); c.lineTo(e[0] + Math.cos(ang2 - 1.7) * 4 * s, e[1] + Math.sin(ang2 - 1.7) * 4 * s); c.closePath(); c.fill(); c.stroke();
    }
    c.restore();
  };

  // ---------- croc organique (rangée de crocs qui avance) ----------
  IA.fang = function (c, x, y, s, h01, L, lean) {
    if (h01 <= 0.02) return; const K = DCOL[Math.max(0, Math.min(4, L - 1))], H = 46 * s * h01;
    c.save(); c.translate(x, y); c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(0, 3, 12 * s, 5 * s, 0, 0, PI2); c.fill();
    c.fillStyle = K.d; c.beginPath(); c.ellipse(0, 0, 13 * s, 6 * s, 0, 0, PI2); c.fill(); // gencive
    c.fillStyle = K.horn; c.strokeStyle = '#4a3a2a'; c.lineWidth = 1.6; c.rotate(lean || 0);
    c.beginPath(); c.moveTo(-9 * s, 0); c.bezierCurveTo(-8 * s, -H * 0.4, -3 * s, -H * 0.8, 3 * s, -H); c.bezierCurveTo(7 * s, -H * 0.6, 9 * s, -H * 0.3, 9 * s, 0); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(80,60,40,0.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-3 * s, -H * 0.1); c.quadraticCurveTo(-1 * s, -H * 0.5, 2 * s, -H * 0.85); c.stroke();
    c.restore();
  };

  // ---------- queue de dragon (extension magique : jamais le corps entier) ----------
  IA.tail = function (c, cx, cy, r, a0, a1, L, alpha) {
    const K = DCOL[Math.max(0, Math.min(4, L - 1))], n = 18; c.save(); c.globalAlpha = alpha == null ? 1 : alpha; c.lineJoin = 'round'; c.lineCap = 'round';
    const pts = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, a]); }
    for (let i = 0; i < n; i++) { const w = 6 + 26 * (1 - i / n) * (1 - i / n * 0.2) * (L >= 4 ? 1.15 : 1); c.strokeStyle = K.d; c.lineWidth = w + 4; c.beginPath(); c.moveTo(pts[i][0], pts[i][1]); c.lineTo(pts[i + 1][0], pts[i + 1][1]); c.stroke(); c.strokeStyle = i % 2 ? K.b : K.l; c.lineWidth = w; c.beginPath(); c.moveTo(pts[i][0], pts[i][1]); c.lineTo(pts[i + 1][0], pts[i + 1][1]); c.stroke(); }
    c.fillStyle = K.horn; c.strokeStyle = K.d; c.lineWidth = 1.5;
    for (let i = 1; i < n; i += 2) { const p = pts[i], nx = Math.cos(p[2]), ny = Math.sin(p[2]), w = 6 + 26 * (1 - i / n) * 0.5; c.beginPath(); c.moveTo(p[0] - ny * 0 + nx * (w + 8), p[1] + ny * (w + 8)); c.lineTo(p[0] + nx * w + Math.sin(p[2]) * 5, p[1] + ny * w - Math.cos(p[2]) * 5); c.lineTo(p[0] + nx * w - Math.sin(p[2]) * 5, p[1] + ny * w + Math.cos(p[2]) * 5); c.closePath(); c.fill(); c.stroke(); }
    const e = pts[n], d = e[2] + Math.PI / 2; c.fillStyle = K.horn; c.beginPath(); c.moveTo(e[0] + Math.cos(d) * 22, e[1] + Math.sin(d) * 22); c.lineTo(e[0] + Math.cos(d + 2.2) * 10, e[1] + Math.sin(d + 2.2) * 10); c.lineTo(e[0] + Math.cos(d - 2.2) * 10, e[1] + Math.sin(d - 2.2) * 10); c.closePath(); c.fill(); c.stroke();
    c.restore();
  };

  // ---------- côte géante de dragon (cage osseuse) ----------
  IA.rib = function (c, x, y, ang, s, h01, L) {
    if (h01 <= 0.02) return; const K = DCOL[Math.max(0, Math.min(4, L - 1))]; c.save(); c.translate(x, y); c.rotate(ang);
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(0, 3, 16 * s, 6 * s, 0, 0, PI2); c.fill();
    c.fillStyle = K.horn; c.strokeStyle = '#4a3a2a'; c.lineWidth = 2; const H = 90 * s * h01;
    c.beginPath(); c.moveTo(-9 * s, 0); c.bezierCurveTo(-8 * s, -H * 0.5, 4 * s, -H * 0.85, 26 * s, -H); c.bezierCurveTo(10 * s, -H * 0.7, 6 * s, -H * 0.3, 9 * s, 0); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = K.d; c.beginPath(); c.ellipse(0, 0, 12 * s, 5 * s, 0, 0, PI2); c.fill();
    c.strokeStyle = 'rgba(80,60,40,0.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-3 * s, -H * 0.2); c.quadraticCurveTo(2 * s, -H * 0.6, 18 * s, -H * 0.93); c.stroke(); c.restore();
  };

  // ---------- pierres : bloc irrégulier, rocher, fissures lumineuses ----------
  const ST = { hi: '#a9acb6', mid: '#858893', lo: '#5d606c', line: '#2c2e38', glow: '#ffb347' };
  IA.ST = ST;
  IA.rock = function (c, x, y, rx, ry, seed, shade) {
    const r = rng(seed + 3), n = 8, pts = []; for (let i = 0; i < n; i++) { const a = i / n * PI2 + r() * 0.3, k = 0.78 + r() * 0.3; pts.push([x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k]); }
    c.fillStyle = shade || ST.mid; c.strokeStyle = ST.line; c.lineWidth = 2; path(c, pts); c.fill(); c.stroke();
    c.fillStyle = ST.hi; c.globalAlpha = 0.55; path(c, [pts[5], pts[6], pts[7], [x, y]]); c.fill(); c.globalAlpha = 1;
    c.fillStyle = ST.lo; c.globalAlpha = 0.5; path(c, [pts[1], pts[2], pts[3], [x, y]]); c.fill(); c.globalAlpha = 1;
  };
  IA.crack = function (c, pts, w, glow, a) { c.save(); c.globalAlpha = a == null ? 1 : a; c.strokeStyle = glow || ST.glow; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.shadowColor = glow || ST.glow; c.shadowBlur = 6; c.beginPath(); pts.forEach(function (p, i) { i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.stroke(); c.restore(); };
  IA.boulder = function (c, x, y, s, seed) { c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(x, y + 4, 22 * s, 8 * s, 0, 0, PI2); c.fill(); IA.rock(c, x, y - 14 * s, 22 * s, 20 * s, seed || 1); IA.crack(c, [[x - 8 * s, y - 20 * s], [x - 2 * s, y - 14 * s], [x - 6 * s, y - 8 * s]], 1.5, ST.glow, 0.7); };

  // ---------- bras de pierre : doigts de pierre clairement visibles ----------
  // c01 : 0 main ouverte, 1 poing fermé ; h01 : sortie du sol ; ang : inclinaison ; s : taille
  IA.arm = function (c, x, y, s, h01, c01, ang, seed, flash) {
    if (h01 <= 0.02) return; c.save(); c.translate(x, y);
    c.fillStyle = 'rgba(0,0,0,0.32)'; c.beginPath(); c.ellipse(0, 4, 34 * s, 11 * s, 0, 0, PI2); c.fill();
    c.fillStyle = '#4a3a28'; c.beginPath(); c.ellipse(0, 0, 38 * s, 12 * s, 0, 0, PI2); c.fill();
    c.save(); c.beginPath(); c.rect(-300 * s, -600 * s, 600 * s, 600 * s + 3); c.clip();
    c.rotate(ang || 0); c.translate(0, (1 - h01) * 130 * s);
    const sh = flash ? '#ffffff' : null, H = 120 * s;
    // avant-bras massif fait de blocs
    for (let i = 0; i < 5; i++) { const yy = -i * H / 5 + 10 * s, w = (30 - i * 1.5) * s; IA.rock(c, 0, yy - 12 * s, w, 17 * s, (seed || 1) * 7 + i, sh || (i % 2 ? ST.mid : ST.hi)); }
    IA.crack(c, [[-6 * s, -10 * s], [2 * s, -40 * s], [-4 * s, -70 * s], [3 * s, -96 * s]], 2, ST.glow, 0.85);
    // main : paume + cinq doigts de pierre articulés
    const py = -H - 8 * s; IA.rock(c, 0, py, 30 * s, 22 * s, (seed || 1) + 11, sh || ST.hi);
    for (let i = 0; i < 4; i++) {
      const sp = (i - 1.5), a0 = -Math.PI / 2 + sp * 0.3 * (1 - c01 * 0.8), cur = c01 * 1.3 + 0.1; let px = sp * 12 * s, pyy = py - 12 * s, a = a0;
      for (let k = 0; k < 3; k++) { const L1 = (19 - k * 3) * s, w = (13 - k * 2) * s; a += cur * (sp < 0 ? 0.55 : -0.55) * (k + 1) * 0.5; const nx = px + Math.cos(a) * L1, ny = pyy + Math.sin(a) * L1;
        c.strokeStyle = ST.line; c.lineWidth = w + 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(px, pyy); c.lineTo(nx, ny); c.stroke(); c.strokeStyle = sh || (k % 2 ? ST.mid : ST.hi); c.lineWidth = w; c.beginPath(); c.moveTo(px, pyy); c.lineTo(nx, ny); c.stroke(); px = nx; pyy = ny; }
    }
    const ta = -Math.PI / 2 - 1.15 + c01 * 0.9; c.strokeStyle = ST.line; c.lineWidth = 15 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(-24 * s, py + 6 * s); c.lineTo(-24 * s + Math.cos(ta) * 24 * s, py + 6 * s + Math.sin(ta) * 24 * s); c.stroke(); c.strokeStyle = sh || ST.hi; c.lineWidth = 11 * s; c.stroke();
    c.restore(); c.restore();
  };

  // ---------- golem : créature de pierre élémentaire ----------
  // o = { L (niveau), punch (0..1), hammer (0..1 : phase), hp01, moving, walk, hit, shield, core }
  IA.golem = function (c, x, y, s, o, time, seed) {
    c.save(); c.translate(x, y); c.scale(s, s);
    const bob = Math.sin(time * (o.moving ? 5 : 1.8) + seed) * (o.moving ? 3 : 1.2), L = o.L || 1, big = L >= 4, flash = o.hit > 0;
    const hi = flash ? '#fff' : ST.hi, md = flash ? '#fff' : ST.mid, lo = flash ? '#fff' : ST.lo;
    c.fillStyle = 'rgba(0,0,0,0.32)'; c.beginPath(); c.ellipse(0, 26, 40, 12, 0, 0, PI2); c.fill();
    // jambes courtes et puissantes
    for (const sx of [-1, 1]) { const st = o.moving ? Math.sin(time * 5 + (sx > 0 ? 0 : Math.PI)) * 4 : 0; IA.rock(c, sx * 16, 14 + st * 0.5, 14, 14, seed + sx, md); IA.rock(c, sx * 16, 24 + st, 17, 7, seed + 5 + sx, lo); }
    c.translate(0, bob);
    // torse : blocs empilés
    IA.rock(c, 0, -2, 32, 26, seed + 1, md); IA.rock(c, -14, -8, 17, 17, seed + 2, hi); IA.rock(c, 15, -4, 16, 18, seed + 3, lo); IA.rock(c, 0, -22, 26, 14, seed + 4, hi);
    IA.crack(c, [[-18, -14], [-8, -6], [-12, 6], [-4, 14]], 2.2, ST.glow, 0.9); IA.crack(c, [[14, -18], [8, -6], [16, 4]], 2, ST.glow, 0.8);
    if (L >= 5) { // noyau lumineux dans la poitrine
      const pu = 0.7 + 0.3 * Math.sin(time * 3); const g = c.createRadialGradient(0, -6, 1, 0, -6, 18); g.addColorStop(0, '#fff7d0'); g.addColorStop(0.4, '#ffb347'); g.addColorStop(1, 'rgba(255,120,20,0)'); c.globalAlpha = pu; c.fillStyle = g; c.beginPath(); c.arc(0, -6, 18, 0, PI2); c.fill(); c.globalAlpha = 1;
      c.fillStyle = '#fff3b0'; c.beginPath(); c.arc(0, -6, 5, 0, PI2); c.fill(); IA.rock(c, -22, -26, 12, 10, seed + 9, lo); IA.rock(c, 22, -24, 12, 10, seed + 10, lo);
    }
    // tête imposante
    IA.rock(c, 0, -40, 20, 17, seed + 6, hi); c.fillStyle = '#1c1a20'; path(c, [[-12, -34], [12, -34], [9, -29], [-9, -29]]); c.fill();
    c.fillStyle = '#e8e0c8'; for (let i = 0; i < 4; i++) { path(c, [[-8 + i * 5, -34], [-6 + i * 5, -30], [-4 + i * 5, -34]]); c.fill(); }
    const eyc = L >= 5 ? '#ffe9a0' : '#ffb347'; c.shadowColor = eyc; c.shadowBlur = 10; c.fillStyle = eyc; for (const sx of [-1, 1]) { path(c, [[sx * 11 - 4, -46], [sx * 11 + 5, -44], [sx * 11 + 2, -40], [sx * 11 - 6, -41]]); c.fill(); } c.shadowBlur = 0;
    // bras très épais et grandes mains rocheuses
    const pn = o.punch || 0, hm = o.hammer || 0;
    for (const sx of [-1, 1]) {
      const swing = sx > 0 ? pn : 0, ax = sx * 36 + sx * swing * 4, ay = -10 + (o.moving ? Math.sin(time * 5 + sx) * 3 : 0) - swing * 24;
      if (L >= 4 && sx > 0 && hm > 0) continue; // le bras droit tient le marteau
      IA.rock(c, sx * 30, -16, 13, 14, seed + 20 + sx, md); IA.rock(c, ax, ay + 8, 15, 18, seed + 21 + sx, hi); IA.rock(c, ax + sx * 2, ay + 26 - swing * 10, 19, 17, seed + 22 + sx, md);
      IA.crack(c, [[ax - 4, ay], [ax + 2, ay + 10], [ax - 2, ay + 18]], 1.8, ST.glow, 0.8);
    }
    if (o.shield) { c.save(); c.globalAlpha = 0.5; c.fillStyle = '#9fd0ff'; c.beginPath(); c.arc(0, -8, 54, 0, PI2); c.fill(); c.restore(); }
    c.restore();
    if (o.hp01 != null && o.hp01 < 1.001) { const w = 46 * s, yy = y - 62 * s; c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(x - w / 2, yy, w, 6); c.fillStyle = o.hp01 > 0.35 ? '#7cff9a' : '#ff6a5a'; c.fillRect(x - w / 2 + 1, yy + 1, (w - 2) * Math.max(0, o.hp01), 4); }
  };
  // marteau de pierre arraché au terrain
  IA.hammer = function (c, x, y, s, ang, grow) {
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(s * grow, s * grow);
    c.strokeStyle = ST.line; c.lineWidth = 4; c.fillStyle = ST.mid; path(c, [[-8, 0], [-6, -70], [6, -70], [8, 0]]); c.fill(); c.stroke();
    IA.rock(c, 0, -86, 40, 28, 77, ST.hi); IA.rock(c, -18, -84, 14, 18, 78, ST.mid); IA.rock(c, 20, -90, 14, 14, 79, ST.lo);
    IA.crack(c, [[-14, -90], [0, -84], [10, -96]], 2, ST.glow, 0.9);
    // morceaux de terre accrochés
    c.fillStyle = '#6a4a28'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(-24 + i * 16, -60 - (i % 2) * 6, 4, 0, PI2); c.fill(); }
    c.restore();
  };
  IA.pillar = function (c, x, y, s, h01, seed) { IA.arm(c, x, y, s, h01, 0.5, 0, seed || 3); };
})(window.WB);
