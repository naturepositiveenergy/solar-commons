// Solar Commons: the main game screen.
//
// Shows the status bar, the sites of this turn, the player's projects, the game log and
// the End turn button. After every action the whole screen is redrawn from the game state,
// so what you see always matches the engine.

(function (root) {
  'use strict';
  const SC = root.SC = root.SC || {};
  const E = root.SolarEngine;
  const { esc, fmt, fmtSigned, renderInto, openDialog, confirmDialog, announce } = SC.ui;
  const $ = id => document.getElementById(id);
  const game = () => SC.session.game;

  // ----- Risks are shown as words, not numbers -----
  // Chance of an objection in one permitting turn (design document section 8)
  const objectionLevel = prob => (prob < 0.06 ? 'risk.low' : prob < 0.12 ? 'risk.medium' : 'risk.high');
  // Site risk factor (section 4)
  const siteRiskLevel = risk => (risk < 0.75 ? 'risk.low' : risk <= 1 ? 'risk.medium' : 'risk.high');
  const riskMood = level => (level === 'risk.high' ? 'bad' : level === 'risk.medium' ? 'warn' : '');

  const ENDED = ['sold', 'cancelled', 'dropped'];
  const ENDED_TEXT = { sold: 'project.sold', cancelled: 'project.cancelled', dropped: 'project.dropped' };
  const SUPPORT_MATTERS = ['design', 'permitting', 'approved', 'building'];

  // How log messages are marked in the turn report and the log
  const GOOD = ['log.approved', 'log.constructionStarted', 'log.operating', 'log.rareFound'];
  const BAD = ['log.objection', 'log.cancelled', 'log.strike', 'log.ordinance', 'log.consentRefused',
    'log.neglected', 'log.lostMoney', 'log.lostTrust', 'log.rival'];
  const EVENT = ['log.typhoon', 'log.heavyRain', 'log.gridDelay', 'log.gridDelayNone', 'log.curtailment',
    'log.policyChange', 'log.media', 'log.rareNone', 'log.supportEnded'];
  const moodOf = key => (GOOD.includes(key) ? 'is-good' : BAD.includes(key) ? 'is-bad' : EVENT.includes(key) ? 'is-event' : '');

  // The engine writes a regional warning just before the event that caused it
  // (for example a warning, then "Typhoon"). For reading, put the event first.
  const CAUSES = [...EVENT, 'log.rival', 'log.rareFound'];
  function readingOrder(msgs) {
    const out = [];
    msgs.forEach(m => {
      let i = out.length;
      if (CAUSES.includes(m.key)) while (i > 0 && out[i - 1].key === 'log.strike') i--;
      out.splice(i, 0, m);
    });
    return out;
  }

  let fallbackFocus = null;   // where keyboard focus goes if the clicked button disappears

  // ===== Drawing =====
  function render() {
    const g = game();
    if (!g) return;
    renderInto($('gameView'),
      statusHtml(g) + SC.help.hintHtml(g) + alertsHtml(g) + sitesHtml(g) + projectsHtml(g) + logHtml(g) + turnBarHtml(g),
      fallbackFocus);
    fallbackFocus = null;
    SC.notebook.updateButton();   // the "new" count may have changed
  }

  // The last turn in which submitted projects still get FIT/FIP, and its fiscal year (section 6)
  const lastSupportTurn = g => ({ last: g.P.supportEndTurn - 1, fy: E.calendar(g, g.P.supportEndTurn - 1).fy });

  // ⓘ button that opens the policy notebook at one entry
  const info = id => SC.notebook.infoButton(id);
  // Notebook entries for site types and log messages
  const SITE_ENTRY = { farmland: 'farmland', agri: 'agri', forest: 'forest' };
  const LOG_ENTRY = { 'log.gridDelay': 'grid', 'log.gridDelayNone': 'grid', 'log.curtailment': 'grid',
    'log.ordinance': 'ordinance', 'log.rareFound': 'natureSite', 'log.supportEnded': 'fitfip' };
  const logLine = m => `<li class="${moodOf(m.key)}">${esc(t(m))}${LOG_ENTRY[m.key] ? ' ' + info(LOG_ENTRY[m.key]) : ''}</li>`;

  function statusHtml(g) {
    const P = g.P;
    const turn = Math.min(g.turn, P.turns);
    const dots = '●'.repeat(g.ap) + '○'.repeat(Math.max(0, P.apPerTurn - g.ap));
    const chip = (label, value, mood) =>
      `<div class="stat-chip${mood ? ' is-' + mood : ''}"><dt>${esc(label)}</dt><dd>${value}</dd></div>`;
    const flags = [
      g.ordinance ? `<span class="flag is-bad">${esc(t('status.ordinance'))}</span>${info('ordinance')}` : '',
      g.strikes ? `<span class="flag is-warn">${esc(t('status.warnings', { count: g.strikes }))}</span>` : '',
      `<span class="flag">${esc(t('stat.reputation', { rep: g.R }))}</span>`,
      `<span class="flag flag-code">${esc(t('game.code', { code: g.seed }))}</span>`
    ].join('');
    return `
      <div class="status-bar">
        <div class="status-time">
          <strong>${esc(t('status.time', E.calendar(g, turn)))}</strong>
          <span>${esc(t('status.turn', { turn, turns: P.turns }))}</span>
        </div>
        <dl class="status-stats">
          ${chip(t('stat.money'), fmt(g.money, 1), g.money < 0 ? 'bad' : '')}
          ${chip(t('stat.ap'), `<span class="ap-dots" aria-hidden="true">${dots}</span> ${g.ap}`, '')}
          ${chip(t('stat.trust'), fmt(g.T, 0), g.T < P.loseTrust + 10 ? 'bad' : '')}
          ${chip(t('stat.capacity'), `${fmt(E.scoreGame(g).capBuilt, 1)}<span class="stat-goal">${esc(t('stat.capacityGoal', { goal: P.capTarget }))}</span>`, '')}
        </dl>
      </div>
      <div class="status-flags">${flags}</div>`;
  }

  function alertsHtml(g) {
    if (g.over) return '';
    const P = g.P, list = [];
    if (g.turn === 1) list.push(['info', t('alert.goal', { goal: P.capTarget, turns: P.turns })]);
    if (g.money < 0) list.push(['bad', t('alert.moneyNegative')]);
    if (g.T < P.loseTrust + 10) list.push(['bad', t('alert.trustLow', { limit: P.loseTrust })]);
    if (g.turn === P.turns) list.push(['info', t('alert.lastTurn')]);
    // the end of FIT/FIP for projects submitted from fiscal year 2027 (section 6)
    const deadline = lastSupportTurn(g);
    if (g.turn < deadline.last) list.push(['info', t('alert.supportDeadline', deadline), 'fitfip']);
    else if (g.turn === deadline.last) list.push(['warn', t('alert.supportLastTurn', deadline), 'fitfip']);
    return list.length ? `<div class="alerts">${list.map(([mood, text, entry]) =>
      `<p class="alert is-${mood}">${esc(text)}${entry ? ' ' + info(entry) : ''}</p>`).join('')}</div>` : '';
  }

  function sitesHtml(g) {
    if (g.over) return '';
    const P = g.P;
    const cards = g.sites.map((s, i) => `
      <article class="card site-card">
        <div class="card-head">
          <h3>${esc(t('site.' + s.type))}</h3>
          ${s.promo ? `<span class="tag is-promo">${esc(t('sites.promo'))}</span>${info('promo')}` : ''}
        </div>
        <p class="card-text">${esc(t('siteInfo.' + s.type))}${SITE_ENTRY[s.type] ? ' ' + info(SITE_ENTRY[s.type]) : ''}</p>
        <ul class="facts">
          <li>${esc(t('sites.permit', { turns: E.sitePermitTurns(g, s.type) }))}</li>
          <li>${esc(t('sites.risk', { level: t(siteRiskLevel(P['risk_' + s.type])) }))}</li>
        </ul>
        ${s.promo ? `<p class="card-note">${esc(t('sites.promoInfo', { fy: E.calendar(g, P.supportEndTurn).fy }))}</p>` : ''}
        <button type="button" class="btn btn-small" data-act="plan" data-site="${i}" data-key="plan-${i}">${esc(t('sites.plan'))}</button>
      </article>`).join('');
    return `
      <section class="game-section" aria-labelledby="sitesTitle">
        <h2 id="sitesTitle">${esc(t('sites.title'))}</h2>
        <p class="section-hint">${esc(t('sites.hint'))}</p>
        ${cards ? `<div class="site-grid">${cards}</div>` : `<p class="empty">${esc(t('sites.none'))}</p>`}
      </section>`;
  }

  function projectsHtml(g) {
    const list = [...g.projects.filter(p => !ENDED.includes(p.status)), ...g.projects.filter(p => ENDED.includes(p.status))];
    return `
      <section class="game-section" aria-labelledby="projectsTitle">
        <h2 id="projectsTitle">${esc(t('projects.title'))}</h2>
        ${list.length ? `<div class="project-grid">${list.map(p => projectHtml(g, p)).join('')}</div>` : `<p class="empty">${esc(t('projects.none'))}</p>`}
      </section>`;
  }

  function projectHtml(g, p) {
    const head = `
      <div class="card-head">
        <h3 tabindex="-1" data-key="title-${p.id}">${esc(t('project.name', { id: p.id }))} <span class="project-site">${esc(t('site.' + p.site))}</span></h3>
        <span class="badge is-${p.status}">${esc(t('status.' + p.status))}</span>
      </div>`;
    const facts = `
      <p class="facts-line">${esc(t('project.facts', { cap: p.calc.cap, cost: p.calc.cost, b: p.calc.bTarget }))}
        ${p.promo ? `<span class="tag is-promo">${esc(t('sites.promo'))}</span>${info('promo')}` : ''}
        ${p.support && !ENDED.includes(p.status) ? `<span class="tag is-${p.support}">${esc(t('support.' + p.support))}</span>${info('fitfip')}` : ''}</p>`;
    // the facts and status on the left, a small map of the park on the right
    const top = inner => `<div class="project-top"><div>${facts}${inner}</div>${SC.mapEditor.miniMapHtml(p.design)}</div>`;
    if (ENDED.includes(p.status)) {
      return `<article class="card project-card is-ended">${head}${top(`<p class="state-line">${esc(t(ENDED_TEXT[p.status]))}</p>`)}</article>`;
    }
    const lines = stateLines(g, p).map(([text, mood, entry]) =>
      `<p class="state-line${mood ? ' is-' + mood : ''}">${esc(text)}${entry ? ' ' + info(entry) : ''}</p>`).join('');
    const support = SUPPORT_MATTERS.includes(p.status);
    const canTalk = !g.over && ['design', 'permitting', 'approved'].includes(p.status);
    return `
      <article class="card project-card">
        ${head}
        ${top((support ? acceptanceHtml(E.acceptance(p, g.P)) : '') + `<div class="state">${lines}</div>`)}
        ${support ? residentsHtml(g, p) : ''}
        ${canTalk ? talkHtml(g, p) : ''}
        ${!g.over ? buttonsHtml(g, p) : ''}
      </article>`;
  }

  // Short lines that explain where a project stands and what to do next.
  function stateLines(g, p) {
    const P = g.P;
    switch (p.status) {
      case 'design': {
        const now = E.submitPreview(g, p);
        const lines = [[t('project.designInfo'), '', 'briefing'], [t('project.submitPreview', { turns: now.turns, cost: now.cost })]];
        if (g.money < now.cost) lines.push([t({ key: 'err.planningCost', vars: { cost: now.cost } }), 'bad']);
        if (E.checkAction(g, p, 'genuine').ok) {
          const first = E.submitPreview(g, p, { genuineFirst: true });
          if (first.turns < now.turns) lines.push([t('project.genuineHint', { turns: first.turns }), 'good']);
        }
        if (p.promo) lines.push(now.promo ? [t('project.promoReady'), 'good'] : [t('project.promoMissing'), 'warn']);
        // how the park would sell its power (section 6)
        const deadline = lastSupportTurn(g);
        if (g.turn <= deadline.last) lines.push([t('project.supportBefore', deadline), g.turn === deadline.last ? 'warn' : '', 'fitfip']);
        else if (now.support === 'market') lines.push([t(p.promo ? 'project.supportMarketPromo' : 'project.supportMarket'), 'warn', 'fitfip']);
        else lines.push([t('project.supportKept'), 'good', 'fitfip']);
        return lines;
      }
      case 'permitting': {
        const level = objectionLevel(E.objectionPreview(p, P));
        const lines = [
          [t('project.permitInfo', { turns: p.permitLeft, objections: p.objections, max: P.maxObjections })],
          [t('project.objectionRisk', { level: t(level) }), riskMood(level)]
        ];
        if (!p.engaged) lines.push([t('project.silence', { drop: P.silenceDrift }), 'warn']);
        return lines;
      }
      case 'approved': {
        const need = E.buildPayment(p, P);
        return [[t('project.waitingFunds', { need }), g.money < need ? 'warn' : '']];
      }
      case 'building': return [[t('project.building', { turns: p.buildLeft })]];
      case 'operating': return [[t('project.operating', { b: p.B, target: p.calc.bTarget, income: E.expectedIncome(g, p) }), '', 'fitfip']];
    }
    return [];
  }

  function acceptanceHtml(A) {
    const mood = A < 30 ? 'bad' : A < 60 ? 'warn' : 'good';
    return `
      <div class="acceptance">
        <span class="acceptance-label">${esc(t('project.acceptance'))}</span>
        <span class="meter is-${mood}" aria-hidden="true"><span style="width:${fmt(A, 1)}%"></span></span>
        <strong class="acceptance-value">${fmt(A, 0)}</strong>
      </div>`;
  }

  function residentsHtml(g, p) {
    const S = E.effS(p, g.P), wish = E.wishesMet(p);
    const rows = E.RESIDENTS.map((r, i) => {
      const v = S[i], w = Math.abs(v) / 2;
      const bar = v >= 0 ? `left:50%;width:${w}%` : `left:${50 - w}%;width:${w}%`;
      return `
        <li class="resident">
          <div class="resident-top">
            <span class="resident-name">${esc(t('resident.' + r))}${wish[i] ? ` <span class="wish-mark" aria-hidden="true">✓</span><span class="visually-hidden">${esc(t('project.wishMet'))}</span>` : ''}</span>
            <span class="support-bar" aria-hidden="true"><span class="${v >= 0 ? 'is-pos' : 'is-neg'}" style="${bar}"></span></span>
            <span class="support-value">${fmtSigned(v, 0)}</span>
          </div>
          <p class="wish${wish[i] ? ' is-met' : ''}">${esc(t('wish.' + r))}</p>
        </li>`;
    }).join('');
    return `<details class="residents" data-key="residents-${p.id}"><summary>${esc(t('project.residents'))}</summary><ul>${rows}</ul></details>`;
  }

  function talkHtml(g, p) {
    const P = g.P;
    const vars = {
      genuine: { gain: P.genuineGain },
      visit: { gain: P.visitGain, who: t('resident.' + E.RESIDENTS[E.visitTarget(p, P)]) },
      tour: { gain: P.tourGain },
      fund: { gain: P.fundGain, share: P.fundShare * 100 },
      benefit: { gain: P.benefitGain, cost: P.benefitCost }
    };
    const buttons = Object.keys(E.ACTIONS).map(a => {
      const check = E.checkAction(g, p, a);
      return `
        <button type="button" class="action-btn" data-act="engage" data-p="${p.id}" data-a="${a}" data-key="engage-${p.id}-${a}"${check.ok ? '' : ' disabled'}>
          <span class="action-name">${esc(t('action.' + a))}</span>
          <span class="action-ap">${esc(t('action.apCost', { ap: E.ACTIONS[a].ap }))}</span>
          <span class="action-info">${esc(t('actionInfo.' + a, vars[a]))}</span>
          ${check.ok ? '' : `<span class="action-why">${esc(t(check.msg))}</span>`}
        </button>`;
    }).join('');
    return `<div class="talk"><h4>${esc(t('project.talk'))}</h4><div class="action-grid">${buttons}</div></div>`;
  }

  function buttonsHtml(g, p) {
    const btn = (act, text, cls, extra = '') =>
      `<button type="button" class="btn btn-small ${cls}" data-act="${act}" data-p="${p.id}" data-key="${act}-${p.id}"${extra}>${esc(text)}</button>`;
    if (p.status === 'design') {
      const cost = E.submitPreview(g, p).cost;
      return `<div class="project-buttons">
        ${btn('submit', t('project.submit'), 'btn-primary', g.money < cost ? ' disabled' : '')}
        ${btn('redesign', t('project.changeDesign'), '')}
        ${btn('drop', t('project.drop'), 'btn-quiet')}
      </div>`;
    }
    if (p.status === 'operating') return `<div class="project-buttons">${btn('sell', t('project.sell'), '')}</div>`;
    return '';
  }

  function logHtml(g) {
    const turns = new Map();
    g.log.forEach(l => { if (!turns.has(l.turn)) turns.set(l.turn, []); turns.get(l.turn).push(l.msg); });
    const body = turns.size
      ? [...turns.keys()].reverse().map(n => `
          <h3 class="log-turn">${esc(t('logPanel.turn', { turn: n }))}</h3>
          <ul class="log-list">${readingOrder(turns.get(n)).map(logLine).join('')}</ul>`).join('')
      : `<p class="empty">${esc(t('logPanel.empty'))}</p>`;
    return `
      <details class="game-section log-panel" data-key="log">
        <summary><h2>${esc(t('logPanel.title'))}</h2></summary>
        <div class="log-body">${body}</div>
      </details>`;
  }

  function turnBarHtml(g) {
    if (g.over) {
      return `<div class="turn-bar"><button type="button" class="btn btn-primary btn-wide" data-act="results" data-key="results">${esc(t('report.results'))}</button></div>`;
    }
    return `
      <div class="turn-bar">
        ${g.ap > 0 ? `<span class="ap-left">${esc(t('game.apLeft', { ap: g.ap }))}</span>` : ''}
        <button type="button" class="btn btn-primary btn-wide" data-act="endTurn" data-key="endTurn">${esc(t('game.endTurn', { turn: g.turn }))}</button>
      </div>`;
  }

  // ===== Turn report =====
  function endTurn() {
    const g = game();
    const before = { turn: g.turn, money: g.money, T: g.T, logLength: g.log.length, notebook: SC.notebook.discovered(g) };
    SC.session.act('endTurn');
    render();
    const entries = readingOrder(g.log.slice(before.logLength).map(l => l.msg));
    const newEntries = SC.notebook.discovered(g).filter(id => !before.notebook.includes(id));
    const change = (label, from, to, decimals) => {
      // difference of the rounded numbers, so that it matches what is shown
      const diff = Number(fmt(to, decimals)) - Number(fmt(from, decimals));
      const mood = diff > 0 ? 'is-good' : diff < 0 ? 'is-bad' : '';
      return `<div><dt>${esc(label)}</dt><dd>${fmt(from, decimals)} → <strong>${fmt(to, decimals)}</strong> <span class="${mood}">(${fmtSigned(diff, decimals)})</span></dd></div>`;
    };
    $('reportTitle').textContent = t('report.title', { turn: before.turn });
    $('reportBody').innerHTML =
      (entries.length
        ? `<ul class="report-list">${entries.map(logLine).join('')}</ul>`
        : `<p class="report-quiet">${esc(t('report.quiet'))}</p>`) +
      `<dl class="report-changes">${change(t('stat.money'), before.money, g.money, 1)}${change(t('stat.trust'), before.T, g.T, 0)}</dl>` +
      (newEntries.length ? `<div class="report-notebook"><p>${esc(t('nb.reportNew'))}</p><ul>${newEntries.map(id =>
        `<li><button type="button" class="btn-link" data-nb="${id}">${esc(SC.notebook.title(id))}</button></li>`).join('')}</ul></div>` : '') +
      (g.over ? `<p class="report-over">${esc(t('report.gameOver'))}</p>` : '');
    $('reportContinue').textContent = t('common.continue');
    openDialog($('reportDialog'), {
      returnFocus: () => $('gameView').querySelector('[data-key="endTurn"], [data-key="results"]')
    });
  }

  // ===== Clicks =====
  // Do a player action, redraw, and tell the player briefly what happened.
  function act(args, projectId) {
    const g = game();
    const p = projectId ? g.projects.find(x => x.id === projectId) : null;
    const acceptanceBefore = p ? E.acceptance(p, g.P) : 0;
    const logBefore = g.log.length;
    const result = SC.session.act(...args);
    if (!result.ok) {
      if (result.msg) announce(t(result.msg));
    } else if (args[0] === 'engage') {
      announce(t('done.engage', { action: t('action.' + args[2]), id: projectId, from: acceptanceBefore, to: E.acceptance(p, g.P) }));
    } else if (g.log.length > logBefore) {
      announce(t(g.log[g.log.length - 1].msg));
    }
    if (projectId) fallbackFocus = 'title-' + projectId;
    render();
  }

  // Selling and dropping cannot be undone, so ask first.
  async function askThenAct(type, id, button) {
    const g = game(), p = g.projects.find(x => x.id === id);
    const texts = type === 'sell'
      ? { title: t('confirm.sellTitle', { id }), text: t('confirm.sellText', { price: E.salePrice(p, g.P) }), ok: t('confirm.sellOk') }
      : { title: t('confirm.dropTitle', { id }), text: t('confirm.dropText'), ok: t('confirm.dropOk') };
    if (await confirmDialog({ ...texts, cancel: t('common.cancel') }, button)) {
      act([type, id], id);
      focusOn('title-' + id);
    }
  }

  function onClick(e) {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const id = b.dataset.p ? Number(b.dataset.p) : null;
    switch (b.dataset.act) {
      case 'engage': return act(['engage', id, b.dataset.a], id);
      case 'submit': return act(['submit', id], id);
      case 'sell': return askThenAct('sell', id, b);
      case 'drop': return askThenAct('drop', id, b);
      case 'endTurn': return endTurn();
      case 'plan': return SC.designPanel.openNew(Number(b.dataset.site));
      case 'redesign': return SC.designPanel.openChange(id);
      case 'results': return SC.app.showResults();
    }
  }

  // Move keyboard focus to an element of the game screen (scrolls it into view).
  function focusOn(key) {
    const el = key && $('gameView').querySelector(`[data-key="${CSS.escape(key)}"]`);
    if (el && !el.disabled) el.focus();
  }

  function init() { $('gameView').addEventListener('click', onClick); }

  SC.gameScreen = { init, render, focusOn };
})(globalThis);
