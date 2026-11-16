"use strict";
// R94-05 scratch: builds tests/firebase/r94-index-roll-probe.cjs (untracked) from the career index suite's own helpers.
// It replays START (creation) and JOIN (redemption) when the History index head holds 499 and 500 entries, at the
// Rules level and through the real client code (js/sparkPrivatePairing.js + js/persistentNikDanielPair.js).
const fs=require("node:fs");const path=require("node:path");
const ROOT=path.resolve(__dirname,"../../../../..");
const src=fs.readFileSync(path.join(ROOT,"tests/firebase/career-index-emulator.cjs"),"utf8");
const a=src.indexOf("    if(!ENFORCED){\n      const legacy");const b=src.indexOf("  }finally{");
if(a<0||b<0)throw new Error("markers moved");
const body=`
    const outcome=async(label,promise)=>{try{await promise;console.log('R94ROLL '+label+' :: ALLOWED');return true;}catch(e){console.log('R94ROLL '+label+' :: REFUSED :: '+String(e&&e.code)+' :: '+String(e&&e.message).slice(0,300));return false;}};
    const fill=(base,n)=>Array.from({length:n},(_,i)=>rid(base+i));
    const seedHead=(uid,device,list,sealed)=>env.withSecurityRulesDisabled(async c=>{await setDoc(doc(c.firestore(),'accounts',uid,'careerIndex','current'),envelope({objectType:'careerIndex',objectId:'current',updatedAt:now,accountId:uid,deviceId:device,data:{rivalryIds:list,sealedPageCount:sealed}}));});
    const headOf=async uid=>{const h=await ids(env,uid);return h?{n:h.data.rivalryIds.length,sealed:h.data.sealedPageCount,bytes:JSON.stringify(h).length}:null;};
    await closeRivalry(env,OLD_ACTIVE);
    // Rules level, head 499 -> 500 (no page roll)
    await seedHead(D,dev[D],fill(0x100000,499),0);await seedHead(N,dev[N],fill(0x200000,499),0);
    await outcome('rules START head 499 (append to 500)',create(db[D],{uid:D,device:dev[D],target:X1,nowMs:tick()}));
    await outcome('rules JOIN  head 499 (append to 500)',redeem(db[N],{uid:N,device:dev[N],target:X1,nowMs:tick()}));
    console.log('R94ROLL heads '+JSON.stringify({D:await headOf(D),N:await headOf(N)}));
    await closeRivalry(env,X1);
    // Rules level, head 500 -> page roll for both managers
    await outcome('rules START head 500 (page roll)',create(db[D],{uid:D,device:dev[D],target:X2,nowMs:tick()}));
    await outcome('rules JOIN  head 500 (page roll)',redeem(db[N],{uid:N,device:dev[N],target:X2,nowMs:tick()}));
    console.log('R94ROLL heads '+JSON.stringify({D:await headOf(D),N:await headOf(N)}));
    // Real client code at a full head
    const PD='acct_prov_daniel',PN='acct_prov_nik';const pdev={[PD]:deviceId('a'),[PN]:deviceId('b')};
    await env.withSecurityRulesDisabled(async c=>{for(const uid of [PD,PN]){await setDoc(doc(c.firestore(),'accounts',uid),accountEnvelope(uid,now));await setDoc(doc(c.firestore(),'accounts',uid,'devices',pdev[uid]),deviceEnvelope(uid,pdev[uid],now));}});
    const pdb={[PD]:env.authenticatedContext(PD).firestore(),[PN]:env.authenticatedContext(PN).firestore()};
    const ctx=uid=>({services:{firestoreSdk,firestore:pdb[uid]},accountId:uid,deviceId:pdev[uid]});
    const identity=uid=>({schemaVersion:1,installationId:\`installation_\${pdev[uid].slice(7)}\`,deviceId:pdev[uid],createdAtEpochMs:t0-180000});
    const binding=(role,ch)=>({saveId:\`save_\${ch.repeat(24)}\`,profileId:\`profile_\${ch.repeat(24)}\`,managerRole:role,displayLabel:role==='playerOne'?'Daniel':'Nik'});
    const readIdx=(asUid,ofUid)=>Pair.readCareerIndex({firestore:pdb[asUid],firebaseSdk:firestoreSdk,accountId:ofUid});
    const provider=async(label,capability)=>{
      let created=null,redeemed=null;
      try{created=await Pairing.createPairing({user:{uid:PD},firestore:pdb[PD],firebaseSdk:firestoreSdk,identity:identity(PD),binding:binding('playerOne','a'),capability,nowEpochMs:tick(),cryptoImpl:require('node:crypto').webcrypto,durableWitness:Pair.createDurableCreationWitness(ctx(PD),'playerOne',Pair.managerByRole.playerOne)});}catch(e){created={ok:false,thrown:String(e&&e.code)+' '+String(e&&e.message).slice(0,200)};}
      console.log('R94ROLL client START '+label+' :: '+(created.ok?'ALLOWED':'REFUSED '+JSON.stringify(created).slice(0,400)));
      if(!created.ok)return;
      try{redeemed=await Pairing.redeemPairing({user:{uid:PN},firestore:pdb[PN],firebaseSdk:firestoreSdk,identity:identity(PN),binding:binding('playerTwo','b'),capability,nowEpochMs:tick(),cryptoImpl:require('node:crypto').webcrypto,durableWitness:Pair.createDurableRedemptionWitness(ctx(PN),'playerTwo',Pair.managerByRole.playerTwo,capability)});}catch(e){redeemed={ok:false,thrown:String(e&&e.code)+' '+String(e&&e.message).slice(0,200)};}
      console.log('R94ROLL client JOIN  '+label+' :: '+(redeemed.ok?'ALLOWED':'REFUSED '+JSON.stringify(redeemed).slice(0,400)));
    };
    const P1=rid(0x9001),P2=rid(0x9002),P3=rid(0x9003);
    await provider('first ever (empty index)',P1);await closeRivalry(env,P1);
    await seedHead(PD,pdev[PD],[...fill(0x300000,498),P1],0);await seedHead(PN,pdev[PN],[...fill(0x400000,498),P1],0);
    await provider('head 499 (append to 500)',P2);await closeRivalry(env,P2);
    await provider('head 500 (page roll)',P3);
    for(const uid of [PD,PN]){const r=await readIdx(uid,uid);console.log('R94ROLL client read '+uid+' :: '+r.status+' ids='+r.rivalryIds.length+' sealed='+r.sealedPageCount+' last='+(r.rivalryIds[r.rivalryIds.length-1]===P3));}
    console.log('R94ROLL DONE');
`;
fs.writeFileSync(path.join(ROOT,"tests/firebase/r94-index-roll-probe.cjs"),src.slice(0,a)+body+src.slice(b));
console.log("wrote tests/firebase/r94-index-roll-probe.cjs");
