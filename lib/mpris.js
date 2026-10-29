'use strict';
// Reads MPRIS media players (Spotify, Firefox/Chromium tabs, mpv, VLC, ...)
// over the session bus with `busctl`, so there are no native dependencies.
const { execFile } = require('child_process');

const PREFIX = 'org.mpris.MediaPlayer2.';
const OBJ = '/org/mpris/MediaPlayer2';

function busctl(args) {
  return new Promise((resolve) => {
    execFile('busctl', ['--user', '--json=short', ...args], { timeout: 2500 }, (err, out) =>
      resolve(err ? null : out));
  });
}

async function listPlayers() {
  const out = await busctl(['call', 'org.freedesktop.DBus', '/org/freedesktop/DBus',
    'org.freedesktop.DBus', 'ListNames']);
  if (!out) return [];
  try {
    return JSON.parse(out).data[0].filter((n) => n.startsWith(PREFIX));
  } catch { return []; }
}

const str = (v) => (v == null ? '' : Array.isArray(v) ? v.filter(Boolean).join(', ') : String(v));

async function readPlayer(bus) {
  const out = await busctl(['get-property', bus, OBJ, 'org.mpris.MediaPlayer2.Player',
    'PlaybackStatus', 'Metadata']);
  if (!out) return null;
  const [status, meta] = out.trim().split('\n').map((l) => { try { return JSON.parse(l).data; } catch { return null; } });
  const m = (k) => meta && meta[k] && meta[k].data;
  return {
    bus,
    name: bus.slice(PREFIX.length).split('.')[0],
    status: status || 'Stopped',
    title: str(m('xesam:title')),
    artist: str(m('xesam:artist')) || str(m('xesam:albumArtist')),
    album: str(m('xesam:album')),
    genre: str(m('xesam:genre')),
    url: str(m('xesam:url')),
  };
}

// Calls onChange(player|null) whenever the "current" playing track changes.
// A player that briefly pauses (track change, buffering) is given `grace` ms
// before we report silence, so the cat doesn't flicker to sleep.
function watchPlayers({ intervalMs = 1000, graceMs = 2500, ignore = [], ignoreTitles = [] }, onChange) {
  const skipTitle = new Set(ignoreTitles.map((t) => t.toLowerCase()));
  let current = null;      // bus name we follow
  let lastKey = null;
  let silentSince = 0;
  let stopped = false;

  async function poll() {
    if (stopped) return;
    try {
      const names = (await listPlayers()).filter((n) => !ignore.some((i) => n.includes(i)));
      const players = (await Promise.all(names.map(readPlayer))).filter(Boolean);
      const playing = players.filter((p) => p.status === 'Playing' && !skipTitle.has(p.title.trim().toLowerCase()));
      // stick with the player we were following while it keeps playing
      const pick = playing.find((p) => p.bus === current) || playing[0] || null;
      if (pick) {
        current = pick.bus;
        silentSince = 0;
      } else if (lastKey !== null) {
        silentSince = silentSince || Date.now();
        if (Date.now() - silentSince < graceMs) return;
      }
      const key = pick ? `${pick.bus}\n${pick.artist}\n${pick.title}` : null;
      if (key !== lastKey) {
        lastKey = key;
        if (!pick) current = null;
        onChange(pick);
      }
    } finally {
      if (!stopped) setTimeout(poll, intervalMs);
    }
  }
  poll();
  return () => { stopped = true; };
}

module.exports = { watchPlayers, listPlayers, readPlayer };
