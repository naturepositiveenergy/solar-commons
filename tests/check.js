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
// 6. Font check: every character the game uses is in the font files in fonts/
//    (otherwise run: node tools/make-fonts.js).
// 7. Offline check: the offline helper (sw.js) lists every file the game loads, every listed
//    file exists, and all ?v= version numbers are the same.
// 8. Scenario check: two test players who decide differently get the same sites and the same
//    events in every turn when they play the same scenario code, and the codes recommended in
//    docs/workshop-guide.md still play as the guide describes.
// 9. Contrast check: text colours are easy enough to read on their backgrounds (at least 4.5 : 1),
//    and the keyboard focus ring and field borders stand out enough (at least 3 : 1), in light and
//    dark mode (WCAG 2.2, level AA).

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
// It also checks the end of FIT/FIP (design document section 6): projects submitted from turn
// supportEndTurn sell at market prices, unless they get the promotion zone bonus.
// And the yearly farming report for agrivoltaics (section 6): thinning out costs and changes what
// its preview said, reports come only at fiscal year ends, and only parks with poor reports in a
// row are removed.
console.log('Preview check');
const beforePreview = failures;
let previews = 0, marketSubmissions = 0, keptByPromo = 0, thins = 0, guidance = 0, removals = 0;
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
              if (p.permitLeft !== pre.turns || p.planningPaid !== pre.cost || Math.abs(A - pre.A) > 1e-9 || p.promoActive !== pre.promo || p.support !== pre.support) {
                fail(`submit preview differs (seed ${seedOf(i)}, project ${p.id}): preview ${pre.turns} turns, A ${pre.A}, ${pre.support}; actual ${p.permitLeft} turns, A ${A}, ${p.support}`);
              }
              const late = g.turn >= P.supportEndTurn;
              const expected = late && !p.promoActive ? 'market' : p.calc.cap >= P.fipThreshold ? 'fip' : 'fit';
              if (p.support !== expected) fail(`project ${p.id} submitted in turn ${g.turn} sells with ${p.support}, expected ${expected} (seed ${seedOf(i)})`);
              if (p.support === 'market') marketSubmissions++;
              if (late && p.promoActive) keptByPromo++;
            }
          } else if (roll < 0.6) E.dropProject(g, p);
          else if (roll < 0.7) E.changeDesign(g, p, { ...p.design, hedge: (p.design.hedge || 0) + 1, cheap: false });
        } else if (p.status === 'permitting' && r() < 0.5) {
          E.doAction(g, p, pick(['genuine', 'visit', 'tour']));
        } else if (p.status === 'operating' && p.id % 2 === 0 && E.thinPreview(g, p) && r() < 0.5) {   // odd projects never thin out
          const pre = E.thinPreview(g, p), money = g.money, dense = p.design.dense;
          if (E.thinPanels(g, p).ok) {
            thins++;
            if (Math.abs(g.money - (money - pre.cost)) > 1e-9 || Math.abs(p.calc.cap - pre.cap) > 1e-9 ||
                dense - p.design.dense !== pre.tiles || !E.cropLight(p.design)) {
              fail(`thinning preview differs (seed ${seedOf(i)}, project ${p.id}): preview ${JSON.stringify(pre)}; actual cost ${money - g.money}, capacity ${p.calc.cap}, ${dense - p.design.dense} tiles`);
            }
          }
        }
      }
      const wasOperating = g.projects.filter(p => p.status === 'operating').map(p => p.id);
      E.endTurn(g);
      g.projects.filter(p => p.status === 'removed' && wasOperating.includes(p.id)).forEach(p => {
        removals++;
        if (p.site !== 'agri' || p.farmingFails < P.farmingFailLimit) fail(`project ${p.id} was removed without ${P.farmingFailLimit} poor farming reports in a row (seed ${seedOf(i)})`);
      });
    }
    g.log.filter(l => /^log\.farming/.test(l.msg.key)).forEach(l => {
      if (l.msg.key === 'log.farmingGuidance') guidance++;
      if (E.calendar(g, l.turn).quarter !== 4) fail(`a farming report came in turn ${l.turn}, not at the end of a fiscal year (seed ${seedOf(i)})`);
    });
  }
} catch (e) {
  fail('the engine stopped with an error: ' + e.message);
}
if (failures === beforePreview) {
  console.log(`  ✓ ${previews} submissions: every preview matched what happened`);
  console.log(`  ✓ end of FIT/FIP: ${marketSubmissions} later submissions sell at market prices, ${keptByPromo} kept FIT/FIP with the promotion zone bonus`);
  if (!marketSubmissions || !keptByPromo) fail('the test player never reached both cases of the end of FIT/FIP');
  console.log(`  ✓ farming reports: ${guidance} guidance, ${thins} thinnings as previewed, ${removals} parks removed after poor reports in a row`);
  if (!guidance || !thins || !removals) fail('the test player never reached all cases of the yearly farming report');
}

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
let resumes = 0, savedThins = 0;
try {
  for (let i = 0; i < 100 && failures === beforeSave; i++) {
    const r = E.rng(seedOf(i) + 2);
    const n = k => Math.floor(r() * k);
    const pick = list => list[n(list.length)];
    const design = () => (r() < 0.7
      ? { map: randomMap(r), mgmt: pick(['none', 'mowing', 'grazing']), cheap: r() < 0.3 }
      : { dense: n(12), wide: n(12), meadow: n(5), hedge: n(5), pond: n(3), corridor: n(3),
        mgmt: pick(['none', 'mowing', 'grazing']), cheap: r() < 0.3 });
    session.start(String(1000 + (seedOf(i) % 9000)));   // a fixed code, so every run plays the same games
    for (let step = 0; step < 500 && !session.game.over; step++) {
      const g = session.game, roll = r();
      const thinnable = g.projects.find(p => E.thinPreview(g, p));
      if (thinnable && r() < 0.5) { if (session.act('thin', thinnable.id).ok) savedThins++; }
      else if (roll < 0.15 && g.sites.length) session.act('start', n(g.sites.length), design());
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
  // Thinning out panels (design document section 6) is saved and continued like any other action:
  // scenario 1016 offers agrivoltaics in turn 1; a park with dense panels gets guidance, then thins out.
  if (failures === beforeSave) {
    session.start('1016');
    let g = session.game;
    const map = 'd'.repeat(16) + '.'.repeat(E.MAP_SIDE * E.MAP_SIDE - 16);
    const started = session.act('start', g.sites.findIndex(s => s.type === 'agri'), { map, mgmt: 'none', cheap: false });
    const id = started.ok ? started.p.id : 0;
    session.act('engage', id, 'genuine');
    session.act('submit', id);
    while (!session.game.over && !E.thinPreview(session.game, session.game.projects[0])) {
      g = session.game;
      if (g.projects[0].status === 'permitting') session.act('engage', id, 'visit');
      session.act('endTurn');
    }
    if (session.game.over || !session.act('thin', id).ok) fail('the thinning test game never reached guidance, or thinning failed');
    else {
      savedThins++;
      const before = JSON.stringify(session.game);
      session.end(false);
      if (!session.resume() || JSON.stringify(session.game) !== before) fail('a game with a thinning was not continued identically');
    }
    session.end(true);
  }
  // A save made with other rules must not be continued.
  session.start('2417');
  session.act('endTurn');
  const saved = JSON.parse(storage['sc-save']);
  storage['sc-save'] = JSON.stringify({ ...saved, rules: 'other' });
  if (session.resume()) fail('a save made with other rules was continued');
  if (!session.hasOutdated()) fail('a save made with other rules was not reported as outdated');
  session.end(true);
  if (session.hasSaved()) fail('the save was not deleted');
  // Scenario codes: four digits from 1000 to 9999 (full-width digits are accepted too)
  const codes = { '2417': 2417, ' 1000 ': 1000, '9999': 9999, '２４１７': 2417, '999': null, '0999': null, '12345': null, 'abcd': null, '': null };
  for (const [text, want] of Object.entries(codes)) {
    if (session.readCode(text) !== want) fail(`scenario code "${text}" read as ${session.readCode(text)}, expected ${want}`);
  }
  session.start('2417');
  if (session.code !== 2417 || session.game.seed !== 2417) fail('a game started with code 2417 has another code');
  session.end(true);
  session.start();
  if (!(session.code >= 1000 && session.code <= 9999)) fail(`a random game got the code ${session.code}`);
  session.end(true);
} catch (e) {
  fail('the save check stopped with an error: ' + e.message);
}
if (failures === beforeSave) console.log(`  ✓ games were continued from their save ${resumes} times, always identical (${savedThins} thinnings saved)`);
if (!savedThins) fail("the save check never saved a thinning");

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
// How to play: every section needs a title and a text; the tile legend uses the tile names
const helpCode = read('js/help.js');
const listIn = name => [...((helpCode.match(new RegExp(`const ${name} = \\[([^\\]]*)\\]`)) || [])[1] || '').matchAll(/'(\w+)'/g)].map(m => m[1]);
listIn('SECTIONS').forEach(id => { used.add(`help.${id}.title`); used.add(`help.${id}.text`); });
listIn('TILES').forEach(k => used.add('tile.' + k));
if (listIn('SECTIONS').length !== 6) fail(`expected 6 sections in "How to play" (js/help.js), found ${listIn('SECTIONS').length}`);
for (const k of used) if (!(k in en)) fail(`text code "${k}" is used in the code but missing in the language files`);
if (failures === before) console.log(`  ✓ ${Object.keys(en).length} texts in both languages, ${used.size} codes used in the code all exist`);

// ---------- 6. Font check ----------
// The game brings its own small font files with only the characters it uses (tools/make-fonts.js).
// A missing character would appear in a different font, so new text may need new font files.
console.log('Font check');
const beforeFonts = failures;
const { usedCharacters } = require('../tools/make-fonts.js');
const gameCharacters = usedCharacters();
const inFonts = new Set(JSON.parse(read('fonts/characters.json')).characters);
const missingCharacters = gameCharacters.filter(ch => !inFonts.has(ch));
if (missingCharacters.length) {
  fail(`${missingCharacters.length} character(s) not in the fonts yet: ${missingCharacters.join(' ')}  (run: node tools/make-fonts.js)`);
}
const fontFiles = [...read('fonts/fonts.css').matchAll(/url\("([^"]+)"\)/g)].map(m => m[1]);
for (const name of fontFiles) {
  if (!fs.existsSync(path.join(ROOT, 'fonts', name))) fail(`fonts/fonts.css names fonts/${name}, which does not exist`);
}
if (failures === beforeFonts) console.log(`  ✓ all ${gameCharacters.length} characters used in the game are in the ${fontFiles.length} font files`);

// ---------- 7. Offline check ----------
// The offline helper (sw.js) copies the files on its list. A file the game loads but the list
// forgets would be missing offline. (The font files are read from fonts/fonts.css by the helper.)
console.log('Offline check');
const beforeOffline = failures;
const swList = (read('sw.js').match(/const FILES = \[([\s\S]*?)\];/) || [])[1];
if (!swList) fail('could not find the list of files (const FILES = [...]) in sw.js');
const offlineFiles = new Set([...(swList || '').matchAll(/'([^']+)'/g)].map(m => m[1] === './' ? 'index.html' : m[1]));
for (const f of offlineFiles) if (!fs.existsSync(path.join(ROOT, f))) fail(`sw.js lists ${f}, which does not exist`);
// Files the page loads: links and scripts in index.html, and the icons in the app description
const html = read('index.html');
const pageFiles = [...html.matchAll(/(?:href|src)="([^"#:]+)"/g)].map(m => m[1].split('?')[0]);
const manifest = JSON.parse(read('manifest.webmanifest'));
manifest.icons.forEach(icon => pageFiles.push(icon.src));
for (const f of new Set(pageFiles)) {
  if (!fs.existsSync(path.join(ROOT, f))) fail(`index.html or the manifest uses ${f}, which does not exist`);
  else if (!offlineFiles.has(f)) fail(`${f} is used by the game but missing from the list in sw.js (it would be missing offline)`);
}
if (!html.includes('js/offline.js')) fail('index.html does not load js/offline.js, so the offline helper never starts');
// One version number everywhere
const versions = new Set([...html.matchAll(/\?v=([\w.-]+)"/g), ...read('prototype/simulator.html').matchAll(/\?v=([\w.-]+)"/g)].map(m => m[1]));
if (versions.size !== 1) fail(`the ?v= version numbers differ: ${[...versions].join(', ')} (use one version everywhere)`);
if (failures === beforeOffline) {
  console.log(`  ✓ the offline helper lists all ${new Set(pageFiles).size} files the game loads (version ${[...versions][0]})`);
}

// ---------- 8. Scenario check ----------
// Two test players play the same scenario code with different decisions. Turn by turn, they must
// be offered the same sites (as long as both have the same 条例 status, which bans forest sites)
// and get the same event. Which project a grid delay hits may differ; its length may not.
console.log('Scenario check');
const beforeScenario = failures;
const EVENT_KIND = {
  'log.typhoon': 'typhoon', 'log.heavyRain': 'rain', 'log.gridDelay': 'grid', 'log.gridDelayNone': 'grid',
  'log.curtailment': 'curtailment', 'log.policyChange': 'policy', 'log.rival': 'rival', 'log.media': 'media',
  'log.rareFound': 'rare', 'log.rareNone': 'rare'
};
function playScenario(code, r) {
  const g = E.newGame(E.defaultParams(), code);
  const n = k => Math.floor(r() * k);
  const turns = [];
  while (!g.over) {
    const t = g.turn;
    turns[t] = { sites: JSON.stringify(g.sites), ordinance: g.ordinance };
    if (g.sites.length && r() < 0.6) {
      E.startProject(g, n(g.sites.length), { map: randomMap(r), mgmt: 'none', cheap: r() < 0.5 });
    }
    for (const p of g.projects) {
      if (p.status === 'design' && r() < 0.6) E.submit(g, p);
      else if (p.status === 'operating' && r() < 0.05) E.sell(g, p);
    }
    E.endTurn(g);
    const ev = g.log.filter(l => l.turn === t && EVENT_KIND[l.msg.key]).map(l => {
      const v = l.msg.vars || {};
      return EVENT_KIND[l.msg.key] + (v.factor ? ' ' + v.factor : '') + (l.msg.key === 'log.gridDelay' ? ' ' + v.turns : '');
    });
    turns[t].event = ev.join(',') || 'none';
  }
  return turns;
}
let scenarioTurns = 0, ordinanceDiffers = 0;
for (let i = 0; i < 200 && failures === beforeScenario; i++) {
  const code = 1000 + i * 37;
  const a = playScenario(code, E.rng(code + 11)), b = playScenario(code, E.rng(code + 12));
  for (let t = 1; t < Math.min(a.length, b.length); t++) {
    scenarioTurns++;
    const ga = a[t].event.replace(/^grid \d$/, 'grid'), gb = b[t].event.replace(/^grid \d$/, 'grid');
    const lengthA = (a[t].event.match(/^grid (\d)$/) || [])[1], lengthB = (b[t].event.match(/^grid (\d)$/) || [])[1];
    if (ga !== gb || (lengthA && lengthB && lengthA !== lengthB)) {
      fail(`code ${code}, turn ${t}: the players got different events (${a[t].event} / ${b[t].event})`); break;
    }
    if (a[t].ordinance !== b[t].ordinance) { ordinanceDiffers++; continue; }
    if (a[t].sites !== b[t].sites) { fail(`code ${code}, turn ${t}: the players were offered different sites`); break; }
  }
}
// The scenario codes recommended in docs/workshop-guide.md must still play as the guide describes
const GUIDE_CODES = {
  1052: ['reservoir*, forest, brownfield', '5 policy, 7 grid, 9 grid, 11 rain, 14 rival, 18 typhoon'],
  7870: ['agri*, reservoir, brownfield', '2 curtailment, 10 rival, 11 typhoon, 14 policy, 17 grid, 19 rival'],
  1016: ['brownfield, agri*, farmland', '3 curtailment, 7 grid']
};
for (const [code, [sites, events]] of Object.entries(GUIDE_CODES)) {
  const g = E.newGame(E.defaultParams(), Number(code));
  const first = g.sites.map(s => s.type + (s.promo ? '*' : '')).join(', ');
  const seen = [];
  while (!g.over) {
    const t = g.turn;
    E.endTurn(g);
    g.log.filter(l => l.turn === t && EVENT_KIND[l.msg.key] && EVENT_KIND[l.msg.key] !== 'rare').forEach(l => seen.push(`${t} ${EVENT_KIND[l.msg.key]}`));
  }
  if (first !== sites || seen.join(', ') !== events) {
    fail(`scenario ${code} no longer plays as described in docs/workshop-guide.md (now: ${first} | ${seen.join(', ')}): update the guide`);
  }
}
if (failures === beforeScenario) {
  console.log(`  ✓ 200 scenario codes: same sites and events for both players in all ${scenarioTurns} turns` +
    ` (sites not compared in ${ordinanceDiffers} turns where only one player had a 条例)`);
  console.log(`  ✓ the ${Object.keys(GUIDE_CODES).length} scenario codes in docs/workshop-guide.md play as the guide describes`);
}

// ---------- 9. Contrast check ----------
// Reads the colour tokens (--ink, --paper, ...) of light and dark mode from css/style.css and
// computes the contrast ratio of each pair that is used together on screen.
console.log('Contrast check');
const beforeContrast = failures;
const css = read('css/style.css');
const tokensIn = block => Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})/g)].map(m => [m[1], m[2]]));
const light = tokensIn((css.match(/:root \{([\s\S]*?)\}/) || [])[1] || '');
const dark = { ...light, ...tokensIn((css.match(/:root\[data-theme="dark"\] \{([\s\S]*?)\}/) || [])[1] || '') };
const luminance = hex => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
// [foreground, background, minimum, what it is]
const PAIRS = [
  ...['ink', 'muted', 'good', 'bad', 'warn', 'info', 'accent'].flatMap(fg =>
    ['paper', 'surface'].map(bg => [fg, bg, 4.5, 'text'])),
  ['on-accent', 'accent', 4.5, 'text on the main buttons'],
  ['paper', 'ink', 4.5, 'text on dark highlights (language switch, messages)'],
  ['pollen', 'paper', 3, 'keyboard focus ring'],
  ['pollen', 'surface', 3, 'keyboard focus ring'],
  ['muted', 'surface', 3, 'border of input fields']
];
let contrastPairs = 0;
for (const [mode, tokens] of [['light', light], ['dark', dark]]) {
  for (const [fg, bg, min, what] of PAIRS) {
    if (!tokens[fg] || !tokens[bg]) { fail(`${mode} mode: colour --${fg} or --${bg} not found in css/style.css`); continue; }
    const r = ratio(tokens[fg], tokens[bg]);
    contrastPairs++;
    if (r < min) fail(`${mode} mode: --${fg} on --${bg} (${what}) has a contrast of ${r.toFixed(2)} : 1, needs ${min} : 1`);
  }
}
if (failures === beforeContrast) console.log(`  ✓ ${contrastPairs} colour pairs in light and dark mode have enough contrast`);

console.log(failures ? `\n${failures} problem(s) found.` : '\nAll checks passed.');
process.exit(failures ? 1 : 0);
