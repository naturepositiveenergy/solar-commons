// Solar Commons: the design panel, where a park is planned on a site (design document section 5).
//
// The player paints the park on the site map (js/map-editor.js) and chooses the management
// and whether to build cheaply. All totals shown here are calculated by the engine, so they
// match the game exactly.

(function (root) {
  'use strict';
  const SC = root.SC = root.SC || {};
  const E = root.SolarEngine;
  const { esc, fmt, openDialog, announce } = SC.ui;
  const $ = id => document.getElementById(id);
  const MAP_TILES = E.MAP_SIDE * E.MAP_SIDE;

  const EMPTY = E.normalizeDesign({ map: SC.mapEditor.EMPTY_MAP, mgmt: 'none', cheap: false });
  let lastDesign = EMPTY;          // a new plan starts from the previous design
  let lastBrush = 'wide';          // and with the tile type used last
  let ctx = null;                  // what is being designed (see openNew and openChange)
  let editor = null;               // the map editor while the panel is open

  // Text codes and numbers for each tile type
  const TILES = {
    dense: { note: 'tileNote.dense', info: P => ['tileInfo.panel', { cost: P.denseCost, cap: P.denseCap }] },
    wide: { note: 'tileNote.wide', info: P => ['tileInfo.widePanel', { cost: P.wideCost, cap: P.wideCap, b: P.wideB }] },
    meadow: { note: 'tileNote.meadow', info: P => ['tileInfo.nature', { cost: P.meadowCost, b: P.meadowB }] },
    hedge: { note: 'tileNote.hedge', info: P => ['tileInfo.nature', { cost: P.hedgeCost, b: P.hedgeB }] },
    pond: { note: 'tileNote.pond', info: P => ['tileInfo.nature', { cost: P.pondCost, b: P.pondB }] },
    corridor: { note: 'tileNote.corridor', info: P => ['tileInfo.nature', { cost: P.corridorCost, b: P.corridorB }] },
    empty: { note: 'tileNote.empty', info: null }
  };
  const MGMT = {
    none: { name: 'mgmt.none', info: () => ['mgmtInfo.none', {}] },
    mowing: { name: 'mgmt.mowing', info: P => ['mgmtInfo.mowing', { b: P.mowingB, cost: P.mowingCost }] },
    grazing: { name: 'mgmt.grazing', info: P => ['mgmtInfo.grazing', { b: P.grazingB, cost: P.grazingCost }] }
  };
  // The residents whose wishes depend on the design (the others depend on later actions)
  const DESIGN_WISHES = [0, 1, 3];   // farmer, elderly resident, nature group (order of E.RESIDENTS)

  // Short text about a tile type, shown under the palette.
  function describe(brush) {
    const tile = TILES[brush], P = SC.session.game.P;
    return tile.info ? `${t(...tile.info(P))}\n${t(tile.note)}` : t(tile.note);
  }

  // A design without a map (not made in this game version): lay its tiles out row by row.
  function withMap(d) {
    if (d.map) return E.normalizeDesign(d);
    const letters = E.TILE_KEYS.map(k => E.TILE_LETTERS[k].repeat(d[k] || 0)).join('');
    return E.normalizeDesign({ ...d, map: letters.padEnd(MAP_TILES, '.').slice(0, MAP_TILES) });
  }

  // ----- Opening -----
  function openNew(siteIndex) {
    const g = SC.session.game, site = g && g.sites[siteIndex];
    if (!site) return;
    ctx = { mode: 'new', siteIndex, site: site.type, town: site.town, promo: site.promo, fund: false, benefit: false,
      design: { ...lastDesign }, returnKey: 'plan-' + siteIndex };
    open();
  }

  function openChange(id) {
    const g = SC.session.game, p = g && g.projects.find(x => x.id === id);
    if (!p || p.status !== 'design') return;
    ctx = { mode: 'change', id, site: p.site, promo: p.promo, fund: p.fund, benefit: p.benefit,
      design: withMap(p.design), returnKey: 'redesign-' + id };
    open();
  }

  function open() {
    const P = SC.session.game.P;
    $('designTitle').textContent = ctx.mode === 'new'
      ? t('design.titleNew', { site: ctx.town === E.NEIGHBOUR ? t('town.siteIn', { site: t('site.' + ctx.site) }) : t('site.' + ctx.site) })
      : t('design.titleChange', { id: ctx.id });
    $('designForm').innerHTML = formHtml(P);
    editor = SC.mapEditor.create($('mapEditor'), {
      map: ctx.design.map,
      brush: lastBrush,
      describe,
      onChange: map => { ctx.design = E.normalizeDesign({ ...ctx.design, map }); update(); }
    });
    $('designCancel').textContent = t('common.cancel');
    $('designOk').textContent = t(ctx.mode === 'new' ? 'design.start' : 'design.save');
    update();
    openDialog($('designDialog'), { onClose: finish });
    $('designForm').scrollTop = 0;
    $('designTitle').focus();   // the title, not the map: that would be confusing for screen readers
  }

  // ----- The form -----
  function formHtml(P) {
    const d = ctx.design;
    const mgmt = E.MANAGEMENT.map(m => `
      <label class="choice">
        <input type="radio" name="mgmt" value="${m}"${d.mgmt === m ? ' checked' : ''}>
        <span><strong>${esc(t(MGMT[m].name))}</strong><small>${esc(t(...MGMT[m].info(P)))}</small></span>
      </label>`).join('');
    return `
      <p class="design-intro">${esc(t('design.intro', { size: E.MAP_SIDE }))}</p>
      <fieldset class="design-group">
        <legend>${esc(t('design.tilesTitle'))}</legend>
        <div id="mapEditor"></div>
        <div class="placement" id="placementInfo" aria-live="polite"></div>
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
        ${ctx.site === 'forest' ? `<p class="design-note">${esc(t('design.forestDrainage', { pct: P.drainageCost * 100 }))} ${SC.notebook.infoButton('forest')}</p>` : ''}
      </fieldset>
      <div class="design-details" id="designDetails" aria-live="polite"></div>`;
  }

  // ----- Live totals -----
  function update() {
    const g = SC.session.game, P = g.P, d = ctx.design;
    const calc = E.calcDesign(d, ctx.site, P);
    const problem = E.designProblem(calc, P);
    const planned = { site: ctx.site, promo: ctx.promo, design: d, calc, fund: ctx.fund, benefit: ctx.benefit, genuineBefore: false };
    const cost = E.playerCost(planned, P);

    const item = (label, value, mood) => `<div${mood ? ` class="is-${mood}"` : ''}><dt>${esc(label)}</dt><dd>${value}</dd></div>`;
    $('designSummary').innerHTML =
      item(t('design.tiles'), `${calc.tiles}<span class="stat-goal"> / ${MAP_TILES}</span>`, '') +
      item(t('design.capacity'), fmt(calc.cap, 1), '') +
      item(t('design.cost'), fmt(cost, 1), cost > g.money ? 'warn' : '') +
      item(t('design.bTarget'), fmt(calc.bTarget, 0), '');
    $('designProblem').textContent = problem ? t(problem) : '';
    $('designOk').disabled = !!problem;

    // Placement on the map: hedges on the edge, connected corridors
    const place = E.mapPlacement(d.map);
    const placement = [place.edgeHedges >= P.hedgesProtect
      ? ['good', t('design.hedgesOk', { n: place.edgeHedges })]
      : ['warn', t('design.hedgesLow', { n: place.edgeHedges, need: P.hedgesProtect })]];
    if (place.looseCorridors) placement.push(['warn', t('design.corridorLoose')]);
    else if (place.linkedCorridors) placement.push(['good', t('design.corridorOk')]);
    // Agrivoltaics: enough light for the crops, or the yearly farming reports will be poor (section 6)
    if (ctx.site === 'agri') {
      const n = { wide: d.wide || 0, dense: d.dense || 0 };
      placement.push(E.cropLight(d) ? ['good', t('design.lightOk', n), 'agri'] : ['warn', t('design.lightLow', n), 'agri']);
    }
    $('placementInfo').innerHTML = placement.map(([mood, text, entry]) =>
      `<p class="is-${mood}"><span aria-hidden="true">${mood === 'good' ? '✓' : '!'}</span> ${esc(text)}${entry ? ' ' + SC.notebook.infoButton(entry) : ''}</p>`).join('');

    const wish = E.wishesMet(planned);
    const running = calc.mgmtCost + (ctx.benefit ? P.benefitCost : 0);
    const lines = [];
    if (calc.cap > 0) {
      lines.push(`<p>${esc(t('design.income', { income: E.expectedIncome(g, planned), running }))} ${SC.notebook.infoButton('decommission')}</p>`);
      // how the park would sell its power if it were submitted now (section 6)
      const scheme = E.supportScheme(g, planned);
      const support = scheme === 'market'
        ? t('design.market', { fy: E.calendar(g, P.supportEndTurn).fy }) + (ctx.promo ? ' ' + t('design.marketPromo') : '')
        : t(scheme === 'fip' ? 'design.fip' : 'design.fit', { min: P.fipThreshold });
      lines.push(`<p class="${scheme === 'market' ? 'is-warn' : 'muted'}">${esc(support)} ${SC.notebook.infoButton('fitfip')}</p>`);
    }
    lines.push(`<p class="muted">${esc(t('design.bTargetInfo'))}</p>`);
    if (cost > g.money) lines.push(`<p class="is-warn">${esc(t('design.moneyShort', { money: g.money }))}</p>`);
    lines.push(`<h3>${esc(t('design.wishesTitle'))}</h3><ul class="design-wishes">${DESIGN_WISHES.map(i => `
      <li class="${wish[i] ? 'is-met' : ''}"><span class="wish-mark" aria-hidden="true">${wish[i] ? '✓' : '–'}</span>
        <span><strong>${esc(t('resident.' + E.RESIDENTS[i]))}</strong>${wish[i] ? `<span class="visually-hidden">: ${esc(t('project.wishMet'))}</span>` : ''}
        <small>${esc(t('wish.' + E.RESIDENTS[i]))}</small></span></li>`).join('')}</ul>`);
    $('designDetails').innerHTML = lines.join('');
  }

  function onInput(e) {
    const el = e.target;
    if (el.name === 'mgmt') ctx.design.mgmt = el.value;
    else if (el.id === 'd-cheap') ctx.design.cheap = el.checked;
    else return;
    update();
  }

  // Enter in the form should not close the panel.
  function onKey(e) {
    if (e.key === 'Enter' && e.target.matches('input')) e.preventDefault();
  }

  // ----- Closing -----
  function finish(value) {
    if (!ctx) return;   // already handled
    const done = ctx;
    ctx = null;
    lastBrush = editor.getBrush();
    editor.destroy();
    editor = null;
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

  function init() {
    const form = $('designForm');
    form.addEventListener('change', onInput);
    form.addEventListener('keydown', onKey);
  }

  SC.designPanel = { init, openNew, openChange };
})(globalThis);
