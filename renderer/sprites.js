// Pixel cat sprites + animations. Pure data/logic, shared by the overlay
// renderer and tools/preview.js. A frame is a W×H grid of palette chars.
(function (root) {
  'use strict';

  const W = 30, H = 24;

  // Fur/outline tones sampled from "cat ref.jpg".
  const PAL = {
    K: '#241e1f', F: '#b9a78b', S: '#7d6c53', E: '#cdbfa8', C: '#a99676', B: '#998669',
    w: '#f6f3ec', g: '#b4b9c2', G: '#5c6068',
    R: '#d4453c', r: '#8f2b2b', N: '#9a6638', n: '#5a3921',
    Y: '#eab83c', y: '#a8781c', H: '#fff1b0',
    k: '#141216', U: '#3f74d8', u: '#24489a', P: '#ef8fa6',
    L: '#9fd0ff', Z: '#d9ecff',
    V: '#6ad94f', v: '#2f8f2a',            // punk mohawk
    M: '#ff77bd', m: '#c8418d',            // k-pop hair
    A: '#ffd98a',                          // lamp light
    i: '#ebbab5', I: '#c48d8c', T: '#7cc6c2', // Isaac: skin, shade, tears
    D: '#2b3f91', d: '#5574d6',            // Persona 3 hair
    j: '#7a5a3a', J: '#c9a77c', e: '#e4cfa8', // Minecraft cat texture
  };

  const spr = (s) => s.split('\n').map((r) => r.trim()).filter((r) => r.length);

  // ---------------------------------------------------------------- parts
  const HEAD = spr(`
    .K.....K.
    KEK...KEK
    KBEKKKEBK
    KFFSFSFFK
    KFFFFFFFK
    KSKFFKFSK
    KFFSFFFFK
    KSFCCFFSK
    .KCCCCBK.
  `);
  // row overrides for face variants (row index -> string)
  const FACE_SLEEP = { 5: 'KSFFFFFSK', 6: 'KKKSFKKFK' };
  const FACE_SHOUT = { 7: 'KSFkkFFSK', 8: '.KCrrCBK.' };
  const FACE_SING = { 5: 'KSFFFFFSK', 6: 'KKKSFKKFK', 7: 'KSFkkFFSK', 8: '.KCrrCBK.' };
  const FACE_WINK = { 5: 'KSKFFFFSK', 6: 'KFFSFKKFK' };
  const FACE_DOWN = { 5: 'KSFFFFFSK', 6: 'KFKSFKFFK' };
  const SHADES = spr(`
    .KKKKKKK.
    .wkkKwkk.
    ..kk.kk..
  `);
  const BERET = spr(`
    .....k....
    ..kkkkkkk.
    .kkkkkkkkk
    ..KKKKKKK.
  `);
  const CAP = spr(`
    ..rRRRr....
    .rRRRRRRr..
    .KKKKKKKRRR
  `);
  const BOWTIE = spr(`
    R.R
    RrR
  `);

  const TORSO = spr(`
    .KSBBBSK.
    .KFFFFFK.
    .KSFFFSK.
    .KFFFFFK.
    .KFSFSFK.
    .KFFFFFK.
  `);
  // outfits (same shape as TORSO)
  const TORSO_TEE = spr(`
    .KkkkkkK.
    .KkkkkkK.
    .KkwRwkK.
    .KkRwRkK.
    .KkkkkkK.
    .KFFFFFK.
  `);
  const TORSO_JACKET = spr(`
    .KkFFFkK.
    .KkkFkkK.
    .KgkFkgK.
    .KkkFkkK.
    .KkgkgkK.
    .KFFFFFK.
  `);
  const TORSO_TUX = spr(`
    .KkwRwkK.
    .KkkwkkK.
    .KkwwwkK.
    .KkkwkkK.
    .KkkkkkK.
    .KkkkkkK.
  `);
  const LEG_L = spr(`
    KFFK
    KSSK
    KKK.
  `);
  const LEG_R = spr(`
    KFFK
    KSSK
    .KKK
  `);

  // Sitting cat, straight from the reference image (16×16).
  const SIT = spr(`
    .K.....K........
    KEK...KEK.......
    KBEKKKEBK.......
    KFFSFSFFK...KK..
    KFFFFFFFK..KFFK.
    KSKFFKFSK..KFFSK
    KFFSFFFFK...KSFK
    KSFCCFFSK....KSK
    .KCCCCBKK....KFK
    ..KSBBSSSK...KSK
    ..KFFFFSFSKKKSFK
    ..KSFFSFSFSKFFK.
    ..KFFFFFFFFKKK..
    ..KFFKFFKFFK....
    ..KSSKSSKSSK....
    ..KKKKKKKKKK....
  `);

  // Curled-up loaf for sleeping (head on the left, tail wrapped in front).
  const LOAF = spr(`
    .K.....K............
    KEK...KEK...........
    KBEKKKEBKKKKKKK.....
    KFFSFSFFKFSFSFFKK...
    KFFFFFFFKSFSFFSFFK..
    KSFFFFFSKFFFFFFFSFK.
    KKKSFKKFKFSFFSFFFFFK
    KSFCCFFSKFFFFFFFFSFK
    .KCCCCBKKKKKKKKKKKFK
    KFSFFSFFSFFSFFSFFKFK
    KKKKKKKKKKKKKKKKKKK.
  `);
  // exhale: back sinks one pixel
  const LOAF_OUT = { 2: 'KBEKKKEBK...........', 3: 'KFFSFSFFKKKKKKKKK...', 4: 'KFFFFFFFKSFSFFSFFKK.' };

  const GUITAR_BODY = spr(`
    .KKK..KK.
    KRRRKKRRK
    KRRRRRRRK
    .KRwwwRK.
    KRRgggRRK
    KRRRRRRRK
    .KKKKKKK.
  `);

  const SAX = spr(`
    KK...........
    KgK..........
    .KYK.........
    ..KYK........
    ...KYK....KKK
    ....KYK..KyyyK
    ....KHYK.KYYYK
    .....KYYK.KYK.
    ......KHYKKYK.
    .......KYYYK..
    ........KKK...
  `);

  // Piano seen from the front; the cat sits behind it.
  const PIANO = spr(`
    KKKKKKKKKKKKKKKKKKKKKKKK
    KnnnnnnnnnnnnnnnnnnnnnnK
    KwkwkwwkwkwkwwkwkwwkwkwK
    KwkwkwwkwkwkwwkwkwwkwkwK
    KwwwwwwwwwwwwwwwwwwwwwwK
    KKKKKKKKKKKKKKKKKKKKKKKK
    .KnnnnnnnnnnnnnnnnnnnnK.
    .KnNNNNNNNNNNNNNNNNNNnK.
    .KnnnnnnnnnnnnnnnnnnnnK.
    .KK.................KK.
    .KK.................KK.
  `);

  // little glyphs (drawn with an automatic outline so they show on any wallpaper)
  const NOTE1 = spr(`
    .##
    .#.
    ##.
    ##.
  `);
  const NOTE2 = spr(`
    .####
    .#..#
    ##.##
    ##.##
  `);
  const ZSMALL = spr(`
    ####
    ..#.
    .#..
    ####
  `);
  const ZBIG = spr(`
    #####
    ...#.
    ..#..
    .#...
    #####
  `);
  const BANG = spr(`
    #
    #
    #
    .
    #
  `);
  const SPARK = spr(`
    .#.
    ###
    .#.
  `);
  const HEART = spr(`
    ##.##
    #####
    .###.
    ..#..
  `);
  const BOLT = spr(`
    .##
    ##.
    .##
    ##.
  `);

  // ---- game references
  // Isaac (The Binding of Isaac): big head, tiny body, crying.
  const ISAAC_HEAD = spr(`
    .....KKKKK.....
    ...KKiiiiiKK...
    ..KiiiiiiiiiK..
    .KiiiiiiiiiiiK.
    .KiiiiiiiiiiiK.
    KiiiiiiiiiiiiiK
    KiiiiiiiiiiiiiK
    KiiiiiiiiiiiiiK
    KIiiiiiiiiiiiiK
    KIiiiiiiiiiiiIK
    .KIiiiiiiiiiIK.
    ..KKIIiiiIIKK..
    ....KKKKKKK....
  `);
  // drawn at head (x+1, y+5)
  const ISAAC_FACE = spr(`
    .kkk.....kkk.
    .kwk.....kwk.
    .kkk.....kkk.
    .TT..KKK..TT.
    .TT.KwwwK.TT.
    ..T.KKKKK.T..
  `);
  const ISAAC_TORSO = spr(`
    .KiiiK.
    KiiiiiK
    KIiiiiK
    KIiiiiK
  `);
  const ISAAC_LEG = spr(`
    KiK
    KiK
    KKK
  `);

  // Persona 3 protagonist: blue hair over one eye, headphones round the neck,
  // black school blazer.
  const P3_HAIR = spr(`
    ...KDDDK...
    .KDDDDDDDK.
    KDDdDDDdDDK
    KDDDDDD..DK
    KDDDK....DK
    .KDDK....K.
    ..KK.......
  `);
  const P3_PHONES = spr(`
    KGK...KGK
    .KgggggK.
  `);
  const TORSO_P3 = spr(`
    .KkwwwkK.
    .KkkwkkK.
    .KkkwkkK.
    .KkkwkkK.
    .KkkkkkK.
    .KkkkkkK.
  `);
  const LEGS_P3 = [spr(`
    KkkK
    KkkK
    KKK.
  `), spr(`
    KkkK
    KkkK
    .KKK
  `)];
  // the series' blue butterfly: wings open / folded
  const BUTTERFLY = [spr(`
    U...U
    LU.UL
    LLkLL
    .LkL.
  `), spr(`
    .....
    .U.U.
    .LkL.
    ..k..
  `)];

  // Minecraft: everything is a block.
  const MC_HEAD = spr(`
    KKKK..KKKK
    KJjK..KjJK
    KKKKKKKKKK
    KJjJJjJJjK
    KJJjJJjJJK
    KVkJJJJVkK
    KJJJeeJJJK
    KJJePPeJJK
    KJJeeeeJJK
    KKKKKKKKKK
  `);
  const MC_BODY = spr(`
    .KKKKKKKK.
    .KJjJJjJK.
    .KJeeeeJK.
    .KjeeeejK.
    .KJjJJjJK.
    .KKKKKKKK.
  `);
  const MC_LEG = spr(`
    KJjK
    KeeK
    KKKK
  `);
  const GRASS = spr(`
    KKKKKKKKKKKKKKKK
    KVVVvVVVVVvVVVVK
    KVvNVVvVNvVVvNVK
    KNnNNNNnNNnNNNNK
    KKKKKKKKKKKKKKKK
  `);
  const MC_NOTE = spr(`
    .##
    .#.
    ##.
  `);

  // ---- props for the newer dances
  const MOHAWK = spr(`
    ..K..
    .KVK.
    KVVK.
    .KVVK
    KVvVK
    .KvK.
  `);
  // pink idol hair, overlaid on HEAD at (hx-1, hy+1); ears poke through
  const HAIR = spr(`
    ...KMMMK...
    .KMMMMMMMK.
    KMMMMMMMMMK
    KMMFMMMFMMK
    KMK.....KMK
    KMK.....KMK
    .K.......K.
  `);
  // devil horns: index + pinky up. The arm attaches at the bottom middle.
  const HORNS = spr(`
    .K.K.
    KFKFK
    KFFFK
    KFFFK
    .KKK.
  `);
  const FIST = spr(`
    .KK.
    KFFK
    KFFK
    .KK.
  `);
  const MIC = spr(`
    .KKK.
    KgGgK
    KGgGK
    KgGgK
    .KKK.
  `);
  const DESK = spr(`
    KKKKKKKKKKKKKKKKKKKKKKKK
    KNNNNNNNNNNNNNNNNNNNNNNK
    KnnnnnnnnnnnnnnnnnnnnnnK
    KKKKKKKKKKKKKKKKKKKKKKKK
    .KnK................KnK.
    .KnK................KnK.
    .KnK................KnK.
    .KKK................KKK.
  `);
  const BOOK = spr(`
    KKKKKKKKKKK
    KwgwgwKwgwK
    KwwwwwKwwwK
  `);
  const LAMP = spr(`
    .KKKKK..
    KYYYYYK.
    .KAAAK..
    ...KGK..
    ...KGK..
    ..KGGGK.
  `);
  const MUG = spr(`
    KKKK.
    KUUKK
    KUUKK
    KKKK.
  `);

  // ------------------------------------------------------------ drawing
  const blank = () => Array.from({ length: H }, () => Array(W).fill('.'));

  function put(buf, x, y, c) {
    if (x >= 0 && x < W && y >= 0 && y < H) buf[y][x] = c;
  }

  function blit(buf, sp, x, y, opts) {
    const flip = opts && opts.flip;
    const rows = opts && opts.rows;
    for (let j = 0; j < sp.length; j++) {
      const row = (rows && rows[j]) || sp[j];
      for (let i = 0; i < row.length; i++) {
        const c = flip ? row[row.length - 1 - i] : row[i];
        if (c !== '.') put(buf, x + i, y + j, c);
      }
    }
  }

  const key = (x, y) => x + ',' + y;

  // Glyph: '#' pixels become `fill`. `outline` draws a full K border (fine for
  // chunky shapes like notes); otherwise a 1px drop shadow keeps it readable
  // on both light and dark wallpapers.
  function glyph(buf, sp, x, y, fill, outline) {
    const pts = [];
    sp.forEach((row, j) => [...row].forEach((c, i) => c === '#' && pts.push([x + i, y + j])));
    const set = new Set(pts.map(([a, b]) => key(a, b)));
    const nb = outline
      ? [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
      : [[1, 1], [0, 1], [1, 0]];
    for (const [a, b] of pts) for (const [dx, dy] of nb) {
      if (!set.has(key(a + dx, b + dy))) put(buf, a + dx, b + dy, 'K');
    }
    for (const [a, b] of pts) put(buf, a, b, fill);
  }

  // Outlined stroke from (x0,y0) to (x1,y1) ending in a 2×2 paw. Used for arms,
  // tails and the guitar neck. Pixels within `open` of the start get no
  // outline, so the limb blends into the body it grows out of.
  function limb(buf, x0, y0, x1, y1, o) {
    o = o || {};
    const pts = [], seen = new Set();
    const add = (x, y, s) => { const k = key(x, y); if (!seen.has(k)) { seen.add(k); pts.push([x, y, s]); } };
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    let px = x0, py = y0;
    for (let s = 0; s <= n; s++) {
      const cx = Math.round(x0 + ((x1 - x0) * s) / n);
      const cy = Math.round(y0 + ((y1 - y0) * s) / n);
      // keep the stroke 4-connected so the outline has no gaps
      if (cx !== px && cy !== py) add(cx, py, s);
      add(cx, cy, s);
      if (o.thick === 2) add(cx + 1, cy, s);
      px = cx; py = cy;
    }
    if (o.paw !== false) {
      const dx = x1 >= x0 ? 0 : -1, dy = y1 >= y0 ? 0 : -1;
      for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) add(x1 + a + dx, y1 + b + dy, n);
    }
    const open = o.open == null ? 1.5 : o.open;
    const set = new Set(pts.map(([x, y]) => key(x, y)));
    for (const [x, y] of pts) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const X = x + dx, Y = y + dy;
      if (set.has(key(X, Y)) || Math.hypot(X - x0, Y - y0) <= open) continue;
      put(buf, X, Y, 'K');
    }
    const fill = o.fill || 'F';
    for (const [x, y, s] of pts) {
      let c = fill;
      if (o.stripe && s % 3 === 2 && s < n) c = o.stripe;
      if (o.tip && s === n) c = o.tip;
      put(buf, x, y, c);
    }
  }

  // ------------------------------------------------------------ the cat
  // Tail growing from the hip: out, up, and the tip curling back in.
  function tail(buf, bx, by, side, wag, look) {
    const st = Object.assign({ stripe: 'S', paw: false, thick: 2 }, look);
    const ox = side > 0 ? bx + 3 : bx - 4;
    const top = by - 6;
    limb(buf, bx, by, ox, by - 1, Object.assign({ open: 1 }, st));
    limb(buf, ox, by - 1, ox + wag, top, Object.assign({ open: 0 }, st));
    limb(buf, ox + wag, top, ox + wag - side, top - 1, Object.assign({ open: 0 }, st, look && look.tipFill ? { fill: look.tipFill } : null));
  }

  // Standing cat. hx,hy = top-left of the head. Returns anchor points.
  function standingCat(buf, hx, hy, o) {
    o = o || {};
    const ty = hy + 9;          // torso top
    const lift = o.lift || 0;   // -1 left foot up, 1 right foot up
    if (o.tailSide !== 0) {
      const side = o.tailSide || 1;
      tail(buf, side > 0 ? hx + 6 : hx + 2, ty + 4, side, o.tailWag || 0, o.tailLook);
    }
    const legs = o.legs || [LEG_L, LEG_R];
    blit(buf, legs[0], hx + 1, ty + 6 - (lift < 0 ? 1 : 0));
    blit(buf, legs[1], hx + 4, ty + 6 - (lift > 0 ? 1 : 0));
    if (o.behind) o.behind(ty);
    blit(buf, o.torso || TORSO, hx, ty);
    const head = [hx + (o.headX || 0), hy + (o.headBob || 0)];
    if (o.drawHead) o.drawHead(head[0], head[1]);
    else blit(buf, HEAD, head[0], head[1], { rows: o.face });
    return {
      head,
      lShoulder: [hx + 2, ty + 1],
      rShoulder: [hx + 6, ty + 1],
      ty,
    };
  }

  // ------------------------------------------------------------ animations
  // Each animation: { bpm, steps, frame(i) -> grid }. One step = half a beat.

  // a new note every `every` steps, each rising for `life` steps
  function floatNotes(buf, i, x0, y0, color, every, life) {
    for (let born = i - (i % every); born > i - life; born -= every) {
      const age = i - born;
      const odd = (((born / every) % 2) + 2) % 2;
      const x = x0 + odd * 3 + Math.round(Math.sin(age * 0.8));
      glyph(buf, odd ? NOTE2 : NOTE1, x, y0 - age, color, true);
    }
  }

  function drawGuitar(buf, x, y) {
    // body at (x,y); neck runs up and to the right
    limb(buf, x + 7, y + 2, x + 16, y - 3, { fill: 'n', paw: false, open: 0 });
    limb(buf, x + 16, y - 3, x + 17, y - 4, { fill: 'g', open: 0 });
    blit(buf, GUITAR_BODY, x, y);
  }

  function headphones(buf, hx, hy) {
    const band = { fill: 'G', paw: false, open: 0 };
    limb(buf, hx + 2, hy + 1, hx + 6, hy + 1, band);
    limb(buf, hx + 2, hy + 1, hx - 1, hy + 4, band);
    limb(buf, hx + 6, hy + 1, hx + 9, hy + 4, band);
    const cup = ['KKK', 'KPK', 'KPK', 'KKK'];
    blit(buf, cup, hx - 2, hy + 4);
    blit(buf, cup, hx + 8, hy + 4);
  }

  // point between a and b (t in 0..1), rounded to the pixel grid
  const lerp = (a, b, t) => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t)];

  function isaacHead(buf, x, y) {
    blit(buf, ISAAC_HEAD, x, y);
    ISAAC_FACE.forEach((row, j) => [...row].forEach((c, i) => {
      if (c !== '.') put(buf, x + 1 + i, y + 5 + j, c);
    }));
  }

  const ANIMS = {
    // the reference pose: shown briefly when waking up / settling down
    sit: {
      bpm: 60, steps: 2,
      frame() { const b = blank(); blit(b, SIT, 7, 8); return b; },
    },
    wake: {
      bpm: 100, steps: 2,
      frame(i) {
        const b = blank();
        blit(b, SIT, 7, 8);
        glyph(b, BANG, 18, 2 + (i % 2), 'Y', true);
        return b;
      },
    },

    sleep: {
      bpm: 40, steps: 24,
      frame(i) {
        const b = blank();
        blit(b, LOAF, 5, 13, { rows: i % 6 < 3 ? null : LOAF_OUT });
        const z = i % 12;
        const dy = i % 4 < 2 ? 0 : 1;
        if (z >= 1 && z < 10) glyph(b, ZSMALL, 13, 10 + dy, 'Z');
        if (z >= 4 && z < 10) glyph(b, ZBIG, 18, 3 + dy, 'Z');
        return b;
      },
    },

    rock: {
      bpm: 140, steps: 16,
      frame(i) {
        const b = blank();
        const beat = i % 2 === 0;
        const jump = i % 16 === 12 || i % 16 === 13 ? 2 : 0;
        const hx = 10, hy = 6 - jump;
        const a = standingCat(b, hx, hy, {
          headBob: beat ? 1 : 0, headX: beat ? -1 : 0,
          lift: i % 4 === 1 ? 1 : 0, tailWag: beat ? 1 : 0,
          face: beat ? FACE_SLEEP : null,
        });
        drawGuitar(b, hx - 3, a.ty + 3);
        limb(b, a.rShoulder[0], a.rShoulder[1], hx + 9, a.ty);                 // fretting
        limb(b, a.lShoulder[0], a.lShoulder[1], hx + 2, a.ty + 5 + (beat ? -1 : 0)); // strumming
        if (i % 4 === 0) glyph(b, SPARK, hx - 5, a.ty + 3, 'Y', true);
        if (i % 4 === 2) glyph(b, SPARK, hx + 14, a.ty - 7, 'Y', true);
        return b;
      },
    },

    pop: {
      bpm: 132, steps: 32,
      frame(i) {
        const b = blank();
        const hop = [1, 0, -1, 0][i % 4];
        const hx = 10, hy = hop ? 5 : 6;
        const lasso = Math.floor(i / 16) % 2 === 1;
        const a = standingCat(b, hx, hy, { lift: hop, tailWag: hop, tailSide: -1 });
        blit(b, SHADES, a.head[0], a.head[1] + 4);
        blit(b, BOWTIE, hx + 3, a.ty);
        const py = a.ty + 3 + (i % 2);
        if (!lasso) {
          // "horse riding": wrists crossed in front, bouncing
          limb(b, a.lShoulder[0], a.lShoulder[1], hx + 4, py);
          limb(b, a.rShoulder[0], a.rShoulder[1], hx + 3, py);
        } else {
          limb(b, a.lShoulder[0], a.lShoulder[1], hx + 4, py);
          // lasso paw circling above the head
          const ang = (i % 4) * (Math.PI / 2);
          limb(b, a.rShoulder[0] + 1, a.rShoulder[1], hx + 10 + Math.round(Math.cos(ang)), hy + 1 + Math.round(Math.sin(ang)), { open: 1 });
        }
        return b;
      },
    },

    jazz: {
      bpm: 96, steps: 16,
      frame(i) {
        const b = blank();
        const sway = [0, 1, 1, 0, 0, -1, -1, 0][i % 8];
        const hx = 7 + sway, hy = 6;
        const a = standingCat(b, hx, hy, {
          face: FACE_SLEEP, tailWag: -sway, tailSide: -1,
        });
        blit(b, BERET, a.head[0] + 1, a.head[1] - 2);
        blit(b, SAX, a.head[0] + 3, a.head[1] + 7);
        const f = i % 4 < 2 ? 0 : 1; // fingers on the keys
        limb(b, a.lShoulder[0], a.lShoulder[1], a.head[0] + 7, a.ty + 1 + f);
        limb(b, a.rShoulder[0], a.rShoulder[1], a.head[0] + 9, a.ty + 4 - f);
        floatNotes(b, i, a.head[0] + 16, a.ty - 3, 'w', 6, 10);
        return b;
      },
    },

    hiphop: {
      bpm: 90, steps: 16,
      frame(i) {
        const b = blank();
        const nod = i % 2 === 0 ? 1 : 0;
        const hx = 10, hy = 6;
        const a = standingCat(b, hx, hy, { headBob: nod, tailWag: nod });
        blit(b, SHADES, a.head[0], a.head[1] + 4);
        blit(b, CAP, a.head[0] - 1, a.head[1] - 1);
        // gold chain, then arms crossed over the chest
        blit(b, ['.yYYYy.', '..yHy..'], hx + 1, a.ty + 1);
        limb(b, hx + 1, a.ty + 1, hx + 6, a.ty + 4, { open: 0 });
        limb(b, hx + 7, a.ty + 1, hx + 3, a.ty + 4, { open: 0 });
        return b;
      },
    },

    classical: {
      bpm: 72, steps: 16,
      frame(i) {
        const b = blank();
        const sway = [0, 0, 1, 1, 0, 0, -1, -1][i % 8];
        const hy = 4;
        // only the upper body shows behind the piano
        blit(b, TORSO, 10, hy + 9);
        blit(b, HEAD, 10 + sway, hy, { rows: i % 8 < 4 ? FACE_SLEEP : null });
        blit(b, PIANO, 3, 14);
        const lp = [6, 8, 10, 7][Math.floor(i / 2) % 4];
        const rp = [19, 17, 21, 18][(Math.floor(i / 2) + 1) % 4];
        limb(b, 12, hy + 10, lp, 15 + (i % 2));
        limb(b, 16, hy + 10, rp, 15 + ((i + 1) % 2));
        floatNotes(b, i, 23, 11, 'L', 6, 10);
        return b;
      },
    },

    metal: {
      bpm: 168, steps: 16,
      frame(i) {
        const b = blank();
        const down = i % 2 === 0;
        const hx = 9, hy = 6;
        const a = standingCat(b, hx, hy, {
          torso: TORSO_TEE, headBob: down ? 2 : -1, headX: down ? 1 : 0,
          face: down ? FACE_SING : FACE_SHOUT, lift: i % 4 === 0 ? -1 : 0, tailWag: down ? 1 : -1,
        });
        // devil horns pumping over the head, other paw a fist
        const px = hx + 11, py = hy - 3 + (down ? 0 : -1);
        limb(b, a.rShoulder[0], a.rShoulder[1], px + 2, py + 4, { paw: false });
        blit(b, HORNS, px, py);
        limb(b, a.lShoulder[0], a.lShoulder[1], hx - 1, a.ty + 3 + (down ? 1 : 0), { paw: false });
        blit(b, FIST, hx - 3, a.ty + 2 + (down ? 1 : 0));
        if (down) glyph(b, BOLT, hx - 6, hy + 1 + (i % 4), 'Y', true);
        return b;
      },
    },

    punk: {
      bpm: 176, steps: 8,
      frame(i) {
        const b = blank();
        const jump = [0, 1, 2, 1][i % 4];  // pogo!
        const hx = 10, hy = 6 - jump;
        const a = standingCat(b, hx, hy, { torso: TORSO_JACKET, face: FACE_SHOUT, tailWag: jump ? 1 : 0 });
        blit(b, MOHAWK, a.head[0] + 2, a.head[1] - 4);
        const fy = jump ? hy - 1 : hy + 1;
        limb(b, a.lShoulder[0], a.lShoulder[1], hx - 2, fy + 3, { paw: false });
        blit(b, FIST, hx - 4, fy);
        limb(b, a.rShoulder[0], a.rShoulder[1], hx + 8, a.ty + 4);
        if (jump === 2) glyph(b, SPARK, hx + 13, hy - 1, 'V', true);
        return b;
      },
    },

    lofi: {
      bpm: 76, steps: 16,
      frame(i) {
        const b = blank();
        const nod = Math.floor(i / 2) % 2;
        const hy = 3;
        blit(b, TORSO, 10, hy + 9);
        blit(b, HEAD, 10, hy + nod, { rows: FACE_DOWN });
        headphones(b, 10, hy + nod);
        blit(b, DESK, 3, 15);
        blit(b, BOOK, 9, 12);
        blit(b, LAMP, 2, 9);
        blit(b, MUG, 22, 11);
        // steam
        for (let k = 0; k < 2; k++) {
          const t = (i + k * 3) % 6;
          if (t < 4) b[10 - t][23 + ((t + k) % 2)] = 'g';
        }
        // left paw resting on the page, right paw scribbling with a pencil
        limb(b, 12, hy + 10, 11, 13);
        const wx = 16 + [0, 1, 2, 1][i % 4];
        limb(b, 16, hy + 10, wx, 13);
        b[12][wx + 2] = 'Y'; b[11][wx + 3] = 'Y'; b[10][wx + 4] = 'r';
        floatNotes(b, i, 3, 5, 'P', 8, 5);
        return b;
      },
    },

    orchestral: {
      bpm: 88, steps: 16,
      frame(i) {
        const b = blank();
        const beat = Math.floor(i / 2) % 4;   // conducting in 4/4
        const half = (i % 2) * 0.5;
        const hx = 9, hy = 4;
        blit(b, ['KKKKKKKKKKKKKKK', 'KnnnnnnnnnnnnnK'], 6, 22);  // podium
        const a = standingCat(b, hx, hy, {
          torso: TORSO_TUX, tailSide: -1, headBob: beat === 0 ? 1 : 0,
          face: beat === 0 ? FACE_SLEEP : null,
        });
        // baton paw traces the beat pattern: down, in, out, up
        const R = [[hx + 9, a.ty + 4], [hx + 6, a.ty + 1], [hx + 13, a.ty + 1], [hx + 10, hy + 1]];
        const p = lerp(R[beat], R[(beat + 1) % 4], half);
        limb(b, a.rShoulder[0], a.rShoulder[1], p[0], p[1]);
        limb(b, p[0] + 1, p[1] - 1, p[0] + 4, p[1] - 4, { fill: 'w', paw: false, open: 0 });
        // free paw rises and falls with the music
        const Lp = [[hx - 3, a.ty - 2], [hx - 3, a.ty], [hx - 4, a.ty + 2], [hx - 4, a.ty - 1]];
        const l = lerp(Lp[beat], Lp[(beat + 1) % 4], half);
        limb(b, a.lShoulder[0], a.lShoulder[1], l[0], l[1]);
        return b;
      },
    },

    soul: {
      bpm: 84, steps: 16,
      frame(i) {
        const b = blank();
        const sway = [0, 0, 1, 1, 0, 0, -1, -1][i % 8];
        const hx = 7 + sway, hy = 6;
        const a = standingCat(b, hx, hy, { face: FACE_SING, tailSide: -1, tailWag: sway });
        // mic on a stand, just off the cat's cheek
        const mx = 14, my = hy + 6;
        limb(b, mx + 2, my + 5, mx + 2, 22, { fill: 'G', paw: false, open: 0 });
        blit(b, ['.KKKKK.', 'KGGGGGK', 'KKKKKKK'], mx - 1, 21);
        blit(b, MIC, mx, my);
        limb(b, a.rShoulder[0], a.rShoulder[1], mx + 1, my + 6);
        // the other paw sweeps out with feeling
        const g = Math.floor(i / 4) % 4;
        const L = [[hx - 3, a.ty + 3], [hx - 4, a.ty], [hx - 3, hy + 3], [hx - 4, a.ty]][g];
        limb(b, a.lShoulder[0], a.lShoulder[1], L[0], L[1]);
        floatNotes(b, i, mx + 6, my - 1, 'P', 6, 10);
        return b;
      },
    },

    kpop: {
      bpm: 124, steps: 16,
      frame(i) {
        const b = blank();
        const pose = Math.floor(i / 4) % 4;   // point R, point L, wave, finger heart
        const sway = [1, -1, 0, 0][pose];
        const hx = 10 + sway, hy = 6;
        const a = standingCat(b, hx, hy, {
          lift: i % 2 ? (pose % 2 ? -1 : 1) : 0, tailWag: sway, tailSide: pose === 1 ? 1 : -1,
          face: pose === 3 ? FACE_WINK : null,
        });
        blit(b, HAIR, a.head[0] - 1, a.head[1] + 1);
        const L = a.lShoulder, R = a.rShoulder, f = i % 2;
        if (pose === 0) {
          limb(b, R[0], R[1], hx + 12, hy - 1 + f);
          limb(b, L[0], L[1], hx + 1, a.ty + 4);
        } else if (pose === 1) {
          limb(b, L[0], L[1], hx - 4, hy - 1 + f);
          limb(b, R[0], R[1], hx + 7, a.ty + 4);
        } else if (pose === 2) {
          limb(b, L[0], L[1], hx - 4, a.ty + (f ? -1 : 1));
          limb(b, R[0], R[1], hx + 12, a.ty + (f ? 1 : -1));
        } else {
          // finger heart by the cheek + wink
          limb(b, R[0], R[1], hx + 10, hy + 5);
          limb(b, L[0], L[1], hx + 1, a.ty + 4);
          glyph(b, HEART, hx + 10, hy - 1 - f, 'M', true);
        }
        glyph(b, SPARK, f ? 3 : 25, f ? 4 : 9, 'w', true);
        return b;
      },
    },

    // ---- game soundtrack costumes

    // Isaac dancing (after the "Specialist Dance for Good Items" mod), face
    // always forward: sway + bounce, flapping arms, step-touch.
    isaac: {
      bpm: 128, steps: 32,
      frame(i) {
        const b = blank();
        const phase = Math.floor((i % 32) / 8), k = i % 8;
        const sway = [0, -1, -1, 0, 0, 1, 1, 0][k];
        const bounce = i % 2;
        let lift = 0, lOut = false, rOut = false;
        if (phase === 0) { lOut = rOut = !!bounce; }
        else if (phase === 1) { lOut = k % 4 < 2; rOut = !lOut; }
        else if (phase === 2) { lift = [0, -1, 0, 1][k % 4]; lOut = lift < 0; rOut = lift > 0; }
        else { lOut = rOut = true; }
        const bx = 11 + sway, hx = 7 + sway, hy = 4 + bounce;
        blit(b, ISAAC_LEG, bx + 1, 19 - (lift < 0 ? 1 : 0));
        blit(b, ISAAC_LEG, bx + 5, 19 - (lift > 0 ? 1 : 0));
        blit(b, ISAAC_TORSO, bx + 1, 16);
        limb(b, bx + 2, 17, lOut ? bx - 2 : bx - 1, lOut ? 17 : 19, { fill: 'i' });
        limb(b, bx + 6, 17, rOut ? bx + 10 : bx + 9, rOut ? 17 : 19, { fill: 'i' });
        isaacHead(b, hx, hy);
        return b;
      },
    },

    // Persona 3 protagonist: hands in pockets, cool nod, blue butterfly.
    persona: {
      bpm: 120, steps: 32,
      frame(i) {
        const b = blank();
        const sway = [0, 0, 1, 1, 0, 0, -1, -1][Math.floor(i / 2) % 8];
        const hx = 10 + sway, hy = 6;
        const a = standingCat(b, hx, hy, {
          torso: TORSO_P3, legs: LEGS_P3, headBob: i % 2 ? 0 : 1, tailWag: sway, lift: i % 8 === 3 ? 1 : 0,
        });
        blit(b, P3_HAIR, a.head[0] - 1, a.head[1] + 1);
        blit(b, P3_PHONES, hx, a.ty - 1);
        limb(b, a.lShoulder[0], a.lShoulder[1], hx + 1, a.ty + 4, { fill: 'k', paw: false });
        limb(b, a.rShoulder[0], a.rShoulder[1], hx + 7, a.ty + 4, { fill: 'k', paw: false });
        b[a.ty + 2][hx + 6] = 'R'; // armband on his left arm
        const t = i * 0.35;
        blit(b, BUTTERFLY[i % 2], Math.round(22 + Math.cos(t) * 3), Math.round(6 + Math.sin(t * 1.3) * 3));
        return b;
      },
    },

    // Minecraft: a square cat on a grass block, note-block particles.
    minecraft: {
      bpm: 80, steps: 16,
      frame(i) {
        const b = blank();
        const hop = [0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0][i % 16];
        blit(b, GRASS, 7, 19);
        const y = -hop;
        limb(b, 18, 15 + y, 21 + (i % 4 < 2 ? 0 : 2), 9 + y, { fill: 'J', stripe: 'j', paw: false, thick: 2, open: 0 });
        blit(b, MC_LEG, 11, 16 + y);
        blit(b, MC_LEG, 15, 16 + y);
        blit(b, MC_BODY, 10, 11 + y);
        const blink = i % 16 === 12;
        blit(b, MC_HEAD, 10, 2 + y + (i % 2), { rows: blink ? { 5: 'KkkJJJJkkK' } : null });
        const colors = ['V', 'R', 'Y', 'L', 'P', 'U'];
        for (let k = 0; k < 2; k++) {
          const age = (i + k * 4) % 8;
          glyph(b, MC_NOTE, k ? 5 : 23, 12 - age, colors[(Math.floor((i + k * 4) / 8) + k * 3) % colors.length], true);
        }
        return b;
      },
    },
  };

  // dance keys in menu order
  const GENRES = ['rock', 'metal', 'punk', 'pop', 'kpop', 'jazz', 'soul', 'hiphop', 'lofi', 'classical', 'orchestral'];
  const LABELS = {
    rock: 'Rock', metal: 'Metal', punk: 'Punk', pop: 'Pop', kpop: 'K-pop', jazz: 'Jazz', soul: 'Soul',
    hiphop: 'Hip-hop', lofi: 'Lo-fi', classical: 'Classical (piano)', orchestral: 'Orchestral',
    isaac: 'Isaac', persona: 'Persona 3', minecraft: 'Minecraft',
  };
  // game-soundtrack costumes
  const REFS = ['isaac', 'persona', 'minecraft'];

  const api = { W, H, PAL, ANIMS, GENRES, REFS, LABELS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CatSprites = api;
})(this);
