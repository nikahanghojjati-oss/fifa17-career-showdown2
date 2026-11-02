# HO-056 · Team G → Team V · Chamber Men shootout scene, cylinder strip and multi-bullet roulette wording (r88)

```ticket
{
 "id": "HO-056",
 "from": "G",
 "to": "V",
 "title": "Chamber Men shootout scene, cylinder strip and multi-bullet roulette wording (r88)",
 "kind": "art",
 "priority": "normal",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-11-02T17:23:48Z", "by": "G", "status": "SENT", "note": ""}]
}
```

# Team V ticket: Chamber Men scene art (from Team G, r88)

**What:** Chamber Men is the new shootout screen that runs every season before Roster Russian Roulette, in Showdowns confirmed after the r88 release. Team G has shipped a plain marble stand-in (`css/chamberMen.css`, `js/chamberMenStep.js`, screen id `#cmStage`). We need Team V's real scene.

**Rule (Nik, 2026-11-02):** each manager gets 7 shots. Every goal a manager scores loads one live round into the opponent's roulette cylinder. Every miss means the opponent will fire an empty chamber there.

**How a round plays:** both managers pick a shot (Left, Middle or Right) and a dive (Left, Middle or Right), then lock in. Each manager has 10 seconds. When both have locked in, both phones replay the round: first Daniel shoots at Nik's keeper, then Nik shoots at Daniel's keeper. A goal is scored when the shot and the keeper's dive are on different sides. If the clock runs out, a missing shot counts as a miss (the ball goes over the bar) and a missing dive stays in the middle.

**Art needed:**
1. **Goal and keeper scene.** The stand-in is a flat SVG goal with a gold keeper and a white ball. We need a premium marble-and-gold goal mouth, a keeper figure with three dive poses (left, middle, right), a ball, and the net reacting to a goal. No dimming, no scrim, and it must not cover any face or button.
2. **Cylinder strip.** Each manager has 7 chambers. The stand-in uses small circles in three states: not played yet (dashed), live round (brass cartridge with a red rim), and empty (gold ring). We need a revolver-cylinder strip that matches the roulette page's cylinder.
3. **Roulette wording for several live rounds.** The roulette page (`visual-assets/v10_1/roulette/index.html`) now places one cartridge in every live chamber (`cyl.userData.placeRounds`) and shows the caption "Daniel N bullets · Nik M bullets · Seven chambers". Its existing lines such as "The live round passed" assume one bullet. Please review that wording so it reads correctly when a cylinder holds 0 to 7 live rounds.

**Hooks the scene must keep:** the stand-in exposes the round state in the DOM (`.cmRound`, `.cmGoals`, `.cmChamber.is-live` / `.is-empty`, `.cmChoice[data-kind][data-side]`, `.cmLock`, `.cmNext`, `.cmBack`). Team G's browser journeys tap those buttons, so either keep the buttons or tell Team G the new hooks.

**Screens to check:** desktop 1440x900 and phone 390x844. Every button must stay reachable, and the stage may scroll.

Team G owner: the r88 lead. Branch: `claude-gameplay/r88-chamber-men` (PR into `gameplay/r88`).

Nik's decision (2026-11-02 ~17:20 UTC): one pull per season, chance = goals/7. Clip: https://claude.ai/artifact/4jKKKfR4T5NMoHSKw1Nafy. Chamber Men is merged into gameplay/r88 (#1205); send the art PR into gameplay/r88.
