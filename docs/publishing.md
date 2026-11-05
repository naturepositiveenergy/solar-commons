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

## Testing on your own computer first

- **Quick check:** double-click `index.html`. The game opens in your browser without any server.
- **Like the real website:** start a small local web server in the project folder, then open http://localhost:8123

  ```bash
  python -m http.server 8123
  ```

  Stop it with **Ctrl + C**.

## Why there is a `.nojekyll` file

By default, GitHub Pages runs every site through a tool called Jekyll, which is meant for blogs and skips some files. The empty `.nojekyll` file at the top of the project switches this off, so all files are published exactly as they are. Don't delete it.

## Good to know

- **Fonts:** the game loads its fonts (Atkinson Hyperlegible and BIZ UDPGothic) from Google Fonts. This means visitors' browsers contact Google's servers. If that matters for your workshops, the fonts can be stored inside the project instead. This will be needed anyway for offline use, when the game becomes an installable app (PWA) in a later milestone.
- **Installable app (PWA):** once the game can be installed, browsers keep their own copy of the game. Publishing updates will need one extra step then, which will be explained in that milestone.

## Troubleshooting

| Problem | What to check |
|---|---|
| "404 There isn't a GitHub Pages site here" | Wait two minutes after the first setup. Check that Pages uses branch **main** and folder **/ (root)**. Check the address: it must end in `/solar-commons/`. |
| The page is blank or texts are missing | Press **F12** to open the browser's developer tools, click **Console**, and copy any red error message into Claude. |
| Changes don't appear | Check that you pushed (`git push`). Check the **Actions** tab for a green tick. Then force a fresh load (see "Updating the site"). |
