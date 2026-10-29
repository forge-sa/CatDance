'use strict';
const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { watchPlayers } = require('./lib/mpris');
const { createResolver, cleanTrack, trackKey } = require('./lib/genre');
const { W, H, GENRES, LABELS, PAL, ANIMS } = require('./renderer/sprites.js');

const APP_ID = 'catdance'; // Wayland app_id, from "desktopName" in package.json
const DEMO_ORDER = ['sleep', ...GENRES];

const readJSON = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } };
const log = (...a) => console.log('[catdance]', ...a);

const config = Object.assign({
  scale: 4,                 // screen pixels per cat pixel
  corner: 'bottom-right',   // where it first appears; afterwards it remembers where you drag it
  margin: 24,
  defaultGenre: 'pop',      // dance used when the genre can't be figured out
  onlineLookup: true,       // ask Deezer / MusicBrainz about the playing song
  pollMs: 1000,
  ignorePlayers: ['playerctld'],
  // chat apps that show up as media players while playing voice notes / sounds
  ignoreTitles: ['WhatsApp', 'Discord', 'Telegram', 'Slack', 'Zoom', 'Microsoft Teams', 'Google Meet'],
}, readJSON(path.join(__dirname, 'config.json'), {}));

// A 30×24 canvas doesn't need the GPU; this saves a process and ~100 MB.
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-features', 'SpareRendererForSitePerProcess,MediaRouter');

// ------------------------------------------------------------ saved state
const statePath = () => path.join(app.getPath('userData'), 'state.json');
let state;
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 500);
}
function flush() {
  clearTimeout(saveTimer);
  const keys = Object.keys(state.cache);
  for (const k of keys.slice(0, Math.max(0, keys.length - 3000))) delete state.cache[k];
  fs.mkdirSync(path.dirname(statePath()), { recursive: true });
  fs.writeFileSync(statePath(), JSON.stringify(state, null, 1));
}

// ------------------------------------------------------------ Hyprland
const onHyprland = !!process.env.HYPRLAND_INSTANCE_SIGNATURE;
const hyprctl = (args) => new Promise((resolve) =>
  execFile('hyprctl', args, { timeout: 3000 }, (err, out) => resolve(err ? null : out)));

function cornerExpr(w, h) {
  const m = config.margin;
  const x = /left/.test(config.corner) ? `${m}` : `monitor_w-${w + m}`;
  const y = /top/.test(config.corner) ? `${m}` : `monitor_h-${h + m}`;
  return `${x} ${y}`;
}

// Floating, pinned to every workspace, no borders/shadow/blur. Registered at
// runtime so the Hyprland config doesn't need editing; the previous rule from
// an earlier launch is switched off first.
async function registerHyprRule(w, h) {
  if (!onHyprland) return;
  const move = state.pos ? `${state.pos.x} ${state.pos.y}` : cornerExpr(w, h);
  const lua = 'if CATDANCE_RULE then CATDANCE_RULE:set_enabled(false) end ' +
    `CATDANCE_RULE = hl.window_rule({ name = "catdance", match = { class = "^${APP_ID}$" }, ` +
    `float = true, pin = true, size = "${w} ${h}", move = "${move}", no_shadow = true, no_blur = true, ` +
    'no_anim = true, border_size = 0, rounding = 0, decorate = false, no_initial_focus = true })';
  const out = await hyprctl(['eval', lua]);
  if (!out || !out.trim().startsWith('ok')) log('could not register Hyprland window rule:', out && out.trim());
}

// Remember where the cat was dragged (monitor-relative), for the next launch.
async function trackPosition() {
  if (!onHyprland) return;
  try {
    const [clients, monitors] = (await Promise.all([hyprctl(['clients', '-j']), hyprctl(['monitors', '-j'])])).map(JSON.parse);
    const c = clients.find((x) => x.class === APP_ID);
    const mon = c && monitors.find((m) => m.id === c.monitor);
    if (!mon) return;
    const pos = { x: c.at[0] - mon.x, y: c.at[1] - mon.y };
    if (!state.pos || state.pos.x !== pos.x || state.pos.y !== pos.y) {
      state.pos = pos;
      save();
    }
  } catch { /* hyprctl unavailable or no window yet */ }
}

// ------------------------------------------------------------ cat state
let win = null;
let track = null;      // current MPRIS track, or null when nothing plays
let detected = null;   // { genre, source, detail } for that track
let demo = null;       // interval id while "show off all moves" is on
let demoIdx = 0;
let resolveGenre;

function mode() {
  if (demo) return DEMO_ORDER[demoIdx % DEMO_ORDER.length];
  if (!track) return 'sleep';
  if (state.force) return state.force;
  return state.overrides[trackKey(track)] || (detected && detected.genre) || config.defaultGenre;
}

function describe() {
  if (!track) return 'Nothing playing… zzz';
  const c = cleanTrack(track);
  const song = [c.artist, c.title].filter(Boolean).join(' – ') || track.name;
  return `${song}\n${LABELS[mode()] || mode()}${detected && detected.genre ? ` (via ${detected.source})` : ''}`;
}

function push() {
  if (win && !win.isDestroyed()) win.webContents.send('state', { mode: mode(), tooltip: describe() });
  if (tray) {
    tray.setToolTip(describe());
    tray.setContextMenu(buildMenu());
  }
}

// Tray icon (same menu as right-clicking the cat), drawn from the sitting sprite.
let tray = null;
function createTray() {
  const grid = ANIMS.sit.frame(0);
  const x0 = 7, y0 = 8, n = 16, s = 2; // the cat occupies a 16×16 box there
  const buf = Buffer.alloc(n * s * n * s * 4);
  for (let y = 0; y < n * s; y++) for (let x = 0; x < n * s; x++) {
    const c = grid[y0 + Math.floor(y / s)][x0 + Math.floor(x / s)];
    if (c === '.') continue;
    const hex = PAL[c];
    const i = (y * n * s + x) * 4;
    buf[i] = parseInt(hex.slice(5, 7), 16);     // B
    buf[i + 1] = parseInt(hex.slice(3, 5), 16); // G
    buf[i + 2] = parseInt(hex.slice(1, 3), 16); // R
    buf[i + 3] = 255;
  }
  try {
    tray = new Tray(nativeImage.createFromBitmap(buf, { width: n * s, height: n * s }));
    tray.on('click', () => tray.popUpContextMenu && tray.popUpContextMenu());
  } catch (e) { log('no tray:', e.message); }
}

let seq = 0;
async function onTrack(p) {
  const my = ++seq;
  track = p;
  detected = null;
  if (!p) { log('silence -> sleeping'); return push(); }
  const pending = resolveGenre(p);
  // give the lookup a moment so the cat doesn't start with the wrong dance
  const quick = await Promise.race([pending, new Promise((r) => setTimeout(r, 1500, null))]);
  if (my !== seq) return;
  detected = quick || await pending.catch(() => null);
  if (my !== seq) return;
  const c = cleanTrack(p);
  const report = () => log(`${p.name}: ${c.artist || '?'} – ${c.title} -> ${detected && detected.genre || 'unknown'}`,
    detected ? `(${detected.source}${detected.detail ? ': ' + detected.detail : ''})` : '');
  report();
  push();
  // MusicBrainz was busy, so the answer may be too broad (Rock instead of
  // Metal). Ask again a couple of times while the song is still playing.
  for (const delay of [8000, 25000]) {
    if (!detected || !detected.partial) return;
    await new Promise((r) => setTimeout(r, delay));
    if (my !== seq) return;
    const again = await resolveGenre(p).catch(() => null);
    if (my !== seq || !again || !again.genre) continue;
    const changed = again.genre !== detected.genre;
    detected = again;
    if (changed) { report(); push(); }
  }
}

// ------------------------------------------------------------ menu
function showMenu() { buildMenu().popup({ window: win }); }

function buildMenu() {
  const key = track && trackKey(track);
  const override = key && state.overrides[key];
  const radio = (label, checked, click) => ({ label, type: 'radio', checked, click });
  const c = track && cleanTrack(track);
  const song = c && ([c.artist, c.title].filter(Boolean).join(' – ') || track.name);
  let info = 'Nothing playing — zzz';
  if (track) {
    info = !detected ? 'Looking up the genre…'
      : detected.genre ? `Sounds like ${LABELS[detected.genre]} (via ${detected.source})`
        : `Genre unknown, dancing ${LABELS[config.defaultGenre]}`;
  }
  const tpl = [
    ...(song ? [{ label: `♪ ${song.length > 48 ? song.slice(0, 47) + '…' : song}`, enabled: false }] : []),
    { label: info, enabled: false },
    { type: 'separator' },
    {
      label: 'This song is…', enabled: !!track, submenu: [
        radio('Auto-detect', !override, () => setOverride(key, null)),
        ...GENRES.map((g) => radio(LABELS[g], override === g, () => setOverride(key, g))),
      ],
    },
    {
      label: 'Always dance…', submenu: [
        radio('By genre', !state.force, () => setForce(null)),
        ...GENRES.map((g) => radio(LABELS[g], state.force === g, () => setForce(g))),
      ],
    },
    { label: 'Show off all moves', type: 'checkbox', checked: !!demo, click: toggleDemo },
    { label: 'Size', submenu: [2, 3, 4, 5, 6].map((s) => radio(`${s}×`, s === scale(), () => setScale(s))) },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ];
  return Menu.buildFromTemplate(tpl);
}

function setOverride(key, genre) {
  if (genre) state.overrides[key] = genre; else delete state.overrides[key];
  save(); push();
}
function setForce(genre) { state.force = genre; save(); push(); }
function toggleDemo() {
  if (demo) { clearInterval(demo); demo = null; } else {
    demoIdx = 0;
    demo = setInterval(() => { demoIdx++; push(); }, 6000);
  }
  push();
}

const scale = () => state.scale || config.scale;
function setScale(s) {
  state.scale = s;
  save();
  win.setResizable(true);
  win.setContentSize(W * s, H * s);
  win.setResizable(false);
}

// ------------------------------------------------------------ app
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.whenReady().then(async () => {
    state = Object.assign({ cache: {}, overrides: {}, force: null, scale: null, pos: null }, readJSON(statePath(), {}));
    resolveGenre = createResolver({
      online: config.onlineLookup,
      log,
      store: { get: (k) => state.cache[k], set: (k, v) => { state.cache[k] = v; save(); } },
    });

    const w = W * scale(), h = H * scale();
    await registerHyprRule(w, h);
    win = new BrowserWindow({
      width: w, height: h, useContentSize: true,
      transparent: true, frame: false, resizable: false, maximizable: false, fullscreenable: false,
      alwaysOnTop: true, skipTaskbar: true, hasShadow: false, show: false,
      backgroundColor: '#00000000', title: 'CatDance',
      webPreferences: { preload: path.join(__dirname, 'preload.js'), backgroundThrottling: false },
    });
    win.setMenu(null);
    win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
    win.once('ready-to-show', () => win.showInactive());
    win.webContents.on('did-finish-load', push);
    // right-click on the draggable area arrives as a "system" context menu
    win.on('system-context-menu', (e) => { e.preventDefault(); showMenu(); });
    ipcMain.on('menu', showMenu);

    createTray();
    watchPlayers({ intervalMs: config.pollMs, ignore: config.ignorePlayers, ignoreTitles: config.ignoreTitles }, onTrack);
    setInterval(trackPosition, 4000);
  });

  app.on('before-quit', () => { if (state) flush(); });
  app.on('window-all-closed', () => app.quit());
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => app.quit());
}
