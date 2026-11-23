/* 언어의 마술사 — 사용자 앱 */
(function () {
  'use strict';

  const { T, STAGES, STAGE_NAMES, COACH, REPLIES, EXPLAIN, COMPAT_NOTES, MONTHS_EN } = I18N;
  const UI_LANGS = ['ko', 'zh', 'ja', 'vi', 'en'];
  const $app = document.getElementById('app');

  /* ================= 공통 유틸 ================= */
  let uiLang = (Store.me() && Store.me().lang) || pickBrowserLang();
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
    const pages = { home: renderHome, helper: renderHelper, contacts: renderContacts, contact: renderContact, 'contact-edit': renderContactEdit, coach: renderCoach, agenda: renderAgenda, anniv: renderAnniv, saju: renderSaju, gift: renderGift, culture: renderCulture, settings: renderSettings };
    (pages[r.name] || renderHome)(r);
    window.scrollTo(0, 0);
  }

  function shell(inner, active, opts) {
    const nav = [['home', 'home', 'nav_home'], ['helper', 'chat', 'nav_helper'], ['contacts', 'person', 'nav_contacts'], ['agenda', 'calendar', 'nav_agenda'], ['settings', 'settings', 'nav_settings']];
    $app.innerHTML = `<div class="screen">${inner}</div>${opts && opts.noNav ? '' : `<nav class="bottom" aria-label="main">${nav.map(([k, ic, lb]) => `<button type="button" data-go="#/${k}" ${active === k ? 'aria-current="page"' : ''}>${icon(ic)}<span>${t(lb)}</span></button>`).join('')}</nav>`}`;
  }
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
        go('#/home');
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
      return `<li><button class="list-row" type="button" data-go="#/helper?c=${c.id}&m=${it.m.id}">${av}<span class="grow">${lab}<br><strong>${t('unanswered_from')}</strong><br><span class="small muted ellipsis" style="display:block">${esc(it.m.translation || it.m.text)}</span></span>${icon('arrow', 'chev')}</button></li>`;
    }
    return '';
  }

  /* ================= 연락처 선택 블록 ================= */
  function contactPicker(u, selId, idName) {
    const c = selId ? u.contacts.find((x) => x.id === selId) : null;
    return `<div class="card stack-sm ${c ? 'edge-' + c.color : ''}">
      <div class="row">${c ? avatar(c) : `<span class="avatar">${icon('person')}</span>`}
        <div class="grow"><label class="label" for="${idName}">${t('pick_contact')}</label><div>${c ? `<strong>${esc(appName(c.app))}</strong> / <span lang="${esc(c.lang)}">${esc(c.nickname)}</span> · <span class="small muted">${esc(langName(c.lang))}</span>` : `<span class="small muted">${t('no_contact')}</span>`}</div></div>
      </div>
      <select class="field" id="${idName}">
        <option value="">${t('no_contact')}</option>
        ${u.contacts.map((x) => `<option value="${x.id}" ${x.id === selId ? 'selected' : ''}>${esc(appName(x.app))} / ${esc(x.nickname)} (${esc(langName(x.lang))})</option>`).join('')}
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
      go('#/helper?' + (homeContact ? 'c=' + homeContact + '&' : '') + (lastIn ? 'm=' + lastIn.id : ''));
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
      return `<li><button class="list-row" type="button" data-go="#/contact/${c.id}">${avatar(c)}<span class="grow" style="min-width:0"><span class="row" style="gap:6px"><strong class="ellipsis" lang="${esc(c.lang)}">${esc(c.nickname)}</strong>${unanswered ? '<span class="badge warning">●</span>' : ''}</span><span class="small muted ellipsis" style="display:block">${esc(appName(c.app))} · ${esc(langName(c.lang))} · ${esc(t('rel_' + (c.relation || 'friend')))} · ${esc(stageName)}</span>${last ? `<span class="small ellipsis" style="display:block">${esc(last.dir === 'in' ? (last.translation || last.text) : last.text)}</span>` : ''}</span>${icon('arrow', 'chev')}</button></li>`;
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

  async function analyzeIncoming(c, text) {
    const u = Store.me();
    const from = Engine.detect(text);
    const history = c ? Store.messagesOf(c.id) : [];
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
    const msg = Store.addMessage({
      contactId: c ? c.id : null, dir: 'in', text, lang: from, translation: res.translation, trLang: uiLang,
      source: helperState.source || 'paste', intents: res.intents, risk: res.risk, provider: res.provider,
      suggestions: replies.map((r) => r.text), nuance: res.nuance.join(' '),
    });
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
          <div class="row">${avatar(c, 'lg')}<div class="grow"><h1 lang="${esc(c.lang)}">${esc(c.nickname)}</h1><p class="small muted">${esc(appName(c.app))} / ${esc(c.nickname)} · ${esc(langName(c.lang))}${c.country ? ' · ' + esc(countryName(c.country)) : ''}</p>
            <div class="row wrap" style="gap:6px;margin-top:6px"><span class="badge">${esc(t('rel_' + (c.relation || 'friend')))} · ${esc(STAGE_NAMES[uiLang][stageKey])}</span>${daysMet ? `<span class="badge gray">${esc(t('c_days_met', { n: daysMet }))}</span>` : ''}</div></div></div>
          <div class="two"><button class="btn" type="button" data-go="#/helper?c=${c.id}&mode=in">${t('c_import')}</button><button class="btn secondary" type="button" data-go="#/coach/${c.id}">${t('coach_link')}</button></div>
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
          <button class="link" type="button" data-go="#/helper?c=${c.id}&mode=in">${t('c_import')} ${icon('arrow', 'sm')}</button>
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
      ['app', 'nickname', 'lang', 'country', 'color', 'relation', 'metAt', 'birthday', 'birthTime', 'age', 'blood', 'gender', 'mbti', 'note'].forEach((k) => { data[k] = (f.get(k) || '').toString().trim(); });
      data.stage = Number(f.get('stage') || 0);
      data.birthLunar = !!f.get('birthLunar');
      if (!data.nickname) return;
      if (isNew) { const nc = Store.addContact(data); homeContact = nc.id; helperState.contactId = nc.id; go('#/contact/' + nc.id); }
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
          <span class="label">${t('coach_example')} · ${esc(langName(c.lang))}</span>
          <p id="co-ex" lang="${esc(c.lang)}" style="font-size:16px"><span class="skeleton" style="display:block;width:80%"></span></p>
          <p class="small muted">${t('meaning')} · ${esc(tips[2])}</p>
          <div class="two"><button class="btn secondary" type="button" data-go="#/helper?c=${c.id}&mode=out">${t('mode_out')}</button><button class="btn" type="button" id="co-copy">${icon('copy')} ${t('copy_theirs')}</button></div>
        </div>
      </div>`, 'contacts');
    let exText = '';
    tr(tips[2], c.lang, uiLang, { relation: rel }).then((x) => { exText = x.text; const el = document.getElementById('co-ex'); if (el) el.textContent = x.text; }).catch(() => { const el = document.getElementById('co-ex'); if (el) el.textContent = tips[2]; exText = tips[2]; });
    document.getElementById('co-copy').addEventListener('click', async () => { if (!exText) return; await copyText(exText); Store.addMessage({ contactId: c.id, dir: 'out', text: tips[2], lang: uiLang, translation: exText, trLang: c.lang, source: 'coach' }); toast(t('copied', { app: appName(c.app) })); });
    $app.querySelectorAll('[data-rel]').forEach((b) => b.addEventListener('click', () => { Store.updateContact(c.id, { relation: b.dataset.rel, stage: 0 }); renderCoach(r); }));
    $app.querySelectorAll('[data-stage]').forEach((b) => b.addEventListener('click', () => { Store.updateContact(c.id, { stage: Number(b.dataset.stage) }); renderCoach(r); }));
  }

  /* ================= 일정 ================= */
  function renderAgenda(r) {
    const u = Store.me();
    const td = today();
    const items = agendaItems(u);
    const all = u.promises.slice().sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
    const pre = r.q.c || '';
    const notifState = typeof Notification === 'undefined' ? 'na' : Notification.permission;
    shell(`${topBar(t('agenda_title'), null)}
      <div class="content stack-lg">
        <div class="stack-sm"><h1>${t('today')}</h1><p class="muted">${fmtDateW(td)}</p></div>
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
          <label class="label" for="g-msg">${esc(t('gift_card', { app: appName(c.app) }))} · ${esc(langName(c.lang))}</label>
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
        <form class="card stack" id="st-ai">
          <h2>${t('set_ai')}</h2>
          <p class="small muted">${t('set_ai_hint')}</p>
          <label class="stack-xs"><span class="label">${t('set_provider')}</span><select class="field" name="provider"><option value="anthropic" ${ai.provider !== 'openai' ? 'selected' : ''}>Claude (Anthropic)</option><option value="openai" ${ai.provider === 'openai' ? 'selected' : ''}>OpenAI</option></select></label>
          <label class="stack-xs"><span class="label">${t('set_key')}</span><input class="field" name="key" type="password" autocomplete="off" value="${esc(ai.key || '')}" placeholder="sk-..."></label>
          <label class="stack-xs"><span class="label">${t('set_model')}</span><input class="field" name="model" value="${esc(ai.model || '')}" placeholder="claude-haiku-5-5 / gpt-4o-mini"></label>
          <div class="two"><button class="btn secondary" type="button" id="st-ai-test">${t('set_test')}</button><button class="btn" type="submit">${t('save')}</button></div>
        </form>
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
    const readAi = () => { const f = new FormData(aiForm); return { provider: f.get('provider'), key: (f.get('key') || '').trim(), model: (f.get('model') || '').trim() }; };
    aiForm.addEventListener('submit', (e) => { e.preventDefault(); localStorage.setItem('lm_ai', JSON.stringify(readAi())); toast(t('set_saved')); });
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
  setInterval(checkReminders, 30000);
  setTimeout(checkReminders, 2500);
  // 서버 연결 시 내 계정 제한 여부 확인
  if (Store.Sync.enabled() && Store.me()) {
    Store.Sync.fetchMyStatus().then((b) => { if (b && b.status === 'banned') { const u = Store.me(); u.status = 'banned'; u.banReason = b.reason || ''; Store.save({ noSync: true }); render(); } }).catch(() => {});
    Store.Sync.pushUser(Store.me());
  }
})();
