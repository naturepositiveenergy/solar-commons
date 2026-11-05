// Solar Commons: the current game session, saved automatically.
//
// Every player action goes through SC.session.act(...), which passes it to the engine.
// Each successful action is also written down. The engine always plays the same way for
// the same starting number (seed) and the same actions, so this short list is all that
// needs to be saved: to continue, the game is simply replayed from the beginning.
//
// The save lives in this browser only (localStorage). If the browser blocks storage,
// the game still works, it just cannot be continued after a reload.

(function (root) {
  'use strict';
  const SC = root.SC = root.SC || {};
  const E = root.SolarEngine;
  const STORAGE_KEY = 'sc-save';
  const FORMAT = 1;    // change if the way games are saved changes

  let game = null;     // the engine's game state
  let record = null;   // { seed, params, actions: [[type, ...arguments], ...] }

  const find = (g, id) => g.projects.find(p => p.id === id);
  const noProject = { ok: false };

  // The actions a player can take, each passed on to the engine.
  const ACTIONS = {
    start: (g, siteIndex, design) => E.startProject(g, siteIndex, design),
    redesign: (g, id, design) => (find(g, id) ? E.changeDesign(g, find(g, id), design) : noProject),
    drop: (g, id) => (find(g, id) ? E.dropProject(g, find(g, id)) : noProject),
    engage: (g, id, action) => (find(g, id) ? E.doAction(g, find(g, id), action) : noProject),
    submit: (g, id) => (find(g, id) ? E.submit(g, find(g, id)) : noProject),
    sell: (g, id) => (find(g, id) ? E.sell(g, find(g, id)) : noProject),
    endTurn: g => { E.endTurn(g); return { ok: true }; }
  };
  const copy = value => JSON.parse(JSON.stringify(value));

  // ----- Storage -----
  function store() {
    try {
      root.localStorage.setItem(STORAGE_KEY, JSON.stringify({ format: FORMAT, rules: E.RULES_VERSION, ...record }));
    } catch (e) { /* storage blocked or full: the game goes on without saving */ }
  }
  function readSaved() {
    try {
      const s = JSON.parse(root.localStorage.getItem(STORAGE_KEY));
      return s && s.format === FORMAT && s.rules === E.RULES_VERSION && Array.isArray(s.actions) ? s : null;
    } catch (e) { return null; }
  }
  function clearSaved() {
    try { root.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* nothing to do */ }
  }

  // ----- Session -----
  function start() {
    const seed = Math.floor(Math.random() * 1e9);
    const params = E.defaultParams();
    game = E.newGame({ ...params }, seed);
    record = { seed, params, actions: [] };
    store();
  }

  // Do one player action, for example act('engage', 2, 'visit'). Returns the engine's answer.
  function act(type, ...args) {
    if (!game || game.over || !ACTIONS[type]) return { ok: false };
    const result = ACTIONS[type](game, ...args);
    if (result.ok) {
      record.actions.push([type, ...copy(args)]);
      store();
    }
    return result;
  }

  // Rebuild the saved game by replaying it. Returns true if that worked.
  function resume() {
    const s = readSaved();
    if (!s) return false;
    try {
      const g = E.newGame({ ...s.params }, s.seed);
      for (const [type, ...args] of s.actions) {
        const result = ACTIONS[type] && ACTIONS[type](g, ...copy(args));
        if (!result || !result.ok) throw new Error('saved action could not be replayed');
      }
      game = g;
      record = { seed: s.seed, params: s.params, actions: s.actions.slice() };
      return true;
    } catch (e) {
      clearSaved();
      return false;
    }
  }

  // Close the current game. forget = true also deletes the save.
  function end(forget) {
    game = null;
    record = null;
    if (forget) clearSaved();
  }

  SC.session = {
    start, act, resume, end,
    hasSaved: () => !!readSaved(),
    get game() { return game; }
  };
})(globalThis);
