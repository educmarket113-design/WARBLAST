'use strict';
(function (WB) {
  // Intégration du SDK Playgama Bridge (script officiel chargé dans index.html).
  // Méthodes utilisées, toutes issues de la documentation officielle :
  // bridge.initialize(), bridge.platform.sendMessage / on, bridge.advertisement.*, bridge.storage.get / set
  const S = WB.sdk = { ready: false, bridge: null, platformId: 'aucun', lastInterstitial: Date.now(), pendingReward: null, adOpen: false };
  const KEY = 'wb_save_v1';

  S.init = function () {
    return new Promise(function (resolve) {
      let waited = 0;
      (function wait() {
        if (window.bridge || window.__noBridge || waited >= 4000) return go();
        waited += 100; setTimeout(wait, 100);
      })();
      function go() {
      const b = window.bridge;
      if (!b || typeof b.initialize !== 'function') { console.warn('[Warblast] Playgama Bridge absent : le jeu tourne sans SDK.'); return resolve(false); }
      S.bridge = b;
      let done = false;
      const t = setTimeout(function () { if (!done) { done = true; console.warn('[Warblast] SDK : délai dépassé.'); resolve(false); } }, 6000);
      b.initialize().then(function () {
        if (done) return; done = true; clearTimeout(t);
        S.ready = true;
        try { S.platformId = b.platform.id; } catch (e) {}
        S.hook();
        resolve(true);
      }).catch(function (e) { if (done) return; done = true; clearTimeout(t); console.warn('[Warblast] Échec init SDK', e); resolve(false); });
      }
    });
  };

  S.hook = function () {
    const b = S.bridge;
    try {
      b.platform.on(b.EVENT_NAME.AUDIO_STATE_CHANGED, function (enabled) { WB.snd && WB.snd.setPlatformAudio(!!enabled); });
      b.platform.on(b.EVENT_NAME.PAUSE_STATE_CHANGED, function (paused) { if (WB.ui) WB.ui.onPlatformPause(!!paused); });
    } catch (e) { console.warn(e); }
    try {
      b.advertisement.on(b.EVENT_NAME.INTERSTITIAL_STATE_CHANGED, function (state) {
        if (state === 'opened') { S.adOpen = true; WB.snd && WB.snd.setAdMute(true); }
        if (state === 'closed' || state === 'failed') { S.adOpen = false; WB.snd && WB.snd.setAdMute(false); S.lastInterstitial = Date.now(); if (S.interCb) { const cb = S.interCb; S.interCb = null; cb(); } }
      });
      b.advertisement.on(b.EVENT_NAME.REWARDED_STATE_CHANGED, function (state) {
        if (state === 'opened') { S.adOpen = true; WB.snd && WB.snd.setAdMute(true); }
        if (state === 'rewarded') { const cb = S.pendingReward; S.pendingReward = null; if (cb) cb(true); }
        if (state === 'closed' || state === 'failed') {
          S.adOpen = false; WB.snd && WB.snd.setAdMute(false);
          if (S.pendingReward) { const cb = S.pendingReward; S.pendingReward = null; cb(false); }
        }
      });
    } catch (e) { console.warn(e); }
  };

  S.msg = function (name) { try { if (S.ready) S.bridge.platform.sendMessage(name); } catch (e) {} };

  S.rewardedSupported = function () { try { return !!(S.ready && S.bridge.advertisement.isRewardedSupported); } catch (e) { return false; } };
  S.interstitialSupported = function () { try { return !!(S.ready && S.bridge.advertisement.isInterstitialSupported); } catch (e) { return false; } };

  // La récompense n'est donnée que lorsque le SDK confirme l'état "rewarded".
  S.showRewarded = function (placement, cb) {
    if (!S.rewardedSupported()) { cb(false, 'indisponible'); return; }
    S.pendingReward = function (ok) { cb(ok); };
    try { S.bridge.advertisement.showRewarded(placement); } catch (e) { S.pendingReward = null; cb(false, 'erreur'); }
  };

  // Interstitielle : jamais au démarrage, jamais en pleine partie, au moins 60 s entre deux.
  S.showInterstitial = function (placement, cb) {
    if (!S.interstitialSupported() || Date.now() - S.lastInterstitial < 60000) { cb && cb(); return; }
    let finished = false;
    const end = function () { if (finished) return; finished = true; cb && cb(); };
    S.interCb = end;
    setTimeout(end, 9000);
    try { S.bridge.advertisement.showInterstitial(placement); } catch (e) { end(); }
  };

  S.showBanner = function () { try { if (S.ready && S.bridge.advertisement.isBannerSupported) S.bridge.advertisement.showBanner('bottom', 'menu'); } catch (e) {} };
  S.hideBanner = function () { try { if (S.ready && S.bridge.advertisement.isBannerSupported) S.bridge.advertisement.hideBanner(); } catch (e) {} };

  // ---- Sauvegarde (Bridge storage + copie locale) ----
  function defaults() {
    const chars = {};
    for (let i = 0; i < WB.CHARS.length; i++) chars[i] = { lvl: 1, xp: 0 };
    return { v: 2, level: 1, coins: 0, trophies: 0, lvKills: 0, spec: WB.defaultSpec(), chars: chars, owned: {}, sound: true, music: true, sfxVol: 1, musVol: 0.6, duration: 240, stats: { matches: 0, kills: 0, wins: 0 }, name: 'Joueur' };
  }
  WB.defaultSave = defaults;

  function merge(d) {
    const base = defaults();
    if (!d || typeof d !== 'object') return base;
    const r = Object.assign(base, d);
    r.spec = Object.assign(WB.defaultSpec(), d.spec || {});
    r.chars = Object.assign(base.chars, d.chars || {});
    // le niveau appartient au profil : on reprend le meilleur niveau déjà obtenu avec n'importe quel personnage
    let best = Math.max(1, +d.level || 1); for (const k in r.chars) best = Math.max(best, (r.chars[k] && r.chars[k].lvl) || 1);
    r.level = Math.min(WB.MAXLV, best);
    r.name = (typeof d.name === 'string' && d.name.trim()) ? d.name : base.name;
    r.duration = [180, 240, 300].indexOf(+r.duration) >= 0 ? +r.duration : 240;
    r.sfxVol = Math.min(1, Math.max(0, r.sfxVol == null ? 1 : +r.sfxVol)); r.musVol = Math.min(1, Math.max(0, r.musVol == null ? 0.6 : +r.musVol)); r.music = r.music !== false;
    r.stats = Object.assign({ matches: 0, kills: 0, wins: 0 }, d.stats || {});
    r.owned = d.owned || {};
    return r;
  }

  S.load = function () {
    return new Promise(function (resolve) {
      let local = null;
      try { local = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
      if (S.ready) {
        try {
          S.bridge.storage.get(KEY).then(function (v) {
            let d = null;
            try { d = typeof v === 'string' ? JSON.parse(v) : v; } catch (e) {}
            resolve(merge(d || local));
          }).catch(function () { resolve(merge(local)); });
          return;
        } catch (e) {}
      }
      resolve(merge(local));
    });
  };

  let saveTimer = null;
  S.save = function (data) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      const s = JSON.stringify(data);
      try { localStorage.setItem(KEY, s); } catch (e) {}
      if (S.ready) { try { S.bridge.storage.set(KEY, s); } catch (e) {} }
    }, 300);
  };
})(window.WB);
