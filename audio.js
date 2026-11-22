'use strict';
(function (WB) {
  // Sons synthétisés (aucun fichier audio à charger)
  const S = WB.snd = { ctx: null, on: true, platformOn: true, adMute: false, master: null };
  function ok() { return S.on && S.platformOn && !S.adMute; }
  S.unlock = function () {
    if (S.ctx) { if (S.ctx.state === 'suspended') S.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      S.ctx = new AC(); S.master = S.ctx.createGain(); S.master.gain.value = 0.5; S.master.connect(S.ctx.destination);
      const b = S.ctx.createBuffer(1, S.ctx.sampleRate * 0.6, S.ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; S.noiseBuf = b;
    } catch (e) {}
  };
  S.setEnabled = function (v) { S.on = !!v; };
  S.setPlatformAudio = function (v) { S.platformOn = !!v; };
  S.setAdMute = function (v) { S.adMute = !!v; };
  let VS = 1;
  function tone(f0, dur, type, vol, f1, delay) {
    if (!S.ctx || !ok()) return; vol = (vol || 0.2) * VS;
    const t0 = S.ctx.currentTime + (delay || 0), o = S.ctx.createOscillator(), g = S.ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t0); if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    g.gain.setValueAtTime(vol || 0.2, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(S.master); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(dur, vol, freq, delay) {
    if (!S.ctx || !ok() || !S.noiseBuf) return; vol = (vol || 0.2) * VS;
    const t0 = S.ctx.currentTime + (delay || 0), src = S.ctx.createBufferSource(), f = S.ctx.createBiquadFilter(), g = S.ctx.createGain();
    src.buffer = S.noiseBuf; f.type = 'lowpass'; f.frequency.value = freq || 1500;
    g.gain.setValueAtTime(vol || 0.2, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(S.master); src.start(t0); src.stop(t0 + dur + 0.02);
  }
  let last = {};
  S.play = function (n, vol) {
    if (!S.ctx || !ok()) return;
    const now = performance.now(); if (last[n] && now - last[n] < 60) return; last[n] = now;
    VS = vol == null ? 1 : vol;
    switch (n) {
      // ---- un son propre à chaque capacité (joué au lancement) ----
      case 'ab_ice': tone(2200, 0.5, 'triangle', 0.12, 900); tone(3100, 0.35, 'sine', 0.08, 1500, 0.05); noise(0.25, 0.08, 6000, 0.02); break;
      case 'ab_fire': noise(0.5, 0.22, 900); tone(140, 0.5, 'sawtooth', 0.1, 70); tone(420, 0.3, 'square', 0.04, 200, 0.05); break;
      case 'ab_hole': tone(90, 1.1, 'sine', 0.28, 35); tone(180, 1.0, 'triangle', 0.1, 50, 0.1); tone(60, 1.2, 'sine', 0.2, 30, 0.2); break;
      case 'ab_wall': noise(0.12, 0.3, 300); tone(70, 0.25, 'square', 0.18, 45); noise(0.2, 0.15, 500, 0.12); break;
      case 'ab_shield': tone(520, 0.12, 'sine', 0.14); tone(780, 0.16, 'sine', 0.14, null, 0.08); tone(1170, 0.3, 'sine', 0.12, 1300, 0.16); break;
      case 'ab_tp': tone(1400, 0.18, 'sine', 0.12, 200); tone(300, 0.2, 'sine', 0.12, 1600, 0.15); break;
      case 'ab_dash': noise(0.25, 0.22, 4500); tone(300, 0.25, 'sawtooth', 0.08, 1200); break;
      case 'ab_water': for (let i = 0; i < 4; i++) tone(500 + i * 130, 0.09, 'sine', 0.12, 900 + i * 150, i * 0.07); noise(0.3, 0.1, 2500); break;
      case 'ab_wind': noise(0.7, 0.18, 2200); noise(0.5, 0.1, 6000, 0.1); tone(180, 0.7, 'sine', 0.05, 320); break;
      case 'ab_scythe': noise(0.12, 0.28, 5500); tone(900, 0.14, 'sawtooth', 0.08, 180); noise(0.12, 0.2, 5000, 0.2); tone(800, 0.14, 'sawtooth', 0.07, 160, 0.2); break;
      case 'ab_invis': tone(1200, 0.45, 'sine', 0.1, 250); tone(1800, 0.3, 'sine', 0.05, 400, 0.05); break;
      case 'ab_spider': tone(900, 0.06, 'square', 0.08); tone(1000, 0.06, 'square', 0.08, null, 0.07); tone(800, 0.06, 'square', 0.08, null, 0.14); tone(600, 0.18, 'triangle', 0.1, 250, 0.2); break;
      case 'ab_clown': tone(330, 0.12, 'square', 0.12); tone(415, 0.12, 'square', 0.12, null, 0.12); tone(523, 0.12, 'square', 0.12, null, 0.24); tone(660, 0.25, 'square', 0.12, 520, 0.36); break;
      case 'ab_necro': tone(220, 0.35, 'sawtooth', 0.1, 190); tone(261, 0.35, 'sawtooth', 0.08, 220, 0.04); tone(155, 0.6, 'triangle', 0.12, 110, 0.3); break;
      case 'ab_turret': tone(220, 0.05, 'square', 0.12); tone(220, 0.05, 'square', 0.12, null, 0.09); tone(330, 0.05, 'square', 0.12, null, 0.18); noise(0.1, 0.12, 1500, 0.2); break;
      case 'ab_jump': tone(180, 0.35, 'sine', 0.22, 700); tone(500, 0.1, 'triangle', 0.1, 250, 0.3); break;
      case 'ab_bolt': noise(0.06, 0.3, 7000); tone(2600, 0.12, 'sawtooth', 0.1, 400); noise(0.3, 0.25, 2500, 0.15); tone(70, 0.35, 'sawtooth', 0.2, 28, 0.15); break;
      case 'ab_glut': tone(160, 0.12, 'sine', 0.3, 60); tone(130, 0.14, 'sine', 0.3, 50, 0.16); tone(600, 0.08, 'triangle', 0.1, 900, 0.3); break;
      case 'ab_summon': for (let i = 0; i < 5; i++) tone(392 * Math.pow(1.19, i), 0.2, 'triangle', 0.11, null, i * 0.07); tone(120, 0.5, 'sine', 0.18, 60, 0.1); break;
      case 'ab_cancel': tone(500, 0.3, 'sawtooth', 0.1, 120); tone(530, 0.3, 'square', 0.06, 110); noise(0.15, 0.12, 3000, 0.25); break;
      // ---- élimination, tirs, impacts ----
      case 'kill': tone(330, 0.09, 'square', 0.14); tone(495, 0.09, 'square', 0.14, null, 0.08); tone(660, 0.18, 'square', 0.14, 990, 0.16); noise(0.08, 0.15, 4000); break;
      case 'ko': tone(260, 0.3, 'sawtooth', 0.1, 70); noise(0.15, 0.12, 900); break;
      case 'shot': noise(0.08, 0.14, 4500); tone(700, 0.1, 'square', 0.07, 300); break;
      case 'impact': noise(0.1, 0.18, 1800); tone(150, 0.1, 'square', 0.12, 80); break;
      case 'count': tone(520, 0.12, 'square', 0.12); break;
      case 'go': tone(780, 0.25, 'square', 0.14, 1040); tone(1040, 0.3, 'triangle', 0.1, null, 0.12); break;
      case 'respawn': tone(330, 0.1, 'sine', 0.12); tone(495, 0.1, 'sine', 0.12, null, 0.08); tone(740, 0.2, 'sine', 0.12, null, 0.16); break;
      case 'click': tone(660, 0.06, 'square', 0.1); break;
      case 'hit': tone(220, 0.08, 'square', 0.12, 120); break;
      case 'boom': noise(0.45, 0.35, 700); tone(110, 0.3, 'sine', 0.3, 40); break;
      case 'throw': tone(300, 0.12, 'triangle', 0.12, 500); break;
      case 'pickup': tone(520, 0.08, 'triangle', 0.15); tone(780, 0.12, 'triangle', 0.15, null, 0.07); break;
      case 'coin': tone(900, 0.07, 'square', 0.1); tone(1350, 0.1, 'square', 0.1, null, 0.05); break;
      case 'heal': tone(500, 0.1, 'sine', 0.15); tone(750, 0.15, 'sine', 0.15, null, 0.08); break;
      case 'ice': tone(1400, 0.4, 'triangle', 0.15, 500); noise(0.3, 0.1, 4000); break;
      case 'fire': noise(0.3, 0.2, 1200); tone(260, 0.25, 'sawtooth', 0.08, 120); break;
      case 'hole': tone(120, 1.2, 'sine', 0.3, 40); tone(240, 1.2, 'triangle', 0.1, 60); break;
      case 'wall': noise(0.15, 0.2, 400); tone(90, 0.2, 'square', 0.12); break;
      case 'shield': tone(400, 0.3, 'sine', 0.18, 900); break;
      case 'tp': tone(1000, 0.25, 'sine', 0.15, 200); tone(200, 0.25, 'sine', 0.15, 1000, 0.12); break;
      case 'dash': noise(0.15, 0.2, 3000); tone(500, 0.12, 'sawtooth', 0.08, 900); break;
      case 'water': noise(0.35, 0.2, 2500); tone(300, 0.3, 'sine', 0.1, 600); break;
      case 'wind': noise(0.45, 0.2, 5000); break;
      case 'swing': noise(0.15, 0.2, 3500); tone(700, 0.15, 'sawtooth', 0.06, 200); break;
      case 'invis': tone(900, 0.3, 'sine', 0.1, 300); break;
      case 'web': tone(700, 0.2, 'triangle', 0.12, 300); break;
      case 'clown': tone(400, 0.1, 'square', 0.12); tone(600, 0.1, 'square', 0.12, null, 0.1); tone(500, 0.15, 'square', 0.12, null, 0.2); break;
      case 'spear': tone(500, 0.15, 'sawtooth', 0.1, 900); break;
      case 'jump': tone(200, 0.35, 'sine', 0.2, 600); break;
      case 'zap0': tone(2000, 0.3, 'sine', 0.05, 3000); break;
      case 'zap': noise(0.25, 0.35, 6000); tone(80, 0.25, 'sawtooth', 0.2, 30); break;
      case 'die': tone(300, 0.4, 'sawtooth', 0.15, 60); break;
      case 'levelup': tone(520, 0.12, 'square', 0.12); tone(660, 0.12, 'square', 0.12, null, 0.1); tone(880, 0.2, 'square', 0.12, null, 0.2); break;
      case 'win': for (let i = 0; i < 5; i++) tone(440 * Math.pow(1.26, i), 0.18, 'square', 0.12, null, i * 0.12); break;
      case 'lose': tone(330, 0.3, 'triangle', 0.15, 200); tone(220, 0.5, 'triangle', 0.15, 120, 0.25); break;
      case 'eat': tone(300, 0.07, 'square', 0.12, 200); tone(320, 0.07, 'square', 0.12, 210, 0.16); tone(340, 0.07, 'square', 0.12, 220, 0.32); tone(700, 0.15, 'triangle', 0.12, 1100, 0.5); break;
      case 'chest': tone(180, 0.15, 'square', 0.12, 120); noise(0.2, 0.15, 3000, 0.05); tone(880, 0.2, 'triangle', 0.12, 1320, 0.12); break;
      case 'drown': noise(0.5, 0.15, 800); tone(200, 0.5, 'sine', 0.15, 80); break;
    }
    VS = 1;
  };
})(window.WB);
