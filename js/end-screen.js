// Solar Commons: the end screen with the final grade (design document section 10).
//
// Each built park (operating or sold) is rated in seven categories with ○ (2), △ (1) or × (0).
// For every category that is not ○, the screen says what would have earned a ○.

(function (root) {
  'use strict';
  const SC = root.SC = root.SC || {};
  const E = root.SolarEngine;
  const { esc, fmt } = SC.ui;
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
      <div class="grade-box is-${s.grade}">
        <span class="grade-letter">${s.grade}</span>
        <div>
          <p class="grade-label">${esc(t(GRADE_TEXT[s.grade]))}</p>
          <p>${esc(t('end.average', { avg: s.avg, max: MAX_POINTS }))}</p>
        </div>
      </div>
      ${s.note ? `<p class="alert is-bad">${esc(t(s.note))}${lostReason ? ' ' + esc(t(lostReason.msg)) : ''}</p>` : ''}
      <dl class="status-stats end-stats">
        ${stat(t('end.capacity'), `${fmt(s.capBuilt, 1)}<span class="stat-goal">${esc(t('stat.capacityGoal', { goal: P.capTarget }))}</span>`)}
        ${stat(t('stat.money'), fmt(g.money, 1))}
        ${stat(t('stat.trust'), fmt(g.T, 0))}
        ${stat(t('end.reputation'), fmt(g.R, 0))}
      </dl>
      <section class="game-section" aria-labelledby="parksTitle">
        <h2 id="parksTitle">${esc(t('end.parks'))}</h2>
        ${parks ? `<div class="project-grid">${parks}</div>` : `<p class="empty">${esc(t('end.noParks'))}</p>`}
      </section>
      <p class="section-hint end-scale">${esc(t('end.scale', { S: P.gradeS, A: P.gradeA, B: P.gradeB, C: P.gradeC }))}</p>
      <div class="end-buttons">
        <button type="button" class="btn btn-primary" data-end="again">${esc(t('end.again'))}</button>
        <button type="button" class="btn" data-end="title">${esc(t('end.toTitle'))}</button>
      </div>`;
  }

  function init() {
    $('endView').addEventListener('click', e => {
      const b = e.target.closest('[data-end]');
      if (!b) return;
      if (b.dataset.end === 'again') SC.app.newGame();
      else SC.app.toTitle(true);
    });
  }

  SC.endScreen = { init, render };
})(globalThis);
