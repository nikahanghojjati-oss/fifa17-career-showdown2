"use strict";
// r78 (HO-029): the app no longer calls the native window.confirm(); every confirm is the shared marble box
// (js/showdownConfirm.js, #showdownConfirm). Browser audits that used page.on/once("dialog") to answer confirm() answer the
// box instead. The in-page answerer clicks OK or Cancel on the box, exactly as a player would, and records its words
// (heading + body = the call site's original confirm() message).
//   installMarbleConfirmAnswers(page,{answer})  answer every box: true = OK, false = Cancel, undefined = leave it open
//   answerNextMarbleConfirm(page,accept=true)   answer only the next box (like page.once("dialog"))
//   marbleConfirmMessages(page)                 the messages of the boxes answered so far
function marbleConfirmAnswerer(defaultAnswer){
  if(defaultAnswer!==undefined)window.__marbleConfirmDefault=defaultAnswer;
  if(window.__marbleConfirmInstalled)return;
  window.__marbleConfirmInstalled=true;
  window.__marbleConfirmMessages=window.__marbleConfirmMessages||[];
  window.__marbleConfirmQueue=window.__marbleConfirmQueue||[];
  const answer=()=>{
    const layer=document.getElementById("showdownConfirm");
    if(!layer||layer.dataset.auditAnswered)return;
    const next=window.__marbleConfirmQueue.length?window.__marbleConfirmQueue.shift():window.__marbleConfirmDefault;
    if(next!==true&&next!==false)return;
    layer.dataset.auditAnswered="1";
    window.__marbleConfirmMessages.push([...layer.querySelectorAll(".r78-modal__title,.r78-modal__body")].map(node=>node.textContent).join(" "));
    layer.querySelector(next?"[data-r78-confirm]":"[data-r78-cancel]").click();
  };
  window.__marbleConfirmAnswerNow=answer;
  const start=()=>new MutationObserver(answer).observe(document.documentElement,{childList:true,subtree:true});
  if(document.documentElement)start();else document.addEventListener("DOMContentLoaded",start,{once:true});
}

async function installMarbleConfirmAnswers(page,{answer}={}){
  await page.addInitScript(marbleConfirmAnswerer,answer);
  await page.evaluate(marbleConfirmAnswerer,answer).catch(()=>{});
}

async function answerNextMarbleConfirm(page,accept=true){
  await page.evaluate(marbleConfirmAnswerer,undefined);
  await page.evaluate(value=>{window.__marbleConfirmQueue.push(value);window.__marbleConfirmAnswerNow();},accept===true);
}

function marbleConfirmMessages(page){
  return page.evaluate(()=>window.__marbleConfirmMessages||[]);
}

module.exports={installMarbleConfirmAnswers,answerNextMarbleConfirm,marbleConfirmMessages};
