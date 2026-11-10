// Solar Commons: the end screen with the final grade (design document section 10).
//
// Each built park (operating, sold or removed) is rated in seven categories with ○ (2), △ (1) or × (0).
// For every category that is not ○, the screen says what would have earned a ○.
// For workshops, the screen shows the scenario code, and "Copy results" copies a short summary
// that players can paste into a chat or a shared document to compare their games. Its last line
// is a results code that the facilitator's results board (results.html) can read.

(function (root) {
  'use strict';
  const SC = root.SC = root.SC || {};
  const E = root.SolarEngine;
  const { esc, fmt, announce } = SC.ui;
  const $ = id => document.getElementById(id);

  // Category: [name, what earns ○]
  const CATEGORIES = {
    site: ['score.cat.site', 'score.how.site'],
    natAct: ['score.cat.natAct', 'score.how.natAct'],
    natRes: ['score.cat.natRes', 'score.how.natRes'],
    safety: ['score.cat.safety', 'score.how.safety'],
    community: ['score.cat.community', 'score.how.community'],
    benefit: ['score.cat.benefit', 'score.how.benefit'],
    longterm: ['score.cat.longterm', 'score.how.longterm']
  };
  const MARKS = ['×', '△', '○'];
  const MARK_TEXT = ['score.mark0', 'score.mark1', 'score.mark2'];   // read out by screen readers
  const GRADE_TEXT = { S: 'grade.S', A: 'grade.A', B: 'grade.B', C: 'grade.C', D: 'grade.D' };
  const MAX_POINTS = Object.keys(CATEGORIES).length * 2;

  function render() {
    const g = SC.session.game;
    if (!g) return;
    const P = g.P, s = E.scoreGame(g);
    const lostReason = g.lost ? g.log.filter(l => l.msg.key === 'log.lostMoney' || l.msg.key === 'log.lostTrust').pop() : null;

    const stat = (label, value) => `<div class="stat-chip"><dt>${esc(label)}</dt><dd>${value}</dd></div>`;
    const parks = s.parks.map(({ p, s: sc }) => `
      <article class="card park-score">
        <div class="card-head">
          <h3>${esc(t('project.name', { id: p.id }))} <span class="project-site">${esc(t('site.' + p.site))}</span></h3>
          <span class="score-total">${esc(t('end.points', { total: sc.total, max: MAX_POINTS }))}</span>
        </div>
        <div class="project-top">
          <p class="facts-line">${esc(t('end.parkFacts', { cap: p.calc.cap, b: p.B, status: t('status.' + p.status) }))}</p>
          ${SC.mapEditor.miniMapHtml(p.design)}
        </div>
        <ul class="score-list">${Object.entries(CATEGORIES).map(([k, [name, how]]) => `
          <li class="is-${sc[k]}">
            <span class="score-mark" aria-hidden="true">${MARKS[sc[k]]}</span>
            <span><span class="visually-hidden">${esc(t(MARK_TEXT[sc[k]]))}: </span>${esc(t(name))}
              ${sc[k] < 2 ? `<small>${esc(t('end.for', { how: t(how) }))}</small>` : ''}</span>
          </li>`).join('')}
        </ul>
      </article>`).join('');

    $('endView').innerHTML = `
      <h1 class="end-title" tabindex="-1">${esc(t('end.title'))}</h1>
      <p class="end-code">${esc(t('game.code', { code: g.seed }))}</p>
      <div class="grade-box is-${s.grade}">
        <span class="grade-letter">${s.grade}</span>
        <div>
          <p class="grade-label">${esc(t(GRADE_TEXT[s.grade]))}</p>
          <p>${esc(t('end.average', { avg: s.avg, max: MAX_POINTS }))}</p>
        </div>
      </div>
      ${s.note ? `<p class="alert is-bad">${esc(t(s.note))}${lostReason ? ' ' + esc(t(lostReason.msg)) : ''}</p>` : ''}
      <dl class="status-stats end-stats${g.towns[E.NEIGHBOUR] ? ' has-neighbour' : ''}">
        ${stat(t('end.capacity'), `${fmt(s.capBuilt, 1)}<span class="stat-goal">${esc(t('stat.capacityGoal', { goal: P.capTarget }))}</span>`)}
        ${stat(t('stat.money'), fmt(g.money, 1))}
        ${stat(t('stat.trust'), fmt(g.towns[E.HOME].T, 0) + (g.towns[E.NEIGHBOUR]
          ? `<span class="stat-goal">${esc(t('stat.trustNeighbour', { trust: g.towns[E.NEIGHBOUR].T }))}</span>` : ''))}
        ${stat(t('end.reputation'), fmt(g.R, 0))}
      </dl>
      <div class="end-share">
        <button type="button" class="btn btn-small" data-end="copy">${esc(t('results.copy'))}</button>
        <textarea class="results-text" id="resultsText" rows="7" readonly hidden aria-label="${esc(t('results.copy'))}"></textarea>
      </div>
      <p class="nb-end">${esc(t('nb.endCount', { n: SC.notebook.discovered(g).length, total: SC.notebook.count }))}
        <button type="button" class="btn-link" data-nb="">${esc(t('nb.open'))}</button></p>
      <section class="game-section" aria-labelledby="parksTitle">
        <h2 id="parksTitle">${esc(t('end.parks'))}</h2>
        ${parks ? `<div class="project-grid">${parks}</div>` : `<p class="empty">${esc(t('end.noParks'))}</p>`}
      </section>
      <p class="section-hint end-scale">${esc(t('end.scale', { S: P.gradeS, A: P.gradeA, B: P.gradeB, C: P.gradeC }))}</p>
      <div class="end-buttons">
        <button type="button" class="btn btn-primary" data-end="again">${esc(t('end.again'))}</button>
        <button type="button" class="btn" data-end="new">${esc(t('start.newGame'))}</button>
        <button type="button" class="btn" data-end="title">${esc(t('end.toTitle'))}</button>
      </div>`;
  }

  // ----- Results as text, for example to paste into a chat -----
  function resultsText(g) {
    const s = E.scoreGame(g);
    const lines = [
      `${t('app.title')} – ${t('game.code', { code: g.seed })}`,
      t('results.grade', { grade: s.grade, label: t(GRADE_TEXT[s.grade]), avg: s.avg, max: MAX_POINTS }),
      t(g.towns[E.NEIGHBOUR] ? 'results.statsTwo' : 'results.stats', { cap: s.capBuilt, goal: g.P.capTarget, money: g.money,
        trust: g.towns[E.HOME].T, trust2: g.towns[E.NEIGHBOUR] ? g.towns[E.NEIGHBOUR].T : 0, rep: g.R })
    ];
    if (s.note) lines.push(t(s.note));
    for (const { p, s: sc } of s.parks) {
      const marks = Object.entries(CATEGORIES).map(([k, [name]]) => `${t(name)} ${MARKS[sc[k]]}`).join(t('results.separator'));
      lines.push(t('results.park', {
        name: t('project.name', { id: p.id }), site: t('site.' + p.site),
        points: t('end.points', { total: sc.total, max: MAX_POINTS }), marks
      }));
    }
    if (!s.parks.length) lines.push(t('end.noParks'));
    // one line the facilitator's results board can read, in any language (js/results-code.js)
    lines.push(t('results.code', { code: root.SolarResults.encode(g) }));
    return lines.join('\n');
  }

  async function copyResults() {
    const g = SC.session.game;
    if (!g) return;
    const text = resultsText(g);
    try {
      await navigator.clipboard.writeText(text);
      announce(t('results.copied'));
    } catch (e) {
      // Copying is not allowed here (for example a file opened by double-click): show the text instead
      const box = $('resultsText');
      box.value = text;
      box.hidden = false;
      box.focus();
      box.select();
      announce(t('results.copyFailed'));
    }
  }

  function init() {
    $('endView').addEventListener('click', e => {
      const b = e.target.closest('[data-end]');
      if (!b) return;
      const g = SC.session.game;
      if (b.dataset.end === 'copy') copyResults();
      else if (b.dataset.end === 'again') SC.app.newGame(g && g.seed);   // the same scenario code
      else if (b.dataset.end === 'new') SC.app.newGame();
      else SC.app.toTitle(true);
    });
  }

  SC.endScreen = { init, render, resultsText };
})(globalThis);
