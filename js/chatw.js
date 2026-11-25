/* 상담매직 실시간 채팅 위젯 — 회사·본사 ↔ 팀장 ↔ 상담원
   화면 오른쪽 아래 떠 있는 「채팅」 버튼. 대화는 공지(notices)에 kind:'chat'으로 저장되어 모든 PC에 동기화됩니다.
   팀장·회사 → 상담원 메시지는 상담원 언어로, 상담원 → 팀장 메시지는 한국어로 자동 번역됩니다. */
(function () {
  'use strict';
  if (typeof Store === 'undefined') return;
  const T = {
    ko: { gTeam: '팀 전체방', gOrg: '팀장 전체방', grpG: '단체방', readN: '읽음 {n}', q1: '확인했습니다', q2: '진행 중입니다', q3: '완료했습니다', q4: '잠시만요', tabList: '대화 목록', tabNew: '새 대화', pick: '누구와 대화할까요?', search: '이름·팀 검색', del: '삭제', delQ: '이 대화를 내 목록에서 삭제할까요? (상대방 기록은 남습니다)', noHist: '아직 나눈 대화가 없습니다. 「새 대화」에서 상대를 고르세요.', grpL: '팀장', grpA: '상담원', grpC: '회사', btn: '채팅', title: '실시간 채팅', back: '목록', ph: '메시지 입력 · Enter 보내기 · Shift+Enter 줄바꿈', send: '보내기', none: '대화 상대가 없습니다', empty: '아직 메시지가 없습니다. 먼저 인사해 보세요.', read: '읽음', company: '회사 관리자', leader: '팀장', agent: '상담원', you: '나', tr: '번역', orig: '원문', online: '접속 중', offline: '최근 접속', newmsg: '새 메시지' },
    zh: { gTeam: '团队群', gOrg: '组长群', grpG: '群聊', readN: '{n}人已读', q1: '收到', q2: '正在处理', q3: '已完成', q4: '请稍等', tabList: '聊天列表', tabNew: '新聊天', pick: '要和谁聊天？', search: '搜索姓名・团队', del: '删除', delQ: '要从我的列表删除这段聊天吗？（对方的记录会保留）', noHist: '还没有聊天记录。请在「新聊天」中选择对象。', grpL: '组长', grpA: '咨询员', grpC: '公司', btn: '聊天', title: '即时聊天', back: '列表', ph: '输入消息 · Enter 发送 · Shift+Enter 换行', send: '发送', none: '没有聊天对象', empty: '还没有消息，先打个招呼吧。', read: '已读', company: '公司管理员', leader: '组长', agent: '咨询员', you: '我', tr: '翻译', orig: '原文', online: '在线', offline: '最近在线', newmsg: '新消息' },
    ja: { gTeam: 'チーム全体', gOrg: 'リーダー全体', grpG: 'グループ', readN: '既読 {n}', q1: '確認しました', q2: '対応中です', q3: '完了しました', q4: '少々お待ちください', tabList: '会話一覧', tabNew: '新しい会話', pick: '誰と話しますか？', search: '名前・チーム検索', del: '削除', delQ: 'この会話を自分の一覧から削除しますか？（相手の記録は残ります）', noHist: 'まだ会話がありません。「新しい会話」から相手を選んでください。', grpL: 'リーダー', grpA: 'オペレーター', grpC: '会社', btn: 'チャット', title: 'リアルタイムチャット', back: '一覧', ph: 'メッセージ入力 · Enterで送信 · Shift+Enterで改行', send: '送信', none: '相手がいません', empty: 'まだメッセージがありません。', read: '既読', company: '会社管理者', leader: 'リーダー', agent: 'オペレーター', you: '自分', tr: '翻訳', orig: '原文', online: 'オンライン', offline: '最終接続', newmsg: '新着' },
    vi: { gTeam: 'Nhóm cả đội', gOrg: 'Nhóm trưởng nhóm', grpG: 'Nhóm chat', readN: '{n} đã xem', q1: 'Đã nhận', q2: 'Đang xử lý', q3: 'Đã xong', q4: 'Chờ một chút', tabList: 'Danh sách', tabNew: 'Trò chuyện mới', pick: 'Bạn muốn nói chuyện với ai?', search: 'Tìm tên, nhóm', del: 'Xóa', delQ: 'Xóa cuộc trò chuyện này khỏi danh sách của bạn? (Bên kia vẫn giữ lịch sử)', noHist: 'Chưa có cuộc trò chuyện. Chọn người ở «Trò chuyện mới».', grpL: 'Trưởng nhóm', grpA: 'Nhân viên', grpC: 'Công ty', btn: 'Trò chuyện', title: 'Trò chuyện trực tiếp', back: 'Danh sách', ph: 'Nhập tin · Enter gửi · Shift+Enter xuống dòng', send: 'Gửi', none: 'Chưa có người trò chuyện', empty: 'Chưa có tin nhắn. Hãy chào trước nhé.', read: 'Đã xem', company: 'Quản lý công ty', leader: 'Trưởng nhóm', agent: 'Nhân viên', you: 'Tôi', tr: 'Dịch', orig: 'Gốc', online: 'Đang online', offline: 'Truy cập', newmsg: 'Tin mới' },
    en: { gTeam: 'Whole team', gOrg: 'All leaders', grpG: 'Groups', readN: 'Read by {n}', q1: 'Got it', q2: 'Working on it', q3: 'Done', q4: 'One moment', tabList: 'Chats', tabNew: 'New chat', pick: 'Who do you want to chat with?', search: 'Search name or team', del: 'Delete', delQ: 'Delete this chat from your list? (The other side keeps their copy)', noHist: 'No chats yet. Pick someone in “New chat”.', grpL: 'Leaders', grpA: 'Agents', grpC: 'Company', btn: 'Chat', title: 'Live chat', back: 'List', ph: 'Type a message · Enter to send · Shift+Enter new line', send: 'Send', none: 'No one to chat with', empty: 'No messages yet. Say hello first.', read: 'Read', company: 'Company admin', leader: 'Team leader', agent: 'Agent', you: 'Me', tr: 'Translation', orig: 'Original', online: 'Online', offline: 'Last seen', newmsg: 'New message' },
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let open = false; let cur = null; let tab = ''; let search = ''; let poll = null; let lastSeen = 0; let busy = false;

  // 지금 이 화면의 사람은 누구인가: 관리자 화면(회사·본사·팀장) 또는 상담원 앱
  function ctx() {
    try {
      if (Store.viewingAs && Store.viewingAs()) return null;
      if (new URLSearchParams(location.search).has('pop')) return null;
      const adm = /^#\/admin/.test(location.hash) && sessionStorage.getItem('lm_admin_ok') === '1';
      if (adm) {
        const r = sessionStorage.getItem('lm_admin_role') || 'admin';
        if (r.startsWith('leader:')) { const t = Store.teamById(r.slice(7)); return t ? { kind: 'leader', lang: 'ko', team: t, name: (t.leaderName || '팀장') + ' 팀장' } : null; }
        if (r.startsWith('org:')) { const g = Store.orgById(r.slice(4)); return g ? { kind: 'org', lang: 'ko', org: g, name: (g.adminName || '회사 관리자') + ' (회사)' } : null; }
        return { kind: 'hq', lang: 'ko', name: '본사 관리자' };
      }
      const u = Store.me(); if (!u || !u.agent) return null;
      const t = Store.teamOf(u.id); if (!t) return null;
      return { kind: 'agent', lang: u.lang || 'ko', team: t, user: u, name: u.nickname };
    } catch (e) { return null; }
  }
  const tx = (c, k) => ((T[c && c.lang] || T.en)[k] || T.ko[k]);

  // 대화 상대 목록
  function peers(c) {
    if (!c) return [];
    const langsOfTeam = (t) => Array.from(new Set(['ko'].concat((t.members || []).map((id) => (Store.db.users[id] || {}).lang).filter(Boolean))));
    const gTeam = (t) => ({ grp: 'grpG', group: true, id: 'G:T:' + t.id, title: tx(c, 'gTeam'), sub: t.name, langs: langsOfTeam(t), team: t, size: 1 + (t.members || []).length });
    const gOrg = (orgId, name) => ({ grp: 'grpG', group: true, id: 'G:O:' + orgId, title: tx(c, 'gOrg'), sub: name || '', langs: ['ko'], size: 1 + Store.teams().filter((t) => t.orgId === orgId).length });
    if (c.kind === 'agent') return [{ grp: 'grpL', id: c.user.id, title: (c.team.leaderName || tx(c, 'leader')) + ' · ' + tx(c, 'leader'), sub: c.team.name, side: 'member', peerLang: 'ko' }, gTeam(c.team)];
    const teams = c.kind === 'leader' ? [c.team] : c.kind === 'org' ? Store.teams().filter((t) => t.orgId === c.org.id) : Store.teams();
    const out = [];
    if (c.kind === 'leader') out.push({ grp: 'grpC', id: 'L:' + c.team.id, title: '🏢 ' + tx(c, 'company'), sub: c.team.name, side: 'member', peerLang: 'ko' });
    else teams.forEach((t) => out.push({ grp: 'grpL', id: 'L:' + t.id, title: (t.leaderName || '팀장') + ' ' + tx(c, 'leader'), sub: t.name, side: 'admin', peerLang: 'ko', team: t }));
    // 단체방: 팀 전체방(팀장+상담원), 팀장 전체방(회사+팀장)
    if (c.kind === 'leader') { out.push(gTeam(c.team)); if (c.team.orgId) out.push(gOrg(c.team.orgId, (Store.orgById(c.team.orgId) || {}).name)); }
    else { if (c.kind === 'org') out.push(gOrg(c.org.id, c.org.name)); else Store.orgs().forEach((g) => out.push(gOrg(g.id, g.name))); teams.forEach((t) => out.push(gTeam(t))); }
    teams.forEach((t) => (t.members || []).forEach((id) => { const u = Store.db.users[id]; if (u && u.agent) out.push({ grp: 'grpA', id: u.id, title: u.nickname + ' · ' + tx(c, 'agent'), sub: t.name, side: 'admin', peerLang: u.lang || 'ko', last: u.lastActive, team: t }); }));
    return out;
  }
  let viewerKey = 'x';
  const chats = (id) => Store.noticesOf(id).filter((n) => n.kind === 'chat' && !(n.hide && n.hide[viewerKey]));
  const isMine = (n, p) => (p.group ? n.fromId === viewerKey : (p.side === 'member' ? n.from === 'member' : n.from !== 'member'));
  const seenBy = (n, p) => (p.group ? !!(n.readBy && n.readBy[viewerKey]) : !!n.readAt);
  const unreadOf = (p) => chats(p.id).filter((n) => !isMine(n, p) && !seenBy(n, p)).length;
  function markRead(p) {
    const now = Date.now(); let ch = false;
    chats(p.id).forEach((n) => { if (!isMine(n, p) && !seenBy(n, p)) { if (p.group) n.readBy = Object.assign({}, n.readBy || {}, { [viewerKey]: now }); else n.readAt = now; ch = true; } });
    if (ch) Store.persist();
  }

  function ensureDom() {
    let b = document.getElementById('cw-btn');
    if (!b) {
      b = document.createElement('button'); b.id = 'cw-btn'; b.type = 'button'; b.className = 'cw-btn';
      b.addEventListener('click', () => { open = !open; if (!open) { cur = null; tab = 'list'; } render(); startPoll(); });
      document.body.appendChild(b);
      const pnl = document.createElement('section'); pnl.id = 'cw-panel'; pnl.className = 'cw-panel'; pnl.hidden = true; pnl.setAttribute('aria-label', 'chat');
      document.body.appendChild(pnl);
    }
    return { b, pnl: document.getElementById('cw-panel') };
  }

  function render() {
    const c = ctx(); if (c) viewerKey = c.kind + ':' + (c.kind === 'agent' ? c.user.id : c.kind === 'leader' ? c.team.id : c.kind === 'org' ? c.org.id : 'hq');
    const ex = document.getElementById('cw-btn');
    if (!c) { if (ex) { ex.remove(); const p = document.getElementById('cw-panel'); if (p) p.remove(); } open = false; return; }
    curLang = c.lang || 'ko';
    const ps = peers(c);
    const { b, pnl } = ensureDom();
    const total = ps.reduce((a, p) => a + unreadOf(p), 0);
    b.innerHTML = `<span class="cw-ic" aria-hidden="true">💬</span><span>${esc(tx(c, 'btn'))}</span>${total ? `<span class="cw-badge">${total}</span>` : ''}`;
    b.classList.toggle('on', open);
    pnl.hidden = !open;
    if (!open) return;
    if (cur && !ps.some((p) => p.id === cur)) cur = null;
    if (!cur) {
      // 대화 목록(나눈 대화) / 새 대화(상대 고르기)
      const hist = ps.map((p) => { const ms = chats(p.id); return { p, last: ms[ms.length - 1], un: unreadOf(p) }; }).filter((x) => x.last).sort((x, y) => y.last.ts - x.last.ts);
      if (!tab) tab = hist.length ? 'list' : 'new';
      const q = (search || '').toLowerCase();
      const row = (p, last, un, del) => { const on = p.last && Date.now() - p.last < 5 * 60000; return `<div class="cw-row-wrap"><button type="button" class="cw-row" data-p="${esc(p.id)}"><span class="cw-av">${p.group ? '📢' : esc(Array.from((p.title || '?').replace(/^🏢\s*/, ''))[0] || '?')}${on ? '<i class="cw-on"></i>' : ''}</span><span class="cw-rt"><span class="cw-top"><b>${esc(p.title)}</b>${last ? `<time>${esc(ago(last.ts))}</time>` : ''}</span><small>${esc(p.sub || '')}</small>${last ? `<span class="cw-last">${esc(shown(last, p, c).slice(0, 44))}</span>` : ''}</span>${un ? `<span class="cw-badge">${un}</span>` : ''}</button>${del ? `<button type="button" class="cw-del" data-del="${esc(p.id)}" title="${esc(tx(c, 'del'))}">🗑</button>` : ''}</div>`; };
      const grps = ['grpG', 'grpC', 'grpL', 'grpA'].map((g) => [g, ps.filter((p) => p.grp === g && (!q || (p.title + ' ' + (p.sub || '')).toLowerCase().includes(q)))]).filter((x) => x[1].length);
      pnl.innerHTML = `<header class="cw-head"><b>${esc(tx(c, 'title'))}</b><button type="button" class="cw-x" aria-label="close">×</button></header>
        <div class="cw-tabs" role="tablist"><button type="button" role="tab" class="${tab === 'list' ? 'on' : ''}" data-tab="list">${esc(tx(c, 'tabList'))}${hist.some((x) => x.un) ? ` <span class="cw-badge sm">${hist.reduce((a, x) => a + x.un, 0)}</span>` : ''}</button><button type="button" role="tab" class="${tab === 'new' ? 'on' : ''}" data-tab="new">＋ ${esc(tx(c, 'tabNew'))}</button></div>
        ${tab === 'list' ? `<div class="cw-list">${hist.length ? hist.map((x) => row(x.p, x.last, x.un, true)).join('') : `<p class="cw-empty">${esc(tx(c, 'noHist'))}</p>`}</div>`
        : `<div class="cw-pick"><p class="cw-pick-h">${esc(tx(c, 'pick'))}</p>${ps.length > 6 ? `<input class="cw-search" id="cw-search" type="search" placeholder="${esc(tx(c, 'search'))}" value="${esc(search || '')}">` : ''}</div><div class="cw-list">${grps.length ? grps.map(([g, list]) => `<p class="cw-grp">${esc(tx(c, g))} ${list.length}</p>${list.map((p) => row(p, null, unreadOf(p), false)).join('')}`).join('') : `<p class="cw-empty">${esc(tx(c, 'none'))}</p>`}</div>`}`;
      pnl.querySelectorAll('[data-tab]').forEach((t) => t.addEventListener('click', () => { tab = t.dataset.tab; render(); }));
      const se = document.getElementById('cw-search'); if (se) { se.addEventListener('input', () => { search = se.value; const pos = se.selectionStart; render(); const s2 = document.getElementById('cw-search'); if (s2) { s2.focus(); s2.selectionStart = s2.selectionEnd = pos; } }); }
      pnl.querySelectorAll('[data-del]').forEach((d) => d.addEventListener('click', (e) => { e.stopPropagation(); if (!confirmDel(c)) return; chats(d.dataset.del).forEach((n) => { n.hide = Object.assign({}, n.hide || {}, { [viewerKey]: Date.now() }); }); Store.persist(); render(); }));
    } else {
      const p = ps.find((x) => x.id === cur); markRead(p);
      const ms = chats(p.id);
      // 번역이 빠진 메시지는 바로 내 언어로 채움 (서로 각자 언어로 대화)
      const my = c.lang || 'ko';
      ms.forEach((n) => { if (n.lang && n.lang !== my && !(n.tr && n.tr[my]) && !pendingTr[n.id]) { pendingTr[n.id] = 1; Engine.translate(n.text, my, n.lang).then((o) => { if (o && o.text) { n.tr = Object.assign({}, n.tr || {}, { [my]: o.text }); Store.persist(); render(); } }).catch(() => {}); } });
      pnl.innerHTML = `<header class="cw-head"><button type="button" class="cw-back">‹ ${esc(tx(c, 'back'))}</button><span class="cw-ht"><b>${esc(p.title)}</b><small>${esc(p.sub || '')}</small></span>${c.kind !== 'agent' && ms.length ? `<button type="button" class="cw-purge" title="이 대화를 모든 사람에게서 삭제">🗑</button>` : ''}<button type="button" class="cw-x" aria-label="close">×</button></header>
        <div class="cw-thread" id="cw-thread">${ms.length ? ms.map((n, i) => { const mine = isMine(n, p); const main = shown(n, p, c); const orig = main !== n.text ? n.text : ''; const gap = !i || n.ts - ms[i - 1].ts > 5 * 60000; const ini = esc(Array.from(String((mine ? (c.name || c.nickname || '') : n.fromName) || '?').replace(/^🏢\s*/, ''))[0] || '?'); return `${gap ? `<p class="cw-time">${esc(new Date(n.ts).toLocaleString(LOC(), { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }))}</p>` : ''}<div class="cw-msg ${mine ? 'me' : 'them'}"><span class="cw-mav">${ini}</span><div class="cw-mbody">${mine || !p.group ? '' : `<span class="cw-from">${esc(n.fromName || '')}</span>`}<div class="cw-bub">${esc(main).replace(/\n/g, '<br>')}${orig ? `<span class="cw-orig">${esc(tx(c, 'orig'))}: ${esc(orig)}</span>` : ''}</div>${c.kind !== 'agent' ? `<button type="button" class="cw-mdel" data-nd="${esc(n.id)}" title="모두에게서 삭제">삭제</button>` : ''}<span class="cw-meta">${new Date(n.ts).toLocaleTimeString(LOC(), { hour: '2-digit', minute: '2-digit' })}${mine ? (p.group ? (Object.keys(n.readBy || {}).length ? ' · ' + esc(tx(c, 'readN').replace('{n}', Object.keys(n.readBy).length)) : '') : (n.readAt ? ' · ' + esc(tx(c, 'read')) : '')) : ''}</span></div></div>`; }).join('') : `<p class="cw-empty">${esc(tx(c, 'empty'))}</p>`}</div>
        <div class="cw-quick">${['q1', 'q2', 'q3', 'q4'].map((k) => `<button type="button" data-q="${esc(tx(c, k))}">${esc(tx(c, k))}</button>`).join('')}</div>
        <form class="cw-form" id="cw-form"><textarea id="cw-in" rows="2" placeholder="${esc(tx(c, 'ph'))}"></textarea><button type="submit" class="cw-send">${esc(tx(c, 'send'))}</button></form>`;
      const th = document.getElementById('cw-thread'); if (th) th.scrollTop = th.scrollHeight;
      const f = document.getElementById('cw-form'); const ta = document.getElementById('cw-in');
      if (draft[cur]) ta.value = draft[cur];
      ta.addEventListener('input', () => { draft[cur] = ta.value; });
      ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); f.requestSubmit(); } });
      f.addEventListener('submit', (e) => { e.preventDefault(); send(c, p, ta.value); });
      pnl.querySelectorAll('[data-q]').forEach((q) => q.addEventListener('click', () => send(c, p, q.dataset.q)));
      // 관리자·회사·팀장: 메시지·대화 영구 삭제 (모든 사람 화면에서)
      pnl.querySelectorAll('.cw-mdel').forEach((b) => b.addEventListener('click', () => { const n = ms.find((x) => x.id === b.dataset.nd); if (!n || !confirm('이 메시지를 모든 사람에게서 삭제할까요?\n\n' + String(n.text || '').slice(0, 60))) return; Store.purgeNotices([n.id]); try { Store.audit({ action: 'delete', target: p.id, reason: '채팅 메시지 삭제 · ' + String(n.text || '').slice(0, 30) }); } catch (e) {} render(); }));
      const pg = pnl.querySelector('.cw-purge'); if (pg) pg.addEventListener('click', () => { if (!confirm(`「${p.title}」 대화 ${ms.length}건을 모든 사람에게서 영구 삭제할까요? 되돌릴 수 없습니다.`)) return; const all = Store.noticesOf(p.id).filter((n) => n.kind === 'chat').map((n) => n.id); Store.purgeNotices(all); try { Store.audit({ action: 'delete', target: p.id, reason: '채팅방 대화 삭제 · ' + p.title + ' · ' + all.length + '건' }); } catch (e) {} cur = null; tab = 'list'; render(); });
      setTimeout(() => ta.focus(), 30);
    }
    pnl.querySelectorAll('.cw-row').forEach((r) => r.addEventListener('click', () => { cur = r.dataset.p; render(); }));
    const bk = pnl.querySelector('.cw-back'); if (bk) bk.addEventListener('click', () => { cur = null; tab = 'list'; render(); });
    const x = pnl.querySelector('.cw-x'); if (x) x.addEventListener('click', () => { open = false; cur = null; tab = 'list'; render(); });
  }
  const draft = {}; const pendingTr = {};
  let curLang = 'ko'; const LOC = () => ({ ko: 'ko-KR', zh: 'zh-CN', vi: 'vi-VN', en: 'en-US', ja: 'ja-JP', th: 'th-TH' })[curLang] || undefined;
  function ago(ts) { const d = new Date(ts), n = new Date(); if (d.toDateString() === n.toDateString()) return d.toLocaleTimeString(LOC(), { hour: '2-digit', minute: '2-digit' }); return d.toLocaleDateString(LOC(), { month: 'numeric', day: 'numeric' }); }
  // 확인 창 (alert/confirm 대신 화면 안 확인 바)
  let delArm = 0;
  function confirmDel(c) { if (Date.now() - delArm < 4000) { delArm = 0; return true; } delArm = Date.now(); const pnl = document.getElementById('cw-panel'); const bar = document.createElement('div'); bar.className = 'cw-confirm'; bar.textContent = tx(c, 'delQ') + ' — 🗑'; pnl.appendChild(bar); setTimeout(() => bar.remove(), 4000); return false; }
  // 내 언어로 보여 줄 문장: 번역본이 있으면 번역본
  function shown(n, p, c) { const my = c.lang || 'ko'; if (n.lang === my) return n.text; return (n.tr && n.tr[my]) || n.text; }

  async function send(c, p, text) {
    text = String(text || '').trim(); if (!text || busy) return; busy = true;
    const btn = document.querySelector('.cw-send'); if (btn) btn.disabled = true;
    try {
      const myLang = c.lang || 'ko'; const tr = {};
      const targets = (p.group ? p.langs : [p.peerLang || 'ko']).filter((l) => l && l !== myLang).slice(0, 6);
      for (const to of targets) { try { tr[to] = (await Engine.translate(text, to, myLang)).text; } catch (e) { /* 번역 실패 시 원문만 */ } }
      if (myLang !== 'ko' && !tr.ko) { try { tr.ko = (await Engine.translate(text, 'ko', myLang)).text; } catch (e) { /* noop */ } }
      const teamId = (p.team && p.team.id) || (c.team && c.team.id) || '';
      Store.sendNotice({ userId: p.id, kind: 'chat', fromId: viewerKey, from: p.group ? 'group' : p.side === 'member' ? 'member' : (c.kind === 'leader' ? 'leader' : c.kind === 'org' ? 'org' : 'admin'), fromName: c.name, teamId, text, lang: myLang, tr });
      draft[cur] = '';
      try { await Store.Sync.flush(); } catch (e) { /* noop */ }
    } finally { busy = false; render(); }
  }

  // 새 메시지 알림음
  function ding() { try { const ac = new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(); const g = ac.createGain(); o.frequency.value = 660; g.gain.value = 0.05; o.connect(g); g.connect(ac.destination); o.start(); setTimeout(() => { o.stop(); ac.close(); }, 160); } catch (e) { /* noop */ } }
  function titleBadge(n) { try { const cur0 = document.title.replace(/^\(\d+\)\s*/, ''); document.title = (n ? '(' + n + ') ' : '') + cur0; } catch (e) { /* noop */ } }
  function checkNew() {
    const c = ctx(); if (!c) return;
    const ps = peers(c); let newest = 0;
    ps.forEach((p) => chats(p.id).forEach((n) => { if (!isMine(n, p) && !n.readAt && n.ts > newest) newest = n.ts; }));
    if (newest > lastSeen) { if (lastSeen) ding(); lastSeen = newest; }
    titleBadge(ps.reduce((a, p) => a + unreadOf(p), 0));
  }
  // 채팅창이 열려 있으면 2초마다 서버 확인 (실시간)
  function startPoll() {
    clearInterval(poll);
    poll = setInterval(async () => { if (!open || document.hidden) return; try { const n = await Store.Sync.pull(); if (n) { checkNew(); render(); } } catch (e) { /* noop */ } }, 2000);
  }
  window.addEventListener('lm-sync', () => { checkNew(); const ta = document.getElementById('cw-in'); const keep = ta && document.activeElement === ta; render(); if (keep) { const t2 = document.getElementById('cw-in'); if (t2) { t2.focus(); t2.selectionStart = t2.selectionEnd = t2.value.length; } } });
  window.addEventListener('hashchange', () => setTimeout(render, 50));
  window.addEventListener('storage', (e) => { if (e.key === 'lm_db_v1') setTimeout(() => { checkNew(); if (!document.activeElement || document.activeElement.id !== 'cw-in') render(); }, 50); });
  document.addEventListener('DOMContentLoaded', () => setTimeout(render, 300));
  setTimeout(() => { render(); checkNew(); }, 800);
  setInterval(() => { if (!document.getElementById('cw-btn') && ctx()) render(); }, 3000);
  window.LMChat = { render, open: (id) => { open = true; cur = id || null; render(); startPoll(); } };
})();
