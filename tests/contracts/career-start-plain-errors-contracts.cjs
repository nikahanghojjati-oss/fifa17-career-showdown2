"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const careerStart=require("../../js/productionSharedCareerStart.js");

const source=fs.readFileSync(path.join(__dirname,"../../js/productionSharedCareerStart.js"),"utf8");
assert.equal(typeof careerStart.errorText,"function","Career Start must expose the text shown for failed steps");

for(const {step,error,fallback} of [
  {step:"I STARTED AT",error:{code:"CAREER_START_STALE_BASE_REVISION",message:"CAREER_START_STALE_BASE_REVISION"},fallback:"Your Career Start was not recorded."},
  {step:"CONTINUE TO TRANSFER CHALLENGE",error:{code:"permission-denied",message:"permission-denied"},fallback:"The Transfer Challenge could not be opened."},
  {step:"CONTINUE TO TRANSFER CHALLENGE",error:{code:"firestore/permission-denied",message:"Unable to open: firestore/permission-denied"},fallback:"The Transfer Challenge could not be opened."}
]){
  const shown=careerStart.errorText(error,fallback);
  assert.match(shown,/try again/i,`${step} must show a retry hint`);
  assert.doesNotMatch(shown,/\b\w+(?:[-_/]\w+)+\b/,`${step} must not show a raw error code`);
  assert.match(shown,/^[A-Za-z ]+[.](?: [A-Za-z ]+[.])?$/,`${step} must show plain sentences`);
}
assert.match(source,/lastError=pcstErrorText\(error,"Your Career Start was not recorded\."\)/,"the acknowledgement failure must show formatted text");
assert.match(source,/lastError=pcstErrorText\(error,"The Transfer Challenge could not be opened\."\)/,"the continue failure must show formatted text");

console.log("PASS Career Start failures show plain retry hints without raw codes.");
