// JOB-1653: exercise the product's Club render stages, including script animations
// that computed CSS durations cannot see. Used by the screen flash guard.
const STAGES = ["ready", "opening", "manager-one", "manager-two", "versus", "confirmation"];

async function prepareClub(page, override){
    await page.waitForFunction(() => window.CareerModeClubScreenV10 && typeof window.ensureGameplayModules === "function", null, { timeout: 30000 });
    await page.evaluate(async override => {
        if(!window.setApplicationReducedMotionPreference(override)) throw new Error("Motion preference was not saved");
        await window.ensureGameplayModules();
        await window.CareerModeClubScreenV10.install();
        currentShowdown = { id: "club-motion-audit", name: "Daniel vs Nik", managers: { playerOne: "Daniel", playerTwo: "Nik" }, selectedLeague: { id: "premier_league", name: "Premier League" }, clubs: { playerOne: null, playerTwo: null }, totalRounds: 3, status: "League Confirmed", rounds: [] };
        initializeClubAssignment();
        showScreen("clubWheelScreen");
        populateClubAssignmentBase();
        renderReadyAssignmentState();
    }, override);
    await page.waitForFunction(() => window.CareerModeClubScreenV10.isMounted() && document.documentElement.dataset.v10Screen === "clubWheelScreen" && !document.getElementById("clubWheelScreen").hasAttribute("data-v10-pending"), null, { timeout: 20000 });
}

async function measureStage(page, stage){
    return page.evaluate(async stage => {
        const host = document.getElementById("clubWheelScreen");
        const hits = new Map();
        const label = el => {
            const parts = [];
            for(let node = el; node && host.contains(node); node = node.parentElement){
                const tag = node.tagName.toLowerCase();
                if(node.id){ parts.unshift(tag + "#" + node.id); break; }
                const classes = typeof node.className === "string" && node.className.trim() ? "." + node.className.trim().split(/\s+/).join(".") : "";
                const siblings = [...node.parentElement.children].filter(sibling => sibling.tagName === node.tagName);
                parts.unshift(tag + classes + (siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(node) + 1})` : ""));
            }
            return parts.join(" > ");
        };
        const parse = list => String(list).split(",").map(p => p.trim()).map(p => p.endsWith("ms") ? parseFloat(p) : parseFloat(p) * 1000);
        const sample = () => {
            for(const animation of document.getAnimations()){
                const effect = animation.effect, el = effect && effect.target;
                if(!el || !host.contains(el)) continue;
                const timing = effect.getComputedTiming();
                if(timing.activeDuration > 100 || timing.delay > 100 || timing.endDelay > 100){
                    const hit = { source: "document.getAnimations", element: label(el), duration: timing.duration, activeDuration: timing.activeDuration, delay: timing.delay, endDelay: timing.endDelay, playState: animation.playState };
                    hits.set(JSON.stringify(hit), hit);
                }
            }
            for(const el of [host, ...host.querySelectorAll("*")]){
                for(const pseudo of [null, "::before", "::after"]){
                    const css = getComputedStyle(el, pseudo);
                    for(const [kind, durations, delays] of [["animation", css.animationDuration, css.animationDelay], ["transition", css.transitionDuration, css.transitionDelay]]){
                        if(kind === "animation" && css.animationName === "none" || kind === "transition" && css.transitionProperty === "none") continue;
                        if([...parse(durations), ...parse(delays)].some(ms => ms > 100)){
                            const hit = { source: "CSS " + kind, element: label(el) + (pseudo || ""), duration: durations, delay: delays };
                            hits.set(JSON.stringify(hit), hit);
                        }
                    }
                }
            }
        };
        if(stage){
            currentShowdown.clubs = stage === "ready" || stage === "opening" ? { playerOne: null, playerTwo: null } : { playerOne: "Arsenal", playerTwo: "Chelsea" };
            if(stage === "ready") renderReadyAssignmentState();
            else if(stage === "confirmation") renderClubConfirmationState();
            else renderClubRevealStage(stage);
        }
        // Start before the next paint and keep sampling through the short fades.
        const start = performance.now();
        do {
            await new Promise(resolve => requestAnimationFrame(resolve));
            sample();
        } while(performance.now() - start < 200);
        if(!window.CareerModeClubScreenV10.isMounted() || !host.querySelector(":scope > .cl-stage #world") || document.documentElement.dataset.v10Screen !== "clubWheelScreen" || stage && host.dataset.clubRevealStage !== stage) throw new Error("Club stage did not mount: " + stage);
        return { stage: host.dataset.clubRevealStage, hits: [...hits.values()] };
    }, stage);
}

module.exports = { STAGES, prepareClub, measureStage };
