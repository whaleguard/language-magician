/* 언어의 마술사 — 사용자 앱 */
(function () {
  'use strict';

  const { T, STAGES, STAGE_NAMES, COACH, REPLIES, EXPLAIN, COMPAT_NOTES, MONTHS_EN } = I18N;
  const UI_LANGS = ['ko', 'zh', 'ja', 'vi', 'en'];
  const $app = document.getElementById('app');

  /* ================= 공통 유틸 ================= */
  const _qLang = (location.search.match(/[?&]lang=(ko|zh|ja|vi|en)/) || [])[1];
  let uiLang = (Store.me() && Store.me().lang) || _qLang || pickBrowserLang();
  function langUi(code) {
    if (!code) return '';
    try { const dn = new Intl.DisplayNames([uiLang === 'zh' ? 'zh-Hans' : uiLang], { type: 'language' }); const v = dn.of(code); if (v && v !== code) return v.replace(/\s*[（(].*[）)]/, ''); } catch (e) {}
    return langName(code);
  }
  function pickBrowserLang() {
    const n = (navigator.language || 'en').toLowerCase();
    if (n.startsWith('ko')) return 'ko'; if (n.startsWith('zh')) return 'zh'; if (n.startsWith('ja')) return 'ja'; if (n.startsWith('vi')) return 'vi';
    return 'en';
  }
  function t(key, vars) {
    let s = (T[uiLang] && T[uiLang][key]) || T.en[key] || key;
    if (vars) Object.keys(vars).forEach((k) => { s = String(s).split('{' + k + '}').join(vars[k]); });
    return s;
  }
  function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function icon(name, cls) { return `<svg class="icon ${cls || ''}" aria-hidden="true"><use href="#i-${name}"/></svg>`; }
  function langName(l) { return (Engine.LANGS[l] || {}).name || l; }
  function appName(id) { const a = DATA.APPS.find((x) => x.id === id); return a ? a.name : (id || 'Other'); }
  function countryName(id) { const c = DATA.COUNTRIES.find((x) => x.id === id); return c ? (c.flag + ' ' + (c[uiLang] || c.en)) : ''; }
  function initial(name) { const s = String(name || '?').trim(); return esc([...s][0] || '?').toUpperCase(); }
  function avatar(c, size) { return `<span class="avatar ${size || ''} col-${esc(c.color || 'mint')}" lang="${esc(c.lang)}">${initial(c.nickname)}</span>`; }
  function who(c) { return `<span class="who"><span class="dot col-${esc(c.color || 'mint')}">${initial(c.nickname)}</span>${esc(appName(c.app))} / <span lang="${esc(c.lang)}">${esc(c.nickname)}</span></span>`; }
  function whoText(c) { return appName(c.app) + ' / ' + c.nickname; }
  function parseYmd(s) { if (!s) return null; const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
  function fmtDate(d, withYear) {
    if (typeof d === 'string') d = parseYmd(d);
    if (!d) return '';
    const tpl = withYear ? t('date_fmt_y') : t('date_fmt');
    return tpl.replace('{y}', d.getFullYear()).replace('{m}', d.getMonth() + 1).replace('{d}', d.getDate()).replace('{mon}', MONTHS_EN[d.getMonth()]);
  }
  function fmtDateW(d) { if (typeof d === 'string') d = parseYmd(d); if (!d) return ''; return fmtDate(d) + ' (' + t('weekdays')[d.getDay()] + ')'; }
  function shortTs(ts) { const d = new Date(ts); const n = new Date(); if (d.toDateString() === n.toDateString()) return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); const y = new Date(n); y.setDate(n.getDate() - 1); if (d.toDateString() === y.toDateString()) return t('yesterday'); return (d.getMonth() + 1) + '/' + d.getDate(); }
  function fmtTs(ts) { const d = new Date(ts); return fmtDate(d) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function today() { return Engine.ymd(new Date()); }
  function daysBetween(a, b) { return Math.round((parseYmd(b) - parseYmd(a)) / 86400000); }
  function dur(min) { if (min === null || min === undefined) return '—'; if (min < 60) return t('minutes', { n: min }); if (min < 1440) return t('hours', { n: Math.round(min / 60) }); return t('days', { n: Math.round(min / 1440) }); }

  let toastTimer = null;
  function toast(msg) {
    let el = document.getElementById('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }
  function sheet(html, onMount) {
    closeSheet();
    const back = document.createElement('div');
    back.className = 'sheet-back'; back.id = 'sheet';
    back.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
    back.addEventListener('click', (e) => { if (e.target === back) closeSheet(); });
    document.body.appendChild(back);
    if (onMount) onMount(back.querySelector('.sheet'));
    const f = back.querySelector('input, select, textarea, button'); if (f) f.focus();
  }
  function closeSheet() { const s = document.getElementById('sheet'); if (s) s.remove(); }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { ok = false; } ta.remove(); return ok;
    }
  }
  function spinBtn(btn, on, label) {
    if (!btn) return;
    if (on) { btn.dataset.label = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span class="spinner"></span>${esc(label || t('analyzing'))}`; }
    else { btn.disabled = false; if (btn.dataset.label) btn.innerHTML = btn.dataset.label; }
  }
  function tr(text, to, from, ctx) { return Engine.translate(text, to, from, ctx); }

  /* ================= 라우터 ================= */
  function route() {
    const h = location.hash.replace(/^#\/?/, '');
    const [path, qs] = h.split('?');
    const parts = path.split('/').filter(Boolean);
    const q = {}; (qs || '').split('&').filter(Boolean).forEach((kv) => { const [k, v] = kv.split('='); q[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
    return { name: parts[0] || '', id: parts[1] || '', q };
  }
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }
  window.addEventListener('hashchange', render);

  function render() {
    const r = route();
    if (r.name === 'admin') { document.body.classList.add('is-admin'); return window.Admin.render(r); }
    document.body.classList.remove('is-admin');
    const u = Store.me();
    if (!u) return renderOnboarding();
    uiLang = u.lang || uiLang;
    document.documentElement.lang = uiLang === 'zh' ? 'zh-Hans' : uiLang;
    document.title = t('brand') + ' · ' + t('tagline');
    if (u.status === 'banned') return renderBlocked(u);
    const pages = { home: renderChat, today: renderHome, helper: renderChat, chat: renderChat, contacts: renderContacts, contact: renderContact, 'contact-edit': renderContactEdit, coach: renderCoach, agenda: renderAgenda, anniv: renderAnniv, saju: renderSaju, gift: renderGift, culture: renderCulture, settings: renderSettings, guide: renderGuide };
    (pages[r.name] || renderChat)(r);
    window.scrollTo(0, 0); const _mn = document.querySelector('.ws-main'); if (_mn) _mn.scrollTop = 0;
  }

  const WIDE = window.matchMedia('(min-width: 1100px)');
  WIDE.addEventListener('change', () => render());
  function shell(inner, active, opts) {
    const nav = [['chat', 'chat', 'nav_helper'], ['contacts', 'person', 'nav_contacts'], ['agenda', 'calendar', 'nav_agenda'], ['settings', 'settings', 'nav_settings']];
    const navW = nav.concat([['guide', 'help', 'nav_guide']]);
    if (WIDE.matches && !(opts && opts.noNav)) {
      document.body.classList.add('is-wide');
      $app.innerHTML = `<div class="ws">
        <aside class="ws-rail" aria-label="main"><span class="mark" style="margin:4px auto 14px">${icon('brand')}</span>
          ${navW.map(([k, ic, lb]) => `<button type="button" data-go="#/${k}" ${active === k ? 'aria-current="page"' : ''} title="${esc(t(lb))}" ${k === 'guide' ? 'style="margin-top:auto"' : ''}>${icon(ic)}<span>${t(lb)}</span></button>`).join('')}
        </aside>
        <main class="ws-main"><div class="screen">${inner}</div></main>
        <aside class="ws-side">${sideHtml()}</aside>
      </div>`;
      return;
    }
    document.body.classList.remove('is-wide');
    $app.innerHTML = `<div class="screen">${inner}</div>${opts && opts.noNav ? '' : `<nav class="bottom" aria-label="main">${nav.map(([k, ic, lb]) => `<button type="button" data-go="#/${k}" ${active === k ? 'aria-current="page"' : ''}>${icon(ic)}<span>${t(lb)}</span></button>`).join('')}</nav>`}`;
  }

  /* 데스크탑 오른쪽 패널: 대화 중인 상대 목록 + 선택한 상대 정보 */
  function sideHtml() {
    const u = Store.me(); if (!u) return '';
    const r = route();
    const curId = (r.name === 'chat' || r.name === 'contact' || r.name === 'coach' || r.name === 'saju' || r.name === 'gift') ? (r.id || (r.name === 'chat' ? helperState.contactId : '') || '') : (helperState.contactId || '');
    const rows = u.contacts.map((c) => { const ms = Store.messagesOf(c.id, u); const last = ms[ms.length - 1]; return { c, last, ts: last ? last.ts : c.createdAt }; }).sort((a, b) => b.ts - a.ts);
    const c = curId && curId !== 'none' ? u.contacts.find((x) => x.id === curId) : null;
    let info = '';
    if (c) {
      const ms = Store.messagesOf(c.id, u);
      const pf = Engine.profile(ms);
      const td = today();
      const nextP = u.promises.filter((p) => p.contactId === c.id && !p.done && p.date >= td).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 2);
      const ann = annivList(u, c.id).slice(0, 3);
      const rc = Engine.recall({ text: '', dir: 'in', messages: ms, promises: [] });
      const stageKey = STAGES[c.relation || 'friend'][c.stage || 0];
      const tips = (COACH[uiLang] || COACH.en)[stageKey];
      info = `<div class="ws-card">
        <div class="row">${avatar(c)}<div class="grow" style="min-width:0"><strong class="ellipsis" style="display:block" lang="${esc(c.lang)}">${esc(c.nickname)}</strong><span class="tiny muted">${esc(appName(c.app))} · ${esc(langUi(c.lang))}${c.country ? ' · ' + esc(countryName(c.country)) : ''}</span></div></div>
        <div class="row wrap" style="gap:6px"><span class="badge">${esc(t('rel_' + (c.relation || 'friend')))} · ${esc(STAGE_NAMES[uiLang][stageKey])}</span>${c.metAt ? `<span class="badge gray">${esc(t('c_days_met', { n: daysBetween(c.metAt, td) + 1 }))}</span>` : ''}</div>
        ${[c.age ? t('c_age') + ' ' + esc(c.age) : '', c.blood ? esc(c.blood) + (uiLang === 'en' ? '' : '') : '', c.mbti ? esc(c.mbti) : '', c.birthday ? '🎂 ' + fmtDate(c.birthday) : ''].filter(Boolean).length ? `<p class="tiny muted">${[c.age ? t('c_age') + ' ' + esc(c.age) : '', c.blood ? t('c_blood') + ' ' + esc(c.blood) : '', c.mbti ? esc(c.mbti) : '', c.birthday ? '🎂 ' + fmtDate(c.birthday) : ''].filter(Boolean).join(' · ')}</p>` : ''}
      </div>
      ${(() => { const rf = recentFacts(c.id, 5); return rf.length ? `<div class="ws-card"><span class="ws-h">↺ ${t('mem_recent')}</span><div class="facts">${rf.map((f) => `<div class="fact-row"><span class="tiny muted">${esc(fmtDate(f.day))}</span>${factChip(f)}</div>`).join('')}</div></div>` : ''; })()}
      ${pf.count >= 3 ? `<div class="ws-card"><span class="ws-h">${t('c_analysis')}</span>
        <div class="ws-kv"><span>${t('st_formal')}</span><b>${t(pf.formality === 'polite' ? 'formal_polite' : 'formal_casual')}</b></div>
        <div class="ws-kv"><span>${t('st_reply')}</span><b>${dur(pf.replyMinutes)}</b></div>
        <div class="ws-kv"><span>${t('st_mood')}</span><b>${t('mood_' + pf.mood)}</b></div>
        <div class="ws-kv"><span>${t('st_active')}</span><b>${pf.activeHour !== null ? t('hour_at', { n: pf.activeHour }) : '—'}</b></div>
        <div class="stack-xs"><div class="between tiny"><span>${t('st_depth')}</span><b>${pf.depth}/100</b></div><div class="bar"><span style="width:${pf.depth}%"></span></div></div>
        ${pf.topics.length ? `<div class="row wrap" style="gap:4px">${pf.topics.slice(0, 5).map((x) => `<span class="chip" style="font-size:12px;padding:3px 8px">${esc(x)}</span>`).join('')}</div>` : ''}
      </div>` : ''}
      <div class="ws-card"><span class="ws-h">${t('c_dates')}</span>
        ${nextP.map((p) => `<div class="small">📅 ${fmtDateW(p.date)} ${esc(p.time || '')} · ${esc(p.title)}${p.place ? `<br><span class="tiny muted">${esc(p.place)}</span>` : ''}</div>`).join('')}
        ${ann.map((a) => `<div class="small">🎉 ${esc(a.label)} · <b>${a.inDays === 0 ? t('d_today') : t('d_day', { n: a.inDays })}</b></div>`).join('')}
        ${!nextP.length && !ann.length ? `<p class="tiny muted">${t('none')}</p>` : ''}
        <div class="row" style="gap:8px"><button class="btn sm secondary" type="button" data-go="#/agenda?c=${c.id}">${t('add_promise')}</button><button class="btn sm secondary" type="button" data-go="#/gift/${c.id}">🎁</button><button class="btn sm secondary" type="button" data-go="#/saju/${c.id}">☯</button></div>
      </div>
      ${rc.unanswered.length ? `<div class="ws-card" style="background:var(--warm);border-color:#efdfc5"><span class="ws-h" style="color:var(--warm-ink)">${t('mem_unanswered')}</span>${rc.unanswered.slice(-3).map((m) => `<div class="small">💬 ${esc((m.translation || m.text).slice(0, 70))}</div>`).join('')}</div>` : ''}
      <div class="ws-card"><span class="ws-h">${t('coach_next')}</span><p class="small">${esc(tips[0])}</p><p class="tiny" style="color:var(--warm-ink)">⚠ ${esc(tips[1])}</p><button class="link" type="button" data-go="#/coach/${c.id}" style="min-height:28px">${t('coach_link')} ${icon('arrow', 'sm')}</button></div>
      ${c.note ? `<div class="ws-card"><span class="ws-h">${t('c_note')}</span><p class="small" style="white-space:pre-wrap">${esc(c.note)}</p></div>` : ''}`;
    }
    return `<div class="ws-side-in">
      ${filtersHtml(u)}
      <div class="ws-list" id="ws-list">${wsRows(u, curId)}</div>
      ${c ? `<div class="side-info ${chatState.infoOpen ? 'open' : ''}"><button type="button" class="ws-toggle" id="ws-info-toggle" aria-expanded="${!!chatState.infoOpen}"><span>${t('c_info')} · <b lang="${esc(c.lang)}">${esc(c.nickname)}</b></span><span>${chatState.infoOpen ? '▾' : '▴'}</span></button>${chatState.infoOpen ? `<div class="side-info-body">${info}</div>` : ''}</div>` : ''}
    </div>`;
  }
  function filtersHtml(u) {
    const apps = Array.from(new Set(u.contacts.map((x) => x.app)));
    const cnt = (ap) => u.contacts.filter((x) => x.app === ap).length;
    const needN = u.contacts.filter((x) => { const st = convStatus(Store.messagesOf(x.id, u)); return st === 'need' || st === 'new'; }).length;
    return `<div class="side-top">
        <div class="between"><span class="ws-h" style="font-size:13px">${t('all_chat')} <span class="muted">${u.contacts.length}</span></span><button class="btn sm" type="button" data-go="#/contact-edit/new">+ ${t('new_chat')}</button></div>
        <input class="field ws-search" id="ws-search" type="search" placeholder="🔍 ${esc(t('search_ph'))}" value="${esc(chatState.q || '')}">
        <div class="chip-row" id="ws-filters">
          <button type="button" class="chip sm ${!chatState.app && !chatState.needOnly ? 'on' : ''}" data-fapp="">${t('f_all')}</button>
          <button type="button" class="chip sm ${chatState.needOnly ? 'on' : ''}" id="ws-need">${t('st_need')}${needN ? ' ' + needN : ''}</button>
          ${apps.map((ap) => `<button type="button" class="chip sm ${chatState.app === ap ? 'on' : ''}" data-fapp="${esc(ap)}">${appBadge(ap, true)} ${cnt(ap)}</button>`).join('')}
        </div>
        <div class="between tiny muted"><span>${t('sort_by')}</span><select class="field sel-xs" id="ws-sort"><option value="recent" ${chatState.sort !== 'need' && chatState.sort !== 'name' ? 'selected' : ''}>${t('sort_recent')}</option><option value="need" ${chatState.sort === 'need' ? 'selected' : ''}>${t('st_need')}</option><option value="name" ${chatState.sort === 'name' ? 'selected' : ''}>${t('sort_name')}</option></select></div>
      </div>`;
  }
  function wsRows(u, curId) {
    const q = (chatState.q || '').trim().toLowerCase();
    const rows = u.contacts.map((c) => { const ms = Store.messagesOf(c.id, u); const last = ms[ms.length - 1]; return { c, last, st: convStatus(ms), ts: last ? last.ts : c.createdAt }; })
      .filter((r) => (!q || (r.c.nickname + ' ' + appName(r.c.app) + ' ' + (r.c.note || '')).toLowerCase().includes(q)) && (!chatState.needOnly || r.st === 'need' || r.st === 'new') && (!chatState.app || r.c.app === chatState.app))
      .sort((a, b) => chatState.sort === 'name' ? a.c.nickname.localeCompare(b.c.nickname) : chatState.sort === 'need' ? ((b.st === 'need' || b.st === 'new') - (a.st === 'need' || a.st === 'new')) || b.ts - a.ts : b.ts - a.ts);
    return rows.map(({ c: x, last, st }) => `<button type="button" class="ws-item ${x.id === curId ? 'on' : ''}" data-go="#/chat/${x.id}">${avatar(x, 'sm')}<span class="grow" style="min-width:0"><strong class="ellipsis" lang="${esc(x.lang)}" style="display:block">${esc(x.nickname)}</strong><span class="tiny muted ellipsis" style="display:block">${appBadge(x.app)} ${last ? esc(last.dir === 'in' ? (last.translation || last.text) : last.text) : ''}</span></span><span class="ws-right"><span class="tiny muted">${last ? esc(shortTs(last.ts)) : ''}</span>${st ? `<span class="st-pill st-${st}">${t({ new: 'st_new', need: 'st_need', copied: 'st_copied', done: 'st_done' }[st])}</span>` : ''}</span></button>`).join('') || `<p class="tiny muted" style="padding:8px">${t('no_result')}</p>`;
  }
  document.addEventListener('change', (e) => { if (e.target.id === 'ws-sort') { chatState.sort = e.target.value; const u = Store.me(); const l = document.getElementById('ws-list'); if (u && l) l.innerHTML = wsRows(u, helperState.contactId || route().id); } });
  document.addEventListener('input', (e) => { if (e.target.id === 'ws-search') { chatState.q = e.target.value; const u = Store.me(); const l = document.getElementById('ws-list'); if (u && l) l.innerHTML = wsRows(u, helperState.contactId || route().id); } });
  document.addEventListener('click', (e) => {
    const resd = () => { const sd = document.querySelector('.ws-side'); if (sd) sd.innerHTML = sideHtml(); else if (/^#\/chat\/?$/.test(location.hash)) renderChatPicker(); };
    if (e.target.closest('#ws-need')) { chatState.needOnly = !chatState.needOnly; if (chatState.needOnly) chatState.app = ''; resd(); }
    const fa = e.target.closest('[data-fapp]'); if (fa) { chatState.app = fa.dataset.fapp; if (!fa.dataset.fapp) chatState.needOnly = false; resd(); }
    if (e.target.closest('#ws-info-toggle')) { chatState.infoOpen = !chatState.infoOpen; resd(); }
  });

  function topBar(title, back, right) {
    return `<header class="top between"><div class="row grow" style="min-width:0">${back ? `<button class="icon-btn" type="button" data-go="${back}" aria-label="${t('back')}">${icon('back')}</button>` : `<span class="brand"><span class="mark">${icon('brand')}</span>${esc(t('brand'))}</span>`}${title ? `<strong class="ellipsis">${title}</strong>` : ''}</div>${right || ''}</header>`;
  }

  /* 전역 클릭 위임 */
  document.addEventListener('click', (e) => {
    const g = e.target.closest('[data-go]');
    if (g) { e.preventDefault(); go(g.getAttribute('data-go')); }
  });

  /* ================= 온보딩 ================= */
  function renderOnboarding() {
    document.body.classList.remove('is-admin');
    let sel = uiLang;
    const draw = () => {
      uiLang = sel;
      document.documentElement.lang = sel === 'zh' ? 'zh-Hans' : sel;
      $app.innerHTML = `<div class="screen">
        <header class="top row"><span class="brand"><span class="mark">${icon('brand')}</span>${esc(t('brand'))}</span></header>
        <div class="content stack-lg">
          <div class="stack-sm"><h1>${t('ob_title')}</h1><p class="muted">${t('ob_sub')}</p></div>
          <div class="card language-select" role="radiogroup">
            ${UI_LANGS.map((l) => `<label class="inline-input" lang="${l}"><input type="radio" name="lang" value="${l}" ${l === sel ? 'checked' : ''}> ${esc(T[l].brand === T.en.brand ? langName(l) : langName(l) + ' · ' + T[l].brand)}</label>`).join('')}
          </div>
          <form class="stack" id="ob-form">
            <fieldset class="card stack-sm"><legend class="label">${t('ob_mode')}</legend>
              <label class="inline-input"><input type="radio" name="mode" value="guest" checked> ${t('ob_guest')}</label>
              <label class="inline-input"><input type="radio" name="mode" value="member"> ${t('ob_nick')}</label>
              <label class="stack-sm" id="nick-wrap" hidden><span class="label">${t('ob_nick_label')}</span><input class="field" id="ob-nick" maxlength="24" placeholder="${esc(t('ob_nick_ph'))}" autocomplete="nickname"></label>
              <p class="small muted">${t('ob_nick_hint')}</p>
              <label class="inline-input small"><input type="checkbox" id="ob-sample" checked> ${t('ob_sample')}</label>
            </fieldset>
            <div class="card stack-sm">
              <h2>${t('ob_consent_title')}</h2>
              <p class="small muted">${t('ob_consent_body')}</p>
              <p class="small muted">${t('ob_consent_body2')}</p>
              <label class="inline-input consent small"><input type="checkbox" id="ob-consent"> <span>${t('ob_consent_check')}</span></label>
            </div>
            <button class="btn full" type="submit">${t('ob_start')} ${icon('arrow')}</button>
          </form>
        </div></div>`;
      $app.querySelectorAll('input[name="lang"]').forEach((r) => r.addEventListener('change', () => { sel = r.value; draw(); }));
      $app.querySelectorAll('input[name="mode"]').forEach((r) => r.addEventListener('change', () => { document.getElementById('nick-wrap').hidden = r.value !== 'member' || !r.checked; }));
      document.getElementById('ob-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const mode = $app.querySelector('input[name="mode"]:checked').value;
        const nick = (document.getElementById('ob-nick').value || '').trim();
        if (mode === 'member' && !nick) { toast(t('ob_need_nick')); document.getElementById('ob-nick').focus(); return; }
        if (!document.getElementById('ob-consent').checked) { toast(t('ob_need_consent')); return; }
        const u = Store.createUser({ type: mode, nickname: nick, lang: sel });
        if (document.getElementById('ob-sample').checked) { Store.loadSamples(u, sel); }
        go('#/guide');
      });
    };
    draw();
  }

  function renderBlocked(u) {
    $app.innerHTML = `<div class="screen"><header class="top row"><span class="brand"><span class="mark">${icon('brand')}</span>${esc(t('brand'))}</span></header>
      <div class="content stack-lg"><div class="card danger stack-sm"><h1>${t('blocked_title')}</h1><p>${t('blocked_body')}</p>${u.banReason ? `<p class="small">${esc(u.banReason)}</p>` : ''}</div>
      <p class="small muted">ID · ${esc(u.id)}</p></div></div>`;
  }

  /* ================= 오늘 챙길 것 계산 ================= */
  function agendaItems(u) {
    const td = today();
    const items = [];
    u.promises.filter((p) => !p.done).forEach((p) => {
      const c = u.contacts.find((x) => x.id === p.contactId);
      if (!p.date) return;
      if (p.date < td) items.push({ kind: 'overdue', p, c, sort: 0 });
      else if (p.date === td) items.push({ kind: 'today', p, c, sort: 1 });
      else if (daysBetween(td, p.date) <= 14) items.push({ kind: 'upcoming', p, c, sort: 3 });
    });
    annivList(u).filter((a) => a.inDays <= 7).forEach((a) => items.push({ kind: 'anniv', a, c: a.c, sort: a.inDays === 0 ? 1 : 2 }));
    u.contacts.forEach((c) => {
      const ms = Store.messagesOf(c.id, u);
      const last = ms[ms.length - 1];
      if (last && last.dir === 'in') {
        const hrs = (Date.now() - last.ts) / 3600000;
        if (Engine.RX.question.test(last.text) || Engine.RX.invite.test(last.text) || hrs > 12) items.push({ kind: 'unanswered', c, m: last, sort: 2 });
      }
    });
    return items.sort((a, b) => a.sort - b.sort);
  }

  function nextOccurrence(md, from) {
    // md: 'MM-DD' → 다음 해당일
    const [m, d] = md.split('-').map(Number);
    const base = from || new Date(); base.setHours(0, 0, 0, 0);
    let dt = new Date(base.getFullYear(), m - 1, d);
    if (dt < base) dt = new Date(base.getFullYear() + 1, m - 1, d);
    return dt;
  }
  function holidayDate(rule, year) {
    const [type, arr] = [rule[2], rule[3]];
    if (type === 'fixed') return new Date(year, arr[0] - 1, arr[1]);
    if (type === 'lunar') { const s = Saju.lunarToSolar(year, arr[0], arr[1], false); return s ? new Date(s.y, s.m - 1, s.d) : null; }
    if (type === 'nthWeekday') { const [m, wd, n] = arr; const first = new Date(year, m - 1, 1); const off = (wd - first.getDay() + 7) % 7; return new Date(year, m - 1, 1 + off + (n - 1) * 7); }
    return null;
  }
  function annivList(u, contactId) {
    const out = [];
    const base = new Date(); base.setHours(0, 0, 0, 0);
    const inDays = (d) => Math.round((d - base) / 86400000);
    const contacts = u.contacts.filter((c) => !contactId || c.id === contactId);
    contacts.forEach((c) => {
      if (c.birthday) {
        let md = c.birthday.slice(5);
        let dt = nextOccurrence(md);
        if (c.birthLunar) {
          const [, lm, ld] = c.birthday.split('-').map(Number);
          const y = base.getFullYear();
          let s = Saju.lunarToSolar(y, lm, ld, false);
          let d2 = s ? new Date(s.y, s.m - 1, s.d) : null;
          if (!d2 || d2 < base) { s = Saju.lunarToSolar(y + 1, lm, ld, false); d2 = s ? new Date(s.y, s.m - 1, s.d) : dt; }
          dt = d2;
        }
        out.push({ type: 'birthday', c, date: dt, inDays: inDays(dt), label: t('birthday') + (c.birthLunar ? ' (' + t('lunar') + ')' : '') });
      }
      if (c.metAt) {
        const met = parseYmd(c.metAt);
        const daysSince = Math.round((base - met) / 86400000) + 1; // 만난 날 = 1일
        [100, 200, 300, 500, 1000].forEach((n) => {
          const d = new Date(met); d.setDate(d.getDate() + n - 1);
          if (d >= base && inDays(d) <= 120) out.push({ type: 'met', n, c, date: d, inDays: inDays(d), label: t('d_plus', { n }) });
        });
        for (let y = 1; y <= 10; y++) {
          const d = new Date(met); d.setFullYear(met.getFullYear() + y);
          if (d >= base) { if (inDays(d) <= 120) out.push({ type: 'metyear', n: y, c, date: d, inDays: inDays(d), label: '🎉 ' + y + (uiLang === 'en' ? ' yr' : uiLang === 'ko' ? '주년' : uiLang === 'zh' ? '周年' : uiLang === 'ja' ? '周年' : ' năm') }); break; }
        }
        out.daysSince = daysSince;
      }
      const hs = DATA.HOLIDAYS[c.country] || [];
      hs.forEach((h) => {
        let d = holidayDate(h, base.getFullYear());
        if (d && d < base) d = holidayDate(h, base.getFullYear() + 1);
        if (d && inDays(d) <= 45) out.push({ type: 'holiday', c, date: d, inDays: inDays(d), label: uiLang === 'ko' ? h[0] : h[1], holiday: h });
      });
    });
    u.anniversaries.filter((a) => !contactId || a.contactId === contactId).forEach((a) => {
      const c = u.contacts.find((x) => x.id === a.contactId);
      let d = a.repeat ? nextOccurrence(a.date.slice(5)) : parseYmd(a.date);
      if (d && (a.repeat || d >= base)) out.push({ type: 'custom', c, date: d, inDays: inDays(d), label: a.name, id: a.id, repeat: a.repeat });
    });
    return out.filter((x) => x.c || x.type === 'custom').sort((a, b) => a.inDays - b.inDays);
  }

  function itemText(it) {
    const who = it.c ? esc(it.c.nickname) + ' · ' : '';
    if (it.kind === 'overdue' || it.kind === 'today' || it.kind === 'upcoming') return (it.kind === 'overdue' ? '⏰ ' : '📅 ') + who + (it.kind === 'today' ? t('d_today') : fmtDateW(it.p.date)) + ' ' + esc(it.p.time || '') + ' ' + esc(it.p.title);
    if (it.kind === 'anniv') return '🎉 ' + who + (it.a.inDays === 0 ? t('d_today') : t('d_day', { n: it.a.inDays })) + ' ' + esc(it.a.label);
    if (it.kind === 'unanswered') return '💬 ' + who + esc(t('unanswered_from'));
    return '';
  }
  function itemHtml(it) {
    const c = it.c;
    const av = c ? avatar(c) : `<span class="avatar">${icon('calendar')}</span>`;
    const lab = c ? `<span class="label">${esc(whoText(c))}</span>` : '';
    if (it.kind === 'overdue' || it.kind === 'today' || it.kind === 'upcoming') {
      const p = it.p;
      return `<li><button class="list-row" type="button" data-go="#/agenda">${av}<span class="grow">${lab}<br><strong>${it.kind === 'overdue' ? `<span class="badge alert">${t('overdue')}</span> ` : ''}${it.kind === 'today' ? t('d_today') : fmtDateW(p.date)} ${esc(p.time || '')} · ${esc(p.title)}</strong>${p.place ? `<br><span class="small muted">${esc(p.place)}</span>` : ''}</span>${icon('arrow', 'chev')}</button></li>`;
    }
    if (it.kind === 'anniv') {
      const a = it.a;
      return `<li><button class="list-row" type="button" data-go="#/gift/${c ? c.id : ''}">${av}<span class="grow">${lab}<br><strong>${a.inDays === 0 ? t('d_today') : t('d_day', { n: a.inDays })} · ${esc(a.label)}</strong><br><span class="small muted">${fmtDateW(a.date)}</span></span>${icon('arrow', 'chev')}</button></li>`;
    }
    if (it.kind === 'unanswered') {
      return `<li><button class="list-row" type="button" data-go="#/chat/${c.id}">${av}<span class="grow">${lab}<br><strong>${t('unanswered_from')}</strong><br><span class="small muted ellipsis" style="display:block">${esc(it.m.translation || it.m.text)}</span></span>${icon('arrow', 'chev')}</button></li>`;
    }
    return '';
  }

  /* ================= 연락처 선택 블록 ================= */
  function contactPicker(u, selId, idName) {
    const c = selId ? u.contacts.find((x) => x.id === selId) : null;
    return `<div class="card stack-sm ${c ? 'edge-' + c.color : ''}">
      <div class="row">${c ? avatar(c) : `<span class="avatar">${icon('person')}</span>`}
        <div class="grow"><label class="label" for="${idName}">${t('pick_contact')}</label><div>${c ? `<strong>${esc(appName(c.app))}</strong> / <span lang="${esc(c.lang)}">${esc(c.nickname)}</span> · <span class="small muted">${esc(langUi(c.lang))}</span>` : `<span class="small muted">${t('no_contact')}</span>`}</div></div>
      </div>
      <select class="field" id="${idName}">
        <option value="">${t('no_contact')}</option>
        ${u.contacts.map((x) => `<option value="${x.id}" ${x.id === selId ? 'selected' : ''}>${esc(appName(x.app))} / ${esc(x.nickname)} (${esc(langUi(x.lang))})</option>`).join('')}
      </select>
      <button class="link" type="button" data-go="#/contact-edit/new">${icon('person', 'sm')} ${t('add_contact')}</button>
    </div>`;
  }

  /* ================= 홈 ================= */
  let homeTab = 'in';
  let homeContact = null;
  function renderHome() {
    const u = Store.me();
    if (homeContact && !u.contacts.find((c) => c.id === homeContact)) homeContact = null;
    const c = homeContact ? Store.contact(homeContact) : null;
    const target = c ? c.lang : (uiLang === 'en' ? 'ko' : 'en');
    const items = agendaItems(u).filter((x) => x.kind !== 'upcoming').slice(0, 5);
    const langOpts = Object.keys(Engine.LANGS).filter((l) => l !== uiLang);
    shell(`${topBar('', null, `<button class="icon-btn" type="button" data-go="#/settings" aria-label="${t('nav_settings')}">${icon('settings')}</button>`)}
    <div class="content stack-lg">
      <div class="hero stack">
        <div class="stack-sm"><h1>${t('home_hero')}</h1><p class="small">${t('home_hero_sub')}</p></div>
        <div class="hero-tabs" role="tablist">
          <button type="button" role="tab" data-tab="in" aria-selected="${homeTab === 'in'}">${t('tab_in')}</button>
          <button type="button" role="tab" data-tab="out" aria-selected="${homeTab === 'out'}">${t('tab_out')}</button>
        </div>
      </div>
      ${contactPicker(u, homeContact, 'home-contact')}
      <div class="card stack-sm" id="home-in" ${homeTab === 'in' ? '' : 'hidden'}>
        <div class="between wrap"><h2>${t('tab_in')}</h2><span class="badge" id="in-pair">→ ${esc(langName(uiLang))}</span></div>
        <label class="label" for="in-text">${t('paste_label')}</label>
        <textarea class="field" id="in-text" rows="3" placeholder="…"></textarea>
        <div class="between wrap">
          <button class="link" type="button" id="in-paste">${icon('copy', 'sm')} ${t('paste_btn')}</button>
          <button class="btn" type="button" id="in-go">${t('translate_to_mine')}</button>
        </div>
        <div class="translation stack-sm" id="in-result" hidden><span class="label">${t('result_mine')}</span><p id="in-out" lang="${uiLang}"></p></div>
        <button class="btn subtle full" type="button" id="in-helper" hidden>${t('open_helper')} ${icon('arrow')}</button>
      </div>
      <div class="card stack-sm" id="home-out" ${homeTab === 'out' ? '' : 'hidden'}>
        <div class="between wrap"><h2>${t('tab_out')}</h2>
          <label class="small row">${t('send_lang')} <select class="field" id="out-lang" style="width:auto;min-height:36px;padding:4px 30px 4px 10px">${langOpts.map((l) => `<option value="${l}" ${l === target ? 'selected' : ''}>${esc(langName(l))}</option>`).join('')}</select></label>
        </div>
        <label class="label" for="out-text">${t('write_label')}</label>
        <textarea class="field" id="out-text" rows="3" lang="${uiLang}"></textarea>
        <button class="btn secondary full" type="button" id="out-go">${t('translate_to_theirs')}</button>
        <div class="translation stack-sm" id="out-result" hidden>
          <span class="label">${t('result_theirs')}${c ? ' · ' + esc(whoText(c)) : ''}</span>
          <p id="out-out"></p>
          <p class="small muted" id="out-back"></p>
        </div>
        <button class="btn full" type="button" id="out-copy" hidden>${icon('copy')} ${t('copy_theirs')}</button>
      </div>
      <div class="stack-sm">
        <div class="between"><h2>${t('today')}</h2><button class="link" type="button" data-go="#/agenda">${t('see_all')}</button></div>
        ${items.length ? `<ul class="list card" style="padding-block:4px">${items.map(itemHtml).join('')}</ul>` : `<div class="empty small">${t('nothing_today')}</div>`}
      </div>
      <div class="stack-sm">
        <div class="between"><h2>${t('contacts')}</h2><button class="btn secondary sm" type="button" data-go="#/contact-edit/new">${t('add_contact')}</button></div>
        ${contactListHtml(u)}
      </div>
    </div>`, 'home');

    $app.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { homeTab = b.dataset.tab; renderHome(); }));
    document.getElementById('home-contact').addEventListener('change', (e) => { homeContact = e.target.value || null; renderHome(); });
    document.getElementById('in-paste').addEventListener('click', async () => {
      try { const s = await navigator.clipboard.readText(); if (s) document.getElementById('in-text').value = s; } catch (e) { document.getElementById('in-text').focus(); }
    });
    let lastIn = null;
    document.getElementById('in-go').addEventListener('click', async (ev) => {
      const text = document.getElementById('in-text').value.trim();
      if (!text) { document.getElementById('in-text').focus(); return; }
      spinBtn(ev.currentTarget, true);
      try {
        const from = Engine.detect(text);
        document.getElementById('in-pair').textContent = langName(from) + ' → ' + langName(uiLang);
        const r = await tr(text, uiLang, from);
        document.getElementById('in-out').textContent = r.text;
        document.getElementById('in-result').hidden = false;
        document.getElementById('in-helper').hidden = false;
        lastIn = Store.addMessage({ contactId: homeContact, dir: 'in', text, lang: from, translation: r.text, trLang: uiLang, source: 'home', intents: Engine.intents(text + ' ' + r.text), risk: riskOf(text + ' ' + r.text) });
      } catch (e) { toast(t('trans_fail')); }
      spinBtn(ev.currentTarget, false);
    });
    document.getElementById('in-helper').addEventListener('click', () => {
      go('#/chat/' + (homeContact || 'none'));
    });
    let outText = '';
    document.getElementById('out-go').addEventListener('click', async (ev) => {
      const text = document.getElementById('out-text').value.trim();
      if (!text) { document.getElementById('out-text').focus(); return; }
      const to = document.getElementById('out-lang').value;
      spinBtn(ev.currentTarget, true);
      try {
        const r = await tr(text, to, uiLang, { relation: c ? c.relation : '' });
        outText = r.text;
        const o = document.getElementById('out-out'); o.textContent = r.text; o.lang = to;
        document.getElementById('out-result').hidden = false;
        document.getElementById('out-copy').hidden = false;
        const back = await tr(r.text, uiLang, to).catch(() => null);
        document.getElementById('out-back').textContent = back ? t('meaning') + ' · ' + back.text : '';
      } catch (e) { toast(t('trans_fail')); }
      spinBtn(ev.currentTarget, false);
    });
    document.getElementById('out-copy').addEventListener('click', async () => {
      const text = document.getElementById('out-text').value.trim();
      await copyText(outText);
      Store.addMessage({ contactId: homeContact, dir: 'out', text, lang: uiLang, translation: outText, trLang: document.getElementById('out-lang').value, source: 'home' });
      toast(t('copied', { app: c ? appName(c.app) : 'messenger' }));
    });
  }

  function riskOf(s) { return Engine.intents(s).filter((x) => x === 'money' || x === 'offplatform'); }

  function contactListHtml(u) {
    if (!u.contacts.length) return `<div class="empty small">${t('add_contact')}</div>`;
    const rows = u.contacts.map((c) => {
      const ms = Store.messagesOf(c.id, u);
      const last = ms[ms.length - 1];
      return { c, last, ts: last ? last.ts : c.createdAt };
    }).sort((a, b) => b.ts - a.ts);
    return `<ul class="list card" style="padding-block:2px">${rows.map(({ c, last }) => {
      const stageName = STAGE_NAMES[uiLang][STAGES[c.relation || 'friend'][c.stage || 0]] || '';
      const unanswered = last && last.dir === 'in';
      return `<li><button class="list-row" type="button" data-go="#/contact/${c.id}">${avatar(c)}<span class="grow" style="min-width:0"><span class="row" style="gap:6px"><strong class="ellipsis" lang="${esc(c.lang)}">${esc(c.nickname)}</strong>${unanswered ? '<span class="badge warning">●</span>' : ''}</span><span class="small muted ellipsis" style="display:block">${esc(appName(c.app))} · ${esc(langUi(c.lang))} · ${esc(t('rel_' + (c.relation || 'friend')))} · ${esc(stageName)}</span>${last ? `<span class="small ellipsis" style="display:block">${esc(last.dir === 'in' ? (last.translation || last.text) : last.text)}</span>` : ''}</span>${icon('arrow', 'chev')}</button></li>`;
    }).join('')}</ul>`;
  }

  /* ================= 연락처 목록 ================= */
  function renderContacts() {
    const u = Store.me();
    shell(`${topBar(t('contacts'), null, `<button class="btn sm" type="button" data-go="#/contact-edit/new">${t('add_contact')}</button>`)}
      <div class="content stack">
        <input class="field" id="c-search" type="search" placeholder="🔍 ${esc(t('contacts'))}">
        <div id="c-list">${contactListHtml(u)}</div>
      </div>`, 'contacts');
    document.getElementById('c-search').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      $app.querySelectorAll('#c-list li').forEach((li) => { li.hidden = q && !li.textContent.toLowerCase().includes(q); });
    });
  }

  /* ================= 대화 도우미 ================= */
  const helperState = { mode: 'in', contactId: null, text: '', result: null, msgId: null, outText: '', outResult: null, tone: 'warm', dir: 0 };
  function renderHelper(r) {
    const u = Store.me();
    if (r.q.c !== undefined) helperState.contactId = r.q.c || null;
    if (r.q.m) {
      const m = u.messages.find((x) => x.id === r.q.m);
      if (m && m.id !== helperState.msgId) { helperState.text = m.text; helperState.msgId = m.id; helperState.mode = m.dir === 'in' ? 'in' : 'out'; helperState.result = null; if (m.contactId) helperState.contactId = m.contactId; }
    }
    if (r.q.mode) helperState.mode = r.q.mode;
    if (helperState.contactId && !Store.contact(helperState.contactId)) helperState.contactId = null;
    const c = helperState.contactId ? Store.contact(helperState.contactId) : null;
    const ai = !!Engine.aiConfig().key;
    shell(`${topBar(t('helper_title'), '#/home', c ? `<button class="link" type="button" data-go="#/contact/${c.id}">${esc(c.nickname)}</button>` : '')}
      <div class="content stack-lg">
        ${contactPicker(u, helperState.contactId, 'helper-contact')}
        <div class="seg" role="tablist">
          <button type="button" data-mode="in" aria-pressed="${helperState.mode === 'in'}">${t('mode_in')}</button>
          <button type="button" data-mode="out" aria-pressed="${helperState.mode === 'out'}">${t('mode_out')}</button>
          <span class="badge ${ai ? '' : 'gray'}" style="margin-left:auto;align-self:center">${ai ? t('ai_on') : t('ai_off')}</span>
        </div>
        ${helperState.mode === 'in' ? helperInHtml(c) : helperOutHtml(c)}
        <div id="helper-result">${helperState.mode === 'in' && helperState.result ? resultHtml(c, helperState.result) : ''}${helperState.mode === 'out' && helperState.outResult ? outResultHtml(c, helperState.outResult) : ''}</div>
        ${ai ? '' : `<p class="small muted">${t('ai_hint')} <button class="link" type="button" data-go="#/settings">${t('nav_settings')}</button></p>`}
      </div>`, 'helper');

    document.getElementById('helper-contact').addEventListener('change', (e) => { helperState.contactId = e.target.value || null; helperState.result = null; helperState.outResult = null; renderHelper({ q: {} }); });
    $app.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { helperState.mode = b.dataset.mode; renderHelper({ q: {} }); }));
    if (helperState.mode === 'in') bindHelperIn(c); else bindHelperOut(c);
    if (helperState.mode === 'in' && helperState.result) bindResult(c, helperState.result);
    if (helperState.mode === 'out' && helperState.outResult) bindOutResult(c, helperState.outResult);
  }

  function helperInHtml(c) {
    return `<div class="card stack-sm">
      <div class="between wrap"><h3>${t('received')}</h3>${c ? who(c) : ''}</div>
      <label class="label" for="h-src">${t('share_hint')}</label>
      <textarea class="field" id="h-src" rows="4" ${c ? `lang="${esc(c.lang)}"` : ''}>${esc(helperState.text)}</textarea>
      <div class="between wrap">
        <button class="link" type="button" id="h-paste">${icon('copy', 'sm')} ${t('paste_btn')}</button>
        <label class="link" style="cursor:pointer">${icon('image', 'sm')} ${t('upload_shot')}<input type="file" id="h-shot" accept="image/*" hidden></label>
      </div>
      <p class="small muted" id="h-ocr" hidden></p>
      <button class="btn full" type="button" id="h-go">${t('analyze')}</button>
    </div>`;
  }
  function helperOutHtml(c) {
    return `<div class="card stack-sm">
      <div class="between wrap"><h3>${t('mine')}</h3>${c ? who(c) : ''}</div>
      <label class="label" for="h-mine">${t('write_label')}</label>
      <textarea class="field" id="h-mine" rows="4" lang="${uiLang}">${esc(helperState.outText)}</textarea>
      <div class="seg" role="group">${['short', 'warm', 'polite'].map((tn) => `<button type="button" data-tone="${tn}" aria-pressed="${helperState.tone === tn}">${t('tone_' + tn)}</button>`).join('')}</div>
      ${c ? '' : `<label class="small row">${t('send_lang')} <select class="field" id="h-to" style="width:auto">${Object.keys(Engine.LANGS).filter((l) => l !== uiLang).map((l) => `<option value="${l}">${esc(langName(l))}</option>`).join('')}</select></label>`}
      <button class="btn full" type="button" id="h-out-go">${t('translate_ctx')}</button>
    </div>`;
  }

  function bindHelperIn(c) {
    const src = document.getElementById('h-src');
    src.addEventListener('input', () => { helperState.text = src.value; });
    document.getElementById('h-paste').addEventListener('click', async () => { try { const s = await navigator.clipboard.readText(); if (s) { src.value = s; helperState.text = s; } } catch (e) { src.focus(); } });
    document.getElementById('h-shot').addEventListener('change', (e) => { const f = e.target.files[0]; if (f) runOcr(f, src); });
    document.getElementById('h-go').addEventListener('click', async (ev) => {
      const text = src.value.trim();
      if (!text) { src.focus(); return; }
      helperState.text = text;
      spinBtn(ev.currentTarget, true);
      try {
        helperState.result = await analyzeIncoming(c, text);
        renderHelper({ q: {} });
        const el = document.getElementById('helper-result'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (e) { console.error(e); toast(t('trans_fail')); spinBtn(ev.currentTarget, false); }
    });
  }
  function bindHelperOut(c) {
    const mine = document.getElementById('h-mine');
    mine.addEventListener('input', () => { helperState.outText = mine.value; });
    $app.querySelectorAll('[data-tone]').forEach((b) => b.addEventListener('click', () => { helperState.tone = b.dataset.tone; $app.querySelectorAll('[data-tone]').forEach((x) => x.setAttribute('aria-pressed', x === b)); }));
    document.getElementById('h-out-go').addEventListener('click', async (ev) => {
      const text = mine.value.trim(); if (!text) { mine.focus(); return; }
      helperState.outText = text;
      const to = c ? c.lang : document.getElementById('h-to').value;
      spinBtn(ev.currentTarget, true);
      try {
        const r = await tr(text, to, uiLang, { tone: helperState.tone, relation: c ? c.relation : '' });
        const back = await tr(r.text, uiLang, to).catch(() => ({ text: '' }));
        const u = Store.me();
        const rec = c ? Engine.recall({ text, dir: 'out', messages: Store.messagesOf(c.id), promises: u.promises.filter((p) => p.contactId === c.id) }) : null;
        helperState.outResult = { text: r.text, to, back: back.text, provider: r.provider, recall: rec, src: text };
        renderHelper({ q: {} });
      } catch (e) { toast(t('trans_fail')); spinBtn(ev.currentTarget, false); }
    });
  }

  async function runOcr(file, target) {
    const note = document.getElementById('h-ocr');
    note.hidden = false; note.textContent = t('ocr_running');
    const cfg = Engine.aiConfig();
    try {
      let text = '';
      if (cfg.key && cfg.provider !== 'openai') {
        const b64 = await fileToB64(file);
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': cfg.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
          body: JSON.stringify({ model: cfg.model || 'claude-haiku-5-5', max_tokens: 1500, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: file.type || 'image/png', data: b64 } }, { type: 'text', text: 'Transcribe the chat messages in this screenshot exactly, one message per line, oldest first. Prefix messages from the other person (usually left side) with "THEM: " and from the phone owner (usually right side) with "ME: ". Output only the transcript.' }] }] }),
        });
        if (!r.ok) throw new Error('vision');
        const j = await r.json(); text = (j.content || []).map((x) => x.text || '').join('');
        // 상대 메시지만 분석 대상으로
        const them = text.split('\n').filter((l) => /^THEM:/i.test(l)).map((l) => l.replace(/^THEM:\s*/i, ''));
        if (them.length) text = them.join('\n');
      } else {
        if (!window.Tesseract) await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
        const c = helperState.contactId ? Store.contact(helperState.contactId) : null;
        const map = { ko: 'kor', zh: 'chi_sim', 'zh-TW': 'chi_tra', ja: 'jpn', vi: 'vie', en: 'eng', th: 'tha', ru: 'rus', id: 'ind', es: 'spa' };
        const langs = [map[c ? c.lang : 'en'] || 'eng', map[uiLang] || 'eng', 'eng'].filter((x, i, a) => a.indexOf(x) === i).join('+');
        const res = await window.Tesseract.recognize(file, langs);
        text = (res.data.text || '').replace(/[ \t]+\n/g, '\n').replace(/\n{2,}/g, '\n').trim();
        if (/chi|jpn/.test(langs)) text = text.replace(/([぀-ヿ一-鿿])\s+(?=[぀-ヿ一-鿿])/g, '$1');
      }
      if (!text.trim()) throw new Error('empty');
      target.value = text.trim(); helperState.text = text.trim();
      note.textContent = t('ocr_done');
      helperState.source = 'ocr';
    } catch (e) { note.textContent = t('ocr_fail'); }
  }
  function fileToB64(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(file); }); }
  function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }

  /* ---------- 받은 말 분석 ---------- */
  function pickReplySet(intents) {
    const order = ['invite', 'negative', 'busy', 'affection', 'sorry', 'thanks', 'question', 'positive'];
    for (const k of order) if (intents.includes(k)) return k;
    return 'general';
  }
  function fmtWhenUi(w) {
    if (!w) return '';
    const parts = [];
    if (w.date) parts.push(w.date === today() ? t('d_today') : fmtDateW(w.date));
    if (w.time) parts.push(w.time);
    return parts.join(' ');
  }

  async function analyzeIncoming(c, text, opts) {
    const u = Store.me();
    const from = Engine.detect(text);
    const history = c ? Store.messagesOf(c.id).filter((x) => !(opts && opts.existing) || x.ts < opts.existing.ts) : [];
    const res = { text, from, provider: 'mt' };
    let ai = null;
    if (Engine.aiConfig().key && c) {
      try {
        const stage = STAGE_NAMES.en[STAGES[c.relation || 'friend'][c.stage || 0]];
        ai = await Engine.aiAnalyze({ uiLang, contact: c, text, dir: 'in', history, stageName: stage });
        res.provider = 'ai';
      } catch (e) { ai = null; }
    }
    const trn = ai && ai.translation ? { text: ai.translation } : await tr(text, uiLang, from);
    res.translation = trn.text;
    const both = text + '\n' + res.translation;
    res.intents = Engine.intents(both);
    res.risk = res.intents.filter((x) => x === 'money' || x === 'offplatform');
    res.when = Engine.extractWhen(text) || Engine.extractWhen(res.translation);
    res.place = Engine.extractPlace(text) || Engine.extractPlace(res.translation);
    const ex = EXPLAIN[uiLang];
    // 뉘앙스
    const nu = [];
    if (ai && ai.nuance) nu.push(ai.nuance);
    else {
      if (res.intents.includes('invite')) nu.push(ex.n_invite);
      if (res.intents.includes('question') && res.intents.includes('invite')) nu.push(ex.n_soft);
      else if (res.intents.includes('question')) nu.push(ex.n_question);
      ['busy', 'thanks', 'sorry', 'negative', 'affection', 'positive'].forEach((k) => { if (res.intents.includes(k)) nu.push(ex['n_' + k]); });
      const f = Engine.formality(text, from);
      nu.push(f === 'polite' ? ex.n_polite : ex.n_casual);
      if (/[\u{1F300}-\u{1FAFF}]|ㅋㅋ|ㅎㅎ|哈哈|www|笑|haha|lol/u.test(text)) nu.push(ex.n_emoji);
      if (nu.length === 1) nu.unshift(ex.n_general);
    }
    res.nuance = nu;
    // 상황(사실)
    const facts = [];
    if (ai && Array.isArray(ai.facts)) facts.push(...ai.facts);
    else {
      if (res.when) facts.push(ex.s_when.replace('{when}', fmtWhenUi(res.when)));
      if (res.place) facts.push(ex.s_place.replace('{place}', res.place));
      if (res.intents.includes('question') || res.intents.includes('invite')) facts.push(ex.s_wait);
    }
    if (res.risk.includes('money')) facts.push(ex.s_money);
    res.facts = facts;
    if (ai && ai.situation) res.situation = ai.situation;
    // 추정
    const inf = [];
    if (ai && Array.isArray(ai.inferences)) inf.push(...ai.inferences);
    if (c && history.length >= 3) {
      const pf = Engine.profile(history);
      const lastOut = [...history].reverse().find((m) => m.dir === 'out');
      if (lastOut && pf.replyMinutes) {
        const gap = (Date.now() - lastOut.ts) / 60000;
        if (gap < pf.replyMinutes * 0.5) inf.push(ex.i_reply_fast); else if (gap > pf.replyMinutes * 2.5 && gap < 60 * 24 * 7) inf.push(ex.i_reply_slow);
      }
      if (pf.initiative >= 0.6) inf.push(ex.i_initiative);
      if (pf.formality) inf.push(ex.i_style.replace('{formal}', t(pf.formality === 'polite' ? 'formal_polite' : 'formal_casual')).replace('{len}', pf.avgLen));
    }
    res.inferences = inf;
    // 지난 대화 기억
    res.recall = c ? Engine.recall({ text, textTranslated: res.translation, dir: 'in', messages: history, promises: u.promises.filter((p) => p.contactId === c.id) }) : null;
    // 답장 초안
    const target = c ? c.lang : from;
    let replies = [];
    if (ai && Array.isArray(ai.replies) && ai.replies.length) {
      replies = ai.replies.slice(0, 3).map((r) => ({ label: r.label, text: r.text, meaning: r.meaning, src: r.meaning }));
    } else {
      const set = pickReplySet(res.intents);
      const tpl = REPLIES[uiLang][set];
      const whenTxt = res.when ? fmtWhenUi(res.when) + ' ' : '';
      const placeTxt = res.place ? res.place + (uiLang === 'ko' ? '에서' : uiLang === 'en' ? ' at ' : ' ') : '';
      const built = tpl.map(([lab, s]) => {
        let x = s.replace('{when}', whenTxt).replace('{place}', uiLang === 'en' ? (res.place ? 'at ' + res.place : '') : placeTxt).replace('{answer}', REPLIES[uiLang].answer_ph);
        x = x.replace(/\s{2,}/g, ' ').replace(/\s+([!?.,])/g, '$1');
        return { label: t(lab), src: x };
      });
      const outs = await Promise.all(built.map((b) => tr(b.src, target, uiLang, { relation: c ? c.relation : '' }).catch(() => ({ text: '' }))));
      replies = built.map((b, i) => ({ label: b.label, src: b.src, text: outs[i].text, meaning: b.src }));
    }
    res.replies = replies;
    res.target = target;
    res.culture = ai && ai.culture ? ai.culture : cultureTipFor(c);
    res.coach = ai && ai.coach ? ai.coach : null;
    res.avoid = ai && ai.avoid ? ai.avoid : null;
    // 저장(관리자 모니터링 대상)
    const fields = {
      contactId: c ? c.id : null, dir: 'in', text, lang: from, translation: res.translation, trLang: uiLang,
      source: helperState.source || 'paste', intents: res.intents, risk: res.risk, provider: res.provider,
      suggestions: replies.map((r) => r.text), nuance: res.nuance.join(' '),
    };
    let msg;
    if (opts && opts.existing) { msg = opts.existing; Object.assign(msg, fields, { source: msg.source || fields.source, translation: msg.translation || fields.translation }); Store.save(); }
    else msg = Store.addMessage(fields);
    if (opts && opts.existing) msg._learned = Store.learnFromMessage(msg);
    noteLearned(c, msg);
    helperState.msgId = msg.id;
    helperState.source = null;
    res.msgId = msg.id;
    helperState.dir = 0;
    return res;
  }

  function cultureTipFor(c) {
    if (!c || !c.country) return null;
    const cu = DATA.CULTURE[c.country];
    if (!cu) return null;
    const list = cu[uiLang] || cu.en;
    const pick = list[(new Date().getDate()) % list.length];
    return { title: pick[0], body: pick[1], needTr: !cu[uiLang] };
  }

  function resultHtml(c, r) {
    const rc = r.recall;
    const memHtml = () => {
      if (!c) return '';
      const blocks = [];
      if (rc.contradictions.length) rc.contradictions.forEach((x) => blocks.push(`<div class="memory-item warn"><strong>${t('mem_conflict')}</strong><br><span class="small">${esc(t('mem_conflict_txt', { old: fmtDate(x.promise.date) + ' ' + x.promise.time, new: x.newTime }))}</span></div>`));
      if (rc.related.length) blocks.push(`<div class="stack-xs"><span class="label">${t('mem_related')}</span>${rc.related.map((x) => `<div class="memory-item"><span class="tiny muted">${fmtTs(x.msg.ts)} · ${x.msg.dir === 'in' ? esc(c.nickname) : esc(t('saju_me'))}</span><br><span lang="${esc(x.msg.lang)}">${esc(x.msg.text)}</span>${x.msg.translation && x.msg.dir === 'in' ? `<br><span class="small muted">${esc(x.msg.translation)}</span>` : ''}</div>`).join('')}</div>`);
      const unans = rc.unanswered.filter((m) => m.text !== r.text);
      if (unans.length) blocks.push(`<div class="stack-xs"><span class="label">${t('mem_unanswered')}</span>${unans.slice(-3).map((m) => `<div class="memory-item warn"><span class="tiny">${fmtTs(m.ts)}</span><br>${esc(m.translation || m.text)}</div>`).join('')}</div>`);
      if (rc.overduePromises.length) blocks.push(`<div class="stack-xs"><span class="label">${t('mem_overdue')}</span>${rc.overduePromises.map((p) => `<div class="memory-item alert">${fmtDate(p.date)} ${esc(p.time || '')} · ${esc(p.title)}</div>`).join('')}</div>`);
      if (rc.upcomingPromises.length) blocks.push(`<div class="stack-xs"><span class="label">${t('mem_upcoming')}</span>${rc.upcomingPromises.map((p) => `<div class="memory-item">${fmtDateW(p.date)} ${esc(p.time || '')} · ${esc(p.title)}${p.place ? ' · ' + esc(p.place) : ''}</div>`).join('')}</div>`);
      return `<div class="card stack ${'edge-' + c.color}"><div class="between wrap"><h2>${t('memory_title')}</h2>${who(c)}</div>${blocks.length ? blocks.join('') : `<p class="small muted">${t('memory_none')}</p>`}<button class="link" type="button" data-go="#/contact/${c.id}">${t('c_recent')} ${icon('arrow', 'sm')}</button></div>`;
    };
    const pf = c ? Engine.profile(Store.messagesOf(c.id)) : null;
    const dirs = r.replies;
    const sel = dirs[helperState.dir] || dirs[0] || { text: '', meaning: '' };
    return `<div class="stack-lg">
      <div class="stack-sm">
        <h2>${t('what_means')}</h2>
        <div class="card soft stack-sm"><div class="between wrap"><span class="label">${esc(langName(r.from))} → ${esc(langName(uiLang))}</span><span class="badge ${r.provider === 'ai' ? '' : 'gray'}">${r.provider === 'ai' ? t('ai_on') : t('ai_off')}</span></div><p style="font-size:17px" lang="${uiLang}">${esc(r.translation)}</p></div>
        ${r.risk.length ? `<div class="card danger stack-sm">${r.risk.includes('money') ? `<p><strong>⚠ ${t('risk_money')}</strong></p>` : ''}${r.risk.includes('offplatform') ? `<p><strong>⚠ ${t('risk_off')}</strong></p>` : ''}<button class="btn danger-btn sm" type="button" id="r-report">${t('c_report')}</button></div>` : ''}
        <div class="card stack">
          <div class="stack-sm"><h3>${t('nuance')}</h3>${r.nuance.map((n) => `<p class="small muted">${esc(n)}</p>`).join('')}</div>
          <hr class="divider">
          <div class="stack-sm"><h3>${t('situation')}</h3>${r.situation ? `<p class="small muted">${esc(r.situation)}</p>` : ''}${r.facts.map((f) => `<p class="small muted">${esc(f)}</p>`).join('')}<span class="badge">${t('fact')}</span></div>
          ${r.inferences.length ? `<div class="stack-sm"><h3>${t('style')}</h3>${r.inferences.map((f) => `<p class="small muted">${esc(f)}</p>`).join('')}<span class="badge warning">${t('inferred')}</span></div>` : ''}
          ${pf && pf.count >= 5 ? `<button class="link" type="button" data-go="#/contact/${c.id}">${t('c_analysis')} ${icon('arrow', 'sm')}</button>` : ''}
        </div>
      </div>
      ${memHtml()}
      ${r.when ? `<div class="card notice stack" id="promise-card">
        <div class="row">${icon('calendar')}<h3>${t('found_promise')}</h3></div>
        <div class="two"><label class="stack-xs"><span class="label">${t('p_date')}</span><input class="field" type="date" id="pr-date" value="${esc(r.when.date || today())}"></label><label class="stack-xs"><span class="label">${t('p_time')}</span><input class="field" type="time" id="pr-time" value="${esc(r.when.time || '')}"></label></div>
        <label class="stack-xs"><span class="label">${t('p_place')}</span><input class="field" id="pr-place" value="${esc(r.place || '')}"></label>
        ${c ? `<p class="small">${t('p_contact')} · ${esc(whoText(c))}</p>` : ''}
        <button class="btn secondary full" type="button" id="pr-add">${icon('bell')} ${t('add_reminder')}</button>
      </div>` : ''}
      <div class="stack-sm">
        <div class="between wrap"><h2>${t('prepare_reply')}</h2>${c ? `<button class="link" type="button" data-go="#/coach/${c.id}">${t('coach_link')}</button>` : ''}</div>
        <div class="seg" role="group" aria-label="${t('reply_dir')}">${dirs.map((d, i) => `<button type="button" data-dir="${i}" aria-pressed="${i === helperState.dir}">${esc(d.label)}</button>`).join('')}</div>
        <div class="card stack">
          <div class="translation stack-sm">
            <label class="label" for="reply-draft">${esc(t('draft_to', { name: c ? c.nickname : '', lang: langName(r.target) }))}</label>
            <textarea class="field" id="reply-draft" rows="3" lang="${esc(r.target)}">${esc(sel.text)}</textarea>
            <p class="small muted" id="reply-meaning">${t('meaning')} · ${esc(sel.meaning || '')}</p>
          </div>
          <details><summary>${t('own_write')}</summary>
            <div class="stack-sm">
              <textarea class="field" id="reply-own" rows="2" lang="${uiLang}"></textarea>
              <div class="seg">${['short', 'warm', 'polite'].map((tn) => `<button type="button" data-rtone="${tn}" aria-pressed="${helperState.tone === tn}">${t('tone_' + tn)}</button>`).join('')}</div>
              <button class="btn secondary full" type="button" id="reply-own-go">${t('translate_ctx')}</button>
            </div>
          </details>
          <button class="btn full" type="button" id="reply-copy">${icon('copy')} ${t('copy_reply')}</button>
          <p class="small muted">${esc(t('back_to_app', { app: c ? appName(c.app) : 'messenger' }))}</p>
        </div>
      </div>
      ${r.coach || r.avoid ? `<div class="card stack-sm">${r.coach ? `<h3>${t('coach_next')}</h3><p class="small">${esc(r.coach)}</p>` : ''}${r.avoid ? `<h3>${t('coach_avoid')}</h3><p class="small">${esc(r.avoid)}</p>` : ''}</div>` : ''}
      ${r.culture ? `<div class="card stack-sm"><span class="badge lilac">${t('culture_tip')}${c ? ' · ' + esc(countryName(c.country)) : ''}</span>${typeof r.culture === 'string' ? `<p class="small">${esc(r.culture)}</p>` : `<h3 class="cul-t">${esc(r.culture.title)}</h3><p class="small muted cul-b">${esc(r.culture.body)}</p>`}<button class="link" type="button" data-go="#/culture?c=${c ? c.id : ''}">${t('culture_title')} ${icon('arrow', 'sm')}</button></div>` : ''}
    </div>`;
  }

  function bindResult(c, r) {
    $app.querySelectorAll('[data-dir]').forEach((b) => b.addEventListener('click', () => {
      helperState.dir = Number(b.dataset.dir);
      $app.querySelectorAll('[data-dir]').forEach((x) => x.setAttribute('aria-pressed', x === b));
      const d = r.replies[helperState.dir];
      document.getElementById('reply-draft').value = d.text;
      document.getElementById('reply-meaning').textContent = t('meaning') + ' · ' + (d.meaning || '');
    }));
    $app.querySelectorAll('[data-rtone]').forEach((b) => b.addEventListener('click', () => { helperState.tone = b.dataset.rtone; $app.querySelectorAll('[data-rtone]').forEach((x) => x.setAttribute('aria-pressed', x === b)); }));
    const ownGo = document.getElementById('reply-own-go');
    ownGo.addEventListener('click', async () => {
      const own = document.getElementById('reply-own').value.trim(); if (!own) return;
      spinBtn(ownGo, true);
      try {
        const x = await tr(own, r.target, uiLang, { tone: helperState.tone, relation: c ? c.relation : '' });
        document.getElementById('reply-draft').value = x.text;
        document.getElementById('reply-meaning').textContent = t('meaning') + ' · ' + own;
        r.replies.push({ label: '✍', text: x.text, meaning: own, src: own });
      } catch (e) { toast(t('trans_fail')); }
      spinBtn(ownGo, false);
    });
    document.getElementById('reply-copy').addEventListener('click', async () => {
      const text = document.getElementById('reply-draft').value.trim(); if (!text) return;
      await copyText(text);
      const meaning = (document.getElementById('reply-meaning').textContent || '').replace(t('meaning') + ' · ', '');
      Store.addMessage({ contactId: c ? c.id : null, dir: 'out', text: meaning || text, lang: uiLang, translation: text, trLang: r.target, source: 'reply', replyTo: r.msgId });
      const m = Store.me().messages.find((x) => x.id === r.msgId); if (m) { m.chosen = text; Store.save(); }
      toast(t('copied', { app: c ? appName(c.app) : 'messenger' }));
    });
    const add = document.getElementById('pr-add');
    if (add) add.addEventListener('click', () => {
      const date = document.getElementById('pr-date').value, time = document.getElementById('pr-time').value, place = document.getElementById('pr-place').value.trim();
      Store.addPromise({ contactId: c ? c.id : null, title: (c ? c.nickname + ' · ' : '') + t('promise'), date, time, place, sourceMsgId: r.msgId });
      toast(t('added_reminder')); add.disabled = true; add.textContent = '✓ ' + t('added_reminder');
      askNotify();
    });
    const rep = document.getElementById('r-report');
    if (rep) rep.addEventListener('click', () => openReport(c, r.msgId));
    // 문화 팁 번역(ko/en 이외 UI)
    if (r.culture && r.culture.needTr) {
      const tt = $app.querySelector('.cul-t'), bb = $app.querySelector('.cul-b');
      tr(r.culture.title, uiLang, 'en').then((x) => { if (tt) tt.textContent = x.text; }).catch(() => {});
      tr(r.culture.body, uiLang, 'en').then((x) => { if (bb) bb.textContent = x.text; }).catch(() => {});
      r.culture.needTr = false;
    }
  }

  function outResultHtml(c, o) {
    const rc = o.recall;
    return `<div class="card stack">
      ${rc && rc.duplicateQuestion ? `<div class="memory-item warn"><strong>${t('mem_dup')}</strong><br><span class="tiny">${fmtTs(rc.duplicateQuestion.ts)}</span> ${esc(rc.duplicateQuestion.text)}</div>` : ''}
      ${rc && rc.related.length ? `<div class="stack-xs"><span class="label">${t('mem_related')}</span>${rc.related.slice(0, 2).map((x) => `<div class="memory-item"><span class="tiny muted">${fmtTs(x.msg.ts)}</span><br>${esc(x.msg.dir === 'in' ? (x.msg.translation || x.msg.text) : x.msg.text)}</div>`).join('')}</div>` : ''}
      <div class="translation stack-sm">
        <span class="label">${esc(t('draft_to', { name: c ? c.nickname : '', lang: langName(o.to) }))}</span>
        <textarea class="field" id="out-draft" rows="3" lang="${esc(o.to)}">${esc(o.text)}</textarea>
        <p class="small muted">${t('meaning_back')} · ${esc(o.back || '')}</p>
      </div>
      <button class="btn full" type="button" id="out-copy2">${icon('copy')} ${t('copy_reply')}</button>
      <p class="small muted">${esc(t('back_to_app', { app: c ? appName(c.app) : 'messenger' }))}</p>
    </div>`;
  }
  function bindOutResult(c, o) {
    document.getElementById('out-copy2').addEventListener('click', async () => {
      const text = document.getElementById('out-draft').value.trim();
      await copyText(text);
      Store.addMessage({ contactId: c ? c.id : null, dir: 'out', text: o.src, lang: uiLang, translation: text, trLang: o.to, source: 'write', tone: helperState.tone });
      toast(t('copied', { app: c ? appName(c.app) : 'messenger' }));
    });
  }

  function openReport(c, msgId) {
    sheet(`<div class="stack"><h2>${t('report_title')}</h2>${c ? who(c) : ''}
      <fieldset class="card stack-xs"><legend class="label">${t('report_reason')}</legend>
      ${['money', 'harass', 'sexual', 'fake', 'other'].map((k, i) => `<label class="inline-input"><input type="radio" name="rr" value="${k}" ${i === 0 ? 'checked' : ''}> ${t('report_' + k)}</label>`).join('')}</fieldset>
      <textarea class="field" id="rr-note" rows="3" placeholder="…"></textarea>
      <div class="two"><button class="btn secondary" type="button" id="rr-cancel">${t('cancel')}</button><button class="btn danger-btn" type="button" id="rr-send">${t('report_send')}</button></div></div>`, (el) => {
      el.querySelector('#rr-cancel').onclick = closeSheet;
      el.querySelector('#rr-send').onclick = () => {
        Store.addReport({ contactId: c ? c.id : null, msgId: msgId || null, reason: el.querySelector('input[name="rr"]:checked').value, note: el.querySelector('#rr-note').value.trim() });
        closeSheet(); toast(t('report_sent'));
      };
    });
  }

  /* ================= 대화방: 받은 말·보낼 말을 한 흐름으로 ================= */
  const XT = {
    ko: { chat_title: '대화방', chat_pick: '누구와의 대화인가요?', chat_none: '연락처 없이 번역만', smart_ph: '상대 메시지를 붙여넣거나, 내 말을 쓰세요', smart_hint: '상대 언어로 붙여넣으면 받은 말, 내 언어로 쓰면 보낼 말로 자동 인식해요.', det_in: '받은 말로 인식', det_out: '보낼 말로 인식', det_switch: '바꾸기', send: '넣기', use_reply: '이걸로 답장', copy: '복사', copied_short: '복사됨', analysis: '분석과 답장 추천', open_chat: '대화방 열기', chat_empty: '아직 대화가 없어요. 상대가 보낸 메시지를 붙여넣어 보세요.', all_chat: '전체 대화', thread_count: '대화 {n}건', pick_first: '대화 상대를 먼저 고르세요', translating: '번역 중…', show_more: '이전 대화 더 보기' },
    zh: { chat_title: '对话', chat_pick: '和谁的对话？', chat_none: '不选联系人，仅翻译', smart_ph: '粘贴对方的消息，或写下你想说的话', smart_hint: '用对方语言粘贴会识别为收到的话，用你的语言写会识别为要发的话。', det_in: '识别为收到的话', det_out: '识别为要发的话', det_switch: '切换', send: '添加', use_reply: '用这句回复', copy: '复制', copied_short: '已复制', analysis: '分析与回复建议', open_chat: '打开对话', chat_empty: '还没有对话。粘贴对方发来的消息试试。', all_chat: '全部对话', thread_count: '共 {n} 条', pick_first: '请先选择联系人', translating: '翻译中…', show_more: '查看更早的对话' },
    ja: { chat_title: 'トーク', chat_pick: '誰との会話ですか？', chat_none: '連絡先なしで翻訳だけ', smart_ph: '相手のメッセージを貼り付けるか、自分の言葉を書いてください', smart_hint: '相手の言語で貼ると「届いた言葉」、自分の言語で書くと「送る言葉」として自動で判別します。', det_in: '届いた言葉として判別', det_out: '送る言葉として判別', det_switch: '切り替え', send: '追加', use_reply: 'これで返信', copy: 'コピー', copied_short: 'コピー済み', analysis: '分析と返信案', open_chat: 'トークを開く', chat_empty: 'まだ会話がありません。相手のメッセージを貼り付けてみましょう。', all_chat: 'すべての会話', thread_count: '{n}件', pick_first: '先に相手を選んでください', translating: '翻訳中…', show_more: '以前の会話を表示' },
    vi: { chat_title: 'Trò chuyện', chat_pick: 'Trò chuyện với ai?', chat_none: 'Chỉ dịch, không chọn liên hệ', smart_ph: 'Dán tin nhắn của họ hoặc viết điều bạn muốn nói', smart_hint: 'Dán bằng tiếng của họ sẽ là tin nhận được, viết bằng tiếng của bạn sẽ là tin để gửi.', det_in: 'Nhận diện: tin nhận được', det_out: 'Nhận diện: tin để gửi', det_switch: 'Đổi', send: 'Thêm', use_reply: 'Trả lời bằng câu này', copy: 'Sao chép', copied_short: 'Đã sao chép', analysis: 'Phân tích và gợi ý trả lời', open_chat: 'Mở trò chuyện', chat_empty: 'Chưa có tin nhắn. Hãy dán tin nhắn họ gửi.', all_chat: 'Toàn bộ hội thoại', thread_count: '{n} tin', pick_first: 'Hãy chọn người trò chuyện trước', translating: 'Đang dịch…', show_more: 'Xem tin cũ hơn' },
    en: { chat_title: 'Chat', chat_pick: 'Who is this chat with?', chat_none: 'No contact, just translate', smart_ph: 'Paste their message, or write what you want to say', smart_hint: 'Paste in their language and it\'s a received message. Write in yours and it\'s a reply to send.', det_in: 'Detected: received', det_out: 'Detected: to send', det_switch: 'Switch', send: 'Add', use_reply: 'Reply with this', copy: 'Copy', copied_short: 'Copied', analysis: 'Analysis and reply ideas', open_chat: 'Open chat', chat_empty: 'No messages yet. Paste a message they sent.', all_chat: 'Full conversation', thread_count: '{n} messages', pick_first: 'Pick who you are talking to first', translating: 'Translating…', show_more: 'Show earlier messages' },
  };
  Object.keys(XT).forEach((l) => Object.assign(T[l], XT[l]));


  const ST_T = {"ko": {"search_ph": "이름·앱 검색", "no_result": "결과 없음", "c_info": "상대 정보", "st_new": "새로 가져옴", "st_need": "답장 필요", "st_copied": "복사함", "st_done": "답장 완료", "mark_sent": "보냈어요", "filter_need": "답장 필요만"}, "zh": {"search_ph": "搜索名字或应用", "no_result": "没有结果", "c_info": "对方信息", "st_new": "新导入", "st_need": "需要回复", "st_copied": "已复制", "st_done": "已回复", "mark_sent": "已发送", "filter_need": "只看需回复"}, "ja": {"search_ph": "名前・アプリで検索", "no_result": "見つかりません", "c_info": "相手の情報", "st_new": "新着", "st_need": "返信が必要", "st_copied": "コピー済み", "st_done": "返信済み", "mark_sent": "送信済みにする", "filter_need": "返信待ちのみ"}, "vi": {"search_ph": "Tìm tên hoặc ứng dụng", "no_result": "Không có kết quả", "c_info": "Thông tin người này", "st_new": "Mới nhập", "st_need": "Cần trả lời", "st_copied": "Đã sao chép", "st_done": "Đã trả lời", "mark_sent": "Đã gửi", "filter_need": "Chỉ cần trả lời"}, "en": {"search_ph": "Search name or app", "no_result": "No results", "c_info": "Contact info", "st_new": "New", "st_need": "Needs reply", "st_copied": "Copied", "st_done": "Replied", "mark_sent": "Mark sent", "filter_need": "Needs reply only"}};
  Object.keys(ST_T).forEach((l) => Object.assign(T[l], ST_T[l]));
  /* 상대별 대화 상태: 새로 가져옴 / 답장 필요 / 복사함 / 답장 완료 */
  function learnedText(c, fields) {
    const lab = { age: t('c_age'), gender: t('c_gender'), blood: t('c_blood'), mbti: 'MBTI', job: t('c_job'), city: t('c_city'), birthday: t('c_birthday') };
    return fields.map((f) => lab[f] + ' ' + learnedVal(c, f)).join(' · ');
  }
  function learnedVal(c, f) { return f === 'gender' ? t('gender_' + c.gender) : f === 'birthday' ? (c.birthdayNoYear ? fmtDate(c.birthday).replace(/^\d{4}[.\-년年/\s]*/, '') : fmtDate(c.birthday)) : String(c[f] || ''); }
  function noteLearned(c, msg) {
    const f = msg && msg._learned; if (msg) delete msg._learned;
    if (c && f && f.length) { toast('🔍 ' + t('learned_toast') + ': ' + learnedText(c, f)); msg.learnedNote = learnedText(c, f); Store.save(); }
  }
  const APP_STYLE = { kakaotalk: ['#FEE500', '#191919', 'K'], wechat: ['#07C160', '#fff', 'W'], line: ['#06C755', '#fff', 'L'], whatsapp: ['#25D366', '#fff', 'W'], instagram: ['#E1306C', '#fff', 'IG'], telegram: ['#229ED9', '#fff', 'T'], zalo: ['#0068FF', '#fff', 'Z'], messenger: ['#0866FF', '#fff', 'M'], other: ['#6b7280', '#fff', '·'] };
  function appBadge(ap, short) { const st = APP_STYLE[ap] || APP_STYLE.other; return `<span class="app-badge" style="background:${st[0]};color:${st[1]}">${esc(short ? appName(ap).replace(/ DM$/, '') : appName(ap))}</span>`; }
  function convStatus(ms) {
    const last = ms[ms.length - 1]; if (!last) return null;
    if (last.dir === 'in') return (Date.now() - last.ts < 30 * 60000 && !last.analysis) ? 'new' : 'need';
    return last.sent ? 'done' : 'copied';
  }
  function statusBadge(st) { if (!st) return ''; const cls = { new: 'lilac', need: 'warning', copied: 'gray', done: '' }[st]; return `<span class="badge ${cls} st-${st}">${t({ new: 'st_new', need: 'st_need', copied: 'st_copied', done: 'st_done' }[st])}</span>`; }
  const CH_T = {"ko": {"dir_label": "처리 방향", "dir_auto": "자동 감지", "dir_in": "받은 말 · {from} → {to}", "dir_out": "내 답장 · {from} → {to}", "draft_of": "{who} · 이 대화의 초안", "btn_in": "받은 말 넣기", "btn_out": "{lang}로 번역·복사", "copy_lang": "{lang} 복사", "suggest_title": "답장 추천", "show_sug": "답장 추천 보기", "insight": "뉘앙스·상황·지난 대화", "reply_hint": "번역을 확인하고 복사해 {app}에서 보내세요.", "me_reply": "내 답장", "sug_fill": "입력창에 채웠어요. 확인 후 번역·복사를 누르세요.", "contact_info": "상대 정보", "lang_pair": "{a} ↔ {b}"}, "zh": {"dir_label": "处理方向", "dir_auto": "自动识别", "dir_in": "收到的话 · {from} → {to}", "dir_out": "我的回复 · {from} → {to}", "draft_of": "{who} · 本对话草稿", "btn_in": "添加收到的话", "btn_out": "翻译成{lang}并复制", "copy_lang": "复制{lang}", "suggest_title": "回复建议", "show_sug": "查看回复建议", "insight": "语气·情况·以前的对话", "reply_hint": "确认翻译后复制，到{app}发送。", "me_reply": "我的回复", "sug_fill": "已填入输入框。确认后点击翻译并复制。", "contact_info": "对方信息", "lang_pair": "{a} ↔ {b}"}, "ja": {"dir_label": "処理の方向", "dir_auto": "自動判別", "dir_in": "届いた言葉 · {from} → {to}", "dir_out": "自分の返信 · {from} → {to}", "draft_of": "{who} · この会話の下書き", "btn_in": "届いた言葉を追加", "btn_out": "{lang}に翻訳してコピー", "copy_lang": "{lang}をコピー", "suggest_title": "返信案", "show_sug": "返信案を見る", "insight": "ニュアンス・状況・前の会話", "reply_hint": "翻訳を確認してコピーし、{app}で送ってください。", "me_reply": "自分の返信", "sug_fill": "入力欄に入れました。確認して翻訳・コピーを押してください。", "contact_info": "相手の情報", "lang_pair": "{a} ↔ {b}"}, "vi": {"dir_label": "Hướng xử lý", "dir_auto": "Tự nhận diện", "dir_in": "Tin nhận được · {from} → {to}", "dir_out": "Trả lời của tôi · {from} → {to}", "draft_of": "{who} · bản nháp của cuộc trò chuyện này", "btn_in": "Thêm tin nhận được", "btn_out": "Dịch sang {lang} và sao chép", "copy_lang": "Sao chép {lang}", "suggest_title": "Gợi ý trả lời", "show_sug": "Xem gợi ý trả lời", "insight": "Sắc thái · tình huống · trò chuyện trước", "reply_hint": "Kiểm tra bản dịch, sao chép rồi gửi trong {app}.", "me_reply": "Trả lời của tôi", "sug_fill": "Đã điền vào ô nhập. Kiểm tra rồi bấm dịch và sao chép.", "contact_info": "Thông tin người này", "lang_pair": "{a} ↔ {b}"}, "en": {"dir_label": "Direction", "dir_auto": "Auto-detect", "dir_in": "Received · {from} → {to}", "dir_out": "My reply · {from} → {to}", "draft_of": "{who} · draft for this chat", "btn_in": "Add received message", "btn_out": "Translate to {lang} & copy", "copy_lang": "Copy {lang}", "suggest_title": "Reply ideas", "show_sug": "Show reply ideas", "insight": "Nuance · situation · past chats", "reply_hint": "Check the translation, copy it and send in {app}.", "me_reply": "My reply", "sug_fill": "Filled in the box. Check it, then translate & copy.", "contact_info": "Contact info", "lang_pair": "{a} ↔ {b}"}};
  Object.keys(CH_T).forEach((l) => Object.assign(T[l], CH_T[l]));
  const GD_T = {"ko": {"nav_guide": "사용법", "g_title": "이렇게 쓰세요", "g_lead": "언어의 마술사는 카톡·위챗 같은 메신저에 접속하지 않고, 대화를 자동으로 가져오지 않습니다. 받은 메시지를 복사해 붙여넣으면 번역·분석·답장 추천을 해드립니다.", "g1t": "대화 상대 등록", "g1": "상대마다 한 번만 등록하세요. 닉네임, 쓰는 메신저(카톡·위챗·LINE…), 상대 언어만 넣으면 됩니다. 생일·혈액형은 나중에 넣어도 돼요.", "g2t": "받은 메시지 붙여넣기", "g2": "메신저에서 상대 메시지를 길게 눌러 복사 → 이 앱 대화방 입력창에 붙여넣기. 스크린샷을 올려도 글자를 읽어요. 번역·말투·지난 대화·약속이 바로 정리됩니다.", "g3t": "내 말로 답장 쓰기", "g3": "한국어로 쓰거나 추천 답장을 고르세요. 상대 언어로 번역돼 자동 복사됩니다. 메신저로 돌아가 붙여넣고 보내세요.", "g4t": "PC에서는 2모니터로", "g4": "한쪽 화면에 카톡·위챗, 다른 쪽에 이 앱을 띄우세요. 오른쪽 목록에서 상대를 바꿔도 쓰던 초안이 남아요.", "g_ai_t": "번역을 더 자연스럽게 (선택)", "g_ai": "기본 번역은 무료입니다. OpenAI나 Claude 키를 넣으면 말투·뉘앙스 분석과 답장 추천이 훨씬 좋아집니다.", "g_add": "첫 상대 등록하기", "g_try": "샘플 대화로 먼저 보기", "g_ai_btn": "AI 키 넣기", "g_open_chat": "대화방 열기", "g_note": "대화 내용은 이 기기에 저장되고, 가입 시 동의한 범위에서 운영자가 관리 목적으로 볼 수 있습니다.", "ai_steps_t": "키 받는 방법", "ai_s1": "아래 버튼으로 키 발급 페이지를 엽니다 (로그인 필요).", "ai_s2": "‘Create new secret key’(새 키 만들기)를 누르고 생성된 키를 복사합니다.", "ai_s3": "아래 ‘API 키’ 칸에 붙여넣고 저장 → 연결 테스트를 누르세요.", "ai_s4": "OpenAI는 결제 수단 등록(소액 충전)이 필요합니다. 쓴 만큼만 과금돼요.", "ai_s4c": "Claude는 콘솔에서 크레딧 충전이 필요합니다. 쓴 만큼만 과금돼요.", "ai_get_openai": "OpenAI 키 발급 페이지 열기", "ai_get_claude": "Claude 키 발급 페이지 열기"}, "zh": {"nav_guide": "使用方法", "g_title": "这样使用", "g_lead": "语言魔术师不会登录微信、KakaoTalk 等聊天软件，也不会自动读取聊天。把收到的消息复制粘贴进来，就能获得翻译、分析和回复建议。", "g1t": "添加聊天对象", "g1": "每个人只需添加一次：昵称、使用的聊天软件、对方语言即可。生日、血型可以以后再填。", "g2t": "粘贴收到的消息", "g2": "在聊天软件里长按复制对方的消息 → 粘贴到本应用的输入框。也可以上传截图。翻译、语气、以前的对话和约定会立即整理好。", "g3t": "用自己的语言回复", "g3": "用中文写或选择推荐回复，会翻译成对方语言并自动复制。回到聊天软件粘贴发送。", "g4t": "电脑上用双屏", "g4": "一个屏幕开微信，另一个屏幕开本应用。在右侧列表切换对象时，草稿会保留。", "g_ai_t": "让翻译更自然（可选）", "g_ai": "基础翻译免费。填入 OpenAI 或 Claude 密钥后，语气分析和回复建议会好很多。", "g_add": "添加第一个对象", "g_try": "先看示例对话", "g_ai_btn": "填写 AI 密钥", "g_open_chat": "打开对话", "g_note": "对话保存在本设备，运营方可在注册时同意的范围内出于管理目的查看。", "ai_steps_t": "获取密钥的方法", "ai_s1": "点击下面的按钮打开密钥页面（需要登录）。", "ai_s2": "点击 “Create new secret key”，复制生成的密钥。", "ai_s3": "粘贴到下面的“API 密钥”栏并保存 → 点“测试连接”。", "ai_s4": "OpenAI 需要绑定付款方式（少量充值），按用量计费。", "ai_s4c": "Claude 需要在控制台充值额度，按用量计费。", "ai_get_openai": "打开 OpenAI 密钥页面", "ai_get_claude": "打开 Claude 密钥页面"}, "ja": {"nav_guide": "使い方", "g_title": "使い方", "g_lead": "言葉の魔法使いはLINEやカカオトークにログインせず、会話を自動で読み取りません。届いたメッセージをコピーして貼り付けると、翻訳・分析・返信案を出します。", "g1t": "相手を登録", "g1": "相手ごとに一度だけ。ニックネーム、使っているアプリ、相手の言語だけで大丈夫です。誕生日や血液型は後からでも。", "g2t": "届いたメッセージを貼り付け", "g2": "メッセンジャーで相手のメッセージを長押ししてコピー → このアプリの入力欄に貼り付け。スクショでもOK。翻訳・口調・前の会話・約束をすぐ整理します。", "g3t": "自分の言葉で返信", "g3": "日本語で書くか返信案を選ぶと、相手の言語に翻訳して自動コピーします。メッセンジャーに戻って貼り付けて送信。", "g4t": "PCではデュアルモニターで", "g4": "片方にLINE、もう片方にこのアプリ。右の一覧で相手を切り替えても下書きは残ります。", "g_ai_t": "翻訳をもっと自然に（任意）", "g_ai": "基本の翻訳は無料。OpenAIかClaudeのキーを入れると、ニュアンス分析と返信案がずっと良くなります。", "g_add": "最初の相手を登録", "g_try": "サンプルで見てみる", "g_ai_btn": "AIキーを入れる", "g_open_chat": "会話を開く", "g_note": "会話はこの端末に保存され、登録時に同意した範囲で運営者が管理目的で閲覧できます。", "ai_steps_t": "キーの取り方", "ai_s1": "下のボタンでキー発行ページを開きます（ログインが必要）。", "ai_s2": "「Create new secret key」を押して、作られたキーをコピー。", "ai_s3": "下の「APIキー」欄に貼り付けて保存 → 接続テスト。", "ai_s4": "OpenAIは支払い方法の登録（少額チャージ）が必要です。使った分だけ課金されます。", "ai_s4c": "Claudeはコンソールでクレジットのチャージが必要です。使った分だけ課金されます。", "ai_get_openai": "OpenAIキー発行ページを開く", "ai_get_claude": "Claudeキー発行ページを開く"}, "vi": {"nav_guide": "Hướng dẫn", "g_title": "Cách dùng", "g_lead": "Ứng dụng không đăng nhập vào Zalo, KakaoTalk… và không tự đọc tin nhắn. Bạn sao chép tin nhắn nhận được rồi dán vào đây để được dịch, phân tích và gợi ý trả lời.", "g1t": "Thêm người trò chuyện", "g1": "Mỗi người chỉ cần thêm một lần: biệt danh, ứng dụng nhắn tin, ngôn ngữ của họ. Ngày sinh, nhóm máu có thể điền sau.", "g2t": "Dán tin nhắn nhận được", "g2": "Nhấn giữ tin nhắn trong ứng dụng nhắn tin để sao chép → dán vào ô nhập của ứng dụng này. Có thể tải ảnh chụp màn hình. Bản dịch, giọng điệu, trò chuyện trước và lịch hẹn được sắp xếp ngay.", "g3t": "Trả lời bằng tiếng của bạn", "g3": "Viết bằng tiếng Việt hoặc chọn gợi ý; ứng dụng dịch sang ngôn ngữ của họ và tự sao chép. Quay lại ứng dụng nhắn tin, dán và gửi.", "g4t": "Trên PC dùng 2 màn hình", "g4": "Một màn hình mở Zalo, màn hình kia mở ứng dụng này. Đổi người ở danh sách bên phải, bản nháp vẫn được giữ.", "g_ai_t": "Dịch tự nhiên hơn (tùy chọn)", "g_ai": "Bản dịch cơ bản miễn phí. Thêm khóa OpenAI hoặc Claude để phân tích sắc thái và gợi ý trả lời tốt hơn nhiều.", "g_add": "Thêm người đầu tiên", "g_try": "Xem trò chuyện mẫu", "g_ai_btn": "Nhập khóa AI", "g_open_chat": "Mở trò chuyện", "g_note": "Cuộc trò chuyện được lưu trên thiết bị này; quản trị viên có thể xem trong phạm vi bạn đã đồng ý khi đăng ký.", "ai_steps_t": "Cách lấy khóa", "ai_s1": "Mở trang tạo khóa bằng nút bên dưới (cần đăng nhập).", "ai_s2": "Bấm “Create new secret key” và sao chép khóa.", "ai_s3": "Dán vào ô “Khóa API” bên dưới, lưu → bấm kiểm tra kết nối.", "ai_s4": "OpenAI cần thêm phương thức thanh toán (nạp ít tiền), tính phí theo mức dùng.", "ai_s4c": "Claude cần nạp tín dụng trong bảng điều khiển, tính phí theo mức dùng.", "ai_get_openai": "Mở trang khóa OpenAI", "ai_get_claude": "Mở trang khóa Claude"}, "en": {"nav_guide": "How to", "g_title": "How it works", "g_lead": "Language Magician never logs into KakaoTalk, WeChat or any messenger, and never reads your chats automatically. Copy a message you received, paste it here, and get a translation, analysis and reply ideas.", "g1t": "Add the person", "g1": "Once per person: nickname, which messenger, and their language. Birthday or blood type can come later.", "g2t": "Paste what they sent", "g2": "Long-press their message in your messenger to copy → paste it into this app’s chat box. Screenshots work too. Translation, tone, past chats and plans are sorted instantly.", "g3t": "Reply in your own words", "g3": "Write in English or pick a reply idea. It is translated into their language and copied. Go back to the messenger, paste and send.", "g4t": "On PC, use two screens", "g4": "Messenger on one screen, this app on the other. Switch people in the right-hand list; your drafts stay.", "g_ai_t": "More natural translation (optional)", "g_ai": "Basic translation is free. Add an OpenAI or Claude key for much better nuance analysis and reply ideas.", "g_add": "Add your first person", "g_try": "Try with sample chats", "g_ai_btn": "Add AI key", "g_open_chat": "Open chats", "g_note": "Chats are stored on this device; operators may view them for management within what you agreed to at sign-up.", "ai_steps_t": "How to get a key", "ai_s1": "Open the key page with the button below (sign-in required).", "ai_s2": "Click “Create new secret key” and copy the key.", "ai_s3": "Paste it into “API key” below, save, then press Test connection.", "ai_s4": "OpenAI needs a payment method (a small top-up); you pay only for what you use.", "ai_s4c": "Claude needs credits added in the console; you pay only for what you use.", "ai_get_openai": "Open OpenAI key page", "ai_get_claude": "Open Claude key page"}};
  Object.keys(GD_T).forEach((l) => Object.assign(T[l], GD_T[l]));
  const LR_T = {"ko": {"new_chat": "새 대화", "f_all": "전체", "sort_by": "정렬", "sort_recent": "최근 대화순", "sort_name": "이름순", "cal_today": "오늘", "cal_anniv": "기념일", "today_h": "오늘 할 일", "c_more": "더 아는 정보 (선택)", "c_more_hint": "몰라도 됩니다. 대화에 나오면 자동으로 채워져요.", "c_job": "직업", "c_city": "사는 곳", "learned_toast": "대화에서 알아냈어요", "learned_badge": "대화에서", "learned_hint": "상대가 보낸 메시지에서 자동으로 채운 정보예요. 직접 고치면 그 값이 우선합니다.", "learned_title": "대화로 알게 된 정보", "learned_none": "아직 없어요. 대화에서 나이·생일·혈액형·MBTI·직업·사는 곳이 나오면 자동으로 채워집니다."}, "zh": {"new_chat": "新对话", "f_all": "全部", "sort_by": "排序", "sort_recent": "最近", "sort_name": "按名字", "cal_today": "今天", "cal_anniv": "纪念日", "today_h": "今天的事", "c_more": "更多信息（可选）", "c_more_hint": "不知道也没关系，对话中出现时会自动填写。", "c_job": "职业", "c_city": "居住地", "learned_toast": "从对话中得知", "learned_badge": "来自对话", "learned_hint": "根据对方发来的消息自动填写。手动修改后以你的值为准。", "learned_title": "从对话中得知的信息", "learned_none": "暂时没有。对话中出现年龄、生日、血型、MBTI、职业、居住地时会自动填写。"}, "ja": {"new_chat": "新しい会話", "f_all": "すべて", "sort_by": "並び替え", "sort_recent": "最近", "sort_name": "名前順", "cal_today": "今日", "cal_anniv": "記念日", "today_h": "今日やること", "c_more": "分かっている情報（任意）", "c_more_hint": "分からなくてOK。会話に出てきたら自動で入ります。", "c_job": "職業", "c_city": "住んでいる所", "learned_toast": "会話から分かりました", "learned_badge": "会話から", "learned_hint": "相手のメッセージから自動で入力した情報です。手動で直すとその値が優先されます。", "learned_title": "会話で分かった情報", "learned_none": "まだありません。会話に年齢・誕生日・血液型・MBTI・職業・住んでいる所が出ると自動で入ります。"}, "vi": {"new_chat": "Trò chuyện mới", "f_all": "Tất cả", "sort_by": "Sắp xếp", "sort_recent": "Gần đây", "sort_name": "Theo tên", "cal_today": "Hôm nay", "cal_anniv": "Kỷ niệm", "today_h": "Việc hôm nay", "c_more": "Thông tin thêm (tùy chọn)", "c_more_hint": "Không biết cũng được. Sẽ tự điền khi xuất hiện trong trò chuyện.", "c_job": "Nghề nghiệp", "c_city": "Nơi sống", "learned_toast": "Biết được từ cuộc trò chuyện", "learned_badge": "Từ trò chuyện", "learned_hint": "Tự điền từ tin nhắn người ấy gửi. Nếu bạn sửa tay, giá trị của bạn được ưu tiên.", "learned_title": "Thông tin biết được từ trò chuyện", "learned_none": "Chưa có. Khi tuổi, sinh nhật, nhóm máu, MBTI, nghề, nơi sống xuất hiện trong trò chuyện, sẽ tự điền."}, "en": {"new_chat": "New chat", "f_all": "All", "sort_by": "Sort", "sort_recent": "Recent", "sort_name": "Name", "cal_today": "Today", "cal_anniv": "Anniversary", "today_h": "Today", "c_more": "More details (optional)", "c_more_hint": "No need to know now — filled in automatically when they come up in chat.", "c_job": "Job", "c_city": "Lives in", "learned_toast": "Learned from the chat", "learned_badge": "From chat", "learned_hint": "Filled in automatically from their messages. If you edit it, your value wins.", "learned_title": "Learned from chats", "learned_none": "Nothing yet. Age, birthday, blood type, MBTI, job and city are filled in automatically when they come up."}};
  Object.keys(LR_T).forEach((l) => Object.assign(T[l], LR_T[l]));
  const MEM_T = {"ko": {"mem_day": "이 날 기억", "mem_title": "날짜별 대화 기억", "mem_none": "아직 기억할 대화가 없어요. 대화를 붙여넣으면 하루 단위로 정리됩니다.", "mem_recent": "지난 대화 기억", "mem_ai": "AI 요약", "mem_basic": "기본 분석", "mem_sum": "대화 {n}개 (받은 말 {i} · 보낸 말 {o})", "mem_topics": "주제", "mem_q": "질문 {n}개", "ft_profile": "상대 정보", "ft_plan_date": "약속·날짜", "ft_like": "좋아함", "ft_dislike": "싫어함", "ft_worry": "고민·컨디션", "ft_family": "가족", "ft_pet": "반려동물", "ft_work": "일·학교", "ft_plan": "계획", "ft_other": "기타", "mem_refresh": "다시 분석"}, "zh": {"mem_day": "当天记忆", "mem_title": "按日期的对话记忆", "mem_none": "还没有可记住的对话。粘贴对话后会按天整理。", "mem_recent": "以前的对话记忆", "mem_ai": "AI 总结", "mem_basic": "基础分析", "mem_sum": "对话 {n} 条（收到 {i} · 发出 {o}）", "mem_topics": "话题", "mem_q": "提问 {n} 个", "ft_profile": "对方信息", "ft_plan_date": "约定·日期", "ft_like": "喜欢", "ft_dislike": "不喜欢", "ft_worry": "烦恼·状态", "ft_family": "家人", "ft_pet": "宠物", "ft_work": "工作·学校", "ft_plan": "计划", "ft_other": "其他", "mem_refresh": "重新分析"}, "ja": {"mem_day": "この日の記憶", "mem_title": "日付ごとの会話の記憶", "mem_none": "まだ覚えておく会話がありません。会話を貼り付けると1日ごとに整理します。", "mem_recent": "前の会話の記憶", "mem_ai": "AI要約", "mem_basic": "基本分析", "mem_sum": "会話 {n}件（届いた {i} · 送った {o}）", "mem_topics": "話題", "mem_q": "質問 {n}件", "ft_profile": "相手の情報", "ft_plan_date": "約束・日付", "ft_like": "好き", "ft_dislike": "苦手", "ft_worry": "悩み・体調", "ft_family": "家族", "ft_pet": "ペット", "ft_work": "仕事・学校", "ft_plan": "予定", "ft_other": "その他", "mem_refresh": "再分析"}, "vi": {"mem_day": "Ghi nhớ ngày này", "mem_title": "Ghi nhớ trò chuyện theo ngày", "mem_none": "Chưa có gì để ghi nhớ. Dán cuộc trò chuyện vào, ứng dụng sẽ sắp xếp theo ngày.", "mem_recent": "Ghi nhớ trò chuyện trước", "mem_ai": "AI tóm tắt", "mem_basic": "Phân tích cơ bản", "mem_sum": "{n} tin nhắn (nhận {i} · gửi {o})", "mem_topics": "Chủ đề", "mem_q": "{n} câu hỏi", "ft_profile": "Thông tin", "ft_plan_date": "Hẹn·ngày", "ft_like": "Thích", "ft_dislike": "Không thích", "ft_worry": "Lo lắng·sức khỏe", "ft_family": "Gia đình", "ft_pet": "Thú cưng", "ft_work": "Công việc·học", "ft_plan": "Kế hoạch", "ft_other": "Khác", "mem_refresh": "Phân tích lại"}, "en": {"mem_day": "Remembered from this day", "mem_title": "Chat memory by day", "mem_none": "Nothing to remember yet. Paste chats and they are organized day by day.", "mem_recent": "From past chats", "mem_ai": "AI summary", "mem_basic": "Basic analysis", "mem_sum": "{n} messages ({i} received · {o} sent)", "mem_topics": "Topics", "mem_q": "{n} questions", "ft_profile": "About them", "ft_plan_date": "Plan·date", "ft_like": "Likes", "ft_dislike": "Dislikes", "ft_worry": "Worries·health", "ft_family": "Family", "ft_pet": "Pets", "ft_work": "Work·school", "ft_plan": "Plans", "ft_other": "Other", "mem_refresh": "Re-analyze"}};
  Object.keys(MEM_T).forEach((l) => Object.assign(T[l], MEM_T[l]));
  const chatState = { dirOverride: null, draft: {}, open: {}, limit: 40, needOnly: false, prepared: {}, auto: {} };

  function renderChat(r) {
    const u = Store.me();
    let id = r.id || (r.q && r.q.c) || helperState.contactId || '';
    if (!id && WIDE.matches && u.contacts.length) {
      const recent = u.contacts.map((c) => { const ms = Store.messagesOf(c.id, u); return { c, ts: ms.length ? ms[ms.length - 1].ts : c.createdAt }; }).sort((a, b) => b.ts - a.ts)[0];
      id = recent.c.id;
    }
    if (!id) return renderChatPicker();
    const c = id === 'none' ? null : Store.contact(id);
    if (id !== 'none' && !c) return renderChatPicker();
    helperState.contactId = c ? c.id : null;
    const ms = c ? Store.messagesOf(c.id) : u.messages.filter((m) => !m.contactId).sort((a, b) => a.ts - b.ts);
    const shown = ms.slice(-chatState.limit);
    const lastIn = [...ms].reverse().find((m) => m.dir === 'in');
    const rc = c ? Engine.recall({ text: '', dir: 'in', messages: ms, promises: u.promises.filter((p) => p.contactId === c.id) }) : null;
    const target = c ? c.lang : (chatState.target || (uiLang === 'en' ? 'ko' : 'en'));
    const draft = chatState.draft[id] || '';
    const ai = !!Engine.aiConfig().key;
    const st = c ? convStatus(ms) : null;
    let lastDay = '';
    const threadHtml = shown.map((m) => { const d = new Date(m.ts); const dk = d.toDateString(); let sep = ''; if (dk !== lastDay) { lastDay = dk; const dg = c ? digestsOf(c.id)[Engine.ymd(d)] : null; sep = `<div class="day"><time>${esc(fmtDateW(d))}</time></div>` + (dg && ((dg.facts && dg.facts.length) || dg.summary) ? `<details class="day-mem"><summary>📌 ${t('mem_day')} ${dg.facts ? dg.facts.length : ''} <span class="muted">· ${dg.by === 'ai' ? t('mem_ai') : t('mem_basic')}</span></summary><p class="small">${esc(digestLine(dg))}</p><div class="facts">${(dg.facts || []).map(factChip).join('')}</div></details>` : ''); } return sep + bubbleHtml(c, m, lastIn && m.id === lastIn.id); }).join('');
    shell(`<header class="top chat-bar between" style="flex-wrap:nowrap"><div class="row grow" style="min-width:0;flex-wrap:nowrap"><button class="icon-btn back-btn" type="button" data-go="#/chat" aria-label="${t('back')}">${icon('back')}</button>
        ${c ? `${avatar(c)}<div class="grow" style="min-width:0"><h1 class="ellipsis">${appBadge(c.app)} <span lang="${esc(c.lang)}">${esc(c.nickname)}</span></h1><small class="muted ellipsis" style="display:block">${esc(t('lang_pair', { a: langUi(c.lang), b: langUi(uiLang) }))} · ${esc(t('thread_count', { n: ms.length }))}</small></div>` : `<h1>${t('chat_none')}</h1>`}</div>
        <div class="row" style="gap:6px;flex-wrap:nowrap;flex:0 0 auto">${statusBadge(st)}${c ? `<button class="icon-btn" type="button" data-go="#/coach/${c.id}" aria-label="${t('coach_link')}" title="${esc(t('coach_link'))}">💡</button><button class="icon-btn" type="button" data-go="#/contact/${c.id}" aria-label="${t('contact_info')}" title="${esc(t('contact_info'))}">${icon('person')}</button>` : ''}</div></header>
      <div class="content chat-scroll" style="padding-bottom:12px">
        ${c && (rc.overduePromises.length || rc.upcomingPromises.length) ? `<div class="chat-pins">
          ${rc.upcomingPromises.slice(0, 2).map((p) => `<span class="pin">📅 ${fmtDateW(p.date)} ${esc(p.time || '')} · ${esc(p.title)}${p.place ? ' · ' + esc(p.place) : ''}</span>`).join('')}
          ${rc.overduePromises.slice(0, 2).map((p) => `<span class="pin warn">⏰ ${t('mem_overdue')} · ${esc(p.title)}</span>`).join('')}
        </div>` : ''}
        ${!c ? `<label class="small row">${t('send_lang')} <select class="field" id="ch-target" style="width:auto">${Object.keys(Engine.LANGS).filter((l) => l !== uiLang).map((l) => `<option value="${l}" ${l === target ? 'selected' : ''}>${esc(langName(l))}</option>`).join('')}</select></label>` : ''}
        ${ms.length > shown.length ? `<button class="link" type="button" id="ch-more" style="justify-self:center">${t('show_more')}</button>` : ''}
        <div class="thread" id="thread">
          ${shown.length ? threadHtml : `<div class="empty small">${t('chat_empty')}</div>`}
        </div>
      </div>
      <div class="dock"><div class="composer" id="composer">
        <div class="tools"><div class="row" style="gap:8px"><label class="tiny muted" for="ch-dir">${t('dir_label')}</label>
          <select class="field sel-sm" id="ch-dir"><option value="">${t('dir_auto')}</option><option value="in">${esc(t('dir_in', { from: langUi(target), to: langUi(uiLang) }))}</option><option value="out">${esc(t('dir_out', { from: langUi(uiLang), to: langUi(target) }))}</option></select></div>
          <span class="badge gray" id="ch-det">${t('smart_hint')}</span></div>
        <label class="tiny muted" for="ch-input" style="font-weight:700">${esc(t('draft_of', { who: c ? appName(c.app) + ' / ' + c.nickname : t('chat_none') }))}</label>
        <textarea class="field" id="ch-input" rows="2" placeholder="${esc(t('smart_ph'))}">${esc(draft)}</textarea>
        <div class="tools">
          <div class="row wrap" style="gap:2px 14px">
            <button class="link" type="button" id="ch-paste" style="min-height:32px;font-size:13px">${icon('copy', 'sm')} ${t('paste_btn')}</button>
            <label class="link" style="cursor:pointer;min-height:32px;font-size:13px">${icon('image', 'sm')} ${t('upload_shot')}<input type="file" id="ch-shot" accept="image/*" hidden></label>
            ${ai ? `<span class="tiny muted">${t('ai_on')}</span>` : `<button class="link" type="button" data-go="#/settings" style="min-height:32px;font-size:13px">✨ ${t('g_ai_btn')}</button>`}
          </div>
          <button class="btn primary-btn" type="button" id="ch-send">${t('send')}</button>
        </div>
        <p class="tiny muted" id="h-ocr" hidden></p>
      </div></div>`, 'chat');
    if (!WIDE.matches) { const bn = $app.querySelector('nav.bottom'); if (bn) bn.remove(); }
    if (c && lastIn && !lastIn.analysis && !chatState.auto[lastIn.id] && ms[ms.length - 1] === lastIn) {
      chatState.auto[lastIn.id] = true;
      analyzeExisting(c, lastIn).then((res) => { const mm = Store.me().messages.find((x) => x.id === lastIn.id); if (mm) { mm.analysis = slimAnalysis(res); Store.save(); } if (helperState.contactId === c.id && /^#\/(chat|home)?/.test(location.hash || '#/')) renderChat({ id: c.id }); }).catch(() => {});
    }
    bindChat(c, id, target);
    const th = document.getElementById('thread');
    if (th && th.lastElementChild) requestAnimationFrame(() => { const mn = document.querySelector('.ws-main'); if (mn) mn.scrollTop = mn.scrollHeight; else { window.scrollTo(0, document.documentElement.scrollHeight); } });
  }

  function bubbleHtml(c, m, isLatestIn) {
    const a = m.analysis;
    const risk = m.risk && m.risk.length;
    const hm = (ts) => { const d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
    if (m.dir === 'out') {
      const tl = langUi(m.trLang || (c && c.lang) || '');
      return `<article class="entry mine" data-mid="${m.id}"><div class="meta"><strong>${t('me_reply')}</strong><time>${hm(m.ts)}</time>${m.sent ? statusBadge('done') : statusBadge('copied')}</div>
        <div class="bubble out"><p lang="${esc(m.trLang)}" class="b-main">${esc(m.translation || m.text)}</p>
        ${m.translation ? `<p class="meaning" lang="${esc(m.lang)}">${esc(m.text)}</p>` : ''}
        <div class="b-acts">${m.translation ? `<button class="btn sm secondary" type="button" data-copy-msg="${m.id}">${icon('copy', 'sm')} ${esc(t('copy_lang', { lang: tl }))}</button>` : ''}${m.sent ? '' : `<button class="btn sm ghost" type="button" data-sent="${m.id}">✓ ${t('mark_sent')}</button>`}</div></div></article>`;
    }
    const open = chatState.open[m.id] !== undefined ? chatState.open[m.id] : (isLatestIn && !!a);
    const isNew = isLatestIn && Date.now() - m.ts < 30 * 60000 && !a;
    return `<article class="entry" data-mid="${m.id}"><div class="meta"><strong lang="${esc(c ? c.lang : '')}">${c ? esc(c.nickname) : '?'}</strong><time>${hm(m.ts)}</time>${isNew ? statusBadge('new') : ''}${risk ? `<span class="badge alert">⚠ ${m.risk.includes('money') ? t('risk_money') : t('risk_off')}</span>` : ''}</div>
      <div class="bubble in ${risk ? 'risk' : ''}"><p lang="${esc(m.lang)}" class="b-main">${esc(m.text)}</p>
        ${m.translation ? `<p class="meaning" lang="${esc(m.trLang)}">${esc(m.translation)}</p>` : ''}
        ${open ? '' : `<div class="b-acts"><button class="link" type="button" data-analyze="${m.id}" style="min-height:28px;font-size:13px">💡 ${a ? t('show_sug') : t('analysis')}</button></div>`}
      </div>
      ${m.learnedNote ? `<div class="learned-line">🔍 ${t('learned_toast')}: <b>${esc(m.learnedNote)}</b></div>` : ''}
      ${open ? (a ? analysisHtml(c, m) : `<div class="small muted" data-need="${m.id}"><span class="spinner" style="border-color:rgba(20,87,70,.2);border-top-color:var(--primary);display:inline-block;vertical-align:middle"></span> ${t('analyzing')}</div>`) : ''}
    </article>`;
  }

  function analysisHtml(c, m) {
    const a = m.analysis;
    const u = Store.me();
    const ms = c ? Store.messagesOf(c.id).filter((x) => x.ts < m.ts) : [];
    const rc = c ? Engine.recall({ text: m.text, textTranslated: m.translation, dir: 'in', messages: ms, promises: u.promises.filter((p) => p.contactId === c.id) }) : null;
    const promiseAdded = u.promises.some((p) => p.sourceMsgId === m.id);
    const facts = [a.situation || ''].concat(a.facts || []).filter(Boolean).join(' ');
    return `<div class="insight">
      ${rc && rc.related.length ? `<div class="mem-line">↺ <b>${t('mem_related')}</b> ${rc.related.slice(0, 1).map((x) => `<span class="muted">${esc(fmtDate(new Date(x.msg.ts)))}</span> ${esc(x.msg.dir === 'in' ? (x.msg.translation || x.msg.text) : x.msg.text)}`).join('')}</div>` : ''}
      ${rc && rc.contradictions.length ? `<div class="mem-line warn">⚠ ${rc.contradictions.map((x) => esc(t('mem_conflict_txt', { old: fmtDate(x.promise.date) + ' ' + x.promise.time, new: x.newTime }))).join(' ')}</div>` : ''}
      ${a.when ? `<div class="mem-line warn between"><span>📅 ${esc(fmtWhenUi(a.when))}${a.place ? ' · ' + esc(a.place) : ''}</span><button class="btn sm ${promiseAdded ? 'secondary' : ''}" type="button" data-add-promise="${m.id}" ${promiseAdded ? 'disabled' : ''}>${promiseAdded ? '✓ ' + t('added_reminder') : t('add_reminder')}</button></div>` : ''}
      <details class="nuance"><summary>${t('insight')}</summary>
        <p class="small">${esc((a.nuance || []).join(' '))}</p>
        ${facts ? `<p class="small">${esc(facts)} <span class="badge">${t('fact')}</span></p>` : ''}
        ${(a.inferences || []).length ? `<p class="small muted">${esc(a.inferences.join(' '))} <span class="badge warning">${t('inferred')}</span></p>` : ''}
        ${a.culture ? `<p class="tiny muted">🌏 ${esc(typeof a.culture === 'string' ? a.culture : a.culture.title + ' — ' + a.culture.body)}</p>` : ''}
      </details>
      <div class="sug-h"><h2>${t('suggest_title')}</h2><button class="link" type="button" data-analyze="${m.id}" style="min-height:24px;font-size:12px">▲</button></div>
      <div class="sug-grid">${(a.replies || []).slice(0, 3).map((rp, i) => `<div class="sug-card ${m.chosen === rp.text ? 'on' : ''}">
        <button type="button" class="sug-pick" data-edit="${m.id}|${i}"><strong>${esc(rp.label)}</strong><span>${esc(rp.meaning || '')}</span><small lang="${esc(a.target)}">${esc(rp.text)}</small></button>
        <button type="button" class="sug-copy" data-use="${m.id}|${i}" title="${esc(t('use_reply'))}">${icon('copy', 'sm')} ${t('use_reply')}</button></div>`).join('')}</div>
      ${m.risk && m.risk.length ? `<button class="btn danger-btn sm" type="button" data-report="${m.id}">${t('c_report')}</button>` : ''}
    </div>`;
  }

  function detectDir(text, override) {
    if (override) return override;
    if (!text.trim()) return null;
    return Engine.detect(text) === uiLang ? 'out' : 'in';
  }

  function bindChat(c, id, target) {
    const input = document.getElementById('ch-input');
    const det = document.getElementById('ch-det');
    const dsel = document.getElementById('ch-dir');
    const sendBtn = document.getElementById('ch-send');
    chatState.dirOverride = null;
    const refreshDet = () => {
      const d = detectDir(input.value, chatState.dirOverride);
      chatState.draft[id] = input.value;
      sendBtn.textContent = d === 'in' ? t('btn_in') : t('btn_out', { lang: langUi(target) });
      if (!d) { det.textContent = t('smart_hint'); det.className = 'badge gray'; return; }
      det.textContent = (d === 'in' ? '⬅ ' + t('det_in') + ' · ' + langName(Engine.detect(input.value)) : '➡ ' + t('det_out') + ' → ' + langName(target));
      det.className = 'badge ' + (d === 'in' ? 'lilac' : '');
    };
    input.addEventListener('input', () => { if (!dsel.value) chatState.dirOverride = null; refreshDet(); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); sendBtn.click(); } });
    dsel.addEventListener('change', () => { chatState.dirOverride = dsel.value || null; refreshDet(); });
    refreshDet();
    const tg = document.getElementById('ch-target'); if (tg) tg.addEventListener('change', () => { chatState.target = tg.value; renderChat({ id }); });
    const more = document.getElementById('ch-more'); if (more) more.addEventListener('click', () => { chatState.limit += 60; renderChat({ id }); });
    document.getElementById('ch-paste').addEventListener('click', async () => { try { const s = await navigator.clipboard.readText(); if (s) { input.value = s; refreshDet(); } } catch (e) { input.focus(); } });
    document.getElementById('ch-shot').addEventListener('change', async (e) => { const f = e.target.files[0]; if (f) { await runOcr(f, input); chatState.dirOverride = 'in'; refreshDet(); } });
    document.getElementById('ch-send').addEventListener('click', async (ev) => {
      const text = input.value.trim(); if (!text) { input.focus(); return; }
      const d = detectDir(text, chatState.dirOverride);
      const btn = ev.currentTarget; spinBtn(btn, true, '');
      try {
        if (d === 'in') {
          const res = await analyzeIncoming(c, text);
          const msg = Store.me().messages.find((x) => x.id === res.msgId);
          if (msg) { msg.analysis = slimAnalysis(res); Store.save(); chatState.open[msg.id] = true; }
        } else {
          const pr = chatState.prepared[id];
          const r2 = pr && pr.meaning === text ? { text: pr.text } : await tr(text, target, uiLang, { tone: helperState.tone, relation: c ? c.relation : '' });
          const m = Store.addMessage({ contactId: c ? c.id : null, dir: 'out', text, lang: uiLang, translation: r2.text, trLang: target, source: pr && pr.meaning === text ? 'reply' : 'write', replyTo: pr && pr.meaning === text ? pr.mid : undefined });
          if (pr && pr.meaning === text) { const om = Store.me().messages.find((x) => x.id === pr.mid); if (om) om.chosen = pr.text; }
          delete chatState.prepared[id];
          await copyText(r2.text);
          toast(t('copied', { app: c ? appName(c.app) : 'messenger' }));
          m.copied = true;
        }
        chatState.draft[id] = '';
        renderChat({ id });
      } catch (e) { console.error(e); toast(t('trans_fail')); spinBtn(btn, false); }
    });
    // 말풍선 동작
    $app.querySelectorAll('[data-copy-msg]').forEach((b) => b.addEventListener('click', async () => { const m = Store.me().messages.find((x) => x.id === b.dataset.copyMsg); if (m) { await copyText(m.translation || m.text); toast(t('copied', { app: c ? appName(c.app) : 'messenger' })); } }));
    $app.querySelectorAll('[data-analyze]').forEach((b) => b.addEventListener('click', async () => {
      const mid = b.dataset.analyze; const m = Store.me().messages.find((x) => x.id === mid);
      const isOpen = chatState.open[mid] !== undefined ? chatState.open[mid] : false;
      chatState.open[mid] = !isOpen || (!m.analysis && isOpen === false);
      if (chatState.open[mid] && !m.analysis) {
        renderChat({ id });
        try { const res = await analyzeExisting(c, m); m.analysis = slimAnalysis(res); Store.save(); } catch (e) { toast(t('trans_fail')); chatState.open[mid] = false; }
      }
      renderChat({ id });
    }));
    $app.querySelectorAll('[data-use]').forEach((b) => b.addEventListener('click', async () => {
      const [mid, i] = b.dataset.use.split('|'); const m = Store.me().messages.find((x) => x.id === mid); const rp = m.analysis.replies[Number(i)];
      await copyText(rp.text);
      Store.addMessage({ contactId: c ? c.id : null, dir: 'out', text: rp.meaning || rp.text, lang: uiLang, translation: rp.text, trLang: m.analysis.target, source: 'reply', replyTo: m.id });
      m.chosen = rp.text; chatState.open[mid] = false; Store.save();
      toast(t('copied', { app: c ? appName(c.app) : 'messenger' }));
      renderChat({ id });
    }));
    $app.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => {
      const [mid, i] = b.dataset.edit.split('|'); const m = Store.me().messages.find((x) => x.id === mid); const rp = m.analysis.replies[Number(i)];
      input.value = rp.meaning || rp.text; chatState.dirOverride = 'out'; dsel.value = 'out'; chatState.prepared[id] = { meaning: input.value, text: rp.text, mid }; refreshDet(); input.focus(); toast(t('sug_fill'));
    }));
    $app.querySelectorAll('[data-add-promise]').forEach((b) => b.addEventListener('click', () => {
      const m = Store.me().messages.find((x) => x.id === b.dataset.addPromise); const a = m.analysis;
      Store.addPromise({ contactId: c ? c.id : null, title: (c ? c.nickname + ' · ' : '') + t('promise'), date: a.when.date || today(), time: a.when.time || '', place: a.place || '', sourceMsgId: m.id });
      toast(t('added_reminder')); askNotify(); renderChat({ id });
    }));
    $app.querySelectorAll('[data-report]').forEach((b) => b.addEventListener('click', () => openReport(c, b.dataset.report)));
    $app.querySelectorAll('[data-sent]').forEach((b) => b.addEventListener('click', () => { const m = Store.me().messages.find((x) => x.id === b.dataset.sent); if (m) { m.sent = true; Store.save(); renderChat({ id }); } }));
    const draft = chatState.draft[id]; if (draft && !input.value) { input.value = draft; refreshDet(); }
  }

  function slimAnalysis(res) {
    return { nuance: res.nuance, facts: res.facts, situation: res.situation || '', inferences: res.inferences, when: res.when, place: res.place, replies: res.replies, target: res.target, culture: res.culture, provider: res.provider, risk: res.risk };
  }

  // 이미 저장된 받은 메시지를 분석 (중복 저장 없이)
  async function analyzeExisting(c, m) {
    const res = await analyzeIncoming(c, m.text, { existing: m });
    // analyzeIncoming 이 같은 메시지를 갱신하므로 별도 처리 불필요
    return res;
  }

  function renderChatPicker() {
    const u = Store.me();
    const none = u.messages.filter((m) => !m.contactId);
    const items = agendaItems(u).filter((x) => x.kind !== 'upcoming').slice(0, 3);
    shell(`${topBar('', null, `<div class="row" style="gap:6px;flex-wrap:nowrap"><button class="icon-btn" type="button" data-go="#/guide" aria-label="${esc(t('nav_guide'))}">${icon('help')}</button></div>`)}
      <div class="content stack">
        ${items.length ? `<button type="button" class="today-strip" data-go="#/agenda"><span class="ws-h">${t('today')}</span>${items.map((x) => `<span class="small ellipsis">${itemText(x)}</span>`).join('')}</button>` : ''}
        ${filtersHtml(u)}
        <div class="ws-list tall card" id="ws-list" style="padding:4px">${wsRows(u, '')}</div>
        <button class="list-row card" type="button" data-go="#/chat/none" style="padding:10px 12px"><span class="avatar">?</span><span class="grow"><strong>${t('chat_none')}</strong>${none.length ? `<br><span class="small muted">${esc(t('thread_count', { n: none.length }))}</span>` : ''}</span></button>
      </div>`, 'chat');
  }


  /* ================= 하루 단위 대화 기억 =================
     상대별로 날짜마다 대화를 정리해 u.digests[contactId][YYYY-MM-DD]에 저장합니다.
     기본 분석은 바로, AI 키가 있으면 AI 요약을 뒤에서 순서대로 채웁니다. */
  const FT_ICON = { profile: '👤', plan_date: '📅', like: '♥', dislike: '✕', worry: '💬', family: '👪', pet: '🐾', work: '💼', plan: '✈', other: '•' };
  function dayKey(ts) { return Engine.ymd(new Date(ts)); }
  function digestsOf(cid, u) { u = u || Store.me(); u.digests = u.digests || {}; return u.digests[cid] || {}; }
  let aiDigestBusy = false; const aiDigestQueue = [];
  function runDigests(onlyCid) {
    const u = Store.me(); if (!u) return;
    u.digests = u.digests || {};
    let changed = false;
    u.contacts.filter((c) => !onlyCid || c.id === onlyCid).forEach((c) => {
      const ms = Store.messagesOf(c.id, u); if (!ms.length) return;
      const byDay = {}; ms.forEach((m) => { const k = dayKey(m.ts); (byDay[k] = byDay[k] || []).push(m); });
      const D = u.digests[c.id] = u.digests[c.id] || {};
      Object.keys(byDay).forEach((k) => {
        const list = byDay[k];
        const cur = D[k];
        if (cur && cur.n === list.length) return;
        const mem = Engine.dayMemory(list);
        D[k] = Object.assign({}, mem, { by: 'basic', at: Date.now(), summary: '' });
        changed = true;
        if (Engine.aiConfig().key && !aiDigestQueue.some((q) => q.cid === c.id && q.day === k)) aiDigestQueue.push({ cid: c.id, day: k });
      });
    });
    if (changed) Store.save();
    pumpAiDigests();
  }
  async function pumpAiDigests() {
    if (aiDigestBusy || !aiDigestQueue.length || !Engine.aiConfig().key) return;
    aiDigestBusy = true;
    const job = aiDigestQueue.shift();
    try {
      const u = Store.me(); const c = u.contacts.find((x) => x.id === job.cid);
      const list = c ? Store.messagesOf(c.id, u).filter((m) => dayKey(m.ts) === job.day) : [];
      if (c && list.length) {
        const r = await Engine.aiDayMemory(list, c, uiLang);
        const D = u.digests[c.id] = u.digests[c.id] || {};
        D[job.day] = Object.assign({}, D[job.day] || {}, { summary: r.summary, facts: r.facts.length ? r.facts : (D[job.day] || {}).facts || [], by: 'ai', at: Date.now(), n: list.length });
        Store.save();
      }
    } catch (e) { /* AI 실패 시 기본 분석 유지 */ }
    aiDigestBusy = false;
    if (aiDigestQueue.length) setTimeout(pumpAiDigests, 400);
  }
  function digestLine(d) {
    if (!d) return '';
    return d.summary || [t('mem_sum', { n: d.n, i: d.inN, o: d.outN }), d.topics && d.topics.length ? t('mem_topics') + ': ' + d.topics.join(', ') : '', d.questions ? t('mem_q', { n: d.questions }) : ''].filter(Boolean).join(' · ');
  }
  function factChip(f) { return `<span class="fact ft-${esc(f.type)}" title="${esc(f.orig || '')}"><b>${FT_ICON[f.type] || '•'} ${esc(t('ft_' + f.type) || f.type)}</b> ${esc(f.text)}</span>`; }
  function recentFacts(cid, n) {
    const D = digestsOf(cid); const out = [];
    Object.keys(D).sort().reverse().forEach((k) => (D[k].facts || []).forEach((f) => { if (out.length < n) out.push(Object.assign({ day: k }, f)); }));
    return out;
  }

  /* ================= 사용법 ================= */
  function renderGuide() {
    const u = Store.me();
    const hasContacts = u.contacts.length > 0;
    const ai = !!Engine.aiConfig().key;
    const step = (n, tt, body, extra) => `<li class="g-step"><span class="g-num">${n}</span><div class="stack-xs" style="min-width:0"><h3>${tt}</h3><p class="small muted">${body}</p>${extra || ''}</div></li>`;
    shell(`${topBar(t('g_title'), null)}
      <div class="content stack">
        <div class="card stack-sm g-hero"><p>${t('g_lead')}</p></div>
        <ol class="g-steps card">
          ${step(1, t('g1t'), t('g1'), `<button class="btn sm" type="button" data-go="#/contact-edit/new" style="justify-self:start">+ ${t('g_add')}</button>`)}
          ${step(2, t('g2t'), t('g2'), `<div class="g-demo"><span class="g-msg in" lang="zh-Hans">明天下午三点见吧？</span><span class="g-arrow">→</span><span class="g-msg">${uiLang === 'ko' ? '내일 오후 3시에 볼까요?' : 'Tomorrow 3 PM?'}</span></div>`)}
          ${step(3, t('g3t'), t('g3'), `<div class="g-demo"><span class="g-msg">${uiLang === 'ko' ? '좋아요! 3시에 봐요' : 'Sure! See you at 3'}</span><span class="g-arrow">→</span><span class="g-msg out" lang="zh-Hans">好啊！三点见</span><span class="badge">${icon('copy', 'sm')}</span></div>`)}
          ${step(4, t('g4t'), t('g4'))}
        </ol>
        <div class="card stack-sm ${ai ? '' : 'g-ai'}"><h2>${t('g_ai_t')} ${ai ? '<span class="badge">✓ ' + t('ai_on') + '</span>' : ''}</h2><p class="small muted">${t('g_ai')}</p>${ai ? '' : `<button class="btn secondary" type="button" data-go="#/settings">${t('g_ai_btn')}</button>`}</div>
        <div class="two"><button class="btn" type="button" data-go="${hasContacts ? '#/chat' : '#/contact-edit/new'}">${hasContacts ? t('g_open_chat') : t('g_add')}</button>${u.contacts.some((c) => c.sample) ? `<button class="btn secondary" type="button" data-go="#/contact-edit/new">+ ${t('g_add')}</button>` : `<button class="btn secondary" type="button" id="g-sample">${t('g_try')}</button>`}</div>
        <p class="tiny muted">${t('g_note')}</p>
      </div>`, 'guide');
    const gs = document.getElementById('g-sample'); if (gs) gs.addEventListener('click', () => { Store.loadSamples(u, uiLang); toast(t('sample_loaded')); go('#/chat'); });
  }

  /* ================= 연락처 상세 ================= */
  function renderContact(r) {
    const u = Store.me();
    const c = Store.contact(r.id);
    if (!c) return go('#/contacts');
    const ms = Store.messagesOf(c.id);
    const pf = Engine.profile(ms);
    const td = today();
    const daysMet = c.metAt ? daysBetween(c.metAt, td) + 1 : null;
    const ann = annivList(u, c.id);
    const nextP = u.promises.filter((p) => p.contactId === c.id && !p.done && p.date >= td).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
    const overdue = u.promises.filter((p) => p.contactId === c.id && !p.done && p.date < td);
    const rc = Engine.recall({ text: '', dir: 'in', messages: ms, promises: [] });
    const stageKey = STAGES[c.relation || 'friend'][c.stage || 0];
    const sajuOk = !!(c.birthday);
    const recent = ms.slice(-8);
    shell(`${topBar(esc(t('contact_title')), '#/contacts', `<button class="link" type="button" data-go="#/contact-edit/${c.id}">${t('c_edit')}</button>`)}
      <div class="content stack-lg">
        <div class="card soft stack">
          <div class="row">${avatar(c, 'lg')}<div class="grow"><h1 lang="${esc(c.lang)}">${esc(c.nickname)}</h1><p class="small muted">${esc(appName(c.app))} / ${esc(c.nickname)} · ${esc(langUi(c.lang))}${c.country ? ' · ' + esc(countryName(c.country)) : ''}</p>
            <div class="row wrap" style="gap:6px;margin-top:6px"><span class="badge">${esc(t('rel_' + (c.relation || 'friend')))} · ${esc(STAGE_NAMES[uiLang][stageKey])}</span>${daysMet ? `<span class="badge gray">${esc(t('c_days_met', { n: daysMet }))}</span>` : ''}</div></div></div>
          <div class="two"><button class="btn" type="button" data-go="#/chat/${c.id}">${t('c_import')}</button><button class="btn secondary" type="button" data-go="#/coach/${c.id}">${t('coach_link')}</button></div>
        </div>
        <div class="card stack-sm">
          <div class="between"><h2>${t('mem_title')}</h2><button class="link" type="button" id="mem-refresh" style="font-size:13px">${t('mem_refresh')}</button></div>
          ${(() => { const D = digestsOf(c.id); const ks = Object.keys(D).sort().reverse(); return ks.length ? `<ol class="mem-tl">${ks.slice(0, 30).map((k) => `<li><div class="mem-d"><b>${esc(fmtDateW(k))}</b> <span class="tiny muted">${D[k].by === 'ai' ? t('mem_ai') : t('mem_basic')}</span></div><p class="small">${esc(digestLine(D[k]))}</p>${(D[k].facts || []).length ? `<div class="facts">${D[k].facts.map(factChip).join('')}</div>` : ''}</li>`).join('')}</ol>` : `<p class="small muted">${t('mem_none')}</p>`; })()}
        </div>
        <div class="card stack-sm">
          <div class="between"><h2>${t('learned_title')}</h2><span class="badge lilac">💬 ${t('learned_badge')}</span></div>
          ${(() => { const L = c.learned || {}; const keys = ['age', 'gender', 'birthday', 'blood', 'mbti', 'job', 'city'].filter((k) => L[k]); return keys.length ? `<dl class="data-grid">${keys.map((k) => `<dt>${esc({ age: t('c_age'), gender: t('c_gender'), birthday: t('c_birthday'), blood: t('c_blood'), mbti: 'MBTI', job: t('c_job'), city: t('c_city') }[k])}</dt><dd><b>${esc(learnedVal(c, k))}</b><br><span class="tiny muted">“${esc(L[k].text || '')}” · ${esc(fmtDate(new Date(L[k].ts)))}</span></dd>`).join('')}</dl><p class="tiny muted">${t('learned_hint')}</p>` : `<p class="small muted">${t('learned_none')}</p>`; })()}
          ${[c.job ? t('c_job') + ' ' + esc(c.job) : '', c.city ? t('c_city') + ' ' + esc(c.city) : ''].filter(Boolean).length && !(c.learned && (c.learned.job || c.learned.city)) ? `<p class="small">${[c.job ? t('c_job') + ' ' + esc(c.job) : '', c.city ? t('c_city') + ' ' + esc(c.city) : ''].filter(Boolean).join(' · ')}</p>` : ''}
        </div>
        <div class="card stack">
          <h2>${t('c_dates')}</h2>
          <dl class="data-grid">
            <dt>${t('c_met')}</dt><dd>${c.metAt ? fmtDate(c.metAt, true) + ` · ${esc(t('c_days_met', { n: daysMet }))}` : t('c_unknown')}</dd>
            <dt>${t('c_birthday')}</dt><dd>${c.birthday ? fmtDate(c.birthday.length > 5 ? c.birthday : '2000-' + c.birthday) + (c.birthLunar ? ' (' + t('lunar') + ')' : '') : t('c_unknown')}</dd>
            ${ann.slice(0, 3).map((a) => `<dt>${esc(a.label)}</dt><dd>${a.inDays === 0 ? t('d_today') : t('d_day', { n: a.inDays })} · ${fmtDateW(a.date)}</dd>`).join('')}
            <dt>${t('c_next_meet')}</dt><dd>${nextP ? `${fmtDateW(nextP.date)} ${esc(nextP.time || '')} · ${esc(nextP.title)}${nextP.place ? ' · ' + esc(nextP.place) : ''}` : t('none')}</dd>
            <dt>${t('c_todo')}</dt><dd>${[...rc.unanswered.slice(-2).map((m) => '💬 ' + esc((m.translation || m.text).slice(0, 40))), ...overdue.map((p) => '⏰ ' + esc(p.title))].join('<br>') || t('none')}</dd>
          </dl>
          <div class="two"><button class="btn secondary" type="button" data-go="#/agenda?c=${c.id}">${t('add_promise')}</button><button class="btn secondary" type="button" data-go="#/anniv?c=${c.id}">${t('anniv_title')}</button></div>
        </div>
        <div class="card stack">
          <div class="between wrap"><h2>${t('c_analysis')}</h2><span class="badge warning">${t('inferred')}</span></div>
          ${pf.count >= 5 ? `<dl class="data-grid">
            <dt>${t('st_formal')}</dt><dd>${t(pf.formality === 'polite' ? 'formal_polite' : 'formal_casual')}</dd>
            <dt>${t('st_avg_len')}</dt><dd>${t('chars', { n: pf.avgLen })}</dd>
            <dt>${t('st_reply')}</dt><dd>${dur(pf.replyMinutes)}</dd>
            <dt>${t('st_emoji')}</dt><dd>${t('percent', { n: Math.round(pf.emojiRate * 100) })}</dd>
            <dt>${t('st_active')}</dt><dd>${pf.activeHour !== null ? t('hour_at', { n: pf.activeHour }) : '—'}</dd>
            <dt>${t('st_initiative')}</dt><dd>${t('percent', { n: Math.round(pf.initiative * 100) })}</dd>
            <dt>${t('st_mood')}</dt><dd>${t('mood_' + pf.mood)}</dd>
            <dt>${t('st_topics')}</dt><dd>${pf.topics.length ? pf.topics.map((x) => `<span class="chip">${esc(x)}</span>`).join(' ') : '—'}</dd>
          </dl>
          <div class="stack-xs"><div class="between small"><span>${t('st_depth')}</span><strong>${pf.depth} / 100</strong></div><div class="bar"><span style="width:${pf.depth}%"></span></div></div>
          ${pf.silentDays > 3 ? `<p class="small muted">${esc(t('silent_days', { n: pf.silentDays }))}</p>` : ''}` : `<p class="small muted">${t('c_need_more')}</p>`}
        </div>
        <div class="card stack">
          <div class="between wrap"><h2>${t('c_recent')}</h2>${who(c)}</div>
          ${recent.length ? `<div class="thread">${recent.map((m) => `<div class="bubble ${m.dir}"><div lang="${esc(m.lang)}">${esc(m.text)}</div>${m.translation ? `<div class="tr" lang="${esc(m.trLang)}">${esc(m.translation)}</div>` : ''}<div class="tiny muted" style="margin-top:4px">${fmtTs(m.ts)}</div></div>`).join('')}</div>` : `<p class="small muted">${t('memory_none')}</p>`}
          <button class="link" type="button" data-go="#/chat/${c.id}">${t('c_import')} ${icon('arrow', 'sm')}</button>
        </div>
        <div class="card stack">
          <h2>${t('c_myinfo')}</h2>
          <dl class="data-grid">
            <dt>${t('c_age')}</dt><dd>${esc(c.age || t('c_unknown'))}</dd>
            <dt>${t('c_gender')}</dt><dd>${c.gender ? t('gender_' + c.gender) : t('c_unknown')}</dd>
            <dt>${t('c_blood')}</dt><dd>${esc(c.blood || t('c_unknown'))}</dd>
            <dt>${t('c_mbti')}</dt><dd>${esc(c.mbti || t('c_unknown'))}</dd>
            <dt>${t('c_birth_time')}</dt><dd>${esc(c.birthTime || t('c_unknown'))}</dd>
          </dl>
          <button class="link" type="button" data-go="#/saju/${c.id}">${t('saju_title')}${sajuOk ? '' : ' (' + t('saju_need') + ')'} ${icon('arrow', 'sm')}</button>
        </div>
        <div class="card stack-sm">
          <label for="c-note"><strong>${t('c_note')}</strong></label>
          <textarea class="field" id="c-note" rows="3" placeholder="${esc(t('c_note_ph'))}">${esc(c.note || '')}</textarea>
          <button class="btn secondary full" type="button" id="c-note-save">${t('c_save')}</button>
        </div>
        <div class="three"><button class="btn secondary" type="button" data-go="#/gift/${c.id}">🎁 ${t('gift_title').split(' ')[0]}</button><button class="btn secondary" type="button" data-go="#/culture?c=${c.id}">🌏 ${t('culture_title').split(' ')[0]}</button><button class="btn secondary" type="button" data-go="#/saju/${c.id}">☯ ${t('compat_saju')}</button></div>
        <div class="two"><button class="btn secondary" type="button" id="c-report">${t('c_report')}</button><button class="btn secondary" type="button" id="c-del" style="color:var(--danger)">${t('c_delete')}</button></div>
      </div>`, 'contacts');
    const mr = document.getElementById('mem-refresh'); if (mr) mr.addEventListener('click', () => { const D = digestsOf(c.id); Object.keys(D).forEach((k) => { D[k].n = -1; }); runDigests(c.id); setTimeout(() => renderContact(r), 300); toast(t('mem_refresh')); });
    document.getElementById('c-note-save').addEventListener('click', () => { Store.updateContact(c.id, { note: document.getElementById('c-note').value }); toast(t('saved')); });
    document.getElementById('c-del').addEventListener('click', () => { if (confirm(t('c_delete_confirm'))) { Store.removeContact(c.id); go('#/contacts'); } });
    document.getElementById('c-report').addEventListener('click', () => openReport(c, null));
  }

  /* ================= 연락처 추가·수정 ================= */
  function renderContactEdit(r) {
    const isNew = r.id === 'new';
    const u = Store.me();
    const c = isNew ? { app: 'kakaotalk', lang: uiLang === 'ko' ? 'zh' : 'ko', country: '', color: DATA.COLORS[u.contacts.length % DATA.COLORS.length], relation: 'friend', stage: 0, metAt: today() } : Store.contact(r.id);
    if (!c) return go('#/contacts');
    const sel = (v, opts) => opts.map(([val, lab]) => `<option value="${esc(val)}" ${String(c[v] || '') === String(val) ? 'selected' : ''}>${esc(lab)}</option>`).join('');
    const stages = STAGES[c.relation || 'friend'];
    shell(`${topBar(isNew ? t('add_contact') : t('c_edit'), isNew ? '#/contacts' : '#/contact/' + c.id)}
      <form class="content stack" id="ce">
        <label class="stack-xs"><span class="label">${t('c_app')}</span><select class="field" name="app">${sel('app', DATA.APPS.map((a) => [a.id, a.name]))}</select></label>
        <label class="stack-xs"><span class="label">${t('c_nick')} *</span><input class="field" name="nickname" required maxlength="40" value="${esc(c.nickname || '')}"></label>
        <div class="two">
          <label class="stack-xs"><span class="label">${t('c_lang')}</span><select class="field" name="lang">${sel('lang', Object.keys(Engine.LANGS).map((l) => [l, langName(l)]))}</select></label>
          <label class="stack-xs"><span class="label">${t('c_country')}</span><select class="field" name="country"><option value="">—</option>${sel('country', DATA.COUNTRIES.map((x) => [x.id, x.flag + ' ' + (x[uiLang] || x.en)]))}</select></label>
        </div>
        <fieldset class="card"><legend class="label">${t('c_color')}</legend><div class="row wrap">${DATA.COLORS.map((col) => `<label class="inline-input"><input type="radio" name="color" value="${col}" ${c.color === col ? 'checked' : ''}><span class="avatar sm col-${col}">${initial(c.nickname || 'A')}</span></label>`).join('')}</div></fieldset>
        <div class="two">
          <label class="stack-xs"><span class="label">${t('c_relation')}</span><select class="field" name="relation">${sel('relation', ['romance', 'friend', 'business'].map((x) => [x, t('rel_' + x)]))}</select></label>
          <label class="stack-xs"><span class="label">${t('coach_stage')}</span><select class="field" name="stage">${stages.map((s, i) => `<option value="${i}" ${Number(c.stage || 0) === i ? 'selected' : ''}>${esc(STAGE_NAMES[uiLang][s])}</option>`).join('')}</select></label>
        </div>
        <label class="stack-xs"><span class="label">${t('c_met')}</span><input class="field" type="date" name="metAt" value="${esc(c.metAt || '')}"></label>
        <details class="card more-info" ${isNew ? '' : 'open'}><summary><b>${t('c_more')}</b> <span class="small muted">${t('c_more_hint')}</span></summary><div class="stack" style="margin-top:12px">
        <div class="two">
          <label class="stack-xs"><span class="label">${t('c_birthday')}</span><input class="field" type="date" name="birthday" value="${esc(c.birthday && c.birthday.length === 10 ? c.birthday : '')}"></label>
          <label class="stack-xs"><span class="label">${t('c_birth_time')}</span><input class="field" type="time" name="birthTime" value="${esc(c.birthTime || '')}"></label>
        </div>
        <label class="inline-input small"><input type="checkbox" name="birthLunar" ${c.birthLunar ? 'checked' : ''}> ${t('lunar')}</label>
        <div class="three">
          <label class="stack-xs"><span class="label">${t('c_age')}</span><input class="field" type="number" min="0" max="120" name="age" value="${esc(c.age || '')}"></label>
          <label class="stack-xs"><span class="label">${t('c_blood')}</span><select class="field" name="blood"><option value="">—</option>${sel('blood', ['A', 'B', 'O', 'AB'].map((x) => [x, x]))}</select></label>
          <label class="stack-xs"><span class="label">${t('c_gender')}</span><select class="field" name="gender"><option value="">—</option>${sel('gender', [['f', t('gender_f')], ['m', t('gender_m')], ['x', t('gender_x')]])}</select></label>
        </div>
        <label class="stack-xs"><span class="label">${t('c_mbti')}</span><select class="field" name="mbti"><option value="">—</option>${sel('mbti', ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'].map((x) => [x, x]))}</select></label>
        <div class="two">
          <label class="stack-xs"><span class="label">${t('c_job')}${c.learned && c.learned.job ? ` <span class="badge lilac">💬 ${t('learned_badge')}</span>` : ''}</span><input class="field" name="job" maxlength="40" value="${esc(c.job || '')}"></label>
          <label class="stack-xs"><span class="label">${t('c_city')}${c.learned && c.learned.city ? ` <span class="badge lilac">💬 ${t('learned_badge')}</span>` : ''}</span><input class="field" name="city" maxlength="40" value="${esc(c.city || '')}"></label>
        </div>
        </div></details>
        <label class="stack-xs"><span class="label">${t('c_note')}</span><textarea class="field" name="note" rows="3" placeholder="${esc(t('c_note_ph'))}">${esc(c.note || '')}</textarea></label>
        <button class="btn full" type="submit">${t('save')}</button>
      </form>`, 'contacts');
    const form = document.getElementById('ce');
    form.relation.addEventListener('change', () => {
      const st = STAGES[form.relation.value];
      form.stage.innerHTML = st.map((s, i) => `<option value="${i}">${esc(STAGE_NAMES[uiLang][s])}</option>`).join('');
    });
    form.country.addEventListener('change', () => { const co = DATA.COUNTRIES.find((x) => x.id === form.country.value); if (co && isNew) form.lang.value = co.lang; });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = new FormData(form);
      const data = {};
      ['app', 'nickname', 'lang', 'country', 'color', 'relation', 'metAt', 'birthday', 'birthTime', 'age', 'blood', 'gender', 'mbti', 'job', 'city', 'note'].forEach((k) => { data[k] = (f.get(k) || '').toString().trim(); });
      // 대화로 채운 값을 직접 바꾸면 직접 입력 값으로 취급
      if (!isNew && c.learned) { const L = Object.assign({}, c.learned); Object.keys(L).forEach((k) => { if (String(data[k] || '') !== String(c[k] || '')) delete L[k]; }); data.learned = L; }
      data.stage = Number(f.get('stage') || 0);
      data.birthLunar = !!f.get('birthLunar');
      if (!data.nickname) return;
      if (isNew) { const nc = Store.addContact(data); homeContact = nc.id; helperState.contactId = nc.id; go('#/chat/' + nc.id); }
      else { Store.updateContact(c.id, data); toast(t('saved')); go('#/contact/' + c.id); }
    });
  }

  /* ================= 관계 코칭 ================= */
  function renderCoach(r) {
    const c = Store.contact(r.id);
    if (!c) return go('#/contacts');
    const ms = Store.messagesOf(c.id);
    const pf = Engine.profile(ms);
    const rel = c.relation || 'friend';
    const stages = STAGES[rel];
    const stage = Math.min(c.stage || 0, stages.length - 1);
    const key = stages[stage];
    const tips = (COACH[uiLang] || COACH.en)[key];
    const signals = [];
    const lastIn = [...ms].reverse().find((m) => m.dir === 'in');
    const ex = EXPLAIN[uiLang];
    if (pf.count) {
      if (pf.initiative >= 0.5) signals.push('✅ ' + ex.i_initiative);
      if (pf.mood === 'good') signals.push('✅ ' + t('st_mood') + ': ' + t('mood_good'));
      if (pf.mood === 'low') signals.push('⚠ ' + t('st_mood') + ': ' + t('mood_low'));
      const aff = ms.filter((m) => m.dir === 'in' && Engine.RX.affection.test(m.text)).length;
      if (aff) signals.push('💗 ' + ex.n_affection + ' (' + aff + ')');
      if (pf.silentDays > 5) signals.push('⏳ ' + t('silent_days', { n: pf.silentDays }));
      if (lastIn && Engine.RX.invite.test(lastIn.text)) signals.push('📅 ' + ex.n_invite);
      if (lastIn && Engine.RX.busy.test(lastIn.text)) signals.push('🕒 ' + ex.n_busy);
      signals.push('📊 ' + t('st_depth') + ' ' + pf.depth + '/100');
    }
    shell(`${topBar(t('coach_link'), '#/contact/' + c.id)}
      <div class="content stack-lg">
        <div class="stack-sm">${who(c)}<h1>${t('coach_title')}</h1></div>
        <div class="card stack-sm"><span class="label">${t('coach_mode')}</span>
          <div class="seg">${['romance', 'friend', 'business'].map((x) => `<button type="button" data-rel="${x}" aria-pressed="${rel === x}">${t('rel_' + x)}</button>`).join('')}</div></div>
        <div class="card stack">
          <div class="between wrap"><h2>${t('coach_stage')}</h2><span class="badge">${t('coach_stage_hint')}</span></div>
          <ol class="steps">${stages.map((s, i) => `<li ${i === stage ? 'aria-current="step"' : ''} class="${i < stage ? 'done' : ''}"><button type="button" class="link" style="min-height:24px;color:inherit" data-stage="${i}">${i < stage ? '✓' : i + 1 + '.'} ${esc(STAGE_NAMES[uiLang][s])}</button></li>`).join('')}</ol>
        </div>
        ${signals.length ? `<div class="card stack-sm"><h3>${t('coach_signals')}</h3>${signals.map((s) => `<p class="small">${esc(s)}</p>`).join('')}</div>` : ''}
        <div class="card soft stack-sm"><h2>${t('coach_next')}</h2><p>${esc(tips[0])}</p>${lastIn ? `<p class="small muted">${t('coach_basis')} · ${esc(fmtTs(lastIn.ts))} "${esc((lastIn.translation || lastIn.text).slice(0, 60))}"</p>` : ''}</div>
        <div class="card notice stack-sm"><h2>${t('coach_avoid')}</h2><p>${esc(tips[1])}</p></div>
        <div class="card stack-sm">
          <span class="label">${t('coach_example')} · ${esc(langUi(c.lang))}</span>
          <p id="co-ex" lang="${esc(c.lang)}" style="font-size:16px"><span class="skeleton" style="display:block;width:80%"></span></p>
          <p class="small muted">${t('meaning')} · ${esc(tips[2])}</p>
          <div class="two"><button class="btn secondary" type="button" data-go="#/chat/${c.id}">${t('mode_out')}</button><button class="btn" type="button" id="co-copy">${icon('copy')} ${t('copy_theirs')}</button></div>
        </div>
      </div>`, 'contacts');
    let exText = '';
    tr(tips[2], c.lang, uiLang, { relation: rel }).then((x) => { exText = x.text; const el = document.getElementById('co-ex'); if (el) el.textContent = x.text; }).catch(() => { const el = document.getElementById('co-ex'); if (el) el.textContent = tips[2]; exText = tips[2]; });
    document.getElementById('co-copy').addEventListener('click', async () => { if (!exText) return; await copyText(exText); Store.addMessage({ contactId: c.id, dir: 'out', text: tips[2], lang: uiLang, translation: exText, trLang: c.lang, source: 'coach' }); toast(t('copied', { app: appName(c.app) })); });
    $app.querySelectorAll('[data-rel]').forEach((b) => b.addEventListener('click', () => { Store.updateContact(c.id, { relation: b.dataset.rel, stage: 0 }); renderCoach(r); }));
    $app.querySelectorAll('[data-stage]').forEach((b) => b.addEventListener('click', () => { Store.updateContact(c.id, { stage: Number(b.dataset.stage) }); renderCoach(r); }));
  }

  /* ================= 일정 ================= */
  /* ---------- 월간 달력 ---------- */
  const calState = { ym: null, sel: null };
  function calEvents(u, from, to) {
    const ev = [];
    u.promises.forEach((p) => { if (p.date >= from && p.date <= to) ev.push({ date: p.date, kind: p.done ? 'done' : 'promise', c: u.contacts.find((x) => x.id === p.contactId), title: (p.time ? p.time + ' ' : '') + p.title, p }); });
    annivList(u).forEach((a) => { const d = Engine.ymd(a.date); if (d >= from && d <= to) ev.push({ date: d, kind: a.type === 'birthday' ? 'birthday' : 'anniv', c: a.c, title: a.label }); });
    (u.anniversaries || []).forEach((a) => { if (!a.date) return; const md = a.date.slice(5); const y = from.slice(0, 4); const d = (a.repeat === false ? a.date : y + '-' + md); if (d >= from && d <= to && !ev.some((e) => e.date === d && e.title === a.title)) ev.push({ date: d, kind: 'anniv', c: u.contacts.find((x) => x.id === a.contactId), title: a.title || a.label || '' }); });
    return ev;
  }
  function calendarHtml(u) {
    const td = today();
    const ym = calState.ym || td.slice(0, 7);
    const [Y, M] = ym.split('-').map(Number);
    const first = new Date(Y, M - 1, 1); const startDow = first.getDay(); const days = new Date(Y, M, 0).getDate();
    const from = ym + '-01'; const to = ym + '-' + String(days).padStart(2, '0');
    const ev = calEvents(u, from, to);
    const dn = (d) => { try { return new Intl.DateTimeFormat(uiLang === 'zh' ? 'zh-CN' : uiLang, { weekday: 'short' }).format(new Date(2023, 0, 1 + d)); } catch (e) { return 'SMTWTFS'[d]; } };
    const title = (() => { try { return new Intl.DateTimeFormat(uiLang === 'zh' ? 'zh-CN' : uiLang, { year: 'numeric', month: 'long' }).format(first); } catch (e) { return ym; } })();
    let cells = '';
    for (let k = 0; k < startDow; k++) cells += '<div class="cal-cell empty"></div>';
    for (let d = 1; d <= days; d++) {
      const ds = ym + '-' + String(d).padStart(2, '0');
      const list = ev.filter((e) => e.date === ds);
      const dow = (startDow + d - 1) % 7;
      cells += `<button type="button" class="cal-cell ${ds === td ? 'today' : ''} ${ds === calState.sel ? 'sel' : ''} ${dow === 0 ? 'sun' : dow === 6 ? 'sat' : ''}" data-cal="${ds}"><span class="cal-d">${d}</span>${list.slice(0, 3).map((e) => `<span class="cal-ev k-${e.kind}">${e.c ? `<i class="dot c-${e.c.color}"></i>` : ''}${esc((e.c ? e.c.nickname + ' · ' : '') + e.title)}</span>`).join('')}${list.length > 3 ? `<span class="cal-more">+${list.length - 3}</span>` : ''}</button>`;
    }
    const sel = calState.sel && calState.sel.slice(0, 7) === ym ? calState.sel : null;
    const selList = sel ? ev.filter((e) => e.date === sel) : [];
    return `<section class="card cal" aria-label="calendar">
      <div class="cal-head"><button class="icon-btn" type="button" data-calnav="-1" aria-label="prev">‹</button><h2>${esc(title)}</h2><button class="icon-btn" type="button" data-calnav="1" aria-label="next">›</button><button class="btn sm secondary" type="button" data-calnav="0">${t('cal_today')}</button></div>
      <div class="cal-grid">${[0, 1, 2, 3, 4, 5, 6].map((d) => `<div class="cal-dow ${d === 0 ? 'sun' : d === 6 ? 'sat' : ''}">${esc(dn(d))}</div>`).join('')}${cells}</div>
      <div class="cal-legend tiny muted"><span><i class="lg k-promise"></i>${t('promise')}</span><span><i class="lg k-birthday"></i>${t('birthday')}</span><span><i class="lg k-anniv"></i>${t('cal_anniv')}</span></div>
      ${sel ? `<div class="cal-day"><div class="between"><strong>${esc(fmtDateW(sel))}</strong><button class="btn sm" type="button" id="cal-add">+ ${t('add_promise')}</button></div>${selList.length ? `<ul class="list">${selList.map((e) => `<li class="list-row">${e.c ? avatar(e.c, 'sm') : `<span class="avatar sm">${icon('calendar')}</span>`}<span class="grow"><b>${esc(e.title)}</b>${e.c ? `<br><span class="tiny muted">${esc(whoText(e.c))}</span>` : ''}</span>${e.c ? `<button class="link" type="button" data-go="#/chat/${e.c.id}" style="font-size:13px">${t('g_open_chat')}</button>` : ''}</li>`).join('')}</ul>` : `<p class="small muted">${t('none')}</p>`}</div>` : ''}
    </section>`;
  }
  function bindCalendar(u, rerender) {
    $app.querySelectorAll('[data-cal]').forEach((b) => b.addEventListener('click', () => { calState.sel = b.dataset.cal; rerender(); }));
    $app.querySelectorAll('[data-calnav]').forEach((b) => b.addEventListener('click', () => {
      const n = Number(b.dataset.calnav);
      if (!n) { calState.ym = today().slice(0, 7); calState.sel = today(); }
      else { const [Y, M] = (calState.ym || today().slice(0, 7)).split('-').map(Number); const d = new Date(Y, M - 1 + n, 1); calState.ym = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
      rerender();
    }));
    const add = document.getElementById('cal-add');
    if (add) add.addEventListener('click', () => { const f = document.getElementById('ag-form'); f.date.value = calState.sel; f.scrollIntoView({ block: 'start', behavior: 'smooth' }); f.title.focus(); });
  }

  function renderAgenda(r) {
    const u = Store.me();
    const td = today();
    const items = agendaItems(u);
    const all = u.promises.slice().sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
    const pre = r.q.c || '';
    const notifState = typeof Notification === 'undefined' ? 'na' : Notification.permission;
    shell(`${topBar(t('agenda_title'), null)}
      <div class="content stack-lg">
        ${calendarHtml(u)}
        <div class="stack-sm"><h2>${t('today_h')} · <span class="muted" style="font-weight:600">${fmtDateW(td)}</span></h2></div>
        ${items.filter((i) => i.kind !== 'upcoming').length ? `<ul class="list card" style="padding-block:4px">${items.filter((i) => i.kind !== 'upcoming').map(itemHtml).join('')}</ul>` : `<div class="empty small">${t('nothing_today')}</div>`}
        ${notifState !== 'granted' && notifState !== 'na' ? `<button class="btn subtle full" type="button" id="ag-notif">${icon('bell')} ${t('notif_enable')}</button>` : ''}
        <div class="stack-sm"><h2>${t('upcoming')}</h2>
          ${all.length ? `<div class="stack-sm">${all.map((p) => {
            const c = u.contacts.find((x) => x.id === p.contactId);
            const late = !p.done && p.date < td;
            return `<div class="card stack-sm ${c ? 'edge-' + c.color : ''}" style="${p.done ? 'opacity:.6' : ''}">
              <div class="row">${c ? avatar(c) : `<span class="avatar">${icon('calendar')}</span>`}<div class="grow">${c ? `<span class="label">${esc(whoText(c))}</span>` : ''}<h3>${late ? `<span class="badge alert">${t('overdue')}</span> ` : ''}${p.done ? '✓ ' : ''}${fmtDateW(p.date)} ${esc(p.time || '')} · ${esc(p.title)}</h3>${p.place ? `<p class="small muted">${esc(p.place)}</p>` : ''}</div></div>
              <div class="row wrap"><button class="btn sm ${p.done ? 'secondary' : 'subtle'}" type="button" data-done="${p.id}">${p.done ? t('done') : t('mark_done')}</button><button class="btn sm secondary" type="button" data-ics="${p.id}">${t('to_calendar')}</button><button class="btn sm secondary" type="button" data-del="${p.id}" aria-label="${t('delete')}">✕</button></div>
            </div>`;
          }).join('')}</div>` : `<div class="empty small">${t('none')}</div>`}
        </div>
        <form class="card stack" id="ag-form">
          <h2>${t('add_promise')}</h2>
          <label class="stack-xs"><span class="label">${t('p_contact')}</span><select class="field" name="contactId"><option value="">—</option>${u.contacts.map((c) => `<option value="${c.id}" ${pre === c.id ? 'selected' : ''}>${esc(whoText(c))}</option>`).join('')}</select></label>
          <label class="stack-xs"><span class="label">${t('p_title')}</span><input class="field" name="title" required maxlength="80"></label>
          <div class="two"><label class="stack-xs"><span class="label">${t('p_date')}</span><input class="field" type="date" name="date" required value="${td}"></label><label class="stack-xs"><span class="label">${t('p_time')}</span><input class="field" type="time" name="time"></label></div>
          <label class="stack-xs"><span class="label">${t('p_place')}</span><input class="field" name="place" maxlength="80"></label>
          <label class="stack-xs"><span class="label">${t('p_remind')}</span><select class="field" name="remind"><option value="30">${t('remind_30m')}</option><option value="60">${t('remind_1h')}</option><option value="1440">${t('remind_1d')}</option></select></label>
          <button class="btn full" type="submit">${icon('bell')} ${t('add_reminder')}</button>
        </form>
      </div>`, 'agenda');
    const nb = document.getElementById('ag-notif'); if (nb) nb.addEventListener('click', askNotify);
    bindCalendar(u, () => renderAgenda(r));
    $app.querySelectorAll('[data-done]').forEach((b) => b.addEventListener('click', () => { const p = u.promises.find((x) => x.id === b.dataset.done); Store.updatePromise(p.id, { done: !p.done }); renderAgenda(r); }));
    $app.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => { Store.removePromise(b.dataset.del); renderAgenda(r); }));
    $app.querySelectorAll('[data-ics]').forEach((b) => b.addEventListener('click', () => { const p = u.promises.find((x) => x.id === b.dataset.ics); downloadIcs(p, u.contacts.find((x) => x.id === p.contactId)); }));
    document.getElementById('ag-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      Store.addPromise({ contactId: f.get('contactId') || null, title: f.get('title'), date: f.get('date'), time: f.get('time'), place: f.get('place'), remind: Number(f.get('remind')) });
      toast(t('added_reminder')); askNotify(); renderAgenda({ q: {} });
    });
  }

  function downloadIcs(p, c) {
    const dt = (p.date || today()).replace(/-/g, '');
    const tm = (p.time || '09:00').replace(':', '') + '00';
    const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Language Magician//EN', 'BEGIN:VEVENT', 'UID:' + p.id + '@languagemagician', 'DTSTAMP:' + stamp,
      p.time ? 'DTSTART:' + dt + 'T' + tm : 'DTSTART;VALUE=DATE:' + dt, 'SUMMARY:' + (c ? whoText(c) + ' · ' : '') + p.title, p.place ? 'LOCATION:' + p.place : '',
      'BEGIN:VALARM', 'TRIGGER:-PT' + (p.remind || 30) + 'M', 'ACTION:DISPLAY', 'DESCRIPTION:' + p.title, 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].filter(Boolean);
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'plan-' + dt + '.ics'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function askNotify() {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') Notification.requestPermission().then((p) => { if (p === 'granted') toast(t('notif_on')); });
    else if (Notification.permission === 'denied') toast(t('notif_denied'));
  }

  // 알림 점검 (30초마다)
  function checkReminders() {
    const u = Store.me(); if (!u || u.status === 'banned') return;
    const now = Date.now();
    let changed = false;
    u.promises.forEach((p) => {
      if (p.done || p.notified || !p.date) return;
      const at = new Date(p.date + 'T' + (p.time || '09:00')).getTime();
      if (now >= at - (p.remind || 30) * 60000 && now < at + 3600000) {
        const c = u.contacts.find((x) => x.id === p.contactId);
        notify((c ? whoText(c) + ' · ' : '') + p.title, (p.time || '') + (p.place ? ' · ' + p.place : ''));
        p.notified = true; changed = true;
      }
    });
    const key = 'lm_anniv_notified_' + today();
    if (!localStorage.getItem(key)) {
      annivList(u).filter((a) => a.inDays === 0).forEach((a) => notify((a.c ? whoText(a.c) + ' · ' : '') + a.label, t('d_today')));
      localStorage.setItem(key, '1');
    }
    if (changed) Store.save({ noSync: true });
  }
  function notify(title, body) {
    toast('🔔 ' + title);
    try { if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification(title, { body, icon: 'icon.svg' }); } catch (e) { /* noop */ }
  }

  /* ================= 기념일 ================= */
  function renderAnniv(r) {
    const u = Store.me();
    const list = annivList(u, r.q.c || null);
    shell(`${topBar(t('anniv_title'), r.q.c ? '#/contact/' + r.q.c : '#/agenda')}
      <div class="content stack-lg">
        ${list.length ? `<ul class="list card" style="padding-block:4px">${list.map((a) => `<li class="list-row row">${a.c ? avatar(a.c) : `<span class="avatar">${icon('calendar')}</span>`}<span class="grow">${a.c ? `<span class="label">${esc(whoText(a.c))}</span><br>` : ''}<strong>${esc(a.label)}</strong><br><span class="small muted">${fmtDateW(a.date)}${a.type === 'met' || a.type === 'metyear' ? ' · ' + t('anniv_auto') : ''}</span></span><span class="badge ${a.inDays === 0 ? '' : a.inDays <= 7 ? 'warning' : 'gray'}">${a.inDays === 0 ? t('d_today') : t('d_day', { n: a.inDays })}</span>${a.c ? `<button class="icon-btn" type="button" data-go="#/gift/${a.c.id}?o=${a.type}&n=${a.n || ''}&h=${encodeURIComponent(a.label)}" aria-label="${t('gift_title')}">🎁</button>` : ''}${a.type === 'custom' ? `<button class="icon-btn" type="button" data-del="${a.id}" aria-label="${t('delete')}">✕</button>` : ''}</li>`).join('')}</ul>` : `<div class="empty small">${t('none')}</div>`}
        <form class="card stack" id="an-form">
          <h2>${t('anniv_add')}</h2>
          <label class="stack-xs"><span class="label">${t('p_contact')}</span><select class="field" name="contactId">${u.contacts.map((c) => `<option value="${c.id}" ${r.q.c === c.id ? 'selected' : ''}>${esc(whoText(c))}</option>`).join('')}</select></label>
          <label class="stack-xs"><span class="label">${t('anniv_name')}</span><input class="field" name="name" required maxlength="40"></label>
          <label class="stack-xs"><span class="label">${t('p_date')}</span><input class="field" type="date" name="date" required></label>
          <label class="inline-input small"><input type="checkbox" name="repeat" checked> ${t('anniv_repeat')}</label>
          <button class="btn full" type="submit">${t('save')}</button>
        </form>
      </div>`, 'agenda');
    $app.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => { Store.removeAnniv(b.dataset.del); renderAnniv(r); }));
    document.getElementById('an-form').addEventListener('submit', (e) => {
      e.preventDefault(); const f = new FormData(e.target);
      if (!f.get('contactId')) return;
      Store.addAnniv({ contactId: f.get('contactId'), name: f.get('name'), date: f.get('date'), repeat: !!f.get('repeat') });
      toast(t('saved')); renderAnniv(r);
    });
  }

  /* ================= 사주 궁합 ================= */
  const ANIMALS = { ko: ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'], zh: ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'], ja: ['ねずみ', 'うし', 'とら', 'うさぎ', 'たつ', 'へび', 'うま', 'ひつじ', 'さる', 'とり', 'いぬ', 'いのしし'], vi: ['Tý (Chuột)', 'Sửu (Trâu)', 'Dần (Hổ)', 'Mão (Mèo)', 'Thìn (Rồng)', 'Tỵ (Rắn)', 'Ngọ (Ngựa)', 'Mùi (Dê)', 'Thân (Khỉ)', 'Dậu (Gà)', 'Tuất (Chó)', 'Hợi (Lợn)'], en: ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'] };
  const SIGN_NAMES = { ko: { aries: '양자리', taurus: '황소자리', gemini: '쌍둥이자리', cancer: '게자리', leo: '사자자리', virgo: '처녀자리', libra: '천칭자리', scorpio: '전갈자리', sagittarius: '사수자리', capricorn: '염소자리', aquarius: '물병자리', pisces: '물고기자리' }, zh: { aries: '白羊座', taurus: '金牛座', gemini: '双子座', cancer: '巨蟹座', leo: '狮子座', virgo: '处女座', libra: '天秤座', scorpio: '天蝎座', sagittarius: '射手座', capricorn: '摩羯座', aquarius: '水瓶座', pisces: '双鱼座' }, ja: { aries: 'おひつじ座', taurus: 'おうし座', gemini: 'ふたご座', cancer: 'かに座', leo: 'しし座', virgo: 'おとめ座', libra: 'てんびん座', scorpio: 'さそり座', sagittarius: 'いて座', capricorn: 'やぎ座', aquarius: 'みずがめ座', pisces: 'うお座' }, vi: { aries: 'Bạch Dương', taurus: 'Kim Ngưu', gemini: 'Song Tử', cancer: 'Cự Giải', leo: 'Sư Tử', virgo: 'Xử Nữ', libra: 'Thiên Bình', scorpio: 'Bọ Cạp', sagittarius: 'Nhân Mã', capricorn: 'Ma Kết', aquarius: 'Bảo Bình', pisces: 'Song Ngư' }, en: { aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer', leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Scorpio', sagittarius: 'Sagittarius', capricorn: 'Capricorn', aquarius: 'Aquarius', pisces: 'Pisces' } };
  const ANIMAL_INDEX = ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'];

  function sajuOf(birth, time, lunar, leap, tz) {
    if (!birth || birth.length < 10) return null;
    const [y, m, d] = birth.split('-').map(Number);
    let hh = null, mm = 0;
    if (time) { [hh, mm] = time.split(':').map(Number); }
    return Saju.calc({ year: y, month: m, day: d, hour: hh, minute: mm, lunar, leap, tzOffset: tz === '' || tz === undefined ? 9 : Number(tz) });
  }

  function renderSaju(r) {
    const u = Store.me();
    const c = Store.contact(r.id);
    if (!c) return go('#/contacts');
    const meI = u.me || {};
    const tzOpts = [[9, 'UTC+9 (KR/JP)'], [8, 'UTC+8 (CN/TW/SG/PH/MN)'], [7, 'UTC+7 (VN/TH/ID)'], [5.75, 'UTC+5:45 (NP)'], [5.5, 'UTC+5:30 (IN)'], [5, 'UTC+5 (UZ)'], [3, 'UTC+3 (RU/SA)'], [1, 'UTC+1 (EU)'], [0, 'UTC+0 (UK)'], [-5, 'UTC−5 (US East)'], [-8, 'UTC−8 (US West)']];
    const defTz = (cc) => ({ KR: 9, JP: 9, CN: 8, TW: 8, PH: 8, MN: 8, VN: 7, TH: 7, ID: 7, NP: 5.75, IN: 5.5, UZ: 5, RU: 3, SA: 3, GB: 0, US: -5, ES: 1, FR: 1, DE: 1 }[cc]);
    const block = (who2, p) => `<div class="card stack-sm"><h3>${esc(who2)}</h3>
      <label class="stack-xs"><span class="label">${t('birth_date')}</span><input class="field" type="date" data-k="${p.k}-birth" value="${esc(p.birth || '')}"></label>
      <div class="two"><label class="stack-xs"><span class="label">${t('calendar')}</span><select class="field" data-k="${p.k}-lunar"><option value="0">${t('solar')}</option><option value="1" ${p.lunar ? 'selected' : ''}>${t('lunar')}</option></select></label>
      <label class="stack-xs"><span class="label">${t('c_birth_time')}</span><input class="field" type="time" data-k="${p.k}-time" value="${esc(p.time || '')}"></label></div>
      <label class="inline-input small"><input type="checkbox" data-k="${p.k}-leap" ${p.leap ? 'checked' : ''}> ${t('leap')}</label>
      <label class="stack-xs"><span class="label">${t('tz')}</span><select class="field" data-k="${p.k}-tz">${tzOpts.map(([v, l]) => `<option value="${v}" ${Number(p.tz) === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <p class="tiny muted">${t('birth_time_opt')}</p></div>`;
    const meTz = meI.tz !== undefined && meI.tz !== '' ? meI.tz : (defTz({ ko: 'KR', zh: 'CN', ja: 'JP', vi: 'VN', en: 'US' }[uiLang]) ?? 9);
    const cTz = c.birthTz !== undefined && c.birthTz !== '' ? c.birthTz : (defTz(c.country) ?? 9);
    shell(`${topBar(t('saju_title'), '#/contact/' + c.id)}
      <div class="content stack-lg">
        <div class="stack-sm"><h1>${t('saju_title')}</h1><p class="muted">${esc(u.nickname)} × ${esc(whoText(c))} · ${t('saju_sub')}</p></div>
        ${block(t('saju_me') + ' · ' + u.nickname, { k: 'me', birth: meI.birth, time: meI.birthTime, lunar: meI.lunar, leap: meI.leap, tz: meTz })}
        ${block(c.nickname, { k: 'c', birth: c.birthday && c.birthday.length === 10 ? c.birthday : '', time: c.birthTime, lunar: c.birthLunar, leap: c.birthLeap, tz: cTz })}
        <div class="two"><label class="stack-xs"><span class="label">${t('c_blood')} · ${t('saju_me')}</span><select class="field" data-k="me-blood"><option value="">—</option>${['A', 'B', 'O', 'AB'].map((b) => `<option ${meI.blood === b ? 'selected' : ''}>${b}</option>`).join('')}</select></label>
        <label class="stack-xs"><span class="label">MBTI · ${t('saju_me')}</span><select class="field" data-k="me-mbti"><option value="">—</option>${['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'].map((b) => `<option ${meI.mbti === b ? 'selected' : ''}>${b}</option>`).join('')}</select></label></div>
        <button class="btn full" type="button" id="sj-go">${t('saju_show')}</button>
        <div id="sj-out"></div>
      </div>`, 'contacts');
    const val = (k) => { const el = $app.querySelector(`[data-k="${k}"]`); return el.type === 'checkbox' ? el.checked : el.value; };
    const run = () => {
      const meData = { birth: val('me-birth'), birthTime: val('me-time'), lunar: val('me-lunar') === '1', leap: val('me-leap'), tz: val('me-tz'), blood: val('me-blood'), mbti: val('me-mbti') };
      u.me = Object.assign({}, u.me, meData);
      Store.updateContact(c.id, { birthday: val('c-birth') || c.birthday, birthTime: val('c-time'), birthLunar: val('c-lunar') === '1', birthLeap: val('c-leap'), birthTz: val('c-tz') });
      const a = sajuOf(meData.birth, meData.birthTime, meData.lunar, meData.leap, meData.tz);
      const b = sajuOf(val('c-birth'), val('c-time'), val('c-lunar') === '1', val('c-leap'), val('c-tz'));
      const out = document.getElementById('sj-out');
      if (!a || !b) { out.innerHTML = `<div class="card notice small">${t('saju_need')}</div>`; return; }
      const pf = Engine.profile(Store.messagesOf(c.id));
      const sA = Saju.zodiacSign(a.solar.month, a.solar.day), sB = Saju.zodiacSign(b.solar.month, b.solar.day);
      const comp = Saju.compat({ saju: a, blood: meData.blood, mbti: meData.mbti, sign: sA }, { saju: b, blood: c.blood, mbti: c.mbti, sign: sB, chatScore: pf.count >= 5 ? Math.max(30, pf.depth) : undefined });
      const notes = COMPAT_NOTES[uiLang];
      const pillarsHtml = (s, name) => `<div class="card stack-sm"><div class="between wrap"><h3>${esc(name)}</h3><span class="small muted">${t('zodiac')} ${ANIMALS[uiLang][ANIMAL_INDEX.indexOf(s.animal)]} · ${t('star')} ${SIGN_NAMES[uiLang][Saju.zodiacSign(s.solar.month, s.solar.day)]}</span></div>
        <div class="pillars">${['hour', 'day', 'month', 'year'].map((k) => { const p = s.pillars.find((x) => x.key === k); return `<div class="pillar"><div class="tiny muted">${t('pillar_' + k)}</div>${p ? `<div class="hz"><span class="el-${p.stemEl}">${Saju.STEMS[p.stem]}</span><br><span class="el-${p.branchEl}">${Saju.BRANCHES[p.branch]}</span></div><div class="tiny muted">${p.hangul}</div>` : `<div class="hz muted">?<br>?</div><div class="tiny muted">${t('unknown_time')}</div>`}</div>`; }).join('')}</div>
        <div class="mini-bars">${Saju.ELEMENTS.map((e) => `<div class="row"><span class="el-${e}" style="width:58px">${t('el_' + e)}</span><div class="bar"><span style="width:${(s.counts[e] / s.total) * 100}%;background:currentColor" class="el-${e}"></span></div><span class="tiny" style="width:18px;text-align:right">${s.counts[e]}</span></div>`).join('')}</div>
        <p class="small muted">${t('day_master')}: <strong class="el-${s.dayMasterEl}">${Saju.STEMS[s.dayMaster]} (${t('el_' + s.dayMasterEl)})</strong> · ${t('strong_el')}: ${s.strong.map((e) => t('el_' + e)).join(', ')}${s.lacking.length ? ' · ' + t('lack_el') + ': ' + s.lacking.map((e) => t('el_' + e)).join(', ') : ''}</p></div>`;
      out.innerHTML = `<div class="stack-lg">
        <div class="card soft stack" style="align-items:center;text-align:center"><span class="label">${t('compat_total')}</span><div class="score-ring" style="--v:${comp.total};margin:auto"><div>${comp.total}</div></div>
          <div class="mini-bars" style="width:100%;text-align:start">${Object.keys(comp.parts).map((k) => `<div class="row"><span class="small" style="width:84px">${t('compat_' + k)}</span><div class="bar"><span style="width:${comp.parts[k]}%"></span></div><span class="tiny" style="width:24px;text-align:right">${comp.parts[k]}</span></div>`).join('')}</div></div>
        ${comp.notes.length ? `<div class="card stack-sm">${comp.notes.map((n) => `<p class="small">• ${esc(notes[n])}</p>`).join('')}</div>` : ''}
        <div class="card stack-sm"><h3>${t('compat_tip')}</h3><p>${esc(notes.tip[(a.dayMaster + b.dayMaster) % notes.tip.length])}</p></div>
        ${pillarsHtml(a, t('saju_me') + ' · ' + u.nickname)}
        ${pillarsHtml(b, c.nickname)}
        <p class="tiny muted">${t('saju_sub')}</p>
      </div>`;
      Store.save();
    };
    document.getElementById('sj-go').addEventListener('click', run);
    if ((meI.birth) && c.birthday && c.birthday.length === 10) run();
  }

  /* ================= 선물 ================= */
  function renderGift(r) {
    const u = Store.me();
    const c = Store.contact(r.id) || u.contacts[0];
    if (!c) return go('#/contacts');
    const ms = Store.messagesOf(c.id);
    const words = Engine.tokens((c.note || '') + ' ' + ms.filter((m) => m.dir === 'in').map((m) => m.text + ' ' + (m.translation || '')).join(' '));
    let budget = Number(r.q.b || 1);
    const occ = r.q.o || 'birthday';
    const scored = DATA.GIFTS.map((g) => {
      const hit = g.tags.filter((tg) => [...words].some((w) => w.includes(tg.toLowerCase()) || tg.toLowerCase().includes(w)));
      return { g, hit, score: hit.length * 3 + (g.b === budget ? 2 : g.b < budget ? 1 : -2) + (g.id === 'jewelry' && c.relation !== 'romance' ? -10 : 0) };
    }).sort((a, b) => b.score - a.score);
    const picks = scored.filter((x) => x.g.b <= budget).slice(0, 3);
    const avoid = DATA.GIFT_AVOID[c.country];
    const daysMet = c.metAt ? daysBetween(c.metAt, today()) + 1 : 0;
    const msgKey = occ === 'met' || occ === 'metyear' ? 'met' : occ === 'holiday' ? 'holiday' : occ === 'custom' ? 'anniv' : 'birthday';
    const fill = (s) => s.replace('{n}', r.q.n ? (occ === 'metyear' ? Number(r.q.n) * 365 : r.q.n) : daysMet).replace('{h}', r.q.h || '');
    const giftLabel = (g) => (uiLang === 'ko' ? g.ko : g.en);
    shell(`${topBar(t('gift_title'), '#/contact/' + c.id)}
      <div class="content stack-lg">
        <div class="stack-sm">${who(c)}<h1>${t('gift_title')}</h1></div>
        <div class="card stack-sm"><span class="label">${t('gift_occasion')}</span>
          <div class="seg">${[['birthday', t('birthday')], ['met', t('c_met')], ['holiday', t('anniversary')]].map(([k, l]) => `<button type="button" data-occ="${k}" aria-pressed="${occ === k || (k === 'met' && occ === 'metyear')}">${esc(l)}</button>`).join('')}</div>
          <span class="label">${t('gift_budget')}</span>
          <div class="seg">${[[1, '~₩30,000'], [2, '~₩100,000'], [3, '₩100,000+']].map(([b, l]) => `<button type="button" data-b="${b}" aria-pressed="${budget === b}">${l}</button>`).join('')}</div>
        </div>
        <div class="card stack"><h2>${t('gift_ideas')}</h2>
          <ul class="list">${picks.map((x) => `<li class="list-row stack-xs"><strong class="g-name" data-en="${esc(x.g.en)}">${esc(giftLabel(x.g))}</strong><span class="small muted">${t('gift_based')} · ${x.hit.length ? esc(x.hit.slice(0, 3).join(', ')) : esc(t('rel_' + (c.relation || 'friend')))}</span></li>`).join('')}</ul>
        </div>
        ${avoid ? `<div class="card notice stack-sm"><h3>${t('gift_avoid')} · ${esc(countryName(c.country))}</h3><p class="small av" data-en="${esc(avoid.en)}">${esc(uiLang === 'ko' ? avoid.ko : avoid.en)}</p></div>` : ''}
        <div class="card soft stack">
          <label class="label" for="g-msg">${esc(t('gift_card', { app: appName(c.app) }))} · ${esc(langUi(c.lang))}</label>
          <textarea class="field" id="g-msg" rows="3" lang="${esc(c.lang)}"></textarea>
          <p class="small muted" id="g-mean"></p>
          <button class="btn full" type="button" id="g-copy">${icon('copy')} ${t('gift_copy')}</button>
        </div>
      </div>`, 'contacts');
    const tplSet = DATA.GIFT_MSG[msgKey];
    const mine = fill(tplSet[uiLang] || tplSet.en);
    document.getElementById('g-mean').textContent = t('meaning') + ' · ' + mine;
    const msgEl = document.getElementById('g-msg');
    if (tplSet[c.lang]) msgEl.value = fill(tplSet[c.lang]);
    else tr(mine, c.lang, uiLang).then((x) => { msgEl.value = x.text; }).catch(() => { msgEl.value = mine; });
    if (uiLang !== 'ko' && uiLang !== 'en') {
      $app.querySelectorAll('.g-name, .av').forEach((el) => tr(el.dataset.en, uiLang, 'en').then((x) => { el.textContent = x.text; }).catch(() => {}));
    }
    document.getElementById('g-copy').addEventListener('click', async () => { await copyText(msgEl.value); Store.addMessage({ contactId: c.id, dir: 'out', text: mine, lang: uiLang, translation: msgEl.value, trLang: c.lang, source: 'gift' }); toast(t('copied', { app: appName(c.app) })); });
    $app.querySelectorAll('[data-b]').forEach((b) => b.addEventListener('click', () => go(`#/gift/${c.id}?o=${occ}&b=${b.dataset.b}${r.q.n ? '&n=' + r.q.n : ''}${r.q.h ? '&h=' + encodeURIComponent(r.q.h) : ''}`)));
    $app.querySelectorAll('[data-occ]').forEach((b) => b.addEventListener('click', () => go(`#/gift/${c.id}?o=${b.dataset.occ}&b=${budget}`)));
  }

  /* ================= 문화 가이드 ================= */
  function renderCulture(r) {
    const u = Store.me();
    const c = r.q.c ? Store.contact(r.q.c) : null;
    const country = r.q.k || (c && c.country) || (u.contacts.find((x) => x.country) || {}).country || 'KR';
    const cu = DATA.CULTURE[country] || DATA.CULTURE.US;
    const native = !!cu[uiLang];
    const list = cu[uiLang] || cu.en;
    shell(`${topBar(t('culture_title'), c ? '#/contact/' + c.id : '#/home')}
      <div class="content stack-lg">
        <div class="stack-sm"><h1>${t('culture_title')}</h1><p class="muted">${t('culture_sub')}</p></div>
        <label class="stack-xs"><span class="label">${t('culture_country')}</span><select class="field" id="cu-k">${DATA.COUNTRIES.filter((x) => DATA.CULTURE[x.id]).map((x) => `<option value="${x.id}" ${x.id === country ? 'selected' : ''}>${x.flag} ${esc(x[uiLang] || x.en)}</option>`).join('')}</select></label>
        ${list.map((it, i) => `<div class="card stack-sm">${c && c.country === country ? who(c) : ''}<h2 class="cu-t" data-i="${i}">${esc(it[0])}</h2><p class="cu-b" data-i="${i}">${esc(it[1])}</p>
          ${it[2] ? `<div class="translation stack-xs"><span class="label">${t('coach_example')}</span><p lang="${esc((DATA.COUNTRIES.find((x) => x.id === country) || {}).lang)}">${esc(it[2])}</p><p class="small muted cu-m" data-i="${i}"></p></div><button class="btn secondary full" type="button" data-copy="${i}">${icon('copy')} ${t('culture_copy')}</button>` : ''}</div>`).join('')}
      </div>`, 'home');
    document.getElementById('cu-k').addEventListener('change', (e) => go('#/culture?k=' + e.target.value + (c ? '&c=' + c.id : '')));
    if (!native) {
      $app.querySelectorAll('.cu-t, .cu-b').forEach((el) => { const it = list[Number(el.dataset.i)]; tr(el.classList.contains('cu-t') ? it[0] : it[1], uiLang, 'en').then((x) => { el.textContent = x.text; }).catch(() => {}); });
    }
    $app.querySelectorAll('.cu-m').forEach((el) => { const it = list[Number(el.dataset.i)]; tr(it[2], uiLang).then((x) => { el.textContent = t('meaning') + ' · ' + x.text; }).catch(() => {}); });
    $app.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => { await copyText(list[Number(b.dataset.copy)][2]); toast(t('copied', { app: c ? appName(c.app) : 'messenger' })); }));
  }

  /* ================= 설정 ================= */
  function renderSettings() {
    const u = Store.me();
    const ai = Engine.aiConfig();
    const meI = u.me || {};
    shell(`${topBar(t('set_title'), null)}
      <div class="content stack-lg">
        <form class="card stack" id="st-ai">
          <h2>${t('set_ai')} ${ai.key ? '<span class="badge">✓ ' + t('ai_on') + '</span>' : ''}</h2>
          <p class="small muted">${t('g_ai')} ${t('set_ai_hint')}</p>
          <label class="stack-xs"><span class="label">${t('set_provider')}</span><select class="field" name="provider" id="st-provider"><option value="openai" ${ai.provider !== 'anthropic' ? 'selected' : ''}>OpenAI (ChatGPT)</option><option value="anthropic" ${ai.provider === 'anthropic' ? 'selected' : ''}>Claude (Anthropic)</option></select></label>
          <div class="ai-steps"><strong class="small">${t('ai_steps_t')}</strong><ol class="small muted"><li>${t('ai_s1')}</li><li>${t('ai_s2')}</li><li>${t('ai_s3')}</li><li id="st-ai-s4">${ai.provider === 'anthropic' ? t('ai_s4c') : t('ai_s4')}</li></ol>
            <a class="btn secondary full" id="st-ai-link" href="${ai.provider === 'anthropic' ? 'https://console.anthropic.com/settings/keys' : 'https://platform.openai.com/api-keys'}" target="_blank" rel="noopener">${ai.provider === 'anthropic' ? t('ai_get_claude') : t('ai_get_openai')} ↗</a></div>
          <label class="stack-xs"><span class="label">${t('set_key')}</span><input class="field" name="key" type="password" autocomplete="off" value="${esc(ai.key || '')}" placeholder="${ai.provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}"></label>
          <details><summary class="small muted">${t('set_model')}</summary><input class="field" name="model" value="${esc(ai.model || '')}" placeholder="gpt-4o-mini / claude-haiku-5-5" style="margin-top:6px"></details>
          <div class="two"><button class="btn secondary" type="button" id="st-ai-test">${t('set_test')}</button><button class="btn" type="submit">${t('save')}</button></div>
        </form>

        <div class="card stack-sm">
          <h2>${t('set_account')}</h2>
          <p><strong>${esc(u.nickname)}</strong> <span class="small muted">· ${esc(u.id)}</span></p>
          ${u.type === 'guest' ? `<span class="badge warning">${t('set_guest_now')}</span>
            <div class="row"><input class="field" id="st-nick" maxlength="24" placeholder="${esc(t('ob_nick_ph'))}"><button class="btn" type="button" id="st-reg">${t('set_register')}</button></div><p class="tiny muted">${t('ob_nick_hint')}</p>` : ''}
        </div>
        <div class="card stack">
          <h2>${t('set_lang')}</h2>
          <select class="field" id="st-lang">${UI_LANGS.map((l) => `<option value="${l}" ${l === uiLang ? 'selected' : ''}>${esc(langName(l))} · ${esc(T[l].brand)}</option>`).join('')}</select>
        </div>
        <form class="card stack" id="st-me">
          <h2>${t('set_my')}</h2>
          <div class="two"><label class="stack-xs"><span class="label">${t('birth_date')}</span><input class="field" type="date" name="birth" value="${esc(meI.birth || '')}"></label><label class="stack-xs"><span class="label">${t('c_birth_time')}</span><input class="field" type="time" name="birthTime" value="${esc(meI.birthTime || '')}"></label></div>
          <label class="inline-input small"><input type="checkbox" name="lunar" ${meI.lunar ? 'checked' : ''}> ${t('lunar')}</label>
          <div class="three"><label class="stack-xs"><span class="label">${t('c_blood')}</span><select class="field" name="blood"><option value="">—</option>${['A', 'B', 'O', 'AB'].map((b) => `<option ${meI.blood === b ? 'selected' : ''}>${b}</option>`).join('')}</select></label>
          <label class="stack-xs"><span class="label">MBTI</span><select class="field" name="mbti"><option value="">—</option>${['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'].map((b) => `<option ${meI.mbti === b ? 'selected' : ''}>${b}</option>`).join('')}</select></label>
          <label class="stack-xs"><span class="label">${t('c_gender')}</span><select class="field" name="gender"><option value="">—</option>${[['f', t('gender_f')], ['m', t('gender_m')], ['x', t('gender_x')]].map(([v, l]) => `<option value="${v}" ${meI.gender === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label></div>
          <button class="btn secondary full" type="submit">${t('save')}</button>
        </form>
        <div class="card stack-sm">
          <h2>${t('set_notif')}</h2>
          ${[['promise', t('promise')], ['anniv', t('anniv_title')], ['unanswered', t('unanswered_from')]].map(([k, l]) => `<label class="inline-input"><input type="checkbox" data-n="${k}" ${u.settings.notif[k] !== false ? 'checked' : ''}> ${esc(l)}</label>`).join('')}
          <button class="btn subtle full" type="button" id="st-push">${icon('bell')} ${t('notif_enable')}</button>
        </div>
        <div class="card stack-sm">
          <h2>${t('set_consent')}</h2>
          <span class="badge">✓ ${esc(Store.CONSENT_VERSION)}</span>
          <p class="small muted">${t('set_consent_at')} · ${fmtTs(u.consentAt)}</p>
          <details><summary>${t('ob_consent_title')}</summary><p class="small muted">${t('ob_consent_body')}</p><p class="small muted">${t('ob_consent_body2')}</p></details>
        </div>
        <div class="card stack-sm">
          <h2>${t('set_data')}</h2>
          <div class="two"><button class="btn secondary" type="button" id="st-export">${t('set_export')}</button><button class="btn secondary" type="button" id="st-wipe" style="color:var(--danger)">${t('set_wipe')}</button></div>
          <button class="btn secondary full" type="button" id="st-sample">${t('ob_sample')}</button>
          <button class="btn secondary full" type="button" id="st-logout">${t('set_logout')}</button>
        </div>
        <p class="tiny muted center">${esc(t('brand'))} · ${esc(t('tagline'))} · <a href="#/admin" style="text-decoration:underline">${t('admin')}</a></p>
      </div>`, 'settings');
    document.getElementById('st-lang').addEventListener('change', (e) => { u.lang = e.target.value; uiLang = u.lang; Store.save(); renderSettings(); });
    const reg = document.getElementById('st-reg');
    if (reg) reg.addEventListener('click', () => { const n = document.getElementById('st-nick').value.trim(); if (!n) { toast(t('ob_need_nick')); return; } Store.upgradeToMember(n); toast(t('set_saved')); renderSettings(); });
    document.getElementById('st-me').addEventListener('submit', (e) => { e.preventDefault(); const f = new FormData(e.target); u.me = Object.assign({}, u.me, { birth: f.get('birth'), birthTime: f.get('birthTime'), lunar: !!f.get('lunar'), blood: f.get('blood'), mbti: f.get('mbti'), gender: f.get('gender') }); Store.save(); toast(t('set_saved')); });
    $app.querySelectorAll('[data-n]').forEach((cb) => cb.addEventListener('change', () => { u.settings.notif[cb.dataset.n] = cb.checked; Store.save(); }));
    document.getElementById('st-push').addEventListener('click', askNotify);
    const aiForm = document.getElementById('st-ai');
    const readAi = () => { const f = new FormData(aiForm); const key = (f.get('key') || '').trim(); let provider = f.get('provider'); if (/^sk-ant-/.test(key)) provider = 'anthropic'; else if (/^sk-/.test(key) && provider === 'anthropic') provider = 'openai'; return { provider, key, model: (f.get('model') || '').trim() }; };
    const provSel = document.getElementById('st-provider');
    provSel.addEventListener('change', () => { const an = provSel.value === 'anthropic'; const ln = document.getElementById('st-ai-link'); ln.href = an ? 'https://console.anthropic.com/settings/keys' : 'https://platform.openai.com/api-keys'; ln.textContent = (an ? t('ai_get_claude') : t('ai_get_openai')) + ' ↗'; document.getElementById('st-ai-s4').textContent = an ? t('ai_s4c') : t('ai_s4'); aiForm.key.placeholder = an ? 'sk-ant-...' : 'sk-...'; });
    if (/[?&]ai=1/.test(location.hash)) setTimeout(() => aiForm.scrollIntoView({ block: 'start' }), 50);
    aiForm.addEventListener('submit', (e) => { e.preventDefault(); const v = readAi(); localStorage.setItem('lm_ai', JSON.stringify(v)); provSel.value = v.provider; toast(t('set_saved')); });
    document.getElementById('st-ai-test').addEventListener('click', async (ev) => {
      localStorage.setItem('lm_ai', JSON.stringify(readAi()));
      spinBtn(ev.currentTarget, true, '…');
      try { const x = await Engine.callLLM('Reply with OK.', 'ping', false); toast(x ? t('set_ai_ok') : t('set_ai_fail')); } catch (e) { toast(t('set_ai_fail') + ' (' + e.message + ')'); }
      spinBtn(ev.currentTarget, false);
    });
    document.getElementById('st-export').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(u, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'language-magician-' + u.id + '.json'; a.click();
    });
    document.getElementById('st-wipe').addEventListener('click', () => { if (confirm(t('set_wipe_confirm'))) { u.contacts = []; u.messages = []; u.promises = []; u.anniversaries = []; Store.save(); toast(t('set_saved')); go('#/home'); } });
    document.getElementById('st-sample').addEventListener('click', () => { Store.loadSamples(u, uiLang); toast(t('sample_loaded')); go('#/home'); });
    document.getElementById('st-logout').addEventListener('click', () => { Store.logout(); go('#/'); });
  }

  /* ================= 시작 ================= */
  window.LM = { t, esc, icon, toast, sheet, closeSheet, go, render, fmtTs, fmtDate, appName, langName, avatar, who, whoText };
  Store.onChange(() => {});
  render();
  window.LM_ON_AI_USAGE = (x) => { const u = Store.me(); if (!u) return; u.aiUsage = u.aiUsage || []; u.aiUsage.push(x); if (u.aiUsage.length > 5000) u.aiUsage.splice(0, u.aiUsage.length - 5000); Store.save(); };
  window.LM_ON_MESSAGE = (m) => { if (m.contactId) setTimeout(() => { try { runDigests(m.contactId); } catch (e) {} }, 30); };
  setTimeout(() => { try { runDigests(); } catch (e) { console.warn(e); } }, 600);
  setInterval(checkReminders, 30000);
  setInterval(() => { try { runDigests(); } catch (e) {} }, 10 * 60000);
  setTimeout(checkReminders, 2500);
  // 서버 연결 시 내 계정 제한 여부 확인
  if (Store.Sync.enabled() && Store.me()) {
    Store.Sync.fetchMyStatus().then((b) => { if (b && b.status === 'banned') { const u = Store.me(); u.status = 'banned'; u.banReason = b.reason || ''; Store.save({ noSync: true }); render(); } }).catch(() => {});
    Store.Sync.pushUser(Store.me());
  }
})();
