/* =====================================================
   Career Mode Showdown v1.0.1
   Lightweight accessible Transfer Challenge comboboxes
===================================================== */

// Every match is listed (the list scrolls), so an empty box browses the whole FIFA 17 list (Nik 2026-10-30).
// r91 (2.4.0): a third kind, "player", on the Transfer War signing name. It searches the full FIFA 17 launch list
// (js/playerSearch.js, loaded on demand) from two letters, at most 20 rows. The typed text is always the truth: nothing is
// highlighted until an arrow key moves, so Enter or a tap away keeps a custom name exactly as typed. A pick fills the name,
// keeps the player's SoFIFA id on the box (data-player-id, cleared on the next edit) and sends "transfer-player-pick".
const TRANSFER_SELECTOR_RESULT_LIMIT = 400;
const transferSelectorStates = new WeakMap();
let transferSelectorDocumentBound = false;

function transferSelectorNormalize(value){
    if(typeof window.normalizeTransferOptionText === "function"){
        return window.normalizeTransferOptionText(value);
    }
    return String(value || "").trim().toLowerCase();
}

function getTransferSelectorOptions(kind){
    if(typeof window.getFifa17TransferOptions !== "function"){
        return [];
    }
    return window.getFifa17TransferOptions(kind);
}

function getTransferSelectorOptionSearchText(option){
    return transferSelectorNormalize([
        option.label,
        option.country,
        option.tier ? `tier ${option.tier}` : "",
        ...(option.aliases || [])
    ].filter(Boolean).join(" "));
}

function getTransferSelectorOptionMeta(kind, option){
    if(kind !== "league"){
        return "";
    }
    const tier = Number(option.tier);
    if(option.id === "rest-of-world"){
        return "Other / fallback";
    }
    return tier > 1 ? `${option.country} · Tier ${tier}` : option.country;
}

function closeTransferSelector(input){
    const state = transferSelectorStates.get(input);
    if(!state){ return; }
    state.list.classList.add("hidden");
    state.input.setAttribute("aria-expanded", "false");
    state.input.removeAttribute("aria-activedescendant");
    state.activeIndex = -1;
}

function closeAllTransferSelectors(exceptInput = null){
    document.querySelectorAll("[data-transfer-combobox='true']").forEach(input => {
        if(input !== exceptInput){ closeTransferSelector(input); }
    });
}

// r87 sizes F2: the open list sits in the page's flow, so closing it moves what is under it (LOCK MY GUESSES rose ~64 px at
// 1920x1080 and the tap landed on the empty panel). A press outside the box keeps the list open until that press has ended
// and its click has landed; then the list closes. The control under the finger never moves mid-tap.
let transferSelectorPressActive = false;
let transferSelectorCloseAfterPress = false;

function finishTransferSelectorPress(){
    if(!transferSelectorPressActive){ return; }
    // The click follows pointerup in the same task, so a zero timer runs after it.
    window.setTimeout(() => {
        transferSelectorPressActive = false;
        if(transferSelectorCloseAfterPress){
            transferSelectorCloseAfterPress = false;
            closeAllTransferSelectors();
        }
    }, 0);
}

function closeTransferSelectorAfterBlur(input){
    window.setTimeout(() => {
        // r91: focus that came straight back (Team V's card re-mounted around the box) keeps the list open.
        if(document.activeElement === input){ return; }
        if(transferSelectorPressActive){ transferSelectorCloseAfterPress = true; return; }
        closeTransferSelector(input);
    }, 120);
}

function bindTransferSelectorDocumentDismiss(){
    if(transferSelectorDocumentBound){ return; }
    transferSelectorDocumentBound = true;
    document.addEventListener("pointerdown", event => {
        const target = event.target;
        if(target && target.closest && target.closest(".transferCombobox")){
            return;
        }
        transferSelectorPressActive = true;
        transferSelectorCloseAfterPress = true;
    });
    window.addEventListener("pointerup", finishTransferSelectorPress, true);
    window.addEventListener("pointercancel", finishTransferSelectorPress, true);
}

function getTransferPlayerSearch(){
    return window.CareerModePlayerSearch || null;
}

// The search code (js/playerSearch.js, a few KB) loads the first time a name box becomes a player search, through the app's
// own lazy loader (js/optionalModules.js loadRuntimeScript), so Home's startup files stay as they are.
let transferPlayerSearchLoad = null;
function loadTransferPlayerSearch(){
    if(getTransferPlayerSearch()){ return Promise.resolve(getTransferPlayerSearch()); }
    if(transferPlayerSearchLoad){ return transferPlayerSearchLoad; }
    if(typeof window.loadRuntimeScript !== "function"){ return Promise.resolve(null); }
    transferPlayerSearchLoad = window.loadRuntimeScript(
        "player-search",
        "js/playerSearch.js",
        () => Boolean(window.CareerModePlayerSearch && typeof window.CareerModePlayerSearch.ensure === "function")
    ).then(getTransferPlayerSearch, () => { transferPlayerSearchLoad = null; return null; });
    return transferPlayerSearchLoad;
}

function filterTransferPlayerOptions(query){
    const search = getTransferPlayerSearch();
    const db = search && typeof search.ready === "function" ? search.ready() : null;
    return db ? db.suggest(query) : [];
}

// The page's own blocked check (js/productionSharedTransferChallenge.js): the same refusal LOCK gives, or "".
function getTransferPlayerBlockedText(input, player){
    if(typeof window.CareerModeTransferPlayerBlocked !== "function"){ return ""; }
    try{ return String(window.CareerModeTransferPlayerBlocked(input, player.name) || ""); }catch(_error){ return ""; }
}

function getTransferPlayerEmptyText(input){
    const search = getTransferPlayerSearch();
    const status = search && typeof search.status === "function" ? search.status() : "failed";
    if(status === "failed"){ return "Player list unavailable. Type the name."; }
    if(status !== "ready"){ return "Loading the FIFA 17 players…"; }
    return "Not in the FIFA 17 list. Your name stays as typed.";
}

function filterTransferSelectorOptions(kind, query){
    if(kind === "player"){ return filterTransferPlayerOptions(query); }
    const options = getTransferSelectorOptions(kind);
    const normalizedQuery = transferSelectorNormalize(query);

    const sorted = [...options].sort((one, two) => {
        if(kind === "league"){
            const countryCompare = String(one.country || "").localeCompare(String(two.country || ""));
            if(countryCompare){ return countryCompare; }
            const tierCompare = (Number(one.tier) || 99) - (Number(two.tier) || 99);
            if(tierCompare){ return tierCompare; }
        }
        return one.label.localeCompare(two.label);
    });

    if(!normalizedQuery){
        return sorted.slice(0, TRANSFER_SELECTOR_RESULT_LIMIT);
    }

    const starts = [];
    const includes = [];
    sorted.forEach(option => {
        const label = transferSelectorNormalize(option.label);
        const search = getTransferSelectorOptionSearchText(option);
        if(label.startsWith(normalizedQuery)){
            starts.push(option);
        }else if(search.includes(normalizedQuery)){
            includes.push(option);
        }
    });

    return [...starts, ...includes].slice(0, TRANSFER_SELECTOR_RESULT_LIMIT);
}

function chooseTransferPlayerOption(input, player){
    const blocked = getTransferPlayerBlockedText(input, player);
    if(blocked){
        showTransferPlayerBlocked(input, blocked);
        return;
    }
    input.value = player.name;
    input.dataset.playerId = String(player.id);
    closeTransferSelector(input);
    input.dispatchEvent(new CustomEvent("transfer-player-pick", {
        bubbles: true,
        detail: { player }
    }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
}

// A blocked player is listed (so the manager sees why) but can't be picked; the refusal shows in the list itself.
function showTransferPlayerBlocked(input, text){
    const state = transferSelectorStates.get(input);
    if(!state){ return; }
    let note = state.list.querySelector(".transferComboboxNotice");
    if(!note){
        note = document.createElement("div");
        note.className = "transferComboboxNotice";
        note.setAttribute("role", "status");
        state.list.prepend(note);
    }
    note.textContent = text;
}

function chooseTransferSelectorOption(input, option, dispatch = true){
    const state = transferSelectorStates.get(input);
    if(!state || !option){ return; }
    if(state.kind === "player"){
        chooseTransferPlayerOption(input, option);
        return;
    }

    input.value = option.label;
    input.dataset.canonicalId = option.id;
    input.dataset.canonicalLabel = option.label;
    closeTransferSelector(input);

    if(dispatch){
        input.dispatchEvent(new CustomEvent("transfer-selection-change", {
            bubbles: true,
            detail: { kind: state.kind, id: option.id, label: option.label }
        }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
    }
}

function renderTransferSelectorList(input){
    const state = transferSelectorStates.get(input);
    if(!state){ return; }

    const isPlayer = state.kind === "player";
    if(isPlayer && transferPlayerQueryTooShort(input.value)){
        closeTransferSelector(input);
        return;
    }
    const options = filterTransferSelectorOptions(state.kind, input.value);
    state.filteredOptions = options;
    state.activeIndex = options.length && !isPlayer ? 0 : -1;

    const fragment = document.createDocumentFragment();
    if(!options.length){
        const empty = document.createElement("div");
        empty.className = "transferComboboxEmpty";
        empty.textContent = isPlayer ? getTransferPlayerEmptyText(input) : "No matching FIFA 17 option";
        fragment.appendChild(empty);
    }else if(isPlayer){
        options.forEach((player, index) => {
            fragment.appendChild(renderTransferPlayerOption(input, state, player, index));
        });
        const hint = document.createElement("div");
        hint.className = "transferComboboxHint";
        hint.textContent = "FIFA 17 launch details. Check them against your save.";
        fragment.appendChild(hint);
    }else{
        options.forEach((option, index) => {
            const item = document.createElement("div");
            item.id = `${state.list.id}-option-${index}`;
            item.className = "transferComboboxOption";
            item.setAttribute("role", "option");
            item.setAttribute("aria-selected", index === state.activeIndex ? "true" : "false");
            item.dataset.optionId = option.id;

            const label = document.createElement("strong");
            label.textContent = option.label;
            item.appendChild(label);

            const metaText = getTransferSelectorOptionMeta(state.kind, option);
            if(metaText){
                const meta = document.createElement("span");
                meta.textContent = metaText;
                item.appendChild(meta);
            }

            // A tap picks (click); a finger that drags scrolls the list without picking (Nik 2026-10-30).
            item.addEventListener("click", event => {
                event.preventDefault();
                chooseTransferSelectorOption(input, option, true);
            });
            fragment.appendChild(item);
        });
    }

    state.list.replaceChildren(fragment);
    state.list.classList.remove("hidden");
    input.setAttribute("aria-expanded", "true");
    updateTransferSelectorActiveDescendant(input);
    // The open list is brought fully into view (clear of a phone's bottom buttons: its scroll-margin, css/v10Transfer.css).
    if(typeof state.list.scrollIntoView === "function"){ state.list.scrollIntoView({ block: "nearest" }); }
}

function transferPlayerQueryTooShort(text){
    const search = getTransferPlayerSearch();
    const min = search && search.MIN_LETTERS || 2;
    const folded = search && typeof search.fold === "function" ? search.fold(text) : String(text || "").trim();
    return folded.length < min;
}

function renderTransferPlayerOption(input, state, player, index){
    const item = document.createElement("div");
    item.id = `${state.list.id}-option-${index}`;
    item.className = "transferComboboxOption transferComboboxPlayer";
    item.setAttribute("role", "option");
    item.setAttribute("aria-selected", "false");
    item.dataset.playerId = String(player.id);

    const label = document.createElement("strong");
    label.textContent = player.name;
    item.appendChild(label);

    const meta = document.createElement("span");
    meta.textContent = `${player.position} ${player.overall} · ${player.freeAgent ? "Free agent" : player.club}`;
    item.appendChild(meta);

    const blocked = getTransferPlayerBlockedText(input, player);
    if(blocked){
        item.classList.add("is-blocked");
        item.setAttribute("aria-disabled", "true");
        const why = document.createElement("em");
        why.textContent = "Can't be signed";
        item.appendChild(why);
    }
    item.addEventListener("click", event => {
        event.preventDefault();
        chooseTransferSelectorOption(input, player, true);
    });
    return item;
}

function updateTransferSelectorActiveDescendant(input){
    const state = transferSelectorStates.get(input);
    if(!state){ return; }

    const items = Array.from(state.list.querySelectorAll("[role='option']"));
    items.forEach((item, index) => {
        item.classList.toggle("active", index === state.activeIndex);
        item.setAttribute("aria-selected", index === state.activeIndex ? "true" : "false");
    });

    const active = items[state.activeIndex];
    if(active){
        input.setAttribute("aria-activedescendant", active.id);
        active.scrollIntoView({ block: "nearest" });
    }else{
        input.removeAttribute("aria-activedescendant");
    }
}

function handleTransferSelectorInput(event){
    const input = event.currentTarget;
    const state = transferSelectorStates.get(input);
    if(state && state.kind === "player"){
        // The typed text is the truth; a pick's id never outlives an edit.
        delete input.dataset.playerId;
        renderTransferSelectorList(input);
        return;
    }
    delete input.dataset.canonicalId;
    delete input.dataset.canonicalLabel;

    if(!state){ return; }
    const exact = typeof window.resolveFifa17TransferOption === "function"
        ? window.resolveFifa17TransferOption(state.kind, input.value)
        : null;
    if(exact && transferSelectorNormalize(exact.label) === transferSelectorNormalize(input.value)){
        input.dataset.canonicalId = exact.id;
        input.dataset.canonicalLabel = exact.label;
    }
    renderTransferSelectorList(input);
}

function handleTransferSelectorKeydown(event){
    const input = event.currentTarget;
    const state = transferSelectorStates.get(input);
    if(!state){ return; }

    const isOpen = !state.list.classList.contains("hidden");
    if(event.key === "ArrowDown" || event.key === "ArrowUp"){
        event.preventDefault();
        if(!isOpen){
            renderTransferSelectorList(input);
            return;
        }
        if(!state.filteredOptions.length){ return; }
        const delta = event.key === "ArrowDown" ? 1 : -1;
        state.activeIndex = (state.activeIndex + delta + state.filteredOptions.length) % state.filteredOptions.length;
        updateTransferSelectorActiveDescendant(input);
        return;
    }

    if(event.key === "Enter" && isOpen && state.activeIndex >= 0){
        event.preventDefault();
        chooseTransferSelectorOption(input, state.filteredOptions[state.activeIndex], true);
        return;
    }

    if(event.key === "Escape"){
        closeTransferSelector(input);
    }
}

function enhanceTransferSelector(input, kind){
    if(!input){ return null; }
    const existing = transferSelectorStates.get(input);
    if(existing){
        updateTransferSelectorKind(input, kind);
        return existing;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "transferCombobox";
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    const list = document.createElement("div");
    list.id = `${input.id || `transfer-selector-${Math.random().toString(36).slice(2)}`}-listbox`;
    list.className = "transferComboboxList hidden";
    list.setAttribute("role", "listbox");
    wrapper.appendChild(list);
    // Pressing or scrolling inside the list keeps focus in the box, so the list stays open until a pick.
    list.addEventListener("pointerdown", event => event.preventDefault());

    input.dataset.transferCombobox = "true";
    input.dataset.selectorContextLabel = input.getAttribute("aria-label") || "";
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-controls", list.id);
    input.setAttribute("aria-expanded", "false");
    input.setAttribute("autocomplete", "off");
    input.setAttribute("spellcheck", "false");

    const state = { input, list, kind: null, filteredOptions: [], activeIndex: -1 };
    transferSelectorStates.set(input, state);

    input.addEventListener("input", handleTransferSelectorInput);
    input.addEventListener("keydown", handleTransferSelectorKeydown);
    input.addEventListener("focus", () => {
        closeAllTransferSelectors(input);
        if(state.kind === "player"){ ensureTransferPlayerList(input); }
        renderTransferSelectorList(input);
    });
    input.addEventListener("blur", () => closeTransferSelectorAfterBlur(input));

    bindTransferSelectorDocumentDismiss();
    updateTransferSelectorKind(input, kind);
    return state;
}

// Fetches the player list (once per page; a failed fetch retries on the next focus) and refreshes an open list when it lands.
function ensureTransferPlayerList(input){
    loadTransferPlayerSearch().then(search => {
        if(!search || typeof search.ensure !== "function"){ return null; }
        return search.ensure();
    }).then(() => {
        if(input && document.activeElement === input){ renderTransferSelectorList(input); }
    });
}

function updateTransferSelectorKind(input, kind){
    const state = transferSelectorStates.get(input);
    if(!state){ return; }
    if(kind === "player"){
        // The name box keeps its own label, placeholder and value: only the list is added.
        if(state.kind === "player"){ return; }
        state.kind = "player";
        input.dataset.selectorKind = "player";
        // Load the search code now and fetch the list at idle, so it is ready before the first letters are typed.
        ensureTransferPlayerList(null);
        input.setAttribute("aria-label", `${input.dataset.selectorContextLabel || "Player name"}. Search FIFA 17 players or type any name`);
        closeTransferSelector(input);
        return;
    }
    const normalizedKind = kind === "league" ? "league" : "nationality";
    if(state.kind === normalizedKind){ return; }

    state.kind = normalizedKind;
    input.dataset.selectorKind = normalizedKind;
    const actionLabel = normalizedKind === "league"
        ? "Search FIFA 17 previous league"
        : "Search player nationality";
    const contextLabel = input.dataset.selectorContextLabel;
    input.setAttribute("aria-label", contextLabel ? `${contextLabel}. ${actionLabel}` : actionLabel);
    delete input.dataset.canonicalId;
    delete input.dataset.canonicalLabel;
    input.value = "";
    input.placeholder = normalizedKind === "league" ? "Search FIFA 17 league" : "Search nationality";
    closeTransferSelector(input);
}

function setTransferSelectorValue(input, kind, storedValue){
    if(!input){ return; }
    enhanceTransferSelector(input, kind);
    const state = transferSelectorStates.get(input);
    if(state && state.kind !== kind){ updateTransferSelectorKind(input, kind); }

    const option = typeof window.resolveFifa17TransferOption === "function"
        ? window.resolveFifa17TransferOption(kind, storedValue)
        : null;

    if(option){
        input.value = option.label;
        input.dataset.canonicalId = option.id;
        input.dataset.canonicalLabel = option.label;
    }else{
        input.value = String(storedValue || "");
        delete input.dataset.canonicalId;
        delete input.dataset.canonicalLabel;
    }
}

function getTransferSelectorCanonicalValue(input){
    return input && input.dataset ? (input.dataset.canonicalId || "") : "";
}

function getTransferSelectorDisplayValue(input){
    return input ? input.value.trim() : "";
}

window.enhanceTransferSelector = enhanceTransferSelector;
window.updateTransferSelectorKind = updateTransferSelectorKind;
window.setTransferSelectorValue = setTransferSelectorValue;
window.getTransferSelectorCanonicalValue = getTransferSelectorCanonicalValue;
window.getTransferSelectorDisplayValue = getTransferSelectorDisplayValue;
window.closeAllTransferSelectors = closeAllTransferSelectors;
window.ensureTransferPlayerList = ensureTransferPlayerList;
