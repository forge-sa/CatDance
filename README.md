# CatDance

A tiny pixel cat (drawn from `cat ref.jpg`) that sits on top of your desktop.
It sleeps when nothing is playing and dances to the genre when music starts:

| Genre       | Move                                                    |
|-------------|---------------------------------------------------------|
| Rock        | shreds a red guitar, headbangs, jumps                   |
| Metal       | band tee, hard headbang, devil horns pumping            |
| Punk        | green mohawk, studded jacket, pogo jumps, fist up       |
| Pop         | Gangnam-style horse ride + lasso, shades                |
| K-pop       | pink hair, idol choreo: points, waves, finger heart     |
| Jazz        | beret, eyes closed, saxophone, notes                    |
| Soul / R&B  | sings into a vintage mic on a stand                     |
| Hip-hop     | cap, shades, gold chain, arms crossed, nods             |
| Lo-fi       | studies at a desk with headphones, lamp and a mug       |
| Classical   | plays the piano (sonatas, nocturnes, solo piano…)       |
| Orchestral  | conducts with a baton in a tux (symphonies, film scores)|

Game soundtracks get a costume instead:

| Soundtrack                     | Costume                                                        |
|--------------------------------|----------------------------------------------------------------|
| The Binding of Isaac           | turns into a crying Isaac and dances (after the "Specialist Dance for Good Items" mod): sway and bounce, flapping arms, step-touch |
| Persona (any game)             | the Persona 3 protagonist: blue hair over one eye, headphones round the neck, school blazer with armband, hands in pockets, blue butterfly |
| Minecraft                      | a square cat on a grass block with note-block particles       |

These are spotted from the title/artist/album ("Binding of Isaac", Ridiculon,
"Persona 3 OST", Shoji Meguro, Lotus Juice, C418, Lena Raine's Minecraft
tracks, well-known track names like "Mass Destruction") or from the soundtrack
album Deezer matches.

## Run

```sh
./catdance          # or: electron .
```

Requires `electron` and `busctl` (systemd) on PATH. On Hyprland it registers
its own window rule at launch (floating, pinned to all workspaces, no
border/shadow/blur), so the Hyprland config doesn't need editing.

## Controls

- **Drag** the cat to move it. It reopens where you left it.
- **Right-click** the cat, or use its **tray icon**, for the menu:
  - the song and the detected genre
  - **This song is…** corrects the genre for this song (remembered)
  - **Always dance…** forces one dance for everything
  - **Show off all moves** cycles through every animation
  - **Size** (2×–6×), **Quit**

## How it knows what's playing

Music on/off comes from **MPRIS**, the D-Bus interface used by Spotify,
Firefox/Chromium tabs (YouTube, SoundCloud, …), mpv, VLC, Strawberry, etc.
Paused or stopped for ~2.5 s means the cat falls asleep.

The genre is worked out in this order (first answer wins, cached per song):

1. the player's own genre tag (`xesam:genre`, set by local music players)
2. obvious title hints: "lofi hip hop radio", "Chopin Nocturne Op. 9", composer names
3. **Deezer** search → album genre (free, no API key)
4. **MusicBrainz** artist tags (free, no API key). Deezer only knows broad
   genres, so when it says Rock / Hip Hop / Pop the artist's tags are used to
   sharpen that into Punk, Metal, Lo-fi, Soul, K-pop…
5. genre words anywhere in the title or album

Everything else folds into the closest dance: indie/blues/folk/country → rock;
dance/electro/latin → pop; funk/gospel/R&B → soul; reggae → hip-hop;
chillhop/downtempo/ambient → lo-fi; soundtracks/opera → orchestral; Korean
titles or "Asian Music" → K-pop (except Gangnam Style, which keeps its own
dance). If nothing matches, it dances `defaultGenre`.

Privacy: steps 3–4 send the artist and title of the playing song to Deezer and
MusicBrainz. Set `"onlineLookup": false` to keep everything local (the title
hints still work, and you can teach it with "This song is…").

## Config (`config.json`)

| key             | default          | meaning                                          |
|-----------------|------------------|--------------------------------------------------|
| `scale`         | `4`              | screen pixels per cat pixel (canvas is 30×24)    |
| `corner`        | `"bottom-right"` | where it first appears (`top-left`, …)           |
| `margin`        | `24`             | distance from that corner                        |
| `defaultGenre`  | `"pop"`          | dance when the genre is unknown                  |
| `onlineLookup`  | `true`           | use Deezer/MusicBrainz                           |
| `pollMs`        | `1000`           | how often players are checked                    |
| `ignorePlayers` | `["playerctld"]` | MPRIS names to ignore                            |
| `ignoreTitles`  | WhatsApp, Discord, … | "tracks" that are really chat apps making noise |

Saved state (position, size, genre cache, your corrections) lives in
`~/.config/CatDance/state.json`.

## Editing the cat

All art and animations are in `renderer/sprites.js` as text grids (one
character per pixel, palette at the top). Arms, tails and the guitar neck are
drawn as outlined strokes between two points, so poses are mostly coordinates.
`npm run preview` renders every animation frame to `preview.png`.
