// Solar Commons: start screen, language switch and switching between screens.
// Texts come from the language files (through js/i18n.js), the rules from js/engine.js.

(function (root) {
  'use strict';
  const SC = root.SC = root.SC || {};
  const $ = id => document.getElementById(id);

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
  let current = 'start';
  function showScreen(name) {
    current = name;
    document.querySelectorAll('.screen').forEach(s => { s.hidden = s.id !== 'screen-' + name; });
    $('toTitleBtn').hidden = name !== 'game';
    if (name === 'start') updateStartButtons();
    SC.notebook.updateButton();
    window.scrollTo(0, 0);
    // Move keyboard and screen reader focus to the new screen's heading
    $('screen-' + name).querySelector('h1').focus();
  }

  // A scenario code in the link, for example …/solar-commons/?code=2417 (shared by workshop
  // facilitators). "New game" then starts that scenario.
  const linkCode = (() => {
    try { return SC.session.readCode(new URLSearchParams(root.location.search).get('code')); } catch (e) { return null; }
  })();

  // With a saved game, "Continue game" is the main button and "New game" the second one.
  function updateStartButtons() {
    const saved = SC.session.hasSaved();
    $('continueBtn').hidden = !saved;
    $('savedNote').hidden = !saved;
    $('outdatedNote').hidden = saved || !SC.session.hasOutdated();
    $('newGameBtn').classList.toggle('btn-primary', !saved);
    $('newGameBtn').textContent = linkCode ? t('start.newGameCode', { code: linkCode }) : t('start.newGame');
  }

  // code: a scenario code, or nothing for a random one
  function newGame(code) {
    SC.session.start(code);
    SC.gameScreen.render();
    showScreen('game');
  }

  // A saved game is replaced only after asking. Resolves to true if it's fine to start.
  async function mayReplace(returnTo) {
    if (!SC.session.hasSaved()) return true;
    return SC.ui.confirmDialog({
      title: t('start.replaceTitle'), text: t('start.replaceText'), ok: t('start.replaceOk'), cancel: t('common.cancel')
    }, returnTo);
  }

  async function onNewGameClick() {
    if (await mayReplace($('newGameBtn'))) newGame(linkCode);
  }

  // ----- Pop-up: play with a scenario code -----
  function openCodeDialog() {
    const dialog = $('codeDialog'), input = $('codeInput');
    input.value = '';
    $('codeProblem').textContent = '';
    SC.ui.openDialog(dialog, {
      onClose: async value => {
        if (value !== 'ok') return;
        if (await mayReplace($('codeBtn'))) newGame(SC.session.readCode(input.value));
      },
      returnFocus: () => (dialog.returnValue === 'ok' ? null : $('codeBtn'))
    });
    input.focus();
  }
  // "Start game" with a code that is not 1000 to 9999: say so and keep the pop-up open.
  // (This runs before the pop-up's own closing, because it was added first.)
  function checkCode(e) {
    if (!e.submitter || e.submitter.value !== 'ok' || SC.session.readCode($('codeInput').value)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    $('codeProblem').textContent = t('code.invalid');
    $('codeInput').focus();
  }

  function continueGame() {
    if (!SC.session.resume()) {
      updateStartButtons();
      SC.ui.announce(t('start.resumeFailed'));
      $('newGameBtn').focus();
      return;
    }
    if (SC.session.game.over) showResults();
    else { SC.gameScreen.render(); showScreen('game'); }
  }

  function showResults() {
    SC.help.gameFinished();      // after the first finished game, the hints switch off
    SC.endScreen.render();
    showScreen('end');
  }

  // Back to the title screen. The game stays saved, unless forget is true (finished game).
  function toTitle(forget) {
    SC.session.end(forget);
    showScreen('start');
  }

  SC.app = { showScreen, showResults, newGame, toTitle };

  // ----- Start -----
  drawMotif();
  I18n.init();                 // picks the language and fills in all marked texts
  drawLanguageSwitch();
  SC.gameScreen.init();
  SC.designPanel.init();
  SC.endScreen.init();
  SC.notebook.init();
  SC.notebook.updateButton();
  SC.offline.init();           // offline copy and install button (js/offline.js)
  SC.help.init();              // how to play and the first-game hints (js/help.js)
  updateStartButtons();
  I18n.onChange(() => {        // when the player switches language, redraw texts made in code
    markCurrentLanguage();
    SC.notebook.updateButton();
    updateStartButtons();
    if (current === 'game') SC.gameScreen.render();
    if (current === 'end') SC.endScreen.render();
  });
  $('continueBtn').addEventListener('click', continueGame);
  $('newGameBtn').addEventListener('click', onNewGameClick);
  $('codeBtn').addEventListener('click', openCodeDialog);
  $('codeForm').addEventListener('submit', checkCode);
  // Enter in the code field means "Start game" (otherwise the browser would press the first button, Cancel)
  $('codeInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); $('codeOk').click(); }
  });
  $('toTitleBtn').addEventListener('click', () => toTitle(false));
})(globalThis);
