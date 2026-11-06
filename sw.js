// Solar Commons: the offline helper (in web terms, a "service worker").
//
// Browsers run this small script in the background. It keeps a copy of all the game's files
// in the browser, so the game also works without internet:
// - With internet, the game loads from the website as usual (always the newest version),
//   and the copy is refreshed.
// - Without internet, or if the website doesn't answer within 3 seconds, the copy is used.
// On the first visit, the copy of all files is made straight away, so one visit with
// internet is enough to play offline later.
//
// This file must stay at the top of the project: a helper only looks after the files in its
// own folder and below. It only runs on a website (https, or localhost for testing), not when
// index.html is opened by double-click.
// The automatic checks (node tests/check.js) make sure the list below names every file the
// game uses. Saved games are not stored here (they are kept separately, see js/save.js).

'use strict';

const CACHE = 'solar-commons';   // name of the copy in the browser
const WAIT = 3000;               // milliseconds to wait for the website before using the copy

// The game's files (the font files are read from fonts/fonts.css)
const FILES = [
  './', 'index.html', 'manifest.webmanifest',
  'css/style.css', 'css/game.css', 'fonts/fonts.css',
  'js/i18n.js', 'lang/ja.js', 'lang/en.js', 'js/engine.js', 'js/ui.js', 'js/save.js',
  'js/game-screen.js', 'js/map-editor.js', 'js/design-panel.js', 'js/end-screen.js',
  'js/notebook.js', 'js/offline.js', 'js/main.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png'
];

const BASE = new URL('./', self.location).href;
const GAME = new Set(FILES.map(f => new URL(f, BASE).href));
const FONT_CSS = new URL('fonts/fonts.css', BASE).href;
const fontsIn = css => [...css.matchAll(/url\("([^"]+)"\)/g)].map(m => new URL(m[1], FONT_CSS).href);
const fresh = url => new Request(url, { cache: 'no-cache' });   // ask the website, not the browser's short-term memory

// The address a file is kept under (without ?v=...), or null for files that are not part of the game
// (for example the simulator, which is left to the browser).
function keyFor(request) {
  if (request.method !== 'GET') return null;
  const url = new URL(request.url);
  url.search = '';
  url.hash = '';
  const href = url.href;
  return GAME.has(href) || (href.startsWith(BASE + 'fonts/') && href.endsWith('.woff2')) ? href : null;
}

// ----- First visit, or a new version of this file: copy all files -----
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const css = await fetch(fresh(FONT_CSS));
    if (!css.ok) throw new Error('fonts/fonts.css is missing');
    const fonts = fontsIn(await css.text());
    await cache.addAll([...GAME, ...fonts].map(fresh));   // all or nothing
    await self.skipWaiting();
  })());
});

// ----- Taking over: remove copies of files the game no longer uses -----
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) if (name !== CACHE) await caches.delete(name);
    const cache = await caches.open(CACHE);
    const css = await cache.match(FONT_CSS);
    const keep = new Set([...GAME, ...(css ? fontsIn(await css.text()) : [])]);
    for (const request of await cache.keys()) if (!keep.has(request.url)) await cache.delete(request);
    await self.clients.claim();
  })());
});

// ----- Every time the game loads a file -----
self.addEventListener('fetch', event => {
  const key = keyFor(event.request);
  if (!key) return;
  const network = fetch(event.request);
  event.waitUntil(network.then(response => store(key, response)).catch(() => {}));
  event.respondWith(answer(key, network));
});

// The website's answer if it comes in time, otherwise the copy
async function answer(key, network) {
  const copy = await caches.match(key, { cacheName: CACHE });
  if (!copy) return network;   // no copy yet: wait for the website
  const late = new Promise(resolve => setTimeout(resolve, WAIT, copy));
  try {
    const response = await Promise.race([network, late]);
    return response.ok ? response : copy;
  } catch (e) {
    return copy;   // no internet
  }
}

// Keeps a copy of a good answer from the website. When the font list changed, all font files
// are copied again, so that every character still has its font offline.
async function store(key, response) {
  if (!response.ok || response.redirected || response.type !== 'basic') return;
  const copy = response.clone();   // must happen before the page reads the answer
  const cache = await caches.open(CACHE);
  if (key !== FONT_CSS) return cache.put(key, copy);
  const text = await copy.clone().text();
  const before = await cache.match(key);
  const changed = !before || (await before.text()) !== text;
  await cache.put(key, copy);
  if (changed) await cache.addAll(fontsIn(text).map(fresh));
}
