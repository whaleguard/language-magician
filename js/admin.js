/* 상담매직 — 운영(관리자) 콘솔 · 한국어 UI */
(function () {
  'use strict';

  const $app = document.getElementById('app');
  const esc = (s) => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (n, c) => `<svg class="icon ${c || ''}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const APPN = (id) => (DATA.APPS.find((a) => a.id === id) || { name: id || '기타' }).name;
  const LN = (l) => ({ ko: '한국어', zh: '중국어', 'zh-TW': '중국어(번체)', ja: '일본어', vi: '베트남어', en: '영어', th: '태국어', id: '인도네시아어', es: '스페인어', ru: '러시아어', mn: '몽골어', uz: '우즈베크어', ne: '네팔어', tl: '필리핀어', hi: '힌디어', ar: '아랍어', fr: '프랑스어', de: '독일어', pt: '포르투갈어' }[l] || l);
  const REL = { romance: '연인 목표', friend: '친구', business: '비즈니스', family: '가족·친척', colleague: '직장 동료', customer: '고객 상담', exchange: '언어 교환', acquaint: '이웃·지인' };
  const STAGE_KO = I18N.STAGE_NAMES.ko;
  const REASON = { money: '금전 요구·투자 권유', harass: '괴롭힘·혐오', sexual: '음란·성적 요구', fake: '사칭·거짓 정보', other: '기타' };
  const fmt = (ts) => { const d = new Date(ts); return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const fmtD = (ts) => { const d = new Date(ts); return `${d.getMonth() + 1}월 ${d.getDate()}일`; };
  const daysAgo = (ts) => Math.max(0, Math.floor((Date.now() - ts) / 86400000));

  let authed = sessionStorage.getItem('lm_admin_ok') === '1';
  // 권한: admin(전체) | leader:<teamId>(자기 팀만)
  function role() { const r = sessionStorage.getItem('lm_admin_role') || 'admin'; if (r.startsWith('hq:')) { const x = Store.staffById(r.slice(3)); return x ? { type: x.type === 'business' ? 'hqb' : 'hqp', staff: x, name: x.name || x.loginId } : { type: 'none' }; } if (r.startsWith('org:')) { const g = Store.orgById(r.slice(4)); return g ? { type: 'org', org: g, name: g.adminName || g.loginId } : { type: 'none' }; } if (r.startsWith('leader:')) { const t = Store.teamById(r.slice(7)); return t ? { type: 'leader', team: t, name: t.leaderName || t.loginId } : { type: 'none' }; } return { type: 'admin', name: '관리자' }; }
  const isLeader = () => role().type === 'leader';
  const isOrg = () => role().type === 'org';
  const isSuper = () => role().type === 'admin';
  const isHqp = () => role().type === 'hqp';
  const isHqb = () => role().type === 'hqb';
  const scopedTeams = () => { const r = role(); return r.type === 'org' ? Store.teamsOfOrg(r.org.id) : r.type === 'leader' ? [r.team] : Store.teams(); };
  let serverUsers = null; // 서버에서 가져온 회원
  let serverShared = null;
  const viewGrants = {}; // 이번 세션에서 열람 사유를 기록한 대화

  function users() {
    const all = allUsers();
    const r = role();
    if (r.type === 'leader') { const ids = new Set(r.team.members || []); return all.filter((u) => ids.has(u.id)); }
    if (r.type === 'org') { const ids = new Set(Store.teamsOfOrg(r.org.id).flatMap((t) => t.members || [])); return all.filter((u) => ids.has(u.id)); }
    if (r.type === 'hqp') return all.filter((u) => !Store.teamOf(u.id));
    if (r.type === 'hqb') return all.filter((u) => !!Store.teamOf(u.id));
    return all;
  }
  function allUsers() {
    const local = Object.values(Store.db.users);
    if (!serverUsers) return local;
    const map = {};
    local.filter((u) => u.demo).forEach((u) => { map[u.id] = u; });
    serverUsers.forEach((u) => { map[u.id] = u; });
    local.filter((u) => !u.demo && !map[u.id]).forEach((u) => { map[u.id] = u; });
    return Object.values(map);
  }
  function reports() { const all = (serverShared && serverShared.reports ? serverShared.reports.concat(Store.db.reports.filter((r) => r.demo)) : Store.db.reports); if (isSuper()) return all; const ids = new Set(users().map((u) => u.id)); return all.filter((x) => ids.has(x.userId)); }
  function findUser(id) { return users().find((u) => u.id === id); }
  function msgsOf(u, cid) { return u.messages.filter((m) => m.contactId === cid).sort((a, b) => a.ts - b.ts); }

  function memberStats(u) {
    const contacts = u.contacts.map((c) => {
      const ms = msgsOf(u, c.id);
      const pf = Engine.profile(ms);
      const risk = ms.filter((m) => (m.risk && m.risk.length) || /money|offplatform/.test((m.intents || []).join(','))).length;
      const span = ms.length ? Math.max(0, Math.round((ms[ms.length - 1].ts - ms[0].ts) / 86400000)) : 0;
      return { c, ms, pf, risk, span, last: ms.length ? ms[ms.length - 1].ts : null, first: ms.length ? ms[0].ts : null };
    });
    const apps = {};
    u.messages.forEach((m) => { const c = u.contacts.find((x) => x.id === m.contactId); const k = c ? c.app : '미지정'; apps[k] = (apps[k] || 0) + 1; });
    const risk = contacts.reduce((a, x) => a + x.risk, 0);
    const reps = reports().filter((r) => r.userId === u.id && r.status !== 'closed').length;
    const lastTs = u.messages.length ? Math.max(...u.messages.map((m) => m.ts)) : u.lastActive || u.createdAt;
    return { contacts, apps, risk, reps, lastTs, msgCount: u.messages.length, avgDepth: contacts.length ? Math.round(contacts.reduce((a, x) => a + x.pf.depth, 0) / contacts.length) : 0 };
  }

  function nav(active) {
    const rl = role();
    const unreadR = Store.db.notices ? Store.db.notices.filter((n) => n.from === 'member' && !n.readAt && users().some((u) => u.id === n.userId)).length : 0;
    const msgL = '메시지' + (unreadR ? ` <span class="nav-dot">${unreadR}</span>` : '');
    const items = rl.type === 'hqp'
      ? [['dashboard', '일반고객 현황'], ['users', '일반 회원'], ['monitor', '회원 대화'], ['notices', msgL], ['reports', '신고 처리'], ['quality', '개선 메모'], ['audit', '열람·캡처 기록'], ['ai', 'AI 사용량']]
      : rl.type === 'hqb'
      ? [['dashboard', '기업고객 현황'], ['orgs', '거래처'], ['teams', '팀·팀장'], ['users', '상담원'], ['attendance', '근태'], ['monitor', '상담원 대화'], ['notices', msgL], ['reports', '신고'], ['audit', '열람·캡처 기록'], ['ai', 'AI 사용량']]
      : rl.type === 'org'
      ? [['dashboard', '회사 현황'], ['teams', '팀·팀장'], ['users', '상담원'], ['attendance', '근태'], ['monitor', '상담원 대화'], ['notices', msgL], ['reports', '신고'], ['audit', '열람·캡처 기록'], ['ai', 'AI 사용량']]
      : rl.type === 'leader'
      ? [['dashboard', '팀 현황'], ['users', '팀원'], ['attendance', '근태'], ['monitor', '팀원 대화'], ['notices', msgL], ['reports', '신고'], ['audit', '열람·캡처 기록'], ['ai', 'AI 사용량']]
      : [['dashboard', '운영 현황'], ['users', '회원 CRM'], ['monitor', '전체 대화'], ['notices', msgL], ['orgs', '거래처'], ['teams', '팀·팀장'], ['attendance', '근태'], ['staff', '관리자 계정'], ['reports', '신고 처리'], ['quality', '개선 메모'], ['audit', '감사로그·캡처'], ['ai', 'AI 사용량'], ['settings', '운영 설정']];
    // 메뉴를 그룹으로 묶고, 선택한 그룹의 하위 메뉴는 아래 탭으로
    const GROUP = { dashboard: 'home', attendance: 'people', users: 'people', monitor: 'people', notices: 'people', orgs: 'org', teams: 'org', staff: 'org', reports: 'safe', quality: 'safe', audit: 'safe', ai: 'sys', settings: 'sys' };
    const GL = { home: '현황', people: rl.type === 'hqp' ? '회원' : rl.type === 'admin' ? '회원·상담원' : '상담원', org: '조직', safe: '신고·기록', sys: 'AI·설정' };
    const groups = []; items.forEach(([k]) => { const g = GROUP[k] || 'home'; if (!groups.includes(g)) groups.push(g); });
    const ag = GROUP[active] || 'home';
    const sub = items.filter(([k]) => (GROUP[k] || 'home') === ag);
    const gUnread = (g) => g === 'people' && unreadR ? ` <span class="nav-dot">${unreadR}</span>` : '';
    return `<header class="top between wrap">
      <a class="brand" href="#/admin/dashboard"><img class="brand-img" src="assets/lm-mark.png" alt="LM">상담매직 ${rl.type === 'leader' ? '팀장 콘솔' : rl.type === 'org' ? '거래처 관리' : rl.type === 'hqp' ? '본사 · 일반고객 관리' : rl.type === 'hqb' ? '본사 · 기업고객 관리' : '본사 · 최종 관리자'}${rl.type === 'leader' ? ` <span class="badge">${esc(rl.team.name)} · ${esc(rl.name)}</span>` : rl.type === 'org' ? ` <span class="badge">${esc(rl.org.name)} · ${esc(rl.name)}</span>` : (rl.type === 'hqp' || rl.type === 'hqb') ? ` <span class="badge">${esc(rl.name)}</span>` : ''}</a>
      <nav class="admin-menu" aria-label="관리자 메뉴">${groups.map((g) => { const first = items.find(([k]) => (GROUP[k] || 'home') === g); return `<a href="#/admin/${first[0]}" ${ag === g ? 'aria-current="page"' : ''}>${GL[g]}${gUnread(g)}</a>`; }).join('')}<a href="#/home" class="muted">앱으로</a><button type="button" class="link muted" id="adm-logout" style="min-height:0">로그아웃</button></nav>
    </header>${sub.length > 1 ? `<nav class="admin-sub" aria-label="하위 메뉴">${sub.map(([k, l]) => `<a href="#/admin/${k}" ${active === k ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>` : ''}`;
  }
  function page(active, inner) {
    $app.innerHTML = `<div class="screen admin" lang="ko">${nav(active)}<div class="content stack-lg">${serverUsers ? '<span class="badge">서버 동기화 데이터 표시 중</span>' : (Store.Sync.enabled() ? '<span class="badge">공용 서버 연결됨 · 다른 PC의 팀·상담원·지시가 자동 동기화됩니다 (6초)</span>' : '<span class="badge gray">이 기기 데이터 + 데모 회원 표시 중 · 운영 설정에서 서버를 연결하면 모든 회원 대화가 모입니다</span>')}${inner}</div></div>`;
  }

  /* ---------- 로그인 ---------- */
  function login() {
    $app.innerHTML = `<div class="screen admin" lang="ko"><div class="content stack-lg" style="max-width:420px;margin:8vh auto">
      <span class="brand"><img class="brand-img" src="assets/lm-mark.png" alt="LM">상담매직 운영</span>
      <form class="card stack" id="al"><h1>관리자 로그인</h1><p class="small muted">아이디와 비밀번호를 입력하세요. 모든 대화 열람은 감사로그에 기록됩니다.</p>
        <label class="stack-xs"><span class="label">아이디</span><input class="field" name="id" value="admin" autocomplete="username"></label>
        <label class="stack-xs"><span class="label">비밀번호</span><input class="field" name="pin" type="password" autocomplete="current-password" value=""></label>
        <button class="btn full" type="submit">로그인</button>
        <p class="tiny muted">상담원은 <a class="link" href="#/agent">상담원 로그인</a> · 테스트 버전 · 최종 admin · 일반고객 personal1 · 기업고객 business1 · 거래처 company1 · 팀장 leader1 (비밀번호 모두 1234)</p>
      </form><a class="link" href="#/home">← 앱으로</a></div></div>`;
    document.getElementById('al').addEventListener('submit', async (e) => {
      e.preventDefault(); Store.reload(); const f = new FormData(e.target);
      // 이 기기에 없는 아이디면 공용 서버에서 받아온 뒤 다시 확인 (다른 PC에서 만든 팀장·거래처)
      if (!Store.whoHasId(f.get('id')) && Store.Sync.enabled()) { const bt = e.target.querySelector('button[type=submit]'); bt.disabled = true; bt.textContent = '서버 확인 중…'; try { await Store.Sync.pull(); } catch (x) { /* noop */ } bt.disabled = false; bt.textContent = '로그인'; }
      Store.ensureDemoMembers();
      const sf = Store.staffLogin(f.get('id'), f.get('pin'));
      if (sf) {
        Store.db.admin.operator = (sf.type === 'business' ? '기업고객 관리자 ' : '일반고객 관리자 ') + (sf.name || sf.loginId) + ' (' + sf.loginId + ')'; Store.db.admin.orgId = ''; Store.persist();
        authed = true; sessionStorage.setItem('lm_admin_ok', '1'); sessionStorage.setItem('lm_admin_role', 'hq:' + sf.id);
        Store.audit({ action: 'login', target: sf.id, reason: (sf.type === 'business' ? '기업고객' : '일반고객') + ' 관리자 로그인' });
        location.hash = '#/admin/dashboard'; return;
      }
      const og = Store.orgLogin(f.get('id'), f.get('pin'));
      if (og) {
        Store.db.admin.operator = '기업관리자 ' + (og.adminName || og.loginId) + ' (' + og.loginId + ')'; Store.db.admin.orgId = og.id; Store.persist();
        authed = true; sessionStorage.setItem('lm_admin_ok', '1'); sessionStorage.setItem('lm_admin_role', 'org:' + og.id);
        Store.audit({ action: 'login', target: og.id, reason: '기업 관리자 로그인 · ' + og.name });
        location.hash = '#/admin/dashboard'; return;
      }
      const lt = Store.leaderLogin(f.get('id'), f.get('pin'));
      if (lt && Store.normId(f.get('id')) !== String(Store.db.admin.loginId || 'admin').toLowerCase()) {
        Store.db.admin.operator = '팀장 ' + (lt.leaderName || lt.loginId) + ' (' + lt.loginId + ')'; Store.db.admin.orgId = lt.orgId || ''; Store.persist();
        authed = true; sessionStorage.setItem('lm_admin_ok', '1'); sessionStorage.setItem('lm_admin_role', 'leader:' + lt.id);
        Store.audit({ action: 'login', target: lt.id, reason: '팀장 로그인 · ' + lt.name });
        location.hash = '#/admin/dashboard'; return;
      }
      if (Store.normId(f.get('id')) === String(Store.db.admin.loginId || 'admin').toLowerCase() && String(f.get('pin') || '').trim() === String(Store.db.admin.pin)) {
        Store.db.admin.operator = 'admin'; Store.db.admin.orgId = ''; Store.persist(); sessionStorage.setItem('lm_admin_role', 'admin');
        authed = true; sessionStorage.setItem('lm_admin_ok', '1');
        Store.ensureDemoMembers();
        Store.audit({ action: 'login', target: '-', reason: '관리자 로그인' });
        location.hash = '#/admin/dashboard';
      } else {
        const who = Store.whoHasId(f.get('id'));
        LM.toast(who === 'agent' ? '상담원 계정입니다 · 앱 첫 화면의 「상담원 로그인」에서 로그인하세요' : who ? '비밀번호가 맞지 않습니다' : (Store.Sync.enabled() ? '없는 아이디입니다 (공용 서버에도 없음)' : '이 브라우저에 없는 아이디입니다'), 5000);
      }
    });
  }

  /* ---------- 운영 현황 ---------- */
  /* ---------- 관리자 모바일 모드: 운영 현황 한눈에 ---------- */
  function staffStatus(u, th) {
    const now = Date.now(); const d0 = new Date(); d0.setHours(0, 0, 0, 0);
    const today = (u.att || {})[Store.dkey(d0.getTime())];
    const cur = today && today.sessions[today.sessions.length - 1];
    const on = !!(today && today.lastBeat && now - today.lastBeat < 3 * 60000 && cur && !cur[2]);
    const lastAct = Math.max((today && today.lastBeat) || 0, ...u.messages.map((m) => m.ts), 0);
    const wl = u.contacts.map((c) => { const ms = u.messages.filter((m) => m.contactId === c.id); const l = ms.reduce((a, m) => (!a || m.ts > a.ts ? m : a), null); return l && l.dir === 'in' ? { ts: l.ts, cid: c.id, mid: l.id } : null; }).filter(Boolean).sort((a, b) => a.ts - b.ts);
    const waiting = wl.map((x) => x.ts);
    const overdue = waiting.filter((ts) => now - ts > th * 60000).length;
    const idle = on && now - lastAct > th * 60000;
    const state = on ? (idle ? 'idle' : 'on') : today && today.logoutAt ? 'out' : today ? 'away' : 'off';
    return { wfirst: wl[0] || null, state, online: today ? today.online : 0, first: today ? today.first : null, waiting: waiting.length, overdue, idle };
  }
  function mobileOps(r) {
    const rl = role(); const us = users(); const th = Number(r.q.th || 30);
    const d0 = new Date(); d0.setHours(0, 0, 0, 0);
    const list = us.map((u) => Object.assign({ u, team: Store.teamOf(u.id) }, staffStatus(u, th)));
    const C = (k) => list.filter((x) => x.state === k).length;
    const openRep = reports().filter((x) => x.status !== 'closed').length;
    const unreadR = (Store.db.notices || []).filter((n) => n.from === 'member' && !n.readAt && us.some((u) => u.id === n.userId)).length;
    const todayMsgs = us.reduce((a, u) => a + u.messages.filter((m) => m.ts >= d0.getTime()).length, 0);
    const fl = r.q.f || 'all';
    const ST = { on: ['접속 중', 'on'], idle: ['무응답', 'idle'], away: ['자리 비움', 'away'], out: ['로그아웃', 'off'], off: ['미접속', 'off'] };
    const staffMode = rl.type !== 'hqp';
    const shown = list.filter((x) => fl === 'all' || (fl === 'on' ? (x.state === 'on' || x.state === 'idle') : fl === 'alert' ? (x.idle || x.overdue) : x.state === fl)).sort((a, b) => ({ idle: 0, on: 1, away: 2, out: 3, off: 4 }[a.state] - { idle: 0, on: 1, away: 2, out: 3, off: 4 }[b.state]) || b.overdue - a.overdue);
    const hm = (ts) => { if (!ts) return '—'; const d = new Date(ts); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
    const tile = (n, l, tone, href) => `<a class="mo-tile ${tone || ''}" href="${href}"><b>${n}</b><span>${l}</span></a>`;
    $app.innerHTML = `<div class="screen admin mo-ops" lang="ko">
      <header class="mo-head"><div><b>상담매직 · 운영 한눈에</b><span>${esc(rl.type === 'leader' ? rl.team.name : rl.type === 'org' ? rl.org.name : rl.type === 'hqp' ? '일반고객' : rl.type === 'hqb' ? '기업고객' : '전체')} · ${hm(Date.now())} 기준</span></div><button type="button" class="link" id="adm-logout">로그아웃</button></header>
      <div class="mo-tiles">
        ${staffMode ? tile(C('on') + C('idle'), '접속 중', 'good', '#/admin/dashboard?f=on') + tile(C('idle'), `${th}분 무응답`, C('idle') ? 'warn' : '', '#/admin/dashboard?f=idle') + tile(list.reduce((a, x) => a + x.overdue, 0), '답장 지연', list.some((x) => x.overdue) ? 'warn' : '', '#/admin/dashboard?f=alert') : tile(us.length, '회원', '', '#/admin/users')}
        ${tile(unreadR, '미확인 답장', unreadR ? 'warn' : '', '#/admin/notices?f=waiting')}${tile(openRep, '미처리 신고', openRep ? 'warn' : '', '#/admin/reports')}${tile(todayMsgs, '오늘 메시지', '', '#/admin/monitor')}
      </div>
      ${staffMode ? `<div class="mo-filter">${[['all', '전체', list.length], ['on', '접속 중', C('on') + C('idle')], ['alert', '확인 필요', list.filter((x) => x.idle || x.overdue).length], ['away', '자리 비움', C('away')], ['off', '미접속', C('off') + C('out')]].map(([k, l, n]) => `<a href="#/admin/dashboard?f=${k}" class="${fl === k ? 'on' : ''}">${l} ${n}</a>`).join('')}</div>
      <ul class="mo-staff">${shown.map((x) => `<li><a href="${(x.overdue || x.waiting) && x.wfirst ? `#/admin/monitor?u=${x.u.id}&c=${x.wfirst.cid}&m=${x.wfirst.mid}&full=1` : '#/admin/notices?u=' + x.u.id}"><i class="dot ${ST[x.state][1]}"></i><span class="grow"><b>${esc(x.u.nickname)}</b> <em>${ST[x.state][0]}</em><br><small>${esc(x.team ? x.team.name : '')}${x.first ? ' · 첫 접속 ' + hm(x.first) : ''}${x.online ? ' · ' + Math.floor(x.online / 60) + '시간 ' + (x.online % 60) + '분' : ''}</small></span>${x.overdue ? `<span class="mo-badge warn">지연 ${x.overdue}</span>` : x.waiting ? `<span class="mo-badge">대기 ${x.waiting}</span>` : ''}</a></li>`).join('') || '<li class="mo-empty">해당 상담원이 없습니다.</li>'}</ul>` : ''}
      <nav class="mo-actions">${staffMode ? '<a href="#/admin/attendance">근태</a>' : '<a href="#/admin/users">회원</a>'}<a href="#/admin/notices">메시지</a><a href="#/admin/monitor">대화</a><a href="#/admin/dashboard?full=1">PC 화면</a></nav>
    </div>`;
  }
  function dashboard(r) {
    r = r || { q: {} };
    if (window.matchMedia('(max-width: 760px)').matches && !r.q.full) return mobileOps(r);
    const us = users();
    const DAY = 86400000; const now = Date.now();
    const d0 = new Date(); d0.setHours(0, 0, 0, 0); const td = d0.getTime();
    const yS = td - DAY, yE = now - DAY;
    const allMsgs = us.flatMap((u) => u.messages.map((m) => ({ m, u })));
    const P = prices();
    const uRows = usageRows();
    const inR = (ts, s, e) => ts >= s && ts < e;
    const activeIn = (s, e) => { const set = new Set(); allMsgs.forEach(({ m, u }) => { if (inR(m.ts, s, e)) set.add(u.id); }); return set; };
    const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
    const won = (n) => '₩' + Math.round(n).toLocaleString('ko-KR');
    const num = (n) => Number(n).toLocaleString('ko-KR');
    const delta = (cur, prev, upGood, unit) => {
      unit = unit || '';
      if (!prev && !cur) return '<span class="ops-delta" data-tone="neutral">어제와 같음 · 0' + unit + '</span>';
      if (!prev) return `<span class="ops-delta" data-tone="${upGood ? 'good' : 'attention'}">+${num(cur)}${unit} · 어제 0</span>`;
      const d = cur - prev; const p = Math.round((d / prev) * 100);
      if (d === 0) return '<span class="ops-delta" data-tone="neutral">어제와 같음</span>';
      const tone = d === 0 ? 'neutral' : (d > 0) === upGood ? 'good' : 'attention';
      return `<span class="ops-delta" data-tone="${tone}">${d > 0 ? '▲ +' : d < 0 ? '▼ ' : ''}${num(d)}${unit} (${p > 0 ? '+' : ''}${p}%)</span>`;
    };
    // KPI
    const actT = activeIn(td, now + 1), actY = activeIn(yS, yE);
    const actTm = [...actT].filter((id) => (findUser(id) || {}).type === 'member').length;
    const newT = us.filter((u) => inR(u.createdAt, td, now + 1)).length, newY = us.filter((u) => inR(u.createdAt, yS, yE)).length;
    const msgT = allMsgs.filter((x) => inR(x.m.ts, td, now + 1)).length, msgY = allMsgs.filter((x) => inR(x.m.ts, yS, yE)).length;
    const reps = reports(); const open = reps.filter((rp) => rp.status !== 'closed');
    const repT = reps.filter((rp) => inR(rp.createdAt, td, now + 1)).length, repY = reps.filter((rp) => inR(rp.createdAt, yS, yE)).length;
    const aiT = usageSummary(uRows.filter((x) => inR(x.x.ts, td, now + 1)), P), aiY = usageSummary(uRows.filter((x) => inR(x.x.ts, yS, yE)), P);
    const fx = fxRate();
    const members = us.filter((u) => u.type === 'member').length, guests = us.length - members;
    // 오늘 처리할 일
    const ago = (ts) => { const h = Math.floor((now - ts) / 3600000); return h >= 24 ? Math.floor(h / 24) + '일 전' : h >= 1 ? h + '시간 전' : '방금'; };
    const riskMsgs = allMsgs.filter((x) => x.m.risk && x.m.risk.length);
    const risk7 = riskMsgs.filter((x) => !x.m.reviewed);
    const banned = us.filter((u) => u.status === 'banned');
    const bannedRecent = banned.filter((u) => u.messages.some((m) => m.ts >= now - 7 * DAY));
    const auditT = Store.db.audit.filter((a) => a.ts >= td && /view|monitor|viewas/.test(a.action || ''));
    const silent = us.filter((u) => daysAgo(memberStats(u).lastTs) >= 7);
    const qOpen = Store.db.quality.filter((q) => q.status === 'open');
    const oldest = (arr, f) => (arr.length ? ago(Math.min(...arr.map(f))) : '');
    const queue = [
      [open.length, '미처리 신고', open.length ? '가장 오래된 건 ' + oldest(open, (x) => x.createdAt) : '', '#/admin/reports', 'attention'],
      [risk7.length, '미검토 위험 표시 대화', risk7.length ? '가장 오래된 건 ' + oldest(risk7, (x) => x.m.ts) : '', '#/admin/monitor?risk=1', 'attention'],
      (() => { let g = []; try { g = Store.duplicateCustomers(us.filter((x) => !x.demo)).filter((x) => !x.decided); } catch (e) { g = []; } return [g.length, '같은 고객 중복 상담 확인', g.length ? g.slice(0, 2).map((x) => APPN(x[0].app) + ' / ' + x[0].nick).join(', ') : '', '#/admin/monitor?dup=1', 'attention']; })(),
      (() => { const ids = new Set(us.map((u) => u.id)); const cp = Store.db.audit.filter((a) => a.action === 'capture' && a.ts >= now - 7 * DAY && (isSuper() || ids.has(a.target))); return [cp.length, '화면 캡처 시도 (7일)', cp.length ? '최근 ' + ago(cp[0].ts) + ' · ' + (cp[0].member || cp[0].operator || '') : '', '#/admin/audit?act=capture', 'attention']; })(),
      [bannedRecent.length, '차단 회원의 최근 기록', banned.length ? '차단 회원 ' + banned.length + '명' : '', '#/admin/users?type=banned', 'info'],
      [auditT.length, '오늘 대화 열람 로그 확인', '', '#/admin/audit', 'info'],
      [silent.length, '7일 이상 대화가 끊긴 회원', '', '#/admin/users', 'neutral'],
      [qOpen.length, '개선 메모 처리', '', '#/admin/quality', 'neutral'],
      [(Store.db.notices || []).filter((n) => n.from === 'member' && !n.readAt && us.some((u) => u.id === n.userId)).length, '확인 안 한 상담원 답장', '', '#/admin/notices', 'info'],
      [(Store.db.notices || []).filter((n) => n.from !== 'member' && !n.readAt && us.some((u) => u.id === n.userId)).length, '상대가 아직 안 읽은 지시·경고', '', '#/admin/notices', 'neutral'],
    ];
    // 7일 추이 (현재 vs 직전 7일)
    const metric = r.q.m === 'msgs' ? 'msgs' : 'active';
    const val = (s, e) => (metric === 'msgs' ? allMsgs.filter((x) => inR(x.m.ts, s, e)).length : activeIn(s, e).size);
    const cur = [], prev = [];
    for (let i = 6; i >= 0; i--) { const s = td - i * DAY; const e = i === 0 ? now + 1 : s + DAY; cur.push({ s, v: val(s, e) }); prev.push(val(s - 7 * DAY, e - 7 * DAY)); }
    const W = 600, H = 220, L = 36, R = 12, T = 12, B = 28;
    const mx = Math.max(1, ...cur.map((x) => x.v), ...prev);
    const step = Math.max(1, Math.ceil(mx / 4)); const top = step * 4;
    const X = (i) => L + (i * (W - L - R)) / 6, Y = (v) => T + (H - T - B) * (1 - v / top);
    const grid = [0, 1, 2, 3, 4].map((k) => `<line class="ops-gridline" x1="${L}" x2="${W - R}" y1="${Y(k * step)}" y2="${Y(k * step)}"/><text class="ops-axis" x="${L - 8}" y="${Y(k * step) + 4}" text-anchor="end">${k * step}</text>`).join('');
    const xl = cur.map((x, i) => { const d = new Date(x.s); return `<text class="ops-axis" x="${X(i)}" y="${H - 8}" text-anchor="${i === 6 ? 'end' : 'middle'}">${i === 6 ? '오늘(진행 중)' : (d.getMonth() + 1) + '/' + d.getDate()}</text>`; }).join('');
    const pts = (arr) => arr.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
    const sumC = cur.reduce((a, x) => a + x.v, 0), sumP = prev.reduce((a, b) => a + b, 0);
    const chart = `<figure class="ops-chart"><svg class="ops-plot" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="ops-ct ops-cd"><title id="ops-ct">최근 7일 ${metric === 'msgs' ? '메시지' : '메시지 활동 회원'}</title><desc id="ops-cd">점선은 직전 7일</desc>${grid}${xl}
      <polyline class="ops-line ops-line--prev" points="${pts(prev)}"/><polyline class="ops-line" points="${pts(cur.map((x) => x.v))}"/>
      ${cur.map((x, i) => `<circle class="ops-point" cx="${X(i)}" cy="${Y(x.v)}" r="3.5"><title>${new Date(x.s).getMonth() + 1}/${new Date(x.s).getDate()} · ${x.v} (직전 주 ${prev[i]})</title></circle>`).join('')}</svg>
      <figcaption class="ops-legend"><span>━ 이번 7일 합계 ${num(sumC)}</span><span>┅ 직전 7일 ${num(sumP)}</span>${delta(sumC, sumP, true)}</figcaption></figure>`;
    // 검토 큐
    const rq = [];
    open.forEach((rp) => { const u = findUser(rp.userId); if (!u) return; const c = u.contacts.find((x) => x.id === rp.contactId); rq.push({ ts: rp.createdAt, kind: '신고 · ' + (REASON[rp.reason] || rp.reason), u, c, st: rp.status === 'open' ? '접수' : '처리 중', tone: 'attention' }); });
    risk7.forEach(({ m, u }) => { const c = u.contacts.find((x) => x.id === m.contactId); const linked = open.some((rp) => rp.userId === u.id && rp.contactId === m.contactId && (!rp.messageId || rp.messageId === m.id)); rq.push({ ts: m.ts, kind: '위험 · ' + m.risk.map((x) => (x === 'money' ? '금전 요구' : '외부 유도')).join('·'), u, c, st: linked ? '미검토 · 같은 상대 신고 있음' : '미검토', tone: 'info', mid: m.id }); });
    rq.sort((a, b) => b.ts - a.ts);
    // AI 비용
    const mS = new Date(d0.getFullYear(), d0.getMonth(), 1).getTime();
    const mo = usageSummary(uRows.filter((x) => x.x.ts >= mS), P);
    const dim = new Date(d0.getFullYear(), d0.getMonth() + 1, 0).getDate(); const dEl = Math.max(1, (now - mS) / DAY);
    const byModel = {}; uRows.filter((x) => x.x.ts >= mS && x.x.provider !== 'mymemory').forEach(({ x }) => { const k = x.model; byModel[k] = byModel[k] || { calls: 0, tin: 0, tout: 0, usd: 0 }; byModel[k].calls++; byModel[k].tin += x.in || 0; byModel[k].tout += x.out || 0; byModel[k].usd += usageCost(x, P); });
    const models = Object.entries(byModel).sort((a, b) => b[1].usd - a[1].usd);
    // 도구 사용
    const act30 = us.filter((u) => u.messages.some((m) => m.ts >= now - 30 * DAY));
    const m30 = (u, f) => u.messages.some((m) => m.ts >= now - 30 * DAY && f(m));
    const since = new Date(now - 30 * DAY); const sinceKey = since.getFullYear() + '-' + String(since.getMonth() + 1).padStart(2, '0') + '-' + String(since.getDate()).padStart(2, '0');
    const usedReply = act30.filter((u) => m30(u, (m) => m.source === 'reply' || m.chosen)).length;
    const usedOut = act30.filter((u) => m30(u, (m) => m.dir === 'out')).length;
    const usedMem = act30.filter((u) => u.digests && Object.values(u.digests).some((o) => Object.keys(o || {}).some((k) => k >= sinceKey))).length;
    const usedOcr = act30.filter((u) => m30(u, (m) => m.source === 'ocr')).length;
    const bar = (label, n, tot, cls, extra) => `<li class="ops-bar"><div class="ops-row"><span>${esc(label)}</span><strong>${extra || ''}${pct(n, tot)}%</strong></div><div class="ops-track"><span class="ops-fill ${cls || ''}" style="--p:${pct(n, tot)}%"></span></div></li>`;
    // 코호트
    const coh = [];
    for (let i = 13; i >= 1; i--) {
      const s = td - i * DAY; const grp = us.filter((u) => inR(u.createdAt, s, s + DAY)); if (!grp.length) continue;
      const cells = []; for (let k = 1; k <= 7; k++) { const cs = s + k * DAY; if (cs > now) { cells.push(null); continue; } if (cs + DAY > now) { cells.push('live'); continue; } const n = grp.filter((u) => u.messages.some((m) => inR(m.ts, cs, cs + DAY))).length; cells.push(pct(n, grp.length)); }
      coh.push({ s, n: grp.length, cells });
    }
    const lvl = (p) => (p === 0 ? 0 : p < 15 ? 1 : p < 35 ? 2 : p < 60 ? 3 : 4);
    // 시간대 히트맵 (최근 30일, 요일 × 3시간)
    const hm = Array.from({ length: 7 }, () => Array(8).fill(0));
    allMsgs.forEach(({ m }) => { if (m.ts < now - 30 * DAY) return; const d = new Date(m.ts); hm[(d.getDay() + 6) % 7][Math.floor(d.getHours() / 3)]++; });
    const hmx = Math.max(1, ...hm.flat());
    const WD = ['월', '화', '수', '목', '금', '토', '일'];
    // 분포
    const dist = r.q.d === 'app' ? 'app' : r.q.d === 'src' ? 'src' : 'lang';
    const cnt = {};
    if (dist === 'lang') allMsgs.forEach(({ m }) => { if (m.lang && m.trLang && m.lang !== m.trLang) { const k = LN(m.lang) + ' → ' + LN(m.trLang); cnt[k] = (cnt[k] || 0) + 1; } });
    if (dist === 'app') allMsgs.forEach(({ m, u }) => { const c = u.contacts.find((x) => x.id === m.contactId); const k = c ? APPN(c.app) : '미지정'; cnt[k] = (cnt[k] || 0) + 1; });
    if (dist === 'src') { const SRC = { paste: '붙여넣기', ocr: '스크린샷', import: '대화 가져오기', write: '직접 작성', reply: '답장 추천 사용', sample: '예시' }; allMsgs.forEach(({ m }) => { const k = SRC[m.source] || '기타'; cnt[k] = (cnt[k] || 0) + 1; }); }
    const cTot = Object.values(cnt).reduce((a, b) => a + b, 0);
    // 요금제
    const plan = { free: 0, pro: 0, premium: 0 }; us.forEach((u) => { plan[u.type === 'guest' ? 'free' : (u.plan || 'free')]++; });
    const mrr = plan.pro * 5900 + plan.premium * 9900;
    const q2 = (k, v) => { const o = Object.assign({}, r.q, { [k]: v }); return '#/admin/dashboard?' + Object.entries(o).filter(([, x]) => x).map(([a, b]) => a + '=' + encodeURIComponent(b)).join('&'); };
    const seg = (k, cur, opts) => `<div class="ops-seg" role="group">${opts.map(([v, l]) => `<a href="${q2(k, v)}" aria-current="${cur === v}">${l}</a>`).join('')}</div>`;
    const ts = new Date();
    page('dashboard', `<section class="lm-ops" aria-label="운영 현황">
      <header class="ops-header"><div><h1>${isLeader() ? '팀 현황 · ' + esc(role().team.name) : isOrg() ? '회사 현황 · ' + esc(role().org.name) : isHqp() ? '일반고객 현황' : isHqb() ? '기업고객 현황' : '운영 현황 · 전체'}</h1><p class="ops-muted">${ts.getFullYear()}.${ts.getMonth() + 1}.${ts.getDate()} ${String(ts.getHours()).padStart(2, '0')}:${String(ts.getMinutes()).padStart(2, '0')} 집계 · 전일 비교는 어제 같은 시각까지 · 전체 회원 ${num(us.length)}명 (닉네임 ${members} · 게스트 ${guests})</p></div>
        <div class="ops-controls"><a class="btn secondary sm" href="#/admin/ai">AI 사용량</a><a class="btn sm" href="#/admin/monitor">전체 대화 열기</a></div></header>
      <div class="ops-kpis">
        <a class="ops-kpi" href="#/admin/users"><h2>메시지 활동 회원</h2><strong class="ops-value">${num(actT.size)}명</strong>${delta(actT.size, actY.size, true, '명')}<p class="ops-muted">닉네임 ${actTm} · 게스트 ${actT.size - actTm}</p></a>
        <a class="ops-kpi" href="#/admin/users"><h2>신규 가입</h2><strong class="ops-value">${num(newT)}명</strong>${delta(newT, newY, true, '명')}<p class="ops-muted">누적 ${num(us.length)}명</p></a>
        <a class="ops-kpi" href="#/admin/monitor"><h2>처리한 메시지</h2><strong class="ops-value">${num(msgT)}건</strong>${delta(msgT, msgY, true, '건')}<p class="ops-muted">회원당 ${actT.size ? (msgT / actT.size).toFixed(1) : 0}건</p></a>
        <a class="ops-kpi" href="#/admin/reports"><h2>미처리 신고</h2><strong class="ops-value">${num(open.length)}건</strong>${delta(repT, repY, false, '건')}<p class="ops-muted">증감은 신규 접수 기준</p></a>
        <a class="ops-kpi" href="#/admin/ai"><h2>오늘 AI 예상 비용</h2><strong class="ops-value">${won(aiT.usd * fx)}</strong>${delta(Math.round(aiT.usd * fx), Math.round(aiY.usd * fx), false, '원')}<p class="ops-muted">AI 호출 ${num(aiT.calls)}회 · 무료 번역 ${num(aiT.mt)}회</p></a>
      </div>
      <div class="ops-split ops-split--priority">
        <section class="ops-panel" aria-label="오늘 처리할 일"><header class="ops-panel-head"><h2>오늘 처리할 일</h2><span class="ops-tag" data-tone="${queue.slice(0, 2).some((x) => x[0]) ? 'attention' : 'good'}">${queue.filter((x) => x[0]).length}개 항목 대기</span></header>
          <ul class="ops-queue">${queue.map(([n, l, sub, h, tone]) => `<li><a class="ops-task" href="${h}"><span>${l}${sub ? `<br><span class="ops-muted">${sub}</span>` : ''}</span><span class="ops-tag" data-tone="${n ? tone : 'good'}">${n ? num(n) + '건 →' : '없음'}</span></a></li>`).join('')}</ul></section>
        <section class="ops-panel" aria-label="최근 7일 활동"><header class="ops-panel-head"><h2>최근 7일 활동</h2><div class="ops-controls">${seg('m', metric, [['active', '활동 회원'], ['msgs', '메시지']])}</div></header>${chart}</section>
      </div>
      ${(isSuper() || isHqb()) ? (() => {
        const gs = Store.orgs(); if (!gs.length) return '';
        const rowsO = gs.map((g) => {
          const ids = new Set(Store.teamsOfOrg(g.id).flatMap((t) => t.members || []));
          const gu = allUsers().filter((u) => ids.has(u.id));
          const gm = gu.flatMap((u) => u.messages);
          const m7 = gm.filter((m) => m.ts >= now - 7 * DAY).length, mT = gm.filter((m) => m.ts >= td).length;
          const act = gu.filter((u) => u.messages.some((m) => m.ts >= now - 7 * DAY)).length;
          const cost = usageSummary(gu.flatMap((u) => (u.aiUsage || []).filter((x) => x.ts >= mS).map((x) => ({ x, u }))), P).usd;
          const ns = (Store.db.notices || []).filter((n) => ids.has(n.userId));
          const unreadM = ns.filter((n) => n.from !== 'member' && !n.readAt).length, unreadR = ns.filter((n) => n.from === 'member' && !n.readAt).length;
          const rep2 = reports().filter((x) => ids.has(x.userId) && x.status !== 'closed').length;
          const last = gm.length ? Math.max(...gm.map((m) => m.ts)) : 0;
          return { g, teams: Store.teamsOfOrg(g.id).length, agents: gu.length, act, mT, m7, cost, unreadM, unreadR, rep2, last };
        });
        return `<section class="ops-panel" aria-label="거래처별 현황"><header class="ops-panel-head"><h2>거래처별 현황 <span class="ops-muted">${gs.length}곳</span></h2><a class="link" href="#/admin/orgs">거래처 관리</a></header>
          <div class="ops-table-wrap"><table class="ops-table"><thead><tr><th scope="col">거래처</th><th scope="col" class="ops-num">팀</th><th scope="col" class="ops-num">상담원</th><th scope="col" class="ops-num">7일 활동</th><th scope="col" class="ops-num">오늘 메시지</th><th scope="col" class="ops-num">7일 메시지</th><th scope="col" class="ops-num">이번 달 AI</th><th scope="col" class="ops-num">안 읽은 지시</th><th scope="col" class="ops-num">미확인 답장</th><th scope="col" class="ops-num">미처리 신고</th><th scope="col">최근 활동</th></tr></thead><tbody>
          ${rowsO.map((o) => `<tr class="clickable" onclick="location.hash='#/admin/orgs?o=${o.g.id}'"><td><strong>${esc(o.g.name)}</strong> <span class="ops-muted">${esc(o.g.loginId)}</span></td><td class="ops-num">${o.teams}</td><td class="ops-num">${o.agents}</td><td class="ops-num">${o.act} (${pct(o.act, o.agents)}%)</td><td class="ops-num">${num(o.mT)}</td><td class="ops-num">${num(o.m7)}</td><td class="ops-num">${won(o.cost * fx)}</td><td class="ops-num">${o.unreadM ? `<span class="ops-tag" data-tone="info">${o.unreadM}</span>` : 0}</td><td class="ops-num">${o.unreadR ? `<span class="ops-tag" data-tone="attention">${o.unreadR}</span>` : 0}</td><td class="ops-num">${o.rep2 ? `<span class="ops-tag" data-tone="attention">${o.rep2}</span>` : 0}</td><td>${o.last ? ago(o.last) : '—'}</td></tr>`).join('')}</tbody></table></div></section>`;
      })() : ''}
      <section class="ops-panel" aria-label="신고·위험 검토 큐"><header class="ops-panel-head"><h2>신고·위험 검토 큐 <span class="ops-muted">${rq.length}건</span></h2><a class="link" href="#/admin/reports">신고 전체 보기</a></header>
        ${rq.length ? `<div class="ops-table-wrap"><table class="ops-table"><thead><tr><th scope="col">유형</th><th scope="col">회원</th><th scope="col">상대</th><th scope="col">메신저</th><th scope="col">감지 시각</th><th scope="col">상태</th><th scope="col"></th></tr></thead><tbody>
          ${rq.slice(0, 10).map((x) => `<tr class="clickable" data-open="${x.u.id}|${x.c ? x.c.id : ''}|${x.mid || ''}"><td><span class="ops-tag" data-tone="${x.tone}">${esc(x.kind)}</span></td><td>${esc(x.u.nickname)} <span class="ops-muted">${esc(x.u.id)}</span></td><td>${x.c ? esc(x.c.nickname) : '—'}</td><td>${x.c ? esc(APPN(x.c.app)) : '—'}</td><td class="ops-num">${fmt(x.ts)} <span class="ops-muted">${ago(x.ts)}</span></td><td>${x.st}</td><td><a class="link" href="#/admin/monitor?u=${x.u.id}&c=${x.c ? x.c.id : ''}${x.mid ? '&m=' + x.mid : ''}">대화 열기</a></td></tr>`).join('')}</tbody></table></div>` : '<p class="ops-empty">검토할 신고·위험 대화가 없습니다.</p>'}</section>
      <div class="ops-split">
        <section class="ops-panel" aria-label="AI 비용과 무료 번역"><header class="ops-panel-head"><h2>AI 비용 · 이번 달</h2><span class="ops-tag" data-tone="info">월말 예상 ${won((mo.usd / dEl) * dim * fx)}</span></header>
          <strong class="ops-value">${won(mo.usd * fx)} <span class="ops-muted">${usd(mo.usd)}</span></strong>
          ${models.length ? `<ul class="ops-bars">${models.map(([k, v], i) => `<li class="ops-bar"><div class="ops-row"><span>${esc(k)}</span><strong>${won(v.usd * fx)} · ${pct(v.usd, mo.usd)}%</strong></div><div class="ops-track"><span class="ops-fill ${i % 2 ? 'ops-fill--violet' : ''}" style="--p:${pct(v.usd, mo.usd)}%"></span></div></li>`).join('')}</ul>
          <div class="ops-table-wrap"><table class="ops-table"><thead><tr><th scope="col">모델</th><th scope="col" class="ops-num">호출</th><th scope="col" class="ops-num">입력 토큰</th><th scope="col" class="ops-num">출력 토큰</th><th scope="col" class="ops-num">예상 비용</th></tr></thead><tbody>${models.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="ops-num">${num(v.calls)}</td><td class="ops-num">${num(v.tin)}</td><td class="ops-num">${num(v.tout)}</td><td class="ops-num">${won(v.usd * fx)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="ops-empty">이번 달 AI 호출이 없습니다.</p>'}
          <p class="ops-muted">무료 번역 ${num(mo.mt)}회 · ${num(mo.mtChars)}자 · 환율 ₩${fx}/$ · 단가는 AI 사용량 메뉴에서 변경</p></section>
        <section class="ops-panel" aria-label="대화 도구 사용"><header class="ops-panel-head"><h2>대화 도구 사용</h2><span class="ops-tag">최근 30일 활동 ${act30.length}명 기준</span></header>
          <ul class="ops-bars">${bar('보낸 말 번역 기록', usedOut, act30.length, '', usedOut + '명 · ')}${bar('답장 추천 사용', usedReply, act30.length, 'ops-fill--sky', usedReply + '명 · ')}${bar('스크린샷 번역', usedOcr, act30.length, 'ops-fill--violet', usedOcr + '명 · ')}${bar('하루 기억 생성', usedMem, act30.length, 'ops-fill--sky', usedMem + '명 · ')}</ul>
          <p class="ops-muted">해당 기능을 한 번 이상 쓴 회원 비율입니다. 기능 간 순서를 기록하는 이벤트가 쌓이면 퍼널로 바꿉니다.</p>
</section>
      </div>
      <details class="ops-more" open><summary><h2>제품 분석</h2><span class="ops-muted">요금제 · 재방문 코호트 · 이용 시간대 · 언어·메신저·입력 방식</span></summary><div class="ops-more-body">
      <section class="ops-panel" aria-label="요금제 구성"><header class="ops-panel-head"><h2>요금제 구성</h2><span class="ops-tag" data-tone="info">예상 MRR · 결제 미연동</span></header>
          <strong class="ops-value">${won(mrr)}<span class="ops-muted"> / 월</span></strong>
          <div class="ops-table-wrap"><table class="ops-table"><thead><tr><th scope="col">요금제</th><th scope="col" class="ops-num">가격</th><th scope="col" class="ops-num">인원</th><th scope="col" class="ops-num">비중</th><th scope="col" class="ops-num">월 금액</th></tr></thead><tbody>
            ${[['무료', 0, plan.free], ['프로', 5900, plan.pro], ['프리미엄', 9900, plan.premium]].map(([n, p, c]) => `<tr><td>${n}</td><td class="ops-num">${won(p)}</td><td class="ops-num">${num(c)}명</td><td class="ops-num">${pct(c, us.length)}%</td><td class="ops-num">${won(p * c)}</td></tr>`).join('')}</tbody></table></div>
          <p class="ops-muted">유료 전환율 ${pct(plan.pro + plan.premium, us.length)}% · 게스트는 무료로 집계</p></section>
      <section class="ops-panel" aria-label="가입 코호트"><header class="ops-panel-head"><h2>7일 재방문 (가입일 코호트)</h2><span class="ops-muted">가입 후 N일째에 메시지를 처리한 회원 비율</span></header>
        ${coh.length ? `<div class="ops-table-wrap"><table class="ops-table ops-heat"><thead><tr><th scope="col">가입일</th><th scope="col">가입</th>${[1, 2, 3, 4, 5, 6, 7].map((k) => `<th scope="col">D${k}</th>`).join('')}</tr></thead><tbody>
          ${coh.map((c) => `<tr><th scope="row">${fmtD(c.s)}</th><td>${c.n}명</td>${c.cells.map((p) => (p === null ? '<td>—</td>' : p === 'live' ? '<td class="ops-muted">진행 중</td>' : `<td data-level="${lvl(p)}">${p}%</td>`)).join('')}</tr>`).join('')}</tbody></table></div>` : '<p class="ops-empty">최근 2주 가입자가 없습니다.</p>'}</section>
      <div class="ops-split">
        <section class="ops-panel" aria-label="이용 시간대"><header class="ops-panel-head"><h2>이용 시간대 (최근 30일)</h2><span class="ops-muted">요일 × 3시간 · 메시지 수</span></header>
          <div class="ops-table-wrap"><table class="ops-table ops-heat"><thead><tr><th scope="col"></th>${[0, 3, 6, 9, 12, 15, 18, 21].map((h) => `<th scope="col">${h}시</th>`).join('')}</tr></thead><tbody>
            ${hm.map((row, i) => `<tr><th scope="row">${WD[i]}</th>${row.map((v) => `<td data-level="${v ? Math.min(4, 1 + Math.floor((v / hmx) * 3.99)) : 0}" title="${WD[i]} · ${v}건">${v || ''}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>
        <section class="ops-panel" aria-label="언어·메신저·출처"><header class="ops-panel-head"><h2>언어·메신저·출처</h2><div class="ops-controls">${seg('d', dist, [['lang', '언어 방향'], ['app', '메신저'], ['src', '입력 방식']])}</div></header>
          ${cTot ? `<ul class="ops-bars">${Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 9).map(([k, v], i) => `<li class="ops-bar"><div class="ops-row"><span>${esc(k)}</span><strong>${num(v)}건 · ${pct(v, cTot)}%</strong></div><div class="ops-track"><span class="ops-fill ${['', 'ops-fill--sky', 'ops-fill--violet'][i % 3]}" style="--p:${pct(v, cTot)}%"></span></div></li>`).join('')}</ul><p class="ops-muted">표본 ${num(cTot)}건</p>` : '<p class="ops-empty">데이터가 없습니다.</p>'}</section>
      </div>
      </div></details>
    </section>`);
    bindOpen();
  }
  function bindOpen() { $app.querySelectorAll('[data-open]').forEach((tr) => tr.addEventListener('click', (e) => { if (e.target.closest('a')) return; const [u, c, m] = tr.dataset.open.split('|'); location.hash = `#/admin/monitor?u=${u}&c=${c || ''}${m ? '&m=' + m : ''}`; })); }

  // 상담원 계정 만들기 (거래처·본사·팀장 공통)
  function agentForm(sel) { const t = sel; return `<form class="stack-sm tm-agent" id="tm-agent"><h3>상담원 계정 만들기 <span class="ops-muted">아이디·비밀번호로 어느 PC에서든 로그인 · 이 팀에 자동 소속</span></h3>
            <div class="row wrap" style="gap:6px"><input class="field" name="nickname" placeholder="상담원 이름" required style="max-width:160px"><select class="field" name="lang" style="max-width:150px">${['ko', 'zh', 'ja', 'vi', 'en', 'th', 'id', 'es', 'ru', 'mn', 'uz', 'ne', 'tl', 'hi', 'ar', 'fr', 'de', 'pt'].map((l) => `<option value="${l}">${esc(LN(l))}</option>`).join('')}</select><input class="field" name="loginId" placeholder="상담원 아이디 (영문)" required style="max-width:170px"><input class="field" name="pin" value="1234" placeholder="비밀번호" required style="max-width:110px"><button class="btn" type="submit">상담원 추가</button></div>
            ${(() => { const ag = (sel.members || []).map((id) => Store.db.users[id]).filter((u) => u && u.loginId); return ag.length ? `<div class="tm-agents">${ag.map((u) => `<span class="tm-agent-chip"><b>${esc(u.nickname)}</b> ${esc(u.loginId)} / ${esc(u.pin)} · ${esc(LN(u.lang || 'ko'))} · ${u.lastActive ? '접속 ' + new Date(u.lastActive).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '<span class="ops-muted">미접속</span>'}${(() => { const b = Store.bindOf(u.id); return b && b.dev ? ` · 🔒 자리 ${esc(b.label || '')} (${new Date(b.at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}) <button class="btn sm secondary" type="button" data-seat-reset="${u.id}">자리 초기화</button>` : ' · <span class="ops-muted">자리 미등록 (첫 로그인 PC로 고정)</span>'; })()}</span>`).join('')}</div>` : ''; })()}
            <p class="ops-muted">🔒 상담원 계정은 처음 로그인한 PC(브라우저) 한 자리에서만 열립니다. 자리를 옮기면 「자리 초기화」 후 새 PC에서 로그인 · 초기화하면 기존 자리는 바로 로그아웃됩니다.</p>
            <p class="ops-muted">상담원은 앱 주소의 첫 화면 → 「상담원 로그인」에서 이 아이디·비밀번호로 들어옵니다 · ${Store.Sync.enabled() ? '공용 서버 연결됨 · 다른 PC에서도 로그인됩니다' : '서버 미연결 · 같은 브라우저에서만'}</p></form>`; }
  function bindAgentForm(sel, rerender) {
    const fm = document.getElementById('tm-agent'); if (!fm) return;
    fm.addEventListener('submit', (e) => { e.preventDefault(); Store.reload(); const f = new FormData(e.target); const lid = Store.normId(f.get('loginId')); if (!/^[a-z0-9._-]{2,30}$/.test(lid)) { LM.toast('상담원 아이디는 영문·숫자로 2자 이상'); return; } if (Store.whoHasId(lid)) { LM.toast('이미 쓰는 아이디입니다'); return; } const u = Store.createAgent({ nickname: String(f.get('nickname')).trim(), lang: f.get('lang'), loginId: lid, pin: f.get('pin'), teamId: sel.id }); Store.audit({ action: 'settings', target: u.id, reason: '상담원 계정 생성 · ' + u.nickname + ' (' + lid + ') · ' + sel.name }); LM.toast('상담원 로그인: ' + lid + ' / ' + u.pin, 6000); rerender(); });
    document.querySelectorAll('[data-seat-reset]').forEach((b) => b.addEventListener('click', () => { const id = b.dataset.seatReset; const u = Store.db.users[id]; Store.resetSeat(id); Store.audit({ action: 'settings', target: id, reason: '상담원 자리 초기화 · ' + (u ? u.nickname : id) }); LM.toast('자리를 초기화했습니다 · 새 PC에서 로그인하면 그 자리로 고정됩니다', 5000); rerender(); }));
  }
  /* ---------- 회원 CRM ---------- */
  function crm(r) {
    const q = (r.q.q || '').toLowerCase();
    const type = r.q.type || 'all';
    const list = users().filter((u) => (type === 'all' || (type === 'banned' ? u.status === 'banned' : u.type === type)) && (!q || (u.nickname + ' ' + u.id + ' ' + u.contacts.map((c) => c.nickname).join(' ')).toLowerCase().includes(q)))
      .map((u) => ({ u, s: memberStats(u) })).sort((a, b) => b.s.lastTs - a.s.lastTs);
    const sel = r.q.u ? findUser(r.q.u) : (list[0] && list[0].u);
    page('users', `
      <div class="stack-sm"><h1>회원 CRM</h1><p class="muted">닉네임·서비스 ID·상대 닉네임으로 검색하고, 회원별 연락처·대화 흐름·위험 표시를 확인합니다. 실명은 수집하지 않습니다.</p></div>
      ${sel && r.q.u ? crmDetail(sel) : ''}
      ${isLeader() && role().team ? `<section class="card stack-sm">${agentForm(role().team)}</section>` : ''}
      <form class="card row wrap" id="crm-f" role="search">
        <label class="grow stack-xs"><span class="label">닉네임 / 서비스 ID / 상대 닉네임</span><input class="field" name="q" type="search" value="${esc(r.q.q || '')}" placeholder="예: Lin, U-0001, 서준"></label>
        <label class="stack-xs"><span class="label">계정 유형</span><select class="field" name="type">${[['all', '전체'], ['member', '닉네임 회원'], ['guest', '게스트'], ['banned', '차단 계정']].map(([v, l]) => `<option value="${v}" ${type === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <button class="btn" type="submit" style="align-self:end">검색</button>
      </form>
      <div class="table-wrap"><table style="min-width:980px"><caption>회원 ${list.length}명</caption><thead><tr><th>닉네임 / ID</th><th>유형</th><th>표시 언어</th><th>대화 상대</th><th>들어온 대화</th><th>주 사용 앱</th><th>평균 깊이</th><th>최근 대화</th><th>위험·신고</th><th>상태</th></tr></thead>
      <tbody>${list.map(({ u, s }) => { const top = Object.entries(s.apps).sort((a, b) => b[1] - a[1])[0]; return `<tr class="clickable ${sel && sel.id === u.id ? 'selected' : ''}" data-u="${u.id}"><th scope="row">${esc(u.nickname)} / ${esc(u.id)}${u.demo ? ' <span class="badge gray">데모</span>' : ''}</th><td>${u.type === 'member' ? '닉네임 회원' : '게스트'}</td><td>${LN(u.lang)}</td><td>${u.contacts.length}명</td><td>${s.msgCount}건</td><td>${top ? esc(APPN(top[0])) : '—'}</td><td>${s.avgDepth}</td><td>${fmt(s.lastTs)} <span class="tiny muted">(${daysAgo(s.lastTs)}일 전)</span></td><td>${s.risk ? `<span class="badge alert">위험 ${s.risk}</span>` : ''} ${s.reps ? `<span class="badge warning">신고 ${s.reps}</span>` : ''}${!s.risk && !s.reps ? '<span class="badge gray">없음</span>' : ''}</td><td>${u.status === 'banned' ? '<span class="badge alert">차단</span>' : '<span class="badge">이용 중</span>'}</td></tr>`; }).join('')}</tbody></table></div>
      ${sel && !r.q.u ? crmDetail(sel) : ''}`);
    document.getElementById('crm-f').addEventListener('submit', (e) => { e.preventDefault(); const f = new FormData(e.target); location.hash = `#/admin/users?q=${encodeURIComponent(f.get('q'))}&type=${f.get('type')}`; });
    $app.querySelectorAll('[data-u]').forEach((tr) => tr.addEventListener('click', () => { location.hash = `#/admin/users?q=${encodeURIComponent(r.q.q || '')}&type=${type}&u=${tr.dataset.u}`; }));
    bindOpen();
    bindBan();
    if (isLeader() && role().team) bindAgentForm(role().team, () => crm(r));
    // 행을 누르면 아래 상세로 바로 이동 (표가 길어 이동이 안 보이던 문제)
    if (r.q.u) setTimeout(() => { const d = document.getElementById('crm-detail'); if (d) { d.scrollIntoView({ behavior: 'smooth', block: 'start' }); d.classList.add('crm-flash'); setTimeout(() => d.classList.remove('crm-flash'), 1600); } }, 60);
  }
  function crmDetail(u) {
    const s = memberStats(u);
    const totApps = Object.values(s.apps).reduce((a, b) => a + b, 0) || 1;
    return `<article class="card stack-lg" id="crm-detail">
      <div class="between wrap"><div class="row"><span class="avatar">${esc([...u.nickname][0] || '?')}</span><div><h2>${esc(u.nickname)} <span class="small muted">${esc(u.id)}</span></h2><p class="small muted">${u.type === 'member' ? '닉네임 회원' : '게스트'} · 표시 언어 ${LN(u.lang)} · 가입 ${fmtD(u.createdAt)}</p></div></div>
        <div class="row wrap" style="gap:8px"><button class="btn ghost sm" type="button" onclick="var t=document.querySelector('#crm-f');if(t)t.scrollIntoView({behavior:'smooth'})">↓ 목록</button>${viewAsBtn(u)}<a class="btn secondary" href="#/admin/notices?u=${u.id}">✉ 메시지 보내기</a><a class="btn" href="#/admin/monitor?u=${u.id}">${esc(u.nickname)} 대화 열기</a></div></div>
      <div class="metrics">
        <div class="card stack-sm"><span class="label">대화 상대</span><strong class="metric">${u.contacts.length}명</strong></div>
        <div class="card stack-sm"><span class="label">들어온 대화</span><strong class="metric">${s.msgCount}건</strong></div>
        <div class="card stack-sm"><span class="label">사용 앱</span><strong class="metric">${Object.keys(s.apps).length}개</strong></div>
        <div class="card ${s.risk ? 'notice' : ''} stack-sm"><span class="small">검토할 위험 표시</span><strong class="metric">${s.risk}건</strong></div>
      </div>
      <div class="stack-sm"><h3>상대별 대화 진행</h3><p class="small muted">진행 기간은 첫 대화부터 마지막 대화까지, 단절 일수는 마지막 대화 이후 경과일입니다. 관계 단계는 회원이 설정한 값이고, 깊이 점수는 대화량·기간·개인적 주제·감정 표현·상호 응답으로 계산합니다.</p>
        <div class="table-wrap"><table style="min-width:1040px"><thead><tr><th>앱 / 상대 닉네임</th><th>언어</th><th>진행 기간</th><th>대화 수</th><th>마지막 대화</th><th>단절 일수</th><th>관계 / 단계</th><th>깊이 점수</th><th>상대 분위기</th><th>위험 표시</th></tr></thead>
        <tbody>${s.contacts.map((x) => `<tr class="clickable" data-open="${u.id}|${x.c.id}"><th scope="row"><span class="row"><span class="avatar sm col-${esc(x.c.color || 'mint')}">${esc([...x.c.nickname][0] || '?')}</span>${esc(APPN(x.c.app))} / ${esc(x.c.nickname)}</span></th><td>${LN(x.c.lang)}</td><td>${x.first ? `${fmtD(x.first)}~${fmtD(x.last)} · ${x.span}일` : '—'}</td><td>${x.ms.length}건</td><td>${x.last ? fmt(x.last) : '—'}</td><td>${x.last ? `<span class="${daysAgo(x.last) >= 7 ? 'badge warning' : ''}">${daysAgo(x.last)}일</span>` : '—'}</td><td>${REL[x.c.relation] || '친구'} / ${esc(STAGE_KO[I18N.STAGES[x.c.relation || 'friend'][x.c.stage || 0]] || '')}</td><td><strong>${x.pf.depth}</strong><span class="muted"> / 100</span><div class="bar" style="width:90px"><span style="width:${x.pf.depth}%"></span></div></td><td>${x.pf.inCount ? { good: '좋음', low: '가라앉음', neutral: '보통' }[x.pf.mood] : '—'}</td><td>${x.risk ? `<span class="badge alert">위험 ${x.risk}건</span>` : '<span class="badge gray">없음</span>'}</td></tr>`).join('') || '<tr><td colspan="10" class="muted">등록된 상대가 없습니다.</td></tr>'}</tbody></table></div></div>
      <div class="admin-grid">
        <div class="card stack"><h3>사용 앱 분포</h3><div class="mini-bars">${Object.entries(s.apps).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="row"><span class="small" style="width:110px">${esc(APPN(k))}</span><div class="bar"><span style="width:${(v / totApps) * 100}%"></span></div><span class="tiny" style="width:80px;text-align:right">${v}건 · ${Math.round((v / totApps) * 100)}%</span></div>`).join('') || '<p class="small muted">데이터 없음</p>'}</div></div>
        <div class="card stack"><h3>운영 동의 및 이용 이력</h3><dl class="data-grid">
          <dt>필수 동의</dt><dd>입력한 모든 대화의 관리 목적 열람 동의</dd>
          <dt>동의 시각</dt><dd>${fmt(u.consentAt)}</dd><dt>고지 버전</dt><dd>${esc(u.consentVer || 'v1.0')}</dd>
          <dt>이용 제한</dt><dd>${u.status === 'banned' ? `<span class="badge alert">차단</span> ${esc(u.banReason || '')}` : '기록 없음'}</dd>
          <dt>기기</dt><dd class="small">${esc((u.device || '').slice(0, 60))}</dd></dl>
          <a class="link" href="#/admin/audit?q=${u.id}">${esc(u.nickname)} 관련 열람 기록 보기</a>
          ${banBox(u)}
        </div>
      </div></article>`;
  }
  function banBox(u) {
    return u.status === 'banned'
      ? `<button class="btn secondary" type="button" data-unban="${u.id}">차단 해제</button>`
      : `<details class="card danger"><summary style="color:var(--danger)">앱 이용 차단</summary><div class="stack-sm"><p class="small"><strong>조치 대상:</strong> ${esc(u.nickname)} / ${esc(u.id)}</p><textarea class="field" data-ban-reason="${u.id}" rows="3" placeholder="확인된 위반 행위와 관련 기록을 입력하세요."></textarea><button class="btn danger-btn full" type="button" data-ban="${u.id}">${esc(u.nickname)} 이용 차단</button></div></details>`;
  }
  function bindBan() {
    $app.querySelectorAll('[data-ban]').forEach((b) => b.addEventListener('click', async () => {
      const id = b.dataset.ban; const reason = ($app.querySelector(`[data-ban-reason="${id}"]`) || {}).value || '';
      if (!reason.trim()) { LM.toast('차단 근거를 입력하세요'); return; }
      if (!confirm('이 회원의 앱 이용을 차단할까요?')) return;
      const u = findUser(id); u.status = 'banned'; u.banReason = reason.trim();
      if (Store.db.users[id]) Store.db.users[id] = Object.assign(Store.db.users[id], { status: 'banned', banReason: reason.trim() });
      Store.persist();
      Store.audit({ action: 'ban', target: id, reason: reason.trim() });
      try { await Store.Sync.upsert('ban:' + id, { status: 'banned', reason: reason.trim(), by: Store.db.admin.operator, ts: Date.now() }); } catch (e) { /* noop */ }
      LM.toast('차단했습니다'); LM.render();
    }));
    $app.querySelectorAll('[data-unban]').forEach((b) => b.addEventListener('click', async () => {
      const id = b.dataset.unban; const u = findUser(id); u.status = 'active'; u.banReason = '';
      if (Store.db.users[id]) Object.assign(Store.db.users[id], { status: 'active', banReason: '' });
      Store.persist(); Store.audit({ action: 'unban', target: id, reason: '차단 해제' });
      try { await Store.Sync.upsert('ban:' + id, { status: 'active' }); } catch (e) { /* noop */ }
      LM.toast('차단을 해제했습니다'); LM.render();
    }));
  }

  /* ---------- 전체 대화 모니터링 ---------- */
  function monitor(r) {
    const q = (r.q.q || '').toLowerCase();
    const app = r.q.app || 'all';
    const riskOnly = r.q.risk === '1';
    const us = users().filter((u) => (!q || (u.nickname + ' ' + u.id + ' ' + u.contacts.map((c) => c.nickname).join(' ')).toLowerCase().includes(q))
      && (app === 'all' || u.contacts.some((c) => c.app === app))
      && (!riskOnly || u.messages.some((m) => m.risk && m.risk.length)))
      .sort((a, b) => memberStats(b).lastTs - memberStats(a).lastTs);
    const u = (r.q.u && findUser(r.q.u)) || us[0];
    let contacts = u ? u.contacts.filter((c) => app === 'all' || c.app === app) : [];
    if (u && riskOnly) contacts = contacts.filter((c) => msgsOf(u, c.id).some((m) => m.risk && m.risk.length));
    const noContactMsgs = u ? u.messages.filter((m) => !m.contactId) : [];
    const cid = r.q.c !== undefined ? r.q.c : (contacts[0] ? contacts[0].id : '');
    const c = u ? u.contacts.find((x) => x.id === cid) : null;
    const ms = u ? (cid ? msgsOf(u, cid) : noContactMsgs.sort((a, b) => a.ts - b.ts)) : [];
    const grantKey = u ? u.id + '|' + (cid || 'none') : '';
    // 테스트 버전: 열람 사유 없이 바로 열람 (감사로그에는 자동 기록)
    if (u && !viewGrants[grantKey]) { viewGrants[grantKey] = '운영 점검(자동)'; Store.audit({ action: 'view', target: u.id, member: u.nickname, contact: c ? APPN(c.app) + ' / ' + c.nickname : '미지정', convId: (ms && ms[0]) ? ms[0].convId : '-', reason: '운영 점검(자동)' }); }
    const granted = !!viewGrants[grantKey];
    page('monitor', `
      <div class="between wrap"><div class="stack-sm"><h1>전체 대화 모니터링</h1><p class="muted">회원·게스트가 앱에 입력·공유·업로드한 모든 대화를 확인합니다. 상대는 회원이 적은 앱·닉네임으로만 구분됩니다.</p></div><a class="btn secondary" href="#/admin/audit">열람 감사로그</a></div>
      <form class="card row wrap" id="mon-f" role="search">
        <label class="grow stack-xs"><span class="label">회원 닉네임·서비스 ID·상대 닉네임</span><input class="field" name="q" type="search" value="${esc(r.q.q || '')}" placeholder="예: Lin, U-0001, 서준"></label>
        <label class="stack-xs"><span class="label">대화 앱</span><select class="field" name="app"><option value="all">전체 앱</option>${DATA.APPS.map((a) => `<option value="${a.id}" ${app === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}</select></label>
        <label class="stack-xs"><span class="label">위험 분류</span><select class="field" name="risk"><option value="0">전체 대화</option><option value="1" ${riskOnly ? 'selected' : ''}>위험 표시 있음</option></select></label>
        <label class="grow stack-xs"><span class="label">대화 내용 검색 (원문·번역·한국어)</span><input class="field" name="mq" type="search" value="${esc(r.q.mq || '')}" placeholder="예: 환불, refund, 退款"></label>
        <button class="btn" type="submit" style="align-self:end">검색</button>
      </form>
      ${(() => { // 대화 내용 검색 결과 (범위 안 모든 회원·상담원)
        const mq = (r.q.mq || '').trim().toLowerCase(); if (mq.length < 2) return '';
        const ca = koCache(); const hits = [];
        users().forEach((x) => (x.messages || []).forEach((m) => { const ko = ca[m.id] || ''; const hay = ((m.text || '') + '\n' + (m.translation || '') + '\n' + ko + '\n' + Object.values(m.trs || {}).join('\n')).toLowerCase(); if (hay.includes(mq)) hits.push({ x, m }); }));
        hits.sort((a, b) => b.m.ts - a.m.ts);
        const mark = (t) => { const i = String(t || '').toLowerCase().indexOf(mq); if (i < 0) return esc(String(t || '').slice(0, 90)); const st = Math.max(0, i - 30); const tx = String(t); return (st ? '…' : '') + esc(tx.slice(st, i)) + '<mark>' + esc(tx.slice(i, i + mq.length)) + '</mark>' + esc(tx.slice(i + mq.length, i + mq.length + 50)); };
        return `<section class="card stack-sm"><h2>🔎 "${esc(r.q.mq)}" 대화 검색 <span class="small muted">${hits.length}건${hits.length > 100 ? ' · 최근 100건 표시' : ''}</span></h2>${hits.length ? `<div class="table-wrap"><table style="min-width:760px"><thead><tr><th style="width:120px">시각</th><th style="width:160px">상담원·회원</th><th style="width:170px">고객</th><th>내용</th></tr></thead><tbody>${hits.slice(0, 100).map(({ x, m }) => { const c = x.contacts.find((k) => k.id === m.contactId); const tm = Store.teamOf(x.id); const fld = [m.text, m.translation, ca[m.id]].find((t) => String(t || '').toLowerCase().includes(mq)) || m.text; return `<tr class="clickable" data-open="${x.id}|${m.contactId || ''}|${m.id}"><td class="tiny">${fmt(m.ts)}</td><td><b>${esc(x.nickname)}</b><br><span class="tiny muted">${esc(x.id)}${tm ? ' · ' + esc(tm.name) : ''}</span></td><td>${c ? esc(APPN(c.app) + ' / ' + c.nickname) : '연락처 미지정'}<br><span class="tiny muted">${m.dir === 'in' ? '받은 말' : '보낸 말'}</span></td><td class="wrap-cell">${mark(fld)}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="small muted">찾은 대화가 없습니다.</p>'}</section>`;
      })()}
      ${(() => { // 같은 고객을 여러 상담원이 상담 중 (1차: 앱+닉네임 / 같은 메시지 → 팀장이 프로필 사진으로 확인·판정)
        let groups = []; try { groups = Store.duplicateCustomers(users().filter((x) => !x.demo)); } catch (e) { groups = []; }
        if (!groups.length) return '';
        const pend = groups.filter((g) => !g.decided).length;
        const ph = (e) => (e.photo ? `<img class="dup-ph" src="${esc(e.photo)}" alt="">` : `<span class="dup-ph none">사진<br>없음</span>`);
        return `<details class="card stack-sm dup-cust" ${r.q.dup || pend ? 'open' : ''} id="dup-box"><summary><b>👥 여러 상담원이 같은 고객 상담 의심 ${groups.length}건</b>${pend ? ` <span class="badge alert">확인 필요 ${pend}</span>` : ''} <span class="small muted">1차: 같은 앱+닉네임 또는 같은 메시지 · 프로필 사진을 비교해 판정하세요</span></summary>
          <div class="stack-xs" style="margin-top:8px">${groups.slice(0, 40).map((g, gi) => `<div class="dup-row ${g.decided ? 'done' : ''}"><div class="between wrap"><span><b>${esc(APPN(g[0].app))} / ${esc(g[0].nick)}</b> <span class="tiny muted">${g.some((x, i) => g.some((y, j) => i !== j && x.key !== y.key)) ? '같은 메시지로 감지' : '같은 앱·닉네임'}</span>${g.decided ? ` <span class="badge">✓ 같은 고객 · 담당 ${esc((Store.db.users[g.owner] || {}).nickname || g.owner || '-')}</span>` : ''}</span>
            <span class="row wrap" style="gap:6px"><select class="field sm" data-dup-owner="${gi}" style="max-width:170px">${g.map((e) => `<option value="${e.agentId}" ${g.owner === e.agentId ? 'selected' : ''}>담당: ${esc(e.agentName)}</option>`).join('')}</select><button class="btn sm" type="button" data-dup-same="${gi}">같은 고객 · 담당 지정</button><button class="btn sm secondary" type="button" data-dup-diff="${gi}">다른 사람</button></span></div>
            <div class="row wrap" style="gap:10px;margin-top:6px">${g.map((e) => { const tm = Store.teamOf(e.agentId); return `<a class="dup-card" href="#/admin/monitor?u=${e.agentId}&c=${e.contactId}">${ph(e)}<span><b>${esc(e.agentName)}</b>${tm ? ' · ' + esc(tm.name) : ''}<br><span class="tiny muted">${esc(APPN(e.app))} / ${esc(e.nick)} · ${e.n}건 · ${e.lastTs ? fmt(e.lastTs) : '-'}</span></span></a>`; }).join('')}</div></div>`).join('')}</div></details>`;
      })()}
      <div class="monitor-grid" style="align-items:start">
        <div class="card stack pane"><h2>회원·게스트 <span class="small muted">${us.length}</span></h2>
          <div class="stack-xs">${us.map((x) => { const s = memberStats(x); return `<button class="sel-item" type="button" data-pick-u="${x.id}" aria-selected="${u && u.id === x.id}"><span class="avatar sm">${esc([...x.nickname][0] || '?')}</span><span class="grow"><strong>${esc(x.nickname)}</strong>${x.status === 'banned' ? ' <span class="badge alert">차단</span>' : ''}<br><span class="tiny muted">${esc(x.id)} · 상대 ${x.contacts.length}명 · ${s.msgCount}건</span></span>${s.risk ? `<span class="badge alert">${s.risk}</span>` : ''}</button>`; }).join('') || '<p class="small muted">검색 결과 없음</p>'}</div></div>
        <div class="card stack pane"><h2>${u ? esc(u.nickname) + '의 대화 상대' : '대화 상대'}</h2>
          <div class="stack-xs">${contacts.map((x) => { const xm = msgsOf(u, x.id); const rk = xm.filter((m) => m.risk && m.risk.length).length; const last = xm[xm.length - 1]; return `<button class="sel-item" type="button" data-pick-c="${x.id}" aria-selected="${cid === x.id}"><span class="avatar sm col-${esc(x.color || 'mint')}">${esc([...x.nickname][0] || '?')}</span><span class="grow"><strong>${esc(APPN(x.app))} / ${esc(x.nickname)}</strong><br><span class="tiny muted">${xm.length}건 · ${last ? fmtD(last.ts) : '—'} · ${LN(x.lang)}</span></span>${rk ? `<span class="badge alert">위험 ${rk}</span>` : ''}</button>`; }).join('')}
          ${noContactMsgs.length ? `<button class="sel-item" type="button" data-pick-c="" aria-selected="${!cid}"><span class="avatar sm">?</span><span class="grow"><strong>연락처 미지정</strong><br><span class="tiny muted">${noContactMsgs.length}건</span></span></button>` : ''}
          ${!contacts.length && !noContactMsgs.length ? '<p class="small muted">대화가 없습니다.</p>' : ''}</div></div>
        <div class="card stack-lg" style="min-width:0">
          ${u ? `<div class="stack-xs"><div class="between wrap"><h2>대화 기록</h2><div class="row" style="gap:6px">${viewAsBtn(u)}<a class="btn secondary sm" href="#/admin/notices?u=${u.id}">✉ 메시지</a></div></div><p><strong>${c ? esc(APPN(c.app) + ' / ' + c.nickname) : '연락처 미지정'}</strong></p><p class="small muted">${esc(u.nickname)} · ${esc(u.id)} · ${ms.length}건${ms.length ? ' · 최근 ' + fmt(ms[ms.length - 1].ts) : ''}${c ? ' · ' + REL[c.relation || 'friend'] + ' / ' + esc(STAGE_KO[I18N.STAGES[c.relation || 'friend'][c.stage || 0]]) : ''}</p></div>
          ${granted ? convoHtml(u, c, ms) : `<div class="card stack-sm notice"><label class="label" for="mon-reason">열람 사유 (필수 · 감사로그에 기록됩니다)</label><select class="field" id="mon-reason"><option value="">사유 선택</option><option>번역·조언 품질 검토</option><option>신고 또는 위험 대화 조사</option><option>사용자 문의 대응</option><option>서비스 개선을 위한 대화 패턴 분석</option></select><button class="btn full" type="button" id="mon-grant">사유 기록 후 대화 열람</button></div>`}` : '<p class="muted">회원을 선택하세요.</p>'}
        </div>
      </div>`);
    document.getElementById('mon-f').addEventListener('submit', (e) => { e.preventDefault(); const f = new FormData(e.target); location.hash = `#/admin/monitor?q=${encodeURIComponent(f.get('q'))}&app=${f.get('app')}&risk=${f.get('risk')}&mq=${encodeURIComponent(f.get('mq') || '')}`; });
    const base = `#/admin/monitor?q=${encodeURIComponent(r.q.q || '')}&app=${app}&risk=${riskOnly ? 1 : 0}`;
    $app.querySelectorAll('[data-pick-u]').forEach((b) => b.addEventListener('click', () => { location.hash = base + '&u=' + b.dataset.pickU; }));
    $app.querySelectorAll('[data-pick-c]').forEach((b) => b.addEventListener('click', () => { location.hash = base + '&u=' + u.id + '&c=' + b.dataset.pickC; }));
    const g = document.getElementById('mon-grant');
    if (g) g.addEventListener('click', () => {
      const reason = document.getElementById('mon-reason').value;
      if (!reason) { LM.toast('열람 사유를 선택하세요'); return; }
      viewGrants[grantKey] = reason;
      Store.audit({ action: 'view', target: u.id, member: u.nickname, contact: c ? APPN(c.app) + ' / ' + c.nickname : '미지정', convId: ms[0] ? ms[0].convId : '-', reason });
      monitor(r);
    });
    bindConvo(u, c, ms);
    bindBan();
    bindOpen();
    { let groups = []; try { groups = Store.duplicateCustomers(users().filter((x) => !x.demo)); } catch (e) { groups = []; }
      const ids = (gi) => groups[gi].map((e) => e.id);
      $app.querySelectorAll('[data-dup-same]').forEach((b) => b.addEventListener('click', () => { const gi = +b.dataset.dupSame; const ow = $app.querySelector(`[data-dup-owner="${gi}"]`).value; Store.decideDup(ids(gi), true, ow); Store.audit({ action: 'settings', target: ow, reason: '중복 상담 판정: 같은 고객 · 담당 ' + ((Store.db.users[ow] || {}).nickname || ow) + ' · ' + groups[gi][0].nick }); LM.toast('같은 고객으로 확인 · 담당자를 지정했습니다'); monitor(r); }));
      $app.querySelectorAll('[data-dup-diff]').forEach((b) => b.addEventListener('click', () => { const gi = +b.dataset.dupDiff; Store.decideDup(ids(gi), false, ''); Store.audit({ action: 'settings', target: '-', reason: '중복 상담 판정: 다른 사람 · ' + groups[gi][0].nick }); LM.toast('다른 사람으로 표시했습니다 · 경고가 사라집니다'); monitor(r); })); }
    const jm = r.q.m || (r.q.risk === '1' && ms.slice().reverse().find((m) => m.risk && m.risk.length) || {}).id;
    if (jm) setTimeout(() => { const el = $app.querySelector(`tr[data-mid="${jm}"]`); if (el) { el.scrollIntoView({ block: 'center' }); el.classList.add('hit-flash'); } }, 80);
  }

  // 관리자 열람용 한국어 번역 (회원 데이터는 건드리지 않고 이 기기에만 캐시)
  let KO = null; const koQ = new Set();
  function koCache() { if (!KO) { try { KO = JSON.parse(localStorage.getItem('lm_ko_tr') || '{}'); } catch (e) { KO = {}; } } return KO; }
  function koOf(m) {
    if (!m || !m.text) return '';
    if (m.lang === 'ko') return m.text;
    if (m.trLang === 'ko' && m.translation) return m.translation;
    if (m.trs && (m.trs['ko|in'] || m.trs['ko|out'])) return m.trs['ko|in'] || m.trs['ko|out'];
    const k = m.id; const ca = koCache(); if (ca[k]) return ca[k];
    if (!koQ.has(k) && window.Engine && Engine.translate) {
      koQ.add(k);
      Engine.translate(m.text, 'ko', m.lang || undefined).then((r) => { if (r && r.text) { ca[k] = r.text; try { const ks = Object.keys(ca); if (ks.length > 3000) ks.slice(0, 500).forEach((x) => delete ca[x]); localStorage.setItem('lm_ko_tr', JSON.stringify(ca)); } catch (e) { /* noop */ } document.querySelectorAll('[data-ko="' + k + '"]').forEach((el) => { el.textContent = r.text; el.classList.remove('ops-muted'); }); } }).catch(() => {});
    }
    return null;
  }
  function koCell(m) { const v = koOf(m); return v === null ? `<span class="ops-muted" data-ko="${m.id}">번역 중…</span>` : esc(v); }
  function convoHtml(u, c, ms) {
    const pf = Engine.profile(ms);
    return `<div class="row wrap"><span class="badge">열람 사유: ${esc(viewGrants[u.id + '|' + (c ? c.id : 'none')])}</span><a class="link" href="#/admin/audit?q=${u.id}">이 회원의 열람 로그</a></div>
      ${c ? `<div class="metrics"><div class="card stack-xs"><span class="label">진행 기간</span><strong>${pf.firstTs ? Math.round((pf.lastTs - pf.firstTs) / 86400000) + '일' : '—'}</strong></div><div class="card stack-xs"><span class="label">단절 일수</span><strong>${pf.silentDays ?? '—'}일</strong></div><div class="card stack-xs"><span class="label">깊이 점수</span><strong>${pf.depth} / 100</strong></div><div class="card stack-xs"><span class="label">상대 분위기</span><strong>${pf.inCount ? { good: '좋음', low: '가라앉음', neutral: '보통' }[pf.mood] : '—'}</strong></div></div>` : ''}
      <div class="table-wrap"><table style="min-width:760px"><caption>원문 · 사용자 표시 번역 · AI 답장 제안 비교</caption><thead><tr><th style="width:80px">시각</th><th style="width:60px">방향</th><th>원문</th><th>한국어</th><th>사용자 화면 번역</th><th>AI 답장 제안 / 사용자가 고른 답장</th><th style="width:90px">입력 방식</th><th style="width:70px"></th></tr></thead>
      <tbody>${ms.map((m) => `<tr data-mid="${m.id}"${m.risk && m.risk.length ? ' style="background:var(--danger-bg)"' : ''}><td class="tiny">${fmt(m.ts)}</td><td>${m.dir === 'in' ? '<span class="badge gray">받음</span>' : '<span class="badge">보냄</span>'}</td><td class="wrap-cell" lang="${esc(m.lang)}">${esc(m.text)}${m.risk && m.risk.length ? `<br>${m.risk.map((x) => `<span class="badge alert">${x === 'money' ? '금전 요구' : '외부 유도'}</span>`).join(' ')}` : ''}</td><td class="wrap-cell" lang="ko"><span data-ko-cell>${koCell(m)}</span></td><td class="wrap-cell small muted" lang="${esc(m.trLang)}">${esc(m.translation || '—')}</td><td class="wrap-cell small">${m.suggestions && m.suggestions.length ? m.suggestions.map((s) => `<div class="${m.chosen === s ? 'strong' : 'muted'}">${m.chosen === s ? '✓ ' : '· '}${esc(s)}</div>`).join('') : (m.chosen ? '✓ ' + esc(m.chosen) : '—')}${m.nuance ? `<div class="tiny muted" style="margin-top:4px">뉘앙스: ${esc(m.nuance.slice(0, 120))}</div>` : ''}</td><td class="tiny">${esc({ paste: '붙여넣기', ocr: '스크린샷', home: '홈 번역', reply: '답장 복사', write: '직접 작성', coach: '코칭 예문', gift: '축하 문구', sample: '샘플' }[m.source] || m.source || '')}${m.provider === 'ai' ? '<br><span class="badge">AI</span>' : ''}</td><td><button class="btn sm secondary" type="button" data-note="${m.id}">메모</button></td></tr>`).join('') || '<tr><td colspan="7" class="muted">대화가 없습니다.</td></tr>'}</tbody></table></div>
      <div class="card soft stack" id="note-box"><h3>개선 메모</h3>
        <label class="stack-xs"><span class="label">개선 항목</span><select class="field" id="nt-cat"><option>번역·뉘앙스</option><option>답장 제안</option><option>지난 대화 연결</option><option>약속 추출</option><option>관계 코칭</option><option>문화 가이드</option><option>위험 감지</option></select></label>
        <label class="stack-xs"><span class="label">관찰 내용</span><textarea class="field" id="nt-body" rows="3" placeholder="예: '볼까요?'의 부드러운 제안 톤이 번역에서 사라짐"></textarea></label>
        <input type="hidden" id="nt-msg"><button class="btn full" type="button" id="nt-save">개선 메모 저장</button></div>
      ${banBox(u)}`;
  }
  function bindConvo(u, c, ms) {
    $app.querySelectorAll('[data-note]').forEach((b) => b.addEventListener('click', () => { document.getElementById('nt-msg').value = b.dataset.note; const m = ms.find((x) => x.id === b.dataset.note); document.getElementById('nt-body').value = m ? `[${m.text.slice(0, 40)}] ` : ''; document.getElementById('note-box').scrollIntoView({ behavior: 'smooth' }); }));
    const s = document.getElementById('nt-save');
    if (s) s.addEventListener('click', () => {
      const body = document.getElementById('nt-body').value.trim(); if (!body) return;
      const m = ms.find((x) => x.id === document.getElementById('nt-msg').value);
      Store.addQuality({ category: document.getElementById('nt-cat').value, body, userId: u.id, member: u.nickname, contact: c ? APPN(c.app) + ' / ' + c.nickname : '미지정', msgId: m ? m.id : null, pair: m ? LN(m.lang) + ' → ' + LN(m.trLang) : '' });
      document.getElementById('nt-body').value = ''; LM.toast('개선 메모를 저장했습니다');
    });
  }

  /* ---------- 신고 처리 ---------- */
  function reportsPage(r) {
    const st = r.q.st || 'all';
    const list = reports().filter((x) => st === 'all' || x.status === st);
    const sel = list.find((x) => x.id === r.q.id) || list[0];
    const su = sel ? findUser(sel.userId) : null;
    const sc = su && sel.contactId ? su.contacts.find((x) => x.id === sel.contactId) : null;
    const stLabel = { open: '<span class="badge alert">접수</span>', review: '<span class="badge warning">검토 중</span>', closed: '<span class="badge">처리 완료</span>' };
    page('reports', `
      <div class="stack-sm"><h1>신고 처리</h1><p class="muted">접수된 신고의 근거를 확인하고, 처리 상태와 조치 이력을 기록합니다.</p></div>
      <div class="admin-grid">
        <div class="card stack">
          <label class="stack-xs"><span class="label">처리 상태</span><select class="field" id="rp-st">${[['all', '전체'], ['open', '접수'], ['review', '검토 중'], ['closed', '처리 완료']].map(([v, l]) => `<option value="${v}" ${st === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          <div class="table-wrap"><table style="min-width:560px"><thead><tr><th>신고</th><th>유형</th><th>회원</th><th>앱 / 상대</th><th>상태</th></tr></thead><tbody>${list.map((x) => { const uu = findUser(x.userId); const cc = uu && x.contactId ? uu.contacts.find((y) => y.id === x.contactId) : null; return `<tr class="clickable ${sel && sel.id === x.id ? 'selected' : ''}" data-rp="${x.id}"><td>${esc(x.id)}</td><td>${REASON[x.reason] || x.reason}</td><td>${uu ? esc(uu.nickname + ' / ' + uu.id) : esc(x.userId)}</td><td>${cc ? esc(APPN(cc.app) + ' / ' + cc.nickname) : '—'}</td><td>${stLabel[x.status] || x.status}</td></tr>`; }).join('') || '<tr><td colspan="5" class="muted">신고가 없습니다.</td></tr>'}</tbody></table></div>
        </div>
        ${sel ? `<article class="card stack"><div class="between wrap"><h2>${esc(sel.id)} · ${REASON[sel.reason] || ''}</h2>${stLabel[sel.status] || ''}</div>
          <dl class="data-grid"><dt>제출 회원</dt><dd>${su ? esc(su.nickname + ' / ' + su.id) : esc(sel.userId)}</dd><dt>앱 / 상대</dt><dd>${sc ? esc(APPN(sc.app) + ' / ' + sc.nickname) : '—'}</dd><dt>접수 시각</dt><dd>${fmt(sel.createdAt)}</dd><dt>담당자</dt><dd>${esc(sel.assignee || '미배정')}</dd></dl>
          ${sel.note ? `<div class="card notice stack-xs"><h3>신고 내용</h3><p class="small">${esc(sel.note)}</p></div>` : ''}
          ${su && sel.contactId ? `<a class="link" href="#/admin/monitor?u=${su.id}&c=${sel.contactId}">관련 대화 비교 보기 ${icon('arrow', 'sm')}</a>` : ''}
          <label class="stack-xs"><span class="label">처리 결과</span><select class="field" id="rp-dec"><option value="review">추가 확인</option><option value="closed:safe">안전 안내 후 종결</option><option value="closed:none">위반 근거 부족으로 종결</option><option value="closed:ban">신고한 회원의 상대(외부)로 확인 · 회원에게 경고 안내</option><option value="closed:banmember">제출 회원 본인 위반 · 이용 차단</option></select></label>
          <label class="stack-xs"><span class="label">처리 근거 및 담당자 메모</span><textarea class="field" id="rp-note" rows="3" placeholder="확인한 메시지, 위반 여부, 후속 조치를 기록하세요."></textarea></label>
          <button class="btn full" type="button" id="rp-save">처리 결과 저장</button>
          <div class="stack-sm"><h3>처리 이력</h3><ul class="list">${(sel.history || []).map((h) => `<li class="list-row stack-xs"><span class="label">${fmt(h.ts)}</span><span>${esc(h.text === 'received' ? '신고 접수' : h.text)}</span></li>`).join('')}</ul></div>
        </article>` : ''}
      </div>`);
    document.getElementById('rp-st').addEventListener('change', (e) => { location.hash = '#/admin/reports?st=' + e.target.value; });
    $app.querySelectorAll('[data-rp]').forEach((tr) => tr.addEventListener('click', () => { location.hash = `#/admin/reports?st=${st}&id=${tr.dataset.rp}`; }));
    const sv = document.getElementById('rp-save');
    if (sv) sv.addEventListener('click', async () => {
      const dec = document.getElementById('rp-dec').value; const note = document.getElementById('rp-note').value.trim();
      const [status, kind] = dec.split(':');
      sel.status = status; sel.assignee = Store.db.admin.operator;
      sel.history = (sel.history || []).concat([{ ts: Date.now(), text: `${Store.db.admin.operator} · ${document.getElementById('rp-dec').selectedOptions[0].text}${note ? ' · ' + note : ''}` }]);
      const local = Store.db.reports.find((x) => x.id === sel.id); if (local && local !== sel) Object.assign(local, sel); else if (!local) Store.db.reports.unshift(sel);
      Store.persist(); Store.audit({ action: 'report', target: sel.id, reason: dec + (note ? ' · ' + note : '') }); Store.Sync.pushShared();
      if (kind === 'banmember' && su) {
        su.status = 'banned'; su.banReason = note || '신고 처리에 따른 이용 차단';
        if (Store.db.users[su.id]) Object.assign(Store.db.users[su.id], { status: 'banned', banReason: su.banReason });
        Store.persist();
        try { await Store.Sync.upsert('ban:' + su.id, { status: 'banned', reason: su.banReason, by: Store.db.admin.operator, ts: Date.now() }); } catch (e) { /* noop */ }
      }
      LM.toast('처리 결과를 저장했습니다'); LM.render();
    });
  }

  /* ---------- 개선 메모 ---------- */
  function quality() {
    const list = (serverShared && serverShared.quality) || Store.db.quality;
    page('quality', `<div class="stack-sm"><h1>개선 메모</h1><p class="muted">대화 모니터링 중 발견한 번역·조언·기억 기능의 부족한 점입니다. 개발 우선순위를 정할 때 사용합니다.</p></div>
      <div class="table-wrap"><table style="min-width:900px"><thead><tr><th>접수</th><th>항목</th><th>언어 방향</th><th>회원 / 상대</th><th>관찰 내용</th><th>작성</th><th>상태</th></tr></thead><tbody>
      ${list.map((q) => `<tr><td>${fmt(q.ts)}</td><td><span class="badge lilac">${esc(q.category)}</span></td><td>${esc(q.pair || '—')}</td><td>${esc((q.member || '') + ' · ' + (q.contact || ''))}</td><td class="wrap-cell">${esc(q.body)}</td><td>${esc(q.operator)}</td><td><button class="btn sm ${q.status === 'open' ? 'subtle' : 'secondary'}" type="button" data-q="${q.id}">${q.status === 'open' ? '검토 대기' : '개발 반영'}</button></td></tr>`).join('') || '<tr><td colspan="7" class="muted">아직 개선 메모가 없습니다. 전체 대화 화면에서 메시지별로 메모를 남길 수 있습니다.</td></tr>'}
      </tbody></table></div>`);
    $app.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => { const q = Store.db.quality.find((x) => x.id === b.dataset.q); if (q) { q.status = q.status === 'open' ? 'done' : 'open'; Store.persist(); Store.Sync.pushShared(); quality(); } }));
  }

  /* ---------- 감사로그 ---------- */
  function auditPage(r) {
    const q = (r.q.q || '').toLowerCase();
    const scope = new Set(users().map((u) => u.id)); const actF = r.q.act || '';
    // 캡처 시도는 그 직원을 관리하는 회사 관리자·팀장·본사가 모두 봄. 그 외 기록은 기존 규칙(팀장·본사직원은 자기 기록, 회사는 자기 회사)
    const all = ((serverShared && serverShared.audit) || Store.db.audit).filter((a) => (a.action === 'capture' ? (isSuper() || scope.has(a.target) || (isOrg() && a.orgId === role().org.id) || a.operator === Store.db.admin.operator) : (((!isLeader() && !isHqp() && !isHqb()) || a.operator === Store.db.admin.operator) && (!isOrg() || a.orgId === role().org.id))) && (!q || JSON.stringify(a).toLowerCase().includes(q)));
    const list = all.filter((a) => !actF || a.action === actF);
    const capN = all.filter((a) => a.action === 'capture').length;
    const act = { capture: '화면 캡처 시도', notice: '메시지 발송', view: '대화 열람', ban: '이용 차단', unban: '차단 해제', report: '신고 처리', login: '로그인', settings: '설정 변경', sync: '서버 동기화' };
    page('audit', `<div class="between wrap"><div class="stack-sm"><h1>열람 감사로그</h1><p class="muted">관리자·대상·시각·사유를 기록합니다. 기록은 수정·삭제할 수 없습니다.</p></div>
      <form id="au-f" class="row"><input class="field" name="q" type="search" placeholder="관리자 ID, 회원 ID, 대화 ID" value="${esc(r.q.q || '')}"><button class="btn" type="submit">검색</button></form></div>
      <div class="chip-row" style="gap:6px;display:flex;flex-wrap:wrap">${[['', '전체 ' + all.length], ['view', '대화 열람'], ['capture', '🚫 캡처 시도 ' + capN], ['notice', '메시지 발송'], ['login', '로그인'], ['settings', '설정 변경'], ['ban', '이용 차단']].map(([v, l]) => `<a class="btn sm ${actF === v ? '' : 'secondary'} ${v === 'capture' && capN ? 'danger-btn' : ''}" href="#/admin/audit?act=${v}&q=${encodeURIComponent(r.q.q || '')}">${l}</a>`).join('')}</div>
      <div class="table-wrap"><table style="min-width:900px"><thead><tr><th>시각</th><th>누가</th><th>행위</th><th>대상 회원</th><th>앱 / 상대 닉네임</th><th>대화 ID</th><th>사유</th></tr></thead><tbody>
      ${list.map((a) => `<tr><td>${fmt(a.ts)}</td><td>${esc(a.operator)}</td><td><span class="badge ${a.action === 'ban' || a.action === 'capture' ? 'alert' : a.action === 'view' ? '' : 'gray'}">${act[a.action] || esc(a.action)}</span></td><td>${esc((a.member ? a.member + ' / ' : '') + (a.target || ''))}</td><td>${esc(a.contact || '—')}</td><td>${esc(a.convId || '—')}</td><td class="wrap-cell">${esc(a.reason || '')}</td></tr>`).join('') || '<tr><td colspan="7" class="muted">기록이 없습니다.</td></tr>'}
      </tbody></table></div>`);
    document.getElementById('au-f').addEventListener('submit', (e) => { e.preventDefault(); location.hash = '#/admin/audit?act=' + actF + '&q=' + encodeURIComponent(new FormData(e.target).get('q')); });
  }

  /* ---------- 운영 설정 ---------- */
  function settings() {
    const sc = Store.Sync.cfg();
    const hq = Engine.hqAi();
    page('settings', `<div class="stack-sm"><h1>운영 설정</h1></div>
      <form class="card stack" id="hq-ai"><div class="between wrap"><h2>본사 AI 연결 <span class="ops-muted" style="font-size:13px">개인 회원은 본사 AI를 요금제로 사용합니다</span></h2>${hq.key || hq.proxy ? '<span class="badge">✓ 연결됨</span>' : '<span class="badge warning">미연결 · 무료 번역만 동작</span>'}</div>
        <p class="small muted">회원은 자기 키를 넣지 않습니다. 여기 넣은 본사 키(또는 본사 AI 서버 주소)로 번역·뉘앙스 분석·답장 추천·스크린샷 인식·하루 기억이 동작하고, 사용량과 금액은 'AI 사용량'에 회원별로 쌓입니다. 기업 거래처는 '거래처'에서 자체 키 사용을 허용할 수 있습니다.</p>
        <div class="row wrap" style="gap:10px">
          <label class="stack-xs"><span class="label">AI 회사</span><select class="field" name="provider"><option value="openai" ${hq.provider !== 'anthropic' ? 'selected' : ''}>OpenAI (ChatGPT)</option><option value="anthropic" ${hq.provider === 'anthropic' ? 'selected' : ''}>Anthropic (Claude)</option></select></label>
          <label class="stack-xs grow"><span class="label">본사 API 키</span><input class="field" name="key" type="password" autocomplete="off" value="${esc(hq.key || '')}" placeholder="sk-... / sk-ant-..."></label>
          <label class="stack-xs"><span class="label">모델</span><input class="field" name="model" value="${esc(hq.model || '')}" placeholder="gpt-4o-mini / claude-haiku-5-5"></label>
        </div>
        <label class="stack-xs"><span class="label">본사 AI 서버 주소 (운영용 · 넣으면 키 대신 이 서버로 호출)</span><input class="field" name="proxy" value="${esc(hq.proxy || '')}" placeholder="https://xxxx.supabase.co/functions/v1/ai-proxy"></label>
        <p class="tiny muted">테스트 서버에 AI 서버(ai-proxy)가 배포돼 있습니다: <code>${esc(Store.Sync.DEF.url)}/functions/v1/ai-proxy</code> <button class="btn sm secondary" type="button" id="hq-def">이 주소 넣기</button> · Supabase에서 OpenAI/Claude 키를 비밀값(OPENAI_API_KEY / ANTHROPIC_API_KEY)으로 넣어야 동작합니다. 저장하면 이 설정(키 제외)이 모든 PC에 자동 배포됩니다.</p>
        <label class="small row" style="gap:6px"><input type="checkbox" name="freeAi" ${hq.freeAi !== false ? 'checked' : ''}> 무료 회원에게도 AI 허용 (테스트 기간) — 끄면 프로·프리미엄·기업용만 AI 사용</label>
        <p class="tiny muted">⚠ 키를 여기만 넣으면 이 브라우저에서만 동작합니다. 모든 회원 기기에서 쓰려면 키를 서버(Supabase 비밀값)에 두고 저장소의 <code>supabase/functions/ai-proxy</code>를 배포한 뒤 서버 주소를 넣으세요. 키를 화면 코드에 넣으면 누구나 볼 수 있어 도용됩니다.</p>
        <div class="row" style="gap:8px"><button class="btn secondary" type="button" id="hq-test">연결 테스트</button><button class="btn" type="submit">저장</button><span class="small muted" id="hq-msg"></span></div>
      </form>
      <div class="admin-grid">
        <form class="card stack" id="sv"><div class="between wrap"><h2>공용 서버 (PC 간 동기화)</h2>${Store.Sync.enabled() ? `<span class="badge">✓ 연결됨${Store.Sync.lastOk ? ' · ' + new Date(Store.Sync.lastOk).toLocaleTimeString('ko-KR') : ''}</span>` : '<span class="badge warning">미연결</span>'}</div>
          <p class="small ${Store.Sync.err ? 'danger' : 'muted'}">${Store.Sync.err ? '최근 오류: ' + esc(Store.Sync.err) : '테스트 기본 서버(sangdam-magic)에 자동 연결됩니다. 팀·거래처·상담원 계정·지시·신고·열람기록·자리 등록이 6초 간격으로 모든 PC에 반영됩니다. 다른 서버를 쓰려면 아래에 입력하세요.'}</p>
          <p class="small muted">Supabase 무료 프로젝트를 만들고 저장소의 <code>supabase/schema.sql</code>을 실행한 뒤 URL과 anon 키를 넣으세요. 연결하면 모든 회원·게스트의 대화가 서버에 모이고, 이 화면에서 전부 확인할 수 있습니다. 회원 앱에도 같은 값이 필요하므로 <code>js/config.js</code>에 넣어 배포하세요.</p>
          <label class="stack-xs"><span class="label">Supabase URL</span><input class="field" name="url" value="${esc(sc.url && sc.url !== Store.Sync.DEF.url ? sc.url : '')}" placeholder="(기본 서버 사용 중) https://xxxx.supabase.co"></label>
          <label class="stack-xs"><span class="label">anon public key</span><input class="field" name="key" value="${esc(sc.key && sc.key !== Store.Sync.DEF.key ? sc.key : '')}" placeholder="(기본 서버 사용 중) sb_publishable_... / eyJ..."></label>
          <div class="two"><button class="btn" type="submit">저장</button><button class="btn secondary" type="button" id="sv-pull">서버에서 새로고침</button></div>
          <p class="small" id="sv-msg"></p>
        </form>
        <div class="stack">
          <form class="card stack" id="pin"><h2>관리자 계정</h2>
            <label class="stack-xs"><span class="label">운영자 ID</span><input class="field" name="op" value="${esc(Store.db.admin.operator)}"></label>
            <label class="stack-xs"><span class="label">새 비밀번호 (4자리 이상)</span><input class="field" name="pin" type="password" inputmode="numeric" autocomplete="new-password"></label>
            <button class="btn secondary" type="submit">저장</button></form>
          <div class="card stack-sm"><h2>데모 데이터</h2><p class="small muted">서버를 연결하기 전 CRM·모니터링 화면 확인용 데모 회원 8명입니다.</p>
            <div class="two"><button class="btn secondary" type="button" id="demo-on">데모 회원 넣기</button><button class="btn secondary" type="button" id="demo-off">데모 회원 지우기</button></div></div>
          <button class="btn secondary" type="button" id="logout">관리자 로그아웃</button>
        </div>
      </div>`);
    const hqf = document.getElementById('hq-ai');
    const readHq = () => { const f = new FormData(hqf); return { provider: f.get('provider'), key: String(f.get('key') || '').trim(), model: String(f.get('model') || '').trim(), proxy: String(f.get('proxy') || '').trim(), freeAi: !!f.get('freeAi') }; };
    hqf.addEventListener('submit', (e) => { e.preventDefault(); localStorage.setItem('lm_hq_ai', JSON.stringify(Object.assign(readHq(), { updatedAt: Date.now() }))); Store.Sync.schedule(); Store.audit({ action: 'settings', target: '-', reason: '본사 AI 연결 변경' }); LM.toast('저장했습니다'); settings(); });
    { const hd = document.getElementById('hq-def'); if (hd) hd.addEventListener('click', () => { hqf.querySelector('[name=proxy]').value = Store.Sync.DEF.url + '/functions/v1/ai-proxy'; }); }
    document.getElementById('hq-test').addEventListener('click', async () => { const prev = localStorage.getItem('lm_hq_ai'); localStorage.setItem('lm_hq_ai', JSON.stringify(readHq())); const m = document.getElementById('hq-msg'); m.textContent = '테스트 중…'; try { const out = await Engine.callLLM('Reply with one word.', 'Say OK', false); m.textContent = '✓ 연결됨: ' + String(out).slice(0, 40); } catch (x) { m.textContent = '✗ 실패: ' + (x.message || x); if (prev) localStorage.setItem('lm_hq_ai', prev); else localStorage.removeItem('lm_hq_ai'); } });
    document.getElementById('sv').addEventListener('submit', (e) => { e.preventDefault(); const f = new FormData(e.target); localStorage.setItem('lm_sync', JSON.stringify({ url: String(f.get('url')).trim(), key: String(f.get('key')).trim() })); Store.audit({ action: 'settings', target: '-', reason: '서버 연결 설정 변경' }); LM.toast('저장했습니다'); });
    document.getElementById('sv-pull').addEventListener('click', pull);
    document.getElementById('pin').addEventListener('submit', (e) => { e.preventDefault(); const f = new FormData(e.target); const p = String(f.get('pin') || ''); if (p && p.length < 4) { LM.toast('비밀번호는 4자리 이상'); return; } if (p) Store.db.admin.pin = p; Store.db.admin.operator = String(f.get('op') || 'OP-01'); Store.persist(); Store.audit({ action: 'settings', target: '-', reason: '관리자 계정 변경' }); LM.toast('저장했습니다'); });
    document.getElementById('demo-on').addEventListener('click', () => { Store.ensureDemoMembers(); LM.toast('데모 회원을 넣었습니다'); });
    document.getElementById('demo-off').addEventListener('click', () => { Store.clearDemo(); LM.toast('데모 회원을 지웠습니다'); });
    document.getElementById('logout').addEventListener('click', () => { authed = false; sessionStorage.removeItem('lm_admin_ok'); location.hash = '#/home'; });
  }
  async function pull() {
    const msg = document.getElementById('sv-msg');
    if (!Store.Sync.enabled()) { if (msg) msg.textContent = '서버 URL과 키를 먼저 저장하세요.'; return; }
    try {
      if (msg) msg.textContent = '불러오는 중…';
      const rows = await Store.Sync.pullAll();
      serverUsers = rows.filter((r) => r.key.startsWith('user:')).map((r) => r.data);
      const bans = rows.filter((r) => r.key.startsWith('ban:'));
      bans.forEach((b) => { const u = serverUsers.find((x) => 'ban:' + x.id === b.key); if (u && b.data) { u.status = b.data.status; u.banReason = b.data.reason || ''; } });
      serverShared = {};
      rows.filter((r) => r.key.startsWith('shared:')).forEach((r) => { serverShared[r.key.slice(7)] = r.data; });
      Store.audit({ action: 'sync', target: '-', reason: `서버 회원 ${serverUsers.length}명 불러옴` });
      if (msg) msg.textContent = `서버에서 회원 ${serverUsers.length}명을 불러왔습니다.`;
    } catch (e) { if (msg) msg.textContent = '불러오기 실패: ' + e.message; }
  }

  /* ---------- AI 사용량·금액 ---------- */
  const PRICE_DEFAULT = { 'gpt-4o-mini': [0.15, 0.6], 'gpt-4o': [2.5, 10], 'claude-haiku-5-5': [1, 5], 'claude-sonnet-5-5': [3, 15], 'free-mt': [0, 0] };
  function prices() { try { return Object.assign({}, PRICE_DEFAULT, JSON.parse(localStorage.getItem('lm_ai_prices') || '{}')); } catch (e) { return PRICE_DEFAULT; } }
  function fxRate() { return Number(localStorage.getItem('lm_fx') || 1400); }
  function usageCost(x, P) { const p = P[x.model] || (x.provider === 'mymemory' ? [0, 0] : [2.5, 10]); return ((x.in || 0) * p[0] + (x.out || 0) * p[1]) / 1e6; }
  function usageRows() { return users().flatMap((u) => (u.aiUsage || []).map((x) => ({ x, u }))); }
  function usageSummary(rows, P) {
    const ai = rows.filter((r) => r.x.provider !== 'mymemory');
    return { calls: ai.length, tin: ai.reduce((a, r) => a + (r.x.in || 0), 0), tout: ai.reduce((a, r) => a + (r.x.out || 0), 0), usd: ai.reduce((a, r) => a + usageCost(r.x, P), 0), mt: rows.length - ai.length, mtChars: rows.filter((r) => r.x.provider === 'mymemory').reduce((a, r) => a + (r.x.in || 0), 0) };
  }
  const usd = (v) => '$' + v.toFixed(v < 1 ? 4 : 2);
  const krw = (v) => '₩' + Math.round(v * fxRate()).toLocaleString('ko-KR');
  function aiUsagePage(r) {
    const P = prices();
    const rows = usageRows();
    const now = Date.now(); const d0 = new Date(); d0.setHours(0, 0, 0, 0);
    const mStart = new Date(d0.getFullYear(), d0.getMonth(), 1).getTime();
    const today = usageSummary(rows.filter((r) => r.x.ts >= d0.getTime()), P);
    const month = usageSummary(rows.filter((r) => r.x.ts >= mStart), P);
    const all = usageSummary(rows, P);
    // 일별 30일
    const days = []; for (let i = 29; i >= 0; i--) { const s = d0.getTime() - i * 86400000; days.push({ s, e: s + 86400000 }); }
    const daily = days.map((d) => usageSummary(rows.filter((r) => r.x.ts >= d.s && r.x.ts < d.e), P));
    const maxUsd = Math.max(0.0001, ...daily.map((d) => d.usd));
    // 회원별
    const byUser = users().map((u) => ({ u, s: usageSummary((u.aiUsage || []).filter((x) => x.ts >= mStart).map((x) => ({ x, u })), P) })).filter((x) => x.s.calls || x.s.mt).sort((a, b) => b.s.usd - a.s.usd);
    // 모델별
    const byModel = {}; rows.filter((r) => r.x.ts >= mStart).forEach(({ x }) => { const k = x.provider + ' · ' + x.model; byModel[k] = byModel[k] || { calls: 0, tin: 0, tout: 0, usd: 0 }; byModel[k].calls++; byModel[k].tin += x.in || 0; byModel[k].tout += x.out || 0; byModel[k].usd += usageCost(x, P); });
    page('ai', `
      <div class="between wrap"><div class="stack-sm"><h1>AI 사용량·금액</h1><p class="muted">회원 기기에서 보고된 호출 기준 예상 금액입니다. 실제 청구액은 OpenAI·Anthropic 콘솔에서 확인하세요.</p></div>
        <div class="row wrap"><a class="btn secondary" href="https://platform.openai.com/usage" target="_blank" rel="noopener">OpenAI 사용량 ↗</a><a class="btn secondary" href="https://console.anthropic.com/settings/usage" target="_blank" rel="noopener">Anthropic 사용량 ↗</a></div></div>
      <div class="metrics six">
        <div class="card stack-sm"><span class="label">오늘 예상 금액</span><strong class="metric">${krw(today.usd)}</strong><span class="tiny muted">${usd(today.usd)} · ${today.calls}회</span></div>
        <div class="card stack-sm"><span class="label">이번 달 예상 금액</span><strong class="metric">${krw(month.usd)}</strong><span class="tiny muted">${usd(month.usd)} · ${month.calls}회</span></div>
        <div class="card stack-sm"><span class="label">이번 달 토큰</span><strong class="metric">${((month.tin + month.tout) / 1000).toFixed(1)}K</strong><span class="tiny muted">입력 ${(month.tin / 1000).toFixed(1)}K · 출력 ${(month.tout / 1000).toFixed(1)}K</span></div>
        <div class="card stack-sm"><span class="label">무료 번역(기본)</span><strong class="metric">${month.mt}회</strong><span class="tiny muted">${month.mtChars.toLocaleString()}자 · 비용 없음</span></div>
        <div class="card stack-sm"><span class="label">AI 사용 회원(이번 달)</span><strong class="metric">${byUser.filter((x) => x.s.calls).length}명</strong></div>
        <div class="card stack-sm"><span class="label">누적 예상 금액</span><strong class="metric">${krw(all.usd)}</strong><span class="tiny muted">${usd(all.usd)} · ${all.calls}회</span></div>
      </div>
      <div class="card stack"><h2>최근 30일 일별 예상 금액</h2>
        <div class="spark">${daily.map((d, i) => `<div class="spark-col" title="${new Date(days[i].s).getMonth() + 1}/${new Date(days[i].s).getDate()} · ${krw(d.usd)} · ${d.calls}회"><span style="height:${Math.max(2, (d.usd / maxUsd) * 100)}%"></span><em>${i % 5 === 4 || i === 29 ? (new Date(days[i].s).getMonth() + 1) + '/' + new Date(days[i].s).getDate() : ''}</em></div>`).join('')}</div>
      </div>
      <div class="admin-grid">
        <div class="card stack"><h2>회원별 (이번 달)</h2>
          ${byUser.length ? `<div class="table-wrap"><table><thead><tr><th>회원</th><th>AI 호출</th><th>토큰</th><th>예상 금액</th><th>무료 번역</th></tr></thead><tbody>${byUser.map(({ u, s }) => `<tr class="clickable" data-crm="${esc(u.id)}"><td>${esc(u.nickname || '게스트')} / ${esc(u.id)}</td><td>${s.calls}</td><td>${((s.tin + s.tout) / 1000).toFixed(1)}K</td><td><b>${krw(s.usd)}</b> <span class="tiny muted">${usd(s.usd)}</span></td><td>${s.mt}</td></tr>`).join('')}</tbody></table></div>` : '<p class="small muted">이번 달 사용 기록이 없습니다.</p>'}
        </div>
        <div class="card stack"><h2>모델별 (이번 달)</h2>
          ${Object.keys(byModel).length ? `<div class="table-wrap"><table><thead><tr><th>모델</th><th>호출</th><th>입력/출력</th><th>예상 금액</th></tr></thead><tbody>${Object.entries(byModel).sort((a, b) => b[1].usd - a[1].usd).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${v.calls}</td><td>${(v.tin / 1000).toFixed(1)}K / ${(v.tout / 1000).toFixed(1)}K</td><td>${krw(v.usd)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="small muted">기록 없음</p>'}
          <details><summary class="small">단가 설정 (USD / 1M 토큰) · 환율</summary>
            <form id="price-form" class="stack-sm" style="margin-top:8px">${Object.entries(P).filter(([k]) => k !== 'free-mt').map(([k, v]) => `<div class="row"><span class="small" style="width:150px">${esc(k)}</span><input class="field" style="width:90px" name="${esc(k)}|in" value="${v[0]}"><input class="field" style="width:90px" name="${esc(k)}|out" value="${v[1]}"></div>`).join('')}
              <div class="row"><span class="small" style="width:150px">환율 (₩/$)</span><input class="field" style="width:90px" name="fx" value="${fxRate()}"></div>
              <button class="btn sm" type="submit">저장</button></form>
          </details>
        </div>
      </div>`);
    const f = document.getElementById('price-form');
    if (f) f.addEventListener('submit', (e) => { e.preventDefault(); const fd = new FormData(f); const out = {}; for (const [k, v] of fd.entries()) { if (k === 'fx') { localStorage.setItem('lm_fx', String(Number(v) || 1400)); continue; } const [m, io] = k.split('|'); out[m] = out[m] || [0, 0]; out[m][io === 'in' ? 0 : 1] = Number(v) || 0; } localStorage.setItem('lm_ai_prices', JSON.stringify(out)); aiUsagePage(r); });
    document.querySelectorAll('[data-crm]').forEach((tr) => tr.addEventListener('click', () => { location.hash = '#/admin/users?u=' + encodeURIComponent(tr.dataset.crm); }));
  }

  /* ---------- 메시지: 관리자·팀장 → 회원(상담원) 지시·경고, 회원 언어로 자동 번역 ---------- */
  const KIND = { instruction: ['지시', 'info'], notice: ['공지', 'neutral'], warning: ['경고', 'attention'], reply: ['답장', 'good'] };
  function noticesPage(r) {
    const us = users();
    const rows = us.map((u) => { const ns = Store.noticesOf(u.id); const last = ns[ns.length - 1]; return { u, ns, last, unreadR: ns.filter((n) => n.from === 'member' && !n.readAt).length, unreadM: ns.filter((n) => n.from !== 'member' && !n.readAt).length }; })
      .sort((a, b) => (b.unreadR - a.unreadR) || ((b.last ? b.last.ts : 0) - (a.last ? a.last.ts : 0)) || a.u.nickname.localeCompare(b.u.nickname));
    const q = (r.q.q || '').toLowerCase();
    rows.forEach((x) => { const pend = Store.pendingReply(x.u.id); x.st = x.unreadM ? 'unread' : pend.length ? 'waiting' : x.ns.some((n) => n.from === 'member') ? 'done' : x.ns.length ? 'read' : 'none'; x.pend = pend; });
    const fl = r.q.f || 'all';
    const cnt = (k) => rows.filter((x) => x.st === k).length;
    const list = rows.filter((x) => (!q || (x.u.nickname + ' ' + x.u.id).toLowerCase().includes(q)) && (fl === 'all' || x.st === fl));
    const STL = { unread: ['미열람', 'attention'], waiting: ['읽음·답장 대기', 'info'], done: ['답장 완료', 'good'], read: ['읽음', 'neutral'], none: ['', 'neutral'] };
    const sel = r.q.u ? findUser(r.q.u) : null;
    const rl = role();
    let thread = '<p class="ops-empty">왼쪽에서 받을 사람을 고르세요. 한국어로 쓰면 받는 사람이 앱에서 고른 언어로 번역돼 도착합니다.</p>';
    if (sel) {
      Store.markRepliesRead(sel.id);
      const ns = Store.noticesOf(sel.id);
      const L = sel.lang || 'ko';
      thread = `<div class="lm-msg-head between wrap"><div><h2>${esc(sel.nickname)} <span class="ops-muted">${esc(sel.id)}</span></h2><p class="ops-muted">받는 언어: <b>${esc(LN(L))}</b>${(() => { const t = Store.teamOf(sel.id); return t ? ' · ' + esc(t.name) : ''; })()} · ${esc((Store.PLANS[Store.planOf(sel)] || {}).name || '')}</p></div><div class="row" style="gap:6px">${viewAsBtn(sel)}<a class="btn secondary sm" href="#/admin/monitor?u=${sel.id}">대화 보기</a></div></div>
        <div class="lm-msg-thread" id="nt-thread">${ns.map((n) => {
          const mine = n.from !== 'member';
          const k = KIND[n.kind] || KIND.instruction;
          if (mine) {
            const trT = n.tr && n.tr[L];
            return `<div class="lm-msg out"><div class="lm-msg-meta"><span class="ops-tag" data-tone="${k[1]}">${k[0]}</span>${n.needReply ? ' <span class="ops-tag" data-tone="info">답장 필요</span>' : ''}${n.due ? ` <span class="ops-tag">마감 ${esc(n.due.replace('T', ' '))}</span>` : ''} ${esc(n.fromName)} · ${fmt(n.ts)}</div><div class="lm-msg-bubble ${n.kind === 'warning' ? 'warn' : ''}"><p>${esc(n.text)}</p>${L !== n.lang ? `<p class="lm-msg-tr" lang="${esc(L)}">→ ${esc(LN(L))}: ${trT ? esc(trT) : n.trFail ? '<span class="ops-tag" data-tone="attention">번역 실패 · 원문(한국어)으로 전달됨</span>' : '<span class="ops-muted">번역 중…</span>'}</p>` : ''}</div><div class="lm-msg-read">${n.readAt ? `✓✓ 읽음 ${fmt(n.readAt)}` : '✓ 전달됨 · 아직 안 읽음'}</div></div>`;
          }
          return `<div class="lm-msg in"><div class="lm-msg-meta"><span class="ops-tag" data-tone="good">답장</span> ${esc(n.fromName)} · ${fmt(n.ts)}</div><div class="lm-msg-bubble"><p>${esc((n.tr && n.tr.ko) || n.text)}</p>${n.lang !== 'ko' ? `<p class="lm-msg-tr" lang="${esc(n.lang)}">원문(${esc(LN(n.lang))}): ${esc(n.text)}</p>` : ''}</div></div>`;
        }).join('') || '<p class="ops-empty">아직 주고받은 메시지가 없습니다.</p>'}</div>
        <form class="lm-msg-compose" id="nt-form"><div class="row wrap" style="gap:8px"><label class="label" for="nt-kind">종류</label><select class="field sel-sm" id="nt-kind"><option value="instruction">지시</option><option value="notice">공지</option><option value="warning">경고</option></select><label class="small row" style="gap:4px"><input type="checkbox" id="nt-need"> 답장 필요</label><label class="small row" style="gap:4px">마감 <input class="field sel-sm" type="datetime-local" id="nt-due"></label><span class="ops-muted">한국어로 쓰면 ${esc(LN(L))}로 번역돼 전달됩니다</span></div>
          <textarea class="field" id="nt-text" rows="3" placeholder="예: 오늘 오후 문의는 환불 규정을 먼저 안내해 주세요." required></textarea>
          <div class="between wrap"><label class="small row" style="gap:6px"><input type="checkbox" id="nt-all"> ${rl.type === 'leader' ? '팀원 전체' : rl.type === 'org' ? '회사 상담원 전체' : '목록의 전체 회원'}에게 보내기 (각자 언어로)</label><button class="btn" type="submit">보내기</button></div></form>`;
    }
    page('notices', `<div class="stack-sm"><h1>메시지 <span class="ops-muted" style="font-size:14px">지시·공지·경고</span></h1><p class="muted">${rl.type === 'leader' ? '팀원' : '회원·상담원'}에게 한국어로 보내면 받는 사람이 고른 언어로 번역돼 앱에 도착합니다. 읽음 여부와 답장(한국어 번역)이 여기 표시됩니다.</p></div>
      <div class="lm-msg-layout">
        <aside class="card lm-msg-list"><form id="nt-q" role="search"><input class="field" name="q" type="search" placeholder="닉네임·ID 검색" value="${esc(r.q.q || '')}"></form>
          <div class="nt-filter">${[['all', '전체', rows.length], ['unread', '미열람', cnt('unread')], ['waiting', '답장 대기', cnt('waiting')], ['done', '답장 완료', cnt('done')]].map(([k, l, n]) => `<a href="#/admin/notices?f=${k}${sel ? '&u=' + sel.id : ''}" class="${fl === k ? 'on' : ''}">${l} <b>${n}</b></a>`).join('')}</div>
          <ul>${list.map((x) => `<li><a class="lm-msg-row ${sel && sel.id === x.u.id ? 'on' : ''}" href="#/admin/notices?u=${x.u.id}"><span class="grow"><strong>${esc(x.u.nickname)}</strong> <span class="ops-muted">${esc(LN(x.u.lang || 'ko'))}</span><br><span class="ops-muted ellipsis">${x.last ? esc(((x.last.from === 'member' ? '↩ ' : '') + ((x.last.from === 'member' && x.last.tr && x.last.tr.ko) || x.last.text)).slice(0, 40)) : '메시지 없음'}</span></span>${x.unreadR ? `<span class="nav-dot">${x.unreadR}</span>` : ''}${STL[x.st][0] ? `<span class="ops-tag" data-tone="${STL[x.st][1]}">${STL[x.st][0]}</span>` : ''}</a></li>`).join('') || '<li class="ops-muted" style="padding:8px">대상이 없습니다.</li>'}</ul></aside>
        <section class="card lm-msg-main">${thread}</section>
      </div>`);
    const qf = document.getElementById('nt-q'); if (qf) qf.addEventListener('submit', (e) => { e.preventDefault(); location.hash = '#/admin/notices?q=' + encodeURIComponent(new FormData(qf).get('q') || ''); });
    const th = document.getElementById('nt-thread'); if (th) th.scrollTop = th.scrollHeight;
    // 번역이 없는 메시지 채우기
    if (sel) Store.noticesOf(sel.id).forEach((n) => { const L = sel.lang || 'ko'; if (n.from !== 'member' && L !== n.lang && !(n.tr && n.tr[L])) Engine.translate(n.text, L, n.lang).then((o) => { Store.setNoticeTr(n.id, L, o.text); if (location.hash.includes('notices')) noticesPage(r); }).catch(() => {}); if (n.from === 'member' && n.lang !== 'ko' && !(n.tr && n.tr.ko)) Engine.translate(n.text, 'ko', n.lang).then((o) => { Store.setNoticeTr(n.id, 'ko', o.text); if (location.hash.includes('notices')) noticesPage(r); }).catch(() => {}); });
    const f = document.getElementById('nt-form');
    if (f) f.addEventListener('submit', async (e) => {
      e.preventDefault(); const text = document.getElementById('nt-text').value.trim(); if (!text) return;
      const kind = document.getElementById('nt-kind').value; const all = document.getElementById('nt-all').checked;
      const targets = all ? list.map((x) => x.u) : [sel];
      const btn = f.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = '번역해서 보내는 중…';
      const trCache = {};
      for (const u of targets) {
        const L = u.lang || 'ko'; let tr = {};
        let fail = false;
        if (L !== 'ko') { if (trCache[L] === undefined) { try { trCache[L] = (await Engine.translate(text, L, 'ko')).text; } catch (x) { trCache[L] = ''; } } if (trCache[L]) tr[L] = trCache[L]; else fail = true; }
        const t = Store.teamOf(u.id);
        Store.sendNotice({ userId: u.id, kind, needReply: document.getElementById('nt-need').checked, due: document.getElementById('nt-due').value, trFail: fail, from: rl.type === 'leader' ? 'leader' : rl.type === 'org' ? 'org' : 'admin', fromName: rl.type === 'leader' ? (rl.team.leaderName || '팀장') : (rl.type === 'hqp' || rl.type === 'hqb') ? '본사 ' + (rl.name || '관리자') : rl.type === 'org' ? (rl.org.adminName || rl.org.name) + ' (' + rl.org.name + ')' : '관리자', teamId: t ? t.id : '', text, lang: 'ko', tr });
      }
      Store.audit({ action: 'notice', target: targets.map((u) => u.id).join(','), member: targets.length > 1 ? targets.length + '명' : targets[0].nickname, reason: (KIND[kind] || KIND.instruction)[0] + ' 메시지 발송' });
      LM.toast(targets.length > 1 ? `${targets.length}명에게 각자 언어로 보냈습니다` : '보냈습니다');
      noticesPage(r);
    });
  }

  /* ---------- 팀·팀장 (관리자 전용) ---------- */
  function teamsPage(r) {
    if (isLeader()) return dashboard(r);
    const ts = scopedTeams();
    const orgIds = isOrg() ? new Set(ts.flatMap((t) => t.members || [])) : null;
    const all = isOrg() ? allUsers().filter((u) => orgIds.has(u.id)) : allUsers();
    const sel = (r.q.t && ts.find((t) => t.id === r.q.t)) || ts[0];
    page('teams', `<div class="between wrap"><div class="stack-sm"><h1>팀·팀장</h1><p class="muted">기업용: 팀장은 자기 팀 상담원의 대화·신고·AI 사용량만 보고, 팀원에게 지시 메시지를 보낼 수 있습니다. 팀장의 열람은 모두 감사로그에 남습니다.</p></div></div>
      <div class="lm-msg-layout">
        <aside class="card lm-msg-list"><ul>${ts.map((t) => `<li><a class="lm-msg-row ${sel && sel.id === t.id ? 'on' : ''}" href="#/admin/teams?t=${t.id}"><span class="grow"><strong>${esc(t.name)}</strong><br><span class="ops-muted">팀장 ${esc(t.leaderName || '-')} · ${esc(t.loginId)} · ${(t.members || []).length}명${!isOrg() && t.orgId && Store.orgById(t.orgId) ? ' · ' + esc(Store.orgById(t.orgId).name) : ''}</span></span></a></li>`).join('')}</ul>
          <form class="stack-sm" id="tm-new" style="border-top:1px solid var(--line);padding-top:12px"><h3>새 팀 만들기</h3>
            <input class="field" name="name" placeholder="팀 이름 (예: 베트남어 상담팀)" required><input class="field" name="leaderName" placeholder="팀장 이름" required>
            <div class="row" style="gap:6px"><input class="field" name="loginId" placeholder="팀장 아이디" required><input class="field" name="pin" placeholder="비밀번호" value="1234" required></div>
            ${isOrg() ? '' : `<select class="field" name="orgId"><option value="">소속 기업 (없음)</option>${Store.orgs().map((g) => `<option value="${g.id}">${esc(g.name)}</option>`).join('')}</select>`}<button class="btn full" type="submit">팀 만들기</button></form></aside>
        <section class="card lm-msg-main">${sel ? `<form class="stack" id="tm-edit"><div class="row wrap" style="gap:8px"><label class="stack-xs grow"><span class="label">팀 이름</span><input class="field" name="name" value="${esc(sel.name)}"></label><label class="stack-xs"><span class="label">팀장 이름</span><input class="field" name="leaderName" value="${esc(sel.leaderName || '')}"></label><label class="stack-xs"><span class="label">팀장 아이디</span><input class="field" name="loginId" value="${esc(sel.loginId)}"></label><label class="stack-xs"><span class="label">비밀번호</span><input class="field" name="pin" value="${esc(sel.pin)}"></label>${isOrg() ? '' : `<label class="stack-xs"><span class="label">소속 기업</span><select class="field" name="orgId"><option value="">(없음)</option>${Store.orgs().map((g) => `<option value="${g.id}" ${sel.orgId === g.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select></label>`}</div>
            <h3>팀원(상담원) <span class="ops-muted">${(sel.members || []).length}명 선택 · 팀원은 기업용 요금제로 바뀝니다</span></h3>
            <div class="row wrap" style="gap:6px"><input class="field grow" id="tm-q" type="search" placeholder="닉네임·ID로 찾기">${isOrg() ? `<input class="field" id="tm-add-id" placeholder="상담원 서비스 ID (예: U-0012)" style="max-width:220px"><button class="btn secondary" type="button" id="tm-add">ID로 추가</button>` : ''}</div>${isOrg() ? '<p class="ops-muted">상담원은 앱 설정에 보이는 자기 서비스 ID를 알려주면 추가할 수 있습니다. 다른 회사 소속 회원은 보이지 않습니다.</p>' : ''}
            <div class="tm-members">${all.sort((a, b) => ((sel.members || []).includes(b.id) - (sel.members || []).includes(a.id)) || a.nickname.localeCompare(b.nickname)).map((u) => { const other = Store.teamOf(u.id); return `<label class="tm-member" data-k="${esc((u.nickname + ' ' + u.id).toLowerCase())}"><input type="checkbox" name="m" value="${u.id}" ${(sel.members || []).includes(u.id) ? 'checked' : ''}> <span><strong>${esc(u.nickname)}</strong> <span class="ops-muted">${esc(u.id)} · ${esc(LN(u.lang || 'ko'))}${other && other.id !== sel.id ? ' · ' + esc(other.name) : ''}</span></span></label>`; }).join('')}</div>
            <div class="between wrap"><button class="btn danger-btn sm" type="button" id="tm-del">팀 삭제</button><div class="row" style="gap:6px"><a class="btn secondary" href="#/admin/notices">팀원에게 메시지</a><button class="btn" type="submit">저장</button></div></div></form>
${agentForm(sel)}` : '<p class="ops-empty">팀이 없습니다. 왼쪽에서 만드세요.</p>'}</section>
      </div>`);
    document.getElementById('tm-new').addEventListener('submit', (e) => { e.preventDefault(); Store.reload(); const f = new FormData(e.target); const lid = Store.normId(f.get('loginId')); if (!/^[a-z0-9._-]{2,30}$/.test(lid)) { LM.toast('팀장 아이디는 영문·숫자로 2자 이상'); return; } f.set('loginId', lid); if (Store.whoHasId(lid)) { LM.toast('이미 쓰는 아이디입니다'); return; } const t = Store.createTeam({ orgId: isOrg() ? role().org.id : (f.get('orgId') || ''), name: f.get('name'), leaderName: f.get('leaderName'), loginId: f.get('loginId'), pin: f.get('pin') }); Store.audit({ action: 'settings', target: t.id, reason: '팀 생성 · ' + t.name }); LM.toast('팀장 로그인: ' + t.loginId + ' / ' + t.pin + ' · 로그아웃 후 이 화면에서 로그인', 6000); location.hash = '#/admin/teams?t=' + t.id; });
    const ed = document.getElementById('tm-edit');
    if (ed) {
      const addB = document.getElementById('tm-add'); if (addB) addB.addEventListener('click', () => { const id = document.getElementById('tm-add-id').value.trim().toUpperCase(); const u = Store.db.users[id]; const ot = u && Store.teamOf(id); if (!u) { LM.toast('그 ID의 회원이 없습니다'); return; } if (ot && ot.orgId !== role().org.id) { LM.toast('다른 회사에 소속된 회원입니다'); return; } Store.teamsOfOrg(role().org.id).forEach((t) => { if (t.id !== sel.id) t.members = (t.members || []).filter((x) => x !== id); }); Store.updateTeam(sel.id, { members: Array.from(new Set((sel.members || []).concat(id))) }); Store.audit({ action: 'settings', target: sel.id, reason: '상담원 추가 · ' + id }); LM.toast(u.nickname + ' 님을 추가했습니다'); teamsPage(r); });
      document.getElementById('tm-q').addEventListener('input', (e) => { const v = e.target.value.toLowerCase(); ed.querySelectorAll('.tm-member').forEach((l) => { l.hidden = v && !l.dataset.k.includes(v); }); });
      ed.addEventListener('submit', (e) => { e.preventDefault(); const f = new FormData(ed); const members = f.getAll('m'); scopedTeams().forEach((t) => { if (t.id !== sel.id) t.members = (t.members || []).filter((id) => !members.includes(id)); }); Store.updateTeam(sel.id, Object.assign(isOrg() ? {} : { orgId: f.get('orgId') || '' }, { name: f.get('name'), leaderName: f.get('leaderName'), loginId: Store.normId(f.get('loginId')), pin: String(f.get('pin') || '').trim(), members })); Store.audit({ action: 'settings', target: sel.id, reason: '팀 수정 · ' + f.get('name') + ' · ' + members.length + '명' }); LM.toast('저장했습니다'); teamsPage(r); });
      bindAgentForm(sel, () => teamsPage(r));
      document.getElementById('tm-del').addEventListener('click', () => { Store.removeTeam(sel.id); Store.audit({ action: 'settings', target: sel.id, reason: '팀 삭제 · ' + sel.name }); location.hash = '#/admin/teams'; });
    }
  }

  /* ---------- 근태: 접속·로그아웃·근무·대화 시간, 무응답 ---------- */
  /* 월별 근태 */
  function attendanceMonth(r) {
    const us = users();
    const now = new Date(); const ym = r.q.m || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [Y, M] = ym.split('-').map(Number);
    const dim = new Date(Y, M, 0).getDate();
    const keys = Array.from({ length: dim }, (_, i) => `${Y}-${String(M).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`);
    const dur = (min) => (min >= 60 ? Math.floor(min / 60) + '시간 ' + (min % 60) + '분' : Math.round(min) + '분');
    const hmMin = (mins) => (mins == null ? '—' : `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(Math.round(mins % 60)).padStart(2, '0')}`);
    const minOfDay = (ts) => { const d = new Date(ts); return d.getHours() * 60 + d.getMinutes(); };
    const rows = us.map((u) => {
      const recs = keys.map((k) => (u.att || {})[k] || null);
      const worked = recs.filter(Boolean);
      const online = worked.reduce((a, x) => a + (x.online || 0), 0), active = worked.reduce((a, x) => a + (x.active || 0), 0);
      const ms = u.messages.filter((m) => { const d = new Date(m.ts); return d.getFullYear() === Y && d.getMonth() + 1 === M; });
      const talk = new Set(ms.map((m) => Math.floor(m.ts / 300000))).size * 5;
      const avgIn = worked.length ? worked.reduce((a, x) => a + minOfDay(x.first), 0) / worked.length : null;
      const avgOut = worked.length ? worked.reduce((a, x) => a + minOfDay(x.logoutAt || x.last), 0) / worked.length : null;
      const late = worked.filter((x) => minOfDay(x.first) > 9 * 60 + 30).length;
      return { u, recs, days: worked.length, online, active, talk, msgs: ms.length, avgIn, avgOut, late, team: Store.teamOf(u.id) };
    }).sort((a, b) => b.online - a.online);
    const prev = new Date(Y, M - 2, 1), next = new Date(Y, M, 1);
    const ymOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const lvl = (min) => (!min ? 0 : min < 120 ? 1 : min < 300 ? 2 : min < 420 ? 3 : 4);
    page('attendance', `<section class="lm-ops">
      <header class="ops-header"><div><h1>근태 · 월별 <span class="ops-muted" style="font-size:16px">${Y}년 ${M}월</span></h1><p class="ops-muted">출근일·지각(09:30 이후 첫 접속)·평균 출퇴근·총 접속·활동·대화 시간을 상담원별로 집계합니다.</p></div>
        <div class="ops-controls"><div class="ops-seg"><a href="#/admin/attendance">오늘</a><a href="#/admin/attendance?d=yesterday">어제</a><a href="#/admin/attendance?d=week">최근 7일</a><a href="#/admin/attendance?d=month" aria-current="true">월별·달력</a></div>
          <div class="ops-seg"><a href="#/admin/attendance?d=month&m=${ymOf(prev)}">‹ ${prev.getMonth() + 1}월</a><a aria-current="true">${M}월</a><a href="#/admin/attendance?d=month&m=${ymOf(next)}">${next.getMonth() + 1}월 ›</a></div></div></header>
      <div class="ops-kpis">
        <div class="ops-kpi"><h2>상담원</h2><strong class="ops-value">${rows.length}명</strong><p class="ops-muted">이번 달 출근 ${rows.filter((x) => x.days).length}명</p></div>
        <div class="ops-kpi"><h2>총 접속 시간</h2><strong class="ops-value">${dur(rows.reduce((a, x) => a + x.online, 0))}</strong></div>
        <div class="ops-kpi"><h2>평균 출근일</h2><strong class="ops-value">${(rows.reduce((a, x) => a + x.days, 0) / Math.max(1, rows.length)).toFixed(1)}일</strong></div>
        <div class="ops-kpi"><h2>지각 (09:30 이후)</h2><strong class="ops-value">${rows.reduce((a, x) => a + x.late, 0)}회</strong></div>
        <div class="ops-kpi"><h2>총 대화 시간</h2><strong class="ops-value">${dur(rows.reduce((a, x) => a + x.talk, 0))}</strong></div>
      </div>
      ${(() => {
        const pid = r.q.p || ''; const pr = pid ? rows.find((x) => x.u.id === pid) : null;
        const first = new Date(Y, M - 1, 1).getDay(); const cells = [];
        for (let i = 0; i < first; i++) cells.push('<div class="att-cal-cell empty"></div>');
        const todayK = Store.dkey(Date.now());
        keys.forEach((k, i) => {
          const wd = new Date(Y, M - 1, i + 1).getDay(); let body = ''; let lv = 0;
          if (pr) { const rc = pr.recs[i]; lv = lvl(rc && rc.online); body = rc ? `<span class="att-cal-t">${hmMin(minOfDay(rc.first))}~${hmMin(minOfDay(rc.logoutAt || rc.last))}</span><span class="att-cal-v">${dur(rc.online || 0)}</span>${minOfDay(rc.first) > 570 ? '<span class="ops-tag" data-tone="attention">지각</span>' : ''}` : (wd === 0 || wd === 6 ? '' : (k < todayK ? '<span class="att-cal-off">미접속</span>' : '')); }
          else { const day = rows.map((x) => x.recs[i]).filter(Boolean); const on = day.reduce((a, x) => a + (x.online || 0), 0); const lt = day.filter((x) => minOfDay(x.first) > 570).length; lv = lvl(day.length ? on / day.length : 0); body = day.length ? `<span class="att-cal-v">출근 ${day.length}명</span><span class="att-cal-t">총 ${dur(on)}</span>${lt ? `<span class="ops-tag" data-tone="attention">지각 ${lt}</span>` : ''}` : ''; }
          cells.push(`<a class="att-cal-cell ${wd === 0 ? 'sun' : wd === 6 ? 'sat' : ''} ${k === todayK ? 'today' : ''}" data-level="${lv}" href="#/admin/attendance?date=${k}${pid ? '&p=' + pid : ''}"><b>${i + 1}</b>${body}</a>`);
        });
        return `<section class="ops-panel"><header class="ops-panel-head"><h2>📅 근태 달력</h2><label class="row" style="gap:6px"><span class="ops-muted">상담원</span><select class="field" id="att-p" style="min-width:180px"><option value="">전체 (인원 합계)</option>${rows.map((x) => `<option value="${x.u.id}" ${pid === x.u.id ? 'selected' : ''}>${esc(x.u.nickname)}${x.team ? ' · ' + esc(x.team.name) : ''}</option>`).join('')}</select></label></header>
          ${pr ? `<p class="ops-muted" style="margin:0 0 8px">${esc(pr.u.nickname)} · 출근 ${pr.days}일 · 지각 ${pr.late}회 · 총 접속 ${dur(pr.online)} · 평균 ${hmMin(pr.avgIn)}~${hmMin(pr.avgOut)}</p>` : ''}
          <div class="att-cal">${['일', '월', '화', '수', '목', '금', '토'].map((w, i) => `<div class="att-cal-h ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}">${w}</div>`).join('')}${cells.join('')}</div>
          <p class="ops-muted" style="margin-top:8px">날짜를 누르면 그날 상담원별 출퇴근·접속·대화 시간을 봅니다.</p></section>`;
      })()}
      <section class="ops-panel"><header class="ops-panel-head"><h2>상담원별 월 합계</h2></header>
        <div class="ops-table-wrap"><table class="ops-table att-table"><thead><tr><th>상담원</th><th class="ops-num">출근일</th><th class="ops-num">지각</th><th class="ops-num">평균 첫 접속</th><th class="ops-num">평균 마지막</th><th class="ops-num">총 접속</th><th class="ops-num">일평균</th><th class="ops-num">실제 활동</th><th class="ops-num">대화 시간</th><th class="ops-num">처리 메시지</th></tr></thead><tbody>
        ${rows.map((x) => `<tr><td><b>${esc(x.u.nickname)}</b> <span class="ops-muted">${esc(x.u.id)}${x.team ? ' · ' + esc(x.team.name) : ''}</span></td><td class="ops-num">${x.days}일</td><td class="ops-num">${x.late ? `<span class="ops-tag" data-tone="attention">${x.late}</span>` : 0}</td><td class="ops-num">${hmMin(x.avgIn)}</td><td class="ops-num">${hmMin(x.avgOut)}</td><td class="ops-num">${x.online ? dur(x.online) : '—'}</td><td class="ops-num">${x.days ? dur(Math.round(x.online / x.days)) : '—'}</td><td class="ops-num">${x.active ? dur(x.active) : '—'}</td><td class="ops-num">${x.talk ? dur(x.talk) : '—'}</td><td class="ops-num">${x.msgs}</td></tr>`).join('')}
        </tbody></table></div></section>
      <section class="ops-panel"><header class="ops-panel-head"><h2>일별 접속 달력</h2><span class="ops-muted">칸 = 그날 접속 시간 (진할수록 길게)</span></header>
        <div class="ops-table-wrap"><table class="ops-table ops-heat att-month"><thead><tr><th>상담원</th>${keys.map((k, i) => { const wd = new Date(Y, M - 1, i + 1).getDay(); return `<th class="${wd === 0 || wd === 6 ? 'we' : ''}">${i + 1}</th>`; }).join('')}</tr></thead><tbody>
        ${rows.map((x) => `<tr><th scope="row">${esc(x.u.nickname)}</th>${x.recs.map((rc, i) => `<td data-level="${lvl(rc && rc.online)}" title="${keys[i]} · ${rc ? dur(rc.online) : '미접속'}">${rc ? Math.round(rc.online / 60) : ''}</td>`).join('')}</tr>`).join('')}
        </tbody></table></div></section>
    </section>`);
    const ap = document.getElementById('att-p'); if (ap) ap.addEventListener('change', () => { location.hash = '#/admin/attendance?d=month&m=' + ym + (ap.value ? '&p=' + ap.value : ''); });
  }
  function attendancePage(r) {
    if (r.q.d === 'month') return attendanceMonth(r);
    const us = users();
    const DAY = 86400000; const d0 = new Date(); d0.setHours(0, 0, 0, 0);
    const range = r.q.d || 'today';
    const th = Number(r.q.th || 30);
    const dSel = r.q.date ? (() => { const [y, m, d] = r.q.date.split('-').map(Number); return new Date(y, m - 1, d).getTime(); })() : null;
    const days = dSel ? [dSel] : range === 'yesterday' ? [d0.getTime() - DAY] : range === 'week' ? Array.from({ length: 7 }, (_, i) => d0.getTime() - i * DAY) : [d0.getTime()];
    const keyOf = (ts) => Store.dkey(ts);
    const hm = (ts) => { if (!ts) return '—'; const d = new Date(ts); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
    const dur = (min) => (min >= 60 ? Math.floor(min / 60) + '시간 ' + (min % 60) + '분' : Math.round(min) + '분');
    const now = Date.now();
    const rows = us.map((u) => {
      const recs = days.map((ds) => (u.att || {})[keyOf(ds)]).filter(Boolean);
      const msgs = u.messages.filter((m) => days.some((ds) => m.ts >= ds && m.ts < ds + DAY));
      const buckets = new Set(msgs.map((m) => Math.floor(m.ts / 300000)));
      const talkMin = buckets.size * 5;
      const online = recs.reduce((a, x) => a + (x.online || 0), 0), active = recs.reduce((a, x) => a + (x.active || 0), 0);
      const today = (u.att || {})[keyOf(d0.getTime())];
      const lastBeat = today && today.lastBeat;
      const curS = today && today.sessions[today.sessions.length - 1];
      const onNow = !!(lastBeat && now - lastBeat < 3 * 60000 && curS && !curS[2]);
      const lastAct = Math.max(lastBeat || 0, ...u.messages.map((m) => m.ts), 0);
      // 답장 대기: 상대가 보낸 마지막 메시지 이후 내 메시지가 없는 대화
      const wl = u.contacts.map((c) => { const ms = u.messages.filter((m) => m.contactId === c.id).sort((a, b) => a.ts - b.ts); const l = ms[ms.length - 1]; return l && l.dir === 'in' ? { ts: l.ts, cid: c.id, mid: l.id } : null; }).filter(Boolean).sort((a, b) => a.ts - b.ts);
      const waiting = wl.map((x) => x.ts);
      const overdue = waiting.filter((ts) => now - ts > th * 60000).length;
      const wfirst = wl[0] || null;
      const idle = onNow && lastAct && now - lastAct > th * 60000;
      const state = onNow ? (idle ? 'idle' : 'on') : (today && today.logoutAt ? 'out' : today ? 'away' : 'off');
      return { u, wfirst, recs, first: recs.length ? Math.min(...recs.map((x) => x.first)) : null, last: recs.length ? Math.max(...recs.map((x) => x.last)) : null, logout: today && today.logoutAt, online, active, talkMin, msgCount: msgs.length, waiting: waiting.length, overdue, state, idle, onNow, sessions: range === 'week' ? [] : (recs[0] ? recs[0].sessions : []), team: Store.teamOf(u.id) };
    }).sort((a, b) => ({ idle: 0, on: 1, away: 2, out: 3, off: 4 }[a.state] - { idle: 0, on: 1, away: 2, out: 3, off: 4 }[b.state]) || b.overdue - a.overdue);
    const ST = { on: ['접속 중', 'good'], idle: ['접속·무응답', 'attention'], away: ['자리 비움', 'neutral'], out: ['로그아웃', 'neutral'], off: ['미접속', 'neutral'] };
    const cntS = (k) => rows.filter((x) => x.state === k).length;
    const alerts = rows.filter((x) => x.idle || x.overdue);
    const q2 = (k, v) => { const o = Object.assign({}, r.q, { [k]: v }); return '#/admin/attendance?' + Object.entries(o).filter(([, x]) => x).map(([a, b]) => a + '=' + encodeURIComponent(b)).join('&'); };
    const seg = (k, cur, opts) => `<div class="ops-seg" role="group">${opts.map(([v, l]) => `<a href="${q2(k, v)}" aria-current="${String(cur) === String(v)}">${l}</a>`).join('')}</div>`;
    const bar = (ss, ds) => { if (!ss || !ss.length) return '<span class="ops-muted">—</span>'; return `<div class="att-bar" title="0시 ~ 24시">${ss.map((s) => { const L = Math.max(0, (s[0] - ds) / DAY * 100), W = Math.max(0.6, (s[1] - s[0]) / DAY * 100); return `<span style="left:${L}%;width:${W}%" title="${hm(s[0])}~${hm(s[1])}${s[2] === 2 ? ' 로그아웃' : s[2] === 1 ? ' 종료' : ' 접속 중'}"></span>`; }).join('')}<i style="left:${9 / 24 * 100}%"></i><i style="left:${18 / 24 * 100}%"></i></div>`; };
    page('attendance', `<section class="lm-ops">
      <header class="ops-header"><div><h1>근태${dSel ? ` <span class="ops-muted" style="font-size:16px">${esc(r.q.date)}</span> <a class="btn sm secondary" href="#/admin/attendance?d=month&m=${r.q.date.slice(0, 7)}${r.q.p ? '&p=' + r.q.p : ''}">📅 달력으로</a>` : ''}</h1><p class="ops-muted">접속(로그인)·로그아웃·접속 시간·실제 활동·대화 시간·답장 대기를 상담원별로 봅니다. 활동은 화면을 보며 최근 3분 안에 입력·클릭이 있었던 시간입니다.</p></div>
        <div class="ops-controls">${seg('d', range, [['today', '오늘'], ['yesterday', '어제'], ['week', '최근 7일'], ['month', '월별']])}${seg('th', th, [[10, '10분'], [30, '30분'], [60, '60분']])}<span class="ops-muted">무응답 기준</span></div></header>
      <div class="ops-kpis">
        <div class="ops-kpi"><h2>접속 중</h2><strong class="ops-value">${cntS('on') + cntS('idle')}명</strong><p class="ops-muted">전체 ${rows.length}명</p></div>
        <div class="ops-kpi"><h2>접속했지만 무응답</h2><strong class="ops-value">${cntS('idle')}명</strong><span class="ops-delta" data-tone="${cntS('idle') ? 'attention' : 'good'}">${th}분 이상 활동 없음</span></div>
        <div class="ops-kpi"><h2>답장 ${th}분 넘게 대기</h2><strong class="ops-value">${rows.reduce((a, x) => a + x.overdue, 0)}건</strong><span class="ops-delta" data-tone="${rows.some((x) => x.overdue) ? 'attention' : 'good'}">${rows.filter((x) => x.overdue).length}명</span></div>
        <div class="ops-kpi"><h2>평균 접속 시간</h2><strong class="ops-value">${dur(Math.round(rows.filter((x) => x.online).reduce((a, x) => a + x.online, 0) / Math.max(1, rows.filter((x) => x.online).length)))}</strong><p class="ops-muted">${range === 'week' ? '7일 합계 기준' : '접속한 사람 기준'}</p></div>
        <div class="ops-kpi"><h2>미접속</h2><strong class="ops-value">${cntS('off')}명</strong><p class="ops-muted">로그아웃 ${cntS('out')} · 자리 비움 ${cntS('away')}</p></div>
      </div>
      ${alerts.length ? `<section class="ops-panel"><header class="ops-panel-head"><h2>⚠ 확인이 필요한 상담원</h2><span class="ops-tag" data-tone="attention">${alerts.length}명</span></header><ul class="ops-queue">${alerts.map((x) => `<li><a class="ops-task" href="${x.overdue && x.wfirst ? `#/admin/monitor?u=${x.u.id}&c=${x.wfirst.cid}&m=${x.wfirst.mid}` : '#/admin/notices?u=' + x.u.id}"><span><b>${esc(x.u.nickname)}</b> <span class="ops-muted">${esc(x.team ? x.team.name : '')}</span><br><span class="ops-muted">${x.idle ? `접속 중인데 ${th}분 넘게 활동 없음 · ` : ''}${x.overdue ? `답장 ${th}분 넘게 대기 ${x.overdue}건` : ''}</span></span><span class="ops-tag" data-tone="attention">${x.overdue && x.wfirst ? '대화 열기 →' : '메시지 보내기 →'}</span></a></li>`).join('')}</ul></section>` : ''}
      <section class="ops-panel"><header class="ops-panel-head"><h2>상담원별 근태 <span class="ops-muted">${range === 'today' ? '오늘' : range === 'yesterday' ? '어제' : '최근 7일'}</span></h2></header>
        <div class="ops-table-wrap"><table class="ops-table att-table"><thead><tr><th scope="col">상담원</th><th scope="col">상태</th><th scope="col">첫 접속</th><th scope="col">마지막 활동</th><th scope="col">로그아웃</th><th scope="col" class="ops-num">접속 시간</th><th scope="col" class="ops-num">실제 활동</th><th scope="col" class="ops-num">대화 시간</th><th scope="col" class="ops-num">처리 메시지</th><th scope="col" class="ops-num">답장 대기</th>${range === 'week' ? '' : '<th scope="col" style="min-width:220px">접속 타임라인 (0~24시)</th>'}</tr></thead><tbody>
        ${rows.map((x) => `<tr class="clickable" data-open="${x.u.id}|"><td><b>${esc(x.u.nickname)}</b> <span class="ops-muted">${esc(x.u.id)}${x.team ? ' · ' + esc(x.team.name) : ''}</span></td><td><span class="ops-tag" data-tone="${ST[x.state][1]}">${ST[x.state][0]}</span></td><td>${hm(x.first)}</td><td>${hm(x.last)}</td><td>${x.logout ? hm(x.logout) : '—'}</td><td class="ops-num">${x.online ? dur(x.online) : '—'}</td><td class="ops-num">${x.active ? dur(x.active) + ` <span class="ops-muted">(${Math.round(x.active / Math.max(1, x.online) * 100)}%)</span>` : '—'}</td><td class="ops-num">${x.talkMin ? dur(x.talkMin) : '—'}</td><td class="ops-num">${x.msgCount}</td><td class="ops-num">${x.waiting ? `<span class="ops-tag" data-tone="${x.overdue ? 'attention' : 'neutral'}">${x.waiting}${x.overdue ? ` (${x.overdue} 지연)` : ''}</span>` : 0}</td>${range === 'week' ? '' : `<td>${bar(x.sessions, days[0])}</td>`}</tr>`).join('') || '<tr><td colspan="11" class="ops-muted">대상이 없습니다.</td></tr>'}
        </tbody></table></div>
        <p class="ops-muted">대화 시간은 메시지를 주고받은 5분 구간을 합한 값입니다. 화면을 닫거나 다른 창으로 오래 옮기면 '자리 비움', 로그아웃 버튼을 누르면 '로그아웃'으로 기록됩니다.</p></section>
    </section>`);
    bindOpen();
  }

  /* ---------- 본사 관리자 계정 (최종 관리자 전용) ---------- */
  function staffPage() {
    if (!isSuper()) return dashboard({ q: {} });
    const ls = Store.staff();
    const T2 = { personal: '일반고객 관리자', business: '기업고객 관리자' };
    page('staff', `<div class="stack-sm"><h1>관리자 계정</h1><p class="muted">최종 관리자(admin) 아래에 일반고객 관리자와 기업고객 관리자를 둡니다. 기업고객 관리자는 거래처(기업 관리자 → 팀장 → 상담원)를, 일반고객 관리자는 개인 회원을 관리합니다. 각 관리자의 열람·발송은 감사로그에 남습니다.</p></div>
      <div class="card"><div class="org-tree">
        <div class="ot-node ot-root">👑 최종 관리자 <span class="ops-muted">admin</span></div>
        <div class="ot-children">
          <div class="ot-col"><div class="ot-node">🙋 일반고객 관리자</div>${ls.filter((x) => x.type === 'personal').map((x) => `<div class="ot-leaf">${esc(x.name)} · ${esc(x.loginId)}</div>`).join('') || '<div class="ot-leaf ops-muted">없음</div>'}<div class="ot-leaf ops-muted">→ 개인 회원 ${allUsers().filter((u) => !Store.teamOf(u.id)).length}명</div></div>
          <div class="ot-col"><div class="ot-node">🏢 기업고객 관리자</div>${ls.filter((x) => x.type === 'business').map((x) => `<div class="ot-leaf">${esc(x.name)} · ${esc(x.loginId)}</div>`).join('') || '<div class="ot-leaf ops-muted">없음</div>'}
            ${Store.orgs().map((g) => `<div class="ot-leaf">└ 거래처 <b>${esc(g.name)}</b> (${esc(g.loginId)})${Store.teamsOfOrg(g.id).map((t) => `<div class="ot-sub">└ 팀장 ${esc(t.leaderName || '-')} · ${esc(t.name)} — 상담원 ${(t.members || []).length}명</div>`).join('')}</div>`).join('')}</div>
        </div></div></div>
      <div class="table-wrap"><table><thead><tr><th>구분</th><th>이름</th><th>아이디</th><th>비밀번호</th><th></th></tr></thead><tbody>
        ${ls.map((x) => `<tr><td>${T2[x.type]}</td><td>${esc(x.name)}</td><td>${esc(x.loginId)}</td><td>${esc(x.pin)}</td><td><button class="btn sm danger-btn" type="button" data-del-staff="${x.id}">삭제</button></td></tr>`).join('')}</tbody></table></div>
      <form class="card row wrap" id="sf-new" style="gap:8px;align-items:flex-end"><label class="stack-xs"><span class="label">구분</span><select class="field" name="type"><option value="personal">일반고객 관리자</option><option value="business">기업고객 관리자</option></select></label><label class="stack-xs"><span class="label">이름</span><input class="field" name="name" required></label><label class="stack-xs"><span class="label">아이디</span><input class="field" name="loginId" required></label><label class="stack-xs"><span class="label">비밀번호</span><input class="field" name="pin" value="1234" required></label><button class="btn" type="submit">관리자 추가</button></form>`);
    document.getElementById('sf-new').addEventListener('submit', (e) => { e.preventDefault(); const f = new FormData(e.target); const id = String(f.get('loginId')).trim().toLowerCase(); if (id === 'admin' || Store.staff().some((x) => x.loginId.toLowerCase() === id) || Store.orgs().some((g) => g.loginId.toLowerCase() === id) || Store.teams().some((t) => t.loginId.toLowerCase() === id)) { LM.toast('이미 쓰는 아이디입니다'); return; } const x = Store.addStaff({ type: f.get('type'), name: f.get('name'), loginId: f.get('loginId'), pin: f.get('pin') }); Store.audit({ action: 'settings', target: x.id, reason: '관리자 계정 추가 · ' + T2[x.type] + ' ' + x.name }); staffPage(); });
    $app.querySelectorAll('[data-del-staff]').forEach((b) => b.addEventListener('click', () => { const x = Store.staffById(b.dataset.delStaff); Store.removeStaff(b.dataset.delStaff); Store.audit({ action: 'settings', target: b.dataset.delStaff, reason: '관리자 계정 삭제 · ' + (x ? x.name : '') }); staffPage(); }));
  }

  /* ---------- 기업(상담회사) — 운영자 전용 ---------- */
  function orgsPage(r) {
    const gs = Store.orgs(); const sel = r.q.o ? Store.orgById(r.q.o) : gs[0];
    page('orgs', `<div class="stack-sm"><h1>거래처 (기업)</h1><p class="muted">상담회사마다 기업 관리자 계정을 만들고 팀을 묶습니다. 기업 관리자는 자기 회사 팀·팀장·상담원만 관리하고, 팀장은 자기 팀만 봅니다.</p></div>
      <div class="lm-msg-layout">
        <aside class="card lm-msg-list"><ul>${gs.map((g) => { const ts = Store.teamsOfOrg(g.id); return `<li><a class="lm-msg-row ${sel && sel.id === g.id ? 'on' : ''}" href="#/admin/orgs?o=${g.id}"><span class="grow"><strong>${esc(g.name)}</strong><br><span class="ops-muted">관리자 ${esc(g.adminName || '-')} · ${esc(g.loginId)} · 팀 ${ts.length} · 상담원 ${ts.reduce((a, t) => a + (t.members || []).length, 0)}명</span></span></a></li>`; }).join('') || '<li class="ops-muted" style="padding:8px">기업이 없습니다.</li>'}</ul>
          <form class="stack-sm" id="og-new" style="border-top:1px solid var(--line);padding-top:12px"><h3>기업 추가</h3><input class="field" name="name" placeholder="회사 이름" required><input class="field" name="adminName" placeholder="기업 관리자 이름" required><div class="row" style="gap:6px"><input class="field" name="loginId" placeholder="관리자 아이디" required><input class="field" name="pin" value="1234" placeholder="비밀번호" required></div><button class="btn full" type="submit">기업 추가</button></form></aside>
        <section class="card lm-msg-main">${sel ? `<form class="stack" id="og-edit"><div class="row wrap" style="gap:8px"><label class="stack-xs grow"><span class="label">회사 이름</span><input class="field" name="name" value="${esc(sel.name)}"></label><label class="stack-xs"><span class="label">관리자 이름</span><input class="field" name="adminName" value="${esc(sel.adminName || '')}"></label><label class="stack-xs"><span class="label">관리자 아이디</span><input class="field" name="loginId" value="${esc(sel.loginId)}"></label><label class="stack-xs"><span class="label">비밀번호</span><input class="field" name="pin" value="${esc(sel.pin)}"></label></div>
          <label class="small row" style="gap:6px"><input type="checkbox" name="byo" ${sel.allowOwnKey ? 'checked' : ''}> 이 거래처 상담원은 자체 AI 키 사용 허용 (끄면 본사 AI로 동작)</label>
          <h3>소속 팀</h3><div class="tm-members">${Store.teams().map((t) => `<label class="tm-member"><input type="checkbox" name="t" value="${t.id}" ${t.orgId === sel.id ? 'checked' : ''}> <span><strong>${esc(t.name)}</strong> <span class="ops-muted">팀장 ${esc(t.leaderName || '-')} · ${(t.members || []).length}명${t.orgId && t.orgId !== sel.id && Store.orgById(t.orgId) ? ' · 현재 ' + esc(Store.orgById(t.orgId).name) : ''}</span></span></label>`).join('') || '<p class="ops-muted">팀이 없습니다. 팀·팀장 메뉴에서 만드세요.</p>'}</div>
          <div class="between wrap"><button class="btn danger-btn sm" type="button" id="og-del">기업 삭제</button><div class="row" style="gap:6px"><a class="btn secondary" href="#/admin/teams">팀·팀장</a><button class="btn" type="submit">저장</button></div></div></form>` : '<p class="ops-empty">왼쪽에서 기업을 추가하세요.</p>'}</section></div>`);
    const taken = (id) => Store.staff().some((x) => x.loginId.toLowerCase() === id) || Store.teams().some((t) => t.loginId.toLowerCase() === id) || Store.orgs().some((g) => g.loginId.toLowerCase() === id) || id === 'admin';
    document.getElementById('og-new').addEventListener('submit', (e) => { e.preventDefault(); const f = new FormData(e.target); if (taken(String(f.get('loginId')).toLowerCase())) { LM.toast('이미 쓰는 아이디입니다'); return; } const g = Store.createOrg({ name: f.get('name'), adminName: f.get('adminName'), loginId: f.get('loginId'), pin: f.get('pin') }); Store.audit({ action: 'settings', target: g.id, reason: '기업 추가 · ' + g.name }); location.hash = '#/admin/orgs?o=' + g.id; });
    const ed = document.getElementById('og-edit');
    if (ed) {
      ed.addEventListener('submit', (e) => { e.preventDefault(); const f = new FormData(ed); const tids = f.getAll('t'); Store.teams().forEach((t) => { if (tids.includes(t.id)) t.orgId = sel.id; else if (t.orgId === sel.id) t.orgId = ''; }); Store.updateOrg(sel.id, { name: f.get('name'), adminName: f.get('adminName'), loginId: f.get('loginId'), pin: f.get('pin'), allowOwnKey: !!f.get('byo') }); Store.audit({ action: 'settings', target: sel.id, reason: '기업 수정 · ' + f.get('name') }); LM.toast('저장했습니다'); orgsPage(r); });
      document.getElementById('og-del').addEventListener('click', () => { Store.removeOrg(sel.id); Store.audit({ action: 'settings', target: sel.id, reason: '기업 삭제 · ' + sel.name }); location.hash = '#/admin/orgs'; });
    }
  }

  function viewAsBtn(u) { return `<button class="btn secondary sm" type="button" data-viewas="${esc(u.id)}">👁 이 사람 화면 보기 (한국어)</button>`; }
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-viewas]'); if (!b) return; const id = b.dataset.viewas; const u = Store.db.users[id]; Store.audit({ action: 'view', target: id, member: u ? u.nickname : id, contact: '회원 화면 전체', convId: '-', reason: '회원 화면으로 보기' }); Store.startViewAs(id); location.href = 'app.html#/chat'; location.reload(); });
  document.addEventListener('click', (e) => { if (e.target.closest('#adm-logout')) { authed = false; sessionStorage.removeItem('lm_admin_ok'); sessionStorage.removeItem('lm_admin_role'); Store.db.admin.operator = 'admin'; location.hash = '#/admin'; login(); } });
  window.Admin = {
    render(r) {
      if (!authed) return login();
      const p = r.id || 'dashboard';
      const r0 = role(); if (r0.type === 'none') { authed = false; sessionStorage.removeItem('lm_admin_ok'); sessionStorage.removeItem('lm_admin_role'); return login(); }
      const leaderBlocked = isSuper() ? [] : isHqp() ? ['settings', 'teams', 'orgs', 'staff', 'attendance'] : isHqb() ? ['quality', 'settings', 'staff'] : isOrg() ? ['quality', 'settings', 'orgs', 'staff'] : ['quality', 'settings', 'teams', 'orgs', 'staff'];
      ({ dashboard, users: crm, monitor, reports: reportsPage, quality, audit: auditPage, settings, ai: aiUsagePage, notices: noticesPage, teams: teamsPage, orgs: orgsPage, staff: staffPage, attendance: attendancePage }[ leaderBlocked.includes(p) ? 'dashboard' : p] || dashboard)(r);
      window.scrollTo(0, 0);
    },
  };
})();
