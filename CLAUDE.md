# Solar Commons

Browser game (PWA) about community-involved, biodiversity-friendly solar parks in Japan.
Audience: workshop participants, students, stakeholders, general public. Languages: Japanese and English.

- Design document: docs/design.md (current rules, v0.6)
- Game rules engine: js/engine.js (reference implementation of the rules, shared by the game and the simulator)
- Balancing simulator: prototype/simulator.html
- Game texts: lang/en.js and lang/ja.js
- Automatic checks: node tests/check.js (run after changing the engine, the session or the texts)

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
