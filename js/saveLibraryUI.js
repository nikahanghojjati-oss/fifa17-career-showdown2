(function initializeSaveLibraryProductUI(root){
    "use strict";

    let saveLibraryUIObserver=null;
    let saveLibraryUIAuthorityIssue="";
    let saveLibraryUIBusy=false;

    function saveLibraryUIElement(tag,className="",text=""){
        const element=document.createElement(tag);
        if(className)element.className=className;
        if(text!=="")element.textContent=text;
        return element;
    }

    function saveLibraryUIShowNotice(message,type="error"){
        if(typeof root.showAppNotice==="function")root.showAppNotice(message,type,type==="error"?9000:3500);
    }

    function saveLibraryUICaptureRaw(){
        if(typeof root.captureCareerModeRawSaveLibraryMigrationSnapshot!=="function"){
            return {ok:false,error:"Exact local Save Library read authority is unavailable."};
        }
        try{
            const snapshot=root.captureCareerModeRawSaveLibraryMigrationSnapshot();
            if(!snapshot||snapshot.ok!==true||!snapshot.raw){
                return {ok:false,error:"Exact local Save Library state could not be read safely."};
            }
            return {ok:true,raw:snapshot.raw};
        }catch(error){
            return {ok:false,error:error&&error.message?error.message:"Exact local Save Library state could not be read safely."};
        }
    }

    function saveLibraryUIState(){
        const captured=saveLibraryUICaptureRaw();
        if(!captured.ok)return {mode:"blocked",message:captured.error};
        const raw=captured.raw;
        if(raw.saveLibrary!==null&&raw.activeShowdown!==null){
            return {mode:"blocked",message:"Two local save authorities are present at once. No Save Library action is available until the existing recovery boundary resolves that state."};
        }
        if(raw.saveLibrary===null){
            if(raw.activeShowdown!==null){
                return {mode:"compatibility"};
            }
            return {mode:"empty"};
        }
        const runtime=root.CareerModeSaveLibraryRuntime;
        if(saveLibraryUIAuthorityIssue||!runtime||typeof runtime.getLibrarySnapshot!=="function"||!runtime.isReady()){
            return {mode:"blocked",message:saveLibraryUIAuthorityIssue||"Save Library authority is unavailable. Your saved bytes were not changed."};
        }
        const library=runtime.getLibrarySnapshot();
        if(!library)return {mode:"blocked",message:"Save Library state could not be verified. Your saved bytes were not changed."};
        return {mode:"ready",library};
    }

    function saveLibraryUIShortIdentity(value){
        const text=String(value||"");
        const token=text.includes("_")?text.slice(text.indexOf("_")+1):text;
        return token.slice(0,4).toUpperCase()+" "+token.slice(4,8).toUpperCase();
    }

    function saveLibraryUIFormatUpdated(showdown){
        const raw=showdown&&showdown.updatedAt;
        if(!raw)return "Saved locally";
        const date=new Date(raw);
        if(Number.isNaN(date.getTime()))return "Saved locally";
        try{
            return `Updated ${new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric",year:"numeric"}).format(date)}`;
        }catch(error){
            return "Saved locally";
        }
    }

    function saveLibraryUISaveProgress(showdown){
        if(showdown&&showdown.status==="Completed")return "Showdown complete";
        const current=Math.max(1,Number(showdown&&showdown.currentRound)||1);
        const total=Math.max(1,Number(showdown&&showdown.totalRounds)||1);
        return `Season ${current} of ${total}`;
    }

    function saveLibraryUILeagueLabel(showdown){
        return showdown&&showdown.selectedLeague&&showdown.selectedLeague.name
            ? showdown.selectedLeague.name
            : "League draw pending";
    }

    function saveLibraryUIClubLabel(showdown){
        const one=showdown&&showdown.clubs&&showdown.clubs.playerOne;
        const two=showdown&&showdown.clubs&&showdown.clubs.playerTwo;
        return one&&two?`${one} vs ${two}`:"Clubs not assigned";
    }

    function saveLibraryUICloseAndActivate(buttonId){
        if(typeof root.closeSettings==="function")root.closeSettings(false);
        const button=document.getElementById(buttonId);
        if(button&&!button.disabled)button.click();
    }

    async function saveLibraryUISwitch(saveId,button){
        if(saveLibraryUIBusy)return;
        const runtime=root.CareerModeSaveLibraryRuntime;
        if(!runtime||typeof runtime.switchActiveSave!=="function"){
            saveLibraryUIShowNotice("Save Library switching is unavailable in this session.");
            return;
        }
        saveLibraryUIBusy=true;
        if(button){button.disabled=true;button.setAttribute("aria-busy","true");}
        try{
            await runtime.switchActiveSave(saveId);
            if(typeof root.refreshMainMenuExperience==="function")root.refreshMainMenuExperience();
            saveLibraryUIShowNotice("Active local Showdown changed.","success");
            saveLibraryUIRender();
        }catch(error){
            saveLibraryUIShowNotice(`The active Save could not be changed. ${error&&error.message?error.message:"No saved data was changed."}`);
        }finally{
            saveLibraryUIBusy=false;
            if(button&&button.isConnected){button.disabled=false;button.removeAttribute("aria-busy");}
        }
    }

    function saveLibraryUIDelete(saveId,showdown){
        if(saveLibraryUIBusy)return;
        const name=showdown&&showdown.name?showdown.name:"Unnamed Showdown";
        const confirmed=root.confirm(`Delete only “${name}” from this device? Other local Saves, Local Profiles, Legacy history and app settings remain. This cannot be undone.`);
        if(!confirmed)return;
        const runtime=root.CareerModeSaveLibraryRuntime;
        if(!runtime||typeof runtime.deleteSave!=="function"){
            saveLibraryUIShowNotice("Single-Save deletion is unavailable in this session.");
            return;
        }
        saveLibraryUIBusy=true;
        try{
            const result=runtime.deleteSave(saveId);
            if(!result||result.ok!==true)throw new Error("The Save Library did not confirm deletion.");
            if(typeof root.refreshMainMenuExperience==="function")root.refreshMainMenuExperience();
            saveLibraryUIShowNotice(`“${name}” was deleted. Other local data was retained.`,"success");
            saveLibraryUIRender();
        }catch(error){
            saveLibraryUIShowNotice(`The selected Save was not deleted. ${error&&error.message?error.message:"No saved data was changed."}`);
        }finally{
            saveLibraryUIBusy=false;
        }
    }

    function saveLibraryUICreateSaveCard(entry,activeSaveId){
        const showdown=entry.showdown||{};
        const active=entry.saveId===activeSaveId;
        const card=saveLibraryUIElement("article",`saveLibraryCard${active?" isActive":""}`);
        card.dataset.saveId=entry.saveId;

        const top=saveLibraryUIElement("div","saveLibraryCardTop");
        const identity=saveLibraryUIElement("span","saveLibraryIdentity",`SAVE ${saveLibraryUIShortIdentity(entry.saveId)}`);
        const state=saveLibraryUIElement("strong",`saveLibraryState${active?" active":""}`,active?"ACTIVE SAVE":"LOCAL SAVE");
        top.append(identity,state);

        const title=saveLibraryUIElement("h4","",showdown.name||"Unnamed Showdown");
        const managers=saveLibraryUIElement("p","saveLibraryManagers",`${showdown.managers?.playerOne||"Manager 1"} vs ${showdown.managers?.playerTwo||"Manager 2"}`);
        const facts=saveLibraryUIElement("div","saveLibraryFacts");
        for(const [label,value] of [
            ["PROGRESS",saveLibraryUISaveProgress(showdown)],
            ["LEAGUE",saveLibraryUILeagueLabel(showdown)],
            ["CLUBS",saveLibraryUIClubLabel(showdown)],
            ["LOCAL STATE",saveLibraryUIFormatUpdated(showdown)]
        ]){
            const row=saveLibraryUIElement("div","saveLibraryFact");
            row.append(saveLibraryUIElement("span","",label),saveLibraryUIElement("strong","",value));
            facts.appendChild(row);
        }

        const actions=saveLibraryUIElement("div","saveLibraryActions");
        if(active){
            const open=saveLibraryUIElement("button","menuButton saveLibraryOpenButton","CONTINUE ACTIVE SHOWDOWN");
            open.type="button";
            open.addEventListener("click",()=>saveLibraryUICloseAndActivate("continueCareer"));
            actions.appendChild(open);
        }else{
            const select=saveLibraryUIElement("button","menuButton saveLibrarySelectButton","MAKE ACTIVE");
            select.type="button";
            select.addEventListener("click",()=>saveLibraryUISwitch(entry.saveId,select));
            actions.appendChild(select);
        }
        const remove=saveLibraryUIElement("button","compactButton dangerButton saveLibraryDeleteButton","DELETE THIS SAVE");
        remove.type="button";
        remove.addEventListener("click",()=>saveLibraryUIDelete(entry.saveId,showdown));
        actions.appendChild(remove);

        card.append(top,title,managers,facts,actions);
        return card;
    }

    function saveLibraryUICreateProfiles(library){
        const section=saveLibraryUIElement("section","saveLibraryProfiles");
        const heading=saveLibraryUIElement("div","saveLibrarySubheading");
        heading.append(
            saveLibraryUIElement("span","","LOCAL PROFILES"),
            saveLibraryUIElement("h4","","MANAGER IDENTITIES")
        );
        const note=saveLibraryUIElement("p","saveLibraryProfileNote","Names are labels, not identity keys. Two managers can use the same visible name and still remain separate Local Profiles.");
        const grid=saveLibraryUIElement("div","saveLibraryProfileGrid");
        const profiles=Array.isArray(library.profiles)?library.profiles:[];
        for(const profile of profiles){
            const references=(library.saves||[]).filter(entry=>{
                const ids=entry?.showdown?.identity?.managerProfileIds;
                return ids&&(ids.playerOne===profile.profileId||ids.playerTwo===profile.profileId);
            }).length;
            const card=saveLibraryUIElement("article","saveLibraryProfileCard");
            card.dataset.profileId=profile.profileId;
            card.append(
                saveLibraryUIElement("span","saveLibraryProfileIdentity",`PROFILE ${saveLibraryUIShortIdentity(profile.profileId)}`),
                saveLibraryUIElement("strong","",profile.displayName||"Unnamed Manager"),
                saveLibraryUIElement("small","",references?`Linked by stable identity to ${references} local Save${references===1?"":"s"}`:"Retained local identity · no current Save link")
            );
            grid.appendChild(card);
        }
        if(!profiles.length)grid.appendChild(saveLibraryUIElement("p","saveLibraryEmptyCopy","No Local Profiles exist yet. Starting a Showdown creates two stable manager identities before its first authoritative save."));
        section.append(heading,note,grid);
        return section;
    }

    function saveLibraryUIReadyPanel(library,panel){
        const saves=Array.isArray(library.saves)?library.saves.slice():[];
        saves.sort((a,b)=>{
            if(a.saveId===library.activeSaveId)return -1;
            if(b.saveId===library.activeSaveId)return 1;
            return String(b.showdown?.updatedAt||"").localeCompare(String(a.showdown?.updatedAt||""));
        });

        const summary=saveLibraryUIElement("div","saveLibrarySummary");
        summary.append(
            saveLibraryUIElement("div","saveLibrarySummaryItem",`${saves.length} LOCAL SAVE${saves.length===1?"":"S"}`),
            saveLibraryUIElement("div","saveLibrarySummaryItem",`${library.profiles?.length||0} LOCAL PROFILE${library.profiles?.length===1?"":"S"}`),
            saveLibraryUIElement("div",`saveLibrarySummaryItem${library.activeSaveId?" active":""}`,library.activeSaveId?"ACTIVE SAVE READY":"NO ACTIVE SAVE")
        );
        panel.appendChild(summary);

        const actions=saveLibraryUIElement("div","saveLibraryPrimaryActions");
        const create=saveLibraryUIElement("button","menuButton","NEW SHOWDOWN");
        create.type="button";
        create.addEventListener("click",()=>saveLibraryUICloseAndActivate("newShowdown"));
        actions.appendChild(create);
        panel.appendChild(actions);

        if(saves.length){
            const grid=saveLibraryUIElement("div","saveLibraryGrid");
            for(const entry of saves)grid.appendChild(saveLibraryUICreateSaveCard(entry,library.activeSaveId));
            panel.appendChild(grid);
        }else{
            const empty=saveLibraryUIElement("div","saveLibraryEmptyState");
            empty.append(
                saveLibraryUIElement("strong","","NO LOCAL SHOWDOWNS YET"),
                saveLibraryUIElement("p","","Create a Showdown to add the first Save. Future Showdowns are added alongside it instead of replacing it.")
            );
            panel.appendChild(empty);
        }
        panel.appendChild(saveLibraryUICreateProfiles(library));
    }

    function saveLibraryUICompatibilityPanel(panel){
        const state=saveLibraryUIElement("div","saveLibraryCompatibilityState");
        state.append(
            saveLibraryUIElement("span","saveLibraryState active","EXISTING CAREER DETECTED"),
            saveLibraryUIElement("strong","","READY FOR SAFE SAVE LIBRARY ACTIVATION"),
            saveLibraryUIElement("p","","This device still has the earlier single-career save format. Opening this panel does not migrate it. Continue the existing career to perform the proven one-time activation, then Save Library will expose it as a stable local Save.")
        );
        const action=saveLibraryUIElement("button","menuButton","CONTINUE EXISTING CAREER");
        action.type="button";
        action.addEventListener("click",()=>saveLibraryUICloseAndActivate("continueCareer"));
        state.appendChild(action);
        panel.appendChild(state);
    }

    function saveLibraryUIEmptyPanel(panel){
        const state=saveLibraryUIElement("div","saveLibraryEmptyState");
        state.append(
            saveLibraryUIElement("strong","","YOUR SAVE LIBRARY IS EMPTY"),
            saveLibraryUIElement("p","","Start a new rivalry. Two stable Local Profiles and one stable Save identity are created before the Showdown receives its first authoritative write.")
        );
        const action=saveLibraryUIElement("button","menuButton","CREATE FIRST SHOWDOWN");
        action.type="button";
        action.addEventListener("click",()=>saveLibraryUICloseAndActivate("newShowdown"));
        state.appendChild(action);
        panel.appendChild(state);
    }

    function saveLibraryUIBlockedPanel(panel,message){
        const state=saveLibraryUIElement("div","saveLibraryBlockedState");
        state.setAttribute("role","alert");
        state.append(
            saveLibraryUIElement("span","saveLibraryState blocked","SAVE LIBRARY UNAVAILABLE"),
            saveLibraryUIElement("strong","","NO LOCAL DATA WAS CHANGED"),
            saveLibraryUIElement("p","",message||"Save Library authority could not be verified, so switching, deletion and creation controls are unavailable.")
        );
        panel.appendChild(state);
    }

    function saveLibraryUIRender(){
        const content=document.getElementById("settingsContent");
        if(!content)return false;
        const existing=document.getElementById("saveLibraryProductPanel");
        if(existing)existing.remove();

        const panel=saveLibraryUIElement("section","settingsPanel saveLibraryProductPanel");
        panel.id="saveLibraryProductPanel";
        const heading=saveLibraryUIElement("div","settingsPanelHeading saveLibraryHeading");
        heading.append(
            saveLibraryUIElement("span","settingsPanelEyebrow","CAREER DATA"),
            saveLibraryUIElement("h3","","SAVE LIBRARY"),
            saveLibraryUIElement("p","","Switch between local Career Mode rivalries, create another without overwriting the current one, remove exactly one Save, and see the stable Local Profiles behind manager names.")
        );
        panel.appendChild(heading);

        const state=saveLibraryUIState();
        panel.dataset.libraryMode=state.mode;
        if(state.mode==="ready")saveLibraryUIReadyPanel(state.library,panel);
        else if(state.mode==="compatibility")saveLibraryUICompatibilityPanel(panel);
        else if(state.mode==="empty")saveLibraryUIEmptyPanel(panel);
        else saveLibraryUIBlockedPanel(panel,state.message);
        content.prepend(panel);

        const title=document.getElementById("settingsTitle");
        if(title)title.textContent="SAVE LIBRARY & SETTINGS";
        const close=document.getElementById("settingsClose");
        if(close)close.setAttribute("aria-label","Close Save Library and Settings");
        return true;
    }

    function saveLibraryUIBindRemountObserver(){
        const content=document.getElementById("settingsContent");
        if(!content||saveLibraryUIObserver)return;
        saveLibraryUIObserver=new MutationObserver(()=>{
            const overlay=document.getElementById("settingsOverlay");
            if(!overlay||overlay.classList.contains("hidden")||document.getElementById("saveLibraryProductPanel"))return;
            queueMicrotask(saveLibraryUIRender);
        });
        saveLibraryUIObserver.observe(content,{childList:true});
    }

    function mountSaveLibrarySettingsSurface(authorityIssue=""){
        saveLibraryUIAuthorityIssue=authorityIssue&&authorityIssue.message?authorityIssue.message:String(authorityIssue||"");
        saveLibraryUIBindRemountObserver();
        return saveLibraryUIRender();
    }

    root.mountSaveLibrarySettingsSurface=mountSaveLibrarySettingsSurface;
    root.renderSaveLibrarySettingsSurface=saveLibraryUIRender;
})(typeof window!=="undefined"?window:globalThis);