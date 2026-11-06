// Solar Commons: game rules engine (design document v0.6)
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

// ===== Numbers (design document v0.6) =====
// All rule numbers in one place. The simulator can override them for testing.
const DEFAULT_PARAMS = {
  // Game
  turns: 20,               // turns per scenario (1 turn = 1 quarter)
  startMoney: 100,
  apPerTurn: 3,            // action points per turn
  startTrust: 50,
  startRep: 30,
  maxTiles: 100,           // tiles per site (10 × 10 map)
  capTarget: 15,           // built capacity needed for a grade above D
  eventChance: 0.25,       // chance of an event each turn

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

  // Community (section 5)
  genuineGain: 10, visitGain: 20, tourGain: 15,
  fundGain: 15, fundShare: 0.2,
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
  decomShare: 0.05,        // decommissioning reserve
  bGrowth: 0.2,            // biodiversity growth per turn (share of the remaining gap)
  cheapDiscount: 0.3, cheapDamageMult: 2,
  sellMult: 1.5, sellTrustPenalty: 5,

  // Trust and the 条例 (section 7)
  strikeLimit: 2,          // strikes until a 条例 is enacted
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
// Project stages, in order. 'dropped' = given up before submission (no penalty).
const STATUSES = ['design', 'permitting', 'approved', 'building', 'operating', 'sold', 'cancelled', 'dropped'];
// Management options for a park (section 5)
const MANAGEMENT = ['none', 'mowing', 'grazing'];
// Version of the rules. Change it together with docs/design.md: saved games made
// with other rules are not continued, because they would play differently.
const RULES_VERSION = 'v0.6';

// ===== Helpers =====
// Random numbers from a seed: the same seed always gives the same game.
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

// ===== Game state =====
function newGame(P, seed) {
  const g = {
    P, r: rng(seed), turn: 1, money: P.startMoney, ap: P.apPerTurn, T: P.startTrust, R: P.startRep,
    strikes: 0, ordinance: false, revFactor: 1, curtail: 1, projects: [], log: [], hist: [],
    negTurns: 0, over: false, lost: null, nextId: 1, cancellations: 0, objectionsTotal: 0
  };
  genSites(g);
  g.hist.push({ money: g.money, T: g.T });
  return g;
}

function genSites(g) {
  const pool = SITE_TYPES.filter(s => !(g.ordinance && s === 'forest'));
  const out = [];
  const avail = pool.slice();
  for (let i = 0; i < 3 && avail.length; i++) {
    const idx = Math.floor(g.r() * avail.length);
    out.push({ type: avail[idx], promo: g.r() < g.P.promoChance });
    avail.splice(idx, 1);
  }
  g.sites = out;
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
  const base = (g.T - 50) * 2;
  const S = [base, base, base, base, base];
  if (site.type === 'agri') S[0] += P.agriFarmerBonus;
  if (site.type === 'forest') { S[1] -= P.forestPenalty; S[3] -= P.forestPenalty; }
  const p = {
    id: g.nextId++, site: site.type, promo: site.promo, promoActive: false, design: normalizeDesign(design), calc,
    S: S.map(s => clamp(s, -100, 100)), status: 'design', genuineBefore: false, genuineAny: false,
    fund: false, benefit: false, objections: 0, engaged: false, damaged: false, struck: false,
    permitLeft: 0, buildLeft: 0, planningPaid: 0, B: calc.mod, finalA: null, sellTimer: 0, waitLogged: false
  };
  g.projects.push(p);
  g.sites.splice(siteIdx, 1);
  log(g, p.promo ? 'log.projectStartedPromo' : 'log.projectStarted',
    { id: p.id, site: msg('site.' + p.site), cap: p.calc.cap, cost: p.calc.cost });
  return { ok: true, p };
}

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
  if (a === 'fund') { shiftAll(p, P.fundGain); p.fund = true; }
  if (a === 'benefit') { shiftAll(p, P.benefitGain); p.benefit = true; }
  return { ok: true };
}

// ===== Money =====
// The player's share of the build cost (a citizen fund pays part of it).
function playerCost(p, P) { return p.calc.cost * (p.fund ? 1 - P.fundShare : 1); }
// Planning cost, paid at submission and lost on cancellation (section 8).
function planningCost(p, P) { return playerCost(p, P) * P.planningShare; }
// Still to pay when construction starts.
function buildPayment(p, P) { return playerCost(p, P) - p.planningPaid; }
// Price when an operating park is sold (section 7).
function salePrice(p, P) { return p.calc.cost * P.sellMult; }
// Net revenue of a park for a given gross revenue (section 8).
function netRevenue(p, P, gross) {
  return gross - p.calc.mgmtCost - (p.fund ? gross * P.fundShare : 0) - gross * P.decomShare;
}
// Expected income per turn of a park without random effects (average FIP factor, no curtailment),
// after management, citizen fund share, decommissioning reserve and benefit agreement.
// Also works for a planned design: { calc, fund, benefit }.
function expectedIncome(g, p) {
  const P = g.P;
  const fip = p.calc.cap >= P.fipThreshold ? (P.fipMin + P.fipMax) / 2 : 1;
  const gross = p.calc.cap * P.revMult * g.revFactor * fip;
  return netRevenue(p, P, gross) - (p.benefit ? P.benefitCost : 0);
}

// ===== Permitting =====
// Promotion zone bonus: at submission, biodiversity target at least 40 and a citizen fund
// or benefit agreement (section 4).
function promoQualifies(p) { return p.promo && p.calc.bTarget >= 40 && (p.fund || p.benefit); }

// Permit turns from the site type and the 条例 alone, before acceptance and bonuses.
function sitePermitTurns(g, siteType) {
  const P = g.P;
  return P['permit_' + siteType] + (siteType === 'farmland' ? P.farmlandExtra : 0) + (siteType === 'forest' ? P.forestExtra : 0)
    + (g.ordinance ? P.ordinanceTurns : 0);
}

// Permit duration D (section 8) for acceptance A at submission.
function permitTurns(g, p, A, promoActive) {
  const P = g.P;
  const D = sitePermitTurns(g, p.site) + Math.max(0, Math.ceil((P.permitAThreshold - A) / P.permitAStep))
    - (p.genuineBefore ? P.earlyBonus : 0) - (promoActive ? P.promoTurns : 0);
  return Math.max(1, D);
}

// What submitting now would mean: { turns, A, cost, promo }.
// With { genuineFirst: true }: the same, after first holding a genuine 説明会.
function submitPreview(g, p, opts = {}) {
  const P = g.P;
  const q = opts.genuineFirst ? { ...p, genuineBefore: true, S: shifted(p.S, P.genuineGain) } : p;
  const promo = !!promoQualifies(q);
  const A = acceptance(promo ? { ...q, S: shifted(q.S, P.promoA * 2) } : q, P);
  return { turns: permitTurns(g, q, A, promo), A, cost: planningCost(q, P), promo };
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
  p.status = 'permitting';
  log(g, p.genuineBefore ? 'log.submittedGenuine' : 'log.submitted', { id: p.id, turns: p.permitLeft, A });
  return { ok: true };
}

function sell(g, p) {
  if (p.status !== 'operating') return { ok: false, msg: msg('err.sellStatus') };
  const price = salePrice(p, g.P);
  g.money += price; p.status = 'sold'; p.sellTimer = 2;
  log(g, 'log.sold', { id: p.id, price });
  return { ok: true };
}

// ===== Strikes, 条例 and cancellation =====
function strike(g, reason) {
  g.strikes++;
  log(g, 'log.strike', { reason, strikes: g.strikes });
}

function checkOrdinance(g) {
  if (!g.ordinance && (g.strikes >= g.P.strikeLimit || g.T < g.P.trustOrdinance)) {
    g.ordinance = true;
    log(g, 'log.ordinance');
  }
}

function cancel(g, p, reason) {
  p.status = 'cancelled'; g.cancellations++;
  g.T -= g.P.cancelTrust;
  log(g, 'log.cancelled', { id: p.id, reason, trust: g.P.cancelTrust });
  strike(g, msg('strike.cancelled'));
}

// ===== Events =====
function rollEvent(g) {
  const P = g.P;
  g.curtail = 1;
  if (g.r() >= P.eventChance) return;
  const ev = Math.floor(g.r() * 8);
  const live = g.projects.filter(p => p.status === 'building' || p.status === 'operating');
  if (ev === 0) {
    let hit = 0;
    live.forEach(p => {
      if (screenHedges(p.design, p.calc) < P.hedgesProtect) {
        g.money -= P.typhoonDamage * (p.design.cheap ? P.cheapDamageMult : 1); p.damaged = true; hit++;
        if (p.design.cheap && !p.struck) { p.struck = true; strike(g, msg('strike.cheapDamaged', { id: p.id })); }
      }
    });
    log(g, 'log.typhoon', { hit });
  } else if (ev === 1) {
    let hit = 0;
    live.forEach(p => {
      if (p.site === 'forest') {
        g.money -= P.landslideDamage * (p.design.cheap ? P.cheapDamageMult : 1); p.damaged = true; hit++;
        if (p.design.cheap) { g.T -= P.landslideTrust; if (!p.struck) { p.struck = true; strike(g, msg('strike.landslide', { id: p.id })); } }
      } else if (p.design.cheap) {
        g.money -= P.typhoonDamage * P.cheapDamageMult; p.damaged = true; hit++;
        if (!p.struck) { p.struck = true; strike(g, msg('strike.runoff', { id: p.id })); }
      }
    });
    log(g, 'log.heavyRain', { hit });
  } else if (ev === 2) {
    const c = g.projects.filter(p => p.status === 'permitting' || p.status === 'building');
    if (c.length) {
      const p = c[Math.floor(g.r() * c.length)], d = 1 + Math.floor(g.r() * 3);
      if (p.status === 'permitting') p.permitLeft += d; else p.buildLeft += d;
      log(g, 'log.gridDelay', { id: p.id, turns: d });
    } else log(g, 'log.gridDelayNone');
  } else if (ev === 3) {
    g.curtail = P.curtail; log(g, 'log.curtailment');
  } else if (ev === 4) {
    const f = g.r() < 0.5 ? P.policyLow : P.policyHigh;
    g.revFactor = clamp(g.revFactor * f, 0.5, 1.5);
    log(g, 'log.policyChange', { factor: f });
  } else if (ev === 5) {
    g.T -= P.rivalTrust; log(g, 'log.rival', { trust: P.rivalTrust }); strike(g, msg('strike.rival'));
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
  rollEvent(g);
  g.projects.forEach(p => {
    if (p.benefit && !['cancelled', 'sold', 'dropped'].includes(p.status)) g.money -= P.benefitCost;
  });
  g.projects.forEach(p => {
    const st = p.status;
    if (st === 'permitting') {
      if (!p.engaged) shiftAll(p, -P.silenceDrift);
      if (g.r() < objectionChance(p, P)) {
        p.objections++; g.objectionsTotal++; p.permitLeft += P.objDelay; shiftAll(p, -P.objSPenalty);
        log(g, 'log.objection', { id: p.id, count: p.objections, delay: P.objDelay });
      }
      const A = acceptance(p, P);
      if (p.objections >= P.maxObjections) return cancel(g, p, msg('cancel.objections'));
      if (A < P.cancelA) return cancel(g, p, msg('cancel.acceptance', { A }));
      p.permitLeft--;
      if (p.permitLeft <= 0) {
        if (g.ordinance && A < P.ordinanceA) {
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
        g.T += dT; g.R += g.T / 10;
        log(g, 'log.operating', { id: p.id, A, dT });
        if (A < 30) strike(g, msg('strike.lowAcceptance', { id: p.id }));
        if (p.site === 'forest' && p.calc.bTarget < 0) strike(g, msg('strike.forestNegativeB', { id: p.id }));
      }
    } else if (st === 'operating') {
      const fip = p.calc.cap >= P.fipThreshold ? P.fipMin + g.r() * (P.fipMax - P.fipMin) : 1;
      const gross = p.calc.cap * P.revMult * g.revFactor * fip * g.curtail;
      const net = netRevenue(p, P, gross);
      g.money += net;
      p.B += P.bGrowth * (p.calc.bTarget - p.B);
    } else if (st === 'sold') {
      if (p.sellTimer > 0) {
        p.sellTimer--;
        if (p.sellTimer === 0) { g.T -= P.sellTrustPenalty; log(g, 'log.neglected', { id: p.id, trust: P.sellTrustPenalty }); }
      }
    }
  });
  g.T = clamp(g.T, 0, 100); g.R = clamp(g.R, 0, 100);
  checkOrdinance(g);
  g.negTurns = g.money < 0 ? g.negTurns + 1 : 0;
  if (g.negTurns >= 2) { g.lost = 'bankrupt'; log(g, 'log.lostMoney'); }
  if (g.T < P.loseTrust) { g.lost = 'trust'; log(g, 'log.lostTrust'); }
  g.projects.forEach(p => { p.engaged = false; });
  g.hist.push({ money: g.money, T: g.T });
  g.turn++; g.ap = P.apPerTurn;
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
    longterm: p.status === 'sold' ? 0 : p.damaged ? 1 : 2
  };
  s.total = Object.values(s).reduce((a, b) => a + b, 0);
  return s;
}

// note is null, or a message explaining why the grade is D.
function scoreGame(g) {
  const P = g.P;
  const parks = g.projects.filter(p => p.status === 'operating' || p.status === 'sold');
  const capBuilt = parks.reduce((s, p) => s + p.calc.cap, 0);
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
  defaultParams, SITE_TYPES, RESIDENTS, TILE_KEYS, ACTIONS, STATUSES, MANAGEMENT, RULES_VERSION,
  MAP_SIDE, TILE_LETTERS,
  // game and player actions
  rng, clamp, newGame, startProject, changeDesign, dropProject, doAction, submit, sell, endTurn,
  // questions the screens can ask (they never change the game)
  calcDesign, designProblem, countsFromMap, normalizeDesign, mapPlacement,
  wishesMet, effS, matches, acceptance, checkAction, visitTarget,
  playerCost, planningCost, buildPayment, salePrice, expectedIncome,
  promoQualifies, sitePermitTurns, submitPreview, objectionChance, objectionPreview,
  // scoring
  scorePark, scoreGame
};
root.SolarEngine = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;   // for test scripts run with Node
})(globalThis);
