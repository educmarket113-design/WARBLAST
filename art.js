'use strict';
(function (WB) {
  const PI2 = Math.PI * 2;
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const cl = v => Math.max(0, Math.min(255, v));
    return 'rgb(' + cl((n >> 16) + amt) + ',' + cl(((n >> 8) & 255) + amt) + ',' + cl((n & 255) + amt) + ')';
  }
  WB.shade = shade;

  function ell(c, x, y, rx, ry, fill, stroke, lw) {
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, PI2);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.lineWidth = lw || 1; c.strokeStyle = stroke; c.stroke(); }
  }

  // ---------- Personnage style Kirby (original) ----------
  WB.drawBlob = function (c, spec, x, y, s, o) {
    o = o || {};
    const base = o.color || WB.COLORS[spec.color];
    const dk = shade(base, -48), lt = shade(base, 38);
    const R = 22 * s, t = o.t || 0, mv = o.moving ? 1 : 0, ph = o.walk || 0;
    const bob = mv ? -Math.abs(Math.sin(ph)) * 3.2 * s : -Math.sin(t * 2.4) * 1.1 * s;
    const fx = o.fx || 0, fy = o.fy || 0;
    const back = fy < -0.35 || !!o.back, jmp = o.jump || 0, cst = o.cast || 0; // vu de dos quand il regarde vers le haut de l'écran
    const feat = WB.CHARS[spec.char].feat;
    const cape = WB.equip('cape', spec.cape), armor = WB.equip('armor', spec.armor), hat = WB.equip('hat', spec.hat),
      scarf = WB.equip('scarf', spec.scarf), shoes = WB.equip('shoes', spec.shoes);
    c.save(); c.translate(x, y);
    if (o.alpha != null) c.globalAlpha = o.alpha;
    ell(c, 0, R * 0.92, R * 0.95, R * 0.34, 'rgba(0,0,0,.28)');
    c.translate(0, bob - jmp * 6 * s);
    if (mv) c.rotate(Math.sin(ph) * 0.07); // le corps accompagne la foulée
    if (jmp) c.scale(1 - 0.05 * jmp, 1 + 0.08 * jmp);
    const sw = Math.sin(t * 3 + ph * 0.5) * 3 * s;
    // cape
    if (cape) {
      c.beginPath(); c.moveTo(-R * 0.62, -R * 0.1);
      c.quadraticCurveTo(-R * 1.3, R * 0.8 + sw, -R * 0.7, R * 1.12 + sw * 0.6);
      c.lineTo(R * 0.7, R * 1.12 - sw * 0.6);
      c.quadraticCurveTo(R * 1.3, R * 0.8 - sw, R * 0.62, -R * 0.1); c.closePath();
      c.fillStyle = cape.c; c.fill(); c.lineWidth = 2 * s; c.strokeStyle = shade(cape.c, -50); c.stroke();
    }
    // oreilles / éléments derrière
    if (feat === 'cat' && !hat) {
      for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * R * 0.25, -R * 0.78); c.lineTo(d * R * 0.78, -R * 1.2); c.lineTo(d * R * 0.9, -R * 0.45); c.closePath(); c.fillStyle = base; c.fill(); c.lineWidth = 2 * s; c.strokeStyle = dk; c.stroke(); c.beginPath(); c.moveTo(d * R * 0.45, -R * 0.78); c.lineTo(d * R * 0.72, -R * 1.0); c.lineTo(d * R * 0.78, -R * 0.6); c.closePath(); c.fillStyle = '#ffb3c8'; c.fill(); }
    }
    if (feat === 'bunny' && !hat) {
      for (const d of [-1, 1]) { ell(c, d * R * 0.38, -R * 1.35 + (d < 0 ? 0 : -3 * s), R * 0.2, R * 0.62, base, dk, 2 * s); ell(c, d * R * 0.38, -R * 1.32, R * 0.09, R * 0.42, '#ffb3c8'); }
    }
    if (feat === 'bear') {
      for (const d of [-1, 1]) { ell(c, d * R * 0.68, -R * 0.78, R * 0.3, R * 0.3, base, dk, 2 * s); ell(c, d * R * 0.68, -R * 0.78, R * 0.15, R * 0.15, '#ffb3c8'); }
    }
    if (feat === 'fin') {
      for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * R * 0.9, -R * 0.1); c.quadraticCurveTo(d * R * 1.6, -R * 0.4, d * R * 1.35, R * 0.35); c.quadraticCurveTo(d * R * 1.1, R * 0.2, d * R * 0.9, R * 0.3); c.closePath(); c.fillStyle = lt; c.fill(); c.lineWidth = 2 * s; c.strokeStyle = dk; c.stroke(); }
    }
    // pieds
    for (const d of [-1, 1]) {
      // vraie foulée : les pieds s'alternent d'avant en arrière et se lèvent à chaque pas ; en saut ils se replient
      const pp = ph + (d < 0 ? 0 : Math.PI), st = mv ? Math.sin(pp) : 0, lift = mv ? Math.max(0, Math.cos(pp)) : 0;
      const fxp = d * R * (0.5 + (mv ? 0.05 * Math.cos(pp) : 0)), fyp = R * 0.86 + st * R * 0.3 - lift * R * 0.2 - jmp * R * 0.3;
      if (shoes && shoes.style === 'tall') { ell(c, fxp, fyp - R * 0.1, R * 0.34, R * 0.38, shoes.c, shade(shoes.c, -60), 2 * s); ell(c, fxp, fyp - R * 0.34, R * 0.3, R * 0.1, shade(shoes.c, 40)); }
      else if (shoes) { ell(c, fxp, fyp, R * 0.42, R * 0.26, shoes.c, shade(shoes.c, -60), 2 * s); if (shoes.style === 'sneaker') { ell(c, fxp, fyp + R * 0.12, R * 0.4, R * 0.1, '#d0d6e6'); } }
      else ell(c, fxp, fyp, R * 0.4, R * 0.26, shade(base, -22), dk, 2 * s);
    }
    // corps
    const g = c.createRadialGradient(-R * 0.3, -R * 0.4, R * 0.1, 0, 0, R * 1.1);
    g.addColorStop(0, lt); g.addColorStop(0.55, base); g.addColorStop(1, shade(base, -30));
    c.beginPath(); c.arc(0, 0, R, 0, PI2); c.fillStyle = g; c.fill(); c.lineWidth = 2.2 * s; c.strokeStyle = dk; c.stroke();
    // armure
    if (armor) {
      c.save(); c.beginPath(); c.arc(0, 0, R - 1, 0, PI2); c.clip();
      const ag = c.createLinearGradient(0, 0, 0, R); ag.addColorStop(0, shade(armor.c, 30)); ag.addColorStop(1, shade(armor.c, -35));
      c.fillStyle = ag; c.beginPath(); c.moveTo(-R, R * 0.22); c.quadraticCurveTo(0, R * 0.05, R, R * 0.22); c.lineTo(R, R); c.lineTo(-R, R); c.closePath(); c.fill();
      c.lineWidth = 1.8 * s; c.strokeStyle = shade(armor.c, -70); c.stroke();
      c.fillStyle = shade(armor.c, 60);
      for (const rx of [-0.5, 0, 0.5]) { c.beginPath(); c.arc(rx * R, R * 0.5, 1.8 * s, 0, PI2); c.fill(); }
      c.restore();
      for (const d of [-1, 1]) ell(c, d * R * 0.8, R * 0.22, R * 0.2, R * 0.17, armor.c, shade(armor.c, -70), 1.6 * s);
    }
    // écharpe
    if (scarf) {
      c.lineWidth = R * 0.26; c.lineCap = 'round'; c.strokeStyle = scarf.c;
      c.beginPath(); c.arc(0, -R * 0.02, R * 0.84, Math.PI * 0.12, Math.PI * 0.88); c.stroke();
      if (scarf.style === 'stripe') { c.strokeStyle = scarf.c2; c.setLineDash([R * 0.2, R * 0.2]); c.beginPath(); c.arc(0, -R * 0.02, R * 0.84, Math.PI * 0.12, Math.PI * 0.88); c.stroke(); c.setLineDash([]); }
      c.save(); c.translate(R * 0.5, R * 0.58); c.rotate(-0.3 + Math.sin(t * 4) * 0.12 * (mv + 0.3));
      c.fillStyle = scarf.c; c.fillRect(-R * 0.12, 0, R * 0.26, R * 0.5);
      if (scarf.style === 'stripe') { c.fillStyle = scarf.c2; c.fillRect(-R * 0.12, R * 0.12, R * 0.26, R * 0.1); c.fillRect(-R * 0.12, R * 0.32, R * 0.26, R * 0.1); }
      c.restore(); c.lineCap = 'butt';
    }
    if (back) { c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 2 * s; c.beginPath(); c.arc(0, -R * 0.05, R * 0.55, Math.PI * 0.15, Math.PI * 0.85); c.stroke(); ell(c, -R * 0.25, -R * 0.45, R * 0.28, R * 0.14, 'rgba(255,255,255,.22)'); }
    else {
    // visage
    for (const d of [-1, 1]) ell(c, d * R * 0.6, R * 0.22, R * 0.17, R * 0.1, 'rgba(255,90,130,.45)');
    const ex = fx * R * 0.1, ey = fy * R * 0.06;
    for (const d of [-1, 1]) {
      if (o.dead) {
        c.strokeStyle = '#1b1730'; c.lineWidth = 2.4 * s; c.beginPath();
        c.moveTo(d * R * 0.3 - R * 0.1, -R * 0.2); c.lineTo(d * R * 0.3 + R * 0.1, 0); c.moveTo(d * R * 0.3 + R * 0.1, -R * 0.2); c.lineTo(d * R * 0.3 - R * 0.1, 0); c.stroke();
        continue;
      }
      const eg = c.createLinearGradient(0, -R * 0.35, 0, R * 0.1); eg.addColorStop(0, '#1b1730'); eg.addColorStop(0.7, '#1b1730'); eg.addColorStop(1, '#3a52c8');
      ell(c, d * R * 0.3 + ex, -R * 0.12 + ey, R * 0.13, R * 0.24, eg);
      ell(c, d * R * 0.3 + ex - R * 0.03, -R * 0.22 + ey, R * 0.07, R * 0.1, '#fff');
      ell(c, d * R * 0.3 + ex + R * 0.02, -R * 0.02 + ey, R * 0.04, R * 0.05, 'rgba(255,255,255,.7)');
    }
    c.strokeStyle = '#7a2a3a'; c.lineWidth = 1.8 * s; c.beginPath();
    if (o.hurt) { c.arc(ex * 0.5, R * 0.3, R * 0.07, 0, PI2); } else { c.arc(ex * 0.5, R * 0.2, R * 0.12, 0.15 * Math.PI, 0.85 * Math.PI); }
    c.stroke();
    }
    // bras : balancier opposé aux jambes, levés pendant un saut ou l'usage d'une capacité, tendus pour lancer
    for (const d of [-1, 1]) {
      const pp = ph + (d < 0 ? Math.PI : 0), sw2 = mv ? Math.sin(pp) : Math.sin(t * 2.4 + d) * 0.25;
      let hx = d * R * (1.04 + (mv ? 0.06 * Math.abs(Math.cos(pp)) : 0)), hy = R * 0.22 + sw2 * R * 0.36;
      if (jmp || cst) { const up = Math.max(jmp, cst); hx = d * R * (1.0 + 0.25 * up); hy = R * 0.22 - up * R * 0.95 + Math.sin(t * 14 + d) * R * 0.05 * cst; }
      if (o.arm && d > 0) { hx = (o.fx || 1) * R * 1.25; hy = (o.fy || 0) * R * 1.15 + R * 0.1; }
      const sx = d * R * 0.8, sy = R * 0.12;
      c.lineCap = 'round'; c.strokeStyle = dk; c.lineWidth = R * 0.36 + 2 * s; c.beginPath(); c.moveTo(sx, sy); c.lineTo(hx, hy); c.stroke();
      c.strokeStyle = base; c.lineWidth = R * 0.36 - 1 * s; c.beginPath(); c.moveTo(sx, sy); c.lineTo(hx, hy); c.stroke(); c.lineCap = 'butt';
      ell(c, hx, hy, R * 0.25, R * 0.24, base, dk, 2 * s);
    }
    // éléments devant
    if (!hat) {
      if (feat === 'horn') { c.beginPath(); c.moveTo(-R * 0.14, -R * 0.92); c.lineTo(0, -R * 1.55); c.lineTo(R * 0.14, -R * 0.92); c.closePath(); c.fillStyle = '#fff3c8'; c.fill(); c.lineWidth = 2 * s; c.strokeStyle = '#a0884a'; c.stroke(); }
      if (feat === 'antenna') { c.strokeStyle = dk; c.lineWidth = 2.4 * s; c.beginPath(); c.moveTo(0, -R * 0.95); c.quadraticCurveTo(R * 0.2, -R * 1.4, R * 0.1 + Math.sin(t * 5) * 3 * s, -R * 1.55); c.stroke(); ell(c, R * 0.1 + Math.sin(t * 5) * 3 * s, -R * 1.58, R * 0.14, R * 0.14, '#ffe27a', dk, 1.6 * s); }
      if (feat === 'tuft') { c.strokeStyle = dk; c.fillStyle = lt; c.lineWidth = 2 * s; for (const d of [-1, 0, 1]) { c.beginPath(); c.moveTo(d * R * 0.2, -R * 0.93); c.quadraticCurveTo(d * R * 0.45, -R * 1.45, d * R * 0.1 + R * 0.3, -R * 1.3); c.quadraticCurveTo(d * R * 0.1, -R * 1.1, d * R * 0.05, -R * 0.93); c.fill(); c.stroke(); } }
      if (feat === 'leaf') { c.save(); c.translate(0, -R * 0.95); c.rotate(-0.4); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(R * 0.5, -R * 0.2, R * 0.1, -R * 0.8); c.quadraticCurveTo(-R * 0.3, -R * 0.35, 0, 0); c.fillStyle = '#5adf7a'; c.fill(); c.lineWidth = 2 * s; c.strokeStyle = '#1f7a3a'; c.stroke(); c.restore(); }
      if (feat === 'zig') { c.beginPath(); c.moveTo(-R * 0.6, -R * 0.75); for (let i = 0; i < 5; i++) { c.lineTo(-R * 0.6 + i * R * 0.3 + R * 0.15, -R * 1.2); c.lineTo(-R * 0.6 + (i + 1) * R * 0.3, -R * 0.82); } c.closePath(); c.fillStyle = '#ffd84a'; c.fill(); c.lineWidth = 2 * s; c.strokeStyle = '#a0721a'; c.stroke(); }
    }
    if (hat) drawHat(c, hat, R, s);
    if (o.flash) { c.globalAlpha = 0.5 * (o.alpha == null ? 1 : o.alpha); c.beginPath(); c.arc(0, 0, R, 0, PI2); c.fillStyle = '#fff'; c.fill(); }
    c.restore();
  };

  function drawHat(c, h, R, s) {
    c.lineWidth = 2 * s; c.strokeStyle = shade(h.c, -60);
    switch (h.style) {
      case 'cap':
        c.beginPath(); c.arc(0, -R * 0.7, R * 0.66, Math.PI, PI2); c.closePath(); c.fillStyle = h.c; c.fill(); c.stroke();
        ell(c, R * 0.32, -R * 0.72, R * 0.5, R * 0.14, shade(h.c, -20), c.strokeStyle, 2 * s);
        ell(c, 0, -R * 1.2, R * 0.1, R * 0.1, '#fff'); break;
      case 'party':
        c.beginPath(); c.moveTo(-R * 0.4, -R * 0.78); c.lineTo(0, -R * 1.65); c.lineTo(R * 0.4, -R * 0.78); c.closePath(); c.fillStyle = h.c; c.fill(); c.stroke();
        c.strokeStyle = '#ffe27a'; c.beginPath(); c.moveTo(-R * 0.28, -R * 1.0); c.lineTo(R * 0.2, -R * 1.2); c.moveTo(-R * 0.15, -R * 1.3); c.lineTo(R * 0.1, -R * 1.4); c.stroke();
        ell(c, 0, -R * 1.68, R * 0.14, R * 0.14, '#ffe27a'); break;
      case 'pirate':
        c.beginPath(); c.moveTo(-R * 0.95, -R * 0.62); c.quadraticCurveTo(0, -R * 1.9, R * 0.95, -R * 0.62); c.quadraticCurveTo(0, -R * 0.85, -R * 0.95, -R * 0.62); c.closePath(); c.fillStyle = h.c; c.fill(); c.stroke();
        ell(c, 0, -R * 0.98, R * 0.14, R * 0.12, '#f2f4fa'); c.fillStyle = '#2a2a36'; c.fillRect(-R * 0.05, -R * 0.93, R * 0.1, R * 0.07); break;
      case 'helmet':
        c.beginPath(); c.arc(0, -R * 0.66, R * 0.74, Math.PI, PI2); c.lineTo(R * 0.74, -R * 0.45); c.lineTo(-R * 0.74, -R * 0.45); c.closePath();
        const hg = c.createLinearGradient(-R, 0, R, 0); hg.addColorStop(0, shade(h.c, 40)); hg.addColorStop(1, shade(h.c, -40)); c.fillStyle = hg; c.fill(); c.stroke();
        c.fillStyle = '#e0405a'; c.fillRect(-R * 0.08, -R * 1.4, R * 0.16, R * 0.75); break;
      case 'wizard':
        ell(c, 0, -R * 0.72, R * 0.95, R * 0.24, shade(h.c, -20), c.strokeStyle, 2 * s);
        c.beginPath(); c.moveTo(-R * 0.55, -R * 0.78); c.quadraticCurveTo(-R * 0.1, -R * 1.5, R * 0.45, -R * 1.9); c.quadraticCurveTo(R * 0.4, -R * 1.2, R * 0.55, -R * 0.78); c.closePath(); c.fillStyle = h.c; c.fill(); c.stroke();
        c.fillStyle = '#ffe27a'; c.beginPath(); c.arc(0, -R * 1.1, R * 0.1, 0, PI2); c.fill(); break;
      case 'viking':
        c.beginPath(); c.arc(0, -R * 0.68, R * 0.7, Math.PI, PI2); c.closePath(); c.fillStyle = '#9aa6bb'; c.fill(); c.stroke();
        for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * R * 0.62, -R * 0.78); c.quadraticCurveTo(d * R * 1.2, -R * 0.9, d * R * 1.0, -R * 1.5); c.quadraticCurveTo(d * R * 0.95, -R * 1.1, d * R * 0.5, -R * 0.95); c.closePath(); c.fillStyle = '#fff3c8'; c.fill(); c.stroke(); }
        break;
      case 'crown':
        c.beginPath(); c.moveTo(-R * 0.6, -R * 0.75); c.lineTo(-R * 0.65, -R * 1.35); c.lineTo(-R * 0.3, -R * 1.05); c.lineTo(0, -R * 1.45); c.lineTo(R * 0.3, -R * 1.05); c.lineTo(R * 0.65, -R * 1.35); c.lineTo(R * 0.6, -R * 0.75); c.closePath();
        c.fillStyle = h.c; c.fill(); c.stroke(); ell(c, 0, -R * 0.95, R * 0.09, R * 0.09, '#ff5a7a'); break;
    }
  }

  // ---------- Sbire (noir, armure de mort) et boss rouge ----------
  WB.drawMinion = function (c, x, y, s, o) {
    o = o || {};
    const boss = !!o.boss, R = 22 * s, t = o.t || 0, ph = o.walk || 0, mv = o.moving ? 1 : 0;
    const body = boss ? '#d4202f' : '#17171f', light = boss ? '#ff5a4a' : '#3a3a4c', dk = boss ? '#6a0a12' : '#07070b';
    const bob = mv ? -Math.abs(Math.sin(ph)) * 3.2 * s : -Math.sin(t * 2.4) * 1.1 * s;
    c.save(); c.translate(x, y); if (o.alpha != null) c.globalAlpha = o.alpha;
    ell(c, 0, R * 0.92, R * 0.95, R * 0.34, 'rgba(0,0,0,.3)'); c.translate(0, bob);
    const fs = mv ? Math.sin(ph) * 4 * s : 0;
    for (const d of [-1, 1]) ell(c, d * R * 0.5, R * 0.86 + (d < 0 ? fs : -fs) * 0.5, R * 0.4, R * 0.26, dk, '#000', 2 * s);
    const g = c.createRadialGradient(-R * 0.3, -R * 0.4, R * 0.1, 0, 0, R * 1.1); g.addColorStop(0, light); g.addColorStop(0.6, body); g.addColorStop(1, dk);
    c.beginPath(); c.arc(0, 0, R, 0, PI2); c.fillStyle = g; c.fill(); c.lineWidth = 2.4 * s; c.strokeStyle = '#000'; c.stroke();
    // côtes d'os
    c.strokeStyle = boss ? '#ffd6c0' : '#bfc3cc'; c.lineWidth = 2.2 * s; c.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const yy = R * (0.22 + i * 0.22), w = R * (0.7 - i * 0.12); c.beginPath(); c.moveTo(-w, yy); c.quadraticCurveTo(0, yy + R * 0.12, w, yy); c.stroke(); }
    c.beginPath(); c.moveTo(0, R * 0.12); c.lineTo(0, R * 0.8); c.stroke(); c.lineCap = 'butt';
    // casque-crâne
    c.beginPath(); c.arc(0, -R * 0.12, R * 0.82, Math.PI * 1.02, Math.PI * 1.98); c.lineTo(R * 0.7, R * 0.02); c.lineTo(-R * 0.7, R * 0.02); c.closePath();
    c.fillStyle = boss ? '#7a0f18' : '#2a2a36'; c.fill(); c.lineWidth = 2 * s; c.strokeStyle = '#000'; c.stroke();
    const eye = boss ? '#ffe45a' : '#e8f4ff';
    for (const d of [-1, 1]) {
      const fl = 0.75 + Math.sin(t * 6 + d) * 0.25;
      ell(c, d * R * 0.3, -R * 0.2, R * 0.2, R * 0.22, '#000');
      c.shadowColor = eye; c.shadowBlur = 10 * s * fl; ell(c, d * R * 0.3, -R * 0.2, R * 0.1, R * 0.12, eye); c.shadowBlur = 0;
    }
    // dents
    c.fillStyle = '#d8dae2'; c.fillRect(-R * 0.3, -R * 0.02, R * 0.6, R * 0.1);
    c.strokeStyle = '#000'; c.lineWidth = 1.2 * s; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * R * 0.12, -R * 0.02); c.lineTo(i * R * 0.12, R * 0.08); c.stroke(); }
    // mains osseuses
    for (const d of [-1, 1]) ell(c, d * R * 1.02, R * 0.25 + (mv ? Math.sin(ph + d) * 3 * s : 0), R * 0.24, R * 0.22, boss ? '#ffd6c0' : '#bfc3cc', '#000', 2 * s);
    if (boss) {
      for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * R * 0.5, -R * 0.78); c.quadraticCurveTo(d * R * 1.3, -R * 1.0, d * R * 1.05, -R * 1.7); c.quadraticCurveTo(d * R * 0.8, -R * 1.1, d * R * 0.25, -R * 0.9); c.closePath(); c.fillStyle = '#f2e4cc'; c.fill(); c.lineWidth = 2 * s; c.strokeStyle = '#000'; c.stroke(); }
      for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * R * 0.8, R * 0.05); c.lineTo(d * R * 1.2, -R * 0.35); c.lineTo(d * R * 0.95, R * 0.3); c.closePath(); c.fillStyle = '#ffd6c0'; c.fill(); c.stroke(); }
    }
    if (o.flash) { c.globalAlpha = 0.5; c.beginPath(); c.arc(0, 0, R, 0, PI2); c.fillStyle = '#fff'; c.fill(); }
    c.restore();
  };

  // ---------- Icônes des capacités ----------
  WB.drawIcon = function (c, id, cx, cy, sz) {
    c.save(); c.translate(cx, cy); const k = sz / 2; c.scale(k, k);
    c.lineJoin = 'round'; c.lineCap = 'round';
    const lw = 0.14;
    switch (id) {
      case 'ice':
        c.strokeStyle = '#bff0ff'; c.lineWidth = lw * 1.2;
        for (let i = 0; i < 3; i++) { c.save(); c.rotate(i * Math.PI / 3); c.beginPath(); c.moveTo(0, -0.85); c.lineTo(0, 0.85); c.stroke();
          c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(-0.2, -0.6); c.lineTo(0, -0.4); c.lineTo(0.2, -0.6); c.moveTo(-0.2, 0.6); c.lineTo(0, 0.4); c.lineTo(0.2, 0.6); c.stroke(); c.lineWidth = lw * 1.2; c.restore(); }
        break;
      case 'fire':
        c.beginPath(); c.moveTo(0, -0.95); c.quadraticCurveTo(0.7, -0.3, 0.65, 0.25); c.quadraticCurveTo(0.6, 0.9, 0, 0.9); c.quadraticCurveTo(-0.65, 0.9, -0.65, 0.2); c.quadraticCurveTo(-0.6, -0.2, -0.25, -0.35); c.quadraticCurveTo(-0.2, -0.65, 0, -0.95); c.closePath();
        c.fillStyle = '#ff7a1c'; c.fill(); c.lineWidth = lw * 0.7; c.strokeStyle = '#a83a00'; c.stroke();
        c.beginPath(); c.moveTo(0, -0.1); c.quadraticCurveTo(0.35, 0.3, 0.3, 0.55); c.quadraticCurveTo(0.2, 0.8, 0, 0.8); c.quadraticCurveTo(-0.3, 0.8, -0.3, 0.45); c.quadraticCurveTo(-0.25, 0.2, 0, -0.1); c.fillStyle = '#ffe27a'; c.fill();
        break;
      case 'hole': {
        const g = c.createRadialGradient(0, 0, 0.05, 0, 0, 0.95); g.addColorStop(0, '#000'); g.addColorStop(0.55, '#1c0a3a'); g.addColorStop(1, '#8a4fe0');
        c.beginPath(); c.arc(0, 0, 0.9, 0, PI2); c.fillStyle = g; c.fill();
        c.strokeStyle = '#d8b8ff'; c.lineWidth = lw * 0.7; c.beginPath();
        for (let a = 0; a < 9; a += 0.2) { const r = 0.12 + a * 0.085; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.stroke(); break; }
      case 'wall':
        c.fillStyle = '#b8a48a'; c.strokeStyle = '#4a3a28'; c.lineWidth = lw * 0.7;
        for (let r = 0; r < 3; r++) for (let q = 0; q < 2; q++) { const x = -0.8 + q * 0.8 + (r % 2 ? 0.4 : 0), y = -0.8 + r * 0.55; c.beginPath(); c.rect(r % 2 && q === 1 ? x - 0.4 : x, y, 0.8, 0.5); c.fill(); c.stroke(); }
        break;
      case 'shield':
        c.beginPath(); c.moveTo(0, -0.95); c.lineTo(0.8, -0.6); c.lineTo(0.7, 0.2); c.quadraticCurveTo(0.5, 0.7, 0, 0.98); c.quadraticCurveTo(-0.5, 0.7, -0.7, 0.2); c.lineTo(-0.8, -0.6); c.closePath();
        c.fillStyle = '#5ab4ff'; c.fill(); c.lineWidth = lw * 0.8; c.strokeStyle = '#1a4f95'; c.stroke();
        c.beginPath(); c.moveTo(0, -0.65); c.lineTo(0.5, -0.4); c.lineTo(0.42, 0.15); c.quadraticCurveTo(0.3, 0.45, 0, 0.62); c.closePath(); c.fillStyle = '#d2ecff'; c.fill(); break;
      case 'tp':
        c.strokeStyle = '#c874ff'; c.lineWidth = lw; c.beginPath(); c.ellipse(0, 0, 0.55, 0.9, 0, 0, PI2); c.stroke();
        c.strokeStyle = '#ffd6ff'; c.lineWidth = lw * 0.6; c.beginPath(); c.ellipse(0, 0, 0.3, 0.6, 0, 0, PI2); c.stroke();
        c.fillStyle = '#fff'; c.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 0.1 : 0.28, a = -Math.PI / 2 + i * Math.PI / 4; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); break;
      case 'dash':
        c.strokeStyle = '#ffd24a'; c.lineWidth = lw * 1.3;
        for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-0.85 + i * 0.5, -0.6); c.lineTo(-0.35 + i * 0.5, 0); c.lineTo(-0.85 + i * 0.5, 0.6); c.globalAlpha = 0.45 + i * 0.27; c.stroke(); } c.globalAlpha = 1; break;
      case 'water':
        c.beginPath(); c.moveTo(0, -0.95); c.quadraticCurveTo(0.85, 0.1, 0.55, 0.55); c.quadraticCurveTo(0.2, 0.98, -0.2, 0.9); c.quadraticCurveTo(-0.8, 0.7, -0.6, 0.2); c.quadraticCurveTo(-0.45, -0.2, 0, -0.95); c.closePath();
        c.fillStyle = '#3fa4ff'; c.fill(); c.lineWidth = lw * 0.7; c.strokeStyle = '#0f4fa0'; c.stroke();
        c.beginPath(); c.ellipse(-0.2, 0.2, 0.12, 0.25, 0.4, 0, PI2); c.fillStyle = 'rgba(255,255,255,.8)'; c.fill(); break;
      case 'wind':
        c.strokeStyle = '#d6f4ee'; c.lineWidth = lw * 1.1;
        c.beginPath(); c.moveTo(-0.9, -0.45); c.lineTo(0.35, -0.45); c.arc(0.35, -0.7, 0.25, Math.PI / 2, -Math.PI * 0.9, true); c.stroke();
        c.beginPath(); c.moveTo(-0.9, 0); c.lineTo(0.6, 0); c.arc(0.6, -0.27, 0.27, Math.PI / 2, -Math.PI, true); c.stroke();
        c.beginPath(); c.moveTo(-0.9, 0.45); c.lineTo(0.2, 0.45); c.arc(0.2, 0.7, 0.25, -Math.PI / 2, Math.PI * 0.9, false); c.stroke(); break;
      case 'scythe':
        c.strokeStyle = '#2a1238'; c.lineWidth = lw * 1.2; c.beginPath(); c.moveTo(0, 0.98); c.lineTo(0, -0.25); c.stroke();
        c.strokeStyle = '#2a1238'; c.lineWidth = lw * 1.1; c.beginPath(); c.moveTo(-0.55, -0.9); c.lineTo(-0.55, -0.45); c.quadraticCurveTo(0, 0.1, 0.55, -0.45); c.lineTo(0.55, -0.9); c.moveTo(0, -1); c.lineTo(0, -0.2); c.stroke();
        c.strokeStyle = '#a66cff'; c.lineWidth = lw * 0.5; c.beginPath(); c.moveTo(-0.55, -0.9); c.lineTo(-0.55, -0.45); c.quadraticCurveTo(0, 0.1, 0.55, -0.45); c.lineTo(0.55, -0.9); c.moveTo(0, -1); c.lineTo(0, -0.2); c.stroke(); break;
      case 'ghost': case 'invis':
        c.beginPath(); c.moveTo(-0.65, 0.85); c.lineTo(-0.65, -0.1); c.quadraticCurveTo(-0.65, -0.9, 0, -0.9); c.quadraticCurveTo(0.65, -0.9, 0.65, -0.1); c.lineTo(0.65, 0.85); c.lineTo(0.3, 0.55); c.lineTo(0, 0.85); c.lineTo(-0.3, 0.55); c.closePath();
        c.fillStyle = 'rgba(235,240,255,.85)'; c.fill(); c.lineWidth = lw * 0.6; c.strokeStyle = '#8a93c0'; c.setLineDash([0.15, 0.1]); c.stroke(); c.setLineDash([]);
        c.fillStyle = '#2a2a50'; c.beginPath(); c.ellipse(-0.25, -0.2, 0.1, 0.17, 0, 0, PI2); c.ellipse(0.25, -0.2, 0.1, 0.17, 0, 0, PI2); c.fill(); break;
      case 'spider':
        c.strokeStyle = '#2a1a3a'; c.lineWidth = lw * 0.75;
        for (const d of [-1, 1]) for (let i = 0; i < 4; i++) { const a = -0.9 + i * 0.6; c.beginPath(); c.moveTo(0, 0); c.lineTo(d * (0.5 + Math.cos(a) * 0.1), Math.sin(a) * 0.5 - 0.15); c.lineTo(d * 0.95, Math.sin(a) * 0.95 + 0.1); c.stroke(); }
        c.fillStyle = '#4a2a6a'; c.beginPath(); c.ellipse(0, 0.12, 0.38, 0.45, 0, 0, PI2); c.fill(); c.beginPath(); c.arc(0, -0.38, 0.25, 0, PI2); c.fill();
        c.fillStyle = '#ff4a5a'; c.beginPath(); c.arc(-0.1, -0.42, 0.06, 0, PI2); c.arc(0.1, -0.42, 0.06, 0, PI2); c.fill(); break;
      case 'clown':
        c.beginPath(); c.arc(0, 0.15, 0.68, 0, PI2); c.fillStyle = '#ffe0c8'; c.fill(); c.lineWidth = lw * 0.6; c.strokeStyle = '#8a5a3a'; c.stroke();
        c.beginPath(); c.moveTo(-0.45, -0.35); c.lineTo(0, -1.0); c.lineTo(0.45, -0.35); c.closePath(); c.fillStyle = '#ff4a8a'; c.fill(); c.stroke();
        c.beginPath(); c.arc(0, -1.0, 0.1, 0, PI2); c.fillStyle = '#ffe27a'; c.fill();
        c.fillStyle = '#ff2a3a'; c.beginPath(); c.arc(0, 0.2, 0.17, 0, PI2); c.fill();
        c.fillStyle = '#1b1730'; c.beginPath(); c.arc(-0.27, 0, 0.08, 0, PI2); c.arc(0.27, 0, 0.08, 0, PI2); c.fill();
        c.strokeStyle = '#ff2a3a'; c.lineWidth = lw * 0.7; c.beginPath(); c.arc(0, 0.35, 0.3, 0.2, Math.PI - 0.2); c.stroke(); break;
      case 'necro':
        c.strokeStyle = '#6a4a30'; c.lineWidth = lw; c.beginPath(); c.moveTo(-0.7, 0.9); c.lineTo(0.5, -0.65); c.stroke();
        c.beginPath(); c.moveTo(0.35, -0.5); c.lineTo(0.9, -0.95); c.lineTo(0.7, -0.35); c.closePath(); c.fillStyle = '#b8f0d0'; c.fill(); c.lineWidth = lw * 0.5; c.strokeStyle = '#2a6a4a'; c.stroke();
        c.beginPath(); c.arc(-0.2, -0.1, 0.4, 0, PI2); c.fillStyle = '#d8dae2'; c.fill(); c.strokeStyle = '#4a4a5a'; c.stroke();
        c.fillStyle = '#1b1730'; c.beginPath(); c.arc(-0.34, -0.15, 0.1, 0, PI2); c.arc(-0.06, -0.15, 0.1, 0, PI2); c.fill(); break;
      case 'turret':
        c.fillStyle = '#59606e'; c.strokeStyle = '#23262e'; c.lineWidth = lw * 0.6;
        c.beginPath(); c.arc(-0.1, 0.25, 0.6, 0, PI2); c.fill(); c.stroke();
        c.save(); c.rotate(-0.5); c.fillStyle = '#8a92a2'; c.fillRect(0, -0.2, 0.95, 0.4); c.strokeRect(0, -0.2, 0.95, 0.4); c.restore();
        c.fillStyle = '#ff9a3c'; c.beginPath(); c.arc(-0.1, 0.25, 0.22, 0, PI2); c.fill(); break;
      case 'jump':
        c.strokeStyle = '#7aeea0'; c.lineWidth = lw * 1.1; c.beginPath(); c.moveTo(0, 0.75); c.lineTo(0, -0.7); c.moveTo(-0.45, -0.25); c.lineTo(0, -0.75); c.lineTo(0.45, -0.25); c.stroke();
        c.lineWidth = lw * 0.9; c.beginPath(); c.moveTo(-0.7, 0.85); c.lineTo(-0.35, 0.65); c.lineTo(0.35, 0.65); c.lineTo(0.7, 0.85); c.stroke(); break;
      case 'bolt':
        c.beginPath(); c.moveTo(0.2, -0.98); c.lineTo(-0.6, 0.15); c.lineTo(-0.05, 0.15); c.lineTo(-0.3, 0.98); c.lineTo(0.65, -0.2); c.lineTo(0.05, -0.2); c.closePath();
        c.fillStyle = '#ffe94a'; c.fill(); c.lineWidth = lw * 0.6; c.strokeStyle = '#a87a00'; c.stroke(); break;
      case 'bomb':
        c.beginPath(); c.arc(0, 0.15, 0.7, 0, PI2); c.fillStyle = '#2a2d3a'; c.fill(); c.lineWidth = lw * 0.6; c.strokeStyle = '#0a0b10'; c.stroke();
        c.strokeStyle = '#c9a06a'; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(0.3, -0.45); c.quadraticCurveTo(0.6, -0.85, 0.85, -0.7); c.stroke();
        c.fillStyle = '#ff9a3c'; c.beginPath(); c.arc(0.88, -0.72, 0.16, 0, PI2); c.fill();
        c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(-0.25, -0.1, 0.18, 0.1, -0.6, 0, PI2); c.fill(); break;
      case 'coin':
        c.beginPath(); c.arc(0, 0, 0.85, 0, PI2); c.fillStyle = '#ffd24a'; c.fill(); c.lineWidth = lw * 0.7; c.strokeStyle = '#a8740a'; c.stroke();
        c.beginPath(); c.arc(0, 0, 0.55, 0, PI2); c.strokeStyle = '#e8a81a'; c.stroke(); break;
      case 'heart':
        c.beginPath(); c.moveTo(0, 0.85); c.bezierCurveTo(-1.1, 0.1, -0.85, -0.95, -0.3, -0.85); c.bezierCurveTo(-0.1, -0.8, 0, -0.55, 0, -0.5); c.bezierCurveTo(0, -0.55, 0.1, -0.8, 0.3, -0.85); c.bezierCurveTo(0.85, -0.95, 1.1, 0.1, 0, 0.85);
        c.fillStyle = '#ff4f6a'; c.fill(); c.lineWidth = lw * 0.7; c.strokeStyle = '#8c1128'; c.stroke(); break;
      case 'trophy':
        c.fillStyle = '#ffd24a'; c.strokeStyle = '#a8740a'; c.lineWidth = lw * 0.6;
        c.beginPath(); c.moveTo(-0.5, -0.8); c.lineTo(0.5, -0.8); c.quadraticCurveTo(0.5, 0.3, 0, 0.4); c.quadraticCurveTo(-0.5, 0.3, -0.5, -0.8); c.fill(); c.stroke();
        c.fillRect(-0.12, 0.35, 0.24, 0.3); c.fillRect(-0.4, 0.65, 0.8, 0.22);
        c.beginPath(); c.arc(-0.55, -0.4, 0.25, Math.PI / 2, Math.PI * 1.5); c.arc(0.55, -0.4, 0.25, -Math.PI / 2, Math.PI / 2); c.stroke(); break;
      case 'lock':
        c.fillStyle = '#9aa2b8'; c.fillRect(-0.55, -0.1, 1.1, 0.85); c.strokeStyle = '#9aa2b8'; c.lineWidth = lw; c.beginPath(); c.arc(0, -0.15, 0.38, Math.PI, 0); c.stroke(); break;
    }
    c.restore();
  };

  // ---------- Sprites du monde ----------
  function mk(w, h, fn) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; fn(cv.getContext('2d'), w, h); return cv; }
  let seedv = 7; function rnd() { seedv = (seedv * 1664525 + 1013904223) >>> 0; return seedv / 4294967296; }

  WB.buildSprites = function (arena) {
    const TS = 64, S = { floors: [], wall: null, wall2: null, water: null, rock: null, trees: [], houses: [], arena: arena };
    seedv = 11;
    const noise = (c, n, cols, rmin, rmax) => { for (let i = 0; i < n; i++) { c.fillStyle = cols[(rnd() * cols.length) | 0]; c.beginPath(); c.arc(rnd() * TS, rnd() * TS, rmin + rnd() * (rmax - rmin), 0, PI2); c.fill(); } };
    if (arena === 'donjon') {
      for (let v = 0; v < 4; v++) S.floors.push(mk(TS, TS, c => {
        c.fillStyle = v === 3 ? '#262938' : '#2c3041'; c.fillRect(0, 0, TS, TS);
        c.strokeStyle = '#1b1e2b'; c.lineWidth = 2; c.strokeRect(1, 1, TS - 2, TS - 2); c.beginPath(); c.moveTo(TS / 2, 0); c.lineTo(TS / 2, TS); c.moveTo(0, TS / 2 + (v - 1) * 3); c.lineTo(TS, TS / 2 + (v - 1) * 3); c.stroke();
        noise(c, 12, ['rgba(255,255,255,.04)', 'rgba(0,0,0,.12)'], 1, 4);
        if (v === 2) { c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(10, 12); c.lineTo(24, 26); c.lineTo(20, 40); c.stroke(); }
      }));
      S.wall = mk(TS, TS, c => {
        c.fillStyle = '#4b5068'; c.fillRect(0, 0, TS, TS); c.fillStyle = '#5d6482'; c.fillRect(0, 0, TS, TS - 10);
        c.strokeStyle = '#2d3042'; c.lineWidth = 2;
        for (let r = 0; r < 3; r++) { const y = r * 18; c.beginPath(); c.moveTo(0, y); c.lineTo(TS, y); c.stroke(); for (let q = 0; q < 2; q++) { const x = q * 32 + (r % 2 ? 16 : 0); c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 18); c.stroke(); } }
        c.fillStyle = '#2d3042'; c.fillRect(0, TS - 10, TS, 10); c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(0, 0, TS, 3);
      });
      S.water = mk(TS, TS, c => { c.fillStyle = '#10394a'; c.fillRect(0, 0, TS, TS); noise(c, 10, ['rgba(60,160,190,.18)'], 4, 10); });
      S.rock = mk(TS, TS, c => { c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(34, 52, 24, 8, 0, 0, PI2); c.fill(); c.fillStyle = '#6b7088'; c.strokeStyle = '#2d3042'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(10, 50); c.lineTo(8, 28); c.lineTo(22, 12); c.lineTo(44, 10); c.lineTo(56, 28); c.lineTo(54, 50); c.closePath(); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(14, 28); c.lineTo(24, 16); c.lineTo(42, 14); c.lineTo(30, 30); c.closePath(); c.fill(); });
    } else if (arena === 'urban') {
      for (let v = 0; v < 5; v++) S.floors.push(mk(TS, TS, c => {
        if (v >= 3) { c.fillStyle = v === 3 ? '#74b04e' : '#6aa646'; c.fillRect(0, 0, TS, TS); noise(c, 14, ['#5e9a3c', '#86c25c'], 2, 6); c.strokeStyle = '#4c8a2c'; c.lineWidth = 1.6; for (let i = 0; i < 5; i++) { const x = rnd() * TS, y = rnd() * TS; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 2, y - 6); c.moveTo(x, y); c.lineTo(x + 2, y - 6); c.stroke(); } return; }
        c.fillStyle = v === 2 ? '#b0aa9a' : '#bab4a3'; c.fillRect(0, 0, TS, TS); c.strokeStyle = '#8f8a7b'; c.lineWidth = 2; c.strokeRect(1, 1, TS - 2, TS - 2);
        c.beginPath(); c.moveTo(TS / 2, 0); c.lineTo(TS / 2, TS); c.moveTo(0, TS / 2); c.lineTo(TS, TS / 2); c.stroke(); noise(c, 8, ['rgba(0,0,0,.06)', 'rgba(255,255,255,.1)'], 1, 4);
      }));
      S.wall = mk(TS, TS, c => { // haie
        c.fillStyle = '#143a1a'; c.fillRect(0, 0, TS, TS); noise(c, 22, ['#1f5a26', '#2a7230', '#37963d', '#2f8a36'], 8, 14); noise(c, 10, ['#4fb04a', '#5cc055'], 4, 8);
        c.fillStyle = 'rgba(255,90,120,.9)'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(8 + rnd() * 48, 8 + rnd() * 48, 2.6, 0, PI2); c.fill(); }
      });
      S.water = mk(TS, TS, c => { c.fillStyle = '#3d94d0'; c.fillRect(0, 0, TS, TS); noise(c, 8, ['rgba(255,255,255,.12)'], 4, 10); });
      S.rock = mk(TS, TS, c => { c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(34, 50, 22, 8, 0, 0, PI2); c.fill(); c.fillStyle = '#9da1ab'; c.strokeStyle = '#555963'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(12, 48); c.lineTo(10, 30); c.lineTo(24, 16); c.lineTo(44, 18); c.lineTo(54, 34); c.lineTo(50, 48); c.closePath(); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(26, 28, 10, 5, -0.5, 0, PI2); c.fill(); });
    } else {
      for (let v = 0; v < 5; v++) S.floors.push(mk(TS, TS, c => {
        c.fillStyle = ['#63b043', '#68b648', '#5eab3f', '#6cba4b', '#a8895a'][v]; c.fillRect(0, 0, TS, TS);
        if (v === 4) { noise(c, 20, ['#9a7a4a', '#b89a68'], 2, 6); return; }
        noise(c, 16, ['#55a038', '#78c456'], 2, 7); c.strokeStyle = '#3f8a2c'; c.lineWidth = 1.6;
        for (let i = 0; i < 6; i++) { const x = rnd() * TS, y = rnd() * TS; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 3, y - 7); c.moveTo(x, y); c.lineTo(x, y - 9); c.moveTo(x, y); c.lineTo(x + 3, y - 7); c.stroke(); }
        if (v === 3) for (let i = 0; i < 3; i++) { c.fillStyle = ['#fff', '#ffe45c', '#ff9ec4'][i]; c.beginPath(); c.arc(8 + rnd() * 48, 8 + rnd() * 48, 2.6, 0, PI2); c.fill(); }
      }));
      S.wall = mk(TS, TS, c => { // colline rocheuse
        c.fillStyle = '#6e6a5e'; c.fillRect(0, 0, TS, TS); noise(c, 16, ['#8a8576', '#5a574d', '#7c786a'], 6, 14); c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.ellipse(26, 18, 18, 8, -0.3, 0, PI2); c.fill();
        c.fillStyle = 'rgba(40,60,20,.35)'; c.fillRect(0, TS - 12, TS, 12);
      });
      S.wall2 = mk(TS, TS, c => { // barrière en bois
        c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(2, 40, TS - 4, 14);
        c.fillStyle = '#8a5a34'; c.strokeStyle = '#43290f'; c.lineWidth = 2;
        c.fillRect(0, 14, TS, 8); c.strokeRect(0, 14, TS, 8); c.fillRect(0, 34, TS, 8); c.strokeRect(0, 34, TS, 8);
        for (const x of [6, 32, 58]) { c.fillStyle = '#a06a3c'; c.fillRect(x - 5, 6, 10, 46); c.strokeRect(x - 5, 6, 10, 46); }
      });
      S.water = mk(TS, TS, c => { c.fillStyle = '#2f86d6'; c.fillRect(0, 0, TS, TS); noise(c, 8, ['rgba(255,255,255,.12)'], 4, 10); });
      S.rock = mk(TS, TS, c => { c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(34, 50, 22, 8, 0, 0, PI2); c.fill(); c.fillStyle = '#8e929c'; c.strokeStyle = '#555963'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(12, 48); c.lineTo(10, 30); c.lineTo(24, 16); c.lineTo(44, 18); c.lineTo(54, 34); c.lineTo(50, 48); c.closePath(); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(26, 28, 10, 5, -0.5, 0, PI2); c.fill(); });
    }
    // arbres
    const pal = arena === 'donjon' ? [['#2a2a3a', '#3b3b52', '#55557a']] : [['#1d5530', '#2f8038', '#5cb552'], ['#16443a', '#23705a', '#47ab8c'], ['#9a3d17', '#d9702a', '#f2b13d']];
    for (let v = 0; v < 6; v++) S.trees.push(mk(128, 128, c => {
      const cx = 64, cy = 62, r = 38, p = pal[v % pal.length];
      c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(cx + 12, cy + 24, r * 0.95, r * 0.6, 0, 0, PI2); c.fill();
      c.fillStyle = '#5a3a20'; c.fillRect(cx - 6, cy + 16, 12, 22);
      if (v % 3 === 1 && arena !== 'donjon') {
        for (const [sc, col, rt] of [[1, p[0], 0], [0.74, p[1], 0.2], [0.46, p[2], 0.4]]) { c.beginPath(); for (let i = 0; i < 18; i++) { const rr = i % 2 ? r * sc * 0.62 : r * sc, a = rt + i * Math.PI / 9 - Math.PI / 2; c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } c.closePath(); c.fillStyle = col; c.fill(); }
        return;
      }
      const a0 = rnd() * 6, lobes = [[0, 0, r]]; for (let i = 0; i < 6; i++) lobes.push([Math.cos(a0 + i * Math.PI / 3) * r * 0.56, Math.sin(a0 + i * Math.PI / 3) * r * 0.56, r * 0.62]);
      for (const [dx, dy, rr] of lobes) { c.fillStyle = p[0]; c.beginPath(); c.arc(cx + dx, cy + dy, rr, 0, PI2); c.fill(); }
      for (const [dx, dy, rr] of lobes) { c.fillStyle = p[1]; c.beginPath(); c.arc(cx + dx - rr * 0.1, cy + dy - rr * 0.12, rr * 0.8, 0, PI2); c.fill(); }
      for (const [dx, dy, rr] of lobes) { c.fillStyle = p[2]; c.globalAlpha = 0.9; c.beginPath(); c.arc(cx + dx - rr * 0.25, cy + dy - rr * 0.28, rr * 0.42, 0, PI2); c.fill(); c.globalAlpha = 1; }
      if (v % 3 === 0 && arena !== 'donjon') { c.fillStyle = '#ff4a4a'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(cx + (rnd() - 0.5) * r * 1.2, cy + (rnd() - 0.5) * r * 1.2, 3.4, 0, PI2); c.fill(); } }
    }));
    // maisons (3x2 cases)
    const roofs = [['#e0795a', '#c4553a', '#8f3624', '#5e2216'], ['#7fa0cc', '#5d7fa8', '#3f5c86', '#2a3f5e'], ['#b88a5a', '#9a7048', '#6f4d2c', '#46301a']];
    for (const rf of roofs) S.houses.push(mk(TS * 3 + 20, TS * 2 + 34, (c, w, h) => {
      const X = 10, Y = 6, PW = TS * 3, PH = TS * 2;
      c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(X + 10, Y + 14, PW, PH);
      c.fillStyle = '#8a5a34'; c.strokeStyle = '#43290f'; c.lineWidth = 2; c.fillRect(X + PW / 2 - 28, Y + PH - 4, 56, 24); c.strokeRect(X + PW / 2 - 28, Y + PH - 4, 56, 24);
      c.fillStyle = '#3a2a22'; c.fillRect(X - 4, Y - 4, PW + 8, PH + 8);
      let g = c.createLinearGradient(0, Y, 0, Y + PH / 2); g.addColorStop(0, rf[0]); g.addColorStop(1, rf[1]); c.fillStyle = g; c.fillRect(X, Y, PW, PH / 2);
      g = c.createLinearGradient(0, Y + PH / 2, 0, Y + PH); g.addColorStop(0, rf[1]); g.addColorStop(1, rf[2]); c.fillStyle = g; c.fillRect(X, Y + PH / 2, PW, PH / 2);
      c.strokeStyle = rf[2]; c.globalAlpha = 0.4; c.lineWidth = 1.4; for (let half = 0; half < 2; half++) for (let yy = 10; yy < PH / 2; yy += 10) { c.beginPath(); c.moveTo(X + 3, Y + half * PH / 2 + yy); c.lineTo(X + PW - 3, Y + half * PH / 2 + yy); c.stroke(); } c.globalAlpha = 1;
      c.fillStyle = rf[3]; c.fillRect(X, Y + PH / 2 - 5, PW, 10); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(X, Y + PH / 2 - 5, PW, 3);
      c.fillStyle = '#9a9aa4'; c.strokeStyle = '#55555f'; c.lineWidth = 2.5; c.fillRect(X + PW - 52, Y + 14, 28, 28); c.strokeRect(X + PW - 52, Y + 14, 28, 28); c.fillStyle = '#2a2a32'; c.fillRect(X + PW - 45, Y + 21, 14, 14);
      c.fillStyle = '#a8dcff'; c.strokeStyle = '#35495e'; c.fillRect(X + 26, Y + PH / 2 + 12, 36, 26); c.strokeRect(X + 26, Y + PH / 2 + 12, 36, 26); c.beginPath(); c.moveTo(X + 44, Y + PH / 2 + 12); c.lineTo(X + 44, Y + PH / 2 + 38); c.stroke();
      c.strokeStyle = '#2a1c16'; c.lineWidth = 2.5; c.strokeRect(X - 4, Y - 4, PW + 8, PH + 8);
    }));
    return S;
  };
})(window.WB);
