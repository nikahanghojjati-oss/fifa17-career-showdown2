/* =====================================================
   Career Mode Showdown v1.0.1
   Lightweight accessible Transfer Challenge comboboxes
===================================================== */

const TRANSFER_SELECTOR_RESULT_LIMIT = 14;
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

function bindTransferSelectorDocumentDismiss(){
    if(transferSelectorDocumentBound){ return; }
    transferSelectorDocumentBound = true;
    document.addEventListener("pointerdown", event => {
        const target = event.target;
        if(target && target.closest && target.closest(".transferCombobox")){
            return;
        }
        closeAllTransferSelectors();
    });
}

function filterTransferSelectorOptions(kind, query){
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

function chooseTransferSelectorOption(input, option, dispatch = true){
    const state = transferSelectorStates.get(input);
    if(!state || !option){ return; }

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

    const options = filterTransferSelectorOptions(state.kind, input.value);
    state.filteredOptions = options;
    state.activeIndex = options.length ? 0 : -1;

    const fragment = document.createDocumentFragment();
    if(!options.length){
        const empty = document.createElement("div");
        empty.className = "transferComboboxEmpty";
        empty.textContent = "No matching FIFA 17 option";
        fragment.appendChild(empty);
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

            item.addEventListener("pointerdown", event => {
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
    delete input.dataset.canonicalId;
    delete input.dataset.canonicalLabel;

    const state = transferSelectorStates.get(input);
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
        renderTransferSelectorList(input);
    });
    input.addEventListener("blur", () => {
        window.setTimeout(() => closeTransferSelector(input), 120);
    });

    bindTransferSelectorDocumentDismiss();
    updateTransferSelectorKind(input, kind);
    return state;
}

function updateTransferSelectorKind(input, kind){
    const state = transferSelectorStates.get(input);
    if(!state){ return; }
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
