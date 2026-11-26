/* 성향·성격 분석 — 사주(일간·십신·신강약·용신·올해 운), 띠·별자리·혈액형·MBTI·나이대로
   상대가 어떤 사람인지, 어떻게 말하면 좋은지 알려 줍니다. 재미·참고용(상담 대화 소재) */
(function (global) {
  'use strict';
  const L5 = ['ko', 'zh', 'ja', 'vi', 'en'];

  // 일간(태어난 날의 천간) 10가지 성향: [한 줄 별명, 설명, 강점[], 주의[], 이렇게 말하세요[], 좋아하는 화제[]]
  const DM = {
    ko: [
      ['곧은 나무형 리더', '목표가 분명하고 밀고 나가는 힘이 셉니다. 자존심과 원칙이 강하고 남을 이끄는 걸 좋아해요.', ['추진력', '책임감', '정직함'], ['고집이 셈', '지적받는 걸 싫어함'], ['결론과 계획을 먼저 말하기', '선택권을 주고 스스로 정하게 하기', '성과·노력을 구체적으로 인정하기'], ['목표·성장', '일·커리어', '새로운 도전']],
      ['부드러운 덩굴형', '유연하고 사교적이며 눈치가 빠릅니다. 관계 속에서 힘을 얻고 섬세하게 배려해요.', ['적응력', '친화력', '섬세함'], ['결정을 미룸', '서운함을 속에 담아 둠'], ['다정한 말투로 공감부터', '부담 없는 선택지 2~3개 제시', '작은 배려를 자주 표현'], ['관계·사람 이야기', '취미·꾸미기', '맛집·여행']],
      ['태양형 분위기 메이커', '밝고 솔직하며 열정적입니다. 주목받는 걸 좋아하고 표현이 시원해요.', ['긍정 에너지', '솔직함', '행동력'], ['쉽게 달아오르고 식음', '세세한 것을 놓침'], ['리액션을 크게, 칭찬은 구체적으로', '짧고 경쾌하게', '새로운 소식·이벤트 공유'], ['새로운 것·유행', '여행·모임', '자기 이야기']],
      ['촛불형 따뜻한 감성', '섬세하고 따뜻하며 속이 깊습니다. 분위기를 잘 읽고 한 사람에게 정성을 다해요.', ['배려심', '직관', '꾸준한 정성'], ['예민함', '혼자 걱정이 많음'], ['감정을 먼저 알아주기', '천천히 깊게 대화', '약속·디테일을 꼭 지키기'], ['감성·음악·영화', '속마음 이야기', '작은 선물·기념일']],
      ['큰 산형 듬직한 사람', '믿음직하고 침착하며 신용을 중시합니다. 쉽게 흔들리지 않고 포용력이 커요.', ['신뢰감', '인내심', '포용력'], ['변화에 느림', '속마음을 잘 안 드러냄'], ['차분하고 일관되게', '근거·조건을 분명히', '재촉하지 말고 시간을 주기'], ['안정·미래 계획', '가족', '건강·재테크']],
      ['기름진 밭형 살림꾼', '실속 있고 꼼꼼하며 사람을 잘 챙깁니다. 현실 감각이 좋고 조용히 도와줘요.', ['꼼꼼함', '현실감', '돌봄'], ['걱정이 많음', '거절을 잘 못함'], ['구체적인 정보·숫자로 안심시키기', '고마움을 자주 표현', '부담 주는 부탁은 나눠서'], ['생활 정보·살림', '음식', '가족·지인 소식']],
      ['강철형 결단가', '의리 있고 결단이 빠르며 정의감이 강합니다. 시원시원하고 승부욕이 있어요.', ['결단력', '의리', '실행력'], ['말이 직설적', '참을성이 짧음'], ['돌려 말하지 말고 핵심만', '약속·의리를 지키기', '경쟁보다 같은 편 느낌 주기'], ['운동·승부', '일의 성과', '의리·우정']],
      ['보석형 완벽주의', '세련되고 예리하며 자존심이 강합니다. 감각이 좋고 기준이 높아요.', ['안목', '분석력', '깔끔함'], ['예민하고 상처를 잘 받음', '비판적'], ['정중하고 깔끔하게', '안목·센스를 칭찬', '공개 지적 대신 조용히 제안'], ['패션·뷰티·디자인', '품질 좋은 것', '자기 관리']],
      ['큰 바다형 자유인', '생각이 넓고 지혜로우며 자유를 좋아합니다. 호기심이 많고 흐름을 잘 타요.', ['넓은 시야', '지혜', '융통성'], ['쉽게 싫증 냄', '속을 알기 어려움'], ['새로운 아이디어·큰 그림 이야기', '틀에 가두지 않기', '유머 섞기'], ['여행·세계', '아이디어·사업', '철학·지식']],
      ['이슬비형 지혜로운 관찰자', '조용하지만 머리가 좋고 상상력이 풍부합니다. 신중하고 사람을 잘 관찰해요.', ['통찰력', '신중함', '상상력'], ['걱정·생각이 많음', '마음을 늦게 엶'], ['조용히 들어 주고 질문으로 이끌기', '비밀·사생활 존중', '천천히 신뢰 쌓기'], ['책·지식·심리', '조용한 취미', '깊은 대화']],
    ],
    zh: [
      ['挺拔大树型领导者', '目标明确，推进力强。自尊心和原则感强，喜欢带领别人。', ['推动力', '责任感', '正直'], ['固执', '不喜欢被指出问题'], ['先说结论和计划', '给出选择让对方自己决定', '具体肯定成果和努力'], ['目标・成长', '工作・事业', '新挑战']],
      ['柔韧藤蔓型', '灵活、善交际、反应快。在关系中获得力量，体贴细腻。', ['适应力', '亲和力', '细腻'], ['做决定拖延', '把委屈藏在心里'], ['用温柔的语气先共情', '给出2~3个轻松的选择', '经常表达小小的关心'], ['人际・聊人', '兴趣・打扮', '美食・旅行']],
      ['太阳型气氛担当', '开朗直率，充满热情。喜欢被关注，表达爽快。', ['正能量', '直率', '行动力'], ['热得快冷得也快', '容易忽略细节'], ['反应要大，夸奖要具体', '简短轻快', '分享新消息和活动'], ['新事物・潮流', '旅行・聚会', '聊自己']],
      ['烛光型温暖感性', '细腻温暖，内心深沉。善于察觉气氛，对一个人全心投入。', ['体贴', '直觉', '持续用心'], ['敏感', '独自担心多'], ['先体察情绪', '慢慢深入地聊', '一定遵守约定和细节'], ['感性・音乐・电影', '心里话', '小礼物・纪念日']],
      ['大山型稳重可靠', '可靠沉着，重视信用。不轻易动摇，包容力强。', ['信赖感', '耐心', '包容'], ['对变化反应慢', '不轻易表露内心'], ['平稳一致地沟通', '讲清依据和条件', '不催促，给时间'], ['稳定・未来规划', '家庭', '健康・理财']],
      ['沃土型持家能手', '务实细致，会照顾人。现实感好，默默帮忙。', ['细致', '务实', '照顾人'], ['担心多', '不善拒绝'], ['用具体信息和数字让对方安心', '经常表达感谢', '有负担的请求分开说'], ['生活信息・持家', '美食', '家人朋友近况']],
      ['钢铁型果断者', '讲义气，决断快，正义感强。爽快，有好胜心。', ['决断力', '义气', '执行力'], ['说话直接', '耐心短'], ['不绕弯，只说重点', '守约讲义气', '营造同一阵营的感觉而非竞争'], ['运动・胜负', '工作成果', '义气・友情']],
      ['宝石型完美主义', '精致敏锐，自尊心强。品味好，标准高。', ['眼光', '分析力', '干净利落'], ['敏感易受伤', '挑剔'], ['礼貌而简洁', '称赞眼光和品味', '不当众指出，私下建议'], ['时尚・美容・设计', '高品质的东西', '自我管理']],
      ['大海型自由人', '思路开阔、有智慧，喜欢自由。好奇心强，善于顺势而为。', ['视野宽', '智慧', '灵活'], ['容易厌倦', '心思难猜'], ['聊新点子和大方向', '不要框住对方', '加点幽默'], ['旅行・世界', '点子・生意', '哲学・知识']],
      ['细雨型智慧观察者', '安静但聪明，想象力丰富。谨慎，善于观察人。', ['洞察力', '谨慎', '想象力'], ['想得多担心多', '慢热'], ['安静倾听，用提问引导', '尊重隐私', '慢慢建立信任'], ['书・知识・心理', '安静的爱好', '深度对话']],
    ],
    ja: [
      ['まっすぐな大樹型リーダー', '目標がはっきりしていて推進力が強い。プライドと原則を大切にし、人を引っ張るのが好き。', ['推進力', '責任感', '誠実さ'], ['頑固', '指摘されるのが苦手'], ['結論と計画を先に', '選択肢を出して本人に決めてもらう', '成果や努力を具体的に認める'], ['目標・成長', '仕事・キャリア', '新しい挑戦']],
      ['しなやかなツル型', '柔軟で社交的、察しがいい。人間関係から力を得て、細やかに気を配る。', ['適応力', '親しみやすさ', '細やかさ'], ['決断を先延ばし', '不満を溜め込む'], ['やさしい口調でまず共感', '気軽な選択肢を2〜3個', '小さな気遣いをこまめに'], ['人の話', '趣味・おしゃれ', 'グルメ・旅行']],
      ['太陽型ムードメーカー', '明るく率直で情熱的。注目されるのが好きで表現がはっきり。', ['前向きなエネルギー', '率直さ', '行動力'], ['熱しやすく冷めやすい', '細部を見落とす'], ['リアクションは大きく、褒めるのは具体的に', '短くテンポよく', '新しい話題やイベントを共有'], ['新しいもの・流行', '旅行・集まり', '自分の話']],
      ['ろうそく型の温かい感性', '繊細で温かく思慮深い。空気を読み、一人に真心を尽くす。', ['思いやり', '直感', '続く真心'], ['敏感', '一人で心配しがち'], ['まず気持ちをくみ取る', 'ゆっくり深く話す', '約束や細部を必ず守る'], ['感性・音楽・映画', '本音の話', '小さな贈り物・記念日']],
      ['大きな山型の頼れる人', '頼もしく落ち着いていて信用を重んじる。揺らぎにくく包容力が大きい。', ['信頼感', '忍耐力', '包容力'], ['変化に慎重すぎる', '本心を見せにくい'], ['落ち着いて一貫して', '根拠や条件を明確に', '急かさず時間をあげる'], ['安定・将来設計', '家族', '健康・資産']],
      ['肥えた畑型の世話好き', '実直で几帳面、人の面倒をよく見る。現実的で静かに助けてくれる。', ['几帳面さ', '現実感覚', '面倒見'], ['心配性', '断るのが苦手'], ['具体的な情報や数字で安心させる', '感謝をこまめに伝える', '負担の大きいお願いは分けて'], ['生活情報', '食べ物', '家族・知人の近況']],
      ['鋼鉄型の決断家', '義理堅く決断が早く、正義感が強い。さっぱりしていて負けず嫌い。', ['決断力', '義理堅さ', '実行力'], ['言い方がストレート', '気が短い'], ['回りくどくせず要点だけ', '約束と義理を守る', '競争より味方だと感じさせる'], ['スポーツ・勝負', '仕事の成果', '友情']],
      ['宝石型の完璧主義', '洗練されていて鋭く、プライドが高い。センスが良く基準が高い。', ['審美眼', '分析力', 'きちんとさ'], ['繊細で傷つきやすい', '批判的'], ['丁寧にすっきりと', 'センスや目利きを褒める', '人前で指摘せずそっと提案'], ['ファッション・美容・デザイン', '質の良いもの', '自己管理']],
      ['大海型の自由人', '視野が広く賢く、自由が好き。好奇心旺盛で流れに乗るのが上手。', ['広い視野', '知恵', '柔軟さ'], ['飽きっぽい', '本心が読みにくい'], ['新しいアイデアや大きな話を', '型にはめない', 'ユーモアを交える'], ['旅行・世界', 'アイデア・ビジネス', '哲学・知識']],
      ['霧雨型の賢い観察者', '静かだが頭が良く想像力豊か。慎重で人をよく観察する。', ['洞察力', '慎重さ', '想像力'], ['考えすぎ・心配性', '心を開くのが遅い'], ['静かに聞いて質問で導く', 'プライバシーを尊重', 'ゆっくり信頼を築く'], ['本・知識・心理', '静かな趣味', '深い会話']],
    ],
    vi: [
      ['Cây lớn thẳng — kiểu lãnh đạo', 'Mục tiêu rõ ràng, quyết tâm theo đuổi. Tự trọng và nguyên tắc cao, thích dẫn dắt người khác.', ['Quyết tâm', 'Trách nhiệm', 'Chính trực'], ['Cố chấp', 'Không thích bị góp ý'], ['Nói kết luận và kế hoạch trước', 'Đưa lựa chọn để họ tự quyết', 'Ghi nhận công sức cụ thể'], ['Mục tiêu · phát triển', 'Công việc · sự nghiệp', 'Thử thách mới']],
      ['Dây leo mềm mại', 'Linh hoạt, hòa đồng, tinh ý. Có sức mạnh nhờ các mối quan hệ và chu đáo.', ['Thích nghi', 'Thân thiện', 'Tinh tế'], ['Hay trì hoãn quyết định', 'Giữ buồn trong lòng'], ['Đồng cảm trước bằng giọng ấm áp', 'Đưa 2–3 lựa chọn nhẹ nhàng', 'Thường xuyên quan tâm nhỏ'], ['Chuyện con người', 'Sở thích · làm đẹp', 'Ăn uống · du lịch']],
      ['Mặt trời — người tạo không khí', 'Vui vẻ, thẳng thắn, nhiệt huyết. Thích được chú ý, biểu đạt rõ ràng.', ['Năng lượng tích cực', 'Thẳng thắn', 'Hành động nhanh'], ['Nhanh nóng nhanh nguội', 'Bỏ sót chi tiết'], ['Phản ứng nhiệt tình, khen cụ thể', 'Ngắn gọn, vui tươi', 'Chia sẻ tin mới, sự kiện'], ['Cái mới · xu hướng', 'Du lịch · gặp gỡ', 'Chuyện của họ']],
      ['Ngọn nến — ấm áp, tình cảm', 'Tinh tế, ấm áp, sâu sắc. Đọc không khí giỏi và hết lòng với một người.', ['Chu đáo', 'Trực giác', 'Tận tâm'], ['Nhạy cảm', 'Hay lo một mình'], ['Thấu hiểu cảm xúc trước', 'Trò chuyện chậm và sâu', 'Giữ lời hứa và chi tiết'], ['Cảm xúc · âm nhạc · phim', 'Tâm sự', 'Quà nhỏ · ngày kỷ niệm']],
      ['Núi lớn — đáng tin cậy', 'Vững vàng, điềm tĩnh, coi trọng chữ tín. Khó dao động, bao dung.', ['Đáng tin', 'Kiên nhẫn', 'Bao dung'], ['Chậm thay đổi', 'Ít bộc lộ cảm xúc'], ['Trao đổi điềm tĩnh, nhất quán', 'Nói rõ căn cứ, điều kiện', 'Không hối thúc, cho thời gian'], ['Ổn định · kế hoạch tương lai', 'Gia đình', 'Sức khỏe · tài chính']],
      ['Ruộng màu mỡ — người chăm lo', 'Thực tế, kỹ lưỡng, hay chăm sóc người khác. Âm thầm giúp đỡ.', ['Kỹ lưỡng', 'Thực tế', 'Chăm sóc'], ['Hay lo lắng', 'Khó từ chối'], ['Trấn an bằng thông tin, con số cụ thể', 'Thường nói lời cảm ơn', 'Chia nhỏ yêu cầu nặng'], ['Mẹo cuộc sống', 'Đồ ăn', 'Chuyện gia đình, bạn bè']],
      ['Thép cứng — người quyết đoán', 'Trọng nghĩa khí, quyết đoán, có chính nghĩa. Thẳng thắn, hiếu thắng.', ['Quyết đoán', 'Nghĩa khí', 'Thực thi'], ['Nói thẳng', 'Thiếu kiên nhẫn'], ['Đi thẳng vào trọng tâm', 'Giữ lời, giữ nghĩa', 'Tạo cảm giác cùng phe, không cạnh tranh'], ['Thể thao · thắng thua', 'Thành quả công việc', 'Tình bạn']],
      ['Viên ngọc — cầu toàn', 'Tinh tế, sắc sảo, tự trọng cao. Có gu và tiêu chuẩn cao.', ['Con mắt thẩm mỹ', 'Phân tích', 'Gọn gàng'], ['Nhạy cảm, dễ tổn thương', 'Hay phê bình'], ['Lịch sự, gọn gàng', 'Khen gu và sự tinh tế', 'Góp ý riêng, không trước mặt người khác'], ['Thời trang · làm đẹp · thiết kế', 'Đồ chất lượng', 'Chăm sóc bản thân']],
      ['Biển lớn — người tự do', 'Tư duy rộng, thông minh, thích tự do. Tò mò và biết thuận theo dòng chảy.', ['Tầm nhìn rộng', 'Trí tuệ', 'Linh hoạt'], ['Dễ chán', 'Khó đoán'], ['Nói về ý tưởng mới, bức tranh lớn', 'Không gò bó', 'Thêm chút hài hước'], ['Du lịch · thế giới', 'Ý tưởng · kinh doanh', 'Triết lý · kiến thức']],
      ['Mưa phùn — người quan sát thông thái', 'Trầm lặng nhưng thông minh, giàu tưởng tượng. Thận trọng, quan sát người giỏi.', ['Sâu sắc', 'Thận trọng', 'Tưởng tượng'], ['Suy nghĩ, lo lắng nhiều', 'Chậm mở lòng'], ['Lắng nghe, dẫn dắt bằng câu hỏi', 'Tôn trọng riêng tư', 'Xây dựng niềm tin từ từ'], ['Sách · kiến thức · tâm lý', 'Sở thích yên tĩnh', 'Trò chuyện sâu']],
    ],
    en: [
      ['Tall tree — the leader', 'Clear goals and strong drive. High pride and principles; likes to lead.', ['Drive', 'Responsibility', 'Honesty'], ['Stubborn', 'Dislikes being corrected'], ['Lead with the conclusion and plan', 'Offer options and let them decide', 'Praise effort and results specifically'], ['Goals & growth', 'Work & career', 'New challenges']],
      ['Flexible vine', 'Adaptable, sociable and perceptive. Draws strength from relationships; very considerate.', ['Adaptability', 'Warmth', 'Sensitivity'], ['Puts off decisions', 'Keeps hurt feelings inside'], ['Empathise first in a gentle tone', 'Give 2–3 easy options', 'Show small kindnesses often'], ['People & relationships', 'Hobbies & style', 'Food & travel']],
      ['The sun — mood maker', 'Bright, frank and passionate. Enjoys attention and speaks openly.', ['Positive energy', 'Frankness', 'Action'], ['Quick to heat, quick to cool', 'Misses details'], ['React big, praise specifically', 'Keep it short and lively', 'Share news and events'], ['New things & trends', 'Travel & gatherings', 'Their own stories']],
      ['Candlelight — warm and sensitive', 'Delicate, warm and deep. Reads the room and devotes care to one person.', ['Caring', 'Intuition', 'Steady devotion'], ['Sensitive', 'Worries alone'], ['Acknowledge feelings first', 'Talk slowly and deeply', 'Keep promises and details'], ['Feelings, music & film', 'Heart-to-heart talk', 'Small gifts & anniversaries']],
      ['Great mountain — dependable', 'Reliable, calm and values trust. Hard to shake; very accepting.', ['Trustworthy', 'Patience', 'Tolerance'], ['Slow to change', 'Rarely shows feelings'], ['Be calm and consistent', 'State reasons and terms clearly', 'Don’t rush — give time'], ['Stability & future plans', 'Family', 'Health & money']],
      ['Rich field — the caretaker', 'Practical, thorough, looks after people. Down-to-earth and quietly helpful.', ['Thoroughness', 'Practicality', 'Care'], ['Worries a lot', 'Finds it hard to say no'], ['Reassure with concrete info and numbers', 'Say thank you often', 'Split heavy requests'], ['Everyday tips', 'Food', 'Family & friends news']],
      ['Steel — the decisive one', 'Loyal, quick to decide, strong sense of justice. Straightforward and competitive.', ['Decisiveness', 'Loyalty', 'Execution'], ['Blunt', 'Short patience'], ['Skip the small talk — get to the point', 'Keep promises', 'Feel like the same team, not rivals'], ['Sports & competition', 'Work results', 'Friendship']],
      ['Jewel — the perfectionist', 'Refined, sharp and proud. Great taste and high standards.', ['Eye for quality', 'Analysis', 'Neatness'], ['Sensitive, easily hurt', 'Critical'], ['Be polite and tidy', 'Compliment their taste', 'Suggest privately, never correct in public'], ['Fashion, beauty & design', 'Quality things', 'Self-care']],
      ['Ocean — the free spirit', 'Broad-minded, wise, loves freedom. Curious and goes with the flow.', ['Big picture', 'Wisdom', 'Flexibility'], ['Gets bored easily', 'Hard to read'], ['Talk new ideas and the big picture', 'Don’t box them in', 'Add humour'], ['Travel & the world', 'Ideas & business', 'Philosophy & knowledge']],
      ['Drizzle — the wise observer', 'Quiet but bright with rich imagination. Careful and observant.', ['Insight', 'Caution', 'Imagination'], ['Overthinks, worries', 'Slow to open up'], ['Listen quietly, guide with questions', 'Respect privacy', 'Build trust slowly'], ['Books, knowledge & psychology', 'Quiet hobbies', 'Deep conversations']],
    ],
  };

  // 십신 5묶음: 비겁(나·친구) 식상(표현) 재성(현실·돈) 관성(책임·규칙) 인성(배움·보호)
  const TG = {
    ko: { names: ['자기주장', '표현·재능', '현실·실속', '책임·규칙', '배움·생각'], hi: ['자기 주관이 뚜렷하고 독립심이 강합니다', '말과 표현이 풍부하고 끼가 있습니다', '현실 감각이 좋고 실속·돈 관리에 밝습니다', '책임감이 강하고 규칙·체면을 중시합니다', '생각이 깊고 배우는 걸 좋아합니다'], lo: ['남에게 맞춰 주는 편입니다', '속마음 표현이 서툴 수 있습니다', '돈·실속보다 의미를 중시합니다', '자유로운 걸 좋아하고 틀을 싫어합니다', '경험으로 배우는 행동파입니다'] },
    zh: { names: ['自我主张', '表达・才华', '现实・务实', '责任・规则', '学习・思考'], hi: ['主见鲜明，独立性强', '表达丰富，有才艺', '现实感强，善于理财务实', '责任感强，重视规则和面子', '思考深入，喜欢学习'], lo: ['倾向于迁就别人', '可能不善表达内心', '比起金钱更看重意义', '喜欢自由，不喜欢束缚', '靠经验学习的行动派'] },
    ja: { names: ['自己主張', '表現・才能', '現実・実利', '責任・ルール', '学び・思考'], hi: ['主体性がはっきりしていて自立心が強い', '言葉や表現が豊かで才能がある', '現実感覚がよく、お金の管理に強い', '責任感が強く、ルールや体面を重んじる', '考えが深く、学ぶことが好き'], lo: ['人に合わせるタイプ', '本音を伝えるのが苦手なことも', 'お金より意味を重視', '自由が好きで型にはまるのが苦手', '経験から学ぶ行動派'] },
    vi: { names: ['Cái tôi', 'Biểu đạt · tài năng', 'Thực tế · tiền bạc', 'Trách nhiệm · quy tắc', 'Học hỏi · suy nghĩ'], hi: ['Có chính kiến rõ, độc lập', 'Biểu đạt phong phú, có tài', 'Thực tế, giỏi quản lý tiền', 'Trách nhiệm cao, coi trọng quy tắc, thể diện', 'Suy nghĩ sâu, thích học'], lo: ['Hay chiều theo người khác', 'Có thể khó bày tỏ lòng mình', 'Coi trọng ý nghĩa hơn tiền bạc', 'Thích tự do, ghét gò bó', 'Người hành động, học qua trải nghiệm'] },
    en: { names: ['Self', 'Expression', 'Practical / money', 'Duty / rules', 'Learning / thought'], hi: ['Strong sense of self, independent', 'Expressive and talented', 'Practical and good with money', 'Responsible; values rules and face', 'Deep thinker who loves learning'], lo: ['Tends to go along with others', 'May find it hard to express feelings', 'Values meaning over money', 'Loves freedom, dislikes rules', 'Learns by doing'] },
  };
  const STR = {
    ko: { strong: '신강(기운이 센 편) — 주도적이고 자기 뜻대로 하고 싶어 합니다. 맞서기보다 인정해 주면 마음을 엽니다.', weak: '신약(기운이 섬세한 편) — 주변 영향을 잘 받고 지지가 필요합니다. 응원·안심시키는 말이 잘 통합니다.', mid: '균형형 — 상황에 따라 유연하게 반응합니다.' },
    zh: { strong: '身强（能量偏强）— 主导性强，想按自己的意思来。与其对抗不如认可，对方会敞开心扉。', weak: '身弱（能量偏细腻）— 容易受周围影响，需要支持。鼓励和安心的话最有效。', mid: '平衡型 — 能视情况灵活应对。' },
    ja: { strong: '身強（エネルギーが強め）— 主導的で自分の思い通りにしたいタイプ。張り合うより認めると心を開きます。', weak: '身弱（繊細なタイプ）— 周りの影響を受けやすく支えが必要。応援や安心させる言葉がよく響きます。', mid: 'バランス型 — 状況に合わせて柔軟に反応します。' },
    vi: { strong: 'Thân vượng (năng lượng mạnh) — chủ động, muốn làm theo ý mình. Công nhận họ thay vì đối đầu thì họ sẽ mở lòng.', weak: 'Thân nhược (năng lượng tinh tế) — dễ bị ảnh hưởng, cần được ủng hộ. Lời động viên, trấn an rất hiệu quả.', mid: 'Cân bằng — phản ứng linh hoạt theo tình huống.' },
    en: { strong: 'Strong chart — takes the lead and likes doing things their way. Acknowledge rather than argue and they open up.', weak: 'Delicate chart — influenced by surroundings and needs support. Encouragement and reassurance work well.', mid: 'Balanced — adapts flexibly to the situation.' },
  };
  // 부족한 오행을 채우는 행운 요소 [색, 숫자, 방향]
  const LUCK = {
    ko: { wood: ['초록', '3·8', '동쪽'], fire: ['빨강', '2·7', '남쪽'], earth: ['노랑·베이지', '5·10', '중앙'], metal: ['흰색·금색', '4·9', '서쪽'], water: ['검정·남색', '1·6', '북쪽'], h: ['행운 색', '숫자', '방향'] },
    zh: { wood: ['绿色', '3·8', '东'], fire: ['红色', '2·7', '南'], earth: ['黄色・米色', '5·10', '中'], metal: ['白色・金色', '4·9', '西'], water: ['黑色・藏青', '1·6', '北'], h: ['幸运色', '数字', '方位'] },
    ja: { wood: ['緑', '3·8', '東'], fire: ['赤', '2·7', '南'], earth: ['黄・ベージュ', '5·10', '中央'], metal: ['白・金', '4·9', '西'], water: ['黒・紺', '1·6', '北'], h: ['ラッキーカラー', '数字', '方角'] },
    vi: { wood: ['Xanh lá', '3·8', 'Đông'], fire: ['Đỏ', '2·7', 'Nam'], earth: ['Vàng · be', '5·10', 'Trung tâm'], metal: ['Trắng · vàng kim', '4·9', 'Tây'], water: ['Đen · xanh đậm', '1·6', 'Bắc'], h: ['Màu may mắn', 'Số', 'Hướng'] },
    en: { wood: ['Green', '3·8', 'East'], fire: ['Red', '2·7', 'South'], earth: ['Yellow / beige', '5·10', 'Centre'], metal: ['White / gold', '4·9', 'West'], water: ['Black / navy', '1·6', 'North'], h: ['Lucky colour', 'Numbers', 'Direction'] },
  };
  // 올해 운(세운): 올해 천간이 일간에 어떤 십신인지
  const YEAR = {
    ko: ['동료·경쟁이 많아지는 해 — 협력하면 힘이 됩니다', '표현·새 시도가 잘 풀리는 해 — 아이디어를 밀어 보세요', '돈·실속 기회가 오는 해 — 계획적으로 움직이면 좋아요', '책임·자리가 커지는 해 — 무리하지 말고 차근차근', '배움·도움이 들어오는 해 — 공부·준비에 좋아요'],
    zh: ['同伴与竞争增多的一年 — 合作就是力量', '表达和新尝试顺利的一年 — 大胆推动想法', '财运和实利机会的一年 — 有计划地行动', '责任和位置变大的一年 — 不要勉强，循序渐进', '学习和贵人相助的一年 — 适合学习和准备'],
    ja: ['仲間や競争が増える年 — 協力が力になります', '表現や新しい挑戦がうまくいく年 — アイデアを押し出して', 'お金・実利のチャンスの年 — 計画的に動くと吉', '責任や立場が大きくなる年 — 無理せずコツコツと', '学びと助けが入る年 — 勉強や準備に最適'],
    vi: ['Năm có nhiều bạn đồng hành và cạnh tranh — hợp tác là sức mạnh', 'Năm thuận cho biểu đạt, thử điều mới — hãy đẩy ý tưởng', 'Năm có cơ hội tài chính — hành động có kế hoạch', 'Năm trách nhiệm, vị trí lớn hơn — từ từ, đừng quá sức', 'Năm được học hỏi và giúp đỡ — tốt cho học tập, chuẩn bị'],
    en: ['A year of peers and competition — teamwork pays off', 'A year for expression and new tries — push your ideas', 'A year of money opportunities — move with a plan', 'A year of bigger duties — steady, don’t overdo it', 'A year of learning and support — great for study and preparation'],
  };
  const BLOOD = {
    ko: { A: '꼼꼼하고 배려심 많음 · 약속·예의를 중시', B: '자유롭고 솔직함 · 관심 있는 일에 몰입', O: '시원시원하고 리더십 · 목표 지향', AB: '합리적이고 독특함 · 거리를 두며 관찰' },
    zh: { A: '细致体贴 · 重视约定和礼节', B: '自由直率 · 对感兴趣的事很投入', O: '爽快有领导力 · 目标导向', AB: '理性独特 · 保持距离观察' },
    ja: { A: '几帳面で気配り上手 · 約束や礼儀を重視', B: '自由で率直 · 興味のあることに没頭', O: 'さっぱりしてリーダーシップ · 目標志向', AB: '合理的で個性的 · 距離を置いて観察' },
    vi: { A: 'Kỹ lưỡng, chu đáo · coi trọng lời hứa, phép lịch sự', B: 'Tự do, thẳng thắn · đam mê điều mình thích', O: 'Phóng khoáng, có tố chất lãnh đạo · hướng mục tiêu', AB: 'Lý trí, độc đáo · giữ khoảng cách quan sát' },
    en: { A: 'Careful and considerate · values promises and manners', B: 'Free-spirited and frank · dives into what they love', O: 'Easygoing leader · goal-oriented', AB: 'Rational and unique · observes from a distance' },
  };
  const SIGN = {
    ko: { aries: '도전적·직진형', taurus: '안정·감각 중시', gemini: '호기심·말솜씨', cancer: '정 많고 가족적', leo: '당당·표현력', virgo: '꼼꼼·분석형', libra: '균형·매너', scorpio: '깊은 감정·집중력', sagittarius: '자유·낙천적', capricorn: '성실·현실적', aquarius: '독창적·자유로움', pisces: '감성·공감력' },
    zh: { aries: '勇于挑战・直来直去', taurus: '重视安稳与感官', gemini: '好奇・能说会道', cancer: '重感情・顾家', leo: '自信・表现力强', virgo: '细致・分析型', libra: '平衡・有风度', scorpio: '情感深・专注', sagittarius: '自由・乐观', capricorn: '踏实・现实', aquarius: '独创・自由', pisces: '感性・共情力强' },
    ja: { aries: '挑戦的・まっすぐ', taurus: '安定・感覚重視', gemini: '好奇心・話上手', cancer: '情が深く家族思い', leo: '堂々・表現力', virgo: '几帳面・分析型', libra: 'バランス・マナー', scorpio: '深い感情・集中力', sagittarius: '自由・楽天的', capricorn: '誠実・現実的', aquarius: '独創的・自由', pisces: '感性・共感力' },
    vi: { aries: 'Thích thử thách, thẳng tiến', taurus: 'Coi trọng ổn định, cảm giác', gemini: 'Tò mò, khéo ăn nói', cancer: 'Giàu tình cảm, gia đình', leo: 'Tự tin, giỏi thể hiện', virgo: 'Kỹ lưỡng, phân tích', libra: 'Cân bằng, lịch thiệp', scorpio: 'Cảm xúc sâu, tập trung', sagittarius: 'Tự do, lạc quan', capricorn: 'Chăm chỉ, thực tế', aquarius: 'Độc đáo, tự do', pisces: 'Đa cảm, đồng cảm' },
    en: { aries: 'Bold, straight-ahead', taurus: 'Stable, sensory', gemini: 'Curious, good talker', cancer: 'Warm, family-minded', leo: 'Confident, expressive', virgo: 'Meticulous, analytical', libra: 'Balanced, polite', scorpio: 'Deep, intense focus', sagittarius: 'Free, optimistic', capricorn: 'Diligent, realistic', aquarius: 'Original, independent', pisces: 'Emotional, empathetic' },
  };
  // 나이대별 대화 팁 (말투·속도)
  const AGE = {
    ko: { 10: '20세 미만 — 쉬운 말, 짧은 문장. 개인정보·금전 이야기는 피하기', 20: '20대 — 가볍고 빠른 대화, 이모티콘·유행 화제가 잘 통함', 30: '30대 — 실속·시간 존중. 핵심 먼저, 근거는 짧게', 40: '40대 — 예의와 신뢰가 우선. 존댓말, 구체적 조건·약속', 50: '50대 이상 — 정중하고 천천히. 큰 글씨처럼 쉽게, 한 번에 하나씩' },
    zh: { 10: '未满20岁 — 用简单的话、短句。避免谈个人信息和钱', 20: '20多岁 — 轻松快速，表情和流行话题很受用', 30: '30多岁 — 尊重时间和实效。先说重点，依据简短', 40: '40多岁 — 礼貌和信任优先。用敬语，条件和约定要具体', 50: '50岁以上 — 礼貌、放慢节奏。说得简单，一次一件事' },
    ja: { 10: '20歳未満 — やさしい言葉と短い文。個人情報やお金の話は避ける', 20: '20代 — 軽くテンポよく、絵文字や流行の話題が効果的', 30: '30代 — 実利と時間を尊重。要点を先に、根拠は短く', 40: '40代 — 礼儀と信頼が第一。敬語で、条件や約束は具体的に', 50: '50代以上 — 丁寧にゆっくり。わかりやすく、一度に一つずつ' },
    vi: { 10: 'Dưới 20 tuổi — lời dễ hiểu, câu ngắn. Tránh chuyện riêng tư, tiền bạc', 20: 'Tuổi 20 — nhẹ nhàng, nhanh, emoji và chủ đề thịnh hành rất hợp', 30: 'Tuổi 30 — tôn trọng thời gian, thực tế. Nói trọng tâm trước', 40: 'Tuổi 40 — lịch sự, đáng tin là trên hết. Điều kiện, lời hứa cụ thể', 50: 'Trên 50 — lịch sự, chậm rãi. Dễ hiểu, mỗi lần một việc' },
    en: { 10: 'Under 20 — simple words, short sentences. Avoid personal-data and money talk', 20: '20s — light and quick; emoji and trending topics work', 30: '30s — respect their time. Point first, reasons short', 40: '40s — courtesy and trust first. Clear terms and promises', 50: '50+ — polite and unhurried. Keep it simple, one thing at a time' },
  };
  const UI = {
    ko: { nopro: 'AI 리포트는 프로·기업 요금제에서 쓸 수 있어요', title: '성향·성격', sub: '사주·띠·별자리·혈액형으로 본 참고용 분석', tips: '이렇게 말하면 좋아요', avoid: '주의', likes: '좋아하는 화제', str: '강점', tg: '성향 분포 (십신)', year: '올해 운', luck: '보완 기운', age: '나이대 팁', need: '생일(연·월·일)을 알면 사주 성향까지 볼 수 있어요', more: '사주·궁합 자세히', ai: 'AI 상세 성격 리포트', aiwait: 'AI가 분석 중…', zod: '띠', sign: '별자리', blood: '혈액형', fun: '재미·참고용입니다. 사람을 단정 짓지 마세요.', est: '(나이로 추정)', dm: '타고난 기질' },
    zh: { nopro: 'AI 报告仅限专业版・企业版使用', title: '性格・倾向', sub: '根据四柱・生肖・星座・血型的参考分析', tips: '这样说更好', avoid: '注意', likes: '喜欢的话题', str: '强项', tg: '性格分布（十神）', year: '今年运势', luck: '补益能量', age: '年龄段建议', need: '知道生日（年・月・日）就能看四柱性格', more: '查看四柱・配对详情', ai: 'AI 详细性格报告', aiwait: 'AI 分析中…', zod: '生肖', sign: '星座', blood: '血型', fun: '仅供娱乐和参考，请勿给人下定论。', est: '（按年龄推算）', dm: '天生气质' },
    ja: { nopro: 'AI レポートはプロ・企業プランで使えます', title: '性格・傾向', sub: '四柱・干支・星座・血液型による参考分析', tips: 'こう話すと◎', avoid: '注意', likes: '好きな話題', str: '強み', tg: '傾向の分布（十神）', year: '今年の運', luck: '補う気', age: '年代別のコツ', need: '誕生日（年・月・日）がわかると四柱の性格も見られます', more: '四柱・相性を詳しく', ai: 'AI 詳しい性格レポート', aiwait: 'AI が分析中…', zod: '干支', sign: '星座', blood: '血液型', fun: '楽しむための参考です。人を決めつけないでください。', est: '（年齢から推定）', dm: '生まれ持った気質' },
    vi: { nopro: 'Báo cáo AI dành cho gói Pro · Doanh nghiệp', title: 'Tính cách · khuynh hướng', sub: 'Phân tích tham khảo theo tứ trụ, con giáp, cung hoàng đạo, nhóm máu', tips: 'Nên nói thế này', avoid: 'Lưu ý', likes: 'Chủ đề yêu thích', str: 'Điểm mạnh', tg: 'Phân bố khuynh hướng (thập thần)', year: 'Vận năm nay', luck: 'Năng lượng bổ sung', age: 'Mẹo theo độ tuổi', need: 'Biết ngày sinh (năm-tháng-ngày) sẽ xem được tính cách theo tứ trụ', more: 'Xem chi tiết tứ trụ · hợp tuổi', ai: 'Báo cáo tính cách chi tiết bằng AI', aiwait: 'AI đang phân tích…', zod: 'Con giáp', sign: 'Cung', blood: 'Nhóm máu', fun: 'Chỉ để tham khảo, vui vẻ. Đừng đánh giá con người qua đây.', est: '(ước tính theo tuổi)', dm: 'Khí chất bẩm sinh' },
    en: { nopro: 'The AI report is available on Pro and Business plans', title: 'Personality', sub: 'For reference — from saju, zodiac, star sign and blood type', tips: 'Say it like this', avoid: 'Careful', likes: 'Favourite topics', str: 'Strengths', tg: 'Tendencies (ten gods)', year: 'This year', luck: 'Balancing energy', age: 'Age tip', need: 'With a full birth date (year-month-day) you also get the saju personality', more: 'Saju & compatibility details', ai: 'AI detailed personality report', aiwait: 'AI is analysing…', zod: 'Zodiac', sign: 'Star sign', blood: 'Blood type', fun: 'For fun and reference only. Don’t judge people by it.', est: '(estimated from age)', dm: 'Inborn temperament' },
  };

  const GEN = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
  const CTRL = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };
  // 일간 기준 오행 관계 → 십신 묶음 0 비겁 1 식상 2 재성 3 관성 4 인성
  function group(dm, el) { if (el === dm) return 0; if (GEN[dm] === el) return 1; if (CTRL[dm] === el) return 2; if (CTRL[el] === dm) return 3; if (GEN[el] === dm) return 4; return 0; }
  // 지지 속 기운(지장간) 중 본기만 반영한 간단 버전 + 월지 가중
  function analyze(s) {
    if (!s || !global.Saju) return null;
    const S = global.Saju; const dm = s.dayMasterEl;
    const g = [0, 0, 0, 0, 0];
    s.pillars.forEach((p) => {
      if (p.key !== 'day') g[group(dm, S.STEM_EL[p.stem])] += 1; // 일간 자신은 제외
      g[group(dm, S.BRANCH_EL[p.branch])] += p.key === 'month' ? 2 : 1; // 월지는 힘이 큼
    });
    const tot = g.reduce((a, b) => a + b, 0) || 1;
    const support = g[0] + g[4]; const other = tot - support;
    const strength = support >= other + 2 ? 'strong' : other >= support + 2 ? 'weak' : 'mid';
    // 용신(간단): 신강이면 일간을 빼 주는 기운(식상·재성 중 약한 쪽), 신약이면 돕는 기운(인성·비겁 중 약한 쪽), 부족 오행 우선
    const els = S.ELEMENTS;
    let useful;
    const elOfGroup = (gi) => els.find((e) => group(dm, e) === gi);
    if (s.lacking.length) useful = s.lacking[0];
    else if (strength === 'strong') useful = g[1] <= g[2] ? elOfGroup(1) : elOfGroup(2);
    else if (strength === 'weak') useful = g[4] <= g[0] ? elOfGroup(4) : elOfGroup(0);
    else useful = els.reduce((a, e) => (s.counts[e] < s.counts[a] ? e : a), els[0]);
    // 올해 천간
    const y = new Date().getFullYear(); const yStem = ((y - 4) % 10 + 10) % 10;
    const yearG = group(dm, S.STEM_EL[yStem]);
    return { groups: g.map((v) => Math.round((v / tot) * 100)), raw: g, strength, useful, yearG, yearStem: yStem, yearBranch: ((y - 4) % 12 + 12) % 12 };
  }
  function ageGroup(age) { const a = Number(age); if (!a) return null; return a < 20 ? 10 : a < 30 ? 20 : a < 40 ? 30 : a < 50 ? 40 : 50; }
  const lang = (l) => (L5.includes(l) ? l : 'en');

  global.Persona = {
    DM, TG, STR, LUCK, YEAR, BLOOD, SIGN, AGE, UI, analyze, group, ageGroup,
    dm(stem, l) { return DM[lang(l)][stem]; },
    t(l) { return UI[lang(l)]; },
    lang,
  };
})(typeof window !== 'undefined' ? window : globalThis);
