# Fable job 4: r87 Settings, sign-in and pairing bug hunt (Career Mode Showdown 2.0.0)

Code snapshot: gameplay/r87 @ 73713d75b, repo nikahanghojjati-oss/fifa17-career-showdown2. The full source of every file in scope is below this brief. You cannot run code here, so reason carefully and show your trace.

## The product
A private two-player FIFA 17 Career Mode competition web app (vanilla JS, Firebase Auth + Firestore on the free **Spark** plan, GitHub Pages, a service worker). Two managers, Daniel (playerOne) and Nik (playerTwo), each on his own phone or laptop, play a "Showdown" of 1, 3, 5 or 10 seasons. Firestore reads are the scarcest resource (50,000 billed reads a day; every Rules `get()`/`exists()` is a billed read too).

## The area you own: everything before and around a Showdown
1. **Sign-in and identity** (js/onlinePlayerIdentity.js, js/sparkPrivateSession.js): Google sign-in, which manager this account is, the private session and its expiry, sign-out, a second device for the same manager, a new phone.
2. **Permanent pairing** (js/persistentNikDanielPair.js, js/sparkPrivatePairing.js, js/connectPlayersScreenV10.js, the persistent-pair Rules fragment): the two accounts pair once with a code and stay paired. **UNPAIR lives in Settings.** Re-pairing after UNPAIR must work.
3. **Starting and joining** (js/sparkRemoteJoining.js, js/startJoinViewModel.js, js/whichShowdownIsLive.js, js/productionSharedShowdownSetup.js, js/showdownModes.js, the shared-setup Rules fragment): **only Daniel starts a Showdown and picks the season count** (1, 3, 5 or 10). Nik sees **JOIN on Home**; Home auto-checks for a Showdown to join every 20 s for at most 10 minutes. A real Showdown and a test Showdown must never be confused.
4. **Settings** (js/settings.js, js/rulesSettingsV10.js, js/musicDockV10.js): the shared reads meter ("X of 50,000 · both phones", "About N seasons left"), END SHOWDOWN (ends the current Showdown early for both), OPEN HISTORY & BACKUP, UNPAIR, music (Blur "Song 2" first, John Newman second; mute; a readable scrollable track list), the Rule Book.

## House rules (a break is a bug)
- No tiebreak anywhere: equal = DRAW.
- Reus Gate: the loading screen stays until the next screen is ready; no half-drawn screen, no flash of an old design. Never dim the screen. Nothing covers anything at any size.
- Never skip, hide or reorder a needed screen. Never invent the other manager's action on this phone.
- Each manager's private data stays private until the rules reveal it.
- Recovery controls must be explicit when an operation can fail; retries must be read-only or idempotent; never show success that the backend did not confirm.

## Threat model
Normal play only: two honest players, reloads, phone locks (iPhone Safari evicts pages), offline/online, slow networks, token and session expiry, two tabs, timing races between the phones (both tap at once, one is a step ahead), a service-worker upgrade with one phone a build behind, quota exhausted then the next day, old Showdowns and old pair records from earlier builds. **Out of scope:** anything that needs a modified app, the console or direct database writes; list such things only as "hardening, out of scope".

## Already known or covered elsewhere (do not re-report)
- Fable job 3 is hunting Rules-vs-app refusals, read counts and connectivity across the season flow, including these files. Here, report a Rules or reads issue only if it breaks one of the journeys below for a player; skip pure read-count optimisations.
- The shared reads meter (#1097) and its Rules are being finished and proven on the emulator now; report meter **logic** bugs (wrong number, phones disagreeing, a stuck meter), not the missing deploy.
- Career-screen numbers, the roulette and the Gazette have their own hunts.

## Your job
Work as the senior engineer who owns "getting two people into a game, and Settings, never break". Read every file below in full.

Walk these journeys on two real phones, and at every step ask: what if this phone reloads, locks, goes offline, has an expired session, is a build behind, is a step ahead or behind the other phone, or has a second tab open?
1. First run: both sign in, pair with a code, Home shows the right buttons for each manager.
2. Every later day: open the app cold (also offline first, then online), still paired, still the right manager, no re-pairing asked.
3. Daniel starts a 1/3/5/10-season Showdown; Nik's Home finds it and JOIN works, including when Nik opened Home before Daniel started, when Nik's 10-minute auto-check has run out, and when Nik's phone was locked during the check.
4. A Showdown already running: either phone reloads on Home, in Settings, and in the middle of joining.
5. END SHOWDOWN in Settings from either phone, at every phase (setup, Career Start, transfer window, results, between seasons), including both phones tapping it at once and the other phone being offline.
6. UNPAIR then pair again; UNPAIR while a Showdown is running; UNPAIR on one phone while the other is offline.
7. Sign-out, sign in as the other manager on the same device, a new phone for the same manager.
8. Settings screens: meter (both phones agree, never NaN, negative or stuck "loading"), History & Backup opens, music controls, Rule Book text (js/ruleBook.js) matches the scoring: Champions League +5 or Europa League +3 (never both), league title +3, domestic cup +1, one shared +1 for 100 league points and/or 100 goals, one shared +1 for Top Scorer and/or Top Assist, max 11 a season; no tiebreak; lengths 1/3/5/10 only.

Report every way a player can get stuck, be shown the wrong manager or the wrong Showdown, join a test game as real (or the reverse), lose pairing, see a pairing code again when already paired, have one phone believe a Showdown ended while the other carries on, see a refused honest action, or hit a crash on honest input. Also any loop of reads or a poll that runs while hidden or forever.

For each finding: ID (F4-NN), severity (P0 stuck or lost Showdown/pairing, P1 refused honest action or wrong screen a player will hit, P2 rare, P3 polish), file:line (quote the code so it can be found by text), exact steps on the two phones, expected vs actual, billed reads involved if any, and your trace through the code. Put anything you are not sure of in a separate "suspected" list. No style notes. End with the top 5 to fix first.

Keep the visible reply under about 60,000 characters.


## FILE: js/settings.js
```javascript
/* =====================================================
   Career Mode Showdown v1.2.1
   Lightweight application Settings
===================================================== */

let settingsOverlay = null;

// r78 (HO-029): the shared marble confirm box (js/showdownConfirm.js, loaded on first use) replaces the native confirm().
// It resolves true only for OK; Cancel, Esc or a box that cannot load resolve false (undefined when no loader exists).
function settingsAskConfirm(message,tone){return typeof window.askShowdownConfirm==="function"?window.askShowdownConfirm(message,{tone}):typeof window.loadRuntimeScript==="function"?window.loadRuntimeScript("showdown-confirm","js/showdownConfirm.js",()=>typeof window.askShowdownConfirm==="function").then(()=>window.askShowdownConfirm(message,{tone}),()=>false):Promise.resolve(undefined);}

let settingsDialog = null;
let settingsContent = null;
let settingsPreviousFocus = null;
let settingsPreferenceListenerBound = false;
let settingsOfflineListenerBound = false;
let settingsOfflineGuidance = "";
let settingsUpdatePending = false;

function getSettingsAssetRevision(){
    const meta = document.querySelector('meta[name="app-asset-revision"]');
    return meta && meta.content ? meta.content.trim() : "Unknown build";
}

function getSettingsApplicationVersion(){
    return typeof APP_VERSION === "string" ? APP_VERSION : "1.2.1";
}

function getSettingsActiveShowdown(){
    if(typeof currentShowdown !== "undefined" && currentShowdown){
        return currentShowdown;
    }
    return typeof loadSavedShowdown === "function" ? loadSavedShowdown() : null;
}

function getSettingsLegacyHistory(){
    if(typeof loadLegacyShowdowns !== "function"){
        return [];
    }
    try{
        return loadLegacyShowdowns();
    }catch(error){
        return [];
    }
}

/* CE2PG (r80): online, the local save outlives its Showdown (it still reads "Created" after the Final Winner, or after the
   other phone ended it) and the local history list is never written. Home's LIVE tile reads the pair state, so Settings
   reads it too: CURRENT SHOWDOWN and END SHOWDOWN only while the pair holds a live (active or waiting) Showdown. With no
   pair state yet (module not loaded or not initialized) the local save decides, as before. */
function getSettingsPairState(){
    try{
        const pair = window.CareerModePersistentNikDanielPair;
        const pairState = pair && typeof pair.getState === "function" ? pair.getState() : null;
        // Codex #935: a transient "unavailable" (or idle/signed-out) pair state is unknown, as in js/whichShowdownIsLive.js, so
        // the local save decides; only an authoritative pair state can hide the current Showdown and its END SHOWDOWN.
        return pairState && pairState.initialized === true && !["idle", "unavailable", "signed-out"].includes(pairState.status) ? pairState : null;
    }catch(_error){
        return null;
    }
}

function getSettingsLiveShowdown(){
    const active = getSettingsActiveShowdown();
    if(!active){ return null; }
    const pairState = getSettingsPairState();
    if(!pairState){ return { showdown: active, status: active.status || "Saved" }; }
    if(!pairState.rivalryId){ return null; }
    if(pairState.connectionState === "active"){ return { showdown: active, status: "Live" }; }
    if(pairState.connectionState === "pending-pair"){ return { showdown: active, status: "Waiting to join" }; }
    return null;
}

/* CE2PG (r80): online, HISTORY counts the completed Showdowns of the shared career model that History, Career Statistics
   and Trophy Room show (the same exact gets Career Statistics makes when it opens, once per Settings open). The local list
   is still used when this browser is not a registered Daniel or Nik. */
function isSettingsOnlineCareer(){
    try{
        const identity = window.CareerModeOnlinePlayerIdentity && typeof window.CareerModeOnlinePlayerIdentity.getState === "function"
            ? window.CareerModeOnlinePlayerIdentity.getState()
            : null;
        return Boolean(identity && identity.registered === true && (identity.managerId === "daniel" || identity.managerId === "nik"));
    }catch(_error){
        return false;
    }
}

function settingsCompletedCountText(count){
    return `${count} completed showdown${count === 1 ? "" : "s"}`;
}

function getSettingsOnlineHistoryText(){
    try{
        const legacy = window.CareerModeRivalryLegacyV10;
        const model = legacy && typeof legacy.cachedCareerModel === "function" ? legacy.cachedCareerModel() : null;
        if(model && ["ready", "partial", "empty"].includes(model.status)){
            const showdowns = model.history && Array.isArray(model.history.showdowns) ? model.history.showdowns : [];
            const completed = showdowns.filter(row => row && row.status === "completed").length;
            // Codex #935: a partial career could not read every indexed Showdown, so its count is a floor, not the total.
            return model.status === "partial" ? `At least ${settingsCompletedCountText(completed)}` : settingsCompletedCountText(completed);
        }
        return settingsHistoryLoad ? "Loading…" : "Unavailable right now";
    }catch(_error){
        return "Unavailable right now";
    }
}

let settingsHistoryLoad = null;
function refreshSettingsOnlineHistory(){
    if(settingsHistoryLoad || typeof window.loadRuntimeScript !== "function"){ return; }
    const load = settingsHistoryLoad = Promise.resolve().then(async () => {
        if(!window.CareerModeRivalryLegacyV10){
            await window.loadRuntimeScript("rivalry-legacy-v10", "js/rivalryLegacyV10.js", () => Boolean(window.CareerModeRivalryLegacyV10));
        }
        await window.CareerModeRivalryLegacyV10.loadCareerModel();
    }).catch(() => {}).then(() => {
        if(settingsHistoryLoad === load){ settingsHistoryLoad = null; }
        const value = settingsContent ? settingsContent.querySelector(".settingsHistoryCount") : null;
        if(value){ value.textContent = getSettingsOnlineHistoryText(); }
    });
}

function createSettingsElement(tagName, className = "", text = ""){
    const element = document.createElement(tagName);
    if(className){ element.className = className; }
    if(text !== ""){ element.textContent = text; }
    return element;
}

function createSettingsInfoRow(label, value, valueClass = ""){
    const row = createSettingsElement("div", "settingsInfoRow");
    const labelElement = createSettingsElement("span", "", label);
    const valueElement = createSettingsElement("strong", valueClass, value);
    row.append(labelElement, valueElement);
    return row;
}

function createSettingsPanel(eyebrow, title, description){
    const panel = createSettingsElement("section", "settingsPanel");
    const heading = createSettingsElement("div", "settingsPanelHeading");
    heading.append(
        createSettingsElement("span", "settingsPanelEyebrow", eyebrow),
        createSettingsElement("h3", "", title)
    );
    if(description){
        heading.appendChild(createSettingsElement("p", "", description));
    }
    panel.appendChild(heading);
    return panel;
}

function getSettingsMotionState(){
    if(typeof window.getApplicationMotionPreferenceState === "function"){
        return window.getApplicationMotionPreferenceState();
    }
    const systemReduced = typeof window.matchMedia === "function"
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return {
        motionPreference: "follow",
        reducedMotionOverride: false,
        systemReduced,
        effectiveReduced: systemReduced
    };
}

function focusSettingsControl(selector){
    window.requestAnimationFrame(() => {
        if(!settingsOverlay || settingsOverlay.classList.contains("hidden") || !settingsContent){
            return;
        }
        const selected = settingsContent.querySelector(selector);
        if(selected){
            selected.focus({ preventScroll: true });
        }
    });
}

function focusSelectedSettingsMotionChoice(){
    focusSettingsControl(".settingsMotionChoice.selected");
}

function setSettingsMotionPreference(choice){
    if(typeof window.setApplicationMotionPreference !== "function"){
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("Motion preferences are unavailable right now.", "error");
        }
        return;
    }

    if(!window.setApplicationMotionPreference(choice)){
        return;
    }

    if(typeof window.showAppNotice === "function"){
        window.showAppNotice(
            choice === "reduce" ? "Reduced motion is enabled."
                : choice === "full" ? "Full motion is enabled."
                : "Motion now follows your device preference.",
            "success",
            3000
        );
    }
}

function setSettingsMenuFeedbackPreference(enabled){
    if(typeof window.setApplicationMenuFeedbackPreference !== "function"){
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("Menu feedback preferences are unavailable right now.", "error");
        }
        return;
    }

    if(!window.setApplicationMenuFeedbackPreference(Boolean(enabled))){
        return;
    }

    if(typeof window.showAppNotice === "function"){
        window.showAppNotice(
            enabled ? "Menu click feedback is enabled." : "Menu click feedback is muted.",
            "success",
            3000
        );
    }
}

function handleMotionChoiceKeydown(event){
    if(!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)){
        return;
    }

    const group = event.currentTarget.closest("[role='radiogroup']");
    if(!group){ return; }
    const choices = Array.from(group.querySelectorAll(".settingsMotionChoice"));
    if(!choices.length){ return; }

    event.preventDefault();
    const currentIndex = Math.max(0, choices.indexOf(event.currentTarget));
    let nextIndex = currentIndex;
    if(event.key === "Home"){
        nextIndex = 0;
    }else if(event.key === "End"){
        nextIndex = choices.length - 1;
    }else{
        const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
        nextIndex = (currentIndex + direction + choices.length) % choices.length;
    }

    choices[nextIndex].click();
}

function createMotionChoice(label, description, selected, choice){
    const button = createSettingsElement("button", "settingsMotionChoice");
    button.type = "button";
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", selected ? "true" : "false");
    button.tabIndex = selected ? 0 : -1;
    button.dataset.motionChoice = choice;
    button.dataset.motionReduced = choice === "reduce" ? "true" : "false";
    button.classList.toggle("selected", selected);

    const marker = createSettingsElement("span", "settingsMotionMarker");
    marker.setAttribute("aria-hidden", "true");
    const copy = createSettingsElement("span", "settingsMotionCopy");
    copy.append(
        createSettingsElement("strong", "", label),
        createSettingsElement("small", "", description)
    );
    button.append(marker, copy);
    button.addEventListener("click", () => setSettingsMotionPreference(choice));
    button.addEventListener("keydown", handleMotionChoiceKeydown);
    return button;
}

function createMenuFeedbackControl(){
    const enabled = typeof window.isMenuFeedbackEnabled === "function"
        ? window.isMenuFeedbackEnabled()
        : true;
    const row = createSettingsElement("div", "settingsAudioRow");
    const copy = createSettingsElement("div", "settingsAudioCopy");
    copy.append(
        createSettingsElement("strong", "", "MENU CLICK FEEDBACK"),
        createSettingsElement(
            "small",
            "",
            "A short click on menu taps. Silent while Home music plays."
        )
    );

    const toggle = createSettingsElement("button", `settingsAudioToggle ${enabled ? "enabled" : "muted"}`);
    toggle.type = "button";
    toggle.setAttribute("role", "switch");
    toggle.setAttribute("aria-checked", String(enabled));
    toggle.setAttribute("aria-label", `Menu click feedback ${enabled ? "on" : "off"}`);
    toggle.append(
        createSettingsElement("span", "settingsAudioToggleTrack"),
        createSettingsElement("strong", "", enabled ? "ON" : "OFF")
    );
    toggle.addEventListener("click", () => setSettingsMenuFeedbackPreference(!enabled));
    row.append(copy, toggle);
    return row;
}

// r86: today's free Firebase reads as Google bills them (documents plus the security-check lookups, priced per document).
// r87 shared reads meter: once both phones have confirmed a season today, the total is the two phones' own meters added up, the same
// number on both phones ("both phones after season N"), with this phone's part ("here"), the partner's and what this phone has
// read since. Before that (or with a partner phone on an older build) it is an estimate from this phone's reads and its role's share
// of a season, marked "estimated". Resets at 3 am Boston.
function getSettingsRoundedReads(value){
    return (Math.round(value / 10) * 10).toLocaleString("en-US");
}
function getSettingsReadsTodayText(){
    try{
        const today = window.CareerModeFirestoreBudget?.readsToday?.();
        if(!today || !Number.isFinite(today.billedEstimate)){ return ""; }
        const limit = today.freeReadsPerDay.toLocaleString("en-US");
        const shared = today.shared;
        if(shared && Number.isFinite(shared.used)){
            const since = shared.sinceThisPhone >= 5 ? ` · +${getSettingsRoundedReads(shared.sinceThisPhone)} here since` : "";
            return `${getSettingsRoundedReads(shared.used)} of ${limit} · both phones after season ${shared.season} · ${getSettingsRoundedReads(shared.thisPhone)} here · partner ${getSettingsRoundedReads(shared.partner)}${since}`;
        }
        const total = `About ${getSettingsRoundedReads(today.billedEstimate)} of ${limit} · estimated for both phones`;
        if(!Number.isFinite(today.thisPhone)){ return total; }
        return `${total} · ${getSettingsRoundedReads(today.thisPhone)} here`;
    }catch(_error){
        return "";
    }
}

// r84: how many more seasons today's free reads allow at the pace played. r87: from both phones' meters (the same on both
// phones), or estimated from this phone's own season costs and its role's share.
function getSettingsSeasonsLeftText(){
    try{
        const left = window.CareerModeFirestoreBudget?.seasonsLeftToday?.();
        if(!left || !Number.isFinite(left.seasons)){ return ""; }
        const count = `${left.seasons} ${left.seasons === 1 ? "season" : "seasons"}`;
        const cost = Number.isFinite(left.billedPerSeason) ? ` · ${getSettingsRoundedReads(left.billedPerSeason)} per season` : "";
        if(left.basis === "shared"){ return `About ${count}${cost}, both phones`; }
        if(left.basis === "today"){ return `About ${count}${cost} · estimated at today's pace`; }
        return `About ${count} · estimate until a season is played today`;
    }catch(_error){
        return "";
    }
}

function createApplicationPanel(){
    const panel = createSettingsPanel(
        "APPLICATION",
        "CAREER MODE SHOWDOWN",
        "Daniel and Nik's FIFA 17 Career Mode companion for two managers."
    );
    const info = createSettingsElement("div", "settingsInfoGrid");
    info.append(
        createSettingsInfoRow("APPLICATION VERSION", `v${getSettingsApplicationVersion()}`),
        createSettingsInfoRow("BUILD", getSettingsAssetRevision()),
        createSettingsInfoRow("CAREER DATA", "Automatic Showdown storage"),
        createSettingsInfoRow("PLAY MODE", "Daniel vs Nik · two devices")
    );
    const readsToday = getSettingsReadsTodayText();
    if(readsToday){ info.appendChild(createSettingsInfoRow("FREE ONLINE USE TODAY", readsToday)); }
    const seasonsLeft = getSettingsSeasonsLeftText();
    if(seasonsLeft){ info.appendChild(createSettingsInfoRow("SEASONS LEFT TODAY", seasonsLeft)); }
    panel.appendChild(info);
    const updateState = getSettingsOfflineState();
    const update = createSettingsElement("button", "menuButton settingsApplicationUpdateButton", updateState.updateActionLabel || "UPDATE TO LATEST VERSION");
    update.type = "button";
    update.disabled = settingsUpdatePending || Boolean(updateState.updateActionDisabled);
    update.addEventListener("click", handleSettingsOfflineUpdate);
    const status = createSettingsElement("p", "settingsOfflineNote settingsApplicationUpdateStatus", settingsOfflineGuidance || "Updating keeps your Showdown and player.");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    panel.append(update, status);
    return panel;
}

function createMotionPanel(){
    const state = getSettingsMotionState();
    const panel = createSettingsPanel(
        "ACCESSIBILITY",
        "MOTION & FEEDBACK",
        "Follow your device, cut motion, or turn the menu click on or off."
    );

    const summary = createSettingsElement("div", "settingsMotionSummary");
    const effective = createSettingsElement(
        "strong",
        `settingsStatus ${state.effectiveReduced ? "reduced" : "standard"}`,
        state.effectiveReduced ? "REDUCED" : "STANDARD"
    );
    summary.append(
        createSettingsInfoRow("DEVICE PREFERENCE", state.systemReduced ? "Reduced motion" : "Standard motion"),
        createSettingsInfoRow("EFFECTIVE APP MOTION", state.effectiveReduced ? "Reduced motion" : "Standard motion")
    );
    summary.prepend(effective);

    const choices = createSettingsElement("div", "settingsMotionChoices");
    choices.setAttribute("role", "radiogroup");
    choices.setAttribute("aria-label", "Application motion preference");
    choices.append(
        createMotionChoice(
            "FOLLOW DEVICE",
            "Match your device's accessibility setting.",
            state.motionPreference === "follow",
            "follow"
        ),
        createMotionChoice(
            "FULL MOTION",
            "Always play transitions and reveals.",
            state.motionPreference === "full",
            "full"
        ),
        createMotionChoice(
            "REDUCE MOTION",
            "Cut menu transitions, the wheel delay and club reveal effects.",
            state.motionPreference === "reduce",
            "reduce"
        )
    );

    panel.append(summary, choices, createMenuFeedbackControl());
    return panel;
}

function getSettingsOfflineState(){
    if(typeof window.getOfflineAppSettingsState === "function"){
        return window.getOfflineAppSettingsState();
    }
    return {
        supported:false,
        standalone:false,
        connectivity:"online",
        connectivityVerified:false,
        connectivityLabel:"Checking",
        offlineReady:false,
        offlineRecoveryReady:false,
        shellLabel:"Preparing offline support",
        waitingUpdate:false,
        installPromptAvailable:false,
        installationLabel:"Preparing install support",
        installActionLabel:"PREPARING OFFLINE SUPPORT",
        installActionDisabled:true,
        updateActionLabel:"UPDATE TO LATEST VERSION",
        updateActionDisabled:true,
        installGuidance:"Offline support is still starting. Reopen Settings in a moment if this status does not update."
    };
}

async function handleSettingsOfflineInstall(){
    if(typeof window.requestOfflineAppInstall !== "function"){
        settingsOfflineGuidance = "Offline installation support is still starting. Try again in a moment.";
        renderSettings();
        focusSettingsControl(".settingsOfflineInstallButton");
        return;
    }

    const result = await window.requestOfflineAppInstall();
    settingsOfflineGuidance = result?.message || "";
    renderSettings();
    focusSettingsControl(".settingsOfflineInstallButton");
}

async function handleSettingsOfflineUpdate(event){
    if(settingsUpdatePending){ return; }
    const button = event?.currentTarget || null;
    const focusSelector = button?.classList.contains("settingsApplicationUpdateButton") ? ".settingsApplicationUpdateButton" : ".settingsOfflineUpdateButton";
    const state = getSettingsOfflineState();
    const action = state.waitingUpdate
        ? window.activateWaitingOfflineUpdate
        : window.requestLatestOfflineUpdate;

    if(typeof action !== "function"){
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("Updates are not available offline right now.", "error", 6000);
        }
        return;
    }

    settingsUpdatePending = true;
    if(button){
        button.disabled = true;
    }
    // Nik 2026-10-05: the result belongs in the status box under the button, not in a toast behind Settings.
    showSettingsUpdateStatus(state.waitingUpdate ? "Applying the downloaded update…" : "Checking for the latest version…");

    try{
        const result = await action({ quiet:true });
        settingsOfflineGuidance = typeof result === "boolean"
            ? (result ? "Updating now. The app reloads into the new version in a moment." : "The update could not be applied yet. Return to Home and try again.")
            : (result?.message || "");
    }catch(error){
        settingsOfflineGuidance = error?.message || "The latest version could not be checked right now.";
    }finally{
        settingsUpdatePending = false;
        renderSettings();
        focusSettingsControl(focusSelector);
    }
}

function showSettingsUpdateStatus(message){
    settingsOfflineGuidance = message;
    settingsContent?.querySelectorAll(".settingsOfflineNote").forEach(note => { note.textContent = message; });
}

function createOfflinePanel(){
    const state = getSettingsOfflineState();
    const panel = createSettingsPanel(
        "DEVICE",
        "OFFLINE APP",
        "Install Career Mode Showdown to open it like an app and play offline."
    );
    panel.classList.add("settingsOfflinePanel");

    const info = createSettingsElement("div", "settingsInfoGrid settingsOfflineInfo");
    info.append(
        createSettingsInfoRow("INSTALLATION", state.installationLabel),
        createSettingsInfoRow("OFFLINE SHELL", state.shellLabel),
        createSettingsInfoRow(
            "CONNECTIVITY",
            state.connectivityVerified ? state.connectivityLabel : "Checking connection"
        )
    );

    const actions = createSettingsElement("div", "settingsOfflineActions");
    const install = createSettingsElement(
        "button",
        "menuButton settingsOfflineInstallButton",
        state.installActionLabel
    );
    install.type = "button";
    install.disabled = Boolean(state.installActionDisabled);
    install.addEventListener("click", handleSettingsOfflineInstall);
    actions.appendChild(install);

    const update = createSettingsElement(
        "button",
        "menuButton settingsOfflineUpdateButton",
        state.updateActionLabel || (state.waitingUpdate ? "APPLY READY UPDATE" : "UPDATE TO LATEST VERSION")
    );
    update.type = "button";
    update.disabled = Boolean(state.updateActionDisabled);
    update.addEventListener("click", handleSettingsOfflineUpdate);
    actions.appendChild(update);

    const note = createSettingsElement(
        "p",
        "settingsOfflineNote",
        settingsOfflineGuidance || (
            state.standalone
                ? "Installed. Your Showdown save is not affected."
                : "Tap install for your browser's install steps."
        )
    );
    note.setAttribute("role", "status");
    note.setAttribute("aria-live", "polite");

    panel.append(info, actions, note);
    return panel;
}

function refreshSettingsOfflinePanel(){
    if(!settingsContent){ return false; }
    const applicationUpdate = settingsContent.querySelector(".settingsApplicationUpdateButton");
    if(applicationUpdate){
        const state = getSettingsOfflineState();
        applicationUpdate.textContent = state.updateActionLabel || "UPDATE TO LATEST VERSION";
        applicationUpdate.disabled = settingsUpdatePending || Boolean(state.updateActionDisabled);
    }
    const existing = settingsContent.querySelector(".settingsOfflinePanel");
    if(!existing){
        renderSettings();
        return false;
    }
    existing.replaceWith(createOfflinePanel());
    return true;
}

async function openSettingsDataManagement(){
    closeSettings(false);

    if(typeof window.openOptionalModule !== "function"){
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("Data Management could not be opened.", "error");
        }
        openSettings();
        return;
    }

    // Legacy is Team V's History screen; this button asks for its data tools page (backup, restore, reset) instead.
    window.careerModeLegacyDataTools = true;
    const opened = await window.openOptionalModule("legacy");
    if(!opened){
        window.careerModeLegacyDataTools = false;
        openSettings();
    }
}

async function ensureSettingsShowdownStorageAuthority(){
    if(window.CareerModeSaveLibraryRuntime?.isReady?.()){
        return true;
    }

    if(typeof window.ensureSaveLibraryRuntimeAuthority !== "function"){
        if(typeof window.loadRuntimeScript !== "function"){
            throw new Error("Showdown storage is unavailable in this session.");
        }
        await window.loadRuntimeScript(
            "save-library-cutover",
            "js/saveLibraryCutover.js",
            () => typeof window.ensureSaveLibraryRuntimeAuthority === "function"
        );
    }

    await window.ensureSaveLibraryRuntimeAuthority();
    if(!window.CareerModeSaveLibraryRuntime?.isReady?.()){
        throw new Error("Showdown storage could not be verified.");
    }
    return true;
}

async function ensureSettingsPersistentPairAuthority(){
    const identity = window.CareerModeOnlinePlayerIdentity;
    if(identity && typeof identity.syncPair === "function"){
        await identity.syncPair();
    }

    if(!window.CareerModePersistentNikDanielPair){
        if(typeof window.loadRuntimeScript !== "function"){
            throw new Error("The Showdown connection service is unavailable.");
        }
        await window.loadRuntimeScript(
            "online-persistent-pair",
            "js/persistentNikDanielPair.js",
            () => Boolean(window.CareerModePersistentNikDanielPair)
        );
    }

    const pair = window.CareerModePersistentNikDanielPair;
    if(!pair || typeof pair.initialize !== "function" || typeof pair.getState !== "function"){
        throw new Error("The Showdown connection service is unavailable.");
    }
    await pair.initialize({ force: true });
    return pair;
}

/* r80 END SHOWDOWN: the seasons count is read at END time from the accepted Shared Season Commits of this exact rivalry
   (rivalries/{id}/seasonCommits/season_N, ACKNOWLEDGED revision 3): the same documents and the same accepted-prefix rule
   the multi-season progression counts from. Both paired players may read them without the private session, so the count
   is the same on a fresh browser that opened Settings before CONTINUE (no Shared Setup state, no session) as in the game.
   One read-only transaction (no write; the budget layer ends it without a commit), straight from the server, stopping at
   the first season not yet accepted: accepted + 1 document reads at most (11). No season commit at all is 0 seasons (the
   league wheel). resumeFromAuthority() is not used: it also moves the season cursor. Unknown (offline, the
   read denied or a malformed commit) is null: END still closes and History shows a dash. */
const SETTINGS_SEASONS_READ_MS = 10000;
const SETTINGS_SEASONS_MAX = 10;
async function readSettingsAcceptedSeasonCount(rivalryId){
    const runtime = window.CareerModeProductionFirebaseRuntime;
    if(!runtime || typeof runtime.ensureAccountServices !== "function"){ return null; }
    const budget = window.CareerModeFirestoreBudget;
    const services = (budget && typeof budget.services === "function" ? budget.services : value => value)(await runtime.ensureAccountServices());
    const sdk = services && services.ok === true ? services.firestoreSdk : null;
    if(!sdk || !services.firestore || !services.auth || !services.auth.currentUser
        || typeof sdk.doc !== "function" || typeof sdk.runTransaction !== "function"){
        return null;
    }
    return sdk.runTransaction(services.firestore, async transaction => {
        let accepted = 0;
        for(let seasonNumber = 1; seasonNumber <= SETTINGS_SEASONS_MAX; seasonNumber += 1){
            const ref = sdk.doc(services.firestore, "rivalries", rivalryId, "seasonCommits", `season_${seasonNumber}`);
            if(budget && typeof budget.readServerNext === "function" && ref && typeof ref.path === "string"){ budget.readServerNext(ref.path); }
            const snapshot = await transaction.get(ref);
            const commit = snapshot && typeof snapshot.exists === "function" && snapshot.exists() ? snapshot.data() : null;
            if(!commit){ break; }
            if(commit.schemaVersion !== 1 || commit.objectType !== "sharedSeasonCommit" || commit.rivalryId !== rivalryId
                || commit.seasonNumber !== seasonNumber || !["COMMITTED", "ACKNOWLEDGED"].includes(commit.phase)
                || (commit.phase === "ACKNOWLEDGED") !== (commit.revision === 3)){
                return null;
            }
            if(commit.phase !== "ACKNOWLEDGED"){ break; }
            accepted = seasonNumber;
        }
        return accepted;
    });
}
async function readSettingsSeasonsPlayed(rivalryId){
    if(typeof rivalryId !== "string" || !/^pair_[0-9a-f]{64}$/.test(rivalryId)){ return null; }
    let timer = null;
    try{
        const accepted = await Promise.race([
            readSettingsAcceptedSeasonCount(rivalryId),
            new Promise(resolve => { timer = setTimeout(() => resolve(null), SETTINGS_SEASONS_READ_MS); })
        ]);
        return Number.isInteger(accepted) && accepted >= 0 && accepted <= SETTINGS_SEASONS_MAX ? accepted : null;
    }catch(_error){
        return null;
    }finally{
        clearTimeout(timer);
    }
}

async function releaseSettingsCurrentShowdownConnection(showdown){
    const expectedRivalryId = showdown && showdown.sharedJourney && showdown.sharedJourney.rivalryId
        ? showdown.sharedJourney.rivalryId
        : null;
    const expectedSaveId = showdown && showdown.identity && showdown.identity.saveId
        ? showdown.identity.saveId
        : null;

    const pair = await ensureSettingsPersistentPairAuthority();
    const pairState = pair.getState();
    const hasCurrentPair = Boolean(
        pairState
        && pairState.rivalryId
        && (pairState.connectionState === "active" || pairState.connectionState === "pending-pair")
    );

    if(!expectedRivalryId && !hasCurrentPair){
        // Codex #937: only a refresh that read the pair link ("paired" or "unpaired") may end locally; an outage or error
        // state must not turn END for both players into a local-only delete.
        if(!pairState || !["paired", "unpaired"].includes(pairState.status)){
            throw new Error("The online Showdown could not be checked, so nothing was changed. Try again.");
        }
        return { ok: true, status: "unpaired" };
    }

    if(typeof pair.abandonCurrentShowdown !== "function"){
        throw new Error("Safe Showdown restart is unavailable in this build.");
    }

    const rivalryId = expectedRivalryId || pairState.rivalryId;
    // Codex #933: a code Nik has not joined yet (pending-pair) has no season commits, and the Rules deny reading them before
    // ACTIVE, so its count is 0 without a read (a denied read would record "-" seasons).
    const waiting = pairState && pairState.rivalryId === rivalryId && pairState.connectionState === "pending-pair";
    const seasonsPlayed = waiting ? 0 : await readSettingsSeasonsPlayed(rivalryId);
    // A rivalry already closed (the other phone ended it, or a retry after this one landed) answers "already-closed": success.
    const result = await pair.abandonCurrentShowdown({
        expectedRivalryId: rivalryId,
        expectedSaveId,
        seasonsPlayed
    });
    if(!result || result.ok !== true){
        throw new Error("The online Showdown was not ended, so nothing was changed.");
    }
    return { ...result, endedRivalryId: rivalryId };
}

// After END has closed the Showdown here too, its private session leaves page memory, as it does on the other phone
// (Terminal Close). Only that rivalry's session; a later Showdown's session is never touched.
function forgetSettingsEndedSession(rivalryId){
    const remote = window.CareerModeSparkRemoteJoining;
    try{
        const session = rivalryId && remote && typeof remote.getState === "function" ? remote.getState() : null;
        if(session && session.rivalryId === rivalryId && typeof remote.forgetSession === "function"){ remote.forgetSession(); }
    }catch(_error){}
}

function finishSettingsCurrentShowdownDeletion(){
    if(typeof window.stopTransferTimerLoop === "function"){
        window.stopTransferTimerLoop();
    }
    if(typeof window.resetTransientSelectionOperations === "function"){
        window.resetTransientSelectionOperations();
    }
    if(typeof currentShowdown !== "undefined"){
        currentShowdown = null;
    }
    if(typeof window.resetNavigationState === "function"){
        window.resetNavigationState();
    }

    closeSettings(false);
    const navigated = typeof showScreen === "function"
        ? showScreen("mainMenu", false)
        : (typeof window.navigateTo === "function"
            ? window.navigateTo("mainMenu", { addToHistory: false })
            : false);

    if(typeof window.refreshMainMenuExperience === "function"){
        window.refreshMainMenuExperience();
    }
    return navigated;
}

/* Ending the Showdown also removes every unsent private draft on this device (Season Results, Transfer Challenge, signing), for every rivalry, including orphans.
   The sweep lives in diagnostics.js (the only non-startup file allowed to touch browser storage directly) and loads on demand; it needs no rivalry id, so it also works offline or before the pair module loads. */
function sweepSettingsShowdownDrafts(){
    try{
        return Promise.resolve(window.ensureDiagnosticsModule()).then(() => window.clearAllShowdownDraftKeys() === true).catch(() => false);
    }catch(_error){
        return Promise.resolve(false);
    }
}

/* r80: a double tap (or a second tap while the first END is still running) joins the END already in flight. */
let settingsEndShowdownInFlight = null;
function endSettingsCurrentShowdown(button){
    if(!settingsEndShowdownInFlight){
        settingsEndShowdownInFlight = runSettingsEndShowdown(button).finally(() => { settingsEndShowdownInFlight = null; });
    }
    return settingsEndShowdownInFlight;
}

async function runSettingsEndShowdown(button){
    const active = getSettingsActiveShowdown();
    if(!active){
        renderSettings();
        return false;
    }

    const name = active.name || "Daniel vs Nik";
    const confirmedSaveId = active && active.identity && active.identity.saveId ? String(active.identity.saveId) : null;
    const confirmedLocalId = active && active.id !== undefined && active.id !== null ? String(active.id) : null;
    const confirmed = await settingsAskConfirm(
        `End the "${name}" Showdown? Ends this Showdown for both players. History keeps it as Ended early. This cannot be undone.`,
        "danger"
    );
    if(confirmed !== true){ return false; }

    if(button){
        button.disabled = true;
        button.setAttribute("aria-busy", "true");
    }

    try{
        await ensureSettingsShowdownStorageAuthority();
        const runtime = window.CareerModeSaveLibraryRuntime;
        const authoritative = runtime && typeof runtime.loadActiveShowdown === "function"
            ? runtime.loadActiveShowdown()
            : null;
        if(!runtime || !authoritative || typeof runtime.clearActiveShowdown !== "function"){
            throw new Error("The current Showdown could not be verified safely.");
        }
        const authoritativeSaveId = authoritative && authoritative.identity && authoritative.identity.saveId
            ? String(authoritative.identity.saveId)
            : null;
        const authoritativeLocalId = authoritative && authoritative.id !== undefined && authoritative.id !== null
            ? String(authoritative.id)
            : null;
        if(
            (confirmedSaveId && authoritativeSaveId !== confirmedSaveId)
            || (!confirmedSaveId && confirmedLocalId !== authoritativeLocalId)
        ){
            throw new Error("The active Showdown changed after you confirmed. Nothing was ended. Review the current Showdown and confirm again.");
        }

        const released = await releaseSettingsCurrentShowdownConnection(authoritative);

        if(!runtime.clearActiveShowdown()){
            throw new Error("The Showdown was ended, but it could not be closed here. Tap END SHOWDOWN again; nothing new will be created.");
        }

        await sweepSettingsShowdownDrafts();
        finishSettingsCurrentShowdownDeletion();
        forgetSettingsEndedSession(released && released.endedRivalryId);
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice(
                `Ended the "${name}" Showdown for both players. History keeps it as Ended early.`,
                "success",
                6200
            );
        }
        return true;
    }catch(error){
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice(
                `The Showdown was not ended. ${error && error.message ? error.message : "No saved data was changed."}`,
                "error",
                10000
            );
        }
        return false;
    }finally{
        if(button && button.isConnected){
            button.disabled = false;
            button.removeAttribute("aria-busy");
        }
    }
}

/* r79 PR4 (Nik, 2026-10-17): the START REAL CAREER row and the SHOW TEST SHOWDOWNS AGAIN switch are gone from Settings.
   The first real START (the one-time checkmark on the seasons screen) writes the career start marker; old test games stay
   stored and are never shown. The ACCOUNT panel's pairing rows (Paired with ..., UNPAIR)
   are js/showdownModes.js. */

function createDataPanel(){
    const live = getSettingsLiveShowdown();
    const active = live ? live.showdown : null;
    const online = isSettingsOnlineCareer();
    const historyText = online ? getSettingsOnlineHistoryText() : settingsCompletedCountText(getSettingsLegacyHistory().length);
    const panel = createSettingsPanel(
        "CAREER DATA",
        "SHOWDOWN DATA",
        "End the current Showdown or open History & Backup. Your player and device stay set up."
    );
    panel.classList.add("settingsDataPanel");

    const info = createSettingsElement("div", "settingsInfoGrid");
    const historyRow = createSettingsInfoRow("HISTORY", historyText, "settingsHistoryCount");
    info.append(
        createSettingsInfoRow(
            "CURRENT SHOWDOWN",
            active ? `${active.name || "Unnamed Showdown"} · ${live.status}` : "None"
        ),
        historyRow
    );

    const actions = createSettingsElement("div", "settingsOfflineActions settingsDataActions");
    if(active){
        const endCurrent = createSettingsElement(
            "button",
            "menuButton dangerButton settingsDeleteCurrentShowdown",
            "END SHOWDOWN"
        );
        endCurrent.type = "button";
        endCurrent.addEventListener("click", () => void endSettingsCurrentShowdown(endCurrent));
        actions.appendChild(endCurrent);
    }

    const historyAction = createSettingsElement(
        "button",
        "menuButton settingsDataButton",
        "OPEN HISTORY & BACKUP"
    );
    historyAction.type = "button";
    historyAction.addEventListener("click", openSettingsDataManagement);
    actions.appendChild(historyAction);

    const note = createSettingsElement(
        "p",
        "settingsDataNote",
        active
            ? "END SHOWDOWN ends it for both players. History keeps it as Ended early. Your player, device, history and settings stay."
            : "No Showdown in progress. History, backup and reset are under History & Backup."
    );

    panel.append(info, actions, note);
    return panel;
}

function renderSettings(){
    ensureSettingsDialog();
    if(!settingsContent){ return; }

    const fragment = document.createDocumentFragment();
    fragment.append(
        createApplicationPanel(),
        createMotionPanel(),
        createOfflinePanel(),
        createDataPanel()
    );
    settingsContent.replaceChildren(fragment);
    window.CareerModeRulesSettingsV10?.refreshSettings();
}

function getSettingsFocusRestoreSelector(){
    const active = document.activeElement;
    if(!settingsContent || !(active instanceof HTMLElement) || !settingsContent.contains(active)){
        return "";
    }
    if(active.matches(".settingsMotionChoice")){
        return `.settingsMotionChoice[data-motion-choice="${active.dataset.motionChoice}"]`;
    }
    for(const selector of [
        ".settingsAudioToggle",
        ".settingsOfflineInstallButton",
        ".settingsOfflineUpdateButton",
        ".settingsApplicationUpdateButton",
        ".settingsDataButton"
    ]){
        if(active.matches(selector)){ return selector; }
    }
    return "";
}

function getSettingsFocusableElements(){
    if(!settingsDialog){ return []; }
    return Array.from(settingsDialog.querySelectorAll(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
    )).filter(element => !element.classList.contains("hidden") && element.tabIndex !== -1);
}

function handleSettingsKeydown(event){
    if(!settingsOverlay || settingsOverlay.classList.contains("hidden")){
        return;
    }

    if(event.key === "Escape"){
        event.preventDefault();
        closeSettings();
        return;
    }

    if(event.key !== "Tab"){
        return;
    }

    const focusable = getSettingsFocusableElements();
    if(!focusable.length){
        event.preventDefault();
        settingsDialog.focus();
        return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if(event.shiftKey && document.activeElement === first){
        event.preventDefault();
        last.focus();
    }else if(!event.shiftKey && document.activeElement === last){
        event.preventDefault();
        first.focus();
    }
}

function ensureSettingsDialog(){
    if(settingsOverlay && settingsOverlay.isConnected){
        return settingsOverlay;
    }

    const overlay = createSettingsElement("div", "settingsOverlay hidden");
    overlay.id = "settingsOverlay";
    overlay.setAttribute("aria-hidden", "true");

    const dialog = createSettingsElement("section", "settingsDialog");
    dialog.id = "settingsDialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "settingsTitle");
    dialog.tabIndex = -1;

    const header = createSettingsElement("header", "settingsHeader");
    const heading = createSettingsElement("div", "settingsHeading");
    heading.append(
        createSettingsElement("span", "settingsEyebrow", "CAREER MODE SHOWDOWN"),
        createSettingsElement("h2", "", "SETTINGS")
    );
    heading.querySelector("h2").id = "settingsTitle";

    const close = createSettingsElement("button", "settingsClose", "×");
    close.id = "settingsClose";
    close.type = "button";
    close.setAttribute("aria-label", "Close Settings");
    close.addEventListener("click", () => closeSettings());
    header.append(heading, close);

    const content = createSettingsElement("div", "settingsContent");
    content.id = "settingsContent";

    const footer = createSettingsElement("footer", "settingsFooter");
    const done = createSettingsElement("button", "menuButton", "DONE");
    done.type = "button";
    done.addEventListener("click", () => closeSettings());
    footer.appendChild(done);

    dialog.append(header, content, footer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    overlay.addEventListener("pointerdown", event => {
        if(event.target === overlay){
            closeSettings();
        }
    });
    overlay.addEventListener("keydown", handleSettingsKeydown);

    settingsOverlay = overlay;
    settingsDialog = dialog;
    settingsContent = content;
    return overlay;
}

function setSettingsBackgroundInert(inert){
    const app = document.getElementById("app");
    if(!app){ return; }
    if(inert){
        app.setAttribute("inert", "");
        app.setAttribute("aria-hidden", "true");
    }else{
        app.removeAttribute("inert");
        app.removeAttribute("aria-hidden");
    }
}

function openSettings(){
    ensureSettingsDialog();
    settingsOfflineGuidance = "";
    if(isSettingsOnlineCareer()){ refreshSettingsOnlineHistory(); }
    renderSettings();

    settingsPreviousFocus = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    settingsOverlay.classList.remove("hidden");
    settingsOverlay.setAttribute("aria-hidden", "false");
    setSettingsBackgroundInert(true);
    window.CareerModeV10Screens?.expect?.("settingsOverlay");
    window.CareerModeRulesSettingsV10?.openSettings();

    window.requestAnimationFrame(() => {
        if(settingsDialog && !settingsOverlay.classList.contains("hidden")){
            settingsDialog.focus();
        }
    });
}

function closeSettings(restoreFocus = true){
    if(!settingsOverlay){ return; }
    settingsOverlay.classList.add("hidden");
    settingsOverlay.setAttribute("aria-hidden", "true");
    setSettingsBackgroundInert(false);
    window.CareerModeRulesSettingsV10?.closeSettings();

    if(restoreFocus && settingsPreviousFocus && settingsPreviousFocus.isConnected){
        settingsPreviousFocus.focus();
    }
    settingsPreviousFocus = null;
    settingsOfflineGuidance = "";
}

function initializeSettings(){
    ensureSettingsDialog();
    window.loadRuntimeScript("rules-settings-v10", "js/rulesSettingsV10.js", () => Boolean(window.CareerModeRulesSettingsV10)).then(() => window.CareerModeRulesSettingsV10.install()).catch(() => { window.CareerModeV10Screens?.settle?.("settingsOverlay"); });

    if(!settingsPreferenceListenerBound){
        settingsPreferenceListenerBound = true;
        window.addEventListener("career-mode-preferences-change", event => {
            if(settingsOverlay && !settingsOverlay.classList.contains("hidden")){
                renderSettings();
                if(event && event.detail && event.detail.source === "user"){
                    focusSelectedSettingsMotionChoice();
                }else if(event && event.detail && event.detail.source === "menu-feedback"){
                    focusSettingsControl(".settingsAudioToggle");
                }
            }
        });
    }

    if(!settingsOfflineListenerBound){
        settingsOfflineListenerBound = true;
        window.addEventListener("career-mode-offline-state-change", () => {
            if(settingsOverlay && !settingsOverlay.classList.contains("hidden")){
                const focusSelector = getSettingsFocusRestoreSelector();
                refreshSettingsOfflinePanel();
                if(focusSelector){ focusSettingsControl(focusSelector); }
            }
        });
    }
}

window.initializeSettings = initializeSettings;
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.renderSettings = renderSettings;

```


## FILE: js/rulesSettingsV10.js
```javascript
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports={...api,createBindings:factory};
  else root.CareerModeRulesSettingsV10=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  // JOB-30: visual decoration only. Original rules, controls and modal lifecycle own all behaviour.
  const BASE="visual-assets/v10_1/",states=new Map();
  let registered=false;
  const doc=()=>root.document;
  function element(tag,cls="",text=""){const n=doc().createElement(tag);n.className=cls;if(text)n.textContent=text;return n;}
  // Mounting moves the original dialog or rule content into the stage, and moving a focused control blurs it
  // (Settings can finish loading its look after Close or a toggle already has focus); put focus back.
  function keepFocus(work){const d=doc(),active=d.activeElement;try{return work();}finally{if(active&&active!==d.body&&active.isConnected&&d.activeElement!==active&&typeof active.focus==="function")active.focus({preventScroll:true});}}
  const focusSafe=fn=>(...args)=>keepFocus(()=>fn(...args));
  // HO-004: css/rulebook.css (the old light look, loaded by js/optionalModules.js) styles the class names this look
  // uses (.ruleBookHero > span, .ruleBookActions .backButton …) and beats Team V's shared type and panel classes.
  // While the Rule Book look is mounted that sheet is switched off (its <link> stays, so the app's loader still sees it
  // loaded); unmounting switches it back on. A sheet still loading is switched off when it arrives, if still mounted.
  // css/settings.css also lays out the Settings overlay itself, so Settings keeps it and overrides per rule instead.
  const OLD_SHEETS=Object.freeze({ruleBook:"rule-book-ui"}),oldSheetOff=new Set();
  function oldSheet(name,off){
    const key=OLD_SHEETS[name],link=doc().querySelector?.(`link[data-optional-style="${key}"]`);
    if(off)oldSheetOff.add(name);else oldSheetOff.delete(name);
    if(!link)return;
    if(link.sheet){link.sheet.disabled=off;return;}
    if(off)link.addEventListener?.("load",()=>{if(link.sheet)link.sheet.disabled=oldSheetOff.has(name);},{once:true});
  }
  function image(cls,path){const n=element("img",cls);n.src=BASE+path;n.alt="";n.setAttribute("aria-hidden","true");n.decoding="async";return n;}
  function stage(id,host,content){
    const s=element("div","sd-stage v10SystemStage");s.id=id;
    const plate=element("div","sd-stage__layer sd-stage__layer--plate");plate.setAttribute("aria-hidden","true");
    const reg=element("div","sd-stage__registered");reg.append(element("div","sd-stage__plate"));plate.append(reg);
    const phone=element("picture",id==="v10RuleBookStage"?"ruleBookPhonePlate":"settingsPhonePlate");
    /* r78: phone and tablet use Team V's marble phone plates (no people), the same black-and-gold look as desktop. */
    phone.append(image("",id==="v10RuleBookStage"?"plates-v2/ENV_RULE_BOOK_PHONE_V2.webp":"plates-v2/ENV_SETTINGS_PHONE_V2.webp"));plate.append(phone);
    const atmosphere=element("div","sd-stage__layer sd-stage__layer--atmosphere");atmosphere.setAttribute("aria-hidden","true");
    /* HO-033 (owner rule HO-027, no dimming): no ruleBookScrim / settingsStageScrim is drawn over the plate any more. */
    const ui=element("div","sd-stage__layer sd-stage__layer--ui");ui.append(content);s.append(plate,atmosphere,ui);host.append(s);
    const engine=root.ShowdownStage?.mount(s,{plate:{width:1672,height:941,src1x:BASE+"shared/plates/ENV_SYS_PLATE_V1_1X.webp",src2x:BASE+"shared/plates/ENV_SYS_PLATE_V1_2X.webp"},focal:{x:836,y:470.5}});
    return {stage:s,engine};
  }
  // JOB-1707: adopted phone study 1429. Wrap the original nodes only on upright
  // phones; widen/rotate and unmount restore the exact articles and heading nodes.
  // Disclosures are presentation state only; every rule and scoring value stays live.
  function ruleBookDisclosures(content){
    const media=root.matchMedia?.("(max-width: 699px) and (orientation: portrait)");
    if(!media)return ()=>{};
    const rows=Array.from(content.querySelectorAll(".ruleSection")).map(card=>({
      card,children:Array.from(card.childNodes||card.children),head:card.querySelector(".ruleSectionHeader")
    }));
    let mounted=false,selected=0;
    function restore(){
      if(!mounted)return;
      const focused=rows.some(row=>row.summary===doc().activeElement);
      for(const row of rows){
        row.details.removeEventListener("toggle",row.onToggle);
        row.head.append(...Array.from(row.summary.childNodes));
        row.card.replaceChildren(...row.children);
        row.details=null;row.summary=null;
      }
      mounted=false;
      if(focused)content.querySelector("#ruleBookBack")?.focus({preventScroll:true});
    }
    function sync(){
      if(!media.matches){restore();return;}
      if(mounted)return;
      mounted=true;
      rows.forEach((row,index)=>{
        const details=element("details","ruleBookDisclosure");
        const summary=element("summary","ruleSectionHeader ruleBookDisclosureHeader");
        summary.append(...Array.from(row.head.childNodes));
        details.append(summary,...row.children.filter(node=>node!==row.head));
        row.card.replaceChildren(details);
        row.details=details;row.summary=summary;
        // Native exclusive details plus a fallback for engines without details.name.
        details.setAttribute("name","cm17-rule-book");
        details.open=index===selected;
        row.onToggle=()=>{
          if(!mounted||!media.matches||!details.open)return;
          selected=index;
          rows.forEach(other=>{if(other!==row)other.details.open=false;});
        };
        details.addEventListener("toggle",row.onToggle);
      });
    }
    sync();
    if(media.addEventListener)media.addEventListener("change",sync);
    else media.addListener?.(sync);
    return ()=>{
      if(media.removeEventListener)media.removeEventListener("change",sync);
      else media.removeListener?.(sync);
      restore();
    };
  }
  // JOB-1731: adopted sideways study 1731. On short landscape phones the six numbered rule cards are shown one at a
  // time under six section tabs. Presentation state only: every article, rule line and score stays in the DOM in live
  // order (a hidden card is only display:none), and leaving the sideways size restores the exact original page.
  function ruleBookTabs(content){
    const media=root.matchMedia?.("(max-width: 900px) and (max-height: 500px) and (orientation: landscape)");
    if(!media)return ()=>{};
    const cards=Array.from(content.querySelectorAll(".ruleSection")),grid=content.querySelector("#ruleBookSections");
    if(!grid||!cards.length)return ()=>{};
    let bar=null,selected=0;
    function showTab(index){
      selected=index;
      cards.forEach((card,i)=>{card.dataset.ruleTab=i===index?"on":"off";});
    }
    function restoreTabs(){
      if(!bar)return;
      const focused=bar.contains(doc().activeElement);
      bar.remove();bar=null;
      cards.forEach(card=>{delete card.dataset.ruleTab;});
      if(focused)content.querySelector("#ruleBookBack")?.focus({preventScroll:true});
    }
    function syncTabs(){
      if(!media.matches){restoreTabs();return;}
      if(bar)return;
      bar=element("div","ruleBookTabs");
      bar.setAttribute("role","radiogroup");bar.setAttribute("aria-label","Rule book sections");
      cards.forEach((card,index)=>{
        const label=element("label","ruleBookTab"),input=doc().createElement("input");
        input.type="radio";input.name="ruleBookSection";input.value=String(index);input.checked=index===selected;
        input.addEventListener("change",()=>{if(input.checked)showTab(index);});
        label.append(input,element("i","",card.querySelector(".ruleSectionNumber")?.textContent||String(index+1)),
          element("b","",card.querySelector("h3")?.textContent||""));
        bar.append(label);
      });
      grid.before(bar);
      showTab(selected);
    }
    syncTabs();
    if(media.addEventListener)media.addEventListener("change",syncTabs);
    else media.addListener?.(syncTabs);
    return ()=>{
      if(media.removeEventListener)media.removeEventListener("change",syncTabs);
      else media.removeListener?.(syncTabs);
      restoreTabs();
    };
  }
  function mountRuleBook(frame,host){
    try{root.renderRuleBookSpecialPlayers?.();}catch(_){}
    if(states.has(host))return;
    const original=Array.from(host.children),content=element("div","ruleBookV10Content");
    original.forEach(n=>content.append(n));host.classList.add("v10RuleBook");
    const hero=content.querySelector('.ruleBookHero');hero.dataset.sdEnter="title";
    hero.insertBefore(image("ruleBookWordmark","shared/wordmarks/TITLE_RULE_BOOK_V1.webp"),hero.querySelector("strong"));
    content.querySelector('h2').classList.add('sd-visually-hidden');
    hero.querySelector('span').classList.add('sd-eyebrow');hero.querySelector('strong').classList.add('sd-tagline');hero.querySelector('p').classList.add('sd-body','ruleBookSummary');
    const grid=content.querySelector('.ruleBookGrid');grid.id='ruleBookSections';grid.setAttribute('aria-label','Competition rules');
    content.querySelectorAll('.ruleSection').forEach(card=>{
      card.classList.add('sd-panel');card.dataset.sdEnter='panel';
      const head=card.querySelector('.ruleSectionHeader');head.querySelector('span').classList.add('ruleSectionNumber');
      if(card.classList.contains('scoringRuleSection')){card.classList.add('sd-panel--hero');Array.from(card.querySelector('.ruleScoreTable').children).forEach(row=>row.classList.add('ruleScoreRow'));}
    });
    content.querySelector('.backButton').id='ruleBookBack';
    content.querySelector('.backButton').classList.add('sd-btn','sd-btn--secondary');
    content.querySelector('.backButton').dataset.sdEnter='button';
    const disposeDisclosures=ruleBookDisclosures(content),disposeTabs=ruleBookTabs(content);
    states.set(host,{...stage('v10RuleBookStage',host,content),original,content,disposeDisclosures,disposeTabs});
    oldSheet('ruleBook',true);
    root.sdEnter?.(content);
  }
  function unmountRuleBook(host){
    const state=states.get(host);if(!state)return;
    state.disposeTabs?.();
    state.disposeDisclosures?.();
    state.engine?.destroy();state.content.querySelector('.ruleBookWordmark')?.remove();
    host.replaceChildren(...state.original);host.classList.remove('v10RuleBook');states.delete(host);oldSheet('ruleBook',false);
  }
  function credit(panel){
    if(panel.querySelector('#photoCredit'))return;
    const p=element('p');p.id='photoCredit';p.append(element('span','','Marco Reus photo: '));
    const author=element('a','','Tim Reckmann');author.href='https://www.flickr.com/photos/foto_db/16204330530/';
    const license=element('a','','CC BY 2.0');license.href='https://creativecommons.org/licenses/by/2.0/';
    p.append(author,element('span','',' · '),license,element('span','',' · Cropped for display'));panel.append(p);
  }
  function refreshSettings(){
    const host=doc().getElementById('settingsOverlay');if(!host||!states.has(host))return;
    const content=doc().getElementById('settingsContent');
    for(const panel of content.querySelectorAll('.settingsPanel')){
      const title=panel.querySelector('h3')?.textContent;
      const name=title==='CAREER MODE SHOWDOWN'?'application':title==='MOTION & FEEDBACK'?'motion':title==='SHOWDOWN DATA'?'data':null;
      if(name){panel.classList.add('sd-panel','settingsPanel--'+name);panel.dataset.sdEnter='panel';if(name==='application')credit(panel);}
    }
    // HO-004: the product's own Settings buttons take Team V's shared button look (renderSettings rebuilds the
    // panel buttons, so this runs on every refresh). Nodes, text and listeners are the product's.
    buttons(host).forEach(([button,kind])=>button.classList.add('sd-btn','sd-btn--'+kind));
  }
  function buttons(host){
    const list=[];
    host.querySelectorAll('.settingsDataButton').forEach(button=>list.push([button,'secondary']));
    const done=host.querySelector('.settingsFooter')?.querySelector('.menuButton');if(done)list.push([done,'primary']);
    return list;
  }
  // JOB-1708: keep the original content element (settings.js and the identity
  // observer retain it) inside a single main scroller on touch widths only.
  // Restoring the original node on wide windows/unmount leaves desktop intact.
  function settingsTouchScroller(dialog){
    const media=root.matchMedia?.("(max-width: 1199px)");
    const content=dialog.querySelector("#settingsContent");
    if(!media||!content)return ()=>{};
    let main=null;
    function restoreSettingsContent(){
      if(!main)return;
      main.replaceWith(content);main=null;
    }
    const sync=focusSafe(()=>{
      if(!media.matches){restoreSettingsContent();return;}
      if(main)return;
      main=element("main","settingsTouchMain");
      content.before(main);main.append(content);
    });
    sync();
    if(media.addEventListener)media.addEventListener("change",sync);
    else media.addListener?.(sync);
    return ()=>{
      if(media.removeEventListener)media.removeEventListener("change",sync);
      else media.removeListener?.(sync);
      restoreSettingsContent();
    };
  }
  function mountSettings(frame,host){
    if(states.has(host)){refreshSettings();return;}
    const dialog=doc().getElementById('settingsDialog');host.classList.add('v10Settings');
    const heading=dialog.querySelector('.settingsHeading');heading.classList.add('settingsTitleBlock');
    const wrap=element('span','settingsWordmarkWrap');wrap.dataset.sdEnter='title';wrap.append(image('settingsWordmark','shared/wordmarks/TITLE_SETTINGS_V1.webp'));heading.append(wrap);
    // Team V's Settings frame: shared eyebrow type and the "TWO MANAGERS. ONE LEGACY." line under the wordmark.
    heading.querySelector('.settingsEyebrow')?.classList.add('sd-eyebrow');heading.append(element('p','sd-kicker settingsTagline','TWO MANAGERS. ONE LEGACY.'));
    doc().getElementById('settingsTitle').classList.add('settingsVisuallyHidden');
    states.set(host,{...stage('v10SettingsStage',host,dialog),dialog,disposeTouch:settingsTouchScroller(dialog)});refreshSettings();root.sdEnter?.(dialog);
  }
  function unmountSettings(host){
    const state=states.get(host);if(!state)return;
    state.disposeTouch?.();
    state.engine?.destroy();host.append(state.dialog);state.stage.remove();
    state.dialog.querySelector('.settingsWordmarkWrap')?.remove();state.dialog.querySelector('.settingsTagline')?.remove();
    state.dialog.querySelector('.settingsEyebrow')?.classList.remove('sd-eyebrow');
    buttons(state.dialog).forEach(([button])=>button.classList.remove('sd-btn','sd-btn--secondary','sd-btn--primary'));
    host.classList.remove('v10Settings');states.delete(host);
  }
  function register(){
    if(registered||!root.CareerModeV10Screens)return;
    registered=true;
    const loader=root.CareerModeV10Screens.install();
    // r86: the Special Player draw loads with the Rule Book's files, so its rule line shows this Showdown's chips in the first frame.
    const chip=()=>Promise.resolve().then(()=>root.loadRuntimeScript('special-player-chip','js/specialPlayerChip.js',()=>Boolean(root.CareerModeSpecialPlayerChip))).then(()=>root.CareerModeSpecialPlayerChip.ensure()).catch(()=>false);
    loader.register('ruleBook',{css:['rule-book/rule-book.css'],prepare:()=>Promise.all([root.loadRuntimeStyle('rules-settings-v10','css/rulesSettingsV10.css'),chip()]),frame:()=>true,mount:focusSafe(mountRuleBook),unmount:focusSafe(unmountRuleBook)});
    loader.register('settingsOverlay',{css:['settings/settings.css'],prepare:()=>root.loadRuntimeStyle('rules-settings-v10','css/rulesSettingsV10.css'),overlay:true,auto:false,frame:()=>true,mount:focusSafe(mountSettings),unmount:focusSafe(unmountSettings)});
  }
  async function rsInstall(){
    await root.loadRuntimeScript('v10-screens','js/v10Screens.js',()=>Boolean(root.CareerModeV10Screens));register();
    if(root.getActiveScreenName?.()==='ruleBook')await root.CareerModeV10Screens.show('ruleBook');
    const overlay=doc().getElementById('settingsOverlay');if(overlay&&!overlay.classList.contains('hidden'))await root.CareerModeV10Screens.show('settingsOverlay');
  }
  function rsOpenSettings(){if(registered)void root.CareerModeV10Screens.show('settingsOverlay').catch(()=>{});}
  function rsCloseSettings(){root.CareerModeV10Screens?.hide('settingsOverlay');}
  return Object.freeze({install:rsInstall,register,openSettings:rsOpenSettings,closeSettings:rsCloseSettings,refreshSettings,mountRuleBook:focusSafe(mountRuleBook),unmountRuleBook:focusSafe(unmountRuleBook),mountSettings:focusSafe(mountSettings),unmountSettings:focusSafe(unmountSettings)});
});

```


## FILE: js/ruleBook.js
```javascript
/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.12.0
   Rule Book — Lazy UI Construction
===================================================== */

function createRuleBookScreen(){
    if(document.getElementById("ruleBook")){
        return;
    }

    const main = document.querySelector("main");
    if(!main){
        return;
    }

    const section = document.createElement("section");
    section.id = "ruleBook";
    section.className = "screen hidden ruleBookScreen";

    const heading = document.createElement("h2");
    heading.textContent = "RULE BOOK";

    const intro = document.createElement("div");
    intro.className = "ruleBookHero";
    intro.innerHTML = `
        <span>CAREER MODE SHOWDOWN</span>
        <strong>THE RULES</strong>
        <p>Daniel and Nik. One league. Fixed clubs. One Showdown.</p>
    `;

    const grid = document.createElement("div");
    grid.className = "ruleBookGrid";

    grid.append(
        createRuleSection("01", "SHOWDOWN FORMAT", [
            "Career Mode Showdown is a two-player game for Daniel and Nik.",
            "Daniel is Player One. Nik is Player Two.",
            "You both play in the same league, and each of you keeps one club for the whole Showdown.",
            "A Showdown is 1, 3, 5 or 10 seasons.",
            "Most Showdown points across all seasons wins. Equal totals are a draw."
        ]),
        createRuleSection("02", "MATCH PLAY", [
            "Simulate every match.",
            "You may play or simulate a Champions League or Europa League final.",
            "You may play or simulate the main domestic cup final.",
            "Skip pre-season in FIFA 17.",
            "1- and 3-season Showdowns: only your Special Player can be trained.",
            "5- and 10-season Showdowns: all players can be trained."
        ]),
        createRuleSection("03", "TRANSFER CHALLENGE", [
            "Each of you may sign up to three players a season.",
            "The transfer window lasts 15 minutes.",
            "In FIFA 17, you can sign players up to the transfer deadline.",
            "Both managers can agree to end the transfer window early. One manager cannot end it alone.",
            "Your opponent gets three guesses. Each guess is a league or a nationality.",
            "If a guess matches one of your signings, release that player before the season starts.",
            "Type each signing's FIFA 17 overall. Only you see it, and it is never part of a guess.",
            "Your Special Player is a free extra signing: he never counts toward the three, and guesses never release him.",
            // r87 Russian Roster Roulette (Nik 2026-10-30: "in rule screen mention special player wont get hit").
            "Before each transfer window, Daniel and then Nik spin the Roster Roulette. One spin in seven fires and hits one player on your starting XI or 4 best subs: release him in FIFA 17.",
            "Your Special Player is never on your board, so he is never hit. Every player on your board has the same chance.",
            "Your board builds itself: your FIFA 17 launch squad. From season 2, a lost player is replaced by a kept signing or the bench, with reserves filling in, so your board shows 11 starters and 4 subs. Only if your club runs out of players does a place stay empty: the roulette still spins, and the bullet only ever hits a real player."
        ]),
        createScoringRuleSection(),
        createRuleSection("05", "CONNECTION & RECOVERY", [
            "Connect once before your first Showdown. After that, the same account and browser stay connected.",
            "A new browser may need to connect again.",
            "The browser keeps a backup copy for recovery. You can't play from it.",
            "Type in results by hand from FIFA 17. No screenshots or notes needed."
        ]),
        createSpecialPlayerRuleSection()
    );

    const actions = document.createElement("div");
    actions.className = "ruleBookActions";

    const back = document.createElement("button");
    back.type = "button";
    back.className = "backButton";
    back.setAttribute("data-smart-back", "");
    back.textContent = "BACK TO HOME";

    actions.appendChild(back);
    section.append(heading, intro, grid, actions);
    main.appendChild(section);
}

function createRuleSection(number, title, rules){
    const article = document.createElement("article");
    article.className = "ruleSection";

    const header = document.createElement("div");
    header.className = "ruleSectionHeader";

    const numberElement = document.createElement("span");
    numberElement.textContent = number;

    const heading = document.createElement("h3");
    heading.textContent = title;

    header.append(numberElement, heading);

    const list = document.createElement("ul");
    const fragment = document.createDocumentFragment();
    rules.forEach(rule => {
        const item = document.createElement("li");
        item.textContent = rule;
        fragment.appendChild(item);
    });
    list.appendChild(fragment);

    article.append(header, list);
    return article;
}

function createScoringRuleSection(){
    const article = document.createElement("article");
    article.className = "ruleSection scoringRuleSection";

    const header = document.createElement("div");
    header.className = "ruleSectionHeader";

    const number = document.createElement("span");
    number.textContent = "04";

    const heading = document.createElement("h3");
    heading.textContent = "SCORING";

    header.append(number, heading);

    const scoring = document.createElement("div");
    scoring.className = "ruleScoreTable";
    const fragment = document.createDocumentFragment();

    [
        ["Champions League winner", "+5"],
        ["Europa League winner", "+3"],
        ["Domestic league winner", "+3"],
        ["Main domestic cup winner", "+1"],
        ["100 league points or 100 league goals", "+1 MAX"],
        ["League top scorer or top assist", "+1 MAX"]
    ].forEach(([label, value]) => {
        const row = document.createElement("div");
        const labelElement = document.createElement("span");
        const valueElement = document.createElement("strong");
        labelElement.textContent = label;
        valueElement.textContent = value;
        row.append(labelElement, valueElement);
        fragment.appendChild(row);
    });
    scoring.appendChild(fragment);

    const maximum = document.createElement("div");
    maximum.className = "ruleScoreMaximum";
    maximum.innerHTML = "<span>MAXIMUM PER MANAGER / SEASON</span><strong>11</strong>";

    // r80 Europa League (owner rules, 2026-10-19). r86 (Nik 2026-10-29): the lines FIFA 17 already enforces (no CL and EL
    // in one season, the 3rd-place drop, EL by league position, only winning scores, best season 11/9) stay in the scoring
    // engine but are no longer printed; only the season 1 setup note is shown.
    const notes = document.createElement("ul");
    notes.className = "ruleScoreNotes";
    [
        "Season 1: both clubs play in the Champions League. Set this up in FIFA by redrawing the Champions League groups twice."
    ].forEach(rule => {
        const item = document.createElement("li");
        item.textContent = rule;
        notes.appendChild(item);
    });

    // r84 Golden Showdown: its own gold line under the season maximum (Nik 2026-10-26).
    const golden = document.createElement("p");
    golden.className = "ruleGoldenShowdown";
    const goldenLabel = document.createElement("strong");
    goldenLabel.textContent = "GOLDEN SHOWDOWN";
    const goldenText = document.createElement("span");
    goldenText.textContent = "Score 110 points in a 10-season Showdown (11 in every season) to win the gold trophy.";
    golden.append(goldenLabel, goldenText);

    // r86 Special Player (Nik 2026-10-29): the SP chip's own rule line, in the Golden Showdown's style. The live Showdown's
    // two chips are filled in when the Rule Book opens (renderRuleBookSpecialPlayers); none before r86.
    const special = document.createElement("p");
    special.className = "ruleGoldenShowdown ruleSpecialPlayer";
    const specialLabel = document.createElement("strong");
    const specialTag = document.createElement("span");
    specialTag.className = "ruleSpecialPlayerTag";
    specialTag.textContent = "SP";
    const specialName = document.createElement("span");
    specialName.textContent = " SPECIAL PLAYER";
    specialLabel.append(specialTag, specialName);
    const specialText = document.createElement("span");
    specialText.textContent = "Each manager draws one FIFA 17 player at the start of every Showdown. Your Special Player scores no points. Full rules in card 06.";
    const specialLive = document.createElement("span");
    specialLive.className = "ruleSpecialPlayerLive spChipPair";
    specialLive.hidden = true;
    special.append(specialLabel, specialText, specialLive);

    article.append(header, scoring, maximum, golden, special, notes);
    return article;
}

// r86 Special Player rules (Nik 2026-10-29 15:24 UTC): the full card, last, with the training rule by length.
// The draws card is gone (Nik 2026-10-29 21:10 UTC): the no-tiebreak rules stay in scoring.js, not on the page.
function createSpecialPlayerRuleSection(){
    const article = createRuleSection("06", "SPECIAL PLAYER", [
        "At the start of every Showdown, after Club Assignment, each manager draws one Special Player.",
        "The draw picks from the top 300 FIFA 17 players by potential. You and your rival never draw the same player.",
        "Both draws are shown on the reveal screen, and each Special Player stays with his manager for the whole Showdown.",
        "Career Start shows each Special Player's FIFA 17 club, so you can sign yours in-game.",
        "Your Special Player is a free extra signing. He doesn't count toward your three signings, and your rival's guesses can never release him.",
        "1- and 3-season Showdowns: your Special Player is the only player you can train.",
        "5- and 10-season Showdowns: all players can be trained.",
        "Your Special Player scores no Showdown points. His SP chip sits next to your name on the career screens."
    ]);
    article.className = "ruleSection specialPlayerRuleSection";
    return article;
}

// This Showdown's Special Players next to each manager's name (only for a Showdown confirmed on r86 or later).
function renderRuleBookSpecialPlayers(){
    const book = document.getElementById("ruleBook");
    const slot = book && typeof book.querySelector === "function" ? book.querySelector(".ruleSpecialPlayerLive") : null;
    if(!slot){ return false; }
    const api = window.CareerModeSpecialPlayerChip;
    let sp = null;
    try{ sp = api && typeof api.live === "function" ? api.live() : null; }catch(_error){ sp = null; }
    slot.replaceChildren();
    const chips = sp ? [["Daniel", api.element(document, sp.daniel)], ["Nik", api.element(document, sp.nik)]].filter(([, chip]) => chip) : [];
    if(chips.length !== 2){ slot.hidden = true; return false; }
    for(const [name, chip] of chips){
        const who = document.createElement("span");
        who.append(document.createTextNode(name), chip);
        slot.appendChild(who);
    }
    slot.hidden = false;
    return true;
}

function openRuleBook(){
    createRuleBookScreen();
    renderRuleBookSpecialPlayers();
    showScreen("ruleBook");
    window.CareerModeV10Screens?.expect?.("ruleBook");
    window.loadRuntimeScript("rules-settings-v10", "js/rulesSettingsV10.js", () => Boolean(window.CareerModeRulesSettingsV10)).then(() => window.CareerModeRulesSettingsV10.install()).catch(() => { window.CareerModeV10Screens?.settle?.("ruleBook"); });
}

window.openRuleBook = openRuleBook;
```


## FILE: js/musicDockV10.js
```javascript
// r85 (Nik 2026-10-27): the soundtrack player outside Home's own strip.
// - Desktop: a compact dock in the top bar, after the tabs, on every screen (Home too: its strip is hidden on desktop).
// - Phone and tablet (900px and under): a sixth MUSIC tab in the tab bar, and Home's TRACKS button, open the player sheet.
// - Both open one player panel: now playing, progress, previous / play / next / mute, and a one-column tracklist with
//   every title and artist written in full, scrolling inside itself. It is opaque and never dims the screen behind it.
// It drives Home's one <audio> through window.HomeSoundtrack, so a song keeps playing across screens. Nothing here touches
// Firestore; Audius is only asked for a song after a Play tap. Looks: css/v10Shell.css (.cmsMusicDock, .cmsMusicSheet, .cmsMusicTab).
(function(root){
  "use strict";
  if(!root||root.CareerModeMusicDockV10)return;
  const PHONE_MAX=900;
  let dock=null,sheet=null,watching=null,started=false;
  const player=()=>root.HomeSoundtrack;
  const setText=(el,v)=>{if(el&&el.textContent!==String(v))el.textContent=String(v);};
  const isAudio=event=>Boolean(event.target&&event.target.classList&&event.target.classList.contains("menuAudiusAudio"));
  const mdAudio=()=>root.document.querySelector("audio.menuAudiusAudio");
  const mdClock=sec=>{if(!Number.isFinite(sec)||sec<0)return"-:--";const m=Math.floor(sec/60),s=Math.floor(sec%60);return`${m}:${String(s).padStart(2,"0")}`;};
  const ICON={
    prev:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h2v14H6zM20 5v14L9.5 12z"/></svg>',
    next:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5h2v14h-2zM4 5v14l10.5-7z"/></svg>',
    play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15L19.5 12z"/></svg>',
    pause:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z"/></svg>',
    sound:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    muted:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    list:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h11v2H4zM4 11h11v2H4zM4 16h7v2H4zM17 6h3v8.2a3 3 0 1 1-2-2.8V8h-1z"/></svg>',
    close:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    disc:'<svg class="cmsMusicTabDisc" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#0a0b0e" stroke-opacity=".55" stroke-width=".8"/><circle cx="12" cy="12" r="3.4" fill="#0a0b0e"/><circle cx="12" cy="12" r="1.2"/></svg>'
  };
  const swapIcon=(btn,key)=>{if(btn.dataset.icon!==key){btn.dataset.icon=key;btn.innerHTML=ICON[key];}};

  // A tapped song starts playing (the tap is the play gesture the browser asks for).
  function mdPick(key){
    const api=player();
    api.choose(key);
    if(!api.state().wantPlaying)api.toggle();
  }
  function mdStep(dir){
    const api=player(),all=api.tracks(),i=all.findIndex(t=>t.key===api.current().key);
    mdPick(all[(i+dir+all.length)%all.length].key);
  }

  function mdRender(){
    const api=player(),t=api&&api.current&&api.current();
    if(!t)return;
    const s=api.state(),failed=Boolean(s.failed),playing=Boolean(s.playing&&s.wantPlaying);
    const artist=failed?"STREAM UNAVAILABLE · PICK ANOTHER":t.artist;
    if(dock){
      setText(dock.title,t.title);setText(dock.artist,artist);
      swapIcon(dock.toggle,s.wantPlaying?"pause":"play");
      dock.toggle.setAttribute("aria-label",(s.wantPlaying?"Pause ":"Play ")+t.title);dock.toggle.setAttribute("aria-pressed",String(Boolean(s.wantPlaying)));
      // Mute waits for the first Play, as on Home (there is no sound to mute before it).
      dock.mute.disabled=!s.src;swapIcon(dock.mute,s.muted?"muted":"sound");
      dock.mute.setAttribute("aria-label",s.muted?"Unmute":"Mute");dock.mute.setAttribute("aria-pressed",String(Boolean(s.muted)));
      dock.open.setAttribute("aria-expanded",String(Boolean(sheet&&!sheet.root.hidden)));
      dock.root.dataset.playing=String(playing);dock.root.dataset.failed=String(failed);
    }
    if(sheet){
      setText(sheet.title,t.title);setText(sheet.artist,artist);
      swapIcon(sheet.play,s.wantPlaying?"pause":"play");
      sheet.play.setAttribute("aria-label",(s.wantPlaying?"Pause ":"Play ")+t.title);
      sheet.mute.disabled=!s.src;swapIcon(sheet.mute,s.muted?"muted":"sound");
      sheet.mute.setAttribute("aria-label",s.muted?"Unmute":"Mute");sheet.mute.setAttribute("aria-pressed",String(Boolean(s.muted)));
      sheet.root.dataset.playing=String(playing);sheet.root.dataset.failed=String(failed);
      // The current song: aria-current plus a visible "now playing" icon (css), never colour alone. It is also the row
      // that Tab enters the list on (roving tabindex), unless the listener has already moved within the list.
      const inList=sheet.list.contains(root.document.activeElement);
      sheet.songs.forEach(b=>{
        const on=b.dataset.soundtrackTrack===t.key;b.classList.toggle("selected",on);
        if(on)b.setAttribute("aria-current","true");else b.removeAttribute("aria-current");
        if(!inList)b.tabIndex=on?0:-1;
      });
      mdTime();
    }
    const tab=root.document.getElementById("cmsMusicTab");
    if(tab){tab.dataset.playing=String(playing);tab.setAttribute("aria-expanded",String(Boolean(sheet&&!sheet.root.hidden&&sheet.root.dataset.mode==="phone")));}
    // A longer title or artist widens the dock, so the fit beside the account chips is worked out again (Codex, PR #1010).
    mdFitTop();
  }

  function mdTime(){
    if(!sheet||sheet.root.hidden)return;
    const a=mdAudio(),cur=a?a.currentTime:0,dur=a?a.duration:NaN;
    sheet.bar.style.transform=`scaleX(${Number.isFinite(dur)&&dur>0?Math.min(1,cur/dur):0})`;
    setText(sheet.times[0],mdClock(cur||0));setText(sheet.times[1],mdClock(dur));
  }

  // ---- the player panel (phone sheet, desktop drop-down) ----
  function mdSheetBuild(){
    const doc=root.document,tracks=player().tracks(),el=doc.createElement("div");
    el.id="cmsMusicSheet";el.className="cmsMusicSheet";el.setAttribute("role","dialog");el.setAttribute("aria-label","Soundtrack player");el.hidden=true;
    el.innerHTML='<div class="cmsMusicSheetNow"><span class="cmsMusicSheetDisc" aria-hidden="true"><i></i></span>'+
      '<div class="cmsMusicSheetText"><span>NOW PLAYING</span><strong></strong><small></small></div>'+
      `<button class="cmsMusicSheetClose" type="button" aria-label="Close soundtrack player">${ICON.close}</button></div>`+
      '<div class="cmsMusicSheetTime"><span class="cmsMusicSheetBar" aria-hidden="true"><i></i></span><small>0:00</small><small>-:--</small></div>'+
      '<div class="cmsMusicSheetControls">'+
      '<button class="cmsMusicSheetMute" type="button" aria-label="Mute" disabled></button>'+
      `<button class="cmsMusicSheetPrev" type="button" aria-label="Previous song">${ICON.prev}</button>`+
      '<button class="cmsMusicSheetPlay" type="button" aria-label="Play"></button>'+
      `<button class="cmsMusicSheetNext" type="button" aria-label="Next song">${ICON.next}</button>`+
      '<span class="cmsMusicSheetEq" aria-hidden="true"><i></i><i></i><i></i><i></i></span></div>'+
      `<div class="cmsMusicSheetHead" aria-hidden="true"><strong>TRACKLIST</strong><small>${tracks.length} SONGS</small></div>`+
      `<ul class="cmsMusicSheetList" role="list" aria-label="Tracklist, ${tracks.length} songs. Choose a song to play it"></ul>`;
    const list=el.querySelector(".cmsMusicSheetList");
    tracks.forEach((t,i)=>{
      const li=doc.createElement("li"),b=doc.createElement("button");
      b.type="button";b.className="cmsMusicSheetSong";b.dataset.soundtrackTrack=t.key;b.tabIndex=-1;
      b.innerHTML='<em aria-hidden="true"></em><span><strong></strong><small></small></span><i class="cmsMusicSheetSongEq" aria-hidden="true"><b></b><b></b><b></b></i>';
      b.querySelector("em").textContent=String(i+1).padStart(2,"0");
      b.querySelector("strong").textContent=t.title;
      b.querySelector("small").textContent=t.artist;
      li.appendChild(b);list.appendChild(li);
    });
    // A clear layer that closes the panel on an outside tap. It has no colour: the screen behind is never dimmed.
    const shield=doc.createElement("div");shield.className="cmsMusicSheetShield";shield.hidden=true;shield.setAttribute("aria-hidden","true");
    doc.body.append(shield,el);
    const q=c=>el.querySelector(c);
    sheet={root:el,shield,list,title:q(".cmsMusicSheetText strong"),artist:q(".cmsMusicSheetText small"),play:q(".cmsMusicSheetPlay"),mute:q(".cmsMusicSheetMute"),
      bar:q(".cmsMusicSheetBar i"),times:el.querySelectorAll(".cmsMusicSheetTime small"),songs:Array.from(list.querySelectorAll(".cmsMusicSheetSong")),close:q(".cmsMusicSheetClose"),opener:null};
    sheet.play.addEventListener("click",()=>player().toggle());
    sheet.mute.addEventListener("click",()=>player().mute());
    q(".cmsMusicSheetPrev").addEventListener("click",()=>mdStep(-1));
    q(".cmsMusicSheetNext").addEventListener("click",()=>mdStep(1));
    sheet.close.addEventListener("click",()=>mdSheetClose());
    shield.addEventListener("click",()=>mdSheetClose());
    list.addEventListener("click",event=>{
      const b=event.target instanceof root.Element?event.target.closest("[data-soundtrack-track]"):null;
      if(b)mdPick(b.dataset.soundtrackTrack);
    });
    // Keyboard: Tab enters the list once (on the current song), the arrow keys, Home and End move between songs, and
    // Enter or Space plays the focused one (it is a real button).
    list.addEventListener("focusin",event=>{
      const b=event.target;
      if(sheet.songs.includes(b))sheet.songs.forEach(x=>{x.tabIndex=x===b?0:-1;});
    });
    list.addEventListener("keydown",event=>{
      const i=sheet.songs.indexOf(event.target);
      if(i<0||event.altKey||event.ctrlKey||event.metaKey)return;
      const last=sheet.songs.length-1;
      const to={ArrowDown:Math.min(last,i+1),ArrowUp:Math.max(0,i-1),Home:0,End:last,PageDown:Math.min(last,i+5),PageUp:Math.max(0,i-5)}[event.key];
      if(to===undefined)return;
      event.preventDefault();
      sheet.songs[to].focus();
    });
    return sheet;
  }

  // Phone: the sheet ends just above the tab bar, so the tabs stay usable. Desktop: it drops from the dock, under the top bar.
  function mdSheetPlace(){
    if(!sheet)return;
    const r=sheet.root.style,doc=root.document;
    if(root.innerWidth>PHONE_MAX){
      const bar=doc.querySelector(".sd-nav-top"),bb=bar&&bar.getBoundingClientRect(),db=dock&&dock.root.getBoundingClientRect();
      const top=Math.round((bb&&bb.height?bb.bottom:56)+8),width=Math.min(420,root.innerWidth-24);
      const left=Math.round(Math.max(12,Math.min(db&&db.width?db.left:root.innerWidth-width-12,root.innerWidth-width-12)));
      sheet.root.dataset.mode="desktop";r.setProperty("--cms-sheet-top",`${top}px`);r.setProperty("--cms-sheet-left",`${left}px`);r.setProperty("--cms-sheet-width",`${width}px`);
      sheet.shield.style.setProperty("--cms-sheet-bottom","0px");
      return;
    }
    const nav=doc.querySelector(".sd-nav-bottom"),box=nav&&nav.getBoundingClientRect();
    const bottom=box&&box.height>2&&box.top<root.innerHeight?Math.round(Math.max(0,root.innerHeight-box.top)):0;
    sheet.root.dataset.mode="phone";r.setProperty("--cms-sheet-bottom",`${bottom}px`);
    sheet.shield.style.setProperty("--cms-sheet-bottom",`${bottom}px`);
  }

  function mdSheetOpen(opener){
    if(!sheet&&!mdSheetBuild())return;
    sheet.opener=opener||null;
    mdSheetPlace();
    sheet.shield.hidden=false;sheet.root.hidden=false;
    mdRender();
    // The current song is scrolled to the middle of the list (instantly, so reduced motion is respected).
    const on=sheet.list.querySelector('[aria-current="true"]');
    if(on)sheet.list.scrollTop=Math.max(0,on.offsetTop-sheet.list.clientHeight/2+on.offsetHeight/2);
    root.requestAnimationFrame(()=>{if(sheet&&!sheet.root.hidden)sheet.root.dataset.open="true";});
    sheet.close.focus({preventScroll:true});
  }

  function mdSheetClose(){
    if(!sheet||sheet.root.hidden)return;
    sheet.root.hidden=true;sheet.shield.hidden=true;delete sheet.root.dataset.open;
    const back=sheet.opener;sheet.opener=null;
    if(back&&back.isConnected&&back.focus)back.focus({preventScroll:true});
    mdRender();
  }
  const mdSheetToggle=opener=>{if(sheet&&!sheet.root.hidden)mdSheetClose();else mdSheetOpen(opener);};

  // ---- desktop dock ----
  function mdBuildDock(host,before){
    const doc=root.document,el=doc.createElement("div");
    el.id="cmsMusicDockTop";el.className="cmsMusicDock";el.setAttribute("role","group");el.setAttribute("aria-label","Soundtrack");
    el.innerHTML='<span class="cmsMusicDockDisc" aria-hidden="true"></span><span class="cmsMusicDockText"><strong></strong><small></small></span>'+
      '<button class="cmsMusicDockPlay" type="button" aria-label="Play"></button>'+
      '<button class="cmsMusicDockMute" type="button" aria-label="Mute" disabled></button>'+
      `<button class="cmsMusicDockOpen" type="button" aria-expanded="false" aria-controls="cmsMusicSheet">${ICON.list}<span>TRACKS</span></button>`;
    host.insertBefore(el,before||null);
    dock={root:el,title:el.querySelector(".cmsMusicDockText strong"),artist:el.querySelector(".cmsMusicDockText small"),
      toggle:el.querySelector(".cmsMusicDockPlay"),mute:el.querySelector(".cmsMusicDockMute"),open:el.querySelector(".cmsMusicDockOpen")};
    dock.toggle.addEventListener("click",()=>player().toggle());
    dock.mute.addEventListener("click",()=>player().mute());
    dock.open.addEventListener("click",()=>mdSheetToggle(dock.open));
    return dock;
  }

  // The account chips sit at the right of the desktop bar (css/v10Shell.css, fixed). When the bar is too narrow for the
  // whole dock beside them, the artist line goes first, then the title, so the dock never touches a chip.
  function mdChipsLeft(bar){
    let left=Infinity;
    for(const id of ["onlinePlayerIdentityBadge","seasonIndicator"]){
      const el=root.document.getElementById(id),b=el&&el.getBoundingClientRect();
      if(b&&b.width>2&&b.height>2&&b.top<bar.bottom&&b.bottom>bar.top)left=Math.min(left,b.left);
    }
    const capsule=root.document.querySelector(".sd-nav-top .sd-nav-capsule"),c=capsule&&capsule.getBoundingClientRect();
    if(c&&c.width)left=Math.min(left,c.left);
    return left;
  }
  // The dock sits in the middle of the bar: the page's centre when that leaves a clear gap after the tabs, otherwise the
  // centre of the free space between the tabs and the account chips. When even that is too tight it shrinks (artist
  // line first, then the title) and, as a last step, steps out of the bar, so it never touches a tab or a chip.
  function mdFitTop(){
    if(!dock)return;
    const el=dock.root,prev=el.previousElementSibling;
    for(const mode of ["full","title","icon"]){
      el.dataset.fit=mode;el.style.marginLeft="";
      const box=el.getBoundingClientRect();
      if(!box.width)return;
      const start=prev?prev.getBoundingClientRect().right:el.parentNode.getBoundingClientRect().left;
      const end=mdChipsLeft(el.parentNode.getBoundingClientRect());
      const w=box.width,inFlow=box.left;
      let left=root.innerWidth/2-w/2;
      if(left<start+48)left=((start+(Number.isFinite(end)?end:root.innerWidth))/2)-w/2;
      left=Math.max(left,start+18);
      if(left+w+16<=end){el.style.marginLeft=`${Math.round(left-inFlow+parseFloat(root.getComputedStyle(el).marginLeft||0))}px`;return;}
    }
    el.style.marginLeft="";el.dataset.fit="none";
  }

  // ---- phone MUSIC tab: the sixth tab of the tab bar. The bar keeps its height, so nothing on any screen moves. ----
  function mdTabMount(){
    const doc=root.document,nav=doc.querySelector(".sd-nav-bottom");
    if(!nav||nav.querySelector(".cmsMusicTab"))return;
    const b=doc.createElement("button");
    b.type="button";b.id="cmsMusicTab";b.className="sd-nav-tab cmsMusicTab";b.setAttribute("aria-label","Music player");b.setAttribute("aria-controls","cmsMusicSheet");b.setAttribute("aria-expanded","false");
    b.innerHTML=`${ICON.disc}<span>MUSIC</span>`;
    b.addEventListener("click",()=>mdSheetToggle(b));
    nav.appendChild(b);
    mdRender();
  }

  // Home's TRACKS button is a label for a hidden checkbox (Team V markup). Under 900px the checkbox is turned straight back
  // off in the same task, before the old grid can paint, and the sheet opens instead.
  function mdHomeHook(){
    const doc=root.document,box=doc.getElementById("phoneTrackSheetToggle");
    if(!box||box.dataset.cmsSheet)return;
    box.dataset.cmsSheet="true";
    box.addEventListener("change",()=>{
      if(!box.checked||root.innerWidth>PHONE_MAX)return;
      box.checked=false;
      mdSheetOpen(doc.querySelector(".menuMusicTile .phoneTrackSheetOpen")||box);
    });
  }

  function mdMount(){
    const doc=root.document,top=doc.querySelector(".sd-nav-top");
    if(top&&!doc.getElementById("cmsMusicDockTop")){mdBuildDock(top,top.querySelector(".sd-nav-capsule"));mdRender();}
    mdTabMount();
    return Boolean(top);
  }

  function mdStart(){
    const api=player(),doc=root.document;
    mdHomeHook();
    if(started||!api||typeof api.subscribe!=="function"||!api.current())return false;
    started=true;
    api.subscribe(mdRender);
    mdMount();
    // The bars can be built (or rebuilt) after Home: mount into them as they appear.
    if(typeof root.MutationObserver==="function"){
      watching=new root.MutationObserver(mdMount);
      watching.observe(doc.body,{childList:true,subtree:true});
      new root.MutationObserver(()=>{mdSheetClose();root.requestAnimationFrame(mdFitTop);}).observe(doc.documentElement,{attributes:true,attributeFilter:["data-v10-screen","data-nav"]});
    }
    // Escape closes the player first (it is the top layer) and hands focus back to the button that opened it; a dialog
    // underneath (Settings) stays open until a second Escape.
    doc.addEventListener("keydown",event=>{
      if(event.key!=="Escape"||!sheet||sheet.root.hidden)return;
      event.stopPropagation();mdSheetClose();
    },true);
    doc.addEventListener("timeupdate",event=>{if(isAudio(event))mdTime();},true);
    doc.addEventListener("durationchange",event=>{if(isAudio(event))mdTime();},true);
    let wasPhone=root.innerWidth<=PHONE_MAX;
    root.addEventListener("resize",()=>{
      const phone=root.innerWidth<=PHONE_MAX;
      if(phone!==wasPhone){wasPhone=phone;mdSheetClose();}else mdSheetPlace();
      mdFitTop();
    });
    if(typeof root.ResizeObserver==="function"){const chips=doc.getElementById("topHeader");if(chips)new root.ResizeObserver(mdFitTop).observe(chips);}
    return true;
  }

  root.CareerModeMusicDockV10=Object.freeze({start:mdStart,state:()=>({docks:dock?[dock.root.id]:[],started,sheetOpen:Boolean(sheet&&!sheet.root.hidden),sheetMode:sheet?sheet.root.dataset.mode||null:null})});
})(typeof window!=="undefined"?window:globalThis);

```


## FILE: js/onlinePlayerIdentity.js
```javascript
(function(root,factory){const api=factory(root);if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.CareerModeOnlinePlayerIdentity=api;})(typeof globalThis!=="undefined"?globalThis:this,function(root){"use strict";
const DB="careerModeShowdown.onlinePlayerIdentity",STORE="identity",KEY="current",OVERLAY="onlinePlayerIdentityOverlay",BADGE="onlinePlayerIdentityBadge",PANEL="onlinePlayerIdentitySettingsPanel";
const MANAGERS=Object.freeze({daniel:Object.freeze({id:"daniel",label:"Daniel",role:"playerOne"}),nik:Object.freeze({id:"nik",label:"Nik",role:"playerTwo"})});
const INTERNAL_PANELS=Object.freeze(["sparkConnectedAccountPanel","sparkPrivatePairingPanel","sparkConnectedRivalryPanel","saveLibraryProductPanel"]);
const GAMEPLAY_ENTRY_SELECTOR="#newShowdown,#continueCareer,#startShowdown,#startSharedShowdown,#remoteJoiningButton,#continueSharedSetupGate";
const GAMEPLAY_SCREEN_IDS=Object.freeze(["createShowdown","leagueWheelScreen","clubWheelScreen","dashboard","transferChallenge","seasonEntry","seasonSummary"]);
let state=Object.freeze({status:"idle",initialized:false,busy:false,online:!root.navigator||root.navigator.onLine!==false,accountId:null,managerId:null,managerLabel:null,deviceId:null,registered:false,message:"Preparing your player…"}),initPromise=null,settingsObserver=null,settingsMountObserver=null,settingsSignature="",gateOpen=false,persistentPairSyncPromise=null,canonicalStartPromise=null,canonicalJoinPromise=null,canonicalContinuePromise=null;const listeners=new Set();
function freezeOnlineIdentity(v){if(!v||typeof v!=="object"||Object.isFrozen(v))return v;Object.freeze(v);Object.values(v).forEach(freezeOnlineIdentity);return v;}
function setOnlineIdentityState(next){state=freezeOnlineIdentity({...state,...next});for(const fn of listeners){try{fn(state);}catch(_){}}renderOnlineIdentity();if(state.registered&&state.accountId)void syncPersistentPairSidecar();resumeTabSessionAfterReload();return state;}
// Studio Z3: a refresh during a game lands on Home. When this tab was in a game (a one-bit flag kept by the journey entry,
// never the session itself) and the pair is still playing, the player is taken back into the game once, as if they
// tapped CONTINUE CAREER themselves. After a finished Showdown the flag is dropped and Home stays.
let tabResumeTried=false;
function resumeTabSessionAfterReload(){if(tabResumeTried||state.status!=="ready"||!state.managerId)return;tabResumeTried=true;let held=null;try{held=root.sessionStorage?.getItem("careerModeShowdown.liveGame.v1");}catch(_){}if(!held)return;let tries=0;const go=()=>{const pair=root.CareerModePersistentNikDanielPair?.getState?.();if(!pair||pair.initialized!==true||pair.busy){if(tries++<30)root.setTimeout?.(go,500);else root.careerModeTabResumeLetGo=true;return;}const screen=typeof root.getActiveScreenName==="function"?root.getActiveScreenName():"mainMenu";if(pair.status!=="paired"){if(!homeReloadPairSettling(pair.status)){try{root.sessionStorage?.removeItem("careerModeShowdown.liveGame.v1");}catch(_){}}return;}if(screen&&screen!=="mainMenu")return;/* r79 gallery: js/ssjr.js keeps the loading screen up for this resume unless it fails */void openCanonicalCareerContinue().then(next=>{if(!next||next.status!=="paired")root.careerModeTabResumeLetGo=true;});};root.setTimeout?.(go,0);}
function resolveOnlineManager(v){return MANAGERS[String(v||"").trim().toLowerCase()]||null;}
function currentPublishedState(){try{return root.CareerModeOnlinePlayerIdentity?.getState?.()||state;}catch(_){return state;}}
function onlineConnectivityAvailable(){if(root.navigator&&root.navigator.onLine===false)return false;try{const diagnostics=root.getOfflineAppDiagnostics?.();if(diagnostics?.connectivityVerified===true&&diagnostics.connectivity==="offline")return false;}catch(_){}return true;}
function onlineIdentityReady(){const current=currentPublishedState();return Boolean(current&&current.status==="ready"&&current.managerId&&current.registered);}
function activeGameplaySurface(){if(!root.document)return false;return GAMEPLAY_SCREEN_IDS.some(id=>{const el=root.document.getElementById(id);return Boolean(el&&!el.classList.contains("hidden"));});}
function openOnlineIdentityDatabase(name,store){return new Promise((resolve,reject)=>{if(!root.indexedDB?.open)return reject(new Error("Identity storage is unavailable."));const r=root.indexedDB.open(name,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(store))r.result.createObjectStore(store);};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error("Identity storage is unavailable."));r.onblocked=()=>reject(new Error("Identity storage is blocked by another tab."));});}
async function getOnlineIdentityRecord(name,store,key){let db;try{db=await openOnlineIdentityDatabase(name,store);return await new Promise((resolve,reject)=>{const r=db.transaction(store,"readonly").objectStore(store).get(key);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);});}finally{db?.close();}}
async function putOnlineIdentityRecord(name,store,key,value){let db;try{db=await openOnlineIdentityDatabase(name,store);await new Promise((resolve,reject)=>{const tx=db.transaction(store,"readwrite");tx.objectStore(store).put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}finally{db?.close();}}
const readRole=()=>getOnlineIdentityRecord(DB,STORE,KEY);async function writeOnlineRole(accountId,id){const selected=resolveOnlineManager(id);if(!selected)throw new Error("Choose Daniel or Nik.");const value={schemaVersion:1,accountId:String(accountId),managerId:selected.id,updatedAtEpochMs:Date.now()};await putOnlineIdentityRecord(DB,STORE,KEY,value);return value;}
function loadOnlineDependency(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("The connection service is unavailable."));return root.loadRuntimeScript(`online-${key}`,path,ready).then(()=>ready());}
async function syncPersistentPairSidecar(){if(persistentPairSyncPromise)return persistentPairSyncPromise;if(!state.registered||!state.accountId||typeof root.loadRuntimeScript!=="function")return null;const accountId=state.accountId;persistentPairSyncPromise=(async()=>{await loadOnlineDependency("persistent-pair","js/persistentNikDanielPair.js",()=>root.CareerModePersistentNikDanielPair);const pair=root.CareerModePersistentNikDanielPair,pairState=await pair.initialize({force:true,reconcileIdentity:async id=>{if(id===state.managerId||state.accountId!==accountId)return;const selected=resolveOnlineManager(id);if(!selected)return;await writeOnlineRole(accountId,selected.id);gateOpen=false;setOnlineIdentityState({status:"ready",busy:false,managerId:selected.id,managerLabel:selected.label,message:`Welcome back, ${selected.label}.`});}});pair.render?.();void afterPersistentPairSync(pair);return pairState;})().catch(error=>{root.console?.warn?.("[Career Mode Showdown] Remembered pair is temporarily unavailable; player identity remains available.",error);return null;}).finally(()=>{persistentPairSyncPromise=null;/* Codex #916: Home drawn before the pair answered redraws (a closed Showdown's save drops CONTINUE CAREER after a cold reload too) */try{root.refreshMainMenuExperience?.();}catch(_){}});return persistentPairSyncPromise;}
// r79 PR3: after the pair read, the permanent partner record (one read per page load, memoised in the pair module), Daniel's
// reload recovery of his own record, and on Nik's Home the JOIN note. Nothing here runs in render; the note read is memoised
// (at most once per 30 s) and only runs while Home is shown and the tab is visible.
async function afterPersistentPairSync(pair){try{if(typeof pair?.readPartnerRecord!=="function")return;await pair.readPartnerRecord();await pair.ensurePartnerRecord?.();/* Daniel's and (Codex #903) Nik's once-per-page record recovery */if(state.managerId!=="daniel")await refreshJoinNoteOnHome();/* r79 PR4: career readiness and the one-sided UNPAIR check (js/showdownModes.js: the partner's own record once per page while this account's is active, else the marker memo). */await (await loadShowdownModes())?.resolve?.();configureOnlineProductSurface();}catch(_){}}
async function loadShowdownModes(){try{const modes=await loadOnlineDependency("showdown-modes","js/showdownModes.js",()=>root.CareerModeShowdownModes);modes?.install?.();return modes||null;}catch(_){return null;}}
function onlineHomeShown(){if(root.document?.visibilityState==="hidden")return false;const screen=typeof root.getActiveScreenName==="function"?root.getActiveScreenName():"mainMenu";return !screen||screen==="mainMenu";}
async function refreshJoinNoteOnHome(options={}){const pair=root.CareerModePersistentNikDanielPair;/* Codex #910: Home shown lets a normally finished Showdown go for both managers (Daniel too), not only through Nik's note watch */if(onlineHomeShown()){try{pair?.settleOnHome?.();}catch(_error){}}if(state.status!=="ready"||state.managerId!=="nik"||typeof pair?.readJoinNote!=="function"||!onlineHomeShown())return null;/* Home shown / tab visible (re)attaches the one note listener (10 minutes per visit); its first server delivery is the read. Without a live listener (JOIN already showing, listener failed or slow) the memoised read answers. */const listening=typeof pair.watchJoinNote==="function"?await pair.watchJoinNote({isHomeShown:onlineHomeShown,resume:options.resume===true}).catch(()=>false):false;/* "deferred": a quick tab return keeps page memory until the 30 s mark (Codex #904) */const note=listening===true||(listening==="deferred"&&options.fresh!==true)?pair.getJoinNoteState():await pair.readJoinNote({fresh:options.fresh===true}).catch(()=>null);configureOnlineProductSurface();return note;}
// Nik's Home tile from page memory only: a valid note -> JOIN; an active partner with no note -> Waiting for Daniel, and the
// tile itself is the small PASTE A CODE backup (it opens Connect Players with the code box); anything else keeps "Paste".
let noteJoinBusy=false;
// r79 PR4: nothing live and the other manager's own record no longer names this account: say so, START pairs again.
function pairAgainTile(){const pair=root.CareerModePersistentNikDanielPair,p=pair?.getState?.(),live=Boolean(p&&p.rivalryId&&(p.connectionState==="active"||p.connectionState==="pending-pair")),side=pair?.getPartnerSideState?.();if(live||!side||side.status!=="unpaired"||side.accountId!==state.accountId)return null;const other=state.managerId==="daniel"?"Nik":"Daniel";return["PAIR",`PAIR AGAIN WITH ${other.toUpperCase()}`,`${other} is no longer paired with you. Tap to pair again.`];}
// r80: the live Showdown is saved online, so on any device (a fresh browser too) a live game reads as continuing, never as a
// new start. Page memory only (the pair state the sidecar already read); START itself still decides through whichShowdownIsLive.
// The tile follows the pair as it changes (code joined, game ended), through one pair subscription made on first use.
let homeTilePairWatched=false,homeModeAskedFor=null,lastLiveTile=null;
function liveHomeTile(){const pair=root.CareerModePersistentNikDanielPair;if(pair&&!homeTilePairWatched&&typeof pair.subscribe==="function"){homeTilePairWatched=true;pair.subscribe(()=>configureOnlineProductSurface());}const p=pair?.getState?.();if(!p||!p.rivalryId)return null;/* r80 resume (item 3): while a continue runs (status "continuing") the live Showdown keeps the tile it had (never START or JOIN for a moment) */if(p.connectionState==="active"&&p.status==="continuing"&&lastLiveTile&&lastLiveTile.rivalryId===p.rivalryId&&lastLiveTile.status==="recovery-required")return["LIVE","LOAD SHOWDOWN","It could not be loaded here. Tap to try again."];/* r83 Job 7: a failed continue keeps the acknowledged live rivalry and its retry reason on Home; the next tap still reauthorizes. */if(p.connectionState==="active"&&p.status==="error")return["LIVE","CONTINUE SHOWDOWN",p.message||"It could not be loaded here. Tap to try again."];if(p.connectionState==="active"&&(p.status==="paired"||p.status==="continuing")){lastLiveTile={rivalryId:p.rivalryId,status:"paired"};return["LIVE","CONTINUE SHOWDOWN","Your Showdown is live. Tap to continue."];}/* r80 gallery: a live Showdown this page could not rebuild is still this page's Showdown (never JOIN or START); the tap re-reads the pair, which rebuilds it again, and opens the recovery choices only if that fails too. */if(p.connectionState==="active"&&p.status==="recovery-required"){lastLiveTile={rivalryId:p.rivalryId,status:"recovery-required"};return["LIVE","LOAD SHOWDOWN","It could not be loaded here. Tap to try again."];}/* Waiting is reopened only once the historic career boundary is known. */if(state.managerId==="daniel"&&p.connectionState==="pending-pair"&&p.managerRole==="playerOne"&&homeModeLoading())return["NEW","CHECKING…","Checking…"];if(state.managerId==="daniel"&&p.connectionState==="pending-pair"&&p.managerRole==="playerOne"&&root.CareerModeShowdownModes?.getView?.()?.careerStarted!==false)return["WAIT","WAITING FOR NIK","Tap to see your code"];return null;}
/* The mode question (js/showdownModes.js resolve: the same memoised partner record / marker read as after the pair read) is
   asked once per account here when the tile needs it; answered or not, the tile is then drawn from it (an unknown mode keeps
   WAITING, as the tap reopens the code then). A mode learnt later redraws Home (smRefresh -> refreshHome). */
let homeModeAsk=null;
function homeModeLoading(){const mode=root.CareerModeShowdownModes?.getView?.()?.mode;if(mode==="real"||homeModeAskedFor===state.accountId)return false;const accountId=state.accountId;if(!homeModeAsk||homeModeAsk.accountId!==accountId){const promise=(async()=>{try{await (await loadShowdownModes())?.resolve?.();}catch(_){}})().finally(()=>{if(homeModeAsk&&homeModeAsk.promise===promise)homeModeAsk=null;homeModeAskedFor=accountId;configureOnlineProductSurface();});homeModeAsk={accountId,promise};}return true;}
/* r80 resume (Home item 6): Home's season chip describes a current Showdown only: a live one, or Daniel's open real code (css/homeV10.css hides it otherwise, also before the pair is read). */
function homeShowdownCurrent(){if(state.status!=="ready")return false;const p=root.CareerModePersistentNikDanielPair?.getState?.();if(!p||!p.rivalryId)return false;if(p.connectionState==="active")return true;return state.managerId==="daniel"&&p.connectionState==="pending-pair"&&p.managerRole==="playerOne"&&root.CareerModeShowdownModes?.getView?.()?.careerStarted===true;}
function nikHomeTile(){const liveTile=liveHomeTile();if(liveTile)return liveTile;const again=pairAgainTile();if(again)return again;const pair=root.CareerModePersistentNikDanielPair,p=pair?.getState?.(),live=Boolean(p&&p.rivalryId&&(p.connectionState==="active"||p.connectionState==="pending-pair")),view=!live&&typeof pair?.getJoinNoteState==="function"?pair.getJoinNoteState():null;if(view&&view.note){const n=view.note.totalSeasons;return["JOIN","JOIN DANIEL'S SHOWDOWN",noteJoinBusy?"Joining Daniel's Showdown…":`Daniel started ${n} season${n===1?"":"s"}. Tap to join.`];}if(view&&view.checked&&view.partnerActive)return view.watchPaused?["WAIT","CHECK STATUS","Tap to try again."]:["WAIT","WAITING FOR DANIEL","PASTE A CODE"];return["JOIN","JOIN DANIEL'S SHOWDOWN","Paste Daniel's code"];}
async function resolveOnlineDependencies(){await loadOnlineDependency("firebase","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);await loadOnlineDependency("account","js/sparkConnectedAccount.js",()=>root.CareerModeSparkConnectedAccount);await loadOnlineDependency("pairing","js/sparkPrivatePairing.js",()=>root.CareerModeSparkPrivatePairing);return{runtime:root.CareerModeProductionFirebaseRuntime,account:root.CareerModeSparkConnectedAccount,pairing:root.CareerModeSparkPrivatePairing};}
const onlineSurfaceText=(element,text)=>{if(element&&element.textContent!==text)element.textContent=text;};
function ensureOnlineInternalSurfaceStyle(){if(!root.document)return;let style=root.document.getElementById("onlineInternalSurfaceContainment");if(style)return style;style=root.document.createElement("style");style.id="onlineInternalSurfaceContainment";style.textContent="#saveLibraryProductPanel:not([data-test-surface=\"internal-audit\"]),#sparkConnectedAccountPanel,#sparkPrivatePairingPanel,#sparkConnectedRivalryPanel,#settingsContent .settingsOfflinePanel{display:none!important}@media(min-width:901px){#mainMenu #newShowdown{grid-column:7/13;grid-row:1}#mainMenu #ruleBookButton{grid-column:7/10;grid-row:2}#mainMenu #settingsButton{grid-column:10/13;grid-row:2}}";(root.document.head||root.document.documentElement).appendChild(style);return style;}
function configureOnlineProductSurface(){if(!root.document)return;ensureOnlineInternalSurfaceStyle();const d=root.document;
  const current=currentPublishedState(),isNik=current?.status==="ready"&&current.managerId==="nik";
  const newTile=d.getElementById("newShowdown");if(newTile){const nik=isNik?nikHomeTile():current?.status==="ready"?liveHomeTile()||pairAgainTile():null;onlineSurfaceText(newTile.querySelector(".menuTileCode"),nik?nik[0]:"NEW");onlineSurfaceText(newTile.querySelector(".menuTileLabel"),nik?nik[1]:"START A SHOWDOWN");onlineSurfaceText(newTile.querySelector(".menuTileMeta"),nik?nik[2]:"Choose seasons and create the code");}
  const chip=d.getElementById("seasonIndicator");if(chip){if(homeShowdownCurrent()){if(chip.dataset.homeShowdown!=="current")chip.dataset.homeShowdown="current";}else if(chip.dataset.homeShowdown)delete chip.dataset.homeShowdown;}
  const continueTile=d.getElementById("continueCareer");if(continueTile){onlineSurfaceText(continueTile.querySelector(".menuTileCode"),"CAREER");onlineSurfaceText(continueTile.querySelector(".menuTileLabel"),"CONTINUE CAREER");}
  const settings=d.getElementById("settingsButton");if(settings){onlineSurfaceText(settings.querySelector(".menuTileCode"),"SETTINGS");onlineSurfaceText(settings.querySelector(".menuTileLabel"),"SETTINGS");onlineSurfaceText(settings.querySelector(".menuTileMeta"),"Account and preferences");}
  const setup=d.getElementById("createShowdown");if(setup){onlineSurfaceText(setup.querySelector("h2"),"NEW SHOWDOWN");[["showdownName","Daniel vs Nik"],["managerOne","Daniel"],["managerTwo","Nik"]].forEach(([id,value])=>{const input=d.getElementById(id),label=setup.querySelector(`label[for="${id}"]`);if(input){input.value=value;input.hidden=true;input.tabIndex=-1;input.setAttribute("aria-hidden","true");}if(label)label.hidden=true;});const round=d.getElementById("roundAmount"),label=setup.querySelector('label[for="roundAmount"]');if(label)label.textContent="NUMBER OF SEASONS";if(round)for(const option of round.options){const n=Number(option.value)||1;option.textContent=`${n} Season${n===1?"":"s"}`;}const NOTE="Daniel is Player One. Nik is Player Two.";let p=d.getElementById("onlineShowdownSetupNote")||[...setup.querySelectorAll("p.stateNote:not([id])")].find(n=>n.textContent.trim()===NOTE)||null;if(p&&!p.id)p.id="onlineShowdownSetupNote";if(!p){p=d.createElement("p");p.id="onlineShowdownSetupNote";p.className="stateNote";label?.before(p);}onlineSurfaceText(p,NOTE);const start=d.getElementById("startShowdown");onlineSurfaceText(start,"START A SHOWDOWN");}
  const duplicate=d.getElementById("startSharedShowdown");if(duplicate){duplicate.hidden=true;duplicate.setAttribute("aria-hidden","true");duplicate.tabIndex=-1;}const ordering=d.getElementById("sharedShowdownOrderingNote");if(ordering)ordering.hidden=true;
  const remote=d.getElementById("remoteJoiningButton");if(remote){remote.hidden=true;remote.setAttribute("aria-hidden","true");remote.tabIndex=-1;}
  onlineSurfaceText(d.querySelector(".startupSaveNote"),"TWO MANAGERS · ONE SHOWDOWN");const bottom=d.querySelector(".menuBottomStrip strong");if(bottom)onlineSurfaceText(bottom,onlineIdentityReady()?`${String(currentPublishedState().managerLabel||"").toUpperCase()} READY`:"READY");
  const footer=d.querySelector("body > #app > footer");if(footer&&/Private Remote Joining|local|online|shared/i.test(footer.textContent||"")){footer.replaceChildren("Career Mode Showdown",d.createElement("br"),"v1.9.6");}
  const entry=d.getElementById("productionSharedJourneyEntryOverlay");if(entry&&!entry.classList.contains("hidden")){onlineSurfaceText(entry.querySelector(".remoteJoiningEyebrow"),"CAREER MODE SHOWDOWN");onlineSurfaceText(entry.querySelector("h2"),"GET READY");const intro=entry.querySelector(".remoteJoiningBody > p");if(intro)onlineSurfaceText(intro,"Connect Daniel and Nik before the career starts.");for(const button of entry.querySelectorAll("button.compactButton")){const value=(button.textContent||"").trim();if(/PAIR MANAGERS|REVIEW PAIRING/i.test(value))onlineSurfaceText(button,"CONNECT PLAYERS");else if(/OPEN \/ JOIN PRIVATE SESSION|PRIVATE SESSION ACTIVE/i.test(value))onlineSurfaceText(button,"CONTINUE");else if(/CONTINUE TO CAREER START|CONTINUE TO LEAGUE WHEEL/i.test(value))onlineSurfaceText(button,"START CAREER");else if(/SHARED JOURNEY LOCKED/i.test(value))onlineSurfaceText(button,"WAITING FOR BOTH PLAYERS");else if(/REFRESH STATUS/i.test(value))onlineSurfaceText(button,"REFRESH");}const status=entry.querySelector(".remoteJoiningStatus");if(status)onlineSurfaceText(status,status.textContent?.startsWith("READY")?"Ready. Continue when both players are set.":"Connect both players before the career starts.");}
  applyHomeStartChecking();
}
function ensureOnlineIdentityOverlay(){if(!root.document)return null;let el=root.document.getElementById(OVERLAY);if(el)return el;el=root.document.createElement("div");el.id=OVERLAY;el.className="r78-error-screen r78-error-screen--plate";el.setAttribute("role","dialog");el.setAttribute("aria-modal","true");el.setAttribute("aria-labelledby","onlinePlayerIdentityTitle");/* r78 (HO-029): Team V's marble error screen (css/r78-marble-surfaces.css). Tiny inline fallback until that sheet loads: opaque, no scrim, no blur. */Object.assign(el.style,{position:"fixed",inset:"0",zIndex:"100",display:"grid",placeItems:"center",padding:"20px",backgroundColor:"#07080a"});root.document.body.append(el);return el;}
function createOnlineIdentityButton(text,fn,tone=""){const b=root.document.createElement("button");b.type="button";b.className=tone?`r78-btn r78-btn--${tone}`:"menuButton";b.textContent=text;b.disabled=state.busy;b.addEventListener("click",fn);return b;}
function closeOnlineIdentityGate(){gateOpen=false;root.document?.getElementById(OVERLAY)?.remove();}
function openOnlineIdentityGate(){gateOpen=true;if(!onlineConnectivityAvailable()){setOnlineIdentityState({status:"offline",busy:false,online:false,message:"Connection required. Reconnect to continue."});return true;}renderOnlineIdentityOverlay();return true;}
// Studio Z2: TRY AGAIN re-checks the connection first, so a stale offline flag clears instead of being read again.
async function retryOnlineConnection(){try{await root.recheckOfflineConnectivity?.();}catch(_){}return initializeOnlineIdentity(true);}
function renderOnlineIdentityOverlay(){if(!root.document)return null;if(state.status==="ready"){closeOnlineIdentityGate();return null;}if(!gateOpen){root.document.getElementById(OVERLAY)?.remove();return null;}const el=ensureOnlineIdentityOverlay();el.replaceChildren();const card=root.document.createElement("section");card.className="r78-panel r78-error-screen__panel";Object.assign(card.style,{width:"min(560px,100%)",padding:"28px",position:"relative",backgroundColor:"#110f0c"});const dismiss=root.document.createElement("button");dismiss.type="button";dismiss.textContent="×";dismiss.setAttribute("aria-label","Close sign-in");dismiss.className="r78-close r78-error-screen__close";dismiss.addEventListener("click",closeOnlineIdentityGate);const eyebrow=root.document.createElement("p"),title=root.document.createElement("h2"),copy=root.document.createElement("p");eyebrow.className="r78-error-screen__eyebrow";title.className="r78-error-screen__title";copy.className="r78-error-screen__body";eyebrow.textContent="CAREER MODE SHOWDOWN";title.id="onlinePlayerIdentityTitle";copy.textContent=state.message;const one=button=>{const row=root.document.createElement("div");row.className="r78-error-screen__actions";row.append(button);return row;};card.append(dismiss,eyebrow,title,copy);const quotaPaused=["ready","choose-manager","saving-manager"].includes(state.status)?null:root.CareerModeFirestoreBudget?.quotaMessage?.();if(quotaPaused){title.textContent="ONLINE PLAY PAUSED FOR TODAY";copy.textContent=quotaPaused;}else if(!state.online||state.status==="offline"){title.textContent="CONNECTION REQUIRED";card.append(one(createOnlineIdentityButton("TRY AGAIN",()=>void retryOnlineConnection(),"primary")));}else if(state.status==="signed-out"){title.textContent="SIGN IN TO PLAY";card.append(one(createOnlineIdentityButton("SIGN IN WITH GOOGLE",()=>void signInOnlineIdentity(),"primary")));}else if(state.status==="choose-manager"){title.textContent="WHO ARE YOU?";const actions=root.document.createElement("div");actions.className="r78-error-screen__actions r78-error-screen__actions--two";actions.append(createOnlineIdentityButton("DANIEL · PLAYER ONE",()=>void chooseOnlineManager("daniel"),"secondary"),createOnlineIdentityButton("NIK · PLAYER TWO",()=>void chooseOnlineManager("nik"),"secondary"));card.append(actions);}else if(state.status==="device-error"||state.status==="error"){title.textContent="CONNECTION NEEDS ATTENTION";card.append(one(createOnlineIdentityButton("TRY AGAIN",()=>void initializeOnlineIdentity(true),"primary")));}else title.textContent="CONNECTING";el.append(card);return el;}
function ensureOnlineIdentityBadge(){if(!root.document)return null;let b=root.document.getElementById(BADGE);if(!b){b=root.document.createElement("button");b.id=BADGE;b.type="button";Object.assign(b.style,{marginLeft:"auto",marginRight:"12px",padding:"8px 12px",border:"1px solid rgba(255,255,255,.25)",background:"rgba(0,0,0,.25)",color:"inherit",font:"inherit"});const header=root.document.getElementById("topHeader");header?.insertBefore(b,root.document.getElementById("seasonIndicator")||null);b.addEventListener("click",()=>{if(onlineIdentityReady())root.document.getElementById("settingsButton")?.click();else openOnlineIdentityGate();});}const current=currentPublishedState();const text=current.status==="ready"&&current.managerLabel?String(current.managerLabel).toUpperCase():current.status==="choose-manager"?"CHOOSE PLAYER":current.status==="offline"?"RECONNECT":current.status==="signed-out"?"SIGN IN":"CONNECTING";if(b.textContent!==text)b.textContent=text;return b;}
function hideOnlineInternalPanels(){if(!root.document)return;ensureOnlineInternalSurfaceStyle();for(const id of INTERNAL_PANELS){const p=root.document.getElementById(id);if(p){p.hidden=true;p.dataset.productSurface="internal";}}for(const p of root.document.querySelectorAll("#settingsContent .settingsOfflinePanel")){p.hidden=true;p.dataset.productSurface="internal";}onlineSurfaceText(root.document.getElementById("settingsTitle"),"SETTINGS");const close=root.document.getElementById("settingsClose");if(close)close.setAttribute("aria-label","Close Settings");}
function renderOnlineSettings(){if(!root.document)return null;const content=root.document.getElementById("settingsContent"),dialog=root.document.getElementById("settingsOverlay");if(!content||!dialog||dialog.classList.contains("hidden"))return null;hideOnlineInternalPanels();const modes=root.CareerModeShowdownModes,sig=[state.managerLabel,state.registered,state.busy,state.status,state.message,modes?.signature?.()||""].join("|");if(!modes&&state.registered&&state.accountId)void loadShowdownModes().then(m=>{if(m){m.resolve?.();renderOnlineSettings();}});let panel=root.document.getElementById(PANEL);if(panel&&settingsSignature===sig)return panel;if(!panel){panel=root.document.createElement("section");panel.id=PANEL;panel.className="settingsPanel settingsConnectedAccountPanel";content.insertBefore(panel,content.firstChild||null);}settingsSignature=sig;panel.replaceChildren();const h=root.document.createElement("div");h.className="settingsPanelHeading";const eyebrow=root.document.createElement("span"),title=root.document.createElement("h3"),copy=root.document.createElement("p");eyebrow.className="settingsPanelEyebrow";eyebrow.textContent="ACCOUNT";title.textContent=state.managerLabel?`WELCOME ${state.managerLabel.toUpperCase()}`:"DANIEL & NIK";copy.textContent="Who you are on this device.";h.append(eyebrow,title,copy);const info=root.document.createElement("div");info.className="settingsInfoGrid";for(const [label,value] of [["PLAYER",state.managerLabel||"Not selected"],["THIS DEVICE",state.registered?"Ready":"Not ready"]]){const row=root.document.createElement("div"),a=root.document.createElement("span"),v=root.document.createElement("strong");row.className="settingsInfoRow";a.textContent=label;v.textContent=value;row.append(a,v);info.append(row);}const actions=root.document.createElement("div");actions.className="settingsOfflineActions settingsConnectedAccountActions";if(state.status==="signed-out")actions.append(createOnlineIdentityButton("SIGN IN WITH GOOGLE",()=>void signInOnlineIdentity()));else if(state.status==="choose-manager")actions.append(createOnlineIdentityButton("DANIEL · PLAYER ONE",()=>void chooseOnlineManager("daniel")),createOnlineIdentityButton("NIK · PLAYER TWO",()=>void chooseOnlineManager("nik")));else if(state.status==="offline"||state.status==="error"||state.status==="device-error")actions.append(createOnlineIdentityButton("TRY AGAIN",()=>void initializeOnlineIdentity(true)));/* Pairing actions are rendered by js/showdownModes.js. */panel.append(h,info,actions);modes?.decorateSettingsPanel?.(panel);return panel;}
function mountOnlineSettingsObserver(){const content=root.document?.getElementById("settingsContent");if(!content){if(!settingsMountObserver&&root.document?.documentElement){settingsMountObserver=new root.MutationObserver(()=>{if(!root.document.getElementById("settingsContent"))return;settingsMountObserver.disconnect();settingsMountObserver=null;mountOnlineSettingsObserver();});settingsMountObserver.observe(root.document.documentElement,{childList:true,subtree:true});}return;}if(settingsMountObserver){settingsMountObserver.disconnect();settingsMountObserver=null;}if(settingsObserver)return;settingsObserver=new root.MutationObserver(()=>{hideOnlineInternalPanels();renderOnlineSettings();});settingsObserver.observe(content,{childList:true});const dialog=root.document.getElementById("settingsOverlay");if(dialog)settingsObserver.observe(dialog,{attributes:true,attributeFilter:["class","aria-hidden"]});renderOnlineSettings();}
function prepareOnlineSettingsSurface(){for(const delay of [0,80,250,800])root.setTimeout(()=>{mountOnlineSettingsObserver();hideOnlineInternalPanels();renderOnlineSettings();configureOnlineProductSurface();},delay);}
function renderOnlineIdentity(){configureOnlineProductSurface();renderOnlineIdentityOverlay();ensureOnlineIdentityBadge();hideOnlineInternalPanels();renderOnlineSettings();}
// r75: the free daily Firestore limit pauses online play; show that instead of SIGN IN, and re-check once the pause ends.
if(typeof root.addEventListener==="function")root.addEventListener("career-mode-firestore-quota",event=>{renderOnlineIdentity();if(event?.detail?.paused===false&&state.initialized&&!state.busy&&!["ready","choose-manager","saving-manager"].includes(state.status))void initializeOnlineIdentity(true);});
async function resolveSignedInOnlineIdentity(){const deps=await resolveOnlineDependencies();await deps.account.initialize();const accountState=deps.account.getState();if(!accountState?.connected||!accountState.accountId)return{deps,accountState:null};await deps.pairing.initialize();return{deps,accountState,pairingState:deps.pairing.getState()};}
async function initializeOnlineIdentity(force=false){if(initPromise&&!force)return initPromise;configureOnlineProductSurface();prepareOnlineSettingsSurface();initPromise=(async()=>{if(!onlineConnectivityAvailable())return setOnlineIdentityState({status:"offline",initialized:true,busy:false,online:false,accountId:null,managerId:null,managerLabel:null,registered:false,message:"Connection required. Reconnect before continuing."});setOnlineIdentityState({status:"connecting",busy:true,online:true,message:"Connecting…"});try{const {accountState,pairingState}=await resolveSignedInOnlineIdentity();if(!accountState)return setOnlineIdentityState({status:"signed-out",initialized:true,busy:false,online:true,accountId:null,managerId:null,managerLabel:null,deviceId:null,registered:false,message:"Sign in with Google to play."});if(!pairingState?.registered)return setOnlineIdentityState({status:"device-error",initialized:true,busy:false,accountId:accountState.accountId,registered:false,message:pairingState?.message||"This browser could not be prepared."});const stored=await readRole(),selected=stored?.accountId===accountState.accountId?resolveOnlineManager(stored.managerId):null;if(!selected){gateOpen=true;return setOnlineIdentityState({status:"choose-manager",initialized:true,busy:false,accountId:accountState.accountId,deviceId:pairingState.deviceId,registered:true,message:"Choose your player."});}return setOnlineIdentityState({status:"ready",initialized:true,busy:false,accountId:accountState.accountId,managerId:selected.id,managerLabel:selected.label,deviceId:pairingState.deviceId,registered:true,message:`Welcome ${selected.label}.`});}catch(error){return setOnlineIdentityState({status:"error",initialized:true,busy:false,message:error?.message||"Your player could not be prepared."});}})().finally(()=>{initPromise=null;});return initPromise;}
// Studio Z6: a sign-in that never settles (popup closed elsewhere, blocked, or a slow start) left the gate on "Opening Google
// sign-in…" with no button. After SIGN_IN_WAIT_MS the gate offers SIGN IN again; a late result still lands. A failed or
// cancelled popup now shows its own reason instead of being dropped.
const SIGN_IN_WAIT_MS=20000;let signInAttempt=0;
async function signInOnlineIdentity(){gateOpen=true;const attempt=++signInAttempt;setOnlineIdentityState({status:"signing-in",busy:true,message:"Opening Google sign-in…"});const watchdog=root.setTimeout?.(()=>{if(attempt===signInAttempt&&state.status==="signing-in")setOnlineIdentityState({status:"signed-out",busy:false,message:"Google sign-in did not finish. Tap SIGN IN WITH GOOGLE to try again."});},SIGN_IN_WAIT_MS);try{const d=await resolveOnlineDependencies();const result=await d.account.signIn();if(result&&(result.status==="sign-in-cancelled"||result.status==="sign-in-failed")&&!result.connected){if(attempt!==signInAttempt)return state;return setOnlineIdentityState({status:"signed-out",busy:false,message:result.status==="sign-in-cancelled"?"Google sign-in was cancelled. Tap SIGN IN WITH GOOGLE to try again.":"Google sign-in could not be completed. Tap SIGN IN WITH GOOGLE to try again."});}return initializeOnlineIdentity(true);}catch(error){return setOnlineIdentityState({status:"signed-out",busy:false,message:error?.message||"Google sign-in could not be completed."});}finally{root.clearTimeout?.(watchdog);}}
async function chooseOnlineManager(id){const selected=resolveOnlineManager(id);if(!selected||!state.accountId)return state;gateOpen=true;setOnlineIdentityState({status:"saving-manager",busy:true,message:`Setting player to ${selected.label}…`});try{await writeOnlineRole(state.accountId,selected.id);gateOpen=false;return setOnlineIdentityState({status:"ready",busy:false,managerId:selected.id,managerLabel:selected.label,message:`Welcome ${selected.label}.`});}catch(error){return setOnlineIdentityState({status:"choose-manager",busy:false,message:error?.message||"Player identity could not be remembered."});}}

async function openCanonicalShowdownStart(){if(canonicalStartPromise)return canonicalStartPromise;canonicalStartPromise=(async()=>{await loadOnlineDependency("showdown-entry","js/productionSharedJourneyEntry.js",()=>root.CareerModeProductionSharedJourneyEntry);const entry=root.CareerModeProductionSharedJourneyEntry;if(!entry||typeof entry.preparePairingShell!=="function")throw new Error("Showdown start is unavailable.");entry.install?.();/* New starts persist the career boundary first. */const modes=await loadShowdownModes();/* Codex #908: a mode gate that could not load refuses to create (never a Showdown that skipped it); continuing a live one still works. */const prepared=await entry.preparePairingShell({beforeCreate:modes&&typeof modes.beforeSeasonsStart==="function"?()=>modes.beforeSeasonsStart():()=>{root.reportApplicationError?.("Unable to start the Showdown",new Error("Your career could not be checked, so nothing was started. Check your internet, then press START again."));return false;}});configureOnlineProductSurface();return prepared;})().catch(error=>{root.reportApplicationError?.("Unable to start the Showdown",error);return false;}).finally(()=>{canonicalStartPromise=null;});return canonicalStartPromise;}
// r79: the one START. whichShowdownIsLive reads the pair once (the sidecar's own read) and START follows it: a live game
// continues, Daniel's code already out reopens WAITING, Daniel with nothing live chooses seasons, Nik JOINs (never seasons),
// and a connection needing attention opens Connect Players. Home tile, completed hub NEW SHOWDOWN and START OVER all come here.
let canonicalStartFlowPromise=null;
// r87 one-tap Rematch (Final Winner, Daniel only): this same START, told the closed Showdown's length. Where START would open
// the seasons screen (a new Showdown, or right after the ended one is closed), that screen opens with the length already picked
// on #roundAmount (Nik 2026-10-29: "Show it, preset"); Daniel can change it and taps the screen's own START as usual. Every
// other START answer (continue, a waiting code, Connect Players) is followed exactly as from Home. The length is handed over
// once, only to the flow this tap starts. Nik never starts one.
const REMATCH_LENGTHS=Object.freeze([1,3,5,10]);let rematchSeasonsNext=null;
async function showSeasonsPreset(seasons){const opened=typeof root.navigateTo==="function"?await root.navigateTo("createShowdown"):root.showScreen?.("createShowdown");configureOnlineProductSurface();if(opened===false)return false;const round=root.document?.getElementById("roundAmount");if(!round)throw new Error("Season setup is unavailable.");round.value=String(seasons);if(round.value!==String(seasons))throw new Error("Season setup is unavailable.");return true;}
function openRematch(totalSeasons){const seasons=Number(totalSeasons);if(!REMATCH_LENGTHS.includes(seasons)||!onlineIdentityReady()||state.managerId!=="daniel")return Promise.resolve(null);if(canonicalStartFlowPromise)return canonicalStartFlowPromise;rematchSeasonsNext=seasons;return openCanonicalStart();}
async function openCanonicalStart(){if(canonicalStartFlowPromise)return canonicalStartFlowPromise;const rematch=rematchSeasonsNext;rematchSeasonsNext=null;canonicalStartFlowPromise=(async()=>{const which=await loadOnlineDependency("which-showdown","js/whichShowdownIsLive.js",()=>root.CareerModeWhichShowdownIsLive);/* r79 PR3: Nik's tap on Home is a Home-shown moment: the memoised partner record and note (no read when fresh). */if(state.managerId==="nik"&&root.CareerModePersistentNikDanielPair?.readPartnerRecord){await root.CareerModePersistentNikDanielPair.readPartnerRecord();/* Codex #903: an explicit tap reads the note fresh unless the live listener holds it */await refreshJoinNoteOnHome({fresh:true});}/* Codex #904: Daniel's START tap re-reads whether Nik's record still names him (one read, only while his own record is active), so an UNPAIR Nik made after this page loaded leads to PAIR AGAIN instead of a plain code Nik can no longer join. */if(state.managerId==="daniel"&&typeof root.CareerModePersistentNikDanielPair?.readPartnerSide==="function"){const pair=root.CareerModePersistentNikDanielPair;await pair.readPartnerRecord?.();await pair.readPartnerSide({fresh:true});}let decision=await which.read(root);/* r79 PR4 one-sided UNPAIR: this account's stale record goes inactive (fail-closed unpair), then START asks again and leads into the first real pairing. */if(decision.action==="pair-again"){await pairAgainFirst();decision=await which.read(root);}if(decision.action==="join"&&decision.rivalryId){await openCanonicalNoteJoin(decision);return decision;}/* Codex #915: Daniel never starts a code (new Showdown, or a code-less shell resumed) on an unanswered pairing check (offline or quota); he taps START again once it can be read. */if((decision.action==="new"||decision.action==="resume-waiting"&&!decision.rivalryId)&&state.managerId==="daniel"&&typeof root.CareerModePersistentNikDanielPair?.getPartnerSideState==="function"&&!["mutual","not-paired"].includes(root.CareerModePersistentNikDanielPair.getPartnerSideState()?.status))throw new Error("Could not check the pairing with Nik. Check the connection and tap START again.");if(decision.action==="new"&&rematch){const shown=await showSeasonsPreset(rematch);return shown?decision:null;}if(decision.action==="new"){const opened=typeof root.navigateTo==="function"?await root.navigateTo("createShowdown"):root.showScreen?.("createShowdown");configureOnlineProductSurface();return opened===false?null:decision;}if(decision.action!=="continue"&&decision.action!=="resume-waiting"&&decision.action!=="close-then-new"){await openCanonicalShowdownJoin({pair:decision.reason==="pair-unknown"?null:decision.pair});return decision;}await loadOnlineDependency("showdown-entry","js/productionSharedJourneyEntry.js",()=>root.CareerModeProductionSharedJourneyEntry);const entry=root.CareerModeProductionSharedJourneyEntry;if(!entry||typeof entry.followStartDecision!=="function")throw new Error("Showdown start is unavailable.");entry.install?.();const followed=await entry.followStartDecision(decision,rematch?{openSeasons:false}:undefined);if(rematch&&followed==="seasons"){const shown=await showSeasonsPreset(rematch);return shown?decision:null;}return decision;})().catch(error=>{root.reportApplicationError?.("Unable to start the Showdown",error);return null;}).finally(()=>{canonicalStartFlowPromise=null;});return canonicalStartFlowPromise;}
// r79 PR3: JOIN from Nik's Home with Daniel's note. The note carries the rivalry (the invite code itself); the redeem is the
// existing joinPairing, which continues into the Showdown by itself. A refused or failed join opens Connect Players, where
// the reason and the PASTE A CODE box are shown.
async function openCanonicalNoteJoin(decision){await loadOnlineDependency("persistent-pair","js/persistentNikDanielPair.js",()=>root.CareerModePersistentNikDanielPair);const pair=root.CareerModePersistentNikDanielPair;noteJoinBusy=true;configureOnlineProductSurface();let joined=null;try{joined=await pair.joinPairing(pair.buildPlayerJoinCode(decision.rivalryId),{managerRole:"playerTwo"});}finally{noteJoinBusy=false;configureOnlineProductSurface();}if(!joined||joined.connectionState!=="active")await openCanonicalShowdownJoin({pair:joined&&joined.status!=="unavailable"?joined:null});return joined;}
async function pairAgainFirst(){const modes=await loadShowdownModes();const result=modes&&typeof modes.unpairForPairAgain==="function"?await modes.unpairForPairAgain():null;if(!result||result.ok!==true)throw new Error(result?.message||"The pairing could not be reset right now. Try again.");return result;}
async function openCanonicalShowdownJoin(options={}){/* r79 PR3: a JOIN decision that names Daniel's note (reload recovery, locked-wheel CONTINUE) joins it like the Home tile. */if(options&&options.decision&&options.decision.action==="join"&&options.decision.rivalryId)return openCanonicalNoteJoin(options.decision);/* r79 PR4: the partner unpaired; reset this side and pair again. */if(options&&options.decision&&options.decision.action==="pair-again"){await pairAgainFirst().catch(error=>root.reportApplicationError?.("Unable to pair again",error));return openCanonicalStart();}if(canonicalJoinPromise)return canonicalJoinPromise;canonicalJoinPromise=(async()=>{await loadOnlineDependency("persistent-pair","js/persistentNikDanielPair.js",()=>root.CareerModePersistentNikDanielPair);const layer=await loadOnlineDependency("connect-players-screen","js/connectPlayersScreenV10.js",()=>root.CareerModeConnectPlayersScreenV10);await layer.open({sync:false});/* r79: a pair state START has just read is reused, so opening JOIN costs no second read. */const known=options&&options.pair&&options.pair.status!=="unavailable"?options.pair:null;const pair=root.CareerModePersistentNikDanielPair,first=known||await syncPersistentPairSidecar(),next=!first||first.status==="unavailable"?await syncPersistentPairSidecar():first;if(!next||next.status==="unavailable")throw new Error("Player connection is temporarily unavailable.");pair.render?.();const panel=root.document?.getElementById("persistentNikDanielPairPanel");panel?.scrollIntoView?.({block:"center"});panel?.querySelector("#persistentNikDanielPairCode,button")?.focus?.();return next;})().catch(error=>{root.reportApplicationError?.("Unable to join Daniel's Showdown",error);return null;}).finally(()=>{canonicalJoinPromise=null;});return canonicalJoinPromise;}
async function openCanonicalCareerContinue(){if(canonicalContinuePromise)return canonicalContinuePromise;canonicalContinuePromise=(async()=>{await loadOnlineDependency("persistent-pair","js/persistentNikDanielPair.js",()=>root.CareerModePersistentNikDanielPair);const pair=root.CareerModePersistentNikDanielPair,first=await syncPersistentPairSidecar(),next=!first||first.status==="unavailable"?await syncPersistentPairSidecar():first;if(next?.connectionState==="active"&&next.rivalryId)return pair.continuePair();/* With nothing live, Daniel follows the same START decision as Home. */if(state.managerId==="daniel")return openCanonicalStart();await openCanonicalShowdownJoin();return next;})().catch(error=>{root.reportApplicationError?.("Unable to continue the career",error);return null;}).finally(()=>{canonicalContinuePromise=null;});return canonicalContinuePromise;}
function subscribeOnlineIdentity(fn){if(typeof fn!=="function")return()=>{};listeners.add(fn);return()=>listeners.delete(fn);}
// Codex #904 (P2): Home's START / JOIN tile answers the tap at once. While START works out what to do (Nik's fresh partner and
// note check, which can wait for the note listener's first delivery, then the pair read) the tile reads "Checking…" and is
// aria-busy, so a repeat tap is ignored (js/v10Screens.js); a join that follows shows its own "Joining Daniel's Showdown…".
// Cleared on every exit, by the same configureOnlineProductSurface that draws the tile. No read and no timer of its own.
let homeStartChecking=false;
// r83 Job 8: the bounded startup cover can leave before a live tab has restored its authority.
// The local hint only holds Home's existing checking state; it never authorizes gameplay.
/* Only pair states still on their way somewhere hold it; a settled failure (offline, signed out, save needed) shows its own Home tile. */
function homeReloadPairSettling(status){return ["idle","loading","continuing","joining","starting","retrying-link","pair-link-retry","abandoning"].includes(status);}
function homeReloadChecking(){let held=false;try{held=root.sessionStorage?.getItem("careerModeShowdown.liveGame.v1")==="1";}catch(_){}if(!held)return false;const identity=currentPublishedState()?.status;if(identity!=="ready")return ["idle","connecting","signing-in","saving-manager"].includes(identity);const p=root.CareerModePersistentNikDanielPair?.getState?.();if(!p||p.initialized!==true)return true;if(p.rivalryId&&p.connectionState==="active"&&["paired","continuing","error","recovery-required"].includes(p.status))return false;return p.busy===true||homeReloadPairSettling(p.status);}
function applyHomeStartChecking(){const tile=root.document?.getElementById("newShowdown");if(!tile)return;if(homeStartChecking||homeReloadChecking()){tile.dataset.homeStartChecking="true";if(tile.getAttribute("aria-busy")!=="true")tile.setAttribute("aria-busy","true");onlineSurfaceText(tile.querySelector(".menuTileMeta"),noteJoinBusy?"Joining Daniel's Showdown…":"Checking…");/* r79 gallery: the r78 Home clips .menuTileMeta to 1 px (visual-assets/v10_1/home/home.css, css/homeV10.css), so the label, the one line shown on desktop and phone, says it too; configureOnlineProductSurface draws it back */onlineSurfaceText(tile.querySelector(".menuTileLabel"),noteJoinBusy?"JOINING…":"CHECKING…");}else if(tile.dataset.homeStartChecking==="true"){delete tile.dataset.homeStartChecking;tile.removeAttribute("aria-busy");}}
function openHomeStart(){if(canonicalStartFlowPromise)return canonicalStartFlowPromise;homeStartChecking=true;applyHomeStartChecking();const flow=openCanonicalStart();Promise.resolve(flow).catch(()=>null).then(()=>{homeStartChecking=false;configureOnlineProductSurface();});return flow;}
if(root.document?.addEventListener)root.document.addEventListener("click",e=>{const target=e.target instanceof Element?e.target:null;if(!target)return;if(target.closest("#settingsButton")){prepareOnlineSettingsSurface();return;}const gameplay=target.closest(GAMEPLAY_ENTRY_SELECTOR);if(!gameplay)return;if(!onlineIdentityReady()&&!gameplay.disabled){e.preventDefault();e.stopImmediatePropagation();openOnlineIdentityGate();return;}if(gameplay.id==="newShowdown"&&!gameplay.disabled){e.preventDefault();e.stopImmediatePropagation();void openHomeStart();return;}if(gameplay.id==="startShowdown"&&!gameplay.disabled){e.preventDefault();e.stopImmediatePropagation();void openCanonicalShowdownStart();return;}if(gameplay.id==="continueCareer"&&!gameplay.disabled){e.preventDefault();e.stopImmediatePropagation();void openCanonicalCareerContinue();}},true);
if(root.document?.addEventListener){root.document.addEventListener("career-mode-screen-shown",event=>{if(!event?.detail?.screen||event.detail.screen==="mainMenu")void refreshJoinNoteOnHome();else root.CareerModePersistentNikDanielPair?.stopJoinNoteWatch?.();});root.document.addEventListener("visibilitychange",()=>{if(root.document.visibilityState==="visible")void refreshJoinNoteOnHome({resume:true});});}
if(root.addEventListener){root.addEventListener("career-mode-permanent-pair-change",()=>configureOnlineProductSurface());/* r79 (Codex #910): the live Showdown ended while Home may be showing: redraw and watch for Daniel's next JOIN note */root.addEventListener("career-mode-permanent-pair-ended",()=>{configureOnlineProductSurface();try{root.refreshMainMenuExperience?.();}catch(_){}void refreshJoinNoteOnHome().catch(()=>null);});root.addEventListener("online",()=>void initializeOnlineIdentity(true));root.addEventListener("offline",()=>{if(activeGameplaySurface())gateOpen=true;setOnlineIdentityState({status:"offline",busy:false,online:false,message:"Connection required. Reconnect to continue."});});root.addEventListener("career-mode-offline-state-change",event=>{const connectivity=event?.detail?.connectivityVerified===true?event.detail.connectivity:null;if(connectivity==="offline"){if(activeGameplaySurface())gateOpen=true;setOnlineIdentityState({status:"offline",busy:false,online:false,message:"Connection required. Reconnect to continue."});return;}if(connectivity==="online"&&state.status==="offline")void initializeOnlineIdentity(true);});}
return freezeOnlineIdentity({contractVersion:2,mode:"online-only",managers:MANAGERS,gameplayRequiresIdentity:true,browseAndRecoveryWithoutIdentity:true,initialize:initializeOnlineIdentity,signIn:signInOnlineIdentity,chooseManager:chooseOnlineManager,openGate:openOnlineIdentityGate,readRole,syncPair:syncPersistentPairSidecar,openStart:openCanonicalStart,openJoin:openCanonicalShowdownJoin,renderSettings:renderOnlineSettings,refreshBadge:ensureOnlineIdentityBadge,refreshHome:configureOnlineProductSurface,subscribe:subscribeOnlineIdentity,getState:()=>state,openRematch});});
// Studio Z7: upright tablets got the wide desktop layout and Transfer controls went off screen. A touch screen wider
// than a phone is laid out at phone width while held upright (desktop browsers ignore the viewport tag).
(root=>{const m=root.document?.querySelector("meta[name=viewport]"),q=root.matchMedia?.("(orientation: portrait)"),f=()=>m?.setAttribute("content",q?.matches&&Math.min(root.screen?.width,root.screen?.height)>760&&root.matchMedia("(pointer: coarse)").matches?"width=760":"width=device-width, initial-scale=1.0");f();q?.addEventListener?.("change",f);})(globalThis);

```


## FILE: js/sparkPrivateSession.js
```javascript
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkPrivateSession=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const SESSION_ID_BYTES=32;
  const DEFAULT_SESSION_TTL_MS=4*60*60*1000;
  const MAX_SESSION_TTL_MS=4*60*60*1000;
  const MIN_SESSION_TTL_MS=1000;
  const PROVIDER_DEVICE_CREDENTIAL_CLAIM="device_id";
  const PROVIDER_DEVICE_CREDENTIAL_MODE="provider-device-credential";
  const STANDARD_AUTH_DEVICE_METADATA_MODE="standard-auth-device-metadata";
  const SESSION_STATES=Object.freeze(["open","active","revoked","expired","closed"]);
  const TERMINAL_SESSION_STATES=Object.freeze(["revoked","expired","closed"]);
  const SESSION_DATA_FIELDS=Object.freeze([
    "createdAt",
    "expiresAt",
    "hostAccountId",
    "lastActivityAt",
    "memberAccountIds",
    "revokedAt",
    "rivalryId",
    "state"
  ]);

  function freezeSessionValue(value){
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);
    Object.values(value).forEach(freezeSessionValue);
    return value;
  }

  function sessionError(code,message){
    const error=new Error(message||code);
    error.code=code;
    return error;
  }

  function sessionResultError(error,fallbackCode="PRIVATE_SESSION_FAILED"){
    return {
      ok:false,
      code:error&&typeof error.code==="string"?error.code:fallbackCode,
      message:error&&error.message?error.message:"The private session operation could not be completed."
    };
  }

  function hex(bytes){
    return Array.from(bytes,value=>value.toString(16).padStart(2,"0")).join("");
  }

  function generateSessionId(cryptoImpl=root.crypto){
    if(!cryptoImpl||typeof cryptoImpl.getRandomValues!=="function"){
      throw sessionError("PRIVATE_SESSION_CRYPTO_UNAVAILABLE","Secure browser randomness is unavailable.");
    }
    const bytes=new Uint8Array(SESSION_ID_BYTES);
    cryptoImpl.getRandomValues(bytes);
    return `session_${hex(bytes)}`;
  }

  function normalizeSessionId(value){
    const sessionId=typeof value==="string"?value.trim().toLowerCase():"";
    if(!/^session_[0-9a-f]{64}$/.test(sessionId)){
      throw sessionError("PRIVATE_SESSION_ID_INVALID","The exact private session code is invalid.");
    }
    return sessionId;
  }

  function normalizeRivalryId(value){
    const rivalryId=typeof value==="string"?value.trim().toLowerCase():"";
    if(!/^pair_[0-9a-f]{64}$/.test(rivalryId)){
      throw sessionError("PRIVATE_SESSION_RIVALRY_ID_INVALID","The exact paired rivalry code is invalid.");
    }
    return rivalryId;
  }

  function normalizeSessionAccountId(user){
    const accountId=user&&typeof user.uid==="string"?user.uid.trim():"";
    if(!accountId)throw sessionError("PRIVATE_SESSION_AUTH_REQUIRED","A ready private account is required.");
    return accountId;
  }

  function normalizeDeviceId(value){
    const deviceId=typeof value==="string"?value.trim().toLowerCase():"";
    if(!/^device_[0-9a-f]{32}$/.test(deviceId)){
      throw sessionError("PRIVATE_SESSION_DEVICE_NOT_REGISTERED","A current registered private device is required.");
    }
    return deviceId;
  }

  async function assertSessionProviderDeviceCredential(user,deviceId){
    if(!user||typeof user.getIdTokenResult!=="function"){
      throw sessionError("PRIVATE_SESSION_DEVICE_CREDENTIAL_REQUIRED","A provider-verifiable registered-device credential is required.");
    }
    let tokenResult;
    try{
      tokenResult=await user.getIdTokenResult();
    }catch(_error){
      throw sessionError("PRIVATE_SESSION_DEVICE_CREDENTIAL_UNAVAILABLE","The registered-device credential could not be verified.");
    }
    const claims=tokenResult&&tokenResult.claims&&typeof tokenResult.claims==="object"?tokenResult.claims:{};
    const claimedDeviceId=typeof claims[PROVIDER_DEVICE_CREDENTIAL_CLAIM]==="string"
      ?claims[PROVIDER_DEVICE_CREDENTIAL_CLAIM].trim().toLowerCase()
      :"";
    if(!/^device_[0-9a-f]{32}$/.test(claimedDeviceId)){
      throw sessionError("PRIVATE_SESSION_DEVICE_CREDENTIAL_REQUIRED","A provider-verifiable registered-device credential is required.");
    }
    if(claimedDeviceId!==deviceId){
      throw sessionError("PRIVATE_SESSION_DEVICE_CREDENTIAL_MISMATCH","The provider device credential does not match this registered browser.");
    }
    return Object.freeze({claim:PROVIDER_DEVICE_CREDENTIAL_CLAIM,deviceId:claimedDeviceId});
  }

  function normalizeDeviceAuthorityMode(value){
    const mode=value===undefined?PROVIDER_DEVICE_CREDENTIAL_MODE:String(value||"");
    if(mode!==PROVIDER_DEVICE_CREDENTIAL_MODE&&mode!==STANDARD_AUTH_DEVICE_METADATA_MODE){
      throw sessionError("PRIVATE_SESSION_DEVICE_AUTHORITY_MODE_INVALID","The private-session device authority mode is invalid.");
    }
    return mode;
  }

  async function assertSessionDeviceAuthority(user,deviceId,modeValue){
    const mode=normalizeDeviceAuthorityMode(modeValue);
    if(mode===STANDARD_AUTH_DEVICE_METADATA_MODE){
      return Object.freeze({
        mode,
        accountId:normalizeSessionAccountId(user),
        deviceId,
        providerBound:false
      });
    }
    const credential=await assertSessionProviderDeviceCredential(user,deviceId);
    return Object.freeze({...credential,mode,providerBound:true});
  }

  function normalizeNow(value){
    const nowEpochMs=value===undefined?Date.now():Number(value);
    if(!Number.isFinite(nowEpochMs)||nowEpochMs<=0){
      throw sessionError("PRIVATE_SESSION_TIME_INVALID","A valid current time is required.");
    }
    return nowEpochMs;
  }

  function normalizeTtl(value){
    const ttlMs=value===undefined?DEFAULT_SESSION_TTL_MS:Number(value);
    if(!Number.isFinite(ttlMs)||ttlMs<MIN_SESSION_TTL_MS||ttlMs>MAX_SESSION_TTL_MS){
      throw sessionError("PRIVATE_SESSION_TTL_INVALID","Private sessions must expire between one second and four hours after creation.");
    }
    return ttlMs;
  }

  function validateSdk(firestore,firebaseSdk){
    if(!firestore)throw sessionError("PRIVATE_SESSION_PROVIDER_UNAVAILABLE","Private Firestore services are unavailable.");
    for(const name of ["doc","runTransaction"]){
      if(!firebaseSdk||typeof firebaseSdk[name]!=="function"){
        throw sessionError("PRIVATE_SESSION_PROVIDER_UNAVAILABLE",`Private Firestore SDK method unavailable: ${name}.`);
      }
    }
    if(!firebaseSdk.Timestamp||typeof firebaseSdk.Timestamp.fromMillis!=="function"){
      throw sessionError("PRIVATE_SESSION_PROVIDER_UNAVAILABLE","Firestore Timestamp support is unavailable.");
    }
  }

  function canonicalizeSessionValue(value){
    if(value===undefined)return null;
    if(value===null)return null;
    if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};
    if(value instanceof Date)return {$timestamp:value.getTime()};
    if(Array.isArray(value))return value.map(canonicalizeSessionValue);
    if(typeof value==="object"){
      const output={};
      for(const key of Object.keys(value).sort())output[key]=canonicalizeSessionValue(value[key]);
      return output;
    }
    return value;
  }

  async function sha256SessionValue(value,cryptoImpl=root.crypto){
    if(!cryptoImpl||!cryptoImpl.subtle||typeof cryptoImpl.subtle.digest!=="function"){
      throw sessionError("PRIVATE_SESSION_CRYPTO_UNAVAILABLE","Secure SHA-256 support is unavailable.");
    }
    const bytes=new TextEncoder().encode(JSON.stringify(canonicalizeSessionValue(value)));
    const digest=await cryptoImpl.subtle.digest("SHA-256",bytes);
    return `sha256:${hex(new Uint8Array(digest))}`;
  }

  async function buildSessionEnvelope({sessionId,revision,parentRevision,priorContentHash,updatedAt,accountId,deviceId,data,cryptoImpl=root.crypto}){
    const contentHash=await sha256SessionValue({objectType:"session",objectId:sessionId,revision,data},cryptoImpl);
    return {
      schemaVersion:1,
      objectType:"session",
      objectId:sessionId,
      revision,
      parentRevision,
      lifecycleState:"live",
      contentHash,
      priorContentHash,
      updatedAt,
      updatedByAccountId:accountId,
      updatedByDeviceId:deviceId,
      data,
      tombstone:null
    };
  }

  function sessionTimestampMillis(value){
    if(value&&typeof value.toMillis==="function")return value.toMillis();
    if(value instanceof Date)return value.getTime();
    return Number.NaN;
  }

  function snapshotValue(snapshot){
    return snapshot&&typeof snapshot.exists==="function"&&snapshot.exists()?snapshot.data():null;
  }

  function isSessionEnvelopeShape(value,objectType,objectId){
    return Boolean(
      value
      && value.schemaVersion===1
      && value.objectType===objectType
      && value.objectId===objectId
      && Number.isInteger(value.revision)
      && value.revision>=0
      && value.lifecycleState==="live"
      && typeof value.contentHash==="string"
      && /^sha256:[0-9a-f]{64}$/.test(value.contentHash)
      && value.data&&typeof value.data==="object"
      && value.tombstone===null
    );
  }

  function assertActiveAccount(value,accountId){
    if(!isSessionEnvelopeShape(value,"account",accountId)||!value.data||value.data.status!=="active"){
      throw sessionError("PRIVATE_SESSION_ACCOUNT_INACTIVE","The current private account is not active.");
    }
    return value;
  }

  function assertActiveDevice(value,deviceId){
    if(!isSessionEnvelopeShape(value,"device",deviceId)||!value.data||value.data.deviceId!==deviceId){
      throw sessionError("PRIVATE_SESSION_DEVICE_NOT_REGISTERED","This browser is not a registered private device.");
    }
    if(value.data.state==="revoked"){
      throw sessionError("PRIVATE_SESSION_DEVICE_REVOKED","This registered device has been revoked.");
    }
    if(value.data.state!=="active"){
      throw sessionError("PRIVATE_SESSION_DEVICE_INACTIVE","This registered device is not active.");
    }
    return value;
  }

  function assertActiveRivalry(value,rivalryId,accountId){
    if(!isSessionEnvelopeShape(value,"rivalry",rivalryId)||!value.data||value.data.connectionState!=="active"){
      throw sessionError("PRIVATE_SESSION_RIVALRY_INACTIVE","The exact paired rivalry is not active.");
    }
    const authorized=Array.isArray(value.data.authorizedAccountIds)?value.data.authorizedAccountIds:[];
    const slots=Array.isArray(value.data.managerSlots)?value.data.managerSlots:[];
    if(authorized.length!==2||authorized[0]===authorized[1]||authorized.some(id=>typeof id!=="string")){
      throw sessionError("PRIVATE_SESSION_RIVALRY_INVALID","The rivalry does not have exactly two distinct entitled accounts.");
    }
    if(!authorized.includes(accountId)){
      throw sessionError("PRIVATE_SESSION_RIVALRY_NOT_ENTITLED","The current account is not entitled to this rivalry.");
    }
    if(
      slots.length!==2
      || slots.some(slot=>!slot||slot.entitlementState!=="active"||typeof slot.accountId!=="string")
      || !authorized.every(id=>slots.some(slot=>slot.accountId===id))
    ){
      throw sessionError("PRIVATE_SESSION_RIVALRY_INVALID","The rivalry manager authority is incomplete.");
    }
    return Object.freeze({value,authorizedAccountIds:Object.freeze([...authorized])});
  }

  function assertSessionShape(value,rivalryId,sessionId){
    if(!isSessionEnvelopeShape(value,"session",sessionId)){
      throw sessionError("PRIVATE_SESSION_INVALID","Private session authority is invalid.");
    }
    const data=value.data;
    if(JSON.stringify(Object.keys(data).sort())!==JSON.stringify(SESSION_DATA_FIELDS)){
      throw sessionError("PRIVATE_SESSION_INVALID","Private session fields are invalid.");
    }
    const members=Array.isArray(data.memberAccountIds)?data.memberAccountIds:[];
    const createdAtEpochMs=sessionTimestampMillis(data.createdAt);
    const expiresAtEpochMs=sessionTimestampMillis(data.expiresAt);
    const lastActivityEpochMs=data.lastActivityAt===null?null:sessionTimestampMillis(data.lastActivityAt);
    const revokedAtEpochMs=data.revokedAt===null?null:sessionTimestampMillis(data.revokedAt);
    if(
      data.rivalryId!==rivalryId
      || typeof data.hostAccountId!=="string"
      || !SESSION_STATES.includes(data.state)
      || members.length<1
      || members.length>2
      || new Set(members).size!==members.length
      || members.some(id=>typeof id!=="string")
      || !members.includes(data.hostAccountId)
      || !Number.isFinite(createdAtEpochMs)
      || !Number.isFinite(expiresAtEpochMs)
      || expiresAtEpochMs<=createdAtEpochMs
      || (lastActivityEpochMs!==null&&!Number.isFinite(lastActivityEpochMs))
      || (revokedAtEpochMs!==null&&!Number.isFinite(revokedAtEpochMs))
      || (data.state==="open"&&(members.length!==1||lastActivityEpochMs!==null||revokedAtEpochMs!==null))
      || (data.state==="active"&&(members.length!==2||lastActivityEpochMs===null||revokedAtEpochMs!==null))
      || (data.state==="revoked"&&(lastActivityEpochMs===null||revokedAtEpochMs===null))
      || ((data.state==="expired"||data.state==="closed")&&(lastActivityEpochMs===null||revokedAtEpochMs!==null))
    ){
      throw sessionError("PRIVATE_SESSION_INVALID","Private session lifecycle authority is invalid.");
    }
    return Object.freeze({value,data,members:Object.freeze([...members]),createdAtEpochMs,expiresAtEpochMs,lastActivityEpochMs,revokedAtEpochMs});
  }

  async function verifySession(value,rivalryId,sessionId,cryptoImpl=root.crypto){
    const session=assertSessionShape(value,rivalryId,sessionId);
    const expected=await sha256SessionValue({objectType:"session",objectId:sessionId,revision:value.revision,data:value.data},cryptoImpl);
    if(expected!==value.contentHash){
      throw sessionError("PRIVATE_SESSION_INTEGRITY_FAILED","Private session integrity verification failed.");
    }
    return session;
  }

  function normalizeOperation(options={}){
    validateSdk(options.firestore,options.firebaseSdk);
    return Object.freeze({
      firestore:options.firestore,
      firebaseSdk:options.firebaseSdk,
      accountId:normalizeSessionAccountId(options.user),
      deviceId:normalizeDeviceId(options.deviceId),
      rivalryId:normalizeRivalryId(options.rivalryId),
      sessionId:normalizeSessionId(options.sessionId),
      nowEpochMs:normalizeNow(options.nowEpochMs),
      cryptoImpl:options.cryptoImpl||root.crypto
    });
  }

  function references(operation){
    const sdk=operation.firebaseSdk;
    const db=operation.firestore;
    return Object.freeze({
      account:sdk.doc(db,"accounts",operation.accountId),
      device:sdk.doc(db,"accounts",operation.accountId,"devices",operation.deviceId),
      rivalry:sdk.doc(db,"rivalries",operation.rivalryId),
      session:sdk.doc(db,"rivalries",operation.rivalryId,"sessions",operation.sessionId)
    });
  }

  async function readAuthority(transaction,operation,refs){
    const accountSnapshot=await transaction.get(refs.account);
    assertActiveAccount(snapshotValue(accountSnapshot),operation.accountId);
    const deviceSnapshot=await transaction.get(refs.device);
    assertActiveDevice(snapshotValue(deviceSnapshot),operation.deviceId);
    const rivalrySnapshot=await transaction.get(refs.rivalry);
    const rivalry=assertActiveRivalry(snapshotValue(rivalrySnapshot),operation.rivalryId,operation.accountId);
    const sessionSnapshot=await transaction.get(refs.session);
    return Object.freeze({rivalry,sessionValue:snapshotValue(sessionSnapshot)});
  }

  function resultFromSession(sessionId,status,replayed,value){
    const session=assertSessionShape(value,value.data.rivalryId,sessionId);
    return {
      ok:true,
      status,
      replayed:Boolean(replayed),
      sessionId,
      rivalryId:session.data.rivalryId,
      state:session.data.state,
      revision:value.revision,
      contentHash:value.contentHash,
      hostAccountId:session.data.hostAccountId,
      memberAccountIds:[...session.members],
      createdAtEpochMs:session.createdAtEpochMs,
      expiresAtEpochMs:session.expiresAtEpochMs,
      lastActivityAtEpochMs:session.lastActivityEpochMs,
      revokedAtEpochMs:session.revokedAtEpochMs
    };
  }

  async function openSession(options={}){
    try{
      const operation=normalizeOperation(options);
      await assertSessionDeviceAuthority(options.user,operation.deviceId,options.deviceAuthorityMode);
      const ttlMs=normalizeTtl(options.ttlMs);
      const refs=references(operation);
      return await operation.firebaseSdk.runTransaction(operation.firestore,async transaction=>{
        const authority=await readAuthority(transaction,operation,refs);
        if(authority.sessionValue){
          const existing=await verifySession(authority.sessionValue,operation.rivalryId,operation.sessionId,operation.cryptoImpl);
          if(existing.data.hostAccountId!==operation.accountId){
            throw sessionError("PRIVATE_SESSION_CONFLICT","This private session code is already bound to different host authority.");
          }
          return resultFromSession(operation.sessionId,"replayed",true,authority.sessionValue);
        }
        const now=operation.firebaseSdk.Timestamp.fromMillis(operation.nowEpochMs);
        const expiresAt=operation.firebaseSdk.Timestamp.fromMillis(operation.nowEpochMs+ttlMs);
        const data={
          rivalryId:operation.rivalryId,
          hostAccountId:operation.accountId,
          memberAccountIds:[operation.accountId],
          state:"open",
          createdAt:now,
          expiresAt,
          lastActivityAt:null,
          revokedAt:null
        };
        const envelope=await buildSessionEnvelope({
          sessionId:operation.sessionId,
          revision:0,
          parentRevision:null,
          priorContentHash:null,
          updatedAt:now,
          accountId:operation.accountId,
          deviceId:operation.deviceId,
          data,
          cryptoImpl:operation.cryptoImpl
        });
        transaction.set(refs.session,envelope);
        return resultFromSession(operation.sessionId,"accepted",false,envelope);
      });
    }catch(error){
      return sessionResultError(error,"PRIVATE_SESSION_OPEN_FAILED");
    }
  }

  async function joinSession(options={}){
    try{
      const operation=normalizeOperation(options);
      await assertSessionDeviceAuthority(options.user,operation.deviceId,options.deviceAuthorityMode);
      const refs=references(operation);
      return await operation.firebaseSdk.runTransaction(operation.firestore,async transaction=>{
        const authority=await readAuthority(transaction,operation,refs);
        if(!authority.sessionValue)throw sessionError("PRIVATE_SESSION_NOT_FOUND","The exact private session is unavailable.");
        const session=await verifySession(authority.sessionValue,operation.rivalryId,operation.sessionId,operation.cryptoImpl);
        if(session.data.hostAccountId===operation.accountId){
          throw sessionError("PRIVATE_SESSION_HOST_CANNOT_JOIN","The host account cannot join its own private session as the peer.");
        }
        if(session.data.state==="active"){
          if(session.members.length===2&&session.members.includes(operation.accountId)){
            return resultFromSession(operation.sessionId,"replayed",true,authority.sessionValue);
          }
          throw sessionError("PRIVATE_SESSION_CONFLICT","Active private session membership conflicts with this account.");
        }
        if(session.data.state!=="open"){
          throw sessionError("PRIVATE_SESSION_NOT_JOINABLE","This private session is no longer open.");
        }
        if(operation.nowEpochMs>=session.expiresAtEpochMs){
          throw sessionError("PRIVATE_SESSION_EXPIRED","This private session has expired.");
        }
        const expectedMembers=new Set(authority.rivalry.authorizedAccountIds);
        if(!expectedMembers.has(session.data.hostAccountId)||!expectedMembers.has(operation.accountId)||expectedMembers.size!==2){
          throw sessionError("PRIVATE_SESSION_RIVALRY_INVALID","Session membership does not match the paired rivalry.");
        }
        const now=operation.firebaseSdk.Timestamp.fromMillis(operation.nowEpochMs);
        const data={
          ...session.data,
          memberAccountIds:[session.data.hostAccountId,operation.accountId],
          state:"active",
          lastActivityAt:now,
          revokedAt:null
        };
        const envelope=await buildSessionEnvelope({
          sessionId:operation.sessionId,
          revision:authority.sessionValue.revision+1,
          parentRevision:authority.sessionValue.revision,
          priorContentHash:authority.sessionValue.contentHash,
          updatedAt:now,
          accountId:operation.accountId,
          deviceId:operation.deviceId,
          data,
          cryptoImpl:operation.cryptoImpl
        });
        transaction.set(refs.session,envelope);
        return resultFromSession(operation.sessionId,"accepted",false,envelope);
      });
    }catch(error){
      return sessionResultError(error,"PRIVATE_SESSION_JOIN_FAILED");
    }
  }

  async function readSession(options={}){
    try{
      const operation=normalizeOperation(options);
      await assertSessionDeviceAuthority(options.user,operation.deviceId,options.deviceAuthorityMode);
      const refs=references(operation);
      return await operation.firebaseSdk.runTransaction(operation.firestore,async transaction=>{
        const authority=await readAuthority(transaction,operation,refs);
        if(!authority.sessionValue)throw sessionError("PRIVATE_SESSION_NOT_FOUND","The exact private session is unavailable.");
        const session=await verifySession(authority.sessionValue,operation.rivalryId,operation.sessionId,operation.cryptoImpl);
        if(session.data.state!=="open"&&!session.members.includes(operation.accountId)){
          throw sessionError("PRIVATE_SESSION_MEMBER_REQUIRED","The current account is not a member of this private session.");
        }
        const result=resultFromSession(operation.sessionId,"observed",false,authority.sessionValue);
        result.expiredByClock=(session.data.state==="open"||session.data.state==="active")&&operation.nowEpochMs>=session.expiresAtEpochMs;
        return result;
      });
    }catch(error){
      return sessionResultError(error,"PRIVATE_SESSION_READ_FAILED");
    }
  }

  async function transitionSession(options,targetState){
    try{
      const operation=normalizeOperation(options);
      await assertSessionDeviceAuthority(options.user,operation.deviceId,options.deviceAuthorityMode);
      const refs=references(operation);
      return await operation.firebaseSdk.runTransaction(operation.firestore,async transaction=>{
        const authority=await readAuthority(transaction,operation,refs);
        if(!authority.sessionValue)throw sessionError("PRIVATE_SESSION_NOT_FOUND","The exact private session is unavailable.");
        const session=await verifySession(authority.sessionValue,operation.rivalryId,operation.sessionId,operation.cryptoImpl);
        const isHost=session.data.hostAccountId===operation.accountId;
        const isMember=session.members.includes(operation.accountId);
        if(targetState==="revoked"&&!isHost){
          throw sessionError("PRIVATE_SESSION_HOST_REQUIRED","Only the current host may revoke this private session.");
        }
        if((targetState==="closed"||targetState==="expired")&&!isMember){
          throw sessionError("PRIVATE_SESSION_MEMBER_REQUIRED","Current private-session membership is required.");
        }
        if(session.data.state===targetState){
          return resultFromSession(operation.sessionId,"replayed",true,authority.sessionValue);
        }
        if(TERMINAL_SESSION_STATES.includes(session.data.state)){
          throw sessionError("PRIVATE_SESSION_TERMINAL","A terminal private session cannot transition again.");
        }
        if(targetState!=="expired"&&operation.nowEpochMs>=session.expiresAtEpochMs){
          throw sessionError("PRIVATE_SESSION_EXPIRED","This private session must expire rather than transition to another state.");
        }
        if(targetState==="closed"&&session.data.state!=="active"){
          throw sessionError("PRIVATE_SESSION_CLOSE_NOT_ALLOWED","Only an active private session may close.");
        }
        if(targetState==="expired"&&operation.nowEpochMs<session.expiresAtEpochMs){
          throw sessionError("PRIVATE_SESSION_NOT_EXPIRED","The private session expiry boundary has not been reached.");
        }
        if(targetState==="expired"&&session.data.state==="open"&&!isHost){
          throw sessionError("PRIVATE_SESSION_HOST_REQUIRED","Only the open-session host may record expiry before peer membership exists.");
        }
        const now=operation.firebaseSdk.Timestamp.fromMillis(operation.nowEpochMs);
        const data={
          ...session.data,
          state:targetState,
          lastActivityAt:now,
          revokedAt:targetState==="revoked"?now:null
        };
        const envelope=await buildSessionEnvelope({
          sessionId:operation.sessionId,
          revision:authority.sessionValue.revision+1,
          parentRevision:authority.sessionValue.revision,
          priorContentHash:authority.sessionValue.contentHash,
          updatedAt:now,
          accountId:operation.accountId,
          deviceId:operation.deviceId,
          data,
          cryptoImpl:operation.cryptoImpl
        });
        transaction.set(refs.session,envelope);
        return resultFromSession(operation.sessionId,"accepted",false,envelope);
      });
    }catch(error){
      return sessionResultError(error,`PRIVATE_SESSION_${String(targetState||"transition").toUpperCase()}_FAILED`);
    }
  }

  const api={
    contractVersion:1,
    feature:"stage5a-private-session-protocol",
    protocolState:"candidate-emulator-boundary",
    memoryOnly:true,
    persistentFirestoreCache:false,
    publicDiscovery:false,
    collectionListing:false,
    providerDeviceCredentialRequired:true,
    providerDeviceCredentialClaim:PROVIDER_DEVICE_CREDENTIAL_CLAIM,
    providerDeviceCredentialProductionProven:false,
    standardAuthDeviceMetadataMode:STANDARD_AUTH_DEVICE_METADATA_MODE,
    exactCapabilityBits:SESSION_ID_BYTES*8,
    defaultSessionTtlMs:DEFAULT_SESSION_TTL_MS,
    maxSessionTtlMs:MAX_SESSION_TTL_MS,
    sessionStates:SESSION_STATES,
    productionRulesPublished:false,
    hostJoinUxExposed:false,
    gameplayMutation:false,
    canonicalStorageMutation:false,
    candidateCInvolved:false,
    billingRequired:false,
    generateSessionId,
    normalizeSessionId,
    normalizeRivalryId,
    buildEnvelope:buildSessionEnvelope,
    verifySession,
    verifyProviderDeviceCredential:assertSessionProviderDeviceCredential,
    verifyDeviceAuthority:assertSessionDeviceAuthority,
    openSession,
    joinSession,
    readSession,
    revokeSession:options=>transitionSession(options,"revoked"),
    expireSession:options=>transitionSession(options,"expired"),
    closeSession:options=>transitionSession(options,"closed")
  };

  return freezeSessionValue(api);
});

```


## FILE: js/persistentNikDanielPair.js
```javascript
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModePersistentNikDanielPair=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const PAIR_DOC_ID="current";
  const MANAGER_BY_ROLE=Object.freeze({
    playerOne:Object.freeze({id:"daniel",label:"Daniel"}),
    playerTwo:Object.freeze({id:"nik",label:"Nik"})
  });
  const ROLE_BY_MANAGER=Object.freeze({daniel:"playerOne",nik:"playerTwo"});
  const MANAGER_BY_ID=Object.freeze({daniel:MANAGER_BY_ROLE.playerOne,nik:MANAGER_BY_ROLE.playerTwo});
  const PANEL_ID="persistentNikDanielPairPanel";
  const CODE_INPUT_ID="persistentNikDanielPairCode";
  const CONNECTED_RIVALRY_PATH="js/sparkConnectedRivalry.js";
  const SHARED_ENTRY_PATH="js/productionSharedJourneyEntry.js";

  let state=Object.freeze({status:"idle",initialized:false,busy:false,accountId:null,deviceId:null,managerRole:null,managerId:null,rivalryId:null,connectionState:null,providerSaveId:null,providerProfileId:null,capability:null,closedRivalryId:null,message:"Getting your Showdown ready…"});
  // r79: rivalries Terminal Close announced as ended (DELETED by the other phone; CLOSED by a normal finish once Home is shown).
  // An ended rivalry never comes back, so any later publication of it as live (a busy action, an in-flight or overlapping pair
  // read) is held as closed instead (Codex #910). closedOnHomeRivalryId waits for Home.
  const endedRivalryIds=new Set();let closedOnHomeRivalryId=null,endedHeldNow=false;
  // Job 19: the remembered pair whose Showdown is CLOSED (terminal). Non-secret; lets Home tell a finished
  // Showdown apart from a never-paired shell after reload without another provider read.
  let pairLastClosedRivalryId=null;
  // r79 (PR #901 P1): the save that closed rivalry was bound to, so START only treats THAT shell as closed, never a fresh one.
  let pairLastClosedProviderSaveId=null;
  let pairInitializePromise=null;
  let pairDraftCode="";
  let pairConnectedRivalryLoadPromise=null;
  let pairSharedEntryLoadPromise=null;
  const pairListeners=new Set();
  // Job 33 (R1): while Daniel's code is shown and Nik has not joined yet, re-read the pair link every 4 s for at most
  // 3 minutes, then every 15 s, instead of waiting for a CHECK STATUS tap. Read-only; paused while the tab is hidden.
  const PAIR_WAIT_FAST_MS=4000,PAIR_WAIT_SLOW_MS=15000,PAIR_WAIT_WINDOW_MS=180000;
  let pairWaitTimer=null,pairWaitKey="",pairWaitSince=0,pairWaitEndedKey="";
  // BH-11 (#3): CREATE and JOIN are single-flight. A refresh from the online event or the identity sidecar waits for the
  // running action instead of clearing busy and re-enabling JOIN while the first redeem is still in flight.
  let pairBusyAction=null;
  function pairBeginBusyAction(){let release=()=>{};const action={refreshing:false,done:new Promise(resolve=>{release=resolve;})};action.release=()=>{if(pairBusyAction===action)pairBusyAction=null;release();};pairBusyAction=action;return action;}
  // BH-11 (#2): ask the browser once per page to keep this site's storage durable, so the local career copy is not
  // cleared after a few days without use. Best effort: no prompt loop, no retry, failures are ignored.
  let pairDurableStorageRequested=false;
  function pairRequestDurableStorage(){if(pairDurableStorageRequested)return false;pairDurableStorageRequested=true;try{const storage=root.navigator?.storage;if(!storage||typeof storage.persist!=="function")return false;const already=typeof storage.persisted==="function"?Promise.resolve().then(()=>storage.persisted()):Promise.resolve(false);void already.then(value=>value===true?true:storage.persist()).catch(()=>false);return true;}catch(_error){return false;}}
  // BH-11 (#6, #10): raw provider errors become plain sentences. Product errors (upper-case codes) keep their own text.
  const PAIR_AMBIGUOUS_PROVIDER_CODES=new Set(["unavailable","deadline-exceeded","aborted","internal","unknown","cancelled","network-request-failed"]);
  const PAIR_CLOCK_HINT=" Also check that your phone's date and time are set automatically; a phone clock that is several minutes off is refused.";
  function pairProviderCode(error){return String(error?.code||"").split("/").pop().trim().toLowerCase();}
  function pairIsProductError(error){return /^[A-Z][A-Z0-9_]+$/.test(String(error?.code||""))&&typeof error?.message==="string"&&error.message.trim().length>0;}
  function pairPlainProviderMessage(error,fallback,options={}){const quotaPaused=root.CareerModeFirestoreBudget?.quotaMessage?.();if(quotaPaused)return quotaPaused;if(pairIsProductError(error))return error.message;const code=pairProviderCode(error);if(code==="permission-denied")return`${options.permissionMessage||"This Google account was not allowed to do that right now."}${options.clockHint===true?PAIR_CLOCK_HINT:""}`;if(code==="resource-exhausted")return "The free online service has reached its limit for now. Your career is safe; try again later.";if(PAIR_AMBIGUOUS_PROVIDER_CODES.has(code)||root.navigator?.onLine===false)return "The connection dropped before your Showdown could be checked. Check your internet, then try again.";return fallback;}
  function pairJoinFailureIsDefinitive(error){const code=pairProviderCode(error);return Boolean(code)&&!PAIR_AMBIGUOUS_PROVIDER_CODES.has(code);}

  function pairFreezeDeep(value){if(!value||typeof value!=="object"||Object.isFrozen(value))return value;Object.freeze(value);Object.values(value).forEach(pairFreezeDeep);return value;}
  // r79 gallery: Home's chip and CONTINUE tile read whether this pair holds the active save as closed (js/menuExperience.js
  // isPairClosedSave), so they are redrawn when those inputs move. Nik's JOIN after a deleted Showdown reuses its empty shell
  // (no createShowdown, no Home on the way), so nothing else redrew them and his league wheel kept NO ACTIVE SHOWDOWN.
  let pairHomeKey=null;
  function pairRedrawHome(){const key=`${state.rivalryId||""}|${state.closedRivalryId||""}|${state.closedProviderSaveId||""}`;if(key===pairHomeKey)return;pairHomeKey=key;try{root.refreshMainMenuExperience?.();}catch(_error){}}
  function pairSetState(next){state=pairFreezeDeep(pairHeldIfEnded({...state,...next}));pairRememberActiveShell();for(const listener of pairListeners){try{listener(state);}catch(_error){}}pairRedrawHome();pairRender();pairSyncWaitingPoll();pairContinueAfterWaitEnded();if(endedHeldNow)pairAnnounceEnded();return state;}
  // r79 (PR #901, smoothness): once the pair is ACTIVE this device remembers, locally, that its shell is paired (only the saveId,
  // no rivalry or account data; through js/storage.js, the one owner of local storage), so a reload mid-Showdown never holds the
  // loading screen for a pre-pair recovery (js/ssjr.js).
  const PAIRED_SHELL_KEY="careerModeShowdown.pairedShell.v1";
  function pairRememberActiveShell(){if(state.status!=="paired"||state.connectionState!=="active"||!pairValidSaveId(state.providerSaveId))return;try{if(typeof root.readStorageValue==="function"&&typeof root.writeStorageValue==="function"&&root.readStorageValue(PAIRED_SHELL_KEY)!==state.providerSaveId)root.writeStorageValue(PAIRED_SHELL_KEY,state.providerSaveId);}catch(_error){}}
  function pairWaitingKey(){const staleNikPending=state.managerRole==="playerTwo"&&pairCurrentIdentityRole()==="playerTwo";return state.connectionState==="pending-pair"&&state.capability&&state.rivalryId&&state.accountId&&!staleNikPending?`${state.accountId}|${state.rivalryId}`:"";}
  function pairClearWaitingTimer(){if(pairWaitTimer!==null){root.clearTimeout?.(pairWaitTimer);pairWaitTimer=null;}}
  function pairSyncWaitingPoll(){
    const key=pairWaitingKey();if(!key){if(pairWaitKey)pairWaitEndedKey=pairWaitKey;pairWaitKey="";pairWaitSince=0;pairClearWaitingTimer();return;}
    if(key!==pairWaitKey){pairWaitKey=key;pairWaitSince=Date.now();}
    if(pairWaitTimer!==null||typeof root.setTimeout!=="function")return;
    const delay=Date.now()-pairWaitSince<PAIR_WAIT_WINDOW_MS?PAIR_WAIT_FAST_MS:PAIR_WAIT_SLOW_MS;
    pairWaitTimer=root.setTimeout(()=>{pairWaitTimer=null;void pairWaitingPollTick();},delay);pairWaitTimer?.unref?.();
  }
  // r79 (Codex #901): however this device learns that Nik joined the rivalry it was waiting on (the poll, CHECK STATUS,
  // an identity or online refresh), Daniel goes on into the Showdown by himself once the refresh settles. Any other
  // settled state (a different rivalry, an error, still pending) drops the remembered wait.
  function pairContinueAfterWaitEnded(){if(!pairWaitEndedKey||state.busy)return;const key=pairWaitEndedKey;pairWaitEndedKey="";if(state.connectionState==="active"&&state.status==="paired"&&`${state.accountId}|${state.rivalryId}`===key)void Promise.resolve().then(pairAutoContinueAfterConnect).catch(()=>{});}
  async function pairWaitingPollTick(){root.CareerModeFirestoreBudget?.wantFresh?.();
    try{
      const key=pairWaitingKey();
      if(key&&!state.busy&&!pairInitializePromise&&root.document?.visibilityState!=="hidden"&&root.CareerModeSparkPrivatePairing?.getState?.()?.registered===true){
        // Same read as CHECK STATUS (pair link + rivalry); the panel is only re-rendered when the connection changed.
        const context=await pairResolveContext(),link=await pairReadPairLink(context);
        if(pairWaitingKey()===key&&(!link||link.rivalryId!==state.rivalryId||link.connectionState!==state.connectionState)){
          await pairInitialize({force:true});
          // r79: Nik joined the very rivalry this device was waiting on, so Daniel goes on into the Showdown by himself.
          if(state.connectionState==="active"&&state.status==="paired"&&`${state.accountId}|${state.rivalryId}`===key){/* r79 PR3: a real first pairing: Daniel writes his partner record (this read just saw the rivalry ACTIVE with Nik in playerTwo; the write re-reads it) alongside the auto-continue, so the continue is never delayed by it. */const recording=pairRecordRealPairing(state.rivalryId,"playerOne");await pairAutoContinueAfterConnect();await recording;}
        }
      }
    }catch(_error){}
    pairSyncWaitingPoll();
  }

  function pairErrorWithCode(code,message){const error=new Error(message||code);error.code=code;return error;}
  function pairCanonicalize(value){if(value===null||value===undefined)return value===undefined?null:value;if(value&&typeof value.toMillis==="function")return{$timestamp:value.toMillis()};if(Array.isArray(value))return value.map(pairCanonicalize);if(typeof value==="object"){const result={};for(const key of Object.keys(value).sort())result[key]=pairCanonicalize(value[key]);return result;}return value;}
  function pairHexFromBytes(bytes){return Array.from(bytes,value=>value.toString(16).padStart(2,"0")).join("");}
  async function pairSha256(value,cryptoImpl=root.crypto){if(!cryptoImpl?.subtle||typeof cryptoImpl.subtle.digest!=="function")throw pairErrorWithCode("PERSISTENT_PAIR_CRYPTO_UNAVAILABLE","Secure browser hashing is unavailable.");const bytes=new TextEncoder().encode(JSON.stringify(pairCanonicalize(value)));const digest=await cryptoImpl.subtle.digest("SHA-256",bytes);return`sha256:${pairHexFromBytes(new Uint8Array(digest))}`;}
  async function pairBuildEnvelope({objectId=PAIR_DOC_ID,revision,parentRevision,priorContentHash,updatedAt,updatedByAccountId,updatedByDeviceId,data,cryptoImpl=root.crypto}){const contentHash=await pairSha256({objectType:"pairLink",objectId,revision,data},cryptoImpl);return{schemaVersion:1,objectType:"pairLink",objectId,revision,parentRevision,lifecycleState:"live",contentHash,priorContentHash,updatedAt,updatedByAccountId,updatedByDeviceId,data,tombstone:null};}
  async function pairBuildRivalryClosureEnvelope(value,context,updatedAt,cryptoImpl=root.crypto,endedEarly=null){const rivalryId=pairNormalizeRivalryId(value?.objectId),revision=value.revision+1,data={...value.data,connectionState:"closed",...(endedEarly?{endedEarly}:{})},contentHash=await pairSha256({objectType:"rivalry",objectId:rivalryId,revision,data},cryptoImpl);return{...value,revision,parentRevision:value.revision,contentHash,priorContentHash:value.contentHash,updatedAt,updatedByAccountId:context.accountId,updatedByDeviceId:context.deviceId,data,tombstone:null};}

  function pairNormalizeRivalryId(value){const id=typeof value==="string"?value.trim().toLowerCase():"";if(!/^pair_[0-9a-f]{64}$/.test(id))throw pairErrorWithCode("PERSISTENT_PAIR_RIVALRY_INVALID","This Showdown connection is invalid.");return id;}
  function pairNormalizeManagerRole(value){const role=typeof value==="string"?value.trim():"";if(!MANAGER_BY_ROLE[role])throw pairErrorWithCode("PERSISTENT_PAIR_ROLE_INVALID","Choose Daniel or Nik before continuing.");return role;}
  function pairNormalizeManagerId(value){const id=typeof value==="string"?value.trim().toLowerCase():"";if(!MANAGER_BY_ID[id])throw pairErrorWithCode("PERSISTENT_PAIR_MANAGER_INVALID","Choose Daniel or Nik before continuing.");return id;}
  function pairManagerForRole(role){return MANAGER_BY_ROLE[pairNormalizeManagerRole(role)];}
  function pairManagerForId(id){return MANAGER_BY_ID[pairNormalizeManagerId(id)];}
  function pairAssertCanonicalIdentity(role,managerId){const normalizedRole=pairNormalizeManagerRole(role),normalizedManagerId=pairNormalizeManagerId(managerId),expected=pairManagerForRole(normalizedRole);if(expected.id!==normalizedManagerId)throw pairErrorWithCode("PERSISTENT_PAIR_IDENTITY_MISMATCH",`${expected.label} must use ${normalizedRole==="playerOne"?"Player One":"Player Two"}.`);return expected;}
  function pairCurrentIdentityManagerId(){const identity=root.CareerModeOnlinePlayerIdentity?.getState?.();return identity?.managerId&&MANAGER_BY_ID[identity.managerId]?identity.managerId:null;}
  function pairCurrentIdentityRole(){const managerId=pairCurrentIdentityManagerId();return managerId?ROLE_BY_MANAGER[managerId]:null;}
  function pairRequireCurrentIdentity(role){const normalizedRole=pairNormalizeManagerRole(role),managerId=pairCurrentIdentityManagerId();if(!managerId)throw pairErrorWithCode("PERSISTENT_PAIR_IDENTITY_REQUIRED","Choose Daniel or Nik before continuing.");pairAssertCanonicalIdentity(normalizedRole,managerId);return pairManagerForRole(normalizedRole);}
  function pairValidSaveId(value){return typeof value==="string"&&/^save_[a-f0-9]{24}$/.test(value);}
  function pairValidProfileId(value){return typeof value==="string"&&/^profile_[a-f0-9]{24}$/.test(value);}

  function pairLocalBindingForRole(pairing,role){const normalized=pairNormalizeManagerRole(role);const bindings=pairing&&typeof pairing.localBindingOptions==="function"?pairing.localBindingOptions():[];return(Array.isArray(bindings)?bindings:[]).find(binding=>binding&&binding.managerRole===normalized)||null;}
  function pairHasExactShowdownShell(role,saveId,profileId){const normalized=pairNormalizeManagerRole(role),runtime=root.CareerModeSaveLibraryRuntime;if(!pairValidSaveId(saveId)||!pairValidProfileId(profileId)||!runtime||typeof runtime.isReady!=="function"||runtime.isReady()!==true||typeof runtime.getLibrarySnapshot!=="function")return false;const library=runtime.getLibrarySnapshot();if(!library||!Array.isArray(library.saves))return false;const entry=library.saves.find(item=>item&&item.saveId===saveId),refs=entry?.showdown?.identity?.managerProfileIds;return Boolean(entry&&refs&&refs[normalized]===profileId);}
  async function pairExactLocalBindingForProviderSlot(pairing,role,saveId,profileId){const normalized=pairNormalizeManagerRole(role),runtime=root.CareerModeSaveLibraryRuntime;if(!pairHasExactShowdownShell(normalized,saveId,profileId)||!runtime)return null;if(typeof runtime.switchActiveSave!=="function")return null;await runtime.switchActiveSave(saveId);const library=runtime.getLibrarySnapshot();if(library?.activeSaveId!==saveId)return null;const binding=pairLocalBindingForRole(pairing,normalized);if(!binding||binding.saveId!==saveId||binding.profileId!==profileId||binding.managerRole!==normalized)return null;return binding;}
  function pairPreparedBindingForRole(pairing,role){const binding=pairLocalBindingForRole(pairing,role);if(!binding)return null;const runtime=root.CareerModeSaveLibraryRuntime;if(!runtime||typeof runtime.isReady!=="function"||runtime.isReady()!==true||typeof runtime.getLibrarySnapshot!=="function")return null;const library=runtime.getLibrarySnapshot();if(!library||library.activeSaveId!==binding.saveId||!Array.isArray(library.saves))return null;const entry=library.saves.find(item=>item&&item.saveId===binding.saveId),showdown=entry&&entry.showdown;if(!showdown||showdown.sharedJourney?.mode!=="shared"||showdown.sharedJourney?.setupPending!==true)return null;if(showdown.managers?.playerOne!=="Daniel"||showdown.managers?.playerTwo!=="Nik")return null;if(showdown.selectedLeague||showdown.clubs?.playerOne||showdown.clubs?.playerTwo||(Array.isArray(showdown.rounds)&&showdown.rounds.length))return null;return binding;}

  function pairLinkReference(context){return context.services.firestoreSdk.doc(context.services.firestore,"accounts",context.accountId,"pairLinks",PAIR_DOC_ID);}
  function pairRivalryReference(context,rivalryId){return context.services.firestoreSdk.doc(context.services.firestore,"rivalries",rivalryId);}
  function pairDeviceReference(context){return context.services.firestoreSdk.doc(context.services.firestore,"accounts",context.accountId,"devices",context.deviceId);}
  const CAREER_INDEX_HEAD_ID="current";
  const CAREER_INDEX_PAGE_CAPACITY=500;
  let careerIndexState=Object.freeze({status:"loading",accountId:null,rivalryIds:Object.freeze([]),sealedPageCount:0,code:null});
  function pairCareerIndexReference(context,indexId){return context.services.firestoreSdk.doc(context.services.firestore,"accounts",context.accountId,"careerIndex",indexId);}
  function pairCareerIndexIdsValid(ids,min,max){return Array.isArray(ids)&&ids.length>=min&&ids.length<=max&&ids.every(id=>typeof id==="string"&&/^pair_[0-9a-f]{64}$/.test(id))&&new Set(ids).size===ids.length;}
  function pairParseCareerIndexHead(value){if(!pairIsEnvelopeValue(value,"careerIndex",CAREER_INDEX_HEAD_ID))throw pairErrorWithCode("CAREER_INDEX_INVALID","The career index is invalid.");const data=value.data||{},keys=Object.keys(data).sort().join(",");if(keys!=="rivalryIds,sealedPageCount"||!pairCareerIndexIdsValid(data.rivalryIds,1,CAREER_INDEX_PAGE_CAPACITY)||!Number.isInteger(data.sealedPageCount)||data.sealedPageCount<0)throw pairErrorWithCode("CAREER_INDEX_INVALID","The career index is invalid.");return{revision:value.revision,contentHash:value.contentHash,rivalryIds:[...data.rivalryIds],sealedPageCount:data.sealedPageCount};}
  function pairParseCareerIndexPage(value,pageNumber){const pageId=`page_${pageNumber}`;if(!pairIsEnvelopeValue(value,"careerIndexPage",pageId)||value.revision!==0)throw pairErrorWithCode("CAREER_INDEX_INVALID","The career index is invalid.");const data=value.data||{},keys=Object.keys(data).sort().join(",");if(keys!=="pageNumber,rivalryIds"||data.pageNumber!==pageNumber||!pairCareerIndexIdsValid(data.rivalryIds,CAREER_INDEX_PAGE_CAPACITY,CAREER_INDEX_PAGE_CAPACITY))throw pairErrorWithCode("CAREER_INDEX_INVALID","The career index is invalid.");return[...data.rivalryIds];}
  // Pure: the exact career index writes that record rivalryId for this account in the pairing commit.
  async function pairPlanCareerIndexAppend({headValue,rivalryId,accountId,deviceId,now,cryptoImpl=root.crypto}){const id=pairNormalizeRivalryId(rivalryId),head=headValue?pairParseCareerIndexHead(headValue):null;if(head&&head.rivalryIds.includes(id))return[];const writes=[];let revision=0,parentRevision=null,priorContentHash=null,data={rivalryIds:[id],sealedPageCount:0};if(head){revision=head.revision+1;parentRevision=head.revision;priorContentHash=head.contentHash;if(head.rivalryIds.length<CAREER_INDEX_PAGE_CAPACITY)data={rivalryIds:[...head.rivalryIds,id],sealedPageCount:head.sealedPageCount};else{const pageNumber=head.sealedPageCount+1,pageId=`page_${pageNumber}`,pageData={pageNumber,rivalryIds:[...head.rivalryIds]};writes.push({indexId:pageId,value:{schemaVersion:1,objectType:"careerIndexPage",objectId:pageId,revision:0,parentRevision:null,lifecycleState:"live",contentHash:await pairSha256({objectType:"careerIndexPage",objectId:pageId,revision:0,data:pageData},cryptoImpl),priorContentHash:null,updatedAt:now,updatedByAccountId:accountId,updatedByDeviceId:deviceId,data:pageData,tombstone:null}});data={rivalryIds:[id],sealedPageCount:pageNumber};}}writes.push({indexId:CAREER_INDEX_HEAD_ID,value:{schemaVersion:1,objectType:"careerIndex",objectId:CAREER_INDEX_HEAD_ID,revision,parentRevision,lifecycleState:"live",contentHash:await pairSha256({objectType:"careerIndex",objectId:CAREER_INDEX_HEAD_ID,revision,data},cryptoImpl),priorContentHash,updatedAt:now,updatedByAccountId:accountId,updatedByDeviceId:deviceId,data,tombstone:null}});return writes;}
  // Sealed pages are immutable. Keep only the current account/provider's pages in this runtime;
  // always read the mutable head so finishes and rollover on the other device remain discoverable.
  let careerIndexPages=null;
  async function pairReadCareerIndexWith({firestore,firebaseSdk,accountId}){
    if(!careerIndexPages||careerIndexPages.db!==firestore||careerIndexPages.accountId!==accountId)careerIndexPages={db:firestore,accountId,pages:new Map()};
    const cache=careerIndexPages.pages;
    const head=await firebaseSdk.getDoc(firebaseSdk.doc(firestore,"accounts",accountId,"careerIndex",CAREER_INDEX_HEAD_ID));
    if(!head.exists())return{rivalryIds:[],sealedPageCount:0};
    const parsed=pairParseCareerIndexHead(head.data()),ordered=[];
    for(let pageNumber=1;pageNumber<=parsed.sealedPageCount;pageNumber+=1){
      let ids=cache.get(pageNumber);
      if(!ids){
        const page=await firebaseSdk.getDoc(firebaseSdk.doc(firestore,"accounts",accountId,"careerIndex",`page_${pageNumber}`));
        if(!page.exists())throw pairErrorWithCode("CAREER_INDEX_PAGE_MISSING","Part of the career index is missing.");
        ids=Object.freeze(pairParseCareerIndexPage(page.data(),pageNumber));cache.set(pageNumber,ids);
      }
      ordered.push(...ids);
    }
    ordered.push(...parsed.rivalryIds);
    if(new Set(ordered).size!==ordered.length)throw pairErrorWithCode("CAREER_INDEX_INVALID","The career index is invalid.");
    return{rivalryIds:ordered,sealedPageCount:parsed.sealedPageCount};
  }
  // Read-only: ordered rivalry ids (oldest first) for the signed-in account. Never throws; memory-only state.
  async function pairReadCareerIndex(options={}){let accountId=null;try{let firestore=options.firestore,firebaseSdk=options.firebaseSdk;accountId=options.accountId||null;if(!firestore||!firebaseSdk||!accountId){const context=await pairResolveContext();firestore=context.services.firestore;firebaseSdk=context.services.firestoreSdk;accountId=context.accountId;}careerIndexState=pairFreezeDeep({status:"loading",accountId,rivalryIds:[],sealedPageCount:0,code:null});const result=await pairReadCareerIndexWith({firestore,firebaseSdk,accountId});careerIndexState=pairFreezeDeep({status:"ready",accountId,rivalryIds:result.rivalryIds,sealedPageCount:result.sealedPageCount,code:null});}catch(error){careerIndexState=pairFreezeDeep({status:"unavailable",accountId,rivalryIds:[],sealedPageCount:0,code:error?.code||"CAREER_INDEX_UNAVAILABLE"});}return careerIndexState;}
  function pairIsEnvelopeValue(value,objectType,objectId){return Boolean(value&&value.schemaVersion===1&&value.objectType===objectType&&value.objectId===objectId&&value.lifecycleState==="live"&&Number.isInteger(value.revision)&&value.revision>=0&&typeof value.contentHash==="string");}
  function pairAssertActiveDevice(snapshot,deviceId){if(!snapshot?.exists?.())throw pairErrorWithCode("PERSISTENT_PAIR_DEVICE_REQUIRED",root.CareerModeFirestoreBudget?.quotaMessage?.()||"This browser is not ready yet.");const value=snapshot.data();if(!pairIsEnvelopeValue(value,"device",deviceId)||value.data?.deviceId!==deviceId||value.data?.state!=="active")throw pairErrorWithCode("PERSISTENT_PAIR_DEVICE_REQUIRED",root.CareerModeFirestoreBudget?.quotaMessage?.()||"This browser is not ready yet.");return value;}
  function pairRivalrySlotFor(value,accountId){if(!pairIsEnvelopeValue(value,"rivalry",value?.objectId)||!Array.isArray(value.data?.managerSlots))return null;return value.data.managerSlots.find(slot=>slot&&slot.accountId===accountId)||null;}
  function pairAssertRivalryMembership(value,rivalryId,accountId,expectedRole=null){if(!pairIsEnvelopeValue(value,"rivalry",rivalryId))throw pairErrorWithCode("PERSISTENT_PAIR_RIVALRY_MISSING","This Showdown could not be found.");if(!["pending-pair","active"].includes(value.data?.connectionState))throw pairErrorWithCode("PERSISTENT_PAIR_RIVALRY_INACTIVE","This Showdown is no longer available.");const slot=pairRivalrySlotFor(value,accountId);if(!slot||!MANAGER_BY_ROLE[slot.slotId])throw pairErrorWithCode("PERSISTENT_PAIR_MEMBERSHIP_MISSING","This account is not part of this Showdown.");if(expectedRole&&slot.slotId!==expectedRole)throw pairErrorWithCode("PERSISTENT_PAIR_ROLE_CONFLICT","This account is assigned to the other player slot.");return{slot,connectionState:value.data.connectionState};}
  function pairProviderBindingFromMembership(membership){const slot=membership?.slot,role=pairNormalizeManagerRole(slot?.slotId),saveId=slot?.saveId,profileId=slot?.profileId;if(!pairValidSaveId(saveId)||!pairValidProfileId(profileId))throw pairErrorWithCode("PERSISTENT_PAIR_BINDING_INVALID","The linked career has invalid recovery identity data.");return Object.freeze({saveId,profileId,managerRole:role});}
  function pairParsePairLink(value,accountId){if(!pairIsEnvelopeValue(value,"pairLink",PAIR_DOC_ID))throw pairErrorWithCode("PERSISTENT_PAIR_LINK_INVALID","The saved Showdown connection is invalid.");const data=value.data||{},role=pairNormalizeManagerRole(data.managerRole),manager=pairAssertCanonicalIdentity(role,data.managerId),rivalryId=pairNormalizeRivalryId(data.rivalryId);return{accountId,rivalryId,managerRole:role,managerId:manager.id,managerLabel:manager.label,revision:value.revision,contentHash:value.contentHash,linkedAt:data.linkedAt,lastConfirmedAt:data.lastConfirmedAt};}

  async function pairResolveContext(){const runtime=root.CareerModeProductionFirebaseRuntime,account=root.CareerModeSparkConnectedAccount,pairing=root.CareerModeSparkPrivatePairing;if(!runtime||!account||!pairing)throw pairErrorWithCode("PERSISTENT_PAIR_RUNTIME_UNAVAILABLE","The connection service is unavailable.");await account.initialize();const accountState=account.getState?.();if(!accountState?.connected||!accountState.accountId)throw pairErrorWithCode("PERSISTENT_PAIR_AUTH_REQUIRED","Sign in before continuing.");await pairing.initialize();const pairingState=pairing.getState?.();if(!pairingState?.registered||!pairingState.deviceId)throw pairErrorWithCode("PERSISTENT_PAIR_DEVICE_REQUIRED",root.CareerModeFirestoreBudget?.quotaMessage?.()||"This browser is not ready yet.");const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices());const user=services?.auth?.currentUser;if(!services?.ok||!user||user.uid!==accountState.accountId)throw pairErrorWithCode("PERSISTENT_PAIR_AUTH_REQUIRED","The signed-in account is unavailable.");return{runtime,account,pairing,services,user,accountId:accountState.accountId,deviceId:pairingState.deviceId};}
  async function pairReadPairLink(context){const sdk=context.services.firestoreSdk,ref=pairLinkReference(context);pairLastClosedRivalryId=null;pairLastClosedProviderSaveId=null;return sdk.runTransaction(context.services.firestore,async transaction=>{pairLastClosedRivalryId=null;pairLastClosedProviderSaveId=null;const pairSnapshot=await transaction.get(ref);if(!pairSnapshot.exists())return null;const link=pairParsePairLink(pairSnapshot.data(),context.accountId),rivalrySnapshot=await transaction.get(pairRivalryReference(context,link.rivalryId));if(!rivalrySnapshot.exists())throw pairErrorWithCode("PERSISTENT_PAIR_RIVALRY_MISSING","This Showdown could not be found.");const rivalryValue=rivalrySnapshot.data();if(!pairIsEnvelopeValue(rivalryValue,"rivalry",link.rivalryId))throw pairErrorWithCode("PERSISTENT_PAIR_RIVALRY_MISSING","This Showdown could not be found.");if(rivalryValue.data?.connectionState==="closed"){const slot=pairRivalrySlotFor(rivalryValue,context.accountId);if(!slot||slot.slotId!==link.managerRole)throw pairErrorWithCode("PERSISTENT_PAIR_MEMBERSHIP_MISSING","This account is not part of this Showdown.");pairLastClosedRivalryId=link.rivalryId;pairLastClosedProviderSaveId=pairValidSaveId(slot.saveId)?slot.saveId:null;return null;}const membership=pairAssertRivalryMembership(rivalryValue,link.rivalryId,context.accountId,link.managerRole),providerBinding=pairProviderBindingFromMembership(membership);return{...link,connectionState:membership.connectionState,providerSaveId:providerBinding.saveId,providerProfileId:providerBinding.profileId};});}
  async function pairPersistPairLink(context,rivalryId,managerRole){const sdk=context.services.firestoreSdk,role=pairNormalizeManagerRole(managerRole),manager=pairRequireCurrentIdentity(role),normalizedRivalryId=pairNormalizeRivalryId(rivalryId),pairRef=pairLinkReference(context),rivalryRef=pairRivalryReference(context,normalizedRivalryId),deviceRef=pairDeviceReference(context),now=sdk.Timestamp.fromMillis(Date.now());return sdk.runTransaction(context.services.firestore,async transaction=>{const deviceSnapshot=await transaction.get(deviceRef);pairAssertActiveDevice(deviceSnapshot,context.deviceId);const rivalrySnapshot=await transaction.get(rivalryRef);if(!rivalrySnapshot.exists())throw pairErrorWithCode("PERSISTENT_PAIR_RIVALRY_MISSING","This Showdown could not be confirmed.");const membership=pairAssertRivalryMembership(rivalrySnapshot.data(),normalizedRivalryId,context.accountId,role),providerBinding=pairProviderBindingFromMembership(membership),pairSnapshot=await transaction.get(pairRef);let revision=0,parentRevision=null,priorContentHash=null,linkedAt=now;if(pairSnapshot.exists()){const existing=pairParsePairLink(pairSnapshot.data(),context.accountId),sameManager=existing.managerRole===role&&existing.managerId===manager.id;if(existing.rivalryId===normalizedRivalryId&&!sameManager)throw pairErrorWithCode("PERSISTENT_PAIR_IDENTITY_MISMATCH","This active Showdown belongs to the other player identity. Close it before changing players.");if(existing.rivalryId!==normalizedRivalryId){const oldSnapshot=await transaction.get(pairRivalryReference(context,existing.rivalryId)),oldState=oldSnapshot.exists()?oldSnapshot.data()?.data?.connectionState:null;if(oldState==="active")throw pairErrorWithCode("PERSISTENT_PAIR_ACTIVE_CONFLICT","This account already has an active Showdown.");if(!sameManager&&oldState!=="closed")throw pairErrorWithCode("PERSISTENT_PAIR_IDENTITY_MISMATCH","Close the previous Showdown before changing this Google account between Daniel and Nik.");}revision=existing.revision+1;parentRevision=existing.revision;priorContentHash=existing.contentHash;linkedAt=existing.linkedAt||now;}const data={rivalryId:normalizedRivalryId,managerRole:role,managerId:manager.id,linkedAt,lastConfirmedAt:now};const envelope=await pairBuildEnvelope({revision,parentRevision,priorContentHash,updatedAt:now,updatedByAccountId:context.accountId,updatedByDeviceId:context.deviceId,data});transaction.set(pairRef,envelope);return{rivalryId:normalizedRivalryId,managerRole:role,managerId:manager.id,managerLabel:manager.label,connectionState:membership.connectionState,providerSaveId:providerBinding.saveId,providerProfileId:providerBinding.profileId,revision:envelope.revision};});}
  async function pairPersistPairLinkWithRetry(context,rivalryId,managerRole,attempts=2){let lastError=null;const total=Math.max(1,Number.isInteger(attempts)?attempts:2);for(let attempt=0;attempt<total;attempt+=1){try{return await pairPersistPairLink(context,rivalryId,managerRole);}catch(error){lastError=error;}}throw lastError||pairErrorWithCode("PERSISTENT_PAIR_LINK_SAVE_FAILED","The Showdown connection could not be saved to this account.");}

  async function pairAbandonCurrentShowdown(options={}){
    if(state.busy)throw pairErrorWithCode("PERSISTENT_PAIR_BUSY","The current Showdown connection is busy. Try again when the current action finishes.");
    const expectedRivalryId=options.expectedRivalryId?pairNormalizeRivalryId(options.expectedRivalryId):null;
    const expectedSaveId=options.expectedSaveId==null?null:String(options.expectedSaveId);
    if(expectedSaveId!==null&&!pairValidSaveId(expectedSaveId))throw pairErrorWithCode("PERSISTENT_PAIR_BINDING_INVALID","The current Showdown identity is invalid.");
    // r80 END SHOWDOWN: the ended-early mark rides on this same closure write (seasons finished, or null when unknown).
    const endedEarly=Object.hasOwn(options,"seasonsPlayed")?{seasonsPlayed:Number.isInteger(options.seasonsPlayed)&&options.seasonsPlayed>=0&&options.seasonsPlayed<=10?options.seasonsPlayed:null}:null;
    pairSetState({status:"abandoning",busy:true,message:"Ending the current Showdown for both players…"});
    try{
      const context=await pairResolveContext(),sdk=context.services.firestoreSdk,pairRef=pairLinkReference(context),deviceRef=pairDeviceReference(context);
      const result=await sdk.runTransaction(context.services.firestore,async transaction=>{
        const deviceSnapshot=await transaction.get(deviceRef);pairAssertActiveDevice(deviceSnapshot,context.deviceId);
        const pairSnapshot=await transaction.get(pairRef);
        if(!pairSnapshot.exists()){
          if(expectedRivalryId)throw pairErrorWithCode("PERSISTENT_PAIR_LINK_REQUIRED","The online Showdown connection could not be verified. Nothing was changed.");
          return{ok:true,status:"unpaired",rivalryId:null};
        }
        const link=pairParsePairLink(pairSnapshot.data(),context.accountId);
        pairRequireCurrentIdentity(link.managerRole);
        if(expectedRivalryId&&link.rivalryId!==expectedRivalryId)throw pairErrorWithCode("PERSISTENT_PAIR_CONTEXT_MISMATCH","This Showdown does not match the remembered online Showdown. Nothing was deleted.");
        const rivalryRef=pairRivalryReference(context,link.rivalryId),rivalrySnapshot=await transaction.get(rivalryRef);
        if(!rivalrySnapshot.exists())throw pairErrorWithCode("PERSISTENT_PAIR_RIVALRY_MISSING","The online Showdown could not be verified. Nothing was changed.");
        const rivalryValue=rivalrySnapshot.data();
        if(!pairIsEnvelopeValue(rivalryValue,"rivalry",link.rivalryId))throw pairErrorWithCode("PERSISTENT_PAIR_RIVALRY_MISSING","The online Showdown could not be verified. Nothing was changed.");
        const slot=pairRivalrySlotFor(rivalryValue,context.accountId);
        if(!slot||slot.slotId!==link.managerRole)throw pairErrorWithCode("PERSISTENT_PAIR_MEMBERSHIP_MISSING","This account is not part of the remembered Showdown.");
        if(expectedSaveId&&slot.saveId!==expectedSaveId)throw pairErrorWithCode("PERSISTENT_PAIR_CONTEXT_MISMATCH","This Showdown's save does not match the remembered online Showdown. Nothing was deleted.");
        if(rivalryValue.data?.connectionState==="closed")return{ok:true,status:"already-closed",rivalryId:link.rivalryId,managerRole:link.managerRole};
        // r80 (Codex #936): Daniel's first real START closes his leftover code only while nobody has joined it (read here, in the
        // close itself): a code Nik has joined is a Showdown being played and is never ended from that START.
        if(options.unjoinedOnly===true&&(link.managerRole!=="playerOne"||rivalryValue.data?.connectionState!=="pending-pair"))throw pairErrorWithCode("PERSISTENT_PAIR_CODE_JOINED","Nik has already joined your earlier code, so that Showdown is being played. Finish or end it first. Nothing was changed.");
        const membership=pairAssertRivalryMembership(rivalryValue,link.rivalryId,context.accountId,link.managerRole),providerBinding=pairProviderBindingFromMembership(membership);
        if(expectedSaveId&&providerBinding.saveId!==expectedSaveId)throw pairErrorWithCode("PERSISTENT_PAIR_CONTEXT_MISMATCH","This Showdown's save does not match the remembered online Showdown. Nothing was deleted.");
        const now=sdk.Timestamp.fromMillis(Date.now()),next=await pairBuildRivalryClosureEnvelope(rivalryValue,context,now,options.cryptoImpl||root.crypto,endedEarly);
        transaction.set(rivalryRef,next);
        return{ok:true,status:"closed",rivalryId:link.rivalryId,managerRole:link.managerRole,revision:next.revision};
      });
      await pairInitialize({force:true});
      return result;
    }catch(error){
      pairSetState({status:"error",busy:false,message:"The current Showdown connection was not closed. "+(error?.message||"Nothing was changed.")});
      throw error;
    }
  }
  async function pairLoadConnectedRivalry(){if(root.CareerModeSparkConnectedRivalry)return root.CareerModeSparkConnectedRivalry;if(pairConnectedRivalryLoadPromise)return pairConnectedRivalryLoadPromise;if(typeof root.loadRuntimeScript!=="function")return null;pairConnectedRivalryLoadPromise=root.loadRuntimeScript("persistent-pair-connected-rivalry",CONNECTED_RIVALRY_PATH,()=>Boolean(root.CareerModeSparkConnectedRivalry)).then(()=>root.CareerModeSparkConnectedRivalry||null).catch(()=>null).finally(()=>{pairConnectedRivalryLoadPromise=null;});return pairConnectedRivalryLoadPromise;}
  async function pairLoadSharedJourneyEntry(){if(root.CareerModeProductionSharedJourneyEntry)return root.CareerModeProductionSharedJourneyEntry;if(pairSharedEntryLoadPromise)return pairSharedEntryLoadPromise;if(typeof root.loadRuntimeScript!=="function")return null;pairSharedEntryLoadPromise=root.loadRuntimeScript("persistent-pair-shared-entry",SHARED_ENTRY_PATH,()=>Boolean(root.CareerModeProductionSharedJourneyEntry)).then(()=>root.CareerModeProductionSharedJourneyEntry||null).catch(()=>null).finally(()=>{pairSharedEntryLoadPromise=null;});return pairSharedEntryLoadPromise;}
  async function pairEnsurePreparedBinding(context,role){const binding=pairPreparedBindingForRole(context.pairing,role);if(binding)return binding;/* r79: no screen change here (that was the reverse bounce); the panel offers CHOOSE SEASONS instead. */throw pairErrorWithCode("PERSISTENT_PAIR_SEASON_SELECTION_REQUIRED","Choose 1, 3, 5, or 10 seasons and press START A SHOWDOWN before connecting players.");}
  async function pairAttachRecoveryPointer(context,binding,rivalryId){const connected=await pairLoadConnectedRivalry();if(!connected?.attachRivalry)return{ok:false,connected:null,result:null};const result=await connected.attachRivalry({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,deviceId:context.deviceId,binding,rivalryId,indexedDBImpl:root.indexedDB});if(result?.ok&&typeof connected.initialize==="function")await connected.initialize();return{ok:Boolean(result?.ok),connected,result};}

// r78 (HO-029): the shared marble confirm box (js/showdownConfirm.js, loaded on first use) replaces the native confirm().
// It resolves true only for OK; Cancel, Esc or a box that cannot load resolve false (undefined when no loader exists).
function pairAskConfirm(message,tone){return typeof root.askShowdownConfirm==="function"?root.askShowdownConfirm(message,{tone}):typeof root.loadRuntimeScript==="function"?root.loadRuntimeScript("showdown-confirm","js/showdownConfirm.js",()=>typeof root.askShowdownConfirm==="function").then(()=>root.askShowdownConfirm(message,{tone}),()=>false):Promise.resolve(undefined);}
function pairTimestampMillis(value){if(value&&typeof value.toMillis==="function")return value.toMillis();if(value instanceof Date)return value.getTime();return Number.NaN;}
function pairCreateDurablePairWitness(context,role,manager,expectedRivalryId,connectionState){const sdk=context.services.firestoreSdk,normalizedRole=pairNormalizeManagerRole(role),expected=expectedRivalryId?pairNormalizeRivalryId(expectedRivalryId):null;return async({transaction,binding,capability,now,nowEpochMs})=>{const normalizedRivalryId=pairNormalizeRivalryId(capability);if(expected&&normalizedRivalryId!==expected)throw pairErrorWithCode("PERSISTENT_PAIR_RIVALRY_INVALID","The Showdown connection changed during provider mutation.");if(!binding||binding.managerRole!==normalizedRole||!pairValidSaveId(binding.saveId)||!pairValidProfileId(binding.profileId))throw pairErrorWithCode("PERSISTENT_PAIR_BINDING_INVALID","The career identity is invalid.");
  // READ PHASE: every transaction.get happens before any transaction.set (Sol S2C-005R2 §3).
  const pairRef=pairLinkReference(context),indexRef=pairCareerIndexReference(context,CAREER_INDEX_HEAD_ID),pairSnapshot=await transaction.get(pairRef),indexSnapshot=await transaction.get(indexRef);let revision=0,parentRevision=null,priorContentHash=null,linkedAt=now;if(pairSnapshot.exists()){const existing=pairParsePairLink(pairSnapshot.data(),context.accountId),sameManager=existing.managerRole===normalizedRole&&existing.managerId===manager.id;if(existing.rivalryId===normalizedRivalryId&&!sameManager)throw pairErrorWithCode("PERSISTENT_PAIR_IDENTITY_MISMATCH","This Showdown belongs to the other player identity. Close it before changing players.");if(existing.rivalryId!==normalizedRivalryId){const oldSnapshot=await transaction.get(pairRivalryReference(context,existing.rivalryId));if(!oldSnapshot.exists()||!pairIsEnvelopeValue(oldSnapshot.data(),"rivalry",existing.rivalryId))throw pairErrorWithCode("PERSISTENT_PAIR_ACTIVE_CONFLICT","The current Showdown authority cannot be replaced safely.");const oldState=oldSnapshot.data().data?.connectionState;if(oldState==="active")throw pairErrorWithCode("PERSISTENT_PAIR_ACTIVE_CONFLICT","This account already has an active Showdown.");if(!sameManager&&oldState!=="closed")throw pairErrorWithCode("PERSISTENT_PAIR_IDENTITY_MISMATCH","Close the previous Showdown before changing this Google account between Daniel and Nik.");if(oldState==="pending-pair"){const oldInviteRef=sdk.doc(context.services.firestore,"rivalries",existing.rivalryId,"invites",existing.rivalryId),oldInviteSnapshot=await transaction.get(oldInviteRef),oldInvite=oldInviteSnapshot.exists()?oldInviteSnapshot.data():null,expiresAt=pairTimestampMillis(oldInvite?.data?.expiresAt),stillOpen=pairIsEnvelopeValue(oldInvite,"invite",existing.rivalryId)&&oldInvite.data?.state==="open"&&Number.isFinite(expiresAt)&&expiresAt>nowEpochMs;if(stillOpen)throw pairErrorWithCode("PERSISTENT_PAIR_PENDING_CONFLICT","This account already has a connection code waiting for the other player.");}else if(oldState!=="closed")throw pairErrorWithCode("PERSISTENT_PAIR_ACTIVE_CONFLICT","The current Showdown authority cannot be replaced safely.");}revision=existing.revision+1;parentRevision=existing.revision;priorContentHash=existing.contentHash;linkedAt=existing.linkedAt||now;}
  const indexWrites=await pairPlanCareerIndexAppend({headValue:indexSnapshot.exists()?indexSnapshot.data():null,rivalryId:normalizedRivalryId,accountId:context.accountId,deviceId:context.deviceId,now});const data={rivalryId:normalizedRivalryId,managerRole:normalizedRole,managerId:manager.id,linkedAt,lastConfirmedAt:now},envelope=await pairBuildEnvelope({revision,parentRevision,priorContentHash,updatedAt:now,updatedByAccountId:context.accountId,updatedByDeviceId:context.deviceId,data});
  // WRITE PHASE
  transaction.set(pairRef,envelope);for(const write of indexWrites)transaction.set(pairCareerIndexReference(context,write.indexId),write.value);return{ok:true,rivalryId:normalizedRivalryId,managerRole:normalizedRole,managerId:manager.id,managerLabel:manager.label,connectionState,providerSaveId:binding.saveId,providerProfileId:binding.profileId,revision:envelope.revision,careerIndexAppended:indexWrites.length>0};};}
function pairCreateDurableCreationWitness(context,role,manager){return pairCreateDurablePairWitness(context,role,manager,null,"pending-pair");}
function pairCreateDurableRedemptionWitness(context,role,manager,rivalryId){return pairCreateDurablePairWitness(context,role,manager,rivalryId,"active");}

  async function pairEnsureSaveLibraryAuthority(){const runtime=root.CareerModeSaveLibraryRuntime;if(runtime?.isReady?.())return runtime;if(typeof root.loadRuntimeScript!=="function")throw pairErrorWithCode("PERSISTENT_PAIR_STORAGE_UNAVAILABLE","Career storage is unavailable.");await root.loadRuntimeScript("save-library-cutover","js/saveLibraryCutover.js",()=>typeof root.ensureSaveLibraryRuntimeAuthority==="function");await root.ensureSaveLibraryRuntimeAuthority();const active=root.CareerModeSaveLibraryRuntime;if(!active?.isReady?.())throw pairErrorWithCode("PERSISTENT_PAIR_STORAGE_UNAVAILABLE","Career storage could not be activated.");return active;}

  // r80: this browser's Save Library is a cache of the live Showdown. When the pair read says one is live here (ACTIVE, or Daniel's
  // own code still PENDING) and the exact shell is missing, it is rebuilt from the pair link's exact ids and the seasons in the
  // rivalry id (js/saveLibraryRuntime.js adoptOnlineEntry). No read or write; an exact shell is reused, another save never touched.
  async function pairAdoptOnlineShell(role,connectionState,rivalryId,saveId,profileId){const normalized=pairNormalizeManagerRole(role);if(connectionState!=="active"&&!(connectionState==="pending-pair"&&normalized==="playerOne"))return false;const runtime=await pairEnsureSaveLibraryAuthority();if(pairHasExactShowdownShell(normalized,saveId,profileId))return true;if(typeof runtime.adoptOnlineEntry!=="function")return false;return(await runtime.adoptOnlineEntry({saveId,profileId,role:normalized,totalRounds:pairSeasonFromCapability(rivalryId)}))?.ok===true;}
  async function pairDeleteExactPreparedShell(context,role,saveId,profileId){
    const normalizedRole=pairNormalizeManagerRole(role);
    if(!pairValidSaveId(saveId)||!pairValidProfileId(profileId))throw pairErrorWithCode("PERSISTENT_PAIR_BINDING_INVALID","The stale Showdown identity is invalid.");
    const runtime=await pairEnsureSaveLibraryAuthority(),binding=pairPreparedBindingForRole(context.pairing,normalizedRole);
    if(!binding)return{ok:true,status:"absent"};
    if(binding.saveId!==saveId||binding.profileId!==profileId)throw pairErrorWithCode("PERSISTENT_PAIR_LOCAL_CLEANUP_CONTEXT_CHANGED","The Showdown changed while the old connection was being removed. It was not deleted.");
    if(typeof runtime.deleteSave!=="function")throw pairErrorWithCode("PERSISTENT_PAIR_STORAGE_UNAVAILABLE","Safe Showdown removal is unavailable.");
    const result=runtime.deleteSave(saveId);
    if(!result||result.ok!==true||result.deletedSaveId!==saveId)throw pairErrorWithCode("PERSISTENT_PAIR_LOCAL_CLEANUP_FAILED","The old online connection was closed, but its unfinished Showdown could not be cleared.");
    try{root.sessionStorage?.removeItem("careerModeShowdown.sharedJourneyPending.v1");}catch(_error){}
    return{ok:true,status:"deleted",saveId};
  }

  async function pairInitialize(options={}){if(state.busy&&pairBusyAction&&!pairBusyAction.refreshing)return pairBusyAction.done.then(()=>state);if(pairInitializePromise&&!options.force)return pairInitializePromise;pairInitializePromise=(async()=>{try{const context=await pairResolveContext(),link=await pairReadPairLink(context);if(!link)return pairSetState({status:"unpaired",initialized:true,busy:false,accountId:context.accountId,deviceId:context.deviceId,managerRole:null,managerId:null,rivalryId:null,connectionState:null,providerSaveId:null,providerProfileId:null,capability:null,closedRivalryId:pairLastClosedRivalryId,closedProviderSaveId:pairLastClosedProviderSaveId,message:"Daniel and Nik need to connect before the first Showdown."});let localManagerId=pairCurrentIdentityManagerId();if(localManagerId!==link.managerId&&typeof options.reconcileIdentity==="function"){await options.reconcileIdentity(link.managerId,link.managerRole);localManagerId=pairCurrentIdentityManagerId();}if(localManagerId&&localManagerId!==link.managerId)throw pairErrorWithCode("PERSISTENT_PAIR_IDENTITY_MISMATCH","Your player selection does not match this Google account. Reload and choose its linked player.");/* r79 PR3: after a reload Daniel's waiting code keeps its CMS17R- form when it is still his first real pairing. *//* Codex #904: a check that cannot answer shows no code yet (CHECK STATUS asks again), never an unverified code. */let realUnknown=false;if(link.connectionState==="pending-pair"&&link.managerRole==="playerOne"&&pairRealRivalryId!==link.rivalryId){try{if(await pairDanielNeedsRealPairing(context))pairRealRivalryId=link.rivalryId;}catch(_error){realUnknown=true;}}pairRequestDurableStorage();const active=link.connectionState==="active";if(active)await pairEnsureSaveLibraryAuthority();await pairAdoptOnlineShell(link.managerRole,link.connectionState,link.rivalryId,link.providerSaveId,link.providerProfileId).catch(()=>false);const localRecoveryReady=active&&pairHasExactShowdownShell(link.managerRole,link.providerSaveId,link.providerProfileId);return pairSetState({status:active?(localRecoveryReady?"paired":"recovery-required"):"waiting",initialized:true,busy:false,closedRivalryId:null,closedProviderSaveId:null,accountId:context.accountId,deviceId:context.deviceId,managerRole:link.managerRole,managerId:link.managerId,rivalryId:link.rivalryId,connectionState:link.connectionState,providerSaveId:link.providerSaveId,providerProfileId:link.providerProfileId,capability:link.connectionState==="pending-pair"&&!realUnknown?(()=>{try{return pairBuildPlayerJoinCode(link.rivalryId,{real:pairRealRivalryId===link.rivalryId});}catch(_error){return link.rivalryId;}})():null,message:active?(localRecoveryReady?`Welcome back, ${link.managerLabel}. Your Showdown is ready.`:`The online Showdown is still live, but it could not be loaded here. Tap BACK, then LOAD SHOWDOWN on Home to try again, or restore a backup, or start over.`):realUnknown?"Your account could not be checked just now, so the code is not shown yet. Check your internet, then tap CHECK STATUS.":`${link.managerLabel} is ready. Waiting for the other player to join.`});}catch(error){return pairSetState({status:error?.code==="PERSISTENT_PAIR_AUTH_REQUIRED"?"signed-out":"unavailable",initialized:true,busy:false,accountId:null,deviceId:null,managerRole:null,managerId:null,rivalryId:null,connectionState:null,providerSaveId:null,providerProfileId:null,capability:null,message:error?.code==="PERSISTENT_PAIR_AUTH_REQUIRED"?(error?.message||"Sign in before continuing."):pairIsProductError(error)?error.message:`${pairPlainProviderMessage(error,"Your Showdown could not be checked right now.",{permissionMessage:"This Google account could not read your Showdown connection right now."})} Tap CHECK STATUS to try again.`});}})().finally(()=>{pairInitializePromise=null;});return pairInitializePromise;}
  function pairSelectedRole(){return state.managerRole||pairCurrentIdentityRole();}
  const PAIR_SEASON_NIBBLE=Object.freeze({1:"1",3:"3",5:"5",10:"a"});
  const PAIR_SEASON_BY_NIBBLE=Object.freeze({1:1,3:3,5:5,a:10});
  function pairPreparedTotalRounds(){try{const runtime=root.CareerModeSaveLibraryRuntime,library=runtime?.getLibrarySnapshot?.(),entry=library&&Array.isArray(library.saves)?library.saves.find(item=>item&&item.saveId===library.activeSaveId):null,showdown=entry?.showdown,rounds=Number(showdown?.totalRounds);return showdown?.sharedJourney?.mode==="shared"&&showdown?.sharedJourney?.setupPending===true&&[1,3,5,10].includes(rounds)?rounds:null;}catch(_error){return null;}}
  function pairCreateSeasonBoundCapability(totalRounds,cryptoImpl=root.crypto){const rounds=Number(totalRounds),marker=PAIR_SEASON_NIBBLE[rounds];if(!marker)throw pairErrorWithCode("PERSISTENT_PAIR_SEASON_SELECTION_REQUIRED","Choose the number of seasons before creating a connection code.");if(!cryptoImpl||typeof cryptoImpl.getRandomValues!=="function")throw pairErrorWithCode("PERSISTENT_PAIR_CRYPTO_UNAVAILABLE","Secure browser randomness is unavailable.");const bytes=new Uint8Array(32);cryptoImpl.getRandomValues(bytes);const hex=pairHexFromBytes(bytes);return pairNormalizeRivalryId(`pair_${marker}${hex.slice(1)}`);}
  function pairSeasonFromCapability(rivalryId){const normalized=pairNormalizeRivalryId(rivalryId),marker=normalized.slice(5,6).toLowerCase(),rounds=PAIR_SEASON_BY_NIBBLE[marker];if(!rounds)throw pairErrorWithCode("PERSISTENT_PAIR_JOIN_CODE_UPGRADE_REQUIRED","Ask Daniel to create a new connection code, then paste that new code here.");return rounds;}
  // r79 PR3: the first real pairing (Daniel holds a career start marker and no active partner yet) wraps the code as CMS17R-, so
  // Nik's phone knows to start his real career (write his marker) before redeeming. Every other code stays CMS17-.
  function pairBuildPlayerJoinCode(rivalryId,options={}){const normalized=pairNormalizeRivalryId(rivalryId);pairSeasonFromCapability(normalized);return `${options&&options.real===true?REAL_CODE_PREFIX:CODE_PREFIX}${normalized}`;}
  // BH-11 (#11): a pasted message such as "code: CMS17-pair_…" still joins when it holds exactly one code. Two different
  // codes in one paste stay invalid, and the error never echoes the pasted text.
  function pairExtractPastedCode(input){const found=new Map(),pattern=/(?:^|[^0-9a-z_])(CMS17(R?)-)?(pair_[0-9a-f]{64})(?![0-9a-z_])/gi;for(const match of input.matchAll(pattern)){const id=match[3].toLowerCase(),prior=found.get(id)||{wrapped:false,real:false};found.set(id,{wrapped:prior.wrapped||Boolean(match[1]),real:prior.real||/^r$/i.test(match[2]||"")});}if(found.size!==1)return null;const [[id,flags]]=[...found];return{id,wrapped:flags.wrapped,real:flags.real};}
  function pairParsePlayerJoinCode(value){const input=String(value||"").trim(),anchored=/^CMS17(R?)-(pair_[0-9a-f]{64})$/i.exec(input),extracted=anchored?{id:anchored[2],wrapped:true,real:/^r$/i.test(anchored[1])}:(/^pair_[0-9a-f]{64}$/i.test(input)?{id:input,wrapped:false,real:false}:pairExtractPastedCode(input));if(extracted&&extracted.wrapped){const rivalryId=pairNormalizeRivalryId(extracted.id);return{rivalryId,totalRounds:pairSeasonFromCapability(rivalryId),legacy:false,real:extracted.real===true};}if(extracted)return{rivalryId:pairNormalizeRivalryId(extracted.id),totalRounds:null,legacy:true,real:false};throw pairErrorWithCode("PAIRING_CAPABILITY_INVALID","Daniel's connection code is invalid.");}
  // r79: the active save of a Showdown that is already CLOSED (finished, or deleted on Daniel's phone; the pair-link read or the
  // DELETED notice says which rivalry and save) is not "a different unfinished Showdown". Its empty shell of the same length is
  // reused as before; otherwise Nik's JOIN makes a new shell beside it and that save stays in the library untouched.
  function pairClosedShowdownSaveId(role){return role==="playerTwo"&&!state.rivalryId&&/^pair_[0-9a-f]{64}$/.test(String(state.closedRivalryId||""))&&pairValidSaveId(state.closedProviderSaveId)?state.closedProviderSaveId:null;}
  async function pairProvisionJoinerBinding(context,role,totalRounds){let binding=pairPreparedBindingForRole(context.pairing,role);const closedSaveId=pairClosedShowdownSaveId(role);if(binding){const preparedRounds=pairPreparedTotalRounds();if(role==="playerTwo"&&Number(totalRounds)!==preparedRounds){if(binding.saveId!==closedSaveId)throw pairErrorWithCode("PERSISTENT_PAIR_SEASON_MISMATCH","You still have a different unfinished Showdown. End it in Settings (END SHOWDOWN), then paste Daniel's code again.");binding=null;}else return binding;}if(role!=="playerTwo")return pairEnsurePreparedBinding(context,role);if(![1,3,5,10].includes(Number(totalRounds)))throw pairErrorWithCode("PERSISTENT_PAIR_JOIN_CODE_UPGRADE_REQUIRED","Ask Daniel to create a new connection code, then paste that new code here.");const entry=await pairLoadSharedJourneyEntry();if(!entry||typeof entry.provisionJoinerShell!=="function")throw pairErrorWithCode("PERSISTENT_PAIR_SHARED_ENTRY_UNAVAILABLE","Nik's career could not be prepared automatically.");await entry.provisionJoinerShell(Number(totalRounds));binding=pairPreparedBindingForRole(context.pairing,role);if(!binding||pairPreparedTotalRounds()!==Number(totalRounds))throw pairErrorWithCode("PERSISTENT_PAIR_SHARED_SHELL_REQUIRED","Nik's career could not be prepared automatically.");return binding;}
  function pairAlreadyActiveState(){if(state.connectionState!=="active"||!state.rivalryId)return null;const recoveryRequired=state.status==="recovery-required";return pairSetState({status:recoveryRequired?"recovery-required":"paired",busy:false,message:recoveryRequired?state.message:"Daniel and Nik are already connected."});}
  function pairProviderConflictNeedsRefresh(error){return error?.code==="PERSISTENT_PAIR_PENDING_CONFLICT"||error?.code==="PERSISTENT_PAIR_ACTIVE_CONFLICT";}

  // Codex #904 (P1, twice): a permanent pair's code is created only while BOTH partner records, read again INSIDE the
  // code-creation transaction, still name each other. An UNPAIR on either side (another Daniel browser, or Nik's Settings) that
  // commits after the fresh reads in START then conflicts with this transaction (it retries and stops) instead of leaving an open
  // code Nik either could still redeem or can never join. Two more reads, only for a permanent pair's code.
  function pairCreationWhilePaired(context,role,real,witness,seen){const mine=role==="playerOne"&&!real?pairPartnerRecordFor(context.accountId):null;if(!mine||mine.active!==true||typeof witness!=="function")return witness;return async args=>{const own=await args.transaction.get(pairPartnerReference(context)),other=await args.transaction.get(pairPartnerReference(context,mine.partnerAccountId));let record=null,theirs=null;try{record=own.exists()?pairParsePartnerRecord(own.data(),context.accountId):null;}catch(_error){record=null;}try{theirs=other.exists()?pairParsePartnerRecord(other.data(),mine.partnerAccountId):null;}catch(_error){theirs=null;}if(!record||record.active!==true||record.partnerAccountId!==mine.partnerAccountId||record.myRole!==mine.myRole){seen.seen="here";seen.record=record;throw pairErrorWithCode("PERMANENT_PARTNER_UNPAIRED_HERE","Nik was unpaired on another screen, so nothing was started. Tap START to pair again.");}if(!theirs||theirs.active!==true||theirs.partnerAccountId!==context.accountId||theirs.myRole===mine.myRole){seen.seen="partner";seen.record=null;throw pairErrorWithCode("PARTNER_UNPAIRED","Nik is no longer paired with you, so nothing was started. Tap PAIR AGAIN.");}seen.seen=false;seen.record=null;return await witness(args);};}
  // The same on Nik's side: a permanent pair's plain code is redeemed only while Nik's own record, read again INSIDE the redeem
  // transaction, still names Daniel, so an UNPAIR from Nik's other browser conflicts with the join. One more read, only here.
  function pairRedeemWhilePaired(context,role,parsed,witness,seen){const mine=role==="playerTwo"&&!parsed.real?pairPartnerRecordFor(context.accountId):null;if(!mine||mine.active!==true||typeof witness!=="function")return witness;return async args=>{const own=await args.transaction.get(pairPartnerReference(context));let record=null;try{record=own.exists()?pairParsePartnerRecord(own.data(),context.accountId):null;}catch(_error){record=null;}if(!record||record.active!==true||record.partnerAccountId!==mine.partnerAccountId||record.myRole!==mine.myRole){seen.seen="here";seen.record=record;throw pairErrorWithCode("PERMANENT_PARTNER_UNPAIRED_HERE","This account was unpaired on another screen, so nothing was joined. Ask Daniel to pair again.");}seen.seen=false;seen.record=null;return await witness(args);};}
  function pairAdoptUnpairedHere(context,record){partnerState=pairFreezeDeep({status:record?"ready":"none",accountId:context.accountId,record:record?pairFreezeDeep(record):null,code:null,checkedAt:Date.now()});pairSetPartnerSide("not-paired",context.accountId,null);pairRealRivalryId=null;pairNotifyPartner();}
  async function pairStartPairing(options={}){if(state.busy)return state;const active=pairAlreadyActiveState();if(active)return active;const action=pairBeginBusyAction();pairSetState({status:"starting",busy:true,message:"Preparing your Showdown…"});try{const context=await pairResolveContext(),role=pairNormalizeManagerRole(options.managerRole||pairSelectedRole()),manager=pairRequireCurrentIdentity(role),binding=await pairEnsurePreparedBinding(context,role),totalRounds=pairPreparedTotalRounds(),capability=pairCreateSeasonBoundCapability(totalRounds),durableWitness=pairCreateDurableCreationWitness(context,role,manager);/* r79 PR3: before the code exists, know whether this is Daniel's first real pairing (CMS17R- code) or a Showdown of the permanent pair (JOIN note). Page memo: the marker once; the partner record is read fresh here (Codex #904). */const real=role==="playerOne"&&await pairDanielNeedsRealPairing(context,{fresh:true});if(role==="playerOne"&&!real&&!pairPartnerActiveFor("playerOne"))throw pairErrorWithCode("CAREER_START_REQUIRED","Go Home and tap START to begin your career. Nothing was started.");const unpairedHere={seen:false,record:null};/* Codex #915: a permanent-pair code only while Nik's record still names Daniel, read fresh here (seasons may have been chosen minutes after the START tap; one read per code). An UNPAIR on Nik's side or an unanswered check makes no code Nik cannot join; START then leads into PAIR AGAIN. */if(role==="playerOne"&&!real){const side=await pairReadPartnerSide({context,fresh:true});if(side.status!=="mutual"&&side.status!=="not-paired")throw side.status==="unpaired"?pairErrorWithCode("PARTNER_UNPAIRED","Nik is no longer paired with you, so nothing was started. Tap PAIR AGAIN."):pairRealModeUnknown();}const result=await context.pairing.createPairing({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,identity:await context.pairing.getOrCreateDeviceIdentity({indexedDBImpl:root.indexedDB,cryptoImpl:root.crypto}),...(pairPartnerActiveFor("playerOne")?{ttlMs:JOIN_INVITE_TTL_MS}:{}),binding,capability,cryptoImpl:root.crypto,durableWitness:pairCreationWhilePaired(context,role,real,durableWitness,unpairedHere)});if(!result?.ok){if(unpairedHere.seen==="here")pairAdoptUnpairedHere(context,unpairedHere.record);else if(unpairedHere.seen==="partner"){pairSetPartnerSide("unpaired",context.accountId,pairPartnerRecordFor(context.accountId)?.partnerAccountId||null);pairNotifyPartner();}throw pairErrorWithCode(result?.code||"PERSISTENT_PAIR_CREATE_FAILED",result?.message||"The connection code could not be created.");}const link=result.durableWitness;if(!link?.ok||link.rivalryId!==result.rivalryId)throw pairErrorWithCode("PERSISTENT_PAIR_RECOVERY_FAILED","The connection code could not be bound to durable account authority.");const other=role==="playerOne"?"Nik":"Daniel",playerCode=pairBuildPlayerJoinCode(result.capability,{real});pairRealRivalryId=real?link.rivalryId:null;pairRequestDurableStorage();/* Codex #904 (P2): a permanent pair's JOIN note is still part of this START, so the action stays busy (one flight: NEW CODE and CHECK STATUS cannot start a second createPairing) until the note write settles. */const partner=pairPartnerRecordFor(context.accountId),noteFollows=!real&&role==="playerOne"&&Boolean(partner&&partner.active===true&&partner.myRole==="playerOne");const waiting=pairSetState({status:"waiting",initialized:true,busy:noteFollows,accountId:context.accountId,deviceId:context.deviceId,managerRole:role,managerId:manager.id,rivalryId:link.rivalryId,connectionState:"pending-pair",providerSaveId:link.providerSaveId,providerProfileId:link.providerProfileId,capability:playerCode,message:`Send this code to ${other}. It is needed only once.`});/* r79 PR3: a permanent pair gets Nik's JOIN note in its OWN transaction after createPairing (the pairing commit is near the 20-access limit). A note that fails never breaks the Showdown: the code above still works. */if(noteFollows){const note=await pairWriteJoinNoteSafely({context,rivalryId:link.rivalryId,expiresAtEpochMs:result.expiresAtEpochMs});if(note.ok&&state.rivalryId===link.rivalryId&&state.connectionState==="pending-pair")return pairSetState({busy:false,message:"Nik can tap JOIN on his Home screen now. This code works too."});/* Codex #904: Nik's UNPAIR landed after the code but before its note (the note Rules refuse it), so Nik can never join this code. One fresh check, only when the note failed; the code is then closed so START can pair again. */if(!note.ok&&state.rivalryId===link.rivalryId&&state.connectionState==="pending-pair"){let side=null;try{side=await pairReadPartnerSide({context,fresh:true});}catch(_error){side=null;}if(side?.status==="unpaired"&&state.rivalryId===link.rivalryId){/* the close re-reads the link (as the conflict refresh does), so this action no longer holds it */action.refreshing=true;pairSetState({busy:false});let closed=false;try{closed=(await pairAbandonCurrentShowdown({expectedRivalryId:link.rivalryId}))?.ok===true;}catch(_error){closed=false;}/* Codex #923: only a confirmed close says nothing was started; otherwise the Showdown is still online and Settings DELETE is the retry */return pairSetState({status:"error",busy:false,capability:null,message:closed?"Nik is no longer paired with you, so nothing was started. Tap PAIR AGAIN.":"Nik is no longer paired with you, and this Showdown could not be closed yet. End it in Settings (END SHOWDOWN), then tap PAIR AGAIN."});}}return pairSetState({busy:false});}return waiting;}catch(error){if(pairProviderConflictNeedsRefresh(error)){action.refreshing=true;return await pairInitialize({force:true});}return pairSetState({status:error?.code?.includes("SHARED_SHELL")||error?.code==="PERSISTENT_PAIR_SEASON_SELECTION_REQUIRED"?"save-required":"error",busy:false,message:pairPlainProviderMessage(error,"The Showdown could not be started. Try again.",{clockHint:true,permissionMessage:"The connection code could not be created."})});}finally{action.release();}}
  // BH-11 (#7): the Save ids present before Nik's join, so a failed join can tell a shell it just created from an existing one.
  async function pairKnownSaveIds(){try{await pairEnsureSaveLibraryAuthority();const library=root.CareerModeSaveLibraryRuntime?.getLibrarySnapshot?.();return Array.isArray(library?.saves)?new Set(library.saves.map(entry=>entry&&entry.saveId).filter(Boolean)):null;}catch(_error){return null;}}
  // BH-11 (#3): read-only re-check after a failed join. checked=false means the outcome is unknown (keep everything).
  async function pairReadCommittedJoin(context,parsed,role){if(!context||!parsed||!role)return{checked:false,link:null};try{const link=await pairReadPairLink(context);return{checked:true,link:link&&link.rivalryId===parsed.rivalryId&&link.managerRole===role&&link.connectionState==="active"?link:null};}catch(_error){return{checked:false,link:null};}}
  async function pairJoinPairing(capability,options={}){if(state.busy)return state;const active=pairAlreadyActiveState();if(active)return active;const action=pairBeginBusyAction();pairSetState({status:"joining",busy:true,message:"Joining Daniel's Showdown…"});let parsed=null,context=null,role=null,manager=null,binding=null,createdShell=null;const unpairedHere={seen:false,record:null};try{parsed=pairParsePlayerJoinCode(capability);context=await pairResolveContext();role=pairNormalizeManagerRole(options.managerRole||pairSelectedRole());manager=pairRequireCurrentIdentity(role);/* r79 PR3: a CMS17R- code is Daniel's first real pairing. Nik starts his real career (his marker) BEFORE redeeming, because the marker must name exactly his career index as it is now; afterwards the new Showdown is already in it. */if(role==="playerTwo")await pairRequireJoinAllowed(context,parsed,role);if(parsed.real&&role==="playerTwo"){/* Codex #903: the R prefix is only text, so the code is first checked joinable (the same capability read the redeem makes); a code that cannot be joined writes nothing, not even the marker. */await pairCheckJoinableBeforeMarker(context,parsed.rivalryId,role);await pairEnsureOwnMarkerBeforeRealJoin();}const knownSaveIds=role==="playerTwo"?await pairKnownSaveIds():null;binding=await pairProvisionJoinerBinding(context,role,parsed.totalRounds);if(knownSaveIds&&binding&&!knownSaveIds.has(binding.saveId))createdShell={saveId:binding.saveId,profileId:binding.profileId};const rivalryId=parsed.rivalryId,durableWitness=pairRedeemWhilePaired(context,role,parsed,pairCreateDurableRedemptionWitness(context,role,manager,rivalryId),unpairedHere);const result=await context.pairing.redeemPairing({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,identity:await context.pairing.getOrCreateDeviceIdentity({indexedDBImpl:root.indexedDB,cryptoImpl:root.crypto}),binding,capability:rivalryId,cryptoImpl:root.crypto,durableWitness});if(!result?.ok&&unpairedHere.seen)pairAdoptUnpairedHere(context,unpairedHere.record);if(!result?.ok)throw pairErrorWithCode(result?.code||"PERSISTENT_PAIR_JOIN_FAILED",result?.message||"The code could not be joined.");const link=result.durableWitness;if(!link?.ok||link.rivalryId!==result.rivalryId)throw pairErrorWithCode("PERSISTENT_PAIR_RECOVERY_FAILED","The players could not be connected with durable recovery authority.");try{await pairAttachRecoveryPointer(context,binding,link.rivalryId);}catch(_error){}if(parsed.real&&role==="playerTwo"){pairRealRivalryId=link.rivalryId;await pairRecordRealPairing(link.rivalryId,role,context);}pairRequestDurableStorage();return pairSetState({status:"paired",initialized:true,busy:false,accountId:context.accountId,deviceId:context.deviceId,managerRole:role,managerId:manager.id,rivalryId:link.rivalryId,connectionState:"active",providerSaveId:link.providerSaveId,providerProfileId:link.providerProfileId,capability:null,message:`${manager.label} joined Daniel's Showdown. Continue Career when both players are ready.`});}catch(error){
    // BH-11 (#3): a lost acknowledgement can hide a join that did commit, and the retry then reads as "already used".
    const committed=await pairReadCommittedJoin(context,parsed,role);
    if(committed.link){const link=committed.link;if(manager&&binding&&binding.saveId===link.providerSaveId&&binding.profileId===link.providerProfileId){try{await pairAttachRecoveryPointer(context,binding,link.rivalryId);}catch(_error){}if(parsed.real&&role==="playerTwo"){pairRealRivalryId=link.rivalryId;await pairRecordRealPairing(link.rivalryId,role,context);}pairRequestDurableStorage();return pairSetState({status:"paired",initialized:true,busy:false,accountId:context.accountId,deviceId:context.deviceId,managerRole:role,managerId:manager.id,rivalryId:link.rivalryId,connectionState:"active",providerSaveId:link.providerSaveId,providerProfileId:link.providerProfileId,capability:null,message:`${manager.label} joined Daniel's Showdown. Continue Career when both players are ready.`});}action.refreshing=true;return await pairInitialize({force:true});}
    if(pairProviderConflictNeedsRefresh(error)){action.refreshing=true;return await pairInitialize({force:true});}
    // BH-11 (#7): remove only the empty local copy this attempt created, and only when the join was definitely refused.
    if(createdShell&&committed.checked&&pairJoinFailureIsDefinitive(error)){try{await pairDeleteExactPreparedShell(context,role,createdShell.saveId,createdShell.profileId);}catch(_error){}}
    return pairSetState({status:error?.code?.includes("SHARED_SHELL")?"save-required":"error",busy:false,message:pairContextualJoinMessage(error)});
  }finally{action.release();}}
function pairContextualJoinMessage(error){const pairing=root.CareerModeSparkPrivatePairing;if(pairing&&typeof pairing.pairingJoinErrorMessage==="function")return pairing.pairingJoinErrorMessage(error);return error?.message||"The code could not be joined.";}
  async function pairRetryPairLink(){if(state.busy||!state.rivalryId||!state.managerRole)return state;const priorConnectionState=state.connectionState,priorCapability=state.capability,providerSaveId=state.providerSaveId,providerProfileId=state.providerProfileId;pairSetState({status:"retrying-link",busy:true,message:"Finishing your connection…"});try{const context=await pairResolveContext(),role=pairNormalizeManagerRole(state.managerRole||pairSelectedRole()),manager=pairRequireCurrentIdentity(role);await pairAdoptOnlineShell(role,priorConnectionState,state.rivalryId,providerSaveId,providerProfileId).catch(()=>false);let binding=await pairExactLocalBindingForProviderSlot(context.pairing,role,providerSaveId,providerProfileId);if(!binding&&priorConnectionState==="pending-pair")binding=pairPreparedBindingForRole(context.pairing,role);if(!binding)throw pairErrorWithCode("PERSISTENT_PAIR_SHOWDOWN_NOT_LOADED","This Showdown could not be loaded here to finish the connection. Try again.");const link=await pairPersistPairLinkWithRetry(context,state.rivalryId,role,3);if(link.connectionState==="active"){const recovery=await pairAttachRecoveryPointer(context,binding,link.rivalryId);if(!recovery.ok)throw pairErrorWithCode(recovery.result?.code||"PERSISTENT_PAIR_ATTACH_FAILED",recovery.result?.message||"The Showdown connection was saved, but it could not be checked here yet. Try again.");return pairSetState({status:"paired",initialized:true,busy:false,accountId:context.accountId,deviceId:context.deviceId,managerRole:role,managerId:manager.id,rivalryId:link.rivalryId,connectionState:"active",providerSaveId:link.providerSaveId,providerProfileId:link.providerProfileId,capability:null,message:`${manager.label} is ready. Continue Career when both players are ready.`});}const other=role==="playerOne"?"Nik":"Daniel";return pairSetState({status:"waiting",initialized:true,busy:false,accountId:context.accountId,deviceId:context.deviceId,managerRole:role,managerId:manager.id,rivalryId:link.rivalryId,connectionState:"pending-pair",providerSaveId:link.providerSaveId,providerProfileId:link.providerProfileId,capability:priorCapability,message:`Connection saved. Send the code to ${other}. It is needed only once.`});}catch(error){return pairSetState({status:"pair-link-retry",busy:false,connectionState:priorConnectionState,providerSaveId,providerProfileId,capability:priorCapability,message:error?.message?`Connection still needs attention: ${error.message} Choose RETRY CONNECTION before leaving this page.`:"The connection still needs to be saved. Choose RETRY CONNECTION before leaving this page."});}}
  async function pairContinueOnlineShowdown(){if(state.busy||!state.rivalryId)return state;pairSetState({status:"continuing",busy:true,message:"Opening your career…"});try{const context=await pairResolveContext(),role=pairNormalizeManagerRole(state.managerRole||pairSelectedRole());pairRequireCurrentIdentity(role);await pairEnsureSaveLibraryAuthority();await pairAdoptOnlineShell(role,state.connectionState,state.rivalryId,state.providerSaveId,state.providerProfileId).catch(()=>false);const binding=await pairExactLocalBindingForProviderSlot(context.pairing,role,state.providerSaveId,state.providerProfileId);if(!binding)throw pairErrorWithCode("PERSISTENT_PAIR_SHOWDOWN_NOT_LOADED","This Showdown could not be loaded here. Check your connection and try again.");const recovery=await pairAttachRecoveryPointer(context,binding,state.rivalryId);if(!recovery.ok)throw pairErrorWithCode(recovery.result?.code||"PERSISTENT_PAIR_ATTACH_FAILED",recovery.result?.message||"The Showdown could not be checked here. Try again.");const entry=await pairLoadSharedJourneyEntry();if(!entry||typeof entry.openPanel!=="function")throw pairErrorWithCode("PERSISTENT_PAIR_SHARED_ENTRY_UNAVAILABLE","Career entry is unavailable.");entry.install?.();/* r80 resume (G7): an ACTIVE session goes straight back into the game, as after a reload */await entry.openPanel({resumeActive:true});return pairSetState({status:"paired",busy:false,connectionState:"active",message:"Career ready."});}catch(error){return pairSetState({status:error?.code==="PERSISTENT_PAIR_SHOWDOWN_NOT_LOADED"?"recovery-required":"error",busy:false,message:error?.message||"The career could not be opened."});}}
  // r79: once this device's own JOIN (Nik) or WAITING (Daniel) sees the pair ACTIVE it continues into the Showdown by itself,
  // as R6 already does for sessions. The Connect layer closes first; if continuing fails it opens again on the same screen
  // with START CAREER / TRY CONTINUE AGAIN as the fallback. It never acts for the other device.
  let pairAutoContinuePromise=null;
  function pairAutoContinueAfterConnect(){if(pairAutoContinuePromise)return pairAutoContinuePromise;if(state.busy||state.connectionState!=="active"||state.status!=="paired"||!state.rivalryId)return Promise.resolve(null);/* r79 PR3: however Daniel learned Nik joined his first real pairing, his record write starts with the continue (single-flight; this page's CMS17R- rivalry only) */if(state.managerRole==="playerOne"&&pairRealRivalryId===state.rivalryId)void pairRecordRealPairing(state.rivalryId,"playerOne");const layer=root.CareerModeConnectPlayersScreenV10;pairAutoContinuePromise=(async()=>{try{layer?.close?.({restoreFocus:false});}catch(_error){}const next=await pairContinueOnlineShowdown();if(next?.status!=="paired"){try{await layer?.open?.({sync:false,stayOnScreen:true});}catch(_error){}}return next;})().finally(()=>{pairAutoContinuePromise=null;});return pairAutoContinuePromise;}
  async function pairJoinAndContinue(capability,options={}){const wasActive=state.connectionState==="active",joined=await pairJoinPairing(capability,options);if(!wasActive&&options.autoContinue!==false&&joined?.status==="paired"&&joined.connectionState==="active")await pairAutoContinueAfterConnect();return joined;}

  // r79 PR3: the permanent pair (owner decisions 2026-10-17). accounts/{uid}/partner/current names the account this one paired
  // with through a real (marker-holding) pairing; accounts/{nikUid}/partnerInbox/current is the private JOIN note Daniel's START
  // leaves for Nik. Reads: the partner record once per page load; the note only when Nik's Home is shown or the tab comes
  // back, at most once per 30 s and never in render. Writes: the note in its own small transaction after createPairing; each
  // partner record once, by its owner, after the real pairing is ACTIVE. Every shape below is exactly what the pair fragment
  // of the Rules accepts (firestore.persistent-pair-production.fragment.rules, cmsPartner* functions).
  // Codex #908: a device clock can run ahead of the server; a code counts as expired here only 10 minutes after its expiry.
  const PAIR_CLOCK_MARGIN_MS=10*60*1000;
  // Job 12: only a permanent pair's Home START requests the full agreed JOIN window; the note keeps the invite's exact expiry.
  // One minute under the Rules cap (expiresAt <= request.time + 30 min), so a device clock running slightly fast never refuses START.
  const JOIN_INVITE_TTL_MS=29*60*1000;
  const PARTNER_DOC_ID="current",JOIN_NOTE_MEMO_MS=30000,JOIN_NOTE_WATCH_WINDOW_MS=600000,PARTNER_RETRY_MS=30000,REAL_CODE_PREFIX="CMS17R-",CODE_PREFIX="CMS17-",PARTNER_EVENT="career-mode-permanent-pair-change";
  const PARTNER_KEYS="active,myRole,pairedAt,pairedViaRivalryId,partnerAccountId,schemaVersion,updatedAt",NOTE_KEYS="createdAt,expiresAt,fromAccountId,rivalryId,schemaVersion,totalSeasons";
  let partnerState=pairFreezeDeep({status:"unknown",accountId:null,record:null,code:null,checkedAt:0}),partnerReadPromise=null;
  let joinNoteState=pairFreezeDeep({status:"unknown",accountId:null,note:null,code:null,checkedAt:0}),joinNotePromise=null,joinNoteExpiryTimer=null;
  // The rivalry this page made with a CMS17R- code (Daniel) or joined with one (Nik): only that pairing writes partner records.
  let pairRealRivalryId=null;
  function pairPartnerReference(context,accountId){return context.services.firestoreSdk.doc(context.services.firestore,"accounts",accountId||context.accountId,"partner",PARTNER_DOC_ID);}
  function pairInboxReference(context,accountId){return context.services.firestoreSdk.doc(context.services.firestore,"accounts",accountId,"partnerInbox",PARTNER_DOC_ID);}
  function pairParsePartnerRecord(value,accountId){const keys=value&&typeof value==="object"?Object.keys(value).sort().join(","):"";if(keys!==PARTNER_KEYS||value.schemaVersion!==1||typeof value.partnerAccountId!=="string"||!value.partnerAccountId||value.partnerAccountId===accountId||!MANAGER_BY_ROLE[value.myRole]||typeof value.active!=="boolean")throw pairErrorWithCode("PERMANENT_PARTNER_INVALID","The saved partner record is invalid.");return pairFreezeDeep({partnerAccountId:value.partnerAccountId,myRole:value.myRole,pairedViaRivalryId:pairNormalizeRivalryId(value.pairedViaRivalryId),pairedAtEpochMs:pairTimestampMillis(value.pairedAt),active:value.active});}
  function pairParseJoinNote(value,partnerAccountId){try{const keys=value&&typeof value==="object"?Object.keys(value).sort().join(","):"";if(keys!==NOTE_KEYS||value.schemaVersion!==1||typeof partnerAccountId!=="string"||value.fromAccountId!==partnerAccountId)return null;const rivalryId=pairNormalizeRivalryId(value.rivalryId),totalSeasons=pairSeasonFromCapability(rivalryId),expiresAtEpochMs=pairTimestampMillis(value.expiresAt);if(value.totalSeasons!==totalSeasons||!Number.isFinite(expiresAtEpochMs))return null;return pairFreezeDeep({rivalryId,totalSeasons,fromAccountId:value.fromAccountId,createdAtEpochMs:pairTimestampMillis(value.createdAt),expiresAtEpochMs});}catch(_error){return null;}}
  function pairPartnerRecordFor(accountId){return partnerState.status==="ready"&&partnerState.accountId===accountId?partnerState.record:null;}
  function pairPartnerActiveFor(role){const record=pairPartnerRecordFor(state.accountId||partnerState.accountId);return Boolean(record&&record.active===true&&(!role||record.myRole===role));}
  function pairNotifyPartner(){try{if(typeof root.dispatchEvent==="function"&&typeof root.CustomEvent==="function")root.dispatchEvent(new root.CustomEvent(PARTNER_EVENT,{detail:{partner:partnerState.status,note:joinNoteState.status}}));}catch(_error){}pairRender();}
  function pairServerTime(sdk){if(typeof sdk?.serverTimestamp!=="function")throw pairErrorWithCode("PERMANENT_PARTNER_PROVIDER_UNAVAILABLE","The online service is not ready yet. Try again.");return sdk.serverTimestamp();}
  // Read once per page load per account (a failed read is tried again at most every 30 s). Never throws.
  // Codex #904/#918: fresh (code creation and redeem only) reads the server itself (no copy, no read already in flight), so an
  // UNPAIR from another device counts at once.
  async function pairReadPartnerRecord(options={}){let context;try{context=options.context||await pairResolveContext();}catch(_error){return partnerState;}const accountId=context.accountId,now=Date.now(),fresh=options.fresh===true;if(!fresh&&partnerState.accountId===accountId&&(partnerState.status==="ready"||partnerState.status==="none"||(partnerState.status==="unavailable"&&now-partnerState.checkedAt<PARTNER_RETRY_MS)))return partnerState;if(!fresh&&partnerReadPromise&&partnerReadPromise.accountId===accountId)return partnerReadPromise.promise;const promise=(async()=>{try{const ref=pairPartnerReference(context);if(fresh)root.CareerModeFirestoreBudget?.readServerNext?.(ref.path);const record=await context.services.firestoreSdk.runTransaction(context.services.firestore,async transaction=>{const snapshot=await transaction.get(ref);return snapshot.exists()?pairParsePartnerRecord(snapshot.data(),accountId):null;});partnerState=pairFreezeDeep({status:record?"ready":"none",accountId,record,code:null,checkedAt:Date.now()});}catch(error){partnerState=pairFreezeDeep({status:"unavailable",accountId,record:null,code:error?.code||"PERMANENT_PARTNER_UNAVAILABLE",checkedAt:Date.now()});}pairNotifyPartner();return partnerState;})().finally(()=>{if(partnerReadPromise&&partnerReadPromise.promise===promise)partnerReadPromise=null;});partnerReadPromise={accountId,promise};return promise;}
  // One partner record write, by its owner, only while the named rivalry is ACTIVE with both managers in their own slots.
  // Daniel writes his only after this transaction has read the rivalry ACTIVE with Nik's account in the playerTwo slot.
  // requirePartnerRecord (reload recovery): also require the other manager's own record to name this account already.
  async function pairWritePartnerRecord(options={}){const context=options.context||await pairResolveContext(),sdk=context.services.firestoreSdk,rivalryId=pairNormalizeRivalryId(options.rivalryId||state.rivalryId),role=pairNormalizeManagerRole(options.managerRole||state.managerRole||pairSelectedRole());pairRequireCurrentIdentity(role);const result=await sdk.runTransaction(context.services.firestore,async transaction=>{
    // READ PHASE
    const rivalrySnapshot=await transaction.get(pairRivalryReference(context,rivalryId)),rivalry=rivalrySnapshot.exists()?rivalrySnapshot.data():null,slots=rivalry?.data?.managerSlots;
    if(!pairIsEnvelopeValue(rivalry,"rivalry",rivalryId)||rivalry.data.connectionState!=="active"||!Array.isArray(slots)||slots.length!==2||slots[0]?.slotId!=="playerOne"||slots[1]?.slotId!=="playerTwo"||slots[0].entitlementState!=="active"||slots[1].entitlementState!=="active"||!Array.isArray(rivalry.data.authorizedAccountIds)||rivalry.data.authorizedAccountIds.length!==2)throw pairErrorWithCode("PERMANENT_PARTNER_PAIRING_INACTIVE","Daniel and Nik are not connected in this Showdown yet.");
    const mine=role==="playerOne"?slots[0]:slots[1],theirs=role==="playerOne"?slots[1]:slots[0];
    if(mine.accountId!==context.accountId||typeof theirs.accountId!=="string"||!theirs.accountId||theirs.accountId===context.accountId)throw pairErrorWithCode("PERMANENT_PARTNER_MEMBERSHIP_MISSING","This account is not part of this Showdown.");
    if(options.requirePartnerRecord===true){const other=await transaction.get(pairPartnerReference(context,theirs.accountId)),value=other.exists()?pairParsePartnerRecord(other.data(),theirs.accountId):null;if(!value)throw pairErrorWithCode("PERMANENT_PARTNER_NOT_FOUND","The other manager has no saved partner record yet.");if(value.active!==true||value.partnerAccountId!==context.accountId||value.myRole===role)throw pairErrorWithCode("PERMANENT_PARTNER_NOT_CONFIRMED","The other manager has not confirmed this pairing.");}
    const ref=pairPartnerReference(context),snapshot=await transaction.get(ref),existing=snapshot.exists()?pairParsePartnerRecord(snapshot.data(),context.accountId):null;
    // Job 14: both post-JOIN writes may have dropped. The existing marker and rivalry are durable proof of a real
    // pairing (the same hidden-id and time boundaries as cmsPartnerPairingValid), so no foreign missing-document read
    // is needed. Re-read own absence and the exact current link in this transaction; UNPAIR is never absence.
    if(options.recoverMissing===true){
      if(existing)throw pairErrorWithCode("PERMANENT_PARTNER_NOT_CONFIRMED","This account already has a saved partner decision.");
      const linkSnapshot=await transaction.get(pairLinkReference(context)),link=linkSnapshot.exists()?pairParsePairLink(linkSnapshot.data(),context.accountId):null;
      const markerSnapshot=await transaction.get(sdk.doc(context.services.firestore,"accounts",context.accountId,"careerStart",PARTNER_DOC_ID));
      const markerApi=await pairLoadCareerStartMarker(),marker=markerSnapshot.exists()?markerApi?.parseMarker?.(markerSnapshot.data()):null;
      const createdAt=pairTimestampMillis(rivalry.data.createdAt),marginMs=(role==="playerOne"?5:35)*60*1000;
      if(!link||link.rivalryId!==rivalryId||link.managerRole!==role||!marker||marker.status!=="ready"||marker.hiddenRivalryIds.includes(rivalryId)||!Number.isFinite(createdAt)||createdAt<marker.startedAt-marginMs||!rivalry.data.authorizedAccountIds.includes(mine.accountId)||!rivalry.data.authorizedAccountIds.includes(theirs.accountId))throw pairErrorWithCode("PERMANENT_PARTNER_NOT_CONFIRMED","This Showdown has not confirmed a real pairing.");
    }
    if(existing&&existing.active===true){if(existing.partnerAccountId===theirs.accountId&&existing.myRole===role)return{ok:true,status:"already-paired",record:existing};throw pairErrorWithCode("PERMANENT_PARTNER_CONFLICT","This account is paired with another account. Unpair it in Settings first.");}
    // WRITE PHASE (create, or re-pair after UNPAIR)
    transaction.set(ref,{schemaVersion:1,partnerAccountId:theirs.accountId,myRole:role,pairedViaRivalryId:rivalryId,pairedAt:pairServerTime(sdk),active:true,updatedAt:pairServerTime(sdk)});
    return{ok:true,status:existing?"re-paired":"paired",record:pairFreezeDeep({partnerAccountId:theirs.accountId,myRole:role,pairedViaRivalryId:rivalryId,pairedAtEpochMs:Date.now(),active:true})};});
    partnerState=pairFreezeDeep({status:"ready",accountId:context.accountId,record:result.record,code:null,checkedAt:Date.now()});joinNoteState=pairFreezeDeep({status:"unknown",accountId:null,note:null,code:null,checkedAt:0});/* r79 PR4: this page just (re)paired through a real pairing both managers write: no partner-side read for it. */pairSetPartnerSide("mutual",context.accountId,result.record.partnerAccountId);pairNotifyPartner();return result;}
  // Never throws: a partner record that cannot be written is tried once more, then left for retriable reload recovery.
  let pairRealRecording=null;
  // Single-flight per rivalry: the waiting poll and any other path that ends Daniel's wait (#901 pairContinueAfterWaitEnded) share one write; a write that ended without a record may be tried again later.
  function pairRecordRealPairing(rivalryId,role,context=null){let id;try{id=pairNormalizeRivalryId(rivalryId);}catch(_error){return Promise.resolve(null);}if(pairRealRivalryId!==id)return Promise.resolve(null);if(pairRealRecording&&pairRealRecording.id===id&&pairRealRecording.role===role)return pairRealRecording.promise;const promise=(async()=>{for(let attempt=0;attempt<2;attempt+=1){try{return await pairWritePartnerRecord({context:context||undefined,rivalryId:id,managerRole:role});}catch(error){if(!error||!PAIR_AMBIGUOUS_PROVIDER_CODES.has(pairProviderCode(error)))return null;}}return null;})().then(result=>{if(!result&&pairRealRecording?.promise===promise)pairRealRecording=null;return result;});pairRealRecording={id,role,promise};return promise;}
  // Reload recovery first uses the other manager's confirmation as before. If that record is also missing (a
  // foreign missing get is permission-denied under the existing Rules), recover ONLY an absent own record from
  // the durable real-career proof. Failures stay pending, bounded to one attempt per 30 s, with one flight per page.
  let pairPartnerRecoveryTried=false,pairPartnerRecoveryPromise=null,pairPartnerRecoveryRetryAt=0;
  function pairEnsurePartnerRecord(){
    if(pairPartnerRecoveryPromise)return pairPartnerRecoveryPromise;
    if(pairPartnerRecoveryTried||Date.now()<pairPartnerRecoveryRetryAt||state.status!=="paired"||state.connectionState!=="active"||!state.rivalryId||(state.managerRole!=="playerOne"&&state.managerRole!=="playerTwo"))return Promise.resolve(null);
    const rivalryId=state.rivalryId,role=state.managerRole;
    pairPartnerRecoveryRetryAt=Date.now()+PARTNER_RETRY_MS;
    pairPartnerRecoveryPromise=(async()=>{try{
      const context=await pairResolveContext(),partner=await pairReadPartnerRecord({context});
      if(role==="playerOne"){
        if(partner.status!=="none"&&!(partner.status==="ready"&&partner.record.active===false))return null;
        if(!await pairDanielNeedsRealPairing(context))return null;
      }else{
        if(partner.status!=="none")return null;
        const api=await pairLoadCareerStartMarker(),marker=api&&typeof api.readCurrentMarker==="function"?await api.readCurrentMarker():null;
        if(marker?.status!=="ready")return null;
      }
      let result;
      try{result=await pairWritePartnerRecord({context,rivalryId,managerRole:role,requirePartnerRecord:true});}
      catch(error){
        if(partner.status!=="none"||(error?.code!=="PERMANENT_PARTNER_NOT_FOUND"&&pairProviderCode(error)!=="permission-denied"))throw error;
        result=await pairWritePartnerRecord({context,rivalryId,managerRole:role,recoverMissing:true});
      }
      pairPartnerRecoveryTried=true;return result;
    }catch(_error){return null;}})().finally(()=>{pairPartnerRecoveryPromise=null;});
    return pairPartnerRecoveryPromise;
  }
  async function pairLoadCareerStartMarker(){if(root.CareerModeCareerStartMarker)return root.CareerModeCareerStartMarker;if(typeof root.loadRuntimeScript!=="function")return null;try{await root.loadRuntimeScript("career-start-marker","js/careerStartMarker.js",()=>Boolean(root.CareerModeCareerStartMarker));}catch(_error){return null;}return root.CareerModeCareerStartMarker||null;}
  // Daniel's first real pairing: his account is real (careerStart/current exists) and has no active partner record yet.
  // Codex #904 (10-season audit): fails closed. A partner or marker read that cannot answer throws, so a real account never gets a
  // plain test code by accident (that Showdown would count for Daniel and later be hidden for Nik); START shows a retry, writes nothing.
  function pairRealModeUnknown(){return pairErrorWithCode("REAL_MODE_CHECK_UNAVAILABLE","Your account could not be checked just now, so nothing was started. Check your internet, then try again.");}
  async function pairReadOwnMarkerStatus(options={}){const api=await pairLoadCareerStartMarker();if(!api||typeof api.readCurrentMarker!=="function")throw pairRealModeUnknown();let marker;try{if(options.fresh===true)api.clearCache?.();marker=await api.readCurrentMarker();}catch(_error){throw pairRealModeUnknown();}if(marker?.status==="ready"||marker?.status==="none")return marker.status;throw pairRealModeUnknown();}
  async function pairDanielNeedsRealPairing(context,options={}){const partner=await pairReadPartnerRecord({context,fresh:options.fresh===true});if(partner.status==="ready"&&partner.record.active===true)return false;if(partner.status!=="ready"&&partner.status!=="none")throw pairRealModeUnknown();return await pairReadOwnMarkerStatus()==="ready";}
  // Codex #904 (10-season audit) and #909: an active partner record authorises a join (CMS17- or CMS17R-, the R is only text) only
  // in its own seat and only for a code that partner made. Without a partner record, plain codes are retired.
  // First pairing requires the real prefix; it writes Nik's marker before redemption.
  async function pairRequireJoinAllowed(context,parsed,role){const rivalryId=parsed.rivalryId,partner=await pairReadPartnerRecord({context,fresh:true});/* Codex #909: the permanent pair's plain code must come from the recorded partner (the creator never changes; the same two reads the redeem makes) */if(partner.status==="ready"&&partner.record.active===true){if(partner.record.myRole!==role)throw pairErrorWithCode("PARTNER_ROLE_MISMATCH","This Google account is paired in the other manager's seat, so it cannot join here. Choose your own manager on Home, then join again.");const code=await pairCheckJoinableBeforeMarker(context,rivalryId,role);if(code.createdByAccountId!==partner.record.partnerAccountId)throw pairErrorWithCode("PLAIN_CODE_NOT_FROM_PARTNER","This code was not made by the account you are paired with, so it cannot join. Use JOIN on Home, or the code on your partner's phone.");return;}if(partner.status!=="ready"&&partner.status!=="none")throw pairRealModeUnknown();/* a CMS17R- code without an active record is the first real pairing: its own checks follow (joinable first, then the marker) */if(parsed.real)return;throw pairErrorWithCode("REAL_PAIRING_CODE_REQUIRED","Ask Daniel to tap START on Home and send a new pairing code (it starts with CMS17R-).");}
  // Read-only capability check (rivalry + invite, exactly what the redeem transaction reads and Rules allow a code holder to get):
  // pending-pair, invite for private pairing, open, unexpired, for the playerTwo slot, that slot still free, made by another account.
  // Any read failure or failed check throws the redeem's own error, so the normal join error is shown and nothing is written.
  async function pairCheckJoinableBeforeMarker(context,rivalryId,role){const sdk=context.services.firestoreSdk,id=pairNormalizeRivalryId(rivalryId),fail=(code,message)=>{throw pairErrorWithCode(code,message);};/* a read Rules refuse (an expired or used code is not readable by a code holder) rejects as the redeem would: same error */const [rivalry,invite]=await sdk.runTransaction(context.services.firestore,async transaction=>{const r=await transaction.get(pairRivalryReference(context,id)),i=await transaction.get(sdk.doc(context.services.firestore,"rivalries",id,"invites",id));return[r.exists()?r.data():null,i.exists()?i.data():null];});
    if(!pairIsEnvelopeValue(rivalry,"rivalry",id)||!pairIsEnvelopeValue(invite,"invite",id))fail("PAIRING_CAPABILITY_NOT_FOUND","The private pairing code was not found.");
    const d=invite.data||{},r=rivalry.data||{},expires=pairTimestampMillis(d.expiresAt),slots=Array.isArray(r.managerSlots)?r.managerSlots:[],target=slots.find(slot=>slot&&slot.slotId===role);
    if(d.purpose!=="rivalry-pairing")fail("PAIRING_SCOPE_DENIED","This capability is not valid for private rivalry pairing.");
    if(d.createdByAccountId===context.accountId)fail("PAIRING_CREATOR_CANNOT_REDEEM","This Google account made the code, so it cannot join it. Nik must sign in with a different Google account than Daniel, then paste the code again.");
    if(d.state!=="open")fail("PAIRING_CAPABILITY_ALREADY_USED","This private pairing code is no longer open.");
    if(!Number.isFinite(expires)||expires<=Date.now())fail("PAIRING_CAPABILITY_EXPIRED","This private pairing code has expired.");
    if(d.slotId!==role)fail("PAIRING_SLOT_MISMATCH",`This code is for ${d.slotId==="playerOne"?"Daniel":"Nik"}. Choose ${d.slotId==="playerOne"?"Daniel":"Nik"} for this phone on Home, then join again.`);
    if(r.connectionState!=="pending-pair"||slots.length!==2)fail("PAIRING_RIVALRY_NOT_JOINABLE","This private rivalry is not waiting for exactly one manager.");
    if(!target||target.accountId!==null||target.entitlementState!=="open")fail("PAIRING_TWO_MANAGER_LIMIT","The second manager slot is no longer open.");
    return{createdByAccountId:d.createdByAccountId};}
  async function pairEnsureOwnMarkerBeforeRealJoin(){const api=await pairLoadCareerStartMarker();if(!api||typeof api.readCurrentMarker!=="function"||typeof api.startRealCareer!=="function")throw pairErrorWithCode("CAREER_START_UNAVAILABLE","Your real career could not be started right now. Try again.");const marker=await api.readCurrentMarker();if(marker?.status==="ready")return marker;return api.startRealCareer();}
  // Daniel's START for the permanent pair: the note names his own open pending rivalry with the invite's exact expiry. Its own
  // transaction (no reads when createPairing handed the expiry over). Rules refuse a same-rivalry rewrite inside 60 s.
  async function pairWriteJoinNote(options={}){const context=options.context||await pairResolveContext(),sdk=context.services.firestoreSdk,partner=pairPartnerRecordFor(context.accountId);if(!partner||partner.active!==true||partner.myRole!=="playerOne")return{ok:false,status:"not-paired"};const rivalryId=pairNormalizeRivalryId(options.rivalryId),totalSeasons=pairSeasonFromCapability(rivalryId),ref=pairInboxReference(context,partner.partnerAccountId);await sdk.runTransaction(context.services.firestore,async transaction=>{let expiresAt=Number.isFinite(options.expiresAtEpochMs)?sdk.Timestamp.fromMillis(options.expiresAtEpochMs):null;if(!expiresAt){const invite=await transaction.get(sdk.doc(context.services.firestore,"rivalries",rivalryId,"invites",rivalryId)),value=invite.exists()?invite.data():null;if(!pairIsEnvelopeValue(value,"invite",rivalryId)||value.data?.state!=="open"||value.data?.createdByAccountId!==context.accountId)throw pairErrorWithCode("JOIN_NOTE_INVITE_UNAVAILABLE","This connection code is no longer open.");expiresAt=value.data.expiresAt;}if(!(pairTimestampMillis(expiresAt)>Date.now()))throw pairErrorWithCode("JOIN_NOTE_EXPIRED","This connection code has already expired.");transaction.set(ref,{schemaVersion:1,rivalryId,totalSeasons,fromAccountId:context.accountId,createdAt:pairServerTime(sdk),expiresAt});});return{ok:true,status:"written",rivalryId,totalSeasons,partnerAccountId:partner.partnerAccountId};}
  async function pairWriteJoinNoteSafely(options){try{return await pairWriteJoinNote(options);}catch(error){const code=error?.code||"JOIN_NOTE_FAILED";/* Codex #903: diagnosable, no UI (the code still works) */root.console?.warn?.(`[Career Mode Showdown] JOIN note for Nik could not be written (${code}); the code still works.`);return{ok:false,status:"failed",code};}}
  function pairScheduleJoinNoteExpiry(){if(joinNoteExpiryTimer!==null){root.clearTimeout?.(joinNoteExpiryTimer);joinNoteExpiryTimer=null;}const note=joinNoteState.note,wait=note?note.expiresAtEpochMs-Date.now():-1;if(wait>0&&typeof root.setTimeout==="function"){/* re-render only (no read): an expired JOIN offers CHECK STATUS on Home */joinNoteExpiryTimer=root.setTimeout(()=>{joinNoteExpiryTimer=null;pairNotifyPartner();},Math.min(wait+50,2147483000));joinNoteExpiryTimer?.unref?.();}}
  // Nik's note read: only for an active playerTwo partner record, only while visible, at most once per 30 s (a failed read
  // counts too). Never throws; the result is page memory that render and whichShowdownIsLive read without another read.
  async function pairReadJoinNote(options={}){let context;try{context=options.context||await pairResolveContext();}catch(_error){return joinNoteState;}const accountId=context.accountId,partner=pairPartnerRecordFor(accountId);if(!partner||partner.active!==true||partner.myRole!=="playerTwo"){if(joinNoteState.status!=="not-paired"||joinNoteState.accountId!==accountId){joinNoteState=pairFreezeDeep({status:"not-paired",accountId,note:null,code:null,checkedAt:0});pairScheduleJoinNoteExpiry();}return joinNoteState;}if(pairJoinNoteListening(accountId))return joinNoteState;/* the live listener already holds the server's copy */if(options.fresh!==true&&joinNoteState.accountId===accountId&&joinNoteState.checkedAt>0&&Date.now()-joinNoteState.checkedAt<JOIN_NOTE_MEMO_MS)return joinNoteState;/* Codex #903: an explicit tap (fresh) bypasses the memo; still one read in flight */if(joinNotePromise)return joinNotePromise;if(root.document?.visibilityState==="hidden")return joinNoteState;joinNotePromise=(async()=>{const ref=pairInboxReference(context,accountId);noteLastReadAt=Date.now();try{root.CareerModeFirestoreBudget?.wantFresh?.(ref.path);const note=await context.services.firestoreSdk.runTransaction(context.services.firestore,async transaction=>{const snapshot=await transaction.get(ref);return snapshot.exists()?pairParseJoinNote(snapshot.data(),partner.partnerAccountId):null;});joinNoteState=pairFreezeDeep({status:"ready",accountId,note,code:null,checkedAt:Date.now()});}catch(error){joinNoteState=pairFreezeDeep({status:"unavailable",accountId,note:null,code:error?.code||"JOIN_NOTE_UNAVAILABLE",checkedAt:Date.now()});}pairScheduleJoinNoteExpiry();pairNotifyPartner();return joinNoteState;})().finally(()=>{joinNotePromise=null;});return joinNotePromise;}
  // Nik's call (2026-10-18, "check by itself"): while Nik's Home is shown and the tab is visible, ONE onSnapshot listener watches
  // accounts/{nikUid}/partnerInbox/current, so reads happen only on attach and when the note changes. It detaches when JOIN shows,
  // Home is left, the tab is hidden, or 10 minutes after the Home visit began; a new Home visit or the tab becoming visible
  // re-attaches it. Never more than one listener, never from render. A listener that errors falls back to the memoised read
  // (at most once per 30 s) with the same stop rules.
  const JOIN_NOTE_FIRST_DELIVERY_MS=5000;
  let noteWatch={mode:null,unsubscribe:null,timer:null,attachTimer:null,until:0,isHomeShown:null,accountId:null,delivered:false,first:null,seq:0};
  // Codex #904: app switching (tab hidden -> visible) never costs more than one note read per 30 s and never restarts the
  // 10-minute Home visit; a new Home visit (navigation) attaches at once.
  let noteLastReadAt=0,noteVisitUntil=0;
  function pairJoinNoteWatchStop(){const w=noteWatch;/* Codex #903: what the listener delivered is never served as the 30 s memo after it detaches */if(w.mode==="listen"&&joinNoteState.via==="listener")joinNoteState=pairFreezeDeep({...joinNoteState,via:null,checkedAt:0});if(w.timer!==null)root.clearTimeout?.(w.timer);if(w.attachTimer!==null)root.clearTimeout?.(w.attachTimer);if(typeof w.unsubscribe==="function"){try{w.unsubscribe();}catch(_error){}}w.first?.(false);noteWatch={mode:null,unsubscribe:null,timer:null,attachTimer:null,until:0,isHomeShown:null,accountId:null,delivered:false,first:null,seq:w.seq+1};/* Job 12: a bounded wait that stops must redraw Home with its existing CHECK STATUS action. */if(pairJoinNoteView().watchPaused)pairNotifyPartner();return false;}
  function pairJoinNoteWatchWanted(){const shown=noteWatch.isHomeShown;if(typeof shown!=="function"||root.document?.visibilityState==="hidden")return false;try{if(shown()!==true)return false;}catch(_error){return false;}if(state.rivalryId&&(state.connectionState==="active"||state.connectionState==="pending-pair"))return false;if(!pairPartnerActiveFor("playerTwo"))return false;if(root.CareerModeFirestoreBudget?.paused?.()===true)return false;return !pairJoinNoteView().note&&Date.now()<noteWatch.until;}
  function pairJoinNoteWatchTimer(ms,fn){if(noteWatch.timer!==null)root.clearTimeout?.(noteWatch.timer);noteWatch.timer=typeof root.setTimeout==="function"?root.setTimeout(()=>{noteWatch.timer=null;fn();},Math.max(0,ms)):null;noteWatch.timer?.unref?.();}
  // listener mode: the only timer is the end of the 10-minute window
  function pairJoinNoteWindowTimer(){pairJoinNoteWatchTimer(noteWatch.until-Date.now(),()=>{if(!pairJoinNoteWatchWanted())pairJoinNoteWatchStop();else pairJoinNoteWindowTimer();});}
  // fallback mode: the memoised read, at most once per 30 s, same stop rules
  function pairJoinNoteFallbackTick(){if(!pairJoinNoteWatchWanted())return pairJoinNoteWatchStop();const seq=noteWatch.seq;void pairReadJoinNote().finally(()=>{if(noteWatch.seq!==seq)return;if(!pairJoinNoteWatchWanted())return pairJoinNoteWatchStop();pairJoinNoteWatchTimer(Math.min(JOIN_NOTE_MEMO_MS,noteWatch.until-Date.now()),pairJoinNoteFallbackTick);});}
  function pairJoinNoteFallback(){if(typeof noteWatch.unsubscribe==="function"){try{noteWatch.unsubscribe();}catch(_error){}}noteWatch.unsubscribe=null;noteWatch.mode="fallback";noteWatch.delivered=false;noteWatch.first?.(false);noteWatch.first=null;pairJoinNoteWatchTimer(Math.max(0,JOIN_NOTE_MEMO_MS-(Date.now()-(joinNoteState.checkedAt||0))),pairJoinNoteFallbackTick);}
  async function pairJoinNoteSnapshotApi(context){/* r85: deliveries are counted by the budget layer's read meter */const meter=root.CareerModeFirestoreBudget?.meterSdk||(s=>s);const sdk=context.services.firestoreSdk;if(typeof sdk.onSnapshot==="function"&&typeof sdk.doc==="function")return meter(sdk);const url=root.CareerModeProductionFirebaseRuntime?.firebaseFirestoreModule;if(typeof url!=="string"||!url)return null;try{const module=await import(url);return module&&typeof module.onSnapshot==="function"&&typeof module.doc==="function"?meter(module):null;}catch(_error){return null;}}
  function pairJoinNoteDelivery(seq,accountId,partnerAccountId,snapshot){if(noteWatch.seq!==seq||noteWatch.mode!=="listen")return;if(snapshot?.metadata?.fromCache)return;let note=null;try{note=snapshot&&snapshot.exists()?pairParseJoinNote(snapshot.data(),partnerAccountId):null;}catch(_error){note=null;}joinNoteState=pairFreezeDeep({status:"ready",accountId,note,code:null,checkedAt:Date.now(),via:"listener"});noteWatch.delivered=true;noteWatch.first?.(true);noteWatch.first=null;pairScheduleJoinNoteExpiry();pairNotifyPartner();if(!pairJoinNoteWatchWanted())pairJoinNoteWatchStop();}
  async function pairJoinNoteAttach(){const seq=noteWatch.seq;let context;try{context=await pairResolveContext();}catch(_error){if(noteWatch.seq===seq)pairJoinNoteFallback();return;}const partner=pairPartnerRecordFor(context.accountId),api=await pairJoinNoteSnapshotApi(context);if(noteWatch.seq!==seq)return;if(!partner||!pairJoinNoteWatchWanted())return pairJoinNoteWatchStop();if(!api)return pairJoinNoteFallback();try{const ref=api.doc(context.services.firestore,"accounts",context.accountId,"partnerInbox",PARTNER_DOC_ID);noteWatch.accountId=context.accountId;noteLastReadAt=Date.now();/* r79 PR5: a listener re-attached once the cache holds the note gets a first snapshot from the cache (ignored); metadata changes deliver the identical server copy */noteWatch.unsubscribe=api.onSnapshot(ref,{includeMetadataChanges:true},snapshot=>pairJoinNoteDelivery(seq,context.accountId,partner.partnerAccountId,snapshot),()=>{if(noteWatch.seq===seq&&noteWatch.mode==="listen")pairJoinNoteFallback();});}catch(_error){pairJoinNoteFallback();}}
  // Resolves true once the listener has delivered the note from the server (page memory is then current), false otherwise.
  function pairWatchJoinNote(options={}){if(typeof options.isHomeShown!=="function")return Promise.resolve(pairJoinNoteWatchStop());try{if(options.isHomeShown()===true)pairEndClosedOnHome();}catch(_error){}const now=Date.now(),resume=options.resume===true;if(!resume||!(noteVisitUntil>now))noteVisitUntil=now+JOIN_NOTE_WATCH_WINDOW_MS;noteWatch.isHomeShown=options.isHomeShown;noteWatch.until=noteVisitUntil;if(!pairJoinNoteWatchWanted())return Promise.resolve(pairJoinNoteWatchStop());
    if(noteWatch.mode==="listen"){pairJoinNoteWindowTimer();if(noteWatch.delivered)return Promise.resolve(true);if(noteWatch.attachTimer!==null){if(resume)return Promise.resolve("deferred");/* a tap or a new Home visit never waits for the deferred attach (Codex #907) */root.clearTimeout?.(noteWatch.attachTimer);noteWatch.attachTimer=null;void pairJoinNoteAttach();}}
    else if(noteWatch.mode==="fallback"){if(noteWatch.timer===null)pairJoinNoteFallbackTick();return Promise.resolve(false);}
    else{noteWatch.mode="listen";pairJoinNoteWindowTimer();const wait=resume?noteLastReadAt+JOIN_NOTE_MEMO_MS-now:0;
      // a tab return within 30 s of the last note read keeps page memory and attaches at the 30 s mark (if still wanted)
      if(wait>0&&typeof root.setTimeout==="function"){const seq=noteWatch.seq;noteWatch.attachTimer=root.setTimeout(()=>{if(noteWatch.seq!==seq)return;noteWatch.attachTimer=null;if(pairJoinNoteWatchWanted())void pairJoinNoteAttach();else pairJoinNoteWatchStop();},wait);noteWatch.attachTimer?.unref?.();return Promise.resolve("deferred");}
      void pairJoinNoteAttach();}
    if(!noteWatch.firstPromise||noteWatch.firstSeq!==noteWatch.seq){noteWatch.firstSeq=noteWatch.seq;noteWatch.firstPromise=new Promise(resolve=>{let done=false;const finish=value=>{if(done)return;done=true;resolve(value);};noteWatch.first=finish;if(typeof root.setTimeout==="function")root.setTimeout(()=>finish(false),JOIN_NOTE_FIRST_DELIVERY_MS);});}
    return noteWatch.firstPromise;}
  function pairJoinNoteListening(accountId){return noteWatch.mode==="listen"&&noteWatch.delivered===true&&noteWatch.accountId===accountId&&joinNoteState.accountId===accountId;}
  if(root.document?.addEventListener)root.document.addEventListener("visibilitychange",()=>{if(root.document.visibilityState==="hidden")pairJoinNoteWatchStop();});
  // Pure view of the memo: the note only while unexpired and not the Showdown this account already joined or closed.
  function pairJoinNoteView(nowEpochMs=Date.now()){const note=joinNoteState.status==="ready"&&joinNoteState.accountId===state.accountId?joinNoteState.note:null,valid=Boolean(note&&note.expiresAtEpochMs>nowEpochMs&&note.rivalryId!==state.rivalryId&&note.rivalryId!==state.closedRivalryId);return pairFreezeDeep({status:joinNoteState.status,checked:joinNoteState.status==="ready"&&joinNoteState.accountId===state.accountId,partnerActive:pairPartnerActiveFor("playerTwo"),watchPaused:!valid&&!noteWatch.mode&&Boolean(note&&note.expiresAtEpochMs<=nowEpochMs||noteVisitUntil>0&&nowEpochMs>=noteVisitUntil),note:valid?note:null});}
  // r79 PR4 one-sided UNPAIR: the partner's OWN record, read once per page load and only while this account's record is
  // active (the Rules let a partner get it only while it names this account). It answers "does the other manager still
  // name me?": active and naming me -> mutual; active:false, or not readable because it names someone else or was never
  // written -> unpaired (Home and Settings say so and offer PAIR AGAIN). A transient failure claims nothing and is not
  // retried on this page. A pairing or unpair made on this page updates the memo without a read. Daniel's START tap reads it
  // again (options.fresh, Codex #904), so an UNPAIR Nik made after this page loaded is seen before a code is made.
  let partnerSideState=pairFreezeDeep({status:"unknown",accountId:null,partnerAccountId:null,code:null}),partnerSidePromise=null;
  function pairSetPartnerSide(status,accountId,partnerAccountId,code=null){partnerSideState=pairFreezeDeep({status,accountId,partnerAccountId,code});return partnerSideState;}
  async function pairReadPartnerSide(options={}){let context;try{context=options.context||await pairResolveContext();}catch(_error){return partnerSideState;}const accountId=context.accountId,mine=pairPartnerRecordFor(accountId);if(!mine||mine.active!==true){if(partnerSideState.accountId!==accountId||partnerSideState.status!=="not-paired")pairSetPartnerSide("not-paired",accountId,null);return partnerSideState;}if(options.fresh!==true&&partnerSideState.accountId===accountId&&partnerSideState.partnerAccountId===mine.partnerAccountId&&partnerSideState.status!=="unknown")return partnerSideState;if(options.fresh!==true&&partnerSidePromise&&partnerSidePromise.accountId===accountId)return partnerSidePromise.promise;const promise=(async()=>{try{const ref=pairPartnerReference(context,mine.partnerAccountId);/* Codex #915/#918: a fresh read reaches the server itself (no shared snapshot, no read already in flight) */if(options.fresh===true)root.CareerModeFirestoreBudget?.readServerNext?.(ref.path);const value=await context.services.firestoreSdk.runTransaction(context.services.firestore,async transaction=>{const snapshot=await transaction.get(ref);return snapshot.exists()?snapshot.data():null;});let theirs=null;try{theirs=value?pairParsePartnerRecord(value,mine.partnerAccountId):null;}catch(_error){theirs=null;}pairSetPartnerSide(theirs&&theirs.active===true&&theirs.partnerAccountId===accountId&&theirs.myRole!==mine.myRole?"mutual":"unpaired",accountId,mine.partnerAccountId);}catch(error){pairSetPartnerSide(pairProviderCode(error)==="permission-denied"?"unpaired":"unavailable",accountId,mine.partnerAccountId,error?.code||"PARTNER_SIDE_UNAVAILABLE");}pairNotifyPartner();return partnerSideState;})().finally(()=>{if(partnerSidePromise&&partnerSidePromise.promise===promise)partnerSidePromise=null;});partnerSidePromise={accountId,promise};return promise;}
  // UNPAIR (Settings, r79 PR4: UNPAIR and PAIR AGAIN): active:false and updatedAt only. Blocked while a Showdown is in progress (Q2): an ACTIVE
  // rivalry, or a pending one whose code is still open, must be finished or deleted first.
  async function pairUnpair(){if(state.busy)throw pairErrorWithCode("PERSISTENT_PAIR_BUSY","The current Showdown connection is busy. Try again when the current action finishes.");const context=await pairResolveContext(),sdk=context.services.firestoreSdk;const result=await sdk.runTransaction(context.services.firestore,async transaction=>{
    const link=await transaction.get(pairLinkReference(context)),linked=link.exists()?link.data()?.data?.rivalryId:null;
    if(typeof linked==="string"&&/^pair_[0-9a-f]{64}$/.test(linked)){let connection=null,open=false;/* Codex #903: fail closed. If the linked Showdown cannot be read, nothing is unpaired. */try{const rivalry=await transaction.get(pairRivalryReference(context,linked));connection=rivalry.exists()?rivalry.data()?.data?.connectionState??null:null;if(connection==="pending-pair"){const invite=await transaction.get(sdk.doc(context.services.firestore,"rivalries",linked,"invites",linked)),value=invite.exists()?invite.data():null,expires=pairTimestampMillis(value?.data?.expiresAt);/* Codex #908: this clock may be ahead of the server */open=value?.data?.state==="open"&&Number.isFinite(expires)&&expires>Date.now()-PAIR_CLOCK_MARGIN_MS;}}catch(_error){throw pairErrorWithCode("PERMANENT_PARTNER_UNPAIR_UNVERIFIED","The current Showdown could not be checked, so nothing was unpaired. Try again when you are online.");}
      if(connection==="active"||(connection==="pending-pair"&&open))throw pairErrorWithCode("PERMANENT_PARTNER_UNPAIR_BLOCKED","Finish or end the current Showdown before you unpair.");}
    const ref=pairPartnerReference(context),snapshot=await transaction.get(ref);
    if(!snapshot.exists())return{ok:true,status:"not-paired",record:null};
    const raw=snapshot.data(),record=pairParsePartnerRecord(raw,context.accountId);
    if(record.active!==true)return{ok:true,status:"already-unpaired",record};
    /* Codex #904 pairing audit: Nik's own link still names the last Showdown while Daniel's next code waits in his mailbox, and a
       second Nik browser could redeem it meanwhile. UNPAIR waits for that code too (only here: up to three reads, only on UNPAIR). */
    if(record.myRole==="playerTwo"){let waiting=false;try{const inbox=await transaction.get(pairInboxReference(context,context.accountId)),note=inbox.exists()?pairParseJoinNote(inbox.data(),record.partnerAccountId):null;
      if(note&&note.rivalryId!==linked&&note.expiresAtEpochMs>Date.now()-PAIR_CLOCK_MARGIN_MS){const rivalry=await transaction.get(pairRivalryReference(context,note.rivalryId));if(rivalry.exists()&&rivalry.data()?.data?.connectionState==="pending-pair"){const invite=await transaction.get(sdk.doc(context.services.firestore,"rivalries",note.rivalryId,"invites",note.rivalryId)),value=invite.exists()?invite.data():null,expires=pairTimestampMillis(value?.data?.expiresAt);waiting=value?.data?.state==="open"&&Number.isFinite(expires)&&expires>Date.now()-PAIR_CLOCK_MARGIN_MS;}}}
      catch(_error){throw pairErrorWithCode("PERMANENT_PARTNER_UNPAIR_UNVERIFIED","The current Showdown could not be checked, so nothing was unpaired. Try again when you are online.");}
      if(waiting)throw pairErrorWithCode("PERMANENT_PARTNER_UNPAIR_BLOCKED","Daniel's next Showdown is waiting for you. Join it, or wait until its code expires, before you unpair.");}
    transaction.set(ref,{...raw,active:false,updatedAt:pairServerTime(sdk)});
    return{ok:true,status:"unpaired",record:pairFreezeDeep({...record,active:false})};});
    partnerState=pairFreezeDeep({status:result.record?"ready":"none",accountId:context.accountId,record:result.record,code:null,checkedAt:Date.now()});joinNoteState=pairFreezeDeep({status:"not-paired",accountId:context.accountId,note:null,code:null,checkedAt:0});pairSetPartnerSide("not-paired",context.accountId,null);pairRealRivalryId=null;pairScheduleJoinNoteExpiry();pairNotifyPartner();return{ok:true,status:result.status};}

async function pairOpenRecoverySurface(){try{
  root.careerModeLegacyDataTools=true;
  if(typeof root.openOptionalModule!=="function"||await root.openOptionalModule("legacy")!==true){root.careerModeLegacyDataTools=false;throw pairErrorWithCode("PERSISTENT_PAIR_RECOVERY_UI_UNAVAILABLE","Verified backup restore is unavailable on this screen.");}
  root.mountCareerModeRestorePanel?.();
  const panel=root.document?.getElementById("careerModeRestorePanel");
  if(!panel)throw pairErrorWithCode("PERSISTENT_PAIR_RECOVERY_UI_UNAVAILABLE","No backup restore panel is available. Return Home and choose Start a Showdown to begin fresh.");
  const input=panel.querySelector('input[type="file"]');
  panel.scrollIntoView?.({block:"start",behavior:"auto"});
  if(input){
    input.focus();
    panel.scrollIntoView?.({block:"start",behavior:"auto"});
  }
  return true;
}catch(error){
  if(typeof root.showScreen==="function")root.showScreen("mainMenu",false);
  pairSetState({status:"recovery-required",busy:false,message:error?.message||"Verified backup restore could not be opened. Choose START OVER to begin a new Showdown."});
  return false;
}}
async function pairDiscardStalePendingConnection(){
  if(state.busy)return false;
  let remoteClosed=false;
  try{
    const refreshed=await pairInitialize({force:true});
    if(refreshed?.status==="unpaired"||refreshed?.connectionState==="closed")return true;
    const identityRole=pairCurrentIdentityRole();
    if(!refreshed||refreshed.connectionState!=="pending-pair"||refreshed.managerRole!=="playerTwo"||identityRole!=="playerTwo"||!refreshed.rivalryId){
      throw pairErrorWithCode("PERSISTENT_PAIR_STALE_PENDING_STATE_CHANGED","This old connection changed. Nothing was deleted. Review the current screen and try again.");
    }
    const rivalryId=refreshed.rivalryId,providerSaveId=refreshed.providerSaveId,providerProfileId=refreshed.providerProfileId;
    const confirmed=await pairAskConfirm("Delete this old connection and start fresh? This closes the stale online connection and clears only its unfinished Showdown so Nik can join the new code Daniel creates.","danger");
    // BH-11 (#2): only an explicit yes deletes; a missing or blocked confirm box never counts as consent.
    if(confirmed!==true)return false;
    const rechecked=await pairInitialize({force:true});
    if(!rechecked||rechecked.connectionState!=="pending-pair"||rechecked.managerRole!=="playerTwo"||pairCurrentIdentityRole()!=="playerTwo"||rechecked.rivalryId!==rivalryId||rechecked.providerSaveId!==providerSaveId||rechecked.providerProfileId!==providerProfileId){
      throw pairErrorWithCode("PERSISTENT_PAIR_STALE_PENDING_STATE_CHANGED","This old connection changed after confirmation. Nothing was deleted. Review the current screen and try again.");
    }
    const context=await pairResolveContext();
    const closed=await pairAbandonCurrentShowdown({expectedRivalryId:rivalryId,expectedSaveId:providerSaveId});
    if(!closed||closed.ok!==true)throw pairErrorWithCode("PERSISTENT_PAIR_ABANDON_FAILED","The old connection could not be closed safely.");
    remoteClosed=true;
    await pairDeleteExactPreparedShell(context,"playerTwo",providerSaveId,providerProfileId);
    return pairSetState({...state,status:"unpaired",busy:false,managerRole:null,managerId:null,rivalryId:null,connectionState:null,providerSaveId:null,providerProfileId:null,capability:null,message:"Old connection and unfinished test Showdown deleted. Paste the new code Daniel sends."});
  }catch(error){
    const prefix=remoteClosed?"The old online connection was closed, but its unfinished Showdown was not cleared yet. ":"Old connection cleanup could not finish. ";
    return pairSetState({...state,status:remoteClosed?"save-required":state.status,busy:false,message:prefix+(error?.message||"Nothing else was changed.")});
  }
}

// r79: START OVER goes through the same canonical START as Home (Daniel: seasons; Nik: JOIN, never the seasons screen).
async function pairOpenCanonicalStart(){
  const identity=root.CareerModeOnlinePlayerIdentity;
  if(identity&&typeof identity.openStart==="function"){const decision=await identity.openStart();return decision!==null&&decision!==false;}
  return typeof root.navigateTo==="function"
    ? await root.navigateTo("createShowdown",{addToHistory:false,allowCanonicalFallback:true})
    : (typeof root.showScreen==="function"?root.showScreen("createShowdown",false):false);
}
async function pairStartOverFromRecovery(){
  if(state.busy)return false;
  try{
    const refreshed=await pairInitialize({force:true});
    if(refreshed?.connectionState==="active"&&refreshed.status==="paired"){
      pairSetState({status:"paired",busy:false,message:"Your restored career is ready. Continue Career instead of deleting it."});
      return false;
    }
    if(refreshed?.status==="unpaired"||refreshed?.connectionState==="closed"){
      const opened=await pairOpenCanonicalStart();
      return opened!==false;
    }
    if(!refreshed||refreshed.status!=="recovery-required"||refreshed.connectionState!=="active"||!refreshed.rivalryId){
      throw pairErrorWithCode("PERSISTENT_PAIR_RECOVERY_STATE_CHANGED","The old Showdown state changed. Nothing was deleted. Review the current screen and try again.");
    }
    const rivalryId=refreshed.rivalryId;
    const confirmed=await pairAskConfirm("Delete the old Showdown and start over? This closes the old online Showdown for both players. Your player identity, registered device, Legacy history and app settings are kept.","danger");
    // BH-11 (#2): only an explicit yes deletes; a missing or blocked confirm box never counts as consent.
    if(confirmed!==true)return false;
    const rechecked=await pairInitialize({force:true});
    if(rechecked?.connectionState==="active"&&rechecked.status==="paired"){
      pairSetState({status:"paired",busy:false,message:"Your restored career is ready. Continue Career instead of deleting it."});
      return false;
    }
    if(!rechecked||rechecked.status!=="recovery-required"||rechecked.connectionState!=="active"||rechecked.rivalryId!==rivalryId){
      throw pairErrorWithCode("PERSISTENT_PAIR_RECOVERY_STATE_CHANGED","The old Showdown changed after confirmation. Nothing was deleted. Review the current screen and try again.");
    }
    const closed=await pairAbandonCurrentShowdown({expectedRivalryId:rivalryId});
    if(!closed||closed.ok!==true)throw pairErrorWithCode("PERSISTENT_PAIR_ABANDON_FAILED","The old Showdown could not be closed safely.");
    const opened=await pairOpenCanonicalStart();
    if(opened===false)throw pairErrorWithCode("PERSISTENT_PAIR_START_OVER_ROUTE_FAILED","The new Showdown screen could not be opened.");
    return true;
  }catch(error){
    pairSetState({status:state.status==="paired"?"paired":"recovery-required",busy:false,message:`Start over could not finish. ${error?.message||"The old Showdown was not changed."}`});
    return false;
  }
}

  function pairCreateElement(tag,className,text){const element=root.document.createElement(tag);if(className)element.className=className;if(text!==undefined&&text!==null)element.textContent=String(text);return element;}
  function pairCopyText(value){if(root.navigator?.clipboard?.writeText)return root.navigator.clipboard.writeText(value).then(()=>true).catch(()=>false);return Promise.resolve(false);}
  function pairRoleLabel(role){if(!role)return root.CareerModeOnlinePlayerIdentity?.getState?.().managerLabel||"PLAYER";return pairManagerForRole(role).label;}
  function pairRender(){if(!root.document)return null;const shell=root.document.querySelector("#connectPlayersScreen #connectPlayersPairSlot");if(!shell)return null;let panel=root.document.getElementById(PANEL_ID);if(!panel){panel=pairCreateElement("section","stateNote");panel.id=PANEL_ID;Object.assign(panel.style,{margin:"0 0 14px",padding:"14px 16px",border:"1px solid rgba(255,255,255,.16)",background:"rgba(5,10,17,.7)"});shell.append(panel);}if(panel.parentNode!==shell)shell.append(panel);const typed=root.document.getElementById(CODE_INPUT_ID),typedFocus=Boolean(typed&&root.document.activeElement===typed),typedStart=typed?.selectionStart,typedEnd=typed?.selectionEnd;if(typed)pairDraftCode=typed.value;if(!state.accountId||state.connectionState)pairDraftCode="";panel.replaceChildren();const staleNikPending=state.connectionState==="pending-pair"&&state.managerRole==="playerTwo"&&pairCurrentIdentityRole()==="playerTwo",titleText=state.status==="pair-link-retry"?"FINISH CONNECTION":state.connectionState==="active"?(state.status==="recovery-required"?"OLD SHOWDOWN FOUND":"CAREER READY"):state.connectionState==="pending-pair"?(staleNikPending?"OLD CONNECTION FOUND":"WAITING FOR THE OTHER PLAYER"):"CONNECT PLAYERS",messageText=staleNikPending?"This old test connection cannot be used in the current Daniel-hosted flow. Delete it, then wait for Daniel's new code.":state.message,title=pairCreateElement("strong","",titleText),message=pairCreateElement("p","",messageText);message.style.margin="6px 0 10px";panel.append(title,message);if(!state.accountId){if(state.status==="unavailable"){/* BH-11 (#6): a transient startup error keeps a retry on the panel. */const retryRow=pairCreateElement("div",""),retry=pairCreateElement("button","menuButton","CHECK STATUS");retry.type="button";retry.disabled=state.busy;retry.addEventListener("click",()=>{if(state.busy)return;pairSetState({busy:true,message:"Checking your Showdown connection…"});void pairInitialize({force:true});});retryRow.append(retry);panel.append(retryRow);}return panel;}const actions=pairCreateElement("div","");Object.assign(actions.style,{display:"flex",flexWrap:"wrap",gap:"8px",alignItems:"center"});if(state.status==="pair-link-retry"){const retry=pairCreateElement("button","menuButton","RETRY CONNECTION");retry.type="button";retry.disabled=state.busy;retry.addEventListener("click",()=>void pairRetryPairLink());actions.append(retry,pairCreateElement("span","",state.connectionState==="active"?"DO NOT REFRESH UNTIL THE CONNECTION IS SAVED":"SAVE THE CONNECTION BEFORE SHARING THE CODE"));}else if(state.connectionState==="active"&&state.status==="recovery-required"){const startOver=pairCreateElement("button","menuButton dangerButton pairRecoverySecondary","DELETE OLD SHOWDOWN & START OVER"),recover=pairCreateElement("button","menuButton","RESTORE BACKUP");startOver.type=recover.type="button";startOver.disabled=recover.disabled=state.busy;startOver.addEventListener("click",()=>void pairStartOverFromRecovery());recover.addEventListener("click",()=>void pairOpenRecoverySurface());/* QoL 1 (BH-12): the safe RESTORE BACKUP leads in layout and focus order; the delete keeps its own confirm and stays on the screen. */actions.append(recover,startOver,pairCreateElement("span","","THIS SHOWDOWN COULD NOT BE LOADED HERE"));}else if(state.connectionState==="active"){const open=pairCreateElement("button","menuButton",state.status==="error"?"TRY CONTINUE AGAIN":"START CAREER");open.type="button";open.disabled=state.busy;open.addEventListener("click",()=>void pairContinueOnlineShowdown());actions.append(open,pairCreateElement("span","",pairRoleLabel(state.managerRole)));}else if(state.status==="unpaired"||state.status==="save-required"||state.status==="error"){const role=pairSelectedRole();if(role==="playerOne"&&partnerSideState.status==="unpaired"&&pairPartnerRecordFor(partnerSideState.accountId)?.active===true){/* Codex #915: Nik unpaired while Daniel chose seasons. CREATE CODE would only repeat the error, so the one way forward is START's PAIR AGAIN (his stale record goes inactive, then the first-pairing code). */const again=pairCreateElement("button","menuButton","PAIR AGAIN");again.type="button";again.disabled=state.busy;again.addEventListener("click",()=>void root.CareerModeOnlinePlayerIdentity?.openStart?.());actions.append(again,pairCreateElement("span","","NIK UNPAIRED, SO A NEW PAIRING CODE IS MADE FOR HIM"));}else if(role==="playerOne"&&pairPreparedTotalRounds()===null){/* r79: no seasons chosen yet, so the code cannot be made; the one way forward is the seasons screen (no bounce). */const seasons=pairCreateElement("button","menuButton","CHOOSE SEASONS");seasons.type="button";seasons.disabled=state.busy;seasons.addEventListener("click",()=>{root.CareerModeConnectPlayersScreenV10?.close?.({restoreFocus:false});if(typeof root.navigateTo==="function")void root.navigateTo("createShowdown");else root.showScreen?.("createShowdown");});actions.append(seasons,pairCreateElement("span","","DANIEL CHOOSES THE SEASONS, THEN THE CODE FOR NIK IS MADE"));}else if(role==="playerOne"){const start=pairCreateElement("button","menuButton","CREATE CODE FOR NIK");start.type="button";start.disabled=state.busy;start.addEventListener("click",()=>void pairStartPairing({managerRole:"playerOne"}));actions.append(start,pairCreateElement("span","","DANIEL STARTS THE SHOWDOWN AND SENDS THIS CODE TO NIK"));}else if(role==="playerTwo"){const input=pairCreateElement("input","settingsConnectedAccountInput");input.id=CODE_INPUT_ID;input.type="text";input.placeholder="Paste Daniel's code";input.autocomplete="off";input.spellcheck=false;input.style.minWidth="min(330px,100%)";input.value=pairDraftCode;const join=pairCreateElement("button","menuButton","JOIN DANIEL'S SHOWDOWN");join.type="button";join.disabled=state.busy;join.addEventListener("click",()=>{if(!input.value.trim()){pairSetState({message:"Paste Daniel's code first, then press Join."});return;}void pairJoinAndContinue(input.value,{managerRole:"playerTwo"});});actions.append(input,join,pairCreateElement("span","","NIK ENTERS THE CODE DANIEL SENDS"));}else{actions.append(pairCreateElement("span","","CHOOSE DANIEL OR NIK FOR THIS DEVICE FIRST"));}}else if(staleNikPending){const discard=pairCreateElement("button","menuButton dangerButton","DELETE OLD CONNECTION & START FRESH"),refresh=pairCreateElement("button","menuButton","CHECK STATUS");discard.type=refresh.type="button";discard.disabled=refresh.disabled=state.busy;discard.addEventListener("click",()=>void pairDiscardStalePendingConnection());refresh.addEventListener("click",()=>void pairInitialize({force:true}));actions.append(discard,refresh,pairCreateElement("span","","NIK WAITS FOR THE NEW CODE DANIEL CREATES"));}else if(state.status==="starting"&&state.busy){/* r80: while a code is being made only "Preparing your Showdown…" shows, as for a first START; an older open code (the one being replaced) is never shown meanwhile */}else if(state.connectionState==="pending-pair"&&state.capability){const code=pairCreateElement("code","",state.capability),copy=pairCreateElement("button","menuButton","COPY CODE"),refresh=pairCreateElement("button","menuButton","CHECK STATUS"),replace=pairCreateElement("button","menuButton","NEW CODE");code.style.wordBreak="break-all";copy.type=refresh.type=replace.type="button";copy.addEventListener("click",async()=>{const ok=await pairCopyText(state.capability);pairSetState({message:ok?"Code copied. Send it to the other player.":"Select the full code shown here and copy it manually."});});refresh.addEventListener("click",()=>void pairInitialize({force:true}));replace.addEventListener("click",()=>void pairStartPairing({managerRole:state.managerRole}));actions.append(code,copy,refresh,replace);}else if(state.connectionState==="pending-pair"){const refresh=pairCreateElement("button","menuButton","CHECK STATUS");refresh.type="button";refresh.addEventListener("click",()=>void pairInitialize({force:true}));actions.append(refresh,pairCreateElement("span","","If the original code expired, create a new one."));}panel.append(actions);const restored=typedFocus&&root.document.getElementById(CODE_INPUT_ID);if(restored){restored.focus();try{restored.setSelectionRange(typedStart,typedEnd);}catch(_error){}}return panel;}
  function pairSubscribe(listener){if(typeof listener!=="function")return()=>{};pairListeners.add(listener);return()=>pairListeners.delete(listener);}

  if(root.addEventListener){root.addEventListener("career-mode-online-identity-change",()=>pairRender());root.addEventListener("online",()=>{if(state.initialized)void pairInitialize({force:true});});}
  // r79: DELETE CURRENT SHOWDOWN on the other phone closes this pair's rivalry without a terminal witness. This page's own
  // Terminal Close read (the one it already makes) reports it as DELETED; the pair then holds exactly what its next pair-link
  // read would return (unpaired, that closed rivalry and its save), with no read of its own, so Home's JOIN note watch and the
  // next JOIN treat it as closed instead of as a live Showdown. Codex #910: it is held at every later publication (after a busy
  // action settles, or when an in-flight or overlapping pair read answers with the old live rivalry), never lost.
  // r79 PR5 (two-player journey): a normal finish (CLOSED, with its witness) is let go the same way, but only once Home is
  // shown again, because the Final Winner screen, Final Reconciliation and Apply still run on it.
  function pairHeldIfEnded(next){if(next.busy||!next.rivalryId||!endedRivalryIds.has(next.rivalryId)||!["active","pending-pair"].includes(next.connectionState))return next;endedHeldNow=true;return {...next,status:"unpaired",initialized:true,busy:false,managerRole:null,managerId:null,rivalryId:null,connectionState:null,providerSaveId:null,providerProfileId:null,capability:null,closedRivalryId:next.rivalryId,closedProviderSaveId:pairValidSaveId(next.providerSaveId)?next.providerSaveId:null,message:"Daniel and Nik need to connect before the first Showdown."};}
  // Codex #910: Home may already be showing (its JOIN note watch stopped while the Showdown was live), so the page is told once
  // the ended Showdown is let go; Nik's Home then redraws and watches Daniel's next JOIN note without a tap.
  function pairAnnounceEnded(){endedHeldNow=false;const closedRivalryId=state.closedRivalryId;/* after this state change has finished, never inside it */void Promise.resolve().then(()=>{try{if(typeof root.dispatchEvent==="function"&&typeof root.CustomEvent==="function")root.dispatchEvent(new root.CustomEvent("career-mode-permanent-pair-ended",{detail:{closedRivalryId}}));}catch(_error){}});}
  function pairEndRivalry(rivalryId){endedRivalryIds.add(rivalryId);if(!state.busy&&state.rivalryId===rivalryId)pairSetState({});}
  function pairEndClosedOnHome(){const rivalryId=closedOnHomeRivalryId;if(!rivalryId)return;closedOnHomeRivalryId=null;pairEndRivalry(rivalryId);}
  function pairOnShowdownDeleted(event){const detail=event?.detail;if(!detail||!/^pair_[0-9a-f]{64}$/.test(String(detail.rivalryId||"")))return;if(detail.phase==="DELETED")pairEndRivalry(detail.rivalryId);else if(detail.phase==="CLOSED"&&!endedRivalryIds.has(detail.rivalryId))closedOnHomeRivalryId=detail.rivalryId;}
  if(root.addEventListener)root.addEventListener("career-mode-shared-terminal-close-state-change",pairOnShowdownDeleted);
  return pairFreezeDeep({contractVersion:5,feature:"persistent-nik-daniel-pair",permanentPartner:true,joinNoteMemoMs:JOIN_NOTE_MEMO_MS,realCodePrefix:REAL_CODE_PREFIX,partnerChangeEvent:PARTNER_EVENT,pairDocumentId:PAIR_DOC_ID,publicDiscovery:false,billingRequired:false,persistentAcrossRegisteredBrowsers:true,pairLinkPersistentAcrossRegisteredBrowsers:true,gameplayCacheHydrationAcrossFreshBrowsers:true,freshBrowserGameplayRequiresVerifiedLocalRecovery:false,legacyPairMigration:false,managerByRole:MANAGER_BY_ROLE,roleByManager:ROLE_BY_MANAGER,normalizeRivalryId:pairNormalizeRivalryId,parsePairLink:pairParsePairLink,readPairLink:pairReadPairLink,persistPairLink:pairPersistPairLink,initialize:pairInitialize,waitingPoll:Object.freeze({fastMs:PAIR_WAIT_FAST_MS,slowMs:PAIR_WAIT_SLOW_MS,windowMs:PAIR_WAIT_WINDOW_MS}),isWaitingForRival:()=>Boolean(pairWaitingKey()),startPairing:pairStartPairing,joinPairing:pairJoinAndContinue,autoContinueAfterConnect:pairAutoContinueAfterConnect,retryPairLink:pairRetryPairLink,careerIndexPageCapacity:CAREER_INDEX_PAGE_CAPACITY,readCareerIndex:pairReadCareerIndex,getCareerIndexState:()=>careerIndexState,planCareerIndexAppend:pairPlanCareerIndexAppend,createDurableCreationWitness:pairCreateDurableCreationWitness,createDurableRedemptionWitness:pairCreateDurableRedemptionWitness,abandonCurrentShowdown:pairAbandonCurrentShowdown,closeUnjoinedCode:options=>options&&options.expectedRivalryId?pairAbandonCurrentShowdown({expectedRivalryId:options.expectedRivalryId,unjoinedOnly:true}):Promise.reject(pairErrorWithCode("PERSISTENT_PAIR_LINK_REQUIRED","The earlier code could not be verified. Nothing was changed.")),discardStalePendingConnection:pairDiscardStalePendingConnection,continuePair:pairContinueOnlineShowdown,settleOnHome:pairEndClosedOnHome,openRecovery:pairOpenRecoverySurface,startOver:pairStartOverFromRecovery,buildPlayerJoinCode:pairBuildPlayerJoinCode,parsePlayerJoinCode:pairParsePlayerJoinCode,readPartnerRecord:pairReadPartnerRecord,writePartnerRecord:pairWritePartnerRecord,ensurePartnerRecord:pairEnsurePartnerRecord,writeJoinNote:pairWriteJoinNote,readJoinNote:pairReadJoinNote,watchJoinNote:pairWatchJoinNote,stopJoinNoteWatch:pairJoinNoteWatchStop,getJoinNoteWatch:()=>pairFreezeDeep({mode:noteWatch.mode,listening:typeof noteWatch.unsubscribe==="function",delivered:noteWatch.delivered,until:noteWatch.until}),joinNoteWatchWindowMs:JOIN_NOTE_WATCH_WINDOW_MS,getJoinNoteState:pairJoinNoteView,getPartnerState:()=>partnerState,readPartnerSide:pairReadPartnerSide,getPartnerSideState:()=>partnerSideState,unpair:pairUnpair,render:pairRender,subscribe:pairSubscribe,getState:()=>state});
});
```


## FILE: js/sparkPrivatePairing.js
```javascript
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkPrivatePairing=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const IDENTITY_DB_NAME="careerModeShowdown.privateDevice";
  const IDENTITY_DB_VERSION=1;
  const IDENTITY_STORE_NAME="identity";
  const IDENTITY_PRIMARY_KEY="primary";
  const IDENTITY_SCHEMA_VERSION=1;
  const DEVICE_ID_BYTES=16;
  const INSTALLATION_ID_BYTES=16;
  const PAIRING_CAPABILITY_BYTES=32;
  const PAIRING_TTL_MS=15*60*1000;
  const MAX_PAIRING_TTL_MS=30*60*1000;
  const PANEL_ID="sparkPrivatePairingPanel";
  const SETTINGS_CONTENT_ID="settingsContent";
  const SETTINGS_OVERLAY_ID="settingsOverlay";
  const MANAGER_ROLES=Object.freeze(["playerOne","playerTwo"]);
  const JOIN_INPUT_ID="sparkPrivatePairingCodeInput";

  let pairingState=Object.freeze({status:"idle",initialized:false,busy:false,connected:false,registered:false,accountId:null,deviceId:null,selectedBindingKey:null,message:"Private pairing is available after your private account and this device are ready.",capability:null,expiresAtEpochMs:null});
  let pairingServices=null;
  let pairingIdentity=null;
  let pairingInitializePromise=null;
  let pairingAccountUnsubscribe=null;
  let pairingJoinDraft="";
  let pairingJoinRenderDeferred=false;
  const DEVICE_REVERIFY_MS=10*60*1000;
  let deviceVerified=null;
  // r75: any denied Firestore read or write (the budget layer's event) ends the 10-minute trust, so a browser revoked from
  // another browser is re-verified on its next check.
  try{if(root&&typeof root.addEventListener==="function")root.addEventListener("career-mode-firestore-authority-denied",()=>{deviceVerified=null;});}catch(_error){}
  const pairingListeners=new Set();

  function freezeDeep(value){
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);
    Object.values(value).forEach(freezeDeep);
    return value;
  }

  function setState(next,options={}){
    pairingState=freezeDeep({...pairingState,...next});
    for(const listener of pairingListeners){try{listener(pairingState);}catch(_error){}}
    if(options.render!==false)renderPanel();
    return pairingState;
  }

  function errorWithCode(code,message){
    const error=new Error(message||code);
    error.code=code;
    return error;
  }

  function asResultError(error,fallbackCode){
    return {ok:false,code:error&&typeof error.code==="string"?error.code:fallbackCode,message:error&&error.message?error.message:"The private operation could not be completed."};
  }

  function hexFromBytes(bytes){
    return Array.from(bytes,value=>value.toString(16).padStart(2,"0")).join("");
  }

  function randomId(prefix,byteLength,cryptoImpl=root.crypto){
    if(!cryptoImpl||typeof cryptoImpl.getRandomValues!=="function")throw errorWithCode("PRIVATE_CRYPTO_UNAVAILABLE","Secure browser randomness is unavailable.");
    const bytes=new Uint8Array(byteLength);
    cryptoImpl.getRandomValues(bytes);
    return `${prefix}${hexFromBytes(bytes)}`;
  }

  function generateDeviceIdentity(cryptoImpl=root.crypto,nowEpochMs=Date.now()){
    return Object.freeze({schemaVersion:IDENTITY_SCHEMA_VERSION,installationId:randomId("installation_",INSTALLATION_ID_BYTES,cryptoImpl),deviceId:randomId("device_",DEVICE_ID_BYTES,cryptoImpl),createdAtEpochMs:Number(nowEpochMs)});
  }

  function validDeviceIdentity(value){
    return Boolean(value&&value.schemaVersion===IDENTITY_SCHEMA_VERSION&&typeof value.installationId==="string"&&/^installation_[0-9a-f]{32}$/.test(value.installationId)&&typeof value.deviceId==="string"&&/^device_[0-9a-f]{32}$/.test(value.deviceId)&&Number.isFinite(value.createdAtEpochMs)&&value.createdAtEpochMs>0);
  }

  function openIdentityDatabase(indexedDBImpl=root.indexedDB){
    if(!indexedDBImpl||typeof indexedDBImpl.open!=="function")return Promise.reject(errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","Private device identity storage is unavailable in this browser."));
    return new Promise((resolve,reject)=>{
      const request=indexedDBImpl.open(IDENTITY_DB_NAME,IDENTITY_DB_VERSION);
      request.onupgradeneeded=()=>{const database=request.result;if(!database.objectStoreNames.contains(IDENTITY_STORE_NAME))database.createObjectStore(IDENTITY_STORE_NAME);};
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","Private device identity storage could not be opened."));
      request.onblocked=()=>reject(errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","Private device identity storage is blocked by another browser context."));
    });
  }

  async function getOrCreateDeviceIdentity(options={}){
    const indexedDBImpl=options.indexedDBImpl||root.indexedDB;
    const cryptoImpl=options.cryptoImpl||root.crypto;
    const nowEpochMs=options.nowEpochMs===undefined?Date.now():Number(options.nowEpochMs);
    let database;
    try{
      database=await openIdentityDatabase(indexedDBImpl);
      return await new Promise((resolve,reject)=>{
        const transaction=database.transaction(IDENTITY_STORE_NAME,"readwrite");
        const store=transaction.objectStore(IDENTITY_STORE_NAME);
        const read=store.get(IDENTITY_PRIMARY_KEY);
        let resolvedIdentity=null;
        read.onsuccess=()=>{
          const existing=read.result;
          if(existing!==undefined){
            if(!validDeviceIdentity(existing)){try{transaction.abort();}catch(_error){}reject(errorWithCode("PRIVATE_DEVICE_IDENTITY_CONFLICT","Stored private device identity is invalid. Remote pairing is disabled. Your Showdowns were not changed."));return;}
            resolvedIdentity=Object.freeze({...existing});
            return;
          }
          try{resolvedIdentity=generateDeviceIdentity(cryptoImpl,nowEpochMs);store.add({...resolvedIdentity},IDENTITY_PRIMARY_KEY);}catch(error){try{transaction.abort();}catch(_error){}reject(error);}
        };
        read.onerror=()=>reject(errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","Private device identity could not be read."));
        transaction.oncomplete=()=>resolve(resolvedIdentity);
        transaction.onerror=()=>reject(errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","Private device identity could not be committed."));
        transaction.onabort=()=>reject(errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","Private device identity transaction was aborted."));
      });
    }finally{if(database&&typeof database.close==="function")database.close();}
  }

  // Studio Z10: Forget device revokes the server record and deletes the local record, so the cached identity must go too.
  // The next sign-in then registers a fresh device; the revoked server document is untouched.
  function resetDeviceIdentityCache(){pairingIdentity=null;pairingServices=null;}
  function canonicalize(value){
    if(value===null||value===undefined)return value===undefined?null:value;
    if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};
    if(Array.isArray(value))return value.map(canonicalize);
    if(typeof value==="object"){const result={};for(const key of Object.keys(value).sort())result[key]=canonicalize(value[key]);return result;}
    return value;
  }

  async function sha256(value,cryptoImpl=root.crypto){
    if(!cryptoImpl||!cryptoImpl.subtle||typeof cryptoImpl.subtle.digest!=="function")throw errorWithCode("PRIVATE_CRYPTO_UNAVAILABLE","Secure browser hashing is unavailable.");
    const bytes=new TextEncoder().encode(JSON.stringify(canonicalize(value)));
    const digest=await cryptoImpl.subtle.digest("SHA-256",bytes);
    return `sha256:${hexFromBytes(new Uint8Array(digest))}`;
  }

  async function buildEnvelope({objectType,objectId,revision,parentRevision,priorContentHash,updatedAt,updatedByAccountId,updatedByDeviceId,data,cryptoImpl=root.crypto}){
    const contentHash=await sha256({objectType,objectId,revision,data},cryptoImpl);
    return {schemaVersion:1,objectType,objectId,revision,parentRevision,lifecycleState:"live",contentHash,priorContentHash,updatedAt,updatedByAccountId,updatedByDeviceId,data,tombstone:null};
  }

  function timestampMillis(value){
    if(value&&typeof value.toMillis==="function")return value.toMillis();
    if(value instanceof Date)return value.getTime();
    return Number.NaN;
  }

  function normalizeAccountId(user){
    const uid=user&&typeof user.uid==="string"?user.uid.trim():"";
    if(!uid)throw errorWithCode("PRIVATE_AUTH_REQUIRED","A ready private account is required.");
    return uid;
  }

  function normalizeLocalBinding(binding){
    const source=binding&&typeof binding==="object"?binding:{};
    const saveId=typeof source.saveId==="string"?source.saveId.trim():"";
    const profileId=typeof source.profileId==="string"?source.profileId.trim():"";
    const managerRole=typeof source.managerRole==="string"?source.managerRole.trim():"";
    const displayLabel=typeof source.displayLabel==="string"?source.displayLabel.trim().slice(0,80):"";
    if(!/^save_[a-f0-9]{24}$/.test(saveId))throw errorWithCode("PRIVATE_SAVE_ID_REQUIRED","Choose a Showdown with a stable Save Library identity.");
    if(!/^profile_[a-f0-9]{24}$/.test(profileId))throw errorWithCode("PRIVATE_PROFILE_ID_REQUIRED","Choose a manager with a stable Local Profile identity.");
    if(!MANAGER_ROLES.includes(managerRole))throw errorWithCode("PRIVATE_MANAGER_ROLE_REQUIRED","Choose Player One or Player Two for this private rivalry.");
    return Object.freeze({saveId,profileId,managerRole,displayLabel:displayLabel||null});
  }

  function bindingKey(binding){
    const normalized=normalizeLocalBinding(binding);
    return `${normalized.managerRole}:${normalized.profileId}:${normalized.saveId}`;
  }

  function pairingJoinErrorMessage(error){
    const code=error&&typeof error.code==="string"?error.code.trim().toLowerCase():"";
    const message=error&&typeof error.message==="string"?error.message.trim():"";
    const opaqueCodes=new Set(["permission-denied","firestore/permission-denied","permission_denied","pairing_capability_not_found","pairing_scope_denied","pairing_capability_already_used","pairing_capability_expired","pairing_rivalry_not_joinable"]);
    if(opaqueCodes.has(code)||/missing or insufficient permissions/i.test(message))return "This one-use pairing code could not be joined. It may be expired, already used, or unavailable to this account. Create a new code on the other device. If Daniel and Nik are already connected, go Home and tap CONTINUE CAREER instead. Also check that Nik is signed in with a different Google account than Daniel.";
    return message||"Private pairing could not be joined.";
  }

  function normalizeCapability(value){
    const capability=typeof value==="string"?value.trim().toLowerCase():"";
    if(!/^pair_[0-9a-f]{64}$/.test(capability))throw errorWithCode("PAIRING_CAPABILITY_INVALID","The private pairing code is invalid.");
    return capability;
  }

  function oppositeManagerRole(role){
    if(role==="playerOne")return "playerTwo";
    if(role==="playerTwo")return "playerOne";
    throw errorWithCode("PRIVATE_MANAGER_ROLE_REQUIRED","A valid manager role is required.");
  }

  function validateFirestoreInputs({firestore,firebaseSdk}){
    if(!firestore)throw errorWithCode("PRIVATE_FIRESTORE_UNAVAILABLE","Private Firestore services are unavailable.");
    for(const name of ["doc","runTransaction"]){if(!firebaseSdk||typeof firebaseSdk[name]!=="function")throw errorWithCode("PRIVATE_FIRESTORE_UNAVAILABLE",`Private Firestore SDK method unavailable: ${name}.`);}
    if(!firebaseSdk.Timestamp||typeof firebaseSdk.Timestamp.fromMillis!=="function")throw errorWithCode("PRIVATE_FIRESTORE_UNAVAILABLE","Firestore Timestamp support is unavailable.");
  }

  function isEnvelope(snapshot,objectType,objectId){
    if(!snapshot||typeof snapshot.exists!=="function"||!snapshot.exists())return false;
    const value=snapshot.data();
    return Boolean(value&&value.schemaVersion===1&&value.objectType===objectType&&value.objectId===objectId&&value.lifecycleState==="live"&&Number.isInteger(value.revision)&&value.revision>=0&&typeof value.contentHash==="string");
  }

  function assertActiveDeviceSnapshot(snapshot,deviceId){
    if(!isEnvelope(snapshot,"device",deviceId))throw errorWithCode("PRIVATE_DEVICE_NOT_REGISTERED","This browser is not registered to the signed-in private account.");
    const value=snapshot.data();
    if(!value.data||value.data.deviceId!==deviceId)throw errorWithCode("PRIVATE_DEVICE_CONFLICT","Registered device identity does not match this browser.");
    if(value.data.state==="revoked")throw errorWithCode("PRIVATE_DEVICE_REVOKED","This registered device has been revoked.");
    if(value.data.state!=="active")throw errorWithCode("PRIVATE_DEVICE_CONFLICT","Registered device state is invalid.");
    return value;
  }

  async function registerDevice(options={}){
    try{
      validateFirestoreInputs(options);
      const accountId=normalizeAccountId(options.user);
      const identity=options.identity;
      if(!validDeviceIdentity(identity))throw errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","A stable private device identity is required.");
      const sdk=options.firebaseSdk;
      const nowEpochMs=options.nowEpochMs===undefined?Date.now():Number(options.nowEpochMs);
      const now=sdk.Timestamp.fromMillis(nowEpochMs);
      const deviceReference=sdk.doc(options.firestore,"accounts",accountId,"devices",identity.deviceId);
      const result=await sdk.runTransaction(options.firestore,async transaction=>{
        const existing=await transaction.get(deviceReference);
        if(existing.exists()){
          const stored=assertActiveDeviceSnapshot(existing,identity.deviceId);
          if(stored.data.installationId!==identity.installationId)throw errorWithCode("PRIVATE_DEVICE_CONFLICT","Registered device belongs to a different private installation identity.");
          return {action:"existing",revision:stored.revision};
        }
        const data={deviceId:identity.deviceId,installationId:identity.installationId,displayLabel:null,state:"active",registeredAt:now,lastSeenAt:now,revokedAt:null};
        const envelope=await buildEnvelope({objectType:"device",objectId:identity.deviceId,revision:0,parentRevision:null,priorContentHash:null,updatedAt:now,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data,cryptoImpl:options.cryptoImpl||root.crypto});
        transaction.set(deviceReference,envelope);
        return {action:"created",revision:0};
      });
      return {ok:true,accountId,deviceId:identity.deviceId,installationId:identity.installationId,...result};
    }catch(error){return asResultError(error,"PRIVATE_DEVICE_REGISTRATION_FAILED");}
  }

  async function revokeRegisteredDevice(options={}){
    deviceVerified=null;
    try{
      validateFirestoreInputs(options);
      const accountId=normalizeAccountId(options.user);
      const identity=options.identity;
      if(!validDeviceIdentity(identity))throw errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","A stable private device identity is required.");
      const targetDeviceId=typeof options.targetDeviceId==="string"?options.targetDeviceId.trim():identity.deviceId;
      if(!/^device_[0-9a-f]{32}$/.test(targetDeviceId))throw errorWithCode("PRIVATE_DEVICE_ID_INVALID","A valid registered device identity is required.");
      const sdk=options.firebaseSdk;
      const now=sdk.Timestamp.fromMillis(options.nowEpochMs===undefined?Date.now():Number(options.nowEpochMs));
      const actorReference=sdk.doc(options.firestore,"accounts",accountId,"devices",identity.deviceId);
      const targetReference=sdk.doc(options.firestore,"accounts",accountId,"devices",targetDeviceId);
      const result=await sdk.runTransaction(options.firestore,async transaction=>{
        const actorSnapshot=await transaction.get(actorReference);
        assertActiveDeviceSnapshot(actorSnapshot,identity.deviceId);
        const targetSnapshot=targetDeviceId===identity.deviceId?actorSnapshot:await transaction.get(targetReference);
        const stored=assertActiveDeviceSnapshot(targetSnapshot,targetDeviceId);
        const data={...stored.data,state:"revoked",revokedAt:now,lastSeenAt:stored.data.lastSeenAt};
        const envelope=await buildEnvelope({objectType:"device",objectId:targetDeviceId,revision:stored.revision+1,parentRevision:stored.revision,priorContentHash:stored.contentHash,updatedAt:now,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data,cryptoImpl:options.cryptoImpl||root.crypto});
        transaction.set(targetReference,envelope);
        return {revision:envelope.revision};
      });
      return {ok:true,accountId,targetDeviceId,...result};
    }catch(error){return asResultError(error,"PRIVATE_DEVICE_REVOCATION_FAILED");}
  }

  function buildManagerSlots(accountId,binding){
    const creatorRole=binding.managerRole;
    const invitedRole=oppositeManagerRole(creatorRole);
    const slotFor=role=>role===creatorRole?{slotId:role,accountId,profileId:binding.profileId,saveId:binding.saveId,displayLabel:binding.displayLabel,entitlementState:"active",deletionConsent:false}:{slotId:role,accountId:null,profileId:null,saveId:null,displayLabel:null,entitlementState:"open",deletionConsent:false};
    return {managerSlots:[slotFor("playerOne"),slotFor("playerTwo")],invitedRole};
  }

  async function createPairing(options={}){
    try{
      validateFirestoreInputs(options);
      const accountId=normalizeAccountId(options.user);
      const identity=options.identity;
      if(!validDeviceIdentity(identity))throw errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","A stable registered device is required.");
      const binding=normalizeLocalBinding(options.binding);
      const durableWitness=options.durableWitness;
      if(durableWitness!==undefined&&durableWitness!==null&&typeof durableWitness!=="function")throw errorWithCode("PAIRING_DURABLE_WITNESS_INVALID","A valid durable pairing witness is required.");
      const ttlMs=options.ttlMs===undefined?PAIRING_TTL_MS:Number(options.ttlMs);
      if(!Number.isFinite(ttlMs)||ttlMs<=0||ttlMs>MAX_PAIRING_TTL_MS)throw errorWithCode("PAIRING_TTL_INVALID","Private pairing expiry must be within 30 minutes.");
      const capability=normalizeCapability(options.capability||randomId("pair_",PAIRING_CAPABILITY_BYTES,options.cryptoImpl||root.crypto));
      const sdk=options.firebaseSdk;
      const nowEpochMs=options.nowEpochMs===undefined?Date.now():Number(options.nowEpochMs);
      const createdAt=sdk.Timestamp.fromMillis(nowEpochMs);
      const expiresAt=sdk.Timestamp.fromMillis(nowEpochMs+ttlMs);
      const deviceReference=sdk.doc(options.firestore,"accounts",accountId,"devices",identity.deviceId);
      const rivalryReference=sdk.doc(options.firestore,"rivalries",capability);
      const inviteReference=sdk.doc(options.firestore,"rivalries",capability,"invites",capability);
      const {managerSlots,invitedRole}=buildManagerSlots(accountId,binding);
      const durableWitnessResult=await sdk.runTransaction(options.firestore,async transaction=>{
        const deviceSnapshot=await transaction.get(deviceReference);
        assertActiveDeviceSnapshot(deviceSnapshot,identity.deviceId);
        const rivalryData={connectionState:"pending-pair",connectionStateBeforeDeletion:null,managerSlots,authorizedAccountIds:[accountId],createdByAccountId:accountId,createdAt};
        const inviteData={purpose:"rivalry-pairing",slotId:invitedRole,createdByAccountId:accountId,createdAt,expiresAt,state:"open",redeemedByAccountId:null,redeemedAt:null,revokedAt:null};
        const rivalryEnvelope=await buildEnvelope({objectType:"rivalry",objectId:capability,revision:0,parentRevision:null,priorContentHash:null,updatedAt:createdAt,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data:rivalryData,cryptoImpl:options.cryptoImpl||root.crypto});
        const inviteEnvelope=await buildEnvelope({objectType:"invite",objectId:capability,revision:0,parentRevision:null,priorContentHash:null,updatedAt:createdAt,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data:inviteData,cryptoImpl:options.cryptoImpl||root.crypto});
        let witness=null;
        if(durableWitness){
          witness=await durableWitness({transaction,binding,capability,accountId,deviceId:identity.deviceId,now:createdAt,nowEpochMs});
          if(!witness||witness.ok!==true)throw errorWithCode("PAIRING_DURABLE_WITNESS_FAILED","The durable creator pairing witness could not be committed.");
        }
        transaction.set(rivalryReference,rivalryEnvelope);
        transaction.set(inviteReference,inviteEnvelope);
        return witness;
      });
      return {ok:true,rivalryId:capability,inviteId:capability,capability,slotId:invitedRole,expiresAtEpochMs:nowEpochMs+ttlMs,creatorBinding:binding,durableWitness:durableWitnessResult};
    }catch(error){return asResultError(error,"PAIRING_CREATE_FAILED");}
  }

  function assertPairingDocuments(rivalrySnapshot,inviteSnapshot,capability,accountId,binding,nowEpochMs){
    if(!isEnvelope(rivalrySnapshot,"rivalry",capability)||!isEnvelope(inviteSnapshot,"invite",capability))throw errorWithCode("PAIRING_CAPABILITY_NOT_FOUND","The private pairing code was not found.");
    const rivalry=rivalrySnapshot.data();
    const invite=inviteSnapshot.data();
    if(!invite.data||invite.data.purpose!=="rivalry-pairing")throw errorWithCode("PAIRING_SCOPE_DENIED","This capability is not valid for private rivalry pairing.");
    if(invite.data.createdByAccountId===accountId)throw errorWithCode("PAIRING_CREATOR_CANNOT_REDEEM","This Google account made the code, so it cannot join it. Nik must sign in with a different Google account than Daniel, then paste the code again.");
    if(invite.data.state!=="open")throw errorWithCode("PAIRING_CAPABILITY_ALREADY_USED","This private pairing code is no longer open.");
    const expiresAt=timestampMillis(invite.data.expiresAt);
    if(!Number.isFinite(expiresAt)||expiresAt<=nowEpochMs)throw errorWithCode("PAIRING_CAPABILITY_EXPIRED","This private pairing code has expired.");
    if(invite.data.slotId!==binding.managerRole)throw errorWithCode("PAIRING_SLOT_MISMATCH",`This code is for ${invite.data.slotId==="playerOne"?"Daniel":"Nik"}. Choose ${invite.data.slotId==="playerOne"?"Daniel":"Nik"} for this phone on Home, then join again.`);
    const data=rivalry.data;
    if(!data||data.connectionState!=="pending-pair"||!Array.isArray(data.managerSlots)||data.managerSlots.length!==2)throw errorWithCode("PAIRING_RIVALRY_NOT_JOINABLE","This private rivalry is not waiting for exactly one manager.");
    if(!Array.isArray(data.authorizedAccountIds)||data.authorizedAccountIds.length!==1||data.authorizedAccountIds[0]!==invite.data.createdByAccountId)throw errorWithCode("PAIRING_RIVALRY_CONFLICT","Private rivalry ownership is inconsistent.");
    const target=data.managerSlots.find(slot=>slot&&slot.slotId===invite.data.slotId);
    const creator=data.managerSlots.find(slot=>slot&&slot.accountId===invite.data.createdByAccountId);
    if(!target||target.accountId!==null||target.profileId!==null||target.saveId!==null||target.entitlementState!=="open")throw errorWithCode("PAIRING_TWO_MANAGER_LIMIT","The second manager slot is no longer open.");
    if(!creator||creator.entitlementState!=="active"||typeof creator.profileId!=="string"||typeof creator.saveId!=="string")throw errorWithCode("PAIRING_RIVALRY_CONFLICT","The creator manager binding is invalid.");
    return {rivalry,invite,target};
  }

  async function redeemPairing(options={}){
  try{
    validateFirestoreInputs(options);
    const accountId=normalizeAccountId(options.user);
    const identity=options.identity;
    if(!validDeviceIdentity(identity))throw errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","A stable registered device is required.");
    const binding=normalizeLocalBinding(options.binding);
    const capability=normalizeCapability(options.capability);
    const durableWitness=options.durableWitness;
    if(durableWitness!==undefined&&typeof durableWitness!=="function")throw errorWithCode("PAIRING_DURABLE_WITNESS_INVALID","The durable pairing witness is invalid.");
    const sdk=options.firebaseSdk;
    const nowEpochMs=options.nowEpochMs===undefined?Date.now():Number(options.nowEpochMs);
    const now=sdk.Timestamp.fromMillis(nowEpochMs);
    const deviceReference=sdk.doc(options.firestore,"accounts",accountId,"devices",identity.deviceId);
    const rivalryReference=sdk.doc(options.firestore,"rivalries",capability);
    const inviteReference=sdk.doc(options.firestore,"rivalries",capability,"invites",capability);
    const result=await sdk.runTransaction(options.firestore,async transaction=>{
      const deviceSnapshot=await transaction.get(deviceReference);
      assertActiveDeviceSnapshot(deviceSnapshot,identity.deviceId);
      const rivalrySnapshot=await transaction.get(rivalryReference);
      const inviteSnapshot=await transaction.get(inviteReference);
      const {rivalry,invite}=assertPairingDocuments(rivalrySnapshot,inviteSnapshot,capability,accountId,binding,nowEpochMs);
      let durableWitnessResult=null;
      if(durableWitness){
        durableWitnessResult=await durableWitness({transaction,firestore:options.firestore,firebaseSdk:sdk,accountId,identity,binding,capability,now,nowEpochMs,rivalry,invite});
        if(!durableWitnessResult||durableWitnessResult.ok!==true)throw errorWithCode("PAIRING_DURABLE_WITNESS_FAILED","The account pairing witness could not be committed with redemption.");
      }
      const nextSlots=rivalry.data.managerSlots.map(slot=>slot.slotId===invite.data.slotId?{slotId:slot.slotId,accountId,profileId:binding.profileId,saveId:binding.saveId,displayLabel:binding.displayLabel,entitlementState:"active",deletionConsent:false}:{...slot});
      const rivalryData={...rivalry.data,connectionState:"active",managerSlots:nextSlots,authorizedAccountIds:[invite.data.createdByAccountId,accountId]};
      const inviteData={...invite.data,state:"redeemed",redeemedByAccountId:accountId,redeemedAt:now,revokedAt:null};
      const rivalryEnvelope=await buildEnvelope({objectType:"rivalry",objectId:capability,revision:rivalry.revision+1,parentRevision:rivalry.revision,priorContentHash:rivalry.contentHash,updatedAt:now,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data:rivalryData,cryptoImpl:options.cryptoImpl||root.crypto});
      const inviteEnvelope=await buildEnvelope({objectType:"invite",objectId:capability,revision:invite.revision+1,parentRevision:invite.revision,priorContentHash:invite.contentHash,updatedAt:now,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data:inviteData,cryptoImpl:options.cryptoImpl||root.crypto});
      transaction.set(rivalryReference,rivalryEnvelope);
      transaction.set(inviteReference,inviteEnvelope);
      return {revision:rivalryEnvelope.revision,slotId:invite.data.slotId,durableWitness:durableWitnessResult};
    });
    return {ok:true,rivalryId:capability,capability,accountId,binding,...result};
  }catch(error){return asResultError(error,"PAIRING_REDEEM_FAILED");}
}

async function revokePairing(options={}){
    try{
      validateFirestoreInputs(options);
      const accountId=normalizeAccountId(options.user);
      const identity=options.identity;
      if(!validDeviceIdentity(identity))throw errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","A stable registered device is required.");
      const capability=normalizeCapability(options.capability);
      const sdk=options.firebaseSdk;
      const now=sdk.Timestamp.fromMillis(options.nowEpochMs===undefined?Date.now():Number(options.nowEpochMs));
      const deviceReference=sdk.doc(options.firestore,"accounts",accountId,"devices",identity.deviceId);
      const inviteReference=sdk.doc(options.firestore,"rivalries",capability,"invites",capability);
      const result=await sdk.runTransaction(options.firestore,async transaction=>{
        const deviceSnapshot=await transaction.get(deviceReference);
        assertActiveDeviceSnapshot(deviceSnapshot,identity.deviceId);
        const inviteSnapshot=await transaction.get(inviteReference);
        if(!isEnvelope(inviteSnapshot,"invite",capability))throw errorWithCode("PAIRING_CAPABILITY_NOT_FOUND","The private pairing code was not found.");
        const invite=inviteSnapshot.data();
        if(!invite.data||invite.data.createdByAccountId!==accountId)throw errorWithCode("PAIRING_REVOKE_DENIED","Only the account that created this pairing code can revoke it.");
        if(invite.data.state!=="open")throw errorWithCode("PAIRING_CAPABILITY_ALREADY_USED","This private pairing code is no longer open.");
        const inviteData={...invite.data,state:"revoked",revokedAt:now,redeemedByAccountId:null,redeemedAt:null};
        const envelope=await buildEnvelope({objectType:"invite",objectId:capability,revision:invite.revision+1,parentRevision:invite.revision,priorContentHash:invite.contentHash,updatedAt:now,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data:inviteData,cryptoImpl:options.cryptoImpl||root.crypto});
        transaction.set(inviteReference,envelope);
        return {revision:envelope.revision};
      });
      return {ok:true,capability,...result};
    }catch(error){return asResultError(error,"PAIRING_REVOKE_FAILED");}
  }

  function localBindingOptions(saveRuntime=root.CareerModeSaveLibraryRuntime){
    if(!saveRuntime||typeof saveRuntime.getLibrarySnapshot!=="function"||typeof saveRuntime.isReady!=="function"||saveRuntime.isReady()!==true)return [];
    const library=saveRuntime.getLibrarySnapshot();
    if(!library||typeof library.activeSaveId!=="string"||!Array.isArray(library.saves))return [];
    const entry=library.saves.find(item=>item&&item.saveId===library.activeSaveId);
    const refs=entry&&entry.showdown&&entry.showdown.identity&&entry.showdown.identity.managerProfileIds;
    if(!entry||!refs)return [];
    const profiles=Array.isArray(library.profiles)?library.profiles:[];
    return MANAGER_ROLES.flatMap(managerRole=>{
      const profileId=refs[managerRole];
      if(typeof profileId!=="string")return [];
      const profile=profiles.find(item=>item&&item.profileId===profileId);
      const displayLabel=profile&&typeof profile.displayName==="string"&&profile.displayName.trim()?profile.displayName.trim():managerRole==="playerOne"?"Player One":"Player Two";
      try{return [normalizeLocalBinding({saveId:entry.saveId,profileId,managerRole,displayLabel})];}catch(_error){return [];}
    });
  }

  async function resolveConnectedContext(){
    const account=root.CareerModeSparkConnectedAccount;
    const runtime=root.CareerModeProductionFirebaseRuntime;
    if(!account||typeof account.getState!=="function"||!runtime||typeof runtime.ensureAccountServices!=="function")throw errorWithCode("PRIVATE_ACCOUNT_UNAVAILABLE","Connected account runtime is unavailable.");
    const accountState=account.getState();
    if(!accountState||accountState.connected!==true||!accountState.accountId)throw errorWithCode("PRIVATE_AUTH_REQUIRED","Sign in to your private account first.");
    const services=pairingServices&&pairingServices.ok===true?pairingServices:(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices());
    if(!services||services.ok!==true)throw errorWithCode("PRIVATE_FIRESTORE_UNAVAILABLE","Private Firestore services are unavailable.");
    pairingServices=services;
    if(!pairingIdentity)pairingIdentity=await getOrCreateDeviceIdentity({indexedDBImpl:root.indexedDB,cryptoImpl:root.crypto});
    return {accountState,services,user:services.auth.currentUser,identity:pairingIdentity};
  }

  async function registerCurrentDevice(){
    const preservePairingStateAtStart=["creating-pair","joining-pair","pair-open","paired"].includes(pairingState.status);
    if(!preservePairingStateAtStart)setState({status:"registering",busy:true,message:"Registering this browser privately…"});
    try{
      const context=await resolveConnectedContext();
      // r75: initialize() runs on many screens; once this page has verified this account+device, re-verify at most every
      // 10 minutes, after an account change or after any registration error, instead of a transaction on every call.
      const verifiedKey=`${context.accountState.accountId}|${context.identity.deviceId}`;
      const recentlyVerified=pairingState.registered===true&&deviceVerified&&deviceVerified.key===verifiedKey&&Date.now()-deviceVerified.at<DEVICE_REVERIFY_MS;
      if(!recentlyVerified){
        deviceVerified=null;
        const result=await registerDevice({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,identity:context.identity,cryptoImpl:root.crypto});
        if(!result.ok)throw errorWithCode(result.code,result.message);
        deviceVerified={key:verifiedKey,at:Date.now()};
      }
      const preservePairingState=preservePairingStateAtStart||["creating-pair","joining-pair","pair-open","paired"].includes(pairingState.status);
      if(preservePairingState){
        // r75: a re-check that confirms what the panel already shows does not rebuild it (that only replaced the open
        // pairing code and its COPY button under the manager's finger); listeners are still told.
        const next={initialized:true,connected:true,registered:true,accountId:context.accountState.accountId,deviceId:context.identity.deviceId};
        const unchanged=Object.keys(next).every(key=>pairingState[key]===next[key]);
        return setState(next,unchanged?{render:false}:{});
      }
      return setState({status:"ready",initialized:true,busy:false,connected:true,registered:true,accountId:context.accountState.accountId,deviceId:context.identity.deviceId,message:"This browser is privately registered. Pairing only links the two manager identities; gameplay synchronization is still locked."});
    }catch(error){deviceVerified=null;return setState({status:error&&error.code==="PRIVATE_DEVICE_REVOKED"?"revoked":"device-error",initialized:true,busy:false,connected:true,registered:false,message:`${error&&error.message?error.message:"This browser could not be registered."}`});}
  }

  async function initialize(){
    if(pairingInitializePromise)return pairingInitializePromise;
    pairingInitializePromise=(async()=>{
      const account=root.CareerModeSparkConnectedAccount;
      if(!account||typeof account.getState!=="function")return setState({status:"account-unavailable",initialized:true,busy:false,connected:false,registered:false,message:"Private pairing is unavailable right now."});
      if(!pairingAccountUnsubscribe&&typeof account.subscribe==="function"){
        pairingAccountUnsubscribe=account.subscribe(next=>{
          if(!next||next.connected!==true){pairingServices=null;pairingJoinDraft="";setState({status:"signed-out",initialized:true,busy:false,connected:false,registered:false,accountId:null,selectedBindingKey:null,capability:null,expiresAtEpochMs:null,message:"Sign in above to register this browser and use private pairing."});}
          else if(pairingState.accountId!==next.accountId){pairingServices=null;pairingJoinDraft="";setState({selectedBindingKey:null,capability:null,expiresAtEpochMs:null});void registerCurrentDevice();}
          else if(pairingState.registered!==true){void registerCurrentDevice();}
        });
      }
      const current=account.getState();
      if(!current||current.connected!==true){pairingJoinDraft="";return setState({status:"signed-out",initialized:true,busy:false,connected:false,registered:false,accountId:null,message:"Sign in above to register this browser and use private pairing."});}
      return registerCurrentDevice();
    })().finally(()=>{pairingInitializePromise=null;});
    return pairingInitializePromise;
  }

  function createElement(tag,className,text){
    const element=root.document.createElement(tag);
    if(className)element.className=className;
    if(text!==undefined&&text!==null)element.textContent=String(text);
    return element;
  }

  function shortId(value){return typeof value!=="string"||!value?"—":value.length<=16?value:`${value.slice(0,10)}…${value.slice(-4)}`;}
  function bindingLabel(binding){return `${binding.managerRole==="playerOne"?"Player One":"Player Two"} · ${binding.displayLabel||shortId(binding.profileId)}`;}
  function joinEditorCanStayMounted(){
    const input=root.document&&root.document.getElementById(JOIN_INPUT_ID);
    if(!input||root.document.activeElement!==input||input.readOnly)return false;
    const account=root.CareerModeSparkConnectedAccount&&typeof root.CareerModeSparkConnectedAccount.getState==="function"?root.CareerModeSparkConnectedAccount.getState():null;
    if(!account||account.connected!==true||!account.accountId||account.accountId!==pairingState.accountId)return false;
    if(pairingState.registered!==true)return false;
    if(["paired","revoked","signed-out","account-unavailable","device-error"].includes(pairingState.status))return false;
    return true;
  }
  function flushDeferredJoinRender(){
    if(!pairingJoinRenderDeferred)return;
    pairingJoinRenderDeferred=false;
    root.setTimeout(()=>{
      const active=root.document&&root.document.activeElement;
      if(active&&active.id===JOIN_INPUT_ID)return;
      renderPanel();
    },0);
  }

  function renderPanel(){
    if(!root.document)return null;
    const content=root.document.getElementById(SETTINGS_CONTENT_ID);
    const overlay=root.document.getElementById(SETTINGS_OVERLAY_ID);
    if(!content||!overlay||overlay.classList.contains("hidden"))return null;
    let panel=root.document.getElementById(PANEL_ID);
    if(!panel){
      panel=createElement("section","settingsPanel settingsConnectedAccountPanel settingsPrivatePairingPanel");
      panel.id=PANEL_ID;
      const accountPanel=root.document.getElementById("sparkConnectedAccountPanel");
      if(accountPanel&&accountPanel.parentNode===content&&accountPanel.nextSibling)content.insertBefore(panel,accountPanel.nextSibling);else content.appendChild(panel);
    }
    if(joinEditorCanStayMounted()){
      const input=root.document.getElementById(JOIN_INPUT_ID);pairingJoinDraft=input?input.value:pairingJoinDraft;pairingJoinRenderDeferred=true;
      const liveStatus=panel.querySelector('[role="status"]');if(liveStatus)liveStatus.textContent=pairingState.message;
      return panel;
    }
    pairingJoinRenderDeferred=false;
    panel.replaceChildren();
    const heading=createElement("div","settingsPanelHeading");
    heading.append(createElement("span","settingsPanelEyebrow","PRIVATE RIVALRY"),createElement("h3","","REGISTERED DEVICE & PAIRING"),createElement("p","","Link exactly two private manager identities. This stage does not synchronize gameplay or start a Remote Joining session."));
    const info=createElement("div","settingsInfoGrid");
    for(const [label,value] of [["DEVICE",pairingState.registered?`Registered · ${shortId(pairingState.deviceId)}`:pairingState.connected?"Not registered":"Sign in required"],["PAIRING","One use · 15 minute private capability"],["MANAGERS","Exactly two stable account/profile/save identities"],["GAMEPLAY SYNC","Explicit actions only in Connected Rivalry below"],["BILLING","Firebase Spark · no billing"]]){
      const row=createElement("div","settingsInfoRow");row.append(createElement("span","",label),createElement("strong","",value));info.appendChild(row);
    }
    panel.append(heading,info);
    if(pairingState.registered){
      const bindings=localBindingOptions();
      const form=createElement("div","settingsOfflineActions settingsConnectedAccountActions");
      const select=createElement("select","menuButton settingsConnectedAccountButton");
      select.setAttribute("aria-label","Local manager identity for private pairing");
      const bindingEntries=bindings.map(binding=>({binding,key:bindingKey(binding)}));
      const selectedEntry=bindingEntries.find(entry=>entry.key===pairingState.selectedBindingKey)||bindingEntries[0]||null;
      if(!bindingEntries.length){const option=createElement("option","","No active Save Library manager identity");option.value="";select.appendChild(option);select.disabled=true;}
      else bindingEntries.forEach(entry=>{const option=createElement("option","",bindingLabel(entry.binding));option.value=entry.key;option.selected=entry.key===selectedEntry.key;select.appendChild(option);});
      select.disabled=select.disabled||pairingState.busy||Boolean(pairingState.capability);
      select.addEventListener("change",()=>{if(pairingState.busy||pairingState.capability){if(selectedEntry)select.value=selectedEntry.key;return;}if(bindingEntries.some(entry=>entry.key===select.value))setState({selectedBindingKey:select.value},{render:false});});
      const selectedBinding=()=>{const entry=bindingEntries.find(candidate=>candidate.key===select.value)||selectedEntry;return entry?entry.binding:null;};
      const createButton=createElement("button","menuButton settingsConnectedAccountButton","CREATE PAIRING CODE");createButton.type="button";createButton.disabled=pairingState.busy||!bindings.length;
      const codeInput=createElement("input","settingsConnectedAccountInput");codeInput.id=JOIN_INPUT_ID;codeInput.type="text";codeInput.placeholder="Paste private pairing code";codeInput.autocomplete="off";codeInput.spellcheck=false;codeInput.setAttribute("aria-label","Private pairing code");
      if(pairingState.status==="paired"&&pairingState.capability){codeInput.value=pairingState.capability;codeInput.readOnly=true;codeInput.setAttribute("aria-readonly","true");}
      else codeInput.value=pairingJoinDraft;
      codeInput.addEventListener("input",()=>{pairingJoinDraft=codeInput.value;});
      codeInput.addEventListener("blur",flushDeferredJoinRender);
      const joinButton=createElement("button","menuButton settingsConnectedAccountButton","JOIN PRIVATE PAIRING");joinButton.type="button";joinButton.disabled=pairingState.busy||!bindings.length||pairingState.status==="paired";
      createButton.addEventListener("click",async()=>{
        const binding=selectedBinding();if(!binding)return;
        setState({status:"creating-pair",busy:true,selectedBindingKey:bindingKey(binding),capability:null,expiresAtEpochMs:null,message:"Creating a private one-use pairing code…"});
        try{const context=await resolveConnectedContext();const result=await createPairing({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,identity:context.identity,binding,cryptoImpl:root.crypto});if(!result.ok)throw errorWithCode(result.code,result.message);setState({status:"pair-open",busy:false,capability:result.capability,expiresAtEpochMs:result.expiresAtEpochMs,message:"Pairing code created. Share it directly with your friend. Connected Rivalry below is prefilled automatically. After the second manager joins, do not manually attach in the normal flow: return to Save Library or open Private Remote Joining and the same rivalry will verify and attach automatically. The pairing code still expires in 15 minutes and can be used once."});}
        catch(error){setState({status:"pair-error",busy:false,message:`${error&&error.message?error.message:"Private pairing could not be created."} Your Showdowns were not changed.`});}
      });
      joinButton.addEventListener("click",async()=>{
        const binding=selectedBinding();if(!binding)return;
        pairingJoinDraft=codeInput.value;
        setState({status:"joining-pair",busy:true,selectedBindingKey:bindingKey(binding),message:"Redeeming the private one-use pairing code…"});
        try{const context=await resolveConnectedContext();const result=await redeemPairing({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,identity:context.identity,binding,capability:pairingJoinDraft,cryptoImpl:root.crypto});if(!result.ok)throw errorWithCode(result.code,result.message);pairingJoinDraft="";setState({status:"paired",busy:false,capability:result.capability,expiresAtEpochMs:null,message:"Private managers are paired. The one code pasted above is retained as the exact Connected Rivalry ID, and Connected Rivalry below uses that same value automatically; no second copy, paste, or manual Attach is required in the normal flow."});}
        catch(error){setState({status:"pair-error",busy:false,message:`${pairingJoinErrorMessage(error)} Your Showdowns were not changed.`});}
      });
      form.append(select,createButton,codeInput,joinButton);panel.appendChild(form);
      if(pairingState.capability){
        const capabilityBox=createElement("div","settingsDataNote");
        const capabilityText=createElement("code","",pairingState.capability);
        capabilityBox.append(createElement("strong","",pairingState.status==="paired"?"CONNECTED RIVALRY ID · ONE PASTE CONFIRMED: ":"PRIVATE PAIRING CODE · COPY ONCE: "),capabilityText);
        panel.appendChild(capabilityBox);
        if(pairingState.status==="pair-open"){
          const copyButton=createElement("button","menuButton settingsConnectedAccountButton","COPY PAIRING CODE");
          copyButton.type="button";
          copyButton.addEventListener("click",async()=>{
            const capability=pairingState.capability;
            if(!capability)return;
            let copied=false;
            if(root.navigator&&root.navigator.clipboard&&typeof root.navigator.clipboard.writeText==="function"){try{await root.navigator.clipboard.writeText(capability);copied=true;}catch(_error){copied=false;}}
            if(!copied){
              const fallbackCopy=createElement("textarea","settingsConnectedAccountInput");fallbackCopy.value=capability;fallbackCopy.readOnly=true;fallbackCopy.setAttribute("aria-hidden","true");fallbackCopy.style.position="fixed";fallbackCopy.style.opacity="0";fallbackCopy.style.pointerEvents="none";root.document.body.appendChild(fallbackCopy);fallbackCopy.focus();fallbackCopy.setSelectionRange(0,capability.length);try{copied=Boolean(root.document.execCommand&&root.document.execCommand("copy"));}catch(_error){copied=false;}fallbackCopy.remove();
            }
            if(copied){setState({message:"Pairing code copied. Paste it exactly once into Player Two's Join Private Pairing field; Player One and Player Two Connected Rivalry will use the same ID automatically."});return;}
            if(root.getSelection&&root.document.createRange){const selection=root.getSelection();const range=root.document.createRange();range.selectNodeContents(capabilityText);selection.removeAllRanges();selection.addRange(range);}
            const status=panel.querySelector('[role="status"]');if(status)status.textContent="Automatic clipboard copy was unavailable. The full pairing code is selected; use your browser Copy command. The code itself was not changed.";
          });
          panel.appendChild(copyButton);
        }
      }
    }
    const note=createElement("p","settingsDataNote",pairingState.message);note.setAttribute("role","status");note.setAttribute("aria-live","polite");panel.appendChild(note);
    return panel;
  }

  function mountWhenSettingsReady(){
    if(!root.document)return Promise.resolve(false);
    return new Promise(resolve=>{
      let attempts=0;
      const tryMount=()=>{
        attempts+=1;
        const content=root.document.getElementById(SETTINGS_CONTENT_ID);
        const overlay=root.document.getElementById(SETTINGS_OVERLAY_ID);
        if(content&&overlay&&!overlay.classList.contains("hidden")){renderPanel();void initialize();resolve(true);return;}
        if(attempts>=40){resolve(false);return;}
        root.setTimeout(tryMount,50);
      };
      tryMount();
    });
  }

  function subscribe(listener){if(typeof listener!=="function")return ()=>{};pairingListeners.add(listener);return ()=>pairingListeners.delete(listener);}

  return freezeDeep({
    contractVersion:1,
    feature:"registered-devices-private-pairing",
    identityStorage:"indexeddb-private-device-only",
    canonicalLocalStorageKeys:Object.freeze(["careerModeShowdown.saveLibrary","careerModeShowdown.legacyShowdowns","careerModeShowdown.preferences"]),
    pairingCapabilityBits:PAIRING_CAPABILITY_BYTES*8,
    pairingTtlMs:PAIRING_TTL_MS,
    maxPairingTtlMs:MAX_PAIRING_TTL_MS,
    publicDiscovery:false,
    gameplaySync:false,
    remoteJoiningSessions:false,
    billingRequired:false,
    stableJoinEditor:true,
    generateDeviceIdentity,
    validDeviceIdentity,
    getOrCreateDeviceIdentity,
    resetDeviceIdentityCache,
    normalizeLocalBinding,
    bindingKey,
    pairingJoinErrorMessage,
    normalizeCapability,
    localBindingOptions,
    registerDevice,
    revokeRegisteredDevice,
    revokeDevice:revokeRegisteredDevice,
    createPairing,
    redeemPairing,
    revokePairing,
    initialize,
    mountWhenSettingsReady,
    subscribe,
    getState:()=>pairingState
  });
});
// Firestore budget layer (r75). Connected modules wrap the services they get from the runtime with
// CareerModeFirestoreBudget.services(...). Only firestoreSdk.runTransaction changes (plus read metering, r85); every poll keeps its cadence.
// 1. A transaction that only reads ends without a commit RPC, so it no longer sends one "verify" write per document it
//    read (the 2026-10-12 incident counted ~7K such writes in one hour). A transaction that writes commits exactly as before.
// 2. A read-only transaction first runs against recent reads. A document read in the last 2 s is reused, so a burst of
//    refreshes from several screens costs one read per document. When nobody waits (no tap in the last 5 s, no screen
//    waiting on the partner without a healthy listener, no fast check running) the background checks reuse documents for up
//    to 60 s. A check that sees a changed document re-runs on fresh reads only, so it never mixes old and new documents. This
//    account's own account and device documents (only this account can change them) are reused for 5 minutes. A document
//    this page wrote, a page that became visible again and any write all go to the server. Reads of the same document that
//    are in flight together share one request. If the transaction wants to write, it runs as a normal server transaction.
// 3. A "resource-exhausted" answer (the free daily limit) pauses all Firestore traffic from this page for 10 minutes
//    (then 20, 40, 60) and publishes one plain message for the screens that would otherwise show a misleading error.
(function(root){
  "use strict";
  if(!root||root.CareerModeFirestoreBudget)return;
  const FSB_QUOTA_MESSAGE="Today's free online limit is used up. It resets at 3 am Boston time. Your saved career is safe.";
  const FSB_PAUSE_STEPS_MS=Object.freeze([10,20,40,60].map(minutes=>minutes*60000));
  const FSB_COALESCE_MS=2000,FSB_OWN_ACCOUNT_MS=5*60000,FSB_MAX_ENTRIES=200;
  const FSB_LIVE_QUIET_MS=300000;
  // r84: while the only screens watching are open on their own turn (Transfer window/guesses/signings, Season Results entry),
  // and not waiting on the partner, their listener is trusted for 2 min between server checks (30 s while waiting on the partner).
  // A partner's move still arrives at once through the listener, whose delivery forgets every other copy; a tap still reads fresh.
  const FSB_RELAXED_CONFIRM_MS=120000;
  const FSB_QUIET_MS=60000,FSB_INPUT_FRESH_MS=5000,FSB_ASK_MS=7000,FSB_FAST_GAP_MS=6000,FSB_FAST_HOLD_MS=10000;
  // fsbServerNext: documents whose next read must reach the server (no copy, no read already in flight), set by readServerNext.
  const fsbServerNext=new Map();
  const fsbWrapped=new WeakMap(),fsbEntries=new Map(),fsbInflight=new Map(),fsbCadence=new Map(),fsbWaitAsks=new Map(),fsbFreshPaths=new Map();
  const fsbStats={immutableReuses:0,reusedReads:0,quietReuses:0,freshReruns:0,serverReads:0,serverTransactions:0,readOnlyWithoutCommit:0,quotaTrips:0,pausedRefusals:0,brakeTrips:0,brakeSince:0,listenersAttached:0,listenerDeliveries:0,listenerServed:0,listenerFallbacks:0,peekWrites:0,transactionKept:0,contextServed:0,directReads:0,directFailures:0,deniedRefusals:0};
  let fsbPause=null,fsbResumeTimer=null,fsbAccountId=null,fsbFirestore=null,fsbInputAt=0,fsbFreshAskAt=0,fsbChainAt=0;
  // After the listener sees the partner's move (or the page comes back from hidden) every screen re-checks in a short chain
  // (commit -> scoring -> history -> final result). A document read after that moment already reflects it, so for the next
  // 6 s the chain reuses it instead of reading it again for each screen.
  const FSB_CHAIN_MS=6000;
  // r84 read brake and daily count (Nik 2026-10-26: 25 seasons a day must be a real floor). Every server read and listener
  // delivery this page makes is counted, per minute and per Google day (Pacific, resets 3 am Boston). When nobody has
  // tapped for a minute and this page made 150+ reads in the last 5 minutes (normal waiting is 5-30), background checks
  // reuse every copy for at least 15 s until the next tap: an unknown loop costs at most a few reads a minute instead of the day's allowance.
  // Taps, writes, readServerNext and a healthy listener are untouched, so play stays instant; the brake lets go by itself.
  const FSB_BRAKE_WINDOW_MS=5*60000,FSB_BRAKE_READS=150,FSB_BRAKE_IDLE_MS=60000,FSB_BRAKE_REUSE_MS=15000;
  const FSB_DAY_KEY="careerModeFirestoreReadsDay",FSB_DAY_SAVE_EVERY=20,FSB_BILLED_PER_READ=2.8,FSB_FREE_READS_PER_DAY=50000,FSB_DAY_SEASONS=20,FSB_DEFAULT_SEASON_READS=135;
  // r86 reads accuracy (Nik 2026-10-28): what Google bills against the free 50,000 is every document read PLUS every document
  // the Security Rules look up (get()/exists()) to allow a read or a write. r84/r85 multiplied this phone's document reads by
  // 2.8; now each request is priced by its own path from this table, generated from the composed production Rules by
  // tests/browser/support/rules-lookups.cjs (the CE2PG billed meter prices with the same derivation, so phone and test agree):
  //   [path pattern, lookups of a read while the Showdown is live, lookups once it is finished, documents a write may look up].
  // A live Showdown's read stops at its first allow branch (the rivalry); a finished one also checks the signed-in account.
  // A listener's Rules are evaluated when it starts and again each time its results update or it comes back online (Firebase
  // pricing, "Listeners and rules"), so every server delivery is billed its document plus its lookups. A write is priced at
  // every document its create or update rule can reach, once per request (a transaction is one request): an upper bound.
  // tests/contracts/r86-billed-counter-contracts.cjs fails when the Rules change and this table is not regenerated.
  const FSB_RULES_SHA256="bffd4bff694d6fa91d97c0b943b1fd6c40f7e125db4acb53639684a31dd86e9e";
  // BEGIN generated Rules lookup table (paths are priced here, never read or written by this module).
  const FSB_RULES_LOOKUPS=Object.freeze([
      ["accounts/*",0,0,[]],
      ["accounts/*/profileLinks/*",0,0,[]],
      ["accounts/*/devices/*",0,0,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}"]],
      ["accounts/*/securityEvents/*",0,0,[]],
      ["accounts/*/pairLinks/*",0,0,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","accounts/{accountId}/careerIndex/current","rivalries/{after.data.rivalryId}","rivalries/{before.data.rivalryId}","rivalries/{before.data.rivalryId}/invites/{before.data.rivalryId}"]],
      ["accounts/*/careerIndex/*",0,0,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","accounts/{accountId}/careerIndex/current","accounts/{accountId}/careerIndex/{'page_'+stringafter.data.sealedPageCount}","accounts/{accountId}/pairLinks/current","accounts/{before.createdByAccountId}/careerIndex/current","rivalries/{@pair0}","rivalries/{next[prior.size]}"]],
      ["accounts/*/careerStart/*",1,1,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","accounts/{accountId}/careerIndex/current"]],
      ["accounts/*/partner/*",0,0,["accounts/{@self}","accounts/{accountId}/careerStart/current","rivalries/{after.pairedViaRivalryId}","rivalries/{request.resource.data.pairedViaRivalryId}"]],
      ["accounts/*/partnerInbox/*",0,0,["accounts/{@self}","accounts/{@self}/partner/current","accounts/{accountId}/partner/current","rivalries/{note.rivalryId}","rivalries/{note.rivalryId}/invites/{note.rivalryId}"]],
      ["accounts/*/careerSummary/*",1,1,["accounts/{@self}","rivalries/{rivalryId}"]],
      ["rivalries/*",1,2,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","accounts/{@self}/pairLinks/current","rivalries/{rivalryId}/invites/{rivalryId}","rivalries/{rivalryId}/seasonCommits/season_1","rivalries/{rivalryId}/seasonCommits/{seasonId}","rivalries/{rivalryId}/sessions/{intent.sessionId}","rivalries/{rivalryId}/sharedSetup/authoritative"]],
      ["rivalries/*/state/authoritative",1,2,["accounts/{@pair0}","accounts/{@pair1}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/state/authoritative/idempotency/{receiptKey}"]],
      ["rivalries/*/state/authoritative/idempotency/*",2,2,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}/state/authoritative"]],
      ["rivalries/*/invites/*",1,1,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}"]],
      ["rivalries/*/sharedSetup/authoritative",1,2,["accounts/{@pair0}","accounts/{@pair1}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/sessions/{after.activeSessionId}"]],
      ["rivalries/*/sharedSetup/leagueProjection",1,1,["accounts/{@self}","rivalries/{rivalryId}","rivalries/{rivalryId}/sharedSetup/authoritative"]],
      ["rivalries/*/careerStart/authoritative",1,1,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/sessions/{after.activeSessionId}","rivalries/{rivalryId}/sharedSetup/authoritative"]],
      ["rivalries/*/transferChallenges/*",1,2,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/careerStart/authoritative","rivalries/{rivalryId}/sessions/{after.activeSessionId}","rivalries/{rivalryId}/sharedSetup/authoritative","rivalries/{rivalryId}/transferChallenges/{transferId}/roles/{role}"]],
      ["rivalries/*/transferChallenges/*/roles/*",2,3,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/sessions/{after.activeSessionId}","rivalries/{rivalryId}/transferChallenges/{transferId}"]],
      ["rivalries/*/seasonResults/*",1,2,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/seasonResults/{seasonId}/roles/{role}","rivalries/{rivalryId}/sessions/{after.activeSessionId}","rivalries/{rivalryId}/sharedSetup/leagueProjection"]],
      ["rivalries/*/seasonResults/*/roles/*",2,3,["rivalries/{rivalryId}","rivalries/{rivalryId}/seasonResults/{seasonId}"]],
      ["rivalries/*/seasonCommits/*",1,2,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/seasonResults/{seasonId}","rivalries/{rivalryId}/seasonResults/{seasonId}/roles/{'playerOne'}","rivalries/{rivalryId}/seasonResults/{seasonId}/roles/{'playerTwo'}","rivalries/{rivalryId}/sessions/{after.activeSessionId}","rivalries/{rivalryId}/sharedSetup/authoritative"]],
      ["rivalries/*/meters/*",1,2,["rivalries/{rivalryId}"]],
      ["rivalries/*/sessions/*",2,2,["accounts/{@pair0}","accounts/{@pair1}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}"]],
      ["rivalries/*/sessionOffers/*",1,1,["accounts/{@pair0}","accounts/{@pair1}","rivalries/{rivalryId}","rivalries/{rivalryId}/sessions/{offer.sessionId}"]]
  ].map(row=>Object.freeze([Object.freeze(row[0].split("/")),row[1],row[2],Object.freeze(row[3])])));
  // END generated Rules lookup table.
  // A query (no single document path) is priced at one lookup per request: the signed-in account.
  const FSB_QUERY_LOOKUPS=1;
  // One season on one phone, game screens only (career pages are counted apart), documents + lookups, waits included: the
  // CE2PG billed measurement (npm run test:budget, 2026-10-29, mid pace, listener lookups on every update) of a 3-season
  // Showdown was 991 + 614 + 773 billed for both phones (first season with Start and Setup, a middle one, the last with
  // Final): about 400 per phone per season. Used until a season has been played on this phone.
  const FSB_DEFAULT_SEASON_BILLED=400;
  const fsbLookupCache=new Map();
  function fsbLookupRow(path){
    if(typeof path!=="string"||!path)return null;
    if(fsbLookupCache.has(path))return fsbLookupCache.get(path);
    const parts=path.replace(/^\/+/,"").split("/");
    const row=FSB_RULES_LOOKUPS.find(([pattern])=>pattern.length===parts.length&&pattern.every((part,index)=>part==="*"||part===parts[index]))||null;
    fsbLookupCache.set(path,row);if(fsbLookupCache.size>FSB_MAX_ENTRIES)fsbLookupCache.delete(fsbLookupCache.keys().next().value);
    return row;
  }
  function fsbReadLookups(path,finished=false){const row=fsbLookupRow(path);return row?row[finished?2:1]:FSB_QUERY_LOOKUPS;}
  // RE-08 (r87): one request is billed each distinct document once. The table's templates are already canonical (root.* is after.*,
  // the written rivalryId is the match's); across the documents of one request the signed-in account is one of the pair's two.
  function fsbWriteLookups(paths){const docs=new Set();for(const path of paths){const row=fsbLookupRow(path);if(row)for(const doc of row[3])docs.add(doc);}if(docs.has("accounts/{@pair0}")||docs.has("accounts/{@pair1}")){docs.delete("accounts/{@self}");docs.delete("accounts/{accountId}");}else if(docs.has("accounts/{@self}"))docs.delete("accounts/{accountId}");return docs.size;}
  // Today's billed reads on this phone, kept apart: game screens (including every write's lookups) and career pages
  // (History, Legacy, Trophy Room, Statistics, Rivalry, Season Final history: the direct gets of finished Showdowns).
  function fsbBill(units,career=false){
    if(!(units>0))return;
    const bill=fsbDayState().bill;
    if(career)bill.career+=units;else bill.game+=units;
    fsbDayUnsaved+=1;if(fsbDayUnsaved>=FSB_DAY_SAVE_EVERY)fsbSaveDay();
  }
  function fsbBillCost(bill){const costs=bill&&Array.isArray(bill.costs)?bill.costs.slice(-3):[];return costs.length?Math.round(costs.reduce((sum,cost)=>sum+cost,0)/costs.length):0;}
  // A season that runs past the Google day keeps its billed reads from before the reset (the new mark starts below 0 by them).
  // r87 (B2): role is this phone's manager role (kept across days: Daniel is always playerOne); setupCosts are the billed game reads
  // before a Showdown's first season starts (RE-05); startKey is the season whose start mark was taken; own and partner are the
  // two shared meter documents of today (fsbShare*). The start mark of a season still being played crosses midnight with its reads
  // (markGame), so a season started before the Pacific reset and finished after it keeps its whole measured cost (PR #1097 review).
  function fsbBillNextDay(bill){return {game:0,career:0,markGame:-Math.max(0,bill.game-bill.markGame),costs:[],lastCost:fsbBillCost(bill)||bill.lastCost||0,role:fsbShareRole(bill.role),setupCosts:[],startKey:typeof bill.startKey==="string"&&bill.startKey?bill.startKey:null,own:null,partner:null};}
  function fsbBillFrom(saved,today){
    const old=saved&&saved.bill&&typeof saved.bill==="object"?saved.bill:null,whole=value=>Number.isFinite(value)?Math.floor(value):0;
    const costs=old&&Array.isArray(old.costs)?old.costs.filter(cost=>Number.isFinite(cost)&&cost>0).slice(-FSB_DAY_SEASONS):[];
    const lastCost=Math.max(0,whole(old&&old.lastCost)),role=fsbShareRole(old&&old.role);
    if(!saved)return {game:0,career:0,markGame:0,costs:[],lastCost:0,role:null,setupCosts:[],startKey:null,own:null,partner:null};
    if(saved.day!==today)return fsbBillNextDay({game:Math.max(0,whole(old&&old.game)),markGame:whole(old&&old.markGame),costs,lastCost,role,startKey:old&&old.startKey});
    // A day first counted before r86 holds document reads only: they stay priced at the old 2.8 until that day ends.
    const game=old?Math.max(0,whole(old.game)):Math.round(Math.max(0,whole(saved.reads))*FSB_BILLED_PER_READ);
    const setupCosts=old&&Array.isArray(old.setupCosts)?old.setupCosts.filter(cost=>Number.isFinite(cost)&&cost>0).slice(-FSB_DAY_SEASONS):[];
    const own=fsbShareClean(old&&old.own),partner=fsbShareClean(old&&old.partner);
    return {game,career:old?Math.max(0,whole(old.career)):0,markGame:old&&whole(old.markGame)<=game?whole(old.markGame):game,costs,lastCost,role,setupCosts,startKey:old&&typeof old.startKey==="string"?old.startKey:null,own:own&&own.day===today?own:null,partner:partner&&partner.day===today?partner:null};
  }
  const fsbReadTimes=[];let fsbDay=null,fsbDayUnsaved=0,fsbDayStoreBroken=false;
  function fsbPacificDay(at){try{return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(at));}catch(_error){return new Date(at-8*3600000).toISOString().slice(0,10);}}
  function fsbDayState(at=fsbNow()){
    const day=fsbPacificDay(at);
    if(!fsbDay){fsbDay={day,reads:0,markReads:0,seasons:[],costs:[],lastCost:0,bill:fsbBillFrom(null,day)};try{const saved=JSON.parse((typeof root.readStorageValue==="function"&&root.readStorageValue(FSB_DAY_KEY))||"null");fsbDay.bill=fsbBillFrom(saved,day);if(saved&&Number.isFinite(saved.lastCost)&&saved.lastCost>0)fsbDay.lastCost=Math.floor(saved.lastCost);if(saved&&saved.day!==day){if(fsbSeasonCost(saved))fsbDay.lastCost=fsbSeasonCost(saved);fsbDay.markReads=-fsbCarried(saved);}if(saved&&saved.day===day&&Number.isFinite(saved.reads)&&saved.reads>=0){fsbDay.reads=Math.floor(saved.reads);if(Number.isFinite(saved.markReads)&&saved.markReads<=fsbDay.reads)fsbDay.markReads=Math.floor(saved.markReads);if(Array.isArray(saved.seasons))fsbDay.seasons=saved.seasons.filter(key=>typeof key==="string").slice(-FSB_DAY_SEASONS);if(Array.isArray(saved.costs))fsbDay.costs=saved.costs.filter(cost=>Number.isFinite(cost)&&cost>0).slice(-FSB_DAY_SEASONS);}}catch(_error){}}
    if(fsbDay.day!==day){fsbDay={day,reads:0,markReads:-fsbCarried(fsbDay),seasons:[],costs:[],lastCost:fsbSeasonCost(fsbDay)||fsbDay.lastCost||0,bill:fsbBillNextDay(fsbDay.bill)};fsbDayUnsaved=1;}
    return fsbDay;
  }
  // Saved through storage.js (the only module that touches browser storage); a failed write stops further saves so a
  // private window never repeats the storage notice. The count is a per-device convenience, never game state.
  function fsbSaveDay(){if(!fsbDay||!fsbDayUnsaved||fsbDayStoreBroken||typeof root.writeStorageValue!=="function")return;fsbDayUnsaved=0;try{if(root.writeStorageValue(FSB_DAY_KEY,JSON.stringify(fsbDay))===false)fsbDayStoreBroken=true;}catch(_error){fsbDayStoreBroken=true;}}
  // brake=false: the read counts toward today's total only, not the 5-minute brake window (direct career-history gets, r85).
  // lookups: the Rules lookups this request is billed (fsbReadLookups); career: a career-page read (fsbBill).
  function fsbCountRead(count=1,brake=true,lookups=0,career=false){
    if(!(count>0))return;
    const at=fsbNow(),day=fsbDayState(at);
    if(brake)for(let index=0;index<count;index+=1)fsbReadTimes.push(at);
    while(fsbReadTimes.length&&at-fsbReadTimes[0]>FSB_BRAKE_WINDOW_MS)fsbReadTimes.shift();
    if(fsbReadTimes.length>FSB_BRAKE_READS*4)fsbReadTimes.splice(0,fsbReadTimes.length-FSB_BRAKE_READS*4);
    day.reads+=count;fsbDayUnsaved+=count;
    fsbBill(count+(lookups>0?lookups:0),career);
    if(fsbDayUnsaved>=FSB_DAY_SAVE_EVERY)fsbSaveDay();
  }
  function fsbBraking(at=fsbNow()){
    if(at-fsbInputAt<FSB_BRAKE_IDLE_MS){fsbStats.brakeSince=0;return false;}
    // Once on, the brake holds until someone taps, so a loop cannot burst again each time the 5-minute window drains.
    if(fsbStats.brakeSince&&fsbInputAt<fsbStats.brakeSince)return true;
    while(fsbReadTimes.length&&at-fsbReadTimes[0]>FSB_BRAKE_WINDOW_MS)fsbReadTimes.shift();
    const on=fsbReadTimes.length>=FSB_BRAKE_READS;
    if(on&&!fsbStats.brakeSince)fsbStats.brakeTrips+=1;
    fsbStats.brakeSince=on?(fsbStats.brakeSince||at):0;
    return on;
  }
  // r86: thisPhone, game and career are this phone's own billed reads (documents + Rules lookups); billedEstimate is both phones.
  // Red team #9: career pages are never scaled, since only the phone that opens History or Legacy pays for them.
  // r87 (B2): with both phones' meter documents of today for the same season, billedEstimate is their sum, exactly the same number
  // on both phones (shared: the two documents, this phone's and the partner's, as of that season's ACKNOWLEDGED); otherwise it is the
  // B1 role-share estimate (estimated: true): this phone's game reads over its role's share of a season plus its career pages.
  function fsbReadsToday(){
    const day=fsbDayState(),bill=day.bill,here=bill.game+bill.career,shared=fsbShareFrom(bill.own,bill.partner,day.day);
    const mine=shared&&bill.own?fsbShareUsed(bill.own):null,estimate=Math.round(bill.game/fsbRoleShare(bill.role)+bill.career);
    return Object.freeze({day:day.day,reads:day.reads,billedEstimate:shared?shared.used:estimate,estimated:!shared,role:bill.role,
      shared:shared?Object.freeze({used:shared.used,season:shared.season,thisPhone:mine,partner:shared.used-mine,sinceThisPhone:Math.max(0,Math.round(here)-mine)}):null,
      thisPhone:Math.round(here),game:Math.round(bill.game),career:Math.round(bill.career),freeReadsPerDay:FSB_FREE_READS_PER_DAY});
  }
  // r84: seasons left today. Each season this page sees ACKNOWLEDGED records the reads it made since the previous one, so
  // the cost per season follows the pace actually played (a slow season waits longer and costs more). The partner's device
  // is assumed to cost the same. Until a season is finished today, the last day's average (or the r84 measured cost) is used.
  // r85: that measured cost is the r84 check trim's (gameplay/r84/CHECK_TRIM_PLAN.md: about 720-770 billed reads per season for
  // both phones, so about 135 reads per device at the 2.8 billed-per-read rate the composed Rules still give). The pre-trim 450
  // made a fresh device show about a third of the real seasons left.
  // A season that runs past the Google day keeps its reads from before the reset: the new day's mark starts below 0 by them.
  function fsbCarried(day){const reads=Number(day&&day.reads),mark=Number(day&&day.markReads);return Number.isFinite(reads)&&reads>0?Math.max(0,Math.floor(reads-(Number.isFinite(mark)?mark:0))):0;}
  function fsbSeasonCost(day){const costs=day&&Array.isArray(day.costs)?day.costs.filter(cost=>Number.isFinite(cost)&&cost>0).slice(-3):[];return costs.length?Math.round(costs.reduce((sum,cost)=>sum+cost,0)/costs.length):0;}
  // r87 RE-05 / RS-07: a Showdown's first season starts when Career Start is ready on this phone (noteSeasonStart, key
  // "rivalryId|1"). What this phone billed before it (Home, the pair wait and JOIN, setup, Special Player, Career Start, the
  // previous Showdown's tail) goes to setupCosts and never into a season's cost.
  function fsbNoteSeasonStart(key){
    if(typeof key!=="string"||!key)return false;
    const day=fsbDayState(),bill=day.bill;
    if(bill.startKey===key||day.seasons.includes(key))return false;
    const setup=bill.game-bill.markGame;
    if(setup>0){bill.setupCosts.push(setup);if(bill.setupCosts.length>FSB_DAY_SEASONS)bill.setupCosts.shift();}
    bill.startKey=key;bill.markGame=bill.game;fsbDayUnsaved+=1;fsbSaveDay();
    return true;
  }
  // info (r87): {role, season, rivalryId, firestore} from Season Commit. role is kept for the B1 estimate; with firestore this phone
  // writes its meter document and reads the partner's (fsbShareSeason). Without info (an older caller) nothing is written.
  function fsbNoteSeasonDone(key,live,info){
    if(typeof key!=="string"||!key)return false;
    const day=fsbDayState();
    // Already noted (a reload keeps the season key): no new snapshot, but a meter document written before the reload whose partner
    // read never ran gets that bounded read now (fsbShareResume, once per page).
    if(day.seasons.includes(key)){try{if(info&&typeof info==="object")fsbShareResume(info.firestore);}catch(_error){}return false;}
    const cost=day.reads-day.markReads;
    day.seasons.push(key);if(day.seasons.length>FSB_DAY_SEASONS)day.seasons.shift();
    // A commit first seen already ACKNOWLEDGED (a reload, an older season) only moves the mark: its cost is unknown.
    if(live===true&&cost>0){day.costs.push(cost);if(day.costs.length>FSB_DAY_SEASONS)day.costs.shift();}
    const bill=day.bill,billed=bill.game-bill.markGame,role=fsbShareRole(info&&info.role);
    const season=Number.isInteger(info&&info.season)?info.season:Number(String(key).split("|").pop());
    if(role)bill.role=role;
    // Season 1 counts only from its start mark; without one (a reload during the season) it only moves the mark.
    const steady=season>1||bill.startKey===key;
    if(live===true&&billed>0&&steady){bill.costs.push(billed);if(bill.costs.length>FSB_DAY_SEASONS)bill.costs.shift();}
    bill.markGame=bill.game;bill.startKey=null;
    day.markReads=day.reads;fsbDayUnsaved+=1;fsbSaveDay();
    try{fsbShareSeason(info,season);}catch(_error){}
    return true;
  }
  // r86: a season's cost is this phone's billed GAME reads between two ACKNOWLEDGED seasons (career pages opened meanwhile are
  // not part of it); what is left is the 50,000 less today's use of both phones.
  // r87 (B2): from both phones' meter documents, a season costs the two phones' recent season costs added up (each phone's average
  // of its last three, fsbShareFrom), the same on both phones. Without them (estimated) it is this phone's cost over its role's share.
  function fsbSeasonsLeftToday(){
    const day=fsbDayState(),bill=day.bill,shared=fsbShareFrom(bill.own,bill.partner,day.day);
    if(shared)return Object.freeze({seasons:fsbPaused()?0:shared.seasons,basis:"shared",estimated:false,season:shared.season,billedPerSeason:shared.perSeason,billedLeft:shared.left,billedToday:shared.used});
    const share=fsbRoleShare(bill.role),measured=fsbBillCost(bill),perPhone=measured||bill.lastCost||FSB_DEFAULT_SEASON_BILLED;
    const perSeason=perPhone/share,used=bill.game/share+bill.career,left=Math.max(0,FSB_FREE_READS_PER_DAY-used);
    return Object.freeze({seasons:fsbPaused()?0:Math.floor(left/perSeason),basis:measured?"today":bill.lastCost?"earlier":"estimate",estimated:true,season:null,billedPerSeason:Math.round(perSeason),billedLeft:Math.round(left),billedToday:Math.round(used)});
  }

  // r87 shared reads meter (B2). Each phone writes ONE small document, rivalries/{rid}/meters/{its role}, once a season when it
  // sees the season commit ACKNOWLEDGED: today's billed game and career reads of this phone (cumulative, Pacific day) and its last
  // three season costs. It reads the partner's document once, 8 s later (the partner sees the same ACKNOWLEDGED within seconds),
  // and once more 45 s later only if that document is not yet at the same season. Both phones then hold the same two documents and
  // compute the same total, cost per season and seasons left from them (fsbShareFrom orders them by role). Cost: one write (1 Rules
  // lookup: the rivalry) and one read (1 document + 1 lookup; 2 once the Showdown is Terminal-Closed, when the final season's read
  // lands) per phone per season, billed as game reads here. A refused first write of the day (Rules not deployed yet) stops the
  // meter for the day; a refused read, or a write refused after one succeeded, skips only that season; the partner's document missing (an older build never writes it), from another day,
  // or behind this phone's season: the B1 estimate, marked estimated. Never part of a game write, never a reason for an error.
  // Reads of the partner's document: 8 s after this phone's write, again 45 s later; a partner whose document exists but is behind
  // (a phone that was locked when the season was acknowledged) is read again at +3 and +10 min, then not again that season. A
  // missing document (an older build, or Rules not deployed) is read twice only.
  // B1 shares of a season's reads, measured on the CE2PG harness (READS_ESTIMATE_CONSISTENCY.md): the coordinator (Daniel, playerOne)
  // starts, locks and commits, so his phone reads about 55%.
  const FSB_ROLE_SHARE=Object.freeze({playerOne:0.55,playerTwo:0.45});
  const FSB_SHARE_READS_MS=Object.freeze([8000,45000,180000,600000]),FSB_SHARE_MISSING_READS=2;
  let fsbShareTimer=null,fsbShareOffDay=null,fsbRawSdk=null,fsbShareStarted=null;
  function fsbShareRole(role){return role==="playerOne"||role==="playerTwo"?role:null;}
  function fsbRoleShare(role){return FSB_ROLE_SHARE[role]||0.5;}
  function fsbShareWhole(value,max){return Number.isInteger(value)&&value>=0&&value<=max;}
  // A meter document as the Rules allow it (updatedAt aside), or null.
  function fsbShareClean(value){
    if(!value||typeof value!=="object")return null;
    const out={schemaVersion:value.schemaVersion,objectType:value.objectType,rivalryId:value.rivalryId,role:value.role,day:value.day,season:value.season,game:value.game,career:value.career,costs:Array.isArray(value.costs)?value.costs.slice():null};
    if(out.schemaVersion!==1||out.objectType!=="readsMeter"||typeof out.rivalryId!=="string"||!/^pair_[0-9a-f]{64}$/.test(out.rivalryId)||!fsbShareRole(out.role))return null;
    if(typeof out.day!=="string"||!/^20\d{2}-\d{2}-\d{2}$/.test(out.day)||!Number.isInteger(out.season)||out.season<1||out.season>10)return null;
    if(!fsbShareWhole(out.game,1000000)||!fsbShareWhole(out.career,1000000)||!out.costs||out.costs.length>3||!out.costs.every(cost=>Number.isInteger(cost)&&cost>0&&cost<=100000))return null;
    return Object.freeze({...out,costs:Object.freeze(out.costs)});
  }
  function fsbShareUsed(doc){return doc.game+doc.career;}
  function fsbShareCost(doc){return doc.costs.length?Math.round(doc.costs.reduce((sum,cost)=>sum+cost,0)/doc.costs.length):FSB_DEFAULT_SEASON_BILLED;}
  // Pure: the both-phones figures from the two documents, or null when they are not today's documents of the two roles of one
  // rivalry at one season. Ordered by role, so either phone (and either argument order) gives the same answer.
  function fsbShareFrom(a,b,today){
    const x=fsbShareClean(a),y=fsbShareClean(b);
    if(!x||!y||x.role===y.role||x.day!==today||y.day!==today||x.rivalryId!==y.rivalryId||x.season!==y.season)return null;
    const one=x.role==="playerOne"?x:y,two=x.role==="playerOne"?y:x;
    const used=fsbShareUsed(one)+fsbShareUsed(two),perSeason=fsbShareCost(one)+fsbShareCost(two),left=Math.max(0,FSB_FREE_READS_PER_DAY-used);
    return Object.freeze({used,perSeason,left,seasons:Math.floor(left/perSeason),season:one.season,playerOne:fsbShareUsed(one),playerTwo:fsbShareUsed(two)});
  }
  // This phone's document now: its last three season costs, or the cost it carries from an earlier day when none is measured yet.
  function fsbShareDoc(bill,day,rivalryId,season,role){
    const costs=bill.costs.slice(-3).map(cost=>Math.min(100000,Math.round(cost))).filter(cost=>cost>0);
    if(!costs.length&&bill.lastCost>0)costs.push(Math.min(100000,Math.round(bill.lastCost)));
    return fsbShareClean({schemaVersion:1,objectType:"readsMeter",rivalryId,role,day,season,game:Math.min(1000000,Math.round(bill.game)),career:Math.min(1000000,Math.round(bill.career)),costs});
  }
  // The raw (unmetered) getDoc/setDoc: the runtime's SDK when it has them (tests), otherwise the Firestore module the listeners
  // load from the runtime's own URL (one SDK instance). Billed here by hand, as game reads.
  async function fsbShareApi(){
    const usable=api=>api&&typeof api.doc==="function"&&typeof api.getDoc==="function"&&typeof api.setDoc==="function"&&typeof api.serverTimestamp==="function"?api:null;
    if(usable(fsbRawSdk))return fsbRawSdk;
    if(!usable(fsbSnapshotApi))await fsbLoadSnapshotApi();
    return usable(fsbSnapshotApi);
  }
  function fsbShareSeason(info,season){
    if(!info||typeof info!=="object"||!info.firestore||typeof info.rivalryId!=="string")return;
    const day=fsbDayState(),bill=day.bill,role=fsbShareRole(info.role);
    if(!role||fsbShareOffDay===day.day||fsbPaused())return;
    const doc=fsbShareDoc(bill,day.day,info.rivalryId,season,role);
    if(!doc)return;
    void fsbShareWrite(info.firestore,doc).then(written=>{if(written)fsbShareLater(info.firestore,doc,0);},()=>{});
  }
  async function fsbShareWrite(db,doc){
    const api=await fsbShareApi();
    if(!api)return false;
    const path=`rivalries/${doc.rivalryId}/meters/${doc.role}`;
    try{await api.setDoc(api.doc(db,"rivalries",doc.rivalryId,"meters",doc.role),{...doc,costs:[...doc.costs],updatedAt:api.serverTimestamp()});}
    // Refused before any write succeeded today: the Rules are not deployed yet, so the meter is off for the day. Refused after one
    // succeeded (a Showdown closed under this write): only this season is skipped.
    catch(error){if(fsbMeterFailureUnits(error))fsbBill(fsbWriteLookups([path]));const now=fsbDayState();if(fsbIsDeniedError(error)&&!(now.day===doc.day&&now.bill.own))fsbShareOffDay=doc.day;if(fsbIsQuotaError(error))fsbTrip();return false;}
    fsbBill(fsbWriteLookups([path]));
    const day=fsbDayState();if(day.day===doc.day){day.bill.own=doc;fsbDayUnsaved+=1;fsbSaveDay();}
    fsbShareStarted=fsbShareKey(doc);
    return true;
  }
  function fsbShareKey(doc){return `${doc.day}|${doc.rivalryId}|${doc.season}`;}
  // PR #1097 review: a reload between this phone's meter write and the partner read loses the read's timer while the saved day keeps
  // the own document and the season key (so noteSeasonDone returns early). This restarts the same bounded read sequence for the
  // restored document, once per page, without writing it again; nothing when the partner's document already matches.
  function fsbShareResume(db){
    if(!db||fsbShareTimer!==null)return false;
    const day=fsbDayState(),own=day.bill.own,partner=day.bill.partner;
    if(!own||own.day!==day.day||fsbShareOffDay===day.day||fsbPaused())return false;
    if(partner&&partner.rivalryId===own.rivalryId&&partner.season>=own.season)return false;
    const key=fsbShareKey(own);
    if(fsbShareStarted===key)return false;
    fsbShareStarted=key;fsbShareLater(db,own,0);
    return true;
  }
  function fsbShareLater(db,own,attempt){
    if(fsbShareTimer!==null&&typeof root.clearTimeout==="function")root.clearTimeout(fsbShareTimer);
    fsbShareTimer=null;
    if(typeof root.setTimeout!=="function"||attempt>=FSB_SHARE_READS_MS.length)return;
    fsbShareTimer=root.setTimeout(()=>{fsbShareTimer=null;void fsbShareRead(db,own).then(({doc,seen,stop})=>{
      if(stop||(doc&&doc.season===own.season&&doc.rivalryId===own.rivalryId))return;
      if(!seen&&attempt+1>=FSB_SHARE_MISSING_READS)return;
      fsbShareLater(db,own,attempt+1);
    },()=>{});},FSB_SHARE_READS_MS[attempt]);
  }
  async function fsbShareReadPartner(db,own){return (await fsbShareRead(db,own)).doc;}
  // {doc: today's partner document or null, seen: a partner document exists (any day), stop: nothing more to read this season}.
  async function fsbShareRead(db,own){
    const day=fsbDayState();
    if(fsbShareOffDay===day.day||fsbPaused()||!own||day.bill.own!==own)return {doc:null,seen:false,stop:true};
    const api=await fsbShareApi();
    if(!api)return {doc:null,seen:false,stop:true};
    const role=own.role==="playerOne"?"playerTwo":"playerOne",path=`rivalries/${own.rivalryId}/meters/${role}`,lookups=fsbReadLookups(path);
    let snapshot;
    try{snapshot=await api.getDoc(api.doc(db,"rivalries",own.rivalryId,"meters",role));}
    catch(error){fsbCountRead(fsbMeterFailureUnits(error),false,lookups);const denied=fsbIsDeniedError(error),quota=fsbIsQuotaError(error);if(quota)fsbTrip();return {doc:null,seen:false,stop:denied||quota};}
    const units=fsbMeterUnits(snapshot);fsbCountRead(units,false,units?lookups:0);
    let doc=null;try{doc=snapshot&&typeof snapshot.exists==="function"&&snapshot.exists()?fsbShareClean(snapshot.data()):null;}catch(_error){doc=null;}
    const now=fsbDayState(),seen=Boolean(doc&&doc.role===role&&doc.rivalryId===own.rivalryId);
    if(seen&&doc.day===now.day){now.bill.partner=doc;fsbDayUnsaved+=1;fsbSaveDay();return {doc,seen,stop:doc.season>own.season};}
    return {doc:null,seen,stop:false};
  }

  // r85 (audit F04): ONE read meter. Before, only this layer's transactions and listener deliveries were counted, while the
  // career marker, the career index, the finished-Showdown reader and the Season Final history called getDoc taken straight
  // from the SDK: a cold career visit of 100 finished Showdowns made 601 gets and left readsToday at 0. Now every route ends
  // in fsbMeterUnits/fsbMeterFailureUnits -> fsbCountRead:
  //  - transactions run through this layer: one per document the server returns to the transaction (unchanged);
  //  - direct getDoc/getDocs/getDocFromServer/getDocsFromServer: services(...) meters them when the runtime hands them out,
  //    and every module that takes them from the Firestore module itself passes them through meterSdk(...) first;
  //  - listeners: this layer's own (wait point, context) and the unowned ones (season-commit wait context, Home JOIN note,
  //    which pass their onSnapshot through meterSdk) count each delivery here.
  // What is counted is REQUESTED SERVER DOCUMENT READS, the unit of the free daily limit:
  //  - a document from the server: 1 (a missing document is still one read);
  //  - a query answer from the server: 1 per returned document, at least 1 (an empty answer is billed one read); a later
  //    delivery of a query listener: 1 per changed document;
  //  - a snapshot served from the local cache (metadata.fromCache) or a listener's echo of this page's own pending write: 0;
  //  - a request the server answered with an error (denied by Rules, invalid, not found...): 1, as Firestore bills it; one that
  //    never got an answer (offline/unavailable, cancelled, deadline, quota) or failed in the page before the SDK sent it: 0.
  // Each function is metered once (fsbMetered), so an SDK object handed through several screens never counts a read twice.
  // Direct gets count toward today's total but not the brake window, so a long cold career visit never slows the live checks.
  // The count stays a per-device estimate: Rules lookups (the 2.8 factor), the partner's phone and other devices are not seen.
  const FSB_ANSWERED_ERRORS=new Set(["permission-denied","unauthenticated","invalid-argument","not-found","failed-precondition","out-of-range","already-exists","internal","data-loss","unimplemented"]);
  const fsbMetered=new WeakSet(),fsbMeteredSdks=new WeakMap();
  function fsbMeterUnits(snapshot,listener=false,later=false){
    if(!snapshot||typeof snapshot!=="object")return 0;
    const meta=snapshot.metadata;
    if(meta&&meta.fromCache===true)return 0;
    if(listener&&meta&&meta.hasPendingWrites===true)return 0;
    if(Array.isArray(snapshot.docs)){
      if(later&&typeof snapshot.docChanges==="function"){try{return snapshot.docChanges().length;}catch(_error){return 0;}}
      return Math.max(1,snapshot.docs.length);
    }
    return 1;
  }
  function fsbMeterFailureUnits(error){
    if(!error||typeof error!=="object"||error.quotaPaused)return 0;
    return FSB_ANSWERED_ERRORS.has(String(error.code||"").toLowerCase().replace(/^firestore\//,"").replace(/_/g,"-"))?1:0;
  }
  // Red team R87-B-06: a direct get (career index, summaries) that hits the daily quota trips the same online-play pause as a
  // transaction, so Home shows the notice and nothing keeps asking.
  function fsbGetFailed(error,lookups){fsbStats.directFailures+=1;fsbCountRead(fsbMeterFailureUnits(error),false,lookups,true);if(fsbIsQuotaError(error))fsbTrip();}
  function fsbMeterGet(get){
    if(typeof get!=="function"||fsbMetered.has(get))return get;
    const metered=function(...args){
      let pending;
      const lookups=fsbReadLookups(fsbPathOf(args[0]),true);
      try{pending=get.apply(this,args);}catch(error){fsbGetFailed(error,lookups);throw error;}
      return Promise.resolve(pending).then(snapshot=>{const units=fsbMeterUnits(snapshot);fsbStats.directReads+=units;fsbCountRead(units,false,lookups,true);return snapshot;},error=>{fsbGetFailed(error,lookups);throw error;});
    };
    fsbMetered.add(metered);
    return metered;
  }
  // onSnapshot(ref, [options], observer | onNext, [onError], [onCompletion]): the callbacks are wrapped, the call is unchanged.
  function fsbMeterListen(listen){
    if(typeof listen!=="function"||fsbMetered.has(listen))return listen;
    const metered=function(ref,...rest){
      let served=false;const path=fsbPathOf(ref);
      const next=fn=>function(snapshot){const units=fsbMeterUnits(snapshot,true,served),first=!served;if(units||snapshot&&snapshot.metadata&&snapshot.metadata.fromCache===false)served=true;fsbCountRead(units,true,first||units?fsbReadLookups(path):0);return fn.apply(this,arguments);};
      const fail=fn=>function(error){fsbCountRead(fsbMeterFailureUnits(error),true,served?0:fsbReadLookups(path));return fn.apply(this,arguments);};
      let functions=0;
      const args=rest.map(arg=>{
        if(typeof arg==="function"){functions+=1;return functions===1?next(arg):functions===2?fail(arg):arg;}
        if(functions===0&&arg&&typeof arg==="object"&&(typeof arg.next==="function"||typeof arg.error==="function")){
          const observer={...arg};if(typeof arg.next==="function")observer.next=next(arg.next.bind(arg));if(typeof arg.error==="function")observer.error=fail(arg.error.bind(arg));if(typeof arg.complete==="function")observer.complete=arg.complete.bind(arg);
          functions=3;return observer;
        }
        return arg;
      });
      return listen.call(this,ref,...args);
    };
    fsbMetered.add(metered);
    return metered;
  }
  // r86: a single setDoc/updateDoc outside this layer's transactions (the career summary a career page saves) is one write
  // request; its Rules lookups count toward today's career-page reads.
  function fsbMeterWrite(write){
    if(typeof write!=="function"||fsbMetered.has(write))return write;
    const metered=function(ref,...rest){
      const path=fsbPathOf(ref);
      return Promise.resolve(write.call(this,ref,...rest)).then(value=>{fsbBill(fsbWriteLookups([path]),true);return value;},error=>{if(fsbMeterFailureUnits(error))fsbBill(fsbWriteLookups([path]),true);throw error;});
    };
    fsbMetered.add(metered);
    return metered;
  }
  const FSB_METERED_GETS=["getDoc","getDocs","getDocFromServer","getDocsFromServer"],FSB_METERED_WRITES=["setDoc","updateDoc"];
  function fsbMeterSdk(sdk){
    if(!sdk||typeof sdk!=="object"&&typeof sdk!=="function")return sdk;
    if(fsbMeteredSdks.has(sdk))return fsbMeteredSdks.get(sdk);
    const names=[...FSB_METERED_GETS,...FSB_METERED_WRITES,"onSnapshot"].filter(name=>typeof sdk[name]==="function"&&!fsbMetered.has(sdk[name]));
    if(!names.length)return sdk;
    const out={...sdk};
    for(const name of names)out[name]=name==="onSnapshot"?fsbMeterListen(sdk[name]):FSB_METERED_WRITES.includes(name)?fsbMeterWrite(sdk[name]):fsbMeterGet(sdk[name]);
    const frozen=Object.freeze(out);
    try{fsbMeteredSdks.set(sdk,frozen);fsbMeteredSdks.set(frozen,frozen);}catch(_error){}
    return frozen;
  }

  function fsbNow(){return Date.now();}
  function fsbPathOf(ref){return ref&&typeof ref.path==="string"?ref.path:"";}
  function fsbIsQuotaError(error){
    for(let item=error,depth=0;item&&typeof item==="object"&&depth<3;item=item.cause,depth+=1){
      const code=String(item.code||"").toLowerCase(),message=String(item.message||"");
      if(code==="resource-exhausted"||code==="resource_exhausted"||/resource[-_ ]exhausted|quota (?:has been )?exceeded/i.test(message))return true;
    }
    return false;
  }
  function fsbIsDeniedError(error){
    for(let item=error,depth=0;item&&typeof item==="object"&&depth<3;item=item.cause,depth+=1){
      const code=String(item.code||"").toLowerCase();
      if(code==="permission-denied"||code==="permission_denied"||code==="unauthenticated")return true;
    }
    return false;
  }
  // A denied read or write means this account or device may have lost its authority (revoked elsewhere): the pairing check
  // re-verifies the device on its next run instead of trusting its 10 minutes. A denied write, or a denied read of this
  // account, this device or the rivalry root, forgets everything this page kept. r86 red team #20: a denied read of any other
  // document (a Session after its Showdown closed, say) still forgets every shared copy and drops the context listeners, so
  // the next reads come from the server (Terminal Close's race check relies on a fresh rivalry read after a refused Session),
  // but keeps this account's and the settled copies, and backs off reading that document for 15 s, then 1 min, then 5 min
  // (a tap reads it again at once). Any shared document seen changed lifts every back-off, so a document the partner's move
  // makes readable is read at once. Before, one document that stayed refused sent every background check to the server on
  // every tick.
  const FSB_DENIED_STEPS_MS=[15000,60000,300000],fsbDenied=new Map();
  function fsbAuthorityPath(path){return !path||fsbOwnAccountPath(path)||/^rivalries\/[^/]+$/.test(path);}
  function fsbAuthorityDenied(error,path){
    if(!fsbIsDeniedError(error))return;
    if(fsbAuthorityPath(path)){fsbEntries.clear();fsbInflight.clear();fsbCtxDetach();}
    else{
      const at=fsbNow(),prev=fsbDenied.get(path),last=FSB_DENIED_STEPS_MS.length-1,step=prev&&at-prev.until<FSB_DENIED_STEPS_MS[last]?Math.min(prev.step+1,last):0;
      fsbDenied.delete(path);fsbDenied.set(path,{until:at+FSB_DENIED_STEPS_MS[step],step,error});
      if(fsbDenied.size>FSB_MAX_ENTRIES)fsbDenied.delete(fsbDenied.keys().next().value);
      fsbEntries.delete(path);if(fsbCtxWatches.has(path))fsbCtxDrop(path,true);
      for(const [other,entry] of fsbEntries)if(!fsbOwnAccountPath(other)&&!entry.immutable)entry.forgotten=true;
      fsbInflight.clear();fsbCtxDetach();
    }
    try{if(typeof root.dispatchEvent==="function"&&typeof root.CustomEvent==="function")root.dispatchEvent(new root.CustomEvent("career-mode-firestore-authority-denied"));}catch(_error){}
  }
  function fsbPaused(){return Boolean(fsbPause&&fsbNow()<fsbPause.until);}
  function fsbQuotaError(){fsbStats.pausedRefusals+=1;const error=new Error(FSB_QUOTA_MESSAGE);error.code="resource-exhausted";error.quotaPaused=true;return error;}
  function fsbQuotaMessage(error){return fsbPaused()||(error!==undefined&&fsbIsQuotaError(error))?FSB_QUOTA_MESSAGE:null;}
  function fsbState(){const paused=fsbPaused();return Object.freeze({paused,until:fsbPause?fsbPause.until:null,step:fsbPause?fsbPause.step:null,message:paused?FSB_QUOTA_MESSAGE:null});}
  function fsbPublish(){
    const state=fsbState();
    try{const html=root.document&&root.document.documentElement;if(html&&html.dataset){if(state.paused)html.dataset.firestoreQuota="paused";else delete html.dataset.firestoreQuota;}}catch(_error){}
    try{if(typeof root.dispatchEvent==="function"&&typeof root.CustomEvent==="function")root.dispatchEvent(new root.CustomEvent("career-mode-firestore-quota",{detail:state}));}catch(_error){}
  }
  function fsbTrip(){
    if(fsbPaused())return;
    const at=fsbNow(),recent=fsbPause&&at-fsbPause.until<2*60*60000;
    const step=recent?Math.min(fsbPause.step+1,FSB_PAUSE_STEPS_MS.length-1):0;
    fsbPause=Object.freeze({step,since:at,until:at+FSB_PAUSE_STEPS_MS[step]});
    fsbStats.quotaTrips+=1;
    fsbEntries.clear();
    fsbDetachWait();fsbCtxDetach();
    if(fsbResumeTimer!==null&&typeof root.clearTimeout==="function")root.clearTimeout(fsbResumeTimer);
    // One timer per pause, only to tell the screens that online play may resume; it reads nothing itself.
    fsbResumeTimer=typeof root.setTimeout==="function"?root.setTimeout(()=>{fsbResumeTimer=null;fsbPublish();},FSB_PAUSE_STEPS_MS[step]+50):null;
    fsbPublish();
  }
  function fsbHidden(){return Boolean(root.document&&root.document.visibilityState==="hidden");}
  // Documents the Rules make immutable once settled are kept: a season's published results (revision 2) and each manager's
  // published result (create-only), and a season commit once ACKNOWLEDGED (revision 3). None of them can be updated or
  // deleted again, so the history of past seasons is read once per page instead of on every check.
  function fsbImmutable(path,snapshot){
    try{
      if(!snapshot||typeof snapshot.exists!=="function"||!snapshot.exists())return false;
      if(/^rivalries\/[^/]+\/seasonResults\/[^/]+\/roles\/[^/]+$/.test(path))return true;
      const value=snapshot.data();
      if(/^rivalries\/[^/]+\/seasonResults\/[^/]+$/.test(path))return Boolean(value&&value.revision===2);
      if(/^rivalries\/[^/]+\/seasonCommits\/[^/]+$/.test(path))return Boolean(value&&value.phase==="ACKNOWLEDGED"&&value.revision===3);
      // r84: a confirmed setup (revision 6 is the last) and a ready Career Start (revision 2 is the last) never change again.
      if(/^rivalries\/[^/]+\/sharedSetup\/authoritative$/.test(path))return Boolean(value&&value.schemaVersion===1&&value.objectType==="sharedSetupLedger"&&value.revision===6&&value.phase==="SHOWDOWN_CONFIRMED");
      if(/^rivalries\/[^/]+\/careerStart\/authoritative$/.test(path))return Boolean(value&&value.schemaVersion===1&&value.objectType==="sharedCareerStart"&&value.revision===2&&value.phase==="CAREER_START_READY");
      // r86 red team #18: the league projection is create-only, and a COMPLETED season transfer has no further transition
      // (every update needs WINDOW_OPEN, GUESS_ENTRY or SIGNING_ENTRY before it) and cannot be deleted.
      if(/^rivalries\/[^/]+\/sharedSetup\/leagueProjection$/.test(path))return true;
      if(/^rivalries\/[^/]+\/transferChallenges\/[^/]+$/.test(path))return Boolean(value&&value.phase==="COMPLETED");
    }catch(_error){}
    return false;
  }
  // r86 red team #18: this account's own documents (account, this device) keep their 5-minute reuse across a return: a revoked
  // device or account is refused by the Rules on the next shared read, which forgets everything (fsbAuthorityDenied).
  // Before, every phone unlock re-read both, once per module that checks them.
  function fsbForgetAll(){fsbDenied.clear();for(const [path,entry] of [...fsbEntries])if(!entry.immutable&&!fsbOwnAccountPath(path))fsbEntries.delete(path);}
  if(typeof root.addEventListener==="function"){
    try{
      root.addEventListener("online",fsbForgetAll);
      root.addEventListener("pageshow",fsbForgetAll);
      if(root.document&&typeof root.document.addEventListener==="function"){
        // Back from hidden: forget what this page had and wake once every screen that was waiting on the partner when it
        // was hidden, so it catches up with one check now instead of on its next timer (no new timer, no repeated reads).
        root.document.addEventListener("visibilitychange",()=>{if(fsbHidden()){if(fsbCtxWatches.size)fsbCtxReturn=[...fsbCtxWatches.keys()];fsbWaitReturn=fsbWait&&fsbWait.healthy?{path:fsbWait.path,owners:[...fsbWait.owners].map(([owner,info])=>({owner,wake:info.wake,relaxed:info.relaxed}))}:null;fsbDetachWait();fsbCtxDetach();fsbWasHidden=true;return;}fsbForgetAll();fsbChainAt=fsbNow();if(fsbWasHidden){fsbListenReturning();fsbCtxReturning();fsbWaitReturning();}fsbWasHidden=false;fsbWakeReturning();});
        // A tap or key press means someone is acting now: for the next 5 s every check reads fresh (2 s coalescing only).
        for(const type of ["pointerdown","touchstart","keydown"])root.document.addEventListener(type,()=>{fsbInputAt=fsbNow();},{capture:true,passive:true});
        root.document.addEventListener("visibilitychange",()=>{if(root.document.visibilityState==="hidden")fsbSaveDay();});root.addEventListener?.("pagehide",fsbSaveDay);
      }
    }catch(_error){}
  }
  function fsbOwnAccountPath(path){
    if(!fsbAccountId)return false;
    const prefix=`accounts/${fsbAccountId}`;
    return path===prefix||(path.startsWith(`${prefix}/devices/`)&&path.split("/").length===4);
  }
  // A document asked for again 2-6 s after the previous ask, twice in a row, belongs to a fast check (pairing, joining,
  // history...): it reads fresh for the next 10 s even if that check never told the budget layer it is waiting.
  function fsbNoteAsk(path,at){
    const cadence=fsbCadence.get(path)||{last:0,run:0,fastUntil:0};
    const gap=at-cadence.last;
    if(gap>=FSB_COALESCE_MS){cadence.run=gap<=FSB_FAST_GAP_MS?cadence.run+1:0;cadence.last=at;}
    if(cadence.run>=2)cadence.fastUntil=at+FSB_FAST_HOLD_MS;
    fsbCadence.delete(path);fsbCadence.set(path,cadence);
    if(fsbCadence.size>FSB_MAX_ENTRIES)fsbCadence.delete(fsbCadence.keys().next().value);
    return cadence.fastUntil>at;
  }
  // Quiet reuse is for a settled pair only: a rivalry root that is still pending (or in any state other than active or
  // closed) is read fresh, so a partner's pairing is seen as soon as the screen checks.
  function fsbSettled(path,snapshot){
    if(!/^rivalries\/[^/]+$/.test(path))return true;
    try{const value=snapshot&&snapshot.exists()?snapshot.data():null;const state=value&&value.data&&value.data.connectionState;return state==="active"||state==="closed";}catch(_error){return false;}
  }
  function fsbReuseLimit(path,at,fast,snapshot){
    const limit=fsbReuseLimitNormal(path,at,fast,snapshot);
    return limit<FSB_BRAKE_REUSE_MS&&fsbBraking(at)?FSB_BRAKE_REUSE_MS:limit;
  }
  function fsbReuseLimitNormal(path,at,fast,snapshot){
    if(fsbOwnAccountPath(path))return FSB_OWN_ACCOUNT_MS;
    if(at-fsbInputAt<FSB_INPUT_FRESH_MS||at-fsbFreshAskAt<FSB_ASK_MS||(fsbFreshPaths.get(path)||0)>at||!fsbSettled(path,snapshot))return FSB_COALESCE_MS;
    // A screen waiting on the partner reads its waited document fresh unless the healthy listener watches exactly it.
    // r84: only that document. Every other document keeps the quiet reuse below; a fresh read that shows the waited
    // document changed forgets them all (fsbRemember), as a listener delivery does. Before, a dead listener made every
    // background check read fresh: ~60 reads/min per device for as long as the wait lasted.
    const live=fsbWaitLive();
    for(const [owner,ask] of fsbWaitAsks){
      if(at-ask.at>=FSB_ASK_MS){fsbWaitAsks.delete(owner);continue;}
      if(ask.path===path&&!(live&&fsbWait&&ask.path===fsbWait.path))return FSB_COALESCE_MS;
    }
    // r84: while a healthy listener watches the screen's document, a partner's move reaches this page through it and its
    // delivery forgets every other copy (fsbRemember), so those copies are kept for 5 min instead of 1. Measured on the
    // Transfer screen waiting on the partner, a 2 min reuse re-read the whole context every 2 min: ~40 billed reads/min.
    if(live)return FSB_LIVE_QUIET_MS;
    return fast?FSB_COALESCE_MS:FSB_QUIET_MS;
  }
  // Returns {snapshot,old} or null. old: the copy is older than the 2 s burst window (see fsbProbe's fresh re-run).
  function fsbWaitAskedPath(path,at){for(const ask of fsbWaitAsks.values())if(ask.path===path&&at-ask.at<FSB_ASK_MS)return true;return false;}
  function fsbReusable(path){
    const at=fsbNow(),fast=path?fsbNoteAsk(path,at):false;
    // r80: a listener known to be behind a server read this page already made (lagUntil) never answers: the newer
    // server copy does (or the server). Otherwise a write's bounded stale retry re-read the older copy and failed again.
    if(fsbWait&&path===fsbWait.path&&fsbWaitLive()&&!fsbWait.lagUntil){if(!fsbWaitHealthy())return null;fsbStats.listenerServed+=1;return {snapshot:fsbWait.snapshot,old:false};}
    const watched=fsbCtxServe(path);if(watched){fsbStats.contextServed+=1;return {snapshot:watched,old:false};}
    const entry=fsbEntries.get(path);
    if(entry&&entry.immutable&&!entry.dirty){fsbStats.immutableReuses+=1;return {snapshot:entry.snapshot,old:false};}
    if(!entry||entry.dirty||entry.forgotten)return null;
    const age=at-entry.at;
    // A hidden page renders nothing, so its background checks reuse what it already has; becoming visible forgets it all.
    if(fsbHidden())return {snapshot:entry.snapshot,old:age>FSB_COALESCE_MS};
    // Not for a rivalry that is still pending its pair or close, nor for a document a screen asked to read fresh.
    const chained=fsbChainAt>0&&at-fsbChainAt<FSB_CHAIN_MS&&entry.at>=fsbChainAt&&!((fsbFreshPaths.get(path)||0)>at)&&fsbSettled(path,entry.snapshot);
    if(!chained&&age>fsbReuseLimit(path,at,fast,entry.snapshot))return null;
    const old=!chained&&age>FSB_COALESCE_MS&&!fsbOwnAccountPath(path);
    if(old)fsbStats.quietReuses+=1;
    return {snapshot:entry.snapshot,old};
  }
  function fsbRemember(db,ref,snapshot){
    if(db!==fsbFirestore)return;
    const path=fsbPathOf(ref);
    if(!path)return;
    const before=fsbEntries.get(path);
    fsbEntries.delete(path);
    const entry={snapshot,at:fsbNow(),dirty:false,immutable:fsbImmutable(path,snapshot)};
    fsbEntries.set(path,entry);
    if(before&&!fsbOwnAccountPath(path)&&fsbSerial(before.snapshot)!==fsbSerial(snapshot))fsbDenied.clear();
    if(fsbWait&&path===fsbWait.path)fsbWaitServerRead(snapshot);
    fsbCtxServerRead(path,snapshot);
    // r84: a waited document read fresh (no healthy listener on it) that changed is the partner's move: forget the other
    // copies and start the chain, exactly like fsbWaitDelivery, so no screen acts on a copy older than that move.
    if(before&&!before.dirty&&!(fsbWait&&path===fsbWait.path&&fsbWaitLive())&&fsbWaitAskedPath(path,entry.at)&&fsbSerial(before.snapshot)!==fsbSerial(snapshot)){fsbForgetContext();entry.forgotten=false;fsbChainAt=entry.at;}
    if(fsbEntries.size>FSB_MAX_ENTRIES)fsbEntries.delete(fsbEntries.keys().next().value);
  }
  function fsbMarkWritten(db,paths){if(db!==fsbFirestore)return;for(const path of paths){const entry=fsbEntries.get(path);if(entry)entry.dirty=true;if(fsbWait&&fsbWait.path===path)fsbWait.dirty=true;const watch=fsbCtxWatches.get(path);if(watch)watch.dirty=true;}}

  // r84 trim: context listeners. While a shared Showdown is open (watchContext(rivalryId), asked by Terminal Close), the rivalry
  // root and the Session document this page reads are each watched by one listener instead of being re-read by every check
  // and by the 45 s END SHOWDOWN poll. Both change only a few times per season (a season accepted, a close, a join or expiry),
  // so a change reaches this page at once and costs one read; a check reads them from the listener while the server confirmed
  // the copy in the last 3 min (a delivery or a server read with the same content confirms it), otherwise from the server as before.
  // Hidden page, quota pause, denied read, account or database change: the listeners stop and every read goes to the server.
  const FSB_CTX_CONFIRM_MS=180000,FSB_CTX_RETRY_MS=60000;
  const fsbCtxWatches=new Map(),fsbCtxFailed=new Map(),fsbExternal=new Set();
  let fsbCtxRivalry=null,fsbCtxReturn=[];
  function fsbCtxDrop(path,failed){const watch=fsbCtxWatches.get(path);fsbCtxWatches.delete(path);if(watch&&typeof watch.unsubscribe==="function"){try{watch.unsubscribe();}catch(_error){}}if(watch&&watch.returning)fsbListened(path,null);if(failed){fsbStats.listenerFallbacks+=1;fsbCtxFailed.set(path,fsbNow()+FSB_CTX_RETRY_MS);}}
  function fsbCtxDetach(){for(const path of [...fsbCtxWatches.keys()])fsbCtxDrop(path,false);}
  function fsbCtxWanted(path){
    const rivalryId=fsbCtxRivalry&&fsbCtxRivalry.rivalryId;
    if(!rivalryId||typeof path!=="string")return false;
    const parts=path.split("/");
    return path===`rivalries/${rivalryId}`||(parts.length===4&&parts[0]==="rivalries"&&parts[1]===rivalryId&&parts[2]==="sessions"&&Boolean(parts[3]));
  }
  function fsbCtxServe(path){
    const watch=fsbCtxWatches.get(path);
    if(!watch||!watch.healthy||watch.dirty||!watch.snapshot)return null;
    return fsbNow()-watch.confirmedAt<=FSB_CTX_CONFIRM_MS?watch.snapshot:null;
  }
  function fsbCtxServerRead(path,snapshot){
    const watch=fsbCtxWatches.get(path);
    if(watch){if(watch.healthy&&fsbSerial(snapshot)===watch.serial)watch.confirmedAt=fsbNow();else if(watch.healthy&&!watch.dirty)watch.healthy=false;return;}
    // r86 red team #18: a document a screen's own authority listener already delivers (Season Commit's wait context) gets no
    // second listener: that listener forgets the copies on any change. Before, each return paid for both listeners.
    if(fsbExternal.has(path))return;
    if(fsbCtxSessionPath(path)&&path!==fsbCtxCurrentSession())return;
    fsbCtxAttach(path);
  }
  // The Session to watch is the one this page read most recently: an older Session still in the copies (a new Session was
  // opened without a reload) is never re-attached, so the current Session listener is not dropped and re-made on each wake.
  function fsbCtxSessionPath(path){return typeof path==="string"&&path.split("/").length===4;}
  function fsbCtxCurrentSession(){
    let best=null,at=-1;
    for(const [path,entry] of fsbEntries)if(fsbCtxWanted(path)&&fsbCtxSessionPath(path)&&entry.at>at){best=path;at=entry.at;}
    return best;
  }
  function fsbCtxDelivery(watch,snapshot){
    if(fsbCtxWatches.get(watch.path)!==watch)return;
    if(!snapshot||!snapshot.metadata||snapshot.metadata.fromCache||snapshot.metadata.hasPendingWrites){watch.healthy=false;return;}
    const serial=fsbSerial(snapshot),known=fsbEntries.get(watch.path);
    const before=watch.serial!==null?watch.serial:(known?fsbSerial(known.snapshot):null);
    watch.snapshot=snapshot;watch.serial=serial;watch.healthy=true;watch.dirty=false;watch.confirmedAt=fsbNow();
    fsbStats.listenerDeliveries+=1;fsbCountRead(fsbMeterUnits(snapshot,true),true,fsbReadLookups(watch.path));watch.priced=true;
    fsbEntries.delete(watch.path);fsbEntries.set(watch.path,{snapshot,at:fsbNow(),dirty:false,immutable:false});
    if(watch.returning){watch.returning=false;const listen=fsbListens.get(watch.path);if(listen){fsbListens.delete(watch.path);fsbStats.listenerServed+=1;listen.resolve(snapshot);}}
    if(before!==null&&before!==serial){fsbDenied.clear();fsbChainAt=fsbNow();const wake=fsbCtxRivalry&&fsbCtxRivalry.wake;if(typeof wake==="function"&&typeof root.setTimeout==="function")root.setTimeout(()=>{try{wake(watch.path);}catch(_error){}},0);}
  }
  function fsbCtxAttach(path){
    // r86 red team #19: a document Season Commit's authority listeners watch (fsbReturnPaths) or deliver (fsbExternal) gets
    // no second listener. Measured on a reload: both listened to the rivalry and the Session, 2 documents + 4 lookups more.
    if(!fsbCtxWanted(path)||fsbCtxWatches.has(path)||fsbReturnPaths.includes(path)||fsbExternal.has(path))return;
    const at=fsbNow();
    if(fsbPaused()||fsbHidden()||!fsbFirestore||(fsbCtxFailed.get(path)||0)>at)return;
    const api=fsbSnapshotApi;
    if(!api){fsbLoadSnapshotApi();return;}
    // One Session listener: a newer Session replaces the older one.
    if(path.split("/").length===4)for(const other of [...fsbCtxWatches.keys()])if(other.split("/").length===4)fsbCtxDrop(other,false);
    const watch={path,snapshot:null,serial:null,healthy:false,dirty:false,confirmedAt:0,unsubscribe:null};
    fsbCtxWatches.set(path,watch);fsbStats.listenersAttached+=1;
    try{
      watch.unsubscribe=api.onSnapshot(api.doc(fsbFirestore,path),{includeMetadataChanges:true},snapshot=>fsbCtxDelivery(watch,snapshot),error=>{fsbCountRead(fsbMeterFailureUnits(error),true,watch.priced?0:fsbReadLookups(path));if(fsbCtxWatches.get(path)!==watch)return;fsbCtxDrop(path,true);if(fsbIsQuotaError(error))fsbTrip();});
    }catch(_error){fsbCtxDrop(path,true);}
  }
  // r86 red team #18: back from hidden, the context listeners this page had are attached again at once, and a read of their
  // documents waits up to 5 s for the first server delivery (one read each) instead of every module reading them from the
  // server and the listener then reading them once more. A document an authority listener will deliver (fsbReturnPaths) is left to it.
  // Terminal Close stops the context watch while the page is hidden and asks for it again on return, so the paths wait for
  // that ask (fsbWatchContext) when the context is not set yet.
  function fsbCtxReturning(){
    if(!fsbCtxRivalry||fsbHidden())return;
    const paths=fsbCtxReturn;fsbCtxReturn=[];
    for(const path of paths){
      if(!fsbCtxWanted(path)||fsbReturnPaths.includes(path)||fsbExternal.has(path)||fsbListens.has(path))continue;
      fsbCtxAttach(path);
      const watch=fsbCtxWatches.get(path);if(!watch)continue;
      watch.returning=true;
      const listen={};listen.promise=new Promise(resolve=>{listen.resolve=resolve;});fsbListens.set(path,listen);
      if(typeof root.setTimeout==="function")root.setTimeout(()=>fsbListened(path,null),5000);
    }
  }
  function fsbWatchContext(rivalryId,wake){
    const id=typeof rivalryId==="string"&&/^pair_[0-9a-f]{64}$/.test(rivalryId)?rivalryId:null;
    if(!id){if(!fsbHidden())fsbCtxReturn=[];else if(fsbCtxWatches.size)fsbCtxReturn=[...fsbCtxWatches.keys()];fsbCtxRivalry=null;fsbCtxDetach();return false;}
    if(!fsbCtxRivalry||fsbCtxRivalry.rivalryId!==id){fsbCtxDetach();fsbCtxRivalry={rivalryId:id,wake};}
    else fsbCtxRivalry.wake=wake;
    if(fsbCtxReturn.length)fsbCtxReturning();
    const rootPath=`rivalries/${id}`;if(fsbEntries.has(rootPath))fsbCtxAttach(rootPath);
    const session=fsbCtxCurrentSession();if(session)fsbCtxAttach(session);
    return Boolean(fsbCtxServe(`rivalries/${id}`));
  }

  // Wait-point listener (r75). While a screen waits on the partner it may watch the one shared document the partner's
  // move changes. One listener per page at most. It is dropped when the page is hidden, the screen stops waiting, online
  // play pauses, or the listener errors or falls behind; the screen's own 3 s check keeps running throughout and simply
  // reads from the server again whenever the listener is not healthy. A change seen by the listener wakes the screen at once.
  const FSB_WAIT_CONFIRM_MS=30000,FSB_WAIT_LAG_MS=5000,FSB_WAIT_RETRY_MS=60000,FSB_WAIT_OWNER_MS=4500;
  const fsbWaitFailed=new Map(),fsbReturnWakes=new Map();
  let fsbWaitReturn=null,fsbWait=null,fsbSnapshotApi=null,fsbSnapshotApiPromise=null;
  function fsbStable(value){
    if(value===null||typeof value!=="object")return JSON.stringify(value);
    if(typeof value.toJSON==="function")return fsbStable(value.toJSON());
    if(Array.isArray(value))return `[${value.map(fsbStable).join(",")}]`;
    return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${fsbStable(value[key])}`).join(",")}}`;
  }
  function fsbSerial(snapshot){try{return snapshot&&typeof snapshot.exists==="function"&&snapshot.exists()?fsbStable(snapshot.data()):"null";}catch(_error){return null;}}
  function fsbVersion(snapshot){try{const time=snapshot&&snapshot._document&&snapshot._document.version&&snapshot._document.version.timestamp;return time&&Number.isFinite(time.seconds)&&Number.isFinite(time.nanoseconds)?[time.seconds,time.nanoseconds]:null;}catch(_error){return null;}}
  function fsbVersionCompare(a,b){if(!a||!b)return 0;return a[0]!==b[0]?a[0]-b[0]:a[1]-b[1];}
  function fsbLoadSnapshotApi(){
    if(fsbSnapshotApi||fsbSnapshotApiPromise)return fsbSnapshotApiPromise;
    const url=root.CareerModeProductionFirebaseRuntime&&root.CareerModeProductionFirebaseRuntime.firebaseFirestoreModule;
    if(typeof url!=="string"||!/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-firestore\.js$/.test(url)||!root.document)return null;
    fsbSnapshotApiPromise=Promise.resolve().then(()=>import(url)).then(module=>{fsbSnapshotApi=module&&typeof module.onSnapshot==="function"&&typeof module.doc==="function"?module:null;},()=>{fsbSnapshotApi=null;});
    return fsbSnapshotApiPromise;
  }
  function fsbWaitLive(){
    const wait=fsbWait;
    if(!wait||!wait.healthy||wait.dirty)return false;
    if(wait.lagUntil&&fsbNow()>wait.lagUntil){fsbWaitFail(wait.path);return false;}
    return true;
  }
  // The watched document itself is served from the listener only if the server confirmed it in the last 30 s.
  function fsbWaitHealthy(){return fsbWaitLive()&&fsbNow()-fsbWait.confirmedAt<=(fsbWaitRelaxed()?FSB_RELAXED_CONFIRM_MS:FSB_WAIT_CONFIRM_MS);}
  function fsbWaitRelaxed(){return Boolean(fsbWait&&fsbWait.owners.size&&[...fsbWait.owners.values()].every(info=>info.relaxed===true));}
  function fsbWaitServerRead(snapshot){
    const wait=fsbWait;
    if(!wait||!wait.healthy)return;
    const version=fsbVersion(snapshot),serial=fsbSerial(snapshot);
    // RS-03 (r87): a server read that returns exactly the listener's copy proves the listener is current, so it may serve again
    // even when this page's own write (or a write that threw) left it dirty without a new delivery.
    if(serial===wait.serial||fsbVersionCompare(version,wait.version)<0){wait.confirmedAt=fsbNow();if(serial===wait.serial)wait.dirty=false;return;}
    // The server has a newer copy than the listener: give the listener a moment to deliver it, otherwise drop it.
    if(!wait.lagUntil){wait.lagUntil=fsbNow()+FSB_WAIT_LAG_MS;wait.lagVersion=version;wait.lagSerial=serial;}
  }
  function fsbDetachWait(){const wait=fsbWait;fsbWait=null;if(wait&&typeof wait.unsubscribe==="function"){try{wait.unsubscribe();}catch(_error){}}if(wait&&wait.returning)fsbListened(wait.path,null);}
  function fsbWaitFail(path){fsbDetachWait();fsbStats.listenerFallbacks+=1;fsbWaitFailed.set(path,fsbNow()+FSB_WAIT_RETRY_MS);}
  // Forgotten copies are never reused, but their content is kept for change detection: a document that is merely forgotten
  // (not changed) must not count as changed, or every later check would re-run on fresh reads and forget again.
  function fsbForgetContext(){fsbDenied.clear();for(const [path,entry] of fsbEntries)if(!fsbOwnAccountPath(path))entry.forgotten=true;}
  function fsbWakeOwners(wait){
    for(const info of wait.owners.values()){
      const wake=info.wake;
      if(typeof wake!=="function")continue;
      if(typeof root.setTimeout==="function")root.setTimeout(()=>{try{wake();}catch(_error){}},0);
      else{try{wake();}catch(_error){}}
    }
  }
  function fsbWakeReturning(){
    for(const wake of fsbReturnWakes.values()){if(typeof root.setTimeout==="function")root.setTimeout(()=>{try{wake();}catch(_error){}},0);}
  }
  function fsbRouletteMarkOnly(path,snapshot){
    try{return /^rivalries\/[^/]+\/transferChallenges\/season_\d+$/.test(String(path||""))&&Boolean(snapshot&&snapshot.exists&&snapshot.exists())&&snapshot.data().phase==="NOT_STARTED";}catch(_error){return false;}
  }
  function fsbWaitDelivery(wait,snapshot){
    if(fsbWait!==wait)return;
    if(!snapshot||!snapshot.metadata||snapshot.metadata.fromCache||snapshot.metadata.hasPendingWrites){wait.healthy=false;return;}
    const serial=fsbSerial(snapshot),version=fsbVersion(snapshot);
    const before=wait.serial!==null?wait.serial:fsbSerial(fsbEntries.get(wait.path)&&fsbEntries.get(wait.path).snapshot);
    const changed=before!==null&&before!==serial;
    wait.snapshot=snapshot;wait.serial=serial;wait.version=version;wait.healthy=true;wait.dirty=false;wait.confirmedAt=fsbNow();
    if(wait.lagUntil&&(fsbVersionCompare(version,wait.lagVersion)>=0&&version!==null||serial===wait.lagSerial)){wait.lagUntil=0;wait.lagVersion=null;wait.lagSerial=null;}
    fsbStats.listenerDeliveries+=1;fsbCountRead(fsbMeterUnits(snapshot,true),true,fsbReadLookups(wait.path));wait.priced=true;
    if(wait.returning){wait.returning=false;const listen=fsbListens.get(wait.path);if(listen){fsbListens.delete(wait.path);fsbStats.listenerServed+=1;listen.resolve(snapshot);}}
    // r84 trim: the delivered server copy also becomes this page's copy. Before, a copy marked dirty by this page's own save
    // stayed behind the listener, so the next 30 s server check of the waited document always looked "changed" and re-ran
    // the whole check on fresh reads (about 9 documents) after every lock.
    fsbEntries.delete(wait.path);fsbEntries.set(wait.path,{snapshot,at:fsbNow(),dirty:false,immutable:fsbImmutable(wait.path,snapshot)});
    // r87 RT5-FLOW-02: a partner's roulette mark only adds a role to the season's pre-window Transfer document; no other
    // document can have changed with it, so the waiting screen wakes on the listener's copy without forgetting (and re-reading)
    // the rest of its context. Anything else, including the window opening, forgets as before.
    if(changed){if(!fsbRouletteMarkOnly(wait.path,snapshot)){fsbForgetContext();fsbChainAt=fsbNow();}fsbWakeOwners(wait);}
  }
  // r86 red team #18: back from hidden, the wait listener the page had is attached again at once for the same screens, and a
  // read of its document waits up to 5 s for its first server delivery, instead of the screen reading it from the server and
  // its next 3 s check attaching the listener (a second read).
  function fsbWaitReturning(){
    const back=fsbWaitReturn;fsbWaitReturn=null;
    if(!back||fsbReturnPaths.includes(back.path)||fsbListens.has(back.path))return;
    for(const info of back.owners)fsbWatchWaitPoint(info.owner,back.path,info.wake,{relaxed:info.relaxed});
    if(!fsbWait||fsbWait.path!==back.path||fsbWait.snapshot)return;
    fsbWait.returning=true;
    const listen={};listen.promise=new Promise(resolve=>{listen.resolve=resolve;});fsbListens.set(back.path,listen);
    if(typeof root.setTimeout==="function")root.setTimeout(()=>fsbListened(back.path,null),5000);
  }
  function fsbWatchWaitPoint(owner,path,wake,options){
    const at=fsbNow(),relaxed=Boolean(options&&options.relaxed===true);
    if(fsbWait){for(const [key,info] of [...fsbWait.owners])if(key!==owner&&at-info.seen>FSB_WAIT_OWNER_MS)fsbWait.owners.delete(key);if(!fsbWait.owners.size)fsbDetachWait();}
    const release=()=>{if(fsbWait&&fsbWait.owners.delete(owner)&&!fsbWait.owners.size)fsbDetachWait();return false;};
    if(typeof path!=="string"||!/^rivalries\/[^/]+(?:\/[^/]+\/[^/]+)+$/.test(path)){fsbWaitAsks.delete(owner);if(!fsbHidden())fsbReturnWakes.delete(owner);return release();}
    fsbWaitAsks.set(owner,{path,at});if(typeof wake==="function")fsbReturnWakes.set(owner,wake);
    if(fsbPaused()||fsbHidden()||!fsbFirestore||(fsbWaitFailed.get(path)||0)>at)return release();
    if(fsbWait&&fsbWait.path===path){fsbWait.owners.set(owner,{wake,seen:at,relaxed});return fsbWaitLive();}
    if(fsbWait&&!(fsbWait.owners.size===1&&fsbWait.owners.has(owner)))return false;
    const api=fsbSnapshotApi;
    if(!api){fsbLoadSnapshotApi();return release();}
    fsbDetachWait();
    const wait={path,owners:new Map([[owner,{wake,seen:at,relaxed}]]),snapshot:null,serial:null,version:null,healthy:false,dirty:false,confirmedAt:0,lagUntil:0,lagVersion:null,lagSerial:null,unsubscribe:null};
    fsbWait=wait;fsbStats.listenersAttached+=1;
    try{
      wait.unsubscribe=api.onSnapshot(api.doc(fsbFirestore,path),{includeMetadataChanges:true},snapshot=>fsbWaitDelivery(wait,snapshot),error=>{fsbCountRead(fsbMeterFailureUnits(error),true,wait.priced?0:fsbReadLookups(path));if(fsbWait!==wait)return;fsbWaitFail(path);if(fsbIsQuotaError(error))fsbTrip();fsbAuthorityDenied(error,path);});
    }catch(_error){if(fsbWait===wait)fsbWaitFail(path);}
    return false;
  }

  // One document, read on the server inside a transaction that ends before commit (one BatchGetDocuments, no write).
  // r76: the waiting screen's authority listeners stop while the page is hidden and start again when it returns. A read
  // of one of their documents that starts before that listener's first server delivery waits for it instead of reading the
  // same document again, so a return costs one read per document. A listener that cannot deliver, or has not delivered within 5 s, hands the read back.
  let fsbReturnPaths=[],fsbWasHidden=false;const fsbListens=new Map();
  function fsbListenReturning(){for(const path of fsbReturnPaths)if(!fsbListens.has(path)){const listen={};listen.promise=new Promise(resolve=>{listen.resolve=resolve;});fsbListens.set(path,listen);if(typeof root.setTimeout==="function")root.setTimeout(()=>fsbListened(path,null),5000);}}
  // Called by Season Commit's authority listeners: their first server delivery of a path (snapshot), or none (no path) when
  // they stop. While they deliver a path, the context listener leaves it to them (fsbExternal).
  function fsbListened(path,snapshot){if(path===undefined){fsbExternal.clear();for(const key of [...fsbListens.keys()])fsbListened(key,null);return;}if(snapshot)fsbExternal.add(path);const listen=fsbListens.get(path);if(!listen)return;fsbListens.delete(path);if(snapshot){fsbStats.listenerServed+=1;fsbRemember(fsbFirestore,{path},snapshot);}listen.resolve(snapshot||null);}
  function fsbReturnListen(paths){fsbReturnPaths=Array.isArray(paths)?paths.filter(path=>typeof path==="string"):[];if(!fsbReturnPaths.length)fsbExternal.clear();for(const path of fsbReturnPaths){const watch=fsbCtxWatches.get(path);if(watch){watch.returning=false;fsbCtxDrop(path,false);}}for(const path of [...fsbListens.keys()])if(!fsbReturnPaths.includes(path))fsbListened(path,null);}
  function fsbTakeServerNext(path){const until=fsbServerNext.get(path)||0;if(until)fsbServerNext.delete(path);return until>fsbNow();}
  function fsbReadOne(sdk,db,ref,serverOnly=false){
    const listen=fsbListens.get(fsbPathOf(ref));if(listen)return listen.promise.then(snapshot=>snapshot||fsbReadOne(sdk,db,ref));
    // A read in flight is shared only within the account that started it; one that lands after a sign-in change is not kept.
    const path=fsbPathOf(ref),account=fsbAccountId,key=path?`${account||""}|${path}`:ref;
    const denied=path?fsbDenied.get(path):null;
    if(denied&&denied.until>fsbNow()&&fsbNow()-fsbInputAt>=FSB_INPUT_FRESH_MS){fsbStats.deniedRefusals+=1;return Promise.reject(denied.error);}
    const running=serverOnly?null:fsbInflight.get(key);
    if(running)return running;
    const found={};
    const request=Promise.resolve().then(()=>sdk.runTransaction(db,transaction=>Promise.resolve(transaction.get(ref)).then(snapshot=>{found.snapshot=snapshot;throw found;}))).then(()=>{throw new Error("Firestore read returned no snapshot.");},error=>{
      if(error===found){fsbStats.serverReads+=1;fsbCountRead(1,true,fsbReadLookups(path));fsbDenied.delete(path);if(fsbAccountId===account)fsbRemember(db,ref,found.snapshot);return found.snapshot;}
      if(fsbIsQuotaError(error))fsbTrip();
      fsbAuthorityDenied(error,path);
      throw error;
    }).finally(()=>{if(fsbInflight.get(key)===request)fsbInflight.delete(key);});
    fsbInflight.set(key,request);
    return request;
  }

  const FSB_PROBE_WRITE={fsbProbe:"write"};
  // fresh=true: no reuse at all (only in-flight sharing). A probe that used an old copy and also read a document that changed
  // (or was not known) runs once more on fresh reads, so a screen never acts on a mix of old and new documents.
  async function fsbProbe(sdk,db,updateFunction,fresh=false){
    // RS-02 (r87): a fresh re-run reads each document once per pass, and keeps what cannot have changed (immutable documents, this
    // account's own within 5 min: what a server transaction keeps too); every other document is still read from the server.
    let write=false,old=false,changed=false;const pass=new Map();
    const refuse=()=>{write=true;throw FSB_PROBE_WRITE;};
    const transaction={
      get:ref=>{
        if(write)return Promise.reject(FSB_PROBE_WRITE);
        if(fsbPaused())return Promise.reject(fsbQuotaError());
        const path=fsbPathOf(ref);
        if(fresh&&pass.has(path))return pass.get(path);
        const serverOnly=fsbTakeServerNext(path),reused=fresh||serverOnly?null:fsbReusable(path);
        if(reused){fsbStats.reusedReads+=1;if(reused.old)old=true;return Promise.resolve(reused.snapshot);}
        const known=fsbEntries.get(path),prior=known?fsbSerial(known.snapshot):null;
        if(fresh&&!serverOnly){const kept=fsbTransactionKept(db,path);if(kept){const reuse=Promise.resolve(kept);pass.set(path,reuse);return reuse;}}
        const read=fsbReadOne(sdk,db,ref,serverOnly).then(snapshot=>{if(prior===null||prior!==fsbSerial(snapshot))changed=true;return snapshot;});
        if(fresh)pass.set(path,read);
        return read;
      },
      set:refuse,update:refuse,delete:refuse
    };
    const again=()=>{fsbStats.freshReruns+=1;fsbForgetContext();return fsbProbe(sdk,db,updateFunction,true);};
    try{
      const value=await updateFunction(transaction);
      if(write)return null;
      if(old&&changed)return again();
      return {value};
    }catch(error){
      if(write)return null;
      if(old&&changed&&error!==FSB_PROBE_WRITE&&!(error&&error.quotaPaused))return again();
      throw error;
    }
  }

  // r84 trim: a save made right after a tap first runs its function once on the copies this page already has (no read at all). When it wants to write,
  // it goes straight to the server transaction, so a save no longer pays every document twice (once in the read-only probe,
  // once in the transaction). When it only reads, or a document has no copy yet, the probe below runs exactly as before.
  const FSB_PEEK_STOP={fsbPeek:"stop"};
  async function fsbPeekWrites(updateFunction){
    let write=false,miss=false;
    const stop=()=>Promise.reject(FSB_PEEK_STOP);
    const wants=()=>{write=true;throw FSB_PEEK_STOP;};
    const transaction={
      get:ref=>{
        if(write||miss)return stop();
        const path=fsbPathOf(ref),entry=path?fsbEntries.get(path):null;
        if(path&&fsbWait&&fsbWait.path===path&&fsbWaitLive()&&fsbWait.snapshot&&!fsbWait.dirty)return Promise.resolve(fsbWait.snapshot);
        if(!entry||entry.dirty){miss=true;return stop();}
        return Promise.resolve(entry.snapshot);
      },
      set:wants,update:wants,delete:wants
    };
    try{await updateFunction(transaction);}catch(_error){}
    if(write)fsbStats.peekWrites+=1;
    return write;
  }
  // r84 trim: inside a writing transaction, a document the Rules never let change again (fsbImmutable: a confirmed setup, a
  // ready Career Start, published results, an acknowledged commit) and this account's own account/device documents (no
  // client can change an account; only this account can change its devices) are taken from this page's copy instead of
  // being read again. Every other document (rivalry, session, the document being saved) is still read in the transaction.
  function fsbTransactionKept(db,path){
    if(db!==fsbFirestore||!path)return null;
    const entry=fsbEntries.get(path);
    if(!entry||entry.dirty)return null;
    if(entry.immutable)return entry.snapshot;
    if(fsbOwnAccountPath(path)&&fsbNow()-entry.at<=FSB_OWN_ACCOUNT_MS)return entry.snapshot;
    return null;
  }
  async function fsbServerTransaction(sdk,db,updateFunction,rest){
    if(fsbPaused())throw fsbQuotaError();
    fsbStats.serverTransactions+=1;
    let wrote=false,written=[];
    const done={};
    try{
      const value=await sdk.runTransaction(db,async transaction=>{
        wrote=false;written=[];
        const proxy={
          get:ref=>{const kept=fsbTransactionKept(db,fsbPathOf(ref));if(kept){fsbStats.transactionKept+=1;return Promise.resolve(kept);}return Promise.resolve(transaction.get(ref)).then(snapshot=>{fsbStats.serverReads+=1;fsbCountRead(1,true,fsbReadLookups(fsbPathOf(ref)));fsbRemember(db,ref,snapshot);return snapshot;});},
          set:(ref,...args)=>{wrote=true;written.push(fsbPathOf(ref));transaction.set(ref,...args);return proxy;},
          update:(ref,...args)=>{wrote=true;written.push(fsbPathOf(ref));transaction.update(ref,...args);return proxy;},
          delete:ref=>{wrote=true;written.push(fsbPathOf(ref));transaction.delete(ref);return proxy;}
        };
        const result=await updateFunction(proxy);
        if(!wrote){done.value=result;throw done;}
        return result;
      },...rest);
      fsbMarkWritten(db,written);fsbBill(fsbWriteLookups(written));
      return value;
    }catch(error){
      if(error===done){fsbStats.readOnlyWithoutCommit+=1;return done.value;}
      // r80: a write that failed (a rival's write may have landed first) is followed by a check of what is stored now:
      // the next read of each document it wrote goes to the server, even if the listener delivers an older copy meanwhile.
      if(wrote&&fsbMeterFailureUnits(error))fsbBill(fsbWriteLookups(written));
      if(wrote){fsbMarkWritten(db,written);for(const path of written)if(path){fsbServerNext.set(path,fsbNow()+FSB_ASK_MS);if(fsbServerNext.size>FSB_MAX_ENTRIES)fsbServerNext.delete(fsbServerNext.keys().next().value);}}
      if(fsbIsQuotaError(error))fsbTrip();
      fsbAuthorityDenied(error);
      throw error;
    }
  }

  async function fsbRunTransaction(services,db,updateFunction,rest){
    if(fsbPaused())throw fsbQuotaError();
    const sdk=services.firestoreSdk;
    if(typeof updateFunction!=="function")return sdk.runTransaction(db,updateFunction,...rest);
    if(db!==fsbFirestore){fsbEntries.clear();fsbCtxDetach();fsbFirestore=db;}
    const uid=services.auth&&services.auth.currentUser&&services.auth.currentUser.uid||null;
    if(uid!==fsbAccountId){fsbEntries.clear();fsbInflight.clear();fsbReturnListen([]);fsbCtxDetach();fsbExternal.clear();fsbCtxReturn=[];fsbWaitReturn=null;fsbDenied.clear();fsbAccountId=uid;}
    // Only within a few seconds of a tap, when a save is likely; a background check, or a later automatic save, keeps the probe
    // path and timing exactly as before (the server transaction still decides every write).
    if(fsbNow()-fsbInputAt<FSB_INPUT_FRESH_MS&&await fsbPeekWrites(updateFunction))return fsbServerTransaction(sdk,db,updateFunction,rest);
    const answer=await fsbProbe(sdk,db,updateFunction);
    if(answer)return answer.value;
    return fsbServerTransaction(sdk,db,updateFunction,rest);
  }

  function fsbWrapServices(services){
    if(!services||typeof services!=="object"||services.ok!==true||!services.firestoreSdk||typeof services.firestoreSdk.runTransaction!=="function")return services;
    if(services.firestoreBudget===true)return services;
    const existing=fsbWrapped.get(services);
    if(existing)return existing;
    const sdk=services.firestoreSdk;
    fsbRawSdk=sdk;
    try{fsbShareResume(services.firestore);}catch(_error){}
    // A runtime that already hands out onSnapshot (none does today; the contract test does) is used as is; otherwise the
    // listener API is loaded from the same Firestore module URL the runtime uses, so it shares one SDK instance.
    if(!fsbSnapshotApi&&typeof sdk.onSnapshot==="function"&&typeof sdk.doc==="function")fsbSnapshotApi=Object.freeze({onSnapshot:sdk.onSnapshot,doc:sdk.doc});
    const wrapped=Object.freeze({...services,firestoreBudget:true,firestoreSdk:Object.freeze({...fsbMeterSdk(sdk),runTransaction:(db,updateFunction,...rest)=>fsbRunTransaction(services,db,updateFunction,rest)})});
    fsbWrapped.set(services,wrapped);
    return wrapped;
  }

  root.CareerModeFirestoreBudget=Object.freeze({
    contractVersion:1,
    quotaMessageText:FSB_QUOTA_MESSAGE,
    pauseStepsMs:FSB_PAUSE_STEPS_MS,
    coalesceMs:FSB_COALESCE_MS,
    ownAccountReuseMs:FSB_OWN_ACCOUNT_MS,
    services:fsbWrapServices,
    watchWaitPoint:fsbWatchWaitPoint,
    forgetContext:fsbForgetContext,
    returnListen:fsbReturnListen,
    listened:fsbListened,
    // watchContext(rivalryId, wake): watch this rivalry's root and current Session while a shared Showdown is open (null stops);
    // wake(path) runs when either changes. contextHealthy(path): a confirmed context listener serves this document now.
    watchContext:fsbWatchContext,
    contextHealthy:path=>Boolean(fsbCtxServe(path)),
    // watchesHealthy(path): a healthy wait listener watches exactly this document, so a 15 s screen check need not re-read it.
    watchesHealthy:path=>Boolean(typeof path==="string"&&fsbWait&&fsbWait.path===path&&fsbWaitHealthy()),
    // countListenerRead(): a server delivery of a listener this layer does not own (season-commit wait context, Home JOIN note)
    // still counts toward today's reads and the brake window.
    countListenerRead:()=>fsbCountRead(),
    // r85 meterSdk(sdk): the same SDK functions, with getDoc/getDocs/getDocFromServer/getDocsFromServer/onSnapshot counted by
    // the one read meter above (idempotent: an already metered SDK or function is returned as is). meterGet(fn) and
    // meterListen(fn) do the same for a single function. readUnits(snapshot) is what one snapshot counts (contract tests).
    meterSdk:fsbMeterSdk,
    meterGet:fsbMeterGet,
    meterListen:fsbMeterListen,
    readUnits:(snapshot,listener)=>fsbMeterUnits(snapshot,listener===true),
    // r86: the Rules lookups a read (live or finished Showdown) or one write request of these paths is billed, and the Rules
    // text the table was generated from (contract tests).
    rulesLookups:Object.freeze({rulesSha256:FSB_RULES_SHA256,read:(path,finished)=>fsbReadLookups(path,finished===true),write:paths=>fsbWriteLookups(Array.isArray(paths)?paths:[paths])}),
    quietReuseMs:FSB_QUIET_MS,
    inputFreshMs:FSB_INPUT_FRESH_MS,
    // wantFresh(): every read of this page is fresh for the next 7 s; wantFresh(path): only that document.
    wantFresh(path){if(typeof path==="string"&&path){fsbFreshPaths.set(path,fsbNow()+FSB_ASK_MS);if(fsbFreshPaths.size>FSB_MAX_ENTRIES)fsbFreshPaths.delete(fsbFreshPaths.keys().next().value);}else fsbFreshAskAt=fsbNow();},
    // readServerNext(path): the next read of that document goes to the server, even inside the 2 s window (revocation checks).
    readServerNext(path){if(typeof path==="string"&&path){fsbServerNext.set(path,fsbNow()+FSB_ASK_MS);if(fsbServerNext.size>FSB_MAX_ENTRIES)fsbServerNext.delete(fsbServerNext.keys().next().value);}},
    isQuotaError:fsbIsQuotaError,
    paused:fsbPaused,
    quotaMessage:fsbQuotaMessage,
    noteError(error){if(fsbIsQuotaError(error))fsbTrip();return fsbQuotaMessage(error);},
    state:fsbState,
    readsToday:fsbReadsToday,
    noteSeasonStart:fsbNoteSeasonStart,
    noteSeasonDone:fsbNoteSeasonDone,
    seasonsLeftToday:fsbSeasonsLeftToday,
    // r87 shared reads meter: sharedEstimate(a, b, day) is the pure both-phones result from two meter documents (contract tests);
    // meterDocuments() the two documents this phone holds today; readPartnerMeter() reads the partner's now (tests).
    sharedEstimate:(a,b,day)=>fsbShareFrom(a,b,typeof day==="string"?day:fsbDayState().day),
    meterDocuments:()=>{const bill=fsbDayState().bill;return Object.freeze({own:bill.own,partner:bill.partner,off:fsbShareOffDay===fsbDayState().day});},
    readPartnerMeter:db=>{const bill=fsbDayState().bill;return bill.own?fsbShareReadPartner(db||fsbFirestore,bill.own):Promise.resolve(null);},
    roleShare:fsbRoleShare,
    braking:()=>fsbBraking(),
    stats:()=>Object.freeze({...fsbStats,remembered:fsbEntries.size,watching:fsbWait?fsbWait.path:null,watchHealthy:fsbWaitLive()}),
    reset(){fsbDetachWait();fsbCtxRivalry=null;fsbCtxDetach();fsbExternal.clear();fsbCtxReturn=[];fsbWaitReturn=null;fsbDenied.clear();fsbCtxFailed.clear();fsbReturnListen([]);fsbWaitFailed.clear();fsbReturnWakes.clear();fsbEntries.clear();fsbInflight.clear();fsbCadence.clear();fsbWaitAsks.clear();fsbFreshPaths.clear();fsbServerNext.clear();fsbPause=null;fsbInputAt=0;fsbFreshAskAt=0;fsbChainAt=0;fsbPublish();}
  });
})(typeof globalThis!=="undefined"?globalThis:this);

```


## FILE: js/connectPlayersScreenV10.js
```javascript
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeConnectPlayersScreenV10=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  // JOB-1015: a lazy presentation layer. The startup router and pairing operations stay untouched.
  const MARKUP=[
    "<section id=\"connectPlayersScreen\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"connectPlayersTitle\" aria-hidden=\"true\" class=\"connectPlayersLayer hidden\" data-role=\"unknown\" data-connection=\"none\">",
    // r78 HO-031: the phone plate ENV_CONNECT_PLAYERS_PHONE_V2 has both managers painted in, so the phone cut-outs
    // (OVL_SJ_*_PHONE_V1) are gone. The two holders stay: the scene still keeps the header's place in the column.
    "<div class=\"connectPlayersArt\" aria-hidden=\"true\">",
    "</div>",
    "<main class=\"connectPlayersPhoneFlow\" aria-labelledby=\"connectPlayersTitle\">",
    "<div class=\"connectPlayersPhoneScene\" aria-hidden=\"true\">",
    "</div>",
    "<header class=\"connectPlayersHeader\">",
    "<p class=\"connectPlayersKicker\">CAREER MODE SHOWDOWN // 17</p>",
    // r80 (Team V HO-033): the title is the TITLE_CONNECT_PLAYERS_V1 picture; the words stay as visually hidden text.
    "<h2 id=\"connectPlayersTitle\"><img class=\"connectPlayersWordmark\" src=\"visual-assets/v10_1/shared/wordmarks/TITLE_CONNECT_PLAYERS_V1.webp\" alt=\"\" aria-hidden=\"true\" decoding=\"async\"><span class=\"connectPlayersTitleText\">CONNECT PLAYERS</span></h2>",
    "<p class=\"connectPlayersTagline\">Connect Daniel and Nik before the career starts.</p>",
    "</header>",
    "<div class=\"connectPlayersWorkspace\">",
    "<div class=\"connectPlayersTabRow\">",
    "<div class=\"connectPlayersTabs\" role=\"group\" aria-label=\"Connection steps\">",
    "<label><input type=\"radio\" name=\"connectPlayersTab\" id=\"connectPlayersDanielTab\" value=\"daniel\" checked><span>DANIEL \u00b7 START</span></label>",
    "<label><input type=\"radio\" name=\"connectPlayersTab\" id=\"connectPlayersNikTab\" value=\"nik\"><span>NIK \u00b7 JOIN</span></label>",
    "<label><input type=\"radio\" name=\"connectPlayersTab\" id=\"connectPlayersConnectionTab\" value=\"connection\"><span>CONNECTION</span></label>",
    "</div>",
    "<button class=\"connectPlayersBack\" type=\"button\">BACK</button>",
    "</div>",
    "<div class=\"connectPlayersRoles\">",
    "<section class=\"connectPlayersRole connectPlayersRoleDaniel\" aria-label=\"Daniel starts\">",
    "<span>PLAYER ONE</span><h3>DANIEL \u00b7 START</h3>",
    "<p>Choose seasons, create your code, and send it to Nik.</p>",
    "<button id=\"connectPlayersSetup\" class=\"menuButton\" type=\"button\">CHOOSE SEASONS</button>",
    "</section>",
    "<section class=\"connectPlayersRole connectPlayersRoleNik\" aria-label=\"Nik joins\">",
    "<span>PLAYER TWO</span><h3>NIK \u00b7 JOIN</h3>",
    "<p>On Nik's device, paste Daniel's code to join.</p>",
    "</section>",
    "</div>",
    "<div id=\"connectPlayersPairSlot\" aria-live=\"polite\"></div>",
    "</div>",
    "</main>",
    "</section>"
  ].join("\n");
  let layer=null,opening=null,opener=null,observer=null,homeObserver=null;
  const PRIMARY=/^(START A SHOWDOWN|CHOOSE SEASONS|CREATE CODE FOR NIK|JOIN DANIEL'S SHOWDOWN|START CAREER|TRY CONTINUE AGAIN|RESTORE BACKUP)$/;
  const inertBefore=new Map();
  function byId(id){return root.document?.getElementById(id)||null;}
  function report(error){root.reportApplicationError?.("Unable to open Connect Players",error);}
  async function loadPair(){
    if(!root.CareerModePersistentNikDanielPair){
      await root.loadRuntimeScript("persistent-pair","js/persistentNikDanielPair.js",()=>root.CareerModePersistentNikDanielPair);
    }
    return root.CareerModePersistentNikDanielPair;
  }
  function updatePresentation(){
    if(!layer)return;
    const pair=root.CareerModePersistentNikDanielPair?.getState?.()||{};
    const identity=root.CareerModeOnlinePlayerIdentity?.getState?.()||{};
    const role=pair.managerRole||(identity.managerId==="daniel"?"playerOne":identity.managerId==="nik"?"playerTwo":null);
    layer.dataset.role=role==="playerOne"?"daniel":role==="playerTwo"?"nik":"unknown";
    layer.dataset.connection=pair.connectionState||"none";
    const mode=pair.connectionState?"connection":role==="playerTwo"?"nik":"daniel";
    if(layer.dataset.pairViewMode!==mode){
      layer.dataset.pairViewMode=mode;
      const tab=byId(mode==="connection"?"connectPlayersConnectionTab":mode==="nik"?"connectPlayersNikTab":"connectPlayersDanielTab");
      if(tab)tab.checked=true;
    }
    // pairRender owns every control and listener; its original inline skin is removed here only.
    const panel=byId("persistentNikDanielPairPanel");
    if(panel){
      panel.removeAttribute("style");for(const node of panel.querySelectorAll("[style]"))node.removeAttribute("style");
      // Team V's design: the yellow title above is the only CONNECT PLAYERS heading; main actions are solid yellow.
      for(const heading of panel.querySelectorAll(":scope>strong"))heading.classList.toggle("connectPlayersRepeat",heading.textContent.trim()==="CONNECT PLAYERS");
      for(const button of panel.querySelectorAll("button"))button.classList.toggle("connectPlayersPrimary",PRIMARY.test(button.textContent.trim()));
    }
  }
  function setBackgroundInert(active){
    if(active){
      for(const node of layer.parentElement.children){
        if(node===layer)continue;
        if(!inertBefore.has(node))inertBefore.set(node,node.inert);
        node.inert=true;
      }
    }else{
      for(const [node,value] of inertBefore)node.inert=value;
      inertBefore.clear();
    }
  }
  function close(options={}){
    if(!layer)return false;
    layer.classList.add("hidden");layer.setAttribute("aria-hidden","true");
    setBackgroundInert(false);
    // Announce the layer closing to its subscribers.
    try{root.document.dispatchEvent(new root.CustomEvent("career-mode-connect-players-closed"));}catch(_error){}
    if(options.restoreFocus!==false){
      const target=opener?.isConnected&&opener.getClientRects().length?opener:byId("newShowdown");
      target?.focus?.();
    }
    return true;
  }
  async function chooseSeasons(){
    // r79: only Daniel starts Showdowns; Nik's device never opens the seasons screen.
    if(root.CareerModeOnlinePlayerIdentity?.getState?.()?.managerId==="nik")return false;
    close({restoreFocus:false});
    if(typeof root.navigateTo==="function")return root.navigateTo("createShowdown");
    return root.showScreen?.("createShowdown");
  }
  function ensureLayer(){
    if(layer?.isConnected)return layer;
    const doc=root.document,app=byId("app");
    if(!doc||!app)throw new Error("The application layer is unavailable.");
    const holder=doc.createElement("div");holder.innerHTML=MARKUP;layer=holder.firstElementChild;
    app.appendChild(layer);
    layer.querySelector(".connectPlayersBack").addEventListener("click",()=>close());
    byId("connectPlayersSetup").addEventListener("click",()=>void chooseSeasons().catch(report));
    layer.addEventListener("click",event=>{
      const button=event.target.closest?.("#persistentNikDanielPairPanel button");
      if(button&&!button.disabled&&/^(START CAREER|TRY CONTINUE AGAIN|RESTORE BACKUP)$/.test(button.textContent.trim()))close({restoreFocus:false});
    },true);
    layer.addEventListener("keydown",event=>{
      if(event.key==="Escape"){event.preventDefault();event.stopPropagation();close();return;}
      if(event.key!=="Tab")return;
      const nodes=[...layer.querySelectorAll("button:not(:disabled),input:not(:disabled)")].filter(node=>node.getClientRects().length);
      const first=nodes[0],last=nodes[nodes.length-1];
      if(event.shiftKey&&doc.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&doc.activeElement===last){event.preventDefault();first?.focus();}
    });
    if(typeof root.MutationObserver==="function"){
      observer=new root.MutationObserver(updatePresentation);
      observer.observe(byId("connectPlayersPairSlot"),{childList:true,subtree:true});
      const home=byId("mainMenu");
      if(home){
        homeObserver=new root.MutationObserver(()=>{if(home.classList.contains("hidden")&&!layer.classList.contains("hidden"))close({restoreFocus:false});});
        homeObserver.observe(home,{attributes:true,attributeFilter:["class"]});
      }
    }
    return layer;
  }
  // r75 ready gate (owner, 2026-10-13): Connect Players' plate is the layer's own CSS background, so on a slow link the layer
  // opened as a dark panel and the plate painted in seconds later. The plate this screen picks (an image-set density, reported
  // as dppx) is decoded before the layer shows; capped at PLATE_TIMEOUT_MS so a plate that never arrives never blocks the layer.
  const PLATE_TIMEOUT_MS=8000;
  // Codex #904 (P1): a plate already decoded (prepare() below) answers at once, so open() after a route change reveals the layer
  // in the same task as that change and no frame shows the screen underneath bare.
  const decodedPlates=new Set();
  function platesReady(node){
    if(!node||typeof root.getComputedStyle!=="function"||typeof root.Image!=="function")return Promise.resolve(true);
    const bg=root.getComputedStyle(node).backgroundImage||"";
    const list=[...bg.matchAll(/url\("?([^")]+)"?\)\s*(?:([\d.]+)(?:x|dppx))?/g)].map(m=>({url:m[1],x:Number(m[2]||0)})).filter(e=>!e.url.startsWith("data:"));
    if(!list.length)return Promise.resolve(true);
    const dpr=root.devicePixelRatio||1,set=list.sort((a,b)=>a.x-b.x);
    const urls=/image-set\(/.test(bg)&&list.length>1?[(set.find(e=>e.x>=dpr)||set[set.length-1]).url]:list.map(e=>e.url);
    if(urls.every(url=>decodedPlates.has(url)))return Promise.resolve(true);
    // Codex #911: only a plate that really loaded and decoded is remembered; a failed one is tried again on the next open().
    const decode=url=>{const img=new root.Image();img.src=url;return (typeof img.decode==="function"?img.decode().then(()=>true,()=>false):new Promise(resolve=>{img.onload=()=>resolve(true);img.onerror=()=>resolve(false);})).then(ok=>{if(ok)decodedPlates.add(url);return ok;});};
    return Promise.race([Promise.all(urls.map(decode)).then(()=>true),new Promise(resolve=>root.setTimeout(()=>resolve(false),PLATE_TIMEOUT_MS))]);
  }
  // Codex #904 (P1): everything open() waits for (the pair module, the layer, its stylesheet and decoded plate), without showing
  // anything or reading Firestore. START runs it before it routes to the locked league wheel, so WAITING covers the wheel at once.
  async function prepareConnectPlayers(){
    await loadPair();
    ensureLayer();
    if(typeof root.loadRuntimeStyle!=="function")throw new Error("Connect Players styles are unavailable.");
    await root.loadRuntimeStyle("connect-players-v10","css/connectPlayersV10.css");
    if(layer.classList.contains("hidden"))await platesReady(layer);
    return true;
  }
  async function open(options={}){
    if(opening)return opening;
    opening=(async()=>{
      const pair=await loadPair();
      ensureLayer();
      if(typeof root.loadRuntimeStyle!=="function")throw new Error("Connect Players styles are unavailable.");
      await root.loadRuntimeStyle("connect-players-v10","css/connectPlayersV10.css");
      if(layer.classList.contains("hidden"))await platesReady(layer);
      opener=root.document.activeElement;
      // r79: stayOnScreen keeps the screen underneath (WAITING over Daniel's locked league wheel) instead of going back Home.
      layer.dataset.stayOnScreen=options.stayOnScreen===true?"true":"false";
      if(options.stayOnScreen!==true){
        const home=typeof root.navigateTo==="function"
          ? await root.navigateTo("mainMenu",{addToHistory:false,allowCanonicalFallback:false})
          : root.showScreen?.("mainMenu",false);
        if(home===false)throw new Error("Home could not be opened safely.");
      }
      pair?.render?.();updatePresentation();
      layer.classList.remove("hidden");layer.setAttribute("aria-hidden","false");setBackgroundInert(true);
      const focus=layer.querySelector("#persistentNikDanielPairCode,#persistentNikDanielPairPanel button")||byId("connectPlayersSetup");
      focus?.focus?.();
      if(options.sync!==false){await root.CareerModeOnlinePlayerIdentity?.syncPair?.();pair?.render?.();updatePresentation();}
      return layer;
    })().finally(()=>{opening=null;});
    return opening;
  }
  return Object.freeze({open,close,prepare:prepareConnectPlayers});
});

```


## FILE: firestore.persistent-pair-production.fragment.rules
```text
// r41 production redeploy: authority unchanged; adversarial role-switch fixture corrected.
// CMS_PERSISTENT_PAIR_FUNCTIONS_BEGIN
    function cmsPersistentPairManagerValid(role, managerId) {
      return (role == 'playerOne' && managerId == 'daniel')
        || (role == 'playerTwo' && managerId == 'nik');
    }

    function cmsPersistentPairRivalryMembership(accountId, rivalryId, role) {
      let rivalry = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId));
      let data = rivalry.data.data;
      return rivalryId is string
        && rivalryId.matches('^pair_[0-9a-f]{64}$')
        && rivalry.data.objectType == 'rivalry'
        && rivalry.data.objectId == rivalryId
        && rivalry.data.lifecycleState == 'live'
        && (data.connectionState == 'pending-pair' || data.connectionState == 'active')
        && data.managerSlots is list
        && data.managerSlots.size() == 2
        && (
          (
            data.managerSlots[0].slotId == role
            && data.managerSlots[0].accountId == accountId
            && data.managerSlots[0].entitlementState == 'active'
          )
          ||
          (
            data.managerSlots[1].slotId == role
            && data.managerSlots[1].accountId == accountId
            && data.managerSlots[1].entitlementState == 'active'
          )
        );
    }

    function cmsPersistentPairCreationWitnessValid(rivalryId) {
      let pair = getAfter(/databases/$(database)/documents/accounts/$(request.auth.uid)/pairLinks/current);
      let pairData = pair.data.data;
      return pair.data.objectType == 'pairLink'
        && pair.data.objectId == 'current'
        && pair.data.lifecycleState == 'live'
        && pair.data.updatedByAccountId == request.auth.uid
        && pairData.rivalryId == rivalryId
        && cmsPersistentPairManagerValid(pairData.managerRole, pairData.managerId);
    }

    function cmsPersistentPairRedemptionWitnessValid(rivalryId, role) {
      let pairData = getAfter(/databases/$(database)/documents/accounts/$(request.auth.uid)/pairLinks/current).data.data;
      return pairData.rivalryId == rivalryId
        && pairData.managerRole == role
        && cmsPersistentPairManagerValid(role, pairData.managerId);
    }

    function cmsPersistentPairDataValid(accountId, pairData) {
      return pairData.keys().hasOnly([
          'rivalryId',
          'managerRole',
          'managerId',
          'linkedAt',
          'lastConfirmedAt'
        ])
        && pairData.rivalryId is string
        && pairData.rivalryId.matches('^pair_[0-9a-f]{64}$')
        && cmsPersistentPairManagerValid(pairData.managerRole, pairData.managerId)
        && pairData.linkedAt is timestamp
        && pairData.lastConfirmedAt is timestamp
        && pairData.lastConfirmedAt >= pairData.linkedAt
        && cmsPersistentPairRivalryMembership(accountId, pairData.rivalryId, pairData.managerRole);
    }

    function cmsPersistentPairCanReplace(before, after) {
      let priorRivalry = get(/databases/$(database)/documents/rivalries/$(before.data.rivalryId));
      let priorInvite = get(/databases/$(database)/documents/rivalries/$(before.data.rivalryId)/invites/$(before.data.rivalryId));
      let sameManager = after.data.managerRole == before.data.managerRole
        && after.data.managerId == before.data.managerId;
      return (
          after.data.rivalryId == before.data.rivalryId
          && sameManager
        )
        || (
          priorRivalry.data.objectType == 'rivalry'
          && priorRivalry.data.data.connectionState == 'closed'
        )
        || (
          sameManager
          && priorRivalry.data.objectType == 'rivalry'
          && priorRivalry.data.data.connectionState == 'pending-pair'
          && priorInvite.data.objectType == 'invite'
          && (
            priorInvite.data.data.state != 'open'
            || priorInvite.data.data.expiresAt <= request.time
          )
        );
    }

    function cmsPersistentPairAbandonActorValid(before, rivalryId) {
      let pair = get(/databases/$(database)/documents/accounts/$(request.auth.uid)/pairLinks/current);
      let pairData = pair.data.data;
      let slots = before.data.managerSlots;
      return pair.data.objectType == 'pairLink'
        && pair.data.objectId == 'current'
        && pair.data.lifecycleState == 'live'
        && pairData.rivalryId == rivalryId
        && cmsPersistentPairManagerValid(pairData.managerRole, pairData.managerId)
        && slots is list
        && slots.size() == 2
        && (
          (
            slots[0].slotId == pairData.managerRole
            && slots[0].accountId == request.auth.uid
            && slots[0].entitlementState == 'active'
          )
          ||
          (
            slots[1].slotId == pairData.managerRole
            && slots[1].accountId == request.auth.uid
            && slots[1].entitlementState == 'active'
          )
        );
    }

    function cmsPersistentPairAbandonValid(rivalryId) {
      let before = resource.data;
      let after = request.resource.data;
      return signedIn()
        && rivalryId is string
        && rivalryId.matches('^pair_[0-9a-f]{64}$')
        && before.objectType == 'rivalry'
        && before.objectId == rivalryId
        && before.lifecycleState == 'live'
        && activeDevice(after.updatedByDeviceId)
        && validCasEnvelope(before, after, 'rivalry', rivalryId)
        && after.updatedByAccountId == request.auth.uid
        && cmsPersistentPairAbandonActorValid(before, rivalryId)
        && before.data.authorizedAccountIds is list
        && request.auth.uid in before.data.authorizedAccountIds
        && (before.data.connectionState == 'pending-pair' || before.data.connectionState == 'active')
        && after.data.connectionState == 'closed'
        && after.data.diff(before.data).affectedKeys().hasOnly(['connectionState', 'endedEarly'])
        && (!('endedEarly' in after.data) || cmsPersistentPairEndedEarlyValid(after.data.endedEarly));
    }

    // r80 END SHOWDOWN: the abandon write may carry the ended-early mark. seasonsPlayed is the
    // number of finished seasons (0..10), or null when the count could not be read.
    function cmsPersistentPairEndedEarlyValid(mark) {
      return mark is map
        && mark.keys().hasOnly(['seasonsPlayed'])
        && mark.keys().hasAll(['seasonsPlayed'])
        && (
          mark.seasonsPlayed == null
          || (mark.seasonsPlayed is int && mark.seasonsPlayed >= 0 && mark.seasonsPlayed <= 10)
        );
    }

    function cmsPersistentPairCreateValid(accountId, pairId) {
      let root = request.resource.data;
      return activeDevice(root.updatedByDeviceId)
        && request.auth.uid == accountId
        && pairId == 'current'
        && validCreateEnvelope(root, 'pairLink', pairId)
        && root.updatedByAccountId == accountId
        && cmsPersistentPairDataValid(accountId, root.data)
        && (!cmsCareerIndexEnforced() || cmsCareerIndexPairLinkCoupled(accountId, root.data.rivalryId));
    }

    function cmsPersistentPairUpdateValid(accountId, pairId) {
      let before = resource.data;
      let after = request.resource.data;
      return activeDevice(after.updatedByDeviceId)
        && request.auth.uid == accountId
        && pairId == 'current'
        && validCasEnvelope(before, after, 'pairLink', pairId)
        && after.updatedByAccountId == accountId
        && cmsPersistentPairDataValid(accountId, after.data)
        && after.data.linkedAt == before.data.linkedAt
        && cmsPersistentPairCanReplace(before, after)
        && (!cmsCareerIndexEnforced() || cmsCareerIndexPairLinkCoupled(accountId, after.data.rivalryId));
    }
    // CMS_CAREER_INDEX (D1, JOB-07): own-account, append-only, forward-only career index.
    function cmsCareerIndexPageCapacity() {
      return 500;
    }

    // Phase A admits legacy clients. Enable only after both managers receive the new shell.
    function cmsCareerIndexEnforced() {
      return false;
    }

    function cmsCareerIndexRecordsNewRivalry(accountId, rivalryId) {
      let ids = getAfter(/databases/$(database)/documents/accounts/$(accountId)/careerIndex/current).data.data.rivalryIds;
      return ids is list
        && ids.size() >= 1
        && ids[ids.size() - 1] == rivalryId;
    }

    // Pair-link coupling (first creation AND replacement): when this commit makes the account a member of
    // the linked rivalry (creation by Daniel, redemption by Nik), the same commit must end the account's
    // career index with that rivalry. A link to a rivalry the account already belonged to before this
    // commit (reconfirm, Continue, recovery of a pre-deployment link) needs no index write and can never
    // add one.
    function cmsCareerIndexPairLinkCoupled(accountId, rivalryId) {
      let rivalryPath = /databases/$(database)/documents/rivalries/$(rivalryId);
      return (exists(rivalryPath) && accountId in get(rivalryPath).data.data.authorizedAccountIds)
        || cmsCareerIndexRecordsNewRivalry(accountId, rivalryId);
    }

    function cmsCareerIndexHeadDataValid(data) {
      return data.keys().hasOnly(['rivalryIds', 'sealedPageCount'])
        && data.keys().hasAll(['rivalryIds', 'sealedPageCount'])
        && data.rivalryIds is list
        && data.rivalryIds.size() >= 1
        && data.rivalryIds.size() <= cmsCareerIndexPageCapacity()
        && data.sealedPageCount is int
        && data.sealedPageCount >= 0;
    }

    function cmsCareerIndexCreationEligible(accountId, rivalryId) {
      let after = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data;
      return !exists(/databases/$(database)/documents/rivalries/$(rivalryId))
        && after.connectionState == 'pending-pair'
        && after.createdByAccountId == accountId
        && after.authorizedAccountIds == [accountId];
    }

    function cmsCareerIndexRedemptionEligible(accountId, rivalryId) {
      let before = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data;
      let after = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data;
      return before.connectionState == 'pending-pair'
        && after.connectionState == 'active'
        && before.authorizedAccountIds.size() == 1
        && !(accountId in before.authorizedAccountIds)
        && after.authorizedAccountIds == [before.createdByAccountId, accountId]
        && rivalryId in get(/databases/$(database)/documents/accounts/$(before.createdByAccountId)/careerIndex/current).data.data.rivalryIds;
    }

    function cmsCareerIndexAppendEligible(accountId, rivalryId) {
      let pair = getAfter(/databases/$(database)/documents/accounts/$(accountId)/pairLinks/current);
      return rivalryId is string
        && rivalryId.matches('^pair_[0-9a-f]{64}$')
        && pair != null
        && pair.data is map
        && pair.data.data is map
        && pair.data.data.rivalryId == rivalryId
        && cmsPersistentPairManagerValid(pair.data.data.managerRole, pair.data.data.managerId)
        && cmsPersistentPairRivalryMembership(accountId, rivalryId, pair.data.data.managerRole)
        && (
          cmsCareerIndexCreationEligible(accountId, rivalryId)
          || (
            exists(/databases/$(database)/documents/rivalries/$(rivalryId))
            && cmsCareerIndexRedemptionEligible(accountId, rivalryId)
          )
        );
    }

    function cmsCareerIndexPageSealedFrom(accountId, pageNumber, ids) {
      let page = getAfter(/databases/$(database)/documents/accounts/$(accountId)/careerIndex/$('page_' + string(pageNumber))).data;
      return page.objectType == 'careerIndexPage'
        && page.data.pageNumber == pageNumber
        && page.data.rivalryIds == ids;
    }

    function cmsCareerIndexHeadCreateValid(accountId) {
      let root = request.resource.data;
      return signedIn()
        && request.auth.uid == accountId
        && activeDevice(root.updatedByDeviceId)
        && validCreateEnvelope(root, 'careerIndex', 'current')
        && root.updatedByAccountId == accountId
        && cmsCareerIndexHeadDataValid(root.data)
        && root.data.sealedPageCount == 0
        && root.data.rivalryIds.size() == 1
        && cmsCareerIndexAppendEligible(accountId, root.data.rivalryIds[0]);
    }

    function cmsCareerIndexHeadUpdateValid(accountId) {
      let before = resource.data;
      let after = request.resource.data;
      let prior = before.data.rivalryIds;
      let next = after.data.rivalryIds;
      return signedIn()
        && request.auth.uid == accountId
        && activeDevice(after.updatedByDeviceId)
        && validCasEnvelope(before, after, 'careerIndex', 'current')
        && after.updatedByAccountId == accountId
        && cmsCareerIndexHeadDataValid(after.data)
        && (
          (
            prior.size() < cmsCareerIndexPageCapacity()
            && after.data.sealedPageCount == before.data.sealedPageCount
            && next.size() == prior.size() + 1
            && next[0:prior.size()] == prior
            && !(next[prior.size()] in prior)
            && cmsCareerIndexAppendEligible(accountId, next[prior.size()])
          )
          ||
          (
            prior.size() == cmsCareerIndexPageCapacity()
            && after.data.sealedPageCount == before.data.sealedPageCount + 1
            && next.size() == 1
            && !(next[0] in prior)
            && cmsCareerIndexPageSealedFrom(accountId, after.data.sealedPageCount, prior)
            && cmsCareerIndexAppendEligible(accountId, next[0])
          )
        );
    }

    function cmsCareerIndexPageCreateValid(accountId, pageId) {
      let root = request.resource.data;
      let headBefore = get(/databases/$(database)/documents/accounts/$(accountId)/careerIndex/current).data;
      let headAfter = getAfter(/databases/$(database)/documents/accounts/$(accountId)/careerIndex/current).data;
      return signedIn()
        && request.auth.uid == accountId
        && activeDevice(root.updatedByDeviceId)
        && validCreateEnvelope(root, 'careerIndexPage', pageId)
        && root.updatedByAccountId == accountId
        && root.data.keys().hasOnly(['pageNumber', 'rivalryIds'])
        && root.data.keys().hasAll(['pageNumber', 'rivalryIds'])
        && root.data.pageNumber is int
        && root.data.pageNumber == headBefore.data.sealedPageCount + 1
        && pageId == 'page_' + string(root.data.pageNumber)
        && headBefore.data.rivalryIds.size() == cmsCareerIndexPageCapacity()
        && root.data.rivalryIds == headBefore.data.rivalryIds
        && headAfter.revision == headBefore.revision + 1
        && headAfter.data.sealedPageCount == root.data.pageNumber;
    }

    // CMS_CAREER_START (owner decision): own-account "real career starts here" marker. Created once, active,
    // naming exactly the account's career index head ids (none when no index exists; never over sealed pages).
    // startedAt is the server time of the press. Afterwards only `active` may change, by CAS (so startedAt and the
    // list stay as written). Get, create and update only; no list, no delete.
    function cmsCareerStartDataValid(data) {
      return data.keys().hasOnly(['hiddenRivalryIds', 'active', 'startedAt'])
        && data.keys().hasAll(['hiddenRivalryIds', 'active', 'startedAt'])
        && data.hiddenRivalryIds is list
        && data.hiddenRivalryIds.size() <= cmsCareerIndexPageCapacity()
        && data.active is bool
        && data.startedAt is timestamp;
    }

    function cmsCareerStartMatchesIndex(accountId, ids) {
      let indexPath = /databases/$(database)/documents/accounts/$(accountId)/careerIndex/current;
      return (!exists(indexPath) && ids.size() == 0)
        || (exists(indexPath)
          && get(indexPath).data.data.sealedPageCount == 0
          && ids == get(indexPath).data.data.rivalryIds);
    }

    function cmsCareerStartCreateValid(accountId, startId) {
      let root = request.resource.data;
      return signedIn()
        && request.auth.uid == accountId
        && startId == 'current'
        && activeDevice(root.updatedByDeviceId)
        && validCreateEnvelope(root, 'careerStart', 'current')
        && root.updatedByAccountId == accountId
        && cmsCareerStartDataValid(root.data)
        && root.data.active == true
        && root.data.startedAt == request.time
        && cmsCareerStartMatchesIndex(accountId, root.data.hiddenRivalryIds);
    }

    function cmsCareerStartUpdateValid(accountId, startId) {
      let before = resource.data;
      let after = request.resource.data;
      return signedIn()
        && request.auth.uid == accountId
        && startId == 'current'
        && activeDevice(after.updatedByDeviceId)
        && validCasEnvelope(before, after, 'careerStart', 'current')
        && after.updatedByAccountId == accountId
        && cmsCareerStartDataValid(after.data)
        && after.data.diff(before.data).affectedKeys().hasOnly(['active']);
    }

    // CMS_PERMANENT_PARTNER (r79, owner decision 2026-10-17): each real account keeps one partner record naming the
    // account it paired with through a real (marker-holding) pairing. Written only by its owner, only while the named
    // rivalry has the owner and the partner in their slots. UNPAIR sets active false; re-pair needs active false.
    function cmsPartnerDataValid(data) {
      return data.keys().hasOnly(['schemaVersion', 'partnerAccountId', 'myRole', 'pairedViaRivalryId', 'pairedAt', 'active', 'updatedAt'])
        && data.keys().hasAll(['schemaVersion', 'partnerAccountId', 'myRole', 'pairedViaRivalryId', 'pairedAt', 'active', 'updatedAt'])
        && data.schemaVersion == 1
        && data.partnerAccountId is string
        && data.partnerAccountId != request.auth.uid
        && data.myRole in ['playerOne', 'playerTwo']
        && data.pairedViaRivalryId is string
        && data.pairedViaRivalryId.matches('^pair_[0-9a-f]{64}$')
        && data.pairedAt is timestamp
        && data.active is bool
        && data.updatedAt == request.time;
    }

    function cmsPartnerSlotsMatch(slots, myRole, partnerAccountId) {
      return slots is list
        && slots.size() == 2
        && slots[0].slotId == 'playerOne'
        && slots[1].slotId == 'playerTwo'
        && slots[0].entitlementState == 'active'
        && slots[1].entitlementState == 'active'
        && (
          (myRole == 'playerOne' && slots[0].accountId == request.auth.uid && slots[1].accountId == partnerAccountId)
          || (myRole == 'playerTwo' && slots[1].accountId == request.auth.uid && slots[0].accountId == partnerAccountId)
        );
    }

    // The pairing rivalry must belong to the real career: never one the account's career-start marker hid
    // (pre-career test games), and created after the marker (playerOne made it after pressing START REAL
    // CAREER; playerTwo writes its marker just before redeeming, so the rivalry is at most one invite
    // window, 30 min, older than that marker). rivalry.createdAt is the creating device's clock, so both
    // windows allow 5 min of clock skew. The marker's `active` flag only chooses whether test Showdowns are shown,
    // so it never affects pairing.
    function cmsPartnerPairingValid(accountId, data) {
      let rivalry = get(/databases/$(database)/documents/rivalries/$(data.pairedViaRivalryId)).data;
      let start = get(/databases/$(database)/documents/accounts/$(accountId)/careerStart/current).data.data;
      return cmsPartnerDataValid(data)
        && data.active == true
        && data.pairedAt == request.time
        && rivalry.objectType == 'rivalry'
        && rivalry.objectId == data.pairedViaRivalryId
        && rivalry.lifecycleState == 'live'
        && rivalry.data.connectionState in ['active', 'closed']
        && rivalry.data.authorizedAccountIds is list
        && rivalry.data.authorizedAccountIds.size() == 2
        && cmsPartnerSlotsMatch(rivalry.data.managerSlots, data.myRole, data.partnerAccountId)
        && !(data.pairedViaRivalryId in start.hiddenRivalryIds)
        && (
          (data.myRole == 'playerOne' && rivalry.data.createdAt >= start.startedAt - duration.value(5, 'm'))
          || (data.myRole == 'playerTwo' && rivalry.data.createdAt >= start.startedAt - duration.value(35, 'm'))
        );
    }

    function cmsPartnerCreateValid(accountId, partnerId) {
      return signedIn()
        && request.auth.uid == accountId
        && partnerId == 'current'
        && activeActor()
        && cmsPartnerPairingValid(accountId, request.resource.data);
    }

    function cmsPartnerUpdateValid(accountId, partnerId) {
      let before = resource.data;
      let after = request.resource.data;
      return signedIn()
        && request.auth.uid == accountId
        && partnerId == 'current'
        && activeActor()
        && (
          (
            before.active == true
            && cmsPartnerDataValid(after)
            && after.active == false
            && after.diff(before).affectedKeys().hasOnly(['active', 'updatedAt'])
          )
          || (
            before.active == false
            && cmsPartnerPairingValid(accountId, after)
          )
        );
    }

    // CMS_PARTNER_INBOX (r79): the private JOIN note. Daniel's START writes it into Nik's account; only Nik reads it.
    // Both partner records must be active and point at each other, the writer must be playerOne, and the note must
    // name the writer's own open pending rivalry with the invite's exact expiry and the season count in the id.
    // One doc, overwritten on each START, never listed or deleted; an expired note is useless because redeem checks
    // the invite's expiry. Re-writing the same rivalry is allowed only after 60 s (a safe client retry), so a retry loop
    // cannot burn the Spark quota.
    function cmsPartnerInboxSeasonsMatch(rivalryId, totalSeasons) {
      return (totalSeasons == 1 && rivalryId.matches('^pair_1[0-9a-f]{63}$'))
        || (totalSeasons == 3 && rivalryId.matches('^pair_3[0-9a-f]{63}$'))
        || (totalSeasons == 5 && rivalryId.matches('^pair_5[0-9a-f]{63}$'))
        || (totalSeasons == 10 && rivalryId.matches('^pair_a[0-9a-f]{63}$'));
    }

    function cmsPartnerInboxWriteValid(accountId, noteId) {
      let note = request.resource.data;
      let mine = get(/databases/$(database)/documents/accounts/$(request.auth.uid)/partner/current).data;
      let theirs = get(/databases/$(database)/documents/accounts/$(accountId)/partner/current).data;
      let rivalry = get(/databases/$(database)/documents/rivalries/$(note.rivalryId)).data;
      let invite = get(/databases/$(database)/documents/rivalries/$(note.rivalryId)/invites/$(note.rivalryId)).data;
      return signedIn()
        && noteId == 'current'
        && accountId != request.auth.uid
        && activeActor()
        && note.keys().hasOnly(['schemaVersion', 'rivalryId', 'totalSeasons', 'fromAccountId', 'createdAt', 'expiresAt'])
        && note.keys().hasAll(['schemaVersion', 'rivalryId', 'totalSeasons', 'fromAccountId', 'createdAt', 'expiresAt'])
        && note.schemaVersion == 1
        && note.fromAccountId == request.auth.uid
        && note.createdAt == request.time
        && note.rivalryId is string
        && note.rivalryId.matches('^pair_[0-9a-f]{64}$')
        && cmsPartnerInboxSeasonsMatch(note.rivalryId, note.totalSeasons)
        && mine.active == true
        && mine.myRole == 'playerOne'
        && mine.partnerAccountId == accountId
        && theirs.active == true
        && theirs.myRole == 'playerTwo'
        && theirs.partnerAccountId == request.auth.uid
        && rivalry.objectType == 'rivalry'
        && rivalry.lifecycleState == 'live'
        && rivalry.data.connectionState == 'pending-pair'
        && rivalry.data.createdByAccountId == request.auth.uid
        && invite.objectType == 'invite'
        && invite.data.purpose == 'rivalry-pairing'
        && invite.data.slotId == 'playerTwo'
        && invite.data.state == 'open'
        && invite.data.createdByAccountId == request.auth.uid
        && invite.data.expiresAt == note.expiresAt
        && note.expiresAt > request.time
        && (
          resource == null
          || resource.data.rivalryId != note.rivalryId
          || request.time > resource.data.createdAt + duration.value(60, 's')
        );
    }
    // r86 reads at scale (Nik 2026-10-27): one create-only career summary per finished Showdown under the reading
    // account. Reads are owner-only exact gets (no lookup); the one create checks the closed root and, for a completed
    // Showdown, that the summary's totals, winner and length equal the Terminal Close witness. Never updated or deleted.
    function cmsCareerSummaryCreateValid(accountId, rivalryId) {
      let s = request.resource.data;
      let root = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data;
      return signedIn()
        && request.auth.uid == accountId
        && activeAccount(request.auth.uid)
        && rivalryId.matches('^pair_[0-9a-f]{64}$')
        && s.keys().hasOnly(['schemaVersion', 'objectType', 'rivalryId', 'status', 'totalSeasons', 'managerTotals', 'winner', 'payload', 'payloadHash'])
        && s.keys().hasAll(['schemaVersion', 'objectType', 'rivalryId', 'status', 'totalSeasons', 'managerTotals', 'winner', 'payload', 'payloadHash'])
        && s.schemaVersion == 1
        && s.objectType == 'careerSummary'
        && s.rivalryId == rivalryId
        && s.payload is string
        && s.payload.size() > 0
        && s.payload.size() <= 262144
        && s.payloadHash is string
        && s.payloadHash.matches('^sha256:[0-9a-f]{64}$')
        && root.connectionState == 'closed'
        && accountId in root.authorizedAccountIds
        && ((s.status == 'completed'
              && 'terminalClose' in root
              && root.terminalClose.rivalryId == rivalryId
              && s.totalSeasons == root.terminalClose.totalSeasons
              && s.managerTotals == root.terminalClose.managerTotals
              && s.winner == root.terminalClose.winner)
          || ((s.status == 'abandoned' || s.status == 'never-started')
              && !('terminalClose' in root)
              && s.totalSeasons == null
              && s.managerTotals == null
              && s.winner == null));
    }

    // CMS_COMPLETED_READ (D2, JOB-08): read-only grant for a Showdown closed by a verified
    // Terminal Close. Get only; no write, list or delete rule refers to these functions.
    function cmsCompletedShowdownReadable(rivalryId) {
      let root = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data;
      let data = root.data;
      let slots = data.managerSlots;
      let progress = data.terminalProgress;
      return signedIn()
        && rivalryId.matches('^pair_[0-9a-f]{64}$')
        && root.objectType == 'rivalry'
        && root.objectId == rivalryId
        && root.lifecycleState == 'live'
        && data.connectionState == 'closed'
        && data.authorizedAccountIds is list
        && data.authorizedAccountIds.size() == 2
        && data.authorizedAccountIds[0] != data.authorizedAccountIds[1]
        && request.auth.uid in data.authorizedAccountIds
        && slots is list
        && slots.size() == 2
        && slots[0].slotId == 'playerOne'
        && slots[1].slotId == 'playerTwo'
        && (slots[0].accountId == request.auth.uid || slots[1].accountId == request.auth.uid)
        && activeAccount(request.auth.uid)
        && 'terminalClose' in data
        && ssjrTerminalValidIntent(rivalryId, data.terminalClose)
        && ssjrTerminalProgressShape(progress)
        && progress.acceptedThroughSeason == progress.totalSeasons
        && progress.closedSessionRevision is int
        && data.terminalClose.totalSeasons == progress.totalSeasons
        && data.terminalClose.managerTotals == progress.managerTotals;
    }

    function cmsCompletedSeasonReadable(rivalryId, seasonId) {
      let total = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data.terminalProgress.totalSeasons;
      return cmsCompletedShowdownReadable(rivalryId)
        && seasonId in ['season_1','season_2','season_3','season_4','season_5','season_6','season_7','season_8','season_9','season_10'][0:total];
    }

    // CMS_COMPLETED_TRANSFER_READ (JOB-10): a transfer role of a Terminal-Closed Showdown, for season_1..season_N,
    // only when that season's challenge is publicly COMPLETED (both guesses and both signings locked).
    // Keeps the existing role/phase condition of ssjrTransferPrivateReadable. Get only.
    function cmsCompletedTransferRoleReadable(rivalryId, transferId) {
      let challenge = get(/databases/$(database)/documents/rivalries/$(rivalryId)/transferChallenges/$(transferId)).data;
      return cmsCompletedSeasonReadable(rivalryId, transferId)
        && challenge.schemaVersion == 1
        && challenge.objectType == 'sharedTransferChallenge'
        && challenge.rivalryId == rivalryId
        && ssjrTransferSeasonMatches(transferId, challenge.seasonNumber)
        && challenge.phase == 'COMPLETED'
        && challenge.guessLockedRoles is list
        && challenge.guessLockedRoles.size() == 2
        && 'playerOne' in challenge.guessLockedRoles
        && 'playerTwo' in challenge.guessLockedRoles
        && challenge.signingLockedRoles is list
        && challenge.signingLockedRoles.size() == 2
        && 'playerOne' in challenge.signingLockedRoles
        && 'playerTwo' in challenge.signingLockedRoles;
    }

// CMS_PERSISTENT_PAIR_FUNCTIONS_END

// CMS_PERSISTENT_PAIR_MATCH_BEGIN
    match /accounts/{accountId}/pairLinks/{pairId} {
      allow get: if signedIn() && request.auth.uid == accountId && pairId == 'current';
      allow create: if cmsPersistentPairCreateValid(accountId, pairId);
      allow update: if cmsPersistentPairUpdateValid(accountId, pairId);
      allow list, delete: if false;
    }

    match /accounts/{accountId}/careerIndex/{indexId} {
      allow get: if signedIn()
        && request.auth.uid == accountId
        && (indexId == 'current' || indexId.matches('^page_[1-9][0-9]*$'));
      allow create: if (indexId == 'current' && cmsCareerIndexHeadCreateValid(accountId))
        || (indexId.matches('^page_[1-9][0-9]*$') && cmsCareerIndexPageCreateValid(accountId, indexId));
      allow update: if indexId == 'current' && cmsCareerIndexHeadUpdateValid(accountId);
      allow list, delete: if false;
    }

    match /accounts/{accountId}/careerStart/{startId} {
      allow get: if signedIn()
        && request.auth.uid == accountId
        && startId == 'current'
        && activeActor();
      allow create: if cmsCareerStartCreateValid(accountId, startId);
      allow update: if cmsCareerStartUpdateValid(accountId, startId);
      allow list, delete: if false;
    }
    match /accounts/{accountId}/partner/{partnerId} {
      allow get: if signedIn()
        && partnerId == 'current'
        && (request.auth.uid == accountId || resource.data.partnerAccountId == request.auth.uid);
      allow create: if cmsPartnerCreateValid(accountId, partnerId);
      allow update: if cmsPartnerUpdateValid(accountId, partnerId);
      allow list, delete: if false;
    }

    match /accounts/{accountId}/partnerInbox/{noteId} {
      allow get: if signedIn() && request.auth.uid == accountId && noteId == 'current';
      allow create, update: if cmsPartnerInboxWriteValid(accountId, noteId);
      allow list, delete: if false;
    }
    match /accounts/{accountId}/careerSummary/{rivalryId} {
      // A disabled or tombstoned account loses its summaries with the rest of the shared history (same boundary as
      // cmsCompletedShowdownReadable).
      allow get: if signedIn() && request.auth.uid == accountId && activeAccount(request.auth.uid);
      allow create: if cmsCareerSummaryCreateValid(accountId, rivalryId);
      allow update, list, delete: if false;
    }
// CMS_PERSISTENT_PAIR_MATCH_END
```


## FILE: js/sparkRemoteJoining.js
```javascript
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkRemoteJoining=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const SRJ_PANEL_ID="sparkRemoteJoiningOverlay";
  const SRJ_DEPENDENCIES=Object.freeze([
    ["production-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime],
    ["connected-account","js/sparkConnectedAccount.js",()=>root.CareerModeSparkConnectedAccount],
    ["private-pairing","js/sparkPrivatePairing.js",()=>root.CareerModeSparkPrivatePairing],
    ["connected-rivalry","js/sparkConnectedRivalry.js",()=>root.CareerModeSparkConnectedRivalry],
    ["private-session","js/sparkPrivateSession.js",()=>root.CareerModeSparkPrivateSession],
    ["standard-auth-session","js/sparkStandardAuthPrivateSession.js",()=>root.CareerModeSparkStandardAuthPrivateSession]
  ]);
  const SRJ_CANONICAL_KEYS=Object.freeze(["careerModeShowdown.saveLibrary","careerModeShowdown.legacyShowdowns","careerModeShowdown.preferences"]);
  const SRJ_AMBIGUOUS_CODES=new Set(["unavailable","deadline-exceeded","aborted","internal","unknown","network-request-failed"]);
  // Job 31: the Rules cap a session at request.time + 4h with no clock slack, so a host whose clock ran even a second fast was
  // refused. Hosting asks for 4h minus one minute (the same one-minute slack the Rules give createdAt).
  const SRJ_HOST_TTL_MS=4*60*60*1000-60*1000;
  // Job 31: the host page stayed OPEN after the other manager joined until someone tapped REFRESH / READ, so a mid-game
  // reconnect looked stuck on the host. While this page holds its own OPEN hosted session it reads it quietly every few
  // seconds (for at most ten minutes, never while hidden) and picks up the join by itself.
  const SRJ_JOIN_WATCH_MS=4000,SRJ_JOIN_WATCH_LIMIT_MS=10*60*1000;
  // Hunt 1018 (H1018-2): the watcher belongs to one sessionId, so hosting a replacement cancels the old session's timer.
  let srjJoinWatchTimer=null,srjJoinWatchSessionId=null;
  const srjEndedRivalryIds=new Set();
  // Hunt 1018 (H1018-1): one replacement (end the held session, then host or join) runs at a time; it is taken before any await.
  let srjReplaceAction=null;
  const srjScriptPromises=new Map();
  const srjListeners=new Set();
  let srjState=srjFreeze({status:"idle",open:false,busy:false,sessionId:null,rivalryId:null,accountId:null,deviceId:null,role:null,sessionState:null,revision:null,expiresAtEpochMs:null,pendingAction:null,capabilityCopyAllowed:false,auto:null,waitRetry:false,message:"Remote Joining is private and action-only. No session request has been sent."});

  function srjFreeze(value){
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);
    Object.values(value).forEach(srjFreeze);
    return value;
  }
  function srjError(code,message){const error=new Error(message||code);error.code=code;return error;}
  function srjErrorCode(error){return String(error&&error.code||"").split("/").pop().trim().toLowerCase();}
  function srjIsAmbiguousFailure(error){return SRJ_AMBIGUOUS_CODES.has(srjErrorCode(error));}
  function srjSetState(next){
    srjState=srjFreeze({...srjState,...next});
    for(const listener of srjListeners){try{listener(srjState);}catch(_error){}}
    srjRenderPanel();
    return srjState;
  }
  function srjRevision(){
    if(!root.document)return "1.9.0-r3";
    const meta=root.document.querySelector('meta[name="app-asset-revision"]');
    return meta&&meta.content?meta.content.trim()||"1.9.0-r3":"1.9.0-r3";
  }
  function srjVersionedUrl(path){
    if(!root.document||!root.location)return path;
    const url=new URL(path,root.document.baseURI||root.location.href);
    url.searchParams.set("v",srjRevision());
    return url.href;
  }
  function srjLoadScript(key,path,ready){
    const current=ready();
    if(current)return Promise.resolve(current);
    if(srjScriptPromises.has(key))return srjScriptPromises.get(key);
    if(!root.document)return Promise.reject(srjError("REMOTE_JOINING_DEPENDENCY_UNAVAILABLE",`Required private runtime is unavailable: ${path}.`));
    const promise=new Promise((resolve,reject)=>{
      const script=root.document.createElement("script");
      script.src=srjVersionedUrl(path);
      script.async=false;
      script.dataset.srjDependency=key;
      script.addEventListener("load",()=>{const api=ready();api?resolve(api):reject(srjError("REMOTE_JOINING_DEPENDENCY_UNAVAILABLE",`${path} did not expose its expected API.`));},{once:true});
      script.addEventListener("error",()=>reject(srjError("REMOTE_JOINING_DEPENDENCY_UNAVAILABLE",`Unable to load ${path}.`)),{once:true});
      root.document.head.appendChild(script);
    }).finally(()=>{srjScriptPromises.delete(key);});
    srjScriptPromises.set(key,promise);
    return promise;
  }
  async function srjEnsureDependencies(){
    const resolved={};
    for(const [key,path,ready] of SRJ_DEPENDENCIES)resolved[key]=await srjLoadScript(key,path,ready);
    return Object.freeze(resolved);
  }
  async function srjResolveContext(){
    const deps=await srjEnsureDependencies();
    const runtime=deps["production-runtime"];
    const account=deps["connected-account"];
    const pairing=deps["private-pairing"];
    const rivalry=deps["connected-rivalry"];
    const protocol=deps["standard-auth-session"];
    if(!runtime||typeof runtime.ensureAccountServices!=="function")throw srjError("REMOTE_JOINING_RUNTIME_UNAVAILABLE","Private Firebase runtime is unavailable.");
    if(!account||typeof account.initialize!=="function"||typeof account.getState!=="function")throw srjError("REMOTE_JOINING_ACCOUNT_UNAVAILABLE","Connected Account is unavailable.");
    await account.initialize();
    const accountState=account.getState();
    if(!accountState||accountState.connected!==true||!accountState.accountId)throw srjError("REMOTE_JOINING_AUTH_REQUIRED","Sign in with Google on Home before starting or joining a private session.");
    if(!pairing||typeof pairing.initialize!=="function"||typeof pairing.getState!=="function")throw srjError("REMOTE_JOINING_DEVICE_UNAVAILABLE","Registered-device authority is unavailable.");
    await pairing.initialize();
    const pairingState=pairing.getState();
    if(!pairingState||pairingState.registered!==true||!pairingState.deviceId)throw srjError("REMOTE_JOINING_DEVICE_REQUIRED","This phone is not set up yet. Go Home, sign in again and choose Daniel or Nik, then try again.");
    if(!rivalry||typeof rivalry.initialize!=="function"||typeof rivalry.getState!=="function")throw srjError("REMOTE_JOINING_RIVALRY_UNAVAILABLE","Connected Rivalry authority is unavailable.");
    await rivalry.initialize();
    const rivalryState=rivalry.getState();
    if(!rivalryState||rivalryState.attached!==true||!rivalryState.rivalryId)throw srjError("REMOTE_JOINING_RIVALRY_REQUIRED","Daniel and Nik are not connected on this phone yet. Go Home and tap CONTINUE CAREER first.");
    const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices());
    if(!services||services.ok!==true||!services.auth||!services.firestore||!services.firestoreSdk)throw srjError("REMOTE_JOINING_PROVIDER_UNAVAILABLE","Private Firebase services are unavailable.");
    const user=services.auth.currentUser;
    if(!user||user.uid!==accountState.accountId)throw srjError("REMOTE_JOINING_AUTH_MISMATCH","The current Google account no longer matches the Connected Account authority.");
    if(rivalryState.accountId&&rivalryState.accountId!==user.uid)throw srjError("REMOTE_JOINING_RIVALRY_ACCOUNT_MISMATCH","The attached Connected Rivalry belongs to a different account.");
    if(rivalryState.deviceId&&rivalryState.deviceId!==pairingState.deviceId)throw srjError("REMOTE_JOINING_DEVICE_MISMATCH","The attached Connected Rivalry belongs to a different registered browser identity.");
    return Object.freeze({protocol,services,user,accountId:user.uid,deviceId:pairingState.deviceId,rivalryId:rivalryState.rivalryId});
  }
  function srjOperationOptions(context,sessionId){
    return {firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,user:context.user,deviceId:context.deviceId,rivalryId:context.rivalryId,sessionId,nowEpochMs:Date.now(),cryptoImpl:root.crypto};
  }
  function srjFailureMessage(result,fallback){
    if(result&&result.code==="resource-exhausted")return "Firebase Spark quota is temporarily exhausted. No upgrade will be attempted; try again later.";
    if(result&&typeof result.message==="string"&&result.message.trim())return result.message.trim();
    return fallback;
  }
  function srjExpiredByClock(){const expiresAt=Number(srjState.expiresAtEpochMs);return Boolean(srjState.sessionId&&Number.isFinite(expiresAt)&&Date.now()>=expiresAt);}
  function srjHasNonterminalSession(){return !!srjState.sessionId&&["open","active"].includes(srjState.sessionState)&&!srjExpiredByClock();}
  function srjSessionBlocksStart(){return srjHasNonterminalSession()||!!srjState.pendingAction||srjState.sessionState==="unresolved";}
  // BH-11 (#1): after a reload the other phone loses its page-memory code while this phone still holds the old session, so
  // HOST and JOIN were dead here. This page may end its OWN confirmed session (close an ACTIVE one, revoke an OPEN one it
  // hosts) and then host or join a fresh one. Unresolved or pending capabilities are never replaced.
  function srjHeldSessionReplaceable(){return srjHasNonterminalSession()&&!srjState.pendingAction&&!srjState.busy&&(srjState.sessionState==="active"||(srjState.sessionState==="open"&&srjState.role==="host"));}
  async function srjEndHeldSession(){
    if(!srjHeldSessionReplaceable())return {ok:false,code:"REMOTE_JOINING_SESSION_ALREADY_HELD",message:"The current private session cannot be replaced right now."};
    let context;
    try{context=await srjResolveContext();}
    catch(error){const message=`${error&&error.message?error.message:"Current private authority could not be resolved."} The current private session was kept.`;srjSetState({status:"error",busy:false,message});return {ok:false,code:error&&error.code||"REMOTE_JOINING_REPLACE_FAILED",message};}
    if(!srjPendingContextMatches(context)){const message="The current private session belongs to a different Google account, browser or Showdown, so it was not replaced.";srjSetState({status:"error",busy:false,message});return {ok:false,code:"REMOTE_JOINING_REPLACE_CONTEXT_CHANGED",message};}
    const result=srjState.sessionState==="active"?await srjCloseSession():await srjRevokeSession();
    if(!result||result.ok!==true)return result||{ok:false,code:"REMOTE_JOINING_REPLACE_FAILED",message:"The current private session could not be ended."};
    return srjSessionBlocksStart()?{ok:false,code:"REMOTE_JOINING_SESSION_ALREADY_HELD",message:"The current private session could not be ended."}:{ok:true};
  }
  function srjAcceptResult(result,context,role,message){
    return srjSetState({status:"ready",busy:false,sessionId:result.sessionId,rivalryId:context.rivalryId,accountId:context.accountId,deviceId:context.deviceId,role,sessionState:result.state,revision:result.revision,expiresAtEpochMs:result.expiresAtEpochMs,pendingAction:null,capabilityCopyAllowed:true,auto:result.state==="open"?srjState.auto:null,message});
  }
  function srjPendingContextMatches(context){
    return !!context&&context.rivalryId===srjState.rivalryId&&context.accountId===srjState.accountId&&context.deviceId===srjState.deviceId;
  }
  function srjPendingFailure(error,action){
    const message=error&&error.message?error.message:"The provider acknowledgement was not received.";
    srjSetState({status:"recovery-pending",busy:false,pendingAction:action,capabilityCopyAllowed:false,message:`${message} The outcome is unresolved. The exact same page-memory capability is retained for deterministic retry; no new session will be generated and your Showdown was not changed.`});
    return {ok:false,code:error&&error.code||"REMOTE_JOINING_RECOVERY_PENDING",message,recoverable:true,pendingAction:action};
  }
  // BH-11 (#10): a host or join write is refused when the phone clock is minutes off server time (the Rules check createdAt and
  // lastActivityAt against request.time), which used to surface as a raw permission error.
  const SRJ_CLOCK_HINT=" If the code is right, check that your phone's date and time are set automatically; a phone clock that is several minutes off is refused.";
  function srjRejectionMessage(error,action){
    if((action==="host"||action==="join")&&srjErrorCode(error)==="permission-denied")return `The private session was refused.${SRJ_CLOCK_HINT}`;
    return error&&error.message?error.message:"Private session request was rejected.";
  }
  function srjClearRejectedPending(error,action){
    const message=srjRejectionMessage(error,action);
    if(action==="close"){
      srjSetState({status:"error",busy:false,pendingAction:null,capabilityCopyAllowed:true,message:`${message} The last confirmed active session remains held in page memory; your Showdown was not changed.`});
    }else{
      srjSetState({status:"error",busy:false,sessionId:null,rivalryId:null,accountId:null,deviceId:null,role:null,sessionState:null,revision:null,expiresAtEpochMs:null,pendingAction:null,capabilityCopyAllowed:false,message:`${message} No unresolved capability is exposed and your Showdown was not changed.`});
    }
    return {ok:false,code:error&&error.code||`REMOTE_JOINING_${String(action).toUpperCase()}_FAILED`,message,recoverable:false};
  }
  async function srjAttemptPending(context){
    const action=srjState.pendingAction;
    const sessionId=srjState.sessionId;
    if(!action||!sessionId)return {ok:false,code:"REMOTE_JOINING_RECOVERY_REQUIRED",message:"No unresolved private-session operation is waiting for retry."};
    if(!srjPendingContextMatches(context)){
      srjSetState({status:"recovery-pending",busy:false,capabilityCopyAllowed:false,message:"The current account, registered browser or Connected Rivalry no longer matches the unresolved request. Retry is blocked so the capability cannot cross authority contexts."});
      return {ok:false,code:"REMOTE_JOINING_RECOVERY_CONTEXT_CHANGED",message:"The unresolved request belongs to a different current authority context.",recoverable:true,pendingAction:action};
    }
    srjSetState({status:`retrying-${action}`,busy:true,capabilityCopyAllowed:false,message:`Retrying the exact same ${action} capability. No replacement session will be generated…`});
    try{
      let result;
      if(action==="host")result=await context.protocol.openSession({...srjOperationOptions(context,sessionId),ttlMs:SRJ_HOST_TTL_MS});
      else if(action==="join")result=await context.protocol.joinSession(srjOperationOptions(context,sessionId));
      else if(action==="close")result=await context.protocol.closeSession(srjOperationOptions(context,sessionId));
      else throw srjError("REMOTE_JOINING_RECOVERY_ACTION_INVALID","The unresolved private-session action is invalid.");
      if(!result||result.ok!==true)throw srjError(result&&result.code||"REMOTE_JOINING_RECOVERY_FAILED",srjFailureMessage(result,"Private-session recovery could not be confirmed."));
      if(action==="host"){srjAcceptResult(result,context,"host",result.replayed?"Private session recovery confirmed the original host capability. No duplicate session was created.":"Private session is open. Share the full code directly with the other paired manager. It is kept only in this page's memory.");srjWatchForJoin(result.sessionId);}
      else if(action==="join")srjAcceptResult(result,context,"peer",result.replayed?"Private session recovery confirmed the original join on the same capability.":"Private session is active with exactly the two paired rivalry accounts.");
      else srjAcceptResult(result,context,srjState.role||"member",result.replayed?"Private session recovery confirmed the original terminal close on the same capability.":"Private session is closed terminally. Its code remains only in page memory until you forget it or reload.");
      return result;
    }catch(error){
      if(srjIsAmbiguousFailure(error))return srjPendingFailure(error,action);
      return srjClearRejectedPending(error,action);
    }
  }
  function srjHostWaitingForJoin(sessionId){return Boolean(sessionId&&srjState.sessionId===sessionId&&srjState.role==="host"&&srjState.sessionState==="open"&&!srjState.pendingAction&&!srjExpiredByClock());}
  function srjWatchForJoin(sessionId,startedAt=Date.now(),generation=srjWaitGeneration){
    if(!root.document||typeof root.setTimeout!=="function"||!srjHostWaitingForJoin(sessionId))return false;
    if(srjJoinWatchTimer!==null){if(srjJoinWatchSessionId===sessionId)return false;if(typeof root.clearTimeout==="function")root.clearTimeout(srjJoinWatchTimer);}
    srjJoinWatchSessionId=sessionId;
    const timer=root.setTimeout(async()=>{
      if(srjJoinWatchTimer!==timer)return;
      srjJoinWatchTimer=null;srjJoinWatchSessionId=null;
      if(generation!==srjWaitGeneration||!srjHostWaitingForJoin(sessionId))return;
      if(Date.now()-startedAt>SRJ_JOIN_WATCH_LIMIT_MS){srjPauseWait();return;}
      if(!srjState.busy&&root.document.visibilityState!=="hidden"){
        await srjCheckForJoin(sessionId,generation);
      }
      if(generation===srjWaitGeneration)srjWatchForJoin(sessionId,startedAt,generation);
    },SRJ_JOIN_WATCH_MS);
    srjJoinWatchTimer=timer;
    return true;
  }
  async function srjCheckForJoin(sessionId,generation){
    try{
      root.CareerModeFirestoreBudget?.wantFresh?.();
      const context=await srjResolveContext();
      if(generation!==srjWaitGeneration||!srjPendingContextMatches(context)||!srjHostWaitingForJoin(sessionId))return;
      const result=await context.protocol.readSession(srjOperationOptions(context,sessionId));
      if(generation===srjWaitGeneration&&srjHostWaitingForJoin(sessionId)&&!srjState.busy&&result&&result.ok===true&&result.state!=="open")srjAcceptResult(result,context,"host",result.state==="active"?"The other manager joined. Private session is active with exactly the two paired rivalry accounts.":`Private session refreshed at revision ${result.revision}.`);
    }catch(_error){}
  }
  async function srjRetryPendingOperation(){
    if(srjRetireEnded())return {ok:false,code:"REMOTE_JOINING_SHOWDOWN_ENDED",message:srjState.message};
    if(!srjState.pendingAction||!srjState.sessionId)return {ok:false,code:"REMOTE_JOINING_RECOVERY_REQUIRED",message:"No unresolved private-session operation is waiting for retry."};
    if(srjState.busy)return {ok:false,code:"REMOTE_JOINING_BUSY",message:"A private-session operation is already in progress."};
    try{return await srjAttemptPending(await srjResolveContext());}
    catch(error){
      if(srjIsAmbiguousFailure(error))return srjPendingFailure(error,srjState.pendingAction);
      srjSetState({status:"recovery-pending",busy:false,capabilityCopyAllowed:false,message:`${error&&error.message?error.message:"Current private authority could not be resolved."} The unresolved capability remains memory-only and will not be copied or replaced.`});
      return {ok:false,code:error&&error.code||"REMOTE_JOINING_RECOVERY_CONTEXT_UNAVAILABLE",message:error&&error.message||"Current private authority could not be resolved.",recoverable:true,pendingAction:srjState.pendingAction};
    }
  }
  function srjReplaceBusy(){return {ok:false,code:"REMOTE_JOINING_BUSY",message:"A private-session operation is already in progress."};}
  function srjReplaceHeld(start){srjReplaceAction=(async()=>{const ended=await srjEndHeldSession();return ended.ok?await start():ended;})().finally(()=>{srjReplaceAction=null;});return srjReplaceAction;}
  async function srjHostSession(options={}){
    if(srjReplaceAction)return srjReplaceBusy();
    if(srjSessionBlocksStart()){
      if(!(options&&options.replaceCurrent===true)||!srjHeldSessionReplaceable())return {ok:false,code:"REMOTE_JOINING_SESSION_ALREADY_HELD",message:"Resolve, revoke or close the current private session before hosting another."};
      return srjReplaceHeld(srjStartHost);
    }
    return srjStartHost();
  }
  async function srjStartHost(){
    srjSetState({status:"hosting",busy:true,message:"Creating an exact private session capability…"});
    try{
      const context=await srjResolveContext();
      const sessionId=context.protocol.generateSessionId(root.crypto);
      srjSetState({status:"hosting",busy:true,sessionId,rivalryId:context.rivalryId,accountId:context.accountId,deviceId:context.deviceId,role:"host",sessionState:"unresolved",revision:null,expiresAtEpochMs:null,pendingAction:"host",capabilityCopyAllowed:false,message:"Opening the exact private session. Its full capability is hidden until provider acknowledgement is confirmed…"});
      return await srjAttemptPending(context);
    }catch(error){
      if(srjState.pendingAction==="host"&&srjIsAmbiguousFailure(error))return srjPendingFailure(error,"host");
      if(srjState.pendingAction==="host")return srjClearRejectedPending(error,"host");
      srjSetState({status:"error",busy:false,message:`${error&&error.message?error.message:"Private session could not be opened."} Your Showdown was not changed.`});
      return {ok:false,code:error&&error.code||"REMOTE_JOINING_HOST_FAILED",message:error&&error.message||"Private session could not be opened."};
    }
  }
  async function srjJoinSession(value,options={}){
    if(srjReplaceAction)return srjReplaceBusy();
    if(srjSessionBlocksStart()){
      // BH-11 (#1): only an ACTIVE session may be ended to join a fresh code; an OPEN hosted one keeps the existing guard.
      if(!(options&&options.replaceCurrent===true)||!srjHeldSessionReplaceable()||srjState.sessionState!=="active")return {ok:false,code:"REMOTE_JOINING_SESSION_ALREADY_HELD",message:"Resolve, revoke or close the current private session before joining another."};
      srjReplaceAction=(async()=>{
        let nextSessionId;
        try{const deps=await srjEnsureDependencies();nextSessionId=deps["standard-auth-session"].normalizeSessionId(value);}
        catch(error){const message=`${error&&error.message?error.message:"That private session code is invalid."} The current private session was kept.`;srjSetState({status:"error",busy:false,message});return {ok:false,code:error&&error.code||"REMOTE_JOINING_JOIN_FAILED",message};}
        if(nextSessionId===srjState.sessionId){const message="This phone is already in that private session.";srjSetState({message});return {ok:false,code:"REMOTE_JOINING_SAME_SESSION",message};}
        const ended=await srjEndHeldSession();return ended.ok?await srjStartJoin(value):ended;
      })().finally(()=>{srjReplaceAction=null;});
      return srjReplaceAction;
    }
    return srjStartJoin(value);
  }
  async function srjStartJoin(value){
    srjSetState({status:"joining",busy:true,message:"Joining the exact private session…"});
    try{
      const context=await srjResolveContext();
      const sessionId=context.protocol.normalizeSessionId(value);
      srjSetState({status:"joining",busy:true,sessionId,rivalryId:context.rivalryId,accountId:context.accountId,deviceId:context.deviceId,role:"peer",sessionState:"unresolved",revision:null,expiresAtEpochMs:null,pendingAction:"join",capabilityCopyAllowed:false,message:"Joining the exact capability. Its full value remains hidden while provider acknowledgement is unresolved…"});
      return await srjAttemptPending(context);
    }catch(error){
      if(srjState.pendingAction==="join"&&srjIsAmbiguousFailure(error))return srjPendingFailure(error,"join");
      if(srjState.pendingAction==="join")return srjClearRejectedPending(error,"join");
      srjSetState({status:"error",busy:false,message:`${error&&error.message?error.message:"Private session could not be joined."} Your Showdown was not changed.`});
      return {ok:false,code:error&&error.code||"REMOTE_JOINING_JOIN_FAILED",message:error&&error.message||"Private session could not be joined."};
    }
  }
  async function srjRefreshSession(){
    const remembered=srjState.sessionId;
    if(!remembered)return {ok:false,code:"REMOTE_JOINING_SESSION_REQUIRED",message:"No private session code is held in page memory."};
    if(srjState.pendingAction)return {ok:false,code:"REMOTE_JOINING_RECOVERY_PENDING",message:"Resolve the pending operation before reading the session."};
    srjSetState({status:"refreshing",busy:true,message:"Reading exact private-session authority…"});
    try{
      const context=await srjResolveContext();
      const result=await context.protocol.readSession(srjOperationOptions(context,remembered));
      if(!result||result.ok!==true)throw srjError(result&&result.code||"REMOTE_JOINING_READ_FAILED",srjFailureMessage(result,"Private session could not be read."));
      const clockNote=result.expiredByClock?" The provider expiry boundary has passed; no automatic mutation was performed.":"";
      srjAcceptResult(result,context,srjState.role||"member",`Private session refreshed at revision ${result.revision}.${clockNote}`);
      return result;
    }catch(error){srjSetState({status:"error",busy:false,message:`${error&&error.message?error.message:"Private session could not be read."}`});return {ok:false,code:error&&error.code||"REMOTE_JOINING_READ_FAILED",message:error&&error.message||"Private session could not be read."};}
  }
  async function srjRevokeSession(){
    const remembered=srjState.sessionId;
    if(!remembered)return {ok:false,code:"REMOTE_JOINING_SESSION_REQUIRED",message:"No private session code is held in page memory."};
    if(srjState.pendingAction)return {ok:false,code:"REMOTE_JOINING_RECOVERY_PENDING",message:"Resolve the pending operation before revoking the session."};
    if(srjState.sessionState!=="open")return {ok:false,code:"REMOTE_JOINING_REVOKE_NOT_OPEN",message:"Only an open host session can be revoked before peer join."};
    srjSetState({status:"revoking",busy:true,message:"Revoking the exact open private session…"});
    try{
      const context=await srjResolveContext();
      const result=await context.protocol.revokeSession(srjOperationOptions(context,remembered));
      if(!result||result.ok!==true)throw srjError(result&&result.code||"REMOTE_JOINING_REVOKE_FAILED",srjFailureMessage(result,"Private session could not be revoked."));
      srjAcceptResult(result,context,"host","Private session is revoked terminally. It can no longer be joined; forget the code when ready.");
      return result;
    }catch(error){srjSetState({status:"error",busy:false,message:`${error&&error.message?error.message:"Private session could not be revoked."} The capability remains held in page memory.`});return {ok:false,code:error&&error.code||"REMOTE_JOINING_REVOKE_FAILED",message:error&&error.message||"Private session could not be revoked."};}
  }
  async function srjCloseSession(){
    const remembered=srjState.sessionId;
    if(!remembered)return {ok:false,code:"REMOTE_JOINING_SESSION_REQUIRED",message:"No private session code is held in page memory."};
    if(srjState.pendingAction)return {ok:false,code:"REMOTE_JOINING_RECOVERY_PENDING",message:"Resolve the pending operation before closing the session."};
    if(srjState.sessionState!=="active")return {ok:false,code:"REMOTE_JOINING_CLOSE_NOT_ACTIVE",message:"Only an active private session can be closed."};
    try{
      const context=await srjResolveContext();
      srjSetState({status:"closing",busy:true,accountId:context.accountId,deviceId:context.deviceId,pendingAction:"close",capabilityCopyAllowed:false,message:"Closing the exact active private session. Copy is disabled until provider acknowledgement is confirmed…"});
      return await srjAttemptPending(context);
    }catch(error){
      if(srjState.pendingAction==="close"&&srjIsAmbiguousFailure(error))return srjPendingFailure(error,"close");
      if(srjState.pendingAction==="close")return srjClearRejectedPending(error,"close");
      srjSetState({status:"error",busy:false,message:`${error&&error.message?error.message:"Private session could not be closed."}`});
      return {ok:false,code:error&&error.code||"REMOTE_JOINING_CLOSE_FAILED",message:error&&error.message||"Private session could not be closed."};
    }
  }
  function srjForgetSession(){
    if(srjState.pendingAction||srjState.sessionState==="unresolved")return {ok:false,code:"REMOTE_JOINING_RECOVERY_PENDING",message:"Resolve the pending provider outcome before forgetting this page-memory capability."};
    return srjSetState({status:"idle",busy:false,auto:null,sessionId:null,rivalryId:null,accountId:null,deviceId:null,role:null,sessionState:null,revision:null,expiresAtEpochMs:null,pendingAction:null,capabilityCopyAllowed:false,message:"Private session code forgotten from page memory. No provider state was changed."});
  }
  async function srjCopySessionCode(){
    if(!srjState.sessionId||srjState.capabilityCopyAllowed!==true||srjState.pendingAction)return false;
    try{if(root.navigator&&root.navigator.clipboard&&typeof root.navigator.clipboard.writeText==="function"){await root.navigator.clipboard.writeText(srjState.sessionId);return true;}}catch(_error){}
    return false;
  }
  // Studio Z3: the exact session lives in page memory only, so a refresh (Transfer, setup, anywhere) used to drop this
  // phone on Home and CONTINUE CAREER opened the code screen while the other phone was still in the game. A refreshed or
  // reopened tab now re-attaches through the pair's session pointer below; the session itself is still never stored.
  // Studio Z4: every new game day Daniel had to host and send Nik a long session code to paste. The two paired accounts now
  // share one pointer, rivalries/{rivalryId}/sessionOffers/current, which only they can read (Rules) and only the session's
  // host can point at their own open or active session. Daniel's phone hosts and publishes it; Nik's phone reads it and
  // joins; either phone re-attaches to it after a closed tab. The manual code controls stay behind USE A SESSION CODE
  // for accounts that are not permanently paired (r79 PR3: a paired account has no USE A SESSION CODE path).
  const SRJ_OFFER_POLL_MS=3000,SRJ_OFFER_POLL_LIMIT_MS=10*60*1000,SRJ_OFFER_MIN_LIFE_MS=60*1000;
  let srjAutoPromise=null,srjOfferTimer=null,srjPublishTimer=null,srjPublishRetry=null;
  let srjWaitGeneration=0,srjResumePromise=null;
  function srjOfferRef(context){return context.services.firestoreSdk.doc(context.services.firestore,"rivalries",context.rivalryId,"sessionOffers","current");}
  // r79 gallery (Nik's JOIN after a deleted Showdown): the pointer is what a waiting phone polls for, so the budget layer must
  // not answer it from a copy. With any healthy wait-point listener on the page (the previous Showdown's shared setup kept one)
  // a background check reused documents for 60 s, so Nik read "no offer" for a minute after Daniel had published his session.
  // wantFresh(path) keeps this one document on the 2 s coalescing window: one read per 3 s poll, the cadence it always had.
  function srjOfferFromSnapshot(snapshot){
    if(!snapshot||typeof snapshot.exists!=="function")throw srjError("REMOTE_JOINING_OFFER_UNREADABLE");
    const exists=snapshot.exists();
    if(exists===false)return null;
    if(exists!==true)throw srjError("REMOTE_JOINING_OFFER_UNREADABLE");
    const data=snapshot.data(),expiresAt=data?.expiresAt?.toMillis?.();
    if(!data||data.schemaVersion!==1||typeof data.sessionId!=="string"||!data.sessionId||typeof data.hostAccountId!=="string"||!data.hostAccountId||!Number.isFinite(expiresAt))throw srjError("REMOTE_JOINING_OFFER_UNREADABLE");
    return Object.freeze({sessionId:data.sessionId,hostAccountId:data.hostAccountId,expiresAtEpochMs:expiresAt});
  }
  async function srjReadOffer(context){
    root.CareerModeFirestoreBudget?.wantFresh?.(`rivalries/${context.rivalryId}/sessionOffers/current`);
    const sdk=context.services.firestoreSdk;
    return sdk.runTransaction(context.services.firestore,async transaction=>srjOfferFromSnapshot(await transaction.get(srjOfferRef(context))));
  }
  // Absence, a session this account is not a member of (an older pairing's account), and terminal/expired sessions are
  // positive answers. All other failures keep the pointer unresolved.
  async function srjReadSession(context,sessionId){
    const result=await context.protocol.readSession(srjOperationOptions(context,sessionId));
    if(result?.ok===false&&["PRIVATE_SESSION_NOT_FOUND","PRIVATE_SESSION_MEMBER_REQUIRED"].includes(result.code))return null;
    if(!result||result.ok!==true||result.sessionId!==sessionId||!["open","active","closed","revoked","expired"].includes(result.state))throw srjError("REMOTE_JOINING_SESSION_UNREADABLE");
    if(["closed","revoked","expired"].includes(result.state))return null;
    if(!Number.isFinite(result.expiresAtEpochMs))throw srjError("REMOTE_JOINING_SESSION_UNREADABLE");
    return result.expiredByClock===true||result.expiresAtEpochMs<=Date.now()?null:result;
  }
  let srjConnectReadPending=false;
  // JOB-1 F1: retry the exact failed read at 0, 3 and 9 seconds. Hidden pages pause for the existing wake/retry path.
  async function srjConnectRead(read){
    for(let attempt=0;attempt<3;attempt++){
      if(root.document?.visibilityState==="hidden")break;
      try{
        const result=await read();
        if(root.document?.visibilityState==="hidden")break;
        return result;
      }catch(_error){
        if(attempt===2||root.document?.visibilityState==="hidden"||typeof root.setTimeout!=="function")break;
        await new Promise(resolve=>root.setTimeout(resolve,3000*(attempt+1)));
      }
    }
    throw srjError("REMOTE_JOINING_READ_UNAVAILABLE");
  }
  async function srjWriteOffer(context){
    if(!srjState.sessionId||srjState.role!=="host"||!["open","active"].includes(srjState.sessionState)||!Number.isFinite(srjState.expiresAtEpochMs))return false;
    try{
      const sessionId=srjState.sessionId,guard=await srjOfferReplacement(context,sessionId);
      return guard.outcome==="ours"||(!guard.outcome&&await srjCommitOffer(context,sessionId,guard.seen)==="written");
    }catch(_error){return false;}
  }
  function srjHostsByDefault(){const identity=root.CareerModeOnlinePlayerIdentity&&typeof root.CareerModeOnlinePlayerIdentity.getState==="function"?root.CareerModeOnlinePlayerIdentity.getState():null;return Boolean(identity&&identity.managerId==="daniel");}
  function srjRivalName(){return srjHostsByDefault()?"NIK":"DANIEL";}
  async function srjAdopt(context,sessionId,role,joinOpen,generation=srjWaitGeneration,retryRead=false){
    const read=()=>srjReadSession(context,sessionId);
    const result=await (retryRead?srjConnectRead(read):read());
    if(generation!==srjWaitGeneration||!result)return null;
    if(result.state==="active"){srjAcceptResult(result,context,role,"Connected to your Showdown again.");return {ok:true,kind:"resumed"};}
    if(result.state!=="open")return null;
    if(role==="host"){srjOfferConfirmed=sessionId;srjAcceptResult(result,context,"host",`Waiting for ${srjRivalName()==="NIK"?"Nik":"Daniel"} to open the game.`);srjSetState({auto:"waiting"});srjWatchForJoin(sessionId);return {ok:true,kind:"hosting"};}
    if(!joinOpen)return null;
    const joined=await srjStartJoin(sessionId);
    return joined&&joined.ok===true?{ok:true,kind:"joined"}:null;
  }
  function srjStopOfferWait(){if(srjOfferTimer!==null&&typeof root.clearTimeout==="function")root.clearTimeout(srjOfferTimer);srjOfferTimer=null;}
  function srjPauseWait(message=srjState.message){
    srjSetState({auto:"waiting",waitRetry:true,message});
  }
  async function srjCheckForOffer(generation){
    try{
      const context=await srjResolveContext(),offer=await srjReadOffer(context);
      if(generation===srjWaitGeneration&&offer&&offer.hostAccountId!==context.accountId&&offer.expiresAtEpochMs>Date.now()+SRJ_OFFER_MIN_LIFE_MS&&srjState.auto==="waiting"&&!srjState.busy&&!srjHasNonterminalSession()){
        const adopted=await srjAdopt(context,offer.sessionId,"peer",true,generation);
        if(adopted){srjSetState({auto:null,waitRetry:false});return;}
      }
    }catch(_error){}
  }
  function srjWaitForOffer(startedAt=Date.now(),generation=srjWaitGeneration){
    srjStopOfferWait();
    if(typeof root.setTimeout!=="function")return;
    const timer=root.setTimeout(async()=>{
      if(srjOfferTimer!==timer)return;
      srjOfferTimer=null;
      if(generation!==srjWaitGeneration||srjHasNonterminalSession()||srjState.auto!=="waiting")return;
      if(Date.now()-startedAt>SRJ_OFFER_POLL_LIMIT_MS){srjPauseWait();return;}
      if(!srjState.busy&&(!root.document||root.document.visibilityState!=="hidden"))await srjCheckForOffer(generation);
      if(generation===srjWaitGeneration&&!srjHasNonterminalSession()&&srjState.auto==="waiting")srjWaitForOffer(startedAt,generation);
    },SRJ_OFFER_POLL_MS);
    srjOfferTimer=timer;
  }
  // JOB-1 F2: a wake or retry owns one immediate read and a new ten-minute window. Retired callbacks cannot re-arm it.
  // Codex #974: an offer publish retry whose own window ran out while asleep gets a fresh window too.
  function srjResumeWait(){
    if(srjResumePromise)return srjResumePromise;
    if(root.document?.visibilityState==="hidden"||srjState.busy||srjState.pendingAction||srjAutoPromise)return Promise.resolve(false);
    if(srjConnectReadPending)return srjAutoConnect();
    const sessionId=srjHostWaitingForJoin(srjState.sessionId)?srjState.sessionId:null;
    if(!sessionId&&(srjState.auto!=="waiting"||srjHasNonterminalSession()))return Promise.resolve(false);
    const generation=++srjWaitGeneration,startedAt=Date.now();
    srjStopOfferWait();
    if(srjJoinWatchTimer!==null&&typeof root.clearTimeout==="function")root.clearTimeout(srjJoinWatchTimer);
    srjJoinWatchTimer=null;srjJoinWatchSessionId=null;
    srjSetState({waitRetry:false});
    srjResumePromise=(async()=>{
      if(sessionId){
        await srjCheckForJoin(sessionId,generation);
        if(generation===srjWaitGeneration){srjWatchForJoin(sessionId,startedAt,generation);if(srjHostWaitingForJoin(sessionId)&&srjOfferConfirmed!==sessionId&&(!srjPublishRetry||Date.now()-srjPublishRetry.startedAt>SRJ_OFFER_POLL_LIMIT_MS)&&srjPermanentlyPaired())srjRetryOfferPublish(sessionId);}
      }else{
        await srjCheckForOffer(generation);
        if(generation===srjWaitGeneration&&srjState.auto==="waiting"&&!srjHasNonterminalSession())srjWaitForOffer(startedAt,generation);
      }
      return true;
    })().finally(()=>{srjResumePromise=null;});
    return srjResumePromise;
  }
  // Codex #904 (release review): a permanently paired account has no USE A SESSION CODE path, so when Daniel's session is
  // open but the pointer write fails, "send Nik this session code" was a dead end: Nik's phone only ever reads the pointer.
  // Daniel keeps waiting and this page publishes the pointer again (3 s, doubling to once a minute, visible tab only, 10 min
  // like Nik's own wait, sooner when the browser comes back online) until it lands or the session stops waiting for a join.
  // Codex #920: each try first reads the pointer. Naming this session ends the retry with no write (a write whose answer
  // was lost). Naming another session that the server does not positively report as gone or over
  // means no write (a newer screen of Daniel's may own the game, and Nik must not be sent back to this one); the retry
  // keeps checking in case that session ends. This session must still read OPEN, and a stale or missing pointer is replaced
  // only if it is still the one just read. Reopening the player panel restarts a retry that gave up.
  let srjOfferConfirmed=null;
  // Codex #920: the host's join watch has its own 10 min limit, so it starts afresh whenever the pointer lands or publishing
  // restarts; otherwise Nik could join after it ended and Daniel's screen would stay on WAITING until a reload.
  function srjRewatchForJoin(sessionId){if(srjJoinWatchTimer!==null&&typeof root.clearTimeout==="function")root.clearTimeout(srjJoinWatchTimer);srjJoinWatchTimer=null;srjJoinWatchSessionId=null;const watching=srjWatchForJoin(sessionId);if(watching)srjSetState({waitRetry:false});return watching;}
  function srjStopPublishRetry(){if(srjPublishTimer!==null&&typeof root.clearTimeout==="function")root.clearTimeout(srjPublishTimer);srjPublishTimer=null;srjPublishRetry=null;}
  async function srjOfferReplacement(context,sessionId){
    const seen=await srjReadOffer(context);
    if(seen?.sessionId===sessionId)return {seen,outcome:"ours"};
    // Even a short-lived or stale pointer may name a live session. Only a positive session read permits replacement.
    if(seen&&await srjReadSession(context,seen.sessionId))return {seen,outcome:"taken"};
    return {seen,outcome:null};
  }
  async function srjCommitOffer(context,sessionId,seen){
    if(!srjPendingContextMatches(context)||srjState.sessionId!==sessionId||srjState.role!=="host")return "stop";
    const sdk=context.services.firestoreSdk;
    const value={schemaVersion:1,sessionId,hostAccountId:context.accountId,expiresAt:sdk.Timestamp.fromMillis(srjState.expiresAtEpochMs),updatedAt:sdk.serverTimestamp()};
    root.CareerModeFirestoreBudget?.wantFresh?.(`rivalries/${context.rivalryId}/sessionOffers/current`);
    return sdk.runTransaction(context.services.firestore,async transaction=>{
      const current=srjOfferFromSnapshot(await transaction.get(srjOfferRef(context)));
      if((current?current.sessionId:null)!==(seen?seen.sessionId:null))return "retry";
      transaction.set(srjOfferRef(context),value);return "written";
    });
  }
  async function srjPublishIfStillOurs(context,sessionId){
    const guard=await srjOfferReplacement(context,sessionId);
    if(guard.outcome)return guard.outcome;
    // This session itself must still be open on the server before Nik is pointed at it.
    const own=await srjReadSession(context,sessionId);
    if(!own)return "stop";
    if(own.state==="active"){if(srjHostWaitingForJoin(sessionId))srjAcceptResult(own,context,"host","The other manager joined. Private session is active with exactly the two paired rivalry accounts.");return "stop";}
    if(!(own.expiresAtEpochMs>Date.now()+SRJ_OFFER_MIN_LIFE_MS)||!srjHostWaitingForJoin(sessionId))return "stop";
    return srjCommitOffer(context,sessionId,guard.seen);
  }
  function srjRetryOfferPublish(sessionId,startedAt=Date.now(),attempt=0){
    srjStopPublishRetry();
    if(typeof root.setTimeout!=="function")return false;
    srjPublishRetry={sessionId,startedAt};
    const timer=root.setTimeout(async()=>{
      if(srjPublishTimer!==timer)return;
      srjPublishTimer=null;
      if(!srjHostWaitingForJoin(sessionId)){srjPublishRetry=null;return;}
      if(Date.now()-startedAt>SRJ_OFFER_POLL_LIMIT_MS){srjPublishRetry=null;if(srjState.message!=="Your game is open on another screen. Carry on there.")srjSetState({message:"Nik's phone could not be reached. Check your connection, then open the game again."});return;}
      if(!srjState.busy&&(!root.document||root.document.visibilityState!=="hidden")){
        try{
          const context=await srjResolveContext();
          if(srjPublishTimer!==null)return;  // the browser came back online meanwhile and restarted the retry
          if(!srjPendingContextMatches(context)){srjPublishRetry=null;return;}  // another account or Showdown now: not ours to publish
          const outcome=await srjPublishIfStillOurs(context,sessionId);
          if(outcome==="ours"||outcome==="written"){srjOfferConfirmed=sessionId;srjPublishRetry=null;if(srjState.message==="Your game is open on another screen. Carry on there.")srjSetState({message:"Waiting for Nik to open the game."});srjRewatchForJoin(sessionId);return;}
          if(outcome==="taken"){if(srjHostWaitingForJoin(sessionId)&&srjState.message!=="Your game is open on another screen. Carry on there.")srjSetState({message:"Your game is open on another screen. Carry on there."});}
          if(outcome==="stop"){srjPublishRetry=null;return;}
        }catch(_error){}
      }
      if(srjPublishTimer===null&&srjPublishRetry&&srjPublishRetry.sessionId===sessionId)srjRetryOfferPublish(sessionId,startedAt,attempt+1);
    },Math.min(SRJ_OFFER_POLL_MS*2**attempt,60*1000));
    srjPublishTimer=timer;
    return true;
  }
  async function srjAutoConnectOnce(){
    srjRetireEnded();
    if(srjState.busy||srjState.pendingAction||srjReplaceAction)return {ok:false,code:"REMOTE_JOINING_BUSY",message:"A private-session operation is already in progress."};
    let context;
    try{context=await srjResolveContext();}catch(error){srjSetState({auto:null});return {ok:false,code:error&&error.code||"REMOTE_JOINING_CONTEXT_UNAVAILABLE",message:error&&error.message||"Player connection is unavailable."};}
    if(srjHasNonterminalSession()&&srjPendingContextMatches(context)){
      if(srjState.sessionState==="active")srjSetState({auto:null});
      else if(srjHostWaitingForJoin(srjState.sessionId)&&srjOfferConfirmed!==srjState.sessionId&&!srjPublishRetry&&srjPermanentlyPaired()){srjSetState({auto:"waiting",message:"Waiting for Nik to open the game."});srjRewatchForJoin(srjState.sessionId);srjRetryOfferPublish(srjState.sessionId);return {ok:true,kind:"held-publishing"};}
      if(srjHostWaitingForJoin(srjState.sessionId))srjRewatchForJoin(srjState.sessionId);
      return {ok:true,kind:"held"};
    }
    srjSetState({auto:"connecting",waitRetry:false,message:"Connecting to your Showdown…"});
    const offer=await srjConnectRead(()=>srjReadOffer(context));
    if(offer){
      const mine=offer.hostAccountId===context.accountId;
      const adopted=await srjAdopt(context,offer.sessionId,mine?"host":"peer",!mine,srjWaitGeneration,true);
      if(adopted){srjConnectReadPending=false;if(adopted.kind!=="hosting")srjSetState({auto:null});return adopted;}
    }
    srjConnectReadPending=false;
    if(srjHostsByDefault()){
      const hosted=await srjStartHost();
      if(hosted&&hosted.ok===true&&srjState.role==="host"&&srjState.sessionId){
        const published=await srjWriteOffer(context);
        if(published)srjOfferConfirmed=srjState.sessionId;
        if(published||srjPermanentlyPaired()){
          srjSetState({auto:"waiting",message:"Waiting for Nik to open the game."});
          if(!published)srjRetryOfferPublish(srjState.sessionId);
          return {ok:true,kind:published?"hosted":"hosted-publishing"};
        }
        srjSetState({auto:null,message:"Send Nik this session code to connect."});
        return {ok:true,kind:"hosted-manual"};
      }
      srjSetState({auto:null});
      return hosted||{ok:false,code:"REMOTE_JOINING_HOST_FAILED",message:"Private session could not be opened."};
    }
    srjSetState({auto:"waiting",message:"Waiting for Daniel to open the game."});
    srjWaitForOffer();
    return {ok:true,kind:"waiting"};
  }
  function srjAutoConnect(){
    if(srjAutoPromise)return srjAutoPromise;
    if(!srjHasNonterminalSession()&&!srjState.busy&&!srjState.pendingAction)srjSetState({auto:"connecting",message:"Connecting to your Showdown…"});
    srjAutoPromise=srjAutoConnectOnce().catch(error=>{
      if(error?.code==="REMOTE_JOINING_READ_UNAVAILABLE"){srjConnectReadPending=true;srjPauseWait("Player connection failed.");}
      else srjSetState({auto:null});
      return {ok:false,code:error&&error.code||"REMOTE_JOINING_AUTO_FAILED",message:error&&error.message||"Player connection failed."};
    }).finally(()=>{srjAutoPromise=null;});
    return srjAutoPromise;
  }
  function srjPermanentlyPaired(){try{const partner=root.CareerModePersistentNikDanielPair?.getPartnerState?.(),account=root.CareerModeSparkConnectedAccount?.getState?.();return Boolean(partner&&partner.status==="ready"&&partner.record&&partner.record.active===true&&account&&partner.accountId===account.accountId);}catch(_error){return false;}}
  function srjUseManualCode(){if(srjPermanentlyPaired())return srjState;srjStopOfferWait();return srjSetState({auto:null});}
  function srjRenderAuto(body){
    const waiting=srjState.auto==="waiting",retry=waiting&&srjState.waitRetry;
    const intro=srjCreate("div","remoteJoiningIntro");
    intro.append(srjCreate("span","remoteJoiningEyebrow","CAREER MODE SHOWDOWN"),srjCreate("h2","",waiting?`WAITING FOR ${srjRivalName()}`:"CONNECTING"),srjCreate("p","",retry?srjState.message:waiting?`Your game is ready. It continues by itself as soon as ${srjRivalName()==="NIK"?"Nik":"Daniel"} opens Career Mode Showdown and taps CONTINUE CAREER.`:"Connecting Daniel and Nik to the same game. This takes a moment."));
    body.appendChild(intro);
    if(retry){const actions=srjCreate("div","remoteJoiningActions"),button=srjCreate("button","compactButton","TRY AGAIN");button.type="button";button.disabled=srjState.busy;button.addEventListener("click",()=>{void srjResumeWait();});actions.appendChild(button);body.appendChild(actions);}
    // r79 PR3: a permanently paired account connects through the pair's session pointer only, so the manual USE A SESSION CODE
    // path is gone for it. An account that is not (yet) permanently paired keeps it as the fallback.
    if(!srjPermanentlyPaired()){
      const actions=srjCreate("div","remoteJoiningActions");
      const manual=srjCreate("button","compactButton","USE A SESSION CODE");manual.type="button";manual.disabled=srjState.busy;manual.addEventListener("click",srjUseManualCode);actions.appendChild(manual);
      body.appendChild(actions);
    }
    const note=srjCreate("p","remoteJoiningStatus",srjState.message);note.setAttribute("role","status");note.setAttribute("aria-live","polite");body.appendChild(note);
  }
  function srjCreate(tag,className,text){const element=root.document.createElement(tag);if(className)element.className=className;if(text!==undefined&&text!==null)element.textContent=String(text);return element;}
  function srjShort(value){return typeof value!=="string"||!value?"—":value.length<=20?value:`${value.slice(0,12)}…${value.slice(-6)}`;}
  function srjRenderPanel(){
    if(!root.document||srjState.open!==true)return null;
    const overlay=root.document.getElementById(SRJ_PANEL_ID);
    if(!overlay)return null;
    const body=overlay.querySelector(".remoteJoiningBody");
    if(!body)return overlay;
    body.replaceChildren();
    if(srjState.auto){srjRenderAuto(body);return overlay;}
    const intro=srjCreate("div","remoteJoiningIntro");
    intro.append(srjCreate("span","remoteJoiningEyebrow","PRIVATE CONNECTION"),srjCreate("h2","","REMOTE JOINING"),srjCreate("p","","This connection is only for Daniel and Nik. If the network drops, retry the same code instead of creating another one."));
    body.appendChild(intro);
    const grid=srjCreate("div","remoteJoiningGrid");
    const host=srjCreate("section","remoteJoiningCard");
    host.append(srjCreate("span","remoteJoiningStep","01 · HOST"),srjCreate("h3","","CREATE CONNECTION CODE"),srjCreate("p","","Creates one fresh code for this Showdown."));
    const replaceable=srjHeldSessionReplaceable(),joinReplaces=replaceable&&srjState.sessionState==="active";
    const hostButton=srjCreate("button","menuButton",replaceable?"HOST NEW SESSION (REPLACES CURRENT)":"HOST PRIVATE SESSION");hostButton.type="button";hostButton.disabled=srjState.busy||(srjSessionBlocksStart()&&!replaceable);hostButton.addEventListener("click",()=>{void srjHostSession(replaceable?{replaceCurrent:true}:{});});host.appendChild(hostButton);
    const join=srjCreate("section","remoteJoiningCard");
    join.append(srjCreate("span","remoteJoiningStep","02 · JOIN"),srjCreate("h3","","JOIN CONNECTION"),srjCreate("p","","Paste the full code shared directly by the other already-paired manager."));
    const input=srjCreate("input","remoteJoiningInput");input.type="text";input.placeholder="session_…";input.autocomplete="off";input.autocapitalize="none";input.spellcheck=false;input.setAttribute("aria-label","Connection code");
    const joinButton=srjCreate("button","menuButton",joinReplaces?"JOIN NEW SESSION (ENDS CURRENT)":"JOIN PRIVATE SESSION");joinButton.type="button";joinButton.disabled=srjState.busy||(srjSessionBlocksStart()&&!joinReplaces);joinButton.addEventListener("click",()=>{void srjJoinSession(input.value,joinReplaces?{replaceCurrent:true}:{});});join.append(input,joinButton);grid.append(host,join);body.appendChild(grid);
    const current=srjCreate("section","remoteJoiningCurrent");
    current.append(srjCreate("span","remoteJoiningEyebrow","CURRENT CONNECTION"));
    if(srjState.sessionId){
      const expiredByClock=srjExpiredByClock();current.append(srjCreate("strong","remoteJoiningState",`${expiredByClock?"EXPIRED":String(srjState.sessionState||"unknown").toUpperCase()} · REV ${Number.isInteger(srjState.revision)?srjState.revision:"—"} · ${srjState.role||"member"}`));
      const visibleCode=srjState.capabilityCopyAllowed===true&&!srjState.pendingAction?srjState.sessionId:srjShort(srjState.sessionId);
      const code=srjCreate("code","remoteJoiningCode",visibleCode);current.appendChild(code);
      const meta=srjCreate("p","remoteJoiningMeta",`Rivalry ${srjShort(srjState.rivalryId)}${Number.isFinite(srjState.expiresAtEpochMs)?` · expires ${new Date(srjState.expiresAtEpochMs).toLocaleTimeString()}`:""}`);current.appendChild(meta);
      if(joinReplaces)current.appendChild(srjCreate("p","remoteJoiningMeta","If the other phone lost this session (for example after a reload), start a fresh one: host a new session here and send the code, or paste their new code above and join it. Either one ends this session first."));
      const actions=srjCreate("div","remoteJoiningActions");
      if(srjState.pendingAction){const retry=srjCreate("button","compactButton",`RETRY SAME ${srjState.pendingAction.toUpperCase()}`);retry.type="button";retry.disabled=srjState.busy;retry.addEventListener("click",()=>{void srjRetryPendingOperation();});actions.appendChild(retry);}
      const copy=srjCreate("button","compactButton","COPY CODE");copy.type="button";copy.disabled=srjState.busy||expiredByClock||srjState.capabilityCopyAllowed!==true||!!srjState.pendingAction;copy.addEventListener("click",async()=>{copy.textContent=await srjCopySessionCode()?"COPIED":"COPY UNAVAILABLE";});
      const refresh=srjCreate("button","compactButton","REFRESH / READ");refresh.type="button";refresh.disabled=srjState.busy||!!srjState.pendingAction;refresh.addEventListener("click",()=>{void srjRefreshSession();});
      const revoke=srjCreate("button","compactButton","REVOKE OPEN SESSION");revoke.type="button";revoke.disabled=srjState.busy||expiredByClock||!!srjState.pendingAction||srjState.sessionState!=="open";revoke.addEventListener("click",()=>{void srjRevokeSession();});
      const close=srjCreate("button","compactButton","CLOSE SESSION");close.type="button";close.disabled=srjState.busy||expiredByClock||!!srjState.pendingAction||srjState.sessionState!=="active";close.addEventListener("click",()=>{void srjCloseSession();});
      const forget=srjCreate("button","compactButton","FORGET CODE");forget.type="button";forget.disabled=srjState.busy||!!srjState.pendingAction||srjHasNonterminalSession()||srjState.sessionState==="unresolved";forget.addEventListener("click",srjForgetSession);actions.append(copy,refresh,revoke,close,forget);current.appendChild(actions);
    }else{
      current.append(srjCreate("p","remoteJoiningEmpty","No session capability is held in page memory."));
      // BH-11 (#1): after a reload the other phone may still show the game with the old session; say where it takes the new code.
      current.append(srjCreate("p","remoteJoiningMeta","If the other phone still shows the game, it takes your new code from NEW CODE on its game banner, or from Home > CONTINUE CAREER > CONNECTED."));
    }
    body.appendChild(current);
    const note=srjCreate("p","remoteJoiningStatus",srjState.message);note.setAttribute("role","status");note.setAttribute("aria-live","polite");body.appendChild(note);
    return overlay;
  }
  function srjOpenPanel(){
    if(!root.document)return false;
    let overlay=root.document.getElementById(SRJ_PANEL_ID);
    if(!overlay){
      overlay=srjCreate("div","remoteJoiningOverlay");overlay.id=SRJ_PANEL_ID;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label","Private Remote Joining");
      const shell=srjCreate("div","remoteJoiningShell");const header=srjCreate("div","remoteJoiningHeader");header.append(srjCreate("strong","","CAREER MODE SHOWDOWN // 17"));const dismiss=srjCreate("button","remoteJoiningDismiss","×");dismiss.type="button";dismiss.setAttribute("aria-label","Close Private Remote Joining");dismiss.addEventListener("click",srjClosePanel);header.appendChild(dismiss);const body=srjCreate("div","remoteJoiningBody");shell.append(header,body);overlay.appendChild(shell);root.document.body.appendChild(overlay);
    }
    overlay.classList.remove("hidden");srjSetState({open:true});const focus=overlay.querySelector("button");if(focus)focus.focus();return true;
  }
  function srjClosePanel(){const overlay=root.document&&root.document.getElementById(SRJ_PANEL_ID);if(overlay)overlay.classList.add("hidden");srjState=srjFreeze({...srjState,open:false});return true;}
  function srjSubscribe(listener){if(typeof listener!=="function")return()=>{};srjListeners.add(listener);return()=>srjListeners.delete(listener);}
  // Codex #904 (P2): an unresolved request (a host, join or close whose answer was lost) belongs to one Showdown. Once the
  // pair layer reports that Showdown ended (deleted on the other phone, or finished and let go on Home), the request is
  // moot: it is retired here so the next Showdown's auto-connect is not blocked as busy until a reload. No read, no write.
  function srjRetireEnded(){if(srjState.busy||!srjState.rivalryId||!srjEndedRivalryIds.has(srjState.rivalryId)||!(srjState.pendingAction||srjState.sessionState==="unresolved"))return false;srjStopPublishRetry();srjSetState({status:"idle",busy:false,auto:null,sessionId:null,rivalryId:null,accountId:null,deviceId:null,role:null,sessionState:null,revision:null,expiresAtEpochMs:null,pendingAction:null,capabilityCopyAllowed:false,message:"That Showdown has ended, so its unfinished connection was let go. Your Showdown was not changed."});return true;}
  function srjOnPairEnded(event){const rivalryId=String(event&&event.detail&&event.detail.closedRivalryId||"");if(!/^pair_[0-9a-f]{64}$/.test(rivalryId))return;srjEndedRivalryIds.add(rivalryId);if(srjRetireEnded())try{srjRenderPanel();}catch(_error){}}
  if(root&&typeof root.addEventListener==="function")root.addEventListener("career-mode-permanent-pair-ended",srjOnPairEnded);
  function srjOnOnline(){if(srjState.pendingAction&&!srjState.busy)void srjRetryPendingOperation();if(srjPublishRetry)srjRetryOfferPublish(srjPublishRetry.sessionId,srjPublishRetry.startedAt);void srjResumeWait();}
  if(root&&typeof root.addEventListener==="function")root.addEventListener("online",srjOnOnline);
  if(root.document&&typeof root.document.addEventListener==="function")root.document.addEventListener("visibilitychange",()=>{if(root.document.visibilityState!=="hidden")void srjResumeWait();});
  // r79 PR3: the partner record can land while this panel is open (Daniel records his first real pairing alongside his
  // auto-continue), so the open panel re-renders and USE A SESSION CODE goes away. No read: render only.
  if(root&&typeof root.addEventListener==="function")root.addEventListener("career-mode-permanent-pair-change",()=>{try{srjRenderPanel();}catch(_error){}});

  return srjFreeze({
    contractVersion:1,
    feature:"stage5e-production-private-remote-joining-runtime",
    productionRulesPublished:true,
    providerIdentity:"standard-firebase-request-auth-uid",
    authPersistence:"browserSessionPersistence",
    registeredDeviceAuthority:"account-owned-mutation-metadata",
    exactCapabilityBits:256,
    hostSessionTtlMs:SRJ_HOST_TTL_MS,
    sessionCapabilityStorage:"page-memory-only",
    persistentFirestoreCache:false,
    publicDiscovery:false,
    collectionListing:false,
    exactlyTwoAccounts:true,
    gameplayMutation:false,
    canonicalStorageMutation:false,
    canonicalStorageKeys:SRJ_CANONICAL_KEYS,
    candidateCInvolved:false,
    billingRequired:false,
    blazeRequired:false,
    cloudRunRequired:false,
    cloudFunctionsRequired:false,
    appCheckEnforcementRequired:false,
    hostJoinUxExposed:true,
    sameCapabilityReconnect:true,
    unresolvedCapabilityCopyBlocked:true,
    onlineRetryBounded:true,
    autoConnect:srjAutoConnect,
    useManualCode:srjUseManualCode,
    hostSession:srjHostSession,
    joinSession:srjJoinSession,
    retryPendingOperation:srjRetryPendingOperation,
    refreshSession:srjRefreshSession,
    revokeSession:srjRevokeSession,
    closeSession:srjCloseSession,
    forgetSession:srjForgetSession,
    openPanel:srjOpenPanel,
    closePanel:srjClosePanel,
    subscribe:srjSubscribe,
    getState:()=>srjState
  });
});
```


## FILE: js/startJoinViewModel.js
```javascript
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeStartJoinViewModel=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const CONFIRM=Object.freeze({
    abandon:"Abandon this Showdown? It closes the current Daniel vs Nik Showdown for both players. Abandoned Showdowns do not count toward career records.",
    startOver:"Delete the old Showdown and start over? This closes the old online Showdown for both players. Your player identity, registered device, Legacy history and app settings are kept.",
    discardStale:"Delete this old connection and start fresh? This closes the stale online connection and clears only its unfinished Showdown so Nik can join the new code Daniel creates.",
    revoke:"Revoke this open session code? The other player can no longer use it.",
    close:"Close this private session? Both players leave the session. Your Showdown is kept.",
    forget:"Forget this session code on this browser? Nothing online is changed."
  });
  const NAV_LOCK_TEXT="Finish this step first";
  const LOCKED_SCREENS=Object.freeze({transferChallenge:"transfer-window",seasonEntry:"season-entry",leagueWheelScreen:"setup",clubWheelScreen:"setup"});
  const sjScreenIds=Object.freeze(["mainMenu","createShowdown","leagueWheelScreen","clubWheelScreen","dashboard","transferChallenge","seasonEntry","seasonSummary","statistics","careerStatistics","trophyRoom","legacy","ruleBook"]);
  const sjPairingNames=Object.freeze(["createCode","join","copyCode","newCode","checkStatus","retry"]);
  const sjSessionNames=Object.freeze(["host","join","refresh","revoke","close","forget"]);

  function sjFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(sjFreeze);Object.freeze(value);}return value;}
  function sjUnavailable(){return {available:false,enabled:false,provider:null,args:null,confirm:null,confirmedByProvider:false};}
  function sjAction(available,busy,provider,args=null,confirm=null,confirmedByProvider=false,enabledRule=true){
    if(!available)return sjUnavailable();
    return {available:true,enabled:enabledRule&&!busy,provider,args,confirm,confirmedByProvider};
  }
  function sjViewerRole(identity,pair){
    if(pair.managerRole==="playerOne")return "daniel";
    if(pair.managerRole==="playerTwo")return "nik";
    return identity.managerId==="daniel"||identity.managerId==="nik"?identity.managerId:null;
  }
  function sjPairingState(pair,viewerRole){
    if(pair.connectionState==="active")return "paired";
    if(pair.connectionState==="pending-pair"&&pair.managerRole==="playerOne"){
      return pair.capability&&viewerRole==="daniel"?"code-created":"waiting-for-nik";
    }
    return "none";
  }
  function sjSessionFacts(session,nowEpochMs){
    const hasId=Boolean(session.sessionId);
    const expiredByClock=hasId&&Number.isFinite(session.expiresAtEpochMs)&&Number.isFinite(nowEpochMs)&&nowEpochMs>=session.expiresAtEpochMs;
    const nonterminal=hasId&&(session.sessionState==="open"||session.sessionState==="active")&&!expiredByClock;
    const blocksStart=nonterminal||Boolean(session.pendingAction)||session.sessionState==="unresolved";
    let state=null;
    if(hasId&&session.sessionState!=="unresolved"){
      if(expiredByClock)state="expired";
      else if(["open","active","revoked","closed","expired"].includes(session.sessionState))state=session.sessionState;
    }
    return {hasId,expiredByClock,nonterminal,blocksStart,state};
  }
  function sjBuildPairingActions({status,ready,retryMode,freshStart,pairingState,viewerRole,pair,busy}){
    const actions=Object.fromEntries(sjPairingNames.map(name=>[name,sjUnavailable()]));
    if(!ready)return actions;
    if(retryMode){
      actions.retry=sjAction(true,busy,"pair.retryPairLink");
      return actions;
    }
    if(freshStart&&viewerRole==="daniel")actions.createCode=sjAction(true,busy,"pair.startPairing",{managerRole:"playerOne"});
    if(freshStart&&viewerRole==="nik")actions.join=sjAction(true,busy,"pair.joinPairing",{managerRole:"playerTwo"});
    if(pairingState==="code-created"&&viewerRole==="daniel"){
      actions.copyCode=sjAction(true,false,"clipboard.pairingCode");
      actions.newCode=sjAction(true,busy,"pair.startPairing",{managerRole:"playerOne"});
    }
    if(pair.connectionState==="pending-pair")actions.checkStatus=sjAction(true,busy,"pair.initialize",{force:true});
    return actions;
  }
  function sjBuildSessionActions({sessionLayer,session,facts,busy}){
    const actions=Object.fromEntries(sjSessionNames.map(name=>[name,sjUnavailable()]));
    if(!sessionLayer)return actions;
    actions.host=sjAction(true,busy,"session.hostSession",null,null,false,!facts.blocksStart);
    actions.join=sjAction(true,busy,"session.joinSession",null,null,false,!facts.blocksStart);
    if(facts.hasId){
      actions.refresh=sjAction(true,busy,"session.refreshSession",null,null,false,!session.pendingAction);
      actions.revoke=sjAction(true,busy,"session.revokeSession",null,CONFIRM.revoke,false,!facts.expiredByClock&&!session.pendingAction&&session.sessionState==="open");
      actions.close=sjAction(true,busy,"session.closeSession",null,CONFIRM.close,false,!facts.expiredByClock&&!session.pendingAction&&session.sessionState==="active");
      actions.forget=sjAction(true,busy,"session.forgetSession",null,CONFIRM.forget,false,!session.pendingAction&&!facts.nonterminal&&session.sessionState!=="unresolved");
    }
    return actions;
  }
  function sjAbandonAction({ready,pair,viewerRole,busy}){
    if(!ready)return sjUnavailable();
    if(pair.status==="recovery-required"&&pair.connectionState==="active")return sjAction(true,busy,"pair.startOver",null,CONFIRM.startOver,true);
    const staleNik=pair.connectionState==="pending-pair"&&pair.managerRole==="playerTwo"&&viewerRole==="nik";
    if(staleNik)return sjAction(true,busy,"pair.discardStalePendingConnection",null,CONFIRM.discardStale,true);
    if(pair.connectionState==="active"||pair.connectionState==="pending-pair")return sjAction(true,busy,"pair.abandonCurrentShowdown",null,CONFIRM.abandon,false);
    return sjUnavailable();
  }
  function sjPrimaryActions({retryMode,recoveryRequired,staleNik,pairingState,sessionLayer,facts,freshStart,viewerRole}){
    if(retryMode)return ["pairing.retry"];
    if(recoveryRequired)return ["abandonShowdown"];
    if(staleNik)return ["abandonShowdown","pairing.checkStatus"];
    if(pairingState==="code-created")return ["pairing.copyCode","pairing.checkStatus"];
    if(pairingState==="waiting-for-nik")return ["pairing.checkStatus"];
    if(sessionLayer&&(facts.nonterminal||facts.pendingAction))return ["session.refresh"];
    if(sessionLayer)return ["session.host","session.join"];
    if(freshStart)return [viewerRole==="daniel"?"pairing.createCode":"pairing.join"];
    return [];
  }
  function buildStartJoinViewModel({identity={},pair={},session=null,nowEpochMs}={}){
    identity=identity&&typeof identity==="object"?identity:{};
    pair=pair&&typeof pair==="object"?pair:{};
    session=session&&typeof session==="object"?session:{};
    const viewerRole=sjViewerRole(identity,pair);
    const busy=Boolean(identity.busy||pair.busy||session.busy);
    let status;
    if(identity.status!=="ready"||identity.registered!==true||viewerRole===null||pair.status==="unavailable"||pair.status==="signed-out")status="unavailable";
    else if(pair.initialized!==true||pair.status==="idle")status="loading";
    else status="ready";
    const ready=status==="ready";
    const pairingState=ready?sjPairingState(pair,viewerRole):"none";
    const pairingCode=ready&&pairingState==="code-created"&&viewerRole==="daniel"?pair.capability:null;
    const retryMode=ready&&pair.status==="pair-link-retry";
    // A closed rivalry is no live pair (live productionSharedJourneyEntry.prepareFreshStart): a fresh Showdown may start.
    const freshStart=ready&&!retryMode&&(pair.connectionState==="closed"||pair.connectionState!=="active"&&pair.connectionState!=="pending-pair"&&["unpaired","save-required","error"].includes(pair.status));
    const sessionLayer=ready&&pairingState==="paired"&&pair.status==="paired";
    const facts=sjSessionFacts(session,nowEpochMs);
    facts.pendingAction=Boolean(session.pendingAction);
    const pairingActions=sjBuildPairingActions({status,ready,retryMode,freshStart,pairingState,viewerRole,pair,busy});
    const sessionActions=sjBuildSessionActions({sessionLayer,session,facts,busy});
    const recoveryRequired=ready&&pair.status==="recovery-required"&&pair.connectionState==="active";
    const staleNik=ready&&pair.connectionState==="pending-pair"&&pair.managerRole==="playerTwo"&&viewerRole==="nik";
    const abandonShowdown=sjAbandonAction({ready,pair,viewerRole,busy});
    const primaryActions=ready?sjPrimaryActions({retryMode,recoveryRequired,staleNik,pairingState,sessionLayer,facts,freshStart,viewerRole}):[];
    const moreActions=ready&&sessionLayer&&facts.hasId?["session.revoke","session.close","session.forget"]:[];
    return sjFreeze({
      status,
      viewerRole,
      busy,
      pairing:{state:pairingState,code:pairingCode,actions:pairingActions},
      session:{state:ready&&sessionLayer?facts.state:null,actions:sessionActions},
      abandonShowdown,
      primaryActions,
      moreActions
    });
  }
  function navLockState(activeScreen){
    if(activeScreen===null||sjScreenIds.includes(activeScreen)){
      const reason=activeScreen===null?null:LOCKED_SCREENS[activeScreen]||null;
      return sjFreeze({locked:reason!==null,reason});
    }
    throw new TypeError("NAV_SCREEN_UNKNOWN");
  }

  return sjFreeze({buildStartJoinViewModel,navLockState,CONFIRM,NAV_LOCK_TEXT,LOCKED_SCREENS,contractVersion:1});
});

```


## FILE: js/whichShowdownIsLive.js
```javascript
(function(root,factory){const api=factory(root);if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.CareerModeWhichShowdownIsLive=api;})(typeof globalThis!=="undefined"?globalThis:this,function(root){"use strict";
// r79: the one answer to "what does START do on this device?". decide() is pure; read() only gathers what the identity sidecar
// (syncPair, the same pair-link read as today; the memoised partner record and JOIN note), the remembered pair and the local
// Save Library already know. No new reads.
// Actions: continue (live game: open it) · resume-waiting (Daniel's code is out, or his seasons were chosen but no code yet) ·
// close-then-new (Daniel: this device's Showdown has ENDED but was never CLOSED; Nik's call 2026-10-17: close it through the
// final-screen terminal close, then choose seasons) · new (Daniel: choose seasons) · join (Nik: JOIN, a note's rivalry when one is known) · wait-for-daniel (Nik: an active partner, no unexpired note) ·
// pair-first (the connection itself needs attention first: no player, unreadable pair, recovery, stale code, link retry) ·
// pair-again (r79 PR4: partner unpaired).
// One device never decides the other's action: Nik never gets new or resume-waiting, Daniel never gets join.
const ACTIONS=Object.freeze(["continue","close-then-new","resume-waiting","new","join","wait-for-daniel","pair-first","pair-again"]),SEASONS=Object.freeze({1:1,3:3,5:5,a:10}),ROLE_BY_MANAGER=Object.freeze({daniel:"playerOne",nik:"playerTwo"});
const wslSave=v=>typeof v==="string"&&/^save_[0-9a-f]{24}$/.test(v);
const rid=v=>typeof v==="string"&&/^pair_[0-9a-f]{64}$/.test(v)?v:null;
function wslSeasonsOf(rivalryId){const id=rid(rivalryId);return id?SEASONS[id.charAt(5)]||null:null;}
function wslOut(action,rivalryId=null,totalSeasons=null,reason=action){return Object.freeze({action,rivalryId:rid(rivalryId),totalSeasons:[1,3,5,10].includes(Number(totalSeasons))?Number(totalSeasons):null,reason});}
function wslDecide(inputs={}){const role=inputs&&inputs.role,pair=inputs&&inputs.pair,shell=inputs&&inputs.shell||{},note=inputs&&inputs.note;
  if(role!=="playerOne"&&role!=="playerTwo")return wslOut("pair-first",null,null,"no-player");
  if(!pair||pair.initialized!==true||["idle","unavailable","signed-out"].includes(pair.status))return wslOut("pair-first",null,null,"pair-unknown");
  if(pair.status==="pair-link-retry")return wslOut("pair-first",pair.rivalryId,wslSeasonsOf(pair.rivalryId),"link-retry");
  const live=rid(pair.rivalryId);
  if(live&&pair.connectionState==="active"){if(pair.managerRole&&pair.managerRole!==role)return wslOut("pair-first",live,wslSeasonsOf(live),"identity-mismatch");if(pair.status==="paired"&&role==="playerOne"&&(inputs.ended===true||shell.completed===true&&wslSave(shell.saveId)&&shell.saveId===pair.providerSaveId))return wslOut("close-then-new",live,wslSeasonsOf(live),"ended-not-closed");return pair.status==="paired"?wslOut("continue",live,wslSeasonsOf(live)):wslOut("pair-first",live,wslSeasonsOf(live),"recovery");}
  if(live&&pair.connectionState==="pending-pair"){if(pair.managerRole==="playerOne"&&role==="playerOne")return wslOut("resume-waiting",live,wslSeasonsOf(live));return wslOut("pair-first",live,wslSeasonsOf(live),pair.managerRole==="playerTwo"?"stale-join":"identity-mismatch");}
  if(inputs.partnerSide==="unpaired")return wslOut("pair-again");
  // r79 PR3: Daniel's JOIN note counts only while unexpired and not the Showdown this account already joined or closed.
  if(role==="playerTwo"){const n=note&&rid(note.rivalryId)&&Number(note.expiresAtEpochMs)>Number(inputs.nowEpochMs)&&note.rivalryId!==pair.closedRivalryId&&note.rivalryId!==pair.rivalryId?note:null;if(n)return wslOut("join",n.rivalryId,n.totalSeasons||wslSeasonsOf(n.rivalryId),"note");return inputs.noteChecked===true?wslOut("wait-for-daniel"):wslOut("join",null,null,"paste-code");}
  // Daniel, nothing live: seasons already chosen on this browser (START tapped, no code yet) resume instead of a second shell,
  // unless THAT shell belonged to a Showdown that has since closed. A closed rivalry only counts against the save it was bound to
  // (PR #901 P1): an older closed Showdown must not turn a fresh, code-less shell into "new" and a second shell.
  const closedHere=Boolean(rid(pair.closedRivalryId)&&wslSave(pair.closedProviderSaveId)&&pair.closedProviderSaveId===shell.saveId);
  if(shell.pending===true&&shell.untouched===true&&[1,3,5,10].includes(Number(shell.totalSeasons))&&!closedHere)return wslOut("resume-waiting",null,shell.totalSeasons,"shell-without-code");
  return wslOut("new");}
function wslCachedShell(r=root){try{const runtime=r.CareerModeSaveLibraryRuntime;if(!runtime||typeof runtime.isReady!=="function"||runtime.isReady()!==true)return{pending:false};const lib=runtime.getLibrarySnapshot?.(),s=lib&&Array.isArray(lib.saves)?lib.saves.find(e=>e&&e.saveId===lib.activeSaveId)?.showdown:null;if(!s)return{pending:false};const saveId=wslSave(lib.activeSaveId)?lib.activeSaveId:null,completed=s.status==="Completed"||(Array.isArray(s.rounds)&&[1,3,5,10].includes(Number(s.totalRounds))&&s.rounds.length>=Number(s.totalRounds)),pending=s.sharedJourney?.mode==="shared"&&s.sharedJourney?.setupPending===true,untouched=!s.selectedLeague&&!s.clubs?.playerOne&&!s.clubs?.playerTwo&&!(Array.isArray(s.rounds)&&s.rounds.length);return{pending,untouched,totalSeasons:Number(s.totalRounds)||null,saveId,completed};}catch(_){return{pending:false};}}
// Ended: a shared Showdown's local save stays "Created" (the seasons live in the shared modules), so "ended" is what this page's
// own final reconciliation / terminal close already hold for the live rivalry. No read is made for it.
function wslEnded(r,id){if(!rid(id))return false;try{const t=r.CareerModeProductionSharedTerminalClose?.getState?.(),f=r.CareerModeProductionSharedFinalReconciliation?.getState?.();return Boolean(t&&t.rivalryId===id&&["READY","RECOVERY_PENDING","BLOCKED","CLOSED"].includes(t.phase)||f&&f.rivalryId===id&&f.phase==="FINAL_SEASON_RECONCILED");}catch(_){return false;}}
async function wslRead(r=root,options={}){const identity=r.CareerModeOnlinePlayerIdentity,id=identity?.getState?.(),role=id&&id.status==="ready"?ROLE_BY_MANAGER[id.managerId]||null:null;let pair=options.pair||null;if(!pair&&role&&typeof identity.syncPair==="function"){const first=await identity.syncPair();pair=!first||first.status==="unavailable"?await identity.syncPair():first;}const j=role==="playerTwo"&&r.CareerModePersistentNikDanielPair?.getJoinNoteState?.()||null;return Object.freeze({...wslDecide({role,pair,shell:wslCachedShell(r),ended:wslEnded(r,pair&&pair.rivalryId),note:j&&j.note,noteChecked:Boolean(j&&j.checked&&j.partnerActive),partnerSide:r.CareerModePersistentNikDanielPair?.getPartnerSideState?.()?.status,nowEpochMs:Date.now()}),pair:pair||null});}
return Object.freeze({contractVersion:1,actions:ACTIONS,decide:wslDecide,read:wslRead,cachedShell:wslCachedShell,seasonsOf:wslSeasonsOf});});

```


## FILE: js/productionSharedShowdownSetup.js
```javascript
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedShowdownSetup=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const PANEL_ID="productionSharedSetupOverlay";
  const CANONICAL_KEYS=Object.freeze([
    "careerModeShowdown.saveLibrary",
    "careerModeShowdown.legacyShowdowns",
    "careerModeShowdown.preferences"
  ]);
  const LENGTHS=Object.freeze([1,3,5,10]);
  const DEPENDENCIES=Object.freeze([
    ["production-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime],
    ["connected-account","js/sparkConnectedAccount.js",()=>root.CareerModeSparkConnectedAccount],
    ["private-pairing","js/sparkPrivatePairing.js",()=>root.CareerModeSparkPrivatePairing],
    ["connected-rivalry","js/sparkConnectedRivalry.js",()=>root.CareerModeSparkConnectedRivalry],
    ["remote-joining","js/sparkRemoteJoining.js",()=>root.CareerModeSparkRemoteJoining],
    ["shared-protocol","js/sharedShowdownSetup.js",()=>root.CareerModeSharedShowdownSetup],
    ["shared-catalog","js/sharedShowdownCatalog.js",()=>root.CareerModeSharedShowdownCatalog],
    ["spark-shared-setup","js/sparkSharedShowdownSetup.js",()=>root.CareerModeSparkSharedShowdownSetup],
    ["journey-conflicts","js/productionSharedJourneyConflicts.js",()=>root.CareerModeProductionSharedJourneyConflicts]
  ]);
  const scriptPromises=new Map();
  const listeners=new Set();
  let state=freeze({
    status:"idle",open:false,busy:false,ready:false,revision:0,phase:null,
    rivalryId:null,sessionId:null,accountId:null,deviceId:null,managerRole:null,remoteRole:null,
    setup:null,message:"Shared Setup is locked until the exact paired rivalry has an ACTIVE private session."
  });
  const INITIAL_STATE=state;

  function freeze(value){
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);Object.values(value).forEach(freeze);return value;
  }
  function fail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function revision(){
    if(!root.document)return "1.9.1-r3";
    const meta=root.document.querySelector('meta[name="app-asset-revision"]');
    return meta&&meta.content?meta.content.trim()||"1.9.1-r3":"1.9.1-r3";
  }
  function versionedUrl(path){
    if(!root.document||!root.location)return path;
    const url=new URL(path,root.document.baseURI||root.location.href);url.searchParams.set("v",revision());return url.href;
  }
  function loadScript(key,path,ready){
    const current=ready();if(current)return Promise.resolve(current);
    if(scriptPromises.has(key))return scriptPromises.get(key);
    if(!root.document)return Promise.reject(fail("SHARED_SETUP_DEPENDENCY_UNAVAILABLE"));
    const promise=new Promise((resolve,reject)=>{
      const script=root.document.createElement("script");script.src=versionedUrl(path);script.async=false;script.dataset.sharedSetupDependency=key;
      script.addEventListener("load",()=>{const api=ready();api?resolve(api):reject(Object.assign(new Error(`${path} did not expose its expected API.`),{code:"SHARED_SETUP_DEPENDENCY_UNAVAILABLE"}));},{once:true});
      script.addEventListener("error",()=>reject(Object.assign(new Error(`Unable to load ${path}.`),{code:"SHARED_SETUP_DEPENDENCY_UNAVAILABLE"})),{once:true});
      root.document.head.appendChild(script);
    }).finally(()=>scriptPromises.delete(key));
    scriptPromises.set(key,promise);return promise;
  }
  async function dependencies(){
    const resolved={};
    for(const [key,path,ready] of DEPENDENCIES)resolved[key]=await loadScript(key,path,ready);
    return Object.freeze(resolved);
  }
  function setState(next){
    state=freeze({...state,errorCode:"",...next});const view=currentState();for(const listener of listeners){try{listener(view);}catch(_error){}}render();return view;
  }
  function storageSnapshot(){
    if(typeof root.captureCareerModeRawBackupInputs!=="function")return null;
    const raw=root.captureCareerModeRawBackupInputs();
    return {
      [CANONICAL_KEYS[0]]:raw.saveLibrary,
      [CANONICAL_KEYS[1]]:raw.legacyShowdowns,
      [CANONICAL_KEYS[2]]:raw.preferences
    };
  }
  function assertStorageUnchanged(before){
    if(!before)return true;
    const after=storageSnapshot();
    if(!after)fail("SHARED_SETUP_STORAGE_AUTHORITY_UNAVAILABLE","Canonical storage authority became unavailable during Shared Setup.");
    for(const key of CANONICAL_KEYS){if(after[key]!==before[key])fail("SHARED_SETUP_LOCAL_SAVE_MUTATION","Shared Setup must never change a saved Showdown.");}
    return true;
  }
  function randomOperationId(){
    if(!root.crypto||typeof root.crypto.getRandomValues!=="function")fail("SHARED_SETUP_CRYPTO_UNAVAILABLE","Secure browser randomness is unavailable.");
    const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);
    return `setup_op_${Array.from(bytes,value=>value.toString(16).padStart(2,"0")).join("")}`;
  }
  function safeError(error,fallback){return error&&typeof error.code==="string"?error.code:fallback;}
  // BUG-1: players never see a raw error code. A real human message wins; otherwise known code families map to short plain text.
  // The code stays available as state.errorCode / data-error-code for diagnostics only.
  const PLAIN_STALE="Your partner just changed this. It's been refreshed, tap again.";
  const PLAIN_CONNECTION="That didn't go through. Check your connection and tap again.";
  const PLAIN_GENERIC="That didn't go through. Tap again.";
  function humanMessage(message,code){
    const text=String(message||"").trim();
    if(!text||text===code||!/\s/.test(text))return "";
    if(/^[A-Z0-9_\-\/ ]+$/.test(text)||/\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/.test(text)||/\(\w+\/[\w-]+\)|^firebase\b/i.test(text))return "";
    return text;
  }
  function describeFailure(source,fallbackCode){
    const input=typeof source==="string"?{code:source}:(source||{});
    const code=String(input.code||fallbackCode||"SHARED_SETUP_MUTATION_FAILED"),message=humanMessage(input.message,code);
    if(message)return Object.freeze({code,kind:"message",text:message,tapDetail:message});
    if(/STALE|REVISION|ALREADY|TRANSITION_INVALID|NOT_OPEN|_BUSY$/i.test(code))return Object.freeze({code,kind:"stale",text:PLAIN_STALE,tapDetail:PLAIN_STALE});
    if(/PERMISSION|DENIED|NETWORK|OFFLINE|TIMEOUT|DEADLINE|UNAVAILABLE|UNAUTH/i.test(code))return Object.freeze({code,kind:"connection",text:PLAIN_CONNECTION,tapDetail:"Check your connection and tap again."});
    return Object.freeze({code,kind:"generic",text:PLAIN_GENERIC,tapDetail:"Tap again."});
  }
  function failureState(source,fallbackCode){const failure=describeFailure(source,fallbackCode);return {errorCode:failure.code,message:failure.text};}
  function title(value){return String(value||"").replace(/_/g," ").replace(/\b\w/g,char=>char.toUpperCase());}

  async function resolveContext(){
    const deps=await dependencies();
    const runtime=deps["production-runtime"],account=deps["connected-account"],pairing=deps["private-pairing"],rivalry=deps["connected-rivalry"],remote=deps["remote-joining"],adapter=deps["spark-shared-setup"],conflicts=deps["journey-conflicts"];
    if(!runtime||typeof runtime.ensureAccountServices!=="function")fail("SHARED_SETUP_RUNTIME_UNAVAILABLE","Private Firebase runtime is unavailable.");
    if(!account||typeof account.initialize!=="function"||typeof account.getState!=="function")fail("SHARED_SETUP_ACCOUNT_UNAVAILABLE","Connected Account is unavailable.");
    await account.initialize();const accountState=account.getState();
    if(!accountState||accountState.connected!==true||!accountState.accountId)fail("SHARED_SETUP_AUTH_REQUIRED","Sign in with Google before setup.");
    if(!pairing||typeof pairing.initialize!=="function"||typeof pairing.getState!=="function")fail("SHARED_SETUP_DEVICE_UNAVAILABLE","Registered browser authority is unavailable.");
    await pairing.initialize();const pairingState=pairing.getState();
    if(!pairingState||pairingState.registered!==true||!pairingState.deviceId)fail("SHARED_SETUP_DEVICE_REQUIRED","Register this browser before Shared Setup.");
    if(!rivalry||typeof rivalry.initialize!=="function"||typeof rivalry.getState!=="function")fail("SHARED_SETUP_RIVALRY_UNAVAILABLE","Connected Rivalry authority is unavailable.");
    await rivalry.initialize();const rivalryState=rivalry.getState();
    if(!rivalryState||rivalryState.attached!==true||!rivalryState.rivalryId||!rivalryState.binding)fail("SHARED_SETUP_RIVALRY_REQUIRED","Attach the exact paired Connected Rivalry before Shared Setup.");
    const remoteState=remote&&typeof remote.getState==="function"?remote.getState():null;
    if(!remoteState||remoteState.sessionState!=="active"||!remoteState.sessionId||remoteState.pendingAction)fail("SHARED_SETUP_ACTIVE_SESSION_REQUIRED","Both players must be connected before league or club selection.");
    if(Number.isFinite(remoteState.expiresAtEpochMs)&&Date.now()>=remoteState.expiresAtEpochMs)fail("SHARED_SETUP_ACTIVE_SESSION_REQUIRED","The connection ended. Reconnect both players to carry on with setup.");
    if(remoteState.rivalryId!==rivalryState.rivalryId||remoteState.accountId!==accountState.accountId||remoteState.deviceId!==pairingState.deviceId)fail("SHARED_SETUP_AUTHORITY_MISMATCH","This connection no longer matches this Showdown. Reconnect both players.");
    if(rivalryState.accountId&&rivalryState.accountId!==accountState.accountId)fail("SHARED_SETUP_AUTHORITY_MISMATCH");
    if(rivalryState.deviceId&&rivalryState.deviceId!==pairingState.deviceId)fail("SHARED_SETUP_AUTHORITY_MISMATCH");
    const managerRole=rivalryState.binding.managerRole;
    if(managerRole!=="playerOne"&&managerRole!=="playerTwo")fail("SHARED_SETUP_BINDING_INVALID","The attached rivalry does not expose a valid manager role.");
    const remoteRole=remoteState.role;
    if(remoteRole!=="host"&&remoteRole!=="peer")fail("SHARED_SETUP_SESSION_ROLE_INVALID","This connection could not identify the host and joining player.");
    const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices());
    if(!services||services.ok!==true||!services.auth||!services.firestore||!services.firestoreSdk)fail("SHARED_SETUP_PROVIDER_UNAVAILABLE","Private Firebase services are unavailable.");
    const user=services.auth.currentUser;
    if(!user||user.uid!==accountState.accountId)fail("SHARED_SETUP_AUTH_MISMATCH","The current Google account no longer matches Connected Account authority.");
    if(!adapter||typeof adapter.read!=="function"||typeof adapter.mutate!=="function")fail("SHARED_SETUP_PROVIDER_UNAVAILABLE","Shared Setup transaction authority is unavailable.");
    if(!conflicts||typeof conflicts.execute!=="function")fail("JOURNEY_CONFLICT_GUARD_UNAVAILABLE","Shared Journey conflict guard is unavailable.");
    return Object.freeze({adapter,conflicts,services,user,rivalryId:rivalryState.rivalryId,saveId:rivalryState.binding.saveId||null,sessionId:remoteState.sessionId,accountId:user.uid,deviceId:pairingState.deviceId,managerRole,remoteRole});
  }
  function providerOptions(context){
    return {firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,user:context.user,rivalryId:context.rivalryId,sessionId:context.sessionId,deviceId:context.deviceId,nowEpochMs:Date.now(),cryptoImpl:root.crypto};
  }
  function accept(result,context,message){
    if(!result||result.ok!==true)fail(result&&result.code||"SHARED_SETUP_PROVIDER_FAILED");
    return setState({status:"ready",busy:false,ready:true,revision:result.revision||0,phase:result.state&&result.state.phase||null,rivalryId:context.rivalryId,saveId:context.saveId||null,sessionId:context.sessionId,accountId:context.accountId,deviceId:context.deviceId,managerRole:context.managerRole,remoteRole:context.remoteRole,setup:result.state||null,setupUpdatedAtMs:Number.isFinite(result.updatedAtMs)?result.updatedAtMs:null,message});
  }
  // r49: taps used to be dropped with SHARED_SETUP_BUSY whenever any module's background refresh was
  // in flight (every 2.5-15s), so the wheel/packs/confirm needed a second tap. Refreshes now coalesce,
  // a refresh during a write keeps the write's state, and a write waits for an in-flight refresh.
  function refreshWaitMs(){const value=Number(root.CMS_SETUP_REFRESH_WAIT_MS);return Number.isFinite(value)&&value>=100&&value<=20000?value:20000;}
  let refreshInFlight=null,refreshStartedAt=0,mutateInFlight=null,setupGeneration=0,heldReadFailure=false;
  const TRANSIENT_CONTEXT_CODES=Object.freeze(["SHARED_SETUP_PROVIDER_UNAVAILABLE","SHARED_SETUP_RIVALRY_REQUIRED"]);
  function heldSessionStillActive(){
    try{
      const remote=root.CareerModeSparkRemoteJoining?.getState?.(),expiry=Number(remote?.expiresAtEpochMs);
      return Boolean(remote&&remote.sessionState==="active"&&remote.sessionId&&remote.sessionId===state.sessionId&&remote.rivalryId===state.rivalryId&&remote.accountId===state.accountId&&remote.deviceId===state.deviceId&&!remote.pendingAction&&Number.isFinite(expiry)&&Date.now()<expiry);
    }catch(_error){return false;}
  }
  function boundedWait(promise){let timer=null;return Promise.race([promise.catch(()=>null),new Promise(resolve=>{timer=root.setTimeout?.(resolve,refreshWaitMs());})]).finally(()=>{if(timer!==null)root.clearTimeout?.(timer);});}
  function refresh(){
    // A refresh during a write resolves after the write publishes its accepted state.
    if(mutateInFlight)return mutateInFlight.then(currentState,currentState);
    // Coalesce concurrent refreshes, but never wait on one that has hung past the bound.
    if(refreshInFlight&&Date.now()-refreshStartedAt<refreshWaitMs())return refreshInFlight;
    refreshStartedAt=Date.now();
    const generation=++setupGeneration;
    const run=Promise.resolve().then(()=>refreshNow(generation)).finally(()=>{if(refreshInFlight===run)refreshInFlight=null;});refreshInFlight=run;return run;
  }
  async function refreshNow(generation=setupGeneration){
    const before=storageSnapshot();setState({status:"reading",busy:false,message:"Checking this Showdown's setup…"});
    let readReached=false;
    try{
      const context=await resolveContext();readReached=true;const result=await context.adapter.read(providerOptions(context));assertStorageUnchanged(before);
      if(generation!==setupGeneration)return currentState();
      if(!result||result.ok!==true)fail(result&&result.code||"SHARED_SETUP_READ_FAILED");
      const message=result.status==="empty"
        ? context.remoteRole==="host"?"Both players are here. Open the setup once for both.":"Both players are here. Waiting for Daniel to open the setup."
        : "Setup restored. Nothing was reset or redrawn.";
      heldReadFailure=false;return accept(result,context,message);
    }catch(error){
      try{assertStorageUnchanged(before);}catch(storageError){error=storageError;}
      if(generation!==setupGeneration)return currentState();
      // BH-7: a transient context failure (Connected Rivalry briefly unavailable, Firebase services not ready) is the one exception to "context failures never hold" below: it gets the same one-poll hold, only while the same private session is still exact-ACTIVE and unexpired.
      if(!readReached&&TRANSIENT_CONTEXT_CODES.includes(String(error&&error.code||""))&&!heldReadFailure&&state.ready===true&&state.setup&&state.setup.phase==="SHOWDOWN_CONFIRMED"&&heldSessionStillActive()){heldReadFailure=true;return setState({status:"ready",busy:false});}
      // A session that expired while the read was in flight is not held: marking the hold as already used makes the check below lock the Setup.
      if(readReached&&!heldSessionStillActive())heldReadFailure=true;
      // One failed provider read (network blip, a read racing the rival's write) keeps the confirmed Setup for one poll so every module gated on it does not go quiet; a repeat failure locks it.
      // Context failures (logout, detached pairing, expired session, account/device mismatch) and storage changes never hold: the exact ACTIVE prerequisite is gone.
      if(readReached&&!/^SHARED_SETUP_(LOCAL_SAVE_MUTATION|STORAGE_AUTHORITY_UNAVAILABLE)$/.test(String(error&&error.code||""))&&!heldReadFailure&&state.ready===true&&state.setup&&state.setup.phase==="SHOWDOWN_CONFIRMED"){heldReadFailure=true;return setState({status:"ready",busy:false});}
      heldReadFailure=false;
      return setState({status:"locked",busy:false,ready:false,...failureState(error,"SHARED_SETUP_UNAVAILABLE")});
    }
  }
  function mutate(type,extra={}){
    if(mutateInFlight)return Promise.resolve(Object.freeze({ok:false,code:"SHARED_SETUP_BUSY"}));
    const pendingRefresh=refreshInFlight;
    const run=(async()=>{if(pendingRefresh)await boundedWait(pendingRefresh);setupGeneration+=1;return mutateNow(type,extra);})();
    mutateInFlight=run;
    return run.finally(()=>{if(mutateInFlight===run)mutateInFlight=null;});
  }
  // Job 21: when both managers tap at once the loser's write is rejected by the Rules (permission-denied) or by the provider (stale
  // revision / already done). Re-read; if the refreshed Setup already shows this step, finish silently, else retry once with a fresh
  // revision and operation id. A real denial still surfaces after that one retry.
  const RACE_CODES=Object.freeze(["permission-denied","firestore/permission-denied","permission_denied","SETUP_STALE_BASE_REVISION","SETUP_ALREADY_OPEN","SETUP_ALREADY_CONFIRMED","SETUP_TRANSITION_INVALID","SETUP_NOT_OPEN"]);
  function stepAlreadyShown(type,result,role,extra={}){
    const setup=result&&result.state;if(!setup)return false;
    if(type==="open")return true;
    if(type==="commit-league")return Boolean(setup.leagueId);
    if(type==="commit-clubs")return Boolean(setup.clubs);
    if(type==="commit-length")return Boolean(setup.totalSeasons)&&setup.totalSeasons===extra.totalSeasons;
    if(type==="confirm")return Array.isArray(setup.confirmedRoles)&&setup.confirmedRoles.includes(role);
    return false;
  }
  async function mutateNow(type,extra={}){
    const before=storageSnapshot();setState({status:`writing-${type}`,busy:true,message:"Saving this step…"});
    try{
      const context=await resolveContext();assertShellSave(context);
      if(type==="open"&&context.remoteRole!=="host")fail("SHARED_SETUP_HOST_REQUIRED","Only the host can open the setup.");
      for(let attempt=0;;attempt+=1){
        const current=await context.adapter.read(providerOptions(context));
        if(!current||current.ok!==true)fail(current&&current.code||"SHARED_SETUP_READ_FAILED");
        if(attempt>0&&stepAlreadyShown(type,current,context.managerRole,extra)){assertStorageUnchanged(before);return accept(current,context,"Both managers now have the same setup.");}
        const operationId=randomOperationId(),baseRevision=current.revision||0;
        assertShellSave(context);const providerRequest={...providerOptions(context),type,operationId,baseRevision,...extra};
        let result;
        try{result=await context.conflicts.execute({surface:"shared-setup",action:type,operationId,baseRevision,authority:{accountId:context.accountId,deviceId:context.deviceId,rivalryId:context.rivalryId,sessionId:context.sessionId,managerRole:context.managerRole},intent:type==="commit-length"?{totalSeasons:extra.totalSeasons}:{}},()=>{assertShellSave(context);return context.adapter.mutate(providerRequest);});}
        catch(error){if(attempt===0&&RACE_CODES.includes(safeError(error,""))){continue;}throw error;}
        assertStorageUnchanged(before);
        if(result&&result.ok!==true&&attempt===0&&RACE_CODES.includes(result.code))continue;
        if(!result||result.ok!==true)fail(result&&result.code||"SHARED_SETUP_MUTATION_FAILED");
        return accept(result,context,result.replayed?"Your last step was recovered. Nothing was drawn twice.":"Both managers now have the same setup.");
      }
    }catch(error){
      try{assertStorageUnchanged(before);}catch(storageError){error=storageError;}
      const failure=describeFailure(error,"SHARED_SETUP_MUTATION_FAILED");
      setState({status:"error",busy:false,errorCode:failure.code,message:failure.text});
      return Object.freeze({ok:false,code:failure.code,message:failure.kind==="message"?failure.text:""});
    }
  }
  function create(tag,className,text){const element=root.document.createElement(tag);if(className)element.className=className;if(text!==undefined)element.textContent=String(text);return element;}
  // r78 (HO-029): the one main action of each step wears Team V's gold button (.r78-btn--primary); the rest are gold outlines.
  function action(label,handler,disabled=false,primary=false){const button=create("button",primary?"compactButton r78-btn--primary":"compactButton",label);button.type="button";button.disabled=disabled;button.addEventListener("click",handler);return button;}
  function renderSetup(body){
    const setup=state.setup;
    const summary=create("section","remoteJoiningCurrent");summary.append(create("span","remoteJoiningEyebrow","SHARED SETUP"));
    if(!setup){
      summary.append(create("strong","remoteJoiningState","EMPTY · REV 0"),create("p","remoteJoiningMeta","Both players are connected. No league or club has been drawn yet."));
      const actions=create("div","remoteJoiningActions");
      if(state.ready&&state.remoteRole==="host")actions.append(action("OPEN SETUP",()=>void mutate("open"),state.busy,true));
      else if(state.ready)summary.append(create("p","remoteJoiningMeta","Waiting for Daniel to open the setup."));
      actions.append(action("REFRESH",()=>void refresh(),state.busy));summary.append(actions);body.append(summary);return;
    }
    summary.append(create("strong","remoteJoiningState",`${setup.phase} · REV ${setup.revision}`));
    const facts=create("div","settingsInfoGrid");
    const rows=[
      ["COORDINATOR",title(setup.coordinatorRole)],
      ["LEAGUE",setup.leagueId?title(setup.leagueId):"Not drawn"],
      ["PLAYER ONE CLUB",setup.clubs?setup.clubs.playerOne:"Not drawn"],
      ["PLAYER TWO CLUB",setup.clubs?setup.clubs.playerTwo:"Not drawn"],
      ["SEASONS",setup.totalSeasons||"Not committed"],
      ["CONFIRMED",setup.confirmedRoles&&setup.confirmedRoles.length?setup.confirmedRoles.map(title).join(" + "):"None"]
    ];
    for(const [label,value] of rows){const row=create("div","settingsInfoRow");row.append(create("span","",label),create("strong","",value));facts.append(row);}summary.append(facts);
    const actions=create("div","remoteJoiningActions");
    const coordinator=state.managerRole===setup.coordinatorRole;
    if(setup.phase==="SHARED_SETUP_OPEN"&&coordinator)actions.append(action("DRAW LEAGUE",()=>void mutate("commit-league"),state.busy,true));
    if(setup.phase==="LEAGUE_WHEEL_COMMITTED"&&coordinator)actions.append(action("DRAW CLUBS",()=>void mutate("commit-clubs"),state.busy,true));
    if(setup.phase==="CLUB_ASSIGNMENTS_COMMITTED"&&coordinator){
      for(const seasons of LENGTHS)actions.append(action(`${seasons} SEASON${seasons===1?"":"S"}`,()=>void mutate("commit-length",{totalSeasons:seasons}),state.busy));
    }
    if(setup.phase==="SEASON_LENGTH_COMMITTED"&&state.managerRole&&!setup.confirmedRoles.includes(state.managerRole))actions.append(action("CONFIRM SETUP",()=>void mutate("confirm"),state.busy,true));
    actions.append(action("REFRESH",()=>void refresh(),state.busy));summary.append(actions);body.append(summary);
  }
  function render(){
    if(!root.document)return null;const view=currentState();const overlay=root.document.getElementById(PANEL_ID);if(!overlay)return null;
    const body=overlay.querySelector(".remoteJoiningBody");if(!body)return overlay;body.replaceChildren();
    body.append(create("span","remoteJoiningEyebrow","BOTH PLAYERS CONNECTED"),create("h2","","SHOWDOWN SETUP"),create("p","","One league, two different clubs from it, and 1, 3, 5 or 10 seasons. Reconnecting picks up where you left off."));
    if(view.ready)renderSetup(body);else{
      const locked=create("section","remoteJoiningCurrent");locked.append(create("strong","remoteJoiningState","LOCKED"),create("p","remoteJoiningMeta",view.message));locked.append(action("CHECK CONNECTION",()=>void refresh(),state.busy));body.append(locked);
    }
    const note=create("p","remoteJoiningStatus",view.message);if(view.errorCode&&(view.status==="error"||view.status==="locked"))note.setAttribute("data-error-code",view.errorCode);note.setAttribute("role","status");note.setAttribute("aria-live","polite");body.append(note);return overlay;
  }
  async function openPanel(){
    if(!root.document)return false;let overlay=root.document.getElementById(PANEL_ID);
    if(!overlay){overlay=create("div","remoteJoiningOverlay");overlay.id=PANEL_ID;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label","Shared Showdown Setup");const shell=create("div","remoteJoiningShell");const header=create("div","remoteJoiningHeader");header.append(create("strong","","CAREER MODE SHOWDOWN // 17"));const dismiss=create("button","remoteJoiningDismiss","×");dismiss.type="button";dismiss.setAttribute("aria-label","Close Showdown Setup");dismiss.addEventListener("click",closePanel);header.append(dismiss);const body=create("div","remoteJoiningBody");shell.append(header,body);overlay.append(shell);root.document.body.append(overlay);}
    overlay.classList.remove("hidden");setState({open:true});await refresh();const focusTarget=overlay.querySelector("button");if(focusTarget&&typeof focusTarget.focus==="function")focusTarget.focus();return true;
  }
  function closePanel(){const overlay=root.document&&root.document.getElementById(PANEL_ID);if(overlay)overlay.classList.add("hidden");state=freeze({...state,open:false});return true;}
  function subscribe(listener){if(typeof listener!=="function")return()=>{};listeners.add(listener);return()=>listeners.delete(listener);}
  // r80: the Setup held in page memory belongs to the save it was read for. After END SHOWDOWN, START (or Nik's JOIN) opens
  // a new save shell before anything re-reads this Setup, so it still holds the ended Showdown's confirmed Setup. The shared
  // modules take the rivalry from it while the shell's marker names none (Multi Season, Season Results, Transfer Challenge,
  // Season Commit, History, Scoring, Final, Terminal Close), so the new Showdown ran on the ended one: Nik's new 3-season
  // Showdown resumed the ended one's season 2 and read "Season 2 / 3". Another save's Setup is not this Showdown's: every public
  // read (getState, refresh's result, what subscribers are handed, the panel) shows the locked start state instead until a
  // refresh reads this save's own Setup. A write refuses a context bound to another save, checked again right before the
  // provider write (the conflict preflight before it awaits, and END or JOIN can switch the shell meanwhile).
  function shellSaveId(){try{const showdown=typeof currentShowdown!=="undefined"?currentShowdown:null;return String(showdown?.identity?.saveId||"").trim();}catch(_error){return "";}}
  // Nik's JOIN can reuse the ended Showdown's own save shell (it never left setupPending), so the save alone does not tell the
  // Showdowns apart there: once the persistent pair names another rivalry (Daniel started the next Showdown), the Setup of the
  // ended one is dropped the same way. A pair that names no rivalry is not judged.
  function pairRivalryId(){try{return String(root.CareerModePersistentNikDanielPair?.getState?.()?.rivalryId||"").trim();}catch(_error){return "";}}
  function otherShowdown(saveId,rivalryId){const shellSave=shellSaveId(),pairRivalry=pairRivalryId();return Boolean((saveId&&shellSave&&saveId!==shellSave)||(rivalryId&&pairRivalry&&String(rivalryId)!==pairRivalry));}
  const OTHER_SHOWDOWN_OPEN=freeze({...INITIAL_STATE,open:true});
  function currentState(){return otherShowdown(state.saveId,state.rivalryId)?(state.open?OTHER_SHOWDOWN_OPEN:INITIAL_STATE):state;}
  function assertShellSave(context){if(otherShowdown(context.saveId,context.rivalryId))fail("SHARED_SETUP_AUTHORITY_MISMATCH","This connection no longer matches this Showdown. Reconnect both players.");}

  return freeze({
    contractVersion:1,
    feature:"ssjr-production-paired-first-shared-setup",
    productionEnabled:true,
    productionRulesRequired:true,
    providerPath:"rivalries/{rivalryId}/sharedSetup/authoritative",
    pairingRequired:true,
    exactActiveSessionRequired:true,
    freshActiveSessionResumes:true,
    deterministicRepositoryCatalog:true,
    directLeagueClubInput:false,
    canonicalStorageMutation:false,
    canonicalStorageKeys:CANONICAL_KEYS,
    billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,appCheckEnforcementRequired:false,persistentFirestoreCache:false,
    refresh,mutate,openPanel,closePanel,subscribe,describeFailure,getState:currentState
  });
});
```


## FILE: js/showdownModes.js
```javascript
(function(root,factory){const api=factory(root);if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.CareerModeShowdownModes=api;})(typeof globalThis!=="undefined"?globalThis:this,function(root){"use strict";
// Real-only play. The marker still preserves the account's historic exclusion boundary.
// Pair/marker reads stay lazy and memoised; no timers or polling.
const MESSAGE_ID="cmsSeasonsStartMessage",SETTINGS_ID="cmsModeSettings";
const LABELS=Object.freeze({daniel:"Daniel",nik:"Nik"});
let installed=false,busy=false,settingsMessage="",settingsTone="",settingsMessageWhileLive=false,seasonsMessage="",markerView=Object.freeze({status:"unknown",accountId:null}),markerPromise=null;
const smDoc=()=>root.document||null;
function smIdentity(){try{const s=root.CareerModeOnlinePlayerIdentity?.getState?.();return s&&s.status==="ready"&&s.registered&&s.accountId&&LABELS[s.managerId]?s:null;}catch(_){return null;}}
const smPair=()=>root.CareerModePersistentNikDanielPair||null;
const smOther=managerId=>managerId==="daniel"?"Nik":"Daniel";
// Pure: the mode and the pairing row from what the page already knows.
function smDecideMode({accountId,partner,side,marker}={}){
  const mine=partner&&partner.accountId===accountId&&partner.status==="ready"?partner.record:null;
  const markerKnown=marker&&marker.accountId===accountId?marker.status:"unknown";
  // Any partner record of this account, even one turned off by UNPAIR, proves the marker (the Rules need it to write one).
  const mode=mine||markerKnown==="ready"||markerKnown==="none"?"real":"unknown";
  const careerStarted=mine||markerKnown==="ready"?true:markerKnown==="none"?false:null;
  let pairing=null;
  if(mode==="real"){
    if(mine&&mine.active===true)pairing=side&&side.accountId===accountId&&side.status==="unpaired"?"partner-unpaired":"paired";
    else pairing=partner&&partner.accountId===accountId&&(partner.status==="none"||partner.status==="ready")?"unpaired":"unknown";
  }
  return Object.freeze({mode,pairing,careerStarted});
}
function smView(){
  const id=smIdentity();if(!id)return Object.freeze({mode:"none",pairing:null,managerId:null,partnerLabel:null});
  const pair=smPair(),decided=smDecideMode({accountId:id.accountId,partner:pair?.getPartnerState?.()||null,side:pair?.getPartnerSideState?.()||null,marker:markerView});
  return Object.freeze({...decided,managerId:id.managerId,partnerLabel:smOther(id.managerId)});
}
function smLiveShowdown(){try{const p=smPair()?.getState?.();return Boolean(p&&p.rivalryId&&(p.connectionState==="active"||p.connectionState==="pending-pair"));}catch(_){return false;}}
async function smLoad(key,path,ready){if(ready())return ready();if(typeof root.loadRuntimeScript!=="function")throw new Error("The career service is unavailable.");await root.loadRuntimeScript(key,path,()=>Boolean(ready()));return ready();}
// The marker memo for this account (one exact get per page in js/careerStartMarker.js). A failed read is kept as
// "unavailable" here and asked again only on the next user action (Settings, START).
function smReadMarker(accountId,options={}){
  if(options.fresh!==true&&markerView.accountId===accountId&&(markerView.status==="ready"||markerView.status==="none"))return Promise.resolve(markerView);
  if(markerPromise&&markerPromise.accountId===accountId)return markerPromise.promise;
  const promise=(async()=>{try{const api=await smLoad("career-start-marker","js/careerStartMarker.js",()=>root.CareerModeCareerStartMarker);/* Codex #908: fresh asks the server again (another browser of this account may have started the real career) */if(options.fresh===true)api.clearCache?.();const marker=await api.readCurrentMarker();/* only a real answer decides: an unknown marker is unavailable */markerView=Object.freeze({status:marker&&(marker.status==="ready"||marker.status==="none")?marker.status:"unavailable",accountId});}catch(_){markerView=Object.freeze({status:"unavailable",accountId});}return markerView;})().finally(()=>{if(markerPromise&&markerPromise.promise===promise)markerPromise=null;});
  markerPromise={accountId,promise};return promise;
}
// Page load, Settings open and START ask the same memoised questions; nothing here reads twice.
async function smResolve(){
  const id=smIdentity();if(!id)return smView();
  const pair=smPair();
  if(pair&&typeof pair.readPartnerRecord==="function"){const partner=await pair.readPartnerRecord();if(partner&&partner.accountId===id.accountId&&partner.status==="ready"&&partner.record){if(partner.record.active===true)await pair.readPartnerSide?.();smRefresh();return smView();}}
  await smReadMarker(id.accountId);smRefresh();return smView();
}

// ---------- Settings: the ACCOUNT panel's mode rows (the identity panel's own grid and action row, so its marble look) ----------
function smEl(tag,className,text){const e=smDoc().createElement(tag);if(className)e.className=className;if(text!=null)e.textContent=String(text);return e;}
function smInfoRow(label,value,mode){const row=smEl("div","settingsInfoRow"),a=smEl("span","",label),v=smEl("strong","",value);row.dataset.modeRow=mode;row.append(a,v);return row;}
function smButton(text,fn,className="menuButton"){const b=smEl("button",className,text);b.type="button";b.disabled=busy;b.dataset.modeRow="action";b.addEventListener("click",fn);return b;}
// Gallery #5/#6: UNPAIR is refused while a Showdown is being played, so the note says so on both managers' pages before any
// tap, and the refusal (kept only while that Showdown is live) goes away by itself once it is finished or deleted.
function smUnpairBlocked(){try{return smPair()?.getState?.()?.connectionState==="active";}catch(_){return false;}}
function smMessage(){if(settingsMessageWhileLive&&!smLiveShowdown()){settingsMessage="";settingsTone="";settingsMessageWhileLive=false;}return settingsMessage;}
function smSignature(){const v=smView();return [v.mode,v.pairing,busy,smMessage(),settingsTone,smUnpairBlocked()].join("|");}
function smDecorateSettingsPanel(panel){
  if(!panel||!smDoc())return panel;
  const v=smView(),grid=panel.querySelector(".settingsInfoGrid"),actions=panel.querySelector(".settingsConnectedAccountActions");
  panel.querySelectorAll("[data-mode-row]").forEach(n=>n.remove());panel.querySelector(`#${SETTINGS_ID}`)?.remove();
  panel.dataset.showdownMode=v.mode;if(v.mode==="none"||!grid||!actions)return panel;
  // Polish pass (r87): test mode is gone (r83), so this row says where the career lives instead of naming a mode.
  const modeText=v.mode==="real"?"Saved online for both of you":"Checking your career…";
  grid.append(smInfoRow("CAREER",modeText,"mode"));
  if(v.mode==="real"){
    const partnerText=v.pairing==="paired"?`Paired with ${v.partnerLabel}`:v.pairing==="partner-unpaired"?`${v.partnerLabel} is no longer paired with you`:v.pairing==="unpaired"?"Not paired":"Checking…";
    grid.append(smInfoRow("PARTNER",partnerText,"partner"));
    if(v.pairing==="paired")actions.append(smButton("UNPAIR",()=>void smUnpairFromSettings(),"menuButton settingsUnpairButton"));
    else if(v.pairing==="partner-unpaired")actions.append(smButton("PAIR AGAIN",()=>void smPairAgainFromSettings(),"menuButton settingsPairAgainButton"));
    else if(v.pairing==="unpaired")actions.append(smButton(`PAIR WITH ${v.partnerLabel.toUpperCase()}`,()=>void smPairWithFromSettings(),"menuButton settingsPairWithButton"));
  }
  const note=smEl("p","settingsOfflineNote settingsModeNote",smMessage()||(v.mode==="real"?(v.pairing==="paired"&&smUnpairBlocked()?RULE:"Every finished Showdown counts in your career."):""));
  note.id=SETTINGS_ID;note.setAttribute("role","status");note.setAttribute("aria-live","polite");if(settingsTone)note.dataset.tone=settingsTone;
  if(note.textContent)actions.after(note);
  return panel;
}
function smSetSettingsMessage(text,tone="",whileLive=false){settingsMessage=text||"";settingsTone=tone;settingsMessageWhileLive=Boolean(text)&&whileLive;smRefresh();}
function smAskConfirm(message,tone){return typeof root.askShowdownConfirm==="function"?root.askShowdownConfirm(message,{tone}):typeof root.loadRuntimeScript==="function"?root.loadRuntimeScript("showdown-confirm","js/showdownConfirm.js",()=>typeof root.askShowdownConfirm==="function").then(()=>root.askShowdownConfirm(message,{tone}),()=>false):Promise.resolve(undefined);}
const RULE="Finish or end the current Showdown before you unpair.",BLOCKED=`${RULE} Nothing was changed.`;
function smPlain(error){return error&&error.code==="PERMANENT_PARTNER_UNPAIR_BLOCKED"?BLOCKED:`Nothing was changed. ${error&&error.message?error.message:"Try again."}`;}
// UNPAIR: a Showdown that is being played is caught here without a read; the pair module's unpair() is the fail-closed check
// (an ACTIVE rivalry, or a pending one whose code is still open, refuses inside its transaction).
async function smRunUnpair(){
  const pair=smPair();if(!pair||typeof pair.unpair!=="function")throw new Error("The connection service is unavailable.");
  try{if(pair.getState?.()?.connectionState==="active"&&pair.getState().rivalryId)return{ok:false,blocked:true};await pair.unpair();return{ok:true};}
  catch(error){return{ok:false,blocked:error&&error.code==="PERMANENT_PARTNER_UNPAIR_BLOCKED",error};}
}
async function smUnpairFromSettings(){
  if(busy)return false;const v=smView();
  if(smUnpairBlocked()){smSetSettingsMessage(BLOCKED,"error",true);return false;}
  const ok=await smAskConfirm(`Unpair from ${v.partnerLabel}? Your Showdowns stay saved. To play again you pair again with a new code.`,"danger");
  if(ok!==true)return false;
  busy=true;smSetSettingsMessage("Unpairing…");
  const result=await smRunUnpair();busy=false;
  smSetSettingsMessage(result.ok?`Unpaired from ${v.partnerLabel}.`:result.blocked?BLOCKED:smPlain(result.error),result.ok?"success":"error",!result.ok&&result.blocked);
  return result.ok;
}
// PAIR AGAIN: this account's own stale record goes inactive (the same fail-closed unpair), then the existing first real pairing.
async function smUnpairForPairAgain(){
  if(busy)return Object.freeze({ok:false,message:"Unpairing is already in progress."});busy=true;smRefresh();
  const result=await smRunUnpair();busy=false;
  if(!result.ok){const message=result.blocked?BLOCKED:smPlain(result.error);smSetSettingsMessage(message,"error",result.blocked);return Object.freeze({ok:false,message});}
  settingsMessage="";settingsMessageWhileLive=false;smRefresh();return Object.freeze({ok:true});
}
async function smPairAgainFromSettings(){const result=await smUnpairForPairAgain();if(!result||result.ok!==true)return false;return smPairWithFromSettings();}
async function smPairWithFromSettings(){root.closeSettings?.(false);const identity=root.CareerModeOnlinePlayerIdentity;if(smView().managerId==="nik")return identity?.openJoin?.();return identity?.openStart?.();}
// START has one path; only a recoverable failure adds a message to the seasons screen.
function smRenderSeasons(){
  const d=smDoc();if(!d)return;const box=d.querySelector("#createShowdown .setupBox"),start=d.getElementById("startShowdown");if(!box||!start)return;
  let message=d.getElementById(MESSAGE_ID);
  if(!message&&seasonsMessage){message=smEl("p","stateNote cmsSeasonsStartMessage");message.id=MESSAGE_ID;message.setAttribute("role","status");message.setAttribute("aria-live","polite");start.before(message);}
  if(message){if(message.textContent!==seasonsMessage)message.textContent=seasonsMessage;message.hidden=!seasonsMessage;}
}
function smSetSeasonsMessage(text){seasonsMessage=text||"";smRenderSeasons();}
// The seasons START asks this before any shell is made (js/productionSharedJourneyEntry.js, once whichShowdownIsLive says new).
async function smBeforeSeasonsStart(){
  const id=smIdentity();if(!id||id.managerId!=="daniel")return true;
  smSetSeasonsMessage("");
  const v=await smResolve();
  if(v.careerStarted===true)return true;
  if(v.careerStarted!==false){smSetSeasonsMessage("Your career could not be checked. Check your connection, then press START again.");return false;}
  // A leftover markerless code predates real-only play. Close it before the marker can name it.
  const pending=smPair()?.getState?.();
  if(pending&&pending.connectionState==="pending-pair"&&pending.managerRole==="playerOne"&&pending.rivalryId){
    const fresh=await smReadMarker(id.accountId,{fresh:true});
    if(fresh.status!=="none"){smRefresh();smSetSeasonsMessage(fresh.status==="ready"?"Your real career has started on another device. Press START again.":"Your career could not be checked. Check your connection, then press START again.");return false;}
    try{const closed=await smPair().closeUnjoinedCode({expectedRivalryId:pending.rivalryId});if(!closed||closed.ok!==true)throw new Error("Your earlier code could not be closed.");}
    catch(error){smSetSeasonsMessage(`Your real career could not be started. ${error&&error.message?error.message:"Try again."}`);smRefresh();return false;}
  }
  try{
    const api=await smLoad("career-start-marker","js/careerStartMarker.js",()=>root.CareerModeCareerStartMarker);
    const marker=await api.startRealCareer();
    markerView=Object.freeze({status:marker&&marker.status==="ready"?"ready":"none",accountId:id.accountId});
    if(markerView.status!=="ready")throw new Error("Try again.");
  }catch(error){smSetSeasonsMessage(`Your real career could not be started. ${error&&error.message?error.message:"Try again."}`);smRefresh();return false;}
  smRefresh();return true;
}

function smRefresh(){
  try{smRenderSeasons();}catch(_){}
  try{root.CareerModeOnlinePlayerIdentity?.refreshBadge?.();}catch(_){}
  /* r80 resume (Home item 5): Home's START tile and season chip follow the mode, which can be learnt after Home was drawn */
  try{root.CareerModeOnlinePlayerIdentity?.refreshHome?.();}catch(_){}
  try{root.CareerModeOnlinePlayerIdentity?.renderSettings?.();}catch(_){}
}
function smInstall(){
  if(installed)return api;installed=true;
  const d=smDoc();
  if(d&&d.addEventListener)d.addEventListener("career-mode-screen-shown",event=>{const screen=event&&event.detail&&event.detail.screen;if(seasonsMessage&&screen!=="createShowdown")seasonsMessage="";smRefresh();});
  try{smPair()?.subscribe?.(()=>smRefresh());}catch(_){}
  if(root.addEventListener){root.addEventListener("career-mode-permanent-pair-change",()=>smRefresh());root.addEventListener("career-mode-career-start-change",event=>{const s=event&&event.detail;if(s&&s.accountId&&s.status)markerView=Object.freeze({status:s.status==="ready"?"ready":"none",accountId:s.accountId});smRefresh();});}
  smRefresh();return api;
}
const api=Object.freeze({contractVersion:1,feature:"real-career-pairing",install:smInstall,resolve:smResolve,decideMode:smDecideMode,getView:smView,signature:smSignature,decorateSettingsPanel:smDecorateSettingsPanel,beforeSeasonsStart:smBeforeSeasonsStart,unpairForPairAgain:smUnpairForPairAgain,unpairFromSettings:smUnpairFromSettings,pairAgainFromSettings:smPairAgainFromSettings,pairWithFromSettings:smPairWithFromSettings,renderSeasons:smRenderSeasons});
return api;});

```


## FILE: firestore.shared-setup-production.fragment.rules
```text
// SSJR_SHARED_SETUP_FUNCTIONS_BEGIN
    function ssjrValidRivalryId(value) { return value is string && value.matches('^pair_[0-9a-f]{64}$'); }
    function ssjrValidDeviceId(value) { return value is string && value.matches('^device_[0-9a-f]{32}$'); }
    function ssjrValidOperationId(value) { return value is string && value.matches('^setup_op_[0-9a-f]{32}$'); }
    function ssjrRivalryData(rivalryId) { return get(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data; }
    function ssjrExactPairedRivalry(rivalryId) {
      let root = get(/databases/$(database)/documents/rivalries/$(rivalryId));
      let data = root.data.data;
      return ssjrValidRivalryId(rivalryId)
        && root.data.objectType == 'rivalry'
        && root.data.objectId == rivalryId
        && root.data.lifecycleState == 'live'
        && data.connectionState == 'active'
        && data.authorizedAccountIds is list
        && data.authorizedAccountIds.size() == 2
        && data.authorizedAccountIds[0] != data.authorizedAccountIds[1]
        && data.managerSlots is list
        && data.managerSlots.size() == 2
        && data.managerSlots[0].slotId == 'playerOne'
        && data.managerSlots[1].slotId == 'playerTwo'
        && data.managerSlots[0].accountId != data.managerSlots[1].accountId
        && validProfileId(data.managerSlots[0].profileId)
        && validProfileId(data.managerSlots[1].profileId)
        && validSaveId(data.managerSlots[0].saveId)
        && validSaveId(data.managerSlots[1].saveId)
        && data.managerSlots[0].entitlementState == 'active'
        && data.managerSlots[1].entitlementState == 'active'
        && data.managerSlots[0].accountId in data.authorizedAccountIds
        && data.managerSlots[1].accountId in data.authorizedAccountIds
        && activeAccount(data.managerSlots[0].accountId)
        && activeAccount(data.managerSlots[1].accountId);
    }
    // r84 trim: a shared read needs only the live paired rivalry that lists the signed-in account (one lookup). The two
    // account documents are not looked up again: no client can change their status (account update is denied) and the Spark
    // app ships no account deletion flow; Session start and Shared Setup open still check both (lazy enforcement).
    function ssjrEntitled(rivalryId) {
      return ssjrValidRivalryId(rivalryId) && livePairedRivalryMember(rivalryId);
    }
    function ssjrActorRole(rivalryId) {
      return ssjrRivalryData(rivalryId).managerSlots[0].accountId == request.auth.uid ? 'playerOne' : 'playerTwo';
    }

    // Shared write authority is evaluated once per write. Only the exact
    // account/device/rivalry/session facts required by these namespaced ledgers are
    // rechecked so the production Rules remain under Firestore's expression ceiling.
    // Audit R84 F01/F02 (r85): every shared write looks up four documents: the rivalry, the named Session, the ACTING account
    // and the acting device. The r84 trim (rivalry + session only) let a deletion-pending account, or a revoked or
    // unregistered device, keep writing through a direct request. The partner account is not looked up on every write (no
    // client can change account status and the app ships no deletion flow; both accounts are checked at Session start and
    // Shared Setup open). Reads stay membership-only (ssjrEntitled), by decision: a lookup on every listener read would cost
    // hundreds of billed reads a season on the Spark limit.
    // ssjrActorWriteAuthorityValid holds the actor/Session/device/account facts. Season Commit calls it directly because its
    // create validator already sits near the 1,000-expression ceiling; every other shared write calls ssjrWriteAuthorityValid,
    // which adds the manager-pair shape checks on the same rivalry document (no extra lookup).
    function ssjrActorWriteAuthorityValid(rivalryId, deviceId, sessionId) {
      let actor = request.auth.uid;
      let rivalryRoot = get(/databases/$(database)/documents/rivalries/$(rivalryId));
      let rivalry = rivalryRoot.data.data;
      let actorAccount = get(/databases/$(database)/documents/accounts/$(actor));
      let device = get(/databases/$(database)/documents/accounts/$(actor)/devices/$(deviceId));
      let session = get(/databases/$(database)/documents/rivalries/$(rivalryId)/sessions/$(sessionId));
      let sessionData = session.data.data;
      return signedIn()
        && ssjrValidRivalryId(rivalryId)
        && ssjrValidDeviceId(deviceId)
        && validSessionId(sessionId)
        && rivalryRoot.data.lifecycleState == 'live'
        && rivalry.connectionState == 'active'
        && actor in rivalry.authorizedAccountIds
        && actorAccount.data.data.status == 'active'
        && device.data.objectId == deviceId
        && device.data.data.state == 'active'
        && session.data.objectId == sessionId
        && sessionData.rivalryId == rivalryId
        && sessionData.state == 'active'
        && sessionData.memberAccountIds is list
        && sessionData.memberAccountIds.size() == 2
        && rivalry.authorizedAccountIds[0] in sessionData.memberAccountIds
        && rivalry.authorizedAccountIds[1] in sessionData.memberAccountIds
        && sessionData.expiresAt is timestamp;
    }
    function ssjrWriteAuthorityValid(rivalryId, deviceId, sessionId) {
      let rivalry = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data;
      let slot0AccountId = rivalry.managerSlots[0].accountId;
      let slot1AccountId = rivalry.managerSlots[1].accountId;
      return ssjrActorWriteAuthorityValid(rivalryId, deviceId, sessionId)
        && rivalry.authorizedAccountIds is list
        && rivalry.authorizedAccountIds.size() == 2
        && rivalry.authorizedAccountIds[0] != rivalry.authorizedAccountIds[1]
        && rivalry.managerSlots is list
        && rivalry.managerSlots.size() == 2
        && rivalry.managerSlots[0].slotId == 'playerOne'
        && rivalry.managerSlots[1].slotId == 'playerTwo'
        && slot0AccountId != slot1AccountId
        && rivalry.managerSlots[0].entitlementState == 'active'
        && rivalry.managerSlots[1].entitlementState == 'active'
        && slot0AccountId in rivalry.authorizedAccountIds
        && slot1AccountId in rivalry.authorizedAccountIds;
    }
    // r84 trim: both manager accounts are checked once per Showdown, when the Shared Setup is opened (plus at every Session
    // start), instead of on every save: a deleted or deletion-pending account cannot start a new Showdown.
    function ssjrBothAccountsActive(rivalryId) {
      let slots = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data.managerSlots;
      return get(/databases/$(database)/documents/accounts/$(slots[0].accountId)).data.data.status == 'active'
        && get(/databases/$(database)/documents/accounts/$(slots[1].accountId)).data.data.status == 'active';
    }
    function ssjrSessionHostIsActor(rivalryId, sessionId) {
      return get(/databases/$(database)/documents/rivalries/$(rivalryId)/sessions/$(sessionId)).data.data.hostAccountId == request.auth.uid;
    }
    function ssjrSetupHexMod5(value) {
      return value in ['0','5','a','f'] ? 0
        : value in ['1','6','b'] ? 1
        : value in ['2','7','c'] ? 2
        : value in ['3','8','d'] ? 3
        : value in ['4','9','e'] ? 4
        : -1;
    }
    function ssjrSetupHex32Mod5(value) {
      return (ssjrSetupHexMod5(value[0])
        + ssjrSetupHexMod5(value[1])
        + ssjrSetupHexMod5(value[2])
        + ssjrSetupHexMod5(value[3])
        + ssjrSetupHexMod5(value[4])
        + ssjrSetupHexMod5(value[5])
        + ssjrSetupHexMod5(value[6])
        + ssjrSetupHexMod5(value[7])) % 5;
    }
    function ssjrSetupBindingCanonical(rivalryId) {
      let rivalry = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data;
      let slots = rivalry.managerSlots;
      return '{"managerSlots":[{"accountId":"' + slots[0].accountId
        + '","profileId":"' + slots[0].profileId
        + '","saveId":"' + slots[0].saveId
        + '","slotId":"' + slots[0].slotId
        + '"},{"accountId":"' + slots[1].accountId
        + '","profileId":"' + slots[1].profileId
        + '","saveId":"' + slots[1].saveId
        + '","slotId":"' + slots[1].slotId
        + '"}],"rivalryId":"' + rivalryId + '"}';
    }
    function ssjrSetupBindingHash(rivalryId) {
      return 'sha256:' + hashing.sha256(ssjrSetupBindingCanonical(rivalryId)).toHexString().lower();
    }
    function ssjrSetupLeagueDigest(rivalryId, counter) {
      let seed = '{"bindingHash":"' + ssjrSetupBindingHash(rivalryId)
        + '","catalogHash":"sha256:f68d0a20f13304ae5af9faa2fee0b731d3491375304f635fb52c68840484d2ce'
        + '","counter":' + string(counter)
        + ',"domain":"shared-showdown-draw-v1","leagueId":null,"purpose":"league"}';
      return hashing.sha256(seed).toHexString().lower();
    }
    function ssjrSetupLeagueIndex(rivalryId) {
      let first = ssjrSetupLeagueDigest(rivalryId, 0);
      let selected = first[0:8] == 'ffffffff' ? ssjrSetupLeagueDigest(rivalryId, 1) : first;
      return selected[0:8] == 'ffffffff' ? -1 : ssjrSetupHex32Mod5(selected);
    }
    function ssjrSetupTeamCount(rivalryId) {
      let index = ssjrSetupLeagueIndex(rivalryId);
      return index == 2 ? 18 : (index >= 0 && index <= 4 ? 20 : 0);
    }
    function ssjrLeagueProjectionCreateValid(rivalryId) {
      let after = request.resource.data;
      let setup = get(/databases/$(database)/documents/rivalries/$(rivalryId)/sharedSetup/authoritative).data;
      let rivalry = ssjrRivalryData(rivalryId);
      // Audit R84 F01 (r85): the acting account must be active (one lookup, once per Showdown); the team count itself is
      // derived by these Rules from the binding, so no device or Session field is carried.
      return activeActor()
        && after.keys().hasOnly(['schemaVersion','objectType','rivalryId','teamCount','createdAt'])
        && after.schemaVersion == 1
        && after.objectType == 'sharedLeagueProjection'
        && after.rivalryId == rivalryId
        && after.teamCount in [18,20]
        && after.teamCount == ssjrSetupTeamCount(rivalryId)
        && after.createdAt == request.time
        && request.auth.uid in rivalry.authorizedAccountIds
        && setup.schemaVersion == 1
        && setup.objectType == 'sharedSetupLedger'
        && setup.rivalryId == rivalryId
        && setup.revision == 6
        && setup.phase == 'SHOWDOWN_CONFIRMED';
    }
    function ssjrExactLedgerKeys(root) {
      return root.keys().hasOnly([
        'schemaVersion','objectType','rivalryId','revision','phase','coordinatorRole',
        'operationIds','operationTypes','baseRevisions','actorRoles','totalSeasons',
        'confirmedRoles','activeSessionId','updatedAt','updatedByDeviceId'
      ]);
    }
    function ssjrValidLedgerBase(root, rivalryId) {
      let historySize = root.operationIds.size();
      return ssjrExactLedgerKeys(root)
        && root.schemaVersion == 1
        && root.objectType == 'sharedSetupLedger'
        && root.rivalryId == rivalryId
        && root.revision is int
        && root.revision >= 1
        && root.revision <= 6
        && (root.coordinatorRole == 'playerOne' || root.coordinatorRole == 'playerTwo')
        && root.operationIds is list
        && root.operationTypes is list
        && root.baseRevisions is list
        && root.actorRoles is list
        && historySize == root.revision
        && root.operationTypes.size() == historySize
        && root.baseRevisions.size() == historySize
        && root.actorRoles.size() == historySize
        && root.confirmedRoles is list
        && root.updatedAt == request.time
        && ssjrWriteAuthorityValid(rivalryId, root.updatedByDeviceId, root.activeSessionId);
    }
    function ssjrValidCreateLedger(rivalryId) {
      let after = request.resource.data;
      return ssjrValidLedgerBase(after, rivalryId)
        && after.revision == 1
        && after.phase == 'SHARED_SETUP_OPEN'
        && after.coordinatorRole == ssjrActorRole(rivalryId)
        && ssjrValidOperationId(after.operationIds[0])
        && after.operationTypes[0] == 'open'
        && after.baseRevisions[0] == 0
        && after.actorRoles[0] == after.coordinatorRole
        && after.totalSeasons == null
        && after.confirmedRoles.size() == 0
        && ssjrSessionHostIsActor(rivalryId, after.activeSessionId)
        && ssjrBothAccountsActive(rivalryId);
    }
    function ssjrPrefixPreserved(before, after) {
      let n = before.revision;
      return after.operationIds[0:n] == before.operationIds
        && after.operationTypes[0:n] == before.operationTypes
        && after.baseRevisions[0:n] == before.baseRevisions
        && after.actorRoles[0:n] == before.actorRoles;
    }
    function ssjrNewOperationValid(before, after) {
      let index = before.revision;
      return ssjrValidOperationId(after.operationIds[index])
        && !(after.operationIds[index] in before.operationIds)
        && after.baseRevisions[index] == before.revision
        && after.actorRoles[index] == ssjrActorRole(after.rivalryId);
    }
    function ssjrTransitionShapeValid(before, after) {
      let i = before.revision;
      let nextTypes = ['unused','commit-league','commit-clubs','commit-length','confirm','confirm'];
      let nextPhases = ['unused','LEAGUE_WHEEL_COMMITTED','CLUB_ASSIGNMENTS_COMMITTED','SEASON_LENGTH_COMMITTED','SEASON_LENGTH_COMMITTED','SHOWDOWN_CONFIRMED'];
      return i >= 1
        && i <= 5
        && after.operationTypes[i] == nextTypes[i]
        && after.phase == nextPhases[i]
        && (i >= 4 || after.actorRoles[i] == before.coordinatorRole)
        && (
          (i <= 2 && before.totalSeasons == null && after.totalSeasons == null)
          || (i == 3 && before.totalSeasons == null && after.totalSeasons in [1,3,5,10])
          || (i >= 4 && after.totalSeasons == before.totalSeasons)
        )
        && (
          (i <= 3 && after.confirmedRoles.size() == 0)
          || (i == 4
            && before.confirmedRoles.size() == 0
            && after.confirmedRoles.size() == 1
            && after.confirmedRoles[0] == after.actorRoles[i])
          || (i == 5
            && before.confirmedRoles.size() == 1
            && after.confirmedRoles.size() == 2
            && after.confirmedRoles[0] == before.confirmedRoles[0]
            && after.confirmedRoles[1] == after.actorRoles[i]
            && after.confirmedRoles[1] != after.confirmedRoles[0])
        );
    }
    function ssjrValidUpdateLedger(rivalryId) {
      let before = resource.data;
      let after = request.resource.data;
      return ssjrValidLedgerBase(after, rivalryId)
        && after.revision == before.revision + 1
        && after.coordinatorRole == before.coordinatorRole
        && ssjrPrefixPreserved(before, after)
        && ssjrNewOperationValid(before, after)
        && ssjrTransitionShapeValid(before, after);
    }
// SSJR_SHARED_SETUP_FUNCTIONS_END

// SSJR_SHARED_SETUP_MATCH_BEGIN
      match /sharedSetup/authoritative {
        allow get: if ssjrEntitled(rivalryId);
        allow list, delete: if false;
        allow create: if ssjrValidCreateLedger(rivalryId);
        allow update: if ssjrValidUpdateLedger(rivalryId);
      }

      match /sharedSetup/leagueProjection {
        allow get: if ssjrEntitled(rivalryId);
        allow list, update, delete: if false;
        allow create: if ssjrLeagueProjectionCreateValid(rivalryId);
      }
// SSJR_SHARED_SETUP_MATCH_END
```
