"use strict";
// Runs one command with the test static server up (tests/support/static-server.cjs on CMS_TEST_PORT, default 4173) and
// CMS_BASE_URL pointing at it, then stops the server. For the audits that expect a server already running (Gate starts one).
//   node tests/support/with-static-server.cjs "node tests/browser/r87-history-scale-audit.cjs"
const {spawn}=require("node:child_process");
const http=require("node:http");
const path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const port=Number(process.env.CMS_TEST_PORT||4173),command=process.argv.slice(2).join(" ");
if(!command){console.error("usage: node tests/support/with-static-server.cjs \"<command>\"");process.exit(2);}
const server=spawn(process.execPath,[path.join(__dirname,"static-server.cjs")],{cwd:ROOT,stdio:"ignore",env:{...process.env,CMS_TEST_PORT:String(port)}});
const up=()=>new Promise(resolve=>{const request=http.get({host:"127.0.0.1",port,path:"/index.html",timeout:1000},response=>{response.resume();resolve(response.statusCode===200);});request.on("error",()=>resolve(false));request.on("timeout",()=>{request.destroy();resolve(false);});});
(async()=>{
  for(let i=0;i<40&&!(await up());i+=1)await new Promise(resolve=>setTimeout(resolve,250));
  if(!(await up())){server.kill();console.error(`static server did not start on ${port}`);process.exit(1);}
  const child=spawn(command,{cwd:ROOT,stdio:"inherit",shell:true,env:{...process.env,CMS_BASE_URL:process.env.CMS_BASE_URL||`http://127.0.0.1:${port}/`}});
  child.on("exit",code=>{server.kill();process.exit(code===null?1:code);});
})();
