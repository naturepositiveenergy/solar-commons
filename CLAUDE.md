# Solar Commons

Browser game (PWA) about community-involved, biodiversity-friendly solar parks in Japan.
Audience: workshop participants, students, stakeholders, general public. Languages: Japanese and English.

- Design document: docs/design.md (current rules, v1.1)
- Game rules engine: js/engine.js (reference implementation of the rules, shared by the game and the simulator)
- Balancing simulator: prototype/simulator.html
- Game texts: lang/en.js and lang/ja.js
- Automatic checks: node tests/check.js (run after changing the engine, the session, the texts or the file list)
- Offline helper: sw.js lists every file the game loads; raise the ?v= version in index.html and the simulator with every update
- Fonts and icon: node tools/make-fonts.js after adding text with new kanji (the checks report it); node tools/make-icons.js after changing the icon
- Workshop guide: docs/workshop-guide.md and docs/workshop-guide.ja.md (its recommended scenario codes are checked by tests/check.js; update the guide if a rule change alters them)

## Rules

- I have limited programming experience. Explain changes in plain language.
- Outline a plan and wait for my approval before multi-step changes. After each major step, summarise what you did and what is next.
- Show what will change and ask before deleting, overwriting or renaming files.
- Never modify files outside this project folder.
- Keep all game text in separate language files (ja and en), never hard-coded in the code.
- Plain HTML, CSS and JavaScript. No paid services or accounts.
- Keep game rules consistent with docs/design.md. If a change to the rules is needed, propose it and update the document after I approve.
- When I paste an error message, first explain the cause, then propose a fix.
- At the end of a task, list all files you created or modified.
