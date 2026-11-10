# Policy notebook: draft texts for review

**Status: reviewed and approved on 6 November 2026; in the game since Milestone 4. The FIT/FIP and promotion zone entries were updated for rules v0.8 (approved on 6 November 2026), the agrivoltaics entry for rules v0.9 (approved on 10 November 2026).** Researched on 6 November 2026. When a policy changes, update the texts here and in the language files (`nb.<id>.…`), and the source link in `js/notebook.js`.

These texts will appear in the game's policy notebook (政策ノート), in Japanese and English. Each entry has:

- **In the game:** what the policy does in Solar Commons (one sentence; must match docs/design.md).
- **In reality:** the real policy, in one or two sentences, for players without background knowledge.
- **Unlocks when:** when the entry is counted as "discovered" in a game. Every entry can always be read from the title screen, and through the ⓘ buttons.

After your review, the texts move into `lang/en.js` and `lang/ja.js`. This file stays as the record of sources.

**About the sources:** the Agency for Natural Resources and Energy site (enecho.meti.go.jp) blocks automated reading, and several PDFs could not be opened here. Facts marked *(secondary)* come from law firm notes, municipal pages or trade press that cite the official documents, not from the official text itself. Each entry ends with **Please check**: the points I am least sure about.

---

## Important: 2026 changes that affect the game's economics

1. **FIT/FIP for ground-mounted solar ends.** The procurement price committee (調達価格等算定委員会, 110th meeting, January 2026) agreed that new ground-mounted business solar of 10 kW and above will no longer receive FIT/FIP support from fiscal year 2027. Rooftop solar keeps support. Projects that are already certified keep their support. *(secondary: ITmedia, 環境ビジネス; official: the committee's opinion of 5 Feb 2026)*
2. **Possible exceptions ("support focus", 支援重点化).** On 30 September 2026, a draft from the secretariat proposed continued support for four groups: land owned by national or local government, **projects certified in a promotion zone (促進区域)**, solar carports, and infrastructure spaces. 営農型 is "under continued review". This is a proposal; prices and criteria are expected around January 2027. *(secondary: cycle-tank)*

**In the game since rules v0.8:** projects submitted from turn 5 (fiscal year 2027) sell at market prices without FIT/FIP. Projects with the promotion zone bonus keep FIT/FIP; this is the only exception in the game, because the other exceptions (public land, carports, infrastructure) do not exist there. See docs/design.md, section 6. **Revisit after the final decision (expected around January 2027),** especially if agrivoltaics get an exception.

---

## 1. Resident briefing — 住民説明会（再エネ特措法） `briefing`

**Unlocks when:** you start your first project (the submit button "hold formal 説明会 and submit" appears).

**In the game**
- EN: Every project holds a formal 説明会 when it is submitted. A genuine dialogue before submission wins support and shortens the permit time.
- JA: どのプロジェクトも、申請のときに法定の説明会を開きます。申請前に対話型の説明会を開くと、支持が高まり、許認可の期間も短くなります。

**In reality**
- EN: Since April 2024, solar projects must inform nearby residents before applying for FIT/FIP certification. Projects of 50 kW and above, and projects in areas with a high risk to their surroundings, must hold a briefing; smaller projects elsewhere can use other forms of prior notice.
- JA: 2024年4月から、FIT/FIP認定を申請する前に、周辺の住民へ事業を知らせることが義務になりました。50kW以上の事業や周辺への影響が大きい区域の事業は説明会を開く必要があり、それ以外の小規模な事業は説明会以外の事前周知でもよいとされています。

**Sources**
- 資源エネルギー庁, notice on 説明会 procedures (13 Aug 2024): https://www.enecho.meti.go.jp/category/saving_and_new/saiene/kaitori/dl/announce/20240813.pdf
- 横浜市, 再エネ特措法の改正について: https://www.city.yokohama.lg.jp/business/bunyabetsu/kankyo-koen-gesui/ondanka/saienetokuso.html
- 西村あさひ newsletter (Mar 2024) *(secondary)*: https://www.nishimura.com/sites/default/files/newsletters/file/finance_law_240307_ja.pdf
- AMT bulletin on the April 2025 revision *(secondary)*: https://amt-law.com/asset/pdf/bulletins12_pdf/250526.pdf

**Please check:** the exact definition of the "high-risk areas" and the 50 kW line; what changed with the April 2025 revision of the guideline (law firm notes mention cases where a briefing can be omitted); the timing (reports say at least 3 months before the application).

---

## 2. Farmland conversion — 農地転用 `farmland`

**Unlocks when:** you start a project on abandoned farmland.

**In the game**
- EN: Building on abandoned farmland needs a farmland conversion permit: +1 permit turn.
- JA: 耕作放棄地に建設するには農地転用の許可が必要です：許認可が1ターン長くなります。

**In reality**
- EN: Using farmland for anything other than farming needs permission under the Farmland Act (農地法), usually from the prefectural governor. The best farmland is in principle protected, and abandoned farmland still counts as farmland unless the agricultural committee judges that it can no longer be farmed.
- JA: 農地を農業以外に使うには、農地法に基づく許可が必要で、多くは都道府県知事が許可します。優良な農地は原則として転用できず、耕作放棄地も、農業委員会が農地として使えないと判断しない限り農地として扱われます。

**Sources**
- 農林水産省, 農業振興地域制度と農地転用許可制度: https://www.maff.go.jp/j/nousin/noukei/totiriyo/pdf/noushin_nouten.pdf
- 農林水産省, 参考資料（農地転用許可制度）: https://www.maff.go.jp/j/nousin/noukei/totiriyo/tenyou_kisei/270403/pdf/sankou1.pdf

**Please check:** who grants the permit today (the MAFF material found is from 2009/2015; I believe the 4 ha rule changed in 2016 and designated municipalities can also grant permits, so the text avoids details); whether the wording on abandoned farmland (非農地判断) is accurate enough.

---

## 3. Agrivoltaics — 営農型太陽光発電（一時転用） `agri`

**Unlocks when:** you start a project on an agrivoltaics site.

**In the game**
- EN: Agrivoltaics needs a temporary conversion permit for the posts that hold the panels, and the farmer partner supports the project. At the end of each fiscal year, the park reports its harvest. With more dense than wide-spaced panels, the crops get too little light: a poor harvest brings guidance, and you can thin out the panels. Two poor reports in a row revoke the permit, and the park must be removed.
- JA: 営農型太陽光発電では、パネルを支える支柱の部分に一時転用の許可が必要で、パートナーの農家が事業を支持します。毎年度末に、発電所は収穫を報告します。密なパネルが間隔を空けたパネルより多いと、作物に光が足りません。収穫が不十分だと指導を受け、パネルを間引くことができます。2回続けて不十分だと許可が取り消され、発電所を撤去しなければなりません。

**In reality**
- EN: Panels stand on posts above fields that are still farmed; only the land under the posts is converted, for a limited time. The harvest must be reported every year, and yields must not fall more than about 20% below the local average. Poor results bring guidance; serious cases left uncorrected can lead to refusal of re-permission and an order to remove the panels. A new framework, approved by an expert panel of the agriculture ministry in April 2026, takes effect in April 2027: it limits shading to under 30% in principle and recommends rice, wheat and soybeans.
- JA: 耕作を続ける農地の上に支柱を立ててパネルを設置し、支柱の部分だけを期間を限って転用します。毎年の収穫の報告が義務で、単収は地域の平均と比べて2割以上減ってはいけません。結果が不十分だと指導を受け、改善されない深刻な場合は、再許可が認められず、設備の撤去を命じられることがあります。2026年4月に農林水産省の検討会が了承した新しい枠組みは、2027年4月から始まります。遮光率を原則30％未満とし、米・麦・大豆の栽培を推奨しています。

**Sources**
- 農林水産省 guideline (Mar 2024), copy on 埼玉県 site: https://www.pref.saitama.lg.jp/documents/9554/02_einogata-14.pdf
- 農林水産省, 資料（営農型太陽光発電の規律強化）: https://www.maff.go.jp/j/study/attach/pdf/250609-22.pdf
- 環境省, 資料（令和8年3月）: https://www.env.go.jp/content/000388043.pdf
- SOLAR JOURNAL, 制度見直し案を了承 (24 Apr 2026) *(secondary)*: https://solarjournal.jp/policy/63472/
- SOLAR JOURNAL, 遮光率は30％未満 (11 Mar 2026) *(secondary)*: https://solarjournal.jp/policy/62883/
- PwC, 営農型太陽光発電の新たな制度枠組み (27 Aug 2026) *(secondary)*: https://www.pwc.com/jp/ja/knowledge/news/legal-news/legal-20260827-3.html
- 農林水産省, 営農型太陽光発電について: https://www.maff.go.jp/j/shokusan/renewable/energy/einou.html

**Please check:** the 2026 framework (expert panel of 15 April 2026: legal basis moved to the 農山漁村再エネ法, shading under 30% in principle, rice, wheat and soybeans recommended) is known only from secondary sources. Its start date, April 2027, comes from the project owner (10 November 2026): add the official notice as a source once it is published, and confirm the final shading value (30%). The permit periods ("3 or 10 years") are still left out because I could not confirm the current wording. In the game, "at least as many wide-spaced as dense panels" stands for the shading limit; it is a game simplification, not the real measure.

---

## 4. Forest development permit — 林地開発許可 `forest`

**Unlocks when:** you start a project on a forested slope.

**In the game**
- EN: Building on a forested slope needs a forest development permit: +2 permit turns, and drainage adds 20% to the building cost.
- JA: 森林の斜面に建設するには林地開発許可が必要です：許認可が2ターン長くなり、排水設備のため建設費が20%増えます。

**In reality**
- EN: Clearing forest for development needs a permit from the prefecture under the Forest Act (森林法), with measures against landslides and floods such as drainage and retention ponds. For solar, a permit has been needed from 0.5 ha (instead of 1 ha) since April 2023.
- JA: 森林を開発するには、森林法に基づく都道府県知事の許可が必要で、排水施設や調整池など、土砂災害や水害を防ぐ対策が求められます。太陽光発電の場合、2023年4月から、許可が必要な規模が1ha超から0.5ha超に引き下げられました。

**Sources**
- 農林水産省 中国四国農政局 (Jul 2023): https://www.maff.go.jp/chushi/press/kikaku/attach/pdf/230707-15.pdf
- 資源エネルギー庁, 資料: https://www.enecho.meti.go.jp/category/saving_and_new/saiene/community/dl/08_03.pdf
- 愛知県, 林地開発許可制度: https://www.pref.aichi.jp/soshiki/shinrin/0000070370.html

**Please check:** nothing major; this one is well documented.

---

## 5. Local solar ordinances — 太陽光発電に関する条例 `ordinance`

**Unlocks when:** your municipality passes its ordinance in the game.

**In the game**
- EN: After repeated problems in the region, the municipality passes an ordinance: longer permits, the 自治会 must agree, and no projects on forest sites. It applies to all later projects, including good ones.
- JA: 地域で問題が重なると、自治体が条例を制定します：許認可が長くなり、自治会の同意が必要になり、森林での事業はできなくなります。条例は、良い事業も含めて、その後のすべての事業に適用されます。

**In reality**
- EN: Many prefectures and municipalities have passed their own rules for solar parks, often after landslides or conflicts with residents. Yamanashi Prefecture's ordinance of 2021, for example, in principle bans new solar parks in forests and landslide-risk areas, and requires a permit, an environmental assessment and a residents' briefing for exceptions.
- JA: 土砂災害や住民とのトラブルをきっかけに、多くの都道府県や市町村が太陽光発電に関する独自の条例を定めています。たとえば山梨県の条例（2021年）は、森林や土砂災害のおそれがある区域への新規設置を原則として禁止し、例外には知事の許可、環境アセスメント、住民説明会を求めています。

**Sources**
- 山梨県太陽光発電施設の適正な設置及び維持管理に関する条例: https://www.pref.yamanashi.jp/somu/shigaku/reiki/reiki_honbun/a500RG00001801.html
- 経済産業省, 地域共生WG 資料: https://www.meti.go.jp/shingikai/enecho/denryoku_gas/saisei_kano/kyosei_wg/pdf/002_07_00.pdf

**Please check:** whether you prefer another example; I did not find a reliable current count of municipalities with solar ordinances, so the text says "many".

---

## 6. Promotion zones — 促進区域（地域脱炭素化促進事業） `promo`

**Unlocks when:** you start a project on a site in a promotion zone.

**In the game**
- EN: A site in a promotion zone gives a bonus if, at submission, the biodiversity target is 40 or more and there is a citizen fund or benefit agreement: 1 permit turn faster, more acceptance and fewer objections. From fiscal year 2027, the bonus also keeps FIT or FIP, which other new projects no longer get.
- JA: 促進区域の候補地では、申請時に生物多様性の目標が40以上で、市民ファンドか地域還元協定があれば、ボーナスがあります：許認可が1ターン早くなり、受容度が上がり、反対が起きにくくなります。2027年度以降は、ほかの新しいプロジェクトが受けられないFIT・FIPも、ボーナスがあれば受けられます。

**In reality**
- EN: Under the Global Warming Countermeasures Act (in force since April 2022), municipalities can set promotion zones for renewables together with local stakeholders, leaving out areas such as nature reserves. Projects certified there must contribute to the local community and environment, and can handle several permits in one procedure. From fiscal year 2027, certified projects in promotion zones are being considered as one of the few cases of ground-mounted solar that keep FIT or FIP; a decision is expected around January 2027.
- JA: 地球温暖化対策推進法（2022年4月施行）に基づき、市町村は地域の関係者と話し合いながら、自然保護区などを除いて再エネを促進する区域を設定できます。そこで市町村の認定を受けた事業は、地域や環境への貢献が求められ、複数の許認可の手続をまとめて行えます。2027年度以降も地上設置の太陽光でFIT・FIPの支援が続く例外として、促進区域で認定を受けた事業が検討されています（2027年1月ごろ決定の見込み）。

**Sources**
- 環境省, 地域脱炭素化促進事業制度: https://www.env.go.jp/content/000395587.pdf
- 環境省, 資料: https://www.env.go.jp/content/900496043.pdf

- cycle-tank, 支援重点化 (Oct 2026) *(secondary)*: https://www.cycle-tank.com/post/20261012%E4%BA%8B%E6%A5%AD%E7%94%A8%E5%A4%AA%E9%99%BD%E5%85%89%E3%81%AEfit-fip%E6%94%AF%E6%8F%B4%E9%87%8D%E7%82%B9%E5%8C%96%E3%81%A8%E3%81%AF

**Please check:** the exception for certified promotion-zone projects is a proposal (30 September 2026), known only from a secondary source. Update the last sentence of "In reality" after the decision (expected around January 2027).

---

## 7. FIT and FIP — 固定価格買取（FIT）と市場連動（FIP） `fitfip`

**Unlocks when:** fiscal year 2027 begins (turn 5), or your first park starts operating.

**In the game**
- EN: Projects submitted in fiscal year 2026 (turns 1 to 4) get FIT or FIP: below capacity 30, a fixed price (FIT) gives steady income; from 30, the price follows the market (FIP) and income varies. Projects submitted from fiscal year 2027 sell at market prices without support: income is about 20% lower on average and varies more. Projects with the promotion zone bonus keep FIT or FIP.
- JA: 2026年度（ターン1〜4）に申請したプロジェクトは、FIT・FIPを受けられます。容量30未満は固定価格（FIT）で収入が安定し、30以上は価格が市場に連動して（FIP）収入が変わります。2027年度以降に申請したプロジェクトは支援なしの市場価格で売電し、収入は平均で約2割低く、変動も大きくなります。促進区域のボーナスを得たプロジェクトは、FIT・FIPを受けられます。

**In reality**
- EN: Under FIT, power is bought at a fixed price for many years; under FIP (since April 2022), generators sell on the market and receive a premium on top. From fiscal year 2027, new ground-mounted business solar of 10 kW and more no longer gets FIT or FIP; projects already certified and rooftop solar keep their support. Without support, parks sell their power on the market or under long-term contracts with companies (corporate PPAs). Continued support for some cases, such as certified projects in promotion zones and projects on public land, is under discussion (as of November 2026).
- JA: FITでは電気が長期間、固定価格で買い取られます。FIP（2022年4月〜）では市場で電気を売り、そのうえにプレミアムを受け取ります。2027年度からは、10kW以上の新しい地上設置の事業用太陽光はFIT・FIPの支援対象外となります。すでに認定を受けた事業と屋根設置の太陽光は、支援が続きます。支援のない発電所は、市場や企業との長期契約（コーポレートPPA）で電気を売ります。促進区域で認定を受けた事業や公有地の事業など、一部については支援の継続が検討されています（2026年11月時点）。

**Sources**
- 資源エネルギー庁, FIT/FIP 価格表: https://www.enecho.meti.go.jp/category/saving_and_new/saiene/kaitori/fit_kakaku.html
- 調達価格等算定委員会, 令和8年度以降の調達価格等に関する意見 (5 Feb 2026): https://www.meti.go.jp/shingikai/santeii/pdf/20260205_1.pdf
- ITmedia スマートジャパン (14 Jan 2026) *(secondary)*: https://www.itmedia.co.jp/smartjapan/articles/2601/14/news048.html
- 環境ビジネス *(secondary)*: https://www.kankyo-business.jp/news/d602b039-d71e-4616-8ce8-3cda4c3aefd0
- スマートグリッドフォーラム, 買取価格の決定 (March 2026) *(secondary)*: https://sgforum.impress.co.jp/article/5824
- 資源エネルギー庁, 支援重点化 (28 Jul 2026, could not be opened here): https://www.meti.go.jp/shingikai/enecho/denryoku_gas/saiene_shuryoku/pdf/003_02_00.pdf
- cycle-tank, 支援重点化 (Oct 2026) *(secondary)*: https://www.cycle-tank.com/post/20261012%E4%BA%8B%E6%A5%AD%E7%94%A8%E5%A4%AA%E9%99%BD%E5%85%89%E3%81%AEfit-fip%E6%94%AF%E6%8F%B4%E9%87%8D%E7%82%B9%E5%8C%96%E3%81%A8%E3%81%AF

**Please check:** this is the entry most likely to change. The 2027 decision and the "support focus" proposal are mostly from secondary sources. The game's capacity line of 30 is a game simplification (in reality: FIP-only from 250 kW in FY2024). "Corporate PPAs" as the way unsupported parks sell their power is from my general knowledge, not from the sources above. The game's market price factor (0.5 to 1.1, average 0.8) is a game value, not a forecast.

---

## 8. Grid connection and curtailment — 系統接続と出力制御 `grid`

**Unlocks when:** your game has its first grid connection delay or curtailment event.

**In the game**
- EN: Grid connection delays add turns to projects in permitting or construction. Curtailment cuts revenue for one turn.
- JA: 系統接続の遅れは、許認可中・建設中のプロジェクトのターンを延ばします。出力制御は、1ターンの収入を減らします。

**In reality**
- EN: When more power is produced than used, and it cannot be stored or sent to other regions, grid operators reduce the output of solar and wind in a fixed order of priority (出力制御); this began in Kyushu in 2018 and now happens in many regions. Where the grid is full, new projects can often connect only on a "non-firm" basis, accepting more curtailment.
- JA: 電気の供給が需要を上回り、ためたり他の地域へ送ったりできないとき、送配電事業者は決められた優先順位に従って太陽光や風力の出力を抑えます（出力制御）。2018年に九州で始まり、今では多くの地域で行われています。送電網に空きがない場所では、出力制御を多く受けることを条件に接続する「ノンファーム型接続」が使われています。

**Sources**
- 経済産業省, 系統WG 資料（優先給電ルール）: https://www.meti.go.jp/shingikai/enecho/shoene_shinene/shin_energy/keito_wg/pdf/017_02_00.pdf
- 経済産業省, 系統WG 資料（ノンファーム型接続）: https://www.meti.go.jp/shingikai/enecho/shoene_shinene/shin_energy/keito_wg/pdf/046_04_00.pdf

**Please check:** "began in Kyushu in 2018" is from my own knowledge (not confirmed in the sources found); the priority order is being revised for FIP plants (2024 discussion).

---

## 9. Decommissioning reserve — 廃棄等費用積立制度 `decommission`

**Unlocks when:** your first park starts operating.

**In the game**
- EN: 5% of each park's revenue is set aside for dismantling it at the end of its life.
- JA: 各発電所の収入の5%が、運転終了後の撤去のために積み立てられます。

**In reality**
- EN: Since July 2022, solar projects of 10 kW and above under FIT/FIP must save for dismantling and disposal: in principle, the money is deducted from their payments during the last 10 years of the support period and held by an external body. The operator remains responsible for proper disposal.
- JA: 2022年7月から、10kW以上のFIT/FIP太陽光発電は、撤去・廃棄の費用を積み立てることが義務になりました。原則として、調達期間の終わりの10年間に売電収入から差し引かれ、外部の機関に積み立てられます。最終的な廃棄の責任は事業者にあります。

**Sources**
- 東京電力パワーグリッド, お知らせ: https://www.tepco.co.jp/pg/consignment/fit/notice/20211119.html
- 九州電力, 資料: https://customer.kyuden.co.jp/download/pdf/other/fit_saienetokuso_202203.pdf
- 経済産業省, 廃棄等費用WG 資料: https://www.meti.go.jp/shingikai/enecho/shoene_shinene/shin_energy/taiyoko_haikihiyo_wg/pdf/005_00_02.pdf

**Please check:** nothing major. (The game's 5% is a simplification; in reality the amount is a fixed rate per kWh.)

---

## 10. Citizen funds — 市民出資 `fund` *(suggested addition)*

**Unlocks when:** you set up a citizen fund.

**In the game**
- EN: A citizen fund wins support from everyone: local people pay 20% of the cost and receive 20% of the revenue.
- JA: 市民ファンドは全員の支持を高めます：地元の人が費用の20%を出資し、収入の20%を受け取ります。

**In reality**
- EN: Many community energy projects in Japan are financed by residents, often through investment schemes such as silent partnerships (匿名組合); in Ikoma (Nara), for example, a citizens' solar plant was financed entirely by local people. Local ownership keeps money in the region and can make projects easier to accept.
- JA: 日本の地域エネルギー事業の多くは、住民の出資で資金を集めています。匿名組合などの仕組みが使われ、たとえば奈良県生駒市では、市民共同発電所を全額市民の出資でつくりました。地域に利益が残り、事業が受け入れられやすくなることがあります。

**Sources**
- 環境省, グッドライフアワード 報告（生駒市）: https://www.env.go.jp/policy/kihon_keikaku/goodlifeaward/report/201703_02/
- 西城戸誠, 市民出資型の再生可能エネルギー事業（法政大学）: https://hosei.ecats-library.jp/da/repository/00010424/14_nkr_15-1_nishikido.pdf

**Please check:** whether you prefer a different or better-known example (for example from your own network); whether to mention that soliciting investors is regulated (金融商品取引法).

---

## 11. Nature-coexistence sites — 自然共生サイト `natureSite` *(suggested addition)*

**Unlocks when:** one of your parks reaches biodiversity 60.

**In the game**
- EN: Your park has reached a high level of biodiversity. (The game has no certification step.)
- JA: あなたの発電所の生物多様性が高い水準に達しました。（ゲームには認定の手続はありません。）

**In reality**
- EN: Since 2023, Japan certifies places where nature is conserved through private or local efforts as 自然共生サイト; since April 2025 this is based on a law (地域生物多様性増進法) that also covers restoring nature on neglected land. Certified places contribute to the goal of conserving 30% of land and sea by 2030 (30by30).
- JA: 2023年から、民間や地域の取組で自然が守られている場所が「自然共生サイト」として認定されています。2025年4月からは地域生物多様性増進法に基づく制度となり、管理されなくなった土地で自然を回復・創出する活動も対象になりました。認定された場所は、2030年までに陸と海の30%を保全する目標（30by30）に貢献します。

**Sources**
- 環境省, 資料: https://www.env.go.jp/content/000384044.pdf
- 農林水産省, プレスリリース（認定, Oct 2026）: https://www.maff.go.jp/j/press/kanbo/b_kankyo/261030.html

**Please check:** whether any solar park has been certified (that would make a strong example); whether the "In the game" text should hint that a real certification could be possible.
