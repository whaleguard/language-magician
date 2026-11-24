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
        return d;
      }
    } catch (e) { /* 손상된 데이터는 새로 시작 */ }
    return blank();
  }
  // 다른 창(팝업·잠든 탭)이 예전 데이터로 덮어써 팀·거래처·계정이 사라지지 않도록 병합 후 저장
  const SHARED = ['teams', 'orgs', 'staff', 'notices'];
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
    db._del = Array.from(del).slice(-500);
  }
  function persist() {
    if (viewAs) return; // 회원 화면 보기 중에는 저장하지 않음
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const st = JSON.parse(raw); if ((st._rev || 0) !== (db._rev || 0)) mergeShared(st); db._rev = Math.max(st._rev || 0, db._rev || 0) + 1; } else db._rev = (db._rev || 0) + 1;
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch (e) { console.warn('save failed', e); }
  }
  function markDel(id) { db._del = (db._del || []).concat(id); }
  function save(opts) {
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
  try { const va = sessionStorage.getItem('lm_view_as'); if (va && db.users[va]) viewAs = JSON.parse(JSON.stringify(db.users[va])); } catch (e) { viewAs = null; }
  function me() { if (viewAs) return viewAs; return db.currentUserId ? db.users[db.currentUserId] : null; }
  function startViewAs(id) { try { sessionStorage.setItem('lm_view_as', id); } catch (e) {} }
  function stopViewAs() { try { sessionStorage.removeItem('lm_view_as'); } catch (e) {} viewAs = null; }
  function viewingAs() { return viewAs; }
  function nextId(kind) { db.seq[kind] = (db.seq[kind] || 0) + 1; return kind + '-' + String(db.seq[kind]).padStart(4, '0'); }

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
      device: (navigator.userAgent || '').slice(0, 120),
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
  function ensureTeamArrays() { db.teams = db.teams || []; db.notices = db.notices || []; db.orgs = db.orgs || []; db.staff = db.staff || []; if (!db.staff.some((x) => x.demo)) { db.staff.push({ id: uid('s_'), type: 'personal', name: '일반고객 담당', loginId: 'personal1', pin: '1234', demo: true }, { id: uid('s_'), type: 'business', name: '기업고객 담당', loginId: 'business1', pin: '1234', demo: true }); } }
  // 본사 관리자 계정: personal(일반고객 관리자) | business(기업고객 관리자). 최종 관리자는 admin 계정
  function staff() { ensureTeamArrays(); return db.staff; }
  function staffById(id) { return staff().find((x) => x.id === id); }
  function staffLogin(loginId, pin) { const id = normId(loginId); return staff().find((x) => x.loginId && x.loginId.toLowerCase() === id && String(x.pin).trim() === String(pin || '').trim()); }
  function addStaff(o) { const x = { id: uid('s_'), type: o.type === 'business' ? 'business' : 'personal', name: o.name || '', loginId: String(o.loginId || '').trim(), pin: String(o.pin || '1234') }; staff().push(x); persist(); Sync.pushShared(); return x; }
  function removeStaff(id) { markDel(id); db.staff = staff().filter((x) => x.id !== id); persist(); Sync.pushShared(); }
  // 기업(상담회사) — 기업 관리자 → 팀장 → 상담원
  function orgs() { ensureTeamArrays(); return db.orgs; }
  function orgById(id) { return orgs().find((o) => o.id === id); }
  function createOrg(o) { ensureTeamArrays(); const g = { id: uid('o_'), name: o.name || '새 기업', adminName: o.adminName || '', loginId: String(o.loginId || '').trim(), pin: String(o.pin || '1234'), createdAt: Date.now(), demo: !!o.demo }; db.orgs.push(g); persist(); Sync.pushShared(); return g; }
  function updateOrg(id, patch) { const g = orgById(id); if (!g) return null; Object.assign(g, patch); persist(); Sync.pushShared(); return g; }
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
  function whoHasId(loginId) { const id = normId(loginId); if (!id) return null; if (id === String(db.admin.loginId || 'admin').toLowerCase()) return 'admin'; if (staff().some((x) => (x.loginId || '').toLowerCase() === id)) return 'staff'; if (orgs().some((x) => (x.loginId || '').toLowerCase() === id)) return 'org'; if (teams().some((x) => (x.loginId || '').toLowerCase() === id)) return 'leader'; return null; }
  // 운영자(관리자·팀장) → 회원 메시지. tr: { 언어: 번역문 }
  function sendNotice(o) {
    ensureTeamArrays();
    const n = { id: uid('n_'), userId: o.userId, needReply: !!o.needReply, due: o.due || '', trFail: !!o.trFail, kind: o.kind || 'instruction', from: o.from || 'admin', fromName: o.fromName || '관리자', teamId: o.teamId || '', text: o.text, lang: o.lang || 'ko', tr: o.tr || {}, ts: Date.now(), readAt: null, demo: !!o.demo };
    db.notices.push(n); persist(); Sync.pushShared(); return n;
  }
  // 답장 필요한 지시 중 아직 답장이 없는 것
  function pendingReply(userId) { const ns = noticesOf(userId); return ns.filter((n, i) => n.from !== 'member' && n.needReply && !ns.slice(i + 1).some((x) => x.from === 'member')); }
  function noticesOf(userId) { ensureTeamArrays(); return db.notices.filter((n) => n.userId === userId).sort((a, b) => a.ts - b.ts); }
  function unreadNotices(userId) { return noticesOf(userId).filter((n) => n.from !== 'member' && !n.readAt).length; }
  function markNoticesRead(userId) { const now = Date.now(); let ch = false; noticesOf(userId).forEach((n) => { if (n.from !== 'member' && !n.readAt) { n.readAt = now; ch = true; } }); if (ch) { persistAny(); Sync.pushShared(); } return ch; }
  function markRepliesRead(userId) { const now = Date.now(); let ch = false; noticesOf(userId).forEach((n) => { if (n.from === 'member' && !n.readAt) { n.readAt = now; ch = true; } }); if (ch) { persist(); Sync.pushShared(); } }
  function replyNotice(userId, text, lang, tr) { const n = sendNotice({ userId, kind: 'reply', from: 'member', fromName: (db.users[userId] || {}).nickname || '', text, lang, tr }); return n; }
  function setNoticeTr(id, lang, text) { const n = (db.notices || []).find((x) => x.id === id); if (n) { n.tr = n.tr || {}; n.tr[lang] = text; persistAny(); } }
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
    if (!db.orgs.some((g) => g.demo)) { const g = createOrg({ name: '데모 상담회사', adminName: '박실장', loginId: 'company1', pin: '1234', demo: true }); db.teams.filter((t) => t.demo && !t.orgId).forEach((t) => { t.orgId = g.id; }); persist(); }
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
    cfg() { try { return JSON.parse(localStorage.getItem('lm_sync') || '{}'); } catch (e) { return {}; } },
    enabled() { const c = this.cfg(); return !!(c.url && c.key); },
    headers() { const c = this.cfg(); return { apikey: c.key, Authorization: 'Bearer ' + c.key, 'Content-Type': 'application/json' }; },
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
      if (!u || u.demo || !this.enabled()) return;
      try { await this.upsert('user:' + u.id, u); } catch (e) { /* 오프라인이면 다음 저장 때 재시도 */ }
    },
    async pushShared() {
      if (!this.enabled()) return;
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
    staff, staffById, staffLogin, addStaff, removeStaff, PLANS, FEATURES, planOf, can, orgs, orgById, createOrg, updateOrg, removeOrg, orgLogin, teamsOfOrg, teams, teamById, teamOf, createTeam, updateTeam, removeTeam, leaderLogin, normId, whoHasId, sendNotice, noticesOf, pendingReply, unreadNotices, markNoticesRead, markRepliesRead, replyNotice, setNoticeTr,
    attBeat, attEnd, dkey,
    addReport, audit, addQuality, loadSamples, ensureDemoMembers, clearDemo, wipe, Sync,
  };
})(typeof window !== 'undefined' ? window : globalThis);
