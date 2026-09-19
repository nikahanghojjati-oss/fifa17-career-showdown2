/* Network-only entry supported by already-installed r29 workers. No game storage or provider writes. */
(function(){
    "use strict";
    const scope = new URL("./", location.href);
    const card = document.createElement("main");
    card.className = "acceptanceCard";
    card.style.maxWidth = "600px";
    card.style.margin = "0 auto";
    const heading = document.createElement("h1");
    heading.textContent = "Update Career Mode Showdown";
    const copy = document.createElement("p");
    copy.textContent = "Your saved Showdown, clubs and player identity stay in place. Finish any unsaved entry and close other game tabs before updating.";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "acceptanceButton";
    button.textContent = "UPDATE AND RETURN TO GAME";
    const status = document.createElement("p");
    status.id = "appUpdateStatus";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.textContent = "Ready to check for the latest version.";
    const back = document.createElement("a");
    back.href = scope.href;
    back.textContent = "Return to game";
    card.append(heading, copy, button, status, back);
    document.body.replaceChildren(card);

    function ask(worker, type){
        return new Promise((resolve, reject) => {
            const channel = new MessageChannel();
            const finish = (error, value) => {
                clearTimeout(timer);
                channel.port1.close();
                channel.port2.close();
                error ? reject(error) : resolve(value);
            };
            const timer = setTimeout(() => finish(new Error("The update service did not respond. Please try again.")), 15000);
            channel.port1.onmessage = event => finish(null, event.data);
            try{ worker.postMessage({type}, [channel.port2]); }
            catch(error){ finish(error); }
        });
    }

    async function waitUntil(predicate, message){
        const deadline = Date.now() + 90000;
        while(Date.now() < deadline){
            const value = predicate();
            if(value) return value;
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        throw new Error(message);
    }

    button.addEventListener("click", async () => {
        button.disabled = true;
        status.textContent = "Downloading and checking the latest version. Keep this page open…";
        try{
            if(!("serviceWorker" in navigator)) throw new Error("This browser cannot use the update service. Return to the game and reload it.");
            const response = await fetch(new URL("service-worker.js", scope), {cache:"no-store", signal:AbortSignal.timeout(20000)});
            if(!response.ok) throw new Error("The latest version could not be reached. Check your connection and try again.");
            const source = await response.text();
            const expected = source.match(/const RUNTIME_REVISION = "([^"]+)"/)?.[1];
            if(!expected) throw new Error("The latest version could not be verified. Your current game is unchanged.");
            let registration = await navigator.serviceWorker.getRegistration(scope.href);
            if(!registration || registration.scope !== scope.href){
                registration = await navigator.serviceWorker.register(new URL("service-worker.js", scope).href, {scope:scope.href, updateViaCache:"none"});
            }else{
                await registration.update();
            }
            await waitUntil(() => !registration.installing && (registration.waiting || registration.active), "The update is still downloading. Check your connection and try again.");
            const worker = registration.waiting || registration.active;
            const verified = await ask(worker, "CMS_GET_CACHE_STATUS");
            if(!verified.ok || !verified.current?.ok || verified.revision !== expected){
                throw new Error("The complete latest version is not ready yet. Please try again shortly; your Showdown is unchanged.");
            }
            if(registration.waiting){
                const accepted = await ask(worker, "CMS_ACTIVATE_UPDATE");
                if(!accepted.ok || accepted.type !== "CMS_ACTIVATION_ACCEPTED") throw new Error("The update was not activated. Please try again.");
                await waitUntil(() => worker.state === "activated" && navigator.serviceWorker.controller === worker, "The update is ready. Close other game tabs and try again.");
            }else{
                await waitUntil(() => navigator.serviceWorker.controller === worker, "The update is ready. Reopen this update link to finish.");
            }
            const cleared = await ask(worker, "CMS_CLEAR_ROLLBACK");
            if(!cleared.ok) throw new Error("The current version could not be selected. Please try again.");
            status.textContent = "Update verified. Returning to your game…";
            location.replace(scope.href);
        }catch(error){
            status.textContent = error?.message || "The update could not finish. Your Showdown has not been changed.";
            button.disabled = false;
        }
    });
})();
