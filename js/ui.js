// Solar Commons: small helpers shared by all screens.
// Everything here is available under SC.ui, for example SC.ui.fmt(3.14, 1).

(function (root) {
  'use strict';
  const SC = root.SC = root.SC || {};

  // Make text safe to put inside HTML.
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  // Round a number for display: fmt(3.14159, 1) gives "3.1". Never shows "-0".
  function fmt(n, decimals = 0) {
    const f = 10 ** decimals;
    const v = Math.round(n * f) / f;
    return (v === 0 ? 0 : v).toFixed(decimals);
  }
  // The same with a + sign for positive numbers: "+2.5", "-1.0", "0".
  function fmtSigned(n, decimals = 0) {
    const s = fmt(n, decimals);
    return Number(s) > 0 ? '+' + s : s;
  }

  const byKey = (container, key) => container.querySelector(`[data-key="${CSS.escape(key)}"]`);

  // Replace the contents of a container with new HTML, but keep what the player had:
  // keyboard focus (elements are matched by their data-key) and opened <details> sections.
  // If the focused element is gone or disabled, focus moves to fallbackKey instead.
  function renderInto(container, html, fallbackKey) {
    const active = document.activeElement;
    const hadFocus = active && container.contains(active);
    const focusKey = hadFocus ? active.dataset.key : null;
    const openKeys = [...container.querySelectorAll('details[data-key]')].filter(d => d.open).map(d => d.dataset.key);
    container.innerHTML = html;
    openKeys.forEach(k => { const d = byKey(container, k); if (d) d.open = true; });
    if (!hadFocus) return;
    const target = [focusKey, fallbackKey].map(k => k && byKey(container, k)).find(el => el && !el.disabled);
    if (target) target.focus({ preventScroll: true });
  }

  // Open a <dialog> as a pop-up. onClose(returnValue) runs when it closes;
  // returnFocus() gives the element that should get keyboard focus afterwards.
  function openDialog(dialog, { onClose, returnFocus } = {}) {
    dialog.returnValue = '';
    const form = dialog.querySelector('form');
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      dialog.removeEventListener('close', finish);
      if (form) form.removeEventListener('submit', onSubmit);
      const el = returnFocus && returnFocus();
      if (el) el.focus();
      if (onClose) onClose(dialog.returnValue);
    };
    // The buttons in a pop-up close it by submitting its form. React to that right away:
    // the browser's own 'close' event can be delayed until the page is drawn again.
    const onSubmit = e => {
      e.preventDefault();
      dialog.close(e.submitter ? e.submitter.value : '');
      finish();
    };
    if (form) form.addEventListener('submit', onSubmit);
    dialog.addEventListener('close', finish);   // still needed for the Escape key
    dialog.showModal();
  }

  // Ask a yes/no question in a pop-up. Resolves to true if the player confirms.
  // texts: { title, text, ok, cancel } are already translated texts.
  // returnTo: the element that gets keyboard focus back if the player cancels.
  function confirmDialog(texts, returnTo) {
    const d = document.getElementById('confirmDialog');
    d.querySelector('#confirmTitle').textContent = texts.title;
    d.querySelector('#confirmText').textContent = texts.text;
    d.querySelector('#confirmOk').textContent = texts.ok;
    d.querySelector('#confirmCancel').textContent = texts.cancel;
    const back = returnTo || document.activeElement;
    return new Promise(resolve => openDialog(d, {
      onClose: value => resolve(value === 'ok'),
      returnFocus: () => (d.returnValue !== 'ok' && back && document.contains(back) ? back : null)
    }));
  }

  // Show a short message at the bottom of the screen (also read out by screen readers).
  let toastTimer = null;
  function announce(text) {
    const el = document.getElementById('toast');
    el.textContent = text;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.textContent = ''; }, 5000);
  }

  SC.ui = { esc, fmt, fmtSigned, renderInto, openDialog, confirmDialog, announce };
})(globalThis);
