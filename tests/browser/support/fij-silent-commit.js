// Fault-injection journey, FIJ_FAULT=silentcommit (Phoenix r100, B6's one-off stall in the lead thread): every listener on
// seasonCommits/season_N stays attached and looks healthy, but delivers nothing after its first server copy while
// window.__fijSilentCommits is true: no error, no cached copy, just silence. That is how a late or lost delivery looks to the
// page. It covers the budget layer's own wait listener as well as Season Commit's authority listeners, because the hook sits in
// the served Firestore module itself: the FIJ serves the meter wrapper with its onSnapshot return handed to
// globalThis.__fijWrapListen (defined here). window.__fijSilenced counts the deliveries held back; window.__fijCommitServed
// counts the commit listeners attached now that have delivered a server copy.
(()=>{
  const COMMIT=/\/seasonCommits\/season_\d+$/;
  window.__fijSilenced=0;window.__fijCommitServed=0;
  window.__fijWrapListen=(real,args,target)=>{
    const at=args.findIndex((a,i)=>i>0&&(typeof a==="function"||(a&&typeof a==="object"&&typeof a.next==="function")));
    if(!COMMIT.test(String(target||""))||at<0)return real(...args);
    const out=args.slice(),handler=out[at],next=typeof handler==="function"?handler:handler.next.bind(handler);
    let served=false,open=true;
    const onNext=snapshot=>{
      if(served&&window.__fijSilentCommits===true){window.__fijSilenced+=1;return;}
      if(!served&&open&&!(snapshot&&snapshot.metadata&&snapshot.metadata.fromCache)){served=true;window.__fijCommitServed+=1;}
      return next(snapshot);
    };
    out[at]=typeof handler==="function"?onNext:{...handler,next:onNext};
    const stop=real(...out);
    return ()=>{if(open){open=false;if(served)window.__fijCommitServed-=1;}return stop();};
  };
})();
