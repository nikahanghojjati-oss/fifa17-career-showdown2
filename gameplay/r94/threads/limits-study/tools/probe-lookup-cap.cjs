"use strict";
// R94-05 probe: does the Firestore emulator enforce the Rules document-access caps (10 per document, 20 per multi-document request)?
const path=require("node:path");
const ROOT=process.env.REPO_ROOT;
const rut=require("@firebase/rules-unit-testing");
const fs=require("firebase/firestore");
fs.setLogLevel("silent");
const [host,port]=process.env.FIRESTORE_EMULATOR_HOST.split(":");
const ex=(tag,n)=>Array.from({length:n},(_,i)=>`!exists(/databases/$(database)/documents/pad/${tag}${i})`).join(" && ")||"true";
const rules=`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /a/{id} { allow write: if ${ex("a",10)}; }
    match /b/{id} { allow write: if ${ex("b",11)}; }
    match /c/{id} { allow write: if ${ex("c",5)}; }
    match /d/{id} { allow write: if ${ex("d",5)}; }
    match /e/{id} { allow write: if ${ex("e",5)}; }
    match /f/{id} { allow write: if ${ex("f",5)}; }
    match /g/{id} { allow write: if ${ex("g",6)}; }
    // same 5 paths as c (does a repeat across documents count again?)
    match /c2/{id} { allow write: if ${ex("c",5)}; }
    match /c3/{id} { allow write: if ${ex("c",5)}; }
    match /c4/{id} { allow write: if ${ex("c",5)}; }
    match /c5/{id} { allow write: if ${ex("c",5)}; }
    // same path 12 times in one document
    match /same/{id} { allow write: if ${Array.from({length:12},()=>"!exists(/databases/$(database)/documents/pad/s)").join(" && ")}; }
    // get + exists + getAfter of one path
    match /mix/{id} { allow write: if ${Array.from({length:4},(_,i)=>`!exists(/databases/$(database)/documents/pad/m${i}) && getAfter(/databases/$(database)/documents/pad/m${i}) == null && !existsAfter(/databases/$(database)/documents/pad/m${i})`).join(" && ")}; }
    match /mix6/{id} { allow write: if ${Array.from({length:6},(_,i)=>`!exists(/databases/$(database)/documents/pad/m${i}) && getAfter(/databases/$(database)/documents/pad/m${i}) == null`).join(" && ")}; }
    match /r10/{id} { allow read: if ${ex("r",10)}; }
    match /r11/{id} { allow read: if ${ex("r",11)}; }
  }
}`;
(async()=>{
  const env=await rut.initializeTestEnvironment({projectId:"demo-r94-05-probe",firestore:{rules,host,port:Number(port)}});
  const db=env.authenticatedContext("u").firestore();
  const t=async(name,fn)=>{try{await fn();console.log(`ALLOWED  ${name}`);}catch(e){console.log(`REFUSED  ${name} :: ${String(e.message).replace(/\s+/g," ").slice(-330)}`);}};
  const batch=async(...cols)=>{const b=fs.writeBatch(db);for(const c of cols)b.set(fs.doc(db,c,"x"+Math.random().toString(36).slice(2)),{v:1});await b.commit();};
  const tx=async(...cols)=>fs.runTransaction(db,async t=>{for(const c of cols)t.set(fs.doc(db,c,"x"+Math.random().toString(36).slice(2)),{v:1});});
  await t("single doc, 10 distinct lookups",()=>fs.setDoc(fs.doc(db,"a","1"),{v:1}));
  await t("single doc, 11 distinct lookups",()=>fs.setDoc(fs.doc(db,"b","1"),{v:1}));
  await t("single doc, same path 12 times",()=>fs.setDoc(fs.doc(db,"same","1"),{v:1}));
  await t("single doc, 4 paths each exists+getAfter+existsAfter",()=>fs.setDoc(fs.doc(db,"mix","1"),{v:1}));
  await t("single doc, 6 paths each exists+getAfter (12 if counted apart)",()=>fs.setDoc(fs.doc(db,"mix6","1"),{v:1}));
  await t("batch 4 docs x 5 distinct = 20",()=>batch("c","d","e","f"));
  await t("batch 3 docs x 5 + 1 doc x 6 = 21",()=>batch("c","d","e","g"));
  await t("batch 2 docs x 10 + ... a + c + d = 20",()=>batch("a","c","d"));
  await t("batch a(10) + c(5) + g(6) = 21",()=>batch("a","c","g"));
  await t("batch 5 docs, same 5 paths each (25 if counted per doc, 5 if cached)",()=>batch("c","c2","c3","c4","c5"));
  await t("transaction 4 docs x 5 = 20",()=>tx("c","d","e","f"));
  await t("transaction 3x5 + 6 = 21",()=>tx("c","d","e","g"));
  await t("transaction single doc 10",()=>tx("a"));
  await t("transaction single doc 11",()=>tx("b"));
  await env.withSecurityRulesDisabled(async c=>{await fs.setDoc(fs.doc(c.firestore(),"r10","1"),{v:1});await fs.setDoc(fs.doc(c.firestore(),"r11","1"),{v:1});});
  await t("get, 10 lookups",()=>fs.getDoc(fs.doc(db,"r10","1")));
  await t("get, 11 lookups",()=>fs.getDoc(fs.doc(db,"r11","1")));
  await t("list, 10 lookups",()=>fs.getDocs(fs.collection(db,"r10")));
  await t("list, 11 lookups",()=>fs.getDocs(fs.collection(db,"r11")));
  await env.cleanup();
})().catch(e=>{console.error(e);process.exit(1);});
