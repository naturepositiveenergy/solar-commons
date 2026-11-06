// Solar Commons: "How to play" and the hints for a player's first game.
//
// - "How to play" (遊び方): a pop-up with six short sections, opened by every element with a
//   data-help attribute (the button in the top bar).
// - Hints: one "Next step" line at the top of the game screen, the first rule below that fits.
//   They are on during the player's first game and switch off when that game ends. The player
//   can hide them, or switch them on and off with the checkbox in "How to play".
// Texts: help.* and hint.* in the language files.

(function (root) {
  'use strict';
  const SC = root.SC = root.SC || {};
  const { esc, openDialog, announce } = SC.ui;
  const $ = id => document.getElementById(id);

  const SECTIONS = ['goal', 'turn', 'plan', 'talk', 'permit', 'score'];
  const TILES = ['dense', 'wide', 'meadow', 'hedge', 'pond', 'corridor'];

  // ----- Hints on or off (remembered in this browser) -----
  // No setting yet = the player's first game: hints are on until it ends.
  const KEY = 'sc-hints';
  function setting() {
    try { return root.localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function setHints(on) {
    try { root.localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* storage blocked */ }
  }
  const hintsOn = () => setting() !== 'off';
  // Called when a game has ended: after the first game, hints switch off (unless chosen on)
  function gameFinished() {
    if (setting() === null) setHints(false);
  }

  // ----- Which hint fits now -----
  const ACTIVE = ['design', 'permitting', 'approved', 'building', 'operating'];
  function hintFor(g) {
    const active = g.projects.filter(p => ACTIVE.includes(p.status));
    const design = active.find(p => p.status === 'design');
    const waiting = active.find(p => p.status === 'permitting' && !p.engaged);
    const running = active.some(p => p.status === 'operating');
    const endTurn = t('hint.endTurn', { turn: g.turn });
    if (!active.length && g.sites.length) return t('hint.chooseSite');
    if (design && !design.genuineBefore) return g.ap >= 1 ? t('hint.talk', { id: design.id }) : endTurn;
    if (design) return t('hint.submit', { id: design.id });
    if (waiting && g.ap >= 1) return t('hint.permit', { id: waiting.id });
    if (running && SolarEngine.scoreGame(g).capBuilt < g.P.capTarget) return t('hint.operating', { goal: g.P.capTarget });
    return endTurn;
  }

  // The hint box for the game screen ('' when hints are off or the game is over)
  function hintHtml(g) {
    if (!g || g.over || !hintsOn()) return '';
    return `
      <aside class="hint-box" aria-labelledby="hintTitle">
        <p><strong id="hintTitle">${esc(t('hint.title'))}</strong> ${esc(hintFor(g))}</p>
        <button type="button" class="btn-link" data-hint-hide="" data-key="hint-hide">${esc(t('hint.hide'))}</button>
      </aside>`;
  }

  function hideHints() {
    setHints(false);
    SC.gameScreen.render();
    announce(t('hint.hidden'));
    $('helpBtn').focus();
  }

  // ----- The "How to play" pop-up -----
  function tilesHtml() {
    return `<ul class="help-tiles">${TILES.map(k =>
      `<li><span class="tile tile-${k}" aria-hidden="true"></span>${esc(t('tile.' + k))}</li>`).join('')}</ul>`;
  }

  function open(returnTo) {
    $('helpTitle').textContent = t('help.title');
    $('helpBody').innerHTML = SECTIONS.map((id, i) => `
      <section class="help-part">
        <h3>${i + 1}. ${esc(t(`help.${id}.title`))}</h3>
        <p>${esc(t(`help.${id}.text`))}</p>
        ${id === 'plan' ? tilesHtml() : ''}
      </section>`).join('');
    $('helpHints').checked = hintsOn();
    openDialog($('helpDialog'), { returnFocus: () => (returnTo && document.contains(returnTo) ? returnTo : null) });
    $('helpBody').scrollTop = 0;
    $('helpTitle').focus();
  }

  function init() {
    document.addEventListener('click', e => {
      if (e.target.closest('[data-help]')) open(e.target.closest('[data-help]'));
      else if (e.target.closest('[data-hint-hide]')) hideHints();
    });
    $('helpHints').addEventListener('change', e => {
      setHints(e.target.checked);
      if (SC.session.game) SC.gameScreen.render();
    });
  }

  SC.help = { init, open, hintHtml, gameFinished };
})(globalThis);
