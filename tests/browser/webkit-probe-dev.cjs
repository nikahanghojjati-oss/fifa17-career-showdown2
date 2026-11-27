const {webkit}=require("playwright");
(async()=>{const b=await webkit.launch();const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:false});
const r=await p.evaluate(()=>{const c=document.createElement("canvas");const g2=c.getContext("webgl2"),g1=g2?null:document.createElement("canvas").getContext("webgl");return {ua:navigator.userAgent,webgl2:Boolean(g2),webgl:Boolean(g1),sw:"serviceWorker" in navigator,idb:"indexedDB" in window,touch:"ontouchstart" in window};});
console.log("WEBKIT_PROBE",b.version(),JSON.stringify(r));await b.close();})().catch(e=>{console.error("WEBKIT_PROBE_FAIL",e);process.exit(1);});
