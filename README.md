# Solar Commons

Browser game about community-involved, biodiversity-friendly solar parks in Japan, in Japanese and English.

**Play online:** https://naturepositiveenergy.github.io/solar-commons/

After one visit with internet, the game also works offline, and it can be installed on phones and computers like an app. See [docs/publishing.md](docs/publishing.md).

**For workshops:** everyone who plays the same scenario code gets the same sites and events, for example with the link https://naturepositiveenergy.github.io/solar-commons/?code=1052. The workshop guide has session plans, recommended codes and discussion questions: [English](docs/workshop-guide.md), [日本語](docs/workshop-guide.ja.md).

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
| `js/notebook.js` | The policy notebook: real policies behind the game, with official sources |
| `js/offline.js` | Starts the offline helper and shows the install button on the start screen |
| `js/help.js` | "How to play" and the hints in a player's first game |
| `js/end-screen.js` | The end screen with the final grade |
| `js/main.js` | The start screen and switching between screens |
| `lang/en.js`, `lang/ja.js` | All English and Japanese texts |
| `sw.js` | The offline helper: keeps a copy of the game in the browser, so it works without internet |
| `manifest.webmanifest` | App description for installing the game: name, icon, colours |
| `fonts/` | The game's fonts, with only the characters it uses, and their licences |
| `icons/` | The app icon in all sizes |
| `tools/make-fonts.js` | Makes the font files (run after adding text with new kanji) |
| `tools/make-icons.js` | Draws the app icon |
| `prototype/simulator.html` | Balancing tool: plays thousands of games with three strategies |
| `tests/check.js` | Automatic checks (see below) |
| `tests/engine-reference.json` | Fingerprints of 600 games, used by the rules check |
| `docs/design.md` | Game design document (the rules) |
| `docs/publishing.md` | How to publish with GitHub Pages |
| `docs/policy-notebook.md` | Texts and sources of the policy notebook, with review notes |
| `docs/workshop-guide.md`, `docs/workshop-guide.ja.md` | Guide for workshop facilitators, in English and Japanese |
| `.nojekyll` | Tells GitHub Pages to publish the files as they are |

## Automatic checks

With [Node.js](https://nodejs.org) installed, run this in the project folder:

```bash
node tests/check.js
```

It checks that the rules still play exactly as before, that the screen previews match what
really happens, that saved games continue correctly, that both language files are complete,
that the fonts have every character the texts use, that the offline copy includes every file,
that the same scenario code gives everyone the same sites and events (including the codes in the
workshop guide), and that all colours are easy enough to read.
After an approved rule change, renew the reference with `node tests/check.js --update`.
