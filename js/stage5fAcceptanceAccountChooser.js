(function(root){
  "use strict";

  const FEATURE="stage5f-acceptance-account-chooser";
  const GOOGLE_PROMPT="select_account";

  function stage5fChooserSetText(id,text){
    const element=root.document&&root.document.getElementById(id);
    if(element)element.textContent=text;
  }

  function stage5fChooserSetDisabled(id,value){
    const element=root.document&&root.document.getElementById(id);
    if(element)element.disabled=Boolean(value);
  }

  async function stage5fChooserSignInWithExplicitChooser(event){
    if(event){
      event.preventDefault();
      event.stopPropagation();
      if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();
    }

    const button=root.document&&root.document.getElementById("authorizationSignIn");
    if(button&&button.disabled)return false;
    stage5fChooserSetDisabled("authorizationSignIn",true);
    stage5fChooserSetText("authorizationAcceptanceStatus","Opening Google account chooser…");

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
      stage5fChooserSetText("authorizationAcceptanceAccountState","Authenticated · explicit Google account selection completed");
      stage5fChooserSetText("authorizationAcceptanceStatus","Google account selected. Stage 5F may now use this authenticated identity; this chooser does not create a private account document.");
      return true;
    }catch(error){
      stage5fChooserSetText("authorizationAcceptanceStatus",error&&error.message?error.message:"Google account chooser failed.");
      return false;
    }finally{
      const runtime=root.CareerModeProductionFirebaseRuntime;
      let signedIn=false;
      try{
        const services=runtime&&typeof runtime.ensureAccountServices==="function"?await runtime.ensureAccountServices():null;
        signedIn=Boolean(services&&services.auth&&services.auth.currentUser);
      }catch(_error){}
      stage5fChooserSetDisabled("authorizationSignIn",signedIn);
      stage5fChooserSetDisabled("authorizationSignOut",!signedIn);
    }
  }

  function stage5fChooserMount(){
    if(!root.document)return false;
    const button=root.document.getElementById("authorizationSignIn");
    if(!button)return false;
    button.textContent="SIGN IN WITH GOOGLE · CHOOSE ACCOUNT";
    button.addEventListener("click",event=>{void stage5fChooserSignInWithExplicitChooser(event);},{capture:true});
    return true;
  }

  if(root.document)stage5fChooserMount();

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
    mount:stage5fChooserMount,
    signInWithExplicitChooser:stage5fChooserSignInWithExplicitChooser
  });
})(typeof globalThis!=="undefined"?globalThis:this);
