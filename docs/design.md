# Solar Commons (working title)

**Game Design Document v1.0** | Christian Doedt | Draft for discussion

*Changes in v1.0: a neighbouring town. From turn 9 (April 2028), a neighbouring town also offers sites; its trust in the player starts at the home town's trust. Each town has its own trust, warnings and 条例, and each regional warning also costs 5 trust in the other town ("word travels"). The reputation thresholds of earlier versions (new towns at R ≥ 50, 70, 90) are dropped: they were hardly ever reached within 20 turns (sections 1, 2, 3, 5, 7, 8, 9, 10, 11 and 12).*

*Changes in v0.9: the yearly farming report for agrivoltaics. At the end of each fiscal year, agrivoltaics parks report their harvest; a park whose crops get too little light gets guidance, can thin out its panels, and is removed after two poor reports in a row (sections 4, 6, 7 and 10). The balance of the three strategies is unchanged (section 11).*

*Changes in v0.8: the end of FIT/FIP support for new ground-mounted solar from fiscal year 2027. The scenario now runs from April 2026 (fiscal year 2026) to March 2031. Projects submitted from turn 5 (fiscal year 2027) sell at market prices, except projects with the promotion zone bonus, which keep FIT/FIP (sections 2, 4, 6 and 8). The balance is unchanged (section 11).*

*Changes in v0.7: scenario codes. Everyone who plays the same code gets the same sites and events (section 2). All rules and numbers are unchanged, and so is the balance (checked with 1,000 simulated games per strategy).*

*Changes in v0.6: placement on the 10 × 10 map matters. Only hedges on the edge of the site shelter and screen the park, and corridors count only when connected (section 5). All numbers are unchanged from v0.4.*

*Changes in v0.5: before submission, a design can be changed and a project can be dropped without penalty (section 5).*

## 1. Concept

The player is a solar PV developer in a rural Japanese municipality, and from 2028 also in the neighbouring town. The goal is to build solar parks that generate energy, support biodiversity, and earn local acceptance. Careless projects can be profitable in the short term, but they trigger objections, stricter local rules, and lasting distrust. Careful projects are approved faster and open doors to further projects.

- **Audience:** workshop participants, students, stakeholders, general public
- **Platform:** browser-based PWA (desktop and mobile), Japanese and English
- **Session length:** 20 to 30 minutes per scenario

## 2. Core loop

One turn = one quarter. A scenario lasts 20 turns (5 years): fiscal years 2026 to 2030, starting in April 2026 (turn 1 = April to June 2026, turn 5 = April to June 2027).

**Scenario codes:** every game has a scenario code, a number from 1000 to 9999. Everyone who plays the same code is offered the same sites and gets the same events in the same turns, whatever they decide, so groups in a workshop can compare their games. To make this possible, random numbers are drawn separately for the sites, for the events, and for each game's own luck (objections and varying prices under FIP and market sales). Which project a grid delay hits depends on the player's projects. When a 条例 bans forest sites, a forest offer is replaced by another site type, and the other offers stay the same. The neighbouring town's sites have their own random numbers, so the home town's sites are the same as before v1.0.

**The neighbouring town (added in v1.0):** from turn 9 (April 2028), a neighbouring town joins the game. Each turn it offers 2 sites, in addition to the 3 in the home town.

- **Word travels:** its trust in the player starts at the home town's trust at that moment (for example about 58 after careful play, about 44 after fast-and-cheap play).
- **Separate towns:** each town has its own trust, regional warnings (strikes) and 条例 (section 7). A project belongs to the town where its site is: its residents start from that town's trust, and its consequences fall on that town.
- **Closed to the player:** if the neighbouring town's trust falls below 5, it offers no more sites. Projects already there continue.
- National rules (end of FIT/FIP, the yearly farming report, promotion zones) apply in both towns.

1. **Scout:** choose a site from 3 random options (5 from turn 9: 3 in the home town, 2 in the neighbouring town)
2. **Design:** place panels and nature measures on a 10 × 10 tile map
3. **Engage:** spend action points on community activities
4. **Permit:** pass through real permit steps, with objection risk each turn
5. **Build:** construction takes 2 turns
6. **Operate:** revenue flows, biodiversity develops
7. **Expand or sell:** keep operating, sell the project, or start the next one

## 3. Resources

| Resource | Range | Start | Notes |
|---|---|---|---|
| Money (M) | 0+ | 100 | Abstract credits |
| Action points (AP) | per turn | 3 | Engagement and planning |
| Trust (T) | 0 to 100 | 50 | Per town, long-term memory. The neighbouring town (from turn 9) starts at the home town's trust |
| Acceptance (A) | 0 to 100 | = T | Per project |
| Biodiversity (B) | 0 to 100 | 0 | Per park, grows during operation |
| Reputation (R) | 0 to 100 | 30 | Global; shown to the player, little effect on play (section 8) |

## 4. Site types

| Site | Base permit time | Site risk | Required permits |
|---|---|---|---|
| Abandoned farmland (耕作放棄地) | 3 (+1 農地転用) | 1.0 | 農地転用 |
| Agrivoltaics (営農型) | 4 | 0.8 | 一時転用, farmer partner (farmer S +20), yearly farming report (section 6) |
| Forested slope | 5 (+2 林地開発許可) | 1.6 | B starts at −30, elderly and nature group S −20 |
| Brownfield | 2 | 0.6 | None extra |
| Reservoir (floating) | 4 | 0.9 | Water/fishery consent |

Each site has a 20% chance of lying in a promotion zone (促進区域). If, at submission, the project has a biodiversity target ≥ 40 and a citizen fund or benefit agreement, it gets the promotion zone bonus: −1 permit turn, A +10, and site risk ×0.7. From fiscal year 2027, the bonus also keeps FIT/FIP support (section 6).

## 5. Design and community

**Tiles**

| Tile | Cost | Capacity | B points |
|---|---|---|---|
| Dense panel | 3 | 1.0 | 0 |
| Wide-spaced panel | 3 | 0.7 | 1 |
| Meadow | 1 | 0 | 2 |
| Native hedge | 1 | 0 | 3 |
| Pond / biotope | 2 | 0 | 4 |
| Wildlife corridor | 1 | 0 | 2 |

**Management** (one choice per park): none, extensive mowing (B +5, cost 0.5 per turn), or grazing (B +8, cost 1 per turn). Mowing and grazing include no herbicides.

**Placement:** tiles are painted on the 10 × 10 map of the site. Two placement rules apply (tiles touch side by side, not diagonally):

- **Hedges on the edge:** only hedges on the outer ring of the site shelter the park and screen it from view. They count for typhoon protection, the elderly resident's wish and the safety score. Hedges inside the site still give biodiversity points.
- **Connected corridors:** a group of corridor tiles counts only if it touches both the edge of the site and a meadow, hedge or pond. Corridor tiles that are not connected still cost money, but give no biodiversity points and do not count as a measure type.

**Changing plans:** until a project is submitted, its design can be changed at any time, for example after talking with residents. A project that has not been submitted can also be dropped without penalty: the site and any action points already spent are lost, and a benefit agreement ends.

**Residents:** farmer, elderly resident, young family, nature group, 自治会 leader, each with support S from −100 to +100. Starting S = (T − 50) × 2, using the trust of the project's town, so a new project starts with A = T.

**Engagement actions**

- 説明会, formal (0 AP): fulfils the legal requirement, no S gain
- 説明会, genuine dialogue (1 AP): +10 S for all, −1 permit turn if held before submission
- Individual visit (1 AP): +20 S for the least supportive resident
- Site tour with nature expert (1 AP): +15 S for nature group and elderly
- Citizen fund (2 AP, once): +15 S for all; locals finance 20% of costs and receive 20% of revenue
- Benefit agreement (1 AP, once): +10 S for all, costs 1 per turn
- Silence during permitting (no action on that project in a turn): all S −3

**Design matching** (permanent +15 S for that resident)

| Resident | Condition |
|---|---|
| Farmer | Agrivoltaics site, or farmland with at least as many wide as dense panels |
| Elderly resident | No cheap build, at least 3 hedges on the edge, not a forest site |
| Young family | Citizen fund or benefit agreement |
| Nature group | Biodiversity target ≥ 40 |
| 自治会 leader | Genuine 説明会 before submission |

## 6. Policy layer

Each real policy appears as a permit card or rule with a short bilingual explanation (1 to 2 sentences) and an entry in an in-game "Policy notebook." Mechanics stay simple; the realism lives in the explanations. In a game, notebook entries are discovered when the related situation first occurs; from the title screen, all entries can be read. Texts and sources: docs/policy-notebook.md.

| Policy | Game mechanic |
|---|---|
| Resident briefing before FIT/FIP certification (再エネ特措法) | 説明会 is mandatory; player chooses formal or genuine |
| 農地転用 (farmland conversion) | +1 permit turn |
| 営農型 一時転用 and the yearly farming report | See "Yearly farming report" below |
| 林地開発許可 | +2 permit turns; drainage required (cost +20%) |
| Local solar ordinance (条例) | Triggered by bad projects (see 7) |
| Promotion zones (地域脱炭素化促進事業) | See section 4 |
| FIT vs FIP | Parks below 30 capacity: fixed revenue (FIT). From 30: revenue × random 0.8 to 1.2 per turn (FIP) |
| End of FIT/FIP for new ground-mounted solar (from fiscal year 2027) | Projects submitted from turn 5 sell at market prices: revenue × random 0.5 to 1.1 per turn (average 0.8). Exception: projects with the promotion zone bonus keep FIT/FIP. All five site types count as ground-mounted. The scheme is fixed at submission. |
| Grid connection and curtailment (出力制御) | Events (see 9) |
| Decommissioning reserve (廃棄等費用積立) | 5% of gross revenue |

**Yearly farming report (営農型, added in v0.9):** at the end of each fiscal year (after turns 4, 8, 12, 16 and 20), every operating agrivoltaics park reports its harvest. Parks that start operating in that same turn report from the next fiscal year.

- **Enough light:** the harvest is good if the park has at least as many wide-spaced as dense panels (in reality: panels should shade the field by less than 30%). The design panel shows this while planning.
- **First poor report:** guidance from the 農業委員会, no penalty.
- **Thinning out:** after guidance, the player can thin out the panels: just enough dense panels become wide-spaced ones, ⌈(dense − wide) / 2⌉ tiles, spread over the map. Cost 1 per tile; capacity −0.3 per tile. The next report is then good, which ends the guidance.
- **Second poor report in a row:** the permit is revoked and the park is removed: removal cost 10% of the build cost, T −8, one strike. A removed park earns nothing more and no longer counts towards built capacity, but is still scored (section 10).
- Sold parks no longer report (the new owner is responsible).

**Verification needed:** thresholds and details (e.g. which project sizes require FIP, forest permit area thresholds, the briefing requirement, current 営農型 rules after the 2026 revision) have changed in recent years. Check these against current regulations before finalising texts.

**Agrivoltaics (status November 2026):** today, the harvest must be reported every year, and yields must not fall more than about 20% below the local average; poor results bring guidance, and serious cases left uncorrected can lead to refusal of re-permission, suspended FIT payments and a removal order. A new framework, approved by a MAFF expert panel on 15 April 2026, moves the legal basis to the 農山漁村再エネ法 and sets shading below 30% in principle, with rice, wheat and soybeans as recommended crops; yields well below the requirement for two years or more are named as a case for strict guidance. The new framework starts in April 2027 (turn 5 in the game; date from the project owner, 10 November 2026). No rule change is needed: the first farming report that can find a poor harvest comes at the end of fiscal year 2027 at the earliest, because an agrivoltaics park needs about 7 turns from planning to running.

**End of FIT/FIP (status November 2026):** decided in March 2026 for new ground-mounted business solar of 10 kW and more from fiscal year 2027 (already certified projects and FY2026 auction winners keep their support; roof-mounted solar keeps it). Exceptions for national and municipal land, certified projects in promotion zones, carports and infrastructure spaces were proposed in September 2026, with a decision expected around January 2027; agrivoltaics are still under review. The game models only the promotion zone exception, because only promotion zones exist in the game. Submission in the game stands for the certification application. If the final decision differs (for example for agrivoltaics), revisit this rule.

## 7. Fast-and-cheap strategy

This strategy is deliberately attractive in the short term.

**Options available**

- Cheap build: cost −30%, no drainage (except forest, where it is legally required). Damage ×2, landslide events possible on slopes
- Dense layout: maximum capacity and revenue
- Formal-only engagement: saves AP
- Sell project (転売): after operation starts, sell for 1.5 × build cost. Immediate cash, but the new owner neglects the park (T −5 two turns later, B stops growing)

**Delayed consequences**

- A regional strike is added for each cancelled project, each cheap build damaged by an event, a park starting operation with A below 30, a forest park with negative biodiversity target, each agrivoltaics park removed after poor harvests, and each rival developer's bad project
- At 2 strikes, or if T falls below 30, the town enacts a 条例: permit time +2, 自治会 consent required at the end of permitting (A ≥ 60, otherwise counts as an objection and delays one turn), forest sites banned
- The 条例 applies to all future projects in that town, including good ones
- Strikes and 条例 are counted per town (v1.0): a strike falls on the town of the project that caused it; the rival developer's bad project falls on the home town
- **Word travels (v1.0):** once the neighbouring town has joined, each strike in one town also costs 5 trust in the other town. Without this rule, a careless developer could simply move on: in the simulator, fast-and-cheap players then lost only 22% of games instead of about 60%

## 8. Formulas

- **Acceptance:** A = 50 + (average effective S) / 2
- **Planning cost:** 10% of the player's build cost, paid at submission and lost on cancellation
- **Permit duration:** D = base + policy turns + 条例 turns + max(0, ⌈(60 − A) / 15⌉) − early genuine 説明会 bonus − promotion zone bonus (minimum 1)
- **Objection probability per permitting turn:** P_obj = 0.25 × ((100 − A) / 100) × site risk
- **Objection effect:** delay +1 turn, all S −5. Three objections, or A below 20, cancels the project (T −8, one strike)
- **Biodiversity target:** B_target = min(100, tile and management points + 5 × (distinct measure types − 1)) + site modifier. Wide panels, each nature tile type, and management each count as one measure type. Corridor tiles count only when connected (section 5). During operation, B grows by 20% of the remaining gap per turn
- **Revenue per turn:** capacity × 0.6 × policy factor × price factor × curtailment − management cost − citizen fund share − decommissioning reserve. Price factor: FIT 1; FIP random 0.8 to 1.2; market prices random 0.5 to 1.1 (section 6)
- **Trust update at start of operation:** ΔT = (A − 50) / 5 + B_target / 20 (uses the planned target, since actual B is still near zero at that point)
- **Trust update at start of operation** and all other trust changes apply to the town of the project concerned
- **Reputation:** +T / 10 (trust of the park's town) when a park starts operating; +10 for a rare species sighting. Reputation no longer unlocks towns (v1.0)

## 9. Events (25% chance per turn, one of eight)

Events affect parks and projects in both towns, except the rival developer's bad project.

| Event | Effect |
|---|---|
| Typhoon | Parks with fewer than 3 hedges on the edge lose 5 (×2 if cheap build, plus a strike) |
| Heavy rain | Forest parks lose 15 (cheap build: T −5 and a strike); non-forest cheap builds lose 10 and get a strike |
| Grid connection delay | One project in permitting or construction +1 to 3 turns |
| Curtailment | Revenue ×0.7 this turn |
| Policy change | Revenue ×0.8 or ×1.2 for the rest of the game |
| Rival developer's bad project | Home town: T −5, one strike |
| Local media story | Projects in design or permitting: S +10 if A ≥ 50, otherwise −10 |
| Rare species sighting | If any park has B ≥ 60: R +10 |

## 10. Scoring

At the end of the scenario, each built park (operating, sold or removed) is rated in seven categories with ○ (2), △ (1), or × (0).

| Category | ○ | △ | × |
|---|---|---|---|
| Site selection | Brownfield, farmland, agrivoltaics, or active promotion zone | Reservoir | Forest |
| Nature, actions | 3+ measure types and mowing or grazing | 1+ measure type | None |
| Nature, results | B ≥ 60 at end | B ≥ 30 | Below 30 |
| Safety and landscape | No cheap build, 3+ hedges on the edge | No cheap build | Cheap build |
| Community process | Genuine 説明会 before submission, no objections | Any genuine 説明会 or max. 1 objection | Otherwise |
| Local benefit | Citizen fund or benefit agreement | | None |
| Long-term responsibility | Kept, never damaged | Kept, damaged | Sold or removed |

**Final grade:** average park score (0 to 14): S from 13, A from 10, B from 7, C from 4, D below 4.

Grade D is given regardless of score if built capacity (including sold parks, but not removed parks) is below 15, or if the game is lost.

**Lose conditions:** money below 0 for 2 consecutive turns, or trust below 5 in the home town. (In the neighbouring town, trust below 5 only closes it to new projects.)

## 11. Balance status (simulator, 1,000 games per strategy, v1.0)

| | Careful | Balanced | Fast and cheap |
|---|---|---|---|
| Final cash | ~53 | ~71 | ~113 |
| Net worth (cash + own share of operating parks) | ~183 | ~201 | ~118 |
| 条例 enacted (home town) | ~13% | ~13% | ~99% |
| 条例 enacted (neighbouring town) | 0% | 0% | ~83% |
| Neighbouring town's trust: at turn 9 → at the end | ~58 → ~57 | ~54 → ~52 | ~44 → ~18 |
| Games lost | 0% | 0% | ~54% |
| Average park score (0 to 14) | 13.6 | 11.1 | 1.9 |
| Typical grade | S | A | D |
| Parks selling at market prices (v0.9) | ~13% | ~5% | ~4% |

All eight intended-outcome checks pass. Careful costs some money but gives the best results for nature and community; balanced earns slightly more with a weaker score; fast-and-cheap holds the most cash at high risk and with lasting regional damage.

**Effect of the end of FIT/FIP (v0.8):** the numbers above are almost the same as in v0.7, because most parks that sell at market prices are submitted later and start operating near the end of the scenario. The rule works mainly through decisions and what players see: submit in the first year to secure FIT/FIP, or take more time for dialogue; promotion zones become more valuable; later parks earn less and less predictably. The simulator's computer players do not react to the deadline.

**Ideas for the prototype stage (realism, values to be checked against real cases):** citizen fund uptake depends on acceptance, a one-turn subscription period, and an investor return slightly above the financing share.

**Effect of the yearly farming report (v0.9):** none of the three strategies is affected: careful and balanced players use at least as many wide-spaced as dense panels on agrivoltaics sites, and fast-and-cheap players never build there. A test player who fills agrivoltaics sites with dense panels gets guidance for almost all of these parks. If it ignores the guidance, about half of these parks are removed (in about 60% of its games): its average park score falls from 8.3 to 7.4, built capacity from ~45 to ~28, and grade D rises from 2% to 17% of games. If it thins out after guidance, no park is removed, thinning keeps about 85% of a park's capacity, and its average park score rises to 8.7, but it ends with less money (~87 instead of ~111).

**Effect of the neighbouring town (v1.0):** careful and balanced players hardly use it (about 0.07 and 0.02 parks per game there): their two parallel projects usually find good sites at home. Fast-and-cheap players move their later projects there once the home town has a 条例. Without "word travels", this let them escape the consequences (games lost fell from about 60% to 22%); with it (5 trust per strike), the risk is about as before (54%), and the damage visibly spreads: the neighbouring town passes a 条例 in about 83% of their games. Fast-and-cheap now reaches grade C in under 1% of games (otherwise D).

**Simplifications in the simulator:** its computer players do not draw maps, so it assumes good placement (all hedges on the edge, all corridors connected). They never need to thin out panels. They prefer sites in a town without a 条例, and fast-and-cheap players stop building in a town whose trust is below 25.

## 12. MVP scope

Two towns (the home town, and the neighbouring town from turn 9), three sites per turn from five types (plus two in the neighbouring town), five residents, six tile types, eight events, the 説明会 rule, 農地転用, 林地開発許可, and the 条例 trigger. Simple coloured tiles, no illustrations.
