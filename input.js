'use strict';
(function (WB) {
  // État des commandes lu par le moteur : WB.input.move et WB.input.aim
  const I = WB.input = { move: { x: 0, y: 0 }, aim: { x: 1, y: 0, m: 0, active: false }, keys: {}, stickMove: false, touch: false };
  const K = I.keys;
  function keyName(e) { return (e.key || '').toLowerCase(); }
  window.addEventListener('keydown', function (e) {
    const k = keyName(e); K[k] = true; K[e.code] = true;
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].indexOf(k) >= 0) e.preventDefault();
    if (WB.ui && WB.ui.onKey && !e.repeat) WB.ui.onKey(e);
  });
  window.addEventListener('keyup', function (e) { K[keyName(e)] = false; K[e.code] = false; });
  window.addEventListener('blur', function () { for (const k in K) K[k] = false; });

  // Appelé à chaque image : le clavier remplit le déplacement quand aucun stick tactile n'est utilisé.
  I.update = function () {
    if (I.stickMove) return;
    let x = 0, y = 0;
    if (K['z'] || K['w'] || K['arrowup']) y -= 1;
    if (K['s'] || K['arrowdown']) y += 1;
    if (K['q'] || K['a'] || K['arrowleft']) x -= 1;
    if (K['d'] || K['arrowright']) x += 1;
    const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
    I.move.x = x; I.move.y = y;
  };
  I.reset = function () { I.move.x = I.move.y = 0; I.aim.active = false; I.aim.m = 0; I.stickMove = false; };
})(window.WB);
