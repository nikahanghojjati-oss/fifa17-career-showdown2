/* =====================================================
   Career Mode Showdown v0.95.0
   Workstream 3 — lightweight application Settings
===================================================== */

let settingsOverlay = null;
let settingsDialog = null;
let settingsContent = null;
let settingsPreviousFocus = null;
let settingsPreferenceListenerBound = false;

function getSettingsAssetRevision(){
    const meta = document.querySelector('meta[name="app-asset-revision"]');
    return meta && meta.content ? meta.content.trim() : "Unknown build";
}

function getSettingsApplicationVersion(){
    return typeof APP_VERSION === "string" ? APP_VERSION : "0.95.0";
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

function createSettingsElement(tagName, className = "", text = ""){
    const element = document.createElement(tagName);
    if(className){ element.className = className; }
    if(text !== ""){ element.textContent = text; }
    return element;
}

function createSettingsInfoRow(label, value){
    const row = createSettingsElement("div", "settingsInfoRow");
    const labelElement = createSettingsElement("span", "", label);
    const valueElement = createSettingsElement("strong", "", value);
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
        reducedMotionOverride: false,
        systemReduced,
        effectiveReduced: systemReduced
    };
}

function focusSelectedSettingsMotionChoice(){
    window.requestAnimationFrame(() => {
        if(!settingsOverlay || settingsOverlay.classList.contains("hidden") || !settingsContent){
            return;
        }
        const selected = settingsContent.querySelector(".settingsMotionChoice.selected");
        if(selected){
            selected.focus({ preventScroll: true });
        }
    });
}

function setSettingsMotionPreference(reduced){
    if(typeof window.setApplicationReducedMotionPreference !== "function"){
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("Motion preferences are unavailable in this browser session.", "error");
        }
        return;
    }

    if(!window.setApplicationReducedMotionPreference(Boolean(reduced))){
        return;
    }

    if(typeof window.showAppNotice === "function"){
        window.showAppNotice(
            reduced ? "Reduced motion is enabled." : "Motion now follows your device preference.",
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

function createMotionChoice(label, description, selected, reduced){
    const button = createSettingsElement("button", "settingsMotionChoice");
    button.type = "button";
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", selected ? "true" : "false");
    button.tabIndex = selected ? 0 : -1;
    button.dataset.motionReduced = reduced ? "true" : "false";
    button.classList.toggle("selected", selected);

    const marker = createSettingsElement("span", "settingsMotionMarker");
    marker.setAttribute("aria-hidden", "true");
    const copy = createSettingsElement("span", "settingsMotionCopy");
    copy.append(
        createSettingsElement("strong", "", label),
        createSettingsElement("small", "", description)
    );
    button.append(marker, copy);
    button.addEventListener("click", () => setSettingsMotionPreference(reduced));
    button.addEventListener("keydown", handleMotionChoiceKeydown);
    return button;
}

function createApplicationPanel(){
    const panel = createSettingsPanel(
        "APPLICATION",
        "CAREER MODE SHOWDOWN",
        "A local two-manager FIFA 17 Career Mode rivalry companion. No account, cloud save or backend is required."
    );
    const info = createSettingsElement("div", "settingsInfoGrid");
    info.append(
        createSettingsInfoRow("APPLICATION VERSION", `v${getSettingsApplicationVersion()}`),
        createSettingsInfoRow("BUILD", getSettingsAssetRevision()),
        createSettingsInfoRow("SAVE MODEL", "Local browser storage"),
        createSettingsInfoRow("PLAY MODE", "Two managers · one device")
    );
    panel.appendChild(info);
    return panel;
}

function createMotionPanel(){
    const state = getSettingsMotionState();
    const panel = createSettingsPanel(
        "ACCESSIBILITY",
        "MOTION",
        "Follow the device by default, or force non-essential motion to be minimized. A device reduced-motion request is always respected."
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
            "Use the browser or operating-system accessibility preference.",
            !state.reducedMotionOverride,
            false
        ),
        createMotionChoice(
            "REDUCE MOTION",
            "Always minimize menu transitions, League Wheel delay and Club Reveal theatrics.",
            state.reducedMotionOverride,
            true
        )
    );

    panel.append(summary, choices);
    return panel;
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

    const opened = await window.openOptionalModule("legacy");
    if(!opened){
        openSettings();
    }
}

function createDataPanel(){
    const active = getSettingsActiveShowdown();
    const history = getSettingsLegacyHistory();
    const panel = createSettingsPanel(
        "LOCAL STORAGE",
        "DATA MANAGEMENT",
        "Showdown deletion and full-reset actions stay centralized in Legacy, where the existing confirmations and rollback protections remain authoritative."
    );

    const info = createSettingsElement("div", "settingsInfoGrid");
    info.append(
        createSettingsInfoRow(
            "ACTIVE SHOWDOWN",
            active ? `${active.name || "Unnamed Showdown"} · ${active.status || "Saved"}` : "None"
        ),
        createSettingsInfoRow(
            "LEGACY ARCHIVE",
            `${history.length} completed showdown${history.length === 1 ? "" : "s"}`
        )
    );

    const action = createSettingsElement("button", "menuButton settingsDataButton", "OPEN LEGACY & DATA MANAGEMENT");
    action.type = "button";
    action.addEventListener("click", openSettingsDataManagement);

    const note = createSettingsElement(
        "p",
        "settingsDataNote",
        "Reset All Showdown Data removes active and Legacy competition data but intentionally keeps this motion preference. Destructive actions always require confirmation."
    );

    panel.append(info, action, note);
    return panel;
}

function renderSettings(){
    ensureSettingsDialog();
    if(!settingsContent){ return; }

    const fragment = document.createDocumentFragment();
    fragment.append(
        createApplicationPanel(),
        createMotionPanel(),
        createDataPanel()
    );
    settingsContent.replaceChildren(fragment);
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
    renderSettings();

    settingsPreviousFocus = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    settingsOverlay.classList.remove("hidden");
    settingsOverlay.setAttribute("aria-hidden", "false");
    setSettingsBackgroundInert(true);

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

    if(restoreFocus && settingsPreviousFocus && settingsPreviousFocus.isConnected){
        settingsPreviousFocus.focus();
    }
    settingsPreviousFocus = null;
}

function initializeSettings(){
    ensureSettingsDialog();
    if(settingsPreferenceListenerBound){ return; }
    settingsPreferenceListenerBound = true;
    window.addEventListener("career-mode-preferences-change", event => {
        if(settingsOverlay && !settingsOverlay.classList.contains("hidden")){
            renderSettings();
            if(event && event.detail && event.detail.source === "user"){
                focusSelectedSettingsMotionChoice();
            }
        }
    });
}

window.initializeSettings = initializeSettings;
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.renderSettings = renderSettings;
