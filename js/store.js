/* 언어의 마술사 — 저장소
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
    return { version: 1, currentUserId: null, users: {}, reports: [], audit: [], quality: [], seq: { U: 0, G: 0, R: 0, C: 0 }, admin: { pin: '0000', operator: 'OP-01' } };
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = Object.assign(blank(), JSON.parse(raw));
        // 샘플 연락처 이름 변경(우재 → 서준) 반영
        Object.values(d.users || {}).forEach((u) => (u.contacts || []).forEach((c) => { if (c.sample && (c.nickname === '우재' || c.nickname === '宇宰')) c.nickname = '서준'; }));
        return d;
      }
    } catch (e) { /* 손상된 데이터는 새로 시작 */ }
    return blank();
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { console.warn('save failed', e); }
  }
  function save(opts) {
    persist();
    listeners.forEach((fn) => { try { fn(); } catch (e) { /* noop */ } });
    if (!(opts && opts.noSync)) {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => { Sync.pushUser(me()); }, 1200);
    }
  }
  function onChange(fn) { listeners.push(fn); }

  function me() { return db.currentUserId ? db.users[db.currentUserId] : null; }
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

  function logout() { db.currentUserId = null; save({ noSync: true }); }

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
  function audit(entry) {
    db.audit.unshift(Object.assign({ id: uid('au_'), ts: Date.now(), operator: db.admin.operator }, entry));
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
      const c = {
        id: uid('c_'), nickname: s.nickname, app: s.app, lang: s.lang, country: s.country, color: s.color,
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
    if (Object.values(db.users).some((u) => u.demo)) return;
    const defs = [
      ['Lin', 'zh', 'member', ['woojae', 'haruka', 'minh'], 15],
      ['はると', 'ja', 'member', ['woojae', 'lin', 'alex'], 30],
      ['Minh Anh', 'vi', 'member', ['woojae', 'lin'], 9],
      ['Sarah', 'en', 'member', ['woojae', 'haruka', 'minh', 'lin'], 45],
      ['지훈', 'ko', 'member', ['lin', 'haruka'], 22],
      ['Guest', 'zh', 'guest', ['woojae'], 2],
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
  }
  function clearDemo() {
    Object.keys(db.users).forEach((k) => { if (db.users[k].demo) delete db.users[k]; });
    db.reports = db.reports.filter((r) => !r.demo);
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

  global.Store = {
    get db() { return db; }, CONSENT_VERSION,
    save, persist, onChange, me, uid, createUser, upgradeToMember, logout,
    addContact, updateContact, removeContact, contact, messagesOf, addMessage, learnFromMessage, relearnAll,
    addPromise, updatePromise, removePromise, addAnniv, removeAnniv,
    addReport, audit, addQuality, loadSamples, ensureDemoMembers, clearDemo, wipe, Sync,
  };
})(typeof window !== 'undefined' ? window : globalThis);
