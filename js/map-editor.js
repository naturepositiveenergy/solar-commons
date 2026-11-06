// Solar Commons: the map editor in the design panel (design document section 5).
//
// The site is a grid of MAP_SIDE × MAP_SIDE tiles. The player picks a tile type in the
// palette and paints: tap or click a tile, or drag across several. With a keyboard, the
// arrow keys move between tiles and Enter or Space paints.
// A map is a text with one letter per tile, row by row (see js/engine.js); '.' = empty.

(function (root) {
  'use strict';
  const SC = root.SC = root.SC || {};
  const E = root.SolarEngine;
  const { esc } = SC.ui;
  const N = E.MAP_SIDE;
  const EMPTY_MAP = '.'.repeat(N * N);
  const BRUSHES = [...E.TILE_KEYS, 'empty'];
  const LETTER = { ...E.TILE_LETTERS, empty: '.' };
  const BRUSH_OF = Object.fromEntries(Object.entries(LETTER).map(([k, v]) => [v, k]));
  const NAME = {
    dense: 'tile.dense', wide: 'tile.wide', meadow: 'tile.meadow', hedge: 'tile.hedge',
    pond: 'tile.pond', corridor: 'tile.corridor', empty: 'tile.empty'
  };
  const SHORT = {   // short names for the palette buttons
    dense: 'tileShort.dense', wide: 'tileShort.wide', meadow: 'tileShort.meadow', hedge: 'tileShort.hedge',
    pond: 'tileShort.pond', corridor: 'tileShort.corridor', empty: 'tileShort.empty'
  };
  const onEdge = i => { const r = Math.floor(i / N), c = i % N; return r === 0 || c === 0 || r === N - 1 || c === N - 1; };

  // Create an editor inside a container.
  //   map: the starting map; brush: the starting tile type
  //   describe(brush): a short text about a tile type (cost, benefit), shown under the palette
  //   onChange(map): runs after every change
  function create(container, { map, brush = 'wide', describe, onChange }) {
    let cells = (map && map.length === N * N ? map : EMPTY_MAP).split('');
    let current = BRUSHES.includes(brush) ? brush : 'wide';
    let focusIndex = 0, painting = false, strokeChanged = false;
    const history = [];   // earlier maps, for Undo

    container.innerHTML = `
      <div class="palette" role="group" aria-label="${esc(t('design.paletteLabel'))}">
        ${BRUSHES.map(b => `
          <button type="button" class="palette-btn" data-brush="${b}" aria-pressed="false">
            <span class="tile tile-${b}" aria-hidden="true"></span>
            <span class="palette-name" aria-hidden="true">${esc(t(SHORT[b]))}</span>
            <span class="palette-count" data-count="${b}" aria-hidden="true"></span>
          </button>`).join('')}
      </div>
      <p class="brush-info" aria-live="polite"></p>
      <div class="map-grid" role="group" aria-label="${esc(t('design.mapLabel', { size: N }))}" style="--n:${N}">
        ${cells.map((_, i) => `<button type="button" class="map-cell${onEdge(i) ? ' is-edge' : ''}" data-i="${i}" tabindex="-1"></button>`).join('')}
      </div>
      <div class="map-tools">
        <button type="button" class="btn btn-small" data-tool="fill"></button>
        <button type="button" class="btn btn-small" data-tool="undo">${esc(t('design.undo'))}</button>
        <button type="button" class="btn btn-small btn-quiet" data-tool="clear">${esc(t('design.clear'))}</button>
      </div>
      <p class="map-hint">${esc(t('design.mapHint'))}</p>`;
    const grid = container.querySelector('.map-grid');
    const cellButtons = [...grid.children];

    // ----- Drawing -----
    function refresh() {
      const loose = new Set(E.mapPlacement(cells.join('')).looseCells);
      cellButtons.forEach((b, i) => {
        const kind = BRUSH_OF[cells[i]] || 'empty';
        b.className = `map-cell tile-${kind}${onEdge(i) ? ' is-edge' : ''}${loose.has(i) ? ' is-loose' : ''}`;
        const vars = { row: Math.floor(i / N) + 1, col: i % N + 1, tile: t(NAME[kind]) };
        b.setAttribute('aria-label', t(loose.has(i) ? 'design.cellLoose' : 'design.cell', vars));
        b.tabIndex = i === focusIndex ? 0 : -1;
      });
      const counts = E.countsFromMap(cells.join(''));
      counts.empty = cells.filter(c => c === '.').length;
      container.querySelectorAll('.palette-btn').forEach(b => {
        const kind = b.dataset.brush;
        b.querySelector('[data-count]').textContent = counts[kind];
        b.setAttribute('aria-pressed', String(kind === current));
        b.setAttribute('aria-label', `${t(NAME[kind])}: ${counts[kind]}`);   // full name for screen readers
      });
      container.querySelector('.brush-info').innerHTML =
        `<strong>${esc(t(NAME[current]))}</strong>${describe ? ' · ' + esc(describe(current)) : ''}`;
      const fill = container.querySelector('[data-tool="fill"]');
      fill.textContent = t('design.fillEmpty', { tile: t(NAME[current]) });
      fill.disabled = current === 'empty' || !cells.includes('.');
      container.querySelector('[data-tool="undo"]').disabled = history.length === 0;
      container.querySelector('[data-tool="clear"]').disabled = cells.every(c => c === '.');
    }

    function changed() { refresh(); if (onChange) onChange(cells.join('')); }
    function remember() { history.push(cells.join('')); if (history.length > 50) history.shift(); }
    function paint(i) {
      if (cells[i] === LETTER[current]) return false;
      cells[i] = LETTER[current];
      return true;
    }

    // ----- Painting with mouse, finger or pen -----
    grid.addEventListener('pointerdown', e => {
      const b = e.target.closest('.map-cell');
      if (!b || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault();
      remember();
      painting = true;
      focusIndex = Number(b.dataset.i);
      strokeChanged = paint(focusIndex);
      if (strokeChanged) changed(); else refresh();
    });
    grid.addEventListener('pointermove', e => {
      if (!painting) return;
      // a finger stays "on" the first tile it touched, so look up the tile under it
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const b = el && el.closest && el.closest('.map-cell');
      if (b && grid.contains(b) && paint(Number(b.dataset.i))) { strokeChanged = true; changed(); }
    });
    const stopPainting = () => {
      if (painting && !strokeChanged) history.pop();   // nothing changed: nothing to undo
      painting = false;
    };
    window.addEventListener('pointerup', stopPainting);
    window.addEventListener('pointercancel', stopPainting);

    // ----- Painting with the keyboard -----
    // Keep track of the focused tile, however it got focus (Tab, a screen reader, a tap).
    grid.addEventListener('focusin', e => {
      const b = e.target.closest('.map-cell');
      if (!b) return;
      focusIndex = Number(b.dataset.i);
      cellButtons.forEach((c, i) => { c.tabIndex = i === focusIndex ? 0 : -1; });
    });
    grid.addEventListener('click', e => {
      const b = e.target.closest('.map-cell');
      if (!b || e.detail !== 0) return;   // detail 0 = Enter or Space; pointer clicks were handled above
      focusIndex = Number(b.dataset.i);
      remember();
      if (paint(focusIndex)) changed(); else history.pop();
    });
    grid.addEventListener('keydown', e => {
      const here = e.target.closest('.map-cell');
      if (here) focusIndex = Number(here.dataset.i);   // start from the tile the key was pressed on
      const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -N, ArrowDown: N };
      let next = null;
      if (e.key in moves) {
        next = focusIndex + moves[e.key];
        if ((e.key === 'ArrowLeft' && focusIndex % N === 0) || (e.key === 'ArrowRight' && focusIndex % N === N - 1)) next = null;
      } else if (e.key === 'Home') next = focusIndex - focusIndex % N;
      else if (e.key === 'End') next = focusIndex - focusIndex % N + N - 1;
      if (next === null || next < 0 || next >= N * N) return;
      e.preventDefault();
      focusIndex = next;
      refresh();
      cellButtons[focusIndex].focus();
    });

    // ----- Palette and tools -----
    container.addEventListener('click', e => {
      const p = e.target.closest('.palette-btn');
      if (p) { current = p.dataset.brush; refresh(); return; }
      const tool = e.target.closest('[data-tool]');
      if (!tool || tool.disabled) return;
      if (tool.dataset.tool === 'fill') { remember(); cells = cells.map(c => (c === '.' ? LETTER[current] : c)); changed(); }
      if (tool.dataset.tool === 'clear') { remember(); cells = EMPTY_MAP.split(''); changed(); }
      if (tool.dataset.tool === 'undo' && history.length) { cells = history.pop().split(''); changed(); }
    });

    refresh();
    return {
      getMap: () => cells.join(''),
      getBrush: () => current,
      // Remove the window listeners when the design panel closes.
      destroy() {
        window.removeEventListener('pointerup', stopPainting);
        window.removeEventListener('pointercancel', stopPainting);
      }
    };
  }

  // A small picture of a design's map, for project cards and the end screen.
  // Screen readers get a short list of the tiles instead of the picture.
  function miniMapHtml(design) {
    if (!design || !design.map) return '';
    const counts = E.countsFromMap(design.map);
    const list = E.TILE_KEYS.filter(k => counts[k]).map(k => `${t(NAME[k])} ${counts[k]}`).join(t('map.separator'));
    const tiles = [...design.map].map((letter, i) =>
      `<span class="tile-${BRUSH_OF[letter] || 'empty'}${onEdge(i) ? ' is-edge' : ''}"></span>`).join('');
    return `<div class="mini-map" role="img" aria-label="${esc(t('map.summary', { list }))}" style="--n:${N}">${tiles}</div>`;
  }

  SC.mapEditor = { create, miniMapHtml, EMPTY_MAP };
})(globalThis);
