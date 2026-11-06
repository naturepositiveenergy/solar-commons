# Publishing Solar Commons with GitHub Pages

GitHub Pages is a free GitHub service that turns the files in this repository into a website. You don't need a build step: the files are published as they are.

After setup, the addresses will be:

| Page | Address |
|---|---|
| Game | https://naturepositiveenergy.github.io/solar-commons/ |
| Balancing simulator | https://naturepositiveenergy.github.io/solar-commons/prototype/simulator.html |

## Before you start: the repository must be public

On a free GitHub account, Pages only works for **public** repositories. Everything in the repository then becomes visible to anyone with the link, including the design document and the simulator.

To check or change this:

1. Open https://github.com/naturepositiveenergy/solar-commons
2. Next to the repository name you'll see **Public** or **Private**.
3. To change it, go to **Settings**, then **General**. Scroll down to **Danger Zone** and choose **Change visibility**, then **Make public**.

## Step 1: Upload your latest changes

GitHub Pages publishes what is on GitHub, not what is on your computer. Commit and push your changes first. In a terminal, in the project folder:

```bash
git add .
```

```bash
git commit -m "Describe what changed"
```

```bash
git push
```

(GitHub Desktop or VS Code's Source Control panel do the same with buttons.)

## Step 2: Switch on GitHub Pages (only once)

1. Open the repository on GitHub and click **Settings** (top right of the repository menu).
2. In the left menu, under **Code and automation**, click **Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Under **Branch**, choose **main** and the folder **/ (root)**, then click **Save**.

## Step 3: Wait, then open the site

Publishing takes one to two minutes. You can watch the progress in the repository's **Actions** tab, where a run called "pages build and deployment" appears. When it shows a green tick, reload the **Settings → Pages** page. It now says "Your site is live at …" and has a **Visit site** button.

## Updating the site

Every time you push to the **main** branch, GitHub publishes the new version automatically after about a minute.

If you still see the old version, your browser is showing a saved copy. Force a fresh load with **Ctrl + F5** (Windows) or **Cmd + Shift + R** (Mac). GitHub tells browsers to keep files for up to 10 minutes.

**Players with an offline copy or an installed game** don't need to do anything. The game always asks the website first, so they get the new version the next time they open it with internet. Without internet, they keep playing the last version they saw.

**Version number in the file links:** `index.html` and `prototype/simulator.html` load their files with a version number, for example `js/engine.js?v=m4`. After changing any of these files, change the version (for example `?v=m4` to `?v=m5`) everywhere. Browsers then load all the new files together instead of mixing new files with old saved copies. Claude does this as part of each update, and the automatic checks report version numbers that don't match.

**New files:** a new file that the game loads must also be added to the list at the top of `sw.js` (the offline helper), or it would be missing offline. The automatic checks report forgotten files.

**New text with new kanji:** the game has its own small font files with only the characters it uses. If the automatic checks report characters that are not in the fonts yet, run `node tools/make-fonts.js` (needs internet), then raise the version number.

## Testing on your own computer first

- **Quick check:** double-click `index.html`. The game opens in your browser without any server.
- **Like the real website:** start a small local web server in the project folder, then open http://localhost:8123

  ```bash
  python -m http.server 8123
  ```

  Stop it with **Ctrl + C**.

## Why there is a `.nojekyll` file

By default, GitHub Pages runs every site through a tool called Jekyll, which is meant for blogs and skips some files. The empty `.nojekyll` file at the top of the project switches this off, so all files are published exactly as they are. Don't delete it.

## Playing offline and installing the game

**Offline:** after the game has been opened once with internet, it also works without internet on that device. A small helper in the browser (`sw.js`) keeps a copy of all the game's files. The start screen then says **"Ready to play offline on this device."** This works on the website (and on http://localhost for testing), not when `index.html` is opened by double-click.

**Installing** puts the game on the home screen or in the app list, where it opens in its own window like an app:

| Device | How to install |
|---|---|
| Android (Chrome) | Tap **Install the game** on the start screen, or Chrome's menu **⋮** → **Add to Home screen** / **Install app** |
| Computer (Chrome, Edge) | Click **Install the game** on the start screen, or the install icon at the right end of the address bar |
| iPhone, iPad (Safari) | Tap **Share** (the square with the arrow), then **Add to Home Screen**. The start screen shows this hint. |
| Firefox | Plays offline, but can't install the game on most devices |

To remove the game, remove it like any other app (for example press and hold the icon).

**Tips for workshops** (session plans, scenario codes and discussion questions are in the [workshop guide](workshop-guide.md)):

- Ask participants to open the game once while the Wi-Fi works, for example at the start, and to check for the "Ready to play offline" note.
- On iPhone and iPad, installing is worth it: Safari deletes a website's stored data, including the offline copy and the saved game, when the site hasn't been opened for about a week. Installed games are not affected.
- On iPhone and iPad, the installed game and Safari keep separate saved games. A game started in Safari doesn't appear in the installed game, and the other way round. On Android and computers, they share one saved game.
- Private or incognito windows usually don't keep an offline copy or a saved game after they are closed.

## Good to know

- **Fonts:** the fonts (Atkinson Hyperlegible and BIZ UDPGothic, both under the free SIL Open Font License) are stored in the `fonts/` folder, so visitors' browsers don't contact Google. `tools/make-fonts.js` made them with only the characters the game uses; see "Updating the site".
- **App icon:** the icon files in `icons/` are drawn by `tools/make-icons.js`. To change the icon, change the shapes or colours in that file and run `node tools/make-icons.js`.

## Troubleshooting

| Problem | What to check |
|---|---|
| "404 There isn't a GitHub Pages site here" | Wait two minutes after the first setup. Check that Pages uses branch **main** and folder **/ (root)**. Check the address: it must end in `/solar-commons/`. |
| The page is blank or texts are missing | Press **F12** to open the browser's developer tools, click **Console**, and copy any red error message into Claude. |
| Changes don't appear | Check that you pushed (`git push`). Check the **Actions** tab for a green tick. Then force a fresh load (see "Updating the site"). An installed game updates the next time it is opened with internet. |
| "Ready to play offline" doesn't appear | Open the game from the website, not by double-click. With internet, wait a few seconds and reload. Private windows may not allow an offline copy. |
| No "Install the game" button | The button only appears in browsers that offer it (Chrome, Edge, Android), and not when the game is already installed. On iPhone and iPad, use Share → Add to Home Screen. |
