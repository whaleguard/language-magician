/* 언어의 마술사 — 운영(관리자) 콘솔 · 한국어 UI */
(function () {
  'use strict';

  const $app = document.getElementById('app');
  const esc = (s) => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (n, c) => `<svg class="icon ${c || ''}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const APPN = (id) => (DATA.APPS.find((a) => a.id === id) || { name: id || '기타' }).name;
  const LN = (l) => ({ ko: '한국어', zh: '중국어', 'zh-TW': '중국어(번체)', ja: '일본어', vi: '베트남어', en: '영어', th: '태국어', id: '인도네시아어', es: '스페인어', ru: '러시아어', mn: '몽골어', uz: '우즈베크어', ne: '네팔어', tl: '필리핀어', hi: '힌디어', ar: '아랍어', fr: '프랑스어', de: '독일어', pt: '포르투갈어' }[l] || l);
  const REL = { romance: '연인 목표', friend: '친구', business: '비즈니스' };
  const STAGE_KO = I18N.STAGE_NAMES.ko;
  const REASON = { money: '금전 요구·투자 권유', harass: '괴롭힘·혐오', sexual: '음란·성적 요구', fake: '사칭·거짓 정보', other: '기타' };
  const fmt = (ts) => { const d = new Date(ts); return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const fmtD = (ts) => { const d = new Date(ts); return `${d.getMonth() + 1}월 ${d.getDate()}일`; };
  const daysAgo = (ts) => Math.max(0, Math.floor((Date.now() - ts) / 86400000));

  let authed = sessionStorage.getItem('lm_admin_ok') === '1';
  let serverUsers = null; // 서버에서 가져온 회원
  let serverShared = null;
  const viewGrants = {}; // 이번 세션에서 열람 사유를 기록한 대화

  function users() {
    const local = Object.values(Store.db.users);
    if (!serverUsers) return local;
    const map = {};
    local.filter((u) => u.demo).forEach((u) => { map[u.id] = u; });
    serverUsers.forEach((u) => { map[u.id] = u; });
    local.filter((u) => !u.demo && !map[u.id]).forEach((u) => { map[u.id] = u; });
    return Object.values(map);
  }
  function reports() { return (serverShared && serverShared.reports ? serverShared.reports.concat(Store.db.reports.filter((r) => r.demo)) : Store.db.reports); }
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
    const items = [['dashboard', '운영 현황'], ['users', '회원 CRM'], ['monitor', '전체 대화'], ['reports', '신고 처리'], ['quality', '개선 메모'], ['audit', '열람 감사로그'], ['ai', 'AI 사용량'], ['settings', '운영 설정']];
    return `<header class="top between wrap">
      <a class="brand" href="#/admin/dashboard"><img class="brand-img" src="assets/lm-mark.png" alt="LM">언어의 마술사 운영</a>
      <nav class="admin-menu" aria-label="관리자 메뉴">${items.map(([k, l]) => `<a href="#/admin/${k}" ${active === k ? 'aria-current="page"' : ''}>${l}</a>`).join('')}<a href="#/home" class="muted">앱으로</a></nav>
    </header>`;
  }
  function page(active, inner) {
    $app.innerHTML = `<div class="screen admin" lang="ko">${nav(active)}<div class="content stack-lg">${serverUsers ? '<span class="badge">서버 동기화 데이터 표시 중</span>' : (Store.Sync.enabled() ? '<span class="badge warning">서버 연결됨 · 새로고침으로 전체 회원을 불러오세요</span>' : '<span class="badge gray">이 기기 데이터 + 데모 회원 표시 중 · 운영 설정에서 서버를 연결하면 모든 회원 대화가 모입니다</span>')}${inner}</div></div>`;
  }

  /* ---------- 로그인 ---------- */
  function login() {
    $app.innerHTML = `<div class="screen admin" lang="ko"><div class="content stack-lg" style="max-width:420px;margin:8vh auto">
      <span class="brand"><img class="brand-img" src="assets/lm-mark.png" alt="LM">언어의 마술사 운영</span>
      <form class="card stack" id="al"><h1>관리자 로그인</h1><p class="small muted">아이디와 비밀번호를 입력하세요. 모든 대화 열람은 감사로그에 기록됩니다.</p>
        <label class="stack-xs"><span class="label">아이디</span><input class="field" name="id" value="admin" autocomplete="username"></label>
        <label class="stack-xs"><span class="label">비밀번호</span><input class="field" name="pin" type="password" autocomplete="current-password" value=""></label>
        <button class="btn full" type="submit">로그인</button>
        <p class="tiny muted">테스트 버전 · 아이디 admin / 비밀번호 1234</p>
      </form><a class="link" href="#/home">← 앱으로</a></div></div>`;
    document.getElementById('al').addEventListener('submit', (e) => {
      e.preventDefault(); const f = new FormData(e.target);
      if (String(f.get('id') || '').trim().toLowerCase() === String(Store.db.admin.loginId || 'admin').toLowerCase() && String(f.get('pin')) === String(Store.db.admin.pin)) {
        Store.db.admin.operator = 'admin'; Store.persist();
        authed = true; sessionStorage.setItem('lm_admin_ok', '1');
        Store.ensureDemoMembers();
        Store.audit({ action: 'login', target: '-', reason: '관리자 로그인' });
        location.hash = '#/admin/dashboard';
      } else { LM.toast('아이디 또는 비밀번호가 맞지 않습니다'); }
    });
  }

  /* ---------- 운영 현황 ---------- */
  function dashboard() {
    const us = users();
    const td = new Date(); td.setHours(0, 0, 0, 0);
    const allMsgs = us.flatMap((u) => u.messages.map((m) => ({ m, u })));
    const todayMsgs = allMsgs.filter((x) => x.m.ts >= td.getTime());
    const members = us.filter((u) => u.type === 'member').length;
    const guests = us.filter((u) => u.type === 'guest').length;
    const open = reports().filter((r) => r.status !== 'closed');
    const riskMsgs = allMsgs.filter((x) => x.m.risk && x.m.risk.length);
    const pairs = {};
    allMsgs.forEach(({ m }) => { if (m.lang && m.trLang) { const k = LN(m.lang) + ' → ' + LN(m.trLang); pairs[k] = (pairs[k] || 0) + 1; } });
    const apps = {};
    us.forEach((u) => u.contacts.forEach((c) => { apps[c.app] = (apps[c.app] || 0) + 1; }));
    const silent = us.filter((u) => { const s = memberStats(u); return daysAgo(s.lastTs) >= 7; }).length;
    const totalContacts = us.reduce((a, u) => a + u.contacts.length, 0);
    const bars = (obj, n) => { const tot = Object.values(obj).reduce((a, b) => a + b, 0) || 1; return Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `<div class="row"><span class="small" style="width:150px">${esc(k)}</span><div class="bar"><span style="width:${(v / tot) * 100}%"></span></div><span class="tiny" style="width:60px;text-align:right">${v} · ${Math.round((v / tot) * 100)}%</span></div>`).join(''); };
    page('dashboard', `
      <div class="between wrap"><div class="stack-sm"><h1>운영 현황</h1><p class="muted">${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월 ${new Date().getDate()}일 기준</p></div><a class="btn" href="#/admin/monitor">전체 대화 열기</a></div>
      ${(() => {
        const DAY = 86400000; const d7 = [];
        for (let i = 6; i >= 0; i--) { const st = td.getTime() - i * DAY; d7.push({ st, n: allMsgs.filter((x) => x.m.ts >= st && x.m.ts < st + DAY).length, nu: us.filter((u) => u.createdAt >= st && u.createdAt < st + DAY).length }); }
        const mx = Math.max(1, ...d7.map((d) => d.n));
        const P = prices(); const mS = new Date(td.getFullYear(), td.getMonth(), 1).getTime(); const mo = usageSummary(usageRows().filter((r) => r.x.ts >= mS), P);
        const todo = [
          [open.length, '미처리 신고', '#/admin/reports', 'coral'],
          [riskMsgs.length, '위험 표시 대화 확인', '#/admin/monitor?risk=1', 'coral'],
          [silent, '7일 이상 대화가 끊긴 회원', '#/admin/users', 'lavender'],
          [Store.db.quality.filter((q) => q.status === 'open').length, '개선 메모 처리', '#/admin/quality', 'sky'],
        ];
        return `<div class="adm-dashboard">
          <div class="metrics">
            <a class="card stack-sm" href="#/admin/users"><span class="label">회원 (닉네임 · 게스트)</span><strong class="metric">${members + guests}명</strong><span class="tiny muted">닉네임 ${members} · 게스트 ${guests} · 관리 상대 ${totalContacts}명</span></a>
            <a class="card stack-sm" href="#/admin/monitor"><span class="label">오늘 들어온 대화</span><strong class="metric">${todayMsgs.length}건</strong><span class="tiny muted">어제 ${d7[5].n}건</span></a>
            <a class="card stack-sm" href="#/admin/ai"><span class="label">이번 달 AI 예상 금액</span><strong class="metric">${krw(mo.usd)}</strong><span class="tiny muted">${mo.calls}회 · ${((mo.tin + mo.tout) / 1000).toFixed(1)}K 토큰</span></a>
          </div>
          <div class="adm-work">
            <section class="card adm-today" aria-label="오늘 할 일"><h2>오늘 할 일 <span class="tiny muted">${todo.filter((x) => x[0]).length}건 대기</span></h2>
              <ul>${todo.map(([n, l, h, tone]) => `<li><a class="adm-task ${n ? 'is-' + tone : 'is-done'}" href="${h}"><span>${l}</span><strong>${n ? n + '건 →' : '완료'}</strong></a></li>`).join('')}</ul></section>
            <section class="card adm-trend" aria-label="최근 7일 추이"><h2>최근 7일 들어온 대화</h2>
              <div class="spark">${d7.map((d) => { const dt = new Date(d.st); return `<div class="spark-col" title="${dt.getMonth() + 1}/${dt.getDate()} · 대화 ${d.n}건 · 가입 ${d.nu}명"><span style="height:${Math.max(3, (d.n / mx) * 100)}%"></span><em>${dt.getMonth() + 1}/${dt.getDate()} · ${d.n}</em></div>`; }).join('')}</div></section>
          </div>
        </div>`;
      })()}
      <div class="admin-grid">
        <div class="card stack"><div class="between wrap"><h2>최근 위험 표시</h2><a class="link" href="#/admin/monitor?risk=1">대화에서 확인</a></div>
          ${riskMsgs.length ? `<div class="table-wrap"><table><thead><tr><th>시각</th><th>회원</th><th>앱 / 상대</th><th>분류</th><th>원문</th></tr></thead><tbody>${riskMsgs.sort((a, b) => b.m.ts - a.m.ts).slice(0, 8).map(({ m, u }) => { const c = u.contacts.find((x) => x.id === m.contactId); return `<tr class="clickable" data-open="${u.id}|${m.contactId || ''}"><td>${fmt(m.ts)}</td><td>${esc(u.nickname)} / ${esc(u.id)}</td><td>${c ? esc(APPN(c.app) + ' / ' + c.nickname) : '미지정'}</td><td>${m.risk.map((r) => `<span class="badge alert">${r === 'money' ? '금전 요구' : '외부 유도'}</span>`).join(' ')}</td><td class="wrap-cell">${esc(m.text.slice(0, 70))}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="small muted">위험 표시가 없습니다.</p>'}
        </div>
        <div class="card stack"><h2>신고 및 단절</h2>
          <ul class="list">
            <li class="list-row between"><span>미처리 신고</span><strong>${open.length}건</strong></li>
            <li class="list-row between"><span>7일 이상 대화가 없는 회원</span><strong>${silent}명</strong></li>
            <li class="list-row between"><span>개선 메모(미처리)</span><strong>${Store.db.quality.filter((q) => q.status === 'open').length}건</strong></li>
            <li class="list-row between"><span>오늘 열람 기록</span><strong>${Store.db.audit.filter((a) => a.ts >= td.getTime()).length}건</strong></li>
          </ul>
          <a class="btn secondary full" href="#/admin/reports">신고 목록 보기</a>
        </div>
      </div>
      <div class="admin-grid">
        <div class="card stack"><h2>언어 방향 분포</h2><div class="mini-bars">${bars(pairs, 8) || '<p class="small muted">데이터 없음</p>'}</div></div>
        <div class="card stack"><h2>사용 메신저 분포 (상대 기준)</h2><div class="mini-bars">${bars(Object.fromEntries(Object.entries(apps).map(([k, v]) => [APPN(k), v])), 9) || '<p class="small muted">데이터 없음</p>'}</div></div>
      </div>`);
    bindOpen();
  }
  function bindOpen() { $app.querySelectorAll('[data-open]').forEach((tr) => tr.addEventListener('click', () => { const [u, c] = tr.dataset.open.split('|'); location.hash = `#/admin/monitor?u=${u}&c=${c}`; })); }

  /* ---------- 회원 CRM ---------- */
  function crm(r) {
    const q = (r.q.q || '').toLowerCase();
    const type = r.q.type || 'all';
    const list = users().filter((u) => (type === 'all' || (type === 'banned' ? u.status === 'banned' : u.type === type)) && (!q || (u.nickname + ' ' + u.id + ' ' + u.contacts.map((c) => c.nickname).join(' ')).toLowerCase().includes(q)))
      .map((u) => ({ u, s: memberStats(u) })).sort((a, b) => b.s.lastTs - a.s.lastTs);
    const sel = r.q.u ? findUser(r.q.u) : (list[0] && list[0].u);
    page('users', `
      <div class="stack-sm"><h1>회원 CRM</h1><p class="muted">닉네임·서비스 ID·상대 닉네임으로 검색하고, 회원별 연락처·대화 흐름·위험 표시를 확인합니다. 실명은 수집하지 않습니다.</p></div>
      <form class="card row wrap" id="crm-f" role="search">
        <label class="grow stack-xs"><span class="label">닉네임 / 서비스 ID / 상대 닉네임</span><input class="field" name="q" type="search" value="${esc(r.q.q || '')}" placeholder="예: Lin, U-0001, 서준"></label>
        <label class="stack-xs"><span class="label">계정 유형</span><select class="field" name="type">${[['all', '전체'], ['member', '닉네임 회원'], ['guest', '게스트'], ['banned', '차단 계정']].map(([v, l]) => `<option value="${v}" ${type === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <button class="btn" type="submit" style="align-self:end">검색</button>
      </form>
      <div class="table-wrap"><table style="min-width:980px"><caption>회원 ${list.length}명</caption><thead><tr><th>닉네임 / ID</th><th>유형</th><th>표시 언어</th><th>대화 상대</th><th>들어온 대화</th><th>주 사용 앱</th><th>평균 깊이</th><th>최근 대화</th><th>위험·신고</th><th>상태</th></tr></thead>
      <tbody>${list.map(({ u, s }) => { const top = Object.entries(s.apps).sort((a, b) => b[1] - a[1])[0]; return `<tr class="clickable ${sel && sel.id === u.id ? 'selected' : ''}" data-u="${u.id}"><th scope="row">${esc(u.nickname)} / ${esc(u.id)}${u.demo ? ' <span class="badge gray">데모</span>' : ''}</th><td>${u.type === 'member' ? '닉네임 회원' : '게스트'}</td><td>${LN(u.lang)}</td><td>${u.contacts.length}명</td><td>${s.msgCount}건</td><td>${top ? esc(APPN(top[0])) : '—'}</td><td>${s.avgDepth}</td><td>${fmt(s.lastTs)} <span class="tiny muted">(${daysAgo(s.lastTs)}일 전)</span></td><td>${s.risk ? `<span class="badge alert">위험 ${s.risk}</span>` : ''} ${s.reps ? `<span class="badge warning">신고 ${s.reps}</span>` : ''}${!s.risk && !s.reps ? '<span class="badge gray">없음</span>' : ''}</td><td>${u.status === 'banned' ? '<span class="badge alert">차단</span>' : '<span class="badge">이용 중</span>'}</td></tr>`; }).join('')}</tbody></table></div>
      ${sel ? crmDetail(sel) : ''}`);
    document.getElementById('crm-f').addEventListener('submit', (e) => { e.preventDefault(); const f = new FormData(e.target); location.hash = `#/admin/users?q=${encodeURIComponent(f.get('q'))}&type=${f.get('type')}`; });
    $app.querySelectorAll('[data-u]').forEach((tr) => tr.addEventListener('click', () => { location.hash = `#/admin/users?q=${encodeURIComponent(r.q.q || '')}&type=${type}&u=${tr.dataset.u}`; }));
    bindOpen();
    bindBan();
  }
  function crmDetail(u) {
    const s = memberStats(u);
    const totApps = Object.values(s.apps).reduce((a, b) => a + b, 0) || 1;
    return `<article class="card stack-lg" id="crm-detail">
      <div class="between wrap"><div class="row"><span class="avatar">${esc([...u.nickname][0] || '?')}</span><div><h2>${esc(u.nickname)} <span class="small muted">${esc(u.id)}</span></h2><p class="small muted">${u.type === 'member' ? '닉네임 회원' : '게스트'} · 표시 언어 ${LN(u.lang)} · 가입 ${fmtD(u.createdAt)}</p></div></div>
        <div class="row wrap" style="gap:8px">${viewAsBtn(u)}<a class="btn" href="#/admin/monitor?u=${u.id}">${esc(u.nickname)} 대화 열기</a></div></div>
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
        <button class="btn" type="submit" style="align-self:end">검색</button>
      </form>
      <div class="monitor-grid" style="align-items:start">
        <div class="card stack pane"><h2>회원·게스트 <span class="small muted">${us.length}</span></h2>
          <div class="stack-xs">${us.map((x) => { const s = memberStats(x); return `<button class="sel-item" type="button" data-pick-u="${x.id}" aria-selected="${u && u.id === x.id}"><span class="avatar sm">${esc([...x.nickname][0] || '?')}</span><span class="grow"><strong>${esc(x.nickname)}</strong>${x.status === 'banned' ? ' <span class="badge alert">차단</span>' : ''}<br><span class="tiny muted">${esc(x.id)} · 상대 ${x.contacts.length}명 · ${s.msgCount}건</span></span>${s.risk ? `<span class="badge alert">${s.risk}</span>` : ''}</button>`; }).join('') || '<p class="small muted">검색 결과 없음</p>'}</div></div>
        <div class="card stack pane"><h2>${u ? esc(u.nickname) + '의 대화 상대' : '대화 상대'}</h2>
          <div class="stack-xs">${contacts.map((x) => { const xm = msgsOf(u, x.id); const rk = xm.filter((m) => m.risk && m.risk.length).length; const last = xm[xm.length - 1]; return `<button class="sel-item" type="button" data-pick-c="${x.id}" aria-selected="${cid === x.id}"><span class="avatar sm col-${esc(x.color || 'mint')}">${esc([...x.nickname][0] || '?')}</span><span class="grow"><strong>${esc(APPN(x.app))} / ${esc(x.nickname)}</strong><br><span class="tiny muted">${xm.length}건 · ${last ? fmtD(last.ts) : '—'} · ${LN(x.lang)}</span></span>${rk ? `<span class="badge alert">위험 ${rk}</span>` : ''}</button>`; }).join('')}
          ${noContactMsgs.length ? `<button class="sel-item" type="button" data-pick-c="" aria-selected="${!cid}"><span class="avatar sm">?</span><span class="grow"><strong>연락처 미지정</strong><br><span class="tiny muted">${noContactMsgs.length}건</span></span></button>` : ''}
          ${!contacts.length && !noContactMsgs.length ? '<p class="small muted">대화가 없습니다.</p>' : ''}</div></div>
        <div class="card stack-lg" style="min-width:0">
          ${u ? `<div class="stack-xs"><div class="between wrap"><h2>대화 기록</h2>${viewAsBtn(u)}</div><p><strong>${c ? esc(APPN(c.app) + ' / ' + c.nickname) : '연락처 미지정'}</strong></p><p class="small muted">${esc(u.nickname)} · ${esc(u.id)} · ${ms.length}건${ms.length ? ' · 최근 ' + fmt(ms[ms.length - 1].ts) : ''}${c ? ' · ' + REL[c.relation || 'friend'] + ' / ' + esc(STAGE_KO[I18N.STAGES[c.relation || 'friend'][c.stage || 0]]) : ''}</p></div>
          ${granted ? convoHtml(u, c, ms) : `<div class="card stack-sm notice"><label class="label" for="mon-reason">열람 사유 (필수 · 감사로그에 기록됩니다)</label><select class="field" id="mon-reason"><option value="">사유 선택</option><option>번역·조언 품질 검토</option><option>신고 또는 위험 대화 조사</option><option>사용자 문의 대응</option><option>서비스 개선을 위한 대화 패턴 분석</option></select><button class="btn full" type="button" id="mon-grant">사유 기록 후 대화 열람</button></div>`}` : '<p class="muted">회원을 선택하세요.</p>'}
        </div>
      </div>`);
    document.getElementById('mon-f').addEventListener('submit', (e) => { e.preventDefault(); const f = new FormData(e.target); location.hash = `#/admin/monitor?q=${encodeURIComponent(f.get('q'))}&app=${f.get('app')}&risk=${f.get('risk')}`; });
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
  }

  function convoHtml(u, c, ms) {
    const pf = Engine.profile(ms);
    return `<div class="row wrap"><span class="badge">열람 사유: ${esc(viewGrants[u.id + '|' + (c ? c.id : 'none')])}</span><a class="link" href="#/admin/audit?q=${u.id}">이 회원의 열람 로그</a></div>
      ${c ? `<div class="metrics"><div class="card stack-xs"><span class="label">진행 기간</span><strong>${pf.firstTs ? Math.round((pf.lastTs - pf.firstTs) / 86400000) + '일' : '—'}</strong></div><div class="card stack-xs"><span class="label">단절 일수</span><strong>${pf.silentDays ?? '—'}일</strong></div><div class="card stack-xs"><span class="label">깊이 점수</span><strong>${pf.depth} / 100</strong></div><div class="card stack-xs"><span class="label">상대 분위기</span><strong>${pf.inCount ? { good: '좋음', low: '가라앉음', neutral: '보통' }[pf.mood] : '—'}</strong></div></div>` : ''}
      <div class="table-wrap"><table style="min-width:760px"><caption>원문 · 사용자 표시 번역 · AI 답장 제안 비교</caption><thead><tr><th style="width:80px">시각</th><th style="width:60px">방향</th><th>원문</th><th>번역</th><th>AI 답장 제안 / 사용자가 고른 답장</th><th style="width:90px">입력 방식</th><th style="width:70px"></th></tr></thead>
      <tbody>${ms.map((m) => `<tr${m.risk && m.risk.length ? ' style="background:var(--danger-bg)"' : ''}><td class="tiny">${fmt(m.ts)}</td><td>${m.dir === 'in' ? '<span class="badge gray">받음</span>' : '<span class="badge">보냄</span>'}</td><td class="wrap-cell" lang="${esc(m.lang)}">${esc(m.text)}${m.risk && m.risk.length ? `<br>${m.risk.map((x) => `<span class="badge alert">${x === 'money' ? '금전 요구' : '외부 유도'}</span>`).join(' ')}` : ''}</td><td class="wrap-cell" lang="${esc(m.trLang)}">${esc(m.translation || '—')}</td><td class="wrap-cell small">${m.suggestions && m.suggestions.length ? m.suggestions.map((s) => `<div class="${m.chosen === s ? 'strong' : 'muted'}">${m.chosen === s ? '✓ ' : '· '}${esc(s)}</div>`).join('') : (m.chosen ? '✓ ' + esc(m.chosen) : '—')}${m.nuance ? `<div class="tiny muted" style="margin-top:4px">뉘앙스: ${esc(m.nuance.slice(0, 120))}</div>` : ''}</td><td class="tiny">${esc({ paste: '붙여넣기', ocr: '스크린샷', home: '홈 번역', reply: '답장 복사', write: '직접 작성', coach: '코칭 예문', gift: '축하 문구', sample: '샘플' }[m.source] || m.source || '')}${m.provider === 'ai' ? '<br><span class="badge">AI</span>' : ''}</td><td><button class="btn sm secondary" type="button" data-note="${m.id}">메모</button></td></tr>`).join('') || '<tr><td colspan="7" class="muted">대화가 없습니다.</td></tr>'}</tbody></table></div>
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
    const list = ((serverShared && serverShared.audit) || Store.db.audit).filter((a) => !q || JSON.stringify(a).toLowerCase().includes(q));
    const act = { view: '대화 열람', ban: '이용 차단', unban: '차단 해제', report: '신고 처리', login: '로그인', settings: '설정 변경', sync: '서버 동기화' };
    page('audit', `<div class="between wrap"><div class="stack-sm"><h1>열람 감사로그</h1><p class="muted">관리자·대상·시각·사유를 기록합니다. 기록은 수정·삭제할 수 없습니다.</p></div>
      <form id="au-f" class="row"><input class="field" name="q" type="search" placeholder="관리자 ID, 회원 ID, 대화 ID" value="${esc(r.q.q || '')}"><button class="btn" type="submit">검색</button></form></div>
      <div class="table-wrap"><table style="min-width:900px"><thead><tr><th>시각</th><th>관리자</th><th>행위</th><th>대상 회원</th><th>앱 / 상대 닉네임</th><th>대화 ID</th><th>사유</th></tr></thead><tbody>
      ${list.map((a) => `<tr><td>${fmt(a.ts)}</td><td>${esc(a.operator)}</td><td><span class="badge ${a.action === 'ban' ? 'alert' : a.action === 'view' ? '' : 'gray'}">${act[a.action] || esc(a.action)}</span></td><td>${esc((a.member ? a.member + ' / ' : '') + (a.target || ''))}</td><td>${esc(a.contact || '—')}</td><td>${esc(a.convId || '—')}</td><td class="wrap-cell">${esc(a.reason || '')}</td></tr>`).join('') || '<tr><td colspan="7" class="muted">기록이 없습니다.</td></tr>'}
      </tbody></table></div>`);
    document.getElementById('au-f').addEventListener('submit', (e) => { e.preventDefault(); location.hash = '#/admin/audit?q=' + encodeURIComponent(new FormData(e.target).get('q')); });
  }

  /* ---------- 운영 설정 ---------- */
  function settings() {
    const sc = Store.Sync.cfg();
    page('settings', `<div class="stack-sm"><h1>운영 설정</h1></div>
      <div class="admin-grid">
        <form class="card stack" id="sv"><h2>서버 연결 (전 회원 대화 모니터링)</h2>
          <p class="small muted">Supabase 무료 프로젝트를 만들고 저장소의 <code>supabase/schema.sql</code>을 실행한 뒤 URL과 anon 키를 넣으세요. 연결하면 모든 회원·게스트의 대화가 서버에 모이고, 이 화면에서 전부 확인할 수 있습니다. 회원 앱에도 같은 값이 필요하므로 <code>js/config.js</code>에 넣어 배포하세요.</p>
          <label class="stack-xs"><span class="label">Supabase URL</span><input class="field" name="url" value="${esc(sc.url || '')}" placeholder="https://xxxx.supabase.co"></label>
          <label class="stack-xs"><span class="label">anon public key</span><input class="field" name="key" value="${esc(sc.key || '')}" placeholder="eyJ..."></label>
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

  function viewAsBtn(u) { return `<button class="btn secondary sm" type="button" data-viewas="${esc(u.id)}">👁 이 회원 화면으로 보기</button>`; }
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-viewas]'); if (!b) return; const id = b.dataset.viewas; const u = Store.db.users[id]; Store.audit({ action: 'view', target: id, member: u ? u.nickname : id, contact: '회원 화면 전체', convId: '-', reason: '회원 화면으로 보기' }); Store.startViewAs(id); location.href = 'app.html#/chat'; location.reload(); });
  window.Admin = {
    render(r) {
      if (!authed) return login();
      const p = r.id || 'dashboard';
      ({ dashboard, users: crm, monitor, reports: reportsPage, quality, audit: auditPage, settings, ai: aiUsagePage }[p] || dashboard)(r);
      window.scrollTo(0, 0);
    },
  };
})();
