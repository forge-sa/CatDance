'use strict';
(function () {
  const S = window.CatSprites;
  const canvas = document.getElementById('cat');
  const ctx = canvas.getContext('2d');
  let mode = 'sleep';
  let step = 0;
  let queue = [];      // short transition poses played before `mode`
  let timer = null;
  let px = 1;          // device pixels per cat pixel
  let last = null;     // last drawn frame, redrawn after a resize

  function fit() {
    const dpr = window.devicePixelRatio || 1;
    px = Math.max(1, Math.floor(Math.min(window.innerWidth / S.W, window.innerHeight / S.H) * dpr));
    canvas.width = S.W * px;
    canvas.height = S.H * px;
    canvas.style.width = `${canvas.width / dpr}px`;
    canvas.style.height = `${canvas.height / dpr}px`;
  }

  function draw(grid) {
    last = grid;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < S.H; y++) {
      const row = grid[y];
      for (let x = 0; x < S.W;) {
        const c = row[x];
        let n = 1;
        while (x + n < S.W && row[x + n] === c) n++;
        if (c !== '.') {
          ctx.fillStyle = S.PAL[c];
          ctx.fillRect(x * px, y * px, n * px, px);
        }
        x += n;
      }
    }
  }

  function tick() {
    const name = queue.length ? queue.shift() : mode;
    const anim = S.ANIMS[name] || S.ANIMS.sleep;
    draw(anim.frame(step++));
    timer = setTimeout(tick, 60000 / anim.bpm / 2);
  }

  window.cat.onState((s) => {
    canvas.title = s.tooltip || '';
    if (s.mode === mode) return;
    if (mode === 'sleep') queue = ['wake', 'wake', 'wake', 'wake'];   // "!" then dance
    else if (s.mode === 'sleep') queue = ['sit', 'sit', 'sit'];      // sit, then lie down
    else queue = [];
    mode = s.mode;
    step = 0;
    clearTimeout(timer);
    tick();
  });

  canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); window.cat.menu(); });
  window.addEventListener('resize', () => { fit(); if (last) draw(last); });
  fit();
  tick();
})();
