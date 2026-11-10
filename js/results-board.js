// Solar Commons: the results board for facilitators (results.html, added in Milestone 9).
//
// The facilitator pastes the copied results of all groups into one box. The board finds the
// results code at the end of each group's text (js/results-code.js) and shows the groups side by
// side: a table with one row per group, how many groups got each grade, and for each score
// category how many parks got ○, △ and ×.
// Nothing is sent anywhere or saved: the pasted text and the group names typed into the table
// stay on this page until it is closed.

(function (root) {
  'use strict';
  const R = root.SolarResults;
  const E = root.SolarEngine;
  const { esc, fmt } = root.SC.ui;
  const $ = id => document.getElementById(id);

  const GRADES = ['S', 'A', 'B', 'C', 'D'];
  const MARKS = ['○', '△', '×'];                                   // in the order of the results code
  const MARK_TEXT = ['score.mark2', 'score.mark1', 'score.mark0'];  // read out by screen readers
  const MARK_MOOD = ['good', 'warn', 'bad'];
  const COLUMNS = ['board.col.group', 'board.col.code', 'board.col.grade', 'board.col.score', 'board.col.parks',
    'board.col.capacity', 'board.col.money', 'board.col.trust', 'board.col.warnings', 'board.col.ordinance'];
  const names = [];   // group names typed by the facilitator, by row

  // ----- Reading the pasted text -----
  function readResults() {
    const groups = [], seen = new Set();
    let damaged = 0, duplicates = 0;
    for (const found of R.findAll($('boardInput').value)) {
      if (!found.result) damaged++;
      else if (seen.has(found.text)) duplicates++;
      else { seen.add(found.text); groups.push(found.result); }
    }
    return { groups, damaged, duplicates };
  }

  // ----- Drawing -----
  const note = (mood, text) => `<p class="alert is-${mood}">${esc(text)}</p>`;
  const perTown = (list, show) => list.map(show).join(' / ');

  function render() {
    const { groups, damaged, duplicates } = readResults();
    const notes = [];
    if (damaged) notes.push(note('bad', t('board.damaged', { n: damaged })));
    if (duplicates) notes.push(note('info', t('board.duplicates', { n: duplicates })));
    const codes = [...new Set(groups.map(r => r.code))];
    if (codes.length > 1) notes.push(note('warn', t('board.otherCodes', { codes: codes.join(', ') })));
    const versions = [...new Set(groups.map(r => r.rules).filter(v => v !== E.RULES_VERSION))];
    if (versions.length) notes.push(note('warn', t('board.otherVersions', { versions: versions.join(', ') })));

    let body;
    if (!groups.length) body = `<p class="empty">${esc(t('board.none'))}</p>`;
    else {
      const avg = groups.reduce((s, r) => s + r.avg, 0) / groups.length;
      body = `
        <p class="board-summary" id="boardSummary">${esc(t('board.summary', { n: groups.length, avg }))}</p>
        ${tableHtml(groups)}
        <div class="board-overviews">${gradesHtml(groups)}${categoriesHtml(groups)}</div>`;
    }
    $('boardOut').innerHTML = (notes.length ? `<div class="alerts">${notes.join('')}</div>` : '') + body;
  }

  function tableHtml(groups) {
    const head = COLUMNS.map(key => `<th scope="col">${esc(t(key))}</th>`).join('');
    const rows = groups.map((r, i) => {
      const name = names[i] !== undefined ? names[i] : t('board.groupName', { n: i + 1 });
      const lost = r.lost ? ` <span class="board-lost">${esc(t(r.lost === 'trust' ? 'board.lostTrust' : 'board.lostMoney'))}</span>` : '';
      return `
        <tr>
          <th scope="row"><input class="board-name" data-row="${i}" value="${esc(name)}" aria-label="${esc(t('board.groupLabel', { n: i + 1 }))}"></th>
          <td>${r.code}</td>
          <td><span class="grade-chip is-${r.grade}">${r.grade}</span>${lost}</td>
          <td>${fmt(r.avg, 1)}</td>
          <td>${r.parks}</td>
          <td>${fmt(r.cap, 1)}</td>
          <td>${fmt(r.money, 1)}</td>
          <td>${perTown(r.trust, v => fmt(v, 0))}</td>
          <td>${perTown(r.warnings, v => v)}</td>
          <td>${perTown(r.ordinance, v => (v ? esc(t('board.yes')) : '–'))}</td>
        </tr>`;
    }).join('');
    return `<div class="board-scroll"><table class="board-table" aria-describedby="boardSummary"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  // How many groups got each grade
  function gradesHtml(groups) {
    const items = GRADES.map(grade => {
      const n = groups.filter(r => r.grade === grade).length;
      return `
        <li>
          <span class="grade-chip is-${grade}">${grade}</span>
          <span class="board-grade-name">${esc(t('grade.' + grade))}</span>
          <span class="board-bar" aria-hidden="true"><span style="width:${(100 * n / groups.length).toFixed(1)}%"></span></span>
          <strong>${n}</strong>
        </li>`;
    }).join('');
    return `<section class="board-box" aria-labelledby="boardGrades"><h2 id="boardGrades">${esc(t('board.gradesTitle'))}</h2><ul class="board-grades">${items}</ul></section>`;
  }

  // For each score category: how many parks of all groups got ○, △ and ×
  function categoriesHtml(groups) {
    const rows = R.CATEGORIES.map(cat => {
      const counts = [0, 1, 2].map(j => groups.reduce((s, r) => s + r.categories[cat][j], 0));
      const total = counts.reduce((a, b) => a + b, 0) || 1;
      const bar = counts.map((n, j) => (n ? `<span class="is-${MARK_MOOD[j]}" style="width:${(100 * n / total).toFixed(1)}%"></span>` : '')).join('');
      const text = counts.map((n, j) =>
        `<span class="board-count"><span aria-hidden="true">${MARKS[j]}</span><span class="visually-hidden">${esc(t(MARK_TEXT[j]))}:</span> ${n}</span>`).join('');
      return `
        <li>
          <span class="board-cat-name">${esc(t(`score.cat.${cat}`))}</span>
          <span class="board-stack" aria-hidden="true">${bar}</span>
          <span class="board-counts">${text}</span>
        </li>`;
    }).join('');
    return `
      <section class="board-box" aria-labelledby="boardCats">
        <h2 id="boardCats">${esc(t('board.categoriesTitle'))}</h2>
        <p class="section-hint">${esc(t('board.categoriesHint'))}</p>
        <ul class="board-cats">${rows}</ul>
      </section>`;
  }

  // ----- Language switch: one button per language file (as on the game page) -----
  function drawLanguageSwitch() {
    const buttons = I18n.languages().map(code => {
      const b = document.createElement('button');
      b.type = 'button';
      b.lang = code;
      b.dataset.lang = code;
      b.textContent = SC_LANG[code]['lang.name'];
      b.addEventListener('click', () => I18n.setLanguage(code));
      return b;
    });
    $('langSwitch').replaceChildren(...buttons);
  }
  function markCurrentLanguage() {
    $('langSwitch').querySelectorAll('button').forEach(b => {
      b.setAttribute('aria-pressed', String(b.dataset.lang === I18n.getLanguage()));
    });
  }
  // Texts that are not filled in automatically
  function applyTexts() {
    $('boardInput').placeholder = t('board.placeholder');
    markCurrentLanguage();
    render();
  }

  function init() {
    drawLanguageSwitch();
    I18n.init();
    I18n.onChange(applyTexts);
    applyTexts();
    $('boardInput').addEventListener('input', render);
    $('boardClear').addEventListener('click', () => {
      $('boardInput').value = '';
      names.length = 0;
      render();
      $('boardInput').focus();
    });
    // group names: kept while the page is open, so they survive pasting more results
    $('boardOut').addEventListener('input', e => {
      if (e.target.matches('.board-name')) names[Number(e.target.dataset.row)] = e.target.value;
    });
  }

  init();
})(globalThis);
