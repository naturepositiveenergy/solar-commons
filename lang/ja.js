// 日本語テキスト（Solar Commons）
//
// 各行は   "コード": "テキスト",
// 右側のテキストだけを変更してください。左側のコードは変更しないでください。
// {波かっこ} の部分はゲームが値を入れます。そのまま残してください。
// {name:1} は小数点以下1桁の数値、{name:+1} はプラスの数値に + を付けます。
// ここにあるコードは、すべて lang/en.js にも必要です。

SC_LANG.ja = {
  // ----- 言語切り替え -----
  "lang.name": "日本語",                  // この言語の名前（この言語で表記）
  "lang.switchLabel": "言語",

  // ----- スタート画面 -----
  "app.pageTitle": "ソーラー・コモンズ",   // ブラウザのタブに表示
  "app.title": "ソーラー・コモンズ",
  "start.subtitle": "自然と地域とともに、太陽光発電所をつくろう。",
  "start.newGame": "新しいゲーム",

  // ----- ゲーム画面（マイルストーン2までの仮の画面） -----
  "game.placeholderTitle": "新しいゲーム",
  "game.placeholderNote": "ゲーム画面は制作中です。上の数値はゲームのルールから読み込んでいて、つながっていることを示しています。",
  "game.backToTitle": "タイトルに戻る",

  // ----- 資源 -----
  "stat.turn": "ターン",
  "stat.turnValue": "{turn} / {turns}",
  "stat.money": "資金",
  "stat.trust": "信頼",

  // ----- 候補地の種類 -----
  "site.farmland": "耕作放棄地",
  "site.agri": "営農型（ソーラーシェアリング）",
  "site.forest": "森林の斜面",
  "site.brownfield": "ブラウンフィールド（工場跡地など）",
  "site.reservoir": "ため池（水上設置）",

  // ----- 住民 -----
  "resident.farmer": "農家",
  "resident.elderly": "高齢の住民",
  "resident.family": "子育て世帯",
  "resident.nature": "自然保護団体",
  "resident.jichikai": "自治会長",

  // ----- 地域との対話 -----
  "action.genuine": "対話型の説明会",
  "action.visit": "個別訪問",
  "action.tour": "専門家との現地見学会",
  "action.fund": "市民ファンド",
  "action.benefit": "地域還元協定",

  // ----- 操作ができないときのメッセージ -----
  "err.noSite": "その候補地はありません。",
  "err.tooManyTiles": "設計で{tiles}タイルを使っていますが、敷地は{max}タイルです。",
  "err.noPanels": "パネルのタイルを1つ以上置いてください。",
  "err.engageStatus": "地域との対話は、設計中と許認可手続き中にできます。",
  "err.needAP": "行動ポイントが{need}必要です（残り{left}）。",
  "err.fundDone": "市民ファンドはすでに設立しています。",
  "err.benefitDone": "地域還元協定はすでに結んでいます。",
  "err.submitStatus": "申請できるのは設計中のプロジェクトだけです。",
  "err.planningCost": "計画費用{cost:1}が資金を上回っています。",
  "err.sellStatus": "売却できるのは稼働中の発電所だけです。",

  // ----- ゲームの記録 -----
  "log.projectStarted": "プロジェクト{id}を開始：{site}。容量{cap:1}、費用{cost:1}。",
  "log.projectStartedPromo": "プロジェクト{id}を開始：{site}（促進区域内）。容量{cap:1}、費用{cost:1}。",
  "log.submitted": "プロジェクト{id}を申請しました（法定の説明会を形式的に開催）。許認可まで{turns}ターン、受容度{A:0}。",
  "log.submittedGenuine": "プロジェクト{id}を申請しました（事前に対話型の説明会を実施し、法定の説明会も開催）。許認可まで{turns}ターン、受容度{A:0}。",
  "log.sold": "プロジェクト{id}を{price:1}で売却しました。",
  "log.strike": "地域からの警告（{reason}）。警告の数：{strikes}。",
  "log.ordinance": "自治体が太陽光発電の条例を制定しました：許認可が長くなり、自治会の同意が必要になり、森林での開発は禁止されます。",
  "log.cancelled": "プロジェクト{id}は中止になりました（{reason}）。信頼 −{trust}。",
  "log.typhoon": "出来事：台風。{hit}か所の発電所が被害を受けました。",
  "log.heavyRain": "出来事：豪雨。{hit}か所の発電所が被害を受けました。",
  "log.gridDelay": "出来事：系統接続の遅れ。プロジェクト{id}が{turns}ターン遅れます。",
  "log.gridDelayNone": "出来事：地域で系統接続が遅れています（影響なし）。",
  "log.curtailment": "出来事：このターンは出力制御が行われます。",
  "log.policyChange": "出来事：制度変更。収入 ×{factor}。",
  "log.rival": "出来事：他の事業者による問題のある開発。信頼 −{trust}。",
  "log.media": "出来事：地元メディアの報道で、いまの世論がさらに強まりました。",
  "log.rareFound": "出来事：あなたの発電所で希少種が見つかりました。評判 +{rep}。",
  "log.rareNone": "出来事：希少種の調査。今回は見つかりませんでした。",
  "log.objection": "プロジェクト{id}に反対意見（{count}件目）。{delay}ターン遅れます。",
  "log.consentRefused": "プロジェクト{id}について、自治会の同意が得られませんでした（受容度{A:0}）。",
  "log.approved": "プロジェクト{id}が許可されました。",
  "log.constructionStarted": "プロジェクト{id}の工事を開始しました（支払い{paid:1}）。",
  "log.waitingFunds": "プロジェクト{id}は資金待ちです（{need:1}必要）。",
  "log.operating": "プロジェクト{id}が稼働を始めました。受容度{A:0}、信頼{dT:+1}。",
  "log.neglected": "新しい所有者がプロジェクト{id}の管理を怠っています。信頼 −{trust}。",
  "log.lostMoney": "ゲームオーバー：資金が2ターン続けてマイナスになりました。",
  "log.lostTrust": "ゲームオーバー：地域の信頼が失われました。",

  // ----- 地域からの警告の理由（log.strike に入ります） -----
  "strike.cancelled": "プロジェクトの中止",
  "strike.cheapDamaged": "安価な工法のプロジェクト{id}が被害",
  "strike.landslide": "プロジェクト{id}で土砂崩れ",
  "strike.runoff": "安価な工法のプロジェクト{id}で土砂流出",
  "strike.rival": "他の事業者による問題のある開発",
  "strike.lowAcceptance": "プロジェクト{id}の受容度が低い",
  "strike.forestNegativeB": "生物多様性がマイナスの森林の発電所{id}",

  // ----- 中止の理由（log.cancelled に入ります） -----
  "cancel.objections": "反対意見が多すぎる",
  "cancel.acceptance": "受容度{A:0}",
  "cancel.consent": "自治会の同意が得られない",

  // ----- 最終評価についての注記 -----
  "score.lost": "ゲームオーバー。",
  "score.noPark": "発電所が1つも完成していません。",
  "score.capMissed": "発電容量の目標に届きませんでした。"
};
