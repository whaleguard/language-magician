/* 상담매직 — 저장소
 * - 기본: 이 기기의 localStorage
 * - 선택: Supabase(무료) 연결 시 모든 회원 데이터를 서버에 동기화 → 관리자가 전 회원 대화를 모니터링
 *   (supabase/schema.sql 참고)
 */
(function (global) {
  'use strict';

  const KEY = 'lm_db_v1';
  const CONSENT_VERSION = 'v1.0';
  let db = load();
  let saveTimer = null;
  const listeners = [];

  function uid(p) { return (p || '') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  function blank() {
    return { version: 1, currentUserId: null, users: {}, reports: [], audit: [], quality: [], staff: [], orgs: [], teams: [], notices: [], seq: { U: 0, G: 0, R: 0, C: 0 }, admin: { pin: '1234', loginId: 'admin', operator: 'admin' } };
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = Object.assign(blank(), JSON.parse(raw));
        // 테스트 버전 관리자 비밀번호 1234로 통일
        if (d.admin && (d.admin.pin === '0000' || !d.admin.pin)) d.admin.pin = '1234';
        // 샘플 연락처 중복 정리
        Object.values(d.users || {}).forEach((u) => { const seen = {}; (u.contacts || []).slice().forEach((c) => { if (!c.sample) return; const k = c.nickname + '|' + c.app; if (seen[k]) { u.contacts = u.contacts.filter((x) => x.id !== c.id); u.messages = (u.messages || []).filter((m) => m.contactId !== c.id); u.promises = (u.promises || []).filter((p) => p.contactId !== c.id); } else seen[k] = 1; }); });
        // 샘플·데모 연락처 이름 변경 반영 (실명 제거)
        const RN = /\uC6B0\uC7AC|\u5B87\u5BB0/g; ['audit', 'quality', 'reports'].forEach((k) => (d[k] || []).forEach((x) => Object.keys(x).forEach((f) => { if (typeof x[f] === 'string') x[f] = x[f].replace(RN, '\uC11C\uC900'); })));
        Object.values(d.users || {}).forEach((u) => { (u.contacts || []).forEach((c) => { if (['\uC6B0\uC7AC', '\u5B87\u5BB0', '\u30A6\u30B8\u30A7', 'Woojae'].includes(c.nickname)) c.nickname = '\uC11C\uC900'; }); if (u.nickname && /\uC6B0\uC7AC|\uC9C4\uC6B0\uC7AC/.test(u.nickname)) u.nickname = u.type === 'guest' ? u.nickname : 'Member'; });
        (d.orgs || []).forEach((g) => { if (g.demo && g.id !== 'o_demo') { const old = g.id; g.id = 'o_demo'; (d.teams || []).forEach((t) => { if (t.orgId === old) t.orgId = 'o_demo'; }); } });
        return d;
      }
    } catch (e) { /* 손상된 데이터는 새로 시작 */ }
    return blank();
  }
  // 다른 창(팝업·잠든 탭)이 예전 데이터로 덮어써 팀·거래처·계정이 사라지지 않도록 병합 후 저장
  const SHARED = ['teams', 'orgs', 'staff', 'notices', 'binds', 'reports', 'audit', 'quality', 'custs', 'dupdec'];
  const COLK = { orgs: 'org', teams: 'team', staff: 'staff', notices: 'notice', binds: 'bind', reports: 'report', audit: 'audit', quality: 'quality', custs: 'cust', dupdec: 'dupdec' };
  const KCOL = Object.fromEntries(Object.entries(COLK).map(([a, b]) => [b, a]));
  function mergeShared(stored) {
    const del = new Set((db._del || []).concat(stored._del || []));
    SHARED.forEach((k) => {
      const mine = db[k] || []; const ids = new Set(mine.map((x) => x.id));
      const theirs = (stored[k] || []).filter((x) => x && x.id && !ids.has(x.id) && !del.has(x.id));
      if (theirs.length) db[k] = mine.concat(theirs);
      db[k] = (db[k] || []).filter((x) => !del.has(x.id));
    });
    // 같은 팀을 다른 창에서 수정했으면 최신 것을 사용
    ['teams', 'orgs'].forEach((k) => (stored[k] || []).forEach((x) => { const m = (db[k] || []).find((y) => y.id === x.id); if (m && (x.updatedAt || 0) > (m.updatedAt || 0)) Object.assign(m, x); }));
    db._del = Array.from(del).slice(-5000);
  }
  function persist() {
    if (viewAs) return; // 회원 화면 보기 중에는 저장하지 않음
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const st = JSON.parse(raw); if ((st._rev || 0) !== (db._rev || 0)) mergeShared(st); db._rev = Math.max(st._rev || 0, db._rev || 0) + 1; } else db._rev = (db._rev || 0) + 1;
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch (e) { console.warn('save failed', e); }
    try { Sync.schedule(); } catch (e) { /* noop */ }
  }
  // 기업용 상담원 계정 (아이디·비번으로 어느 PC에서든 로그인)
  function createAgent(o) {
    ensureTeamArrays();
    let id; do { id = 'A-' + Math.random().toString(36).slice(2, 7).toUpperCase(); } while (db.users[id]);
    const u = { id, type: 'member', nickname: o.nickname || id, lang: o.lang || 'ko', createdAt: Date.now(), lastActive: 0, consentAt: Date.now(), consentVer: CONSENT_VERSION, status: 'active', banReason: '', me: {}, contacts: [], messages: [], promises: [], anniversaries: [], settings: { notif: { promise: true, anniv: true, unanswered: true }, remind: 30 }, plan: 'business', agent: true, srv: true, loginId: String(o.loginId || '').trim().toLowerCase(), pin: String(o.pin || '1234').trim(), updatedAt: Date.now() };
    db.users[id] = u;
    const t = o.teamId && teamById(o.teamId); if (t) { t.members = (t.members || []).concat(id); t.updatedAt = Date.now(); }
    persist(); return u;
  }
  // 대화에서 인식한 고객 정보를 연락처 카드에 저장 (사용자가 직접 넣은 값은 덮지 않음)
  const INFO_KEYS = ['name', 'age', 'gender', 'country', 'city', 'phone', 'email', 'birthday', 'job', 'orderNo', 'likes', 'note'];
  function mergeContactInfo(cid, prof, mid, src) {
    const u = me(); if (!u || viewAs || !prof) return 0; const c = u.contacts.find((x) => x.id === cid); if (!c) return 0;
    c.info = c.info || {}; let n = 0; const now = Date.now();
    INFO_KEYS.forEach((k) => {
      let v = prof[k]; if (Array.isArray(v)) v = v.filter(Boolean).join(', '); v = String(v == null ? '' : v).trim(); if (!v || v.length > 120) return;
      const cur = c.info[k]; if (cur && cur.locked) return;
      if (k === 'likes' && cur && cur.v) { const set = new Set(cur.v.split(/,\s*/).concat(v.split(/,\s*/))); v = Array.from(set).slice(0, 12).join(', '); }
      if (cur && cur.v === v) return;
      c.info[k] = { v, ts: now, mid: mid || '', src: src || 'ai' }; n++;
      // 기본 프로필 칸이 비어 있으면 같이 채움
      if (k === 'age' && !c.age && /^\d{1,3}$/.test(v)) c.age = v;
      if (k === 'birthday' && !c.birthday && /^\d{4}-\d{2}-\d{2}$/.test(v)) c.birthday = v;
      if (k === 'country' && !c.country) c.country = v;
    });
    if (n) save(); return n;
  }
  function setContactInfo(cid, k, v) { const u = me(); if (!u || viewAs) return; const c = u.contacts.find((x) => x.id === cid); if (!c) return; c.info = c.info || {}; if (!String(v || '').trim()) delete c.info[k]; else c.info[k] = { v: String(v).trim().slice(0, 120), ts: Date.now(), src: 'user', locked: true }; save(); }
  // 일반 회원도 아이디·비밀번호를 만들면 DB에 저장돼 어느 기기에서든 「계정 로그인」으로 이어서 사용
  function setCredentials(loginId, pin) {
    const u = me(); if (!u || viewAs) return null;
    if (/^[UG]-\d{4}$/.test(u.id)) { // 예전 순번 ID는 기기마다 겹치므로 고유 ID로 바꿈
      const old = u.id; let nid; do { nid = (u.type === 'guest' ? 'G-' : 'U-') + Math.random().toString(36).slice(2, 7).toUpperCase(); } while (db.users[nid]);
      u.id = nid; db.users[nid] = u; delete db.users[old]; db.currentUserId = nid;
      (db.teams || []).forEach((t) => { if ((t.members || []).includes(old)) t.members = t.members.map((x) => (x === old ? nid : x)); });
      (db.reports || []).forEach((r) => { if (r.userId === old) r.userId = nid; }); (db.notices || []).forEach((n) => { if (n.userId === old) n.userId = nid; });
    }
    u.loginId = String(loginId).trim().toLowerCase(); u.pin = String(pin).trim(); u.srv = true;
    if (u.type === 'guest') { u.type = 'member'; if (/^Guest /.test(u.nickname)) u.nickname = u.loginId; }
    save(); return u;
  }
  /* ---------- 상담 넘기기 (팀장·회사·관리자) ---------- */
  // 넘긴(또는 지운) 연락처는 삭제 표시로 모든 기기에서 정리 — 예전 기기가 옛 내용을 다시 올려도 되살아나지 않음
  function stripMoved(u) {
    if (!u || !u.contacts) return false; const del = new Set(db._del || []); if (!del.size) return false;
    const b = u.contacts.length + (u.messages || []).length;
    u.contacts = u.contacts.filter((c) => !del.has(c.id));
    u.messages = (u.messages || []).filter((m) => !m.contactId || !del.has(m.contactId));
    u.promises = (u.promises || []).filter((x) => !x.contactId || !del.has(x.contactId));
    u.anniversaries = (u.anniversaries || []).filter((x) => !x.contactId || !del.has(x.contactId));
    return b !== u.contacts.length + u.messages.length;
  }
  // 받는 사람 기기: 넘겨받은 상담이 내 연락처에 없으면 채워 넣음 (지시 메시지에 담긴 내용으로)
  function applyHandoffs(u) {
    if (!u) return false; const del = new Set(db._del || []); let ch = false;
    (db.notices || []).forEach((n) => {
      const h = n.handoff; if (!h || n.userId !== u.id || !h.contact || del.has(h.contact.id)) return;
      if (u.contacts.some((c) => c.id === h.contact.id)) return;
      u.contacts.push(h.contact);
      const have = new Set((u.messages || []).map((m) => m.id));
      (h.messages || []).forEach((m) => { if (!have.has(m.id)) u.messages.push(m); });
      u.messages.sort((a, b) => (a.ts || 0) - (b.ts || 0));
      (h.promises || []).forEach((x) => u.promises.push(x)); (h.anniversaries || []).forEach((x) => (u.anniversaries = u.anniversaries || []).push(x));
      u.updatedAt = Date.now(); ch = true;
    });
    if (ch) persist();
    return ch;
  }
  function transferContact(fromU, contactId, toUid, by) {
    const to = db.users[toUid]; if (!fromU || !to || fromU.id === to.id) return null;
    const c = (fromU.contacts || []).find((x) => x.id === contactId); if (!c) return null;
    const clone = (o) => JSON.parse(JSON.stringify(o));
    const nid = uid('c_');
    const nc = Object.assign(clone(c), { id: nid, handover: { fromId: fromU.id, from: fromU.nickname, by: by || '', at: Date.now() } });
    const ms = (fromU.messages || []).filter((m) => m.contactId === contactId).map((m) => Object.assign(clone(m), { id: uid('m_'), contactId: nid }));
    const ps = (fromU.promises || []).filter((x) => x.contactId === contactId).map((x) => Object.assign(clone(x), { id: uid('p_'), contactId: nid }));
    const an = (fromU.anniversaries || []).filter((x) => x.contactId === contactId).map((x) => Object.assign(clone(x), { id: uid('a_'), contactId: nid }));
    to.contacts.push(nc); to.messages = (to.messages || []).concat(ms).sort((a, b) => (a.ts || 0) - (b.ts || 0)); to.promises = (to.promises || []).concat(ps); to.anniversaries = (to.anniversaries || []).concat(an); to.updatedAt = Date.now();
    markDel(contactId); markDel(fromU.id + '_' + contactId); db.custs = (db.custs || []).filter((x) => x.id !== fromU.id + '_' + contactId); stripMoved(fromU); fromU.updatedAt = Date.now();
    const nm = (c.nickname || '') + (c.app ? ' · ' + c.app : '');
    sendNotice({ userId: to.id, kind: 'notice', from: 'leader', fromName: by || '팀장', teamId: (teamOf(to.id) || {}).id || '', text: `${fromU.nickname}님이 맡던 「${nm}」 상담을 넘겨받았습니다. 지난 대화와 고객 정보가 연락처에 들어 있습니다.`, lang: 'ko', handoff: { contact: nc, messages: ms, promises: ps, anniversaries: an } });
    sendNotice({ userId: fromU.id, kind: 'notice', from: 'leader', fromName: by || '팀장', teamId: (teamOf(fromU.id) || {}).id || '', text: `「${nm}」 상담을 ${to.nickname}님에게 넘겼습니다. 이 대화는 이제 내 목록에서 빠집니다.`, lang: 'ko' });
    persist();
    [fromU, to].forEach((u) => { if (u.srv && !u.demo) Sync.upsert('user:' + u.id, u).catch(() => {}); });
    Sync.pushShared();
    return nid;
  }
  function transferAll(fromU, toUid, by) { if (!fromU) return 0; const ids = (fromU.contacts || []).map((c) => c.id); let n = 0; ids.forEach((id) => { if (transferContact(fromU, id, toUid, by)) n++; }); return n; }
  // 팀장도 상담: 팀마다 팀장 전용 상담 계정(로그인 아이디 없음 — 팀장 로그인으로만 들어감)
  function leaderAgent(teamId) {
    const t = teamById(teamId); if (!t) return null;
    let u = t.leaderUid && db.users[t.leaderUid];
    if (!u) {
      u = Object.values(db.users).find((x) => x && x.leaderOf === teamId) || null;
      if (!u) { u = createAgent({ nickname: (t.leaderName || '팀장') + ' 팀장', lang: 'ko', teamId, loginId: '' }); u.loginId = ''; }
      u.leaderOf = teamId; u.updatedAt = Date.now(); t.leaderUid = u.id; t.updatedAt = Date.now(); persist(); Sync.pushShared();
    }
    if (t.leaderName && u.nickname !== t.leaderName + ' 팀장') { u.nickname = t.leaderName + ' 팀장'; u.updatedAt = Date.now(); persist(); }
    return u;
  }
  function findAgentLocal(loginId, pin) { const id = normId(loginId); return Object.values(db.users).find((u) => u.loginId && u.loginId.toLowerCase() === id && (pin == null || String(u.pin).trim() === String(pin).trim())); }
  function agentLoginAs(u) { if (db.users[u.id]) Object.assign(db.users[u.id], u); else db.users[u.id] = u; db.currentUserId = u.id; persist(); }
  // 상담원 자리 고정: 처음 로그인한 PC(브라우저)에서만 열림. 팀장·관리자가 '자리 초기화'하면 새 자리에서 다시 등록
  function deviceId() { let d = ''; try { d = localStorage.getItem('lm_dev') || ''; if (!d) { d = 'D' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); localStorage.setItem('lm_dev', d); } } catch (e) { d = 'D-nostore'; } return d; }
  function deviceLabel() { const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || ''; const os = /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'Mac' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : '기기'; const br = /Edg\//.test(ua) ? 'Edge' : /Whale\//.test(ua) ? 'Whale' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : '브라우저'; return os + ' · ' + br; }
  function bindOf(userId) { db.binds = db.binds || []; return db.binds.find((b) => b.id === userId) || null; }
  // 'free'(미등록) | 'ok' | 'other'(다른 자리에 등록됨) | 'reset'(초기화됨 → 다시 로그인 필요)
  function seatState(userId) { const b = bindOf(userId); if (!b) return 'free'; if (!b.dev) return 'reset'; return b.dev === deviceId() ? 'ok' : 'other'; }
  function bindSeat(userId) { db.binds = db.binds || []; const b = bindOf(userId); const rec = { id: userId, dev: deviceId(), label: deviceLabel(), at: Date.now(), updatedAt: Date.now() }; if (b) Object.assign(b, rec); else db.binds.push(rec); persist(); }
  function resetSeat(userId) { db.binds = db.binds || []; const b = bindOf(userId); const rec = { id: userId, dev: '', label: '', at: 0, updatedAt: Date.now() }; if (b) Object.assign(b, rec); else db.binds.push(rec); persist(); }
  // 같은 고객을 여러 상담원이 상담하는지 찾기 위한 고객 색인 (닉네임 키 + 받은 메시지 지문)
  function normNick(n) { return String(n || '').toLowerCase().replace(/[\s._\-·•()\[\]~!@#]/g, ''); }
  function fpOf(t) { const x = String(t || '').toLowerCase().replace(/[\s\p{P}\p{S}]/gu, ''); if (x.length < 8) return ''; let h = 5381; for (let i = 0; i < x.length; i++) h = ((h << 5) + h + x.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  function custEntry(u, c) {
    const tm = teamOf(u.id); const ms = (u.messages || []).filter((m) => m.contactId === c.id);
    const fps = Array.from(new Set(ms.filter((m) => m.dir === 'in').slice(-15).map((m) => fpOf(m.text)).filter(Boolean)));
    const inf = c.info || {}; const idf = [inf.phone && 'p' + fpOf('tel' + String(inf.phone.v).replace(/\D/g, '').slice(-9)), inf.email && 'e' + fpOf('mail' + String(inf.email.v).toLowerCase())].filter(Boolean); idf.forEach((x) => fps.push(x));
    const last = ms.length ? ms[ms.length - 1].ts : (c.createdAt || 0);
    return { id: u.id + '_' + c.id, agentId: u.id, agentName: u.nickname, contactId: c.id, teamId: tm ? tm.id : '', orgId: tm ? tm.orgId || '' : '', app: c.app || '', nick: c.nickname || '', key: (c.app || '') + ':' + normNick(c.nickname), fps, lastTs: last, n: ms.length, photo: c.photo || '' };
  }
  function refreshCusts() {
    const u = me(); if (!u || viewAs || u.demo) return; const tm = teamOf(u.id); if (!tm) return;
    db.custs = db.custs || [];
    (u.contacts || []).filter((c) => !c.sample).forEach((c) => { const e = custEntry(u, c); const i = db.custs.findIndex((x) => x.id === e.id); const prev = i >= 0 ? db.custs[i] : null; if (!prev || JSON.stringify(prev) !== JSON.stringify(e)) { if (i >= 0) db.custs[i] = e; else db.custs.push(e); } });
  }
  // 팀장 판정: 두 상담 건이 같은 고객인지 (same: true/false, owner: 담당 상담원)
  function pairId(a, b) { return [a, b].sort().join('~'); }
  function dupDecision(a, b) { return (db.dupdec || []).find((x) => x.id === pairId(a, b)) || null; }
  function decideDup(entryIds, same, owner) {
    db.dupdec = db.dupdec || [];
    for (let i = 0; i < entryIds.length; i++) for (let j = i + 1; j < entryIds.length; j++) {
      const id = pairId(entryIds[i], entryIds[j]); const rec = { id, same: !!same, owner: owner || '', by: db.admin.operator || '', ts: Date.now(), updatedAt: Date.now() };
      const k = db.dupdec.findIndex((x) => x.id === id); if (k >= 0) db.dupdec[k] = rec; else db.dupdec.push(rec);
    }
    persist();
  }
  // 이 연락처를 같은 회사의 다른 상담원도 상담 중인지: [{agentName, lastTs, why}]
  function sharedCustomers(userId, contact) {
    const u = db.users[userId]; if (!u || !contact) return [];
    const tm = teamOf(userId); if (!tm) return [];
    const mine = custEntry(u, contact);
    const del = new Set(db._del || []);
    return (db.custs || []).filter((x) => x.agentId !== userId && !del.has(x.contactId) && !del.has(x.id) && (x.orgId ? x.orgId === (tm.orgId || '') : x.teamId === tm.id) && (x.key === mine.key || (x.fps || []).some((f) => mine.fps.includes(f))))
      .map((x) => { const d = dupDecision(mine.id, x.id); return { agentId: x.agentId, agentName: x.agentName, contactId: x.contactId, nick: x.nick, app: x.app, lastTs: x.lastTs, why: x.key === mine.key ? 'nick' : 'msg', same: (x.fps || []).filter((f) => mine.fps.includes(f)).length, decided: d ? (d.same ? 'same' : 'diff') : '', owner: d && d.owner ? ((db.users[d.owner] || {}).nickname || ((db.custs || []).find((y) => y.agentId === d.owner) || {}).agentName || d.owner) : '', ownerId: d ? d.owner : '' }; })
      .filter((x) => x.decided !== 'diff');
  }
  // 관리자용: 범위 안 회원들의 연락처를 묶어 2명 이상 상담 중인 고객 목록
  function duplicateCustomers(userList) {
    const ents = []; userList.forEach((u) => (u.contacts || []).filter((c) => !c.sample).forEach((c) => ents.push(custEntry(u, c))));
    const groups = []; const used = new Set();
    ents.forEach((e, i) => {
      if (used.has(i)) return; const g = [e]; used.add(i);
      ents.forEach((o, j) => { if (used.has(j) || o.agentId === e.agentId) return; const d = dupDecision(e.id, o.id); if (d && !d.same) return; if (o.key === e.key || o.fps.some((f) => e.fps.includes(f))) { g.push(o); used.add(j); } });
      if (new Set(g.map((x) => x.agentId)).size >= 2) groups.push(g);
    });
    groups.forEach((g) => { const ds = []; for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) ds.push(dupDecision(g[i].id, g[j].id)); g.decided = ds.length && ds.every((d) => d && d.same) ? 'same' : ''; g.owner = g.decided ? (ds[0].owner || '') : ''; });
    return groups.sort((a, b) => (a.decided ? 1 : 0) - (b.decided ? 1 : 0) || Math.max(...b.map((x) => x.lastTs)) - Math.max(...a.map((x) => x.lastTs)));
  }
  function markDel(id) { db._del = (db._del || []).concat(id); }
  function save(opts) {
    const cu = !viewAs && me(); if (cu) cu.updatedAt = Date.now();
    persist();
    listeners.forEach((fn) => { try { fn(); } catch (e) { /* noop */ } });
    if (viewAs) return;
    if (!(opts && opts.noSync)) {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => { Sync.pushUser(me()); }, 1200);
    }
  }
  function onChange(fn) { listeners.push(fn); }

  /* 관리자 '회원 화면으로 보기': 그 회원 데이터의 복사본을 보여줍니다 (저장 안 됨). */
  let viewAs = null;
  // 관리자 화면으로 돌아오면 '회원 화면 보기'를 자동 해제 (해제 안 하면 관리자 작업이 저장되지 않음)
  try { if (/^#\/admin/.test(location.hash || '')) sessionStorage.removeItem('lm_view_as'); } catch (e) { /* noop */ }
  try { const va = sessionStorage.getItem('lm_view_as'); if (va && db.users[va]) viewAs = JSON.parse(JSON.stringify(db.users[va])); } catch (e) { viewAs = null; }
  function me() { if (viewAs) return viewAs; return db.currentUserId ? db.users[db.currentUserId] : null; }
  function startViewAs(id) { try { sessionStorage.setItem('lm_view_as', id); } catch (e) {} }
  function stopViewAs() { try { sessionStorage.removeItem('lm_view_as'); } catch (e) {} viewAs = null; }
  function viewingAs() { return viewAs; }
  function nextId(kind) { db.seq[kind] = (db.seq[kind] || 0) + 1; let id; do { id = kind + '-' + Math.random().toString(36).slice(2, 7).toUpperCase(); } while (db.users[id]); return id; }

  function createUser(opts) {
    const type = opts.type === 'member' ? 'member' : 'guest';
    const id = nextId(type === 'member' ? 'U' : 'G');
    const u = {
      id, type, nickname: type === 'member' ? opts.nickname : 'Guest ' + id.slice(2),
      lang: opts.lang || 'en', createdAt: Date.now(), lastActive: Date.now(),
      consentAt: Date.now(), consentVer: CONSENT_VERSION,
      status: 'active', banReason: '',
      me: {}, contacts: [], messages: [], promises: [], anniversaries: [],
      settings: { notif: { promise: true, anniv: true, unanswered: true }, remind: 30 },
      device: (navigator.userAgent || '').slice(0, 120), srv: true,
    };
    db.users[id] = u;
    db.currentUserId = id;
    save();
    return u;
  }

  function upgradeToMember(nickname) {
    const u = me(); if (!u) return null;
    if (u.type === 'member') { u.nickname = nickname; save(); return u; }
    const newId = nextId('U');
    const copy = Object.assign({}, u, { id: newId, type: 'member', nickname, upgradedFrom: u.id });
    delete db.users[u.id];
    db.users[newId] = copy;
    db.currentUserId = newId;
    save();
    return copy;
  }

  /* ---------- 근태: 접속·활동 기록 (1분 단위) ---------- */
  function dkey(ts) { const d = new Date(ts); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function attBeat(active) {
    const u = me(); if (!u || viewAs) return;
    const now = Date.now(); const k = dkey(now);
    u.att = u.att || {}; const a = u.att[k] = u.att[k] || { first: now, last: now, online: 0, active: 0, sessions: [] };
    if (a.lastBeat && now - a.lastBeat < 50000) return;
    const ss = a.sessions; const cur = ss[ss.length - 1];
    if (cur && !cur[2] && now - cur[1] < 5 * 60000) cur[1] = now; else ss.push([now, now, 0]);
    a.online += 1; if (active) a.active += 1; a.last = now; a.lastBeat = now;
    const keys = Object.keys(u.att).sort(); while (keys.length > 60) delete u.att[keys.shift()];
    persist();
  }
  function attEnd(reason) {
    const u = me(); if (!u || viewAs) return;
    const a = u.att && u.att[dkey(Date.now())]; if (!a) return;
    const cur = a.sessions[a.sessions.length - 1]; if (cur && !cur[2]) { cur[1] = Date.now(); cur[2] = reason === 'logout' ? 2 : 1; }
    if (reason === 'logout') a.logoutAt = Date.now();
    persist();
  }
  function logout() { attEnd('logout'); db.currentUserId = null; save({ noSync: true }); }

  /* ---------- 연락처 ---------- */
  function addContact(c) {
    const u = me();
    const contact = Object.assign({
      id: uid('c_'), nickname: '', app: 'kakaotalk', lang: 'en', country: '', color: 'mint',
      relation: 'friend', stage: 0, metAt: '', birthday: '', birthTime: '', birthLunar: false, birthLeap: false, birthTz: '',
      blood: '', mbti: '', gender: '', age: '', note: '', createdAt: Date.now(),
    }, c);
    u.contacts.push(contact);
    save();
    return contact;
  }
  function updateContact(id, patch) {
    const c = contact(id); if (!c) return null;
    Object.assign(c, patch);
    save();
    return c;
  }
  function removeContact(id) {
    const u = me();
    u.contacts = u.contacts.filter((c) => c.id !== id);
    u.messages = u.messages.filter((m) => m.contactId !== id);
    u.promises = u.promises.filter((p) => p.contactId !== id);
    u.anniversaries = u.anniversaries.filter((a) => a.contactId !== id);
    save();
  }
  function contact(id) { const u = me(); return u ? u.contacts.find((c) => c.id === id) : null; }
  function messagesOf(contactId, user) {
    const u = user || me();
    return u.messages.filter((m) => m.contactId === contactId).sort((a, b) => a.ts - b.ts);
  }

  /* ---------- 메시지 ---------- */
  function addMessage(m) {
    const u = me();
    const msg = Object.assign({ id: uid('m_'), ts: Date.now(), source: 'paste' }, m);
    // 같은 내용이 방금 저장됐다면 중복 저장하지 않음
    const dup = u.messages.find((x) => x.contactId === msg.contactId && x.text === msg.text && x.dir === msg.dir && Math.abs(x.ts - msg.ts) < 6 * 3600000);
    if (dup) { Object.assign(dup, msg, { id: dup.id, ts: dup.ts }); save(); return dup; }
    msg.convId = msg.convId || nextId('C');
    u.messages.push(msg);
    u.lastActive = Date.now();
    save();
    msg._learned = learnFromMessage(msg);
    if (typeof window !== 'undefined' && window.LM_ON_MESSAGE) { try { window.LM_ON_MESSAGE(msg); } catch (e) { /* 무시 */ } }
    return msg;
  }

  /* ---------- 대화에서 상대 정보 배우기 ----------
     상대가 보낸 메시지에서 나이·생일·혈액형 등을 찾아, 비어 있거나 전에 대화로 채운 칸만 채웁니다.
     사용자가 직접 입력한 값은 덮어쓰지 않습니다. 새로 알게 된 항목 목록을 돌려줍니다. */
  function learnFromMessage(msg) {
    if (!msg || msg.dir !== 'in' || !msg.contactId || typeof Engine === 'undefined' || !Engine.extractProfile) return [];
    const u = me(); const c = u.contacts.find((x) => x.id === msg.contactId); if (!c) return [];
    const found = Engine.extractProfile(msg.text);
    if (msg.translation && Object.keys(found).length === 0) Object.assign(found, Engine.extractProfile(msg.translation));
    c.learned = c.learned || {};
    const learnedNow = [];
    const setF = (field, value) => {
      if (value === undefined || value === null || value === '') return;
      const manual = c[field] && !c.learned[field];
      if (manual) return;
      if (String(c[field] || '') === String(value)) { if (!c.learned[field]) return; c.learned[field].msgId = msg.id; return; }
      c[field] = value;
      c.learned[field] = { value, msgId: msg.id, ts: msg.ts, text: String(msg.text).slice(0, 80) };
      learnedNow.push(field);
    };
    setF('age', found.age);
    setF('gender', found.gender);
    setF('blood', found.blood);
    setF('mbti', found.mbti);
    setF('job', found.job);
    setF('city', found.city);
    if (found.birthMD || found.birthYear) {
      const prev = c.birthday || '';
      const y = found.birthYear || (prev && !c.birthdayNoYear ? prev.slice(0, 4) : '') || (found.age ? String(new Date().getFullYear() - found.age) : '');
      const mdv = found.birthMD || (prev ? prev.slice(5) : '');
      if (mdv) {
        const v = (y || '2000') + '-' + mdv;
        if (!(prev && !c.learned.birthday)) { if (prev !== v) { c.birthday = v; c.birthdayNoYear = !y; c.learned.birthday = { value: v, msgId: msg.id, ts: msg.ts, text: String(msg.text).slice(0, 80) }; learnedNow.push('birthday'); } }
      }
    }
    if (learnedNow.length) save();
    return learnedNow;
  }
  function relearnAll(contactId) {
    const u = me(); let all = [];
    u.messages.filter((m) => m.contactId === contactId && m.dir === 'in').sort((a, b) => a.ts - b.ts).forEach((m) => { all = all.concat(learnFromMessage(m)); });
    return Array.from(new Set(all));
  }

  /* ---------- 약속·기념일 ---------- */
  function addPromise(p) {
    const u = me();
    const pr = Object.assign({ id: uid('p_'), done: false, remind: u.settings.remind || 30, createdAt: Date.now(), notified: false }, p);
    u.promises.push(pr);
    save();
    return pr;
  }
  function updatePromise(id, patch) { const u = me(); const p = u.promises.find((x) => x.id === id); if (p) { Object.assign(p, patch); save(); } return p; }
  function removePromise(id) { const u = me(); u.promises = u.promises.filter((p) => p.id !== id); save(); }
  function addAnniv(a) { const u = me(); const x = Object.assign({ id: uid('a_'), repeat: true, createdAt: Date.now() }, a); u.anniversaries.push(x); save(); return x; }
  function removeAnniv(id) { const u = me(); u.anniversaries = u.anniversaries.filter((a) => a.id !== id); save(); }

  /* ---------- 신고·감사로그·개선 메모 ---------- */
  function addReport(r) {
    const u = me();
    const rep = Object.assign({ id: nextId('R'), userId: u.id, status: 'open', createdAt: Date.now(), history: [{ ts: Date.now(), text: 'received' }] }, r);
    db.reports.unshift(rep);
    save();
    Sync.pushShared();
    return rep;
  }
  /* ---------- 기업용: 팀·팀장 / 지시·경고 메시지 ---------- */
  const PLANS = {
    free: { name: '무료', price: 0, group: 'personal' },
    pro: { name: '프로', price: 5900, group: 'personal' },
    premium: { name: '프리미엄', price: 9900, group: 'personal' },
    business: { name: '기업용', price: null, group: 'business' },
  };
  const FEATURES = {
    translate: ['free', 'pro', 'premium', 'business'],
    reply_ideas: ['free', 'pro', 'premium', 'business'],
    ocr: ['pro', 'premium', 'business'],
    ai_analysis: ['pro', 'premium', 'business'],
    day_memory: ['pro', 'premium', 'business'],
    coach_saju_gift: ['premium', 'business'],
    unlimited_contacts: ['pro', 'premium', 'business'],
    team_inbox: ['business'],
    team_console: ['business'],
  };
  function planOf(u) { return (u && u.plan) || 'free'; }
  function can(feature, u) { u = u || me(); const f = FEATURES[feature]; return !f || f.includes(planOf(u)); }
  function ensureTeamArrays() { db.dupdec = db.dupdec || []; db.custs = db.custs || []; db.binds = db.binds || []; db.teams = db.teams || []; db.notices = db.notices || []; db.orgs = db.orgs || []; db.staff = db.staff || []; if (!db.staff.some((x) => x.demo)) { db.staff.push({ id: uid('s_'), type: 'personal', name: '일반고객 담당', loginId: 'personal1', pin: '1234', demo: true }, { id: uid('s_'), type: 'business', name: '기업고객 담당', loginId: 'business1', pin: '1234', demo: true }); } }
  // 본사 관리자 계정: personal(일반고객 관리자) | business(기업고객 관리자). 최종 관리자는 admin 계정
  function staff() { ensureTeamArrays(); return db.staff; }
  function staffById(id) { return staff().find((x) => x.id === id); }
  function staffLogin(loginId, pin) { const id = normId(loginId); return staff().find((x) => x.loginId && x.loginId.toLowerCase() === id && String(x.pin).trim() === String(pin || '').trim()); }
  function addStaff(o) { const x = { id: uid('s_'), type: o.type === 'business' ? 'business' : 'personal', name: o.name || '', loginId: String(o.loginId || '').trim(), pin: String(o.pin || '1234') }; staff().push(x); persist(); Sync.pushShared(); return x; }
  /* ---------- 삭제 (관리자·회사·팀장) ---------- */
  // 회원·상담원 계정 삭제: 모든 PC에서 사라지도록 삭제 표시 + 서버 행 제거
  function removeUser(id) {
    ensureTeamArrays(); markDel(id);
    db.teams.forEach((t) => { if ((t.members || []).includes(id)) { t.members = t.members.filter((x) => x !== id); t.updatedAt = Date.now(); } });
    db.binds = (db.binds || []).filter((b) => b.userId !== id && b.agentId !== id);
    db.notices = (db.notices || []).filter((n) => n.userId !== id || n.kind === 'chat');
    delete db.users[id]; if (db.currentUserId === id) db.currentUserId = null;
    persist(); Sync.pushShared(); Sync.remove('user:' + id); Sync.remove('ban:' + id);
  }
  // 회원의 상담 대화 삭제 (연락처 하나 전체 또는 메시지 몇 개). u는 관리자 화면이 가진 회원 객체
  function removeUserConvo(u, contactId, msgIds) {
    if (!u) return 0; let n = 0;
    if (msgIds && msgIds.length) { const set = new Set(msgIds); const b = u.messages.length; u.messages = u.messages.filter((m) => !set.has(m.id)); n = b - u.messages.length; }
    else if (contactId !== undefined) {
      const b = u.messages.length;
      if (contactId) { markDel(contactId); markDel(u.id + '_' + contactId); u.contacts = u.contacts.filter((c) => c.id !== contactId); u.messages = u.messages.filter((m) => m.contactId !== contactId); u.promises = (u.promises || []).filter((x) => x.contactId !== contactId); u.anniversaries = (u.anniversaries || []).filter((x) => x.contactId !== contactId); }
      else u.messages = u.messages.filter((m) => m.contactId);
      n = b - u.messages.length;
    }
    u.updatedAt = Date.now();
    if (db.users[u.id] && db.users[u.id] !== u) db.users[u.id] = u;
    persist();
    if (u.srv && !u.demo) Sync.upsert('user:' + u.id, u).catch(() => {});
    return n;
  }
  // 채팅·메시지(공지) 영구 삭제 — 모든 사람 화면에서 사라짐
  function purgeNotices(ids) {
    const set = new Set(ids || []); if (!set.size) return 0;
    set.forEach((id) => markDel(id)); const b = (db.notices || []).length;
    db.notices = (db.notices || []).filter((n) => !set.has(n.id));
    persist(); Sync.pushShared(); set.forEach((id) => Sync.remove('notice:' + id));
    return b - db.notices.length;
  }
  // 팀장 계정만 삭제 (팀·팀원은 유지)
  function removeLeader(teamId) { const t = teamById(teamId); if (!t) return; t.loginId = ''; t.pin = ''; t.leaderName = ''; t.updatedAt = Date.now(); persist(); Sync.pushShared(); }
  function removeStaff(id) { markDel(id); db.staff = staff().filter((x) => x.id !== id); persist(); Sync.pushShared(); }
  // 기업(상담회사) — 기업 관리자 → 팀장 → 상담원
  function orgs() { ensureTeamArrays(); return db.orgs; }
  function orgById(id) { return orgs().find((o) => o.id === id); }
  function createOrg(o) { ensureTeamArrays(); const g = { id: o.id || uid('o_'), name: o.name || '새 기업', adminName: o.adminName || '', loginId: String(o.loginId || '').trim(), pin: String(o.pin || '1234'), createdAt: Date.now(), demo: !!o.demo }; db.orgs.push(g); persist(); Sync.pushShared(); return g; }
  function updateOrg(id, patch) { const g = orgById(id); if (!g) return null; Object.assign(g, patch, { updatedAt: Date.now() }); persist(); Sync.pushShared(); return g; }
  function removeOrg(id) { ensureTeamArrays(); markDel(id); db.orgs = db.orgs.filter((o) => o.id !== id); db.teams.forEach((t) => { if (t.orgId === id) t.orgId = ''; }); persist(); Sync.pushShared(); }
  function orgLogin(loginId, pin) { const id = normId(loginId); return orgs().find((g) => g.loginId && g.loginId.toLowerCase() === id && String(g.pin).trim() === String(pin || '').trim()); }
  function teamsOfOrg(orgId) { return teams().filter((t) => t.orgId === orgId); }
  function teams() { ensureTeamArrays(); return db.teams; }
  function teamById(id) { return teams().find((t) => t.id === id); }
  function teamOf(userId) { return teams().find((t) => (t.members || []).includes(userId)); }
  function createTeam(o) {
    ensureTeamArrays();
    const t = { id: uid('t_'), orgId: o.orgId || '', name: o.name || '새 팀', leaderName: o.leaderName || '', loginId: String(o.loginId || '').trim(), pin: String(o.pin || '1234').trim(), members: o.members || [], createdAt: Date.now(), demo: !!o.demo };
    db.teams.push(t); (t.members || []).forEach((id) => { if (db.users[id]) db.users[id].plan = 'business'; }); persist(); Sync.pushShared(); return t;
  }
  function updateTeam(id, patch) { const t = teamById(id); if (!t) return null; Object.assign(t, patch, { updatedAt: Date.now() }); if (patch.loginId != null) t.loginId = String(patch.loginId).trim(); if (patch.pin != null) t.pin = String(patch.pin).trim(); (t.members || []).forEach((uid2) => { if (db.users[uid2] && db.users[uid2].plan !== 'business') db.users[uid2].plan = 'business'; }); persist(); Sync.pushShared(); return t; }
  function removeTeam(id) { ensureTeamArrays(); markDel(id); db.teams = db.teams.filter((t) => t.id !== id); persist(); Sync.pushShared(); }
  function leaderLogin(loginId, pin) { const id = normId(loginId); return teams().find((t) => t.loginId && t.loginId.toLowerCase() === id && String(t.pin).trim() === String(pin || '').trim()); }
  // 한글 자판 상태로 영문 아이디를 친 경우(ㄴㄴ먀 → ssan) 영문으로 바꿔 비교
  const KO2EN = { 'ㅂ': 'q', 'ㅈ': 'w', 'ㄷ': 'e', 'ㄱ': 'r', 'ㅅ': 't', 'ㅛ': 'y', 'ㅕ': 'u', 'ㅑ': 'i', 'ㅐ': 'o', 'ㅔ': 'p', 'ㅁ': 'a', 'ㄴ': 's', 'ㅇ': 'd', 'ㄹ': 'f', 'ㅎ': 'g', 'ㅗ': 'h', 'ㅓ': 'j', 'ㅏ': 'k', 'ㅣ': 'l', 'ㅋ': 'z', 'ㅌ': 'x', 'ㅊ': 'c', 'ㅍ': 'v', 'ㅠ': 'b', 'ㅜ': 'n', 'ㅡ': 'm', 'ㅃ': 'Q', 'ㅉ': 'W', 'ㄸ': 'E', 'ㄲ': 'R', 'ㅆ': 'T', 'ㅒ': 'O', 'ㅖ': 'P', 'ㅘ': 'hk', 'ㅙ': 'ho', 'ㅚ': 'hl', 'ㅝ': 'nj', 'ㅞ': 'np', 'ㅟ': 'nl', 'ㅢ': 'ml', 'ㄳ': 'rt', 'ㄵ': 'sw', 'ㄶ': 'sg', 'ㄺ': 'fr', 'ㄻ': 'fa', 'ㄼ': 'fq', 'ㄽ': 'ft', 'ㄾ': 'fx', 'ㄿ': 'fv', 'ㅀ': 'fg', 'ㅄ': 'qt' };
  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ', JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ', JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  function ko2en(str) { return Array.from(String(str || '')).map((ch) => { const c = ch.charCodeAt(0) - 0xAC00; if (c >= 0 && c < 11172) { const j = [CHO[Math.floor(c / 588)], JUNG[Math.floor((c % 588) / 28)], JONG[c % 28]]; return j.map((x) => (x ? KO2EN[x] || '' : '')).join(''); } return KO2EN[ch] || ch; }).join(''); }
  function normId(v) { const s = String(v || '').trim(); return (/[\u3131-\u318E\uAC00-\uD7A3]/.test(s) ? ko2en(s) : s).toLowerCase(); }
  // 아이디는 있는데 비밀번호가 틀렸는지, 이 기기에 아이디 자체가 없는지 구분
  function whoHasId(loginId) { const id = normId(loginId); if (!id) return null; if (id === String(db.admin.loginId || 'admin').toLowerCase()) return 'admin'; if (staff().some((x) => (x.loginId || '').toLowerCase() === id)) return 'staff'; if (orgs().some((x) => (x.loginId || '').toLowerCase() === id)) return 'org'; if (teams().some((x) => (x.loginId || '').toLowerCase() === id)) return 'leader'; if (Object.values(db.users).some((u) => (u.loginId || '').toLowerCase() === id)) return 'agent'; return null; }
  // 운영자(관리자·팀장) → 회원 메시지. tr: { 언어: 번역문 }
  function sendNotice(o) {
    ensureTeamArrays();
    const n = { id: uid('n_'), userId: o.userId, needReply: !!o.needReply, due: o.due || '', trFail: !!o.trFail, kind: o.kind || 'instruction', from: o.from || 'admin', fromName: o.fromName || '관리자', teamId: o.teamId || '', text: o.text, lang: o.lang || 'ko', tr: o.tr || {}, ts: Date.now(), readAt: null, demo: !!o.demo };
    if (o.fromId) n.fromId = o.fromId; if (o.kind === 'chat') n.updatedAt = n.ts; if (o.sendAt && o.sendAt > n.ts) { n.sendAt = o.sendAt; n.updatedAt = n.ts; try { n.fromKey = sessionStorage.getItem('lm_admin_role') || 'admin'; } catch (e) { /* noop */ } } if (o.batch) n.batch = o.batch; if (o.handoff) n.handoff = o.handoff;
    db.notices.push(n); persist(); Sync.pushShared(); return n;
  }
  // 답장 필요한 지시 중 아직 답장이 없는 것
  function pendingReply(userId) { const ns = noticesOf(userId).filter((n) => n.kind !== 'chat'); return ns.filter((n, i) => n.from !== 'member' && n.needReply && !ns.slice(i + 1).some((x) => x.from === 'member')); }
  // 예약(지연) 발송: 보낸 쪽 관리 화면에서만 보이고, 받는 사람에게는 발송 시각이 지나야 보임
  const isDue = (n) => !n.sendAt || n.sendAt <= Date.now();
  const adminView = () => typeof location !== 'undefined' && /^#\/admin/.test(location.hash) && !viewAs;
  function noticesOf(userId) { ensureTeamArrays(); const adm = adminView(); let me = ''; try { me = sessionStorage.getItem('lm_admin_role') || 'admin'; } catch (e) { /* noop */ } return db.notices.filter((n) => n.userId === userId && (isDue(n) || (adm && n.fromKey === me))).sort((a, b) => Math.max(a.ts, a.sendAt || 0) - Math.max(b.ts, b.sendAt || 0)); }
  function pendingBatches() { ensureTeamArrays(); const m = {}; let me = ''; try { me = sessionStorage.getItem('lm_admin_role') || 'admin'; } catch (e) { /* noop */ } db.notices.forEach((n) => { if (n.sendAt && !isDue(n) && n.fromKey === me) { const k = n.batch || n.id; (m[k] = m[k] || { batch: k, sendAt: n.sendAt, text: n.text, kind: n.kind, fromName: n.fromName, ids: [], users: [] }); m[k].ids.push(n.id); m[k].users.push(n.userId); } }); return Object.values(m).sort((a, b) => a.sendAt - b.sendAt); }
  function sendBatchNow(batch) { const now = Date.now(); let c = 0; db.notices.forEach((n) => { if ((n.batch || n.id) === batch && n.sendAt && n.sendAt > now) { n.sendAt = now; n.ts = now; n.updatedAt = now; c++; } }); if (c) { persist(); Sync.pushShared(); } return c; }
  // 새로 발송 시각이 된 내 지시가 있는지 (받는 화면이 주기적으로 확인)
  let dueSeen = Date.now();
  function dueSince(userId) { const now = Date.now(); const hit = (db.notices || []).some((n) => n.userId === userId && n.sendAt && n.sendAt > dueSeen - 1000 && n.sendAt <= now); dueSeen = now; return hit; }
  function unreadNotices(userId) { return noticesOf(userId).filter((n) => n.kind !== 'chat' && n.from !== 'member' && !n.readAt).length; }
  function markNoticesRead(userId) { const now = Date.now(); let ch = false; noticesOf(userId).forEach((n) => { if (n.from !== 'member' && !n.readAt) { n.readAt = now; ch = true; } }); if (ch) { persistAny(); Sync.pushShared(); } return ch; }
  function markRepliesRead(userId) { const now = Date.now(); let ch = false; noticesOf(userId).forEach((n) => { if (n.from === 'member' && !n.readAt) { n.readAt = now; ch = true; } }); if (ch) { persist(); Sync.pushShared(); } }
  function replyNotice(userId, text, lang, tr) { const n = sendNotice({ userId, kind: 'reply', from: 'member', fromName: (db.users[userId] || {}).nickname || '', text, lang, tr }); return n; }
  function setNoticeTr(id, lang, text) { const n = (db.notices || []).find((x) => x.id === id); if (n) { n.tr = Object.assign({}, n.tr || {}, { [lang]: text }); if (n.trFail) n.trFail = false; n.updatedAt = Date.now(); persistAny(); } }
  // 회원 화면 보기 중에도 읽음 표시 등은 저장하지 않음
  function persistAny() { persist(); }

  function audit(entry) {
    db.audit.unshift(Object.assign({ id: uid('au_'), ts: Date.now(), operator: db.admin.operator, orgId: db.admin.orgId || '' }, entry));
    if (db.audit.length > 3000) db.audit.length = 3000;
    persist();
    Sync.pushShared();
  }
  function addQuality(q) {
    db.quality.unshift(Object.assign({ id: uid('q_'), ts: Date.now(), operator: db.admin.operator, status: 'open' }, q));
    persist();
    Sync.pushShared();
  }

  /* ---------- 샘플 데이터 ---------- */
  function hm(daysAgo, time) {
    const [h, m] = time.split(':').map(Number);
    const d = new Date(); d.setDate(d.getDate() - daysAgo); d.setHours(h, m, 0, 0);
    // 아직 오지 않은 시각이면 하루 전으로 (미래 시각 방지)
    if (d.getTime() > Date.now()) d.setDate(d.getDate() - 1);
    return d.getTime();
  }
  function loadSamples(user, uiLang) {
    const u = user || me();
    const pool = DATA.SAMPLE_POOL.filter((s) => s.lang !== uiLang).slice(0, 4);
    pool.forEach((s) => {
      if (u.contacts.some((x) => x.sample && (x.sampleKey === s.key || (x.nickname === s.nickname && x.app === s.app)))) return; // 샘플 중복 방지
      const c = {
        id: uid('c_'), sampleKey: s.key, nickname: s.nickname, app: s.app, lang: s.lang, country: s.country, color: s.color,
        relation: s.relation, stage: s.stage, metAt: Engine.ymd(new Date(Date.now() - s.metDaysAgo * 86400000)),
        birthday: s.birthday, birthTime: '', birthLunar: false, birthLeap: false, birthTz: '',
        blood: s.blood, mbti: s.mbti, gender: s.gender, age: s.age, note: s.note[uiLang] || s.note.en, createdAt: Date.now(), sample: true,
      };
      u.contacts.push(c);
      s.msgs.forEach(([days, time, dir, tx]) => {
        const srcLang = dir === 'in' ? s.lang : uiLang;
        const trLang = dir === 'in' ? uiLang : s.lang;
        const text = tx[srcLang] || tx.en;
        const tr = tx[trLang] || null;
        u.messages.push({ id: uid('m_'), contactId: c.id, dir, text, lang: srcLang, translation: tr, trLang, ts: hm(days, time), source: 'sample', convId: nextId('C'), intents: Engine.intents(text) });
      });
      (s.promises || []).forEach((p) => {
        const d = new Date(); d.setDate(d.getDate() + p.daysFromNow);
        u.promises.push({ id: uid('p_'), contactId: c.id, title: p.title[uiLang] || p.title.en, date: Engine.ymd(d), time: p.time, place: p.place ? (p.place[uiLang] || p.place.en) : '', done: false, remind: 30, createdAt: Date.now(), sample: true });
      });
      // 서준 메시지의 토요일 약속은 '확인 대기' 상태로 두기 위해 약속에 넣지 않음
    });
    if (!u.me.birth) u.me = Object.assign({ birth: '1999-03-17', birthTime: '', lunar: false, blood: 'A', mbti: 'INFJ', gender: 'f' }, u.me);
    save();
  }

  /* ---------- 관리자 데모 회원 (서버 미연결 시 CRM 화면 확인용) ---------- */
  function ensureDemoMembers() {
    if (Object.values(db.users).some((u) => u.demo)) {
      // 예전 데모 회원에 AI 사용 기록이 없으면 채움
      Object.values(db.users).filter((u) => u.demo && !u.aiUsage).forEach((u, i) => { u.aiUsage = []; const model = i % 2 ? 'claude-haiku-5-5' : 'gpt-4o-mini'; if (u.type === 'member') for (let dday = 0; dday < 30; dday++) for (let k = 0; k < (i * 7 + dday * 3) % 9; k++) u.aiUsage.push({ provider: model.startsWith('gpt') ? 'openai' : 'anthropic', model, in: 700 + ((k * 131 + i * 17) % 900), out: 180 + ((k * 71) % 400), ts: Date.now() - dday * 86400000 - k * 1800000 }); });
      persist(); ensureDemoCrowd(); ensureDemoTeam(); ensureDemoAttendance(); persist(); return;
    }
    const defs = [
      ['Lin', 'zh', 'member', ['seojun', 'haruka', 'minh'], 15],
      ['はると', 'ja', 'member', ['seojun', 'lin', 'alex'], 30],
      ['Minh Anh', 'vi', 'member', ['seojun', 'lin'], 9],
      ['Sarah', 'en', 'member', ['seojun', 'haruka', 'minh', 'lin'], 45],
      ['지훈', 'ko', 'member', ['lin', 'haruka'], 22],
      ['Guest', 'zh', 'guest', ['seojun'], 2],
      ['Kira', 'ko', 'member', ['lin', 'scam'], 11],
      ['Guest', 'vi', 'guest', ['haruka'], 1],
    ];
    const scam = {
      key: 'scam', nickname: 'Jason_invest', lang: 'en', country: 'US', app: 'telegram', color: 'coral', relation: 'romance', stage: 1, metDaysAgo: 5,
      msgs: [
        [5, '22:10', 'in', { en: 'Hi beautiful, I saw your profile and felt a connection.', ko: '안녕 예쁜이, 프로필 보고 끌림을 느꼈어요.', zh: '你好美女，看了你的资料很有感觉。', ja: 'こんにちは、プロフィールを見て惹かれました。', vi: 'Chào người đẹp, mình thấy hồ sơ của bạn và thấy rất hợp.' }],
        [3, '23:40', 'in', { en: 'I make good money with crypto. I can teach you, just invest a little first.', ko: '나는 코인으로 돈을 잘 벌어요. 가르쳐 줄게요, 먼저 조금만 투자해요.', zh: '我做虚拟币赚了很多，可以教你，先投一点。', ja: '仮想通貨で稼いでるよ。教えるから、まず少し投資して。', vi: 'Mình kiếm tiền tốt nhờ tiền ảo. Mình chỉ bạn, đầu tư một chút trước nhé.' }],
        [1, '21:05', 'in', { en: 'Please wire 500 USD to this account today, it is urgent. Let\'s move to Telegram t.me/jinvest', ko: '오늘 이 계좌로 500달러만 송금해 줘요, 급해요. 텔레그램으로 옮겨요 t.me/jinvest', zh: '今天请往这个账户转500美元，很急。我们去Telegram聊 t.me/jinvest', ja: '今日この口座に500ドル送金して、急ぎなんだ。テレグラムに移ろう t.me/jinvest', vi: 'Hôm nay chuyển khoản 500 USD vào tài khoản này nhé, gấp lắm. Chuyển sang Telegram t.me/jinvest' }],
      ],
    };
    const pool = DATA.SAMPLE_POOL.concat([scam]);
    defs.forEach(([nick, lang, type, keys, ageDays], i) => {
      const id = nextId(type === 'member' ? 'U' : 'G');
      const u = {
        id, type, nickname: type === 'guest' ? 'Guest ' + id.slice(2) : nick, lang, demo: true,
        createdAt: Date.now() - ageDays * 86400000, lastActive: Date.now() - (i % 4) * 3600000 * 7,
        consentAt: Date.now() - ageDays * 86400000, consentVer: CONSENT_VERSION, status: 'active', banReason: '',
        me: {}, contacts: [], messages: [], promises: [], anniversaries: [], settings: { notif: {}, remind: 30 }, device: 'demo',
      };
      // 데모: AI 사용 기록 (회원 일부만 AI 키 사용)
      u.aiUsage = [];
      if (type === 'member' && i % 3 !== 2) {
        const model = i % 2 ? 'claude-haiku-5-5' : 'gpt-4o-mini';
        for (let dday = 0; dday < 30; dday++) { const n = (i * 7 + dday * 3) % 9; for (let k = 0; k < n; k++) u.aiUsage.push({ provider: model.startsWith('gpt') ? 'openai' : 'anthropic', model, in: 700 + ((k * 131 + i * 17) % 900), out: 180 + ((k * 71) % 400), ts: Date.now() - dday * 86400000 - k * 1800000 }); }
      }
      for (let dday = 0; dday < 14; dday++) for (let k = 0; k < (i + dday) % 5; k++) u.aiUsage.push({ provider: 'mymemory', model: 'free-mt', in: 30 + k * 7, out: 0, ts: Date.now() - dday * 86400000 - k * 2400000 });
      keys.forEach((k) => {
        const s = pool.find((p) => p.key === k);
        if (!s || s.lang === lang) return;
        const c = { id: uid('c_'), nickname: s.nickname, app: s.app, lang: s.lang, country: s.country, color: s.color, relation: s.relation, stage: s.stage, metAt: Engine.ymd(new Date(Date.now() - s.metDaysAgo * 86400000)), createdAt: Date.now() };
        u.contacts.push(c);
        s.msgs.forEach(([days, time, dir, tx], j) => {
          const srcLang = dir === 'in' ? s.lang : lang;
          const trLang = dir === 'in' ? lang : s.lang;
          const text = tx[srcLang] || tx.en;
          const shift = (i * 3 + j) % 5;
          const intents = Engine.intents(text);
          const risk = intents.filter((x) => x === 'money' || x === 'offplatform');
          u.messages.push({ id: uid('m_'), contactId: c.id, dir, text, lang: srcLang, translation: tx[trLang] || null, trLang, ts: hm(Math.max(0, days - shift), time), source: j % 3 === 0 ? 'ocr' : 'paste', convId: nextId('C'), intents, risk, suggestions: dir === 'in' ? (() => { const nx = s.msgs.slice(j + 1).find((x) => x[2] === 'out'); return nx ? [nx[3][s.lang] || nx[3].en] : []; })() : [], chosen: '' });
        });
      });
      db.users[id] = u;
    });
    // 데모 신고
    const kira = Object.values(db.users).find((u) => u.demo && u.nickname === 'Kira');
    if (kira) {
      const c = kira.contacts.find((x) => x.nickname === 'Jason_invest');
      if (c) db.reports.unshift({ id: nextId('R'), userId: kira.id, contactId: c.id, reason: 'money', note: 'Asked to wire 500 USD and move to Telegram.', status: 'open', createdAt: Date.now() - 3600000 * 5, history: [{ ts: Date.now() - 3600000 * 5, text: 'received' }], demo: true });
    }
    persist();
    ensureDemoCrowd();
    ensureDemoTeam();
    ensureDemoAttendance(); persist();
  }

  /* 데모: 기업용 팀 (팀장 leader1 / 1234) */
  function ensureDemoTeam() {
    ensureTeamArrays();
    if (!db.orgs.some((g) => g.demo)) { const g = createOrg({ id: 'o_demo', name: '데모 상담회사', adminName: '박실장', loginId: 'company1', pin: '1234', demo: true }); db.teams.filter((t) => t.demo && !t.orgId).forEach((t) => { t.orgId = g.id; }); persist(); }
    if (db.teams.some((t) => t.demo)) return;
    const crowd = Object.values(db.users).filter((u) => u.demoCrowd && u.type === 'member').slice(0, 7).map((u) => u.id);
    const mine = db.currentUserId && db.users[db.currentUserId] && !db.users[db.currentUserId].demo ? [db.currentUserId] : [];
    const og = db.orgs.find((g) => g.demo);
    const t = createTeam({ orgId: og ? og.id : '', name: '외국인 고객상담 1팀', leaderName: '김팀장', loginId: 'leader1', pin: '1234', members: mine.concat(crowd), demo: true });
    const crowd2 = Object.values(db.users).filter((u) => u.demoCrowd && u.type === 'member').slice(7, 12).map((u) => u.id);
    if (crowd2.length) createTeam({ orgId: og ? og.id : '', name: '베트남어 상담 2팀', leaderName: '이팀장', loginId: 'leader2', pin: '1234', members: crowd2, demo: true });
    const first = crowd[0] && db.users[crowd[0]];
    if (first) {
      sendNotice({ userId: first.id, kind: 'instruction', from: 'leader', fromName: t.leaderName, teamId: t.id, text: '오늘 오후 문의는 환불 규정을 먼저 안내해 주세요.', lang: 'ko', tr: {}, demo: true });
      const n = noticesOf(first.id)[0]; n.readAt = Date.now() - 1800000; n.ts = Date.now() - 3600000;
      sendNotice({ userId: first.id, kind: 'reply', from: 'member', fromName: first.nickname, teamId: t.id, text: 'OK, I will explain the refund policy first.', lang: 'en', tr: { ko: '네, 환불 규정부터 먼저 안내하겠습니다.' }, demo: true });
    }
    persist();
  }

  function ensureDemoAttendance() {
    let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const ids = new Set(teams().flatMap((t) => t.members || []));
    Object.values(db.users).filter((u) => u.demo && ids.has(u.id) && !u.att).forEach((u) => {
      u.att = {};
      for (let d = 0; d < 7; d++) {
        const day = new Date(); day.setDate(day.getDate() - d); day.setHours(0, 0, 0, 0);
        if (rnd() < 0.12) continue;
        const start = day.getTime() + (8.5 + rnd() * 1.5) * 3600000;
        let end = start + (6.5 + rnd() * 3) * 3600000;
        if (d === 0) end = Math.min(end, Date.now() - (rnd() < 0.4 ? Math.floor(rnd() * 90) * 60000 : 0));
        if (end <= start) continue;
        const lunch = start + 3.5 * 3600000;
        const sessions = lunch < end ? [[start, lunch, 1], [lunch + 50 * 60000, end, d === 0 && end > Date.now() - 120000 ? 0 : 2]] : [[start, end, d === 0 ? 0 : 2]];
        const online = Math.round(sessions.reduce((x, s) => x + (s[1] - s[0]) / 60000, 0));
        u.att[dkey(day.getTime())] = { first: start, last: end, online, active: Math.round(online * (0.55 + rnd() * 0.35)), sessions, lastBeat: end, logoutAt: sessions[sessions.length - 1][2] === 2 ? end : null };
      }
    });
  }

  /* 데모: 대시보드용 회원 무리 (45일간 가입·활동 분포) */
  function ensureDemoCrowd() {
    if (Object.values(db.users).some((u) => u.demoCrowd)) return;
    let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const names = ['Mei', 'Yuki', 'Lan', 'Tom', 'Chen', 'Aoi', 'Hoa', 'Sam', 'Wei', 'Ren', 'Mai', 'Ben', 'Xiu', 'Sora', 'Thu', 'Ann', 'Jun', 'Kai', 'Linh', 'Max', 'Ying', 'Rin', 'Nga', 'Leo', 'Hui', 'Mio', 'Tam', 'Zoe', 'Bo', 'Emi', 'Vy', 'Ivy', 'Qing', 'Nao', 'Duc', 'Amy', '민지', '현우', '지수', '도윤'];
    const langs = ['zh', 'ja', 'vi', 'en', 'ko'];
    const pool = DATA.SAMPLE_POOL;
    const DAY = 86400000; const now = Date.now();
    names.forEach((nick, i) => {
      const guest = rnd() < 0.25;
      const id = nextId(guest ? 'G' : 'U');
      const age = Math.floor(Math.pow(rnd(), 0.8) * 45);
      const lang = langs[Math.floor(rnd() * langs.length)];
      const r = rnd(); const plan = guest ? 'free' : r < 0.62 ? 'free' : r < 0.88 ? 'pro' : 'premium';
      const activeDaysAgo = rnd() < 0.55 ? Math.floor(rnd() * 2) : Math.floor(rnd() * Math.min(age + 1, 20));
      const u = { id, type: guest ? 'guest' : 'member', nickname: guest ? 'Guest ' + id.slice(2) : nick, lang, demo: true, demoCrowd: true, plan,
        createdAt: now - age * DAY - Math.floor(rnd() * DAY), lastActive: now - activeDaysAgo * DAY - Math.floor(rnd() * 8) * 3600000,
        consentAt: now - age * DAY, consentVer: CONSENT_VERSION, status: 'active', banReason: '', me: {}, contacts: [], messages: [], promises: [], anniversaries: [], settings: { notif: {}, remind: 30 }, device: 'demo', aiUsage: [] };
      const cands = pool.filter((p) => p.lang !== lang);
      const nC = 1 + Math.floor(rnd() * (plan === 'premium' ? 6 : plan === 'pro' ? 4 : 2));
      for (let k = 0; k < nC; k++) {
        const sp = cands[(i + k) % cands.length];
        const c = { id: uid('c_'), nickname: sp.nickname, app: sp.app, lang: sp.lang, country: sp.country, color: sp.color, relation: sp.relation, stage: sp.stage, star: Math.floor(rnd() * 4), createdAt: u.createdAt };
        u.contacts.push(c);
        const span = Math.max(1, age - activeDaysAgo);
        const nM = 2 + Math.floor(rnd() * (plan === 'free' ? 10 : 24));
        for (let j = 0; j < nM; j++) {
          const src = sp.msgs[j % sp.msgs.length]; const dir = src[2];
          const d = activeDaysAgo + Math.floor(rnd() * span);
          const hour = [9, 12, 13, 18, 20, 21, 22, 23, 0, 8][Math.floor(rnd() * 10)];
          const ts = Math.min(now - 60000, now - d * DAY - (new Date().getHours() - hour) * 3600000 - Math.floor(rnd() * 3600000));
          const srcLang = dir === 'in' ? sp.lang : lang; const trLang = dir === 'in' ? lang : sp.lang;
          const text = src[3][srcLang] || src[3].en;
          const srcKind = ['paste', 'paste', 'paste', 'ocr', 'import', 'write', 'reply'][Math.floor(rnd() * 7)];
          u.messages.push({ id: uid('m_'), contactId: c.id, dir, text, lang: srcLang, translation: src[3][trLang] || null, trLang, ts, source: dir === 'out' ? (rnd() < 0.4 ? 'reply' : 'write') : srcKind, convId: nextId('C'), intents: [], risk: [], suggestions: [], chosen: '' });
        }
      }
      if (!guest && plan !== 'free') { const model = rnd() < 0.5 ? 'gpt-4o-mini' : 'claude-haiku-5-5'; u.aiUsage = u.messages.filter((m) => m.dir === 'in').map((m) => ({ provider: model.startsWith('gpt') ? 'openai' : 'anthropic', model, in: 600 + Math.floor(rnd() * 900), out: 150 + Math.floor(rnd() * 400), ts: m.ts })); }
      u.aiUsage = u.aiUsage.concat(u.messages.filter((m) => m.dir === 'in' && rnd() < 0.6).map((m) => ({ provider: 'mymemory', model: 'free-mt', in: m.text.length, out: 0, ts: m.ts })));
      db.users[id] = u;
    });
    persist();
  }
  function clearDemo() {
    Object.keys(db.users).forEach((k) => { if (db.users[k].demo) delete db.users[k]; });
    db.reports = db.reports.filter((r) => !r.demo);
    (db.teams || []).concat(db.orgs || [], db.notices || []).filter((x) => x.demo).forEach((x) => markDel(x.id));
    db.teams = (db.teams || []).filter((t) => !t.demo); db.orgs = (db.orgs || []).filter((g) => !g.demo); db.notices = (db.notices || []).filter((n) => !n.demo && db.users[n.userId]);
    persist();
  }

  function wipe() {
    const keepAdmin = db.admin;
    db = blank();
    db.admin = keepAdmin;
    persist();
  }

  /* ---------- 서버 동기화 (Supabase PostgREST) ---------- */
  const Sync = {
    // 테스트 버전 기본 공용 서버 (Supabase 공개 키 · RLS 정책으로 lm_kv 테이블만 사용)
    DEF: { url: 'https://eqsswegpkkyiargzggug.supabase.co', key: 'sb_publishable_5uTiEe3t4tbkbHyvWZfaig_0PIAmMJt' },
    cfg() { let c = {}; try { c = JSON.parse(localStorage.getItem('lm_sync') || '{}'); } catch (e) { c = {}; } if (c.off) return {}; return c.url && c.key ? c : this.DEF; },
    enabled() { const c = this.cfg(); return !!(c.url && c.key) && typeof fetch === 'function'; },
    headers() { const c = this.cfg(); return { apikey: c.key, Authorization: 'Bearer ' + c.key, 'Content-Type': 'application/json' }; },
    base() { return this.cfg().url.replace(/\/$/, '') + '/rest/v1/lm_kv'; },
    sig(o) { const str = JSON.stringify(o); let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return h + ':' + str.length; },
    hs() { if (!this._hs) { try { this._hs = JSON.parse(localStorage.getItem('lm_sync_h') || '{}'); } catch (e) { this._hs = {}; } } return this._hs; },
    saveHs() { try { localStorage.setItem('lm_sync_h', JSON.stringify(this.hs())); } catch (e) { /* noop */ } },
    schedule() { if (!this.enabled() || viewAs) return; this._dirty = true; clearTimeout(this._ft); this._ft = setTimeout(() => this.flush(), 700); },
    isAdminCtx() { try { return /^#\/admin/.test(location.hash) && sessionStorage.getItem('lm_admin_ok') === '1'; } catch (e) { return false; } },
    // 바뀐 것만 서버로: 거래처·팀·본사직원·지시메시지·서버계정 회원·삭제표시
    async flush() {
      if (!this.enabled() || viewAs || this._busy) return; this._busy = true;
      try {
        try { refreshCusts(); } catch (e) { /* noop */ }
        const hs = this.hs(); const rows = []; const now = Date.now();
        const add = (k, obj) => { const sg = this.sig(obj); if (hs[k] !== sg) { rows.push({ key: k, data: obj, sg }); } };
        Object.keys(COLK).forEach((col) => (db[col] || []).forEach((x) => { if (!x || !x.id || x.demo) return; add(COLK[col] + ':' + x.id, x); }));
        Object.values(db.users).forEach((u) => { if (u && u.srv && !u.demo) add('user:' + u.id, u); });
        if (this.isAdminCtx() && (sessionStorage.getItem('lm_admin_role') || 'admin') === 'admin') { try { const o = JSON.parse(localStorage.getItem('lm_ops') || 'null'); if (o) add('cfg:ops', o); } catch (e) { /* noop */ } }
        // 본사 AI 설정(키 제외)을 모든 PC에 배포: 관리자 화면에서만 올림
        if (this.isAdminCtx() && (sessionStorage.getItem('lm_admin_role') || 'admin') === 'admin') { try { const h = JSON.parse(localStorage.getItem('lm_hq_ai') || '{}'); if (h && (h.proxy || h.provider || h.freeAi !== undefined)) add('cfg:hqai', { provider: h.provider || 'openai', model: h.model || '', proxy: h.proxy || '', freeAi: !!h.freeAi, hasKey: !!h.key, by: db.admin.operator || '', updatedAt: h.updatedAt || 0 }); } catch (e) { /* noop */ } }
        (db._del || []).forEach((id) => { const k = 'del:' + id; if (!hs[k]) rows.push({ key: k, data: { id, ts: now }, sg: '1' }); });
        for (let i = 0; i < rows.length; i += 20) {
          const part = rows.slice(i, i + 20);
          const r = await fetch(this.base(), { method: 'POST', headers: Object.assign(this.headers(), { Prefer: 'resolution=merge-duplicates,return=minimal' }), body: JSON.stringify(part.map((x) => ({ key: x.key, data: x.data }))) });
          if (!r.ok) {
            // 한 줄이 잘못돼 묶음 전체가 막히지 않게: 4xx면 한 줄씩 다시 보내고 안 되는 줄만 건너뜀
            if (r.status >= 400 && r.status < 500 && part.length > 1) {
              for (const x of part) {
                const r1 = await fetch(this.base(), { method: 'POST', headers: Object.assign(this.headers(), { Prefer: 'resolution=merge-duplicates,return=minimal' }), body: JSON.stringify([{ key: x.key, data: x.data }]) });
                if (r1.ok) hs[x.key] = x.sg; else { this.bad = Object.assign(this.bad || {}, { [x.key]: r1.status }); }
              }
              continue;
            }
            throw new Error('push ' + r.status);
          }
          part.forEach((x) => { hs[x.key] = x.sg; });
        }
        if (rows.length) this.saveHs();
        this.lastOk = Date.now(); this.err = ''; this._dirty = false; this._errN = 0;
      } catch (e) {
        this.err = String(e.message || e); this._errN = (this._errN || 0) + 1;
        // 보내지 못한 내용이 있다고 화면에 알림 (1분에 한 번) — 자동으로 다시 보냄
        try { if (window.LM && LM.toast && Date.now() - (this._errToast || 0) > 60000) { this._errToast = Date.now(); const L = (document.documentElement.lang || 'ko').slice(0, 2); LM.toast(({ zh: '⚠ 服务器连接失败，消息尚未发送。会自动重试。', en: '⚠ Server connection failed — not sent yet. Retrying automatically.', vi: '⚠ Không kết nối được máy chủ, tin chưa được gửi. Sẽ tự gửi lại.', ja: '⚠ サーバーに接続できず、まだ送信されていません。自動で再送します。' })[L] || '⚠ 서버 연결 실패 — 아직 전송되지 않았습니다. 자동으로 다시 보냅니다.'); } } catch (x) { /* noop */ }
      } finally { this._busy = false; }
    },
    // 서버 → 이 기기. 관리자 화면이면 회원 전체, 아니면 내 계정만
    async pull() {
      if (!this.enabled() || viewAs) return 0;
      const adminCtx = this.isAdminCtx(); const meId = db.currentUserId; const ck = adminCtx ? '_sinceA' : ('_sinceM' + (meId || '')); const since = this[ck] || '';
      let q = '?select=key,data,updated_at&order=updated_at.asc&limit=1000';
      if (since) q += '&updated_at=gt.' + encodeURIComponent(since);
      let rows;
      try { const r = await fetch(this.base() + q, { headers: this.headers() }); if (!r.ok) throw new Error('pull ' + r.status); rows = await r.json(); } catch (e) { this.err = String(e.message || e); return 0; }
      const hs = this.hs(); let changed = 0;
      if (!since) this._fullKeys = new Set(); if (this._fullKeys) rows.forEach((row) => this._fullKeys.add(row.key));
      // 다른 창이 먼저 저장한 내용 반영
      try { const raw = localStorage.getItem(KEY); if (raw) { const st = JSON.parse(raw); if ((st._rev || 0) !== (db._rev || 0)) mergeShared(st); } } catch (e) { /* noop */ }
      rows.forEach((row) => {
        this[ck] = row.updated_at; this._since = row.updated_at;
        const [kind, ...rest] = row.key.split(':'); const id = rest.join(':'); const d = row.data;
        if (kind === 'del') { if (!(db._del || []).includes(d.id)) { db._del = (db._del || []).concat(d.id); Object.keys(COLK).forEach((col) => { db[col] = (db[col] || []).filter((x) => x.id !== d.id); }); if (db.users[d.id] && db.users[d.id].srv && d.id !== meId) delete db.users[d.id]; if (d.id === meId && db.users[meId] && db.users[meId].srv) { delete db.users[meId]; db.currentUserId = null; this._selfDeleted = true; } changed++; } hs[row.key] = '1'; return; }
        if (kind === 'cfg' && id === 'ops') { try { const cur = JSON.parse(localStorage.getItem('lm_ops') || '{}'); if ((d.updatedAt || 0) >= (cur.updatedAt || 0)) { localStorage.setItem('lm_ops', JSON.stringify(d)); if (cur.live !== d.live) changed++; } hs[row.key] = this.sig(d); } catch (e) { /* noop */ } return; }
        if (kind === 'cfg' && id === 'anon') { try { if (d && d.k) localStorage.setItem('lm_proxy_auth', d.k); } catch (e) { /* noop */ } hs[row.key] = '1'; return; }
        if (kind === 'cfg' && id === 'hqai') { try { const cur = JSON.parse(localStorage.getItem('lm_hq_ai') || '{}'); if ((d.updatedAt || 0) >= (cur.updatedAt || 0) || !cur.proxy) { const nx = Object.assign({}, cur, { provider: d.provider, model: d.model, proxy: d.proxy, freeAi: d.freeAi, updatedAt: d.updatedAt }); localStorage.setItem('lm_hq_ai', JSON.stringify(nx)); } hs[row.key] = this.sig(d); } catch (e) { /* noop */ } return; }
        const col = KCOL[kind];
        if (col) {
          if ((db._del || []).includes(id)) return;
          db[col] = db[col] || []; const i = db[col].findIndex((x) => x.id === id); const loc = i >= 0 ? db[col][i] : null;
          // 단체 채팅 읽음·숨김은 여러 PC 기록을 합침
          if (col === 'notices' && loc && (loc.readBy || loc.hide || d.readBy || d.hide)) { const rb = Object.assign({}, d.readBy || {}, loc.readBy || {}); const hd = Object.assign({}, d.hide || {}, loc.hide || {}); if (Object.keys(rb).length) d.readBy = rb; if (Object.keys(hd).length) d.hide = hd; if (!loc.readAt && d.readAt) loc.readAt = d.readAt; else if (loc.readAt && !d.readAt) d.readAt = loc.readAt; }
          if (col === 'notices' && loc && loc.tr && Object.keys(loc.tr).length) { d.tr = Object.assign({}, loc.tr, d.tr || {}); if (d.trFail && Object.keys(d.tr).length) d.trFail = false; }
          const locSig = loc ? this.sig(loc) : ''; const remSig = this.sig(d);
          if (locSig === remSig) { hs[row.key] = remSig; return; }
          const localDirty = loc && hs[row.key] && hs[row.key] !== locSig;
          if (!loc || !localDirty || (d.updatedAt || d.readAt || d.ts || 0) >= (loc.updatedAt || loc.readAt || loc.ts || 0)) { if (i >= 0) db[col][i] = d; else db[col].push(d); hs[row.key] = remSig; changed++; }
          return;
        }
        if (kind === 'user') {
          if ((db._del || []).includes(id)) return; // 삭제된 계정
          if (!adminCtx && id !== meId) return; // 회원 기기에는 다른 회원 데이터를 받지 않음
          const loc = db.users[id]; const remSig = this.sig(d);
          if (loc && this.sig(loc) === remSig) { hs[row.key] = remSig; return; }
          const localDirty = loc && hs[row.key] && hs[row.key] !== this.sig(loc);
          if (!loc || !localDirty || (d.updatedAt || 0) >= (loc.updatedAt || 0)) { db.users[id] = d; stripMoved(d); hs[row.key] = remSig; changed++; }
        }
      });
      try { if (meId && db.users[meId]) { if (stripMoved(db.users[meId])) changed++; if (applyHandoffs(db.users[meId])) changed++; } } catch (e) { /* noop */ }
      this.saveHs();
      if (changed) { ['reports', 'audit', 'quality'].forEach((k) => { if (db[k]) db[k].sort((a, b) => (b.ts || b.createdAt || 0) - (a.ts || a.createdAt || 0)); }); if (db.audit && db.audit.length > 3000) db.audit.length = 3000; }
      if (changed) { try { db._rev = (db._rev || 0) + 1; localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* noop */ } try { window.dispatchEvent(new CustomEvent('lm-sync', { detail: changed })); } catch (e) { /* noop */ } }
      if (this._selfDeleted) { this._selfDeleted = false; try { sessionStorage.setItem('lm_deleted', '1'); } catch (e) { /* noop */ } setTimeout(() => location.reload(), 100); }
      this.lastOk = Date.now(); this.err = '';
      if (rows.length >= 1000) return changed + await this.pull();
      // 서버에서 사라진 항목(서버 초기화 등)은 다시 올림: 올린 기록을 지워 다음 저장 때 재전송
      if (this._fullKeys) { const fk = this._fullKeys; this._fullKeys = null; let lost = 0; Object.keys(hs).forEach((k) => { if (!fk.has(k) && !k.startsWith('del:')) { delete hs[k]; lost++; } }); if (lost) { this.saveHs(); setTimeout(() => this.flush(), 300); } }
      return changed;
    },
    // 상담원 로그인: 서버에서 아이디로 계정 찾기
    async findAgent(loginId, pin) {
      if (!this.enabled()) return null;
      const id = normId(loginId);
      const r = await fetch(this.base() + '?select=data&key=like.user:*&data->>loginId=eq.' + encodeURIComponent(id), { headers: this.headers() });
      if (!r.ok) throw new Error('server ' + r.status);
      const j = await r.json(); const u = j.map((x) => x.data).find((x) => String(x.pin).trim() === String(pin || '').trim());
      return u || (j.length ? 'badpin' : null);
    },
    async findAccount(loginId) {
      // 팀장·거래처 아이디가 서버에 있는지 (다른 PC에서 만든 계정을 바로 받기)
      if (!this.enabled()) return 0; await this.pull(); return 1;
    },
    start() {
      if (this._started || !this.enabled()) return; this._started = true;
      const tick = () => { if (this._dirty || this.err) this.flush(); if (document.hidden) return; this.pull(); };
      this.pull().then(() => this.flush());
      setInterval(tick, 6000);
      document.addEventListener('visibilitychange', () => { if (!document.hidden) this.pull(); else if (this._dirty) this.flush(); });
    },
    async remove(key) {
      if (!this.enabled()) return false;
      try { const r = await fetch(this.base() + '?key=eq.' + encodeURIComponent(key), { method: 'DELETE', headers: this.headers() }); return r.ok; } catch (e) { return false; }
    },
    async upsert(key, data) {
      if (!this.enabled()) return false;
      const c = this.cfg();
      const r = await fetch(c.url.replace(/\/$/, '') + '/rest/v1/lm_kv', {
        method: 'POST',
        headers: Object.assign(this.headers(), { Prefer: 'resolution=merge-duplicates,return=minimal' }),
        body: JSON.stringify([{ key, data, updated_at: new Date().toISOString() }]),
      });
      return r.ok;
    },
    async pushUser(u) {
      if (!u || u.demo || !u.srv || !this.enabled()) return;
      try { this.schedule(); return; await this.upsert('user:' + u.id, u); } catch (e) { /* 오프라인이면 다음 저장 때 재시도 */ }
    },
    async pushShared() {
      if (!this.enabled()) return; this.schedule(); return; // 항목별 동기화(flush)로 대체
      try {
        await this.upsert('shared:reports', db.reports.filter((r) => !r.demo));
        await this.upsert('shared:audit', db.audit.slice(0, 1000));
        await this.upsert('shared:quality', db.quality.slice(0, 1000));
      } catch (e) { /* noop */ }
    },
    async pullAll() {
      if (!this.enabled()) return null;
      const c = this.cfg();
      const r = await fetch(c.url.replace(/\/$/, '') + '/rest/v1/lm_kv?select=key,data,updated_at', { headers: this.headers() });
      if (!r.ok) throw new Error('sync-' + r.status);
      return r.json();
    },
    async fetchMyStatus() {
      const u = me(); if (!u || !this.enabled()) return null;
      const c = this.cfg();
      const r = await fetch(c.url.replace(/\/$/, '') + '/rest/v1/lm_kv?select=data&key=eq.' + encodeURIComponent('ban:' + u.id), { headers: this.headers() });
      if (!r.ok) return null;
      const j = await r.json();
      return j[0] ? j[0].data : null;
    },
  };

  function reload() { if (viewAs) return; db = load(); }
  global.Store = {
    reload, KEY,
    get db() { return db; }, CONSENT_VERSION,
    save, persist, onChange, me, uid, createUser, upgradeToMember, logout,
    addContact, updateContact, removeContact, contact, messagesOf, addMessage, startViewAs, stopViewAs, viewingAs, learnFromMessage, relearnAll,
    addPromise, updatePromise, removePromise, addAnniv, removeAnniv,
    staff, staffById, staffLogin, addStaff, removeStaff, removeUser, removeUserConvo, purgeNotices, removeLeader, leaderAgent, transferContact, transferAll, stripMoved, pendingBatches, sendBatchNow, dueSince, isDue, PLANS, FEATURES, planOf, can, orgs, orgById, createOrg, updateOrg, removeOrg, orgLogin, teamsOfOrg, teams, teamById, teamOf, createTeam, updateTeam, removeTeam, leaderLogin, normId, whoHasId, createAgent, findAgentLocal, agentLoginAs, setCredentials, mergeContactInfo, setContactInfo, INFO_KEYS, sharedCustomers, duplicateCustomers, refreshCusts, decideDup, dupDecision, deviceId, deviceLabel, bindOf, seatState, bindSeat, resetSeat, sendNotice, noticesOf, pendingReply, unreadNotices, markNoticesRead, markRepliesRead, replyNotice, setNoticeTr,
    attBeat, attEnd, dkey,
    addReport, audit, addQuality, loadSamples, ensureDemoMembers, clearDemo, wipe, Sync,
  };
})(typeof window !== 'undefined' ? window : globalThis);
