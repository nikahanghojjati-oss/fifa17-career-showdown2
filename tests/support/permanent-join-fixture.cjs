"use strict";
// Existing partners use CMS17- for Home JOIN. Seed their real authority, not the retired markerless test path.
module.exports=function seedPermanentJoin(docs,rivalryId,priorRivalryId){
  const ts=ms=>({toMillis:()=>ms}),now=Date.now();
  for(const [uid,other,myRole] of [["uid_nik","uid_daniel","playerTwo"],["uid_daniel","uid_nik","playerOne"]]){
    const key=`accounts/${uid}/partner/current`;
    if(!docs.has(key))docs.set(key,{schemaVersion:1,partnerAccountId:other,myRole,pairedViaRivalryId:priorRivalryId,pairedAt:ts(now-60000),active:true,updatedAt:ts(now-60000)});
  }
  const env=(type,data)=>({schemaVersion:1,objectType:type,objectId:rivalryId,revision:0,lifecycleState:"live",contentHash:"sha256:"+"a".repeat(64),data});
  const root=`rivalries/${rivalryId}`;
  if(!docs.has(root))docs.set(root,env("rivalry",{connectionState:"pending-pair",authorizedAccountIds:["uid_daniel"],managerSlots:[{slotId:"playerOne",accountId:"uid_daniel",entitlementState:"active"},{slotId:"playerTwo",accountId:null,entitlementState:"open"}]}));
  docs.set(`${root}/invites/${rivalryId}`,env("invite",{purpose:"rivalry-pairing",state:"open",slotId:"playerTwo",createdByAccountId:"uid_daniel",expiresAt:ts(now+29*60000)}));
};
