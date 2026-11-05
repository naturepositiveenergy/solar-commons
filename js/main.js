// Solar Commons: start screen and switching between screens.
// Texts come from the language files (through js/i18n.js), the rules from js/engine.js.

(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  let game = null;   // the current game, made by the engine (null on the start screen)

  // ----- Decorative mini park on the start screen -----
  // One letter per tile: d dense panel, w wide-spaced panel, m meadow, h hedge, p pond, c corridor
  const MOTIF = [
    'hhhhhhhhhh',
    'hwwwwwwwwh',
    'cmmmppmmmc',
    'hwwwwwwwwh',
    'hhhhhhhhhh'
  ];
  const TILE = { d: 'dense', w: 'wide', m: 'meadow', h: 'hedge', p: 'pond', c: 'corridor' };

  function drawMotif() {
    const tiles = MOTIF.join('').split('').map(letter => {
      const span = document.createElement('span');
      span.className = 'tile tile-' + TILE[letter];
      return span;
    });
    $('motif').replaceChildren(...tiles);
  }

  // ----- Language switch: one button per language file -----
  function drawLanguageSwitch() {
    const buttons = I18n.languages().map(code => {
      const b = document.createElement('button');
      b.type = 'button';
      b.lang = code;
      b.dataset.lang = code;
      b.textContent = SC_LANG[code]['lang.name'];   // each language is named in its own language
      b.addEventListener('click', () => I18n.setLanguage(code));
      return b;
    });
    $('langSwitch').replaceChildren(...buttons);
    markCurrentLanguage();
  }

  function markCurrentLanguage() {
    $('langSwitch').querySelectorAll('button').forEach(b => {
      b.setAttribute('aria-pressed', String(b.dataset.lang === I18n.getLanguage()));
    });
  }

  // ----- Screens -----
  function showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => { s.hidden = s.id !== 'screen-' + name; });
    // Move keyboard and screen reader focus to the new screen's heading
    $('screen-' + name).querySelector('h1').focus();
  }

  function startNewGame() {
    game = SolarEngine.newGame(SolarEngine.defaultParams(), Date.now() % 1e9);
    drawGameStats();
    showScreen('game');
  }

  function backToTitle() {
    game = null;
    showScreen('start');
  }

  // Placeholder: shows a few starting numbers read from the engine.
  function drawGameStats() {
    if (!game) return;
    const stat = (labelCode, value) => {
      const box = document.createElement('div');
      box.className = 'stat';
      const dt = document.createElement('dt');
      dt.textContent = t(labelCode);
      const dd = document.createElement('dd');
      dd.textContent = value;
      box.append(dt, dd);
      return box;
    };
    $('gameStats').replaceChildren(
      stat('stat.turn', t('stat.turnValue', { turn: game.turn, turns: game.P.turns })),
      stat('stat.money', Math.round(game.money)),
      stat('stat.trust', Math.round(game.T))
    );
  }

  // ----- Start -----
  drawMotif();
  I18n.init();                 // picks the language and fills in all marked texts
  drawLanguageSwitch();
  I18n.onChange(() => {        // when the player switches language, redraw texts made in code
    markCurrentLanguage();
    drawGameStats();
  });
  $('newGameBtn').addEventListener('click', startNewGame);
  $('backBtn').addEventListener('click', backToTitle);
})();
