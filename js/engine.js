/* 언어의 마술사 — 번역·분석 엔진
 * 1) 번역: 사용자가 AI 키를 넣으면 LLM(Claude/OpenAI), 없으면 MyMemory 무료 번역 API
 * 2) 분석: 날짜·시간·장소 추출, 의도 분류, 말투·성향·상황, 지난 대화 연결, 대화 깊이 점수
 */
(function (global) {
  'use strict';

  const LANGS = {
    ko: { name: '한국어', mm: 'ko-KR', llm: 'Korean' },
    zh: { name: '简体中文', mm: 'zh-CN', llm: 'Simplified Chinese' },
    ja: { name: '日本語', mm: 'ja-JP', llm: 'Japanese' },
    vi: { name: 'Tiếng Việt', mm: 'vi-VN', llm: 'Vietnamese' },
    en: { name: 'English', mm: 'en-GB', llm: 'English' },
    th: { name: 'ไทย', mm: 'th-TH', llm: 'Thai' },
    id: { name: 'Bahasa Indonesia', mm: 'id-ID', llm: 'Indonesian' },
    es: { name: 'Español', mm: 'es-ES', llm: 'Spanish' },
    ru: { name: 'Русский', mm: 'ru-RU', llm: 'Russian' },
    'zh-TW': { name: '繁體中文', mm: 'zh-TW', llm: 'Traditional Chinese' },
    fr: { name: 'Français', mm: 'fr-FR', llm: 'French' },
    de: { name: 'Deutsch', mm: 'de-DE', llm: 'German' },
    pt: { name: 'Português', mm: 'pt-PT', llm: 'Portuguese' },
    mn: { name: 'Монгол', mm: 'mn-MN', llm: 'Mongolian' },
    uz: { name: 'Oʻzbek', mm: 'uz-UZ', llm: 'Uzbek' },
    ne: { name: 'नेपाली', mm: 'ne-NP', llm: 'Nepali' },
    tl: { name: 'Filipino', mm: 'tl-PH', llm: 'Filipino' },
    hi: { name: 'हिन्दी', mm: 'hi-IN', llm: 'Hindi' },
    ar: { name: 'العربية', mm: 'ar-SA', llm: 'Arabic' },
  };

  /* ---------------- 언어 감지 ---------------- */
  function detect(text) {
    const s = String(text || '');
    if (/[가-힣]/.test(s)) return 'ko';
    if (/[぀-ヿ]/.test(s)) return 'ja';
    if (/[一-鿿]/.test(s)) {
      // 번체 특유 글자 비율
      const trad = (s.match(/[們這個說來時會對學國們還麼樣點們見體為與從開關車門長問錢]/g) || []).length;
      return trad >= 2 ? 'zh-TW' : 'zh';
    }
    if (/[฀-๿]/.test(s)) return 'th';
    if (/[؀-ۿ]/.test(s)) return 'ar';
    if (/[ऀ-ॿ]/.test(s)) return /[ऩ]|छ|हरु|हरू/.test(s) ? 'ne' : 'hi';
    if (/[Ѐ-ӿ]/.test(s)) return /[өү]/i.test(s) ? 'mn' : 'ru';
    if (/[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i.test(s)) return 'vi';
    if (/\b(saya|kamu|tidak|terima kasih|apa|bisa|ya)\b/i.test(s)) return 'id';
    if (/\b(hola|gracias|qué|cómo|mañana|por favor)\b/i.test(s)) return 'es';
    if (/\b(ako|ikaw|salamat|po|kumusta)\b/i.test(s)) return 'tl';
    return 'en';
  }

  /* ---------------- 번역 ---------------- */
  const CACHE_KEY = 'lm_tcache_v1';
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch (e) { cache = {}; }
  function saveCache() {
    try {
      const keys = Object.keys(cache);
      if (keys.length > 1500) keys.slice(0, keys.length - 1500).forEach((k) => delete cache[k]);
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) { /* 저장 공간 부족 시 무시 */ }
  }

  /* ---------- 대화에서 상대 정보 자동 추출 ----------
     상대가 보낸 메시지에서 본인 소개(나이·생일·혈액형·MBTI·성별·직업·사는 곳)를 찾습니다. */
  const MONTHS_EN = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  function extractProfile(text) {
    const s = String(text || '');
    const out = {};
    const nowY = new Date().getFullYear();
    const num = (v) => parseInt(v, 10);
    let m;
    // 나이
    if ((m = s.match(/(?:나이는?|저는|전|난|나는)?\s*(\d{2})\s*(?:살|세)(?:이에요|예요|이야|야|입니다|이고|인데|요)?/)) && num(m[1]) >= 15 && num(m[1]) <= 80) out.age = num(m[1]);
    else if ((m = s.match(/(\d{2})\s*岁/)) && num(m[1]) >= 15 && num(m[1]) <= 80) out.age = num(m[1]);
    else if ((m = s.match(/(\d{2})\s*(?:歳|才)/)) && num(m[1]) >= 15 && num(m[1]) <= 80) out.age = num(m[1]);
    else if ((m = s.match(/(\d{2})\s*tuổi/i)) && num(m[1]) >= 15 && num(m[1]) <= 80) out.age = num(m[1]);
    else if ((m = s.match(/\b(?:I'?m|I am|age(?:d)?)\s*(\d{2})\b(?!\s*(?:min|hour|%|km|kg|cm))/i) || s.match(/\b(\d{2})\s*(?:years? old|yo)\b/i)) && num(m[1]) >= 15 && num(m[1]) <= 80) out.age = num(m[1]);
    // 출생 연도 (XX년생 / 1998年出生 / born in 1998 / 98年生まれ)
    if ((m = s.match(/((?:19|20)?\d{2})\s*년생/) || s.match(/((?:19|20)\d{2})\s*年(?:出生|生まれ|生)/) || s.match(/born in\s*((?:19|20)\d{2})/i) || s.match(/sinh năm\s*((?:19|20)\d{2})/i))) {
      let y = num(m[1]); if (y < 100) y += y > (nowY % 100) ? 1900 : 2000;
      if (y > 1940 && y <= nowY - 14) { out.birthYear = y; if (!out.age) out.age = nowY - y; }
    }
    // 생일
    const md = (mo, d) => { mo = num(mo); d = num(d); return mo >= 1 && mo <= 12 && d >= 1 && d <= 31 ? String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0') : null; };
    if ((m = s.match(/생일(?:은|이|이에요|는)?\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/)) || (m = s.match(/生日(?:是|在)?\s*(\d{1,2})\s*月\s*(\d{1,2})\s*[日号號]/)) || (m = s.match(/誕生日(?:は)?\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/)) || (m = s.match(/sinh nhật[^\d]{0,20}(?:ngày\s*)?(\d{1,2})\s*(?:\/|tháng)\s*(\d{1,2})/i))) {
      const v = /sinh nhật/i.test(m[0]) ? md(m[2], m[1]) : md(m[1], m[2]); if (v) out.birthMD = v;
    } else if ((m = s.match(/birthday(?: is)?(?: on)?\s*([A-Za-z]{3,9})\s*(\d{1,2})/i)) && MONTHS_EN[m[1].slice(0, 3).toLowerCase()]) out.birthMD = md(MONTHS_EN[m[1].slice(0, 3).toLowerCase()], m[2]);
    else if ((m = s.match(/birthday(?: is)?(?: on)?(?: the)?\s*(\d{1,2})(?:st|nd|rd|th)?\s*(?:of\s*)?([A-Za-z]{3,9})/i)) && MONTHS_EN[m[2].slice(0, 3).toLowerCase()]) out.birthMD = md(MONTHS_EN[m[2].slice(0, 3).toLowerCase()], m[1]);
    // 혈액형
    if ((m = s.match(/(AB|A|B|O)\s*형(?!태|식)/) || s.match(/(AB|A|B|O)\s*型/) || s.match(/nhóm máu\s*(AB|A|B|O)\b/i) || s.match(/blood(?: type)?(?: is)?\s*(AB|A|B|O)\b/i) || s.match(/\btype\s*(AB|A|B|O)\s*blood/i))) out.blood = m[1].toUpperCase();
    // MBTI (대문자 4글자 또는 'mbti' 언급과 함께)
    if ((m = s.match(/\b([EI][NS][TF][JP])\b/)) || (m = s.match(/mbti[^a-z]{0,8}([ei][ns][tf][jp])/i))) out.mbti = m[1].toUpperCase();
    // 성별 (본인 소개일 때만)
    if (/(?:저는|전|난|나는)\s*(?:여자|여성)|我是(?:女生|女孩|女的)|私は女|(?:I'?m|I am) a (?:girl|woman|female)|mình là (?:con gái|nữ)/i.test(s)) out.gender = 'f';
    else if (/(?:저는|전|난|나는)\s*(?:남자|남성)|我是(?:男生|男孩|男的)|私は男|(?:I'?m|I am) a (?:guy|boy|man|male)|mình là (?:con trai|nam)/i.test(s)) out.gender = 'm';
    // 직업
    const JOB = '(학생|대학생|대학원생|회사원|직장인|간호사|의사|선생님|교사|디자이너|개발자|프로그래머|엔지니어|요리사|모델|공무원|자영업|사업가|유학생|老师|学生|大学生|研究生|护士|医生|设计师|程序员|工程师|上班族|公务员|厨师|模特|留学生|学生です|会社員|看護師|医者|先生|教師|デザイナー|エンジニア|公務員|大学生|留学生|sinh viên|giáo viên|y tá|bác sĩ|kỹ sư|nhà thiết kế|lập trình viên|nhân viên văn phòng|du học sinh|student|teacher|nurse|doctor|designer|developer|engineer|programmer|chef|model)';
    if ((m = s.match(new RegExp('(?:저는|전|직업은|직업이)\\s*' + JOB)) || s.match(new RegExp('(?:我|，|,|^)\\s*是(?:一[名个位])?' + JOB)) || s.match(new RegExp(JOB + '(?:로|으로)\\s*일')) || s.match(new RegExp('(?:私は|仕事は)\\s*' + JOB)) || s.match(new RegExp('(?:mình là|tôi là|em là|anh là|, là|^là)\\s*' + JOB, 'i')) || s.match(new RegExp("(?:I'?m an?|I am an?|I work as an?)\\s*" + JOB, 'i')))) out.job = m[1].replace(/です$/, '');
    // 사는 곳
    if ((m = s.match(/([가-힣A-Za-z]{2,10})(?:에|에서)\s*살(?:아요|고 있어요|고 있|아|고요|아요\.|아\.)/)) || (m = s.match(/我(?:住在|在)([一-龥]{2,8}?)(?:住|生活|工作|上学|呢|，|。|$)/)) || (m = s.match(/([一-鿿゠-ヿA-Za-z]{2,10})に住んで/)) || (m = s.match(/(?:sống ở|ở)\s+([A-ZĐ][\wÀ-ỹ]+(?:\s[A-ZĐ][\wÀ-ỹ]+)?)/)) || (m = s.match(/\bI live in\s+([A-Z][A-Za-z]+(?:\s[A-Z][A-Za-z]+)?)/))) out.city = m[1];
    return out;
  }

  function aiConfig() {
    try { return JSON.parse(localStorage.getItem('lm_ai') || '{}'); } catch (e) { return {}; }
  }

  async function callLLM(system, user, wantJson) {
    const cfg = aiConfig();
    if (!cfg.key) throw new Error('no-key');
    if (cfg.provider === 'openai') {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + cfg.key },
        body: JSON.stringify({
          model: cfg.model || 'gpt-4o-mini',
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
          response_format: wantJson ? { type: 'json_object' } : undefined,
          temperature: 0.3,
        }),
      });
      if (!r.ok) throw new Error('llm-' + r.status);
      const j = await r.json();
      return j.choices[0].message.content;
    }
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': cfg.key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: cfg.model || 'claude-haiku-5-5',
        max_tokens: 2000,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });
    if (!r.ok) throw new Error('llm-' + r.status);
    const j = await r.json();
    return (j.content || []).map((c) => c.text || '').join('');
  }

  function extractJson(txt) {
    const m = String(txt).match(/\{[\s\S]*\}/);
    if (!m) throw new Error('no-json');
    return JSON.parse(m[0]);
  }

  // 문장 단위로 나눠 MyMemory(500자 제한)에 보냄
  function chunks(text, max) {
    const out = [];
    let cur = '';
    String(text).split(/(?<=[.!?。！？\n])/).forEach((part) => {
      if ((cur + part).length > max && cur) { out.push(cur); cur = ''; }
      cur += part;
    });
    if (cur) out.push(cur);
    return out.flatMap((c) => (c.length > max ? c.match(new RegExp('[\\s\\S]{1,' + max + '}', 'g')) : [c]));
  }

  async function mymemory(text, from, to) {
    const parts = chunks(text, 450);
    const res = [];
    for (const p of parts) {
      if (!p.trim()) { res.push(p); continue; }
      const url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(p)
        + '&langpair=' + encodeURIComponent((LANGS[from] || {}).mm || from) + '|' + encodeURIComponent((LANGS[to] || {}).mm || to)
        + '&de=help%40languagemagician.app';
      const r = await fetch(url);
      if (!r.ok) throw new Error('mt-' + r.status);
      const j = await r.json();
      let t = (j.responseData && j.responseData.translatedText) || '';
      if (/MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID LANGUAGE PAIR/i.test(t)) throw new Error('mt-limit');
      // 번역 메모리 후보 중 일치도가 높은 것을 우선
      if (Array.isArray(j.matches)) {
        const best = j.matches.filter((m) => m.translation && Number(m.match) >= 0.98 && m.quality && Number(m.quality) >= 70)[0];
        if (best && best.translation.length < p.length * 4) t = best.translation;
      }
      res.push(decodeEntities(t));
    }
    return res.join(' ').replace(/\s+([,.!?。，！？])/g, '$1').trim();
  }

  function decodeEntities(s) {
    const el = document.createElement('textarea');
    el.innerHTML = s;
    return el.value;
  }

  /**
   * 번역
   * @returns {Promise<{text:string, provider:string, from:string}>}
   */
  async function translate(text, to, from, ctx) {
    text = String(text || '').trim();
    if (!text) return { text: '', provider: 'none', from: from || to };
    from = from || detect(text);
    if (from === to) return { text, provider: 'same', from };
    const key = from + '|' + to + '|' + (ctx && ctx.tone ? ctx.tone : '') + '|' + text;
    if (cache[key]) return { text: cache[key], provider: 'cache', from };
    const cfg = aiConfig();
    let out = null, provider = '';
    if (cfg.key) {
      try {
        const sys = 'You are a professional chat translator for friends talking across languages. Translate naturally, keeping names, numbers, dates, places and negations exact. Keep emoji. Match the requested tone. Output only the translation.';
        const tone = ctx && ctx.tone ? ' Tone: ' + ctx.tone + '.' : '';
        const rel = ctx && ctx.relation ? ' Relationship: ' + ctx.relation + '.' : '';
        out = (await callLLM(sys, 'Translate from ' + (LANGS[from] || {}).llm + ' to ' + (LANGS[to] || {}).llm + '.' + tone + rel + '\n\n' + text, false)).trim();
        provider = 'ai';
      } catch (e) { out = null; }
    }
    if (!out) {
      out = await mymemory(text, from, to);
      provider = 'mt';
    }
    cache[key] = out;
    saveCache();
    return { text: out, provider, from };
  }

  /* ---------------- 날짜·시간·장소 추출 ---------------- */
  const CN_NUM = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 兩: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
  const KO_NUM = { 한: 1, 두: 2, 세: 3, 네: 4, 다섯: 5, 여섯: 6, 일곱: 7, 여덟: 8, 아홉: 9, 열: 10, 열한: 11, 열두: 12 };
  function cnToNum(s) {
    if (/^\d+$/.test(s)) return Number(s);
    if (s.length === 1) return CN_NUM[s];
    if (s[0] === '十') return 10 + (CN_NUM[s[1]] || 0);
    if (s[1] === '十') return CN_NUM[s[0]] * 10 + (CN_NUM[s[2]] || 0);
    return null;
  }

  const WEEKDAYS = [
    { re: /(일요일|日曜|周日|周天|星期日|星期天|礼拜天|禮拜天|sunday|chủ nhật)/i, d: 0 },
    { re: /(월요일|月曜|周一|星期一|礼拜一|monday|thứ hai)/i, d: 1 },
    { re: /(화요일|火曜|周二|星期二|礼拜二|tuesday|thứ ba)/i, d: 2 },
    { re: /(수요일|水曜|周三|星期三|礼拜三|wednesday|thứ tư)/i, d: 3 },
    { re: /(목요일|木曜|周四|星期四|礼拜四|thursday|thứ năm)/i, d: 4 },
    { re: /(금요일|金曜|周五|星期五|礼拜五|friday|thứ sáu)/i, d: 5 },
    { re: /(토요일|土曜|周六|星期六|礼拜六|saturday|thứ bảy|thứ 7)/i, d: 6 },
  ];

  function extractWhen(text, now) {
    now = now || new Date();
    const s = String(text);
    let date = null, time = null, found = false;
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 상대 날짜
    if (/(모레|后天|後天|明後日|あさって|ngày kia)/i.test(s)) { date = addDays(base, 2); found = true; }
    else if (/(내일|明天|明日|あした|tomorrow|ngày mai)/i.test(s)) { date = addDays(base, 1); found = true; }
    else if (/(오늘|今天|今日|きょう|today|tonight|hôm nay|tối nay|오늘밤|今晚)/i.test(s)) { date = base; found = true; }

    // 요일 (다음 주 포함)
    const nextWeek = /(다음\s?주|下周|下星期|来週|next week|tuần sau)/i.test(s);
    for (const w of WEEKDAYS) {
      if (w.re.test(s)) {
        let diff = (w.d - base.getDay() + 7) % 7;
        if (diff === 0 && !/(오늘|今天|今日|today)/i.test(s)) diff = 7;
        if (nextWeek && diff < 7) diff += 7;
        date = addDays(base, diff);
        found = true;
        break;
      }
    }

    // 명시 날짜
    let m = s.match(/(\d{1,2})\s?월\s?(\d{1,2})\s?일/) || s.match(/(\d{1,2})\s?月\s?(\d{1,2})\s?[日号號]/)
      || s.match(/ngày\s?(\d{1,2})\s?tháng\s?(\d{1,2})/i);
    if (m) {
      let mo = Number(m[1]), da = Number(m[2]);
      if (/ngày/i.test(m[0])) { da = Number(m[1]); mo = Number(m[2]); }
      date = new Date(now.getFullYear(), mo - 1, da);
      if (date < addDays(base, -30)) date.setFullYear(date.getFullYear() + 1);
      found = true;
    } else if ((m = s.match(/\b(\d{1,2})\/(\d{1,2})\b/))) {
      date = new Date(now.getFullYear(), Number(m[1]) - 1, Number(m[2]));
      found = true;
    } else if ((m = s.match(/(\d{1,2})\s?일(?!\s?(동안|간))/)) && !date && /[0-9]\s?일\s?(에|날)/.test(s)) {
      date = new Date(now.getFullYear(), now.getMonth(), Number(m[1]));
      if (date < base) date.setMonth(date.getMonth() + 1);
      found = true;
    }

    // 시간
    let h = null, mi = 0, pm = null;
    if ((m = s.match(/(오전|오후|아침|저녁|밤|낮)?\s?(\d{1,2}|한|두|세|네|다섯|여섯|일곱|여덟|아홉|열한|열두|열)\s?시\s?(반|(\d{1,2})\s?분)?/))) {
      h = /^\d+$/.test(m[2]) ? Number(m[2]) : KO_NUM[m[2]];
      mi = m[3] === '반' ? 30 : Number(m[4] || 0);
      pm = m[1] ? /(오후|저녁|밤)/.test(m[1]) : null;
      if (m[1] === '낮' && h < 7) pm = true;
    } else if ((m = s.match(/(上午|早上|中午|下午|晚上|傍晚|夜里)?\s?(\d{1,2}|[一二两三四五六七八九十]{1,3})\s?[点點](半|(\d{1,2})\s?分?)?/))) {
      h = cnToNum(m[2]);
      mi = m[3] === '半' ? 30 : Number(m[4] || 0);
      pm = m[1] ? /(下午|晚上|傍晚|夜里)/.test(m[1]) || (m[1] === '中午' && h < 5) : null;
    } else if ((m = s.match(/(午前|午後|朝|夜|夕方)?\s?(\d{1,2})\s?時(半|(\d{1,2})\s?分)?/))) {
      h = Number(m[2]);
      mi = m[3] === '半' ? 30 : Number(m[4] || 0);
      pm = m[1] ? /(午後|夜|夕方)/.test(m[1]) : null;
    } else if ((m = s.match(/(\d{1,2})\s?giờ\s?(rưỡi|(\d{1,2})\s?(phút)?)?\s?(sáng|trưa|chiều|tối|đêm)?/i))) {
      h = Number(m[1]);
      mi = m[2] && /rưỡi/i.test(m[2]) ? 30 : Number(m[3] || 0);
      pm = m[5] ? /(chiều|tối|đêm)/i.test(m[5]) : null;
    } else if ((m = s.match(/\b(\d{1,2})(?::(\d{2}))?\s?(am|pm|a\.m\.|p\.m\.)\b/i))) {
      h = Number(m[1]); mi = Number(m[2] || 0); pm = /p/i.test(m[3]);
    } else if ((m = s.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/))) {
      h = Number(m[1]); mi = Number(m[2]);
    }
    if (h !== null && h !== undefined && !Number.isNaN(h)) {
      if (pm === true && h < 12) h += 12;
      if (pm === false && h === 12) h = 0;
      if (pm === null && h >= 1 && h <= 7) h += 12; // 약속에서 "4시"는 보통 오후
      time = String(h).padStart(2, '0') + ':' + String(mi).padStart(2, '0');
      found = true;
      if (!date) date = base;
    }

    return found ? { date: date ? ymd(date) : null, time } : null;
  }

  function extractPlace(text) {
    const s = String(text);
    let m;
    const pats = [
      /([가-힣A-Za-z0-9]+역\s?\d+\s?번\s?출구)/,
      /([가-힣A-Za-z0-9]+(?:역|카페|식당|공원|백화점|호텔|학교|병원|공항|터미널|광장|극장|마트|센터))(?:\s?(?:에서|앞|근처))?/,
      /在\s?([一-鿿A-Za-z0-9 ]{2,14}?)(?:见|見|碰面|等|集合|吃)/,
      /([一-鿿A-Za-z0-9]{1,10}(?:站|地铁站|咖啡厅|餐厅|公园|商场|酒店|机场)(?:[一二三四五六七八九十\d]+号出口)?)/,
      /([゠-ヿ一-鿿A-Za-z0-9]{1,10}(?:駅|カフェ|公園|レストラン|ホテル|空港)(?:\d+番出口)?)/,
      /(?:ở|tại)\s([A-ZÀ-Ỹa-zà-ỹ0-9 ]{2,30}?)(?=[,.!?]|$| nhé| nha| lúc)/i,
      /\bat\s([A-Z][\w'’]+(?:\s[A-Z][\w'’]+){0,3})/,
    ];
    for (const p of pats) { if ((m = s.match(p))) return m[1].trim(); }
    return null;
  }

  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  /* ---------------- 의도·감정 ---------------- */
  const RX = {
    question: /[?？]|까요|나요|니까|어요\?|죠\?|(吗|嗎|呢|么|麼|吧)[\s。！？]*$|ですか|ますか|かな|không\??$|chưa\??$|à\??$|\b(what|when|where|why|how|do you|are you|can you|would you)\b/i,
    invite: /(볼까|만날까|갈래|먹을래|보자|만나자|약속|见面|见吗|见吧|見面|一起|約|会おう|会いませんか|行こう|gặp|đi chơi|hẹn|let'?s meet|hang out|grab|dinner|lunch|coffee together)/i,
    busy: /(바빠|바쁘|다음에|나중에|피곤|忙|下次|改天|累|忙しい|また今度|疲れ|bận|lần sau|mệt|busy|next time|maybe later|tired)/i,
    thanks: /(고마|감사|谢谢|謝謝|感谢|ありがとう|cảm ơn|thank)/i,
    sorry: /(미안|죄송|对不起|抱歉|不好意思|ごめん|すみません|xin lỗi|sorry|apolog)/i,
    affection: /(보고\s?싶|좋아해|사랑|想你|喜欢你|爱你|会いたい|好き|nhớ|thương|yêu|miss you|love you|like you)/i,
    negative: /(힘들|슬퍼|우울|화나|짜증|难过|伤心|生气|烦|辛い|悲しい|ムカつく|buồn|chán|giận|sad|upset|angry|annoyed|stressed)/i,
    positive: /(좋아|재밌|행복|최고|기뻐|开心|高兴|太好了|嬉しい|楽しい|vui|tuyệt|happy|great|awesome|fun)/i,
    money: /(송금|계좌|돈 좀|빌려|투자|코인|비트코인|转账|汇款|借钱|投资|虚拟币|送金|振込|投資|chuyển khoản|vay tiền|đầu tư|wire|bank account|lend me|invest|crypto|bitcoin|gift card)/i,
    offplatform: /(텔레그램|whatsapp|링크|link|telegram|t\.me|bit\.ly)/i,
  };

  function intents(text) {
    const s = String(text || '');
    const out = [];
    Object.keys(RX).forEach((k) => { if (RX[k].test(s)) out.push(k); });
    return out;
  }

  /* ---------------- 말투 ---------------- */
  function formality(text, lang) {
    const s = String(text || '');
    if (lang === 'ko') {
      if (/(습니다|습니까|십시오|세요|에요|예요|아요|어요|해요|죠|나요|까요)[\s.!?~]*$/m.test(s) || /요[.!?~\s]*$/.test(s)) return 'polite';
      return 'casual';
    }
    if (lang === 'ja') return /(です|ます|でしょう|ください|ございます)/.test(s) ? 'polite' : 'casual';
    if (lang === 'zh' || lang === 'zh-TW') return /(您|请|請|麻烦|麻煩|劳驾)/.test(s) ? 'polite' : 'casual';
    if (lang === 'vi') return /(ạ|dạ|thưa|xin)/i.test(s) ? 'polite' : 'casual';
    return /(please|would you|could you|kindly|thank you)/i.test(s) ? 'polite' : 'casual';
  }

  const EMOJI_RX = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]|ㅋㅋ|ㅎㅎ|ㅠㅠ|哈哈|www|笑|haha|lol|:\)|\^\^/gu;

  /* ---------------- 토큰화(지난 대화 연결용) ---------------- */
  const STOP = new Set('그리고 그래서 근데 저는 나는 너는 우리 이거 그거 저거 진짜 정말 너무 오늘 내일 어제 我们 你们 他们 这个 那个 就是 然后 但是 今天 明天 です ます これ それ あれ 今日 明日 the and you are for that this with have what when where your but just like will can tôi bạn của và không có là được'.split(' '));
  function tokens(text) {
    const s = String(text || '').toLowerCase();
    const out = new Set();
    // 한글·라틴 단어
    (s.match(/[a-zà-ỹ]{3,}|[가-힣]{2,}/g) || []).forEach((w) => {
      let x = w;
      if (/[가-힣]/.test(x)) x = x.replace(/(은|는|이|가|을|를|에서|에게|에|으로|로|와|과|도|만|요|까요|해요|했어|했어요|하고)$/, '');
      if (x.length >= 2 && !STOP.has(x)) out.add(x);
    });
    // 한자·가나: 2글자 단위
    (s.match(/[぀-ヿ一-鿿]+/g) || []).forEach((run) => {
      for (let i = 0; i < run.length - 1; i++) {
        const bg = run.slice(i, i + 2);
        if (!STOP.has(bg) && !/^[のにをはがでとも]/.test(bg)) out.add(bg);
      }
    });
    (s.match(/\d{2,}/g) || []).forEach((n) => out.add(n));
    return out;
  }

  function similarity(a, b) {
    if (!a.size || !b.size) return 0;
    let inter = 0;
    a.forEach((x) => { if (b.has(x)) inter++; });
    return inter / Math.min(a.size, b.size);
  }

  /**
   * 지난 대화 기억: 새 메시지와 관련된 과거 메시지, 놓친 질문, 지난 약속, 겹치는 질문
   * @param {object} p {text, dir, contact, messages(해당 연락처의 과거 메시지, 오래된 순), promises}
   */
  function recall(p) {
    const res = { related: [], unanswered: [], duplicateQuestion: null, overduePromises: [], upcomingPromises: [], contradictions: [] };
    const msgs = (p.messages || []).slice();
    const tk = tokens(p.text + ' ' + (p.textTranslated || ''));
    const scored = msgs.map((m) => {
      const t2 = tokens((m.text || '') + ' ' + (m.translation || ''));
      return { m, score: similarity(tk, t2), shared: [...tk].filter((x) => t2.has(x)) };
    }).filter((x) => x.score >= 0.25 && x.shared.length >= 1 && x.m.text !== p.text);
    scored.sort((a, b) => b.score - a.score || b.m.ts - a.m.ts);
    res.related = scored.slice(0, 3).map((x) => ({ msg: x.m, shared: x.shared.slice(0, 4) }));

    // 놓친 질문: 상대 질문 뒤에 내 답장이 없는 경우
    for (let i = 0; i < msgs.length; i++) {
      const m = msgs[i];
      if (m.dir === 'in' && RX.question.test(m.text)) {
        const answered = msgs.slice(i + 1).some((n) => n.dir === 'out');
        if (!answered) res.unanswered.push(m);
      }
    }
    // 내가 이미 한 질문을 또 묻는지
    if (p.dir === 'out' && RX.question.test(p.text)) {
      const dup = msgs.filter((m) => m.dir === 'out' && RX.question.test(m.text) && similarity(tk, tokens(m.text + ' ' + (m.translation || ''))) >= 0.5);
      if (dup.length) res.duplicateQuestion = dup[dup.length - 1];
    }
    const today = ymd(new Date());
    (p.promises || []).forEach((pr) => {
      if (pr.done) return;
      if (pr.date && pr.date < today) res.overduePromises.push(pr);
      else res.upcomingPromises.push(pr);
    });
    // 약속 시간 변경 감지: 새 메시지의 시간과 기존 약속이 같은 날 다른 시간
    const w = extractWhen(p.text);
    if (w && w.date) {
      (p.promises || []).filter((pr) => !pr.done && pr.date === w.date && pr.time && w.time && pr.time !== w.time)
        .forEach((pr) => res.contradictions.push({ promise: pr, newTime: w.time }));
    }
    return res;
  }

  /**
   * 연락처 성향·상황 분석 (메시지 통계 기반)
   */
  function profile(messages) {
    const ins = messages.filter((m) => m.dir === 'in');
    const outs = messages.filter((m) => m.dir === 'out');
    const n = ins.length;
    const res = {
      count: messages.length, inCount: n, outCount: outs.length,
      avgLen: 0, emojiRate: 0, questionRate: 0, formality: null,
      replyMinutes: null, activeHour: null, mood: 'neutral', moodScore: 0,
      topics: [], depth: 0, firstTs: null, lastTs: null, lastInTs: null, silentDays: null,
      initiative: 0,
    };
    if (!messages.length) return res;
    res.firstTs = messages[0].ts;
    res.lastTs = messages[messages.length - 1].ts;
    res.silentDays = Math.max(0, Math.floor((Date.now() - res.lastTs) / 86400000));
    if (n) {
      res.lastInTs = ins[ins.length - 1].ts;
      res.avgLen = Math.round(ins.reduce((a, m) => a + [...(m.text || '')].length, 0) / n);
      res.emojiRate = ins.filter((m) => (m.text || '').match(EMOJI_RX)).length / n;
      res.questionRate = ins.filter((m) => RX.question.test(m.text)).length / n;
      const pol = ins.filter((m) => formality(m.text, m.lang) === 'polite').length;
      res.formality = pol / n >= 0.5 ? 'polite' : 'casual';
      const hours = new Array(24).fill(0);
      ins.forEach((m) => { hours[new Date(m.ts).getHours()]++; });
      res.activeHour = hours.indexOf(Math.max(...hours));
      const recent = ins.slice(-10);
      let sc = 0;
      recent.forEach((m) => { if (RX.positive.test(m.text) || RX.affection.test(m.text) || RX.thanks.test(m.text)) sc++; if (RX.negative.test(m.text) || RX.busy.test(m.text)) sc--; });
      res.moodScore = sc;
      res.mood = sc >= 2 ? 'good' : sc <= -2 ? 'low' : 'neutral';
    }
    // 답장 속도: 내 메시지 → 상대 메시지 간격 중간값
    const gaps = [];
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].dir === 'in' && messages[i - 1].dir === 'out' && messages[i].ts - messages[i - 1].ts < 12 * 3600000) gaps.push((messages[i].ts - messages[i - 1].ts) / 60000);
    }
    if (gaps.length) { gaps.sort((a, b) => a - b); res.replyMinutes = Math.round(gaps[Math.floor(gaps.length / 2)]); }
    // 대화 주도: 하루 첫 메시지를 상대가 보낸 비율
    const days = {};
    messages.forEach((m) => { const d = ymd(new Date(m.ts)); if (!days[d]) days[d] = m.dir; });
    const dv = Object.values(days);
    res.initiative = dv.length ? dv.filter((x) => x === 'in').length / dv.length : 0;
    // 주제
    const freq = {};
    ins.forEach((m) => tokens(m.text + ' ' + (m.translation || '')).forEach((t) => { if (!/^\d+$/.test(t)) freq[t] = (freq[t] || 0) + 1; }));
    const FUNC = /[我你他她它的了吗呢吧是有在不这那个们好想要会就都也很点么啊哦嗯呀和跟给对说去来看过还没把被让][\s\S]?|[\s\S]?[我你他她它的了吗呢吧是有在不这那个们好想要会就都也很点么啊哦嗯呀和跟给对说去来看过还没把被让]|[\u3040-\u309f]/;
    const isCjkBigram = (w) => /^[\u3040-\u30ff\u4e00-\u9fff]{2}$/.test(w);
    res.topics = Object.entries(freq).filter(([w, c]) => c >= 2 && !(isCjkBigram(w) && FUNC.test(w))).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t]) => t);
    res.depth = depthScore(messages, res);
    return res;
  }

  // 대화 깊이 점수 0~100: 양, 기간, 길이, 개인적 주제, 감정 표현, 상호성
  const PERSONAL = /(가족|엄마|아빠|부모|꿈|고민|어릴|추억|마음|느낌|家人|妈妈|爸爸|梦想|烦恼|小时候|心情|家族|お母さん|夢|悩み|子供の頃|気持ち|gia đình|mẹ|bố|ước mơ|tâm sự|family|mom|dad|dream|worry|childhood|feel)/i;
  function depthScore(messages, pr) {
    if (!messages.length) return 0;
    const spanDays = Math.max(1, (pr.lastTs - pr.firstTs) / 86400000);
    let s = 0;
    s += Math.min(25, messages.length * 0.8);
    s += Math.min(15, spanDays * 0.5);
    s += Math.min(15, (pr.avgLen || 0) / 3);
    const personal = messages.filter((m) => PERSONAL.test(m.text)).length;
    s += Math.min(20, personal * 5);
    const emo = messages.filter((m) => RX.affection.test(m.text) || RX.negative.test(m.text) || RX.positive.test(m.text)).length;
    s += Math.min(15, emo * 2);
    const balance = pr.outCount && pr.inCount ? Math.min(pr.outCount, pr.inCount) / Math.max(pr.outCount, pr.inCount) : 0;
    s += balance * 10;
    if (pr.silentDays > 14) s -= 10;
    return Math.max(0, Math.min(100, Math.round(s)));
  }

  /* ---------------- AI 종합 분석(키가 있을 때) ---------------- */
  async function aiAnalyze(p) {
    const sys = 'You help a foreign user understand and reply to chat messages from their friend in another language. Be warm, practical and culturally aware. Never help deceive, pressure, or extract money or personal data. Distinguish facts stated in the message from your inferences. Respond in strict JSON only.';
    const hist = (p.history || []).slice(-12).map((m) => (m.dir === 'in' ? 'THEM' : 'ME') + ' [' + new Date(m.ts).toISOString().slice(0, 16) + ']: ' + m.text).join('\n');
    const user = [
      'User UI language: ' + LANGS[p.uiLang].llm,
      'Contact nickname: ' + p.contact.nickname + ', contact language: ' + LANGS[p.contact.lang].llm + ', app: ' + p.contact.app,
      'Relationship goal: ' + (p.contact.relation || 'friend') + ', stage: ' + (p.stageName || ''),
      'Known profile (entered by user): ' + JSON.stringify({ age: p.contact.age, gender: p.contact.gender, blood: p.contact.blood, mbti: p.contact.mbti, country: p.contact.country }),
      'Recent history:\n' + (hist || '(none)'),
      'NEW MESSAGE (' + (p.dir === 'in' ? 'from THEM' : 'ME drafting') + '):\n' + p.text,
      '',
      'Return JSON with keys:',
      '{"translation": "new message translated into user UI language (if from THEM) or into contact language (if ME)",',
      ' "nuance": "1-2 sentences in UI language on tone/nuance",',
      ' "situation": "1-2 sentences in UI language: what is happening now / what they want",',
      ' "facts": ["stated facts, UI language"], "inferences": ["your inferences, UI language"],',
      ' "replies": [{"label": "short label in UI language", "text": "reply in contact language", "meaning": "same reply in UI language"} x3],',
      ' "culture": "one culture tip in UI language or empty",',
      ' "coach": "one next-step relationship tip in UI language",',
      ' "avoid": "one thing to avoid saying, UI language"}',
    ].join('\n');
    const txt = await callLLM(sys, user, true);
    return extractJson(txt);
  }

  global.Engine = {
    LANGS, detect, translate, callLLM, aiConfig, aiAnalyze,
    extractWhen, extractPlace, extractProfile, intents, formality, recall, profile, tokens, similarity, ymd, addDays, RX,
  };
})(typeof window !== 'undefined' ? window : globalThis);
