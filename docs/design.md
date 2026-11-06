# Solar Commons (working title)

**Game Design Document v0.7** | Christian Doedt | Draft for discussion

*Changes in v0.7: scenario codes. Everyone who plays the same code gets the same sites and events (section 2). All rules and numbers are unchanged, and so is the balance (checked with 1,000 simulated games per strategy).*

*Changes in v0.6: placement on the 10 × 10 map matters. Only hedges on the edge of the site shelter and screen the park, and corridors count only when connected (section 5). All numbers are unchanged from v0.4.*

*Changes in v0.5: before submission, a design can be changed and a project can be dropped without penalty (section 5).*

## 1. Concept

The player is a solar PV developer in a rural Japanese municipality. The goal is to build solar parks that generate energy, support biodiversity, and earn local acceptance. Careless projects can be profitable in the short term, but they trigger objections, stricter local rules, and lasting distrust. Careful projects are approved faster and open doors to further projects.

- **Audience:** workshop participants, students, stakeholders, general public
- **Platform:** browser-based PWA (desktop and mobile), Japanese and English
- **Session length:** 20 to 30 minutes per scenario

## 2. Core loop

One turn = one quarter. A scenario lasts 20 turns (5 years).

**Scenario codes:** every game has a scenario code, a number from 1000 to 9999. Everyone who plays the same code is offered the same sites and gets the same events in the same turns, whatever they decide, so groups in a workshop can compare their games. To make this possible, random numbers are drawn separately for the sites, for the events, and for each game's own luck (objections and FIP market prices). Which project a grid delay hits depends on the player's projects. When a 条例 bans forest sites, a forest offer is replaced by another site type, and the other offers stay the same.

1. **Scout:** choose a site from 3 random options
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
| Trust (T) | 0 to 100 | 50 | Per municipality, long-term memory |
| Acceptance (A) | 0 to 100 | = T | Per project |
| Biodiversity (B) | 0 to 100 | 0 | Per park, grows during operation |
| Reputation (R) | 0 to 100 | 30 | Global, unlocks municipalities |

## 4. Site types

| Site | Base permit time | Site risk | Required permits |
|---|---|---|---|
| Abandoned farmland (耕作放棄地) | 3 (+1 農地転用) | 1.0 | 農地転用 |
| Agrivoltaics (営農型) | 4 | 0.8 | 一時転用, farmer partner (farmer S +20) |
| Forested slope | 5 (+2 林地開発許可) | 1.6 | B starts at −30, elderly and nature group S −20 |
| Brownfield | 2 | 0.6 | None extra |
| Reservoir (floating) | 4 | 0.9 | Water/fishery consent |

Each site has a 20% chance of lying in a promotion zone (促進区域). If the project has a biodiversity target ≥ 40 and a citizen fund or benefit agreement, it gets −1 permit turn, A +10, and site risk ×0.7.

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

**Residents:** farmer, elderly resident, young family, nature group, 自治会 leader, each with support S from −100 to +100. Starting S = (T − 50) × 2, so a new project starts with A = T.

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
| 営農型 一時転用 | Periodic renewal check; if farming quality is neglected, permit is revoked (not yet in simulator) |
| 林地開発許可 | +2 permit turns; drainage required (cost +20%) |
| Local solar ordinance (条例) | Triggered by bad projects (see 7) |
| Promotion zones (地域脱炭素化促進事業) | See section 4 |
| FIT vs FIP | Parks below 30 capacity: fixed revenue. From 30: revenue × random 0.8 to 1.2 per turn |
| Grid connection and curtailment (出力制御) | Events (see 9) |
| Decommissioning reserve (廃棄等費用積立) | 5% of gross revenue |

**Verification needed:** thresholds and details (e.g. which project sizes require FIP, forest permit area thresholds, the briefing requirement, current 営農型 rules after the 2026 revision) have changed in recent years. Check these against current regulations before finalising texts.

## 7. Fast-and-cheap strategy

This strategy is deliberately attractive in the short term.

**Options available**

- Cheap build: cost −30%, no drainage (except forest, where it is legally required). Damage ×2, landslide events possible on slopes
- Dense layout: maximum capacity and revenue
- Formal-only engagement: saves AP
- Sell project (転売): after operation starts, sell for 1.5 × build cost. Immediate cash, but the new owner neglects the park (T −5 two turns later, B stops growing)

**Delayed consequences**

- A regional strike is added for each cancelled project, each cheap build damaged by an event, a park starting operation with A below 30, a forest park with negative biodiversity target, and each rival developer's bad project
- At 2 strikes, or if T falls below 30, the municipality enacts a 条例: permit time +2, 自治会 consent required at the end of permitting (A ≥ 60, otherwise counts as an objection and delays one turn), forest sites banned
- The 条例 applies to all future projects, including good ones

## 8. Formulas

- **Acceptance:** A = 50 + (average effective S) / 2
- **Planning cost:** 10% of the player's build cost, paid at submission and lost on cancellation
- **Permit duration:** D = base + policy turns + 条例 turns + max(0, ⌈(60 − A) / 15⌉) − early genuine 説明会 bonus − promotion zone bonus (minimum 1)
- **Objection probability per permitting turn:** P_obj = 0.25 × ((100 − A) / 100) × site risk
- **Objection effect:** delay +1 turn, all S −5. Three objections, or A below 20, cancels the project (T −8, one strike)
- **Biodiversity target:** B_target = min(100, tile and management points + 5 × (distinct measure types − 1)) + site modifier. Wide panels, each nature tile type, and management each count as one measure type. Corridor tiles count only when connected (section 5). During operation, B grows by 20% of the remaining gap per turn
- **Revenue per turn:** capacity × 0.6 × policy factor × FIP factor × curtailment − management cost − citizen fund share − decommissioning reserve
- **Trust update at start of operation:** ΔT = (A − 50) / 5 + B_target / 20 (uses the planned target, since actual B is still near zero at that point)
- **Reputation:** +T / 10 when a park starts operating; new municipalities unlock at R ≥ 50, 70, 90

## 9. Events (25% chance per turn, one of eight)

| Event | Effect |
|---|---|
| Typhoon | Parks with fewer than 3 hedges on the edge lose 5 (×2 if cheap build, plus a strike) |
| Heavy rain | Forest parks lose 15 (cheap build: T −5 and a strike); non-forest cheap builds lose 10 and get a strike |
| Grid connection delay | One project in permitting or construction +1 to 3 turns |
| Curtailment | Revenue ×0.7 this turn |
| Policy change | Revenue ×0.8 or ×1.2 for the rest of the game |
| Rival developer's bad project | T −5, one strike |
| Local media story | Projects in design or permitting: S +10 if A ≥ 50, otherwise −10 |
| Rare species sighting | If any park has B ≥ 60: R +10 |

## 10. Scoring

At the end of the scenario, each built park (operating or sold) is rated in seven categories with ○ (2), △ (1), or × (0).

| Category | ○ | △ | × |
|---|---|---|---|
| Site selection | Brownfield, farmland, agrivoltaics, or active promotion zone | Reservoir | Forest |
| Nature, actions | 3+ measure types and mowing or grazing | 1+ measure type | None |
| Nature, results | B ≥ 60 at end | B ≥ 30 | Below 30 |
| Safety and landscape | No cheap build, 3+ hedges on the edge | No cheap build | Cheap build |
| Community process | Genuine 説明会 before submission, no objections | Any genuine 説明会 or max. 1 objection | Otherwise |
| Local benefit | Citizen fund or benefit agreement | | None |
| Long-term responsibility | Kept, never damaged | Kept, damaged | Sold |

**Final grade:** average park score (0 to 14): S from 13, A from 10, B from 7, C from 4, D below 4.

Grade D is given regardless of score if built capacity (including sold parks) is below 15, or if the game is lost.

**Lose conditions:** money below 0 for 2 consecutive turns, or T below 5.

## 11. Balance status (simulator, 200 games per strategy)

| | Careful | Balanced | Fast and cheap |
|---|---|---|---|
| Final cash | ~54 | ~68 | ~122 |
| Net worth (cash + own share of operating parks) | ~187 | ~200 | ~126 |
| 条例 enacted | ~11% | ~10% | ~99% |
| Games lost | 0% | 0% | ~59% |
| Average park score (0 to 14) | 13.5 | 11.1 | 1.9 |
| Typical grade | S | A | D |

All eight intended-outcome checks pass. Careful costs some money but gives the best results for nature and community; balanced earns slightly more with a weaker score; fast-and-cheap holds the most cash at high risk and with lasting regional damage.

**Ideas for the prototype stage (realism, values to be checked against real cases):** citizen fund uptake depends on acceptance, a one-turn subscription period, and an investor return slightly above the financing share.

**Simplifications in the simulator:** its computer players do not draw maps, so it assumes good placement (all hedges on the edge, all corridors connected). The 営農型 renewal check is not yet modelled.

## 12. MVP scope

One municipality, three sites per turn from five types, five residents, six tile types, eight events, the 説明会 rule, 農地転用, 林地開発許可, and the 条例 trigger. Simple coloured tiles, no illustrations.
