(function(root){
  "use strict";

  const FEATURE="stage5f-acceptance-account-chooser";
  const GOOGLE_PROMPT="select_account";

  function setText(id,text){
    const element=root.document&&root.document.getElementById(id);
    if(element)element.textContent=text;
  }

  function setDisabled(id,value){
    const element=root.document&&root.document.getElementById(id);
    if(element)element.disabled=Boolean(value);
  }

  async function signInWithExplicitChooser(event){
    if(event){
      event.preventDefault();
      event.stopPropagation();
      if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();
    }

    const button=root.document&&root.document.getElementById("authorizationSignIn");
    if(button&&button.disabled)return false;
    setDisabled("authorizationSignIn",true);
    setText("authorizationAcceptanceStatus","Opening Google account chooser…");

    try{
      const runtime=root.CareerModeProductionFirebaseRuntime;
      if(!runtime||typeof runtime.ensureAccountServices!=="function")throw Object.assign(new Error("Production Firebase account services are unavailable."),{code:"STAGE5F_ACCOUNT_CHOOSER_RUNTIME_UNAVAILABLE"});
      const services=await runtime.ensureAccountServices();
      if(!services||services.ok!==true||!services.auth||!services.authSdk)throw Object.assign(new Error("Production Firebase account services are unavailable."),{code:"STAGE5F_ACCOUNT_CHOOSER_SERVICES_UNAVAILABLE"});

      const authSdk=services.authSdk;
      if(typeof authSdk.setPersistence!=="function"||!authSdk.browserSessionPersistence||typeof authSdk.GoogleAuthProvider!=="function"||typeof authSdk.signInWithPopup!=="function")throw Object.assign(new Error("Required popup-only Google authentication helpers are unavailable."),{code:"STAGE5F_ACCOUNT_CHOOSER_AUTH_UNAVAILABLE"});

      await authSdk.setPersistence(services.auth,authSdk.browserSessionPersistence);
      const provider=new authSdk.GoogleAuthProvider();
      if(typeof provider.setCustomParameters!=="function")throw Object.assign(new Error("Google account chooser parameters are unavailable."),{code:"STAGE5F_ACCOUNT_CHOOSER_PARAMETERS_UNAVAILABLE"});
      provider.setCustomParameters({prompt:GOOGLE_PROMPT});
      await authSdk.signInWithPopup(services.auth,provider);

      if(!services.auth.currentUser)throw Object.assign(new Error("Google sign-in completed without an authenticated identity."),{code:"STAGE5F_ACCOUNT_CHOOSER_NO_USER"});
      setText("authorizationAcceptanceAccountState","Authenticated · explicit Google account selection completed");
      setText("authorizationAcceptanceStatus","Google account selected. Stage 5F may now use this authenticated identity; this chooser does not create a private account document.");
      return true;
    }catch(error){
      setText("authorizationAcceptanceStatus",error&&error.message?error.message:"Google account chooser failed.");
      return false;
    }finally{
      const runtime=root.CareerModeProductionFirebaseRuntime;
      let signedIn=false;
      try{
        const services=runtime&&typeof runtime.ensureAccountServices==="function"?await runtime.ensureAccountServices():null;
        signedIn=Boolean(services&&services.auth&&services.auth.currentUser);
      }catch(_error){}
      setDisabled("authorizationSignIn",signedIn);
      setDisabled("authorizationSignOut",!signedIn);
    }
  }

  function mount(){
    if(!root.document)return false;
    const button=root.document.getElementById("authorizationSignIn");
    if(!button)return false;
    button.textContent="SIGN IN WITH GOOGLE · CHOOSE ACCOUNT";
    button.addEventListener("click",event=>{void signInWithExplicitChooser(event);},{capture:true});
    return true;
  }

  if(root.document)mount();

  root.CareerModeStage5fAcceptanceAccountChooser=Object.freeze({
    contractVersion:1,
    feature:FEATURE,
    googlePrompt:GOOGLE_PROMPT,
    popupOnly:true,
    extraScopesRequested:false,
    accountBootstrapAllowed:false,
    billingRequired:false,
    blazeRequired:false,
    cloudFunctionsRequired:false,
    cloudRunRequired:false,
    mount,
    signInWithExplicitChooser
  });
})(typeof globalThis!=="undefined"?globalThis:this);
