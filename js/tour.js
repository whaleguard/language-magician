/* 상담매직 · Language Magician — 데모 투어 (ko / zh) */
(function () {
  'use strict';
  const L = document.documentElement.lang.startsWith('zh') ? 'zh' : 'ko';
  const BASE = window.TOUR_BASE || '';
  const APP = BASE + 'app.html';
  const IMG = (n) => (window.TOUR_IMG && window.TOUR_IMG[n]) || `assets/tour/${L}/${n}.jpg`;
  const PRINT = /[?&]print=1/.test(location.search) || window.TOUR_PRINT;
  const ACC = {
    member: { ko: '게스트로 바로 시작 (가입 없음)', zh: '游客直接开始（无需注册）' },
    admin: 'admin / 1234', personal: 'personal1 / 1234', business: 'business1 / 1234', company: 'company1 / 1234', leader: 'leader1 / 1234',
  };
  const T = {
    ko: {
      brand: '상담매직', toc: '목차', present: '발표 모드', start: '투어 시작', prev: '이전', next: '다음', try: '직접 해보기', open: '열기', role: '역할', account: '계정', contact: '도입 문의', back: '목차로',
      kicker: 'Language Magician · 제품 소개', title: '내 말로 쓰고,<br>상대의 언어로 답하세요.', lead: '카톡·위챗·LINE에서 받은 외국어를 붙여넣으면 번역·뉘앙스·답장 추천을 주고, 기업은 팀장·상담원의 다국어 상담과 근태까지 한 곳에서 관리합니다.',
      stats: [['5', '개 화면 언어'], ['8', '개 메신저'], ['6', '가지 말투별 답장'], ['5', '단계 관리자 권한']],
      progress: (i, n) => `${i} / ${n}`, chapters: ['① 개인용', '② 기업용', '③ 보안', '④ 요금·도입'],
    },
    zh: {
      brand: 'Language Magician', toc: '目录', present: '演示模式', start: '开始演示', prev: '上一步', next: '下一步', try: '亲自体验', open: '打开', role: '角色', account: '账号', contact: '咨询开通', back: '返回目录',
      kicker: 'Language Magician · 产品演示', title: '用自己的语言写，<br>用对方的语言回。', lead: '把在微信、KakaoTalk、LINE 收到的外语粘贴进来，即可获得翻译、语气分析和回复建议；企业还能在同一处管理组长与咨询员的多语言咨询和考勤。',
      stats: [['5', '种界面语言'], ['8', '款聊天软件'], ['6', '种语气回复'], ['5', '级管理权限']],
      progress: (i, n) => `${i} / ${n}`, chapters: ['① 个人版', '② 企业版', '③ 安全与审计', '④ 价格与开通'],
    },
  }[L];
  // 장면: id, ch(0~3), title, shots[[img, phone?]], caption, points, try{href, label, creds:[[역할, 계정]]}
  const S = {
    ko: [
      { id: 'personal-translate', ch: 0, title: '받은 말·보낼 말을 한 화면에서', shots: [['01-workspace']], cap: 'PC 작업 화면 — 왼쪽 메뉴 · 가운데 대화 · 오른쪽 대화 목록과 상대 정보', points: ['받은 말을 붙여넣으면 번역·뉘앙스·상황·지난 대화를 한 번에 정리', '📥 받은 말 넣기 / 📤 보낼 말 쓰기 버튼과 색으로 지금 무엇을 쓰는지 바로 구분', '내 언어(=내 화면 언어)와 상대 언어를 대화마다 바로 선택', '보낼 말은 상대 언어로 번역돼 자동 복사 → 원래 메신저에 붙여넣기'], try: { href: APP + '#/chat', creds: [['회원', ACC.member.ko]] } },
      { id: 'personal-tone', ch: 0, title: '말투별 답장 추천 6가지 · 나이대 말투', shots: [['02-replies']], cap: '기본 말투일 때: 정중·친근·애교·오빠/언니·연인·비즈니스 각 1개', points: ['상대마다 말투를 정해 두면 그 말투로 6가지, 기본이면 말투별로 1개씩', '상대 나이대에 맞춰 20대는 “좋아욤·ㅇㅇ”, 50대 이상은 줄임말 없이', '상대가 ㅇㅇ·ㅋㅋ·~욤을 쓰면 답장도 같은 말투로 맞춤', '“이걸로 답장”을 누르면 상대 언어로 바로 복사'], try: { href: APP + '#/chat', creds: [['회원', ACC.member.ko]] } },
      { id: 'personal-paste', ch: 0, title: '다른 사람 방에 잘못 붙여넣기 방지', shots: [['04-wrongroom']], cap: '다른 상대 이름 · 다른 상대 언어 · 다른 방에 있는 같은 문장을 감지', points: ['여러 명과 동시에 대화할 때 생기는 실수를 보내기 전에 막음', '[○○ 방으로 옮기기] 한 번이면 쓰던 글을 들고 그 방으로 이동', '대화 전체 검색: 이름·대화 내용으로 찾고 누르면 그 메시지로 이동'], try: { href: APP + '#/chat', creds: [['회원', ACC.member.ko]] } },
      { id: 'personal-popup', ch: 0, title: '대화마다 새 창으로 — 메신저 옆에 띄워 두기', shots: [['05-popup', 1], ['01-workspace']], cap: '상대마다 작은 창이 따로 열리고, 창끼리 자동 동기화', points: ['캡처가 막힌 메신저도 복사·붙여넣기로 바로 작업', '창 제목에 상대 이름이 떠서 여러 창을 쉽게 구분', '한 창에서 보내면 다른 창에도 즉시 반영'], try: { href: APP + '#/chat', creds: [['회원', ACC.member.ko]] } },
      { id: 'personal-relationship', ch: 0, title: '관계 분석 — 신호 · 단계 해석 · 피할 말', shots: [['07-relation']], cap: '대화로 본 단계와 그 근거, 상대의 신호, 다음 행동, 지금 피할 말', points: ['답장 속도·먼저 연락 비율·질문·호감 표현·만남 제안·“바쁘다” 반복 등을 추세로 분석', '“왜 지금 이 단계인지”를 근거와 함께 설명하고 추천 단계로 한 번에 변경', '연인·친구·가족·동료·고객 상담·언어 교환·이웃 등 8가지 관계 목표'], try: { href: APP + '#/coach', creds: [['회원', ACC.member.ko]] } },
      { id: 'personal-memory', ch: 0, title: '상대 정보 · 하루 기억 자동 정리', shots: [['06-sidepanel']], cap: '대화창 옆에서 상대 정보·관심도·지난 대화 기억·신호를 함께', points: ['대화 속 나이·생일·혈액형·MBTI·직업·사는 곳을 자동으로 채움', '하루 단위로 약속·좋아하는 것·고민을 기억해 다음 대화에 연결', '관심도 별점·상단 고정으로 수십 명도 관리'], try: { href: APP + '#/chat', creds: [['회원', ACC.member.ko]] } },
      { id: 'personal-schedule', ch: 0, title: '3시간마다 대화를 훑어 일정 자동 정리', shots: [['08-agenda']], cap: '할 일·약속을 달력에 자동 추가 (🤖 AI 자동 표시, 중복 방지)', points: ['같은 상대·같은 날짜·시간, 같은 원문 메시지는 중복으로 보고 추가하지 않음', '생일·기념일·약속 알림과 오늘 할 일을 한 화면에', '자동 정리 켜기/끄기, “지금 정리하기”'], try: { href: APP + '#/agenda', creds: [['회원', ACC.member.ko]] } },
      { id: 'personal-mobile', ch: 0, title: '모바일에서도 그대로', shots: [['10-mobile', 1], ['11-mobile-list', 1]], cap: '휴대폰 화면에 맞춘 대화·목록 · 5개 언어 화면', points: ['한국어·中文·日本語·Tiếng Việt·English 화면', '설치 없이 브라우저에서 바로, 홈 화면에 추가 가능'], try: { href: APP + '#/chat', creds: [['회원', ACC.member.ko]] } },
      { id: 'org-roles', ch: 1, title: '5단계 관리자 권한 구조', shots: [['31-roles']], cap: '최종 관리자 → 일반고객 관리자 / 기업고객 관리자 → 거래처 관리자 → 팀장 → 상담원', points: ['최종 관리자: 전체 운영·관리자 계정·거래처·설정', '일반고객 관리자: 개인 회원만 · 기업고객 관리자: 거래처와 상담원만', '거래처 관리자: 자기 회사 팀·팀장·상담원 · 팀장: 자기 팀만', '다른 회사 회원은 보이지 않고, 상담원은 서비스 ID로만 추가'], table: 1, try: { href: APP + '#/admin', creds: [['최종 관리자', ACC.admin], ['일반고객 관리자', ACC.personal], ['기업고객 관리자', ACC.business], ['거래처 관리자', ACC.company], ['팀장', ACC.leader]] } },
      { id: 'team-message', ch: 1, title: '한국어 지시가 상담원 언어로 도착', shots: [['21-inbox-banner'], ['22-inbox']], cap: '상담원 앱: 새 지시 배너 → 공지함에서 자기 언어로 읽고 답장', points: ['지시·공지·경고 / 답장 필요 / 마감 시간 지정', '팀 전체에 한 번에 보내도 각자 고른 언어로 번역', '답장해야 할 지시는 공지함 맨 위에 고정'], try: { href: APP + '#/admin/notices', creds: [['팀장', ACC.leader]] } },
      { id: 'team-reply', ch: 1, title: '읽음 확인 · 답장은 팀장 언어로', shots: [['23-notices']], cap: '✓ 전달 / ✓✓ 읽음 시각, 상담원 답장은 한국어 번역 + 원문', points: ['미열람 / 답장 대기 / 답장 완료로 걸러서 “누가 아직 답을 안 했는지” 바로 확인', '번역 실패 시 “원문으로 전달됨” 표시', '관리자가 회원에게 경고를 보낼 때도 같은 기능'], try: { href: APP + '#/admin/notices', creds: [['팀장', ACC.leader]] } },
      { id: 'team-dashboard', ch: 1, title: '팀 · 거래처 · 본사 대시보드', shots: [['20-leader-dash'], ['30-hq-dash']], cap: '권한마다 자기 범위만: 팀 현황 / 회사 현황 / 본사 전체 + 거래처별 현황', points: ['오늘 처리할 일, 최근 7일 추이(직전 주 비교), 신고·위험 검토', 'AI 비용(모델별·월말 예상), 기능 사용률, 요금제·예상 매출', '경고·위험 항목을 누르면 그 대화의 해당 메시지로 바로 이동'], try: { href: APP + '#/admin', creds: [['팀장', ACC.leader], ['최종 관리자', ACC.admin]] } },
      { id: 'team-attendance', ch: 1, title: '근태 — 접속·로그아웃·근무·대화 시간', shots: [['24-attendance']], cap: '상태(접속 중/무응답/자리 비움/로그아웃/미접속)와 0~24시 접속 타임라인', points: ['첫 접속·마지막 활동·로그아웃·접속 시간·실제 활동·대화 시간·처리 메시지', '무응답 기준(10/30/60분)을 넘긴 상담원과 답장 지연 건을 위에 모아 경고', '지연 건을 누르면 그 대화가 바로 열림'], try: { href: APP + '#/admin/attendance', creds: [['팀장', ACC.leader]] } },
      { id: 'team-attendance-month', ch: 1, title: '월별 근태', shots: [['27-att-month']], cap: '출근일 · 지각(09:30 이후) · 평균 출퇴근 · 총 접속/활동/대화 시간 · 일별 달력', points: ['상담원별 월 합계와 일별 접속 달력을 한 화면에', '이전·다음 달로 바로 이동'], try: { href: APP + '#/admin/attendance?d=month', creds: [['팀장', ACC.leader]] } },
      { id: 'team-att-calendar', ch: 1, title: '근태 달력 — 사람별 출퇴근이 한눈에', shots: [['64-att-cal']], cap: '상담원을 고르면 날짜마다 첫 접속~마지막 시각 · 접속 시간 · 지각 · 미접속 표시', points: ['전체로 보면 날마다 출근 인원 · 총 접속 · 지각 수', '날짜를 누르면 그날 상담원별 상세로 이동'], try: { href: APP + '#/admin/attendance?d=month', creds: [['팀장', ACC.leader]] } },
      { id: 'team-agents', ch: 1, title: '상담원 계정 · 자리 고정', shots: [['60-agents'], ['67-agent-login']], cap: '팀장·거래처가 상담원 아이디/비밀번호를 만들고, 상담원은 「계정 로그인」으로 들어옴', points: ['처음 로그인한 PC 한 자리에서만 열림 — 다른 PC는 차단', '자리 이동은 「자리 초기화」 → 기존 자리는 즉시 로그아웃', '상담원 수 제한 없음 · 접속 시각과 자리 정보 표시'], try: { href: APP + '#/admin/users', creds: [['팀장', ACC.leader]] } },
      { id: 'team-dup', ch: 1, title: '같은 고객을 여러 상담원이 상담하면 감지', shots: [['61-dup'], ['62-dup-badge']], cap: '1차: 같은 앱+닉네임 또는 같은 메시지 → 팀장이 프로필 사진을 비교해 판정', points: ['상담원 화면에 「○○도 이 고객 상담 중」 경고', '팀장: 「같은 고객 · 담당 지정」 또는 「다른 사람」 — 판정은 모든 PC에 즉시 반영', '중복 응대·고객 쟁탈을 오늘 처리할 일로 알림'], try: { href: APP + '#/admin/monitor?dup=1', creds: [['거래처 관리자', ACC.company]] } },
      { id: 'team-search', ch: 1, title: '대화 내용 검색', shots: [['63-search']], cap: '원문·번역·한국어 어디서든 검색 → 누르면 그 대화의 그 줄로 이동', points: ['권한 범위 안의 모든 상담원 대화를 한 번에', '누가·언제·어느 고객과 나눈 말인지 바로 확인'], try: { href: APP + '#/admin/monitor', creds: [['거래처 관리자', ACC.company]] } },
      { id: 'admin-mobile', ch: 1, title: '관리자 모바일 모드 — 운영 현황 한눈에', shots: [['12-admin-mobile', 1]], cap: '휴대폰으로 관리자 로그인 시 자동 전환', points: ['접속 중 · 무응답 · 답장 지연 · 미확인 답장 · 미처리 신고 타일', '상담원 실시간 상태 목록(초록/빨강/노랑), 누르면 대화·메시지로', '필요하면 “PC 화면”으로 전체 기능'], try: { href: APP + '#/admin', creds: [['팀장', ACC.leader]] } },
      { id: 'security-capture', ch: 2, title: '워터마크 · 캡처 차단 화면 · 기록', shots: [['40-watermark'], ['41-capture-block']], cap: '모든 화면에 사용자 ID·시각 워터마크, 캡처 키를 누르면 차단 화면', points: ['회원 화면: 닉네임·ID·시각 / 관리자 화면: 로그인한 관리자·시각', 'PrintScreen · Win+Shift+S · Cmd+Shift+3/4/5 감지 → “캡처가 금지되어 있습니다” + 감사로그 기록', '휴대폰 촬영은 막을 수 없지만 워터마크로 유출자 추적'], try: { href: APP + '#/chat', creds: [['회원', ACC.member.ko]] } },
      { id: 'security-browser', ch: 2, title: '우클릭 · 개발자도구 · 인쇄 제한', shots: [['41-capture-block']], cap: '브라우저에서 할 수 있는 보호를 기본 적용', points: ['오른쪽 클릭, F12·Ctrl+Shift+I/J/C, 소스 보기(Ctrl+U), 저장(Ctrl+S), 인쇄 차단', '이미지 끌어가기 차단', '운영 시에는 비공개 저장소·서버 배포로 소스 보호'], try: { href: APP + '#/chat', creds: [['회원', ACC.member.ko]] } },
      { id: 'security-audit', ch: 2, title: '열람 · 캡처 기록', shots: [['33-audit'], ['65-capture-log']], cap: '누가·언제·어떤 대화를·왜 열었는지, 캡처 시도와 메시지 발송까지 기록', points: ['기록은 수정·삭제 불가', '상담원의 캡처 시도는 그 회사 관리자·팀장·본사가 모두 확인 — 「🚫 캡처 시도」 필터', '최근 7일 캡처 시도는 현황의 오늘 처리할 일에 표시'], try: { href: APP + '#/admin/audit?act=capture', creds: [['거래처 관리자', ACC.company], ['팀장', ACC.leader]] } },
      { id: 'security-readonly', ch: 2, title: '직원 화면 보기 — 한국어로 (읽기 전용)', shots: [['28-viewas']], cap: '관리자가 상담원 앱을 그대로 확인 — 직원이 베트남어·중국어를 써도 화면·번역·추천 답장이 한국어로', points: ['문의 대응·품질 점검 때 직원이 보는 화면 그대로, 변경은 저장되지 않음', '대화 열람 표에도 한국어 열 제공', '열람은 감사로그에 남고 워터마크에 “관리자 열람” 표시'], try: { href: APP + '#/admin/users', creds: [['최종 관리자', ACC.admin]] } },
      { id: 'security-ai-key', ch: 2, title: '본사 AI — 키는 서버 금고에만', shots: [['35-hq-ai'], ['09-settings']], cap: '회원은 키를 넣지 않고 요금제로 본사 AI 사용, 사용량·금액은 회원별 집계', points: ['관리자가 넣은 키는 서버 DB 비공개 금고에만 저장 — 누구도 다시 읽을 수 없고 AI 서버만 사용', '설정(키 제외)은 모든 PC에 자동 배포', '무료 회원 AI 허용 여부, 거래처별 자체 키 허용 설정', '모델별 호출·토큰·예상 금액 대시보드'], try: { href: APP + '#/admin/settings', creds: [['최종 관리자', ACC.admin]] } },
      { id: 'cloud', ch: 3, title: '클라우드 DB — 어느 PC에서든 실시간', shots: [['66-cloud']], cap: '팀·거래처·상담원 계정·지시·신고·기록·자리 등록이 DB에 저장되고 6초 간격으로 모든 PC에 반영', points: ['다른 PC에서 만든 팀장·상담원 계정으로 바로 로그인', '회원도 아이디를 만들면 다른 기기에서 대화를 그대로 이어서', '실운영 모드: 데모를 빼고 DB의 실제 데이터만 표시'], try: { href: APP + '#/admin/settings', creds: [['최종 관리자', ACC.admin]] } },
      { id: 'pricing', ch: 3, title: '요금제', shots: [['50-pricing']], cap: '개인: 무료 0원 · 프로 5,900원 · 프리미엄 9,900원 / 기업용: 도입 문의', points: ['기업용: 상담원 수 제한 없음, 팀장·근태·지시 번역·감사로그 포함', '한 버전에서 요금제별로 기능을 여는 구조'], try: { href: BASE + 'index.html#plans' } },
      { id: 'onboarding', ch: 3, title: '도입 절차', shots: [['51-business']], cap: '거래처 생성 → 팀장 계정 → 상담원 계정(아이디·비밀번호) → 지시·근태 운영', points: ['1일차: 거래처·팀·팀장 계정 생성 (본사 기업고객 관리자)', '2일차: 팀장이 상담원 계정을 만들고, 상담원은 자기 자리 PC에서 「계정 로그인」', '운영: 근태·지시·감사로그로 관리, 본사 AI로 번역·분석'], try: { href: APP + '#/admin', creds: [['기업고객 관리자', ACC.business], ['거래처 관리자', ACC.company]] } },
    ],
    zh: [
      { id: 'personal-translate', ch: 0, title: '收到的话、要发的话，一个界面搞定', shots: [['01-workspace']], cap: '电脑工作界面 — 左侧菜单 · 中间对话 · 右侧对话列表与对方信息', points: ['粘贴收到的话，一次整理翻译、语气、情况和以前的对话', '📥 添加收到的话 / 📤 写要发的话 按钮和颜色，一眼区分', '每个对话都能直接选择我的语言（=界面语言）和对方语言', '要发的话翻译成对方语言并自动复制 → 粘贴到原来的聊天软件'], try: { href: APP + '?lang=zh#/chat', creds: [['会员', ACC.member.zh]] } },
      { id: 'personal-tone', ch: 0, title: '按语气推荐6条回复 · 适合年龄段的说法', shots: [['02-replies']], cap: '默认语气时：礼貌·亲切·撒娇·对哥哥姐姐·恋人·商务各1条', points: ['给对方设定语气后，6条都用该语气；默认则每种语气各1条', '按对方年龄段调整：年轻人用流行说法，年长者不用缩写', '对方用 ㅇㅇ·ㅋㅋ·~욤 等说法时，回复也跟着用', '点“用这条回复”即以对方语言复制'], try: { href: APP + '?lang=zh#/chat', creds: [['会员', ACC.member.zh]] } },
      { id: 'personal-paste', ch: 0, title: '防止贴错对话', shots: [['04-wrongroom']], cap: '检测其他人的名字 · 其他对象的语言 · 其他对话里已有的同一句话', points: ['同时和多人聊天时，发送前拦住常见失误', '点 [移到○○的对话] 就带着草稿过去', '全局搜索：按名字、内容查找，点击直接跳到那条消息'], try: { href: APP + '?lang=zh#/chat', creds: [['会员', ACC.member.zh]] } },
      { id: 'personal-popup', ch: 0, title: '每个对话单独开窗口，放在聊天软件旁', shots: [['05-popup', 1], ['01-workspace']], cap: '每个对象一个小窗口，窗口之间自动同步', points: ['即使聊天软件禁止截屏，也能复制粘贴直接处理', '窗口标题显示对方名字，多窗口一目了然', '一个窗口发送，其他窗口立即更新'], try: { href: APP + '?lang=zh#/chat', creds: [['会员', ACC.member.zh]] } },
      { id: 'personal-relationship', ch: 0, title: '关系分析 — 信号 · 阶段解读 · 要避免的话', shots: [['07-relation']], cap: '对话显示的阶段和依据、对方的信号、下一步、现在要避免的话', points: ['分析回复速度、主动联系比例、提问、好感表达、约见、“很忙”重复等趋势', '用依据说明“为什么是这个阶段”，可一键改成推荐阶段', '恋爱·朋友·家人·同事·客户咨询·语言交换·邻居等8种关系目标'], try: { href: APP + '?lang=zh#/coach', creds: [['会员', ACC.member.zh]] } },
      { id: 'personal-memory', ch: 0, title: '对方信息 · 每日记忆自动整理', shots: [['06-sidepanel']], cap: '在对话旁一起看对方信息、关注度、以前的对话记忆和信号', points: ['自动从对话中填写年龄、生日、血型、MBTI、职业、居住地', '按天记住约定、喜好、烦恼，连接到下次对话', '关注度星级、置顶，几十个人也能管理'], try: { href: APP + '?lang=zh#/chat', creds: [['会员', ACC.member.zh]] } },
      { id: 'personal-schedule', ch: 0, title: '每3小时扫描对话，自动整理日程', shots: [['08-agenda']], cap: '把待办和约定自动加入日历（🤖 AI 自动标记，防止重复）', points: ['同一对象、同一日期时间、同一条原消息视为重复，不再添加', '生日、纪念日、约定提醒和今日待办在同一界面', '可开关自动整理，或“现在整理”'], try: { href: APP + '?lang=zh#/agenda', creds: [['会员', ACC.member.zh]] } },
      { id: 'personal-mobile', ch: 0, title: '手机上同样好用', shots: [['10-mobile', 1], ['11-mobile-list', 1]], cap: '适配手机的对话和列表 · 5种界面语言', points: ['한국어 · 中文 · 日本語 · Tiếng Việt · English', '无需安装，浏览器直接使用，可添加到主屏幕'], try: { href: APP + '?lang=zh#/chat', creds: [['会员', ACC.member.zh]] } },
      { id: 'org-roles', ch: 1, title: '5级管理权限结构', shots: [['31-roles']], cap: '最终管理员 → 个人客户管理员 / 企业客户管理员 → 客户公司管理员 → 组长 → 咨询员', points: ['最终管理员：全部运营、管理员账号、客户公司、设置', '个人客户管理员只管个人会员 · 企业客户管理员只管客户公司和咨询员', '客户公司管理员：本公司的组、组长、咨询员 · 组长：只看本组', '看不到其他公司的会员，咨询员只能通过服务ID添加'], table: 1, try: { href: APP + '#/admin', creds: [['最终管理员', ACC.admin], ['个人客户管理员', ACC.personal], ['企业客户管理员', ACC.business], ['客户公司管理员', ACC.company], ['组长', ACC.leader]] } },
      { id: 'team-message', ch: 1, title: '韩语指示以咨询员的语言送达', shots: [['21-inbox-banner'], ['22-inbox']], cap: '咨询员应用：新指示横幅 → 在通知箱用自己的语言阅读并回复', points: ['指示 / 通知 / 警告，可设“需要回复”和截止时间', '一次发给全组，也会翻译成每个人选择的语言', '需要回复的指示固定在通知箱顶部'], try: { href: APP + '#/admin/notices', creds: [['组长', ACC.leader]] } },
      { id: 'team-reply', ch: 1, title: '已读确认 · 回复以组长的语言显示', shots: [['23-notices']], cap: '✓ 已送达 / ✓✓ 已读时间，咨询员回复显示韩语翻译 + 原文', points: ['按 未读 / 待回复 / 已回复 筛选，立刻知道“谁还没回”', '翻译失败时显示“已用原文送达”', '管理员给会员发警告也用同一功能'], try: { href: APP + '#/admin/notices', creds: [['组长', ACC.leader]] } },
      { id: 'team-dashboard', ch: 1, title: '团队 · 客户公司 · 总部看板', shots: [['20-leader-dash'], ['30-hq-dash']], cap: '每个权限只看自己的范围：团队 / 公司 / 总部全部 + 按客户公司', points: ['今日待办、近7天趋势（对比上周）、举报与风险审核', 'AI 费用（按模型、月底预计）、功能使用率、套餐与预计收入', '点击警告或风险项，直接打开那段对话的对应消息'], try: { href: APP + '#/admin', creds: [['组长', ACC.leader], ['最终管理员', ACC.admin]] } },
      { id: 'team-attendance', ch: 1, title: '考勤 — 登录·退出·在线·对话时间', shots: [['24-attendance']], cap: '状态（在线/无响应/离开/已退出/未登录）与 0~24 点在线时间轴', points: ['首次登录、最后活动、退出、在线时间、实际活动、对话时间、处理消息', '超过无响应标准（10/30/60分钟）的咨询员和回复延迟集中提醒', '点击延迟项，直接打开那段对话'], try: { href: APP + '#/admin/attendance', creds: [['组长', ACC.leader]] } },
      { id: 'team-attendance-month', ch: 1, title: '月度考勤', shots: [['27-att-month']], cap: '出勤天数 · 迟到（09:30后）· 平均上下班 · 总在线/活动/对话时间 · 每日日历', points: ['按咨询员的月合计和每日在线日历', '一键切换上月、下月'], try: { href: APP + '#/admin/attendance?d=month', creds: [['组长', ACC.leader]] } },
      { id: 'team-att-calendar', ch: 1, title: '考勤日历 — 每个人的上下班一目了然', shots: [['64-att-cal']], cap: '选择咨询员后，每天显示首次登录~最后时间 · 在线时长 · 迟到 · 未登录', points: ['查看全部时显示每天出勤人数 · 总在线 · 迟到人数', '点击日期查看当天每位咨询员详情'], try: { href: APP + '#/admin/attendance?d=month', creds: [['组长', ACC.leader]] } },
      { id: 'team-agents', ch: 1, title: '咨询员账号 · 固定座位', shots: [['60-agents'], ['67-agent-login']], cap: '组长或客户公司为咨询员创建账号和密码，咨询员通过「账号登录」进入', points: ['只能在首次登录的那台电脑使用 — 其他电脑会被拦截', '换座位时「重置座位」→ 原座位立即退出', '咨询员人数不限 · 显示登录时间和座位信息'], try: { href: APP + '#/admin/users', creds: [['组长', ACC.leader]] } },
      { id: 'team-dup', ch: 1, title: '多名咨询员接待同一客户时自动发现', shots: [['61-dup'], ['62-dup-badge']], cap: '第一步：同一应用+同一昵称或收到相同消息 → 组长对比头像后判定', points: ['咨询员画面显示「○○也在接待这位客户」', '组长选择「同一客户 · 指定负责人」或「不是同一人」，所有电脑立即生效', '重复接待、抢客户会出现在今日待办'], try: { href: APP + '#/admin/monitor?dup=1', creds: [['客户公司管理员', ACC.company]] } },
      { id: 'team-search', ch: 1, title: '对话内容搜索', shots: [['63-search']], cap: '原文、翻译、韩语都能搜 → 点击直接跳到那条对话', points: ['一次搜索权限范围内所有咨询员的对话', '马上看到是谁、何时、和哪位客户说的'], try: { href: APP + '#/admin/monitor', creds: [['客户公司管理员', ACC.company]] } },
      { id: 'admin-mobile', ch: 1, title: '管理员手机模式 — 运营一目了然', shots: [['12-admin-mobile', 1]], cap: '用手机登录管理员时自动切换', points: ['在线 · 无响应 · 回复延迟 · 未确认回复 · 未处理举报', '咨询员实时状态列表（绿/红/黄），点击进入对话或消息', '需要时切到“电脑界面”使用全部功能'], try: { href: APP + '#/admin', creds: [['组长', ACC.leader]] } },
      { id: 'security-capture', ch: 2, title: '水印 · 截屏拦截画面 · 记录', shots: [['40-watermark'], ['41-capture-block']], cap: '所有画面带用户ID和时间水印，按截屏键显示拦截画面', points: ['会员画面：昵称·ID·时间 / 管理员画面：登录管理员·时间', '检测 PrintScreen · Win+Shift+S · Cmd+Shift+3/4/5 → “禁止截屏” + 写入审计日志', '无法阻止手机拍摄，但可通过水印追踪泄露者'], try: { href: APP + '?lang=zh#/chat', creds: [['会员', ACC.member.zh]] } },
      { id: 'security-browser', ch: 2, title: '限制右键 · 开发者工具 · 打印', shots: [['41-capture-block']], cap: '默认启用浏览器能做到的保护', points: ['禁止右键、F12·Ctrl+Shift+I/J/C、查看源码（Ctrl+U）、保存（Ctrl+S）、打印', '禁止拖走图片', '正式运营时用私有仓库与服务器部署保护源码'], try: { href: APP + '?lang=zh#/chat', creds: [['会员', ACC.member.zh]] } },
      { id: 'security-audit', ch: 2, title: '查看与截屏记录', shots: [['33-audit'], ['65-capture-log']], cap: '记录谁、何时、打开了哪段对话、原因，以及截屏尝试和消息发送', points: ['日志不可修改或删除', '咨询员的截屏尝试，所在公司管理员、组长和总部都能看到 — 「🚫 截屏尝试」筛选', '最近7天的截屏尝试显示在看板的今日待办'], try: { href: APP + '#/admin/audit?act=capture', creds: [['客户公司管理员', ACC.company], ['组长', ACC.leader]] } },
      { id: 'security-readonly', ch: 2, title: '查看员工画面 — 以韩语显示（只读）', shots: [['28-viewas']], cap: '管理员直接查看咨询员应用 — 员工使用越南语、中文时，界面、翻译和推荐回复也以韩语显示', points: ['处理咨询、质量检查时看到员工看到的同样画面，修改不会保存', '对话查看表也提供韩语列', '查看会写入审计日志，水印显示“管理员查看”'], try: { href: APP + '#/admin/users', creds: [['最终管理员', ACC.admin]] } },
      { id: 'security-ai-key', ch: 2, title: '总部 AI — 密钥只在服务器保险库', shots: [['35-hq-ai'], ['09-settings']], cap: '会员不需输入密钥，按套餐使用总部 AI，用量和费用按会员统计', points: ['管理员输入的密钥只保存在服务器数据库的私密保险库 — 任何人都无法读回，只有 AI 服务器使用', '设置（不含密钥）自动下发到所有电脑', '可设置是否允许免费会员使用 AI、是否允许客户公司使用自己的密钥', '按模型统计调用、Token 和预计费用'], try: { href: APP + '#/admin/settings', creds: [['最终管理员', ACC.admin]] } },
      { id: 'cloud', ch: 3, title: '云端数据库 — 任何电脑实时同步', shots: [['66-cloud']], cap: '团队、客户公司、咨询员账号、指示、举报、记录、座位登记都保存在数据库，每6秒同步到所有电脑', points: ['在其他电脑创建的组长、咨询员账号可直接登录', '会员创建账号后，换设备也能继续之前的对话', '正式运营模式：去掉演示数据，只显示数据库中的真实数据'], try: { href: APP + '#/admin/settings', creds: [['最终管理员', ACC.admin]] } },
      { id: 'pricing', ch: 3, title: '价格', shots: [['50-pricing']], cap: '个人：免费 0韩元 · 专业版 5,900韩元 · 高级版 9,900韩元 / 企业版：咨询', points: ['企业版：咨询员人数不限，含组长、考勤、指示翻译、审计日志', '同一版本按套餐开放功能'], try: { href: BASE + 'index.html?lang=zh#plans' } },
      { id: 'onboarding', ch: 3, title: '开通流程', shots: [['51-business']], cap: '创建客户公司 → 组长账号 → 咨询员账号（账号·密码）→ 指示与考勤运营', points: ['第1天：创建客户公司、团队、组长账号（总部企业客户管理员）', '第2天：组长创建咨询员账号，咨询员在自己座位的电脑「账号登录」', '运营：用考勤、指示、审计日志管理，用总部 AI 翻译与分析'], try: { href: APP + '#/admin', creds: [['企业客户管理员', ACC.business], ['客户公司管理员', ACC.company]] } },
    ],
  }[L];
  const ROLE_TABLE = {
    ko: { head: ['기능', '최종 관리자', '일반고객 관리자', '기업고객 관리자', '거래처 관리자', '팀장'], rows: [['볼 수 있는 회원', '전체', '개인 회원', '거래처 상담원', '자기 회사', '자기 팀'], ['관리자 계정 만들기', '✓', '—', '—', '—', '—'], ['거래처·팀 관리', '✓', '—', '✓', '자기 회사 팀', '—'], ['대화 열람(감사로그)', '✓', '✓', '✓', '✓', '✓'], ['지시·경고 메시지', '✓', '✓', '✓', '✓', '✓'], ['근태', '✓', '—', '✓', '✓', '✓'], ['AI 키·운영 설정', '✓', '—', '—', '—', '—']] },
    zh: { head: ['功能', '最终管理员', '个人客户管理员', '企业客户管理员', '客户公司管理员', '组长'], rows: [['可见会员', '全部', '个人会员', '客户公司咨询员', '本公司', '本组'], ['创建管理员账号', '✓', '—', '—', '—', '—'], ['客户公司·团队管理', '✓', '—', '✓', '本公司团队', '—'], ['查看对话（审计日志）', '✓', '✓', '✓', '✓', '✓'], ['指示·警告消息', '✓', '✓', '✓', '✓', '✓'], ['考勤', '✓', '—', '✓', '✓', '✓'], ['AI 密钥·运营设置', '✓', '—', '—', '—', '—']] },
  }[L];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const other = L === 'zh' ? 'demo-tour.html' : 'demo-tour-zh.html';
  const root = document.getElementById('tour');
  root.innerHTML = `
    <header class="tour-top"><div class="tour-wrap tour-top-inner">
      <a class="tour-brand" href="${BASE}index.html${L === 'zh' ? '?lang=zh' : ''}"><img src="${(window.TOUR_IMG && window.TOUR_IMG.__logo) || 'assets/lm-mark.png'}" alt="LM">${esc(T.brand)}</a>
      <div class="tour-actions">
        <button class="tour-btn" type="button" data-go="contents">${esc(T.toc)}</button>
        <nav class="tour-langs" aria-label="language"><a class="tour-btn" href="${BASE}demo-tour.html" ${L === 'ko' ? 'aria-current="true"' : ''} data-lang>한국어</a><a class="tour-btn" href="${BASE}demo-tour-zh.html" ${L === 'zh' ? 'aria-current="true"' : ''} data-lang>简体中文</a></nav>
        <button class="tour-btn" type="button" id="tour-present" aria-pressed="false">${esc(T.present)}</button>
      </div></div></header>
    <main class="tour-wrap tour-main">
      <section id="cover" class="tour-cover">
        <p class="tour-kicker">${esc(T.kicker)}</p><h1>${T.title}</h1><p>${esc(T.lead)}</p>
        <div class="tour-cover-stats">${T.stats.map(([n, l]) => `<span><b>${n}</b>${esc(l)}</span>`).join('')}</div>
        <div class="tour-actions"><button class="tour-btn tour-btn--primary" type="button" data-go="${S[0].id}">${esc(T.start)} →</button><button class="tour-btn" type="button" data-go="contents">${esc(T.toc)}</button></div>
      </section>
      <section id="contents" class="tour-toc" hidden><h2>${esc(T.toc)}</h2><div class="tour-toc-grid">${T.chapters.map((ch, ci) => `<section class="tour-chapter"><h3>${esc(ch)}</h3><ol>${S.filter((s) => s.ch === ci).map((s) => `<li><a href="#${s.id}" data-go="${s.id}">${esc(s.title)}</a></li>`).join('')}</ol></section>`).join('')}</div></section>
      ${S.map((s) => `<section id="${s.id}" class="tour-scene" hidden>
        <header class="tour-scene-head"><p class="tour-kicker">${esc(T.chapters[s.ch])}</p><h2 tabindex="-1">${esc(s.title)}</h2></header>
        <div class="tour-layout">
          <figure class="tour-visual"><div class="tour-shots" data-layout="${s.shots.length > 1 ? 'pair' : 'single'}">${s.shots.map(([n, ph]) => `<div class="tour-shot" ${ph ? 'data-format="phone"' : ''}><img src="${IMG(n)}" alt="${esc(s.title)}" loading="lazy"></div>`).join('')}</div>
            <figcaption class="tour-caption">${esc(s.cap)}</figcaption>
            ${s.table ? `<div class="tour-table-wrap"><table class="tour-table"><thead><tr>${ROLE_TABLE.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${ROLE_TABLE.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}</figure>
          <aside class="tour-copy"><h3>${esc(s.title)}</h3><ul class="tour-points">${s.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
            <section class="tour-try"><h3>${esc(T.try)}</h3>${s.try.creds ? `<dl class="tour-credentials">${s.try.creds.map(([r, a]) => `<dt>${esc(r)}</dt><dd>${esc(a)}</dd>`).join('')}</dl>` : ''}
              <div class="tour-actions"><a class="tour-btn tour-btn--primary" href="${s.try.href}" target="_blank" rel="noopener">${esc(T.try)} ↗</a></div></section></aside>
        </div></section>`).join('')}
    </main>
    <footer class="tour-footer"><div class="tour-wrap tour-footer-inner">
      <div class="tour-progress"><div class="tour-progress-label tour-muted"><span id="tour-ch"></span><span id="tour-count"></span></div><progress id="tour-prog" max="${S.length}" value="0" aria-label="progress"></progress></div>
      <div class="tour-actions"><button class="tour-btn" type="button" id="tour-prev">← ${esc(T.prev)}</button><button class="tour-btn tour-btn--primary" type="button" id="tour-next">${esc(T.next)} →</button></div>
    </div></footer>
    <p class="tour-sr" role="status" id="tour-sr"></p>`;
  const ids = ['cover', 'contents'].concat(S.map((s) => s.id));
  let cur = 'cover';
  function show(id, push) {
    if (!ids.includes(id)) id = 'cover';
    cur = id;
    ids.forEach((x) => { const el = document.getElementById(x); if (el) el.hidden = x !== id; });
    const i = S.findIndex((s) => s.id === id);
    document.getElementById('tour-prog').value = i >= 0 ? i + 1 : 0;
    document.getElementById('tour-count').textContent = i >= 0 ? T.progress(i + 1, S.length) : '';
    document.getElementById('tour-ch').textContent = i >= 0 ? T.chapters[S[i].ch] : '';
    document.getElementById('tour-prev').disabled = id === 'cover';
    const nx = document.getElementById('tour-next');
    nx.textContent = i === S.length - 1 ? T.back : (id === 'cover' || id === 'contents' ? T.start + ' →' : T.next + ' →');
    document.querySelectorAll('.tour-chapter a').forEach((a) => a.setAttribute('aria-current', a.dataset.go === id ? 'step' : 'false'));
    document.querySelectorAll('[data-lang]').forEach((a) => { a.href = a.getAttribute('href').split('#')[0] + '#' + id; });
    if (push !== false) history.replaceState(null, '', '#' + id);
    const h = document.querySelector(`#${id} h2, #${id} h1`); if (h && i >= 0) h.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    document.getElementById('tour-sr').textContent = i >= 0 ? S[i].title : '';
  }
  const step = (d) => {
    const i = S.findIndex((s) => s.id === cur);
    if (d > 0) { if (cur === 'cover' || cur === 'contents') return show(S[0].id); if (i === S.length - 1) return show('contents'); return show(S[i + 1].id); }
    if (i === 0) return show('cover'); if (i > 0) return show(S[i - 1].id); if (cur === 'contents') return show('cover');
  };
  document.addEventListener('click', (e) => {
    const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); show(g.dataset.go); return; }
    const im = e.target.closest('.tour-shot img'); if (im) { const z = document.createElement('div'); z.className = 'tour-zoom'; z.innerHTML = `<img src="${im.src}" alt="">`; z.addEventListener('click', () => z.remove()); root.appendChild(z); }
  });
  document.getElementById('tour-next').addEventListener('click', () => step(1));
  document.getElementById('tour-prev').addEventListener('click', () => step(-1));
  document.getElementById('tour-present').addEventListener('click', (e) => { const on = root.dataset.mode !== 'present'; root.dataset.mode = on ? 'present' : 'read'; e.currentTarget.setAttribute('aria-pressed', String(on)); if (on && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {}); else if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); });
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, select, textarea')) return;
    const z = root.querySelector('.tour-zoom'); if (z) { if (e.key === 'Escape') z.remove(); return; }
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); step(-1); }
    else if (e.key === 'Escape' && root.dataset.mode === 'present') document.getElementById('tour-present').click();
  });
  window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (h && h !== cur) show(h, false); });
  if (PRINT) { root.classList.add('tour-print'); ids.forEach((x) => { const el = document.getElementById(x); if (el) el.hidden = x === 'contents' && false; }); document.querySelectorAll('img[loading]').forEach((i) => i.removeAttribute('loading')); return; }
  show((location.hash || '#cover').slice(1), false);
})();
