// English texts for Solar Commons.
//
// Each line is   "code": "text",
// Change the text on the right. Never change the code on the left.
// Words in {curly brackets} are filled in by the game: keep them as they are.
// {name:1} shows a number with 1 decimal place, {name:+1} also adds a + sign.
// Every code here must also exist in lang/ja.js.

SC_LANG.en = {
  // ----- Language switch -----
  "lang.name": "English",                 // name of this language, written in this language
  "lang.switchLabel": "Language",

  // ----- Start screen -----
  "app.pageTitle": "Solar Commons",       // shown in the browser tab
  "app.title": "Solar Commons",
  "start.subtitle": "Build solar parks together with nature and the local community.",
  "start.newGame": "New game",

  // ----- Game screen (placeholder until Milestone 2) -----
  "game.placeholderTitle": "New game",
  "game.placeholderNote": "The game screens are still being built. The numbers above come from the game rules, which shows they are connected.",
  "game.backToTitle": "Back to title",

  // ----- Resources -----
  "stat.turn": "Turn",
  "stat.turnValue": "{turn} / {turns}",
  "stat.money": "Money",
  "stat.trust": "Trust",

  // ----- Site types -----
  "site.farmland": "Abandoned farmland (耕作放棄地)",
  "site.agri": "Agrivoltaics (営農型)",
  "site.forest": "Forested slope",
  "site.brownfield": "Brownfield",
  "site.reservoir": "Reservoir (floating)",

  // ----- Residents -----
  "resident.farmer": "Farmer",
  "resident.elderly": "Elderly resident",
  "resident.family": "Young family",
  "resident.nature": "Nature group",
  "resident.jichikai": "自治会 leader",

  // ----- Engagement actions -----
  "action.genuine": "Genuine 説明会",
  "action.visit": "Individual visit",
  "action.tour": "Site tour with nature expert",
  "action.fund": "Citizen fund",
  "action.benefit": "Benefit agreement",

  // ----- Messages when an action is not possible -----
  "err.noSite": "No such site.",
  "err.tooManyTiles": "Design uses {tiles} tiles, the site has {max}.",
  "err.noPanels": "Add at least one panel tile.",
  "err.engageStatus": "Engagement is possible during design and permitting.",
  "err.needAP": "Needs {need} AP, {left} left.",
  "err.fundDone": "Citizen fund already set up.",
  "err.benefitDone": "Benefit agreement already signed.",
  "err.submitStatus": "Only projects in design can be submitted.",
  "err.planningCost": "Planning cost {cost:1} exceeds money.",
  "err.sellStatus": "Only operating parks can be sold.",

  // ----- Game log -----
  "log.projectStarted": "Project {id} started: {site}. Capacity {cap:1}, cost {cost:1}.",
  "log.projectStartedPromo": "Project {id} started: {site}, in promotion zone. Capacity {cap:1}, cost {cost:1}.",
  "log.submitted": "Project {id} submitted (formal 説明会 held). Permitting {turns} turns, A {A:0}.",
  "log.submittedGenuine": "Project {id} submitted (formal 説明会 held, genuine dialogue before). Permitting {turns} turns, A {A:0}.",
  "log.sold": "Project {id} sold for {price:1}.",
  "log.strike": "Regional strike ({reason}). Strikes: {strikes}.",
  "log.ordinance": "The municipality enacts a solar ordinance (条例): longer permits, 自治会 consent required, forest sites banned.",
  "log.cancelled": "Project {id} cancelled ({reason}). Trust −{trust}.",
  "log.typhoon": "Event: typhoon. {hit} park(s) damaged.",
  "log.heavyRain": "Event: heavy rain. {hit} park(s) damaged.",
  "log.gridDelay": "Event: grid connection delay, project {id} +{turns} turns.",
  "log.gridDelayNone": "Event: grid connection delays in the region (no effect).",
  "log.curtailment": "Event: curtailment (出力制御) this turn.",
  "log.policyChange": "Event: policy change, revenue ×{factor}.",
  "log.rival": "Event: rival developer's bad project. Trust −{trust}.",
  "log.media": "Event: local media story amplifies current opinion.",
  "log.rareFound": "Event: rare species sighted in your park. Reputation +{rep}.",
  "log.rareNone": "Event: rare species search, nothing found.",
  "log.objection": "Objection against project {id} ({count}). Delay +{delay}.",
  "log.consentRefused": "自治会 consent refused for project {id} (A {A:0}).",
  "log.approved": "Project {id} approved.",
  "log.constructionStarted": "Construction of project {id} started (paid {paid:1}).",
  "log.waitingFunds": "Project {id} waits for funds ({need:1} needed).",
  "log.operating": "Project {id} operating. A {A:0}, trust {dT:+1}.",
  "log.neglected": "New owner neglects former project {id}. Trust −{trust}.",
  "log.lostMoney": "Game lost: money below 0 for 2 turns.",
  "log.lostTrust": "Game lost: trust collapsed.",

  // ----- Reasons for a regional strike (inserted into log.strike) -----
  "strike.cancelled": "cancelled project",
  "strike.cheapDamaged": "cheap build damaged, project {id}",
  "strike.landslide": "landslide at project {id}",
  "strike.runoff": "runoff damage at cheap build {id}",
  "strike.rival": "rival project",
  "strike.lowAcceptance": "low acceptance at project {id}",
  "strike.forestNegativeB": "forest park {id} with negative biodiversity",

  // ----- Reasons for a cancellation (inserted into log.cancelled) -----
  "cancel.objections": "too many objections",
  "cancel.acceptance": "acceptance {A:0}",
  "cancel.consent": "consent refused",

  // ----- Notes on the final grade -----
  "score.lost": "Game lost.",
  "score.noPark": "No park built.",
  "score.capMissed": "Capacity target missed."
};
