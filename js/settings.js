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
