// Solar Commons: playing offline and installing the game (as an app on a phone or computer).
//
// - Starts the offline helper (sw.js), which keeps a copy of the game in the browser.
//   When the copy is complete, the start screen says "Ready to play offline".
// - Shows an "Install the game" button on the start screen in browsers that offer one
//   (Chrome, Edge, Android). On iPhone and iPad, Safari has no such button, so a short hint
//   explains the Share menu instead. Both are hidden when the game already runs as an app.
// Texts: start.install, start.installHint, start.offlineReady, start.installed.

(function (root) {
  'use strict';
  const SC = root.SC = root.SC || {};
  const $ = id => document.getElementById(id);

  let installQuestion = null;   // the browser's own install question, kept until the button is pressed

  const runsAsApp = () => root.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  // Only Safari on iPhone and iPad knows navigator.standalone
  const isApple = () => 'standalone' in navigator;

  // The browser says the game can be installed: show our own button instead of its pop-up
  root.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    installQuestion = e;
    update();
  });
  root.addEventListener('appinstalled', () => {
    installQuestion = null;
    update();
    SC.ui.announce(t('start.installed'));
  });

  function update() {
    const app = runsAsApp();
    $('installBtn').hidden = app || !installQuestion;
    $('installHint').hidden = app || !isApple();
  }

  async function install() {
    if (!installQuestion) return;
    const question = installQuestion;
    installQuestion = null;   // the browser allows each question to be asked only once
    question.prompt();
    await question.userChoice;
    update();
  }

  function startHelper() {
    // Browsers allow the helper only on websites (https, or localhost for testing),
    // not for index.html opened by double-click.
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(root.location.protocol)) return;
    navigator.serviceWorker.register('sw.js').catch(() => { /* for example plain http: no offline copy */ });
    // "ready" means the helper has finished copying all files
    navigator.serviceWorker.ready.then(() => { $('offlineNote').hidden = false; });
  }

  function init() {
    $('installBtn').addEventListener('click', install);
    update();
    startHelper();
  }

  SC.offline = { init };
})(globalThis);
