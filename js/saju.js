/* 상담매직 — 사주(四柱)·궁합 엔진
 * 외부 라이브러리 없이 계산합니다.
 * - 연주: 입춘(태양황경 315°) 기준
 * - 월주: 12절기(태양황경 15°+30°n) 기준, 태양 황경은 Meeus 저정밀 공식(오차 약 0.01°)
 * - 일주: 율리우스일(JDN) 기준, 23시 이후는 다음 날(자시)로 계산
 * - 시주: 일간 기준 시두법
 * - 음력 입력: 브라우저 내장 중국력(Intl, calendar=chinese)으로 양력 변환
 */
(function (global) {
  'use strict';

  const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const STEMS_KO = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
  const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const BRANCHES_KO = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
  const STEM_EL = ['wood', 'wood', 'fire', 'fire', 'earth', 'earth', 'metal', 'metal', 'water', 'water'];
  const BRANCH_EL = ['water', 'earth', 'wood', 'wood', 'earth', 'fire', 'fire', 'earth', 'metal', 'metal', 'earth', 'water'];
  const ELEMENTS = ['wood', 'fire', 'earth', 'metal', 'water'];
  const ZODIAC_ANIMALS = ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'];

  // 생(生): wood→fire→earth→metal→water→wood / 극(剋): wood→earth→water→fire→metal→wood
  const GENERATES = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
  const CONTROLS = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };

  const SIX_HARMONY = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
  const CLASH = [[0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]];
  const WONJIN = [[0, 7], [1, 6], [2, 9], [3, 8], [4, 11], [5, 10]];
  const TRINE = [[8, 0, 4], [2, 6, 10], [5, 9, 1], [11, 3, 7]];

  function mod(a, n) { return ((a % n) + n) % n; }
  function pairHas(list, a, b) { return list.some(([x, y]) => (x === a && y === b) || (x === b && y === a)); }

  // 그레고리력 → 율리우스일(정오 기준 정수)
  function jdn(y, m, d) {
    const a = Math.floor((14 - m) / 12);
    const yy = y + 4800 - a;
    const mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }

  // UTC 시각(ms) → 율리우스일(실수)
  function jdFromMs(ms) { return ms / 86400000 + 2440587.5; }

  // 태양 겉보기 황경(도)
  function sunLongitude(jd) {
    const T = (jd - 2451545.0) / 36525;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * Math.PI / 180;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
      + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
      + 0.000289 * Math.sin(3 * M);
    const omega = (125.04 - 1934.136 * T) * Math.PI / 180;
    const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega);
    return mod(lambda, 360);
  }

  /**
   * 음력 → 양력 변환 (브라우저 내장 중국력 사용)
   * @returns {{y:number,m:number,d:number}|null}
   */
  function lunarToSolar(ly, lm, ld, isLeap) {
    let fmt;
    try {
      fmt = new Intl.DateTimeFormat('en-u-ca-chinese', { timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric' });
    } catch (e) { return null; }
    // 음력 날짜는 양력 1월 하순 ~ 이듬해 2월 사이에 위치
    const start = Date.UTC(ly, 0, 15);
    for (let i = 0; i < 420; i++) {
      const ms = start + i * 86400000;
      const parts = fmt.formatToParts(new Date(ms));
      const get = (t) => (parts.find((p) => p.type === t) || {}).value || '';
      const yr = parseInt(get('relatedYear') || get('year'), 10);
      const monthRaw = get('month');
      const leap = /bis|leap|闰|윤/i.test(monthRaw);
      const mo = parseInt(monthRaw, 10);
      const dy = parseInt(get('day'), 10);
      if (yr === ly && mo === lm && dy === ld && leap === !!isLeap) {
        const dt = new Date(ms);
        return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
      }
    }
    return null;
  }

  /**
   * 사주 계산
   * @param {object} p {year, month, day, hour(옵션, 0-23), minute, tzOffset(시간, 기본 9), lunar(boolean), leap(boolean)}
   */
  function calc(p) {
    let { year, month, day } = p;
    if (!year || !month || !day) return null;
    if (p.lunar) {
      const s = lunarToSolar(year, month, day, p.leap);
      if (!s) return null;
      year = s.y; month = s.m; day = s.d;
    }
    const hasTime = p.hour !== undefined && p.hour !== null && p.hour !== '' && !Number.isNaN(Number(p.hour));
    const hour = hasTime ? Number(p.hour) : 12;
    const minute = hasTime ? Number(p.minute || 0) : 0;
    const tz = p.tzOffset === undefined || p.tzOffset === null || p.tzOffset === '' ? 9 : Number(p.tzOffset);

    const utcMs = Date.UTC(year, month - 1, day, hour, minute) - tz * 3600000;
    const lon = sunLongitude(jdFromMs(utcMs));

    // 연주: 입춘(315°) 이전이면 전년도
    let sajuYear = year;
    // 1~2월이고 황경이 입춘 전(270°~315° 구간 = 동지~입춘 사이)이면 전년도
    if (month <= 2 && lon >= 255 && lon < 315) sajuYear = year - 1;
    if (month === 1 && lon >= 255) sajuYear = year - 1;
    const yearIdx = mod(sajuYear - 4, 60);
    const yStem = yearIdx % 10;
    const yBranch = yearIdx % 12;

    // 월주: 인월(寅) = 황경 315°~345°
    const monthOrder = Math.floor(mod(lon - 315, 360) / 30); // 0=寅
    const mBranch = mod(monthOrder + 2, 12);
    const mStem = mod(yStem * 2 + 2 + monthOrder, 10);

    // 일주: 23시 이후는 다음 날
    let dayJdn = jdn(year, month, day);
    if (hasTime && hour >= 23) dayJdn += 1;
    const dayIdx = mod(dayJdn + 49, 60);
    const dStem = dayIdx % 10;
    const dBranch = dayIdx % 12;

    // 시주
    let hStem = null, hBranch = null;
    if (hasTime) {
      hBranch = Math.floor(mod(hour + 1, 24) / 2) % 12;
      hStem = mod(dStem * 2 + hBranch, 10);
    }

    const pillars = [
      { key: 'year', stem: yStem, branch: yBranch },
      { key: 'month', stem: mStem, branch: mBranch },
      { key: 'day', stem: dStem, branch: dBranch },
    ];
    if (hasTime) pillars.push({ key: 'hour', stem: hStem, branch: hBranch });

    const counts = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    pillars.forEach((pl) => { counts[STEM_EL[pl.stem]]++; counts[BRANCH_EL[pl.branch]]++; });
    const total = pillars.length * 2;
    const strong = ELEMENTS.filter((e) => counts[e] === Math.max(...ELEMENTS.map((x) => counts[x])));
    const lacking = ELEMENTS.filter((e) => counts[e] === 0);

    return {
      solar: { year, month, day },
      hasTime,
      pillars: pillars.map((pl) => ({
        key: pl.key,
        stem: pl.stem, branch: pl.branch,
        hanja: STEMS[pl.stem] + BRANCHES[pl.branch],
        hangul: STEMS_KO[pl.stem] + BRANCHES_KO[pl.branch],
        stemEl: STEM_EL[pl.stem], branchEl: BRANCH_EL[pl.branch],
      })),
      dayMaster: dStem,
      dayMasterEl: STEM_EL[dStem],
      dayMasterYang: dStem % 2 === 0,
      dayBranch: dBranch,
      yearBranch: yBranch,
      animal: ZODIAC_ANIMALS[yBranch],
      counts, total, strong, lacking,
      utcMs, yearStem: yStem, monthStem: mStem, monthBranch: mBranch, lon,
    };
  }

  // 서양 별자리
  const SIGNS = [
    ['capricorn', 1, 19], ['aquarius', 2, 18], ['pisces', 3, 20], ['aries', 4, 19], ['taurus', 5, 20], ['gemini', 6, 21],
    ['cancer', 7, 22], ['leo', 8, 22], ['virgo', 9, 22], ['libra', 10, 23], ['scorpio', 11, 22], ['sagittarius', 12, 21], ['capricorn', 12, 31],
  ];
  const SIGN_EL = { aries: 'fire', leo: 'fire', sagittarius: 'fire', taurus: 'earth', virgo: 'earth', capricorn: 'earth', gemini: 'air', libra: 'air', aquarius: 'air', cancer: 'water', scorpio: 'water', pisces: 'water' };
  function zodiacSign(m, d) {
    for (const [name, mm, dd] of SIGNS) { if (m < mm || (m === mm && d <= dd)) return name; }
    return 'capricorn';
  }

  // 혈액형 궁합 (재미용 점수, 0~100)
  const BLOOD = {
    A: { A: 78, B: 55, O: 86, AB: 70 },
    B: { A: 55, B: 74, O: 80, AB: 84 },
    O: { A: 86, B: 80, O: 72, AB: 62 },
    AB: { A: 70, B: 84, O: 62, AB: 76 },
  };

  // MBTI 궁합: 축별 보완·유사 점수
  function mbtiScore(a, b) {
    if (!/^[EI][SN][TF][JP]$/i.test(a || '') || !/^[EI][SN][TF][JP]$/i.test(b || '')) return null;
    a = a.toUpperCase(); b = b.toUpperCase();
    let s = 50;
    if (a[1] === b[1]) s += 18; // 인식(S/N) 같음: 대화 소재가 잘 맞음
    if (a[0] !== b[0]) s += 10; // 외향/내향 보완
    if (a[2] !== b[2]) s += 8; else s += 4;
    if (a[3] !== b[3]) s += 6; else s += 5;
    return Math.min(98, s);
  }

  /**
   * 궁합 계산
   * @returns {{total:number, parts:object, notes:string[]}} notes는 i18n 키
   */
  function compat(me, other) {
    const parts = {};
    const notes = [];
    if (me.saju && other.saju) {
      const a = me.saju, b = other.saju;
      let s = 60;
      if (GENERATES[a.dayMasterEl] === b.dayMasterEl) { s += 14; notes.push('c_gen_me_to_you'); }
      else if (GENERATES[b.dayMasterEl] === a.dayMasterEl) { s += 14; notes.push('c_gen_you_to_me'); }
      else if (a.dayMasterEl === b.dayMasterEl) { s += 8; notes.push('c_same_el'); }
      else if (CONTROLS[a.dayMasterEl] === b.dayMasterEl || CONTROLS[b.dayMasterEl] === a.dayMasterEl) { s -= 6; notes.push('c_control'); }
      // 오행 보완
      const fill = a.lacking.filter((e) => b.counts[e] >= 2).length + b.lacking.filter((e) => a.counts[e] >= 2).length;
      if (fill) { s += Math.min(12, fill * 6); notes.push('c_fill'); }
      if (pairHas(SIX_HARMONY, a.dayBranch, b.dayBranch)) { s += 10; notes.push('c_harmony'); }
      if (pairHas(CLASH, a.dayBranch, b.dayBranch)) { s -= 10; notes.push('c_clash'); }
      if (a.dayMasterYang !== b.dayMasterYang) s += 4;
      parts.saju = Math.max(20, Math.min(99, s));
      // 띠
      let z = 65;
      if (TRINE.some((g) => g.includes(a.yearBranch) && g.includes(b.yearBranch)) && a.yearBranch !== b.yearBranch) { z += 22; notes.push('c_trine'); }
      if (pairHas(SIX_HARMONY, a.yearBranch, b.yearBranch)) { z += 18; }
      if (pairHas(CLASH, a.yearBranch, b.yearBranch)) { z -= 18; notes.push('c_zclash'); }
      if (pairHas(WONJIN, a.yearBranch, b.yearBranch)) { z -= 10; }
      parts.zodiac = Math.max(20, Math.min(99, z));
    }
    if (me.blood && other.blood && BLOOD[me.blood] && BLOOD[me.blood][other.blood]) parts.blood = BLOOD[me.blood][other.blood];
    const mb = mbtiScore(me.mbti, other.mbti);
    if (mb !== null) parts.mbti = mb;
    if (me.sign && other.sign) {
      const ea = SIGN_EL[me.sign], eb = SIGN_EL[other.sign];
      let st = 62;
      if (ea === eb) st += 16;
      else if ((ea === 'fire' && eb === 'air') || (ea === 'air' && eb === 'fire') || (ea === 'earth' && eb === 'water') || (ea === 'water' && eb === 'earth')) st += 20;
      else st -= 4;
      parts.star = st;
    }
    if (typeof other.chatScore === 'number') parts.chat = other.chatScore;

    const weights = { chat: 0.4, saju: 0.25, mbti: 0.15, blood: 0.1, zodiac: 0.05, star: 0.05 };
    let sum = 0, w = 0;
    Object.keys(parts).forEach((k) => { sum += parts[k] * weights[k]; w += weights[k]; });
    const total = w ? Math.round(sum / w) : null;
    return { total, parts, notes };
  }

  global.Saju = {
    STEMS, STEMS_KO, BRANCHES, BRANCHES_KO, ELEMENTS, STEM_EL, BRANCH_EL,
    calc, compat, zodiacSign, lunarToSolar, sunLongitude, jdn, mbtiScore,
  };
})(typeof window !== 'undefined' ? window : globalThis);
