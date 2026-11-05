// Solar Commons: language switch and text lookup.
//
// All texts live in lang/en.js and lang/ja.js. The code never contains texts,
// only text codes, for example t('start.newGame').
//
// In HTML, give an element  data-i18n="code"  and its text is filled in
// automatically. data-i18n-aria-label="code" fills in the aria-label instead
// (the name a screen reader announces).
//
// Placeholders in texts: {name} is replaced by a value. {name:1} shows a number
// with 1 decimal place, {name:+1} also puts a + sign in front of positive numbers.
// A value can itself be a message from the engine ({ key, vars }); it is
// translated too.

(function (root) {
  'use strict';

  const STORAGE_KEY = 'sc-lang';   // where the chosen language is remembered
  const FALLBACK = 'en';           // used when a text is missing in the chosen language
  const listeners = [];
  let current = FALLBACK;

  // The language files add themselves to this object: SC_LANG.en = { ... }
  root.SC_LANG = root.SC_LANG || {};

  function texts(lang) { return root.SC_LANG[lang] || {}; }

  function formatValue(value, sign, decimals) {
    if (value !== null && typeof value === 'object') return t(value);
    if (decimals === undefined || typeof value !== 'number') return String(value);
    const s = value.toFixed(Number(decimals));
    return sign && value >= 0 ? '+' + s : s;
  }

  // Look up a text by its code and fill in the placeholders.
  // Also accepts an engine message object: t({ key: 'log.sold', vars: { id: 2, price: 45 } })
  function t(key, vars) {
    if (key !== null && typeof key === 'object') { vars = key.vars; key = key.key; }
    let text = texts(current)[key];
    if (text === undefined) text = texts(FALLBACK)[key];
    if (text === undefined) return key;   // missing text: show the code, so it is easy to spot
    if (!vars) return text;
    return text.replace(/\{(\w+)(?::(\+?)(\d))?\}/g, (whole, name, sign, decimals) =>
      name in vars ? formatValue(vars[name], sign, decimals) : whole);
  }

  function readSaved() {
    try { return root.localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function save(lang) {
    try { root.localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* storage blocked: choice is not remembered */ }
  }

  // First language from the browser settings that the game has, if any.
  function browserLanguage() {
    const nav = root.navigator;
    const list = nav ? (nav.languages && nav.languages.length ? nav.languages : [nav.language]) : [];
    for (const l of list) {
      const code = String(l || '').slice(0, 2).toLowerCase();
      if (root.SC_LANG[code]) return code;
    }
    return null;
  }

  // Fill in all marked texts inside an element (or the whole page).
  function applyTo(scope) {
    scope.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    scope.querySelectorAll('[data-i18n-aria-label]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel)); });
  }

  // Switch language. remember = false switches without saving the choice.
  function setLanguage(lang, remember = true) {
    if (!root.SC_LANG[lang]) return;
    current = lang;
    if (remember) save(lang);
    if (root.document) {
      root.document.documentElement.lang = lang;
      applyTo(root.document);
    }
    listeners.forEach(fn => fn(lang));
  }

  // Pick the starting language: the saved choice, else the browser language, else English.
  function init() {
    const saved = readSaved();
    setLanguage(root.SC_LANG[saved] ? saved : (browserLanguage() || FALLBACK), false);
  }

  // Run a function every time the language changes (to redraw texts made in code).
  function onChange(fn) { listeners.push(fn); }

  root.I18n = {
    t, init, setLanguage, applyTo, onChange,
    getLanguage: () => current,
    languages: () => Object.keys(root.SC_LANG)
  };
  root.t = t;   // short form used in all game code
})(globalThis);
