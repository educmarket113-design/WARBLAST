'use strict';
(function (WB) {
  const U = WB.ui = { screen: 'title', t: 0, save: null, VW: 860, VH: 540, S: 1, W: 0, H: 0, dpr: 1, platformPaused: false, toast: null, playType: 'world', friend: { code: '', fill: true } };
  const PI2 = Math.PI * 2, FONT = '"Trebuchet MS","Segoe UI",Arial,sans-serif';
  let cv, ctx, btns = [], pressed = null, hover = null, mouseX = -1, mouseY = -1;
  const sel = { mode: 'solo', arena: 'nature' };
  U.sel = sel;
  // Les boutons sont recréés à chaque image : on les compare par position, pas par identité d'objet.
  // (Sinon un appui qui dure plus d'une image, donc tout appui réel au doigt, ne déclenche rien.)
  U.sameBtn = function (a, b) { return !!a && !!b && a.id === b.id && Math.abs(a.x - b.x) < 8 && Math.abs(a.y - b.y) < 8; };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  // ---------- initialisation ----------
  U.applyAudio = function (s) { s = s || U.save; WB.snd.setEnabled(s.sound !== false); WB.snd.setSfxVolume(s.sfxVol == null ? 1 : s.sfxVol); WB.snd.setMusic(s.music !== false, s.musVol == null ? 0.6 : s.musVol); };
  U.init = function (canvas, save) {
    cv = U.cv = canvas; ctx = U.ctx = canvas.getContext('2d'); U.save = save;
    WB.snd.setEnabled(save.sound !== false); U.applyAudio(save);
    U.resize();
    // L'orientation d'un téléphone change parfois sans événement fiable ou avec des valeurs périmées :
    // on écoute tous les signaux possibles et on revérifie à chaque image (voir U.frame).
    window.addEventListener('resize', U.resize);
    window.addEventListener('orientationchange', function () { U.resize(); [100, 300, 700, 1500].forEach(function (d) { setTimeout(U.resize, d); }); });
    window.addEventListener('pageshow', U.resize);
    document.addEventListener('fullscreenchange', function () { U.resize(); setTimeout(U.resize, 300); });
    try { if (window.visualViewport) window.visualViewport.addEventListener('resize', U.resize); } catch (e) {}
    try { if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', function () { [0, 300, 900].forEach(function (d) { setTimeout(U.resize, d); }); }); } catch (e) {}
    cv.addEventListener('pointerdown', function (e) { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) {} onPointer('down', e); });
    cv.addEventListener('pointermove', function (e) { e.preventDefault(); onPointer('move', e); });
    cv.addEventListener('pointerup', function (e) { e.preventDefault(); onPointer('up', e); });
    cv.addEventListener('pointercancel', function (e) { onPointer('up', e); });
    cv.addEventListener('lostpointercapture', function (e) { if (U.releasePointer) U.releasePointer(e.pointerId); });
    window.addEventListener('pointerup', function (e) { if (U.releasePointer) U.releasePointer(e.pointerId); });
    window.addEventListener('pointercancel', function (e) { if (U.releasePointer) U.releasePointer(e.pointerId); });
    window.addEventListener('blur', function () { if (U.resetSticks) U.resetSticks(); });
    window.addEventListener('orientationchange', function () { if (U.resetSticks) U.resetSticks(); });
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  };
  U.resize = function () {
    const de = document.documentElement;
    const iw = (cv && cv.clientWidth) || window.innerWidth || de.clientWidth || 860, ih = (cv && cv.clientHeight) || window.innerHeight || de.clientHeight || 540;
    const w = Math.max(320, iw), h = Math.max(240, ih);
    U.dpr = Math.min(2, window.devicePixelRatio || 1); U.seenW = iw; U.seenH = ih; U.seenR = U.dpr;
    U.W = w; U.H = h; cv.width = Math.round(w * U.dpr); cv.height = Math.round(h * U.dpr);
    U.S = Math.min(h / 540, w / 860); U.VW = w / U.S; U.VH = h / U.S;
  };
  // ----- saisie du pseudo : vrai champ texte (clavier du téléphone, lettres, chiffres, emojis) -----
  U.editName = function () {
    if (document.getElementById('namebox')) return;
    const ov = document.createElement('div'); ov.id = 'namebox';
    ov.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:50;background:rgba(5,8,22,.88);display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;font-family:system-ui,sans-serif';
    ov.innerHTML = '<div style="background:#18204a;border:3px solid #6f8cff;border-radius:18px;padding:18px;width:min(92vw,420px);box-sizing:border-box;color:#fff;text-align:center">' +
      '<div style="font-size:20px;font-weight:700;margin-bottom:10px">Ton pseudo</div>' +
      '<input id="nameinput" type="text" autocomplete="off" autocapitalize="words" spellcheck="false" enterkeyhint="done" placeholder="Écris ton nom" style="width:100%;box-sizing:border-box;font-size:22px;padding:12px;border-radius:12px;border:2px solid #9db4ff;background:#0d1330;color:#fff;text-align:center;outline:none">' +
      '<div id="namemsg" style="min-height:20px;font-size:14px;color:#ffb0b0;margin:6px 0">16 caractères au maximum. Lettres, chiffres et emojis acceptés.</div>' +
      '<div style="display:flex;gap:10px;justify-content:center"><button id="namecancel" style="flex:1;font-size:18px;padding:12px;border-radius:12px;border:0;background:#4a5378;color:#fff">Annuler</button>' +
      '<button id="namesave" style="flex:1;font-size:18px;font-weight:700;padding:12px;border-radius:12px;border:0;background:#3bbf5a;color:#fff">Enregistrer</button></div></div>';
    document.body.appendChild(ov);
    const inp = ov.querySelector('#nameinput'), msg = ov.querySelector('#namemsg'); inp.value = U.save.name || '';
    function close() { if (ov.parentNode) ov.parentNode.removeChild(ov); }
    function save() {
      const chars = Array.from(inp.value.replace(/[\u0000-\u001f\u007f]/g, '').trim());
      if (!chars.length) { msg.textContent = 'Écris au moins un caractère.'; return; }
      U.save.name = chars.slice(0, 16).join(''); U.commit(); WB.snd.play('coin'); close(); U.showToast('Nom enregistré : ' + U.save.name, '#9dffb0');
    }
    inp.addEventListener('input', function () { const a = Array.from(inp.value); if (a.length > 16) inp.value = a.slice(0, 16).join(''); msg.textContent = ''; });
    inp.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') save(); else if (e.key === 'Escape') close(); });
    ov.querySelector('#namesave').addEventListener('click', save); ov.querySelector('#namecancel').addEventListener('click', close);
    setTimeout(function () { try { inp.focus(); inp.select(); } catch (e) {} }, 60);
  };
  U.commit = function () { WB.sdk.save(U.save); };
  U.go = function (s) { U.screen = s; U.t = 0; btns = []; pressed = null; WB.snd.music(s === 'game' ? 'battle' : 'menu'); if (U.resetSticks) U.resetSticks(); };
  U.showToast = function (txt, col) { U.toast = { txt: txt, t: 2.2, col: col || '#fff' }; };

  // ---------- dessin de base ----------
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  U.rr = rr;
  function text(s, x, y, size, col, align, stroke) {
    ctx.font = 'bold ' + size + 'px ' + FONT; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    if (stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = stroke; ctx.strokeStyle = 'rgba(10,14,30,.9)'; ctx.strokeText(s, x, y); }
    ctx.fillStyle = col || '#fff'; ctx.fillText(s, x, y);
  }
  U.text = text;
  function panel(x, y, w, h, o) {
    o = o || {}; ctx.save(); rr(ctx, x, y, w, h, o.r || 14); ctx.fillStyle = o.fill || 'rgba(14,20,44,.82)'; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = o.stroke || 'rgba(140,170,255,.35)'; ctx.stroke(); ctx.restore();
  }
  U.panel = panel;
  const STYLES = {
    green: ['#59e07d', '#27a84b', '#165e2b'], blue: ['#6a92ff', '#3358d8', '#1a2f7a'], gold: ['#ffd95a', '#e8a21c', '#8a5a08'],
    red: ['#ff7a7a', '#d43a3a', '#7a1a1a'], gray: ['#7e88a8', '#4c5576', '#262c44'], dark: ['#3a4670', '#252e4e', '#12172c']
  };
  // bouton : enregistre la zone cliquable et dessine
  function button(x, y, w, h, o) {
    const id = btns.length; const b = { x: x, y: y, w: w, h: h, fn: o.fn, id: id, off: !!o.off, snd: o.snd, instant: !!o.instant, tag: o.tag };
    btns.push(b); if (o.hidden) return b;
    const st = STYLES[o.style || 'blue'], isP = U.sameBtn(pressed, b), isH = U.sameBtn(hover, b) && !isP, off = o.off;
    const dy = isP ? 3 : 0;
    ctx.save(); ctx.translate(0, dy);
    rr(ctx, x, y + 5, w, h, h * 0.28 > 16 ? 16 : h * 0.28); ctx.fillStyle = off ? '#1d2238' : st[2]; ctx.fill();
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, off ? '#4a506c' : st[0]); g.addColorStop(1, off ? '#363c58' : st[1]);
    rr(ctx, x, y, w, h, h * 0.28 > 16 ? 16 : h * 0.28); ctx.fillStyle = g; ctx.fill();
    if (isH) { ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fill(); }
    ctx.lineWidth = 2.5; ctx.strokeStyle = o.sel ? '#fff' : 'rgba(0,0,0,.35)'; ctx.stroke();
    if (o.sel) { ctx.lineWidth = 4; ctx.strokeStyle = '#ffd24a'; rr(ctx, x - 3, y - 3, w + 6, h + 6, 18); ctx.stroke(); }
    const cx = x + w / 2, cy = y + h / 2;
    if (o.draw) o.draw(cx, cy, w, h);
    if (o.icon) WB.drawIcon(ctx, o.icon, o.label ? x + h * 0.55 : cx, cy, h * (o.iconScale || 0.6));
    if (o.label) text(o.label, o.icon ? cx + h * 0.3 : cx, cy + (o.sub ? -h * 0.14 : 1), o.size || Math.min(26, h * 0.42), off ? '#9aa0b8' : '#fff', 'center', 4);
    if (o.sub) text(o.sub, cx, cy + h * 0.24, Math.min(15, h * 0.26), '#ffe9a8', 'center', 3);
    ctx.restore(); return b;
  }
  U.button = button;
  function coinIcon(x, y, s) { WB.drawIcon(ctx, 'coin', x, y, s); }

  // ---------- fond animé des menus ----------
  const bgItems = [];
  // ----- fond d'accueil : une vraie partie sur une arène, image renouvelée chaque minute -----
  const TBG = { img: null, key: -1 };
  function makeTitleBg(arena) {
    const saved = WB.G, soundOn = WB.snd.on; let c = null;
    try {
      WB.snd.setEnabled(false);
      WB.startMatch({ arena: arena, mode: 't5', name: U.save.name, spec: Object.assign({}, U.save.spec), playerLevel: 4, ranked: false, duration: 240 });
      const G = WB.G; G.started = true; G.countdown = 0;
      for (let i = 0; i < 780; i++) G.update(1 / 60);
      c = document.createElement('canvas'); c.width = 960; c.height = 540; const g = c.getContext('2d');
      for (let k = 0; k < 12; k++) { g.setTransform(1, 0, 0, 1, 0, 0); WB.renderWorld(g, 960, 540, G, 5 + k * 0.05); }
    } catch (e) { c = null; }
    WB.G = saved; WB.snd.setEnabled(soundOn); return c;
  }
  U.ensureTitleBg = function () {
    const ids = WB.ARENAS.map(function (a) { return a.id; }), k = Math.floor(Date.now() / 60000);
    if (TBG.key === k && TBG.img) return; if (TBG.busy) return; TBG.busy = true; TBG.key = k;
    const img = makeTitleBg(ids[k % ids.length]); if (img) TBG.img = img; TBG.busy = false;
  };
  function photoBg(time) {
    const W = U.VW, H = U.VH, im = TBG.img; if (!im) return false;
    const sc = Math.max(W / 960, H / 540), w = 960 * sc, h = 540 * sc; ctx.drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(6,10,30,.55)'); g.addColorStop(0.5, 'rgba(6,10,30,.38)'); g.addColorStop(1, 'rgba(6,10,30,.7)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.95); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,10,.5)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    return true;
  }
  function bg(time, photo) {
    if (photo) { U.ensureTitleBg(); if (photoBg(time)) return; }
    const W = U.VW, H = U.VH, g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1d2a5e'); g.addColorStop(1, '#0b1026'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,.035)'; const T = 48, off = (time * 10) % (T * 2);
    for (let y = -T * 2; y < H + T; y += T) for (let x = -T * 2; x < W + T; x += T) if (((x / T + y / T) & 1) === 0) ctx.fillRect(x + off, y + off * 0.5, T, T);
    if (!bgItems.length) { const ids = WB.ABIL_IDS; for (let i = 0; i < 16; i++) bgItems.push({ id: ids[i % ids.length], x: Math.random(), y: Math.random(), s: 30 + Math.random() * 30, v: 0.01 + Math.random() * 0.02, ph: Math.random() * 6 }); }
    ctx.globalAlpha = 0.16;
    for (const b of bgItems) { const y = ((b.y + time * b.v) % 1.2) - 0.1; WB.drawIcon(ctx, b.id, b.x * W + Math.sin(time + b.ph) * 14, y * H, b.s); }
    ctx.globalAlpha = 1;
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.95); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,10,.55)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }

  function logo(cx, cy, sc, time) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc);
    const word = 'WARBLAST'; ctx.font = 'italic 900 84px ' + FONT; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    let tw = 0; const ws = []; for (const ch of word) { const w = ctx.measureText(ch).width + 2; ws.push(w); tw += w; }
    let x = -tw / 2;
    for (let i = 0; i < word.length; i++) {
      const bob = Math.sin(time * 2.2 + i * 0.7) * 4, rot = Math.sin(time * 1.5 + i) * 0.04;
      ctx.save(); ctx.translate(x + ws[i] / 2, bob); ctx.rotate(rot); ctx.textAlign = 'center';
      ctx.lineJoin = 'round'; ctx.lineWidth = 16; ctx.strokeStyle = '#150b02'; ctx.strokeText(word[i], 0, 6);
      ctx.lineWidth = 10; ctx.strokeStyle = '#8a3a06'; ctx.strokeText(word[i], 0, 0);
      const g = ctx.createLinearGradient(0, -40, 0, 40); g.addColorStop(0, '#fff3a0'); g.addColorStop(0.5, '#ffb62e'); g.addColorStop(1, '#ff6a1c'); ctx.fillStyle = g; ctx.fillText(word[i], 0, 0);
      ctx.restore(); x += ws[i];
    }
    ctx.restore();
    // bombe allumée
    WB.drawIcon(ctx, 'bomb', cx + tw * sc / 2 + 8 * sc, cy - 40 * sc + Math.sin(time * 3) * 3, 46 * sc);
  }

  // ---------- écrans ----------
  const screens = {};

  screens.title = function (time) {
    const W = U.VW, H = U.VH; bg(time, true);
    // personnages qui sautillent
    for (let i = 0; i < 10; i++) {
      const sp = { char: i, color: (i * 3 + 1) % 15, cape: i % 2 ? 'c_red' : 'none', armor: 'none', hat: i % 3 === 0 ? 'h_party' : 'none', scarf: i % 4 === 1 ? 's_red' : 'none', shoes: 'none' };
      const x = W * (0.07 + 0.086 * i), y = H * 0.78 + Math.abs(Math.sin(time * 3 + i * 0.8)) * -18 + (i % 2) * 14;
      WB.drawBlob(ctx, sp, x, y, 1.5, { t: time + i, walk: time * 8 + i, moving: true, fx: i % 2 ? 1 : -1, fy: 0 });
    }
    logo(W / 2, H * 0.32, Math.min(1.25, W / 700), time);
    text('Arène de combat en 2D', W / 2, H * 0.32 + 82, 22, '#cfe0ff', 'center', 5);
    const a = 0.55 + 0.45 * Math.sin(time * 3.5);
    ctx.globalAlpha = a; text('Touche l\'écran pour jouer', W / 2, H * 0.55, 28, '#fff', 'center', 6); ctx.globalAlpha = 1;
    button(W / 2 - 130, H * 0.6, 260, 62, { label: 'JOUER', style: 'green', size: 32, fn: function () { WB.snd.unlock(); U.tryLandscape(); U.go('menu'); } });
    text('Playgama', W - 20, H - 16, 14, 'rgba(255,255,255,.35)', 'right');
  };

  function specOf() { const s = U.save; return Object.assign({}, s.spec); }
  function charLv() { return U.save.level || 1; } // niveau du profil, identique pour tous les personnages

  function topBar(title, back) {
    const W = U.VW; panel(0, 0, W, 54, { r: 0, fill: 'rgba(8,12,30,.85)', stroke: 'rgba(120,150,255,.25)' });
    if (back) button(12, 5, 58, 44, { icon: 'back', style: 'gray', fn: function () { WB.snd.play('click'); U.go(back); } });
    if (title) text(title, back ? 82 : 20, 28, 24, '#fff', 'left', 4);
    resBar();
  }
  function resBar() {
    const W = U.VW, s = U.save;
    panel(W - 232, 9, 108, 36, { r: 18 }); coinIcon(W - 214, 27, 24); text(String(s.coins), W - 196, 28, 19, '#ffe27a', 'left', 3);
    panel(W - 118, 9, 108, 36, { r: 18 }); WB.drawIcon(ctx, 'trophy', W - 100, 27, 24); text(String(s.trophies), W - 82, 28, 19, '#fff', 'left', 3);
  }
  U.resBar = resBar;

  screens.menu = function (time) {
    const W = U.VW, H = U.VH; bg(time, true); topBar(null, null);
    const s = U.save, sp = specOf(), lv = charLv(sp.char);
    text(s.name, 16, 24, 22, '#fff', 'left', 4); text('Modifier mon nom', 16, 43, 11, 'rgba(190,210,255,.75)', 'left', 2);
    button(8, 4, 230, 48, { hidden: true, fn: function () { U.editName(); } });
    // personnage central
    const cx = W / 2, cy = H * 0.5;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(cx, cy + 92, 90, 20, 0, 0, PI2); ctx.fill();
    const gl = ctx.createRadialGradient(cx, cy, 10, cx, cy, 150); gl.addColorStop(0, 'rgba(120,160,255,.3)'); gl.addColorStop(1, 'rgba(120,160,255,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cx, cy, 150, 0, PI2); ctx.fill();
    WB.drawBlob(ctx, sp, cx, cy + Math.sin(time * 2.4) * 4, 3.6, { t: time, walk: 0, moving: false, fx: Math.sin(time * 0.8), fy: 0.2 });
    text(WB.CHARS[sp.char].name, cx, cy + 128, 24, '#fff', 'center', 5);
    text('Niveau ' + lv, cx, cy + 154, 18, '#ffd24a', 'center', 4);
    // boutons gauche
    const bx = Math.max(16, W / 2 - 430);
    button(bx, 80, 230, 76, { label: 'JOUER', sub: 'World Game', style: 'green', size: 32, fn: function () { U.playType = 'world'; U.go('play'); } });
    button(bx, 170, 230, 58, { label: 'ENTRE AMIS', style: 'blue', size: 24, fn: function () { U.playType = 'friends'; if (!U.friend.code) U.friend.code = 'WB-' + Math.random().toString(36).slice(2, 6).toUpperCase(); U.go('play'); } });
    button(bx, 242, 230, 58, { label: 'PERSONNAGE', style: 'gold', size: 24, fn: function () { U.go('char'); } });
    // boutons droite
    const rx = Math.min(W - 16 - 230, W / 2 + 200);
    button(rx, 80, 230, 58, { label: 'RÉGLAGES', style: 'gray', size: 22, fn: function () { U.go('settings'); } });
    button(rx, 152, 230, 58, { label: 'COMMENT JOUER', style: 'gray', size: 19, fn: function () { U.go('help'); } });
    if (WB.sdk.rewardedSupported()) button(rx, 224, 230, 66, { label: '+40 pièces', sub: 'regarder une vidéo', icon: 'coin', style: 'gold', size: 21, fn: function () { U.rewardCoins(40, 'menu_coins'); } });
    // statistiques
    text('Parties ' + s.stats.matches + '   Victoires ' + s.stats.wins + '   Éliminations ' + s.stats.kills, W / 2, H - 18, 15, 'rgba(210,225,255,.7)', 'center', 3);
    drawToast();
  };

  U.rewardCoins = function (n, placement) {
    WB.sdk.showRewarded(placement, function (ok) {
      if (ok) { U.save.coins += n; U.commit(); U.showToast('+' + n + ' pièces', '#ffe27a'); WB.snd.play('coin'); }
      else U.showToast('Vidéo indisponible pour le moment', '#ffb0b0');
    });
  };
  function drawToast() {
    const t = U.toast; if (!t) return; ctx.globalAlpha = Math.min(1, t.t * 2);
    panel(U.VW / 2 - 170, U.VH - 110, 340, 44, { fill: 'rgba(10,14,34,.92)' }); text(t.txt, U.VW / 2, U.VH - 88, 18, t.col, 'center', 3); ctx.globalAlpha = 1;
  }
  U.drawToast = drawToast;

  // ----- personnage et boutique -----
  let charTab = 'color';
  const TABS = [['color', 'Couleur'], ['cape', 'Cape'], ['armor', 'Armure'], ['hat', 'Chapeau'], ['scarf', 'Écharpe'], ['shoes', 'Chaussures']];
  function owned(kind, it) { return it.price === 0 || U.save.owned[kind + ':' + it.id]; }

  screens.char = function (time) {
    const W = U.VW, H = U.VH, X0 = (W - 860) / 2, s = U.save, sp = specOf(); bg(time); topBar('Mon personnage', 'menu');
    // grille des personnages
    for (let i = 0; i < 10; i++) {
      const col = i % 5, row = (i / 5) | 0, x = X0 + 10 + col * 80, y = 64 + row * 70;
      const b = button(x, y, 74, 64, { style: 'dark', sel: sp.char === i, fn: function () { s.spec.char = i; U.commit(); WB.snd.play('click'); }, draw: function (cx, cy) { WB.drawBlob(ctx, Object.assign({}, sp, { char: i }), cx, cy + 6, 1.15, { t: time + i, moving: false, fx: 0.4, fy: 0 }); } });
    }
    // onglets
    const ty = 208; let tx = X0 + 10;
    for (const t of TABS) { const w = t[0] === 'shoes' ? 80 : t[0] === 'color' ? 64 : 62; button(tx, ty, w - 2, 38, { label: t[1], size: 12, style: charTab === t[0] ? 'gold' : 'dark', fn: function () { charTab = t[0]; WB.snd.play('click'); } }); tx += w + 2; }
    // contenu
    const cy0 = 250;
    panel(X0 + 6, cy0 - 4, 410, H - cy0 - 8, { r: 10, fill: 'rgba(10,14,34,.7)' });
    if (charTab === 'color') {
      for (let i = 0; i < 15; i++) { const col = i % 5, row = (i / 5) | 0, x = X0 + 18 + col * 80, y = cy0 + 8 + row * 80; button(x, y, 70, 70, { style: 'dark', sel: sp.color === i, fn: function () { s.spec.color = i; U.commit(); WB.snd.play('click'); }, draw: function (cx, cy) { ctx.fillStyle = WB.COLORS[i]; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy - 4, 22, 0, PI2); ctx.fill(); ctx.stroke(); text(WB.COLOR_NAMES[i], cx, cy + 26, 11, '#fff', 'center', 3); } }); }
    } else {
      const list = WB.EQUIP[charTab];
      for (let i = 0; i < list.length; i++) {
        const it = list[i], col = i % 4, row = (i / 4) | 0, x = X0 + 14 + col * 100, y = cy0 + 6 + row * 124, have = owned(charTab, it), eq = sp[charTab] === it.id;
        button(x, y, 94, 116, { style: eq ? 'green' : 'dark', sel: eq, fn: function () {
          if (have) { s.spec[charTab] = it.id; U.commit(); WB.snd.play('click'); }
          else if (s.coins >= it.price) { s.coins -= it.price; s.owned[charTab + ':' + it.id] = true; s.spec[charTab] = it.id; U.commit(); WB.snd.play('pickup'); U.showToast('Acheté : ' + it.name, '#9dffb0'); }
          else { WB.snd.play('hit'); U.showToast('Il manque ' + (it.price - s.coins) + ' pièces', '#ffb0b0'); }
        }, draw: function (cx, cy) {
          WB.drawBlob(ctx, Object.assign({}, sp, { [charTab]: it.id }), cx, cy - 14, 1.2, { t: time, moving: false, fx: 0.3, fy: 0 });
          text(it.name, cx, cy + 28, 11, '#fff', 'center', 3);
          if (!have) { coinIcon(cx - 14, cy + 44, 16); text(String(it.price), cx - 3, cy + 45, 14, s.coins >= it.price ? '#ffe27a' : '#ff9a9a', 'left', 3); }
          else text(eq ? 'Équipé' : 'Possédé', cx, cy + 45, 12, eq ? '#fff' : '#a8c0ff', 'center', 3);
        } });
      }
    }
    // aperçu à droite
    const px = X0 + 650, py = 190;
    const gl = ctx.createRadialGradient(px, py, 10, px, py, 170); gl.addColorStop(0, 'rgba(120,160,255,.3)'); gl.addColorStop(1, 'rgba(120,160,255,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(px, py, 170, 0, PI2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(px, py + 82, 80, 17, 0, 0, PI2); ctx.fill();
    WB.drawBlob(ctx, sp, px, py + Math.sin(time * 2.4) * 3, 3.3, { t: time, moving: false, fx: Math.sin(time * 0.9), fy: 0.2 });
    const lv = charLv(sp.char); text(WB.CHARS[sp.char].name, px, py + 118, 24, '#fff', 'center', 5);
    text('Niveau ' + lv + ' sur ' + WB.MAXLV, px, py + 144, 18, '#ffd24a', 'center', 4);
    // cases de capacité du niveau
    const n = WB.slotCount(lv), sw = 38, gap = 6, sx = px - (n * (sw + gap) - gap) / 2;
    for (let i = 0; i < 6; i++) { if (i >= n) break; ctx.setLineDash([5, 4]); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(sx + i * (sw + gap) + sw / 2, py + 176, sw / 2 - 2, 0, PI2); ctx.stroke(); ctx.setLineDash([]); }
    if (WB.chainMax(lv) > 1) text('Enchaîne ' + WB.chainMax(lv) + ' capacités', px, py + 204, 14, '#ffb0ff', 'center', 3);
    // montée de niveau
    const cost = WB.trophyCost(lv);
    if (lv < WB.MAXLV) {
      const can = s.trophies >= cost;
      button(px - 130, py + 218, 260, 50, { label: 'Monter au niveau ' + (lv + 1), sub: cost + ' trophées', style: can ? 'gold' : 'gray', size: 17, off: !can, fn: function () {
        if (s.trophies >= cost) { s.trophies -= cost; s.level = lv + 1; U.commit(); WB.snd.play('levelup'); U.showToast('Ton niveau passe à ' + (lv + 1), '#ffe27a'); }
      } });
    } else text('Niveau maximum', px, py + 242, 18, '#9dffb0', 'center', 4);
    if (WB.sdk.rewardedSupported()) button(px - 130, py + 276, 260, 44, { label: '+40 pièces', sub: 'vidéo', icon: 'coin', style: 'dark', size: 16, fn: function () { U.rewardCoins(40, 'shop_coins'); } });
    drawToast();
  };

  // ----- choix du mode et de la carte -----
  const prevCache = {};
  function arenaPreview(id) {
    if (prevCache[id]) return prevCache[id];
    const c = document.createElement('canvas'); c.width = 200; c.height = 110; const g = c.getContext('2d');
    try {
      const S = WB.buildSprites(id), TS = 64; g.scale(0.5, 0.5);
      for (let y = 0; y < 4; y++) for (let x = 0; x < 7; x++) g.drawImage(S.floors[(x * 3 + y * 5) % 4], x * TS - 20, y * TS - 10);
      for (let x = 0; x < 7; x++) { g.drawImage(S.wall, x * TS - 20, 0); }
      g.drawImage(S.wall, -20, 64); g.drawImage(S.wall, 5 * TS - 20, 96 + 64);
      if (S.water && id === 'nature') for (let x = 4; x < 6; x++) g.drawImage(S.water, x * TS - 20, 128);
      if (S.trees && S.trees.length) { g.drawImage(S.trees[0], 20, 40); g.drawImage(S.trees[1 % S.trees.length], 250, 90); }
      if (S.houses && S.houses.length && id === 'urban') g.drawImage(S.houses[0], 150, 40);
    } catch (e) { g.fillStyle = '#555'; g.fillRect(0, 0, 200, 110); }
    prevCache[id] = c; return c;
  }

  screens.play = function (time) {
    const W = U.VW, H = U.VH, X0 = (W - 860) / 2; bg(time);
    const fr = U.playType === 'friends';
    topBar(fr ? 'Partie entre amis' : 'World Game', 'menu');
    text('Mode de jeu', X0 + 430, 76, 20, '#cfe0ff', 'center', 4);
    WB.MODES.forEach(function (m, i) {
      const x = X0 + 20 + i * 280;
      button(x, 92, 262, 78, { style: sel.mode === m.id ? 'green' : 'dark', sel: sel.mode === m.id, fn: function () { sel.mode = m.id; WB.snd.play('click'); }, draw: function (cx, cy) {
        text(m.name, cx, cy - 16, 20, '#fff', 'center', 4); text(m.desc, cx, cy + 8, 13, '#cfe0ff', 'center', 3);
        const n = m.total; for (let k = 0; k < n; k++) { const tc = m.teams ? WB.TEAM_COLORS[Math.floor(k / m.size)] : '#ffd24a'; ctx.fillStyle = tc; ctx.beginPath(); ctx.arc(cx - (n - 1) * 8 + k * 16, cy + 28, 5, 0, PI2); ctx.fill(); }
      } });
    });
    text('Carte', X0 + 430, 196, 20, '#cfe0ff', 'center', 4);
    WB.ARENAS.forEach(function (a, i) {
      const x = X0 + 20 + i * 280, on = sel.arena === a.id;
      button(x, 212, 262, 170, { style: on ? 'green' : 'dark', sel: on, fn: function () { sel.arena = a.id; WB.snd.play('click'); }, draw: function (cx, cy) {
        ctx.drawImage(arenaPreview(a.id), cx - 100, cy - 78, 200, 110);
        ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 2; ctx.strokeRect(cx - 100, cy - 78, 200, 110);
        text(a.name, cx, cy + 46, 22, '#fff', 'center', 5); text(a.desc, cx, cy + 68, 12, '#cfe0ff', 'center', 3);
      } });
    });
    // durée de la partie : 3, 4 ou 5 minutes au choix du joueur
    text('Durée', X0 + 150, 410, 20, '#cfe0ff', 'center', 4);
    [180, 240, 300].forEach(function (d, i) {
      const on = (U.save.duration || 240) === d;
      button(X0 + 250 + i * 190, 388, 170, 44, { label: (d / 60) + ' min', style: on ? 'green' : 'dark', sel: on, size: 22, fn: function () { U.save.duration = d; U.commit(); WB.snd.play('click'); } });
    });
    if (fr) text('Salon ' + U.friend.code + '. Le jeu en ligne demande un serveur, absent de cette version : la partie se joue contre des bots.', X0 + 430, H - 100, 12.5, '#cfe0ff', 'center', 3);
    else text('Ton niveau est ' + charLv() + ' (le même pour tous tes personnages) : ' + WB.slotCount(charLv()) + ' case' + (charLv() > 1 ? 's' : '') + ' de capacité.', X0 + 430, H - 100, 12.5, '#cfe0ff', 'center', 3);
    button(W / 2 - 200, H - 86, 400, 64, { label: 'LANCER LA PARTIE', style: 'red', size: 30, fn: function () { U.startGame(); } });
    drawToast();
  };

  U.startGame = function () {
    const s = U.save, sp = specOf();
    WB.snd.unlock(); WB.input.reset();
    WB.startMatch({ arena: sel.arena, mode: sel.mode, name: s.name, spec: sp, playerLevel: charLv(sp.char), ranked: U.playType === 'world', duration: s.duration || 240 });
    U.matchCfg = { arena: sel.arena, mode: sel.mode }; U.rewardDone = false; U.doubled = false; U.paused = false; U.chainMode = false; U.chainSel = [];
    U.buildMini(); U.go('game'); WB.sdk.hideBanner();
  };

  // ----- réglages et aide -----
  screens.settings = function (time) {
    const W = U.VW, X0 = (W - 860) / 2; bg(time); topBar('Réglages', 'menu');
    const s = U.save;
    function pips(x, y, v) { for (let i = 0; i < 5; i++) { ctx.fillStyle = (i + 1) / 5 <= v + 0.01 ? '#7dff9a' : 'rgba(255,255,255,.18)'; U.rr(ctx, x + i * 20, y - (6 + i * 3), 14, 6 + i * 3 + 6, 3); ctx.fill(); } }
    function audioRow(y, label, icon, onKey, volKey, apply) {
      panel(X0 + 80, y, 700, 70, { r: 16 }); WB.drawIcon(ctx, icon, X0 + 120, y + 35, 34); text(label, X0 + 150, y + 35, 22, '#fff', 'left', 4);
      button(X0 + 360, y + 11, 130, 48, { label: s[onKey] ? 'Activé' : 'Coupé', style: s[onKey] ? 'green' : 'gray', size: 19, fn: function () { s[onKey] = !s[onKey]; apply(); U.commit(); WB.snd.play('click'); } });
      const v = s[volKey]; const stepV = function (d) { s[volKey] = Math.max(0, Math.min(1, Math.round((v + d) * 5) / 5)); apply(); U.commit(); WB.snd.play('click'); };
      button(X0 + 520, y + 13, 44, 44, { label: '-', style: 'dark', size: 26, fn: function () { stepV(-0.2); } });
      pips(X0 + 578, y + 44, v);
      button(X0 + 690, y + 13, 44, 44, { label: '+', style: 'dark', size: 26, fn: function () { stepV(0.2); } });
    }
    audioRow(76, 'Effets sonores', 'bomb', 'sound', 'sfxVol', function () { U.applyAudio(); });
    audioRow(158, 'Musique', 'bolt', 'music', 'musVol', function () { U.applyAudio(); });
    panel(X0 + 80, 240, 700, 70, { r: 16 }); text('Pseudo', X0 + 120, 275, 22, '#fff', 'left', 4);
    button(X0 + 330, 251, 420, 48, { label: s.name, sub: 'Modifier mon nom', style: 'blue', size: 18, fn: function () { U.editName(); } });
    panel(X0 + 80, 322, 700, 70, { r: 16 }); text('Aide', X0 + 120, 357, 22, '#fff', 'left', 4);
    button(X0 + 330, 333, 420, 48, { label: 'Comment jouer', style: 'gray', size: 20, fn: function () { U.go('help'); } });
    text('Warblast 1.0', W / 2, 424, 15, 'rgba(210,225,255,.55)', 'center', 3);
  };
  const HELP = [
    ['joystick', 'Stick gauche : se déplacer. Stick droit : viser. En le relâchant tu lances une bombe.'],
    ['bomb', 'Tu as 5 bombes par partie. Elles ne reviennent jamais, garde-les pour les bons moments.'],
    ['spark', 'Ramasse les blocs au sol pour remplir tes cases vides, en bas de l\'écran. Touche une case pour lancer la capacité.'],
    ['trophy', 'Chaque élimination fait monter le niveau de la capacité utilisée, jusqu\'au niveau 5.'],
    ['heart', 'Évite l\'eau, les flammes et les araignées. Les sbires noirs et les boss rouges attaquent tout le monde.'],
    ['coin', 'Les pièces achètent des tenues. Les trophées de fin de partie font monter ton niveau jusqu\'à 10, quel que soit le personnage que tu joues.']
  ];
  screens.help = function (time) {
    const W = U.VW; bg(time); topBar('Comment jouer', U.screen === 'help' && U.prev === 'game' ? 'game' : 'menu');
    HELP.forEach(function (h, i) {
      const y = 74 + i * 62; panel(W / 2 - 400, y, 800, 54, { r: 12 });
      if (h[0] === 'joystick') { ctx.strokeStyle = '#9ad8ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W / 2 - 370, y + 27, 16, 0, PI2); ctx.stroke(); ctx.fillStyle = '#9ad8ff'; ctx.beginPath(); ctx.arc(W / 2 - 370, y + 27, 7, 0, PI2); ctx.fill(); }
      else if (h[0] === 'spark') WB.drawIcon(ctx, 'fire', W / 2 - 370, y + 27, 30); else WB.drawIcon(ctx, h[0], W / 2 - 370, y + 27, 30);
      text(h[1], W / 2 - 340, y + 27, 14.5, '#fff', 'left', 3);
    });
    text('Clavier : ZQSD ou flèches pour bouger, souris pour viser, clic pour la bombe, touches 1 à 6 pour les capacités, P pour la pause.', W / 2, 74 + 6 * 62 + 14, 13.5, '#cfe0ff', 'center', 3);
  };

  // ---------- boucle d'affichage des écrans ----------
  U.frame = function (dt, time) {
    // revérifie la taille réelle de l'écran à chaque image : sans cela, une rotation dont l'événement est perdu laisse le jeu bloqué sur l'écran « Tourne ton appareil »
    if ((cv.clientWidth || window.innerWidth) !== U.seenW || (cv.clientHeight || window.innerHeight) !== U.seenH) U.resize();
    U.t += dt; if (U.toast) { U.toast.t -= dt; if (U.toast.t <= 0) U.toast = null; }
    ctx.setTransform(U.dpr, 0, 0, U.dpr, 0, 0);
    ctx.clearRect(0, 0, U.W, U.H);
    if (U.screen === 'game' || U.screen === 'results') { U.gameFrame(dt, time); }
    else {
      ctx.save(); ctx.scale(U.S, U.S); btns = []; hover = null;
      (screens[U.screen] || screens.menu)(time);
      if (mouseX >= 0) for (let i = btns.length - 1; i >= 0; i--) { const b = btns[i]; if (mouseX >= b.x && mouseX <= b.x + b.w && mouseY >= b.y && mouseY <= b.y + b.h) { hover = b; break; } }
      ctx.restore();
    }
    if (U.H > U.W * 1.05) { // portrait : demander de tourner
      ctx.fillStyle = 'rgba(6,10,28,.96)'; ctx.fillRect(0, 0, U.W, U.H);
      ctx.save(); ctx.translate(U.W / 2, U.H / 2); const s = Math.min(U.W, U.H) / 360; ctx.scale(s, s);
      ctx.rotate(Math.sin(time * 2) * 0.35 - Math.PI / 2 * 0); ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; rr(ctx, -50, -80, 100, 160, 14); ctx.stroke();
      ctx.restore();
      ctx.font = 'bold 20px ' + FONT; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('Tourne ton appareil en mode paysage', U.W / 2, U.H / 2 + Math.min(U.W, U.H) * 0.4);
      ctx.font = '15px ' + FONT; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText('Le jeu démarre tout seul dès que l\'écran est à l\'horizontale', U.W / 2, U.H / 2 + Math.min(U.W, U.H) * 0.4 + 28);
    }
  };

  U.tryLandscape = function () {
    try { const el = document.documentElement; if (el.requestFullscreen && !document.fullscreenElement && /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)) el.requestFullscreen().catch(function () {}); } catch (e) {}
    try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {}); } catch (e) {}
  };

  // ---------- pointeurs ----------
  U.touches = {};
  function findBtn(x, y) {
    // zone de toucher : au moins 44 px réels de côté (marge ajoutée autour des petits boutons, 6 unités au plus)
    const need = 44 / U.S;
    for (let i = btns.length - 1; i >= 0; i--) {
      const b = btns[i]; if (b.off) continue;
      const sx = b.w < need ? Math.min(10, (need - b.w) / 2) : 0, sy = b.h < need ? Math.min(10, (need - b.h) / 2) : 0;
      if (x >= b.x - sx && x <= b.x + b.w + sx && y >= b.y - sy && y <= b.y + b.h + sy) return b;
    }
    return null;
  }
  U.findBtn = findBtn;
  U.setButtons = function (l) { btns = l; };
  function onPointer(kind, e) {
    const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top, x = px / U.S, y = py / U.S;
    if (e.pointerType === 'touch') WB.input.touch = true;
    if (e.pointerType === 'mouse') { mouseX = x; mouseY = y; U.mousePx = px; U.mousePy = py; }
    if (kind === 'down') WB.snd.unlock();
    if (U.H > U.W * 1.05) { if (kind === 'down') { U.resize(); U.tryLandscape(); } else if (U.resetSticks) U.resetSticks(); return; }
    if (U.screen === 'game' || U.screen === 'results') { U.gamePointer(kind, e, px, py, x, y); return; }
    if (kind === 'down') { pressed = findBtn(x, y); if (U.screen === 'title' && !pressed) { WB.snd.unlock(); U.tryLandscape(); U.go('menu'); } }
    else if (kind === 'up') { const b = pressed; pressed = null; const cur = findBtn(x, y); if (b && cur && U.sameBtn(b, cur) && cur.fn) { if (cur.snd !== false) WB.snd.play('click'); cur.fn(); } }
  }
  U.pressedBtn = function () { return pressed; };
  U.setPressed = function (b) { pressed = b; };
  U.getHover = function () { return hover; };
  U.buttons = function () { return btns; };
  U.mouse = function () { return { x: mouseX, y: mouseY }; };
  U.ctxTransform = function () { ctx.save(); ctx.scale(U.S, U.S); btns = []; };
  U.resetBtns = function () { btns = []; hover = null; };
  U.endTransform = function () {
    if (mouseX >= 0) for (let i = btns.length - 1; i >= 0; i--) { const b = btns[i]; if (mouseX >= b.x && mouseX <= b.x + b.w && mouseY >= b.y && mouseY <= b.y + b.h) { hover = b; break; } }
    ctx.restore();
  };
  U.onPlatformPause = function (p) { U.platformPaused = p; if (WB.G && U.screen === 'game' && p) U.paused = true; };
})(window.WB);
