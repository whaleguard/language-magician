/* 성향 분석 확장 데이터 — 일간 상세(관계·일·스트레스·위로·결정·선물·칭찬),
   혈액형·별자리·띠·MBTI 상세, 신살(도화·역마·화개·천을귀인), 성별 관계 기운, 대운·월운.
   모두 재미·참고용이며 사람을 단정 짓지 않도록 부드럽게 씁니다. */
(function (global) {
  'use strict';
  const P = global.Persona; if (!P) return;

  // 일간 상세: [관계 스타일, 일·돈 스타일, 스트레스 받는 상황, 위로·응원법, 결정 방식, 좋아할 선물, 통하는 칭찬]
  P.DMX = {
    ko: [
      ['먼저 다가가고 이끄는 편. 믿음이 생기면 한결같아요', '목표를 세우고 밀어붙이는 개척형', '무시당하거나 간섭받을 때', '"당신 판단이 맞았어요"처럼 인정해 주기', '스스로 정하고 싶어 함 — 정보를 주고 기다리기', '성장에 도움 되는 것(책·강의·좋은 도구)', '리더십·추진력'],
      ['관계를 소중히 하고 맞춰 주는 편. 작은 관심에 크게 기뻐해요', '사람을 통해 기회를 만드는 연결형', '외면당하거나 혼자 남겨질 때', '곁에 있다는 걸 자주 표현하기', '주변 의견을 듣고 천천히 정함', '예쁘고 실용적인 소품·꽃', '센스·배려심'],
      ['솔직하고 뜨겁게 표현. 표현해 주는 사람을 좋아해요', '앞에 나서서 분위기를 띄우는 홍보형', '반응이 없거나 지루할 때', '크게 리액션하고 함께 웃어 주기', '느낌이 오면 빠르게 결정', '눈에 띄는 체험·이벤트·화제의 아이템', '밝은 에너지·용기'],
      ['한 사람에게 깊이 정성을 쏟음. 세심한 기억을 감동으로 받아요', '디테일을 챙기는 완성형', '무심한 말·약속을 어길 때', '감정을 먼저 알아주고 조용히 들어 주기', '감정과 직감을 따라 정함', '손편지·기념일을 기억한 선물', '따뜻함·섬세함'],
      ['천천히 가까워지지만 한번 믿으면 오래감', '안정적으로 지키고 쌓는 관리형', '갑작스러운 변화·재촉', '시간을 주고 "천천히 해도 돼요"', '충분히 따져 보고 신중하게', '오래 쓰는 품질 좋은 물건·건강용품', '믿음직함·꾸준함'],
      ['조용히 챙겨 주는 헌신형. 고마움을 알아주면 힘이 나요', '꼼꼼하게 살림하고 아끼는 실속형', '일이 한꺼번에 몰리거나 고마움을 몰라줄 때', '"덕분이에요" 하고 구체적으로 고마움 표현', '현실적인 손익을 따져 정함', '먹거리·생활에 바로 쓰는 실용품', '세심함·성실함'],
      ['의리 있고 화끈함. 약속을 지키는 사람을 신뢰해요', '결단과 실행으로 성과를 내는 해결사형', '뒤에서 말을 바꾸거나 불의를 볼 때', '편이 되어 주고 문제 해결을 같이 고민', '빠르고 단호하게', '운동·취미 장비, 확실한 고급품', '결단력·의리'],
      ['기준이 높고 신중하게 고름. 존중받는 느낌이 중요해요', '품질과 완성도로 승부하는 전문가형', '무례함·공개적인 지적', '자존심을 지켜 주며 부드럽게 다독이기', '비교·분석 후 확신이 들 때', '센스 있는 브랜드·디자인 소품', '안목·세련됨'],
      ['자유로운 관계를 선호. 구속보다 함께 성장하길 원해요', '아이디어로 판을 키우는 기획형', '틀에 갇히거나 같은 일 반복', '새 계획·여행 이야기로 기분 전환', '큰 그림을 보고 직관적으로', '여행·경험·새로운 것', '시야·지혜'],
      ['마음을 늦게 열지만 깊이 신뢰함. 비밀을 지켜 주는 사람을 좋아해요', '조용히 분석하고 전략을 짜는 참모형', '사생활 침해·재촉', '말없이 기다려 주고 필요한 것만 묻기', '오래 생각하고 확신이 들 때', '책·향·조용히 즐기는 취미용품', '통찰력·배려 깊음'],
    ],
    zh: [
      ['主动靠近并带领对方。一旦信任就始终如一', '定目标并全力推进的开拓型', '被忽视或被干涉时', '说"你的判断是对的"来认可', '想自己决定 — 给信息后等待', '有助成长的东西（书・课程・好工具）', '领导力・推动力'],
      ['珍惜关系、善于配合。小小的关心就会很开心', '通过人脉创造机会的连接型', '被冷落或被留下一个人时', '经常表达"我在你身边"', '听取周围意见后慢慢决定', '好看又实用的小物・鲜花', '品味・体贴'],
      ['坦率热烈地表达。喜欢会表达的人', '站在前面带动气氛的宣传型', '没反应或无聊时', '大大回应，一起笑', '感觉对了就很快决定', '显眼的体验・活动・话题商品', '开朗能量・勇气'],
      ['对一个人深深用心。记得细节会让对方感动', '照顾细节的完成型', '冷淡的话・不守约', '先体察情绪，安静倾听', '凭感受和直觉决定', '手写信・记得纪念日的礼物', '温暖・细腻'],
      ['慢慢变熟，一旦信任就很长久', '稳定守护与积累的管理型', '突然的变化・催促', '给时间，说"慢慢来没关系"', '充分权衡后谨慎决定', '耐用的好品质物品・健康用品', '可靠・坚持'],
      ['默默照顾的付出型。被感谢会更有动力', '细心持家、节俭务实型', '事情一下子堆积或付出不被感谢时', '具体说"多亏了你"', '计算现实得失后决定', '吃的・马上能用的实用品', '细心・踏实'],
      ['讲义气、爽快。信任守约的人', '以决断和执行出成果的解决型', '背后变卦或看到不公时', '站在对方一边，一起想办法', '快速果断', '运动・爱好装备、确实的高档品', '决断力・义气'],
      ['标准高、选择谨慎。被尊重的感觉很重要', '以品质和完成度取胜的专家型', '无礼・当众指出', '照顾面子，温柔安抚', '比较分析后有把握时', '有品味的品牌・设计小物', '眼光・精致'],
      ['喜欢自由的关系。比起束缚更想一起成长', '用点子把局面做大的策划型', '被框住或重复同样的事', '聊新计划・旅行来转换心情', '看大局凭直觉', '旅行・体验・新事物', '视野・智慧'],
      ['慢热但信任很深。喜欢能保守秘密的人', '安静分析、制定策略的参谋型', '隐私被侵犯・被催促', '默默等待，只问需要的', '想很久，有把握时', '书・香氛・安静享受的爱好用品', '洞察力・体贴深'],
    ],
    ja: [
      ['自分から近づきリードするタイプ。信頼すると一途', '目標を立てて押し進める開拓型', '無視や干渉をされたとき', '「あなたの判断は正しかった」と認める', '自分で決めたい — 情報を渡して待つ', '成長に役立つもの（本・講座・良い道具）', 'リーダーシップ・推進力'],
      ['関係を大切にし合わせ上手。小さな気遣いで大喜び', '人を通じてチャンスを作るつなぎ役', '素っ気なくされたり一人にされたとき', 'そばにいることをこまめに伝える', '周りの意見を聞いてゆっくり決める', 'かわいくて実用的な小物・花', 'センス・気配り'],
      ['率直で情熱的に表現。表現してくれる人が好き', '前に出て場を盛り上げる広報型', '反応がない・退屈なとき', '大きくリアクションして一緒に笑う', 'ピンときたらすぐ決める', '目立つ体験・イベント・話題のアイテム', '明るいエネルギー・勇気'],
      ['一人に深く真心を注ぐ。細かいことを覚えていると感動', '細部まで仕上げる完成型', '無神経な言葉・約束破り', 'まず気持ちをくみ取り静かに聞く', '感情と直感で決める', '手紙・記念日を覚えた贈り物', '温かさ・繊細さ'],
      ['ゆっくり近づくが一度信じると長続き', '安定して守り積み上げる管理型', '急な変化・急かされること', '時間をあげて「ゆっくりでいいですよ」', 'よく考えて慎重に', '長く使える上質な物・健康グッズ', '頼もしさ・粘り強さ'],
      ['静かに支える献身型。感謝されると力が出る', '几帳面にやりくりする実利型', '仕事が一度に重なる・感謝されないとき', '「おかげさまで」と具体的に感謝', '現実的な損得で決める', '食べ物・すぐ使える実用品', '細やかさ・誠実さ'],
      ['義理堅く豪快。約束を守る人を信頼', '決断と実行で成果を出す解決型', '陰で話を変える・不正を見たとき', '味方になって一緒に解決策を考える', '素早くきっぱり', 'スポーツ・趣味の道具、確かな高級品', '決断力・義理堅さ'],
      ['基準が高く慎重に選ぶ。尊重されている感覚が大切', '品質と完成度で勝負する専門家型', '無礼・人前での指摘', 'プライドを守りながらやさしく励ます', '比較・分析して確信したとき', 'センスのあるブランド・デザイン小物', '審美眼・洗練'],
      ['自由な関係が好き。縛るより一緒に成長したい', 'アイデアで話を大きくする企画型', '型にはめられる・同じことの繰り返し', '新しい計画や旅行の話で気分転換', '全体像を見て直感で', '旅行・体験・新しいもの', '視野・知恵'],
      ['心を開くのは遅いが深く信頼。秘密を守る人が好き', '静かに分析し戦略を立てる参謀型', 'プライバシーの侵害・急かされること', '黙って待ち、必要なことだけ聞く', '長く考え確信したとき', '本・香り・静かに楽しむ趣味の物', '洞察力・思慮深さ'],
    ],
    vi: [
      ['Chủ động tiến tới và dẫn dắt. Khi đã tin thì rất chung thủy', 'Kiểu tiên phong: đặt mục tiêu và theo đến cùng', 'Khi bị coi thường hoặc bị can thiệp', 'Công nhận: "Bạn đã quyết định đúng"', 'Muốn tự quyết — đưa thông tin rồi chờ', 'Thứ giúp phát triển (sách, khóa học, dụng cụ tốt)', 'Khả năng lãnh đạo, quyết tâm'],
      ['Trân trọng các mối quan hệ, giỏi chiều người. Vui nhiều vì quan tâm nhỏ', 'Kiểu kết nối: tạo cơ hội qua con người', 'Khi bị lạnh nhạt hoặc bỏ lại một mình', 'Thường xuyên cho biết bạn luôn ở bên', 'Nghe ý kiến xung quanh rồi quyết từ từ', 'Đồ nhỏ xinh mà hữu ích, hoa', 'Tinh tế, chu đáo'],
      ['Thể hiện thẳng thắn, nồng nhiệt. Thích người biết bày tỏ', 'Kiểu quảng bá: đứng trước, khuấy động không khí', 'Khi không ai phản hồi hoặc nhàm chán', 'Phản ứng nhiệt tình, cùng cười', 'Thấy đúng là quyết ngay', 'Trải nghiệm, sự kiện, món hot', 'Năng lượng tươi sáng, dũng cảm'],
      ['Dành trọn tâm ý cho một người. Cảm động khi được nhớ chi tiết', 'Kiểu hoàn thiện: chăm chút từng chi tiết', 'Lời nói vô tâm, thất hứa', 'Thấu hiểu cảm xúc trước, lặng lẽ lắng nghe', 'Theo cảm xúc và trực giác', 'Thư tay, quà nhớ ngày kỷ niệm', 'Ấm áp, tinh tế'],
      ['Thân chậm nhưng đã tin thì bền lâu', 'Kiểu quản lý: giữ vững và tích lũy', 'Thay đổi đột ngột, bị hối thúc', 'Cho thời gian: "Cứ từ từ nhé"', 'Cân nhắc kỹ, thận trọng', 'Đồ bền chất lượng tốt, đồ sức khỏe', 'Đáng tin, bền bỉ'],
      ['Tận tụy chăm sóc âm thầm. Được ghi nhận là có thêm động lực', 'Kiểu thực tế: chi tiêu khéo, tiết kiệm', 'Việc dồn cùng lúc hoặc không được cảm ơn', 'Cảm ơn cụ thể: "Nhờ có bạn đấy"', 'Tính toán được mất thực tế', 'Đồ ăn, đồ dùng hằng ngày', 'Chu đáo, chăm chỉ'],
      ['Trọng nghĩa, phóng khoáng. Tin người giữ lời', 'Kiểu giải quyết: quyết đoán và hành động', 'Bị nói sau lưng, thấy bất công', 'Đứng về phía họ, cùng tìm cách giải quyết', 'Nhanh và dứt khoát', 'Dụng cụ thể thao, sở thích; đồ cao cấp chắc chắn', 'Quyết đoán, nghĩa khí'],
      ['Tiêu chuẩn cao, chọn lựa kỹ. Cảm giác được tôn trọng rất quan trọng', 'Kiểu chuyên gia: thắng bằng chất lượng', 'Thô lỗ, bị góp ý trước mặt người khác', 'Giữ thể diện, an ủi nhẹ nhàng', 'Khi đã so sánh, phân tích và chắc chắn', 'Đồ thương hiệu, thiết kế tinh tế', 'Con mắt thẩm mỹ, sang trọng'],
      ['Thích mối quan hệ tự do. Muốn cùng phát triển hơn là ràng buộc', 'Kiểu hoạch định: phát triển bằng ý tưởng', 'Bị gò bó, làm đi làm lại một việc', 'Đổi tâm trạng bằng chuyện kế hoạch mới, du lịch', 'Nhìn bức tranh lớn, theo trực giác', 'Du lịch, trải nghiệm, điều mới', 'Tầm nhìn, trí tuệ'],
      ['Chậm mở lòng nhưng tin rất sâu. Thích người giữ bí mật', 'Kiểu quân sư: lặng lẽ phân tích, lập chiến lược', 'Bị xâm phạm riêng tư, bị hối thúc', 'Im lặng chờ đợi, chỉ hỏi điều cần', 'Suy nghĩ lâu, khi đã chắc chắn', 'Sách, nước hoa, đồ cho sở thích yên tĩnh', 'Sâu sắc, chu đáo'],
    ],
    en: [
      ['Takes the first step and leads. Once they trust you, they’re steady', 'Pioneer: sets goals and pushes through', 'Being ignored or micromanaged', 'Affirm them: “You called it right”', 'Wants to decide themselves — give info, then wait', 'Things that help them grow (books, courses, good tools)', 'Leadership and drive'],
      ['Values relationships and adapts. Small attention makes them very happy', 'Connector: creates chances through people', 'Being left out or alone', 'Show often that you’re there', 'Listens to others, decides slowly', 'Pretty but practical items, flowers', 'Taste and thoughtfulness'],
      ['Expresses openly and warmly. Loves people who express back', 'Promoter: steps forward and lifts the mood', 'No reaction, or boredom', 'React big and laugh together', 'Decides fast when it feels right', 'Eye-catching experiences, events, trending items', 'Bright energy and courage'],
      ['Devotes deep care to one person. Moved when you remember details', 'Finisher: polishes every detail', 'Careless words, broken promises', 'Acknowledge feelings first; listen quietly', 'Goes with feelings and intuition', 'Handwritten notes, gifts that remember a date', 'Warmth and sensitivity'],
      ['Warms up slowly, but trust lasts long', 'Steward: protects and builds steadily', 'Sudden change, being rushed', 'Give time: “Take your time”', 'Weighs things carefully', 'Durable quality items, health goods', 'Reliability and consistency'],
      ['Quietly devoted carer. Energised by being appreciated', 'Practical manager: thrifty and careful', 'Too much at once, or being taken for granted', 'Thank them specifically: “Thanks to you…”', 'Weighs real costs and benefits', 'Food, everyday practical items', 'Attentiveness and diligence'],
      ['Loyal and bold. Trusts people who keep their word', 'Problem-solver: results through decisive action', 'Backstabbing or injustice', 'Take their side; solve it together', 'Fast and firm', 'Sports or hobby gear, solid premium items', 'Decisiveness and loyalty'],
      ['High standards, chooses carefully. Feeling respected matters', 'Specialist: wins on quality and finish', 'Rudeness, public criticism', 'Protect their pride; reassure gently', 'After comparing and feeling sure', 'Tasteful brands, design pieces', 'Taste and refinement'],
      ['Prefers free relationships — growing together, not tied down', 'Planner: grows things with ideas', 'Being boxed in or repetition', 'Lift the mood with new plans or travel talk', 'Big picture, intuitive', 'Travel, experiences, new things', 'Vision and wisdom'],
      ['Slow to open up but trusts deeply. Likes people who keep secrets', 'Strategist: analyses quietly and plans', 'Invasion of privacy, being rushed', 'Wait quietly; ask only what’s needed', 'Thinks long, decides when sure', 'Books, scents, quiet-hobby items', 'Insight and depth'],
    ],
  };

  // 혈액형 상세: [성격, 이렇게 말하면 좋아요[2], 주의, 관계 스타일]
  P.BLOODP = {
    ko: { A: ['책임감 있고 꼼꼼하며 주변을 먼저 살핌. 계획대로 되는 걸 좋아함', ['약속 시간·순서를 미리 알려 주기', '배려에 고마움을 꼭 표현'], '갑작스러운 변경·무례한 농담', '천천히 신뢰를 쌓고 진지하게 관계를 이어감'], B: ['솔직하고 자유로우며 호기심이 많음. 좋아하는 것엔 푹 빠짐', ['관심사를 물어보고 신나게 들어 주기', '형식보다 재미있게'], '간섭·규칙 강요', '편하고 즐거운 관계를 좋아하고 감정 표현이 솔직함'], O: ['시원시원하고 목표가 분명하며 사람을 잘 챙김', ['핵심과 결과를 먼저', '믿고 맡긴다는 느낌 주기'], '우유부단함·뒤에서 하는 말', '한번 내 사람이면 든든하게 챙기는 편'], AB: ['합리적이고 독특하며 감정을 잘 드러내지 않음. 거리감을 중시', ['논리적으로 차분하게', '혼자만의 시간을 존중'], '감정적인 압박·지나친 친한 척', '적당한 거리에서 신뢰가 쌓이면 깊어짐'] },
    zh: { A: ['有责任感、细致，先照顾周围。喜欢按计划进行', ['提前告知时间和顺序', '一定要感谢对方的体贴'], '突然变更・无礼的玩笑', '慢慢建立信任，认真经营关系'], B: ['直率自由，好奇心强。对喜欢的事很投入', ['问兴趣并兴致勃勃地听', '比起形式更要有趣'], '干涉・强加规则', '喜欢轻松愉快的关系，情感表达直接'], O: ['爽快，目标明确，会照顾人', ['先说重点和结果', '让对方感到被信任'], '优柔寡断・背后说话', '一旦是自己人就很照顾'], AB: ['理性独特，不轻易表露情感。重视距离感', ['冷静讲道理', '尊重独处时间'], '情绪施压・过度装熟', '保持适当距离，信任积累后会变深'] },
    ja: { A: ['責任感があり几帳面で周りを先に気にかける。計画通りが好き', ['時間や順番を前もって伝える', '気遣いへの感謝を必ず伝える'], '急な変更・失礼な冗談', 'ゆっくり信頼を築き、真剣に関係を続ける'], B: ['率直で自由、好奇心旺盛。好きなことには夢中', ['関心事を聞いて楽しそうに聞く', '形式より楽しく'], '干渉・ルールの押し付け', '気楽で楽しい関係が好きで感情表現が素直'], O: ['さっぱりして目標がはっきり、面倒見が良い', ['要点と結果を先に', '任せて信頼している感じを出す'], '優柔不断・陰口', '一度身内になると頼もしく面倒を見る'], AB: ['合理的で個性的、感情をあまり見せない。距離感を重視', ['論理的に落ち着いて', '一人の時間を尊重'], '感情的なプレッシャー・なれなれしさ', '程よい距離で信頼が積もると深まる'] },
    vi: { A: ['Có trách nhiệm, kỹ lưỡng, để ý người xung quanh. Thích theo kế hoạch', ['Báo trước giờ giấc, thứ tự', 'Luôn cảm ơn sự chu đáo của họ'], 'Thay đổi đột ngột, đùa thiếu lịch sự', 'Xây niềm tin từ từ, nghiêm túc với mối quan hệ'], B: ['Thẳng thắn, tự do, tò mò. Say mê điều mình thích', ['Hỏi về sở thích và hào hứng lắng nghe', 'Vui vẻ hơn là khuôn phép'], 'Can thiệp, áp đặt quy tắc', 'Thích quan hệ thoải mái, vui vẻ; bày tỏ cảm xúc thẳng'], O: ['Phóng khoáng, mục tiêu rõ, hay chăm lo người khác', ['Nói trọng tâm và kết quả trước', 'Cho họ cảm giác được tin tưởng'], 'Do dự, nói sau lưng', 'Đã là người thân thì chăm lo hết mình'], AB: ['Lý trí, độc đáo, ít bộc lộ cảm xúc. Coi trọng khoảng cách', ['Bình tĩnh, logic', 'Tôn trọng thời gian riêng'], 'Áp lực cảm xúc, thân mật quá mức', 'Giữ khoảng cách vừa phải, tin rồi sẽ sâu sắc'] },
    en: { A: ['Responsible and careful; looks after others first. Likes plans', ['Share times and steps in advance', 'Always thank them for their consideration'], 'Sudden changes, rude jokes', 'Builds trust slowly and takes relationships seriously'], B: ['Frank, free and curious. Dives into what they love', ['Ask about their interests and listen with enthusiasm', 'Keep it fun, not formal'], 'Interference, imposed rules', 'Likes easy, fun relationships; expresses feelings openly'], O: ['Easygoing, goal-driven and caring', ['Lead with the point and the result', 'Show you trust them'], 'Indecision, talking behind backs', 'Once you’re “their person”, they look after you'], AB: ['Rational and unique; keeps feelings private and values space', ['Be calm and logical', 'Respect their alone time'], 'Emotional pressure, over-familiarity', 'Deepens with trust, at a comfortable distance'] },
  };

  // 별자리 상세: [원소, 성격, 이렇게 말하면 좋아요, 주의, 관계 스타일]
  const SG = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
  const SEL = ['fire', 'earth', 'air', 'water', 'fire', 'earth', 'air', 'water', 'fire', 'earth', 'air', 'water'];
  const SP = {
    ko: [['열정적이고 솔직한 개척자. 경쟁과 도전에서 힘이 남', '짧고 시원하게, 새로운 제안으로', '느린 답·장황한 설명', '마음에 들면 먼저 다가감'], ['차분하고 감각적이며 꾸준함. 안정과 편안함을 중시', '여유 있게, 맛·물건 같은 감각적 화제로', '재촉·잦은 변경', '천천히 깊어지는 안정형'], ['재치 있고 호기심이 많음. 대화 자체를 즐김', '가볍고 다양한 화제를 빠르게', '지루한 반복·무거운 분위기', '말이 잘 통하는 사람에게 끌림'], ['정이 많고 보호 본능이 강함. 가족·추억을 소중히', '따뜻하게 안부를 묻고 공감', '차가운 말투·무관심', '마음을 연 사람을 끝까지 챙김'], ['당당하고 표현력이 풍부함. 인정받을 때 빛남', '진심 어린 칭찬과 관심', '무시·체면 깎기', '화끈하고 로맨틱하게 표현'], ['꼼꼼하고 분석적이며 실용적. 도움이 되는 걸 좋아함', '정확한 정보·구체적인 계획', '대충·실수 반복', '작은 배려로 마음을 보여 줌'], ['균형 감각과 매너가 좋음. 조화로운 분위기 선호', '부드럽고 예의 있게, 선택지를 제시', '갈등·거친 말', '함께 있을 때 편안한 관계를 원함'], ['감정이 깊고 집중력이 강함. 진정성을 중시', '진지하게, 비밀을 지켜 주기', '가벼운 거짓말·떠보기', '깊고 강한 유대를 원함'], ['자유롭고 낙천적이며 모험을 좋아함', '여행·계획·유머로 신나게', '구속·잔소리', '친구 같은 자유로운 관계'], ['성실하고 현실적이며 책임감이 강함', '목표·성과 중심으로 차분하게', '무책임·허세', '시간이 지날수록 믿음이 깊어짐'], ['독창적이고 자유로우며 생각이 독특함', '새로운 아이디어·사회 이야기', '틀에 박힌 기대·간섭', '친구처럼 대등한 관계'], ['감성이 풍부하고 공감력이 뛰어남', '부드럽게 감정을 나누기', '냉정한 비판·현실 강요', '헌신적이고 낭만적']],
    zh: [['热情直率的开拓者。在竞争和挑战中获得力量', '简短爽快，用新提议', '回复慢・冗长说明', '喜欢就主动靠近'], ['沉稳、重感官、有恒心。重视安稳舒适', '从容地聊美食・好物等感官话题', '催促・频繁变更', '慢慢变深的安稳型'], ['机智、好奇。享受聊天本身', '轻松快速地换多种话题', '无聊重复・沉重气氛', '被聊得来的人吸引'], ['重感情、保护欲强。珍惜家人和回忆', '温暖地问候并共情', '冷淡语气・漠不关心', '对敞开心扉的人照顾到底'], ['自信、表现力丰富。被认可时闪闪发光', '真诚的称赞和关注', '无视・让其丢面子', '热烈浪漫地表达'], ['细致、善分析、务实。喜欢有帮助的事', '准确信息・具体计划', '马虎・反复犯错', '用小体贴表达心意'], ['有平衡感和风度。喜欢和谐的气氛', '温和有礼，给出选项', '冲突・粗鲁的话', '希望在一起时很舒服'], ['情感深、专注力强。重视真诚', '认真，保守秘密', '小谎言・试探', '想要深厚强烈的连结'], ['自由乐观，喜欢冒险', '用旅行・计划・幽默聊得开心', '束缚・唠叨', '像朋友一样自由的关系'], ['踏实、现实、责任感强', '围绕目标和成果冷静沟通', '不负责任・虚张声势', '时间越久信任越深'], ['独创、自由、想法独特', '新点子・社会话题', '刻板期待・干涉', '像朋友一样平等的关系'], ['感性丰富、共情力强', '温柔地分享感受', '冷酷批评・强加现实', '奉献且浪漫']],
    ja: [['情熱的で率直な開拓者。競争や挑戦で力が湧く', '短くさっぱり、新しい提案で', '遅い返信・長い説明', '気に入ったら自分から近づく'], ['落ち着いて感覚的、粘り強い。安定と心地よさを重視', 'ゆったり、食べ物や物など感覚的な話題で', '急かす・頻繁な変更', 'ゆっくり深まる安定型'], ['機転が利き好奇心旺盛。会話そのものを楽しむ', '軽く多様な話題をテンポよく', '退屈な繰り返し・重い雰囲気', '話が合う人に惹かれる'], ['情が深く守ってあげたいタイプ。家族や思い出を大切に', '温かく近況を聞いて共感', '冷たい口調・無関心', '心を開いた人をとことん大切に'], ['堂々として表現豊か。認められると輝く', '心からの褒め言葉と関心', '無視・メンツをつぶす', '豪快でロマンチックに表現'], ['几帳面で分析的、実用的。役に立つことが好き', '正確な情報・具体的な計画', 'いい加減・ミスの繰り返し', '小さな気遣いで気持ちを示す'], ['バランス感覚とマナーが良い。調和を好む', 'やわらかく丁寧に、選択肢を示す', '対立・乱暴な言葉', '一緒にいて楽な関係を望む'], ['感情が深く集中力が強い。誠実さを重視', '真剣に、秘密を守る', '小さな嘘・探り', '深く強い絆を求める'], ['自由で楽天的、冒険好き', '旅行・計画・ユーモアで楽しく', '束縛・小言', '友達のような自由な関係'], ['誠実で現実的、責任感が強い', '目標や成果中心に落ち着いて', '無責任・見栄', '時間とともに信頼が深まる'], ['独創的で自由、考えがユニーク', '新しいアイデア・社会の話', '型にはまった期待・干渉', '友達のような対等な関係'], ['感受性豊かで共感力が高い', 'やさしく気持ちを分かち合う', '冷たい批判・現実の押し付け', '献身的でロマンチック']],
    vi: [['Người tiên phong nhiệt huyết, thẳng thắn. Mạnh lên khi cạnh tranh, thử thách', 'Ngắn gọn, dứt khoát, đưa đề xuất mới', 'Trả lời chậm, giải thích dài dòng', 'Thích ai thì chủ động tiến tới'], ['Điềm tĩnh, giàu cảm quan, bền bỉ. Coi trọng ổn định, thoải mái', 'Thong thả, nói về đồ ăn, đồ đẹp', 'Hối thúc, thay đổi liên tục', 'Kiểu ổn định, sâu dần theo thời gian'], ['Dí dỏm, tò mò. Thích chính việc trò chuyện', 'Nhiều chủ đề nhẹ nhàng, nhanh', 'Lặp lại nhàm chán, không khí nặng nề', 'Bị cuốn hút bởi người nói chuyện hợp'], ['Giàu tình cảm, thích che chở. Trân trọng gia đình, kỷ niệm', 'Hỏi han ấm áp, đồng cảm', 'Giọng lạnh lùng, thờ ơ', 'Chăm lo đến cùng cho người đã mở lòng'], ['Tự tin, giàu biểu cảm. Tỏa sáng khi được công nhận', 'Khen chân thành, quan tâm', 'Phớt lờ, làm mất mặt', 'Thể hiện nồng nhiệt, lãng mạn'], ['Kỹ lưỡng, phân tích, thực tế. Thích điều hữu ích', 'Thông tin chính xác, kế hoạch cụ thể', 'Qua loa, lặp lỗi', 'Thể hiện bằng quan tâm nhỏ'], ['Cân bằng, lịch thiệp. Thích không khí hài hòa', 'Nhẹ nhàng, lễ phép, đưa lựa chọn', 'Xung đột, lời thô', 'Muốn mối quan hệ thoải mái khi bên nhau'], ['Cảm xúc sâu, tập trung cao. Coi trọng sự chân thành', 'Nghiêm túc, giữ bí mật', 'Nói dối nhỏ, thăm dò', 'Muốn gắn kết sâu sắc, mạnh mẽ'], ['Tự do, lạc quan, thích phiêu lưu', 'Du lịch, kế hoạch, hài hước', 'Ràng buộc, cằn nhằn', 'Quan hệ tự do như bạn bè'], ['Chăm chỉ, thực tế, trách nhiệm cao', 'Bình tĩnh, tập trung vào mục tiêu, kết quả', 'Vô trách nhiệm, khoe khoang', 'Càng lâu càng tin tưởng'], ['Độc đáo, tự do, suy nghĩ khác biệt', 'Ý tưởng mới, chuyện xã hội', 'Kỳ vọng rập khuôn, can thiệp', 'Quan hệ bình đẳng như bạn bè'], ['Giàu cảm xúc, đồng cảm tốt', 'Chia sẻ cảm xúc nhẹ nhàng', 'Phê bình lạnh lùng, áp đặt thực tế', 'Tận tụy, lãng mạn']],
    en: [['Passionate, frank pioneer; energised by competition', 'Short and direct, with fresh ideas', 'Slow replies, long explanations', 'Makes the first move'], ['Calm, sensory and steady; values comfort', 'Unhurried; talk food and nice things', 'Rushing, frequent changes', 'Deepens slowly and stays'], ['Witty and curious; loves conversation itself', 'Light, varied topics at a quick pace', 'Repetition, heavy moods', 'Drawn to great conversationalists'], ['Caring and protective; treasures family and memories', 'Warm check-ins and empathy', 'Cold tone, indifference', 'Looks after those they let in'], ['Confident and expressive; shines when recognised', 'Sincere praise and attention', 'Being ignored or embarrassed', 'Bold and romantic'], ['Meticulous, analytical, practical; likes being useful', 'Accurate info and concrete plans', 'Sloppiness, repeated mistakes', 'Shows love through small acts'], ['Balanced and polite; prefers harmony', 'Gentle and courteous; offer options', 'Conflict, harsh words', 'Wants an easy, comfortable bond'], ['Deep feelings, intense focus; values sincerity', 'Be serious and keep secrets', 'White lies, testing them', 'Seeks a deep, strong bond'], ['Free, optimistic, adventurous', 'Travel, plans and humour', 'Restriction, nagging', 'Free, friend-like relationship'], ['Diligent, realistic, responsible', 'Calm, goal- and result-focused', 'Irresponsibility, showing off', 'Trust grows over time'], ['Original, free, unconventional', 'New ideas and social topics', 'Rigid expectations, interference', 'Equal, friend-like bond'], ['Emotional and deeply empathetic', 'Share feelings gently', 'Cold criticism, forcing reality', 'Devoted and romantic']],
  };
  P.SIGNP = {}; Object.keys(SP).forEach((l) => { P.SIGNP[l] = {}; SG.forEach((k, i) => { P.SIGNP[l][k] = [SEL[i]].concat(SP[l][i]); }); });

  // 띠 상세: [성격, 이렇게 말하면 좋아요]
  const AN = ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'];
  const AP = {
    ko: [['영리하고 눈치가 빠르며 기회를 잘 잡음', '실속 있는 정보·좋은 기회 이야기'], ['성실하고 참을성이 강하며 묵묵히 해냄', '천천히, 꾸준함을 인정해 주기'], ['용감하고 자존심이 강한 리더 기질', '당당하게, 도전과 목표 이야기'], ['온화하고 섬세하며 평화를 좋아함', '부드럽게, 갈등 없이'], ['스케일이 크고 자신감 넘치는 카리스마', '큰 꿈·계획에 맞장구'], ['지혜롭고 신중하며 직관이 뛰어남', '차분하게, 깊이 있는 화제로'], ['활발하고 자유로우며 행동이 빠름', '경쾌하게, 활동·여행 이야기'], ['다정하고 예술적 감성이 풍부함', '감성적으로, 따뜻한 칭찬'], ['재치 있고 다재다능하며 유머 감각이 좋음', '재미있게, 아이디어 주고받기'], ['꼼꼼하고 부지런하며 자기 관리가 철저함', '정확하게, 노력·성과 인정'], ['충직하고 정의로우며 의리를 중시', '진솔하게, 약속 지키기'], ['너그럽고 솔직하며 정이 많음', '편안하게, 맛있는 것·즐거운 이야기']],
    zh: [['聪明机灵，善抓机会', '聊实用信息和好机会'], ['踏实有耐心，默默完成', '慢慢来，认可其坚持'], ['勇敢自尊心强，有领导气质', '大方地聊挑战和目标'], ['温和细腻，喜欢和平', '温柔地，避免冲突'], ['格局大、自信满满的魅力', '附和远大的梦想和计划'], ['智慧谨慎，直觉出色', '冷静地聊有深度的话题'], ['活泼自由，行动快', '轻快地聊活动和旅行'], ['亲切，艺术感性丰富', '感性地，温暖地称赞'], ['机智多才，幽默感好', '有趣地交换点子'], ['细致勤快，自律', '准确地，认可努力和成果'], ['忠诚正直，重义气', '真诚，信守承诺'], ['宽厚直率，重感情', '轻松地聊美食和开心事']],
    ja: [['賢く察しが良く、チャンスをつかむのが上手', 'お得な情報や良いチャンスの話'], ['誠実で忍耐強く、黙々とやり遂げる', 'ゆっくり、粘り強さを認める'], ['勇敢でプライドが高いリーダー気質', '堂々と、挑戦や目標の話'], ['穏やかで繊細、平和が好き', 'やわらかく、対立なしで'], ['スケールが大きく自信に満ちたカリスマ', '大きな夢や計画に相づち'], ['賢く慎重で直感が鋭い', '落ち着いて深い話題で'], ['活発で自由、行動が早い', '軽快に、活動や旅行の話'], ['やさしく芸術的感性が豊か', '感性的に、温かく褒める'], ['機転が利き多才でユーモアがある', '楽しく、アイデアのやり取り'], ['几帳面で勤勉、自己管理が徹底', '正確に、努力や成果を認める'], ['忠実で正義感があり義理堅い', '誠実に、約束を守る'], ['寛大で率直、情が深い', '気楽に、おいしい物や楽しい話']],
    vi: [['Thông minh, nhanh nhạy, giỏi nắm bắt cơ hội', 'Thông tin hữu ích, cơ hội tốt'], ['Chăm chỉ, kiên nhẫn, lặng lẽ hoàn thành', 'Từ từ, ghi nhận sự bền bỉ'], ['Dũng cảm, tự trọng cao, tố chất lãnh đạo', 'Tự tin, nói về thử thách, mục tiêu'], ['Hiền hòa, tinh tế, yêu hòa bình', 'Nhẹ nhàng, tránh xung đột'], ['Tầm vóc lớn, tự tin, lôi cuốn', 'Hưởng ứng ước mơ, kế hoạch lớn'], ['Khôn ngoan, thận trọng, trực giác tốt', 'Điềm tĩnh, chủ đề sâu sắc'], ['Năng động, tự do, hành động nhanh', 'Vui tươi, nói về hoạt động, du lịch'], ['Dịu dàng, giàu cảm xúc nghệ thuật', 'Tình cảm, khen ấm áp'], ['Dí dỏm, đa tài, hài hước', 'Vui vẻ, trao đổi ý tưởng'], ['Kỹ lưỡng, siêng năng, kỷ luật', 'Chính xác, ghi nhận nỗ lực'], ['Trung thành, chính trực, trọng nghĩa', 'Chân thành, giữ lời hứa'], ['Rộng lượng, thẳng thắn, giàu tình cảm', 'Thoải mái, chuyện ăn ngon, vui vẻ']],
    en: [['Clever and quick to spot chances', 'Useful info and good opportunities'], ['Diligent, patient, quietly gets it done', 'Go slow; appreciate their persistence'], ['Brave and proud; a natural leader', 'Confident talk about challenges and goals'], ['Gentle, sensitive, loves peace', 'Soft and conflict-free'], ['Big-hearted, confident and charismatic', 'Cheer on big dreams and plans'], ['Wise, careful, intuitive', 'Calm, thoughtful topics'], ['Lively, free, quick to act', 'Upbeat talk of activities and travel'], ['Kind with an artistic soul', 'Emotional, warm praise'], ['Witty, versatile, funny', 'Playful idea swapping'], ['Meticulous, hard-working, disciplined', 'Be precise; recognise effort'], ['Loyal and just', 'Be sincere; keep promises'], ['Generous, frank, affectionate', 'Relaxed talk of food and fun']],
  };
  P.ANIMALP = {}; Object.keys(AP).forEach((l) => { P.ANIMALP[l] = {}; AN.forEach((k, i) => { P.ANIMALP[l][k] = AP[l][i]; }); });
  P.ANIMAL_KEYS = AN;

  // MBTI 상세: [성격, 이렇게 말하면 좋아요]
  const MB = ['ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP', 'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'];
  const MP = {
    ko: [['원칙적·책임감 있는 현실주의자', '사실과 순서대로, 약속 엄수'], ['다정하고 헌신적인 수호자', '고마움 표현, 세심한 배려'], ['통찰력 있는 이상주의자', '의미·가치 이야기, 진심으로'], ['전략적인 계획가', '논리와 근거, 효율적으로'], ['침착한 문제 해결사', '짧게 핵심만, 간섭 없이'], ['따뜻한 자유 예술가', '부드럽게, 취향 존중'], ['감성적인 이상주의자', '공감과 진정성, 비판은 부드럽게'], ['호기심 많은 분석가', '아이디어 토론, 논리적으로'], ['활동적인 도전가', '빠르게, 행동·결과 중심'], ['밝은 분위기 메이커', '즐겁게, 리액션 크게'], ['열정적인 아이디어 뱅크', '새로운 가능성, 칭찬 많이'], ['재치 있는 토론가', '흥미로운 논쟁, 새로운 시각'], ['체계적인 관리자', '계획·규칙·결론 먼저'], ['사교적인 배려왕', '안부·관계 이야기, 고마움 표현'], ['따뜻한 리더', '함께 성장하는 이야기, 진심'], ['추진력 있는 지휘관', '목표·성과, 결단력 있게']],
    zh: [['讲原则、有责任感的现实主义者', '按事实和顺序，严守约定'], ['温柔奉献的守护者', '表达感谢，细心体贴'], ['有洞察力的理想主义者', '聊意义和价值，真诚'], ['有战略的规划者', '讲逻辑和依据，高效'], ['冷静的问题解决者', '简短说重点，不干涉'], ['温暖自由的艺术家', '温柔，尊重喜好'], ['感性的理想主义者', '共情真诚，批评要温和'], ['好奇的分析者', '讨论点子，讲逻辑'], ['活跃的挑战者', '快速，以行动和结果为中心'], ['开朗的气氛担当', '开心地，大力回应'], ['热情的点子王', '聊新可能，多称赞'], ['机智的辩论家', '有趣的争论，新视角'], ['有条理的管理者', '先说计划・规则・结论'], ['善交际的体贴王', '问候和人际话题，表达感谢'], ['温暖的领导者', '聊共同成长，真诚'], ['有推动力的指挥官', '目标和成果，果断']],
    ja: [['原則的で責任感のある現実主義者', '事実と順番どおりに、約束厳守'], ['やさしく献身的な守護者', '感謝を伝え、細やかに気遣う'], ['洞察力のある理想主義者', '意味や価値の話を誠実に'], ['戦略的な計画家', '論理と根拠で効率的に'], ['冷静な問題解決者', '短く要点だけ、干渉しない'], ['温かく自由な芸術家', 'やわらかく、好みを尊重'], ['感性豊かな理想主義者', '共感と誠実さ、批判はやさしく'], ['好奇心旺盛な分析家', 'アイデアの議論を論理的に'], ['活動的なチャレンジャー', 'テンポよく、行動と結果中心'], ['明るいムードメーカー', '楽しく、大きくリアクション'], ['情熱的なアイデアマン', '新しい可能性、たくさん褒める'], ['機知に富んだ討論家', '面白い議論、新しい視点'], ['体系的な管理者', '計画・ルール・結論を先に'], ['社交的な気配り上手', '近況や人間関係の話、感謝'], ['温かいリーダー', '一緒に成長する話、誠実に'], ['推進力のある指揮官', '目標と成果、決断力をもって']],
    vi: [['Người thực tế, nguyên tắc, trách nhiệm', 'Theo sự thật và thứ tự, giữ lời hứa'], ['Người bảo vệ dịu dàng, tận tụy', 'Cảm ơn, quan tâm chu đáo'], ['Người lý tưởng sâu sắc', 'Nói về ý nghĩa, giá trị, chân thành'], ['Nhà hoạch định chiến lược', 'Logic, có căn cứ, hiệu quả'], ['Người giải quyết vấn đề điềm tĩnh', 'Ngắn gọn, đúng trọng tâm, không can thiệp'], ['Nghệ sĩ tự do, ấm áp', 'Nhẹ nhàng, tôn trọng sở thích'], ['Người lý tưởng giàu cảm xúc', 'Đồng cảm, chân thành, góp ý nhẹ nhàng'], ['Nhà phân tích tò mò', 'Thảo luận ý tưởng, logic'], ['Người thử thách năng động', 'Nhanh, tập trung hành động, kết quả'], ['Người tạo không khí vui vẻ', 'Vui tươi, phản ứng nhiệt tình'], ['Kho ý tưởng nhiệt huyết', 'Khả năng mới, khen nhiều'], ['Người tranh luận dí dỏm', 'Tranh luận thú vị, góc nhìn mới'], ['Nhà quản lý có hệ thống', 'Kế hoạch, quy tắc, kết luận trước'], ['Người hòa đồng, chu đáo', 'Hỏi thăm, chuyện các mối quan hệ, cảm ơn'], ['Người lãnh đạo ấm áp', 'Cùng phát triển, chân thành'], ['Người chỉ huy quyết đoán', 'Mục tiêu, kết quả, dứt khoát']],
    en: [['Principled, responsible realist', 'Facts in order; keep promises'], ['Kind, devoted protector', 'Say thanks; be considerate'], ['Insightful idealist', 'Talk meaning and values sincerely'], ['Strategic planner', 'Logic, evidence, efficiency'], ['Calm problem-solver', 'Short and to the point; no micromanaging'], ['Warm free spirit', 'Gentle; respect their taste'], ['Emotional idealist', 'Empathy and sincerity; soften criticism'], ['Curious analyst', 'Discuss ideas logically'], ['Energetic doer', 'Fast, action- and result-focused'], ['Bright entertainer', 'Fun, big reactions'], ['Enthusiastic idea person', 'New possibilities, lots of praise'], ['Witty debater', 'Fun arguments, fresh angles'], ['Organised manager', 'Plans, rules, conclusion first'], ['Sociable carer', 'Check-ins, people talk, thanks'], ['Warm leader', 'Growing together, sincerity'], ['Driven commander', 'Goals, results, decisiveness']],
  };
  P.MBTIP = {}; Object.keys(MP).forEach((l) => { P.MBTIP[l] = {}; MB.forEach((k, i) => { P.MBTIP[l][k] = MP[l][i]; }); });

  // 신살: 도화(매력)·역마(이동)·화개(예술·사색)·천을귀인(도움)
  P.SHIN = {
    ko: { dohwa: ['도화', '사람을 끄는 매력과 인기가 있어요. 외모·분위기 칭찬이 잘 통합니다'], yeokma: ['역마', '이동·변화·해외와 인연이 많아요. 여행·새로운 곳 이야기를 좋아합니다'], hwagae: ['화개', '예술·종교·사색적 기질. 혼자만의 시간과 깊은 대화를 중시합니다'], gwiin: ['천을귀인', '어려울 때 도와주는 사람이 나타나는 복. 은혜를 기억하는 타입입니다'] },
    zh: { dohwa: ['桃花', '有吸引人的魅力和人气。称赞外貌和气质很受用'], yeokma: ['驿马', '与移动・变化・海外有缘。喜欢聊旅行和新地方'], hwagae: ['华盖', '艺术・宗教・沉思的气质。重视独处时间和深度对话'], gwiin: ['天乙贵人', '困难时有贵人相助的福气。是会记得恩情的人'] },
    ja: { dohwa: ['桃花', '人を惹きつける魅力と人気があります。外見や雰囲気を褒めると効果的'], yeokma: ['駅馬', '移動・変化・海外と縁が深い。旅行や新しい場所の話が好き'], hwagae: ['華蓋', '芸術・宗教・思索的な気質。一人の時間と深い会話を大切にします'], gwiin: ['天乙貴人', '困ったときに助けてくれる人が現れる福。恩を忘れないタイプ'] },
    vi: { dohwa: ['Đào hoa', 'Có sức hút và được yêu mến. Khen ngoại hình, phong thái rất hiệu quả'], yeokma: ['Dịch mã', 'Có duyên với di chuyển, thay đổi, nước ngoài. Thích chuyện du lịch, nơi mới'], hwagae: ['Hoa cái', 'Khí chất nghệ thuật, tâm linh, trầm tư. Coi trọng thời gian riêng và trò chuyện sâu'], gwiin: ['Thiên ất quý nhân', 'Có phúc được người giúp khi khó khăn. Là người nhớ ơn'] },
    en: { dohwa: ['Peach Blossom', 'Natural charm and popularity — compliments on looks and vibe land well'], yeokma: ['Travelling Horse', 'Linked to movement, change and abroad — loves talk of travel and new places'], hwagae: ['Canopy', 'Artistic, spiritual, reflective — values alone time and deep talks'], gwiin: ['Noble Helper', 'Help tends to appear in hard times — remembers kindness'] },
  };
  // 성별에 따른 관계 기운(전통 해석: 남성은 재성, 여성은 관성을 인연의 별로 봄) — 단정하지 않고 '관계에서의 모습'으로만 표현
  P.REL = {
    ko: { title: '관계 기운', strong: '인연의 기운이 뚜렷해요 — 관계에 적극적이고 표현도 분명한 편', weak: '인연의 기운이 잔잔해요 — 천천히 신뢰를 쌓고 마음을 늦게 여는 편', mid: '인연의 기운이 균형적 — 상대에 맞춰 자연스럽게 가까워지는 편' },
    zh: { title: '关系能量', strong: '缘分之气鲜明 — 在关系中积极，表达也明确', weak: '缘分之气平静 — 慢慢建立信任，慢热', mid: '缘分之气平衡 — 会配合对方自然地变亲近' },
    ja: { title: '関係の気', strong: '縁の気がはっきり — 関係に積極的で表現もはっきり', weak: '縁の気が穏やか — ゆっくり信頼を築き心を開くのが遅め', mid: '縁の気がバランス型 — 相手に合わせて自然に近づく' },
    vi: { title: 'Năng lượng quan hệ', strong: 'Duyên khí rõ — chủ động trong quan hệ, bày tỏ rõ ràng', weak: 'Duyên khí nhẹ — xây niềm tin từ từ, chậm mở lòng', mid: 'Duyên khí cân bằng — gần gũi tự nhiên theo đối phương' },
    en: { title: 'Relationship energy', strong: 'Clear relationship energy — active and expressive in relationships', weak: 'Gentle relationship energy — builds trust slowly, opens up late', mid: 'Balanced relationship energy — grows close naturally, matching the other person' },
  };
  // 대운·월운 화면 문구
  P.UI2 = {
    ko: { more: '더 자세히', love: '관계 스타일', work: '일·돈 스타일', stress: '스트레스 받는 상황', comfort: '위로·응원법', decide: '결정 방식', gift: '좋아할 선물', praise: '통하는 칭찬', shin: '타고난 특별한 기운', daeun: '10년 대운', now: '지금', month: '이번 달 운', blood: '혈액형으로 본 성격', sign: '별자리로 본 성격', animal: '띠로 본 성격', mbti: 'MBTI로 본 성격', el: { fire: '불', earth: '흙', air: '바람', water: '물' }, needG: '성별을 알면 관계 기운·대운까지 볼 수 있어요', age: '세' },
    zh: { more: '更多详情', love: '关系风格', work: '工作・金钱风格', stress: '容易有压力的情况', comfort: '安慰・鼓励方法', decide: '决定方式', gift: '会喜欢的礼物', praise: '有效的称赞', shin: '天生的特别能量', daeun: '十年大运', now: '现在', month: '本月运势', blood: '血型看性格', sign: '星座看性格', animal: '生肖看性格', mbti: 'MBTI看性格', el: { fire: '火象', earth: '土象', air: '风象', water: '水象' }, needG: '知道性别就能看关系能量和大运', age: '岁' },
    ja: { more: 'もっと詳しく', love: '関係スタイル', work: '仕事・お金のスタイル', stress: 'ストレスを感じる場面', comfort: '慰め・応援の仕方', decide: '決め方', gift: '喜ぶ贈り物', praise: '響く褒め言葉', shin: '生まれ持った特別な気', daeun: '10年大運', now: '今', month: '今月の運', blood: '血液型から見た性格', sign: '星座から見た性格', animal: '干支から見た性格', mbti: 'MBTIから見た性格', el: { fire: '火', earth: '地', air: '風', water: '水' }, needG: '性別がわかると関係の気と大運も見られます', age: '歳' },
    vi: { more: 'Chi tiết hơn', love: 'Phong cách quan hệ', work: 'Phong cách công việc · tiền bạc', stress: 'Dễ căng thẳng khi', comfort: 'Cách an ủi · động viên', decide: 'Cách quyết định', gift: 'Món quà sẽ thích', praise: 'Lời khen hiệu quả', shin: 'Năng lượng đặc biệt bẩm sinh', daeun: 'Đại vận 10 năm', now: 'Hiện tại', month: 'Vận tháng này', blood: 'Tính cách theo nhóm máu', sign: 'Tính cách theo cung hoàng đạo', animal: 'Tính cách theo con giáp', mbti: 'Tính cách theo MBTI', el: { fire: 'Lửa', earth: 'Đất', air: 'Khí', water: 'Nước' }, needG: 'Biết giới tính sẽ xem được năng lượng quan hệ và đại vận', age: ' tuổi' },
    en: { more: 'More detail', love: 'Relationship style', work: 'Work & money style', stress: 'Stressed by', comfort: 'How to comfort', decide: 'How they decide', gift: 'Gifts they’d like', praise: 'Praise that lands', shin: 'Special inborn energies', daeun: '10-year luck cycles', now: 'Now', month: 'This month', blood: 'Blood type personality', sign: 'Star sign personality', animal: 'Zodiac animal personality', mbti: 'MBTI personality', el: { fire: 'Fire', earth: 'Earth', air: 'Air', water: 'Water' }, needG: 'With gender you also get relationship energy and luck cycles', age: '' },
  };

  /* ---------- 계산 ---------- */
  // 신살: 연지·일지 기준 삼합 그룹으로 도화·역마·화개, 일간으로 천을귀인
  const TRI = { 8: 0, 0: 0, 4: 0, 2: 1, 6: 1, 10: 1, 5: 2, 9: 2, 1: 2, 11: 3, 3: 3, 7: 3 };
  const DOHWA = [9, 3, 6, 0], YEOKMA = [2, 8, 11, 5], HWAGAE = [4, 10, 1, 7];
  const GWIIN = { 0: [1, 7], 4: [1, 7], 6: [1, 7], 1: [0, 8], 5: [0, 8], 2: [11, 9], 3: [11, 9], 7: [2, 6], 8: [5, 3], 9: [5, 3] };
  P.shinsal = function (s) {
    if (!s) return [];
    const br = s.pillars.map((p) => p.branch);
    const has = (b) => br.includes(b);
    const out = new Set();
    [s.yearBranch, s.dayBranch].forEach((base) => {
      const g = TRI[base]; if (g === undefined) return;
      if (has(DOHWA[g])) out.add('dohwa');
      if (has(YEOKMA[g])) out.add('yeokma');
      if (has(HWAGAE[g]) && HWAGAE[g] !== base) out.add('hwagae');
    });
    if ((GWIIN[s.dayMaster] || []).some(has)) out.add('gwiin');
    return Array.from(out);
  };
  // 관계 기운: 남성 재성(2), 여성 관성(3) 비율
  P.relation = function (an, gender) {
    if (!an || !gender) return null;
    const v = an.groups[gender === 'm' ? 2 : 3];
    return v >= 28 ? 'strong' : v <= 8 ? 'weak' : 'mid';
  };
  // 대운: 연간 음양 + 성별로 순행/역행, 시작 나이 = 다음(이전) 절기까지 일수 / 3
  P.daeun = function (s, gender) {
    if (!s || !gender || !global.Saju || !s.utcMs) return null;
    const S = global.Saju;
    const yangYear = s.yearStem % 2 === 0;
    const forward = (yangYear && gender === 'm') || (!yangYear && gender === 'f');
    const jd0 = s.utcMs / 86400000 + 2440587.5;
    const lon0 = S.sunLongitude(jd0);
    // 절기 경계: 315 + 30n (입춘·경칩·청명…)
    const rel = ((lon0 - 315) % 30 + 30) % 30;
    let target = forward ? lon0 + (30 - rel) : lon0 - rel;
    target = ((target % 360) + 360) % 360;
    let jd = jd0; const step = forward ? 1 : -1;
    for (let i = 0; i < 40; i++) {
      const l = S.sunLongitude(jd + step);
      const d1 = ((l - target + 540) % 360) - 180; const d0 = ((S.sunLongitude(jd) - target + 540) % 360) - 180;
      if ((d0 <= 0 && d1 >= 0) || (d0 >= 0 && d1 <= 0)) { jd += step * Math.abs(d0) / Math.max(0.0001, Math.abs(d1 - d0)); break; }
      jd += step;
    }
    const days = Math.abs(jd - jd0);
    const start = Math.max(1, Math.round(days / 3));
    const list = [];
    for (let k = 1; k <= 8; k++) {
      const st = (((s.monthStem + (forward ? k : -k)) % 10) + 10) % 10;
      const brn = (((s.monthBranch + (forward ? k : -k)) % 12) + 12) % 12;
      list.push({ age: start + (k - 1) * 10, stem: st, branch: brn, g: P.group(s.dayMasterEl, S.STEM_EL[st]) });
    }
    return { forward, start, list };
  };
  // 이번 달 천간(절기 기준): 연간과 월 순서로 계산
  P.monthLuck = function (s) {
    if (!s || !global.Saju) return null;
    const S = global.Saju; const now = Date.now();
    const lon = S.sunLongitude(now / 86400000 + 2440587.5);
    const order = Math.floor((((lon - 315) % 360) + 360) % 360 / 30);
    const d = new Date(); let y = d.getFullYear(); if (d.getMonth() < 1 || (d.getMonth() === 1 && lon >= 255 && lon < 315)) y -= 1;
    const yStem = ((y - 4) % 10 + 10) % 10;
    const mStem = ((yStem * 2 + 2 + order) % 10 + 10) % 10; const mBranch = (order + 2) % 12;
    return { stem: mStem, branch: mBranch, g: P.group(s.dayMasterEl, S.STEM_EL[mStem]) };
  };
})(typeof window !== 'undefined' ? window : globalThis);
