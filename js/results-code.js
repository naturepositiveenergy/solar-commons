// Solar Commons: the results code, for the facilitator's results board (added in Milestone 9).
//
// "Copy results" on the end screen adds one short line to the copied text: the results code.
// It is the same in every language, so the results board (results.html) can read the results
// of every group, whether they played in Japanese or English. Example:
//
//   SC1|1052|v1.0|A|11.5|22.4|63.0|68,61|1,0|0,1|-|2.0.0,1.2.0,...
//
// The parts, separated by |:
//   SC1          format of the code (change it if the parts change)
//   1052         scenario code
//   v1.0         rules version
//   A            grade
//   11.5         average park score (0 to 14)
//   22.4         capacity built
//   63.0         money at the end
//   68,61        trust: home town, neighbouring town (only once it has joined)
//   1,0          regional warnings per town
//   0,1          条例 per town (1 = passed)
//   -            game lost? '-' = no, otherwise 'bankrupt' or 'trust'
//   2.0.0,...    for each of the seven score categories: how many parks got ○.△.×
//
// Used by: index.html (end screen) and results.html (results board). Also loaded by the checks.

(function (root) {
'use strict';

const FORMAT = 'SC1';
// The score categories, in the order of the end screen (design document section 10)
const CATEGORIES = ['site', 'natAct', 'natRes', 'safety', 'community', 'benefit', 'longterm'];
const GRADES = ['S', 'A', 'B', 'C', 'D'];
// Where a results code is in a pasted text (it stops at spaces and punctuation such as 。)
const PATTERN = /SC1\|[0-9A-Za-z.,|-]+/g;

const one = n => (Math.round(n * 10) / 10).toFixed(1);

// The results code of a finished game.
function encode(g) {
  const E = root.SolarEngine, s = E.scoreGame(g);
  const counts = CATEGORIES.map(k => [2, 1, 0].map(mark => s.parks.filter(x => x.s[k] === mark).length).join('.'));
  return [
    FORMAT, g.seed, E.RULES_VERSION, s.grade, one(s.avg), one(s.capBuilt), one(g.money),
    g.towns.map(town => Math.round(town.T)).join(','),
    g.towns.map(town => town.strikes).join(','),
    g.towns.map(town => (town.ordinance ? 1 : 0)).join(','),
    g.lost || '-',
    counts.join(',')
  ].join('|');
}

// One results code read back: { code, rules, grade, avg, cap, money, trust, warnings, ordinance,
// lost, parks, categories: { site: [○, △, ×], ... } }, or null if it is not a valid code.
function decode(text) {
  const f = String(text).split('|');
  if (f.length !== 12 || f[0] !== FORMAT) return null;
  const list = part => part.split(',').map(Number);
  const r = {
    code: Number(f[1]), rules: f[2], grade: f[3], avg: Number(f[4]), cap: Number(f[5]), money: Number(f[6]),
    trust: list(f[7]), warnings: list(f[8]), ordinance: list(f[9]).map(n => n === 1),
    lost: f[10] === '-' ? null : f[10], categories: {}
  };
  const cats = f[11].split(',');
  if (cats.length !== CATEGORIES.length) return null;
  CATEGORIES.forEach((k, i) => { r.categories[k] = cats[i].split('.').map(Number); });
  r.parks = r.categories.site.reduce((a, b) => a + b, 0);
  // everything must be a number where a number belongs, and the parts must fit together
  const numbers = [r.code, r.avg, r.cap, r.money, ...r.trust, ...r.warnings, ...list(f[9]),
    ...Object.values(r.categories).flat()];
  const towns = r.trust.length;
  if (!GRADES.includes(r.grade) || !/^v[\d.]+$/.test(r.rules) || numbers.some(n => !Number.isFinite(n)) ||
      towns < 1 || towns > 2 || r.warnings.length !== towns || r.ordinance.length !== towns ||
      Object.values(r.categories).some(c => c.length !== 3 || c.reduce((a, b) => a + b, 0) !== r.parks) ||
      ![null, 'bankrupt', 'trust'].includes(r.lost)) return null;
  return r;
}

// All results codes in a pasted text, in order: [{ text, result }] (result is null for a damaged code).
function findAll(text) {
  return (String(text).match(PATTERN) || []).map(code => ({ text: code, result: decode(code) }));
}

const api = { FORMAT, CATEGORIES, encode, decode, findAll };
root.SolarResults = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;   // for test scripts run with Node
})(globalThis);
