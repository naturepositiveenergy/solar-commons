// Solar Commons: game rules engine (design document v1.1)
//
// This file is the referee of the game. It knows every rule and number,
// but it never draws anything on screen and contains no texts. Messages for
// the player are sent out as codes, for example { key: 'log.sold', vars: { id: 2, price: 45 } },
// and translated by js/i18n.js with the language files in lang/.
//
// Used by: index.html (the game) and prototype/simulator.html (balancing tool).
// Everything is available under the name SolarEngine, for example SolarEngine.newGame(...).

(function (root) {
'use strict';

// ===== Numbers (design document v1.1) =====
// All rule numbers in one place. The simulator can override them for testing.
const DEFAULT_PARAMS = {
  // Game
  turns: 20,               // turns per scenario (1 turn = 1 quarter)
  startFY: 2026,           // fiscal year of turn 1 (turn 1 = April to June); only for showing dates
  startMoney: 100,
  apPerTurn: 3,            // action points per turn
  startTrust: 50,
  startRep: 30,
  maxTiles: 100,           // tiles per site (10 × 10 map)
  capTarget: 15,           // built capacity needed for a grade above D
  eventChance: 0.25,       // chance of an event each turn
  neighbourTurn: 9,        // the neighbouring town joins in this turn (added in v1.0)
  neighbourSites: 2,       // sites it offers each turn, in addition to the home town's 3

  // Tiles and management (design document section 5)
  denseCost: 3, denseCap: 1.0,
  wideCost: 3, wideCap: 0.7, wideB: 1,
  meadowCost: 1, meadowB: 2,
  hedgeCost: 1, hedgeB: 3,
  pondCost: 2, pondB: 4,
  corridorCost: 1, corridorB: 2,
  diversityBonus: 5,       // biodiversity bonus per extra measure type
  mowingB: 5, mowingCost: 0.5,
  grazingB: 8, grazingCost: 1,

  // Sites (section 4)
  permit_farmland: 3, permit_agri: 4, permit_forest: 5, permit_brownfield: 2, permit_reservoir: 4,
  risk_farmland: 1.0, risk_agri: 0.8, risk_forest: 1.6, risk_brownfield: 0.6, risk_reservoir: 0.9,
  farmlandExtra: 1,        // 農地転用 extra permit turns
  forestExtra: 2,          // 林地開発許可 extra permit turns
  forestBMod: -30,         // biodiversity start modifier on forest sites
  drainageCost: 0.2,       // forest drainage: +20% cost
  promoChance: 0.2,        // chance a site lies in a promotion zone
  promoTurns: 1, promoRisk: 0.7, promoA: 10,
  // Agrivoltaics: the yearly farming report (section 6, added in v0.9)
  farmingFailLimit: 2,     // poor yearly reports in a row until the permit is revoked and the park removed
  thinCost: 1,             // cost per dense panel changed to a wide-spaced one when thinning out
  removalShare: 0.1,       // removal cost of a park whose permit is revoked, share of its build cost
  removalTrust: 8,         // trust lost when a park must be removed

  // Community (section 5)
  genuineGain: 10, visitGain: 20, tourGain: 15,
  fundGain: 15, fundShare: 0.2,     // citizen fund, at most: support gain, and share of the build cost locals pay
  // Citizen funds (section 5, changed in v1.1): how much locals invest depends on the project's acceptance
  // and on the developer's reputation; the subscription closes at the end of the turn.
  fundReturn: 1.25,        // investors receive this times their share of the revenue (20% of the cost: 25% of the income)
  fundMin: 0.05,           // a fund that would raise less than this share of the cost fails
  fundAFloor: 30, fundARange: 30,   // acceptance: nobody invests at 30 or below, everyone from 60
  fundRFloor: 10, fundRRange: 20,   // reputation: nobody invests at 10 or below, everyone from 30
  benefitGain: 10, benefitCost: 1,
  silenceDrift: 3,         // support lost per turn of silence during permitting
  matchBonus: 15,          // design matching bonus
  agriFarmerBonus: 20, forestPenalty: 20,

  // Permitting (section 8)
  objBase: 0.25,           // objection base probability
  objDelay: 1, objSPenalty: 5,
  maxObjections: 3,        // objections until cancellation
  cancelA: 20,             // cancellation if acceptance falls below
  cancelTrust: 8,          // trust lost on cancellation
  permitAThreshold: 60, permitAStep: 15,
  earlyBonus: 1,           // permit turns saved by a genuine 説明会 before submission
  planningShare: 0.1,      // planning cost share, lost on cancellation

  // Operation (sections 6 to 8)
  buildTurns: 2,
  revMult: 0.6,            // revenue per capacity unit per turn
  fipThreshold: 30, fipMin: 0.8, fipMax: 1.2,
  supportEndTurn: 5,       // projects submitted from this turn (fiscal year 2027) get no FIT/FIP (added in v0.8)
  marketMin: 0.5, marketMax: 1.1,   // their revenue factor per turn: market prices, lower and varying
  decomShare: 0.05,        // decommissioning reserve
  bGrowth: 0.2,            // biodiversity growth per turn (share of the remaining gap)
  cheapDiscount: 0.3, cheapDamageMult: 2,
  sellMult: 1.5, sellTrustPenalty: 5,

  // Trust and the 条例 (section 7)
  strikeLimit: 2,          // strikes until a 条例 is enacted
  warningSpread: 5,        // trust lost in the other town for each regional warning (word travels, added in v1.0)
  repWarning: 5,           // reputation lost for each regional warning caused by your projects (added in v1.1)
  repSell: 10,             // reputation lost for each park you sell (added in v1.1)
  trustOrdinance: 30,      // 条例 also if trust falls below
  ordinanceTurns: 2, ordinanceA: 60,
  rivalTrust: 5,
  loseTrust: 5,            // game lost if trust falls below

  // Events (section 9)
  typhoonDamage: 5, hedgesProtect: 3,
  landslideDamage: 15, landslideTrust: 5,
  curtail: 0.7, policyLow: 0.8, policyHigh: 1.2,
  mediaShift: 10, rareB: 60, rareR: 10,

  // Scoring (section 10)
  gradeS: 13, gradeA: 10, gradeB: 7, gradeC: 4
};

function defaultParams() { return { ...DEFAULT_PARAMS }; }

// ===== Fixed lists (their names are in the language files) =====
const SITE_TYPES = ['farmland', 'agri', 'forest', 'brownfield', 'reservoir'];
const RESIDENTS = ['farmer', 'elderly', 'family', 'nature', 'jichikai'];   // same order as the support values S
const TILE_KEYS = ['dense', 'wide', 'meadow', 'hedge', 'pond', 'corridor'];
const ACTIONS = {   // engagement actions and their cost in action points
  genuine: { ap: 1 },
  visit: { ap: 1 },
  tour: { ap: 1 },
  fund: { ap: 2 },
  benefit: { ap: 1 }
};
// Project stages, in order. 'removed' = an agrivoltaics park whose permit was revoked (added in v0.9).
// 'dropped' = given up before submission (no penalty).
const STATUSES = ['design', 'permitting', 'approved', 'building', 'operating', 'sold', 'removed', 'cancelled', 'dropped'];
// Management options for a park (section 5)
const MANAGEMENT = ['none', 'mowing', 'grazing'];
// Version of the rules. Change it together with docs/design.md: saved games made
// with other rules are not continued, because they would play differently.
const RULES_VERSION = 'v1.1';

// ===== Helpers =====
// Random numbers from a seed: the same seed always gives the same numbers.
function rng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Mixes numbers into one new starting number, so that every stream below gets its own numbers.
function mix(...nums) {
  let h = 0x811C9DC5;
  for (const n of nums) {
    h = Math.imul(h ^ (n >>> 0), 0x01000193);
    h ^= h >>> 15; h = Math.imul(h, 0x2C1B3C6D); h ^= h >>> 12; h = Math.imul(h, 0x297A2D39); h ^= h >>> 15;
  }
  return h >>> 0;
}
// Scenario codes (design document section 2): the game's seed is its scenario code.
// The random numbers come from separate streams, so that everyone who plays the same
// code gets the same sites and the same events in the same turns, whatever they decide:
// - sites of turn t:  only from the seed and t (one stream per town)
// - event of turn t:  only from the seed and t
// - luck:             objections and market prices (FIP and market sales), which depend on the player's own projects
const STREAM_SITES = 1, STREAM_EVENTS = 2, STREAM_LUCK = 3, STREAM_NEIGHBOUR_SITES = 4;
const turnRandom = (g, stream) => rng(mix(g.seed, stream, g.turn));

// A message for the player: a text code plus the values to fill in.
function msg(key, vars) { return vars ? { key, vars } : { key }; }
function log(g, key, vars) { g.log.push({ turn: g.turn, msg: msg(key, vars) }); }

// ===== The site map (section 5, added in v0.6) =====
// A design can carry a map of the site: MAP_SIDE × MAP_SIDE tiles, stored as a text with
// one letter per tile, row by row ('.' = empty). With a map, the tile counts come from the
// map and placement matters. Without a map (as in the simulator), the tile counts are used
// and placement is assumed to be good, exactly as before v0.6.
const MAP_SIDE = 10;
const TILE_LETTERS = { dense: 'd', wide: 'w', meadow: 'm', hedge: 'h', pond: 'p', corridor: 'c' };
const LETTER_TILE = Object.fromEntries(Object.entries(TILE_LETTERS).map(([k, v]) => [v, k]));
const HABITAT = ['m', 'h', 'p'];   // meadow, hedge and pond: what a corridor has to connect to

// Tile counts of a map, for example { dense: 12, wide: 0, meadow: 6, ... }
function countsFromMap(map) {
  const counts = {};
  TILE_KEYS.forEach(k => { counts[k] = 0; });
  for (const letter of map) if (LETTER_TILE[letter]) counts[LETTER_TILE[letter]]++;
  return counts;
}

// A copy of a design, with its tile counts taken from its map if it has one.
function normalizeDesign(design) {
  return design.map ? { ...design, ...countsFromMap(design.map) } : { ...design };
}

// Placement on the map (tiles touch side by side, not diagonally):
// - edgeHedges: hedge tiles on the outer ring of the site; only these shelter and screen the park
// - linkedCorridors: corridor tiles in groups that touch both the edge and a meadow, hedge or pond
// - looseCorridors and looseCells: the other corridor tiles, and where they are
function mapPlacement(map) {
  const N = MAP_SIDE;
  const at = i => map[i] || '.';
  const onEdge = i => { const r = Math.floor(i / N), c = i % N; return r === 0 || c === 0 || r === N - 1 || c === N - 1; };
  const neighbours = i => {
    const r = Math.floor(i / N), c = i % N, out = [];
    if (r > 0) out.push(i - N);
    if (r < N - 1) out.push(i + N);
    if (c > 0) out.push(i - 1);
    if (c < N - 1) out.push(i + 1);
    return out;
  };
  let edgeHedges = 0, linkedCorridors = 0;
  const looseCells = [], seen = new Array(N * N).fill(false);
  for (let i = 0; i < N * N; i++) {
    if (at(i) === 'h' && onEdge(i)) edgeHedges++;
    if (at(i) !== 'c' || seen[i]) continue;
    // collect one group of corridor tiles that touch each other
    const group = [i];
    let edge = false, habitat = false;
    seen[i] = true;
    for (let k = 0; k < group.length; k++) {
      if (onEdge(group[k])) edge = true;
      for (const nb of neighbours(group[k])) {
        if (at(nb) === 'c' && !seen[nb]) { seen[nb] = true; group.push(nb); }
        if (HABITAT.includes(at(nb))) habitat = true;
      }
    }
    if (edge && habitat) linkedCorridors += group.length;
    else looseCells.push(...group);
  }
  return { edgeHedges, linkedCorridors, looseCorridors: looseCells.length, looseCells };
}

// Hedges that shelter and screen the park, and corridor tiles that count (section 5).
// Without a map all of them count, as before v0.6.
const screenHedges = (d, calc) => (calc.screenHedges !== undefined ? calc.screenHedges : (d.hedge || 0));
const linkedCorridors = (d, calc) => (calc.linkedCorridors !== undefined ? calc.linkedCorridors : (d.corridor || 0));

// ===== Design =====
function calcDesign(design, site, P) {
  const d = design.map ? normalizeDesign(design) : design;
  const place = d.map ? mapPlacement(d.map) : null;
  const n = k => d[k] || 0;
  const corridors = place ? place.linkedCorridors : n('corridor');   // only connected corridor tiles count
  const cap = n('dense') * P.denseCap + n('wide') * P.wideCap;
  let cost = n('dense') * P.denseCost + n('wide') * P.wideCost + n('meadow') * P.meadowCost +
    n('hedge') * P.hedgeCost + n('pond') * P.pondCost + n('corridor') * P.corridorCost;   // every tile costs
  if (site === 'forest') cost *= (1 + P.drainageCost);
  if (d.cheap) cost *= (1 - P.cheapDiscount);
  let pts = n('wide') * P.wideB + n('meadow') * P.meadowB + n('hedge') * P.hedgeB +
    n('pond') * P.pondB + corridors * P.corridorB;
  let types = ['wide', 'meadow', 'hedge', 'pond'].filter(k => n(k) > 0).length + (corridors > 0 ? 1 : 0);
  if (d.mgmt === 'mowing') { pts += P.mowingB; types++; }
  if (d.mgmt === 'grazing') { pts += P.grazingB; types++; }
  const mod = site === 'forest' ? P.forestBMod : 0;
  const bTarget = Math.min(100, pts + P.diversityBonus * Math.max(0, types - 1)) + mod;
  const tiles = TILE_KEYS.reduce((s, k) => s + n(k), 0);
  const mgmtCost = d.mgmt === 'mowing' ? P.mowingCost : d.mgmt === 'grazing' ? P.grazingCost : 0;
  const calc = { cap, cost, bTarget, types, tiles, mgmtCost, mod };
  if (place) { calc.screenHedges = place.edgeHedges; calc.linkedCorridors = place.linkedCorridors; }
  return calc;
}

// ===== Towns (section 2, added in v1.0) =====
// g.towns[HOME] is the player's home town. The neighbouring town, g.towns[NEIGHBOUR], joins in turn
// neighbourTurn; its trust starts at the home town's trust at that moment. Each town has its own
// trust T, regional warnings (strikes) and 条例. Projects and sites belong to one town (p.town, site.town).
const HOME = 0, NEIGHBOUR = 1;
const newTown = T => ({ T, strikes: 0, ordinance: false });
// The neighbouring town offers sites once it has joined, as long as its trust is not below loseTrust.
const neighbourOpen = g => g.towns.length > NEIGHBOUR && g.towns[NEIGHBOUR].T >= g.P.loseTrust;

// ===== Game state =====
function newGame(P, seed) {
  const g = {
    P, seed, luck: rng(mix(seed, STREAM_LUCK)), turn: 1, money: P.startMoney, ap: P.apPerTurn, R: P.startRep,
    towns: [newTown(P.startTrust)], revFactor: 1, curtail: 1, projects: [], log: [], hist: [],
    negTurns: 0, over: false, lost: null, nextId: 1, cancellations: 0, objectionsTotal: 0
  };
  genSites(g);
  g.hist.push({ money: g.money, T: g.towns[HOME].T });
  return g;
}

// The sites of this turn: three in the home town, and neighbourSites in the neighbouring town.
function genSites(g) {
  g.sites = drawSites(g, HOME, 3, STREAM_SITES);
  if (neighbourOpen(g)) g.sites.push(...drawSites(g, NEIGHBOUR, g.P.neighbourSites, STREAM_NEIGHBOUR_SITES));
}
// Different site types for one town. One more is drawn than offered: it replaces a forest site
// when the town's 条例 bans forest sites, so the other offers stay the same as without the 条例.
function drawSites(g, town, count, stream) {
  const r = turnRandom(g, stream);
  const avail = SITE_TYPES.slice();
  const drawn = [];
  for (let i = 0; i <= count; i++) {
    const type = avail.splice(Math.floor(r() * avail.length), 1)[0];
    drawn.push({ type, promo: r() < g.P.promoChance, town });
  }
  const offers = drawn.slice(0, count);
  const forest = offers.findIndex(s => s.type === 'forest');
  if (g.towns[town].ordinance && forest >= 0) offers[forest] = drawn[count];
  return offers;
}

// ===== Residents and acceptance =====
// Design matching (section 5): which residents' wishes the project meets, one entry per resident
// in the order of RESIDENTS. Also works for a planned design: { site, design, calc }.
function wishesMet(p) {
  const d = p.design;
  return [
    p.site === 'agri' || (p.site === 'farmland' && (d.wide || 0) >= (d.dense || 0) && (d.wide || 0) > 0),
    !d.cheap && screenHedges(d, p.calc) >= 3 && p.site !== 'forest',
    p.fund || p.benefit,
    p.calc.bTarget >= 40,
    p.genuineBefore
  ];
}
// Effective support of each resident, including design matching bonuses.
function effS(p, P) {
  const m = wishesMet(p);
  return p.S.map((s, i) => clamp(s + (m[i] ? P.matchBonus : 0), -100, 100));
}
function matches(p, P) { return effS(p, P).map((v, i) => v !== clamp(p.S[i], -100, 100)); }
function acceptance(p, P) {
  const e = effS(p, P);
  return clamp(50 + (e.reduce((a, b) => a + b, 0) / e.length) / 2, 0, 100);
}
const shifted = (S, v) => S.map(s => clamp(s + v, -100, 100));
function shiftAll(p, v) { p.S = shifted(p.S, v); }

// ===== Player actions =====
// What is wrong with a design, or null if it can be built.
function designProblem(calc, P) {
  if (calc.tiles > P.maxTiles) return msg('err.tooManyTiles', { tiles: calc.tiles, max: P.maxTiles });
  if (calc.cap <= 0) return msg('err.noPanels');
  return null;
}

function startProject(g, siteIdx, design) {
  const P = g.P;
  const site = g.sites[siteIdx];
  if (!site) return { ok: false, msg: msg('err.noSite') };
  const calc = calcDesign(design, site.type, P);
  const problem = designProblem(calc, P);
  if (problem) return { ok: false, msg: problem };
  const base = (g.towns[site.town].T - 50) * 2;   // residents start from their town's trust in you
  const S = [base, base, base, base, base];
  if (site.type === 'agri') S[0] += P.agriFarmerBonus;
  if (site.type === 'forest') { S[1] -= P.forestPenalty; S[3] -= P.forestPenalty; }
  const p = {
    id: g.nextId++, site: site.type, town: site.town, promo: site.promo, promoActive: false, design: normalizeDesign(design), calc,
    S: S.map(s => clamp(s, -100, 100)), status: 'design', genuineBefore: false, genuineAny: false,
    fund: false, fundOpen: false, fundShare: 0, benefit: false, objections: 0, engaged: false, damaged: false, struck: false,
    support: null, farmingFails: 0, lastReport: null, permitLeft: 0, buildLeft: 0, planningPaid: 0, B: calc.mod, finalA: null, sellTimer: 0, waitLogged: false
  };
  g.projects.push(p);
  g.sites.splice(siteIdx, 1);
  log(g, p.promo ? 'log.projectStartedPromo' : 'log.projectStarted',
    { id: p.id, site: siteName(p), cap: p.calc.cap, cost: p.calc.cost });
  return { ok: true, p };
}

// The site type for messages, with "in the neighbouring town" for projects there.
const siteName = p => (p.town === NEIGHBOUR ? msg('town.siteIn', { site: msg('site.' + p.site) }) : msg('site.' + p.site));

// Change the design of a project that has not been submitted yet (section 5, added in v0.5).
function changeDesign(g, p, design) {
  if (p.status !== 'design') return { ok: false, msg: msg('err.designLocked') };
  const calc = calcDesign(design, p.site, g.P);
  const problem = designProblem(calc, g.P);
  if (problem) return { ok: false, msg: problem };
  p.design = normalizeDesign(design); p.calc = calc;
  log(g, 'log.designChanged', { id: p.id, cap: calc.cap, cost: calc.cost });
  return { ok: true };
}

// Drop a project that has not been submitted yet (section 5, added in v0.5): no penalty,
// but the site and any action points already spent are lost, and a benefit agreement ends.
function dropProject(g, p) {
  if (p.status !== 'design') return { ok: false, msg: msg('err.dropLocked') };
  p.status = 'dropped';
  log(g, 'log.dropped', { id: p.id });
  return { ok: true };
}

// The resident an individual visit goes to: the least supportive one (section 5).
function visitTarget(p, P) { const e = effS(p, P); return e.indexOf(Math.min(...e)); }

// Can this engagement action be done now? { ok: true } or { ok: false, msg }.
function checkAction(g, p, a) {
  const A = ACTIONS[a];
  if (!['design', 'permitting', 'approved'].includes(p.status)) return { ok: false, msg: msg('err.engageStatus') };
  if (g.ap < A.ap) return { ok: false, msg: msg('err.needAP', { need: A.ap, left: g.ap }) };
  if (a === 'fund' && p.fund) return { ok: false, msg: msg('err.fundDone') };
  if (a === 'fund' && p.fundOpen) return { ok: false, msg: msg('err.fundOpen') };
  if (a === 'benefit' && p.benefit) return { ok: false, msg: msg('err.benefitDone') };
  return { ok: true };
}

function doAction(g, p, a) {
  const P = g.P, A = ACTIONS[a];
  const check = checkAction(g, p, a);
  if (!check.ok) return check;
  g.ap -= A.ap;
  p.engaged = true;
  if (a === 'genuine') { shiftAll(p, P.genuineGain); p.genuineAny = true; if (p.status === 'design') p.genuineBefore = true; }
  if (a === 'visit') { const i = visitTarget(p, P); p.S[i] = clamp(p.S[i] + P.visitGain, -100, 100); }
  if (a === 'tour') { p.S[1] = clamp(p.S[1] + P.tourGain, -100, 100); p.S[3] = clamp(p.S[3] + P.tourGain, -100, 100); }
  if (a === 'fund') p.fundOpen = true;   // the subscription closes at the end of the turn (closeFunds)
  if (a === 'benefit') { shiftAll(p, P.benefitGain); p.benefit = true; }
  return { ok: true };
}

// ===== Citizen funds (section 5, changed in v1.1) =====
// How many locals would invest now, from 0 (nobody) to 1 (everyone): it depends on the project's
// acceptance (do they trust the project?) and on your reputation (do they trust you?).
function fundUptake(g, p) {
  const P = g.P;
  const a = clamp((acceptance(p, P) - P.fundAFloor) / P.fundARange, 0, 1);
  const r = clamp((g.R - P.fundRFloor) / P.fundRRange, 0, 1);
  return a * r;
}
// What a citizen fund would raise if its subscription closed now: { share, ret, gain, ok }
// (share of the build cost locals pay, share of the income they receive, support gain, enough to succeed).
function fundPreview(g, p) {
  const P = g.P, u = fundUptake(g, p), share = P.fundShare * u;
  return { share, ret: share * P.fundReturn, gain: P.fundGain * u, ok: share >= P.fundMin };
}
// At the end of the turn, open subscriptions close: locals invest, or the fund fails (it can be tried again).
function closeFunds(g) {
  g.projects.filter(p => p.fundOpen).forEach(p => {
    p.fundOpen = false;
    if (!['design', 'permitting', 'approved'].includes(p.status)) return;   // the project ended this turn
    const f = fundPreview(g, p);
    if (!f.ok) { log(g, 'log.fundFailed', { id: p.id }); return; }
    p.fund = true; p.fundShare = f.share;
    shiftAll(p, f.gain);
    log(g, 'log.fundClosed', { id: p.id, share: f.share * 100, ret: f.ret * 100, gain: f.gain });
  });
}

// ===== Money =====
// The player's share of the build cost (a citizen fund pays part of it).
function playerCost(p, P) { return p.calc.cost * (p.fund ? 1 - p.fundShare : 1); }
// Planning cost, paid at submission and lost on cancellation (section 8).
function planningCost(p, P) { return playerCost(p, P) * P.planningShare; }
// Still to pay when construction starts.
function buildPayment(p, P) { return playerCost(p, P) - p.planningPaid; }
// Price when an operating park is sold (section 7).
function salePrice(p, P) { return p.calc.cost * P.sellMult; }
// Net revenue of a park for a given gross revenue (section 8).
function netRevenue(p, P, gross) {
  return gross - p.calc.mgmtCost - (p.fund ? gross * p.fundShare * P.fundReturn : 0) - gross * P.decomShare;
}
// Expected income per turn of a park without random effects (average price factor, no curtailment),
// after management, citizen fund share, decommissioning reserve and benefit agreement.
// Also works for a planned design: { calc, promo, fund, fundShare, benefit }.
function expectedIncome(g, p) {
  const P = g.P;
  const [lo, hi] = priceRange(P, supportScheme(g, p));
  const gross = p.calc.cap * P.revMult * g.revFactor * (lo + hi) / 2;
  return netRevenue(p, P, gross) - (p.benefit ? P.benefitCost : 0);
}

// ===== Support schemes (section 6, changed in v0.8) =====
// How a park sells its power: 'fit' (fixed price), 'fip' (price follows the market, with a premium)
// or 'market' (no FIT/FIP: lower, varying market prices). Fixed when the project is submitted:
// from turn supportEndTurn (fiscal year 2027), only projects with the promotion zone bonus keep FIT/FIP.
function schemeAt(g, p, promoActive) {
  const P = g.P;
  if (g.turn >= P.supportEndTurn && !promoActive) return 'market';
  return p.calc.cap >= P.fipThreshold ? 'fip' : 'fit';
}
// The scheme of a submitted project, or the one it would get if it were submitted now.
// Also works for a planned design: { calc, promo, fund, fundShare, benefit }.
function supportScheme(g, p) { return p.support || schemeAt(g, p, promoQualifies(p)); }
// Revenue factor range of a scheme: each turn, revenue is multiplied by a random factor in this range.
function priceRange(P, scheme) {
  return scheme === 'market' ? [P.marketMin, P.marketMax] : scheme === 'fip' ? [P.fipMin, P.fipMax] : [1, 1];
}
// ===== Agrivoltaics: the yearly farming report (section 6, added in v0.9) =====
// The crops under the panels get enough light if there are at least as many wide-spaced as dense panels.
// Also works for a design that is still being planned.
function cropLight(design) {
  const d = design.map ? normalizeDesign(design) : design;
  return (d.wide || 0) >= (d.dense || 0);
}

// At the end of each fiscal year, every operating agrivoltaics park reports its harvest.
// A poor harvest brings guidance; poor harvests in farmingFailLimit reports in a row revoke the
// permit: the park is removed (removal cost, trust lost, one strike).
function farmingReport(g, p) {
  const P = g.P;
  if (cropLight(p.design)) {
    p.farmingFails = 0; p.lastReport = 'ok';
    log(g, 'log.farmingOk', { id: p.id });
    return;
  }
  p.farmingFails++; p.lastReport = 'low';
  if (p.farmingFails < P.farmingFailLimit) { log(g, 'log.farmingGuidance', { id: p.id }); return; }
  const cost = p.calc.cost * P.removalShare;
  p.status = 'removed'; g.money -= cost; g.towns[p.town].T -= P.removalTrust;
  log(g, 'log.farmingRemoved', { id: p.id, cost, trust: P.removalTrust });
  strike(g, p.town, msg('strike.farmingRemoved', { id: p.id }));
}

// What thinning out the panels would mean: { tiles, cost, cap } (dense panels changed to wide-spaced
// ones, the cost, and the capacity afterwards), or null if it is not possible now. Possible for an
// operating agrivoltaics park after a poor harvest report, while its crops still get too little light.
function thinPreview(g, p) {
  if (p.status !== 'operating' || p.site !== 'agri' || !p.farmingFails || cropLight(p.design)) return null;
  const P = g.P, d = p.design;
  const tiles = Math.ceil(((d.dense || 0) - (d.wide || 0)) / 2);
  return { tiles, cost: tiles * P.thinCost, cap: p.calc.cap - tiles * (P.denseCap - P.wideCap) };
}

// Thin out the panels: change just enough dense panels to wide-spaced ones, spread over the map.
function thinPanels(g, p) {
  const pre = thinPreview(g, p);
  if (!pre) return { ok: false, msg: msg('err.thinStatus') };
  if (g.money < pre.cost) return { ok: false, msg: msg('err.thinMoney', { cost: pre.cost }) };
  const d = p.design;
  let next;
  if (d.map) {
    const cells = [...d.map];
    const dense = cells.map((c, i) => (c === TILE_LETTERS.dense ? i : -1)).filter(i => i >= 0);
    for (let k = 0; k < pre.tiles; k++) cells[dense[Math.floor(k * dense.length / pre.tiles)]] = TILE_LETTERS.wide;
    next = normalizeDesign({ ...d, map: cells.join('') });
  } else {
    next = { ...d, dense: d.dense - pre.tiles, wide: (d.wide || 0) + pre.tiles };
  }
  g.money -= pre.cost;
  p.design = next; p.calc = calcDesign(next, p.site, g.P);
  log(g, 'log.thinned', { id: p.id, tiles: pre.tiles, cost: pre.cost, cap: p.calc.cap });
  return { ok: true };
}

// Fiscal year and quarter of a turn, for showing dates (turn 1 = fiscal year startFY, April to June).
function calendar(g, turn = g.turn) {
  return { fy: g.P.startFY + Math.floor((turn - 1) / 4), quarter: (turn - 1) % 4 + 1 };
}

// ===== Permitting =====
// Promotion zone bonus: at submission, biodiversity target at least 40 and a citizen fund
// or benefit agreement (section 4).
function promoQualifies(p) { return p.promo && p.calc.bTarget >= 40 && (p.fund || p.benefit); }

// Permit turns from the site type and the town's 条例 alone, before acceptance and bonuses.
function sitePermitTurns(g, siteType, town = HOME) {
  const P = g.P;
  return P['permit_' + siteType] + (siteType === 'farmland' ? P.farmlandExtra : 0) + (siteType === 'forest' ? P.forestExtra : 0)
    + (g.towns[town].ordinance ? P.ordinanceTurns : 0);
}

// Permit duration D (section 8) for acceptance A at submission.
function permitTurns(g, p, A, promoActive) {
  const P = g.P;
  const D = sitePermitTurns(g, p.site, p.town) + Math.max(0, Math.ceil((P.permitAThreshold - A) / P.permitAStep))
    - (p.genuineBefore ? P.earlyBonus : 0) - (promoActive ? P.promoTurns : 0);
  return Math.max(1, D);
}

// What submitting now would mean: { turns, A, cost, promo, support }.
// With { genuineFirst: true }: the same, after first holding a genuine 説明会.
function submitPreview(g, p, opts = {}) {
  const P = g.P;
  const q = opts.genuineFirst ? { ...p, genuineBefore: true, S: shifted(p.S, P.genuineGain) } : p;
  const promo = !!promoQualifies(q);
  const A = acceptance(promo ? { ...q, S: shifted(q.S, P.promoA * 2) } : q, P);
  return { turns: permitTurns(g, q, A, promo), A, cost: planningCost(q, P), promo, support: schemeAt(g, q, promo) };
}

// Objection probability per permitting turn (section 8). extraShift: a support change to assume first.
function objectionChance(p, P, extraShift = 0) {
  const A = acceptance(extraShift ? { ...p, S: shifted(p.S, extraShift) } : p, P);
  return P.objBase * ((100 - A) / 100) * P['risk_' + p.site] * (p.promoActive ? P.promoRisk : 1);
}
// Objection probability at the end of this turn, including the support lost if the
// project gets no attention this turn (silence).
function objectionPreview(p, P) { return objectionChance(p, P, p.engaged ? 0 : -P.silenceDrift); }

function submit(g, p) {
  const P = g.P;
  if (p.status !== 'design') return { ok: false, msg: msg('err.submitStatus') };
  const plan = planningCost(p, P);
  if (g.money < plan) return { ok: false, msg: msg('err.planningCost', { cost: plan }) };
  g.money -= plan; p.planningPaid = plan;
  if (promoQualifies(p)) { p.promoActive = true; shiftAll(p, P.promoA * 2); }
  const A = acceptance(p, P);
  p.permitLeft = permitTurns(g, p, A, p.promoActive);
  p.support = schemeAt(g, p, p.promoActive);
  p.status = 'permitting';
  log(g, p.genuineBefore ? 'log.submittedGenuine' : 'log.submitted',
    { id: p.id, turns: p.permitLeft, A, support: msg('support.' + p.support) });
  return { ok: true };
}

function sell(g, p) {
  if (p.status !== 'operating') return { ok: false, msg: msg('err.sellStatus') };
  const price = salePrice(p, g.P);
  g.money += price; p.status = 'sold'; p.sellTimer = 2;
  g.R = clamp(g.R - g.P.repSell, 0, 100);   // selling a park looks like speculation (v1.1)
  log(g, 'log.sold', { id: p.id, price, rep: g.P.repSell });
  return { ok: true };
}

// ===== Strikes, 条例 and cancellation (each town has its own, section 7) =====
// own = false: the warning was caused by someone else (a rival developer), so your reputation does not suffer.
function strike(g, town, reason, own = true) {
  const tw = g.towns[town];
  tw.strikes++;
  if (own) g.R = clamp(g.R - g.P.repWarning, 0, 100);   // investors hear about it too (v1.1)
  if (!own) log(g, 'log.strikeRival', { reason, strikes: tw.strikes });
  else log(g, town === HOME ? 'log.strike' : 'log.strikeNeighbour', { reason, strikes: tw.strikes, rep: g.P.repWarning });
  // word travels: the other town hears about it and trusts you less
  g.towns.forEach((other, i) => {
    if (i === town) return;
    other.T -= g.P.warningSpread;
    log(g, i === HOME ? 'log.wordHome' : 'log.wordNeighbour', { trust: g.P.warningSpread });
  });
}

function checkOrdinance(g) {
  g.towns.forEach((tw, town) => {
    if (!tw.ordinance && (tw.strikes >= g.P.strikeLimit || tw.T < g.P.trustOrdinance)) {
      tw.ordinance = true;
      log(g, town === HOME ? 'log.ordinance' : 'log.ordinanceNeighbour');
    }
  });
}

function cancel(g, p, reason) {
  p.status = 'cancelled'; g.cancellations++;
  g.towns[p.town].T -= g.P.cancelTrust;
  log(g, 'log.cancelled', { id: p.id, reason, trust: g.P.cancelTrust });
  strike(g, p.town, msg('strike.cancelled'));
}

// ===== Events =====
// The event numbers are always drawn in the same order, so the same scenario code gives the
// same event in the same turn for everyone (which project a grid delay hits depends on the player).
function rollEvent(g) {
  const P = g.P;
  g.curtail = 1;
  const r = turnRandom(g, STREAM_EVENTS);
  const happens = r() < P.eventChance, ev = Math.floor(r() * 8);
  const policyLow = r() < 0.5, pick = r(), delay = 1 + Math.floor(r() * 3);
  if (!happens) return;
  const live = g.projects.filter(p => p.status === 'building' || p.status === 'operating');
  if (ev === 0) {
    let hit = 0;
    live.forEach(p => {
      if (screenHedges(p.design, p.calc) < P.hedgesProtect) {
        g.money -= P.typhoonDamage * (p.design.cheap ? P.cheapDamageMult : 1); p.damaged = true; hit++;
        if (p.design.cheap && !p.struck) { p.struck = true; strike(g, p.town, msg('strike.cheapDamaged', { id: p.id })); }
      }
    });
    log(g, 'log.typhoon', { hit });
  } else if (ev === 1) {
    let hit = 0;
    live.forEach(p => {
      if (p.site === 'forest') {
        g.money -= P.landslideDamage * (p.design.cheap ? P.cheapDamageMult : 1); p.damaged = true; hit++;
        if (p.design.cheap) { g.towns[p.town].T -= P.landslideTrust; if (!p.struck) { p.struck = true; strike(g, p.town, msg('strike.landslide', { id: p.id })); } }
      } else if (p.design.cheap) {
        g.money -= P.typhoonDamage * P.cheapDamageMult; p.damaged = true; hit++;
        if (!p.struck) { p.struck = true; strike(g, p.town, msg('strike.runoff', { id: p.id })); }
      }
    });
    log(g, 'log.heavyRain', { hit });
  } else if (ev === 2) {
    const c = g.projects.filter(p => p.status === 'permitting' || p.status === 'building');
    if (c.length) {
      const p = c[Math.floor(pick * c.length)], d = delay;
      if (p.status === 'permitting') p.permitLeft += d; else p.buildLeft += d;
      log(g, 'log.gridDelay', { id: p.id, turns: d });
    } else log(g, 'log.gridDelayNone');
  } else if (ev === 3) {
    g.curtail = P.curtail; log(g, 'log.curtailment');
  } else if (ev === 4) {
    const f = policyLow ? P.policyLow : P.policyHigh;
    g.revFactor = clamp(g.revFactor * f, 0.5, 1.5);
    log(g, 'log.policyChange', { factor: f });
  } else if (ev === 5) {
    // the rival developer builds in the home town
    g.towns[HOME].T -= P.rivalTrust; log(g, 'log.rival', { trust: P.rivalTrust }); strike(g, HOME, msg('strike.rival'), false);
  } else if (ev === 6) {
    g.projects.filter(p => p.status === 'design' || p.status === 'permitting').forEach(p => {
      const A = acceptance(p, P); shiftAll(p, A >= 50 ? P.mediaShift : -P.mediaShift);
    });
    log(g, 'log.media');
  } else {
    if (g.projects.some(p => p.status === 'operating' && p.B >= P.rareB)) { g.R += P.rareR; log(g, 'log.rareFound', { rep: P.rareR }); }
    else log(g, 'log.rareNone');
  }
}

// ===== End of turn =====
function endTurn(g) {
  if (g.over) return;
  const P = g.P;
  closeFunds(g);
  rollEvent(g);
  const yearEnd = calendar(g).quarter === 4;   // the yearly farming reports are due
  g.projects.forEach(p => {
    if (p.benefit && !['cancelled', 'sold', 'removed', 'dropped'].includes(p.status)) g.money -= P.benefitCost;
  });
  g.projects.forEach(p => {
    const st = p.status;
    if (st === 'permitting') {
      if (!p.engaged) shiftAll(p, -P.silenceDrift);
      if (g.luck() < objectionChance(p, P)) {
        p.objections++; g.objectionsTotal++; p.permitLeft += P.objDelay; shiftAll(p, -P.objSPenalty);
        log(g, 'log.objection', { id: p.id, count: p.objections, delay: P.objDelay });
      }
      const A = acceptance(p, P);
      if (p.objections >= P.maxObjections) return cancel(g, p, msg('cancel.objections'));
      if (A < P.cancelA) return cancel(g, p, msg('cancel.acceptance', { A }));
      p.permitLeft--;
      if (p.permitLeft <= 0) {
        if (g.towns[p.town].ordinance && A < P.ordinanceA) {
          p.objections++; g.objectionsTotal++; p.permitLeft = 1;
          log(g, 'log.consentRefused', { id: p.id, A });
          if (p.objections >= P.maxObjections) return cancel(g, p, msg('cancel.consent'));
        } else { p.status = 'approved'; log(g, 'log.approved', { id: p.id }); }
      }
    } else if (st === 'approved') {
      const need = buildPayment(p, P);
      if (g.money >= need) {
        g.money -= need; p.status = 'building'; p.buildLeft = P.buildTurns;
        log(g, 'log.constructionStarted', { id: p.id, paid: need });
      } else if (!p.waitLogged) { p.waitLogged = true; log(g, 'log.waitingFunds', { id: p.id, need }); }
    } else if (st === 'building') {
      p.buildLeft--;
      if (p.buildLeft <= 0) {
        p.status = 'operating';
        const A = acceptance(p, P); p.finalA = A;
        const dT = (A - 50) / 5 + p.calc.bTarget / 20;
        const tw = g.towns[p.town];
        tw.T += dT; g.R += tw.T / 10;
        log(g, 'log.operating', { id: p.id, A, dT });
        if (A < 30) strike(g, p.town, msg('strike.lowAcceptance', { id: p.id }));
        if (p.site === 'forest' && p.calc.bTarget < 0) strike(g, p.town, msg('strike.forestNegativeB', { id: p.id }));
      }
    } else if (st === 'operating') {
      const [lo, hi] = priceRange(P, p.support);
      const price = hi > lo ? lo + g.luck() * (hi - lo) : lo;
      const gross = p.calc.cap * P.revMult * g.revFactor * price * g.curtail;
      const net = netRevenue(p, P, gross);
      g.money += net;
      p.B += P.bGrowth * (p.calc.bTarget - p.B);
      if (yearEnd && p.site === 'agri') farmingReport(g, p);
    } else if (st === 'sold') {
      if (p.sellTimer > 0) {
        p.sellTimer--;
        if (p.sellTimer === 0) { g.towns[p.town].T -= P.sellTrustPenalty; log(g, 'log.neglected', { id: p.id, trust: P.sellTrustPenalty }); }
      }
    }
  });
  g.towns.forEach(tw => { tw.T = clamp(tw.T, 0, 100); }); g.R = clamp(g.R, 0, 100);
  checkOrdinance(g);
  g.negTurns = g.money < 0 ? g.negTurns + 1 : 0;
  if (g.negTurns >= 2) { g.lost = 'bankrupt'; log(g, 'log.lostMoney'); }
  if (g.towns[HOME].T < P.loseTrust) { g.lost = 'trust'; log(g, 'log.lostTrust'); }
  g.projects.forEach(p => { p.engaged = false; });
  g.hist.push({ money: g.money, T: g.towns[HOME].T });
  g.turn++; g.ap = P.apPerTurn;
  if (g.turn === P.supportEndTurn && !g.lost) log(g, 'log.supportEnded', { fy: calendar(g).fy });   // fiscal year 2027 begins
  if (g.turn === P.neighbourTurn && g.turn <= P.turns && !g.lost) {
    // the neighbouring town joins; word has travelled: its trust starts at the home town's trust
    g.towns.push(newTown(g.towns[HOME].T));
    log(g, 'log.neighbourJoined', { trust: g.towns[NEIGHBOUR].T });
  }
  genSites(g);
  if (g.lost || g.turn > P.turns) g.over = true;
}

// ===== Scoring (section 10) =====
function scorePark(p, P) {
  const d = p.design;
  const types = ['meadow', 'hedge', 'pond'].filter(k => (d[k] || 0) > 0).length +
    (linkedCorridors(d, p.calc) > 0 ? 1 : 0) + ((d.wide || 0) > 0 ? 1 : 0);
  const s = {
    site: ['brownfield', 'farmland', 'agri'].includes(p.site) || p.promoActive ? 2 : p.site === 'reservoir' ? 1 : 0,
    natAct: types >= 3 && d.mgmt !== 'none' ? 2 : types >= 1 ? 1 : 0,
    natRes: p.B >= 60 ? 2 : p.B >= 30 ? 1 : 0,
    safety: !d.cheap && screenHedges(d, p.calc) >= 3 ? 2 : !d.cheap ? 1 : 0,
    community: p.genuineBefore && p.objections === 0 ? 2 : (p.genuineAny || p.objections <= 1) ? 1 : 0,
    benefit: p.fund || p.benefit ? 2 : 0,
    longterm: p.status === 'sold' || p.status === 'removed' ? 0 : p.damaged ? 1 : 2
  };
  s.total = Object.values(s).reduce((a, b) => a + b, 0);
  return s;
}

// note is null, or a message explaining why the grade is D.
// Removed parks are scored, but their capacity no longer counts (section 10).
function scoreGame(g) {
  const P = g.P;
  const parks = g.projects.filter(p => ['operating', 'sold', 'removed'].includes(p.status));
  const capBuilt = parks.filter(p => p.status !== 'removed').reduce((s, p) => s + p.calc.cap, 0);
  const per = parks.map(p => ({ p, s: scorePark(p, P) }));
  const avg = per.length ? per.reduce((s, x) => s + x.s.total, 0) / per.length : 0;
  let grade = avg >= P.gradeS ? 'S' : avg >= P.gradeA ? 'A' : avg >= P.gradeB ? 'B' : avg >= P.gradeC ? 'C' : 'D';
  let note = null;
  if (g.lost) { grade = 'D'; note = msg('score.lost'); }
  else if (!parks.length) { grade = 'D'; note = msg('score.noPark'); }
  else if (capBuilt < P.capTarget) { grade = 'D'; note = msg('score.capMissed'); }
  return { grade, avg, capBuilt, parks: per, note };
}

// ===== What other files can use =====
const api = {
  // lists and numbers
  defaultParams, SITE_TYPES, RESIDENTS, TILE_KEYS, ACTIONS, STATUSES, MANAGEMENT, RULES_VERSION, HOME, NEIGHBOUR,
  MAP_SIDE, TILE_LETTERS,
  // game and player actions
  rng, clamp, newGame, startProject, changeDesign, dropProject, doAction, submit, sell, thinPanels, endTurn,
  // questions the screens can ask (they never change the game)
  calcDesign, designProblem, countsFromMap, normalizeDesign, mapPlacement,
  wishesMet, effS, matches, acceptance, checkAction, visitTarget,
  fundUptake, fundPreview, playerCost, planningCost, buildPayment, salePrice, expectedIncome, supportScheme, priceRange, calendar,
  cropLight, thinPreview,
  promoQualifies, sitePermitTurns, submitPreview, objectionChance, objectionPreview, neighbourOpen,
  // scoring
  scorePark, scoreGame
};
root.SolarEngine = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;   // for test scripts run with Node
})(globalThis);
