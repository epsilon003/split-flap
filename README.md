# Split Flap Display

A Chrome extension that replaces your new tab page with a mechanical
split-flap board simulation — the kind you'd see on an old airport
departures board, or on a [Vestaboard](https://www.vestaboard.com/), which
inspired this project. Individually-animated flap tiles, synthesized
mechanical tick sounds, a startup sweep through the full character set,
and a handful of small stat modules you can turn on if you want them.

There is no backend. Nothing here talks to a server the developer
controls — every network request goes straight from your browser to the
specific public API a feature needs, and only when you've turned that
feature on. See [Privacy](#privacy) below.

## Features

- **Physical-feeling tiles.** Each tile is a real two-flap mechanism, not
  a font trick — flaps only spin forward through a fixed character wheel,
  exactly like the hardware, with per-tile randomized timing so the board
  never looks synchronized.
- **A permanent clock and date**, pinned to the top-left corner,
  independent of whatever else is on the board.
- **Time-of-day (and holiday-aware) greetings.** A hardcoded table
  (fixed-date globals, plus India/Tamil-Nadu-relevant ones) is checked
  first; if nothing matches, a live lookup against the public Nager.Date
  API checks for a public holiday in the country you select, before
  falling back to the ordinary "good morning."
- **Local weather**, with a small pixel-art condition icon, auto-located
  via your browser (no manual city search needed).
- **Optional stat modules** (all off by default): GitHub, Chess.com,
  WakaTime, Steam, MonkeyType, and crypto prices (via CoinGecko). Reorder
  them however you like — whatever order they're listed in Settings is
  the order they rotate on the board.
- **A private, on-device "time on sites" tracker.** Off by default and
  requires a separate, explicit opt-in beyond just adding it to the
  rotation, since it's the one feature that needs the `tabs` permission.
  Shows your top 5 sites by time today; resets at midnight; nothing ever
  leaves your device.
- **Search mode.** Press `T` on the board, type a query or a URL, hit
  `Enter` — works like the browser's own address bar.
- **Six frame finishes**: Matte Black, Brushed Metal, Modern White,
  Walnut, Transit Yellow, and a fully custom accent color. Cycle through
  them with the button on the new tab page, or pick one in Settings.
  There's also a floating volume control next to it.
- **A jammed-tile error state.** If a module's fetch fails, a couple of
  tiles visibly jam mid-flip instead of cleanly spelling "UNAVAILABLE" —
  more mechanical, less like a broken webpage.
- **A shadowed custom cursor** on the new tab page (a real cursor image
  via CSS `cursor: url()`, not a JS-tracked element — no lag, no fake
  cursor feel).

## Install

**From source:**
```
npm install
npm run build
```
Then in Chrome: `chrome://extensions` → enable **Developer mode** → **Load
unpacked** → select the `dist/` folder. Open a new tab.

This isn't (yet) published on the Chrome Web Store — see
[`STORE_LISTING.md`](./STORE_LISTING.md) for the submission draft if
you're picking that up.

## Configuring modules

Open Settings (the extension's toolbar icon → "Modules, weather & more,"
or right-click the extension icon → Options). The **Modules** tab lists
everything currently in rotation — click a module's name to expand its
config inline (username, API key, whatever it needs), use the arrows to
reorder, or add more from the chip row below. The **Display** tab covers
the frame finish, sound, clock format, and cursor tilt.

| Module | Needs | Auth |
|---|---|---|
| Greeting | Nothing (name and holiday country are optional) | — |
| Weather | Browser location permission | — |
| Time on sites | Explicit opt-in checkbox | — |
| GitHub | Username | None |
| Chess.com | Username | None |
| MonkeyType | Username | None |
| Crypto prices | Coin list + currency | None |
| WakaTime | Your own API key | Personal key you generate |
| Steam | Your own API key + Steam ID | Personal key you generate |

## Privacy

Full policy: [`PRIVACY_POLICY.md`](./PRIVACY_POLICY.md) (also bundled
in-extension at Settings → Privacy Policy, and as a standalone page in
[`hosting/index.html`](./hosting/index.html) for external hosting). Short
version: nothing is collected by the developer. Weather sends coordinates
to Open-Meteo; the stat modules send only the username/key you provide,
directly to that service; the site tracker never leaves your device and
is off unless you turn it on.

## Architecture

Hand-rolled Vite build — four separate build passes rather than a single
MV3 bundler plugin, since the background service worker needs a fixed
output filename and the New Tab/popup/options/privacy pages are a
standard multi-page app:

```
npm run build
  → tsc -b                                  (typecheck)
  → vite build                              (newtab + popup + options + privacy pages)
  → vite build --config vite.background.config.ts   (background.js)
```

```
src/
├── newtab/        New Tab page (the board itself)
├── popup/         Toolbar popup (quick toggles)
├── options/        Settings page
├── privacy/        Bundled privacy policy page
├── background/      MV3 service worker (site-tracker time accounting)
├── components/     Board, Row, SplitFlapTile, Frame, ThemeToggle, VolumeControl
├── engine/          Animation, sound, character wheel, layout, sweep/error state
├── modules/          One file per board module (weather, github, chess, ...)
├── hooks/            Settings read/write/sync, board grid state
└── styles/           Tile and board CSS
```

The tile animation is the core of the whole project: `CharacterWheel.ts`
defines the fixed, forward-only wheel every flap cycles through (with a
small cache since the same (from, to) pairs get requested constantly),
`Animator.ts` drives the actual Web Animations API sequences per tile
(capped in both duration *and* step count so a worst-case wheel traversal
can't run away), and `SoundEngine.ts` synthesizes every tick procedurally
via Web Audio — no sample files, no licensing questions, and a small
pre-generated buffer pool plus a concurrency cap so a burst of hundreds of
simultaneous ticks (e.g. the startup sweep) doesn't spin up unbounded
audio nodes.

## Development notes

- `BOARD_COLS`/`BOARD_ROWS` in `engine/boardConfig.ts` are the single
  source of truth for grid dimensions — nothing else should hardcode 32
  or 8.
- Rows 0–1 are permanently reserved for the clock/date overlay;
  `useBoard.setLines` and `engine/iconTextLayout.ts`'s `composeIconTextBoard`
  both already account for this, so any new module built on top of either
  helper gets it for free.
- `SplitFlapTile`, `Row`, and `Board` are all memoized, and `Board` keeps
  row-slice array references stable across renders — don't undo this
  without a reason, it's what stops an unrelated settings change from
  re-executing all 256 tile components.
- New stat modules follow a consistent shape: a `use<X>Module({ active,
  ...config, onUpdate })` hook, a cache keyed on the config that changed,
  and a `jammedErrorBoard(...)` call on fetch failure instead of clean
  error text. `githubModule.ts` is the shortest reference implementation.
- Adding a new external API means updating three places at once, not
  just the module code: `public/manifest.json`'s `host_permissions`, and
  the third-party services list in *both* `PRIVACY_POLICY.md` and
  `src/privacy/Privacy.tsx` (and ideally `hosting/index.html` too, if
  you're keeping the externally-hosted copy in sync). Easy to forget one —
  `api.monkeytype.com` was missing from `host_permissions` for a while
  after that module shipped.

## Known limitations

- **Lunar-calendar holidays** (Diwali, Holi) in `modules/holidays.ts` are
  still hardcoded per-year and need manual upkeep. The greeting module now
  also checks the public [Nager.Date API](https://date.nager.at/) as a
  live supplement, which covers many more fixed/algorithmically-computable
  holidays across 150+ countries — but Nager explicitly doesn't cover
  Islamic-calendar holidays, and very likely doesn't cover Hindu ones
  either, so it doesn't close this gap on its own. A proper fix would be a
  real panchang calculation or a holiday source that specifically covers
  lunar Hindu festivals.
- Never tested in a real, running Chrome instance during development —
  every fix in this project's history has been verified via `tsc`/`vite
  build` and reasoned through against the code, not watched. If something
  looks or sounds wrong, it probably needs a real look.
- No automated tests.

## Not implemented (researched, deliberately skipped)

A few features got real research but didn't make the cut, usually because
they need infrastructure this project intentionally avoids:

- **Strava** — needs a `client_secret`-based OAuth exchange with no public/PKCE
  option, which can't live safely in a distributed browser extension.
- **Instagram / Pinterest** — both effectively closed off for reading
  arbitrary public profile data without business-account OAuth and an app
  review process.
- **NASA APOD** — official API needs a personal key (same tier as
  WakaTime/Steam, would be easy to add), but the unofficial no-key CORS
  wrapper some projects use for it turned up unreliable in research, so
  it wasn't worth building against.
- **Custom developer dashboards** — architecturally feasible via MV3's
  `optional_host_permissions` + runtime `chrome.permissions.request()`,
  but deliberately not built.

## Credits

Inspired by [Vestaboard](https://www.vestaboard.com/), an independent
hardware product this extension has no affiliation with.
