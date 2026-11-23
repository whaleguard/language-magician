/* 언어의 마술사 — 참조 데이터 (메신저, 국가, 문화, 명절, 선물, 샘플 대화) */
(function (global) {
  'use strict';

  const APPS = [
    { id: 'kakaotalk', name: 'KakaoTalk' }, { id: 'wechat', name: 'WeChat' }, { id: 'line', name: 'LINE' },
    { id: 'whatsapp', name: 'WhatsApp' }, { id: 'instagram', name: 'Instagram DM' }, { id: 'telegram', name: 'Telegram' },
    { id: 'zalo', name: 'Zalo' }, { id: 'messenger', name: 'Messenger' }, { id: 'other', name: 'Other' },
  ];
  const COLORS = ['mint', 'lilac', 'amber', 'sky', 'rose', 'sand', 'teal', 'coral'];

  // 국가 → 기본 언어
  const COUNTRIES = [
    { id: 'KR', lang: 'ko', flag: '🇰🇷', ko: '한국', en: 'Korea', zh: '韩国', ja: '韓国', vi: 'Hàn Quốc' },
    { id: 'CN', lang: 'zh', flag: '🇨🇳', ko: '중국', en: 'China', zh: '中国', ja: '中国', vi: 'Trung Quốc' },
    { id: 'TW', lang: 'zh-TW', flag: '🇹🇼', ko: '대만', en: 'Taiwan', zh: '台湾', ja: '台湾', vi: 'Đài Loan' },
    { id: 'JP', lang: 'ja', flag: '🇯🇵', ko: '일본', en: 'Japan', zh: '日本', ja: '日本', vi: 'Nhật Bản' },
    { id: 'VN', lang: 'vi', flag: '🇻🇳', ko: '베트남', en: 'Vietnam', zh: '越南', ja: 'ベトナム', vi: 'Việt Nam' },
    { id: 'US', lang: 'en', flag: '🇺🇸', ko: '미국', en: 'USA', zh: '美国', ja: 'アメリカ', vi: 'Mỹ' },
    { id: 'GB', lang: 'en', flag: '🇬🇧', ko: '영국', en: 'UK', zh: '英国', ja: 'イギリス', vi: 'Anh' },
    { id: 'TH', lang: 'th', flag: '🇹🇭', ko: '태국', en: 'Thailand', zh: '泰国', ja: 'タイ', vi: 'Thái Lan' },
    { id: 'ID', lang: 'id', flag: '🇮🇩', ko: '인도네시아', en: 'Indonesia', zh: '印度尼西亚', ja: 'インドネシア', vi: 'Indonesia' },
    { id: 'PH', lang: 'tl', flag: '🇵🇭', ko: '필리핀', en: 'Philippines', zh: '菲律宾', ja: 'フィリピン', vi: 'Philippines' },
    { id: 'MN', lang: 'mn', flag: '🇲🇳', ko: '몽골', en: 'Mongolia', zh: '蒙古', ja: 'モンゴル', vi: 'Mông Cổ' },
    { id: 'UZ', lang: 'uz', flag: '🇺🇿', ko: '우즈베키스탄', en: 'Uzbekistan', zh: '乌兹别克斯坦', ja: 'ウズベキスタン', vi: 'Uzbekistan' },
    { id: 'NP', lang: 'ne', flag: '🇳🇵', ko: '네팔', en: 'Nepal', zh: '尼泊尔', ja: 'ネパール', vi: 'Nepal' },
    { id: 'RU', lang: 'ru', flag: '🇷🇺', ko: '러시아', en: 'Russia', zh: '俄罗斯', ja: 'ロシア', vi: 'Nga' },
    { id: 'IN', lang: 'hi', flag: '🇮🇳', ko: '인도', en: 'India', zh: '印度', ja: 'インド', vi: 'Ấn Độ' },
    { id: 'ES', lang: 'es', flag: '🇪🇸', ko: '스페인', en: 'Spain', zh: '西班牙', ja: 'スペイン', vi: 'Tây Ban Nha' },
    { id: 'FR', lang: 'fr', flag: '🇫🇷', ko: '프랑스', en: 'France', zh: '法国', ja: 'フランス', vi: 'Pháp' },
    { id: 'DE', lang: 'de', flag: '🇩🇪', ko: '독일', en: 'Germany', zh: '德国', ja: 'ドイツ', vi: 'Đức' },
    { id: 'SA', lang: 'ar', flag: '🇸🇦', ko: '중동(아랍)', en: 'Middle East (Arab)', zh: '中东（阿拉伯）', ja: '中東（アラブ）', vi: 'Trung Đông (Ả Rập)' },
  ];

  /* ---------- 문화 가이드: ko/en 원문, 그 외 UI 언어는 영어 원문을 번역해 표시 ---------- */
  // 각 항목: [제목, 설명, 예문(그 나라 언어)]
  const CULTURE = {
    KR: {
      ko: [
        ['호칭과 존댓말', '처음엔 존댓말(~요)을 쓰고, 상대가 "말 편하게 해"라고 하면 반말로 바꿔요. 나이를 묻는 건 호칭을 정하려는 의미가 커요.', '혹시 말 편하게 해도 될까요?'],
        ['약속 잡기', '역 이름과 출구 번호를 함께 말하면 정확해요. 약속 전날이나 당일에 한 번 더 확인 메시지를 보내는 편이에요.', '토요일 4시에 성수역 2번 출구에서 만나요!'],
        ['답장 문화', '카톡 "1"(안 읽음)이 사라졌는데 답이 없으면 신경 쓰는 사람이 많아요. 바쁘면 짧게라도 알려주세요.', '지금 일하는 중이라 이따 연락할게요!'],
        ['식사·계산', '처음엔 한 사람이 사고 다음에 상대가 사는 경우가 많아요. "다음엔 내가 살게"가 자연스러워요.', '오늘 잘 먹었어요! 다음엔 제가 살게요.'],
        ['기념일', '연인 사이엔 100일·200일, 빼빼로데이(11/11), 화이트데이(3/14)를 챙기는 편이에요.', '우리 100일 축하해! 앞으로도 잘 부탁해 ❤️'],
        ['피할 것', '빨간 펜으로 이름 쓰기, 숫자 4 강조, 처음부터 연봉·정치 이야기는 피하세요.', ''],
      ],
      en: [
        ['Titles and polite speech', 'Start with polite speech (-yo). Switch to casual only when they say "speak comfortably." Asking age is mostly about choosing how to address each other.', '혹시 말 편하게 해도 될까요?'],
        ['Making plans', 'Give the station name and exit number. People often confirm again the day before or on the day.', '토요일 4시에 성수역 2번 출구에서 만나요!'],
        ['Reply culture', 'On KakaoTalk, if the "1" (unread) disappears and there is no reply, people may worry. If busy, send a short note.', '지금 일하는 중이라 이따 연락할게요!'],
        ['Meals and paying', 'Often one person pays and the other pays next time. "Next time it\'s on me" sounds natural.', '오늘 잘 먹었어요! 다음엔 제가 살게요.'],
        ['Anniversaries', 'Couples celebrate 100 and 200 days, Pepero Day (11/11) and White Day (3/14).', '우리 100일 축하해! 앞으로도 잘 부탁해 ❤️'],
        ['Avoid', 'Writing names in red ink, emphasizing the number 4, and opening with salary or politics.', ''],
      ],
    },
    CN: {
      ko: [
        ['호칭', '친해지면 이름 두 글자나 "小+성"으로 불러요. 나이·직업 질문이 흔하고 무례하지 않게 여겨져요.', '你好！很高兴认识你。'],
        ['위챗 문화', '음성 메시지를 많이 보내요. 홍바오(红包)는 명절·축하 때 주고받는 작은 돈 선물이에요.', '新年快乐！给你发个小红包～'],
        ['약속', '지하철역 출구(号口)를 함께 말해요. 시간 약속은 비교적 유연할 수 있어 전날 확인하면 좋아요.', '明天下午三点在地铁站A口见吧？'],
        ['선물', '시계(送钟=장례), 우산(散=헤어짐), 배(梨=离)는 피하세요. 짝수·빨간색 포장이 좋아요.', ''],
        ['기념일', '춘절, 중추절, 칠석(중국 발렌타인), 520(5월 20일, "我爱你" 발음)을 챙겨요.', '520快乐！'],
        ['피할 것', '대만·홍콩·티베트 등 정치 주제, 체면을 깎는 직설적 비판은 피하세요.', ''],
      ],
      en: [
        ['Forms of address', 'Close friends use two characters of the given name or "Xiao + surname." Asking age and job is common and not rude.', '你好！很高兴认识你。'],
        ['WeChat culture', 'Voice messages are popular. Hongbao (red envelopes) are small money gifts for holidays and celebrations.', '新年快乐！给你发个小红包～'],
        ['Making plans', 'Name the subway exit. Timing can be flexible, so confirm the day before.', '明天下午三点在地铁站A口见吧？'],
        ['Gifts', 'Avoid clocks (sounds like a funeral rite), umbrellas (sounds like breaking up) and pears (sounds like separation). Even numbers and red wrapping are good.', ''],
        ['Anniversaries', 'Spring Festival, Mid-Autumn, Qixi (Chinese Valentine\'s) and 520 (May 20, sounds like "I love you").', '520快乐！'],
        ['Avoid', 'Political topics such as Taiwan, Hong Kong or Tibet, and blunt criticism that causes loss of face.', ''],
      ],
    },
    JP: {
      ko: [
        ['존댓말과 거리감', '처음엔 です/ます체로, 친해지면 반말로 바뀌어요. 이름 뒤에 さん을 붙여요.', 'はじめまして。よろしくお願いします。'],
        ['돌려 말하기', '"ちょっと…"는 거절일 가능성이 커요. 확실한 거절 대신 돌려 말하는 경우가 많아요.', 'その日はちょっと難しいかも…来週はどう？'],
        ['LINE 매너', '읽음 표시 후 늦은 답장은 흔해요. 스탬프(스티커)로 감정을 자주 표현해요.', '了解です！'],
        ['선물', '흰 꽃·국화(장례), 숫자 4·9, 빗(苦·死 연상)은 피하세요. 포장을 중시해요.', ''],
        ['기념일', '발렌타인(여성이 선물), 화이트데이(답례), 크리스마스 이브는 연인의 날이에요.', 'ホワイトデーのお返しです！'],
        ['피할 것', '큰 소리 통화, 갑작스러운 사적 질문, 약속 시간 지각을 조심하세요.', ''],
      ],
      en: [
        ['Polite speech and distance', 'Start with desu/masu form; it becomes casual as you get close. Add -san after names.', 'はじめまして。よろしくお願いします。'],
        ['Indirectness', '"Chotto..." often means no. People tend to decline indirectly.', 'その日はちょっと難しいかも…来週はどう？'],
        ['LINE manners', 'Late replies after "read" are common. Stamps (stickers) express feelings a lot.', '了解です！'],
        ['Gifts', 'Avoid white flowers or chrysanthemums (funerals), numbers 4 and 9, and combs. Wrapping matters.', ''],
        ['Anniversaries', 'Valentine\'s (women give gifts), White Day (return gifts), Christmas Eve is a couples\' night.', 'ホワイトデーのお返しです！'],
        ['Avoid', 'Loud phone calls, sudden personal questions, and being late.', ''],
      ],
    },
    VN: {
      ko: [
        ['호칭', '나이에 따라 anh(오빠/형), chị(언니/누나), em(동생)으로 불러요. 나이를 묻는 이유예요.', 'Em chào anh ạ!'],
        ['Zalo·메신저', 'Zalo와 Messenger를 많이 써요. "ạ"를 붙이면 공손해져요.', 'Dạ, em cảm ơn ạ!'],
        ['식사', '같이 밥 먹자는 말은 친해지자는 신호예요. 연장자가 계산하는 경우가 많아요.', 'Tối nay đi ăn cùng mình không?'],
        ['선물', '검은색·흰색 포장, 손수건(이별), 칼·가위는 피하세요.', ''],
        ['기념일', '뗏(설날), 3월 8일·10월 20일 여성의 날, 중추절을 챙겨요.', 'Chúc mừng ngày Phụ nữ Việt Nam 20/10!'],
        ['피할 것', '머리 쓰다듬기, 정치 이야기, 공개적으로 꾸짖기는 피하세요.', ''],
      ],
      en: [
        ['Forms of address', 'People use anh (older male), chị (older female), em (younger) by age. That is why age comes up.', 'Em chào anh ạ!'],
        ['Zalo and Messenger', 'Zalo and Messenger are common. Adding "ạ" sounds polite.', 'Dạ, em cảm ơn ạ!'],
        ['Meals', 'Inviting someone to eat is a sign of wanting to get closer. The older person often pays.', 'Tối nay đi ăn cùng mình không?'],
        ['Gifts', 'Avoid black or white wrapping, handkerchiefs (farewell), knives and scissors.', ''],
        ['Anniversaries', 'Tết (Lunar New Year), Women\'s Days on March 8 and October 20, Mid-Autumn.', 'Chúc mừng ngày Phụ nữ Việt Nam 20/10!'],
        ['Avoid', 'Touching someone\'s head, politics, and scolding in public.', ''],
      ],
    },
    US: {
      ko: [
        ['대화 스타일', '직설적이고 이름으로 불러요. 나이·연봉·체중 질문은 실례예요.', 'Hey! How was your weekend?'],
        ['약속', '시간 약속을 정확히 지키고, 늦으면 미리 문자해요.', 'Running 10 minutes late, sorry!'],
        ['데이트', '더치페이가 흔해요. 첫 만남은 커피나 가벼운 식사가 일반적이에요.', 'Want to grab coffee this weekend?'],
        ['선물', '큰 금기는 적어요. 카드에 짧은 손글씨 메시지를 쓰면 좋아요.', ''],
        ['기념일', '밸런타인데이, 추수감사절(11월 넷째 목), 크리스마스를 챙겨요.', 'Happy Thanksgiving! Grateful for you.'],
        ['피할 것', '정치·종교·외모 평가, 개인 공간 침범은 피하세요.', ''],
      ],
      en: [
        ['Conversation style', 'Direct, first names. Asking age, salary or weight is rude.', 'Hey! How was your weekend?'],
        ['Plans', 'Be on time, and text ahead if you will be late.', 'Running 10 minutes late, sorry!'],
        ['Dating', 'Splitting the bill is common. First dates are often coffee or a light meal.', 'Want to grab coffee this weekend?'],
        ['Gifts', 'Few strict taboos. A short handwritten note on a card goes a long way.', ''],
        ['Anniversaries', 'Valentine\'s Day, Thanksgiving (4th Thursday of November), Christmas.', 'Happy Thanksgiving! Grateful for you.'],
        ['Avoid', 'Politics, religion, comments on looks, and invading personal space.', ''],
      ],
    },
    TH: {
      ko: [['인사', '와이(합장) 인사를 해요. 이름 앞에 "쿤"을 붙이면 공손해요.', 'สวัสดีครับ/ค่ะ'], ['예절', '왕실 비판은 법으로 금지돼요. 머리를 만지거나 발로 가리키지 마세요.', ''], ['명절', '송끄란(4월 13~15일)에는 물을 뿌리며 새해를 축하해요.', 'สุขสันต์วันสงกรานต์!']],
      en: [['Greeting', 'Greet with a wai (palms together). Add "Khun" before names to be polite.', 'สวัสดีครับ/ค่ะ'], ['Etiquette', 'Criticizing the monarchy is illegal. Don\'t touch heads or point with feet.', ''], ['Holidays', 'Songkran (April 13–15) celebrates the new year with water.', 'สุขสันต์วันสงกรานต์!']],
    },
    ID: {
      ko: [['종교', '무슬림이 많아요. 라마단 기간엔 낮에 식사 약속을 피하고, 돼지고기·술 선물은 피하세요.', 'Selamat berbuka puasa!'], ['예절', '물건은 오른손으로 주고받아요.', ''], ['명절', '르바란(이드 알피트르)에는 "Mohon maaf lahir dan batin"이라고 인사해요.', 'Selamat Idul Fitri, mohon maaf lahir dan batin.']],
      en: [['Religion', 'Many are Muslim. During Ramadan avoid daytime meal plans; avoid pork or alcohol gifts.', 'Selamat berbuka puasa!'], ['Etiquette', 'Give and receive with the right hand.', ''], ['Holidays', 'At Lebaran (Eid al-Fitr) say "Mohon maaf lahir dan batin."', 'Selamat Idul Fitri, mohon maaf lahir dan batin.']],
    },
    PH: {
      ko: [['호칭', '연장자에겐 문장 끝에 "po"를 붙여요. Ate(언니), Kuya(오빠)라고 불러요.', 'Salamat po!'], ['가족', '가족 이야기를 좋아하고, 크리스마스 시즌이 9월부터 시작돼요.', 'Maligayang Pasko!']],
      en: [['Address', 'Add "po" for elders. Call people Ate (older sister) or Kuya (older brother).', 'Salamat po!'], ['Family', 'Family talk is welcome. Christmas season starts in September.', 'Maligayang Pasko!']],
    },
    MN: {
      ko: [['예절', '선물·잔은 오른손(왼손으로 팔을 받치고)으로 받아요. 문지방을 밟지 마세요.', ''], ['명절', '차강사르(음력 설)와 나담 축제(7월)를 크게 챙겨요.', 'Сар шинэдээ сайхан шинэлээрэй!']],
      en: [['Etiquette', 'Receive gifts or cups with the right hand, left hand supporting the arm. Don\'t step on the threshold.', ''], ['Holidays', 'Tsagaan Sar (Lunar New Year) and Naadam (July) are big.', 'Сар шинэдээ сайхан шинэлээрэй!']],
    },
    UZ: {
      ko: [['예절', '인사할 때 오른손을 가슴에 대요. 연장자를 매우 존중해요.', 'Assalomu alaykum!'], ['종교', '무슬림이 많아 라마단·이드를 챙기고 돼지고기는 피하세요.', 'Hayitingiz muborak!']],
      en: [['Etiquette', 'Place your right hand on your heart when greeting. Elders are highly respected.', 'Assalomu alaykum!'], ['Religion', 'Mostly Muslim; Ramadan and Eid matter; avoid pork.', 'Hayitingiz muborak!']],
    },
    NP: {
      ko: [['인사', '합장하며 "나마스떼"라고 해요.', 'नमस्ते!'], ['종교', '힌두교인이 많아 소고기 선물·이야기는 피하세요. 다사인·티하르가 큰 명절이에요.', 'शुभ दशैं!']],
      en: [['Greeting', 'Say "Namaste" with palms together.', 'नमस्ते!'], ['Religion', 'Many are Hindu; avoid beef. Dashain and Tihar are major festivals.', 'शुभ दशैं!']],
    },
    RU: {
      ko: [['선물', '꽃은 홀수로 선물해요(짝수는 장례용). 노란 꽃은 이별을 뜻할 수 있어요.', ''], ['명절', '새해(1월 1일)가 가장 큰 명절이고 3월 8일 여성의 날을 챙겨요.', 'С 8 Марта!']],
      en: [['Gifts', 'Give flowers in odd numbers (even numbers are for funerals). Yellow flowers can mean parting.', ''], ['Holidays', 'New Year (Jan 1) is the biggest holiday; March 8 is Women\'s Day.', 'С 8 Марта!']],
    },
    IN: {
      ko: [['종교', '힌두교인은 소고기, 무슬림은 돼지고기를 피해요. 왼손으로 음식을 건네지 마세요.', ''], ['명절', '디왈리(빛의 축제)와 홀리(색의 축제)가 큰 명절이에요.', 'Happy Diwali! शुभ दीपावली!']],
      en: [['Religion', 'Hindus avoid beef, Muslims avoid pork. Don\'t pass food with the left hand.', ''], ['Holidays', 'Diwali (festival of lights) and Holi (festival of colors) are major.', 'Happy Diwali! शुभ दीपावली!']],
    },
    SA: {
      ko: [['종교', '라마단 기간엔 낮에 먹고 마시는 모습을 보이지 않게 배려해요. 술·돼지고기 선물은 금물이에요.', 'رمضان كريم'], ['예절', '오른손으로 주고받고, 이성 간 신체 접촉은 조심하세요.', '']],
      en: [['Religion', 'During Ramadan, be considerate about eating or drinking in front of others in daytime. Never gift alcohol or pork.', 'رمضان كريم'], ['Etiquette', 'Use the right hand and be careful with physical contact between genders.', '']],
    },
  };
  CULTURE.TW = CULTURE.CN; CULTURE.GB = CULTURE.US; CULTURE.ES = CULTURE.US; CULTURE.FR = CULTURE.US; CULTURE.DE = CULTURE.US;

  /* ---------- 명절·기념일 (양력 고정 / 음력 / 계산) ---------- */
  // type: 'fixed' [m, d] | 'lunar' [m, d] | 'nthWeekday' [m, weekday, n]
  const HOLIDAYS = {
    KR: [['설날', 'Seollal (Lunar New Year)', 'lunar', [1, 1]], ['밸런타인데이', 'Valentine\'s Day', 'fixed', [2, 14]], ['화이트데이', 'White Day', 'fixed', [3, 14]], ['추석', 'Chuseok', 'lunar', [8, 15]], ['빼빼로데이', 'Pepero Day', 'fixed', [11, 11]], ['크리스마스', 'Christmas', 'fixed', [12, 25]]],
    CN: [['춘절', 'Spring Festival', 'lunar', [1, 1]], ['원소절', 'Lantern Festival', 'lunar', [1, 15]], ['520', '520 Day', 'fixed', [5, 20]], ['칠석', 'Qixi Festival', 'lunar', [7, 7]], ['중추절', 'Mid-Autumn Festival', 'lunar', [8, 15]], ['국경절', 'National Day', 'fixed', [10, 1]]],
    TW: [['춘절', 'Lunar New Year', 'lunar', [1, 1]], ['칠석', 'Qixi Festival', 'lunar', [7, 7]], ['중추절', 'Mid-Autumn Festival', 'lunar', [8, 15]]],
    JP: [['오쇼가츠(설)', 'New Year', 'fixed', [1, 1]], ['밸런타인데이', 'Valentine\'s Day', 'fixed', [2, 14]], ['화이트데이', 'White Day', 'fixed', [3, 14]], ['칠석(다나바타)', 'Tanabata', 'fixed', [7, 7]], ['오봉', 'Obon', 'fixed', [8, 13]], ['크리스마스 이브', 'Christmas Eve', 'fixed', [12, 24]]],
    VN: [['뗏(설날)', 'Tết', 'lunar', [1, 1]], ['국제 여성의 날', 'International Women\'s Day', 'fixed', [3, 8]], ['중추절', 'Mid-Autumn Festival', 'lunar', [8, 15]], ['베트남 여성의 날', 'Vietnamese Women\'s Day', 'fixed', [10, 20]], ['크리스마스', 'Christmas', 'fixed', [12, 25]]],
    US: [['새해', 'New Year\'s Day', 'fixed', [1, 1]], ['밸런타인데이', 'Valentine\'s Day', 'fixed', [2, 14]], ['추수감사절', 'Thanksgiving', 'nthWeekday', [11, 4, 4]], ['크리스마스', 'Christmas', 'fixed', [12, 25]]],
    GB: [['새해', 'New Year\'s Day', 'fixed', [1, 1]], ['밸런타인데이', 'Valentine\'s Day', 'fixed', [2, 14]], ['크리스마스', 'Christmas', 'fixed', [12, 25]]],
    TH: [['송끄란', 'Songkran', 'fixed', [4, 13]], ['새해', 'New Year\'s Day', 'fixed', [1, 1]]],
    MN: [['차강사르', 'Tsagaan Sar', 'lunar', [1, 1]], ['나담', 'Naadam', 'fixed', [7, 11]]],
    RU: [['새해', 'New Year', 'fixed', [1, 1]], ['여성의 날', 'Women\'s Day', 'fixed', [3, 8]]],
    PH: [['크리스마스', 'Christmas', 'fixed', [12, 25]], ['밸런타인데이', 'Valentine\'s Day', 'fixed', [2, 14]]],
  };

  /* ---------- 선물 카탈로그 ---------- */
  // tags: 관심사 키워드(여러 언어), budget: 1(~3만원) 2(~10만원) 3(10만원+)
  const GIFTS = [
    { id: 'coffee', b: 1, tags: ['커피', '카페', 'coffee', 'café', '咖啡', 'コーヒー', 'cà phê'], ko: '스페셜티 원두 드립백 세트', en: 'Specialty coffee drip-bag set' },
    { id: 'tea', b: 1, tags: ['차', '茶', 'tea', 'お茶', 'trà'], ko: '고급 차 샘플러', en: 'Premium tea sampler' },
    { id: 'snack', b: 1, tags: ['간식', '디저트', 'snack', '零食', 'お菓子', 'bánh'], ko: '우리 나라 대표 간식 꾸러미', en: 'Box of classic snacks from your country' },
    { id: 'card', b: 1, tags: [], ko: '손글씨 카드 + 작은 꽃', en: 'Handwritten card with a small bouquet' },
    { id: 'book', b: 1, tags: ['책', '독서', 'book', '书', '本', 'sách'], ko: '상대 언어로 된 그림책·에세이', en: 'Picture book or essay in their language' },
    { id: 'music', b: 2, tags: ['음악', '노래', 'music', '音乐', '音楽', 'nhạc', 'kpop', '케이팝'], ko: '좋아하는 가수 앨범·굿즈', en: 'Album or merch of their favorite artist' },
    { id: 'skincare', b: 2, tags: ['화장품', '스킨케어', 'skincare', '护肤', 'コスメ', 'mỹ phẩm'], ko: '한국 스킨케어 세트', en: 'K-beauty skincare set' },
    { id: 'perfume', b: 3, tags: ['향수', 'perfume', '香水', 'nước hoa'], ko: '니치 향수 미니 세트', en: 'Niche perfume mini set' },
    { id: 'game', b: 2, tags: ['게임', 'game', '游戏', 'ゲーム', 'trò chơi'], ko: '게임 기프트카드', en: 'Game gift card' },
    { id: 'travel', b: 2, tags: ['여행', 'travel', '旅行', 'du lịch'], ko: '여권 케이스 + 여행 파우치', en: 'Passport case and travel pouch' },
    { id: 'exercise', b: 2, tags: ['운동', '헬스', '요가', 'gym', 'yoga', '运动', '健身', 'ジム', 'tập'], ko: '요가 매트·운동 밴드 세트', en: 'Yoga mat or resistance band set' },
    { id: 'cooking', b: 2, tags: ['요리', 'cook', '做饭', '料理', 'nấu'], ko: '예쁜 앞치마 + 우리 나라 요리 재료', en: 'Apron with ingredients for a dish from home' },
    { id: 'photo', b: 2, tags: ['사진', 'photo', '拍照', '写真', 'ảnh'], ko: '인스탁스 필름 + 함께 찍은 사진 앨범', en: 'Instant film and an album of your photos' },
    { id: 'jewelry', b: 3, tags: [], ko: '심플한 은 목걸이(연인 단계)', en: 'Simple silver necklace (for couples)' },
    { id: 'experience', b: 3, tags: ['공연', '전시', 'concert', '展览', 'ライブ', 'triển lãm'], ko: '공연·전시 티켓 2장', en: 'Two tickets to a show or exhibition' },
    { id: 'pet', b: 1, tags: ['강아지', '고양이', 'dog', 'cat', '猫', '狗', '犬', 'chó', 'mèo'], ko: '반려동물 간식·장난감', en: 'Pet treats or toy' },
  ];
  const GIFT_AVOID = {
    CN: { ko: '시계(送钟), 우산, 배, 초록 모자, 숫자 4', en: 'Clocks, umbrellas, pears, green hats, the number 4' },
    TW: { ko: '시계, 우산, 배, 숫자 4', en: 'Clocks, umbrellas, pears, the number 4' },
    JP: { ko: '흰 꽃·국화, 4·9개 묶음, 빗, 손수건', en: 'White flowers or chrysanthemums, sets of 4 or 9, combs, handkerchiefs' },
    KR: { ko: '빨간 펜, 신발(연인에게: 떠난다는 속설), 숫자 4', en: 'Red pens, shoes for a partner (superstition about leaving), the number 4' },
    VN: { ko: '검은·흰 포장, 손수건, 칼·가위', en: 'Black or white wrapping, handkerchiefs, knives or scissors' },
    RU: { ko: '짝수 송이 꽃, 노란 꽃, 칼, 빈 지갑', en: 'Even-numbered flowers, yellow flowers, knives, an empty wallet' },
    ID: { ko: '술, 돼지고기 성분 식품', en: 'Alcohol, food with pork' },
    SA: { ko: '술, 돼지고기, 지나치게 개인적인 선물', en: 'Alcohol, pork, overly personal gifts' },
    IN: { ko: '소가죽 제품(힌두교), 흰 꽃(장례)', en: 'Leather from cows (Hindu), white flowers (funerals)' },
    UZ: { ko: '술(종교에 따라), 돼지고기', en: 'Alcohol (depending on faith), pork' },
    NP: { ko: '소가죽 제품', en: 'Cow leather products' },
    TH: { ko: '검은 포장, 날카로운 물건', en: 'Black wrapping, sharp objects' },
  };
  const GIFT_MSG = {
    birthday: { ko: '생일 축하해! 올해도 좋은 일만 가득하길 바라. 다음에 만나서 맛있는 거 먹자 🎂', zh: '生日快乐！愿你今年万事顺意。下次见面一起吃好吃的 🎂', ja: '誕生日おめでとう！今年もいいことがたくさんありますように。今度会っておいしいもの食べよう🎂', vi: 'Chúc mừng sinh nhật! Chúc bạn một năm thật nhiều niềm vui. Lần tới gặp nhau đi ăn món ngon nhé 🎂', en: 'Happy birthday! Wishing you a year full of good things. Let\'s grab something delicious next time 🎂' },
    met: { ko: '우리 처음 만난 지 벌써 {n}일이야! 그동안 고마웠어. 앞으로도 잘 부탁해 😊', zh: '我们认识已经 {n} 天了！谢谢你一直以来的陪伴，以后也请多关照 😊', ja: '出会ってもう{n}日だね！いつもありがとう。これからもよろしくね😊', vi: 'Mình quen nhau đã {n} ngày rồi! Cảm ơn bạn thời gian qua. Mong tiếp tục đồng hành nhé 😊', en: 'It\'s already been {n} days since we met! Thank you for everything. Here\'s to more 😊' },
    holiday: { ko: '{h} 축하해요! 가족들과 즐거운 시간 보내요 🎉', zh: '{h}快乐！祝你和家人度过美好的时光 🎉', ja: '{h}おめでとう！ご家族と楽しい時間を過ごしてね🎉', vi: 'Chúc mừng {h}! Chúc bạn có thời gian vui vẻ bên gia đình 🎉', en: 'Happy {h}! Enjoy the time with your family 🎉' },
    anniv: { ko: '오늘은 우리 {h}! 늘 고마워 ❤️', zh: '今天是我们的{h}！一直以来谢谢你 ❤️', ja: '今日は私たちの{h}！いつもありがとう❤️', vi: 'Hôm nay là {h} của chúng mình! Luôn cảm ơn bạn ❤️', en: 'Today is our {h}! Thank you, always ❤️' },
  };

  /* ---------- 샘플 연락처·대화 (다국어) ----------
   * 메시지: [며칠 전, 시:분, 방향(in=상대, out=나), {언어별 문장}]
   * 상대 메시지의 원문은 상대 언어, 내 메시지의 원문은 사용자 언어로 저장됩니다.
   */
  const SAMPLE_POOL = [
    {
      key: 'woojae', nickname: '서준', lang: 'ko', country: 'KR', app: 'kakaotalk', color: 'mint', relation: 'romance', stage: 1,
      metDaysAgo: 16, birthday: '1996-05-23', blood: 'O', mbti: 'ENFJ', gender: 'm', age: 30,
      note: { ko: '조용한 카페를 좋아함. 약속 전에 귀가 시간 확인하기.', zh: '喜欢安静的咖啡店。约见前先确认回程时间。', ja: '静かなカフェが好き。約束の前に帰りの時間を確認。', vi: 'Thích quán cà phê yên tĩnh. Trước khi hẹn nhớ hỏi giờ về.', en: 'Likes quiet cafés. Check his return time before plans.' },
      msgs: [
        [16, '20:10', 'in', { ko: '오늘 만나서 반가웠어요! 한국 생활은 어때요?', zh: '今天见到你很高兴！在韩国生活怎么样？', ja: '今日は会えて嬉しかったです！韓国での生活はどうですか？', vi: 'Hôm nay gặp bạn vui lắm! Cuộc sống ở Hàn thế nào?', en: 'It was great meeting you today! How is life in Korea?' }],
        [16, '20:25', 'out', { ko: '저도 반가웠어요! 아직 한국어가 어렵지만 재밌어요.', zh: '我也很高兴！韩语还很难，但很有意思。', ja: '私も嬉しかったです！韓国語はまだ難しいけど楽しいです。', vi: 'Mình cũng vui lắm! Tiếng Hàn còn khó nhưng vui.', en: 'Me too! Korean is still hard, but it\'s fun.' }],
        [9, '21:02', 'in', { ko: '나 커피 진짜 좋아하는데 단 디저트는 별로 안 좋아해요 ㅎㅎ', zh: '我真的很喜欢咖啡，但不太喜欢甜点，哈哈', ja: 'コーヒーは本当に好きだけど、甘いデザートはあまり好きじゃないんだ笑', vi: 'Mình rất thích cà phê nhưng không thích đồ ngọt lắm haha', en: 'I really love coffee, but I\'m not big on sweet desserts haha' }],
        [2, '19:40', 'in', { ko: '성수에 조용한 카페 알아요? 주말에 가보고 싶어요', zh: '你知道圣水那边安静的咖啡店吗？周末想去看看', ja: '聖水で静かなカフェ知ってる？週末に行ってみたい', vi: 'Bạn biết quán cà phê yên tĩnh nào ở Seongsu không? Cuối tuần mình muốn đi thử', en: 'Do you know any quiet cafés in Seongsu? I want to check one out this weekend' }],
        [2, '19:55', 'out', { ko: '좋아요! 일요일에 카페 링크 보내줄게요.', zh: '好呀！我周日把咖啡店链接发给你。', ja: 'いいね！日曜日にカフェのリンク送るね。', vi: 'Được đó! Chủ nhật mình gửi link quán cho bạn nhé.', en: 'Sure! I\'ll send you the café link on Sunday.' }],
        [0, '16:12', 'in', { ko: '토요일 오후 4시에 성수역 2번 출구에서 볼까요?', zh: '周六下午四点在圣水站2号出口见面怎么样？', ja: '土曜日の午後4時に聖水駅2番出口で会いませんか？', vi: 'Thứ bảy 4 giờ chiều gặp ở cửa số 2 ga Seongsu nhé?', en: 'Shall we meet at Seongsu Station Exit 2 at 4 pm on Saturday?' }],
      ],
      promises: [{ daysFromNow: -1, time: '', title: { ko: '카페 링크 보내주기', zh: '把咖啡店链接发给他', ja: 'カフェのリンクを送る', vi: 'Gửi link quán cà phê', en: 'Send the café link' }, place: '' }],
    },
    {
      key: 'lin', nickname: '林 Lin', lang: 'zh', country: 'CN', app: 'wechat', color: 'rose', relation: 'romance', stage: 2,
      metDaysAgo: 40, birthday: '1998-08-12', blood: 'A', mbti: 'INFP', gender: 'f', age: 28,
      note: { ko: '고양이를 키움(이름: 豆豆). 매운 음식 좋아함.', zh: '养了一只猫（豆豆）。喜欢吃辣。', ja: '猫を飼っている（豆豆）。辛い料理が好き。', vi: 'Nuôi một con mèo (Đậu Đậu). Thích ăn cay.', en: 'Has a cat named Doudou. Loves spicy food.' },
      msgs: [
        [40, '22:15', 'in', { zh: '很高兴认识你！你的中文说得不错哦', ko: '만나서 반가워요! 중국어 잘하네요', ja: '知り合えて嬉しい！中国語上手だね', vi: 'Rất vui được quen bạn! Tiếng Trung của bạn tốt đấy', en: 'Nice to meet you! Your Chinese is pretty good' }],
        [20, '23:01', 'in', { zh: '我家豆豆今天又把杯子打翻了😂', ko: '우리 집 또우또우가 오늘 또 컵을 엎었어요😂', ja: 'うちの豆豆が今日またコップを倒した😂', vi: 'Hôm nay bé Đậu Đậu nhà mình lại làm đổ cốc😂', en: 'My cat Doudou knocked over a cup again today😂' }],
        [20, '23:05', 'out', { ko: 'ㅋㅋㅋ 귀엽다! 사진 보여줘요', zh: '哈哈哈 好可爱！给我看看照片', ja: 'www かわいい！写真見せて', vi: 'Haha dễ thương quá! Cho mình xem ảnh đi', en: 'Haha so cute! Show me a photo' }],
        [6, '21:30', 'in', { zh: '最近工作好忙，好累啊', ko: '요즘 일이 너무 바빠서 너무 피곤해요', ja: '最近仕事がすごく忙しくて疲れた', vi: 'Dạo này công việc bận quá, mệt ghê', en: 'Work has been so busy lately, I\'m exhausted' }],
        [1, '22:48', 'in', { zh: '我有点想你了', ko: '조금 보고 싶어요', ja: 'ちょっと会いたくなった', vi: 'Mình hơi nhớ bạn rồi', en: 'I kind of miss you' }],
      ],
      promises: [],
    },
    {
      key: 'haruka', nickname: 'はるか', lang: 'ja', country: 'JP', app: 'line', color: 'lilac', relation: 'friend', stage: 1,
      metDaysAgo: 24, birthday: '1997-' + todayMD(), blood: 'B', mbti: 'ISFJ', gender: 'f', age: 29,
      note: { ko: '말차 디저트를 좋아함. 다음 주 수요일 이후 시간 됨.', zh: '喜欢抹茶甜点。下周三以后有空。', ja: '抹茶スイーツが好き。来週水曜以降なら空いている。', vi: 'Thích đồ ngọt vị matcha. Rảnh từ thứ tư tuần sau.', en: 'Loves matcha desserts. Free after next Wednesday.' },
      msgs: [
        [24, '18:20', 'in', { ja: '今日はありがとう！また一緒にお茶しようね', ko: '오늘 고마워요! 또 같이 차 마셔요', zh: '今天谢谢你！下次再一起喝茶吧', vi: 'Cảm ơn bạn hôm nay! Lần sau lại đi uống trà nhé', en: 'Thanks for today! Let\'s have tea together again' }],
        [10, '20:00', 'in', { ja: '来週、お茶でもどう？', ko: '다음 주에 차라도 한잔 어때요?', zh: '下周一起喝杯茶怎么样？', vi: 'Tuần sau đi uống trà không?', en: 'How about tea sometime next week?' }],
        [10, '20:30', 'out', { ko: '좋아요! 수요일이나 목요일 어때요?', zh: '好啊！周三或周四怎么样？', ja: 'いいね！水曜日か木曜日はどう？', vi: 'Được đó! Thứ tư hay thứ năm được không?', en: 'Sure! How about Wednesday or Thursday?' }],
        [3, '21:10', 'in', { ja: 'ごめんね、その日はちょっと難しいかも…', ko: '미안해요, 그날은 조금 어려울 것 같아요…', zh: '抱歉，那天可能有点不方便…', vi: 'Xin lỗi nhé, hôm đó chắc hơi khó…', en: 'Sorry, that day might be a little difficult…' }],
      ],
      promises: [],
    },
    {
      key: 'minh', nickname: 'Minh', lang: 'vi', country: 'VN', app: 'zalo', color: 'amber', relation: 'friend', stage: 0,
      metDaysAgo: 6, birthday: '', blood: '', mbti: 'ESTP', gender: 'm', age: 26,
      note: { ko: '축구를 좋아함. 쌀국수 맛집을 찾는 중.', zh: '喜欢足球。在找好吃的米粉店。', ja: 'サッカーが好き。おいしいフォーの店を探している。', vi: 'Thích bóng đá. Đang tìm quán phở ngon.', en: 'Loves football. Looking for a good pho place.' },
      msgs: [
        [6, '12:30', 'in', { vi: 'Chào bạn! Mình là Minh, rất vui được làm quen', ko: '안녕하세요! 저는 민이에요, 알게 돼서 반가워요', zh: '你好！我是Minh，很高兴认识你', ja: 'こんにちは！ミンです、よろしくね', en: 'Hi! I\'m Minh, nice to meet you' }],
        [1, '18:05', 'in', { vi: 'Tối nay 7 giờ đi ăn phở ở Hongdae không?', ko: '오늘 저녁 7시에 홍대에서 쌀국수 먹으러 갈래요?', zh: '今晚七点去弘大吃河粉吗？', ja: '今夜7時に弘大でフォー食べに行かない？', vi: 'Tối nay 7 giờ đi ăn phở ở Hongdae không?', en: 'Want to get pho in Hongdae at 7 tonight?' }],
        [1, '18:20', 'out', { ko: '좋아요! 홍대입구역 9번 출구에서 봐요', zh: '好啊！弘大入口站9号出口见', ja: 'いいね！弘大入口駅9番出口で会おう', vi: 'Được! Gặp ở cửa số 9 ga Hongik nhé', en: 'Sounds good! See you at Hongik Univ. Station Exit 9' }],
      ],
      promises: [{ daysFromNow: 0, time: '19:00', title: { ko: '쌀국수 저녁', zh: '一起吃河粉', ja: 'フォーの夕食', vi: 'Ăn phở tối', en: 'Pho dinner' }, place: { ko: '홍대입구역 9번 출구', zh: '弘大入口站9号出口', ja: '弘大入口駅9番出口', vi: 'Cửa số 9 ga Hongik', en: 'Hongik Univ. Station Exit 9' } }],
    },
    {
      key: 'alex', nickname: 'Alex', lang: 'en', country: 'US', app: 'instagram', color: 'sky', relation: 'business', stage: 1,
      metDaysAgo: 12, birthday: '1990-02-02', blood: '', mbti: 'ENTJ', gender: 'x', age: 36,
      note: { ko: '디자인 협업 제안. 견적서 이번 주 금요일까지 전달.', zh: '提议设计合作。本周五前发报价单。', ja: 'デザイン協業の提案。見積書は今週金曜までに送付。', vi: 'Đề xuất hợp tác thiết kế. Gửi báo giá trước thứ sáu này.', en: 'Design collaboration. Send the quote by this Friday.' },
      msgs: [
        [12, '10:00', 'in', { en: 'Hi! Loved your portfolio. Would you be open to a collaboration?', ko: '안녕하세요! 포트폴리오 정말 좋았어요. 협업 가능하실까요?', zh: '你好！很喜欢你的作品集，有兴趣合作吗？', ja: 'こんにちは！ポートフォリオ素敵でした。コラボに興味ありますか？', vi: 'Chào bạn! Mình rất thích portfolio của bạn. Bạn có muốn hợp tác không?' }],
        [5, '15:30', 'in', { en: 'Could you send a quote by Friday?', ko: '금요일까지 견적서 보내주실 수 있나요?', zh: '周五前能发一份报价吗？', ja: '金曜日までに見積もりを送っていただけますか？', vi: 'Bạn gửi báo giá trước thứ sáu được không?' }],
      ],
      promises: [{ daysFromNow: 4, time: '18:00', title: { ko: '견적서 보내기', zh: '发送报价单', ja: '見積書を送る', vi: 'Gửi báo giá', en: 'Send the quote' }, place: '' }],
    },
  ];

  function todayMD() {
    const d = new Date();
    return String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  global.DATA = { APPS, COLORS, COUNTRIES, CULTURE, HOLIDAYS, GIFTS, GIFT_AVOID, GIFT_MSG, SAMPLE_POOL };
})(typeof window !== 'undefined' ? window : globalThis);
