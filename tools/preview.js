#!/usr/bin/env node
// Renders every animation to a contact-sheet image so sprites can be checked
// without launching the overlay:  node tools/preview.js out.png [scale] [frames]
// Writes a PPM and converts it with ImageMagick when the name ends in .png.
'use strict';
const fs = require('fs');
const { execFileSync } = require('child_process');
const S = require('../renderer/sprites.js');

const out = process.argv[2] || 'preview.png';
const scale = +process.argv[3] || 4;
const cols = +process.argv[4] || 12;
const names = process.argv[5] ? process.argv[5].split(',') : Object.keys(S.ANIMS);
const pad = 2;
const cw = (S.W + pad) * scale, ch = (S.H + pad) * scale;
const IW = cw * cols, IH = ch * names.length * 2;
const img = Buffer.alloc(IW * IH * 3);

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const BG = [hex('#d1c4e0'), hex('#2b2d33')];

for (let r = 0; r < names.length * 2; r++) {
  const anim = S.ANIMS[names[r >> 1]];
  const bg = BG[r & 1];
  for (let c = 0; c < cols; c++) {
    const f = anim.frame(c);
    for (let y = 0; y < S.H + pad; y++) for (let x = 0; x < S.W + pad; x++) {
      const ch2 = f[y - 1] && f[y - 1][x - 1];
      const col = ch2 && ch2 !== '.' ? hex(S.PAL[ch2]) : bg;
      for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
        const X = c * cw + x * scale + dx, Y = r * ch + y * scale + dy;
        img.set(col, (Y * IW + X) * 3);
      }
    }
  }
}

const ppm = Buffer.concat([Buffer.from(`P6 ${IW} ${IH} 255\n`), img]);
if (out.endsWith('.png')) {
  const tmp = out + '.ppm';
  fs.writeFileSync(tmp, ppm);
  execFileSync('magick', [tmp, out]);
  fs.unlinkSync(tmp);
} else fs.writeFileSync(out, ppm);
console.log(`wrote ${out} (${names.join(', ')})`);
