# Solar Commons

Browser game about community-involved, biodiversity-friendly solar parks in Japan, in Japanese and English.

**Play online:** https://naturepositiveenergy.github.io/solar-commons/ (once GitHub Pages is switched on, see [docs/publishing.md](docs/publishing.md))

## Open it on your computer

- **Game:** double-click `index.html`.
- **Balancing simulator:** double-click `prototype/simulator.html`.

No installation or server is needed.

## Folders

| Path | What it is |
|---|---|
| `index.html` | The game: the page players open |
| `css/style.css` | Colours, fonts, buttons and pop-ups (light and dark mode, phone and desktop) |
| `css/game.css` | Layout of the game screen, design panel and end screen |
| `js/engine.js` | The game rules and numbers, shared by the game and the simulator |
| `js/i18n.js` | The language switch: picks a language and fills in all texts |
| `js/ui.js` | Small helpers shared by all screens (number formatting, pop-ups, messages) |
| `js/save.js` | The current game: passes every action to the engine and saves the game in the browser |
| `js/game-screen.js` | The game screen: status bar, sites, projects, End turn, turn report, log |
| `js/design-panel.js` | The design panel for planning a park |
| `js/map-editor.js` | The 10 × 10 site map: painting tiles, and the small maps on cards |
| `js/end-screen.js` | The end screen with the final grade |
| `js/main.js` | The start screen and switching between screens |
| `lang/en.js`, `lang/ja.js` | All English and Japanese texts |
| `prototype/simulator.html` | Balancing tool: plays thousands of games with three strategies |
| `tests/check.js` | Automatic checks (see below) |
| `tests/engine-reference.json` | Fingerprints of 600 games, used by the rules check |
| `docs/design.md` | Game design document (the rules) |
| `docs/publishing.md` | How to publish with GitHub Pages |
| `.nojekyll` | Tells GitHub Pages to publish the files as they are |

## Automatic checks

With [Node.js](https://nodejs.org) installed, run this in the project folder:

```bash
node tests/check.js
```

It checks that the rules still play exactly as before, that the screen previews match what
really happens, that saved games continue correctly, and that both language files are complete.
After an approved rule change, renew the reference with `node tests/check.js --update`.
