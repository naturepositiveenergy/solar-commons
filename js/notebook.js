// Solar Commons: the policy notebook (政策ノート, design document section 6).
//
// Short explanations of the real Japanese policies behind the game. In a game, an entry is
// "discovered" when the related situation first happens. This is worked out from the game
// itself, so nothing extra needs to be saved. From the title screen, every entry can be read,
// and the ⓘ buttons always show their entry.
// Texts: nb.<id>.title / .game / .real / .unlock in the language files.
// Sources and review: docs/policy-notebook.md.

(function (root) {
  'use strict';
  const SC = root.SC = root.SC || {};
  const { esc, openDialog } = SC.ui;
  const $ = id => document.getElementById(id);
  const operated = p => ['operating', 'sold', 'removed'].includes(p.status);
  const GRID_EVENTS = ['log.gridDelay', 'log.gridDelayNone', 'log.curtailment'];

  // The entries in display order: id, main official source, and when it counts as discovered.
  const ENTRIES = [
    { id: 'briefing', source: 'https://www.enecho.meti.go.jp/category/saving_and_new/saiene/kaitori/dl/announce/20240813.pdf',
      found: g => g.projects.length > 0 },
    { id: 'farmland', source: 'https://www.maff.go.jp/j/nousin/noukei/totiriyo/pdf/noushin_nouten.pdf',
      found: g => g.projects.some(p => p.site === 'farmland') },
    { id: 'agri', source: 'https://www.maff.go.jp/j/study/attach/pdf/250609-22.pdf',
      found: g => g.projects.some(p => p.site === 'agri') },
    { id: 'forest', source: 'https://www.maff.go.jp/chushi/press/kikaku/attach/pdf/230707-15.pdf',
      found: g => g.projects.some(p => p.site === 'forest') },
    { id: 'ordinance', source: 'https://www.pref.yamanashi.jp/somu/shigaku/reiki/reiki_honbun/a500RG00001801.html',
      found: g => g.ordinance },
    { id: 'promo', source: 'https://www.env.go.jp/content/000395587.pdf',
      found: g => g.projects.some(p => p.promo) },
    { id: 'fitfip', source: 'https://www.meti.go.jp/shingikai/santeii/pdf/20260205_1.pdf',
      found: g => g.projects.some(operated) || g.log.some(l => l.msg.key === 'log.supportEnded') },
    { id: 'grid', source: 'https://www.meti.go.jp/shingikai/enecho/shoene_shinene/shin_energy/keito_wg/pdf/017_02_00.pdf',
      found: g => g.log.some(l => GRID_EVENTS.includes(l.msg.key)) },
    { id: 'decommission', source: 'https://www.meti.go.jp/shingikai/enecho/shoene_shinene/shin_energy/taiyoko_haikihiyo_wg/pdf/005_00_02.pdf',
      found: g => g.projects.some(operated) },
    { id: 'fund', source: 'https://www.env.go.jp/policy/kihon_keikaku/goodlifeaward/report/201703_02/',
      found: g => g.projects.some(p => p.fund) },
    { id: 'natureSite', source: 'https://www.env.go.jp/content/000384044.pdf',
      found: g => g.projects.some(p => operated(p) && p.B >= g.P.rareB) }
  ];
  const byId = Object.fromEntries(ENTRIES.map(e => [e.id, e]));

  let seen = new Set();   // entries the player has opened ("new" = discovered but not yet opened)
  let seenFor = null;     // the game that list belongs to

  // Ids of the entries discovered in a game (none without a game).
  function discovered(g) { return g ? ENTRIES.filter(e => e.found(g)).map(e => e.id) : []; }

  // A new or continued game starts with everything it has already discovered counted as seen,
  // so that continuing after a reload does not mark old entries as new.
  function syncGame(g) {
    if (g === seenFor) return;
    seenFor = g;
    seen = new Set(discovered(g));
  }
  function newIds(g) {
    if (!g) return [];
    syncGame(g);
    return discovered(g).filter(id => !seen.has(id));
  }

  const title = id => t(`nb.${id}.title`);
  const unlockText = (id, g) => t(`nb.${id}.unlock`, { b: g ? g.P.rareB : 60 });

  // ----- The ⓘ button used on the game screens -----
  function infoButton(id) {
    return `<button type="button" class="info-btn" data-nb="${id}" aria-label="${esc(t('nb.about', { title: title(id) }))}">i</button>`;
  }

  // ----- The notebook button in the top bar -----
  function updateButton() {
    const b = $('notebookBtn');
    if (!b) return;
    const g = SC.session.game, n = newIds(g).length;
    b.innerHTML = `${esc(t('nb.button'))}${n ? ` <span class="nb-badge" aria-hidden="true">${n}</span>` : ''}`;
    b.setAttribute('aria-label', n ? t('nb.buttonLabel', { n }) : t('nb.button'));
  }

  // ----- The notebook pop-up -----
  // focusId: an entry to open right away (it is shown even if not discovered yet).
  function open(focusId, returnTo) {
    const g = SC.session.game;   // no game (title screen): every entry can be read
    if (g) syncGame(g);
    const found = new Set(g ? discovered(g) : ENTRIES.map(e => e.id));
    const fresh = new Set(newIds(g));
    $('notebookTitle').textContent = t('nb.title');
    $('notebookBody').innerHTML = `
      <p class="nb-intro">${esc(t('nb.intro'))}</p>
      ${g ? `<p class="nb-count">${esc(t('nb.count', { n: found.size, total: ENTRIES.length }))}</p>` : ''}
      <div class="nb-list">${ENTRIES.map(e => entryHtml(e, g, found.has(e.id) || e.id === focusId, fresh.has(e.id))).join('')}</div>`;
    $('notebookClose').textContent = t('common.close');
    openDialog($('notebookDialog'), { returnFocus: () => (returnTo && document.contains(returnTo) ? returnTo : null) });
    const target = focusId && $('notebookBody').querySelector(`[data-nb-id="${focusId}"]`);
    if (target) {
      target.open = true;
      markSeen(target);
      target.scrollIntoView({ block: 'start' });
      target.querySelector('summary').focus();
    } else {
      $('notebookTitle').focus();
    }
  }

  function entryHtml(e, g, readable, isNew) {
    if (!readable) {
      return `
        <details class="nb-entry is-locked" data-nb-id="${e.id}">
          <summary><span class="nb-name">${esc(title(e.id))}</span><span class="nb-lock">${esc(t('nb.locked'))}</span></summary>
          <p class="nb-unlock">${esc(t('nb.unlockHint', { how: unlockText(e.id, g) }))}</p>
        </details>`;
    }
    return `
      <details class="nb-entry" data-nb-id="${e.id}">
        <summary><span class="nb-name">${esc(title(e.id))}</span>${isNew ? `<span class="tag is-new">${esc(t('nb.new'))}</span>` : ''}</summary>
        <h4>${esc(t('nb.inGame'))}</h4>
        <p>${esc(t(`nb.${e.id}.game`))}</p>
        <h4>${esc(t('nb.inReality'))}</h4>
        <p>${esc(t(`nb.${e.id}.real`))}</p>
        <p class="nb-source"><a href="${e.source}" target="_blank" rel="noopener">${esc(t('nb.source'))}</a></p>
      </details>`;
  }

  // Opening an entry marks it as read.
  function markSeen(d) {
    if (d.classList.contains('is-locked')) return;
    seen.add(d.dataset.nbId);
    const tag = d.querySelector('.tag.is-new');
    if (tag) tag.remove();
    updateButton();
  }
  function onToggle(e) {
    const d = e.target;
    if (d.open && d.dataset && d.dataset.nbId) markSeen(d);
  }

  function init() {
    // Every element with data-nb opens the notebook (data-nb="" opens it without a chosen entry).
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-nb]');
      if (b) open(b.dataset.nb || null, b);
    });
    $('notebookBody').addEventListener('toggle', onToggle, true);
  }

  SC.notebook = { init, open, infoButton, updateButton, discovered, title, count: ENTRIES.length, has: id => !!byId[id] };
})(globalThis);
