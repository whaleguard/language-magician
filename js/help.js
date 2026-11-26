/* 메뉴 도움말: 각 메뉴·화면 제목 옆 「?」를 누르면 기능 설명 창이 뜹니다.
   형식: key: [제목, 한 줄 설명, [이렇게 쓰세요 단계...], 팁] */
(function () {
  'use strict';
  const M = {
    ko: {
      chat: ['대화 (상담 작업 화면)', '고객·상대가 보낸 말을 번역하고, AI가 상황을 정리해 답장을 추천하는 메인 화면입니다.', ['오른쪽 목록에서 대화할 사람을 고릅니다. 없으면 「+ 새 대화」로 닉네임·메신저·언어를 넣어 추가하세요.', '입력창 위 「📥 받은 말 넣기」를 고르고 메신저에서 복사한 말을 붙여넣거나(Ctrl+V) 스크린샷을 올립니다.', '번역·뉘앙스·상황 정리와 추천 답장이 나옵니다. 「이걸로 답장」을 누르면 상대 언어로 복사됩니다.', '내 말을 직접 쓰려면 「📤 보낼 말 쓰기」 → 내 언어로 입력 → 「번역·복사」 → 메신저에 붙여넣기.', '「새 창」을 누르면 사람마다 창을 따로 띄워 여러 명을 동시에 응대할 수 있습니다.'], '다른 사람 이름이나 대화를 붙여넣으면 「다른 방」 경고가 뜹니다. 보내기 전에 꼭 확인하세요.'],
      contacts: ['연락처', '대화하는 사람(고객)을 모아 관리하는 곳입니다. 메신저·언어·프로필 사진·자동 저장된 고객 정보를 봅니다.', ['메신저별 필터와 검색으로 사람을 찾습니다.', '사람을 누르면 대화 기록·고객 정보·기념일을 한 화면에서 봅니다.', '「편집」에서 닉네임·메신저·언어·프로필 사진(메신저 프로필 캡처)을 고칩니다.', '대화에 나온 이름·전화·이메일·주문번호 등은 「고객 정보」 카드에 자동으로 저장됩니다. 틀리면 ×로 지우고 직접 넣으세요.'], '같은 회사 다른 상담원과 같은 고객이면 「○○도 상담 중」 표시가 뜹니다. 팀장 판정을 따라 주세요.'],
      agenda: ['일정', '대화에서 찾은 약속과 할 일, 기념일을 달력으로 보여 줍니다.', ['달력에서 날짜를 누르면 그날 약속·기념일이 보입니다.', '대화 중 날짜·시간이 나오면 자동으로 일정 후보가 생깁니다.', '「오늘」 버튼으로 이번 달로 돌아옵니다.'], '약속 하루 전에 알림을 받을 수 있습니다.'],
      anniv: ['기념일', '생일·처음 대화한 날·만난 지 100일 같은 날을 사람별로 정리합니다.', ['사람별 다가오는 기념일이 가까운 순서로 나옵니다.', '생일은 연락처 편집이나 대화 속 자동 인식으로 채워집니다.', '「선물」로 바로 가서 그날에 맞는 선물·축하 문구를 고를 수 있습니다.'], ''],
      coach: ['관계 조언', '말투·답장 속도·대화 깊이를 분석해 지금 단계에서 할 말과 피할 말을 예문으로 알려 줍니다.', ['위에서 사람을 고르면 지금 관계 단계와 상대 성향이 나옵니다.', '「다음에 할 말」 예문을 눌러 입력창으로 가져갈 수 있습니다.', '「피할 말」은 오해를 부를 수 있는 표현입니다.'], '만남 제안은 하지 않습니다. 가까워지는 단계에서는 전화·영상통화를 먼저 권합니다.'],
saju: ['사주·궁합 · 성향', '고객 생일(연·월·일)만 알아도 타고난 기질·강점·주의점·이렇게 말하면 좋은 방법·좋아하는 화제를 보여 줍니다. 내 생일까지 넣으면 궁합도 나옵니다.', ['대화에서 생일·나이·혈액형·MBTI가 나오면 자동 저장되고, 오른쪽 「🔮 성향·성격」 카드에 바로 반영됩니다.', '사주 화면: 일간 성격, 성향 분포(십신), 기운 세기, 보완 기운(행운 색·숫자·방향), 올해 운.', '「🤖 AI 상세 성격 리포트」: 사주와 실제 대화 말투를 함께 보고 말하는 법·피할 말·화제를 정리 (프로·기업 요금제).', '생일은 기념일에 자동 등록되고 전날·당일 알림이 옵니다.'], '재미·참고용입니다. 사람을 단정 짓지 마세요.'],
      gift: ['선물', '생일·기념일·명절에 맞는 선물 아이디어와 축하 문구를 나라별로 추천합니다.', ['사람과 날(생일·명절 등)을 고릅니다.', '예산대별 선물과 상대 언어로 된 축하 문구가 나옵니다. 문구는 눌러서 복사합니다.'], '나라마다 피해야 할 선물도 함께 알려 줍니다.'],
      culture: ['문화', '나라별 호칭·예절·금기와 바로 쓸 수 있는 예문을 봅니다.', ['나라를 고르면 호칭·인사·선물·금기 항목이 나옵니다.', '예문은 눌러서 복사해 대화에 씁니다.'], ''],
      tools: ['도구', '관계 조언·사주·선물·문화·기념일 같은 도구를 한곳에 모았습니다.', ['쓸 도구를 누르면 지금 대화 중인 사람 기준으로 열립니다.'], ''],
      settings: ['설정', '화면 언어, 내 정보, 계정(로그인·로그아웃), 알림을 정합니다.', ['「화면 언어」에서 메뉴 언어를 바꿉니다. 답장 언어는 사람마다 따로 정해집니다.', '상담원은 계정 카드에서 로그아웃합니다. 다른 계정으로 로그인하려면 「다른 계정으로 로그인」.', '알림음·팝업 알림을 켜고 끕니다.'], '상담원 계정은 처음 로그인한 PC(자리)에서만 열립니다. 자리를 옮길 때는 팀장에게 「자리 초기화」를 요청하세요.'],
      guide: ['사용 안내', '처음 쓰는 분을 위한 단계별 사용법입니다.', ['순서대로 따라 하면 첫 답장까지 만들 수 있습니다.', '메뉴마다 옆의 「?」를 누르면 그 메뉴 설명이 뜹니다.'], ''],
      inbox: ['공지함 (팀장 지시)', '팀장·회사가 보낸 지시와 공지가 내 언어로 번역되어 모이는 곳입니다.', ['새 지시는 알림음과 함께 창으로 뜹니다. 「보기」를 누르면 여기로 옵니다.', '지시를 열면 팀장 화면에 「읽음」으로 표시됩니다.', '「답장 필요」나 마감이 있으면 내 언어로 답장하세요. 팀장에게는 팀장 언어로 번역되어 갑니다.'], '빠른 대화는 오른쪽 아래 「💬 채팅」이 편합니다.'],
      chatw: ['실시간 채팅', '팀장·회사와 바로 대화하는 창입니다. 각자 자기 언어로 쓰면 상대 언어로 번역되어 도착합니다.', ['「＋ 새 대화」에서 상대(팀장·팀 전체방)를 고릅니다.', '입력 후 Enter로 보냅니다(Shift+Enter는 줄바꿈). 「확인했습니다」 같은 빠른 답장 버튼도 있습니다.', '받은 말 아래에 원문이 함께 보입니다. 내가 보낸 말에는 「읽음」이 표시됩니다.', '창을 닫아도 「대화 목록」에 남습니다. 🗑를 두 번 누르면 내 목록에서만 지워집니다.'], '새 메시지는 버튼의 빨간 숫자·알림음·탭 제목으로 알려 줍니다.'],
    },
    zh: {
      chat: ['对话（咨询工作画面）', '翻译客户发来的话，AI 整理情况并推荐回复的主画面。', ['在右侧列表选择对话对象。没有的话点「+ 新对话」，填写昵称、聊天软件、语言来添加。', '在输入框上方选择「📥 添加收到的话」，粘贴从聊天软件复制的内容（Ctrl+V）或上传截图。', '会显示翻译、语气、情况整理和推荐回复。点「用这句回复」即以对方语言复制。', '想自己写：「📤 写要发的话」→ 用我的语言输入 →「翻译并复制」→ 粘贴到聊天软件。', '点「新窗口」可为每个人单独打开窗口，同时接待多人。'], '如果粘贴了别人的名字或对话，会出现「错误对话」提醒，发送前请务必确认。'],
      contacts: ['联系人', '集中管理对话对象（客户）的地方，可查看聊天软件、语言、头像和自动保存的客户信息。', ['用聊天软件筛选和搜索找到对象。', '点击对象可在一个画面查看对话记录、客户信息、纪念日。', '在「编辑」中修改昵称、聊天软件、语言、头像（聊天软件头像截图）。', '对话中出现的姓名、电话、邮箱、订单号等会自动保存到「客户信息」卡片。有误时用 × 删除后手动输入。'], '如果与同公司其他咨询员是同一客户，会显示「○○也在接待」。请按组长的判定处理。'],
      agenda: ['日程', '用日历显示从对话中找到的约定、待办和纪念日。', ['点击日历上的日期可查看当天的约定和纪念日。', '对话中出现日期、时间时会自动生成日程候选。', '点「今天」回到本月。'], '可以在约定前一天收到提醒。'],
      anniv: ['纪念日', '按人整理生日、第一次对话的日子、认识100天等日子。', ['按日期远近显示每个人即将到来的纪念日。', '生日可在联系人编辑中填写，或从对话中自动识别。', '可直接进入「礼物」，挑选适合当天的礼物和祝福语。'], ''],
      coach: ['关系建议', '分析语气、回复速度、对话深度，用例句告诉你现阶段该说什么、避免说什么。', ['在上方选择对象，会显示当前关系阶段和对方性格。', '点击「接下来可以说」的例句可带到输入框。', '「避免说」是容易引起误会的表达。'], '不建议见面。关系拉近时，建议先通电话或视频通话。'],
saju: ['四柱・配对・性格', '只要知道客户生日（年・月・日），就能看到天生气质・强项・注意点・沟通方法・喜欢的话题。再输入自己的生日还能看配对。', ['对话中出现生日・年龄・血型・MBTI会自动保存，并立即显示在右侧「🔮 性格・倾向」卡片。', '四柱画面：日干性格、性格分布（十神）、能量强弱、补益能量（幸运色・数字・方位）、今年运势。', '「🤖 AI 详细性格报告」：结合四柱与实际聊天语气，整理沟通方法・忌讳・话题（专业版・企业版）。', '生日会自动加入纪念日，前一天和当天提醒。'], '仅供娱乐和参考，请勿给人下定论。'],
      gift: ['礼物', '按国家推荐适合生日、纪念日、节日的礼物和祝福语。', ['选择对象和日子（生日、节日等）。', '会显示不同预算的礼物和对方语言的祝福语，点击即可复制。'], '也会提示各国应避免的礼物。'],
      culture: ['文化', '查看各国的称呼、礼仪、禁忌和可直接使用的例句。', ['选择国家后显示称呼、问候、礼物、禁忌等项目。', '点击例句复制后用于对话。'], ''],
      tools: ['工具', '把关系建议、四柱、礼物、文化、纪念日等工具集中在一起。', ['点击要用的工具，会以当前对话对象为准打开。'], ''],
      settings: ['设置', '设置画面语言、我的信息、账号（登录・退出）和提醒。', ['在「画面语言」更改菜单语言。回复语言按每个对象单独设定。', '咨询员在账号卡片退出。要登录其他账号请点「登录其他账号」。', '开启或关闭提示音和弹窗提醒。'], '咨询员账号只能在首次登录的电脑（座位）使用。换座位时请让组长「重置座位」。'],
      guide: ['使用说明', '给新用户的分步使用方法。', ['按顺序操作即可完成第一条回复。', '点击每个菜单旁的「?」会显示该菜单的说明。'], ''],
      inbox: ['通知（组长指示）', '组长和公司发来的指示、公告会翻译成我的语言集中在这里。', ['新指示会伴随提示音弹出窗口，点「查看」即来到这里。', '打开指示后，组长画面会显示「已读」。', '有「需要回复」或期限时，请用我的语言回复，组长会收到翻译成组长语言的内容。'], '快速沟通用右下角「💬 聊天」更方便。'],
      chatw: ['实时聊天', '与组长、公司直接对话的窗口。各自用自己的语言写，会翻译成对方的语言送达。', ['在「＋ 新对话」选择对象（组长、团队群）。', '输入后按 Enter 发送（Shift+Enter 换行）。也有「收到」等快捷回复按钮。', '收到的话下方同时显示原文。我发出的话会显示「已读」。', '关闭窗口后仍保存在「聊天列表」。连按两次 🗑 只从我的列表删除。'], '新消息会以按钮红色数字、提示音、标签标题提醒。'],
    },
    ja: {
      chat: ['トーク（相談作業画面）', '相手から届いた言葉を翻訳し、AIが状況を整理して返信を提案するメイン画面です。', ['右の一覧から相手を選びます。いなければ「+ 新しいトーク」でニックネーム・メッセンジャー・言語を入れて追加します。', '入力欄の上で「📥 受け取った言葉」を選び、メッセンジャーからコピーした文を貼り付ける（Ctrl+V）かスクリーンショットをアップロードします。', '翻訳・ニュアンス・状況整理と返信案が出ます。「これで返信」を押すと相手の言語でコピーされます。', '自分で書くときは「📤 送る言葉を書く」→ 自分の言語で入力 →「翻訳・コピー」→ メッセンジャーに貼り付け。', '「新しいウィンドウ」で相手ごとにウィンドウを開き、複数の人に同時に対応できます。'], '別の人の名前や会話を貼り付けると「別のルーム」警告が出ます。送る前に必ず確認してください。'],
      contacts: ['連絡先', '会話する相手（顧客）をまとめて管理します。メッセンジャー・言語・プロフィール写真・自動保存された顧客情報を見られます。', ['メッセンジャー別フィルターと検索で相手を探します。', '相手を押すと会話履歴・顧客情報・記念日をひとつの画面で見られます。', '「編集」でニックネーム・メッセンジャー・言語・プロフィール写真を直します。', '会話に出た名前・電話・メール・注文番号などは「顧客情報」カードに自動保存されます。違う場合は×で消して直接入力します。'], '同じ会社の別の相談員と同じ顧客なら「○○も対応中」と表示されます。リーダーの判定に従ってください。'],
      agenda: ['予定', '会話から見つけた約束・やること・記念日をカレンダーで表示します。', ['日付を押すとその日の約束・記念日が見られます。', '会話に日付・時間が出ると予定の候補が自動で作られます。', '「今日」で今月に戻ります。'], '約束の前日に通知を受け取れます。'],
      anniv: ['記念日', '誕生日・初めて話した日・100日目などを相手ごとにまとめます。', ['近い順に相手ごとの記念日が並びます。', '誕生日は連絡先の編集か会話からの自動認識で入ります。', '「ギフト」へ進み、その日に合うプレゼントやお祝いの言葉を選べます。'], ''],
      coach: ['関係アドバイス', '口調・返信の速さ・会話の深さを分析し、今の段階で言うべきこと・避けたいことを例文で教えます。', ['上で相手を選ぶと今の関係の段階と相手の傾向が出ます。', '「次に言うこと」の例文を押すと入力欄に入ります。', '「避けたい言葉」は誤解を招きやすい表現です。'], '会う提案はしません。親しくなる段階では電話・ビデオ通話を先におすすめします。'],
saju: ['四柱・相性・性格', '顧客の誕生日（年・月・日）がわかれば、生まれ持った気質・強み・注意点・話し方・好きな話題を表示します。自分の誕生日も入れると相性も出ます。', ['会話に誕生日・年齢・血液型・MBTIが出ると自動保存され、右の「🔮 性格・傾向」カードにすぐ反映されます。', '四柱画面：日干の性格、傾向の分布（十神）、気の強さ、補う気（ラッキーカラー・数字・方角）、今年の運。', '「🤖 AI 詳しい性格レポート」：四柱と実際の会話の口調をあわせて、話し方・避けること・話題を整理（プロ・企業プラン）。', '誕生日は記念日に自動登録され、前日と当日に通知します。'], '楽しむための参考です。人を決めつけないでください。'],
      gift: ['ギフト', '誕生日・記念日・祝日に合うプレゼントとお祝いの言葉を国別に提案します。', ['相手と日（誕生日・祝日など）を選びます。', '予算別のプレゼントと相手の言語のお祝いの言葉が出ます。押すとコピーされます。'], '国ごとに避けたいプレゼントも表示します。'],
      culture: ['文化', '国別の呼び方・マナー・タブーとすぐ使える例文を見られます。', ['国を選ぶと呼び方・あいさつ・贈り物・タブーが出ます。', '例文は押してコピーし、会話に使います。'], ''],
      tools: ['ツール', '関係アドバイス・四柱・ギフト・文化・記念日などのツールをまとめました。', ['使うツールを押すと、今話している相手を基準に開きます。'], ''],
      settings: ['設定', '画面の言語、自分の情報、アカウント（ログイン・ログアウト）、通知を設定します。', ['「画面の言語」でメニューの言語を変えます。返信の言語は相手ごとに決まります。', '相談員はアカウントカードからログアウトします。別のアカウントは「別のアカウントでログイン」。', '通知音・ポップアップ通知のオン・オフ。'], '相談員アカウントは最初にログインしたPC（席）でだけ開きます。席を移るときはリーダーに「席をリセット」を頼んでください。'],
      guide: ['使い方', '初めての方のための段階別の使い方です。', ['順番どおりに進めると最初の返信まで作れます。', '各メニューの横の「?」を押すとそのメニューの説明が出ます。'], ''],
      inbox: ['お知らせ（リーダーの指示）', 'リーダー・会社からの指示やお知らせが自分の言語に翻訳されて集まります。', ['新しい指示は通知音と一緒にウィンドウで出ます。「見る」を押すとここに来ます。', '指示を開くとリーダーの画面に「既読」と表示されます。', '「返信が必要」や期限があれば自分の言語で返信します。リーダーにはリーダーの言語で届きます。'], 'すばやいやり取りは右下の「💬 チャット」が便利です。'],
      chatw: ['リアルタイムチャット', 'リーダー・会社とすぐ話せるウィンドウです。それぞれ自分の言語で書けば相手の言語に翻訳されて届きます。', ['「＋ 新しいチャット」で相手（リーダー・チーム全体ルーム）を選びます。', '入力してEnterで送信（Shift+Enterで改行）。「了解しました」などのクイック返信もあります。', '受け取った言葉の下に原文も表示されます。送った言葉には「既読」が付きます。', '閉じても「チャット一覧」に残ります。🗑を2回押すと自分の一覧からだけ消えます。'], '新着はボタンの赤い数字・通知音・タブのタイトルで知らせます。'],
    },
    vi: {
      chat: ['Trò chuyện (màn hình làm việc)', 'Màn hình chính: dịch lời khách gửi, AI tóm tắt tình huống và gợi ý câu trả lời.', ['Chọn người ở danh sách bên phải. Nếu chưa có, nhấn «+ Cuộc trò chuyện mới» và nhập biệt danh, ứng dụng nhắn tin, ngôn ngữ.', 'Phía trên ô nhập, chọn «📥 Thêm tin nhận được», dán nội dung sao chép từ ứng dụng (Ctrl+V) hoặc tải ảnh chụp màn hình.', 'Bản dịch, sắc thái, tóm tắt tình huống và câu trả lời gợi ý sẽ hiện ra. Nhấn «Trả lời bằng câu này» để sao chép bằng ngôn ngữ của khách.', 'Tự viết: «📤 Viết tin gửi» → nhập bằng ngôn ngữ của bạn → «Dịch và sao chép» → dán vào ứng dụng nhắn tin.', 'Nhấn «Cửa sổ mới» để mở riêng từng người và tiếp nhiều khách cùng lúc.'], 'Nếu dán nhầm tên hoặc hội thoại của người khác sẽ có cảnh báo «nhầm phòng». Hãy kiểm tra trước khi gửi.'],
      contacts: ['Danh bạ', 'Nơi quản lý những người bạn trò chuyện (khách hàng): ứng dụng, ngôn ngữ, ảnh đại diện và thông tin khách tự lưu.', ['Tìm người bằng bộ lọc theo ứng dụng và ô tìm kiếm.', 'Nhấn vào một người để xem lịch sử trò chuyện, thông tin khách và ngày kỷ niệm trên một màn hình.', 'Trong «Sửa», đổi biệt danh, ứng dụng, ngôn ngữ, ảnh đại diện (ảnh chụp hồ sơ trong ứng dụng).', 'Tên, điện thoại, email, mã đơn… xuất hiện trong hội thoại được tự lưu vào thẻ «Thông tin khách». Nếu sai, xóa bằng × rồi tự nhập.'], 'Nếu trùng khách với nhân viên khác cùng công ty sẽ hiện «○○ cũng đang tư vấn». Hãy làm theo quyết định của trưởng nhóm.'],
      agenda: ['Lịch', 'Hiển thị hẹn, việc cần làm và ngày kỷ niệm tìm thấy trong hội thoại trên lịch.', ['Nhấn vào ngày để xem hẹn và kỷ niệm của ngày đó.', 'Khi hội thoại có ngày giờ, lịch hẹn gợi ý được tạo tự động.', 'Nhấn «Hôm nay» để quay về tháng này.'], 'Bạn có thể nhận nhắc nhở trước buổi hẹn một ngày.'],
      anniv: ['Ngày kỷ niệm', 'Sắp xếp sinh nhật, ngày nói chuyện đầu tiên, 100 ngày quen nhau… theo từng người.', ['Ngày kỷ niệm sắp tới của từng người hiện theo thứ tự gần nhất.', 'Sinh nhật được điền khi sửa danh bạ hoặc tự nhận ra trong hội thoại.', 'Có thể chuyển ngay sang «Quà tặng» để chọn quà và lời chúc phù hợp.'], ''],
      coach: ['Lời khuyên quan hệ', 'Phân tích giọng điệu, tốc độ trả lời, độ sâu hội thoại và cho câu mẫu nên nói, nên tránh ở giai đoạn hiện tại.', ['Chọn người ở phía trên để xem giai đoạn quan hệ và tính cách đối phương.', 'Nhấn câu mẫu «Nên nói tiếp» để đưa vào ô nhập.', '«Nên tránh» là những câu dễ gây hiểu lầm.'], 'Không gợi ý gặp mặt. Khi thân hơn, ưu tiên gọi điện hoặc gọi video trước.'],
saju: ['Tứ trụ · hợp tuổi · tính cách', 'Chỉ cần biết ngày sinh (năm-tháng-ngày) của khách là xem được khí chất, điểm mạnh, lưu ý, cách nói chuyện và chủ đề yêu thích. Nhập thêm ngày sinh của bạn để xem hợp tuổi.', ['Khi hội thoại có ngày sinh, tuổi, nhóm máu, MBTI sẽ tự lưu và hiện ngay ở thẻ «🔮 Tính cách».', 'Màn hình tứ trụ: tính cách theo nhật chủ, phân bố khuynh hướng (thập thần), độ mạnh, năng lượng bổ sung (màu, số, hướng may mắn), vận năm nay.', '«🤖 Báo cáo tính cách AI»: kết hợp tứ trụ và cách nhắn tin thực tế để tổng hợp cách nói, điều nên tránh, chủ đề (gói Pro · Doanh nghiệp).', 'Ngày sinh tự thêm vào ngày kỷ niệm, nhắc trước một ngày và đúng ngày.'], 'Chỉ để tham khảo, vui vẻ. Đừng đánh giá con người qua đây.'],
      gift: ['Quà tặng', 'Gợi ý quà và lời chúc theo quốc gia cho sinh nhật, kỷ niệm, ngày lễ.', ['Chọn người và dịp (sinh nhật, ngày lễ…).', 'Quà theo mức ngân sách và lời chúc bằng ngôn ngữ của đối phương sẽ hiện ra. Nhấn để sao chép.'], 'Cũng cho biết những món quà nên tránh ở mỗi nước.'],
      culture: ['Văn hóa', 'Xem cách xưng hô, phép lịch sự, điều kiêng kỵ và câu mẫu dùng ngay theo từng nước.', ['Chọn nước để xem xưng hô, chào hỏi, quà tặng, điều kiêng kỵ.', 'Nhấn câu mẫu để sao chép và dùng trong hội thoại.'], ''],
      tools: ['Công cụ', 'Gom các công cụ: lời khuyên quan hệ, tứ trụ, quà tặng, văn hóa, ngày kỷ niệm.', ['Nhấn công cụ cần dùng, nó mở theo người bạn đang trò chuyện.'], ''],
      settings: ['Cài đặt', 'Đặt ngôn ngữ màn hình, thông tin của bạn, tài khoản (đăng nhập · đăng xuất) và thông báo.', ['Đổi ngôn ngữ menu ở «Ngôn ngữ màn hình». Ngôn ngữ trả lời được đặt riêng cho từng người.', 'Nhân viên đăng xuất ở thẻ tài khoản. Muốn dùng tài khoản khác: «Đăng nhập tài khoản khác».', 'Bật/tắt âm báo và cửa sổ thông báo.'], 'Tài khoản nhân viên chỉ mở trên máy (chỗ ngồi) đăng nhập lần đầu. Khi đổi chỗ, nhờ trưởng nhóm «Đặt lại chỗ ngồi».'],
      guide: ['Hướng dẫn', 'Cách dùng từng bước cho người mới.', ['Làm theo thứ tự là tạo được câu trả lời đầu tiên.', 'Nhấn «?» cạnh mỗi menu để xem giải thích menu đó.'], ''],
      inbox: ['Hộp thông báo (chỉ thị của trưởng nhóm)', 'Chỉ thị và thông báo từ trưởng nhóm, công ty được dịch sang ngôn ngữ của bạn và gom ở đây.', ['Chỉ thị mới hiện cửa sổ kèm âm báo. Nhấn «Xem» để đến đây.', 'Khi bạn mở, màn hình trưởng nhóm hiện «Đã xem».', 'Nếu có «Cần trả lời» hoặc hạn chót, hãy trả lời bằng ngôn ngữ của bạn. Trưởng nhóm nhận bản dịch.'], 'Trao đổi nhanh thì dùng «💬 Trò chuyện» ở góc dưới bên phải.'],
      chatw: ['Trò chuyện trực tiếp', 'Cửa sổ nói chuyện ngay với trưởng nhóm, công ty. Mỗi người viết bằng ngôn ngữ của mình, tin được dịch sang ngôn ngữ người nhận.', ['Chọn người (trưởng nhóm, phòng cả đội) ở «＋ Trò chuyện mới».', 'Nhập rồi Enter để gửi (Shift+Enter xuống dòng). Có nút trả lời nhanh như «Đã nhận».', 'Bản gốc hiện bên dưới tin nhận được. Tin bạn gửi có dấu «Đã xem».', 'Đóng cửa sổ vẫn còn trong «Danh sách». Nhấn 🗑 hai lần để xóa khỏi danh sách của bạn.'], 'Tin mới được báo bằng số đỏ trên nút, âm báo và tiêu đề tab.'],
    },
    en: {
      chat: ['Chats (work screen)', 'The main screen: translate what the other person sent, get an AI summary of the situation and suggested replies.', ['Pick a person from the list on the right. If they are not there, tap “+ New chat” and enter a nickname, messenger and language.', 'Above the input, choose “📥 Add received message” and paste what you copied from the messenger (Ctrl+V) or upload a screenshot.', 'You get the translation, nuance, a situation summary and suggested replies. “Reply with this” copies it in their language.', 'To write your own: “📤 Write a message” → type in your language → “Translate & copy” → paste into the messenger.', '“New window” opens each person in a separate window so you can handle several at once.'], 'If you paste another person’s name or chat, a “wrong room” warning appears. Always check before sending.'],
      contacts: ['Contacts', 'Manage the people (customers) you talk to: messenger, language, profile photo and auto-saved customer details.', ['Find people with the messenger filter and search.', 'Tap a person to see chat history, customer info and anniversaries on one screen.', 'Use “Edit” to change nickname, messenger, language and profile photo (a capture of their messenger profile).', 'Names, phone, email, order numbers and more from the chat are saved to the “Customer info” card automatically. If wrong, remove with × and type it in.'], 'If another agent at your company has the same customer, “○○ is also handling this” appears. Follow your leader’s decision.'],
      agenda: ['Agenda', 'Shows plans, to-dos and anniversaries found in your chats on a calendar.', ['Tap a date to see that day’s plans and anniversaries.', 'Dates and times mentioned in chats create agenda suggestions automatically.', '“Today” jumps back to this month.'], 'You can get a reminder the day before a plan.'],
      anniv: ['Anniversaries', 'Birthdays, the day you first talked, 100 days and more, per person.', ['Upcoming anniversaries are listed nearest first.', 'Birthdays come from contact edits or are detected in chats.', 'Jump to “Gifts” to pick a present and message for the day.'], ''],
      coach: ['Relationship coach', 'Analyses tone, reply speed and depth, then gives example lines to say — and avoid — at your current stage.', ['Pick a person at the top to see your relationship stage and their style.', 'Tap a “say next” example to bring it into the input.', '“Avoid” lists phrases that can cause misunderstanding.'], 'It never suggests meeting in person. As you get closer it suggests a phone or video call first.'],
saju: ['Saju, compatibility & personality', 'Knowing just the customer’s birth date (year-month-day) shows their temperament, strengths, cautions, how to talk to them and favourite topics. Add your own birth date for compatibility.', ['Birthday, age, blood type and MBTI mentioned in chat are saved automatically and shown on the “🔮 Personality” card.', 'Saju screen: day-master personality, tendencies (ten gods), chart strength, balancing energy (lucky colour, numbers, direction) and this year’s luck.', '“🤖 AI personality report”: combines the chart with their real texting style — how to talk, what to avoid, topics (Pro & Business).', 'Birthdays go into anniversaries automatically, with a reminder the day before and on the day.'], 'For fun and reference only. Don’t judge people by it.'],
      gift: ['Gifts', 'Gift ideas and greeting messages by country for birthdays, anniversaries and holidays.', ['Pick a person and an occasion.', 'Gifts by budget and greetings in their language appear. Tap to copy.'], 'It also lists gifts to avoid in each country.'],
      culture: ['Culture', 'Forms of address, etiquette, taboos and ready-to-use lines for each country.', ['Pick a country to see address, greetings, gifts and taboos.', 'Tap an example line to copy it into your chat.'], ''],
      tools: ['Tools', 'Coach, saju, gifts, culture and anniversaries in one place.', ['Tap a tool; it opens for the person you are chatting with.'], ''],
      settings: ['Settings', 'Screen language, your profile, account (sign in / out) and notifications.', ['Change the menu language under “Screen language”. Reply language is set per person.', 'Agents sign out from the account card. To use another account: “Sign in with another account”.', 'Turn sounds and pop-up alerts on or off.'], 'Agent accounts open only on the PC (seat) first used. To move desks, ask your leader to “Reset seat”.'],
      guide: ['How to use', 'Step-by-step instructions for new users.', ['Follow the steps in order to send your first reply.', 'Tap the “?” next to any menu for an explanation of that menu.'], ''],
      inbox: ['Inbox (leader instructions)', 'Instructions and notices from your leader and company, translated into your language.', ['New instructions pop up with a sound. Tap “View” to come here.', 'Opening one shows “Read” on your leader’s screen.', 'If it says “Reply needed” or has a due date, reply in your language — your leader receives a translation.'], 'For quick talk, use “💬 Chat” at the bottom right.'],
      chatw: ['Live chat', 'Talk to your leader and company instantly. Everyone writes in their own language; messages arrive translated.', ['Pick someone (leader, team room) under “＋ New chat”.', 'Type and press Enter to send (Shift+Enter for a new line). Quick replies like “Got it” are there too.', 'The original appears under each received message. Your messages show “Read”.', 'Closed chats stay in “Chats”. Tap 🗑 twice to remove it from your list only.'], 'New messages show a red number, a sound and a tab title alert.'],
    },
  };
  const A = {
    ko: {
      home: ['현황 메뉴', '오늘 운영 상황을 한눈에 보는 첫 화면입니다.', ['현황: 활동 회원·신규·처리 메시지·신고와 어제 대비 증감', '「오늘 처리할 일」에 신고·위험 대화·답장·중복 고객·캡처 시도가 모입니다. 누르면 해당 화면으로 갑니다.'], ''],
      people: ['회원·상담원 메뉴', '사람(회원·상담원)과 그 대화, 근태, 메시지를 다루는 메뉴 묶음입니다.', ['상담원(회원): 계정·대화·고객 정보 확인', '근태: 접속·처리량 달력', '대화: 대화 열람·검색·중복 고객', '메시지: 지시·공지와 답장'], '아래 하위 탭의 「?」를 누르면 각 화면 설명이 나옵니다.'],
      org: ['조직 메뉴', '거래처(회사)·팀·팀장·관리자 계정을 만들고 관리합니다.', ['거래처 → 팀 → 팀장 → 상담원 순서로 만듭니다.'], ''],
      safe: ['신고·기록 메뉴', '신고 처리와 열람·캡처 기록 같은 보안 기록을 봅니다.', ['신고: 접수된 신고 처리', '열람·캡처 기록: 누가 언제 어떤 대화를 열었는지, 캡처를 시도했는지'], ''],
      sys: ['AI·설정 메뉴', 'AI 사용량과 운영 설정(공용 서버·AI 키·운영 모드)을 봅니다.', [], ''],
      dashboard: ['현황 (대시보드)', '내 권한 범위(전체·회사·팀)의 오늘 운영 상황을 한 화면에 보여 줍니다.', ['위 숫자 카드: 메시지 활동 회원·신규 가입·처리한 메시지·미처리 신고, 어제 같은 시각과 비교한 증감', '「오늘 처리할 일」: 미처리 신고, 위험 대화, 팀장 답장, 같은 고객 중복 상담, 캡처 시도(7일), 끊긴 회원 등 — 누르면 바로 그 화면으로', '최근 7일 활동 그래프로 흐름을 봅니다.', '「전체 대화 열기」로 모든 대화를 한 번에 엽니다.', '팀장은 위쪽 「💬 내 상담 화면」으로 직접 상담하고, 맨 위 「🧭 팀장 관리 화면」으로 돌아옵니다.'], '휴대폰으로 열면 운영 현황 타일 화면으로 자동 전환됩니다.'],
      users: ['상담원 / 회원 CRM', '사람별 계정·연락처(고객)·대화·고객 정보를 확인하고 관리합니다.', ['검색창에 닉네임·아이디·고객 닉네임을 넣어 찾습니다.', '사람을 누르면 상세가 맨 위에 열립니다: 고객 목록, 대화(원문 + 한국어 번역), 고객 정보 카드.', '「👁 이 사람 화면 보기 (한국어)」로 그 사람이 보는 화면을 읽기 전용으로 엽니다.', '팀장은 여기서 상담원 계정(아이디·비밀번호·언어)을 만들고 「자리 초기화」를 합니다.', '대화 넘기기: 사람을 열고 「↪ 대화 넘기기」 → 받을 사람 → 「모든 대화 넘기기」 (휴가·병가·퇴사 때).', '계정 삭제: 사람을 열고 아래 「🗑 계정 삭제」 → 닉네임을 그대로 입력 → 삭제. 목록에서 여러 명을 체크해 「선택 계정 삭제」도 됩니다. 로그인 중인 사람은 바로 로그아웃됩니다.'], '삭제는 되돌릴 수 없고 열람·캡처 기록에 「삭제」로 남습니다. 본사는 전체, 회사는 자기 회사, 팀장은 자기 팀원만 지울 수 있습니다.'],
      monitor: ['대화 (열람·검색·중복)', '권한 범위의 모든 대화를 보고 찾는 화면입니다.', ['「대화 내용 검색」: 원문·번역·한국어 어디서든 검색 → 누르면 그 대화의 그 줄로 이동', '「같은 고객 중복 상담」: 같은 앱+닉네임 또는 같은 메시지가 겹친 경우. 프로필 사진을 나란히 보고 「같은 고객 · 담당 지정」 또는 「다른 사람」을 누릅니다.', '위험 표시 대화(금전 요구·외부 연락 유도 등)를 먼저 봅니다.', '대화 삭제: 「🗑 이 대화 전체 삭제」 또는 줄마다 「삭제」 (되돌릴 수 없음)', '담당 넘기기: 상담원이 쉬거나 아플 때 「↪ 담당 넘기기」 → 받을 사람 고르기. 지난 대화·고객 정보가 그대로 옮겨지고 두 사람 모두에게 알림이 갑니다. 팀장은 「⬇ 내 상담으로 가져오기」로 바로 가져올 수 있습니다.'], '판정 결과는 모든 PC의 상담원 화면에 바로 반영됩니다.'],
      notices: ['메시지 (지시·공지)', '상담원·팀장에게 지시와 공지를 보내고 답장을 받는 곳입니다.', ['받는 사람(개인·팀 전체)을 고르고 한국어로 씁니다. 받는 사람마다 그 사람 언어로 번역되어 도착합니다.', '「답장 필요」「마감」을 표시할 수 있고, 읽음 시각이 남습니다.', '회사 관리자 ↔ 팀장도 여기서 서로 지시·요청을 주고받습니다.', '상담원 답장은 한국어로 보입니다.', '전체 메시지는 바로 가지 않고 정해 둔 시간(기본 1분) 뒤 발송됩니다. 위 「⏳ 발송 대기」에서 「발송 취소」 또는 「지금 보내기」.'], '짧은 대화는 오른쪽 아래 「💬 채팅」이 더 빠릅니다.'],
      orgs: ['거래처', '기업고객(회사)을 등록하고 회사 관리자 계정을 만듭니다.', ['「거래처 추가」로 회사 이름과 관리자 아이디·비밀번호를 정합니다.', '회사별 팀 수·상담원 수·상담량을 봅니다.'], ''],
      teams: ['팀·팀장', '팀을 만들고 팀장 계정을 정하고, 팀원(상담원) 계정을 만듭니다.', ['「팀 추가」로 팀 이름·팀장 이름·팀장 아이디·비밀번호를 정합니다.', '팀 카드에서 상담원 계정(닉네임·언어·아이디·비밀번호)을 만듭니다.', '상담원 칩에 자리(PC) 상태가 보입니다. 자리를 옮기면 「자리 초기화」를 누르세요.'], '상담원은 처음 로그인한 PC에서만 열립니다(계정 공유 방지).'],
      attendance: ['근태', '상담원 접속·처리량을 날짜별로 봅니다.', ['오늘: 접속 중·무응답·답장 지연 상태', '월 달력: 사람을 고르면 날짜마다 접속 시작·종료와 처리량', '날짜를 누르면 그날 상세 기록'], '로그인·로그아웃·대화 시간이 자동으로 기록됩니다.'],
      staff: ['관리자 계정', '본사 관리자 계정과 권한(일반고객·기업고객 담당)을 관리합니다.', ['계정을 추가하고 역할을 고릅니다.', '읽기 전용 계정은 열람만 하고 고칠 수 없습니다.'], ''],
      reports: ['신고 처리', '회원·상담원이 보낸 신고를 확인하고 처리합니다.', ['신고를 열어 근거 대화를 확인합니다.', '상태(접수·처리 중·완료)와 조치 내용을 기록합니다.'], ''],
      quality: ['개선 메모', '번역·답장 품질 개선 메모를 모아 처리합니다.', [], ''],
      audit: ['열람·캡처 기록', '누가 언제 어떤 대화를 열었는지, 화면 캡처를 시도했는지 기록을 봅니다.', ['위 필터 칩으로 열람·캡처·로그인 등 종류를 고릅니다.', '회사 관리자와 팀장은 자기 범위의 기록을 봅니다.'], '기록은 지울 수 없습니다.'],
      ai: ['AI 사용량', 'AI 번역·분석 호출 수와 예상 비용을 봅니다.', ['기간별·팀별 사용량과 비용', '무료 번역 사용분은 따로 표시됩니다.'], ''],
      settings: ['운영 설정', '공용 서버 연결, AI 키, 운영 모드 등 시스템 설정입니다.', ['공용 서버: 다른 PC와 데이터 동기화 상태', 'AI 키: 한 번 등록하면 서버에 안전하게 보관되고, 모든 팀이 서버를 통해 AI를 씁니다(화면에 키가 보이지 않습니다).', '실제 운영 모드: 켜면 데모 회원·데이터를 숨깁니다.'], ''],
      chatw: ['실시간 채팅', '사장·회사 → 팀장·상담원, 팀장 → 상담원으로 바로 대화합니다. 각자 언어로 쓰면 번역되어 도착합니다.', ['「＋ 새 대화」에서 사람 또는 단체방(팀 전체방·팀장 전체방)을 고릅니다.', 'Enter로 보내고, 빠른 답장 버튼도 씁니다. 읽음·읽은 사람 수가 표시됩니다.', '닫으면 「대화 목록」에 저장되고, 눌러서 다시 봅니다. 목록의 🗑 두 번이면 내 목록에서만 숨김.', '완전 삭제(관리자·팀장): 대화방 위 🗑 = 방 전체, 메시지에 마우스를 올리면 나오는 「삭제」 = 한 건. 모든 사람 화면에서 사라집니다.'], '새 메시지는 빨간 숫자·알림음·탭 제목으로 알려 줍니다.'],
    },
    zh: {
      home: ['现况菜单', '一眼查看今天运营情况的首页。', ['现况：活跃会员、新增、处理消息、举报，以及与昨天相比的增减', '「今天要处理的事」汇集举报、风险对话、回复、重复客户、截屏尝试，点击即进入对应画面。'], ''],
      people: ['会员・咨询员菜单', '处理人员（会员・咨询员）及其对话、考勤、消息的菜单组。', ['咨询员（会员）：查看账号、对话、客户信息', '考勤：在线和处理量日历', '对话：查看・搜索对话、重复客户', '消息：指示・公告和回复'], '点击下方子标签的「?」可查看各画面说明。'],
      org: ['组织菜单', '创建并管理客户公司、团队、组长、管理员账号。', ['按 客户公司 → 团队 → 组长 → 咨询员 的顺序创建。'], ''],
      safe: ['举报・记录菜单', '查看举报处理和查看・截屏记录等安全记录。', ['举报：处理收到的举报', '查看・截屏记录：谁在何时打开了哪段对话、是否尝试截屏'], ''],
      sys: ['AI・设置菜单', '查看 AI 使用量和运营设置（共享服务器、AI 密钥、运营模式）。', [], ''],
      dashboard: ['现况（仪表盘）', '在一个画面显示我权限范围（全部・公司・团队）内今天的运营情况。', ['上方数字卡片：活跃会员、新注册、处理消息、未处理举报，以及与昨天同一时间相比的增减', '「今天要处理的事」：未处理举报、风险对话、组长回复、同一客户重复咨询、截屏尝试（7天）、失联会员等 — 点击直接进入', '用最近7天活动图查看趋势。', '「打开全部对话」一次打开所有对话。', '组长可点上方「💬 我的咨询画面」亲自咨询，再点最上方「🧭 组长管理画面」返回。'], '用手机打开会自动切换为运营现况卡片画面。'],
      users: ['咨询员 / 会员 CRM', '按人查看和管理账号、联系人（客户）、对话、客户信息。', ['在搜索框输入昵称、账号、客户昵称查找。', '点击人员，详情会在最上方打开：客户列表、对话（原文 + 韩语翻译）、客户信息卡。', '用「👁 查看此人画面（韩语）」以只读方式打开对方看到的画面。', '组长在这里创建咨询员账号（账号・密码・语言）并「重置座位」。', '转交对话：打开人员，点「↪ 转交对话」→ 选择接收人 →「转交全部对话」（休假・病假・离职时）。', '删除账号：打开人员，点下方「🗑 删除账号」→ 原样输入昵称 → 删除。也可在列表勾选多人后「删除所选账号」。正在登录的人会立即退出。'], '删除无法恢复，并以「删除」记录在查看・截屏记录中。总部可删全部，公司只能删本公司，组长只能删本组成员。'],
      monitor: ['对话（查看・搜索・重复）', '查看和查找权限范围内所有对话的画面。', ['「对话内容搜索」：原文、翻译、韩语都能搜 → 点击跳到该对话的那一行', '「同一客户重复咨询」：同一应用+昵称或相同消息重叠时。并排查看头像，点「同一客户 · 指定负责人」或「不同的人」。', '优先查看风险标记对话（索要金钱、诱导外部联系等）。', '删除对话：「🗑 删除整个对话」或每行的「删除」（无法恢复）', '转交负责人：咨询员休息或生病时点「↪ 转交负责人」→ 选择接收人。过去的对话和客户信息会一起转移，双方都会收到通知。组长可用「⬇ 拿到我的咨询」直接接手。'], '判定结果会立即反映到所有电脑的咨询员画面。'],
      notices: ['消息（指示・公告）', '向咨询员和组长发送指示、公告并接收回复的地方。', ['选择收件人（个人・全组），用韩语书写，每个人会收到翻译成自己语言的内容。', '可标记「需要回复」「期限」，并保留已读时间。', '公司管理员 ↔ 组长也在这里互相发送指示和请求。', '咨询员的回复以韩语显示。', '全体消息不会立即发出，会在设定时间（默认1分钟）后发送。可在上方「⏳ 等待发送」中「取消发送」或「立即发送」。'], '简短沟通用右下角「💬 聊天」更快。'],
      orgs: ['客户公司', '登记企业客户（公司）并创建公司管理员账号。', ['用「添加客户公司」设定公司名称和管理员账号・密码。', '查看各公司的团队数、咨询员数、咨询量。'], ''],
      teams: ['团队・组长', '创建团队、设定组长账号、创建组员（咨询员）账号。', ['用「添加团队」设定团队名称、组长姓名、组长账号・密码。', '在团队卡片创建咨询员账号（昵称・语言・账号・密码）。', '咨询员标签上会显示座位（电脑）状态。换座位时点「重置座位」。'], '咨询员只能在首次登录的电脑使用（防止共用账号）。'],
      attendance: ['考勤', '按日期查看咨询员的在线和处理量。', ['今天：在线、无响应、回复延迟状态', '月历：选择人员后显示每天的上线・下线时间和处理量', '点击日期查看当天详细记录'], '登录、退出、对话时间会自动记录。'],
      staff: ['管理员账号', '管理总部管理员账号和权限（负责普通客户・企业客户）。', ['添加账号并选择角色。', '只读账号只能查看不能修改。'], ''],
      reports: ['举报处理', '查看并处理会员和咨询员提交的举报。', ['打开举报查看依据对话。', '记录状态（受理・处理中・完成）和处理内容。'], ''],
      quality: ['改进备忘', '收集并处理翻译・回复质量改进备忘。', [], ''],
      audit: ['查看・截屏记录', '查看谁在何时打开了哪段对话、是否尝试截屏的记录。', ['用上方筛选标签选择查看、截屏、登录等类型。', '公司管理员和组长可查看自己范围内的记录。'], '记录无法删除。'],
      ai: ['AI 使用量', '查看 AI 翻译・分析的调用次数和预计费用。', ['按期间・团队查看使用量和费用', '免费翻译部分单独显示。'], ''],
      settings: ['运营设置', '共享服务器连接、AI 密钥、运营模式等系统设置。', ['共享服务器：与其他电脑的数据同步状态', 'AI 密钥：登记一次即安全保存在服务器，所有团队通过服务器使用 AI（画面上不显示密钥）。', '正式运营模式：开启后隐藏演示会员和数据。'], ''],
      chatw: ['实时聊天', '老板・公司 → 组长・咨询员，组长 → 咨询员 直接对话。各用各的语言，自动翻译送达。', ['在「＋ 新对话」选择人员或群（全组群・组长群）。', '按 Enter 发送，也可用快捷回复。会显示已读和已读人数。', '关闭后保存在「聊天列表」，点击可再看。列表中连按两次 🗑 只从我的列表隐藏。', '彻底删除（管理员・组长）：聊天窗口上方 🗑 = 整个对话，鼠标移到消息上出现的「删除」= 单条。所有人的画面都会消失。'], '新消息会以红色数字、提示音、标签标题提醒。'],
    },
  };
  const UI = {
    ko: { how: '이렇게 쓰세요', tip: '알아 두세요', close: '닫기', more: '안내서 전체 보기', q: '이 메뉴 설명 보기' },
    zh: { how: '使用方法', tip: '提示', close: '关闭', more: '查看完整指南', q: '查看此菜单说明' },
    ja: { how: '使い方', tip: 'ポイント', close: '閉じる', more: 'ガイドを見る', q: 'このメニューの説明' },
    vi: { how: 'Cách dùng', tip: 'Lưu ý', close: 'Đóng', more: 'Xem toàn bộ hướng dẫn', q: 'Xem giải thích menu' },
    en: { how: 'How to use', tip: 'Good to know', close: 'Close', more: 'Open the full guide', q: 'What is this menu?' },
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const isAdmin = () => /^#\/admin/.test(location.hash) && !(window.Store && Store.viewingAs && Store.viewingAs());
  let adminLang = 'ko'; try { adminLang = localStorage.getItem('lm_help_lang') || 'ko'; } catch (e) {}
  function lang() { if (isAdmin()) return adminLang; const l = (window.__lmLang && window.__lmLang()) || 'ko'; return M[l] ? l : 'en'; }
  function entry(key) { const L = lang(); const D = isAdmin() ? A : M; return (D[L] || D.ko)[key] || null; }

  // 화면 경로 → 도움말 키
  function routeKey() {
    const h = location.hash || '#/chat';
    let m = h.match(/^#\/admin\/([a-z]+)/); if (m) return m[1] === 'aiusage' ? 'ai' : m[1];
    if (/^#\/admin/.test(h)) return 'dashboard';
    m = h.match(/^#\/([a-z-]+)/); const k = m ? m[1] : 'chat';
    return ({ home: 'chat', helper: 'chat', today: 'chat', contact: 'contacts', 'contact-edit': 'contacts' })[k] || k;
  }
  function q(key, cls) { return `<span class="hq${cls ? ' ' + cls : ''}" role="button" tabindex="0" data-help="${key}" aria-label="${esc((UI[lang()] || UI.ko).q)}">?</span>`; }

  // 메뉴·제목 옆에 「?」 붙이기 (화면을 다시 그릴 때마다)
  function decorate() {
    const add = (el, key, cls) => { if (!el || el.querySelector(':scope > .hq') || !entry(key)) return; el.insertAdjacentHTML('beforeend', q(key, cls)); };
    document.querySelectorAll('.ws-rail button[data-go], nav.bottom button[data-go]').forEach((b) => { const k = (b.dataset.go || '').replace(/^#\//, '').split(/[/?]/)[0]; add(b, k, 'hq-nav'); });
    if (isAdmin()) {
      const GK = { dashboard: 'home', users: 'people', attendance: 'people', monitor: 'people', notices: 'people', orgs: 'org', teams: 'org', staff: 'org', reports: 'safe', quality: 'safe', audit: 'safe', ai: 'sys', settings: 'sys' };
      const hasSub = !!document.querySelector('.admin-sub');
      document.querySelectorAll('.admin-menu a[href^="#/admin/"]').forEach((a) => { const k = a.getAttribute('href').replace('#/admin/', '').split(/[/?]/)[0]; add(a, hasSub ? GK[k] || k : k, 'hq-sm'); });
      document.querySelectorAll('.admin-sub a[href^="#/admin/"]').forEach((a) => { const k = a.getAttribute('href').replace('#/admin/', '').split(/[/?]/)[0]; add(a, k, 'hq-sm'); });
      document.querySelectorAll('.mo-actions a[href^="#/admin/"]').forEach((a) => { const k = a.getAttribute('href').replace('#/admin/', '').split(/[/?]/)[0]; add(a, k, 'hq-sm'); });
    }
    const app = document.getElementById('app');
    const st = !isAdmin() && app && app.querySelector('header.top strong.ellipsis');
    if (st && !(st.nextElementSibling && st.nextElementSibling.classList.contains('hq')) && entry(routeKey())) st.insertAdjacentHTML('afterend', q(routeKey(), 'hq-title'));
    const h1 = app && app.querySelector('main h1, .screen h1, .content h1, h1');
    if (h1 && !st && !h1.closest('#al, .ob, #ob-form, .modal')) add(h1, routeKey(), 'hq-title');
    const cwh = document.querySelector('.cw-head > b, .cw-head .cw-ht b'); if (cwh && !document.querySelector('.cw-head .hq')) cwh.insertAdjacentHTML('beforeend', q('chatw', 'hq-cw'));
  }

  // 설명 창
  function close() { const p = document.getElementById('hq-pop'); if (p) p.remove(); document.removeEventListener('keydown', onKey); }
  function onKey(e) { if (e.key === 'Escape') close(); }
  function show(key, anchor) {
    close(); const e = entry(key); if (!e) return; const L = lang(); const U = UI[L] || UI.ko;
    const [title, desc, steps, tip] = e;
    const guide = isAdmin() ? (L === 'zh' ? 'guide-zh.html' : 'guide.html') : (window.Store && Store.me && Store.me() && Store.me().agent ? (L === 'zh' ? 'guide-agent-zh.html' : 'guide-agent.html') : '#/guide');
    const p = document.createElement('div'); p.id = 'hq-pop'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', title);
    p.innerHTML = `<div class="hq-h"><b>${esc(title)}</b>${isAdmin() ? `<span class="hq-lang"><button type="button" data-hl="ko" class="${L === 'ko' ? 'on' : ''}">한국어</button><button type="button" data-hl="zh" class="${L === 'zh' ? 'on' : ''}">中文</button></span>` : ''}<button type="button" class="hq-x" aria-label="${esc(U.close)}">×</button></div>
      <p class="hq-d">${esc(desc)}</p>
      ${steps && steps.length ? `<p class="hq-k">${esc(U.how)}</p><ol class="hq-s">${steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
      ${tip ? `<p class="hq-t"><b>${esc(U.tip)}</b> ${esc(tip)}</p>` : ''}
      <a class="hq-more" href="${guide}" ${/^#/.test(guide) ? '' : 'target="_blank" rel="noopener"'}>${esc(U.more)} →</a>`;
    document.body.appendChild(p);
    // 위치: 버튼 옆, 화면 밖으로 나가지 않게 (휴대폰은 아래쪽 시트)
    const r = anchor.getBoundingClientRect(); const W = innerWidth, H = innerHeight;
    if (W <= 600) { p.classList.add('sheet'); }
    else {
      const pw = Math.min(380, W - 24); p.style.width = pw + 'px';
      let x = r.right + 10, y = r.top - 8;
      if (x + pw > W - 12) x = Math.max(12, r.left - pw - 10);
      if (x < 12) { x = Math.min(Math.max(12, r.left), W - pw - 12); y = r.bottom + 8; }
      const ph = p.offsetHeight; if (y + ph > H - 12) y = Math.max(12, H - ph - 12);
      p.style.left = x + 'px'; p.style.top = y + 'px';
    }
    p.querySelector('.hq-x').addEventListener('click', close);
    p.querySelectorAll('[data-hl]').forEach((b) => b.addEventListener('click', (ev) => { ev.stopPropagation(); adminLang = b.dataset.hl; try { localStorage.setItem('lm_help_lang', adminLang); } catch (er) {} show(key, anchor); }));
    document.addEventListener('keydown', onKey);
  }

  // 「?」 누르면 메뉴로 이동하지 않고 설명만
  function hit(ev) {
    const t = ev.target.closest && ev.target.closest('[data-help]');
    if (!t) { const p = document.getElementById('hq-pop'); if (p && !p.contains(ev.target)) close(); return; }
    ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
    if (ev.type === 'click' || ev.type === 'keydown') { const p = document.getElementById('hq-pop'); if (p && p.dataset.k === t.dataset.help) { close(); return; } show(t.dataset.help, t); const np = document.getElementById('hq-pop'); if (np) np.dataset.k = t.dataset.help; }
  }
  ['pointerdown', 'mousedown', 'click'].forEach((ty) => document.addEventListener(ty, hit, true));
  document.addEventListener('keydown', (ev) => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.closest && ev.target.closest('[data-help]')) hit(ev); }, true);

  let tm = 0; const sched = () => { clearTimeout(tm); tm = setTimeout(decorate, 60); };
  const start = () => { decorate(); new MutationObserver(sched).observe(document.body, { childList: true, subtree: true }); };
  window.addEventListener('hashchange', () => { close(); sched(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.LMHelp = { show, decorate, entry, routeKey };
})();
