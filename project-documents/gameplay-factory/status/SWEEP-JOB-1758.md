# SWEEP-JOB-1758 · Main menu, second half

Source: `JOB-1758.md` on `factory/gameplay-v1`. Checked today's `gameplay/bug-list-1`; the audit records **no confirmed player-facing gameplay findings**. Its three entries are risk checks, not reported bugs.

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| Main-menu media selector could bind repeatedly (risk check; no observed player bug) | `js/menuExperience.js:380–419` -> `js/menuExperience.js:380–419` | NOT A BUG | `if(document.getElementById("menuMediaSelector")){ return; }` (381); `selector.addEventListener("click", event => {` (407). One selector is installed. |
| Play/mute button bindings could duplicate (risk check; no observed player bug) | `js/menuExperience.js:596–608` -> `js/menuExperience.js:595–607` | NOT A BUG | `if(mediaToggle && mediaToggle.dataset.musicBound !== "true"){` (599); `mediaToggle.dataset.musicBound = "true";` (600); matching mute guard at 603–605. |
| Main-menu initialization could miss controls (risk check; no observed player bug) | `js/menuExperience.js:653–674` -> `js/menuExperience.js:652–673` | NOT A BUG | `bindMenuMediaControls();` (660); `bindMenuFeedbackInteraction();` (661); `if(!integrity.selectorReady || !integrity.mediaChoicesReady || !integrity.toggleBound || !integrity.muteBound || !integrity.feedbackBound){` (665). |

No confirmed defect was present in the source audit; other referenced paths are background checks, not additional findings. No visuals identified.

Still open: 0
