// Solar Commons: the design panel, where a park is planned on a site (design document section 5).
//
// For now the design is chosen with numbers: how many tiles of each kind, the management
// and whether to build cheaply. The 10 × 10 tile map replaces this in Milestone 3.
// All totals shown here are calculated by the engine, so they match the game exactly.

(function (root) {
  'use strict';
  const SC = root.SC = root.SC || {};
  const E = root.SolarEngine;
  const { esc, fmt, openDialog, announce } = SC.ui;
  const $ = id => document.getElementById(id);

  const EMPTY = { dense: 0, wide: 0, meadow: 0, hedge: 0, pond: 0, corridor: 0, mgmt: 'none', cheap: false };
  let lastDesign = { ...EMPTY };   // a new plan starts from the previous design
  let ctx = null;                  // what is being designed (see openNew and openChange)

  // Text codes and numbers for each tile type
  const TILES = {
    dense: { name: 'tile.dense', note: 'tileNote.dense', info: P => ['tileInfo.panel', { cost: P.denseCost, cap: P.denseCap }] },
    wide: { name: 'tile.wide', note: 'tileNote.wide', info: P => ['tileInfo.widePanel', { cost: P.wideCost, cap: P.wideCap, b: P.wideB }] },
    meadow: { name: 'tile.meadow', note: 'tileNote.meadow', info: P => ['tileInfo.nature', { cost: P.meadowCost, b: P.meadowB }] },
    hedge: { name: 'tile.hedge', note: 'tileNote.hedge', info: P => ['tileInfo.nature', { cost: P.hedgeCost, b: P.hedgeB }] },
    pond: { name: 'tile.pond', note: 'tileNote.pond', info: P => ['tileInfo.nature', { cost: P.pondCost, b: P.pondB }] },
    corridor: { name: 'tile.corridor', note: 'tileNote.corridor', info: P => ['tileInfo.nature', { cost: P.corridorCost, b: P.corridorB }] }
  };
  const MGMT = {
    none: { name: 'mgmt.none', info: () => ['mgmtInfo.none', {}] },
    mowing: { name: 'mgmt.mowing', info: P => ['mgmtInfo.mowing', { b: P.mowingB, cost: P.mowingCost }] },
    grazing: { name: 'mgmt.grazing', info: P => ['mgmtInfo.grazing', { b: P.grazingB, cost: P.grazingCost }] }
  };
  // The residents whose wishes depend on the design (the others depend on later actions)
  const DESIGN_WISHES = [0, 1, 3];   // farmer, elderly resident, nature group (order of E.RESIDENTS)

  // ----- Opening -----
  function openNew(siteIndex) {
    const g = SC.session.game, site = g && g.sites[siteIndex];
    if (!site) return;
    ctx = { mode: 'new', siteIndex, site: site.type, fund: false, benefit: false,
      design: { ...lastDesign }, returnKey: 'plan-' + siteIndex };
    open();
  }

  function openChange(id) {
    const g = SC.session.game, p = g && g.projects.find(x => x.id === id);
    if (!p || p.status !== 'design') return;
    ctx = { mode: 'change', id, site: p.site, fund: p.fund, benefit: p.benefit,
      design: { ...EMPTY, ...p.design }, returnKey: 'redesign-' + id };
    open();
  }

  function open() {
    const P = SC.session.game.P;
    $('designTitle').textContent = ctx.mode === 'new'
      ? t('design.titleNew', { site: t('site.' + ctx.site) })
      : t('design.titleChange', { id: ctx.id });
    $('designForm').innerHTML = formHtml(P);
    $('designCancel').textContent = t('common.cancel');
    $('designOk').textContent = t(ctx.mode === 'new' ? 'design.start' : 'design.save');
    update();
    openDialog($('designDialog'), { onClose: finish });
    $('designForm').scrollTop = 0;
    $('designTitle').focus();   // the title, not a number field: that would open the keyboard on phones
  }

  // ----- The form -----
  function formHtml(P) {
    const d = ctx.design;
    const rows = E.TILE_KEYS.map(k => {
      const tile = TILES[k], name = t(tile.name);
      return `
        <div class="tile-row">
          <span class="tile tile-${k}" aria-hidden="true"></span>
          <div class="tile-text">
            <label class="tile-name" for="d-${k}">${esc(name)}</label>
            <span class="tile-info">${esc(t(...tile.info(P)))}</span>
            <span class="tile-note">${esc(t(tile.note))}</span>
          </div>
          <div class="stepper">
            <button type="button" class="step" data-tile="${k}" data-step="-1" aria-label="${esc(t('design.less', { tile: name }))}">−</button>
            <input id="d-${k}" type="number" inputmode="numeric" min="0" max="${P.maxTiles}" step="1" value="${d[k] || 0}" data-tile="${k}">
            <button type="button" class="step" data-tile="${k}" data-step="1" aria-label="${esc(t('design.more', { tile: name }))}">+</button>
          </div>
        </div>`;
    }).join('');
    const mgmt = E.MANAGEMENT.map(m => `
      <label class="choice">
        <input type="radio" name="mgmt" value="${m}"${d.mgmt === m ? ' checked' : ''}>
        <span><strong>${esc(t(MGMT[m].name))}</strong><small>${esc(t(...MGMT[m].info(P)))}</small></span>
      </label>`).join('');
    return `
      <p class="design-intro">${esc(t('design.intro', { max: P.maxTiles }))}</p>
      <fieldset class="design-group">
        <legend>${esc(t('design.tilesTitle'))}</legend>
        ${rows}
      </fieldset>
      <fieldset class="design-group">
        <legend>${esc(t('design.mgmtTitle'))}</legend>
        ${mgmt}
      </fieldset>
      <fieldset class="design-group">
        <legend>${esc(t('design.buildTitle'))}</legend>
        <label class="choice">
          <input type="checkbox" id="d-cheap"${d.cheap ? ' checked' : ''}>
          <span><strong>${esc(t('design.cheap'))}</strong><small>${esc(t('design.cheapInfo', { pct: P.cheapDiscount * 100 }))}</small></span>
        </label>
        ${ctx.site === 'forest' ? `<p class="design-note">${esc(t('design.forestDrainage', { pct: P.drainageCost * 100 }))}</p>` : ''}
      </fieldset>
      <div class="design-details" id="designDetails" aria-live="polite"></div>`;
  }

  // ----- Live totals -----
  function update() {
    const g = SC.session.game, P = g.P, d = ctx.design;
    const calc = E.calcDesign(d, ctx.site, P);
    const problem = E.designProblem(calc, P);
    const planned = { site: ctx.site, design: d, calc, fund: ctx.fund, benefit: ctx.benefit, genuineBefore: false };
    const cost = E.playerCost(planned, P);
    const tilesOver = calc.tiles > P.maxTiles;

    const item = (label, value, mood) => `<div${mood ? ` class="is-${mood}"` : ''}><dt>${esc(label)}</dt><dd>${value}</dd></div>`;
    $('designSummary').innerHTML =
      item(t('design.tiles'), `${calc.tiles}<span class="stat-goal"> / ${P.maxTiles}</span>`, tilesOver ? 'bad' : '') +
      item(t('design.capacity'), fmt(calc.cap, 1), '') +
      item(t('design.cost'), fmt(cost, 1), cost > g.money ? 'warn' : '') +
      item(t('design.bTarget'), fmt(calc.bTarget, 0), '');
    $('designProblem').textContent = problem ? t(problem) : '';
    $('designOk').disabled = !!problem;

    const wish = E.wishesMet(planned);
    const running = calc.mgmtCost + (ctx.benefit ? P.benefitCost : 0);
    const lines = [];
    if (calc.cap > 0) {
      lines.push(`<p>${esc(t('design.income', { income: E.expectedIncome(g, planned), running }))}</p>`);
      lines.push(`<p class="muted">${esc(t(calc.cap >= P.fipThreshold ? 'design.fip' : 'design.fit', { min: P.fipThreshold }))}</p>`);
    }
    lines.push(`<p class="muted">${esc(t('design.bTargetInfo'))}</p>`);
    if (cost > g.money) lines.push(`<p class="is-warn">${esc(t('design.moneyShort', { money: g.money }))}</p>`);
    lines.push(`<h3>${esc(t('design.wishesTitle'))}</h3><ul class="design-wishes">${DESIGN_WISHES.map(i => `
      <li class="${wish[i] ? 'is-met' : ''}"><span class="wish-mark" aria-hidden="true">${wish[i] ? '✓' : '–'}</span>
        <span><strong>${esc(t('resident.' + E.RESIDENTS[i]))}</strong>${wish[i] ? `<span class="visually-hidden">: ${esc(t('project.wishMet'))}</span>` : ''}
        <small>${esc(t('wish.' + E.RESIDENTS[i]))}</small></span></li>`).join('')}</ul>`);
    $('designDetails').innerHTML = lines.join('');
  }

  function setTile(k, value) {
    const v = Math.max(0, Math.min(SC.session.game.P.maxTiles, Math.round(Number(value) || 0)));
    ctx.design[k] = v;
    return v;
  }

  function onInput(e) {
    const el = e.target;
    if (el.dataset.tile && el.type === 'number') setTile(el.dataset.tile, el.value);
    else if (el.name === 'mgmt') ctx.design.mgmt = el.value;
    else if (el.id === 'd-cheap') ctx.design.cheap = el.checked;
    else return;
    update();
  }

  function onClick(e) {
    const b = e.target.closest('[data-step]');
    if (!b) return;
    const k = b.dataset.tile;
    $('d-' + k).value = setTile(k, (ctx.design[k] || 0) + Number(b.dataset.step));
    update();
  }

  // Tidy the number field when the player leaves it (for example an empty field becomes 0).
  function onBlur(e) {
    const el = e.target;
    if (el.dataset && el.dataset.tile && el.type === 'number') el.value = ctx.design[el.dataset.tile] || 0;
  }

  // ----- Closing -----
  function finish(value) {
    if (!ctx) return;   // already handled
    const done = ctx;
    ctx = null;
    let focusKey = done.returnKey;
    if (value === 'ok') {
      const result = done.mode === 'new'
        ? SC.session.act('start', done.siteIndex, done.design)
        : SC.session.act('redesign', done.id, done.design);
      if (result.ok) {
        const log = SC.session.game.log;
        lastDesign = { ...done.design };
        focusKey = 'title-' + (done.mode === 'new' ? result.p.id : done.id);
        announce(t(log[log.length - 1].msg));
      } else if (result.msg) announce(t(result.msg));
    }
    SC.gameScreen.render();
    SC.gameScreen.focusOn(focusKey);
  }

  // Enter in a number field should not close the panel.
  function onKey(e) {
    if (e.key === 'Enter' && e.target.matches('input')) e.preventDefault();
  }

  function init() {
    const form = $('designForm');
    form.addEventListener('input', onInput);
    form.addEventListener('change', onInput);
    form.addEventListener('click', onClick);
    form.addEventListener('focusout', onBlur);
    form.addEventListener('keydown', onKey);
  }

  SC.designPanel = { init, openNew, openChange };
})(globalThis);
