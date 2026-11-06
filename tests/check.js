// Solar Commons: automatic checks. Run in the project folder with:
//
//   node tests/check.js
//
// 1. Rules check: plays 600 games with the simulator's three computer strategies
//    (fixed random seeds) and compares each finished game with tests/engine-reference.json.
//    If anything differs, a rule or a number has changed.
//    After a rule change that has been approved, renew the reference on purpose with:
//      node tests/check.js --update
// 2. Map check: the placement rules (hedges on the edge, connected corridors) on example maps.
// 3. Preview check: what the screens promise before an action (for example the permit time
//    if you submit now) matches what the engine then actually does.
// 4. Save check: a game continued from its save (after a page reload) is identical.
// 5. Text check: both language files have the same text codes and placeholders,
//    and every text code used in the code exists.

const fs = require('fs'), vm = require('vm'), path = require('path'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const REF_FILE = path.join(__dirname, 'engine-reference.json');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const update = process.argv.includes('--update');
let failures = 0;
const fail = text => { failures++; console.log('  ✗ ' + text); };

// ---------- Load the engine and the strategies, the same way the simulator page does ----------
const ctx = vm.createContext({ module: { exports: {} }, console });
for (const f of ['js/i18n.js', 'lang/en.js', 'lang/ja.js', 'js/engine.js']) vm.runInContext(read(f), ctx, { filename: f });
const simScripts = [...read('prototype/simulator.html').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
vm.runInContext(simScripts[0], ctx, { filename: 'prototype/simulator.html (strategies)' });
const E = ctx.SolarEngine;
const S = ctx.module.exports;   // batch, runGame, STRATEGIES

// ---------- 1. Rules check ----------
// Two sets of numbers: the design document values, and a "stress" set that triggers
// more events, objections and cancellations, so that rarely used rules are covered too.
const SETS = { design: {}, stress: { eventChance: 0.5, objBase: 0.4, silenceDrift: 10 } };
const GAMES = 100;   // per strategy and set
const seedOf = i => 1000 + i * 7919;
const fingerprint = obj => crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 16);

console.log('Rules check');
const results = {};
for (const [setName, changes] of Object.entries(SETS)) {
  const P = Object.assign(E.defaultParams(), changes);
  for (const k of Object.keys(S.STRATEGIES)) {
    const list = [];
    for (let i = 0; i < GAMES; i++) {
      const g = S.runGame({ ...P }, k, seedOf(i));
      const sc = E.scoreGame(g);
      list.push(fingerprint({ game: { ...g, P: undefined }, grade: sc.grade, avg: sc.avg, cap: sc.capBuilt, note: sc.note }));
    }
    results[`${setName} / ${k}`] = list;
  }
}

if (update) {
  fs.writeFileSync(REF_FILE, JSON.stringify({
    about: 'Fingerprints of 600 finished games. Made by: node tests/check.js --update',
    params: E.defaultParams(),
    games: results
  }, null, 1) + '\n');
  console.log('  Reference renewed: tests/engine-reference.json');
} else if (!fs.existsSync(REF_FILE)) {
  fail('tests/engine-reference.json is missing. Create it with: node tests/check.js --update');
} else {
  const ref = JSON.parse(fs.readFileSync(REF_FILE, 'utf8'));
  for (const [k, v] of Object.entries(ref.params)) {
    if (E.defaultParams()[k] !== v) fail(`number "${k}" changed: was ${v}, now ${E.defaultParams()[k]}`);
  }
  let checked = 0;
  for (const [name, list] of Object.entries(results)) {
    const old = ref.games[name] || [];
    const first = list.findIndex((h, i) => h !== old[i]);
    checked += list.length;
    if (first >= 0 || list.length !== old.length) {
      const diff = list.filter((h, i) => h !== old[i]).length;
      fail(`${name}: ${diff} of ${list.length} games play differently (first: seed ${seedOf(Math.max(first, 0))})`);
    }
  }
  if (!failures) console.log(`  ✓ ${checked} games play exactly as in the reference`);
}

// A random site map (used by the test players below): one letter per tile, '.' = empty
const LETTERS = 'ddwwwmmhhpc......';
const randomMap = r => Array.from({ length: E.MAP_SIDE * E.MAP_SIDE }, () => LETTERS[Math.floor(r() * LETTERS.length)]).join('');

// ---------- 2. Map check ----------
// The placement rules of design document section 5 (v0.6), checked on small example maps.
console.log('Map check');
const beforeMap = failures;
{
  const P = E.defaultParams();
  const EMPTY_ROW = '..........';
  // Build a map from up to 10 rows; missing rows are empty.
  const mapOf = (...rows) => [...rows, ...Array(E.MAP_SIDE - rows.length).fill(EMPTY_ROW)].join('');
  const place = map => E.mapPlacement(map);
  const expect = (ok, text) => { if (!ok) fail('map rule: ' + text); };

  // Corridors: a group counts only if it touches the edge and a meadow, hedge or pond (side by side)
  expect(place(mapOf('c.........', 'cm........')).linkedCorridors === 2, 'a corridor from the edge to a meadow counts');
  expect(place(mapOf(EMPTY_ROW, EMPTY_ROW, EMPTY_ROW, EMPTY_ROW, '....ccm...')).looseCorridors === 2, 'a corridor away from the edge does not count');
  expect(place(mapOf('.....c....')).looseCorridors === 1, 'a corridor without a meadow, hedge or pond does not count');
  expect(place(mapOf('c.........', '.m........')).looseCorridors === 1, 'touching only diagonally does not count');
  expect(place(mapOf('h.........', 'c.........', 'c.........', '.....c....')).linkedCorridors === 2, 'only the connected group counts');

  // Hedges: only hedges on the outer ring shelter and screen the park
  const hedgeMap = mapOf('.hhh......', EMPTY_ROW, EMPTY_ROW, EMPTY_ROW, EMPTY_ROW, '.....hh...', EMPTY_ROW, EMPTY_ROW, EMPTY_ROW, 'wwwwwwwwww');
  const hedgeCalc = E.calcDesign({ map: hedgeMap, mgmt: 'none' }, 'farmland', P);
  expect(place(hedgeMap).edgeHedges === 3 && hedgeCalc.screenHedges === 3, '3 of 5 hedges are on the edge');
  expect(E.normalizeDesign({ map: hedgeMap }).hedge === 5, 'all 5 hedges are counted as tiles');

  // A well-placed map gives the same result as the same tiles without a map (as in the simulator)
  const good = { map: mapOf('hhhhhhhhhh', 'cwwwwwwwwh', 'cmmmppmmmh', 'hddddddddh'), mgmt: 'grazing', cheap: false };
  const counts = { ...E.countsFromMap(good.map), mgmt: 'grazing', cheap: false };
  const a = E.calcDesign(good, 'farmland', P), b = E.calcDesign(counts, 'farmland', P);
  expect(['cap', 'cost', 'bTarget', 'types', 'tiles'].every(k => a[k] === b[k]), 'a well-placed map equals the same tiles without a map');

  // A loose corridor costs money but adds no biodiversity and no measure type
  const withLoose = mapOf('hhhhhhhhhh', 'hwwwwwwwwh', 'hwww.c.wwh');
  const without = mapOf('hhhhhhhhhh', 'hwwwwwwwwh', 'hwww...wwh');
  const c1 = E.calcDesign({ map: withLoose, mgmt: 'none' }, 'brownfield', P), c2 = E.calcDesign({ map: without, mgmt: 'none' }, 'brownfield', P);
  expect(c1.bTarget === c2.bTarget && c1.types === c2.types && c1.cost === c2.cost + P.corridorCost, 'a loose corridor adds cost only');

  // The elderly resident's wish and the safety score use the hedges on the edge
  const planned = map => { const design = E.normalizeDesign({ map, mgmt: 'none', cheap: false }); return { site: 'farmland', design, calc: E.calcDesign(design, 'farmland', P) }; };
  const inner = planned(mapOf(EMPTY_ROW, '.hhhh.....', 'wwwwwwwwww'));
  const edge = planned(mapOf('hhh.......', EMPTY_ROW, 'wwwwwwwwww'));
  expect(!E.wishesMet(inner)[1] && E.wishesMet(edge)[1], "the elderly resident's wish needs hedges on the edge");
  const park = x => ({ ...x, status: 'operating', B: 0, objections: 0, damaged: false });
  expect(E.scorePark(park(inner), P).safety === 1 && E.scorePark(park(edge), P).safety === 2, 'the safety score needs hedges on the edge');
}
if (failures === beforeMap) console.log('  ✓ corridors and hedges follow the placement rules');

// ---------- 3. Preview check ----------
// The game screen shows previews, for example "if you submit now: about 6 permit turns".
// A random test player plays many games (also changing and dropping designs); each time it
// submits, the preview from just before must match what the engine then actually did.
console.log('Preview check');
const beforePreview = failures;
let previews = 0;
try {
  for (let i = 0; i < 300; i++) {
    const P = E.defaultParams();
    const g = E.newGame(P, seedOf(i));
    const r = E.rng(seedOf(i) + 1);   // separate random numbers for the test player's own choices
    const pick = list => list[Math.floor(r() * list.length)];
    while (!g.over) {
      if (g.sites.length && r() < 0.5) {
        const n = k => Math.floor(r() * k);
        const extra = { mgmt: pick(['none', 'mowing', 'grazing']), cheap: r() < 0.3 };
        E.startProject(g, n(g.sites.length), r() < 0.5
          ? { map: randomMap(r), ...extra }
          : { dense: n(15), wide: n(15), meadow: n(6), hedge: n(6), pond: n(3), corridor: n(3), ...extra });
      }
      for (const p of g.projects) {
        if (p.status === 'design') {
          const roll = r();
          if (roll < 0.25) E.doAction(g, p, pick(['fund', 'benefit', 'visit', 'tour']));
          else if (roll < 0.55) {
            const genuineFirst = r() < 0.5 && E.checkAction(g, p, 'genuine').ok;
            const pre = E.submitPreview(g, p, { genuineFirst });
            if (genuineFirst) E.doAction(g, p, 'genuine');
            if (E.submit(g, p).ok) {
              previews++;
              const A = E.acceptance(p, P);
              if (p.permitLeft !== pre.turns || p.planningPaid !== pre.cost || Math.abs(A - pre.A) > 1e-9 || p.promoActive !== pre.promo) {
                fail(`submit preview differs (seed ${seedOf(i)}, project ${p.id}): preview ${pre.turns} turns, A ${pre.A}; actual ${p.permitLeft} turns, A ${A}`);
              }
            }
          } else if (roll < 0.6) E.dropProject(g, p);
          else if (roll < 0.7) E.changeDesign(g, p, { ...p.design, hedge: (p.design.hedge || 0) + 1, cheap: false });
        } else if (p.status === 'permitting' && r() < 0.5) {
          E.doAction(g, p, pick(['genuine', 'visit', 'tour']));
        }
      }
      E.endTurn(g);
    }
  }
} catch (e) {
  fail('the engine stopped with an error: ' + e.message);
}
if (failures === beforePreview) console.log(`  ✓ ${previews} submissions: every preview matched what happened`);

// ---------- 4. Save check ----------
// Plays random games through the same session code the game uses (js/save.js). Now and then
// it throws the game away and continues it from the save: the continued game must be
// identical, and must go on with the same random numbers.
console.log('Save check');
const beforeSave = failures;
const storage = {};
ctx.localStorage = {
  getItem: k => (k in storage ? storage[k] : null),
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: k => { delete storage[k]; }
};
vm.runInContext(read('js/save.js'), ctx, { filename: 'js/save.js' });
const session = ctx.SC.session;
let resumes = 0;
try {
  for (let i = 0; i < 100 && failures === beforeSave; i++) {
    const r = E.rng(seedOf(i) + 2);
    const n = k => Math.floor(r() * k);
    const pick = list => list[n(list.length)];
    const design = () => (r() < 0.7
      ? { map: randomMap(r), mgmt: pick(['none', 'mowing', 'grazing']), cheap: r() < 0.3 }
      : { dense: n(12), wide: n(12), meadow: n(5), hedge: n(5), pond: n(3), corridor: n(3),
        mgmt: pick(['none', 'mowing', 'grazing']), cheap: r() < 0.3 });
    session.start();
    for (let step = 0; step < 500 && !session.game.over; step++) {
      const g = session.game, roll = r();
      if (roll < 0.15 && g.sites.length) session.act('start', n(g.sites.length), design());
      else if (roll < 0.6 && g.projects.length) {
        const p = pick(g.projects);
        const what = pick(['engage', 'engage', 'submit', 'drop', 'redesign', 'sell']);
        if (what === 'engage') session.act('engage', p.id, pick(Object.keys(E.ACTIONS)));
        else if (what === 'redesign') session.act('redesign', p.id, design());
        else session.act(what, p.id);
      } else session.act('endTurn');

      if (r() < 0.05) {
        const old = session.game, before = JSON.stringify(old);
        session.end(false);
        if (!session.resume()) { fail(`game ${i}: the saved game could not be continued`); break; }
        resumes++;
        if (JSON.stringify(session.game) !== before) { fail(`game ${i}: the continued game differs from the saved one`); break; }
        E.endTurn(old);
        session.act('endTurn');
        if (JSON.stringify(session.game) !== JSON.stringify(old)) { fail(`game ${i}: after continuing, the next turn plays differently`); break; }
      }
    }
  }
  // A save made with other rules must not be continued.
  const saved = JSON.parse(storage['sc-save']);
  storage['sc-save'] = JSON.stringify({ ...saved, rules: 'other' });
  if (session.resume()) fail('a save made with other rules was continued');
  session.end(true);
  if (session.hasSaved()) fail('the save was not deleted');
} catch (e) {
  fail('the save check stopped with an error: ' + e.message);
}
if (failures === beforeSave) console.log(`  ✓ games were continued from their save ${resumes} times, always identical`);

// ---------- 5. Text check ----------
console.log('Text check');
const before = failures;
const en = ctx.SC_LANG.en, ja = ctx.SC_LANG.ja;
const placeholders = s => (s.match(/\{[^}]+\}/g) || []).sort().join(' ');
for (const k of Object.keys(en)) {
  if (!(k in ja)) fail(`"${k}" is in en.js but missing in ja.js`);
  else if (placeholders(en[k]) !== placeholders(ja[k])) fail(`"${k}": placeholders differ (en: ${placeholders(en[k]) || 'none'}, ja: ${placeholders(ja[k]) || 'none'})`);
}
for (const k of Object.keys(ja)) if (!(k in en)) fail(`"${k}" is in ja.js but missing in en.js`);

// Text codes used in the code: quoted codes in the JavaScript files, data-i18n attributes
// in index.html, and codes built from the engine's lists (site.<type>, resident.<id>, ...).
const prefixes = new Set(Object.keys(en).map(k => k.split('.')[0]));
const used = new Set();
const jsFiles = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f);
for (const f of jsFiles) {
  for (const m of read(f).matchAll(/'([a-z][a-zA-Z]*\.[\w.]+)'/g)) if (prefixes.has(m[1].split('.')[0])) used.add(m[1]);
}
for (const m of read('index.html').matchAll(/data-i18n(?:-aria-label)?="([\w.]+)"/g)) used.add(m[1]);
E.SITE_TYPES.forEach(s => { used.add('site.' + s); used.add('siteInfo.' + s); });
E.RESIDENTS.forEach(r => { used.add('resident.' + r); used.add('wish.' + r); });
Object.keys(E.ACTIONS).forEach(a => { used.add('action.' + a); used.add('actionInfo.' + a); });
E.STATUSES.forEach(s => used.add('status.' + s));
// Policy notebook: every entry needs its four texts and an official source link (https)
const nbEntries = [...read('js/notebook.js').matchAll(/\{ id: '(\w+)', source: '([^']*)'/g)].map(m => ({ id: m[1], source: m[2] }));
if (nbEntries.length !== 11) fail(`expected 11 policy notebook entries in js/notebook.js, found ${nbEntries.length}`);
for (const { id, source } of nbEntries) {
  ['title', 'unlock', 'game', 'real'].forEach(part => used.add(`nb.${id}.${part}`));
  if (!/^https:\/\/\S+$/.test(source)) fail(`policy notebook entry "${id}" has no https source link`);
}
for (const k of used) if (!(k in en)) fail(`text code "${k}" is used in the code but missing in the language files`);
if (failures === before) console.log(`  ✓ ${Object.keys(en).length} texts in both languages, ${used.size} codes used in the code all exist`);

console.log(failures ? `\n${failures} problem(s) found.` : '\nAll checks passed.');
process.exit(failures ? 1 : 0);
