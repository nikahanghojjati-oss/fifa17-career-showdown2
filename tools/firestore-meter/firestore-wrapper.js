// Served in place of https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js (measurement harness only).
// Re-exports the real SDK (served at __real-firebase-firestore.js) and shadows the functions the app uses so every
// document read/write is reported to Node through the exposed binding __cmsMeterEvent.
import * as R from "https://www.gstatic.com/firebasejs/12.17.0/__real-firebase-firestore.js";
export * from "https://www.gstatic.com/firebasejs/12.17.0/__real-firebase-firestore.js";

Error.stackTraceLimit = 60;
const emit = e => { try { if (typeof globalThis.__cmsMeterEvent === "function") globalThis.__cmsMeterEvent({ t: Date.now(), ...e }); } catch (_) {} };
let seq = 0;
function stackChain() {
  const lines = String(new Error().stack || "").split("\n").slice(1);
  const mods = [];
  for (const line of lines) {
    if (/__real-firebase-firestore|firebase-firestore\.js|firebase-app\.js|firebase-auth\.js|gstatic\.com/.test(line)) continue;
    const m = line.match(/\/((?:js|visual-assets|home|season-results|final-winner|standings|data)\/[^\s:)?]*?\.js)/) || line.match(/\/([A-Za-z0-9_.\-]+\.js)(?:\?|:)/);
    if (m && !mods.includes(m[1])) mods.push(m[1]);
    if (mods.length >= 4) break;
  }
  return mods;
}
const pathOf = ref => { try { return ref && ref.path ? ref.path : (ref && ref._query ? "QUERY:" + (ref._query.path ? ref._query.path.canonicalString() : "?") : "?"); } catch (_) { return "?"; } };

export async function getDoc(ref) {
  const chain = stackChain();
  emit({ k: "read", op: "getDoc", path: pathOf(ref), n: 1, chain, tx: 0 });
  return R.getDoc(ref);
}
export async function getDocFromServer(ref) {
  const chain = stackChain();
  emit({ k: "read", op: "getDocFromServer", path: pathOf(ref), n: 1, chain, tx: 0 });
  return R.getDocFromServer(ref);
}
export async function getDocs(q) {
  const chain = stackChain();
  const snap = await R.getDocs(q);
  emit({ k: "read", op: "getDocs", path: pathOf(q), n: Math.max(1, snap.size), chain, tx: 0 });
  return snap;
}
export function onSnapshot(...args) {
  const chain = stackChain();
  emit({ k: "listener", op: "onSnapshot", path: pathOf(args[0]), n: 0, chain, tx: 0 });
  return R.onSnapshot(...args);
}
export async function setDoc(ref, ...rest) { const chain = stackChain(); const r = await R.setDoc(ref, ...rest); emit({ k: "write", op: "setDoc", path: pathOf(ref), n: 1, chain, tx: 0 }); return r; }
export async function updateDoc(ref, ...rest) { const chain = stackChain(); const r = await R.updateDoc(ref, ...rest); emit({ k: "write", op: "updateDoc", path: pathOf(ref), n: 1, chain, tx: 0 }); return r; }
export async function deleteDoc(ref) { const chain = stackChain(); const r = await R.deleteDoc(ref); emit({ k: "write", op: "deleteDoc", path: pathOf(ref), n: 1, chain, tx: 0 }); return r; }
export async function addDoc(ref, data) { const chain = stackChain(); const r = await R.addDoc(ref, data); emit({ k: "write", op: "addDoc", path: pathOf(ref), n: 1, chain, tx: 0 }); return r; }
export function writeBatch(db) {
  const chain = stackChain();
  const b = R.writeBatch(db); const paths = [];
  const proxy = new Proxy(b, { get(t, p) {
    if (p === "set" || p === "update" || p === "delete") return (ref, ...a) => { paths.push(pathOf(ref)); t[p](ref, ...a); return proxy; };
    if (p === "commit") return async () => { const r = await t.commit(); for (const x of paths) emit({ k: "write", op: "batch", path: x, n: 1, chain, tx: 0 }); return r; };
    const v = t[p]; return typeof v === "function" ? v.bind(t) : v;
  } });
  return proxy;
}

export function runTransaction(db, updateFn, options) {
  const chain = stackChain();
  const tx = ++seq;
  let attempts = 0, reads = 0, pending = [];
  const t0 = Date.now();
  emit({ k: "txstart", tx, chain });
  return R.runTransaction(db, async transaction => {
    attempts += 1; pending = [];
    const opChain = () => { const c = stackChain(); return c.length ? c : chain; };
    const proxy = {
      get: ref => { reads += 1; emit({ k: "read", op: "tx.get", path: pathOf(ref), n: 1, chain: opChain(), caller: chain, tx, attempt: attempts }); return transaction.get(ref); },
      set: (ref, ...a) => { pending.push({ op: "tx.set", path: pathOf(ref) }); transaction.set(ref, ...a); return proxy; },
      update: (ref, ...a) => { pending.push({ op: "tx.update", path: pathOf(ref) }); transaction.update(ref, ...a); return proxy; },
      delete: ref => { pending.push({ op: "tx.delete", path: pathOf(ref) }); transaction.delete(ref); return proxy; }
    };
    return updateFn(proxy);
  }, options).then(res => {
    for (const w of pending) emit({ k: "write", op: w.op, path: w.path, n: 1, chain, caller: chain, tx });
    emit({ k: "txend", tx, chain, ok: true, attempts, reads, writes: pending.length, ms: Date.now() - t0 });
    return res;
  }, err => {
    emit({ k: "txend", tx, chain, ok: false, code: err && err.code, msg: String(err && err.message || (()=>{try{return JSON.stringify(err)}catch(_){return String(err)}})()).slice(0, 240), errName: err && err.constructor && err.constructor.name, errKeys: err && typeof err==="object" ? Object.keys(err).slice(0,8) : null, attempts, reads, writes: 0, ms: Date.now() - t0 });
    throw err;
  });
}
