'use strict';
(function (WB) {
  const TS = 64, GW = 72, GH = 44;
  WB.TS = TS; WB.GW = GW; WB.GH = GH; WB.WW = TS * GW; WB.WH = TS * GH;
  // codes : 0 sol, 1 mur, 2 eau, 3 arbre, 4 maison, 5 rocher, 6 barrière
  const SOLID = [0, 1, 0, 1, 1, 1, 1];
  const INSET = [0, 0, 0, 16, 0, 10, 0];

  function rng(seed) { let s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function resolve(e, x0, y0, x1, y1) {
    const cx = clamp(e.x, x0, x1), cy = clamp(e.y, y0, y1);
    const dx = e.x - cx, dy = e.y - cy, d2 = dx * dx + dy * dy;
    if (d2 >= e.r * e.r) return false;
    if (d2 < 1e-6) {
      const l = e.x - x0, r = x1 - e.x, t = e.y - y0, b = y1 - e.y, m = Math.min(l, r, t, b);
      if (m === l) e.x = x0 - e.r; else if (m === r) e.x = x1 + e.r; else if (m === t) e.y = y0 - e.r; else e.y = y1 + e.r;
    } else { const d = Math.sqrt(d2), p = (e.r - d) / d; e.x += dx * p; e.y += dy * p; }
    return true;
  }

  WB.makeWorld = function (arenaId, seed) {
    const R = rng(seed), g = new Uint8Array(GW * GH);
    const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < GW && y < GH) g[y * GW + x] = v; };
    const get = (x, y) => (x < 0 || y < 0 || x >= GW || y >= GH) ? 1 : g[y * GW + x];
    for (let x = 0; x < GW; x++) { set(x, 0, 1); set(x, GH - 1, 1); }
    for (let y = 0; y < GH; y++) { set(0, y, 1); set(GW - 1, y, 1); }
    const P = { donjon: { depth: 4, min: 11, gaps: 1, wall: 1 }, urban: { depth: 3, min: 13, gaps: 2, wall: 1 }, nature: { depth: 2, min: 15, gaps: 3, wall: 6 } }[arenaId];

    function divide(x0, y0, x1, y1, d) {
      const w = x1 - x0 + 1, h = y1 - y0 + 1;
      if (d >= P.depth || (w < P.min && h < P.min)) return;
      let horiz = w < h ? true : (w > h ? false : R() < 0.5);
      if (horiz && h < P.min) horiz = false; else if (!horiz && w < P.min) horiz = true;
      if (horiz) {
        if (h < P.min) return;
        const wy = y0 + 4 + Math.floor(R() * (h - 8));
        for (let x = x0; x <= x1; x++) set(x, wy, P.wall);
        for (let k = 0; k < P.gaps; k++) { const gx = x0 + Math.floor(R() * (w - 3)); for (let i = 0; i < 3; i++) set(gx + i, wy, 0); }
        divide(x0, y0, x1, wy - 1, d + 1); divide(x0, wy + 1, x1, y1, d + 1);
      } else {
        if (w < P.min) return;
        const wx = x0 + 4 + Math.floor(R() * (w - 8));
        for (let y = y0; y <= y1; y++) set(wx, y, P.wall);
        for (let k = 0; k < P.gaps; k++) { const gy = y0 + Math.floor(R() * (h - 3)); for (let i = 0; i < 3; i++) set(wx, gy + i, 0); }
        divide(x0, y0, wx - 1, y1, d + 1); divide(wx + 1, y0, x1, y1, d + 1);
      }
    }
    divide(1, 1, GW - 2, GH - 2, 0);

    function blob(cx, cy, rx, ry, code, onlyFloor) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1 && x > 2 && y > 2 && x < GW - 3 && y < GH - 3 && (!onlyFloor || get(x, y) === 0)) set(x, y, code);
      }
    }
    function areaFree(x, y, w, h, m) {
      for (let j = y - m; j < y + h + m; j++) for (let i = x - m; i < x + w + m; i++) if (get(i, j) !== 0) return false;
      return true;
    }
    const houses = [];
    if (arenaId === 'nature') {
      for (let i = 0; i < 9; i++) blob(5 + R() * (GW - 10), 5 + R() * (GH - 10), 2 + R() * 2.5, 1.5 + R() * 2, 1, true);
      for (let i = 0; i < 7; i++) blob(6 + R() * (GW - 12), 6 + R() * (GH - 12), 2.5 + R() * 3, 2 + R() * 2.2, 2, true);
    } else if (arenaId === 'urban') {
      for (let i = 0; i < 3; i++) blob(8 + R() * (GW - 16), 8 + R() * (GH - 16), 2 + R() * 1.5, 1.5 + R() * 1, 2, true);
    } else {
      for (let i = 0; i < 6; i++) blob(5 + R() * (GW - 10), 5 + R() * (GH - 10), 1.2 + R() * 1.2, 1 + R() * 1.2, 2, true);
    }
    // maisons accessibles : 6 x 5 cases, murs pleins, une porte en bas, une cloison avec passage, intérieur marqué dans room[]
    const room = new Uint8Array(GW * GH), reserved = new Uint8Array(GW * GH);
    const nHouses = arenaId === 'urban' ? 10 : (arenaId === 'nature' ? 4 : 0), HW = 6, HH = 5;
    for (let tries = 0, n = 0; n < nHouses && tries < 1500; tries++) {
      const x = 3 + Math.floor(R() * (GW - 10)), y = 3 + Math.floor(R() * (GH - 10));
      if (!areaFree(x, y, HW, HH, 1)) continue;
      for (let j = 0; j < HH; j++) for (let i = 0; i < HW; i++) set(x + i, y + j, 4);
      for (let j = 1; j <= 3; j++) for (let i = 1; i <= 4; i++) { set(x + i, y + j, 0); room[(y + j) * GW + x + i] = n + 1; reserved[(y + j) * GW + x + i] = 1; }
      set(x + 2, y + 4, 0); room[(y + 4) * GW + x + 2] = n + 1; reserved[(y + 4) * GW + x + 2] = 1;
      for (let i = 0; i < 4; i++) reserved[(y + 5) * GW + x + 1 + i] = 1;
      set(x + 3, y + 1, 4); set(x + 3, y + 2, 4); room[(y + 1) * GW + x + 3] = 0; room[(y + 2) * GW + x + 3] = 0;
      houses.push({ tx: x, ty: y, w: HW, h: HH, id: n + 1, style: Math.floor(R() * 3) }); n++;
    }
    const nTrees = { donjon: 0, urban: 55, nature: 200 }[arenaId], nRocks = { donjon: 55, urban: 14, nature: 26 }[arenaId];
    for (let tries = 0, n = 0; n < nTrees && tries < 4000; tries++) {
      const x = 2 + Math.floor(R() * (GW - 4)), y = 2 + Math.floor(R() * (GH - 4));
      if (get(x, y) !== 0 || reserved[y * GW + x]) continue; set(x, y, 3); n++;
    }
    for (let tries = 0, n = 0; n < nRocks && tries < 2000; tries++) {
      const x = 2 + Math.floor(R() * (GW - 4)), y = 2 + Math.floor(R() * (GH - 4));
      if (get(x, y) !== 0 || reserved[y * GW + x]) continue; set(x, y, 5); n++;
    }
    // zones d'herbes : petites taches réparties sur le terrain, jamais dans une maison ni devant une porte
    const grass = new Uint8Array(GW * GH), nGrass = { donjon: 11, urban: 13, nature: 16 }[arenaId];
    for (let k = 0, tries = 0; k < nGrass && tries < 400; tries++) {
      const cx = 4 + Math.floor(R() * (GW - 8)), cy = 4 + Math.floor(R() * (GH - 8)), rx = 1.1 + R() * 1.3, ry = 1.0 + R() * 1.1;
      if (get(cx, cy) !== 0 || reserved[cy * GW + cx]) continue;
      let cnt = 0;
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx, dy = (y - cy) / ry; if (dx * dx + dy * dy > 1) continue;
        if (get(x, y) === 0 && !reserved[y * GW + x]) { grass[y * GW + x] = 1; cnt++; }
      }
      if (cnt) k++;
    }
    // connectivité : tout sol inatteignable devient mur
    let sx = GW >> 1, sy = GH >> 1, found = false;
    for (let r = 0; r < 20 && !found; r++) for (let j = -r; j <= r && !found; j++) for (let i = -r; i <= r; i++) if (get(sx + i, sy + j) === 0) { sx += i; sy += j; found = true; break; }
    const seen = new Uint8Array(GW * GH), q = [sy * GW + sx]; seen[q[0]] = 1;
    for (let h = 0; h < q.length; h++) {
      const c = q[h], x = c % GW, y = (c / GW) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (get(nx, ny) === 0 && !seen[ny * GW + nx]) { seen[ny * GW + nx] = 1; q.push(ny * GW + nx); } }
    }
    for (let i = 0; i < g.length; i++) if (g[i] === 0 && !seen[i]) g[i] = 1;

    const W = {
      arena: arenaId, g: g, houses: houses, room: room, grass: grass, vents: [], torches: [], spiderHomes: [], spawns: [], time: 0,
      code: function (tx, ty) { return (tx < 0 || ty < 0 || tx >= GW || ty >= GH) ? 1 : g[ty * GW + tx]; },
      codeAt: function (x, y) { return W.code(Math.floor(x / TS), Math.floor(y / TS)); },
      isWaterAt: function (x, y) { return W.codeAt(x, y) === 2; },
      roomAt: function (x, y) { const tx = Math.floor(x / TS), ty = Math.floor(y / TS); return (tx < 0 || ty < 0 || tx >= GW || ty >= GH) ? 0 : room[ty * GW + tx]; },
      grassAt: function (x, y) { const tx = Math.floor(x / TS), ty = Math.floor(y / TS); return (tx < 0 || ty < 0 || tx >= GW || ty >= GH) ? 0 : grass[ty * GW + tx]; },
      // vrai si un morceau du disque (x, y, r) touche une case d'herbe
      grassNear: function (x, y, r) {
        const x0 = Math.floor((x - r) / TS), x1 = Math.floor((x + r) / TS), y0 = Math.floor((y - r) / TS), y1 = Math.floor((y + r) / TS);
        for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (tx >= 0 && ty >= 0 && tx < GW && ty < GH && grass[ty * GW + tx]) {
          const cx = Math.max(tx * TS, Math.min(x, (tx + 1) * TS)), cy = Math.max(ty * TS, Math.min(y, (ty + 1) * TS)); if ((cx - x) * (cx - x) + (cy - y) * (cy - y) <= r * r) return true;
        }
        return false;
      },
      pass: function (tx, ty) { return W.code(tx, ty) === 0; },
      collide: function (e, rects) {
        const r = e.r; let hit = false;
        const x0 = Math.floor((e.x - r) / TS), x1 = Math.floor((e.x + r) / TS), y0 = Math.floor((e.y - r) / TS), y1 = Math.floor((e.y + r) / TS);
        for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
          const c = W.code(tx, ty); if (!SOLID[c]) continue;
          const ins = INSET[c]; if (resolve(e, tx * TS + ins, ty * TS + ins, (tx + 1) * TS - ins, (ty + 1) * TS - ins)) hit = true;
        }
        if (rects) for (const w of rects) if (resolve(e, w.x - w.w / 2, w.y - w.h / 2, w.x + w.w / 2, w.y + w.h / 2)) hit = true;
        return hit;
      },
      solidAt: function (x, y) { const c = W.codeAt(x, y); if (!SOLID[c]) return false; const ins = INSET[c]; const lx = x - Math.floor(x / TS) * TS, ly = y - Math.floor(y / TS) * TS; return lx >= ins && lx <= TS - ins && ly >= ins && ly <= TS - ins; },
      los: function (x0, y0, x1, y1) {
        const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 24);
        for (let i = 1; i < n; i++) { const t = i / n; if (W.solidAt(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false; }
        return true;
      },
      nearFloor: function (x, y, maxR) {
        const tx = Math.floor(x / TS), ty = Math.floor(y / TS);
        for (let r = 0; r <= (maxR || 6); r++) {
          const cand = [];
          for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (Math.max(Math.abs(i), Math.abs(j)) === r && W.pass(tx + i, ty + j)) cand.push([tx + i, ty + j]);
          if (cand.length) { const c = cand[Math.floor(Math.random() * cand.length)]; return { x: c[0] * TS + TS / 2, y: c[1] * TS + TS / 2 }; }
        }
        return { x: x, y: y };
      },
      randomFloor: function (margin) {
        for (let t = 0; t < 200; t++) {
          const tx = 2 + Math.floor(Math.random() * (GW - 4)), ty = 2 + Math.floor(Math.random() * (GH - 4));
          if (!W.pass(tx, ty) || room[ty * GW + tx]) continue;
          let ok = true;
          if (margin) for (let j = -margin; j <= margin && ok; j++) for (let i = -margin; i <= margin; i++) if (!W.pass(tx + i, ty + j)) { ok = false; break; }
          if (ok) return { x: tx * TS + TS / 2, y: ty * TS + TS / 2 };
        }
        return { x: 3 * TS, y: 3 * TS };
      },
      // BFS 8 directions, retourne la liste de points du monde
      path: function (sx, sy, gx, gy) {
        let stx = Math.floor(sx / TS), sty = Math.floor(sy / TS), gtx = Math.floor(gx / TS), gty = Math.floor(gy / TS);
        if (!W.pass(gtx, gty)) { const f = W.nearFloor(gx, gy, 4); gtx = Math.floor(f.x / TS); gty = Math.floor(f.y / TS); }
        if (!W.pass(stx, sty)) { const f = W.nearFloor(sx, sy, 3); stx = Math.floor(f.x / TS); sty = Math.floor(f.y / TS); }
        if (stx === gtx && sty === gty) return [{ x: gx, y: gy }];
        const prev = W._prev || (W._prev = new Int32Array(GW * GH)); prev.fill(-1);
        const qu = W._q || (W._q = new Int32Array(GW * GH));
        let qh = 0, qt = 0; const s0 = sty * GW + stx, g0 = gty * GW + gtx; qu[qt++] = s0; prev[s0] = s0;
        const D = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        while (qh < qt && prev[g0] < 0) {
          const c = qu[qh++], x = c % GW, y = (c / GW) | 0;
          for (let k = 0; k < 8; k++) {
            const dx = D[k][0], dy = D[k][1], nx = x + dx, ny = y + dy;
            if (!W.pass(nx, ny) || prev[ny * GW + nx] >= 0) continue;
            if (dx && dy && (!W.pass(x + dx, y) || !W.pass(x, y + dy))) continue;
            prev[ny * GW + nx] = c; qu[qt++] = ny * GW + nx;
          }
        }
        if (prev[g0] < 0) return [{ x: gx, y: gy }];
        const pts = []; let c = g0;
        while (c !== s0) { pts.push({ x: (c % GW) * TS + TS / 2, y: ((c / GW) | 0) * TS + TS / 2 }); c = prev[c]; }
        pts.reverse(); return pts;
      },
      ventState: function (v, t) {
        const p = (t + v.phase) % v.period;
        if (p < v.period - v.warn - v.on) return 0;
        return p < v.period - v.on ? 1 : 2;
      }
    };

    // points d'apparition : échantillonnage du plus éloigné
    const cands = [];
    for (let ty = 3; ty < GH - 3; ty++) for (let tx = 3; tx < GW - 3; tx++) {
      let ok = !room[ty * GW + tx]; for (let j = -1; j <= 1 && ok; j++) for (let i = -1; i <= 1; i++) if (!W.pass(tx + i, ty + j) || room[(ty + j) * GW + tx + i]) { ok = false; break; }
      if (ok) cands.push({ x: tx * TS + TS / 2, y: ty * TS + TS / 2 });
    }
    const spawns = [cands[Math.floor(R() * cands.length)]];
    while (spawns.length < 24) {
      let best = null, bd = -1;
      for (let k = 0; k < 90; k++) {
        const c = cands[Math.floor(R() * cands.length)]; let md = 1e9;
        for (const s of spawns) md = Math.min(md, Math.hypot(c.x - s.x, c.y - s.y));
        if (md > bd) { bd = md; best = c; }
      }
      spawns.push(best);
    }
    W.spawns = spawns;
    const farFromSpawn = (p, d) => spawns.every(s => Math.hypot(p.x - s.x, p.y - s.y) > d);
    const nVents = { donjon: 16, urban: 9, nature: 7 }[arenaId];
    for (let tries = 0; W.vents.length < nVents && tries < 400; tries++) {
      const p = cands[Math.floor(R() * cands.length)]; if (!farFromSpawn(p, 260)) continue;
      W.vents.push({ x: p.x, y: p.y, phase: R() * 5, period: 4.6, warn: 0.9, on: 1.5 });
    }
    const nSp = { donjon: 14, urban: 7, nature: 11 }[arenaId];
    for (let tries = 0; W.spiderHomes.length < nSp && tries < 400; tries++) {
      const p = cands[Math.floor(R() * cands.length)]; if (!farFromSpawn(p, 300)) continue;
      W.spiderHomes.push({ x: p.x, y: p.y });
    }
    if (arenaId === 'donjon') for (let ty = 1; ty < GH - 2; ty++) for (let tx = 1; tx < GW - 1; tx++) if (get(tx, ty) === 1 && get(tx, ty + 1) === 0 && R() < 0.2) W.torches.push({ x: tx * TS + TS / 2, y: ty * TS + TS - 6, ph: R() * 6 });
    W.sprites = WB.buildSprites(arenaId);
    return W;
  };
})(window.WB);
