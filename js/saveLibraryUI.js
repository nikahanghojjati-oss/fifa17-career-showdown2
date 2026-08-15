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

    function saveLibraryUIRestoreMutationFocus(preferredSaveId=""){
        const panel=document.getElementById("saveLibraryProductPanel");
        const dialog=document.getElementById("settingsDialog");
        if(!panel||!dialog)return;
        let control=null;
        if(preferredSaveId){
            const preferred=Array.from(panel.querySelectorAll(".saveLibraryCard")).find(card=>card.dataset.saveId===preferredSaveId);
            if(preferred)control=preferred.querySelector("button:not(:disabled)");
        }
        if(!control){
            const active=panel.querySelector(".saveLibraryCard.isActive");
            if(active)control=active.querySelector("button:not(:disabled)");
        }
        if(!control)control=panel.querySelector(".saveLibraryCard button:not(:disabled),.saveLibraryPrimaryActions button:not(:disabled),button:not(:disabled)");
        const target=control||dialog;
        if(typeof target.focus==="function")target.focus({preventScroll:true});
    }

    function saveLibraryUIRestoreIdentityFocus(linkKey){
        const panel=document.getElementById("saveLibraryProductPanel");
        const dialog=document.getElementById("settingsDialog");
        if(!panel||!dialog)return;
        const row=Array.from(panel.querySelectorAll(".saveLibraryIdentityLinkRow")).find(item=>item.dataset.identityLinkKey===linkKey);
        const target=(row&&row.querySelector("select,button:not(:disabled)"))||panel.querySelector(".saveLibraryIdentityLinks select,.saveLibraryIdentityLinks button:not(:disabled)")||dialog;
        if(typeof target.focus==="function")target.focus({preventScroll:true});
    }

    function saveLibraryUIRestoreProfileFocus(profileId){
        const panel=document.getElementById("saveLibraryProductPanel");
        const dialog=document.getElementById("settingsDialog");
        if(!panel||!dialog)return;
        const card=Array.from(panel.querySelectorAll(".saveLibraryProfileCard")).find(item=>item.dataset.profileId===profileId);
        const target=(card&&card.querySelector(".saveLibraryProfileEditButton"))||panel.querySelector(".saveLibraryProfileEditButton")||dialog;
        if(typeof target.focus==="function")target.focus({preventScroll:true});
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
            saveLibraryUIRestoreMutationFocus(saveId);
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
            saveLibraryUIRestoreMutationFocus(result.activeSaveId||"");
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

    async function saveLibraryUIUpdateProfileDisplayName(profile,input,button){
        if(saveLibraryUIBusy)return;
        const runtime=root.CareerModeSaveLibraryRuntime;
        if(!runtime||typeof runtime.updateProfileDisplayName!=="function"){
            saveLibraryUIShowNotice("Local Profile display-label editing is unavailable in this session.");
            return;
        }
        const displayName=input.value.trim();
        input.setCustomValidity(displayName?"":"Enter a display label for this Local Profile.");
        if(!input.reportValidity())return;

        saveLibraryUIBusy=true;
        input.disabled=true;
        button.disabled=true;
        button.setAttribute("aria-busy","true");
        try{
            const result=await runtime.updateProfileDisplayName(profile.profileId,displayName);
            if(!result||result.ok!==true)throw new Error("The Save Library did not confirm the profile-label change.");
            saveLibraryUIShowNotice(result.changed
                ?"Local Profile label updated. Saved and historical Showdown names stayed unchanged."
                :"That Local Profile label is already current.","success");
            saveLibraryUIRender();
            saveLibraryUIRestoreProfileFocus(profile.profileId);
        }catch(error){
            saveLibraryUIShowNotice(`The Local Profile label was not changed. ${error&&error.message?error.message:"No saved data was changed."}`);
            if(input.isConnected)input.focus({preventScroll:true});
        }finally{
            saveLibraryUIBusy=false;
            if(input.isConnected)input.disabled=false;
            if(button.isConnected){button.disabled=false;button.removeAttribute("aria-busy");}
        }
    }

    function saveLibraryUICreateProfileEditor(profile){
        const editor=saveLibraryUIElement("div","saveLibraryProfileEditor");
        const formId=`profile-label-${profile.profileId}`;
        const edit=saveLibraryUIElement("button","compactButton saveLibraryProfileEditButton","EDIT DISPLAY LABEL");
        edit.type="button";
        edit.setAttribute("aria-expanded","false");
        edit.setAttribute("aria-controls",formId);

        const form=document.createElement("form");
        form.id=formId;
        form.className="saveLibraryProfileEditForm";
        form.hidden=true;
        const inputId=`profile-label-input-${profile.profileId}`;
        const helpId=`profile-label-help-${profile.profileId}`;
        const label=saveLibraryUIElement("label","",`DISPLAY LABEL FOR PROFILE ${saveLibraryUIShortIdentity(profile.profileId)}`);
        label.htmlFor=inputId;
        const input=document.createElement("input");
        input.id=inputId;
        input.className="saveLibraryProfileNameInput";
        input.type="text";
        input.value=profile.displayName||"";
        input.required=true;
        input.autocomplete="off";
        input.setAttribute("aria-describedby",helpId);
        input.addEventListener("input",()=>input.setCustomValidity(""));
        const help=saveLibraryUIElement("small","saveLibraryProfileEditHelp","Updates this Local Profile label only. Saved and historical Showdown manager names stay unchanged.");
        help.id=helpId;
        const actions=saveLibraryUIElement("div","saveLibraryProfileEditActions");
        const save=saveLibraryUIElement("button","compactButton saveLibraryProfileSaveButton","SAVE LABEL");
        save.type="submit";
        const cancel=saveLibraryUIElement("button","compactButton saveLibraryProfileCancelButton","CANCEL");
        cancel.type="button";
        actions.append(save,cancel);
        form.append(label,input,help,actions);

        edit.addEventListener("click",()=>{
            const opening=form.hidden;
            form.hidden=!opening;
            edit.setAttribute("aria-expanded",String(opening));
            if(opening){input.focus({preventScroll:true});input.select();}
        });
        cancel.addEventListener("click",()=>{
            input.value=profile.displayName||"";
            input.setCustomValidity("");
            form.hidden=true;
            edit.setAttribute("aria-expanded","false");
            edit.focus({preventScroll:true});
        });
        form.addEventListener("submit",event=>{
            event.preventDefault();
            saveLibraryUIUpdateProfileDisplayName(profile,input,save);
        });
        editor.append(edit,form);
        return editor;
    }

    function saveLibraryUICreateProfiles(library){
        const section=saveLibraryUIElement("section","saveLibraryProfiles");
        const heading=saveLibraryUIElement("div","saveLibrarySubheading");
        heading.append(
            saveLibraryUIElement("span","","LOCAL PROFILES"),
            saveLibraryUIElement("h4","","MANAGER IDENTITIES")
        );
        const note=saveLibraryUIElement("p","saveLibraryProfileNote","Names are labels, not identity keys. Two managers can use the same visible name and still remain separate Local Profiles. Editing a display label never rewrites saved or historical Showdown manager names.");
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
                saveLibraryUIElement("strong","saveLibraryProfileName",profile.displayName||"Unnamed Manager"),
                saveLibraryUIElement("small","",references?`Linked by stable identity to ${references} local Save${references===1?"":"s"}`:"Retained local identity · no current Save link"),
                saveLibraryUICreateProfileEditor(profile)
            );
            grid.appendChild(card);
        }
        if(!profiles.length)grid.appendChild(saveLibraryUIElement("p","saveLibraryEmptyCopy","No Local Profiles exist yet. Starting a Showdown creates two stable manager identities before its first authoritative save."));
        section.append(heading,note,grid);
        return section;
    }

    function saveLibraryUIProfileOption(profile){
        const option=document.createElement("option");
        option.value=profile.profileId;
        option.textContent=`${profile.displayName||"Unnamed Manager"} · PROFILE ${saveLibraryUIShortIdentity(profile.profileId)}`;
        return option;
    }

    async function saveLibraryUIApplyIdentityLink(config,select,button){
        if(saveLibraryUIBusy)return;
        const runtime=root.CareerModeSaveLibraryRuntime;
        const profileId=config.kind==="legacy"&&!select.value?null:select.value;
        if(profileId===config.currentProfileId){
            saveLibraryUIShowNotice("That manager identity link is already current.","success");
            return;
        }
        const profileLabel=profileId?`PROFILE ${saveLibraryUIShortIdentity(profileId)}`:"UNRESOLVED";
        const action=config.kind==="legacy"&&profileId===null
            ? `Mark “${config.managerName}” in historical “${config.showdownName}” as unresolved? This removes only its explicit Local Profile link. The historical display name stays unchanged.`
            : `Link “${config.managerName}” in “${config.showdownName}” to ${profileLabel}? This changes stable manager identity only. Saved and historical display names stay unchanged.`;
        if(!root.confirm(action))return;
        if(!runtime||typeof runtime.assignSaveManagerProfile!=="function"||typeof runtime.assignLegacyManagerProfile!=="function"){
            saveLibraryUIShowNotice("Explicit manager identity linkage is unavailable in this session.");
            return;
        }
        saveLibraryUIBusy=true;
        button.disabled=true;
        select.disabled=true;
        button.setAttribute("aria-busy","true");
        try{
            const result=config.kind==="save"
                ?await runtime.assignSaveManagerProfile(config.sourceId,config.role,profileId)
                :await runtime.assignLegacyManagerProfile(config.sourceId,config.role,profileId);
            if(!result||result.ok!==true)throw new Error("The identity runtime did not confirm the change.");
            if(typeof root.refreshMainMenuExperience==="function")root.refreshMainMenuExperience();
            saveLibraryUIShowNotice(profileId?"Manager identity link updated.":"Historical manager identity is now explicitly unresolved.","success");
            saveLibraryUIRender();
            saveLibraryUIRestoreIdentityFocus(config.linkKey);
        }catch(error){
            saveLibraryUIShowNotice(`Manager identity was not changed. ${error&&error.message?error.message:"No saved data was changed."}`);
        }finally{
            saveLibraryUIBusy=false;
            if(button.isConnected){button.disabled=false;button.removeAttribute("aria-busy");}
            if(select.isConnected)select.disabled=false;
        }
    }

    function saveLibraryUICreateIdentityLinkRow(config,profiles){
        const row=saveLibraryUIElement("div","saveLibraryIdentityLinkRow");
        row.dataset.identityLinkKey=config.linkKey;
        row.dataset.linkKind=config.kind;
        row.dataset.sourceId=config.sourceId;
        row.dataset.role=config.role;

        const context=saveLibraryUIElement("div","saveLibraryIdentityLinkContext");
        context.append(
            saveLibraryUIElement("strong","",`${config.role==="playerOne"?"MANAGER 1":"MANAGER 2"} · ${config.managerName}`),
            saveLibraryUIElement("small","",config.currentProfileId?`Current: PROFILE ${saveLibraryUIShortIdentity(config.currentProfileId)}`:"Current: UNRESOLVED")
        );

        const select=document.createElement("select");
        select.className="saveLibraryIdentitySelect";
        select.setAttribute("aria-label",`${config.kind==="save"?"Link":"Map historical"} ${config.managerName} to a Local Profile`);
        if(config.kind==="legacy"){
            const unresolved=document.createElement("option");
            unresolved.value="";
            unresolved.textContent="UNRESOLVED · NO LOCAL PROFILE LINK";
            select.appendChild(unresolved);
        }
        const knownCurrent=profiles.some(profile=>profile.profileId===config.currentProfileId);
        if(config.currentProfileId&&!knownCurrent){
            const unavailable=document.createElement("option");
            unavailable.value=config.currentProfileId;
            unavailable.textContent=`CURRENT PROFILE ${saveLibraryUIShortIdentity(config.currentProfileId)} · NOT PRESENT ON THIS DEVICE`;
            select.appendChild(unavailable);
        }
        for(const profile of profiles)select.appendChild(saveLibraryUIProfileOption(profile));
        select.value=config.currentProfileId||"";

        const apply=saveLibraryUIElement("button","compactButton saveLibraryIdentityApply",config.kind==="save"?"APPLY LINK":"APPLY HISTORICAL MAP");
        apply.type="button";
        apply.addEventListener("click",()=>saveLibraryUIApplyIdentityLink(config,select,apply));
        row.append(context,select,apply);
        return row;
    }

    function saveLibraryUICreateIdentityLinks(library){
        const section=saveLibraryUIElement("section","saveLibraryIdentityLinks");
        const heading=saveLibraryUIElement("div","saveLibrarySubheading");
        heading.append(
            saveLibraryUIElement("span","","EXPLICIT LINKAGE"),
            saveLibraryUIElement("h4","","MANAGER IDENTITY LINKS")
        );
        const note=saveLibraryUIElement("p","saveLibraryProfileNote","Use this only when you know two Save roles represent the same real manager. No names are matched automatically. Linking changes stable identity references only; existing Showdown and Legacy display names remain historical labels. Historical roles can stay explicitly unresolved.");
        section.append(heading,note);

        const runtime=root.CareerModeSaveLibraryRuntime;
        const snapshot=runtime&&typeof runtime.getIdentityMappingSnapshot==="function"?runtime.getIdentityMappingSnapshot():null;
        if(!snapshot||snapshot.ok!==true){
            section.appendChild(saveLibraryUIElement("p","saveLibraryIdentityUnavailable",`Identity linkage is unavailable. ${snapshot&&snapshot.error?snapshot.error:"Exact identity state could not be verified."}`));
            return section;
        }

        const profiles=Array.isArray(snapshot.library.profiles)?snapshot.library.profiles:[];
        const saves=Array.isArray(snapshot.library.saves)?snapshot.library.saves:[];
        if(!profiles.length){
            section.appendChild(saveLibraryUIElement("p","saveLibraryIdentityUnavailable","Create a Showdown first. Explicit linkage requires an existing stable Local Profile."));
            return section;
        }

        if(saves.length){
            const localHeading=saveLibraryUIElement("h5","saveLibraryIdentityGroupHeading","LOCAL SAVE ROLES");
            const localList=saveLibraryUIElement("div","saveLibraryIdentityGroup");
            for(const entry of saves){
                const showdown=entry.showdown||{};
                const refs=showdown.identity&&showdown.identity.managerProfileIds||{};
                const block=saveLibraryUIElement("article","saveLibraryIdentitySource");
                block.append(
                    saveLibraryUIElement("strong","",showdown.name||"Unnamed Showdown"),
                    saveLibraryUIElement("small","",`SAVE ${saveLibraryUIShortIdentity(entry.saveId)}`)
                );
                for(const role of ["playerOne","playerTwo"]){
                    const linkKey=`save:${entry.saveId}:${role}`;
                    block.appendChild(saveLibraryUICreateIdentityLinkRow({kind:"save",sourceId:entry.saveId,role,managerName:(showdown.managers&&showdown.managers[role])||(role==="playerOne"?"Manager 1":"Manager 2"),showdownName:showdown.name||"Unnamed Showdown",currentProfileId:refs[role]||null,linkKey},profiles));
                }
                localList.appendChild(block);
            }
            section.append(localHeading,localList);
        }

        const saveIds=new Set(saves.map(entry=>entry&&entry.saveId).filter(Boolean));
        const showdownIds=new Set(saves.map(entry=>String(entry&&entry.showdown&&entry.showdown.id)).filter(value=>value!=="undefined"&&value!=="null"));
        const historical=(snapshot.legacyShowdowns||[]).filter(record=>{
            const stable=record&&record.identity&&record.identity.saveId;
            return !(stable&&saveIds.has(stable))&&!showdownIds.has(String(record&&record.id));
        });
        if(historical.length){
            const historicalHeading=saveLibraryUIElement("h5","saveLibraryIdentityGroupHeading","HISTORICAL-ONLY LEGACY ROLES");
            const historicalList=saveLibraryUIElement("div","saveLibraryIdentityGroup");
            for(const showdown of historical){
                const refs=showdown&&showdown.identity&&showdown.identity.managerProfileIds||{};
                const sourceId=String(showdown&&showdown.id);
                const block=saveLibraryUIElement("article","saveLibraryIdentitySource historical");
                block.append(
                    saveLibraryUIElement("strong","",showdown&&showdown.name||"Historical Showdown"),
                    saveLibraryUIElement("small","",showdown&&showdown.identity&&showdown.identity.saveId?`LEGACY SAVE ${saveLibraryUIShortIdentity(showdown.identity.saveId)}`:"LEGACY · STABLE IDENTITY WILL BE DERIVED ON EXPLICIT MAP")
                );
                for(const role of ["playerOne","playerTwo"]){
                    const linkKey=`legacy:${sourceId}:${role}`;
                    block.appendChild(saveLibraryUICreateIdentityLinkRow({kind:"legacy",sourceId,role,managerName:(showdown&&showdown.managers&&showdown.managers[role])||(role==="playerOne"?"Manager 1":"Manager 2"),showdownName:showdown&&showdown.name||"Historical Showdown",currentProfileId:refs[role]||null,linkKey},profiles));
                }
                historicalList.appendChild(block);
            }
            section.append(historicalHeading,historicalList);
        }
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
        panel.appendChild(saveLibraryUICreateIdentityLinks(library));
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
            saveLibraryUIElement("p","","Switch between local Career Mode rivalries, create another without overwriting the current one, remove exactly one Save, inspect Local Profiles, and explicitly link the same manager across Saves or historical Legacy records when you know the identity relationship.")
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
