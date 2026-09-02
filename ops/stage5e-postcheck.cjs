const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
cp.execFileSync('git',['checkout','HEAD','--','.github/workflows/stage5e-worktree-apply.yml'],{cwd:root,stdio:'inherit'});
const packagePath=path.join(root,'package.json');
const pkg=JSON.parse(fs.readFileSync(packagePath,'utf8'));
delete pkg.scripts.test;
delete pkg.scripts.precheck;
delete pkg.scripts.postcheck;
fs.writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n');
for(const file of ['ops/stage5e-precheck.cjs','ops/stage5e-postcheck.cjs']){
  const target=path.join(root,file);
  if(fs.existsSync(target))fs.unlinkSync(target);
}
console.log('STAGE5E_TEMP_HELPERS_CLEANED');
