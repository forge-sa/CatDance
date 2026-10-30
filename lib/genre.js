'use strict';
// Works out which dance fits the current track.
//
//   1. the player's own xesam:genre tag (local players like mpv, Strawberry, VLC)
//   2. obvious hints in the title ("lofi hip hop radio", "Chopin Nocturne Op. 9")
//   3. Deezer search -> album genres     (free, no API key)
//   4. MusicBrainz artist tags           (free, no API key, 1 req/s); also used
//      to sharpen Deezer's broad answers (Rock -> Punk, Hip Hop -> Lo-fi, ...)
//   5. any genre-ish word in the title/album
//
// Results are cached on disk so each song is only looked up once.

const UA = 'CatDance/1.0 (desktop pixel-cat overlay)';
const CACHE_VERSION = 3; // bump when the rules change so old answers are redone

// Free-form genre names/tags -> dance. Order matters: the first rule that
// matches a tag wins ("lo-fi hip hop" is lo-fi, "rap metal" is metal,
// "pop punk" is punk, "jazz rap" is hip-hop, "indie pop" is pop).
const RULES = [
  ['lofi', /lo.?fi|chillhop|jazzhop|chillwave|downtempo|trip.?hop|instrumental hip.?hop|ambient|vaporwave|study/i],
  ['kpop', /k-?pop|korean|asian music|j-?pop|c-?pop|boy group|girl group|\bidol/i],
  ['metal', /metal|djent|thrash|deathcore|grindcore|\bdoom\b|sludge|nwobhm/i],
  ['punk', /punk|hardcore|\bemo\b(?! rap)|screamo|\boi\b|riot grrrl/i],
  ['orchestral', /orchestr|symphon|concerto|overture|soundtrack|film score|\bscore\b|films\/games|opera|requiem|choral|cinematic|ballet/i],
  ['classical', /classical|baroque|sonata|chamber music|string quartet|piano|nocturne|romantic era|minimalism|impressionis/i],
  ['hiphop', /hip.?hop|\brap\b|\btrap\b|drill|grime|boom.?bap|phonk|reggae|dancehall|crunk|g-funk/i],
  ['soul', /\bsoul\b|r&b|\brnb\b|rhythm and blues|motown|gospel|funk|doo.?wop/i],
  ['jazz', /jazz|swing|bebop|bossa|big band|lounge|\bska\b/i],
  ['pop', /indie pop|dream pop|synth.?pop|electropop|art pop|hyperpop|bedroom pop/i],
  ['rock', /rock|grunge|indie|alternative|shoegaze|gaze\b|blues|folk|country|americana|post-|surf|garage|psychedel/i],
  ['pop', /pop|dance|electro|edm|house|techno|trance|disco|synth|latin|reggaeton|eurobeat|dubstep|drum and bass|\bdnb\b|kids|african|brazilian|indian|world/i],
];

// Narrow styles outvote broad ones, so "lo-fi hip hop, hip hop, boom bap"
// still comes out lo-fi.
const SPECIFIC = new Set(['lofi', 'kpop', 'metal', 'punk', 'orchestral', 'soul']);

const ORCHESTRAL_NAMES = 'vivaldi|mahler|wagner|holst|sibelius|bruckner|elgar|berlioz|mussorgsky|prokofiev|shostakovich|puccini|verdi|hans zimmer|john williams|howard shore|ennio morricone|joe hisaishi|ramin djawadi|g[öo]ransson';
const PIANO_NAMES = 'bach|mozart|beethoven|chopin|tchaikovsky|debussy|brahms|handel|haydn|liszt|schubert|schumann|rachmaninoff|satie|dvo[rř][aá]k|stravinsky|ravel|grieg|paganini|einaudi|yiruma|scarlatti';

// Strong hints that are safe to trust straight from the artist/title/album.
const TITLE_HINTS = [
  ['pop', /gangnam style/i], // K-pop, but it has its own dance
  ['lofi', /lo.?fi|chillhop|jazzhop|beats to (relax|study|chill)|study (beats|music)/i],
  ['hiphop', /hip.?hop|\bphonk\b/i],
  ['jazz', /\bjazz|bossa nova|\bswing\b/i],
  ['orchestral', new RegExp(`symphon|orchestr|philharmon|concerto|overture|requiem|ballet|nutcracker|swan lake|four seasons|\\bopera\\b|\\b(${ORCHESTRAL_NAMES})\\b`, 'i')],
  ['classical', new RegExp(`classical|sonata|nocturne|[ée]tude|prelude|waltz|gymnop|\\bop\\.\\s?\\d|\\bbwv\\s?\\d|\\bk\\.\\s?\\d{2,3}\\b|\\b(${PIANO_NAMES})\\b`, 'i')],
];

// Game soundtracks get a costume instead of a genre dance. Checked against the
// player's artist/title/album and against the album Deezer matches.
const MC_TRACKS = "pigstep|otherside|creator|relic|precipice|wending|infinite amethyst|stand tall|left to bloom|ancestry|echo in the wind|chrysopoeia|rubedo|so below|aerie|firebugs|labyrinthine|comforting memories|floating dream|an ordinary day|one more day|eld unknown|featherfall|deeper|puzzlebox|watcher|bromeliad|crescent dunes|yakusoku|lilypad|below and above|broken clocks|fireflies|o's piano|tears|lava chicken";
const REFERENCES = [
  ['isaac', (t) => /binding of isaac|\bridiculon\b|\bantibirth\b/i.test(t.all)],
  ['persona', (t) =>
    /\bpersona\s?(1|2|3|4|5|q2?|fes|portable|reload|golden|royal|dancing|tactica)\b|persona.{0,20}(ost|soundtrack|original)|\bp[345]r?\s?ost\b|shoji meguro|lotus juice|atlus sound team|yumi kawamura|shihoko hirata|azumi takahashi|atsushi kitajoh|toshiki konishi|ryota kozuka/i.test(t.all) ||
    /^(mass destruction|burn my dread|full moon full life|iwatodai dorm|last surprise|life will change|beneath the mask|rivers in the desert|reach out to the truth|it'?s going down now|color your night|wiping all out|pursuing my true self|time to make history|want to be close|wake up,? get up,? get out there|heartbeat,? heartbreak|memories of the city|when the moon'?s reaching out stars|soul phrase|aria of the soul)\b/i.test(t.title)],
  ['minecraft', (t) =>
    /minecraft|\bc418\b|volume alpha|volume beta/i.test(t.all) ||
    (/lena raine|kumi tanioka|aaron cherof|amos roddy/i.test(t.artist) && new RegExp(`^(${MC_TRACKS})\\b`, 'i').test(t.title))],
];
const REF_KEYS = new Set(REFERENCES.map(([k]) => k));

function reference(artist = '', title = '', album = '') {
  const t = { artist, title, album, all: `${artist} ${title} ${album}` };
  for (const [key, test] of REFERENCES) if (test(t)) return key;
  return null;
}

const HANGUL = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/;

function classifyTag(tag) {
  for (const [g, re] of RULES) if (re.test(tag)) return g;
  return null;
}

// tags: [{ name, weight }] -> best dance or null
function vote(tags) {
  const score = {};
  for (const { name, weight } of tags) {
    const g = classifyTag(name);
    if (g) score[g] = (score[g] || 0) + (weight == null ? 1 : weight) * (SPECIFIC.has(g) ? 2 : 1);
  }
  let best = null;
  for (const g in score) if (!best || score[g] > score[best]) best = g;
  return best;
}

// "Artist - Song (Official Video) - YouTube" -> { artist, title }
function cleanTrack({ artist = '', title = '' }) {
  let t = title
    .replace(/^\(\d+\+?\)\s*/, '') // YouTube's "(3) " notification count
    .replace(/\s*[-–—|]\s*YouTube( Music)?\s*$/i, '')
    .replace(/\s*[([][^)\]]*\b(official|lyrics?|video|audio|visuali[sz]er|hd|hq|4k|remaster(ed)?|mv|m\/v|explicit)\b[^)\]]*[)\]]/gi, '')
    .replace(/\s*[([](feat|ft)\.?\s[^)\]]*[)\]]/gi, '')
    .replace(/\s+(feat|ft)\.?\s.*$/i, '')
    .replace(/\s*[|｜].*$/, '')
    .replace(/[“”"]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  let a = artist.replace(/\s*-\s*Topic$/i, '').replace(/VEVO$/i, '').replace(/\s*Official$/i, '').trim();
  const dash = t.match(/^(.+?)\s+[-–—]\s+(.+)$/);
  if (dash && /remaster|\blive\b|version|\bedit\b|\bmix\b|mono|stereo|acoustic|demo|single/i.test(dash[2])) {
    t = dash[1].trim(); // Spotify style "Song - Remastered 2009"
  } else if (dash && (!a || dash[1].toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(dash[1].toLowerCase()))) {
    a = dash[1].trim(); // YouTube style "Artist - Song"
    t = dash[2].trim();
  }
  return { artist: a, title: t };
}

async function getJSON(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(7000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

async function fromDeezer(artist, title) {
  const base = 'https://api.deezer.com/search?limit=5&q=';
  let r = artist ? await getJSON(base + encodeURIComponent(`artist:"${artist}" track:"${title}"`)) : null;
  if (!r || !r.data || !r.data.length) r = await getJSON(base + encodeURIComponent(`${artist} ${title}`.trim()));
  let hits = (r.data || []);
  if (artist) {
    // prefer hits by the artist we were told about
    const na = norm(artist);
    hits = [...hits].sort((x, y) => (norm(y.artist.name) === na) - (norm(x.artist.name) === na));
  }
  for (const hit of hits.slice(0, 3)) {
    // a game soundtrack album (only trusted if it's the artist we were told about)
    const ref = (!artist || norm(hit.artist.name) === norm(artist)) && reference(hit.artist.name, hit.title, hit.album.title);
    if (ref) return { genre: ref, source: 'Deezer', artist: hit.artist.name, detail: `${hit.artist.name} – ${hit.album.title}` };
    const album = await getJSON(`https://api.deezer.com/album/${hit.album.id}`);
    const names = ((album.genres && album.genres.data) || []).map((g) => g.name);
    const genre = vote(names.map((name, i) => ({ name, weight: names.length - i })));
    if (genre) return { genre, source: 'Deezer', artist: hit.artist.name, detail: `${hit.artist.name} – ${hit.title} [${names.join(', ')}]` };
  }
  return null;
}

let mbLast = 0;
async function mbGet(url, retried) {
  const wait = mbLast + 1100 - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  mbLast = Date.now();
  try {
    return await getJSON(url);
  } catch (e) {
    // 503 = MusicBrainz is rate limiting us; back off once
    if (retried || !/^503/.test(e.message)) throw e;
    mbLast = Date.now() + 2000;
    return mbGet(url, true);
  }
}

const MB = 'https://musicbrainz.org/ws/2/';
const tagList = (tags) => (tags || []).filter((t) => t.count >= 0).map((t) => ({ name: t.name, weight: t.count + 0.5 }));

async function mbArtist(name) {
  const r = await mbGet(`${MB}artist/?fmt=json&limit=1&query=${encodeURIComponent(`artist:"${name}"`)}`);
  const a = r.artists && r.artists[0];
  if (!a || a.score < 90) return null;
  const tags = tagList(a.tags);
  const genre = vote(tags);
  return genre ? { genre, source: 'MusicBrainz', detail: `${a.name} [${tags.slice(0, 4).map((t) => t.name).join(', ')}]` } : null;
}

async function fromMusicBrainz(artist, title) {
  if (artist) return mbArtist(artist);
  const r = await mbGet(`${MB}recording/?fmt=json&limit=1&query=${encodeURIComponent(`recording:"${title}"`)}`);
  const rec = r.recordings && r.recordings[0];
  if (!rec || rec.score < 90) return null;
  const genre = vote(tagList(rec.tags));
  if (genre) return { genre, source: 'MusicBrainz', detail: rec.title };
  const who = rec['artist-credit'] && rec['artist-credit'][0] && rec['artist-credit'][0].name;
  return who ? mbArtist(who) : null;
}

function fromText(text, rules) {
  for (const [g, re] of rules) if (re.test(text)) return g;
  return null;
}

// Resolver with an on-disk cache. `store` is { get(key), set(key, value) }.
function createResolver({ store, online = true, log = () => {} }) {
  const inflight = new Map();

  async function lookup(track) {
    const { artist, title } = cleanTrack(track);
    // raw strings too: cleaning drops "| Persona 3 OST"-style suffixes
    const ref = reference(artist, title, track.album) || reference(track.artist, track.title, track.album);
    if (ref) return { genre: ref, source: 'title', detail: track.title };

    const tagged = track.genre && vote(track.genre.split(/[,;/]/).map((name) => ({ name })));
    if (tagged) return { genre: tagged, source: 'tag', detail: track.genre };

    const hint = fromText(`${artist} ${title} ${track.album}`, TITLE_HINTS);
    if (hint) return { genre: hint, source: 'title', detail: title };

    if (online && title) {
      let r = null;
      try { r = await fromDeezer(artist, title); } catch (e) { log(`Deezer lookup failed: ${e.message}`); }
      // Deezer only knows broad genres; MusicBrainz tags can tell punk from rock.
      // Prefer the player's artist: Deezer's best hit can be a cover band.
      const who = artist || (r && r.artist);
      if (!r || !(SPECIFIC.has(r.genre) || REF_KEYS.has(r.genre))) {
        try {
          const mb = r ? (who ? await mbArtist(who) : null) : await fromMusicBrainz(artist, title);
          if (mb && (!r || SPECIFIC.has(mb.genre))) r = r ? { ...mb, detail: `${mb.detail}; ${r.detail}` } : mb;
        } catch (e) {
          log(`MusicBrainz lookup failed: ${e.message}`);
          if (r) r = { ...r, partial: true }; // don't cache; try again next time
        }
      }
      if (r && r.genre === 'pop' && HANGUL.test(`${artist} ${title} ${r.detail}`)) r = { ...r, genre: 'kpop' };
      if (r) return r;
    }
    const loose = fromText(`${title} ${track.album}`, RULES);
    if (loose) return { genre: loose, source: 'title', detail: title };
    return { genre: null, source: 'unknown', detail: '' };
  }

  return function resolve(track) {
    const key = trackKey(track);
    const hit = store.get(key);
    if (hit && hit.v === CACHE_VERSION) return Promise.resolve(hit);
    if (!inflight.has(key)) {
      inflight.set(key, lookup(track).then((r) => {
        r = { ...r, v: CACHE_VERSION };
        // don't cache failures caused by being offline; retry next time
        if ((r.genre && !r.partial) || !online) store.set(key, r);
        return r;
      }).finally(() => inflight.delete(key)));
    }
    return inflight.get(key);
  };
}

function trackKey(track) {
  const { artist, title } = cleanTrack(track);
  return norm(`${artist} | ${title}`);
}

module.exports = { createResolver, cleanTrack, classifyTag, vote, trackKey };
