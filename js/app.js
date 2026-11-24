/* 상담매직 — 사용자 앱 */
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

  /* ---------- 보안: 워터마크 · 우클릭/개발자도구 단축키 차단 ---------- */
  let wmKey = '';
  function wmText() {
    const d = new Date(); const ts = `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    if (/^#\/admin/.test(location.hash)) { if (sessionStorage.getItem('lm_admin_ok') !== '1') return ''; return `${Store.db.admin.operator || 'admin'} · ${ts}`; }
    const u = Store.me(); if (!u) return '';
    if (Store.viewingAs()) return `${Store.db.admin.operator || 'admin'} 열람 · ${u.nickname} · ${u.id} · ${ts}`;
    return `${u.nickname} · ${u.id} · ${ts}`;
  }
  function applyWatermark() {
    const txt = wmText();
    let el = document.getElementById('lm-wm');
    if (!txt) { if (el) el.remove(); return; }
    if (txt === wmKey && el) return;
    wmKey = txt;
    const cv = document.createElement('canvas'); cv.width = 420; cv.height = 240;
    const g = cv.getContext('2d'); g.translate(210, 120); g.rotate(-Math.PI / 9);
    g.font = '600 15px system-ui, sans-serif'; g.textAlign = 'center'; g.fillStyle = 'rgba(16,36,62,0.075)';
    g.fillText(txt, 0, 0);
    if (!el) { el = document.createElement('div'); el.id = 'lm-wm'; el.setAttribute('aria-hidden', 'true'); document.body.appendChild(el); }
    el.style.backgroundImage = `url(${cv.toDataURL('image/png')})`;
  }
  setInterval(applyWatermark, 30000);
  // 근태: 화면을 보고 있는 동안 1분마다 접속 기록, 최근 3분 안에 입력·클릭이 있으면 '활동'
  let lastAct = Date.now();
  ['keydown', 'click', 'input', 'scroll', 'touchstart'].forEach((ev) => document.addEventListener(ev, () => { lastAct = Date.now(); }, { passive: true, capture: true }));
  function beat() { if (document.visibilityState !== 'visible' || /^#\/admin/.test(location.hash)) return; try { Store.attBeat(Date.now() - lastAct < 3 * 60000); } catch (e) {} }
  setInterval(beat, 60000); setTimeout(beat, 1500);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { try { Store.attEnd('hidden'); } catch (e) {} } else beat(); });
  window.addEventListener('pagehide', () => { try { Store.attEnd('close'); } catch (e) {} });
  document.addEventListener('contextmenu', (e) => { if (!e.target.closest('input, textarea, [contenteditable]')) e.preventDefault(); });
  document.addEventListener('dragstart', (e) => { if (e.target.tagName === 'IMG') e.preventDefault(); });
  document.addEventListener('keydown', (e) => {
    const k = (e.key || '').toLowerCase();
    if (k === 'f12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(k)) || ((e.ctrlKey || e.metaKey) && ['u', 's', 'p'].includes(k))) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  // 캡처 시도 감지 → 화면 가림 + 안내 (PrintScreen, Win+Shift+S, Mac Cmd+Shift+3/4/5)
  let capArm = 0;
  function capBlock(ms) {
    let el = document.getElementById('cap-block');
    if (!el) { el = document.createElement('div'); el.id = 'cap-block'; el.innerHTML = `<div><b>🚫 ${esc(T[uiLang].cap_block || '캡처가 금지되어 있습니다')}</b><p>${esc(T[uiLang].cap_block2 || '이 화면은 워터마크로 사용자와 시각이 기록됩니다')}</p></div>`; document.body.appendChild(el); }
    el.classList.add('on'); clearTimeout(capBlock._t); if (ms) capBlock._t = setTimeout(() => el.classList.remove('on'), ms);
  }
  function capUnblock() { const el = document.getElementById('cap-block'); if (el) el.classList.remove('on'); }
  function capLog(how) { try { const u = Store.me(); Store.audit({ action: 'capture', target: u ? u.id : '-', member: u ? u.nickname : '', reason: '화면 캡처 시도(' + how + ') · ' + location.hash }); } catch (x) {} }
  document.addEventListener('keydown', (e) => {
    const k = e.key || '';
    if (k === 'PrintScreen') { capBlock(2500); capLog('PrintScreen'); try { navigator.clipboard.writeText(''); } catch (x) {} return; }
    if ((e.metaKey || k === 'Meta' || k === 'OS') && e.shiftKey) { capArm = Date.now(); if (/^[345s]$/i.test(k)) { capBlock(4000); capLog('단축키'); } }
  }, true);
  window.addEventListener('blur', () => { if (Date.now() - capArm < 1500) { capBlock(0); capLog('캡처 도구'); } });
  window.addEventListener('focus', () => { capUnblock(); });
  // PrintScreen 키: 클립보드 비우고 기록 (OS 캡처 도구·휴대폰 촬영은 웹에서 막을 수 없어 워터마크로 추적)
  document.addEventListener('keyup', (e) => {
    if (e.key !== 'PrintScreen') return;
    try { navigator.clipboard.writeText(''); } catch (x) {}
    capBlock(2500);
  });
  // 인쇄 시 화면 내용 대신 안내만
  try { const st = document.createElement('style'); st.textContent = '@media print { body > * { display: none !important; } body::after { content: "인쇄할 수 없는 화면입니다"; display: block; padding: 40px; font: 16px sans-serif; } }'; document.head.appendChild(st); } catch (e) {}

  function render() {
    const r = route();
    if (r.name === 'admin') { document.body.classList.add('is-admin'); const ar = window.Admin.render(r); applyWatermark(); return ar; }
    document.body.classList.remove('is-admin');
    const u = Store.me();
    if (!u) return renderOnboarding();
    uiLang = u.lang || uiLang;
    document.documentElement.lang = uiLang === 'zh' ? 'zh-Hans' : uiLang;
    document.title = t('brand') + ' · ' + t('tagline');
    if (u.status === 'banned') return renderBlocked(u);
    const pages = { home: renderChat, today: renderHome, helper: renderChat, chat: renderChat, contacts: renderContacts, contact: renderContact, 'contact-edit': renderContactEdit, coach: renderCoach, agenda: renderAgenda, anniv: renderAnniv, saju: renderSaju, gift: renderGift, culture: renderCulture, settings: renderSettings, guide: renderGuide, tools: renderTools, inbox: renderInbox };
    (pages[r.name] || renderChat)(r);
    applyWatermark();
    if (['chat', 'home', 'helper', 'contact', 'coach'].includes(r.name) || !pages[r.name]) {
      const cid = r.id || (['chat', 'home', 'helper'].includes(r.name) || !pages[r.name] ? helperState.contactId : '');
      const c = cid && u.contacts.find((x) => x.id === cid);
      if (c) document.title = (POP ? '💬 ' : '') + c.nickname + ' · ' + appName(c.app) + ' — ' + t('brand');
    }
    window.scrollTo(0, 0); const _mn = document.querySelector('.ws-main'); if (_mn) _mn.scrollTop = 0;
  }

  const WIDE = window.matchMedia('(min-width: 1100px)');
  WIDE.addEventListener('change', () => render());
  function viewAsBanner() {
    const v = Store.viewingAs(); if (!v) return '';
    return `<div class="viewas-bar">👁 <b>${esc(v.nickname)}</b> <span>(${esc(v.id)})</span> 회원 화면 보기 중 · 읽기 전용, 변경 내용은 저장되지 않아요 <button type="button" id="viewas-exit">관리자로 돌아가기</button></div>`;
  }
  document.addEventListener('click', (e) => { if (e.target.closest('#viewas-exit')) { const v = Store.viewingAs(); Store.stopViewAs(); location.href = 'app.html#/admin/users?u=' + (v ? v.id : ''); location.reload(); } });
  const POP = new URLSearchParams(location.search).has('pop');
  if (POP) document.documentElement.classList.add('pop');
  let popN = 0;
  function openPop(cid) {
    const w = 440, h = Math.min(860, screen.availHeight - 40);
    const left = Math.max(0, screen.availWidth - w - 24 - (popN % 4) * 36), top = 20 + (popN % 4) * 36; popN++;
    const win = window.open('app.html?pop=1&lang=' + uiLang + '#/chat/' + cid, 'lm_pop_' + cid, `popup=yes,width=${w},height=${h},left=${left},top=${top}`);
    if (!win) { toast(t('pop_blocked')); return; }
    try { win.focus(); } catch (e) {}
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pop]'); if (!b) return;
    e.preventDefault(); e.stopPropagation(); openPop(b.dataset.pop);
  }, true);
  document.addEventListener('click', (e) => { if (e.target.closest('#pop-main')) { e.preventDefault(); try { if (window.opener && !window.opener.closed) { window.opener.focus(); return; } } catch (x) {} window.open('app.html#/chat', 'lm_main'); } });
  // 다른 창(팝업·메인)에서 저장하면 이 창도 최신으로
  let syncPending = false;
  const typing = () => { const a = document.activeElement; return a && (a.id === 'ch-input' || a.tagName === 'TEXTAREA' || a.tagName === 'INPUT') && a.value; };
  window.addEventListener('storage', (e) => {
    if (e.key !== Store.KEY || Store.viewingAs()) return;
    Store.reload();
    if (typing()) { syncPending = true; return; }
    const sc = document.querySelector('.ws-main, .chat-scroll'); render();
  });
  document.addEventListener('focusout', () => { if (syncPending && !typing()) { syncPending = false; setTimeout(render, 50); } });

  function shell(inner, active, opts) {
    const nav = [['chat', 'chat', 'nav_helper'], ['contacts', 'person', 'nav_contacts'], ['agenda', 'calendar', 'nav_agenda'], ['settings', 'settings', 'nav_settings']];
    const navW = nav.slice(0, 3).concat([['anniv', 'cake', 'nav_anniv'], ['coach', 'heart', 'nav_coach'], ['saju', 'yin', 'nav_saju'], ['gift', 'gift', 'nav_gift'], ['culture', 'globe', 'nav_culture'], nav[3], ['guide', 'help', 'nav_guide']]);
    const navM = nav.slice(0, 3).concat([['tools', 'grid', 'nav_tools'], nav[3]]);
    const ibU = Store.me(); if (ibU && hasInbox(ibU)) { const ix = navW.findIndex((x) => x[0] === 'guide'); navW.splice(ix, 0, ['inbox', 'bell', 'nav_inbox']); }
    const ibN = ibU ? Store.unreadNotices(ibU.id) : 0;
    if (POP) {
      document.body.classList.remove('is-wide'); document.body.classList.add('pop');
      $app.innerHTML = `<div class="screen pop-screen">${inner}</div>`;
      return;
    }
    if (WIDE.matches && !(opts && opts.noNav)) {
      document.body.classList.add('is-wide');
      $app.innerHTML = `<div class="ws">
        <aside class="ws-rail" aria-label="main"><span class="rail-logo"><img src="assets/lm-mark.png" alt="LM"></span>
          <label class="rail-lang" title="${esc(t('lang_l'))}">🌐<select id="lang-quick" aria-label="${esc(t('lang_l'))}">${UI_LANGS.map((l) => `<option value="${l}" ${l === uiLang ? 'selected' : ''}>${esc({ ko: '한국어', zh: '中文', ja: '日本語', vi: 'Tiếng Việt', en: 'English' }[l])}</option>`).join('')}</select></label>
          ${navW.map(([k, ic, lb]) => `<button type="button" data-go="#/${k}" ${active === k ? 'aria-current="page"' : ''} title="${esc(t(lb))}" ${k === 'inbox' ? 'class="rail-inbox" style="margin-top:auto"' : k === 'guide' && !navW.some((x) => x[0] === 'inbox') ? 'style="margin-top:auto"' : ''}>${k === 'inbox' ? '<span class="rail-ib" aria-hidden="true">✉</span>' : icon(ic)}<span>${t(lb)}</span>${k === 'inbox' && ibN ? `<em class="nav-dot">${ibN}</em>` : ''}</button>`).join('')}
        </aside>
        <main class="ws-main"><div class="screen">${active !== 'inbox' ? inboxBanner() : ''}${inner}</div></main>
        <aside class="ws-side">${sideHtml()}</aside>
      </div>`;
      if (Store.viewingAs()) { $app.insertAdjacentHTML('afterbegin', viewAsBanner()); document.body.classList.add('viewas'); }
      return;
    }
    document.body.classList.remove('is-wide');
    $app.innerHTML = `<div class="screen">${active !== 'inbox' ? inboxBanner() : ''}${inner}</div>${opts && opts.noNav ? '' : `<nav class="bottom" aria-label="main">${navM.map(([k, ic, lb]) => `<button type="button" data-go="#/${k}" ${active === k ? 'aria-current="page"' : ''}>${icon(ic)}<span>${t(lb)}</span></button>`).join('')}</nav>`}`;
    if (Store.viewingAs()) { $app.insertAdjacentHTML('afterbegin', viewAsBanner()); document.body.classList.add('viewas'); }
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
        <div class="quick-tools">${[['coach', 'heart', 'nav_coach', '#/coach/' + c.id], ['saju', 'yin', 'nav_saju', '#/saju/' + c.id], ['gift', 'gift', 'nav_gift', '#/gift/' + c.id], ['culture', 'globe', 'nav_culture', '#/culture?c=' + c.id], ['anniv', 'cake', 'nav_anniv', '#/anniv?c=' + c.id]].map(([k, ic, lb, h]) => `<button type="button" class="qt t-${k}" data-go="${h}">${icon(ic, 'sm')}<span>${t(lb)}</span></button>`).join('')}</div>
        <div class="between" style="gap:8px"><span class="row" style="gap:6px"><span class="tiny muted">${t('star_l')}</span>${starsHtml(c, true)}</span><button type="button" class="chip sm ${c.pinned ? 'on' : ''}" data-pin="${c.id}">📌 ${c.pinned ? t('unpin') : t('pin')}</button></div>
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
      ${pf.count >= 3 ? (() => { const ri = relInsight(c, Store.messagesOf(c.id, u)); const top = ri.signals.slice(0, 3); return `<div class="ws-card"><span class="ws-h">🔎 ${t('ri_signals')}</span>${top.length ? top.map((s2) => `<div class="small"><b>${s2.tone === 'warn' ? '⚠' : s2.tone === 'good' ? '✅' : '💬'} ${esc(s2.title)}</b><br><span class="tiny muted">${esc(s2.detail)}</span></div>`).join('') : `<p class="tiny muted">—</p>`}<div class="small"><b>👉 ${esc(ri.next[0] ? ri.next[0].title : '')}</b></div><button class="btn sm secondary" type="button" data-go="#/coach/${c.id}">${t('ri_title')} →</button></div>`; })() : ''}
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
      ${c ? `<div class="side-info ${chatState.infoOpen ? 'open' : ''}"><button type="button" class="ws-toggle" id="ws-info-toggle" aria-expanded="${!!chatState.infoOpen}"><span>${t('c_info')} · <b lang="${esc(c.lang)}">${esc(c.nickname)}</b></span><span class="ws-toggle-act">${chatState.infoOpen ? t('close_l') + ' ▾' : t('open_l') + ' ▴'}</span></button>${chatState.infoOpen ? `<div class="side-info-body">${info}</div>` : ''}</div>` : ''}
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
          <button type="button" class="chip sm ${chatState.starOnly ? 'on' : ''}" id="ws-star">★ ${t('f_star')}</button><button type="button" class="chip sm ${chatState.needOnly ? 'on' : ''}" id="ws-need">${t('st_need')}${needN ? ' ' + needN : ''}</button>
          ${apps.map((ap) => `<button type="button" class="chip sm ${chatState.app === ap ? 'on' : ''}" data-fapp="${esc(ap)}">${appBadge(ap, true)} ${cnt(ap)}</button>`).join('')}
          <label class="sort-wrap" title="${esc(t('sort_by'))}"><span aria-hidden="true">⇅</span><select class="sel-xs" aria-label="${esc(t('sort_by'))}" id="ws-sort"><option value="recent" ${chatState.sort !== 'need' && chatState.sort !== 'name' ? 'selected' : ''}>${t('sort_recent')}</option><option value="need" ${chatState.sort === 'need' ? 'selected' : ''}>${t('st_need')}</option><option value="star" ${chatState.sort === 'star' ? 'selected' : ''}>${t('sort_star')}</option><option value="name" ${chatState.sort === 'name' ? 'selected' : ''}>${t('sort_name')}</option></select></label>
        </div>

      </div>`;
  }
  function prevText(m) {
    if (m.dir === 'in') return m.trLang === uiLang ? (m.translation || m.text) : ((m.trs && m.trs[uiLang + '|in']) || m.text);
    return m.lang === uiLang ? m.text : ((m.trs && m.trs[uiLang + '|out']) || m.translation || m.text);
  }
  function wsRows(u, curId) {
    const q = (chatState.q || '').trim().toLowerCase();
    const rows = u.contacts.map((c) => { const ms = Store.messagesOf(c.id, u); const last = ms[ms.length - 1]; return { c, last, st: convStatus(ms), ts: last ? last.ts : c.createdAt }; })
      .filter((r) => (!q || (r.c.nickname + ' ' + appName(r.c.app) + ' ' + (r.c.note || '')).toLowerCase().includes(q)) && (!chatState.needOnly || r.st === 'need' || r.st === 'new') && (!chatState.app || r.c.app === chatState.app) && (!chatState.starOnly || (r.c.star || 0) >= 1))
      .sort((a, b) => (!!b.c.pinned - !!a.c.pinned) || (chatState.sort === 'star' ? ((b.c.star || 0) - (a.c.star || 0)) || b.ts - a.ts : 0) || (chatState.sort === 'name' ? a.c.nickname.localeCompare(b.c.nickname) : chatState.sort === 'need' ? ((b.st === 'need' || b.st === 'new') - (a.st === 'need' || a.st === 'new')) || b.ts - a.ts : b.ts - a.ts));
    return rows.map(({ c: x, last, st }) => `<button type="button" class="ws-item ${x.id === curId ? 'on' : ''} ${x.pinned ? 'pinned' : ''}" data-go="#/chat/${x.id}" data-cid="${x.id}" title="${esc(t('dbl_hint'))}">${avatar(x, 'sm')}<span class="grow" style="min-width:0"><span class="row-name"><strong class="ellipsis" lang="${esc(x.lang)}">${x.pinned ? '<span class="pin-ic" aria-hidden="true">📌</span>' : ''}${esc(x.nickname)}</strong>${x.star ? starsHtml(x) : ''}</span><span class="tiny muted ellipsis" style="display:block">${appBadge(x.app)} ${last ? esc(prevText(last)) : ''}</span></span><span class="ws-right"><span class="ws-pop" data-pop="${x.id}" role="button" title="${esc(t('pop_open'))}">↗</span><span class="tiny muted">${last ? esc(shortTs(last.ts)) : ''}</span>${st ? `<span class="st-pill st-${st}">${t({ new: 'st_new', need: 'st_need', copied: 'st_copied', done: 'st_done' }[st])}</span>` : ''}</span></button>`).join('') || `<p class="tiny muted" style="padding:8px">${t('no_result')}</p>`;
  }
  document.addEventListener('change', (e) => { if (e.target.id === 'lang-quick') { const u = Store.me(); uiLang = e.target.value; if (u) { u.lang = uiLang; Store.save(); } render(); setTimeout(() => { try { runDigests(); } catch (x) {} }, 300); } });
  document.addEventListener('change', (e) => { if (e.target.id === 'ws-sort') { chatState.sort = e.target.value; const u = Store.me(); const l = document.getElementById('ws-list'); if (u && l) l.innerHTML = wsRows(u, helperState.contactId || route().id); } });
  document.addEventListener('click', (e) => { if (e.target.closest('#ch-info-btn')) { chatState.infoOpen = !chatState.infoOpen; const sd = document.querySelector('.ws-side'); if (sd) sd.innerHTML = sideHtml(); const b = document.getElementById('ch-info-btn'); if (b) { b.classList.toggle('on', chatState.infoOpen); b.setAttribute('aria-pressed', String(chatState.infoOpen)); } } });
  document.addEventListener('dblclick', (e) => { const it = e.target.closest('.ws-item[data-cid]'); if (!it) return; if (WIDE.matches) { chatState.infoOpen = true; location.hash = '#/chat/' + it.dataset.cid; const sd = document.querySelector('.ws-side'); if (sd) sd.innerHTML = sideHtml(); } else location.hash = '#/contact/' + it.dataset.cid; });
  document.addEventListener('input', (e) => { if (e.target.id === 'ws-search') { chatState.q = e.target.value; const u = Store.me(); const l = document.getElementById('ws-list'); if (u && l) l.innerHTML = wsRows(u, helperState.contactId || route().id); } });
  document.addEventListener('click', (e) => {
    const resd = () => { const sd = document.querySelector('.ws-side'); if (sd) sd.innerHTML = sideHtml(); else if (/^#\/chat\/?$/.test(location.hash)) renderChatPicker(); };
    if (e.target.closest('#ws-need')) { chatState.needOnly = !chatState.needOnly; if (chatState.needOnly) chatState.app = ''; resd(); }
    const fa = e.target.closest('[data-fapp]'); if (fa) { chatState.app = fa.dataset.fapp; if (!fa.dataset.fapp) chatState.needOnly = false; resd(); }
    if (e.target.closest('#ws-info-toggle')) { chatState.infoOpen = !chatState.infoOpen; resd(); }
    if (e.target.closest('#ws-star')) { chatState.starOnly = !chatState.starOnly; resd(); }
    const sb = e.target.closest('[data-star]'); if (sb) { e.preventDefault(); e.stopPropagation(); const [cid, n] = sb.dataset.star.split('|'); const cc = Store.contact(cid); if (cc) { Store.updateContact(cid, { star: (cc.star || 0) === Number(n) ? Number(n) - 1 : Number(n) }); resd(); const cs = document.querySelector('.content [data-star]'); if (cs && /^#\/contact\//.test(location.hash)) render(); } }
    const pb = e.target.closest('[data-pin]'); if (pb) { e.preventDefault(); const cc = Store.contact(pb.dataset.pin); if (cc) { Store.updateContact(cc.id, { pinned: !cc.pinned }); resd(); if (/^#\/contact\//.test(location.hash)) render(); } }
  });

  function topBar(title, back, right) {
    return `<header class="top between"><div class="row grow" style="min-width:0">${back ? `<button class="icon-btn" type="button" data-go="${back}" aria-label="${t('back')}">${icon('back')}</button>` : `<span class="brand"><img class="brand-img" src="assets/lm-mark.png" alt="LM">${esc(t('brand'))}</span>`}${title ? `<strong class="ellipsis">${title}</strong>` : ''}</div>${right || ''}</header>`;
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
        <header class="top row"><span class="brand"><img class="brand-img" src="assets/lm-mark.png" alt="LM">${esc(t('brand'))}</span></header>
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
    $app.innerHTML = `<div class="screen"><header class="top row"><span class="brand"><img class="brand-img" src="assets/lm-mark.png" alt="LM">${esc(t('brand'))}</span></header>
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
      return `<li><button class="list-row" type="button" data-go="#/agenda">${av}<span class="grow">${lab}<br><strong>${it.kind === 'overdue' ? `<span class="badge alert">${t('overdue')}</span> ` : ''}${it.kind === 'today' ? t('d_today') : fmtDateW(p.date)} ${esc(p.time || '')} · ${esc(p.title)}${p.auto ? ` <span class="badge lilac">🤖 ${t('auto_badge')}</span>` : ''}</strong>${p.place ? `<br><span class="small muted">${esc(p.place)}</span>` : ''}</span>${icon('arrow', 'chev')}</button></li>`;
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
      const PROMPT = 'Transcribe the chat messages in this screenshot exactly, one message per line, oldest first. Prefix messages from the other person (usually left side, with avatar/name) with "THEM: " and from the phone owner (usually right side, colored bubbles) with "ME: ". Skip timestamps, dates and system notices. Output only the transcript.';
      if (cfg.key) {
        const b64 = await fileToB64(file);
        text = await Engine.visionCall(b64, file.type || 'image/png', PROMPT);
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => /^THEM:/i.test(l) ? { dir: 'in', text: l.replace(/^THEM:\s*/i, '') } : /^ME:/i.test(l) ? { dir: 'out', text: l.replace(/^ME:\s*/i, '') } : null).filter(Boolean);
        if (lines.length >= 2) { note.textContent = t('ocr_done'); helperState.source = 'ocr'; return { lines }; }
        if (lines.length === 1) text = lines[0].text;
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


  /* ---------- 대화 묶음 가져오기 (스크린샷 인식 결과·카톡/LINE 내보내기 텍스트) ---------- */
  function parseChatExport(text, c) {
    const out = [];
    const nick = c ? c.nickname.trim() : '';
    const push = (name, msg) => { msg = (msg || '').trim(); if (!msg) return; const isThem = nick && (name.trim() === nick || name.includes(nick) || nick.includes(name.trim())); out.push({ dir: isThem ? 'in' : 'out', text: msg, name: name.trim() }); };
    String(text).split(/\r?\n/).forEach((ln) => {
      let m;
      if ((m = ln.match(/^\[([^\]]+)\]\s*\[[^\]]+\]\s*(.+)$/))) push(m[1], m[2]); // 카톡 PC: [이름] [오후 3:12] 내용
      else if ((m = ln.match(/^\d{4}[.년]\s*\d{1,2}[.월]\s*\d{1,2}[.일]?\s*(?:오전|오후|AM|PM)?\s*\d{1,2}:\d{2},\s*([^:]+?)\s*:\s*(.+)$/))) push(m[1], m[2]); // 카톡 모바일 내보내기
      else if ((m = ln.match(/^\d{1,2}:\d{2}\t([^\t]+)\t(.+)$/))) push(m[1], m[2]); // LINE 내보내기
      else if ((m = ln.match(/^(THEM|ME):\s*(.+)$/i))) out.push({ dir: m[1].toUpperCase() === 'THEM' ? 'in' : 'out', text: m[2].trim() });
    });
    return out.length >= 2 ? out : null;
  }
  async function bulkImport(c, lines, target) {
    const base = Date.now() - lines.length * 60000;
    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i];
      const lang = Engine.detect(ln.text);
      if (ln.dir === 'in') {
        let tr = ''; try { tr = (await Engine.translate(ln.text, uiLang, lang)).text; } catch (e) {}
        Store.addMessage({ contactId: c ? c.id : null, dir: 'in', text: ln.text, lang, translation: tr, trLang: uiLang, source: 'import', ts: base + i * 60000 });
      } else {
        let mean = ln.text; try { if (lang !== uiLang) mean = (await Engine.translate(ln.text, uiLang, lang)).text; } catch (e) {}
        Store.addMessage({ contactId: c ? c.id : null, dir: 'out', text: mean, lang: uiLang, translation: lang !== uiLang ? ln.text : '', trLang: lang !== uiLang ? lang : target, source: 'import', sent: true, ts: base + i * 60000 });
      }
    }
    toast(t('imported_n', { n: lines.length }));
  }

  /* ---------- 받은 말 분석 ---------- */
  function myL(c) { return (c && c.myLang) || uiLang; }
  function pickReplySet(intents, c, text) {
    if (text && Engine.isJunk(text)) return 'unclear';
    const biz = c && (c.relation === 'business' || c.tone === 'business');
    if (biz) {
      if (intents.includes('request')) return 'biz_request';
      if (intents.includes('thanks')) return 'biz_thanks';
      if (intents.includes('question')) return 'biz_question';
      if (intents.includes('greeting')) return 'biz_greeting';
      return 'biz_general';
    }
    const order = ['invite', 'negative', 'busy', 'request', 'affection', 'sorry', 'thanks', 'question', 'greeting', 'positive'];
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
    const ML = myL(c); const RL = REPLIES[ML] ? ML : uiLang;
    const u = Store.me();
    const from = Engine.detect(text);
    const history = c ? Store.messagesOf(c.id).filter((x) => !(opts && opts.existing) || x.ts < opts.existing.ts) : [];
    const res = { text, from, provider: 'mt' };
    let ai = null;
    if (Engine.aiConfig().key && c) {
      try {
        const stage = STAGE_NAMES.en[STAGES[c.relation || 'friend'][c.stage || 0]];
        const tc0 = toneCtx(c); const tset = tc0.toneKey === 'basic' ? TONE6.map((k) => ({ key: k, label: t('t_' + k), prompt: TONE_PROMPT[k] })) : null;
        ai = await Engine.aiAnalyze({ uiLang, contact: c, text, dir: 'in', history, stageName: stage, tone: tc0.tone, toneSet: tset, age: ageOf(c) });
        res.provider = 'ai';
      } catch (e) { ai = null; }
    }
    const trn = ai && ai.translation ? { text: ai.translation } : await tr(text, ML, from);
    res.translation = trn.text;
    const both = text + '\n' + res.translation;
    res.intents = Engine.intents(text);
    if (!res.intents.length) res.intents = Engine.intents(res.translation).filter((k) => k !== 'question');
    res.risk = Engine.intents(both).filter((x) => x === 'money' || x === 'offplatform');
    res.risk.forEach((k) => { if (!res.intents.includes(k)) res.intents.push(k); });
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
      replies = ai.replies.slice(0, 6).map((r) => ({ label: r.label, text: r.text, meaning: r.meaning, src: r.meaning }));
    } else {
      const set = pickReplySet(res.intents, c, text);
      const biz6 = c && (c.relation === 'business' || c.tone === 'business');
      const extraSets = (biz6 ? ['biz_question', 'biz_general', 'biz_thanks', 'biz_greeting', 'biz_request'] : res.intents.map((k) => k).concat(['question', 'general', 'positive', 'thanks', 'greeting'])).filter((k) => k !== set && REPLIES[RL][k]);
      const tpl0 = REPLIES[RL][set] || REPLIES[RL].general;
      const seenT = new Set(tpl0.map((x) => x[1])); const seenL = {};
      const tpl = tpl0.slice();
      for (const k of extraSets) { for (const it of REPLIES[RL][k]) { if (tpl.length >= 6) break; if (seenT.has(it[1]) || /\{answer\}|\{when\}|\{by\}/.test(it[1]) && k !== set) continue; seenT.add(it[1]); tpl.push(it); } if (tpl.length >= 6) break; }
      const wb = res.when ? fmtWhenUi(res.when) : '';
      const byTxt = !wb ? '' : ({ ko: wb + '까지 ', zh: wb + '之前', ja: wb + 'までに', vi: 'trước ' + wb + ' ', en: 'by ' + wb })[RL] || '';
      const whenTxt = res.when ? fmtWhenUi(res.when) + ' ' : '';
      const placeTxt = res.place ? res.place + (RL === 'ko' ? '에서' : RL === 'en' ? ' at ' : ' ') : '';
      const usedLab = new Set();
      const built = tpl.map(([lab, s]) => {
        let x = s.replace('{when}', whenTxt).replace('{place}', RL === 'en' ? (res.place ? 'at ' + res.place : '') : placeTxt).replace('{answer}', REPLIES[RL].answer_ph).replace('{by}', byTxt);
        x = x.replace(/\s{2,}/g, ' ').replace(/\s+([!?.,])/g, '$1');
        let L2 = lab; if (usedLab.has(L2)) L2 = ['dir_continue', 'dir_answer', 'dir_light', 'dir_ask', 'dir_thanks', 'dir_ok', 'dir_empathy', 'dir_resched'].find((k) => !usedLab.has(k)) || lab; usedLab.add(L2);
        return { label: t(L2), src: x };
      });
      const outs = await Promise.all(built.map((b) => tr(b.src, target, RL, { relation: c ? c.relation : '' }).catch(() => ({ text: '' }))));
      replies = built.map((b, i) => ({ label: b.label, src: b.src, text: outs[i].text, meaning: b.src }));
      const tk = toneCtx(c).toneKey;
      if (RL === 'ko' && built.length) {
        let tb;
        if (tk === 'basic') tb = TONE6.map((k, i) => ({ label: t('t_' + k), src: koTone(built[i % Math.min(3, built.length)].src, k) }));
        else tb = built.map((b) => ({ label: b.label, src: koTone(b.src, tk) }));
        const outs2 = await Promise.all(tb.map((b) => tr(b.src, target, RL, { relation: c ? c.relation : '', tone: TONE_PROMPT[tk === 'basic' ? 'polite' : tk] }).catch(() => ({ text: '' }))));
        replies = tb.map((b, i) => ({ label: b.label, src: b.src, text: outs2[i].text, meaning: b.src }));
      }
      const ag = ageOf(c);
      if (ag) replies = replies.map((r) => Object.assign({}, r, target === 'ko' ? { text: koAge(r.text, ag) } : {}, RL === 'ko' && target === 'ko' ? { meaning: koAge(r.meaning, ag), src: koAge(r.src, ag) } : {}));
    }
    res.replies = replies;
    res.target = target;
    res.culture = ai && ai.culture ? ai.culture : cultureTipFor(c);
    res.coach = ai && ai.coach ? ai.coach : null;
    res.avoid = ai && ai.avoid ? ai.avoid : null;
    // 저장(관리자 모니터링 대상)
    const fields = {
      contactId: c ? c.id : null, dir: 'in', text, lang: from, translation: res.translation, trLang: ML,
      source: helperState.source || 'paste', intents: res.intents, risk: res.risk, provider: res.provider,
      suggestions: replies.map((r) => r.text), nuance: res.nuance.join(' '),
    };
    let msg;
    if (opts && opts.existing) { msg = opts.existing; const keepTr = msg.translation && msg.trLang === uiLang; Object.assign(msg, fields, { source: msg.source || fields.source, translation: keepTr ? msg.translation : fields.translation, trLang: uiLang }); Store.save(); }
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
    ko: { chat_title: '대화방', chat_pick: '누구와의 대화인가요?', chat_none: '연락처 없이 번역만', smart_ph: '상대 메시지 붙여넣기 · 내 말 쓰기 · 스크린샷은 Ctrl+V나 끌어다 놓기 · 카톡 대화 여러 줄도 한 번에', smart_hint: '상대 언어로 붙여넣으면 받은 말, 내 언어로 쓰면 보낼 말로 자동 인식해요.', det_in: '받은 말로 인식', det_out: '보낼 말로 인식', det_switch: '바꾸기', send: '넣기', use_reply: '이걸로 답장', copy: '복사', copied_short: '복사됨', analysis: '분석과 답장 추천', open_chat: '대화방 열기', chat_empty: '아직 대화가 없어요. 상대가 보낸 메시지를 붙여넣어 보세요.', all_chat: '전체 대화', thread_count: '대화 {n}건', pick_first: '대화 상대를 먼저 고르세요', translating: '번역 중…', show_more: '이전 대화 더 보기' },
    zh: { chat_title: '对话', chat_pick: '和谁的对话？', chat_none: '不选联系人，仅翻译', smart_ph: '粘贴对方的消息 · 写下你想说的话 · 截图可 Ctrl+V 或拖进来 · 多条聊天记录也能一次粘贴', smart_hint: '用对方语言粘贴会识别为收到的话，用你的语言写会识别为要发的话。', det_in: '识别为收到的话', det_out: '识别为要发的话', det_switch: '切换', send: '添加', use_reply: '用这句回复', copy: '复制', copied_short: '已复制', analysis: '分析与回复建议', open_chat: '打开对话', chat_empty: '还没有对话。粘贴对方发来的消息试试。', all_chat: '全部对话', thread_count: '共 {n} 条', pick_first: '请先选择联系人', translating: '翻译中…', show_more: '查看更早的对话' },
    ja: { chat_title: 'トーク', chat_pick: '誰との会話ですか？', chat_none: '連絡先なしで翻訳だけ', smart_ph: '相手のメッセージを貼り付け · 自分の言葉を書く · スクショは Ctrl+V かドラッグ · 複数行の会話もまとめて', smart_hint: '相手の言語で貼ると「届いた言葉」、自分の言語で書くと「送る言葉」として自動で判別します。', det_in: '届いた言葉として判別', det_out: '送る言葉として判別', det_switch: '切り替え', send: '追加', use_reply: 'これで返信', copy: 'コピー', copied_short: 'コピー済み', analysis: '分析と返信案', open_chat: 'トークを開く', chat_empty: 'まだ会話がありません。相手のメッセージを貼り付けてみましょう。', all_chat: 'すべての会話', thread_count: '{n}件', pick_first: '先に相手を選んでください', translating: '翻訳中…', show_more: '以前の会話を表示' },
    vi: { chat_title: 'Trò chuyện', chat_pick: 'Trò chuyện với ai?', chat_none: 'Chỉ dịch, không chọn liên hệ', smart_ph: 'Dán tin nhắn của họ · viết điều bạn muốn nói · ảnh chụp: Ctrl+V hoặc kéo thả · dán nhiều dòng cùng lúc', smart_hint: 'Dán bằng tiếng của họ sẽ là tin nhận được, viết bằng tiếng của bạn sẽ là tin để gửi.', det_in: 'Nhận diện: tin nhận được', det_out: 'Nhận diện: tin để gửi', det_switch: 'Đổi', send: 'Thêm', use_reply: 'Trả lời bằng câu này', copy: 'Sao chép', copied_short: 'Đã sao chép', analysis: 'Phân tích và gợi ý trả lời', open_chat: 'Mở trò chuyện', chat_empty: 'Chưa có tin nhắn. Hãy dán tin nhắn họ gửi.', all_chat: 'Toàn bộ hội thoại', thread_count: '{n} tin', pick_first: 'Hãy chọn người trò chuyện trước', translating: 'Đang dịch…', show_more: 'Xem tin cũ hơn' },
    en: { chat_title: 'Chat', chat_pick: 'Who is this chat with?', chat_none: 'No contact, just translate', smart_ph: 'Paste their message · write your reply · screenshots: Ctrl+V or drag in · paste many lines at once', smart_hint: 'Paste in their language and it\'s a received message. Write in yours and it\'s a reply to send.', det_in: 'Detected: received', det_out: 'Detected: to send', det_switch: 'Switch', send: 'Add', use_reply: 'Reply with this', copy: 'Copy', copied_short: 'Copied', analysis: 'Analysis and reply ideas', open_chat: 'Open chat', chat_empty: 'No messages yet. Paste a message they sent.', all_chat: 'Full conversation', thread_count: '{n} messages', pick_first: 'Pick who you are talking to first', translating: 'Translating…', show_more: 'Show earlier messages' },
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
  const GD_T = {"ko": {"nav_guide": "사용법", "g_title": "이렇게 쓰세요", "g_lead": "상담매직은 카톡·위챗 같은 메신저에 접속하지 않고, 대화를 자동으로 가져오지 않습니다. 받은 메시지를 복사해 붙여넣으면 번역·분석·답장 추천을 해드립니다.", "g1t": "대화 상대 등록", "g1": "상대마다 한 번만 등록하세요. 닉네임, 쓰는 메신저(카톡·위챗·LINE…), 상대 언어만 넣으면 됩니다. 생일·혈액형은 나중에 넣어도 돼요.", "g2t": "받은 메시지 붙여넣기", "g2": "메신저에서 상대 메시지를 길게 눌러 복사 → 이 앱 대화방 입력창에 붙여넣기. 스크린샷을 올려도 글자를 읽어요. 번역·말투·지난 대화·약속이 바로 정리됩니다.", "g3t": "내 말로 답장 쓰기", "g3": "한국어로 쓰거나 추천 답장을 고르세요. 상대 언어로 번역돼 자동 복사됩니다. 메신저로 돌아가 붙여넣고 보내세요.", "g4t": "PC에서는 2모니터로", "g4": "한쪽 화면에 카톡·위챗, 다른 쪽에 이 앱을 띄우세요. 오른쪽 목록에서 상대를 바꿔도 쓰던 초안이 남아요.", "g_ai_t": "번역을 더 자연스럽게 (선택)", "g_ai": "기본 번역은 무료입니다. OpenAI나 Claude 키를 넣으면 말투·뉘앙스 분석과 답장 추천이 훨씬 좋아집니다.", "g_add": "첫 상대 등록하기", "g_try": "샘플 대화로 먼저 보기", "g_ai_btn": "AI 키 넣기", "g_open_chat": "대화방 열기", "g_note": "대화 내용은 이 기기에 저장되고, 가입 시 동의한 범위에서 운영자가 관리 목적으로 볼 수 있습니다.", "ai_steps_t": "키 받는 방법", "ai_s1": "아래 버튼으로 키 발급 페이지를 엽니다 (로그인 필요).", "ai_s2": "‘Create new secret key’(새 키 만들기)를 누르고 생성된 키를 복사합니다.", "ai_s3": "아래 ‘API 키’ 칸에 붙여넣고 저장 → 연결 테스트를 누르세요.", "ai_s4": "OpenAI는 결제 수단 등록(소액 충전)이 필요합니다. 쓴 만큼만 과금돼요.", "ai_s4c": "Claude는 콘솔에서 크레딧 충전이 필요합니다. 쓴 만큼만 과금돼요.", "ai_get_openai": "OpenAI 키 발급 페이지 열기", "ai_get_claude": "Claude 키 발급 페이지 열기"}, "zh": {"nav_guide": "使用方法", "g_title": "这样使用", "g_lead": "语言魔术师不会登录微信、KakaoTalk 等聊天软件，也不会自动读取聊天。把收到的消息复制粘贴进来，就能获得翻译、分析和回复建议。", "g1t": "添加聊天对象", "g1": "每个人只需添加一次：昵称、使用的聊天软件、对方语言即可。生日、血型可以以后再填。", "g2t": "粘贴收到的消息", "g2": "在聊天软件里长按复制对方的消息 → 粘贴到本应用的输入框。也可以上传截图。翻译、语气、以前的对话和约定会立即整理好。", "g3t": "用自己的语言回复", "g3": "用中文写或选择推荐回复，会翻译成对方语言并自动复制。回到聊天软件粘贴发送。", "g4t": "电脑上用双屏", "g4": "一个屏幕开微信，另一个屏幕开本应用。在右侧列表切换对象时，草稿会保留。", "g_ai_t": "让翻译更自然（可选）", "g_ai": "基础翻译免费。填入 OpenAI 或 Claude 密钥后，语气分析和回复建议会好很多。", "g_add": "添加第一个对象", "g_try": "先看示例对话", "g_ai_btn": "填写 AI 密钥", "g_open_chat": "打开对话", "g_note": "对话保存在本设备，运营方可在注册时同意的范围内出于管理目的查看。", "ai_steps_t": "获取密钥的方法", "ai_s1": "点击下面的按钮打开密钥页面（需要登录）。", "ai_s2": "点击 “Create new secret key”，复制生成的密钥。", "ai_s3": "粘贴到下面的“API 密钥”栏并保存 → 点“测试连接”。", "ai_s4": "OpenAI 需要绑定付款方式（少量充值），按用量计费。", "ai_s4c": "Claude 需要在控制台充值额度，按用量计费。", "ai_get_openai": "打开 OpenAI 密钥页面", "ai_get_claude": "打开 Claude 密钥页面"}, "ja": {"nav_guide": "使い方", "g_title": "使い方", "g_lead": "言葉の魔法使いはLINEやカカオトークにログインせず、会話を自動で読み取りません。届いたメッセージをコピーして貼り付けると、翻訳・分析・返信案を出します。", "g1t": "相手を登録", "g1": "相手ごとに一度だけ。ニックネーム、使っているアプリ、相手の言語だけで大丈夫です。誕生日や血液型は後からでも。", "g2t": "届いたメッセージを貼り付け", "g2": "メッセンジャーで相手のメッセージを長押ししてコピー → このアプリの入力欄に貼り付け。スクショでもOK。翻訳・口調・前の会話・約束をすぐ整理します。", "g3t": "自分の言葉で返信", "g3": "日本語で書くか返信案を選ぶと、相手の言語に翻訳して自動コピーします。メッセンジャーに戻って貼り付けて送信。", "g4t": "PCではデュアルモニターで", "g4": "片方にLINE、もう片方にこのアプリ。右の一覧で相手を切り替えても下書きは残ります。", "g_ai_t": "翻訳をもっと自然に（任意）", "g_ai": "基本の翻訳は無料。OpenAIかClaudeのキーを入れると、ニュアンス分析と返信案がずっと良くなります。", "g_add": "最初の相手を登録", "g_try": "サンプルで見てみる", "g_ai_btn": "AIキーを入れる", "g_open_chat": "会話を開く", "g_note": "会話はこの端末に保存され、登録時に同意した範囲で運営者が管理目的で閲覧できます。", "ai_steps_t": "キーの取り方", "ai_s1": "下のボタンでキー発行ページを開きます（ログインが必要）。", "ai_s2": "「Create new secret key」を押して、作られたキーをコピー。", "ai_s3": "下の「APIキー」欄に貼り付けて保存 → 接続テスト。", "ai_s4": "OpenAIは支払い方法の登録（少額チャージ）が必要です。使った分だけ課金されます。", "ai_s4c": "Claudeはコンソールでクレジットのチャージが必要です。使った分だけ課金されます。", "ai_get_openai": "OpenAIキー発行ページを開く", "ai_get_claude": "Claudeキー発行ページを開く"}, "vi": {"nav_guide": "Hướng dẫn", "g_title": "Cách dùng", "g_lead": "Ứng dụng không đăng nhập vào Zalo, KakaoTalk… và không tự đọc tin nhắn. Bạn sao chép tin nhắn nhận được rồi dán vào đây để được dịch, phân tích và gợi ý trả lời.", "g1t": "Thêm người trò chuyện", "g1": "Mỗi người chỉ cần thêm một lần: biệt danh, ứng dụng nhắn tin, ngôn ngữ của họ. Ngày sinh, nhóm máu có thể điền sau.", "g2t": "Dán tin nhắn nhận được", "g2": "Nhấn giữ tin nhắn trong ứng dụng nhắn tin để sao chép → dán vào ô nhập của ứng dụng này. Có thể tải ảnh chụp màn hình. Bản dịch, giọng điệu, trò chuyện trước và lịch hẹn được sắp xếp ngay.", "g3t": "Trả lời bằng tiếng của bạn", "g3": "Viết bằng tiếng Việt hoặc chọn gợi ý; ứng dụng dịch sang ngôn ngữ của họ và tự sao chép. Quay lại ứng dụng nhắn tin, dán và gửi.", "g4t": "Trên PC dùng 2 màn hình", "g4": "Một màn hình mở Zalo, màn hình kia mở ứng dụng này. Đổi người ở danh sách bên phải, bản nháp vẫn được giữ.", "g_ai_t": "Dịch tự nhiên hơn (tùy chọn)", "g_ai": "Bản dịch cơ bản miễn phí. Thêm khóa OpenAI hoặc Claude để phân tích sắc thái và gợi ý trả lời tốt hơn nhiều.", "g_add": "Thêm người đầu tiên", "g_try": "Xem trò chuyện mẫu", "g_ai_btn": "Nhập khóa AI", "g_open_chat": "Mở trò chuyện", "g_note": "Cuộc trò chuyện được lưu trên thiết bị này; quản trị viên có thể xem trong phạm vi bạn đã đồng ý khi đăng ký.", "ai_steps_t": "Cách lấy khóa", "ai_s1": "Mở trang tạo khóa bằng nút bên dưới (cần đăng nhập).", "ai_s2": "Bấm “Create new secret key” và sao chép khóa.", "ai_s3": "Dán vào ô “Khóa API” bên dưới, lưu → bấm kiểm tra kết nối.", "ai_s4": "OpenAI cần thêm phương thức thanh toán (nạp ít tiền), tính phí theo mức dùng.", "ai_s4c": "Claude cần nạp tín dụng trong bảng điều khiển, tính phí theo mức dùng.", "ai_get_openai": "Mở trang khóa OpenAI", "ai_get_claude": "Mở trang khóa Claude"}, "en": {"nav_guide": "How to", "g_title": "How it works", "g_lead": "Language Magician never logs into KakaoTalk, WeChat or any messenger, and never reads your chats automatically. Copy a message you received, paste it here, and get a translation, analysis and reply ideas.", "g1t": "Add the person", "g1": "Once per person: nickname, which messenger, and their language. Birthday or blood type can come later.", "g2t": "Paste what they sent", "g2": "Long-press their message in your messenger to copy → paste it into this app’s chat box. Screenshots work too. Translation, tone, past chats and plans are sorted instantly.", "g3t": "Reply in your own words", "g3": "Write in English or pick a reply idea. It is translated into their language and copied. Go back to the messenger, paste and send.", "g4t": "On PC, use two screens", "g4": "Messenger on one screen, this app on the other. Switch people in the right-hand list; your drafts stay.", "g_ai_t": "More natural translation (optional)", "g_ai": "Basic translation is free. Add an OpenAI or Claude key for much better nuance analysis and reply ideas.", "g_add": "Add your first person", "g_try": "Try with sample chats", "g_ai_btn": "Add AI key", "g_open_chat": "Open chats", "g_note": "Chats are stored on this device; operators may view them for management within what you agreed to at sign-up.", "ai_steps_t": "How to get a key", "ai_s1": "Open the key page with the button below (sign-in required).", "ai_s2": "Click “Create new secret key” and copy the key.", "ai_s3": "Paste it into “API key” below, save, then press Test connection.", "ai_s4": "OpenAI needs a payment method (a small top-up); you pay only for what you use.", "ai_s4c": "Claude needs credits added in the console; you pay only for what you use.", "ai_get_openai": "Open OpenAI key page", "ai_get_claude": "Open Claude key page"}};
  Object.keys(GD_T).forEach((l) => Object.assign(T[l], GD_T[l]));
  const LR_T = {"ko": {"new_chat": "새 대화", "f_all": "전체", "sort_by": "정렬", "sort_recent": "최근 대화순", "sort_name": "이름순", "cal_today": "오늘", "cal_anniv": "기념일", "today_h": "오늘 할 일", "c_more": "더 아는 정보 (선택)", "c_more_hint": "몰라도 됩니다. 대화에 나오면 자동으로 채워져요.", "c_job": "직업", "c_city": "사는 곳", "learned_toast": "대화에서 알아냈어요", "learned_badge": "대화에서", "learned_hint": "상대가 보낸 메시지에서 자동으로 채운 정보예요. 직접 고치면 그 값이 우선합니다.", "learned_title": "대화로 알게 된 정보", "learned_none": "아직 없어요. 대화에서 나이·생일·혈액형·MBTI·직업·사는 곳이 나오면 자동으로 채워집니다."}, "zh": {"new_chat": "新对话", "f_all": "全部", "sort_by": "排序", "sort_recent": "最近", "sort_name": "按名字", "cal_today": "今天", "cal_anniv": "纪念日", "today_h": "今天的事", "c_more": "更多信息（可选）", "c_more_hint": "不知道也没关系，对话中出现时会自动填写。", "c_job": "职业", "c_city": "居住地", "learned_toast": "从对话中得知", "learned_badge": "来自对话", "learned_hint": "根据对方发来的消息自动填写。手动修改后以你的值为准。", "learned_title": "从对话中得知的信息", "learned_none": "暂时没有。对话中出现年龄、生日、血型、MBTI、职业、居住地时会自动填写。"}, "ja": {"new_chat": "新しい会話", "f_all": "すべて", "sort_by": "並び替え", "sort_recent": "最近", "sort_name": "名前順", "cal_today": "今日", "cal_anniv": "記念日", "today_h": "今日やること", "c_more": "分かっている情報（任意）", "c_more_hint": "分からなくてOK。会話に出てきたら自動で入ります。", "c_job": "職業", "c_city": "住んでいる所", "learned_toast": "会話から分かりました", "learned_badge": "会話から", "learned_hint": "相手のメッセージから自動で入力した情報です。手動で直すとその値が優先されます。", "learned_title": "会話で分かった情報", "learned_none": "まだありません。会話に年齢・誕生日・血液型・MBTI・職業・住んでいる所が出ると自動で入ります。"}, "vi": {"new_chat": "Trò chuyện mới", "f_all": "Tất cả", "sort_by": "Sắp xếp", "sort_recent": "Gần đây", "sort_name": "Theo tên", "cal_today": "Hôm nay", "cal_anniv": "Kỷ niệm", "today_h": "Việc hôm nay", "c_more": "Thông tin thêm (tùy chọn)", "c_more_hint": "Không biết cũng được. Sẽ tự điền khi xuất hiện trong trò chuyện.", "c_job": "Nghề nghiệp", "c_city": "Nơi sống", "learned_toast": "Biết được từ cuộc trò chuyện", "learned_badge": "Từ trò chuyện", "learned_hint": "Tự điền từ tin nhắn người ấy gửi. Nếu bạn sửa tay, giá trị của bạn được ưu tiên.", "learned_title": "Thông tin biết được từ trò chuyện", "learned_none": "Chưa có. Khi tuổi, sinh nhật, nhóm máu, MBTI, nghề, nơi sống xuất hiện trong trò chuyện, sẽ tự điền."}, "en": {"new_chat": "New chat", "f_all": "All", "sort_by": "Sort", "sort_recent": "Recent", "sort_name": "Name", "cal_today": "Today", "cal_anniv": "Anniversary", "today_h": "Today", "c_more": "More details (optional)", "c_more_hint": "No need to know now — filled in automatically when they come up in chat.", "c_job": "Job", "c_city": "Lives in", "learned_toast": "Learned from the chat", "learned_badge": "From chat", "learned_hint": "Filled in automatically from their messages. If you edit it, your value wins.", "learned_title": "Learned from chats", "learned_none": "Nothing yet. Age, birthday, blood type, MBTI, job and city are filled in automatically when they come up."}};
  Object.keys(LR_T).forEach((l) => Object.assign(T[l], LR_T[l]));
  const MEM_T = {"ko": {"mem_day": "이 날 기억", "mem_title": "날짜별 대화 기억", "mem_none": "아직 기억할 대화가 없어요. 대화를 붙여넣으면 하루 단위로 정리됩니다.", "mem_recent": "지난 대화 기억", "mem_ai": "AI 요약", "mem_basic": "기본 분석", "mem_sum": "대화 {n}개 (받은 말 {i} · 보낸 말 {o})", "mem_topics": "주제", "mem_q": "질문 {n}개", "ft_profile": "상대 정보", "ft_plan_date": "약속·날짜", "ft_like": "좋아함", "ft_dislike": "싫어함", "ft_worry": "고민·컨디션", "ft_family": "가족", "ft_pet": "반려동물", "ft_work": "일·학교", "ft_plan": "계획", "ft_other": "기타", "mem_refresh": "다시 분석"}, "zh": {"mem_day": "当天记忆", "mem_title": "按日期的对话记忆", "mem_none": "还没有可记住的对话。粘贴对话后会按天整理。", "mem_recent": "以前的对话记忆", "mem_ai": "AI 总结", "mem_basic": "基础分析", "mem_sum": "对话 {n} 条（收到 {i} · 发出 {o}）", "mem_topics": "话题", "mem_q": "提问 {n} 个", "ft_profile": "对方信息", "ft_plan_date": "约定·日期", "ft_like": "喜欢", "ft_dislike": "不喜欢", "ft_worry": "烦恼·状态", "ft_family": "家人", "ft_pet": "宠物", "ft_work": "工作·学校", "ft_plan": "计划", "ft_other": "其他", "mem_refresh": "重新分析"}, "ja": {"mem_day": "この日の記憶", "mem_title": "日付ごとの会話の記憶", "mem_none": "まだ覚えておく会話がありません。会話を貼り付けると1日ごとに整理します。", "mem_recent": "前の会話の記憶", "mem_ai": "AI要約", "mem_basic": "基本分析", "mem_sum": "会話 {n}件（届いた {i} · 送った {o}）", "mem_topics": "話題", "mem_q": "質問 {n}件", "ft_profile": "相手の情報", "ft_plan_date": "約束・日付", "ft_like": "好き", "ft_dislike": "苦手", "ft_worry": "悩み・体調", "ft_family": "家族", "ft_pet": "ペット", "ft_work": "仕事・学校", "ft_plan": "予定", "ft_other": "その他", "mem_refresh": "再分析"}, "vi": {"mem_day": "Ghi nhớ ngày này", "mem_title": "Ghi nhớ trò chuyện theo ngày", "mem_none": "Chưa có gì để ghi nhớ. Dán cuộc trò chuyện vào, ứng dụng sẽ sắp xếp theo ngày.", "mem_recent": "Ghi nhớ trò chuyện trước", "mem_ai": "AI tóm tắt", "mem_basic": "Phân tích cơ bản", "mem_sum": "{n} tin nhắn (nhận {i} · gửi {o})", "mem_topics": "Chủ đề", "mem_q": "{n} câu hỏi", "ft_profile": "Thông tin", "ft_plan_date": "Hẹn·ngày", "ft_like": "Thích", "ft_dislike": "Không thích", "ft_worry": "Lo lắng·sức khỏe", "ft_family": "Gia đình", "ft_pet": "Thú cưng", "ft_work": "Công việc·học", "ft_plan": "Kế hoạch", "ft_other": "Khác", "mem_refresh": "Phân tích lại"}, "en": {"mem_day": "Remembered from this day", "mem_title": "Chat memory by day", "mem_none": "Nothing to remember yet. Paste chats and they are organized day by day.", "mem_recent": "From past chats", "mem_ai": "AI summary", "mem_basic": "Basic analysis", "mem_sum": "{n} messages ({i} received · {o} sent)", "mem_topics": "Topics", "mem_q": "{n} questions", "ft_profile": "About them", "ft_plan_date": "Plan·date", "ft_like": "Likes", "ft_dislike": "Dislikes", "ft_worry": "Worries·health", "ft_family": "Family", "ft_pet": "Pets", "ft_work": "Work·school", "ft_plan": "Plans", "ft_other": "Other", "mem_refresh": "Re-analyze"}};
  Object.keys(MEM_T).forEach((l) => Object.assign(T[l], MEM_T[l]));
  const TONE_T = {"ko": {"tone_l": "말투", "emoji_l": "이모티콘", "t_basic": "기본", "t_polite": "정중하게", "t_friendly": "친근하게", "t_cute": "귀엽게·애교", "t_older": "오빠·언니에게", "t_younger": "동생에게", "t_sweet": "다정하게(연인)", "t_business": "비즈니스", "e_none": "안 씀", "e_some": "조금", "e_lots": "많이", "tone_ai_hint": "말투는 AI 연결 시 정확히 반영돼요", "lang_l": "언어"}, "zh": {"tone_l": "语气", "emoji_l": "表情", "t_basic": "默认", "t_polite": "礼貌", "t_friendly": "亲切", "t_cute": "可爱·撒娇", "t_older": "对哥哥·姐姐", "t_younger": "对弟弟·妹妹", "t_sweet": "温柔(恋人)", "t_business": "商务", "e_none": "不用", "e_some": "少量", "e_lots": "多", "tone_ai_hint": "连接 AI 后语气会准确体现", "lang_l": "语言"}, "ja": {"tone_l": "口調", "emoji_l": "絵文字", "t_basic": "標準", "t_polite": "丁寧に", "t_friendly": "親しみやすく", "t_cute": "かわいく・甘えて", "t_older": "年上へ", "t_younger": "年下へ", "t_sweet": "優しく(恋人)", "t_business": "ビジネス", "e_none": "なし", "e_some": "少し", "e_lots": "たくさん", "tone_ai_hint": "口調はAI接続時に正確に反映されます", "lang_l": "言語"}, "vi": {"tone_l": "Giọng điệu", "emoji_l": "Biểu tượng cảm xúc", "t_basic": "Mặc định", "t_polite": "Lịch sự", "t_friendly": "Thân thiện", "t_cute": "Dễ thương·nũng nịu", "t_older": "Với anh·chị", "t_younger": "Với em", "t_sweet": "Ngọt ngào (người yêu)", "t_business": "Công việc", "e_none": "Không", "e_some": "Ít", "e_lots": "Nhiều", "tone_ai_hint": "Giọng điệu được áp dụng chính xác khi kết nối AI", "lang_l": "Ngôn ngữ"}, "en": {"tone_l": "Tone", "emoji_l": "Emoji", "t_basic": "Default", "t_polite": "Polite", "t_friendly": "Friendly", "t_cute": "Cute·playful", "t_older": "To an older friend", "t_younger": "To a younger friend", "t_sweet": "Sweet (dating)", "t_business": "Business", "e_none": "None", "e_some": "A few", "e_lots": "Lots", "tone_ai_hint": "Tone is applied precisely when AI is connected", "lang_l": "Language"}};
  Object.keys(TONE_T).forEach((l) => Object.assign(T[l], TONE_T[l]));
  const TONES = ['basic', 'polite', 'friendly', 'cute', 'older', 'younger', 'sweet', 'business'];
  const TONE6 = ['polite', 'friendly', 'cute', 'older', 'sweet', 'business'];
  // AI 없이: 한국어 기본 답장을 말투별로 바꾸기 (간단 규칙)
  function ageOf(c) { if (!c) return null; const a = Number(c.age); if (a > 0 && a < 120) return a; const by = Number(c.birthYear || (c.birthday && String(c.birthday).slice(0, 4))); if (by > 1900) return new Date().getFullYear() - by; return null; }
  // 상대 나이대에 맞춘 한국어 말투 (AI 없이 쓰는 규칙)
  function koAge(x, age) {
    if (!age || !x) return x;
    if (age <= 29) return x.replace(/([가-힣])요([!?~]?)(\s*[😊💕]?)$/u, '$1욤$2$3').replace(/알겠어요|알았어요/g, '알았어욤').replace(/그래요(?=[\s.!?~]|$)/g, '그래욤').replace(/좋아요(?=[\s.!?~]|$)/g, '좋아욤').replace(/고마워요/g, '고마워용').replace(/네,\s*/g, 'ㅇㅇ ').replace(/^와,?\s*/, '헐 ').replace(/진짜요\?/g, '앗 진짜요?');
    if (age >= 50) return x.replace(/ㅎㅎ\s*|ㅋㅋ+\s*/g, '').replace(/[😊💕✨🥰🙈😄👍🙌]/gu, '').replace(/~/g, '').trim();
    return x;
  }
  function koTone(src, k) {
    let x = String(src || '').trim();
    const casual = (y) => y.replace(/그쪽은/g, '너는').replace(/당신은요\?/g, '너는?').replace(/당신/g, '너').replace(/그렇군요/g, '그렇구나').replace(/저는/g, '나는').replace(/제가/g, '내가').replace(/저도/g, '나도').replace(/습니다([.!?]?)/g, '어$1').replace(/입니다([.!?]?)/g, '이야$1').replace(/드릴게요/g, '줄게').replace(/할게요/g, '할게').replace(/에요(?=[\s.!?~,]|$)/g, '야').replace(/예요(?=[\s.!?~,]|$)/g, '야').replace(/하세요(?=[\s.!?~,]|$)/g, '해').replace(/([가-힣])요(?=[\s.!?~,😊💕]|$)/gu, '$1');
    const formal = (y) => y.replace(/할게요/g, '하겠습니다').replace(/드릴게요/g, '드리겠습니다').replace(/줄게요/g, '드리겠습니다').replace(/해요(?=[.!?]|$)/g, '합니다').replace(/좋아요/g, '좋습니다').replace(/고마워요/g, '감사합니다').replace(/괜찮아요/g, '괜찮습니다').replace(/ㅎㅎ\s*/g, '').replace(/[😊💕✨🥰]/gu, '').trim();
    if (k === 'polite') return x.replace(/당신은요\?/g, '그쪽은요?').replace(/당신/g, '그쪽');
    if (k === 'friendly') return casual(x);
    if (k === 'cute') { const y = casual(x).replace(/\s*[😊💕]\s*$/u, ''); return (/[!?]$/.test(y) ? y.slice(0, -1) + '~' + y.slice(-1) : y.replace(/\.$/, '') + '~') + ' 😊'; }
    if (k === 'older') return casual(x).replace(/^/, '오빠~ ').replace(/([.!?]?)$/, '$1') ;
    if (k === 'sweet') return casual(x) + ' 💕';
    if (k === 'business') return formal(x);
    return x;
  }
  const TONE_PROMPT = {
    basic: '', polite: 'polite and respectful',
    friendly: 'casual and friendly, like close friends',
    cute: 'cute, playful and affectionate (aegyo); in Chinese use soft particles like 呀/啦/嘛, in Japanese soft endings like 〜だよ/〜ね, in Korean cute endings like ~용/~당',
    older: 'speaking to an older friend affectionately (in Korean call them 오빠/언니 naturally, in Chinese 哥哥/姐姐, in Japanese お兄ちゃん/お姉ちゃん only if natural), warm and slightly cute',
    younger: 'speaking to a younger friend, caring and relaxed',
    sweet: 'warm, sweet and romantic but not excessive',
    business: 'professional, concise and courteous business tone',
  };
  const EMO = { cute: ['🥰', '😊', '💕', '✨', '🙈'], sweet: ['❤️', '😊', '🌙', '💕'], friendly: ['😄', '👍', '🙌', '😊'], older: ['😊', '🥺', '💕'], younger: ['😊', '👍', '🙂'], basic: ['😊', '🙂'], polite: ['🙂', '🙏'], business: [''] };
  function toneCtx(c) { const tn = (c && c.tone) || chatState.tone || 'basic'; const em = (c && c.emoji) || chatState.emoji || 'none'; return { tone: [TONE_PROMPT[tn], em === 'lots' ? 'use several fitting emoji' : em === 'some' ? 'add one fitting emoji' : 'no emoji unless already in the text'].filter(Boolean).join('; '), toneKey: tn, emoji: em, relation: c ? c.relation : '' }; }
  function applyEmoji(text, ctx) {
    if (!ctx || ctx.emoji === 'none' || !text) return text;
    if (/\p{Extended_Pictographic}/u.test(text) && ctx.emoji === 'some') return text;
    const pool = EMO[ctx.toneKey] || EMO.basic; if (!pool[0]) return text;
    const n = ctx.emoji === 'lots' ? 2 : 1; let add = ''; for (let i = 0; i < n; i++) add += pool[(text.length + i * 3) % pool.length];
    return text.replace(/[\s]+$/, '') + ' ' + add;
  }
  const PIN_T = {"ko": {"pin": "상단 고정", "unpin": "고정 해제", "star_l": "관심도", "f_star": "관심", "sort_star": "관심도순", "dbl_hint": "이름을 두 번 누르면 상대 정보가 열려요"}, "zh": {"pin": "置顶", "unpin": "取消置顶", "star_l": "关注度", "f_star": "关注", "sort_star": "按关注度", "dbl_hint": "双击名字打开对方信息"}, "ja": {"pin": "上に固定", "unpin": "固定を解除", "star_l": "関心度", "f_star": "注目", "sort_star": "関心度順", "dbl_hint": "名前をダブルクリックで相手の情報"}, "vi": {"pin": "Ghim lên đầu", "unpin": "Bỏ ghim", "star_l": "Mức quan tâm", "f_star": "Quan tâm", "sort_star": "Theo mức quan tâm", "dbl_hint": "Nhấn đúp tên để mở thông tin"}, "en": {"pin": "Pin to top", "unpin": "Unpin", "star_l": "Interest", "f_star": "Starred", "sort_star": "Interest", "dbl_hint": "Double-click a name to open their info"}};
  Object.keys(PIN_T).forEach((l) => Object.assign(T[l], PIN_T[l]));
  function starsHtml(c, interactive) { const n = c.star || 0; return `<span class="stars" aria-label="${esc(t('star_l'))} ${n}/3">${[1, 2, 3].map((i) => interactive ? `<button type="button" class="star ${i <= n ? 'on' : ''}" data-star="${c.id}|${i}" title="${esc(t('star_l'))} ${i}">★</button>` : `<i class="star ${i <= n ? 'on' : ''}">★</i>`).join('')}</span>`; }
  const TOOL_T = {"ko": {"nav_anniv": "기념일", "nav_coach": "관계 조언", "nav_saju": "사주·궁합", "nav_gift": "선물", "nav_culture": "문화", "nav_tools": "도구", "tools_title": "도구", "tools_lead": "상대를 더 잘 알고, 더 잘 챙기기 위한 기능이에요.", "tl_coach": "단계별로 다음에 할 말과 피할 말", "tl_saju": "사주·띠·별자리·혈액형·MBTI 궁합", "tl_gift": "날에 맞는 선물과 축하 문구", "tl_culture": "나라별 호칭·예절·금기와 예문", "tl_anniv": "생일·만난 날·기념일 한눈에", "tl_agenda": "달력·약속·오늘 할 일", "quick_tools": "바로가기"}, "zh": {"nav_anniv": "纪念日", "nav_coach": "关系建议", "nav_saju": "四柱·合盘", "nav_gift": "礼物", "nav_culture": "文化", "nav_tools": "工具", "tools_title": "工具", "tools_lead": "更了解对方、更好地关心对方的功能。", "tl_coach": "分阶段告诉你该说什么、避免什么", "tl_saju": "四柱·生肖·星座·血型·MBTI 合盘", "tl_gift": "适合日子的礼物和祝福语", "tl_culture": "各国称呼·礼仪·禁忌和例句", "tl_anniv": "生日·认识的日子·纪念日一目了然", "tl_agenda": "日历·约定·今天的事", "quick_tools": "快捷入口"}, "ja": {"nav_anniv": "記念日", "nav_coach": "関係アドバイス", "nav_saju": "四柱推命・相性", "nav_gift": "プレゼント", "nav_culture": "文化", "nav_tools": "ツール", "tools_title": "ツール", "tools_lead": "相手をもっと知り、もっと大切にするための機能です。", "tl_coach": "段階ごとに言うこと・避けること", "tl_saju": "四柱推命・干支・星座・血液型・MBTIの相性", "tl_gift": "日に合うプレゼントとお祝いの言葉", "tl_culture": "国ごとの呼び方・マナー・タブーと例文", "tl_anniv": "誕生日・出会った日・記念日をひと目で", "tl_agenda": "カレンダー・約束・今日やること", "quick_tools": "ショートカット"}, "vi": {"nav_anniv": "Kỷ niệm", "nav_coach": "Tư vấn", "nav_saju": "Tứ trụ·hợp tuổi", "nav_gift": "Quà tặng", "nav_culture": "Văn hóa", "nav_tools": "Công cụ", "tools_title": "Công cụ", "tools_lead": "Các tính năng giúp hiểu và quan tâm người ấy tốt hơn.", "tl_coach": "Nên nói gì, tránh gì theo từng giai đoạn", "tl_saju": "Hợp tuổi theo tứ trụ·con giáp·cung·nhóm máu·MBTI", "tl_gift": "Quà và lời chúc hợp từng dịp", "tl_culture": "Xưng hô·lễ nghi·kiêng kỵ và câu mẫu theo nước", "tl_anniv": "Sinh nhật·ngày quen·kỷ niệm", "tl_agenda": "Lịch·hẹn·việc hôm nay", "quick_tools": "Lối tắt"}, "en": {"nav_anniv": "Dates", "nav_coach": "Coaching", "nav_saju": "Saju·match", "nav_gift": "Gifts", "nav_culture": "Culture", "nav_tools": "Tools", "tools_title": "Tools", "tools_lead": "Features to know them better and care for them well.", "tl_coach": "What to say and avoid at each stage", "tl_saju": "Saju, zodiac, star sign, blood type, MBTI match", "tl_gift": "Gifts and messages for each occasion", "tl_culture": "Forms of address, etiquette, taboos and examples", "tl_anniv": "Birthdays, the day you met, anniversaries", "tl_agenda": "Calendar, plans, today", "quick_tools": "Shortcuts"}};
  Object.keys(TOOL_T).forEach((l) => Object.assign(T[l], TOOL_T[l]));
  const JUNK_T = { ko: { junk_input: '자음·모음만 있어서 뜻을 알 수 없어요. 문장으로 써 주세요. (ㅋㅋ·ㅇㅋ·ㄱㅅ 같은 줄임말은 번역돼요)' }, zh: { junk_input: '只有韩文字母，无法理解意思。请输入完整的句子。' }, ja: { junk_input: '子音・母音だけでは意味がわかりません。文章で入力してください。' }, vi: { junk_input: 'Chỉ có phụ âm/nguyên âm nên không hiểu nghĩa. Hãy nhập thành câu.' }, en: { junk_input: 'Only loose Korean letters — the meaning is unclear. Please type a sentence.' } };
  Object.keys(JUNK_T).forEach((l) => Object.assign(T[l], JUNK_T[l]));
  const POP_T = { ko: { pop_short: '새 창', pop_open: '새 창으로 열기 (메신저 옆에 띄워 두기)', pop_main: '메인 창으로', pop_blocked: '팝업이 막혔어요. 주소창 오른쪽에서 팝업을 허용해 주세요.', pop_hint: '대화마다 새 창으로 띄워 메신저 옆에 두고 쓸 수 있어요' }, zh: { pop_short: '新窗口', pop_open: '在新窗口打开（放在聊天软件旁边）', pop_main: '回到主窗口', pop_blocked: '弹出窗口被拦截，请在地址栏右侧允许弹出窗口。', pop_hint: '每个对话都可以单独开窗口，放在聊天软件旁边用' }, ja: { pop_short: '別ウィンドウ', pop_open: '新しいウィンドウで開く（メッセンジャーの横に置く）', pop_main: 'メイン画面へ', pop_blocked: 'ポップアップがブロックされました。アドレスバー右側で許可してください。', pop_hint: '会話ごとに別ウィンドウで開き、メッセンジャーの横に置けます' }, vi: { pop_short: 'Cửa sổ mới', pop_open: 'Mở cửa sổ mới (đặt cạnh ứng dụng chat)', pop_main: 'Về cửa sổ chính', pop_blocked: 'Cửa sổ bật lên bị chặn. Hãy cho phép ở bên phải thanh địa chỉ.', pop_hint: 'Mỗi cuộc trò chuyện có thể mở cửa sổ riêng, đặt cạnh ứng dụng chat' }, en: { pop_short: 'New window', pop_open: 'Open in a new window (keep it next to your messenger)', pop_main: 'Back to main window', pop_blocked: 'Pop-up blocked. Allow pop-ups from the right side of the address bar.', pop_hint: 'Open each chat in its own window next to your messenger' } };
  Object.keys(POP_T).forEach((l) => Object.assign(T[l], POP_T[l]));
  const MODE_T = {
    ko: { lp_note: '내 언어 = 내 화면·번역·추천 언어 · 상대 언어 = 보낼 말을 번역할 언어', mode_in: '받은 말 넣기', mode_out: '보낼 말 쓰기', lbl_in: '📥 {who} → 나 · 받은 말을 붙여넣으세요 ({lang})', lbl_out: '📤 나 → {who} · 보낼 말을 {my}로 쓰세요 ({lang}로 번역)', lbl_out_same: '📤 나 → {who} · 보낼 말을 쓰세요 (같은 언어라 번역 없이 기록·정리)', lbl_auto: '{who} · 받은 말을 붙여넣거나, 보낼 말을 쓰세요 (언어로 자동 구분)', ph_in: '상대가 보낸 {lang} 메시지를 붙여넣기 · 스크린샷은 Ctrl+V', ph_out: '보낼 말을 {my}로 쓰세요', lp_title: '대화 언어 바꾸기', lp_their: '상대 언어', lp_my: '내 언어', lp_saved: '대화 언어: {a} ↔ {b}' },
    zh: { lp_note: '我的语言 = 我的界面·翻译·建议语言 · 对方语言 = 发出去的话翻译成的语言', mode_in: '添加收到的话', mode_out: '写要发的话', lbl_in: '📥 粘贴{who}发来的话（{lang}）', lbl_out: '📤 用{my}写给{who}的话 → 翻译成{lang}', lbl_out_same: '📤 写给{who}的话（同一语言，不翻译只记录）', lbl_auto: '{who} · 粘贴收到的话或写要发的话（按语言自动区分）', ph_in: '粘贴对方发来的{lang}消息 · 截图按 Ctrl+V', ph_out: '用{my}写要发的话', lp_title: '更改对话语言', lp_their: '对方语言', lp_my: '我的语言', lp_saved: '对话语言：{a} ↔ {b}' },
    ja: { lp_note: '自分の言語 = 画面・翻訳・返信案の言語 · 相手の言語 = 送る言葉の翻訳先', mode_in: '届いた言葉を入れる', mode_out: '送る言葉を書く', lbl_in: '📥 {who}から届いた言葉を貼り付け（{lang}）', lbl_out: '📤 {who}に送る言葉を{my}で書く → {lang}に翻訳', lbl_out_same: '📤 {who}に送る言葉を書く（同じ言語なので翻訳せず記録）', lbl_auto: '{who} · 届いた言葉を貼るか、送る言葉を書く（言語で自動判別）', ph_in: '相手の{lang}メッセージを貼り付け · スクショは Ctrl+V', ph_out: '送る言葉を{my}で書いてください', lp_title: '会話の言語を変更', lp_their: '相手の言語', lp_my: '自分の言語', lp_saved: '会話の言語：{a} ↔ {b}' },
    vi: { lp_note: 'Ngôn ngữ của tôi = giao diện·bản dịch·gợi ý · Ngôn ngữ của họ = ngôn ngữ dịch tin gửi đi', mode_in: 'Thêm tin nhận được', mode_out: 'Viết tin sẽ gửi', lbl_in: '📥 Dán tin {who} gửi ({lang})', lbl_out: '📤 Viết tin gửi {who} bằng {my} → dịch sang {lang}', lbl_out_same: '📤 Viết tin gửi {who} (cùng ngôn ngữ, chỉ ghi lại)', lbl_auto: '{who} · Dán tin nhận được hoặc viết tin sẽ gửi (tự nhận theo ngôn ngữ)', ph_in: 'Dán tin {lang} họ gửi · ảnh chụp bấm Ctrl+V', ph_out: 'Viết tin bằng {my}', lp_title: 'Đổi ngôn ngữ trò chuyện', lp_their: 'Ngôn ngữ của họ', lp_my: 'Ngôn ngữ của tôi', lp_saved: 'Ngôn ngữ: {a} ↔ {b}' },
    en: { lp_note: 'My language = your screen, translations and ideas · Their language = what your messages are translated into', mode_in: 'Add received', mode_out: 'Write to send', lbl_in: '📥 Paste what {who} sent ({lang})', lbl_out: '📤 Write to {who} in {my} → translated to {lang}', lbl_out_same: '📤 Write to {who} (same language — saved without translation)', lbl_auto: '{who} · Paste a received message or write one to send (auto by language)', ph_in: 'Paste their {lang} message · Ctrl+V for screenshots', ph_out: 'Write your message in {my}', lp_title: 'Change chat languages', lp_their: 'Their language', lp_my: 'My language', lp_saved: 'Chat languages: {a} ↔ {b}' },
  };
  Object.keys(MODE_T).forEach((l) => Object.assign(T[l], MODE_T[l]));
  const WR_T = {
    ko: { wr_name: '여기는 {room} 방입니다. {other}의 이름이 들어 있어요. 다른 사람에게 보낼 글 아닌가요?', wr_lang: '여기는 {room} 방({rl})인데 {lang} 메시지예요. {other} 님이 보낸 말 아닌가요?', wr_dup: '같은 메시지가 {other} 방에 이미 있어요. 여기는 {room} 방입니다.', wr_move: '{other} 방으로 옮기기', wr_ok: '{room} 방이 맞아요' },
    zh: { wr_name: '这里是{room}的对话。内容里有{other}的名字，是不是要发给别人？', wr_lang: '这里是{room}的对话（{rl}），但这是{lang}消息。是不是{other}发来的？', wr_dup: '同样的消息已在{other}的对话里。这里是{room}的对话。', wr_move: '移到{other}的对话', wr_ok: '就是{room}' },
    ja: { wr_name: 'ここは{room}さんのトークです。{other}さんの名前が入っています。別の人宛てではありませんか？', wr_lang: 'ここは{room}さんのトーク（{rl}）ですが、{lang}のメッセージです。{other}さんからではありませんか？', wr_dup: '同じメッセージが{other}さんのトークにあります。ここは{room}さんのトークです。', wr_move: '{other}さんのトークへ移す', wr_ok: '{room}さんで合っています' },
    vi: { wr_name: 'Đây là phòng của {room}. Có tên {other} trong nội dung. Có phải gửi cho người khác không?', wr_lang: 'Đây là phòng của {room} ({rl}) nhưng tin nhắn là {lang}. Có phải {other} gửi không?', wr_dup: 'Tin nhắn này đã có trong phòng {other}. Đây là phòng {room}.', wr_move: 'Chuyển sang phòng {other}', wr_ok: 'Đúng là {room}' },
    en: { wr_name: "This is {room}'s chat, but it mentions {other}. Was this meant for someone else?", wr_lang: "This is {room}'s chat ({rl}), but the message is in {lang}. Did {other} send it?", wr_dup: "The same message is already in {other}'s chat. This is {room}'s chat.", wr_move: "Move to {other}'s chat", wr_ok: "Yes, it's {room}" },
  };
  Object.keys(WR_T).forEach((l) => Object.assign(T[l], WR_T[l]));
  const AUTO_T = {
    ko: { auto_added: '대화에서 할 일·약속 {n}건을 자동으로 정리해 일정에 넣었어요', dup_promise: '이미 같은 일정이 있어요', auto_badge: 'AI 자동', auto_l: '3시간마다 대화를 훑어 할 일·약속 자동 정리', auto_now: '지금 정리하기', auto_last: '마지막 정리 {t}' },
    zh: { auto_added: '已从对话中自动整理 {n} 项待办·约定并加入日程', dup_promise: '已有相同的日程', auto_badge: 'AI 自动', auto_l: '每3小时扫描对话，自动整理待办·约定', auto_now: '现在整理', auto_last: '上次整理 {t}' },
    ja: { auto_added: '会話からやること・約束を{n}件自動で予定に追加しました', dup_promise: '同じ予定がすでにあります', auto_badge: 'AI自動', auto_l: '3時間ごとに会話を確認してやること・約束を自動整理', auto_now: '今すぐ整理', auto_last: '前回の整理 {t}' },
    vi: { auto_added: 'Đã tự động thêm {n} việc/lịch hẹn từ cuộc trò chuyện vào lịch', dup_promise: 'Lịch này đã có', auto_badge: 'AI tự động', auto_l: 'Mỗi 3 giờ quét trò chuyện và tự sắp xếp việc cần làm·lịch hẹn', auto_now: 'Sắp xếp ngay', auto_last: 'Lần cuối {t}' },
    en: { auto_added: 'Added {n} to-do(s)/plan(s) from your chats to the agenda', dup_promise: 'That plan is already there', auto_badge: 'AI auto', auto_l: 'Scan chats every 3 hours and add to-dos & plans automatically', auto_now: 'Organize now', auto_last: 'Last run {t}' },
  };
  Object.keys(AUTO_T).forEach((l) => Object.assign(T[l], AUTO_T[l]));
  Object.keys({"ko": "대화 {n}개를 가져왔어요", "zh": "已导入 {n} 条对话", "ja": "会話を{n}件取り込みました", "vi": "Đã nhập {n} tin nhắn", "en": "Imported {n} messages"}).forEach(() => {}); [['ko', '대화 {n}개를 가져왔어요'],['zh', '已导入 {n} 条对话'],['ja', '会話を{n}件取り込みました'],['vi', 'Đã nhập {n} tin nhắn'],['en', 'Imported {n} messages']].forEach(([l, v]) => { T[l].imported_n = v; });
  [['ko', '열기', '접기'],['zh', '展开', '收起'],['ja', '開く', '閉じる'],['vi', 'Mở', 'Thu gọn'],['en', 'Open', 'Close']].forEach(([l, a, b]) => { T[l].open_l = a; T[l].close_l = b; });
  const chatState = { dirOverride: null, draft: {}, open: {}, limit: 40, needOnly: false, prepared: {}, auto: {}, infoOpen: true, tone: 'basic', emoji: 'none' };

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
        ${c ? `${avatar(c)}<div class="grow" style="min-width:0"><h1 class="ellipsis">${appBadge(c.app)} <span lang="${esc(c.lang)}">${esc(c.nickname)}</span></h1><small class="muted ellipsis" style="display:block"><button type="button" class="lang-pair-btn" id="ch-lang" title="${esc(t('lp_title'))}">${esc(t('lang_pair', { a: langUi(myL(c)), b: langUi(c.lang) }))} ▾</button> · ${esc(t('thread_count', { n: ms.length }))}</small></div>` : `<h1>${t('chat_none')}</h1>`}</div>
        <div class="row" style="gap:6px;flex-wrap:nowrap;flex:0 0 auto">${statusBadge(st)}${c && POP ? `<button class="icon-btn" type="button" id="pop-main" title="${esc(t('pop_main'))}" aria-label="${esc(t('pop_main'))}">⤢</button>` : ''}${c && !POP && WIDE.matches ? `<button class="pop-btn" type="button" data-pop="${c.id}" title="${esc(t('pop_open'))}" aria-label="${esc(t('pop_open'))}">↗ ${esc(t('pop_short'))}</button>` : ''}${c && !POP ? `<button class="icon-btn" type="button" data-go="#/coach/${c.id}" aria-label="${t('coach_link')}" title="${esc(t('coach_link'))}">💡</button><button class="icon-btn ${WIDE.matches && chatState.infoOpen ? 'on' : ''}" type="button" ${WIDE.matches ? 'id="ch-info-btn"' : `data-go="#/contact/${c.id}"`} aria-label="${t('contact_info')}" title="${esc(t('contact_info'))}" aria-pressed="${WIDE.matches && !!chatState.infoOpen}">${icon('person')}</button>` : ''}</div></header>
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
        ${c ? `<div class="lp-row" id="lp-pop"><label class="lp-f"><span>${t('lp_my')}</span><select class="field sel-sm" id="lp-my">${Object.keys(Engine.LANGS).map((l) => `<option value="${l}" ${l === myL(c) ? 'selected' : ''}>${esc(langName(l))}</option>`).join('')}</select></label><span class="lp-arrow">⇄</span><label class="lp-f"><span>${t('lp_their')}</span><select class="field sel-sm" id="lp-their">${Object.keys(Engine.LANGS).map((l) => `<option value="${l}" ${l === c.lang ? 'selected' : ''}>${esc(langName(l))}</option>`).join('')}</select></label><span class="tiny muted lp-note">${t('lp_note')}</span></div>` : ''}
        <div class="mode-seg" role="radiogroup" aria-label="${esc(t('dir_label'))}">
          <button type="button" class="mode-btn mode-in" data-mode="in" role="radio"><span>📥 <b>${t('mode_in')}</b></span><small>${esc(langUi(target))} → ${esc(langUi(myL(c)))}</small></button>
          <button type="button" class="mode-btn mode-out" data-mode="out" role="radio"><span>📤 <b>${t('mode_out')}</b></span><small>${esc(langUi(myL(c)))} → ${esc(langUi(target))}</small></button>
          <button type="button" class="mode-btn mode-auto" data-mode="" role="radio">${t('dir_auto')}</button>
          <select id="ch-dir" hidden><option value=""></option><option value="in"></option><option value="out"></option></select>
        </div>
        <span class="badge gray" id="ch-det" hidden>${t('smart_hint')}</span>
        <div class="tools tone-row"><div class="row wrap" style="gap:6px 10px">
          <label class="tiny muted" for="ch-tone">${t('tone_l')}</label><select class="field sel-sm" id="ch-tone">${TONES.map((k) => `<option value="${k}" ${((c && c.tone) || chatState.tone) === k ? 'selected' : ''}>${esc(t('t_' + k))}</option>`).join('')}</select>
          <label class="tiny muted" for="ch-emoji">${t('emoji_l')}</label><select class="field sel-sm" id="ch-emoji">${['none', 'some', 'lots'].map((k) => `<option value="${k}" ${((c && c.emoji) || chatState.emoji) === k ? 'selected' : ''}>${esc(t('e_' + k))}</option>`).join('')}</select>
          ${ai ? '' : `<span class="tiny muted">${t('tone_ai_hint')}</span>`}</div></div>
        <label class="tiny" for="ch-input" id="ch-input-l" style="font-weight:700"></label>
        <textarea class="field" id="ch-input" rows="2" placeholder="${esc(t('smart_ph'))}">${esc(draft)}</textarea>
        <div class="tools">
          <div class="row wrap" style="gap:2px 14px">
            <button class="link" type="button" id="ch-paste" style="min-height:32px;font-size:13px">${icon('copy', 'sm')} ${t('paste_btn')}</button>
            <label class="link" style="cursor:pointer;min-height:32px;font-size:13px">${icon('image', 'sm')} ${t('upload_shot')}<input type="file" id="ch-shot" accept="image/*" hidden></label>
            ${ai ? `<span class="tiny muted">${t('ai_on')}</span>` : `<button class="link" type="button" data-go="#/settings" style="min-height:32px;font-size:13px">${t('ai_upsell')}</button>`}
          </div>
          <button class="btn primary-btn" type="button" id="ch-send">${t('send')}</button>
        </div>
        <p class="tiny muted" id="h-ocr" hidden></p>
      </div></div>`, 'chat');
    if (!WIDE.matches) { const bn = $app.querySelector('nav.bottom'); if (bn) bn.remove(); }
    if (c && lastIn && lastIn.analysis && (lastIn.analysis.ui || 'ko') !== uiLang && !chatState.auto[lastIn.id + uiLang]) { lastIn.analysis = null; }
    if (c && lastIn && !lastIn.analysis && !chatState.auto[lastIn.id + uiLang] && ms[ms.length - 1] === lastIn) {
      chatState.auto[lastIn.id + uiLang] = true;
      analyzeExisting(c, lastIn).then((res) => { const mm = Store.me().messages.find((x) => x.id === lastIn.id); if (mm) { mm.analysis = slimAnalysis(res); Store.save(); } if (helperState.contactId === c.id && /^#\/(chat|home)?/.test(location.hash || '#/')) renderChat({ id: c.id }); }).catch(() => {});
    }
    bindChat(c, id, target);
    const th = document.getElementById('thread');
    if (th && th.lastElementChild) requestAnimationFrame(() => { const mn = document.querySelector('.ws-main'); if (mn) mn.scrollTop = mn.scrollHeight; else { window.scrollTo(0, document.documentElement.scrollHeight); } });
  }

  /* 화면 언어가 바뀌면 번역 줄도 그 언어로 다시 보여줍니다 (원문은 그대로). */
  const trQueue = new Set(); let trTimer = null;
  function viewTr(m, src, srcLang) {
    if (!src) return '';
    if (srcLang === uiLang) return src;
    m.trs = m.trs || {};
    const key = uiLang + '|' + (m.dir === 'in' ? 'in' : 'out');
    if (m.trs[key]) return m.trs[key];
    const qk = m.id + '|' + key;
    if (!trQueue.has(qk)) {
      trQueue.add(qk);
      Engine.translate(src, uiLang, srcLang).then((r) => { m.trs[key] = r.text; Store.save(); clearTimeout(trTimer); trTimer = setTimeout(() => { if (/^#\/(chat|home)?/.test(location.hash || '#/')) renderChat({ id: helperState.contactId }); }, 250); }).catch(() => {}).finally(() => trQueue.delete(qk));
    }
    return '…';
  }
  function bubbleHtml(c, m, isLatestIn) {
    const a = m.analysis;
    const risk = m.risk && m.risk.length;
    const hm = (ts) => { const d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
    if (m.dir === 'out') {
      const tl = langUi(m.trLang || (c && c.lang) || '');
      return `<article class="entry mine" data-mid="${m.id}"><div class="meta"><strong>${t('me_reply')}</strong><time>${hm(m.ts)}</time>${m.sent ? statusBadge('done') : statusBadge('copied')}</div>
        <div class="bubble out"><p lang="${esc(m.trLang)}" class="b-main">${esc(m.translation || m.text)}</p>
        ${m.translation ? (() => { const v = (m.trLang === uiLang) ? '' : (m.lang === uiLang ? m.text : viewTr(m, m.translation, m.trLang)); return v ? `<p class="meaning" lang="${esc(uiLang)}">${esc(v)}</p>` : ''; })() : ''}
        <div class="b-acts">${m.translation ? `<button class="btn sm secondary" type="button" data-copy-msg="${m.id}">${icon('copy', 'sm')} ${esc(t('copy_lang', { lang: tl }))}</button>` : ''}${m.sent ? '' : `<button class="btn sm ghost" type="button" data-sent="${m.id}">✓ ${t('mark_sent')}</button>`}</div></div></article>`;
    }
    const open = chatState.open[m.id] !== undefined ? chatState.open[m.id] : (isLatestIn && !!a);
    const isNew = isLatestIn && Date.now() - m.ts < 30 * 60000 && !a;
    return `<article class="entry" data-mid="${m.id}"><div class="meta"><strong lang="${esc(c ? c.lang : '')}">${c ? esc(c.nickname) : '?'}</strong><time>${hm(m.ts)}</time>${isNew ? statusBadge('new') : ''}${risk ? `<span class="badge alert">⚠ ${m.risk.includes('money') ? t('risk_money') : t('risk_off')}</span>` : ''}</div>
      <div class="bubble in ${risk ? 'risk' : ''}"><p lang="${esc(m.lang)}" class="b-main">${esc(m.text)}</p>
        ${(() => { const v = m.lang === uiLang ? '' : (m.trLang === uiLang ? m.translation : viewTr(m, m.text, m.lang)); return v ? `<p class="meaning" lang="${esc(uiLang)}">${esc(v)}</p>` : ''; })()}
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
      <div class="sug-grid">${(a.replies || []).slice(0, 6).map((rp, i) => `<div class="sug-card ${m.chosen === rp.text ? 'on' : ''}">
        <button type="button" class="sug-pick" data-edit="${m.id}|${i}"><strong>${esc(rp.label)}</strong><span>${esc(rp.meaning || '')}</span>${rp.text && rp.text !== rp.meaning ? `<small lang="${esc(a.target)}">${esc(rp.text)}</small>` : ''}</button>
        <button type="button" class="sug-copy" data-use="${m.id}|${i}" title="${esc(t('use_reply'))}">${icon('copy', 'sm')} ${t('use_reply')}</button></div>`).join('')}</div>
      ${m.risk && m.risk.length ? `<button class="btn danger-btn sm" type="button" data-report="${m.id}">${t('c_report')}</button>` : ''}
    </div>`;
  }

  /* 다른 사람 방에 잘못 붙였는지 감지: 다른 상대 이름 / 다른 상대 언어 / 다른 방에 이미 있는 문장 */
  function wrongRoom(c, text, dir) {
    if (!c || !text) return null;
    const u = Store.me(); const others = u.contacts.filter((x) => x.id !== c.id);
    const low = text.toLowerCase();
    const nameToks = (x) => String(x.nickname || '').split(/[\s·,/()]+/).filter((w) => w.length >= 2);
    const hasName = (x) => nameToks(x).some((w) => low.includes(w.toLowerCase()));
    if (!hasName(c)) {
      const hit = others.find(hasName);
      if (hit) return { kind: 'name', other: hit };
    }
    if (dir === 'in') {
      const L = Engine.detect(text);
      if (L && L !== c.lang && L !== myL(c)) { const hit = others.find((x) => x.lang === L); if (hit) return { kind: 'lang', other: hit, lang: L }; }
      const t2 = text.trim();
      if (t2.length >= 6) { const hit = others.find((x) => Store.messagesOf(x.id, u).some((m) => m.dir === 'in' && m.text.trim() === t2)); if (hit) return { kind: 'dup', other: hit }; }
    }
    return null;
  }
  function wrongRoomHtml(c, w) {
    const msg = w.kind === 'name' ? t('wr_name', { room: c.nickname, other: w.other.nickname }) : w.kind === 'lang' ? t('wr_lang', { room: c.nickname, rl: langUi(c.lang), lang: langUi(w.lang), other: w.other.nickname }) : t('wr_dup', { room: c.nickname, other: w.other.nickname });
    return `<div class="wr-box" id="wr-box" role="alert"><p>⚠ ${esc(msg)}</p><div class="row wrap" style="gap:6px"><button class="btn sm" type="button" id="wr-move" data-to="${w.other.id}">${esc(t('wr_move', { other: w.other.nickname }))}</button><button class="btn sm secondary" type="button" id="wr-ok">${esc(t('wr_ok', { room: c.nickname }))}</button></div></div>`;
  }

  function detectDir(text, override, c) {
    if (override) return override;
    if (!text.trim()) return null;
    const my = myL(c), their = c ? c.lang : null, d = Engine.detect(text);
    if (their && their === my) return 'out';
    if (their && d === their) return 'in';
    return d === my ? 'out' : 'in';
  }

  function bindChat(c, id, target) {
    const input = document.getElementById('ch-input');
    const det = document.getElementById('ch-det');
    const dsel = document.getElementById('ch-dir');
    const sendBtn = document.getElementById('ch-send');
    chatState.dirOverride = null;
    const refreshDet = () => {
      const d = detectDir(input.value, chatState.dirOverride, c);
      chatState.draft[id] = input.value;
      sendBtn.textContent = d === 'in' ? t('btn_in') : (c && c.lang === myL(c) ? t('copy_lang', { lang: langUi(target) }) : t('btn_out', { lang: langUi(target) }));
      const who = c ? c.nickname : t('chat_none'); const lab = document.getElementById('ch-input-l'); const comp = document.getElementById('composer');
      const ov = chatState.dirOverride || '';
      document.querySelectorAll('.mode-btn').forEach((b) => { const on = b.dataset.mode === ov; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); b.classList.toggle('detected', !ov && !!d && b.dataset.mode === d); });
      const shown = d || (c && c.lang === myL(c) ? 'out' : '');
      if (comp) { comp.classList.toggle('is-in', shown === 'in'); comp.classList.toggle('is-out', shown === 'out'); }
      if (lab) lab.textContent = shown === 'in' ? t('lbl_in', { who, lang: langUi(target) }) : shown === 'out' ? t(c && c.lang === myL(c) ? 'lbl_out_same' : 'lbl_out', { who, my: langUi(myL(c)), lang: langUi(target) }) : t('lbl_auto', { who });
      input.placeholder = shown === 'in' ? t('ph_in', { lang: langUi(target) }) : shown === 'out' ? t('ph_out', { my: langUi(myL(c)) }) : t('smart_ph');
      if (!d) { det.textContent = t('smart_hint'); det.className = 'badge gray'; return; }
      det.textContent = (d === 'in' ? '⬅ ' + t('det_in') + ' · ' + langName(Engine.detect(input.value)) : '➡ ' + t('det_out') + ' → ' + langName(target));
      det.className = 'badge ' + (d === 'in' ? 'lilac' : '');
    };
    if (chatState.moveDir && chatState.moveDir.id === id) { chatState.dirOverride = chatState.moveDir.d; dsel.value = chatState.moveDir.d; }
    input.addEventListener('input', () => { if (!dsel.value) chatState.dirOverride = null; refreshDet(); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); sendBtn.click(); } });
    dsel.addEventListener('change', () => { chatState.dirOverride = dsel.value || null; refreshDet(); });
    document.querySelectorAll('.mode-btn').forEach((b) => b.addEventListener('click', () => { dsel.value = b.dataset.mode; chatState.dirOverride = b.dataset.mode || null; refreshDet(); input.focus(); }));
    const lpb = document.getElementById('ch-lang'), lpp = document.getElementById('lp-pop');
    if (lpb && lpp) lpb.addEventListener('click', () => { lpp.classList.toggle('open'); lpp.classList.add('flash'); document.getElementById('lp-my').focus(); setTimeout(() => lpp.classList.remove('flash'), 900); });
    const lpSave = () => { const th = document.getElementById('lp-their').value, my = document.getElementById('lp-my').value; Store.updateContact(c.id, { lang: th, myLang: '' }); const u0 = Store.me(); if (my !== uiLang && UI_LANGS.includes(my)) { uiLang = my; u0.lang = my; Store.save(); } else if (my !== uiLang) { Store.updateContact(c.id, { myLang: my }); } toast(t('lp_saved', { a: langUi(my), b: langUi(th) })); render(); setTimeout(() => { try { runDigests(); } catch (x) {} }, 300); };
    ['lp-my', 'lp-their'].forEach((k) => { const el = document.getElementById(k); if (el) el.addEventListener('change', lpSave); });
    const tsel = document.getElementById('ch-tone'), esel = document.getElementById('ch-emoji');
    tsel.addEventListener('change', () => { chatState.tone = tsel.value; if (c) { Store.updateContact(c.id, { tone: tsel.value }); } });
    esel.addEventListener('change', () => { chatState.emoji = esel.value; if (c) { Store.updateContact(c.id, { emoji: esel.value }); } });
    refreshDet();
    const tg = document.getElementById('ch-target'); if (tg) tg.addEventListener('change', () => { chatState.target = tg.value; renderChat({ id }); });
    const more = document.getElementById('ch-more'); if (more) more.addEventListener('click', () => { chatState.limit += 60; renderChat({ id }); });
    document.getElementById('ch-paste').addEventListener('click', async () => { try { const s = await navigator.clipboard.readText(); if (s) { input.value = s; refreshDet(); } } catch (e) { input.focus(); } });
    const handleImage = async (f) => { if (!f) return; const res = await runOcr(f, input); if (res && res.lines) { await bulkImport(c, res.lines, target); renderChat({ id }); return; } chatState.dirOverride = 'in'; refreshDet(); };
    document.getElementById('ch-shot').addEventListener('change', async (e) => { await handleImage(e.target.files[0]); });
    input.addEventListener('paste', (e) => { const it = [...(e.clipboardData || {}).items || []].find((x) => x.type && x.type.startsWith('image/')); if (it) { e.preventDefault(); handleImage(it.getAsFile()); } });
    const comp = document.getElementById('composer');
    comp.addEventListener('dragover', (e) => { e.preventDefault(); comp.classList.add('drop'); });
    comp.addEventListener('dragleave', () => comp.classList.remove('drop'));
    comp.addEventListener('drop', (e) => { e.preventDefault(); comp.classList.remove('drop'); const f = [...(e.dataTransfer.files || [])].find((x) => x.type.startsWith('image/')); if (f) handleImage(f); });
    document.getElementById('ch-send').addEventListener('click', async (ev) => {
      const text = input.value.trim(); if (!text) { input.focus(); return; }
      if (Engine.isJunk(text)) { toast(t('junk_input')); input.focus(); return; }
      chatState.moveDir = null;
      const d = detectDir(text, chatState.dirOverride, c);
      if (chatState.wrOk !== text) {
        const w = wrongRoom(c, text, d);
        if (w) {
          const old = document.getElementById('wr-box'); if (old) old.remove();
          document.getElementById('composer').insertAdjacentHTML('afterbegin', wrongRoomHtml(c, w));
          document.getElementById('wr-ok').addEventListener('click', () => { chatState.wrOk = text; document.getElementById('wr-box').remove(); document.getElementById('ch-send').click(); });
          document.getElementById('wr-move').addEventListener('click', (ev2) => { const to = ev2.currentTarget.dataset.to; chatState.draft[to] = text; chatState.draft[id] = ''; chatState.moveDir = { id: to, d }; location.hash = '#/chat/' + to; });
          return;
        }
      }
      const btn = ev.currentTarget; spinBtn(btn, true, '');
      try {
        const exp = parseChatExport(text, c);
        if (exp) { await bulkImport(c, exp, target); input.value = ''; chatState.draft[id] = ''; spinBtn(btn, false); renderChat({ id }); return; }
        if (d === 'in') {
          const res = await analyzeIncoming(c, text);
          const msg = Store.me().messages.find((x) => x.id === res.msgId);
          if (msg) { msg.analysis = slimAnalysis(res); Store.save(); Object.keys(chatState.open).forEach((k) => { chatState.open[k] = false; }); chatState.open[msg.id] = true; }
        } else {
          const pr = chatState.prepared[id];
          const tctx = toneCtx(c); const r2 = pr && pr.meaning === text ? { text: applyEmoji(pr.text, tctx) } : await tr(text, target, myL(c), tctx); if (!Engine.aiConfig().key) r2.text = applyEmoji(r2.text, tctx);
          const m = Store.addMessage({ contactId: c ? c.id : null, dir: 'out', text, lang: myL(c), translation: r2.text, trLang: target, source: pr && pr.meaning === text ? 'reply' : 'write', replyTo: pr && pr.meaning === text ? pr.mid : undefined });
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
      const isOpen = !!b.closest('.insight') || chatState.open[mid] === true;
      chatState.open[mid] = !isOpen || (!m.analysis && isOpen === false);
      if (chatState.open[mid] && !m.analysis) {
        renderChat({ id });
        try { const res = await analyzeExisting(c, m); m.analysis = slimAnalysis(res); Store.save(); } catch (e) { toast(t('trans_fail')); chatState.open[mid] = false; }
      }
      renderChat({ id });
    }));
    $app.querySelectorAll('[data-use]').forEach((b) => b.addEventListener('click', async () => {
      const [mid, i] = b.dataset.use.split('|'); const m = Store.me().messages.find((x) => x.id === mid); const rp = m.analysis.replies[Number(i)];
      const outTxt = Engine.aiConfig().key ? rp.text : applyEmoji(rp.text, toneCtx(c));
      await copyText(outTxt);
      Store.addMessage({ contactId: c ? c.id : null, dir: 'out', text: rp.meaning || rp.text, lang: myL(c), translation: outTxt, trLang: m.analysis.target, source: 'reply', replyTo: m.id });
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
      const np = { contactId: c ? c.id : null, title: (c ? c.nickname + ' · ' : '') + t('promise'), date: a.when.date || today(), time: a.when.time || '', place: a.place || '', sourceMsgId: m.id };
      if (isDupPromise(Store.me(), np)) { toast(t('dup_promise')); renderChat({ id }); return; }
      Store.addPromise(np);
      toast(t('added_reminder')); askNotify(); renderChat({ id });
    }));
    $app.querySelectorAll('[data-report]').forEach((b) => b.addEventListener('click', () => openReport(c, b.dataset.report)));
    $app.querySelectorAll('[data-sent]').forEach((b) => b.addEventListener('click', () => { const m = Store.me().messages.find((x) => x.id === b.dataset.sent); if (m) { m.sent = true; Store.save(); renderChat({ id }); } }));
    const draft = chatState.draft[id]; if (draft && !input.value) { input.value = draft; refreshDet(); }
  }

  function slimAnalysis(res) {
    return { ui: uiLang, nuance: res.nuance, facts: res.facts, situation: res.situation || '', inferences: res.inferences, when: res.when, place: res.place, replies: res.replies, target: res.target, culture: res.culture, provider: res.provider, risk: res.risk };
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
    shell(`${topBar('', null, `<div class="row" style="gap:6px;flex-wrap:nowrap"><select id="lang-quick" class="lang-top" aria-label="${esc(t('lang_l'))}">${UI_LANGS.map((l) => `<option value="${l}" ${l === uiLang ? 'selected' : ''}>🌐 ${esc({ ko: '한국어', zh: '中文', ja: '日本語', vi: 'Tiếng Việt', en: 'English' }[l])}</option>`).join('')}</select><button class="icon-btn" type="button" data-go="#/guide" aria-label="${esc(t('nav_guide'))}">${icon('help')}</button></div>`)}
      <div class="content stack">
        ${items.length ? `<button type="button" class="today-strip one" data-go="#/agenda"><b>${t('today')} ${items.length}</b><span class="small ellipsis">${itemText(items[0])}</span><span aria-hidden="true">›</span></button>` : ''}
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
  /* ---------- 3시간마다 대화 자동 정리 → 할 일·다가오는 약속 추가 (중복 방지) ---------- */
  const AUTO_EVERY = 3 * 3600000;
  const normT = (x) => String(x || '').toLowerCase().replace(/[\s·.,!?~]/g, '');
  function isDupPromise(u, p) {
    return u.promises.some((q) => q.contactId === p.contactId && ((p.date && q.date === p.date && (q.time || '') === (p.time || '')) || (p.sourceMsgId && q.sourceMsgId === p.sourceMsgId) || (normT(q.title) && normT(q.title) === normT(p.title) && (q.date || '') === (p.date || ''))));
  }
  let autoBusy = false;
  async function autoOrganize(force) {
    const u = Store.me(); if (!u || autoBusy || Store.viewingAs()) return 0;
    u.settings = u.settings || {}; if (u.settings.autoOrg === false) return 0;
    const last = u.settings.autoOrgAt || 0;
    if (!force && Date.now() - last < AUTO_EVERY) return 0;
    autoBusy = true; let added = 0;
    try {
      const since = last || Date.now() - 3 * 86400000;
      for (const c of u.contacts) {
        const ms = Store.messagesOf(c.id, u).filter((m) => m.ts > since && m.source !== 'sample');
        if (!ms.length) continue;
        let items = [];
        if (Engine.aiConfig().key) { try { items = await Engine.aiTasks(ms.slice(-40), c, uiLang, today()); } catch (e) { items = []; } }
        if (!items.length) {
          ms.forEach((m) => { const w = Engine.extractWhen(m.text, m.ts) || (m.translation ? Engine.extractWhen(m.translation, m.ts) : null); if (w && (w.date || w.time) && (w.time || w.date !== Engine.ymd(new Date(m.ts)))) items.push({ kind: 'appointment', title: c.nickname + ' · ' + t('promise'), date: w.date || Engine.ymd(new Date(m.ts)), time: w.time || '', place: Engine.extractPlace(m.text) || (m.translation ? Engine.extractPlace(m.translation) : '') || '', sourceMsgId: m.id }); });
        }
        items.forEach((it) => {
          const p = { contactId: c.id, title: it.title.includes(c.nickname) ? it.title : c.nickname + ' · ' + it.title, date: it.date || (it.kind === 'todo' ? today() : ''), time: it.time || '', place: it.place || '', auto: true, kind: it.kind, sourceMsgId: it.sourceMsgId || '' };
          if (!p.date || p.date < today()) return;
          if (isDupPromise(u, p)) return;
          Store.addPromise(p); added++;
        });
      }
      u.settings.autoOrgAt = Date.now(); Store.save();
    } finally { autoBusy = false; }
    if (added) toast(t('auto_added', { n: added }));
    return added;
  }
  document.addEventListener('change', (e) => { if (e.target.id === 'ag-auto') { const u = Store.me(); u.settings = u.settings || {}; u.settings.autoOrg = e.target.checked; Store.save(); } });
  document.addEventListener('click', async (e) => { const b = e.target.closest('#ag-auto-now'); if (!b) return; b.disabled = true; const n = await autoOrganize(true); if (!n) toast(t('nothing_today')); render(); });
  setInterval(() => { autoOrganize(false).then((n) => { if (n && ['agenda', 'chat', 'today', 'home'].includes(route().name)) render(); }); }, 10 * 60000);
  setTimeout(() => autoOrganize(false), 4000);

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
        if (cur && cur.n === list.length && (cur.ui || 'ko') === uiLang) return;
        const view = list.map((m) => Object.assign({}, m, { translation: m.dir === 'in' ? (m.trLang === uiLang ? m.translation : ((m.trs && m.trs[uiLang + '|in']) || '')) : m.translation }));
        const mem = Engine.dayMemory(view);
        D[k] = Object.assign({}, mem, { by: 'basic', at: Date.now(), summary: '', ui: uiLang });
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
        D[job.day] = Object.assign({}, D[job.day] || {}, { ui: uiLang, summary: r.summary, facts: r.facts.length ? r.facts : (D[job.day] || {}).facts || [], by: 'ai', at: Date.now(), n: list.length });
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


  /* ================= 도구 모음 ================= */
  /* ---------- 받은 지시·공지 (관리자·팀장 → 나), 내 언어로 번역 ---------- */
  const INBOX_T = {
    ko: { cap_block: '캡처가 금지되어 있습니다', cap_block2: '이 화면은 워터마크로 사용자와 시각이 기록되며, 캡처 시도는 관리자에게 기록됩니다.', cap_warn: '화면 캡처는 기록되며 워터마크로 추적됩니다', ai_hq_title: 'AI 기능', ai_hq_on: '본사 AI 사용 중', ai_hq_desc: 'AI 번역·뉘앙스 분석·답장 추천·스크린샷 인식이 요금제에 포함돼 있어요. 따로 키를 넣을 필요가 없어요.', ai_hq_locked: 'AI 분석은 프로·프리미엄 요금제에서 쓸 수 있어요. 지금은 무료 번역으로 동작해요.', ai_hq_none: '지금은 무료 번역으로 동작해요. AI 기능은 곧 열려요.', my_plan: '내 요금제', plan_free: '무료', plan_pro: '프로', plan_premium: '프리미엄', plan_business: '기업용', ai_upsell: '✨ AI 분석 (프로 요금제)', ib_need: '답장 필요', ib_replied: '답장함', ib_due: '마감', ib_pending: '답장해야 할 지시 {n}건', nav_inbox: '공지함', ib_title: '받은 지시·공지', ib_lead: '관리자·팀장이 보낸 메시지가 내 언어로 번역돼 도착해요. 답장은 내 언어로 쓰면 한국어로 번역돼 전달돼요.', ib_empty: '아직 받은 메시지가 없어요.', ib_orig: '원문 보기', ib_reply_l: '답장 (내 언어로 쓰세요)', ib_send: '답장 보내기', ib_sent: '답장을 보냈어요', ib_me: '나', ib_tr_to: '{lang}로 전달됨', k_instruction: '지시', k_notice: '공지', k_warning: '경고', k_reply: '답장', ib_banner: '📩 새 지시·공지 {n}건', ib_open: '보기', ib_read: '읽음', ib_translating: '번역 중…' },
    zh: { cap_block: '禁止截屏', cap_block2: '此画面带有记录用户和时间的水印，截屏尝试会记录给管理员。', cap_warn: '截屏会被记录，并可通过水印追踪', ai_hq_title: 'AI 功能', ai_hq_on: '正在使用总部 AI', ai_hq_desc: 'AI 翻译·语气分析·回复建议·截图识别已包含在套餐中，不需要自己输入密钥。', ai_hq_locked: 'AI 分析在专业版·高级版中可用。现在使用免费翻译。', ai_hq_none: '现在使用免费翻译，AI 功能即将开放。', my_plan: '我的套餐', plan_free: '免费', plan_pro: '专业版', plan_premium: '高级版', plan_business: '企业版', ai_upsell: '✨ AI 分析（专业版）', ib_need: '需要回复', ib_replied: '已回复', ib_due: '截止', ib_pending: '需要回复的指示 {n} 条', nav_inbox: '通知', ib_title: '收到的指示·通知', ib_lead: '管理员·组长发来的消息会翻译成你的语言。用你的语言回复，会翻译成韩语发送。', ib_empty: '还没有收到消息。', ib_orig: '查看原文', ib_reply_l: '回复（用你的语言写）', ib_send: '发送回复', ib_sent: '已发送回复', ib_me: '我', ib_tr_to: '已用{lang}发送', k_instruction: '指示', k_notice: '通知', k_warning: '警告', k_reply: '回复', ib_banner: '📩 新指示·通知 {n} 条', ib_open: '查看', ib_read: '已读', ib_translating: '翻译中…' },
    ja: { cap_block: 'キャプチャは禁止されています', cap_block2: 'この画面には利用者と時刻の透かしが入り、キャプチャの試みは管理者に記録されます。', cap_warn: '画面キャプチャは記録され、透かしで追跡されます', ai_hq_title: 'AI機能', ai_hq_on: '本社AIを利用中', ai_hq_desc: 'AI翻訳・ニュアンス分析・返信案・スクショ認識は料金プランに含まれています。キーを入れる必要はありません。', ai_hq_locked: 'AI分析はプロ・プレミアムで使えます。今は無料翻訳で動いています。', ai_hq_none: '今は無料翻訳で動いています。AI機能はまもなく公開されます。', my_plan: '私のプラン', plan_free: '無料', plan_pro: 'プロ', plan_premium: 'プレミアム', plan_business: '法人向け', ai_upsell: '✨ AI分析（プロ）', ib_need: '返信が必要', ib_replied: '返信済み', ib_due: '締切', ib_pending: '返信が必要な指示 {n}件', nav_inbox: 'お知らせ', ib_title: '受け取った指示・お知らせ', ib_lead: '管理者・チームリーダーからのメッセージが自分の言語に翻訳されて届きます。返信は自分の言語で書くと韓国語に翻訳されて届きます。', ib_empty: 'まだメッセージはありません。', ib_orig: '原文を見る', ib_reply_l: '返信（自分の言語で）', ib_send: '返信を送る', ib_sent: '返信を送りました', ib_me: '自分', ib_tr_to: '{lang}で届けました', k_instruction: '指示', k_notice: 'お知らせ', k_warning: '警告', k_reply: '返信', ib_banner: '📩 新しい指示・お知らせ {n}件', ib_open: '見る', ib_read: '既読', ib_translating: '翻訳中…' },
    vi: { cap_block: 'Không được chụp màn hình', cap_block2: 'Màn hình có hình mờ ghi người dùng và thời gian; mọi lần thử chụp đều được ghi lại cho quản trị viên.', cap_warn: 'Chụp màn hình được ghi lại và truy vết bằng hình mờ', ai_hq_title: 'Tính năng AI', ai_hq_on: 'Đang dùng AI của hệ thống', ai_hq_desc: 'Dịch AI, phân tích sắc thái, gợi ý trả lời, nhận diện ảnh chụp đã bao gồm trong gói. Không cần nhập khóa.', ai_hq_locked: 'Phân tích AI có trong gói Pro·Premium. Hiện đang dùng dịch miễn phí.', ai_hq_none: 'Hiện đang dùng dịch miễn phí. Tính năng AI sắp mở.', my_plan: 'Gói của tôi', plan_free: 'Miễn phí', plan_pro: 'Pro', plan_premium: 'Premium', plan_business: 'Doanh nghiệp', ai_upsell: '✨ Phân tích AI (gói Pro)', ib_need: 'Cần trả lời', ib_replied: 'Đã trả lời', ib_due: 'Hạn', ib_pending: '{n} chỉ thị cần trả lời', nav_inbox: 'Thông báo', ib_title: 'Chỉ thị · thông báo nhận được', ib_lead: 'Tin của quản trị viên·trưởng nhóm được dịch sang ngôn ngữ của bạn. Trả lời bằng ngôn ngữ của bạn sẽ được dịch sang tiếng Hàn.', ib_empty: 'Chưa có tin nhắn nào.', ib_orig: 'Xem bản gốc', ib_reply_l: 'Trả lời (viết bằng ngôn ngữ của bạn)', ib_send: 'Gửi trả lời', ib_sent: 'Đã gửi trả lời', ib_me: 'Tôi', ib_tr_to: 'Đã gửi bằng {lang}', k_instruction: 'Chỉ thị', k_notice: 'Thông báo', k_warning: 'Cảnh báo', k_reply: 'Trả lời', ib_banner: '📩 {n} chỉ thị·thông báo mới', ib_open: 'Xem', ib_read: 'Đã đọc', ib_translating: 'Đang dịch…' },
    en: { cap_block: 'Screen capture is not allowed', cap_block2: 'This screen is watermarked with your ID and time, and capture attempts are logged for administrators.', cap_warn: 'Screen captures are logged and traceable by watermark', ai_hq_title: 'AI features', ai_hq_on: 'Using our AI', ai_hq_desc: 'AI translation, nuance analysis, reply ideas and screenshot reading are included in your plan — no key needed.', ai_hq_locked: 'AI analysis is available on Pro and Premium. You are on free translation now.', ai_hq_none: 'You are on free translation now. AI features are coming soon.', my_plan: 'My plan', plan_free: 'Free', plan_pro: 'Pro', plan_premium: 'Premium', plan_business: 'Business', ai_upsell: '✨ AI analysis (Pro plan)', ib_need: 'Reply needed', ib_replied: 'Replied', ib_due: 'Due', ib_pending: '{n} instruction(s) need a reply', nav_inbox: 'Inbox', ib_title: 'Instructions & notices', ib_lead: 'Messages from admins and team leaders arrive translated into your language. Reply in your language and it is delivered in Korean.', ib_empty: 'No messages yet.', ib_orig: 'Show original', ib_reply_l: 'Reply (write in your language)', ib_send: 'Send reply', ib_sent: 'Reply sent', ib_me: 'Me', ib_tr_to: 'Delivered in {lang}', k_instruction: 'Instruction', k_notice: 'Notice', k_warning: 'Warning', k_reply: 'Reply', ib_banner: '📩 {n} new instruction(s)/notice(s)', ib_open: 'Open', ib_read: 'Read', ib_translating: 'Translating…' },
  };
  Object.keys(INBOX_T).forEach((l) => Object.assign(T[l], INBOX_T[l]));
  function hasInbox(u) { u = u || Store.me(); return !!u && (Store.can('team_inbox', u) || Store.noticesOf(u.id).length > 0); }
  function inboxBanner() {
    const u = Store.me(); if (!u || POP) return '';
    const n = Store.unreadNotices(u.id); if (!n) return '';
    const warn = Store.noticesOf(u.id).some((x) => x.from !== 'member' && !x.readAt && x.kind === 'warning');
    return `<a class="inbox-banner ${warn ? 'warn' : ''}" href="#/inbox">${esc(t('ib_banner', { n }))} <b>${t('ib_open')} →</b></a>`;
  }
  function renderInbox() {
    const u = Store.me();
    const viewing = !!Store.viewingAs();
    const ns = Store.noticesOf(u.id);
    const pend = Store.pendingReply(u.id);
    const hmTs = (ts) => { const d = new Date(ts); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
    const items = ns.map((n) => {
      if (n.from === 'member') {
        return `<article class="inbox-msg mine"><div class="org-meta org-muted">${t('ib_me')} · ${hmTs(n.ts)}${n.readAt ? ' · ✓✓ ' + t('ib_read') : ''}</div><div class="inbox-bubble"><p class="org-text">${esc(n.text)}</p>${n.lang !== 'ko' ? `<p class="org-muted">${esc(t('ib_tr_to', { lang: langUi('ko') }))}: ${esc((n.tr && n.tr.ko) || t('ib_translating'))}</p>` : ''}</div></article>`;
      }
      const tx = n.lang === uiLang ? n.text : (n.tr && n.tr[uiLang]) || (n.trFail ? n.text : '');
      const pendNow = pend.some((p) => p.id === n.id);
      return `<article class="inbox-msg ${n.kind === 'warning' ? 'warn' : ''} ${pendNow ? 'pending' : ''}" data-nid="${n.id}"><div class="org-meta org-muted"><span class="org-tag" data-state="${n.kind === 'warning' ? 'warning' : n.readAt ? 'read' : 'unread'}">${esc(t('k_' + (n.kind || 'instruction')))}</span>${n.needReply ? ` <span class="org-tag" data-state="${pendNow ? 'replied' : 'read'}">${esc(pendNow ? t('ib_need') : t('ib_replied'))}</span>` : ''}${n.due ? ` <span class="org-tag">${esc(t('ib_due'))} ${esc(n.due.replace('T', ' '))}</span>` : ''} ${esc(n.fromName)} · ${hmTs(n.ts)}</div>
        <div class="inbox-bubble"><p class="org-text" lang="${esc(uiLang)}">${tx ? esc(tx) : `<span class="org-muted">${t('ib_translating')}</span>`}</p>${n.lang !== uiLang ? `<details class="org-original"><summary>${t('ib_orig')} (${esc(langUi(n.lang))})</summary><p class="org-text" lang="${esc(n.lang)}">${esc(n.text)}</p></details>` : ''}</div></article>`;
    }).join('');
    shell(`${topBar(t('ib_title'), '#/chat')}
      <div class="content"><section class="lm-inbox" data-view="detail">
        <p class="org-muted">${esc(t('ib_lead'))}</p>
        ${pend.length ? `<div class="org-panel inbox-pending"><h2>📌 ${esc(t('ib_pending', { n: pend.length }))}</h2>${pend.map((n) => `<a class="inbox-item" href="#ib-form"><span>${esc((n.lang === uiLang ? n.text : (n.tr && n.tr[uiLang]) || n.text).slice(0, 80))}</span><span class="org-tag" data-state="replied">${n.due ? esc(t('ib_due')) + ' ' + esc(n.due.replace('T', ' ')) : esc(t('ib_need'))}</span></a>`).join('')}</div>` : ''}
        <div class="org-panel inbox-detail-panel"><div class="inbox-thread" id="ib-thread">${items || `<p class="org-empty">${t('ib_empty')}</p>`}</div>
          ${ns.length ? `<form class="org-form inbox-reply" id="ib-form"><label class="org-label" for="ib-text">${t('ib_reply_l')}</label><textarea class="field" id="ib-text" rows="2" required></textarea><div class="org-actions" style="justify-content:flex-end"><button class="btn" type="submit">${t('ib_send')}</button></div></form>` : ''}
        </div></section></div>`, 'inbox');
    if (!viewing && Store.markNoticesRead(u.id)) { /* 읽음 기록 */ }
    const th = document.getElementById('ib-thread'); if (th) th.scrollTop = th.scrollHeight;
    // 내 언어 번역이 없으면 채우기
    ns.forEach((n) => { if (n.from !== 'member' && n.lang !== uiLang && !(n.tr && n.tr[uiLang])) Engine.translate(n.text, uiLang, n.lang).then((o) => { Store.setNoticeTr(n.id, uiLang, o.text); if (route().name === 'inbox') renderInbox(); }).catch(() => {}); });
    const f = document.getElementById('ib-form');
    if (f) f.addEventListener('submit', async (e) => {
      e.preventDefault(); const text = document.getElementById('ib-text').value.trim(); if (!text) return;
      if (viewing) { toast(t('ib_sent')); return; }
      const btn = f.querySelector('button'); btn.disabled = true;
      const from = Engine.detect(text) || uiLang; let tr = {};
      if (from !== 'ko') { try { tr.ko = (await Engine.translate(text, 'ko', from)).text; } catch (x) {} }
      Store.replyNotice(u.id, text, from, tr); toast(t('ib_sent')); renderInbox();
    });
  }

  function renderTools() {
    const u = Store.me();
    const cid = helperState.contactId || (u.contacts[0] || {}).id || '';
    const items = [['coach', 'heart', 'nav_coach', 'tl_coach', '#/coach/' + cid], ['saju', 'yin', 'nav_saju', 'tl_saju', '#/saju/' + cid], ['gift', 'gift', 'nav_gift', 'tl_gift', '#/gift/' + cid], ['culture', 'globe', 'nav_culture', 'tl_culture', '#/culture' + (cid ? '?c=' + cid : '')], ['anniv', 'cake', 'nav_anniv', 'tl_anniv', '#/anniv'], ['agenda', 'calendar', 'nav_agenda', 'tl_agenda', '#/agenda']];
    shell(`${topBar(t('tools_title'), null)}
      <div class="content stack">
        <p class="muted">${t('tools_lead')}</p>
        <div class="tool-grid">${items.map(([k, ic, lb, ds, href]) => `<button type="button" class="tool-card t-${k}" data-go="${href}"><span class="tool-ic">${icon(ic)}</span><strong>${t(lb)}</strong><span class="small muted">${t(ds)}</span></button>`).join('')}</div>
      </div>`, 'tools');
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
        <div class="card stack-sm ${ai ? '' : 'g-ai'}"><h2>${t('ai_hq_title')} ${ai ? '<span class="badge">✓ ' + t('ai_hq_on') + '</span>' : ''}</h2><p class="small muted">${ai ? t('ai_hq_desc') : (Engine.aiConfig().source === 'locked' ? t('ai_hq_locked') : t('ai_hq_none'))}</p></div>
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
          <div class="between" style="gap:8px"><span class="row" style="gap:6px"><span class="small muted">${t('star_l')}</span>${starsHtml(c, true)}</span><button type="button" class="chip sm ${c.pinned ? 'on' : ''}" data-pin="${c.id}">📌 ${c.pinned ? t('unpin') : t('pin')}</button></div>
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
  const REL_T = {"ko": {"ri_title": "관계 분석", "ri_stage_set": "지금 설정한 단계", "ri_stage_read": "대화로 본 단계", "ri_why": "왜 이 단계인가", "ri_apply": "이 단계로 바꾸기", "ri_signals": "상대의 신호", "ri_next": "다음에 해볼 것", "ri_avoid": "지금 피할 말·행동", "ri_ai": "AI로 더 자세히 분석", "ri_ai_busy": "AI 분석 중…", "ri_ai_at": "AI 분석 {t}", "ri_basic": "대화 기록으로 계산한 분석이에요. AI 분석을 누르면 실제 문장을 근거로 더 자세히 풀어줘요.", "ri_few": "대화가 {n}건이라 아직 판단 근거가 적어요. 몇 번 더 주고받으면 정확해져요.", "w_count": "대화 {n}건 · {d}일 동안 {days}일 대화", "w_aff": "호감·애정 표현 {n}회", "w_inv": "만남·약속 제안 {n}회", "w_init": "상대가 먼저 연락한 날 {p}%", "w_reply": "상대 답장 시간 보통 {m}분", "w_q": "상대 메시지 중 질문 {p}%", "w_busy": "'바쁘다·다음에' {n}회", "s_faster": ["답장이 빨라지고 있어요", "앞부분 보통 {a}분 → 최근 {b}분. 이 대화에 우선순위를 두기 시작했다는 신호예요."], "s_slower": ["답장이 느려지고 있어요", "앞부분 {a}분 → 최근 {b}분. 바빠졌거나 관심이 줄었을 수 있어요. 질문형으로 짧게 보내고 반응을 보세요."], "s_init": ["먼저 연락하는 편이에요", "대화한 날의 {p}%를 상대가 먼저 시작했어요. 대화를 이어가고 싶다는 뜻이에요."], "s_noinit": ["주로 내가 먼저 연락해요", "상대가 먼저 시작한 날은 {p}%뿐이에요. 연락 간격을 조금 두고 상대가 먼저 오는지 보세요."], "s_longer": ["메시지가 길어지고 있어요", "평균 {a}자 → {b}자. 마음을 더 열고 이야기하고 있어요."], "s_shorter": ["메시지가 짧아지고 있어요", "평균 {a}자 → {b}자. 피곤하거나 대화 주제가 맞지 않을 수 있어요. 상대 관심사로 화제를 바꿔 보세요."], "s_emoji": ["이모티콘·웃음이 늘었어요", "{a}% → {b}%. 대화가 편해지고 분위기가 좋아지고 있어요."], "s_q": ["나에 대해 자주 물어봐요", "상대 메시지의 {p}%가 질문이에요. 나에게 관심이 있다는 대표적인 신호예요."], "s_aff": ["호감·애정 표현이 있었어요", "{n}회. 같은 온도로 자연스럽게 답해 주면 관계가 한 단계 가까워져요."], "s_inv": ["만남·약속을 제안했어요", "{n}회. 구체적인 시간·장소로 답하면 실제 만남으로 이어지기 쉬워요."], "s_busy": ["'바쁘다·다음에'가 반복돼요", "{n}회. 실제로 바쁠 수도 있지만 대안 날짜를 먼저 말하지 않는다면 거리 두기일 수 있어요."], "s_neg": ["힘든 일을 털어놓았어요", "{n}회. 고민을 말한다는 건 신뢰의 신호예요. 조언보다 공감이 먼저예요."], "s_silent": ["{n}일째 대화가 없어요", "마지막 메시지가 {who}였어요. 부담 없는 안부나 지난 대화 이야기로 다시 열어 보세요."], "s_money": ["돈 이야기가 나왔어요", "{n}회. 송금·투자·계좌 요청은 사기에서 자주 나와요. 절대 보내지 마세요."], "who_me": "내 메시지", "who_them": "상대 메시지", "n_meet": ["구체적인 만남 제안하기", "상대가 적극적이에요. '이번 주 토요일 오후 3시에 ○○ 어때요?'처럼 날짜·시간·장소를 하나로 정해 제안하세요."], "n_light": ["부담 없는 짧은 안부", "바쁘다는 말이 있었어요. '바쁠 텐데 밥 잘 챙겨 먹어요 😊'처럼 답을 요구하지 않는 메시지가 좋아요. 날짜는 상대에게 맡기세요."], "n_empathy": ["공감 먼저 하기", "힘든 이야기에는 '많이 힘들었겠다, 무슨 일 있었어?'처럼 먼저 들어 주세요. 해결책은 상대가 물어볼 때 말해요."], "n_answer": ["질문에 성의 있게 답하고 되묻기", "나에 대한 질문이 많아요. 내 이야기를 조금 더 자세히 하고 같은 질문을 되물어 대화를 이어가세요."], "n_reopen": ["지난 대화로 다시 열기", "'지난번에 말한 ○○는 어떻게 됐어요?'처럼 상대가 했던 이야기를 기억해 물어보면 자연스러워요."], "n_space": ["연락 간격 두기", "내가 연속으로 먼저 연락하고 있어요. 하루 이틀 기다려 상대가 먼저 오는지 보세요."], "n_up": ["다음 단계로 조금 더", "신호가 좋아요. 칭찬을 구체적으로 하거나 둘만의 약속을 만들어 한 단계 가까워져 보세요."], "a_push": ["재촉하기 · '왜 답 안 해?'", "바쁘다는 상대에게는 압박으로 느껴져 거리가 더 멀어져요."], "a_spam": ["답 없을 때 연속 메시지", "대화가 끊긴 상태에서 여러 개를 보내면 부담을 줘요. 하나만 보내고 기다리세요."], "a_early": ["너무 이른 고백·사적인 질문", "연봉·과거 연애·가족 사정 같은 질문은 아직 이른 단계예요."], "a_money": ["송금·계좌·인증번호 공유", "어떤 이유든 돈 요청에는 응하지 말고 신고하세요."], "a_advice": ["섣부른 조언·비교", "'그건 네가 잘못했네', '나도 그런 적 있어'는 공감이 아니라 판단으로 들려요."], "a_cold": ["단답·늦은 답장으로 맞대응", "상대가 적극적인데 짧게 답하면 관심이 없다고 오해해요."]}, "en": {"ri_title": "Relationship analysis", "ri_stage_set": "Stage you set", "ri_stage_read": "Stage the chat shows", "ri_why": "Why this stage", "ri_apply": "Use this stage", "ri_signals": "Their signals", "ri_next": "What to try next", "ri_avoid": "What to avoid now", "ri_ai": "Analyze in detail with AI", "ri_ai_busy": "AI analyzing…", "ri_ai_at": "AI analysis {t}", "ri_basic": "Calculated from your chat history. Tap AI analysis for a detailed reading based on the actual messages.", "ri_few": "Only {n} messages so far — a few more exchanges will make this more accurate.", "w_count": "{n} messages · chatted on {days} of {d} days", "w_aff": "{n} affectionate expressions", "w_inv": "{n} invitations/plans", "w_init": "They started the chat on {p}% of days", "w_reply": "They usually reply in {m} min", "w_q": "{p}% of their messages are questions", "w_busy": "'Busy / next time' {n} times", "s_faster": ["Replying faster", "Usually {a} min earlier → {b} min recently. They are starting to prioritise this chat."], "s_slower": ["Replying slower", "{a} min → {b} min. They may be busier or less interested. Send something short with a question and watch."], "s_init": ["They often text first", "They started {p}% of chat days. They want to keep talking."], "s_noinit": ["You usually text first", "They started only {p}% of chat days. Leave a little space and see if they reach out."], "s_longer": ["Messages are getting longer", "{a} → {b} characters on average. They are opening up."], "s_shorter": ["Messages are getting shorter", "{a} → {b} characters. They may be tired or the topic is off — switch to their interests."], "s_emoji": ["More emoji and laughter", "{a}% → {b}%. The chat is getting comfortable."], "s_q": ["They ask about you a lot", "{p}% of their messages are questions — a classic sign of interest."], "s_aff": ["Affection shown", "{n} times. Answer at the same warmth and you will get closer."], "s_inv": ["They suggested meeting", "{n} times. Reply with a concrete time and place."], "s_busy": ["'Busy / next time' keeps coming", "{n} times. They may really be busy, but if they never offer another date it can mean distance."], "s_neg": ["They shared something hard", "{n} times. That is trust — empathy before advice."], "s_silent": ["No chat for {n} days", "The last message was {who}. Reopen with a light hello or something from your past chats."], "s_money": ["Money came up", "{n} times. Requests to send money or invest are common in scams — never send."], "who_me": "yours", "who_them": "theirs", "n_meet": ["Suggest a concrete meetup", "They are keen. Propose one date, time and place, e.g. 'How about Saturday 3pm at …?'"], "n_light": ["A short, no-pressure hello", "They mentioned being busy. Send something that needs no reply and let them pick a date."], "n_empathy": ["Empathy first", "Listen first: 'That sounds hard — what happened?' Offer solutions only if asked."], "n_answer": ["Answer properly and ask back", "They ask about you — share a bit more and ask the same question back."], "n_reopen": ["Reopen with a past topic", "Ask about something they told you before — it feels natural and caring."], "n_space": ["Give a little space", "You have been texting first repeatedly. Wait a day or two and see if they come to you."], "n_up": ["Move a little closer", "Signals are good. Give a specific compliment or make a plan just for the two of you."], "a_push": ["Pushing · 'Why aren't you answering?'", "Feels like pressure to someone who is busy."], "a_spam": ["Many messages while they are silent", "Send one and wait."], "a_early": ["Too-early confessions or personal questions", "Salary, past relationships, family matters — too soon."], "a_money": ["Sending money, account or verification codes", "Never, for any reason — report it."], "a_advice": ["Quick advice or comparisons", "Sounds like judgement, not empathy."], "a_cold": ["Matching with short, late replies", "They are keen — short answers read as no interest."]}, "zh": {"ri_title": "关系分析", "ri_stage_set": "你设置的阶段", "ri_stage_read": "对话显示的阶段", "ri_why": "为什么是这个阶段", "ri_apply": "改成这个阶段", "ri_signals": "对方的信号", "ri_next": "接下来可以做的", "ri_avoid": "现在要避免的话和行为", "ri_ai": "用 AI 详细分析", "ri_ai_busy": "AI 分析中…", "ri_ai_at": "AI 分析 {t}", "ri_basic": "根据对话记录计算。点 AI 分析，会根据实际消息更详细地解读。", "ri_few": "目前只有 {n} 条对话，再多聊几次会更准确。", "w_count": "对话 {n} 条 · {d} 天中聊了 {days} 天", "w_aff": "好感表达 {n} 次", "w_inv": "见面·约定提议 {n} 次", "w_init": "对方先联系的天数 {p}%", "w_reply": "对方通常 {m} 分钟回复", "w_q": "对方消息中提问占 {p}%", "w_busy": "“忙·下次” {n} 次", "s_faster": ["回复变快了", "之前约 {a} 分钟 → 最近 {b} 分钟。开始把这段对话放在优先位置。"], "s_slower": ["回复变慢了", "{a} 分钟 → {b} 分钟。可能变忙或兴趣下降。发一句带问题的短消息看看反应。"], "s_init": ["经常主动联系", "{p}% 的聊天日由对方先开始。说明想继续聊。"], "s_noinit": ["主要是你先联系", "对方先开始的只有 {p}%。稍微拉开间隔，看对方会不会主动。"], "s_longer": ["消息越来越长", "平均 {a} 字 → {b} 字。对方更愿意敞开心扉。"], "s_shorter": ["消息越来越短", "平均 {a} 字 → {b} 字。可能累了或话题不合，换成对方感兴趣的话题。"], "s_emoji": ["表情和笑声变多", "{a}% → {b}%。聊天越来越轻松。"], "s_q": ["经常问你的事", "对方消息的 {p}% 是提问——典型的好感信号。"], "s_aff": ["有好感表达", "{n} 次。用同样的温度回应会更亲近。"], "s_inv": ["提议见面", "{n} 次。用具体的时间地点回复更容易见面。"], "s_busy": ["反复说“忙·下次”", "{n} 次。可能真的忙，但如果从不提出其他日期，可能是在保持距离。"], "s_neg": ["说了烦心事", "{n} 次。愿意倾诉是信任，先共情再建议。"], "s_silent": ["已经 {n} 天没聊", "最后一条是{who}。用轻松的问候或以前的话题重新开始。"], "s_money": ["提到了钱", "{n} 次。转账、投资请求常见于诈骗，绝对不要转。"], "who_me": "你发的", "who_them": "对方发的", "n_meet": ["提出具体的见面", "对方很积极。定好一个日期、时间和地点来提议。"], "n_light": ["没有压力的简短问候", "对方说忙。发不需要回复的话，日期让对方定。"], "n_empathy": ["先共情", "先倾听：“一定很辛苦吧，发生什么了？”对方问再给建议。"], "n_answer": ["认真回答并反问", "对方常问你的事，多说一点自己，再反问同样的问题。"], "n_reopen": ["用以前的话题重新开始", "问问对方之前提过的事，自然又贴心。"], "n_space": ["拉开一点间隔", "你一直先联系，等一两天看对方会不会主动。"], "n_up": ["再靠近一步", "信号不错。具体地称赞，或约一个只属于两个人的计划。"], "a_push": ["催促 · “为什么不回？”", "对忙碌的人来说是压力。"], "a_spam": ["对方没回时连发消息", "发一条就等。"], "a_early": ["过早表白或私人问题", "收入、前任、家事——还太早。"], "a_money": ["转账、账号、验证码", "任何理由都不要，并举报。"], "a_advice": ["急着给建议或比较", "听起来像评判，不是共情。"], "a_cold": ["用简短、迟回应对", "对方很积极，简短回复会被误解为没兴趣。"]}, "ja": {"ri_title": "関係の分析", "ri_stage_set": "設定した段階", "ri_stage_read": "会話から見た段階", "ri_why": "なぜこの段階か", "ri_apply": "この段階にする", "ri_signals": "相手のサイン", "ri_next": "次に試すこと", "ri_avoid": "今は避けたい言葉・行動", "ri_ai": "AIで詳しく分析", "ri_ai_busy": "AI分析中…", "ri_ai_at": "AI分析 {t}", "ri_basic": "会話記録から計算した分析です。AI分析を押すと実際のメッセージをもとに詳しく解説します。", "ri_few": "まだ{n}件なので根拠が少なめです。もう少しやり取りすると正確になります。", "w_count": "{n}件 · {d}日のうち{days}日会話", "w_aff": "好意の表現 {n}回", "w_inv": "会う・約束の提案 {n}回", "w_init": "相手から始めた日 {p}%", "w_reply": "相手の返信は普通{m}分", "w_q": "相手のメッセージの{p}%が質問", "w_busy": "「忙しい・また今度」{n}回", "s_faster": ["返信が早くなっている", "以前は{a}分 → 最近{b}分。この会話を優先し始めたサインです。"], "s_slower": ["返信が遅くなっている", "{a}分 → {b}分。忙しいか関心が下がったかも。短い質問で様子を見て。"], "s_init": ["相手から連絡することが多い", "会話した日の{p}%を相手が始めています。続けたい気持ちの表れです。"], "s_noinit": ["主に自分から連絡している", "相手から始めたのは{p}%だけ。少し間を空けて相手から来るか見て。"], "s_longer": ["メッセージが長くなっている", "平均{a}字 → {b}字。心を開いています。"], "s_shorter": ["メッセージが短くなっている", "平均{a}字 → {b}字。疲れているか話題が合わないかも。相手の好きな話題へ。"], "s_emoji": ["絵文字・笑いが増えた", "{a}% → {b}%。打ち解けてきています。"], "s_q": ["よく質問してくる", "相手のメッセージの{p}%が質問。典型的な好意のサインです。"], "s_aff": ["好意の表現があった", "{n}回。同じ温度で返すともっと近づけます。"], "s_inv": ["会う提案があった", "{n}回。具体的な日時・場所で返すと実際に会いやすいです。"], "s_busy": ["「忙しい・また今度」が続く", "{n}回。本当に忙しいのかも。ただ代わりの日を出さないなら距離を置いているかも。"], "s_neg": ["悩みを話してくれた", "{n}回。信頼のサイン。アドバイスより共感を先に。"], "s_silent": ["{n}日間会話がない", "最後は{who}でした。気軽なあいさつか前の話題で再開を。"], "s_money": ["お金の話が出た", "{n}回。送金・投資の依頼は詐欺によくあります。絶対に送らないで。"], "who_me": "自分のメッセージ", "who_them": "相手のメッセージ", "n_meet": ["具体的に会う提案をする", "相手は積極的です。日時と場所を一つ決めて提案しましょう。"], "n_light": ["負担のない短いあいさつ", "忙しいと言っていました。返信を求めないメッセージを送り、日程は相手に任せて。"], "n_empathy": ["まず共感", "「大変だったね、何があったの？」とまず聞いて。解決策は聞かれてから。"], "n_answer": ["丁寧に答えて聞き返す", "自分への質問が多いです。少し詳しく話し、同じ質問を返しましょう。"], "n_reopen": ["前の話題で再開", "以前相手が話したことを覚えていて聞くと自然です。"], "n_space": ["少し間を空ける", "自分から連続で連絡しています。1〜2日待ってみて。"], "n_up": ["もう一歩近づく", "サインは良好。具体的にほめる、二人だけの約束を作るなど。"], "a_push": ["催促する・「なんで返事しないの？」", "忙しい相手にはプレッシャーです。"], "a_spam": ["返事がないときの連投", "一つ送って待ちましょう。"], "a_early": ["早すぎる告白・プライベートな質問", "年収・元恋人・家庭の事情はまだ早いです。"], "a_money": ["送金・口座・認証番号の共有", "どんな理由でも応じず通報を。"], "a_advice": ["急なアドバイス・比較", "共感ではなく判断に聞こえます。"], "a_cold": ["短い返事・遅い返信で応じる", "相手が積極的なのに短く返すと関心がないと誤解されます。"]}, "vi": {"ri_title": "Phân tích mối quan hệ", "ri_stage_set": "Giai đoạn bạn đặt", "ri_stage_read": "Giai đoạn theo cuộc trò chuyện", "ri_why": "Vì sao là giai đoạn này", "ri_apply": "Đổi sang giai đoạn này", "ri_signals": "Tín hiệu của họ", "ri_next": "Nên thử tiếp", "ri_avoid": "Nên tránh lúc này", "ri_ai": "Phân tích chi tiết bằng AI", "ri_ai_busy": "AI đang phân tích…", "ri_ai_at": "Phân tích AI {t}", "ri_basic": "Tính từ lịch sử trò chuyện. Bấm phân tích AI để được giải thích chi tiết dựa trên tin nhắn thật.", "ri_few": "Mới có {n} tin nhắn, trò chuyện thêm vài lần sẽ chính xác hơn.", "w_count": "{n} tin nhắn · trò chuyện {days}/{d} ngày", "w_aff": "{n} lần bày tỏ tình cảm", "w_inv": "{n} lần rủ gặp/hẹn", "w_init": "Họ nhắn trước {p}% số ngày", "w_reply": "Họ thường trả lời sau {m} phút", "w_q": "{p}% tin của họ là câu hỏi", "w_busy": "'Bận / lần sau' {n} lần", "s_faster": ["Trả lời nhanh hơn", "Trước khoảng {a} phút → gần đây {b} phút. Họ bắt đầu ưu tiên cuộc trò chuyện."], "s_slower": ["Trả lời chậm hơn", "{a} phút → {b} phút. Có thể bận hoặc ít quan tâm hơn. Gửi tin ngắn có câu hỏi rồi xem phản ứng."], "s_init": ["Họ hay nhắn trước", "Họ bắt đầu {p}% số ngày trò chuyện. Họ muốn tiếp tục."], "s_noinit": ["Chủ yếu bạn nhắn trước", "Họ chỉ bắt đầu {p}%. Giãn cách một chút xem họ có nhắn trước không."], "s_longer": ["Tin nhắn dài hơn", "{a} → {b} ký tự. Họ đang cởi mở hơn."], "s_shorter": ["Tin nhắn ngắn hơn", "{a} → {b} ký tự. Có thể mệt hoặc chủ đề không hợp — đổi sang điều họ thích."], "s_emoji": ["Nhiều emoji và tiếng cười hơn", "{a}% → {b}%. Cuộc trò chuyện thoải mái hơn."], "s_q": ["Họ hỏi về bạn nhiều", "{p}% tin của họ là câu hỏi — dấu hiệu quan tâm."], "s_aff": ["Có bày tỏ tình cảm", "{n} lần. Đáp lại cùng độ ấm áp sẽ gần nhau hơn."], "s_inv": ["Họ rủ gặp", "{n} lần. Trả lời bằng thời gian, địa điểm cụ thể."], "s_busy": ["Lặp lại 'bận / lần sau'", "{n} lần. Có thể bận thật, nhưng nếu không đề nghị ngày khác thì có thể đang giữ khoảng cách."], "s_neg": ["Họ kể chuyện khó khăn", "{n} lần. Đó là tin tưởng — đồng cảm trước, khuyên sau."], "s_silent": ["{n} ngày không trò chuyện", "Tin cuối là {who}. Mở lại bằng lời hỏi thăm nhẹ hoặc chuyện cũ."], "s_money": ["Có nhắc chuyện tiền", "{n} lần. Yêu cầu chuyển tiền, đầu tư thường là lừa đảo — đừng gửi."], "who_me": "của bạn", "who_them": "của họ", "n_meet": ["Đề nghị gặp cụ thể", "Họ đang tích cực. Đề nghị một ngày, giờ và địa điểm rõ ràng."], "n_light": ["Hỏi thăm ngắn, không áp lực", "Họ nói bận. Gửi tin không cần trả lời, để họ chọn ngày."], "n_empathy": ["Đồng cảm trước", "Lắng nghe: 'Chắc mệt lắm, có chuyện gì vậy?' Chỉ khuyên khi được hỏi."], "n_answer": ["Trả lời kỹ và hỏi lại", "Họ hỏi về bạn nhiều — kể thêm một chút và hỏi lại."], "n_reopen": ["Mở lại bằng chuyện cũ", "Hỏi về điều họ từng kể — tự nhiên và chu đáo."], "n_space": ["Giãn cách một chút", "Bạn liên tục nhắn trước. Chờ một hai ngày."], "n_up": ["Tiến thêm một bước", "Tín hiệu tốt. Khen cụ thể hoặc hẹn một kế hoạch riêng cho hai người."], "a_push": ["Hối thúc · 'Sao không trả lời?'", "Gây áp lực cho người đang bận."], "a_spam": ["Nhắn liên tục khi họ im lặng", "Gửi một tin rồi chờ."], "a_early": ["Tỏ tình hay hỏi chuyện riêng quá sớm", "Lương, người yêu cũ, chuyện gia đình — còn sớm."], "a_money": ["Chuyển tiền, số tài khoản, mã xác minh", "Không bao giờ — hãy báo cáo."], "a_advice": ["Khuyên vội hoặc so sánh", "Nghe như phán xét chứ không phải đồng cảm."], "a_cold": ["Đáp lại ngắn và chậm", "Họ đang tích cực, trả lời ngắn dễ bị hiểu là không quan tâm."]}};
  Object.keys(REL_T).forEach((l) => Object.assign(T[l], REL_T[l]));

  const fillT = (s, o) => String(s).replace(/\{(\w+)\}/g, (m, k) => (o && o[k] !== undefined ? o[k] : m));
  // 규칙 기반 관계 분석 (AI 없이도 동작)
  function relInsight(c, ms) {
    const m = Engine.relationMetrics(ms);
    const rel = c.relation || 'friend'; const stages = STAGES[rel];
    const pct = (x) => Math.round(x * 100);
    const sig = [];
    const S = (k, tone, o) => { const v = t(k); const arr = Array.isArray(v) ? v : [v, '']; sig.push({ tone, title: fillT(arr[0], o), detail: fillT(arr[1], o) }); };
    if (m.replyA && m.replyB && m.nin >= 6) { if (m.replyB < m.replyA * 0.7) S('s_faster', 'good', { a: m.replyA, b: m.replyB }); else if (m.replyB > m.replyA * 1.5) S('s_slower', 'warn', { a: m.replyA, b: m.replyB }); }
    if (m.days >= 3) { if (m.initiative >= 0.5) S('s_init', 'good', { p: pct(m.initiative) }); else if (m.initiative < 0.25) S('s_noinit', 'warn', { p: pct(m.initiative) }); }
    if (m.lenA && m.lenB && m.nin >= 6) { if (m.lenB > m.lenA * 1.3) S('s_longer', 'good', { a: m.lenA, b: m.lenB }); else if (m.lenB < m.lenA * 0.7) S('s_shorter', 'warn', { a: m.lenA, b: m.lenB }); }
    if (m.nin >= 6 && m.emoB > m.emoA + 0.15) S('s_emoji', 'good', { a: pct(m.emoA), b: pct(m.emoB) });
    if (m.nin >= 4 && m.qRate >= 0.3) S('s_q', 'good', { p: pct(m.qRate) });
    if (m.affection) S('s_aff', 'good', { n: m.affection });
    if (m.invite) S('s_inv', 'good', { n: m.invite });
    if (m.busy >= 2) S('s_busy', 'warn', { n: m.busy });
    if (m.negative) S('s_neg', 'neutral', { n: m.negative });
    if (m.silent >= 4) S('s_silent', 'warn', { n: m.silent, who: t(m.lastDir === 'out' ? 'who_me' : 'who_them') });
    if (m.money) S('s_money', 'warn', { n: m.money });
    // 대화로 본 단계
    let st = 0;
    if (rel === 'romance') { if (m.n >= 10 || m.days >= 3) st = 1; if ((m.affection >= 1 || (m.emoB > 0.3 && m.qRate > 0.25)) && m.days >= 3) st = 2; if (m.affection >= 3 && m.invite >= 1) st = 3; if (m.affection >= 6 && m.span >= 14) st = 4; }
    else if (rel === 'friend') { if (m.n >= 10) st = 1; if (m.days >= 7 && (m.invite >= 1 || m.negative >= 1)) st = 2; if (m.span >= 21 && m.initiative >= 0.4 && m.n >= 40) st = 3; }
    else { if (m.n >= 6) st = 1; if (m.days >= 5 && (m.thanks >= 1 || m.invite >= 1)) st = 2; if (m.span >= 30 && m.n >= 30) st = 3; }
    st = Math.min(st, stages.length - 1);
    const why = [fillT(t('w_count'), { n: m.n, d: m.span || 1, days: m.days })];
    if (m.affection) why.push(fillT(t('w_aff'), { n: m.affection }));
    if (m.invite) why.push(fillT(t('w_inv'), { n: m.invite }));
    if (m.days >= 2) why.push(fillT(t('w_init'), { p: pct(m.initiative) }));
    if (m.replyB) why.push(fillT(t('w_reply'), { m: m.replyB }));
    if (m.nin >= 4) why.push(fillT(t('w_q'), { p: pct(m.qRate) }));
    if (m.busy) why.push(fillT(t('w_busy'), { n: m.busy }));
    // 다음에 해볼 것 / 피할 것
    const tips = (COACH[uiLang] || COACH.en)[stages[Math.min(c.stage || 0, stages.length - 1)]];
    const nx = [], av = [];
    const N = (k) => { const v = t(k); nx.push({ title: v[0], detail: v[1] }); };
    const A = (k) => { const v = t(k); av.push({ say: v[0], why: v[1] }); };
    if (m.money) A('a_money');
    if (m.negative) { N('n_empathy'); A('a_advice'); }
    if (m.busy >= 2) { N('n_light'); A('a_push'); }
    if (m.silent >= 4) { N('n_reopen'); if (m.lastDir === 'out') A('a_spam'); }
    if (m.days >= 3 && m.initiative < 0.25) N('n_space');
    if ((m.invite || (m.replyB && m.replyA && m.replyB < m.replyA * 0.7) || m.initiative >= 0.5) && rel !== 'business') N('n_meet');
    if (m.qRate >= 0.3) N('n_answer');
    if ((m.initiative >= 0.5 || m.qRate >= 0.3) && rel !== 'business') A('a_cold');
    if (st > (c.stage || 0) && rel !== 'business') N('n_up');
    if ((c.stage || 0) <= 1 && rel === 'romance') A('a_early');
    const curName = STAGE_NAMES[uiLang][stages[Math.min(c.stage || 0, stages.length - 1)]];
    nx.push({ title: '📍 ' + curName, detail: tips[0] }); av.push({ say: tips[1], why: '📍 ' + curName });
    return { m, st, stages, why, signals: sig, next: nx.slice(0, 5), avoid: av.slice(0, 5) };
  }
  function relInsightHtml(c, ins, ai) {
    const D = ai || ins; const stName = (k) => esc(STAGE_NAMES[uiLang][k] || k);
    const aiStageIdx = ai && ai.stage ? ins.stages.findIndex((k) => STAGE_NAMES[uiLang][k] === ai.stage || STAGE_NAMES.en[k] === ai.stage || k === ai.stage) : -1;
    const readIdx = aiStageIdx >= 0 ? aiStageIdx : ins.st;
    const curIdx = Math.min(c.stage || 0, ins.stages.length - 1);
    const sigs = (ai && ai.signals) || ins.signals; const why = (ai && ai.why) || ins.why; const nx = (ai && ai.next) || ins.next; const av = (ai && ai.avoid) || ins.avoid;
    const toneIc = { good: '✅', warn: '⚠', neutral: '💬' };
    return `<div class="card stack ri-card">
      <div class="between wrap"><h2>🔎 ${t('ri_title')}</h2><span class="tiny muted">${ai && c.aiRel ? esc(fillT(t('ri_ai_at'), { t: shortTs(c.aiRel.at) })) : ''}</span></div>
      ${ins.m.n < 8 ? `<p class="small muted">${esc(fillT(t('ri_few'), { n: ins.m.n }))}</p>` : ''}
      <div class="ri-stage"><div><span class="label">${t('ri_stage_set')}</span><b>${stName(ins.stages[curIdx])}</b></div><span class="ri-arrow">→</span><div><span class="label">${t('ri_stage_read')}</span><b>${stName(ins.stages[readIdx])}</b></div>${readIdx !== curIdx ? `<button class="btn sm" type="button" data-stage="${readIdx}">${t('ri_apply')}</button>` : ''}</div>
      <div><h3>${t('ri_why')}</h3><ul class="ri-list">${why.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></div>
      <div><h3>${t('ri_signals')}</h3>${sigs.length ? `<div class="ri-sigs">${sigs.map((s) => `<div class="ri-sig ${esc(s.tone || 'neutral')}"><b>${toneIc[s.tone] || '💬'} ${esc(s.title)}</b><p>${esc(s.detail || '')}</p></div>`).join('')}</div>` : `<p class="small muted">—</p>`}</div>
      <div class="two ri-two"><div class="ri-box next"><h3>👉 ${t('ri_next')}</h3>${nx.map((x) => `<div class="ri-item"><b>${esc(x.title)}</b><p>${esc(x.detail || '')}</p></div>`).join('')}</div>
        <div class="ri-box avoid"><h3>🚫 ${t('ri_avoid')}</h3>${av.map((x) => `<div class="ri-item"><b>${esc(x.say)}</b>${x.why ? `<p>${esc(x.why)}</p>` : ''}</div>`).join('')}</div></div>
      <div class="between wrap"><p class="tiny muted">${ai ? '' : t('ri_basic')}</p>${Engine.aiConfig().key ? `<button class="btn secondary sm" type="button" id="ri-ai">✨ ${t('ri_ai')}</button>` : ''}</div>
    </div>`;
  }
  function renderCoach(r) {
    if (!Store.contact(r.id)) { const u0 = Store.me(); const fb = Store.contact(helperState.contactId) || u0.contacts[0]; if (fb) return go('#/coach/' + fb.id); }
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
        ${relInsightHtml(c, relInsight(c, ms), c.aiRel && c.aiRel.ui === uiLang && c.aiRel.rel === rel ? c.aiRel.data : null)}${lastIn ? `<p class="small muted">${t('coach_basis')} · ${esc(fmtTs(lastIn.ts))} "${esc((lastIn.translation || lastIn.text).slice(0, 60))}"</p>` : ''}
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
    const rib = document.getElementById('ri-ai');
    if (rib) rib.addEventListener('click', async () => { rib.disabled = true; rib.textContent = t('ri_ai_busy'); try { const ins = relInsight(c, ms); const data = await Engine.aiRelation({ uiLang, relation: rel, stages: stages.map((k) => STAGE_NAMES[uiLang][k]), current: STAGE_NAMES[uiLang][stages[stage]], contact: c, age: ageOf(c), metrics: ins.m, messages: ms }); Store.updateContact(c.id, { aiRel: { at: Date.now(), ui: uiLang, rel, data } }); } catch (e) { toast(t('set_ai_fail') + ' (' + e.message + ')'); } renderCoach(r); });
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
        <div class="auto-row"><label class="small row" style="gap:6px"><input type="checkbox" id="ag-auto" ${(u.settings || {}).autoOrg !== false ? 'checked' : ''}> 🤖 ${t('auto_l')}</label><span class="tiny muted">${(u.settings || {}).autoOrgAt ? esc(t('auto_last', { t: shortTs((u.settings || {}).autoOrgAt) })) : ''}</span><button class="btn sm secondary" type="button" id="ag-auto-now">${t('auto_now')}</button></div>
        ${calendarHtml(u)}
        <div class="stack-sm"><h2>${t('today_h')} · <span class="muted" style="font-weight:600">${fmtDateW(td)}</span></h2></div>
        ${items.filter((i) => i.kind !== 'upcoming').length ? `<ul class="list card" style="padding-block:4px">${items.filter((i) => i.kind !== 'upcoming').map(itemHtml).join('')}</ul>` : `<div class="empty small">${t('nothing_today')}</div>`}
        ${notifState !== 'granted' && notifState !== 'na' ? `<button class="btn subtle full" type="button" id="ag-notif">${icon('bell')} ${t('notif_enable')}</button>` : ''}
        <div class="stack-sm"><h2>${t('upcoming')}</h2>
          ${all.length ? `<div class="stack-sm">${all.map((p) => {
            const c = u.contacts.find((x) => x.id === p.contactId);
            const late = !p.done && p.date < td;
            return `<div class="card stack-sm ${c ? 'edge-' + c.color : ''}" style="${p.done ? 'opacity:.6' : ''}">
              <div class="row">${c ? avatar(c) : `<span class="avatar">${icon('calendar')}</span>`}<div class="grow">${c ? `<span class="label">${esc(whoText(c))}</span>` : ''}<h3>${late ? `<span class="badge alert">${t('overdue')}</span> ` : ''}${p.done ? '✓ ' : ''}${fmtDateW(p.date)} ${esc(p.time || '')} · ${esc(p.title)}${p.auto ? ` <span class="badge lilac">🤖 ${t('auto_badge')}</span>` : ''}</h3>${p.place ? `<p class="small muted">${esc(p.place)}</p>` : ''}</div></div>
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
    if (!Store.contact(r.id)) { const u0 = Store.me(); const fb = Store.contact(helperState.contactId) || u0.contacts[0]; if (fb) return go('#/saju/' + fb.id); }
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
        ${ai.source === 'own' || (ai.source !== 'hq' && (() => { const tm = Store.teamOf(u.id); const og = tm && tm.orgId ? Store.orgById(tm.orgId) : null; return !!(og && og.allowOwnKey); })()) ? `        <form class="card stack" id="st-ai">
          <h2>${t('set_ai')} ${ai.key ? '<span class="badge">✓ ' + t('ai_on') + '</span>' : ''}</h2>
          <p class="small muted">${t('g_ai')} ${t('set_ai_hint')}</p>
          <label class="stack-xs"><span class="label">${t('set_provider')}</span><select class="field" name="provider" id="st-provider"><option value="openai" ${ai.provider !== 'anthropic' ? 'selected' : ''}>OpenAI (ChatGPT)</option><option value="anthropic" ${ai.provider === 'anthropic' ? 'selected' : ''}>Claude (Anthropic)</option></select></label>
          <div class="ai-steps"><strong class="small">${t('ai_steps_t')}</strong><ol class="small muted"><li>${t('ai_s1')}</li><li>${t('ai_s2')}</li><li>${t('ai_s3')}</li><li id="st-ai-s4">${ai.provider === 'anthropic' ? t('ai_s4c') : t('ai_s4')}</li></ol>
            <a class="btn secondary full" id="st-ai-link" href="${ai.provider === 'anthropic' ? 'https://console.anthropic.com/settings/keys' : 'https://platform.openai.com/api-keys'}" target="_blank" rel="noopener">${ai.provider === 'anthropic' ? t('ai_get_claude') : t('ai_get_openai')} ↗</a></div>
          <label class="stack-xs"><span class="label">${t('set_key')}</span><input class="field" name="key" type="password" autocomplete="off" value="${esc(ai.key || '')}" placeholder="${ai.provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}"></label>
          <details><summary class="small muted">${t('set_model')}</summary><input class="field" name="model" value="${esc(ai.model || '')}" placeholder="gpt-4o-mini / claude-haiku-5-5" style="margin-top:6px"></details>
          <div class="two"><button class="btn secondary" type="button" id="st-ai-test">${t('set_test')}</button><button class="btn" type="submit">${t('save')}</button></div>
        </form>` : `<div class="card stack-sm" id="st-ai-hq">
          <h2>${t('ai_hq_title')} ${ai.source === 'hq' ? '<span class="badge">✓ ' + t('ai_hq_on') + '</span>' : ''}</h2>
          <p class="small muted">${ai.source === 'hq' ? t('ai_hq_desc') : ai.source === 'locked' ? t('ai_hq_locked') : t('ai_hq_none')}</p>
          <p class="small"><b>${t('my_plan')}</b> ${esc(t('plan_' + Store.planOf(u)))}</p>
        </div>`}

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
    document.getElementById('st-lang').addEventListener('change', (e) => { u.lang = e.target.value; uiLang = u.lang; Store.save(); renderSettings(); setTimeout(() => { try { runDigests(); } catch (x) {} }, 300); });
    const reg = document.getElementById('st-reg');
    if (reg) reg.addEventListener('click', () => { const n = document.getElementById('st-nick').value.trim(); if (!n) { toast(t('ob_need_nick')); return; } Store.upgradeToMember(n); toast(t('set_saved')); renderSettings(); });
    document.getElementById('st-me').addEventListener('submit', (e) => { e.preventDefault(); const f = new FormData(e.target); u.me = Object.assign({}, u.me, { birth: f.get('birth'), birthTime: f.get('birthTime'), lunar: !!f.get('lunar'), blood: f.get('blood'), mbti: f.get('mbti'), gender: f.get('gender') }); Store.save(); toast(t('set_saved')); });
    $app.querySelectorAll('[data-n]').forEach((cb) => cb.addEventListener('change', () => { u.settings.notif[cb.dataset.n] = cb.checked; Store.save(); }));
    document.getElementById('st-push').addEventListener('click', askNotify);
    const aiForm = document.getElementById('st-ai');
    if (aiForm) {
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
    }
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
  Engine.setPlanResolver(() => { if (/^#\/admin/.test(location.hash)) return { plan: 'business', admin: true }; const u = Store.me(); if (!u) return { plan: 'free' }; const tm = Store.teamOf(u.id); const og = tm && tm.orgId ? Store.orgById(tm.orgId) : null; return { plan: Store.planOf(u), byo: !!(og && og.allowOwnKey) }; });
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
