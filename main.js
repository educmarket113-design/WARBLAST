'use strict';
(function (WB) {
  const cv = document.getElementById('game');
  let last = performance.now(), booted = false;
  function loop(now) {
    requestAnimationFrame(loop);
    let dt = (now - last) / 1000; last = now; if (dt > 0.1) dt = 0.1; if (dt < 0) dt = 0;
    try { WB.ui.frame(dt, now / 1000); }
    catch (e) { if (!loop.err) { loop.err = true; console.error('[Warblast] erreur de rendu', e); setTimeout(function () { loop.err = false; }, 2000); } }
  }
  async function boot() {
    // 1. SDK Playgama (le jeu démarre même s'il est absent)
    try { await WB.sdk.init(); } catch (e) { console.warn(e); }
    // 2. sauvegarde
    let save; try { save = await WB.sdk.load(); } catch (e) { save = WB.defaultSave(); }
    // 3. interface
    WB.ui.init(cv, save);
    const b = document.getElementById('boot'); if (b) { b.classList.add('off'); setTimeout(function () { b.remove(); }, 400); }
    booted = true;
    requestAnimationFrame(function (t) { last = t; loop(t); });
    // 4. le jeu est prêt
    WB.sdk.msg('game_ready');
    WB.sdk.showBanner();
  }
  window.addEventListener('error', function (e) { console.error('[Warblast]', e.message); });
  boot();
  WB.debug = { get booted() { return booted; } };
})(window.WB);
